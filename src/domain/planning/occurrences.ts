import {
  addDays,
  daysBetween,
  mondayOf,
  occurrenceInstant,
  occurrenceKey,
  weekdayOf,
  type LocalDate,
  type LocalTime,
  type Routine,
} from "./Routine";

/**
 * API-ROU-05 — calcul des occurrences d'une période : génération par le créneau, puis filtrage par le motif de
 * chaque contenu (chapitre 09, « Règles de planification »). Fonction pure : aucune occurrence future n'est
 * persistée (D-013).
 *
 * Unité Semaine (RM-047) : la semaine contenant « Début le » est la semaine 0 ; une semaine k est active si
 * k est un multiple du multiplicateur ; dans une semaine active, chaque jour retenu produit une occurrence,
 * à l'heure du créneau, si sa date est ≥ Début le et dans la borne :
 * - « jusqu'au » : date incluse ;
 * - « pendant N semaines » : semaines 0..N-1 depuis la semaine d'ancrage.
 *
 * Rang d'une occurrence pour le motif x/n : rang dans la suite produite par le créneau, à partir de 1 pour la
 * première occurrence (Début le compris), occurrences retirées comprises (un retrait ne décale pas le motif des
 * suivantes). [Hypothèse technique — chapitre 09 : « L'origine de l'index et son évolution après modification
 * restent à préciser » ; sans effet tant que tous les contenus sont « à chaque fois ».]
 */

export type OccurrenceContent = {
  readonly entryId: string;
  readonly sessionId: string;
  /** Rang du contenu dans la liste ordonnée de la Routine (0 = premier). */
  readonly rank: number;
};

export type Occurrence = {
  readonly routineId: string;
  readonly date: LocalDate;
  readonly time: LocalTime;
  /** Date/heure d'origine `AAAA-MM-JJTHH:MM` (identité de l'occurrence dans sa Routine). */
  readonly key: string;
  /** Rang dans la suite du créneau, à partir de 1. */
  readonly index: number;
  /** Contenus retenus, dans l'ordre de la liste. Jamais vide. */
  readonly contents: readonly OccurrenceContent[];
};

/** Vrai si le créneau produit une occurrence ce jour-là (avant filtrage par les contenus et les retraits). */
function slotProducesOn(routine: Routine, date: LocalDate): boolean {
  if (date < routine.startDate) return false;
  const repetition = routine.repetition;
  if (repetition === null) return date === routine.startDate;
  const week = Math.floor(daysBetween(mondayOf(routine.startDate), mondayOf(date)) / 7);
  if (week % repetition.every !== 0) return false;
  if (!repetition.weekdays.includes(weekdayOf(date))) return false;
  if (repetition.end.kind === "UNTIL") return date <= repetition.end.date;
  return week < repetition.end.count;
}

/** Dernière date que le créneau peut produire (toute Routine livrée est bornée). */
function lastPossibleDate(routine: Routine): LocalDate {
  const repetition = routine.repetition;
  if (repetition === null) return routine.startDate;
  if (repetition.end.kind === "UNTIL") return repetition.end.date;
  return addDays(mondayOf(routine.startDate), repetition.end.count * 7 - 1);
}

function retainedContents(routine: Routine, index: number): OccurrenceContent[] {
  const contents: OccurrenceContent[] = [];
  routine.entries.forEach((entry, rank) => {
    const position = ((index - 1) % entry.frequency.n) + 1;
    if (entry.frequency.positions.includes(position)) contents.push({ entryId: entry.id, sessionId: entry.sessionId, rank });
  });
  return contents;
}

/**
 * Occurrences de `routine` dont la date est dans [`from`, `to`] (inclus), dans l'ordre chronologique. Une
 * occurrence sans contenu retenu ou retirée n'est pas rendue.
 */
export function occurrencesBetween(routine: Routine, from: LocalDate, to: LocalDate): Occurrence[] {
  const last = lastPossibleDate(routine);
  const end = to < last ? to : last;
  if (end < routine.startDate || end < from) return [];
  const excluded = new Set(routine.exclusions);
  const result: Occurrence[] = [];
  let index = 0;
  // Parcours depuis le début : le rang de chaque occurrence dépend de toutes celles qui la précèdent.
  for (let date = routine.startDate; date <= end; date = addDays(date, 1)) {
    if (!slotProducesOn(routine, date)) continue;
    index += 1;
    if (date < from) continue;
    const key = occurrenceKey(date, routine.time);
    if (excluded.has(key)) continue;
    const contents = retainedContents(routine, index);
    if (contents.length === 0) continue;
    result.push({ routineId: routine.id, date, time: routine.time, key, index, contents });
  }
  return result;
}

/**
 * Occurrences de plusieurs Routines sur une période, triées par date, heure, puis ordre de création des Routines
 * (stable). RM-049 / CE-UI-03 : seules les occurrences futures (instant ≥ `now`) sont présentées.
 */
export function upcomingOccurrences(routines: readonly Routine[], from: LocalDate, to: LocalDate, now: Date): Occurrence[] {
  const all = routines.flatMap((routine) => occurrencesBetween(routine, from, to));
  return all
    .filter((occurrence) => occurrenceInstant(occurrence.date, occurrence.time).getTime() >= now.getTime())
    .sort((a, b) => (a.date === b.date ? (a.time === b.time ? 0 : a.time < b.time ? -1 : 1) : a.date < b.date ? -1 : 1));
}

/** Vrai si la Routine produit plus d'une occurrence (planification périodique au sens du dialogue de suppression). */
export function isPeriodic(routine: Routine): boolean {
  return routine.repetition !== null;
}
