import { describe, expect, it } from "@jest/globals";

import type { ExecutionParameters, ExecutionParametersInput, SeriesRow, SeriesTarget } from "@/domain/activities/ExecutionParameters";
import {
  cloneExecutionParameters,
  createEmptyExecutionParameters,
  EXECUTION_PARAMETERS_VERSION,
  executionParametersEqual,
  failureTarget,
  numberTarget,
  readExecutionParameters,
  serializeExecutionParameters,
  unsetTarget,
  validateForSave,
} from "@/domain/activities/ExecutionParameters";
import { buildExecutionLedger } from "@/domain/activities/executionCalculations";
import { toTarget, type FixtureTarget } from "@/domain/activities/testing/executionParametersFixtures";
import {
  applyRequestedTotal,
  canEnableWorkPhases,
  commitSheetDraft,
  deriveSeriesDuration,
  effectiveParameters,
  firstIncompleteSeries,
  isRequestedTotalEditable,
  isSingleSeries,
  moveRow,
  moveWorkPhase,
  normalizeDraftLoad,
  normalizeWorkPhases,
  openSheetDraft,
  removeRow,
  removeWorkPhase,
  requestedParameters,
  setCadenceBeep,
  setCountdown,
  setEnd,
  setLoadEnabled,
  setLoadValue,
  setMode,
  setRowPause,
  setRowTarget as setRowTargetTyped,
  setSeriesCount,
  setSideMode,
  setSideOrder,
  setSideRecovery,
  setStopCondition,
  setUniformPause,
  setUniformTarget,
  setVariable,
  setWorkPhaseCount,
  setWorkPhaseDuration,
  setWorkPhaseLabel,
  setWorkPhasesEnabled,
  sheetDraftResult,
  undoRemoval,
  type ExecutionSheetDraft,
} from "@/domain/activities/ExecutionParametersDraft";

function parameters(series: ExecutionParametersInput["series"], overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode: "DURATION",
    series,
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 4,
    countdownSeconds: 10,
    endSeconds: 5,
    loadEnabled: false,
    ...overrides,
  };
}

/** Cible de fixture : nombre → `NUMBER`, `null` → « — » (`UNSET`), `"FAILURE"` → à l'échec. */
const target = (value: FixtureTarget | null): SeriesTarget => (value === null ? unsetTarget() : toTarget(value));
const row = (value: FixtureTarget | null, pauseSeconds: number): SeriesRow => ({ target: target(value), pauseSeconds, loadKg: 0 });
const variable = (...rows: SeriesRow[]) => ({ kind: "VARIABLE" as const, rows });
const uniform = (count: number, value: FixtureTarget | null, pauseSeconds: number) => ({
  kind: "UNIFORM" as const,
  count,
  target: target(value),
  pauseSeconds,
  loadKg: 0,
  workPhases: [],
});
/** Lecture d'une Cible pour les attendus : nombre, `null` (« — ») ou `"FAILURE"`. */
const plain = (value: SeriesTarget): number | null | "FAILURE" =>
  value.kind === "NUMBER" ? value.value : value.kind === "FAILURE" ? "FAILURE" : null;
const setRowTarget = (draft: ExecutionSheetDraft, index: number, value: number | null) =>
  setRowTargetTyped(draft, index, value === null ? unsetTarget() : numberTarget(value));

function committed(draft: ExecutionSheetDraft) {
  const result = commitSheetDraft(draft);
  if (!result.ok) {
    throw new Error(JSON.stringify(result.violations));
  }
  return result.value;
}

describe("P3-04/mode-targets", () => {
  it("N, pauses et bip conservés ; cibles incompatibles « — » ; retour restaure pendant l'ouverture", () => {
    const opened = openSheetDraft(parameters(variable(row(30, 10), row(45, 20), row(60, 30))));
    const repetitions = setMode(opened, "REPETITIONS");
    expect(repetitions.count).toBe(3);
    expect(repetitions.cadenceBeepIntervalSeconds).toBe(4);
    expect(repetitions.rows).toEqual([row(null, 10), row(null, 20), row(null, 30)]);
    const back = setMode(repetitions, "DURATION");
    expect(back.rows).toEqual([row(30, 10), row(45, 20), row(60, 30)]);
    // Une nouvelle ouverture ne connaît plus les cibles d'un autre mode.
    const saved = committed(setRowTarget(setRowTarget(setRowTarget(repetitions, 0, 8), 1, 9), 2, 10));
    expect(setMode(openSheetDraft(saved), "DURATION").rows).toEqual([row(null, 10), row(null, 20), row(null, 30)]);
  });

  it("une cible « — » n'est jamais zéro et interdit ✓", () => {
    const draft = setMode(openSheetDraft(parameters(uniform(2, 30, 0))), "REPETITIONS");
    expect(draft.uniform.target).toEqual(unsetTarget());
    expect(commitSheetDraft(draft).ok).toBe(false);
  });

  it("création : première sélection Répétitions uniforme initialise la cible à 1", () => {
    const empty = openSheetDraft(parameters(uniform(1, null, 0), { mode: null }));
    expect(setMode(empty, "REPETITIONS").uniform.target).toEqual(numberTarget(1));
    expect(setMode(empty, "DURATION").uniform.target).toEqual(unsetTarget());
  });
});

describe("P3-05/equal-variable et P3-05/toggle-restoration", () => {
  it("valeurs égales : le type validé reste VARIABLE avec ses trois lignes", () => {
    const draft = setVariable(openSheetDraft(parameters(uniform(3, 30, 10))), true);
    expect(committed(draft).series).toEqual(variable(row(30, 10), row(30, 10), row(30, 10)));
  });

  it("déplacer la dernière en tête, passer en uniforme, revenir : (60,30) puis restitution complète", () => {
    const opened = openSheetDraft(parameters(variable(row(30, 10), row(45, 20), row(60, 30))));
    const moved = moveRow(opened, 2, 0);
    const uniformDraft = setVariable(moved, false);
    expect(effectiveParameters(uniformDraft).series).toEqual(uniform(3, 60, 30));
    const restored = setVariable(uniformDraft, true);
    expect(restored.rows).toEqual([row(60, 30), row(30, 10), row(45, 20)]);
  });

  it("valider en uniforme ne persiste pas le tableau variable caché", () => {
    const uniformDraft = setVariable(openSheetDraft(parameters(variable(row(30, 10), row(45, 20)))), false);
    expect(committed(uniformDraft).series).toEqual(uniform(2, 30, 10));
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
    expect(effective.series).toEqual(uniform(1, 90, 15));
    expect(effective.sideOrder).toBe("BY_SIDE");
    expect(isSingleSeries(n1)).toBe(true);
  });

  it("N3→1→3 avant ✓ restaure lignes et ordre ; ✓ à 1 rouvre uniforme/par côté sans réserve", () => {
    const opened = openSheetDraft(base);
    const back = setSeriesCount(setSeriesCount(opened, 1), 3);
    expect(back.rows).toEqual([row(90, 15), row(45, 20), row(60, 30)]);
    expect(effectiveParameters(back).sideOrder).toBe("BY_SERIES");
    const saved = committed(setSeriesCount(opened, 1));
    expect(saved.series).toEqual(uniform(1, 90, 15));
    expect(saved.sideOrder).toBe("BY_SIDE");
    const reopened = openSheetDraft(saved);
    expect(reopened.variable).toBe(false);
    expect(reopened.hiddenRows).toEqual([]);
  });
});

describe("PRE4-Q38 — l'Ordre des côtés choisi survit à N = 1 dans le Brouillon", () => {
  const sides = { sideMode: "RIGHT_LEFT" as const, sideRecoverySeconds: 10 };

  it("PRE4-Q38 — uniforme : BY_SERIES choisi à N = 3, N → 1 effectif BY_SIDE, N → 2 BY_SERIES", () => {
    const chosen = setSideOrder(openSheetDraft(parameters(uniform(3, 30, 10), sides)), "BY_SERIES");
    const n1 = setSeriesCount(chosen, 1);
    expect(n1.sideOrder).toBe("BY_SERIES");
    expect(effectiveParameters(n1).sideOrder).toBe("BY_SIDE");
    const n2 = setSeriesCount(n1, 2);
    expect(effectiveParameters(n2).sideOrder).toBe("BY_SERIES");
    expect(committed(n2).sideOrder).toBe("BY_SERIES");
  });

  it("PRE4-Q38 — variables : retrait jusqu'à N = 1 puis bascule du Régime, l'Ordre revient à N ≥ 2", () => {
    const opened = openSheetDraft(parameters(variable(row(30, 10), row(45, 20)), { ...sides, sideOrder: "BY_SERIES" }));
    const removed = removeRow(opened, 1);
    expect(removed.count).toBe(1);
    expect(removed.sideOrder).toBe("BY_SERIES");
    expect(effectiveParameters(removed).sideOrder).toBe("BY_SIDE");
    expect(effectiveParameters(undoRemoval(removed)).sideOrder).toBe("BY_SERIES");
    const uniformN1 = setVariable(removed, false);
    expect(uniformN1.sideOrder).toBe("BY_SERIES");
    const regrown = setSeriesCount(setVariable(uniformN1, true), 2);
    expect(effectiveParameters(regrown).sideOrder).toBe("BY_SERIES");
  });
});

describe("P3-11/all-modes-bip", () => {
  it("le bip survit aux deux modes et à ✓", () => {
    let draft = setCadenceBeep(openSheetDraft(parameters(uniform(2, 30, 0))), 10);
    draft = setMode(setMode(draft, "REPETITIONS"), "DURATION");
    expect(committed(draft).cadenceBeepIntervalSeconds).toBe(10);
    draft = setRowTargetTyped(setVariable(setMode(draft, "REPETITIONS"), true), 0, numberTarget(8));
    expect(committed(setRowTargetTyped(draft, 1, numberTarget(8))).cadenceBeepIntervalSeconds).toBe(10);
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
    const opened = openSheetDraft(parameters(uniform(2, 30, 0)));
    const activated = setSideMode(opened, "RIGHT_LEFT", 10);
    expect(activated.sideRecoverySeconds).toBe(10);
    expect(setSideMode({ ...activated, sideRecoverySeconds: 7 }, "LEFT_RIGHT", 25).sideRecoverySeconds).toBe(7);
  });
});

