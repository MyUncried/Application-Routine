import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

import { colors, fixedRadii, spacing, type } from "../tokens";

/**
 * Alignement DSF du 07/10/2026 — contrôle déterministe entre `tokens.ts` et
 * la section « Design tokens canoniques » de `12 – Architecture
 * technique.md` (source normative des tokens) : chaque token de code y est
 * tracé avec la même valeur.
 */
const specificationPath = path.resolve(
  __dirname,
  "../../../../docs/Specifications-fonctionnelles/12 – Architecture technique.md",
);
const specification = readFileSync(specificationPath, "utf8").replace(/\r\n/g, "\n");

/** Cellules des lignes de tableau dont la première cellule est `` `prefix.nom` ``. */
function tableRows(prefix: string): Map<string, string[]> {
  const rows = new Map<string, string[]>();
  const pattern = new RegExp(`^\\| \`${prefix}\\.([A-Za-z0-9]+)\` \\|(.*)$`, "gm");
  for (const match of specification.matchAll(pattern)) {
    rows.set(
      match[1],
      match[2].split("|").map((cell) => cell.trim()),
    );
  }
  return rows;
}

function firstBacktickedValue(cell: string): string {
  const match = /`([^`]+)`/.exec(cell);
  if (!match) {
    throw new Error(`No backticked value in « ${cell} »`);
  }
  return match[1];
}

function backtickedNumbers(cell: string): number[] {
  return [...cell.matchAll(/`(\d+)`/g)].map((match) => Number(match[1]));
}

describe("tokens.ts ↔ chapitre 12, Design tokens canoniques", () => {
  it("documents every colour token of the code with the same value", () => {
    const rows = tableRows("color");
    for (const [name, value] of Object.entries(colors)) {
      const row = rows.get(name);
      expect({ name, documented: row !== undefined }).toEqual({ name, documented: true });
      expect({ name, value: firstBacktickedValue(row![0]).toUpperCase() }).toEqual({
        name,
        value: value.toUpperCase(),
      });
    }
  });

  it("documents every typography token of the code with the same size and line height", () => {
    const rows = tableRows("type");
    for (const [name, style] of Object.entries(type)) {
      const row = rows.get(name);
      expect({ name, documented: row !== undefined }).toEqual({ name, documented: true });
      const [, sizeCell, lineHeightCell] = row!;
      expect({ name, fontSize: Number(firstBacktickedValue(sizeCell)) }).toEqual({
        name,
        fontSize: style.fontSize,
      });
      expect({ name, lineHeight: Number(firstBacktickedValue(lineHeightCell)) }).toEqual({
        name,
        lineHeight: style.lineHeight,
      });
    }
  });

  it("uses exactly the documented spacing and fixed radius scales", () => {
    const spacingRow = /^\| Espacements \| (.*)$/m.exec(specification);
    const radiiRow = /^\| Rayons fixes \| (.*)$/m.exec(specification);
    expect(spacingRow).not.toBeNull();
    expect(radiiRow).not.toBeNull();
    expect(backtickedNumbers(spacingRow![1].split("|")[0])).toEqual(
      Object.values(spacing),
    );
    expect(backtickedNumbers(radiiRow![1].split("|")[0])).toEqual(
      Object.values(fixedRadii),
    );
  });
});
