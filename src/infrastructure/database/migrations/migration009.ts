/**
 * PRE-3 (version 9, `migration009`) — migration ADDITIVE des paramètres
 * d'exécution canoniques, de la Catégorie des copies et des médias
 * ordonnés des occurrences (`schema-et-ecritures.md` §« Migration additive
 * 009 proposée », plan approuvé `43e7b344`).
 *
 * - `activity_definitions.execution_parameters` / `activities.execution_parameters` :
 *   JSON versionné NULLABLE. `NULL` = ancien objet, adapté de façon
 *   conservatrice à la lecture (aucun backfill, aucune lecture du Profil).
 * - `activities.category_id` : Catégorie transportée par une copie ;
 *   `NULL` pour les anciennes copies, jamais rattachées automatiquement.
 * - `media_assets` : métadonnées natives NULLABLES ; aucun fichier déplacé,
 *   supprimé ou recopié par la migration.
 * - `session_activity_media` : liens ordonnés propres à chaque occurrence,
 *   FK réelles, position unique par occurrence. Supprimer une occurrence
 *   supprime ses LIENS (cascade), jamais l'asset (FK restrictive).
 *
 * Aucune table existante n'est reconstruite : leurs `CHECK`, identifiants,
 * dates, positions et associations restent intacts. Les migrations 001..008
 * ne sont pas modifiées.
 */
export const MIGRATION_009 = `
ALTER TABLE activity_definitions ADD COLUMN execution_parameters TEXT;

ALTER TABLE activities ADD COLUMN execution_parameters TEXT;
ALTER TABLE activities ADD COLUMN category_id TEXT
  REFERENCES categories(id) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE media_assets ADD COLUMN kind TEXT
  CHECK (kind IS NULL OR kind IN ('PHOTO', 'VIDEO'));
ALTER TABLE media_assets ADD COLUMN mime_type TEXT;
ALTER TABLE media_assets ADD COLUMN file_name TEXT;
ALTER TABLE media_assets ADD COLUMN size_bytes INTEGER
  CHECK (size_bytes IS NULL OR size_bytes >= 0);
ALTER TABLE media_assets ADD COLUMN duration_ms INTEGER
  CHECK (duration_ms IS NULL OR duration_ms >= 0);
ALTER TABLE media_assets ADD COLUMN width INTEGER
  CHECK (width IS NULL OR width >= 0);
ALTER TABLE media_assets ADD COLUMN height INTEGER
  CHECK (height IS NULL OR height >= 0);

CREATE TABLE session_activity_media (
  id TEXT PRIMARY KEY NOT NULL,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES media_assets(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  position INTEGER NOT NULL CHECK (position >= 0),
  UNIQUE (activity_id, position)
);

CREATE INDEX session_activity_media_activity_idx
ON session_activity_media(activity_id, position);

CREATE INDEX session_activity_media_asset_idx
ON session_activity_media(asset_id);

CREATE INDEX activity_media_asset_idx
ON activity_media(asset_id);
`;
