import { formatLocalDate, occurrenceInstant, type Routine } from "./Routine";
import { groupOccurrenceExecutions, occurrenceExecutionKey, occurrenceExecutionStatus, type OccurrenceExecution } from "./occurrenceExecutions";
import { occurrencesBetween } from "./occurrences";

/**
 * Familles « première séance » (FIRST) et « reprise après absence » (RESTART) des rappels — spécification des
 * notifications du 18/11/2026, § 3 et § 4 (étapes 3 et 4) ; activées à la recette du 20/11/2026 (q19-rappels, Hermann :
 * « Active ces deux familles »), le lien occurrence ↔ Exécution existant depuis la migration 033.
 *
 * - RESTART : au moins une occurrence passée non commencée après la dernière occurrence commencée (« épisode d'absence ») ;
 *   l'accroche est montrée **une fois** : sur le premier rappel à venir de la routine, pas sur les suivants.
 * - FIRST : aucune occurrence commencée et aucune occurrence passée manquée ; accroche sur le premier rappel à venir.
 *
 * [Interprétations techniques, à confirmer par Hermann : l'historique est apprécié **par routine** ; une occurrence est
 * « commencée » dès qu'une de ses séances est terminée (statut autre que NONE) ; une occurrence est « échue » dès que son
 * heure de début est dépassée ; seules les séances lancées depuis l'Agenda depuis le 20/11/2026 sont rattachées à leur
 * occurrence, les plus anciennes comptent donc comme manquées.]
 */
export type ReminderHistoryFamily = "FIRST" | "RESTART";

/**
 * Accroche d'historique due pour le **premier** rappel à venir de `routine` (`null` : aucune). `executions` : Exécutions
 * liées à des occurrences, toutes routines confondues.
 */
export function reminderHistoryFamily(routine: Routine, executions: readonly OccurrenceExecution[], now: Date): ReminderHistoryFamily | null {
  const groups = groupOccurrenceExecutions(executions.filter((execution) => execution.routineId === routine.id));
  // Dernière occurrence commencée, y compris une occurrence à venir faite en avance ; clés `AAAA-MM-JJTHH:MM` triables.
  let lastStarted: string | null = null;
  for (const list of groups.values()) {
    if (occurrenceExecutionStatus(1, list) === "NONE") continue;
    const key = list[0]!.occurrenceKey;
    if (lastStarted === null || key > lastStarted) lastStarted = key;
  }
  const missed = occurrencesBetween(routine, routine.startDate, formatLocalDate(now)).some(
    (occurrence) =>
      occurrenceInstant(occurrence.date, occurrence.time).getTime() < now.getTime() &&
      (lastStarted === null || occurrence.key > lastStarted) &&
      occurrenceExecutionStatus(occurrence.contents.length, groups.get(occurrenceExecutionKey(routine.id, occurrence.key)) ?? []) === "NONE",
  );
  if (missed) return "RESTART";
  return lastStarted === null ? "FIRST" : null;
}
