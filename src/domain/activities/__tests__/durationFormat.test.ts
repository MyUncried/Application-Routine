import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";

/**
 * PRE-4 (story 2.2, AC1, FR-17-01, H8) : formateur unique des durées
 * d'Exercice. Attendus écrits dans le test (AD-10), jamais recalculés.
 */
const AC1_CASES: readonly (readonly [number, string])[] = [
  [0, "0 s"],
  [15, "15 s"],
  [60, "1 min"],
  [90, "1 min 30 s"],
  [1265, "21 min 5 s"],
  // Au-delà de 59 min : les minutes continuent, sans heures (H8).
  [3665, "61 min 5 s"],
  [3960, "66 min"],
  [4500, "75 min"],
];

const SRC = path.resolve(__dirname, "../../..");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) {
      return entry === "__tests__" || entry === "testing" ? [] : sourceFiles(full);
    }
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

describe("PRE-4 story 2.2 — AC1 un seul formateur de durée (FR-17-01, H8)", () => {
  it("PRE4-2.2/AC1 — 0 s, 15 s, 1 min (jamais 60 s), 1 min 30 s, 21 min 5 s ; minutes sans heures au-delà de 59 min", () => {
    for (const [seconds, expected] of AC1_CASES) {
      expect(formatPhraseDuration(seconds)).toBe(expected);
    }
    expect(formatPhraseDuration(60)).not.toBe("60 s");
    expect(formatPhraseDuration(3665)).not.toMatch(/h/);
  });

  it("PRE4-2.2/AC1 — défini une seule fois, dans `src/domain/activities/durationFormat.ts`, et ré-exporté nulle part", () => {
    const files = sourceFiles(SRC);
    const relative = (file: string) => path.relative(SRC, file).replace(/\\/g, "/");
    const definitions = files.filter((file) =>
      /export function formatPhraseDuration\b/.test(readFileSync(file, "utf8")),
    );
    expect(definitions.map(relative)).toEqual(["domain/activities/durationFormat.ts"]);
    // Aucun ré-export : ni `export { formatPhraseDuration … } from`, ni `export * from "…durationFormat"`.
    const reExporters = files.filter((file) => {
      const source = readFileSync(file, "utf8");
      return (
        /export\s*\{[^}]*\bformatPhraseDuration\b[^}]*\}/.test(source) ||
        /export\s*\*\s*from\s*["'][^"']*durationFormat["']/.test(source)
      );
    });
    expect(reExporters.map(relative)).toEqual([]);
    // Le formateur est pur : il n'importe rien.
    const own = readFileSync(path.join(SRC, "domain/activities/durationFormat.ts"), "utf8");
    expect(own).not.toMatch(/^import /m);
  });
});
