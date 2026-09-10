import { describe, expect, it } from "@jest/globals";

import { BODY_ZONES } from "@/features/reference-data/bodyZones";

describe("BODY_ZONES (T01-S08, D-093 — référentiel MVP)", () => {
  it("contains exactly 10 zones", () => {
    expect(BODY_ZONES).toHaveLength(10);
  });

  it("has a unique id for every zone", () => {
    const ids = BODY_ZONES.map((zone) => zone.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has a unique, contiguous 0-indexed order for every zone", () => {
    const orders = BODY_ZONES.map((zone) => zone.order).sort((a, b) => a - b);
    expect(orders).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("never includes a 'Corps entier' (whole-body) entry", () => {
    const names = BODY_ZONES.map((zone) => zone.name.toLowerCase());
    expect(names.some((name) => name.includes("corps entier"))).toBe(false);
  });

  it("never distinguishes a left/right (gauche/droite) side for any zone", () => {
    const names = BODY_ZONES.map((zone) => zone.name.toLowerCase());
    expect(names.some((name) => name.includes("gauche") || name.includes("droit"))).toBe(false);
  });

  it("has no empty name and no blank id", () => {
    for (const zone of BODY_ZONES) {
      expect(zone.name.trim().length).toBeGreaterThan(0);
      expect(zone.id.trim().length).toBeGreaterThan(0);
    }
  });
});
