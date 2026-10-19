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
  commitSheetDraft,
  effectiveParameters,
  firstIncompleteSeries,
  isRequestedTotalEditable,
  isSingleSeries,
  moveRow,
  openSheetDraft,
  removeRow,
  requestedParameters,
  setCadenceBeep,
  setCountdown,
  setEnd,
  setMode,
  setRowPause,
  setRowTarget as setRowTargetTyped,
  setSeriesCount,
  setSideMode,
  setSideOrder,
  setSideRecovery,
  setUniformPause,
  setUniformTarget,
  setVariable,
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
      expect(removed.pendingRemoval).toEqual({ index: 1, row: B, rowId: 2 });
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
        expect(next.pendingRemoval).toEqual({ index: 0, row: A, rowId: 1 });
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
