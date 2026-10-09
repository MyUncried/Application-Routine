import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  createHoldRepeater,
  EXECUTION_ACCELERATED_HOLD_POLICY,
  EXECUTION_UNIT_HOLD_POLICY,
  PROFILE_HOLD_POLICY,
  steppedValue,
  type StepperHoldPolicy,
} from "@/shared/ui/ProfileStepper";

/**
 * PRE-3 (R-2) — suite RÉSERVÉE à la politique de geste OPTIONNELLE de la
 * feuille Paramètres. Les contrats D-227 du stepper Profil restent prouvés
 * par `ProfileStepper.test.tsx` (conservée et relancée, jamais recopiée ici).
 */

function simulate(policy: StepperHoldPolicy, start: number, min: number, max: number) {
  let clock = 0;
  let value = start;
  const values: number[] = [];
  const repeater = createHoldRepeater(
    policy,
    (direction, stepSize) => {
      value = steppedValue(value, direction, stepSize, min, max);
      values.push(value);
    },
    () => clock,
  );
  return {
    values,
    get value() {
      return value;
    },
    advance(ms: number) {
      for (let elapsed = 0; elapsed < ms; elapsed += 10) {
        clock += 10;
        jest.advanceTimersByTime(10);
      }
    },
    repeater,
  };
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("Politique de maintien PRE-3 (ProfileStepper.tsx, option)", () => {
  it("P3-19/hold — tap 1 ; rien avant 500 ms ; répétition 150 ms ; paliers 1/5/10 à 2 s/4 s en multiples directionnels ; bornes ; arrêt immédiat sans pas au relâchement", () => {
    const tap = simulate(EXECUTION_ACCELERATED_HOLD_POLICY, 37, 0, 300);
    tap.repeater.start(1);
    tap.repeater.stop();
    tap.advance(1000);
    expect(tap.values).toEqual([38]);

    const hold = simulate(EXECUTION_ACCELERATED_HOLD_POLICY, 37, 0, 300);
    hold.repeater.start(1);
    hold.advance(490);
    expect(hold.values).toEqual([38]);
    hold.advance(10); // 500 ms : première répétition
    expect(hold.values).toEqual([38, 39]);
    hold.advance(150);
    expect(hold.values).toEqual([38, 39, 40]);
    hold.advance(2000 - 650); // 2 s : pas 5 en multiple directionnel
    const atTwoSeconds = hold.values.length;
    hold.advance(150);
    expect(hold.values[atTwoSeconds]! % 5).toBe(0);
    expect(hold.values[atTwoSeconds]! - hold.values[atTwoSeconds - 1]!).toBeLessThanOrEqual(5);
    hold.advance(4000 - 2150); // 4 s : pas 10
    const afterFour = hold.values.slice(-2);
    hold.advance(150);
    expect(hold.value % 10).toBe(0);
    expect(hold.value - afterFour[1]!).toBeLessThanOrEqual(10);
    // Saturation à la borne haute, puis relâchement : plus aucun pas.
    hold.advance(10_000);
    expect(hold.value).toBe(300);
    hold.repeater.stop();
    const frozen = hold.values.length;
    hold.advance(2000);
    expect(hold.values.length).toBe(frozen);

    // Multiples directionnels à la descente et borne basse.
    expect(steppedValue(37, -1, 5, 0, 300)).toBe(35);
    expect(steppedValue(37, 1, 10, 0, 300)).toBe(40);
    expect(steppedValue(3, -1, 10, 0, 300)).toBe(0);
    expect(steppedValue(1, -1, 1, 1, 99)).toBe(1);
  });

  it("P3-19/non-accelerated — Bip/CR/Fin au pas 1 au-delà de 4 s ; le Profil garde 450 ms et le pas 1", () => {
    const beep = simulate(EXECUTION_UNIT_HOLD_POLICY, 0, 0, 10);
    beep.repeater.start(1);
    beep.advance(6000);
    const deltas = beep.values.map((value, index) => value - (index === 0 ? 0 : beep.values[index - 1]!));
    expect(deltas.every((delta) => delta <= 1)).toBe(true);
    expect(beep.value).toBe(10);

    const countdown = simulate(EXECUTION_UNIT_HOLD_POLICY, 10, 0, 60);
    countdown.repeater.start(1);
    countdown.advance(5000);
    expect(countdown.values.slice(0, 5)).toEqual([11, 12, 13, 14, 15]);

    expect(PROFILE_HOLD_POLICY.initialDelayMs).toBe(450);
    expect(PROFILE_HOLD_POLICY.intervalMs).toBe(150);
    expect(PROFILE_HOLD_POLICY.stepAfter(10_000)).toBe(1);
    expect(EXECUTION_UNIT_HOLD_POLICY.stepAfter(10_000)).toBe(1);
  });

  it("P3-22/scope-regression — la politique PRE-3 est opt-in : aucune constante Profil réécrite, le Profil n'utilise jamais l'accélération", () => {
    const profile = simulate(PROFILE_HOLD_POLICY, 10, 0, 300);
    profile.repeater.start(1);
    profile.advance(440);
    expect(profile.values).toEqual([11]);
    profile.advance(10);
    expect(profile.values).toEqual([11, 12]);
    profile.advance(5000);
    profile.repeater.stop();
    const deltas = profile.values.map((value, index) => value - (index === 0 ? 10 : profile.values[index - 1]!));
    expect(new Set(deltas)).toEqual(new Set([1]));
    expect(EXECUTION_ACCELERATED_HOLD_POLICY).not.toBe(PROFILE_HOLD_POLICY);
  });
});
