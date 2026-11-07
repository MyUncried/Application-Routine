import { describe, expect, it } from "@jest/globals";

import {
  adjustEnvelopeSpan,
  currentLayout,
  envelopeSpanReach,
  envelopeSpanUnits,
  wrapSpansInContainers,
  type EnvelopeSpan,
  type EnvelopeTarget,
  type EnvelopeUnit,
} from "@/domain/sessions/layoutOperations";
import { createEmptyDraft, createExerciseDraft, toStructuredSessionInput, type SessionDraft } from "@/domain/sessions/SessionDraft";
import type { StructureElement, StructureStopPointLocation } from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";

/**
 * PRE-9 — recette iPhone n° 2 du 31/10/2026, lot 3 (b4b-saisie, Hermann) : « Exercice suivi d'un point
 * d'arrêt : Ajout d'un circuit et sélection de l'exercice : Les traits n'apparaissent pas, ils devraient
 * et on doit pouvoir intégrer le point d'arrêt avec l'exercice. Ajout d'un cycle et sélection de
 * l'exercice : le trait apparaît, et c'est très bien, mais je ne peux pas sélectionner le point
 * d'arrêt, je devrais pouvoir le faire. » Règle de Hermann du 31/10 (ch07) : un Point inclus dans le
 * périmètre d'un nouveau conteneur « entre dans le conteneur ».
 */

const named = (id: string) => ({ ...createExerciseDraft(id), name: id, structuralPosition: "BEFORE_TOUR" as const });
const ex = (id: string): EnvelopeTarget => ({ kind: "EXERCISE", id });
const point = (id: string): EnvelopeUnit => ({ kind: "STOP_POINT", id });
const span = (...members: EnvelopeTarget[]): EnvelopeSpan => ({ members });

const POINT_P: StructureStopPointLocation = { id: "p", circuitId: null, position: 1 } as StructureStopPointLocation;

/** e, P, Circuit c1 [x], f — l'Exercice e est suivi d'un Point, puis d'un Circuit (inéligible pour un Circuit). */
const beforeCircuit = (): SessionDraft => {
  const elements: StructureElement<string>[] = [
    { kind: "EXERCISE", exercise: "e" },
    { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 1, nature: "TOURS", exercises: ["x"] } },
    { kind: "CIRCUIT", circuit: { id: "c2", repeatCount: 1, nature: "TOURS", exercises: ["f"] } },
  ];
  return {
    ...createEmptyDraft(),
    name: "Séance",
    exercises: ["e", "x", "f"].map(named),
    structure: { elements, stopPoints: [POINT_P] },
  };
};

/** Ancien modèle : e, P, g (avant le Circuit), Circuit [x]. */
const legacy = (): SessionDraft => ({
  ...createEmptyDraft(),
  name: "Séance",
  exercises: [named("e"), named("g"), { ...named("x"), structuralPosition: "IN_TOUR" as const }],
  stopPoints: [{ id: "p", scope: "BEFORE_TOUR", position: 1 }],
});

const shape = (draft: SessionDraft) => currentLayout(draft, () => "fresh");

