import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { BodyZoneRepository } from "@/domain/body-zones/BodyZoneRepository";
import type { Database } from "@/infrastructure/database/Database";
import type { BodyZoneRow } from "@/infrastructure/database/types/DatabaseRows";

/**
 * Lecture du référentiel persistant des Zones corporelles (V2-PRE-1,
 * `migration007`). Retourne actives et retirées confondues, dans leur ordre
 * de création — l'appelant filtre `isActive` selon son besoin (nouvelle
 * affectation vs. affichage d'une référence existante).
 */
export class SqliteBodyZoneRepository implements BodyZoneRepository {
  constructor(private readonly database: Database) {}

  async listAll(): Promise<readonly BodyZone[]> {
    const rows = await this.database.getAllAsync<BodyZoneRow>(
      `SELECT id, name, is_active, created_at
       FROM body_zones
       ORDER BY created_at ASC`,
    );
    return rows.map(mapBodyZoneRow);
  }
}

export function mapBodyZoneRow(row: BodyZoneRow): BodyZone {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}
