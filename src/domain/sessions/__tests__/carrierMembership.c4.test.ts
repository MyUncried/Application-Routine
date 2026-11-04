import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { seriesCountOf, seriesRowsOf } from "@/domain/activities/ExecutionParameters";
import { enterCarrier, exitCarrier, exitNeedsChoice } from "@/domain/sessions/carrierMembership";
import type { ElementFormat } from "@/domain/sessions/formats";
import { duplicateLayoutExercise, moveLayoutItem } from "@/domain/sessions/layoutMoves";
import { applyLayoutNatureChange, setLayoutCircuitCount, setLayoutCircuitFormatSetting } from "@/domain/sessions/layoutOperations";
import { createEmptyDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits, type StructureElement } from "@/domain/sessions/structure";

/**
 * PRE-9 C.4 (référence Formats du 02/11/2026 §6, §11, §13 ; CE-FMT-03) — entrée dans un Circuit porteur
 * (paramètres compatibles repris, le reste à compléter, aucune conversion ni confirmation), sortie
 * (Conserver le format / Adopter un format libre / Annuler), buy-in et buy-out, adaptation du For time à N.
 */

const exercise = (id: string, parameters = repetitionParameters(12, 3, 30), format?: ElementFormat): SessionDraftExercise => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  name: `Mouvement ${id}`,
  executionParameters: parameters,
  postActivityRecoverySeconds: 45,
  instruction: null,
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  sourceMovementId: `mv-${id}`,
  ...(format !== undefined ? { format } : {}),
});

const AMRAP_CIRCUIT = { nature: "TOURS" as const, repeatCount: 3, format: { key: "AMRAP" as const, settings: { blockSeconds: 600, restBetweenBlocksSeconds: 120 } } };
const FOR_TIME_CIRCUIT = { nature: "SERIES" as const, repeatCount: 3, format: { key: "FOR_TIME" as const, settings: { restBetweenRoundsSeconds: 0, timeCapSeconds: 900 } } };
const DEATH_BY_ALTERNATED = { nature: "SERIES" as const, repeatCount: 1, format: { key: "DEATH_BY" as const, settings: {} } };

describe("entrée dans un Circuit porteur (§6 point 1)", () => {
  it("AMRAP : cible commune reprise par passage, séries retirées, incrément 0 ; Mode Durée conservé", () => {
    const entered = enterCarrier(exercise("a"), AMRAP_CIRCUIT);
    expect(entered.format).toEqual({ key: "AMRAP", settings: { incrementPerRound: 0 } });
    expect(seriesCountOf(entered.executionParameters)).toBe(1);
    expect(seriesRowsOf(entered.executionParameters)[0]!.target).toEqual({ kind: "NUMBER", value: 12 });
    const timed = enterCarrier(exercise("d", durationParameters(30, 2)), AMRAP_CIRCUIT);
    expect(timed.executionParameters.mode).toBe("DURATION");
  });

  it("cibles différentes ou mélange chiffré/échec : à compléter — ni somme, ni moyenne, ni choix d'une série", () => {
    const mixed = enterCarrier(exercise("v", variableParameters({ mode: "REPETITIONS", rows: [[10, 0], [12, 0], [14, 0]] })), AMRAP_CIRCUIT);
    expect(seriesRowsOf(mixed.executionParameters)[0]!.target).toEqual({ kind: "UNSET" });
  });

  // [« Répétitions » imposé au membre For time — remplacé le 04/11/2026 (MAJ §6 bis 2) : Répétitions ou Durée, Mode conservé.]
  it("For time : une série par tour, récupération 0 s ; une Durée reste en Durée, jamais convertie en répétitions", () => {
    const entered = enterCarrier(exercise("a"), FOR_TIME_CIRCUIT);
    expect(seriesRowsOf(entered.executionParameters).map((row) => row.target)).toEqual(Array.from({ length: 3 }, () => ({ kind: "NUMBER", value: 12 })));
    expect(entered.postActivityRecoverySeconds).toBe(0);
    const timed = enterCarrier(exercise("d", durationParameters(30)), FOR_TIME_CIRCUIT);
    expect(timed.executionParameters.mode).toBe("DURATION");
    expect(seriesRowsOf(timed.executionParameters).every((row) => row.target.kind === "NUMBER" && row.target.value === 30)).toBe(true);
  });

  it("Death by alterné : départ repris, incrément ≥ 1, intervalle propre au membre (A2) ; un Format d'une autre clé est remplacé, jamais imbriqué", () => {
    const emom = exercise("e", repetitionParameters(10, 6), { key: "EMOM", settings: { intervalSeconds: 90 } });
    const entered = enterCarrier(emom, DEATH_BY_ALTERNATED);
    // L'Intervalle est le même champ en EMOM et en Death by (§14) : paramètre compatible, repris.
    expect(entered.format).toEqual({ key: "DEATH_BY", settings: { incrementPerRound: 1, intervalSeconds: 90 } });
    expect(seriesRowsOf(entered.executionParameters)).toHaveLength(1);
  });
});

