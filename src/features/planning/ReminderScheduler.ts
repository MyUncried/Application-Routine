import type { Routine } from "@/domain/planning/Routine";
import { upcomingReminders } from "@/domain/planning/reminders";
import { planningStrings } from "@/features/planning/planningStrings";
import { formatSpokenTime } from "@/features/planning/planningSummary";

/**
 * Programmation des rappels de Routine (RM-051 à RM-054a, chapitre 12 « Notifications »).
 * - RM-051 : aucune autorisation demandée par défaut.
 * - RM-052 : la demande système n'a lieu qu'à la première activation d'un rappel pendant une planification
 *   (`ensurePermission`, appelée par le formulaire).
 * - RM-053 : refus ou indisponibilité → le rappel reste désactivé ; la planification s'enregistre quand même.
 * - RM-054b : le rappel emporte la première Séance retenue pour son occurrence ; son toucher ouvre l'écran d'Exécution.
 * - Fenêtre glissante : `refresh` annule les rappels de planification programmés et reprogramme la fenêtre courante.
 */

export type NotificationPermission = "granted" | "denied" | "undetermined";

/** `sessionId` : première Séance retenue pour l'occurrence, ouverte au toucher du rappel (RM-054b). */
export type ScheduledReminder = {
  readonly id: string;
  readonly fireAt: Date;
  readonly title: string;
  readonly body: string;
  readonly sessionId: string;
};

/** Port vers les notifications locales du système (adaptateur `expo-notifications`). */
export interface LocalNotifications {
  permission(): Promise<NotificationPermission>;
  requestPermission(): Promise<NotificationPermission>;
  /** Remplace l'ensemble des rappels de planification programmés par `reminders`. */
  replaceReminders(reminders: readonly ScheduledReminder[]): Promise<void>;
  /**
   * RM-054b : appelle `listener` avec la Séance d'un rappel touché, y compris celui qui a lancé l'application.
   * Retourne la fonction de désabonnement.
   */
  onReminderOpened(listener: (sessionId: string) => void): () => void;
}

export type ReminderSchedulerDeps = {
  readonly notifications: LocalNotifications;
  readonly listRoutines: () => Promise<readonly Routine[]>;
  /** Séances actives par identifiant (nom) ; une Séance absente n'est pas rappelée. */
  readonly activeSessionNames: () => Promise<ReadonlyMap<string, string>>;
  readonly now: () => Date;
};

export function reminderTitle(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return planningStrings.form.combinedNameTwo.replace("{first}", names[0]!).replace("{second}", names[1]!);
  return planningStrings.form.combinedName.replace("{first}", names[0]!).replace("{count}", String(names.length - 1));
}

export class ReminderScheduler {
  private running: Promise<void> = Promise.resolve();

  constructor(private readonly deps: ReminderSchedulerDeps) {}

  /** RM-052 / RM-053 : vrai si les rappels peuvent être programmés ; demande l'autorisation si elle n'a jamais été donnée. */
  async ensurePermission(): Promise<boolean> {
    const current = await this.deps.notifications.permission();
    if (current === "granted") return true;
    if (current === "denied") return false;
    return (await this.deps.notifications.requestPermission()) === "granted";
  }

  /** RM-053 : autorisation actuelle, sans jamais la demander (notifications retirées dans Réglages, recette e3). */
  async isPermitted(): Promise<boolean> {
    return (await this.deps.notifications.permission()) === "granted";
  }

  /** Réapprovisionne la fenêtre ; les appels successifs sont sérialisés. Sans autorisation, rien n'est programmé. */
  refresh(): Promise<void> {
    this.running = this.running.catch(() => undefined).then(() => this.apply());
    return this.running;
  }

  private async apply(): Promise<void> {
    if ((await this.deps.notifications.permission()) !== "granted") return;
    const [routines, names] = await Promise.all([this.deps.listRoutines(), this.deps.activeSessionNames()]);
    const reminders = upcomingReminders(routines, this.deps.now(), (sessionId) => names.has(sessionId));
    await this.deps.notifications.replaceReminders(
      reminders.map((reminder) => {
        const time = `${String(reminder.occurrenceAt.getHours()).padStart(2, "0")}:${String(reminder.occurrenceAt.getMinutes()).padStart(2, "0")}`;
        return {
          id: reminder.id,
          fireAt: reminder.fireAt,
          sessionId: reminder.sessionIds[0]!,
          title: reminderTitle(reminder.sessionIds.map((sessionId) => names.get(sessionId)!)),
          body: planningStrings.reminder.body.replace("{time}", formatSpokenTime(time)),
        };
      }),
    );
  }
}
