import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { describe, expect, it } from "@jest/globals";

/**
 * PRE-9 (story A.3, décision de Hermann du 04/11/2026 : « Hermann abandonne la conversion sans perte
 * prévue par A.4 : les anciens exercices concernés par cette conversion peuvent être supprimés plutôt
 * que migrés. ») — garde : plus aucun code applicatif ni test ne lit ou n'écrit la table des anciennes
 * définitions du Catalogue, vidée par `migration021` (sa suppression, A.5, reste non autorisée).
 *
 * Seuls restent autorisés à la nommer : les migrations elles-mêmes, le séquenceur et l'historique des
 * versions (`migrateDatabase.ts`, `constants.ts`, commentaires d'historique), et les preuves des
 * migrations historiques (`migrationNNN.test.ts`, `migrateDatabase.test.ts`, `targetSchema.test.ts`,
 * `preservation.*.test.ts`), qui peuplent des bases aux schémas antérieurs.
 */

const SOURCE_ROOT = join(process.cwd(), "src");
const TABLE = ["activity", "definitions"].join("_");

const ALLOWED: readonly RegExp[] = [
  /^infrastructure\/database\/migrations\//,
  /^infrastructure\/database\/migrateDatabase\.ts$/,
  /^infrastructure\/database\/constants\.ts$/,
  /^infrastructure\/database\/__tests__\/migration\d{3}\.test\.ts$/,
  /^infrastructure\/database\/__tests__\/migrateDatabase\.test\.ts$/,
  /^infrastructure\/database\/__tests__\/targetSchema\.test\.ts$/,
  /^infrastructure\/database\/__tests__\/preservation\.[^/]+\.test\.ts$/,
];

function sourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      files.push(...sourceFiles(path));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

describe("PRE-9 A.3 — garde : table des anciennes définitions du Catalogue", () => {
  it("aucun fichier de src/ hors migrations et preuves historiques ne la nomme", () => {
    const offenders = sourceFiles(SOURCE_ROOT)
      .map((path) => relative(SOURCE_ROOT, path).split(sep).join("/"))
      .filter((path) => !ALLOWED.some((pattern) => pattern.test(path)))
      .filter((path) => readFileSync(join(SOURCE_ROOT, path), "utf8").includes(TABLE));
    expect(offenders).toEqual([]);
  });

  it("la garde voit bien la table là où elle est autorisée (aucun faux vert)", () => {
    const migration = readFileSync(join(SOURCE_ROOT, "infrastructure/database/migrations/migration021.ts"), "utf8");
    expect(migration).toContain(`DELETE FROM ${TABLE}`);
  });
});
