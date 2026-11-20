import {
  addDays,
  isLocalDate,
  isLocalTime,
  mondayOf,
  occurrenceInstant,
  REMINDER_MAX_MINUTES,
  validateRoutineDraft,
  type LocalDate,
  type LocalTime,
  type OccurrenceOverride,
  type OccurrenceSession,
  type Routine,
  type RoutineDraft,
  type RoutineValidationIssue,
} from "@/domain/planning/Routine";
import type { RoutineRepository } from "@/domain/planning/RoutineRepository";
import { periodOccurrences, routineOccurrences, routineSessionsAt, type IsOccurrenceStarted, type Occurrence } from "@/domain/planning/occurrences";
import { occurrenceExecutionKey, type OccurrenceExecution } from "@/domain/planning/occurrenceExecutions";

/**
 * `PlanningService` (chapitre 12 §12.4) — gestion des Routines et calcul des occurrences (API-ROU-01 à 05, 09).
 *
 * - Créer / modifier : validation globale du brouillon (CE-UI-05 §14), écriture entière de la Routine.
 *   La modification agit sur la Routine (D-022 : pas d'exception d'occurrence) ; les retraits déjà enregistrés
 *   sont conservés ; rien n'est écrit dans l'historique (aucune occurrence passée n'est stockée, D-013).
 * - Supprimer : la Routine (RM-050) — sources et Exécutions conservées.
 * - Retirer une occurrence : R-04, persisté par date/heure d'origine.
 * - Dupliquer : brouillon complet, jamais persisté avant Enregistrer (RM-123, API-ROU-09).
 *
 * D-536 / D-537 (20/11/2026, modèle validé par Hermann, q21-modele) :
 * - une occurrence est commencée dès qu'une Exécution lui est liée (lien écrit au lancement, migration 033) ;
 * - toute écriture sur la Routine (modification depuis le Journal, modification d'une occurrence, suppression) fige d'abord
 *   ses occurrences commencées non encore enregistrées : elles sont enregistrées en entier avec la séquence en vigueur, qui
 *   est celle de leur lancement puisque la Routine n'a pas changé depuis [choix technique : figement à la première écriture
 *   qui suit le lancement, sans écriture dans le moteur d'exécution] ;
 * - modifier la Routine ne touche donc que les occurrences non commencées et les groupes non modifiés à la main ;
 * - supprimer une Routine sans historique la supprime ; avec historique, ses occurrences non commencées sont supprimées et
 *   elle est archivée.
 * [Remplace « La modification agit sur la Routine (D-022 : pas d'exception d'occurrence) » ci-dessus.]
 */

export type SaveRoutineResult =
  | { readonly status: "SAVED"; readonly routine: Routine }
  | { readonly status: "INVALID"; readonly issues: readonly (RoutineValidationIssue | "NAME_TAKEN")[] }
  | { readonly status: "NOT_FOUND" };

/** Modification d'une occurrence seule (Agenda, D-536 point 4) : valeurs voulues pour chaque groupe. */
export type OccurrenceChange = {
  readonly date: LocalDate;
  readonly time: LocalTime;
  readonly sessions: readonly OccurrenceSession[];
  readonly reminderMinutes: number | null;
};

export type SaveOccurrenceResult = { readonly status: "SAVED" } | { readonly status: "INVALID" } | { readonly status: "STARTED" } | { readonly status: "NOT_FOUND" };

/** Suppression depuis le Journal (D-537) : historique présent → archivage ; `count` : créneaux non commencés supprimés. */
export type RoutineDeletionPlan = { readonly history: boolean; readonly count: number };

/** Rappels locaux (adaptateur `ReminderScheduler`) ; absent : aucun rappel programmé (tests, environnement sans notifications). */
export type PlanningReminders = {
  readonly refresh: () => Promise<void>;
  readonly ensurePermission: () => Promise<boolean>;
  readonly isPermitted: () => Promise<boolean>;
  /** État sans demande ; absent : déduit de `isPermitted` (« granted » ou « undetermined »). */
  readonly permissionStatus?: () => Promise<"granted" | "denied" | "undetermined">;
};

export type PlanningServiceDeps = {
  readonly repository: RoutineRepository;
  readonly reminders?: PlanningReminders;
  /** Exécutions rattachées aux occurrences (migration 033) ; absent : aucune (tests, statut « non exécutée »). */
  readonly occurrenceExecutions?: () => Promise<readonly OccurrenceExecution[]>;
  readonly newId: () => string;
  readonly now: () => Date;
};

export class PlanningService {
  constructor(private readonly deps: PlanningServiceDeps) {}

