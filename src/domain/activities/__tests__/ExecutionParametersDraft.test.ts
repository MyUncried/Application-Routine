import { describe, expect, it } from "@jest/globals";

import type { ExecutionParametersInput, SeriesRow } from "@/domain/activities/ExecutionParameters";
import { cloneExecutionParameters, executionParametersEqual } from "@/domain/activities/ExecutionParameters";
import {
  applyRequestedTotal,
  commitSheetDraft,
  effectiveParameters,
  firstIncompleteSeries,
  isSingleSeries,
  moveRow,
  openSheetDraft,
  setCadenceBeep,
  setMode,
  setRowTarget,
  setSeriesCount,
  setSideMode,
  setVariable,
  type ExecutionSheetDraft,
} from "@/domain/activities/ExecutionParametersDraft";

function parameters(series: ExecutionParametersInput["series"], overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 1,
    mode: "DURATION",
    series,
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 4,
    countdownSeconds: 10,
    endSeconds: 5,
    ...overrides,
  };
}

const row = (target: number | null, pauseSeconds: number): SeriesRow => ({ target, pauseSeconds });
const variable = (...rows: SeriesRow[]) => ({ kind: "VARIABLE" as const, rows });

function committed(draft: ExecutionSheetDraft) {
  const result = commitSheetDraft(draft);
  if (!result.ok) {
    throw new Error(JSON.stringify(result.violations));
  }
  return result.value;
}

describe("P3-04/mode-targets", () => {
  it("N, pauses et bip conservés ; cibles incompatibles null ; À l'échec sans cible ; retour restaure pendant l'ouverture", () => {
    const opened = openSheetDraft(parameters(variable(row(30, 10), row(45, 20), row(60, 30))));
    const repetitions = setMode(opened, "REPETITIONS");
    expect(repetitions.count).toBe(3);
    expect(repetitions.cadenceBeepIntervalSeconds).toBe(4);
    expect(repetitions.rows).toEqual([row(null, 10), row(null, 20), row(null, 30)]);
    const failure = setMode(repetitions, "TO_FAILURE");
    expect(effectiveParameters(failure).series).toEqual(variable(row(null, 10), row(null, 20), row(null, 30)));
    expect(commitSheetDraft(failure).ok).toBe(true);
    const back = setMode(failure, "DURATION");
    expect(back.rows).toEqual([row(30, 10), row(45, 20), row(60, 30)]);
    // Une nouvelle ouverture ne connaît plus les cibles d'un autre mode.
    const reopened = openSheetDraft(committed(failure));
    expect(setMode(reopened, "DURATION").rows).toEqual([row(null, 10), row(null, 20), row(null, 30)]);
  });

  it("une cible « — » n'est jamais zéro et interdit ✓", () => {
    const draft = setMode(openSheetDraft(parameters({ kind: "UNIFORM", count: 2, target: 30, pauseSeconds: 0 })), "REPETITIONS");
    expect(draft.uniform.target).toBeNull();
    expect(commitSheetDraft(draft).ok).toBe(false);
  });

  it("création : première sélection Répétitions uniforme initialise la cible à 1", () => {
    const empty = openSheetDraft(parameters({ kind: "UNIFORM", count: 1, target: null, pauseSeconds: 0 }, { mode: null }));
    expect(setMode(empty, "REPETITIONS").uniform.target).toBe(1);
    expect(setMode(empty, "DURATION").uniform.target).toBeNull();
  });
});

describe("P3-05/equal-variable et P3-05/toggle-restoration", () => {
  it("valeurs égales : le type validé reste VARIABLE avec ses trois lignes", () => {
    const draft = setVariable(openSheetDraft(parameters({ kind: "UNIFORM", count: 3, target: 30, pauseSeconds: 10 })), true);
    expect(committed(draft).series).toEqual(variable(row(30, 10), row(30, 10), row(30, 10)));
  });

  it("déplacer la dernière en tête, passer en uniforme, revenir : (60,30) puis restitution complète", () => {
    const opened = openSheetDraft(parameters(variable(row(30, 10), row(45, 20), row(60, 30))));
    const moved = moveRow(opened, 2, 0);
    const uniform = setVariable(moved, false);
    expect(effectiveParameters(uniform).series).toEqual({ kind: "UNIFORM", count: 3, target: 60, pauseSeconds: 30 });
    const restored = setVariable(uniform, true);
    expect(restored.rows).toEqual([row(60, 30), row(30, 10), row(45, 20)]);
  });

  it("valider en uniforme ne persiste pas le tableau variable caché", () => {
    const uniform = setVariable(openSheetDraft(parameters(variable(row(30, 10), row(45, 20)))), false);
    expect(committed(uniform).series).toEqual({ kind: "UNIFORM", count: 2, target: 30, pauseSeconds: 10 });
  });
});

