/**
 * PRE-7 (A1.2, D-437, D-439, MFN-03 à MFN-05, MFN-08) — port de persistance du
 * Mouvement (`Movement.ts`), implémenté par l'infrastructure
 * (`SqliteMovementRepository`). Les cas métier attendus sont retournés en
 * unions discriminées ; seule une entrée invalide lève.
 *
 * Aucun ramassage automatique (MFN-04) : un Mouvement enregistré persiste même
 * sans référence, et la suppression d'une définition ne le supprime pas. La
 * suppression explicite est refusée tant qu'une définition le référence
 * (MFN-03) ; les filiations des copies (`sourceMovementId`) ne sont ni lues ni
 * modifiées.
 */

import type { Movement } from "./Movement";

/** Issue d'une suppression explicite (MFN-03). */
export type DeleteMovementOutcome =
  | { readonly status: "DELETED" }
  | { readonly status: "NOT_FOUND" }
  /** Au moins une définition ou une occurrence de Séance (R-3) référence le Mouvement : rien n'est supprimé. */
  | { readonly status: "REFERENCED"; readonly definitionCount: number; readonly occurrenceCount: number };

/** Issue d'une opération de groupe de niveaux (MFN-05, D-439). */
export type MovementGroupOutcome =
  | { readonly status: "OK"; readonly members: readonly Movement[] }
  | { readonly status: "NOT_FOUND" }
  /** Le Mouvement appartient déjà à un autre groupe (au plus un groupe). */
  | { readonly status: "ALREADY_IN_GROUP" }
  /**
   * Réordonnancement qui n'est pas une permutation exacte des membres ; aussi
   * rendu par `attachToGroup` / `insertAfter` pour un rattachement à soi-même
   * (`movementId === originId`).
   */
  | { readonly status: "INVALID_ORDER" };

export interface MovementRepository {
  /**
   * Crée un Mouvement validé (`validateMovement`, lève sur entrée invalide),
   * avec ses Zones, ses médias (assets créés dans la même transaction) et sa
   * structure de phases et alias (R-3). Un nom déjà pris (clé canonique) lève
   * `DuplicateMovementNameError` (C01), aucune fusion ni renommage implicite.
   */
  create(movement: Movement): Promise<Movement>;
  findById(id: string): Promise<Movement | null>;
  /**
   * Recherche par nom normalisé (`normalizeMovementName`, contenu), Mouvements
   * locaux compris (MFN-04, MFN-06) ; requête vide : tous les Mouvements.
   * Ordre : nom normalisé puis identifiant.
   */
  search(query: string): Promise<readonly Movement[]>;
  /**
   * PRE-7 (R-3, D-445 C03, C05) : nombre d'occurrences de Séance persistées qui référencent
   * le Mouvement (remplace `markUsed` : aucun indicateur d'utilisation irréversible).
   * PRE-7 (R-4, C04) : `excludingSessionId` retire du compte les occurrences de cette Séance
   * (celle du brouillon en cours, dont l'éditeur compte lui-même les occurrences).
   */
  countOccurrences(id: string, excludingSessionId?: string): Promise<number>;
  /** Nombre de définitions du Catalogue qui référencent le Mouvement. */
  countDefinitions(id: string): Promise<number>;
  /** Suppression explicite, refusée si une définition ou une occurrence de Séance le référence (MFN-03, R-3). */
  delete(id: string): Promise<DeleteMovementOutcome>;
  /**
   * Rattache `movementId` au groupe de `originId`, en dernier ; le groupe est
   * créé (origine en premier) si l'origine n'en a pas (MFN-05).
   */
  attachToGroup(movementId: string, originId: string): Promise<MovementGroupOutcome>;
  /** Comme `attachToGroup`, immédiatement après l'origine (« un niveau créé s'insère après celui dont il est issu »). */
  insertAfter(movementId: string, originId: string): Promise<MovementGroupOutcome>;
  /** Réordonne le groupe : `orderedIds` doit être une permutation exacte de ses membres. */
  reorder(groupId: string, orderedIds: readonly string[]): Promise<MovementGroupOutcome>;
  /**
   * Retire le Mouvement de son groupe ; les autres membres gardent leur contenu
   * et leur identité, le groupe garde son identifiant (singleton compris).
   */
  detachFromGroup(movementId: string): Promise<MovementGroupOutcome>;
  /** Membres du groupe, dans l'ordre des clés de tri. */
  listGroup(groupId: string): Promise<readonly Movement[]>;
}

/**
 * PRE-7 (A1.3) : Mouvement désigné par une origine de création (même geste,
 * variante) introuvable — entrée invalide, rien n'est écrit. La garde
 * provisoire d'A1.2 (`SharedMovementStructureError`) est levée au profit de
 * la correction partagée explicite (`sharedCorrection.ts`).
 */
export class MovementNotFoundError extends Error {
  constructor(readonly movementId: string) {
    super("The referenced movement does not exist.");
    this.name = "MovementNotFoundError";
  }
}

/**
 * PRE-7 (R-3, D-445 C01, v7 §2 : « nom principal unique par clé canonique… garantie à
 * l'enregistrement, y compris en cas d'écriture concurrente ; aucune fusion implicite ») :
 * le nom normalisé (`normalizeMovementName`) est déjà celui d'un autre Mouvement. Rien
 * n'est écrit ; l'interface signale l'erreur et laisse l'utilisateur corriger le nom.
 */
export class DuplicateMovementNameError extends Error {
  constructor(readonly normalizedName: string) {
    super("A movement with this name already exists.");
    this.name = "DuplicateMovementNameError";
  }
}
