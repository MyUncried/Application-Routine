import { describe, expect, it } from "@jest/globals";

import { sumNonNegativeIntegers } from "./e2e-sum";

describe("sumNonNegativeIntegers", () => {
  it("returns 0 for an empty array", () => {
    expect(sumNonNegativeIntegers([])).toBe(0);
  });

  it("returns 0 for an array of zeros", () => {
    expect(sumNonNegativeIntegers([0, 0, 0])).toBe(0);
  });

  it("sums a normal array of positive integers", () => {
    expect(sumNonNegativeIntegers([1, 2, 3])).toBe(6);
  });

  it("accepts Number.MAX_SAFE_INTEGER as a single value", () => {
    expect(sumNonNegativeIntegers([Number.MAX_SAFE_INTEGER])).toBe(
      Number.MAX_SAFE_INTEGER
    );
  });

  it("does not mutate the input array", () => {
    const values = [3, 1, 2];
    const copy = [...values];

    const result = sumNonNegativeIntegers(values);

    expect(result).toBe(6);
    expect(values).toEqual(copy);
  });

  it("throws RangeError for a negative value", () => {
    expect(() => sumNonNegativeIntegers([-1])).toThrow(RangeError);
  });

  it("throws RangeError for a fractional value", () => {
    expect(() => sumNonNegativeIntegers([1.5])).toThrow(RangeError);
  });

  it("throws RangeError for NaN", () => {
    expect(() => sumNonNegativeIntegers([NaN])).toThrow(RangeError);
  });

  it("throws RangeError for positive Infinity", () => {
    expect(() => sumNonNegativeIntegers([Infinity])).toThrow(RangeError);
  });

  it("throws RangeError for negative Infinity", () => {
    expect(() => sumNonNegativeIntegers([-Infinity])).toThrow(RangeError);
  });

  it("throws RangeError for an integer outside the safe range", () => {
    expect(() =>
      sumNonNegativeIntegers([Number.MAX_SAFE_INTEGER + 1])
    ).toThrow(RangeError);
  });

  it("throws RangeError when the sum exceeds Number.MAX_SAFE_INTEGER", () => {
    expect(() =>
      sumNonNegativeIntegers([Number.MAX_SAFE_INTEGER, 1])
    ).toThrow(RangeError);
  });
});