describe("P3-06/shrink-regrow et P3-06/commit-hidden", () => {
  const A = row(10, 1);
  const B = row(20, 2);
  const C = row(30, 3);
  const D = row(40, 4);

  it("N 4→2→5 : A/B actives, C/D restaurées dans l'ordre, cinquième clone de D", () => {
    const opened = openSheetDraft(parameters(variable(A, B, C, D)));
    const reduced = setSeriesCount(opened, 2);
    expect(reduced.rows).toEqual([A, B]);
    const regrown = setSeriesCount(reduced, 5);
    expect(regrown.rows).toEqual([A, B, C, D, D]);
  });

  it("✓ à N=2 puis réouverture : C/D non conservées, nouvelles lignes clones de B", () => {
    const saved = committed(setSeriesCount(openSheetDraft(parameters(variable(A, B, C, D))), 2));
    expect(saved.series).toEqual(variable(A, B));
    expect(setSeriesCount(openSheetDraft(saved), 4).rows).toEqual([A, B, B, B]);
  });
});

describe("P3-07/move-terminal — déplacement", () => {
  it("cible et Pause voyagent ensemble ; bornes sans effet", () => {
    const opened = openSheetDraft(parameters(variable(row(30, 10), row(45, 20), row(60, 30))));
    expect(moveRow(opened, 2, 0).rows).toEqual([row(60, 30), row(30, 10), row(45, 20)]);
    expect(moveRow(opened, 0, -1)).toBe(opened);
    expect(moveRow(opened, 2, 3)).toBe(opened);
  });

  it("lignes retirées puis restaurées après un déplacement : réinsérées en fin dans leur ordre", () => {
    const opened = openSheetDraft(parameters(variable(row(1, 0), row(2, 0), row(3, 0), row(4, 0))));
    const reduced = setSeriesCount(opened, 2);
    const moved = moveRow(reduced, 1, 0);
    expect(setSeriesCount(moved, 4).rows).toEqual([row(2, 0), row(1, 0), row(3, 0), row(4, 0)]);
  });
});

describe("P3-08/immediate-N1 et P3-08/restoration-N1", () => {
  const base = parameters(variable(row(90, 15), row(45, 20), row(60, 30)), {
    sideMode: "RIGHT_LEFT",
    sideOrder: "BY_SERIES",
    sideRecoverySeconds: 10,
  });

  it("réduire à N1 : effectif uniforme et par côté immédiatement, contrôles sans effet", () => {
    const n1 = setSeriesCount(openSheetDraft(base), 1);
    const effective = effectiveParameters(n1);
    expect(effective.series).toEqual({ kind: "UNIFORM", count: 1, target: 90, pauseSeconds: 15 });
    expect(effective.sideOrder).toBe("BY_SIDE");
    expect(isSingleSeries(n1)).toBe(true);
  });

  it("N3→1→3 avant ✓ restaure lignes et ordre ; ✓ à 1 rouvre uniforme/par côté sans réserve", () => {
    const opened = openSheetDraft(base);
    const back = setSeriesCount(setSeriesCount(opened, 1), 3);
    expect(back.rows).toEqual([row(90, 15), row(45, 20), row(60, 30)]);
    expect(effectiveParameters(back).sideOrder).toBe("BY_SERIES");
    const saved = committed(setSeriesCount(opened, 1));
    expect(saved.series).toEqual({ kind: "UNIFORM", count: 1, target: 90, pauseSeconds: 15 });
    expect(saved.sideOrder).toBe("BY_SIDE");
    const reopened = openSheetDraft(saved);
    expect(reopened.variable).toBe(false);
    expect(reopened.hiddenRows).toEqual([]);
  });
});

describe("P3-11/all-modes-bip", () => {
  it("le bip survit aux trois modes et à ✓", () => {
    let draft = setCadenceBeep(openSheetDraft(parameters({ kind: "UNIFORM", count: 2, target: 30, pauseSeconds: 0 })), 10);
    draft = setMode(setMode(draft, "REPETITIONS"), "TO_FAILURE");
    expect(committed(draft).cadenceBeepIntervalSeconds).toBe(10);
  });
});

