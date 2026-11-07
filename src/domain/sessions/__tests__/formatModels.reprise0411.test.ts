import { describe, expect, it } from "@jest/globals";

import { repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { seriesRowsOf } from "@/domain/activities/ExecutionParameters";
import { circuitRoleOf, withCircuitRole } from "@/domain/sessions/formats";
import {
  allowedModes,
  buildModelElements,
  emomDurationOverflow,
  initialAnswers,
  initialMovementValues,
  summaryIssues,
  withMovementMode,
  type FormatModelKey,
  type ModelAnswers,
  type ModelMovement,
  type MovementValues,
} from "@/domain/sessions/formatModels";
import type { SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { StructureElement } from "@/domain/sessions/structure";

/**
 * Reprise du 04/11/2026 — mise à jour consolidée des écrans Formats (§4.4, §4.5, §6 bis 2, §6 ter, §6 quater,
 * §6 quater bis) : unité de l'objectif sans conversion, contrôle EMOM des durées au seuil inclusif, charges des
 * Formats (case vide = sans charge), Rôle dans le circuit et zones, Death by départ / incrément par mouvement.
 */

const base = (id: string, patch: Partial<SessionDraftExercise["executionParameters"]> = {}): SessionDraftExercise => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  name: `Mouvement ${id}`,
  executionParameters: { ...repetitionParameters(10, 3, 45), ...patch },
  postActivityRecoverySeconds: 90,
  instruction: null,
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  sourceMovementId: `mv-${id}`,
});

const row = (key: FormatModelKey, answers: ModelAnswers, id: string, values: MovementValues = {}, extra: Partial<ModelMovement> = {}): ModelMovement => {
  const exercise = base(id);
  return { exercise, values: { ...initialMovementValues(key, answers, exercise), ...values }, ...extra };
};

let next = 0;
const newId = () => `r${++next}`;
const circuitOf = (elements: readonly StructureElement<SessionDraftExercise>[]) => (elements[0]!.kind === "CIRCUIT" ? elements[0]!.circuit : null);

describe("unité de l'objectif (MAJ 04/11 §4.4, §4.5)", () => {
  it("changer d'unité remet l'objectif « à renseigner », sans conversion ; charges conservées", () => {
    const values: MovementValues = { mode: "REPETITIONS", repetitions: 10, increment: 2, loadKg: 12 };
    expect(withMovementMode(values, "DURATION")).toEqual({ mode: "DURATION", repetitions: null, increment: null, loadKg: 12 });
    expect(withMovementMode(values, "REPETITIONS")).toBe(values);
  });

  it("AMRAP seul : Répétitions seulement ; Circuit AMRAP : Répétitions ou Durée", () => {
    const answers = initialAnswers("AMRAP");
    expect(allowedModes("AMRAP", [row("AMRAP", answers, "a")], 0)).toEqual(["REPETITIONS"]);
    expect(allowedModes("AMRAP", [row("AMRAP", answers, "a"), row("AMRAP", answers, "b")], 1)).toEqual(["REPETITIONS", "DURATION"]);
  });

  it("For time : le dernier Exercice en Répétitions de l'ensemble du Circuit ne passe pas en Durée", () => {
    const answers = initialAnswers("FOR_TIME");
    const movements = [row("FOR_TIME", answers, "a", { mode: "DURATION" }), row("FOR_TIME", answers, "b")];
    expect(allowedModes("FOR_TIME", movements, 1)).toEqual(["REPETITIONS"]);
    expect(allowedModes("FOR_TIME", movements, 0)).toEqual(["REPETITIONS", "DURATION"]);
  });
});

