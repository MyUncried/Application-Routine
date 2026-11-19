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

/**
 * Recette EMOM du 18/11/2026 (Hermann, autres remarques : « Séance terminée, appui suivant à chaque série : le récapitulatif n'indique
 * qu'une minute, pas les séries ni les répétitions » ; « Synthèse : mettre chaque série sur une ligne avec statut, nombre de séries /
 * objectif ») : une ligne par Série d'un Exercice exécuté en EMOM — terminée ou non, réalisé / objectif. Une Série terminée a fait son
 * objectif ; une Série non terminée a les répétitions saisies (Clôture « Fin de l'EMOM » ou Arrêt), ou la durée tenue.
 */
export type SeriesLine = {
  readonly series: number;
  readonly terminated: boolean;
  readonly mode: "REPETITIONS" | "DURATION";
  /** Répétitions faites, ou durée tenue (ms) ; `null` si non saisies. */
  readonly done: number | null;
  /** Objectif chiffré (répétitions, ou durée en ms) ; `null` sans objectif chiffré (À l'échec). */
  readonly target: number | null;
};

/**
 * Recette du 18/11/2026 (Hermann, amrap-1 : « Synthèse d'exercice, ne pas répéter le nom de l'exercice si c'est le même : Un exercice :
 * Une ligne avec le nom de l'exercice puis par tour : Tour X + Nb de répétitions + Durée ; plusieurs exercices : une ligne par Tour X puis
 * par mouvement : Nb de répétitions + durée ») : réalisé d'un mouvement dans un tour d'AMRAP — répétitions faites (objectif d'une Série
 * terminée, sinon répétitions saisies ; `null` en durée ou si rien n'est connu) et temps actif.
 */
export function roundMovementOf(
  occurrence: OccurrenceResult,
  leafOf: (key: string) => { readonly mode?: "REPETITIONS" | "DURATION"; readonly target?: { readonly kind: string; readonly value?: number } } | undefined,
  partials: ReadonlyMap<string, number>,
): { readonly repetitions: number | null; readonly activeMs: Ms } {
  let repetitions: number | null = null;
  for (const step of occurrence.series) {
    const leaf = leafOf(step.key);
    if (leaf?.mode === "DURATION") continue;
    const target = leaf?.target?.kind === "NUMBER" && typeof leaf.target.value === "number" ? leaf.target.value : null;
    const done = partials.has(step.key) ? partials.get(step.key)! : step.completion === "COMPLETED" ? target : null;
    if (done !== null) repetitions = (repetitions ?? 0) + done;
  }
  return { repetitions, activeMs: occurrence.activeMs };
}

export function seriesLines(
  occurrence: OccurrenceResult,
  leafOf: (key: string) => { readonly mode?: "REPETITIONS" | "DURATION"; readonly target?: { readonly kind: string; readonly value?: number } } | undefined,
  partials: ReadonlyMap<string, number>,
): readonly SeriesLine[] {
  const bySeries = new Map<number, StepResult[]>();
  for (const step of occurrence.series) {
    const rank = step.series ?? 1;
    bySeries.set(rank, [...(bySeries.get(rank) ?? []), step]);
  }
  return [...bySeries.entries()]
    .sort(([a], [b]) => a - b)
    .map(([series, steps]) => {
      const leaf = leafOf(steps[0]!.key);
      const mode = leaf?.mode === "DURATION" ? "DURATION" : "REPETITIONS";
      const value = leaf?.target?.kind === "NUMBER" && typeof leaf.target.value === "number" ? leaf.target.value : null;
      const target = value === null ? null : mode === "DURATION" ? value * 1000 : value;
      const terminated = steps.every((step) => step.completion === "COMPLETED");
      const interrupted = steps.find((step) => step.completion !== "COMPLETED");
      const done = terminated
        ? target
        : mode === "DURATION"
          ? (interrupted?.cumulativeActiveMs ?? null)
          : interrupted !== undefined && partials.has(interrupted.key)
            ? partials.get(interrupted.key)!
            : null;
      return { series, terminated, mode, done, target };
    });
}
