import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { seriesCountOf, seriesRowsOf } from "@/domain/activities/ExecutionParameters";
import { configurationValidity } from "@/domain/sessions/configurationValidity";
import {
  adaptMovementsToAnswers,
  appendModelToDraft,
  buildModelElements,
  executionOptions,
  initialAnswers,
  initialMovementValues,
  modelDuration,
  withAnswer,
  type FormatModelKey,
  type ModelAnswers,
  type ModelMovement,
} from "@/domain/sessions/formatModels";
import { modelTimeline } from "@/domain/sessions/formatTimeline";
import { createEmptyDraft, toStructuredSessionInput, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits, type StructureElement } from "@/domain/sessions/structure";

/**
 * PRE-9 C.3 / C.4 (référence Formats du 02/11/2026 §1, §2, §7, §9 à §12, §15 ; CE-FMT-02 critères
 * d'acceptation) — questionnaires, valeurs par mouvement, structure ajoutée au brouillon.
 */

const base = (id: string, parameters = repetitionParameters(10, 3, 45)): SessionDraftExercise => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  name: `Mouvement ${id}`,
  executionParameters: parameters,
  postActivityRecoverySeconds: 90,
  instruction: null,
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  sourceMovementId: `mv-${id}`,
});

const movementsOf = (key: FormatModelKey, answers: ModelAnswers, ids: readonly string[], parameters?: Parameters<typeof base>[1]): ModelMovement[] =>
  ids.map((id) => {
    const exercise = base(id, parameters);
    return { exercise, values: initialMovementValues(key, answers, exercise) };
  });

let next = 0;
const newId = () => `c${++next}`;
const build = (key: FormatModelKey, answers: ModelAnswers, movements: readonly ModelMovement[]) => buildModelElements(key, answers, movements, newId);
const seconds = (elements: readonly StructureElement<SessionDraftExercise>[]) => modelDuration(elements)?.seconds;

describe("valeurs initiales décidées (aucune valeur de maquette)", () => {
  it("Tabata 8 × 20 s / 10 s ; 30/30 6 × 30/30 ; EMOM 6 × 1 min ; AMRAP 12 min, 1 bloc, repos de boucle 0 s ; For time 3 tours sans limite ; Death by 1 min, 1, +1", () => {
    expect(initialAnswers("TABATA")).toMatchObject({ seriesCount: 8, workSeconds: 20, pauseSeconds: 10 });
    expect(initialAnswers("INTERVALS_30_30")).toMatchObject({ seriesCount: 6, workSeconds: 30, pauseSeconds: 30 });
    expect(initialAnswers("EMOM")).toMatchObject({ seriesCount: 6, intervalSeconds: 60, execution: "EACH_INTERVAL" });
    expect(initialAnswers("AMRAP")).toMatchObject({ durationSeconds: 720, blockCount: 1, restBetweenBlocksSeconds: 120, loopRestSeconds: 0, buyIn: false, increasingVolume: false });
    // MAJ 04/11 §6 quater bis : « Avec charge » désactivé par défaut.
    expect(initialAnswers("FOR_TIME")).toEqual({ roundCount: 3, timeCapSeconds: null, restBetweenRoundsSeconds: 0, withLoad: false });
    expect(initialAnswers("DEATH_BY")).toMatchObject({ intervalSeconds: 60, startRepetitions: 1, increment: 1 });
    expect(initialAnswers("STRENGTH")).toMatchObject({ seriesCount: 3, repetitions: 15 });
    expect(initialAnswers("PROGRESSION")).not.toHaveProperty("repetitions");
    expect(executionOptions("FOR_TIME")).toEqual([]);
    expect(executionOptions("EMOM")).toEqual(["EACH_INTERVAL", "SEQUENCE", "ALTERNATED"]);
  });

  it("temps limite For time : sous le minimum, « Sans limite » (null) ; bornes de saisie conservées", () => {
    expect(withAnswer(initialAnswers("FOR_TIME"), "timeCapSeconds", null).timeCapSeconds).toBeNull();
    expect(withAnswer(initialAnswers("STRENGTH"), "seriesCount", 0).seriesCount).toBe(1);
  });
});

