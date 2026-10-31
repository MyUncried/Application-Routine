import { describe, expect, it } from "@jest/globals";

import type { EnvelopeSpanReach } from "@/domain/sessions/layoutOperations";
import { edgeIndexAt } from "@/features/sessions/EnvelopePerimeter";

/**
 * PRE-9 B.4b — calage du bord d'un périmètre sur la limite d'élément la plus proche du doigt
 * (« appui sur les traits puis glissement »). Jest ne prouve pas le geste sur iPhone.
 */

const run = ["a", "b", "c", "d"].map((id) => ({ kind: "EXERCISE" as const, id }));
// Quatre cartes de 80, écart 8 : a 0–80, b 88–168, c 176–256, d 264–344.
const rects = [0, 88, 176, 264].map((top) => ({ top, bottom: top + 80 }));
const reach: EnvelopeSpanReach = { run, start: 1, end: 2 };

describe("B.4b — edgeIndexAt", () => {
  it("bord haut : le haut le plus proche, de la tête de l'étendue jusqu'au dernier contenu du périmètre", () => {
    expect(edgeIndexAt(rects, "TOP", reach, 10)).toBe(0);
    expect(edgeIndexAt(rects, "TOP", reach, 100)).toBe(1);
    expect(edgeIndexAt(rects, "TOP", reach, 170)).toBe(2);
    // Au-delà du dernier contenu du périmètre : borné (jamais vide).
    expect(edgeIndexAt(rects, "TOP", reach, 340)).toBe(2);
  });

  it("bord bas : le bas le plus proche, du premier contenu du périmètre jusqu'à la fin de l'étendue", () => {
    expect(edgeIndexAt(rects, "BOTTOM", reach, 350)).toBe(3);
    expect(edgeIndexAt(rects, "BOTTOM", reach, 230)).toBe(2);
    expect(edgeIndexAt(rects, "BOTTOM", reach, 0)).toBe(1);
  });

  it("mesures absentes : aucun calage ; mesures partielles : seules les connues comptent", () => {
    expect(edgeIndexAt([null, null, null, null], "TOP", reach, 10)).toBeNull();
    expect(edgeIndexAt([null, rects[1]!, rects[2]!, null], "BOTTOM", reach, 344)).toBe(2);
  });
});
