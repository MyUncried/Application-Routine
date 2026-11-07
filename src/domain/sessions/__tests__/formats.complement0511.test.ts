import { describe, expect, it } from "@jest/globals";

import { repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { seriesRowsOf } from "@/domain/activities/ExecutionParameters";
import { configurationValidity } from "@/domain/sessions/configurationValidity";
import { DEATH_BY_INTERVAL_LIMIT, deathByIntervalLimit, type DeathByMember } from "@/domain/sessions/deathByLimit";
import {
  adaptMovementsToAnswers,
  allowedModes,
  lastRepetitionsLocked,
  amrapRoundTarget,
  buildModelElements,
  chargePerSeries,
  deathByFirstRankWarning,
  emomDurationOverflow,
  hasLoadSwitch,
  initialAnswers,
  initialMovementValues,
  summaryIssues,
  supersetRecovery,
  withMovementMode,
  withSeriesValue,
  type FormatModelKey,
  type ModelAnswers,
  type ModelMovement,
  type MovementValues,
} from "@/domain/sessions/formatModels";
import { applyModelReedit, modelStateOfCircuit } from "@/domain/sessions/formatReedit";
import { modelTimeline } from "@/domain/sessions/formatTimeline";
import { expandStructure } from "@/domain/sessions/planExpansion";
import { createEmptyDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits, type StructureCircuit, type StructureElement } from "@/domain/sessions/structure";
import { appendModelToDraft } from "@/domain/sessions/formatModels";

/**
 * Complément du 5 novembre 2026 (Hermann ; `docs/sources/formats-2026-11-05/KODJO-Complement-Parcours-creation-2026-11-05.md`,
 * référence Formats §7, §9–§12 ; main aab49948) — domaine des Formats : charges par mouvement et restauration temporaire,
 * AMRAP dégressif, EMOM prescrit par série et contrôle des fenêtres, Superset alterné, Death by en Durée, Tabata / 30/30 /
 * Renforcement / À l'échec par mouvement. Les scénarios de contrôle du §18 sont repris ici au niveau du domaine.
 */

const base = (id: string, patch: Partial<SessionDraftExercise["executionParameters"]> = {}, recovery: number | null = 90): SessionDraftExercise => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  name: `Mouvement ${id}`,
  executionParameters: { ...repetitionParameters(10, 3, 45), ...patch },
  postActivityRecoverySeconds: recovery,
  instruction: null,
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  sourceMovementId: `mv-${id}`,
});

const row = (key: FormatModelKey, answers: ModelAnswers, id: string, values: MovementValues = {}, exercise = base(id)): ModelMovement => ({
  exercise,
  values: { ...initialMovementValues(key, answers, exercise), ...values },
});

let next = 0;
const newId = () => `c${++next}`;
const only = (elements: readonly StructureElement<SessionDraftExercise>[]) => elements[0]!;
const circuitOf = (elements: readonly StructureElement<SessionDraftExercise>[]) => (only(elements).kind === "CIRCUIT" ? (only(elements) as { circuit: StructureCircuit<SessionDraftExercise> }).circuit : null);
const exerciseOf = (elements: readonly StructureElement<SessionDraftExercise>[]) => (only(elements).kind === "EXERCISE" ? (only(elements) as { exercise: SessionDraftExercise }).exercise : null);
const cells = (values: readonly (number | null)[], loads: readonly (number | null)[] = []) => values.map((repetitions, at) => ({ repetitions, loadKg: loads[at] ?? null }));

