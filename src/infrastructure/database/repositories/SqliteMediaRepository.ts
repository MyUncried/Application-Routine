import type { ActivityMediaWithAsset } from "@/domain/media/ActivityMedia";
import type { MediaRepository } from "@/domain/media/MediaRepository";
import type { Database } from "@/infrastructure/database/Database";
import type { ActivityMediaRow } from "@/infrastructure/database/types/DatabaseRows";

/**
 * Lecture des médias ordonnés d'un Exercice (V2-PRE-1, plan §3.3/§13,
 * `migration007`). Plusieurs médias DISTINCTS peuvent exister pour un même
 * Exercice — jamais un seul média maximum (compatibilité future des
 * variantes, plan §13).
 */
export class SqliteMediaRepository implements MediaRepository {
  constructor(private readonly database: Database) {}

  async listForActivityDefinition(
    activityDefinitionId: string,
  ): Promise<readonly ActivityMediaWithAsset[]> {
    const rows = await this.database.getAllAsync<ActivityMediaRow>(
      `SELECT
         activity_media.id AS id,
         activity_media.activity_definition_id AS activity_definition_id,
         activity_media.asset_id AS asset_id,
         activity_media.position AS position,
         media_assets.uri AS asset_uri,
         media_assets.created_at AS asset_created_at
       FROM activity_media
       JOIN media_assets ON media_assets.id = activity_media.asset_id
       WHERE activity_media.activity_definition_id = ?
       ORDER BY activity_media.position ASC`,
      [activityDefinitionId],
    );
    return rows.map(mapActivityMediaRow);
  }
}

export function mapActivityMediaRow(row: ActivityMediaRow): ActivityMediaWithAsset {
  return {
    id: row.id,
    activityDefinitionId: row.activity_definition_id,
    assetId: row.asset_id,
    position: row.position,
    asset: {
      id: row.asset_id,
      uri: row.asset_uri,
      createdAt: row.asset_created_at,
    },
  };
}
