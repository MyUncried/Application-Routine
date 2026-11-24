import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import { addDays, parseLocalDate, type LocalDate, type LocalTime } from "@/domain/planning/Routine";
import { planningStrings } from "@/features/planning/planningStrings";
import { formatCatalogueSessionDuration, type SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { strings } from "@/shared/i18n";

/**
 * Formats de l'Agenda (D-533, DSF Agenda — Planning du 19/11/2026, CE-UI-15).
 */
const t = planningStrings;

/** DSF § 5 : heure « 8h00 », « 14h00 », sans zéro initial. */
export function formatAgendaTime(time: LocalTime): string {
  const [hours, minutes] = time.split(":");
  return `${Number(hours)}h${minutes ?? "00"}`;
}

/** DSF § 2, ligne 1 : « Novembre 2026 ». */
export function formatAgendaMonth(day: LocalDate): string {
  const date = parseLocalDate(day);
  const month = t.months[date.getMonth()]!;
  return `${month.charAt(0).toLocaleUpperCase("fr-FR")}${month.slice(1)} ${date.getFullYear()}`;
}

/**
 * DSF § 2, ligne 2 : « du 16 au 22 » ; à cheval sur deux mois, seul le mois de fin : « du 26 au 1er novembre » (recette du
 * 19/11/2026 au soir, s19-mois : « Si changement de mois, n'écrire que le mois de fin, pas les deux »).
 * [Chaque borne portait son mois, « du 27 octobre au 2 novembre » (hypothèse technique du 19/11) — remplacé.]
 */
export function formatAgendaWeek(monday: LocalDate): string {
  const start = parseLocalDate(monday);
  const end = parseLocalDate(addDays(monday, 6));
  const day = (date: Date) => (date.getDate() === 1 ? "1er" : String(date.getDate()));
  if (start.getMonth() === end.getMonth()) return `du ${day(start)} au ${day(end)}`;
  return `du ${day(start)} au ${day(end)} ${t.months[end.getMonth()]}`;
}

/**
 * Changement de mois (doubles flèches) : premier jour du mois précédent ou suivant celui du jour sélectionné.
 * [Proposition du DSF § « À clarifier » (« première semaine du mois »), appliquée en attendant l'arbitrage de Hermann.]
 */
export function firstDayOfShiftedMonth(day: LocalDate, shift: -1 | 1): LocalDate {
  const date = parseLocalDate(day);
  const target = new Date(date.getFullYear(), date.getMonth() + shift, 1);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Durée d'une occurrence : ses séances bout à bout. Une séance : libellé de sa carte ; plusieurs : somme, précédée de
 * « ≥ » si une durée n'est pas exacte ; vide si une durée est inconnue.
 */
export function sessionsDurationLabel(projections: readonly SessionCatalogueProjection[]): string {
  if (projections.length === 0) return "";
  if (projections.length === 1) return formatCatalogueSessionDuration(projections[0]!.duration, projections[0]!.forTimeBound);
  if (projections.some((projection) => projection.forTimeBound === null)) return "";
  const seconds = projections.reduce((total, projection) => total + (projection.forTimeBound ?? Math.max(0, projection.duration.seconds)), 0);
  const exact = projections.every((projection) => projection.forTimeBound === undefined && projection.duration.kind === "exact");
  return exact ? formatPhraseDuration(seconds) : `${strings.shared.durationNature.lowerBoundPrefix}${formatPhraseDuration(seconds)}`;
}

/**
 * DSF § 5, ligne 2 : zones corporelles de la routine — une ou deux, « + » quand elles ne tiennent pas. La « spécialité »
 * n'existe pas dans le modèle de données (D-533, classe C) : elle n'est pas affichée tant qu'elle n'est pas définie.
 */
export function zonesLine(zoneNames: readonly string[]): string {
  const unique = [...new Set(zoneNames)];
  if (unique.length <= 2) return unique.join(", ");
  return `${unique.slice(0, 2).join(", ")} +`;
}