describe("charges : « Avec charge » dans les dix questionnaires, décision mouvement par mouvement (§9, §16)", () => {
  it("l'interrupteur existe pour les dix modèles, désactivé par défaut ; charge par série ou commune selon le modèle", () => {
    const keys: FormatModelKey[] = ["TABATA", "INTERVALS_30_30", "EMOM", "AMRAP", "FOR_TIME", "DEATH_BY", "STRENGTH", "SUPERSET", "PROGRESSION", "UNTIL_FAILURE"];
    for (const key of keys) {
      expect(hasLoadSwitch(key)).toBe(true);
      expect(initialAnswers(key).withLoad).toBe(false);
    }
    expect(keys.filter(chargePerSeries)).toEqual(["EMOM", "FOR_TIME", "SUPERSET", "PROGRESSION"]);
  });

  it("activation globale : aucun mouvement chargé tant que « (+ kg) » n'est pas touché", () => {
    const answers = { ...initialAnswers("PROGRESSION"), withLoad: true };
    const movements = [row("PROGRESSION", answers, "a", { cells: cells([10, 12, 14], [20, 22, 24]) })];
    const exercise = exerciseOf(buildModelElements("PROGRESSION", answers, movements, newId))!;
    expect(exercise.executionParameters.loadEnabled).toBe(false);
  });

  it("Avec → Sans → Avec dans le même brouillon : états et valeurs retrouvés ; vider les cases efface réellement", () => {
    const on = { ...initialAnswers("PROGRESSION"), withLoad: true };
    const loaded = row("PROGRESSION", on, "a", { cells: cells([10, 12, 14], [20, 22, 24]), loadOn: true });
    const loadsOf = (answers: ModelAnswers, movement: ModelMovement) => {
      const exercise = exerciseOf(buildModelElements("PROGRESSION", answers, [movement], newId))!;
      return { enabled: exercise.executionParameters.loadEnabled, loads: seriesRowsOf(exercise.executionParameters).map((series) => series.loadKg) };
    };
    expect(loadsOf(on, loaded)).toEqual({ enabled: true, loads: [20, 22, 24] });
    // Interrupteur désactivé : « Sans », valeurs gardées dans le brouillon du modèle (aucune n'est écrite).
    const off = { ...on, withLoad: false };
    expect(loadsOf(off, loaded).enabled).toBe(false);
    // « (− kg) » : même effet ; réactivation : valeurs retrouvées.
    expect(loadsOf(on, { ...loaded, values: { ...loaded.values, loadOn: false } }).enabled).toBe(false);
    expect(loadsOf(on, loaded)).toEqual({ enabled: true, loads: [20, 22, 24] });
    // Vider toutes les cases : rien à restaurer.
    const cleared = { ...loaded, values: { ...loaded.values, cells: cells([10, 12, 14]) } };
    expect(loadsOf(on, cleared).enabled).toBe(false);
  });

  it("réouverture : état effectif enregistré, sans historique concurrent du questionnaire (charges « Sans » non réactivées)", () => {
    const answers = { ...initialAnswers("SUPERSET"), withLoad: true };
    const movements = [
      row("SUPERSET", answers, "a", { cells: cells([12, 12, 12]) }),
      row("SUPERSET", answers, "b", { cells: cells([10, 10, 10], [12, 12, 12]), loadOn: true }),
    ];
    const circuit = circuitOf(buildModelElements("SUPERSET", answers, movements, newId))!;
    const state = modelStateOfCircuit("SUPERSET", circuit);
    expect(state.answers.withLoad).toBe(true);
    expect(state.movements.map((movement) => movement.values.loadOn === true)).toEqual([false, true]);
    expect(state.movements[1]!.values.cells!.map((cell) => cell.loadKg)).toEqual([12, 12, 12]);
    expect(state.movements[0]!.values.cells!.every((cell) => cell.loadKg === null)).toBe(true);
  });

  it("Tabata à plusieurs mouvements : charge commune par mouvement, objectif et pause propres (§15, §17)", () => {
    const answers = { ...initialAnswers("TABATA"), withLoad: true };
    const movements = [row("TABATA", answers, "a"), row("TABATA", answers, "b", { mode: "REPETITIONS", repetitions: 12, pause: 15, loadKg: 16, loadOn: true })];
    const circuit = circuitOf(buildModelElements("TABATA", answers, movements, newId))!;
    const [a, b] = circuit.exercises;
    expect(a!.executionParameters).toMatchObject({ mode: "DURATION", loadEnabled: false, series: { kind: "UNIFORM", count: 8, target: { kind: "NUMBER", value: 20 }, pauseSeconds: 10 } });
    expect(b!.executionParameters).toMatchObject({ mode: "REPETITIONS", loadEnabled: true, series: { kind: "UNIFORM", count: 8, target: { kind: "NUMBER", value: 12 }, pauseSeconds: 15, loadKg: 16 } });
  });
});

