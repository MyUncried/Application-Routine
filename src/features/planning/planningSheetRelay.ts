import type { ContentFrequency } from "@/domain/planning/Routine";

/**
 * Relais des feuilles natives de la planification (même patron que `filterSheetRelay`) : le formulaire dépose la
 * demande, la route `formSheet` la lit, puis rend la valeur validée par le rappel. Rien n'est persisté ici.
 */
export type PlanningSheetRequest =
  | { readonly kind: "frequency"; readonly name: string; readonly frequency: ContentFrequency; readonly onValidate: (frequency: ContentFrequency) => void }
  | { readonly kind: "reminder"; readonly minutes: number; readonly onValidate: (minutes: number) => void };

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
