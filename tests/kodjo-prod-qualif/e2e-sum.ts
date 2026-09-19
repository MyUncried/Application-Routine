export function sumNonNegativeIntegers(values: readonly number[]): number {
  let total = 0;

  for (const value of values) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError();
    }

    total += value;

    if (!Number.isSafeInteger(total)) {
      throw new RangeError();
    }
  }

  return total;
}