describe("AMRAP dégressif (§8)", () => {
  it("objectif calculé borné à 1 dans son unité : 5, 3, 1, 1, 1… ; une progression montante n'est pas bornée", () => {
    expect([0, 1, 2, 3, 4].map((round) => amrapRoundTarget(5, -2, round))).toEqual([5, 3, 1, 1, 1]);
    expect(amrapRoundTarget(5, 2, 3)).toBe(11);
  });

  it("incrément signé écrit au Format ; Déroulé 5, 3, 1, n (boucle non terminée)", () => {
    const answers = { ...initialAnswers("AMRAP"), increasingVolume: true };
    const movements = [row("AMRAP", answers, "a", { repetitions: 5, increment: -2 }), row("AMRAP", answers, "b", { repetitions: 10, increment: 0 })];
    const circuit = circuitOf(buildModelElements("AMRAP", answers, movements, newId))!;
    expect(circuit.exercises[0]!.format!.settings.incrementPerRound).toBe(-2);
    expect(configurationValidity({ elements: [{ kind: "CIRCUIT", circuit }], stopPoints: [] })).toEqual({ status: "valid" });
    const labels = modelTimeline("AMRAP", answers, movements).blocks.flatMap((block) => (block.kind === "WORK" && block.movement === 0 ? [block.label] : []));
    expect(labels).toEqual(["5", "3", "1", "n"]);
  });

  it("exclusions : buy-in et Max n'ont aucun incrément", () => {
    const answers = { ...initialAnswers("AMRAP"), increasingVolume: true, buyIn: true };
    const movements: ModelMovement[] = [
      { ...row("AMRAP", answers, "i", { repetitions: 20, increment: -2 }), buyIn: true },
      row("AMRAP", answers, "a", { max: true, increment: -2 }),
      row("AMRAP", answers, "b", { repetitions: 8, increment: -1 }),
    ];
    const circuit = circuitOf(buildModelElements("AMRAP", answers, movements, newId))!;
    expect(circuit.exercises.map((exercise) => exercise.format!.settings.incrementPerRound)).toEqual([0, 0, -1]);
  });
});

describe("EMOM prescrit par série (§14, §17)", () => {
  const answers: ModelAnswers = { ...initialAnswers("EMOM"), seriesCount: 3, intervalSeconds: 60 };

  it("la saisie de S1 ne modifie aucune autre colonne, pour les cibles et les charges", () => {
    let values = withSeriesValue(cells([null, null, null]), 0, "repetitions", 30);
    expect(values.map(cell => cell.repetitions)).toEqual([30, null, null]);
    values = withSeriesValue(values, 2, "repetitions", 40);
    values = withSeriesValue(values, 0, "repetitions", 20);
    expect(values.map(cell => cell.repetitions)).toEqual([20, null, 40]);
    values = withSeriesValue(values, 0, "loadKg", 12);
    expect(values.map(cell => cell.loadKg)).toEqual([12, null, null]);
  });

  it("objectifs et charges effectifs par série ; dans chaque intervalle, au tour k le membre joue sa série k (plan sans N × N)", () => {
    const on = { ...answers, withLoad: true };
    const movements = [
      row("EMOM", on, "a", { mode: "DURATION", cells: cells([20, 25, 30], [12, 14, 16]), loadOn: true }),
      row("EMOM", on, "b", { mode: "REPETITIONS", cells: cells([3, 4, 5]) }),
    ];
    const circuit = circuitOf(buildModelElements("EMOM", on, movements, newId))!;
    expect(circuit).toMatchObject({ nature: "TOURS", repeatCount: 3, format: { key: "EMOM", settings: { windowSeconds: 60 } } });
    expect(seriesRowsOf(circuit.exercises[0]!.executionParameters).map((series) => [series.target, series.loadKg])).toEqual([
      [{ kind: "NUMBER", value: 20 }, 12],
      [{ kind: "NUMBER", value: 25 }, 14],
      [{ kind: "NUMBER", value: 30 }, 16],
    ]);
    const steps = expandStructure({ structure: { elements: [{ kind: "CIRCUIT", circuit }], stopPoints: [] } });
    const series = steps.filter((step) => step.kind === "SERIES");
    expect(series).toHaveLength(6);
  });

  it("fenêtre commune 30 s + 30 s pour 60 s : bloquée ; bilatéral 25 s × 2 + 5 s = 55 s admis, 28 s × 2 + 5 s bloqué ; Répétitions sans durée inventée", () => {
    const one = { ...answers, seriesCount: 1 };
    expect(emomDurationOverflow(one, [row("EMOM", one, "a", { mode: "DURATION", cells: cells([30]) }), row("EMOM", one, "b", { mode: "DURATION", cells: cells([30]) })])).toHaveLength(2);
    const sided = (seconds: number) => ({ exercise: base("s", { sideMode: "RIGHT_LEFT", sideRecoverySeconds: 5 }), values: { mode: "DURATION" as const, cells: cells([seconds]) } });
    const sequence = { ...one, execution: "SEQUENCE" as const };
    expect(emomDurationOverflow(sequence, [sided(25)])).toEqual([]);
    expect(emomDurationOverflow(sequence, [sided(28)])).toEqual([{ index: 0, column: 0 }]);
    expect(emomDurationOverflow(one, [row("EMOM", one, "a", { mode: "REPETITIONS", cells: cells([200]) }), row("EMOM", one, "b", { mode: "DURATION", cells: cells([50]) })])).toEqual([]);
  });

  it("contrôle par série : seule la série 3 dépasse (20, 40, 60 s pour 60 s) ; aussi après modification en Composition (validité)", () => {
    const movements = [row("EMOM", answers, "a", { mode: "DURATION", cells: cells([20, 40, 60]) })];
    expect(emomDurationOverflow({ ...answers, execution: "SEQUENCE" }, movements)).toEqual([{ index: 0, column: 2 }]);
    expect(summaryIssues("EMOM", answers, movements).some((issue) => issue.kind === "EMOM_DURATION")).toBe(true);
    const exercise = exerciseOf(buildModelElements("EMOM", answers, movements, newId))!;
    expect(configurationValidity({ elements: [{ kind: "EXERCISE", exercise }], stopPoints: [] })).toEqual({ status: "invalid", issues: [{ elementId: exercise.id, reason: "EMOM_DURATION" }] });
  });
});

