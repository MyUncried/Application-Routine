import { addDays, daysBetween, type LocalDate } from "@/domain/planning/Routine";
import { planningStrings } from "@/features/planning/planningStrings";

import { programStrings } from "./programStrings";

/**
 * Période d'un programme (D-543, Hermann, 23/11/2026 ; `docs/DSF-PROGRAMMES-2026-11-23.md` § 1) — module pur.
 *
 * - Mode dates : « Du [date] au [date] » ; information « N jours, soit S semaines [et J jour(s)] » (moins d'une semaine :
 *   « N jours » seul).
 * - Mode durée : « Du [date] pendant [N] [jours / semaines / mois] » ; information « Se termine le 14 décembre 2026 ».
 * - Fin comprise : jours et semaines = début + N − 1 jour (semaine = 7 jours) ; mois = même quantième du mois suivant moins un
 *   jour, dernier jour du mois si le quantième n'existe pas (31 janvier + 1 mois : 28 février).
 * - Changement de mode sans perte : de dates vers durée, en jours, ou en semaines si le nombre de jours est un multiple de 7.
 * - Bornes : fin ≥ début ; durée ≥ 1.
 *
 * Le mode n'est pas enregistré : le programme garde son début et sa fin (aucun changement de schéma).
 */

export type PeriodMode = "DATES" | "DURATION";
export type DurationUnit = "DAY" | "WEEK" | "MONTH";
export type PeriodDuration = { readonly unit: DurationUnit; readonly count: number };

export const DURATION_UNITS: readonly DurationUnit[] = ["DAY", "WEEK", "MONTH"];
/** Bornes de la roulette du nombre (D-543 : durée ≥ 1). [Interprétation : au plus 520, comme « pendant N » de la planification.] */
export const DURATION_MIN = 1;
export const DURATION_MAX = 520;

function clampCount(count: number): number {
  return Math.max(DURATION_MIN, Math.min(DURATION_MAX, Math.floor(count)));
}

function daysInMonth(year: number, month: number): number {
  // `month` de 1 à 12 ; le jour 0 du mois suivant est le dernier jour du mois.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Fin comprise d'une durée commençant à `start`. */
export function durationEnd(start: LocalDate, duration: PeriodDuration): LocalDate {
  const count = clampCount(duration.count);
  if (duration.unit === "DAY") return addDays(start, count - 1);
  if (duration.unit === "WEEK") return addDays(start, count * 7 - 1);
  const [year, month, day] = start.split("-").map(Number) as [number, number, number];
  const index = month - 1 + count;
  const targetYear = year + Math.floor(index / 12);
  const targetMonth = (index % 12) + 1;
  const last = daysInMonth(targetYear, targetMonth);
  // Quantième absent du mois d'arrivée : dernier jour de ce mois (31 janvier + 1 mois : 28 février).
  if (day > last) return `${targetYear}-${pad(targetMonth)}-${pad(last)}`;
  return addDays(`${targetYear}-${pad(targetMonth)}-${pad(day)}`, -1);
}

/** Nombre de jours de la période, fin comprise. */
export function periodDayCount(start: LocalDate, end: LocalDate): number {
  return daysBetween(start, end) + 1;
}

/** De dates vers durée : en semaines si le nombre de jours est un multiple de 7, sinon en jours. */
export function durationFromDates(start: LocalDate, end: LocalDate): PeriodDuration {
  const days = Math.max(1, periodDayCount(start, end));
  return days % 7 === 0 ? { unit: "WEEK", count: clampCount(days / 7) } : { unit: "DAY", count: clampCount(days) };
}

/** Borne : la fin ne précède pas le début. */
export function boundedEnd(start: LocalDate, end: LocalDate): LocalDate {
  return end < start ? start : end;
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many.replace("{count}", String(count));
}

/** Libellé de l'unité accordé au nombre : « jour » / « jours », « semaine(s) », « mois ». */
export function unitLabel(unit: DurationUnit, count: number): string {
  const t = programStrings.period.units[unit];
  return count === 1 ? t.one : t.many;
}

/** Mode dates : « 92 jours, soit 13 semaines et 1 jour » ; « 91 jours, soit 13 semaines » ; « 5 jours ». */
export function datesInfoLine(start: LocalDate, end: LocalDate): string {
  const t = programStrings.period;
  const days = periodDayCount(start, end);
  const total = plural(days, t.daysOne, t.daysMany);
  if (days < 7) return total;
  const weeks = Math.floor(days / 7);
  const rest = days % 7;
  const weeksLabel = plural(weeks, t.weeksOne, t.weeksMany);
  const line = t.datesInfo.replace("{days}", total).replace("{weeks}", weeksLabel);
  return rest === 0 ? line : t.datesInfoRest.replace("{line}", line).replace("{rest}", plural(rest, t.daysOne, t.daysMany));
}

/** Mode durée : « Se termine le 14 décembre 2026 ». */
export function durationInfoLine(end: LocalDate): string {
  const [year, month, day] = end.split("-").map(Number) as [number, number, number];
  return programStrings.period.endsOn.replace("{date}", `${day === 1 ? "1er" : day} ${planningStrings.months[month - 1] ?? ""} ${year}`);
}