  /** Fenêtre glissante des rappels : après toute écriture et à l'ouverture de l'application (chapitre 12). */
  refreshReminders(): Promise<void> {
    const reminders = this.deps.reminders;
    if (reminders === undefined) return Promise.resolve();
    return reminders.refresh().catch((error: unknown) => {
      console.error("Les rappels n'ont pas pu être programmés.", error);
    });
  }

  /** RM-052 / RM-053 : autorisation à la première activation d'un rappel. Sans adaptateur : refusée. */
  ensureReminderPermission(): Promise<boolean> {
    return this.deps.reminders?.ensurePermission() ?? Promise.resolve(false);
  }

  reminderPermissionStatus(): Promise<"granted" | "denied" | "undetermined"> {
    const reminders = this.deps.reminders;
    if (reminders === undefined) return Promise.resolve("denied");
    if (reminders.permissionStatus !== undefined) return reminders.permissionStatus();
    return reminders.isPermitted().then((granted) => (granted ? "granted" : "undetermined"));
  }

  reminderPermissionGranted(): Promise<boolean> {
    return this.deps.reminders?.isPermitted() ?? Promise.resolve(false);
  }

  private async written<T>(result: T): Promise<T> {
    await this.refreshReminders();
    return result;
  }

  /** Exécutions rattachées aux occurrences de routine (statuts « Complétée », « Partielle », « Arrêtée »). */
  listOccurrenceExecutions(): Promise<readonly OccurrenceExecution[]> {
    return this.deps.occurrenceExecutions?.() ?? Promise.resolve([]);
  }

  listRoutines(): Promise<readonly Routine[]> {
    return this.deps.repository.list();
  }

  /** Occurrences commencées connues par leurs Exécutions (D-536, point 1). */
  private async startedTest(): Promise<IsOccurrenceStarted> {
    const keys = new Set((await this.listOccurrenceExecutions()).map((execution) => occurrenceExecutionKey(execution.routineId, execution.occurrenceKey)));
    return (routineId, occurrenceKey) => keys.has(occurrenceExecutionKey(routineId, occurrenceKey));
  }

  /**
   * D-536, point 1 : enregistre en entier les occurrences commencées qui ne le sont pas encore (séquence, séances, date,
   * heure et rappel en vigueur). Début : première Exécution liée.
   */
  private async frozen(routine: Routine): Promise<Routine> {
    const executions = await this.listOccurrenceExecutions();
    const startedAt = new Map<string, string>();
    for (const execution of executions) {
      if (execution.routineId !== routine.id) continue;
      const current = startedAt.get(execution.occurrenceKey);
      if (current === undefined || execution.startedAt < current) startedAt.set(execution.occurrenceKey, execution.startedAt);
    }
    if (startedAt.size === 0) return routine;
    const saved = new Map((routine.overrides ?? []).map((item) => [item.key, item]));
    let changed = false;
    for (const occurrence of routineOccurrences(routine, (_, key) => startedAt.has(key))) {
      const at = startedAt.get(occurrence.key);
      if (at === undefined || (saved.get(occurrence.key)?.startedAt ?? null) !== null) continue;
      saved.set(occurrence.key, {
        key: occurrence.key,
        index: occurrence.index,
        date: occurrence.date,
        time: occurrence.time,
        sessions: occurrence.sessions,
        reminderOverridden: true,
        reminderMinutes: occurrence.reminderMinutes,
        startedAt: at,
      });
      changed = true;
    }
    return changed ? { ...routine, overrides: [...saved.values()] } : routine;
  }

  /** Occurrence `occurrenceKey` de la Routine (modification d'une occurrence seule depuis l'Agenda). */
  async getOccurrence(routineId: string, occurrenceKey: string): Promise<{ readonly routine: Routine; readonly occurrence: Occurrence } | null> {
    const routine = await this.deps.repository.get(routineId);
    if (routine === null) return null;
    const occurrence = routineOccurrences(routine, await this.startedTest()).find((item) => item.key === occurrenceKey);
    return occurrence === undefined ? null : { routine, occurrence };
  }

