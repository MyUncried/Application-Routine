import { describe, expect, it } from "@jest/globals";

import { repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { ModelMovement } from "@/domain/sessions/formatModels";
import { modelStateOfCircuit } from "@/domain/sessions/formatReedit";
import { modelTimeline } from "@/domain/sessions/formatTimeline";
import type { SessionDraftExercise } from "@/domain/sessions/SessionDraft";

/**
 * Recette iPhone du 16/11/2026 (Hermann) — Déroulé : « la hauteur des cadres doit représenter la hauteur relative entre les séries en
 * répétition » ; Death by à un mouvement rouvert : Départ et Incrément enregistrés retrouvés (fmt-un-mouvement).
 */

const exercise = (id: string, reps = 10): SessionDraftExercise => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  name: `Mouvement ${id}`,
  executionParameters: repetitionParameters(reps, 1, 0),
  postActivityRecoverySeconds: 0,
  instruction: null,
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  sourceMovementId: `mv-${id}`,
});

const heightsOf = (blocks: ReturnType<typeof modelTimeline>["blocks"]) => blocks.flatMap((block) => (block.kind === "WORK" ? [block.height] : []));

describe("Déroulé — hauteur relative des séries en Répétitions (recette du 16/11/2026)", () => {
  it("EMOM : hauteurs proportionnelles au plus grand volume de tout le Déroulé, mouvements confondus", () => {
    const movements: ModelMovement[] = [
      { exercise: exercise("a"), values: { mode: "REPETITIONS", cells: [{ repetitions: 20, loadKg: null }, { repetitions: 10, loadKg: null }] } },
      { exercise: exercise("b"), values: { mode: "REPETITIONS", cells: [{ repetitions: 5, loadKg: null }, { repetitions: 5, loadKg: null }] } },
    ];
    const timeline = modelTimeline("EMOM", { seriesCount: 2, execution: "EACH_INTERVAL" }, movements);
    expect(heightsOf(timeline.blocks)).toEqual([1, 0.35, 0.5, 0.35]);
  });

  it("Progression : un mouvement aux petits volumes reste plus bas qu'un mouvement aux grands volumes", () => {
    const movements: ModelMovement[] = [
      { exercise: exercise("a"), values: { mode: "REPETITIONS", cells: [{ repetitions: 10, loadKg: null }, { repetitions: 20, loadKg: null }] } },
      { exercise: exercise("b"), values: { mode: "REPETITIONS", cells: [{ repetitions: 10, loadKg: null }, { repetitions: 10, loadKg: null }] } },
    ];
    const timeline = modelTimeline("PROGRESSION", { seriesCount: 2, execution: "SEQUENCE" }, movements);
    expect(heightsOf(timeline.blocks)).toEqual([0.5, 1, 0.5, 0.5]);
  });

  it("Renforcement : objectif propre à chaque mouvement ; une ligne en Durée garde sa hauteur", () => {
    const movements: ModelMovement[] = [
      { exercise: exercise("a"), values: { mode: "REPETITIONS", repetitions: 20 } },
      { exercise: exercise("b"), values: { mode: "REPETITIONS", repetitions: 10 } },
      { exercise: exercise("c"), values: { mode: "DURATION", repetitions: 30 } },
    ];
    const timeline = modelTimeline("STRENGTH", { seriesCount: 1, repetitions: 15, execution: "SEQUENCE" }, movements);
    const work = timeline.blocks.filter((block) => block.kind === "WORK");
    expect(work.map((block) => (block.kind === "WORK" ? block.label : null))).toEqual(["20", "10", "30″"]);
    expect(heightsOf(timeline.blocks)).toEqual([1, 0.5, 1]);
  });
});

