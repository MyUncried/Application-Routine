import { describe, expect, it } from "@jest/globals";

import {
  assignCorners,
  badgePlacement,
  CORNER_OF,
  CORNER_TABLE,
  cornerScenarioOf,
  type CornerItem,
  type CornerScenario,
  type CornerSlot,
} from "@/features/execution/executionCorners";

/** D-529 / CE-UI-14 (Hermann, 18/11/2026) : quatre coins du chronomètre. */
const ALL: ReadonlySet<CornerItem> = new Set<CornerItem>(["OBJECTIVE", "TIME_LIMIT", "LOAD", "MOVEMENT_COUNT", "REST_COUNTDOWN", "SCORE"]);

// Tableau de CE-UI-14 §2 (une ligne par scénario ; `null` = coin vide).
const EXPECTED: Record<CornerScenario, Record<CornerSlot, CornerItem | null>> = {
  EXERCISE_REPETITIONS: { TOP_LEFT: "OBJECTIVE", TOP_RIGHT: null, BOTTOM_LEFT: "LOAD", BOTTOM_RIGHT: null },
  EXERCISE_PHASES: { TOP_LEFT: "OBJECTIVE", TOP_RIGHT: null, BOTTOM_LEFT: "LOAD", BOTTOM_RIGHT: "MOVEMENT_COUNT" },
  PAUSE: { TOP_LEFT: "OBJECTIVE", TOP_RIGHT: null, BOTTOM_LEFT: "LOAD", BOTTOM_RIGHT: null },
  FOR_TIME: { TOP_LEFT: "OBJECTIVE", TOP_RIGHT: "TIME_LIMIT", BOTTOM_LEFT: "LOAD", BOTTOM_RIGHT: "MOVEMENT_COUNT" },
  AMRAP: { TOP_LEFT: "OBJECTIVE", TOP_RIGHT: "TIME_LIMIT", BOTTOM_LEFT: "LOAD", BOTTOM_RIGHT: "MOVEMENT_COUNT" },
  AMRAP_MAX: { TOP_LEFT: null, TOP_RIGHT: "TIME_LIMIT", BOTTOM_LEFT: "LOAD", BOTTOM_RIGHT: "SCORE" },
  EMOM_REPETITIONS: { TOP_LEFT: "OBJECTIVE", TOP_RIGHT: "TIME_LIMIT", BOTTOM_LEFT: "LOAD", BOTTOM_RIGHT: "REST_COUNTDOWN" },
  // Le compteur n'existe que pour une Série en Répétitions guidée (fenêtre mixte) ; jamais pour la Série en Durée (domaine).
  EMOM_DURATION: { TOP_LEFT: "OBJECTIVE", TOP_RIGHT: "TIME_LIMIT", BOTTOM_LEFT: "LOAD", BOTTOM_RIGHT: "MOVEMENT_COUNT" },
  DEATH_BY: { TOP_LEFT: "OBJECTIVE", TOP_RIGHT: "TIME_LIMIT", BOTTOM_LEFT: "LOAD", BOTTOM_RIGHT: "MOVEMENT_COUNT" },
  TABATA: { TOP_LEFT: "OBJECTIVE", TOP_RIGHT: null, BOTTOM_LEFT: "LOAD", BOTTOM_RIGHT: null },
};

