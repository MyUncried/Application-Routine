import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  activityDefinitionToDraftExercise,
  validateActivityDefinitionInput,
  type ActivityDefinition,
  type CreateActivityDefinitionInput,
} from "@/domain/activities/ActivityDefinition";
import {
  allTargetsFailure,
  projectScalars,
  readExecutionParameters,
  readV2,
  serializeV2,
  type ExecutionParameters,
} from "@/domain/activities/ExecutionParameters";
import { readV1, type LegacyExecutionScalars } from "@/domain/activities/readV1";
import {
  allFailureParameters,
  durationParameters,
  repetitionParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import type { MediaAsset } from "@/domain/media/MediaAsset";
import type { Session } from "@/domain/sessions/Session";
import { createEmptyDraft, toCreateSessionInput, type SessionDraft } from "@/domain/sessions/SessionDraft";
import type { SideMode } from "@/domain/sessions/sideMode";
import type { Database } from "@/infrastructure/database/Database";
import { DATABASE_VERSION, STANDARD_PRAGMAS } from "@/infrastructure/database/constants";
import { initializeDatabase } from "@/infrastructure/database/initializeDatabase";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteMigrationNoticeRepository } from "@/infrastructure/database/repositories/SqliteMigrationNoticeRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { buildVersion9 } from "@/infrastructure/database/testing/buildVersion9";
import { failOnWrite } from "@/infrastructure/database/testing/failOnWrite";
import { withoutMigration011Columns } from "@/infrastructure/database/testing/migration011Columns";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-4 story 1.4 — preuve de préservation sur une base antérieure RÉELLE
 * (FR-18-19, AD-10). Base FICHIER `node:sqlite` construite par 001 à 009 du
 * code de départ (`buildVersion9`), alimentée par la fixture v9 complète
 * ci-dessous (`INSERT` directs), migrée par le chemin du démarrage
 * (`initializeDatabase` : `foreign_keys = ON`, WAL, `migrateDatabase`), puis relue
 * par une NOUVELLE connexion après fermeture : aucune simulation de la
 * persistance, aucun état en mémoire.
 *
 * Test de migration et de parité : il nomme l'ancien troisième mode et
 * importe `readV1` (garde de cantonnement de la story 1.1, AC4).
 *
 * Report E7 (`deferred-work.md`) tranché ici : le `foreign_key_check` de
 * `migration010` portait sur toute la base ; une violation préexistante
 * sans rapport avec PRE-4 bloquait la migration. Contrôle strict sur les
 * tables reconstruites, et sans violation nouvelle ailleurs (correction
 * minimale consignée dans la story).
 */


let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;

// --- Base fichier : ouverture, réouverture, nettoyage ------------------------

let path: string;
const opened: NodeSqliteDatabase[] = [];

function open(): NodeSqliteDatabase {
  const database = NodeSqliteDatabase.openFile(path);
  opened.push(database);
  return database;
}

/**
 * Ferme la connexion : la relecture suivante passe par une NOUVELLE connexion
 * au même fichier. La connexion n'est retirée de `opened` qu'après une
 * fermeture réussie : sinon `afterEach` la refermera.
 */
function close(database: NodeSqliteDatabase): void {
  database.close();
  const index = opened.indexOf(database);
  if (index >= 0) {
    opened.splice(index, 1);
  }
}

function reopen(database: NodeSqliteDatabase): NodeSqliteDatabase {
  close(database);
  return open();
}

/** Répertoire de travail des bases de test, dans le clone (ignoré par Git sous `node_modules`). */
const WORK_DIRECTORY = join(process.cwd(), "node_modules", ".cache", "kodjo-pre4-story14");

