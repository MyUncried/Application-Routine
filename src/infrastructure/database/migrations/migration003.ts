import { BODY_ZONES } from "@/features/reference-data/bodyZones";

/**
 * Migration additive T01-S10 : mode d'Exercice « À l'échec » (`TO_FAILURE`,
 * D-111). N'altère JAMAIS `migration001.ts` (« Conservation des acquis »,
 * `.github/AI_ORCHESTRATION.md`) — le fichier reste indépendant et exécuté
 * une seule fois par `migrateDatabase.ts` (garde `PRAGMA user_version`).
 *
 * **Aucune table d'Exécution, d'Instantané ou de Résultat n'est ajoutée**
 * (hors périmètre, correction `5561977597`). Le schéma `migration001`
 * supportait déjà `type IN ('EXERCISE','RECOVERY')`, les trois positions
 * structurelles et `tours.repeat_count BETWEEN 1 AND 99` — seul le `CHECK`
 * de `activities.execution_mode` restait limité à `DURATION`/`REPETITIONS`.
 *
 * SQLite ne permet ni `ALTER TABLE ... DROP CONSTRAINT` ni la modification
 * d'un `CHECK`. La table `activities` est donc reconstruite (procédure
 * standard « 12 étapes »), en préservant **exactement** : identifiants,
 * timestamps, types, positions, relations, contraintes existantes, l'index
 * `activities_session_position_idx`, l'unicité
 * `UNIQUE(session_id, structural_position, position)`, les deux clés
 * étrangères composites vers `cycles`/`tours`, et l'intégralité de la table
 * dépendante `activity_body_zones` (copiée avant toute suppression de table
 * parente, restaurée à l'identique après).
 *
 * `PRAGMA foreign_keys` est un no-op dans une transaction (SQLite) : la
 * migration s'exécute dans la transaction partagée du runner et utilise
 * `PRAGMA defer_foreign_keys=ON` (stratégie validée Q2-A), qui reporte la
 * vérification des contraintes au `COMMIT` — à ce moment tous les
 * identifiants d'Activité sont préservés, donc aucune violation. La table
 * `activity_body_zones` est néanmoins sauvegardée puis restaurée
 * explicitement : `DROP TABLE activities` déclenche un `DELETE` implicite qui
 * exécuterait le `ON DELETE CASCADE` même en mode différé.
 *
 * Le nouveau `CHECK` de `TO_FAILURE` garantit `duration_seconds IS NULL`,
 * `repetition_count IS NULL`, `series_count >= 1` et `pause_seconds` dans les
 * bornes existantes. Les modes `DURATION`/`REPETITIONS` et le type
 * `RECOVERY` conservent EXACTEMENT leurs contraintes actuelles. Aucune ligne
 * historique n'est convertie en `TO_FAILURE`.
 */
const BODY_ZONE_IDS_SQL_LIST = BODY_ZONES.map((zone) => `'${zone.id}'`).join(", ");

export const MIGRATION_003 = `
PRAGMA defer_foreign_keys = ON;

CREATE TABLE activities_new (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  tour_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('EXERCISE', 'RECOVERY')),
  structural_position TEXT NOT NULL CHECK (
    structural_position IN ('BEFORE_TOUR', 'IN_TOUR', 'AFTER_TOUR')
  ),
  position INTEGER NOT NULL CHECK (position >= 0),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  execution_mode TEXT NOT NULL CHECK (execution_mode IN ('DURATION', 'REPETITIONS', 'TO_FAILURE')),
  duration_seconds INTEGER,
  repetition_count INTEGER,
  series_count INTEGER,
  pause_seconds INTEGER NOT NULL DEFAULT 0,
  instruction TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (session_id, structural_position, position),
  FOREIGN KEY (cycle_id, session_id)
    REFERENCES cycles(id, session_id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE,
  FOREIGN KEY (tour_id, cycle_id, session_id)
    REFERENCES tours(id, cycle_id, session_id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE,
  CHECK (
    (
      (structural_position = 'IN_TOUR')
      AND (tour_id IS NOT NULL)
    )
    OR
    (
      (structural_position IN ('BEFORE_TOUR', 'AFTER_TOUR'))
      AND (tour_id IS NULL)
    )
  ),
  CHECK (
    (
      (type = 'EXERCISE')
      AND (series_count IS NOT NULL)
      AND (series_count >= 1)
      AND (pause_seconds BETWEEN 0 AND 5999)
      AND (
        (
          (execution_mode = 'DURATION')
          AND (duration_seconds IS NOT NULL)
          AND (duration_seconds BETWEEN 1 AND 5999)
          AND (repetition_count IS NULL)
        )
        OR
        (
          (execution_mode = 'REPETITIONS')
          AND (duration_seconds IS NULL)
          AND (repetition_count IS NOT NULL)
          AND (repetition_count >= 1)
        )
        OR
        (
          (execution_mode = 'TO_FAILURE')
          AND (duration_seconds IS NULL)
          AND (repetition_count IS NULL)
        )
      )
    )
    OR
    (
      (type = 'RECOVERY')
      AND (execution_mode = 'DURATION')
      AND (duration_seconds IS NOT NULL)
      AND (duration_seconds BETWEEN 1 AND 5999)
      AND (repetition_count IS NULL)
      AND (series_count IS NULL)
      AND (pause_seconds = 0)
    )
  ),
  CHECK ((instruction IS NULL) OR (length(instruction) <= 1000))
);

INSERT INTO activities_new (
  id, session_id, cycle_id, tour_id, type, structural_position,
  position, name, execution_mode, duration_seconds, repetition_count,
  series_count, pause_seconds, instruction, created_at, updated_at
)
SELECT
  id, session_id, cycle_id, tour_id, type, structural_position,
  position, name, execution_mode, duration_seconds, repetition_count,
  series_count, pause_seconds, instruction, created_at, updated_at
FROM activities;

CREATE TABLE activity_body_zones_backup (
  activity_id TEXT NOT NULL,
  body_zone_id TEXT NOT NULL
);

INSERT INTO activity_body_zones_backup (activity_id, body_zone_id)
SELECT activity_id, body_zone_id FROM activity_body_zones;

DROP TABLE activity_body_zones;
DROP TABLE activities;

ALTER TABLE activities_new RENAME TO activities;

CREATE INDEX activities_session_position_idx
ON activities(session_id, structural_position, position);

CREATE TABLE activity_body_zones (
  activity_id TEXT NOT NULL REFERENCES activities(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  body_zone_id TEXT NOT NULL CHECK (body_zone_id IN (${BODY_ZONE_IDS_SQL_LIST})),
  PRIMARY KEY (activity_id, body_zone_id)
);

INSERT INTO activity_body_zones (activity_id, body_zone_id)
SELECT activity_id, body_zone_id FROM activity_body_zones_backup;

DROP TABLE activity_body_zones_backup;
`;
