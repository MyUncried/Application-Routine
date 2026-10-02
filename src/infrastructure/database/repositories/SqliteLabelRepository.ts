import * as Crypto from "expo-crypto";

import type { CreateLabelInput, Label, LabelColor } from "@/domain/labels/Label";
import type { LabelRepository } from "@/domain/labels/LabelRepository";
import type { Database } from "@/infrastructure/database/Database";
import type { LabelRow } from "@/infrastructure/database/types/DatabaseRows";

/**
 * Lecture et création du référentiel persistant des Étiquettes (V2-PRE-1,
 * `migration007`, plan §13 §4.10). `listAll` retourne actives et retirées
 * confondues, dans leur ordre de création.
 */
export class SqliteLabelRepository implements LabelRepository {
  constructor(
    private readonly database: Database,
    private readonly uuidFactory: () => string = Crypto.randomUUID,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async listAll(): Promise<readonly Label[]> {
    const rows = await this.database.getAllAsync<LabelRow>(
      `SELECT id, name, color, is_active, created_at
       FROM labels
       ORDER BY created_at ASC`,
    );
    return rows.map(mapLabelRow);
  }

  async create(input: CreateLabelInput): Promise<Label> {
    const id = this.uuidFactory();
    const createdAt = this.now();
    await this.database.runAsync(
      `INSERT INTO labels (id, name, color, is_active, created_at) VALUES (?, ?, ?, 1, ?)`,
      [id, input.name, input.color, createdAt],
    );
    return { id, name: input.name, color: input.color, isActive: true, createdAt };
  }
}

export function mapLabelRow(row: LabelRow): Label {
  return {
    id: row.id,
    name: row.name,
    color: row.color as LabelColor,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}