describe("Tabata et 30/30 : Exercices standards (§9, FMT-10 à FMT-13)", () => {
  const answers = initialAnswers("TABATA");

  it("un mouvement : 1 Exercice standard, 4 min, sans Format", () => {
    const elements = build("TABATA", answers, movementsOf("TABATA", answers, ["a"]));
    expect(elements).toHaveLength(1);
    const exercise = elements[0]!.kind === "EXERCISE" ? elements[0]!.exercise : null;
    expect(exercise).not.toHaveProperty("format");
    expect(exercise!.executionParameters.mode).toBe("DURATION");
    expect(seriesCountOf(exercise!.executionParameters)).toBe(8);
    expect(seconds(elements)).toBe(240);
  });

  it("À la suite : Circuit standard « groupées » à 1 tour (MAJ 04/11 §6 ter), récupération entre les mouvements (1 min) sur le premier : 8 min 50 s (A1) ; en alternance : Circuit standard 8 tours alternés, 8 min", () => {
    const sequence = build("TABATA", answers, movementsOf("TABATA", answers, ["a", "b"]));
    expect(sequence.map((element) => element.kind)).toEqual(["CIRCUIT"]);
    const grouped = sequence[0]!.kind === "CIRCUIT" ? sequence[0]!.circuit : null;
    expect(grouped).toMatchObject({ nature: "TOURS", repeatCount: 1, originModel: "TABATA" });
    expect(grouped).not.toHaveProperty("format");
    expect(grouped!.exercises.map((exercise) => exercise.postActivityRecoverySeconds)).toEqual([60, 0]);
    expect(seconds(sequence)).toBe(530);
    const alternated = build("TABATA", { ...answers, execution: "ALTERNATED" }, movementsOf("TABATA", answers, ["a", "b"]));
    expect(alternated).toHaveLength(1);
    const circuit = alternated[0]!.kind === "CIRCUIT" ? alternated[0]!.circuit : null;
    expect(circuit).toMatchObject({ nature: "SERIES", repeatCount: 8 });
    expect(circuit).not.toHaveProperty("format");
    expect(seconds(alternated)).toBe(480);
  });

  it("valeurs modifiables : 4 séries en alternance → Circuit de 4 tours (aucun verrouillage N = 8)", () => {
    const changed = { ...withAnswer(answers, "seriesCount", 4), execution: "ALTERNATED" as const };
    const [element] = build("TABATA", changed, movementsOf("TABATA", changed, ["a", "b"]));
    expect(element!.kind === "CIRCUIT" && element!.circuit.repeatCount).toBe(4);
  });
});

describe("EMOM (§10, FMT-21) : 2 mouvements, 6 séries, 1 min", () => {
  const answers = initialAnswers("EMOM");
  const two = () => movementsOf("EMOM", answers, ["a", "b"]);

  it("dans chaque intervalle : Circuit porteur EMOM, 6 tours groupés, durée de chaque tour 1 min ; membres sans Séries ni Intervalle : 6 min", () => {
    const [element] = build("EMOM", answers, two());
    const circuit = element!.kind === "CIRCUIT" ? element!.circuit : null;
    expect(circuit).toMatchObject({ nature: "TOURS", repeatCount: 6, format: { key: "EMOM", settings: { windowSeconds: 60 } } });
    expect(circuit!.exercises.map((exercise) => [seriesCountOf(exercise.executionParameters), exercise.format])).toEqual([
      [1, { key: "EMOM", settings: {} }],
      [1, { key: "EMOM", settings: {} }],
    ]);
    expect(seconds([element!])).toBe(360);
  });

  it("à la suite : 2 Exercices EMOM, récupération 1 min sur le premier : 13 min ; en alternance : Circuit standard 6 tours : 12 min", () => {
    expect(seconds(build("EMOM", { ...answers, execution: "SEQUENCE" }, two()))).toBe(780);
    const alternated = build("EMOM", { ...answers, execution: "ALTERNATED" }, two());
    expect(alternated[0]!.kind === "CIRCUIT" && alternated[0]!.circuit).toMatchObject({ nature: "SERIES", repeatCount: 6 });
    expect(alternated[0]!.kind === "CIRCUIT" && alternated[0]!.circuit).not.toHaveProperty("format");
    expect(seconds(alternated)).toBe(720);
  });
});

