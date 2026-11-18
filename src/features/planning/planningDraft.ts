import {
  addDays,
  EVERY_TIME,
  mondayOf,
  weekdayOf,
  type LocalDate,
  type LocalTime,
  type Routine,
  type RoutineDraft,
  type RoutineEntry,
  type Weekday,
} from "@/domain/planning/Routine";
import { entriesWithGrid, gridFromEntries, type PlanningGrid } from "@/features/planning/planningGrid";
import { planningStrings } from "@/features/planning/planningStrings";

/**
 * Brouillon du formulaire de planification (CE-UI-12, 18/11/2026) — état local pur, jamais persisté avant Enregistrer.
 *
 * - Nom (D-522, RM-258) : tant qu'il n'a pas été saisi, il suit la sélection — une seule séance : son nom ; plusieurs :
 *   vide (obligatoire). Une planification existante garde son nom ; sans nom, elle reste vide, à compléter (RM-264).
 * - Répétition (D-520, RM-257) : « toutes les » / « tous les » / « aucune », nombre, unité (jours ou semaines), « jusqu'au »
 *   date ; jours de la semaine pour l'unité semaines seulement. Une borne « pendant N semaines » enregistrée avant le
 *   18/11/2026 devient sa date de fin équivalente (le dimanche de la N-ième semaine) : mêmes occurrences.
 * - Grille (D-519) : lignes dans l'ordre des entrées.
 * - Rappel (D-524) : `null` = « Sans ».
 *
 * Valeurs initiales techniques (aucune règle ne les fixe) : heure pleine suivante si la date est aujourd'hui, sinon
 * 08:00 ; répétition « aucune » ; à l'activation : toutes les semaines, le jour de « Début le », jusqu'au + 4 semaines.
 */
export type RepetitionUnit = "WEEK" | "DAY";

export type FormDraft = {
  /** Nom saisi ; ignoré tant que `nameEdited` est faux (nom automatique, RM-258). */
  readonly name: string;
  readonly nameEdited: boolean;
  readonly entries: readonly RoutineEntry[];
  readonly grid: PlanningGrid;
  readonly startDate: LocalDate;
  readonly time: LocalTime;
  /** Faux : répétition « aucune » (créneau unique). Les autres réglages sont conservés dans le brouillon. */
  readonly repetitionOn: boolean;
  readonly unit: RepetitionUnit;
  readonly every: number;
  readonly weekdays: readonly Weekday[];
  readonly endDate: LocalDate;
  /** Délai du rappel en minutes ; `null` : « Sans » (D-524). */
  readonly reminderMinutes: number | null;
};

export const DEFAULT_END_WEEKS = 4;

