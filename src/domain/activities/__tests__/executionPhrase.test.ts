import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  EXECUTION_PARAMETERS_VERSION,
  failureTarget,
  numberTarget,
  unsetTarget,
  type ExecutionParametersInput,
  type SeriesTarget,
  type SideOrder,
} from "@/domain/activities/ExecutionParameters";
import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import { computeIntrinsicDuration } from "@/domain/activities/executionCalculations";
import { parseExerciseSnapshot, serializeExerciseSnapshot } from "@/domain/activities/exerciseSnapshot";
import {
  generateExecutionPhrase,
  phraseText,
  totalClauseAmount,
  type PhraseSegment,
} from "@/domain/activities/executionPhrase";
import type { SideMode } from "@/domain/sessions/sideMode";

/**
 * PRE-4 (story 2.3, AC13, FR-17-03, P26, P43) — ADAPTATION EXPLICITE ET
 * NOMMÉE des 92 anciennes entrées « À l’échec » du corpus, sans modifier
 * aucun des deux fichiers. Elle remplace l'adaptation minimale de la
 * story 1.1. Le littéral de l'ancien troisième mode n'apparaît qu'ici
 * (garde `legacyModeConfinement.test.ts`, AD-3).
 *
 * Règle : Mode Répétitions (rejeu : Mode Durée), toutes les Cibles `FAILURE` ;
 * N, Pauses, Bip, côtés, Ordre des côtés et PC conservés.
 */
const LEGACY_FAILURE_MODE = "TO_FAILURE";

function isLegacyFailureCase(c: CorpusCase): boolean {
  return c.parameters.mode === LEGACY_FAILURE_MODE;
}

function adaptLegacyFailureCase(c: CorpusCase, mode: "REPETITIONS" | "DURATION"): ExecutionParametersInput {
  if (!isLegacyFailureCase(c)) {
    throw new Error(`Le cas ${c.corpusId} n'est pas une ancienne entrée « À l’échec ».`);
  }
  return buildInput(c.parameters, mode, () => failureTarget());
}

/**
 * Corpus v15 figé AVANT développement (`attendus-phrases-276.json`) : texte,
 * segments gras et montant calculé indépendamment de l'application et
 * d'Excel. Le montant d'exemple du classeur n'est jamais lu ici.
 */
