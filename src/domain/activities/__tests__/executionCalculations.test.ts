import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  EXECUTION_PARAMETERS_VERSION,
  failureTarget,
  numberTarget,
  unsetTarget,
  validateForSave,
  type ExecutionParameters,
  type ExecutionParametersInput,
  type SideOrder,
} from "@/domain/activities/ExecutionParameters";
import { activityDefinitionToDraftExercise, type ActivityDefinition } from "@/domain/activities/ActivityDefinition";
import {
  aggregateSessionDuration,
  buildExecutionLedger,
  buildSeriesCircuitLedger,
  computeExercisePlanDuration,
  computeSeriesCircuitOccurrenceDuration,
  computeIntrinsicDuration,
  computeOccurrenceDuration,
  invertTotalDuration,
  isTotalDurationInvertible,
  totalDurationRange,
  type ExerciseDurationResult,
} from "@/domain/activities/executionCalculations";
import { moveRow, openSheetDraft, effectiveParameters, setMode } from "@/domain/activities/ExecutionParametersDraft";
import { generateExecutionPhrase, phraseText, totalClauseAmount } from "@/domain/activities/executionPhrase";
import {
  createExerciseSnapshot,
  parseExerciseSnapshot,
  serializeExerciseSnapshot,
} from "@/domain/activities/exerciseSnapshot";
import {
  uniformParameters,
  variableParameters,
  type FixtureTarget,
} from "@/domain/activities/testing/executionParametersFixtures";
import type { SideMode } from "@/domain/sessions/sideMode";

/**
 * Attendus écrits AVANT le développement, indépendants de l'application :
 * `attendus-numeriques.json` (13 cas normatifs) — lu tel quel, jamais
 * recalculé ici.
 */
const PLANNING = path.resolve(__dirname, "../../../../docs/preparation/PRE-3/planification");
type OracleGiven = {
  readonly base?: string;
  /** Mode de l'oracle PRE-3 : `DURATION`, `REPETITIONS` ou l'ancien troisième mode (« à l'échec »). */
  readonly mode?: string;
  readonly targets?: readonly number[];
  readonly pauses?: readonly number[];
  readonly side?: SideMode;
  readonly order?: SideOrder;
  readonly orderRequested?: SideOrder;
  readonly sidePause?: number;
  readonly cadence?: number;
  readonly recovery?: number;
};
type OracleCase = {
  readonly id: string;
  readonly given: OracleGiven;
  readonly expected: {
    readonly kind: string;
    readonly seconds?: number;
    readonly knownSessionSeconds?: number;
    readonly effectiveOrder?: string;
    readonly phraseTotalPresent?: boolean;
  };
};
const numericCases: readonly OracleCase[] = JSON.parse(
  readFileSync(path.join(PLANNING, "attendus-numeriques.json"), "utf8"),
).cases;

/**
 * PRE-4 (story 1.1, adaptation minimale) : un cas de l'ancien troisième mode
 * de l'oracle (F0, F4) est lu en Répétitions, toutes Cibles `FAILURE`, avec
 * le même attendu (travail inconnu, pauses connues) ; les autres cas gardent
 * leurs Cibles numériques. Le fichier d'attendus n'est pas modifié.
 */
function toParameters(given: Required<Pick<OracleGiven, "mode" | "pauses">> & OracleGiven): ExecutionParametersInput {
  const count = given.pauses.length;
  const legacyFailure = given.mode !== "DURATION" && given.mode !== "REPETITIONS";
  const rows = given.pauses.map((pauseSeconds, index) => {
    const value = given.targets?.[index];
    const target = legacyFailure ? failureTarget() : value === undefined ? unsetTarget() : numberTarget(value);
    return { target, pauseSeconds, loadKg: 0 };
  });
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode: legacyFailure ? "REPETITIONS" : (given.mode as "DURATION" | "REPETITIONS"),
    series: count === 1 ? { kind: "UNIFORM", count: 1, ...rows[0]!, workPhases: [] } : { kind: "VARIABLE", rows },
    sideMode: given.side ?? "UNILATERAL",
    sideOrder: given.orderRequested ?? given.order ?? "BY_SIDE",
    sideRecoverySeconds: given.sidePause ?? 0,
    cadenceBeepIntervalSeconds: given.cadence ?? 0,
    countdownSeconds: 10,
    endSeconds: 5,
    loadEnabled: false,
  };
}

function resolveCases(): Map<string, OracleGiven> {
  const resolved = new Map<string, OracleGiven>();
  for (const oracle of numericCases) {
    const { base, ...given } = oracle.given;
    resolved.set(oracle.id, base ? { ...resolved.get(base)!, ...given } : given);
  }
  return resolved;
}

describe("P3-12/numeric — 13 cas indépendants (attendus-numeriques.json)", () => {
  const resolved = resolveCases();

  it("le fichier d'attendus contient exactement les 13 cas", () => {
    expect(numericCases.map((oracle) => oracle.id)).toEqual([
      "A", "B", "C", "D", "E", "F0", "F4", "CADENCE", "DURATION_BEEP",
      "N1_SIDE", "N1_SIDE_R", "N1_WITH_PAUSE", "N1_NO_PAUSE",
    ]);
  });

  it.each(numericCases.map((oracle) => [oracle.id, oracle] as const))("cas %s", (_id, oracle) => {
    const given = resolved.get(oracle.id)! as Required<Pick<OracleGiven, "mode" | "pauses">> & OracleGiven;
    const parameters = toParameters(given);
    const result = computeOccurrenceDuration(parameters, given.recovery ?? 0);
    expect(result.kind).toBe(oracle.expected.kind);
    if (oracle.expected.seconds !== undefined) {
      expect(result.seconds).toBe(oracle.expected.seconds);
    }
    if (oracle.expected.kind === "omitted") {
      expect(result.seconds).toBeUndefined();
      expect(result.knownSeconds).toBe(oracle.expected.knownSessionSeconds);
    }
    if (oracle.expected.phraseTotalPresent !== undefined) {
      const phrase = phraseText(generateExecutionPhrase(parameters)!);
      expect(phrase.includes("Durée totale")).toBe(oracle.expected.phraseTotalPresent);
    }
    if (oracle.expected.effectiveOrder !== undefined) {
      const sidePause = result.events.filter((event) => event.kind === "SIDE_PAUSE");
      // Par côté : une seule Pause entre les côtés, après le premier côté.
      expect(sidePause).toEqual([{ kind: "SIDE_PAUSE", series: null, seconds: given.sidePause }]);
    }
  });
});

describe("P3-12/normative-totals et P3-12/omission", () => {
  const base = { countdownSeconds: 10, endSeconds: 5, version: EXECUTION_PARAMETERS_VERSION, loadEnabled: false } as const;

  it("aucune convention historique de 2 s par répétition", () => {
    const repetitions: ExecutionParametersInput = {
      ...base,
      mode: "REPETITIONS",
      series: { kind: "UNIFORM", count: 3, target: numberTarget(12), pauseSeconds: 0, loadKg: 0, workPhases: [] },
      sideMode: "UNILATERAL",
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 0,
      cadenceBeepIntervalSeconds: 0,
    };
    const result = computeIntrinsicDuration(repetitions);
    expect(result).toEqual(expect.objectContaining({ kind: "omitted", knownSeconds: 0 }));
    expect(result.seconds).toBeUndefined();
  });

  it("Compte à rebours et Fin exclus du total intrinsèque", () => {
    const duration: ExecutionParametersInput = {
      ...base,
      countdownSeconds: 60,
      endSeconds: 60,
      loadEnabled: false,
      mode: "DURATION",
      series: { kind: "UNIFORM", count: 1, target: numberTarget(30), pauseSeconds: 15, loadKg: 0, workPhases: [] },
      sideMode: "UNILATERAL",
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 0,
      cadenceBeepIntervalSeconds: 0,
    };
    expect(computeIntrinsicDuration(duration).seconds).toBe(45);
  });
});

function variableE(side: SideMode, order: SideOrder, sidePause = 15): ExecutionParametersInput {
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode: "REPETITIONS",
    series: {
      kind: "VARIABLE",
      rows: [
        { target: numberTarget(12), pauseSeconds: 30, loadKg: 0 },
        { target: numberTarget(10), pauseSeconds: 45, loadKg: 0 },
        { target: numberTarget(8), pauseSeconds: 60, loadKg: 0 },
      ],
    },
    sideMode: side,
    sideOrder: order,
    sideRecoverySeconds: sidePause,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    loadEnabled: false,
  };
}

function caseA(overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode: "DURATION",
    series: {
      kind: "VARIABLE",
      rows: [
        { target: numberTarget(30), pauseSeconds: 10, loadKg: 0 },
        { target: numberTarget(45), pauseSeconds: 20, loadKg: 0 },
        { target: numberTarget(60), pauseSeconds: 30, loadKg: 0 },
      ],
    },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    loadEnabled: false,
    ...overrides,
  };
}

