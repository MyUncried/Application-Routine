import { describe, expect, it } from "@jest/globals";

import { seriesCountOf } from "@/domain/activities/ExecutionParameters";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import {
  layoutSlots,
  moveLayoutItem,
  stepLayoutItem,
  type LayoutDestination,
  type LayoutDropControl,
  type LayoutItemMoveOutcome,
} from "@/domain/sessions/layoutMoves";
import { createEmptyDraft, createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { StructureElement } from "@/domain/sessions/structure";

/**
 * PRE-9 (story B.4, COMP §1 et §6 G1–G8, ARB-06, ARB-09, D-04, D-451 ; B.3 réutilisée pour l'entrée en
 * Circuit alterné et la matrice §2.2 ; correction C.1 du 30/10 : aucun Format transmis) — déplacement
 * d'un Exercice, d'un Circuit ou d'un Cycle entier dans la structure générale.
 */

const exercise = (id: string, seriesCount = 3): SessionDraftExercise => ({
  ...createExerciseDraft(id),
  name: id,
  executionParameters: durationParameters(30, seriesCount),
});

const ids = () => "new-id";

/**
 * e0, Circuit A groupé × 2 [a1, a2], Cycle × 2 [b0, Circuit B alterné × 2 [b1], b2], Circuit C groupé [c1], e9.
 */
function sample(overrides: Partial<Record<string, SessionDraftExercise>> = {}): SessionDraft {
  const elements: StructureElement<string>[] = [
    { kind: "EXERCISE", exercise: "e0" },
    { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 2, nature: "TOURS", exercises: ["a1", "a2"] } },
    {
      kind: "CYCLE",
      cycle: {
        id: "cy",
        repeatCount: 2,
        members: [
          { kind: "EXERCISE", exercise: "b0" },
          { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 2, nature: "SERIES", exercises: ["b1"] } },
          { kind: "EXERCISE", exercise: "b2" },
        ],
      },
    },
    { kind: "CIRCUIT", circuit: { id: "cc", repeatCount: 1, nature: "TOURS", exercises: ["c1"] } },
    { kind: "EXERCISE", exercise: "e9" },
  ];
  const exercises = ["e0", "a1", "a2", "b0", "b1", "b2", "c1", "e9"].map((id) => overrides[id] ?? exercise(id, id === "b1" ? 2 : 3));
  return { ...createEmptyDraft(), exercises, structure: { elements, stopPoints: [] } };
}

const session = (index: number): LayoutDestination => ({ container: { kind: "SESSION" }, index });
const cycle = (id: string, index: number): LayoutDestination => ({ container: { kind: "CYCLE", id }, index });
const circuit = (id: string, index: number): LayoutDestination => ({ container: { kind: "CIRCUIT", id }, index });

function applied(outcome: LayoutItemMoveOutcome): SessionDraft {
  if (outcome.status !== "APPLIED") throw new Error(`issue ${outcome.status}`);
  return outcome.draft;
}

/** Forme compacte : « e0 A[a1,a2] Y[b0 B[b1] b2] … ». */
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

