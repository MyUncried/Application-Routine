import { addDays, formatLocalDate, type LocalDate, type Routine } from "@/domain/planning/Routine";
import {
  programStatus,
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
  | {
      readonly kind: "GRANTED";
      readonly grantedAt: string;
      /** Programmes qui activent le suivi, terminés compris (retrait de l'accord : D-551). */
      readonly programs: readonly Program[];
      /**
       * PROG-CAT-01, point 8 (Hermann, 23/11/2026 : « Oui ») : « Utilisé par N programmes » ne compte que les programmes actifs.
       * [Terminés compris — remplacé.]
       */
      readonly activePrograms: readonly Program[];
    };

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

  /**
   * Cartes du catalogue : programmes avec le nombre de planifications et de séances distinctes.
   * D-564 (23/11/2026) : seules comptent les occurrences comprises dans la période du programme — une routine rattachée sans
   * occurrence dans la période n'est pas comptée ; les séances sont celles de ses occurrences de la période. [Toutes les routines
   * rattachées et toutes leurs séances — remplacé.]
   */
  async listSummaries(): Promise<readonly ProgramSummary[]> {
    const [programs, routines] = await Promise.all([this.deps.repository.list(), this.deps.planning.listRoutines()]);
    return Promise.all(
      programs.map(async (program) => {
        const own = routines.filter((routine) => routine.programId === program.id);
        const inPeriod = await this.deps.planning.periodSessionsFor(own, program.startDate, program.endDate);
        const sessions = new Set([...inPeriod.values()].flatMap((ids) => [...ids]));
        return { program, routineCount: inPeriod.size, sessionCount: sessions.size };
      }),
    );
  }

  /** Routines rattachées au programme, dans l'ordre de création. */
  async routinesOf(programId: string): Promise<readonly Routine[]> {
    return (await this.deps.planning.listRoutines()).filter((routine) => routine.programId === programId);
  }

  /**
   * Contre-recette du 23/11/2026 (l) : routines désignées, relues au retour de leur modification (routines rattachées dans la
   * modale, pas encore enregistrées dans le programme) ; une routine supprimée entre-temps est absente.
   */
  async routinesByIds(routineIds: readonly string[]): Promise<readonly Routine[]> {
    if (routineIds.length === 0) return [];
    const wanted = new Set(routineIds);
    return (await this.deps.planning.listRoutines()).filter((routine) => wanted.has(routine.id));
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
  ): Promise<number> {
    let removed = 0;
    for (const routineId of changes.detach) await this.deps.repository.setRoutineProgram(routineId, null);
    for (const { routineId, removeOutside } of changes.attach) {
      await this.deps.repository.setRoutineProgram(routineId, program.id);
      // D-566 « Supprimer » : routine raccourcie quand c'est possible, pour qu'une extension ultérieure recrée les créneaux (d6, 23/11).
      if (removeOutside) removed += await this.deps.planning.removeOutsidePeriod(routineId, program.startDate, program.endDate);
    }
    return removed;
  }

  /**
   * D-543 (23/11/2026, DSF Programmes § 1, chantier A du lot 4) : « Raccourcir la période : si des créneaux d'une planification
   * dépassent la nouvelle fin, confirmation « N créneaux seront supprimés » ». Créneaux à venir des routines données entre la
   * nouvelle fin (exclue) et l'ancienne (incluse) ; les créneaux déjà hors de l'ancienne période ne sont pas comptés.
   * Délègue à `PlanningService.periodSlotCountsFor` (aucune règle d'occurrence réécrite).
   */
  async shortenedSlotCount(routineIds: readonly string[], previousEnd: LocalDate, nextEnd: LocalDate): Promise<number> {
    if (nextEnd >= previousEnd || routineIds.length === 0) return 0;
    const routines = await this.routinesByIds(routineIds);
    const counts = await this.deps.planning.periodSlotCountsFor(routines, addDays(nextEnd, 1), previousEnd);
    let total = 0;
    for (const count of counts.values()) total += count.inside;
    return total;
  }

  /** D-543 : suppression confirmée des créneaux comptés par `shortenedSlotCount` (`PlanningService.removeUpcomingSlots`). */
  async removeShortenedSlots(routineIds: readonly string[], previousEnd: LocalDate, nextEnd: LocalDate): Promise<number> {
    if (nextEnd >= previousEnd) return 0;
    let removed = 0;
    for (const routineId of routineIds) removed += await this.deps.planning.removeUpcomingSlots(routineId, (date) => date > nextEnd && date <= previousEnd);
    return removed;
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
    // Lot 4 (D-564) : « Garder les routines dans le calendrier » n'est proposé que si une routine a des créneaux à venir dans la
    // période — ceux d'en dehors restent dans le calendrier quel que soit le choix. [Créneaux à venir de toute la routine — remplacé.]
    const counts = await this.deps.planning.periodSlotCountsFor(routines, program.startDate, program.endDate);
    for (const routine of routines) {
      slotCount += counts.get(routine.id)?.unstartedInside ?? 0;
      if ((counts.get(routine.id)?.inside ?? 0) > 0) canKeepRoutines = true;
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
    const today = formatLocalDate(this.deps.now());
    return { kind: "GRANTED", grantedAt, programs, activePrograms: programs.filter((program) => programStatus(program, today) === "ACTIVE") };
  }

  /**
   * D-427 / D-577 (27/11/2026) : option douleur du lancement d'une occurrence de routine. Vraie seulement si la routine est
   * rattachée à un Programme dont le suivi de la douleur est actif et si la date de l'occurrence (déplacée à la main, sinon d'origine)
   * est dans la période du Programme (même règle que le rattachement de l'exécution, D-564). Un lancement hors Agenda reste standard
   * (D-427) : l'appelant ne la demande que pour une occurrence d'origine. Lecture seule.
   */
  async painOptionFor(routineId: string, occurrenceKey: string): Promise<boolean> {
    const found = await this.deps.planning.getOccurrence(routineId, occurrenceKey);
    const programId = found?.routine.programId ?? null;
    if (found === null || programId === null) return false;
    const program = await this.deps.repository.get(programId);
    if (program === null || !program.painTracking) return false;
    const date = found.occurrence.date;
    return date >= program.startDate && date <= program.endDate;
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
