import { describe, expect, it } from "@jest/globals";

import {
  numberTarget,
  resizeSeriesWithReserve,
  resizeWithReserve,
  type SeriesRow,
} from "@/domain/activities/ExecutionParameters";
import { uniformParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";

/** PRE-6 story 1.4 (AD-38) : règle unique « le tableau suit N », partagée par la Feuille et le Circuit. */
describe("resizeWithReserve — primitive pure (PRE-6, story 1.4)", () => {
  const copy = (last: string | undefined) => `${last ?? "∅"}'`;

  it("réduire : les éléments retirés passent en tête de la réserve, dans leur ordre relatif", () => {
    expect(resizeWithReserve(["a", "b", "c", "d"], ["x"], 2, copy)).toEqual({ active: ["a", "b"], reserve: ["c", "d", "x"] });
  });

  it("augmenter : restauration d'abord depuis la tête de la réserve, puis copie de la dernière active", () => {
    expect(resizeWithReserve(["a"], ["b", "c"], 2, copy)).toEqual({ active: ["a", "b"], reserve: ["c"] });
    expect(resizeWithReserve(["a"], ["b"], 4, copy)).toEqual({ active: ["a", "b", "b'", "b''"], reserve: [] });
  });

  it("même longueur : rien ne change ; aucun actif : copie reçoit `undefined`", () => {
    expect(resizeWithReserve(["a"], ["b"], 1, copy)).toEqual({ active: ["a"], reserve: ["b"] });
    expect(resizeWithReserve<string>([], [], 1, copy)).toEqual({ active: ["∅'"], reserve: [] });
  });

  it("ne modifie jamais les tableaux reçus", () => {
    const active = Object.freeze(["a", "b", "c"]);
    const reserve = Object.freeze(["d"]);
    resizeWithReserve(active, reserve, 1, copy);
    resizeWithReserve(active, reserve, 5, copy);
    expect(active).toEqual(["a", "b", "c"]);
    expect(reserve).toEqual(["d"]);
  });
});

describe("resizeSeriesWithReserve — adaptation d'une ExecutionSeries à N (PRE-6, story 1.4)", () => {
  it("identiques : seul `count` suit N, réserve rendue inchangée", () => {
    const series = uniformParameters({ count: 3, target: 30, pauseSeconds: 10, loadKg: 5 }).series;
    const reserve: SeriesRow[] = [];
    const result = resizeSeriesWithReserve(series, reserve, 5);
    expect(result.series).toEqual({ ...series, count: 5 });
    expect(result.reserve).toBe(reserve);
    expect(resizeSeriesWithReserve(series, [], 3).series).toBe(series);
  });

  it("variables : extension par copie de la dernière ligne (Cible, Pause, charge), objets non partagés", () => {
    const series = variableParameters({ rows: [[30, 10, 0], [40, 20, 7.5]] }).series;
    const result = resizeSeriesWithReserve(series, [], 4);
    expect(result.series).toEqual({
      kind: "VARIABLE",
      rows: [
        { target: numberTarget(30), pauseSeconds: 10, loadKg: 0 },
        { target: numberTarget(40), pauseSeconds: 20, loadKg: 7.5 },
        { target: numberTarget(40), pauseSeconds: 20, loadKg: 7.5 },
        { target: numberTarget(40), pauseSeconds: 20, loadKg: 7.5 },
      ],
      workPhases: [],
    });
    const rows = (result.series as { rows: readonly SeriesRow[] }).rows;
    expect(rows[2]).not.toBe(rows[1]);
    expect(rows[2]!.target).not.toBe(rows[1]!.target);
    expect(rows[3]!.target).not.toBe(rows[2]!.target);
  });

  it("variables : réduction en réserve, puis restauration des lignes d'origine", () => {
    const series = variableParameters({ rows: [[10, 0], [20, 0], [30, 0], [40, 0]] }).series;
    const reduced = resizeSeriesWithReserve(series, [], 3);
    expect(reduced.reserve).toEqual([{ target: numberTarget(40), pauseSeconds: 0, loadKg: 0 }]);
    const restored = resizeSeriesWithReserve(reduced.series, reduced.reserve, 4);
    expect(restored.series).toEqual(series);
    expect(restored.reserve).toEqual([]);
  });
});
