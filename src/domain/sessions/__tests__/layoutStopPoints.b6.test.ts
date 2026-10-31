import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { layoutCircuitCountOutcome, layoutCycleCountOutcome, moveExerciseToCircuit, wrapInContainer, wrapSpansInContainers } from "@/domain/sessions/layoutOperations";
import { duplicateLayoutExercise, moveLayoutItem, moveLayoutStopPoint, removeLayoutExercise, stepLayoutItem, stepLayoutStopPoint } from "@/domain/sessions/layoutMoves";
import {
  analyzeLayoutStopPoints,
  isLayoutStopPointAllowed,
  layoutConsecutivePairs,
  layoutRepetitionConflicts,
  separatorOf,
} from "@/domain/sessions/layoutStopPoints";
import { expandStructure } from "@/domain/sessions/planExpansion";
import { createEmptyDraft, createExerciseDraft, sessionDraftsEqual, toStructuredSessionInput, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { StructureElement, StructureStopPointLocation } from "@/domain/sessions/structure";
import { validateStructuredSessionInput } from "@/domain/sessions/structuredInput";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";

/**
 * PRE-9 (story B.6 ; ARB-02 « Règles retenues », ARB-02a, ARB-02b, ARB-06 ; RM-219, RM-220, RM-251 ;
 * D-441, D-442) — Points d'arrêt sur toute la structure : séquence fonctionnelle, frontières de chaque
 * conteneur, Cycle répété (exceptions de début et de fin, choix), opérations de Composition.
 */

const exercise = (id: string): SessionDraftExercise => ({ ...createExerciseDraft(id), name: id, executionParameters: durationParameters(30, 1) });

type Point = StructureStopPointLocation & { readonly id: string };
const S = (position: number, id: string): Point => ({ id, circuitId: null, position });
const Y = (cycleId: string, position: number, id: string): Point => ({ id, circuitId: null, cycleId, position });
const C = (circuitId: string, position: number, id: string): Point => ({ id, circuitId, position });
const at = (point: StructureStopPointLocation) => ({ circuitId: point.circuitId, cycleId: point.cycleId ?? null, position: point.position });

function draftOf(elements: StructureElement<string>[], stopPoints: Point[], ids: string[]): SessionDraft {
  return { ...createEmptyDraft(), exercises: ids.map(exercise), structure: { elements, stopPoints } };
}

const cycle = (id: string, repeatCount: number, members: (string | { circuit: string; exercises: string[]; repeatCount?: number })[]): StructureElement<string> => ({
  kind: "CYCLE",
  cycle: {
    id,
    repeatCount,
    members: members.map((member) =>
      typeof member === "string"
        ? { kind: "EXERCISE" as const, exercise: member }
        : { kind: "CIRCUIT" as const, circuit: { id: member.circuit, repeatCount: member.repeatCount ?? 1, nature: "TOURS" as const, exercises: member.exercises } },
    ),
  },
});
const ex = (id: string): StructureElement<string> => ({ kind: "EXERCISE", exercise: id });
const circuit = (id: string, exercises: string[], repeatCount = 1): StructureElement<string> => ({
  kind: "CIRCUIT",
  circuit: { id, repeatCount, nature: "TOURS", exercises },
});
const newId = () => "new-container";

function pointsOf(draft: SessionDraft) {
  return (draft.structure?.stopPoints ?? []).map((point) => ({ id: (point as Point).id, ...at(point) }));
}

describe("PRE-9 B.6 — séquence fonctionnelle de toute la structure (ARB-02)", () => {
  // e0, Cycle × k [b0, Circuit cb [b1, b2]], e9.
  const layout = (k: number, withTail = true) => ({
    elements: [ex("e0"), cycle("cy", k, ["b0", { circuit: "cb", exercises: ["b1", "b2"] }]), ...(withTail ? [ex("e9")] : [])],
    stopPoints: [],
  });
  const analysis = (k: number, withTail = true) => analyzeLayoutStopPoints(layout(k, withTail), () => true);

  it("RM-219 : jamais juste après le Compte à rebours ni juste avant la Fin ; partout ailleurs, conteneurs compris", () => {
    const a = analysis(1);
    expect(isLayoutStopPointAllowed(a, S(0, "x"))).toBe(false);
    expect(isLayoutStopPointAllowed(a, S(1, "x"))).toBe(true);
    expect(isLayoutStopPointAllowed(a, Y("cy", 0, "x"))).toBe(true);
    expect(isLayoutStopPointAllowed(a, Y("cy", 1, "x"))).toBe(true);
    expect(isLayoutStopPointAllowed(a, C("cb", 0, "x"))).toBe(true);
    expect(isLayoutStopPointAllowed(a, C("cb", 2, "x"))).toBe(true);
    expect(isLayoutStopPointAllowed(a, Y("cy", 2, "x"))).toBe(true);
    expect(isLayoutStopPointAllowed(a, S(3, "x"))).toBe(false);
    // Hors bornes, conteneur inconnu, Circuit et Cycle à la fois : jamais.
    expect(isLayoutStopPointAllowed(a, Y("cy", 3, "x"))).toBe(false);
    expect(isLayoutStopPointAllowed(a, C("inconnu", 0, "x"))).toBe(false);
    expect(isLayoutStopPointAllowed(a, { circuitId: "cb", cycleId: "cy", position: 0 })).toBe(false);
  });

  it("ARB-02b : un Cycle répété qui clôt la Séance admet un Point de fin de répétition ; à × 1, RM-219 s'applique", () => {
    expect(isLayoutStopPointAllowed(analysis(1, false), Y("cy", 2, "x"))).toBe(false);
    expect(isLayoutStopPointAllowed(analysis(2, false), Y("cy", 2, "x"))).toBe(true);
    // Fin du Circuit, dernier membre du Cycle répété : fin de répétition du Cycle.
    expect(isLayoutStopPointAllowed(analysis(2, false), C("cb", 2, "x"))).toBe(true);
    // Après le Cycle, au niveau Séance : jamais répété (ARB-02a), juste avant la Fin.
    expect(isLayoutStopPointAllowed(analysis(2, false), S(2, "x"))).toBe(false);
  });

  it("ARB-02b : un Cycle répété qui ouvre la Séance admet un Point de début de répétition", () => {
    const opening = { elements: [cycle("cy", 2, ["b0"]), ex("e9")], stopPoints: [] };
    expect(isLayoutStopPointAllowed(analyzeLayoutStopPoints(opening, () => true), Y("cy", 0, "x"))).toBe(true);
    expect(isLayoutStopPointAllowed(analyzeLayoutStopPoints(opening, () => true), S(0, "x"))).toBe(false);
  });

  it("D-441 appliqué à chaque conteneur : fin de Circuit et après le Circuit, fin de Circuit et fin de Cycle sont consécutifs ; une Récupération ne sépare pas", () => {
    const a = analysis(1);
    expect(layoutConsecutivePairs(a, [C("cb", 2, "p"), Y("cy", 2, "q")]).map(([x, y]) => [x.id, y.id])).toEqual([["p", "q"]]);
    expect(layoutConsecutivePairs(a, [Y("cy", 2, "p"), S(2, "q")])).toHaveLength(1);
    expect(layoutConsecutivePairs(a, [S(1, "p"), Y("cy", 0, "q")])).toHaveLength(1);
    expect(layoutConsecutivePairs(a, [Y("cy", 1, "p"), C("cb", 1, "q")])).toHaveLength(0);
    // b1 est une ancienne Récupération autonome : elle ne sépare pas.
    const recovery = analyzeLayoutStopPoints(layout(1), separatorOf([{ id: "b1", type: "RECOVERY" }]));
    expect(layoutConsecutivePairs(recovery, [C("cb", 0, "p"), C("cb", 1, "q")])).toHaveLength(1);
  });

  it("D-442 / ARB-02b : début et fin de répétition d'un Cycle répété sont en conflit ; à × 1, non", () => {
    expect(layoutRepetitionConflicts(analysis(1), [Y("cy", 0, "h"), Y("cy", 2, "t")])).toHaveLength(0);
    const conflicts = layoutRepetitionConflicts(analysis(2), [Y("cy", 0, "h"), Y("cy", 2, "t")]);
    expect(conflicts.map((conflict) => [conflict.scope.id, conflict.head.id, conflict.tail.id])).toEqual([["cy", "h", "t"]]);
    // Tête du Circuit premier membre (après b0 ? non : b0 le précède) — pas un début de répétition.
    expect(layoutRepetitionConflicts(analysis(2), [C("cb", 0, "h"), Y("cy", 2, "t")])).toHaveLength(0);
  });
});

describe("PRE-9 B.6 — opérations de Composition (D-441 à leur place ; D-442 tolérant)", () => {
  // e0, e1, e2, Cycle cy × 1 [c0, c1].
  const base = (stopPoints: Point[], k = 1) => draftOf([ex("e0"), ex("e1"), ex("e2"), cycle("cy", k, ["c0", "c1"])], stopPoints, ["e0", "e1", "e2", "c0", "c1"]);

  it("déplacement d'un Exercice : les Points restent à leur place ; deux Points devenus consécutifs → le second retiré sans message", () => {
    const outcome = moveLayoutItem(base([S(1, "p"), S(2, "q")]), { kind: "EXERCISE", id: "e1" }, { container: { kind: "CYCLE", id: "cy" }, index: 1 }, newId);
    if (outcome.status !== "APPLIED") throw new Error(outcome.status);
    expect(outcome.removedStopPointIds).toEqual(["q"]);
    expect(pointsOf(outcome.draft)).toEqual([{ id: "p", circuitId: null, cycleId: null, position: 1 }]);
  });

  it("déplacement d'un Exercice : un Point qui suivrait le Compte à rebours est retiré sans message", () => {
    const outcome = moveLayoutItem(base([S(1, "p")]), { kind: "EXERCISE", id: "e0" }, { container: { kind: "CYCLE", id: "cy" }, index: 0 }, newId);
    if (outcome.status !== "APPLIED") throw new Error(outcome.status);
    expect(outcome.removedStopPointIds).toEqual(["p"]);
  });

  it("un Cycle déplacé emporte ses Points (ARB-02a : ils restent internes)", () => {
    const outcome = moveLayoutItem(base([Y("cy", 1, "inner")]), { kind: "CYCLE", id: "cy" }, { container: { kind: "SESSION" }, index: 1 }, newId);
    if (outcome.status !== "APPLIED") throw new Error(outcome.status);
    expect(outcome.removedStopPointIds).toEqual([]);
    expect(pointsOf(outcome.draft)).toEqual([{ id: "inner", circuitId: null, cycleId: "cy", position: 1 }]);
  });

  it("conteneur vidé et retiré : ses Points sont retirés sans message, ceux d'après reculent", () => {
    const draft = draftOf([ex("e0"), circuit("ca", ["a1"]), ex("e1"), cycle("cy", 1, ["c0"])], [C("ca", 0, "inside"), S(3, "after")], ["e0", "a1", "e1", "c0"]);
    const outcome = moveLayoutItem(draft, { kind: "EXERCISE", id: "a1" }, { container: { kind: "CYCLE", id: "cy" }, index: 1 }, newId);
    if (outcome.status !== "APPLIED") throw new Error(outcome.status);
    expect(outcome.removedContainers).toEqual([{ kind: "CIRCUIT", id: "ca" }]);
    expect(outcome.removedStopPointIds).toEqual(["inside"]);
    expect(pointsOf(outcome.draft)).toEqual([{ id: "after", circuitId: null, cycleId: null, position: 2 }]);
  });

  it("ARB-02b : un déplacement qui fait se suivre début et fin de répétition d'un Cycle répété demande le choix", () => {
    // e0, Cycle × 2 [c0, c1, c2] ; Point au milieu (après c0) et Point de fin ; c0 sort du Cycle.
    const draft = draftOf([ex("e0"), cycle("cy", 2, ["c0", "c1", "c2"])], [Y("cy", 1, "h"), Y("cy", 3, "t")], ["e0", "c0", "c1", "c2"]);
    const outcome = moveLayoutItem(draft, { kind: "EXERCISE", id: "c0" }, { container: { kind: "SESSION" }, index: 0 }, newId);
    if (outcome.status !== "CHOICE_REQUIRED") throw new Error(outcome.status);
    expect(outcome.conflict).toEqual({ scope: { kind: "CYCLE", id: "cy", repeatCount: 2 }, headStopPointId: "h", tailStopPointId: "t" });
    const head = outcome.resolutions.HEAD;
    const tail = outcome.resolutions.TAIL;
    if (head.status !== "APPLIED" || tail.status !== "APPLIED") throw new Error("résolution");
    expect(head.removedStopPointIds).toEqual(["t"]);
    expect(pointsOf(head.draft).map((point) => point.id)).toEqual(["h"]);
    expect(tail.removedStopPointIds).toEqual(["h"]);
  });

  it("suppression : Points devenus interdits ou consécutifs retirés sans message (le premier conservé), conflit de répétition → choix", () => {
    const removed = removeLayoutExercise(base([S(1, "p"), S(2, "q")]), "e1", newId);
    if (removed.status !== "APPLIED") throw new Error(removed.status);
    expect(removed.removedStopPointIds).toEqual(["q"]);
    const draft = draftOf([ex("e0"), cycle("cy", 2, ["c0", "c1", "c2"])], [Y("cy", 1, "h"), Y("cy", 3, "t")], ["e0", "c0", "c1", "c2"]);
    const choice = removeLayoutExercise(draft, "c0", newId);
    expect(choice.status).toBe("CHOICE_REQUIRED");
  });

  it("duplication (D-441) : la copie est insérée avant le Point qui suivait sa source ; aucun Point copié", () => {
    const outcome = duplicateLayoutExercise(base([S(1, "p")]), "e0", "copy", newId);
    if (outcome.status !== "APPLIED") throw new Error(outcome.status);
    expect(outcome.draft.structure?.elements.slice(0, 3)).toEqual([ex("e0"), ex("copy"), ex("e1")]);
    expect(pointsOf(outcome.draft)).toEqual([{ id: "p", circuitId: null, cycleId: null, position: 2 }]);
    // Dans un Cycle.
    const inCycle = duplicateLayoutExercise(base([Y("cy", 1, "m")]), "c0", "copy", newId);
    if (inCycle.status !== "APPLIED") throw new Error(inCycle.status);
    expect(pointsOf(inCycle.draft)).toEqual([{ id: "m", circuitId: null, cycleId: "cy", position: 2 }]);
  });

  it("« Monter » / « Descendre » d'un Exercice : le Point voisin est d'abord franchi (échange, D-441), puis D-442", () => {
    // [e0, P, e1, e2, cy] : e1 monte au-dessus de P → [e0, e1, P, e2, cy].
    const up = stepLayoutItem(base([S(1, "p")]), { kind: "EXERCISE", id: "e1" }, "UP", newId);
    if (up.status !== "APPLIED") throw new Error(up.status);
    expect(up.draft.structure?.elements.slice(0, 3)).toEqual([ex("e0"), ex("e1"), ex("e2")]);
    expect(pointsOf(up.draft)).toEqual([{ id: "p", circuitId: null, cycleId: null, position: 2 }]);
    // e0 descend sous P : [P, e0, …] — P suivrait le Compte à rebours : retiré sans message.
    const down = stepLayoutItem(base([S(1, "p")]), { kind: "EXERCISE", id: "e0" }, "DOWN", newId);
    if (down.status !== "APPLIED") throw new Error(down.status);
    expect(down.removedStopPointIds).toEqual(["p"]);
    // Sans Point voisin : emplacement d'élément voisin (B.4), inséré avant le Point qui occupe ce rang
    // (convention de l'ancien modèle, `sequenceIndexForOccurrenceIndex`) : [e0, e2, P, e1].
    const plain = stepLayoutItem(base([S(1, "p")]), { kind: "EXERCISE", id: "e2" }, "UP", newId);
    if (plain.status !== "APPLIED") throw new Error(plain.status);
    expect(plain.draft.structure?.elements.slice(0, 3)).toEqual([ex("e0"), ex("e2"), ex("e1")]);
    expect(pointsOf(plain.draft)).toEqual([{ id: "p", circuitId: null, cycleId: null, position: 2 }]);
  });

  it("B.3 : déplacement vers un Circuit (alterné compris) avec Points — plus de refus, mêmes règles", () => {
    const draft = draftOf([ex("e0"), ex("e1"), circuit("ca", ["a1"], 2), cycle("cy", 1, ["c0"])], [S(1, "p")], ["e0", "e1", "a1", "c0"]);
    const outcome = moveExerciseToCircuit(draft, "e1", "ca", 0, newId);
    if (outcome.status !== "APPLIED") throw new Error(outcome.status);
    expect(pointsOf(outcome.draft)).toEqual([{ id: "p", circuitId: null, cycleId: null, position: 1 }]);
  });
});

describe("PRE-9 B.6 — déplacement autonome d'un Point (D-441 ; ARB-06 : règles de la destination)", () => {
  const base = (stopPoints: Point[], k = 1) => draftOf([ex("e0"), ex("e1"), cycle("cy", k, ["c0", "c1"])], stopPoints, ["e0", "e1", "c0", "c1"]);

  it("dépose dans un Cycle, à une position autorisée : appliquée, identité conservée", () => {
    const outcome = moveLayoutStopPoint(base([S(1, "p")]), "p", Y("cy", 1, ""), newId);
    if (outcome.status !== "APPLIED") throw new Error(outcome.status);
    expect(pointsOf(outcome.draft)).toEqual([{ id: "p", circuitId: null, cycleId: "cy", position: 1 }]);
  });

  it("refus sans mutation : position interdite, occupée, ou consécutive à un autre Point", () => {
    expect(moveLayoutStopPoint(base([S(1, "p")]), "p", S(0, ""), newId)).toEqual({ status: "REFUSED", reason: "STOP_POINT_NOT_ALLOWED" });
    expect(moveLayoutStopPoint(base([S(1, "p"), Y("cy", 1, "q")]), "p", Y("cy", 1, ""), newId)).toEqual({ status: "REFUSED", reason: "LOCATION_OCCUPIED" });
    expect(moveLayoutStopPoint(base([S(1, "p"), S(2, "q")]), "p", Y("cy", 0, ""), newId)).toEqual({ status: "REFUSED", reason: "CONSECUTIVE_STOP_POINTS" });
    expect(moveLayoutStopPoint(base([S(1, "p")]), "p", S(1, ""), newId)).toEqual({ status: "UNCHANGED" });
  });

  it("ARB-02b : une dépose qui crée un conflit de répétition demande le choix", () => {
    const outcome = moveLayoutStopPoint(base([Y("cy", 0, "h"), S(1, "p")], 2), "p", Y("cy", 2, ""), newId);
    if (outcome.status !== "CHOICE_REQUIRED") throw new Error(outcome.status);
    expect(outcome.conflict.scope.kind).toBe("CYCLE");
    expect(pointsOf(outcome.resolutions.HEAD).map((point) => point.id)).toEqual(["h"]);
    expect(pointsOf(outcome.resolutions.TAIL).map((point) => point.id)).toEqual(["p"]);
  });

  it("« Descendre » : le Point entre dans le Cycle à la première position acceptée", () => {
    const outcome = stepLayoutStopPoint(base([S(1, "p")]), "p", "DOWN", newId);
    if (outcome.status !== "APPLIED") throw new Error(outcome.status);
    expect(pointsOf(outcome.draft)).toEqual([{ id: "p", circuitId: null, cycleId: null, position: 2 }]);
    const again = stepLayoutStopPoint(outcome.draft, "p", "DOWN", newId);
    if (again.status !== "APPLIED") throw new Error(again.status);
    expect(pointsOf(again.draft)).toEqual([{ id: "p", circuitId: null, cycleId: "cy", position: 0 }]);
  });
});

describe("PRE-9 B.6 — compte du Circuit ou du Cycle (D-442 : passage de 1 à N ≥ 2, retour à 1)", () => {
  it("Cycle 1 → 2 avec Points de début et de fin : choix requis ; 2 → 1 : Point de fin devenu interdit retiré sans message", () => {
    const draft = draftOf([ex("e0"), cycle("cy", 1, ["c0", "c1"]), ex("e9")], [Y("cy", 0, "h"), Y("cy", 2, "t")], ["e0", "c0", "c1", "e9"]);
    const up = layoutCycleCountOutcome(draft, "cy", 2);
    if (up.status !== "CHOICE_REQUIRED") throw new Error(up.status);
    expect(up.resolutions.TAIL.removedStopPointIds).toEqual(["h"]);

    const closing = draftOf([ex("e0"), cycle("cy", 2, ["c0", "c1"])], [Y("cy", 1, "m"), Y("cy", 2, "t")], ["e0", "c0", "c1"]);
    const down = layoutCycleCountOutcome(closing, "cy", 1);
    if (down.status !== "APPLIED") throw new Error(down.status);
    expect(down.removedStopPointIds).toEqual(["t"]);
    expect(pointsOf(down.draft).map((point) => point.id)).toEqual(["m"]);
  });

  it("Circuit d'une disposition générale : mêmes règles (D-442 tel quel, ARB-02 règle 5)", () => {
    const draft = draftOf([ex("e0"), circuit("ca", ["a1", "a2"]), cycle("cy", 1, ["c0"]), ex("e9")], [C("ca", 0, "h"), C("ca", 2, "t")], ["e0", "a1", "a2", "c0", "e9"]);
    expect(layoutCircuitCountOutcome(draft, "ca", 2).status).toBe("CHOICE_REQUIRED");
    expect(layoutCircuitCountOutcome(draft, "ca", 1).status).toBe("APPLIED");
  });
});

describe("PRE-9 B.6 — enveloppe (B.2 / B.4b) avec Points", () => {
  it("ancien modèle à Points → Cycle posé : les Points suivent dans la disposition générale", () => {
    const legacy: SessionDraft = {
      ...createEmptyDraft(),
      exercises: [exercise("e0"), exercise("e1"), { ...exercise("e2"), structuralPosition: "IN_TOUR" }, { ...exercise("e3"), structuralPosition: "AFTER_TOUR" }],
      stopPoints: [{ id: "p", scope: "BEFORE_TOUR", position: 1 }],
    };
    let n = 0;
    const next = wrapInContainer(legacy, { kind: "EXERCISE", id: "e3" }, "CYCLE", () => `k${++n}`);
    expect(next).not.toBe(legacy);
    expect(next.stopPoints).toEqual([]);
    expect(pointsOf(next)).toEqual([{ id: "p", circuitId: null, cycleId: null, position: 1 }]);
  });

  it("B.4b : les Points situés entre les contenus réunis entrent dans le nouveau conteneur, les autres restent autour", () => {
    const draft = draftOf([ex("e0"), ex("e1"), ex("e2"), ex("e3"), cycle("cy", 1, ["c0"])], [S(2, "between"), S(3, "after")], ["e0", "e1", "e2", "c0", "e3"]);
    const next = wrapSpansInContainers(draft, [{ members: [{ kind: "EXERCISE", id: "e1" }, { kind: "EXERCISE", id: "e2" }] }], "CIRCUIT", () => "cn");
    expect(pointsOf(next)).toEqual([
      { id: "between", circuitId: "cn", cycleId: null, position: 1 },
      { id: "after", circuitId: null, cycleId: null, position: 2 },
    ]);
  });
});

describe("PRE-9 B.6 — écriture, plan et brouillon", () => {
  const general = (stopPoints: Point[], k = 2) =>
    draftOf([ex("e0"), cycle("cy", k, ["c0", { circuit: "cb", exercises: ["c1"] }]), ex("e9")], stopPoints, ["e0", "c0", "c1", "e9"]);

  it("validation : Points d'une disposition générale acceptés ; RM-219 refusé (FORBIDDEN_PLACEMENT)", () => {
    const named = (draft: SessionDraft) => withLocalMovements({ ...draft, name: "Séance" });
    const valid = toStructuredSessionInput(named(general([Y("cy", 1, "p"), C("cb", 0, "q2"), S(2, "r")])), () => "id");
    // q2 et p sont consécutifs (hérité) : l'enregistrement n'est pas refusé pour autant (comme l'ancien modèle).
    expect(valid.ok).toBe(true);
    if (!valid.ok) return;
    expect(valid.value.structure.stopPoints).toHaveLength(3);
    const forbidden = toStructuredSessionInput(named(general([S(0, "p")])), () => "id");
    expect(forbidden).toEqual({ ok: false, violations: [{ code: "FORBIDDEN_PLACEMENT", field: "session.stopPoints" }] });
    expect(validateStructuredSessionInput(valid.value).ok).toBe(true);
  });

  it("ARB-02a (D.1) : un Point dans un Cycle est rencontré à chaque répétition ; au niveau Séance, une fois", () => {
    const draft = general([Y("cy", 1, "inner"), S(1, "outer")], 3);
    const structure = {
      elements: [
        { kind: "EXERCISE" as const, exercise: exercise("e0") },
        {
          kind: "CYCLE" as const,
          cycle: {
            id: "cy",
            repeatCount: 3,
            members: [
              { kind: "EXERCISE" as const, exercise: exercise("c0") },
              { kind: "CIRCUIT" as const, circuit: { id: "cb", repeatCount: 1, nature: "TOURS" as const, exercises: [exercise("c1")] } },
            ],
          },
        },
        { kind: "EXERCISE" as const, exercise: exercise("e9") },
      ],
      stopPoints: draft.structure!.stopPoints as Point[],
    };
    const steps = expandStructure({ structure });
    const stops = steps.flatMap((step) => (step.kind === "STOP_POINT" ? [step.stopPointId] : []));
    expect(stops).toEqual(["outer", "inner", "inner", "inner"]);
  });

  it("brouillon : un Point ajouté, retiré ou déplacé dans une disposition générale le rend modifié", () => {
    const before = general([Y("cy", 1, "p")]);
    expect(sessionDraftsEqual(before, general([Y("cy", 1, "autre-identifiant")]))).toBe(true);
    expect(sessionDraftsEqual(before, general([]))).toBe(false);
    expect(sessionDraftsEqual(before, general([S(1, "p")]))).toBe(false);
  });
});