describe("contrôle EMOM des durées — seuil inclusif (décision du 03/11, MAJ 04/11 §4.4)", () => {
  const answers: ModelAnswers = { ...initialAnswers("EMOM"), intervalSeconds: 60 };

  // [Complément du 5 novembre 2026 (§14) : valeurs par série S1…Sn — test adapté]
  const cells = (count: number, value: number | null) => Array.from({ length: count }, () => ({ repetitions: value, loadKg: null }));
  const one = { ...answers, seriesCount: 1 };

  it("dans chaque intervalle : 30 s + 30 s pour 60 s bloque ; les membres en Répétitions comptent pour 0", () => {
    const movements = [row("EMOM", one, "a", { mode: "DURATION", cells: cells(1, 30) }), row("EMOM", one, "b", { mode: "DURATION", cells: cells(1, 30) })];
    expect(emomDurationOverflow(one, movements)).toEqual([{ index: 0, column: 0 }, { index: 1, column: 0 }]);
    expect(summaryIssues("EMOM", one, movements)).toContainEqual({ kind: "EMOM_DURATION", indexes: [0, 1], cells: [{ index: 0, column: 0 }, { index: 1, column: 0 }] });
    const mixed = [row("EMOM", one, "a", { mode: "DURATION", cells: cells(1, 30) }), row("EMOM", one, "b", { mode: "REPETITIONS", cells: cells(1, 10) })];
    expect(emomDurationOverflow(one, mixed)).toEqual([]);
  });

  it("de chaque côté : objectif × 2 plus la pause entre les côtés (40 s de chaque côté = 80 s ≥ 60 s)", () => {
    const sided = { ...one, execution: "SEQUENCE" as const };
    const exercise = base("a", { sideMode: "RIGHT_LEFT", sideRecoverySeconds: 5 });
    const movement: ModelMovement = { exercise, values: { mode: "DURATION", cells: cells(1, 25) } };
    // 25 × 2 + 5 = 55 s < 60 s ; 28 × 2 + 5 = 61 s ≥ 60 s.
    expect(emomDurationOverflow(sided, [movement])).toEqual([]);
    expect(emomDurationOverflow(sided, [{ ...movement, values: { mode: "DURATION", cells: cells(1, 28) } }])).toEqual([{ index: 0, column: 0 }]);
  });

  it("EMOM simple : 60 s pour 60 s bloque (seuil inclusif), 59 s non", () => {
    expect(emomDurationOverflow(one, [row("EMOM", one, "a", { mode: "DURATION", cells: cells(1, 60) })])).toEqual([{ index: 0, column: 0 }]);
    expect(emomDurationOverflow(one, [row("EMOM", one, "a", { mode: "DURATION", cells: cells(1, 59) })])).toEqual([]);
  });
});

describe("formulaire complet (MAJ 04/11 §4.4) : une charge vide ne bloque pas", () => {
  it("Progression avec charge : charges vides admises, objectif manquant bloquant", () => {
    const answers: ModelAnswers = { ...initialAnswers("PROGRESSION"), withLoad: true };
    expect(summaryIssues("PROGRESSION", answers, [row("PROGRESSION", answers, "a")])).toEqual([]);
    const missing = row("PROGRESSION", answers, "a", { cells: [{ repetitions: null, loadKg: 10 }, { repetitions: 12, loadKg: null }, { repetitions: 14, loadKg: null }] });
    expect(summaryIssues("PROGRESSION", answers, [missing])).toEqual([{ kind: "MISSING", index: 0 }]);
  });

  it("Death by à plusieurs mouvements : départ et incrément propres, incrément ≥ + 1", () => {
    const answers = initialAnswers("DEATH_BY");
    const movements = [row("DEATH_BY", answers, "a"), row("DEATH_BY", answers, "b", { start: 2, startIncrement: 0 })];
    expect(summaryIssues("DEATH_BY", answers, movements)).toEqual([{ kind: "MISSING", index: 1 }]);
    const built = buildModelElements("DEATH_BY", { ...answers, execution: "EACH_INTERVAL" }, [movements[0]!, { ...movements[1]!, values: { start: 2, startIncrement: 2 } }], newId);
    const circuit = circuitOf(built);
    expect(circuit!.exercises.map((exercise) => [seriesRowsOf(exercise.executionParameters)[0]!.target, exercise.format?.settings.incrementPerRound])).toEqual([
      [{ kind: "NUMBER", value: 1 }, 1],
      [{ kind: "NUMBER", value: 2 }, 2],
    ]);
  });
});

