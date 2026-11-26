/**
 * KODJO — T1 Compte : traitement idempotent des notifications Apple (plan T1, F3).
 *
 * 1. `begin` (transaction SQL `apple_event_begin`) : insertion de (iss, jti), verrouillage, résolution du compte,
 *    effets en base, passage à `done` si aucune suite n'est nécessaire.
 * 2. Suites hors base, idempotentes : fermeture des sessions (`consent-revoked`), purge (`account-delete`).
 * 3. `done` seulement après réussite de la suite. Tant que l'action n'est pas achevée : 5xx (nouvelle livraison).
 */

export type BeginResult = {
  status: "done" | "received";
  authUserId: string | null;
  followup: "none" | "sign_out" | "purge";
  first: boolean;
};

export interface AppleEventPorts {
  begin(iss: string, jti: string, sub: string, type: string): Promise<BeginResult>;
  signOut(authUserId: string): Promise<void>;
  /** Purge par la procédure de `delete-account` (révocation `not_required`) ; vrai si la suppression est achevée. */
  purge(authUserId: string): Promise<boolean>;
  done(iss: string, jti: string): Promise<void>;
}

export type EventOutcome = { httpStatus: 200 | 500; state: "done" | "pending" };

export async function processAppleEvent(
  event: { iss: string; jti: string; sub: string; type: string },
  ports: AppleEventPorts,
): Promise<EventOutcome> {
  let begun: BeginResult;
  try {
    begun = await ports.begin(event.iss, event.jti, event.sub, event.type);
  } catch {
    return { httpStatus: 500, state: "pending" };
  }
  if (begun.status === "done") return { httpStatus: 200, state: "done" };
  if (!begun.authUserId) {
    await ports.done(event.iss, event.jti);
    return { httpStatus: 200, state: "done" };
  }
  try {
    if (begun.followup === "sign_out") {
      await ports.signOut(begun.authUserId);
    } else if (begun.followup === "purge") {
      const finished = await ports.purge(begun.authUserId);
      if (!finished) return { httpStatus: 500, state: "pending" };
    }
    await ports.done(event.iss, event.jti);
    return { httpStatus: 200, state: "done" };
  } catch {
    return { httpStatus: 500, state: "pending" };
  }
}
