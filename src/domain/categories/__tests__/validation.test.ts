import { describe, expect, it } from "@jest/globals";

import {
  CATEGORY_NAME_MAX_LENGTH,
  canonicalCategoryKey,
  normalizeCategoryName,
  validateCategoryName,
} from "@/domain/categories/validation";

describe("normalizeCategoryName", () => {
  it("trims the ends and collapses internal whitespace to a single space, preserving case and diacritics", () => {
    expect(normalizeCategoryName("  Cardio   Intense  ")).toBe("Cardio Intense");
    expect(normalizeCategoryName("Étirements")).toBe("Étirements");
  });
});

describe("canonicalCategoryKey", () => {
  it("ignores case and diacritics, and normalizes internal whitespace, exactly as required by D-106", () => {
    expect(canonicalCategoryKey("Étirements")).toBe("etirements");
    expect(canonicalCategoryKey("étirements")).toBe("etirements");
    expect(canonicalCategoryKey("  ÉTIREMENTS  ")).toBe("etirements");
    expect(canonicalCategoryKey("Cardio   Intense")).toBe(canonicalCategoryKey("cardio intense"));
  });

  it("distinguishes categories whose only difference is a real content change, not just case/diacritics/spacing", () => {
    expect(canonicalCategoryKey("Cardio")).not.toBe(canonicalCategoryKey("Cardio Intense"));
  });
});

describe("validateCategoryName", () => {
  it("rejects an empty or whitespace-only name", () => {
    expect(validateCategoryName("")).toEqual({
      ok: false,
      violations: [{ code: "REQUIRED", field: "category.name" }],
    });
    expect(validateCategoryName("   ")).toEqual({
      ok: false,
      violations: [{ code: "REQUIRED", field: "category.name" }],
    });
  });

  it("accepts a name of exactly the maximum length after normalization", () => {
    const name = "A".repeat(CATEGORY_NAME_MAX_LENGTH);
    expect(validateCategoryName(name)).toEqual({ ok: true, value: name });
    expect(CATEGORY_NAME_MAX_LENGTH).toBe(40);
  });

  it("rejects a name exceeding the maximum length after normalization", () => {
    const name = "A".repeat(CATEGORY_NAME_MAX_LENGTH + 1);
    expect(validateCategoryName(name)).toEqual({
      ok: false,
      violations: [{ code: "TOO_LONG", field: "category.name", details: { max: 40 } }],
    });
  });

  it("counts by Unicode code point, not by UTF-16 code unit", () => {
    // Chaque emoji ci-dessous est un unique point de code (`Array.from`
    // le compte pour 1), au-delà du plan multilingue de base (2 unités
    // UTF-16 chacun) — un compteur naïf sur `string.length` compterait 80,
    // rejetant à tort une entrée de 40 caractères visibles.
    const name = "💪".repeat(CATEGORY_NAME_MAX_LENGTH);
    expect(validateCategoryName(name)).toEqual({ ok: true, value: name });
  });

  it("returns the normalized value on success, trimmed and with collapsed internal whitespace", () => {
    expect(validateCategoryName("  Cardio   Intense  ")).toEqual({
      ok: true,
      value: "Cardio Intense",
    });
  });
});
