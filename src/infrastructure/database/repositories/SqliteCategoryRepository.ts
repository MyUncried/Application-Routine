import * as Crypto from "expo-crypto";

import { canonicalCategoryKey } from "@/domain/categories/validation";
import type { Category, CategoryColor } from "@/domain/categories/Category";
import type {
  CategoryMutationResult,
  CategoryRepository,
  CreateCategoryReferentialInput,
} from "@/domain/categories/CategoryRepository";
import type { Database } from "@/infrastructure/database/Database";
import type { CategoryRow } from "@/infrastructure/database/types/DatabaseRows";

const SELECT_COLUMNS = "id, name, canonical_key, color, is_predefined, display_order, is_active, created_at";

/**
 * Lecture et écriture du Domaine Catégorie (T01-S09, D-107 ; V2-PRE-2,
 * plan §6.1/§4.10 : opérations explicites du référentiel — créer,
 * renommer, recolorer, retirer, avec réactivation D2). Catégories
 * prédéfinies d'abord par `display_order` croissant, puis personnalisées
 * par `created_at` croissant.
 *
 * `create` réactive une entrée RETIRÉE de même clé normalisée : même
 * identifiant, mêmes associations, couleur choisie appliquée — y compris
 * pour une Catégorie prédéfinie retirée puis recréée (son `is_predefined`/
 * `display_order` restent inchangés, §4.10 L137 : aucune garde sur
 * `isPredefined`). Un nom dont la clé correspond à une entrée ACTIVE est
 * refusé (`DUPLICATE`).
 */
export class SqliteCategoryRepository implements CategoryRepository {
  constructor(
    private readonly database: Database,
    private readonly uuidFactory: () => string = Crypto.randomUUID,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async listAll(): Promise<readonly Category[]> {
    const rows = await this.database.getAllAsync<CategoryRow>(
      `SELECT ${SELECT_COLUMNS}
       FROM categories
       ORDER BY is_predefined DESC, display_order ASC, created_at ASC`,
    );
    return rows.map(mapCategoryRow);
  }

  async create(input: CreateCategoryReferentialInput): Promise<CategoryMutationResult> {
    const canonicalKey = canonicalCategoryKey(input.name);
    let result: CategoryMutationResult | null = null;

    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const existing = await transaction.getFirstAsync<CategoryRow>(
        `SELECT ${SELECT_COLUMNS} FROM categories WHERE canonical_key = ?`,
        [canonicalKey],
      );
      if (existing && existing.is_active === 1) {
        result = { status: "DUPLICATE" };
        return;
      }
      if (existing) {
        await transaction.runAsync(`UPDATE categories SET name = ?, color = ?, is_active = 1 WHERE id = ?`, [
          input.name,
          input.color,
          existing.id,
        ]);
        result = {
          status: "OK",
          value: mapCategoryRow({ ...existing, name: input.name, color: input.color, is_active: 1 }),
        };
        return;
      }
      const id = this.uuidFactory();
      const createdAt = this.now();
      await transaction.runAsync(
        `INSERT INTO categories (id, name, canonical_key, color, is_predefined, display_order, is_active, created_at)
         VALUES (?, ?, ?, ?, 0, NULL, 1, ?)`,
        [id, input.name, canonicalKey, input.color, createdAt],
      );
      result = {
        status: "OK",
        value: mapCategoryRow({
          id,
          name: input.name,
          canonical_key: canonicalKey,
          color: input.color,
          is_predefined: 0,
          display_order: null,
          is_active: 1,
          created_at: createdAt,
        }),
      };
    });

    return result!;
  }

  async rename(id: string, name: string): Promise<CategoryMutationResult> {
    const canonicalKey = canonicalCategoryKey(name);
    let result: CategoryMutationResult | null = null;

    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const current = await transaction.getFirstAsync<CategoryRow>(
        `SELECT ${SELECT_COLUMNS} FROM categories WHERE id = ?`,
        [id],
      );
      if (!current) {
        result = { status: "NOT_FOUND" };
        return;
      }
      const conflict = await transaction.getFirstAsync<{ id: string }>(
        `SELECT id FROM categories WHERE canonical_key = ? AND is_active = 1 AND id <> ?`,
        [canonicalKey, id],
      );
      if (conflict) {
        result = { status: "DUPLICATE" };
        return;
      }
      await transaction.runAsync(`UPDATE categories SET name = ?, canonical_key = ? WHERE id = ?`, [
        name,
        canonicalKey,
        id,
      ]);
      result = { status: "OK", value: mapCategoryRow({ ...current, name, canonical_key: canonicalKey }) };
    });

    return result!;
  }

  async recolor(id: string, color: CategoryColor): Promise<CategoryMutationResult> {
    const current = await this.database.getFirstAsync<CategoryRow>(
      `SELECT ${SELECT_COLUMNS} FROM categories WHERE id = ?`,
      [id],
    );
    if (!current) {
      return { status: "NOT_FOUND" };
    }
    await this.database.runAsync(`UPDATE categories SET color = ? WHERE id = ?`, [color, id]);
    return { status: "OK", value: mapCategoryRow({ ...current, color }) };
  }

  async retire(id: string): Promise<CategoryMutationResult> {
    const current = await this.database.getFirstAsync<CategoryRow>(
      `SELECT ${SELECT_COLUMNS} FROM categories WHERE id = ?`,
      [id],
    );
    if (!current) {
      return { status: "NOT_FOUND" };
    }
    await this.database.runAsync(`UPDATE categories SET is_active = 0 WHERE id = ?`, [id]);
    return { status: "OK", value: mapCategoryRow({ ...current, is_active: 0 }) };
  }

  async isUsed(id: string): Promise<boolean> {
    const row = await this.database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM activity_definitions WHERE category_id = ?`,
      [id],
    );
    return (row?.count ?? 0) > 0;
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
