import { BODY_ZONES } from "@/features/reference-data/bodyZones";

/**
 * Migration additive T02-S02 : **Récupération ATTACHÉE à l'Activité**
 * (`activities.recovery_seconds`) et suppression définitive des Activités
 * techniques `RECOVERY`.
 *
 * Source : `12 – Architecture technique.md` (« T02-S02 consomme définitivement
 * la migration SQLite additive `004` et fixe `DATABASE_VERSION = 4`. Cette
 * migration ajoute la Récupération attachée à l'Activité, corrige les données
 * nécessaires au calcul des Pauses et migre les anciennes lignes techniques
 * `RECOVERY` vers l'Activité précédente compatible ; une ligne orpheline est
 * ignorée. Elle ne persiste ni la Durée totale ni le pilote d'interface. »),
 * `09 – Modèle de données fonctionnel.md` (DM-015/DM-016) et RM-129.
 *
 * N'altère JAMAIS `migration001.ts`, `migration002.ts` ni `migration003.ts`
 * (« Conservation des acquis », `.github/AI_ORCHESTRATION.md`) — chaque
 * migration reste un fichier indépendant, exécuté une seule fois par
 * `migrateDatabase.ts` sous la garde `PRAGMA user_version`.
 *
 * **Aucune table d'Exécution, d'Instantané ou de Résultat n'est ajoutée** :
 * elles relèvent de T03 (migration `005`, `DATABASE_VERSION = 5`).
 *
 * ## Pourquoi une reconstruction de table
 *
 * SQLite ne permet ni `ALTER TABLE … DROP CONSTRAINT` ni la modification d'un
 * `CHECK` de table. Or `recovery_seconds` doit être borné (`0..5999`) DANS le
 * `CHECK` composite existant, qui distingue déjà `EXERCISE`/`RECOVERY` et les
 * trois modes. La table `activities` est donc reconstruite selon la procédure
 * standard « 12 étapes », en préservant **exactement** le schéma issu de
 * `migration003` : identifiants, horodatages, types, positions, relations,
 * contraintes, index `activities_session_position_idx`, unicité
 * `UNIQUE(session_id, structural_position, position)`, les deux clés
 * étrangères composites vers `cycles`/`tours`, et l'intégralité de la table
 * dépendante `activity_body_zones`.
 *
 * `PRAGMA foreign_keys` étant un no-op dans une transaction, la migration
 * s'exécute dans la transaction partagée du runner et emploie
 * `PRAGMA defer_foreign_keys = ON` (même stratégie que `migration003`).
 * `activity_body_zones` est néanmoins sauvegardée puis restaurée
 * explicitement : `DROP TABLE activities` déclenche un `DELETE` implicite qui
 * exécuterait le `ON DELETE CASCADE` même en mode différé.
 *
 * ## Reprise des anciennes lignes `RECOVERY`
 *
 * Pour chaque ancienne ligne technique `RECOVERY`, sa durée est transférée
 * vers `recovery_seconds` de l'Activité non-`RECOVERY` qui la précède
 * IMMÉDIATEMENT dans la MÊME Séance et la MÊME zone structurelle. La
 * recherche est exprimée depuis l'Activité (`NOT EXISTS` d'une Activité
 * intercalée), ce qui garantit trois propriétés d'un seul tenant :
 *
 * - déterminisme : au plus une ligne `RECOVERY` candidate par Activité ;
 * - unicité : deux `RECOVERY` consécutives ne s'additionnent jamais — seule
 *   la première est reprise, conformément à « elle s'exécute une seule fois » ;
 * - le NOM des lignes n'intervient jamais dans la décision — uniquement le
 *   type, la Séance, la zone et la position.
 *
 * Une ligne `RECOVERY` ORPHELINE (aucune Activité compatible avant elle dans
 * sa zone) est ignorée : sa durée n'est reportée nulle part. Comme aucune
 * ligne `RECOVERY` n'est recopiée dans la nouvelle table, elle disparaît avec
 * les autres — « ne conserver aucune Activité RECOVERY fonctionnelle après
 * migration ». Limite disclosée : une Séance dont la SEULE Activité serait une
 * `RECOVERY` orpheline deviendrait une Séance sans Activité (donc absente du
 * Catalogue, dont la projection exige une jointure sur `activities`) ; ce cas
 * n'est pas productible par l'application, qui a toujours exigé au moins un
 * Exercice pour enregistrer une Séance.
 *
 * Les positions de chaque zone sont ensuite RENUMÉROTÉES continûment
 * (`0, 1, 2, …`) pour ne pas laisser les trous ouverts par les lignes
 * supprimées. La réécriture passe par une plage haute intermédiaire
 * (`POSITION_STAGING_OFFSET`) : sans elle, une écriture ligne à ligne
 * violerait transitoirement `UNIQUE(session_id, structural_position,
 * position)` — même précaution que `mergeActivities`
 * (`SqliteSessionRepository.ts`).
 */
