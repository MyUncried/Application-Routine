/**
 * Message temporaire déposé par la modification d'une routine et affiché par l'écran de retour (recette du 22/11/2026,
 * constat d). Même patron que `planningSheetRelay` : rien n'est persisté ; le message est lu une seule fois.
 */
let pending: string | null = null;

export function announcePlanningNotice(message: string): void {
  pending = message;
}

/** Message en attente, retiré dès qu'il est lu. */
export function takePlanningNotice(): string | null {
  const message = pending;
  pending = null;
  return message;
}
