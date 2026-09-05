import type { Category } from "./Category";

/**
 * Contrat de lecture du Domaine Catégorie (T01-S09). La création d'une
 * Catégorie personnalisée n'est volontairement PAS exposée ici : D-107
 * impose qu'elle ne devienne persistante que dans la transaction atomique
 * d'enregistrement de la Séance (`CreateSessionCategoryInput`, kind
 * `"NEW"`), jamais isolément — voir `SqliteSessionRepository.create()`.
 */
export interface CategoryRepository {
  /**
   * Catégories persistées, ordonnées Catégories prédéfinies par
   * `displayOrder` croissant PUIS Catégories personnalisées par `createdAt`
   * croissant (D-107) — jamais un tri différent laissé à l'appelant.
   */
  listAll(): Promise<readonly Category[]>;
}
