import { describe, expect, it } from "@jest/globals";

import {
  canonicalLabelKey,
  isLabelAssignable,
  listAssignableLabels,
  validateCreateLabelInput,
  validateLabelColor,
  validateLabelName,
  type Label,
} from "../Label";

const ACTIVE: Label = {
  id: "focus",
  name: "Focus",
  canonicalKey: "focus",
  color: "#3B82F6",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};
const RETIRED: Label = {
  id: "legacy",
  name: "Ancienne",
  canonicalKey: "ancienne",
  color: "#8E8E93",
  isActive: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("isLabelAssignable", () => {
  it("is assignable when active", () => {
    expect(isLabelAssignable(ACTIVE)).toBe(true);
  });

  it("is not assignable when retired", () => {
    expect(isLabelAssignable(RETIRED)).toBe(false);
  });
});

describe("listAssignableLabels", () => {
  it("keeps only active labels, preserving order", () => {
    expect(listAssignableLabels([RETIRED, ACTIVE])).toEqual([ACTIVE]);
  });

  it("never alters a retired label's own representation", () => {
    expect(RETIRED.id).toBe("legacy");
    expect(RETIRED.color).toBe("#8E8E93");
  });
});

describe("validateLabelName", () => {
  it("rejects an empty name", () => {
    expect(validateLabelName("   ").ok).toBe(false);
  });

  it("rejects a name longer than 40 code points", () => {
    expect(validateLabelName("a".repeat(41)).ok).toBe(false);
  });

  it("accepts and normalizes a valid name", () => {
    const result = validateLabelName("  Focus   du   soir  ");
    expect(result).toEqual({ ok: true, value: "Focus du soir" });
  });
});

describe("validateLabelColor", () => {
  it("rejects a color outside the canonical palette", () => {
    expect(validateLabelColor("#000000").ok).toBe(false);
  });

  it("accepts a canonical color", () => {
    expect(validateLabelColor("#3B82F6")).toEqual({ ok: true, value: "#3B82F6" });
  });
});

describe("canonicalLabelKey (V2-PRE-2, D2 reactivation)", () => {
  it("ignores case and diacritics, and normalizes internal whitespace", () => {
    expect(canonicalLabelKey("Focus")).toBe("focus");
    expect(canonicalLabelKey("  FOCUS  ")).toBe("focus");
    expect(canonicalLabelKey("Récupération   douce")).toBe(canonicalLabelKey("recuperation douce"));
  });

  it("distinguishes labels whose only difference is a real content change", () => {
    expect(canonicalLabelKey("Focus")).not.toBe(canonicalLabelKey("Focus du soir"));
  });
});

describe("validateCreateLabelInput", () => {
  it("aggregates both name and color violations", () => {
    const result = validateCreateLabelInput({ name: "", color: "#000000" as never });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.map((violation) => violation.field).sort()).toEqual([
        "label.color",
        "label.name",
      ]);
    }
  });

  it("accepts a valid input", () => {
    const result = validateCreateLabelInput({ name: "Focus", color: "#3B82F6" });
    expect(result).toEqual({ ok: true, value: { name: "Focus", color: "#3B82F6" } });
  });
});