describe("AMRAP (§1, §2, §2.1, §2.2)", () => {
  const answers = initialAnswers("AMRAP");

  it("un mouvement, un bloc, sans repos de boucle : Exercice autonome AMRAP, Durée 12 min", () => {
    const [element] = build("AMRAP", answers, movementsOf("AMRAP", answers, ["a"]));
    expect(element!.kind === "EXERCISE" && element!.exercise.format).toEqual({ key: "AMRAP", settings: { durationSeconds: 720, incrementPerRound: 0 } });
  });

  it("un mouvement avec repos après chaque tour > 0 : Circuit d'un membre, récupération du membre = repos de boucle (A3)", () => {
    const changed = withAnswer(answers, "loopRestSeconds", 30);
    const [element] = build("AMRAP", changed, movementsOf("AMRAP", changed, ["a"]));
    const circuit = element!.kind === "CIRCUIT" ? element!.circuit : null;
    expect(circuit).toMatchObject({ nature: "TOURS", repeatCount: 1, format: { key: "AMRAP" } });
    expect(circuit!.exercises[0]!.postActivityRecoverySeconds).toBe(30);
  });

  it("3 blocs de 12 min, repos 2 min : 40 min ; buy-in en premier, une fois, récupération 0 s ; repos de boucle sur le dernier membre seulement", () => {
    const changed: ModelAnswers = { ...withAnswer(answers, "blockCount", 3), buyIn: true, loopRestSeconds: 30 };
    const movements = movementsOf("AMRAP", changed, ["in", "a", "b"]).map((item, index) => (index === 0 ? { ...item, buyIn: true as const } : item));
    const [element] = build("AMRAP", changed, movements);
    const circuit = element!.kind === "CIRCUIT" ? element!.circuit : null;
    expect(circuit).toMatchObject({ repeatCount: 3, format: { key: "AMRAP", settings: { blockSeconds: 720, restBetweenBlocksSeconds: 120 } } });
    // MAJ 04/11 §6 bis 2 : Rôle dans le circuit (1 = Buy-in), qui remplace le Passage « Une fois ».
    expect(circuit!.exercises.map((exercise) => [exercise.format?.settings.circuitRole ?? 0, exercise.postActivityRecoverySeconds])).toEqual([
      [1, 0],
      [0, 0],
      [0, 30],
    ]);
    expect(seconds([element!])).toBe(2400);
    expect(configurationValidity({ elements: [element!], stopPoints: [] }).status).toBe("valid");
  });

  it("recette n° 3 du 03/11 : Buy-in activé sans mouvement de buy-in choisi — aucun mouvement de boucle n'est pris pour le buy-in", () => {
    const changed: ModelAnswers = { ...answers, buyIn: true };
    const [element] = build("AMRAP", changed, movementsOf("AMRAP", changed, ["a", "b"]));
    const circuit = element!.kind === "CIRCUIT" ? element!.circuit : null;
    expect(circuit!.exercises.map((exercise) => exercise.format?.settings.passageOnce ?? 0)).toEqual([0, 0]);
  });

  it("Max : condition À l'échec, incrément masqué (0) ; Volume croissant : incrément par tour du membre", () => {
    const changed: ModelAnswers = { ...answers, increasingVolume: true };
    const movements = movementsOf("AMRAP", changed, ["a", "b"]).map((item, index) => ({
      ...item,
      values: index === 0 ? { ...item.values, increment: 2 } : { ...item.values, max: true, increment: 3 },
    }));
    const [element] = build("AMRAP", changed, movements);
    const [first, second] = element!.kind === "CIRCUIT" ? element!.circuit.exercises : [];
    expect(first!.format?.settings.incrementPerRound).toBe(2);
    expect(second!.format?.settings.incrementPerRound).toBe(0);
    expect(seriesRowsOf(second!.executionParameters)[0]!.target).toEqual({ kind: "FAILURE" });
  });
});

