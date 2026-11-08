import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import {
  circuitAtMemberLimit,
  circuitAtMemberMinimum,
  circuitMemberLimit,
  circuitMemberMinimum,
  entryExceedsMemberLimit,
  exitBreaksMemberMinimum,
  SUPERSET_MEMBER_LIMIT,
  SUPERSET_MEMBER_MINIMUM,
} from "@/domain/sessions/circuitMemberLimit";
import { moveExerciseToCircuit } from "@/domain/sessions/layoutOperations";
import { duplicateLayoutExercise, moveLayoutItem, removeLayoutExercise, stepLayoutItem } from "@/domain/sessions/layoutMoves";
import { createEmptyDraft, createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { StructureElement } from "@/domain/sessions/structure";
import { insertIntoRichLayout } from "@/features/sessions/compositionLayout";

/**
 * Recette du 08/11/2026 au soir — Superset limité (Hermann : « Superset : il est possible dans le circuit de la
 * composition de séance d'ajouter un troisième exercice, ça ne doit pas être autorisé. »). Toutes les opérations de la
 * Composition qui feraient entrer un troisième membre dans un Circuit issu du Format Superset sont refusées ; le
 * réordonnancement, la sortie et la suppression restent possibles.
 */

const exercise = (id: string): SessionDraftExercise => ({ ...createExerciseDraft(id), name: id, executionParameters: durationParameters(30, 3) });
const ids = () => "new-container";

/** e0, Superset ss [a1, a2] (alterné × 3), Circuit standard cs [c1], Cycle cy [y0, Superset sy [b1, b2]], e9. */
function sample(supersetMembers: readonly string[] = ["a1", "a2"]): SessionDraft {
  const elements: StructureElement<string>[] = [
    { kind: "EXERCISE", exercise: "e0" },
    { kind: "CIRCUIT", circuit: { id: "ss", repeatCount: 3, nature: "SERIES", exercises: [...supersetMembers], originModel: "SUPERSET" } },
    { kind: "CIRCUIT", circuit: { id: "cs", repeatCount: 3, nature: "SERIES", exercises: ["c1"] } },
    {
      kind: "CYCLE",
      cycle: {
        id: "cy",
        repeatCount: 2,
        members: [
          { kind: "EXERCISE", exercise: "y0" },
          { kind: "CIRCUIT", circuit: { id: "sy", repeatCount: 3, nature: "SERIES", exercises: ["b1", "b2"], originModel: "SUPERSET" } },
        ],
      },
    },
    { kind: "EXERCISE", exercise: "e9" },
  ];
  const all = ["e0", ...supersetMembers, "c1", "y0", "b1", "b2", "e9"];
  return { ...createEmptyDraft(), exercises: all.map(exercise), structure: { elements, stopPoints: [] } };
}

/** Forme compacte : « e0 ss[a1,a2] cs[c1] cy{y0 sy[b1,b2]} e9 ». */
function shape(draft: SessionDraft): string {
  const circuitOf = (c: { id: string; exercises: readonly string[] }) => `${c.id}[${c.exercises.join(",")}]`;
  return (draft.structure?.elements ?? [])
    .map((element) =>
      element.kind === "EXERCISE"
        ? element.exercise
        : element.kind === "CIRCUIT"
          ? circuitOf(element.circuit)
          : `${element.cycle.id}{${element.cycle.members.map((m) => (m.kind === "EXERCISE" ? m.exercise : circuitOf(m.circuit))).join(" ")}}`,
    )
    .join(" ");
}

const applied = <T extends { status: string }>(outcome: T): Extract<T, { status: "APPLIED" }> => {
  if (outcome.status !== "APPLIED") throw new Error(`issue ${outcome.status}${"reason" in outcome ? ` (${String((outcome as { reason: unknown }).reason)})` : ""}`);
  return outcome as Extract<T, { status: "APPLIED" }>;
};

describe("Superset limité — règle (circuitMemberLimit)", () => {
  it("deux membres au plus pour un Superset ; aucun maximum pour un autre Circuit", () => {
    expect(SUPERSET_MEMBER_LIMIT).toBe(2);
    expect(circuitMemberLimit({ originModel: "SUPERSET" })).toBe(2);
    expect(circuitMemberLimit({ originModel: "TABATA" })).toBeNull();
    expect(circuitMemberLimit({})).toBeNull();
    expect(circuitAtMemberLimit({ originModel: "SUPERSET", exercises: ["a", "b"] })).toBe(true);
    expect(circuitAtMemberLimit({ originModel: "SUPERSET", exercises: ["a"] })).toBe(false);
    expect(circuitAtMemberLimit({ originModel: null, exercises: ["a", "b", "c"] })).toBe(false);
  });

  it("entrée refusée seulement pour un Exercice non membre d'un Superset plein", () => {
    const layout = sample().structure!;
    expect(entryExceedsMemberLimit(layout, "e0", "ss")).toBe(true);
    expect(entryExceedsMemberLimit(layout, "a1", "ss")).toBe(false);
    expect(entryExceedsMemberLimit(layout, "e0", "cs")).toBe(false);
    expect(entryExceedsMemberLimit(layout, "e0", "inconnu")).toBe(false);
  });
});

describe("Superset limité — dépose (moveLayoutItem)", () => {
  it("un Exercice de la Séance déposé dans un Superset à deux : refusé sans altération", () => {
    for (const index of [0, 1, 2]) {
      expect(moveLayoutItem(sample(), { kind: "EXERCISE", id: "e0" }, { container: { kind: "CIRCUIT", id: "ss" }, index }, ids)).toEqual({
        status: "REFUSED",
        reason: "MEMBER_LIMIT",
      });
    }
  });

  it("depuis un autre Circuit, un Cycle ou un autre Superset : refusé de même ; Superset d'un Cycle compris", () => {
    expect(moveLayoutItem(sample(), { kind: "EXERCISE", id: "c1" }, { container: { kind: "CIRCUIT", id: "ss" }, index: 1 }, ids)).toMatchObject({ reason: "MEMBER_LIMIT" });
    expect(moveLayoutItem(sample(), { kind: "EXERCISE", id: "y0" }, { container: { kind: "CIRCUIT", id: "sy" }, index: 0 }, ids)).toMatchObject({ reason: "MEMBER_LIMIT" });
    expect(moveLayoutItem(sample(), { kind: "EXERCISE", id: "b1" }, { container: { kind: "CIRCUIT", id: "ss" }, index: 2 }, ids)).toMatchObject({ reason: "MEMBER_LIMIT" });
  });

  it("témoin : un Circuit standard reçoit toujours un Exercice", () => {
    expect(shape(applied(moveLayoutItem(sample(), { kind: "EXERCISE", id: "e0" }, { container: { kind: "CIRCUIT", id: "cs" }, index: 1 }, ids)).draft)).toBe(
      "ss[a1,a2] cs[c1,e0] cy{y0 sy[b1,b2]} e9",
    );
  });

  it("réordonnancement dans le Superset : inchangé", () => {
    expect(shape(applied(moveLayoutItem(sample(), { kind: "EXERCISE", id: "a2" }, { container: { kind: "CIRCUIT", id: "ss" }, index: 0 }, ids)).draft)).toBe(
      "e0 ss[a2,a1] cs[c1] cy{y0 sy[b1,b2]} e9",
    );
  });
  // [« sortie d'un membre : inchangée » (a2 sorti au niveau Séance, Superset laissé à un membre) — remplacé par la réponse
  // de Hermann du 08/11/2026 (« dans la composition on limite à deux exercices aussi ») : voir « minimum de deux » ci-dessous.]

  it("Superset à un seul membre : un second Exercice y entre (au plus deux)", () => {
    expect(shape(applied(moveLayoutItem(sample(["a1"]), { kind: "EXERCISE", id: "e0" }, { container: { kind: "CIRCUIT", id: "ss" }, index: 1 }, ids)).draft)).toBe(
      "ss[a1,e0] cs[c1] cy{y0 sy[b1,b2]} e9",
    );
  });

  it("Superset existant à trois membres : réordonné et réduit, jamais agrandi", () => {
    const three = sample(["a1", "a2", "a3"]);
    expect(moveLayoutItem(three, { kind: "EXERCISE", id: "e0" }, { container: { kind: "CIRCUIT", id: "ss" }, index: 1 }, ids)).toMatchObject({ reason: "MEMBER_LIMIT" });
    expect(shape(applied(moveLayoutItem(three, { kind: "EXERCISE", id: "a3" }, { container: { kind: "CIRCUIT", id: "ss" }, index: 0 }, ids)).draft)).toBe(
      "e0 ss[a3,a1,a2] cs[c1] cy{y0 sy[b1,b2]} e9",
    );
    expect(shape(applied(removeLayoutExercise(three, "a3", ids)).draft)).toBe("e0 ss[a1,a2] cs[c1] cy{y0 sy[b1,b2]} e9");
  });
});

describe("Superset limité — « Monter » / « Descendre » (stepLayoutItem)", () => {
  it("« Descendre » au-dessus d'un Superset plein : la carte le franchit, hors de lui", () => {
    expect(shape(applied(stepLayoutItem(sample(), { kind: "EXERCISE", id: "e0" }, "DOWN", ids)).draft)).toBe("ss[a1,a2] e0 cs[c1] cy{y0 sy[b1,b2]} e9");
  });

  it("« Monter » sous un Superset plein : la carte le franchit, hors de lui", () => {
    const cOut = applied(moveLayoutItem(sample(), { kind: "EXERCISE", id: "c1" }, { container: { kind: "SESSION" }, index: 2 }, ids)).draft;
    expect(shape(cOut)).toBe("e0 ss[a1,a2] c1 cy{y0 sy[b1,b2]} e9");
    expect(shape(applied(stepLayoutItem(cOut, { kind: "EXERCISE", id: "c1" }, "UP", ids)).draft)).toBe("e0 c1 ss[a1,a2] cy{y0 sy[b1,b2]} e9");
  });

  it("dans un Cycle : « Descendre » de y0 passe après le Superset du Cycle", () => {
    expect(shape(applied(stepLayoutItem(sample(), { kind: "EXERCISE", id: "y0" }, "DOWN", ids)).draft)).toBe("e0 ss[a1,a2] cs[c1] cy{sy[b1,b2] y0} e9");
  });

  it("un membre du Superset monte et descend dans le Superset comme avant", () => {
    expect(shape(applied(stepLayoutItem(sample(), { kind: "EXERCISE", id: "a2" }, "UP", ids)).draft)).toBe("e0 ss[a2,a1] cs[c1] cy{y0 sy[b1,b2]} e9");
  });
});

describe("Superset limité — duplication et déplacement vers un Circuit", () => {
  it("dupliquer un membre d'un Superset à deux : refusé, rien n'est ajouté", () => {
    expect(duplicateLayoutExercise(sample(), "a1", "copy", ids)).toEqual({ status: "REFUSED", reason: "MEMBER_LIMIT" });
    expect(duplicateLayoutExercise(sample(), "b2", "copy", ids)).toEqual({ status: "REFUSED", reason: "MEMBER_LIMIT" });
  });

  it("témoins : dupliquer un membre d'un Superset à un membre, ou d'un Circuit standard, reste possible", () => {
    expect(shape(applied(duplicateLayoutExercise(sample(["a1"]), "a1", "copy", ids)).draft)).toBe("e0 ss[a1,copy] cs[c1] cy{y0 sy[b1,b2]} e9");
    expect(shape(applied(duplicateLayoutExercise(sample(), "c1", "copy", ids)).draft)).toBe("e0 ss[a1,a2] cs[c1,copy] cy{y0 sy[b1,b2]} e9");
  });

  it("moveExerciseToCircuit vers un Superset à deux : refusé ; vers un Circuit standard : appliqué", () => {
    expect(moveExerciseToCircuit(sample(), "e0", "ss", 1, ids)).toEqual({ status: "REFUSED", reason: "MEMBER_LIMIT" });
    expect(moveExerciseToCircuit(sample(), "e0", "cs", 1, ids).status).toBe("APPLIED");
  });

  it("non-régression (recette du 04/11, constat a) : un nouvel Exercice ajouté après un membre du Superset est placé hors de lui", () => {
    const draft = sample();
    // Dernier Exercice affiché : b2, membre du Superset du Cycle.
    const withoutTail: SessionDraft = {
      ...draft,
      exercises: draft.exercises.filter((item) => item.id !== "e9"),
      structure: { ...draft.structure!, elements: draft.structure!.elements.slice(0, -1) },
    };
    const inserted = insertIntoRichLayout(withoutTail, [exercise("n1")]);
    expect(shape({ ...withoutTail, structure: inserted!.structure })).toBe("e0 ss[a1,a2] cs[c1] cy{y0 sy[b1,b2] n1}");
  });
});

/**
 * Réponse de Hermann du 08/11/2026 (« Superset : dans la composition on limite à deux exercices aussi. ») : minimum de
 * deux — aucune opération ne laisse un Superset avec moins de deux membres ; le réordonnancement reste permis.
 */
describe("Superset limité — minimum de deux (réponse de Hermann du 08/11/2026)", () => {
  const out = (draft: SessionDraft, id: string, destination: Parameters<typeof moveLayoutItem>[2]) => moveLayoutItem(draft, { kind: "EXERCISE", id }, destination, ids);

  it("règle : minimum de deux pour un Superset, aucun ailleurs", () => {
    expect(SUPERSET_MEMBER_MINIMUM).toBe(2);
    expect(circuitMemberMinimum({ originModel: "SUPERSET" })).toBe(2);
    expect(circuitMemberMinimum({ originModel: null })).toBeNull();
    expect(circuitAtMemberMinimum({ originModel: "SUPERSET", exercises: ["a", "b"] })).toBe(true);
    expect(circuitAtMemberMinimum({ originModel: "SUPERSET", exercises: ["a", "b", "c"] })).toBe(false);
    expect(exitBreaksMemberMinimum(sample().structure, "a1")).toBe(true);
    expect(exitBreaksMemberMinimum(sample().structure, "c1")).toBe(false);
    expect(exitBreaksMemberMinimum(sample().structure, "e0")).toBe(false);
  });

  it("sortie d'un membre par dépose (Séance, Cycle, autre Circuit, autre Superset) : refusée sans altération", () => {
    expect(out(sample(), "a2", { container: { kind: "SESSION" }, index: 0 })).toEqual({ status: "REFUSED", reason: "MEMBER_MINIMUM" });
    expect(out(sample(), "a1", { container: { kind: "CYCLE", id: "cy" }, index: 0 })).toEqual({ status: "REFUSED", reason: "MEMBER_MINIMUM" });
    expect(out(sample(), "a1", { container: { kind: "CIRCUIT", id: "cs" }, index: 0 })).toEqual({ status: "REFUSED", reason: "MEMBER_MINIMUM" });
    expect(out(sample(), "b1", { container: { kind: "SESSION" }, index: 0 })).toEqual({ status: "REFUSED", reason: "MEMBER_MINIMUM" });
  });

  it("« Monter » du premier membre, « Descendre » du dernier : refusés (ils sortiraient) ; l'autre sens réordonne", () => {
    expect(stepLayoutItem(sample(), { kind: "EXERCISE", id: "a1" }, "UP", ids)).toEqual({ status: "REFUSED", reason: "MEMBER_MINIMUM" });
    expect(stepLayoutItem(sample(), { kind: "EXERCISE", id: "a2" }, "DOWN", ids)).toEqual({ status: "REFUSED", reason: "MEMBER_MINIMUM" });
    expect(shape(applied(stepLayoutItem(sample(), { kind: "EXERCISE", id: "a1" }, "DOWN", ids)).draft)).toBe("e0 ss[a2,a1] cs[c1] cy{y0 sy[b1,b2]} e9");
  });

  it("moveExerciseToCircuit d'un membre vers un autre Circuit : refusé ; dans son Superset : appliqué", () => {
    expect(moveExerciseToCircuit(sample(), "a1", "cs", 0, ids)).toEqual({ status: "REFUSED", reason: "MEMBER_MINIMUM" });
    expect(moveExerciseToCircuit(sample(), "a1", "ss", 1, ids).status).toBe("APPLIED");
  });

  it("suppression d'un membre d'un Superset à deux : refusée, comme le dernier membre de la boucle (LAST_TOUR)", () => {
    expect(removeLayoutExercise(sample(), "a1", ids)).toEqual({ status: "REFUSED", reason: "MEMBER_MINIMUM" });
    expect(removeLayoutExercise(sample(), "b2", ids)).toEqual({ status: "REFUSED", reason: "MEMBER_MINIMUM" });
  });

  it("Superset existant à trois membres : réduit jusqu'à deux (sortie ou suppression), jamais en dessous", () => {
    const three = sample(["a1", "a2", "a3"]);
    const reduced = applied(out(three, "a3", { container: { kind: "SESSION" }, index: 0 })).draft;
    expect(shape(reduced)).toBe("a3 e0 ss[a1,a2] cs[c1] cy{y0 sy[b1,b2]} e9");
    expect(out(reduced, "a2", { container: { kind: "SESSION" }, index: 0 })).toMatchObject({ reason: "MEMBER_MINIMUM" });
    const removed = applied(removeLayoutExercise(three, "a1", ids)).draft;
    expect(removeLayoutExercise(removed, "a2", ids)).toMatchObject({ reason: "MEMBER_MINIMUM" });
  });

  it("témoins : un membre d'un Circuit standard sort et se supprime comme avant ; le Superset entier se déplace", () => {
    expect(shape(applied(out(sample(), "c1", { container: { kind: "SESSION" }, index: 0 })).draft)).toBe("c1 e0 ss[a1,a2] cy{y0 sy[b1,b2]} e9");
    expect(applied(removeLayoutExercise(sample(), "c1", ids)).status).toBe("APPLIED");
    expect(shape(applied(moveLayoutItem(sample(), { kind: "CIRCUIT", id: "ss" }, { container: { kind: "SESSION" }, index: 0 }, ids)).draft)).toBe(
      "ss[a1,a2] e0 cs[c1] cy{y0 sy[b1,b2]} e9",
    );
  });
});