  /**
   * D-536, point 4 : modification d'une occurrence seule. Chaque groupe égal à ce que donne la Routine redevient « suit la
   * routine » ; seuls les groupes modifiés sont enregistrés (q21-modele). Refusée pour une occurrence commencée (point 1).
   */
  async updateOccurrence(routineId: string, occurrenceKey: string, change: OccurrenceChange): Promise<SaveOccurrenceResult> {
    const current = await this.deps.repository.get(routineId);
    if (current === null) return { status: "NOT_FOUND" };
    const routine = await this.frozen(current);
    const occurrence = routineOccurrences(routine, await this.startedTest()).find((item) => item.key === occurrenceKey);
    if (occurrence === undefined) return { status: "NOT_FOUND" };
    if (occurrence.started) return { status: "STARTED" };
    const reminder = change.reminderMinutes;
    const reminderValid = reminder === null || (Number.isInteger(reminder) && reminder >= 1 && reminder <= REMINDER_MAX_MINUTES);
    if (!isLocalDate(change.date) || !isLocalTime(change.time) || !change.sessions.some((session) => session.active) || !reminderValid) {
      return { status: "INVALID" };
    }
    const originDate = occurrenceKey.slice(0, 10);
    const defaults = routineSessionsAt(routine, occurrence.index);
    const sameSessions =
      defaults.length === change.sessions.length &&
      defaults.every((session, rank) => {
        const other = change.sessions[rank]!;
        return other.sessionId === session.sessionId && other.entryId === session.entryId && other.origin === session.origin && other.active === session.active;
      });
    const moved = change.date !== originDate || change.time !== routine.time;
    const next: OccurrenceOverride = {
      key: occurrenceKey,
      index: occurrence.index,
      date: moved ? change.date : null,
      time: moved ? change.time : null,
      sessions: sameSessions ? null : change.sessions,
      reminderOverridden: reminder !== routine.reminderMinutes,
      reminderMinutes: reminder !== routine.reminderMinutes ? reminder : null,
      startedAt: null,
    };
    const others = (routine.overrides ?? []).filter((item) => item.key !== occurrenceKey);
    const empty = next.date === null && next.sessions === null && !next.reminderOverridden;
    await this.deps.repository.save({ ...routine, overrides: empty ? others : [...others, next] });
    return this.written({ status: "SAVED" } as const);
  }

  /**
   * D-536, point 2 : créneaux non commencés de la Routine, passés compris, auxquels s'applique une modification depuis le
   * Journal (message « N créneaux à venir seront modifiés. », Hermann, 20/11/2026).
   */
  async pendingSlotCount(routineId: string): Promise<number> {
    const routine = await this.deps.repository.get(routineId);
    if (routine === null) return 0;
    return routineOccurrences(routine, await this.startedTest()).filter((occurrence) => !occurrence.started).length;
  }

  /**
   * D-539 (20/11/2026) : routines proposées par le filtre de l'Agenda — au moins un créneau, archivées comprises, par ordre
   * alphabétique [liste et ordre retenus par Claude, D-539] ; créneaux à venir (instant ≥ maintenant).
   */
  async routineFilterChoices(): Promise<readonly { readonly routine: Routine; readonly upcoming: number }[]> {
    const isStarted = await this.startedTest();
    const now = this.deps.now().getTime();
    return (await this.deps.repository.list())
      .map((routine) => ({ routine, occurrences: routineOccurrences(routine, isStarted) }))
      .filter((item) => item.occurrences.length > 0)
      .map((item) => ({
        routine: item.routine,
        upcoming: item.occurrences.filter((occurrence) => occurrenceInstant(occurrence.date, occurrence.time).getTime() >= now).length,
      }))
      .sort((a, b) => a.routine.name.localeCompare(b.routine.name, "fr", { sensitivity: "base" }));
  }

  /** D-537 : historique (au moins une occurrence commencée) et nombre de créneaux non commencés supprimés. */
  async deletionPlan(routineId: string): Promise<RoutineDeletionPlan | null> {
    const routine = await this.deps.repository.get(routineId);
    if (routine === null) return null;
    const occurrences = routineOccurrences(routine, await this.startedTest());
    return { history: occurrences.some((occurrence) => occurrence.started), count: occurrences.filter((occurrence) => !occurrence.started).length };
  }

  getRoutine(routineId: string): Promise<Routine | null> {
    return this.deps.repository.get(routineId);
  }

  /** RM-261 : nom déjà pris par une autre planification (casse et espaces de bord ignorés). */
  async isNameTaken(name: string, exceptRoutineId?: string): Promise<boolean> {
    const key = normalizeRoutineName(name);
    const routines = await this.deps.repository.list();
    return routines.some((routine) => routine.id !== exceptRoutineId && normalizeRoutineName(routine.name) === key);
  }

  private async issuesOf(draft: RoutineDraft, exceptRoutineId?: string): Promise<(RoutineValidationIssue | "NAME_TAKEN")[]> {
    const issues: (RoutineValidationIssue | "NAME_TAKEN")[] = [...validateRoutineDraft(draft)];
    if (draft.name.trim() !== "" && (await this.isNameTaken(draft.name, exceptRoutineId))) issues.push("NAME_TAKEN");
    return issues;
  }

