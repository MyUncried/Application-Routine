import type { LocalDate, Routine } from "@/domain/planning/Routine";
import {
  validateProgramDraft,
  type Program,
  type ProgramDraft,
  type ProgramValidationIssue,
} from "@/domain/programs/Program";
import type { ProgramRepository } from "@/domain/programs/ProgramRepository";
import type { PlanningService } from "@/features/planning/PlanningService";
import type { RoutineFilterChoice } from "@/features/planning/RoutineFilterSheet";

/**
 * `ProgramService` (PROG-CAT-01, 21/11/2026) — catalogue, création, configuration et suppression des programmes (CE-PROG-01 à
 * 03) ; état du suivi de la douleur pour Profil › Confidentialité (CE-PRF-01). Spécification
 * `docs/KODJO-Programme-catalogue-creation-configuration-2026-11-20.md`, D-543 à D-552, décisions de Hermann du 21/11/2026.
 *
 * La suppression des routines n'est pas réécrite : « Supprimer avec ses routines » applique à chaque routine la règle du
 * Journal (`PlanningService.deleteRoutine`, D-537 / D-540).
 */

export type SaveProgramResult =
  | { readonly status: "SAVED"; readonly program: Program }
  | { readonly status: "INVALID"; readonly issues: readonly ProgramValidationIssue[] }
  | { readonly status: "NOT_FOUND" };

/** Ligne d'une carte du catalogue (CE-PROG-01) : « N planifications · N séances » (Hermann, 21/11/2026, point 2). */
export type ProgramSummary = {
  readonly program: Program;
  /** Routines rattachées. */
  readonly routineCount: number;
  /** Séances distinctes dans les routines rattachées. */
  readonly sessionCount: number;
};

/**
 * Suppression (D-547, CE-PROG-03 ; Hermann, 21/11/2026, point 3) :
 * - `history` : au moins une exécution enregistre ce programme (référence figée sur l'exécution) ;
 * - `slotCount` : créneaux non commencés que « Supprimer avec ses routines » supprimera (règle du Journal, routine par routine) ;
 * - `canKeepRoutines` : au moins une routine rattachée a des créneaux à venir (bouton « Garder les routines dans le calendrier »).
 */
export type ProgramDeletionPlan = {
  readonly history: boolean;
  readonly slotCount: number;
  readonly canKeepRoutines: boolean;
};

export type ProgramDeletionMode = "WITH_ROUTINES" | "KEEP_ROUTINES";

/** Feuille « Rattacher » : choix du filtre des routines, avec les créneaux à venir dans la période et hors de celle-ci (D-566). */
export type AttachChoice = RoutineFilterChoice & { readonly period: { readonly inside: number; readonly outside: number } };

/** Profil › Confidentialité (D-551) : état déduit des programmes. */
export type PainTrackingState =
  | { readonly kind: "NONE" }
  | { readonly kind: "GRANTED"; readonly grantedAt: string; readonly programs: readonly Program[] };

export type ProgramServiceDeps = {
  readonly repository: ProgramRepository;
  readonly planning: PlanningService;
  readonly newId: () => string;
  readonly now: () => Date;
};

export class ProgramService {
  constructor(private readonly deps: ProgramServiceDeps) {}

  private stamp(): string {
    return this.deps.now().toISOString();
  }

  listPrograms(): Promise<readonly Program[]> {
    return this.deps.repository.list();
  }

  getProgram(programId: string): Promise<Program | null> {
    return this.deps.repository.get(programId);
  }

  /** Cartes du catalogue : programmes avec le nombre de planifications et de séances distinctes. */
  async listSummaries(): Promise<readonly ProgramSummary[]> {
    const [programs, routines] = await Promise.all([this.deps.repository.list(), this.deps.planning.listRoutines()]);
    return programs.map((program) => {
      const own = routines.filter((routine) => routine.programId === program.id);
      const sessions = new Set(own.flatMap((routine) => routine.entries.map((entry) => entry.sessionId)));
      return { program, routineCount: own.length, sessionCount: sessions.size };
    });
  }

  /** Routines rattachées au programme, dans l'ordre de création. */
  async routinesOf(programId: string): Promise<readonly Routine[]> {
    return (await this.deps.planning.listRoutines()).filter((routine) => routine.programId === programId);
  }

  /** « Rattacher une routine existante » (D-549) : routines du calendrier qui n'appartiennent à aucun programme. */
  async unattachedRoutines(): Promise<readonly Routine[]> {
    return (await this.deps.planning.listRoutines()).filter((routine) => routine.programId === undefined || routine.programId === null);
  }