describe("sortie d'un Circuit porteur (§13)", () => {
  const member = enterCarrier(exercise("a"), AMRAP_CIRCUIT);

  it("Conserver le format AMRAP : AMRAP simple, durée d'un bloc reprise, Répétitions ; Adopter un format libre : Exercice standard", () => {
    expect(exitCarrier(member, AMRAP_CIRCUIT, "KEEP").format).toEqual({ key: "AMRAP", settings: { durationSeconds: 600, incrementPerRound: 0 } });
    const free = exitCarrier(member, AMRAP_CIRCUIT, "FREE");
    expect(free).not.toHaveProperty("format");
    expect(seriesRowsOf(free.executionParameters)[0]!.target).toEqual({ kind: "NUMBER", value: 12 });
  });

  it("membre AMRAP en Durée : aucune durée convertie, objectif de répétitions à renseigner", () => {
    const timed = enterCarrier(exercise("d", durationParameters(30)), AMRAP_CIRCUIT);
    const kept = exitCarrier(timed, AMRAP_CIRCUIT, "KEEP");
    expect(kept.executionParameters.mode).toBe("REPETITIONS");
    expect(seriesRowsOf(kept.executionParameters)[0]!.target).toEqual({ kind: "UNSET" });
  });

  it("For time : Séries = nombre de tours, mêmes volumes, temps limite repris ; buy-out libre d'office, sans choix", () => {
    const forTime = enterCarrier(exercise("a"), FOR_TIME_CIRCUIT);
    expect(exitCarrier(forTime, FOR_TIME_CIRCUIT, "KEEP").format).toEqual({ key: "FOR_TIME", settings: { timeCapSeconds: 900 } });
    const buyOut = { ...forTime, format: { key: "FOR_TIME" as const, settings: { passageOnce: 1 } } };
    expect(exitNeedsChoice(buyOut)).toBe(false);
    expect(exitCarrier(buyOut, FOR_TIME_CIRCUIT, "KEEP")).not.toHaveProperty("format");
  });
});

const draftOf = (elements: readonly StructureElement<string>[], exercises: readonly SessionDraftExercise[]): SessionDraft => ({
  ...createEmptyDraft(),
  exercises,
  structure: { elements, stopPoints: [] },
});