describe("D-529 / CE-UI-14 — table des quatre coins", () => {
  it.each(Object.keys(EXPECTED) as CornerScenario[])("scénario %s : coins du tableau de CE-UI-14", (scenario) => {
    expect(assignCorners(scenario, ALL)).toEqual(EXPECTED[scenario]);
  });

  it("une information garde son coin d'un format à l'autre", () => {
    for (const scenario of Object.keys(CORNER_TABLE) as CornerScenario[]) {
      const row = CORNER_TABLE[scenario];
      for (const slot of Object.keys(row) as CornerSlot[]) for (const item of row[slot]) expect([scenario, item, slot]).toEqual([scenario, item, CORNER_OF[item]]);
    }
  });

  it("un coin vide reste vide : les autres informations ne se décalent pas", () => {
    const corners = assignCorners("EMOM_REPETITIONS", new Set<CornerItem>(["TIME_LIMIT"]));
    expect(corners).toEqual({ TOP_LEFT: null, TOP_RIGHT: "TIME_LIMIT", BOTTOM_LEFT: null, BOTTOM_RIGHT: null });
    expect(assignCorners("FOR_TIME", new Set<CornerItem>(["LOAD"]))).toEqual({ TOP_LEFT: null, TOP_RIGHT: null, BOTTOM_LEFT: "LOAD", BOTTOM_RIGHT: null });
  });

  it("ni l'intervalle ni le compte à rebours du repos hors de leur format ; le repos de l'EMOM en durée n'est pas en coin (D-528)", () => {
    expect(assignCorners("EXERCISE_REPETITIONS", ALL).TOP_RIGHT).toBeNull();
    expect(assignCorners("EMOM_DURATION", new Set<CornerItem>(["REST_COUNTDOWN"])).BOTTOM_RIGHT).toBeNull();
    expect(assignCorners("DEATH_BY", new Set<CornerItem>(["REST_COUNTDOWN"])).BOTTOM_RIGHT).toBeNull();
  });

  // [Bas à gauche, exclusif de la charge (19/11/2026, à confirmer) — remplacé par le complément D-529 du 26/11/2026.]
  describe("complément D-529 / CE-UI-14 du 26/11/2026 — décompte de Série en Durée en bas à droite", () => {
    const SLOTS: readonly CornerSlot[] = ["TOP_LEFT", "TOP_RIGHT", "BOTTOM_LEFT", "BOTTOM_RIGHT"];
    const FORMATS: readonly CornerScenario[] = ["FOR_TIME", "AMRAP", "EMOM_DURATION", "DEATH_BY"];

    it("CORNER_OF : SERIES_COUNTDOWN = BOTTOM_RIGHT, LOAD = BOTTOM_LEFT, dans tous les scénarios", () => {
      expect(CORNER_OF.SERIES_COUNTDOWN).toBe("BOTTOM_RIGHT");
      expect(CORNER_OF.LOAD).toBe("BOTTOM_LEFT");
      for (const scenario of Object.keys(CORNER_TABLE) as CornerScenario[]) {
        // Bas à gauche : la charge seule, jamais le décompte.
        expect([scenario, CORNER_TABLE[scenario].BOTTOM_LEFT]).toEqual([scenario, ["LOAD"]]);
      }
    });

    it.each(FORMATS)("%s : Série en Durée active avec charge → décompte en bas à droite et charge en bas à gauche ; haut inchangé", (scenario) => {
      const available = new Set<CornerItem>(["OBJECTIVE", "TIME_LIMIT", "LOAD", "SERIES_COUNTDOWN"]);
      expect(assignCorners(scenario, available)).toEqual({ TOP_LEFT: "OBJECTIVE", TOP_RIGHT: "TIME_LIMIT", BOTTOM_LEFT: "LOAD", BOTTOM_RIGHT: "SERIES_COUNTDOWN" });
    });

    it("For time sans temps max : coin haut droite vide, rien ne se décale", () => {
      expect(assignCorners("FOR_TIME", new Set<CornerItem>(["OBJECTIVE", "LOAD", "SERIES_COUNTDOWN"]))).toEqual({
        TOP_LEFT: "OBJECTIVE",
        TOP_RIGHT: null,
        BOTTOM_LEFT: "LOAD",
        BOTTOM_RIGHT: "SERIES_COUNTDOWN",
      });
    });

    it("EMOM en Durée : le décompte prime ; sans décompte ni compteur, bas droite vide (le compteur n'est jamais produit en Durée)", () => {
      expect(assignCorners("EMOM_DURATION", new Set<CornerItem>(["SERIES_COUNTDOWN", "MOVEMENT_COUNT", "LOAD"])).BOTTOM_RIGHT).toBe("SERIES_COUNTDOWN");
      expect(assignCorners("EMOM_DURATION", new Set<CornerItem>(["LOAD", "REST_COUNTDOWN"]))).toEqual({ TOP_LEFT: null, TOP_RIGHT: null, BOTTOM_LEFT: "LOAD", BOTTOM_RIGHT: null });
    });

    it("EMOM en Répétitions : décompte du repos en bas à droite pendant le repos seulement, charge en bas à gauche", () => {
      expect(assignCorners("EMOM_REPETITIONS", new Set<CornerItem>(["OBJECTIVE", "TIME_LIMIT", "LOAD", "REST_COUNTDOWN"]))).toEqual({
        TOP_LEFT: "OBJECTIVE",
        TOP_RIGHT: "TIME_LIMIT",
        BOTTOM_LEFT: "LOAD",
        BOTTOM_RIGHT: "REST_COUNTDOWN",
      });
      expect(assignCorners("EMOM_REPETITIONS", new Set<CornerItem>(["OBJECTIVE", "TIME_LIMIT", "LOAD"])).BOTTOM_RIGHT).toBeNull();
      // Aucun décompte de Série en Durée dans ce scénario (la fenêtre ne porte pas de Série en Durée).
      expect(CORNER_TABLE.EMOM_REPETITIONS.BOTTOM_RIGHT).not.toContain("SERIES_COUNTDOWN");
    });

    it("Répétitions guidées par phases : compteur « mouv. » en bas à droite, aucun décompte concurrent", () => {
      expect(assignCorners("EXERCISE_PHASES", new Set<CornerItem>(["OBJECTIVE", "LOAD", "MOVEMENT_COUNT", "SERIES_COUNTDOWN"]))).toEqual({
        TOP_LEFT: "OBJECTIVE",
        TOP_RIGHT: null,
        BOTTOM_LEFT: "LOAD",
        BOTTOM_RIGHT: "MOVEMENT_COUNT",
      });
      // Dans un Format, le compteur guidé reste le repli du bas à droite quand aucun décompte n'est actif.
      expect(assignCorners("FOR_TIME", new Set<CornerItem>(["MOVEMENT_COUNT"])).BOTTOM_RIGHT).toBe("MOVEMENT_COUNT");
      expect(assignCorners("AMRAP", new Set<CornerItem>(["MOVEMENT_COUNT"])).BOTTOM_RIGHT).toBe("MOVEMENT_COUNT");
    });

    it("AMRAP Max : score cumulé toujours en bas à droite", () => {
      expect(assignCorners("AMRAP_MAX", new Set<CornerItem>(["TIME_LIMIT", "LOAD", "SCORE", "SERIES_COUNTDOWN", "MOVEMENT_COUNT"])).BOTTOM_RIGHT).toBe("SCORE");
    });

    it("Tabata / 30-30 et exercices hors Format : aucun décompte de coin ajouté", () => {
      for (const scenario of ["TABATA", "EXERCISE_REPETITIONS", "EXERCISE_PHASES", "PAUSE"] as const) {
        const corners = assignCorners(scenario, new Set<CornerItem>(["SERIES_COUNTDOWN"]));
        expect([scenario, corners]).toEqual([scenario, { TOP_LEFT: null, TOP_RIGHT: null, BOTTOM_LEFT: null, BOTTOM_RIGHT: null }]);
      }
    });

    it("exclusivité : au plus une information dynamique en bas à droite, quelle que soit la combinaison disponible", () => {
      const dynamic: readonly CornerItem[] = ["SERIES_COUNTDOWN", "MOVEMENT_COUNT", "REST_COUNTDOWN", "SCORE"];
      for (const scenario of Object.keys(CORNER_TABLE) as CornerScenario[]) {
        for (let mask = 0; mask < 1 << dynamic.length; mask += 1) {
          const available = new Set<CornerItem>(["OBJECTIVE", "TIME_LIMIT", "LOAD", ...dynamic.filter((_, index) => (mask & (1 << index)) !== 0)]);
          const corners = assignCorners(scenario, available);
          const placed = SLOTS.map((slot) => corners[slot]).filter((item): item is CornerItem => item !== null && dynamic.includes(item));
          expect(placed.length).toBeLessThanOrEqual(1);
          expect(SLOTS.filter((slot) => corners[slot] !== null && dynamic.includes(corners[slot]) && slot !== "BOTTOM_RIGHT")).toEqual([]);
        }
      }
    });
  });

  it("position des cadres", () => {
    expect(badgePlacement("TOP_LEFT")).toEqual({ side: "left", vertical: "top" });
    expect(badgePlacement("TOP_RIGHT")).toEqual({ side: "right", vertical: "top" });
    expect(badgePlacement("BOTTOM_LEFT")).toEqual({ side: "left", vertical: "bottom" });
    expect(badgePlacement("BOTTOM_RIGHT")).toEqual({ side: "right", vertical: "bottom" });
  });

  it("scénario d'une étape", () => {
    const base = { formatKind: null, formatWork: false, emomTimed: false, pauseOrRecovery: false, guided: false } as const;
    expect(cornerScenarioOf(base)).toBe("EXERCISE_REPETITIONS");
    expect(cornerScenarioOf({ ...base, guided: true })).toBe("EXERCISE_PHASES");
    expect(cornerScenarioOf({ ...base, pauseOrRecovery: true })).toBe("PAUSE");
    expect(cornerScenarioOf({ ...base, formatKind: "FOR_TIME", formatWork: true })).toBe("FOR_TIME");
    expect(cornerScenarioOf({ ...base, formatKind: "AMRAP", formatWork: true })).toBe("AMRAP");
    // D-531 / RM-272 : AMRAP à un seul mouvement en Max — score cumulé en bas à droite.
    expect(cornerScenarioOf({ ...base, formatKind: "AMRAP", formatWork: true, amrapMax: true })).toBe("AMRAP_MAX");
    expect(cornerScenarioOf({ ...base, formatKind: "EMOM", formatWork: true })).toBe("EMOM_REPETITIONS");
    expect(cornerScenarioOf({ ...base, formatKind: "EMOM", formatWork: true, emomTimed: true })).toBe("EMOM_DURATION");
    expect(cornerScenarioOf({ ...base, formatKind: "DEATH_BY", formatWork: true })).toBe("DEATH_BY");
  });
});