type CorpusCase = {
  readonly corpusId: number;
  readonly parameters: {
    readonly mode: "DURATION" | "REPETITIONS" | typeof LEGACY_FAILURE_MODE;
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

/** Oracle source (P43) : 276 phrases du classeur v15, jamais modifié. */
type OracleCase = { readonly id: number; readonly phraseSource: string; readonly phraseGabarit: string };

const oracle: readonly OracleCase[] = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../../../docs/archives/evolutions-v15-2026-10-07/phrases-276.json"), "utf8"),
);

/** Clause « Durée totale » d'une phrase : symbole éventuel et montant. */
const TOTAL_CLAUSE = /Durée totale : (≈ |≥ )?([^.]*)\./u;

/** Cibles des cas numériques (`NUMBER`) ; une Cible absente reste à renseigner, jamais 0. */
function numericTarget(c: CorpusCase, index: number): SeriesTarget {
  const target = c.parameters.targets[index];
  return target === null || target === undefined ? unsetTarget() : numberTarget(target);
}

function buildInput(
  parameters: CorpusCase["parameters"],
  mode: "REPETITIONS" | "DURATION",
  targetAt: (index: number) => SeriesTarget,
): ExecutionParametersInput {
  const rows = parameters.pauses.map((pauseSeconds, index) => ({ target: targetAt(index), pauseSeconds }));
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode,
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

/** Entrée d'un cas du corpus : adaptation nommée pour les 92 anciennes entrées, Cibles `NUMBER` sinon. */
function toInput(c: CorpusCase): ExecutionParametersInput {
  if (isLegacyFailureCase(c)) {
    return adaptLegacyFailureCase(c, "REPETITIONS");
  }
  const mode = c.parameters.mode === "DURATION" ? "DURATION" : "REPETITIONS";
  return buildInput(c.parameters, mode, (index) => numericTarget(c, index));
}

/**
 * Total intrinsèque d'un cas NUMÉRIQUE du corpus, par formule écrite dans le
 * test (AD-10, FR-17-02) — jamais par `executionCalculations` ni Excel.
 * Ti = d (Durée) ou R × b (Répétitions). Unilatéral : Σ (Ti + Pi). Un côté
 * après l'autre (et N = 1 bilatéral, normalisé) : 2 Σ (Ti + Pi) + PC. Les deux
 * côtés à chaque série : Σ (2 Ti + Pi + PC).
 */
function corpusFormulaSeconds(c: CorpusCase): number {
  const p = c.parameters;
  const n = p.pauses.length;
  const work = (index: number) => {
    const target = p.targets[index];
    if (target === null || target === undefined) {
      throw new Error(`Cas ${c.corpusId} : Cible ${index + 1} absente, aucun total par formule.`);
    }
    return p.mode === "DURATION" ? target : target * p.cadence;
  };
  let workAndPauses = 0;
  for (let index = 0; index < n; index += 1) {
    workAndPauses += work(index) + p.pauses[index]!;
  }
  if (p.side === "UNILATERAL") {
    return workAndPauses;
  }
  if (n === 1 || p.order === "BY_SIDE") {
    return 2 * workAndPauses + p.sidePause;
  }
  let total = 0;
  for (let index = 0; index < n; index += 1) {
    total += 2 * work(index) + p.pauses[index]! + p.sidePause;
  }
  return total;
}

describe("P3-15/corpus-276 — 276 phrases v15 (P3-15/corpus/n)", () => {
  it("PRE4-2.3/AC12 — le corpus contient 276 cas et la distribution 140 sans total / 46 ≈ / 90 exacts, aucune ≥", () => {
    expect(corpus).toHaveLength(276);
    expect(corpus.filter(isLegacyFailureCase)).toHaveLength(92);
    const withoutTotal = corpus.filter((c) => !c.expectedText.includes("Durée totale"));
    const estimated = corpus.filter((c) => c.expectedText.includes("≈"));
    expect([withoutTotal.length, estimated.length, 276 - withoutTotal.length - estimated.length]).toEqual([140, 46, 90]);
    expect(corpus.filter((c) => c.expectedText.includes("≥"))).toHaveLength(0);
    // 184 cas numériques (Durée et Répétitions) : nature inchangée, jamais partielle.
    const numeric = corpus.filter((c) => !isLegacyFailureCase(c));
    expect(numeric).toHaveLength(184);
    expect(numeric.filter((c) => computeIntrinsicDuration(toInput(c)).kind === "lowerBound")).toHaveLength(0);
  });

  it("PRE4-2.3/AC12 — P43 : les 276 phrases de l'encodage de test sont identiques à celles de l'oracle source (montant du total mis à part)", () => {
    expect(oracle).toHaveLength(276);
    expect(new Set(oracle.map((item) => item.id)).size).toBe(276);
    // Le montant d'exemple d'Excel n'est jamais une règle : il est masqué des deux côtés avant comparaison.
    const masked = (text: string) => text.replace(TOTAL_CLAUSE, "Durée totale : $1{total}.");
    const mismatches = corpus.filter((c) => {
      const source = oracle.find((item) => item.id === c.corpusId);
      const encoded = masked(c.expectedText);
      return source === undefined || encoded !== source.phraseGabarit || encoded !== masked(source.phraseSource);
    });
    expect(mismatches.map((c) => c.corpusId)).toEqual([]);
  });

  it.each(corpus.map((c) => [c.corpusId, c] as const))("cas %i : texte, segments gras et montant", (_id, c) => {
    const input = toInput(c);
    const intrinsic = computeIntrinsicDuration(input);
    expect(intrinsic.kind).toBe(c.expectedIntrinsic.kind);
    expect(intrinsic.knownSeconds).toBe(c.expectedIntrinsic.knownSeconds);
    const segments = generateExecutionPhrase(input);
    expect(segments).toEqual(c.expectedSegments);
    expect(phraseText(segments!)).toBe(c.expectedText);
    // AC12 : le gabarit de l'oracle, dont le montant est remplacé par le total calculé par formule.
    const gabarit = oracle.find((item) => item.id === c.corpusId)!.phraseGabarit;
    const formulaText = gabarit.includes("{total}")
      ? gabarit.replace("{total}", formatPhraseDuration(corpusFormulaSeconds(c)))
      : gabarit;
    expect(phraseText(segments!)).toBe(formulaText);
    // AC11 : jamais « 0 s ».
    expect(phraseText(segments!)).not.toMatch(/(^|[^0-9])0 s/u);
  });

  it("PRE4-2.3/AC12 — aucune clause ajoutée aux 120 cas en Régime variables (ni Pause, ni Pauses énumérées, ni ≥)", () => {
    const variable = corpus.filter((c) => c.parameters.seriesKind === "VARIABLE");
    expect(variable).toHaveLength(120);
    for (const c of variable) {
      const generated = phraseText(generateExecutionPhrase(toInput(c))!);
      expect({ id: c.corpusId, generated }).toEqual({ id: c.corpusId, generated: c.expectedText });
      expect(generated).not.toMatch(/après chaque série|enchaînées sans pause|≥/u);
    }
  });
});

describe("PRE4-2.3/AC13 — les 92 anciennes entrées « À l’échec », adaptation nommée et rejeu en Durée", () => {
  const legacy = corpus.filter(isLegacyFailureCase);

  it("PRE4-2.3/AC13 — 92 entrées, dont 46 avec Bip 4 s", () => {
    expect(legacy).toHaveLength(92);
    expect(legacy.filter((c) => c.parameters.cadence === 4)).toHaveLength(46);
    expect(legacy.filter((c) => c.parameters.cadence === 0)).toHaveLength(46);
  });

  it.each(legacy.map((c) => [c.corpusId, c] as const))(
    "PRE4-2.3/AC13 — cas %i : même sortie en Répétitions et en Durée, toutes Cibles à l'échec",
    (_id, c) => {
      for (const mode of ["REPETITIONS", "DURATION"] as const) {
        const input = adaptLegacyFailureCase(c, mode);
        // Seuls le Mode et les Cibles changent : N, Pauses, Bip, côtés, Ordre et PC sont ceux du cas source.
        const p = c.parameters;
        expect(input).toEqual({
          version: EXECUTION_PARAMETERS_VERSION,
          mode,
          series:
            p.seriesKind === "VARIABLE"
              ? { kind: "VARIABLE", rows: p.pauses.map((pauseSeconds) => ({ target: failureTarget(), pauseSeconds })) }
              : { kind: "UNIFORM", count: p.pauses.length, target: failureTarget(), pauseSeconds: p.pauses[0] },
          sideMode: p.side,
          sideOrder: p.order,
          sideRecoverySeconds: p.sidePause,
          cadenceBeepIntervalSeconds: p.cadence,
          countdownSeconds: 10,
          endSeconds: 5,
        });
        if (p.seriesKind === "UNIFORM") {
          expect(new Set(p.pauses).size).toBe(1);
        }
        const segments = generateExecutionPhrase(input);
        expect(segments).toEqual(c.expectedSegments);
        expect(phraseText(segments!)).toBe(c.expectedText);
        const intrinsic = computeIntrinsicDuration(input);
        expect(intrinsic.kind).toBe("omitted");
        expect(intrinsic.knownSeconds).toBe(c.expectedIntrinsic.knownSeconds);
        // Sans clause de cadence ni Durée totale, avec ou sans Bip (P26).
        expect(phraseText(segments!)).not.toMatch(/cadenc|Durée totale/u);
      }
    },
  );

  it("PRE4-2.3/AC13 — attendus littéraux : id 251 (Bip 4 s) et id 276", () => {
    const byId = (id: number) => legacy.find((c) => c.corpusId === id)!;
    expect(byId(251).parameters.cadence).toBe(4);
    for (const mode of ["REPETITIONS", "DURATION"] as const) {
      expect(phraseText(generateExecutionPhrase(adaptLegacyFailureCase(byId(251), mode))!)).toBe(
        "3 séries menées jusqu’à l’échec, en faisant d’abord toutes les séries à droite, puis à gauche, avec 5 s de pause au changement de côté.",
      );
      expect(phraseText(generateExecutionPhrase(adaptLegacyFailureCase(byId(276), mode))!)).toBe(
        "6 séries menées jusqu’à l’échec, en faisant d’abord toutes les séries à droite, puis à gauche, avec 5 s de pause au changement de côté.",
      );
    }
  });
});

function duration(overrides: Partial<ExecutionParametersInput>): ExecutionParametersInput {
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 1, target: numberTarget(30), pauseSeconds: 0 },
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
    expect(text(duration({ series: { kind: "UNIFORM", count: 1, target: numberTarget(30), pauseSeconds: 15 } }))).toBe(
      "1 série de 30 s, avec 15 s de pause après chaque série. Durée totale : 45 s.",
    );
  });

  it("variable : 2 et 3 cibles énumérées avec « puis » ; plus de 3 → vrai min/max des cibles actives", () => {
    const rows = (targets: readonly number[]) => ({
      kind: "VARIABLE" as const,
      rows: targets.map((target) => ({ target: numberTarget(target), pauseSeconds: 20 })),
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
          { target: numberTarget(30), pauseSeconds: 10 },
          { target: numberTarget(45), pauseSeconds: 20 },
        ],
      },
    });
    expect(text(input)).not.toMatch(/pause/);
    expect(computeIntrinsicDuration(input).seconds).toBe(105);
  });

  it("P3-09/directions — départ gauche : directions inversées pour les trois formes", () => {
    const uniform = { kind: "UNIFORM" as const, count: 3, target: numberTarget(30), pauseSeconds: 0 };
    expect(text(duration({ series: uniform, sideMode: "LEFT_RIGHT", sideOrder: "BY_SIDE" }))).toContain(
      "en faisant d’abord toutes les séries à gauche, puis à droite",
    );
    expect(text(duration({ series: uniform, sideMode: "LEFT_RIGHT", sideOrder: "BY_SERIES" }))).toContain(
      "en alternant le côté gauche puis le droit à chaque série",
    );
    expect(text(duration({ sideMode: "LEFT_RIGHT" }))).toContain("en faisant le côté gauche puis le droit");
  });

  it("Répétitions : « cadencées » seulement si bip > 0 ; Durée et À l'échec n'ont jamais de clause de bip", () => {
    const reps = duration({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 2, target: numberTarget(1), pauseSeconds: 0 } });
    expect(text(reps)).toBe("2 séries de 1 répétition, enchaînées sans pause.");
    expect(text({ ...reps, cadenceBeepIntervalSeconds: 3 })).toBe(
      "2 séries de 1 répétition cadencées toutes les 3 s, enchaînées sans pause. Durée totale : ≈ 6 s.",
    );
    expect(text(duration({ cadenceBeepIntervalSeconds: 4 }))).not.toMatch(/cadenc/);
  });

  it("deux valeurs identiques à des positions différentes restent deux segments distincts", () => {
    const segments = generateExecutionPhrase(
      duration({ series: { kind: "UNIFORM", count: 2, target: numberTarget(15), pauseSeconds: 15 } }),
    )!;
    expect(segments.filter((segment) => segment.gras && segment.texte === "15 s")).toHaveLength(2);
  });

  it("brouillon incomplet : aucune phrase inventée", () => {
    expect(generateExecutionPhrase(duration({ mode: null }))).toBeNull();
    expect(generateExecutionPhrase(duration({ series: { kind: "UNIFORM", count: 2, target: unsetTarget(), pauseSeconds: 0 } }))).toBeNull();
  });
});