describe("Composition : déplacement, duplication, compte et nature", () => {
  const amrapMember = (id: string, settings: Record<string, number> = { incrementPerRound: 0 }) =>
    exercise(id, repetitionParameters(10), { key: "AMRAP", settings });
  const carrierDraft = () =>
    draftOf(
      [
        { kind: "EXERCISE", exercise: "x" },
        { kind: "CIRCUIT", circuit: { id: "c", nature: "TOURS", repeatCount: 2, format: AMRAP_CIRCUIT.format, exercises: ["in", "a", "b"] } },
      ],
      [exercise("x"), amrapMember("in", { incrementPerRound: 0, passageOnce: 1 }), amrapMember("a"), amrapMember("b")],
    );
  let next = 0;
  const newId = () => `n${++next}`;

  it("un Exercice libre déposé dans le Circuit porteur y entre selon ses règles, sans confirmation", () => {
    const outcome = moveLayoutItem(carrierDraft(), { kind: "EXERCISE", id: "x" }, { container: { kind: "CIRCUIT", id: "c" }, index: 3 }, newId);
    expect(outcome.status).toBe("APPLIED");
    if (outcome.status !== "APPLIED") return;
    expect(outcome.draft.exercises.find((item) => item.id === "x")!.format).toEqual({ key: "AMRAP", settings: { incrementPerRound: 0 } });
  });

  it("un membre qui sort demande le choix ; chaque résolution est complète ; le buy-in sort libre sans choix", () => {
    const outcome = moveLayoutItem(carrierDraft(), { kind: "EXERCISE", id: "a" }, { container: { kind: "SESSION" }, index: 0 }, newId);
    expect(outcome.status).toBe("FORMAT_EXIT_CHOICE");
    if (outcome.status !== "FORMAT_EXIT_CHOICE") return;
    expect(outcome.formatKey).toBe("AMRAP");
    const keep = outcome.resolutions.KEEP;
    const free = outcome.resolutions.FREE;
    expect(keep.status === "APPLIED" && keep.draft.exercises.find((item) => item.id === "a")!.format).toEqual({
      key: "AMRAP",
      settings: { durationSeconds: 600, incrementPerRound: 0 },
    });
    expect(free.status === "APPLIED" && free.draft.exercises.find((item) => item.id === "a")).not.toHaveProperty("format");
    const buyIn = moveLayoutItem(carrierDraft(), { kind: "EXERCISE", id: "in" }, { container: { kind: "SESSION" }, index: 0 }, newId);
    expect(buyIn.status).toBe("APPLIED");
    expect(buyIn.status === "APPLIED" && buyIn.draft.exercises.find((item) => item.id === "in")).not.toHaveProperty("format");
  });

  // [« buy-in non duplicable (§6 point 4) » — remplacé le 04/11/2026 (MAJ §6 bis 2) : la copie d'un buy-in est un
  // second buy-in, juste après l'original dans sa zone.]
  it("MAJ 04/11 §6 bis 2 : buy-in duplicable — second buy-in juste après l'original ; membre de boucle duplicable", () => {
    const outcome = duplicateLayoutExercise(carrierDraft(), "in", "copy", newId);
    expect(outcome.status).toBe("APPLIED");
    const circuit = outcome.status === "APPLIED" ? structureCircuits(outcome.draft.structure!)[0]! : null;
    expect(circuit!.exercises.slice(0, 2)).toEqual(["in", "copy"]);
    expect(duplicateLayoutExercise(carrierDraft(), "a", "copy2", newId).status).not.toBe("REFUSED");
  });

  it("nature fixée ; durée de chaque bloc modifiable sans retirer le Format ; compte de blocs modifiable", () => {
    const draft = carrierDraft();
    expect(applyLayoutNatureChange(draft, "c", "SERIES")).toBe(draft);
    const longer = setLayoutCircuitFormatSetting(draft, "c", "blockSeconds", 900);
    expect(structureCircuits(longer.structure!)[0]!.format).toEqual({ key: "AMRAP", settings: { blockSeconds: 900, restBetweenBlocksSeconds: 120 } });
    expect(structureCircuits(setLayoutCircuitCount(draft, "c", 3).structure!)[0]!.repeatCount).toBe(3);
  });

  it("For time porteur : N 3 → 4 ajoute une ligne à compléter, 4 → 2 retire le surplus, sans confirmation ; buy-out à une exécution (A6)", () => {
    const member = (id: string) => exercise(id, variableParameters({ mode: "REPETITIONS", rows: [[21, 0], [15, 0], [9, 0]] }), { key: "FOR_TIME", settings: {} });
    const out = exercise("out", repetitionParameters(50), { key: "FOR_TIME", settings: { passageOnce: 1 } });
    const draft = draftOf(
      [{ kind: "CIRCUIT", circuit: { id: "f", nature: "SERIES", repeatCount: 3, format: FOR_TIME_CIRCUIT.format, exercises: ["a", "out"] } }],
      [member("a"), out],
    );
    const four = setLayoutCircuitCount(draft, "f", 4);
    const rows = (d: SessionDraft, id: string) => seriesRowsOf(d.exercises.find((item) => item.id === id)!.executionParameters).map((row) => row.target);
    expect(rows(four, "a")).toEqual([...[21, 15, 9].map((value) => ({ kind: "NUMBER", value })), { kind: "UNSET" }]);
    expect(rows(four, "out")).toHaveLength(1);
    expect(rows(setLayoutCircuitCount(four, "f", 2), "a")).toEqual([21, 15].map((value) => ({ kind: "NUMBER", value })));
  });
});
