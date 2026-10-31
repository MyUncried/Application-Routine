import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import {
  applyLayoutPlacementDraft,
  layoutPlacementConfirmation,
  layoutPlacementDesignation,
  layoutPlacementSlots,
  toggleLayoutPlacementStopPointOutcome,
  toggleLayoutPlacementStopPointRemoval,
} from "@/domain/sessions/layoutPlacement";
import { EMPTY_PLACEMENT_DRAFT, placementRecoverySeconds, selectPlacementRecovery, type PlacementDraft } from "@/domain/sessions/placement";
import { createEmptyDraft, createExerciseDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import type { StructureElement, StructureStopPointLocation } from "@/domain/sessions/structure";

/**
 * PRE-9 (story B.6 ; ch08 « Placement des récupérations et des points d'arrêt » ; CE-T03-08 ; D-441,
 * D-442 ; ARB-02a/b) — mode Placement sur une disposition générale : emplacements de tous les niveaux,
 * frontières des conteneurs, choix de début ou de fin de répétition, récupération attachée à
 * l'occurrence (RM-209, RM-210).
 */

type Point = StructureStopPointLocation & { readonly id: string };

const exercise = (id: string) => ({ ...createExerciseDraft(id), name: id, executionParameters: durationParameters(30, 1) });

/** e0, Cycle cy × k [c0, Circuit cb [b1, b2]], e9 (sans e9 : le Cycle clôt la Séance). */
function draftOf(k: number, stopPoints: Point[] = [], withTail = true): SessionDraft {
  const elements: StructureElement<string>[] = [
    { kind: "EXERCISE", exercise: "e0" },
    {
      kind: "CYCLE",
      cycle: {
        id: "cy",
        repeatCount: k,
        members: [
          { kind: "EXERCISE", exercise: "c0" },
          { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1", "b2"] } },
        ],
      },
    },
    ...(withTail ? [{ kind: "EXERCISE" as const, exercise: "e9" }] : []),
  ];
  return { ...createEmptyDraft(), exercises: ["e0", "c0", "b1", "b2", ...(withTail ? ["e9"] : [])].map(exercise), structure: { elements, stopPoints } };
}

const label = (target: StructureStopPointLocation) => `${target.circuitId ?? target.cycleId ?? "S"}@${target.position}`;
const offered = (draft: SessionDraft, placement: PlacementDraft = EMPTY_PLACEMENT_DRAFT) =>
  layoutPlacementSlots(draft, placement).flatMap((slot) => (slot.stopPoint === null ? [] : [`${label(slot.place)}${slot.stopPoint.existing ? "*" : ""}`]));
const designationOf = (draft: SessionDraft, text: string) => layoutPlacementSlots(draft).find((slot) => label(slot.place) === text)!.designation;

describe("PRE-9 B.6 — emplacements du placement sur toute la structure", () => {
  it("tous les niveaux, frontières comprises ; jamais juste après le Compte à rebours ni juste avant la Fin", () => {
    expect(offered(draftOf(1))).toEqual(["S@1", "cy@0", "cy@1", "cb@0", "cb@1", "cb@2", "cy@2", "S@2"]);
  });

  it("ARB-02b : Cycle répété qui clôt la Séance — fin de répétition proposée ; au niveau Séance, rien avant la Fin", () => {
    expect(offered(draftOf(1, [], false))).toEqual(["S@1", "cy@0", "cy@1", "cb@0", "cb@1"]);
    expect(offered(draftOf(2, [], false))).toEqual(["S@1", "cy@0", "cy@1", "cb@0", "cb@1", "cb@2", "cy@2"]);
  });

  it("rangée sous la carte : l'Exercice qui précède l'emplacement dans son conteneur", () => {
    const slots = layoutPlacementSlots(draftOf(1));
    const after = Object.fromEntries(slots.map((slot) => [label(slot.place), slot.afterExerciseId]));
    expect(after).toMatchObject({ "S@1": "e0", "cy@0": null, "cy@1": "c0", "cb@0": null, "cb@1": "b1", "cb@2": "b2", "cy@2": null, "S@2": null, "S@3": "e9" });
  });

  it("RM-251 : un Point existant est rendu sélectionné ; les emplacements qui lui seraient consécutifs ne sont pas proposés", () => {
    expect(offered(draftOf(1, [{ id: "p", circuitId: null, cycleId: "cy", position: 1 }]))).toEqual(["S@1", "cy@0", "cy@1*", "cb@1", "cb@2", "cy@2", "S@2"]);
  });
});

describe("PRE-9 B.6 — bascules, choix et confirmation", () => {
  it("ajout puis « Confirmer » : le Point est créé à son emplacement réel (dans le Circuit du Cycle)", () => {
    const draft = draftOf(1);
    const outcome = toggleLayoutPlacementStopPointOutcome(EMPTY_PLACEMENT_DRAFT, designationOf(draft, "cb@1"), draft);
    if (outcome.status !== "APPLIED") throw new Error(outcome.status);
    expect(layoutPlacementConfirmation(outcome.placement, draft)).toEqual({ kind: "ADDITIONS_ONLY", count: 1 });
    const applied = applyLayoutPlacementDraft(draft, outcome.placement, () => "new");
    expect(applied.structure?.stopPoints).toEqual([{ id: "new", circuitId: "cb", position: 1 }]);
    // Second toucher : l'ajout est retiré.
    const undone = toggleLayoutPlacementStopPointOutcome(outcome.placement, designationOf(draft, "cb@1"), draft);
    expect(undone.status === "APPLIED" && undone.placement.stopPoints).toEqual([]);
  });

  it("ARB-02b : un ajout qui ferait coexister début et fin de répétition d'un Cycle répété demande le choix", () => {
    const draft = draftOf(2, [{ id: "h", circuitId: null, cycleId: "cy", position: 0 }], false);
    const outcome = toggleLayoutPlacementStopPointOutcome(EMPTY_PLACEMENT_DRAFT, designationOf(draft, "cy@2"), draft);
    if (outcome.status !== "CHOICE_REQUIRED") throw new Error(outcome.status);
    expect(outcome.scope).toEqual({ kind: "CYCLE", id: "cy", repeatCount: 2 });
    // « Début de répétition » : l'ajout est jeté ; « Fin de répétition » : retrait du début programmé.
    expect(outcome.resolutions.HEAD.stopPoints).toEqual([]);
    expect(outcome.resolutions.TAIL.stopPointRemovals).toEqual(["h"]);
    expect(layoutPlacementConfirmation(outcome.resolutions.TAIL, draft)).toEqual({ kind: "CHANGES" });
    const applied = applyLayoutPlacementDraft(draft, outcome.resolutions.TAIL, () => "t");
    expect(applied.structure?.stopPoints).toEqual([{ id: "t", circuitId: null, cycleId: "cy", position: 2 }]);
  });

  it("D-441 : un Point existant se désélectionne (retrait programmé) et se resélectionne ; resélection refusée si un ajout le suivrait", () => {
    const draft = draftOf(1, [{ id: "p", circuitId: null, cycleId: "cy", position: 1 }]);
    const removed = toggleLayoutPlacementStopPointRemoval(EMPTY_PLACEMENT_DRAFT, "p", draft);
    expect(removed.stopPointRemovals).toEqual(["p"]);
    const withAddition = toggleLayoutPlacementStopPointOutcome(removed, designationOf(draft, "cb@0"), draft);
    if (withAddition.status !== "APPLIED") throw new Error(withAddition.status);
    expect(toggleLayoutPlacementStopPointRemoval(withAddition.placement, "p", draft)).toBe(withAddition.placement);
    expect(applyLayoutPlacementDraft(draft, withAddition.placement, () => "q").structure?.stopPoints).toEqual([{ id: "q", circuitId: "cb", position: 0 }]);
  });

  it("RM-209 / RM-210 : la récupération reste attachée à l'occurrence, où qu'elle soit (Circuit d'un Cycle)", () => {
    const draft = draftOf(2);
    const placement = selectPlacementRecovery(EMPTY_PLACEMENT_DRAFT, "b1", 20, draft);
    expect(placementRecoverySeconds(placement, draft.exercises.find((item) => item.id === "b1")!)).toBe(20);
    expect(layoutPlacementConfirmation(placement, draft)).toEqual({ kind: "ADDITIONS_ONLY", count: 1 });
    const applied = applyLayoutPlacementDraft(draft, placement, () => "unused");
    expect(applied.exercises.find((item) => item.id === "b1")?.postActivityRecoverySeconds).toBe(20);
    expect(applied.structure).toBe(draft.structure);
  });

  it("désignation : rang de l'emplacement dans la séquence, jamais enregistrée", () => {
    const draft = draftOf(1);
    expect(layoutPlacementSlots(draft).map((slot) => slot.designation)).toEqual(layoutPlacementSlots(draft).map((_, rank) => layoutPlacementDesignation(rank)));
    // Désignation hors séquence : rien.
    expect(toggleLayoutPlacementStopPointOutcome(EMPTY_PLACEMENT_DRAFT, layoutPlacementDesignation(99), draft)).toEqual({ status: "APPLIED", placement: EMPTY_PLACEMENT_DRAFT });
  });
});
