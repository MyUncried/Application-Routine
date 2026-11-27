import { describe, expect, it } from "@jest/globals";

import type { Program } from "@/domain/programs/Program";
import type { ProgramRepository } from "@/domain/programs/ProgramRepository";
import type { PlanningService } from "@/features/planning/PlanningService";
import { ProgramService } from "@/features/programs/ProgramService";

/**
 * D-427 / D-577 (27/11/2026) : option douleur d'un lancement depuis une occurrence — routine rattachée à un Programme dont le suivi
 * est actif, occurrence dans la période du Programme. Lecture seule (aucune écriture).
 */
function service(options: { programId: string | null; painTracking: boolean; date: string; found?: boolean }) {
  const program = { id: "p1", painTracking: options.painTracking, startDate: "2026-11-01", endDate: "2026-11-30" } as unknown as Program;
  const planning = {
    getOccurrence: async () => (options.found === false ? null : { routine: { programId: options.programId }, occurrence: { date: options.date } }),
  } as unknown as PlanningService;
  const repository = { get: async (id: string) => (id === "p1" ? program : null) } as unknown as ProgramRepository;
  return new ProgramService({ repository, planning, newId: () => "x", now: () => new Date() });
}

describe("ProgramService.painOptionFor (D-427, D-577)", () => {
  it("vraie seulement pour un Programme avec suivi actif et une occurrence dans sa période", async () => {
    expect(await service({ programId: "p1", painTracking: true, date: "2026-11-27" }).painOptionFor("r", "k")).toBe(true);
    expect(await service({ programId: "p1", painTracking: false, date: "2026-11-27" }).painOptionFor("r", "k")).toBe(false);
    expect(await service({ programId: "p1", painTracking: true, date: "2026-12-01" }).painOptionFor("r", "k")).toBe(false);
    expect(await service({ programId: null, painTracking: true, date: "2026-11-27" }).painOptionFor("r", "k")).toBe(false);
    expect(await service({ programId: "p1", painTracking: true, date: "2026-11-27", found: false }).painOptionFor("r", "k")).toBe(false);
  });
});
