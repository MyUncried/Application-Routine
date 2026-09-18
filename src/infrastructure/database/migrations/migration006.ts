/**
 * Migration additive V2-CAT-01 : persistance des `ActivityDefinition` du
 * Catalogue des activités et de leurs associations aux Zones corporelles.
 *
 * Additive et idempotente (appliquée une seule fois, sous la garde
 * `PRAGMA user_version`, comme toute autre migration — `migrateDatabase.ts`).
 * Ne convertit aucune `SessionActivity` historique et n'introduit aucune
 * donnée d'exécution, d'archivage, de suppression ou de média fonctionnel —
 * hors périmètre de cette tranche.
 *
 * `execution_mode`/`series_count`/`pause_seconds`/`recovery_seconds`/
 * `side_mode` reprennent exactement les mêmes contraintes que la colonne
 * homonyme de `activities` (`migration001`/`migration003`/`migration005`) :
 * une seule implémentation de contrat, jamais deux définitions divergentes.
 */
export const MIGRATION_006 = `
CREATE TABLE activity_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  execution_mode TEXT NOT NULL CHECK (execution_mode IN ('DURATION', 'REPETITIONS', 'TO_FAILURE')),
  duration_seconds INTEGER,
  repetition_count INTEGER,
  series_count INTEGER NOT NULL,
  pause_seconds INTEGER NOT NULL DEFAULT 0,
  recovery_seconds INTEGER NOT NULL DEFAULT 0,
  side_mode TEXT NOT NULL DEFAULT 'UNILATERAL'
    CHECK (side_mode IN ('UNILATERAL', 'RIGHT_LEFT', 'LEFT_RIGHT')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_activity_definitions_updated_at ON activity_definitions(updated_at DESC);

CREATE TABLE activity_definition_body_zones (
  activity_definition_id TEXT NOT NULL REFERENCES activity_definitions(id) ON DELETE CASCADE,
  body_zone_id TEXT NOT NULL,
  PRIMARY KEY (activity_definition_id, body_zone_id)
);
`;
