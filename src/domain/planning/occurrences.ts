import {
  addDays,
  daysBetween,
  endDateForCount,
  mondayOf,
  occurrenceInstant,
  occurrenceKey,
  weekdayOf,
  type LocalDate,
  type LocalTime,
  type OccurrenceOverride,
  type OccurrenceSession,
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
 * Unité Jour (RM-257) : tous les N jours depuis « Début le », jusqu'à une date incluse ou pendant N jours (« Début le »
 * compris).
 *
 * D-536 (20/11/2026) : les occurrences modifiées à la main ou commencées sont enregistrées (`Routine.overrides`) ; voir
 * `routineOccurrences`. [« aucune occurrence n'est persistée » (D-013) ne vaut plus que pour les occurrences ni modifiées
 * ni commencées.]
 *
 * Rang d'une occurrence pour le motif x/n : rang dans la suite produite par le créneau, à partir de 1 pour la
 * première occurrence (Début le compris), occurrences retirées comprises (un retrait ne décale pas le motif des
 * suivantes). [Hypothèse technique — chapitre 09 : « L'origine de l'index et son évolution après modification
 * restent à préciser » ; sans effet tant que tous les contenus sont « à chaque fois ».]
 */

export type OccurrenceContent = {
  /** Entrée de la routine ; `null` pour une séance ajoutée à la main à ce seul créneau (D-536, point 4). */
  readonly entryId: string | null;
  readonly sessionId: string;
  /** Rang de la séance dans la liste de l'occurrence (0 = première), séances désactivées comprises. */
  readonly rank: number;
};

/** Groupes de réglages modifiés à la main sur l'occurrence (D-536, point 3). */
export type OccurrenceManualGroups = { readonly dateTime: boolean; readonly sessions: boolean; readonly reminder: boolean };

export type Occurrence = {
  readonly routineId: string;
  /** Date et heure effectives : déplacée à la main, sinon celles du créneau. */
  readonly date: LocalDate;
  readonly time: LocalTime;
  /** Date/heure d'origine `AAAA-MM-JJTHH:MM` (identité de l'occurrence dans sa Routine). */
  readonly key: string;
  /** Rang dans la suite du créneau, à partir de 1. */
  readonly index: number;
  /** Séances jouées (actives), dans l'ordre de l'occurrence. Jamais vide. */
  readonly contents: readonly OccurrenceContent[];
  /** Toutes les séances de l'occurrence, désactivées comprises (modification d'une occurrence, D-536, point 4). */
  readonly sessions: readonly OccurrenceSession[];
  /** Rappel effectif, en minutes ; `null` : sans rappel. */
  readonly reminderMinutes: number | null;
  /** D-536, point 1 : une séance a été lancée ; l'occurrence est figée. */
  readonly started: boolean;
  readonly manual: OccurrenceManualGroups;
};

/** Occurrence commencée connue par ses Exécutions (lien de la migration 033) sans être enregistrée (données antérieures). */
export type IsOccurrenceStarted = (routineId: string, occurrenceKey: string) => boolean;

const NEVER_STARTED: IsOccurrenceStarted = () => false;

/** Vrai si le créneau produit une occurrence ce jour-là (avant filtrage par les contenus et les retraits). */
function slotProducesOn(routine: Routine, date: LocalDate): boolean {
  if (date < routine.startDate) return false;
  const repetition = routine.repetition;
  if (repetition === null) return date === routine.startDate;
  if (repetition.unit === "DAY") return daysBetween(routine.startDate, date) % repetition.every === 0 && date <= lastPossibleDate(routine);
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
  return endDateForCount(repetition.unit, routine.startDate, repetition.end.count);
}

/** Séances que la routine place dans l'occurrence de rang `index` (grille créneaux × rotation, D-519). */
export function routineSessionsAt(routine: Routine, index: number): OccurrenceSession[] {
  return routine.entries.flatMap((entry) => {
    const position = ((index - 1) % entry.frequency.n) + 1;
    return entry.frequency.positions.includes(position) ? [{ sessionId: entry.sessionId, entryId: entry.id, origin: "ROUTINE" as const, active: true }] : [];
  });
}

/**
 * Occurrence effective : la ligne enregistrée remplace les seuls groupes modifiés à la main ; les autres suivent la
 * routine (D-536, point 3 ; Hermann, 20/11/2026, q21-modele). Une occurrence commencée est enregistrée en entier.
 */
function effectiveOccurrence(
  routine: Routine,
  key: string,
  originDate: LocalDate,
  index: number,
  saved: OccurrenceOverride | undefined,
  isStarted: IsOccurrenceStarted,
): Occurrence | null {
  const sessions = saved?.sessions ?? routineSessionsAt(routine, index);
  const contents = sessions.flatMap((session, rank) => (session.active ? [{ entryId: session.entryId, sessionId: session.sessionId, rank }] : []));
  if (contents.length === 0) return null;
  return {
    routineId: routine.id,
    date: saved?.date ?? originDate,
    time: saved?.time ?? routine.time,
    key,
    index,
    contents,
    sessions,
    reminderMinutes: saved?.reminderOverridden === true ? saved.reminderMinutes : routine.reminderMinutes,
    started: (saved?.startedAt ?? null) !== null || isStarted(routine.id, key),
    manual: {
      dateTime: (saved?.date ?? null) !== null || (saved?.time ?? null) !== null,
      sessions: (saved?.sessions ?? null) !== null,
      reminder: saved?.reminderOverridden === true,
    },
  };
}

