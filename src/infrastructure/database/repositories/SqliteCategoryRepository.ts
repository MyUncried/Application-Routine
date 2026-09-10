import type { Category } from "@/domain/categories/Category";
import type { CategoryRepository } from "@/domain/categories/CategoryRepository";
import type { Database } from "@/infrastructure/database/Database";
import type { SessionCategoryRow } from "@/infrastructure/database/types/DatabaseRows";

/**
 * Lecture seule (T01-S09, D-107) : Catégories prédéfinies d'abord par
 * `display_order` croissant, puis Catégories personnalisées par
 * `created_at` croissant — jamais un tri laissé à l'appelant. La création
 * d'une Catégorie personnalisée n'est volontairement pas exposée ici : voir
 * `CategoryRepository.ts` et `SqliteSessionRepository.create()`.
 */
export class SqliteCategoryRepository implements CategoryRepository {
  constructor(private readonly database: Database) {}

  async listAll(): Promise<readonly Category[]> {
    const rows = await this.database.getAllAsync<SessionCategoryRow>(
      `SELECT id, name, canonical_key, is_predefined, display_order, created_at
       FROM categories
       ORDER BY is_predefined DESC, display_order ASC, created_at ASC`,
    );
    return rows.map(mapCategoryRow);
  }
}

export function mapCategoryRow(row: SessionCategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    canonicalKey: row.canonical_key,
    isPredefined: row.is_predefined === 1,
    displayOrder: row.display_order,
    createdAt: row.created_at,
  };
}
