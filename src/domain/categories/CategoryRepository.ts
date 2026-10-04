import type { Category, CategoryColor } from "./Category";

/**
 * Entrée de création/renommage explicite d'une Catégorie depuis le
 * référentiel (V2-PRE-2, plan §6.1, §4.10) — distincte de
 * `CreateCategoryInput` (`Category.ts`, PRÉSERVÉ : résolution d'une
 * Catégorie d'Exercice dans la transaction d'enregistrement, D-107) : cette
 * tranche ajoute des opérations EXPLICITES du référentiel (créer, renommer,
 * recolorer, retirer), jamais exposées par `Category.ts`.
 */
export type CreateCategoryReferentialInput = {
  readonly name: string;
  readonly color: CategoryColor;
};

/** Résultat discriminé d'une opération de référentiel (même patron pour Étiquette/Catégorie/Zone). */
export type CategoryMutationResult =
  | { readonly status: "OK"; readonly value: Category }
  | { readonly status: "DUPLICATE" }
  | { readonly status: "NOT_FOUND" };

/**
 * Contrat du Domaine Catégorie (T01-S09, complété V2-PRE-2). La création
 * d'une Catégorie personnalisée DANS LA TRANSACTION D'EXERCICE reste portée
 * par `SqliteActivityDefinitionRepository` (D-107) — les opérations
 * explicites ci-dessous (modale de sélection) sont distinctes et jamais
 * invoquées par cette transaction.
 */
export interface CategoryRepository {
  /**
   * Catégories persistées, ordonnées Catégories prédéfinies par
   * `displayOrder` croissant PUIS Catégories personnalisées par `createdAt`
   * croissant (D-107).
   */
  listAll(): Promise<readonly Category[]>;
  /**
   * Crée une Catégorie active, ou RÉACTIVE l'entrée retirée de même clé
   * normalisée (D2) : même identifiant, associations conservées, couleur
   * choisie appliquée. Refuse un doublon ACTIF (`DUPLICATE`). Applicable
   * aussi bien à une Catégorie prédéfinie qu'à une Catégorie créée (§4.10
   * L137 : aucune garde sur `isPredefined`).
   */
  create(input: CreateCategoryReferentialInput): Promise<CategoryMutationResult>;
  /** Renomme sans changer l'identifiant ni la couleur — refuse un doublon actif d'une autre Catégorie. */
  rename(id: string, name: string): Promise<CategoryMutationResult>;
  /** Change la couleur sans changer l'identifiant ni le nom. */
  recolor(id: string, color: CategoryColor): Promise<CategoryMutationResult>;
  /** Retire logiquement — les affectations existantes sont conservées, jamais de nouvelle affectation (T16). */
  retire(id: string): Promise<CategoryMutationResult>;
  /** `true` si au moins un Exercice du Catalogue utilise cette Catégorie — détermine le message de suppression (§4.10 L135). */
  isUsed(id: string): Promise<boolean>;
}
