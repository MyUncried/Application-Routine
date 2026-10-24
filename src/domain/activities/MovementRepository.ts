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
  /** Au moins une définition référence le Mouvement : rien n'est supprimé. */
  | { readonly status: "REFERENCED"; readonly definitionCount: number };

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
   * structure de phases. `used` est écrit tel que fourni (faux au départ).
   */
  create(movement: Movement): Promise<Movement>;
  findById(id: string): Promise<Movement | null>;
  /**
   * Recherche par nom normalisé (`normalizeMovementName`, contenu), Mouvements
   * locaux compris (MFN-04, MFN-06) ; requête vide : tous les Mouvements.
   * Ordre : nom normalisé puis identifiant.
   */
  search(query: string): Promise<readonly Movement[]>;
  /** Marque « déjà utilisé » (MFN-08), irréversible ; identifiants inconnus ignorés. */
  markUsed(ids: readonly string[]): Promise<void>;
  /** Nombre de définitions du Catalogue qui référencent le Mouvement. */
  countDefinitions(id: string): Promise<number>;
  /** Suppression explicite, refusée si une définition le référence (MFN-03). */
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
 * PRE-7 (A1.2, frontière A1.3) : une mise à jour d'Exercice qui changerait
 * l'ensemble des phases d'un Mouvement PARTAGÉ (référencé par plusieurs
 * définitions) est refusée, sans écriture, en attendant la correction partagée
 * atomique de A1.3 (MFN-08 : durées par `phaseId`, frères incomplets). Le
 * contenu partagé (nom, description, médias, Catégorie, Zones, libellés et
 * ordre des phases) reste modifiable.
 */
export class SharedMovementStructureError extends Error {
  constructor() {
    super("The phase set of a shared movement cannot be changed outside a shared correction.");
    this.name = "SharedMovementStructureError";
  }
}
