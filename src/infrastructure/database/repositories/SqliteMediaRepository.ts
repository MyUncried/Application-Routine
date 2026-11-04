import type { MediaLinkInput } from "@/domain/media/ActivityMedia";
import { isValidNewMediaAsset, type MediaAsset } from "@/domain/media/MediaAsset";
import type { MediaRepository } from "@/domain/media/MediaRepository";
import type { Database } from "@/infrastructure/database/Database";
import type { JoinedMediaAssetColumns, MediaAssetRow } from "@/infrastructure/database/types/DatabaseRows";

/** Colonnes de l'asset jointes à un lien (`asset_*`). */
export const JOINED_ASSET_COLUMNS = `
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
 * PRE-7 (A1.2, `migration012`) : les médias d'un Exercice sont ceux de son
 * Mouvement (`movement_media`, contenu partagé). PRE-7 (R-3,
 * `migration013`, D-445 C05) : les occurrences de Séance n'ont plus de liens
 * propres (`session_activity_media` supprimée) ; elles lisent ceux du Mouvement.
 * Plusieurs médias DISTINCTS peuvent exister pour un même Exercice. Un
 * asset n'est JAMAIS supprimé par ce Repository : retirer un lien ne touche
 * pas au fichier (P3-23/file-preservation), la FK restrictive des liens
 * d'occurrence l'interdit d'ailleurs tant qu'il est référencé.
 */
export class SqliteMediaRepository implements MediaRepository {
  constructor(private readonly database: Database) {}

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
         (SELECT COUNT(*) FROM movement_media WHERE asset_id = ?) AS count`,
      [assetId],
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

export function mapJoinedAsset(assetId: string, row: JoinedMediaAssetColumns): MediaAsset {
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
