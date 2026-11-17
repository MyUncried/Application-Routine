import { describe, expect, it } from "@jest/globals";

import { seriesRowsOf, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { repetitionParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { enterCarrier } from "@/domain/sessions/carrierMembership";
import { setMemberRole } from "@/domain/sessions/circuitRoles";
import { adaptMovementsToAnswers, buildModelElements, initialAnswers, type ModelAnswers, type ModelMovement } from "@/domain/sessions/formatModels";
import { applyModelReedit, modelStateOfCircuit } from "@/domain/sessions/formatReedit";
import type { ElementFormat } from "@/domain/sessions/formats";
import { forTimeRoleChangeLoss, withForTimeSeries } from "@/domain/sessions/forTimeSeries";
import { setLayoutCircuitCount } from "@/domain/sessions/layoutOperations";
import type { Activity } from "@/domain/sessions/Session";
import { createEmptyDraft, toSessionDraft, toStructuredSessionInput, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { StructuredSession } from "@/domain/sessions/SessionRepository";
import { structureCircuits, type SessionStructure } from "@/domain/sessions/structure";

/**
 * PRE-11 — For time, corrections 1 et 2 de Hermann du 14/11/2026 (règles FT-5, FT-12 mises à jour ; nombre de séries des blocs).
 *
 * Correction 1 : « Pour un exercice en rôle Tour, les cibles sont TOUJOURS enregistrées tour par tour : une valeur par tour
 * (21-15-9, ou 10-10-10). » « "Séries identiques" n'est qu'un raccourci de saisie dans la modale. » Correction 2 : « Le nombre de
 * séries est propre à chaque bloc (buy-in d'un côté, buy-out de l'autre), d'au moins 1, et commun à tous les exercices du bloc. »
 * Tests demandés : (a) à (f).
 */

const BUY_IN: ElementFormat = { key: "FOR_TIME", settings: { circuitRole: 1 } };
const TOUR: ElementFormat = { key: "FOR_TIME", settings: {} };
const CIRCUIT_FORMAT: ElementFormat = { key: "FOR_TIME", settings: { restBetweenRoundsSeconds: 0 } };

const exercise = (id: string, parameters: ExecutionParametersInput, format?: ElementFormat): SessionDraftExercise => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  name: `Mouvement ${id}`,
  executionParameters: parameters,
  postActivityRecoverySeconds: 0,
  instruction: null,
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  sourceMovementId: `mv-${id}`,
  ...(format !== undefined ? { format } : {}),
});

function forTime(members: readonly SessionDraftExercise[], rounds = 3): SessionDraft {
  return {
    ...createEmptyDraft(),
    exercises: [...members],
    structure: {
      elements: [{ kind: "CIRCUIT", circuit: { id: "f", nature: "SERIES", repeatCount: rounds, format: CIRCUIT_FORMAT, exercises: members.map((item) => item.id), originModel: "FOR_TIME" } }],
      stopPoints: [],
    },
  };
}

const targets = (draft: Pick<SessionDraft, "exercises">, id: string) =>
  seriesRowsOf(draft.exercises.find((item) => item.id === id)!.executionParameters).map((row) => (row.target.kind === "NUMBER" ? row.target.value : row.target.kind));
const kindOf = (draft: Pick<SessionDraft, "exercises">, id: string) => draft.exercises.find((item) => item.id === id)!.executionParameters.series.kind;

function opened(draft: SessionDraft) {
  const circuit = structureCircuits(draft.structure!).find((item) => item.id === "f")!;
  return modelStateOfCircuit("FOR_TIME", { ...circuit, exercises: circuit.exercises.map((id) => draft.exercises.find((item) => item.id === id)!) });
}
const recap = (draft: SessionDraft) => Object.fromEntries(opened(draft).movements.map((movement) => [movement.exercise.id, movement.values.volumes ?? []]));

/** Récapitulatif modifié (`edit`) puis enregistré, brouillon remis en règle comme par le fournisseur du brouillon. */
function saveRecap(draft: SessionDraft, edit: (movements: readonly ModelMovement[], answers: ModelAnswers) => { movements: readonly ModelMovement[]; answers?: ModelAnswers }): SessionDraft {
  const state = opened(draft);
  const next = edit(state.movements, state.answers);
  const answers = next.answers ?? state.answers;
  const edited = { ...state, answers, movements: adaptMovementsToAnswers("FOR_TIME", answers, next.movements) };
  return withForTimeSeries(applyModelReedit(draft, "f", state, edited, () => "x"));
}
const withVolumes = (id: string, volumes: readonly (number | null)[]) => (movements: readonly ModelMovement[]) => ({
  movements: movements.map((movement) => (movement.exercise.id === id ? { ...movement, values: { ...movement.values, volumes } } : movement)),
});

describe("correction 1 — exercice en tour, une valeur par tour", () => {
  it("(a) For time de 3 tours, exercice en tour à 10 répétitions : 3 valeurs enregistrées (questionnaire, ajout en tour, modale « Identiques »)", () => {
    // Questionnaire : 10 saisi pour les 3 tours.
    const answers: ModelAnswers = { ...initialAnswers("FOR_TIME"), roundCount: 3 };
    const movement = (id: string): ModelMovement => ({ exercise: exercise(id, repetitionParameters(10, 1, 0)), values: { mode: "REPETITIONS", volumes: [10, 10, 10], loads: [], seriesKind: "UNIFORM" } });
    const built = buildModelElements("FOR_TIME", answers, [movement("a"), movement("b")], () => "x");
    const members = built[0]!.kind === "CIRCUIT" ? built[0]!.circuit.exercises : [];
    expect(members.map((item) => [item.executionParameters.series.kind, targets({ exercises: members }, item.id)])).toEqual([
      ["VARIABLE", [10, 10, 10]],
      ["VARIABLE", [10, 10, 10]],
    ]);
    // Ajout en tour (FT-8).
    const entered = enterCarrier(exercise("n", repetitionParameters(10, 1, 0)), { nature: "SERIES", repeatCount: 3, format: CIRCUIT_FORMAT });
    expect([entered.executionParameters.series.kind, targets({ exercises: [entered] }, "n")]).toEqual(["VARIABLE", [10, 10, 10]]);
    // Modale de la Composition, raccourci « Identiques » (10 × 3) : enregistré tour par tour.
    const draft = forTime([exercise("a", repetitionParameters(20, 3, 0), TOUR), exercise("b", repetitionParameters(5, 3, 0), TOUR)]);
    const applied = withForTimeSeries({ ...draft, exercises: draft.exercises.map((item) => (item.id === "a" ? { ...item, executionParameters: repetitionParameters(10, 3, 0) } : item)) });
    expect([kindOf(applied, "a"), targets(applied, "a")]).toEqual(["VARIABLE", [10, 10, 10]]);
  });

  it("(b) tours 2 et 3 modifiés au récapitulatif : composition, puis récapitulatif rouvert, mêmes valeurs — y compris après enregistrement de la séance", () => {
    const draft = withForTimeSeries(forTime([exercise("a", repetitionParameters(10, 3, 0), TOUR), exercise("b", repetitionParameters(5, 3, 0), TOUR)]));
    const saved = saveRecap(draft, withVolumes("a", [10, 12, 14]));
    expect(targets(saved, "a")).toEqual([10, 12, 14]);
    expect(recap(saved)).toEqual({ a: [10, 12, 14], b: [5, 5, 5] });
    // Inversement : une modification faite dans la Composition apparaît dans le récapitulatif.
    const composed = withForTimeSeries({ ...saved, exercises: saved.exercises.map((item) => (item.id === "b" ? { ...item, executionParameters: variableParameters({ mode: "REPETITIONS", rows: [[5, 0], [6, 0], [7, 0]] }) } : item)) });
    expect(recap(composed).b).toEqual([5, 6, 7]);
    // Séance enregistrée puis rouverte.
    const input = toStructuredSessionInput({ ...composed, name: "Séance" }, () => "id");
    if (!input.ok) throw new Error(JSON.stringify(input.violations));
    const [circuit] = structureCircuits(input.value.structure);
    const reread = toSessionDraft(
      stored({
        elements: [{ kind: "CIRCUIT", circuit: { ...circuit!, exercises: circuit!.exercises.map((item) => activity(item.id, item.executionParameters, item.format!)) } }],
        stopPoints: [],
      }),
    );
    expect(recap(reread)).toEqual({ a: [10, 12, 14], b: [5, 6, 7] });
  });

  // Recette du 15/11/2026 (Hermann, ft-i6 : « La dernière valeur ne doit pas être reprise » ; h1 : « les valeurs des Nouvelles séries doivent être entrée manuellement ») : séries ajoutées à renseigner. [Dernière valeur reprise (FT-7, FT-10) — remplacé.]
  it("(c) 3 → 4 tours puis 4 → 2 : valeurs gardées, série ajoutée à renseigner ; dernières séries retirées", () => {
    const draft = withForTimeSeries(forTime([exercise("a", variableParameters({ mode: "REPETITIONS", rows: [[21, 0], [15, 0], [9, 0]] }), TOUR), exercise("b", repetitionParameters(10, 3, 0), TOUR)]));
    const four = withForTimeSeries(setLayoutCircuitCount(draft, "f", 4));
    expect([targets(four, "a"), targets(four, "b"), kindOf(four, "b")]).toEqual([[21, 15, 9, "UNSET"], [10, 10, 10, "UNSET"], "VARIABLE"]);
    const two = withForTimeSeries(setLayoutCircuitCount(four, "f", 2));
    expect([targets(two, "a"), targets(two, "b")]).toEqual([[21, 15], [10, 10]]);
    // Même règle au questionnaire du récapitulatif.
    const viaRecap = saveRecap(draft, (movements, answers) => ({ movements, answers: { ...answers, roundCount: 4 } }));
    expect([targets(viaRecap, "a"), targets(viaRecap, "b")]).toEqual([[21, 15, 9, "UNSET"], [10, 10, 10, "UNSET"]]);
  });

  it("(d) exercice existant « identique + une valeur » : converti à la lecture en N valeurs égales (N = nombre de tours)", () => {
    const legacyTour = activity("a", repetitionParameters(10, 1, 0), TOUR);
    const session = stored({
      elements: [
        {
          kind: "CIRCUIT",
          circuit: { id: "f", nature: "SERIES", repeatCount: 3, format: CIRCUIT_FORMAT, exercises: [activity("in", repetitionParameters(50, 1, 0), BUY_IN), legacyTour, activity("b", repetitionParameters(12, 3, 0), TOUR)] },
        },
      ],
      stopPoints: [],
    });
    const draft = toSessionDraft(session);
    expect([kindOf(draft, "a"), targets(draft, "a")]).toEqual(["VARIABLE", [10, 10, 10]]);
    expect([kindOf(draft, "b"), targets(draft, "b")]).toEqual(["VARIABLE", [12, 12, 12]]);
    // Buy-in inchangé.
    expect([kindOf(draft, "in"), targets(draft, "in")]).toEqual(["UNIFORM", [50]]);
    // Lecture stable : relire ne change plus rien.
    expect(withForTimeSeries(draft)).toBe(draft);
  });
});

describe("correction 2 — nombre de séries du buy-in et du buy-out", () => {
  const answers: ModelAnswers = { ...initialAnswers("FOR_TIME"), roundCount: 3, buyIn: true, buyInSeriesCount: 2, buyOut: true, buyOutSeriesCount: 3 };
  const movement = (id: string, volumes: readonly number[], role?: "buyIn" | "buyOut"): ModelMovement => ({
    exercise: exercise(id, repetitionParameters(1, 1, 0)),
    values: { mode: "REPETITIONS", volumes, loads: [] },
    ...(role !== undefined ? { [role]: true as const } : {}),
  });

  function built(): SessionDraft {
    const elements = buildModelElements("FOR_TIME", answers, [movement("in1", [30, 40], "buyIn"), movement("in2", [5, 5], "buyIn"), movement("t", [21, 15, 9]), movement("t2", [10, 12, 14]), movement("out", [8, 6, 4], "buyOut")], () => "f");
    return withForTimeSeries({ ...createEmptyDraft(), exercises: elements[0]!.kind === "CIRCUIT" ? [...elements[0]!.circuit.exercises] : [], structure: { elements: elements.map((element) => (element.kind === "CIRCUIT" ? { ...element, circuit: { ...element.circuit, exercises: element.circuit.exercises.map((item) => item.id) } } : element)) as never, stopPoints: [] } });
  }

  it("(e) buy-in à 2 séries et buy-out à 3 : S1-S2 et S1-S3, valeurs modifiables et conservées ; nombre changé : séries ajoutées à renseigner, ou dernières séries retirées", () => {
    const draft = built();
    expect([targets(draft, "in1"), targets(draft, "in2"), targets(draft, "out")]).toEqual([[30, 40], [5, 5], [8, 6, 4]]);
    const state = opened(draft);
    expect([state.answers.buyInSeriesCount, state.answers.buyOutSeriesCount]).toEqual([2, 3]);
    // Valeur modifiée au récapitulatif, retrouvée à la réouverture.
    const edited = saveRecap(draft, withVolumes("in1", [30, 45]));
    expect(recap(edited).in1).toEqual([30, 45]);
    // Buy-in porté à 3 séries : S3 à renseigner pour chaque exercice ; buy-out ramené à 1 : dernières séries retirées.
    // Recette du 14/11/2026 (i6 : « S3 ne doit [pas] prendre la dernière valeur, Elle doit être rentrée manuellement »).
    // [Dernière valeur reprise — remplacé.]
    const resized = saveRecap(edited, (movements, current) => ({ movements, answers: { ...current, buyInSeriesCount: 3, buyOutSeriesCount: 1 } }));
    expect([targets(resized, "in1"), targets(resized, "in2"), targets(resized, "out"), targets(resized, "t")]).toEqual([[30, 45, "UNSET"], [5, 5, "UNSET"], [8], [21, 15, 9]]);
    expect(recap(resized)).toEqual({ in1: [30, 45, null], in2: [5, 5, null], t: [21, 15, 9], t2: [10, 12, 14], out: [8] });
  });

  // Recette du 14/11/2026 (m2, m3 : « Les exercices de buy in (et de buy out) sont indépendants »). [L'exercice qui rejoint un bloc
  // occupé en prend le nombre de séries, perte annoncée — remplacé.]
  it("(e) Composition : un exercice qui rejoint un bloc occupé garde ses séries ; rien de retiré, rien à annoncer", () => {
    const draft = built();
    const t = draft.exercises.find((item) => item.id === "t")!;
    expect(forTimeRoleChangeLoss(draft, "t", "BUY_IN", t.executionParameters)).toBe(0);
    const inBlock = withForTimeSeries(setMemberRole(draft, "t", "BUY_IN"));
    expect([targets(inBlock, "in1"), targets(inBlock, "in2"), targets(inBlock, "t")]).toEqual([[30, 40], [5, 5], [21, 15, 9]]);
    // Buy-out de 3 séries : « t2 » (10-12-14) les garde toutes.
    const t2 = inBlock.exercises.find((item) => item.id === "t2")!;
    expect(forTimeRoleChangeLoss(inBlock, "t2", "BUY_OUT", t2.executionParameters)).toBe(0);
  });

  it("(f) échange buy-in ↔ tour, dans les deux ordres : aucune valeur perdue en silence, aucune série sans objectif, vues identiques", () => {
    const scenario = () =>
      withForTimeSeries(
        forTime([
          exercise("in", repetitionParameters(50, 1, 0), BUY_IN),
          exercise("a", variableParameters({ mode: "REPETITIONS", rows: [[21, 0], [15, 0], [9, 0]] }), TOUR),
          exercise("b", repetitionParameters(12, 3, 0), TOUR),
        ]),
      );
    const noUnset = (draft: SessionDraft) => draft.exercises.every((item) => seriesRowsOf(item.executionParameters).every((row) => row.target.kind === "NUMBER"));
    // Ordre 1 : le buy-in passe d'abord en tour (bloc vidé), puis « a » passe en buy-in (bloc vide : séries conservées).
    const first = scenario();
    expect(forTimeRoleChangeLoss(first, "in", "TOUR", first.exercises[0]!.executionParameters)).toBe(0);
    const step = withForTimeSeries(setMemberRole(first, "in", "TOUR"));
    const a = step.exercises.find((item) => item.id === "a")!;
    expect(forTimeRoleChangeLoss(step, "a", "BUY_IN", a.executionParameters)).toBe(0);
    const swapped = withForTimeSeries(setMemberRole(step, "a", "BUY_IN"));
    // Recette du 15/11/2026 (Hermann, ft-i6 : « La dernière valeur ne doit pas être reprise » ; h1 : « les valeurs des Nouvelles séries doivent être entrée manuellement ») : séries ajoutées à renseigner. [Dernière valeur reprise (FT-7, FT-10) — remplacé.]
    expect([targets(swapped, "a"), targets(swapped, "in"), targets(swapped, "b")]).toEqual([[21, 15, 9], [50, "UNSET", "UNSET"], [12, 12, 12]]);
    expect(noUnset(swapped)).toBe(false);
    expect(recap(swapped)).toEqual({ a: [21, 15, 9], in: [50, null, null], b: [12, 12, 12] });
    expect(opened(swapped).answers.buyInSeriesCount).toBe(3);
    // Ordre 2 : « a » rejoint d'abord le bloc buy-in occupé (1 série) : il garde ses 3 valeurs (recette du 14/11/2026, m2 et m3 ;
    // [perte de 2 valeurs annoncée, bloc à 1 série — remplacé]).
    const second = scenario();
    expect(forTimeRoleChangeLoss(second, "a", "BUY_IN", second.exercises[1]!.executionParameters)).toBe(0);
    const joined = withForTimeSeries(setMemberRole(second, "a", "BUY_IN"));
    expect([targets(joined, "in"), targets(joined, "a")]).toEqual([[50], [21, 15, 9]]);
    const back = withForTimeSeries(setMemberRole(joined, "in", "TOUR"));
    expect(targets(back, "in")).toEqual([50, "UNSET", "UNSET"]);
    expect(recap(back)).toEqual(Object.fromEntries(back.exercises.map((item) => [item.id, targets(back, item.id).map((value) => (value === "UNSET" ? null : value))])));
  });
});

function activity(id: string, parameters: ExecutionParametersInput, format: ElementFormat): Activity {
  return {
    id,
    type: "EXERCISE",
    structuralPosition: "IN_TOUR",
    position: 0,
    name: id,
    executionParameters: parameters as Activity["executionParameters"],
    postActivityRecoverySeconds: 0,
    instruction: null,
    bodyZoneIds: [],
    sideMode: "UNILATERAL",
    sourceMovementId: `mv-${id}`,
    format,
  };
}

function stored(structure: SessionStructure<Activity>): StructuredSession {
  return {
    id: "s1",
    ownerId: "u1",
    name: "Séance",
    color: "#9AA4B2" as StructuredSession["color"],
    labelId: null,
    status: "ACTIVE",
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    createdAt: "2026-11-14T00:00:00.000Z",
    updatedAt: "2026-11-14T00:00:00.000Z",
    structure,
  } as StructuredSession;
}
