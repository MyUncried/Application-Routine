import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
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
import { CARD_SHEET_MOTION_MS, ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import {
  CELL_BACKSPACE,
  hideExecutionSheetKeyboard,
  showExecutionSheetKeyboard,
  typeInExecutionSheetCell,
  enterExecutionSheetValue,
} from "@/features/activities/testing/executionSheetActions";
import { TABLE_ROW_HEIGHT } from "@/features/activities/sheetTable";
import { PHASE_CELL_GAP, PHASE_CELL_WIDTH } from "@/features/activities/WorkPhasesTable";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { toVerifyColors } from "@/shared/ui/toVerifyColors";
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
const COUNT_TEXT = "execution-sheet-phase-count-value";
const STEPPER = "execution-sheet-phase-count";
const TABLE = "execution-sheet-phases-table";
const row = (n: number) => `execution-sheet-phase-row-${n}`;
const label = (n: number) => `${row(n)}-label`;
const duration = (n: number) => `${row(n)}-duration`;
const remove = (n: number) => `${row(n)}-remove`;

function params(target: SeriesTarget = numberTarget(9), overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 5,
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
/**
 * Ligne « Durée d'une série » : PRE-7 (D-446, remplace PRE-5 story 2.8 FR-3) — pastille modifiable
 * ordinaire avec ou sans phases (la durée de série est indépendante du motif des phases).
 */
const seriesDurationText = () => String(get("execution-sheet-target-value").props.children);
const seriesDurationPill = () => get("execution-sheet-target");
/**
 * [− / + du réglage du nombre de phases — remplacé le 06/11/2026, décision de Hermann (constat c) :
 * saisie au clavier] : focus, frappes et sortie du champ « n phases ».
 */
const focusCount = () => fireEvent(get(`${STEPPER}-input`), "focus");
const blurCount = () => fireEvent(get(`${STEPPER}-input`), "blur");
const countActive = () => get(STEPPER).props.accessibilityState?.selected === true;
const enterPhaseCount = (count: number) => enterExecutionSheetValue(STEPPER, count, "integer");

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

/**
 * Hermann, 01/11/2026 (remplace « déployé à l'ouverture » de PRE-5 story 2.8, FR-28) : « Lorsque la
 * modale des paramètres s'ouvre, le tableau des phases doit être fermé s'il n'y a aucune valeur à
 * vérifier ou à renseigner. » Durées complètes, aucune marque : la Feuille s'ouvre tableau replié ;
 * les scénarios qui supposent le tableau le déploient d'abord par le chevron de l'option Avec.
 */
function unfoldPhases() {
  expect(query(TABLE)).toBeNull();
  fireEvent.press(get(CHEVRON));
  expect(get(TABLE)).toBeTruthy();
}

describe("ExecutionParametersSheet — PRE-5 story 2.8 : phases de l'exercice", () => {
  // [Remplacé le 01/11/2026 — ordre de Hermann, point 3 : « Phases du mouvement » forme son propre
  // bloc entre Exécution et Séries ; le bloc Séries commence par la ligne Séries.]
  it("PRE5-2.8/AC1 — sans phase : « Phases du mouvement » (D-448, point 8) est la seule ligne de son bloc ; Séries commence par la ligne Séries ; Sans sélectionné, sans tableau ni chevron", () => {
    renderSheet(params());
    const rowIdsOf = (frameID: string) =>
      within(get(frameID))
        .queryAllByTestId(/^execution-sheet-row-[a-z-]+$/, hidden)
        .map((node) => String(node.props.testID))
        .filter((id) => !/-(selection|line|content|value-group)$/.test(id));
    expect(rowIdsOf("execution-sheet-frame-phases")).toEqual(["execution-sheet-row-phases"]);
    // Recette du 20/10 (RC-15) : le bloc Séries commence par la ligne Séries (portant le nombre de séries).
    expect(rowIdsOf("execution-sheet-frame-series")[0]).toBe("execution-sheet-row-series-type");
    expect(rowIdsOf("execution-sheet-frame-series")).not.toContain("execution-sheet-row-phases");
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
    ["Répétitions à l’échec", params(failureTarget(), { mode: "REPETITIONS" })],
  ])("PRE-7 (D-446) — %s : option Avec disponible ; deux phases à renseigner, Cible inchangée", (_case, parent) => {
    const { onApply } = renderSheet(parent);
    expect(optionState(WITH)).toMatchObject({ disabled: false, selected: false });
    fireEvent.press(get(WITH));
    expect(optionState(WITH)).toMatchObject({ selected: true });
    expect([shownDuration(1), shownDuration(2)]).toEqual(["—", "—"]);
    enterDuration(1, "5");
    enterDuration(2, "2");
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: false });
    validate();
    const value = applied(onApply);
    expect(value.mode).toBe(parent.mode);
    expect(value.series).toMatchObject({ kind: "UNIFORM", target: (parent.series as { readonly target: SeriesTarget }).target });
    expect(value.series.kind === "UNIFORM" ? value.series.workPhases.map((phase) => phase.durationSeconds) : null).toEqual([5, 2]);
  });

  it.each([
    [
      "séries Variables",
      params(numberTarget(9), {
        series: {
          kind: "VARIABLE",
          rows: [
            { target: numberTarget(9), pauseSeconds: 10, loadKg: 0 },
            { target: numberTarget(12), pauseSeconds: 10, loadKg: 0 },
          ],
          workPhases: [],
        },
      }),
    ],
  ])("PRE5-2.8/AC1 — D-446 (complément du 26/10/2026, remplace l'exclusion FR-2) — %s : option Avec disponible ; appui : deux phases à renseigner (Q5), Variables conservé", (_case, parent) => {
    renderSheet(parent);
    expect(optionState(WITH)).toMatchObject({ disabled: false, selected: false });
    expect(optionState(WITHOUT)).toMatchObject({ selected: true });
    fireEvent.press(get(WITH));
    expect(optionState(WITH)).toMatchObject({ selected: true });
    expect(phaseRows()).toHaveLength(2);
    expect([shownDuration(1), shownDuration(2)]).toEqual(["—", "—"]);
    expect(optionState("execution-sheet-series-type-control-VARIABLE")).toMatchObject({ selected: true });
  });

  it("PRE5-2.8/AC3 — activation depuis 9″ : « 2 phases », Q5 (remplace le préremplissage de D-432) : lignes « — » et « — » (rouge pâle), tableau déployé, chevron haut ; PRE-7 (D-446) : D inchangée et modifiable", () => {
    renderSheet(params());
    expect(get("execution-sheet-target-value")).toBeTruthy();
    fireEvent.press(get(WITH));
    expect(optionState(WITH)).toMatchObject({ selected: true });
    expect(countText()).toBe("2 phases");
    expect(phaseRows()).toHaveLength(2);
    // Q5 (arbitrage du 26/10/2026) : la Cible de série n'est plus copiée dans la première phase.
    expect([shownDuration(1), shownDuration(2)]).toEqual(["—", "—"]);
    expect(styleOf(duration(2)).backgroundColor).toBe(colors.dangerSurface);
    expect(styleOf(duration(1)).backgroundColor).toBe(colors.dangerSurface);
    expect(get(duration(2)).props.accessibilityValue).toEqual({ text: t.unsetSpoken });
    expect(get(TABLE)).toBeTruthy();
    expect(chevronIcon()).toEqual(UP);
    expect(get(CHEVRON).props.accessibilityLabel).toBe(t.hidePhases);
    // Libellés vides : « Phase n » selon la position.
    expect([shownLabel(1), shownLabel(2)]).toEqual(["Phase 1", "Phase 2"]);
    // PRE-7 (D-446, remplace FR-3 « D = Σ en lecture seule » et A2.1) : D garde sa pastille
    // modifiable et sa valeur (9 s), indépendante des phases ; une durée de phase la laisse inchangée.
    expect(seriesDurationText()).toBe("9″");
    // Décision du 06/11/2026 : pastille = champ clavier (état « sélectionné » hors saisie : faux).
    expect(seriesDurationPill().props.accessibilityState).toMatchObject({ selected: false });
    expect(seriesDurationPill().props.accessibilityHint).toBeUndefined();
    expect(get("execution-sheet-row-target-line").props.accessibilityLabel).toBeUndefined();
    enterDuration(2, "3");
    expect(seriesDurationText()).toBe("9″");
    // Largeur de l’option Avec, réglage fermé : 110 (D-448, point 8 ; 104 auparavant, RC-16 : marges de « Sans ») ; Sans garde 62.
    expect(styleOf(`${CONTROL}-tile-WITH`).width).toBe(110);
    expect(styleOf(`${CONTROL}-tile-WITHOUT`).width).toBe(62);
    // PRE-7 (D-446) : avec des phases, Répétitions et À l'échec restent disponibles ; complément
    // du 26/10/2026 : Variables aussi (motif commun aux séries identiques et variables).
    expect(optionState("execution-sheet-mode-control-REPETITIONS")).toMatchObject({ disabled: false });
    expect(optionState("execution-sheet-stop-condition-control-FAILURE")).toMatchObject({ disabled: false });
    expect(optionState("execution-sheet-series-type-control-VARIABLE")).toMatchObject({ disabled: false });
  });

  it("PRE-7 R-2 (D-446, complément du 26/10/2026) — phases en identiques N = 3 : Variables disponible ; le toucher garde la ligne et les phases, durées comprises (recette du 29/10/2026 : tableau replié, redéployé par son chevron)", () => {
    const { onApply } = renderSheet(withPhases([["A", 5], ["B", 2]]));
    unfoldPhases();
    expect(optionState("execution-sheet-series-type-control-VARIABLE")).toMatchObject({ disabled: false, selected: false });
    fireEvent.press(get("execution-sheet-series-type-control-VARIABLE"));
    expect(optionState("execution-sheet-series-type-control-VARIABLE")).toMatchObject({ selected: true });
    expect(get("execution-sheet-row-phases")).toBeTruthy();
    expect(optionState(WITH)).toMatchObject({ selected: true });
    // Recette iPhone du 29/10/2026 : un autre contrôle de la Feuille replie le tableau des phases.
    expect(phaseRows()).toHaveLength(0);
    fireEvent.press(get(CHEVRON));
    expect(phaseRows()).toHaveLength(2);
    expect([shownDuration(1), shownDuration(2)]).toEqual(["5″", "2″"]);
    expect([shownLabel(1), shownLabel(2)]).toEqual(["A", "B"]);
    validate();
    const series = applied(onApply).series;
    expect(series.kind).toBe("VARIABLE");
    expect(series.workPhases).toEqual([
      { id: 1, label: "A", durationSeconds: 5 },
      { id: 2, label: "B", durationSeconds: 2 },
    ]);
  });

  it("PRE5-2.8/AC3 — activation depuis « — » : deux durées à renseigner, rien d'inventé", () => {
    renderSheet(params(unsetTarget()));
    fireEvent.press(get(WITH));
    expect([shownDuration(1), shownDuration(2)]).toEqual(["—", "—"]);
    expect(seriesDurationText()).toBe("—");
  });

  it("PRE5-2.8/AC2, AC3 (D-432, QR-1) — nombre de phases au clavier (bornes 2..6) : ajout à la durée de la dernière ; retrait de la dernière avec « Phase supprimée — Annuler » [stepper révélé — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]", () => {
    renderSheet(withPhases([["A", 6], ["B", 3]]));
    unfoldPhases();
    expect(query(`${STEPPER}-increment`)).toBeNull();
    expect(get(STEPPER).props.accessibilityLabel).toBe(t.workPhaseCountLabel);
    expect(get(`${STEPPER}-input`).props.keyboardType).toBe("number-pad");
    focusCount();
    expect(countActive()).toBe(true);
    // En saisie : chiffres seuls ; option Avec de largeur inchangée (110).
    expect(String(get(`${STEPPER}-value`).props.children)).toBe("2");
    expect(styleOf(STEPPER).backgroundColor).toBe("#EAEAFF");
    typeInExecutionSheetCell(STEPPER, "9");
    blurCount();
    // 9 ramené à 6 ; les phases ajoutées reprennent la durée de la dernière.
    expect(countText()).toBe("6 phases");
    expect(phaseRows()).toHaveLength(6);
    expect([3, 4, 5, 6].map(shownDuration)).toEqual(["3″", "3″", "3″", "3″"]);
    // PRE-7 (D-446) : D inchangée (9 s), non la somme.
    expect(seriesDurationText()).toBe("9″");
    enterPhaseCount(5);
    expect(phaseRows()).toHaveLength(5);
    expect(within(get("execution-sheet-adjusted")).getByText(t.phaseRemoved, hidden)).toBeTruthy();
    expect(within(get("execution-sheet-phases-group")).getByTestId("execution-sheet-adjusted", hidden)).toBeTruthy();
    fireEvent.press(get("execution-sheet-adjusted-undo"));
    expect(phaseRows()).toHaveLength(6);
    // 1 ramené à 2 (borne basse).
    enterPhaseCount(1);
    expect(countText()).toBe("2 phases");
    expect(styleOf(`${CONTROL}-tile-WITH`).width).toBe(110);
  });

  it("RC-16 — « n phases » ouvre le clavier, le chevron replie / déploie sans l'ouvrir ; actions indépendantes, place du chevron réservée", () => {
    renderSheet(withPhases([["A", 6], ["B", 3], ["C", 5]]));
    unfoldPhases();
    // Libellé puis chevron, à 12 l’un de l’autre (D-448, point 8 ; 6 auparavant), dans l’option de 110.
    expect(styleOf(CHEVRON)).toMatchObject({ width: 10, height: 10, marginLeft: 12 });
    expect(get(STEPPER).props.hitSlop).toEqual({ top: 14, bottom: 14, left: 17, right: 6 });
    expect(get(CHEVRON).props.hitSlop).toEqual({ top: 17, bottom: 17, left: 6, right: 17 });
    fireEvent.press(get(CHEVRON));
    expect(query(TABLE)).toBeNull();
    expect(countActive()).toBe(false);
    focusCount();
    expect(countActive()).toBe(true);
    expect(query(TABLE)).toBeNull();
  });

  it("RC-16 — en saisie : fond #EAEAFF, texte primaire, segmenté de 32 ; le chevron (grisé, indisponible) ferme le clavier sans changer le repli ; un toucher ailleurs ferme aussi [réglage − | n | chevron | + — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]", () => {
    renderSheet(withPhases([["A", 6], ["B", 3], ["C", 5]]));
    unfoldPhases();
    focusCount();
    expect(styleOf("execution-sheet-phases-control").height).toBe(32);
    expect(StyleSheet.flatten(get(`${STEPPER}-value`).props.style).color).toBe(colors.primary);
    // RC-16 : saisie ouverte, chevron grisé et annoncé indisponible.
    expect(styleOf(`${CHEVRON}-icon`).tintColor).toBe(colors.disabled);
    expect(get(CHEVRON).props.accessibilityState).toMatchObject({ disabled: true });
    typeInExecutionSheetCell(STEPPER, "4");
    // Chevron touché pendant la saisie : « Fermer » du clavier (perte du focus simulée), tableau inchangé.
    fireEvent.press(get(CHEVRON));
    blurCount();
    expect(countActive()).toBe(false);
    expect(phaseRows()).toHaveLength(4);
    expect(countText()).toBe("4 phases");
    // Toucher ailleurs : fermeture.
    focusCount();
    fireEvent.press(get("execution-sheet-body-outside"));
    expect(countActive()).toBe(false);
    blurCount();
    expect(phaseRows()).toHaveLength(4);
  });

  for (const field of ["label", "duration"] as const) {
    it(`RC-17 — activer un champ du tableau des phases (${field}) ferme la saisie du nombre (surface clavier, une seule surface) ; nombre et repli inchangés ; chevron actif`, () => {
      renderSheet(withPhases([["A", 6], ["B", 3], ["C", 5]]));
      unfoldPhases();
      focusCount();
      fireEvent(get(field === "label" ? label(2) : `${duration(2)}-input`), "focus");
      expect(countActive()).toBe(false);
      blurCount();
      expect(countText()).toBe("3 phases");
      expect(phaseRows()).toHaveLength(3);
      expect(chevronIcon()).toEqual(UP);
      expect(get(CHEVRON).props.accessibilityState).toMatchObject({ expanded: true });
      expect(styleOf(`${CHEVRON}-icon`).tintColor).toBe(colors.background);
    });
  }

  it("PRE5-2.8/AC2 (FR-28) — chevron : replie le tableau (chevron bas), nombre et phases inchangés ; redéploie", () => {
    const { onApply } = renderSheet(withPhases([["A", 6], ["B", 3], ["C", 5]]));
    unfoldPhases();
    fireEvent.press(get(CHEVRON));
    expect(query(TABLE)).toBeNull();
    expect(chevronIcon()).toEqual(DOWN);
    expect(get(CHEVRON).props.accessibilityLabel).toBe(t.showPhases);
    expect(countText()).toBe("3 phases");
    expect(seriesDurationText()).toBe("14″");
    fireEvent.press(get(CHEVRON));
    expect(phaseRows()).toHaveLength(3);
    expect(chevronIcon()).toEqual(UP);
    validate();
    expect(applied(onApply).series).toMatchObject({ kind: "UNIFORM", target: numberTarget(14) });
  });

  it("PRE5-2.8/AC3b, AC7 (FR-8) — croix : à 3 phases, retrait + « Phase supprimée — Annuler », Annuler restitue ordre, libellé et durée ; D inchangée (D-446) ; à 2, croix disponible (PRE-7 A2.1, D-438 remplace D-371 et D-432 pour le retrait)", () => {
    renderSheet(withPhases([["Descente", 6], ["Maintien", 3], ["Montée", 5]]));
    unfoldPhases();
    expect(get(remove(2)).props.accessibilityLabel).toBe("Supprimer la phase 2");
    expect(get(remove(2)).props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(get(remove(2)));
    expect(phaseRows()).toHaveLength(2);
    expect([shownLabel(1), shownLabel(2)]).toEqual(["Descente", "Montée"]);
    expect(seriesDurationText()).toBe("14″");
    expect(countText()).toBe("2 phases");
    expect(within(get("execution-sheet-adjusted")).getByText(t.phaseRemoved, hidden)).toBeTruthy();
    // PRE-7 A2.1 (D-438) : à deux phases, croix disponibles (2 → Sans, voir `ExecutionParametersSheet.mfn.a21`).
    expect(get(remove(1)).props.accessibilityState).toMatchObject({ disabled: false });
    expect(get(remove(2)).props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(get("execution-sheet-adjusted-undo"));
    expect([1, 2, 3].map(shownLabel)).toEqual(["Descente", "Maintien", "Montée"]);
    expect([1, 2, 3].map(shownDuration)).toEqual(["6″", "3″", "5″"]);
    expect(seriesDurationText()).toBe("14″");
    expect(countText()).toBe("3 phases");
  });

  it("PRE5-2.8/AC3b — croix pendant une saisie : l'appui range le champ ouvert sans retirer", () => {
    renderSheet(withPhases([["A", 6], ["B", 3], ["C", 5]]));
    unfoldPhases();
    fireEvent(get(`${duration(1)}-input`), "focus");
    expect(styleOf(duration(1)).backgroundColor).toBe("#EAEAFF");
    fireEvent.press(get(remove(3)));
    expect(phaseRows()).toHaveLength(3);
  });

  it("PRE5-2.8/AC5 (D-434) — durée au clavier MMSS : 1,7,5 → « 2′15″ » ; vidée → « — » ; 9999 → 58′55″ ; 0 → 0″ (D-448, point 6) ; PRE-7 (D-446) : D inchangée", () => {
    renderSheet(withPhases([["A", 6], ["B", 3]]));
    unfoldPhases();
    expect(get(`${duration(1)}-input`).props.keyboardType).toBe("number-pad");
    enterDuration(1, "175");
    expect(shownDuration(1)).toBe("2′15″");
    expect(seriesDurationText()).toBe("9″");
    enterDuration(1, "");
    expect(shownDuration(1)).toBe("—");
    expect(styleOf(duration(1)).backgroundColor).toBe(colors.dangerSurface);
    // PRE-7 (D-446, remplace A2.1) : D n'est plus forcée à renseigner quand une durée manque.
    expect(seriesDurationText()).toBe("9″");
    enterDuration(1, "9999");
    expect(shownDuration(1)).toBe("58′55″");
    // PRE-7 (D-448, point 6, remplace 0 → 1 s) : 0 s reste 0 s, cellule rouge.
    enterDuration(1, "0");
    expect(shownDuration(1)).toBe("0″");
    expect(styleOf(duration(1)).backgroundColor).toBe(colors.dangerSurface);
    expect(seriesDurationText()).toBe("9″");
  });

  it("PRE5-2.8/AC4 (FR-6) — libellé au clavier texte : « Descente » puis Retour ; vide → « Phase n » ; au-delà de 20 points de code refusé ; sans barre", () => {
    renderSheet(withPhases([["A", 6], ["B", 3]]));
    unfoldPhases();
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
    unfoldPhases();
    fireEvent(get(`${duration(1)}-input`), "focus");
    showExecutionSheetKeyboard();
    expect(get("execution-sheet-keyboard-bar")).toBeTruthy();
    expect(query("execution-sheet-keyboard-failure")).toBeNull();
    // PRE-7 B.3 (B9) : son emplacement reste réservé, vide et non accessible.
    expect(get("execution-sheet-keyboard-failure-slot").props.accessible).toBe(false);
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

  it("PRE5-2.8/AC7 (FR-8) — Avec → Sans : 6″ + 3″ + 5″ → Sans, « Durée d’une série » 14″ modifiable ; repasser à Avec pendant l'édition restitue les trois phases (D-448, point 4, remplace « recrée deux phases »)", () => {
    renderSheet(withPhases([["A", 6], ["B", 3], ["C", 5]]));
    fireEvent.press(get(WITHOUT));
    expect(optionState(WITHOUT)).toMatchObject({ selected: true });
    expect(query(TABLE)).toBeNull();
    expect(query(CHEVRON)).toBeNull();
    expect(String(get("execution-sheet-target-value").props.children)).toBe("14″");
    expect(optionState("execution-sheet-mode-control-REPETITIONS")).toMatchObject({ disabled: false });
    fireEvent.press(get(WITH));
    expect(phaseRows()).toHaveLength(3);
    expect([shownDuration(1), shownDuration(2), shownDuration(3)]).toEqual(["6″", "3″", "5″"]);
    expect([shownLabel(1), shownLabel(2), shownLabel(3)]).toEqual(["A", "B", "C"]);
  });

  it("PRE7-A1.1 (D-438 remplace D-373, nettoyage FR-3/FR-9/AD-20 écarté) — [9, —] : ✓ indisponible, les deux phases conservées ; la cellule « — » à renseigner ; D 9″ inchangée (D-446)", () => {
    const { onApply } = renderSheet(params());
    fireEvent.press(get(WITH));
    // Q5 : la première durée est saisie (plus de préremplissage par la Cible).
    enterDuration(1, "9");
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    validate();
    expect(onApply).not.toHaveBeenCalled();
    expect(phaseRows()).toHaveLength(2);
    expect([shownDuration(1), shownDuration(2)]).toEqual(["9″", "—"]);
    // La cause est visible sur la cellule « — » seule ; PRE-7 (D-446, remplace A2.1) : « Durée
    // d'une série » garde sa valeur (9 s), non marquée.
    expect(styleOf(duration(2)).backgroundColor).toBe(colors.dangerSurface);
    expect(styleOf(duration(1)).backgroundColor).toBeUndefined();
    expect(seriesDurationText()).toBe("9″");
    expect(styleOf("execution-sheet-target").backgroundColor).not.toBe(colors.dangerSurface);
    expect(seriesDurationPill().props.accessibilityHint).toBeUndefined();
  });

  it("PRE7-A1.1 (D-438) — phase relue à 0″ : cellule marquée comme « — », ✓ indisponible (une saisie de 0 donne 1″)", () => {
    renderSheet(withPhases([["A", 6], ["B", 0]]));
    expect(styleOf(duration(2)).backgroundColor).toBe(colors.dangerSurface);
    expect(styleOf(duration(1)).backgroundColor).toBeUndefined();
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    // PRE-7 (D-446, remplace A2.1) : D ouverte telle que lue (6 s), non forcée à renseigner.
    expect(seriesDurationText()).toBe("6″");
    expect(seriesDurationPill().props.accessibilityHint).toBeUndefined();
    enterDuration(2, "3");
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: false });
    expect(seriesDurationText()).toBe("6″");
  });

  it("PRE5-2.8/AC7 (FR-9, QN-3) — ✓ avec [6 « », 3 « Maintien »] : phases « Phase 1 » 6″ et « Maintien » 3″ ; PRE-7 (D-446) : cible 6″ inchangée", () => {
    const { onApply } = renderSheet(params(numberTarget(6)));
    fireEvent.press(get(WITH));
    // Q5 : la première durée est saisie (plus de préremplissage par la Cible).
    enterDuration(1, "6");
    enterDuration(2, "3");
    enterLabel(2, "Maintien");
    expect(seriesDurationText()).toBe("6″");
    validate();
    const series = applied(onApply).series;
    expect(series).toMatchObject({ kind: "UNIFORM", target: numberTarget(6) });
    expect(series.kind === "UNIFORM" ? series.workPhases.map(({ label: phaseLabel, durationSeconds }) => [phaseLabel, durationSeconds]) : null).toEqual([
      ["Phase 1", 6],
      ["Maintien", 3],
    ]);
  });

  it.each([
    ["Durée", withPhases([["A", 3000], ["B", 500]]), "58′20″"],
    [
      "Répétitions",
      params(numberTarget(10), {
        mode: "REPETITIONS",
        series: {
          kind: "UNIFORM",
          count: 3,
          target: numberTarget(10),
          pauseSeconds: 15,
          loadKg: 0,
          workPhases: [
            { id: 1, label: "A", durationSeconds: 3000 },
            { id: 2, label: "B", durationSeconds: 500 },
          ],
        },
      }),
      "10",
    ],
  ])("PRE5-2.8/AC7 — %s, somme normalisée > 3 8′55″ : ✓ indisponible ; PRE-7 (D-446) : cellules de durée marquées, jamais la Cible", (_case, parent, shownTarget) => {
    renderSheet(parent);
    unfoldPhases();
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: false });
    enterDuration(2, "1000");
    // D-446 : la Cible garde sa valeur ; la somme hors bornes (durée du motif) bloque ✓.
    expect(seriesDurationText()).toContain(shownTarget);
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    // D-446 (remplace la marque de la revue PRE-5 sur « Durée d'une série ») : la Cible, valide,
    // n'est pas marquée ; toutes les cellules de durée portent la marque et l'indice.
    expect(styleOf("execution-sheet-target").backgroundColor).not.toBe(colors.dangerSurface);
    expect(seriesDurationPill().props.accessibilityHint).toBeUndefined();
    for (const n of [1, 2]) {
      expect(styleOf(duration(n)).backgroundColor).toBe(colors.dangerSurface);
      expect(get(duration(n)).props.accessibilityHint).toBe(t.invalidValueHint);
    }
  });

  it("PRE5-2.8 (Q47) — champ de phase focalisé : le premier appui sur ✓ ou ✕ sort du champ, sans valider ni abandonner", () => {
    const { onApply, onCancel } = renderSheet(withPhases([["A", 6], ["B", 3]]));
    unfoldPhases();
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
    unfoldPhases();
    const handle = get(`${row(1)}-handle`);
    expect(handle.props.accessibilityLabel).toBe("Déplacer la phase 1");
    expect((handle.props.accessibilityActions as { name: string; label: string }[]).map((action) => action.label)).toEqual([
      "Descendre la phase 1",
    ]);
    fireEvent(handle, "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
    expect([shownLabel(1), shownLabel(2)]).toEqual(["Maintien", "Descente"]);
    expect([shownDuration(1), shownDuration(2)]).toEqual(["3″", "6″"]);
    expect(seriesDurationText()).toBe("9″");
    validate();
    const series = applied(onApply).series;
    expect(series.kind === "UNIFORM" ? series.workPhases.map((phase) => phase.label) : null).toEqual(["Maintien", "Descente"]);
  });

  it("PRE5-2.8/AC3b (FR-29, Figma `9207:18817`) — tableau : en-têtes « Libellé » et « Durée », séparés de 20, ni pied ni ± ; recette du 29/10/2026 : colonnes distribuées à parts égales", () => {
    renderSheet(withPhases([["A", 6], ["B", 3]]));
    unfoldPhases();
    const header = get("execution-sheet-phases-table-header");
    expect(within(header).getByText("Libellé", hidden)).toBeTruthy();
    expect(within(header).getByText("Durée", hidden)).toBeTruthy();
    // Recette iPhone du 29/10/2026 (« distribuer horizontalement les colonnes Libellé et Durée ») :
    // les deux colonnes se partagent la largeur, plus d'espace souple tassé à droite ; cellule Durée centrée.
    expect(styleOf(`${row(1)}-label-cell`)).toMatchObject({ flexGrow: 1, flexShrink: 1, flexBasis: 0 });
    expect(styleOf(`${row(1)}-duration-cell`)).toMatchObject({ flexGrow: 1, flexShrink: 1, flexBasis: 0, alignItems: "center" });
    expect([PHASE_CELL_WIDTH, PHASE_CELL_GAP]).toEqual([76, 20]);
    expect(within(get(TABLE)).queryAllByTestId(/-(increment|decrement)$/, hidden)).toEqual([]);
    expect(get(`${duration(1)}`).props.hitSlop).toEqual({ top: 6, bottom: 6 });
    expect(get(label(1)).props.hitSlop).toEqual({ top: 6, bottom: 6 });
  });

  it("PRE5-2.8/AC7 — deux phases à renseigner, Cible « — » : « Durée d’une série » « — » marquée (fond #FFF1F0, indice annoncé), ✓ indisponible", () => {
    renderSheet(params(unsetTarget()));
    fireEvent.press(get(WITH));
    expect(seriesDurationText()).toBe("—");
    expect(styleOf("execution-sheet-target").backgroundColor).toBe(colors.dangerSurface);
    expect(seriesDurationPill().props.accessibilityHint).toBe(t.invalidHint);
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("PRE-7 (D-446) — Cible indépendante : phases [5, 2] et Cible 2′00″ ; durée de phase modifiée ou Sans → Cible 2′00″, saisissable au clavier [roue — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]", () => {
    const { onApply } = renderSheet(
      params(numberTarget(120), {
        series: {
          kind: "UNIFORM",
          count: 3,
          target: numberTarget(120),
          pauseSeconds: 15,
          loadKg: 0,
          workPhases: [
            { id: 1, label: "Montée", durationSeconds: 5 },
            { id: 2, label: "Descente", durationSeconds: 2 },
          ],
        },
      }),
    );
    unfoldPhases();
    expect(seriesDurationText()).toBe("2′00″");
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: false });
    enterDuration(1, "8");
    expect(seriesDurationText()).toBe("2′00″");
    // La Cible se saisit au clavier avec des phases.
    fireEvent(get("execution-sheet-target-input"), "focus");
    expect(seriesDurationPill().props.accessibilityState).toMatchObject({ selected: true });
    fireEvent(get("execution-sheet-target-input"), "blur");
    validate();
    expect(applied(onApply).series).toMatchObject({ kind: "UNIFORM", target: numberTarget(120) });
    fireEvent.press(get(WITHOUT));
    expect(seriesDurationText()).toBe("2′00″");
    enterExecutionSheetValue("execution-sheet-target", 150);
    expect(seriesDurationText()).toBe("2′30″");
  });

  it("PRE-7 (D-446) — avec des phases : À l’échec puis Répétitions choisis ; ✓ enregistre, phases conservées", () => {
    const { onApply } = renderSheet(withPhases([["Montée", 5], ["Descente", 2]]));
    unfoldPhases();
    fireEvent.press(get("execution-sheet-stop-condition-control-FAILURE"));
    expect(optionState("execution-sheet-stop-condition-control-FAILURE")).toMatchObject({ selected: true });
    fireEvent.press(get("execution-sheet-mode-control-REPETITIONS"));
    expect(optionState("execution-sheet-mode-control-REPETITIONS")).toMatchObject({ selected: true });
    // Recette du 29/10/2026 : tableau replié par les autres contrôles, phases conservées.
    expect(phaseRows()).toHaveLength(0);
    fireEvent.press(get(CHEVRON));
    expect(phaseRows()).toHaveLength(2);
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: false });
    validate();
    const value = applied(onApply);
    expect(value.mode).toBe("REPETITIONS");
    expect(value.series).toMatchObject({ kind: "UNIFORM", target: failureTarget() });
    expect(value.series.kind === "UNIFORM" ? value.series.workPhases.map((phase) => [phase.label, phase.durationSeconds]) : null).toEqual([
      ["Montée", 5],
      ["Descente", 2],
    ]);
  });

  it("PRE5-2.8 — une seule phase relue des données : « 1 phase » au singulier", () => {
    renderSheet(withPhases([["Maintien", 9]]));
    expect(countText()).toBe("1 phase");
  });

  it("PRE5-2.8/AC3b (RC-5) — glisser la poignée de la phase 1 d'une ligne : réglage du nombre rangé au départ, repère d'insertion pendant le geste, phases échangées, ✓ dans le nouvel ordre", () => {
    const { onApply } = renderSheet(withPhases([["Descente", 6], ["Maintien", 3]]));
    unfoldPhases();
    // Décision du 06/11/2026 : saisie du nombre (clavier) rangée au départ du glisser.
    focusCount();
    expect(countActive()).toBe(true);
    const handle = get(`${row(1)}-handle`);
    fireEvent(handle, "responderGrant", { nativeEvent: { pageY: 100 } });
    expect(countActive()).toBe(false);
    blurCount();
    fireEvent(handle, "responderMove", { nativeEvent: { pageY: 100 + TABLE_ROW_HEIGHT } });
    expect(get("execution-sheet-phases-insertion-guide-before-3")).toBeTruthy();
    fireEvent(get(`${row(1)}-handle`), "responderRelease", { nativeEvent: { pageY: 100 + TABLE_ROW_HEIGHT } });
    expect(query("execution-sheet-phases-insertion-guide-before-3")).toBeNull();
    expect([shownLabel(1), shownLabel(2)]).toEqual(["Maintien", "Descente"]);
    expect([shownDuration(1), shownDuration(2)]).toEqual(["3″", "6″"]);
    validate();
    const series = applied(onApply).series;
    expect(series.kind === "UNIFORM" ? series.workPhases.map((phase) => phase.label) : null).toEqual(["Maintien", "Descente"]);
  });

  it("PRE5-2.8/AC6 (FR-3) — phases 6″ et 3″, 3 séries, pause 15″, D lue 9″ (modifiable depuis D-446) : Durée de l'exercice 1′12″ (calcul existant)", () => {
    renderSheet(withPhases([["A", 6], ["B", 3]]));
    expect(seriesDurationText()).toBe("9″");
    // Décision du 06/11/2026 : Durée de l'exercice modifiable = champ clavier (`-value`).
    expect(String((query("execution-sheet-total-value") ?? get("execution-sheet-total-text")).props.children)).toBe("1′12″");
  });

  it("PRE-7 R-2 (D-446 §4) — Répétitions 3 × 10, cadence 0, phases [5, 2] : Durée de l'exercice « ≈ » (10 × 7″ par série), jamais « Non calculable » ; durée de phase vide : pas « Non calculable »", () => {
    const repetitions = (seconds: number) =>
      params(numberTarget(10), {
        mode: "REPETITIONS",
        cadenceBeepIntervalSeconds: 0,
        series: {
          kind: "UNIFORM",
          count: 3,
          target: numberTarget(10),
          pauseSeconds: 15,
          loadKg: 0,
          workPhases: [
            { id: 1, label: "A", durationSeconds: 5 },
            { id: 2, label: "B", durationSeconds: seconds },
          ],
        },
      });
    const totalShown = () => String(get("execution-sheet-total-text").props.children);
    renderSheet(repetitions(2));
    // 3 × (10 × 7 s) + 3 × 15 s = 255 s.
    expect(totalShown()).toBe("≈ 4′15″");
    screen.unmount();
    renderSheet(repetitions(0));
    expect(totalShown()).not.toBe("Non calculable");
    expect(totalShown()).not.toContain("≈");
  });

  it("PRE5-2.8/AC8 (FR-32, NR Δ38) — six phases : six lignes, 7 saisi ramené à 6 ; le nombre de séries reste un champ distinct [± — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]", () => {
    renderSheet(withPhases([["A", 1], ["B", 1], ["C", 1], ["D", 1], ["E", 1], ["F", 1]]));
    unfoldPhases();
    expect(phaseRows()).toHaveLength(6);
    expect(countText()).toBe("6 phases");
    enterPhaseCount(7);
    expect(phaseRows()).toHaveLength(6);
    // Une seule surface : le focus du nombre de séries range la saisie des phases.
    focusCount();
    fireEvent(get("execution-sheet-series-input"), "focus");
    expect(countActive()).toBe(false);
    expect(get("execution-sheet-series").props.accessibilityState).toMatchObject({ selected: true });
  });
});