describe("P3-15/long-phrase — cas 144, 224 caractères", () => {
  it("phrase intégrale générée sans troncature", () => {
    const c = corpus.find((item) => item.corpusId === 144)!;
    const generated = text(toInput(c));
    expect(generated).toHaveLength(224);
    expect(generated.endsWith("Durée totale : ≈ 12 min 41 s.")).toBe(true);
  });
});

describe("executionPhrase — PRE-4 story 2.1", () => {
  const rows = (targets: readonly SeriesTarget[]): ExecutionParametersInput => ({
    version: EXECUTION_PARAMETERS_VERSION,
    mode: "DURATION",
    series: { kind: "VARIABLE", rows: targets.map((target) => ({ target, pauseSeconds: 10 })) },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 0,
    endSeconds: 0,
  });

  it("PRE4-2.1/AC9 — clause Durée totale : « ≥ » pour un montant partiel, aucune clause pour omis ou à renseigner", () => {
    const partial = computeIntrinsicDuration(rows([numberTarget(30), numberTarget(45), failureTarget()]));
    expect(partial.kind).toBe("lowerBound");
    // (30 + 45) + 3 × 10 = 105 s.
    expect(totalClauseAmount(partial)).toBe("≥ 1 min 45 s");
    expect(totalClauseAmount(computeIntrinsicDuration(rows([failureTarget(), failureTarget()])))).toBeNull();
    expect(totalClauseAmount(computeIntrinsicDuration(rows([numberTarget(30), unsetTarget()])))).toBeNull();
    expect(totalClauseAmount(computeIntrinsicDuration(rows([numberTarget(30), numberTarget(45)])))).toBe("1 min 35 s");
  });

  it("PRE4-2.3/AC10 — phrases : mélange avec « ≥ », tout échec sans total ni « 0 s », à renseigner `null`", () => {
    expect(phraseText(generateExecutionPhrase(rows([numberTarget(30), numberTarget(45), failureTarget()]))!)).toBe(
      "3 séries de durée variable (30 s, 45 s puis jusqu’à l’échec). Durée totale : ≥ 1 min 45 s.",
    );
    expect(generateExecutionPhrase(rows([numberTarget(30), unsetTarget()]))).toBeNull();
    const failure = phraseText(generateExecutionPhrase(rows([failureTarget(), failureTarget()]))!);
    expect(failure).not.toMatch(/Durée totale|(^|[^0-9])0 s|—/u);
  });

  it("PRE4-2.1/AC9 — Cible à renseigner en Régime identiques : phrase `null`, aucune clause (`incomplete`)", () => {
    const uniformUnset: ExecutionParametersInput = {
      ...rows([]),
      series: { kind: "UNIFORM", count: 3, target: unsetTarget(), pauseSeconds: 10 },
    };
    expect(generateExecutionPhrase(uniformUnset)).toBeNull();
    const result = computeIntrinsicDuration(uniformUnset);
    expect(result.kind).toBe("incomplete");
    expect(totalClauseAmount(result)).toBeNull();
  });

  it("PRE4-2.3/AC8 — mélange en Répétitions avec Bip 0 : énumération, sans clause Durée totale (`omitted`)", () => {
    const repetitionsMix: ExecutionParametersInput = {
      ...rows([numberTarget(10), numberTarget(12), failureTarget()]),
      mode: "REPETITIONS",
      cadenceBeepIntervalSeconds: 0,
    };
    expect(phraseText(generateExecutionPhrase(repetitionsMix)!)).toBe(
      "3 séries de répétitions variables (10, 12 puis jusqu’à l’échec).",
    );
    const result = computeIntrinsicDuration(repetitionsMix);
    expect(result.kind).toBe("omitted");
    expect(totalClauseAmount(result)).toBeNull();
  });
});

/**
 * PRE-4 story 2.3 — Phrase des paramètres pour les Cibles mixtes et corpus.
 * Attendus écrits à la main (gabarits au caractère près, apostrophe ’) ;
 * totaux recalculés par formule dans le test, jamais par le générateur ni par
 * `executionCalculations` (AD-10, FR-17-04).
 */
type CompactTarget = number | "FAILURE" | "UNSET";

type CompactInput = {
  readonly mode: "DURATION" | "REPETITIONS";
  readonly series: "UNIFORM" | "VARIABLE";
  readonly targets: readonly CompactTarget[];
  readonly pauses: readonly number[];
  readonly bip?: number;
  readonly side?: SideMode;
  readonly order?: SideOrder;
  readonly pc?: number;
};

function compactTarget(target: CompactTarget): SeriesTarget {
  if (target === "FAILURE") {
    return failureTarget();
  }
  return target === "UNSET" ? unsetTarget() : numberTarget(target);
}

function fromCompact(input: CompactInput): ExecutionParametersInput {
  const rows = input.pauses.map((pauseSeconds, index) => ({
    target: compactTarget(input.targets[index] ?? input.targets[0]!),
    pauseSeconds,
  }));
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode: input.mode,
    series:
      input.series === "VARIABLE"
        ? { kind: "VARIABLE", rows }
        : { kind: "UNIFORM", count: rows.length, target: rows[0]!.target, pauseSeconds: rows[0]!.pauseSeconds },
    sideMode: input.side ?? "UNILATERAL",
    sideOrder: input.order ?? "BY_SIDE",
    sideRecoverySeconds: input.pc ?? 0,
    cadenceBeepIntervalSeconds: input.bip ?? 0,
    countdownSeconds: 10,
    endSeconds: 5,
  };
}

