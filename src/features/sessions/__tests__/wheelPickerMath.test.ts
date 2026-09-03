import { describe, expect, it } from "@jest/globals";

import {
  WHEEL_EXERCISE_DURATION_SECONDS_MAX,
  WHEEL_NUMBER_MAX,
  WHEEL_NUMBER_MIN,
  WHEEL_PAUSE_SECONDS_MAX,
  WHEEL_SECONDS_ITEM_COUNT,
  WHEEL_SECONDS_MAX_INDEX,
  WHEEL_SECONDS_STEP,
  WHEEL_TOTAL_SECONDS_MAX,
  clampIndex,
  formatTwoDigits,
  fromTotalSeconds,
  indexToOffset,
  minutesMaxIndexFor,
  offsetToIndex,
  secondsIndexToValue,
  secondsValueToIndex,
  toTotalSeconds,
} from "@/features/sessions/wheelPickerMath";

describe("clampIndex", () => {
  it("leaves an in-range index unchanged", () => {
    expect(clampIndex(30, 59)).toBe(30);
  });

  it("clamps a negative index to 0 (lower bound)", () => {
    expect(clampIndex(-5, 59)).toBe(0);
  });

  it("clamps an excessive index to max (upper bound)", () => {
    expect(clampIndex(120, 59)).toBe(59);
  });
});

describe("offsetToIndex", () => {
  it("rounds to the nearest row index", () => {
    expect(offsetToIndex(0, 40, 59)).toBe(0);
    expect(offsetToIndex(40, 40, 59)).toBe(1);
    expect(offsetToIndex(59, 40, 59)).toBe(1); // rounds down, closer to index 1 than 2
    expect(offsetToIndex(61, 40, 59)).toBe(2); // rounds up
  });

  it("clamps a negative offset (overscroll) to 0", () => {
    expect(offsetToIndex(-20, 40, 59)).toBe(0);
  });

  it("clamps an offset beyond the last row to max", () => {
    expect(offsetToIndex(999999, 40, 59)).toBe(59);
  });

  it("falls back to index 0 rather than NaN/Infinity when itemHeight is not yet laid out (<= 0)", () => {
    expect(offsetToIndex(40, 0, 59)).toBe(0);
    expect(offsetToIndex(40, -1, 59)).toBe(0);
  });
});

describe("indexToOffset", () => {
  it("is the exact inverse used for final alignment correction", () => {
    expect(indexToOffset(0, 40)).toBe(0);
    expect(indexToOffset(1, 40)).toBe(40);
    expect(indexToOffset(59, 40)).toBe(2360);
  });
});

describe("toTotalSeconds", () => {
  it("converts 0 min 00 s to 0 seconds", () => {
    expect(toTotalSeconds(0, 0)).toBe(0);
  });

  it("converts 59 min 59 s to 3599 seconds (upper bound)", () => {
    expect(toTotalSeconds(59, 59)).toBe(3599);
  });

  it("converts an arbitrary in-range value", () => {
    expect(toTotalSeconds(1, 15)).toBe(75);
  });

  it("clamps a theoretically negative total to 0 (lower bound)", () => {
    expect(toTotalSeconds(-1, -5)).toBe(0);
  });

  it("clamps a theoretically excessive total to 3599 (upper bound)", () => {
    expect(toTotalSeconds(99, 99)).toBe(WHEEL_TOTAL_SECONDS_MAX);
  });
});

describe("fromTotalSeconds — secondes ramenées au pas de 5 (CE-T01-07/14, résolution de l'ARBITRAGE 1)", () => {
  it("decomposes 0 seconds into 0 min 00 s", () => {
    expect(fromTotalSeconds(0)).toEqual({ minutes: 0, seconds: 0 });
  });

  it("decomposes 3599 seconds into 59 min 55 s — 59 s is not a multiple of 5, rounded down to the last valid step (upper bound)", () => {
    expect(fromTotalSeconds(3599)).toEqual({ minutes: 59, seconds: 55 });
  });

  it("decomposes an arbitrary in-range value already a multiple of the step unchanged", () => {
    expect(fromTotalSeconds(75)).toEqual({ minutes: 1, seconds: 15 });
  });

  it("rounds an arbitrary value that is NOT a multiple of the step to the nearest one", () => {
    expect(fromTotalSeconds(77)).toEqual({ minutes: 1, seconds: 15 }); // 17s -> nearest step is 15
    expect(fromTotalSeconds(78)).toEqual({ minutes: 1, seconds: 20 }); // 18s -> nearest step is 20
  });

  it("clamps a negative input to 0 min 00 s (lower bound)", () => {
    expect(fromTotalSeconds(-10)).toEqual({ minutes: 0, seconds: 0 });
  });

  it("clamps an excessive input to 59 min 55 s (upper bound, last valid step)", () => {
    expect(fromTotalSeconds(999999)).toEqual({ minutes: 59, seconds: 55 });
  });

  it("round-trips with toTotalSeconds for every bound already aligned to the step", () => {
    expect(toTotalSeconds(0, 0)).toBe(0);
    expect(fromTotalSeconds(toTotalSeconds(0, 0))).toEqual({ minutes: 0, seconds: 0 });
    expect(fromTotalSeconds(toTotalSeconds(59, 55))).toEqual({ minutes: 59, seconds: 55 });
  });
});

