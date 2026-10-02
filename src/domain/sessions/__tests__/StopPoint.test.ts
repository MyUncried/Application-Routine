import { describe, expect, it } from "@jest/globals";

import {
  hasUniqueOrderPerScope,
  isStopPointPlacementValid,
  orderStopPointsByScope,
  type StopPoint,
} from "../StopPoint";

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

describe("hasUniqueOrderPerScope", () => {
  it("rejects a duplicate order within the same scope", () => {
    const points: readonly StopPoint[] = [
      { id: "s1", scope: "IN_TOUR", order: 0 },
      { id: "s2", scope: "IN_TOUR", order: 0 },
    ];
    expect(hasUniqueOrderPerScope(points)).toBe(false);
  });

  it("allows the same order across two distinct scopes", () => {
    const points: readonly StopPoint[] = [
      { id: "s1", scope: "BEFORE_TOUR", order: 0 },
      { id: "s2", scope: "AFTER_TOUR", order: 0 },
    ];
    expect(hasUniqueOrderPerScope(points)).toBe(true);
  });
});

describe("orderStopPointsByScope", () => {
  it("orders by ascending order within the requested scope only", () => {
    const points: readonly StopPoint[] = [
      { id: "s2", scope: "IN_TOUR", order: 1 },
      { id: "s1", scope: "IN_TOUR", order: 0 },
      { id: "s3", scope: "AFTER_TOUR", order: 0 },
    ];
    expect(orderStopPointsByScope(points, "IN_TOUR").map((point) => point.id)).toEqual([
      "s1",
      "s2",
    ]);
  });
});
