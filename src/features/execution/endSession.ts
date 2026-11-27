/**
 * D-578 à D-581 (décisions de Hermann du 27/11/2026) — écran de fin de séance : logique pure, sans React ni stockage.
 * Contrat CE-UI-08 ; prompt `docs/PROMPT-CLAUDE-CODE-FIN-SEANCE-2026-11-27.md` (branche de documentation).
 *
 * - `SessionFeeling` : ressenti à cinq niveaux (D-579), du plus négatif au plus positif ; aucune autre valeur (pas d'effort perçu 1–10,
 *   D-581).
 * - `endStateStyle` : couleurs du voile et du cadre et symbole de l'Agenda par état (D-580).
 * - `formatRealDuration` : durée réelle au format minutes’secondes’’ (« 16’30’’ »).
 * - `exerciseTally` : exercices terminés / exercices de la séance (CE-UI-08 : le nombre terminé exclut les partiels).
 * - `capturedValues` : « Valeurs saisies », une ligne par exercice concerné (répétitions saisies, durées capturées).
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

export type CapturedValue = {
  readonly exerciseId: string;
  readonly name: string;
  /** Répétitions saisies (modifiables) ; `null` si aucune répétition n'a été saisie. */
  readonly repetitions: number | null;
  /** Durée capturée, en ms (non modifiable) ; `null` si aucune. */
  readonly durationMs: number | null;
};

/**
 * « Valeurs saisies » : valeurs relevées pendant la séance, une ligne par exercice concerné (ordre de première exécution) — répétitions
 * réalisées (cible atteinte, ou nombre saisi pour une série interrompue) ; durées réalisées (cible, ou durée tenue). [Interprétation :
 * une série sans valeur connue est ignorée.] Plusieurs séries ou tours d’un même exercice : une seule ligne
 * (somme), la présentation en colonnes n'étant pas arbitrée (D-578). [À CLARIFIER : liste exacte des exercices et valeurs repris.]
 */
export function capturedValues(plan: ExecutablePlan, occurrences: readonly OccurrenceResult[], partials: ReadonlyMap<string, number>, leafOf: (key: string) => LeafSpec | undefined): readonly CapturedValue[] {
  const byExercise = new Map<string, { repetitions: number | null; durationMs: number | null }>();
  for (const occurrence of occurrences) {
    for (const line of seriesLines(occurrence, leafOf, partials)) {
      if (line.done === null) continue;
      const entry = byExercise.get(occurrence.exerciseId) ?? { repetitions: null, durationMs: null };
      if (line.mode === "DURATION") entry.durationMs = (entry.durationMs ?? 0) + line.done;
      else entry.repetitions = (entry.repetitions ?? 0) + line.done;
      byExercise.set(occurrence.exerciseId, entry);
    }
  }
  return [...byExercise.entries()].map(([exerciseId, entry]) => ({ exerciseId, name: plan.exercises[exerciseId]?.name ?? "", ...entry }));
}
