import { normalizeSearchText } from "@/domain/activities/movementSuggestion";
import { isRoutineActiveAt, periodOccurrences, type IsOccurrenceStarted } from "@/domain/planning/occurrences";
import { endDateForCount, generatedRoutineName, routineDisplayName, occurrenceInstant, parseLocalDate, type LocalDate, type Routine } from "@/domain/planning/Routine";
import { duringLabel, formatRecurrence } from "@/features/planning/planningSummary";
import { planningStrings } from "@/features/planning/planningStrings";
import { matchesSessionFilters, type SessionCatalogueFilters } from "@/features/sessions/sessionCatalogueFilters";
import { matchesSessionQuery } from "@/features/sessions/sessionCatalogueContext";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";

/**
 * Journal des routines (D-535, DSF Journal du 19/11/2026) — lecture seule des Routines existantes : aucune donnée
 * nouvelle dans le domaine ni dans la persistance.
 */
const t = planningStrings;

/** Dernière date que la Routine peut produire (« jusqu'au », « pendant N semaines » ou « N jours », ou le jour unique). */
export function routineLastDate(routine: Routine): LocalDate {
  const repetition = routine.repetition;
  if (repetition === null) return routine.startDate;
  if (repetition.end.kind === "UNTIL") return repetition.end.date;
  return endDateForCount(repetition.unit, routine.startDate, repetition.end.count);
}

/**
 * D-540 (Hermann, 20/11/2026) : « Active » — au moins un créneau à venir ou rattrapable, même si la date de fin est passée ;
 * « Terminée » sinon. État calculé (`isRoutineActiveAt`). [D-535 : « au moins une occurrence en cours ou à venir (aujourd'hui
 * compris) » — remplacé.]
 */
export function isRoutineActive(routine: Routine, now: Date, isStarted?: IsOccurrenceStarted): boolean {
  return isRoutineActiveAt(routine, now, isStarted);
}

export function journalCounts(routines: readonly Routine[], isActive: (routine: Routine) => boolean): { readonly active: number; readonly finished: number } {
  const active = routines.filter(isActive).length;
  return { active, finished: routines.length - active };
}

/** Horodatage de tri : modification, sinon création (DSF § 4 : « date de création / modification »). */
function sortKey(routine: Routine): string {
  return routine.updatedAt > routine.createdAt ? routine.updatedAt : routine.createdAt;
}

/** Tri par défaut : la plus récemment créée ou modifiée en haut. */
export function sortJournal(routines: readonly Routine[]): Routine[] {
  return [...routines].sort((a, b) => (sortKey(a) === sortKey(b) ? 0 : sortKey(a) < sortKey(b) ? 1 : -1));
}

/** Date de création (cadre de la carte) : « 12 nov. » et « 2026 ». */
export function creationDateParts(createdAt: string): { readonly day: string; readonly year: string } | null {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return { day: `${date.getDate()} ${t.monthsShort[date.getMonth()]}`, year: String(date.getFullYear()) };
}

/** « 28 déc. » ; l'année s'ajoute quand elle diffère de celle d'aujourd'hui. */
function shortDate(day: LocalDate, today: LocalDate): string {
  const date = parseLocalDate(day);
  const label = `${date.getDate()} ${t.monthsShort[date.getMonth()]}`;
  return day.slice(0, 4) === today.slice(0, 4) ? label : `${label} ${date.getFullYear()}`;
}

/** Occurrences à venir (instant ≥ `now`) de la routine, retraits exclus. */
export function upcomingOccurrenceCount(routine: Routine, today: LocalDate, now: Date): number {
  const last = routineLastDate(routine);
  if (last < today) return 0;
  return periodOccurrences([routine], today, last).filter((occurrence) => occurrenceInstant(occurrence.date, occurrence.time).getTime() >= now.getTime()).length;
}

/** Créneaux de la routine, passés et à venir, retraits exclus (message de suppression du Journal, constat D du 20/11/2026). */
export function routineSlotCount(routine: Routine): number {
  return periodOccurrences([routine], routine.startDate, routineLastDate(routine)).length;
}

/** « 26 nov. », sans année. */
function dayMonth(day: LocalDate): string {
  const date = parseLocalDate(day);
  return `${date.getDate()} ${t.monthsShort[date.getMonth()]}`;
}

/**
 * Ligne 3 de la carte (recette du 20/11/2026, r20-j-deploye — Hermann : « Replacer le terme occurrences par créneau
 * "N créneaux, du X mois au Y mois" et c'est tout, pas de date de début ni d'année, et "Aucun créneau à venir" s'il n'y
 * en n'a pas ») : créneaux à venir, du premier au dernier. [Interprétation technique : « du … au … » borne les créneaux à
 * venir ; un seul créneau : « 1 créneau, le 26 nov. ».]
 */
export function journalSlotsLine(routine: Routine, today: LocalDate, now: Date): string {
  const last = routineLastDate(routine);
  const upcoming =
    last < today ? [] : periodOccurrences([routine], today, last).filter((occurrence) => occurrenceInstant(occurrence.date, occurrence.time).getTime() >= now.getTime());
  if (upcoming.length === 0) return t.journal.slotsNone;
  if (upcoming.length === 1) return t.journal.slotsOne.replace("{date}", dayMonth(upcoming[0]!.date));
  return t.journal.slotsMany
    .replace("{count}", String(upcoming.length))
    .replace("{start}", dayMonth(upcoming[0]!.date))
    .replace("{end}", dayMonth(upcoming[upcoming.length - 1]!.date));
}

