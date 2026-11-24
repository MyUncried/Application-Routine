import { describe, expect, it } from "@jest/globals";

import { EVERY_TIME } from "@/domain/planning/Routine";
import { commonCycle, entriesWithGrid, gridFromEntries, gridIssues, rowMention, togglePoint, withCycle } from "@/features/planning/planningGrid";
import { effectiveName, everyLabel, unitLabel } from "@/features/planning/planningDraft";

const entry = (id: string, x = 1, n = 1, positions: readonly number[] = [1]) => ({ id, sessionId: `s-${id}`, frequency: { x, n, positions } });

describe("grille créneaux × rotation (D-519, RM-253 à RM-256, RM-260 à RM-263)", () => {
  it("départ : #1 seul, tous les points posés, « à chaque fois »", () => {
    const grid = gridFromEntries([entry("a"), entry("b")]);
    expect(grid).toEqual({ cycle: 1, points: [[true], [true]] });
    expect(rowMention(grid.points[0]!)).toBe("à chaque fois");
  });

  it("cycle 1..7 : allonger pointe les nouvelles colonnes ; au-delà de 7, borné", () => {
    const grid = withCycle(gridFromEntries([entry("a")]), 3);
    expect(grid.points).toEqual([[true, true, true]]);
    expect(withCycle(grid, 9).cycle).toBe(7);
    expect(withCycle(grid, 0).cycle).toBe(1);
  });

  it("raccourcir : colonnes retirées avec leurs points ; ligne vidée → jouée partout ; le reste est conservé", () => {
    const grid = { cycle: 3, points: [[true, true, false], [false, false, true]] };
    expect(withCycle(grid, 2).points).toEqual([[true, true], [true, true]]);
    expect(withCycle({ cycle: 3, points: [[true, false, true], [false, true, true]] }, 2).points).toEqual([[true, false], [false, true]]);
  });

  it("au moins un point par ligne et par colonne ; colonne hors cycle sans effet", () => {
    const grid = { cycle: 2, points: [[true, true], [true, false]] };
    expect(togglePoint(grid, 1, 0)).toBe(grid); // dernier point de la ligne
    expect(togglePoint({ cycle: 2, points: [[true, false], [false, true]] }, 0, 0).points[0]![0]).toBe(true); // dernier de la colonne
    expect(togglePoint(grid, 0, 1)).toBe(grid); // dernier de la colonne 2
    expect(togglePoint(grid, 0, 0).points).toEqual([[false, true], [true, false]]);
    expect(togglePoint(grid, 0, 5)).toBe(grid);
  });

  it("mention « x fois sur n » calculée en direct ; une colonne → « à chaque fois »", () => {
    expect(rowMention([true, false, true])).toBe("2 fois sur 3");
    expect(rowMention([true])).toBe("à chaque fois");
  });

  it("enregistrement : n = cycle, positions = colonnes pointées", () => {
    const entries = [entry("a"), entry("b")];
    expect(entriesWithGrid(entries, { cycle: 3, points: [[true, true, true], [true, false, true]] }).map((item) => item.frequency)).toEqual([
      { x: 3, n: 3, positions: [1, 2, 3] },
      { x: 2, n: 3, positions: [1, 3] },
    ]);
  });

  it("planifications existantes : n différents → plus petit multiple commun, mêmes occurrences ; > 7 signalé", () => {
    const entries = [entry("a", 1, 2, [1]), entry("b", 2, 3, [1, 3])];
    expect(commonCycle(entries)).toBe(6);
    expect(gridFromEntries(entries).points).toEqual([
      [true, false, true, false, true, false],
      [true, false, true, true, false, true],
    ]);
    expect(gridIssues(gridFromEntries([entry("a", 1, 4, [1]), entry("b", 1, 3, [2])]))).toContain("CYCLE_TOO_LONG");
    expect(gridIssues({ cycle: 2, points: [[true, false]] })).toEqual(["EMPTY_SLOT"]);
    expect(gridIssues(gridFromEntries([{ ...entry("a"), frequency: EVERY_TIME }]))).toEqual([]);
  });
});

describe("répétition et nom (RM-257, RM-258)", () => {
  it("accord de « toutes les » / « tous les » avec l'unité", () => {
    expect(everyLabel("WEEK")).toBe("toutes les");
    expect(everyLabel("DAY")).toBe("tous les");
    expect([unitLabel("WEEK", 1), unitLabel("WEEK", 2), unitLabel("DAY", 1), unitLabel("DAY", 3)]).toEqual(["semaine", "semaines", "jour", "jours"]);
  });

  // D-553 (21/11/2026) : nom généré — Séance seule, ou noms dans l'ordre reliés par « + » ; il suit la composition ; un nom
  // saisi reste fixe. [RM-258 : « vide à plusieurs » — remplacé.]
  it("nom : généré depuis les Séances (« + » à plusieurs), suit la composition ; saisie prioritaire (D-553)", () => {
    const nameOf = (sessionId: string) => ({ "s-a": "Alpha", "s-b": "Bravo" })[sessionId];
    expect(effectiveName({ name: "", nameEdited: false, entries: [entry("a")] }, nameOf)).toBe("Alpha");
    expect(effectiveName({ name: "", nameEdited: false, entries: [entry("a"), entry("b")] }, nameOf)).toBe("Alpha + Bravo");
    expect(effectiveName({ name: "", nameEdited: false, entries: [entry("b"), entry("a")] }, nameOf)).toBe("Bravo + Alpha");
    expect(effectiveName({ name: "Genou", nameEdited: true, entries: [entry("a"), entry("b")] }, nameOf)).toBe("Genou");
    expect(effectiveName({ name: "Genou", nameEdited: true, entries: [entry("a")] }, nameOf)).toBe("Genou");
    expect(effectiveName({ name: "", nameEdited: true, entries: [entry("a")] }, nameOf)).toBe("");
  });
});
