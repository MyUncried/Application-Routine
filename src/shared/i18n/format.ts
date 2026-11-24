/**
 * J1 « Gestion des langues » (23/11/2026) : formats régionaux (règle 8 de « Gestion des langues », ch. 07) —
 * séparateur décimal et dates selon la balise régionale de l'interface (`fr-FR` : « 1,25 », `en-US` : « 1.25 »).
 * Le nombre garde son écriture actuelle (pas de séparateur de milliers, toutes ses décimales).
 */
import { appLocaleTag, appUses24HourClock } from "./locale";

function separatorOf(tag: string): string {
  try {
    return (1.5).toLocaleString(tag).includes(",") ? "," : ".";
  } catch {
    return ".";
  }
}

export const decimalSeparator: string = separatorOf(appLocaleTag);

/** Nombre au séparateur décimal de la région (« 1,25 » en français, « 1.25 » en anglais). */
export function formatDecimal(value: number, separator: string = decimalSeparator): string {
  return String(value).replace(".", separator);
}

/** Date courte de la région (« 23/11/2026 » en français, « 11/23/2026 » aux États-Unis). */
export function formatShortDate(date: Date, tag: string = appLocaleTag): string {
  return date.toLocaleDateString(tag);
}

/** Horloge de 12 heures : « 8:00 AM », « 6:30 PM », « 12:00 AM » pour minuit. `minutes` : « 00 » à « 59 ». */
export function clock12(hours: number, minutes: string): string {
  return `${hours % 12 === 0 ? 12 : hours % 12}:${minutes} ${hours < 12 ? "AM" : "PM"}`;
}

/**
 * J1.8 (24/11/2026, norme iOS) : heure affichée selon le réglage 12 / 24 heures de l'iPhone — sur 24 heures, le format
 * de la langue (`label24`, « 8h30 », « 08:30 ») ; sur 12 heures, « 8:30 AM ».
 */
export function clockTime(hours: number, minutes: string, label24: string, uses24HourClock: boolean = appUses24HourClock): string {
  return uses24HourClock ? label24 : clock12(hours, minutes);
}
