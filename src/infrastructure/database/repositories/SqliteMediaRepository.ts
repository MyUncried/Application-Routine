import type {
  ActivityMediaWithAsset,
  MediaLinkInput,
  SessionActivityMediaWithAsset,
} from "@/domain/media/ActivityMedia";
import { isValidNewMediaAsset, type MediaAsset } from "@/domain/media/MediaAsset";
import type { MediaRepository } from "@/domain/media/MediaRepository";
import type { Database } from "@/infrastructure/database/Database";
import type {
  ActivityMediaRow,
  JoinedMediaAssetColumns,
  MediaAssetRow,
  SessionActivityMediaRow,
} from "@/infrastructure/database/types/DatabaseRows";

type UuidFactory = () => string;

/** Colonnes de l'asset jointes à un lien (`asset_*`). */
const JOINED_ASSET_COLUMNS = `
  media_assets.uri AS asset_uri,
  media_assets.created_at AS asset_created_at,
  media_assets.kind AS asset_kind,
  media_assets.mime_type AS asset_mime_type,
  media_assets.file_name AS asset_file_name,
  media_assets.size_bytes AS asset_size_bytes,
  media_assets.duration_ms AS asset_duration_ms,
  media_assets.width AS asset_width,
  media_assets.height AS asset_height
`;

/** Erreur d'écriture de média : asset invalide ou absent — la transaction entière est annulée. */
export class MediaAssetWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaAssetWriteError";
  }
}

/**
 * Médias ordonnés (V2-PRE-1, `migration007` ; PRE-3, `migration009`).
 * Plusieurs médias DISTINCTS peuvent exister pour un même Exercice. Un
 * asset n'est JAMAIS supprimé par ce Repository : retirer un lien ne touche
 * pas au fichier (P3-23/file-preservation), la FK restrictive des liens
 * d'occurrence l'interdit d'ailleurs tant qu'il est référencé.
 */
export class SqliteMediaRepository implements MediaRepository {
  constructor(private readonly database: Database) {}

  async listForActivityDefinition(
    activityDefinitionId: string,
  ): Promise<readonly ActivityMediaWithAsset[]> {
    const byDefinition = await listDefinitionMediaByIds(this.database, [activityDefinitionId]);
    return byDefinition.get(activityDefinitionId) ?? [];
  }

  async listForSessionActivities(
    activityIds: readonly string[],
  ): Promise<ReadonlyMap<string, readonly SessionActivityMediaWithAsset[]>> {
    return listSessionActivityMediaByIds(this.database, activityIds);
  }

  async findAsset(assetId: string): Promise<MediaAsset | null> {
    const row = await this.database.getFirstAsync<MediaAssetRow>(
      `SELECT id, uri, created_at, kind, mime_type, file_name, size_bytes, duration_ms, width, height
       FROM media_assets WHERE id = ?`,
      [assetId],
    );
    return row ? mapMediaAssetRow(row) : null;
  }

  async countReferences(assetId: string): Promise<number> {
    const row = await this.database.getFirstAsync<{ count: number }>(
      `SELECT
         (SELECT COUNT(*) FROM activity_media WHERE asset_id = ?)
         + (SELECT COUNT(*) FROM session_activity_media WHERE asset_id = ?) AS count`,
      [assetId, assetId],
    );
    return row?.count ?? 0;
  }
}

export function mapMediaAssetRow(row: MediaAssetRow): MediaAsset {
  return {
    id: row.id,
    uri: row.uri,
    createdAt: row.created_at,
    kind: row.kind ?? null,
    mimeType: row.mime_type ?? null,
    fileName: row.file_name ?? null,
    sizeBytes: row.size_bytes ?? null,
    durationMs: row.duration_ms ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
  };
}

function mapJoinedAsset(assetId: string, row: JoinedMediaAssetColumns): MediaAsset {
  return mapMediaAssetRow({
    id: assetId,
    uri: row.asset_uri,
    created_at: row.asset_created_at,
    kind: row.asset_kind,
    mime_type: row.asset_mime_type,
    file_name: row.asset_file_name,
    size_bytes: row.asset_size_bytes,
    duration_ms: row.asset_duration_ms,
    width: row.asset_width,
    height: row.asset_height,
  });
}

export function mapActivityMediaRow(row: ActivityMediaRow): ActivityMediaWithAsset {
  return {
    id: row.id,
    activityDefinitionId: row.activity_definition_id,
    assetId: row.asset_id,
    position: row.position,
    asset: mapJoinedAsset(row.asset_id, row),
  };
}

function mapSessionActivityMediaRow(row: SessionActivityMediaRow): SessionActivityMediaWithAsset {
  return {
    id: row.id,
    activityId: row.activity_id,
    assetId: row.asset_id,
    position: row.position,
    asset: mapJoinedAsset(row.asset_id, row),
  };
}

function placeholders(values: readonly unknown[]): string {
  return values.map(() => "?").join(", ");
}

