/**
 * Relais des feuilles natives de la planification (même patron que `filterSheetRelay`) : le formulaire dépose la
 * demande, la route `formSheet` la lit, puis rend la valeur validée par le rappel. Rien n'est persisté ici.
 * « Catalogue des séances » ouvert par « Changer » est une feuille posée sur « Planifier » (recette du 17/11/2026, f/g).
 * [Feuille « Fréquence » (CE-UI-11) — retirée le 18/11/2026 (D-523) : la fréquence se règle dans la grille (D-519).]
 */
export type PlanningSheetRequest =
  | { readonly kind: "selection"; readonly initial: readonly string[]; readonly onValidate: (selected: readonly string[]) => void }
  /** D-539 (mis à jour le 20/11/2026) : modale « Filtrer par routine » de l'Agenda, toujours ouverte sans routine cochée. */
  | { readonly kind: "routineFilter"; readonly onValidate: (selected: readonly string[]) => void }
  /**
   * D-545 (23/11/2026) : modale « Rattacher un programme » ouverte par la ligne Programme — `selectedId` : programme actuel
   * (`null` : Aucun) ; `onChoose` reçoit le programme touché, ou `null` quand la carte déjà sélectionnée est touchée.
   */
  | { readonly kind: "program"; readonly selectedId: string | null; readonly onChoose: (programId: string | null) => void };

let pending: PlanningSheetRequest | null = null;

export function requestPlanningSheet(request: PlanningSheetRequest): void {
  pending = request;
}

export function pendingPlanningSheet<K extends PlanningSheetRequest["kind"]>(kind: K): Extract<PlanningSheetRequest, { kind: K }> | null {
  return pending !== null && pending.kind === kind ? (pending as Extract<PlanningSheetRequest, { kind: K }>) : null;
}

export function releasePlanningSheet(): void {
  pending = null;
}