describe("Déroulé — même principe pour tous les Formats (constat c du 16/11/2026)", () => {
  it("Tabata : hauteur selon la durée de travail de chaque mouvement ; récupération à la largeur de sa durée", () => {
    const movements: ModelMovement[] = [
      { exercise: exercise("a"), values: { mode: "DURATION", repetitions: 40 } },
      { exercise: exercise("b"), values: { mode: "DURATION", repetitions: 20 } },
    ];
    const timeline = modelTimeline("TABATA", { seriesCount: 1, workSeconds: 20, recoveryBetweenSeconds: 60, execution: "SEQUENCE" }, movements);
    expect(heightsOf(timeline.blocks)).toEqual([1, 0.5]);
    expect(timeline.blocks.find((block) => block.kind === "REST")).toMatchObject({ weight: 3 });
  });

  it("For time : buy-in et buy-out comptent dans le plus grand volume du Déroulé", () => {
    const movements: ModelMovement[] = [
      { exercise: exercise("a"), values: { mode: "REPETITIONS", volumes: [40], loads: [] }, buyIn: true },
      { exercise: exercise("b"), values: { mode: "REPETITIONS", volumes: [20, 10], loads: [] } },
    ];
    const timeline = modelTimeline("FOR_TIME", { roundCount: 2, buyIn: true, buyOut: false }, movements);
    expect(heightsOf(timeline.blocks)).toEqual([1, 0.5, 0.35]);
  });

  it("AMRAP : volume du buy-in et des tours, « n » à la hauteur de son volume", () => {
    const movements: ModelMovement[] = [
      { exercise: exercise("a"), values: { mode: "REPETITIONS", repetitions: 30, max: false, increment: null, loadKg: null }, buyIn: true },
      { exercise: exercise("b"), values: { mode: "REPETITIONS", repetitions: 15, max: false, increment: null, loadKg: null } },
    ];
    const timeline = modelTimeline("AMRAP", { durationSeconds: 600, buyIn: true }, movements);
    expect(heightsOf(timeline.blocks)).toEqual([1, 0.5, 0.5, 0.5, 0.5]);
  });

  it("Death by à plusieurs mouvements : Départ et Incrément propres, hauteurs rapportées au plus grand rang ; « n » au plus haut", () => {
    const movements: ModelMovement[] = [
      { exercise: exercise("a"), values: { mode: "REPETITIONS", start: 2, startIncrement: 2 } },
      { exercise: exercise("b"), values: { mode: "REPETITIONS", start: 1, startIncrement: 1 } },
    ];
    const timeline = modelTimeline("DEATH_BY", { intervalSeconds: 60, recoveryBetweenSeconds: 120, execution: "SEQUENCE" }, movements);
    const work = timeline.blocks.filter((block) => block.kind === "WORK");
    expect(work.map((block) => (block.kind === "WORK" ? block.label : null))).toEqual(["2", "4", "6", "8", "10", "12", "n", "1", "2", "3", "4", "5", "6", "n"]);
    // Recette du 16/11/2026 (r16b-deroule-hauteur) : « n » plus haute que la case qui la précède — rangs chiffrés ramenés à 0,8.
    // [« n » à la hauteur du plus grand rang (1, 1) — remplacé le 16/11/2026.]
    const expected = [2 / 12, 4 / 12, 0.5, 8 / 12, 10 / 12, 1].map((value) => Math.max(0.35, value) * 0.8);
    heightsOf(timeline.blocks)
      .slice(0, 6)
      .forEach((height, at) => expect(height).toBeCloseTo(expected[at]!, 10));
    expect(heightsOf(timeline.blocks)[6]).toBe(1);
    expect(heightsOf(timeline.blocks)[6]).toBeGreaterThan(heightsOf(timeline.blocks)[5]!);
    expect(timeline.blocks.find((block) => block.kind === "REST")).toMatchObject({ weight: 2 });
  });

  it("Death by sans Départ ni Incrément saisis : illustration 1, 2, 3…", () => {
    const movements: ModelMovement[] = [{ exercise: exercise("a"), values: { mode: "REPETITIONS", start: null, startIncrement: null } }];
    const timeline = modelTimeline("DEATH_BY", { intervalSeconds: 60 }, movements);
    expect(timeline.blocks.flatMap((block) => (block.kind === "WORK" ? [block.label] : []))).toEqual(["1", "2", "3", "4", "5", "6", "n"]);
  });
});

describe("Déroulé de l'AMRAP — recette du 16/11/2026 (r16b-deroule-hauteur)", () => {
  it("buy-in de la largeur des autres cases ; volume croissant : chaque « n » plus haute que la case du même mouvement qui la précède", () => {
    const movements: ModelMovement[] = [
      { exercise: exercise("in"), values: { mode: "REPETITIONS", repetitions: 30 }, buyIn: true },
      { exercise: exercise("a"), values: { mode: "REPETITIONS", repetitions: 10, increment: 2 } },
      { exercise: exercise("b"), values: { mode: "REPETITIONS", repetitions: 5, increment: 1 } },
    ];
    const timeline = modelTimeline("AMRAP", { durationSeconds: 600, buyIn: true, increasingVolume: true }, movements);
    const work = timeline.blocks.flatMap((block) => (block.kind === "WORK" ? [block] : []));
    expect(work[0]).toMatchObject({ buyIn: true, weight: 1 });
    expect(work.every((block) => block.weight === 1)).toBe(true);
    const ofMovement = (movement: number) => work.filter((block) => block.movement === movement);
    for (const movement of [1, 2]) {
      const blocks = ofMovement(movement);
      const last = blocks[blocks.length - 1]!;
      expect(last.label).toBe("n");
      expect(last.height).toBeGreaterThan(blocks[blocks.length - 2]!.height);
    }
  });
});

describe("Death by à un mouvement — réouverture (recette du 16/11/2026, fmt-un-mouvement)", () => {
  it("Départ et Incrément enregistrés deviennent les réglages communs", () => {
    const only: SessionDraftExercise = { ...exercise("a", 4), format: { key: "DEATH_BY", settings: { incrementPerRound: 2, intervalSeconds: 60 } } };
    const state = modelStateOfCircuit("DEATH_BY", { id: "c1", nature: "TOURS", repeatCount: 1, exercises: [only], originModel: "DEATH_BY" });
    expect(state.answers).toMatchObject({ startRepetitions: 4, increment: 2 });
  });
});
