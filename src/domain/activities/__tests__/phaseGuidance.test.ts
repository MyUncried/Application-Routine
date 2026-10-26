/**
 * PRE-7 (R-2, D-446, PHC-20261026 ; arbitrage de Hermann du 26/10/2026, §1, §3,
 * §4, Q4, Q8) — règle pure du guidage par phases : enchaînement, bouclage du
 * motif, arrêt à la cible de Durée (même au milieu d'une phase), absence de fin
 * par le guidage en Répétitions et À l'échec, reprise à la première phase,
 * cycles comptés, entrées invalides, durée nominale.
 */

import { describe, expect, it } from "@jest/globals";

import { failureTarget, numberTarget, unsetTarget } from "@/domain/activities/ExecutionParameters";
import {
  nominalGuidanceSeconds,
  phaseGuidanceAt,
  seriesGuidanceLimitSeconds,
  workPhasesCycleSeconds,
} from "@/domain/activities/phaseGuidance";

/** Motif [5 s, 2 s] (durée 7 s). */
const pattern = [{ durationSeconds: 5 }, { durationSeconds: 2 }] as const;

describe("phaseGuidance — PRE-7 R-2 (D-446)", () => {
  it("durée du motif : Σ des phases ; null sans phase ou avec une durée manquante", () => {
    expect(workPhasesCycleSeconds(pattern)).toBe(7);
    expect(workPhasesCycleSeconds([])).toBeNull();
    expect(workPhasesCycleSeconds([{ durationSeconds: 5 }, { durationSeconds: 0 }])).toBeNull();
  });

  it("enchaînement [5, 2] : t = 0 → phase 1, t = 4 → phase 1, t = 5 → phase 2, t = 6 → phase 2", () => {
    expect(phaseGuidanceAt(pattern, 0, null)).toEqual({
      ended: false,
      phaseIndex: 0,
      phaseElapsedSeconds: 0,
      phaseRemainingSeconds: 5,
      completedCycles: 0,
    });
    expect(phaseGuidanceAt(pattern, 4, null)).toMatchObject({ phaseIndex: 0, phaseElapsedSeconds: 4, phaseRemainingSeconds: 1 });
    expect(phaseGuidanceAt(pattern, 5, null)).toMatchObject({ phaseIndex: 1, phaseElapsedSeconds: 0, phaseRemainingSeconds: 2 });
    expect(phaseGuidanceAt(pattern, 6, null)).toMatchObject({ phaseIndex: 1, phaseElapsedSeconds: 1, phaseRemainingSeconds: 1 });
  });

  it("bouclage : t = 7 revient à la phase 1 (1 cycle) ; t = 15 → phase 1, 1 s écoulée, 2 cycles", () => {
    expect(phaseGuidanceAt(pattern, 7, null)).toEqual({
      ended: false,
      phaseIndex: 0,
      phaseElapsedSeconds: 0,
      phaseRemainingSeconds: 5,
      completedCycles: 1,
    });
    expect(phaseGuidanceAt(pattern, 15, null)).toEqual({
      ended: false,
      phaseIndex: 0,
      phaseElapsedSeconds: 1,
      phaseRemainingSeconds: 4,
      completedCycles: 2,
    });
  });

  it("Durée 120 s : arrêt à la cible au milieu d'une phase (t = 120 et t = 130 → terminé, 17 cycles, phase 1)", () => {
    const limit = seriesGuidanceLimitSeconds("DURATION", numberTarget(120));
    expect(limit).toBe(120);
    const expected = { ended: true, phaseIndex: 0, phaseElapsedSeconds: 1, phaseRemainingSeconds: 4, completedCycles: 17 };
    expect(phaseGuidanceAt(pattern, 120, limit)).toEqual(expected);
    expect(phaseGuidanceAt(pattern, 130, limit)).toEqual(expected);
    // Juste avant la cible : le guidage continue.
    expect(phaseGuidanceAt(pattern, 119, limit)).toMatchObject({ ended: false, phaseIndex: 0, completedCycles: 17 });
  });

  it("À l'échec et Répétitions : aucune limite ; le motif boucle sans fin, même à t très grand (Q4)", () => {
    expect(seriesGuidanceLimitSeconds("DURATION", failureTarget())).toBeNull();
    expect(seriesGuidanceLimitSeconds("REPETITIONS", numberTarget(10))).toBeNull();
    expect(seriesGuidanceLimitSeconds("REPETITIONS", failureTarget())).toBeNull();
    expect(seriesGuidanceLimitSeconds(null, unsetTarget())).toBeNull();
    const far = 7 * 1_000_000 + 6;
    expect(phaseGuidanceAt(pattern, far, null)).toEqual({
      ended: false,
      phaseIndex: 1,
      phaseElapsedSeconds: 1,
      phaseRemainingSeconds: 1,
      completedCycles: 1_000_000,
    });
  });

  it("chaque passage reprend à la première phase : t = 0 → phase 1, aucun cycle", () => {
    expect(phaseGuidanceAt(pattern, 0, 120)).toMatchObject({ ended: false, phaseIndex: 0, phaseElapsedSeconds: 0, completedCycles: 0 });
    expect(phaseGuidanceAt([{ durationSeconds: 3 }], 0, null)).toMatchObject({ phaseIndex: 0, completedCycles: 0 });
  });

  it("un cycle complet est compté à la fin du motif, pas avant", () => {
    expect(phaseGuidanceAt(pattern, 6.999, null).completedCycles).toBe(0);
    expect(phaseGuidanceAt(pattern, 7, null).completedCycles).toBe(1);
    expect(phaseGuidanceAt(pattern, 14, null).completedCycles).toBe(2);
    // Cible égale à un nombre entier de motifs : terminé au début du cycle suivant.
    expect(phaseGuidanceAt(pattern, 14, 14)).toMatchObject({ ended: true, completedCycles: 2, phaseIndex: 0, phaseElapsedSeconds: 0 });
  });

  it("instant non entier proche d'une frontière : phase cohérente, temps écoulé et restant jamais négatifs", () => {
    const before = phaseGuidanceAt(pattern, 6.9999999, null);
    expect(before).toMatchObject({ ended: false, phaseIndex: 1, completedCycles: 0 });
    expect(before.phaseElapsedSeconds).toBeGreaterThanOrEqual(0);
    expect(before.phaseRemainingSeconds).toBeGreaterThan(0);
    const after = phaseGuidanceAt(pattern, 7.0000001, null);
    expect(after).toMatchObject({ ended: false, phaseIndex: 0, completedCycles: 1 });
    expect(after.phaseElapsedSeconds).toBeGreaterThanOrEqual(0);
    expect(after.phaseElapsedSeconds).toBeLessThan(0.001);
    for (const elapsed of [4.9999999, 5.0000001, 0.1 + 0.2, 7 * 3 - 1e-9, 7 * 1e6 + 1e-7]) {
      const state = phaseGuidanceAt(pattern, elapsed, null);
      expect(state.phaseIndex === 0 || state.phaseIndex === 1).toBe(true);
      expect(state.phaseElapsedSeconds).toBeGreaterThanOrEqual(0);
      expect(state.phaseRemainingSeconds).toBeGreaterThanOrEqual(0);
      expect(state.phaseElapsedSeconds + state.phaseRemainingSeconds).toBeCloseTo(pattern[state.phaseIndex]!.durationSeconds, 6);
    }
  });

  it("entrées invalides : motif vide ou incomplet, instant ou limite négatif ou non fini → lève", () => {
    expect(() => phaseGuidanceAt([], 0, null)).toThrow();
    expect(() => phaseGuidanceAt([{ durationSeconds: 5 }, { durationSeconds: 0 }], 0, null)).toThrow();
    expect(() => phaseGuidanceAt(pattern, -1, null)).toThrow();
    expect(() => phaseGuidanceAt(pattern, Number.NaN, null)).toThrow();
    expect(() => phaseGuidanceAt(pattern, Number.POSITIVE_INFINITY, null)).toThrow();
    expect(() => phaseGuidanceAt(pattern, 0, -1)).toThrow();
    expect(() => phaseGuidanceAt(pattern, 0, Number.NaN)).toThrow();
  });

  it("durée nominale : 10 rép. × 7 s = 70 ; Durée 120 → 120 ; À l'échec → null ; motif incomplet → null", () => {
    expect(nominalGuidanceSeconds("REPETITIONS", numberTarget(10), pattern)).toBe(70);
    expect(nominalGuidanceSeconds("DURATION", numberTarget(120), pattern)).toBe(120);
    expect(nominalGuidanceSeconds("DURATION", numberTarget(120), [])).toBe(120);
    expect(nominalGuidanceSeconds("REPETITIONS", failureTarget(), pattern)).toBeNull();
    expect(nominalGuidanceSeconds("DURATION", failureTarget(), pattern)).toBeNull();
    expect(nominalGuidanceSeconds("REPETITIONS", numberTarget(10), [{ durationSeconds: 5 }, { durationSeconds: 0 }])).toBeNull();
    expect(nominalGuidanceSeconds("REPETITIONS", numberTarget(10), [])).toBeNull();
  });
});
