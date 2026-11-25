import { describe, expect, it } from "@jest/globals";

import { decimalSeparator, formatDecimal, formatShortDate } from "./format";

describe("J1 — formats régionaux", () => {
  it("garde la virgule en français (langue simulée sous Jest)", () => {
    expect(decimalSeparator).toBe(",");
    expect(formatDecimal(1.25)).toBe("1,25");
    expect(formatDecimal(20)).toBe("20");
  });

  it("prend le point en anglais", () => {
    expect(formatDecimal(1.25, ".")).toBe("1.25");
  });

  it("écrit la date dans l'ordre de la région", () => {
    const date = new Date(2026, 10, 23);
    expect(formatShortDate(date, "fr-FR")).toBe("23/11/2026");
    expect(formatShortDate(date, "en-US")).toBe("11/23/2026");
  });
});
