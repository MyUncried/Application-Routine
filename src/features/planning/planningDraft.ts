import {
  addDays,
  EVERY_TIME,
  weekdayOf,
  type LocalDate,
  type LocalTime,
  type Routine,
  type RoutineDraft,
  type RoutineEntry,
  type Weekday,
} from "@/domain/planning/Routine";
import { planningStrings } from "@/features/planning/planningStrings";

/**
 * Brouillon du formulaire de planification (CE-UI-05) — état local pur, jamais persisté avant Enregistrer.
 * La répétition désactivée conserve ses réglages dans le brouillon (le chevron et l'interrupteur ne les effacent
 * pas) mais ne les transmet pas : la Routine enregistrée est alors un créneau unique.
 *
 * Valeurs initiales techniques (aucune règle fonctionnelle ne les fixe ; à confirmer en recette) :
 * - heure : heure pleine suivante si la date est aujourd'hui, sinon 08:00 ;
 * - à l'activation de la répétition : toutes les semaines, le jour de « Début le », jusqu'au + 4 semaines.
 */
export type FormDraft = {
  readonly entries: readonly RoutineEntry[];
  readonly startDate: LocalDate;
  readonly time: LocalTime;
  readonly repetitionOn: boolean;
  readonly every: number;
  readonly weekdays: readonly Weekday[];
  readonly endKind: "UNTIL" | "FOR";
  readonly endDate: LocalDate;
  readonly endCount: number;
  /** Rappel : `null` = interrupteur sur Non. */
  readonly reminderMinutes: number | null;
};

/** Délai proposé à l'activation du rappel (exemple Figma `1992:6838` : 15 min ; aucune règle de défaut). */
export const DEFAULT_REMINDER_MINUTES = 15;

export const DEFAULT_END_WEEKS = 4;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function defaultTime(date: LocalDate, now: Date): LocalTime {
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  if (date !== today) return "08:00";
  const nextHour = Math.min(23, now.getHours() + 1);
  return `${pad(nextHour)}:00`;
}

export function initialDraft(date: LocalDate, entries: readonly RoutineEntry[], now: Date): FormDraft {
  return {
    entries,
    startDate: date,
    time: defaultTime(date, now),
    repetitionOn: false,
    every: 1,
    weekdays: [weekdayOf(date)],
    endKind: "UNTIL",
    endDate: addDays(date, DEFAULT_END_WEEKS * 7),
    endCount: DEFAULT_END_WEEKS,
    reminderMinutes: null,
  };
}

export function draftFromRoutine(
  routine: Pick<Routine, "entries" | "startDate" | "time" | "repetition"> & { readonly reminderMinutes?: number | null },
): FormDraft {
  const repetition = routine.repetition;
  return {
    entries: routine.entries,
    startDate: routine.startDate,
    time: routine.time,
    repetitionOn: repetition !== null,
    every: repetition?.every ?? 1,
    weekdays: repetition?.weekdays ?? [weekdayOf(routine.startDate)],
    endKind: repetition?.end.kind ?? "UNTIL",
    endDate: repetition?.end.kind === "UNTIL" ? repetition.end.date : addDays(routine.startDate, DEFAULT_END_WEEKS * 7),
    endCount: repetition?.end.kind === "FOR" ? repetition.end.count : DEFAULT_END_WEEKS,
    reminderMinutes: routine.reminderMinutes ?? null,
  };
}

export function toRoutineDraft(form: FormDraft): RoutineDraft {
  return {
    startDate: form.startDate,
    time: form.time,
    entries: form.entries,
    reminderMinutes: form.reminderMinutes,
    repetition: form.repetitionOn
      ? {
          unit: "WEEK",
          every: form.every,
          weekdays: [...form.weekdays].sort((a, b) => a - b),
          end: form.endKind === "UNTIL" ? { kind: "UNTIL", date: form.endDate } : { kind: "FOR", count: form.endCount },
        }
      : null,
  };
}

/**
 * CE-UI-04 / D-499 : la sélection validée remplace la liste. Une Séance déjà présente garde sa place, son
 * identité d'entrée et son motif ; une Séance nouvellement cochée est ajoutée en fin de liste, dans l'ordre de
 * sélection, avec « à chaque fois ». [Ordre initial d'une sélection : point ouvert de CE-UI-04 §14 — ordre de
 * sélection retenu, réordonnable ensuite dans le formulaire.]
 */
export function applySelection(entries: readonly RoutineEntry[], selected: readonly string[], newId: () => string): RoutineEntry[] {
  const kept = entries.filter((entry) => selected.includes(entry.sessionId));
  const added = selected
    .filter((sessionId) => !kept.some((entry) => entry.sessionId === sessionId))
    .map((sessionId) => ({ id: newId(), sessionId, frequency: EVERY_TIME }));
  return [...kept, ...added];
}

export function moveEntry<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return [...list];
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
}

export function toggleWeekday(weekdays: readonly Weekday[], day: Weekday): Weekday[] {
  return weekdays.includes(day) ? weekdays.filter((value) => value !== day) : [...weekdays, day].sort((a, b) => a - b);
}

/** D-223 : titre contextuel selon le nombre de contenus. */
export function formTitle(count: number): string {
  const t = planningStrings.form;
  if (count === 0) return t.titleEmpty;
  return count === 1 ? t.titleSession : t.titleRoute;
}

/** Libellé de fréquence d'une ligne (chapitre 10 : forme générique ; x = n → « à chaque fois »). */
export function frequencyLabel(entry: RoutineEntry): string {
  const { x, n } = entry.frequency;
  return x === n ? planningStrings.form.everyTime : planningStrings.form.frequency.replace("{x}", String(x)).replace("{n}", String(n));
}

/** Libellé d'un délai de rappel (Figma `1992:6838`, `1992:7369`) : « 5' », « 1h », « 1h20 ». */
export function reminderLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}’`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, "0")}`;
}
