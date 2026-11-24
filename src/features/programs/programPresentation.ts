import { routineOccurrences } from "@/domain/planning/occurrences";
import { daysBetween, type LocalDate, type LocalTime, type Routine } from "@/domain/planning/Routine";
import { withinProgramPeriod } from "@/domain/programs/programMembership";
import { programPhase, programStatus, type Program, type ProgramStatus } from "@/domain/programs/Program";
import { routineLastDate } from "@/features/planning/journal";
import { formatRecurrence } from "@/features/planning/planningSummary";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { strings } from "@/shared/i18n";
import { appLocaleTag } from "@/shared/i18n/locale";

import type { ProgramDeletionPlan, ProgramSummary } from "./ProgramService";

/** Présentation des programmes (PROG-CAT-01) — module pur. */

/** J1.8 (24/11/2026) : noms de mois, ordre des mots et quantième du 1er dans le catalogue (`strings.programs.dates`). */
const d = strings.programs.dates;
/** Figma « PROG — 7 » : « 15 sept.   ·   En cours » — séparateur à trois espaces de part et d'autre. */
export const CARD_SEPARATOR = "   ·   ";

function parts(date: LocalDate): { day: number; month: string; year: string } {
  const [year, month, day] = date.split("-");
  return { day: Number(day), month: d.monthsShort[Number(month) - 1] ?? "", year: year ?? "" };
}

/** Quantième affiché : « 1er » pour le premier jour du mois (« 1er nov. »). */
export function dayOfMonthLabel(day: number): string {
  return day === 1 ? d.firstDay : String(day);
}

/** « 15 sept. », « 1er nov. » (Figma « PROG — 7 »). */
export function formatDayMonth(date: LocalDate): string {
  const { day, month } = parts(date);
  return fillTemplate(d.dayMonth, { day: dayOfMonthLabel(day), month });
}

/** « 15 sept. 2026 » (Figma « PROG — 13 », carte Période ; « Accordé le 20 nov. 2026 »). */
export function formatDayMonthYear(date: LocalDate): string {
  const { day, month, year } = parts(date);
  return fillTemplate(d.dayMonthYear, { day: dayOfMonthLabel(day), month, year });
}

/** Période de la carte : « 15 sept. – 15 déc. ». */
export function formatPeriod(program: Pick<Program, "startDate" | "endDate">): string {
  return fillTemplate(d.period, { start: formatDayMonth(program.startDate), end: formatDayMonth(program.endDate) });
}

/**
 * PROG-CAT-01, point 2 (Figma « PROG — 7 », Hermann 23/11/2026 : « ok » à la proposition) : « semaine N sur M » d'un programme
 * en cours. M = nombre de jours de la période ÷ 7, arrondi au plus proche (92 jours : 13) ; N = semaine en cours comptée depuis
 * le jour de début (jours 1 à 7 : semaine 1), plafonnée à M.
 */
export function programWeek(program: Pick<Program, "startDate" | "endDate">, today: LocalDate): { readonly week: number; readonly total: number } {
  const total = Math.max(1, Math.round((daysBetween(program.startDate, program.endDate) + 1) / 7));
  const week = Math.min(total, Math.max(1, Math.floor(daysBetween(program.startDate, today) / 7) + 1));
  return { week, total };
}

/** Ligne 2 de la carte : « période · statut », et « semaine N sur M » pour un programme en cours (CE-PROG-01). */
export function cardStatusLine(program: Program, today: LocalDate): string {
  const phase = programPhase(program, today);
  const line = `${formatPeriod(program)}${CARD_SEPARATOR}${strings.programs.catalogue.phase[phase]}`;
  if (phase !== "IN_PROGRESS") return line;
  const { week, total } = programWeek(program, today);
  return `${line}${CARD_SEPARATOR}${fillTemplate(strings.programs.catalogue.week, { week: String(week), total: String(total) })}`;
}

/** Ligne 3 de la carte : « N planifications · N séances » (Hermann, 21/11/2026, point 2). */
export function cardCountsLine(summary: Pick<ProgramSummary, "routineCount" | "sessionCount">): string {
  const t = strings.programs.catalogue;
  const routines = summary.routineCount === 1 ? t.routinesOne : fillTemplate(t.routinesMany, { count: String(summary.routineCount) });
  const sessions = summary.sessionCount === 1 ? t.sessionsOne : fillTemplate(t.sessionsMany, { count: String(summary.sessionCount) });
  return `${routines}${CARD_SEPARATOR}${sessions}`;
}

export type ProgramCounts = { readonly ACTIVE: number; readonly TERMINATED: number };

