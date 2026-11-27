// KODJO — T1 Compte : adaptateurs Deno communs aux fonctions serveur (exclus de `tsc` et de Jest : environnement Deno).
// La logique métier est dans `../_shared/*.ts`, testée par Jest.
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

import {
  createAppleClientSecret,
  decryptToken,
  revokeRefreshToken,
  type AppleKeyConfig,
} from "../_shared/apple.ts";
import { AuthUnavailableError, type DeletionPorts, type DeletionStatusPorts } from "../_shared/deletion.ts";

export function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`missing_env:${name}`);
  return value;
}

export function adminClient(): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function appleKeyConfig(): AppleKeyConfig {
  return { teamId: env("APPLE_TEAM_ID"), keyId: env("APPLE_KEY_ID"), privateKeyPem: env("APPLE_PRIVATE_KEY") };
}

/** Identifiants clients autorisés : bundles iOS (connexion native) et Services ID (connexion web). */
export function appleClientIds(): { native: string[]; services: string } {
  return { native: env("APPLE_NATIVE_CLIENT_IDS").split(",").map((id) => id.trim()).filter(Boolean), services: env("APPLE_SERVICES_ID") };
}

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** Identité de l'appelant, déterminée par son jeton ; jamais par un paramètre. */
export async function callerId(admin: SupabaseClient, request: Request): Promise<string | null> {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

async function authUserExists(admin: SupabaseClient, authUserId: string): Promise<boolean> {
  const { data, error } = await admin.auth.admin.getUserById(authUserId);
  if (error) {
    if ((error as { status?: number }).status === 404) return false;
    throw new AuthUnavailableError(error.message);
  }
  return Boolean(data.user);
}

async function markAuthDeleted(admin: SupabaseClient, authUserId: string): Promise<void> {
  const { error } = await admin.from("account_deletions").update({ auth_deleted_at: new Date().toISOString() })
    .eq("auth_user_id", authUserId).is("auth_deleted_at", null);
  if (error) throw error;
}

type RecordRow = {
  auth_user_id: string;
  receipt_hash: string | null;
  local_user_hashes: string[];
  apple_revocation: "done" | "not_required" | "not_applicable" | null;
  data_purged_at: string | null;
  auth_deleted_at: string | null;
};

function toRecord(row: RecordRow) {
  return {
    authUserId: row.auth_user_id,
    receiptHash: row.receipt_hash,
    localUserHashes: row.local_user_hashes ?? [],
    appleRevocation: row.apple_revocation,
    dataPurgedAt: row.data_purged_at,
    authDeletedAt: row.auth_deleted_at,
  };
}

async function loadRecord(admin: SupabaseClient, authUserId: string) {
  const { data, error } = await admin.from("account_deletions").select("*").eq("auth_user_id", authUserId).maybeSingle();
  if (error) throw error;
  return data ? toRecord(data as RecordRow) : null;
}

export function deletionPorts(admin: SupabaseClient): DeletionPorts {
  return {
    async beginRecord(authUserId, receiptHash, localUserHashes) {
      const { data, error } = await admin.rpc("deletion_begin", {
        p_auth_user_id: authUserId,
        p_receipt_hash: receiptHash,
        p_local_user_hashes: localUserHashes,
      });
      if (error) throw error;
      return toRecord(data as RecordRow);
    },
    loadRecord: (authUserId) => loadRecord(admin, authUserId),
    async loadAccount(authUserId) {
      const { data, error } = await admin.from("accounts").select("provider, apple_tokens_invalidated_at")
        .eq("auth_user_id", authUserId).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      // CPT-35 : identités rattachées par Supabase (même e-mail) ; une identité Apple impose la révocation.
      const { data: auth, error: authError } = await admin.auth.admin.getUserById(authUserId);
      if (authError && (authError as { status?: number }).status !== 404) throw authError;
      const hasAppleIdentity = data.provider === "apple" || (auth?.user?.identities ?? []).some((identity) => identity.provider === "apple");
      return { provider: data.provider, appleTokensInvalidatedAt: data.apple_tokens_invalidated_at, hasAppleIdentity };
    },
    async listLocalUserIds(authUserId) {
      const { data, error } = await admin.from("account_local_users").select("local_user_id").eq("auth_user_id", authUserId);
      if (error) throw error;
      return (data ?? []).map((row: { local_user_id: string }) => row.local_user_id);
    },
    async loadAppleToken(authUserId) {
      const { data, error } = await admin.from("apple_tokens").select("client_id, refresh_token_ciphertext")
        .eq("auth_user_id", authUserId).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { clientId: data.client_id, refreshToken: await decryptToken(data.refresh_token_ciphertext, env("KODJO_TOKEN_KEY")) };
    },
    async revokeAppleToken(token) {
      const secret = await createAppleClientSecret(appleKeyConfig(), token.clientId);
      await revokeRefreshToken(fetch, token.clientId, secret, token.refreshToken);
    },
    async setAppleRevocation(authUserId, value) {
      const { error } = await admin.from("account_deletions").update({ apple_revocation: value }).eq("auth_user_id", authUserId);
      if (error) throw error;
    },
    async deleteStorageObjects(authUserId) {
      // Convention : objets d'un compte rangés sous le préfixe `<auth_user_id>/`. Aucun en T1.
      const { data: buckets, error } = await admin.storage.listBuckets();
      if (error) throw error;
      for (const bucket of buckets ?? []) {
        const { data: objects, error: listError } = await admin.storage.from(bucket.name).list(authUserId, { limit: 1000 });
        if (listError) throw listError;
        if (objects && objects.length > 0) {
          const { error: removeError } = await admin.storage.from(bucket.name).remove(objects.map((object) => `${authUserId}/${object.name}`));
          if (removeError) throw removeError;
        }
      }
    },
    async purgeAccountData(authUserId) {
      const { error } = await admin.rpc("deletion_purge_data", { p_auth_user_id: authUserId });
      if (error) throw error;
    },
    authUserExists: (authUserId) => authUserExists(admin, authUserId),
    async deleteAuthUser(authUserId) {
      const { error } = await admin.auth.admin.deleteUser(authUserId);
      if (error) throw error;
    },
    markAuthDeleted: (authUserId) => markAuthDeleted(admin, authUserId),
    logError: (reason, error) => console.error(`delete-account: ${reason}`, error),
  };
}

export function deletionStatusPorts(admin: SupabaseClient): DeletionStatusPorts {
  return {
    loadRecord: (authUserId) => loadRecord(admin, authUserId),
    async accountHasLocalUser(authUserId, localUserId) {
      const { data, error } = await admin.from("account_local_users").select("local_user_id")
        .eq("auth_user_id", authUserId).eq("local_user_id", localUserId).maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
    authUserExists: (authUserId) => authUserExists(admin, authUserId),
    markAuthDeleted: (authUserId) => markAuthDeleted(admin, authUserId),
  };
}