describe("P3-16/sheet-boundary et P3-16/fold-incomplete", () => {
  it("✕ : le parent reste octet-équivalent (le sous-brouillon est une copie)", () => {
    const parent = parameters(variable(row(30, 10), row(45, 20)));
    const snapshot = JSON.stringify(parent);
    const draft = setRowTarget(moveRow(openSheetDraft(parent), 1, 0), 0, 99);
    expect(draft.rows[0]).toEqual(row(99, 20));
    expect(JSON.stringify(parent)).toBe(snapshot);
  });

  it("✓ n'applique que les paramètres effectifs valides", () => {
    const parent = parameters(variable(row(30, 10), row(45, 20)));
    const value = committed(setRowTarget(openSheetDraft(parent), 1, 50));
    expect(executionParametersEqual(value, cloneExecutionParameters(parent))).toBe(false);
    expect(value.series).toEqual(variable(row(30, 10), row(50, 20)));
  });

  it("Série 2 incomplète, tableau replié : aucun ✓, message « Série 2 »", () => {
    const draft = setRowTarget(openSheetDraft(parameters(variable(row(30, 10), row(45, 20), row(60, 30)))), 1, null);
    const result = commitSheetDraft(draft);
    expect(result.ok).toBe(false);
    expect(!result.ok && firstIncompleteSeries(result.violations)).toBe(2);
    // Le repli est une propriété de présentation : les lignes restent intactes.
    expect(draft.rows).toHaveLength(3);
  });
});

describe("P3-10 — Pause entre les côtés copiée du Profil à l'activation seulement", () => {
  it("activation copie la valeur courante ; changement de direction la conserve", () => {
    const opened = openSheetDraft(parameters({ kind: "UNIFORM", count: 2, target: 30, pauseSeconds: 0 }));
    const activated = setSideMode(opened, "RIGHT_LEFT", 10);
    expect(activated.sideRecoverySeconds).toBe(10);
    expect(setSideMode({ ...activated, sideRecoverySeconds: 7 }, "LEFT_RIGHT", 25).sideRecoverySeconds).toBe(7);
  });
});

describe("P3-14 — inversion depuis la feuille", () => {
  it("Durée uniforme : N ajusté et message ; variable : inversion indisponible", () => {
    const uniform = openSheetDraft(parameters({ kind: "UNIFORM", count: 1, target: 30, pauseSeconds: 10 }));
    const applied = applyRequestedTotal(uniform, 100)!;
    expect(applied.draft.count).toBe(3);
    expect(applied.inversion).toEqual({ seriesCount: 3, totalSeconds: 120, adjusted: true });
    expect(applyRequestedTotal(openSheetDraft(parameters(variable(row(30, 10), row(30, 10)))), 100)).toBeNull();
  });
});

/**
 * Correction revue 1 (REV-01/REV-02) — transitions croisées : une réserve
 * créée dans un mode ne fournit jamais de cible active dans un autre mode ;
 * l'inversion du total s'applique dès que l'état EFFECTIF est Durée uniforme.
 */
