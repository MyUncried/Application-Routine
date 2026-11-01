import { describe, expect, it } from "@jest/globals";

import type { EnvelopeSpanReach } from "@/domain/sessions/layoutOperations";
import { edgeIndexAt, envelopeSegmentMotion } from "@/features/sessions/EnvelopePerimeter";

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

/**
 * Contre-recette n° 4 du 01/11/2026 (b4b-etendre, Hermann : « ce n'est pas seulement le trait qui doit se
 * déplacer mais le bord du cadre avec le trait ») — échelle de la bande d'une part de cadre en fonction
 * de la translation du trait (arrondis de 12).
 */
describe("Contre-recette n° 4 — envelopeSegmentMotion", () => {
  const scaleAt = (motion: ReturnType<typeof envelopeSegmentMotion>, translation: number) => {
    const [from, to] = motion.inputRange;
    const [low, high] = motion.outputRange;
    const raw = low + ((translation - from) / (to - from)) * (high - low);
    const min = Math.min(low, high);
    const max = Math.max(low, high);
    const belowFrom = translation < from;
    const clampLow = belowFrom ? motion.extrapolateLeft === "clamp" : motion.extrapolateRight === "clamp";
    return clampLow ? Math.min(max, Math.max(min, raw)) : raw;
  };

  it("bord bas, périmètre d'une carte (80) : au repos, bande entière ; tiré de 60, la bande s'allonge de 60", () => {
    const motion = envelopeSegmentMotion("BOTTOM", { height: 80, radius: 12, first: true, last: true, edgeOffset: 80 });
    expect(motion).toMatchObject({ bandTop: 12, bandHeight: 56, origin: "top" });
    expect(scaleAt(motion, 0)).toBeCloseTo(1);
    expect(scaleAt(motion, 60) * motion.bandHeight).toBeCloseTo(56 + 60);
    // Réduit de 30 : la bande raccourcit d'autant ; jamais négative.
    expect(scaleAt(motion, -30) * motion.bandHeight).toBeCloseTo(26);
    expect(scaleAt(motion, -200)).toBe(0);
  });

  it("bord bas, périmètre de deux unités : la première est coupée par le trait qui remonte en elle, jamais étirée", () => {
    // Première unité : 0–84 (écart compris), bord bas du périmètre à 172.
    const first = envelopeSegmentMotion("BOTTOM", { height: 84, radius: 12, first: true, last: false, edgeOffset: 172 });
    expect(scaleAt(first, 0)).toBe(1);
    expect(scaleAt(first, 60)).toBe(1);
    // Trait au milieu de la première unité (42) : la bande s'arrête 12 au-dessus (arrondi bas porté par le trait).
    expect(scaleAt(first, 42 - 172) * first.bandHeight).toBeCloseTo(42 - 12 - 12);
  });

  it("bord haut : la bande s'allonge vers le haut (origine en bas) ; la dernière unité n'est jamais étirée", () => {
    const only = envelopeSegmentMotion("TOP", { height: 80, radius: 12, first: true, last: true, edgeOffset: 0 });
    expect(only.origin).toBe("bottom");
    expect(scaleAt(only, 0)).toBeCloseTo(1);
    expect(scaleAt(only, -40) * only.bandHeight).toBeCloseTo(56 + 40);
    const last = envelopeSegmentMotion("TOP", { height: 84, radius: 12, first: false, last: true, edgeOffset: -88 });
    expect(scaleAt(last, -50)).toBe(1);
  });
});