describe("PRE-9 B.4 — G1–G8 : Exercice vers Circuit, Cycle ou Séance", () => {
  it("Exercice de la Séance vers un Circuit (rang choisi), position non contiguë", () => {
    const next = applied(moveLayoutItem(sample(), { kind: "EXERCISE", id: "e9" }, circuit("ca", 1), ids));
    expect(shape(next)).toBe("e0 ca[a1,e9,a2] cy{b0 cb[b1] b2} cc[c1]");
  });

  it("Exercice d'un Circuit vers un autre Circuit (autre conteneur, sans parent commun)", () => {
    const next = applied(moveLayoutItem(sample(), { kind: "EXERCISE", id: "a1" }, circuit("cc", 0), ids));
    expect(shape(next)).toBe("e0 ca[a2] cy{b0 cb[b1] b2} cc[a1,c1] e9");
  });

  it("Exercice vers un Cycle (Exercice direct, D-451) et d'un Cycle vers la Séance", () => {
    const intoCycle = applied(moveLayoutItem(sample(), { kind: "EXERCISE", id: "e0" }, cycle("cy", 3), ids));
    expect(shape(intoCycle)).toBe("ca[a1,a2] cy{b0 cb[b1] b2 e0} cc[c1] e9");
    const outOfCycle = applied(moveLayoutItem(sample(), { kind: "EXERCISE", id: "b2" }, session(0), ids));
    expect(shape(outOfCycle)).toBe("b2 e0 ca[a1,a2] cy{b0 cb[b1]} cc[c1] e9");
  });

  it("Exercice d'un Circuit de Cycle vers la Séance : Circuit vidé retiré, signalé", () => {
    const outcome = moveLayoutItem(sample(), { kind: "EXERCISE", id: "b1" }, session(5), ids);
    expect(outcome.status).toBe("APPLIED");
    if (outcome.status !== "APPLIED") return;
    expect(shape(outcome.draft)).toBe("e0 ca[a1,a2] cy{b0 b2} cc[c1] e9 b1");
    expect(outcome.removedContainers).toEqual([{ kind: "CIRCUIT", id: "cb" }]);
  });

  it("dernier membre d'un Circuit de la Séance déplacé : Circuit retiré ; un membre restant : conservé", () => {
    const outcome = moveLayoutItem(sample(), { kind: "EXERCISE", id: "c1" }, session(0), ids);
    expect(outcome.status === "APPLIED" && outcome.removedContainers).toEqual([{ kind: "CIRCUIT", id: "cc" }]);
    const kept = applied(moveLayoutItem(sample(), { kind: "EXERCISE", id: "a1" }, session(0), ids));
    expect(shape(kept)).toBe("a1 e0 ca[a2] cy{b0 cb[b1] b2} cc[c1] e9");
  });

  it("réordonnancement dans le même Circuit et position inchangée", () => {
    expect(shape(applied(moveLayoutItem(sample(), { kind: "EXERCISE", id: "a1" }, circuit("ca", 1), ids)))).toBe(
      "e0 ca[a2,a1] cy{b0 cb[b1] b2} cc[c1] e9",
    );
    expect(moveLayoutItem(sample(), { kind: "EXERCISE", id: "a1" }, circuit("ca", 0), ids).status).toBe("UNCHANGED");
  });

  it("identité et paramètres de l'Exercice conservés (Circuit groupé : séries intrinsèques inchangées, D-08)", () => {
    const before = sample();
    const next = applied(moveLayoutItem(before, { kind: "EXERCISE", id: "e0" }, circuit("ca", 0), ids));
    expect(next.exercises.find((item) => item.id === "e0")).toBe(before.exercises.find((item) => item.id === "e0"));
  });
});