  async createProgram(draft: ProgramDraft): Promise<SaveProgramResult> {
    const issues = validateProgramDraft(draft);
    if (issues.length > 0 || draft.startDate === null || draft.endDate === null) return { status: "INVALID", issues };
    const at = this.stamp();
    const program: Program = {
      id: this.deps.newId(),
      name: draft.name.trim(),
      objective: draft.objective.trim() === "" ? null : draft.objective.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate,
      painTracking: draft.painTracking,
      terminatedAt: null,
      createdAt: at,
      updatedAt: at,
    };
    await this.deps.repository.save(program);
    return { status: "SAVED", program };
  }

  async updateProgram(programId: string, draft: ProgramDraft): Promise<SaveProgramResult> {
    const issues = validateProgramDraft(draft);
    if (issues.length > 0 || draft.startDate === null || draft.endDate === null) return { status: "INVALID", issues };
    const stored = await this.deps.repository.get(programId);
    if (stored === null) return { status: "NOT_FOUND" };
    const program: Program = {
      ...stored,
      name: draft.name.trim(),
      objective: draft.objective.trim() === "" ? null : draft.objective.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate,
      painTracking: draft.painTracking,
      updatedAt: this.stamp(),
    };
    await this.deps.repository.save(program);
    return { status: "SAVED", program };
  }

  /** D-549 : rattacher une routine existante. */
  attachRoutine(routineId: string, programId: string): Promise<void> {
    return this.deps.repository.setRoutineProgram(routineId, programId);
  }

  /**
   * « Rattacher des routines existantes » (recette du 23/11/2026, p4-rattacher) : routines proposées — sans programme, ou retirées
   * du programme dans la modale en cours (`released`) — hors celles déjà rattachées dans la modale (`excluded`). Même liste et
   * même ordre que le filtre des routines de l'Agenda (`routineFilterChoices`), avec les créneaux à venir dans la période du
   * programme et hors de celle-ci (D-566).
   */
  async attachChoices(
    period: { readonly start: LocalDate; readonly end: LocalDate },
    excluded: ReadonlySet<string>,
    released: ReadonlySet<string>,
  ): Promise<readonly AttachChoice[]> {
    const choices = (await this.deps.planning.routineFilterChoices()).filter(
      (choice) =>
        !excluded.has(choice.routine.id) &&
        (choice.routine.programId === undefined || choice.routine.programId === null || released.has(choice.routine.id)),
    );
    const counts = await this.deps.planning.periodSlotCountsFor(
      choices.map((choice) => choice.routine),
      period.start,
      period.end,
    );
    return choices.map((choice) => ({ ...choice, period: counts.get(choice.routine.id) ?? { inside: 0, outside: 0 } }));
  }

  /**
   * Coche de la modale du programme (recette du 23/11/2026, p4-croix — Hermann : « La croix doit tout annuler ») : les retraits et
   * rattachements faits dans la modale ne sont écrits qu'ici. D-566 : `removeOutside` — « Supprimer » choisi au rattachement, les
   * créneaux à venir hors de la période sont retirés ; sinon (« Garder dans le calendrier ») ils restent, hors programme.
   */
  async applyRoutineChanges(
    program: Program,
    changes: { readonly detach: readonly string[]; readonly attach: readonly { readonly routineId: string; readonly removeOutside: boolean }[] },
  ): Promise<void> {
    for (const routineId of changes.detach) await this.deps.repository.setRoutineProgram(routineId, null);
    for (const { routineId, removeOutside } of changes.attach) {
      await this.deps.repository.setRoutineProgram(routineId, program.id);
      if (removeOutside) await this.deps.planning.removeUpcomingSlots(routineId, (date) => date < program.startDate || date > program.endDate);
    }
  }

  /**
   * Croix de la modale (p4-croix) : les routines planifiées depuis la modale sont supprimées (règle du Journal), puis le programme
   * créé dans la modale, enregistré avant « + Planifier une séance », est supprimé.
   */
  async discardModalWork(createdRoutineIds: readonly string[], createdProgramId: string | null): Promise<void> {
    for (const routineId of createdRoutineIds) await this.deps.planning.deleteRoutine(routineId);
    if (createdProgramId === null) return;
    await this.deps.repository.detachAll(createdProgramId);
    if ((await this.deps.repository.executionCount(createdProgramId)) === 0) await this.deps.repository.delete(createdProgramId);
  }

  /** D-549 : glisser une routine à gauche la retire du programme sans la supprimer. */
  detachRoutine(routineId: string): Promise<void> {
    return this.deps.repository.setRoutineProgram(routineId, null);
  }

