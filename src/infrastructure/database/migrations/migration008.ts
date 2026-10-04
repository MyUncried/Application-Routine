import {
  DEFAULT_NOTIFICATIONS_ENABLED,
  DEFAULT_SESSION_FINAL_PHASE_SECONDS,
  DEFAULT_SESSION_INITIAL_COUNTDOWN_SECONDS,
  DEFAULT_SOUNDS_ENABLED,
  DEFAULT_VIBRATION_ENABLED,
  DEFAULT_VOICE_ANNOUNCEMENTS_ENABLED,
} from "@/domain/preferences/Profile";

/**
 * Migration V2-PRE-2 : Profil complété (deux défauts de Séance, quatre
 * préférences, identité portée par le singleton `profiles`, silhouette) ;
 * clé normalisée OBLIGATOIRE et UNIQUE pour les Étiquettes et les Zones
 * corporelles (toutes les entrées, actives et retirées — garantit la
 * réactivation D2 au niveau du stockage) ; `activity_body_zones`
 * reconstruite sans `CHECK` sur les 10 identifiants historiques, avec une
 * clé étrangère réelle vers `body_zones(id)` — une Zone créée devient
 * liable à une occurrence de Séance (plan §6.2).
 *
 * N'ALTÈRE JAMAIS `migration001.ts`…`migration007.ts` (« Conservation des
 * acquis ») : chaque instruction ci-dessous porte exclusivement sur les
 * tables déjà créées par ces migrations.
 *
 * **Deux phases, orchestrées par `migrateDatabase.ts`** : les clés
 * normalisées des Étiquettes/Zones déjà persistées (créées par
 * `migration007`, ou par une installation antérieure) ne peuvent pas être
 * calculées en SQL pur (normalisation Unicode NFD) — `MIGRATION_008_COLUMNS`
 * ajoute les colonnes nullable, le runner les remplit ligne par ligne en
 * JavaScript (`canonicalLabelKey`/`canonicalBodyZoneKey`), puis
 * `MIGRATION_008_FINALIZE` pose les contraintes UNIQUE/NOT NULL et
 * reconstruit `activity_body_zones` — dans la MÊME transaction partagée.
 *
 * `labels`/`body_zones` ne sont PAS reconstruites : `sessions.label_id`
 * (`ON DELETE SET NULL`) et `activity_definition_body_zones` (sans
 * contrainte sur `body_zone_id`, `migration006`) restent intacts.
 * `activity_body_zones` est enfant uniquement (aucune action de clé
 * étrangère déclenchée vers d'autres tables) : la cascade `ON DELETE
 * CASCADE` sur `activity_id` et la clé primaire composite (migration004)
 * sont conservées ; seule la contrainte `CHECK` sur les 10 identifiants est
 * remplacée par la clé étrangère vers `body_zones`.
 */
export const MIGRATION_008_COLUMNS = `
ALTER TABLE profiles ADD COLUMN session_initial_countdown_seconds_default INTEGER NOT NULL DEFAULT ${DEFAULT_SESSION_INITIAL_COUNTDOWN_SECONDS}
  CHECK (session_initial_countdown_seconds_default BETWEEN 0 AND 3599);
ALTER TABLE profiles ADD COLUMN session_final_phase_seconds_default INTEGER NOT NULL DEFAULT ${DEFAULT_SESSION_FINAL_PHASE_SECONDS}
  CHECK (session_final_phase_seconds_default BETWEEN 0 AND 3599);
ALTER TABLE profiles ADD COLUMN sounds_enabled INTEGER NOT NULL DEFAULT ${DEFAULT_SOUNDS_ENABLED ? 1 : 0} CHECK (sounds_enabled IN (0,1));
ALTER TABLE profiles ADD COLUMN voice_announcements_enabled INTEGER NOT NULL DEFAULT ${DEFAULT_VOICE_ANNOUNCEMENTS_ENABLED ? 1 : 0} CHECK (voice_announcements_enabled IN (0,1));
ALTER TABLE profiles ADD COLUMN vibration_enabled INTEGER NOT NULL DEFAULT ${DEFAULT_VIBRATION_ENABLED ? 1 : 0} CHECK (vibration_enabled IN (0,1));
ALTER TABLE profiles ADD COLUMN notifications_enabled INTEGER NOT NULL DEFAULT ${DEFAULT_NOTIFICATIONS_ENABLED ? 1 : 0} CHECK (notifications_enabled IN (0,1));
ALTER TABLE profiles ADD COLUMN display_name TEXT CHECK (display_name IS NULL OR length(display_name) BETWEEN 1 AND 80);
ALTER TABLE profiles ADD COLUMN photo_uri TEXT;
ALTER TABLE profiles ADD COLUMN silhouette TEXT CHECK (silhouette IS NULL OR silhouette IN ('homme','femme'));
ALTER TABLE labels ADD COLUMN canonical_key TEXT;
ALTER TABLE body_zones ADD COLUMN canonical_key TEXT;
`;

export const MIGRATION_008_FINALIZE = `
CREATE UNIQUE INDEX labels_canonical_key_unique ON labels(canonical_key);
CREATE UNIQUE INDEX body_zones_canonical_key_unique ON body_zones(canonical_key);

CREATE TRIGGER labels_canonical_key_required_insert BEFORE INSERT ON labels
WHEN NEW.canonical_key IS NULL
BEGIN
  SELECT RAISE(ABORT, 'labels.canonical_key NOT NULL');
END;

CREATE TRIGGER labels_canonical_key_required_update BEFORE UPDATE OF canonical_key ON labels
WHEN NEW.canonical_key IS NULL
BEGIN
  SELECT RAISE(ABORT, 'labels.canonical_key NOT NULL');
END;

CREATE TRIGGER body_zones_canonical_key_required_insert BEFORE INSERT ON body_zones
WHEN NEW.canonical_key IS NULL
BEGIN
  SELECT RAISE(ABORT, 'body_zones.canonical_key NOT NULL');
END;

CREATE TRIGGER body_zones_canonical_key_required_update BEFORE UPDATE OF canonical_key ON body_zones
WHEN NEW.canonical_key IS NULL
BEGIN
  SELECT RAISE(ABORT, 'body_zones.canonical_key NOT NULL');
END;

PRAGMA defer_foreign_keys = ON;
CREATE TABLE activity_body_zones_v8 (
  activity_id TEXT NOT NULL REFERENCES activities(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  body_zone_id TEXT NOT NULL REFERENCES body_zones(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  PRIMARY KEY (activity_id, body_zone_id)
);
INSERT INTO activity_body_zones_v8 (activity_id, body_zone_id)
  SELECT activity_id, body_zone_id FROM activity_body_zones;
DROP TABLE activity_body_zones;
ALTER TABLE activity_body_zones_v8 RENAME TO activity_body_zones;
`;
