/**
 * D-578 à D-581 (décisions de Hermann du 27/11/2026) — écran de fin de séance : logique pure, sans React ni stockage.
 * Contrat CE-UI-08 ; prompt `docs/PROMPT-CLAUDE-CODE-FIN-SEANCE-2026-11-27.md` (branche de documentation).
 *
 * - `SessionFeeling` : ressenti à cinq niveaux (D-579), du plus négatif au plus positif ; aucune autre valeur (pas d'effort perçu 1–10,
 *   D-581).
 * - `endStateStyle` : couleurs du voile et du cadre et symbole de l'Agenda par état (D-580).
 * - `formatRealDuration` : durée réelle au format minutes’secondes’’ (« 16’30’’ »).
 * - `exerciseTally` : exercices terminés / exercices de la séance (CE-UI-08 : le nombre terminé exclut les partiels).
 * - `capturedValues` : « Valeurs saisies », une ligne par exercice et une colonne par série (répétitions, durées capturées).
 */
import type { ExecutablePlan, LeafSpec } from "@/domain/execution/plan";
import { seriesLines, type BusinessStatus, type OccurrenceResult } from "@/domain/execution/results";
import type { SessionSnapshot } from "@/domain/sessions/sessionSnapshot";
import { FEEDBACK_FEELINGS, type FeedbackFeeling } from "@/domain/feedback/ExecutionFeedbackRepository";
import { strings } from "@/shared/i18n";

/** Ressenti à cinq niveaux (D-579), du plus négatif au plus positif : le modèle enregistré (`FeedbackFeeling`). */
export const SESSION_FEELINGS = FEEDBACK_FEELINGS;
export type SessionFeeling = FeedbackFeeling;

export type EndState = "COMPLETED" | "PARTIAL" | "STOPPED";

/** Statut métier → état de l'écran : `INTERRUPTED` (arrêt volontaire) = « Séance arrêtée ». */
export function endStateOf(status: BusinessStatus | null): EndState {
  return status === "COMPLETED" ? "COMPLETED" : status === "PARTIAL" ? "PARTIAL" : "STOPPED";
}

export const END_STATE_STYLE: Readonly<Record<EndState, { readonly veil: string; readonly card: string; readonly icon: "COMPLETED" | "PARTIAL" | "STOPPED" }>> = {
  COMPLETED: { veil: "rgba(31, 158, 122, 0.35)", card: "#148061", icon: "COMPLETED" },
  PARTIAL: { veil: "rgba(245, 140, 26, 0.35)", card: "#BD620B", icon: "PARTIAL" },
  STOPPED: { veil: "rgba(204, 56, 56, 0.35)", card: "#8E1F1F", icon: "STOPPED" },
};

/** « 16’30’’ » : minutes (sans borne à 60) et secondes sur deux chiffres, arrondi à la seconde inférieure. */
export function formatRealDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return strings.execution.endSession.realDuration(String(Math.floor(total / 60)).padStart(2, "0"), String(total % 60).padStart(2, "0"));
}

/**
 * Exercices de la séance, d'après la composition : un par exercice, multiplié par les tours d'un circuit et les répétitions d'un
 * cycle. [Interprétation technique, À CLARIFIER : unité du compte (exercice ou occurrence d'exercice) ; un bloc à durée (AMRAP)
 * peut jouer plus de tours que son compte — le total retenu n'est jamais inférieur au nombre d'occurrences exécutées.]
 */
export function plannedExerciseCount(snapshot: SessionSnapshot | null): number | null {
  if (snapshot === null) return null;
  let count = 0;
  for (const element of snapshot.structure.elements) {
    if (element.kind === "EXERCISE") count += 1;
    else if (element.kind === "CIRCUIT") count += element.circuit.exercises.length * element.circuit.repeatCount;
    else {
      const perRound = element.cycle.members.reduce((sum, member) => sum + (member.kind === "EXERCISE" ? 1 : member.circuit.exercises.length * member.circuit.repeatCount), 0);
      count += perRound * element.cycle.repeatCount;
    }
  }
  return count;
}

export function exerciseTally(occurrences: readonly OccurrenceResult[], planned: number | null): { readonly done: number; readonly total: number } {
  const done = occurrences.filter((occurrence) => occurrence.status === "COMPLETED").length;
  return { done, total: Math.max(planned ?? 0, occurrences.length) };
}

/**
 * Cellule d'une série dans « Valeurs saisies ». `REPETITIONS` : champ modifiable ; `DURATION` : cadre en pointillés non modifiable ;
 * `value` nul : série sans valeur capturée (non réalisée, ou interrompue sans saisie) — case vide, non modifiable [lecture prudente,
 * À CLARIFIER]. Clé de série : `<occurrence>#<série>`.
 */
export type CapturedCell = {
  readonly seriesKey: string;
  readonly mode: "REPETITIONS" | "DURATION";
  readonly value: number | null;
};

export type CapturedValue = {
  readonly exerciseId: string;
  readonly name: string;
  /** Séries de l'exercice dans l'ordre d'exécution (tours successifs compris) : colonnes S1, S2, S3… */
  readonly cells: readonly CapturedCell[];
};

export function seriesKeyOf(occurrenceKey: string, series: number): string {
  return `${occurrenceKey}#${series}`;
}

/**
 * « Valeurs saisies » (prompt révisé, point 4 ; Figma « Valeurs par série » `13461:27870` ; décision de Hermann du 27/11/2026) :
 * une ligne par exercice (ordre de première exécution), **une colonne par série**, sans total par exercice. Valeur d'une série :
 * répétitions réalisées (cible atteinte, ou nombre saisi pour une série interrompue) ou durée réalisée (cible, ou durée tenue).
 * `corrections` : répétitions corrigées enregistrées, par série — elles remplacent la valeur d'origine de cette série seulement.
 * [Valeurs additionnées par exercice — remplacé le 27/11/2026.]
 */
export function capturedValues(
  plan: ExecutablePlan,
  occurrences: readonly OccurrenceResult[],
  partials: ReadonlyMap<string, number>,
  leafOf: (key: string) => LeafSpec | undefined,
  corrections: ReadonlyMap<string, number> = new Map(),
): readonly CapturedValue[] {
  const byExercise = new Map<string, CapturedCell[]>();
  for (const occurrence of occurrences) {
    const cells = byExercise.get(occurrence.exerciseId) ?? [];
    for (const line of seriesLines(occurrence, leafOf, partials)) {
      const seriesKey = seriesKeyOf(occurrence.occurrenceKey, line.series);
      const corrected = line.mode === "REPETITIONS" ? corrections.get(seriesKey) : undefined;
      cells.push({ seriesKey, mode: line.mode, value: corrected ?? line.done });
    }
    byExercise.set(occurrence.exerciseId, cells);
  }
  return [...byExercise.entries()]
    .filter(([, cells]) => cells.length > 0)
    .map(([exerciseId, cells]) => ({ exerciseId, name: plan.exercises[exerciseId]?.name ?? "", cells }));
}