describe("charges des Formats (MAJ 04/11 §6 quater bis)", () => {
  // [EMOM : charges calculées depuis départ et incrément (`emomSeriesLoads`) — remplacé le 05/11/2026 par les charges saisies
  // série par série (complément, §14) ; voir `formats.complement0511.test.ts`.]

  it("interrupteur désactivé : aucune charge créée ; AMRAP : charge fixe, Max ne grise pas la charge", () => {
    const off = initialAnswers("AMRAP");
    const [plain] = buildModelElements("AMRAP", off, [row("AMRAP", off, "a", { repetitions: 10, loadKg: 20, loadOn: true })], newId);
    expect(plain!.kind === "EXERCISE" && plain!.exercise.executionParameters.loadEnabled).toBe(false);
    const on: ModelAnswers = { ...off, withLoad: true };
    // Complément du 5 novembre 2026 (§16) : charge appliquée au mouvement par « (+ kg) » (`loadOn`).
    const [loaded] = buildModelElements("AMRAP", on, [row("AMRAP", on, "a", { max: true, loadKg: 20, loadOn: true })], newId);
    const exercise = loaded!.kind === "EXERCISE" ? loaded!.exercise : null;
    expect(exercise!.executionParameters.loadEnabled).toBe(true);
    expect(seriesRowsOf(exercise!.executionParameters)[0]).toMatchObject({ target: { kind: "FAILURE" }, loadKg: 20 });
  });

  it("For time : une charge par tour ; case vide = tour sans charge (0 kg, jamais une saisie)", () => {
    const answers: ModelAnswers = { ...initialAnswers("FOR_TIME"), withLoad: true };
    const [element] = buildModelElements("FOR_TIME", answers, [row("FOR_TIME", answers, "a", { loads: [40, 45, null], loadOn: true })], newId);
    const exercise = element!.kind === "EXERCISE" ? element!.exercise : null;
    expect(seriesRowsOf(exercise!.executionParameters).map((series) => series.loadKg)).toEqual([40, 45, 0]);
    expect(exercise!.executionParameters.loadEnabled).toBe(true);
  });
});

describe("Rôle dans le circuit (MAJ 04/11 §6 bis 2)", () => {
  it("For time : zones buy-in, tour, buy-out ; buy-in et buy-out une seule exécution ; plusieurs par zone", () => {
    const answers = initialAnswers("FOR_TIME");
    const movements = [
      row("FOR_TIME", answers, "loop"),
      row("FOR_TIME", answers, "out", {}, { buyOut: true }),
      row("FOR_TIME", answers, "in1", {}, { buyIn: true }),
      row("FOR_TIME", answers, "in2", { mode: "DURATION", volumes: [120] }, { buyIn: true }),
    ];
    const circuit = circuitOf(buildModelElements("FOR_TIME", answers, movements, newId));
    expect(circuit!.exercises.map((exercise, index) => [exercise.id, circuitRoleOf(exercise.format, index), seriesRowsOf(exercise.executionParameters).length])).toEqual([
      ["in1", "BUY_IN", 1],
      ["in2", "BUY_IN", 1],
      ["loop", "TOUR", 3],
      ["out", "BUY_OUT", 1],
    ]);
    expect(circuit!.exercises[1]!.executionParameters.mode).toBe("DURATION");
  });

  it("AMRAP : buy-in à l'échec admis (Max), incrément inactif", () => {
    const answers: ModelAnswers = { ...initialAnswers("AMRAP"), buyIn: true, increasingVolume: true };
    const movements = [row("AMRAP", answers, "in", { max: true }, { buyIn: true }), row("AMRAP", answers, "a", { repetitions: 10, increment: 2 })];
    const circuit = circuitOf(buildModelElements("AMRAP", answers, movements, newId));
    expect(circuit!.exercises.map((exercise) => [circuitRoleOf(exercise.format), seriesRowsOf(exercise.executionParameters)[0]!.target.kind, exercise.format?.settings.incrementPerRound])).toEqual([
      ["BUY_IN", "FAILURE", 0],
      ["TOUR", "NUMBER", 2],
    ]);
    expect(summaryIssues("AMRAP", answers, movements)).toEqual([]);
  });

  it("ancien Passage « Une fois » relu : Buy-in en tête, Buy-out en fin (For time) ; le Rôle le remplace à l'écriture", () => {
    const legacy = { key: "FOR_TIME" as const, settings: { passageOnce: 1 } };
    expect(circuitRoleOf(legacy, 0)).toBe("BUY_IN");
    expect(circuitRoleOf(legacy, 3)).toBe("BUY_OUT");
    expect(circuitRoleOf({ key: "AMRAP", settings: { passageOnce: 1 } }, 2)).toBe("BUY_IN");
    expect(withCircuitRole(legacy, "BUY_OUT")).toEqual({ key: "FOR_TIME", settings: { circuitRole: 2 } });
    expect(withCircuitRole({ key: "FOR_TIME", settings: { circuitRole: 1 } }, "TOUR")).toEqual({ key: "FOR_TIME", settings: {} });
  });
});
