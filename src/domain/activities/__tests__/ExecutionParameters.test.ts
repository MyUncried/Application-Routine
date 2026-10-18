import { describe, expect, it } from "@jest/globals";

import {
  alignRowsToBaseline,
  cloneExecutionParameters,
  createEmptyExecutionParameters,
  seriesRowsOf as seriesRowsOfInput,
  EXECUTION_MODES,
  EXECUTION_PARAMETERS_VERSION,
  ExecutionParametersDataError,
  executionParametersEqual,
  failureTarget,
  nearestGridValue,
  normalizeEffective,
  numberTarget,
  projectScalars,
  readV2,
  selectorOpeningPosition,
  serializeV2,
  stepTarget,
  stepWithinBounds,
  targetsEqual,
  unsetTarget,
  validateForSave,
  type ExecutionParameters,
  type ExecutionParametersInput,
  type ExecutionParametersViolation,
  type ExecutionValidationBaseline,
  type ExecutionValidationOptions,
} from "@/domain/activities/ExecutionParameters";
import {
  durationParameters,
  repetitionParameters,
  uniformParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";

/**
 * PRE-4 (story 1.1) — types d'AD-1, format v2 d'AD-3 et validation unique
 * d'AD-13. Les formes anciennes (v1, scalaires) sont testées avec leur
 * lecteur dans `readV1.test.ts`.
 */

const accepted = (input: ExecutionParametersInput, baseline: ExecutionValidationBaseline) =>
  validateForSave(input, baseline).ok;

function violations(
  input: ExecutionParametersInput,
  baseline: ExecutionValidationBaseline,
  options: ExecutionValidationOptions = {},
): readonly ExecutionParametersViolation[] {
  const result = validateForSave(input, baseline, options);
  return result.ok ? [] : result.violations;
}

/** Remplace un champ par une valeur arbitraire (donnée impossible : chaîne, booléen…). */
function withRaw(input: ExecutionParametersInput, patch: Record<string, unknown>): ExecutionParametersInput {
  return { ...input, ...patch } as unknown as ExecutionParametersInput;
}

describe("PRE4-1.1/AC1 — deux Modes, une Cible typée unique", () => {
  it("le Mode n'a que deux valeurs ; la Cible est NUMBER, FAILURE ou UNSET, jamais un nombre ou null", () => {
    expect(EXECUTION_MODES).toEqual(["DURATION", "REPETITIONS"]);
    expect(numberTarget(30)).toEqual({ kind: "NUMBER", value: 30 });
    expect(failureTarget()).toEqual({ kind: "FAILURE" });
    expect(unsetTarget()).toEqual({ kind: "UNSET" });
    expect(EXECUTION_PARAMETERS_VERSION).toBe(2);
  });

  it("égalité et clone par kind/value (jamais par référence)", () => {
    expect(targetsEqual(numberTarget(30), numberTarget(30))).toBe(true);
    expect(targetsEqual(numberTarget(30), numberTarget(31))).toBe(false);
    expect(targetsEqual(failureTarget(), failureTarget())).toBe(true);
    expect(targetsEqual(failureTarget(), unsetTarget())).toBe(false);
    const source = variableParameters({ rows: [[30, 10], ["FAILURE", 10], ["UNSET", 0]] });
    const copy = cloneExecutionParameters(source);
    expect(copy).toEqual(source);
    expect(executionParametersEqual(copy, source)).toBe(true);
    // Aucune référence partagée : ni la ligne, ni la Cible.
    expect(copy.series.kind === "VARIABLE" && source.series.kind === "VARIABLE" && copy.series.rows[0]!.target).not.toBe(
      source.series.kind === "VARIABLE" && source.series.rows[0]!.target,
    );
    expect(executionParametersEqual(copy, variableParameters({ rows: [[30, 10], ["UNSET", 10], ["UNSET", 0]] }))).toBe(false);
  });

  it("normalisation N=1 : Régime identiques sur la première ligne, Cible FAILURE conservée telle quelle", () => {
    const single = variableParameters({ mode: "REPETITIONS", rows: [["FAILURE", 15]], sideOrder: "BY_SERIES" });
    expect(normalizeEffective(single)).toEqual(
      uniformParameters({ mode: "REPETITIONS", count: 1, target: "FAILURE", pauseSeconds: 15, sideOrder: "BY_SIDE" }),
    );
  });
});

describe("PRE4-1.1/AC2 — forme v2 figée et sérialiseur", () => {
  it("chaîne exacte de l'exemple d'AC2 (mêmes clés et même ordre que v1, sans espace)", () => {
    const parameters = uniformParameters({
      mode: "REPETITIONS",
      count: 3,
      target: "FAILURE",
      pauseSeconds: 10,
      sideMode: "UNILATERAL",
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 0,
      cadenceBeepIntervalSeconds: 2,
      countdownSeconds: 0,
      endSeconds: 0,
    });
    expect(serializeV2(parameters)).toBe(
      '{"version":2,"mode":"REPETITIONS","series":{"kind":"UNIFORM","count":3,"target":{"kind":"FAILURE"},"pauseSeconds":10},"sideMode":"UNILATERAL","sideOrder":"BY_SIDE","sideRecoverySeconds":0,"cadenceBeepIntervalSeconds":2,"countdownSeconds":0,"endSeconds":0}',
    );
  });

  it("Cible numérique {kind,value} ; Régime variables en lignes {target, pauseSeconds}, sans Bip par ligne", () => {
    expect(serializeV2(durationParameters(30))).toContain('"target":{"kind":"NUMBER","value":30}');
    const json = serializeV2(variableParameters({ rows: [[30, 10], ["UNSET", 20]], cadenceBeepIntervalSeconds: 3 }));
    expect(json).toContain(
      '"series":{"kind":"VARIABLE","rows":[{"target":{"kind":"NUMBER","value":30},"pauseSeconds":10},{"target":{"kind":"UNSET"},"pauseSeconds":20}]}',
    );
    const rows = (JSON.parse(json) as { series: { rows: Record<string, unknown>[] } }).series.rows;
    for (const row of rows) {
      expect(Object.keys(row)).toEqual(["target", "pauseSeconds"]);
    }
  });

  it("ni identité de ligne, ni Réserve, ni mémoire de Mode, ni phrase, ni total sérialisés", () => {
    const decorated = {
      ...variableParameters({ rows: [[30, 10], [45, 0]] }),
      rowIds: [1, 2],
      hiddenRows: [],
      targetsById: {},
      phrase: "2 séries",
      totalSeconds: 85,
    } as ExecutionParameters;
    expect(Object.keys(JSON.parse(serializeV2(decorated)) as object)).toEqual([
      "version",
      "mode",
      "series",
      "sideMode",
      "sideOrder",
      "sideRecoverySeconds",
      "cadenceBeepIntervalSeconds",
      "countdownSeconds",
      "endSeconds",
    ]);
  });
});

describe("PRE4-1.1/AC3 — lecteur v2", () => {
  it("readV2 relit les paramètres typés et serializeV2(readV2(s)) = s octet pour octet", () => {
    const samples = [
      durationParameters(30, 3, 10),
      repetitionParameters(150, 2, 400, { cadenceBeepIntervalSeconds: 11 }),
      uniformParameters({ mode: "REPETITIONS", count: 3, target: "FAILURE", pauseSeconds: 10 }),
      variableParameters({
        mode: "DURATION",
        rows: [["FAILURE", 10], [30, 10], ["UNSET", 0]],
        sideMode: "RIGHT_LEFT",
        sideOrder: "BY_SERIES",
        sideRecoverySeconds: 5,
        countdownSeconds: 3,
        endSeconds: 4,
      }),
    ];
    for (const sample of samples) {
      const json = serializeV2(sample);
      expect(readV2(json)).toEqual(sample);
      expect(serializeV2(readV2(json))).toBe(json);
    }
  });

  it("NULL, JSON corrompu, v1 ou version inconnue → ExecutionParametersDataError, jamais un repli", () => {
    const v1 = JSON.stringify({
      version: 1,
      mode: "DURATION",
      series: { kind: "UNIFORM", count: 1, target: 30, pauseSeconds: 0 },
      sideMode: "UNILATERAL",
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 0,
      cadenceBeepIntervalSeconds: 0,
      countdownSeconds: 0,
      endSeconds: 0,
    });
    for (const json of [null, undefined, "{not json", v1, serializeV2(durationParameters(30)).replace('"version":2', '"version":7')]) {
      expect(() => readV2(json)).toThrow(ExecutionParametersDataError);
    }
    expect(() => readV2(serializeV2(durationParameters(30)).replace('"mode":"DURATION"', '"mode":"SPRINT"'))).toThrow(
      ExecutionParametersDataError,
    );
    expect(() => readV2(serializeV2(durationParameters(30)).replace('"kind":"NUMBER","value":30', '"kind":"NUMBER","value":0'))).toThrow(
      ExecutionParametersDataError,
    );
  });
});

describe("PRE4-1.1/AC5 — niveau structurel (STORAGE) : forme, types, entiers non négatifs, pas les bornes", () => {
  const base = durationParameters(30, 3, 10);

  it("chaque cas refusé renvoie une violation en union discriminée, sans exception", () => {
    const refused: readonly [string, ExecutionParametersInput][] = [
      ["Cible UNSET", durationParameters("UNSET", 3, 10)],
      ["Cible UNSET héritée en variables", variableParameters({ rows: [[30, 10], ["UNSET", 10]] })],
      ["Mode inconnu", withRaw(base, { mode: "SPRINT" })],
      ["Mode non renseigné", withRaw(base, { mode: null })],
      ["kind de Cible inconnu", withRaw(base, { series: { kind: "UNIFORM", count: 3, target: { kind: "ZERO" }, pauseSeconds: 10 } })],
      ["kind de Régime inconnu", withRaw(base, { series: { kind: "MIXED", rows: [] } })],
      ["chaîne à la place d'un nombre", withRaw(base, { cadenceBeepIntervalSeconds: "2" })],
      ["booléen à la place d'un nombre", withRaw(base, { countdownSeconds: true })],
      ["Régime variables sans ligne", withRaw(base, { series: { kind: "VARIABLE", rows: [] } })],
      ["Cible négative", durationParameters(-3, 3, 10)],
      ["Cible non entière", durationParameters(7.5, 3, 10)],
      ["Pause négative", durationParameters(30, 3, -5)],
      ["Pause non entière", durationParameters(30, 3, 2.5)],
      ["Pause au changement de côté négative", durationParameters(30, 3, 10, { sideRecoverySeconds: -5 })],
      ["Bip non entier", durationParameters(30, 3, 10, { cadenceBeepIntervalSeconds: 2.5 })],
      ["Compte à rebours négatif", durationParameters(30, 3, 10, { countdownSeconds: -3 })],
      ["Fin non entière", durationParameters(30, 3, 10, { endSeconds: 1.5 })],
    ];
    for (const [label, input] of refused) {
      const result = validateForSave(input, "STORAGE");
      expect({ label, ok: result.ok }).toEqual({ label, ok: false });
      expect(!result.ok && result.violations.every((violation) => violation.level === "STRUCTURE")).toBe(true);
    }
  });

  it("entrée absente ou non objet : violation structurelle REQUIRED, jamais d'exception", () => {
    for (const input of [undefined, null, 3, "x", []]) {
      for (const baseline of ["STORAGE", null] as const) {
        const result = validateForSave(input as unknown as ExecutionParametersInput, baseline);
        expect(result).toEqual({ ok: false, violations: [{ code: "REQUIRED", field: "mode", level: "STRUCTURE" }] });
      }
    }
  });

  it("une Cible FAILURE seule et des valeurs POSITIVES hors bornes sont acceptées à ce niveau", () => {
    expect(accepted(uniformParameters({ mode: "REPETITIONS", count: 3, target: "FAILURE", pauseSeconds: 10 }), "STORAGE")).toBe(true);
    expect(accepted(durationParameters(5999), "STORAGE")).toBe(true);
    expect(accepted(repetitionParameters(150), "STORAGE")).toBe(true);
    expect(accepted(durationParameters(30, 1, 0, { cadenceBeepIntervalSeconds: 11 }), "STORAGE")).toBe(true);
    expect(accepted(durationParameters(30, 2, 400), "STORAGE")).toBe(true);
    expect(accepted(durationParameters(7), "STORAGE")).toBe(true);
  });

  it("succès : paramètres effectifs normalisés, côté non renseigné → Sans changement", () => {
    const result = validateForSave({ ...durationParameters(30), sideMode: null }, "STORAGE");
    expect(result.ok && result.value.sideMode).toBe("UNILATERAL");
  });
});

describe("PRE4-1.1/AC6 — niveau saisie en création (aucune ligne de base)", () => {
  // Q36 (Hermann, 2026-10-17) : Cible Durée à la seconde, bornes 5..3535 inchangées (plus de pas de 5).
  it("Cible Durée : entiers de 5 à 3535, à la seconde (Q36)", () => {
    for (const seconds of [5, 7, 30, 31, 3533, 3535]) {
      expect({ seconds, ok: accepted(durationParameters(seconds), null) }).toEqual({ seconds, ok: true });
    }
    for (const seconds of [0, 1, 4, 3536, 3540, 5999]) {
      expect({ seconds, ok: accepted(durationParameters(seconds), null) }).toEqual({ seconds, ok: false });
    }
  });

  it("Cible Répétitions : 1..100 entiers", () => {
    for (const repetitions of [1, 100]) {
      expect(accepted(repetitionParameters(repetitions), null)).toBe(true);
    }
    for (const repetitions of [0, 101, 1.5]) {
      expect({ repetitions, ok: accepted(repetitionParameters(repetitions), null) }).toEqual({ repetitions, ok: false });
    }
  });

  it("N 1..99 ; Pauses 0..300 ; Bip 0..10 ; Compte à rebours et Fin 0..60", () => {
    expect(accepted(durationParameters(30, 1), null)).toBe(true);
    expect(accepted(durationParameters(30, 99), null)).toBe(true);
    expect(accepted(durationParameters(30, 100), null)).toBe(false);
    expect(accepted(durationParameters(30, 2, 300), null)).toBe(true);
    expect(accepted(durationParameters(30, 2, 301), null)).toBe(false);
    expect(accepted(durationParameters(30, 2, 0, { sideMode: "RIGHT_LEFT", sideRecoverySeconds: 300 }), null)).toBe(true);
    expect(accepted(durationParameters(30, 2, 0, { sideMode: "RIGHT_LEFT", sideRecoverySeconds: 301 }), null)).toBe(false);
    for (const beep of [0, 10]) {
      expect(accepted(repetitionParameters(10, 1, 0, { cadenceBeepIntervalSeconds: beep }), null)).toBe(true);
    }
    for (const beep of [-1, 11, 2.5]) {
      expect({ beep, ok: accepted(repetitionParameters(10, 1, 0, { cadenceBeepIntervalSeconds: beep }), null) }).toEqual({
        beep,
        ok: false,
      });
    }
    expect(accepted(durationParameters(30, 1, 0, { countdownSeconds: 60, endSeconds: 60 }), null)).toBe(true);
    expect(accepted(durationParameters(30, 1, 0, { countdownSeconds: 61 }), null)).toBe(false);
    expect(accepted(durationParameters(30, 1, 0, { endSeconds: 61 }), null)).toBe(false);
  });

  it("une violation de saisie identifie le champ, le niveau et la Série", () => {
    // Q36 : 7 s est désormais admise ; 4 s reste sous la borne.
    expect(violations(variableParameters({ rows: [[30, 10], [4, 10]] }), null)).toEqual([
      expect.objectContaining({ code: "OUT_OF_RANGE", field: "target", level: "INPUT", seriesNumber: 2 }),
    ]);
  });
});

describe("PRE4-1.1/AC7 — tolérance historique (H25), champ par champ avec la ligne de base", () => {
  const renamedOnly = (baseline: ExecutionParameters) => accepted(cloneExecutionParameters(baseline), baseline);

  it("tableau unique d'AC7", () => {
    const reps150 = repetitionParameters(150, 3, 30);
    const duration5999 = durationParameters(5999, 2, 30);
    const beep11 = repetitionParameters(10, 3, 30, { cadenceBeepIntervalSeconds: 11 });
    const rows: readonly [string, ExecutionParametersInput, ExecutionParameters, boolean][] = [
      ["Répétitions 150 inchangée", cloneExecutionParameters(reps150), reps150, true],
      ["Répétitions 150 inchangée, Pause modifiée dans ses bornes", repetitionParameters(150, 3, 45), reps150, true],
      ["Répétitions 150 → 100", repetitionParameters(100, 3, 30), reps150, true],
      ["Répétitions 150 → 101", repetitionParameters(101, 3, 30), reps150, false],
      ["Répétitions 150 → 120", repetitionParameters(120, 3, 30), reps150, false],
      ["Durée 5999 inchangée", cloneExecutionParameters(duration5999), duration5999, true],
      ["Durée 5999 → 5995", durationParameters(5995, 2, 30), duration5999, false],
      ["Durée 5999 → 3535", durationParameters(3535, 2, 30), duration5999, true],
      ["Bip 11 inchangé", cloneExecutionParameters(beep11), beep11, true],
      ["Bip 11 → 12", repetitionParameters(10, 3, 30, { cadenceBeepIntervalSeconds: 12 }), beep11, false],
      ["Bip 11 → 10", repetitionParameters(10, 3, 30, { cadenceBeepIntervalSeconds: 10 }), beep11, true],
    ];
    for (const [label, input, baseline, expected] of rows) {
      expect({ label, ok: accepted(input, baseline) }).toEqual({ label, ok: expected });
    }
  });

  it("le renommage (paramètres identiques) ne transforme jamais une valeur inchangée en nouvelle saisie", () => {
    expect(renamedOnly(durationParameters(5999))).toBe(true);
    expect(renamedOnly(repetitionParameters(150))).toBe(true);
    expect(renamedOnly(durationParameters(7, 3, 400, { sideMode: "LEFT_RIGHT", sideRecoverySeconds: 400, countdownSeconds: 90 }))).toBe(
      true,
    );
  });

  it("la modification d'une Pause ne rend pas la Cible héritée modifiée, et inversement", () => {
    // Q36 : valeur historique sous la borne (3 s) ; la modifier en 4 s reste refusé, 8 s serait admise.
    const baseline = variableParameters({ rows: [[5999, 30], [3, 30]] });
    expect(accepted(variableParameters({ rows: [[5999, 45], [3, 30]] }), baseline)).toBe(true);
    expect(accepted(variableParameters({ rows: [[5999, 30], [8, 30]] }), baseline)).toBe(true);
    expect(violations(variableParameters({ rows: [[5999, 30], [4, 30]] }), baseline)).toEqual([
      expect.objectContaining({ field: "target", seriesNumber: 2, level: "INPUT" }),
    ]);
  });

  it("une Cible n'est tolérée que si le Mode est celui de la ligne de base", () => {
    const baseline = durationParameters(150);
    expect(accepted(repetitionParameters(150), baseline)).toBe(false);
  });

  it("une Cible UNSET héritée reste toujours une violation (bloque ✓ et Terminer)", () => {
    const baseline = durationParameters("UNSET", 3, 10);
    expect(accepted(cloneExecutionParameters(baseline), baseline)).toBe(false);
    expect(accepted(cloneExecutionParameters(baseline), "STORAGE")).toBe(false);
    expect(accepted(durationParameters(30, 3, 10), baseline)).toBe(true);
  });
});

describe("PRE4-3.2/AC12 — alignement des Séries sur la ligne de base (AD-13)", () => {
  // Q36 : 7 s n'étant plus hors bornes, la valeur historique basse est 3 s (sous le minimum de 5 s).
  const legacy = variableParameters({ rows: [[30, 10], [5999, 20], [3, 30]], cadenceBeepIntervalSeconds: 11 });
  const moved = variableParameters({ rows: [[5999, 20], [30, 10], [3, 30]], cadenceBeepIntervalSeconds: 11 });
  // Q36 : plus de pas dans le détail de la violation, seulement les bornes.
  const outOfGrid = (seriesNumber: number) => ({
    code: "OUT_OF_RANGE",
    field: "target",
    level: "INPUT",
    details: { min: 5, max: 3535 },
    seriesNumber,
  });

  it("sans identité (Éditeur, Terminer) : une ligne historique déplacée sans modification est appariée par valeur", () => {
    expect(validateForSave(moved, legacy)).toEqual({ ok: true, value: moved });
    expect(alignRowsToBaseline(seriesRowsOfInput(moved), seriesRowsOfInput(legacy))).toEqual([1, 0, 2]);
  });

  it("appariement glouton dans l'ordre, chaque ligne de base au plus une fois, puis repli par rang", () => {
    const base = seriesRowsOfInput(variableParameters({ rows: [[5999, 20], [5999, 20], [7, 30]] }));
    const rows = seriesRowsOfInput(variableParameters({ rows: [[5999, 20], [5999, 20], [5999, 20], [8, 30]] }));
    expect(alignRowsToBaseline(rows, base)).toEqual([0, 1, 2, null]);
    // Repli exclusif : le rang déjà apparié par valeur n'est pas réutilisé.
    const swapped = seriesRowsOfInput(variableParameters({ rows: [[7, 30], [10, 9]] }));
    const swappedBase = seriesRowsOfInput(variableParameters({ rows: [[5999, 20], [7, 30]] }));
    expect(alignRowsToBaseline(swapped, swappedBase)).toEqual([1, 1]);
    expect(alignRowsToBaseline(swapped, swappedBase, { exclusive: true })).toEqual([1, null]);
    // La troisième 5999 s n'a pas de base de même valeur : repli sur le rang 2 (7 s), donc soumise aux bornes.
    expect(violations(variableParameters({ rows: [[5999, 20], [5999, 20], [5999, 20]] }), variableParameters({ rows: [[5999, 20], [5999, 20], [7, 30]] }))).toEqual([
      outOfGrid(3),
    ]);
  });

  it("identités fournies : alignement suivi tel quel ; entrée null → pas de base", () => {
    expect(validateForSave(moved, legacy, { baselineRowIndexes: [1, 0, 2] }).ok).toBe(true);
    expect(violations(moved, legacy, { baselineRowIndexes: [0, 1, 2] })).toEqual([outOfGrid(1)]);
    expect(violations(moved, legacy, { baselineRowIndexes: [null, 0, 2] })).toEqual([outOfGrid(1)]);
  });

  it("garde : longueur incohérente → aucune base ; entrée non entière, hors bornes ou en double → pas de base pour cette ligne", () => {
    expect(violations(moved, legacy, { baselineRowIndexes: [1, 0] })).toEqual([outOfGrid(1), outOfGrid(3)]);
    expect(violations(moved, legacy, { baselineRowIndexes: [1, 0, 2, 2] })).toEqual([outOfGrid(1), outOfGrid(3)]);
    expect(violations(moved, legacy, { baselineRowIndexes: [1.5, 0, 2] })).toEqual([outOfGrid(1)]);
    expect(violations(moved, legacy, { baselineRowIndexes: [1, 0, 3] })).toEqual([outOfGrid(3)]);
    expect(violations(moved, legacy, { baselineRowIndexes: [1, 0, -1] })).toEqual([outOfGrid(3)]);
    expect(violations(moved, legacy, { baselineRowIndexes: [1, 1, 2] })).toEqual([outOfGrid(1)]);
  });

  it("Régime identiques : la Cible commune est alignée comme une ligne unique", () => {
    const uniformLegacy = durationParameters(5999, 3, 10);
    expect(validateForSave(cloneExecutionParameters(uniformLegacy), uniformLegacy).ok).toBe(true);
    expect(validateForSave(cloneExecutionParameters(uniformLegacy), uniformLegacy, { baselineRowIndexes: [0] }).ok).toBe(true);
    const required = [{ code: "OUT_OF_RANGE", field: "target", level: "INPUT", details: { min: 5, max: 3535 } }];
    expect(violations(cloneExecutionParameters(uniformLegacy), uniformLegacy, { baselineRowIndexes: [null] })).toEqual(required);
    expect(violations(cloneExecutionParameters(uniformLegacy), uniformLegacy, { baselineRowIndexes: [0, 1] })).toEqual(required);
    // Base variable, entrée identiques : la Cible commune est appariée à une ligne de même valeur.
    expect(validateForSave(durationParameters(5999, 3, 20), legacy).ok).toBe(true);
    // Pause différente : pas d'appariement par valeur, repli sur le rang 0 (30 s) → 5999 s soumise aux bornes.
    expect(violations(durationParameters(5999, 3, 15), legacy)).toEqual(required);
  });
});

describe("PRE4-Q36 — Cible Durée à la seconde (décision de Hermann du 2026-10-17)", () => {
  it("PRE4-Q36 — 31, 7 et 3533 s admises ; 4 et 3536 s refusées ; 5999 s héritée non modifiée tolérée (H25)", () => {
    for (const seconds of [31, 7, 3533]) {
      expect({ seconds, ok: accepted(durationParameters(seconds), null) }).toEqual({ seconds, ok: true });
    }
    for (const seconds of [4, 3536]) {
      expect({ seconds, violations: violations(durationParameters(seconds), null) }).toEqual({
        seconds,
        violations: [{ code: "OUT_OF_RANGE", field: "target", level: "INPUT", details: { min: 5, max: 3535 } }],
      });
    }
    const legacy5999 = durationParameters(5999, 2, 30);
    expect(accepted(cloneExecutionParameters(legacy5999), legacy5999)).toBe(true);
    expect(accepted(durationParameters(3533, 2, 30), legacy5999)).toBe(true);
    expect(accepted(durationParameters(3536, 2, 30), legacy5999)).toBe(false);
  });
});

describe("PRE4-1.1/AC16 — projection scalaire unique", () => {
  it("première Cible FAILURE ou UNSET → cible scalaire NULL, jamais la Cible numérique suivante", () => {
    expect(projectScalars(variableParameters({ mode: "DURATION", rows: [["FAILURE", 10], [30, 10]] }))).toEqual({
      executionMode: "DURATION",
      durationSeconds: null,
      repetitionCount: null,
      seriesCount: 2,
      pauseSeconds: 10,
      sideMode: "UNILATERAL",
      sideRecoverySeconds: 0,
    });
    expect(projectScalars(repetitionParameters(12, 3, 20))).toEqual({
      executionMode: "REPETITIONS",
      durationSeconds: null,
      repetitionCount: 12,
      seriesCount: 3,
      pauseSeconds: 20,
      sideMode: "UNILATERAL",
      sideRecoverySeconds: 0,
    });
    expect(projectScalars(variableParameters({ mode: "REPETITIONS", rows: [["UNSET", 5], [8, 10]] })).repetitionCount).toBeNull();
  });
});

describe("Création", () => {
  it("brouillon de création : Mode et côté non renseignés, Série 1 à Cible à renseigner, Pause 0, Bip 0, CR/Fin du Profil", () => {
    expect(createEmptyExecutionParameters({ countdownSeconds: 10, endSeconds: 5 })).toEqual({
      version: 2,
      mode: null,
      series: { kind: "UNIFORM", count: 1, target: { kind: "UNSET" }, pauseSeconds: 0 },
      sideMode: null,
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 0,
      cadenceBeepIntervalSeconds: 0,
      countdownSeconds: 10,
      endSeconds: 5,
    });
  });
});

describe("PRE4-3.4 — position d’ouverture du Sélecteur de cible (AD-16, Q21, Q25, Q36)", () => {
  it("PRE4-3.4/AC4 — nearestGridValue borne seulement depuis Q36 : 4 → 5, 5999 → 3535, valeurs dans les bornes inchangées (7, 31, 5, 3535)", () => {
    expect(nearestGridValue("DURATION", 4)).toBe(5);
    expect(nearestGridValue("DURATION", 5999)).toBe(3535);
    expect(nearestGridValue("DURATION", 7)).toBe(7);
    expect(nearestGridValue("DURATION", 31)).toBe(31);
    expect(nearestGridValue("DURATION", 5)).toBe(5);
    expect(nearestGridValue("DURATION", 3535)).toBe(3535);
    expect(nearestGridValue("DURATION", 3536)).toBe(3535);
  });

  it("PRE4-3.4/AC4 — nearestGridValue : arrondi à l’entier (7,4 → 7 ; 7,5 → 8), +∞ → borne haute, −∞ et NaN → borne basse, négatif → borne basse", () => {
    expect(nearestGridValue("DURATION", 7.4)).toBe(7);
    expect(nearestGridValue("DURATION", 7.5)).toBe(8);
    expect(nearestGridValue("DURATION", Number.POSITIVE_INFINITY)).toBe(3535);
    expect(nearestGridValue("DURATION", Number.NEGATIVE_INFINITY)).toBe(5);
    expect(nearestGridValue("DURATION", Number.NaN)).toBe(5);
    expect(nearestGridValue("DURATION", -30)).toBe(5);
    expect(nearestGridValue("REPETITIONS", Number.POSITIVE_INFINITY)).toBe(100);
    expect(nearestGridValue("REPETITIONS", Number.NaN)).toBe(1);
  });

  it("PRE4-3.4/AC4 — nearestGridValue en Répétitions : 1..100, sans multiple de 5 (150 → 100, 0 → 1, 7 → 7)", () => {
    expect(nearestGridValue("REPETITIONS", 150)).toBe(100);
    expect(nearestGridValue("REPETITIONS", 0)).toBe(1);
    expect(nearestGridValue("REPETITIONS", 7)).toBe(7);
    expect(nearestGridValue("REPETITIONS", 100)).toBe(100);
  });

  it("PRE4-3.4/AC3 — selectorOpeningPosition : UNSET → 00:05 en Durée et 1 en Répétitions (Q25) ; FAILURE → option échec ; NUMBER → nearestGridValue", () => {
    expect(selectorOpeningPosition("DURATION", unsetTarget())).toEqual({ kind: "NUMBER", value: 5 });
    expect(selectorOpeningPosition("REPETITIONS", unsetTarget())).toEqual({ kind: "NUMBER", value: 1 });
    expect(selectorOpeningPosition("DURATION", failureTarget())).toEqual({ kind: "FAILURE" });
    expect(selectorOpeningPosition("REPETITIONS", failureTarget())).toEqual({ kind: "FAILURE" });
    expect(selectorOpeningPosition("DURATION", numberTarget(30))).toEqual({ kind: "NUMBER", value: 30 });
    expect(selectorOpeningPosition("DURATION", numberTarget(5999))).toEqual({ kind: "NUMBER", value: 3535 });
    expect(selectorOpeningPosition("DURATION", numberTarget(7))).toEqual({ kind: "NUMBER", value: 7 });
    expect(selectorOpeningPosition("REPETITIONS", numberTarget(150))).toEqual({ kind: "NUMBER", value: 100 });
  });
});

describe("PRE4-3.6 — `stepTarget` et `stepWithinBounds` (AD-16, Q13, Q26, Q36, P38)", () => {
  it("PRE4-3.6/AC5 — depuis 7 s (valide depuis Q36) : + → 8 s, − → 6 s ; depuis 5999 s : + indisponible, − → 3535 s ; depuis 150 rép. : + indisponible, − → 100", () => {
    expect(stepTarget("DURATION", numberTarget(7), 1)).toEqual(numberTarget(8));
    expect(stepTarget("DURATION", numberTarget(7), -1)).toEqual(numberTarget(6));
    expect(stepTarget("DURATION", numberTarget(5999), 1)).toBe("unavailable");
    expect(stepTarget("DURATION", numberTarget(5999), -1)).toEqual(numberTarget(3535));
    expect(stepTarget("REPETITIONS", numberTarget(150), 1)).toBe("unavailable");
    expect(stepTarget("REPETITIONS", numberTarget(150), -1)).toEqual(numberTarget(100));
    // Bornes atteintes : saturation, sans rebouclage.
    expect(stepTarget("DURATION", numberTarget(3535), 1)).toBe("unavailable");
    expect(stepTarget("DURATION", numberTarget(5), -1)).toBe("unavailable");
    expect(stepTarget("REPETITIONS", numberTarget(1), -1)).toBe("unavailable");
    expect(stepTarget("REPETITIONS", numberTarget(100), 1)).toBe("unavailable");
  });

  it("PRE4-3.6/AC4 — Cible `UNSET` : + donne la valeur minimale (5 s, 1), − indisponible ; `FAILURE` : indisponible dans les deux sens (Q13, Q26)", () => {
    expect(stepTarget("DURATION", unsetTarget(), 1)).toEqual(numberTarget(5));
    expect(stepTarget("REPETITIONS", unsetTarget(), 1)).toEqual(numberTarget(1));
    expect(stepTarget("DURATION", unsetTarget(), 1, 10)).toEqual(numberTarget(5));
    expect(stepTarget("DURATION", unsetTarget(), -1)).toBe("unavailable");
    expect(stepTarget("REPETITIONS", unsetTarget(), -1)).toBe("unavailable");
    for (const mode of EXECUTION_MODES) {
      expect(stepTarget(mode, failureTarget(), 1)).toBe("unavailable");
      expect(stepTarget(mode, failureTarget(), -1)).toBe("unavailable");
    }
  });

  it("PRE4-3.6/AC6 — paliers du maintien : multiples directionnels dans les bornes (37 → 40 au pas 5, 41 → 50 au pas 10, 3533 → 3535)", () => {
    expect(stepTarget("DURATION", numberTarget(37), 1, 5)).toEqual(numberTarget(40));
    expect(stepTarget("DURATION", numberTarget(37), -1, 5)).toEqual(numberTarget(35));
    expect(stepTarget("DURATION", numberTarget(41), 1, 10)).toEqual(numberTarget(50));
    expect(stepTarget("DURATION", numberTarget(3533), 1, 10)).toEqual(numberTarget(3535));
    expect(stepTarget("REPETITIONS", numberTarget(97), 1, 5)).toEqual(numberTarget(100));
  });

  it("PRE4-3.6/AC5 — `stepWithinBounds` ne renvoie jamais une valeur inférieure à la courante pour + ni supérieure pour −", () => {
    for (const current of [1, 2, 4, 5, 7, 300, 3535, 3536, 5999]) {
      for (const stepSize of [1, 5, 10]) {
        expect(stepWithinBounds(current, 1, stepSize, 5, 3535)).toBeGreaterThanOrEqual(current);
        expect(stepWithinBounds(current, -1, stepSize, 5, 3535)).toBeLessThanOrEqual(current);
      }
    }
    expect(stepWithinBounds(5999, 1, 5, 5, 3535)).toBe(5999);
    expect(stepWithinBounds(5999, -1, 5, 5, 3535)).toBe(3535);
  });
});
