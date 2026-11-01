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
  setOccurrenceRecovery,
  togglePlacementStopPointOutcome,
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

// PRE-9 (ordre de Hermann du 01/11/2026, point 2 ; ch07 « Récupération de l'Exercice et défauts du
// Profil ») : le placement ne porte plus que les Points d'arrêt — les zones, ajouts, modifications et
// retraits de récupération (stories 4.1, 4.2, 7.1) sont retirés ; leurs tests sont remplacés par
// ceux-ci [texte d'origine dans l'historique Git].
describe("placementSlots (PRE-6 story 4.1, emplacements autorisés ; PRE-9 : Points d'arrêt seuls)", () => {
  it("offers stop points after A, B, C, at the Circuit head and after the Circuit — never after D (before the End), and no recovery zone", () => {
    expect(placementSlots(MATRIX)).toEqual([
      { kind: "OCCURRENCE", occurrenceId: "A", stopPoint: { location: { scope: "BEFORE_TOUR", position: 1 }, existing: false } },
      // Story 7.1 (D-442) : la tête de Circuit est proposée, juste avant la première occurrence du Circuit.
      { kind: "CIRCUIT_HEAD", occurrenceId: null, stopPoint: { location: { scope: "IN_TOUR", position: 0 }, existing: false } },
      { kind: "OCCURRENCE", occurrenceId: "B", stopPoint: { location: { scope: "IN_TOUR", position: 1 }, existing: false } },
      { kind: "OCCURRENCE", occurrenceId: "C", stopPoint: { location: { scope: "IN_TOUR", position: 2 }, existing: false } },
      { kind: "AFTER_CIRCUIT", occurrenceId: null, stopPoint: { location: { scope: "AFTER_TOUR", position: 0 }, existing: false } },
    ]);
  });

  it("follows the displayed zone order, whatever the order of the draft array", () => {
    const shuffled = [MATRIX[3], MATRIX[1], MATRIX[0], MATRIX[2]];
    expect(placementSlots(shuffled).map((slot) => slot.occurrenceId)).toEqual(["A", null, "B", "C", null]);
  });

  it("a single exercise: nothing to place (no stop point, no recovery zone)", () => {
    expect(placementSlots([occ("A", "BEFORE_TOUR")])).toEqual([]);
  });

  it("an empty Circuit offers no stop point after it", () => {
    const slots = placementSlots([occ("A", "BEFORE_TOUR"), occ("D", "AFTER_TOUR")]);
    expect(slots).toEqual([
      { kind: "OCCURRENCE", occurrenceId: "A", stopPoint: { location: { scope: "BEFORE_TOUR", position: 1 }, existing: false } },
    ]);
  });

  it("a Circuit last in the session: no stop point after its last exercise nor after the Circuit (before the End)", () => {
    const slots = placementSlots([occ("A", "BEFORE_TOUR"), occ("B", "IN_TOUR")]);
    expect(slots).toEqual([
      { kind: "OCCURRENCE", occurrenceId: "A", stopPoint: { location: { scope: "BEFORE_TOUR", position: 1 }, existing: false } },
      { kind: "CIRCUIT_HEAD", occurrenceId: null, stopPoint: { location: { scope: "IN_TOUR", position: 0 }, existing: false } },
    ]);
  });

  it("an Exercise's own recovery (positive or 0) never makes a placement zone", () => {
    const slots = placementSlots([occ("A", "BEFORE_TOUR", 0), occ("B", "IN_TOUR", 20), occ("C", "IN_TOUR")]);
    expect(slots.every((slot) => !("recovery" in slot))).toBe(true);
    expect(slots.map((slot) => slot.occurrenceId)).toEqual(["A", null, "B"]);
  });

  it("shows an existing stop point as existing (one point per location)", () => {
    const slots = placementSlots(MATRIX, [{ scope: "IN_TOUR", position: 1 }, { scope: "AFTER_TOUR", position: 0 }]);
    expect(slots.find((slot) => slot.occurrenceId === "B")?.stopPoint).toEqual({
      location: { scope: "IN_TOUR", position: 1 },
      existing: true,
    });
    expect(slots.find((slot) => slot.kind === "AFTER_CIRCUIT")?.stopPoint?.existing).toBe(true);
    expect(slots.find((slot) => slot.occurrenceId === "A")?.stopPoint?.existing).toBe(false);
  });

  // Story 6.1 (revue, D-441) : une ancienne Récupération autonome n'est plus un voisin (RM-219) —
  // un point qu'elle seule précède suivrait le compte à rebours.
  it("a stop point after a legacy Récupération occurrence only if an Exercise precedes", () => {
    const legacy: SessionDraftExercise = { ...occ("R", "BEFORE_TOUR"), type: "RECOVERY" };
    const slots = placementSlots([occ("W", "BEFORE_TOUR"), legacy, occ("B", "IN_TOUR"), occ("D", "AFTER_TOUR")]);
    expect(slots[1]).toEqual({
      kind: "OCCURRENCE",
      occurrenceId: "R",
      stopPoint: { location: { scope: "BEFORE_TOUR", position: 2 }, existing: false },
    });
    const leading = placementSlots([legacy, occ("B", "IN_TOUR"), occ("D", "AFTER_TOUR")]);
    expect(leading.map((slot) => slot.occurrenceId)).toEqual(["B", null]);
  });

  it("no occurrence: no slot", () => {
    expect(placementSlots([])).toEqual([]);
  });
});

