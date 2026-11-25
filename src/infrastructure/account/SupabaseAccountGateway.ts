import * as AppleAuthentication from "expo-apple-authentication";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import type {
  AccountGateway,
  AccountProvider,
  DeleteResult,
  DeletionStatus,
  LinkResponse,
  ProviderSession,
  RefreshResult,
} from "@/domain/account/AccountService";

import {
  classifyDeleteResponse,
  classifyRefreshError,
  classifyStatusResponse,
  parseAuthCallback,
  toLinkResponse,
  toProviderSession,
} from "./accountMapping";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseClient } from "./supabaseClient";

/** Adresse de retour de la connexion web, propre à chaque variante d'application (schéma de `app.config.js`). */
export function authCallbackUrl(): string {
  return Linking.createURL("auth/callback");
}

function isCancel(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "ERR_REQUEST_CANCELED";
}

async function postFunction(name: string, body: unknown, accessToken?: string): Promise<{ status: number | null; body: unknown }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken ?? SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });
    let parsed: unknown = null;
    try {
      parsed = await response.json();
    } catch {
      parsed = null;
    }
    if (!response.ok) console.warn(`Fonction ${name} : réponse ${response.status}.`, parsed);
    return { status: response.status, body: parsed };
  } catch (error) {
    console.warn(`Fonction ${name} injoignable.`, error);
    return { status: null, body: null };
  }
}

/**
 * T1 Compte — passerelle Supabase :
 * Apple natif sur iOS (`expo-apple-authentication`, puis `signInWithIdToken`) ; Apple sur Android et Google partout par
 * page web (`signInWithOAuth`, PKCE, CPT-03 et CPT-12).
 */
export class SupabaseAccountGateway implements AccountGateway {
  async signIn(provider: AccountProvider): Promise<ProviderSession | "cancelled"> {
    if (provider === "apple" && Platform.OS === "ios") return this.signInWithAppleNative();
    return this.signInWithWeb(provider);
  }

  private async signInWithAppleNative(): Promise<ProviderSession | "cancelled"> {
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
    let credential: AppleAuthentication.AppleAuthenticationCredential;
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
        nonce: hashedNonce,
      });
    } catch (error) {
      if (isCancel(error)) return "cancelled";
      throw error;
    }
    if (!credential.identityToken) throw new Error("Apple identity token is missing.");
    const { data, error } = await supabaseClient().auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
      nonce: rawNonce,
    });
    if (error || !data.user) throw error ?? new Error("Apple sign-in failed.");
    const clientId = Constants.expoConfig?.ios?.bundleIdentifier ?? "";
    return toProviderSession(
      data.user,
      "apple",
      { givenName: credential.fullName?.givenName ?? null, familyName: credential.fullName?.familyName ?? null },
      credential.authorizationCode && clientId
        ? { mode: "native", authorizationCode: credential.authorizationCode, clientId }
        : null,
    );
  }

  private async signInWithWeb(provider: AccountProvider): Promise<ProviderSession | "cancelled"> {
    const redirectTo = authCallbackUrl();
    const supabase = supabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) throw error ?? new Error("OAuth URL is missing.");
    // CPT-34 : session privée sur iOS, sans la fenêtre système « … souhaite utiliser … pour se connecter ».
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, { preferEphemeralSession: true });
    if (result.type !== "success") return "cancelled";
    const callback = parseAuthCallback(result.url);
    if ("error" in callback) throw new Error(`OAuth callback error: ${callback.error}`);
    const exchanged = await supabase.auth.exchangeCodeForSession(callback.code);
    if (exchanged.error || !exchanged.data.user) throw exchanged.error ?? new Error("Code exchange failed.");
    const providerRefreshToken = exchanged.data.session?.provider_refresh_token ?? null;
    return toProviderSession(
      exchanged.data.user,
      provider,
      { givenName: null, familyName: null },
      provider === "apple" && providerRefreshToken ? { mode: "web", providerRefreshToken } : null,
    );
  }

  async signOutLocal(): Promise<void> {
    await supabaseClient().auth.signOut({ scope: "local" });
  }

  async linkAccount(localUserId: string, givenName: string | null, familyName: string | null): Promise<LinkResponse> {
    const { data, error } = await supabaseClient().rpc("link_account", {
      p_local_user_id: localUserId,
      p_given_name: givenName,
      p_family_name: familyName,
    });
    if (error) throw error;
    return toLinkResponse(data as Record<string, unknown>);
  }

  async storeAppleToken(token: NonNullable<ProviderSession["appleToken"]>): Promise<void> {
    const accessToken = await this.accessToken();
    const response = await postFunction("apple-token", token, accessToken ?? undefined);
    if (response.status !== 200) throw new Error(`apple-token failed: ${response.status}`);
  }

  async deleteAccount(receipt: string): Promise<DeleteResult> {
    const accessToken = await this.accessToken();
    if (!accessToken) return "not_authenticated";
    const response = await postFunction("delete-account", { receipt }, accessToken);
    return classifyDeleteResponse(response.status, response.body);
  }

  async deletionStatus(input: { authUserId: string; receipt?: string; localUserId?: string }): Promise<DeletionStatus> {
    const response = await postFunction("deletion-status", input);
    return classifyStatusResponse(response.status, response.body);
  }

  async refreshSession(): Promise<RefreshResult> {
    const { data, error } = await supabaseClient().auth.refreshSession();
    return classifyRefreshError(error as { name?: string; status?: number } | null, Boolean(data.session));
  }

  private async accessToken(): Promise<string | null> {
    const { data } = await supabaseClient().auth.getSession();
    return data.session?.access_token ?? null;
  }
}