describe("ExecutionParametersSheet — recette iPhone du 29/10/2026 : tableau des phases replié par un autre contrôle", () => {
  it("toucher le réglage du nombre de phases le laisse ouvert ; un autre segmenté (Cadence) ou la valeur de la Cible le replie (sortie animée existante) ; phases conservées, chevron pour le redéployer", () => {
    renderSheet(withPhases([["A", 5], ["B", 2]]));
    unfoldPhases();
    expect(phaseRows()).toHaveLength(2);
    // Option Avec (réglage du nombre) : partie de la ligne des phases, le tableau reste.
    fireEvent.press(get(WITH));
    expect(phaseRows()).toHaveLength(2);
    fireEvent.press(get(WITH));
    // Autre contrôle : le tableau se replie.
    fireEvent.press(get("execution-sheet-cadence-control-1"));
    expect(phaseRows()).toHaveLength(0);
    expect(get("execution-sheet-row-phases")).toBeTruthy();
    expect(optionState(WITH)).toMatchObject({ selected: true });
    fireEvent.press(get(CHEVRON));
    expect(phaseRows()).toHaveLength(2);
    expect([shownLabel(1), shownLabel(2)]).toEqual(["A", "B"]);
    // Décision du 06/11/2026 : la Cible est un champ clavier ; son focus replie le tableau.
    fireEvent(get("execution-sheet-target-input"), "focus");
    expect(phaseRows()).toHaveLength(0);
  });
});