describe("PlacementDraft (AD-43, sous-brouillon ; PRE-9 : Points d'arrêt seuls)", () => {
  it("counts the stop points added, and a deselection subtracts", () => {
    let placement = togglePlacementStopPoint(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 1 }, MATRIX_CONTEXT);
    expect(placementConfirmation(placement, MATRIX_CONTEXT)).toEqual({ kind: "ADDITIONS_ONLY", count: 1 });
    expect(isPlacementStopPointAdded(placement, { scope: "IN_TOUR", position: 1 })).toBe(true);
    placement = togglePlacementStopPoint(placement, { scope: "IN_TOUR", position: 1 }, MATRIX_CONTEXT);
    expect(isPlacementStopPointAdded(placement, { scope: "IN_TOUR", position: 1 })).toBe(false);
    expect(placementConfirmation(placement, MATRIX_CONTEXT)).toEqual({ kind: "NONE" });
  });

  it("carries no recovery: the empty sub-draft holds stop points only", () => {
    expect(EMPTY_PLACEMENT_DRAFT).toEqual({ stopPoints: [], stopPointRemovals: [] });
  });
});

describe("applyPlacementDraft (« Confirmer », AD-43)", () => {
  it("applies stop points to the draft in a single result and never touches the Exercises' recoveries", () => {
    const draft = draftOf([occ("A", "BEFORE_TOUR", 20), occ("B", "IN_TOUR"), occ("C", "IN_TOUR", 0), occ("D", "AFTER_TOUR")]);
    let placement = togglePlacementStopPoint(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 1 }, draft);
    placement = togglePlacementStopPoint(placement, { scope: "AFTER_TOUR", position: 0 }, draft);
    let next = 0;
    const result = applyPlacementDraft(draft, placement, () => `sp-${++next}`);

    expect(result.exercises).toBe(draft.exercises);
    expect(result.exercises.map((exercise) => exercise.postActivityRecoverySeconds)).toEqual([20, null, 0, null]);
    expect(result.stopPoints).toEqual([
      { id: "sp-1", scope: "IN_TOUR", position: 1 },
      { id: "sp-2", scope: "AFTER_TOUR", position: 0 },
    ]);
    // Le brouillon d'entrée n'est jamais muté.
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

  it("ignores additions that are no longer offered: existing point, forbidden location", () => {
    const draft = draftOf([occ("A", "BEFORE_TOUR", 20), occ("B", "IN_TOUR")], [{ id: "p", scope: "BEFORE_TOUR", position: 1 }]);
    const placement = withAddedStopPoints(EMPTY_PLACEMENT_DRAFT, { scope: "BEFORE_TOUR", position: 1 }, { scope: "IN_TOUR", position: 1 });
    expect(applyPlacementDraft(draft, placement, () => "x")).toBe(draft);
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
 * PRE-6 story 6.1 (D-441, RM-251) : points existants désélectionnables (retraits programmés
 * par identifiant), emplacements jamais consécutifs à l'état effectif, points existants non
 * proposés rendus pour être retirés, état du libellé de Confirmer.
 */
describe("placement et Points d'arrêt indépendants (story 6.1, D-441, RM-251)", () => {
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
    expect(offered(slots)).toEqual(["BEFORE_TOUR:1", "IN_TOUR:0", "IN_TOUR:1", "IN_TOUR:2", "IN_TOUR:3*"]);
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
      { kind: "UNOFFERED_STOP_POINT", occurrenceId: null, stopPoint: { location: { scope: "BEFORE_TOUR", position: 9 }, existing: true, stopPointId: "x" } },
    ]);
    // Story 7.1 (D-442) : la tête de Circuit est un emplacement proposé ; le point qui l'occupe y est rendu.
    expect(slots.find((slot) => slot.occurrenceId === null)).toEqual({
      kind: "CIRCUIT_HEAD",
      occurrenceId: null,
      stopPoint: { location: { scope: "IN_TOUR", position: 0 }, existing: true, stopPointId: "h" },
    });
  });

  it("l'état effectif compte : un retrait programmé libère les voisins, un ajout les retire", () => {
    const removal = togglePlacementStopPoint(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 3 }, { exercises: ROW, stopPoints: [atEnd] });
    expect(removal.stopPointRemovals).toEqual(["p"]);
    expect(offered(placementSlots(ROW, [atEnd], removal))).toEqual([
      "BEFORE_TOUR:1",
      "IN_TOUR:0",
      "IN_TOUR:1",
      "IN_TOUR:2",
      "IN_TOUR:3*",
      "AFTER_TOUR:0",
    ]);
    const addition = togglePlacementStopPoint(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 3 }, { exercises: ROW, stopPoints: [] });
    expect(offered(placementSlots(ROW, [], addition))).toEqual(["BEFORE_TOUR:1", "IN_TOUR:0", "IN_TOUR:1", "IN_TOUR:2", "IN_TOUR:3"]);
  });

  it("un point ajouté reste rendu et désélectionnable même si un voisin le rend consécutif", () => {
    const placement = withAddedStopPoints(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 3 }, { scope: "AFTER_TOUR", position: 0 });
    expect(offered(placementSlots(ROW, [], placement))).toEqual([
      "BEFORE_TOUR:1",
      "IN_TOUR:0",
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

  it("avec contexte, un ajout consécutif ou interdit est refusé (sous-brouillon inchangé) ; D-442 : la tête de Circuit est ajoutée", () => {
    const context = { exercises: ROW, stopPoints: [atEnd] };
    for (const location of [
      { scope: "AFTER_TOUR" as const, position: 0 },
      { scope: "AFTER_TOUR" as const, position: 1 },
    ]) {
      expect(togglePlacementStopPoint(EMPTY_PLACEMENT_DRAFT, location, context)).toBe(EMPTY_PLACEMENT_DRAFT);
    }
    const head = togglePlacementStopPoint(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 0 }, context);
    expect(isPlacementStopPointAdded(head, { scope: "IN_TOUR", position: 0 })).toBe(true);
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

  // [« modification de durée seule ou mêlée » retiré le 01/11/2026 : aucune récupération en placement.]
  it("placementConfirmation : rien, ajouts seuls (N)", () => {
    const context = draftOf([occ("A", "BEFORE_TOUR"), occ("B", "IN_TOUR", 20), occ("C", "IN_TOUR")]);
    expect(placementConfirmation(EMPTY_PLACEMENT_DRAFT, context)).toEqual({ kind: "NONE" });
    const additions = togglePlacementStopPoint(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 1 }, context);
    expect(placementConfirmation(additions, context)).toEqual({ kind: "ADDITIONS_ONLY", count: 1 });
  });

  it("avec contexte, placementConfirmation ne compte que l'applicable", () => {
    const draft = draftOf(ROW);
    const placement = withAddedStopPoints(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 3 }, { scope: "AFTER_TOUR", position: 0 });
    expect(placementConfirmation(placement, draft)).toEqual({ kind: "ADDITIONS_ONLY", count: 1 });
    const unknownRemoval = { ...EMPTY_PLACEMENT_DRAFT, stopPointRemovals: ["inconnu"] };
    expect(placementConfirmation(unknownRemoval, draft)).toEqual({ kind: "NONE" });
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

  it("un point existant en tête de Circuit se retire en placement", () => {
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

/**
 * PRE-6 story 7.1 (D-442) : tête de Circuit proposée, début et fin de Tour à N ≥ 2 (RM-219 levée,
 * conflit → choix requis), récupérations existantes désélectionnables (retrait programmé).
 */
describe("placement — début et fin de Tour (story 7.1, D-442)", () => {
  /** Circuit seul [A, B] : il ouvre et clôt la Séance. */
  const CIRCUIT_ONLY = [occ("A", "IN_TOUR"), occ("B", "IN_TOUR")];
  const offered = (slots: ReturnType<typeof placementSlots>) =>
    slots.flatMap((slot) =>
      slot.stopPoint === null
        ? []
        : [`${slot.kind}:${slot.stopPoint.location.scope}:${slot.stopPoint.location.position}${slot.stopPoint.existing ? "*" : ""}`],
    );

  it("N = 1 : un Circuit qui ouvre et clôt la Séance n'offre ni début ni fin de Tour (RM-219)", () => {
    expect(offered(placementSlots(CIRCUIT_ONLY, [], EMPTY_PLACEMENT_DRAFT, { tourRepeatCount: 1 }))).toEqual([
      "OCCURRENCE:IN_TOUR:1",
    ]);
  });

  it("N ≥ 2 : début et fin de Tour proposés même en ouverture et clôture de Séance", () => {
    expect(offered(placementSlots(CIRCUIT_ONLY, [], EMPTY_PLACEMENT_DRAFT, { tourRepeatCount: 2 }))).toEqual([
      "CIRCUIT_HEAD:IN_TOUR:0",
      "OCCURRENCE:IN_TOUR:1",
      "OCCURRENCE:IN_TOUR:2",
    ]);
  });

  it("N ≥ 2 : ajouter le début de Tour quand la fin existe → choix requis, sans ajout", () => {
    const tail: StopPoint = { id: "t", scope: "IN_TOUR", position: 2 };
    const context = { ...draftOf(CIRCUIT_ONLY, [tail]), tourRepeatCount: 2 };
    // Proposé malgré le conflit : le choisir déclenche le dialogue.
    expect(offered(placementSlots(context.exercises, context.stopPoints, EMPTY_PLACEMENT_DRAFT, context))).toContain(
      "CIRCUIT_HEAD:IN_TOUR:0",
    );
    const outcome = togglePlacementStopPointOutcome(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 0 }, context);
    expect(outcome.status).toBe("CHOICE_REQUIRED");
    if (outcome.status !== "CHOICE_REQUIRED") return;
    expect(outcome.conflict).toEqual({
      head: { scope: "IN_TOUR", position: 0 },
      tail: { scope: "IN_TOUR", position: 2 },
      tailStopPointId: "t",
    });
    // « Début de tour » : ajout du début, retrait programmé de la fin.
    expect(outcome.resolutions.HEAD).toEqual({
      ...EMPTY_PLACEMENT_DRAFT,
      stopPoints: [{ scope: "IN_TOUR", position: 0 }],
      stopPointRemovals: ["t"],
    });
    expect(applyPlacementDraft(context, outcome.resolutions.HEAD, () => "h").stopPoints).toEqual([
      { id: "h", scope: "IN_TOUR", position: 0 },
    ]);
    // « Fin de tour » : rien n'est ajouté.
    expect(placementConfirmation(outcome.resolutions.TAIL, context)).toEqual({ kind: "NONE" });
    // Forme historique : sous-brouillon inchangé.
    expect(togglePlacementStopPoint(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 0 }, context)).toBe(EMPTY_PLACEMENT_DRAFT);
  });

  it("N ≥ 2 : deux ajouts (début puis fin) → choix requis sur le second ; « Début de tour » jette l'ajout de la fin", () => {
    const context = { ...draftOf(CIRCUIT_ONLY), tourRepeatCount: 3 };
    const head = togglePlacementStopPoint(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 0 }, context);
    const outcome = togglePlacementStopPointOutcome(head, { scope: "IN_TOUR", position: 2 }, context);
    expect(outcome.status).toBe("CHOICE_REQUIRED");
    if (outcome.status !== "CHOICE_REQUIRED") return;
    expect(outcome.conflict).toEqual({ head: { scope: "IN_TOUR", position: 0 }, tail: { scope: "IN_TOUR", position: 2 } });
    expect(outcome.resolutions.HEAD.stopPoints).toEqual([{ scope: "IN_TOUR", position: 0 }]);
    expect(outcome.resolutions.TAIL.stopPoints).toEqual([{ scope: "IN_TOUR", position: 2 }]);
  });

  it("N ≥ 2 : Confirmer n'applique jamais un ajout qui créerait un conflit (sous-brouillon construit sans contrôle)", () => {
    const context = { ...draftOf(CIRCUIT_ONLY), tourRepeatCount: 2 };
    const placement = withAddedStopPoints(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 0 }, { scope: "IN_TOUR", position: 2 });
    expect(placementConfirmation(placement, context)).toEqual({ kind: "ADDITIONS_ONLY", count: 1 });
    expect(applyPlacementDraft(context, placement, () => "n").stopPoints).toEqual([{ id: "n", scope: "IN_TOUR", position: 0 }]);
  });

  it("N ≥ 2 : resélectionner un point existant qui ferait conflit avec un AJOUT est refusé ; conflit hérité : permis", () => {
    const tail: StopPoint = { id: "t", scope: "IN_TOUR", position: 2 };
    const context = { ...draftOf(CIRCUIT_ONLY, [tail]), tourRepeatCount: 2 };
    const outcome = togglePlacementStopPointOutcome(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 0 }, context);
    if (outcome.status !== "CHOICE_REQUIRED") throw new Error("choix requis attendu");
    const kept = outcome.resolutions.HEAD;
    expect(togglePlacementStopPointRemoval(kept, "t", context)).toBe(kept);
    // Conflit hérité entre deux points existants : la resélection de l'un d'eux reste possible.
    const heritage = { ...draftOf(CIRCUIT_ONLY, [{ id: "h", scope: "IN_TOUR", position: 0 }, tail]), tourRepeatCount: 2 };
    const removed = togglePlacementStopPointRemoval(EMPTY_PLACEMENT_DRAFT, "h", heritage);
    expect(isPlacementStopPointRemoved(togglePlacementStopPointRemoval(removed, "h", heritage), "h")).toBe(false);
  });
});

describe("placement — compléments de la revue 7.1 (D-442)", () => {
  const CIRCUIT_ONLY = [occ("A", "IN_TOUR"), occ("B", "IN_TOUR"), occ("C", "IN_TOUR")];

  it("sens inverse : début de Tour existant, ajout de la fin à N = 2 → choix requis", () => {
    const head: StopPoint = { id: "h", scope: "IN_TOUR", position: 0 };
    const context = { ...draftOf(CIRCUIT_ONLY, [head]), tourRepeatCount: 2 };
    const outcome = togglePlacementStopPointOutcome(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 3 }, context);
    expect(outcome.status).toBe("CHOICE_REQUIRED");
    if (outcome.status !== "CHOICE_REQUIRED") return;
    expect(outcome.conflict).toEqual({ head: { scope: "IN_TOUR", position: 0 }, tail: { scope: "IN_TOUR", position: 3 }, headStopPointId: "h" });
    expect(outcome.resolutions.TAIL).toEqual({ ...EMPTY_PLACEMENT_DRAFT, stopPoints: [{ scope: "IN_TOUR", position: 3 }], stopPointRemovals: ["h"] });
    expect(outcome.resolutions.HEAD).toEqual(EMPTY_PLACEMENT_DRAFT);
  });

  it("resélectionner un point existant en conflit avec un AJOUT → choix requis (D-441 : la resélection annule le retrait)", () => {
    const head: StopPoint = { id: "h", scope: "IN_TOUR", position: 0 };
    const context = { ...draftOf(CIRCUIT_ONLY, [head]), tourRepeatCount: 2 };
    const removed = togglePlacementStopPointRemoval(EMPTY_PLACEMENT_DRAFT, "h", context);
    const withTail = togglePlacementStopPoint(removed, { scope: "IN_TOUR", position: 3 }, context);
    expect(isPlacementStopPointAdded(withTail, { scope: "IN_TOUR", position: 3 })).toBe(true);
    const outcome = togglePlacementStopPointOutcome(withTail, { scope: "IN_TOUR", position: 0 }, context);
    expect(outcome.status).toBe("CHOICE_REQUIRED");
    if (outcome.status !== "CHOICE_REQUIRED") return;
    // « Début de tour » : h resélectionné, l'ajout de la fin jeté ; « Fin de tour » : rien ne change.
    expect(outcome.resolutions.HEAD).toEqual(EMPTY_PLACEMENT_DRAFT);
    expect(outcome.resolutions.TAIL).toBe(withTail);
  });

  it("résolution : toutes les fins de Tour sont écartées (deux fins héritées), le début est bien appliqué", () => {
    const exercises = [occ("W", "BEFORE_TOUR"), occ("E", "IN_TOUR"), { ...occ("R", "IN_TOUR"), type: "RECOVERY" as const }, occ("Z", "AFTER_TOUR")];
    const tails: StopPoint[] = [
      { id: "t1", scope: "IN_TOUR", position: 1 },
      { id: "t2", scope: "IN_TOUR", position: 2 },
    ];
    const context = { ...draftOf(exercises, tails), tourRepeatCount: 3 };
    const outcome = togglePlacementStopPointOutcome(EMPTY_PLACEMENT_DRAFT, { scope: "IN_TOUR", position: 0 }, context);
    if (outcome.status !== "CHOICE_REQUIRED") throw new Error("choix requis attendu");
    expect(outcome.resolutions.HEAD.stopPointRemovals).toEqual(["t1", "t2"]);
    expect(applyPlacementDraft(context, outcome.resolutions.HEAD, () => "h").stopPoints).toEqual([{ id: "h", scope: "IN_TOUR", position: 0 }]);
  });
});