describe("For time (§11, A6)", () => {
  const answers = initialAnswers("FOR_TIME");

  it("plusieurs mouvements : Circuit porteur alterné, N tours, séries variables 21-15-9 ; temps mesuré (≥)", () => {
    const [element] = build("FOR_TIME", answers, movementsOf("FOR_TIME", answers, ["a", "b"]));
    const circuit = element!.kind === "CIRCUIT" ? element!.circuit : null;
    expect(circuit).toMatchObject({ nature: "SERIES", repeatCount: 3, format: { key: "FOR_TIME", settings: { restBetweenRoundsSeconds: 0 } } });
    expect(seriesRowsOf(circuit!.exercises[0]!.executionParameters).map((row) => row.target)).toEqual([21, 15, 9].map((value) => ({ kind: "NUMBER", value })));
    expect(modelDuration([element!])?.kind).toBe("lowerBound");
    expect(modelTimeline("FOR_TIME", answers, movementsOf("FOR_TIME", answers, ["a", "b"])).end).toEqual({ kind: "MEASURED" });
  });

  it("N passé à 4 : 21-15-9-« à compléter » ; à 2 : 21-15 — sans copie, extrapolation ni confirmation", () => {
    const movements = movementsOf("FOR_TIME", answers, ["a"]);
    const four = adaptMovementsToAnswers("FOR_TIME", withAnswer(answers, "roundCount", 4), movements);
    expect(four[0]!.values.volumes).toEqual([21, 15, 9, null]);
    const [element] = build("FOR_TIME", withAnswer(answers, "roundCount", 4), four);
    expect(element!.kind === "EXERCISE" && seriesRowsOf(element!.exercise.executionParameters).at(-1)!.target).toEqual({ kind: "UNSET" });
    // Contre-recette n° 3 ter du 03/11/2026 (f3-fortime) : à 2, la valeur du tour 3 reste en réserve (non construite) ;
    // repasser à 3 la retrouve.
    const two = adaptMovementsToAnswers("FOR_TIME", withAnswer(answers, "roundCount", 2), movements);
    expect(two[0]!.values.volumes).toEqual([21, 15, 9]);
    const [built] = build("FOR_TIME", withAnswer(answers, "roundCount", 2), two);
    expect(built!.kind === "EXERCISE" && seriesRowsOf(built!.exercise.executionParameters).map((row) => row.target)).toEqual([
      { kind: "NUMBER", value: 21 },
      { kind: "NUMBER", value: 15 },
    ]);
    expect(adaptMovementsToAnswers("FOR_TIME", withAnswer(answers, "roundCount", 3), two)[0]!.values.volumes).toEqual([21, 15, 9]);
  });
});