export function programCounts(programs: readonly Pick<Program, "endDate" | "terminatedAt">[], today: LocalDate): ProgramCounts {
  let active = 0;
  for (const program of programs) if (programStatus(program, today) === "ACTIVE") active += 1;
  return { ACTIVE: active, TERMINATED: programs.length - active };
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase(appLocaleTag).trim();
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
  return minutes === 0 ? fillTemplate(d.hour, { hours: String(hours) }) : fillTemplate(d.hourMinutes, { hours: String(hours), minutes: String(minutes).padStart(2, "0") });
}

/**
 * Ligne d'une routine dans la modale : « créneau · N contenus » (CE-PROG-02 ; Figma : « tous les jours, 14 h · 2 contenus »).
 * [Interprétation : créneau unique → « le 18 nov., 14 h ».]
 */
export function routineSlotLine(routine: Pick<Routine, "repetition" | "startDate" | "time" | "entries">): string {
  const recurrence = formatRecurrence(routine);
  const t = strings.programs.sheet;
  const when = recurrence === "" ? fillTemplate(t.onDate, { date: formatDayMonth(routine.startDate) }) : t.recurrenceStart(recurrence);
  const contents = routine.entries.length === 1 ? t.contentsOne : fillTemplate(t.contentsMany, { count: String(routine.entries.length) });
  return `${when}, ${formatHour(routine.time)}  ·  ${contents}`;
}

/** Période du programme en cours de saisie dans la modale : une date absente ne borne pas. */
type DraftPeriod = { readonly startDate: LocalDate | null; readonly endDate: LocalDate | null };

/**
 * Lot 5, 23/11/2026 (point 4, D-544 — Hermann : « la date affichée dans le cadre doit être celle du début de la routine pour le
 * programme ») : cadre de la routine (« 15 sept. » / « 2026 ») = son début, ramené au début du programme s'il le précède.
 * [Date de création de la routine (`creationDateParts`) — remplacée.]
 */
export function routineProgramFrame(routine: Pick<Routine, "startDate">, period: DraftPeriod): { readonly day: string; readonly year: string } {
  const start = period.startDate !== null && period.startDate > routine.startDate ? period.startDate : routine.startDate;
  const { day, month, year } = parts(start);
  return { day: fillTemplate(d.dayMonth, { day: String(day), month }), year };
}

/**
 * Lot 5, 23/11/2026 (point 4, D-544 — Hermann : « Le texte doit afficher le nombre de créneaux dans le programme et la date de
 * fin (jour et mois) » ; « la date de fin de la routine affichée dans le programme ne peut pas excéder la date de fin du
 * programme ») : « 12 créneaux, jusqu'au 15 déc. ». Créneaux = occurrences de la routine (moteur `routineOccurrences`, retraits
 * exclus) comprises dans la période du programme (D-564, `withinProgramPeriod`) ; fin = la plus proche de la dernière date de la
 * routine et de la fin du programme. [« du 15 septembre au 15 décembre » (`routineSpanLine`) — remplacé.]
 */
export function routineProgramLine(routine: Routine, period: DraftPeriod): string {
  const t = strings.programs.sheet;
  const last = routineLastDate(routine);
  const end = period.endDate !== null && period.endDate < last ? period.endDate : last;
  const bounds = { startDate: period.startDate ?? routine.startDate, endDate: end };
  const count = routineOccurrences(routine).filter((occurrence) => withinProgramPeriod(bounds, occurrence.date)).length;
  return fillTemplate(count === 1 ? t.routineSlotsOne : t.routineSlotsMany, { count: String(count), end: formatDayMonth(end) });
}

/**
 * Message de la confirmation (CE-PROG-03) : « N créneaux non commencés seront supprimés. Le programme sera terminé. » ; sans
 * créneau, la seule conséquence sur le programme ; sans historique, « Le programme sera supprimé. » [interprétation].
 */
export function deletionMessage(plan: ProgramDeletionPlan): string {
  const t = strings.programs.deletion;
  const outcome = plan.history ? t.terminated : t.deleted;
  if (plan.slotCount === 0) return outcome;
  const slots = plan.slotCount === 1 ? t.slotsOne : fillTemplate(t.slotsMany, { count: String(plan.slotCount) });
  return `${slots} ${outcome}`;
}

/** « Utilisé par 1 programme · Rééducation genou » (Figma `12839:4036`). */
export function usedByLine(programs: readonly Pick<Program, "name">[]): string {
  const t = strings.programs.privacy;
  if (programs.length === 0) return t.usedByNone;
  const names = programs.map((program) => program.name).join(", ");
  return fillTemplate(programs.length === 1 ? t.usedByOne : t.usedByMany, { count: String(programs.length), names });
}
