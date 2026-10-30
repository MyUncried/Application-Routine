import { describe, expect, it } from "@jest/globals";

import {
  ELEMENT_FORMAT_KEYS,
  FORMAT_CAPABILITIES,
  FORMAT_REGISTRY,
  QUICK_START_KEYS,
  UNDEFINED_CAPABILITY,
  type CapabilityModelKey,
} from "@/domain/sessions/formats";

/**
 * PRE-9 (story D.3, ch11 l.315, ch12 l.1824-1834) — descripteurs de capacités : un par modèle de
 * la grille, cohérents avec le registre (porteur) et le plan (expansion), aucun moteur disponible,
 * lacunes explicites.
 */

const MODELS: readonly CapabilityModelKey[] = [...ELEMENT_FORMAT_KEYS, ...QUICK_START_KEYS, "FREE"];

describe("PRE-9 D.3 — descripteurs de capacités par Format", () => {
  it("un descripteur par modèle (12) ; aucun moteur disponible en PRE-9", () => {
    expect(Object.keys(FORMAT_CAPABILITIES).sort()).toEqual([...MODELS].sort());
    for (const model of MODELS) {
      expect(FORMAT_CAPABILITIES[model].model).toBe(model);
      expect(FORMAT_CAPABILITIES[model].executionAvailable).toBe(false);
      expect(FORMAT_CAPABILITIES[model].sources.length).toBeGreaterThan(0);
    }
  });

  it("seuls AMRAP et Death by sont progressifs (ch12 l.1829, CE-FMT-05 §15) ; départs rapides et Libre : éléments libres finis (FMT-28)", () => {
    expect(MODELS.filter((model) => FORMAT_CAPABILITIES[model].expansion === "PROGRESSIVE")).toEqual(["AMRAP", "DEATH_BY"]);
    for (const model of [...QUICK_START_KEYS, "FREE"] as const) {
      expect(FORMAT_CAPABILITIES[model]).toMatchObject({ carrier: "FREE_ELEMENTS", expansion: "FINITE", end: "PLAN_COMPLETED" });
    }
  });

  it("porteur : l'Exercice pour les six Formats, jamais un Circuit (correction C.1 du 30/10, D-02)", () => {
    for (const key of ELEMENT_FORMAT_KEYS) {
      expect(FORMAT_CAPABILITIES[key].carrier).toBe("EXERCISE");
      expect(FORMAT_REGISTRY[key]).not.toHaveProperty("carriers");
    }
  });

  it("comportements définis par les règles ; lacunes portées NON_DEFINI avec leur question, jamais une valeur supposée", () => {
    expect(FORMAT_CAPABILITIES.EMOM.onExpiry).toBe("NEXT_WINDOW_STARTS_NO_INVENTED_REST");
    expect(FORMAT_CAPABILITIES.DEATH_BY.onExpiry).toBe("WINDOW_WITHOUT_TAP_NOT_ACQUIRED");
    expect(FORMAT_CAPABILITIES.DEATH_BY.progression).toBe("DYNAMIC_TARGET");
    expect(FORMAT_CAPABILITIES.FOR_TIME.onExpiry).toBe("NOT_APPLICABLE");
    expect(FORMAT_CAPABILITIES.AMRAP.onExpiry).toMatchObject({ status: UNDEFINED_CAPABILITY });
    for (const model of MODELS) {
      for (const aspect of FORMAT_CAPABILITIES[model].undefinedAspects) {
        expect(aspect.status).toBe(UNDEFINED_CAPABILITY);
        expect(aspect.question.length).toBeGreaterThan(10);
      }
    }
    // Suite de la Séance après un élément progressif : non définie pour AMRAP et Death by (A4).
    for (const model of ["AMRAP", "DEATH_BY"] as const) {
      expect(FORMAT_CAPABILITIES[model].undefinedAspects.some((aspect) => aspect.question.startsWith("Suite de la Séance"))).toBe(true);
    }
  });
});
