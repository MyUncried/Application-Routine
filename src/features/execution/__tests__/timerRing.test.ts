import { describe, expect, it } from "@jest/globals";

import { tourSegments } from "@/features/execution/ExecutionScreen";
import { arcPath, MINOR_MARKS, pointAt, QUARTER_MARKS, ringFraction } from "@/features/execution/timerRing";

/** Fin de PRE-10 — chrono circulaire et piste par Tours de l'écran d'Exécution (Figma `1992:8132`, ch08, ch10 RM-077). */
describe("fin de PRE-10 — chrono circulaire", () => {
  it("compte à rebours : part écoulée de l'étape", () => {
    expect(ringFraction({ kind: "COUNTDOWN", remainingMs: 24_000, totalMs: 32_000, elapsedMs: 8_000 })).toBe(0.25);
    expect(ringFraction({ kind: "COUNTDOWN", remainingMs: 0, totalMs: 0, elapsedMs: 0 })).toBe(0);
  });

  it("chronomètre sans fin nominale : un tour par minute, puis recommence (ch08)", () => {
    expect(ringFraction({ kind: "STOPWATCH", elapsedMs: 15_000, nominalMs: null })).toBe(0.25);
    expect(ringFraction({ kind: "STOPWATCH", elapsedMs: 61_000, nominalMs: null })).toBeCloseTo(1 / 60);
  });

  it("chronomètre avec fin nominale : part de la fin nominale, bornée à 1 ; sans chrono : 0", () => {
    expect(ringFraction({ kind: "STOPWATCH", elapsedMs: 20_000, nominalMs: 40_000 })).toBe(0.5);
    expect(ringFraction({ kind: "STOPWATCH", elapsedMs: 90_000, nominalMs: 40_000 })).toBe(1);
    expect(ringFraction({ kind: "NONE" })).toBe(0);
  });

  it("géométrie : départ en haut, sens horaire ; repères tous les 18°, quarts à part", () => {
    expect(pointAt(0, 100, 150)).toEqual({ x: 150, y: 50 });
    const quarter = pointAt(0.25, 100, 150);
    expect(quarter.x).toBeCloseTo(250);
    expect(quarter.y).toBeCloseTo(150);
    expect(arcPath(0.75, 100, 150)).toBe("M 150 50 A 100 100 0 1 1 50 150");
    expect(MINOR_MARKS).toHaveLength(16);
    expect(QUARTER_MARKS).toEqual([0.25, 0.5, 0.75]);
  });
});

describe("fin de PRE-10 — piste structurée par Tours (repères de lecture, RM-077)", () => {
  it("un segment par Tour, avancement global réparti dans l'ordre ; un seul segment sans Circuit", () => {
    expect(tourSegments({ progress: 0.5, tour: { current: 2, total: 3 } }).map((fill) => Math.round(fill * 100) / 100)).toEqual([1, 0.5, 0]);
    expect(tourSegments({ progress: 0.4, tour: null })).toEqual([0.4]);
    expect(tourSegments({ progress: 1, tour: { current: 3, total: 3 } })).toEqual([1, 1, 1]);
  });
});
