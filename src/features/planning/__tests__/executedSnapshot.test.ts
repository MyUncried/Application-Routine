import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { EXERCISE_SNAPSHOT_VERSION } from "@/domain/activities/exerciseSnapshot";
import type { SessionSnapshot } from "@/domain/sessions/sessionSnapshot";
import { buildAgendaGroups } from "@/features/planning/agendaCards";
import { projectSnapshotForCatalogue } from "@/features/sessions/sessionCatalogueProjection";

/**
 * Recette du 22/11/2026 (constat b — Hermann : « Modifier une séance dans le catalogue modifie la séance dans la routine (OK), les
 * occurrences non-exécutées (OK), mais aussi les occurrences exécutées (KO) ») : une carte exécutée montre la Séance telle
 * qu'elle a été exécutée (instantané), pas la Séance actuelle du Catalogue.
 */
const snapshot = (name: string, exercise: string, zone: string): SessionSnapshot => ({
  snapshotVersion: 1,
  sessionId: "s",
  name,
  origin: null,
  initialCountdownSeconds: 10,
  finalPhaseSeconds: 5,
  structure: {
    elements: [
      {
        kind: "EXERCISE",
        exercise: {
          id: `${exercise}-1`,
          type: "EXERCISE",
          executionParameters: durationParameters(30),
          postActivityRecoverySeconds: 0,
          format: null,
          exercise: {
            snapshotVersion: EXERCISE_SNAPSHOT_VERSION,
            sourceMovementId: `mv-${exercise}`,
            name: exercise,
            categoryId: null,
            bodyZoneIds: [zone],
            executionParameters: durationParameters(30),
            recoverySeconds: 0,
            media: [],
            actualDurationSeconds: null,
          },
        },
      },
    ],
    stopPoints: [],
  },
});

describe("Séance exécutée : instantané plutôt que Catalogue (constat b, 22/11/2026)", () => {
  it("projection de l'instantané : nom, composition et Zones de la Séance exécutée", () => {
    const projection = projectSnapshotForCatalogue(snapshot("Avant", "Squat", "dos"), new Map());
    expect(projection.name).toBe("Avant");
    expect(projection.bodyZoneIds).toEqual(["dos"]);
    expect(projection.tree.filter((line) => line.kind === "EXERCISE").map((line) => (line.kind === "EXERCISE" ? line.name : ""))).toEqual(["Squat"]);
  });

  it("carte exécutée : la Séance de l'instantané ; sans instantané : la Séance du Catalogue", () => {
    const current = projectSnapshotForCatalogue(snapshot("Après", "Fente", "jambes"), new Map());
    const executed = projectSnapshotForCatalogue(snapshot("Avant", "Squat", "dos"), new Map());
    const execution = { executionId: "x", sessionId: "s", sessionName: "Avant", startedAt: new Date(2030, 7, 5, 9).toISOString(), endedAt: new Date(2030, 7, 5, 9, 5).toISOString(), businessStatus: "COMPLETED" as const, link: null };
    const build = (withSnapshot: boolean) =>
      buildAgendaGroups({
        occurrences: [],
        executions: [execution],
        projections: new Map([["s", current]]),
        isPlannable: () => true,
        routineFilter: null,
        now: 0,
        ...(withSnapshot ? { executionProjections: new Map([["x", executed]]) } : {}),
      });
    const cardOf = (groups: ReturnType<typeof build>) => [...groups.values()].flat()[0]!.cards[0]!;
    expect(cardOf(build(true)).projection).toBe(executed);
    expect(cardOf(build(false)).projection).toBe(current);
  });
});
