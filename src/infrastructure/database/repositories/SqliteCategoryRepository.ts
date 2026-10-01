import type { Category, CategoryColor } from "@/domain/categories/Category";
import type { CategoryRepository } from "@/domain/categories/CategoryRepository";
import type { Database } from "@/infrastructure/database/Database";
import type { CategoryRow } from "@/infrastructure/database/types/DatabaseRows";

/**
 * Lecture seule (T01-S09, D-107 ; V2-PRE-1 : `color`/`is_active` ajoutées,
 * plan §3.1) : Catégories prédéfinies d'abord par `display_order` croissant,
 * puis Catégories personnalisées par `created_at` croissant — jamais un tri
 * laissé à l'appelant. La création d'une Catégorie personnalisée n'est
 * volontairement pas exposée ici : voir `CategoryRepository.ts` et
 * `SqliteActivityDefinitionRepository.create()`.
 */
export class SqliteCategoryRepository implements CategoryRepository {
  constructor(private readonly database: Database) {}

  async listAll(): Promise<readonly Category[]> {
    const rows = await this.database.getAllAsync<CategoryRow>(
      `SELECT id, name, canonical_key, color, is_predefined, display_order, is_active, created_at
       FROM categories
       ORDER BY is_predefined DESC, display_order ASC, created_at ASC`,
    );
    return rows.map(mapCategoryRow);
  }
}

export function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    canonicalKey: row.canonical_key,
    color: row.color as CategoryColor,
    isPredefined: row.is_predefined === 1,
    displayOrder: row.display_order,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}
