import type { AccountProvider, DeleteResult, DeletionStatus, LinkResponse, ProviderSession, RefreshResult } from "@/domain/account/AccountService";

/**
 * T1 Compte — conversions pures entre Supabase et le domaine (testées sans réseau).
 */

type IdentityLike = { provider: string; id?: string; identity_data?: Record<string, unknown> | null };
type UserLike = {
  id: string;
  email?: string | null;
  identities?: IdentityLike[] | null;
  user_metadata?: Record<string, unknown> | null;
};

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/**
 * Session du fournisseur à partir de l'utilisateur Supabase. Le nom fourni par Apple (première autorisation) prime ;
 * sinon les métadonnées du fournisseur. Aucune valeur n'est inventée : absent reste `null`.
 */
export function toProviderSession(
  user: UserLike,
  provider: AccountProvider,
  names: { givenName: string | null; familyName: string | null },
  appleToken: ProviderSession["appleToken"],
): ProviderSession {
  const identity = (user.identities ?? []).find((candidate) => candidate.provider === provider);
  const subject = text(identity?.id) ?? text(identity?.identity_data?.sub) ?? text(user.user_metadata?.sub);
  if (!subject) throw new Error("Provider subject is missing.");
  const metadata = user.user_metadata ?? {};
  const givenName = names.givenName ?? text(metadata.given_name) ?? (names.familyName ? null : text(metadata.full_name) ?? text(metadata.name));
  const familyName = names.familyName ?? text(metadata.family_name);
  return { authUserId: user.id, provider, providerSubject: subject, email: text(user.email), givenName, familyName, appleToken };
}

export function toLinkResponse(row: Record<string, unknown>): LinkResponse {
  const provider = row.provider === "apple" || row.provider === "google" ? row.provider : null;
  if (typeof row.auth_user_id !== "string" || !provider || typeof row.provider_subject !== "string") {
    throw new Error("Unexpected link_account response.");
  }
  return {
    authUserId: row.auth_user_id,
    provider,
    providerSubject: row.provider_subject,
    email: text(row.email),
    emailIsPrivateRelay: row.email_is_private_relay === true,
    givenName: text(row.given_name),
    familyName: text(row.family_name),
    catalogueId: text(row.catalogue_id),
  };
}

/** Retour de la connexion web (PKCE) : `?code=…` ou `?error=…` (également dans le fragment). */
export function parseAuthCallback(url: string): { code: string } | { error: string } {
  const query = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
  const fragment = url.includes("#") ? url.slice(url.indexOf("#") + 1) : "";
  const params = new URLSearchParams([query.split("#")[0], fragment].filter(Boolean).join("&"));
  const code = params.get("code");
  if (code) return { code };
  return { error: params.get("error_description") ?? params.get("error") ?? "missing_code" };
}

type ErrorLike = { name?: string; status?: number } | null | undefined;

/**
 * Rafraîchissement de session : erreur réseau ou 5xx → transitoire ; refus du serveur (4xx) → refusé.
 * La conclusion « compte supprimé » ou « session révoquée » ne vient jamais d'ici (cas c : `deletion-status`).
 */
export function classifyRefreshError(error: ErrorLike, hasSession: boolean): RefreshResult {
  if (!error) return hasSession ? "ok" : "refused";
  if (error.name === "AuthRetryableFetchError") return "transient";
  if (typeof error.status === "number" && error.status >= 500) return "transient";
  if (typeof error.status === "number" && error.status >= 400) return "refused";
  return error.name === "AuthSessionMissingError" ? "refused" : "transient";
}

export function classifyDeleteResponse(status: number | null, body: unknown): DeleteResult {
  if (status === null) return "network";
  if (status === 200 && (body as { status?: unknown } | null)?.status === "deleted") return "deleted";
  if (status === 401) return "not_authenticated";
  return "retryable_error";
}

const STATUSES: readonly DeletionStatus[] = ["deleted", "in_progress", "active", "unknown", "indeterminate"];

export function classifyStatusResponse(status: number | null, body: unknown): DeletionStatus {
  if (status === null) return "network";
  if (status === 503) return "indeterminate";
  const value = (body as { status?: unknown } | null)?.status;
  return STATUSES.includes(value as DeletionStatus) ? (value as DeletionStatus) : "unknown";
}