describe("Superset alterné (§11, §17)", () => {
  const answers = initialAnswers("SUPERSET");

  it("trois tours par défaut ; Circuit standard à séries alternées ; chaque membre porte N séries (A1, B1 puis A2, B2)", () => {
    expect(answers.roundCount).toBe(3);
    const movements = [row("SUPERSET", answers, "a", { cells: cells([12, 12, 12]) }), row("SUPERSET", answers, "b", { cells: cells([10, 10, 10]) })];
    const circuit = circuitOf(buildModelElements("SUPERSET", answers, movements, newId))!;
    expect(circuit).toMatchObject({ nature: "SERIES", repeatCount: 3 });
    expect(circuit.exercises.map((exercise) => seriesRowsOf(exercise.executionParameters).length)).toEqual([3, 3]);
    const order = expandStructure({ structure: { elements: [{ kind: "CIRCUIT", circuit }], stopPoints: [] } }).flatMap((step) => (step.kind === "SERIES" ? [`${step.exerciseId}${step.series}`] : []));
    expect(order.map((step) => step.replace(/^mv-|^/, ""))).toEqual(["a1", "b1", "a2", "b2", "a3", "b3"]);
  });

  it("« Récupération après le tour » = Récupération du dernier Exercice ; absente : à renseigner ; zéro explicite conservé", () => {
    const movements = [row("SUPERSET", answers, "a", { cells: cells([12, 12, 12]) }), row("SUPERSET", answers, "b", { cells: cells([10, 10, 10]) }, base("b", {}, null))];
    expect(supersetRecovery(answers, movements)).toBeNull();
    expect(summaryIssues("SUPERSET", answers, movements)).toContainEqual({ kind: "MISSING_SETTING", id: "recoveryBetweenSeconds" });
    const zero = { ...answers, recoveryBetweenSeconds: 0 };
    expect(summaryIssues("SUPERSET", zero, movements)).toEqual([]);
    const circuit = circuitOf(buildModelElements("SUPERSET", zero, movements, newId))!;
    expect(circuit.exercises.map((exercise) => exercise.postActivityRecoverySeconds)).toEqual([0, 0]);
  });

  it("réouverture avec un troisième membre : membres actuels repris ; récupération lue et écrite sur le troisième ; intermédiaires inchangés", () => {
    const zero = { ...answers, recoveryBetweenSeconds: 60 };
    const built = buildModelElements("SUPERSET", zero, [row("SUPERSET", zero, "a", { cells: cells([12, 12, 12]) }), row("SUPERSET", zero, "b", { cells: cells([10, 10, 10]) })], newId);
    const draft: SessionDraft = appendModelToDraft(createEmptyDraft(), built, newId);
    const circuit = structureCircuits(draft.structure!)[0]!;
    // Troisième Exercice ajouté depuis la Composition : sa Récupération propre (45 s) ; celle de « b » reste 60 s.
    const third = { ...base("c", {}, 45), executionParameters: { ...repetitionParameters(8, 3, 30) } };
    const withThird: SessionDraft = {
      ...draft,
      exercises: [...draft.exercises, third],
      structure: { ...draft.structure!, elements: [{ kind: "CIRCUIT", circuit: { ...circuit, exercises: [...circuit.exercises, third.id] } }] },
    };
    const full = { ...circuit, exercises: [...circuit.exercises.map((id) => withThird.exercises.find((exercise) => exercise.id === id)!), third] };
    const opened = modelStateOfCircuit("SUPERSET", full);
    expect(opened.movements).toHaveLength(3);
    expect(opened.answers.recoveryBetweenSeconds).toBe(45);
    // Le troisième n'a qu'une cible commune : ses tours sont repris tels quels, la validation suit la complétude normale.
    expect(summaryIssues("SUPERSET", opened.answers, opened.movements).some((issue) => issue.kind === "MISSING")).toBe(false);
    const edited = { ...opened, answers: { ...opened.answers, recoveryBetweenSeconds: 75 } };
    const saved = applyModelReedit(withThird, circuit.id, opened, edited, newId);
    const recovery = (id: string) => saved.exercises.find((exercise) => exercise.id === id)!.postActivityRecoverySeconds;
    expect([recovery(circuit.exercises[0]!), recovery(circuit.exercises[1]!), recovery(third.id)]).toEqual([0, 60, 75]);
  });
});

