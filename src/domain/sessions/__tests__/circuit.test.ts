import { describe, expect, it } from "@jest/globals";

import {
  CIRCUIT_NATURES,
  DEFAULT_CIRCUIT_NATURE,
  circuitBoundCount,
  circuitBoundOf,
  isCircuitNature,
  type CircuitBound,
} from "@/domain/sessions/circuit";
import { createEmptyDraft } from "@/domain/sessions/SessionDraft";

/** PRE-6 story 1.1 (AC1, AD-34) : nature du Circuit et borne `COUNT` dérivée du compte existant. */
describe("circuit — nature et borne (PRE-6, AD-34)", () => {
  it("connaît exactement deux natures, Tours par défaut", () => {
    expect(CIRCUIT_NATURES).toEqual(["TOURS", "SERIES"]);
    expect(DEFAULT_CIRCUIT_NATURE).toBe("TOURS");
  });

  it.each([
    ["TOURS", true],
    ["SERIES", true],
    ["FOO", false],
    ["tours", false],
    ["", false],
    [undefined, false],
    [null, false],
    [2, false],
  ])("isCircuitNature(%p) = %p", (value, expected) => {
    expect(isCircuitNature(value)).toBe(expected);
  });

  it("la borne COUNT EST le compte du Circuit (tourRepeatCount), sans second compte", () => {
    expect(circuitBoundOf({ tourRepeatCount: 4 })).toEqual({ kind: "COUNT", count: 4 });
    expect(circuitBoundOf({ tourRepeatCount: 99 })).toEqual({ kind: "COUNT", count: 99 });
  });

  it("un brouillon sans compte explicite a la borne COUNT par défaut (1)", () => {
    expect(circuitBoundOf({})).toEqual({ kind: "COUNT", count: 1 });
    expect(circuitBoundOf(createEmptyDraft())).toEqual({ kind: "COUNT", count: 1 });
  });

  it("circuitBoundCount lit le nombre de passages de la borne", () => {
    const bound: CircuitBound = { kind: "COUNT", count: 7 };
    expect(circuitBoundCount(bound)).toBe(7);
    expect(circuitBoundCount(circuitBoundOf({ tourRepeatCount: 3 }))).toBe(3);
  });

  it("la nature ne change pas la borne : Tours et Séries partagent le même compte", () => {
    const tours = { ...createEmptyDraft(), tourRepeatCount: 4, circuitNature: "TOURS" as const };
    const series = { ...tours, circuitNature: "SERIES" as const };
    expect(circuitBoundOf(series)).toEqual(circuitBoundOf(tours));
  });
});
