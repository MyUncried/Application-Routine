import {
  generatedRoutineName,
  addDays,
  daysBetween,
  endDateForCount,
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
 * - Répétition (D-520, RM-257) : « toutes les » / « tous les » / « aucune », nombre, unité (jours ou semaines), borne de
 *   fin ; jours de la semaine pour l'unité semaines seulement. Borne « jusqu'au » date ou « pendant » N semaines (D-331),
 *   rétablie par la recette du 19/11/2026 (d4 : « l'option "pendant" a disparu, il faut la réintégrer ») ; la bascule
 *   convertit l'une dans l'autre (recette du 17/11/2026, d4). Unité Jour : « jusqu'au » date ou « pendant » N jours (recette
 *   du 19/11/2026 : « avec l'option "jour", l'option "pendant" n'est pas disponible, c'est à corriger »). [« pendant »
 *   réservé à l'unité semaines (RM-257) — remplacé.]
 * - Grille (D-519) : lignes dans l'ordre des entrées.
 * - Rappel (D-524) : `null` = « Sans ».
 *
 * Valeurs initiales techniques (aucune règle ne les fixe) : heure pleine suivante si la date est aujourd'hui, sinon
 * 08:00 ; répétition « aucune » ; à l'activation : toutes les semaines, le jour de « Début le », jusqu'au + 4 semaines.
 */
export type RepetitionUnit = "WEEK" | "DAY";

export type FormDraft = {
  /** Nom saisi ; ignoré tant que `nameEdited` est faux (nom généré, D-553). */
  readonly name: string;
  /**
   * D-553 (21/11/2026) : vrai dès que l'utilisateur modifie le champ — nom personnalisé, fixe ; faux : nom généré, qui suit la
   * composition. Enregistré tel quel (`Routine.nameGenerated` = non `nameEdited`), jamais déduit du texte.
   */
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
  readonly endKind: "UNTIL" | "FOR";
  readonly endDate: LocalDate;
  /**
   * « pendant » : nombre d'unités — semaines civiles comptées depuis celle de « Début le » (D-331), ou jours comptés depuis
   * « Début le » compris.
   */
  readonly endCount: number;
  /** Délai du rappel en minutes ; `null` : « Sans » (D-524). */
  readonly reminderMinutes: number | null;
};

export const DEFAULT_END_WEEKS = 4;
/** Bornes de « pendant N » (stepper de la version du 17/11/2026 : 1 à 520), pour les semaines comme pour les jours. */
export const END_COUNT_MIN = 1;
export const END_COUNT_MAX = 520;

/** Nombre de semaines civiles, depuis celle de « Début le », couvertes jusqu'à `endDate` incluse. */
export function weeksUntil(startDate: LocalDate, endDate: LocalDate): number {
  return Math.max(END_COUNT_MIN, Math.min(END_COUNT_MAX, Math.floor(daysBetween(mondayOf(startDate), endDate) / 7) + 1));
}

/** Date de fin équivalente à « pendant N semaines » (semaines civiles comptées depuis celle de « Début le »). */
export function endDateForWeeks(startDate: LocalDate, count: number): LocalDate {
  return endDateForCount("WEEK", startDate, count);
}

/** Nombre d'unités couvertes de « Début le » à `endDate` incluse : semaines civiles, ou jours (« Début le » compris). */
export function countUntil(unit: RepetitionUnit, startDate: LocalDate, endDate: LocalDate): number {
  if (unit === "WEEK") return weeksUntil(startDate, endDate);
  return Math.max(END_COUNT_MIN, Math.min(END_COUNT_MAX, daysBetween(startDate, endDate) + 1));
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
    endKind: "UNTIL",
    endDate: addDays(date, DEFAULT_END_WEEKS * 7),
    endCount: weeksUntil(date, addDays(date, DEFAULT_END_WEEKS * 7)),
    reminderMinutes,
  };
}

export function draftFromRoutine(
  routine: Pick<Routine, "entries" | "startDate" | "time" | "repetition"> & {
    readonly name?: string;
    readonly nameGenerated?: boolean;
    readonly reminderMinutes?: number | null;
  },
): FormDraft {
  const repetition = routine.repetition;
  const endDate =
    repetition === null
      ? addDays(routine.startDate, DEFAULT_END_WEEKS * 7)
      : repetition.end.kind === "UNTIL"
        ? repetition.end.date
        : endDateForCount(repetition.unit, routine.startDate, repetition.end.count);
  return {
    // D-553 (21/11/2026) : un nom généré continue de suivre la composition ; un nom personnalisé reste fixe. [RM-264 : une
    // planification existante garde son nom, même vide (à compléter), et ne suit plus la sélection — remplacé.]
    name: routine.name ?? "",
    nameEdited: routine.nameGenerated !== true,
    entries: routine.entries,
    grid: gridFromEntries(routine.entries),
    startDate: routine.startDate,
    time: routine.time,
    repetitionOn: repetition !== null,
    unit: repetition?.unit ?? "WEEK",
    every: repetition?.every ?? 1,
    weekdays: repetition !== null && repetition.unit === "WEEK" ? repetition.weekdays : [weekdayOf(routine.startDate)],
    endKind: repetition?.end.kind ?? "UNTIL",
    endDate,
    endCount: repetition !== null && repetition.end.kind === "FOR" ? repetition.end.count : countUntil(repetition?.unit ?? "WEEK", routine.startDate, endDate),
    reminderMinutes: routine.reminderMinutes ?? null,
  };
}

/**
 * D-553 (21/11/2026) : nom effectif — saisi (personnalisé), sinon nom généré : nom de la Séance, ou noms des Séances dans
 * l'ordre reliés par « + ». [RM-258 : nom de l'unique séance, sinon vide et obligatoire — remplacé.]
 */
export function effectiveName(form: Pick<FormDraft, "name" | "nameEdited" | "entries">, nameOf: (sessionId: string) => string | undefined): string {
  if (form.nameEdited) return form.name;
  return generatedRoutineName(form.entries.map((entry) => nameOf(entry.sessionId)));
}

export function toRoutineDraft(form: FormDraft, name: string): RoutineDraft {
  const entries = entriesWithGrid(form.entries, form.grid);
  return {
    name,
    ...(form.nameEdited ? {} : { nameGenerated: true }),
    startDate: form.startDate,
    time: form.time,
    entries,
    reminderMinutes: form.reminderMinutes,
    repetition: !form.repetitionOn
      ? null
      : form.unit === "WEEK"
        ? {
            unit: "WEEK",
            every: form.every,
            weekdays: [...form.weekdays].sort((a, b) => a - b),
            end: form.endKind === "FOR" ? { kind: "FOR", count: form.endCount } : { kind: "UNTIL", date: form.endDate },
          }
        : {
            unit: "DAY",
            every: form.every,
            weekdays: [],
            end: form.endKind === "FOR" ? { kind: "FOR", count: form.endCount } : { kind: "UNTIL", date: form.endDate },
          },
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

/** Bascule « jusqu'au » ↔ « pendant » : la valeur de l'autre forme est recalculée (recette du 17/11/2026, d4). */
export function withEndKind(form: FormDraft): FormDraft {
  return form.endKind === "UNTIL"
    ? { ...form, endKind: "FOR", endCount: countUntil(form.unit, form.startDate, form.endDate) }
    : { ...form, endKind: "UNTIL", endDate: endDateForCount(form.unit, form.startDate, form.endCount) };
}

export function withEndCount(form: FormDraft, endCount: number): FormDraft {
  const count = Math.max(END_COUNT_MIN, Math.min(END_COUNT_MAX, endCount));
  return { ...form, endCount: count, endDate: endDateForCount(form.unit, form.startDate, count) };
}

export function withEndDate(form: FormDraft, endDate: LocalDate): FormDraft {
  return { ...form, endDate, endCount: countUntil(form.unit, form.startDate, endDate) };
}

/** « Début le » changé : « pendant » garde son nombre d'unités ; « jusqu'au » garde sa date si elle reste après. */
export function withStartDate(form: FormDraft, startDate: LocalDate): FormDraft {
  if (form.endKind === "FOR") return { ...form, startDate, endDate: endDateForCount(form.unit, startDate, form.endCount) };
  const endDate = form.endDate < startDate ? startDate : form.endDate;
  return { ...form, startDate, endDate, endCount: countUntil(form.unit, startDate, endDate) };
}

/**
 * Changement d'unité : la borne garde sa forme (« jusqu'au » ou « pendant ») et sa date de fin ; le nombre est recompté
 * dans la nouvelle unité (« pendant 2 semaines » devient « pendant 14 jours » depuis un lundi).
 * [Unité Jour : « pendant » devenait « jusqu'au » (RM-257) — remplacé par la recette du 19/11/2026.]
 */
export function withUnit(form: FormDraft, unit: RepetitionUnit): FormDraft {
  const endCount = countUntil(unit, form.startDate, form.endDate);
  return { ...form, unit, endCount, endDate: form.endKind === "FOR" ? endDateForCount(unit, form.startDate, endCount) : form.endDate };
}

/**
 * Réordonnancement dans le tableau (recette du 19/11/2026 au soir, q19-deplacement : « Ajouter le réordonnancement dans le
 * tableau ») : la ligne `from` passe au rang `to` avec ses points ; l'ordre des lignes est l'ordre des séances de
 * l'occurrence (D-519). [D-523 : ordre de sélection, sans réordonnancement — remplacé.]
 */
export function moveRow(form: FormDraft, from: number, to: number): FormDraft {
  const count = form.entries.length;
  if (from === to || from < 0 || to < 0 || from >= count || to >= count) return form;
  const move = <T,>(list: readonly T[]): T[] => {
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved as T);
    return next;
  };
  return { ...form, entries: move(form.entries), grid: { cycle: form.grid.cycle, points: move(form.grid.points) } };
}
