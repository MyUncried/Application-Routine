import { describe, expect, it, jest } from "@jest/globals";

import type { ExecutionFeedbackRepository } from "@/domain/feedback/ExecutionFeedbackRepository";
import type { ProgramRepository } from "@/domain/programs/ProgramRepository";
import type { PlanningService } from "@/features/planning/PlanningService";
import { ProgramService } from "@/features/programs/ProgramService";

/** D-578 à D-581 / D-427 : finalisation de l'Exécution — contrôles avant écriture, commentaire blanc → aucun. */
describe("ProgramService.finalizeExecution (D-578 à D-581)", () => {
  const make = () => {
    const save = jest.fn(async (_feedback: unknown, _at: string) => undefined);
    const service = new ProgramService({
      repository: {} as ProgramRepository,
      feedback: { save, get: async () => null } as unknown as ExecutionFeedbackRepository,
      planning: {} as PlanningService,
      newId: () => "x",
      now: () => new Date("2026-11-27T18:42:00.000Z"),
    });
    return { service, save };
  };

  it("enregistre ressenti, commentaire et douleur après ; commentaire blanc → null", async () => {
    const { service, save } = make();
    await service.finalizeExecution({ executionId: "e", feeling: "VERY_GOOD", comment: "  ", painAfter: 0 });
    expect(save).toHaveBeenCalledWith({ executionId: "e", feeling: "VERY_GOOD", comment: null, painAfter: 0 }, "2026-11-27T18:42:00.000Z");
  });

  it("refuse un ressenti inconnu, un commentaire de plus de 200 caractères, une douleur hors 0..10", async () => {
    const { service, save } = make();
    await expect(service.finalizeExecution({ executionId: "e", feeling: "OK" as never, comment: null, painAfter: null })).rejects.toThrow();
    await expect(service.finalizeExecution({ executionId: "e", feeling: "GOOD", comment: "x".repeat(201), painAfter: null })).rejects.toThrow();
    await expect(service.finalizeExecution({ executionId: "e", feeling: "GOOD", comment: null, painAfter: 11 })).rejects.toThrow();
    expect(save).not.toHaveBeenCalled();
  });
});
