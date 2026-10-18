import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

/**
 * PRE-4 (story 1.1, AC25, NFR-11, NFR-13, AD-11) — rien hors périmètre :
 * garde-fous zéro `ScrollView` iOS présents, jetons inchangés depuis le code
 * de départ (`d07a3817`), identifiants historiques non renommés. Les trois
 * contrôles (`npm test`, `npx tsc --noEmit`, `npm run lint`) restent la
 * preuve d'ensemble.
 */

const ROOT = join(__dirname, "..", "..", "..", "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8").replace(/\r/g, "");

/** Empreinte LF de `src/shared/ui/tokens.ts` au commit `d07a3817` (code de départ). */
const TOKENS_BASELINE_SHA256 = "b4ae92b6b2c06965e818e6fe89f973ffb5cdff7787cb3b241ac184f11ecf93be";

function sources(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? sources(path) : /\.(ts|tsx)$/.test(entry) ? [path] : [];
  });
}

describe("PRE4-1.1/AC25 — trois contrôles verts, rien hors périmètre", () => {
  it("les garde-fous zéro ScrollView iOS existent toujours", () => {
    for (const file of [
      "src/features/sessions/__tests__/DurationWheelPicker.test.tsx",
      "src/features/sessions/__tests__/NumberWheelPicker.test.tsx",
    ]) {
      expect({ file, guarded: read(file).includes("expect(UNSAFE_root.findAllByType(ScrollView)).toHaveLength(0);") }).toEqual({
        file,
        guarded: true,
      });
    }
  });

  it("aucun jeton de src/shared/ui/tokens.ts n'est modifié (empreinte du code de départ)", () => {
    expect(createHash("sha256").update(read("src/shared/ui/tokens.ts")).digest("hex")).toBe(TOKENS_BASELINE_SHA256);
  });

  it("aucun identifiant historique n'est renommé (ActivityDefinition, *ACTIVITY*, IN_TOUR, tour_id, tour*)", () => {
    const code = sources(join(ROOT, "src")).map((path) => readFileSync(path, "utf8")).join("\n");
    for (const identifier of [
      /\bActivityDefinition\b/,
      /\bDEFAULT_ACTIVITY_TYPE\b/,
      /\bACTIVITY_ROW_COLUMNS\b/,
      /\bIN_TOUR\b/,
      /\btour_id\b/,
      /\btourRepeatCount\b/,
    ]) {
      expect({ identifier: String(identifier), present: identifier.test(code) }).toEqual({
        identifier: String(identifier),
        present: true,
      });
    }
  });
});