describe("P3-13/R-terminal — R remplace la seule Pause terminale", () => {
  it("A : 285 avec R120 ; N1 bilatéral : 235 avec R30 ; R0/absent sans effet", () => {
    expect(computeOccurrenceDuration(caseA(), 120).seconds).toBe(285);
    expect(computeOccurrenceDuration(caseA(), 0).seconds).toBe(195);
    const n1 = caseA({
      series: { kind: "UNIFORM", count: 1, target: numberTarget(90), pauseSeconds: 15, loadKg: 0, workPhases: [] },
      sideMode: "RIGHT_LEFT",
      sideOrder: "BY_SERIES",
      sideRecoverySeconds: 10,
    });
    expect(computeOccurrenceDuration(n1, 30).seconds).toBe(235);
    expect(computeIntrinsicDuration(n1).seconds).toBe(220);
    const recoveries = computeOccurrenceDuration(n1, 30).events.filter((event) => event.kind === "RECOVERY");
    expect(recoveries).toEqual([{ kind: "RECOVERY", seconds: 30 }]);
  });
});

describe("P3-07/move-terminal — la nouvelle dernière ligne porte PN", () => {
  it("C/A/B : intrinsèque 195 inchangé, occurrence 295 ; ✕ restitue 285", () => {
    const opened = openSheetDraft(caseA());
    const moved = moveRow(opened, 2, 0);
    const movedParameters = effectiveParameters(moved);
    expect(computeIntrinsicDuration(movedParameters).seconds).toBe(195);
    expect(computeOccurrenceDuration(movedParameters, 120).seconds).toBe(295);
    // ✕ : le parent n'a jamais été touché.
    expect(computeOccurrenceDuration(caseA(), 120).seconds).toBe(285);
  });
});

describe("P3-13/unknown-known — contributions connues construites depuis le registre", () => {
  it("unilatéral/par côté/par paire avec R120 : travail inconnu jamais inventé", () => {
    const unilateral = computeOccurrenceDuration(variableE("UNILATERAL", "BY_SIDE", 0), 120);
    // Pauses 30+45 puis R120 remplaçant la Pause terminale 60 (Bip v2 §3).
    expect(unilateral).toEqual(expect.objectContaining({ kind: "omitted", knownSeconds: 195 }));
    expect(computeOccurrenceDuration(variableE("RIGHT_LEFT", "BY_SIDE"), 120).knownSeconds).toBe(345);
    expect(computeOccurrenceDuration(variableE("RIGHT_LEFT", "BY_SERIES"), 120).knownSeconds).toBe(240);
    for (const result of [unilateral, computeOccurrenceDuration(variableE("RIGHT_LEFT", "BY_SIDE"), 120)]) {
      expect(result.seconds).toBeUndefined();
      expect(result.events.some((event) => event.kind === "WORK" && event.seconds === null)).toBe(true);
    }
  });
});

describe("P3-13/tours-cycles-list — agrégation de Séance", () => {
  const exact = computeIntrinsicDuration(caseA());
  const estimated = computeIntrinsicDuration({ ...variableE("UNILATERAL", "BY_SIDE", 0), cadenceBeepIntervalSeconds: 4 });
  const omitted = computeIntrinsicDuration(variableE("UNILATERAL", "BY_SIDE", 0));

  it("exact si tout exact ; ≈ si une estimation ; ≥ dès un inconnu (pauses connues incluses)", () => {
    expect(aggregateSessionDuration([{ result: exact, multiplicity: 1 }])).toEqual({ kind: "exact", seconds: 195 });
    expect(
      aggregateSessionDuration([
        { result: exact, multiplicity: 1 },
        { result: estimated, multiplicity: 2 },
      ]),
    ).toEqual({ kind: "estimated", seconds: 195 + 2 * estimated.knownSeconds });
    expect(
      aggregateSessionDuration([
        { result: exact, multiplicity: 99 },
        { result: omitted, multiplicity: 1 },
      ]),
    ).toEqual({ kind: "lowerBound", seconds: 99 * 195 + 135 });
  });
});

