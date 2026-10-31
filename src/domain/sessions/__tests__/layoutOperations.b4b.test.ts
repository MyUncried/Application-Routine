import { describe, expect, it } from "@jest/globals";

import {
  adjustEnvelopeSpan,
  currentLayout,
  envelopeSpanReach,
  toggleEnvelopeDesignation,
  wrapSpansInContainers,
  type EnvelopeSpan,
  type EnvelopeTarget,
} from "@/domain/sessions/layoutOperations";
import { createEmptyDraft, createExerciseDraft, toStructuredSessionInput, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { legacyFromStructure, type StructureElement } from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";

/**
 * PRE-9 (story B.4b) — enveloppe multiple et périmètre ajustable. Demande de Hermann (29/10) :
 * « On doit pouvoir sélectionner plusieurs exercices pour ajouter directement plusieurs circuits, ou
 * plusieurs exercices / circuits pour ajouter plusieurs cycles en une fois » ; traits de périmètre
 * (« idem pour la séance » = « Le Cycle », 31/10). Précision du 31/10 : « Un Circuit par Exercice ».
 * Règles d'imbrication D-451 inchangées.
 */

const named = (id: string) => ({ ...createExerciseDraft(id), name: id, structuralPosition: "BEFORE_TOUR" as const });
const ex = (id: string): EnvelopeTarget => ({ kind: "EXERCISE", id });
const span = (...members: EnvelopeTarget[]): EnvelopeSpan => ({ members });

const flat = (ids = ["a", "b", "c", "d"], stopPoints: SessionDraft["stopPoints"] = undefined): SessionDraft => ({
  ...createEmptyDraft(),
  name: "Séance",
  exercises: ids.map(named),
  ...(stopPoints !== undefined ? { stopPoints } : {}),
});

/** a, Circuit c1 [b], c, Cycle y [d, Circuit c2 [e]], f */
const rich = (): SessionDraft => {
  const elements: StructureElement<string>[] = [
    { kind: "EXERCISE", exercise: "a" },
    { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 2, nature: "TOURS", exercises: ["b"] } },
    { kind: "EXERCISE", exercise: "c" },
    {
      kind: "CYCLE",
      cycle: {
        id: "y",
        repeatCount: 2,
        members: [
          { kind: "EXERCISE", exercise: "d" },
          { kind: "EXERCISE", exercise: "g" },
          { kind: "CIRCUIT", circuit: { id: "c2", repeatCount: 1, nature: "TOURS", exercises: ["e"] } },
        ],
      },
    },
    { kind: "EXERCISE", exercise: "f" },
  ];
  return { ...flat(["a", "b", "c", "d", "g", "e", "f"]), structure: { elements, stopPoints: [] } };
};

let counter = 0;
const ids = () => `n${++counter}`;
const fresh = () => {
  counter = 0;
  return ids;
};
const shape = (draft: SessionDraft) => currentLayout(draft, () => "fresh").elements;