const phraseOf = (input: CompactInput): string => phraseText(generateExecutionPhrase(fromCompact(input))!);

/**
 * Total d'une variante par formule (AD-10) : travail connu ou estimable des
 * Cibles `NUMBER` (Ti = d en Durée, R × b en Répétitions avec Bip) + toutes les
 * Pauses (+ PC), selon la formule de côtés de `corpusFormulaSeconds`. Nature :
 * `≥` si une Cible est à l'échec, `≈` en Répétitions avec Bip, exacte sinon ;
 * `null` quand le total est omis (tout à l'échec, Répétitions sans Bip).
 */
function variantFormulaTotal(input: CompactInput): { readonly symbol: string; readonly seconds: number } | null {
  const n = input.pauses.length;
  const targetAt = (index: number) => input.targets[index] ?? input.targets[0]!;
  const allFailure = input.pauses.every((_, index) => targetAt(index) === "FAILURE");
  const bip = input.bip ?? 0;
  if (allFailure || (input.mode === "REPETITIONS" && bip === 0)) {
    return null;
  }
  const work = (index: number) => {
    const target = targetAt(index);
    if (typeof target !== "number") {
      return 0;
    }
    return input.mode === "DURATION" ? target : target * bip;
  };
  const side = input.side ?? "UNILATERAL";
  const pc = input.pc ?? 0;
  let seconds = 0;
  for (let index = 0; index < n; index += 1) {
    seconds += work(index) + input.pauses[index]!;
  }
  if (side !== "UNILATERAL") {
    if (n === 1 || (input.order ?? "BY_SIDE") === "BY_SIDE") {
      seconds = 2 * seconds + pc;
    } else {
      seconds = 0;
      for (let index = 0; index < n; index += 1) {
        seconds += 2 * work(index) + input.pauses[index]! + pc;
      }
    }
  }
  const mixed = input.pauses.some((_, index) => targetAt(index) === "FAILURE");
  return { symbol: mixed ? "≥ " : input.mode === "REPETITIONS" ? "≈ " : "", seconds };
}

const NO_ZERO_SECONDS = /(^|[^0-9])0 s/u;

