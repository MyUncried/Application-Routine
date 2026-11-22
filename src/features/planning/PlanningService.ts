import {
  addDays,
  formatLocalDate,
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
import {
  addedOccurrenceSessions,
  isRoutineActiveAt,
  routineOccurrences,
  routineSessionsAt,
  withExpiry,
  type IsOccurrenceStarted,
  type Occurrence,
} from "@/domain/planning/occurrences";
import { occurrenceExecutionKey, type AgendaExecution, type OccurrenceExecution, type OccurrenceLink } from "@/domain/planning/occurrenceExecutions";
import type { SessionSnapshot } from "@/domain/sessions/sessionSnapshot";

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
  // D-553 (21/11/2026) : plus de contrôle d'unicité du nom. [« NAME_TAKEN » (RM-261) — retiré.]
  | { readonly status: "INVALID"; readonly issues: readonly RoutineValidationIssue[] }
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
  /** D-553 : toutes les Exécutions, liées ou non (cartes « Hors planification » de l'Agenda) ; absent : aucune. */
  readonly executions?: () => Promise<readonly AgendaExecution[]>;
  /** Recette du 22/11/2026 (constat b) : instantanés JSON des Exécutions demandées ; absent : aucun (Séance du Catalogue). */
  readonly executionSnapshots?: (executionIds: readonly string[]) => Promise<ReadonlyMap<string, string>>;
  readonly newId: () => string;
  readonly now: () => Date;
};

export class PlanningService {
  /**
   * Instantanés d'Exécution déjà lus (recette du 23/11/2026) : un instantané ne change jamais ; il n'est lu qu'une fois, au lieu
   * de l'être à chaque chargement de l'Agenda ou du Plan.
   */
  private readonly snapshotCache = new Map<string, SessionSnapshot | null>();

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

