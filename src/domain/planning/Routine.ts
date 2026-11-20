/**
 * Planification — modèle de domaine de la Routine (créneau + liste ordonnée de contenus).
 *
 * Sources : chapitre 04 « Routine », chapitre 09 « Entité Routine » et « Règles de planification »,
 * chapitre 10 RM-043 à RM-050, D-328 à D-331, D-244 ; D-449 (26/10/2026) : la Séance est le seul contenu
 * planifiable — chaque entrée référence donc une Séance (`sessionId`).
 *
 * Invariant (chapitre 04) : le créneau produit les occurrences ; un contenu ne fait que les filtrer.
 *
 * Unités livrées : créneau unique (répétition « aucune ») et unités Semaine (RM-047 : ancrage sur la semaine
 * contenant le début, multiplicateur 1..12 — D-244 —, jours sélectionnés, bornes inclusives) et Jour (RM-257, D-526 :
 * tous les N jours depuis « Début le », jusqu'à une date incluse ou pendant N jours). L'unité Mois est retirée (D-526, 18/11/2026) : une
 * Routine en mois enregistrée ailleurs n'est pas interprétée par ce modèle (RM-264).
 *
 * Dates : date civile locale `AAAA-MM-JJ`, heure locale `HH:MM` ; aucune conversion de fuseau.
 */

/** Date civile locale, `AAAA-MM-JJ`. */
export type LocalDate = string;
/** Heure locale, `HH:MM` (24 h). */
export type LocalTime = string;
/** Jour de la semaine, lundi = 1 … dimanche = 7 (rangée L M M J V S D). */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7];

/** D-244 : fréquence hebdomadaire entière de 1 à 12 semaines incluses. */
export const WEEK_MULTIPLIER_MIN = 1;
export const WEEK_MULTIPLIER_MAX = 12;

/**
 * D-524 (18/11/2026) : délais proposés du rappel (15 min, 30 min, 1 h), après « Sans » ; « Autre » : délai personnalisé.
 * [RM-054a : 5 min, 15 min, 30 min, 1 h — « 5 min » retirée.]
 */
export const REMINDER_PRESETS = [15, 30, 60] as const;
/** D-243 : délai maximal du rappel personnalisé, 24 h. */
export const REMINDER_MAX_MINUTES = 24 * 60;

/**
 * D-331 : borne de fin — `UNTIL` (« jusqu'au », une date incluse) ou `FOR` (« pendant », un nombre d'unités de
 * l'unité de récurrence, comptées depuis la semaine d'ancrage). La conversion entre les deux formes à la bascule
 * reste ouverte (point ouvert 4) : aucune conversion n'est faite.
 */
export type RoutineEnd = { readonly kind: "UNTIL"; readonly date: LocalDate } | { readonly kind: "FOR"; readonly count: number };

export type RoutineRepetition =
  | {
      readonly unit: "WEEK";
      /** Toutes les N semaines (1..12). */
      readonly every: number;
      /** Jours retenus, au moins un, ordre croissant. */
      readonly weekdays: readonly Weekday[];
      readonly end: RoutineEnd;
    }
  | {
      /** RM-257 : tous les N jours depuis « Début le » ; aucune rangée de jours (D-520). */
      readonly unit: "DAY";
      readonly every: number;
      /** Toujours vide : la rangée des jours n'existe que pour l'unité semaines. */
      readonly weekdays: readonly Weekday[];
      /**
       * « jusqu'au » ou « pendant N jours » (recette du 19/11/2026 : « avec l'option "jour", l'option "pendant" n'est pas
       * disponible, c'est à corriger »). [RM-257 : « jusqu'au » seulement — remplacé.]
       */
      readonly end: RoutineEnd;
    };

/**
 * Dernière date couverte par « pendant N » : unité Semaine, N semaines civiles depuis celle de « Début le » (D-331) ;
 * unité Jour, N jours depuis « Début le » compris. [Hypothèse technique, 19/11/2026 : décompte des jours depuis « Début
 * le » inclus, par analogie avec les semaines comptées depuis la semaine d'ancrage.]
 */
export function endDateForCount(unit: RoutineRepetition["unit"], startDate: LocalDate, count: number): LocalDate {
  return unit === "DAY" ? addDays(startDate, count - 1) : addDays(mondayOf(startDate), count * 7 - 1);
}

/**
 * Multiplicateur de l'unité Jour : 1 à 31 (recette du 19/11/2026 au soir, pj-roulette : « Il n'y a que 12 jours dans
 * popover, mettre 31 jours »). [1..12, mêmes bornes que les semaines (hypothèse technique du 18/11/2026) — remplacé.]
 */
