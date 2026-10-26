/**
 * PRE-7 (R-4, D-445 C03, v7 §3, validée par Hermann) — décision UNIQUE de sauvegarde d'un
 * Mouvement existant modifié, quel que soit le contexte d'édition (Catalogue, reprise en
 * création, occurrence de Séance par le crayon, C04). Remplace la question d'identité de MFN-08,
 * conditionnée par l'indicateur « déjà utilisé » (retiré, C03).
 *
 * | Condition | Décision |
 * |---|---|
 * | Nom enregistré modifié (casse et accents compris), avec ou sans autre exercice ou historique | `CHOICE` : Mettre à jour ce mouvement / Créer un nouveau mouvement / Annuler |
 * | Nom inchangé, contenu modifié, au moins un autre exercice ou une exécution enregistrée | `CONFIRM` : Annuler / Confirmer |
 * | Nom inchangé, contenu modifié, ni autre exercice ni exécution | `SILENT` : même Mouvement |
 * | Aucun changement de contenu (paramètres seuls) | `NONE` |
 *
 * Contenu : nom, alias, description, médias (ordre compris), Catégorie, Zones (ensemble) et
 * structure des phases (identités, libellés, ordre). Les durées de phase et les autres paramètres
 * d'exécution n'en font jamais partie. « Autres exercices » : définitions du Catalogue et
 * occurrences de Séance persistées, hors objet édité, chacune comptée une fois ; les exécutions
 * enregistrées sont un compte distinct (0 tant que le moteur T04 n'existe pas). L'application ne
 * déduit jamais la différence sémantique entre correction et nouveau mouvement.
 *
 * Fonctions pures — sans React, SQLite, Expo, i18n ni horloge.
 */

import type { Movement, MovementPhase } from "./Movement";

/** Contenu partagé d'un Mouvement, tel qu'enregistré (`before`) ou saisi (`after`). */
export type MovementContentSnapshot = {
  readonly name: string;
  readonly aliases: readonly string[];
  readonly description: string | null;
  /** Identifiants ordonnés des médias. */
  readonly mediaAssetIds: readonly string[];
  readonly categoryId: string | null;
  readonly bodyZoneIds: readonly string[];
  readonly phases: readonly MovementPhase[];
};

export type MovementSaveDecision =
  | { readonly kind: "NONE" }
  | { readonly kind: "SILENT" }
  | { readonly kind: "CONFIRM"; readonly otherCount: number }
  | { readonly kind: "CHOICE"; readonly otherCount: number };

/** Contenu enregistré d'un Mouvement (`before` de la décision). */
export function movementContentOf(movement: Movement): MovementContentSnapshot {
  return {
    name: movement.name,
    aliases: movement.aliases,
    description: movement.description,
    mediaAssetIds: movement.media.map((item) => item.assetId),
    categoryId: movement.categoryId,
    bodyZoneIds: movement.bodyZoneIds,
    phases: movement.phases,
  };
}

function sameList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  const set = new Set(a);
  return set.size === new Set(b).size && b.every((value) => set.has(value));
}

function samePhases(a: readonly MovementPhase[], b: readonly MovementPhase[]): boolean {
  return a.length === b.length && a.every((phase, index) => phase.id === b[index]!.id && phase.label === b[index]!.label);
}

/** Vrai si le contenu partagé diffère (voir l'en-tête) ; les paramètres d'exécution sont ignorés. */
export function movementContentChanged(before: MovementContentSnapshot, after: MovementContentSnapshot): boolean {
  return (
    before.name !== after.name ||
    !sameList(before.aliases, after.aliases) ||
    (before.description ?? null) !== (after.description ?? null) ||
    !sameList(before.mediaAssetIds, after.mediaAssetIds) ||
    (before.categoryId ?? null) !== (after.categoryId ?? null) ||
    !sameSet(before.bodyZoneIds, after.bodyZoneIds) ||
    !samePhases(before.phases, after.phases)
  );
}

/**
 * Décision C03 (voir l'en-tête). `otherUsageCount` : autres exercices (définitions et
 * occurrences persistées, hors objet édité) ; `executionCount` : exécutions enregistrées du
 * Mouvement, recherchées par identité (0 avant T04). Une entrée négative ou non entière lève.
 */
export function decideMovementSave(
  before: MovementContentSnapshot,
  after: MovementContentSnapshot,
  otherUsageCount: number,
  executionCount = 0,
): MovementSaveDecision {
  for (const count of [otherUsageCount, executionCount]) {
    if (!Number.isInteger(count) || count < 0) {
      throw new Error("decideMovementSave: counts must be non-negative integers.");
    }
  }
  if (before.name !== after.name) {
    return { kind: "CHOICE", otherCount: otherUsageCount };
  }
  if (!movementContentChanged(before, after)) {
    return { kind: "NONE" };
  }
  return otherUsageCount > 0 || executionCount > 0 ? { kind: "CONFIRM", otherCount: otherUsageCount } : { kind: "SILENT" };
}
