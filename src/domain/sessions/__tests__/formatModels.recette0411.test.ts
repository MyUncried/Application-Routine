import { describe, expect, it } from "@jest/globals";

import { repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { circuitRoleOf } from "@/domain/sessions/formats";
import {
  buildModelElements,
  hasRequiredRoles,
  initialAnswers,
  initialMovementValues,
  roleSwitches,
  summaryIssues,
  withMovementMode,
  type FormatModelKey,
  type ModelAnswers,
  type ModelMovement,
  type MovementValues,
} from "@/domain/sessions/formatModels";
import { modelTimeline } from "@/domain/sessions/formatTimeline";
import type { SessionDraftExercise } from "@/domain/sessions/SessionDraft";

/**
 * Recette iPhone du 04/11/2026 (cahier « Recette Formats 04/11 ») — For time : interrupteurs Buy-in et Buy-out au
 * questionnaire ; EMOM : aucun mode d'exécution par défaut (objectif à renseigner, unité choisie au clavier).
 */

const base = (id: string): SessionDraftExercise => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  name: `Mouvement ${id}`,
  executionParameters: repetitionParameters(10, 3, 45),
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

describe("For time : interrupteurs Buy-in et Buy-out (recette du 04/11/2026)", () => {
  const answers: ModelAnswers = { ...initialAnswers("FOR_TIME"), buyIn: true, buyOut: true };

  it("interrupteurs du questionnaire : AMRAP Buy-in, For time Buy-in et Buy-out, désactivés par défaut", () => {
    expect(roleSwitches("AMRAP")).toEqual(["buyIn"]);
    expect(roleSwitches("FOR_TIME")).toEqual(["buyIn", "buyOut"]);
    expect(roleSwitches("EMOM")).toEqual([]);
    expect(initialAnswers("FOR_TIME")).toMatchObject({ buyIn: false, buyOut: false });
  });

  it("interrupteur activé : son mouvement est requis ; toujours un mouvement en Tour", () => {
    const tour = row("FOR_TIME", answers, "t");
    const buyIn = row("FOR_TIME", answers, "i", {}, { buyIn: true });
    const buyOut = row("FOR_TIME", answers, "o", {}, { buyOut: true });
    expect(hasRequiredRoles("FOR_TIME", answers, [tour])).toBe(false);
    expect(hasRequiredRoles("FOR_TIME", answers, [buyIn, tour])).toBe(false);
    expect(hasRequiredRoles("FOR_TIME", answers, [buyIn, buyOut])).toBe(false);
    expect(hasRequiredRoles("FOR_TIME", answers, [buyIn, tour, buyOut])).toBe(true);
    expect(hasRequiredRoles("FOR_TIME", initialAnswers("FOR_TIME"), [tour])).toBe(true);
  });

  it("Circuit For time : buy-in, tours, buy-out dans cet ordre, Rôles écrits ; buy-in et buy-out d'une seule série", () => {
    const rows = [row("FOR_TIME", answers, "i", {}, { buyIn: true }), row("FOR_TIME", answers, "t"), row("FOR_TIME", answers, "o", {}, { buyOut: true })];
    const [element] = buildModelElements("FOR_TIME", answers, rows, newId);
    if (element?.kind !== "CIRCUIT") throw new Error("Circuit attendu");
    const members = element.circuit.exercises;
    expect(members.map((exercise) => exercise.name)).toEqual(["Mouvement i", "Mouvement t", "Mouvement o"]);
    expect(members.map((exercise, index) => circuitRoleOf(exercise.format ?? null, index))).toEqual(["BUY_IN", "TOUR", "BUY_OUT"]);
  });

  it("récapitulatif complet : le buy-in et le buy-out n'ont qu'une case (premier tour)", () => {
    const rows = [row("FOR_TIME", answers, "i", { volumes: [50] }, { buyIn: true }), row("FOR_TIME", answers, "t"), row("FOR_TIME", answers, "o", { volumes: [20] }, { buyOut: true })];
    expect(summaryIssues("FOR_TIME", answers, rows)).toEqual([]);
  });

  it("Déroulé : buy-in une fois au départ, puis les tours, buy-out une fois à la fin", () => {
    const rows = [row("FOR_TIME", answers, "i", { volumes: [50] }, { buyIn: true }), row("FOR_TIME", answers, "t"), row("FOR_TIME", answers, "o", { volumes: [20] }, { buyOut: true })];
    const { blocks } = modelTimeline("FOR_TIME", answers, rows);
    const labels = blocks.map((block) => (block.kind === "WORK" ? block.label : block.kind));
    expect(labels[0]).toBe("50 · buy-in");
    expect(labels.at(-1)).toBe("20 · buy-out");
    expect(labels.slice(1, -1)).toEqual(["21", "15", "9"]);
  });
});

describe("EMOM : Répétitions par défaut (07/11/2026)", () => {
  // [Complément du 5 novembre 2026 (§14) : objectifs par série S1…Sn (`cells`) — tests adaptés ; la règle du 04/11 (aucune
  // unité par défaut, objectifs à renseigner, valeur saisie avant le choix lue en Répétitions) est conservée.]
  it("ligne en répétitions, objectifs S1…Sn à renseigner (récapitulatif incomplet)", () => {
    const answers = initialAnswers("EMOM");
    const movement = row("EMOM", answers, "a");
    expect(movement.values.mode).toBe("REPETITIONS");
    expect(movement.values.cells).toHaveLength(6);
    expect(movement.values.cells!.every((cell) => cell.repetitions === null)).toBe(true);
    expect(summaryIssues("EMOM", answers, [movement])).toEqual([{ kind: "MISSING", index: 0 }]);
  });

  it("choisir une unité la pose, les objectifs restent à renseigner ; puis le changement d'unité garde sa règle", () => {
    const values = initialMovementValues("EMOM", initialAnswers("EMOM"), base("a"));
    expect(withMovementMode(values, "REPETITIONS")).toMatchObject({ mode: "REPETITIONS" });
    expect(withMovementMode(values, "DURATION").cells!.every((cell) => cell.repetitions === null)).toBe(true);
    const typed = { mode: "REPETITIONS" as const, cells: [{ repetitions: 12, loadKg: null }] };
    expect(withMovementMode(typed, "DURATION").cells).toEqual([{ repetitions: null, loadKg: null }]);
  });

  it("valeur saisie avant le choix (Hermann, 04/11) : lue en Répétitions, unité encore à choisir ; Répétitions la garde, Durée la remet à renseigner", () => {
    const answers = { ...initialAnswers("EMOM"), seriesCount: 2 };
    const typed: MovementValues = { cells: [{ repetitions: 12, loadKg: null }, { repetitions: 12, loadKg: null }] };
    expect(typed.mode).toBeUndefined();
    expect(summaryIssues("EMOM", answers, [{ exercise: base("a"), values: typed }])).toEqual([]);
    const [built] = buildModelElements("EMOM", answers, [{ exercise: base("a"), values: typed }], newId);
    expect(built?.kind === "EXERCISE" ? built.exercise.executionParameters.mode : built?.kind === "CIRCUIT" ? built.circuit.exercises[0]?.executionParameters.mode : null).toBe("REPETITIONS");
    expect(withMovementMode(typed, "REPETITIONS").cells![0]!.repetitions).toBe(12);
    expect(withMovementMode(typed, "DURATION").cells![0]!.repetitions).toBeNull();
  });
});
