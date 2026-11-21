import type { LocalDate, LocalTime, Routine } from "@/domain/planning/Routine";
import { programPhase, programStatus, type Program, type ProgramStatus } from "@/domain/programs/Program";
import { formatRecurrence } from "@/features/planning/planningSummary";

import type { ProgramDeletionPlan, ProgramSummary } from "./ProgramService";
import { programStrings } from "./programStrings";

/** Présentation des programmes (PROG-CAT-01) — module pur. */

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."] as const;
/** Figma « PROG — 7 » : « 15 sept.   ·   En cours » — séparateur à trois espaces de part et d'autre. */
export const CARD_SEPARATOR = "   ·   ";

function parts(date: LocalDate): { day: number; month: string; year: string } {
  const [year, month, day] = date.split("-");
  return { day: Number(day), month: MONTHS[Number(month) - 1] ?? "", year: year ?? "" };
}

/** « 15 sept. », « 1er nov. » (Figma « PROG — 7 »). */
export function formatDayMonth(date: LocalDate): string {
  const { day, month } = parts(date);
  return `${day === 1 ? "1er" : day} ${month}`;
}

/** « 15 sept. 2026 » (Figma « PROG — 13 », carte Période ; « Accordé le 20 nov. 2026 »). */
export function formatDayMonthYear(date: LocalDate): string {
  const { year } = parts(date);
  return `${formatDayMonth(date)} ${year}`;
}

/** Période de la carte : « 15 sept. – 15 déc. ». */
export function formatPeriod(program: Pick<Program, "startDate" | "endDate">): string {
  return `${formatDayMonth(program.startDate)} – ${formatDayMonth(program.endDate)}`;
}

/** Ligne 2 de la carte : « période · statut » (CE-PROG-01). */
export function cardStatusLine(program: Program, today: LocalDate): string {
  return `${formatPeriod(program)}${CARD_SEPARATOR}${programStrings.catalogue.phase[programPhase(program, today)]}`;
}

/** Ligne 3 de la carte : « N planifications · N séances » (Hermann, 21/11/2026, point 2). */
export function cardCountsLine(summary: Pick<ProgramSummary, "routineCount" | "sessionCount">): string {
  const t = programStrings.catalogue;
  const routines = summary.routineCount === 1 ? t.routinesOne : t.routinesMany.replace("{count}", String(summary.routineCount));
  const sessions = summary.sessionCount === 1 ? t.sessionsOne : t.sessionsMany.replace("{count}", String(summary.sessionCount));
  return `${routines}${CARD_SEPARATOR}${sessions}`;
}

export type ProgramCounts = { readonly ACTIVE: number; readonly TERMINATED: number };

export function programCounts(programs: readonly Pick<Program, "endDate" | "terminatedAt">[], today: LocalDate): ProgramCounts {
  let active = 0;
  for (const program of programs) if (programStatus(program, today) === "ACTIVE") active += 1;
  return { ACTIVE: active, TERMINATED: programs.length - active };
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr").trim();
}

/** Liste affichée : statut choisi (Actifs par défaut, D-545), puis recherche sur le nom et l'objectif. */
export function visiblePrograms(
  summaries: readonly ProgramSummary[],
  status: ProgramStatus,
  query: string,
  today: LocalDate,
): readonly ProgramSummary[] {
  const key = normalize(query);
  return summaries.filter(
    (summary) =>
      programStatus(summary.program, today) === status &&
      (key === "" || normalize(summary.program.name).includes(key) || normalize(summary.program.objective ?? "").includes(key)),
  );
}

/** « 14 h », « 8 h 30 » (Figma « PROG — 13 » : « tous les jours, 14 h »). */
export function formatHour(time: LocalTime): string {
  const [hours, minutes] = time.split(":").map(Number);
  return minutes === 0 ? `${hours} h` : `${hours} h ${String(minutes).padStart(2, "0")}`;
}

/**
 * Ligne d'une routine dans la modale : « créneau · N contenus » (CE-PROG-02 ; Figma : « tous les jours, 14 h · 2 contenus »).
 * [Interprétation : créneau unique → « le 18 nov., 14 h ».]
 */
export function routineSlotLine(routine: Pick<Routine, "repetition" | "startDate" | "time" | "entries">): string {
  const recurrence = formatRecurrence(routine);
  const when = recurrence === "" ? `le ${formatDayMonth(routine.startDate)}` : recurrence.charAt(0).toLocaleLowerCase("fr") + recurrence.slice(1);
  const t = programStrings.sheet;
  const contents = routine.entries.length === 1 ? t.contentsOne : t.contentsMany.replace("{count}", String(routine.entries.length));
  return `${when}, ${formatHour(routine.time)}  ·  ${contents}`;
}

/**
 * Message de la confirmation (CE-PROG-03) : « N créneaux non commencés seront supprimés. Le programme sera terminé. » ; sans
 * créneau, la seule conséquence sur le programme ; sans historique, « Le programme sera supprimé. » [interprétation].
 */
export function deletionMessage(plan: ProgramDeletionPlan): string {
  const t = programStrings.deletion;
  const outcome = plan.history ? t.terminated : t.deleted;
  if (plan.slotCount === 0) return outcome;
  const slots = plan.slotCount === 1 ? t.slotsOne : t.slotsMany.replace("{count}", String(plan.slotCount));
  return `${slots} ${outcome}`;
}

/** « Utilisé par 1 programme · Rééducation genou » (Figma `12839:4036`). */
export function usedByLine(programs: readonly Pick<Program, "name">[]): string {
  const t = programStrings.privacy;
  if (programs.length === 0) return t.usedByNone;
  const names = programs.map((program) => program.name).join(", ");
  return programs.length === 1 ? t.usedByOne.replace("{names}", names) : t.usedByMany.replace("{count}", String(programs.length)).replace("{names}", names);
}