/** Date de fin équivalente à « pendant N semaines » (semaines civiles comptées depuis celle de « Début le »). */
export function endDateForWeeks(startDate: LocalDate, count: number): LocalDate {
  return addDays(mondayOf(startDate), count * 7 - 1);
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function defaultTime(date: LocalDate, now: Date): LocalTime {
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  if (date !== today) return "08:00";
  const nextHour = Math.min(23, now.getHours() + 1);
  return `${pad(nextHour)}:00`;
}

export function initialDraft(date: LocalDate, entries: readonly RoutineEntry[], now: Date, reminderMinutes: number | null = null): FormDraft {
  return {
    name: "",
    nameEdited: false,
    entries,
    grid: gridFromEntries(entries),
    startDate: date,
    time: defaultTime(date, now),
    repetitionOn: false,
    unit: "WEEK",
    every: 1,
    weekdays: [weekdayOf(date)],
    endDate: addDays(date, DEFAULT_END_WEEKS * 7),
    reminderMinutes,
  };
}

export function draftFromRoutine(
  routine: Pick<Routine, "entries" | "startDate" | "time" | "repetition"> & { readonly name?: string; readonly reminderMinutes?: number | null },
): FormDraft {
  const repetition = routine.repetition;
  const endDate =
    repetition === null
      ? addDays(routine.startDate, DEFAULT_END_WEEKS * 7)
      : repetition.end.kind === "UNTIL"
        ? repetition.end.date
        : endDateForWeeks(routine.startDate, repetition.end.count);
  return {
    // RM-264 : une planification existante garde son nom, même vide (à compléter) ; il ne suit plus la sélection.
    name: routine.name ?? "",
    nameEdited: true,
    entries: routine.entries,
    grid: gridFromEntries(routine.entries),
    startDate: routine.startDate,
    time: routine.time,
    repetitionOn: repetition !== null,
    unit: repetition?.unit ?? "WEEK",
    every: repetition?.every ?? 1,
    weekdays: repetition !== null && repetition.unit === "WEEK" ? repetition.weekdays : [weekdayOf(routine.startDate)],
    endDate,
    reminderMinutes: routine.reminderMinutes ?? null,
  };
}

/** RM-258 : nom effectif — saisi, sinon nom de l'unique séance, sinon vide. */
export function effectiveName(form: Pick<FormDraft, "name" | "nameEdited" | "entries">, nameOf: (sessionId: string) => string | undefined): string {
  if (form.nameEdited) return form.name;
  return form.entries.length === 1 ? (nameOf(form.entries[0]!.sessionId) ?? "") : "";
}

export function toRoutineDraft(form: FormDraft, name: string): RoutineDraft {
  const entries = entriesWithGrid(form.entries, form.grid);
  return {
    name,
    startDate: form.startDate,
    time: form.time,
    entries,
    reminderMinutes: form.reminderMinutes,
    repetition: !form.repetitionOn
      ? null
      : form.unit === "WEEK"
        ? { unit: "WEEK", every: form.every, weekdays: [...form.weekdays].sort((a, b) => a - b), end: { kind: "UNTIL", date: form.endDate } }
        : { unit: "DAY", every: form.every, weekdays: [], end: { kind: "UNTIL", date: form.endDate } },
  };
}

/**
 * CE-UI-04 / D-499 : la sélection validée remplace la liste. Une Séance déjà présente garde sa place, son identité
 * d'entrée et sa ligne de la grille ; une Séance nouvellement cochée est ajoutée en fin de liste, dans l'ordre de
 * sélection (D-519 : ordre des lignes = ordre de sélection), jouée dans tous les créneaux du cycle.
 */
export function applySelection(entries: readonly RoutineEntry[], selected: readonly string[], newId: () => string): RoutineEntry[] {
  const kept = entries.filter((entry) => selected.includes(entry.sessionId));
  const added = selected
    .filter((sessionId) => !kept.some((entry) => entry.sessionId === sessionId))
    .map((sessionId) => ({ id: newId(), sessionId, frequency: EVERY_TIME }));
  return [...kept, ...added];
}

/**
 * Sélection appliquée au brouillon : lignes conservées avec leurs points, nouvelles lignes pointées dans tous les créneaux.
 * [Hypothèse technique, 18/11/2026 : aucune règle ne fixe les points d'une séance ajoutée ; « à chaque fois » reprend la
 * valeur de départ de la grille (RM-260 : « au départ … tous les points posés »).]
 */
export function withSelection(form: FormDraft, selected: readonly string[], newId: () => string): FormDraft {
  const entries = applySelection(form.entries, selected, newId);
  const points = entries.map((entry) => {
    const previous = form.entries.findIndex((item) => item.id === entry.id);
    return previous >= 0 ? (form.grid.points[previous] ?? []) : Array.from({ length: form.grid.cycle }, () => true);
  });
  return { ...form, entries, grid: { cycle: form.grid.cycle, points } };
}

/** Chapitre 10 / recette du 17/11/2026 (d3) : le dernier jour coché ne peut pas être décoché. */
export function toggleWeekday(weekdays: readonly Weekday[], day: Weekday): Weekday[] {
  if (weekdays.includes(day)) return weekdays.length === 1 ? [...weekdays] : weekdays.filter((value) => value !== day);
  return [...weekdays, day].sort((a, b) => a - b);
}

/** D-223 : titre contextuel selon le nombre de contenus. */
export function formTitle(count: number): string {
  const t = planningStrings.form;
  if (count === 0) return t.titleEmpty;
  return count === 1 ? t.titleSession : t.titleRoute;
}

/** RM-257 : accord du libellé de répétition avec l'unité (« toutes les » semaines, « tous les » jours). */
export function everyLabel(unit: RepetitionUnit): string {
  return unit === "WEEK" ? planningStrings.form.everyFeminine : planningStrings.form.everyMasculine;
}

/** Unité accordée au nombre (« semaine » / « semaines », « jour » / « jours »). */
export function unitLabel(unit: RepetitionUnit, count: number): string {
  const units = unit === "WEEK" ? planningStrings.weekUnit : planningStrings.dayUnit;
  return count === 1 ? units.singular : units.plural;
}

/** Libellé d'un délai de rappel (Figma `12650:27854`) : « 15' », « 1h », « 1h20 ». */
export function reminderLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}’`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, "0")}`;
}
