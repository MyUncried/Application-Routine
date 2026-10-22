import { describe, expect, it } from "@jest/globals";

import type { StructuralPosition } from "../Session";
import { createEmptyDraft, createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "../SessionDraft";
import {
  EMPTY_PLACEMENT_DRAFT,
  applyPlacementDraft,
  effectivePlacementStopPoints,
  isPlacementStopPointAdded,
  isPlacementStopPointRemoved,
  placementConfirmation,
  placementSlots,
  removePlacementRecovery,
  setOccurrenceRecovery,
  setPlacementRecovery,
  setPlacementRecoveryChange,
  togglePlacementStopPoint,
  togglePlacementStopPointRemoval,
  type PlacementDraft,
} from "../placement";
import type { StopPoint, StopPointLocation } from "../StopPoint";

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
/** Contexte de la matrice (story 6.3, revue : `context` obligatoire). */
const MATRIX_CONTEXT = draftOf(MATRIX);

/**
 * Sous-brouillon construit SANS contrôle (ajouts éventuellement non proposés ou consécutifs) — la
 * forme sans contexte de `togglePlacementStopPoint` étant retirée (story 6.3, revue), pour vérifier
 * que l'applicabilité les écarte.
 */
function withAddedStopPoints(placement: PlacementDraft, ...locations: StopPointLocation[]): PlacementDraft {
  return { ...placement, stopPoints: [...placement.stopPoints, ...locations] };
}

describe("placementSlots (PRE-6 story 4.1, emplacements autorisés)", () => {
  it("offers a recovery after A, B, C, D and stop points after A, B, C and after the Circuit — never after D (before the End)", () => {
    expect(placementSlots(MATRIX)).toEqual([
      { kind: "OCCURRENCE", occurrenceId: "A", recovery: { kind: "AVAILABLE" }, stopPoint: { location: { scope: "BEFORE_TOUR", position: 1 }, existing: false } },
      { kind: "OCCURRENCE", occurrenceId: "B", recovery: { kind: "AVAILABLE" }, stopPoint: { location: { scope: "IN_TOUR", position: 1 }, existing: false } },
      { kind: "OCCURRENCE", occurrenceId: "C", recovery: { kind: "AVAILABLE" }, stopPoint: { location: { scope: "IN_TOUR", position: 2 }, existing: false } },
      { kind: "AFTER_CIRCUIT", occurrenceId: null, recovery: null, stopPoint: { location: { scope: "AFTER_TOUR", position: 0 }, existing: false } },
      { kind: "OCCURRENCE", occurrenceId: "D", recovery: { kind: "AVAILABLE" }, stopPoint: null },
    ]);
  });

  it("follows the displayed zone order, whatever the order of the draft array", () => {
    const shuffled = [MATRIX[3], MATRIX[1], MATRIX[0], MATRIX[2]];
    expect(placementSlots(shuffled).map((slot) => slot.occurrenceId)).toEqual(["A", "B", "C", null, "D"]);
  });

  it("a single exercise: a recovery after it, no stop point", () => {
    expect(placementSlots([occ("A", "BEFORE_TOUR")])).toEqual([
      { kind: "OCCURRENCE", occurrenceId: "A", recovery: { kind: "AVAILABLE" }, stopPoint: null },
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
      { kind: "OCCURRENCE", occurrenceId: "A", recovery: { kind: "AVAILABLE" }, stopPoint: { location: { scope: "BEFORE_TOUR", position: 1 }, existing: false } },
      { kind: "OCCURRENCE", occurrenceId: "B", recovery: { kind: "AVAILABLE" }, stopPoint: null },
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

  // Story 6.1 (revue, D-436) : une ancienne Récupération autonome n'est plus un voisin (RM-219) —
  // un point qu'elle seule précède suivrait le compte à rebours.
  it("never offers a recovery after a legacy Récupération occurrence; a stop point after it only if an Exercise precedes", () => {
    const legacy: SessionDraftExercise = { ...occ("R", "BEFORE_TOUR"), type: "RECOVERY" };
    const slots = placementSlots([occ("W", "BEFORE_TOUR"), legacy, occ("B", "IN_TOUR"), occ("D", "AFTER_TOUR")]);
    expect(slots[1]).toEqual({
      kind: "OCCURRENCE",
      occurrenceId: "R",
      recovery: null,
      stopPoint: { location: { scope: "BEFORE_TOUR", position: 2 }, existing: false },
    });
    const leading = placementSlots([legacy, occ("B", "IN_TOUR"), occ("D", "AFTER_TOUR")]);
    expect(leading.map((slot) => slot.occurrenceId)).toEqual(["B", null, "D"]);
  });

  it("no occurrence: no slot", () => {
    expect(placementSlots([])).toEqual([]);
  });
});

describe("PlacementDraft (AD-43, sous-brouillon)", () => {
  it("counts a recovery + a stop point at the same location as 2, and a deselection subtracts", () => {
    let placement = setPlacementRecovery(EMPTY_PLACEMENT_DRAFT, "B", 30);
    expect(placementConfirmation(placement, MATRIX_CONTEXT)).toEqual({ kind: "ADDITIONS_ONLY", count: 1 });
    placement = togglePlacementStopPoint(placement, { scope: "IN_TOUR", position: 1 }, MATRIX_CONTEXT);
    expect(placementConfirmation(placement, MATRIX_CONTEXT)).toEqual({ kind: "ADDITIONS_ONLY", count: 2 });
    expect(isPlacementStopPointAdded(placement, { scope: "IN_TOUR", position: 1 })).toBe(true);
    placement = togglePlacementStopPoint(placement, { scope: "IN_TOUR", position: 1 }, MATRIX_CONTEXT);
    expect(isPlacementStopPointAdded(placement, { scope: "IN_TOUR", position: 1 })).toBe(false);
    placement = removePlacementRecovery(placement, "B");
    expect(placementConfirmation(placement, MATRIX_CONTEXT)).toEqual({ kind: "NONE" });
  });

  it("updates a recovery already chosen without counting it twice; 0 is kept as present", () => {
    let placement = setPlacementRecovery(EMPTY_PLACEMENT_DRAFT, "B", 30);
    placement = setPlacementRecovery(placement, "B", 0);
    expect(placement.recoveries).toEqual({ B: 0 });
    expect(placementConfirmation(placement, MATRIX_CONTEXT)).toEqual({ kind: "ADDITIONS_ONLY", count: 1 });
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
    placement = togglePlacementStopPoint(placement, { scope: "IN_TOUR", position: 1 }, draft);
    placement = togglePlacementStopPoint(placement, { scope: "AFTER_TOUR", position: 0 }, draft);
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
    const draft = draftOf(MATRIX, [existing]);
    const result = applyPlacementDraft(
      draft,
      togglePlacementStopPoint(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 2 }, draft),
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
    placement = withAddedStopPoints(placement, { scope: "BEFORE_TOUR", position: 1 }, { scope: "IN_TOUR", position: 1 });
    expect(applyPlacementDraft(draft, placement, () => "x")).toBe(draft);
  });
});

describe("modification of an existing recovery in placement (PRE-6 story 4.2)", () => {
  it("is not counted in N but makes the sub-draft confirmable", () => {
    const context = draftOf([occ("A", "BEFORE_TOUR"), occ("B", "IN_TOUR", 20)]);
    const placement = setPlacementRecoveryChange(EMPTY_PLACEMENT_DRAFT, "B", 45, 20);
    expect(placementConfirmation(placement, context)).toEqual({ kind: "CHANGES" });
    expect(placementConfirmation(EMPTY_PLACEMENT_DRAFT, context)).toEqual({ kind: "NONE" });
  });

  it("going back to the draft value clears the modification", () => {
    const changed = setPlacementRecoveryChange(EMPTY_PLACEMENT_DRAFT, "B", 45, 20);
    const back = setPlacementRecoveryChange(changed, "B", 20, 20);
    expect(back.recoveryChanges).toEqual({});
    expect(placementConfirmation(back, draftOf([occ("A", "BEFORE_TOUR"), occ("B", "IN_TOUR", 20)]))).toEqual({ kind: "NONE" });
    expect(setPlacementRecoveryChange(EMPTY_PLACEMENT_DRAFT, "B", 20, 20)).toBe(EMPTY_PLACEMENT_DRAFT);
  });

  it("Confirmer applies it to the existing recovery only (R = 20 → 45), never creating one", () => {
    const draft = draftOf([occ("A", "BEFORE_TOUR"), occ("B", "IN_TOUR", 20)]);
    let placement = setPlacementRecoveryChange(EMPTY_PLACEMENT_DRAFT, "B", 45, 20);
    placement = setPlacementRecoveryChange(placement, "A", 30, null);
    const result = applyPlacementDraft(draft, placement, () => "x");
    expect(result.exercises.map((exercise) => exercise.postActivityRecoverySeconds)).toEqual([null, 45]);
    expect(draft.exercises[1]!.postActivityRecoverySeconds).toBe(20);
  });

  it("keeps 0 as present (D-323)", () => {
    const draft = draftOf([occ("A", "BEFORE_TOUR", 20), occ("B", "IN_TOUR")]);
    const result = applyPlacementDraft(draft, setPlacementRecoveryChange(EMPTY_PLACEMENT_DRAFT, "A", 0, 20), () => "x");
    expect(result.exercises[0]!.postActivityRecoverySeconds).toBe(0);
  });
});

describe("setOccurrenceRecovery (PRE-6 story 4.2, hors placement)", () => {
  const draft = draftOf([occ("A", "BEFORE_TOUR", 20), occ("B", "IN_TOUR")]);

  it("modifies the occurrence only (0 kept as present, D-323)", () => {
    expect(setOccurrenceRecovery(draft, "A", 45).exercises.map((e) => e.postActivityRecoverySeconds)).toEqual([45, null]);
    expect(setOccurrenceRecovery(draft, "A", 0).exercises[0]!.postActivityRecoverySeconds).toBe(0);
    expect(draft.exercises[0]!.postActivityRecoverySeconds).toBe(20);
  });

  it("removes it (null: absent recovery)", () => {
    expect(setOccurrenceRecovery(draft, "A", null).exercises[0]!.postActivityRecoverySeconds).toBeNull();
  });

  it("returns the same draft for an unknown occurrence or an unchanged value", () => {
    expect(setOccurrenceRecovery(draft, "gone", 30)).toBe(draft);
    expect(setOccurrenceRecovery(draft, "A", 20)).toBe(draft);
    expect(setOccurrenceRecovery(draft, "B", null)).toBe(draft);
  });

  it("ignores invalid seconds (non-integer, negative, NaN) and non-EXERCISE occurrences", () => {
    for (const seconds of [2.5, -1, Number.NaN]) {
      expect(setOccurrenceRecovery(draft, "A", seconds)).toBe(draft);
    }
    const withRecoveryOccurrence = draftOf([{ ...occ("R", "BEFORE_TOUR", 20), type: "RECOVERY" }, occ("B", "IN_TOUR")]);
    expect(setOccurrenceRecovery(withRecoveryOccurrence, "R", 45)).toBe(withRecoveryOccurrence);
    expect(setOccurrenceRecovery(withRecoveryOccurrence, "R", null)).toBe(withRecoveryOccurrence);
  });
});

/**
 * PRE-6 story 6.1 (D-436, RM-251) : points existants désélectionnables (retraits programmés
 * par identifiant), emplacements jamais consécutifs à l'état effectif, points existants non
 * proposés rendus pour être retirés, état du libellé de Confirmer.
 */
describe("placement et Points d'arrêt indépendants (story 6.1, D-436, RM-251)", () => {
  /** W (avant), Circuit [A, B, C], Z (après). */
  const ROW = [occ("W", "BEFORE_TOUR"), occ("A", "IN_TOUR"), occ("B", "IN_TOUR"), occ("C", "IN_TOUR"), occ("Z", "AFTER_TOUR")];
  const offered = (slots: ReturnType<typeof placementSlots>) =>
    slots.flatMap((slot) =>
      slot.stopPoint === null
        ? []
        : [`${slot.stopPoint.location.scope}:${slot.stopPoint.location.position}${slot.stopPoint.existing ? "*" : ""}`],
    );
  const atEnd: StopPoint = { id: "p", scope: "IN_TOUR", position: 3 };

  it("un point existant : emplacement existant (désélectionnable, identifiant fourni), voisins consécutifs non proposés", () => {
    const slots = placementSlots(ROW, [atEnd]);
    // (IN, 3) « après le dernier du Circuit » et (AFTER, 0) « après le Circuit » sont consécutifs.
    expect(offered(slots)).toEqual(["BEFORE_TOUR:1", "IN_TOUR:1", "IN_TOUR:2", "IN_TOUR:3*"]);
    expect(slots.find((slot) => slot.occurrenceId === "C")?.stopPoint).toEqual({
      location: { scope: "IN_TOUR", position: 3 },
      existing: true,
      stopPointId: "p",
    });
  });

  it("frontière, Circuit vide : « avant » et « après » le Circuit ne sont jamais tous deux proposés", () => {
    const exercises = [occ("W", "BEFORE_TOUR"), occ("Z", "AFTER_TOUR"), occ("Y", "AFTER_TOUR")];
    expect(offered(placementSlots(exercises, [{ scope: "BEFORE_TOUR", position: 1 }]))).toEqual([
      "BEFORE_TOUR:1*",
      "AFTER_TOUR:1",
    ]);
  });

  it("R3 : un point existant sur un emplacement non proposé est rendu, existant, pour être retiré", () => {
    const head: StopPoint = { id: "h", scope: "IN_TOUR", position: 0 };
    const far: StopPoint = { id: "x", scope: "BEFORE_TOUR", position: 9 };
    const beforeEnd: StopPoint = { id: "e", scope: "AFTER_TOUR", position: 1 };
    const slots = placementSlots(ROW, [far, beforeEnd, head]);
    // Interdit mais ancré sous Z : rendu sous Z.
    expect(slots.find((slot) => slot.occurrenceId === "Z")?.stopPoint).toEqual({
      location: { scope: "AFTER_TOUR", position: 1 },
      existing: true,
      stopPointId: "e",
    });
    // Sans ancrage : en fin de liste, dans l'ordre structurel.
    expect(slots.filter((slot) => slot.kind === "UNOFFERED_STOP_POINT")).toEqual([
      { kind: "UNOFFERED_STOP_POINT", occurrenceId: null, recovery: null, stopPoint: { location: { scope: "BEFORE_TOUR", position: 9 }, existing: true, stopPointId: "x" } },
      { kind: "UNOFFERED_STOP_POINT", occurrenceId: null, recovery: null, stopPoint: { location: { scope: "IN_TOUR", position: 0 }, existing: true, stopPointId: "h" } },
    ]);
    // Le point « après le Circuit » reste le premier emplacement sans occurrence.
    expect(slots.find((slot) => slot.occurrenceId === null)?.kind).toBe("AFTER_CIRCUIT");
  });

  it("l'état effectif compte : un retrait programmé libère les voisins, un ajout les retire", () => {
    const removal = togglePlacementStopPoint(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 3 }, { exercises: ROW, stopPoints: [atEnd] });
    expect(removal.stopPointRemovals).toEqual(["p"]);
    expect(offered(placementSlots(ROW, [atEnd], removal))).toEqual([
      "BEFORE_TOUR:1",
      "IN_TOUR:1",
      "IN_TOUR:2",
      "IN_TOUR:3*",
      "AFTER_TOUR:0",
    ]);
    const addition = togglePlacementStopPoint(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 3 }, { exercises: ROW, stopPoints: [] });
    expect(offered(placementSlots(ROW, [], addition))).toEqual(["BEFORE_TOUR:1", "IN_TOUR:1", "IN_TOUR:2", "IN_TOUR:3"]);
  });

  it("un point ajouté reste rendu et désélectionnable même si un voisin le rend consécutif", () => {
    const placement = withAddedStopPoints(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 3 }, { scope: "AFTER_TOUR", position: 0 });
    expect(offered(placementSlots(ROW, [], placement))).toEqual([
      "BEFORE_TOUR:1",
      "IN_TOUR:1",
      "IN_TOUR:2",
      "IN_TOUR:3",
      "AFTER_TOUR:0",
    ]);
    const context = { exercises: ROW, stopPoints: [] };
    expect(isPlacementStopPointAdded(togglePlacementStopPoint(placement, { scope: "AFTER_TOUR", position: 0 }, context), { scope: "AFTER_TOUR", position: 0 })).toBe(false);
  });

  it("toucher un point existant programme son retrait (par identifiant) ; retoucher l'annule", () => {
    const point: StopPoint = { id: "q", scope: "IN_TOUR", position: 1 };
    const context = { exercises: ROW, stopPoints: [point] };
    const removed = togglePlacementStopPoint(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 1 }, context);
    expect(isPlacementStopPointRemoved(removed, "q")).toBe(true);
    expect(placementConfirmation(removed, context)).toEqual({ kind: "CHANGES" });
    const restored = togglePlacementStopPointRemoval(removed, "q", context);
    expect(isPlacementStopPointRemoved(restored, "q")).toBe(false);
    expect(placementConfirmation(restored, context)).toEqual({ kind: "NONE" });
  });

  it("avec contexte, un ajout consécutif, interdit ou en tête de Circuit est refusé (sous-brouillon inchangé)", () => {
    const context = { exercises: ROW, stopPoints: [atEnd] };
    for (const location of [
      { scope: "AFTER_TOUR" as const, position: 0 },
      { scope: "AFTER_TOUR" as const, position: 1 },
      { scope: "IN_TOUR" as const, position: 0 },
    ]) {
      expect(togglePlacementStopPoint(EMPTY_PLACEMENT_DRAFT, location, context)).toBe(EMPTY_PLACEMENT_DRAFT);
    }
  });

  it("annuler un retrait qui rendrait le point consécutif à un ajout est refusé", () => {
    const context = { exercises: ROW, stopPoints: [atEnd] };
    let placement = togglePlacementStopPoint(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 3 }, context);
    placement = togglePlacementStopPoint(placement, { scope: "AFTER_TOUR", position: 0 }, context);
    expect(isPlacementStopPointAdded(placement, { scope: "AFTER_TOUR", position: 0 })).toBe(true);
    expect(togglePlacementStopPoint(placement, { scope: "IN_TOUR", position: 3 }, context)).toBe(placement);
    expect(togglePlacementStopPointRemoval(placement, "p", context)).toBe(placement);
  });

  it("Confirmer applique retraits et ajouts ; un retrait ou un mélange donne « les modifications »", () => {
    const existing: StopPoint[] = [{ id: "keep", scope: "BEFORE_TOUR", position: 1 }, atEnd];
    const draft = draftOf(ROW, existing);
    let placement = togglePlacementStopPoint(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 3 }, draft);
    expect(placementConfirmation(placement, draft)).toEqual({ kind: "CHANGES" });
    expect(applyPlacementDraft(draft, placement, () => "x").stopPoints).toEqual([existing[0]]);
    placement = togglePlacementStopPoint(placement, { scope: "AFTER_TOUR", position: 0 }, draft);
    expect(placementConfirmation(placement, draft)).toEqual({ kind: "CHANGES" });
    expect(applyPlacementDraft(draft, placement, () => "new").stopPoints).toEqual([
      existing[0],
      { id: "new", scope: "AFTER_TOUR", position: 0 },
    ]);
  });

  it("placementConfirmation : rien, ajouts seuls (N), modification de durée seule ou mêlée", () => {
    const context = draftOf([occ("A", "BEFORE_TOUR"), occ("B", "IN_TOUR", 20), occ("C", "IN_TOUR")]);
    expect(placementConfirmation(EMPTY_PLACEMENT_DRAFT, context)).toEqual({ kind: "NONE" });
    const additions = togglePlacementStopPoint(
      setPlacementRecovery(EMPTY_PLACEMENT_DRAFT, "A", 30),
      { scope: "IN_TOUR", position: 1 },
      context,
    );
    expect(placementConfirmation(additions, context)).toEqual({ kind: "ADDITIONS_ONLY", count: 2 });
    expect(placementConfirmation(setPlacementRecoveryChange(EMPTY_PLACEMENT_DRAFT, "B", 45, 20), context)).toEqual({
      kind: "CHANGES",
    });
    expect(placementConfirmation(setPlacementRecoveryChange(additions, "B", 45, 20), context)).toEqual({ kind: "CHANGES" });
  });

  it("avec contexte, placementConfirmation ne compte que l'applicable", () => {
    const draft = draftOf(ROW);
    const placement = withAddedStopPoints(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 3 }, { scope: "AFTER_TOUR", position: 0 });
    expect(placementConfirmation(placement, draft)).toEqual({ kind: "ADDITIONS_ONLY", count: 1 });
    const unknownRemoval = { ...EMPTY_PLACEMENT_DRAFT, stopPointRemovals: ["inconnu"] };
    expect(placementConfirmation(unknownRemoval, draft)).toEqual({ kind: "NONE" });
    const sameDuration = setPlacementRecoveryChange(EMPTY_PLACEMENT_DRAFT, "A", 45, 20);
    expect(placementConfirmation(sameDuration, draftOf([occ("W", "BEFORE_TOUR"), occ("A", "IN_TOUR", 45)]))).toEqual({ kind: "NONE" });
  });

  it("Confirmer ne crée jamais deux points consécutifs, même si le sous-brouillon en porte (construit sans contrôle)", () => {
    const placement = withAddedStopPoints(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 3 }, { scope: "AFTER_TOUR", position: 0 });
    let next = 0;
    expect(applyPlacementDraft(draftOf(ROW), placement, () => `sp-${++next}`).stopPoints).toEqual([
      { id: "sp-1", scope: "IN_TOUR", position: 3 },
    ]);
  });

  it("un retrait d'un identifiant inconnu est ignoré (brouillon tel quel)", () => {
    const draft = draftOf(ROW, [atEnd]);
    expect(applyPlacementDraft(draft, { ...EMPTY_PLACEMENT_DRAFT, stopPointRemovals: ["inconnu"] }, () => "x")).toBe(draft);
  });

  it("R3 : un point existant non proposé (tête de Circuit) se retire en placement", () => {
    const head: StopPoint = { id: "h", scope: "IN_TOUR", position: 0 };
    const draft = draftOf(ROW, [head]);
    const placement = togglePlacementStopPointRemoval(EMPTY_PLACEMENT_DRAFT, "h", draft);
    expect(applyPlacementDraft(draft, placement, () => "x").stopPoints).toEqual([]);
  });

  it("story 6.3 (revue) : deux points existants déjà consécutifs (hérités) ne bloquent pas la resélection de l'un d'eux", () => {
    const legacy: StopPoint[] = [atEnd, { id: "t", scope: "AFTER_TOUR", position: 0 }];
    const context = draftOf(ROW, legacy);
    const removed = togglePlacementStopPointRemoval(EMPTY_PLACEMENT_DRAFT, "t", context);
    expect(isPlacementStopPointRemoved(removed, "t")).toBe(true);
    const reselected = togglePlacementStopPointRemoval(removed, "t", context);
    expect(isPlacementStopPointRemoved(reselected, "t")).toBe(false);
    expect(placementConfirmation(reselected, context)).toEqual({ kind: "NONE" });
  });

  it("story 6.3 (revue) : deux points hérités sur la même clé se retirent indépendamment, par identifiant", () => {
    const twins: StopPoint[] = [
      { id: "x", scope: "BEFORE_TOUR", position: 1 },
      { id: "y", scope: "BEFORE_TOUR", position: 1 },
    ];
    const draft = draftOf(ROW, twins);
    const removed = togglePlacementStopPointRemoval(EMPTY_PLACEMENT_DRAFT, "y", draft);
    expect(applyPlacementDraft(draft, removed, () => "n").stopPoints).toEqual([twins[0]]);
    const nan: StopPoint[] = [
      { id: "m", scope: "IN_TOUR", position: Number.NaN },
      { id: "n", scope: "IN_TOUR", position: Number.NaN },
    ];
    const nanDraft = draftOf(ROW, nan);
    const nanRemoved = togglePlacementStopPointRemoval(EMPTY_PLACEMENT_DRAFT, "m", nanDraft);
    expect(applyPlacementDraft(nanDraft, nanRemoved, () => "z").stopPoints).toEqual([nan[1]]);
  });

  it("effectivePlacementStopPoints : existants − retraits (par identifiant) + ajouts", () => {
    const placement = {
      ...EMPTY_PLACEMENT_DRAFT,
      stopPoints: [{ scope: "IN_TOUR" as const, position: 2 }],
      stopPointRemovals: ["a"],
    };
    expect(
      effectivePlacementStopPoints(
        [
          { id: "a", scope: "IN_TOUR", position: 1 },
          { id: "b", scope: "BEFORE_TOUR", position: 1 },
        ],
        placement,
      ),
    ).toEqual([
      { id: "b", scope: "BEFORE_TOUR", position: 1 },
      { scope: "IN_TOUR", position: 2 },
    ]);
  });
});
