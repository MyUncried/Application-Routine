// KODJO — T1 : état d'une suppression, sans session, sur preuve (reçu ou identifiant local). Réponse `unknown` sans fuite.
import { deletionStatus } from "../_shared/deletion.ts";
import { adminClient, deletionStatusPorts, json } from "../_deno/server.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  if (request.method !== "POST") return json(405, { error: "method_not_allowed" });
  let body: { authUserId?: unknown; receipt?: unknown; localUserId?: unknown };
  try {
    body = await request.json();
  } catch {
    return json(200, { status: "unknown" });
  }
  const authUserId = typeof body.authUserId === "string" && UUID.test(body.authUserId) ? body.authUserId : null;
  const receipt = typeof body.receipt === "string" && body.receipt.length >= 16 ? body.receipt : undefined;
  const localUserId = typeof body.localUserId === "string" && body.localUserId.length >= 8 ? body.localUserId : undefined;
  if (!authUserId || (!receipt && !localUserId)) return json(200, { status: "unknown" });
  try {
    const status = await deletionStatus(authUserId, { receipt, localUserId }, deletionStatusPorts(adminClient()));
    return status === "indeterminate" ? json(503, { status }) : json(200, { status });
  } catch {
    return json(503, { status: "indeterminate" });
  }
});