describe("REV-01 — réserves par mode et par identité de ligne", () => {
  const durations = () => openSheetDraft(parameters(variable(row(30, 10), row(60, 20)), { cadenceBeepIntervalSeconds: 3 }));
  const targets = (rows: readonly SeriesRow[]) => rows.map((entry) => entry.target);

  it("tableau réservé (uniforme) → autre mode → réactivation : cibles « — », Pauses/N/bip conservés, ✓ refusé", () => {
    let draft = setVariable(durations(), false);
    draft = setMode(draft, "REPETITIONS");
    draft = setVariable(draft, true);
    expect(targets(draft.rows)).toEqual([null, null]);
    expect(draft.rows.map((entry) => entry.pauseSeconds)).toEqual([10, 20]);
    expect(draft.count).toBe(2);
    expect(draft.cadenceBeepIntervalSeconds).toBe(3);
    const result = commitSheetDraft(draft);
    expect(result.ok).toBe(false);
    expect(result.ok ? null : firstIncompleteSeries(result.violations)).toBe(1);
  });

  it("passage par À l'échec puis Répétitions puis Durée : jamais de conversion ; le retour en Durée restaure 30/60, y compris dans la réserve", () => {
    let draft = setMode(durations(), "TO_FAILURE");
    expect(targets(draft.rows)).toEqual([null, null]);
    expect(commitSheetDraft(draft).ok).toBe(true);
    draft = setMode(draft, "REPETITIONS");
    expect(targets(draft.rows)).toEqual([null, null]);
    draft = setVariable(draft, false);
    draft = setMode(draft, "DURATION");
    expect(draft.uniform.target).toBe(30);
    draft = setVariable(draft, true);
    expect(targets(draft.rows)).toEqual([30, 60]);
  });

  it("lignes retirées (N réduit) puis changement de mode : la restauration de N rend « — » dans le nouveau mode, puis 60 au retour en Durée", () => {
    let draft = setSeriesCount(durations(), 1);
    draft = setMode(draft, "REPETITIONS");
    draft = setRowTarget(draft, 0, 12);
    draft = setSeriesCount(draft, 2);
    expect(targets(draft.rows)).toEqual([12, null]);
    draft = setMode(draft, "DURATION");
    expect(targets(draft.rows)).toEqual([30, 60]);
    draft = setMode(draft, "REPETITIONS");
    expect(targets(draft.rows)).toEqual([12, null]);
  });

  it("déplacement puis changement de mode : les cibles suivent l'identité de la ligne, pas sa position", () => {
    let draft = moveRow(durations(), 1, 0);
    draft = setMode(draft, "REPETITIONS");
    draft = setRowTarget(draft, 0, 8);
    draft = setMode(draft, "DURATION");
    expect(targets(draft.rows)).toEqual([60, 30]);
    draft = moveRow(draft, 0, 1);
    draft = setMode(draft, "REPETITIONS");
    expect(targets(draft.rows)).toEqual([null, 8]);
  });

  it("clone de la dernière ligne au-delà des réserves : reprend les cibles mémorisées de cette ligne, mode par mode", () => {
    let draft = setMode(durations(), "REPETITIONS");
    draft = setRowTarget(draft, 1, 15);
    draft = setSeriesCount(draft, 3);
    expect(targets(draft.rows)).toEqual([null, 15, 15]);
    draft = setMode(draft, "DURATION");
    expect(targets(draft.rows)).toEqual([30, 60, 60]);
  });

  it("✓ n'applique que l'état effectif valide, sans identité ni réserve ; une réouverture ne garde aucune réserve", () => {
    let draft = setMode(durations(), "REPETITIONS");
    draft = setRowTarget(setRowTarget(draft, 0, 10), 1, 12);
    const value = committed(draft);
    expect(value.series).toEqual(variable(row(10, 10), row(12, 20)));
    expect(Object.keys(value.series.kind === "VARIABLE" ? value.series.rows[0]! : {})).toEqual(["target", "pauseSeconds"]);
    const reopened = setMode(openSheetDraft(value), "DURATION");
    expect(targets(reopened.rows)).toEqual([null, null]);
  });
});

describe("REV-02 — inversion cohérente avec la normalisation N=1", () => {
  it("variable ramené à N=1 : inversion appliquée sur la première ligne effective, tableau réservé, total réalisé = total annoncé", () => {
    let draft = openSheetDraft(parameters(variable(row(30, 10), row(60, 20))));
    draft = moveRow(draft, 1, 0);
    draft = setSeriesCount(draft, 1);
    const result = applyRequestedTotal(draft, 160);
    expect(result).not.toBeNull();
    expect(result!.inversion).toEqual({ seriesCount: 2, totalSeconds: 160, adjusted: false });
    const value = committed(result!.draft);
    expect(value.series).toEqual({ kind: "UNIFORM", count: 2, target: 60, pauseSeconds: 20 });
    // Réactivation avant ✓ : le dernier tableau variable est restitué.
    const restored = setVariable(result!.draft, true);
    expect(restored.rows).toEqual([row(60, 20), row(30, 10)]);
  });

  it("inversion indisponible en variable N≥2, Répétitions, À l'échec ou cible non renseignée", () => {
    const base = openSheetDraft(parameters(variable(row(30, 10), row(60, 20))));
    expect(applyRequestedTotal(base, 100)).toBeNull();
    expect(applyRequestedTotal(setMode(setVariable(base, false), "REPETITIONS"), 100)).toBeNull();
    expect(applyRequestedTotal(setMode(setVariable(base, false), "TO_FAILURE"), 100)).toBeNull();
    const empty = openSheetDraft(parameters({ kind: "UNIFORM", count: 1, target: null, pauseSeconds: 0 }));
    expect(applyRequestedTotal(empty, 100)).toBeNull();
  });
});