describe("B.4b — sélection multiple : un conteneur par élément désigné", () => {
  it("« Un Circuit par Exercice » : chaque Exercice sélectionné devient le premier membre de son propre Circuit", () => {
    const draft = flat();
    let spans: readonly EnvelopeSpan[] = [];
    spans = toggleEnvelopeDesignation(draft, "CIRCUIT", spans, ex("a"));
    spans = toggleEnvelopeDesignation(draft, "CIRCUIT", spans, ex("c"));
    spans = toggleEnvelopeDesignation(draft, "CIRCUIT", spans, ex("d"));
    const result = wrapSpansInContainers(draft, spans, "CIRCUIT", fresh());
    expect(shape(result)).toEqual([
      { kind: "CIRCUIT", circuit: { id: "n3", repeatCount: 1, nature: "TOURS", exercises: ["a"] } },
      { kind: "EXERCISE", exercise: "b" },
      { kind: "CIRCUIT", circuit: { id: "n4", repeatCount: 1, nature: "TOURS", exercises: ["c"] } },
      { kind: "CIRCUIT", circuit: { id: "n5", repeatCount: 1, nature: "TOURS", exercises: ["d"] } },
    ]);
    expect(legacyFromStructure(result.structure!)).toBeNull();
  });

  it("toucher un élément désigné le retire de la sélection ; un élément inéligible est ignoré", () => {
    const draft = rich();
    const one = toggleEnvelopeDesignation(draft, "CIRCUIT", [], ex("a"));
    expect(toggleEnvelopeDesignation(draft, "CIRCUIT", one, ex("a"))).toEqual([]);
    // b est déjà dans un Circuit : jamais de Circuit dans un Circuit.
    expect(toggleEnvelopeDesignation(draft, "CIRCUIT", one, ex("b"))).toBe(one);
    // Un Cycle n'est jamais posé sur un Exercice d'un Cycle.
    expect(toggleEnvelopeDesignation(draft, "CYCLE", [], ex("d"))).toEqual([]);
  });

  it("plusieurs Cycles en une fois (lecture par analogie) : un Cycle par Exercice ou Circuit désigné", () => {
    const draft = rich();
    const spans = [span({ kind: "CIRCUIT", id: "c1" }), span(ex("f"))];
    const result = wrapSpansInContainers(draft, spans, "CYCLE", fresh());
    expect(shape(result)).toEqual([
      { kind: "EXERCISE", exercise: "a" },
      { kind: "CYCLE", cycle: { id: "n1", repeatCount: 1, members: [{ kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 2, nature: "TOURS", exercises: ["b"] } }] } },
      { kind: "EXERCISE", exercise: "c" },
      shape(draft)[3],
      { kind: "CYCLE", cycle: { id: "n2", repeatCount: 1, members: [{ kind: "EXERCISE", exercise: "f" }] } },
    ]);
  });

  it("Circuits posés sur des Exercices directs d'un Cycle et du niveau Séance dans la même confirmation", () => {
    const result = wrapSpansInContainers(rich(), [span(ex("a")), span(ex("g"))], "CIRCUIT", fresh());
    const elements = shape(result);
    expect(elements[0]).toEqual({ kind: "CIRCUIT", circuit: { id: "n1", repeatCount: 1, nature: "TOURS", exercises: ["a"] } });
    expect(elements[3]).toMatchObject({
      cycle: {
        members: [
          { kind: "EXERCISE", exercise: "d" },
          { kind: "CIRCUIT", circuit: { id: "n2", exercises: ["g"] } },
          { kind: "CIRCUIT", circuit: { id: "c2" } },
        ],
      },
    });
  });

  it("refus sans altération : périmètre vide, inéligible, chevauchant ou non contigu", () => {
    const draft = rich();
    expect(wrapSpansInContainers(draft, [], "CIRCUIT", ids)).toBe(draft);
    expect(wrapSpansInContainers(draft, [span(ex("b"))], "CIRCUIT", ids)).toBe(draft);
    expect(wrapSpansInContainers(draft, [span(ex("a")), span(ex("a"))], "CIRCUIT", ids)).toBe(draft);
    expect(wrapSpansInContainers(draft, [span(ex("a"), ex("c"))], "CYCLE", ids)).toBe(draft);
    expect(wrapSpansInContainers(draft, [span(ex("d"), ex("e"))], "CIRCUIT", ids)).toBe(draft);
  });
});

