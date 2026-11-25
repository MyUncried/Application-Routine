// KODJO — T1 : enregistrement du jeton Apple révocable (Apple TN3194).
// iOS natif : échange immédiat du code d'autorisation (5 minutes, usage unique).
// Android (connexion web) : jeton `provider_refresh_token` rendu par Supabase Auth (Services ID).
import { createAppleClientSecret, encryptToken, exchangeAuthorizationCode } from "../_shared/apple.ts";
import { adminClient, appleClientIds, appleKeyConfig, callerId, env, json } from "../_deno/server.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") return json(405, { error: "method_not_allowed" });
  const admin = adminClient();
  const authUserId = await callerId(admin, request);
  if (!authUserId) return json(401, { error: "not_authenticated" });
  let body: { mode?: unknown; authorizationCode?: unknown; clientId?: unknown; providerRefreshToken?: unknown };
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "invalid_body" });
  }
  const clients = appleClientIds();
  let clientId: string;
  let refreshToken: string;
  try {
    if (body.mode === "native" && typeof body.authorizationCode === "string" && typeof body.clientId === "string") {
      if (!clients.native.includes(body.clientId)) return json(400, { error: "unknown_client" });
      clientId = body.clientId;
      const secret = await createAppleClientSecret(appleKeyConfig(), clientId);
      refreshToken = await exchangeAuthorizationCode(fetch, clientId, secret, body.authorizationCode);
    } else if (body.mode === "web" && typeof body.providerRefreshToken === "string" && body.providerRefreshToken.length > 0) {
      clientId = clients.services;
      refreshToken = body.providerRefreshToken;
    } else {
      return json(400, { error: "invalid_body" });
    }
  } catch {
    return json(502, { error: "apple_exchange_failed" });
  }
  const ciphertext = await encryptToken(refreshToken, env("KODJO_TOKEN_KEY"));
  const { error } = await admin.rpc("store_apple_token", { p_auth_user_id: authUserId, p_client_id: clientId, p_ciphertext: ciphertext });
  if (error) return json(409, { error: "store_failed" });
  return json(200, { status: "stored" });
});
