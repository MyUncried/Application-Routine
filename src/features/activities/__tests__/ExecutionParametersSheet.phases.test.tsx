import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import {
  failureTarget,
  numberTarget,
  unsetTarget,
  type ExecutionParameters,
  type ExecutionParametersInput,
  type SeriesTarget,
  type WorkPhase,
} from "@/domain/activities/ExecutionParameters";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import {
  CELL_BACKSPACE,
  hideExecutionSheetKeyboard,
  showExecutionSheetKeyboard,
  typeInExecutionSheetCell,
} from "@/features/activities/testing/executionSheetActions";
import { TABLE_ROW_HEIGHT } from "@/features/activities/sheetTable";
import { PHASE_CELL_GAP, PHASE_CELL_WIDTH } from "@/features/activities/WorkPhasesTable";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-5 story 2.8 (FR-2 à FR-9, FR-27 à FR-29, FR-44 ; AD-20, AD-24 à AD-27 ; D-432, D-434) —
 * phases de l'exercice dans la Feuille : matrice I/O de la spécification de la story. Le focus
 * natif et le clavier sont simulés (`focus`, `changeText`, `blur`, événements `Keyboard`) : Jest
 * ne prouve ni le rendu, ni les gestes, ni le clavier réels, qui relèvent de la recette iPhone
 * R-2.8-01 à 11 (aucun constat inventé).
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const t = strings.executionParameters.sheet;
const hidden = { includeHiddenElements: true } as const;
const get = (testID: string) => screen.getByTestId(testID, hidden);
const query = (testID: string) => screen.queryByTestId(testID, hidden);
const styleOf = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};

const CONTROL = "execution-sheet-phases-control";
const WITH = `${CONTROL}-WITH`;
const WITHOUT = `${CONTROL}-WITHOUT`;
const CHEVRON = `${CONTROL}-WITH-chevron`;
const COUNT_TOGGLE = "execution-sheet-phase-count-toggle";
const COUNT_TEXT = "execution-sheet-phase-count-text";
const STEPPER = "execution-sheet-phase-count";
const TABLE = "execution-sheet-phases-table";
const row = (n: number) => `execution-sheet-phase-row-${n}`;
const label = (n: number) => `${row(n)}-label`;
const duration = (n: number) => `${row(n)}-duration`;
const remove = (n: number) => `${row(n)}-remove`;

function params(target: SeriesTarget = numberTarget(9), overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 3,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 3, target, pauseSeconds: 15, loadKg: 0, workPhases: [] },
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

/** Exercice enregistré avec des phases (libellés et durées valides, D = Σ). */
function withPhases(phases: readonly (readonly [string, number])[]): ExecutionParametersInput {
  const workPhases: WorkPhase[] = phases.map(([phaseLabel, seconds], index) => ({ id: index + 1, label: phaseLabel, durationSeconds: seconds }));
  const sum = phases.reduce((total, [, seconds]) => total + seconds, 0);
  return params(numberTarget(sum), {
    series: { kind: "UNIFORM", count: 3, target: numberTarget(sum), pauseSeconds: 15, loadKg: 0, workPhases },
  });
}

function renderSheet(parent: ExecutionParametersInput) {
  const onApply = jest.fn<(value: ExecutionParameters) => void>();
  const onCancel = jest.fn();
  render(
    <TestSafeAreaProvider>
      <ExecutionParametersSheet parent={parent} profileSideRecoverySecondsDefault={10} onApply={onApply} onCancel={onCancel} />
    </TestSafeAreaProvider>,
  );
  return { onApply, onCancel };
}

const applied = (onApply: jest.Mock<(value: ExecutionParameters) => void>) => onApply.mock.calls.at(-1)![0];
const validate = () => fireEvent.press(get("execution-sheet-validate"));
const optionState = (testID: string) => get(testID).props.accessibilityState as { selected?: boolean; disabled?: boolean };
const phaseRows = () => screen.queryAllByTestId(/^execution-sheet-phase-row-\d+$/, hidden);
const shownDuration = (n: number) => String(get(`${duration(n)}-value`).props.children);
const shownLabel = (n: number) => String(get(label(n)).props.value);
const countText = () => String(get(COUNT_TEXT).props.children);
const chevronIcon = () => get(`${CHEVRON}-icon`).props.source;
const UP = [require("../../../../assets/icons/control-chevron-up.svg")];
const DOWN = [require("../../../../assets/icons/control-chevron-down.svg")];
/** Ligne « Durée d'une série » : texte en lecture seule avec des phases, pastille modifiable sinon. */
const seriesDurationText = () => String(get("execution-sheet-target-text").props.children);
const stepperTap = (button: "increment" | "decrement") => {
  fireEvent(get(`${STEPPER}-${button}`), "pressIn");
  fireEvent(get(`${STEPPER}-${button}`), "pressOut");
};