/** Contre-recette iPhone du 30/10/2026 : séparateurs (trait 1, `colors.divider`) rendus sous un nœud. */
function separatorsUnder(testID: string) {
  return get(testID).findAll((node) => {
    if (typeof node.type !== "string") return false;
    const style = StyleSheet.flatten(node.props.style) ?? {};
    return style.height === 1 && style.backgroundColor === colors.divider;
  });
}

// [Remplacé le 01/11/2026 — ordre de Hermann, point 3 : le trait sous la ligne « Phases » (ou sous
// son tableau) n'existe plus ; les phases forment un bloc autonome, séparé du bloc Séries par
// l'écart de 8 entre blocs (D-413).]
describe("Contre-recette iPhone du 30/10/2026 — séparateurs du tableau des phases (bloc autonome depuis le 01/11/2026)", () => {
  it("tableau déployé : aucun trait entre la ligne « Phases » et son tableau, ni dans le bloc ; tableau dans le bloc Phases", () => {
    renderSheet(withPhases([["A", 6], ["B", 3]]));
    unfoldPhases();
    expect(within(get("execution-sheet-frame-phases")).getByTestId(TABLE, hidden)).toBeTruthy();
    expect(within(get("execution-sheet-frame-series")).queryByTestId(TABLE, hidden)).toBeNull();
    expect(separatorsUnder("execution-sheet-phases-group")).toHaveLength(0);
    expect(separatorsUnder("execution-sheet-frame-phases")).toHaveLength(0);
    expect(query("execution-sheet-phases-separator")).toBeNull();
  });

  it("sans phases : bloc d'une seule ligne, sans trait", () => {
    renderSheet(params());
    expect(query(TABLE)).toBeNull();
    expect(separatorsUnder("execution-sheet-frame-phases")).toHaveLength(0);
    expect(query("execution-sheet-phases-separator")).toBeNull();
  });
});

