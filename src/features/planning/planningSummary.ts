import { parseLocalDate, type LocalDate, type LocalTime, type RoutineDraft, type Weekday } from "@/domain/planning/Routine";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { strings } from "@/shared/i18n";

/**
 * Synthèse de la zone de contexte (D-521, RM-259 ; CE-UI-12, 18/11/2026) : phrase DÉRIVÉE des paramètres, jamais stockée.
 * Durée en premier, sans majuscule initiale ni point final, sans « Prochain créneau » :
 * « 12’35” toutes les 2 semaines, les lundis et jeudis, à 8h, jusqu’au 23 août 2026 ».
 * Quand les jours ne tiennent pas, ils deviennent « X jours par semaine » (forme compacte, choisie par l'écran).
 * [Récapitulatif protégé en bas du formulaire, « Planifiée le … » / « Toutes les … » avec majuscule et point final (CE-UI-05,
 * Figma 1992:7716 / 1992:6838) — remplacé le 18/11/2026.]
 */

const t = strings.planning;

export function formatLongDate(value: LocalDate): string {
  const date = parseLocalDate(value);
  return fillTemplate(t.dates.dayMonthYear, { day: String(date.getDate()), month: t.months[date.getMonth()]!, year: String(date.getFullYear()) });
}

/** « 8 h », « 8 h 30 » (heure de la phrase). */
export function formatSpokenTime(time: LocalTime): string {
  const [hours, minutes] = time.split(":").map(Number);
  return minutes === 0
    ? fillTemplate(t.time.spokenHour, { hours: String(hours) })
    : fillTemplate(t.time.spoken, { hours: String(hours), minutes: String(minutes).padStart(2, "0") });
}

/** « a, b et c » (« a, b and c » en anglais). */
function joinWords(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} ${t.and} ${parts[parts.length - 1]}`;
}

export function formatWeekdaysPhrase(weekdays: readonly Weekday[]): string {
  const sorted = [...weekdays].sort((a, b) => a - b);
  return `${t.the} ${joinWords(sorted.map((day) => t.weekdayPlurals[day - 1]))}`;
}

/** « 8h », « 8h30 » (heure de la synthèse, Figma `12650:27854`). */
export function formatCompactTime(time: LocalTime): string {
  const [hours, minutes] = time.split(":").map(Number);
  return minutes === 0
    ? fillTemplate(t.time.compactHour, { hours: String(hours) })
    : fillTemplate(t.time.compact, { hours: String(hours), minutes: String(minutes).padStart(2, "0") });
}

export type SynthesisInput = Pick<RoutineDraft, "startDate" | "time" | "repetition">;

/**
 * RM-259 : synthèse. `duration` : libellé de durée du premier créneau (vide : omis) ; `compactDays` : jours remplacés
 * par « X jours par semaine ».
 */
export function formatPlanningSynthesis(draft: SynthesisInput, duration: string, compactDays = false): string {
  const time = formatCompactTime(draft.time);
  const repetition = draft.repetition;
  const parts: string[] = [];
  if (repetition === null) {
    parts.push(fillTemplate(t.synthesis.single, { date: formatLongDate(draft.startDate), time }));
  } else {
    const every =
      repetition.unit === "DAY"
        ? repetition.every === 1
          ? t.synthesis.everyDay
          : t.synthesis.everyDays.replace("{count}", String(repetition.every))
        : repetition.every === 1
          ? t.synthesis.everyWeek
          : t.synthesis.everyWeeks.replace("{count}", String(repetition.every));
    const segments = [every];
    if (repetition.unit === "WEEK" && repetition.weekdays.length > 0) {
      segments.push(
        compactDays
          ? (repetition.weekdays.length === 1 ? t.synthesis.daysPerWeekOne : t.synthesis.daysPerWeek).replace("{count}", String(repetition.weekdays.length))
          : formatWeekdaysPhrase(repetition.weekdays),
      );
    }
    segments.push(`${t.summary.at} ${time}`);
    if (repetition.end.kind === "UNTIL") segments.push(fillTemplate(t.summary.until, { date: formatLongDate(repetition.end.date) }));
    else segments.push(duringLabel(repetition.unit, repetition.end.count));
    parts.push(segments.join(", "));
  }
  return duration === "" ? parts.join("") : `${duration} ${parts.join("")}`;
}

/**
 * Récurrence d'une carte déployée du Calendrier Semaine (Figma `1992:6389` : « Chaque lundi ») : chaque semaine →
 * « Chaque lundi et jeudi » ; toutes les N semaines → « Toutes les 2 semaines, lundi et jeudi ».
 */
export function formatRecurrence(routine: Pick<RoutineDraft, "repetition">): string {
  const repetition = routine.repetition;
  if (repetition === null) return "";
  // RM-257 : unité Jour — « Tous les jours », « Tous les 3 jours » (aucune rangée de jours).
  if (repetition.unit === "DAY") return repetition.every === 1 ? t.calendar.everyDay : t.calendar.everyDays.replace("{count}", String(repetition.every));
  const days = joinWords([...repetition.weekdays].sort((a, b) => a - b).map((day) => t.weekdayNamesInSentence[day - 1]!));
  return repetition.every === 1 ? `${t.calendar.everyWeekdayPrefix} ${days}` : `${t.summary.everyWeeks.replace("{count}", String(repetition.every))}, ${days}`;
}

/** Borne « pendant » : « pendant 6 semaines », « pendant 10 jours ». */
export function duringLabel(unit: "WEEK" | "DAY", count: number): string {
  const units = unit === "DAY" ? t.dayUnit : t.weekUnit;
  return fillTemplate(t.summary.during, { count: String(count), unit: count === 1 ? units.singular : units.plural });
}
