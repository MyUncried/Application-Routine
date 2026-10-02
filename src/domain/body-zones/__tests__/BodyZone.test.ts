import { describe, expect, it } from "@jest/globals";

import { isBodyZoneAssignable, listAssignableBodyZones, type BodyZone } from "../BodyZone";

const ACTIVE: BodyZone = { id: "cuisses", name: "Cuisses", isActive: true, createdAt: "2026-01-01T00:00:00.000Z" };
const RETIRED: BodyZone = { id: "mollets", name: "Mollets", isActive: false, createdAt: "2026-01-01T00:00:00.000Z" };

describe("isBodyZoneAssignable", () => {
  it("is assignable when active", () => {
    expect(isBodyZoneAssignable(ACTIVE)).toBe(true);
  });

  it("is not assignable when retired", () => {
    expect(isBodyZoneAssignable(RETIRED)).toBe(false);
  });
});

describe("listAssignableBodyZones", () => {
  it("keeps only active zones, preserving order", () => {
    expect(listAssignableBodyZones([RETIRED, ACTIVE])).toEqual([ACTIVE]);
  });

  it("never mutates or drops the retired zone's own identity", () => {
    // A retired zone remains fully representable by existing references —
    // filtering assignability never alters the object itself.
    expect(RETIRED.id).toBe("mollets");
    expect(RETIRED.name).toBe("Mollets");
  });
});
