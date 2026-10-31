import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { currentLayout, wrapSpansInContainers } from "@/domain/sessions/layoutOperations";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import {
  duplicateLayoutExercise,
  layoutSlots,
  moveLayoutItem,
  moveLayoutStopPoint,
  removeLayoutExercise,
  stepLayoutItem,
  stepLayoutStopPoint,
  type LayoutItemMoveOutcome,
} from "@/domain/sessions/layoutMoves";
import {
  createEmptyDraft,
  createExerciseDraft,
  replaceOccurrence,
  replaceOccurrenceWithNewMovement,
  toStructuredSessionInput,
  type SessionDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
import {
  structureExercises,
  structureFromLegacy,
  withoutEmptyLegacyCircuit,
  type SessionStructure,
  type StructureElement,
  type StructureStopPointLocation,
} from "@/domain/sessions/structure";
import { resolveRichLayout } from "@/features/sessions/compositionLayout";

/**
 * PRE-9 — recette iPhone n° 2 du 31/10/2026, lot 3.
 *
 * b6-deplacer (Hermann) : « Exercice dans un cycle, avec un point d'arrêt en début de cycle : le
 * déplacement de l'exercice avant le point d'arrêt, mais dans le cycle, est interdit. Par contre, le
 * déplacement du point d'arrêt après l'exercice et à la fin du cycle est autorisé. La situation à la
 * fin est supposée être la même. »
 *
 * Constat d (Hermann) : « j'ai eu le cas d'une séance avec un circuit sans exercice, mais je ne sais
 * comment j'ai produit cela. » — invariant : aucune opération de la structure générale ne laisse un
 * Circuit (ni un Cycle) vide.
 */

const exercise = (id: string): SessionDraftExercise => ({ ...createExerciseDraft(id), name: id, executionParameters: durationParameters(30, 1) });
type Point = StructureStopPointLocation & { readonly id: string };
const S = (position: number, id: string): Point => ({ id, circuitId: null, position });
const Y = (cycleId: string, position: number, id: string): Point => ({ id, circuitId: null, cycleId, position });
const ex = (id: string): StructureElement<string> => ({ kind: "EXERCISE", exercise: id });
const newId = () => "new-container";
const savable = (draft: SessionDraft): boolean => {
  const saved = toStructuredSessionInput(withLocalMovements({ ...draft, name: "Séance" }), newId);
  if (!saved.ok) throw new Error(JSON.stringify(saved.violations));
  return true;
};

function draftOf(elements: StructureElement<string>[], stopPoints: Point[], ids: string[]): SessionDraft {
  return { ...createEmptyDraft(), exercises: ids.map(exercise), structure: { elements, stopPoints } };
}
const cycleOf = (id: string, members: string[], repeatCount = 1): StructureElement<string> => ({
  kind: "CYCLE",
  cycle: { id, repeatCount, members: members.map((member) => ({ kind: "EXERCISE" as const, exercise: member })) },
});
const pointsOf = (draft: SessionDraft) =>  // disposition courante (ancien modèle compris : Points du brouillon)
  currentLayout(draft, newId).stopPoints.map((point) => ({ id: (point as Point).id, circuitId: point.circuitId, cycleId: point.cycleId ?? null, position: point.position }));
const appliedDraft = (outcome: LayoutItemMoveOutcome): SessionDraft => {
  if (outcome.status !== "APPLIED") throw new Error(`attendu APPLIED, reçu ${outcome.status}`);
  return outcome.draft;
};

describe("Recette n° 2 (b6-deplacer) — Exercice avant le Point de tête de son Cycle", () => {
  // e0, Cycle cy [P, e1], e9 — le Point est en tête du Cycle.
  const base = () => draftOf([ex("e0"), cycleOf("cy", ["e1"]), ex("e9")], [Y("cy", 0, "p")], ["e0", "e1", "e9"]);

  it("[B.4 : mêmes éléments → UNCHANGED] — l'Exercice passe devant le Point : appliqué (Point en fin de Cycle)", () => {
    const outcome = moveLayoutItem(base(), { kind: "EXERCISE", id: "e1" }, { container: { kind: "CYCLE", id: "cy" }, index: 0 }, newId);
    const draft = appliedDraft(outcome);
    expect(draft.structure!.elements).toEqual(base().structure!.elements);
    expect(pointsOf(draft)).toEqual([{ id: "p", circuitId: null, cycleId: "cy", position: 1 }]);
  });

  it("même situation finale que le déplacement du Point après l'Exercice, en fin de Cycle", () => {
    const viaExercise = appliedDraft(moveLayoutItem(base(), { kind: "EXERCISE", id: "e1" }, { container: { kind: "CYCLE", id: "cy" }, index: 0 }, newId));
    const viaPoint = moveLayoutStopPoint(base(), "p", Y("cy", 1, ""), newId);
    expect(viaPoint.status).toBe("APPLIED");
    expect(viaPoint.status === "APPLIED" ? viaPoint.draft.structure : null).toEqual(viaExercise.structure);
  });

  it("déposé APRÈS le Point (sa place actuelle) : inchangé", () => {
    expect(
      moveLayoutItem(base(), { kind: "EXERCISE", id: "e1" }, { container: { kind: "CYCLE", id: "cy" }, index: 0, afterStopPoints: true }, newId),
    ).toEqual({ status: "UNCHANGED" });
  });

  it("au niveau de la Séance : un Exercice déposé après le Point de son rang le laisse devant lui", () => {
    // e0, P, e1, e2 ; e2 déposé au rang 1 après P → e0, P, e2, e1.
    // Disposition générale (un Cycle à la fin) : les Points sont ceux de la structure.
    const draft = draftOf([ex("e0"), ex("e1"), ex("e2"), cycleOf("cy", ["e9"])], [S(1, "p")], ["e0", "e1", "e2", "e9"]);
    const after = appliedDraft(moveLayoutItem(draft, { kind: "EXERCISE", id: "e2" }, { container: { kind: "SESSION" }, index: 1, afterStopPoints: true }, newId));
    expect(after.structure!.elements.slice(0, 3)).toEqual([ex("e0"), ex("e2"), ex("e1")]);
    expect(pointsOf(after)).toEqual([{ id: "p", circuitId: null, cycleId: null, position: 1 }]);
    const before = appliedDraft(moveLayoutItem(draft, { kind: "EXERCISE", id: "e2" }, { container: { kind: "SESSION" }, index: 1 }, newId));
    expect(before.structure!.elements.slice(0, 3)).toEqual([ex("e0"), ex("e2"), ex("e1")]);
    expect(pointsOf(before)).toEqual([{ id: "p", circuitId: null, cycleId: null, position: 2 }]);
  });

  it("Point de fin interdit (Cycle en fin de Séance, × 1) : la règle stricte refuse le Point, la règle tolérante (D-442) le retire", () => {
    const draft = draftOf([ex("e0"), cycleOf("cy", ["e1"])], [Y("cy", 0, "p")], ["e0", "e1"]);
    expect(moveLayoutStopPoint(draft, "p", Y("cy", 1, ""), newId)).toEqual({ status: "REFUSED", reason: "STOP_POINT_NOT_ALLOWED" });
    const outcome = moveLayoutItem(draft, { kind: "EXERCISE", id: "e1" }, { container: { kind: "CYCLE", id: "cy" }, index: 0 }, newId);
    expect(outcome.status).toBe("APPLIED");
    expect(outcome.status === "APPLIED" ? outcome.removedStopPointIds : null).toEqual(["p"]);
  });
});

/** Aucun Circuit ni Cycle vide dans une disposition. */
function emptyContainers(structure: Pick<SessionStructure<string, StructureStopPointLocation>, "elements"> | undefined): string[] {
  if (structure === undefined) return [];
  return structure.elements.flatMap((element) => {
    if (element.kind === "CIRCUIT") return element.circuit.exercises.length === 0 ? [element.circuit.id] : [];
    if (element.kind !== "CYCLE") return [];
    const own = element.cycle.members.length === 0 ? [element.cycle.id] : [];
    return [
      ...own,
      ...element.cycle.members.flatMap((member) => (member.kind === "CIRCUIT" && member.circuit.exercises.length === 0 ? [member.circuit.id] : [])),
    ];
  });
}

describe("Constat d — aucune opération de la structure générale ne laisse un conteneur vide", () => {
  // e0, Circuit ca [a1], Cycle cy [b0, Circuit cb [b1]], Circuit cc [c1, c2], e9 ; Points partout.
  const rich = () =>
    draftOf(
      [
        ex("e0"),
        { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 2, nature: "TOURS", exercises: ["a1"] } },
        {
          kind: "CYCLE",
          cycle: {
            id: "cy",
            repeatCount: 2,
            members: [
              { kind: "EXERCISE", exercise: "b0" },
              { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1"] } },
            ],
          },
        },
        { kind: "CIRCUIT", circuit: { id: "cc", repeatCount: 1, nature: "TOURS", exercises: ["c1", "c2"] } },
        ex("e9"),
      ],
      [S(1, "p1"), Y("cy", 1, "p2"), { id: "p3", circuitId: "cc", position: 1 }],
      ["e0", "a1", "b0", "b1", "c1", "c2", "e9"],
    );
  const items = [
    { kind: "EXERCISE" as const, id: "e0" },
    { kind: "EXERCISE" as const, id: "a1" },
    { kind: "EXERCISE" as const, id: "b0" },
    { kind: "EXERCISE" as const, id: "b1" },
    { kind: "EXERCISE" as const, id: "c1" },
    { kind: "EXERCISE" as const, id: "e9" },
    { kind: "CIRCUIT" as const, id: "ca" },
    { kind: "CIRCUIT" as const, id: "cb" },
    { kind: "CIRCUIT" as const, id: "cc" },
    { kind: "CYCLE" as const, id: "cy" },
  ];
  const settled = (outcome: LayoutItemMoveOutcome): SessionDraft[] => {
    switch (outcome.status) {
      case "APPLIED":
      case "CONFIRMATION_REQUIRED":
        return [outcome.draft];
      case "CHOICE_REQUIRED":
        return [outcome.resolutions.HEAD, outcome.resolutions.TAIL].flatMap((resolution) => [resolution.draft]);
      default:
        return [];
    }
  };

  it("chaque déplacement vers chaque emplacement admis (avant / après les Points), et chaque pas « Monter » / « Descendre »", () => {
    const draft = rich();
    let checked = 0;
    for (const item of items) {
      const layout = draft.structure!;
      for (const slot of layoutSlots(layout, item.kind)) {
        for (const afterStopPoints of [false, true]) {
          for (const result of settled(moveLayoutItem(draft, item, { ...slot, afterStopPoints }, newId))) {
            expect(emptyContainers(result.structure)).toEqual([]);
            expect(savable(result)).toBe(true);
            checked += 1;
          }
        }
      }
      for (const direction of ["UP", "DOWN"] as const) {
        for (const result of settled(stepLayoutItem(draft, item, direction, newId))) {
          expect(emptyContainers(result.structure)).toEqual([]);
        }
      }
    }
    expect(checked).toBeGreaterThan(50);
  });

  it("suppression de chaque Exercice, puis de tous à la suite ; duplication ; pas des Points", () => {
    let draft = rich();
    for (const id of ["e0", "a1", "b0", "b1", "c1", "c2", "e9"]) {
      const removed = removeLayoutExercise(rich(), id, newId);
      const results = removed.status === "APPLIED" ? [removed.draft] : removed.status === "CHOICE_REQUIRED" ? [removed.resolutions.HEAD.draft, removed.resolutions.TAIL.draft] : [];
      for (const result of results) expect(emptyContainers(result.structure)).toEqual([]);
      const copy = duplicateLayoutExercise(rich(), id, `${id}-copy`, newId);
      if (copy.status === "APPLIED") expect(emptyContainers(copy.draft.structure)).toEqual([]);
    }
    for (const id of ["a1", "b1", "b0", "c1", "c2"]) {
      const removed = removeLayoutExercise(draft, id, newId);
      const next = removed.status === "APPLIED" ? removed.draft : removed.status === "CHOICE_REQUIRED" ? removed.resolutions.HEAD.draft : draft;
      expect(emptyContainers(next.structure)).toEqual([]);
      draft = next;
    }
    for (const pointId of ["p1", "p2", "p3"]) {
      for (const direction of ["UP", "DOWN"] as const) {
        const stepped = stepLayoutStopPoint(rich(), pointId, direction, newId);
        if (stepped.status === "APPLIED") expect(emptyContainers(stepped.draft.structure)).toEqual([]);
      }
    }
  });

  it("enveloppe : un conteneur posé n'est jamais vide, Points de bord compris", () => {
    const draft = rich();
    const result = wrapSpansInContainers(draft, [{ members: [{ kind: "EXERCISE", id: "e0" }], trailingStopPointIds: ["p1"] }], "CIRCUIT", () => "k");
    expect(result).not.toBe(draft);
    expect(emptyContainers(result.structure)).toEqual([]);
    // Un périmètre sans contenu n'est jamais posé.
    expect(wrapSpansInContainers(draft, [{ members: [], trailingStopPointIds: ["p1"] }], "CIRCUIT", () => "k")).toBe(draft);
  });

  it("CAUSE TROUVÉE — remplacement d'une occurrence (changement de niveau, « Créer un nouveau mouvement ») : la disposition suit", () => {
    // Avant correction : `replaceOccurrence` ne réécrivait que les Exercices ; l'identité de a1 restait
    // dans le Circuit ca (seul membre) — Circuit rendu VIDE, nouvelle occurrence ajoutée en fin de Séance.
    const draft = rich();
    const a1 = draft.exercises.find((item) => item.id === "a1")!;
    const replaced = replaceOccurrence(draft, "a1", { ...a1, id: "a1-new" });
    const next: SessionDraft = { ...draft, ...replaced };
    expect(emptyContainers(next.structure)).toEqual([]);
    const resolved = resolveRichLayout(next);
    expect(resolved!.elements[1]).toMatchObject({ kind: "CIRCUIT", circuit: { id: "ca", exercises: [{ id: "a1-new" }] } });
    // Aucune occurrence « ajoutée » en fin de Séance.
    expect(resolved!.elements).toHaveLength(draft.structure!.elements.length);
    expect(savable(next)).toBe(true);
    const created = replaceOccurrenceWithNewMovement(draft, a1, { occurrenceId: "a1-nm", movementId: "m-new" });
    expect(emptyContainers({ ...draft, ...created }.structure)).toEqual([]);
    expect(structureExercises(created.structure!)).toContain("a1-nm");
  });

  it("ancien modèle : le Circuit sans Exercice n'est jamais une disposition (forme brute des zones seulement, retirée par `withoutEmptyLegacyCircuit`)", () => {
    const structure = structureFromLegacy({ beforeTour: ["a"], tour: { id: "t", repeatCount: 1, nature: "TOURS", exercises: [] }, afterTour: ["b"] }, []);
    expect(emptyContainers(structure)).toEqual(["t"]);
    expect(emptyContainers(withoutEmptyLegacyCircuit(structure))).toEqual([]);
  });
});
