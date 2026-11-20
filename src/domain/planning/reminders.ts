import { addDays, formatLocalDate, occurrenceInstant, type Routine } from "./Routine";
import { occurrencesBetween } from "./occurrences";

/**
 * Rappels locaux des Routines (chapitre 12, « Notifications » : planifiés à partir des occurrences calculées, en
 * **fenêtre glissante** d'occurrences futures, réapprovisionnée à l'ouverture de l'application et à chaque
 * changement de planification ; taille technique choisie à l'implémentation selon les contraintes iOS).
 *
 * Choix technique : iOS conserve au plus 64 notifications locales programmées par application ; la fenêtre retient
 * les `limit` premiers rappels (60 par défaut) dans un horizon de `horizonDays` jours (35 par défaut).
 */

export const REMINDER_WINDOW_LIMIT = 60;
export const REMINDER_WINDOW_DAYS = 35;

export type PlannedReminder = {
  /** Identité stable : Routine + date/heure d'origine. */
  readonly id: string;
  readonly routineId: string;
  readonly occurrenceKey: string;
  readonly occurrenceAt: Date;
  readonly fireAt: Date;
  /** Contenus retenus, dans l'ordre de la liste. */
  readonly sessionIds: readonly string[];
  /** Rang de l'occurrence dans sa Routine (à partir de 1) : rotation des textes de rappel (`reminderMessages`). */
  readonly rank: number;
};

export function upcomingReminders(
  routines: readonly Routine[],
  now: Date,
  isPlannable: (sessionId: string) => boolean,
  options: { readonly limit?: number; readonly horizonDays?: number } = {},
): PlannedReminder[] {
  const limit = options.limit ?? REMINDER_WINDOW_LIMIT;
  const today = formatLocalDate(now);
  const horizon = addDays(today, options.horizonDays ?? REMINDER_WINDOW_DAYS);
  const reminders: PlannedReminder[] = [];
  for (const routine of routines) {
    // D-536 (20/11/2026) : date, heure et rappel propres à chaque occurrence (modifiables sur une occurrence seule) ; une
    // occurrence commencée n'a plus de rappel.
    for (const occurrence of occurrencesBetween(routine, today, horizon)) {
      const minutes = occurrence.reminderMinutes;
      if (minutes === null || occurrence.started) continue;
      const sessionIds = occurrence.contents.map((content) => content.sessionId).filter(isPlannable);
      if (sessionIds.length === 0) continue;
      const occurrenceAt = occurrenceInstant(occurrence.date, occurrence.time);
      const fireAt = new Date(occurrenceAt.getTime() - minutes * 60_000);
      if (fireAt.getTime() <= now.getTime()) continue;
      reminders.push({ id: `${routine.id}|${occurrence.key}`, routineId: routine.id, occurrenceKey: occurrence.key, occurrenceAt, fireAt, sessionIds, rank: occurrence.index });
    }
  }
  return reminders.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime()).slice(0, limit);
}
