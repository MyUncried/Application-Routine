/**
 * PRE-10.2 — résultats d'une Exécution Libre (ch09 « Résultat d'Exercice exécuté », « Entité Exécution » ;
 * conception §15.3). Les résultats représentent ce qui est chronométré ou acquis ; ils ne sont jamais
 * reconstruits depuis l'affichage ou le nombre de sons joués. Fonctions pures.
 *
 * - Un **Résultat d'Exercice exécuté** par occurrence atteinte (Exercice × passage de Circuit × répétition
 *   de Cycle) : `Partielle` si une de ses Séries a été passée avant son terme ou interrompue, sinon
 *   `Terminée` ; durée réelle = temps actif cumulé de ses Séries (tentatives réinitialisées comprises) ;
 *   Pause entre les côtés et Récupération : prévues et écoulées, distinctes. Une occurrence jamais atteinte
 *   ne produit aucun résultat.
 * - **Statut de l'Exécution** : `Interrompue` après Arrêter la séance ; sinon `Partielle` si un Exercice est
 *   `Partielle` (« elle sera enregistrée comme partiellement exécutée », CE Passage à l'Exercice suivant),
 *   sinon `Terminée`.
 */

import type { FinishReason, Ms, StepResult } from "./kernel";

export type BusinessStatus = "COMPLETED" | "PARTIAL" | "INTERRUPTED";

export type OccurrenceResult = {
  readonly occurrenceKey: string;
  readonly exerciseId: string;
  readonly status: "COMPLETED" | "PARTIAL";
  readonly activeMs: Ms;
  readonly series: readonly StepResult[];
  readonly sideRecovery: { readonly plannedMs: Ms; readonly elapsedMs: Ms } | null;
  readonly recovery: { readonly plannedMs: Ms; readonly elapsedMs: Ms } | null;
  readonly context: StepResult["context"];
};

export function occurrenceResults(steps: readonly StepResult[]): readonly OccurrenceResult[] {
  const groups = new Map<string, StepResult[]>();
  for (const step of steps) {
    if (step.occurrenceKey === null) continue;
    const group = groups.get(step.occurrenceKey) ?? [];
    group.push(step);
    groups.set(step.occurrenceKey, group);
  }
  const results: OccurrenceResult[] = [];
  for (const [occurrenceKey, group] of groups) {
    const series = group.filter((step) => step.leafKind === "ACTIVITY");
    if (series.length === 0) continue;
    const sum = (kind: StepResult["leafKind"]) => {
      const phases = group.filter((step) => step.leafKind === kind);
      return phases.length === 0
        ? null
        : { plannedMs: phases.reduce((total, step) => total + (step.plannedMs ?? 0), 0), elapsedMs: phases.reduce((total, step) => total + step.cumulativeActiveMs, 0) };
    };
    results.push({
      occurrenceKey,
      exerciseId: series[0]!.exerciseId!,
      status: series.some((step) => step.completion === "PARTIAL" || step.completion === "INTERRUPTED" || step.completion === "CLOSED_BY_PARENT") ? "PARTIAL" : "COMPLETED",
      activeMs: series.reduce((total, step) => total + step.cumulativeActiveMs, 0),
      series,
      sideRecovery: sum("SIDE_RECOVERY"),
      recovery: sum("POST_ACTIVITY_RECOVERY"),
      context: series[0]!.context,
    });
  }
  return results.sort((a, b) => Math.min(...a.series.map((step) => step.endedAtMs)) - Math.min(...b.series.map((step) => step.endedAtMs)));
}

export function businessStatusOf(finish: FinishReason, occurrences: readonly OccurrenceResult[]): BusinessStatus {
  if (finish === "STOPPED") return "INTERRUPTED";
  return occurrences.some((occurrence) => occurrence.status === "PARTIAL") ? "PARTIAL" : "COMPLETED";
}