describe("Death by en Répétitions ou Durée (§13)", () => {
  const answers: ModelAnswers = { ...initialAnswers("DEATH_BY"), intervalSeconds: 60 };

  it("départ et incrément dans l'unité choisie ; le changement d'unité ne convertit pas (champs à renseigner)", () => {
    const movements = [row("DEATH_BY", answers, "a", { start: 1, startIncrement: 1 }), row("DEATH_BY", answers, "b", { mode: "DURATION", start: 10, startIncrement: 10 })];
    const circuit = circuitOf(buildModelElements("DEATH_BY", { ...answers, execution: "EACH_INTERVAL" }, movements, newId))!;
    expect(circuit.exercises.map((exercise) => [exercise.executionParameters.mode, seriesRowsOf(exercise.executionParameters)[0]!.target, exercise.format!.settings.incrementPerRound])).toEqual([
      ["REPETITIONS", { kind: "NUMBER", value: 1 }, 1],
      ["DURATION", { kind: "NUMBER", value: 10 }, 10],
    ]);
    expect(configurationValidity({ elements: [{ kind: "CIRCUIT", circuit }], stopPoints: [] })).toEqual({ status: "valid" });
    expect(withMovementMode({ mode: "REPETITIONS", start: 1, startIncrement: 1 }, "DURATION")).toEqual({ mode: "DURATION", start: null, startIncrement: null });
  });

  it("avertissement non bloquant seulement si le premier rang ne tient pas ; une limite future normale n'avertit pas ; le contrôle EMOM ne s'applique pas", () => {
    const first = (start: number) => [row("DEATH_BY", answers, "a", { mode: "DURATION", start, startIncrement: 10 }), row("DEATH_BY", answers, "b", { start: 1, startIncrement: 1 })];
    expect(deathByFirstRankWarning({ ...answers, execution: "SEQUENCE" }, first(60))).toBe(true);
    expect(deathByFirstRankWarning({ ...answers, execution: "SEQUENCE" }, first(10))).toBe(false);
    expect(summaryIssues("DEATH_BY", answers, first(60))).toEqual([]);
    // Intervalle commun : somme des membres en Durée.
    const common = [row("DEATH_BY", answers, "a", { mode: "DURATION", start: 30, startIncrement: 5 }), row("DEATH_BY", answers, "b", { mode: "DURATION", start: 30, startIncrement: 5 })];
    expect(deathByFirstRankWarning({ ...answers, execution: "EACH_INTERVAL" }, common)).toBe(true);
    expect(deathByFirstRankWarning({ ...answers, execution: "SEQUENCE" }, common)).toBe(false);
  });

  it("contrat d'exécution (PRE-10/11, non exécuté ici) : 10 s puis + 10 s, intervalle 60 s → cinq rangs, arrêt avant le sixième, motif « limite de l'intervalle atteinte »", () => {
    const member: DeathByMember = { start: 10, increment: 10, workOf: (target) => target };
    expect(deathByIntervalLimit([member], 60)).toEqual({ limit: 5, reason: DEATH_BY_INTERVAL_LIMIT });
    expect(deathByIntervalLimit([{ ...member, start: 60 }], 60)).toEqual({ limit: 0, reason: DEATH_BY_INTERVAL_LIMIT });
    expect(deathByIntervalLimit([{ start: 1, increment: 1, workOf: () => 0 }], 60)).toEqual({ limit: null, reason: null });
  });
});