beforeEach(() => {
  mkdirSync(WORK_DIRECTORY, { recursive: true });
  path = join(WORK_DIRECTORY, `base-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
});

afterEach(() => {
  try {
    // Chaque connexion est fermée séparément : l'échec de l'une n'empêche ni les autres ni le nettoyage.
    for (const database of [...opened]) {
      try {
        close(database);
      } catch {
        opened.splice(opened.indexOf(database), 1);
      }
    }
  } finally {
    for (const suffix of ["", "-wal", "-shm", "-journal"]) {
      rmSync(`${path}${suffix}`, { force: true });
    }
  }
});

// --- Fixture v9 complète (AC1) -------------------------------------------------

type V1Options = {
  readonly mode?: "DURATION" | "REPETITIONS" | "TO_FAILURE";
  readonly sideMode?: SideMode;
  readonly sideOrder?: "BY_SIDE" | "BY_SERIES";
  readonly sideRecoverySeconds?: number;
  readonly beep?: number;
  readonly countdown?: number;
  readonly end?: number;
};

/** JSON v1 de PRE-3, forme du sérialiseur v1 (clés et ordre). */
function v1(series: Record<string, unknown>, options: V1Options = {}): string {
  return JSON.stringify({
    version: 1,
    mode: options.mode ?? "DURATION",
    series,
    sideMode: options.sideMode ?? "UNILATERAL",
    sideOrder: options.sideOrder ?? "BY_SIDE",
    sideRecoverySeconds: options.sideRecoverySeconds ?? 0,
    cadenceBeepIntervalSeconds: options.beep ?? 0,
    countdownSeconds: options.countdown ?? 0,
    endSeconds: options.end ?? 0,
  });
}

const uniform = (count: number, target: number | null, pauseSeconds: number) => ({ kind: "UNIFORM", count, target, pauseSeconds });
const variable = (...rows: readonly (readonly [number | null, number])[]) => ({
  kind: "VARIABLE",
  rows: rows.map(([target, pauseSeconds]) => ({ target, pauseSeconds })),
});

type Scalars = {
  readonly mode: "DURATION" | "REPETITIONS" | "TO_FAILURE";
  readonly duration?: number | null;
  readonly repetitions?: number | null;
  readonly series: number;
  readonly pause: number;
  readonly sideMode?: SideMode;
};

type DefinitionFixture = Scalars & {
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly category: string;
  readonly sideRecovery?: number;
  readonly json?: string | null;
  readonly zones?: readonly string[];
  readonly media?: readonly string[];
};

type CopyFixture = Scalars & {
  readonly id: string;
  readonly session: string;
  readonly zone: "BEFORE_TOUR" | "IN_TOUR" | "AFTER_TOUR";
  readonly position: number;
  readonly name: string;
  readonly recovery?: number;
  readonly category?: string | null;
  readonly instruction?: string | null;
  readonly json?: string | null;
  readonly zones?: readonly string[];
  readonly media?: readonly string[];
};

type SessionFixture = {
  readonly id: string;
  readonly name: string;
  readonly archived?: boolean;
  readonly tourRepeat: number;
};

const FAILURE_UNIFORM_JSON = v1(uniform(3, null, 10), {
  mode: "TO_FAILURE",
  sideMode: "RIGHT_LEFT",
  sideOrder: "BY_SERIES",
  sideRecoverySeconds: 5,
  beep: 2,
  countdown: 3,
  end: 4,
});
const FAILURE_VARIABLE_JSON = v1(variable([null, 10], [null, 20], [null, 30]), { mode: "TO_FAILURE" });
const DURATION_VARIABLE_JSON = v1(variable([30, 10], [45, 20], [60, 0]), {
  sideMode: "LEFT_RIGHT",
  sideRecoverySeconds: 10,
  beep: 5,
  countdown: 5,
  end: 3,
});
const REPETITIONS_UNIFORM_JSON = v1(uniform(4, 12, 60), { mode: "REPETITIONS", sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES", beep: 3 });
const DURATION_5999_JSON = v1(uniform(1, 5999, 0));
const REPETITIONS_150_JSON = v1(uniform(3, 150, 10), { mode: "REPETITIONS" });
const BEEP_11_JSON = v1(uniform(3, 12, 10), { mode: "REPETITIONS", beep: 11 });

/** Médias : photo et vidéo à métadonnées PRE-3, photo antérieure à 009 (métadonnées NULL). */
const ASSETS: readonly { readonly id: string; readonly kind: "PHOTO" | "VIDEO" | null }[] = [
  { id: "asset-p1", kind: "PHOTO" },
  { id: "asset-p2", kind: null },
  { id: "asset-v1", kind: "VIDEO" },
  { id: "asset-shared", kind: "PHOTO" },
];

const SESSIONS: readonly SessionFixture[] = [
  { id: "session-a", name: "Haut du corps", tourRepeat: 3 },
  { id: "session-b", name: "Bas du corps", tourRepeat: 2 },
  { id: "session-c", name: "Ancienne séance", tourRepeat: 1, archived: true },
];

const DEFINITIONS: readonly DefinitionFixture[] = [
  // Ancien mode À l'échec : JSON v1 identiques (bilatéral, Bip, CR, Fin), JSON v1 variables, scalaires seuls.
  {
    id: "def-fail-uniform",
    name: "Tractions",
    description: "Prise large",
    category: "renforcement",
    mode: "TO_FAILURE",
    series: 3,
    pause: 10,
    sideMode: "RIGHT_LEFT",
    sideRecovery: 5,
    json: FAILURE_UNIFORM_JSON,
    zones: ["dos", "bras"],
    media: ["asset-p2", "asset-p1"],
  },
  { id: "def-fail-variable", name: "Pompes", category: "renforcement", mode: "TO_FAILURE", series: 3, pause: 10, json: FAILURE_VARIABLE_JSON, zones: ["epaules"] },
  { id: "def-fail-scalars", name: "Dips", category: "cat-custom", mode: "TO_FAILURE", series: 4, pause: 15, zones: ["zone-custom"] },
  // Durée variables bilatéral, Bip, plusieurs Zones et trois Médias ordonnés, dont un partagé avec une Copie.
  {
    id: "def-duration-variable",
    name: "Fentes sautées",
    description: "Buste droit",
    category: "cardio",
    mode: "DURATION",
    duration: 30,
    series: 3,
    pause: 10,
    sideMode: "LEFT_RIGHT",
    sideRecovery: 10,
    json: DURATION_VARIABLE_JSON,
    zones: ["cuisses", "jambes", "zone-custom"],
    media: ["asset-shared", "asset-v1", "asset-p1"],
  },
  {
    id: "def-reps-uniform",
    name: "Squats",
    category: "renforcement",
    mode: "REPETITIONS",
    repetitions: 12,
    series: 4,
    pause: 60,
    sideMode: "RIGHT_LEFT",
    json: REPETITIONS_UNIFORM_JSON,
    zones: ["cuisses", "jambes"],
    media: ["asset-v1", "asset-shared"],
  },
  // Données anciennes sans JSON : ni Bip ni Régime explicite.
  { id: "def-legacy-duration", name: "Gainage", category: "cardio", mode: "DURATION", duration: 45, series: 3, pause: 30 },
  { id: "def-legacy-reps", name: "Mollets", category: "cat-custom", mode: "REPETITIONS", repetitions: 10, series: 2, pause: 20, sideMode: "RIGHT_LEFT", sideRecovery: 8 },
  // Répétitions sans nombre.
  { id: "def-reps-no-number", name: "Burpees", category: "cardio", mode: "REPETITIONS", repetitions: null, series: 3, pause: 10 },
  // Valeurs positives hors bornes ou hors de l'ancien pas de 5 s (7 s, admise depuis Q36), conservées.
  { id: "def-duration-7", name: "Sprint", category: "cardio", mode: "DURATION", duration: 7, series: 3, pause: 10 },
  { id: "def-duration-5999", name: "Marche", category: "cardio", mode: "DURATION", duration: 5999, series: 1, pause: 0, json: DURATION_5999_JSON },
  { id: "def-reps-150", name: "Corde", category: "cardio", mode: "REPETITIONS", repetitions: 150, series: 3, pause: 10, json: REPETITIONS_150_JSON },
  { id: "def-beep-11", name: "Rameur", category: "cardio", mode: "REPETITIONS", repetitions: 12, series: 3, pause: 10, json: BEEP_11_JSON },
];

const COPIES: readonly CopyFixture[] = [
  // Séance A : avant, Circuit (IN_TOUR) de trois occurrences, après ; Récupérations.
  { id: "a-before", session: "session-a", zone: "BEFORE_TOUR", position: 0, name: "Échauffement", mode: "DURATION", duration: 45, series: 2, pause: 15, recovery: 30, category: "cardio", zones: ["cou"] },
  {
    id: "a-tour-0",
    session: "session-a",
    zone: "IN_TOUR",
    position: 0,
    name: "Tractions",
    instruction: "Prise large",
    mode: "TO_FAILURE",
    series: 3,
    pause: 10,
    sideMode: "RIGHT_LEFT",
    recovery: 60,
    category: "renforcement",
    json: FAILURE_UNIFORM_JSON,
    zones: ["dos", "bras"],
    media: ["asset-shared", "asset-p2"],
  },
  {
    id: "a-tour-1",
    session: "session-a",
    zone: "IN_TOUR",
    position: 1,
    name: "Fentes sautées",
    mode: "DURATION",
    duration: 30,
    series: 3,
    pause: 10,
    sideMode: "LEFT_RIGHT",
    recovery: 45,
    category: "cardio",
    json: DURATION_VARIABLE_JSON,
    zones: ["cuisses"],
    media: ["asset-v1"],
  },
  { id: "a-tour-2", session: "session-a", zone: "IN_TOUR", position: 2, name: "Squats", mode: "REPETITIONS", repetitions: 12, series: 4, pause: 60, sideMode: "RIGHT_LEFT", json: REPETITIONS_UNIFORM_JSON },
  // Ancienne copie sans Catégorie (antérieure à 009).
  { id: "a-after", session: "session-a", zone: "AFTER_TOUR", position: 0, name: "Retour au calme", mode: "REPETITIONS", repetitions: 15, series: 3, pause: 30, category: null },
  // Séance B : ancien mode À l'échec en scalaires seuls, valeurs hors bornes.
  { id: "b-tour-0", session: "session-b", zone: "IN_TOUR", position: 0, name: "Dips", mode: "TO_FAILURE", series: 3, pause: 20, recovery: 20 },
  { id: "b-tour-1", session: "session-b", zone: "IN_TOUR", position: 1, name: "Marche", mode: "DURATION", duration: 5999, series: 1, pause: 0, json: DURATION_5999_JSON },
  { id: "b-tour-2", session: "session-b", zone: "IN_TOUR", position: 2, name: "Corde", mode: "REPETITIONS", repetitions: 150, series: 3, pause: 10, json: REPETITIONS_150_JSON },
  { id: "b-tour-3", session: "session-b", zone: "IN_TOUR", position: 3, name: "Rameur", mode: "REPETITIONS", repetitions: 12, series: 3, pause: 10, json: BEEP_11_JSON },
  { id: "b-tour-4", session: "session-b", zone: "IN_TOUR", position: 4, name: "Sprint", mode: "DURATION", duration: 7, series: 3, pause: 10 },
  // Séance C (archivée) : ancien mode À l'échec en JSON v1 variables.
  { id: "c-tour-0", session: "session-c", zone: "IN_TOUR", position: 0, name: "Pompes", mode: "TO_FAILURE", series: 3, pause: 10, category: "renforcement", json: FAILURE_VARIABLE_JSON, media: ["asset-p1"] },
];

/** Variante de l'AC3 : 2 illisibles de structure + 2 illisibles selon Q28. */
const UNREADABLE_DEFINITIONS: readonly DefinitionFixture[] = [
  {
    id: "def-bad-json",
    name: "Gainage latéral",
    category: "renforcement",
    mode: "DURATION",
    duration: 30,
    series: 3,
    pause: 10,
    json: "{not json",
    zones: ["dos", "zone-custom"],
    media: ["asset-shared", "asset-only-unreadable"],
  },
  { id: "def-bad-pause", name: "Planche", category: "cardio", mode: "DURATION", duration: 30, series: 2, pause: 10, json: v1(variable([30, 10], [30, -5])), zones: ["dos"] },
];
const UNREADABLE_COPIES: readonly CopyFixture[] = [
  // Au milieu du Circuit de la Séance A (les Copies lisibles suivantes sont décalées d'une position).
  { id: "a-bad-version", session: "session-a", zone: "IN_TOUR", position: 1, name: "Gainage latéral", mode: "DURATION", duration: 30, series: 3, pause: 10, recovery: 25, json: v1(uniform(3, 30, 10)).replace('"version":1', '"version":7'), zones: ["bras"], media: ["asset-shared"] },
  // Unique occurrence de la Séance D : la Séance est vidée (P39).
  { id: "d-bad-beep", session: "session-d", zone: "IN_TOUR", position: 0, name: "Rameur", mode: "REPETITIONS", repetitions: 12, series: 3, pause: 10, json: v1(uniform(3, 12, 10), { mode: "REPETITIONS", beep: 2.5 }), zones: ["cou"], media: ["asset-p1"] },
];
const UNREADABLE_IDS = ["def-bad-json", "def-bad-pause", "a-bad-version", "d-bad-beep"];
/** Copies placées après `a-bad-version` dans le Circuit de la Séance A : seules renumérotées par la variante. */
const RENUMBERED_COPIES = ["a-tour-1", "a-tour-2"];

async function insertSession(database: Database, session: SessionFixture): Promise<void> {
  const suffix = session.id.replace("session-", "");
  await database.runAsync(
    `INSERT INTO sessions (id, owner_id, name, status, initial_countdown_seconds, final_phase_seconds, created_at, updated_at, last_executed_at, archived_at)
     SELECT ?, id, ?, ?, 10, 5, '2026-01-04T00:00:00.000Z', '2026-01-05T00:00:00.000Z', ?, ? FROM users WHERE singleton_key = 1`,
    [
      session.id,
      session.name,
      session.archived ? "ARCHIVED" : "ACTIVE",
      session.archived ? "2026-02-01T09:00:00.000Z" : null,
      session.archived ? "2026-03-01T00:00:00.000Z" : null,
    ],
  );
  await database.runAsync("INSERT INTO cycles (id, session_id, position, repeat_count) VALUES (?, ?, 1, 1)", [`cycle-${suffix}`, session.id]);
  await database.runAsync("INSERT INTO tours (id, cycle_id, session_id, position, repeat_count) VALUES (?, ?, ?, 1, ?)", [
    `tour-${suffix}`,
    `cycle-${suffix}`,
    session.id,
    session.tourRepeat,
  ]);
}

async function insertDefinition(database: Database, definition: DefinitionFixture): Promise<void> {
  await database.runAsync(
    `INSERT INTO activity_definitions (
       id, name, description, execution_mode, duration_seconds, repetition_count, series_count, pause_seconds,
       side_mode, created_at, updated_at, category_id, side_recovery_seconds, execution_parameters
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '2026-01-02T00:00:00.000Z', '2026-01-03T00:00:00.000Z', ?, ?, ?)`,
    [
      definition.id,
      definition.name,
      definition.description ?? null,
      definition.mode,
      definition.duration ?? null,
      definition.repetitions ?? null,
      definition.series,
      definition.pause,
      definition.sideMode ?? "UNILATERAL",
      definition.category,
      definition.sideRecovery ?? 0,
      definition.json ?? null,
    ],
  );
  for (const zone of definition.zones ?? []) {
    await database.runAsync("INSERT INTO activity_definition_body_zones (activity_definition_id, body_zone_id) VALUES (?, ?)", [definition.id, zone]);
  }
  for (const [position, asset] of (definition.media ?? []).entries()) {
    await database.runAsync("INSERT INTO activity_media (id, activity_definition_id, asset_id, position) VALUES (?, ?, ?, ?)", [
      `dm-${definition.id}-${position}`,
      definition.id,
      asset,
      position,
    ]);
  }
}

async function insertCopy(database: Database, copy: CopyFixture): Promise<void> {
  const suffix = copy.session.replace("session-", "");
  await database.runAsync(
    `INSERT INTO activities (
       id, session_id, cycle_id, tour_id, type, structural_position, position, name, execution_mode,
       duration_seconds, repetition_count, series_count, pause_seconds, post_activity_recovery_seconds,
       instruction, created_at, updated_at, side_mode, execution_parameters, category_id
     ) VALUES (?, ?, ?, ?, 'EXERCISE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '2026-01-06T00:00:00.000Z', '2026-01-07T00:00:00.000Z', ?, ?, ?)`,
    [
      copy.id,
      copy.session,
      `cycle-${suffix}`,
      copy.zone === "IN_TOUR" ? `tour-${suffix}` : null,
      copy.zone,
      copy.position,
      copy.name,
      copy.mode,
      copy.duration ?? null,
      copy.repetitions ?? null,
      copy.series,
      copy.pause,
      copy.recovery ?? 0,
      copy.instruction ?? null,
      copy.sideMode ?? "UNILATERAL",
      copy.json ?? null,
      copy.category === undefined ? null : copy.category,
    ],
  );
  for (const zone of copy.zones ?? []) {
    await database.runAsync("INSERT INTO activity_body_zones (activity_id, body_zone_id) VALUES (?, ?)", [copy.id, zone]);
  }
  for (const [position, asset] of (copy.media ?? []).entries()) {
    await database.runAsync("INSERT INTO session_activity_media (id, activity_id, asset_id, position) VALUES (?, ?, ?, ?)", [
      `sm-${copy.id}-${position}`,
      copy.id,
      asset,
      position,
    ]);
  }
}

/**
 * Fixture v9 complète (AC1). `withUnreadable` : variante de l'AC3 — les
 * illisibles s'intercalent parmi les lisibles (Circuit de la Séance A) et une
 * Séance D n'a qu'une occurrence, illisible.
 */
async function populateVersion9(database: Database, withUnreadable = false): Promise<void> {
  await buildVersion9(database);
  // Catégorie et Zone créées par l'utilisateur, à côté des référentiels prédéfinis.
  await database.runAsync(
    "INSERT INTO categories (id, name, canonical_key, is_predefined, display_order, created_at, color, is_active) VALUES ('cat-custom', 'Escalade', 'escalade', 0, NULL, '2026-01-01T00:00:00.000Z', '#2E9B62', 1)",
  );
  await database.runAsync(
    "INSERT INTO body_zones (id, name, is_active, created_at, canonical_key) VALUES ('zone-custom', 'Avant-bras', 1, '2026-01-01T00:00:00.000Z', 'avant-bras')",
  );
  const assets = withUnreadable ? [...ASSETS, { id: "asset-only-unreadable", kind: "PHOTO" as const }] : ASSETS;
  for (const asset of assets) {
    await database.runAsync(
      `INSERT INTO media_assets (id, uri, created_at, kind, mime_type, file_name, size_bytes, duration_ms, width, height)
       VALUES (?, ?, '2026-01-01T00:00:00.000Z', ?, ?, ?, ?, ?, ?, ?)`,
      asset.kind === null
        ? [asset.id, `file:///kodjo-media/${asset.id}.jpg`, null, null, null, null, null, null, null]
        : [
            asset.id,
            `file:///kodjo-media/${asset.id}`,
            asset.kind,
            asset.kind === "PHOTO" ? "image/jpeg" : "video/mp4",
            `${asset.id}.${asset.kind === "PHOTO" ? "jpg" : "mp4"}`,
            2048,
            asset.kind === "VIDEO" ? 4000 : null,
            1080,
            1920,
          ],
    );
  }
  for (const session of withUnreadable ? [...SESSIONS, { id: "session-d", name: "Séance vidée", tourRepeat: 2 }] : SESSIONS) {
    await insertSession(database, session);
  }
  await database.runAsync(
    "INSERT INTO session_stop_points (id, session_id, scope, position) VALUES ('stop-a-1', 'session-a', 'IN_TOUR', 1)",
  );
  for (const definition of withUnreadable ? [...DEFINITIONS, ...UNREADABLE_DEFINITIONS] : DEFINITIONS) {
    await insertDefinition(database, definition);
  }
  const copies = withUnreadable
    ? [
        ...COPIES.map((copy) =>
          copy.session === "session-a" && copy.zone === "IN_TOUR" && copy.position >= 1 ? { ...copy, position: copy.position + 1 } : copy,
        ),
        ...UNREADABLE_COPIES,
      ]
    : COPIES;
  for (const copy of copies) {
    await insertCopy(database, copy);
  }
}

// --- Relevés : comptes, identifiants, contenu ----------------------------------

async function userTables(database: Database): Promise<string[]> {
  const rows = await database.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  return rows.map((row) => row.name);
}

type TableInventory = { readonly count: number; readonly keys: readonly string[] };

/** Relevé consigné avant et après migration : compte et liste des identifiants (clé primaire) de chaque table. */
async function inventory(database: Database): Promise<Record<string, TableInventory>> {
  const result: Record<string, TableInventory> = {};
  for (const table of await userTables(database)) {
    const rows = await database.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table}`);
    result[table] = { count: rows.length, keys: keysOf(await primaryKey(database, table), rows) };
  }
  return result;
}

async function primaryKey(database: Database, table: string): Promise<string[]> {
  return (await database.getAllAsync<{ name: string; pk: number }>("SELECT name, pk FROM pragma_table_info(?) ORDER BY pk", [table]))
    .filter((column) => column.pk > 0)
    .map((column) => column.name);
}

/** Identifiants triés d'un ensemble de lignes : clé primaire, sinon la ligne entière. */
function keysOf(pk: readonly string[], rows: readonly Record<string, unknown>[]): string[] {
  return rows.map((row) => (pk.length > 0 ? pk.map((name) => String(row[name])).join("|") : JSON.stringify(row))).sort();
}

/** État complet : toutes les tables (ordre de `rowid`), schéma et version. */
async function dump(database: Database): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const table of await userTables(database)) {
    result[table] = await database.getAllAsync(`SELECT * FROM ${table} ORDER BY rowid`);
  }
  result.schema = await database.getAllAsync("SELECT type, name, tbl_name, sql FROM sqlite_master ORDER BY type, name");
  result.version = await database.getFirstAsync("PRAGMA user_version");
  return result;
}

async function version(database: Database): Promise<number> {
  return (await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version ?? -1;
}

type Row = Record<string, unknown>;

/** Colonnes portées par la conversion (JSON v2 et projection scalaire) ; toutes les autres doivent être identiques. */
const CONVERTED_COLUMNS = [
  "execution_parameters",
  "execution_mode",
  "duration_seconds",
  "repetition_count",
  "series_count",
  "pause_seconds",
  "side_mode",
  "side_recovery_seconds",
];

function withoutConverted(row: Row): Row {
  return Object.fromEntries(Object.entries(row).filter(([key]) => !CONVERTED_COLUMNS.includes(key)));
}

/** Entrée historique d'une ligne Exercice : son JSON v1, sinon ses scalaires. */
function legacyInput(row: Row, definition: boolean): string | LegacyExecutionScalars {
  if (typeof row.execution_parameters === "string") {
    return row.execution_parameters;
  }
  return {
    executionMode: row.execution_mode as LegacyExecutionScalars["executionMode"],
    durationSeconds: row.duration_seconds as number | null,
    repetitionCount: row.repetition_count as number | null,
    seriesCount: row.series_count as number | null,
    pauseSeconds: row.pause_seconds as number,
    sideMode: row.side_mode as SideMode,
    ...(definition ? { sideRecoverySeconds: row.side_recovery_seconds as number } : {}),
  };
}

async function exerciseRows(database: Database): Promise<{ definitions: Row[]; activities: Row[] }> {
  return {
    definitions: await database.getAllAsync<Row>("SELECT * FROM activity_definitions ORDER BY id"),
    activities: await database.getAllAsync<Row>("SELECT * FROM activities WHERE type = 'EXERCISE' ORDER BY id"),
  };
}

/**
 * Chaque Exercice lisible : Mode et Cibles convertis selon 1.1 (parité
 * `readV2(sortie)` = `readV1(entrée)`, forme v2 octet pour octet, projection
 * unique), tous les autres paramètres et colonnes identiques. Ancien mode
 * À l'échec ⇔ toutes Cibles FAILURE : aucune Cible FAILURE inventée
 * (FR-18-13, FR-18-14), aucun 0 écrit à la place d'une absence.
 */
function expectConverted(before: Row[], after: Row[], definition: boolean): Map<string, ExecutionParameters> {
  const converted = new Map<string, ExecutionParameters>();
  for (const source of before) {
    const id = source.id as string;
    const target = after.find((row) => row.id === id);
    expect({ id, present: target !== undefined }).toEqual({ id, present: true });
    const output = target!.execution_parameters as string;
    const parameters = readV2(output);
    expect({ id, parameters }).toEqual({ id, parameters: readV1(legacyInput(source, definition)) });
    expect(serializeV2(parameters)).toBe(output);
    const projection = projectScalars(parameters);
    expect({ id, mode: target!.execution_mode, duration: target!.duration_seconds, repetitions: target!.repetition_count, series: target!.series_count, pause: target!.pause_seconds, side: target!.side_mode }).toEqual({
      id,
      mode: projection.executionMode,
      duration: projection.durationSeconds,
      repetitions: projection.repetitionCount,
      series: projection.seriesCount,
      pause: projection.pauseSeconds,
      side: projection.sideMode,
    });
    // PRE-6 : la présence de récupération (`migration011`, additive) est hors objet de cette preuve.
    const [targetOthers] = withoutMigration011Columns(definition ? "activity_definitions" : "activities", [target!]) as Row[];
    expect({ id, others: withoutConverted(targetOthers!) }).toEqual({ id, others: withoutConverted(source) });
    expect({ id, allFailure: allTargetsFailure(parameters) }).toEqual({ id, allFailure: source.execution_mode === "TO_FAILURE" });
    expect(output).not.toContain('"value":0');
    converted.set(id, parameters);
  }
  return converted;
}

/** Valeurs explicites attendues (FR-18-10 à FR-18-14) pour les Exercices de la fixture. */
const EXPECTED_PARAMETERS: Readonly<Record<string, ExecutionParameters>> = {
  "def-fail-uniform": allFailureParameters(3, 10, {
    sideMode: "RIGHT_LEFT",
    sideOrder: "BY_SERIES",
    sideRecoverySeconds: 5,
    cadenceBeepIntervalSeconds: 2,
    countdownSeconds: 3,
    endSeconds: 4,
  }),
  "def-fail-variable": variableParameters({ mode: "REPETITIONS", rows: [["FAILURE", 10], ["FAILURE", 20], ["FAILURE", 30]] }),
  "def-fail-scalars": allFailureParameters(4, 15),
  "def-duration-variable": variableParameters({
    mode: "DURATION",
    rows: [[30, 10], [45, 20], [60, 0]],
    sideMode: "LEFT_RIGHT",
    sideRecoverySeconds: 10,
    cadenceBeepIntervalSeconds: 5,
    countdownSeconds: 5,
    endSeconds: 3,
  }),
  "def-reps-uniform": repetitionParameters(12, 4, 60, { sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES", cadenceBeepIntervalSeconds: 3 }),
  "def-legacy-duration": durationParameters(45, 3, 30),
  "def-legacy-reps": repetitionParameters(10, 2, 20, { sideMode: "RIGHT_LEFT", sideRecoverySeconds: 8 }),
  "def-reps-no-number": repetitionParameters("UNSET", 3, 10),
  "def-duration-7": durationParameters(7, 3, 10),
  "def-duration-5999": durationParameters(5999, 1, 0),
  "def-reps-150": repetitionParameters(150, 3, 10),
  "def-beep-11": repetitionParameters(12, 3, 10, { cadenceBeepIntervalSeconds: 11 }),
  "a-before": durationParameters(45, 2, 15),
  "a-tour-2": repetitionParameters(12, 4, 60, { sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES", cadenceBeepIntervalSeconds: 3 }),
  "a-after": repetitionParameters(15, 3, 30),
  "b-tour-0": allFailureParameters(3, 20),
  "b-tour-1": durationParameters(5999, 1, 0),
  "b-tour-2": repetitionParameters(150, 3, 10),
  "b-tour-3": repetitionParameters(12, 3, 10, { cadenceBeepIntervalSeconds: 11 }),
  "b-tour-4": durationParameters(7, 3, 10),
  "c-tour-0": variableParameters({ mode: "REPETITIONS", rows: [["FAILURE", 10], ["FAILURE", 20], ["FAILURE", 30]] }),
};

function expectExplicitValues(converted: Map<string, ExecutionParameters>): void {
  for (const [id, expected] of Object.entries(EXPECTED_PARAMETERS)) {
    expect({ id, parameters: converted.get(id) }).toEqual({ id, parameters: expected });
  }
  // Une Copie porte les paramètres convertis de la même forme que sa Définition.
  expect(converted.get("a-tour-0")).toEqual(EXPECTED_PARAMETERS["def-fail-uniform"]);
  expect(converted.get("a-tour-1")).toEqual(EXPECTED_PARAMETERS["def-duration-variable"]);
}

async function orphanLinks(database: Database): Promise<number> {
  return (
    (await database.getFirstAsync<{ count: number }>(
      `SELECT
         (SELECT COUNT(*) FROM activity_definition_body_zones WHERE activity_definition_id NOT IN (SELECT id FROM activity_definitions))
       + (SELECT COUNT(*) FROM activity_media WHERE activity_definition_id NOT IN (SELECT id FROM activity_definitions))
       + (SELECT COUNT(*) FROM activity_media WHERE asset_id NOT IN (SELECT id FROM media_assets))
       + (SELECT COUNT(*) FROM activity_body_zones WHERE activity_id NOT IN (SELECT id FROM activities))
       + (SELECT COUNT(*) FROM session_activity_media WHERE activity_id NOT IN (SELECT id FROM activities))
       + (SELECT COUNT(*) FROM session_activity_media WHERE asset_id NOT IN (SELECT id FROM media_assets)) AS count`,
    ))?.count ?? -1
  );
}

/**
 * Chemin réel du démarrage : pragmas `STANDARD_PRAGMAS` (dont
 * `foreign_keys = ON` et `journal_mode = WAL`), puis `migrateDatabase`.
 * L'avis est daté par l'horloge réelle, comme sur l'appareil. PRE-7 (A1.2) :
 * ces preuves portent sur `migration010` ; la chaîne est arrêtée à la version
 * 11, avant la transition de `migration012` (la chaîne complète par
 * `initializeDatabase` est prouvée par « PRE-7 A1.2 — chaîne v9 → 12 »).
 */
async function migrateLikeStartup(database: Database): Promise<void> {
  for (const pragma of STANDARD_PRAGMAS) {
    await database.execAsync(pragma);
  }
  await migrateDatabase(database, undefined, 11);
  expect(await database.getFirstAsync("PRAGMA foreign_keys")).toEqual({ foreign_keys: 1 });
  expect(await database.getFirstAsync("PRAGMA journal_mode")).toEqual({ journal_mode: "wal" });
}

/**
 * Tests seulement — enveloppe une base et CHAQUE poignée de transaction
 * (motif de `failOnWrite`) : consigne le SQL des écritures réellement
 * exécutées et laisse `beforeRead` agir juste avant une lecture.
 */
function instrument(
  inner: Database,
  beforeRead: (source: string, handle: Database) => Promise<void> = async () => {},
): { readonly database: Database; readonly writes: string[] } {
  const writes: string[] = [];
  const wrap = (handle: Database): Database => ({
    execAsync: (source) => handle.execAsync(source),
    runAsync: async (source, parameters) => {
      const result = await handle.runAsync(source, parameters);
      writes.push(source);
      return result;
    },
    getFirstAsync: (source, parameters) => handle.getFirstAsync(source, parameters),
    getAllAsync: async (source, parameters) => {
      await beforeRead(source, handle);
      return handle.getAllAsync(source, parameters);
    },
    withExclusiveTransactionAsync: (task) => handle.withExclusiveTransactionAsync(async (transaction) => task(wrap(transaction))),
  });
  return { database: wrap(inner), writes };
}

const isRename = (source: string) => /^ALTER TABLE activities_v10 RENAME TO activities$/.test(source.trim());

// --- Tests -------------------------------------------------------------------------

describe("PRE-4 story 1.4 — preuve de préservation sur une base v9 fichier réelle (node:sqlite, AD-10)", () => {
  it("PRE4-1.4/AC1 — jeu de données v9 complet ; comptes et identifiants consignés avant migration", async () => {
    let database = open();
    await populateVersion9(database);
    database = reopen(database);

    expect(await version(database)).toBe(9);
    const has = async (sql: string) => ((await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM (${sql})`))?.count ?? 0) > 0;
    // Ancien mode À l'échec : Définitions et Copies, JSON v1 et scalaires seuls, identiques et variables.
    expect(await has("SELECT 1 FROM activity_definitions WHERE execution_mode = 'TO_FAILURE' AND execution_parameters LIKE '%\"UNIFORM\"%'")).toBe(true);
    expect(await has("SELECT 1 FROM activity_definitions WHERE execution_mode = 'TO_FAILURE' AND execution_parameters LIKE '%\"VARIABLE\"%'")).toBe(true);
    expect(await has("SELECT 1 FROM activity_definitions WHERE execution_mode = 'TO_FAILURE' AND execution_parameters IS NULL")).toBe(true);
    expect(await has("SELECT 1 FROM activities WHERE execution_mode = 'TO_FAILURE' AND execution_parameters LIKE '%\"UNIFORM\"%'")).toBe(true);
    expect(await has("SELECT 1 FROM activities WHERE execution_mode = 'TO_FAILURE' AND execution_parameters LIKE '%\"VARIABLE\"%'")).toBe(true);
    expect(await has("SELECT 1 FROM activities WHERE execution_mode = 'TO_FAILURE' AND execution_parameters IS NULL")).toBe(true);
    // Durée et Répétitions, bilatéraux, Bip, Pauses, Catégorie, plusieurs Zones, plusieurs Médias ordonnés.
    for (const mode of ["DURATION", "REPETITIONS"]) {
      expect(await has(`SELECT 1 FROM activity_definitions WHERE execution_mode = '${mode}' AND side_mode <> 'UNILATERAL' AND pause_seconds > 0`)).toBe(true);
      expect(await has(`SELECT 1 FROM activities WHERE execution_mode = '${mode}' AND side_mode <> 'UNILATERAL'`)).toBe(true);
    }
    expect(await has("SELECT 1 FROM activity_definitions WHERE execution_parameters LIKE '%\"cadenceBeepIntervalSeconds\":5%'")).toBe(true);
    expect(
      await has(
        `SELECT d.id FROM activity_definitions AS d
         WHERE d.category_id IS NOT NULL
           AND (SELECT COUNT(*) FROM activity_definition_body_zones WHERE activity_definition_id = d.id) >= 2
           AND (SELECT COUNT(*) FROM activity_media WHERE activity_definition_id = d.id) >= 2`,
      ),
    ).toBe(true);
    expect(await database.getAllAsync("SELECT asset_id, position FROM activity_media WHERE activity_definition_id = 'def-duration-variable' ORDER BY position")).toEqual([
      { asset_id: "asset-shared", position: 0 },
      { asset_id: "asset-v1", position: 1 },
      { asset_id: "asset-p1", position: 2 },
    ]);
    // Médias partagés entre une Définition et une Copie.
    expect(await has("SELECT 1 FROM activity_media AS dm JOIN session_activity_media AS sm ON sm.asset_id = dm.asset_id")).toBe(true);
    // Données anciennes sans Bip ni Régime explicite (aucun JSON).
    expect(await has("SELECT 1 FROM activity_definitions WHERE execution_parameters IS NULL AND execution_mode = 'DURATION'")).toBe(true);
    expect(await has("SELECT 1 FROM activities WHERE execution_parameters IS NULL AND execution_mode = 'REPETITIONS'")).toBe(true);
    // Valeurs positives conservées : Durée 7 s (hors de l'ancien pas de 5 s, admise depuis Q36) et 5999 s, Répétitions 150, Bip 11.
    expect(await has("SELECT 1 FROM activity_definitions WHERE duration_seconds = 7")).toBe(true);
    expect(await has("SELECT 1 FROM activity_definitions WHERE execution_parameters LIKE '%\"target\":5999%'")).toBe(true);
    expect(await has("SELECT 1 FROM activity_definitions WHERE execution_parameters LIKE '%\"target\":150%'")).toBe(true);
    expect(await has("SELECT 1 FROM activity_definitions WHERE execution_parameters LIKE '%\"cadenceBeepIntervalSeconds\":11%'")).toBe(true);
    // Définition Répétitions sans nombre.
    expect(await has("SELECT 1 FROM activity_definitions WHERE execution_mode = 'REPETITIONS' AND repetition_count IS NULL AND execution_parameters IS NULL")).toBe(true);
    // Récupérations, zone IN_TOUR, plusieurs Séances (dont une archivée).
    expect(await has("SELECT 1 FROM activities WHERE post_activity_recovery_seconds > 0")).toBe(true);
    expect(await has("SELECT 1 FROM activities WHERE structural_position = 'IN_TOUR'")).toBe(true);
    expect(await has("SELECT 1 FROM activities WHERE structural_position = 'BEFORE_TOUR'")).toBe(true);
    expect(await has("SELECT 1 FROM activities WHERE structural_position = 'AFTER_TOUR'")).toBe(true);
    expect(await has("SELECT 1 FROM sessions WHERE status = 'ARCHIVED'")).toBe(true);

    // Relevé consigné : comptes et identifiants des tables de données.
    const before = await inventory(database);
    expect(Object.fromEntries(
      ["sessions", "cycles", "tours", "activity_definitions", "activities", "activity_definition_body_zones", "activity_body_zones", "media_assets", "activity_media", "session_activity_media", "session_stop_points"].map(
        (table) => [table, before[table]!.count],
      ),
    )).toEqual({
      sessions: 3,
      cycles: 3,
      tours: 3,
      activity_definitions: 12,
      activities: 11,
      activity_definition_body_zones: 9,
      activity_body_zones: 4,
      media_assets: 4,
      activity_media: 7,
      session_activity_media: 4,
      session_stop_points: 1,
    });
    expect(before.activity_definitions!.keys).toEqual(DEFINITIONS.map((item) => item.id).sort());
    expect(before.activities!.keys).toEqual(COPIES.map((item) => item.id).sort());
    expect(before.sessions!.keys).toEqual(["session-a", "session-b", "session-c"]);
    expect(before.media_assets!.keys).toEqual(["asset-p1", "asset-p2", "asset-shared", "asset-v1"]);
    expect(before.categories!.keys).toContain("cat-custom");
    expect(before.body_zones!.keys).toContain("zone-custom");
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  });

  it("PRE4-1.4/AC2 — migration du jeu complet relue après réouverture : tout le lisible conservé, identifiants compris ; aucun avis", async () => {
    let database = open();
    await populateVersion9(database);
    const before = await inventory(database);
    const dumpBefore = await dump(database);
    const rowsBefore = await exerciseRows(database);

    await migrateLikeStartup(database);
    database = reopen(database);

    expect(await version(database)).toBe(11);
    const after = await inventory(database);
    // Comptes et identifiants égaux pour chaque table de la v9 ; seule migration_notices s'ajoute, vide.
    expect(Object.keys(after).sort()).toEqual([...Object.keys(before), "migration_notices"].sort());
    for (const table of Object.keys(before)) {
      expect({ table, inventory: after[table] }).toEqual({ table, inventory: before[table] });
    }
    expect(after.migration_notices).toEqual({ count: 0, keys: [] });
    // Tables hors Exercice : contenu identique ligne pour ligne (Médias, liens et ordre compris : FR-21-57).
    const dumpAfter = await dump(database);
    for (const table of Object.keys(before).filter((name) => name !== "activity_definitions" && name !== "activities")) {
      // PRE-6 : colonnes additives de `migration011` hors objet de cette preuve.
      expect({ table, rows: withoutMigration011Columns(table, dumpAfter[table]) }).toEqual({ table, rows: dumpBefore[table] });
    }
    // Chaque Exercice : Mode et Cibles convertis selon 1.1, tout le reste identique.
    const rowsAfter = await exerciseRows(database);
    const converted = new Map([
      ...expectConverted(rowsBefore.definitions, rowsAfter.definitions, true),
      ...expectConverted(rowsBefore.activities, rowsAfter.activities, false),
    ]);
    expectExplicitValues(converted);
    expect(
      await database.getFirstAsync<{ count: number }>(
        "SELECT (SELECT COUNT(*) FROM activity_definitions WHERE execution_mode = 'TO_FAILURE') + (SELECT COUNT(*) FROM activities WHERE execution_mode = 'TO_FAILURE') AS count",
      ),
    ).toEqual({ count: 0 });
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);

    // Relecture de la base rouverte. PRE-7 (A1.2) : les repositories courants lisent le schéma
    // 012 ; la base v11 est relue en lignes brutes, paramètres par le lecteur v2/v3 du domaine.
    expect((await database.getAllAsync<{ id: string }>("SELECT id FROM activity_definitions")).map((row) => row.id).sort()).toEqual(
      DEFINITIONS.map((item) => item.id).sort(),
    );
    const failureJson = (await database.getFirstAsync<{ execution_parameters: string }>(
      "SELECT execution_parameters FROM activity_definitions WHERE id = 'def-fail-uniform'",
    ))!.execution_parameters;
    expect(readExecutionParameters(failureJson)).toEqual(EXPECTED_PARAMETERS["def-fail-uniform"]);
    expect(
      await database.getAllAsync("SELECT asset_id FROM activity_media WHERE activity_definition_id = 'def-fail-uniform' ORDER BY position"),
    ).toEqual([{ asset_id: "asset-p2" }, { asset_id: "asset-p1" }]);
    expect(
      (await database.getAllAsync<{ body_zone_id: string }>(
        "SELECT body_zone_id FROM activity_definition_body_zones WHERE activity_definition_id = 'def-fail-uniform'",
      ))
        .map((row) => row.body_zone_id)
        .sort(),
    ).toEqual(["bras", "dos"]);
    expect(
      await database.getAllAsync("SELECT id FROM activities WHERE session_id = 'session-a' AND structural_position = 'IN_TOUR' ORDER BY position"),
    ).toEqual([{ id: "a-tour-0" }, { id: "a-tour-1" }, { id: "a-tour-2" }]);
    expect(await database.getAllAsync("SELECT asset_id FROM session_activity_media WHERE activity_id = 'a-tour-0' ORDER BY position")).toEqual([
      { asset_id: "asset-shared" },
      { asset_id: "asset-p2" },
    ]);
    for (const row of await database.getAllAsync<{ execution_parameters: string }>(
      "SELECT execution_parameters FROM activities WHERE type = 'EXERCISE'",
    )) {
      expect(readExecutionParameters(row.execution_parameters).mode).not.toBe("TO_FAILURE");
    }
    expect(await database.getAllAsync("SELECT id FROM sessions WHERE status = 'ACTIVE' ORDER BY id")).toEqual([
      { id: "session-a" },
      { id: "session-b" },
    ]);
    expect(await database.getFirstAsync("SELECT status FROM sessions WHERE id = 'session-c'")).toEqual({ status: "ARCHIVED" });
    expect(await new SqliteMigrationNoticeRepository(database).findUnacknowledged()).toBeNull();
  });

  it("PRE4-1.4/AC3 — variante avec 4 illisibles : comptes = avant moins les Exercices écartés et leurs liens ; aucun orphelin ; Séances, référentiels et Médias conservés ; count = 4", async () => {
    let database = open();
    await populateVersion9(database, true);
    const before = await inventory(database);
    const dumpBefore = await dump(database);
    const rowsBefore = await exerciseRows(database);

    await migrateLikeStartup(database);
    database = reopen(database);

    expect(await version(database)).toBe(11);
    const after = await inventory(database);
    const dumpAfter = await dump(database);
    // Comptes ET identifiants attendus : avant, moins exactement les Exercices écartés et leurs liens.
    const droppedLink = (table: string, row: Row): boolean => {
      switch (table) {
        case "activity_definition_body_zones":
        case "activity_media":
          return UNREADABLE_IDS.includes(row.activity_definition_id as string);
        case "activity_body_zones":
        case "session_activity_media":
          return UNREADABLE_IDS.includes(row.activity_id as string);
        case "activity_definitions":
        case "activities":
          return UNREADABLE_IDS.includes(row.id as string);
        default:
          return false;
      }
    };
    for (const table of Object.keys(before)) {
      const remaining = (dumpBefore[table] as Row[]).filter((row) => !droppedLink(table, row));
      const expected = { count: remaining.length, keys: keysOf(await primaryKey(database, table), remaining) };
      expect({ table, inventory: after[table] }).toEqual({ table, inventory: expected });
    }
    // Les liens des Exercices lisibles sont tous présents, ceux des écartés tous absents.
    for (const table of ["activity_definition_body_zones", "activity_media", "activity_body_zones", "session_activity_media"]) {
      expect(before[table]!.count - after[table]!.count).toBe((dumpBefore[table] as Row[]).filter((row) => droppedLink(table, row)).length);
      expect((dumpBefore[table] as Row[]).some((row) => droppedLink(table, row))).toBe(true);
    }
    expect(before.activity_definitions!.count - after.activity_definitions!.count).toBe(2);
    expect(before.activities!.count - after.activities!.count).toBe(2);
    expect(after.activity_definitions!.keys).toEqual(DEFINITIONS.map((item) => item.id).sort());
    expect(after.activities!.keys).toEqual(COPIES.map((item) => item.id).sort());
    // Catégories, Zones, media_assets (y compris l'asset dont seul un illisible se servait) et toutes les Séances présents, inchangés.
    for (const table of ["categories", "body_zones", "media_assets", "sessions", "cycles", "tours", "session_stop_points", "users", "profiles", "labels"]) {
      // PRE-6 : colonnes additives de `migration011` hors objet de cette preuve.
      expect({ table, rows: withoutMigration011Columns(table, dumpAfter[table]) }).toEqual({ table, rows: dumpBefore[table] });
    }
    expect(after.media_assets!.keys).toContain("asset-only-unreadable");
    expect(after.sessions!.keys).toEqual(["session-a", "session-b", "session-c", "session-d"]);
    // Séance D vidée (P39) ; Circuit de la Séance A renuméroté de façon contiguë, même ordre, Récupérations conservées.
    expect(await database.getAllAsync("SELECT id FROM activities WHERE session_id = 'session-d'")).toEqual([]);
    expect(
      await database.getAllAsync("SELECT id, position, post_activity_recovery_seconds FROM activities WHERE session_id = 'session-a' AND structural_position = 'IN_TOUR' ORDER BY position"),
    ).toEqual([
      { id: "a-tour-0", position: 0, post_activity_recovery_seconds: 60 },
      { id: "a-tour-1", position: 1, post_activity_recovery_seconds: 45 },
      { id: "a-tour-2", position: 2, post_activity_recovery_seconds: 0 },
    ]);
    // Aucun lien orphelin ; le Média partagé reste lié aux Exercices lisibles, dans le même ordre.
    expect(await orphanLinks(database)).toBe(0);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
    expect(await database.getAllAsync("SELECT asset_id, position FROM activity_media WHERE activity_definition_id = 'def-duration-variable' ORDER BY position")).toEqual([
      { asset_id: "asset-shared", position: 0 },
      { asset_id: "asset-v1", position: 1 },
      { asset_id: "asset-p1", position: 2 },
    ]);
    expect(await database.getAllAsync("SELECT asset_id, position FROM session_activity_media WHERE activity_id = 'a-tour-0' ORDER BY position")).toEqual([
      { asset_id: "asset-shared", position: 0 },
      { asset_id: "asset-p2", position: 1 },
    ]);
    // Lisibles convertis selon 1.1 ; valeurs positives hors bornes de l'AC1 conservées.
    const rowsAfter = await exerciseRows(database);
    const readable = (rows: Row[]) => rows.filter((row) => !UNREADABLE_IDS.includes(row.id as string));
    const converted = new Map([
      ...expectConverted(readable(rowsBefore.definitions), rowsAfter.definitions, true),
      ...expectConverted(
        readable(rowsBefore.activities).map((row) =>
          // Seules les Copies qui suivent l'illisible du Circuit de la Séance A sont
          // renumérotées (position source moins 1) ; comparaison stricte pour les autres.
          RENUMBERED_COPIES.includes(row.id as string) ? { ...row, position: (row.position as number) - 1 } : row,
        ),
        rowsAfter.activities,
        false,
      ),
    ]);
    expectExplicitValues(converted);
    // Avis : 2 illisibles de structure + 2 selon Q28, sans nom ni identifiant.
    const notices = await database.getAllAsync<Row>("SELECT * FROM migration_notices");
    expect(notices).toEqual([
      { id: 1, kind: "UNREADABLE_EXERCISES_DROPPED", count: 4, created_at: expect.any(String), acknowledged_at: null },
    ]);
    expect(new Date(notices[0]!.created_at as string).toISOString()).toBe(notices[0]!.created_at);
    // Médias partagés toujours présents pour l'Exercice lisible (ordre vérifié ci-dessus) ;
    // l'asset dont seul un illisible se servait est conservé. PRE-7 (A1.2) : lignes brutes.
    expect(await database.getFirstAsync("SELECT id FROM media_assets WHERE id = 'asset-only-unreadable'")).toEqual({
      id: "asset-only-unreadable",
    });
    // La Séance vidée garde son en-tête (Cycle, Circuit) sans occurrence.
    expect(
      await database.getFirstAsync(
        "SELECT sessions.id, tours.id AS tour_id FROM sessions JOIN tours ON tours.session_id = sessions.id WHERE sessions.id = 'session-d'",
      ),
    ).toEqual({ id: "session-d", tour_id: expect.any(String) });
  });

  it.each([
    {
      label: "sur l'écriture de l'avis, après toute la reconstruction",
      pattern: /INSERT INTO migration_notices/,
      // Écritures exécutées avant l'échec : la reconstruction (RENAME) et la création de la table de l'avis.
      check: (writes: readonly string[]) => {
        expect(writes.some(isRename)).toBe(true);
        expect(writes[writes.length - 1]).toContain("CREATE TABLE migration_notices");
      },
    },
    {
      label: "au cœur de la reconstruction, sur le RENAME d'activities_v10",
      pattern: /ALTER TABLE activities_v10 RENAME/,
      // Écritures exécutées avant l'échec : DROP des tables d'origine, aucune restauration encore.
      check: (writes: readonly string[]) => {
        expect(writes.some(isRename)).toBe(false);
        expect(writes[writes.length - 1]).toBe("DROP TABLE activities");
      },
    },
  ])("PRE4-1.4/AC4 — erreur structurelle injectée $label : état relu après réouverture identique, illisibles compris, user_version = 9 ; la nouvelle tentative réussit", async ({ pattern, check }) => {
    let database = open();
    await populateVersion9(database, true);
    database = reopen(database);
    const initial = await dump(database);

    const recorded = instrument(database);
    const failing = failOnWrite(recorded.database, pattern);
    await expect(initializeDatabase(failing.database)).rejects.toThrow("Injected failure");
    expect(failing.state.armed).toBe(false);
    expect(failing.state.writesBeforeFailure).toBeGreaterThan(20);
    check(recorded.writes);
    database = reopen(database);

    expect(await dump(database)).toEqual(initial);
    expect(await version(database)).toBe(9);
    for (const id of ["def-bad-json", "def-bad-pause"]) {
      expect(await database.getFirstAsync("SELECT id FROM activity_definitions WHERE id = ?", [id])).toEqual({ id });
    }
    for (const id of ["a-bad-version", "d-bad-beep"]) {
      expect(await database.getFirstAsync("SELECT id FROM activities WHERE id = ?", [id])).toEqual({ id });
    }
    expect(await database.getFirstAsync("SELECT name FROM sqlite_master WHERE name = 'migration_notices'")).toBeNull();

    await migrateLikeStartup(database);
    database = reopen(database);
    expect(await version(database)).toBe(11);
    expect(await database.getAllAsync("SELECT count FROM migration_notices")).toEqual([{ count: 4 }]);
  });

  /**
   * PRE-7 (A1.2, D-440 assouplie) : chaîne complète v9 → 12 par le chemin du
   * démarrage (`initializeDatabase`). Les Exercices et Séances de la v9 sont
   * supprimés une seule fois avec un avis ; Profil, Catégories (personnelle
   * comprise), Zones (personnelle comprise) et Étiquettes conservés. Une
   * Définition et une Séance enregistrées ensuite (Cibles mixtes, Médias
   * ordonnés, référentiels personnels) sont relues égales par une nouvelle
   * connexion.
   */
  it("PRE4-1.4/AC5, PRE-7 A1.2 — chaîne v9 → 12 : Définition et Séance enregistrées (Cibles mixtes, Médias ordonnés) sur la base migrée, relues égales par une nouvelle connexion", async () => {
    let database = open();
    await populateVersion9(database);
    const kept = async (db: Database) => ({
      profiles: await db.getAllAsync("SELECT * FROM profiles"),
      categories: await db.getAllAsync("SELECT * FROM categories ORDER BY id"),
      bodyZones: await db.getAllAsync("SELECT * FROM body_zones ORDER BY id"),
      labels: await db.getAllAsync("SELECT * FROM labels ORDER BY id"),
    });
    const referentials = await kept(database);
    const exercises = (await database.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM activity_definitions"))!.count;
    const sessionsBefore = (await database.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM sessions"))!.count;
    await initializeDatabase(database);
    database = reopen(database);

    // PRE-7 (R-3) : le démarrage enchaîne `migration013` (aucun second avis : 012 a tout vidé).
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await kept(database)).toEqual(referentials);
    for (const table of ["activity_definitions", "movements", "sessions", "activities", "media_assets", "movement_media"]) {
      expect({ table, rows: await database.getAllAsync(`SELECT * FROM ${table}`) }).toEqual({ table, rows: [] });
    }
    expect(await database.getAllAsync("SELECT kind, count FROM migration_notices")).toEqual([
      { kind: "EXERCISES_AND_SESSIONS_RESET", count: exercises + sessionsBefore },
    ]);

    const mixed = variableParameters({
      mode: "DURATION",
      rows: [
        [30, 10],
        [45, 20],
        ["FAILURE", 10],
      ],
      sideMode: "RIGHT_LEFT",
      sideOrder: "BY_SERIES",
      sideRecoverySeconds: 5,
      cadenceBeepIntervalSeconds: 0,
      countdownSeconds: 3,
      endSeconds: 4,
    });
    const asset = (id: string, kind: "PHOTO" | "VIDEO"): MediaAsset => ({
      id,
      uri: `kodjo-media/${id}`,
      createdAt: "2026-10-16T10:00:00.000Z",
      kind,
      mimeType: kind === "VIDEO" ? "video/mp4" : "image/jpeg",
      fileName: null,
      sizeBytes: 10,
      durationMs: kind === "VIDEO" ? 1000 : null,
      width: null,
      height: null,
    });
    const definitionOf = async (input: CreateActivityDefinitionInput): Promise<ActivityDefinition> => {
      const validated = validateActivityDefinitionInput(input);
      if (!validated.ok) {
        throw new Error(JSON.stringify(validated.violations));
      }
      return new SqliteActivityDefinitionRepository(database, ids("def")).create(validated.value);
    };
    const created = await definitionOf({
      name: "Fentes alternées",
      description: "Genou au sol",
      category: { kind: "EXISTING", categoryId: "cat-custom" },
      bodyZoneIds: ["cuisses", "zone-custom"],
      executionParameters: mixed,
      media: [
        { assetId: "asset-a", asset: asset("asset-a", "PHOTO") },
        { assetId: "asset-new", asset: asset("asset-new", "VIDEO") },
        { assetId: "asset-b", asset: asset("asset-b", "PHOTO") },
      ],
    });
    const failure = await definitionOf({
      name: "Tractions",
      description: null,
      category: { kind: "EXISTING", categoryId: "cardio" },
      bodyZoneIds: ["dos"],
      executionParameters: EXPECTED_PARAMETERS["def-fail-uniform"]!,
      media: [{ assetId: "asset-b" }],
    });
    const draft: SessionDraft = {
      ...createEmptyDraft(),
      name: "Séance PRE-7",
      exercises: [activityDefinitionToDraftExercise(created, "occ-new-1", 0), activityDefinitionToDraftExercise(failure, "occ-new-2", 0)],
    };
    const sessionInput = toCreateSessionInput(draft);
    if (!sessionInput.ok) {
      throw new Error(JSON.stringify(sessionInput.violations));
    }
    const session = await new SqliteSessionRepository(database, ids("ses")).create(sessionInput.value);

    database = reopen(database);
    const rereadDefinition: ActivityDefinition | null = await new SqliteActivityDefinitionRepository(database, ids("def")).findById(created.id);
    expect(rereadDefinition).toEqual(created);
    expect(rereadDefinition?.executionParameters).toEqual(mixed);
    expect(rereadDefinition?.categoryId).toBe("cat-custom");
    expect([...(rereadDefinition?.bodyZoneIds ?? [])].sort()).toEqual(["cuisses", "zone-custom"]);
    expect(rereadDefinition?.media?.map((item) => [item.position, item.assetId])).toEqual([
      [0, "asset-a"],
      [1, "asset-new"],
      [2, "asset-b"],
    ]);

    const rereadSession: Session | null = await new SqliteSessionRepository(database, ids("ses")).findById(session.id);
    const copies = [...(rereadSession?.cycle.beforeTour ?? []), ...(rereadSession?.cycle.tour.exercises ?? []), ...(rereadSession?.cycle.afterTour ?? [])];
    expect(copies.map((item) => [item.id, item.structuralPosition, item.position, item.sourceMovementId])).toEqual([
      ["occ-new-1", "BEFORE_TOUR", 0, created.movementId],
      ["occ-new-2", "BEFORE_TOUR", 1, failure.movementId],
    ]);
    expect(copies.map((item) => item.executionParameters)).toEqual([mixed, EXPECTED_PARAMETERS["def-fail-uniform"]]);
    expect(copies.map((item) => item.media?.map((media) => media.assetId))).toEqual([["asset-a", "asset-new", "asset-b"], ["asset-b"]]);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);

    // Relance : aucune réinitialisation, aucun nouvel avis.
    await initializeDatabase(database);
    database = reopen(database);
    expect(await new SqliteSessionRepository(database, ids("ses")).findById(session.id)).toEqual(rereadSession);
    expect(await database.getAllAsync("SELECT kind FROM migration_notices")).toEqual([{ kind: "EXERCISES_AND_SESSIONS_RESET" }]);
  });
});

