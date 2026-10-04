import { SESSION_COLORS, type SessionColor } from "@/domain/sessions/Session";
import { normalizeName } from "@/domain/sessions/validation";

/**
 * Étiquette persistante (V2-PRE-1, plan §3.1/§3.3 ; V2-PRE-2, plan §6.1) :
 * nom, couleur, état actif/retiré, affectation FACULTATIVE à une Séance. La
 * couleur affichée d'une Séance est DÉRIVÉE de son Étiquette associée — une
 * Étiquette retirée reste représentable par les Séances qui la référencent
 * déjà, sans être disponible pour une nouvelle affectation (même règle que
 * `@/domain/body-zones`).
 *
 * V2-PRE-2 : clé normalisée obligatoire et unique (`canonicalKey`,
 * `canonicalLabelKey`) — créer un nom dont la clé normalisée correspond à
 * une entrée RETIRÉE la réactive (D2, même identifiant, associations
 * conservées, couleur choisie appliquée) ; un nom actif de même clé est
 * refusé comme doublon.
 *
 * Réutilise l'énumération `SessionColor`/`SESSION_COLORS` déjà établie
 * (`@/domain/sessions/Session`) plutôt que d'en dupliquer une variante.
 */

export type LabelColor = SessionColor;
export const LABEL_COLORS: readonly LabelColor[] = SESSION_COLORS;

export type Label = {
  readonly id: string;
  readonly name: string;
  readonly canonicalKey: string;
  readonly color: LabelColor;
  readonly isActive: boolean;
  readonly createdAt: string;
};

/** Une Étiquette est disponible pour une NOUVELLE affectation si et seulement si elle est active. */
export function isLabelAssignable(label: Label): boolean {
  return label.isActive;
}

/** Sous-ensemble assignable à une NOUVELLE sélection (actives uniquement), dans l'ordre d'origine. */
export function listAssignableLabels(labels: readonly Label[]): readonly Label[] {
  return labels.filter(isLabelAssignable);
}

/** Entrée de création d'une Étiquette (modale de sélection Étiquettes, `13` §4.10) — nom et couleur, jamais d'identifiant (généré par le Repository). */
export type CreateLabelInput = {
  readonly name: string;
  readonly color: LabelColor;
};

export type LabelValidationErrorCode =
  | "REQUIRED"
  | "TOO_LONG"
  | "INVALID_COLOR"
  /** Un nom dont la clé normalisée correspond à une Étiquette déjà ACTIVE (D2). */
  | "DUPLICATE"
  /** Une nouvelle affectation vise une Étiquette retirée (T16) — la création/réactivation reste permise, seule une AFFECTATION nouvelle à l'identifiant déjà retiré est refusée. */
  | "RETIRED"
  | "NOT_FOUND";
export type LabelValidationField = "label.name" | "label.color" | "label.id";
export type LabelValidationViolation = {
  readonly code: LabelValidationErrorCode;
  readonly field: LabelValidationField;
  readonly details?: { readonly max?: number };
};
export type LabelValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly violations: readonly LabelValidationViolation[] };

/** Mêmes bornes que `@/domain/categories/validation.ts` (`CATEGORY_NAME_MAX_LENGTH`, D-106) — aucun fichier `errors.ts`/`validation.ts` dédié n'est autorisé pour ce domaine (`scope_allow`) : validation co-localisée ici. */
export const LABEL_NAME_MAX_LENGTH = 40;

function normalizeLabelName(raw: string): string {
  return normalizeName(raw);
}

/**
 * Clé canonique de comparaison/unicité (même patron que
 * `canonicalCategoryKey`, D-106) : normalisation des espaces, casse ET
 * diacritiques ignorés. Jamais affichée à l'utilisateur.
 */
export function canonicalLabelKey(raw: string): string {
  return normalizeLabelName(raw)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Nom d'une Étiquette : non vide après normalisation, au plus `LABEL_NAME_MAX_LENGTH` points de code (même contrat que `validateCategoryName`). */
export function validateLabelName(raw: string): LabelValidationResult<string> {
  const normalized = normalizeLabelName(raw);
  const length = Array.from(normalized).length;
  if (length < 1) {
    return { ok: false, violations: [{ code: "REQUIRED", field: "label.name" }] };
  }
  if (length > LABEL_NAME_MAX_LENGTH) {
    return {
      ok: false,
      violations: [{ code: "TOO_LONG", field: "label.name", details: { max: LABEL_NAME_MAX_LENGTH } }],
    };
  }
  return { ok: true, value: normalized };
}

/** Couleur d'une Étiquette (une des `LABEL_COLORS` canoniques). */
export function validateLabelColor(raw: string): LabelValidationResult<LabelColor> {
  if (!LABEL_COLORS.includes(raw as LabelColor)) {
    return { ok: false, violations: [{ code: "INVALID_COLOR", field: "label.color" }] };
  }
  return { ok: true, value: raw as LabelColor };
}

/** Valide et normalise une entrée de création d'Étiquette complète. */
export function validateCreateLabelInput(
  input: CreateLabelInput,
): LabelValidationResult<CreateLabelInput> {
  const violations: LabelValidationViolation[] = [];
  const nameResult = validateLabelName(input.name);
  if (!nameResult.ok) {
    violations.push(...nameResult.violations);
  }
  const colorResult = validateLabelColor(input.color);
  if (!colorResult.ok) {
    violations.push(...colorResult.violations);
  }
  if (violations.length > 0) {
    return { ok: false, violations };
  }
  return {
    ok: true,
    value: { name: (nameResult as { ok: true; value: string }).value, color: input.color },
  };
}
