// KODJO — T1 : suppression du compte (plan T1, « Suppression »). Appelant authentifié ; identité tirée de son jeton.
import { runDeletion } from "../_shared/deletion.ts";
import { adminClient, callerId, deletionPorts, json } from "../_deno/server.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") return json(405, { error: "method_not_allowed" });
  const admin = adminClient();
  const authUserId = await callerId(admin, request);
  if (!authUserId) return json(401, { error: "not_authenticated" });
  let receipt: string | null = null;
  try {
    const body = await request.json();
    receipt = typeof body?.receipt === "string" && body.receipt.length >= 16 ? body.receipt : null;
  } catch {
    // corps vide : pas de reçu
  }
  if (!receipt) return json(400, { error: "receipt_required" });
  const outcome = await runDeletion(authUserId, receipt, deletionPorts(admin));
  return outcome.result === "deleted" ? json(200, { status: "deleted" }) : json(503, { status: "retryable_error", reason: outcome.reason });
});