describe("PRE-9 — recette iPhone n° 2 du 31/10/2026, constat a ; contrôle cr2-phases-rouge ; contre-recette n° 3 (cr4-rouge)", () => {
  const SELECTION = "execution-sheet-row-phases-selection";
  const FRAME = `${WITH}-invalid-frame`;
  const SURFACE = `${WITH}-invalid-surface`;
  const INDICATOR = "execution-sheet-phases-control-indicator";
  const COUNT_TEXT = "execution-sheet-phase-count-value";
  it("durée de phase manquante, tableau déployé ou replié : le champ « n phases » est rouge (cadre danger, fond dangerSurface, sans fond violet), jamais la ligne ; complet : aucun rouge", () => {
    renderSheet(params());
    fireEvent.press(get(WITH));
    // Contre-recette n° 3 (cr4-rouge) : déployé, le champ est déjà rouge — plus de fond violet.
    expect(get(TABLE)).toBeTruthy();
    expect(styleOf(FRAME)).toMatchObject({ borderWidth: 1, borderColor: colors.danger });
    expect(styleOf(SURFACE).backgroundColor).toBe(colors.dangerSurface);
    expect(query(INDICATOR)).toBeNull();
    expect(styleOf(COUNT_TEXT).color).toBe(colors.primary);
    // Le cadre épouse l'option (pas la ligne) : il est dans le segmenté, pas sous la ligne.
    expect(get("execution-sheet-phases-control").findAll((node) => node.props.testID === FRAME).length).toBeGreaterThan(0);
    // La ligne « Phases de l'exercice » reste neutre (cr2-phases-rouge).
    expect(styleOf(SELECTION).borderColor).toBeUndefined();
    expect(styleOf(SELECTION).backgroundColor).not.toBe(colors.dangerSurface);
    fireEvent.press(get(CHEVRON));
    expect(query(TABLE)).toBeNull();
    expect(styleOf(FRAME)).toMatchObject({ borderWidth: 1, borderColor: colors.danger });
    expect(styleOf(SELECTION).borderColor).toBeUndefined();
    // Une seule durée renseignée ne suffit pas.
    fireEvent.press(get(CHEVRON));
    enterDuration(1, "5");
    expect(styleOf(FRAME).borderColor).toBe(colors.danger);
    enterDuration(2, "3");
    // Complet : plus de rouge, le fond violet de la sélection revient.
    expect(query(FRAME)).toBeNull();
    expect(query(SURFACE)).toBeNull();
    expect(get(INDICATOR)).toBeTruthy();
    expect(styleOf(COUNT_TEXT).color).toBe(colors.background);
  });

  it("phases complètes, tableau replié : aucun rouge", () => {
    renderSheet(withPhases([["A", 6], ["B", 3]]));
    unfoldPhases();
    fireEvent.press(get(CHEVRON));
    expect(query(FRAME)).toBeNull();
    expect(styleOf(SELECTION).borderColor).toBeUndefined();
  });
});