  async deletionPlan(programId: string): Promise<ProgramDeletionPlan | null> {
    const program = await this.deps.repository.get(programId);
    if (program === null) return null;
    const routines = await this.routinesOf(programId);
    let slotCount = 0;
    let canKeepRoutines = false;
    // D-564 (23/11/2026) : « Supprimer avec ses routines » ne supprime que les créneaux compris dans la période — non commencés,
    // selon la règle du Journal ; ceux d'avant ou d'après la période restent.
    const counts = await this.deps.planning.periodSlotCountsFor(routines, program.startDate, program.endDate);
    for (const routine of routines) {
      slotCount += counts.get(routine.id)?.unstartedInside ?? 0;
      if (!canKeepRoutines && (await this.deps.planning.upcomingSlotCount(routine.id)) > 0) canKeepRoutines = true;
    }
    return { history: (await this.deps.repository.executionCount(programId)) > 0, slotCount, canKeepRoutines };
  }

  /**
   * D-547, CE-PROG-03 ; Hermann, 21/11/2026, point 3.
   * - `WITH_ROUTINES` : chaque routine suit la règle de suppression du Journal (`PlanningService.deleteRoutine`).
   * - `KEEP_ROUTINES` : toutes les routines sont détachées, historique compris ; aucun créneau supprimé.
   * Puis le programme passe en Terminé s'il a un historique, sinon il est supprimé.
   * Résultat : `DELETED` ou `TERMINATED` ; `null` : programme introuvable.
   */
  async deleteProgram(programId: string, mode: ProgramDeletionMode): Promise<"DELETED" | "TERMINATED" | null> {
    const program = await this.deps.repository.get(programId);
    if (program === null) return null;
    if (mode === "WITH_ROUTINES") {
      // D-564 (23/11/2026) : seuls les créneaux de la période sont supprimés (non commencés, règle du Journal) ; une routine sans
      // historique dont tous les créneaux sont dans la période est supprimée entière. [Avant : règle du Journal appliquée à toute
      // la routine.]
      const routines = await this.routinesOf(programId);
      const counts = await this.deps.planning.periodSlotCountsFor(routines, program.startDate, program.endDate);
      const within = (date: LocalDate) => date >= program.startDate && date <= program.endDate;
      for (const routine of routines) {
        const plan = await this.deps.planning.deletionPlan(routine.id);
        if (plan !== null && !plan.history && plan.count === (counts.get(routine.id)?.unstartedInside ?? 0)) await this.deps.planning.deleteRoutine(routine.id);
        else await this.deps.planning.removeUpcomingSlots(routine.id, within, { includePast: true });
      }
    } else {
      await this.deps.repository.detachAll(programId);
    }
    if ((await this.deps.repository.executionCount(programId)) === 0) {
      // Routines gardées pour leurs créneaux hors période (D-564) : elles ne désignent plus le programme supprimé.
      await this.deps.repository.detachAll(programId);
      await this.deps.repository.delete(programId);
      return "DELETED";
    }
    const at = this.stamp();
    await this.deps.repository.save({ ...program, terminatedAt: program.terminatedAt ?? at, updatedAt: at });
    return "TERMINATED";
  }

  /** D-551 : date d'accord au suivi de la douleur ; `null` : aucun accord (la feuille de consentement s'ouvre). */
  painConsentAt(): Promise<string | null> {
    return this.deps.repository.painConsentAt();
  }

  /** D-551 : « Autoriser » enregistre l'accord, valable pour toute l'application. */
  async grantPainConsent(): Promise<string> {
    const at = this.stamp();
    await this.deps.repository.setPainConsentAt(at);
    return at;
  }

  /** D-551 : « Retirer mon accord » efface l'accord et désactive le suivi dans tous les programmes. */
  async withdrawPainConsent(): Promise<void> {
    await this.deps.repository.setPainConsentAt(null);
    await this.deps.repository.disablePainTrackingEverywhere(this.stamp());
  }

  /** Profil › Confidentialité : sans accord, « non utilisé » ; avec, date d'accord et programmes qui activent le suivi. */
  async painTrackingState(): Promise<PainTrackingState> {
    const grantedAt = await this.deps.repository.painConsentAt();
    if (grantedAt === null) return { kind: "NONE" };
    const programs = (await this.deps.repository.list()).filter((program) => program.painTracking);
    return { kind: "GRANTED", grantedAt, programs };
  }

  /**
   * Relevés de douleur : la saisie pendant l'exécution n'existe pas encore (hors périmètre PROG-CAT-01) ; aucun relevé n'est
   * enregistré. « Effacer mes relevés » reste grisé tant que ce nombre est nul (Hermann, 21/11/2026, point 4).
   */
  painReadingCount(): Promise<number> {
    return Promise.resolve(0);
  }

  /** Effacement des relevés (confirmation développée, Hermann, 21/11/2026, point 4) : aucun stockage de relevés aujourd'hui. */
  erasePainReadings(): Promise<void> {
    return Promise.resolve();
  }

  /** Aujourd'hui en date locale, pour le statut calculé. */
  today(): LocalDate {
    const now = this.deps.now();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
}
