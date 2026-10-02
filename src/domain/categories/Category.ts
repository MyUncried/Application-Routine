import { SESSION_COLORS, type SessionColor } from "@/domain/sessions/Session";

import { fail, ok, type CategoryValidationResult } from "./errors";

/**
 * Catégorie d'Exercice (V2-PRE-1, plan §3.1) : nom, couleur, état
 * actif/retiré, affectation OBLIGATOIRE à un Exercice (D-211,
 * `08 – Conception fonctionnelle détaillée.md` l.978). La relation
 * historique Catégorie de Séance N:N est retirée du contrat cible — ce type
 * n'est plus colocalisé avec `Session` (`Session.ts` ne le référence plus),
 * la dépendance circulaire `sessions ↔ categories` qui justifiait
 * l'ancienne colocalisation n'existe donc plus.
 *
 * Une Catégorie retirée (`isActive: false`) est indisponible pour une
 * NOUVELLE affectation mais reste représentable par les Exercices qui la
 * référencent déjà (plan §3.1, même règle que `@/domain/body-zones` et
 * `@/domain/labels`).
 */

export type CategoryColor = SessionColor;
export const CATEGORY_COLORS: readonly CategoryColor[] = SESSION_COLORS;

export type Category = {
  readonly id: string;
  readonly name: string;
  readonly canonicalKey: string;
  readonly color: CategoryColor;
  readonly isPredefined: boolean;
  readonly displayOrder: number | null;
  readonly isActive: boolean;
  readonly createdAt: string;
};

/** Une Catégorie est disponible pour une NOUVELLE affectation si et seulement si elle est active. */
export function isCategoryAssignable(category: Category): boolean {
  return category.isActive;
}

/** Sous-ensemble assignable à une NOUVELLE sélection (actives uniquement), dans l'ordre d'origine. */
export function listAssignableCategories(categories: readonly Category[]): readonly Category[] {
  return categories.filter(isCategoryAssignable);
}

/**
 * Référence d'une Catégorie à résoudre pour un Exercice (modale de
 * sélection Catégorie, `08` l.978 / `13` §4.10) : soit une Catégorie déjà
 * persistée (prédéfinie ou créée précédemment), soit une Catégorie
 * personnalisée à créer — sa création ne devient effective que dans la
 * transaction atomique d'enregistrement de l'Exercice, jamais isolément
 * avant elle (même contrat que l'ancien `CreateSessionCategoryInput`).
 */
export type CreateCategoryInput =
  | { readonly kind: "EXISTING"; readonly categoryId: string }
  | { readonly kind: "NEW"; readonly name: string; readonly color: CategoryColor };

/**
 * Valide une couleur de Catégorie (une des `CATEGORY_COLORS` canoniques,
 * réutilisées de `SESSION_COLORS`) — `categories/validation.ts` reste
 * intégralement PRÉSERVÉ (`FILE_UNCHANGED`, contrat de bornes) : cette
 * validation, nouvelle pour cette tranche, est donc co-localisée ici plutôt
 * que d'y être ajoutée.
 */
export function validateCategoryColor(raw: string): CategoryValidationResult<CategoryColor> {
  if (!CATEGORY_COLORS.includes(raw as CategoryColor)) {
    return fail([{ code: "INVALID_COLOR", field: "category.color" }]);
  }
  return ok(raw as CategoryColor);
}
