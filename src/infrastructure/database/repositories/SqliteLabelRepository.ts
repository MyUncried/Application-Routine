import * as Crypto from "expo-crypto";

import { canonicalLabelKey, type CreateLabelInput, type Label, type LabelColor } from "@/domain/labels/Label";
import type { LabelMutationResult, LabelRepository } from "@/domain/labels/LabelRepository";
import type { Database } from "@/infrastructure/database/Database";
import type { LabelRow } from "@/infrastructure/database/types/DatabaseRows";

/**
 * Lecture et écriture du référentiel persistant des Étiquettes (V2-PRE-1,
 * `migration007` ; V2-PRE-2, `migration008`, plan §6.1/§13 §4.10). `listAll`
 * retourne actives et retirées confondues, dans leur ordre de création.
 *
 * `create` réactive une entrée RETIRÉE de même clé normalisée (D2) : même
 * identifiant, mêmes Séances associées, couleur choisie appliquée — jamais
 * une nouvelle ligne. Un nom dont la clé correspond à une entrée ACTIVE est
 * refusé (`DUPLICATE`).
 */
export class SqliteLabelRepository implements LabelRepository {
  constructor(
    private readonly database: Database,
    private readonly uuidFactory: () => string = Crypto.randomUUID,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async listAll(): Promise<readonly Label[]> {
    const rows = await this.database.getAllAsync<LabelRow>(
      `SELECT id, name, canonical_key, color, is_active, created_at
       FROM labels
       ORDER BY created_at ASC`,
    );
    return rows.map(mapLabelRow);
  }

  async create(input: CreateLabelInput): Promise<LabelMutationResult> {
    const canonicalKey = canonicalLabelKey(input.name);
    let result: LabelMutationResult | null = null;

    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const existing = await transaction.getFirstAsync<LabelRow>(
        `SELECT id, name, canonical_key, color, is_active, created_at FROM labels WHERE canonical_key = ?`,
        [canonicalKey],
      );
      if (existing && existing.is_active === 1) {
        result = { status: "DUPLICATE" };
        return;
      }
      if (existing) {
        // Réactivation D2 : même identifiant, associations conservées,
        // couleur choisie appliquée — jamais une nouvelle ligne.
        await transaction.runAsync(
          `UPDATE labels SET name = ?, color = ?, is_active = 1 WHERE id = ?`,
          [input.name, input.color, existing.id],
        );
        result = {
          status: "OK",
          value: { id: existing.id, name: input.name, canonicalKey, color: input.color, isActive: true, createdAt: existing.created_at },
        };
        return;
      }
      const id = this.uuidFactory();
      const createdAt = this.now();
      await transaction.runAsync(
        `INSERT INTO labels (id, name, canonical_key, color, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)`,
        [id, input.name, canonicalKey, input.color, createdAt],
      );
      result = {
        status: "OK",
        value: { id, name: input.name, canonicalKey, color: input.color, isActive: true, createdAt },
      };
    });

    return result!;
  }

  async rename(id: string, name: string): Promise<LabelMutationResult> {
    const canonicalKey = canonicalLabelKey(name);
    let result: LabelMutationResult | null = null;

    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const current = await transaction.getFirstAsync<LabelRow>(
        `SELECT id, name, canonical_key, color, is_active, created_at FROM labels WHERE id = ?`,
        [id],
      );
      if (!current) {
        result = { status: "NOT_FOUND" };
        return;
      }
      const conflict = await transaction.getFirstAsync<{ id: string }>(
        `SELECT id FROM labels WHERE canonical_key = ? AND is_active = 1 AND id <> ?`,
        [canonicalKey, id],
      );
      if (conflict) {
        result = { status: "DUPLICATE" };
        return;
      }
      await transaction.runAsync(`UPDATE labels SET name = ?, canonical_key = ? WHERE id = ?`, [
        name,
        canonicalKey,
        id,
      ]);
      result = {
        status: "OK",
        value: mapLabelRow({ ...current, name, canonical_key: canonicalKey }),
      };
    });

    return result!;
  }

  async recolor(id: string, color: LabelColor): Promise<LabelMutationResult> {
    const current = await this.database.getFirstAsync<LabelRow>(
      `SELECT id, name, canonical_key, color, is_active, created_at FROM labels WHERE id = ?`,
      [id],
    );
    if (!current) {
      return { status: "NOT_FOUND" };
    }
    await this.database.runAsync(`UPDATE labels SET color = ? WHERE id = ?`, [color, id]);
    return { status: "OK", value: mapLabelRow({ ...current, color }) };
  }

  async retire(id: string): Promise<LabelMutationResult> {
    const current = await this.database.getFirstAsync<LabelRow>(
      `SELECT id, name, canonical_key, color, is_active, created_at FROM labels WHERE id = ?`,
      [id],
    );
    if (!current) {
      return { status: "NOT_FOUND" };
    }
    await this.database.runAsync(`UPDATE labels SET is_active = 0 WHERE id = ?`, [id]);
    return { status: "OK", value: mapLabelRow({ ...current, is_active: 0 }) };
  }

  async isUsed(id: string): Promise<boolean> {
    const row = await this.database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM sessions WHERE label_id = ?`,
      [id],
    );
    return (row?.count ?? 0) > 0;
  }
}

export function mapLabelRow(row: LabelRow): Label {
  return {
    id: row.id,
    name: row.name,
    canonicalKey: row.canonical_key,
    color: row.color as LabelColor,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}