describe("PRE-9 B.4 — Circuit et Cycle entiers (G6–G8, ARB-09)", () => {
  it("Circuit de la Séance vers un Cycle, et d'un Cycle vers la Séance", () => {
    expect(shape(applied(moveLayoutItem(sample(), { kind: "CIRCUIT", id: "cc" }, cycle("cy", 0), ids)))).toBe(
      "e0 ca[a1,a2] cy{cc[c1] b0 cb[b1] b2} e9",
    );
    expect(shape(applied(moveLayoutItem(sample(), { kind: "CIRCUIT", id: "cb" }, session(0), ids)))).toBe(
      "cb[b1] e0 ca[a1,a2] cy{b0 b2} cc[c1] e9",
    );
  });

  it("Circuit seul membre d'un Cycle sorti : Cycle vidé retiré", () => {
    const draft = sample();
    const single: SessionDraft = {
      ...draft,
      structure: {
        elements: [
          { kind: "EXERCISE", exercise: "e0" },
          { kind: "CYCLE", cycle: { id: "cy", repeatCount: 3, members: [{ kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 2, nature: "TOURS", exercises: ["b1"] } }] } },
          { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 1, nature: "TOURS", exercises: ["a1"] } },
        ],
        stopPoints: [],
      },
    };
    const outcome = moveLayoutItem(single, { kind: "CIRCUIT", id: "cb" }, session(0), ids);
    expect(outcome.status === "APPLIED" && outcome.removedContainers).toEqual([{ kind: "CYCLE", id: "cy" }]);
    expect(outcome.status === "APPLIED" && shape(outcome.draft)).toBe("cb[b1] e0 ca[a1]");
  });

  it("Cycle entier déplacé au niveau Séance, compte et membres conservés", () => {
    const next = applied(moveLayoutItem(sample(), { kind: "CYCLE", id: "cy" }, session(4), ids));
    expect(shape(next)).toBe("e0 ca[a1,a2] cc[c1] e9 cy{b0 cb[b1] b2}");
    const moved = next.structure?.elements.find((element) => element.kind === "CYCLE");
    expect(moved?.kind === "CYCLE" && moved.cycle.repeatCount).toBe(2);
  });

  it("imbrications interdites (D-451) refusées sans altération", () => {
    expect(moveLayoutItem(sample(), { kind: "CIRCUIT", id: "ca" }, circuit("cc", 0), ids)).toEqual({ status: "REFUSED", reason: "NESTING" });
    expect(moveLayoutItem(sample(), { kind: "CYCLE", id: "cy" }, circuit("ca", 0), ids)).toEqual({ status: "REFUSED", reason: "NESTING" });
    const twoCycles: SessionDraft = {
      ...sample(),
      structure: {
        elements: [
          { kind: "CYCLE", cycle: { id: "y1", repeatCount: 1, members: [{ kind: "EXERCISE", exercise: "e0" }] } },
          { kind: "CYCLE", cycle: { id: "y2", repeatCount: 1, members: [{ kind: "EXERCISE", exercise: "e9" }] } },
        ],
        stopPoints: [],
      },
    };
    expect(moveLayoutItem(twoCycles, { kind: "CYCLE", id: "y1" }, cycle("y2", 0), ids)).toEqual({ status: "REFUSED", reason: "NESTING" });
  });

  // [B.4 : « …, Points d'arrêt (B.6) : refus sans altération » (`STOP_POINTS`) — remplacé le 31/10/2026 par B.6.]
  it("élément ou conteneur inconnu : refus sans altération ; Points d'arrêt (B.6) : déplacement appliqué, D-442", () => {
    expect(moveLayoutItem(sample(), { kind: "EXERCISE", id: "zz" }, session(0), ids)).toEqual({ status: "REFUSED", reason: "NOT_FOUND" });
    expect(moveLayoutItem(sample(), { kind: "EXERCISE", id: "e0" }, circuit("zz", 0), ids)).toEqual({ status: "REFUSED", reason: "NOT_FOUND" });
    // Le Cycle déplacé ne peut pas se recevoir lui-même.
    expect(moveLayoutItem(sample(), { kind: "CIRCUIT", id: "cb" }, cycle("cb", 0), ids)).toEqual({ status: "REFUSED", reason: "NOT_FOUND" });
    const legacyWithPoint: SessionDraft = {
      ...createEmptyDraft(),
      exercises: [exercise("x"), exercise("y")],
      stopPoints: [{ id: "p", scope: "BEFORE_TOUR", position: 1 }],
    };
    // [x, P, y] → y en tête : [y, x, P] — P précéderait la Fin : retiré sans message (RM-219, D-442).
    const moved = moveLayoutItem(legacyWithPoint, { kind: "EXERCISE", id: "y" }, session(0), ids);
    expect(moved.status === "APPLIED" ? moved.removedStopPointIds : moved.status).toEqual(["p"]);
  });
});

