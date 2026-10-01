import { describe, expect, it } from "@jest/globals";

import { MIGRATION_007 } from "@/infrastructure/database/migrations/migration007";
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

/**
 * V2-PRE-1 (plan §3.1, UI-5FAB9AD7AB21, REQ-E7260E768F020CE0) : ce module
 * n'est plus l'autorité runtime des Zones corporelles — son seul rôle
 * restant, vérifié ici, est de fournir le SEED consommé une fois par
 * `migration007.ts` pour peupler la table persistante `body_zones`. Toute
 * lecture d'écran passe désormais par `BodyZoneRepository`
 * (`SqliteBodyZoneRepository`), jamais par `BODY_ZONES`.
 */
describe("BODY_ZONES — rôle de seed historique uniquement (V2-PRE-1)", () => {
  it("feeds migration007's seed SQL with exactly its own ids and names, in its own order — its only remaining consumer", () => {
    for (const zone of BODY_ZONES) {
      const escapedName = zone.name.replace(/'/g, "''");
      expect(MIGRATION_007).toContain(`('${zone.id}', '${escapedName}', 1,`);
    }
    // L'ordre d'apparition dans le SQL de seed suit l'ordre du tableau —
    // jamais un tri indépendant qui romprait la correspondance avec l'ordre
    // historique déjà documenté ci-dessus (`order` contigu 0..9).
    const positions = BODY_ZONES.map((zone) => MIGRATION_007.indexOf(`'${zone.id}'`));
    const sortedPositions = [...positions].sort((a, b) => a - b);
    expect(positions).toEqual(sortedPositions);
  });

  it("carries only the seed shape (id/name/order) — never the runtime fields (isActive/createdAt) owned by the persisted referential", () => {
    for (const zone of BODY_ZONES) {
      expect(Object.keys(zone).sort()).toEqual(["id", "name", "order"]);
    }
  });
});
