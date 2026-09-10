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

describe("fromTotalSeconds — secondes au pas de 1 (R4-05, 00…59)", () => {
  it("decomposes 0 seconds into 0 min 00 s", () => {
    expect(fromTotalSeconds(0)).toEqual({ minutes: 0, seconds: 0 });
  });

  it("decomposes 3599 seconds into 59 min 59 s (upper bound, exact — pas de 1, aucun arrondi)", () => {
    expect(fromTotalSeconds(3599)).toEqual({ minutes: 59, seconds: 59 });
  });

  it("decomposes an arbitrary in-range value unchanged (every value is already on the step)", () => {
    expect(fromTotalSeconds(75)).toEqual({ minutes: 1, seconds: 15 });
    expect(fromTotalSeconds(77)).toEqual({ minutes: 1, seconds: 17 });
    expect(fromTotalSeconds(78)).toEqual({ minutes: 1, seconds: 18 });
  });

  it("clamps a negative input to 0 min 00 s (lower bound)", () => {
    expect(fromTotalSeconds(-10)).toEqual({ minutes: 0, seconds: 0 });
  });

  it("clamps an excessive input to 59 min 59 s (upper bound)", () => {
    expect(fromTotalSeconds(999999)).toEqual({ minutes: 59, seconds: 59 });
  });

  it("round-trips exactly with toTotalSeconds for any in-range value (pas de 1, aucune perte)", () => {
    expect(toTotalSeconds(0, 0)).toBe(0);
    expect(fromTotalSeconds(toTotalSeconds(0, 0))).toEqual({ minutes: 0, seconds: 0 });
    expect(fromTotalSeconds(toTotalSeconds(59, 59))).toEqual({ minutes: 59, seconds: 59 });
    expect(fromTotalSeconds(toTotalSeconds(1, 17))).toEqual({ minutes: 1, seconds: 17 });
  });
});

describe("WHEEL_SECONDS_STEP / secondsIndexToValue / secondsValueToIndex (R4-05, pas de 1)", () => {
  it("the step is exactly 1, per R4-05 ('les secondes défilent par pas de 1 : 00, 01, 02…59')", () => {
    expect(WHEEL_SECONDS_STEP).toBe(1);
  });

  it("exposes exactly 60 visible second values (0, 1, …, 59) and a max index of 59", () => {
    expect(WHEEL_SECONDS_ITEM_COUNT).toBe(60);
    expect(WHEEL_SECONDS_MAX_INDEX).toBe(59);
  });

  it("secondsIndexToValue is the identity (index === value) at a step of 1", () => {
    expect(secondsIndexToValue(0)).toBe(0);
    expect(secondsIndexToValue(1)).toBe(1);
    expect(secondsIndexToValue(59)).toBe(59);
  });

  it("secondsIndexToValue clamps an out-of-range index rather than producing an invalid value", () => {
    expect(secondsIndexToValue(-1)).toBe(0);
    expect(secondsIndexToValue(999)).toBe(59);
  });

  it("secondsValueToIndex is the exact inverse (identity) for every value 0…59", () => {
    expect(secondsValueToIndex(0)).toBe(0);
    expect(secondsValueToIndex(17)).toBe(17);
    expect(secondsValueToIndex(59)).toBe(59);
  });

  it("secondsValueToIndex clamps a value beyond the last step to the max index", () => {
    expect(secondsValueToIndex(999)).toBe(WHEEL_SECONDS_MAX_INDEX);
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
    expect(fromTotalSeconds(999999)).toEqual({ minutes: 59, seconds: 59 });
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

  it("decomposes 5999 seconds into 99 min 59 s when given the Exercise bound (pas de 1, exact)", () => {
    expect(fromTotalSeconds(5999, WHEEL_EXERCISE_DURATION_SECONDS_MAX)).toEqual({
      minutes: 99,
      seconds: 59,
    });
  });

  it("clamps an excessive input to the supplied bound, not the default 59 min 59 s", () => {
    expect(fromTotalSeconds(999999, WHEEL_EXERCISE_DURATION_SECONDS_MAX)).toEqual({
      minutes: 99,
      seconds: 59,
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
