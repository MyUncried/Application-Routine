import {
  addDays,
  endDateForCount,
  mondayOf,
  occurrenceInstant,
  occurrenceKey,
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
  /**
   * D-540 : créneau non commencé dont le délai de rattrapage est passé (« Expirée »). Calculé à l'affichage
   * (`withExpiry`), jamais enregistré ; `false` tant qu'il n'a pas été calculé.
   */
  readonly expired: boolean;
  /**
   * D-553 (21/11/2026, arbitrage 8) : fin du délai de rattrapage (instant, ms), calculée par `withExpiry` pour toute occurrence —
   * commencée comprise : une Séance non exécutée d'un parcours commencé reste rattrapable seule jusqu'au créneau suivant de la
   * routine (10 jours pour le dernier), puis « Expirée ». Absent tant qu'il n'a pas été calculé.
   */
  readonly catchUpEnd?: number;
};

/** Occurrence commencée connue par ses Exécutions (lien de la migration 033) sans être enregistrée (données antérieures). */
export type IsOccurrenceStarted = (routineId: string, occurrenceKey: string) => boolean;

const NEVER_STARTED: IsOccurrenceStarted = () => false;

/**
 * Dates produites par le créneau (avant filtrage par les contenus et les retraits), dans l'ordre chronologique. Mêmes règles
 * que ci-dessus (RM-047, RM-257, D-331). Performance (recette du 20/11/2026, Agenda lent) : seuls les jours produits sont
 * calculés, en jours numériques, au lieu d'examiner chaque jour de la vie de la routine. [Choix technique ; résultat
 * identique.]
 */
function producedDates(routine: Routine): LocalDate[] {
  const repetition = routine.repetition;
  if (repetition === null) return [routine.startDate];
  const start = dayNumber(routine.startDate);
  const last = dayNumber(lastPossibleDate(routine));
  const dates: LocalDate[] = [];
  if (repetition.unit === "DAY") {
    for (let day = start; day <= last; day += repetition.every) dates.push(fromDayNumber(day));
    return dates;
  }
  const monday = dayNumber(mondayOf(routine.startDate));
  const weekdays = [...repetition.weekdays].sort((a, b) => a - b);
  const weekLimit = repetition.end.kind === "FOR" ? repetition.end.count : Number.POSITIVE_INFINITY;
  for (let week = 0; week < weekLimit && monday + week * 7 <= last; week += repetition.every) {
    for (const weekday of weekdays) {
      const day = monday + week * 7 + weekday - 1;
      if (day >= start && day <= last) dates.push(fromDayNumber(day));
    }
  }
  return dates;
}

/** Jour civil en nombre de jours (UTC, sans heure : aucun effet de fuseau ni de changement d'heure). */
function dayNumber(value: LocalDate): number {
  return Date.UTC(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10))) / 86_400_000;
}

function fromDayNumber(day: number): LocalDate {
  const date = new Date(day * 86_400_000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
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
    expired: false,
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
 * [D-537 : « une Routine archivée ne présente plus que ses occurrences commencées » — remplacé par D-540 (20/11/2026) : plus
 * d'archivage ; les créneaux non commencés d'une routine supprimée avec historique sont retirés.]
 */
export function routineOccurrences(routine: Routine, isStarted: IsOccurrenceStarted = NEVER_STARTED): Occurrence[] {
  const savedByDay = new Map<LocalDate, OccurrenceOverride>();
  for (const saved of routine.overrides ?? []) savedByDay.set(saved.key.slice(0, 10), saved);
  const excluded = new Set(routine.exclusions);
  const result: Occurrence[] = [];
  const matched = new Set<LocalDate>();
  let index = 0;
  // Parcours depuis le début : le rang de chaque occurrence dépend de toutes celles qui la précèdent.
  for (const date of producedDates(routine)) {
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
  return result.sort(byInstant);
}

/**
 * D-540 (Hermann, 20/11/2026) : le dernier créneau d'une routine, sans suivant, reste rattrapable 10 jours après sa date.
 * Constante de la spécification, sans réglage.
 */
export const LAST_SLOT_CATCH_UP_DAYS = 10;

/**
 * D-540, point 1 : un créneau non commencé dont l'heure est passée reste rattrapable jusqu'au début du créneau suivant de la
 * même routine (non supprimé), qu'il ait été exécuté ou non ; le dernier, jusqu'à la fin du 10ᵉ jour après sa date. Ensuite il
 * est expiré. `occurrences` : toutes les occurrences d'une routine, dans l'ordre chronologique (`routineOccurrences`).
 * [« 10 jours après sa date » = jusqu'à minuit à la fin du 10ᵉ jour : interprétation technique.]
 */
export function withExpiry(occurrences: readonly Occurrence[], now: Date): Occurrence[] {
  const at = now.getTime();
  return occurrences.map((occurrence, index) => {
    const next = occurrences[index + 1];
    const deadline =
      next !== undefined ? occurrenceInstant(next.date, next.time).getTime() : occurrenceInstant(addDays(occurrence.date, LAST_SLOT_CATCH_UP_DAYS + 1), "00:00").getTime();
    const timed = { ...occurrence, catchUpEnd: deadline };
    if (occurrence.started) return timed;
    const start = occurrenceInstant(occurrence.date, occurrence.time).getTime();
    if (start >= at) return timed;
    return at >= deadline ? { ...timed, expired: true } : timed;
  });
}

/**
 * D-540, point 2 : routine active = au moins un créneau à venir ou rattrapable (non commencé et non expiré), même si sa date de
 * fin est passée ; terminée sinon. État calculé, jamais enregistré.
 */
export function isRoutineActiveAt(routine: Routine, now: Date, isStarted: IsOccurrenceStarted = NEVER_STARTED): boolean {
  return withExpiry(routineOccurrences(routine, isStarted), now).some((occurrence) => !occurrence.started && !occurrence.expired);
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
