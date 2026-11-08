import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";

/**
 * PRE-4 (story 2.2, AC1, FR-17-01, H8) : formateur unique des durées
 * d'Exercice. Attendus écrits dans le test (AD-10), jamais recalculés.
 */
const AC1_CASES: readonly (readonly [number, string])[] = [
  [0, "0″"],
  [15, "15″"],
  [60, "1′00″"],
  [90, "1′30″"],
  [1265, "21′05″"],
  // Au-delà de 59 min : les minutes continuent, sans heures (H8).
  [3665, "1h 01′"], // [« 1h 01′05″ » — remplacé le 08/11/2026 au soir (Hermann : pas de secondes au-delà d'une heure)]
  [3960, "1h 06′"],
  [4500, "1h 15′"],
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
  it("PRE4-2.2/AC1 — 0″, 15″, 1′00″ (jamais 1′00″), 1′30″, 21′05″ ; minutes sans heures au-delà de 59′00″", () => {
    for (const [seconds, expected] of AC1_CASES) {
      expect(formatPhraseDuration(seconds)).toBe(expected);
    }
    // [« jamais « 1 min 0 s » » et « sans heures (H8) » — remplacés le 08/11/2026 au soir (Hermann : « Partout veut bien dire partout » ;
    // « Il y a les heures aussi ») : 1′00″, et « Hh MM′ » à partir d'une heure.]
    expect(formatPhraseDuration(60)).toBe("1′00″");
    expect(formatPhraseDuration(3665)).toMatch(/^1h/u);
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
