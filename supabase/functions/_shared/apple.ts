/**
 * KODJO — T1 Compte : fonctions Apple (Sign in with Apple), sans dépendance externe (WebCrypto).
 * Exécutable par Deno (fonctions serveur) et par Jest.
 *
 * - `createAppleClientSecret` : JWT ES256 signé avec la clé `.p8` (secret client d'Apple).
 * - `exchangeAuthorizationCode` / `revokeRefreshToken` : points d'accès `/auth/token` et `/auth/revoke` (Apple TN3194).
 * - `verifyAppleNotification` : vérification du JWS des notifications serveur à serveur.
 * - `encryptToken` / `decryptToken` : chiffrement AES-GCM du jeton stocké.
 */

export const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";
const APPLE_REVOKE_URL = "https://appleid.apple.com/auth/revoke";
export const APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";

type FetchLike = (input: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

const encoder = new TextEncoder();

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function binaryToBytes(binary: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return binaryToBytes(atob(padded));
}

function base64Decode(value: string): Uint8Array<ArrayBuffer> {
  return binaryToBytes(atob(value));
}

function pemBody(pem: string): Uint8Array<ArrayBuffer> {
  return base64Decode(pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, ""));
}

export type AppleKeyConfig = { teamId: string; keyId: string; privateKeyPem: string };

/** Secret client Apple : JWT ES256, `sub` = identifiant client (bundle iOS ou Services ID), validité courte. */
export async function createAppleClientSecret(
  config: AppleKeyConfig,
  clientId: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  ttlSeconds = 300,
): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    "pkcs8",
    pemBody(config.privateKeyPem),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: "ES256", kid: config.keyId })));
  const payload = base64UrlEncode(
    encoder.encode(
      JSON.stringify({ iss: config.teamId, iat: nowSeconds, exp: nowSeconds + ttlSeconds, aud: APPLE_ISSUER, sub: clientId }),
    ),
  );
  const signature = await globalThis.crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encoder.encode(`${header}.${payload}`),
  );
  return `${header}.${payload}.${base64UrlEncode(new Uint8Array(signature))}`;
}

function form(values: Record<string, string>): string {
  return Object.entries(values)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

/** Échange le code d'autorisation (valide 5 minutes, usage unique) contre un jeton de rafraîchissement révocable. */
export async function exchangeAuthorizationCode(
  fetchFn: FetchLike,
  clientId: string,
  clientSecret: string,
  code: string,
): Promise<string> {
  const response = await fetchFn(APPLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form({ client_id: clientId, client_secret: clientSecret, code, grant_type: "authorization_code" }),
  });
  const body = (await response.json()) as { refresh_token?: unknown };
  if (!response.ok || typeof body.refresh_token !== "string" || body.refresh_token.length === 0) {
    throw new Error(`apple_token_exchange_failed:${response.status}`);
  }
  return body.refresh_token;
}

/** Révoque un jeton de rafraîchissement. Apple répond 200 si le jeton est révoqué ou déjà invalide. */
export async function revokeRefreshToken(
  fetchFn: FetchLike,
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<void> {
  const response = await fetchFn(APPLE_REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form({ client_id: clientId, client_secret: clientSecret, token: refreshToken, token_type_hint: "refresh_token" }),
  });
  if (!response.ok) throw new Error(`apple_revoke_failed:${response.status}`);
}

export type AppleNotification = {
  iss: string;
  jti: string;
  aud: string;
  type: "email-disabled" | "email-enabled" | "consent-revoked" | "account-delete" | string;
  sub: string;
};

type Jwk = { kid: string; kty: string; n: string; e: string; alg?: string };

/**
 * Vérifie le JWS d'une notification Apple : signature RS256 (clés publiques d'Apple), `iss`, `aud`.
 * `events` est une chaîne JSON contenant `type` et `sub`. Retourne `null` si invalide.
 */
export async function verifyAppleNotification(
  jws: string,
  keys: Jwk[],
  allowedAudiences: string[],
): Promise<AppleNotification | null> {
  const parts = jws.split(".");
  if (parts.length !== 3) return null;
  let header: { kid?: string; alg?: string };
  let claims: { iss?: string; aud?: string; jti?: string; events?: unknown };
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0])));
    claims = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
  } catch {
    return null;
  }
  if (header.alg !== "RS256") return null;
  const jwk = keys.find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) return null;
  const key = await globalThis.crypto.subtle.importKey(
    "jwk",
    { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await globalThis.crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    base64UrlDecode(parts[2]),
    encoder.encode(`${parts[0]}.${parts[1]}`),
  );
  if (!valid) return null;
  if (claims.iss !== APPLE_ISSUER) return null;
  if (typeof claims.aud !== "string" || !allowedAudiences.includes(claims.aud)) return null;
  if (typeof claims.jti !== "string" || claims.jti.length === 0) return null;
  let events: { type?: unknown; sub?: unknown };
  try {
    events = typeof claims.events === "string" ? JSON.parse(claims.events) : (claims.events as typeof events);
  } catch {
    return null;
  }
  if (!events || typeof events.type !== "string" || typeof events.sub !== "string") return null;
  return { iss: claims.iss, jti: claims.jti, aud: claims.aud, type: events.type, sub: events.sub };
}

async function aesKey(base64Key: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey("raw", base64Decode(base64Key), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

/** Chiffre le jeton Apple (AES-GCM 256, clé fournie par un secret serveur). Format : `v1.<iv>.<chiffré>`. */
export async function encryptToken(plain: string, base64Key: string): Promise<string> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const cipher = await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(base64Key), encoder.encode(plain));
  return `v1.${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(cipher))}`;
}

export async function decryptToken(ciphertext: string, base64Key: string): Promise<string> {
  const [version, iv, data] = ciphertext.split(".");
  if (version !== "v1" || !iv || !data) throw new Error("invalid_ciphertext");
  const plain = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlDecode(iv) },
    await aesKey(base64Key),
    base64UrlDecode(data),
  );
  return new TextDecoder().decode(plain);
}
