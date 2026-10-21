import { describe, expect, it } from "@jest/globals";

import type { StructuralPosition } from "../Session";
import {
  anchorStopPoints,
  hasUniquePositionPerScope,
  isStopPointAllowed,
  isStopPointPlacementValid,
  isStopPointPositionInRange,
  orderStopPointsByScope,
  reattachStopPoints,
  stopPointDisplay,
  stopPointNeighbors,
  withoutStopPoint,
  type StopPoint,
} from "../StopPoint";

function occ(id: string, structuralPosition: StructuralPosition) {
  return { id, structuralPosition };
}

describe("isStopPointPlacementValid", () => {
  it("rejects a placement immediately after the initial countdown", () => {
    expect(
      isStopPointPlacementValid({
        isImmediatelyAfterInitialCountdown: true,
        isImmediatelyBeforeSessionEnd: false,
      }),
    ).toBe(false);
  });

  it("rejects a placement immediately before the session end", () => {
    expect(
      isStopPointPlacementValid({
        isImmediatelyAfterInitialCountdown: false,
        isImmediatelyBeforeSessionEnd: true,
      }),
    ).toBe(false);
  });

  it("accepts any other placement", () => {
    expect(
      isStopPointPlacementValid({
        isImmediatelyAfterInitialCountdown: false,
        isImmediatelyBeforeSessionEnd: false,
      }),
    ).toBe(true);
  });
});

describe("stopPointNeighbors (liste affichée, sans répétition)", () => {
  const occurrences = [occ("b1", "BEFORE_TOUR"), occ("i1", "IN_TOUR"), occ("i2", "IN_TOUR")];

  it("BEFORE_TOUR p=0 directly follows the initial countdown", () => {
    expect(stopPointNeighbors(occurrences, { scope: "BEFORE_TOUR", position: 0 })).toEqual({
      isImmediatelyAfterInitialCountdown: true,
      isImmediatelyBeforeSessionEnd: false,
    });
  });

  it("IN_TOUR p=0 is preceded by the BEFORE_TOUR occurrence", () => {
    expect(stopPointNeighbors(occurrences, { scope: "IN_TOUR", position: 0 })).toEqual({
      isImmediatelyAfterInitialCountdown: false,
      isImmediatelyBeforeSessionEnd: false,
    });
  });

  it("the last IN_TOUR slot with nothing after directly precedes the end", () => {
    expect(stopPointNeighbors(occurrences, { scope: "IN_TOUR", position: 2 })).toEqual({
      isImmediatelyAfterInitialCountdown: false,
      isImmediatelyBeforeSessionEnd: true,
    });
  });

  it("AFTER_TOUR p=0 with no AFTER_TOUR occurrence directly precedes the end", () => {
    expect(stopPointNeighbors(occurrences, { scope: "AFTER_TOUR", position: 0 }).isImmediatelyBeforeSessionEnd).toBe(
      true,
    );
  });
});

describe("isStopPointPositionInRange / isStopPointAllowed", () => {
  const occurrences = [occ("i1", "IN_TOUR"), occ("i2", "IN_TOUR")];

  it("accepts 0..n integers only", () => {
    expect(isStopPointPositionInRange(occurrences, { scope: "IN_TOUR", position: 0 })).toBe(true);
    expect(isStopPointPositionInRange(occurrences, { scope: "IN_TOUR", position: 2 })).toBe(true);
    expect(isStopPointPositionInRange(occurrences, { scope: "IN_TOUR", position: 3 })).toBe(false);
    expect(isStopPointPositionInRange(occurrences, { scope: "IN_TOUR", position: -1 })).toBe(false);
    expect(isStopPointPositionInRange(occurrences, { scope: "IN_TOUR", position: 0.5 })).toBe(false);
  });

  it("allows only the slot between the two occurrences", () => {
    expect([0, 1, 2].map((position) => isStopPointAllowed(occurrences, { scope: "IN_TOUR", position }))).toEqual([
      false,
      true,
      false,
    ]);
  });
});

describe("hasUniquePositionPerScope", () => {
  it("rejects a duplicate position within the same scope", () => {
    const points: readonly StopPoint[] = [
      { id: "s1", scope: "IN_TOUR", position: 1 },
      { id: "s2", scope: "IN_TOUR", position: 1 },
    ];
    expect(hasUniquePositionPerScope(points)).toBe(false);
  });

  it("allows the same position across two distinct scopes", () => {
    const points: readonly StopPoint[] = [
      { id: "s1", scope: "BEFORE_TOUR", position: 0 },
      { id: "s2", scope: "AFTER_TOUR", position: 0 },
    ];
    expect(hasUniquePositionPerScope(points)).toBe(true);
  });
});

