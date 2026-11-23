/**
 * J1 « Gestion des langues » (23/11/2026) — langue de l'interface (registre ch. 07, « Gestion des langues —
 * décisions de Hermann du 23/11/2026 », règles 2 et 8).
 *
 * - La langue affichée est la première langue de la liste des langues préférées du téléphone que KODJO prend en
 *   charge ; à défaut, l'anglais (« L'anglais en dernier recours »).
 * - Le changement passe par le réglage iOS de langue de l'application : iOS relance alors l'application, donc la
 *   langue est résolue une seule fois, au démarrage. KODJO ne stocke aucune préférence de langue.
 * - La balise régionale (`fr-FR`, `en-GB`…) sert aux formats (nombres, dates) et à la voix : la région du téléphone
 *   quand elle accompagne la langue affichée, sinon une région par défaut.
 */
import { getLocales } from "expo-localization";

/** Langues traduites, dans l'ordre du chantier ; une langue n'est ajoutée ici qu'une fois traduite. */
export const SUPPORTED_LANGUAGES = ["fr", "en"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Repli (règle 3) : anglais. */
export const FALLBACK_LANGUAGE: AppLanguage = "en";

const DEFAULT_REGION: Readonly<Record<AppLanguage, string>> = { fr: "FR", en: "US" };

/** Ce que KODJO lit d'une langue du téléphone (`expo-localization`). */
export type DeviceLocale = { readonly languageCode: string | null; readonly regionCode: string | null };

function isSupported(code: string | null): code is AppLanguage {
  return code !== null && (SUPPORTED_LANGUAGES as readonly string[]).includes(code.toLowerCase());
}

/** Première langue du téléphone prise en charge, sinon l'anglais. */
export function resolveLanguage(locales: readonly DeviceLocale[]): AppLanguage {
  for (const locale of locales) {
    if (isSupported(locale.languageCode)) return locale.languageCode.toLowerCase() as AppLanguage;
  }
  return FALLBACK_LANGUAGE;
}

/** Balise régionale de la langue affichée : région du téléphone pour cette langue, sinon la région par défaut. */
export function resolveLocaleTag(locales: readonly DeviceLocale[], language: AppLanguage): string {
  const match = locales.find((locale) => locale.languageCode?.toLowerCase() === language && locale.regionCode !== null);
  return `${language}-${(match?.regionCode ?? DEFAULT_REGION[language]).toUpperCase()}`;
}

function deviceLocales(): readonly DeviceLocale[] {
  try {
    return getLocales();
  } catch {
    return [];
  }
}

const locales = deviceLocales();

/** Langue de l'interface pour toute la session. */
export const appLanguage: AppLanguage = resolveLanguage(locales);

/** Balise régionale pour les formats et la voix (`fr-FR`, `en-GB`…). */
export const appLocaleTag: string = resolveLocaleTag(locales, appLanguage);
