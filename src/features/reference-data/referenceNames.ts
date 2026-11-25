/**
 * J1.8 « Gestion des langues » (24/11/2026, demande de Hermann ; registre ch. 07, règle 5) : les Catégories et Zones
 * corporelles fournies par KODJO s'affichent dans la langue de l'interface tant que l'utilisateur ne les a pas
 * renommées. Un nom modifié par l'utilisateur est un contenu utilisateur : il reste tel qu'il a été écrit.
 * En français, le résultat est toujours le nom enregistré (aucun changement).
 */
import { PREDEFINED_CATEGORIES } from "@/domain/categories/defaults";
import { strings } from "@/shared/i18n";

import { BODY_ZONES } from "./bodyZones";

const SEED_CATEGORY_NAMES = new Map(PREDEFINED_CATEGORIES.map((category) => [category.id, category.name]));
const SEED_BODY_ZONE_NAMES = new Map(BODY_ZONES.map((zone) => [zone.id, zone.name]));

function localized(names: Readonly<Record<string, string>>, seeds: ReadonlyMap<string, string>, id: string, storedName: string): string {
  return seeds.get(id) === storedName ? (names[id] ?? storedName) : storedName;
}

/** Nom affiché d'une Catégorie : traduit si c'est une Catégorie KODJO jamais renommée. */
export function categoryDisplayName(id: string, storedName: string): string {
  return localized(strings.referenceData.predefinedCategories, SEED_CATEGORY_NAMES, id, storedName);
}

/** Nom affiché d'une Zone corporelle : traduit si c'est une Zone KODJO jamais renommée. */
export function bodyZoneDisplayName(id: string, storedName: string): string {
  return localized(strings.referenceData.predefinedBodyZones, SEED_BODY_ZONE_NAMES, id, storedName);
}