describe("PRE-4 story 2.3 — gabarits de la Phrase", () => {
  it("PRE4-2.3/AC1 — génération pure : deux sorties identiques, segments compris ; concaténation exacte ; UNSET ou Mode non choisi → null ; ni Mode en tête ni Compte à rebours ni Fin", () => {
    const input = fromCompact({ mode: "REPETITIONS", series: "VARIABLE", targets: [10, "FAILURE", 10], pauses: [10, 10, 10], bip: 2 });
    const first = generateExecutionPhrase(input)!;
    const second = generateExecutionPhrase(input)!;
    expect(second).toEqual(first);
    expect(phraseText(first)).toBe(
      "3 séries de répétitions variables (10, jusqu’à l’échec puis 10), cadencées toutes les 2 s. Durée totale : ≥ 1 min 10 s.",
    );
    // (10 × 2 + 10 × 2) + 3 × 10 = 70 s.
    expect(first.map((segment) => segment.texte).join("")).toBe(phraseText(first));
    // Deux valeurs identiques : deux segments gras distincts, décidés par le gabarit.
    expect(first.filter((segment) => segment.gras && segment.texte === "10")).toHaveLength(2);
    // Cible à renseigner, seule ou au milieu d'un mélange : aucune phrase.
    for (const targets of [[30, "UNSET", "FAILURE"], ["UNSET", "FAILURE", "FAILURE"], [30, 45, "UNSET"]] as const) {
      expect(generateExecutionPhrase(fromCompact({ mode: "DURATION", series: "VARIABLE", targets, pauses: [10, 10, 10] }))).toBeNull();
    }
    expect(generateExecutionPhrase({ ...input, mode: null })).toBeNull();
    // Compte à rebours (37 s) et Fin (23 s) hors de la phrase ; le Mode n'ouvre pas la phrase.
    const withPhases = phraseText(generateExecutionPhrase({ ...input, countdownSeconds: 37, endSeconds: 23 })!);
    expect(withPhases).toBe(phraseText(first));
    expect(withPhases).not.toMatch(/37 s|23 s|^Répétitions|^Durée/u);
  });

  it("PRE4-2.3/AC2 — gras des valeurs et des unités (H9) : « jusqu’à l’échec » et « à l’échec » normaux, « 10 rép. » gras, ≥ dans le segment du montant", () => {
    // L'AC2 écrit `3` (gras) + ` séries de ` (normal), mais le corpus figé (AC12, P43) met « 3 séries » en un
    // seul segment gras : le comportement du corpus est conservé, voir la règle P46 de
    // `docs/preparation/PRE-4/bmad/questions-ouvertes.md`.
    expect(generateExecutionPhrase(fromCompact({ mode: "DURATION", series: "UNIFORM", targets: [30], pauses: [0, 0, 0] }))!.slice(0, 3)).toEqual([
      { texte: "3 séries", gras: true },
      { texte: " de ", gras: false },
      { texte: "30 s", gras: true },
    ]);
    expect(
      generateExecutionPhrase(fromCompact({ mode: "REPETITIONS", series: "VARIABLE", targets: [10, 12, 15, "FAILURE"], pauses: [10, 10, 10, 10] })),
    ).toEqual([
      { texte: "4 séries", gras: true },
      { texte: " variables, de ", gras: false },
      { texte: "10 rép.", gras: true },
      { texte: " à l’échec.", gras: false },
    ]);
    expect(generateExecutionPhrase(fromCompact({ mode: "DURATION", series: "VARIABLE", targets: [30, 45, "FAILURE"], pauses: [10, 10, 10] }))).toEqual([
      { texte: "3 séries", gras: true },
      { texte: " de durée variable (", gras: false },
      { texte: "30 s", gras: true },
      { texte: ", ", gras: false },
      { texte: "45 s", gras: true },
      { texte: " puis jusqu’à l’échec). Durée totale : ", gras: false },
      { texte: "≥ 1 min 45 s", gras: true },
      { texte: ".", gras: false },
    ]);
    // Mélange en Répétitions : valeurs nues en gras, « de répétitions variables ( » normal (FR-16-02).
    expect(generateExecutionPhrase(fromCompact({ mode: "REPETITIONS", series: "VARIABLE", targets: ["FAILURE", 10, 12], pauses: [10, 10, 10] }))).toEqual([
      { texte: "3 séries", gras: true },
      { texte: " de répétitions variables (jusqu’à l’échec, ", gras: false },
      { texte: "10", gras: true },
      { texte: " puis ", gras: false },
      { texte: "12", gras: true },
      { texte: ").", gras: false },
    ]);
    // Énumération tout numérique : gras du corpus conservé (valeurs nues normales, dernière avec unité en gras).
    expect(generateExecutionPhrase(fromCompact({ mode: "REPETITIONS", series: "VARIABLE", targets: [12, 10, 8], pauses: [0, 0, 0] }))).toEqual([
      { texte: "3 séries", gras: true },
      { texte: " de 12, 10 puis ", gras: false },
      { texte: "8 répétitions", gras: true },
      { texte: ".", gras: false },
    ]);
  });

  it("PRE4-2.3/AC3 — Cibles toutes numériques : gabarits inchangés, min et max sur les Cibles", () => {
    expect(phraseOf({ mode: "DURATION", series: "UNIFORM", targets: [90], pauses: [0] })).toBe("1 série de 1 min 30 s.");
    expect(phraseOf({ mode: "DURATION", series: "VARIABLE", targets: [30, 45, 60], pauses: [0, 0, 0] })).toBe(
      "3 séries de durée variable (30 s, 45 s puis 1 min). Durée totale : 2 min 15 s.",
    );
    // 30 + 45 + 60 = 135 s.
    expect(phraseOf({ mode: "DURATION", series: "VARIABLE", targets: [60, 30, 45, 105, 90, 75], pauses: [0, 0, 0, 0, 0, 0] })).toMatch(
      /^6 séries variables, de 30 s à 1 min 45 s\./u,
    );
    expect(phraseOf({ mode: "REPETITIONS", series: "UNIFORM", targets: [12], pauses: [0, 0, 0] })).toBe(
      "3 séries de 12 répétitions, enchaînées sans pause.",
    );
    expect(phraseOf({ mode: "REPETITIONS", series: "VARIABLE", targets: [12, 10, 8], pauses: [10, 10, 10] })).toBe(
      "3 séries de 12, 10 puis 8 répétitions.",
    );
    expect(phraseOf({ mode: "REPETITIONS", series: "VARIABLE", targets: [10, 6, 15, 8, 12, 9], pauses: [10, 10, 10, 10, 10, 10] })).toBe(
      "6 séries variables, de 6 à 15 répétitions.",
    );
    // N = 1 issu d'un Régime variables : normalisé en Régime identiques.
    expect(phraseOf({ mode: "DURATION", series: "VARIABLE", targets: [90], pauses: [0] })).toBe("1 série de 1 min 30 s.");
  });

  it("PRE4-2.3/AC4 — cadence du Bip : Répétitions numériques et mélanges seulement ; jamais en Durée ni en tout échec", () => {
    expect(phraseOf({ mode: "REPETITIONS", series: "VARIABLE", targets: [12, 10, 8], pauses: [0, 0, 0], bip: 4 })).toMatch(
      /^3 séries de 12, 10 puis 8 répétitions cadencées toutes les 4 s\./u,
    );
    expect(phraseOf({ mode: "REPETITIONS", series: "VARIABLE", targets: [10, 6, 15, 8, 12, 9], pauses: [0, 0, 0, 0, 0, 0], bip: 4 })).toMatch(
      /^6 séries variables, de 6 à 15 répétitions cadencées toutes les 4 s\./u,
    );
    expect(phraseOf({ mode: "DURATION", series: "UNIFORM", targets: [90], pauses: [0], bip: 4 })).toBe("1 série de 1 min 30 s.");
    expect(phraseOf({ mode: "REPETITIONS", series: "UNIFORM", targets: ["FAILURE"], pauses: [0, 0, 0], bip: 4 })).not.toMatch(/cadenc/u);
    expect(phraseOf({ mode: "REPETITIONS", series: "VARIABLE", targets: [10, 12, 15, "FAILURE"], pauses: [10, 10, 10, 10], bip: 2 })).toMatch(
      /^4 séries variables, de 10 rép\. à l’échec, cadencées toutes les 2 s\./u,
    );
    expect(phraseOf({ mode: "REPETITIONS", series: "VARIABLE", targets: [10, "FAILURE", 12], pauses: [10, 10, 10], bip: 2 })).toMatch(
      /^3 séries de répétitions variables \(10, jusqu’à l’échec puis 12\), cadencées toutes les 2 s\./u,
    );
    expect(phraseOf({ mode: "DURATION", series: "VARIABLE", targets: [30, 45, "FAILURE"], pauses: [10, 10, 10], bip: 4 })).not.toMatch(/cadenc/u);
  });

  it("PRE4-2.3/AC5 — clause de Pause : Régime identiques seulement ; aucune en Régime variables, même mélangé ou tout échec ; le calcul garde les Pauses", () => {
    expect(phraseOf({ mode: "DURATION", series: "UNIFORM", targets: [90], pauses: [15] })).toBe(
      "1 série de 1 min 30 s, avec 15 s de pause après chaque série. Durée totale : 1 min 45 s.",
    );
    expect(phraseOf({ mode: "DURATION", series: "UNIFORM", targets: [90], pauses: [0, 0] })).toMatch(/, enchaînées sans pause\./u);
    expect(phraseOf({ mode: "DURATION", series: "UNIFORM", targets: [90], pauses: [0] })).not.toMatch(/pause/u);
    for (const targets of [[30, 45, "FAILURE"], ["FAILURE", "FAILURE", "FAILURE"], [30, 45, 60]] as const) {
      for (const mode of ["DURATION", "REPETITIONS"] as const) {
        const input: CompactInput = { mode, series: "VARIABLE", targets, pauses: [10, 20, 30], bip: 2 };
        expect(phraseOf(input)).not.toMatch(/pause|10 s, 20 s/u);
      }
    }
    // Mixte Figma : Pauses 10 / 20 / 30 s omises de la phrase, comptées dans le calcul : 75 + 60 = 135 s.
    const figma = fromCompact({ mode: "DURATION", series: "VARIABLE", targets: [30, 45, "FAILURE"], pauses: [10, 20, 30] });
    expect(computeIntrinsicDuration(figma).seconds).toBe(30 + 45 + 10 + 20 + 30);
    expect(phraseText(generateExecutionPhrase(figma)!)).toBe(
      "3 séries de durée variable (30 s, 45 s puis jusqu’à l’échec). Durée totale : ≥ 2 min 15 s.",
    );
  });

  it("PRE4-2.3/AC6 — clause des côtés, départ droit et gauche, PC", () => {
    expect(phraseOf({ mode: "DURATION", series: "UNIFORM", targets: [90], pauses: [0], side: "RIGHT_LEFT" })).toBe(
      "1 série de 1 min 30 s, en faisant le côté droit puis le gauche. Durée totale : 3 min.",
    );
    const three: CompactInput = { mode: "DURATION", series: "UNIFORM", targets: [90], pauses: [15, 15, 15], side: "RIGHT_LEFT", order: "BY_SERIES", pc: 5 };
    // 3 × (2 × 90 + 15 + 5) = 600 s.
    expect(phraseOf(three)).toBe(
      "3 séries de 1 min 30 s, avec 15 s de pause après chaque série, en alternant le côté droit puis le gauche à chaque série, avec 5 s de pause au changement de côté. Durée totale : 10 min.",
    );
    expect(phraseOf({ ...three, order: "BY_SIDE", pc: 0 })).toMatch(/, en faisant d’abord toutes les séries à droite, puis à gauche\. /u);
    expect(phraseOf({ ...three, side: "LEFT_RIGHT" })).toMatch(/, en alternant le côté gauche puis le droit à chaque série, avec 5 s/u);
    expect(phraseOf({ ...three, side: "LEFT_RIGHT", order: "BY_SIDE" })).toMatch(/, en faisant d’abord toutes les séries à gauche, puis à droite, avec 5 s/u);
    expect(phraseOf({ mode: "DURATION", series: "UNIFORM", targets: [90], pauses: [0], side: "LEFT_RIGHT" })).toMatch(
      /, en faisant le côté gauche puis le droit\. /u,
    );
    expect(phraseOf({ mode: "DURATION", series: "UNIFORM", targets: [90], pauses: [0, 0], side: "UNILATERAL", pc: 5 })).not.toMatch(/côté/u);
  });

  it("PRE4-2.3/AC7 — tout à l'échec : quatre Phrases identiques (Durée/Répétitions × Bip 0/4 s), « menées », sans total ni Bip", () => {
    const cases: readonly [CompactInput, string][] = [
      [
        { mode: "DURATION", series: "UNIFORM", targets: ["FAILURE"], pauses: [0, 0, 0], side: "RIGHT_LEFT", order: "BY_SIDE", pc: 5 },
        "3 séries menées jusqu’à l’échec, enchaînées sans pause, en faisant d’abord toutes les séries à droite, puis à gauche, avec 5 s de pause au changement de côté.",
      ],
      [{ mode: "DURATION", series: "UNIFORM", targets: ["FAILURE"], pauses: [10, 10, 10] }, "3 séries menées jusqu’à l’échec, avec 10 s de pause après chaque série."],
      [{ mode: "DURATION", series: "VARIABLE", targets: ["FAILURE", "FAILURE", "FAILURE"], pauses: [10, 20, 30] }, "3 séries menées jusqu’à l’échec."],
      [{ mode: "DURATION", series: "UNIFORM", targets: ["FAILURE"], pauses: [0] }, "1 série menée jusqu’à l’échec."],
    ];
    for (const [input, expected] of cases) {
      for (const mode of ["DURATION", "REPETITIONS"] as const) {
        for (const bip of [0, 4]) {
          const generated = phraseOf({ ...input, mode, bip });
          expect({ mode, bip, generated }).toEqual({ mode, bip, generated: expected });
          expect(generated).not.toMatch(/séries jusqu’à|Durée totale|cadenc/u);
        }
      }
    }
  });

  it("PRE4-2.3/AC8 — mélange de 3 Cibles ou moins : énumération dans l'ordre, en Durée et en Répétitions", () => {
    const duration = (targets: readonly CompactTarget[]) =>
      phraseOf({ mode: "DURATION", series: "VARIABLE", targets, pauses: targets.map(() => 10) });
    expect(duration([30, 45, "FAILURE"])).toMatch(/^3 séries de durée variable \(30 s, 45 s puis jusqu’à l’échec\)/u);
    expect(duration(["FAILURE", 30, 45])).toMatch(/^3 séries de durée variable \(jusqu’à l’échec, 30 s puis 45 s\)/u);
    expect(duration([30, "FAILURE", 45])).toMatch(/^3 séries de durée variable \(30 s, jusqu’à l’échec puis 45 s\)/u);
    expect(duration([30, "FAILURE"])).toMatch(/^2 séries de durée variable \(30 s puis jusqu’à l’échec\)/u);
    const repetitions = (targets: readonly CompactTarget[], bip = 0) =>
      phraseOf({ mode: "REPETITIONS", series: "VARIABLE", targets, pauses: targets.map(() => 10), bip });
    expect(repetitions([10, 12, "FAILURE"])).toBe("3 séries de répétitions variables (10, 12 puis jusqu’à l’échec).");
    expect(repetitions(["FAILURE", 10, 12])).toBe("3 séries de répétitions variables (jusqu’à l’échec, 10 puis 12).");
    expect(repetitions([10, "FAILURE", 12])).toBe("3 séries de répétitions variables (10, jusqu’à l’échec puis 12).");
    expect(repetitions([10, "FAILURE"])).toBe("2 séries de répétitions variables (10 puis jusqu’à l’échec).");
    expect(repetitions([10, 12, "FAILURE"], 2)).toMatch(/^3 séries de répétitions variables \(10, 12 puis jusqu’à l’échec\), cadencées toutes les 2 s/u);
    expect(repetitions([10, "FAILURE", 12], 2)).toMatch(/^3 séries de répétitions variables \(10, jusqu’à l’échec puis 12\), cadencées toutes les 2 s/u);
    // Phrases complètes : (30 + 45) + 3 × 10 = 105 s ; (10 × 2 + 12 × 2) + 3 × 10 = 74 s.
    expect(duration([30, 45, "FAILURE"])).toBe("3 séries de durée variable (30 s, 45 s puis jusqu’à l’échec). Durée totale : ≥ 1 min 45 s.");
    expect(repetitions([10, 12, "FAILURE"], 2)).toBe(
      "3 séries de répétitions variables (10, 12 puis jusqu’à l’échec), cadencées toutes les 2 s. Durée totale : ≥ 1 min 14 s.",
    );
    // Formes réservées au mélange : un Régime variables tout numérique en Répétitions garde son gabarit.
    expect(repetitions([12, 10, 8])).toBe("3 séries de 12, 10 puis 8 répétitions.");
  });

  it("PRE4-2.3/AC9 — mélange de plus de 3 Cibles : compaction sur le minimum des Cibles NUMBER ; tout égal numérique inchangé (H17)", () => {
    const pauses = [10, 10, 10, 10];
    expect(phraseOf({ mode: "REPETITIONS", series: "VARIABLE", targets: [10, 12, "FAILURE", 20], pauses })).toBe("4 séries variables, de 10 rép. à l’échec.");
    expect(phraseOf({ mode: "REPETITIONS", series: "VARIABLE", targets: [20, "FAILURE", 12, 10], pauses })).toBe("4 séries variables, de 10 rép. à l’échec.");
    expect(phraseOf({ mode: "DURATION", series: "VARIABLE", targets: [90, 120, "FAILURE", 150], pauses })).toMatch(
      /^4 séries variables, de 1 min 30 s à l’échec\./u,
    );
    // (30 + 45 + 60) + 4 × 10 = 175 s.
    expect(phraseOf({ mode: "DURATION", series: "VARIABLE", targets: [30, 45, 60, "FAILURE"], pauses })).toBe(
      "4 séries variables, de 30 s à l’échec. Durée totale : ≥ 2 min 55 s.",
    );
    expect(phraseOf({ mode: "REPETITIONS", series: "VARIABLE", targets: [10, 12, 15, "FAILURE"], pauses })).toBe("4 séries variables, de 10 rép. à l’échec.");
    // (10 + 12 + 15) × 2 + 4 × 10 = 114 s.
    expect(phraseOf({ mode: "REPETITIONS", series: "VARIABLE", targets: [10, 12, 15, "FAILURE"], pauses, bip: 2 })).toMatch(
      / Durée totale : ≥ 1 min 54 s\.$/u,
    );
    expect(phraseOf({ mode: "DURATION", series: "VARIABLE", targets: [30, 30, 30, 30, 30, 30], pauses: [0, 0, 0, 0, 0, 0] })).toMatch(
      /^6 séries variables, de 30 s à 30 s\./u,
    );
  });

  it("PRE4-2.3/AC10 — Durée totale : exacte, ≈, ≥ ; omise sans zéro ni tiret ; redondance N = 1 unilatéral sans Pause seulement", () => {
    const case101 = corpus.find((c) => c.corpusId === 101)!;
    expect(phraseText(generateExecutionPhrase(toInput(case101))!)).toMatch(/ Durée totale : ≈ 1 min 41 s\.$/u);
    // 2 × (12 × 4 + 0) + 5 = 101 s.
    expect(corpusFormulaSeconds(case101)).toBe(101);
    expect(phraseOf({ mode: "DURATION", series: "VARIABLE", targets: [30, 45, "FAILURE"], pauses: [10, 20, 30] })).toMatch(/ Durée totale : ≥ 2 min 15 s\.$/u);
    for (const input of [
      { mode: "REPETITIONS", series: "VARIABLE", targets: [10, 12, "FAILURE"], pauses: [10, 10, 10] },
      { mode: "REPETITIONS", series: "UNIFORM", targets: [12], pauses: [10, 10] },
      { mode: "DURATION", series: "UNIFORM", targets: ["FAILURE"], pauses: [10, 10] },
    ] as const) {
      expect(phraseOf(input)).not.toMatch(/Durée totale|—|(^|[^0-9])0 s/u);
    }
    expect(phraseOf({ mode: "DURATION", series: "UNIFORM", targets: [90], pauses: [0] })).toBe("1 série de 1 min 30 s.");
    expect(phraseOf({ mode: "DURATION", series: "UNIFORM", targets: [90], pauses: [15] })).toMatch(/ Durée totale : 1 min 45 s\.$/u);
    expect(phraseOf({ mode: "DURATION", series: "UNIFORM", targets: [90], pauses: [0], side: "RIGHT_LEFT" })).toMatch(/ Durée totale : 3 min\.$/u);
    // La Récupération de Séance n'est pas une entrée du générateur : la phrase ne dépend que des Paramètres.
    expect(generateExecutionPhrase.length).toBe(1);
  });

  it("PRE4-2.3/AC11 — jamais « 0 s » : Pause nulle → « enchaînées sans pause » ou omise ; PC nulle → suffixe omis", () => {
    for (const mode of ["DURATION", "REPETITIONS"] as const) {
      for (const targets of [[30, "FAILURE", 45], [30], ["FAILURE"], [30, 45, 60, "FAILURE"]] as const) {
        for (const side of ["UNILATERAL", "RIGHT_LEFT", "LEFT_RIGHT"] as const) {
          for (const order of ["BY_SIDE", "BY_SERIES"] as const) {
            for (const bip of [0, 2]) {
              const series = targets.length === 1 ? "UNIFORM" : "VARIABLE";
              const pauses = targets.length === 1 ? [0, 0, 0] : targets.map(() => 0);
              const generated = phraseOf({ mode, series, targets, pauses, side, order, pc: 0, bip });
              expect({ generated, zero: NO_ZERO_SECONDS.test(generated) }).toEqual({ generated, zero: false });
            }
          }
        }
      }
    }
  });
});

