import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { strings } from "@/shared/i18n";

/**
 * Message temporaire (snackbar `TransientNotification`) déposé par une feuille qui se ferme, affiché par l'écran qui reprend le
 * focus (même patron que `planningSheetRelay` : rien n'est persisté). Recette du 23/11/2026 (d3 — Hermann : « il faut un message
 * snackbar après confirmation pour informer du nombre de créneaux supprimés ») : la feuille « Planifier » se ferme dès
 * l'enregistrement ; le Journal (et tout écran qui lit ce relais au focus) affiche le message.
 *
 * Un message non lu dans `MAX_AGE_MS` est abandonné : il ne doit pas surgir plus tard sur un autre écran. [Durée : choix
 * technique.]
 */
const MAX_AGE_MS = 5000;

let pending: { readonly message: string; readonly at: number } | null = null;

export function postPlanningNotice(message: string, now: number = Date.now()): void {
  pending = { message, at: now };
}

/** Message en attente (lu une seule fois), ou `null`. */
export function takePlanningNotice(now: number = Date.now()): string | null {
  const current = pending;
  pending = null;
  return current !== null && now - current.at <= MAX_AGE_MS ? current.message : null;
}

/** D-566 « Supprimer » : « 1 créneau supprimé » / « N créneaux supprimés ». */
export function removedSlotsNotice(count: number): string {
  const t = strings.planning.removedSlots;
  return count === 1 ? t.one : fillTemplate(t.many, { count: String(count) });
}