describe("Renforcement, À l'échec, Progression, For time : valeurs initiales conservées (§17)", () => {
  it("Progression 10 / 12 / 14 et échelle For time 21 / 15 / 9 conservées ; aucune copie de S1", () => {
    const progression = initialMovementValues("PROGRESSION", initialAnswers("PROGRESSION"), base("a"));
    expect(progression.cells!.map((cell) => cell.repetitions)).toEqual([10, 12, 14]);
    const forTime = initialMovementValues("FOR_TIME", initialAnswers("FOR_TIME"), base("a"));
    expect(forTime.volumes).toEqual([21, 15, 9]);
  });

  it("Superset et EMOM : nouvelles séries ajoutées après coup à compléter", () => {
    const answers = initialAnswers("SUPERSET");
    const [movement] = adaptMovementsToAnswers("SUPERSET", { ...answers, roundCount: 4 }, [row("SUPERSET", answers, "a", { cells: cells([12, 12, 12]) })]);
    expect(movement!.values.cells!.map((cell) => cell.repetitions)).toEqual([12, 12, 12, null]);
  });
});

// Recette iPhone du 05/11/2026 (n-tabata, n-charge-colonne) — décisions de Hermann.
describe("recette du 05/11 : unités de l’objectif", () => {
  it("Tabata et 30/30 : objectif en Durée seule (décision « Durée seule, sans choix »)", () => {
    for (const key of ["TABATA", "INTERVALS_30_30"] as const) {
      const answers = initialAnswers(key);
      expect(allowedModes(key, [row(key, answers, "a"), row(key, answers, "b")], 0)).toEqual(["DURATION"]);
    }
  });

  it("AMRAP : au moins un exercice de la boucle en Répétitions ; le seul restant ne passe pas en Durée ; buy-in libre", () => {
    const answers = { ...initialAnswers("AMRAP"), buyIn: true };
    const buyIn = { ...row("AMRAP", answers, "i", { mode: "REPETITIONS" }), buyIn: true as const };
    const a = row("AMRAP", answers, "a", { mode: "REPETITIONS" });
    const b = row("AMRAP", answers, "b", { mode: "DURATION" });
    expect(allowedModes("AMRAP", [buyIn, a, b], 1)).toEqual(["REPETITIONS"]);
    expect(lastRepetitionsLocked("AMRAP", [buyIn, a, b], 1)).toBe(true);
    expect(allowedModes("AMRAP", [buyIn, a, b], 0)).toEqual(["REPETITIONS", "DURATION"]);
    const c = row("AMRAP", answers, "c", { mode: "REPETITIONS" });
    expect(allowedModes("AMRAP", [a, c], 0)).toEqual(["REPETITIONS", "DURATION"]);
    // Un seul mouvement : Répétitions.
    expect(allowedModes("AMRAP", [a], 0)).toEqual(["REPETITIONS"]);
  });

  it("AMRAP : Max en Répétitions seulement — passer en Durée retire Max", () => {
    expect(withMovementMode({ mode: "REPETITIONS", repetitions: 10, max: true }, "DURATION")).toMatchObject({ mode: "DURATION", max: false });
  });
});
