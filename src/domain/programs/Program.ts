import type { LocalDate } from "@/domain/planning/Routine";

/**
 * Programme (PROG-CAT-01, 21/11/2026 ; spécification `docs/KODJO-Programme-catalogue-creation-configuration-2026-11-20.md` ;
 * D-543 à D-552 ; décisions de Hermann du 21/11/2026).
 *
 * - Un programme contient des routines (rattachement facultatif, `Routine.programId`) ; aucune personne ne lui est affectée
 *   (D-550).
 * - Statut calculé, jamais stocké : Terminé si `terminatedAt` est renseigné (suppression avec un historique, D-547) ou si la
 *   date de fin est passée ; sinon Actif (en cours ou à venir, D-545).
 * - Suivi de la douleur (D-551) : interrupteur par programme ; l'accord est porté par l'utilisateur.
 */
export type Program = {
  readonly id: string;
  readonly name: string;
  /** Facultatif ; `null` : aucun. */
  readonly objective: string | null;
  readonly startDate: LocalDate;
  readonly endDate: LocalDate;
  readonly painTracking: boolean;
  /** Programme terminé par une suppression avec historique (D-547) ; `null` sinon. */
  readonly terminatedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/** Brouillon de la modale « Créer ou configurer un programme » (CE-PROG-02) : dates absentes tant qu'elles ne sont pas choisies. */
export type ProgramDraft = {
  readonly name: string;
  readonly objective: string;
  readonly startDate: LocalDate | null;
  readonly endDate: LocalDate | null;
  readonly painTracking: boolean;
};

export type ProgramStatus = "ACTIVE" | "TERMINATED";
/** Phase affichée sur la carte (Figma « PROG — 7 ») : « En cours », « À venir » ou « Terminé ». */
export type ProgramPhase = "IN_PROGRESS" | "UPCOMING" | "TERMINATED";

export function programStatus(program: Pick<Program, "endDate" | "terminatedAt">, today: LocalDate): ProgramStatus {
  return program.terminatedAt !== null || program.endDate < today ? "TERMINATED" : "ACTIVE";
}

export function programPhase(program: Pick<Program, "startDate" | "endDate" | "terminatedAt">, today: LocalDate): ProgramPhase {
  if (programStatus(program, today) === "TERMINATED") return "TERMINATED";
  return program.startDate > today ? "UPCOMING" : "IN_PROGRESS";
}

export type ProgramValidationIssue = "NAME_REQUIRED" | "START_REQUIRED" | "END_REQUIRED" | "END_BEFORE_START";

/** D-499 / CE-PROG-02 : la coche est active quand le nom, la date de début et la date de fin sont renseignés et cohérents. */
export function validateProgramDraft(draft: ProgramDraft): ProgramValidationIssue[] {
  const issues: ProgramValidationIssue[] = [];
  if (draft.name.trim() === "") issues.push("NAME_REQUIRED");
  if (draft.startDate === null) issues.push("START_REQUIRED");
  if (draft.endDate === null) issues.push("END_REQUIRED");
  if (draft.startDate !== null && draft.endDate !== null && draft.endDate < draft.startDate) issues.push("END_BEFORE_START");
  return issues;
}

export function emptyProgramDraft(): ProgramDraft {
  return { name: "", objective: "", startDate: null, endDate: null, painTracking: false };
}

export function draftFromProgram(program: Program): ProgramDraft {
  return {
    name: program.name,
    objective: program.objective ?? "",
    startDate: program.startDate,
    endDate: program.endDate,
    painTracking: program.painTracking,
  };
}

/** Suffixe de la copie (mission PROG-CAT-01 : « nom suivi de « (copie) » »). */
export const PROGRAM_COPY_SUFFIX = " (copie)";

/**
 * Dupliquer (décision de Hermann du 21/11/2026, classe B : « Dupliquer » crée une copie sans dates ni routines) : nom suivi de
 * « (copie) », objectif et suivi de la douleur repris. [Interprétation technique : les dates étant obligatoires en base, la
 * copie est un brouillon ouvert dans la modale et enregistré par la coche, comme la duplication d'une routine (RM-123).]
 */
export function duplicateProgramDraft(program: Program): ProgramDraft {
  return {
    name: `${program.name}${PROGRAM_COPY_SUFFIX}`,
    objective: program.objective ?? "",
    startDate: null,
    endDate: null,
    painTracking: program.painTracking,
  };
}
