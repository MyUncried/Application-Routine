import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "@jest/globals";

/**
 * PRE-4 (story 1.1, AC4, AC1, AD-1, AD-3) — garde de cantonnement de l'ancien
 * troisième mode et de son lecteur. Modèle : `visualAssets.test.ts`
 * (parcours de l'arborescence par `readdirSync`).
 *
 * - Le littéral de l'ancien mode n'apparaît, hors commentaires, que dans le
 *   lecteur v1 et son module de tests, les types de ligne SQL, `migration010`,
 *   les migrations historiques 003, 004 et 006 (inchangées), les tests de
 *   parité ou de migration, et le test du corpus au seul endroit de son
 *   adaptation nommée (story 2.3, AC13 ; adaptation minimale en 1.1).
 * - `readV1` n'est importé que par les tests de parité et le lecteur
 *   d'Instantané v1.
 * - `legacyExecutionParameters` et `resolveExecutionParameters` n'existent plus.
 * - `LegacyExecutionMode` n'apparaît que dans `readV1`, `DatabaseRows.ts` et
 *   `migration010`.
 * - Aucun module de production ne teste une Cible par `null` ni ne lui
 *   substitue une sentinelle `?? 0`.
 */

const ROOT = join(__dirname, "..", "..", "..", "..");
// Construit sans écrire le littéral, pour que cette garde ne se compte pas elle-même.
const LEGACY_MODE = ["TO", "FAILURE"].join("_");

function sourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      if (entry !== "node_modules") {
        files.push(...sourceFiles(path));
      }
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

/** Retire les commentaires bloc et ligne (sans toucher aux URL des chaînes, `://`). */
function withoutComments(source: string): string {
  return source
    .replace(/\r/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:\\])\/\/.*$/gm, "$1");
}

const SELF = "src/domain/activities/__tests__/legacyModeConfinement.test.ts";

/** Tous les fichiers de src/ et app/, sauf cette garde (qui nomme les identifiants qu'elle recherche). */
const FILES = [...sourceFiles(join(ROOT, "src")), ...sourceFiles(join(ROOT, "app"))]
  .map((path) => ({
    path: relative(ROOT, path).replace(/\\/g, "/"),
    code: withoutComments(readFileSync(path, "utf8")),
  }))
  .filter((file) => file.path !== SELF);

const isTest = (path: string) => path.includes("/__tests__/");

