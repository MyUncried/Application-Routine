import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "@jest/globals";

/**
 * PRE-5 (story 1.1, AC4, AC2, AC11, AD-18) — garde de cantonnement du format v2,
 * sur le modèle de `legacyModeConfinement.test.ts`.
 *
 * - `serializeV2` et `readV2` n'apparaissent, hors commentaires, que dans `EP`
 *   (définitions et `readExecutionParameters`) et dans leurs tests : tests de `EP`,
 *   tests de parité de `migration010` et tests qui injectent une donnée PRE-4 (v2)
 *   pour prouver sa lecture.
 * - `serializeV2` n'a aucun appelant de production, `EP` compris.
 * - Les repositories, l'Instantané et le contrôle natif lisent par
 *   `readExecutionParameters` et écrivent par `serializeExecutionParameters`.
 */

const ROOT = join(__dirname, "..", "..", "..", "..");
const SELF = "src/domain/activities/__tests__/executionParametersV2Confinement.test.ts";
const EP = "src/domain/activities/ExecutionParameters.ts";

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

const FILES = [...sourceFiles(join(ROOT, "src")), ...sourceFiles(join(ROOT, "app"))]
  .map((path) => ({
    path: relative(ROOT, path).replace(/\\/g, "/"),
    code: withoutComments(readFileSync(path, "utf8")),
  }))
  .filter((file) => file.path !== SELF);

const V2_IDENTIFIER = /\b(serializeV2|readV2)\b/;

describe("PRE5-1.1/AC4 — garde de cantonnement de serializeV2 et readV2 (AD-18)", () => {
  it("le parcours couvre src/ et app/", () => {
    expect(FILES.some((file) => file.path === EP)).toBe(true);
    expect(FILES.some((file) => file.path.startsWith("app/"))).toBe(true);
  });

  it("serializeV2 et readV2 n'apparaissent que dans EP et leurs tests", () => {
    const allowed = new Set([
      EP,
      "src/domain/activities/__tests__/ExecutionParameters.test.ts",
      "src/infrastructure/database/__tests__/migration010.test.ts",
      "src/infrastructure/database/__tests__/preservation.story14.test.ts",
      // Données PRE-4 (v2) injectées en base pour prouver leur lecture par `readExecutionParameters`.
      "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
      "src/infrastructure/database/__tests__/copiesAndSnapshots.story13.test.ts",
      "src/infrastructure/database/__tests__/executionParametersV3.roundTrip.test.ts",
      // PRE-7 (A1.2, D-440) : données v2 injectées pour prouver leur REFUS après la migration 012.
      "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    ]);
    const offenders = FILES.filter((file) => V2_IDENTIFIER.test(file.code) && !allowed.has(file.path)).map((file) => file.path);
    expect(offenders).toEqual([]);
  });

  it("aucun module de production n'utilise serializeV2 ni readV2 hors de EP", () => {
    const production = FILES.filter((file) => !file.path.includes("/__tests__/") && file.path !== EP);
    expect(production.filter((file) => V2_IDENTIFIER.test(file.code)).map((file) => file.path)).toEqual([]);
  });

  it("dans EP, serializeV2 n'a aucun appelant et readV2 n'est appelé que par sa propre définition", () => {
    const ep = FILES.find((file) => file.path === EP)!.code;
    // Seule occurrence de `serializeV2(` : sa déclaration.
    expect(ep.match(/\bserializeV2\s*\(/g)).toHaveLength(1);
    expect(ep).toMatch(/export function serializeV2\s*\(/);
    expect(ep.match(/\breadV2\s*\(/g)).toHaveLength(1);
    expect(ep).toMatch(/export function readV2\s*\(/);
    // `readExecutionParameters` délègue la v2 à la grammaire de `readV2` (même lecteur interne).
    // PRE-7 (D-446, R-2) : la v3 et la v5 partagent le lecteur de la grammaire résolue.
    expect(ep).toMatch(
      /export function readExecutionParameters[\s\S]*?readV2Object\(value\)[\s\S]*?readResolvedObject\(value, false\)[\s\S]*?readResolvedObject\(value, true\)/,
    );
  });

  it("l'Instantané passe par readExecutionParameters et serializeExecutionParameters", () => {
    const code = (path: string) => FILES.find((file) => file.path === path)!.code;
    const path = "src/domain/activities/exerciseSnapshot.ts";
    expect({ path, reads: /\breadExecutionParameters\(/.test(code(path)) }).toEqual({ path, reads: true });
    expect({ path, writes: /\bserializeExecutionParameters\(/.test(code(path)) }).toEqual({ path, writes: true });
  });

  // PRE-7 (A1.2, D-440) : après la migration 012, la persistance ne lit ni n'écrit plus la v2 ni la v3.
  it("PRE-7 A1.2 — les repositories lisent et écrivent la seule v4 (Catalogue pour les définitions, résolue pour les copies)", () => {
    const code = (path: string) => FILES.find((file) => file.path === path)!.code;
    const persistence = FILES.filter((file) => file.path.startsWith("src/infrastructure/database/repositories/"));
    expect(persistence.length).toBeGreaterThan(0);
    expect(
      persistence
        .filter((file) => /\b(readExecutionParameters|serializeExecutionParameters|readV3)\b/.test(file.code))
        .map((file) => file.path),
    ).toEqual([]);
    const definitions = code("src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts");
    expect(/\breadCatalogExecutionParameters\(/.test(definitions)).toBe(true);
    expect(/\bserializeCatalogExecutionParameters\(/.test(definitions)).toBe(true);
    const sessions = code("src/infrastructure/database/repositories/SqliteSessionRepository.ts");
    expect(/\breadResolvedExecutionParameters\(/.test(sessions)).toBe(true);
    expect(/\bserializeResolvedExecutionParameters\(/.test(sessions)).toBe(true);
  });
});
