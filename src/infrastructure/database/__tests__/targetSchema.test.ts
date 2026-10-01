import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import { PREDEFINED_CATEGORIES } from "@/domain/categories/defaults";
import { canonicalCategoryKey } from "@/domain/categories/validation";
import { BODY_ZONES } from "@/features/reference-data/bodyZones";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
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
  });
});
