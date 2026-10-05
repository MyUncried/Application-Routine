import { normalizeName } from "@/domain/sessions/validation";

/**
 * Référentiel PERSISTANT des Zones corporelles (V2-PRE-1, plan §3.1 ;
 * V2-PRE-2, plan §6.1) : nom et état actif/retiré, sans couleur. Distinct de
 * `@/features/reference-data/bodyZones.ts` (`BODY_ZONES`), qui reste une
 * source historique de seed et de compatibilité.
 *
 * V2-PRE-2 : clé normalisée obligatoire et unique (`canonicalKey`,
 * `canonicalBodyZoneKey`) — créer un nom dont la clé normalisée correspond
 * à une entrée RETIRÉE la réactive (D2) ; un nom actif de même clé est
 * refusé comme doublon. Aucune couleur n'est jamais proposée ni stockée.
 */

export type BodyZone = {
  readonly id: string;
  readonly name: string;
  /**
   * Toujours renseignée en pratique par le Repository (`migration008`,
   * `NOT NULL` en base). Champ OPTIONNEL uniquement sur ce type LU, pour la
   * compatibilité structurelle de fixtures hors périmètre d'écriture
   * (`compositionPresentation.test.ts`, `ActivityCard.test.tsx`,
   * `scope_allow`) qui construisent encore ce type sans elle — même patron
   * que `ActivityDefinition.categoryId?`.
   */
  readonly canonicalKey?: string;
  readonly isActive: boolean;
  readonly createdAt: string;
};

/** Une Zone est disponible pour une NOUVELLE affectation si et seulement si elle est active. */
export function isBodyZoneAssignable(zone: BodyZone): boolean {
  return zone.isActive;
}

/** Sous-ensemble assignable à une NOUVELLE sélection (actives uniquement), dans l'ordre d'origine — jamais utilisé pour filtrer l'affichage d'une Zone déjà référencée par un objet existant. */
export function listAssignableBodyZones(zones: readonly BodyZone[]): readonly BodyZone[] {
  return zones.filter(isBodyZoneAssignable);
}

/** Entrée de création d'une Zone (modale de sélection Zones, `13` §4.10) — nom seul, jamais de couleur ni d'identifiant (généré par le Repository). */
export type CreateBodyZoneInput = {
  readonly name: string;
};

export type BodyZoneValidationErrorCode = "REQUIRED" | "TOO_LONG" | "DUPLICATE" | "RETIRED" | "NOT_FOUND";
export type BodyZoneValidationField = "bodyZone.name" | "bodyZone.id";
export type BodyZoneValidationViolation = {
  readonly code: BodyZoneValidationErrorCode;
  readonly field: BodyZoneValidationField;
  readonly details?: { readonly max?: number };
};
export type BodyZoneValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly violations: readonly BodyZoneValidationViolation[] };

/** Zone : `1..80` points de code (T9, matrice §5.2 ; code), distinct des bornes `≤40` d'Étiquette/Catégorie. */
export const BODY_ZONE_NAME_MAX_LENGTH = 80;

function normalizeBodyZoneName(raw: string): string {
  return normalizeName(raw);
}

/** Clé canonique de comparaison/unicité (même patron que `canonicalCategoryKey`/`canonicalLabelKey`) — jamais affichée à l'utilisateur. */
export function canonicalBodyZoneKey(raw: string): string {
  return normalizeBodyZoneName(raw)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Nom d'une Zone : non vide après normalisation, au plus `BODY_ZONE_NAME_MAX_LENGTH` points de code. */
export function validateBodyZoneName(raw: string): BodyZoneValidationResult<string> {
  const normalized = normalizeBodyZoneName(raw);
  const length = Array.from(normalized).length;
  if (length < 1) {
    return { ok: false, violations: [{ code: "REQUIRED", field: "bodyZone.name" }] };
  }
  if (length > BODY_ZONE_NAME_MAX_LENGTH) {
    return {
      ok: false,
      violations: [
        { code: "TOO_LONG", field: "bodyZone.name", details: { max: BODY_ZONE_NAME_MAX_LENGTH } },
      ],
    };
  }
  return { ok: true, value: normalized };
}
