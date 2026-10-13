import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import type { ExecutionParametersInput, SideOrder } from "@/domain/activities/ExecutionParameters";
import { computeIntrinsicDuration } from "@/domain/activities/executionCalculations";
import { generateExecutionPhrase, phraseText, type PhraseSegment } from "@/domain/activities/executionPhrase";
import type { SideMode } from "@/domain/sessions/sideMode";

/**
 * Corpus v15 figé AVANT développement (`attendus-phrases-276.json`) : texte,
 * segments gras et montant calculé indépendamment de l'application et
 * d'Excel. Le montant d'exemple du classeur n'est jamais lu ici.
 */
type CorpusCase = {
  readonly corpusId: number;
  readonly parameters: {
    readonly mode: "DURATION" | "REPETITIONS" | "TO_FAILURE";
    readonly seriesKind: "UNIFORM" | "VARIABLE";
    readonly targets: readonly (number | null)[];
    readonly pauses: readonly number[];
    readonly cadence: number;
    readonly side: SideMode;
    readonly order: SideOrder;
    readonly sidePause: number;
  };
  readonly expectedIntrinsic: { readonly kind: string; readonly seconds?: number; readonly knownSeconds: number };
  readonly expectedText: string;
  readonly expectedSegments: readonly PhraseSegment[];
};

const corpus: readonly CorpusCase[] = JSON.parse(
  readFileSync(
    path.resolve(__dirname, "../../../../docs/preparation/PRE-3/planification/attendus-phrases-276.json"),
    "utf8",
  ),
).cases;

function toInput(parameters: CorpusCase["parameters"]): ExecutionParametersInput {
  const rows = parameters.pauses.map((pauseSeconds, index) => ({
    target: parameters.targets[index] ?? null,
    pauseSeconds,
  }));
  return {
    version: 1,
    mode: parameters.mode,
    series:
      parameters.seriesKind === "VARIABLE"
        ? { kind: "VARIABLE", rows }
        : { kind: "UNIFORM", count: rows.length, target: rows[0]!.target, pauseSeconds: rows[0]!.pauseSeconds },
    sideMode: parameters.side,
    sideOrder: parameters.order,
    sideRecoverySeconds: parameters.sidePause,
    cadenceBeepIntervalSeconds: parameters.cadence,
    countdownSeconds: 10,
    endSeconds: 5,
  };
}

describe("P3-15/corpus-276 — 276 phrases v15 (P3-15/corpus/n)", () => {
  it("le corpus contient 276 cas et la distribution 140 sans total / 46 ≈ / 90 exacts", () => {
    expect(corpus).toHaveLength(276);
    const withoutTotal = corpus.filter((c) => !c.expectedText.includes("Durée totale"));
    const estimated = corpus.filter((c) => c.expectedText.includes("≈"));
    expect([withoutTotal.length, estimated.length, 276 - withoutTotal.length - estimated.length]).toEqual([140, 46, 90]);
  });

  it.each(corpus.map((c) => [c.corpusId, c] as const))("cas %i : texte, segments gras et montant", (_id, c) => {
    const input = toInput(c.parameters);
    const intrinsic = computeIntrinsicDuration(input);
    expect(intrinsic.kind).toBe(c.expectedIntrinsic.kind);
    expect(intrinsic.knownSeconds).toBe(c.expectedIntrinsic.knownSeconds);
    const segments = generateExecutionPhrase(input);
    expect(segments).toEqual(c.expectedSegments);
    expect(phraseText(segments!)).toBe(c.expectedText);
  });
});

function duration(overrides: Partial<ExecutionParametersInput>): ExecutionParametersInput {
  return {
    version: 1,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 1, target: 30, pauseSeconds: 0 },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    ...overrides,
  };
}

const text = (input: ExecutionParametersInput) => phraseText(generateExecutionPhrase(input)!);