  /**
   * Recette du 22/11/2026 (constat c — Hermann : « la mention d'une entrée à venir dans le journal et du filtre est incorrecte
   * (cela doit faire mention des occurrences planifiées) ») : test des créneaux commencés, pour le Journal.
   */
  occurrenceStartedTest(): Promise<IsOccurrenceStarted> {
    return this.startedTest();
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
  private async frozen(routine: Routine, options: { readonly expired?: boolean } = {}): Promise<Routine> {
    const executions = await this.listOccurrenceExecutions();
    const startedAt = new Map<string, string>();
    for (const execution of executions) {
      if (execution.routineId !== routine.id) continue;
      const current = startedAt.get(execution.occurrenceKey);
      if (current === undefined || execution.startedAt < current) startedAt.set(execution.occurrenceKey, execution.startedAt);
    }
    const saved = new Map((routine.overrides ?? []).map((item) => [item.key, item]));
    let changed = false;
    // D-540 : un créneau expiré n'est pas modifié par un changement de la routine — enregistré en entier, non commencé
    // (modification de la routine depuis le Journal seulement).
    for (const occurrence of withExpiry(routineOccurrences(routine, (_, key) => startedAt.has(key)), this.deps.now())) {
      const at = startedAt.get(occurrence.key);
      const current = saved.get(occurrence.key);
      if (at === undefined && !(options.expired === true && occurrence.expired)) continue;
      if ((current?.startedAt ?? null) !== null) continue;
      if (at === undefined && current !== undefined && current.date !== null && current.sessions !== null && current.reminderOverridden) continue;
      saved.set(occurrence.key, {
        key: occurrence.key,
        index: occurrence.index,
        date: occurrence.date,
        time: occurrence.time,
        sessions: occurrence.sessions,
        reminderOverridden: true,
        reminderMinutes: occurrence.reminderMinutes,
        startedAt: at ?? null,
        // D-554 : un créneau ajouté le reste une fois figé.
        ...(current?.added === true ? { added: true } : {}),
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
    // D-554 : un créneau ajouté suit la liste entière de la routine ; sa date et son heure restent toujours enregistrées.
    const added = occurrence.added === true;
    const defaults = added ? addedOccurrenceSessions(routine) : routineSessionsAt(routine, occurrence.index);
    const sameSessions =
      defaults.length === change.sessions.length &&
      defaults.every((session, rank) => {
        const other = change.sessions[rank]!;
        return other.sessionId === session.sessionId && other.entryId === session.entryId && other.origin === session.origin && other.active === session.active;
      });
    const moved = added || change.date !== originDate || change.time !== routine.time;
    const next: OccurrenceOverride = {
      key: occurrenceKey,
      index: occurrence.index,
      date: moved ? change.date : null,
      time: moved ? change.time : null,
      sessions: sameSessions ? null : change.sessions,
      reminderOverridden: reminder !== routine.reminderMinutes,
      reminderMinutes: reminder !== routine.reminderMinutes ? reminder : null,
      startedAt: null,
      ...(added ? { added: true } : {}),
    };
    const others = (routine.overrides ?? []).filter((item) => item.key !== occurrenceKey);
    const empty = !added && next.date === null && next.sessions === null && !next.reminderOverridden;
    await this.deps.repository.save({ ...routine, overrides: empty ? others : [...others, next] });
    return this.written({ status: "SAVED" } as const);
  }

  /**
   * D-554 (DSF Plan § 7) : créneau proposé pour un ajout depuis le Plan — date touchée, heure habituelle de la routine, toutes
   * ses séances (un parcours entier), rappel de la routine. Rien n'est écrit avant Enregistrer.
   */
  async prepareAddedOccurrence(routineId: string, date: LocalDate): Promise<{ readonly routine: Routine; readonly occurrence: Occurrence } | null> {
    const routine = await this.deps.repository.get(routineId);
    if (routine === null || !isLocalDate(date)) return null;
    const sessions = addedOccurrenceSessions(routine);
    const occurrence: Occurrence = {
      routineId,
      date,
      time: routine.time,
      key: this.addedKey(routine, date, routine.time),
      index: 1,
      contents: sessions.map((session, rank) => ({ entryId: session.entryId, sessionId: session.sessionId, rank })),
      sessions,
      reminderMinutes: routine.reminderMinutes,
      started: false,
      expired: false,
      added: true,
      manual: { dateTime: true, sessions: false, reminder: false },
    };
    return { routine, occurrence };
  }

  /**
   * D-554 / RM-273 : ajoute à la routine un créneau hors de sa répétition. Enregistré comme occurrence ajoutée (`added`), avec
   * sa date et son heure (groupe « date et heure » modifié à la main, protégé d'un changement global) ; ses séances et son rappel
   * ne sont enregistrés que s'ils diffèrent de la routine. La répétition n'est pas modifiée.
   */
  async addOccurrence(routineId: string, change: OccurrenceChange): Promise<SaveOccurrenceResult> {
    const current = await this.deps.repository.get(routineId);
    if (current === null) return { status: "NOT_FOUND" };
    const routine = await this.frozen(current);
    const reminder = change.reminderMinutes;
    const reminderValid = reminder === null || (Number.isInteger(reminder) && reminder >= 1 && reminder <= REMINDER_MAX_MINUTES);
    if (!isLocalDate(change.date) || !isLocalTime(change.time) || !change.sessions.some((session) => session.active) || !reminderValid) {
      return { status: "INVALID" };
    }
    const defaults = addedOccurrenceSessions(routine);
    const sameSessions =
      defaults.length === change.sessions.length &&
      defaults.every((session, rank) => {
        const other = change.sessions[rank]!;
        return other.sessionId === session.sessionId && other.entryId === session.entryId && other.origin === session.origin && other.active === session.active;
      });
    const next: OccurrenceOverride = {
      key: this.addedKey(routine, change.date, change.time),
      index: 1,
      date: change.date,
      time: change.time,
      sessions: sameSessions ? null : change.sessions,
      reminderOverridden: reminder !== routine.reminderMinutes,
      reminderMinutes: reminder !== routine.reminderMinutes ? reminder : null,
      startedAt: null,
      added: true,
    };
    await this.deps.repository.save({ ...routine, overrides: [...(routine.overrides ?? []), next], updatedAt: this.deps.now().toISOString() });
    return this.written({ status: "SAVED" } as const);
  }

  /**
   * Identité d'un créneau ajouté : date et heure choisies suivies de « +A » et d'un numéro, jamais confondue avec une occurrence de
   * la répétition (« AAAA-MM-JJTHH:MM ») ni avec un retrait. [Format : choix technique.]
   */
  private addedKey(routine: Routine, date: LocalDate, time: LocalTime): string {
    const taken = new Set([...(routine.overrides ?? []).map((item) => item.key), ...routine.exclusions]);
    let rank = 1;
    while (taken.has(`${date}T${time}+A${rank}`)) rank += 1;
    return `${date}T${time}+A${rank}`;
  }

  /**
   * D-536, point 2 : créneaux non commencés de la Routine, passés compris, auxquels s'applique une modification depuis le
   * Journal (message « N créneaux à venir seront modifiés. », Hermann, 20/11/2026).
   */
  async pendingSlotCount(routineId: string): Promise<number> {
    const routine = await this.deps.repository.get(routineId);
    if (routine === null) return 0;
    // D-540 : un créneau expiré n'est pas modifié par un changement de la routine, ni compté.
    return withExpiry(routineOccurrences(routine, await this.startedTest()), this.deps.now()).filter((occurrence) => !occurrence.started && !occurrence.expired)
      .length;
  }

  /**
   * PROG-CAT-01 (D-547) : créneaux à venir de la routine — non commencés, instant ≥ maintenant (même règle que
   * `routineFilterChoices`). Sert à afficher « Garder les routines dans le calendrier ».
   */
  async upcomingSlotCount(routineId: string): Promise<number> {
    const routine = await this.deps.repository.get(routineId);
    if (routine === null) return 0;
    const now = this.deps.now().getTime();
    return routineOccurrences(routine, await this.startedTest()).filter(
      (occurrence) => !occurrence.started && occurrenceInstant(occurrence.date, occurrence.time).getTime() >= now,
    ).length;
  }

  /**
   * D-540, point 2 : routines actives (au moins un créneau à venir ou rattrapable) ; les autres sont terminées. Calculé, jamais
   * enregistré.
   */
  async routineActivity(): Promise<ReadonlyMap<string, boolean>> {
    const isStarted = await this.startedTest();
    const now = this.deps.now();
    return new Map((await this.deps.repository.list()).map((routine) => [routine.id, isRoutineActiveAt(routine, now, isStarted)]));
  }

  /**
   * D-539 (20/11/2026) : routines proposées par le filtre de l'Agenda — au moins un créneau, terminées comprises, par ordre
   * alphabétique [liste et ordre retenus par Claude, D-539] ; créneaux à venir (instant ≥ maintenant).
   * D-553 (21/11/2026, arbitrage 3) : les routines actives d'abord, puis les terminées, chaque groupe par ordre alphabétique du
   * nom affiché (`displayName`). [Un seul ordre alphabétique — remplacé.]
   */
  async routineFilterChoices(
    displayName: (routine: Routine) => string = (routine) => routine.name,
  ): Promise<readonly { readonly routine: Routine; readonly upcoming: number; readonly lastUpcoming: LocalDate | null; readonly active: boolean }[]> {
    const isStarted = await this.startedTest();
    const now = this.deps.now();
    const at = now.getTime();
    return (await this.deps.repository.list())
      .map((routine) => ({ routine, occurrences: routineOccurrences(routine, isStarted) }))
      .filter((item) => item.occurrences.length > 0)
      .map((item) => {
        // Recette du 21/11/2026 (f23-modale) : « jusqu'au » = date du dernier créneau à venir.
        // Recette du 22/11/2026 (constat c) : un créneau à venir déjà exécuté (séance faite en avance) n'est plus « à venir ».
        const upcoming = item.occurrences.filter((occurrence) => !occurrence.started && occurrenceInstant(occurrence.date, occurrence.time).getTime() >= at);
        const lastUpcoming = upcoming.reduce<LocalDate | null>((last, occurrence) => (last === null || occurrence.date > last ? occurrence.date : last), null);
        return {
          routine: item.routine,
          upcoming: upcoming.length,
          lastUpcoming,
          active: withExpiry(item.occurrences, now).some((occurrence) => !occurrence.started && !occurrence.expired),
        };
      })
      .sort((a, b) =>
        a.active !== b.active ? (a.active ? -1 : 1) : displayName(a.routine).localeCompare(displayName(b.routine), "fr", { sensitivity: "base" }),
      );
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

  /**
   * D-553 (21/11/2026) : validations du brouillon ; un nom vide bloque (« Nom obligatoire »), les doublons sont autorisés.
   * [RM-261 : nom déjà pris par une autre planification (« Ce nom est déjà utilisé ») — retiré.]
   */
  private issuesOf(draft: RoutineDraft): RoutineValidationIssue[] {
    return [...validateRoutineDraft(draft)];
  }

  async createRoutine(draft: RoutineDraft): Promise<SaveRoutineResult> {
    const issues = this.issuesOf(draft);
    if (issues.length > 0) return { status: "INVALID", issues };
    const at = this.deps.now().toISOString();
    const routine: Routine = {
      id: this.deps.newId(),
      name: draft.name.trim(),
      ...(draft.nameGenerated === true ? { nameGenerated: true } : {}),
      startDate: draft.startDate,
      time: draft.time,
      repetition: draft.repetition,
      entries: draft.entries,
      exclusions: [],
      reminderMinutes: draft.reminderMinutes ?? null,
      // PROG-CAT-01 (D-549) : « + Planifier une séance » depuis un programme crée une routine rattachée.
      ...(draft.programId !== undefined && draft.programId !== null ? { programId: draft.programId } : {}),
      createdAt: at,
      updatedAt: at,
    };
    await this.deps.repository.save(routine);
    return this.written({ status: "SAVED", routine } as const);
  }

  async updateRoutine(routineId: string, draft: RoutineDraft): Promise<SaveRoutineResult> {
    const issues = this.issuesOf(draft);
    if (issues.length > 0) return { status: "INVALID", issues };
    const stored = await this.deps.repository.get(routineId);
    if (stored === null) return { status: "NOT_FOUND" };
    // D-536 : les occurrences commencées gardent la séquence de leur lancement.
    const existing = await this.frozen(stored, { expired: true });
    const { nameGenerated: _previousMode, ...rest } = existing;
    const routine: Routine = {
      ...rest,
      name: draft.name.trim(),
      // D-553 : le mode du nom suit le formulaire (nom généré, ou personnalisé dès qu'il est saisi).
      ...(draft.nameGenerated === true ? { nameGenerated: true } : {}),
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
    const occurrences = routineOccurrences(routine, isStarted);
    if (!occurrences.some((occurrence) => occurrence.started)) return this.written(await this.deps.repository.delete(routineId));
    // D-540 (20/11/2026) : plus d'archivage — les créneaux non commencés (expirés compris) sont retirés ; la routine, sans créneau
    // à venir ni rattrapable, est terminée (état calculé). [D-537 : routine archivée (`archivedAt`) — remplacé.]
    const removed = occurrences.filter((occurrence) => !occurrence.started).map((occurrence) => occurrence.key);
    const at = this.deps.now().toISOString();
    await this.deps.repository.save({
      ...routine,
      exclusions: [...new Set([...routine.exclusions, ...removed])],
      overrides: (routine.overrides ?? []).filter((item) => item.startedAt !== null),
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
      // D-553 (21/11/2026) : la copie est une création — nom par défaut généré depuis ses Séances (§ 2). [RM-261 : nom vide, à
      // saisir, le nom étant unique — remplacé.] [Copie d'un nom personnalisé : non arbitrée, voir rapport AGENDA-SEANCES-01.]
      name: "",
      nameGenerated: true,
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

  /**
   * D-553 (21/11/2026, spécification § 4) : rattachement automatique d'une Exécution lancée hors Agenda. Créneau éligible :
   * créneau autonome (une seule Séance active, la même), le même jour que le lancement, non commencé et non expiré ; un
   * parcours n'est jamais éligible (Séance de parcours lancée hors Agenda = « Hors planification »). Plusieurs créneaux : le plus
   * proche de l'heure de lancement, puis le plus ancien (heure prévue la plus tôt, puis routine la plus ancienne). `null` : hors
   * planification. [Égalité : « le plus ancien » lu comme l'heure prévue la plus tôt — interprétation technique.]
   */
  async autoAttachment(sessionId: string, at: Date): Promise<OccurrenceLink | null> {
    const day = formatLocalDate(at);
    const isStarted = await this.startedTest();
    const routines = await this.deps.repository.list();
    const candidates = routines.flatMap((routine) =>
      withExpiry(routineOccurrences(routine, isStarted), at)
        .filter(
          (occurrence) =>
            occurrence.date === day && !occurrence.started && !occurrence.expired && occurrence.sessions.length === 1 && occurrence.contents.length === 1 && occurrence.contents[0]!.sessionId === sessionId,
        )
        .map((occurrence) => ({ routine, occurrence, instant: occurrenceInstant(occurrence.date, occurrence.time).getTime() })),
    );
    const time = at.getTime();
    candidates.sort(
      (a, b) =>
        Math.abs(a.instant - time) - Math.abs(b.instant - time) ||
        a.instant - b.instant ||
        (a.routine.createdAt < b.routine.createdAt ? -1 : a.routine.createdAt > b.routine.createdAt ? 1 : 0),
    );
    const chosen = candidates[0];
    return chosen === undefined ? null : { routineId: chosen.routine.id, occurrenceKey: chosen.occurrence.key, rank: 1 };
  }

  /**
   * D-553 (21/11/2026, arbitrage 9) : « Supprimer » sur la carte d'une Séance de parcours retire cette Séance seule de
   * l'occurrence (`sessionIndex` : rang dans la liste des séances de l'occurrence, `OccurrenceContent.rank`). Refusé pour une
   * Séance exécutée (historique). La dernière Séance restante supprime le créneau (aucune ligne « Ⓟ » seule). Une Séance non
   * exécutée d'un parcours commencé peut être supprimée : elle n'est plus à rattraper ; le reste du créneau figé est inchangé.
   * Une Séance de la routine est désactivée (D-536, point 4 : jamais retirée), une Séance ajoutée à la main est retirée.
   */
  async removeOccurrenceSession(routineId: string, occurrenceKey: string, sessionIndex: number): Promise<"REMOVED" | "SLOT_REMOVED" | "EXECUTED" | "NOT_FOUND"> {
    const current = await this.deps.repository.get(routineId);
    if (current === null) return "NOT_FOUND";
    const routine = await this.frozen(current);
    const occurrence = routineOccurrences(routine, await this.startedTest()).find((item) => item.key === occurrenceKey);
    const target = occurrence?.sessions[sessionIndex];
    if (occurrence === undefined || target === undefined || !target.active) return "NOT_FOUND";
    const linked = (await this.listOccurrenceExecutions()).filter((execution) => execution.routineId === routineId && execution.occurrenceKey === occurrenceKey);
    const position = occurrence.contents.findIndex((content) => content.rank === sessionIndex) + 1;
    const executed = linked.some((execution) =>
      execution.sessionId !== undefined && execution.sessionId !== null
        ? execution.sessionId === target.sessionId && execution.rank === position
        : execution.rank === position,
    );
    if (executed) return "EXECUTED";
    if (occurrence.contents.length <= 1) {
      if (occurrence.started) return "EXECUTED";
      await this.deps.repository.addExclusion(routineId, occurrenceKey, this.deps.now().toISOString());
      await this.refreshReminders();
      return "SLOT_REMOVED";
    }
    const sessions = occurrence.sessions.flatMap((session, index) =>
      index !== sessionIndex ? [session] : session.origin === "ADDED" ? [] : [{ ...session, active: false }],
    );
    const saved = (routine.overrides ?? []).find((item) => item.key === occurrenceKey);
    const next: OccurrenceOverride =
      saved !== undefined
        ? { ...saved, sessions }
        : { key: occurrenceKey, index: occurrence.index, date: null, time: null, sessions, reminderOverridden: false, reminderMinutes: null, startedAt: null };
    const others = (routine.overrides ?? []).filter((item) => item.key !== occurrenceKey);
    await this.deps.repository.save({ ...routine, overrides: [...others, next], updatedAt: this.deps.now().toISOString() });
    await this.refreshReminders();
    return "REMOVED";
  }

  /**
   * Données de l'Agenda en une lecture (recette du 20/11/2026 : liste lente à apparaître) : routines, créneaux de [`from`,
   * `to`] et Exécutions liées. [Avant : routines et Exécutions lues deux fois par chargement — choix technique.]
   */
  async agendaData(
    from: LocalDate,
    to: LocalDate,
  ): Promise<{
    readonly routines: readonly Routine[];
    readonly occurrences: readonly Occurrence[];
    readonly executions: readonly OccurrenceExecution[];
    /** D-553 : toutes les Exécutions (cartes de Séance exécutées et « Hors planification »). */
    readonly allExecutions: readonly AgendaExecution[];
    /**
     * Recette du 22/11/2026 (constat b) : instantané de chaque Exécution démarrée dans la période — la Séance telle qu'elle a
     * été exécutée, indépendante des modifications ultérieures du Catalogue (FMT-06).
     */
    readonly snapshots: ReadonlyMap<string, SessionSnapshot>;
  }> {
    const [routines, executions, allExecutions] = await Promise.all([
      this.deps.repository.list(),
      this.listOccurrenceExecutions(),
      this.deps.executions?.() ?? Promise.resolve([] as readonly AgendaExecution[]),
    ]);
    const keys = new Set(executions.map((execution) => occurrenceExecutionKey(execution.routineId, execution.occurrenceKey)));
    // D-553 (§ 3) : une Séance exécutée est placée à sa date réelle — un créneau d'avant la période dont une Exécution a démarré
    // dans la période est lu aussi.
    const executedInRange = new Set(
      executions
        .filter((execution) => {
          const day = formatLocalDate(new Date(execution.startedAt));
          return day >= from && day <= to;
        })
        .map((execution) => occurrenceExecutionKey(execution.routineId, execution.occurrenceKey)),
    );
    const occurrences = this.inRange(routines, (routineId, key) => keys.has(occurrenceExecutionKey(routineId, key)), from, to, () => true, (occurrence) =>
      executedInRange.has(occurrenceExecutionKey(occurrence.routineId, occurrence.key)),
    );
    const inPeriod = allExecutions
      .filter((execution) => {
        const day = formatLocalDate(new Date(execution.startedAt));
        return day >= from && day <= to;
      })
      .map((execution) => execution.executionId);
    const missing = inPeriod.filter((id) => !this.snapshotCache.has(id));
    const raw = missing.length === 0 || this.deps.executionSnapshots === undefined ? new Map<string, string>() : await this.deps.executionSnapshots(missing);
    for (const id of missing) {
      const json = raw.get(id);
      let snapshot: SessionSnapshot | null = null;
      try {
        if (json !== undefined) snapshot = JSON.parse(json) as SessionSnapshot;
      } catch {
        // Instantané illisible : la carte garde la Séance du Catalogue.
      }
      // Exécution encore sans instantané lisible : relue au chargement suivant.
      if (snapshot !== null) this.snapshotCache.set(id, snapshot);
    }
    const snapshots = new Map<string, SessionSnapshot>();
    for (const id of inPeriod) {
      const snapshot = this.snapshotCache.get(id);
      if (snapshot !== undefined && snapshot !== null) snapshots.set(id, snapshot);
    }
    return { routines, occurrences, executions, allExecutions, snapshots };
  }

  /** Occurrences de [`from`, `to`] (liste continue de l'Agenda sur plusieurs semaines, recette du 20/11/2026, constat C). */
  async rangeOccurrences(from: LocalDate, to: LocalDate, isPlannable: (sessionId: string) => boolean): Promise<readonly Occurrence[]> {
    const routines = await this.deps.repository.list();
    return this.inRange(routines, await this.startedTest(), from, to, isPlannable);
  }

  private inRange(
    routines: readonly Routine[],
    isStarted: IsOccurrenceStarted,
    from: LocalDate,
    to: LocalDate,
    isPlannable: (sessionId: string) => boolean,
    also: (occurrence: Occurrence) => boolean = () => false,
  ): Occurrence[] {
    const now = this.deps.now();
    // D-540 : l'état « expiré » dépend du créneau suivant de la routine, éventuellement hors de la période.
    return routines
      .flatMap((routine) => withExpiry(routineOccurrences(routine, isStarted), now))
      .filter((occurrence) => (occurrence.date >= from && occurrence.date <= to) || also(occurrence))
      .sort((a, b) => (a.date === b.date ? (a.time === b.time ? 0 : a.time < b.time ? -1 : 1) : a.date < b.date ? -1 : 1))
      .map((occurrence) => ({ ...occurrence, contents: occurrence.contents.filter((content) => isPlannable(content.sessionId)) }))
      .filter((occurrence) => occurrence.contents.length > 0);
  }
}
