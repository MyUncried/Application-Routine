import { describe, expect, it } from "@jest/globals";

import {
  applyTourSideModeTransition,
  cycleSideMode,
  isSideMode,
  resolveEffectiveSideMode,
  SIDE_MODES,
  sideMultiplier,
  type SideMode,
  type SideModeTransitionActivity,
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

describe("resolveEffectiveSideMode (Tour priority)", () => {
  it("keeps the Activity's own direction when the Tour is unilateral", () => {
    expect(resolveEffectiveSideMode("RIGHT_LEFT", "UNILATERAL")).toBe("RIGHT_LEFT");
    expect(resolveEffectiveSideMode("UNILATERAL", "UNILATERAL")).toBe("UNILATERAL");
  });

  it("the Tour's bilateral direction always prevails, whatever the Activity's own direction", () => {
    expect(resolveEffectiveSideMode("UNILATERAL", "RIGHT_LEFT")).toBe("RIGHT_LEFT");
    expect(resolveEffectiveSideMode("LEFT_RIGHT", "RIGHT_LEFT")).toBe("RIGHT_LEFT");
    expect(resolveEffectiveSideMode("RIGHT_LEFT", "LEFT_RIGHT")).toBe("LEFT_RIGHT");
  });

  it("BEFORE/AFTER Activities use their own side (equivalent to a UNILATERAL Tour context)", () => {
    expect(resolveEffectiveSideMode("RIGHT_LEFT", "UNILATERAL")).toBe("RIGHT_LEFT");
  });
});

describe("applyTourSideModeTransition (atomic reset of IN_TOUR children)", () => {
  function activity(
    structuralPosition: SideModeTransitionActivity["structuralPosition"],
    sideMode: SideMode,
  ): SideModeTransitionActivity {
    return { structuralPosition, sideMode };
  }

  it("resets every IN_TOUR child to UNILATERAL when the Tour becomes bilateral", () => {
    const activities = [
      activity("BEFORE_TOUR", "RIGHT_LEFT"),
      activity("IN_TOUR", "RIGHT_LEFT"),
      activity("IN_TOUR", "UNILATERAL"),
      activity("AFTER_TOUR", "LEFT_RIGHT"),
    ];
    const next = applyTourSideModeTransition(activities, "LEFT_RIGHT");
    expect(next).toEqual([
      activity("BEFORE_TOUR", "RIGHT_LEFT"),
      activity("IN_TOUR", "UNILATERAL"),
      activity("IN_TOUR", "UNILATERAL"),
      activity("AFTER_TOUR", "LEFT_RIGHT"),
    ]);
  });

  it("never touches BEFORE_TOUR/AFTER_TOUR Activities, whatever the new Tour direction", () => {
    const activities = [activity("BEFORE_TOUR", "RIGHT_LEFT"), activity("AFTER_TOUR", "LEFT_RIGHT")];
    expect(applyTourSideModeTransition(activities, "RIGHT_LEFT")).toEqual(activities);
  });

  it("does not restore any prior direction on a return to UNILATERAL — it is a no-op", () => {
    const activities = [activity("IN_TOUR", "UNILATERAL")];
    expect(applyTourSideModeTransition(activities, "UNILATERAL")).toBe(activities);
  });

  it("returns the SAME array reference when no Activity needs to change (idempotent)", () => {
    const activities = [activity("IN_TOUR", "UNILATERAL"), activity("BEFORE_TOUR", "RIGHT_LEFT")];
    expect(applyTourSideModeTransition(activities, "RIGHT_LEFT")).toBe(activities);
  });
});
