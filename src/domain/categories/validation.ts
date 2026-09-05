/**
 * Validation et normalisation métier de la Catégorie (T01-S09, D-106).
 *
 * Fonction pure, indépendante de SQL et d'Expo : ne lève jamais d'exception,
 * retourne un `CategoryValidationResult` (§ contrat dans `errors.ts`). Les
 * bornes de longueur sont comptées par points de code Unicode
 * (`Array.from(value).length`), même convention que `@/domain/sessions/
 * validation.ts`.
 */

import { normalizeName } from "@/domain/sessions/validation";
import { fail, ok, type CategoryValidationResult } from "./errors";

/** Exportée pour être réutilisée telle quelle comme `maxLength` d'un `TextInput` (écran Catégories) — jamais dupliquée en dur (D-106). */
export const CATEGORY_NAME_MAX_LENGTH = 40;

function codePointLength(value: string): number {
  return Array.from(value).length;
}

/**
 * Trim + réduction des espaces internes — réutilise exactement
 * `normalizeName` (Domaine Séance) : D-106 n'impose aucune règle de
 * normalisation d'espaces différente de celle déjà établie pour le Nom de
 * la Séance/de l'Exercice, aucune raison d'en dupliquer une variante ici.
 * Casse et diacritiques conservés — c'est la valeur affichée et persistée.
 */
export function normalizeCategoryName(raw: string): string {
  return normalizeName(raw);
}

/**
 * Clé canonique de comparaison/unicité (D-106) : normalisation des espaces
 * (`normalizeCategoryName`), puis casse ET diacritiques ignorés
 * (`toLowerCase` + décomposition Unicode NFD + suppression des marques
 * combinantes). Jamais affichée à l'utilisateur — seul `normalizeCategoryName`
 * produit le libellé visible/persisté.
 */
export function canonicalCategoryKey(raw: string): string {
  return normalizeCategoryName(raw)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Nom d'une Catégorie personnalisée : non vide après normalisation, au plus `CATEGORY_NAME_MAX_LENGTH` points de code (D-106). */
export function validateCategoryName(raw: string): CategoryValidationResult<string> {
  const normalized = normalizeCategoryName(raw);
  const length = codePointLength(normalized);

  if (length < 1) {
    return fail([{ code: "REQUIRED", field: "category.name" }]);
  }
  if (length > CATEGORY_NAME_MAX_LENGTH) {
    return fail([{ code: "TOO_LONG", field: "category.name", details: { max: CATEGORY_NAME_MAX_LENGTH } }]);
  }
  return ok(normalized);
}