/** Tout spécificateur de module se terminant par `/readV1` : `import` (types, `* as`, dynamique), `export … from`, `require(…)`. */
const READV1_MODULE = /(?:\bfrom\s*|\brequire\s*\(\s*|\bimport\s*\(\s*)["'][^"']*\/readV1["']/;

/**
 * Comparaison d'une Cible à null ou 0, `target ?? …`, ou sentinelle `?? 0`
 * appliquée à une expression de Cible (ex. `targetNumber(x.target) ?? 0`).
 */
const TARGET_SENTINEL =
  /\btarget\s*(===|!==|==|!=)\s*(null|0)\b|\btarget\s*\?\?|\btarget\w*\([^()]*\)\s*\?\?\s*0\b|\btarget\)\s*\?\?\s*0\b/i;

describe("PRE4-1.1/AC4 — garde de cantonnement de l'ancien mode et de readV1", () => {
  it("les motifs de la garde reconnaissent chaque forme visée", () => {
    for (const sample of [
      'import { readV1 } from "./readV1";',
      'import type { LegacyExecutionScalars } from "@/domain/activities/readV1";',
      'import * as legacy from "../readV1";',
      'export { readV1 } from "./readV1";',
      'const legacy = require("./readV1");',
    ]) {
      expect({ sample, matched: READV1_MODULE.test(sample) }).toEqual({ sample, matched: true });
    }
    expect(READV1_MODULE.test('import { x } from "./readV1Extra";')).toBe(false);
    for (const sample of ["row.target === null", "row.target ?? 0", "targetNumber(row.target) ?? 0", "toValue(first.target) ?? 0"]) {
      expect({ sample, matched: TARGET_SENTINEL.test(sample) }).toEqual({ sample, matched: true });
    }
    expect(TARGET_SENTINEL.test("targetNumber(row.target) ?? UNSET_WHEEL_OPENING_SECONDS")).toBe(false);
  });

  it("le parcours couvre src/ et app/", () => {
    expect(FILES.some((file) => file.path === "src/domain/activities/readV1.ts")).toBe(true);
    expect(FILES.some((file) => file.path.startsWith("app/"))).toBe(true);
  });

  it("le littéral de l'ancien mode n'apparaît que dans les fichiers autorisés", () => {
    const allowed = new Set([
      "src/domain/activities/readV1.ts",
      "src/domain/activities/__tests__/readV1.test.ts",
      "src/infrastructure/database/types/DatabaseRows.ts",
      "src/infrastructure/database/migrations/migration003.ts",
      "src/infrastructure/database/migrations/migration004.ts",
      "src/infrastructure/database/migrations/migration006.ts",
      "src/infrastructure/database/migrations/migration010.ts",
      "src/infrastructure/database/__tests__/migration010.test.ts",
      "src/infrastructure/database/__tests__/preservation.story14.test.ts",
      "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "src/infrastructure/database/__tests__/targetSchema.test.ts",
      "src/domain/activities/__tests__/executionPhrase.test.ts",
    ]);
    const offenders = FILES.filter((file) => file.code.includes(LEGACY_MODE) && !allowed.has(file.path)).map((file) => file.path);
    expect(offenders).toEqual([]);
  });

  it("dans le test du corpus, le littéral n'apparaît qu'à l'endroit de l'adaptation nommée (story 2.3, AC13)", () => {
    const corpusTest = FILES.find((file) => file.path === "src/domain/activities/__tests__/executionPhrase.test.ts")!;
    const lines = corpusTest.code
      .split("\n")
      .filter((line) => line.includes(LEGACY_MODE))
      .map((line) => line.trim());
    expect(lines).toEqual([`const LEGACY_FAILURE_MODE = "${LEGACY_MODE}";`]);
  });

  it("readV1 n'est importé que par les tests de parité et le lecteur d'Instantané v1", () => {
    const importers = FILES.filter((file) => READV1_MODULE.test(file.code)).map((file) => file.path);
    expect(importers.sort()).toEqual(
      [
        "src/domain/activities/__tests__/readV1.test.ts",
        "src/domain/activities/exerciseSnapshot.ts",
        "src/infrastructure/database/__tests__/migration010.test.ts",
        "src/infrastructure/database/__tests__/preservation.story14.test.ts",
      ].sort(),
    );
  });

  it("legacyExecutionParameters et resolveExecutionParameters n'ont plus aucun appelant", () => {
    const callers = FILES.filter((file) => /\b(legacyExecutionParameters|resolveExecutionParameters)\b/.test(file.code)).map(
      (file) => file.path,
    );
    expect(callers).toEqual([]);
  });

  it("PRE4-1.1/AC1 — LegacyExecutionMode n'apparaît que dans readV1, DatabaseRows.ts et migration010", () => {
    const users = FILES.filter((file) => /\bLegacyExecutionMode\b/.test(file.code)).map((file) => file.path);
    expect(users.sort()).toEqual(
      [
        "src/domain/activities/readV1.ts",
        "src/infrastructure/database/migrations/migration010.ts",
        "src/infrastructure/database/types/DatabaseRows.ts",
      ].sort(),
    );
  });

  it("PRE4-1.1/AC1 — aucun module de production ne teste une Cible par null ni ne lui substitue une sentinelle", () => {
    const offenders = FILES.filter(
      (file) =>
        !isTest(file.path) &&
        !file.path.includes("/testing/") &&
        TARGET_SENTINEL.test(file.code),
    ).map((file) => file.path);
    expect(offenders).toEqual([]);
  });
});
