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

/**
 * PRE-8, familles de niveaux (règles A à E du 28/10/2026, DSF « Composition et ordre des
 * familles ») : appartenance d'un Mouvement avant une opération — de quoi l'annuler (règle E).
 */
export type MovementPriorMemberships = readonly {
  readonly movementId: string;
  readonly groupId: string | null;
  readonly sortKey: number | null;
}[];

/**
 * Issue d'une composition de famille par geste :
 * - `REORDERED` (A) : seul l'ordre change ; `JOINED` (C2) : entrée dans une famille existante ;
 *   `CREATED` (C1) : famille formée de deux Mouvements sans famille ; `LEFT` (B) : sortie ;
 *   `DISSOLVED` (D2) : sortie du dernier couple, les deux appartenances effacées ;
 * - `previous` : appartenances des lignes écrites, avant l'opération (Annuler) ;
 * - `ALREADY_IN_GROUP` (C6) : un membre d'une autre famille ne se pose sur aucune carte ;
 * - `INVALID_ORDER` : dépôt sur soi-même, ou sortie d'un Mouvement sans famille.
 */
export type MovementFamilyOutcome =
  | {
      readonly status: "OK";
      readonly operation: "REORDERED" | "JOINED" | "CREATED" | "LEFT" | "DISSOLVED";
      readonly groupId: string | null;
      readonly previous: MovementPriorMemberships;
    }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "ALREADY_IN_GROUP" }
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
  /**
   * PRE-8, familles (règles A, C ; 28/10/2026) : pose `movementId` juste au-dessus (niveau
   * supérieur) ou juste en dessous (niveau inférieur) de `anchorId`, dans l'ordre complet de la
   * famille de l'ancre (archivés compris). Même famille : réordonnancement ; Mouvement sans famille
   * sur un membre : entrée ; sur un Mouvement sans famille : création (identifiant neuf, deux
   * lignes écrites). Hors création, seule la ligne du Mouvement posé est écrite (clé
   * fractionnaire entre ses voisins ; renumérotation de la famille seulement si la précision est
   * épuisée). Une transaction ; identités, contenus et références inchangés.
   */
  placeInFamily(movementId: string, anchorId: string, side: "ABOVE" | "BELOW"): Promise<MovementFamilyOutcome>;
  /**
   * PRE-8, familles (règles B, D) : sortie explicite. Au plus deux membres (archivés compris) :
   * les deux appartenances sont effacées (`DISSOLVED`, aucun singleton fantôme) ; sinon seule
   * celle du Mouvement sorti (`LEFT`), sans réécrire les autres clés.
   */
  leaveFamily(movementId: string): Promise<MovementFamilyOutcome>;
  /** PRE-8, familles (règle E, Annuler) : rétablit, dans une transaction, les appartenances d'avant l'opération. */
  restoreFamilyMemberships(previous: MovementPriorMemberships): Promise<boolean>;
  /**
   * PRE-8 (B.1, CE-MVT-01, C03 « Mettre à jour ») : réécrit le contenu partagé d'un Mouvement
   * existant (nom, alias, description, médias, Catégorie, Zones, structure des phases) en
   * conservant son identité et son groupe de niveaux. `null` si le Mouvement est introuvable ;
   * un nom pris par un autre Mouvement lève `DuplicateMovementNameError`. Les paramètres locaux
   * des Exercices qui le référencent ne sont jamais touchés.
   */
  update(movement: Movement): Promise<Movement | null>;
  /**
   * PRE-8 (B.1, D-445 C02, DSF « Variante et niveau ») : crée la variante explicitement choisie
   * et l'insère avant (plus facile) ou après (plus difficile) son origine, dans UNE transaction ;
   * le groupe est créé au deuxième membre. Un refus (origine introuvable) n'écrit rien : ni
   * Mouvement, ni groupe provisoire.
   */
  createVariant(movement: Movement, originId: string, placement: "BEFORE_ORIGIN" | "AFTER_ORIGIN"): Promise<CreateVariantOutcome>;
  /**
   * PRE-8 (B.8, arbitrages de Hermann du 27/10/2026) : archive un Mouvement actif, dans UNE
   * transaction. Refusé, sans aucune écriture, tant qu'un Exercice persisté le référence
   * (`REFERENCED`) : Exercice d'une Séance active ou archivée, ou définition du Catalogue. Une
   * exécution historique seule ne bloque pas (instantané autonome). Aucune suppression d'Exercice,
   * de Séance ou de planification ; l'appartenance et la position dans la famille sont conservées,
   * aucun rang n'est recalculé (Q5).
   */
  archive(id: string): Promise<ArchiveMovementOutcome>;
  /** PRE-8 (B.8, Q7) : restaure un Mouvement archivé — identité, contenu, famille et position conservés. */
  restore(id: string): Promise<RestoreMovementOutcome>;
  /**
   * PRE-8 (B.8, Q8) : suppression définitive, depuis les Archives seulement (`NOT_ARCHIVED` pour un
   * Mouvement actif) ; refusée tant qu'un Exercice persisté le référence ; jamais en cascade. Les
   * autres membres de la famille gardent leur ordre (rangs dérivés de la famille restante, MFN-05).
   */
  deleteArchived(id: string): Promise<DeleteArchivedMovementOutcome>;
  /** PRE-8 (B.8) : identifiants des Mouvements archivés. */
  listArchivedIds(): Promise<ReadonlySet<string>>;
}

/** Issue d'un archivage (PRE-8, B.8). */
export type ArchiveMovementOutcome =
  | { readonly status: "ARCHIVED" }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "ALREADY_ARCHIVED" }
  /** Exercices persistés qui référencent le Mouvement, chacun une fois : rien n'est écrit. */
  | { readonly status: "REFERENCED"; readonly exerciseCount: number };

/** Issue d'une restauration (PRE-8, B.8). */
export type RestoreMovementOutcome =
  | { readonly status: "RESTORED" }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "NOT_ARCHIVED" };

/** Issue d'une suppression définitive depuis les Archives (PRE-8, B.8). */
export type DeleteArchivedMovementOutcome =
  | { readonly status: "DELETED" }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "NOT_ARCHIVED" }
  | { readonly status: "REFERENCED"; readonly exerciseCount: number };

/** Issue de la création d'une variante (PRE-8, B.1). */
export type CreateVariantOutcome =
  | { readonly status: "CREATED"; readonly movement: Movement; readonly members: readonly Movement[] }
  | { readonly status: "ORIGIN_NOT_FOUND" };

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
