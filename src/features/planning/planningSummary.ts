import { parseLocalDate, type LocalDate, type LocalTime, type RoutineDraft, type Weekday } from "@/domain/planning/Routine";
import { planningStrings } from "@/features/planning/planningStrings";

/**
 * Récapitulatif de planification (CE-UI-05, « Le récapitulatif de planification ») : phrase DÉRIVÉE des paramètres,
 * jamais stockée comme donnée métier. Formes relevées dans Figma (`1992:7716`, `1992:6838`) :
 * - « Planifiée le 3 août 2026 à 8 h, sans répétition. »
 * - « Toutes les 2 semaines, les lundis et jeudis, à 8 h, jusqu'au 23 août 2026. »
 * Règle associée : quand la répétition est désactivée, la phrase n'annonce aucune récurrence.
 */

const t = planningStrings;

export function formatLongDate(value: LocalDate): string {
  const date = parseLocalDate(value);
  return `${date.getDate()} ${t.months[date.getMonth()]} ${date.getFullYear()}`;
}

/** « 8 h », « 8 h 30 » (heure de la phrase). */
export function formatSpokenTime(time: LocalTime): string {
  const [hours, minutes] = time.split(":").map(Number);
  return minutes === 0 ? `${hours} h` : `${hours} h ${String(minutes).padStart(2, "0")}`;
}

function joinFrench(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} ${t.and} ${parts[parts.length - 1]}`;
}

export function formatWeekdaysPhrase(weekdays: readonly Weekday[]): string {
  const sorted = [...weekdays].sort((a, b) => a - b);
  return `${t.the} ${joinFrench(sorted.map((day) => t.weekdayPlurals[day - 1]))}`;
}

export function formatRoutineSummary(draft: Pick<RoutineDraft, "startDate" | "time" | "repetition">): string {
  const time = formatSpokenTime(draft.time);
  const repetition = draft.repetition;
  if (repetition === null) {
    return t.summary.single.replace("{date}", formatLongDate(draft.startDate)).replace("{time}", time);
  }
  const every = repetition.every === 1 ? t.summary.everyWeek : t.summary.everyWeeks.replace("{count}", String(repetition.every));
  const end =
    repetition.end.kind === "UNTIL"
      ? t.summary.until.replace("{date}", formatLongDate(repetition.end.date))
      : t.summary.during.replace("{count}", String(repetition.end.count)).replace("{unit}", repetition.end.count === 1 ? t.weekUnit.singular : t.weekUnit.plural);
  const days = repetition.weekdays.length > 0 ? `, ${formatWeekdaysPhrase(repetition.weekdays)}` : "";
  return `${every}${days}, ${t.summary.at} ${time}, ${end}.`;
}
