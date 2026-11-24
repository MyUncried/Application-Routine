import { addDays, daysBetween, type LocalDate } from "@/domain/planning/Routine";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { strings } from "@/shared/i18n";

import { dayOfMonthLabel } from "./programPresentation";

/**
 * Période d'un programme (D-543, Hermann, 23/11/2026 ; `docs/DSF-PROGRAMMES-2026-11-23.md` § 1) — module pur.
 *
 * - Mode dates : « Du [date] au [date] » ; information « N jours, soit S semaines [et J jour(s)] » (moins d'une semaine :
 *   « N jours » seul).
 * - Mode durée : « Du [date] pendant [N] [jours / semaines / mois] » ; information selon l'unité (lot 5, 23/11/2026, y3) : jours
 *   « Se termine le 14 décembre 2026 » ; semaines « 21 jours, se termine le … » ; mois « 13 semaines, se termine le … ».
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

/**
 * Lot 6, 23/11/2026 (y4 — Hermann : « Comme pour la planification, lorsqu'on passe de jour à semaine ou mois, convertir
 * automatiquement la valeur ») : plus petite durée dans l'unité `unit` qui couvre la période en cours (comme `countUntil` de
 * la planification, qui compte les semaines touchées). [Arrondi au-dessus : interprétation.]
 */
export function durationCovering(start: LocalDate, end: LocalDate, unit: DurationUnit): PeriodDuration {
  const days = Math.max(1, periodDayCount(start, end));
  if (unit === "DAY") return { unit, count: clampCount(days) };
  if (unit === "WEEK") return { unit, count: clampCount(Math.ceil(days / 7)) };
  let count = DURATION_MIN;
  while (count < DURATION_MAX && durationEnd(start, { unit, count }) < end) count += 1;
  return { unit, count };
}

/** Borne : la fin ne précède pas le début. */
export function boundedEnd(start: LocalDate, end: LocalDate): LocalDate {
  return end < start ? start : end;
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : fillTemplate(many, { count: String(count) });
}

/** Libellé de l'unité accordé au nombre : « jour » / « jours », « semaine(s) », « mois ». */
export function unitLabel(unit: DurationUnit, count: number): string {
  const t = strings.programs.period.units[unit];
  return count === 1 ? t.one : t.many;
}

/** Mode dates : « 92 jours, soit 13 semaines et 1 jour » ; « 91 jours, soit 13 semaines » ; « 5 jours ». */
export function datesInfoLine(start: LocalDate, end: LocalDate): string {
  const t = strings.programs.period;
  const days = periodDayCount(start, end);
  const total = plural(days, t.daysOne, t.daysMany);
  if (days < 7) return total;
  const weeks = Math.floor(days / 7);
  const rest = days % 7;
  const weeksLabel = plural(weeks, t.weeksOne, t.weeksMany);
  const line = fillTemplate(t.datesInfo, { days: total, weeks: weeksLabel });
  return rest === 0 ? line : fillTemplate(t.datesInfoRest, { line, rest: plural(rest, t.daysOne, t.daysMany) });
}

/**
 * Mode durée (lot 5, 23/11/2026, y3 — Hermann : « Jours : « Se termine le… » ; Semaines : « X jours, se termine le… » ; Mois :
 * « X semaines, se termine le… » ») : jours « Se termine le 14 décembre 2026 » ; semaines « 21 jours, se termine le … » (jours de
 * la période, fin comprise) ; mois « 13 semaines, se termine le … » ([interprétation] semaines entières de la période : jours ÷ 7
 * arrondi à l'unité inférieure). [« Se termine le … » pour toutes les unités — remplacé.]
 */
export function durationInfoLine(start: LocalDate, end: LocalDate, unit: DurationUnit): string {
  const t = strings.programs.period;
  const [year, month, day] = end.split("-").map(Number) as [number, number, number];
  // J1.8 (24/11/2026) : noms de mois complets et ordre des mots du catalogue (« 14 décembre 2026 », « December 14, 2026 »).
  const date = fillTemplate(strings.programs.dates.dayMonthYear, {
    day: dayOfMonthLabel(day),
    month: strings.programs.dates.months[month - 1] ?? "",
    year: String(year),
  });
  if (unit === "DAY") return fillTemplate(t.endsOn, { date });
  const days = periodDayCount(start, end);
  const length = unit === "WEEK" ? plural(days, t.daysOne, t.daysMany) : plural(Math.floor(days / 7), t.weeksOne, t.weeksMany);
  return fillTemplate(t.endsOnAfter, { length, date });
}
