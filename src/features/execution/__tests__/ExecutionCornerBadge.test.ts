import { describe, expect, it } from "@jest/globals";

import { BADGE, cornerPath } from "../ExecutionCornerBadge";
import { RING } from "../timerRing";

/** Recette du 13/11/2026 (Hermann : cadres en coin « dans l'esprit Apple Watch »). */
describe("cadre en coin", () => {
  const centerY = RING.size / 2 + RING.outset + BADGE.above;

  it.each([343, 370, 398])("zone de %i : bras horizontal en haut, bord intérieur qui suit le cercle", (width) => {
    const path = cornerPath(width / 2, centerY);
    expect(path).not.toBeNull();
    const match = /V ([\d.]+) A ([\d.]+) [\d.]+ 0 0 0 ([\d.]+) /.exec(path!)!;
    const [rightY, radius, bottomX] = [Number(match[1]), Number(match[2]), Number(match[3])];
    // Bras horizontal assez haut pour la valeur ; bord intérieur hors des repères de l'anneau (contour compris).
    expect(rightY).toBeGreaterThanOrEqual(BADGE.round + BADGE.arm / 2);
    expect(radius - BADGE.round).toBeGreaterThanOrEqual(RING.size / 2 + RING.outset + BADGE.clearance);
    expect(bottomX).toBeGreaterThan(BADGE.round);
    expect(bottomX).toBeLessThan(BADGE.size - BADGE.round);
  });

  it("zone trop large : pas de tracé (cadre rectangulaire)", () => {
    expect(cornerPath(400, centerY)).toBeNull();
  });
});