describe("orderStopPointsByScope", () => {
  it("orders by ascending position within the requested scope only", () => {
    const points: readonly StopPoint[] = [
      { id: "s2", scope: "IN_TOUR", position: 2 },
      { id: "s1", scope: "IN_TOUR", position: 1 },
      { id: "s3", scope: "AFTER_TOUR", position: 0 },
    ];
    expect(orderStopPointsByScope(points, "IN_TOUR").map((point) => point.id)).toEqual(["s1", "s2"]);
  });
});

describe("anchorStopPoints / reattachStopPoints (ARB-3)", () => {
  it("anchors p ≥ 1 to the p-th occurrence of the scope, p = 0 to nothing", () => {
    const occurrences = [occ("b1", "BEFORE_TOUR"), occ("a", "IN_TOUR"), occ("b", "IN_TOUR")];
    const anchored = anchorStopPoints(occurrences, [
      { id: "s1", scope: "IN_TOUR", position: 2 },
      { id: "s0", scope: "IN_TOUR", position: 0 },
    ]);
    expect(anchored.map((item) => item.anchorId)).toEqual(["b", null]);
  });

  it("recomputes scope and position from the anchor's current place, drops orphans", () => {
    const before = [occ("a", "IN_TOUR"), occ("b", "IN_TOUR"), occ("c", "IN_TOUR")];
    const anchored = anchorStopPoints(before, [
      { id: "sa", scope: "IN_TOUR", position: 1 },
      { id: "sb", scope: "IN_TOUR", position: 2 },
      { id: "s0", scope: "IN_TOUR", position: 0 },
    ]);
    const after = [occ("b", "IN_TOUR"), occ("c", "IN_TOUR"), occ("a", "AFTER_TOUR")];
    expect(reattachStopPoints(after, anchored)).toEqual([
      { id: "sa", scope: "AFTER_TOUR", position: 1 },
      { id: "sb", scope: "IN_TOUR", position: 1 },
      { id: "s0", scope: "IN_TOUR", position: 0 },
    ]);
    expect(reattachStopPoints([occ("a", "IN_TOUR")], anchored).map((point) => point.id)).toEqual(["sa", "s0"]);
  });
});

describe("stopPointDisplay (PRE-6 story 4.2, points hors placement)", () => {
  const occurrences = [occ("A", "BEFORE_TOUR"), occ("B", "IN_TOUR"), occ("C", "IN_TOUR"), occ("D", "AFTER_TOUR")];

  it("puts each point p ≥ 1 under its anchor and the AFTER_TOUR position 0 point after the Circuit", () => {
    const afterA: StopPoint = { id: "a", scope: "BEFORE_TOUR", position: 1 };
    const afterC: StopPoint = { id: "c", scope: "IN_TOUR", position: 2 };
    const afterCircuit: StopPoint = { id: "t", scope: "AFTER_TOUR", position: 0 };
    const display = stopPointDisplay(occurrences, [afterA, afterC, afterCircuit]);
    expect([...display.byOccurrenceId.entries()]).toEqual([
      ["A", afterA],
      ["C", afterC],
    ]);
    expect(display.afterCircuit).toBe(afterCircuit);
  });

  it("renders no point for a head-of-scope or out-of-range location", () => {
    const display = stopPointDisplay(occurrences, [
      { id: "x", scope: "IN_TOUR", position: 0 },
      { id: "y", scope: "BEFORE_TOUR", position: 3 },
    ]);
    expect(display.byOccurrenceId.size).toBe(0);
    expect(display.afterCircuit).toBeNull();
  });
});

describe("withoutStopPoint (PRE-6 story 4.2)", () => {
  const points: StopPoint[] = [
    { id: "a", scope: "BEFORE_TOUR", position: 1 },
    { id: "b", scope: "IN_TOUR", position: 1 },
  ];

  it("removes the point by id", () => {
    expect(withoutStopPoint(points, "a")).toEqual([points[1]]);
  });

  it("returns the same list (identity) for an unknown id", () => {
    expect(withoutStopPoint(points, "zz")).toBe(points);
  });
});