describe("PRE-9 B.4 — Circuit alterné, Exercices formatés, contrôle avant dépose (B.3, D-05, D-12, ARB-24)", () => {
  it("entrée dans un Circuit alterné avec perte : confirmation, brouillon proposé adapté à N ; sans perte : appliqué", () => {
    const before = sample();
    const outcome = moveLayoutItem(before, { kind: "EXERCISE", id: "e0" }, circuit("cb", 1), ids);
    expect(outcome.status).toBe("CONFIRMATION_REQUIRED");
    if (outcome.status !== "CONFIRMATION_REQUIRED") return;
    expect(outcome.losses).toEqual([{ occurrenceId: "e0", lostSeriesCount: 1 }]);
    expect(outcome.targetCount).toBe(2);
    expect(seriesCountOf(outcome.draft.exercises.find((item) => item.id === "e0")!.executionParameters)).toBe(2);
    // Annuler : l'appelant n'écrit rien — le brouillon d'origine n'est pas modifié.
    expect(seriesCountOf(before.exercises.find((item) => item.id === "e0")!.executionParameters)).toBe(3);

    const short = sample({ e0: exercise("e0", 1) });
    const extended = applied(moveLayoutItem(short, { kind: "EXERCISE", id: "e0" }, circuit("cb", 0), ids));
    expect(seriesCountOf(extended.exercises.find((item) => item.id === "e0")!.executionParameters)).toBe(2);
  });

  it("Exercice formaté : Format et réglages conservés, aucun Format transmis au Circuit ni aux autres membres", () => {
    const amrap: SessionDraftExercise = { ...exercise("e0", 1), format: { key: "AMRAP", settings: { durationSeconds: 720 } } };
    const next = applied(moveLayoutItem(sample({ e0: amrap }), { kind: "EXERCISE", id: "e0" }, circuit("ca", 2), ids));
    expect(next.exercises.find((item) => item.id === "e0")?.format).toEqual({ key: "AMRAP", settings: { durationSeconds: 720 } });
    expect(next.exercises.filter((item) => item.format !== undefined && item.format !== null).map((item) => item.id)).toEqual(["e0"]);
    const target = next.structure?.elements.find((element) => element.kind === "CIRCUIT" && element.circuit.id === "ca");
    expect(target?.kind === "CIRCUIT" && Object.keys(target.circuit).sort()).toEqual(["exercises", "id", "nature", "repeatCount"]);
    // Sortie vers la Séance : Format conservé.
    const out = applied(moveLayoutItem(next, { kind: "EXERCISE", id: "e0" }, session(0), ids));
    expect(out.exercises.find((item) => item.id === "e0")?.format).toEqual(amrap.format);
  });

  it("Exercice formaté incompatible avec un Circuit alterné (matrice §2.2) : refus sans altération", () => {
    const amrap: SessionDraftExercise = { ...exercise("e0", 2), format: { key: "AMRAP", settings: {} } };
    expect(moveLayoutItem(sample({ e0: amrap }), { kind: "EXERCISE", id: "e0" }, circuit("cb", 0), ids)).toEqual({
      status: "REFUSED",
      reason: "FORMAT_INCOMPATIBLE",
    });
    // Death by autonome refusé dans un Circuit standard alterné (§6.1, décision complémentaire du 02/11/2026).
    const deathBy: SessionDraftExercise = { ...exercise("e0", 2), format: { key: "DEATH_BY", settings: {} } };
    expect(moveLayoutItem(sample({ e0: deathBy }), { kind: "EXERCISE", id: "e0" }, circuit("cb", 0), ids).status).toBe("REFUSED");
  });

  it("point d'appel du contrôle avant dépose : neutre par défaut ; confirmation ou refus rendus par le contrôle", () => {
    const confirm: LayoutDropControl = () => ({ status: "CONFIRM", reason: "VALEURS_IMPOSEES" });
    const refuse: LayoutDropControl = () => ({ status: "REFUSED", reason: "INCOMPATIBLE" });
    const seen: string[] = [];
    const spy: LayoutDropControl = ({ source, destination }) => {
      seen.push(`${source.id}->${destination.container.kind}`);
      return { status: "ACCEPTED" };
    };
    const asked = moveLayoutItem(sample(), { kind: "EXERCISE", id: "e0" }, circuit("ca", 0), ids, confirm);
    expect(asked.status === "CONFIRMATION_REQUIRED" && [asked.controlReason, asked.losses]).toEqual(["VALEURS_IMPOSEES", []]);
    expect(moveLayoutItem(sample(), { kind: "EXERCISE", id: "e0" }, circuit("ca", 0), ids, refuse)).toEqual({
      status: "REFUSED",
      reason: "CONTROL",
      controlReason: "INCOMPATIBLE",
    });
    expect(moveLayoutItem(sample(), { kind: "EXERCISE", id: "e0" }, circuit("ca", 0), ids, spy).status).toBe("APPLIED");
    expect(seen).toEqual(["e0->CIRCUIT"]);
  });

  it("une disposition redevenue représentable dans l'ancien modèle réécrit ses zones", () => {
    // Deux Circuits ; le seul membre du second rejoint le premier → un seul Circuit.
    const draft: SessionDraft = {
      ...createEmptyDraft(),
      exercises: [exercise("x"), exercise("y"), exercise("z")],
      structure: {
        elements: [
          { kind: "EXERCISE", exercise: "x" },
          { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 2, nature: "TOURS", exercises: ["y"] } },
          { kind: "CIRCUIT", circuit: { id: "c2", repeatCount: 1, nature: "TOURS", exercises: ["z"] } },
        ],
        stopPoints: [],
      },
    };
    const next = applied(moveLayoutItem(draft, { kind: "EXERCISE", id: "z" }, circuit("c1", 1), ids));
    expect(next.exercises.map((item) => `${item.id}:${item.structuralPosition}`)).toEqual(["x:BEFORE_TOUR", "y:IN_TOUR", "z:IN_TOUR"]);
    expect(next.tourRepeatCount).toBe(2);
  });
});