  async createRoutine(draft: RoutineDraft): Promise<SaveRoutineResult> {
    const issues = await this.issuesOf(draft);
    if (issues.length > 0) return { status: "INVALID", issues };
    const at = this.deps.now().toISOString();
    const routine: Routine = {
      id: this.deps.newId(),
      name: draft.name.trim(),
      startDate: draft.startDate,
      time: draft.time,
      repetition: draft.repetition,
      entries: draft.entries,
      exclusions: [],
      reminderMinutes: draft.reminderMinutes ?? null,
      createdAt: at,
      updatedAt: at,
    };
    await this.deps.repository.save(routine);
    return this.written({ status: "SAVED", routine } as const);
  }

  async updateRoutine(routineId: string, draft: RoutineDraft): Promise<SaveRoutineResult> {
    const issues = await this.issuesOf(draft, routineId);
    if (issues.length > 0) return { status: "INVALID", issues };
    const stored = await this.deps.repository.get(routineId);
    if (stored === null) return { status: "NOT_FOUND" };
    // D-536 : les occurrences commencées gardent la séquence de leur lancement.
    const existing = await this.frozen(stored);
    const routine: Routine = {
      ...existing,
      name: draft.name.trim(),
      startDate: draft.startDate,
      time: draft.time,
      repetition: draft.repetition,
      entries: draft.entries,
      exclusions: existing.exclusions,
      reminderMinutes: draft.reminderMinutes ?? null,
      updatedAt: this.deps.now().toISOString(),
    };
    await this.deps.repository.save(routine);
    return this.written({ status: "SAVED", routine } as const);
  }

  /**
   * D-537 (Journal) : sans occurrence commencée, la Routine est supprimée avec ses occurrences ; sinon ses occurrences non
   * commencées sont supprimées et elle est archivée, ses occurrences commencées restant dans l'historique.
   */
  async deleteRoutine(routineId: string): Promise<boolean> {
    const stored = await this.deps.repository.get(routineId);
    if (stored === null) return false;
    const routine = await this.frozen(stored);
    const isStarted = await this.startedTest();
    if (!routineOccurrences(routine, isStarted).some((occurrence) => occurrence.started)) return this.written(await this.deps.repository.delete(routineId));
    const at = this.deps.now().toISOString();
    await this.deps.repository.save({
      ...routine,
      overrides: (routine.overrides ?? []).filter((item) => item.startedAt !== null),
      archivedAt: at,
      updatedAt: at,
    });
    return this.written(true);
  }

  /** D-537 (Agenda) : retire une occurrence ; refusé pour une occurrence commencée. */
  async excludeOccurrence(routineId: string, occurrenceKey: string): Promise<boolean> {
    const found = await this.getOccurrence(routineId, occurrenceKey);
    if (found !== null && found.occurrence.started) return false;
    return this.written(await this.deps.repository.addExclusion(routineId, occurrenceKey, this.deps.now().toISOString()));
  }

  /** RM-123 : brouillon de duplication — liste ordonnée, motifs et paramètres ; nouvelles identités d'entrée. */
  async prepareDuplicate(routineId: string): Promise<RoutineDraft | null> {
    const routine = await this.deps.repository.get(routineId);
    if (routine === null) return null;
    return {
      // RM-261 : le nom est unique ; la copie part d'un nom vide, à saisir (RM-258).
      name: "",
      startDate: routine.startDate,
      time: routine.time,
      repetition: routine.repetition,
      entries: routine.entries.map((entry) => ({ ...entry, id: this.deps.newId() })),
      reminderMinutes: routine.reminderMinutes,
    };
  }

  /**
   * Occurrences de la semaine contenant `anyDayOfWeek` (lundi → dimanche), passées comprises (D-525, 18/11/2026 ; [RM-049 :
   * occurrences futures seulement — remplacé]). `isPlannable` écarte les
   * contenus dont la Séance n'est plus active ou n'existe plus ; une occurrence sans contenu restant disparaît.
   */
  async weekOccurrences(anyDayOfWeek: LocalDate, isPlannable: (sessionId: string) => boolean): Promise<readonly Occurrence[]> {
    const monday = mondayOf(anyDayOfWeek);
    return this.rangeOccurrences(monday, addDays(monday, 6), isPlannable);
  }

  /** Occurrences de [`from`, `to`] (liste continue de l'Agenda sur plusieurs semaines, recette du 20/11/2026, constat C). */
  async rangeOccurrences(from: LocalDate, to: LocalDate, isPlannable: (sessionId: string) => boolean): Promise<readonly Occurrence[]> {
    const routines = await this.deps.repository.list();
    return periodOccurrences(routines, from, to, await this.startedTest())
      .map((occurrence) => ({ ...occurrence, contents: occurrence.contents.filter((content) => isPlannable(content.sessionId)) }))
      .filter((occurrence) => occurrence.contents.length > 0);
  }
}

/** RM-261 : comparaison des noms sans casse ni espaces de bord. */
export function normalizeRoutineName(name: string): string {
  return name.trim().toLocaleLowerCase("fr-FR");
}
