import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { layoutPlacementSlots } from "@/domain/sessions/layoutPlacement";
import { moveLayoutStopPoint } from "@/domain/sessions/layoutMoves";
import { createEmptyDraft, createExerciseDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import type { StructureElement, StructureStopPointLocation } from "@/domain/sessions/structure";

/**
 * Recette du 17/11/2026 (Hermann, constat b : « on ne doit pas pouvoir mettre de point d'arrêt dans un circuit For Time ») :
 * aucun emplacement de Point à l'intérieur d'un Circuit For time ; avant et après le Circuit, inchangé. Un Point déjà présent
 * reste rendu (pour être retiré) ; un Point ne peut pas y être déplacé.
 */

type Point = StructureStopPointLocation & { readonly id: string };

const exercise = (id: string) => ({ ...createExerciseDraft(id), name: id, executionParameters: durationParameters(30, 1) });

/** e0, Circuit ft [a, b] (For time ou standard), e9. */
function draftOf(forTime: boolean, stopPoints: Point[] = []): SessionDraft {
  const elements: StructureElement<string>[] = [
    { kind: "EXERCISE", exercise: "e0" },
    {
      kind: "CIRCUIT",
      circuit: { id: "ft", repeatCount: 3, nature: "TOURS", exercises: ["a", "b"], ...(forTime ? { format: { key: "FOR_TIME", settings: {} } } : {}) },
    },
    { kind: "EXERCISE", exercise: "e9" },
  ];
  return { ...createEmptyDraft(), exercises: ["e0", "a", "b", "e9"].map(exercise), structure: { elements, stopPoints } };
}

const label = (target: StructureStopPointLocation) => `${target.circuitId ?? "S"}@${target.position}`;
const offered = (draft: SessionDraft) =>
  layoutPlacementSlots(draft).flatMap((slot) => (slot.stopPoint === null ? [] : [`${label(slot.place)}${slot.stopPoint.existing ? "*" : ""}`]));

describe("Recette du 17/11/2026, constat b — pas de Point d'arrêt dans un Circuit For time", () => {
  it("Circuit standard : emplacements dans le Circuit proposés (inchangé)", () => {
    expect(offered(draftOf(false))).toEqual(["S@1", "ft@0", "ft@1", "ft@2", "S@2"]);
  });

  it("Circuit For time : seuls les emplacements avant et après le Circuit sont proposés", () => {
    expect(offered(draftOf(true))).toEqual(["S@1", "S@2"]);
  });

  it("Point déjà présent dans un Circuit For time : rendu sélectionné (retirable), rien d'autre dans le Circuit", () => {
    expect(offered(draftOf(true, [{ id: "p", circuitId: "ft", position: 1 }]))).toEqual(["S@1", "ft@1*", "S@2"]);
  });

  it("un Point ne peut pas être déplacé dans un Circuit For time", () => {
    const draft = draftOf(true, [{ id: "p", circuitId: null, position: 1 }]);
    expect(moveLayoutStopPoint(draft, "p", { circuitId: "ft", position: 1 }, () => "x")).toEqual({ status: "REFUSED", reason: "STOP_POINT_NOT_ALLOWED" });
    expect(moveLayoutStopPoint(draftOf(false, [{ id: "p", circuitId: null, position: 1 }]), "p", { circuitId: "ft", position: 1 }, () => "x").status).toBe("APPLIED");
  });
});
