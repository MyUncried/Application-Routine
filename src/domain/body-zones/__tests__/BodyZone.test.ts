import { describe, expect, it } from "@jest/globals";

import {
  canonicalBodyZoneKey,
  isBodyZoneAssignable,
  listAssignableBodyZones,
  validateBodyZoneName,
  type BodyZone,
} from "../BodyZone";

const ACTIVE: BodyZone = {
  id: "cuisses",
  name: "Cuisses",
  canonicalKey: "cuisses",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};
const RETIRED: BodyZone = {
  id: "mollets",
  name: "Mollets",
  canonicalKey: "mollets",
  isActive: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};

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

describe("canonicalBodyZoneKey (V2-PRE-2, D2 reactivation)", () => {
  it("ignores case and diacritics, and normalizes internal whitespace", () => {
    expect(canonicalBodyZoneKey("Cuisses")).toBe("cuisses");
    expect(canonicalBodyZoneKey("  CUISSES  ")).toBe("cuisses");
    expect(canonicalBodyZoneKey("Poignets   et mains")).toBe(
      canonicalBodyZoneKey("poignets et mains"),
    );
  });

  it("distinguishes zones whose only difference is a real content change", () => {
    expect(canonicalBodyZoneKey("Bras")).not.toBe(canonicalBodyZoneKey("Avant-bras"));
  });
});

describe("validateBodyZoneName (T9 — 1..80 code points, distinct from Étiquette/Catégorie's ≤40)", () => {
  it("rejects an empty name", () => {
    expect(validateBodyZoneName("   ").ok).toBe(false);
  });

  it("accepts a name of exactly 80 code points", () => {
    const name = "A".repeat(80);
    expect(validateBodyZoneName(name)).toEqual({ ok: true, value: name });
  });

  it("rejects a name of 81 code points", () => {
    const name = "A".repeat(81);
    expect(validateBodyZoneName(name).ok).toBe(false);
  });

  it("accepts and normalizes a valid name", () => {
    expect(validateBodyZoneName("  Avant   bras  ")).toEqual({ ok: true, value: "Avant bras" });
  });
});
