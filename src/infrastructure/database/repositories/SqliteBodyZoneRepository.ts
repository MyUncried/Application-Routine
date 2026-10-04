import * as Crypto from "expo-crypto";

import { canonicalBodyZoneKey, type BodyZone, type CreateBodyZoneInput } from "@/domain/body-zones/BodyZone";
import type { BodyZoneMutationResult, BodyZoneRepository } from "@/domain/body-zones/BodyZoneRepository";
import type { Database } from "@/infrastructure/database/Database";
import type { BodyZoneRow } from "@/infrastructure/database/types/DatabaseRows";

/**
 * Lecture et écriture du référentiel persistant des Zones corporelles
 * (V2-PRE-1, `migration007` ; V2-PRE-2, `migration008`, plan §6.1).
 * `listAll` retourne actives et retirées confondues, dans leur ordre de
 * création.
 *
 * `create` réactive une entrée RETIRÉE de même clé normalisée (D2) : même
 * identifiant, mêmes affectations conservées — jamais une nouvelle ligne,
 * jamais de couleur. Un nom dont la clé correspond à une entrée ACTIVE est
 * refusé (`DUPLICATE`).
 */
export class SqliteBodyZoneRepository implements BodyZoneRepository {
  constructor(
    private readonly database: Database,
    private readonly uuidFactory: () => string = Crypto.randomUUID,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async listAll(): Promise<readonly BodyZone[]> {
    const rows = await this.database.getAllAsync<BodyZoneRow>(
      `SELECT id, name, canonical_key, is_active, created_at
       FROM body_zones
       ORDER BY created_at ASC`,
    );
    return rows.map(mapBodyZoneRow);
  }

  async create(input: CreateBodyZoneInput): Promise<BodyZoneMutationResult> {
    const canonicalKey = canonicalBodyZoneKey(input.name);
    let result: BodyZoneMutationResult | null = null;

    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const existing = await transaction.getFirstAsync<BodyZoneRow>(
        `SELECT id, name, canonical_key, is_active, created_at FROM body_zones WHERE canonical_key = ?`,
        [canonicalKey],
      );
      if (existing && existing.is_active === 1) {
        result = { status: "DUPLICATE" };
        return;
      }
      if (existing) {
        await transaction.runAsync(`UPDATE body_zones SET name = ?, is_active = 1 WHERE id = ?`, [
          input.name,
          existing.id,
        ]);
        result = {
          status: "OK",
          value: { id: existing.id, name: input.name, canonicalKey, isActive: true, createdAt: existing.created_at },
        };
        return;
      }
      const id = this.uuidFactory();
      const createdAt = this.now();
      await transaction.runAsync(
        `INSERT INTO body_zones (id, name, canonical_key, is_active, created_at) VALUES (?, ?, ?, 1, ?)`,
        [id, input.name, canonicalKey, createdAt],
      );
      result = { status: "OK", value: { id, name: input.name, canonicalKey, isActive: true, createdAt } };
    });

    return result!;
  }

  async rename(id: string, name: string): Promise<BodyZoneMutationResult> {
    const canonicalKey = canonicalBodyZoneKey(name);
    let result: BodyZoneMutationResult | null = null;

    await this.database.withExclusiveTransactionAsync(async (transaction) => {
      const current = await transaction.getFirstAsync<BodyZoneRow>(
        `SELECT id, name, canonical_key, is_active, created_at FROM body_zones WHERE id = ?`,
        [id],
      );
      if (!current) {
        result = { status: "NOT_FOUND" };
        return;
      }
      const conflict = await transaction.getFirstAsync<{ id: string }>(
        `SELECT id FROM body_zones WHERE canonical_key = ? AND is_active = 1 AND id <> ?`,
        [canonicalKey, id],
      );
      if (conflict) {
        result = { status: "DUPLICATE" };
        return;
      }
      await transaction.runAsync(`UPDATE body_zones SET name = ?, canonical_key = ? WHERE id = ?`, [
        name,
        canonicalKey,
        id,
      ]);
      result = { status: "OK", value: mapBodyZoneRow({ ...current, name, canonical_key: canonicalKey }) };
    });

    return result!;
  }

  async retire(id: string): Promise<BodyZoneMutationResult> {
    const current = await this.database.getFirstAsync<BodyZoneRow>(
      `SELECT id, name, canonical_key, is_active, created_at FROM body_zones WHERE id = ?`,
      [id],
    );
    if (!current) {
      return { status: "NOT_FOUND" };
    }
    await this.database.runAsync(`UPDATE body_zones SET is_active = 0 WHERE id = ?`, [id]);
    return { status: "OK", value: mapBodyZoneRow({ ...current, is_active: 0 }) };
  }

  /** Utilisée par une Activité du Catalogue (`activity_definition_body_zones`) OU une occurrence de Séance (`activity_body_zones`). */
  async isUsed(id: string): Promise<boolean> {
    const row = await this.database.getFirstAsync<{ count: number }>(
      `SELECT
        (SELECT COUNT(*) FROM activity_definition_body_zones WHERE body_zone_id = ?) +
        (SELECT COUNT(*) FROM activity_body_zones WHERE body_zone_id = ?) AS count`,
      [id, id],
    );
    return (row?.count ?? 0) > 0;
  }
}

export function mapBodyZoneRow(row: BodyZoneRow): BodyZone {
  return {
    id: row.id,
    name: row.name,
    canonicalKey: row.canonical_key,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}