describe("Death by (§12, A2)", () => {
  const answers = initialAnswers("DEATH_BY");

  it("un mouvement : Exercice autonome (intervalle, incrément), départ 1 répétition ; Déroulé « jusqu'à l'échec »", () => {
    const [element] = build("DEATH_BY", answers, movementsOf("DEATH_BY", answers, ["a"]));
    expect(element!.kind === "EXERCISE" && element!.exercise.format).toEqual({ key: "DEATH_BY", settings: { intervalSeconds: 60, incrementPerRound: 1 } });
    expect(modelTimeline("DEATH_BY", answers, []).end).toEqual({ kind: "UNTIL_FAILURE" });
  });

  it("en alternance : Circuit porteur alterné sans durée, intervalle propre à chaque membre ; dans chaque intervalle : Circuit groupé, intervalle commun", () => {
    const alternated = build("DEATH_BY", { ...answers, execution: "ALTERNATED" }, movementsOf("DEATH_BY", answers, ["a", "b"]));
    const circuit = alternated[0]!.kind === "CIRCUIT" ? alternated[0]!.circuit : null;
    expect(circuit).toMatchObject({ nature: "SERIES", format: { key: "DEATH_BY", settings: {} } });
    expect(circuit!.exercises[0]!.format).toEqual({ key: "DEATH_BY", settings: { incrementPerRound: 1, intervalSeconds: 60 } });
    const grouped = build("DEATH_BY", { ...answers, execution: "EACH_INTERVAL" }, movementsOf("DEATH_BY", answers, ["a", "b"]));
    expect(grouped[0]!.kind === "CIRCUIT" && grouped[0]!.circuit).toMatchObject({ nature: "TOURS", format: { key: "DEATH_BY", settings: { windowSeconds: 60 } } });
    for (const elements of [alternated, grouped]) expect(configurationValidity({ elements, stopPoints: [] }).status).toBe("valid");
  });
});

describe("départs rapides (§9.2, §9.3)", () => {
  it("Renforcement 3 × 15 ; À l'échec 3 séries à l'échec ; pause et récupération du Profil (aucune valeur de maquette)", () => {
    const strength = build("STRENGTH", initialAnswers("STRENGTH"), movementsOf("STRENGTH", initialAnswers("STRENGTH"), ["a"]));
    const exercise = strength[0]!.kind === "EXERCISE" ? strength[0]!.exercise : null;
    expect(seriesRowsOf(exercise!.executionParameters).map((row) => [row.target, row.pauseSeconds])).toEqual(
      Array.from({ length: 3 }, () => [{ kind: "NUMBER", value: 15 }, 45]),
    );
    expect(exercise!.postActivityRecoverySeconds).toBe(90);
    const failure = build("UNTIL_FAILURE", initialAnswers("UNTIL_FAILURE"), movementsOf("UNTIL_FAILURE", initialAnswers("UNTIL_FAILURE"), ["a"]));
    expect(failure[0]!.kind === "EXERCISE" && seriesRowsOf(failure[0]!.exercise.executionParameters).every((row) => row.target.kind === "FAILURE")).toBe(true);
  });

  it("Superset : deux mouvements choisis, Circuit standard groupé d'un passage, répétitions à compléter (A4)", () => {
    const [element] = build("SUPERSET", initialAnswers("SUPERSET"), movementsOf("SUPERSET", initialAnswers("SUPERSET"), ["a", "b"]));
    const circuit = element!.kind === "CIRCUIT" ? element!.circuit : null;
    expect(circuit).toMatchObject({ nature: "TOURS", repeatCount: 1 });
    expect(circuit).not.toHaveProperty("format");
    expect(circuit!.exercises.every((exercise) => seriesRowsOf(exercise.executionParameters)[0]!.target.kind === "UNSET")).toBe(true);
  });

  it("Progression : 10/12/14 par mouvement ; charge par série seulement avec « Avec charge » (MAJ 04/11 §6 quater) ; N 3→4 : colonne à compléter, 3→2 : dernière retirée", () => {
    const answers = initialAnswers("PROGRESSION");
    const withLoad = { ...base("l"), executionParameters: { ...repetitionParameters(10, 3, 45), loadEnabled: true } };
    const movements: ModelMovement[] = [
      { exercise: base("a"), values: initialMovementValues("PROGRESSION", answers, base("a")) },
      { exercise: withLoad, values: initialMovementValues("PROGRESSION", answers, withLoad) },
    ];
    expect(movements[0]!.values.cells).toEqual([10, 12, 14].map((repetitions) => ({ repetitions, loadKg: null })));
    // Aucune charge initiale inventée : la case vide est une série sans charge.
    expect(movements[1]!.values.cells!.every((cell) => cell.loadKg === null)).toBe(true);
    const four = adaptMovementsToAnswers("PROGRESSION", withAnswer(answers, "seriesCount", 4), movements);
    expect(four[0]!.values.cells).toEqual([...[10, 12, 14].map((repetitions) => ({ repetitions, loadKg: null })), { repetitions: null, loadKg: null }]);
    // Contre-recette n° 3 ter (f3-fortime) : la série 3 reste en réserve à N = 2.
    expect(adaptMovementsToAnswers("PROGRESSION", withAnswer(answers, "seriesCount", 2), movements)[0]!.values.cells).toHaveLength(3);
    const [element] = build("PROGRESSION", withAnswer(answers, "seriesCount", 4), four);
    // MAJ 04/11 §6 ter : deux Exercices, Circuit standard groupé à 1 tour.
    const first = element!.kind === "CIRCUIT" ? element!.circuit.exercises[0]! : null;
    expect(seriesRowsOf(first!.executionParameters).map((row) => row.target.kind)).toEqual(["NUMBER", "NUMBER", "NUMBER", "UNSET"]);
    expect(element!.kind === "CIRCUIT" && element!.circuit.exercises[1]!.executionParameters.loadEnabled).toBe(false);
  });
});

