import { describe, expect, it } from "@jest/globals";

import type { BusinessStatus } from "@/domain/execution/results";
import { occurrenceExecutionStatus, type OccurrenceExecution } from "@/domain/planning/occurrenceExecutions";

/** Statut d'une occurrence d'après ses Exécutions (recette du 19/11/2026 au soir : s19-passees, s19-arret). */
const run = (rank: number, businessStatus: BusinessStatus | null, startedAt = "2026-11-19T08:00:00.000Z"): OccurrenceExecution => ({
  executionId: `${rank}-${startedAt}`,
  routineId: "r",
  occurrenceKey: "2026-11-19T08:00",
  rank,
  startedAt,
  businessStatus,
});

describe("occurrenceExecutionStatus", () => {
  it("aucune séance terminée : non exécutée (une Exécution en cours ne compte pas)", () => {
    expect(occurrenceExecutionStatus(1, [])).toBe("NONE");
    expect(occurrenceExecutionStatus(1, [run(1, null)])).toBe("NONE");
  });

  it("toutes les séances menées à leur terme : Complétée", () => {
    expect(occurrenceExecutionStatus(1, [run(1, "COMPLETED")])).toBe("COMPLETED");
    expect(occurrenceExecutionStatus(2, [run(1, "COMPLETED"), run(2, "COMPLETED")])).toBe("COMPLETED");
  });

  it("parcours arrêté après une première séance complète : Partielle (s19-arret)", () => {
    expect(occurrenceExecutionStatus(2, [run(1, "COMPLETED"), run(2, "INTERRUPTED")])).toBe("PARTIAL");
    expect(occurrenceExecutionStatus(2, [run(1, "COMPLETED")])).toBe("PARTIAL");
    expect(occurrenceExecutionStatus(1, [run(1, "PARTIAL")])).toBe("PARTIAL");
  });

  it("séances seulement arrêtées : Arrêtée", () => {
    expect(occurrenceExecutionStatus(1, [run(1, "INTERRUPTED")])).toBe("STOPPED");
    expect(occurrenceExecutionStatus(2, [run(1, "INTERRUPTED")])).toBe("STOPPED");
  });

  it("une séance rejouée remplace la précédente", () => {
    expect(occurrenceExecutionStatus(1, [run(1, "INTERRUPTED", "2026-11-19T08:00:00.000Z"), run(1, "COMPLETED", "2026-11-19T09:00:00.000Z")])).toBe("COMPLETED");
  });
});