/**
 * Toutes les occurrences de la Routine, dans l'ordre chronologique effectif.
 *
 * D-536 (20/11/2026) : une occurrence enregistrée est rattachée à l'occurrence produite le même jour d'origine (une Routine
 * n'a qu'une heure : au plus une occurrence par jour), même si l'heure du créneau a changé depuis ; elle garde alors sa
 * clé d'origine. Une occurrence que la routine ne produit plus reste présentée si elle est commencée (Hermann : « reste à
 * sa date prévue d'origine, même si la récurrence change ») ou déplacée à la main (D-536 : elle ne suit pas un changement
 * de récurrence) ; modifiée seulement dans ses séances ou son rappel, elle suit la récurrence et disparaît avec elle.
 * [Rattachement par jour d'origine et sort d'une occurrence seulement réglée qui n'est plus produite : interprétations
 * techniques.]
 * D-537 : une Routine archivée ne présente plus que ses occurrences commencées.
 */
export function routineOccurrences(routine: Routine, isStarted: IsOccurrenceStarted = NEVER_STARTED): Occurrence[] {
  const savedByDay = new Map<LocalDate, OccurrenceOverride>();
  for (const saved of routine.overrides ?? []) savedByDay.set(saved.key.slice(0, 10), saved);
  const excluded = new Set(routine.exclusions);
  const result: Occurrence[] = [];
  const matched = new Set<LocalDate>();
  const last = lastPossibleDate(routine);
  let index = 0;
  // Parcours depuis le début : le rang de chaque occurrence dépend de toutes celles qui la précèdent.
  for (let date = routine.startDate; date <= last; date = addDays(date, 1)) {
    if (!slotProducesOn(routine, date)) continue;
    index += 1;
    const saved = savedByDay.get(date);
    if (saved !== undefined) matched.add(date);
    const key = saved?.key ?? occurrenceKey(date, routine.time);
    if (excluded.has(key)) continue;
    const occurrence = effectiveOccurrence(routine, key, date, index, saved, isStarted);
    if (occurrence !== null) result.push(occurrence);
  }
  for (const [day, saved] of savedByDay) {
    if (matched.has(day) || excluded.has(saved.key)) continue;
    if (saved.startedAt === null && saved.date === null && !isStarted(routine.id, saved.key)) continue;
    const occurrence = effectiveOccurrence(routine, saved.key, day, saved.index, saved, isStarted);
    if (occurrence !== null) result.push(occurrence);
  }
  const archived = (routine.archivedAt ?? null) !== null;
  return result.filter((occurrence) => !archived || occurrence.started).sort(byInstant);
}

/**
 * Occurrences de `routine` dont la date effective est dans [`from`, `to`] (inclus), dans l'ordre chronologique. Une
 * occurrence sans séance active ou retirée n'est pas rendue.
 */
export function occurrencesBetween(routine: Routine, from: LocalDate, to: LocalDate, isStarted: IsOccurrenceStarted = NEVER_STARTED): Occurrence[] {
  return routineOccurrences(routine, isStarted).filter((occurrence) => occurrence.date >= from && occurrence.date <= to);
}

/**
 * Occurrences de plusieurs Routines sur une période, passées comprises, triées par date, heure, puis ordre de création
 * des Routines (stable). D-525 (18/11/2026) : une occurrence passée sans Exécution ne disparaît pas ; elle peut être
 * rejouée. [RM-049 : seules les occurrences futures étaient présentées — remplacé.]
 */
export function periodOccurrences(routines: readonly Routine[], from: LocalDate, to: LocalDate, isStarted: IsOccurrenceStarted = NEVER_STARTED): Occurrence[] {
  return routines.flatMap((routine) => occurrencesBetween(routine, from, to, isStarted)).sort(byInstant);
}

function byInstant(a: Occurrence, b: Occurrence): number {
  return a.date === b.date ? (a.time === b.time ? 0 : a.time < b.time ? -1 : 1) : a.date < b.date ? -1 : 1;
}

/** Occurrences futures (instant ≥ `now`) d'une période : fenêtre des rappels. */
export function upcomingOccurrences(routines: readonly Routine[], from: LocalDate, to: LocalDate, now: Date): Occurrence[] {
  return periodOccurrences(routines, from, to).filter((occurrence) => occurrenceInstant(occurrence.date, occurrence.time).getTime() >= now.getTime());
}

/** Vrai si la Routine produit plus d'une occurrence (planification périodique au sens du dialogue de suppression). */
export function isPeriodic(routine: Routine): boolean {
  return routine.repetition !== null;
}
