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

/** Langue du moteur JavaScript (`Intl`), quand le module natif manque. */
function intlLocales(): readonly DeviceLocale[] {
  try {
    const [languageCode, ...rest] = Intl.DateTimeFormat().resolvedOptions().locale.split("-");
    const regionCode = rest.find((part) => /^[A-Za-z]{2}$/.test(part)) ?? null;
    return languageCode === undefined ? [] : [{ languageCode, regionCode }];
  } catch {
    return [];
  }
}

/**
 * Langues du téléphone. Le module natif est chargé ici, à la demande : une version de l'application compilée avant
 * l'ajout d'`expo-localization` (client de développement plus ancien servi par Metro) ne plante pas au démarrage ;
 * elle prend la langue du moteur JavaScript.
 */
function deviceLocales(): readonly DeviceLocale[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- chargement à la demande, tolérant à l'absence du module natif
    const { getLocales } = require("expo-localization") as typeof import("expo-localization");
    return getLocales();
  } catch {
    return intlLocales();
  }
}

/**
 * J1.8 (24/11/2026, choix « A » de Hermann : suivre la norme iOS) : horloge de 24 heures ou de 12 heures (AM / PM)
 * selon le réglage de l'iPhone (Réglages › Général › Date et heure), quelle que soit la langue. À défaut du module
 * natif, le format horaire de la région (`Intl`), sinon 24 heures.
 */
function deviceUses24HourClock(tag: string): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- chargement à la demande, tolérant à l'absence du module natif
    const { getCalendars } = require("expo-localization") as typeof import("expo-localization");
    const value = getCalendars()[0]?.uses24hourClock;
    if (typeof value === "boolean") return value;
  } catch {
    // Module natif absent : repli ci-dessous.
  }
  try {
    const hour12 = new Intl.DateTimeFormat(tag, { hour: "numeric" }).resolvedOptions().hour12;
    return hour12 !== true;
  } catch {
    return true;
  }
}

const locales = deviceLocales();

/** Langue de l'interface pour toute la session. */
export const appLanguage: AppLanguage = resolveLanguage(locales);

/** Balise régionale pour les formats et la voix (`fr-FR`, `en-GB`…). */
export const appLocaleTag: string = resolveLocaleTag(locales, appLanguage);

/** Horloge de 24 heures (`true`) ou de 12 heures avec AM / PM (`false`), selon le réglage de l'iPhone. */
export const appUses24HourClock: boolean = deviceUses24HourClock(appLocaleTag);