describe("Enregistrer dans la séance (C.4) : ajout au brouillon, Composition multi-conteneurs conservée", () => {
  it("la structure rejoint la fin du brouillon ; un Exercice existant reste en tête ; la Séance se valide comme structure générale", () => {
    const existing = base("x", durationParameters(30));
    const draft = { ...createEmptyDraft(), name: "Séance", exercises: [existing] };
    const answers: ModelAnswers = { ...initialAnswers("AMRAP"), blockCount: 2 };
    const elements = build("AMRAP", answers, movementsOf("AMRAP", answers, ["a", "b"]));
    const appended = appendModelToDraft(draft, elements, newId);
    expect(appended.exercises.map((exercise) => exercise.id)).toEqual(["x", "a", "b"]);
    expect(appended.structure!.elements.map((element) => element.kind)).toEqual(["EXERCISE", "CIRCUIT"]);
    expect(structureCircuits(appended.structure!)[0]!.format?.key).toBe("AMRAP");
    const input = toStructuredSessionInput(appended, newId);
    if (!input.ok) throw new Error(JSON.stringify(input.violations));
    expect(structureCircuits(input.value.structure)[0]).toMatchObject({ repeatCount: 2, nature: "TOURS", format: { key: "AMRAP" } });
  });

  it("aucun mouvement : rien n'est ajouté (B10 différé)", () => {
    const draft = createEmptyDraft();
    expect(appendModelToDraft(draft, build("TABATA", initialAnswers("TABATA"), []), newId)).toBe(draft);
  });

  it("recette n° 3 (f3-questionnaire) : une identité d'Exercice déjà présente est remplacée — jamais deux occurrences de même identité", () => {
    const answers = { ...initialAnswers("TABATA"), execution: "ALTERNATED" as const };
    const once = appendModelToDraft(createEmptyDraft(), build("TABATA", answers, movementsOf("TABATA", answers, ["a", "b"])), newId);
    const twice = appendModelToDraft(once, build("TABATA", answers, movementsOf("TABATA", answers, ["a", "b"])), newId);
    const ids = twice.exercises.map((exercise) => exercise.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    const circuits = structureCircuits(twice.structure!);
    expect(circuits.flatMap((circuit) => circuit.exercises).sort()).toEqual([...ids].sort());
  });
});