describe("Recette n° 2 (b4b-saisie) — le périmètre s'étend sur un Point d'arrêt", () => {
  it("Circuit : Exercice suivi d'un Point puis d'un Circuit — l'étendue compte le Point (traits affichés)", () => {
    const draft = beforeCircuit();
    const reach = envelopeSpanReach(draft, "CIRCUIT", span(ex("e")));
    expect(reach).toEqual({ run: [ex("e"), point("p")], start: 0, end: 0 });
    // Plus d'une unité : les traits de bord sont affichés (`adjustable`).
    expect(reach!.run.length).toBeGreaterThan(1);
  });

  it("Circuit : le bord bas s'arrête sur le Point ; à la confirmation, il entre dans le Circuit (fin de tour)", () => {
    const draft = beforeCircuit();
    const grown = adjustEnvelopeSpan(draft, "CIRCUIT", span(ex("e")), "BOTTOM", 1);
    expect(grown).toEqual({ members: [ex("e")], trailingStopPointIds: ["p"] });
    expect(envelopeSpanUnits(draft, "CIRCUIT", grown)).toEqual([ex("e"), point("p")]);
    const result = wrapSpansInContainers(draft, [grown], "CIRCUIT", () => "k");
    expect(shape(result).elements[0]).toEqual({ kind: "CIRCUIT", circuit: { id: "k", repeatCount: 1, nature: "TOURS", exercises: ["e"] } });
    expect(shape(result).stopPoints).toEqual([{ id: "p", circuitId: "k", position: 1 }]);
    // Enregistrable tel quel.
    const saved = toStructuredSessionInput(withLocalMovements(result), () => "z");
    if (!saved.ok) throw new Error(JSON.stringify(saved.violations));
  });

  it("Circuit : sans le Point désigné, il reste après le Circuit (règle B.6 inchangée)", () => {
    const result = wrapSpansInContainers(beforeCircuit(), [span(ex("e"))], "CIRCUIT", () => "k");
    expect(shape(result).stopPoints).toEqual([{ id: "p", circuitId: null, position: 1 }]);
  });

  it("Cycle : le bord bas s'arrête sur le Point avant d'atteindre le contenu suivant", () => {
    const draft = beforeCircuit();
    const reach = envelopeSpanReach(draft, "CYCLE", span(ex("e")));
    expect(reach?.run).toEqual([ex("e"), point("p"), { kind: "CIRCUIT", id: "c1" }, { kind: "CIRCUIT", id: "c2" }]);
    const onPoint = adjustEnvelopeSpan(draft, "CYCLE", span(ex("e")), "BOTTOM", 1);
    expect(onPoint).toEqual({ members: [ex("e")], trailingStopPointIds: ["p"] });
    const result = wrapSpansInContainers(draft, [onPoint], "CYCLE", () => "y");
    const layout = shape(result);
    expect(layout.elements[0]).toEqual({ kind: "CYCLE", cycle: { id: "y", repeatCount: 1, members: [{ kind: "EXERCISE", exercise: "e" }] } });
    expect(layout.stopPoints).toEqual([{ id: "p", circuitId: null, cycleId: "y", position: 1 }]);
    // Un pas de plus : le Circuit suivant entre, le Point est entre les deux membres.
    const further = adjustEnvelopeSpan(draft, "CYCLE", onPoint, "BOTTOM", 1);
    expect(further).toEqual({ members: [ex("e"), { kind: "CIRCUIT", id: "c1" }] });
    // Et revenir d'un pas le rend au Point.
    expect(adjustEnvelopeSpan(draft, "CYCLE", further, "BOTTOM", -1)).toEqual(onPoint);
  });

  it("le bord haut s'arrête sur un Point de tête ; le périmètre garde toujours un contenu", () => {
    const draft = { ...beforeCircuit(), structure: { ...beforeCircuit().structure!, stopPoints: [{ id: "p", circuitId: null, position: 1 }] } };
    const fromCircuit = adjustEnvelopeSpan(draft, "CYCLE", span({ kind: "CIRCUIT", id: "c1" }), "TOP", -1);
    expect(fromCircuit).toEqual({ members: [{ kind: "CIRCUIT", id: "c1" }], leadingStopPointIds: ["p"] });
    // Réduire par le bas ne retire jamais le dernier contenu (le bord s'arrête au contenu).
    expect(adjustEnvelopeSpan(draft, "CYCLE", fromCircuit, "BOTTOM", -5)).toBe(fromCircuit);
    const result = wrapSpansInContainers(draft, [fromCircuit], "CYCLE", () => "y");
    expect(shape(result).stopPoints).toEqual([{ id: "p", circuitId: null, cycleId: "y", position: 0 }]);
  });

  it("un Point au bord d'un autre périmètre n'est pas libre", () => {
    const draft = beforeCircuit();
    const first: EnvelopeSpan = { members: [ex("e")], trailingStopPointIds: ["p"] };
    const second = span({ kind: "CIRCUIT", id: "c1" });
    expect(envelopeSpanReach(draft, "CYCLE", second, [first, second])?.run).toEqual([{ kind: "CIRCUIT", id: "c1" }, { kind: "CIRCUIT", id: "c2" }]);
  });

  it("un Point désigné qui n'est pas au bord rend le périmètre invalide (brouillon inchangé)", () => {
    const draft = beforeCircuit();
    const wrong: EnvelopeSpan = { members: [ex("e")], leadingStopPointIds: ["p"] };
    expect(envelopeSpanReach(draft, "CIRCUIT", wrong)).toBeNull();
    expect(wrapSpansInContainers(draft, [wrong], "CIRCUIT", () => "k")).toBe(draft);
  });

  it("ancien modèle (Point entre deux Exercices avant le Circuit) : e et le Point réunis — Point en fin de tour", () => {
    const draft = legacy();
    const reach = envelopeSpanReach(draft, "CIRCUIT", span(ex("e")));
    expect(reach?.run).toEqual([ex("e"), point("p"), ex("g")]);
    const grown = adjustEnvelopeSpan(draft, "CIRCUIT", span(ex("e")), "BOTTOM", 1);
    expect(grown).toEqual({ members: [ex("e")], trailingStopPointIds: ["p"] });
    const result = wrapSpansInContainers(draft, [grown], "CIRCUIT", () => "k");
    const layout = shape(result);
    const circuit = layout.elements.find((element) => element.kind === "CIRCUIT" && element.circuit.exercises.includes("e"));
    expect(circuit).toBeDefined();
    const circuitId = circuit!.kind === "CIRCUIT" ? circuit!.circuit.id : "";
    expect(layout.stopPoints).toEqual([{ id: "p", circuitId, position: 1 }]);
  });
});
