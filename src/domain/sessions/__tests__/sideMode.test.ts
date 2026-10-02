import { describe, expect, it } from "@jest/globals";

import {
  cycleSideMode,
  isSideMode,
  SIDE_MODES,
  sideMultiplier,
  type SideMode,
} from "@/domain/sessions/sideMode";

describe("SIDE_MODES / isSideMode", () => {
  it("lists exactly the three canonical states, in cycle order", () => {
    expect(SIDE_MODES).toEqual(["UNILATERAL", "RIGHT_LEFT", "LEFT_RIGHT"]);
  });

  it("recognizes each canonical value", () => {
    expect(isSideMode("UNILATERAL")).toBe(true);
    expect(isSideMode("RIGHT_LEFT")).toBe(true);
    expect(isSideMode("LEFT_RIGHT")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isSideMode("BILATERAL")).toBe(false);
    expect(isSideMode("")).toBe(false);
    expect(isSideMode(undefined)).toBe(false);
    expect(isSideMode(null)).toBe(false);
    expect(isSideMode(1)).toBe(false);
  });
});

describe("cycleSideMode", () => {
  it("advances Unilatéral → D→G → G→D → Unilatéral, looping indefinitely", () => {
    expect(cycleSideMode("UNILATERAL")).toBe("RIGHT_LEFT");
    expect(cycleSideMode("RIGHT_LEFT")).toBe("LEFT_RIGHT");
    expect(cycleSideMode("LEFT_RIGHT")).toBe("UNILATERAL");
  });

  it("falls back to UNILATERAL for a value outside the enumeration (defensive)", () => {
    expect(cycleSideMode("BILATERAL" as SideMode)).toBe("UNILATERAL");
  });
});

describe("sideMultiplier", () => {
  it("is 1 for UNILATERAL and 2 for any bilateral direction", () => {
    expect(sideMultiplier("UNILATERAL")).toBe(1);
    expect(sideMultiplier("RIGHT_LEFT")).toBe(2);
    expect(sideMultiplier("LEFT_RIGHT")).toBe(2);
  });
});
