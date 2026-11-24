import { describe, expect, it } from "@jest/globals";

import type { BusinessStatus } from "@/domain/execution/results";
import { EVERY_TIME, type Routine } from "@/domain/planning/Routine";
import type { OccurrenceExecution } from "@/domain/planning/occurrenceExecutions";
import { reminderHistoryFamily } from "@/domain/planning/reminderHistory";
import { composeReminder } from "@/domain/planning/reminderMessages";

/** Familles FIRST et RESTART des rappels (q19-rappels, 20/11/2026 : « Active ces deux familles »). */
function routine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: "r1",
    name: "Gainage",
    startDate: "2026-08-03", // lundi
    time: "08:00",
    repetition: { unit: "DAY", every: 1, weekdays: [], end: { kind: "FOR", count: 30 } },
    entries: [{ id: "e1", sessionId: "s1", frequency: EVERY_TIME }],
    exclusions: [],
    reminderMinutes: 15,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

const run = (occurrenceKey: string, businessStatus: BusinessStatus | null): OccurrenceExecution => ({
  executionId: occurrenceKey,
  routineId: "r1",
  occurrenceKey,
  rank: 1,
  startedAt: `${occurrenceKey}:00.000Z`,
  businessStatus,
});

describe("reminderHistoryFamily", () => {
  it("aucune occurrence passée ni commencée : première séance", () => {
    expect(reminderHistoryFamily(routine(), [], new Date(2026, 7, 3, 7, 0))).toBe("FIRST");
  });

  it("une occurrence passée manquée, rien de commencé : reprise après absence", () => {
    expect(reminderHistoryFamily(routine(), [], new Date(2026, 7, 4, 7, 0))).toBe("RESTART");
  });

  it("dernière occurrence passée commencée : aucune accroche d'historique", () => {
    expect(reminderHistoryFamily(routine(), [run("2026-08-03T08:00", "COMPLETED")], new Date(2026, 7, 4, 7, 0))).toBeNull();
    expect(reminderHistoryFamily(routine(), [run("2026-08-03T08:00", "INTERRUPTED")], new Date(2026, 7, 4, 7, 0))).toBeNull();
  });

  it("occurrence manquée après la dernière occurrence commencée : reprise après absence", () => {
    expect(reminderHistoryFamily(routine(), [run("2026-08-03T08:00", "COMPLETED")], new Date(2026, 7, 5, 7, 0))).toBe("RESTART");
  });

  it("séance en cours (non terminée) : ne compte pas comme commencée", () => {
    expect(reminderHistoryFamily(routine(), [run("2026-08-03T08:00", null)], new Date(2026, 7, 3, 9, 0))).toBe("RESTART");
  });

  it("occurrence à venir faite en avance après une absence : plus de reprise due", () => {
    expect(reminderHistoryFamily(routine(), [run("2026-08-06T08:00", "COMPLETED")], new Date(2026, 7, 5, 7, 0))).toBeNull();
  });

  it("les Exécutions d'une autre routine sont ignorées", () => {
    expect(reminderHistoryFamily(routine(), [{ ...run("2026-08-03T08:00", "COMPLETED"), routineId: "r2" }], new Date(2026, 7, 4, 7, 0))).toBe("RESTART");
  });
});

describe("composeReminder — accroche d'historique", () => {
  const context = { plannedAt: new Date(2026, 7, 5, 8, 0), name: "Gainage", recurring: true, categoryIds: [], rank: 1 };

  it("FIRST et RESTART priment sur la rotation", () => {
    expect(composeReminder({ ...context, history: "FIRST" }, null).templateId).toBe("FIRST-01");
    expect(composeReminder({ ...context, history: "RESTART" }, null)).toEqual({ templateId: "RESTART-01", title: "On reprend le mouvement", body: "Gainage t’attend." });
  });

  it("sans accroche d'historique : rotation inchangée", () => {
    expect(composeReminder({ ...context, history: null }, null)).toEqual(composeReminder(context, null));
  });

  it("jamais deux fois le même modèle de suite", () => {
    expect(composeReminder({ ...context, history: "FIRST" }, "FIRST-01").templateId).toBe("FIRST-02");
  });
});