export const DAY_MULTIPLIER_MIN = 1;
export const DAY_MULTIPLIER_MAX = 31;

/** RM-253 : le cycle de rotation compte 1 à 7 créneaux. */
export const CYCLE_MAX = 7;

/**
 * D-329 : fréquence d'un contenu « x fois sur n », sans unité ; `positions` = rangs retenus parmi 1..n.
 * Valeur initiale « à chaque fois » (x = n = 1).
 */
export type ContentFrequency = { readonly x: number; readonly n: number; readonly positions: readonly number[] };

export const EVERY_TIME: ContentFrequency = { x: 1, n: 1, positions: [1] };

export type RoutineEntry = {
  readonly id: string;
  /** D-449 : la Séance est le seul contenu planifiable. */
  readonly sessionId: string;
  readonly frequency: ContentFrequency;
};

export type Routine = {
  readonly id: string;
  /**
   * D-522 / RM-258 : nom libre, unique parmi les planifications de l'utilisateur (RM-261). Vide pour une planification
   * enregistrée avant le 18/11/2026 : à compléter à la première modification (RM-264).
   */
  readonly name: string;
  /** Début le (date incluse). */
  readonly startDate: LocalDate;
  /** Une seule heure par créneau (chapitre 09). */
  readonly time: LocalTime;
  /** `null` : répétition désactivée — créneau unique. */
  readonly repetition: RoutineRepetition | null;
  /** Liste ordonnée, au moins une entrée (RM-043). */
  readonly entries: readonly RoutineEntry[];
  /**
   * R-04 (CE-UI-03 §15) : occurrences retirées une à une (« Seulement cette occurrence »), identifiées par leur
   * date/heure d'origine `AAAA-MM-JJTHH:MM`.
   */
  readonly exclusions: readonly string[];
  /** D-060 / RM-044 : zéro ou un rappel, en minutes avant l'occurrence ; `null` : interrupteur Rappel sur Non. */
  readonly reminderMinutes: number | null;
  /**
   * D-536 (modèle validé le 20/11/2026, q21-modele) : occurrences modifiées à la main ou commencées. Absent : aucune.
   */
  readonly overrides?: readonly OccurrenceOverride[];
  /**
   * [D-537 : routine archivée — plus utilisé depuis D-540 (20/11/2026), qui supprime l'archivage des routines. Colonne conservée
   * (migration 034), jamais écrite ni lue par les règles.]
   */
  readonly archivedAt?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/**
 * Séance d'une occurrence enregistrée (D-536, point 4) : séance de la routine (`ROUTINE`, désactivable, jamais retirée)
 * ou ajoutée à la main à ce seul créneau (`ADDED`, retirable). `active` faux : pastille désactivée, la séance n'est pas
 * jouée et ne compte pas pour « Complétée » (point 5).
 */
export type OccurrenceSession = {
  readonly sessionId: string;
  /** Entrée de la routine d'origine ; `null` pour une séance ajoutée à la main. */
  readonly entryId: string | null;
  readonly origin: "ROUTINE" | "ADDED";
  readonly active: boolean;
};

/**
 * Occurrence enregistrée (D-536 ; Hermann, 20/11/2026 : « Une occurrence modifiée à la main est enregistrée avec les seuls
 * groupes modifiés (date et heure ; séances, actives ou non, ajoutées ou de la routine ; rappel) ; les autres groupes
 * continuent de suivre la routine. Une occurrence commencée est enregistrée en entier. ») Chaque groupe vaut `null` (ou
 * `reminderOverridden` faux) tant qu'il suit la routine.
 */
export type OccurrenceOverride = {
  /** Date/heure d'origine `AAAA-MM-JJTHH:MM` : identité, inchangée quand l'occurrence est déplacée. */
  readonly key: string;
  /** Rang dans la suite du créneau, conservé pour une occurrence que la routine ne produit plus. */
  readonly index: number;
  /** Groupe « date et heure » : `null` = suit la routine. */
  readonly date: LocalDate | null;
  readonly time: LocalTime | null;
  /** Groupe « séances » : `null` = suit la routine. */
  readonly sessions: readonly OccurrenceSession[] | null;
  /** Groupe « rappel ». */
  readonly reminderOverridden: boolean;
  readonly reminderMinutes: number | null;
  /** Non `null` : occurrence commencée (lancement de sa première séance), figée — D-536, point 1. */
  readonly startedAt: string | null;
};

/** Brouillon du formulaire de planification (CE-UI-05) : la Routine sans identité ni horodatage. */
export type RoutineDraft = Omit<Routine, "id" | "createdAt" | "updatedAt" | "exclusions" | "reminderMinutes"> & {
  readonly exclusions?: readonly string[];
  readonly reminderMinutes?: number | null;
};

export type RoutineValidationIssue =
  | "NO_CONTENT"
  | "INVALID_DATE"
  | "INVALID_TIME"
  | "INVALID_MULTIPLIER"
  | "NO_WEEKDAY"
  | "INVALID_END"
  | "END_BEFORE_START"
  | "INVALID_FREQUENCY"
  | "INVALID_REMINDER"
  | "NAME_REQUIRED";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isLocalDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (match === null) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function isLocalTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function isValidFrequency(frequency: ContentFrequency): boolean {
  const { x, n, positions } = frequency;
  if (!Number.isInteger(n) || n < 1 || !Number.isInteger(x) || x < 1 || x > n) return false;
  if (positions.length !== x) return false;
  const unique = new Set(positions);
  return unique.size === positions.length && positions.every((position) => Number.isInteger(position) && position >= 1 && position <= n);
}

/** CE-UI-05 §14 : validations à l'enregistrement. Liste vide = brouillon enregistrable. */
export function validateRoutineDraft(draft: RoutineDraft): readonly RoutineValidationIssue[] {
  const issues: RoutineValidationIssue[] = [];
  if (draft.entries.length === 0) issues.push("NO_CONTENT");
  if (draft.name.trim() === "") issues.push("NAME_REQUIRED");
  if (!isLocalDate(draft.startDate)) issues.push("INVALID_DATE");
  if (!isLocalTime(draft.time)) issues.push("INVALID_TIME");
  if (draft.entries.some((entry) => !isValidFrequency(entry.frequency))) issues.push("INVALID_FREQUENCY");
  const reminder = draft.reminderMinutes ?? null;
  if (reminder !== null && (!Number.isInteger(reminder) || reminder < 1 || reminder > REMINDER_MAX_MINUTES)) issues.push("INVALID_REMINDER");
  const repetition = draft.repetition;
  if (repetition !== null) {
    const [min, max] = repetition.unit === "WEEK" ? [WEEK_MULTIPLIER_MIN, WEEK_MULTIPLIER_MAX] : [DAY_MULTIPLIER_MIN, DAY_MULTIPLIER_MAX];
    if (!Number.isInteger(repetition.every) || repetition.every < min || repetition.every > max) {
      issues.push("INVALID_MULTIPLIER");
    }
    if (repetition.unit === "WEEK" && repetition.weekdays.length === 0) issues.push("NO_WEEKDAY");
    if (repetition.end.kind === "UNTIL") {
      if (!isLocalDate(repetition.end.date)) issues.push("INVALID_END");
      else if (isLocalDate(draft.startDate) && repetition.end.date < draft.startDate) issues.push("END_BEFORE_START");
    } else if (!Number.isInteger(repetition.end.count) || repetition.end.count < 1) {
      issues.push("INVALID_END");
    }
  }
  return issues;
}

// ——— Arithmétique de dates civiles locales ———

export function parseLocalDate(value: LocalDate): Date {
  const match = DATE_PATTERN.exec(value);
  if (match === null) throw new Error(`Date locale invalide : ${value}`);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function formatLocalDate(date: Date): LocalDate {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addDays(value: LocalDate, days: number): LocalDate {
  const date = parseLocalDate(value);
  // Construction par composantes civiles : un changement d'heure ne décale jamais la date.
  return formatLocalDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
}

/** Lundi = 1 … dimanche = 7. */
export function weekdayOf(value: LocalDate): Weekday {
  const day = parseLocalDate(value).getDay();
  return (day === 0 ? 7 : day) as Weekday;
}

/** Lundi de la semaine contenant `value`. */
export function mondayOf(value: LocalDate): LocalDate {
  return addDays(value, 1 - weekdayOf(value));
}

/** Nombre de jours civils de `from` à `to` (négatif si `to` précède). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  const a = parseLocalDate(from);
  const b = parseLocalDate(to);
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86_400_000);
}

export function occurrenceKey(date: LocalDate, time: LocalTime): string {
  return `${date}T${time}`;
}

/** Instant local d'une occurrence (fuseau de l'appareil). */
export function occurrenceInstant(date: LocalDate, time: LocalTime): Date {
  const day = parseLocalDate(date);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
}