/** Saisie d'une durée de phase au clavier MMSS (focus, frappes, sortie). */
function enterDuration(n: number, keys: string) {
  fireEvent(get(`${duration(n)}-input`), "focus");
  if (keys === "") {
    typeInExecutionSheetCell(duration(n), CELL_BACKSPACE.repeat(String(get(`${duration(n)}-input`).props.value).length));
  } else {
    typeInExecutionSheetCell(duration(n), keys);
  }
  fireEvent(get(`${duration(n)}-input`), "blur");
}

/** Saisie d'un libellé au clavier texte (focus, texte, sortie par Retour). */
function enterLabel(n: number, text: string) {
  fireEvent(get(label(n)), "focus");
  fireEvent.changeText(get(label(n)), text);
  fireEvent(get(label(n)), "blur");
}

describe("ExecutionParametersSheet — PRE-5 story 2.8 : phases de l'exercice", () => {
  it("PRE5-2.8/AC1 — sans phase : « Phases de l’exercice » est la première ligne du cadre Séries, Sans sélectionné, sans tableau ni chevron", () => {
    renderSheet(params());
    const frame = get("execution-sheet-frame-series");
    const rowIds = within(frame)
      .queryAllByTestId(/^execution-sheet-row-[a-z-]+$/, hidden)
      .map((node) => String(node.props.testID))
      .filter((id) => !/-(selection|line|content|value-group)$/.test(id));
    expect(rowIds[0]).toBe("execution-sheet-row-phases");
    expect(rowIds[1]).toBe("execution-sheet-row-series");
    expect(within(get("execution-sheet-row-phases")).getByText(t.workPhases, hidden)).toBeTruthy();
    expect(optionState(WITHOUT)).toMatchObject({ selected: true });
    expect(optionState(WITH)).toMatchObject({ selected: false, disabled: false });
    expect(query(TABLE)).toBeNull();
    expect(query(CHEVRON)).toBeNull();
    // Largeur : Avec et Sans à 62 sous Sans.
    expect(styleOf(`${CONTROL}-tile-WITH`).width).toBe(62);
    expect(styleOf(`${CONTROL}-tile-WITHOUT`).width).toBe(62);
  });

  it.each([
    ["Mode Répétitions", params(numberTarget(12), { mode: "REPETITIONS" })],
    ["À l’échec", params(failureTarget())],
    [
      "séries Variables",
      params(numberTarget(9), {
        series: {
          kind: "VARIABLE",
          rows: [
            { target: numberTarget(9), pauseSeconds: 10, loadKg: 0 },
            { target: numberTarget(12), pauseSeconds: 10, loadKg: 0 },
          ],
        },
      }),
    ],
  ])("PRE5-2.8/AC1 (FR-2) — %s : option Avec indisponible, Sans affiché, appui sans effet", (_case, parent) => {
    renderSheet(parent);
    expect(optionState(WITH)).toMatchObject({ disabled: true, selected: false });
    expect(optionState(WITHOUT)).toMatchObject({ selected: true });
    fireEvent.press(get(WITH));
    expect(optionState(WITHOUT)).toMatchObject({ selected: true });
    expect(query(TABLE)).toBeNull();
  });

  it("PRE5-2.8/AC3 — activation depuis 9 s : « 2 phases », lignes 9 s et « — » (rouge pâle), tableau déployé, chevron haut ; D en lecture seule", () => {
    renderSheet(params());
    expect(get("execution-sheet-target-value")).toBeTruthy();
    fireEvent.press(get(WITH));
    expect(optionState(WITH)).toMatchObject({ selected: true });
    expect(countText()).toBe("2 phases");
    expect(phaseRows()).toHaveLength(2);
    expect([shownDuration(1), shownDuration(2)]).toEqual(["9 s", "—"]);
    expect(styleOf(duration(2)).backgroundColor).toBe(colors.dangerSurface);
    expect(styleOf(duration(1)).backgroundColor).toBeUndefined();
    expect(get(duration(2)).props.accessibilityValue).toEqual({ text: t.unsetSpoken });
    expect(get(TABLE)).toBeTruthy();
    expect(chevronIcon()).toEqual(UP);
    expect(get(CHEVRON).props.accessibilityLabel).toBe(t.hidePhases);
    // Libellés vides : « Phase n » selon la position.
    expect([shownLabel(1), shownLabel(2)]).toEqual(["Phase 1", "Phase 2"]);
    // FR-3 : Durée d'une série = Σ, en lecture seule (sans pastille ni roue), annoncée non modifiable.
    expect(query("execution-sheet-target-value")).toBeNull();
    expect(seriesDurationText()).toBe("9 s");
    expect(get("execution-sheet-row-target-line").props.accessibilityLabel).toBe(`${t.durationTarget}, 9 s, ${t.totalReadOnlySpoken}`);
    // Largeur de l'option Avec, réglage fermé : 76 ; Sans garde 62.
    expect(styleOf(`${CONTROL}-tile-WITH`).width).toBe(76);
    expect(styleOf(`${CONTROL}-tile-WITHOUT`).width).toBe(62);
    // FR-2 : avec des phases, Répétitions, À l'échec et Variables indisponibles (déjà livré).
    expect(optionState("execution-sheet-mode-control-REPETITIONS")).toMatchObject({ disabled: true });
    expect(optionState("execution-sheet-stop-condition-control-FAILURE")).toMatchObject({ disabled: true });
    expect(optionState("execution-sheet-series-type-control-VARIABLE")).toMatchObject({ disabled: true });
  });

  it("PRE5-2.8/AC3 — activation depuis « — » : deux durées à renseigner, rien d'inventé", () => {
    renderSheet(params(unsetTarget()));
    fireEvent.press(get(WITH));
    expect([shownDuration(1), shownDuration(2)]).toEqual(["—", "—"]);
    expect(seriesDurationText()).toBe("—");
  });

  it("PRE5-2.8/AC2, AC3 (D-432, QR-1, RC-4) — stepper révélé : − indisponible à 2 ; + jusqu'à 6 (durée de la dernière) puis indisponible ; − retire la dernière avec « Phase supprimée — Annuler » ; toucher la valeur le referme", () => {
    renderSheet(withPhases([["A", 6], ["B", 3]]));
    expect(query(`${STEPPER}-increment`)).toBeNull();
    fireEvent.press(get(COUNT_TOGGLE));
    expect(get("execution-sheet-row-phases-selection")).toBeTruthy();
    expect(styleOf("execution-sheet-row-phases-selection").backgroundColor).toBe(colors.stepperSurface);
    expect(String(get(`${STEPPER}-value`).props.children)).toBe("2 phases");
    expect(get(`${STEPPER}-decrement`).props.accessibilityState).toMatchObject({ disabled: true });
    expect(get(STEPPER).props.accessibilityLabel).toBe(t.workPhaseCountLabel);
    // Largeur de l'option Avec, réglage ouvert : 136 ; stepper sans pilule.
    expect(styleOf(`${CONTROL}-tile-WITH`).width).toBe(136);
    expect(styleOf(STEPPER)).toMatchObject({ padding: 0, minHeight: 0, backgroundColor: "transparent" });
    // Chevron toujours présent, réglage ouvert.
    expect(get(CHEVRON)).toBeTruthy();
    for (let step = 0; step < 4; step += 1) stepperTap("increment");
    expect(String(get(`${STEPPER}-value`).props.children)).toBe("6 phases");
    expect(phaseRows()).toHaveLength(6);
    expect([3, 4, 5, 6].map(shownDuration)).toEqual(["3 s", "3 s", "3 s", "3 s"]);
    expect(seriesDurationText()).toBe("21 s");
    expect(get(`${STEPPER}-increment`).props.accessibilityState).toMatchObject({ disabled: true });
    stepperTap("increment");
    expect(phaseRows()).toHaveLength(6);
    stepperTap("decrement");
    expect(phaseRows()).toHaveLength(5);
    expect(get("execution-sheet-adjusted")).toBeTruthy();
    expect(within(get("execution-sheet-adjusted")).getByText(t.phaseRemoved, hidden)).toBeTruthy();
    expect(within(get("execution-sheet-phases-group")).getByTestId("execution-sheet-adjusted", hidden)).toBeTruthy();
    fireEvent.press(get("execution-sheet-adjusted-undo"));
    expect(phaseRows()).toHaveLength(6);
    // RC-4 : toucher la valeur referme ; − et + masqués, valeur et chevron visibles.
    fireEvent.press(get(`${STEPPER}-value-press`));
    expect(query(`${STEPPER}-increment`)).toBeNull();
    expect(query(`${STEPPER}-decrement`)).toBeNull();
    expect(countText()).toBe("6 phases");
    expect(get(CHEVRON)).toBeTruthy();
    expect(styleOf(`${CONTROL}-tile-WITH`).width).toBe(76);
    // Re-choisir Avec (zone de l'option hors valeur) ouvre aussi le réglage.
    fireEvent.press(get(WITH));
    expect(get(`${STEPPER}-increment`)).toBeTruthy();
  });

  it("PRE5-2.8/AC2 (FR-28) — chevron : replie le tableau (chevron bas), nombre et phases inchangés ; redéploie", () => {
    const { onApply } = renderSheet(withPhases([["A", 6], ["B", 3], ["C", 5]]));
    fireEvent.press(get(CHEVRON));
    expect(query(TABLE)).toBeNull();
    expect(chevronIcon()).toEqual(DOWN);
    expect(get(CHEVRON).props.accessibilityLabel).toBe(t.showPhases);
    expect(countText()).toBe("3 phases");
    expect(seriesDurationText()).toBe("14 s");
    fireEvent.press(get(CHEVRON));
    expect(phaseRows()).toHaveLength(3);
    expect(chevronIcon()).toEqual(UP);
    validate();
    expect(applied(onApply).series).toMatchObject({ kind: "UNIFORM", target: numberTarget(14) });
  });

  it("PRE5-2.8/AC3b, AC7 (FR-8, QR-1) — croix : à 3 phases, retrait + « Phase supprimée — Annuler », Annuler restitue ordre, libellé, durée et D ; à 2, croix indisponible", () => {
    renderSheet(withPhases([["Descente", 6], ["Maintien", 3], ["Montée", 5]]));
    expect(get(remove(2)).props.accessibilityLabel).toBe("Supprimer la phase 2");
    expect(get(remove(2)).props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(get(remove(2)));
    expect(phaseRows()).toHaveLength(2);
    expect([shownLabel(1), shownLabel(2)]).toEqual(["Descente", "Montée"]);
    expect(seriesDurationText()).toBe("11 s");
    expect(countText()).toBe("2 phases");
    expect(within(get("execution-sheet-adjusted")).getByText(t.phaseRemoved, hidden)).toBeTruthy();
    // À deux phases : croix indisponibles (état exposé).
    expect(get(remove(1)).props.accessibilityState).toMatchObject({ disabled: true });
    expect(get(remove(2)).props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(get("execution-sheet-adjusted-undo"));
    expect([1, 2, 3].map(shownLabel)).toEqual(["Descente", "Maintien", "Montée"]);
    expect([1, 2, 3].map(shownDuration)).toEqual(["6 s", "3 s", "5 s"]);
    expect(seriesDurationText()).toBe("14 s");
    expect(countText()).toBe("3 phases");
  });

  it("PRE5-2.8/AC3b — croix pendant une saisie : l'appui range le champ ouvert sans retirer", () => {
    renderSheet(withPhases([["A", 6], ["B", 3], ["C", 5]]));
    fireEvent(get(`${duration(1)}-input`), "focus");
    expect(styleOf(duration(1)).backgroundColor).toBe("#EAEAFF");
    fireEvent.press(get(remove(3)));
    expect(phaseRows()).toHaveLength(3);
  });

  it("PRE5-2.8/AC5 (D-434) — durée au clavier MMSS : 1,7,5 → « 2 min 15 s », D redérivée ; vidée → « — » ; 9999 → 58 min 55 s ; 0 → 1 s", () => {
    renderSheet(withPhases([["A", 6], ["B", 3]]));
    expect(get(`${duration(1)}-input`).props.keyboardType).toBe("number-pad");
    enterDuration(1, "175");
    expect(shownDuration(1)).toBe("2 min 15 s");
    expect(seriesDurationText()).toBe("2 min 18 s");
    enterDuration(1, "");
    expect(shownDuration(1)).toBe("—");
    expect(styleOf(duration(1)).backgroundColor).toBe(colors.dangerSurface);
    expect(seriesDurationText()).toBe("3 s");
    enterDuration(1, "9999");
    expect(shownDuration(1)).toBe("58 min 55 s");
    enterDuration(1, "0");
    expect(shownDuration(1)).toBe("1 s");
    expect(seriesDurationText()).toBe("4 s");
  });

  it("PRE5-2.8/AC4 (FR-6) — libellé au clavier texte : « Descente » puis Retour ; vide → « Phase n » ; au-delà de 20 points de code refusé ; sans barre", () => {
    renderSheet(withPhases([["A", 6], ["B", 3]]));
    expect(get(label(1)).props.keyboardType).toBe("default");
    expect(get(label(1)).props.submitBehavior).toBe("blurAndSubmit");
    expect(get(label(1)).props.accessibilityLabel).toBe("Phase 1, libellé");
    enterLabel(1, "Descente");
    expect(shownLabel(1)).toBe("Descente");
    enterLabel(2, "");
    expect(shownLabel(2)).toBe("Phase 2");
    fireEvent(get(label(1)), "focus");
    showExecutionSheetKeyboard();
    // Libellé : aucune barre (RC-1 réservée aux champs numériques).
    expect(query("execution-sheet-keyboard-bar")).toBeNull();
    fireEvent.changeText(get(label(1)), "x".repeat(21));
    expect(String(get(label(1)).props.value)).toBe("Descente");
    fireEvent.changeText(get(label(1)), "😀".repeat(20));
    fireEvent(get(label(1)), "blur");
    hideExecutionSheetKeyboard();
    expect(shownLabel(1)).toBe("😀".repeat(20));
  });

  it("PRE5-2.8/AC5 (D-434) — navigation : Suivant de la durée 1 → durée 2 (jamais un libellé) ; « À l’échec » absent ; extrémités indisponibles ; repère de la ligne active", () => {
    renderSheet(withPhases([["A", 6], ["B", 3], ["C", 5]]));
    fireEvent(get(`${duration(1)}-input`), "focus");
    showExecutionSheetKeyboard();
    expect(get("execution-sheet-keyboard-bar")).toBeTruthy();
    expect(query("execution-sheet-keyboard-failure")).toBeNull();
    expect(get("execution-sheet-keyboard-previous").props.accessibilityState).toMatchObject({ disabled: true });
    expect(get(`${row(1)}-active-marker`)).toBeTruthy();
    expect(query(`${row(2)}-active-marker`)).toBeNull();
    fireEvent.press(get("execution-sheet-keyboard-next"));
    expect(styleOf(duration(2)).backgroundColor).toBe("#EAEAFF");
    expect(styleOf(label(2)).backgroundColor).toBeUndefined();
    expect(get(`${row(2)}-active-marker`)).toBeTruthy();
    fireEvent(get(`${duration(1)}-input`), "blur");
    fireEvent(get(`${duration(2)}-input`), "focus");
    fireEvent.press(get("execution-sheet-keyboard-next"));
    expect(styleOf(duration(3)).backgroundColor).toBe("#EAEAFF");
    expect(get("execution-sheet-keyboard-next").props.accessibilityState).toMatchObject({ disabled: true });
    hideExecutionSheetKeyboard();
  });

  it("PRE5-2.8/AC7 (FR-8) — Avec → Sans : 6 s + 3 s + 5 s → Sans, « Durée d’une série » 14 s modifiable ; repasser à Avec recrée deux phases (14 s, à renseigner)", () => {
    renderSheet(withPhases([["A", 6], ["B", 3], ["C", 5]]));
    fireEvent.press(get(WITHOUT));
    expect(optionState(WITHOUT)).toMatchObject({ selected: true });
    expect(query(TABLE)).toBeNull();
    expect(query(CHEVRON)).toBeNull();
    expect(String(get("execution-sheet-target-value-text").props.children)).toBe("14 s");
    expect(optionState("execution-sheet-mode-control-REPETITIONS")).toMatchObject({ disabled: false });
    fireEvent.press(get(WITH));
    expect(phaseRows()).toHaveLength(2);
    expect([shownDuration(1), shownDuration(2)]).toEqual(["14 s", "—"]);
    expect([shownLabel(1), shownLabel(2)]).toEqual(["Phase 1", "Phase 2"]);
  });

  it("PRE5-2.8/AC7 (FR-9, QR-2) — ✓ avec [9, —] et libellés vides : Sans, cible 9 s, aucune phase", () => {
    const { onApply } = renderSheet(params());
    fireEvent.press(get(WITH));
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: false });
    validate();
    expect(applied(onApply).series).toEqual({
      kind: "UNIFORM",
      count: 3,
      target: numberTarget(9),
      pauseSeconds: 15,
      loadKg: 0,
      workPhases: [],
    });
  });

  it("PRE5-2.8/AC7 (FR-9, QN-3) — ✓ avec [6 « », 3 « Maintien »] : phases « Phase 1 » 6 s et « Maintien » 3 s, cible 9 s", () => {
    const { onApply } = renderSheet(params(numberTarget(6)));
    fireEvent.press(get(WITH));
    enterDuration(2, "3");
    enterLabel(2, "Maintien");
    expect(seriesDurationText()).toBe("9 s");
    validate();
    const series = applied(onApply).series;
    expect(series).toMatchObject({ kind: "UNIFORM", target: numberTarget(9) });
    expect(series.kind === "UNIFORM" ? series.workPhases.map(({ label: phaseLabel, durationSeconds }) => [phaseLabel, durationSeconds]) : null).toEqual([
      ["Phase 1", 6],
      ["Maintien", 3],
    ]);
  });

  it("PRE5-2.8/AC7 — somme normalisée > 3 535 s : ✓ indisponible", () => {
    renderSheet(withPhases([["A", 3000], ["B", 500]]));
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: false });
    enterDuration(2, "1000");
    expect(seriesDurationText()).toBe("60 min");
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    // Revue : « Durée d'une série » porte la marque et l'indice de la valeur non admise.
    expect(styleOf("execution-sheet-target-static").backgroundColor).toBe(colors.dangerSurface);
    expect(get("execution-sheet-row-target-line").props.accessibilityLabel).toBe(
      `${t.durationTarget}, 60 min, ${t.totalReadOnlySpoken}, ${t.invalidValueHint}`,
    );
  });

  it("PRE5-2.8 (Q47) — champ de phase focalisé : le premier appui sur ✓ ou ✕ sort du champ, sans valider ni abandonner", () => {
    const { onApply, onCancel } = renderSheet(withPhases([["A", 6], ["B", 3]]));
    fireEvent(get(label(1)), "focus");
    validate();
    expect(onApply).not.toHaveBeenCalled();
    fireEvent(get(`${duration(2)}-input`), "focus");
    fireEvent.press(get("execution-sheet-cancel"));
    expect(onCancel).not.toHaveBeenCalled();
    validate();
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it("PRE5-2.8/AC3b (FR-4, CE-UI-10) — actions accessibles Monter / Descendre : le libellé suit sa phase ; D inchangée", () => {
    const { onApply } = renderSheet(withPhases([["Descente", 6], ["Maintien", 3]]));
    const handle = get(`${row(1)}-handle`);
    expect(handle.props.accessibilityLabel).toBe("Déplacer la phase 1");
    expect((handle.props.accessibilityActions as { name: string; label: string }[]).map((action) => action.label)).toEqual([
      "Descendre la phase 1",
    ]);
    fireEvent(handle, "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
    expect([shownLabel(1), shownLabel(2)]).toEqual(["Maintien", "Descente"]);
    expect([shownDuration(1), shownDuration(2)]).toEqual(["3 s", "6 s"]);
    expect(seriesDurationText()).toBe("9 s");
    validate();
    const series = applied(onApply).series;
    expect(series.kind === "UNIFORM" ? series.workPhases.map((phase) => phase.label) : null).toEqual(["Maintien", "Descente"]);
  });

  it("PRE5-2.8/AC3b (FR-29, Figma `9207:18817`) — tableau : en-têtes « Libellé » et « Durée », cellules de 76 séparées de 20, ni pied ni ±", () => {
    renderSheet(withPhases([["A", 6], ["B", 3]]));
    const header = get("execution-sheet-phases-table-header");
    expect(within(header).getByText("Libellé", hidden)).toBeTruthy();
    expect(within(header).getByText("Durée", hidden)).toBeTruthy();
    expect(styleOf(`${row(1)}-label-cell`)).toMatchObject({ width: PHASE_CELL_WIDTH, flexShrink: 1 });
    expect(styleOf(`${row(1)}-duration-cell`)).toMatchObject({ width: PHASE_CELL_WIDTH, flexShrink: 1 });
    expect([PHASE_CELL_WIDTH, PHASE_CELL_GAP]).toEqual([76, 20]);
    expect(within(get(TABLE)).queryAllByTestId(/-(increment|decrement)$/, hidden)).toEqual([]);
    expect(get(`${duration(1)}`).props.hitSlop).toEqual({ top: 6, bottom: 6 });
    expect(get(label(1)).props.hitSlop).toEqual({ top: 6, bottom: 6 });
  });

  it("PRE5-2.8/AC7 — deux phases à renseigner : « Durée d’une série » « — » marquée (fond #FFF1F0, indice annoncé), ✓ indisponible", () => {
    renderSheet(params(unsetTarget()));
    fireEvent.press(get(WITH));
    expect(seriesDurationText()).toBe("—");
    expect(styleOf("execution-sheet-target-static").backgroundColor).toBe(colors.dangerSurface);
    expect(get("execution-sheet-row-target-line").props.accessibilityLabel).toBe(
      `${t.durationTarget}, ${t.unsetSpoken}, ${t.totalReadOnlySpoken}, ${t.invalidHint}`,
    );
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("PRE5-2.8 — une seule phase relue des données : « 1 phase » au singulier", () => {
    renderSheet(withPhases([["Maintien", 9]]));
    expect(countText()).toBe("1 phase");
  });

  it("PRE5-2.8/AC3b (RC-5) — glisser la poignée de la phase 1 d'une ligne : réglage du nombre rangé au départ, repère d'insertion pendant le geste, phases échangées, ✓ dans le nouvel ordre", () => {
    const { onApply } = renderSheet(withPhases([["Descente", 6], ["Maintien", 3]]));
    fireEvent.press(get(COUNT_TOGGLE));
    expect(get(`${STEPPER}-increment`)).toBeTruthy();
    const handle = get(`${row(1)}-handle`);
    fireEvent(handle, "responderGrant", { nativeEvent: { pageY: 100 } });
    expect(query(`${STEPPER}-increment`)).toBeNull();
    fireEvent(handle, "responderMove", { nativeEvent: { pageY: 100 + TABLE_ROW_HEIGHT } });
    expect(get("execution-sheet-phases-insertion-guide-before-3")).toBeTruthy();
    fireEvent(get(`${row(1)}-handle`), "responderRelease", { nativeEvent: { pageY: 100 + TABLE_ROW_HEIGHT } });
    expect(query("execution-sheet-phases-insertion-guide-before-3")).toBeNull();
    expect([shownLabel(1), shownLabel(2)]).toEqual(["Maintien", "Descente"]);
    expect([shownDuration(1), shownDuration(2)]).toEqual(["3 s", "6 s"]);
    validate();
    const series = applied(onApply).series;
    expect(series.kind === "UNIFORM" ? series.workPhases.map((phase) => phase.label) : null).toEqual(["Maintien", "Descente"]);
  });

  it("PRE5-2.8/AC6 (FR-3) — phases 6 s et 3 s, 3 séries, pause 15 s : D = 9 s en lecture seule, Durée de l'exercice 72 s (calcul existant)", () => {
    renderSheet(withPhases([["A", 6], ["B", 3]]));
    expect(seriesDurationText()).toBe("9 s");
    expect(String(get("execution-sheet-total-text").props.children)).toBe("1 min 12 s");
  });

  it("PRE5-2.8/AC8 (FR-32, NR Δ38) — six phases : six lignes, + indisponible ; le stepper « Nombre de séries » de PRE-4 reste inchangé", () => {
    renderSheet(withPhases([["A", 1], ["B", 1], ["C", 1], ["D", 1], ["E", 1], ["F", 1]]));
    expect(phaseRows()).toHaveLength(6);
    expect(countText()).toBe("6 phases");
    fireEvent.press(get(COUNT_TOGGLE));
    expect(get(`${STEPPER}-increment`).props.accessibilityState).toMatchObject({ disabled: true });
    expect(get("execution-sheet-series-toggle")).toBeTruthy();
    // Une seule surface : ouvrir le stepper de N range celui des phases.
    fireEvent.press(get("execution-sheet-series-toggle"));
    expect(query(`${STEPPER}-increment`)).toBeNull();
    expect(get("execution-sheet-series-increment")).toBeTruthy();
  });
});