describe("P3-13/tours-cycles-list — Compte à rebours et Fin une fois par Exercice complet", () => {
  it("plan complet : occurrence + CR + Fin une seule fois, jamais par Série ni par côté", () => {
    const bilateral = caseA({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE", sideRecoverySeconds: 15, countdownSeconds: 10, endSeconds: 5 });
    expect(computeOccurrenceDuration(bilateral, 120).seconds).toBe(405 - 30 + 120);
    expect(computeExercisePlanDuration(bilateral, 120).seconds).toBe(405 - 30 + 120 + 10 + 5);
    // Travail inconnu : CR/Fin restent des contributions connues, aucun total inventé.
    const unknown = computeExercisePlanDuration({ ...variableE("UNILATERAL", "BY_SIDE", 0), countdownSeconds: 3, endSeconds: 2 }, 0);
    expect(unknown).toEqual(expect.objectContaining({ kind: "omitted", knownSeconds: 135 + 5 }));
    expect(unknown.seconds).toBeUndefined();
    // Le total intrinsèque (Catalogue/Composition) exclut toujours CR/Fin.
    expect(computeIntrinsicDuration(bilateral).seconds).toBe(405);
  });
});

describe("P3-09/directions et P3-09/unilateral-controls", () => {
  const uniform = (side: SideMode, order: SideOrder): ExecutionParametersInput =>
    caseA({ sideMode: side, sideOrder: order, sideRecoverySeconds: 15 });

  it("totaux indépendants du côté de départ ; PC une fois par côté, N fois par paire", () => {
    for (const order of ["BY_SIDE", "BY_SERIES"] as const) {
      expect(computeIntrinsicDuration(uniform("RIGHT_LEFT", order)).seconds).toBe(
        computeIntrinsicDuration(uniform("LEFT_RIGHT", order)).seconds,
      );
    }
    const bySide = computeIntrinsicDuration(uniform("RIGHT_LEFT", "BY_SIDE"));
    const bySeries = computeIntrinsicDuration(uniform("RIGHT_LEFT", "BY_SERIES"));
    expect(bySide.events.filter((event) => event.kind === "SIDE_PAUSE")).toHaveLength(1);
    expect(bySeries.events.filter((event) => event.kind === "SIDE_PAUSE")).toHaveLength(3);
    expect(bySide.seconds).toBe(405);
    expect(bySeries.seconds).toBe(375);
  });

  it("en unilatéral, ordre et PC conservés en données n'injectent aucune Pause entre les côtés", () => {
    const result = computeIntrinsicDuration(caseA({ sideMode: "UNILATERAL", sideOrder: "BY_SERIES", sideRecoverySeconds: 15 }));
    expect(result.seconds).toBe(195);
    expect(result.events.some((event) => event.kind === "SIDE_PAUSE")).toBe(false);
  });
});

describe("P3-14/inverse-enumeration et P3-14/inverse-explicit — inversion Durée uniforme", () => {
  const uniform30 = (overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput => ({
    version: EXECUTION_PARAMETERS_VERSION,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 1, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 0,
    endSeconds: 0,
    loadEnabled: false,
    ...overrides,
  });

  it("T=30, P=10 : demandé 100 → N=3/120 s avec message ; 80 → N=2 sans message", () => {
    expect(invertTotalDuration(uniform30(), 100)).toEqual({ seriesCount: 3, totalSeconds: 120, adjusted: true });
    expect(invertTotalDuration(uniform30(), 80)).toEqual({ seriesCount: 2, totalSeconds: 80, adjusted: false });
  });

  it("cas 6423:9953 : 3 × 90 s, Pause 15 s → 5 min 15 s sans ajustement", () => {
    const parameters = uniform30({ series: { kind: "UNIFORM", count: 1, target: numberTarget(90), pauseSeconds: 15, loadKg: 0, workPhases: [] } });
    expect(invertTotalDuration(parameters, 315)).toEqual({ seriesCount: 3, totalSeconds: 315, adjusted: false });
  });
});

describe("P3-14/inverse-boundaries", () => {
  const bilateral: ExecutionParametersInput = {
    version: EXECUTION_PARAMETERS_VERSION,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 5, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] },
    sideMode: "RIGHT_LEFT",
    sideOrder: "BY_SERIES",
    sideRecoverySeconds: 5,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 0,
    endSeconds: 0,
    loadEnabled: false,
  };

  it("N=1 normalisé par côté ; en deçà du minimum → N=1 ; au-delà du maximum → N=99 ; jamais 0/100", () => {
    const n1 = 2 * (30 + 10) + 5; // par côté
    const n99 = 99 * (2 * 30 + 10 + 5); // par paire
    expect(totalDurationRange(bilateral)).toEqual({ min: n1, max: n99 });
    expect(invertTotalDuration(bilateral, 1)).toEqual({ seriesCount: 1, totalSeconds: n1, adjusted: true });
    expect(invertTotalDuration(bilateral, n1)).toEqual({ seriesCount: 1, totalSeconds: n1, adjusted: false });
    expect(invertTotalDuration(bilateral, n99)).toEqual({ seriesCount: 99, totalSeconds: n99, adjusted: false });
    expect(invertTotalDuration(bilateral, n99 + 10_000)).toEqual({ seriesCount: 99, totalSeconds: n99, adjusted: true });
  });

  it("inversion désactivée en variable, Répétitions, Cible à l'échec ou à renseigner", () => {
    expect(isTotalDurationInvertible(bilateral)).toBe(true);
    expect(isTotalDurationInvertible({ ...bilateral, mode: "REPETITIONS" })).toBe(false);
    expect(
      isTotalDurationInvertible({
        ...bilateral,
        series: { kind: "UNIFORM", count: 5, target: failureTarget(), pauseSeconds: 10, loadKg: 0, workPhases: [] },
      }),
    ).toBe(false);
    expect(
      isTotalDurationInvertible({
        ...bilateral,
        series: { kind: "UNIFORM", count: 5, target: unsetTarget(), pauseSeconds: 10, loadKg: 0, workPhases: [] },
      }),
    ).toBe(false);
    expect(
      isTotalDurationInvertible({
        ...bilateral,
        series: {
          kind: "VARIABLE",
          rows: [
            { target: numberTarget(30), pauseSeconds: 10, loadKg: 0 },
            { target: numberTarget(30), pauseSeconds: 10, loadKg: 0 },
          ],
        },
      }),
    ).toBe(false);
    expect(() => invertTotalDuration({ ...bilateral, mode: "REPETITIONS" }, 100)).toThrow();
  });
});

describe("P3-08/immediate-N1 — calcul du brouillon à N=1", () => {
  it("variable N3 par paire réduite à N1 : 220 s, ordre demandé non utilisé", () => {
    const draft = openSheetDraft({
      version: EXECUTION_PARAMETERS_VERSION,
      mode: "DURATION",
      series: {
        kind: "VARIABLE",
        rows: [
          { target: numberTarget(90), pauseSeconds: 15, loadKg: 0 },
          { target: numberTarget(45), pauseSeconds: 20, loadKg: 0 },
          { target: numberTarget(60), pauseSeconds: 30, loadKg: 0 },
        ],
      },
      sideMode: "RIGHT_LEFT",
      sideOrder: "BY_SERIES",
      sideRecoverySeconds: 10,
      cadenceBeepIntervalSeconds: 0,
      countdownSeconds: 10,
      endSeconds: 5,
      loadEnabled: false,
    });
    const reduced = { ...draft, count: 1, rows: draft.rows.slice(0, 1), hiddenRows: draft.rows.slice(1) };
    expect(computeIntrinsicDuration(effectiveParameters(reduced)).seconds).toBe(220);
  });
});

describe("PRE-4 story 1.1 — Cibles typées dans le calcul (AC20, AC21)", () => {
  it("PRE4-1.1/AC21 — toute Cible à l'échec donne un total omis, même avec un Bip ; les pauses restent connues", () => {
    const failure: ExecutionParametersInput = {
      version: EXECUTION_PARAMETERS_VERSION,
      mode: "REPETITIONS",
      series: { kind: "UNIFORM", count: 3, target: failureTarget(), pauseSeconds: 10, loadKg: 0, workPhases: [] },
      sideMode: "UNILATERAL",
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 0,
      cadenceBeepIntervalSeconds: 2,
      countdownSeconds: 0,
      endSeconds: 0,
      loadEnabled: false,
    };
    const result = computeIntrinsicDuration(failure);
    expect(result).toEqual(expect.objectContaining({ kind: "omitted", knownSeconds: 30 }));
    expect(result.seconds).toBeUndefined();
    expect(computeIntrinsicDuration({ ...failure, mode: "DURATION" }).seconds).toBeUndefined();
  });
});

// --- PRE-4 story 2.1 — Nature et montant de la Durée totale (AC1 à AC8) -----
//
// Attendus : constantes écrites ou formules calculées dans le test (AD-10,
// FR-13-06) ; aucun n'est produit par `executionCalculations`, lu dans Figma
// ni dans la colonne J d'Excel.

type Row = readonly [FixtureTarget, number];

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

function mixed(
  rows: readonly Row[],
  options: { mode?: "DURATION" | "REPETITIONS"; beep?: number; side?: SideMode; order?: SideOrder; pc?: number } = {},
): ExecutionParameters {
  return variableParameters({
    mode: options.mode ?? "DURATION",
    rows,
    cadenceBeepIntervalSeconds: options.beep ?? 0,
    sideMode: options.side ?? "UNILATERAL",
    sideOrder: options.order ?? "BY_SIDE",
    sideRecoverySeconds: options.pc ?? 0,
  });
}

/** Nature et montant attendus d'un résultat (montant absent pour `omitted` et `incomplete`). */
function expectResult(result: ExerciseDurationResult, kind: ExerciseDurationResult["kind"], seconds: number | undefined, knownSeconds?: number) {
  expect(result.kind).toBe(kind);
  expect(result.seconds).toBe(seconds);
  if (knownSeconds !== undefined) {
    expect(result.knownSeconds).toBe(knownSeconds);
  }
}

describe("PRE-4 story 2.1 — AC1 travail de chaque Série (FR-13-01)", () => {
  const works = (parameters: ExecutionParametersInput) =>
    buildExecutionLedger(parameters)
      .filter((event) => event.kind === "WORK")
      .map((event) => (event.kind === "WORK" ? event.seconds : undefined));

  it("PRE4-2.1/AC1 — Durée d → d ; Répétitions R avec Bip b → R × b ; FAILURE et Bip 0 → inconnu", () => {
    expect(works(mixed([[30, 0], [45, 0]]))).toEqual([30, 45]);
    expect(works(mixed([[10, 0], [12, 0]], { mode: "REPETITIONS", beep: 2 }))).toEqual([10 * 2, 12 * 2]);
    for (const mode of ["DURATION", "REPETITIONS"] as const) {
      for (const beep of [0, 4]) {
        expect(works(mixed([["FAILURE", 0], [30, 0]], { mode, beep }))[0]).toBeNull();
      }
    }
    // Répétitions avec Bip 0 : travail inconnu même avec une Cible NUMBER, aucun forfait par répétition.
    expect(works(mixed([[10, 0], [12, 0], [15, 0]], { mode: "REPETITIONS", beep: 0 }))).toEqual([null, null, null]);
    const noBeep = computeIntrinsicDuration(mixed([[10, 10], [12, 10]], { mode: "REPETITIONS", beep: 0 }));
    expect(noBeep.knownSeconds).toBe(10 + 10);
  });

  it("PRE4-2.1/AC1 — en Durée, le Bip ne change pas le total : 4 × (60 + 15) = 300 s exact", () => {
    const parameters = uniformParameters({ mode: "DURATION", count: 4, target: 60, pauseSeconds: 15, cadenceBeepIntervalSeconds: 4 });
    expectResult(computeIntrinsicDuration(parameters), "exact", 4 * (60 + 15));
    expectResult(computeIntrinsicDuration({ ...parameters, cadenceBeepIntervalSeconds: 0 }), "exact", 300);
  });
});

describe("PRE-4 story 2.1 — AC2 nature de la Durée totale (FR-13-02, P25)", () => {
  const numbers: readonly Row[] = [[30, 10], [45, 10], [60, 10]];
  const reps: readonly Row[] = [[10, 10], [12, 10], [15, 10]];
  const mix: readonly Row[] = [[30, 10], [45, 10], ["FAILURE", 10]];
  const repsMix: readonly Row[] = [[10, 10], [12, 10], ["FAILURE", 10]];
  const failures: readonly Row[] = [["FAILURE", 10], ["FAILURE", 10], ["FAILURE", 10]];

  it("PRE4-2.1/AC2 — tableau des natures, ligne par ligne", () => {
    for (const beep of [0, 4]) {
      expect(computeIntrinsicDuration(mixed(numbers, { beep })).kind).toBe("exact");
      expect(computeIntrinsicDuration(mixed(mix, { beep })).kind).toBe("lowerBound");
      expect(computeIntrinsicDuration(mixed(failures, { beep })).kind).toBe("omitted");
      expect(computeIntrinsicDuration(mixed(failures, { mode: "REPETITIONS", beep })).kind).toBe("omitted");
    }
    expect(computeIntrinsicDuration(mixed(reps, { mode: "REPETITIONS", beep: 2 })).kind).toBe("estimated");
    // ≥ prime sur ≈ : jamais `estimated` pour un mélange.
    expect(computeIntrinsicDuration(mixed(repsMix, { mode: "REPETITIONS", beep: 2 })).kind).toBe("lowerBound");
    for (const rows of [reps, repsMix, failures]) {
      expect(computeIntrinsicDuration(mixed(rows, { mode: "REPETITIONS", beep: 0 })).kind).toBe("omitted");
    }
    // Tout à l'échec, Pauses nulles : toujours `omitted`.
    const zeroPauses: readonly Row[] = [["FAILURE", 0], ["FAILURE", 0]];
    expectResult(computeIntrinsicDuration(mixed(zeroPauses)), "omitted", undefined, 0);
  });

  it("PRE4-2.1/AC2 — `lowerBound` porte le montant connu ; `omitted` aucun montant, mais ses contributions connues", () => {
    expectResult(computeIntrinsicDuration(mixed(mix)), "lowerBound", 30 + 45 + 3 * 10, 30 + 45 + 3 * 10);
    expectResult(computeIntrinsicDuration(mixed(failures)), "omitted", undefined, 3 * 10);
  });

  it("PRE4-2.1/AC2 — le montant d'une Pause change le montant, jamais la nature", () => {
    for (const pause of [0, 10, 45]) {
      const rows: readonly Row[] = [[30, pause], [45, pause], ["FAILURE", pause]];
      expectResult(computeIntrinsicDuration(mixed(rows)), "lowerBound", 30 + 45 + 3 * pause);
      const allFailure: readonly Row[] = [["FAILURE", pause], ["FAILURE", pause]];
      expectResult(computeIntrinsicDuration(mixed(allFailure)), "omitted", undefined, 2 * pause);
      expectResult(computeIntrinsicDuration(mixed([[30, pause], [45, pause]])), "exact", 30 + 45 + 2 * pause);
    }
  });
});

describe("PRE-4 story 2.1 — AC3 total partiel d'un mélange (FR-13-03)", () => {
  it("PRE4-2.1/AC3 — R01 : Durée 30 / 45 / échec, Pauses 10 × 3 → 105 s ≥", () => {
    expectResult(computeIntrinsicDuration(mixed([[30, 10], [45, 10], ["FAILURE", 10]])), "lowerBound", 30 + 45 + 30);
  });

  it("PRE4-2.1/AC3 — R02 : Répétitions 10 / 12 / échec, Bip 2 s → 74 s ≥ (et non ≈)", () => {
    const rows: readonly Row[] = [[10, 10], [12, 10], ["FAILURE", 10]];
    expectResult(computeIntrinsicDuration(mixed(rows, { mode: "REPETITIONS", beep: 2 })), "lowerBound", 10 * 2 + 12 * 2 + 30);
  });

  it("PRE4-2.1/AC3 — R03 : même Exercice, Bip 0 → omis, contributions connues 30 s", () => {
    const rows: readonly Row[] = [[10, 10], [12, 10], ["FAILURE", 10]];
    expectResult(computeIntrinsicDuration(mixed(rows, { mode: "REPETITIONS", beep: 0 })), "omitted", undefined, 30);
  });

  it("PRE4-2.1/AC3 — R04 : trois Cibles à l'échec, quatre combinaisons Mode × Bip → omis, 30 s connues", () => {
    const rows: readonly Row[] = [["FAILURE", 10], ["FAILURE", 10], ["FAILURE", 10]];
    for (const mode of ["DURATION", "REPETITIONS"] as const) {
      for (const beep of [0, 2]) {
        expectResult(computeIntrinsicDuration(mixed(rows, { mode, beep })), "omitted", undefined, 30);
      }
    }
  });

  it("PRE4-2.1/AC3 — mixte Figma : 30 / 45 / échec, Pauses 10 / 20 / 30 → 135 s ≥", () => {
    expectResult(computeIntrinsicDuration(mixed([[30, 10], [45, 20], ["FAILURE", 30]])), "lowerBound", 75 + 60);
  });

  it("PRE4-2.1/AC3 — contrôles tout numériques : 165 s exact, 104 s ≈", () => {
    expectResult(computeIntrinsicDuration(mixed([[30, 10], [45, 10], [60, 10]])), "exact", 135 + 30);
    expectResult(
      computeIntrinsicDuration(mixed([[10, 10], [12, 10], [15, 10]], { mode: "REPETITIONS", beep: 2 })),
      "estimated",
      37 * 2 + 30,
    );
  });

  it("PRE4-2.1/AC3 — plus de 3 Cibles : 175 s ≥ en Durée, 114 s ≥ en Répétitions", () => {
    expectResult(computeIntrinsicDuration(mixed([[30, 10], [45, 10], [60, 10], ["FAILURE", 10]])), "lowerBound", 135 + 40);
    expectResult(
      computeIntrinsicDuration(mixed([[10, 10], [12, 10], [15, 10], ["FAILURE", 10]], { mode: "REPETITIONS", beep: 2 })),
      "lowerBound",
      37 * 2 + 40,
    );
  });

  it("PRE4-2.1/AC3 — la Pause qui suit une Série à l'échec et la Pause terminale sont comptées", () => {
    expectResult(computeIntrinsicDuration(mixed([[30, 5], ["FAILURE", 20], [45, 40]])), "lowerBound", 30 + 45 + 5 + 20 + 40);
  });
});

describe("PRE-4 story 2.1 — AC4 formules du total intrinsèque, Cibles typées (FR-13-04)", () => {
  const rowsA: readonly Row[] = [[30, 10], [45, 20], [60, 30]];

  it("PRE4-2.1/AC4 — cas A à D", () => {
    expectResult(computeIntrinsicDuration(mixed(rowsA)), "exact", 195);
    expectResult(computeOccurrenceDuration(mixed(rowsA), 120), "exact", 285);
    expectResult(computeIntrinsicDuration(mixed(rowsA, { side: "RIGHT_LEFT", order: "BY_SIDE", pc: 15 })), "exact", 405);
    expectResult(computeIntrinsicDuration(mixed(rowsA, { side: "RIGHT_LEFT", order: "BY_SERIES", pc: 15 })), "exact", 375);
  });

  it("PRE4-2.1/AC4 — cas E et F : omis", () => {
    const e: readonly Row[] = [[12, 30], [10, 45], [8, 60]];
    expectResult(computeIntrinsicDuration(mixed(e, { mode: "REPETITIONS", beep: 0 })), "omitted", undefined, 135);
    const f: readonly Row[] = [["FAILURE", 30], ["FAILURE", 45], ["FAILURE", 60]];
    for (const beep of [0, 4]) {
      expectResult(computeIntrinsicDuration(mixed(f, { mode: "REPETITIONS", beep })), "omitted", undefined, 135);
    }
  });

  it("PRE4-2.1/AC4 — uniforme, bilatéral, N 1 bilatéral, douze séries, Répétitions avec Bip, une Série", () => {
    const uniform = (options: Partial<Parameters<typeof uniformParameters>[0]> = {}) =>
      uniformParameters({ mode: "DURATION", count: 3, target: 90, pauseSeconds: 15, ...options });
    expectResult(computeIntrinsicDuration(uniform()), "exact", 315);
    expectResult(computeIntrinsicDuration(uniform({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE", sideRecoverySeconds: 10 })), "exact", 640);
    expectResult(computeIntrinsicDuration(uniform({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES", sideRecoverySeconds: 10 })), "exact", 615);
    const single = uniform({ count: 1, sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES", sideRecoverySeconds: 10 });
    expectResult(computeIntrinsicDuration(single), "exact", 220);
    expectResult(computeOccurrenceDuration(single, 30), "exact", 235);
    // Douze séries : travail total 390 s (onze de 30 s et une de 60 s), Pause 10 s.
    const twelve: Row[] = Array.from({ length: 11 }, () => [30, 10] as const);
    twelve.push([60, 10]);
    expectResult(computeIntrinsicDuration(mixed(twelve)), "exact", 390 + 12 * 10);
    expectResult(
      computeIntrinsicDuration(uniformParameters({ mode: "REPETITIONS", count: 4, target: 15, pauseSeconds: 15, cadenceBeepIntervalSeconds: 4 })),
      "estimated",
      300,
    );
    expectResult(computeIntrinsicDuration(uniformParameters({ mode: "DURATION", count: 1, target: 30, pauseSeconds: 15 })), "exact", 45);
  });

  it("PRE4-2.1/AC4 — une Pause suit chaque Série ; Pause 0 sans durée ; PC 0 ne remplace pas Pi", () => {
    expectResult(computeIntrinsicDuration(mixed([[30, 0], [30, 0], [30, 0]])), "exact", 90);
    expectResult(computeIntrinsicDuration(mixed([[30, 10], [30, 10]], { side: "RIGHT_LEFT", order: "BY_SERIES", pc: 0 })), "exact", 2 * 60 + 20);
    expectResult(computeIntrinsicDuration(mixed([[30, 10], [30, 10]], { side: "LEFT_RIGHT", order: "BY_SIDE", pc: 0 })), "exact", 2 * 80);
  });

  it("PRE4-2.1/AC4 — Compte à rebours et Fin exclus du total intrinsèque", () => {
    const parameters: ExecutionParametersInput = { ...mixed(rowsA), countdownSeconds: 10, endSeconds: 5 };
    expectResult(computeIntrinsicDuration(parameters), "exact", 195);
    expectResult(computeExercisePlanDuration(parameters, 0), "exact", 195 + 15);
    // Plan complet d'un mélange : `lowerBound` porte aussi le montant.
    const partial: ExecutionParametersInput = { ...mixed([[30, 10], ["FAILURE", 20], [60, 30]]), countdownSeconds: 10, endSeconds: 5 };
    expectResult(computeExercisePlanDuration(partial, 0), "lowerBound", 30 + 60 + 60 + 15);
  });

  it("PRE4-2.1/AC4 — Régime variables : après déplacement de la dernière ligne, la nouvelle dernière porte PN", () => {
    const draft = moveRow(openSheetDraft(mixed(rowsA)), 2, 0);
    const moved = effectiveParameters(draft);
    // Nouvel ordre 60/30, 30/10, 45/20 : la Récupération remplace la Pause de 20 s.
    expectResult(computeOccurrenceDuration(moved, 120), "exact", 195 - 20 + 120);
    expectResult(computeIntrinsicDuration(moved), "exact", 195);
  });
});

describe("PRE-4 story 2.1 — AC5 Cible à renseigner (FR-13-05, H10, Q30)", () => {
  it("PRE4-2.1/AC5 — 30 / à renseigner / 45, Pauses 10 × 3 → `incomplete`, 105 s connues, aucun montant", () => {
    const parameters = mixed([[30, 10], ["UNSET", 10], [45, 10]]);
    expectResult(computeIntrinsicDuration(parameters), "incomplete", undefined, 30 + 45 + 3 * 10);
    // Jamais lue comme 0 ni convertie en FAILURE : le travail reste inconnu, la Cible intacte.
    const work = buildExecutionLedger(parameters).filter((event) => event.kind === "WORK");
    expect(work.map((event) => event.seconds)).toEqual([30, null, 45]);
    expect(parameters.series.kind === "VARIABLE" && parameters.series.rows[1]!.target).toEqual(unsetTarget());
  });

  it("PRE4-2.1/AC5 — Répétitions Bip 0, 10 / à renseigner / 12 → `incomplete`, 30 s (Pauses seules)", () => {
    const rows: readonly Row[] = [[10, 10], ["UNSET", 10], [12, 10]];
    expectResult(computeIntrinsicDuration(mixed(rows, { mode: "REPETITIONS", beep: 0 })), "incomplete", undefined, 30);
    expectResult(computeIntrinsicDuration(mixed(rows, { mode: "REPETITIONS", beep: 2 })), "incomplete", undefined, 10 * 2 + 12 * 2 + 30);
  });

  it("PRE4-2.1/AC5 — `incomplete` prime sur toute autre nature, en Durée comme en Répétitions", () => {
    for (const mode of ["DURATION", "REPETITIONS"] as const) {
      for (const beep of [0, 4]) {
        expect(computeIntrinsicDuration(mixed([["UNSET", 10], ["FAILURE", 10]], { mode, beep })).kind).toBe("incomplete");
        expect(computeIntrinsicDuration(uniformParameters({ mode, count: 3, target: "UNSET", pauseSeconds: 10, cadenceBeepIntervalSeconds: beep })).kind).toBe("incomplete");
      }
    }
  });

  it("PRE4-2.1/AC5 — `incomplete` en bilatéral (BY_SIDE, BY_SERIES, avec PC) et avec Récupération : contributions connues par formule", () => {
    const pc = 15;
    const recovery = 40;
    // Travail connu W (Cibles NUMBER seules), Pauses P, N Séries ; Récupération à la place de la dernière Pause.
    const cases: readonly { rows: readonly Row[]; work: number }[] = [
      { rows: [[30, 10], ["UNSET", 20], [45, 30]], work: 30 + 45 },
      { rows: [[30, 10], [45, 20], ["UNSET", 30]], work: 30 + 45 },
      { rows: [[30, 10], ["UNSET", 20], ["FAILURE", 30]], work: 30 },
    ];
    for (const { rows, work } of cases) {
      const pauses = 10 + 20 + 30;
      const last = 30;
      const n = 3;
      const bySide = 2 * (work + pauses) + pc;
      const bySeries = 2 * work + pauses + n * pc;
      const unilateral = work + pauses;
      expectResult(computeIntrinsicDuration(mixed(rows, { side: "RIGHT_LEFT", order: "BY_SIDE", pc })), "incomplete", undefined, bySide);
      expectResult(computeIntrinsicDuration(mixed(rows, { side: "LEFT_RIGHT", order: "BY_SERIES", pc })), "incomplete", undefined, bySeries);
      expectResult(computeOccurrenceDuration(mixed(rows), recovery), "incomplete", undefined, unilateral - last + recovery);
      expectResult(
        computeOccurrenceDuration(mixed(rows, { side: "RIGHT_LEFT", order: "BY_SIDE", pc }), recovery),
        "incomplete",
        undefined,
        bySide - last + recovery,
      );
      expectResult(
        computeOccurrenceDuration(mixed(rows, { side: "RIGHT_LEFT", order: "BY_SERIES", pc }), recovery),
        "incomplete",
        undefined,
        bySeries - last + recovery,
      );
    }
    // Mélange dont la dernière ligne est FAILURE (sans UNSET) : `lowerBound`, Récupération à la place de PN.
    const failureLast: readonly Row[] = [[30, 10], [45, 20], ["FAILURE", 30]];
    expectResult(computeOccurrenceDuration(mixed(failureLast), recovery), "lowerBound", 75 + 60 - 30 + recovery);
  });

  it("PRE4-2.1/AC5 — une Cible FAILURE explicitement choisie reste valide sans nombre", () => {
    const parameters = mixed([[30, 10], ["FAILURE", 10]]);
    expect(validateForSave(parameters, null).ok).toBe(true);
    expect(computeIntrinsicDuration(parameters).kind).toBe("lowerBound");
  });
});

describe("PRE-4 story 2.1 — AC6 disponibilité de l'Inversion du total (FR-14-02, P42)", () => {
  const base = uniformParameters({ mode: "DURATION", count: 3, target: 30, pauseSeconds: 10 });

  it("PRE4-2.1/AC6 — disponible si et seulement si Durée, Régime identiques, Cible NUMBER et N non hérité", () => {
    expect(isTotalDurationInvertible(base)).toBe(true);
    expect(isTotalDurationInvertible(base, false)).toBe(true);
    const unavailable: readonly ExecutionParametersInput[] = [
      uniformParameters({ mode: "DURATION", count: 3, target: "FAILURE", pauseSeconds: 10 }),
      uniformParameters({ mode: "DURATION", count: 3, target: "UNSET", pauseSeconds: 10 }),
      mixed([[30, 10], [30, 10]]),
      mixed([[30, 10], ["FAILURE", 10]]),
      uniformParameters({ mode: "REPETITIONS", count: 3, target: 10, pauseSeconds: 10, cadenceBeepIntervalSeconds: 2 }),
    ];
    for (const parameters of unavailable) {
      expect(isTotalDurationInvertible(parameters)).toBe(false);
      expect(() => invertTotalDuration(parameters, 120)).toThrow(
        "Total duration inversion is reserved to uniform Duration mode.",
      );
    }
  });

  it("PRE4-2.1/AC6 — N hérité (indicateur d'entrée) : indisponible, y compris à l'échec ; l'appel lève", () => {
    expect(isTotalDurationInvertible(base, true)).toBe(false);
    expect(isTotalDurationInvertible(uniformParameters({ mode: "DURATION", count: 3, target: "FAILURE", pauseSeconds: 10 }), true)).toBe(false);
    expect(() => invertTotalDuration(base, 120, true)).toThrow(
      "Total duration inversion is unavailable for an inherited series count.",
    );
    expect(() =>
      invertTotalDuration(uniformParameters({ mode: "DURATION", count: 3, target: "FAILURE", pauseSeconds: 10 }), 120, true),
    ).toThrow("Total duration inversion is unavailable for an inherited series count.");
    expect(invertTotalDuration(base, 120).seriesCount).toBe(3);
  });
});

describe("PRE-4 story 2.1 — AC7 calcul de N à partir d'une Durée totale (FR-14-03)", () => {
  const d = 30;
  const p = 10;
  const pc = 10;

  /** T(N) par formule fermée, N = 1 normalisé « un côté après l'autre » si bilatéral. */
  function formulaT(side: SideMode, order: SideOrder, n: number): number {
    if (side === "UNILATERAL") return n * (d + p);
    if (n === 1 || order === "BY_SIDE") return 2 * n * (d + p) + pc;
    return n * (2 * d + p + pc);
  }

  function formulaBest(side: SideMode, order: SideOrder, requested: number) {
    let best = { n: 1, total: formulaT(side, order, 1) };
    for (let n = 2; n <= 99; n += 1) {
      const total = formulaT(side, order, n);
      if (Math.abs(total - requested) <= Math.abs(best.total - requested)) best = { n, total };
    }
    return best;
  }

  it("PRE4-2.1/AC7 — bornes : T(1) = 40 s, T(99) = 3 960 s, sans plafond à 58 min 55 s", () => {
    const range = totalDurationRange(uniformParameters({ mode: "DURATION", count: 3, target: d, pauseSeconds: p }));
    expect(range).toEqual({ min: 40, max: 3960 });
    expect(range.max).toBeGreaterThan(58 * 60 + 55);
  });

  it("PRE4-2.1/AC7 — Tv = 160 → N 4 sans ajustement ; Tv = 180 → égalité, N 5 (200 s), ajustement", () => {
    const parameters = uniformParameters({ mode: "DURATION", count: 3, target: d, pauseSeconds: p });
    expect(invertTotalDuration(parameters, 160)).toEqual({ seriesCount: 4, totalSeconds: 160, adjusted: false });
    expect(invertTotalDuration(parameters, 180)).toEqual({ seriesCount: 5, totalSeconds: 200, adjusted: true });
  });

  it("PRE4-2.1/AC7 — candidats des trois formules, au plus proche, égalité vers le plus grand N", () => {
    const configurations: readonly (readonly [SideMode, SideOrder])[] = [
      ["UNILATERAL", "BY_SIDE"],
      ["RIGHT_LEFT", "BY_SIDE"],
      ["LEFT_RIGHT", "BY_SERIES"],
    ];
    for (const [side, order] of configurations) {
      const parameters = uniformParameters({ mode: "DURATION", count: 3, target: d, pauseSeconds: p, sideMode: side, sideOrder: order, sideRecoverySeconds: pc });
      for (const requested of [1, 100, 333, 500, 1000, 9999]) {
        const expected = formulaBest(side, order, requested);
        expect(invertTotalDuration(parameters, requested)).toEqual({
          seriesCount: expected.n,
          totalSeconds: expected.total,
          adjusted: expected.total !== requested,
        });
      }
    }
  });

  it("PRE4-2.1/AC7 — un N = 1 issu de l'Inversion est normalisé par côté", () => {
    const parameters = uniformParameters({ mode: "DURATION", count: 3, target: d, pauseSeconds: p, sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES", sideRecoverySeconds: pc });
    expect(invertTotalDuration(parameters, 1)).toEqual({ seriesCount: 1, totalSeconds: 2 * (d + p) + pc, adjusted: true });
  });
});

describe("PRE-4 story 2.1 — AC8 calculs tirés des seules règles (FR-13-06)", () => {
  /** Total d'occurrence par formule fermée (travail inconnu exclu, Récupération substituée à PN). */
  function formulaOccurrence(rows: readonly Row[], side: SideMode, order: SideOrder, pc: number, recovery: number): number {
    const n = rows.length;
    const work = sum(rows.map(([target]) => (typeof target === "number" ? target : 0)));
    const pauses = sum(rows.map(([, pause]) => pause));
    const effectiveOrder = n === 1 ? "BY_SIDE" : order;
    const total =
      side === "UNILATERAL" ? work + pauses : effectiveOrder === "BY_SIDE" ? 2 * (work + pauses) + pc : 2 * work + pauses + n * pc;
    return recovery > 0 ? total - rows[n - 1]![1] + recovery : total;
  }

  function expectedKind(rows: readonly Row[]): ExerciseDurationResult["kind"] {
    const failures = rows.filter(([target]) => target === "FAILURE").length;
    return failures === 0 ? "exact" : failures === rows.length ? "omitted" : "lowerBound";
  }

  const ninetyNine: Row[] = Array.from({ length: 99 }, () => [30, 10] as const);
  const ninetyNineMixed: Row[] = ninetyNine.map((row, index) => (index === 49 ? (["FAILURE", 10] as const) : row));
  const rowSets: Readonly<Record<string, readonly Row[]>> = {
    numeric: [[30, 10], [45, 20], [60, 30]],
    failureHead: [["FAILURE", 10], [45, 20], [60, 30]],
    failureMiddle: [[30, 10], ["FAILURE", 20], [60, 30]],
    failureEnd: [[30, 10], [45, 20], ["FAILURE", 30]],
    pauseZero: [[30, 0], ["FAILURE", 0], [45, 20]],
    single: [[90, 15]],
    singleFailure: [["FAILURE", 15]],
    ninetyNine,
    ninetyNineMixed,
  };
  const sides: readonly (readonly [SideMode, SideOrder])[] = [
    ["UNILATERAL", "BY_SIDE"],
    ["RIGHT_LEFT", "BY_SIDE"],
    ["RIGHT_LEFT", "BY_SERIES"],
    ["LEFT_RIGHT", "BY_SIDE"],
    ["LEFT_RIGHT", "BY_SERIES"],
  ];

  it("PRE4-2.1/AC8 — matrice : côtés × ordres, Pause 0 et PC 0, Récupération nulle et positive, N 1 et N 99, mélange en tête, milieu et fin", () => {
    for (const [name, rows] of Object.entries(rowSets)) {
      for (const [side, order] of sides) {
        for (const pc of [0, 15]) {
          for (const recovery of [0, 40]) {
            const result = computeOccurrenceDuration(mixed(rows, { side, order, pc }), recovery);
            const total = formulaOccurrence(rows, side, order, pc, recovery);
            const kind = expectedKind(rows);
            const context = `${name} ${side} ${order} PC ${pc} R ${recovery}`;
            expect({ context, kind: result.kind, known: result.knownSeconds }).toEqual({ context, kind, known: total });
            expect({ context, seconds: result.seconds }).toEqual({ context, seconds: kind === "omitted" ? undefined : total });
          }
        }
      }
    }
  });

  const definition = (executionParameters: ExecutionParameters): ActivityDefinition => ({
    id: "def-ac8",
    movementId: "mov-1",
    name: "Gainage",
    description: null,
    executionParameters,
    bodyZoneIds: ["z"],
    sideMode: executionParameters.sideMode,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

  const replays: readonly ExecutionParameters[] = [
    mixed([[30, 10], [45, 20], [60, 30]], { side: "RIGHT_LEFT", order: "BY_SERIES", pc: 15 }),
    mixed([[30, 10], ["FAILURE", 20], [45, 30]], { side: "RIGHT_LEFT", order: "BY_SERIES", pc: 15 }),
    mixed([["FAILURE", 10], ["FAILURE", 20], ["FAILURE", 30]]),
    mixed([[30, 10], ["UNSET", 10], [45, 10]]),
  ];

  it("PRE4-2.1/AC8 — même montant et même nature après Mode aller-retour, déplacement, copie et Instantané v2", () => {
    for (const original of replays) {
      const reference = computeIntrinsicDuration(original);
      const same = (parameters: ExecutionParametersInput) => {
        const result = computeIntrinsicDuration(parameters);
        expect({ kind: result.kind, seconds: result.seconds, known: result.knownSeconds }).toEqual({
          kind: reference.kind,
          seconds: reference.seconds,
          known: reference.knownSeconds,
        });
      };
      const draft = openSheetDraft(original);
      same(effectiveParameters(setMode(setMode(draft, "REPETITIONS"), "DURATION")));
      same(effectiveParameters(moveRow(draft, 2, 0)));
      same(activityDefinitionToDraftExercise(definition(original), "copy", 0).executionParameters);
      const snapshot = createExerciseSnapshot({
        name: "Gainage",
        categoryId: null,
        bodyZoneIds: ["z"],
        executionParameters: original,
        recoverySeconds: 0,
        media: [],
      });
      same(parseExerciseSnapshot(serializeExerciseSnapshot(snapshot)).executionParameters);
    }
  });
});

describe("PRE-4 story 2.2 — AC2 Récupération positive en remplacement de la seule Pause terminale (FR-15-02)", () => {
  const r01 = () => mixed([[30, 10], [45, 10], ["FAILURE", 10]]);
  const recoveries = (result: ExerciseDurationResult) => result.events.filter((event) => event.kind === "RECOVERY");

  it("PRE4-2.2/AC2 — attendu : 30 / 45 / échec, Pauses 10 × 3, R 40 → intrinsèque 105 s, occurrence 105 − 10 + 40 = 135 s ≥, formaté « ≥ 2 min 15 s »", () => {
    expectResult(computeIntrinsicDuration(r01()), "lowerBound", 105, 105);
    const occurrence = computeOccurrenceDuration(r01(), 40);
    expectResult(occurrence, "lowerBound", 105 - 10 + 40, 135);
    expect(totalClauseAmount(occurrence)).toBe("≥ 2 min 15 s");
    // R n'est jamais ajoutée deux fois : une seule phase de Récupération.
    expect(recoveries(occurrence)).toEqual([{ kind: "RECOVERY", seconds: 40 }]);
  });

  it("PRE4-2.2/AC2 — R = 0 : To = T, aucune phase créée, PN conservée ; retirer R rétablit PN", () => {
    const withoutRecovery = computeOccurrenceDuration(r01(), 0);
    expectResult(withoutRecovery, "lowerBound", 105);
    expect(recoveries(withoutRecovery)).toEqual([]);
    const pauses = withoutRecovery.events.filter((event) => event.kind === "SERIES_PAUSE").map((event) => event.seconds);
    expect(pauses).toEqual([10, 10, 10]);
    // Retrait de la Récupération : même registre que l'intrinsèque.
    expect(computeOccurrenceDuration(r01(), 0)).toEqual(computeIntrinsicDuration(r01()));
  });

  it("PRE4-2.2/AC2 — bilatéral un côté après l'autre : la Pause du premier côté reste intacte, seule la dernière est remplacée", () => {
    // D1 P1 D2 P2 D3 P3 PC G1 P1 G2 P2 G3 P3 : travail connu 2 × 75, Pauses 6 × 10, PC 5.
    const parameters = mixed([[30, 10], [45, 10], ["FAILURE", 10]], { side: "RIGHT_LEFT", order: "BY_SIDE", pc: 5 });
    const intrinsic = 2 * (30 + 45) + 6 * 10 + 5;
    expectResult(computeIntrinsicDuration(parameters), "lowerBound", intrinsic);
    const occurrence = computeOccurrenceDuration(parameters, 40);
    expectResult(occurrence, "lowerBound", intrinsic - 10 + 40);
    const pauses = occurrence.events.filter((event) => event.kind === "SERIES_PAUSE");
    // Cinq Pauses restent, dont la dernière Pause du premier côté.
    expect(pauses).toHaveLength(5);
    expect(pauses.some((event) => event.kind === "SERIES_PAUSE" && event.series === 3 && event.side === "RIGHT")).toBe(true);
    expect(recoveries(occurrence)).toEqual([{ kind: "RECOVERY", seconds: 40 }]);
  });

  it("PRE4-2.2/AC2 — la substitution précède la qualification de la nature, pour les quatre natures et `incomplete`", () => {
    const cases: readonly { parameters: ExecutionParametersInput; kind: ExerciseDurationResult["kind"]; known: number }[] = [
      { parameters: mixed([[30, 10], [45, 10], [60, 10]]), kind: "exact", known: 165 },
      { parameters: mixed([[10, 10], [12, 10], [15, 10]], { mode: "REPETITIONS", beep: 2 }), kind: "estimated", known: 37 * 2 + 30 },
      { parameters: r01(), kind: "lowerBound", known: 105 },
      { parameters: mixed([["FAILURE", 10], ["FAILURE", 10], ["FAILURE", 10]]), kind: "omitted", known: 30 },
      { parameters: mixed([[30, 10], ["UNSET", 10], [45, 10]]), kind: "incomplete", known: 105 },
    ];
    for (const { parameters, kind, known } of cases) {
      const occurrence = computeOccurrenceDuration(parameters, 40);
      expect(occurrence.kind).toBe(kind);
      expect(occurrence.knownSeconds).toBe(known - 10 + 40);
      expect(occurrence.seconds).toBe(kind === "omitted" || kind === "incomplete" ? undefined : known - 10 + 40);
    }
  });

  it("PRE4-2.2/AC2 — après un déplacement de Séries, la nouvelle dernière ligne est déterminée avant la substitution", () => {
    // 30/10, 45/20, échec/30 → déplacement de la Série 3 en tête : échec/30, 30/10, 45/20 ; R remplace 20.
    const moved = effectiveParameters(moveRow(openSheetDraft(mixed([[30, 10], [45, 20], ["FAILURE", 30]])), 2, 0));
    expectResult(computeOccurrenceDuration(moved, 40), "lowerBound", 30 + 45 + 10 + 30 + 40);
  });

  it("PRE4-2.2/AC2 — un Exercice calculé seul n'a aucune Récupération : PN reste comptée, aucune Récupération créée", () => {
    const alone = computeIntrinsicDuration(r01());
    expect(recoveries(alone)).toEqual([]);
    expect(alone.knownSeconds).toBe(30 + 45 + 3 * 10);
  });
});

describe("PRE-4 story 2.2 — AC3 Pauses d'un Exercice omis ou partiel dans le total (FR-15-03)", () => {
  it("PRE4-2.2/AC3 — Répétitions 10 / 12 / échec, Bip 0, Pauses 10 × 3 → contribution 30 s ; avec R 40 → 10 + 10 + 40 = 60 s", () => {
    const parameters = mixed([[10, 10], [12, 10], ["FAILURE", 10]], { mode: "REPETITIONS", beep: 0 });
    expectResult(computeIntrinsicDuration(parameters), "omitted", undefined, 30);
    expectResult(computeOccurrenceDuration(parameters, 40), "omitted", undefined, 10 + 10 + 40);
  });

  it("PRE4-2.2/AC3 — trois Cibles à l'échec, Pauses 10 × 3 → contribution 30 s, Séance `lowerBound`", () => {
    const result = computeIntrinsicDuration(mixed([["FAILURE", 10], ["FAILURE", 10], ["FAILURE", 10]]));
    expectResult(result, "omitted", undefined, 30);
    expect(aggregateSessionDuration([{ result, multiplicity: 1 }])).toEqual({ kind: "lowerBound", seconds: 30 });
  });

  it("PRE4-2.2/AC3 — bilatéral, les deux côtés à chaque série : 30 / échec, Pauses 10 / 10, PC 5 → 90 s ≥ ; avec R 40 → 120 s ≥", () => {
    const parameters = mixed([[30, 10], ["FAILURE", 10]], { side: "RIGHT_LEFT", order: "BY_SERIES", pc: 5 });
    const knownWork = 2 * 30;
    expect(knownWork).toBe(60);
    const intrinsic = computeIntrinsicDuration(parameters);
    expectResult(intrinsic, "lowerBound", knownWork + 20 + 2 * 5, 90);
    expect(totalClauseAmount(intrinsic)).toBe("≥ 1 min 30 s");
    const occurrence = computeOccurrenceDuration(parameters, 40);
    expectResult(occurrence, "lowerBound", 90 - 10 + 40, 120);
    expect(totalClauseAmount(occurrence)).toBe("≥ 2 min");
    // Succession D1 → PC → G1 → P1 → D2 → PC → G2 → P2, chaque phase une fois.
    const sequence = intrinsic.events.map((event) => {
      switch (event.kind) {
        case "WORK":
          return `${event.side === "RIGHT" ? "D" : "G"}${event.series}`;
        case "SIDE_PAUSE":
          return "PC";
        case "SERIES_PAUSE":
          return `P${event.series}`;
        default:
          return "R";
      }
    });
    expect(sequence).toEqual(["D1", "PC", "G1", "P1", "D2", "PC", "G2", "P2"]);
    // La Cible typée s'applique aux deux côtés : travail connu en Série 1, inconnu en Série 2, des deux côtés.
    const works = intrinsic.events.filter((event) => event.kind === "WORK").map((event) => event.seconds);
    expect(works).toEqual([30, 30, null, null]);
  });

  it("PRE4-2.2/AC3 — contrôle un côté après l'autre : 2 × (30 + 10 + 10) + 5 = 105 s ; occurrence avec R 40 → 135 s ≥", () => {
    const parameters = mixed([[30, 10], ["FAILURE", 10]], { side: "RIGHT_LEFT", order: "BY_SIDE", pc: 5 });
    expectResult(computeIntrinsicDuration(parameters), "lowerBound", 2 * (30 + 10 + 10) + 5);
    expectResult(computeOccurrenceDuration(parameters, 40), "lowerBound", 105 - 10 + 40, 135);
    const works = computeIntrinsicDuration(parameters).events.filter((event) => event.kind === "WORK").map((event) => event.seconds);
    expect(works).toEqual([30, null, 30, null]);
  });
});

describe("PRE-4 story 2.2 — AC4 nature du total de Séance et de Circuit (FR-15-04, P25)", () => {
  // Contributions de référence, montants connus écrits dans le test.
  const exact165 = computeIntrinsicDuration(mixed([[30, 10], [45, 10], [60, 10]]));
  const estimated104 = computeIntrinsicDuration(mixed([[10, 10], [12, 10], [15, 10]], { mode: "REPETITIONS", beep: 2 }));
  const lowerBound105 = computeIntrinsicDuration(mixed([[30, 10], [45, 10], ["FAILURE", 10]]));
  const omitted30 = computeIntrinsicDuration(mixed([[10, 10], [12, 10], [15, 10]], { mode: "REPETITIONS", beep: 0 }));
  const incomplete105 = computeIntrinsicDuration(mixed([[30, 10], ["UNSET", 10], [45, 10]]));
  const once = (result: ExerciseDurationResult) => ({ result, multiplicity: 1 });

  it("PRE4-2.2/AC4 — natures : ≥ dès un `lowerBound`, `omitted` ou `incomplete` ; sinon ≈ dès un `estimated` ; sinon exact", () => {
    expect(aggregateSessionDuration([once(exact165), once(exact165)]).kind).toBe("exact");
    expect(aggregateSessionDuration([once(exact165), once(estimated104)]).kind).toBe("estimated");
    for (const partial of [lowerBound105, omitted30, incomplete105]) {
      expect(aggregateSessionDuration([once(exact165), once(partial)]).kind).toBe("lowerBound");
      expect(aggregateSessionDuration([once(estimated104), once(partial)]).kind).toBe("lowerBound");
    }
  });

  it("PRE4-2.2/AC4 — montant : Σ des montants + Σ des contributions connues des `omitted` et des `incomplete`", () => {
    expect(
      aggregateSessionDuration([once(exact165), once(estimated104), once(lowerBound105), once(omitted30), once(incomplete105)]),
    ).toEqual({ kind: "lowerBound", seconds: 165 + 104 + 105 + 30 + 105 });
  });

  it("PRE4-2.2/AC4 — Circuit répété k fois : k fois, sans multiplicateur double", () => {
    expect(aggregateSessionDuration([{ result: lowerBound105, multiplicity: 2 }])).toEqual({ kind: "lowerBound", seconds: 210 });
  });
});

/**
 * PRE-5 story 1.1 (AC14, NR Δ47, AD-5, AD-20) — un Exercice à phases est lu par les
 * calculs existants sans modification : la durée de série est la Cible dérivée (Σ).
 */
describe("PRE5-1.1/AC14 — phases lues par les calculs existants (NR Δ47)", () => {
  const phased = uniformParameters({
    mode: "DURATION",
    count: 3,
    target: 9,
    pauseSeconds: 15,
    workPhases: [
      { id: 1, label: "Descente", durationSeconds: 6 },
      { id: 2, label: "Maintien", durationSeconds: 3 },
    ],
  });

  it("6 s + 3 s, 3 séries, Pause 15 s : D = 9 s par série, Durée de l'exercice 72 s, identique à une Cible de 9 s sans phases", () => {
    const work = buildExecutionLedger(phased).filter((event) => event.kind === "WORK");
    expect(work.map((event) => event.seconds)).toEqual([9, 9, 9]);
    expect(computeIntrinsicDuration(phased)).toEqual(expect.objectContaining({ kind: "exact", seconds: 72 }));
    expect(computeIntrinsicDuration(phased)).toEqual(computeIntrinsicDuration(uniformParameters({ mode: "DURATION", count: 3, target: 9, pauseSeconds: 15 })));
    // Inversion du total : seul N change, les phases restent.
    expect(invertTotalDuration(phased, 96)).toEqual({ seriesCount: 4, totalSeconds: 96, adjusted: false });
  });

  it("Δ48 — la charge ne change aucun calcul : Durée, Répétitions × identiques, Répétitions × variables, à l'échec", () => {
    const pairs: readonly [ExecutionParametersInput, ExecutionParametersInput][] = [
      [phased, { ...phased, loadEnabled: true, series: { ...(phased.series as Extract<ExecutionParameters["series"], { kind: "UNIFORM" }>), loadKg: 20 } }],
      [
        uniformParameters({ mode: "REPETITIONS", count: 3, target: 12, pauseSeconds: 10, cadenceBeepIntervalSeconds: 2 }),
        uniformParameters({ mode: "REPETITIONS", count: 3, target: 12, pauseSeconds: 10, cadenceBeepIntervalSeconds: 2, loadKg: 20, loadEnabled: true }),
      ],
      [
        variableParameters({ mode: "REPETITIONS", rows: [[12, 10], [10, 10]], cadenceBeepIntervalSeconds: 2 }),
        variableParameters({ mode: "REPETITIONS", rows: [[12, 10, 20], [10, 10, 12.5]], cadenceBeepIntervalSeconds: 2, loadEnabled: true }),
      ],
      [
        variableParameters({ mode: "REPETITIONS", rows: [[12, 10], ["FAILURE", 10]] }),
        variableParameters({ mode: "REPETITIONS", rows: [[12, 10, 20], ["FAILURE", 10, 20]], loadEnabled: true }),
      ],
    ];
    for (const [without, withLoad] of pairs) {
      expect(computeIntrinsicDuration(withLoad)).toEqual(computeIntrinsicDuration(without));
      expect(computeExercisePlanDuration(withLoad, 30)).toEqual(computeExercisePlanDuration(without, 30));
    }
  });
});

/**
 * PRE-6 (story 1.3, AD-40, ch10 L651) — passages d'un exercice dans un
 * Circuit de Séries. Valeurs imposées : 75 / 85 / 225 / 255 s.
 */
describe("PRE6-1.3 — computeSeriesCircuitOccurrenceDuration (Circuit de Séries)", () => {
  const bilateral = (count: number, sideRecoverySeconds = 5, sideOrder: SideOrder = "BY_SIDE") =>
    uniformParameters({
      mode: "DURATION",
      count,
      target: 30,
      pauseSeconds: 10,
      sideMode: "LEFT_RIGHT",
      sideRecoverySeconds,
      sideOrder,
    });

  it("passage bilatéral, N = 1 : 2Ti + PC + Pi = 75 s", () => {
    expect(computeSeriesCircuitOccurrenceDuration(bilateral(1), 0, 1)).toMatchObject({ kind: "exact", seconds: 75 });
  });

  it("avec R 20 : 2Ti + PC + R = 85 s (R remplace Pi)", () => {
    expect(computeSeriesCircuitOccurrenceDuration(bilateral(1), 20, 1)).toMatchObject({ kind: "exact", seconds: 85 });
  });

  it("trois passages : 225 s ; 255 s avec R 20 (R à chaque passage)", () => {
    expect(computeSeriesCircuitOccurrenceDuration(bilateral(3), 0, 3).seconds).toBe(225);
    expect(computeSeriesCircuitOccurrenceDuration(bilateral(3), 20, 3).seconds).toBe(255);
  });

  it("l'ordre des côtés réglé ne change rien et n'est pas réécrit", () => {
    const bySeries = bilateral(3, 5, "BY_SERIES");
    expect(computeSeriesCircuitOccurrenceDuration(bySeries, 0, 3).seconds).toBe(225);
    expect(bySeries.sideOrder).toBe("BY_SERIES");
  });

  it("aucun Pi avant PC : côté de départ → PC → autre côté → Pi", () => {
    expect(buildSeriesCircuitLedger(bilateral(1), 0, 1).map((event) => event.kind)).toEqual([
      "WORK",
      "SIDE_PAUSE",
      "WORK",
      "SERIES_PAUSE",
    ]);
    expect(buildSeriesCircuitLedger(bilateral(1), 20, 1).map((event) => event.kind)).toEqual([
      "WORK",
      "SIDE_PAUSE",
      "WORK",
      "RECOVERY",
    ]);
  });

  it("PC = 0 : Pi conservée (2Ti + Pi = 70 s)", () => {
    expect(computeSeriesCircuitOccurrenceDuration(bilateral(1, 0), 0, 1).seconds).toBe(70);
  });

  it("unilatéral, R = 0 : Ti + Pi par passage (R = 0 ne remplace rien)", () => {
    const unilateral = uniformParameters({ mode: "DURATION", count: 2, target: 30, pauseSeconds: 10 });
    expect(computeSeriesCircuitOccurrenceDuration(unilateral, 0, 2).seconds).toBe(80);
    expect(computeSeriesCircuitOccurrenceDuration(unilateral, 20, 2).seconds).toBe(100);
  });

  it("série i au passage i ; un exercice qui a moins de N séries ne contribue que ses séries existantes", () => {
    const rows = variableParameters({ mode: "DURATION", rows: [[30, 10], [40, 5]] });
    expect(computeSeriesCircuitOccurrenceDuration(rows, 0, 3).seconds).toBe(40 + 45);
    expect(computeSeriesCircuitOccurrenceDuration(rows, 0, 1).seconds).toBe(40);
  });

  it("nature : ≥ dès qu'une série jouée est À l'échec ; ≈ en Répétitions avec bip ; séries non jouées ignorées", () => {
    const failure = variableParameters({ mode: "DURATION", rows: [[30, 10], ["FAILURE", 10]] });
    expect(computeSeriesCircuitOccurrenceDuration(failure, 0, 2)).toMatchObject({ kind: "lowerBound", seconds: 50 });
    expect(computeSeriesCircuitOccurrenceDuration(failure, 0, 1)).toMatchObject({ kind: "exact", seconds: 40 });
    const beep = uniformParameters({ mode: "REPETITIONS", count: 2, target: 10, pauseSeconds: 10, cadenceBeepIntervalSeconds: 2 });
    expect(computeSeriesCircuitOccurrenceDuration(beep, 0, 2)).toMatchObject({ kind: "estimated", seconds: 60 });
  });
});