/** Liens ordonnés de plusieurs définitions en UNE requête (aucun N+1). */
export async function listDefinitionMediaByIds(
  database: Database,
  activityDefinitionIds: readonly string[],
): Promise<ReadonlyMap<string, readonly ActivityMediaWithAsset[]>> {
  const byId = new Map<string, ActivityMediaWithAsset[]>();
  if (activityDefinitionIds.length === 0) {
    return byId;
  }
  const rows = await database.getAllAsync<ActivityMediaRow>(
    `SELECT
       activity_media.id AS id,
       activity_media.activity_definition_id AS activity_definition_id,
       activity_media.asset_id AS asset_id,
       activity_media.position AS position,
       ${JOINED_ASSET_COLUMNS}
     FROM activity_media
     JOIN media_assets ON media_assets.id = activity_media.asset_id
     WHERE activity_media.activity_definition_id IN (${placeholders(activityDefinitionIds)})
     ORDER BY activity_media.activity_definition_id ASC, activity_media.position ASC`,
    activityDefinitionIds,
  );
  for (const row of rows) {
    const list = byId.get(row.activity_definition_id) ?? [];
    list.push(mapActivityMediaRow(row));
    byId.set(row.activity_definition_id, list);
  }
  return byId;
}

/** Liens ordonnés de plusieurs occurrences en UNE requête (aucun N+1). */
export async function listSessionActivityMediaByIds(
  database: Database,
  activityIds: readonly string[],
): Promise<ReadonlyMap<string, readonly SessionActivityMediaWithAsset[]>> {
  const byId = new Map<string, SessionActivityMediaWithAsset[]>();
  if (activityIds.length === 0) {
    return byId;
  }
  const rows = await database.getAllAsync<SessionActivityMediaRow>(
    `SELECT
       session_activity_media.id AS id,
       session_activity_media.activity_id AS activity_id,
       session_activity_media.asset_id AS asset_id,
       session_activity_media.position AS position,
       ${JOINED_ASSET_COLUMNS}
     FROM session_activity_media
     JOIN media_assets ON media_assets.id = session_activity_media.asset_id
     WHERE session_activity_media.activity_id IN (${placeholders(activityIds)})
     ORDER BY session_activity_media.activity_id ASC, session_activity_media.position ASC`,
    activityIds,
  );
  for (const row of rows) {
    const list = byId.get(row.activity_id) ?? [];
    list.push(mapSessionActivityMediaRow(row));
    byId.set(row.activity_id, list);
  }
  return byId;
}

/**
 * Crée dans la transaction courante les assets fraîchement préparés qui
 * n'existent pas encore. Un asset déjà persisté n'est JAMAIS réécrit (ses
 * métadonnées restent immuables) ; un asset invalide annule la transaction.
 */
export async function ensureMediaAssets(
  transaction: Database,
  items: readonly MediaLinkInput[],
): Promise<void> {
  for (const item of items) {
    if (!item.asset) {
      continue;
    }
    if (item.asset.id !== item.assetId || !isValidNewMediaAsset(item.asset)) {
      throw new MediaAssetWriteError("Invalid media asset.");
    }
    const existing = await transaction.getFirstAsync<{ id: string }>(
      "SELECT id FROM media_assets WHERE id = ?",
      [item.assetId],
    );
    if (existing) {
      continue;
    }
    const asset = item.asset;
    await transaction.runAsync(
      `INSERT INTO media_assets (id, uri, created_at, kind, mime_type, file_name, size_bytes, duration_ms, width, height)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        asset.id,
        asset.uri,
        asset.createdAt,
        asset.kind ?? null,
        asset.mimeType ?? null,
        asset.fileName ?? null,
        asset.sizeBytes ?? null,
        asset.durationMs ?? null,
        asset.width ?? null,
        asset.height ?? null,
      ],
    );
  }
}

/**
 * Remplace les liens d'une définition par la liste ordonnée fournie
 * (position = rang du tableau). Les assets restent intacts.
 */
export async function replaceDefinitionMediaLinks(
  transaction: Database,
  activityDefinitionId: string,
  items: readonly MediaLinkInput[],
  uuidFactory: UuidFactory,
): Promise<void> {
  await ensureMediaAssets(transaction, items);
  await transaction.runAsync(`DELETE FROM activity_media WHERE activity_definition_id = ?`, [
    activityDefinitionId,
  ]);
  for (const [position, item] of items.entries()) {
    await transaction.runAsync(
      `INSERT INTO activity_media (id, activity_definition_id, asset_id, position) VALUES (?, ?, ?, ?)`,
      [uuidFactory(), activityDefinitionId, item.assetId, position],
    );
  }
}

/**
 * Remplace les liens d'une occurrence (PRE-3) — identités propres, mêmes
 * fichiers physiques que la source. Les assets restent intacts.
 */
export async function replaceSessionActivityMediaLinks(
  transaction: Database,
  activityId: string,
  items: readonly MediaLinkInput[],
  uuidFactory: UuidFactory,
): Promise<void> {
  await ensureMediaAssets(transaction, items);
  await transaction.runAsync(`DELETE FROM session_activity_media WHERE activity_id = ?`, [activityId]);
  for (const [position, item] of items.entries()) {
    await transaction.runAsync(
      `INSERT INTO session_activity_media (id, activity_id, asset_id, position) VALUES (?, ?, ?, ?)`,
      [uuidFactory(), activityId, item.assetId, position],
    );
  }
}
