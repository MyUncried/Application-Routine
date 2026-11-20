/**
 * Relais des feuilles natives de la planification (même patron que `filterSheetRelay`) : le formulaire dépose la
 * demande, la route `formSheet` la lit, puis rend la valeur validée par le rappel. Rien n'est persisté ici.
 * « Catalogue des séances » ouvert par « Changer » est une feuille posée sur « Planifier » (recette du 17/11/2026, f/g).
 * [Feuille « Fréquence » (CE-UI-11) — retirée le 18/11/2026 (D-523) : la fréquence se règle dans la grille (D-519).]
 */
export type PlanningSheetRequest =
  | { readonly kind: "selection"; readonly initial: readonly string[]; readonly onValidate: (selected: readonly string[]) => void }
  /** D-539 : modale « Filtrer par routine » de l'Agenda ; liste vide validée = filtre retiré. */
  | { readonly kind: "routineFilter"; readonly initial: readonly string[]; readonly onValidate: (selected: readonly string[]) => void };

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
