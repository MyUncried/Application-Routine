/**
 * J1 « Gestion des langues » (23/11/2026) : accord singulier / pluriel selon la langue de l'interface.
 * Règles écrites à la main (CLDR, nombres entiers) plutôt que `Intl.PluralRules`, dont le support par Hermes n'est
 * pas documenté : en français (et en portugais), 0 et 1 sont au singulier ; en anglais (et en espagnol, italien,
 * allemand), seul 1 l'est.
 */
import { appLanguage, type AppLanguage } from "./locale";

export type PluralCategory = "one" | "other";

const RULES: Readonly<Record<AppLanguage, (count: number) => PluralCategory>> = {
  fr: (count) => (Math.abs(count) < 2 ? "one" : "other"),
  en: (count) => (count === 1 ? "one" : "other"),
};

export function pluralCategory(count: number, language: AppLanguage = appLanguage): PluralCategory {
  return RULES[language](count);
}

/** `one` ou `other` selon le nombre et la langue de l'interface. */
export function pluralOf<T>(count: number, forms: { readonly one: T; readonly other: T }): T {
  return pluralCategory(count) === "one" ? forms.one : forms.other;
}