describe("PRE-9 B.4 — déplacement pas à pas généralisé (stepOccurrence sur l'arbre)", () => {
  const step = (draft: SessionDraft, id: string, kind: "EXERCISE" | "CIRCUIT" | "CYCLE", direction: "UP" | "DOWN") =>
    stepLayoutItem(draft, { kind, id }, direction, ids);

  it("emplacements d'un Exercice, d'un Circuit, d'un Cycle (ordre d'affichage, D-451)", () => {
    const elements = sample().structure!.elements;
    expect(layoutSlots({ elements }, "CYCLE")).toHaveLength(elements.length + 1);
    const circuitSlots = layoutSlots({ elements }, "CIRCUIT");
    expect(circuitSlots.some((slot) => slot.container.kind === "CIRCUIT")).toBe(false);
    expect(circuitSlots.filter((slot) => slot.container.kind === "CYCLE")).toHaveLength(4);
    expect(layoutSlots({ elements }, "EXERCISE").slice(0, 5)).toEqual([session(0), session(1), circuit("ca", 0), circuit("ca", 1), circuit("ca", 2)]);
  });

  it("Exercice : entre en fin de Circuit en montant, en tête en descendant ; en sort à la frontière", () => {
    expect(shape(applied(step(sample(), "b0", "EXERCISE", "UP")))).toBe("e0 ca[a1,a2] b0 cy{cb[b1] b2} cc[c1] e9");
    expect(shape(applied(step(sample(), "e0", "EXERCISE", "DOWN")))).toBe("ca[e0,a1,a2] cy{b0 cb[b1] b2} cc[c1] e9");
    expect(shape(applied(step(sample(), "a2", "EXERCISE", "DOWN")))).toBe("e0 ca[a1] a2 cy{b0 cb[b1] b2} cc[c1] e9");
    expect(shape(applied(step(sample(), "a1", "EXERCISE", "UP")))).toBe("e0 a1 ca[a2] cy{b0 cb[b1] b2} cc[c1] e9");
  });

  it("Exercice seul membre : il sort, le Circuit disparaît ; bornes de la séquence", () => {
    const outcome = step(sample(), "c1", "EXERCISE", "DOWN");
    expect(outcome.status === "APPLIED" && shape(outcome.draft)).toBe("e0 ca[a1,a2] cy{b0 cb[b1] b2} c1 e9");
    expect(step(sample(), "e9", "EXERCISE", "DOWN")).toEqual({ status: "REFUSED", reason: "AT_BOUNDARY" });
    expect(step(sample(), "e0", "EXERCISE", "UP")).toEqual({ status: "REFUSED", reason: "AT_BOUNDARY" });
  });

  it("Circuit et Cycle : pas à pas au niveau qui les admet", () => {
    expect(shape(applied(step(sample(), "cc", "CIRCUIT", "UP")))).toBe("e0 ca[a1,a2] cy{b0 cb[b1] b2 cc[c1]} e9");
    expect(shape(applied(step(sample(), "cy", "CYCLE", "DOWN")))).toBe("e0 ca[a1,a2] cc[c1] cy{b0 cb[b1] b2} e9");
  });

  it("entrée pas à pas dans un Circuit alterné avec perte : confirmation", () => {
    expect(step(sample(), "b0", "EXERCISE", "DOWN").status).toBe("CONFIRMATION_REQUIRED");
  });
});