describe("P3-14 — inversion depuis la feuille", () => {
  it("Durée uniforme : N ajusté et message ; variable : inversion indisponible", () => {
    const uniformDraft = openSheetDraft(parameters(uniform(1, 30, 10)));
    const applied = applyRequestedTotal(uniformDraft, 100)!;
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
  const targets = (rows: readonly SeriesRow[]) => rows.map((entry) => plain(entry.target));

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

  it("passage par Répétitions puis Durée : jamais de conversion ; le retour en Durée restaure 30/60, y compris dans la réserve", () => {
    let draft = setMode(durations(), "REPETITIONS");
    expect(targets(draft.rows)).toEqual([null, null]);
    draft = setVariable(draft, false);
    draft = setMode(draft, "DURATION");
    expect(plain(draft.uniform.target)).toBe(30);
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
    expect(Object.keys(value.series.kind === "VARIABLE" ? value.series.rows[0]! : {})).toEqual(["target", "pauseSeconds", "loadKg"]);
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
    expect(value.series).toEqual(uniform(2, 60, 20));
    // Réactivation avant ✓ : le dernier tableau variable est restitué.
    const restored = setVariable(result!.draft, true);
    expect(restored.rows).toEqual([row(60, 20), row(30, 10)]);
  });

  it("inversion indisponible en variable N≥2, Répétitions, Cible à l'échec ou cible non renseignée", () => {
    const base = openSheetDraft(parameters(variable(row(30, 10), row(60, 20))));
    expect(applyRequestedTotal(base, 100)).toBeNull();
    expect(applyRequestedTotal(setMode(setVariable(base, false), "REPETITIONS"), 100)).toBeNull();
    expect(applyRequestedTotal(openSheetDraft(parameters(uniform(2, "FAILURE", 10))), 100)).toBeNull();
    const empty = openSheetDraft(parameters(uniform(1, null, 0)));
    expect(applyRequestedTotal(empty, 100)).toBeNull();
  });
});

/**
 * PRE-4 (story 1.1) — adaptation mécanique du brouillon aux Cibles typées :
 * une Cible `FAILURE` (ancien Exercice « à l'échec » migré) est conservée au
 * changement de Mode et recopiée quand N augmente ; le ✓ applique la
 * validation unique avec la ligne de base (AD-13, H25).
 */
describe("PRE-4 story 1.1 — brouillon à Cibles typées", () => {
  it("PRE4-1.1/AC22 — augmenter N depuis une dernière ligne à l'échec ajoute une ligne à l'échec avec la même Pause (variables)", () => {
    const opened = openSheetDraft(parameters(variable(row(30, 10), row("FAILURE", 25)), { mode: "REPETITIONS" }));
    const grown = setSeriesCount(opened, 3);
    expect(grown.rows).toEqual([row(30, 10), row("FAILURE", 25), row("FAILURE", 25)]);
  });

  it("PRE4-1.1/AC22 — changer de Mode conserve les Cibles à l'échec, en identiques comme en variables, dans les deux sens", () => {
    const uniformFailure = openSheetDraft(parameters(uniform(3, "FAILURE", 10), { mode: "REPETITIONS" }));
    const toDuration = setMode(uniformFailure, "DURATION");
    expect(toDuration.uniform.target).toEqual(target("FAILURE"));
    expect(setMode(toDuration, "REPETITIONS").uniform.target).toEqual(target("FAILURE"));

    const variableFailure = openSheetDraft(parameters(variable(row("FAILURE", 10), row("FAILURE", 20)), { mode: "REPETITIONS" }));
    const variableDuration = setMode(variableFailure, "DURATION");
    expect(variableDuration.rows).toEqual([row("FAILURE", 10), row("FAILURE", 20)]);
    expect(setMode(variableDuration, "REPETITIONS").rows).toEqual([row("FAILURE", 10), row("FAILURE", 20)]);

    const durationFailure = openSheetDraft(parameters(variable(row("FAILURE", 10), row(30, 20))));
    expect(setMode(durationFailure, "REPETITIONS").rows).toEqual([row("FAILURE", 10), row(null, 20)]);
  });

  it("PRE4-1.1/AC22 — un Exercice tout à l'échec migré se valide tel quel (✓ disponible)", () => {
    const baseline = parameters(uniform(3, "FAILURE", 10), { mode: "REPETITIONS", cadenceBeepIntervalSeconds: 2 });
    const result = commitSheetDraft(openSheetDraft(baseline), baseline);
    expect(result.ok).toBe(true);
    expect(result.ok && result.value.series).toEqual(uniform(3, "FAILURE", 10));
  });

  it("PRE4-1.1/AC23 — une Cible à renseigner héritée (UNSET) bloque ✓, même inchangée par rapport à la ligne de base", () => {
    const baseline = parameters(uniform(3, null, 10), { mode: "REPETITIONS" });
    const result = commitSheetDraft(openSheetDraft(baseline), baseline);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.violations).toContainEqual(expect.objectContaining({ code: "REQUIRED", field: "target" }));
    // Une Cible réglée par la commande existante devient NUMBER, jamais FAILURE.
    const fixed = commitSheetDraft(setMode(setMode(openSheetDraft(baseline), "DURATION"), "REPETITIONS"), baseline);
    expect(fixed.ok).toBe(false);
    const set = { ...openSheetDraft(baseline), uniform: { target: numberTarget(12), pauseSeconds: 10, loadKg: 0 } };
    const saved = commitSheetDraft(set, baseline);
    expect(saved.ok && saved.value.series).toEqual(uniform(3, 12, 10));
  });

  it("PRE4-1.1/AC7 — valeurs héritées hors bornes inchangées (Durée 5999 s, 150 rép., Bip 11) : ✓ disponible avec la ligne de base", () => {
    const duration = parameters(uniform(2, 5999, 10), { cadenceBeepIntervalSeconds: 0 });
    expect(commitSheetDraft(openSheetDraft(duration), duration).ok).toBe(true);
    const repetitions = parameters(uniform(2, 150, 10), { mode: "REPETITIONS", cadenceBeepIntervalSeconds: 11 });
    expect(commitSheetDraft(openSheetDraft(repetitions), repetitions).ok).toBe(true);
    // Une Pause modifiée dans ses bornes ne transforme pas les valeurs héritées en saisie nouvelle.
    const pauseChanged = { ...openSheetDraft(repetitions), uniform: { target: numberTarget(150), pauseSeconds: 20, loadKg: 0 } };
    expect(commitSheetDraft(pauseChanged, repetitions).ok).toBe(true);
    // Sans ligne de base (création), les bornes s'appliquent.
    expect(commitSheetDraft(openSheetDraft(duration)).ok).toBe(false);
  });

  it("PRE4-1.1/AC7 — valeur héritée modifiée : seule la nouvelle valeur est soumise aux bornes", () => {
    const repetitions = parameters(uniform(2, 150, 10), { mode: "REPETITIONS", cadenceBeepIntervalSeconds: 11 });
    const withTarget = (value: number) => ({
      ...openSheetDraft(repetitions),
      uniform: { target: numberTarget(value), pauseSeconds: 10, loadKg: 0 },
    });
    expect(commitSheetDraft(withTarget(100), repetitions).ok).toBe(true);
    expect(commitSheetDraft(withTarget(101), repetitions).ok).toBe(false);
    expect(commitSheetDraft(setCadenceBeep(withTarget(100), 12), repetitions).ok).toBe(false);
    expect(commitSheetDraft(setCadenceBeep(withTarget(100), 10), repetitions).ok).toBe(true);

    const duration = parameters(uniform(2, 5999, 10));
    const withDuration = (value: number) => ({
      ...openSheetDraft(duration),
      uniform: { target: numberTarget(value), pauseSeconds: 10, loadKg: 0 },
    });
    expect(commitSheetDraft(withDuration(5995), duration).ok).toBe(false);
    expect(commitSheetDraft(withDuration(3535), duration).ok).toBe(true);
  });
});

describe("PRE-4 story 1.3 — augmentation de N depuis une ligne à l'échec", () => {
  it("PRE4-1.3/AC7 — N 2 → 3 : la ligne ajoutée est FAILURE, Pause 20 s, sans valeur ; relue ainsi après ✓ et réouverture", () => {
    const parent = parameters(variable(row(10, 10), row("FAILURE", 20)), { mode: "REPETITIONS" });
    const grown = setSeriesCount(openSheetDraft(parent), 3);
    expect(grown.rows).toEqual([row(10, 10), row("FAILURE", 20), row("FAILURE", 20)]);
    expect(grown.rows[2]).not.toHaveProperty("target.value");
    // AD-9 : la Cible de la ligne ajoutée n'est pas l'objet de la ligne source.
    expect(grown.rows[2]!.target).not.toBe(grown.rows[1]!.target);

    const saved = committed(grown);
    expect(saved.series).toEqual(variable(row(10, 10), row("FAILURE", 20), row("FAILURE", 20)));
    // « Terminer » puis réouverture : forme persistée (v3 depuis PRE-5, AD-18), relue à l'identique.
    const reopened = readExecutionParameters(serializeExecutionParameters(saved as ExecutionParameters));
    expect(reopened.series).toEqual(saved.series);
    expect(openSheetDraft(reopened).rows.map((entry) => [plain(entry.target), entry.pauseSeconds])).toEqual([
      [10, 10],
      ["FAILURE", 20],
      ["FAILURE", 20],
    ]);
  });

  it("PRE4-1.3/AC7 — N 3 → 1 → 3 : les lignes restaurées gardent leur Cible, dans un nouvel objet (AD-9)", () => {
    const opened = openSheetDraft(parameters(variable(row(10, 10), row("FAILURE", 20), row(12, 30)), { mode: "REPETITIONS" }));
    const reduced = setSeriesCount(opened, 1);
    const restored = setSeriesCount(reduced, 3);
    expect(restored.rows).toEqual([row(10, 10), row("FAILURE", 20), row(12, 30)]);
    expect(restored.rows[1]!.target).not.toBe(reduced.hiddenRows[0]!.target);
    expect(restored.rows[2]!.target).not.toBe(reduced.hiddenRows[1]!.target);
    expect(restored.rows[1]!.target).toEqual(reduced.hiddenRows[0]!.target);
  });
});

/**
 * PRE-4 story 3.2 — Brouillon de Feuille : Cibles typées, Régime, mémoire
 * par Mode, retrait et annulation (AC1 à AC14, `epics-parts/epic-3.md`).
 * Un bloc par critère, attendus littéraux.
 */
describe("PRE-4 story 3.2 — Brouillon de Feuille", () => {
  function committedWith(draft: ExecutionSheetDraft, baseline: ExecutionParametersInput | null) {
    const result = commitSheetDraft(draft, baseline);
    if (!result.ok) {
      throw new Error(JSON.stringify(result.violations));
    }
    return result.value;
  }
  const kinds = (draft: ExecutionSheetDraft) =>
    [...draft.rows, ...draft.hiddenRows, ...(draft.savedVariableRows ?? []), draft.uniform].map((entry) => entry.target);

  it("PRE4-3.2/AC1 — Cibles typées : NUMBER ≥ 1, FAILURE ou UNSET ; mélange en variables ; FAILURE dans les quatre combinaisons", () => {
    let draft = openSheetDraft(parameters(variable(row(30, 10), row(45, 20), row(60, 30))));
    draft = setRowTargetTyped(draft, 2, failureTarget());
    expect(draft.rows[2]).toEqual({ target: { kind: "FAILURE" }, pauseSeconds: 30, loadKg: 0 });
    expect(draft.rows[2]!.target).not.toHaveProperty("value");
    draft = setSeriesCount(setMode(setVariable(setSeriesCount(draft, 1), false), "REPETITIONS"), 4);
    draft = setVariable(setMode(draft, "DURATION"), true);
    for (const value of kinds(draft)) {
      expect(["NUMBER", "FAILURE", "UNSET"]).toContain(value.kind);
      expect(value).not.toBeNull();
      if (value.kind === "NUMBER") {
        expect(value.value).toBeGreaterThanOrEqual(1);
      }
    }

    const mixed = openSheetDraft(parameters(variable(row(10, 10), row(12, 20), row("FAILURE", 30)), { mode: "REPETITIONS" }));
    expect(committed(mixed).series).toEqual({
      kind: "VARIABLE",
      rows: [
        { target: { kind: "NUMBER", value: 10 }, pauseSeconds: 10, loadKg: 0 },
        { target: { kind: "NUMBER", value: 12 }, pauseSeconds: 20, loadKg: 0 },
        { target: { kind: "FAILURE" }, pauseSeconds: 30, loadKg: 0 },
      ],
    });

    for (const mode of ["DURATION", "REPETITIONS"] as const) {
      const identical = setUniformTarget(openSheetDraft(parameters(uniform(3, 30, 10), { mode })), failureTarget());
      expect(committed(identical).series).toEqual({ kind: "UNIFORM", count: 3, target: { kind: "FAILURE" }, pauseSeconds: 10, loadKg: 0, workPhases: [] });
      const variables = setRowTargetTyped(openSheetDraft(parameters(variable(row(30, 10), row(30, 20)), { mode })), 1, failureTarget());
      expect(committed(variables).series).toEqual({
        kind: "VARIABLE",
        rows: [
          { target: { kind: "NUMBER", value: 30 }, pauseSeconds: 10, loadKg: 0 },
          { target: { kind: "FAILURE" }, pauseSeconds: 20, loadKg: 0 },
        ],
      });
    }
  });

  it("PRE4-3.2/AC2 — valeurs initiales en création ; Répétitions d'abord → NUMBER 1 ; Durée puis Répétitions → UNSET ; côté → Sans changement au ✓ ; jamais retour à « — »", () => {
    const created = openSheetDraft(createEmptyExecutionParameters({ countdownSeconds: 10, endSeconds: 5 }));
    expect(created.variable).toBe(false);
    expect(effectiveParameters(created)).toEqual({
      version: 3,
      mode: null,
      series: { kind: "UNIFORM", count: 1, target: { kind: "UNSET" }, pauseSeconds: 0, loadKg: 0, workPhases: [] },
      sideMode: null,
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 0,
      cadenceBeepIntervalSeconds: 0,
      countdownSeconds: 10,
      endSeconds: 5,
      loadEnabled: false,
    });
    expect(setMode(created, "REPETITIONS").uniform.target).toEqual({ kind: "NUMBER", value: 1 });
    expect(setMode(setMode(created, "DURATION"), "REPETITIONS").uniform.target).toEqual({ kind: "UNSET" });

    const value = committed(setUniformTarget(setMode(created, "DURATION"), numberTarget(30)));
    expect(value.sideMode).toBe("UNILATERAL");
    expect(value.mode).toBe("DURATION");

    // FR-05-02 : une fois un Mode choisi, chaque transition candidate le laisse renseigné.
    const chosen = setUniformTarget(setMode(created, "DURATION"), numberTarget(30));
    const variables = setVariable(setSeriesCount(chosen, 3), true);
    const removed = removeRow(variables, 1);
    const candidates: readonly [string, ExecutionSheetDraft][] = [
      ["setSeriesCount 3", setSeriesCount(chosen, 3)],
      ["setSeriesCount 1", setSeriesCount(variables, 1)],
      ["setVariable true", variables],
      ["setVariable false", setVariable(variables, false)],
      ["removeRow", removed],
      ["undoRemoval", undoRemoval(removed)],
      ["applyRequestedTotal", applyRequestedTotal(chosen, 100)!.draft],
      ["setMode REPETITIONS", setMode(chosen, "REPETITIONS")],
    ];
    expect(candidates.map(([label, draft]) => [label, draft.mode])).toEqual([
      ["setSeriesCount 3", "DURATION"],
      ["setSeriesCount 1", "DURATION"],
      ["setVariable true", "DURATION"],
      ["setVariable false", "DURATION"],
      ["removeRow", "DURATION"],
      ["undoRemoval", "DURATION"],
      ["applyRequestedTotal", "DURATION"],
      ["setMode REPETITIONS", "REPETITIONS"],
    ]);
  });

  it("PRE4-3.2/AC3 — Durée → Répétitions : tout conservé sauf les Cibles (UNSET, UNSET, FAILURE), Régime variables", () => {
    const parent = parameters(variable(row(30, 10), row(45, 20), row("FAILURE", 30)), {
      cadenceBeepIntervalSeconds: 2,
      sideMode: "RIGHT_LEFT",
      sideOrder: "BY_SERIES",
      sideRecoverySeconds: 5,
      countdownSeconds: 10,
      endSeconds: 5,
      loadEnabled: false,
    });
    const repetitions = setMode(openSheetDraft(parent), "REPETITIONS");
    expect(repetitions.variable).toBe(true);
    expect(effectiveParameters(repetitions)).toEqual({
      version: 3,
      mode: "REPETITIONS",
      series: {
        kind: "VARIABLE",
        rows: [
          { target: { kind: "UNSET" }, pauseSeconds: 10, loadKg: 0 },
          { target: { kind: "UNSET" }, pauseSeconds: 20, loadKg: 0 },
          { target: { kind: "FAILURE" }, pauseSeconds: 30, loadKg: 0 },
        ],
      },
      sideMode: "RIGHT_LEFT",
      sideOrder: "BY_SERIES",
      sideRecoverySeconds: 5,
      cadenceBeepIntervalSeconds: 2,
      countdownSeconds: 10,
      endSeconds: 5,
      loadEnabled: false,
    });
  });

  it("PRE4-3.2/AC4 — retour en Durée : 30 s, 45 s, échec ; mémoire par identité (déplacement, retrait, restauration) ; précédence H27 ; UNSET sans mémoire reste UNSET", () => {
    const opened = openSheetDraft(parameters(variable(row(30, 10), row(45, 20), row("FAILURE", 30))));
    const repetitions = setMode(opened, "REPETITIONS");
    expect(setMode(repetitions, "DURATION").rows).toEqual([row(30, 10), row(45, 20), row("FAILURE", 30)]);

    // H4 : réordonnancement, retrait annulé, réduction puis restauration de N.
    let draft = moveRow(repetitions, 2, 0);
    draft = undoRemoval(removeRow(draft, 1));
    draft = setSeriesCount(setSeriesCount(draft, 1), 3);
    expect(setMode(draft, "DURATION").rows).toEqual([row("FAILURE", 30), row(30, 10), row(45, 20)]);

    // H27 : la ligne 1 a reçu FAILURE en Répétitions ; 30 s n'est pas restauré.
    const failed = setRowTargetTyped(repetitions, 0, failureTarget());
    expect(setMode(failed, "DURATION").rows).toEqual([row("FAILURE", 10), row(45, 20), row("FAILURE", 30)]);

    // P37 : aucune mémoire pour le Mode cible → UNSET.
    const fromRepetitions = openSheetDraft(parameters(variable(row(12, 10), row(15, 20)), { mode: "REPETITIONS" }));
    expect(setMode(fromRepetitions, "DURATION").rows).toEqual([row(null, 10), row(null, 20)]);
  });

  it("PRE4-3.2/AC5 — identiques → variables copie N lignes ; retour reprend la première ligne de l'ordre courant ; dernier tableau restitué ; après ✓ copie uniforme", () => {
    const opened = openSheetDraft(parameters(uniform(3, "FAILURE", 20), { cadenceBeepIntervalSeconds: 3 }));
    let draft = setVariable(opened, true);
    expect(draft.rows).toEqual([row("FAILURE", 20), row("FAILURE", 20), row("FAILURE", 20)]);
    expect(draft.cadenceBeepIntervalSeconds).toBe(3);

    draft = moveRow(setRowTargetTyped(draft, 1, numberTarget(45)), 1, 0);
    draft = setVariable(draft, false);
    expect(effectiveParameters(draft).series).toEqual(uniform(3, 45, 20));
    expect(setVariable(draft, true).rows).toEqual([row(45, 20), row("FAILURE", 20), row("FAILURE", 20)]);

    const saved = committed(draft);
    expect(saved.series).toEqual(uniform(3, 45, 20));
    expect(setVariable(openSheetDraft(saved), true).rows).toEqual([row(45, 20), row(45, 20), row(45, 20)]);
  });

  it("PRE4-3.2/AC6 — Régime explicite : variables à valeurs égales reste variables après ✓ et réouverture ; uniforme → identiques ; N = 1 → identiques effectif", () => {
    const opened = openSheetDraft(parameters(variable(row(30, 10), row(30, 10), row(30, 10))));
    expect(opened.variable).toBe(true);
    const saved = committed(opened);
    expect(saved.series).toEqual(variable(row(30, 10), row(30, 10), row(30, 10)));
    expect(openSheetDraft(saved).variable).toBe(true);
    expect(openSheetDraft(parameters(uniform(3, 30, 10))).variable).toBe(false);
    expect(openSheetDraft(parameters(uniform(3, 30, 10), { mode: "REPETITIONS" })).variable).toBe(false);
    expect(effectiveParameters(openSheetDraft(parameters(variable(row(30, 10))))).series).toEqual(uniform(1, 30, 10));
  });

  it("PRE4-3.2/AC7 — N 5 → 3 → 5 → 6 : Réserve dans l'ordre, ligne ajoutée copie la dernière (FAILURE comprise) ; N borné à 1..99 (FR-12-06)", () => {
    const L = [row(10, 1), row(15, 2), row(20, 3), row(25, 4), row(30, 5)] as const;
    const opened = openSheetDraft(parameters(variable(...L)));
    const three = setSeriesCount(opened, 3);
    expect(three.rows).toEqual([L[0], L[1], L[2]]);
    expect(three.hiddenRows).toEqual([L[3], L[4]]);
    const five = setSeriesCount(three, 5);
    expect(five.rows).toEqual([L[0], L[1], L[2], L[3], L[4]]);
    const six = setSeriesCount(five, 6);
    expect(six.rows[5]).toEqual(row(30, 5));
    expect(six.count).toBe(6);

    const failureLast = openSheetDraft(parameters(variable(row(10, 1), row("FAILURE", 7))));
    expect(setSeriesCount(failureLast, 3).rows).toEqual([row(10, 1), row("FAILURE", 7), row("FAILURE", 7)]);

    // FR-12-06 : N à 1 et à 99, jamais 0 ni 100.
    expect(setSeriesCount(opened, 0).count).toBe(1);
    expect(setSeriesCount(opened, -3).rows).toEqual([L[0]]);
    const ninetyNine = setSeriesCount(opened, 100);
    expect(ninetyNine.count).toBe(99);
    expect(ninetyNine.rows).toHaveLength(99);
    expect(ninetyNine.rows[98]).toEqual(row(30, 5));
    expect(setSeriesCount(openSheetDraft(parameters(uniform(2, 30, 10))), 100).count).toBe(99);
    expect(setSeriesCount(openSheetDraft(parameters(uniform(2, 30, 10))), 0).count).toBe(1);
  });

  it("PRE4-3.2/AC8 — déplacement de la ligne 3 en tête : ordre renuméroté, PN portée par la nouvelle dernière, Réserve réinsérée en fin, Bip intact", () => {
    const opened = openSheetDraft(parameters(variable(row(30, 10), row(45, 20), row("FAILURE", 30)), { cadenceBeepIntervalSeconds: 2 }));
    const moved = moveRow(opened, 2, 0);
    expect(effectiveParameters(moved).series).toEqual(variable(row("FAILURE", 30), row(30, 10), row(45, 20)));
    const ledger = buildExecutionLedger(effectiveParameters(moved));
    expect(ledger[ledger.length - 1]).toEqual({ kind: "SERIES_PAUSE", series: 3, side: "NONE", seconds: 20 });
    expect(moved.cadenceBeepIntervalSeconds).toBe(2);

    const four = openSheetDraft(parameters(variable(row(10, 1), row(15, 2), row(20, 3), row(25, 4))));
    const reordered = moveRow(setSeriesCount(four, 2), 1, 0);
    expect(setSeriesCount(reordered, 4).rows).toEqual([row(15, 2), row(10, 1), row(20, 3), row(25, 4)]);
  });

  it("PRE4-3.2/AC9 — N = 1 normalisé dès le Brouillon sur la première ligne courante ; N ≥ 2 restaure variables et l'Ordre ; ✓ à N = 1 uniforme", () => {
    const opened = openSheetDraft(
      parameters(variable(row(30, 10), row(45, 20), row(60, 30)), { sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES", sideRecoverySeconds: 5 }),
    );
    const single = setSeriesCount(moveRow(opened, 2, 0), 1);
    const effective = effectiveParameters(single);
    expect(effective.series).toEqual(uniform(1, 60, 30));
    expect(effective.sideOrder).toBe("BY_SIDE");

    const back = setSeriesCount(single, 2);
    expect(effectiveParameters(back).series).toEqual(variable(row(60, 30), row(30, 10)));
    expect(effectiveParameters(back).sideOrder).toBe("BY_SERIES");

    const saved = committed(single);
    expect(saved.series).toEqual(uniform(1, 60, 30));
    expect(saved.sideOrder).toBe("BY_SIDE");
  });

  describe("PRE4-3.2/AC10 — retrait d'une ligne et annulation (Q29)", () => {
    const A = row(10, 1);
    const B = row(15, 2);
    const C = row(20, 3);
    const D = row(25, 4);
    const opened = () => openSheetDraft(parameters(variable(A, B, C, D), { sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES" }));

    it("PRE4-3.2/AC10 — la ligne 2 part avec sa Cible et sa Pause ; N = 3 ; l'annulation la restaure à sa position 2", () => {
      const removed = removeRow(opened(), 1);
      expect(removed.count).toBe(3);
      expect(effectiveParameters(removed).series).toEqual(variable(A, C, D));
      expect(removed.pendingRemoval).toEqual({ kind: "series", index: 1, row: B, rowId: 2 });
      const restored = undoRemoval(removed);
      expect(restored.count).toBe(4);
      expect(effectiveParameters(restored).series).toEqual(variable(A, B, C, D));
      expect(restored.pendingRemoval).toBeNull();
      expect(restored.rowIds).toEqual(opened().rowIds);
    });

    const invalidating: readonly [string, (draft: ExecutionSheetDraft) => ExecutionSheetDraft][] = [
      ["Cible", (draft) => setRowTargetTyped(draft, 0, numberTarget(35))],
      ["Cible : ✓ du Sélecteur qui applique la même valeur", (draft) => setRowTargetTyped(draft, 0, numberTarget(10))],
      ["Pause", (draft) => setRowPause(draft, 0, 40)],
      ["N", (draft) => setSeriesCount(draft, 4)],
      ["Mode", (draft) => setMode(draft, "REPETITIONS")],
      ["Régime", (draft) => setVariable(draft, false)],
      ["Bip", (draft) => setCadenceBeep(draft, 3)],
      ["Pause commune", (draft) => setUniformPause(draft, 15)],
      ["Pause entre les côtés", (draft) => setSideRecovery(draft, 12)],
      ["réordonnancement", (draft) => moveRow(draft, 2, 0)],
      ["autre retrait", (draft) => removeRow(draft, 0)],
      ["Cible commune", (draft) => setUniformTarget(draft, numberTarget(20))],
      ["Changement de côté", (draft) => setSideMode(draft, "LEFT_RIGHT", 10)],
      ["Ordre des côtés", (draft) => setSideOrder(draft, "BY_SIDE")],
      ["Compte à rebours", (draft) => setCountdown(draft, 7)],
      ["Fin d’exercice", (draft) => setEnd(draft, 3)],
    ];

    it.each(invalidating)("PRE4-3.2/AC10 — Q29 : une modification « %s » invalide l'annulation", (_, transition) => {
      const removed = removeRow(opened(), 1);
      expect(removed.pendingRemoval).not.toBeNull();
      const next = transition(removed);
      expect(next).not.toBe(removed);
      if (next.pendingRemoval !== null) {
        // « autre retrait » : seul le nouveau retrait est annulable, jamais la ligne 2.
        expect(next.pendingRemoval).toEqual({ kind: "series", index: 0, row: A, rowId: 1 });
        expect(effectiveParameters(undoRemoval(next)).series).toEqual(variable(A, C, D));
      } else {
        expect(undoRemoval(next)).toBe(next);
      }
    });

    it("PRE4-3.2/AC10 — Q29 : l'Inversion du total (modification de N) invalide l'annulation", () => {
      const removed = removeRow(openSheetDraft(parameters(variable(row(30, 10), row(30, 10)))), 1);
      const applied = applyRequestedTotal(removed, 120)!;
      expect(applied.draft.pendingRemoval).toBeNull();
    });

    // Q29, volet « ouvrir puis fermer un popover ou le Sélecteur sans application ne
    // l'invalide pas » : l'état des surfaces n'est pas dans le Brouillon (AD-2, AD-15).
    // Ce cas se prouve au niveau de l'interface (stories 3.3 et 3.6), pas ici. Le volet
    // « le ✓ du Sélecteur l'invalide » est couvert ci-dessus (Cible réappliquée).

    it("PRE4-3.2/AC10 — Cible ou Pause d'une ligne hors bornes : Brouillon inchangé, annulation comprise", () => {
      const removed = removeRow(opened(), 1);
      expect(setRowTargetTyped(removed, 3, numberTarget(45))).toBe(removed);
      expect(setRowTargetTyped(removed, -1, numberTarget(45))).toBe(removed);
      expect(setRowPause(removed, 3, 40)).toBe(removed);
      expect(setRowPause(removed, 0.5, 40)).toBe(removed);
    });

    it("PRE4-3.2/AC10 — annulation devenue incohérente (position disparue) : Brouillon inchangé, sans recalage", () => {
      const removed = removeRow(opened(), 3);
      const inconsistent: ExecutionSheetDraft = { ...removed, rows: removed.rows.slice(0, 1), rowIds: removed.rowIds.slice(0, 1), count: 1 };
      expect(undoRemoval(inconsistent)).toBe(inconsistent);
    });

    it("PRE4-3.2/AC10 — retrait combiné à la Réserve : N 4 → 3, retrait, annulation, N remonté → ordre restauré, sans collision", () => {
      let draft = setSeriesCount(opened(), 3);
      expect(draft.hiddenRows).toEqual([D]);
      draft = removeRow(draft, 0);
      expect(effectiveParameters(draft).series).toEqual(variable(B, C));
      expect(draft.count).toBe(2);
      expect(draft.hiddenRows).toEqual([D]);
      draft = undoRemoval(draft);
      expect(draft.count).toBe(3);
      expect(draft.rows).toEqual([A, B, C]);
      expect(draft.hiddenRows).toEqual([D]);
      draft = setSeriesCount(draft, 4);
      expect(draft.rows).toEqual([A, B, C, D]);
      expect(draft.count).toBe(draft.rows.length);
      expect(draft.hiddenRows).toEqual([]);
      expect(new Set(draft.rowIds).size).toBe(4);
      expect(draft.rowIds).toEqual(opened().rowIds);

      // Sans annulation : N remonté restitue la Réserve après les lignes restantes.
      const withoutUndo = setSeriesCount(removeRow(setSeriesCount(opened(), 3), 0), 3);
      expect(withoutUndo.rows).toEqual([B, C, D]);
      expect(withoutUndo.hiddenRows).toEqual([]);
      expect(new Set(withoutUndo.rowIds).size).toBe(3);
    });

    it("PRE4-3.2/AC10 — Q29 : seules les transitions sans effet (même Mode, même Régime, déplacement sur place) laissent l'annulation intacte", () => {
      const removed = removeRow(opened(), 1);
      expect(setMode(removed, "DURATION")).toBe(removed);
      expect(setVariable(removed, true)).toBe(removed);
      expect(moveRow(removed, 1, 1)).toBe(removed);
    });

    it("PRE4-3.2/AC10 — retrait refusé à N = 1, hors variables et hors bornes ; un retrait vers N = 1 normalise (AC9), l'annulation rétablit", () => {
      const single = openSheetDraft(parameters(variable(row(30, 10))));
      expect(removeRow(single, 0)).toBe(single);
      const identical = openSheetDraft(parameters(uniform(3, 30, 10)));
      expect(removeRow(identical, 0)).toBe(identical);
      const two = openSheetDraft(
        parameters(variable(row(30, 10), row(45, 20)), { sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES" }),
      );
      expect(removeRow(two, 2)).toBe(two);
      expect(removeRow(two, -1)).toBe(two);

      const toOne = removeRow(two, 0);
      expect(toOne.count).toBe(1);
      expect(isSingleSeries(toOne)).toBe(true);
      expect(effectiveParameters(toOne).series).toEqual(uniform(1, 45, 20));
      expect(effectiveParameters(toOne).sideOrder).toBe("BY_SIDE");
      expect(removeRow(toOne, 0)).toBe(toOne);
      const restored = undoRemoval(toOne);
      expect(effectiveParameters(restored).series).toEqual(variable(row(30, 10), row(45, 20)));
      expect(effectiveParameters(restored).sideOrder).toBe("BY_SERIES");
    });
  });

  it("PRE4-3.2/AC11 — ✕ laisse le parent intact ; ✓ appelle validateForSave et produit d'un bloc, sans identité, Réserve, mémoire ni pendingRemoval ; violation en union", () => {
    const parent = parameters(variable(row(30, 10), row(45, 20), row(60, 30), row(90, 40)));
    const snapshot = JSON.stringify(parent);
    let draft = openSheetDraft(parent);
    draft = setMode(setMode(draft, "REPETITIONS"), "DURATION");
    draft = setVariable(setVariable(draft, false), true);
    draft = setSeriesCount(draft, 3);
    draft = moveRow(setRowTargetTyped(draft, 0, numberTarget(35)), 2, 0);
    draft = removeRow(draft, 1);
    // ✕ : le Brouillon est abandonné, le parent n'a jamais été touché.
    expect(JSON.stringify(parent)).toBe(snapshot);

    // Sans retrait ni déplacement, l'alignement par identité coïncide avec celui par rang.
    const plainDraft = setRowTargetTyped(openSheetDraft(parent), 1, numberTarget(50));
    expect(commitSheetDraft(plainDraft, parent)).toEqual(validateForSave(effectiveParameters(plainDraft), parent));

    const result = commitSheetDraft(draft, parent);
    expect(result).toEqual({
      ok: true,
      value: {
        version: 3,
        mode: "DURATION",
        series: {
          kind: "VARIABLE",
          rows: [
            { target: { kind: "NUMBER", value: 60 }, pauseSeconds: 30, loadKg: 0 },
            { target: { kind: "NUMBER", value: 45 }, pauseSeconds: 20, loadKg: 0 },
          ],
        },
        sideMode: "UNILATERAL",
        sideOrder: "BY_SIDE",
        sideRecoverySeconds: 0,
        cadenceBeepIntervalSeconds: 4,
        countdownSeconds: 10,
        endSeconds: 5,
        loadEnabled: false,
      },
    });
    // Clés exactes : aucune identité, Réserve, mémoire, `pendingRemoval` ni indicateur d'héritage.
    expect(result.ok && Object.keys(result.value)).toEqual([
      "version",
      "mode",
      "series",
      "sideMode",
      "sideOrder",
      "sideRecoverySeconds",
      "cadenceBeepIntervalSeconds",
      "countdownSeconds",
      "endSeconds",
      "loadEnabled",
    ]);
    expect(result.ok && result.value.series.kind === "VARIABLE" && result.value.series.rows.map((entry) => Object.keys(entry))).toEqual([
      ["target", "pauseSeconds", "loadKg"],
      ["target", "pauseSeconds", "loadKg"],
    ]);
    expect(JSON.stringify(parent)).toBe(snapshot);

    const invalid = commitSheetDraft(setRowTargetTyped(draft, 1, unsetTarget()), parent);
    expect(invalid).toEqual({
      ok: false,
      violations: [{ code: "REQUIRED", field: "target", level: "STRUCTURE", seriesNumber: 2 }],
    });
    expect(invalid).not.toHaveProperty("value");
    expect(JSON.stringify(parent)).toBe(snapshot);
  });

  it("PRE4-3.2/AC11 — le parent, tableaux imbriqués compris, reste inchangé après setRowTarget, removeRow et undoRemoval sur le Brouillon", () => {
    const deepFreeze = <T>(value: T): T => {
      if (typeof value === "object" && value !== null) {
        Object.values(value).forEach(deepFreeze);
        Object.freeze(value);
      }
      return value;
    };
    const parent = deepFreeze(parameters(variable(row(30, 10), row(45, 20), row("FAILURE", 30))));
    const before = structuredClone(parent);
    const rowsBefore = parent.series.kind === "VARIABLE" ? parent.series.rows : [];
    const firstTargetBefore = rowsBefore[0]!.target;
    let draft = setRowTargetTyped(openSheetDraft(parent), 0, numberTarget(35));
    draft = setRowPause(draft, 1, 25);
    draft = undoRemoval(removeRow(draft, 2));
    draft = removeRow(draft, 0);
    expect(effectiveParameters(draft).series).toEqual(variable(row(45, 25), row("FAILURE", 30)));
    expect(parent).toEqual(before);
    expect(parent.series.kind === "VARIABLE" && parent.series.rows).toBe(rowsBefore);
    expect(rowsBefore[0]!.target).toBe(firstTargetBefore);
    expect(rowsBefore).toEqual([row(30, 10), row(45, 20), row("FAILURE", 30)]);
  });

  describe("PRE4-3.2/AC12 — ligne de base alignée par identité de ligne (AD-13, H25)", () => {
    // D-430 : aucune valeur positive n'est plus sous le minimum (1 s) ; la valeur historique hors bornes est 3600 s (au-dessus de 3535 s).
    const legacy = parameters(variable(row(30, 10), row(5999, 20), row(3600, 30)), { cadenceBeepIntervalSeconds: 11 });

    it("PRE4-3.2/AC12 — la ligne 2 (5999 s) déplacée en tête sans modification : Bip 11 et 5999 s tolérés, ✓ réussi, valeurs inchangées", () => {
      const moved = moveRow(openSheetDraft(legacy), 1, 0);
      const value = committedWith(moved, legacy);
      expect(value.series).toEqual(variable(row(5999, 20), row(30, 10), row(3600, 30)));
      expect(value.cadenceBeepIntervalSeconds).toBe(11);
      // Un alignement par rang l'aurait refusé : la preuve que la base suit l'identité.
      expect(validateForSave(effectiveParameters(moved), legacy, { baselineRowIndexes: [0, 1, 2] }).ok).toBe(false);
    });

    it("PRE4-3.2/AC12 — Feuille rouverte après un ✓ qui a réordonné : la base reste celle de l'Éditeur, rapprochée par valeur", () => {
      const firstSheet = committedWith(moveRow(openSheetDraft(legacy), 1, 0), legacy);
      const reopened = openSheetDraft(firstSheet);
      expect(committedWith(reopened, legacy).series).toEqual(variable(row(5999, 20), row(30, 10), row(3600, 30)));
      // Second déplacement (3600 s en tête) : toujours toléré.
      expect(committedWith(moveRow(reopened, 2, 0), legacy).series).toEqual(variable(row(3600, 30), row(5999, 20), row(30, 10)));
      // La ligne 5999 s modifiée devient une saisie nouvelle : les bornes s'appliquent à elle seule (Q36 : sans pas).
      expect(commitSheetDraft(setRowTargetTyped(reopened, 0, numberTarget(5995)), legacy)).toEqual({
        ok: false,
        violations: [
          { code: "OUT_OF_RANGE", field: "target", level: "INPUT", details: { min: 1, max: 3535 }, seriesNumber: 1 },
        ],
      });
    });

    it("PRE4-3.2/AC12 — une ligne nouvelle (ajoutée par N) n'a pas de base : les bornes s'y appliquent", () => {
      const grown = setSeriesCount(openSheetDraft(legacy), 4);
      expect(grown.rows[3]).toEqual(row(3600, 30));
      expect(commitSheetDraft(grown, legacy)).toEqual({
        ok: false,
        violations: [
          { code: "OUT_OF_RANGE", field: "target", level: "INPUT", details: { min: 1, max: 3535 }, seriesNumber: 4 },
        ],
      });
    });

    it("PRE4-3.2/AC12 — retrait annulé et passage de Régime sans modification gardent la base", () => {
      const restored = undoRemoval(removeRow(openSheetDraft(legacy), 1));
      expect(committedWith(restored, legacy).series).toEqual(legacy.series);
      const toUniform = setVariable(moveRow(openSheetDraft(legacy), 1, 0), false);
      expect(committedWith(toUniform, legacy).series).toEqual(uniform(3, 5999, 20));
      const uniformLegacy = parameters(uniform(3, 5999, 10));
      expect(committedWith(setVariable(openSheetDraft(uniformLegacy), true), uniformLegacy).series).toEqual(
        variable(row(5999, 10), row(5999, 10), row(5999, 10)),
      );
    });

    it("PRE4-3.2/AC12 — Cible tolérée dans le seul Mode de la base ; UNSET héritée bloque toujours ; création : bornes partout", () => {
      const uniformLegacy = parameters(uniform(2, 5999, 10));
      const otherMode = setUniformTarget(setMode(openSheetDraft(uniformLegacy), "REPETITIONS"), numberTarget(5999));
      expect(commitSheetDraft(otherMode, uniformLegacy)).toEqual({
        ok: false,
        violations: [{ code: "OUT_OF_RANGE", field: "target", level: "INPUT", details: { min: 1, max: 100 } }],
      });
      expect(committedWith(setMode(otherMode, "DURATION"), uniformLegacy).series).toEqual(uniform(2, 5999, 10));

      const withUnset = parameters(variable(row(30, 10), row(null, 20)));
      expect(commitSheetDraft(moveRow(openSheetDraft(withUnset), 1, 0), withUnset)).toEqual({
        ok: false,
        violations: [{ code: "REQUIRED", field: "target", level: "STRUCTURE", seriesNumber: 1 }],
      });

      expect(commitSheetDraft(openSheetDraft(legacy), null)).toEqual({
        ok: false,
        violations: [
          { code: "OUT_OF_RANGE", field: "cadenceBeepIntervalSeconds", level: "INPUT", details: { min: 0, max: 10 } },
          { code: "OUT_OF_RANGE", field: "target", level: "INPUT", details: { min: 1, max: 3535 }, seriesNumber: 2 },
          { code: "OUT_OF_RANGE", field: "target", level: "INPUT", details: { min: 1, max: 3535 }, seriesNumber: 3 },
        ],
      });
    });
  });

  it("PRE4-3.2/AC13 — bilatéral N = 3 : 3 Séries par côté, mêmes Cibles des deux côtés ; Bip 0..10 conservé dans les deux Modes, après ✓", () => {
    const bilateral = openSheetDraft(
      parameters(variable(row(30, 10), row(45, 20), row(60, 30)), { sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE", sideRecoverySeconds: 5 }),
    );
    const work = buildExecutionLedger(effectiveParameters(bilateral)).filter((event) => event.kind === "WORK");
    expect(work).toEqual([
      { kind: "WORK", series: 1, side: "RIGHT", seconds: 30 },
      { kind: "WORK", series: 2, side: "RIGHT", seconds: 45 },
      { kind: "WORK", series: 3, side: "RIGHT", seconds: 60 },
      { kind: "WORK", series: 1, side: "LEFT", seconds: 30 },
      { kind: "WORK", series: 2, side: "LEFT", seconds: 45 },
      { kind: "WORK", series: 3, side: "LEFT", seconds: 60 },
    ]);

    let draft = setCadenceBeep(bilateral, 10);
    draft = setMode(draft, "REPETITIONS");
    expect(draft.cadenceBeepIntervalSeconds).toBe(10);
    draft = setRowTargetTyped(setRowTargetTyped(setRowTargetTyped(draft, 0, numberTarget(8)), 1, numberTarget(9)), 2, numberTarget(10));
    const saved = committed(draft);
    expect(saved.cadenceBeepIntervalSeconds).toBe(10);
    expect(setMode(openSheetDraft(saved), "DURATION").cadenceBeepIntervalSeconds).toBe(10);
    expect(committed(setCadenceBeep(draft, 0)).cadenceBeepIntervalSeconds).toBe(0);
    expect(commitSheetDraft(setCadenceBeep(draft, 11)).ok).toBe(false);
  });

  it("PRE4-3.2/AC14 — N hérité : ouvert, validé et relu inchangé, Inversion indisponible, aucune purge exigée ; hors héritage le ✓ vide la Réserve ; ✓ prêt pour copie", () => {
    const inheritedParent = parameters(uniform(4, 30, 10), { cadenceBeepIntervalSeconds: 2 });
    const inherited = openSheetDraft(inheritedParent, { inheritedSeriesCount: true });
    expect(inherited.inheritedSeriesCount).toBe(true);
    expect(isRequestedTotalEditable(inherited)).toBe(false);
    expect(applyRequestedTotal(inherited, 200)).toBeNull();
    const value = committedWith(inherited, inheritedParent);
    expect(value).toEqual(inheritedParent);
    expect(readExecutionParameters(serializeExecutionParameters(value))).toEqual(inheritedParent);
    expect(Object.keys(value)).not.toContain("inheritedSeriesCount");
    // Sans l'indicateur, la même Feuille permet l'Inversion.
    expect(isRequestedTotalEditable(openSheetDraft(inheritedParent))).toBe(true);

    const variableParent = parameters(variable(row(30, 10), row(45, 20), row("FAILURE", 30)));
    const inheritedVariable = setSeriesCount(openSheetDraft(variableParent, { inheritedSeriesCount: true }), 2);
    expect(inheritedVariable.hiddenRows).toEqual([row("FAILURE", 30)]);
    expect(committedWith(openSheetDraft(variableParent, { inheritedSeriesCount: true }), variableParent)).toEqual(variableParent);
    expect(committedWith(inheritedVariable, variableParent).series).toEqual(variable(row(30, 10), row(45, 20)));

    // Hors héritage : la Réserve n'est pas transmise, une réouverture n'en a plus.
    const saved = committedWith(setSeriesCount(openSheetDraft(variableParent), 2), variableParent);
    const reopened = openSheetDraft(saved);
    expect(reopened.hiddenRows).toEqual([]);
    expect(setSeriesCount(reopened, 3).rows).toEqual([row(30, 10), row(45, 20), row(45, 20)]);

    // FR-11-06 : Bip commun et Cible typée de chaque Série, sans état intermédiaire.
    expect(committedWith(openSheetDraft(variableParent), variableParent)).toEqual({
      version: 3,
      mode: "DURATION",
      series: {
        kind: "VARIABLE",
        rows: [
          { target: { kind: "NUMBER", value: 30 }, pauseSeconds: 10, loadKg: 0 },
          { target: { kind: "NUMBER", value: 45 }, pauseSeconds: 20, loadKg: 0 },
          { target: { kind: "FAILURE" }, pauseSeconds: 30, loadKg: 0 },
        ],
      },
      sideMode: "UNILATERAL",
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 0,
      cadenceBeepIntervalSeconds: 4,
      countdownSeconds: 10,
      endSeconds: 5,
      loadEnabled: false,
    });
  });

  // PRE-4 story 4.1 (AC12, FR-01-09) : complète PRE4-3.2/AC14 sur un Exercice
  // bilatéral à Cibles mixtes, au seul niveau du modèle (aucun parcours
  // d'interface : la production d'un N hérité est hors périmètre, P42).
  it("PRE4-4.1/AC12 — N hérité : Paramètres à Cibles mixtes validés (création, ligne de base, stockage) et relus sans erreur, N inchangé, indicateur jamais transmis", () => {
    const parent = parameters(variable(row(30, 10), row(45, 20), row("FAILURE", 30)), {
      sideMode: "RIGHT_LEFT",
      sideRecoverySeconds: 5,
      cadenceBeepIntervalSeconds: 2,
    });
    const draft = openSheetDraft(parent, { inheritedSeriesCount: true });
    expect(draft.count).toBe(3);

    const created = committedWith(draft, null);
    const edited = committedWith(draft, parent);
    expect(created).toEqual(parent);
    expect(edited).toEqual(parent);
    expect(Object.keys(edited)).not.toContain("inheritedSeriesCount");
    expect(Object.keys(created)).not.toContain("inheritedSeriesCount");
    expect(serializeExecutionParameters(created)).not.toContain("inherited");
    expect(serializeExecutionParameters(edited)).not.toContain("inherited");

    const stored = validateForSave(edited, "STORAGE");
    expect(stored.ok).toBe(true);
    const reread = readExecutionParameters(serializeExecutionParameters(edited));
    expect(reread).toEqual(parent);
    expect(reread.series.kind === "VARIABLE" && reread.series.rows).toHaveLength(3);
  });
});

describe("PRE-5 story 1.1 — transport par le Brouillon, sans transition nouvelle (AD-25, AD-33)", () => {
  const withPhases = parameters(
    {
      kind: "UNIFORM",
      count: 3,
      target: numberTarget(9),
      pauseSeconds: 15,
      loadKg: 0,
      workPhases: [
        { id: 4, label: "Descente", durationSeconds: 6 },
        { id: 2, label: "Maintien", durationSeconds: 3 },
      ],
    },
    { sideMode: "LEFT_RIGHT", sideOrder: "BY_SERIES", sideRecoverySeconds: 5 },
  );
  const loadUnderSans = parameters(
    { kind: "UNIFORM", count: 2, target: numberTarget(12), pauseSeconds: 10, loadKg: 2.5, workPhases: [] },
    { mode: "REPETITIONS", loadEnabled: false },
  );
  const variableLoads = parameters(
    {
      kind: "VARIABLE",
      rows: [
        { target: numberTarget(12), pauseSeconds: 10, loadKg: 20 },
        { target: numberTarget(10), pauseSeconds: 10, loadKg: 0 },
        { target: failureTarget(), pauseSeconds: 0, loadKg: 12.75 },
      ],
    },
    { mode: "REPETITIONS", loadEnabled: true },
  );

  it("PRE5-1.1/AC13 — requestedParameters(openSheetDraft(p)) = p : charge sous Sans, charges variables, phases et identités, LEFT_RIGHT", () => {
    for (const parent of [withPhases, loadUnderSans, variableLoads, parameters(uniform(3, 30, 10), { sideMode: "LEFT_RIGHT" })]) {
      expect(requestedParameters(openSheetDraft(parent))).toEqual(parent);
    }
  });

  it("PRE5-1.1/AC13 — le Brouillon porte workPhases, nextPhaseId, loadEnabled et loadKg dans l'uniforme et chaque ligne", () => {
    const phased = openSheetDraft(withPhases);
    expect(phased.workPhases).toEqual([
      { id: 4, label: "Descente", durationSeconds: 6 },
      { id: 2, label: "Maintien", durationSeconds: 3 },
    ]);
    expect(phased.nextPhaseId).toBe(5);
    expect(phased.loadEnabled).toBe(false);
    expect(openSheetDraft(loadUnderSans).uniform.loadKg).toBe(2.5);
    expect(openSheetDraft(loadUnderSans).nextPhaseId).toBe(1);
    const loads = openSheetDraft(variableLoads);
    expect(loads.loadEnabled).toBe(true);
    expect(loads.rows.map((entry) => entry.loadKg)).toEqual([20, 0, 12.75]);
    // Les lignes retirées par N et le tableau réservé gardent leur charge (la charge suit la ligne).
    const shrunk = setSeriesCount(loads, 1);
    expect(shrunk.hiddenRows.map((entry) => entry.loadKg)).toEqual([0, 12.75]);
    expect(setSeriesCount(shrunk, 3).rows.map((entry) => entry.loadKg)).toEqual([20, 0, 12.75]);
    const toUniform = setVariable(loads, false);
    expect(toUniform.uniform.loadKg).toBe(20);
    expect(toUniform.savedVariableRows?.map((entry) => entry.loadKg)).toEqual([20, 0, 12.75]);
    expect(setVariable(toUniform, true).rows.map((entry) => entry.loadKg)).toEqual([20, 0, 12.75]);
  });

  it("PRE5-1.1/AC13 — ✓ sans modification ne perd aucune donnée lue (phases, charge sous Sans, charges variables, côtés)", () => {
    for (const parent of [withPhases, loadUnderSans, variableLoads]) {
      expect(commitSheetDraft(openSheetDraft(parent), parent)).toEqual({ ok: true, value: parent });
      expect(commitSheetDraft(openSheetDraft(parent), null)).toEqual({ ok: true, value: parent });
    }
  });

  it("PRE5-1.1/AC13 — le Brouillon n'est pas lié au parent : phases et charges copiées", () => {
    const draft = openSheetDraft(withPhases);
    const parentPhases = withPhases.series.kind === "UNIFORM" ? withPhases.series.workPhases : [];
    expect(draft.workPhases).not.toBe(parentPhases);
    expect(draft.workPhases[0]).not.toBe(parentPhases[0]);
  });
});

describe("PRE-5 story 2.1 — transitions du Brouillon : phases, charge, Condition d'arrêt et côtés (AD-19 à AD-25)", () => {
  /** Libellé par défaut fourni par l'appelant (le domaine n'importe pas l'i18n, AD-20). */
  const phaseLabel = (position: number) => `Phase ${position}`;
  const durations = (draft: ExecutionSheetDraft) => draft.workPhases.map((phase) => phase.durationSeconds);
  const labels = (draft: ExecutionSheetDraft) => draft.workPhases.map((phase) => phase.label);
  const ids = (draft: ExecutionSheetDraft) => draft.workPhases.map((phase) => phase.id);
  /** Durée, identiques, 3 séries, Cible 30 s, Pause 15 s. */
  const durationParent = () => parameters(uniform(3, 30, 15), { sideMode: "RIGHT_LEFT", sideRecoverySeconds: 8 });

  /** Brouillon à phases construit par les seules transitions (activation, stepper, durées). */
  function withPhases(values: readonly (number | null)[], parent: ExecutionParametersInput = durationParent()): ExecutionSheetDraft {
    let draft = setWorkPhasesEnabled(openSheetDraft(parent), true);
    while (draft.workPhases.length < values.length) {
      draft = setWorkPhaseCount(draft, draft.workPhases.length + 1);
    }
    for (const [index, id] of ids(draft).entries()) {
      draft = setWorkPhaseDuration(draft, id, values[index]!);
    }
    expect(durations(draft)).toEqual(values);
    return draft;
  }

  describe("PRE5-2.1/AC1 — éligibilité et compatibilité (FR-2, AD-20)", () => {
    it("canEnableWorkPhases : Durée, identiques effectives (N = 1 compris), Cible non FAILURE", () => {
      expect(canEnableWorkPhases(openSheetDraft(durationParent()))).toBe(true);
      expect(canEnableWorkPhases(openSheetDraft(parameters(uniform(3, null, 15))))).toBe(true);
      const variableAtOne = setSeriesCount(openSheetDraft(parameters(variable(row(30, 10), row(20, 5)))), 1);
      expect(canEnableWorkPhases(variableAtOne)).toBe(true);
      expect(canEnableWorkPhases(openSheetDraft(parameters(uniform(3, 12, 15), { mode: "REPETITIONS" })))).toBe(false);
      expect(canEnableWorkPhases(openSheetDraft(parameters(variable(row(30, 10), row(20, 5)))))).toBe(false);
      expect(canEnableWorkPhases(openSheetDraft(parameters(uniform(3, "FAILURE", 15))))).toBe(false);
      expect(canEnableWorkPhases(openSheetDraft(parameters(uniform(3, null, 15), { mode: null })))).toBe(false);
    });

    it("activation refusée hors éligibilité : Répétitions, variables N ≥ 2, Cible FAILURE → Brouillon inchangé", () => {
      for (const parent of [
        parameters(uniform(3, 12, 15), { mode: "REPETITIONS" }),
        parameters(variable(row(30, 10), row(20, 5))),
        parameters(uniform(3, "FAILURE", 15)),
      ]) {
        const draft = openSheetDraft(parent);
        expect(setWorkPhasesEnabled(draft, true)).toBe(draft);
      }
    });

    it("N = 1 avec un état variable demandé : phases et charge commune passent d'abord par l'uniforme (setVariable(false))", () => {
      const variableAtOne = setSeriesCount(openSheetDraft(parameters(variable(row(30, 10), row(20, 5)))), 1);
      const phased = setWorkPhasesEnabled(variableAtOne, true);
      expect(phased.variable).toBe(false);
      expect(phased.uniform.pauseSeconds).toBe(10);
      expect(durations(phased)).toEqual([30, null]);
      expect(phased.savedVariableRows).toHaveLength(2);
      expect(effectiveParameters(phased)).toEqual(requestedParameters(phased));
      const loaded = setLoadValue(variableAtOne, "uniform", 5);
      expect(loaded.variable).toBe(false);
      expect(loaded.uniform.loadKg).toBe(5);
      expect(loaded.savedVariableRows?.map((entry) => entry.loadKg)).toEqual([0, 0]);
    });

    it("avec des phases : Répétitions, Variables, À l'échec et Cible commune refusés (aucune conversion destructive)", () => {
      const draft = withPhases([6, 3]);
      expect(setMode(draft, "REPETITIONS")).toBe(draft);
      expect(setVariable(draft, true)).toBe(draft);
      expect(setStopCondition(draft, "FAILURE")).toBe(draft);
      expect(setUniformTarget(draft, numberTarget(50))).toBe(draft);
      expect(setUniformTarget(draft, failureTarget())).toBe(draft);
    });

    it("la mémoire des Cibles par Mode est conservée à travers les phases", () => {
      let draft = openSheetDraft(durationParent());
      draft = setUniformTarget(setMode(draft, "REPETITIONS"), numberTarget(12));
      draft = setWorkPhasesEnabled(setMode(draft, "DURATION"), true);
      expect(durations(draft)).toEqual([30, null]);
      draft = setWorkPhasesEnabled(draft, false);
      expect(plain(setMode(draft, "REPETITIONS").uniform.target)).toBe(12);
    });
  });

  describe("PRE5-2.1/AC2 — création et nombre de phases (FR-5, AD-20, D-432)", () => {
    it("Avec crée deux phases : identités tirées de nextPhaseId, libellés vides, la première à la durée courante, D = 30 s", () => {
      const draft = setWorkPhasesEnabled(openSheetDraft(durationParent()), true);
      expect(draft.workPhases).toEqual([
        { id: 1, label: "", durationSeconds: 30 },
        { id: 2, label: "", durationSeconds: null },
      ]);
      expect(draft.nextPhaseId).toBe(3);
      expect(draft.uniform.target).toEqual(numberTarget(30));
    });

    it("sans durée (« — ») ou Cible héritée hors de 1..3535 : [null, null], D à renseigner ; rien n'est inventé", () => {
      for (const value of [null, 5999] as const) {
        const draft = setWorkPhasesEnabled(openSheetDraft(parameters(uniform(3, value, 15))), true);
        expect(durations(draft)).toEqual([null, null]);
        expect(draft.uniform.target).toEqual(unsetTarget());
      }
    });

    it("stepper : + ajoute en fin à la durée de la dernière ; refus à 6 → 7, à 2 → 1 et hors pas", () => {
      const two = withPhases([6, 3]);
      const three = setWorkPhaseCount(two, 3);
      expect(durations(three)).toEqual([6, 3, 3]);
      expect(three.uniform.target).toEqual(numberTarget(12));
      expect(ids(three)).toEqual([1, 2, 3]);
      expect(durations(setWorkPhaseCount(withPhases([6, null]), 3))).toEqual([6, null, null]);
      const six = withPhases([1, 2, 3, 4, 5, 6]);
      expect(setWorkPhaseCount(six, 7)).toBe(six);
      expect(six.workPhases).toHaveLength(6);
      expect(setWorkPhaseCount(two, 1)).toBe(two);
      expect(setWorkPhaseCount(two, 4)).toBe(two);
      expect(setWorkPhaseCount(two, 2)).toBe(two);
      expect(setWorkPhaseCount(two, 2.5)).toBe(two);
    });

    it("stepper − : retire la dernière par le même retrait annulable que la croix", () => {
      const three = withPhases([6, 3, 5]);
      const two = setWorkPhaseCount(three, 2);
      expect(durations(two)).toEqual([6, 3]);
      expect(two.uniform.target).toEqual(numberTarget(9));
      expect(two.pendingRemoval).toEqual({ kind: "phase", index: 2, phase: three.workPhases[2] });
      const restored = undoRemoval(two);
      expect(restored.workPhases).toEqual(three.workPhases);
      expect(restored.uniform.target).toEqual(numberTarget(14));
    });

    it("deriveSeriesDuration, seul écrivain de D : NUMBER(Σ) si Σ ≥ 1, sinon UNSET ; null compte pour 0 ; aucune borne propre", () => {
      const draft = withPhases([6, null]);
      expect(draft.uniform.target).toEqual(numberTarget(6));
      expect(setWorkPhaseDuration(draft, 1, null).uniform.target).toEqual(unsetTarget());
      expect(setWorkPhaseDuration(draft, 1, 0).uniform.target).toEqual(unsetTarget());
      expect(setWorkPhaseDuration(draft, 2, 3530).uniform.target).toEqual(numberTarget(3536));
      expect(deriveSeriesDuration({ ...draft, uniform: { ...draft.uniform, target: unsetTarget() } }).uniform.target).toEqual(numberTarget(6));
    });

    it("phase seule relue des données : D redérivée dès que la liste est non vide ; Sans garde D ; null puis ✓ refusé, phase conservée (D-438)", () => {
      const parent = parameters({
        kind: "UNIFORM",
        count: 3,
        target: numberTarget(9),
        pauseSeconds: 15,
        loadKg: 0,
        workPhases: [{ id: 1, label: "Seule", durationSeconds: 9 }],
      });
      const changed = setWorkPhaseDuration(openSheetDraft(parent), 1, 12);
      expect(changed.uniform.target).toEqual(numberTarget(12));
      expect(setWorkPhasesEnabled(changed, false).uniform.target).toEqual(numberTarget(12));
      const emptied = setWorkPhaseDuration(changed, 1, null);
      expect(emptied.uniform.target).toEqual(unsetTarget());
      const result = sheetDraftResult(emptied, phaseLabel);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        // PRE-7 (D-438) : la phase n'est plus retirée ; sa durée manquante est signalée par son identité.
        expect(result.violations).toEqual([
          { code: "REQUIRED", field: "target", level: "STRUCTURE" },
          { code: "REQUIRED", field: "workPhases", level: "STRUCTURE", phaseId: 1 },
        ]);
      }
      const normalized = normalizeWorkPhases(emptied, phaseLabel);
      expect(normalized.uniform.target).toEqual(unsetTarget());
      expect(normalized.workPhases).toEqual([{ id: 1, label: "Seule", durationSeconds: null }]);
    });

    it("aucun calcul de la dernière phase sur le restant : modifier une phase ne change pas les autres", () => {
      const draft = setWorkPhaseDuration(withPhases([6, 3, 5]), 1, 10);
      expect(durations(draft)).toEqual([10, 3, 5]);
      expect(draft.uniform.target).toEqual(numberTarget(18));
    });

    it("setWorkPhaseDuration : entier ≥ 0 ou null ; sinon, ou identité inconnue, Brouillon inchangé", () => {
      const draft = withPhases([6, 3]);
      for (const value of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
        expect(setWorkPhaseDuration(draft, 1, value)).toBe(draft);
      }
      expect(setWorkPhaseDuration(draft, 99, 4)).toBe(draft);
    });
  });

  describe("PRE5-2.1/AC3 — déplacement, libellé, retrait et annulation (FR-4, FR-8, AD-25, AD-27)", () => {
    const labelled = () => {
      let draft = withPhases([6, 3, 5]);
      draft = setWorkPhaseLabel(draft, 1, "Descente");
      draft = setWorkPhaseLabel(draft, 2, "Maintien");
      return setWorkPhaseLabel(draft, 3, "Montée");
    };

    it("le libellé suit l'identité de sa phase au déplacement ; D inchangée", () => {
      const moved = moveWorkPhase(labelled(), 0, 2);
      expect(labels(moved)).toEqual(["Maintien", "Montée", "Descente"]);
      expect(ids(moved)).toEqual([2, 3, 1]);
      expect(durations(moved)).toEqual([3, 5, 6]);
      expect(moved.uniform.target).toEqual(numberTarget(14));
      const draft = labelled();
      expect(moveWorkPhase(draft, 1, 1)).toBe(draft);
      expect(moveWorkPhase(draft, 0, 3)).toBe(draft);
    });

    it("libellé : 20 points de code au plus (pas UTF-16) ; au-delà ou identité inconnue, Brouillon inchangé", () => {
      const draft = labelled();
      expect(labels(setWorkPhaseLabel(draft, 1, "😀".repeat(20)))[0]).toBe("😀".repeat(20));
      expect(setWorkPhaseLabel(draft, 1, "😀".repeat(21))).toBe(draft);
      expect(setWorkPhaseLabel(draft, 1, "a".repeat(21))).toBe(draft);
      expect(setWorkPhaseLabel(draft, 42, "Autre")).toBe(draft);
    });

    it("retrait par la croix puis annulation : ordre, libellés, durées, D et nombre restitués", () => {
      const draft = labelled();
      const removed = removeWorkPhase(draft, 2);
      expect(labels(removed)).toEqual(["Descente", "Montée"]);
      expect(removed.uniform.target).toEqual(numberTarget(11));
      expect(removed.pendingRemoval).toEqual({ kind: "phase", index: 1, phase: { id: 2, label: "Maintien", durationSeconds: 3 } });
      const restored = undoRemoval(removed);
      expect(restored.workPhases).toEqual(draft.workPhases);
      expect(restored.uniform.target).toEqual(numberTarget(14));
      expect(restored.pendingRemoval).toBeNull();
    });

    it("(D-438, remplace D-371 et D-432 pour le retrait) croix à deux phases : Sans, la durée restante devient la durée de série ; annulation restitue les deux phases", () => {
      const two = setWorkPhaseLabel(setWorkPhaseLabel(withPhases([9, 4]), 1, "Descente"), 2, "Montée");
      const sans = removeWorkPhase(two, 2);
      expect(sans.workPhases).toEqual([]);
      expect(sans.uniform.target).toEqual(numberTarget(9));
      expect(sans.pendingRemoval).toEqual({
        kind: "phase",
        index: 1,
        phase: { id: 2, label: "Montée", durationSeconds: 4 },
        clearedPhases: two.workPhases,
      });
      expect(committed(sans).series).toEqual(uniform(3, 9, 15));
      const restored = undoRemoval(sans);
      expect(restored.workPhases).toEqual(two.workPhases);
      expect(restored.uniform.target).toEqual(numberTarget(13));
      expect(restored.pendingRemoval).toBeNull();
      // Retrait de la première : la seconde, restante, donne la durée de série.
      expect(removeWorkPhase(two, 1).uniform.target).toEqual(numberTarget(4));
    });

    it("(D-438) croix à deux phases avec une durée restante non renseignée : Sans, durée de série à renseigner (UNSET)", () => {
      const sans = removeWorkPhase(withPhases([9, null]), 1);
      expect(sans.workPhases).toEqual([]);
      expect(sans.uniform.target).toEqual(unsetTarget());
      expect(durations(undoRemoval(sans))).toEqual([9, null]);
    });

    it("(D-438) croix à deux phases avec une durée restante à 0 : Sans, durée de série à renseigner (UNSET)", () => {
      const sans = removeWorkPhase(withPhases([9, 0]), 1);
      expect(sans.workPhases).toEqual([]);
      expect(sans.uniform.target).toEqual(unsetTarget());
    });

    it("(Q29) après 2 → Sans, une autre modification invalide l'annulation : undoRemoval laisse le Brouillon inchangé", () => {
      const sans = removeWorkPhase(withPhases([9, 4]), 2);
      expect(sans.pendingRemoval).not.toBeNull();
      for (const next of [setUniformTarget(sans, numberTarget(20)), setMode(sans, "REPETITIONS")]) {
        expect(next).not.toBe(sans);
        expect(next.pendingRemoval).toBeNull();
        expect(undoRemoval(next)).toBe(next);
      }
    });

    it("phase seule relue des données : la croix est refusée (Sans reste le geste) ; identité inconnue refusée ; stepper toujours borné à 2", () => {
      const single = openSheetDraft(
        parameters({ kind: "UNIFORM", count: 3, target: numberTarget(9), pauseSeconds: 15, loadKg: 0, workPhases: [{ id: 1, label: "Seule", durationSeconds: 9 }] }),
      );
      expect(removeWorkPhase(single, 1)).toBe(single);
      const three = labelled();
      expect(removeWorkPhase(three, 99)).toBe(three);
      const two = withPhases([6, 3]);
      expect(setWorkPhaseCount(two, 1)).toBe(two);
    });

    it("une seule annulation en attente : un nouveau retrait remplace la précédente", () => {
      const first = removeWorkPhase(setWorkPhaseCount(labelled(), 4), 1);
      const second = removeWorkPhase(first, 3);
      expect(second.pendingRemoval).toEqual({ kind: "phase", index: 1, phase: { id: 3, label: "Montée", durationSeconds: 5 } });
      expect(labels(undoRemoval(second))).toEqual(["Maintien", "Montée", ""]);
    });

    const invalidating: readonly [string, (draft: ExecutionSheetDraft) => ExecutionSheetDraft][] = [
      ["libellé", (draft) => setWorkPhaseLabel(draft, 1, "Autre")],
      ["durée", (draft) => setWorkPhaseDuration(draft, 1, 7)],
      ["déplacement", (draft) => moveWorkPhase(draft, 0, 1)],
      ["stepper +", (draft) => setWorkPhaseCount(draft, 3)],
      ["Sans", (draft) => setWorkPhasesEnabled(draft, false)],
      ["charge Avec", (draft) => setLoadEnabled(draft, true)],
      ["charge commune", (draft) => setLoadValue(draft, "uniform", 2)],
      ["N", (draft) => setSeriesCount(draft, 4)],
      ["Pause commune", (draft) => setUniformPause(draft, 20)],
      ["Bip", (draft) => setCadenceBeep(draft, 2)],
      ["Changement de côté", (draft) => setSideMode(draft, "UNILATERAL", 10)],
    ];

    it.each(invalidating)("Q29 : une modification « %s » invalide l'annulation d'une phase", (_, transition) => {
      const removed = removeWorkPhase(labelled(), 2);
      const next = transition(removed);
      expect(next.pendingRemoval).toBeNull();
      expect(undoRemoval(next)).toBe(next);
    });

    it("Q29 : une transition de phases invalide aussi l'annulation d'une série", () => {
      const removed = removeRow(openSheetDraft(parameters(variable(row(30, 10), row(20, 5)))), 1);
      expect(removed.pendingRemoval?.kind).toBe("series");
      const phased = setWorkPhasesEnabled(removed, true);
      expect(phased.pendingRemoval).toBeNull();
      expect(undoRemoval(phased)).toBe(phased);
    });

    it("une transition refusée laisse le Brouillon inchangé, annulation comprise", () => {
      const removed = removeWorkPhase(labelled(), 2);
      expect(setStopCondition(removed, "FAILURE")).toBe(removed);
      expect(setMode(removed, "REPETITIONS")).toBe(removed);
      // PRE-7 (D-438) : la croix est permise à deux phases ; une identité inconnue reste refusée.
      expect(removeWorkPhase(removed, 99)).toBe(removed);
    });
  });

  describe("PRE5-2.1/AC4 — Avec → Sans et retour à Avec (FR-8, décision du 19/10)", () => {
    it("6, 3, 5 → Sans : aucune phase, durée de série 14 s, autres paramètres conservés ; modifiable", () => {
      const draft = withPhases([6, 3, 5]);
      const sans = setWorkPhasesEnabled(draft, false);
      expect(sans.workPhases).toEqual([]);
      expect(sans.uniform.target).toEqual(numberTarget(14));
      expect({ ...requestedParameters(sans), series: null }).toEqual({ ...requestedParameters(draft), series: null });
      expect(sans.count).toBe(3);
      expect(sans.uniform.pauseSeconds).toBe(15);
      expect(setUniformTarget(sans, numberTarget(20)).uniform.target).toEqual(numberTarget(20));
      expect(committed(sans).series).toEqual(uniform(3, 14, 15));
      expect(setWorkPhasesEnabled(openSheetDraft(durationParent()), false)).toEqual(openSheetDraft(durationParent()));
    });

    it("phases toutes nulles → Sans : durée de série à renseigner (UNSET), rien n'est inventé", () => {
      const sans = setWorkPhasesEnabled(withPhases([null, null]), false);
      expect(sans.workPhases).toEqual([]);
      expect(sans.uniform.target).toEqual(unsetTarget());
    });

    it("retour à Avec : deux nouvelles phases, la première à la durée courante (14 s), sans mémoire des anciennes", () => {
      const again = setWorkPhasesEnabled(setWorkPhasesEnabled(setWorkPhaseLabel(withPhases([6, 3, 5]), 1, "Descente"), false), true);
      expect(durations(again)).toEqual([14, null]);
      expect(labels(again)).toEqual(["", ""]);
      expect(ids(again)).toEqual([4, 5]);
      expect(again.uniform.target).toEqual(numberTarget(14));
    });
  });

  describe("PRE5-2.1/AC5 — normalisation et disponibilité du ✓ (FR-9, AD-25 ; D-438 remplace D-373 et écarte le nettoyage FR-3/FR-9/AD-20)", () => {
    it("[0, null] : phases conservées, durées non renseignées ; ✓ refusé par phase et par Cible ; aucune durée inventée (D-438, MFN/AC15)", () => {
      const draft = withPhases([0, null]);
      const normalized = normalizeWorkPhases(draft, phaseLabel);
      expect(durations(normalized)).toEqual([0, null]);
      expect(labels(normalized)).toEqual(["Phase 1", "Phase 2"]);
      expect(normalized.uniform.target).toEqual(unsetTarget());
      const result = sheetDraftResult(draft, phaseLabel);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.violations).toEqual([
          { code: "REQUIRED", field: "target", level: "STRUCTURE" },
          { code: "REQUIRED", field: "workPhases", level: "STRUCTURE", phaseId: 1 },
          { code: "REQUIRED", field: "workPhases", level: "STRUCTURE", phaseId: 2 },
        ]);
      }
      expect(draft.workPhases).toHaveLength(2);
    });

    it("[9, null] : ✓ refusé, la phase vide est conservée ; aucun passage implicite à Sans (D-438, MFN/AC25)", () => {
      const draft = withPhases([9, null]);
      const result = sheetDraftResult(draft, phaseLabel);
      expect(result).toEqual({ ok: false, violations: [{ code: "REQUIRED", field: "workPhases", level: "STRUCTURE", phaseId: 2 }] });
      expect(durations(normalizeWorkPhases(draft, phaseLabel))).toEqual([9, null]);
      expect(sheetDraftResult(setWorkPhaseDuration(draft, 2, 4), phaseLabel).ok).toBe(true);
    });

    it("[6, 0, 3] : ✓ refusé pour la seule phase à 0, conservée (D-438)", () => {
      const result = sheetDraftResult(withPhases([6, 0, 3]), phaseLabel);
      expect(result).toEqual({ ok: false, violations: [{ code: "REQUIRED", field: "workPhases", level: "STRUCTURE", phaseId: 2 }] });
    });

    it("somme de 3 536 s : ✓ indisponible, violation workPhases portant les bornes de la somme ; une durée manquante prime", () => {
      const result = sheetDraftResult(withPhases([3000, 536]), phaseLabel);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.violations).toContainEqual({
          code: "OUT_OF_RANGE",
          field: "workPhases",
          level: "STRUCTURE",
          details: { min: 1, max: 3535 },
        });
      }
      const missing = sheetDraftResult(withPhases([3000, 536, 0]), phaseLabel);
      expect(missing.ok).toBe(false);
      if (!missing.ok) {
        const phaseViolations = missing.violations.filter((violation) => violation.field === "workPhases");
        expect(phaseViolations).toEqual([{ code: "REQUIRED", field: "workPhases", level: "STRUCTURE", phaseId: 3 }]);
      }
      expect(sheetDraftResult(withPhases([3000, 535]), phaseLabel).ok).toBe(true);
    });

    it("libellé vide → « Phase n » selon la position ; aucune phase retirée ; D redérivée (D-438, MFN/AC27)", () => {
      let draft = withPhases([6, 0, 3, null]);
      draft = setWorkPhaseLabel(draft, 2, "Conservée");
      draft = setWorkPhaseLabel(draft, 3, "   ");
      const refused = sheetDraftResult(draft, phaseLabel);
      expect(refused.ok).toBe(false);
      if (!refused.ok) {
        expect(refused.violations.map((violation) => violation.phaseId)).toEqual([2, 4]);
      }
      expect(labels(normalizeWorkPhases(draft, phaseLabel))).toEqual(["Phase 1", "Conservée", "Phase 3", "Phase 4"]);
      const result = sheetDraftResult(setWorkPhaseDuration(setWorkPhaseDuration(draft, 2, 2), 4, 1), phaseLabel);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.series.kind === "UNIFORM") {
        expect(result.value.series.workPhases).toEqual([
          { id: 1, label: "Phase 1", durationSeconds: 6 },
          { id: 2, label: "Conservée", durationSeconds: 2 },
          { id: 3, label: "Phase 3", durationSeconds: 3 },
          { id: 4, label: "Phase 4", durationSeconds: 1 },
        ]);
        expect(result.value.series.target).toEqual(numberTarget(12));
      }
    });

    it("(QN-3) le libellé par défaut est stocké : il ne se renumérote plus après un déplacement", () => {
      const value = committedWith(withPhases([6, 3]));
      const moved = moveWorkPhase(openSheetDraft(value), 0, 1);
      expect(labels(moved)).toEqual(["Phase 2", "Phase 1"]);
      const reread = committedWith(moved);
      expect(reread.series.kind === "UNIFORM" && reread.series.workPhases.map((phase) => phase.label)).toEqual(["Phase 2", "Phase 1"]);
    });

    it("commitSheetDraft et sheetDraftResult rendent le même résultat ; sans defaultLabel, un libellé vide est refusé", () => {
      const parent = durationParent();
      const draft = withPhases([6, 3]);
      expect(commitSheetDraft(draft, null, phaseLabel)).toEqual(sheetDraftResult(draft, phaseLabel));
      expect(commitSheetDraft(draft, parent, phaseLabel)).toEqual(sheetDraftResult(draft, phaseLabel, parent));
      expect(commitSheetDraft(draft)).toEqual(sheetDraftResult(draft, undefined));
      const unlabelled = commitSheetDraft(draft);
      expect(unlabelled.ok).toBe(false);
      if (!unlabelled.ok) {
        expect(unlabelled.violations.map((violation) => violation.field)).toEqual(["workPhases"]);
      }
    });

    it("✓ réussi : ni identité volatile, ni lastNumberById, ni pendingRemoval ; normalizeLoad appliqué", () => {
      let draft = removeWorkPhase(setWorkPhaseCount(withPhases([6, 3]), 3), 3);
      draft = setLoadValue(setLoadEnabled(draft, true), "uniform", null);
      expect(draft.loadEnabled).toBe(true);
      const result = sheetDraftResult(draft, phaseLabel);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Object.keys(result.value).sort()).toEqual(Object.keys(durationParent()).sort());
        expect(result.value).not.toHaveProperty("lastNumberById");
        expect(result.value).not.toHaveProperty("pendingRemoval");
        expect(result.value.loadEnabled).toBe(false);
      }
    });

    it("✕ : le parent reste intact ; rouvrir rend l'état d'ouverture (phases, charge, côtés, Condition d'arrêt)", () => {
      const parent = parameters(
        { kind: "UNIFORM", count: 3, target: numberTarget(9), pauseSeconds: 15, loadKg: 2.5, workPhases: [{ id: 1, label: "A", durationSeconds: 6 }, { id: 2, label: "B", durationSeconds: 3 }] },
        { sideMode: "LEFT_RIGHT", loadEnabled: true },
      );
      const snapshot = cloneExecutionParameters(parent);
      let draft = openSheetDraft(parent);
      draft = setWorkPhaseDuration(setWorkPhaseLabel(setWorkPhaseCount(draft, 3), 1, "Z"), 2, 40);
      draft = setLoadValue(setLoadEnabled(setWorkPhasesEnabled(draft, false), false), "uniform", 7);
      draft = setStopCondition(setSideMode(draft, "UNILATERAL", 10), "FAILURE");
      expect(requestedParameters(draft)).not.toEqual(parent);
      expect(parent).toEqual(snapshot);
      expect(requestedParameters(openSheetDraft(parent))).toEqual(snapshot);
    });
  });

  describe("PRE5-2.1/AC6 — charge dans le Brouillon (FR-10, FR-11, FR-14, AD-19)", () => {
    const variableLoads = (...loads: number[]) =>
      parameters(variable(...loads.map((loadKg) => ({ ...row(30, 10), loadKg }))), { loadEnabled: false });

    it("1re activation sans valeur : 0,25 kg (commune, ou chaque ligne, retirées et réservées comprises)", () => {
      expect(setLoadEnabled(openSheetDraft(durationParent()), true).uniform.loadKg).toBe(0.25);
      const shrunk = setSeriesCount(openSheetDraft(variableLoads(0, 0, 0)), 2);
      const activated = setLoadEnabled(shrunk, true);
      expect(activated.loadEnabled).toBe(true);
      expect(activated.rows.map((entry) => entry.loadKg)).toEqual([0.25, 0.25]);
      expect(activated.hiddenRows.map((entry) => entry.loadKg)).toEqual([0.25]);
      expect(activated.uniform.loadKg).toBe(0.25);
    });

    it("lignes actives à 0 : 0,25 sur les zéros seulement ; la charge positive d'une ligne retirée par N est conservée", () => {
      const shrunk = setSeriesCount(openSheetDraft(variableLoads(0, 0, 5)), 2);
      expect(shrunk.hiddenRows.map((entry) => entry.loadKg)).toEqual([5]);
      const activated = setLoadEnabled(shrunk, true);
      expect(activated.rows.map((entry) => entry.loadKg)).toEqual([0.25, 0.25]);
      expect(activated.hiddenRows.map((entry) => entry.loadKg)).toEqual([5]);
      expect(setSeriesCount(activated, 3).rows.map((entry) => entry.loadKg)).toEqual([0.25, 0.25, 5]);
    });

    it("N = 1 en état variable demandé : l'Inversion du total et la Condition d'arrêt ne passent pas la charge à Sans", () => {
      const parent = parameters(variable({ ...row(30, 10), loadKg: 0 }, { ...row(60, 20), loadKg: 5 }), { loadEnabled: true });
      const atOne = setSeriesCount(openSheetDraft(parent), 1);
      expect(applyRequestedTotal(atOne, 160)!.draft.loadEnabled).toBe(true);
      expect(setStopCondition(atOne, "FAILURE").loadEnabled).toBe(true);
    });

    it("réactivation : valeurs restaurées telles quelles, zéros compris ; sous Sans, valeurs conservées", () => {
      const draft = openSheetDraft(variableLoads(0, 5, 12.5));
      const activated = setLoadEnabled(draft, true);
      expect(activated.rows.map((entry) => entry.loadKg)).toEqual([0, 5, 12.5]);
      const sans = setLoadEnabled(activated, false);
      expect(sans.loadEnabled).toBe(false);
      expect(sans.rows.map((entry) => entry.loadKg)).toEqual([0, 5, 12.5]);
      expect(committed(sans).series).toEqual(variableLoads(0, 5, 12.5).series);
      const uniformSans = openSheetDraft(parameters({ ...uniform(2, 30, 10), loadKg: 2.5 }));
      expect(setLoadEnabled(uniformSans, true).uniform.loadKg).toBe(2.5);
      expect(setLoadEnabled(uniformSans, false)).toBe(uniformSans);
    });

    it("saisie arrondie au 0,25 supérieur ; vide = 0 ; illisible ou négatif = inchangé ; sans propagation", () => {
      const draft = setLoadEnabled(openSheetDraft(durationParent()), true);
      expect(setLoadValue(draft, "uniform", 1.3).uniform.loadKg).toBe(1.5);
      expect(setLoadValue(draft, "uniform", 0.01).uniform.loadKg).toBe(0.25);
      expect(setLoadValue(draft, "uniform", 1).uniform.loadKg).toBe(1);
      expect(setLoadValue(draft, "uniform", null).uniform.loadKg).toBe(0);
      expect(setLoadValue(draft, "uniform", -1)).toBe(draft);
      expect(setLoadValue(draft, "uniform", Number.NaN)).toBe(draft);
      const rows = setLoadEnabled(openSheetDraft(variableLoads(4, 5, 6)), true);
      const typed = setLoadValue(rows, { rowId: rows.rowIds[1]! }, 1.3);
      expect(typed.rows.map((entry) => entry.loadKg)).toEqual([4, 1.5, 6]);
      expect(setLoadValue(rows, { rowId: 99 }, 3)).toBe(rows);
      expect(setLoadValue(rows, "uniform", 3)).toBe(rows);
    });

    it("normalizeLoad jamais pendant la saisie ; à la fermeture du clavier (normalizeDraftLoad) et au ✓", () => {
      const common = setLoadValue(setLoadEnabled(openSheetDraft(durationParent()), true), "uniform", null);
      expect(common.loadEnabled).toBe(true);
      expect(normalizeDraftLoad(common).loadEnabled).toBe(false);
      expect(committed(common).loadEnabled).toBe(false);
      const rows = setLoadEnabled(openSheetDraft(variableLoads(4, 5)), true);
      const oneZero = setLoadValue(rows, { rowId: rows.rowIds[0]! }, 0);
      expect(normalizeDraftLoad(oneZero)).toBe(oneZero);
      const allZero = setLoadValue(oneZero, { rowId: rows.rowIds[1]! }, null);
      expect(allZero.loadEnabled).toBe(true);
      const closed = normalizeDraftLoad(allZero);
      expect(closed.loadEnabled).toBe(false);
      expect(closed.rows.map((entry) => entry.loadKg)).toEqual([0, 0]);
    });

    it("Variables → Identiques : l'uniforme reprend la première ligne, puis normalizeLoad (§9-9)", () => {
      const zeroFirst = setVariable(setLoadEnabled(openSheetDraft(variableLoads(0, 5)), true), false);
      expect(zeroFirst.uniform.loadKg).toBe(0);
      expect(zeroFirst.loadEnabled).toBe(false);
      const positiveFirst = setVariable(setLoadEnabled(openSheetDraft(variableLoads(5, 0)), true), false);
      expect(positiveFirst.uniform.loadKg).toBe(5);
      expect(positiveFirst.loadEnabled).toBe(true);
    });

    it("la charge suit sa série : copie uniforme → variable, ajout, retrait et annulation, déplacement, réserves de N", () => {
      const common = setLoadValue(setLoadEnabled(openSheetDraft(durationParent()), true), "uniform", 8);
      const rows = setVariable(common, true);
      expect(rows.rows.map((entry) => entry.loadKg)).toEqual([8, 8, 8]);
      const typed = setLoadValue(rows, { rowId: rows.rowIds[2]! }, 12);
      expect(setSeriesCount(typed, 4).rows.map((entry) => entry.loadKg)).toEqual([8, 8, 12, 12]);
      expect(moveRow(typed, 2, 0).rows.map((entry) => entry.loadKg)).toEqual([12, 8, 8]);
      const removed = removeRow(typed, 2);
      expect(removed.rows.map((entry) => entry.loadKg)).toEqual([8, 8]);
      expect(undoRemoval(removed).rows.map((entry) => entry.loadKg)).toEqual([8, 8, 12]);
      expect(setSeriesCount(setSeriesCount(typed, 1), 3).rows.map((entry) => entry.loadKg)).toEqual([8, 8, 12]);
    });

    it("Δ48 : Répétitions × Identiques, Répétitions × Variables, À l'échec avec charge — mêmes résultats qu'en Durée", () => {
      const cases = [
        parameters(uniform(3, 30, 10)),
        parameters(uniform(3, 12, 10), { mode: "REPETITIONS" }),
        parameters(variable(row(12, 10), row(10, 10)), { mode: "REPETITIONS" }),
        parameters(uniform(3, "FAILURE", 10), { mode: "REPETITIONS" }),
      ];
      for (const parent of cases) {
        const draft = setLoadEnabled(openSheetDraft(parent), true);
        const typed = draft.variable ? setLoadValue(draft, { rowId: draft.rowIds[0]! }, 1.3) : setLoadValue(draft, "uniform", 1.3);
        const value = committed(typed);
        expect(value.loadEnabled).toBe(true);
        expect(value.series.kind === "UNIFORM" ? value.series.loadKg : value.series.rows.map((entry) => entry.loadKg)).toEqual(
          draft.variable ? [1.5, 0.25] : 1.5,
        );
        // La charge ne change aucune Cible.
        expect(value.series.kind === "UNIFORM" ? value.series.target : value.series.rows.map((entry) => entry.target)).toEqual(
          parent.series.kind === "UNIFORM" ? parent.series.target : parent.series.rows.map((entry) => entry.target),
        );
      }
    });
  });

  describe("PRE5-2.1/AC7 — Condition d'arrêt et mémoire « À la cible » (FR-19, FR-21, AD-23)", () => {
    it("Cible 30 s : À l'échec écrit FAILURE, le retour restaure 30 s", () => {
      const failure = setStopCondition(openSheetDraft(durationParent()), "FAILURE");
      expect(failure.uniform.target).toEqual(failureTarget());
      expect(committed(failure).series).toEqual(uniform(3, "FAILURE", 15));
      expect(setStopCondition(failure, "TARGET").uniform.target).toEqual(numberTarget(30));
      expect(setStopCondition(failure, "FAILURE")).toBe(failure);
    });

    it("sans valeur connue : retour à À la cible → UNSET ; la dernière valeur saisie est restituée", () => {
      const openedFailure = openSheetDraft(parameters(uniform(3, "FAILURE", 15)));
      expect(setStopCondition(openedFailure, "TARGET").uniform.target).toEqual(unsetTarget());
      const typed = setUniformTarget(openSheetDraft(durationParent()), numberTarget(45));
      expect(setStopCondition(setStopCondition(typed, "FAILURE"), "TARGET").uniform.target).toEqual(numberTarget(45));
    });

    it("la mémoire « À la cible » suit l'identité copiée (cloneIdentity) : Variables puis Identiques restituent 30 s", () => {
      let draft = setStopCondition(openSheetDraft(durationParent()), "FAILURE");
      draft = setVariable(setVariable(draft, true), false);
      expect(draft.uniform.target).toEqual(failureTarget());
      expect(setStopCondition(draft, "TARGET").uniform.target).toEqual(numberTarget(30));
    });

    it("mémoire par Mode, jamais écrasée par FAILURE ni UNSET", () => {
      let draft = setStopCondition(openSheetDraft(durationParent()), "FAILURE");
      draft = setMode(draft, "REPETITIONS");
      expect(draft.uniform.target).toEqual(failureTarget());
      expect(setStopCondition(draft, "TARGET").uniform.target).toEqual(unsetTarget());
      draft = setStopCondition(setMode(draft, "DURATION"), "TARGET");
      expect(draft.uniform.target).toEqual(numberTarget(30));
    });

    it("variables effectives (N ≥ 2) : refusée ; N = 1 en état variable demandé : l'uniforme est pris d'abord", () => {
      const rows = openSheetDraft(parameters(variable(row(30, 10), row(20, 5))));
      expect(setStopCondition(rows, "FAILURE")).toBe(rows);
      const atOne = setStopCondition(setSeriesCount(rows, 1), "FAILURE");
      expect(atOne.variable).toBe(false);
      expect(atOne.uniform.target).toEqual(failureTarget());
      expect(setStopCondition(atOne, "TARGET").uniform.target).toEqual(numberTarget(30));
    });

    it("rien de la mémoire n'est persisté : paramètres demandés et ✓ sans lastNumberById", () => {
      const draft = setStopCondition(setStopCondition(openSheetDraft(durationParent()), "FAILURE"), "TARGET");
      expect(draft.lastNumberById).not.toEqual({});
      expect(requestedParameters(draft)).not.toHaveProperty("lastNumberById");
      expect(committed(draft)).toEqual(durationParent());
    });
  });

  describe("PRE5-2.1/AC8 — côtés Avec / Sans (FR-15, AD-21, QN-4)", () => {
    it("Avec écrit RIGHT_LEFT et copie la Pause du Profil à chaque passage ; Sans conserve Enchainement et Pause dans le Brouillon", () => {
      let draft = openSheetDraft(parameters(uniform(3, 30, 10), { sideOrder: "BY_SERIES", sideRecoverySeconds: 4 }));
      draft = setSideMode(draft, "RIGHT_LEFT", 12);
      expect(draft.sideMode).toBe("RIGHT_LEFT");
      expect(draft.sideRecoverySeconds).toBe(12);
      draft = setSideRecovery(draft, 20);
      draft = setSideMode(draft, "UNILATERAL", 12);
      expect(draft.sideOrder).toBe("BY_SERIES");
      expect(draft.sideRecoverySeconds).toBe(20);
      expect(setSideMode(draft, "RIGHT_LEFT", 12).sideRecoverySeconds).toBe(12);
    });

    it("une valeur LEFT_RIGHT existante n'est jamais réécrite par les autres transitions ; côté non renseigné → Sans au ✓", () => {
      let draft = openSheetDraft(parameters(uniform(3, 30, 10), { sideMode: "LEFT_RIGHT" }));
      draft = setLoadEnabled(setWorkPhaseCount(setWorkPhasesEnabled(draft, true), 3), true);
      draft = setStopCondition(setWorkPhasesEnabled(draft, false), "FAILURE");
      expect(draft.sideMode).toBe("LEFT_RIGHT");
      expect(committed(draft).sideMode).toBe("LEFT_RIGHT");
      expect(committed(openSheetDraft(parameters(uniform(3, 30, 10), { sideMode: null }))).sideMode).toBe("UNILATERAL");
    });

    it("NR Δ24 : à N = 1, l'Enchainement demandé reste dans le Brouillon et BY_SIDE est enregistré", () => {
      const draft = setSeriesCount(openSheetDraft(parameters(uniform(3, 30, 10), { sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES" })), 1);
      expect(draft.sideOrder).toBe("BY_SERIES");
      expect(committed(draft).sideOrder).toBe("BY_SIDE");
    });
  });

  describe("PRE5-2.1/AC9 — aller-retour étendu aux nouveaux champs", () => {
    it("requestedParameters(openSheetDraft(p)) = p ; lastNumberById présent dans le Brouillon, absent des paramètres", () => {
      const parents = [
        durationParent(),
        parameters(
          { kind: "UNIFORM", count: 2, target: numberTarget(9), pauseSeconds: 5, loadKg: 1.25, workPhases: [{ id: 7, label: "Descente", durationSeconds: 6 }, { id: 3, label: "Maintien", durationSeconds: 3 }] },
          { loadEnabled: true, sideMode: "LEFT_RIGHT" },
        ),
        parameters(variable({ ...row(30, 10), loadKg: 2 }, { ...row("FAILURE", 0), loadKg: 0 }), { loadEnabled: false }),
      ];
      for (const parent of parents) {
        const draft = openSheetDraft(parent);
        expect(draft).toHaveProperty("lastNumberById");
        const requested = requestedParameters(draft);
        expect(requested).toEqual(parent);
        expect(requested).not.toHaveProperty("lastNumberById");
        expect(sheetDraftResult(draft, phaseLabel, parent)).toEqual({ ok: true, value: parent });
      }
    });
  });

  function committedWith(draft: ExecutionSheetDraft): ExecutionParameters {
    const result = sheetDraftResult(draft, phaseLabel);
    if (!result.ok) {
      throw new Error(JSON.stringify(result.violations));
    }
    return result.value;
  }
});
