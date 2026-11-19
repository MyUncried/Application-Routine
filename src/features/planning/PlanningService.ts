import { addDays, mondayOf, validateRoutineDraft, type LocalDate, type Routine, type RoutineDraft, type RoutineValidationIssue } from "@/domain/planning/Routine";
import type { RoutineRepository } from "@/domain/planning/RoutineRepository";
import { periodOccurrences, type Occurrence } from "@/domain/planning/occurrences";

/**
 * `PlanningService` (chapitre 12 §12.4) — gestion des Routines et calcul des occurrences (API-ROU-01 à 05, 09).
 *
 * - Créer / modifier : validation globale du brouillon (CE-UI-05 §14), écriture entière de la Routine.
 *   La modification agit sur la Routine (D-022 : pas d'exception d'occurrence) ; les retraits déjà enregistrés
 *   sont conservés ; rien n'est écrit dans l'historique (aucune occurrence passée n'est stockée, D-013).
 * - Supprimer : la Routine (RM-050) — sources et Exécutions conservées.
 * - Retirer une occurrence : R-04, persisté par date/heure d'origine.
 * - Dupliquer : brouillon complet, jamais persisté avant Enregistrer (RM-123, API-ROU-09).
 */

export type SaveRoutineResult =
  | { readonly status: "SAVED"; readonly routine: Routine }
  | { readonly status: "INVALID"; readonly issues: readonly (RoutineValidationIssue | "NAME_TAKEN")[] }
  | { readonly status: "NOT_FOUND" };

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

  listRoutines(): Promise<readonly Routine[]> {
    return this.deps.repository.list();
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
    const existing = await this.deps.repository.get(routineId);
    if (existing === null) return { status: "NOT_FOUND" };
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

  async deleteRoutine(routineId: string): Promise<boolean> {
    return this.written(await this.deps.repository.delete(routineId));
  }

  async excludeOccurrence(routineId: string, occurrenceKey: string): Promise<boolean> {
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
    const routines = await this.deps.repository.list();
    return periodOccurrences(routines, monday, addDays(monday, 6))
      .map((occurrence) => ({ ...occurrence, contents: occurrence.contents.filter((content) => isPlannable(content.sessionId)) }))
      .filter((occurrence) => occurrence.contents.length > 0);
  }
}

/** RM-261 : comparaison des noms sans casse ni espaces de bord. */
export function normalizeRoutineName(name: string): string {
  return name.trim().toLocaleLowerCase("fr-FR");
}