describe("PRE-9 — recette iPhone n° 2 du 31/10/2026, constat e : phases « à vérifier »", () => {
  const SELECTION = "execution-sheet-row-phases-selection";
  function renderMarked(parent: ExecutionParametersInput, phasesToVerify: readonly number[]) {
    render(
      <TestSafeAreaProvider>
        <ExecutionParametersSheet
          parent={parent}
          profileSideRecoverySecondsDefault={10}
          phasesToVerify={phasesToVerify}
          onApply={jest.fn()}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );
  }

  const TO_VERIFY_FRAME = `${WITH}-to-verify-frame`;
  const TO_VERIFY_SURFACE = `${WITH}-to-verify-surface`;
  const INDICATOR = "execution-sheet-phases-control-indicator";

  it("contre-recette n° 3 (cr4-verifier) : durée reprise du Mouvement — seul le champ « n phases » est orange (cadre et fond, sans violet), déployé ou replié ; la ligne reste neutre ; sa cellule orange, les autres normales", () => {
    renderMarked(withPhases([["A", 6], ["B", 3]]), [2]);
    expect(styleOf(TO_VERIFY_FRAME)).toMatchObject({ borderWidth: 1, borderColor: toVerifyColors.border });
    expect(styleOf(TO_VERIFY_SURFACE).backgroundColor).toBe(toVerifyColors.surface);
    expect(query(INDICATOR)).toBeNull();
    expect(styleOf(SELECTION).borderColor).toBeUndefined();
    expect(styleOf(SELECTION).backgroundColor).not.toBe(toVerifyColors.surface);
    expect(styleOf(duration(2)).backgroundColor).toBe(toVerifyColors.surface);
    expect(styleOf(duration(1)).backgroundColor).not.toBe(toVerifyColors.surface);
    fireEvent.press(get(CHEVRON));
    expect(query(TABLE)).toBeNull();
    expect(styleOf(TO_VERIFY_FRAME).borderColor).toBe(toVerifyColors.border);
    expect(styleOf(SELECTION).borderColor).toBeUndefined();
  });

  it("« à compléter » prioritaire : une durée manque → champ « n phases » rouge, sans orange (cellule manquante rouge), la cellule reprise reste orange", () => {
    const parent = withPhases([["A", 6], ["B", 3]]);
    const series = parent.series as { readonly workPhases: readonly WorkPhase[] };
    renderMarked({ ...parent, series: { ...parent.series, workPhases: [series.workPhases[0]!, { ...series.workPhases[1]!, durationSeconds: 0 }] } } as ExecutionParametersInput, [1]);
    expect(query(TO_VERIFY_FRAME)).toBeNull();
    expect(styleOf(`${WITH}-invalid-frame`).borderColor).toBe(colors.danger);
    expect(styleOf(SELECTION).borderColor).toBeUndefined();
    expect(styleOf(duration(2)).backgroundColor).toBe(colors.dangerSurface);
    expect(styleOf(duration(1)).backgroundColor).toBe(toVerifyColors.surface);
  });

  it("sans marque : aucun orange", () => {
    renderMarked(withPhases([["A", 6], ["B", 3]]), []);
    unfoldPhases();
    expect(query(TO_VERIFY_FRAME)).toBeNull();
    expect(get(INDICATOR)).toBeTruthy();
    expect(styleOf(SELECTION).borderColor).toBeUndefined();
    expect(styleOf(duration(1)).backgroundColor).not.toBe(toVerifyColors.surface);
  });
});

