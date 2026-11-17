import { describe, expect, it, jest } from "@jest/globals";
import * as Haptics from "expo-haptics";

import { deviceVibration, MEDIUM_TAP_INTERVAL_MS } from "../ExecutionVibration";

/** Vibrations de séance : décision de Hermann du 10/11/2026 (« Mélange »). */
function setup() {
  const impacts: Haptics.ImpactFeedbackStyle[] = [];
  const delays: number[] = [];
  const vibrate = jest.fn();
  const port = deviceVibration({
    impactAsync: async (style) => {
      impacts.push(style ?? Haptics.ImpactFeedbackStyle.Medium);
    },
    vibrate,
    later: (run, delayMs) => {
      delays.push(delayMs);
      run();
    },
  });
  return { port, impacts, delays, vibrate };
}

describe("vibrations de séance", () => {
  it("forte : vibration classique de l'iPhone, sans tapotement", () => {
    const { port, impacts, vibrate } = setup();
    port.vibrate("HEAVY");
    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(impacts).toEqual([]);
  });

  it("moyenne : trois tapotements rapprochés", () => {
    const { port, impacts, delays, vibrate } = setup();
    port.vibrate("MEDIUM");
    expect(impacts).toEqual([Haptics.ImpactFeedbackStyle.Heavy, Haptics.ImpactFeedbackStyle.Heavy, Haptics.ImpactFeedbackStyle.Heavy]);
    expect(delays).toEqual([MEDIUM_TAP_INTERVAL_MS, 2 * MEDIUM_TAP_INTERVAL_MS]);
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("tapotement fort : un seul tapotement, au plus fort (dernières secondes, recette du 13/11/2026)", () => {
    const { port, impacts, delays, vibrate } = setup();
    port.vibrate("TAP");
    expect(impacts).toEqual([Haptics.ImpactFeedbackStyle.Heavy]);
    expect(delays).toEqual([]);
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("légère : un tapotement", () => {
    const { port, impacts, vibrate } = setup();
    port.vibrate("LIGHT");
    expect(impacts).toEqual([Haptics.ImpactFeedbackStyle.Light]);
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("un échec natif n'interrompt rien", () => {
    const port = deviceVibration({
      impactAsync: () => {
        throw new Error("absent");
      },
      vibrate: () => {
        throw new Error("absent");
      },
      later: () => undefined,
    });
    expect(() => {
      port.vibrate("HEAVY");
      port.vibrate("LIGHT");
    }).not.toThrow();
  });
});
