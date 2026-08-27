import { describe, expect, it } from "@jest/globals";

import {
  formatCompositionSummary,
  formatDurationRowValue,
} from "@/features/sessions/compositionPresentation";

describe("formatCompositionSummary", () => {
  it("displays the exact local empty-state label when there is no exercise yet", () => {
    expect(
      formatCompositionSummary({
        exercise: null,
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
      }),
    ).toBe("0 activité · 0 min");
  });

  it("ignores initial/final phase seconds entirely while the draft is empty (not part of the formula)", () => {
    expect(
      formatCompositionSummary({
        exercise: null,
        initialCountdownSeconds: 999,
        finalPhaseSeconds: 999,
      }),
    ).toBe("0 activité · 0 min");
  });

  it("formats 10s + 45s + 5s = 60s as '1 activité · 1 min'", () => {
    expect(
      formatCompositionSummary({
        exercise: { name: "Gainage", durationSeconds: 45, instruction: null },
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
      }),
    ).toBe("1 activité · 1 min");
  });

  it("formats 10s + 60s + 5s = 75s as '1 activité · 2 min' (Math.ceil, never underestimating)", () => {
    expect(
      formatCompositionSummary({
        exercise: { name: "Gainage", durationSeconds: 60, instruction: null },
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
      }),
    ).toBe("1 activité · 2 min");
  });

  it("treats a null exercise duration as 0 seconds in the formula", () => {
    expect(
      formatCompositionSummary({
        exercise: { name: "Gainage", durationSeconds: null, instruction: null },
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
      }),
    ).toBe("1 activité · 1 min");
  });
});

describe("formatDurationRowValue", () => {
  it("formats 0 seconds as '00 min 00 s'", () => {
    expect(formatDurationRowValue(0)).toBe("00 min 00 s");
  });

  it("formats 10 seconds as '00 min 10 s'", () => {
    expect(formatDurationRowValue(10)).toBe("00 min 10 s");
  });

  it("formats 3599 seconds (upper bound) as '59 min 59 s'", () => {
    expect(formatDurationRowValue(3599)).toBe("59 min 59 s");
  });

  it("pads both minutes and seconds to two digits", () => {
    expect(formatDurationRowValue(65)).toBe("01 min 05 s");
  });
});
