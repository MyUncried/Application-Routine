import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import { PREDEFINED_CATEGORIES } from "@/domain/categories/defaults";
import { canonicalCategoryKey } from "@/domain/categories/validation";
import { BODY_ZONES } from "@/features/reference-data/bodyZones";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { MIGRATION_001 } from "@/infrastructure/database/migrations/migration001";
import { MIGRATION_002 } from "@/infrastructure/database/migrations/migration002";
import { MIGRATION_003 } from "@/infrastructure/database/migrations/migration003";
import { MIGRATION_004 } from "@/infrastructure/database/migrations/migration004";
import { MIGRATION_005 } from "@/infrastructure/database/migrations/migration005";
import { MIGRATION_006 } from "@/infrastructure/database/migrations/migration006";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

const MIGRATIONS_DIR = join(__dirname, "..", "migrations");

/** Instantané exact (SHA-256) du texte SOURCE de chaque migration historique, capturé à la baseline `e216294506bed87dd80855937e3fabfbfa322b82` — jamais recalculé automatiquement (`FILE_UNCHANGED`, contrat de bornes). */
const HISTORICAL_MIGRATION_SOURCE_SHA256: Readonly<Record<string, string>> = {
  "migration001.ts": "2b3b1bab6399ef0cd688886d8530588ab73eef377e0bb90335dff48ddfa66add",
  "migration002.ts": "ae6cae83c5d978bac99f8098fc15feb7bd2f1620443e95fa11c539145bd5a73a",
  "migration003.ts": "db6c496bc398c1010272e999d66926c069cc2dbad2b3be9d113c70fb50310d73",
  "migration004.ts": "6dc82ef7ebe6162f48b37d252241b28a8836afed20644975f41ce7760b907ddf",
  "migration005.ts": "4bc041becc7298d8a472a98810fa289d7c8abd18322beac1b7a1b963991eb778",
  "migration006.ts": "a9aee02f3447666854750e558a65ea737bc7c8433abe3413f3121cbe059be5b2",
};

