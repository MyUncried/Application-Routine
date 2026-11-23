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

  it("compte à rebours d'un exercice en durée d'un Format : bas à gauche, exclusif de la charge (cas hors tableau, à confirmer)", () => {
    const withCountdown = new Set<CornerItem>(["SERIES_COUNTDOWN", "LOAD", "OBJECTIVE"]);
    expect(assignCorners("EMOM_DURATION", withCountdown).BOTTOM_LEFT).toBe("SERIES_COUNTDOWN");
    expect(assignCorners("FOR_TIME", withCountdown).BOTTOM_LEFT).toBe("SERIES_COUNTDOWN");
    expect(assignCorners("EXERCISE_REPETITIONS", withCountdown).BOTTOM_LEFT).toBe("LOAD");
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