type VariantFixture = {
  readonly id: string;
  readonly covers: string;
  readonly input?: {
    readonly mode: "DURATION" | "REPETITIONS";
    readonly series: "UNIFORM" | "VARIABLE";
    readonly targets: readonly (number | "FAILURE")[];
    readonly pauses: readonly number[];
    readonly bip: number;
    readonly side: SideMode;
    readonly order: SideOrder;
    readonly pc: number;
  };
  readonly snapshotV1?: Record<string, unknown>;
  readonly expectedText: string;
  readonly expectedBold: readonly string[];
  readonly expectedTotalSeconds: number | null;
};

const variants: readonly VariantFixture[] = JSON.parse(
  readFileSync(path.resolve(__dirname, "fixtures/phrase-variants.json"), "utf8"),
).variants;

/** Relit un Instantané v1 (PRE-3) par le lecteur d'enveloppe, qui délègue à `readV1` (story 1.3). */
function rereadV1(parameters: Record<string, unknown>): ExecutionParametersInput {
  const envelope = JSON.stringify({
    snapshotVersion: 1,
    name: "Ancien Exercice",
    categoryId: null,
    bodyZoneIds: [],
    executionParameters: parameters,
    recoverySeconds: 0,
    media: [],
    actualDurationSeconds: null,
  });
  return parseExerciseSnapshot(envelope).executionParameters;
}

