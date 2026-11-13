import { addDays, mondayOf, validateRoutineDraft, type LocalDate, type Routine, type RoutineDraft, type RoutineValidationIssue } from "@/domain/planning/Routine";
import type { RoutineRepository } from "@/domain/planning/RoutineRepository";
import { upcomingOccurrences, type Occurrence } from "@/domain/planning/occurrences";

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
  | { readonly status: "INVALID"; readonly issues: readonly RoutineValidationIssue[] }
  | { readonly status: "NOT_FOUND" };

export type PlanningServiceDeps = {
  readonly repository: RoutineRepository;
  readonly newId: () => string;
  readonly now: () => Date;
};

export class PlanningService {
  constructor(private readonly deps: PlanningServiceDeps) {}

  listRoutines(): Promise<readonly Routine[]> {
    return this.deps.repository.list();
  }

  getRoutine(routineId: string): Promise<Routine | null> {
    return this.deps.repository.get(routineId);
  }

  async createRoutine(draft: RoutineDraft): Promise<SaveRoutineResult> {
    const issues = validateRoutineDraft(draft);
    if (issues.length > 0) return { status: "INVALID", issues };
    const at = this.deps.now().toISOString();
    const routine: Routine = {
      id: this.deps.newId(),
      startDate: draft.startDate,
      time: draft.time,
      repetition: draft.repetition,
      entries: draft.entries,
      exclusions: [],
      createdAt: at,
      updatedAt: at,
    };
    await this.deps.repository.save(routine);
    return { status: "SAVED", routine };
  }

  async updateRoutine(routineId: string, draft: RoutineDraft): Promise<SaveRoutineResult> {
    const issues = validateRoutineDraft(draft);
    if (issues.length > 0) return { status: "INVALID", issues };
    const existing = await this.deps.repository.get(routineId);
    if (existing === null) return { status: "NOT_FOUND" };
    const routine: Routine = {
      ...existing,
      startDate: draft.startDate,
      time: draft.time,
      repetition: draft.repetition,
      entries: draft.entries,
      exclusions: existing.exclusions,
      updatedAt: this.deps.now().toISOString(),
    };
    await this.deps.repository.save(routine);
    return { status: "SAVED", routine };
  }

  deleteRoutine(routineId: string): Promise<boolean> {
    return this.deps.repository.delete(routineId);
  }

  excludeOccurrence(routineId: string, occurrenceKey: string): Promise<boolean> {
    return this.deps.repository.addExclusion(routineId, occurrenceKey, this.deps.now().toISOString());
  }

  /** RM-123 : brouillon de duplication — liste ordonnée, motifs et paramètres ; nouvelles identités d'entrée. */
  async prepareDuplicate(routineId: string): Promise<RoutineDraft | null> {
    const routine = await this.deps.repository.get(routineId);
    if (routine === null) return null;
    return {
      startDate: routine.startDate,
      time: routine.time,
      repetition: routine.repetition,
      entries: routine.entries.map((entry) => ({ ...entry, id: this.deps.newId() })),
    };
  }

  /**
   * Occurrences futures de la semaine contenant `anyDayOfWeek` (lundi → dimanche). `isPlannable` écarte les
   * contenus dont la Séance n'est plus active ou n'existe plus ; une occurrence sans contenu restant disparaît.
   */
  async weekOccurrences(anyDayOfWeek: LocalDate, isPlannable: (sessionId: string) => boolean): Promise<readonly Occurrence[]> {
    const monday = mondayOf(anyDayOfWeek);
    const routines = await this.deps.repository.list();
    return upcomingOccurrences(routines, monday, addDays(monday, 6), this.deps.now())
      .map((occurrence) => ({ ...occurrence, contents: occurrence.contents.filter((content) => isPlannable(content.sessionId)) }))
      .filter((occurrence) => occurrence.contents.length > 0);
  }
}
