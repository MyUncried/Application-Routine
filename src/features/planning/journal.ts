import { normalizeSearchText } from "@/domain/activities/movementSuggestion";
import { periodOccurrences } from "@/domain/planning/occurrences";
import { addDays, mondayOf, parseLocalDate, type LocalDate, type Routine } from "@/domain/planning/Routine";
import { formatRecurrence } from "@/features/planning/planningSummary";
import { planningStrings } from "@/features/planning/planningStrings";
import { matchesSessionFilters, type SessionCatalogueFilters } from "@/features/sessions/sessionCatalogueFilters";
import { matchesSessionQuery } from "@/features/sessions/sessionCatalogueContext";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";

/**
 * Journal des routines (D-535, DSF Journal du 19/11/2026) — lecture seule des Routines existantes : aucune donnée
 * nouvelle dans le domaine ni dans la persistance.
 */
const t = planningStrings;

/** Dernière date que la Routine peut produire (« jusqu'au », « pendant N semaines », ou le jour unique). */
export function routineLastDate(routine: Routine): LocalDate {
  const repetition = routine.repetition;
  if (repetition === null) return routine.startDate;
  if (repetition.end.kind === "UNTIL") return repetition.end.date;
  return addDays(mondayOf(routine.startDate), repetition.end.count * 7 - 1);
}

/**
 * DSF Journal § 4 : « Active » — au moins une occurrence en cours ou à venir (aujourd'hui compris) ; « Terminée » —
 * plus aucune occurrence à venir. [Définition retenue par Claude le 19/11/2026 (D-535). Toute Routine livrée est bornée
 * par une date de fin ou un nombre de semaines : « sans date de fin » ne peut pas se produire aujourd'hui.]
 */
export function isRoutineActive(routine: Routine, today: LocalDate): boolean {
  const last = routineLastDate(routine);
  if (last < today) return false;
  return periodOccurrences([routine], today, last).length > 0;
}

export function journalCounts(routines: readonly Routine[], today: LocalDate): { readonly active: number; readonly finished: number } {
  const active = routines.filter((routine) => isRoutineActive(routine, today)).length;
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
      : t.summary.during.replace("{count}", String(repetition.end.count)).replace("{unit}", repetition.end.count === 1 ? t.weekUnit.singular : t.weekUnit.plural);
  return `${formatRecurrence(routine)} · ${end}`;
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