function compactOfV1(parameters: Record<string, unknown>): CompactInput {
  const series = parameters.series as
    | { kind: "UNIFORM"; count: number; target: number; pauseSeconds: number }
    | { kind: "VARIABLE"; rows: { target: number; pauseSeconds: number }[] };
  return {
    mode: parameters.mode as "DURATION" | "REPETITIONS",
    series: series.kind,
    targets: series.kind === "UNIFORM" ? [series.target] : series.rows.map((row) => row.target),
    pauses: series.kind === "UNIFORM" ? Array.from({ length: series.count }, () => series.pauseSeconds) : series.rows.map((row) => row.pauseSeconds),
    bip: (parameters.cadenceBeepIntervalSeconds as number | undefined) ?? 0,
    side: parameters.sideMode as SideMode,
    order: parameters.sideOrder as SideOrder,
    pc: parameters.sideRecoverySeconds as number,
  };
}

describe("PRE4-2.3/AC14 — variantes des cas nouveaux (fixtures/phrase-variants.json)", () => {
  it("PRE4-2.3/AC14 — le fichier couvre la liste minimale de l'AC14", () => {
    const ids = variants.map((variant) => variant.id);
    expect(new Set(ids).size).toBe(ids.length);
    const has = (predicate: (variant: VariantFixture) => boolean) => variants.some(predicate);
    const mixedAt = (mode: "DURATION" | "REPETITIONS", length: number, position: number, bip?: (b: number) => boolean) =>
      has((v) => v.input?.mode === mode && v.input.targets.length === length && v.input.targets.indexOf("FAILURE") === position && v.input.targets.some((t) => t !== "FAILURE") && (bip ? bip(v.input.bip) : true));
    expect(mixedAt("DURATION", 2, 1)).toBe(true);
    for (const position of [0, 1, 2]) {
      expect(mixedAt("DURATION", 3, position)).toBe(true);
      expect(mixedAt("REPETITIONS", 3, position)).toBe(true);
    }
    expect(mixedAt("REPETITIONS", 3, 1, (b) => b > 0)).toBe(true);
    expect(has((v) => v.input?.mode === "DURATION" && v.input.targets.length > 3 && v.input.targets.includes("FAILURE"))).toBe(true);
    expect(has((v) => v.input?.mode === "REPETITIONS" && v.input.targets.length > 3 && v.input.targets.includes("FAILURE") && v.input.bip === 0)).toBe(true);
    expect(has((v) => v.input?.mode === "REPETITIONS" && v.input.targets.length > 3 && v.input.targets.includes("FAILURE") && v.input.bip > 0)).toBe(true);
    // Tout à l'échec : Mode × Régime × Bip (0 / 4 s) × Pause (0 / positive), N > 1.
    for (const mode of ["DURATION", "REPETITIONS"] as const) {
      for (const series of ["UNIFORM", "VARIABLE"] as const) {
        for (const bip of [0, 4]) {
          for (const withPause of [false, true]) {
            const covered = has(
              (v) =>
                v.input?.mode === mode &&
                v.input.series === series &&
                v.input.bip === bip &&
                v.input.pauses.length > 1 &&
                v.input.pauses.every((pause) => pause > 0) === withPause &&
                v.input.pauses.some((pause) => pause > 0) === withPause &&
                v.input.targets.every((t) => t === "FAILURE"),
            );
            expect({ mode, series, bip, withPause, covered }).toEqual({ mode, series, bip, withPause, covered: true });
          }
        }
      }
    }
    // N = 1 avec et sans Pause, dans les deux Modes.
    for (const mode of ["DURATION", "REPETITIONS"] as const) {
      for (const withPause of [false, true]) {
        const covered = has((v) => v.input?.mode === mode && v.input.pauses.length === 1 && v.input.pauses[0]! > 0 === withPause);
        expect({ mode, withPause, covered }).toEqual({ mode, withPause, covered: true });
      }
    }
    // Énumération avec deux Cibles à l'échec (Q16 : chaque Cible dans l'ordre).
    expect(has((v) => (v.input?.targets.filter((t) => t === "FAILURE").length ?? 0) >= 2 && v.input!.targets.some((t) => t !== "FAILURE"))).toBe(true);
    expect(has((v) => v.input?.series === "VARIABLE" && v.input.pauses.length === 1)).toBe(true);
    expect(has((v) => v.input?.pauses.length === 2)).toBe(true);
    expect(has((v) => (v.input?.pauses.length ?? 0) > 6)).toBe(true);
    expect(has((v) => v.input?.side === "LEFT_RIGHT" && v.input.order === "BY_SIDE" && v.input.pauses.length > 1)).toBe(true);
    expect(has((v) => v.input?.side === "LEFT_RIGHT" && v.input.order === "BY_SERIES" && v.input.pauses.length > 1)).toBe(true);
    expect(has((v) => v.input?.side === "LEFT_RIGHT" && v.input.pauses.length === 1)).toBe(true);
    expect(has((v) => v.input?.pc === 0 && v.input.side !== "UNILATERAL")).toBe(true);
    expect(has((v) => (v.input?.pc ?? 0) > 0)).toBe(true);
    for (const mode of ["DURATION", "REPETITIONS"] as const) {
      expect(has((v) => v.input?.mode === mode && v.input.bip === 0)).toBe(true);
      expect(has((v) => v.input?.mode === mode && v.input.bip > 0)).toBe(true);
    }
    expect(has((v) => v.input?.mode === "DURATION" && v.input.pauses.length === 1 && v.input.side === "UNILATERAL" && v.input.pauses[0] === 0)).toBe(true);
    expect(has((v) => v.input?.mode === "DURATION" && v.input.pauses.length === 1 && v.input.side === "UNILATERAL" && v.input.pauses[0]! > 0)).toBe(true);
    expect(has((v) => v.snapshotV1 !== undefined)).toBe(true);
    expect(has((v) => (v.expectedTotalSeconds ?? 0) >= 3600)).toBe(true);
    expect(has((v) => v.expectedText.includes("jusqu’à l’échec") && v.input?.targets.some((t) => t !== "FAILURE") === true)).toBe(true);
    expect(has((v) => v.expectedText.includes(" à l’échec"))).toBe(true);
  });

  it.each(variants.map((variant) => [variant.id, variant] as const))("PRE4-2.3/AC14 — %s", (_id, variant) => {
    const compact: CompactInput = variant.input ?? compactOfV1(variant.snapshotV1!);
    const input = variant.snapshotV1 ? rereadV1(variant.snapshotV1) : fromCompact(compact);
    const segments = generateExecutionPhrase(input)!;
    // Texte littéral, segments gras décidés par le gabarit, concaténation exacte.
    expect(phraseText(segments)).toBe(variant.expectedText);
    expect(segments.filter((segment) => segment.gras).map((segment) => segment.texte)).toEqual(variant.expectedBold);
    // « jusqu’à l’échec » et « à l’échec » ne sont jamais en gras.
    expect(segments.filter((segment) => segment.gras && /échec/u.test(segment.texte))).toEqual([]);
    // Total : formule du test, jamais le générateur ni executionCalculations.
    const clause = TOTAL_CLAUSE.exec(variant.expectedText);
    if (variant.expectedTotalSeconds === null) {
      expect(clause).toBeNull();
    } else {
      const formula = variantFormulaTotal(compact)!;
      expect(formula.seconds).toBe(variant.expectedTotalSeconds);
      expect(clause?.[0]).toBe(`Durée totale : ${formula.symbol}${formatPhraseDuration(formula.seconds)}.`);
    }
    // AC11 : jamais « 0 s ».
    expect(variant.expectedText).not.toMatch(NO_ZERO_SECONDS);
    // Tout à l'échec : texte identique au corpus.
    if (compact.targets.every((target) => target === "FAILURE")) {
      expect(corpus.some((c) => c.expectedText === variant.expectedText)).toBe(true);
    }
  });

  it("PRE4-2.3/AC14 — relecture d'un Instantané v1 : grammaire courante, aucune Phrase enregistrée", () => {
    for (const variant of variants.filter((item) => item.snapshotV1 !== undefined)) {
      const reread = rereadV1(variant.snapshotV1!);
      expect(reread.version).toBe(EXECUTION_PARAMETERS_VERSION);
      const serialized = serializeExerciseSnapshot(
        parseExerciseSnapshot(
          JSON.stringify({ snapshotVersion: 1, name: "x", categoryId: null, bodyZoneIds: [], executionParameters: variant.snapshotV1, recoverySeconds: 0, media: [], actualDurationSeconds: null }),
        ),
      );
      // Ni phrase ni segment ni total dans l'Instantané (FR-16-01).
      expect(serialized).not.toMatch(/phrase|segment|texte|gras|Durée totale|séries/iu);
      expect(serialized).not.toContain(variant.expectedText);
    }
  });
});