function sha256OfFile(fileName: string): string {
  const content = readFileSync(join(MIGRATIONS_DIR, fileName), "utf8");
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Instantané exact — en dur, jamais recalculé depuis un import — des DEUX
 * seuls fragments de SQL qui sont EFFECTIVEMENT ÉVALUÉS à partir d'une
 * dépendance indirecte (`PREDEFINED_CATEGORIES`/`canonicalCategoryKey` pour
 * `migration002` ; `BODY_ZONES` pour `migration002`/`migration003`/
 * `migration004`), capturé à la baseline
 * `e216294506bed87dd80855937e3fabfbfa322b82`.
 *
 * Distinct du gel du texte SOURCE ci-dessus (`HISTORICAL_MIGRATION_SOURCE_
 * SHA256`) : celui-ci ne détecterait PAS un changement SQL introduit par
 * import indirect — une modification de `PREDEFINED_CATEGORIES`/`BODY_ZONES`
 * laisserait le texte source de `migration002.ts` lui-même parfaitement
 * inchangé, tout en altérant le SQL réellement exécuté. Recalculer ces
 * fragments depuis les MÊMES imports que les migrations ne prouverait rien
 * (comparaison d'une valeur à elle-même) — ces deux constantes sont donc
 * des littéraux FIGÉS, indépendants de `@/domain/categories/defaults`,
 * `@/domain/categories/validation` et `@/features/reference-data/bodyZones`.
 * Ce second instantané ferme ce trou (revue indépendante 5931901286,
 * REQ-D22AC3A2E90D8620).
 */
const BASELINE_BODY_ZONE_IDS_SQL_LIST =
  "'cou', 'epaules', 'bras', 'poignets-mains', 'dos', 'hanches-bassin', 'cuisses', 'genoux', 'jambes', 'chevilles-pieds'";

const BASELINE_CATEGORIES_SEED = [
  "('renforcement', 'Renforcement', 'renforcement', 1, 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
  "('cardio', 'Cardio', 'cardio', 1, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
  "('mobilite', 'Mobilité', 'mobilite', 1, 2, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
  "('etirements', 'Étirements', 'etirements', 1, 3, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
  "('equilibre', 'Équilibre', 'equilibre', 1, 4, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
  "('coordination', 'Coordination', 'coordination', 1, 5, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
  "('recuperation', 'Récupération', 'recuperation', 1, 6, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
  "('respiration', 'Respiration', 'respiration', 1, 7, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
  "('meditation', 'Méditation', 'meditation', 1, 8, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
  "('autre', 'Autre', 'autre', 1, 9, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
].join(",\n  ");

/** Copie littérale exacte du gabarit SQL statique de `migration001.ts` (aucune dépendance, aucune substitution) — baseline. */
const EXPECTED_MIGRATION_001 = `
CREATE TABLE users (
  singleton_key INTEGER PRIMARY KEY CHECK (singleton_key = 1),
  id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  color TEXT NOT NULL CHECK (color IN (
    '#E5484D', '#F47B20', '#F7D154', '#2E9B62',
    '#20B2AA', '#32B8D8', '#3B82F6', '#5A5BD7',
    '#7B61D1', '#A34AB7', '#E45C9A', '#8E8E93'
  )),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  initial_countdown_seconds INTEGER NOT NULL DEFAULT 10 CHECK (initial_countdown_seconds >= 0),
  final_phase_seconds INTEGER NOT NULL DEFAULT 5 CHECK (final_phase_seconds >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_executed_at TEXT,
  archived_at TEXT,
  CHECK (
    ((status = 'ACTIVE') AND (archived_at IS NULL))
    OR
    ((status = 'ARCHIVED') AND (archived_at IS NOT NULL))
  )
);

CREATE INDEX sessions_owner_status_updated_idx
ON sessions(owner_id, status, updated_at DESC);

CREATE TABLE cycles (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL UNIQUE REFERENCES sessions(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 1 CHECK (position = 1),
  repeat_count INTEGER NOT NULL DEFAULT 1 CHECK (repeat_count = 1),
  UNIQUE (id, session_id)
);

CREATE TABLE tours (
  id TEXT PRIMARY KEY NOT NULL,
  cycle_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 1 CHECK (position = 1),
  repeat_count INTEGER NOT NULL DEFAULT 1 CHECK (repeat_count BETWEEN 1 AND 99),
  UNIQUE (cycle_id),
  UNIQUE (id, cycle_id, session_id),
  FOREIGN KEY (cycle_id, session_id)
    REFERENCES cycles(id, session_id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE
);

CREATE TABLE activities (
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
  execution_mode TEXT NOT NULL CHECK (execution_mode IN ('DURATION', 'REPETITIONS')),
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

CREATE INDEX activities_session_position_idx
ON activities(session_id, structural_position, position);
`;

/** Copie littérale exacte du gabarit SQL de `migration002.ts`, seuls `CATEGORIES_SEED`/`BODY_ZONE_IDS_SQL_LIST` substitués par les littéraux figés ci-dessus — baseline. */
const EXPECTED_MIGRATION_002 = `
CREATE TABLE categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 40),
  canonical_key TEXT NOT NULL UNIQUE,
  is_predefined INTEGER NOT NULL CHECK (is_predefined IN (0, 1)),
  display_order INTEGER,
  created_at TEXT NOT NULL,
  CHECK (
    ((is_predefined = 1) AND (display_order IS NOT NULL))
    OR
    ((is_predefined = 0) AND (display_order IS NULL))
  )
);

CREATE INDEX categories_display_order_idx
ON categories(is_predefined DESC, display_order, created_at);

INSERT INTO categories (id, name, canonical_key, is_predefined, display_order, created_at) VALUES
  ${BASELINE_CATEGORIES_SEED};

CREATE TABLE session_categories (
  session_id TEXT NOT NULL REFERENCES sessions(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  PRIMARY KEY (session_id, category_id)
);

CREATE TABLE activity_body_zones (
  activity_id TEXT NOT NULL REFERENCES activities(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  body_zone_id TEXT NOT NULL CHECK (body_zone_id IN (${BASELINE_BODY_ZONE_IDS_SQL_LIST})),
  PRIMARY KEY (activity_id, body_zone_id)
);
`;

/** Copie littérale exacte du gabarit SQL de `migration003.ts`, seul `BODY_ZONE_IDS_SQL_LIST` substitué par le littéral figé ci-dessus — baseline. */
const EXPECTED_MIGRATION_003 = `
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
  body_zone_id TEXT NOT NULL CHECK (body_zone_id IN (${BASELINE_BODY_ZONE_IDS_SQL_LIST})),
  PRIMARY KEY (activity_id, body_zone_id)
);

INSERT INTO activity_body_zones (activity_id, body_zone_id)
SELECT activity_id, body_zone_id FROM activity_body_zones_backup;

DROP TABLE activity_body_zones_backup;
`;

const EXPECTED_POSITION_STAGING_OFFSET = 1_000_000;

/** Copie littérale exacte du gabarit SQL de `migration004.ts`, seul `BODY_ZONE_IDS_SQL_LIST` substitué par le littéral figé ci-dessus — baseline. */
const EXPECTED_MIGRATION_004 = `
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
SET position = ${EXPECTED_POSITION_STAGING_OFFSET} + (
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
  body_zone_id TEXT NOT NULL CHECK (body_zone_id IN (${BASELINE_BODY_ZONE_IDS_SQL_LIST})),
  PRIMARY KEY (activity_id, body_zone_id)
);

INSERT INTO activity_body_zones (activity_id, body_zone_id)
SELECT activity_id, body_zone_id FROM activity_body_zones_backup;

DROP TABLE activity_body_zones_backup;
`;

/** Copie littérale exacte du gabarit SQL de `migration005.ts` (aucune dépendance, aucune substitution) — baseline. */
const EXPECTED_MIGRATION_005 = `
ALTER TABLE activities ADD COLUMN side_mode TEXT NOT NULL DEFAULT 'UNILATERAL'
  CHECK (side_mode IN ('UNILATERAL', 'RIGHT_LEFT', 'LEFT_RIGHT'));

ALTER TABLE tours ADD COLUMN side_mode TEXT NOT NULL DEFAULT 'UNILATERAL'
  CHECK (side_mode IN ('UNILATERAL', 'RIGHT_LEFT', 'LEFT_RIGHT'));
`;

/** Copie littérale exacte du gabarit SQL de `migration006.ts` (aucune dépendance, aucune substitution) — baseline. */
const EXPECTED_MIGRATION_006 = `
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

const HISTORICAL_MIGRATION_SQL_BASELINE: readonly (readonly [string, string, string])[] = [
  ["MIGRATION_001", MIGRATION_001, EXPECTED_MIGRATION_001],
  ["MIGRATION_002", MIGRATION_002, EXPECTED_MIGRATION_002],
  ["MIGRATION_003", MIGRATION_003, EXPECTED_MIGRATION_003],
  ["MIGRATION_004", MIGRATION_004, EXPECTED_MIGRATION_004],
  ["MIGRATION_005", MIGRATION_005, EXPECTED_MIGRATION_005],
  ["MIGRATION_006", MIGRATION_006, EXPECTED_MIGRATION_006],
];

/**
 * Convergence du schéma SQLite cible (V2-PRE-1, plan §6/§7/§9 —
 * `targetSchema.test.ts`, nouveau).
 *
 * **Préservation effective des migrations historiques (plan §6)** : le SQL
 * effectivement généré par `migration001`…`migration006` (après évaluation
 * du module, donc après incorporation des valeurs de `PREDEFINED_CATEGORIES`/
 * `canonicalCategoryKey`/`BODY_ZONES`) est figé par snapshot Jest — un
 * instantané exact de la baseline. Toute modification future de ces fichiers,
 * ou de leurs dépendances historiques, ferait échouer ce test — c'est le
 * garde-fou explicitement requis par le plan.
 *
 * `migration007` (V2-PRE-1) ajoute les référentiels persistants additifs
 * (`body_zones`, `labels`, `profiles`, `media_assets`, `activity_media`) ET
 * fait converger le schéma cible sur les tables existantes — `ALTER TABLE`
 * uniquement (`ADD COLUMN`/`RENAME COLUMN`/`DROP COLUMN`), jamais de
 * reconstruction de table : `categories.color`/`is_active` ; `activity_
 * definitions.category_id`/`side_recovery_seconds` (et retrait de
 * `recovery_seconds`) ; `sessions.label_id` (et retrait de `color`) ;
 * retrait de la table `session_categories` ; renommage de
 * `activities.recovery_seconds` en `post_activity_recovery_seconds`.
 */
describe("targetSchema — préservation historique et référentiels additifs (V2-PRE-1)", () => {
  it("freezes migration001..006's source text byte-for-byte against the baseline snapshot (FILE_UNCHANGED)", () => {
    for (const [fileName, expectedSha256] of Object.entries(HISTORICAL_MIGRATION_SOURCE_SHA256)) {
      expect(sha256OfFile(fileName)).toBe(expectedSha256);
    }
  });

  /**
   * Revue indépendante 5931901286, REQ-D22AC3A2E90D8620 : le gel ci-dessus ne
   * porte que sur le texte SOURCE de chaque fichier de migration — il ne
   * détecterait pas un changement du SQL réellement généré introduit par une
   * dépendance indirecte (`PREDEFINED_CATEGORIES`/`canonicalCategoryKey`/
   * `BODY_ZONES`, consommées par `migration002`…`migration004`). Ce test
   * compare donc la VALEUR SQL ÉVALUÉE (après incorporation de ces
   * dépendances) de chaque migration historique à son instantané exact de la
   * baseline.
   */
  it.each(HISTORICAL_MIGRATION_SQL_BASELINE)(
    "freezes %s's effectively evaluated SQL export against the baseline (no indirect-import change)",
    (_name, actual, expected) => {
      expect(actual).toBe(expected);
    },
  );

  it("keeps PREDEFINED_CATEGORIES and canonicalCategoryKey producing the exact historical seed values consumed by migration002's SQL", () => {
    expect(PREDEFINED_CATEGORIES.map((category) => category.id)).toEqual([
      "renforcement",
      "cardio",
      "mobilite",
      "etirements",
      "equilibre",
      "coordination",
      "recuperation",
      "respiration",
      "meditation",
      "autre",
    ]);
    expect(PREDEFINED_CATEGORIES.map((category) => canonicalCategoryKey(category.name))).toEqual([
      "renforcement",
      "cardio",
      "mobilite",
      "etirements",
      "equilibre",
      "coordination",
      "recuperation",
      "respiration",
      "meditation",
      "autre",
    ]);
  });

  it("keeps BODY_ZONES producing the exact historical ids consumed by migration002/003/007's SQL", () => {
    expect(BODY_ZONES.map((zone) => zone.id)).toEqual([
      "cou",
      "epaules",
      "bras",
      "poignets-mains",
      "dos",
      "hanches-bassin",
      "cuisses",
      "genoux",
      "jambes",
      "chevilles-pieds",
    ]);
  });

  describe("fresh installation convergence", () => {
    it("reaches DATABASE_VERSION and creates every additive referential table", async () => {
      const database = NodeSqliteDatabase.openInMemory();
      try {
        await migrateDatabase(database);
        const version = await database.getFirstAsync<{ user_version: number }>(
          "PRAGMA user_version",
        );
        expect(version?.user_version).toBe(DATABASE_VERSION);

        const tables = await database.getAllAsync<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
        );
        const tableNames = tables.map((table) => table.name);
        for (const expected of [
          "body_zones",
          "labels",
          "profiles",
          "media_assets",
          "activity_media",
          "session_stop_points",
        ]) {
          expect(tableNames).toContain(expected);
        }
      } finally {
        database.close();
      }
    });

    it("is idempotent — running the full migration twice never duplicates seeded referentials", async () => {
      const database = NodeSqliteDatabase.openInMemory();
      try {
        await migrateDatabase(database);
        await migrateDatabase(database);

        const bodyZoneCount = await database.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) AS count FROM body_zones",
        );
        const categoryCount = await database.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) AS count FROM categories",
        );
        const profileCount = await database.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) AS count FROM profiles",
        );
        expect(bodyZoneCount?.count).toBe(BODY_ZONES.length);
        expect(categoryCount?.count).toBe(PREDEFINED_CATEGORIES.length);
        expect(profileCount?.count).toBe(1);
      } finally {
        database.close();
      }
    });
  });

  describe("convergence du schéma existant (plan §7)", () => {
    it("removes session_categories entirely, and sessions no longer has a color column", async () => {
      const database = NodeSqliteDatabase.openInMemory();
      try {
        await migrateDatabase(database);

        const table = await database.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name = 'session_categories'",
        );
        expect(table?.count).toBe(0);

        const columns = await database.getAllAsync<{ name: string }>(
          "PRAGMA table_info(sessions)",
        );
        expect(columns.map((column) => column.name)).not.toContain("color");
        expect(columns.map((column) => column.name)).toContain("label_id");
      } finally {
        database.close();
      }
    });

    it("adds color/is_active to categories, category_id/side_recovery_seconds to activity_definitions, and removes recovery_seconds from it", async () => {
      const database = NodeSqliteDatabase.openInMemory();
      try {
        await migrateDatabase(database);

        const categoryColumns = await database.getAllAsync<{ name: string }>(
          "PRAGMA table_info(categories)",
        );
        expect(categoryColumns.map((column) => column.name)).toEqual(
          expect.arrayContaining(["color", "is_active"]),
        );

        const definitionColumns = await database.getAllAsync<{ name: string }>(
          "PRAGMA table_info(activity_definitions)",
        );
        const definitionColumnNames = definitionColumns.map((column) => column.name);
        expect(definitionColumnNames).toEqual(
          expect.arrayContaining(["category_id", "side_recovery_seconds"]),
        );
        expect(definitionColumnNames).not.toContain("recovery_seconds");
      } finally {
        database.close();
      }
    });

    it("renames activities.recovery_seconds to post_activity_recovery_seconds", async () => {
      const database = NodeSqliteDatabase.openInMemory();
      try {
        await migrateDatabase(database);

        const columns = await database.getAllAsync<{ name: string }>(
          "PRAGMA table_info(activities)",
        );
        const columnNames = columns.map((column) => column.name);
        expect(columnNames).toContain("post_activity_recovery_seconds");
        expect(columnNames).not.toContain("recovery_seconds");
      } finally {
        database.close();
      }
    });

    /**
     * V2-PRE-1 (plan §3.3/§7, REQ-001108DC7F67664C) : `session_stop_points`
     * référence `sessions(id)` directement (jamais le Cycle/Circuit) et
     * garantit un ordre stable, sans doublon, PAR portée structurelle.
     */
    it("creates session_stop_points referencing sessions directly, with a unique (session_id, scope, position)", async () => {
      const database = NodeSqliteDatabase.openInMemory();
      try {
        await migrateDatabase(database);

        const columns = await database.getAllAsync<{ name: string }>(
          "PRAGMA table_info(session_stop_points)",
        );
        expect(columns.map((column) => column.name)).toEqual(
          expect.arrayContaining(["id", "session_id", "scope", "position"]),
        );

        await database.runAsync(
          `INSERT INTO sessions (
             id, owner_id, name, status, initial_countdown_seconds, final_phase_seconds,
             created_at, updated_at
           ) SELECT 'session-1', id, 'Séance', 'ACTIVE', 10, 5,
             '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
             FROM users WHERE singleton_key = 1`,
        );
        await database.runAsync(
          `INSERT INTO session_stop_points (id, session_id, scope, position) VALUES ('sp-1', 'session-1', 'IN_TOUR', 0)`,
        );

        await expect(
          database.runAsync(
            `INSERT INTO session_stop_points (id, session_id, scope, position) VALUES ('sp-2', 'session-1', 'IN_TOUR', 0)`,
          ),
        ).rejects.toThrow();
      } finally {
        database.close();
      }
    });
  });

  /**
   * V2-PRE-2 (plan §6.2, T22, migration008) : clé normalisée OBLIGATOIRE et
   * UNIQUE pour les Étiquettes et les Zones corporelles (toutes les
   * entrées, actives et retirées — garantit la réactivation D2 au niveau du
   * stockage) ; `activity_body_zones` reconstruite avec une clé étrangère
   * réelle vers `body_zones(id)`.
   */
  describe("v8 — clé normalisée Étiquettes/Zones et clé étrangère réelle de activity_body_zones (plan §6.2, T22)", () => {
    async function seedSessionAndActivity(database: NodeSqliteDatabase) {
      await database.runAsync(
        `INSERT INTO sessions (
           id, owner_id, name, status, initial_countdown_seconds, final_phase_seconds,
           created_at, updated_at
         ) SELECT 'session-v8', id, 'Séance', 'ACTIVE', 10, 5,
           '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
           FROM users WHERE singleton_key = 1`,
      );
      await database.runAsync(
        `INSERT INTO cycles (id, session_id, position, repeat_count) VALUES ('cycle-v8', 'session-v8', 1, 1)`,
      );
      await database.runAsync(
        `INSERT INTO activities (
           id, session_id, cycle_id, tour_id, type, structural_position,
           position, name, execution_mode, duration_seconds,
           repetition_count, series_count, pause_seconds, instruction,
           created_at, updated_at
         ) VALUES (
           'activity-v8', 'session-v8', 'cycle-v8', NULL, 'EXERCISE', 'BEFORE_TOUR',
           0, 'Squat', 'DURATION', 30, NULL, 3, 10, NULL,
           '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
         )`,
      );
    }

    it("rejects a NULL canonical_key on insert for labels and body_zones", async () => {
      const database = NodeSqliteDatabase.openInMemory();
      try {
        await migrateDatabase(database);

        await expect(
          database.runAsync(
            `INSERT INTO labels (id, name, canonical_key, color, is_active, created_at)
             VALUES ('label-null-key', 'Sans clé', NULL, '#2E9B62', 1, '2026-01-01T00:00:00.000Z')`,
          ),
        ).rejects.toThrow(/canonical_key/);

        await expect(
          database.runAsync(
            `INSERT INTO body_zones (id, name, canonical_key, is_active, created_at)
             VALUES ('zone-null-key', 'Sans clé', NULL, 1, '2026-01-01T00:00:00.000Z')`,
          ),
        ).rejects.toThrow(/canonical_key/);
      } finally {
        database.close();
      }
    });

    it("rejects setting canonical_key to NULL on update for labels and body_zones", async () => {
      const database = NodeSqliteDatabase.openInMemory();
      try {
        await migrateDatabase(database);
        await database.runAsync(
          `INSERT INTO labels (id, name, canonical_key, color, is_active, created_at)
           VALUES ('label-1', 'Sport', 'sport', '#2E9B62', 1, '2026-01-01T00:00:00.000Z')`,
        );

        await expect(
          database.runAsync(`UPDATE labels SET canonical_key = NULL WHERE id = 'label-1'`),
        ).rejects.toThrow(/canonical_key/);

        // `dos` est déjà semée par migration007 — la clé y est garantie non NULL.
        await expect(
          database.runAsync(`UPDATE body_zones SET canonical_key = NULL WHERE id = 'dos'`),
        ).rejects.toThrow(/canonical_key/);
      } finally {
        database.close();
      }
    });

    it("rejects a duplicate canonical_key even against a RETIRED entry (D2 reactivation guarantee, storage level)", async () => {
      const database = NodeSqliteDatabase.openInMemory();
      try {
        await migrateDatabase(database);
        await database.runAsync(
          `INSERT INTO labels (id, name, canonical_key, color, is_active, created_at)
           VALUES ('label-retired', 'Sport', 'sport', '#2E9B62', 0, '2026-01-01T00:00:00.000Z')`,
        );

        await expect(
          database.runAsync(
            `INSERT INTO labels (id, name, canonical_key, color, is_active, created_at)
             VALUES ('label-new', 'Sport', 'sport', '#F47B20', 1, '2026-01-02T00:00:00.000Z')`,
          ),
        ).rejects.toThrow();
      } finally {
        database.close();
      }
    });

    it("cascades activity_body_zones deletion from its Activity (ON DELETE CASCADE preserved)", async () => {
      const database = NodeSqliteDatabase.openInMemory();
      try {
        await migrateDatabase(database);
        await seedSessionAndActivity(database);
        await database.runAsync(
          `INSERT INTO activity_body_zones (activity_id, body_zone_id) VALUES ('activity-v8', 'dos')`,
        );

        await database.runAsync(`DELETE FROM activities WHERE id = 'activity-v8'`);

        const remaining = await database.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) AS count FROM activity_body_zones WHERE activity_id = 'activity-v8'",
        );
        expect(remaining?.count).toBe(0);
      } finally {
        database.close();
      }
    });

    it("refuses deleting a Zone still referenced by activity_body_zones (ON DELETE RESTRICT, real foreign key)", async () => {
      const database = NodeSqliteDatabase.openInMemory();
      try {
        await migrateDatabase(database);
        await seedSessionAndActivity(database);
        await database.runAsync(
          `INSERT INTO activity_body_zones (activity_id, body_zone_id) VALUES ('activity-v8', 'dos')`,
        );

        await expect(database.runAsync(`DELETE FROM body_zones WHERE id = 'dos'`)).rejects.toThrow();
      } finally {
        database.close();
      }
    });
  });
});
