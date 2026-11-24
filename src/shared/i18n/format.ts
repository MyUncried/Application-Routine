/**
 * J1 « Gestion des langues » (23/11/2026) : formats régionaux (règle 8 de « Gestion des langues », ch. 07) —
 * séparateur décimal et dates selon la balise régionale de l'interface (`fr-FR` : « 1,25 », `en-US` : « 1.25 »).
 * Le nombre garde son écriture actuelle (pas de séparateur de milliers, toutes ses décimales).
 */
import { appLocaleTag } from "./locale";

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
