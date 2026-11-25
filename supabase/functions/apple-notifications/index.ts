// KODJO — T1 : notifications serveur à serveur d'Apple (plan T1, F3).
// POST {"payload": "<JWS>"} par Apple ; POST {"sweep": true} par la planification (clé de service exigée).
import { APPLE_KEYS_URL, verifyAppleNotification } from "../_shared/apple.ts";
import { processAppleEvent, type AppleEventPorts } from "../_shared/appleEvents.ts";
import { runDeletion } from "../_shared/deletion.ts";
import { adminClient, appleClientIds, deletionPorts, env, json } from "../_deno/server.ts";

function ports(admin: ReturnType<typeof adminClient>): AppleEventPorts {
  return {
    async begin(iss, jti, sub, type) {
      const { data, error } = await admin.rpc("apple_event_begin", { p_iss: iss, p_jti: jti, p_sub: sub, p_type: type });
      if (error) throw error;
      const row = (data as { status: "done" | "received"; auth_user_id: string | null; followup: "none" | "sign_out" | "purge"; first: boolean }[])[0];
      return { status: row.status, authUserId: row.auth_user_id, followup: row.followup, first: row.first };
    },
    async signOut(authUserId) {
      const { error } = await admin.rpc("revoke_user_sessions", { p_auth_user_id: authUserId });
      if (error) throw error;
    },
    async purge(authUserId) {
      // `apple_event_begin` a inscrit `apple_revocation = not_required` : aucun appel de révocation.
      const outcome = await runDeletion(authUserId, null, deletionPorts(admin));
      return outcome.result === "deleted";
    },
    async done(iss, jti) {
      const { error } = await admin.rpc("apple_event_done", { p_iss: iss, p_jti: jti });
      if (error) throw error;
    },
  };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json(405, { error: "method_not_allowed" });
  const admin = adminClient();
  let body: { payload?: unknown; sweep?: unknown };
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "invalid_body" });
  }

  if (body.sweep === true) {
    if (request.headers.get("Authorization") !== `Bearer ${env("SUPABASE_SERVICE_ROLE_KEY")}`) return json(401, { error: "forbidden" });
    const limit = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data, error } = await admin.from("apple_notification_events").select("iss, jti, sub, type")
      .eq("status", "received").lt("received_at", limit).limit(100);
    if (error) return json(500, { error: "sweep_failed" });
    let pending = 0;
    for (const event of data ?? []) {
      const outcome = await processAppleEvent(event, ports(admin));
      if (outcome.state === "pending") pending += 1;
    }
    return json(200, { processed: (data ?? []).length, pending });
  }

  if (typeof body.payload !== "string") return json(400, { error: "invalid_body" });
  const keysResponse = await fetch(APPLE_KEYS_URL);
  if (!keysResponse.ok) return json(503, { error: "apple_keys_unavailable" });
  const { keys } = await keysResponse.json();
  const clients = appleClientIds();
  const event = await verifyAppleNotification(body.payload, keys, [...clients.native, clients.services]);
  if (!event) return json(400, { error: "invalid_notification" });
  const outcome = await processAppleEvent(event, ports(admin));
  return json(outcome.httpStatus, { state: outcome.state });
});