describe("WHEEL_SECONDS_STEP / secondsIndexToValue / secondsValueToIndex (CE-T01-07/14, résolution de l'ARBITRAGE 1)", () => {
  it("the step is exactly 5, per CE-T01-07 ('Les secondes avancent par pas de 5'), CE-T01-14 referring to the same contract", () => {
    expect(WHEEL_SECONDS_STEP).toBe(5);
  });

  it("exposes exactly 12 visible second values (0, 5, …, 55) and a max index of 11", () => {
    expect(WHEEL_SECONDS_ITEM_COUNT).toBe(12);
    expect(WHEEL_SECONDS_MAX_INDEX).toBe(11);
  });

  it("secondsIndexToValue maps every index to the correct stepped value", () => {
    expect(secondsIndexToValue(0)).toBe(0);
    expect(secondsIndexToValue(1)).toBe(5);
    expect(secondsIndexToValue(11)).toBe(55);
  });

  it("secondsIndexToValue clamps an out-of-range index rather than producing an invalid value", () => {
    expect(secondsIndexToValue(-1)).toBe(0);
    expect(secondsIndexToValue(999)).toBe(55);
  });

  it("secondsValueToIndex is the exact inverse for values already on the step", () => {
    expect(secondsValueToIndex(0)).toBe(0);
    expect(secondsValueToIndex(5)).toBe(1);
    expect(secondsValueToIndex(55)).toBe(11);
  });

  it("secondsValueToIndex rounds a value between two steps to the nearest one", () => {
    expect(secondsValueToIndex(17)).toBe(3); // nearest to 15 (index 3)
    expect(secondsValueToIndex(18)).toBe(4); // nearest to 20 (index 4)
  });

  it("secondsValueToIndex clamps a value beyond the last step (e.g. 59) to the max index", () => {
    expect(secondsValueToIndex(59)).toBe(WHEEL_SECONDS_MAX_INDEX);
  });
});

describe("formatTwoDigits", () => {
  it("pads single-digit values with a leading zero", () => {
    expect(formatTwoDigits(0)).toBe("00");
    expect(formatTwoDigits(9)).toBe("09");
  });

  it("leaves two-digit values unchanged", () => {
    expect(formatTwoDigits(10)).toBe("10");
    expect(formatTwoDigits(59)).toBe("59");
  });
});

describe("toTotalSeconds/fromTotalSeconds with an explicit maxTotalSeconds (T01-S08, Exercise Durée/Pause)", () => {
  it("still defaults to WHEEL_TOTAL_SECONDS_MAX (3599) when maxTotalSeconds is omitted", () => {
    expect(toTotalSeconds(99, 99)).toBe(WHEEL_TOTAL_SECONDS_MAX);
    expect(fromTotalSeconds(999999)).toEqual({ minutes: 59, seconds: 55 });
  });

  it("converts 99 min 59 s to 5999 seconds (Exercise Durée/Pause upper bound) — toTotalSeconds itself performs no step rounding, only fromTotalSeconds does", () => {
    expect(toTotalSeconds(99, 59, WHEEL_EXERCISE_DURATION_SECONDS_MAX)).toBe(
      WHEEL_EXERCISE_DURATION_SECONDS_MAX,
    );
    expect(toTotalSeconds(99, 59, WHEEL_PAUSE_SECONDS_MAX)).toBe(WHEEL_PAUSE_SECONDS_MAX);
  });

  it("clamps a theoretically excessive total to the supplied bound, not the default 3599", () => {
    expect(toTotalSeconds(999, 999, WHEEL_EXERCISE_DURATION_SECONDS_MAX)).toBe(
      WHEEL_EXERCISE_DURATION_SECONDS_MAX,
    );
  });

  it("decomposes 5999 seconds into 99 min 55 s when given the Exercise bound (59s rounds down to the last valid step)", () => {
    expect(fromTotalSeconds(5999, WHEEL_EXERCISE_DURATION_SECONDS_MAX)).toEqual({
      minutes: 99,
      seconds: 55,
    });
  });

  it("clamps an excessive input to the supplied bound, not the default 59 min 55 s", () => {
    expect(fromTotalSeconds(999999, WHEEL_EXERCISE_DURATION_SECONDS_MAX)).toEqual({
      minutes: 99,
      seconds: 55,
    });
  });
});

describe("minutesMaxIndexFor", () => {
  it("returns 59 for the default 3599s bound", () => {
    expect(minutesMaxIndexFor(WHEEL_TOTAL_SECONDS_MAX)).toBe(59);
  });

  it("returns 99 for the 5999s Exercise Durée/Pause bound", () => {
    expect(minutesMaxIndexFor(WHEEL_EXERCISE_DURATION_SECONDS_MAX)).toBe(99);
  });
});

describe("WHEEL_NUMBER_MIN/WHEEL_NUMBER_MAX (Répétitions/Séries, D-092)", () => {
  it("are exactly 1 and 99", () => {
    expect(WHEEL_NUMBER_MIN).toBe(1);
    expect(WHEEL_NUMBER_MAX).toBe(99);
  });
});
