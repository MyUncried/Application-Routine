import { describe, expect, it } from "@jest/globals";

import {
  WHEEL_TOTAL_SECONDS_MAX,
  clampIndex,
  formatTwoDigits,
  fromTotalSeconds,
  indexToOffset,
  offsetToIndex,
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

describe("fromTotalSeconds", () => {
  it("decomposes 0 seconds into 0 min 00 s", () => {
    expect(fromTotalSeconds(0)).toEqual({ minutes: 0, seconds: 0 });
  });

  it("decomposes 3599 seconds into 59 min 59 s (upper bound)", () => {
    expect(fromTotalSeconds(3599)).toEqual({ minutes: 59, seconds: 59 });
  });

  it("decomposes an arbitrary in-range value", () => {
    expect(fromTotalSeconds(75)).toEqual({ minutes: 1, seconds: 15 });
  });

  it("clamps a negative input to 0 min 00 s (lower bound)", () => {
    expect(fromTotalSeconds(-10)).toEqual({ minutes: 0, seconds: 0 });
  });

  it("clamps an excessive input to 59 min 59 s (upper bound)", () => {
    expect(fromTotalSeconds(999999)).toEqual({ minutes: 59, seconds: 59 });
  });

  it("round-trips with toTotalSeconds for every bound", () => {
    expect(toTotalSeconds(0, 0)).toBe(0);
    expect(fromTotalSeconds(toTotalSeconds(0, 0))).toEqual({ minutes: 0, seconds: 0 });
    expect(fromTotalSeconds(toTotalSeconds(59, 59))).toEqual({ minutes: 59, seconds: 59 });
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
