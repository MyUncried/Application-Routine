import { appLanguage, FALLBACK_LANGUAGE, type AppLanguage } from "./locale";
import { enBundle, frBundle, type PartialBundle, type StringBundle } from "./resources/bundles";

const BUNDLES: Readonly<Record<AppLanguage, PartialBundle>> = { fr: frBundle, en: enBundle };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Catalogue d'une langue complété, clé par clé, par le catalogue de repli. */
export function withFallback<T>(fallback: T, partial: unknown): T {
  if (!isPlainObject(fallback) || !isPlainObject(partial)) return (partial === undefined ? fallback : partial) as T;
  const merged: Record<string, unknown> = { ...fallback };
  for (const [key, value] of Object.entries(partial)) merged[key] = withFallback((fallback as Record<string, unknown>)[key], value);
  return merged as T;
}

/**
 * Point d’accès unique au catalogue de textes : la langue de l'interface (`locale.ts`), complétée par l'anglais
 * pour toute clé absente (J1, règle 3 de « Gestion des langues », ch. 07). Les écrans ne doivent jamais importer
 * un fichier de `./resources` directement.
 */
export const strings: StringBundle =
  appLanguage === "fr" ? frBundle : (withFallback(BUNDLES[FALLBACK_LANGUAGE], BUNDLES[appLanguage]) as StringBundle);

export type Strings = StringBundle;