describe("B.4b — périmètre ajustable (traits haut et bas)", () => {
  it("Circuit : le bord bas descend sur les Exercices contigus, le bord haut monte ; réduction jusqu'à un Exercice", () => {
    const draft = flat();
    const start = span(ex("b"));
    const down = adjustEnvelopeSpan(draft, "CIRCUIT", start, "BOTTOM", 1);
    expect(down.members).toEqual([ex("b"), ex("c")]);
    const up = adjustEnvelopeSpan(draft, "CIRCUIT", down, "TOP", -1);
    expect(up.members).toEqual([ex("a"), ex("b"), ex("c")]);
    // Borné à l'étendue atteignable.
    expect(adjustEnvelopeSpan(draft, "CIRCUIT", up, "BOTTOM", 9).members).toEqual([ex("a"), ex("b"), ex("c"), ex("d")]);
    expect(adjustEnvelopeSpan(draft, "CIRCUIT", up, "TOP", -1)).toBe(up);
    // Réduction : jamais moins d'un contenu.
    expect(adjustEnvelopeSpan(draft, "CIRCUIT", up, "TOP", 9).members).toEqual([ex("c")]);
    expect(adjustEnvelopeSpan(draft, "CIRCUIT", up, "BOTTOM", -9).members).toEqual([ex("a")]);

    const result = wrapSpansInContainers(draft, [up], "CIRCUIT", fresh());
    expect(shape(result)).toEqual([
      { kind: "CIRCUIT", circuit: { id: "n3", repeatCount: 1, nature: "TOURS", exercises: ["a", "b", "c"] } },
      { kind: "EXERCISE", exercise: "d" },
    ]);
    // Un Circuit unique : ancien modèle, zones réécrites ; l'enregistrement garde l'identité du Circuit.
    expect(result.exercises.map((item) => [item.id, item.structuralPosition])).toEqual([
      ["a", "IN_TOUR"],
      ["b", "IN_TOUR"],
      ["c", "IN_TOUR"],
      ["d", "AFTER_TOUR"],
    ]);
    const saved = toStructuredSessionInput(withLocalMovements(result), ids);
    if (!saved.ok) throw new Error(JSON.stringify(saved.violations));
    expect(saved.value.structure.elements[0]).toMatchObject({ kind: "CIRCUIT", circuit: { id: "n3" } });
  });

  it("Circuit : l'extension s'arrête à un Circuit, à un Cycle (imbrication D-451) et au bord du Cycle parent", () => {
    const draft = rich();
    expect(envelopeSpanReach(draft, "CIRCUIT", span(ex("a")))?.run).toEqual([ex("a")]);
    expect(envelopeSpanReach(draft, "CIRCUIT", span(ex("c")))?.run).toEqual([ex("c")]);
    // Dans le Cycle : d et g, jamais le Circuit c2 ni l'extérieur du Cycle.
    expect(envelopeSpanReach(draft, "CIRCUIT", span(ex("d")))).toEqual({ run: [ex("d"), ex("g")], start: 0, end: 0 });
    const grown = adjustEnvelopeSpan(draft, "CIRCUIT", span(ex("g")), "TOP", -1);
    const result = wrapSpansInContainers(draft, [grown], "CIRCUIT", fresh());
    expect(shape(result)[3]).toMatchObject({
      cycle: { members: [{ kind: "CIRCUIT", circuit: { id: "n1", exercises: ["d", "g"] } }, { kind: "CIRCUIT", circuit: { id: "c2" } }] },
    });
  });

  it("Cycle : le périmètre couvre Exercices et Circuits du niveau Séance, jamais un Cycle", () => {
    const draft = rich();
    const reach = envelopeSpanReach(draft, "CYCLE", span({ kind: "CIRCUIT", id: "c1" }));
    expect(reach).toEqual({ run: [ex("a"), { kind: "CIRCUIT", id: "c1" }, ex("c")], start: 1, end: 1 });
    const grown = adjustEnvelopeSpan(draft, "CYCLE", adjustEnvelopeSpan(draft, "CYCLE", span({ kind: "CIRCUIT", id: "c1" }), "TOP", -1), "BOTTOM", 5);
    const result = wrapSpansInContainers(draft, [grown], "CYCLE", fresh());
    expect(shape(result)).toEqual([
      {
        kind: "CYCLE",
        cycle: {
          id: "n1",
          repeatCount: 1,
          members: [
            { kind: "EXERCISE", exercise: "a" },
            { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 2, nature: "TOURS", exercises: ["b"] } },
            { kind: "EXERCISE", exercise: "c" },
          ],
        },
      },
      shape(draft)[3],
      { kind: "EXERCISE", exercise: "f" },
    ]);
  });

  it("un autre périmètre désigné borne l'extension ; deux périmètres voisins donnent deux conteneurs", () => {
    const draft = flat();
    const first = span(ex("a"));
    const second = span(ex("c"));
    const spans = [first, second];
    expect(adjustEnvelopeSpan(draft, "CIRCUIT", first, "BOTTOM", 3, spans).members).toEqual([ex("a"), ex("b")]);
    expect(adjustEnvelopeSpan(draft, "CIRCUIT", second, "TOP", -3, spans).members).toEqual([ex("b"), ex("c")]);
    const grown = adjustEnvelopeSpan(draft, "CIRCUIT", first, "BOTTOM", 1, spans);
    const result = wrapSpansInContainers(draft, [grown, second], "CIRCUIT", fresh());
    expect(shape(result).map((element) => (element.kind === "CIRCUIT" ? element.circuit.exercises : element.kind))).toEqual([["a", "b"], ["c"], "EXERCISE"]);
  });

  it("Exercice formaté : il borne le périmètre (ARB-27, C.4)", () => {
    const draft: SessionDraft = { ...flat(["a", "b", "c"]), exercises: [named("a"), { ...named("b"), format: { key: "EMOM", settings: {} } }, named("c")] };
    expect(envelopeSpanReach(draft, "CIRCUIT", span(ex("a")))?.run).toEqual([ex("a")]);
  });

  // [B.4b : « Séance à Points d'arrêt : aucune extension (suivi des Points : B.6) ; un périmètre étendu
  // n'est pas posé » — remplacé le 31/10/2026 par B.6.]
  it("Séance à Points d'arrêt (B.6) : extension comme sans Point ; un Point entre deux contenus réunis entre dans le Circuit, un Point d'après reste autour", () => {
    const draft = flat(["a", "b", "c"], [{ id: "p", scope: "BEFORE_TOUR", position: 2 }]);
    expect(envelopeSpanReach(draft, "CIRCUIT", span(ex("a")))).toEqual({ run: [ex("a"), ex("b"), ex("c")], start: 0, end: 0 });
    expect(adjustEnvelopeSpan(draft, "CIRCUIT", span(ex("a")), "BOTTOM", 1).members).toEqual([ex("a"), ex("b")]);
    // [a, b, P, c] → [Circuit k [a, b], P, c] : P après le Circuit (ancien modèle : AFTER_TOUR 0).
    const after = wrapSpansInContainers(draft, [span(ex("a"), ex("b"))], "CIRCUIT", () => "k");
    expect(after.stopPoints).toEqual([{ id: "p", scope: "AFTER_TOUR", position: 0 }]);
    // [a, b, P, c] → [Circuit k [b, P, c]] … ici [b, c] réunis : P entre eux, dans le Circuit.
    const inside = wrapSpansInContainers(draft, [span(ex("b"), ex("c"))], "CIRCUIT", () => "k");
    expect(inside.stopPoints).toEqual([{ id: "p", scope: "IN_TOUR", position: 1 }]);
  });

  it("brouillon de l'ancien modèle jamais enregistré : le Circuit unique est désigné par son identifiant provisoire", () => {
    const draft: SessionDraft = { ...flat(["a", "b", "c"]), exercises: [named("a"), { ...named("b"), structuralPosition: "IN_TOUR" }, { ...named("c"), structuralPosition: "AFTER_TOUR" }] };
    expect(draft.structure).toBeUndefined();
    const reach = envelopeSpanReach(draft, "CYCLE", span(ex("a")));
    expect(reach?.run).toEqual([ex("a"), { kind: "CIRCUIT", id: "candidate" }, ex("c")]);
    const grown = adjustEnvelopeSpan(draft, "CYCLE", span(ex("a")), "BOTTOM", 1);
    const result = wrapSpansInContainers(draft, [grown], "CYCLE", fresh());
    expect(shape(result)).toEqual([
      {
        kind: "CYCLE",
        cycle: {
          id: "n2",
          repeatCount: 1,
          members: [
            { kind: "EXERCISE", exercise: "a" },
            { kind: "CIRCUIT", circuit: { id: "n1", repeatCount: 1, nature: "TOURS", exercises: ["b"] } },
          ],
        },
      },
      { kind: "EXERCISE", exercise: "c" },
    ]);
  });
});