describe("P3-15/grammar-edges", () => {
  it("N1 unilatéral D30 : P0 omet seulement le total redondant, P15 affiche 45 s", () => {
    expect(text(duration({}))).toBe("1 série de 30 s.");
    expect(text(duration({ series: { kind: "UNIFORM", count: 1, target: 30, pauseSeconds: 15 } }))).toBe(
      "1 série de 30 s, avec 15 s de pause après chaque série. Durée totale : 45 s.",
    );
  });

  it("variable : 2 et 3 cibles énumérées avec « puis » ; plus de 3 → vrai min/max des cibles actives", () => {
    const rows = (targets: readonly number[]) => ({
      kind: "VARIABLE" as const,
      rows: targets.map((target) => ({ target, pauseSeconds: 20 })),
    });
    expect(text(duration({ series: rows([45, 30]) }))).toBe(
      "2 séries de durée variable (45 s puis 30 s). Durée totale : 1 min 55 s.",
    );
    expect(text(duration({ series: rows([60, 30, 45]) }))).toBe(
      "3 séries de durée variable (1 min, 30 s puis 45 s). Durée totale : 3 min 15 s.",
    );
    // Lignes réordonnées : le min/max ne dépend jamais de la première/dernière ligne.
    expect(text(duration({ series: rows([90, 30, 120, 60]) }))).toBe(
      "4 séries variables, de 30 s à 2 min. Durée totale : 6 min 20 s.",
    );
    // Lignes égales : l'état variable explicite est conservé dans la grammaire.
    expect(text(duration({ series: rows([30, 30, 30]) }))).toBe(
      "3 séries de durée variable (30 s, 30 s puis 30 s). Durée totale : 2 min 30 s.",
    );
  });

  it("la clause des pauses variables est omise sans perte de données dans le calcul", () => {
    const input = duration({
      series: {
        kind: "VARIABLE",
        rows: [
          { target: 30, pauseSeconds: 10 },
          { target: 45, pauseSeconds: 20 },
        ],
      },
    });
    expect(text(input)).not.toMatch(/pause/);
    expect(computeIntrinsicDuration(input).seconds).toBe(105);
  });

  it("P3-09/directions — départ gauche : directions inversées pour les trois formes", () => {
    const uniform = { kind: "UNIFORM" as const, count: 3, target: 30, pauseSeconds: 0 };
    expect(text(duration({ series: uniform, sideMode: "LEFT_RIGHT", sideOrder: "BY_SIDE" }))).toContain(
      "en faisant d’abord toutes les séries à gauche, puis à droite",
    );
    expect(text(duration({ series: uniform, sideMode: "LEFT_RIGHT", sideOrder: "BY_SERIES" }))).toContain(
      "en alternant le côté gauche puis le droit à chaque série",
    );
    expect(text(duration({ sideMode: "LEFT_RIGHT" }))).toContain("en faisant le côté gauche puis le droit");
  });

  it("Répétitions : « cadencées » seulement si bip > 0 ; Durée et À l'échec n'ont jamais de clause de bip", () => {
    const reps = duration({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 2, target: 1, pauseSeconds: 0 } });
    expect(text(reps)).toBe("2 séries de 1 répétition, enchaînées sans pause.");
    expect(text({ ...reps, cadenceBeepIntervalSeconds: 3 })).toBe(
      "2 séries de 1 répétition cadencées toutes les 3 s, enchaînées sans pause. Durée totale : ≈ 6 s.",
    );
    expect(text(duration({ cadenceBeepIntervalSeconds: 4 }))).not.toMatch(/cadenc/);
  });

  it("deux valeurs identiques à des positions différentes restent deux segments distincts", () => {
    const segments = generateExecutionPhrase(
      duration({ series: { kind: "UNIFORM", count: 2, target: 15, pauseSeconds: 15 } }),
    )!;
    expect(segments.filter((segment) => segment.gras && segment.texte === "15 s")).toHaveLength(2);
  });

  it("brouillon incomplet : aucune phrase inventée", () => {
    expect(generateExecutionPhrase(duration({ mode: null }))).toBeNull();
    expect(generateExecutionPhrase(duration({ series: { kind: "UNIFORM", count: 2, target: null, pauseSeconds: 0 } }))).toBeNull();
  });
});

describe("P3-15/long-phrase — cas 144, 224 caractères", () => {
  it("phrase intégrale générée sans troncature", () => {
    const c = corpus.find((item) => item.corpusId === 144)!;
    const generated = text(toInput(c.parameters));
    expect(generated).toHaveLength(224);
    expect(generated.endsWith("Durée totale : ≈ 12 min 41 s.")).toBe(true);
  });
});