describe("PRE-9 — recette iPhone n° 2 du 31/10/2026, constat d : feuille ouverte depuis une carte de la Composition", () => {
  function renderCard() {
    const onApply = jest.fn<(value: ExecutionParameters) => void>();
    const onCancel = jest.fn();
    render(
      <TestSafeAreaProvider>
        <ExecutionParametersSheet
          parent={withPhases([["A", 6], ["B", 3]])}
          profileSideRecoverySecondsDefault={10}
          presentation="compositionCard"
          onApply={onApply}
          onCancel={onCancel}
        />
      </TestSafeAreaProvider>,
    );
    return { onApply, onCancel };
  }

  it("voile animé par la feuille (Modal sans fondu propre) ; montée plus lente que le prototype (0,45 s)", () => {
    renderCard();
    expect(get("execution-sheet-modal").props.animationType).toBe("none");
    expect(get("execution-sheet-scrim-shade")).toBeTruthy();
    expect(CARD_SHEET_MOTION_MS).toBeGreaterThan(250);
  });

  it("✕ : la feuille redescend d'abord (même durée), puis `onCancel` ; un second appui ne ferme pas deux fois", async () => {
    const { onCancel } = renderCard();
    fireEvent.press(get("execution-sheet-cancel"));
    fireEvent.press(get("execution-sheet-cancel"));
    expect(onCancel).not.toHaveBeenCalled();
    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1), { timeout: 3000 });
  });

  it("✓ : `onApply` après la descente", async () => {
    const { onApply } = renderCard();
    validate();
    expect(onApply).not.toHaveBeenCalled();
    await waitFor(() => expect(onApply).toHaveBeenCalledTimes(1), { timeout: 3000 });
  });

  it("présentation par défaut (éditeur) : inchangée — Modal en fondu, fermeture immédiate", () => {
    const { onCancel } = renderSheet(withPhases([["A", 6], ["B", 3]]));
    expect(get("execution-sheet-modal").props.animationType).toBe("fade");
    expect(query("execution-sheet-scrim-shade")).toBeNull();
    fireEvent.press(get("execution-sheet-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe("Hermann, 01/11/2026 — tableau des phases replié à l'ouverture s'il n'y a rien à vérifier ni à renseigner (remplace « déployé à l'ouverture », PRE-5 story 2.8)", () => {
  function renderOpening(parent: ExecutionParametersInput, extra: { readonly phasesToVerify?: readonly number[]; readonly presentation?: "compositionCard" } = {}) {
    render(
      <TestSafeAreaProvider>
        <ExecutionParametersSheet parent={parent} profileSideRecoverySecondsDefault={10} {...extra} onApply={jest.fn()} onCancel={jest.fn()} />
      </TestSafeAreaProvider>,
    );
  }
  const withMissing = () => {
    const parent = withPhases([["A", 6], ["B", 3]]);
    const series = parent.series as { readonly workPhases: readonly WorkPhase[] };
    return { ...parent, series: { ...parent.series, workPhases: [series.workPhases[0]!, { ...series.workPhases[1]!, durationSeconds: null }] } } as ExecutionParametersInput;
  };

  it.each([
    ["éditeur", {}],
    ["carte de la Composition", { presentation: "compositionCard" as const }],
    ["marque vide", { phasesToVerify: [] as readonly number[] }],
  ])("durées complètes, aucune marque (%s) : tableau replié, chevron bas « Afficher », nombre et phases intacts", (_case, extra) => {
    renderOpening(withPhases([["A", 6], ["B", 3], ["C", 5]]), extra);
    expect(optionState(WITH)).toMatchObject({ selected: true });
    expect(query(TABLE)).toBeNull();
    expect(phaseRows()).toHaveLength(0);
    expect(countText()).toBe("3 phases");
    expect(chevronIcon()).toEqual(DOWN);
    expect(get(CHEVRON).props.accessibilityLabel).toBe(t.showPhases);
    fireEvent.press(get(CHEVRON));
    expect([1, 2, 3].map(shownLabel)).toEqual(["A", "B", "C"]);
    expect([1, 2, 3].map(shownDuration)).toEqual(["6″", "3″", "5″"]);
  });

  it.each([
    ["vide", withMissing()],
    ["0″", withPhases([["A", 6], ["B", 0]])],
  ])("une durée de phase à renseigner (%s) : tableau déployé, chevron haut", (_case, parent) => {
    renderOpening(parent);
    expect(get(TABLE)).toBeTruthy();
    expect(phaseRows()).toHaveLength(2);
    expect(chevronIcon()).toEqual(UP);
    expect(styleOf(duration(2)).backgroundColor).toBe(colors.dangerSurface);
  });

  it("une durée « à vérifier » : tableau déployé, sa cellule orange ; une marque d'une phase absente ne déploie pas", () => {
    renderOpening(withPhases([["A", 6], ["B", 3]]), { phasesToVerify: [2] });
    expect(get(TABLE)).toBeTruthy();
    expect(chevronIcon()).toEqual(UP);
    expect(styleOf(duration(2)).backgroundColor).toBe(toVerifyColors.surface);
    screen.unmount();
    renderOpening(withPhases([["A", 6], ["B", 3]]), { phasesToVerify: [9] });
    expect(query(TABLE)).toBeNull();
  });

  it("activation de l'option Avec : tableau déployé (inchangé), depuis Sans comme après Sans → Avec", () => {
    renderOpening(params());
    fireEvent.press(get(WITH));
    expect(get(TABLE)).toBeTruthy();
    expect(chevronIcon()).toEqual(UP);
    screen.unmount();
    renderOpening(withPhases([["A", 6], ["B", 3]]));
    expect(query(TABLE)).toBeNull();
    fireEvent.press(get(WITHOUT));
    fireEvent.press(get(WITH));
    expect(phaseRows()).toHaveLength(2);
    expect(chevronIcon()).toEqual(UP);
  });

  it("chevron : déploie puis replie, sans changer le nombre ni les phases", () => {
    renderOpening(withPhases([["A", 6], ["B", 3]]));
    expect(query(TABLE)).toBeNull();
    fireEvent.press(get(CHEVRON));
    expect(phaseRows()).toHaveLength(2);
    expect(chevronIcon()).toEqual(UP);
    expect(get(CHEVRON).props.accessibilityLabel).toBe(t.hidePhases);
    fireEvent.press(get(CHEVRON));
    expect(query(TABLE)).toBeNull();
    expect(chevronIcon()).toEqual(DOWN);
    expect(countText()).toBe("2 phases");
  });
});