/**
 * Information du déployé (recette du 19/11/2026 au soir, constat E) : « 12 occurrences à venir · du 3 nov. au 28 déc. » ;
 * créneau unique : « … · le 18 nov. ».
 */
export function journalInfoLine(routine: Routine, today: LocalDate, now: Date): string {
  const count = upcomingOccurrenceCount(routine, today, now);
  const upcoming = count === 0 ? t.journal.upcomingNone : count === 1 ? t.journal.upcomingOne : t.journal.upcomingMany.replace("{count}", String(count));
  const last = routineLastDate(routine);
  const dates =
    last === routine.startDate
      ? t.journal.single.replace("{date}", shortDate(routine.startDate, today))
      : t.journal.period.replace("{start}", shortDate(routine.startDate, today)).replace("{end}", shortDate(last, today));
  return `${upcoming} · ${dates}`;
}

/**
 * Ligne 3 de la carte (DSF Journal § 3 ; Figma « Calendrier — Journal — MVP ») : « Chaque lundi et jeudi · jusqu'au
 * 28 déc. », « Tous les jours · jusqu'au 30 nov. », « Une seule fois · le 18 nov. » ; borne « pendant » :
 * « … · pendant 6 semaines ».
 */
export function journalRecurrenceLine(routine: Routine, today: LocalDate): string {
  const repetition = routine.repetition;
  if (repetition === null) return `${t.journal.once} · ${t.journal.on} ${shortDate(routine.startDate, today)}`;
  const end =
    repetition.end.kind === "UNTIL"
      ? `${t.journal.until} ${shortDate(repetition.end.date, today)}`
      : duringLabel(repetition.unit, repetition.end.count);
  return `${formatRecurrence(routine)} · ${end}`;
}

/**
 * D-553 (21/11/2026) : nom de Routine affiché (Journal, filtre de l'Agenda, ligne « Ⓟ » d'un parcours) — nom généré recalculé
 * depuis les Séances (`sessions` : projections connues), nom personnalisé tel quel ; repli sur les noms reliés par « + ».
 * [Routine sans nom : séances séparées par des virgules — remplacé.]
 */
export function routineTitle(routine: Routine, sessions: readonly SessionCatalogueProjection[]): string {
  const byId = new Map(sessions.map((session) => [session.id, session.name]));
  const name = routineDisplayName(routine, (sessionId) => byId.get(sessionId));
  return name.trim() !== "" ? name : generatedRoutineName(sessions.map((session) => session.name));
}

/** Recherche : nom de la routine, ou nom d'une de ses séances ou de leurs exercices (même règle que le Catalogue). */
export function matchesJournalQuery(routine: Routine, sessions: readonly SessionCatalogueProjection[], query: string): boolean {
  const needle = normalizeSearchText(query);
  if (needle.length === 0) return true;
  if (normalizeSearchText(routine.name).includes(needle)) return true;
  return sessions.some((session) => matchesSessionQuery(session, query));
}

/**
 * Filtres (DSF Journal § 4) : ceux du Catalogue des séances, réutilisés tels quels — une routine est retenue quand l'une
 * de ses séances l'est. [À CLARIFIER (D-535) : l'écran de filtre du Journal n'est pas dessiné ; « spécialité » et
 * « programme » n'existent pas dans le modèle.]
 */
export function matchesJournalFilters(sessions: readonly SessionCatalogueProjection[], filters: SessionCatalogueFilters): boolean {
  return sessions.some((session) => matchesSessionFilters(session, filters));
}

/**
 * Filtres du Journal hors statut, sur les séances de la routine, quel que soit le statut des séances (D-540 : au Journal, le
 * statut porte sur la routine). Aucun critère choisi : toute routine est retenue.
 */
export function matchesRoutineSessionFilters(sessions: readonly SessionCatalogueProjection[], filters: SessionCatalogueFilters): boolean {
  const criteria = filters.categoryIds.size + filters.bodyZoneIds.size + filters.labelIds.size + filters.formats.size;
  if (criteria === 0) return true;
  return matchesJournalFilters(sessions, { ...filters, statuses: new Set(["ACTIVE", "ARCHIVED"]) });
}

/**
 * D-540 (20/11/2026) : liste par défaut du Journal = routines actives ; le statut « Terminées » du filtre (valeur `ARCHIVED`
 * de la feuille partagée) montre les terminées ; les deux statuts, toutes. [D-537 : routine archivée visible avec
 * « Archivées » seulement — remplacé.]
 */
export function isJournalRoutineVisible(active: boolean, sessions: readonly SessionCatalogueProjection[], filters: SessionCatalogueFilters): boolean {
  const statuses = filters.statuses.size === 0 ? new Set(["ACTIVE"]) : filters.statuses;
  if (!statuses.has(active ? "ACTIVE" : "ARCHIVED")) return false;
  return matchesRoutineSessionFilters(sessions, filters);
}