const BODY_ZONE_IDS_SQL_LIST = BODY_ZONES.map((zone) => `'${zone.id}'`).join(", ");

/**
 * Plage haute réservée à la réécriture transitoire des positions. Identique à
 * celle de `mergeActivities` — très au-delà de toute position réelle (bornée
 * en pratique par `1..99` Activités par zone).
 */
const POSITION_STAGING_OFFSET = 1_000_000;

export const MIGRATION_004 = `
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
  recovery_seconds INTEGER NOT NULL DEFAULT 0,
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
      AND (recovery_seconds BETWEEN 0 AND 5999)
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
      AND (recovery_seconds = 0)
    )
  ),
  CHECK ((instruction IS NULL) OR (length(instruction) <= 1000))
);

INSERT INTO activities_new (
  id, session_id, cycle_id, tour_id, type, structural_position,
  position, name, execution_mode, duration_seconds, repetition_count,
  series_count, pause_seconds, recovery_seconds, instruction, created_at, updated_at
)
SELECT
  id, session_id, cycle_id, tour_id, type, structural_position,
  position, name, execution_mode, duration_seconds, repetition_count,
  series_count, pause_seconds, 0, instruction, created_at, updated_at
FROM activities
WHERE type <> 'RECOVERY';

UPDATE activities_new
SET recovery_seconds = COALESCE((
  SELECT recovery.duration_seconds
  FROM activities AS recovery
  WHERE recovery.type = 'RECOVERY'
    AND recovery.session_id = activities_new.session_id
    AND recovery.structural_position = activities_new.structural_position
    AND recovery.position > activities_new.position
    AND NOT EXISTS (
      SELECT 1
      FROM activities AS between_rows
      WHERE between_rows.session_id = recovery.session_id
        AND between_rows.structural_position = recovery.structural_position
        AND between_rows.position > activities_new.position
        AND between_rows.position < recovery.position
    )
  ORDER BY recovery.position ASC
  LIMIT 1
), 0);

CREATE TABLE activities_position_map (
  id TEXT PRIMARY KEY NOT NULL,
  new_position INTEGER NOT NULL
);

INSERT INTO activities_position_map (id, new_position)
SELECT
  kept.id,
  (
    SELECT COUNT(*)
    FROM activities_new AS earlier
    WHERE earlier.session_id = kept.session_id
      AND earlier.structural_position = kept.structural_position
      AND earlier.position < kept.position
  )
FROM activities_new AS kept;

UPDATE activities_new
SET position = ${POSITION_STAGING_OFFSET} + (
  SELECT mapped.new_position FROM activities_position_map AS mapped WHERE mapped.id = activities_new.id
);

UPDATE activities_new
SET position = (
  SELECT mapped.new_position FROM activities_position_map AS mapped WHERE mapped.id = activities_new.id
);

DROP TABLE activities_position_map;

CREATE TABLE activity_body_zones_backup (
  activity_id TEXT NOT NULL,
  body_zone_id TEXT NOT NULL
);

INSERT INTO activity_body_zones_backup (activity_id, body_zone_id)
SELECT activity_id, body_zone_id
FROM activity_body_zones
WHERE activity_id IN (SELECT id FROM activities_new);

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
