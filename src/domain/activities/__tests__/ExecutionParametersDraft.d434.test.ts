import { describe, expect, it } from "@jest/globals";

import {
  failureTarget,
  numberTarget,
  unsetTarget,
  type ExecutionParametersInput,
  type SeriesTarget,
} from "@/domain/activities/ExecutionParameters";
import {
  commitSheetDraft,
  openSheetDraft,
  setMode,
  setRowTarget,
  toggleRowFailure,
} from "@/domain/activities/ExecutionParametersDraft";

/**
 * D-434 (décision de Hermann du 19/10, QD-434-1) — commande « À l'échec » de la barre du
 * clavier, pour la Cible d'une seule ligne du tableau des séries variables : bascule cible
 * numérique ↔ À l'échec en préservant la valeur (mémoire `lastNumberById` de la story 2.1).
 */

function variable(targets: SeriesTarget[], mode: "DURATION" | "REPETITIONS" = "DURATION"): ExecutionParametersInput {
  return {
    version: 3,
    mode,
    series: { kind: "VARIABLE", rows: targets.map((target) => ({ target, pauseSeconds: 10, loadKg: 0 })) },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    loadEnabled: false,
  };
}

const targetsOf = (draft: ReturnType<typeof openSheetDraft>) => draft.rows.map((row) => row.target);

describe("D-434 — toggleRowFailure", () => {
  it("cible numérique → À l'échec pour cette seule série ; de nouveau → la valeur numérique revient", () => {
    const draft = openSheetDraft(variable([numberTarget(30), numberTarget(45)]));
    const failed = toggleRowFailure(draft, 1);
    expect(targetsOf(failed)).toEqual([numberTarget(30), failureTarget()]);
    const restored = toggleRowFailure(failed, 1);
    expect(targetsOf(restored)).toEqual([numberTarget(30), numberTarget(45)]);
  });

  it("la valeur mémorisée est la dernière valeur numérique de la ligne (saisie au clavier comprise)", () => {
    const draft = setRowTarget(openSheetDraft(variable([numberTarget(30), numberTarget(45)])), 0, numberTarget(75));
    expect(targetsOf(toggleRowFailure(toggleRowFailure(draft, 0), 0))[0]).toEqual(numberTarget(75));
  });

  it("Cible à l'échec sans valeur numérique connue : redevient à renseigner (jamais un nombre inventé)", () => {
    const draft = openSheetDraft(variable([failureTarget(), numberTarget(45)]));
    expect(targetsOf(toggleRowFailure(draft, 0))[0]).toEqual(unsetTarget());
    const unset = openSheetDraft(variable([unsetTarget(), numberTarget(45)]));
    const failed = toggleRowFailure(unset, 0);
    expect(targetsOf(failed)[0]).toEqual(failureTarget());
    expect(targetsOf(toggleRowFailure(failed, 0))[0]).toEqual(unsetTarget());
  });

  it("revue : Cible à renseigner passée à l'échec puis rétablie : à renseigner, jamais une valeur numérique plus ancienne", () => {
    const draft = openSheetDraft(variable([numberTarget(30), numberTarget(45)]));
    const emptied = setRowTarget(toggleRowFailure(toggleRowFailure(draft, 0), 0), 0, unsetTarget());
    expect(targetsOf(toggleRowFailure(toggleRowFailure(emptied, 0), 0))[0]).toEqual(unsetTarget());
  });

  it("Répétitions : même bascule, mémoire par Mode (une durée n'est jamais restituée en Répétitions)", () => {
    const draft = openSheetDraft(variable([numberTarget(12), numberTarget(10)], "REPETITIONS"));
    expect(targetsOf(toggleRowFailure(toggleRowFailure(draft, 0), 0))[0]).toEqual(numberTarget(12));
    const duration = toggleRowFailure(openSheetDraft(variable([numberTarget(30), numberTarget(45)])), 0);
    const repetitions = setMode(duration, "REPETITIONS");
    const back = toggleRowFailure(repetitions, 0);
    expect(back.rows[0]!.target.kind === "NUMBER" ? back.rows[0]!.target.value : null).not.toBe(30);
  });

  it("index hors bornes ou Mode non choisi : Brouillon inchangé ; résultat dérivé et validation inchangés (modèle persistant)", () => {
    const draft = openSheetDraft(variable([numberTarget(30), numberTarget(45)]));
    expect(toggleRowFailure(draft, 5)).toBe(draft);
    expect(toggleRowFailure(draft, -1)).toBe(draft);
    const noMode = openSheetDraft({ ...variable([numberTarget(30), numberTarget(45)]), mode: null });
    expect(toggleRowFailure(noMode, 0)).toBe(noMode);
    const result = commitSheetDraft(toggleRowFailure(draft, 1), null);
    expect(result.ok && result.value.series).toEqual({
      kind: "VARIABLE",
      rows: [
        { target: numberTarget(30), pauseSeconds: 10, loadKg: 0 },
        { target: failureTarget(), pauseSeconds: 10, loadKg: 0 },
      ],
    });
  });
});
