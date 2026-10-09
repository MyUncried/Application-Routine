import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import type { ExecutionParametersInput, SideOrder } from "@/domain/activities/ExecutionParameters";
import {
  aggregateSessionDuration,
  computeExercisePlanDuration,
  computeIntrinsicDuration,
  computeOccurrenceDuration,
  invertTotalDuration,
  isTotalDurationInvertible,
  totalDurationRange,
} from "@/domain/activities/executionCalculations";
import { moveRow, openSheetDraft, effectiveParameters } from "@/domain/activities/ExecutionParametersDraft";
import { generateExecutionPhrase, phraseText } from "@/domain/activities/executionPhrase";
import type { SideMode } from "@/domain/sessions/sideMode";

/**
 * Attendus écrits AVANT le développement, indépendants de l'application :
 * `attendus-numeriques.json` (13 cas normatifs) — lu tel quel, jamais
 * recalculé ici.
 */
const PLANNING = path.resolve(__dirname, "../../../../docs/preparation/PRE-3/planification");
type OracleGiven = {
  readonly base?: string;
  readonly mode?: "DURATION" | "REPETITIONS" | "TO_FAILURE";
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

function toParameters(given: Required<Pick<OracleGiven, "mode" | "pauses">> & OracleGiven): ExecutionParametersInput {
  const count = given.pauses.length;
  const targets = given.targets ?? given.pauses.map(() => null);
  const rows = given.pauses.map((pauseSeconds, index) => ({ target: targets[index] ?? null, pauseSeconds }));
  return {
    version: 1,
    mode: given.mode,
    series: count === 1 ? { kind: "UNIFORM", count: 1, ...rows[0]! } : { kind: "VARIABLE", rows },
    sideMode: given.side ?? "UNILATERAL",
    sideOrder: given.orderRequested ?? given.order ?? "BY_SIDE",
    sideRecoverySeconds: given.sidePause ?? 0,
    cadenceBeepIntervalSeconds: given.cadence ?? 0,
    countdownSeconds: 10,
    endSeconds: 5,
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
  const base = { countdownSeconds: 10, endSeconds: 5, version: 1 } as const;

  it("aucune convention historique de 2 s par répétition", () => {
    const repetitions: ExecutionParametersInput = {
      ...base,
      mode: "REPETITIONS",
      series: { kind: "UNIFORM", count: 3, target: 12, pauseSeconds: 0 },
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
      mode: "DURATION",
      series: { kind: "UNIFORM", count: 1, target: 30, pauseSeconds: 15 },
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
    version: 1,
    mode: "REPETITIONS",
    series: {
      kind: "VARIABLE",
      rows: [
        { target: 12, pauseSeconds: 30 },
        { target: 10, pauseSeconds: 45 },
        { target: 8, pauseSeconds: 60 },
      ],
    },
    sideMode: side,
    sideOrder: order,
    sideRecoverySeconds: sidePause,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
  };
}

function caseA(overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 1,
    mode: "DURATION",
    series: {
      kind: "VARIABLE",
      rows: [
        { target: 30, pauseSeconds: 10 },
        { target: 45, pauseSeconds: 20 },
        { target: 60, pauseSeconds: 30 },
      ],
    },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    ...overrides,
  };
}

describe("P3-13/R-terminal — R remplace la seule Pause terminale", () => {
  it("A : 285 avec R120 ; N1 bilatéral : 235 avec R30 ; R0/absent sans effet", () => {
    expect(computeOccurrenceDuration(caseA(), 120).seconds).toBe(285);
    expect(computeOccurrenceDuration(caseA(), 0).seconds).toBe(195);
    const n1 = caseA({
      series: { kind: "UNIFORM", count: 1, target: 90, pauseSeconds: 15 },
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
    version: 1,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 1, target: 30, pauseSeconds: 10 },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 0,
    endSeconds: 0,
    ...overrides,
  });

  it("T=30, P=10 : demandé 100 → N=3/120 s avec message ; 80 → N=2 sans message", () => {
    expect(invertTotalDuration(uniform30(), 100)).toEqual({ seriesCount: 3, totalSeconds: 120, adjusted: true });
    expect(invertTotalDuration(uniform30(), 80)).toEqual({ seriesCount: 2, totalSeconds: 80, adjusted: false });
  });

  it("cas 6423:9953 : 3 × 90 s, Pause 15 s → 5 min 15 s sans ajustement", () => {
    const parameters = uniform30({ series: { kind: "UNIFORM", count: 1, target: 90, pauseSeconds: 15 } });
    expect(invertTotalDuration(parameters, 315)).toEqual({ seriesCount: 3, totalSeconds: 315, adjusted: false });
  });
});

describe("P3-14/inverse-boundaries", () => {
  const bilateral: ExecutionParametersInput = {
    version: 1,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 5, target: 30, pauseSeconds: 10 },
    sideMode: "RIGHT_LEFT",
    sideOrder: "BY_SERIES",
    sideRecoverySeconds: 5,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 0,
    endSeconds: 0,
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

  it("inversion désactivée en variable, Répétitions et À l'échec", () => {
    expect(isTotalDurationInvertible(bilateral)).toBe(true);
    expect(isTotalDurationInvertible({ ...bilateral, mode: "REPETITIONS" })).toBe(false);
    expect(
      isTotalDurationInvertible({
        ...bilateral,
        mode: "TO_FAILURE",
        series: { kind: "UNIFORM", count: 5, target: null, pauseSeconds: 10 },
      }),
    ).toBe(false);
    expect(
      isTotalDurationInvertible({
        ...bilateral,
        series: { kind: "VARIABLE", rows: [{ target: 30, pauseSeconds: 10 }, { target: 30, pauseSeconds: 10 }] },
      }),
    ).toBe(false);
    expect(() => invertTotalDuration({ ...bilateral, mode: "REPETITIONS" }, 100)).toThrow();
  });
});

describe("P3-08/immediate-N1 — calcul du brouillon à N=1", () => {
  it("variable N3 par paire réduite à N1 : 220 s, ordre demandé non utilisé", () => {
    const draft = openSheetDraft({
      version: 1,
      mode: "DURATION",
      series: {
        kind: "VARIABLE",
        rows: [
          { target: 90, pauseSeconds: 15 },
          { target: 45, pauseSeconds: 20 },
          { target: 60, pauseSeconds: 30 },
        ],
      },
      sideMode: "RIGHT_LEFT",
      sideOrder: "BY_SERIES",
      sideRecoverySeconds: 10,
      cadenceBeepIntervalSeconds: 0,
      countdownSeconds: 10,
      endSeconds: 5,
    });
    const reduced = { ...draft, count: 1, rows: draft.rows.slice(0, 1), hiddenRows: draft.rows.slice(1) };
    expect(computeIntrinsicDuration(effectiveParameters(reduced)).seconds).toBe(220);
  });
});
