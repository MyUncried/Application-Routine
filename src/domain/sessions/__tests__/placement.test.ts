import { describe, expect, it } from "@jest/globals";

import type { StructuralPosition } from "../Session";
import { createEmptyDraft, createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "../SessionDraft";
import {
  EMPTY_PLACEMENT_DRAFT,
  applyPlacementDraft,
  isPlacementStopPointAdded,
  placementAdditionCount,
  placementSlots,
  removePlacementRecovery,
  setPlacementRecovery,
  togglePlacementStopPoint,
} from "../placement";
import type { StopPoint } from "../StopPoint";

function occ(
  id: string,
  structuralPosition: StructuralPosition,
  postActivityRecoverySeconds: number | null = null,
): SessionDraftExercise {
  return { ...createExerciseDraft(id, postActivityRecoverySeconds), name: id, structuralPosition };
}

function draftOf(exercises: readonly SessionDraftExercise[], stopPoints?: readonly StopPoint[]): SessionDraft {
  return { ...createEmptyDraft(), exercises, ...(stopPoints !== undefined ? { stopPoints } : {}) };
}

/** A (avant), Circuit [B, C], D (après) — matrice de la story 4.1. */
const MATRIX = [occ("A", "BEFORE_TOUR"), occ("B", "IN_TOUR"), occ("C", "IN_TOUR"), occ("D", "AFTER_TOUR")];

describe("placementSlots (PRE-6 story 4.1, emplacements autorisés)", () => {
  it("offers a recovery after A, B, C, D and stop points after A, B, C and after the Circuit — never after D (before the End)", () => {
    expect(placementSlots(MATRIX)).toEqual([
      { occurrenceId: "A", recovery: { kind: "AVAILABLE" }, stopPoint: { location: { scope: "BEFORE_TOUR", position: 1 }, existing: false } },
      { occurrenceId: "B", recovery: { kind: "AVAILABLE" }, stopPoint: { location: { scope: "IN_TOUR", position: 1 }, existing: false } },
      { occurrenceId: "C", recovery: { kind: "AVAILABLE" }, stopPoint: { location: { scope: "IN_TOUR", position: 2 }, existing: false } },
      { occurrenceId: null, recovery: null, stopPoint: { location: { scope: "AFTER_TOUR", position: 0 }, existing: false } },
      { occurrenceId: "D", recovery: { kind: "AVAILABLE" }, stopPoint: null },
    ]);
  });

  it("follows the displayed zone order, whatever the order of the draft array", () => {
    const shuffled = [MATRIX[3], MATRIX[1], MATRIX[0], MATRIX[2]];
    expect(placementSlots(shuffled).map((slot) => slot.occurrenceId)).toEqual(["A", "B", "C", null, "D"]);
  });

  it("a single exercise: a recovery after it, no stop point", () => {
    expect(placementSlots([occ("A", "BEFORE_TOUR")])).toEqual([
      { occurrenceId: "A", recovery: { kind: "AVAILABLE" }, stopPoint: null },
    ]);
  });

  it("an empty Circuit offers no stop point after it", () => {
    const slots = placementSlots([occ("A", "BEFORE_TOUR"), occ("D", "AFTER_TOUR")]);
    expect(slots.map((slot) => slot.occurrenceId)).toEqual(["A", "D"]);
    expect(slots[0].stopPoint).toEqual({ location: { scope: "BEFORE_TOUR", position: 1 }, existing: false });
    expect(slots[1].stopPoint).toBeNull();
  });

  it("a Circuit last in the session: no stop point after its last exercise nor after the Circuit (before the End)", () => {
    const slots = placementSlots([occ("A", "BEFORE_TOUR"), occ("B", "IN_TOUR")]);
    expect(slots).toEqual([
      { occurrenceId: "A", recovery: { kind: "AVAILABLE" }, stopPoint: { location: { scope: "BEFORE_TOUR", position: 1 }, existing: false } },
      { occurrenceId: "B", recovery: { kind: "AVAILABLE" }, stopPoint: null },
    ]);
  });

  it("shows an existing recovery (positive or 0) as existing, without an add chip", () => {
    const slots = placementSlots([occ("A", "BEFORE_TOUR", 0), occ("B", "IN_TOUR", 20), occ("C", "IN_TOUR")]);
    expect(slots[0].recovery).toEqual({ kind: "EXISTING", seconds: 0 });
    expect(slots[1].recovery).toEqual({ kind: "EXISTING", seconds: 20 });
    expect(slots[2].recovery).toEqual({ kind: "AVAILABLE" });
  });

  it("shows an existing stop point as existing (one point per location)", () => {
    const slots = placementSlots(MATRIX, [{ scope: "IN_TOUR", position: 1 }, { scope: "AFTER_TOUR", position: 0 }]);
    expect(slots.find((slot) => slot.occurrenceId === "B")?.stopPoint).toEqual({
      location: { scope: "IN_TOUR", position: 1 },
      existing: true,
    });
    expect(slots.find((slot) => slot.occurrenceId === null)?.stopPoint?.existing).toBe(true);
    expect(slots.find((slot) => slot.occurrenceId === "A")?.stopPoint?.existing).toBe(false);
  });

  it("never offers a recovery after a legacy Récupération occurrence, but still a stop point after it", () => {
    const legacy: SessionDraftExercise = { ...occ("R", "BEFORE_TOUR"), type: "RECOVERY" };
    const slots = placementSlots([legacy, occ("B", "IN_TOUR"), occ("D", "AFTER_TOUR")]);
    expect(slots[0]).toEqual({
      occurrenceId: "R",
      recovery: null,
      stopPoint: { location: { scope: "BEFORE_TOUR", position: 1 }, existing: false },
    });
  });

  it("no occurrence: no slot", () => {
    expect(placementSlots([])).toEqual([]);
  });
});

describe("PlacementDraft (AD-43, sous-brouillon)", () => {
  it("counts a recovery + a stop point at the same location as 2, and a deselection subtracts", () => {
    let placement = setPlacementRecovery(EMPTY_PLACEMENT_DRAFT, "B", 30);
    expect(placementAdditionCount(placement)).toBe(1);
    placement = togglePlacementStopPoint(placement, { scope: "IN_TOUR", position: 1 });
    expect(placementAdditionCount(placement)).toBe(2);
    expect(isPlacementStopPointAdded(placement, { scope: "IN_TOUR", position: 1 })).toBe(true);
    placement = togglePlacementStopPoint(placement, { scope: "IN_TOUR", position: 1 });
    expect(isPlacementStopPointAdded(placement, { scope: "IN_TOUR", position: 1 })).toBe(false);
    placement = removePlacementRecovery(placement, "B");
    expect(placementAdditionCount(placement)).toBe(0);
  });

  it("updates a recovery already chosen without counting it twice; 0 is kept as present", () => {
    let placement = setPlacementRecovery(EMPTY_PLACEMENT_DRAFT, "B", 30);
    placement = setPlacementRecovery(placement, "B", 0);
    expect(placement.recoveries).toEqual({ B: 0 });
    expect(placementAdditionCount(placement)).toBe(1);
  });

  it("removing a recovery that was never added keeps the same sub-draft", () => {
    expect(removePlacementRecovery(EMPTY_PLACEMENT_DRAFT, "B")).toBe(EMPTY_PLACEMENT_DRAFT);
  });
});

describe("applyPlacementDraft (« Confirmer », AD-43)", () => {
  it("applies recoveries and stop points to the draft in a single result", () => {
    const draft = draftOf(MATRIX);
    let placement = setPlacementRecovery(EMPTY_PLACEMENT_DRAFT, "B", 30);
    placement = setPlacementRecovery(placement, "D", 0);
    placement = togglePlacementStopPoint(placement, { scope: "IN_TOUR", position: 1 });
    placement = togglePlacementStopPoint(placement, { scope: "AFTER_TOUR", position: 0 });
    let next = 0;
    const result = applyPlacementDraft(draft, placement, () => `sp-${++next}`);

    expect(result.exercises.map((exercise) => exercise.postActivityRecoverySeconds)).toEqual([null, 30, null, 0]);
    expect(result.stopPoints).toEqual([
      { id: "sp-1", scope: "IN_TOUR", position: 1 },
      { id: "sp-2", scope: "AFTER_TOUR", position: 0 },
    ]);
    // Le brouillon d'entrée n'est jamais muté.
    expect(draft.exercises.map((exercise) => exercise.postActivityRecoverySeconds)).toEqual([null, null, null, null]);
    expect(draft.stopPoints).toBeUndefined();
  });

  it("keeps the existing stop points and appends the new ones", () => {
    const existing: StopPoint = { id: "kept", scope: "BEFORE_TOUR", position: 1 };
    const result = applyPlacementDraft(
      draftOf(MATRIX, [existing]),
      togglePlacementStopPoint(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 2 }),
      () => "new",
    );
    expect(result.stopPoints).toEqual([existing, { id: "new", scope: "IN_TOUR", position: 2 }]);
  });

  it("returns the same draft (identity) when nothing applies", () => {
    const draft = draftOf(MATRIX);
    expect(applyPlacementDraft(draft, EMPTY_PLACEMENT_DRAFT, () => "x")).toBe(draft);
  });

  it("ignores additions that are no longer offered: existing recovery or point, forbidden location, removed occurrence", () => {
    const draft = draftOf([occ("A", "BEFORE_TOUR", 20), occ("B", "IN_TOUR")], [{ id: "p", scope: "BEFORE_TOUR", position: 1 }]);
    let placement = setPlacementRecovery(EMPTY_PLACEMENT_DRAFT, "A", 45);
    placement = setPlacementRecovery(placement, "gone", 30);
    placement = togglePlacementStopPoint(placement, { scope: "BEFORE_TOUR", position: 1 });
    placement = togglePlacementStopPoint(placement, { scope: "IN_TOUR", position: 1 });
    expect(applyPlacementDraft(draft, placement, () => "x")).toBe(draft);
  });
});
