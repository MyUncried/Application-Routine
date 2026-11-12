import { describe, expect, it } from "@jest/globals";

import {
  ELEMENT_FORMAT_KEYS,
  FORMAT_CAPABILITIES,
  FORMAT_REGISTRY,
  PRECONFIGURATION_KEYS,
  UNDEFINED_CAPABILITY,
  type CapabilityModelKey,
} from "@/domain/sessions/formats";

/**
 * PRE-9 (story D.3, ch11 l.315, ch12 l.1824-1834) — descripteurs de capacités : un par modèle de
 * la grille, cohérents avec le registre (porteur) et le plan (expansion), aucun moteur disponible,
 * lacunes explicites.
 *
 * Réalignement du 02/11/2026 (`docs/KODJO-Formats-entrainement-2026-11-02.md` §1, §9, §12, FMT-01) :
 * quatre Formats spécialisés portés par l'Exercice autonome ou le Circuit porteur ; Tabata et les
 * cinq départs rapides sont des préconfigurations standards (éléments libres) ; Gainage et mobilité
 * n'est plus un modèle de la grille.
 */

const MODELS: readonly CapabilityModelKey[] = [...ELEMENT_FORMAT_KEYS, ...PRECONFIGURATION_KEYS, "FREE"];

describe("PRE-9 D.3 — descripteurs de capacités par Format", () => {
  it("un descripteur par modèle (4 Formats, 6 préconfigurations, Libre : 11) ; moteur disponible pour les seuls éléments libres depuis PRE-10", () => {
    expect(MODELS).toHaveLength(11);
    expect(Object.keys(FORMAT_CAPABILITIES).sort()).toEqual([...MODELS].sort());
    expect(FORMAT_CAPABILITIES).not.toHaveProperty("CORE_MOBILITY");
    for (const model of MODELS) {
      expect(FORMAT_CAPABILITIES[model].model).toBe(model);
      // PRE-10 (09/11/2026) : éléments libres et préconfigurations exécutables ; Formats spécialisés : PRE-11.
      expect(FORMAT_CAPABILITIES[model].executionAvailable).toBe(FORMAT_CAPABILITIES[model].carrier === "FREE_ELEMENTS");
      expect(FORMAT_CAPABILITIES[model].sources.length).toBeGreaterThan(0);
    }
  });

  it("seuls AMRAP et Death by sont progressifs (ch12 l.1829, CE-FMT-05 §15) ; Tabata, départs rapides et Libre : éléments libres finis (FMT-28, §9)", () => {
    expect(MODELS.filter((model) => FORMAT_CAPABILITIES[model].expansion === "PROGRESSIVE")).toEqual(["AMRAP", "DEATH_BY"]);
    for (const model of [...PRECONFIGURATION_KEYS, "FREE"] as const) {
      expect(FORMAT_CAPABILITIES[model]).toMatchObject({ carrier: "FREE_ELEMENTS", expansion: "FINITE", end: "PLAN_COMPLETED", undefinedAspects: [] });
    }
  });

  it("porteur : l'Exercice autonome ou le Circuit porteur pour les quatre Formats (§1), cohérent avec les natures du registre", () => {
    for (const key of ELEMENT_FORMAT_KEYS) {
      expect(FORMAT_CAPABILITIES[key].carrier).toBe("EXERCISE_OR_CIRCUIT");
      expect(FORMAT_REGISTRY[key].exercise.length).toBeGreaterThan(0);
      expect(FORMAT_REGISTRY[key].circuit.natures.length).toBeGreaterThan(0);
    }
    expect(MODELS.filter((model) => FORMAT_CAPABILITIES[model].carrier !== "FREE_ELEMENTS")).toEqual([...ELEMENT_FORMAT_KEYS]);
  });

  it("comportements définis par les règles ; lacunes portées NON_DEFINI avec leur question, jamais une valeur supposée", () => {
    expect(FORMAT_CAPABILITIES.EMOM.onExpiry).toBe("NEXT_WINDOW_STARTS_NO_INVENTED_REST");
    expect(FORMAT_CAPABILITIES.DEATH_BY.onExpiry).toBe("WINDOW_WITHOUT_TAP_NOT_ACQUIRED");
    expect(FORMAT_CAPABILITIES.DEATH_BY.progression).toBe("DYNAMIC_TARGET");
    // Temps limite facultatif (§11) : l'étape en cours à son échéance n'est pas décrite — question ouverte, aucune valeur supposée.
    expect(FORMAT_CAPABILITIES.FOR_TIME.onExpiry).toMatchObject({ status: "NON_DEFINI" });
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
    // 02/11 (A2, §12) : rang et fin du Death by alterné tranchés par le Circuit porteur ; plus de lacune de raccordement.
    expect(FORMAT_CAPABILITIES.DEATH_BY.undefinedAspects.some((aspect) => /rang|raccordement/i.test(aspect.question))).toBe(false);
    expect(FORMAT_CAPABILITIES.DEATH_BY.sources).toEqual(expect.arrayContaining(["§12", "A2"]));
  });
});
