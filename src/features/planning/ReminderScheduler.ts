import type { Routine } from "@/domain/planning/Routine";
import type { OccurrenceExecution } from "@/domain/planning/occurrenceExecutions";
import { reminderHistoryFamily } from "@/domain/planning/reminderHistory";
import { composeReminder, REMINDER_BODY_MAX } from "@/domain/planning/reminderMessages";
import { upcomingReminders } from "@/domain/planning/reminders";
import { strings } from "@/shared/i18n";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";

/**
 * Programmation des rappels de Routine (RM-051 à RM-054a, chapitre 12 « Notifications »).
 * - RM-051 : aucune autorisation demandée par défaut.
 * - RM-052 : la demande système n'a lieu qu'à la première activation d'un rappel pendant une planification
 *   (`ensurePermission`, appelée par le formulaire).
 * - RM-053 : refus ou indisponibilité → le rappel reste désactivé ; la planification s'enregistre quand même.
 * - RM-054b : le rappel emporte la première Séance retenue pour son occurrence ; son toucher ouvre l'écran d'Exécution.
 * - Fenêtre glissante : `refresh` annule les rappels de planification programmés et reprogramme la fenêtre courante.
 * - Textes (recette du 19/11/2026, t6 — spécification des notifications de rappel du 18/11/2026) : accroche du catalogue
 *   en titre, corps commençant par le nom de la routine, en rotation (`reminderMessages`). [Avant : titre = noms des
 *   séances, corps « Séance prévue à 8 h. » — remplacé.]
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
  /** Catégories des exercices de chaque Séance active (famille CAT-* des rappels) ; absent : aucune. */
  readonly sessionCategoryIds?: () => Promise<ReadonlyMap<string, readonly string[]>>;
  /** Exécutions liées aux occurrences (familles FIRST et RESTART, `reminderHistory`) ; absent : aucune accroche d'historique. */
  readonly occurrenceExecutions?: () => Promise<readonly OccurrenceExecution[]>;
  readonly now: () => Date;
};

/** Nom de la routine (D-522) ; sans nom (planification antérieure au 18/11/2026) : nom de la première séance. */
export function reminderName(routineName: string, sessionNames: readonly string[]): string {
  const name = routineName.trim();
  return name !== "" ? name : (sessionNames[0] ?? "");
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

  /** État de l'autorisation, sans la demander : « denied » appelle le message vers Réglages (recette du 19/11/2026, k14). */
  permissionStatus(): Promise<NotificationPermission> {
    return this.deps.notifications.permission();
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
    const [routines, names, categories, executions] = await Promise.all([
      this.deps.listRoutines(),
      this.deps.activeSessionNames(),
      this.deps.sessionCategoryIds?.() ?? Promise.resolve(new Map<string, readonly string[]>()),
      this.deps.occurrenceExecutions?.() ?? Promise.resolve(null),
    ]);
    const routinesById = new Map(routines.map((routine) => [routine.id, routine]));
    const now = this.deps.now();
    const reminders = upcomingReminders(routines, now, (sessionId) => names.has(sessionId));
    // FIRST / RESTART (q19-rappels, 20/11/2026) : sur le premier rappel à venir de chaque routine seulement.
    const history = new Map<string, "FIRST" | "RESTART" | null>();
    if (executions !== null) {
      for (const reminder of reminders) {
        if (history.has(reminder.routineId)) continue;
        const routine = routinesById.get(reminder.routineId);
        history.set(reminder.id, routine === undefined ? null : reminderHistoryFamily(routine, executions, now));
        history.set(reminder.routineId, null);
      }
    }
    // Dans l'ordre de déclenchement : un modèle n'est jamais repris sur deux notifications consécutives.
    let previous: string | null = null;
    const scheduled = reminders.map((reminder) => {
      const routine = routinesById.get(reminder.routineId);
      const name = reminderName(routine?.name ?? "", reminder.sessionIds.map((sessionId) => names.get(sessionId)!));
      const message = composeReminder(
        {
          plannedAt: reminder.occurrenceAt,
          name,
          recurring: routine !== undefined && routine.repetition !== null,
          categoryIds: reminder.sessionIds.flatMap((sessionId) => categories.get(sessionId) ?? []),
          rank: reminder.rank,
          history: history.get(reminder.id) ?? null,
        },
        previous,
      );
      previous = message.templateId;
      const text = localizedReminder(message.templateId, name);
      return {
        id: reminder.id,
        fireAt: reminder.fireAt,
        sessionId: reminder.sessionIds[0]!,
        title: text?.title ?? message.title,
        body: text?.body ?? message.body,
      };
    });
    await this.deps.notifications.replaceReminders(scheduled);
  }
}

/**
 * J1.8 « Gestion des langues » (24/11/2026) : texte du modèle choisi par le domaine, dans la langue de l'interface
 * (catalogue `strings.planning.reminders`, identique au domaine en français). Même règle que `reminderBody` : le corps
 * devient le nom seul s'il dépasse la longueur maximale. `null` : modèle absent du catalogue, texte du domaine.
 */
export function localizedReminder(templateId: string, name: string): { readonly title: string; readonly body: string } | null {
  const text = (strings.planning.reminders as Readonly<Record<string, { readonly title: string; readonly body: string }>>)[templateId];
  if (text === undefined) return null;
  const body = fillTemplate(text.body, { name });
  return { title: text.title, body: body.length > REMINDER_BODY_MAX ? name : body };
}
