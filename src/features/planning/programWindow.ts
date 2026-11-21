import { endDateForCount, type LocalDate } from "@/domain/planning/Routine";

import { END_COUNT_MAX, END_COUNT_MIN, withEndCount, withEndDate, withStartDate, type FormDraft, type RepetitionUnit } from "./planningDraft";

/**
 * Fenêtre d'un programme dans la planification (ch04, « Le Programme » : « La fenêtre du programme borne les dates qui le
 * suivent » ; décision de Hermann du 21/11/2026, point 5 : programme présélectionné et non modifiable, dates bornées par la
 * période, valeur maximale de « pendant N » calculée pour que la fin ne dépasse jamais la date de fin du programme, aucun
 * message). Module pur.
 */
export type ProgramWindow = { readonly start: LocalDate; readonly end: LocalDate };

/** Plus petite date de « Début le » : aujourd'hui ou le début du programme, sans dépasser sa fin. */
export function windowStartMinimum(window: ProgramWindow, today: LocalDate): LocalDate {
  const minimum = window.start > today ? window.start : today;
  return minimum > window.end ? window.end : minimum;
}

/** Plus grand « pendant N » dont la dernière date reste dans la fenêtre (au moins 1). */
export function maxEndCount(unit: RepetitionUnit, startDate: LocalDate, windowEnd: LocalDate): number {
  let low = END_COUNT_MIN;
  let high = END_COUNT_MAX;
  if (endDateForCount(unit, startDate, high) <= windowEnd) return high;
  // Recherche dichotomique : la dernière date croît avec N.
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (endDateForCount(unit, startDate, middle) <= windowEnd) low = middle;
    else high = middle - 1;
  }
  return low;
}

/**
 * Brouillon ramené dans la fenêtre : « Début le » entre le minimum et la fin du programme ; « jusqu'au » au plus la fin ;
 * « pendant » au plus `maxEndCount`. Rend le même objet s'il est déjà dans la fenêtre.
 */
export function withinWindow(form: FormDraft, window: ProgramWindow, today: LocalDate): FormDraft {
  const minimum = windowStartMinimum(window, today);
  let next = form;
  if (next.startDate < minimum) next = withStartDate(next, minimum);
  else if (next.startDate > window.end) next = withStartDate(next, window.end);
  if (next.endKind === "UNTIL" && next.endDate > window.end) next = withEndDate(next, window.end);
  if (next.endKind === "FOR") {
    const max = maxEndCount(next.unit, next.startDate, window.end);
    if (next.endCount > max) next = withEndCount(next, max);
  }
  return next;
}