describe("PRE-4 story 1.4 — report E7 : foreign_key_check de migration010 face à une violation préexistante", () => {
  /** Écrit une violation de clé étrangère préexistante, contournant le contrôle comme une ancienne écriture hors FK. */
  async function injectViolation(database: Database, sql: string): Promise<void> {
    await database.execAsync("PRAGMA foreign_keys = OFF");
    await database.execAsync(sql);
    await database.execAsync("PRAGMA foreign_keys = ON");
  }

  it("PRE4-1.4/E7-a — violation préexistante sans rapport avec PRE-4 (lien de Média de Définition vers un asset absent) : la migration réussit, la violation est laissée telle quelle, rien d'autre", async () => {
    let database = open();
    await populateVersion9(database);
    await injectViolation(
      database,
      "INSERT INTO activity_media (id, activity_definition_id, asset_id, position) VALUES ('dm-ghost', 'def-legacy-duration', 'asset-ghost', 0)",
    );
    const violationsBefore = await database.getAllAsync("PRAGMA foreign_key_check");
    expect(violationsBefore).toEqual([{ table: "activity_media", rowid: expect.any(Number), parent: "media_assets", fkid: 0 }]);
    const before = await inventory(database);

    // Avant la correction, cette base bloquait la migration à chaque démarrage
    // (« foreign_key_check is not empty », user_version restée à 9).
    await migrateLikeStartup(database);
    database = reopen(database);

    expect(await version(database)).toBe(11);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual(violationsBefore);
    for (const table of ["activities", "activity_body_zones", "session_activity_media"]) {
      expect(await database.getAllAsync(`PRAGMA foreign_key_check(${table})`)).toEqual([]);
    }
    const after = await inventory(database);
    for (const table of Object.keys(before)) {
      expect({ table, inventory: after[table] }).toEqual({ table, inventory: before[table] });
    }
    expect(await database.getAllAsync("SELECT * FROM migration_notices")).toEqual([]);
  });

  it("PRE4-1.4/E7-b — constat (Q19) : une violation préexistante DANS une table reconstruite reste une erreur structurelle (annulation complète, user_version = 9)", async () => {
    let database = open();
    await populateVersion9(database);
    await injectViolation(
      database,
      "INSERT INTO session_activity_media (id, activity_id, asset_id, position) VALUES ('sm-ghost', 'a-tour-2', 'asset-ghost', 0)",
    );
    const initial = await dump(database);

    await expect(initializeDatabase(database)).rejects.toThrow("foreign_key_check is not empty for session_activity_media");
    database = reopen(database);

    expect(await version(database)).toBe(9);
    expect(await dump(database)).toEqual(initial);
  });

  it("PRE4-1.4/E7-c — une violation NOUVELLE introduite pendant la migration dans une table non reconstruite est une erreur structurelle (annulation complète, user_version = 9) ; la violation préexistante reste tolérée", async () => {
    let database = open();
    await populateVersion9(database);
    await injectViolation(
      database,
      "INSERT INTO activity_media (id, activity_definition_id, asset_id, position) VALUES ('dm-ghost', 'def-legacy-duration', 'asset-ghost', 0)",
    );
    const initial = await dump(database);

    // Juste avant le relevé global final, la poignée de transaction écrit un lien
    // orphelin dans `activity_media` (accepté tant que les clés sont différées).
    let globalChecks = 0;
    const hooked = instrument(database, async (source, handle) => {
      if (source.trim() === "PRAGMA foreign_key_check") {
        globalChecks += 1;
        if (globalChecks === 2) {
          await handle.runAsync(
            "INSERT INTO activity_media (id, activity_definition_id, asset_id, position) VALUES ('dm-new-ghost', 'def-legacy-reps', 'asset-new-ghost', 0)",
          );
        }
      }
    });
    await expect(initializeDatabase(hooked.database)).rejects.toThrow("new foreign key violation in activity_media");
    expect(globalChecks).toBe(2);
    database = reopen(database);

    expect(await version(database)).toBe(9);
    expect(await dump(database)).toEqual(initial);
    // Sans la violation nouvelle, la même base migre (E7-a).
    await migrateLikeStartup(database);
    expect(await version(database)).toBe(11);
  });
});
