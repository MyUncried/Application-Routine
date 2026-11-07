import { Host, Menu, Popover, RNHostView } from "@expo/ui/swift-ui";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { AccessibilityInfo, Alert, Keyboard, Modal, Platform, StyleSheet, Switch, TextInput } from "react-native";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import {
  failureTarget,
  numberTarget,
  unsetTarget,
  type ExecutionParameters,
  type ExecutionParametersInput,
  type SeriesTarget,
} from "@/domain/activities/ExecutionParameters";
import {
  allFailureParameters,
  durationParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import {
  dragDestination,
  ExecutionParametersSheet,
  ROW_LABEL_CROSSFADE_MS,
  SELECTOR_SETTLE_MS,
  SHEET_ROW_MIN_HEIGHT,
  TABLE_ROW_HEIGHT,
  tableRowIdentity,
} from "@/features/activities/ExecutionParametersSheet";
import {
  revealClipEntering,
  revealClipExiting,
  revealContentEntering,
  revealContentExiting,
  rowShiftLayout,
  SHEET_MOTION_MS,
  SHEET_ROW_SHIFT_MS,
} from "@/features/activities/SheetMotion";
import {
  chooseExecutionMode,
  chooseExecutionRegime,
  chooseExecutionSide,
  CELL_BACKSPACE,
  closeExecutionSheetField,
  durationKeys,
  enterExecutionSheetCell,
  enterExecutionSheetValue,
  hideExecutionSheetKeyboard,
  openExecutionSheetField,
  showExerciseDurationSignals,
  showExecutionSheetKeyboard,
  tapExecutionSheetStep,
  typeInExecutionSheetCell,
} from "@/features/activities/testing/executionSheetActions";
import {
  dragDestination as sharedDragDestination,
  TABLE_LEAD_GAP,
  TABLE_LEAD_GAP_SHRINK,
  TABLE_LEAD_WIDTH,
  TABLE_ROW_DROP_MS,
  TABLE_ROW_HEIGHT as SHARED_TABLE_ROW_HEIGHT,
  tableRowIdentity as sharedTableRowIdentity,
} from "@/features/activities/sheetTable";
import { keyboardBarCompact, keyboardBarLift, keyboardBarSlotWidth } from "@/features/activities/KeyboardAccessoryBar";
import { strings } from "@/shared/i18n";
import { InlineStepper } from "@/shared/ui/ProfileStepper";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-3 (CE-UI-10) — rendu et actions de la feuille Paramètres. Les montants
 * et transitions sont calculés par le Domaine (`executionCalculations`,
 * `ExecutionParametersDraft`) et prouvés dans leurs suites ; ici, on vérifie
 * que la surface les affiche, les délègue et n'écrit rien (aucun service).
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

function params(overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 5,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 3, target: numberTarget(90), pauseSeconds: 15, loadKg: 0, workPhases: [] },
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

const variableRows = (rows: [number | null, number][]) => ({
  kind: "VARIABLE" as const,
  rows: rows.map(([target, pauseSeconds]) => ({
    target: target === null ? unsetTarget() : numberTarget(target),
    pauseSeconds,
    loadKg: 0,
  })),
  workPhases: [],
});

function renderSheetView(
  parent: ExecutionParametersInput,
  profileSideRecovery = 10,
  baseline: ExecutionParametersInput | null = null,
) {
  const onApply = jest.fn<(value: ExecutionParameters) => void>();
  const onCancel = jest.fn();
  const view = render(
    <TestSafeAreaProvider>
      <ExecutionParametersSheet
        parent={parent}
        baseline={baseline}
        profileSideRecoverySecondsDefault={profileSideRecovery}
        onApply={onApply}
        onCancel={onCancel}
      />
    </TestSafeAreaProvider>,
  );
  return { onApply, onCancel, unmount: view.unmount };
}

/**
 * Recette du 19/10 (RC-1) : événements `Keyboard` simulés. Les écouteurs posés par la Feuille
 * sont capturés ; `show` / `hide` émettent `Will` puis `Did` (clavier de 344, haut à 500).
 */
const KEYBOARD_EVENT = { endCoordinates: { screenX: 0, screenY: 500, width: 390, height: 344 }, duration: 250, easing: "keyboard" };
function captureKeyboard() {
  const listeners = new Map<string, Set<(event: unknown) => void>>();
  const spy = jest.spyOn(Keyboard, "addListener").mockImplementation(((name: string, listener: (event: unknown) => void) => {
    const set = listeners.get(name) ?? new Set<(event: unknown) => void>();
    set.add(listener);
    listeners.set(name, set);
    return { remove: () => set.delete(listener) };
  }) as unknown as typeof Keyboard.addListener);
  const emit = (name: string) => act(() => listeners.get(name)?.forEach((listener) => listener(KEYBOARD_EVENT)));
  return {
    show: () => {
      emit("keyboardWillShow");
      emit("keyboardDidShow");
    },
    hide: () => {
      emit("keyboardWillHide");
      emit("keyboardDidHide");
    },
    restore: () => spy.mockRestore(),
  };
}

function renderSheet(parent: ExecutionParametersInput, profileSideRecovery = 10, baseline: ExecutionParametersInput | null = null) {
  const { onApply, onCancel } = renderSheetView(parent, profileSideRecovery, baseline);
  return { onApply, onCancel };
}

/** Story 3.3 : appui bref sur un ± ; le champ hors tableau est ouvert au besoin (± à l’appui). */
const tap = tapExecutionSheetStep;
/** Story 3.3 : choix du Régime par le champ de la ligne « Séries » (l’interrupteur est retiré). */
const chooseRegime = chooseExecutionRegime;

const valueOf = (testID: string) => screen.getByTestId(`${testID}-value`).props.children as string;
/**
 * Texte affiché d'une pastille : `-text` (texte en lecture seule) ou, depuis le 06/11/2026 (décision de
 * Hermann, constat c : saisie au clavier), `-value` du champ clavier qui remplace la pastille.
 */
const text = (testID: string) =>
  String(
    (
      screen.queryByTestId(`${testID}-text`, { includeHiddenElements: true }) ??
      screen.queryByTestId(`${testID}-value`, { includeHiddenElements: true }) ??
      // « execution-sheet-target-value » : texte du champ clavier de la Cible commune (`execution-sheet-target`).
      screen.getByTestId(testID, { includeHiddenElements: true })
    ).props.children,
  );
const validate = () => fireEvent.press(screen.getByTestId("execution-sheet-validate"));
/**
 * PRE-5 story 2.4 (AD-24, AD-27) — Mode, Condition d'arrêt et Type de série sont des
 * segmentés en ligne : plus de pastille ni de popover. Lecture de la valeur affichée.
 */
const MODE_CONTROL = "execution-sheet-mode-control";
const STOP_CONTROL = "execution-sheet-stop-condition-control";
const SERIES_TYPE = "execution-sheet-series-type-control";
/** Chevron intérieur de l'option Variables (remplace le `DisclosureControl` de la ligne Séries). */
const TABLE_TOGGLE = `${SERIES_TYPE}-VARIABLE-chevron`;
const anyNode = { includeHiddenElements: true } as const;
/** Option sélectionnée d'un segmenté interactif, ou `null`. */
const selectedValue = (control: string, values: readonly string[]) =>
  values.find((value) => screen.queryByTestId(`${control}-${value}`, anyNode)?.props.accessibilityState?.selected === true) ?? null;
/**
 * D-433 (décision de Hermann du 19/10) : la ligne « Durée de l’exercice » est toujours
 * affichée. Valeur affichée (pastille ou texte en lecture seule, même `testID` de texte) et
 * annonce de la ligne (portée par le groupe de valeur quand le chevron est présent, sinon par
 * la ligne entière).
 */
const totalShown = () =>
  String((screen.queryByTestId("execution-sheet-total-text", anyNode) ?? screen.getByTestId("execution-sheet-total-value", anyNode)).props.children);
const totalSpoken = () =>
  (screen.queryByTestId("execution-sheet-row-total-value-group", anyNode) ?? screen.getByTestId("execution-sheet-row-total-line", anyNode)).props
    .accessibilityLabel as string | undefined;
const TOTAL_NOT_CALCULABLE = "Non calculable";
const TOTAL_MISSING_SPOKEN = "Durée de l’exercice, données manquantes";
const TOTAL_NOT_CALCULABLE_SPOKEN = "Durée de l’exercice, Non calculable";
/** Mode affiché : « Durée », « Répétitions », ou « — » si aucun segment n'est sélectionné. */
function modeText(): string {
  const mode = selectedValue(MODE_CONTROL, ["REPETITIONS", "DURATION"]) as "REPETITIONS" | "DURATION" | null;
  return mode === null ? "—" : strings.executionParameters.sheet.modes[mode];
}
/**
 * PRE-5 story 2.5 (AD-24, AD-27) — Changement de côté, Enchainement et Cadence sont des
 * segmentés en ligne ; Compte à rebours et Fin sont repliés sous « Durée de l'exercice ».
 */
const SIDE_CONTROL = "execution-sheet-side-control";
/**
 * Recette du 19/10 (RC-6) : plus de ligne « Enchainement » ; l'option Avec sélectionnée (N > 1)
 * porte la notation et ouvre [remplacé par PRE-7 B.3 (B5, D-447) : le déroulant `ORDER_PANEL`,
 * toutes plates-formes, par un déclencheur React Native de taille fixe] le menu natif (`Menu`
 * d'`@expo/ui` sur iOS, `Alert` ailleurs).
 */
const ORDER_MENU = "execution-sheet-side-order-menu";
/** PRE-7 B.3 (B5) : déroulant de l'Enchainement (`AnchoredPanel`), à la place du menu natif et de l'`Alert`. */
const ORDER_PANEL = "execution-sheet-side-order-panel";
const CADENCE_CONTROL = "execution-sheet-cadence-control";
const DURATION_DISCLOSURE = "execution-sheet-duration-disclosure";
const chooseSide = chooseExecutionSide;
const showSignals = showExerciseDurationSignals;
/** Changement de côté affiché : « Avec », « Sans », ou « — » si aucune option n'est sélectionnée. */
function sideText(): string {
  const side = selectedValue(SIDE_CONTROL, ["WITH", "WITHOUT"]) as "WITH" | "WITHOUT" | null;
  return side === null ? "—" : strings.executionParameters.sheet.sideModeChoices[side];
}
const SIDE_ORDER_VALUES = ["BY_SIDE", "BY_SERIES"] as const;
/**
 * Enchainement affiché dans l'option Avec, par son nom accessible (« Un côté après l’autre »,
 * …), lu sur la notation du déclencheur du menu ; « — » si le menu n'est pas rendu.
 */
function orderText(): string {
  const notation = screen.queryByTestId(`${ORDER_MENU}-notation`, anyNode);
  if (!notation) return "—";
  const order = SIDE_ORDER_VALUES.find((value) => strings.executionParameters.sheet.sideOrderSubtitles[value] === notation.props.children);
  return order === undefined ? "—" : strings.executionParameters.sheet.sideOrders[order];
}
/**
 * Choisit l'Enchainement par son nom accessible, dans le déroulant de l'option Avec (PRE-7 B.3,
 * B5 : toutes plates-formes) : toucher du déclencheur, puis de la rangée.
 */
function chooseOrder(label: string) {
  const order = SIDE_ORDER_VALUES.find((value) => strings.executionParameters.sheet.sideOrders[value] === label);
  if (order === undefined) throw new Error(`Enchainement inconnu « ${label} »`);
  fireEvent.press(screen.getByTestId(ORDER_MENU));
  fireEvent.press(screen.getByTestId(`${ORDER_MENU}-${order}`));
}
/** Option affichée de la Cadence (« Autre », « 1 s », « Sans » ; RC-10), ou « — ». */
function cadenceText(): string {
  const option = selectedValue(CADENCE_CONTROL, ["OTHER", "1", "NONE"]) as "OTHER" | "1" | "NONE" | null;
  return option === null ? "—" : strings.executionParameters.sheet.cadenceOptions[option];
}
/** Type de série affiché (« Variables » / « Identiques »), lecture seule (N = 1) comprise. */
function seriesTypeText(): string {
  const control = screen.getByTestId(SERIES_TYPE, anyNode);
  if (control.props.accessibilityRole === "text") return String(control.props.accessibilityLabel).split(", ")[1]!;
  const value = selectedValue(SERIES_TYPE, ["VARIABLE", "UNIFORM"]) as "VARIABLE" | "UNIFORM" | null;
  return value === null ? "—" : strings.executionParameters.sheet.seriesTypes[value];
}
// [`totalWheel` (gestes sur la roulette de la Durée totale) — retiré le 06/11/2026, décision de Hermann
// (constat c) : saisie au clavier.]
const applied = (onApply: jest.Mock<(value: ExecutionParameters) => void>) => onApply.mock.calls[0]![0];
/** Action accessible de la poignée d'une ligne (même déplacement métier que le glisser). */
const moveAction = (row: number, actionName: "moveUp" | "moveDown") =>
  fireEvent(screen.getByTestId(`execution-sheet-table-row-${row}-handle`), "accessibilityAction", {
    nativeEvent: { actionName },
  });
const actionNames = (row: number) =>
  (screen.getByTestId(`execution-sheet-table-row-${row}-handle`).props.accessibilityActions as { name: string }[]).map(
    (action) => action.name,
  );
/** Glisser vertical réel sur la poignée (responder natif) : de `dy` points. */
function dragHandle(row: number, dy: number) {
  const handle = screen.getByTestId(`execution-sheet-table-row-${row}-handle`);
  fireEvent(handle, "responderGrant", { nativeEvent: { pageY: 100 } });
  fireEvent(handle, "responderMove", { nativeEvent: { pageY: 100 + dy } });
  fireEvent(screen.getByTestId(`execution-sheet-table-row-${row}-handle`), "responderRelease", {
    nativeEvent: { pageY: 100 + dy },
  });
}

/**
 * D-434 (décision de Hermann du 19/10, QD-434-1) — la Cible d'une ligne se saisit au clavier
 * numérique dans sa cellule : chiffres « MMSS » en Durée (90 → « 130 »), le nombre en
 * Répétitions ; « FAILURE » : commande « À l'échec » de la barre du clavier.
 */
function chooseCellTarget(row: number, value: number | "FAILURE") {
  const cell = `execution-sheet-table-row-${row}-target`;
  if (value === "FAILURE") {
    enterExecutionSheetCell(cell, "FAILURE");
    return;
  }
  const repetitions = String(screen.getByTestId(cell, anyNode).props.accessibilityLabel).endsWith("Répétitions");
  enterExecutionSheetCell(cell, repetitions ? String(value) : durationKeys(value));
}
/** Secondes d'une durée affichée (« 1 min 5 s », « 45 s », « 12 min »). */
function displayedSeconds(text: string): number {
  const minutes = /(\d+) min/u.exec(text);
  const seconds = /(\d+) s/u.exec(text);
  return (minutes ? Number(minutes[1]) * 60 : 0) + (seconds ? Number(seconds[1]) : 0);
}
/** D-434 : la Pause d'une ligne, une seconde de plus ou de moins, saisie au clavier dans sa cellule (bornes 0..300). */
function nudgeCellPause(row: number, delta: 1 | -1) {
  const seconds = displayedSeconds(valueOf(`execution-sheet-table-row-${row}-pause`));
  chooseCellPause(row, Math.min(300, Math.max(0, seconds + delta)));
}
/** D-434 : la Pause d'une ligne se saisit au clavier numérique dans sa cellule (« MMSS »). */
function chooseCellPause(row: number, seconds: number) {
  enterExecutionSheetCell(`execution-sheet-table-row-${row}-pause`, durationKeys(seconds));
}

afterEach(() => {
  jest.useRealTimers();
});

/** Q41 : mise en page simulée d'un élément (position verticale et hauteur, dans son parent). */
const layoutOf = (testID: string, y: number, height: number) =>
  fireEvent(screen.getByTestId(testID), "layout", { nativeEvent: { layout: { x: 0, y, width: 330, height } } });
/** PRE-5 story 2.4 (AD-28) : mise en page simulée des cadres ([y, hauteur] dans le contenu défilant). */
const layoutFrames = (frames: Partial<Record<"execution" | "phases" | "series" | "sides" | "cadence", readonly [number, number]>>) => {
  for (const [frame, box] of Object.entries(frames)) layoutOf(`execution-sheet-frame-${frame}`, box[0], box[1]);
};

/**
 * PRE-4 story 3.1 (AD-7) — choix du Mode quelle que soit la plateforme (utilitaire
 * partagé). Les tests qui n'exercent que le choix du Mode passent par lui ; ceux qui
 * portent sur le segmenté lui-même tournent sous Android, où il reste livré
 * (`withPlatform`).
 */
const chooseMode = chooseExecutionMode;

/** Exécute un test sous `Platform.OS` imposé, restauré ensuite (jest-expo : `ios` par défaut). */
async function withPlatform(os: typeof Platform.OS, body: () => void | Promise<void>) {
  const original = Platform.OS;
  Platform.OS = os;
  try {
    await body();
  } finally {
    Platform.OS = original;
  }
}

describe("ExecutionParametersSheet — PRE-3", () => {
  it("P3-07/move-accessible — actions Monter/Descendre de la poignée : cible ET Pause ensemble, renumérotation, bornes absentes ; même résultat que le glisser", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    expect(actionNames(1)).toEqual(["moveDown"]);
    expect(actionNames(3)).toEqual(["moveUp"]);
    moveAction(3, "moveUp");
    moveAction(2, "moveUp");
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("1 min");
    expect(valueOf("execution-sheet-table-row-1-pause")).toBe("30 s");
    validate();
    expect(applied(onApply).series).toEqual(variableRows([[60, 30], [30, 10], [45, 20]]));
  });

  it("P3-08/immediate-N1 — N=1 : uniforme et un côté après l'autre immédiatement ; contrôles sans effet grisés ; total 220 s", () => {
    const { onApply } = renderSheet(
      params({ series: variableRows([[90, 15], [45, 20], [60, 30]]), sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES", sideRecoverySeconds: 10 }),
    );
    tap("execution-sheet-series-decrement");
    tap("execution-sheet-series-decrement");
    expect(valueOf("execution-sheet-series")).toBe("1 série identique");
    // PRE-5 story 2.4 (P16) : à N = 1, le Type de série est non modifiable. Recette du 20/10
    // (RC-15) : Variables indisponible ; Identiques, sélectionné, porte le nombre (réglable).
    expect(screen.getByTestId(`${SERIES_TYPE}-VARIABLE`).props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId(`${SERIES_TYPE}-UNIFORM`).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    // Q38 (Hermann, 2026-10-17) : la ligne « Ordre des côtés » n'est plus atténuée ni
    // désactivée à N = 1 ; elle est masquée. La Pause au changement de côté reste.
    expect(screen.queryByTestId(ORDER_MENU)).toBeNull();
    expect(screen.queryByTestId("execution-sheet-order-value")).toBeNull();
    expect(screen.getByTestId("execution-sheet-row-side-recovery")).toBeTruthy();
    expect(text("execution-sheet-total")).toBe("3 min 40 s");
    validate();
    expect(applied(onApply)).toMatchObject({
      series: { kind: "UNIFORM", count: 1, target: numberTarget(90), pauseSeconds: 15, loadKg: 0, workPhases: [] },
      sideOrder: "BY_SIDE",
    });
  });

  describe("PRE4-Q38 — Ordre des côtés masqué à N = 1, conservé et réaffiché dès N ≥ 2", () => {
    const bilateral = (overrides: Partial<ExecutionParametersInput> = {}) =>
      params({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 10, ...overrides });

    it("PRE4-Q38 (a), RC-6 — N = 1 bilatéral : Avec sans notation ni menu d'Enchainement ; la Pause au changement de côté reste", () => {
      renderSheet(bilateral({ series: { kind: "UNIFORM", count: 1, target: numberTarget(90), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
      expect(screen.getByTestId("execution-sheet-row-side")).toBeTruthy();
      expect(screen.queryByTestId(ORDER_MENU)).toBeNull();
      expect(screen.getByTestId(`${SIDE_CONTROL}-WITH`).props.accessibilityLabel).toBe("Avec");
      expect(screen.queryByText("Enchainement")).toBeNull();
      expect(screen.getByTestId("execution-sheet-row-side-recovery")).toBeTruthy();
    });

    it("PRE4-Q38 (b), RC-6 — N = 2 : menu de l'Enchainement présent dans Avec, choix appliqué", () => {
      renderSheet(bilateral({ series: { kind: "UNIFORM", count: 2, target: numberTarget(90), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
      expect(within(screen.getByTestId(`${SIDE_CONTROL}`)).getByTestId(ORDER_MENU)).toBeTruthy();
      expect(screen.getByTestId(`${SIDE_CONTROL}-WITH`).props.accessibilityLabel).toBe("Avec, Chaque série d’un côté, puis chaque série de l’autre");
      expect(orderText()).toBe("Chaque série d’un côté, puis chaque série de l’autre");
      chooseOrder("Les deux côtés à chaque série");
      expect(orderText()).toBe("Les deux côtés à chaque série");
    });

    it("PRE4-Q38 (c) — Ordre choisi à N = 3, N → 1 (masqué, effectif normalisé), N → 2 : réaffiché, ✓ BY_SERIES", () => {
      const { onApply } = renderSheet(bilateral());
      chooseOrder("Les deux côtés à chaque série");
      tap("execution-sheet-series-decrement");
      tap("execution-sheet-series-decrement");
      expect(valueOf("execution-sheet-series")).toBe("1 série identique");
      expect(screen.queryByTestId(ORDER_MENU)).toBeNull();
      // Effectif normalisé « Un côté après l’autre » à N = 1 : prouvé par ✓ en (c bis).
      tap("execution-sheet-series-increment");
      expect(valueOf("execution-sheet-series")).toBe("2 séries identiques");
      expect(screen.getByTestId(ORDER_MENU)).toBeTruthy();
      expect(orderText()).toBe("Les deux côtés à chaque série");
      validate();
      expect(applied(onApply)).toMatchObject({ series: { kind: "UNIFORM", count: 2 }, sideOrder: "BY_SERIES" });
    });

    it("PRE4-Q38 (c bis) — à N = 1 après un Ordre choisi, ✓ applique « Un côté après l’autre » (FR-12-04 inchangé)", () => {
      const { onApply } = renderSheet(bilateral());
      chooseOrder("Les deux côtés à chaque série");
      tap("execution-sheet-series-decrement");
      tap("execution-sheet-series-decrement");
      validate();
      expect(applied(onApply)).toMatchObject({ series: { kind: "UNIFORM", count: 1 }, sideOrder: "BY_SIDE" });
    });

    // PRE-5 story 2.5 (AC2, AC6, NR Δ38) : l'Enchainement est un segmenté en ligne, sans
    // surface ; le stepper « Nombre de séries » de PRE-4, ouvert, réglé de 2 à 1 puis fermé,
    // masque la ligne sans être lui-même modifié (champ resté ouvert, T22), et la réaffiche à 2.
    // [Stepper de N ouvert, réglé de 2 à 1 sans se fermer (T22) — remplacé le 06/11/2026, décision de
    // Hermann (constat c) : saisie au clavier ; N saisi 1 puis 2 masque puis réaffiche l'Enchainement.]
    it("PRE4-Q38 (c ter), PRE5-2.5/AC2 — Enchainement en ligne : N saisi au clavier de 2 à 1 masque la ligne ; N → 2 la réaffiche", () => {
      renderSheet(bilateral({ series: { kind: "UNIFORM", count: 2, target: numberTarget(90), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
      expect(screen.getByTestId(ORDER_MENU)).toBeTruthy();
      enterExecutionSheetValue("execution-sheet-series", 1, "integer");
      expect(valueOf("execution-sheet-series")).toBe("1 série identique");
      expect(screen.queryByTestId(ORDER_MENU)).toBeNull();
      enterExecutionSheetValue("execution-sheet-series", 2, "integer");
      expect(screen.getByTestId(ORDER_MENU)).toBeTruthy();
      expect(orderText()).toBe("Chaque série d’un côté, puis chaque série de l’autre");
      expect(valueOf("execution-sheet-series")).toBe("2 séries identiques");
    });

    it("PRE4-Q38 (d) — Séries variables : N 3 → 1 → 2, l'Ordre choisi revient avec les lignes", () => {
      const { onApply } = renderSheet(
        bilateral({ series: variableRows([[90, 15], [45, 20], [60, 30]]), sideOrder: "BY_SERIES" }),
      );
      expect(orderText()).toBe("Les deux côtés à chaque série");
      tap("execution-sheet-series-decrement");
      tap("execution-sheet-series-decrement");
      expect(screen.queryByTestId(ORDER_MENU)).toBeNull();
      tap("execution-sheet-series-increment");
      expect(orderText()).toBe("Les deux côtés à chaque série");
      validate();
      expect(applied(onApply)).toMatchObject({ series: variableRows([[90, 15], [45, 20]]), sideOrder: "BY_SERIES" });
    });
  });

  // PRE-5 story 2.5 (AC1) : la direction n'est plus choisie dans la Feuille (Avec / Sans) ;
  // un historique `LEFT_RIGHT` s'affiche Avec et donne le même total que `RIGHT_LEFT`.
  it("P3-09/directions — droite→gauche ou gauche→droite (historique) : Avec, totaux identiques ; PC une fois par côté, N fois par série", () => {
    const uniform = { kind: "UNIFORM" as const, count: 3, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] };
    const view = renderSheetView(params({ series: uniform, sideMode: "LEFT_RIGHT", sideRecoverySeconds: 15 }));
    expect(sideText()).toBe("Avec");
    // Un côté après l'autre : 2 × 3 × (30 + 10) + 15 = 255 s.
    expect(text("execution-sheet-total")).toBe("4 min 15 s");
    view.unmount();
    renderSheet(params({ series: uniform, sideMode: "RIGHT_LEFT", sideRecoverySeconds: 15 }));
    expect(sideText()).toBe("Avec");
    expect(text("execution-sheet-total")).toBe("4 min 15 s");
    chooseOrder("Les deux côtés à chaque série");
    // Les deux côtés à chaque série : 2 × 90 + 30 + 3 × 15 = 255 s — PC compté N fois.
    expect(text("execution-sheet-total")).toBe("4 min 15 s");
    tap("execution-sheet-side-recovery-increment");
    // PC 16 : par série + 3 s ; par côté il n'ajouterait qu'une seconde.
    expect(text("execution-sheet-total")).toBe("4 min 18 s");
  });

  it("P3-09/unilateral-controls — sans changement de côté : ordre et PC masqués, aucune contribution de PC", () => {
    const { onApply } = renderSheet(params({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 15 }));
    chooseSide("Sans");
    expect(screen.queryByTestId(ORDER_MENU)).toBeNull();
    expect(screen.queryByTestId("execution-sheet-side-recovery")).toBeNull();
    // 3 × (90 + 15) = 315 s, sans PC.
    expect(text("execution-sheet-total")).toBe("5 min 15 s");
    validate();
    expect(applied(onApply).sideMode).toBe("UNILATERAL");
  });

  it("P3-11/all-modes-bip — Bip présent et commun dans les deux modes ; même valeur conservée en changeant de mode", () => {
    const { onApply } = renderSheet(params());
    tap("execution-sheet-beep-increment");
    tap("execution-sheet-beep-increment");
    // [Valeur du ± ouvert — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier ;
    // le champ révélé se range à sa sortie, l'option Autre porte la valeur (B8).]
    expect(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`).props.accessibilityLabel).toBe("Autre, 2 s");
    for (const mode of ["Répétitions", "Durée"]) {
      // PRE-5 story 2.5 (AC3) : le choix du Mode range le ± ; la Cadence affiche alors Autre
      // (recette du 19/10, RC-10 : 2 s n'est plus une option).
      chooseMode(mode);
      expect(cadenceText()).toBe("Autre");
    }
    validate();
    expect(applied(onApply).cadenceBeepIntervalSeconds).toBe(2);
  });

  it("P3-14/inverse-enumeration — total demandé 100 s : N=3 retenu (égalité vers le plus grand), message d'ajustement 2 min ; 80 s exact sans message", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 1, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
    // [Roue de la Durée de l'exercice — remplacée le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]
    enterExecutionSheetValue("execution-sheet-total", 100);
    expect(valueOf("execution-sheet-series")).toBe("3 séries identiques");
    expect(screen.getByText("Durée ajustée à 2 min pour respecter un nombre entier de séries.")).toBeTruthy();

    // [Roue de la Durée de l'exercice — remplacée le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]
    enterExecutionSheetValue("execution-sheet-total", 80);
    expect(valueOf("execution-sheet-series")).toBe("2 séries identiques");
    expect(screen.queryByText(/Durée ajustée/)).toBeNull();
  });

  it("P3-14/inverse-boundaries — inversion réservée à la Durée uniforme : total non modifiable en variable, Répétitions ou tout échec", () => {
    const view = renderSheetView(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
    expect(text("execution-sheet-total")).toBe("3 min 15 s");
    chooseMode("Répétitions");
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
    view.unmount();
    renderSheet({ ...allFailureParameters(3, 15, { cadenceBeepIntervalSeconds: 2 }), countdownSeconds: 10, endSeconds: 5 });
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
  });

  it("P3-16/fold-incomplete — Série 2 incomplète : ✓ grisé, cellule « Série 2 » signalée (aucun message, décision D-2), même tableau replié, données intactes, total —", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 10], [null, 20], [60, 30]]) }));
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    // Décision propriétaire D-2 (12/10) : plus de message « Série 2 : renseignez la durée. » ;
    // la Série est identifiée par sa cellule signalée (contour figé) et annoncée « Valeur à renseigner ».
    expect(screen.queryByTestId("execution-sheet-message")).toBeNull();
    expect(screen.getByTestId("execution-sheet-table-row-2-target").props.accessibilityHint).toBe("Valeur à renseigner");
    expect(screen.getByTestId("execution-sheet-table-row-2-target").props.accessibilityLabel).toMatch(/2/);
    // Décision Q35 (2026-10-17) : fond rouge léger #FFF1F0 (dangerSurface), sans liseré —
    // remplace le contour figé de la recette 1 (A-02/A-07).
    const invalidCell = StyleSheet.flatten(screen.getByTestId("execution-sheet-table-row-2-target").props.style);
    expect(invalidCell.backgroundColor).toBe("#FFF1F0");
    expect(invalidCell.borderWidth).toBeUndefined();
    expect(invalidCell.borderColor).toBeUndefined();
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-table-row-1-target").props.style).backgroundColor).not.toBe("#FFF1F0");
    // PRE-4 story 2.1 (AC9, H10, H28) : jamais « 0 s ». D-433 : une Cible à renseigner ne
    // masque plus la ligne Durée de l'exercice — elle affiche « — », annoncée « données
    // manquantes » (rétablit l'attendu PRE-3 « total — »).
    expect(screen.getByTestId("execution-sheet-row-total")).toBeTruthy();
    expect(totalShown()).toBe("—");
    expect(totalSpoken()).toBe(TOTAL_MISSING_SPOKEN);
    expect(screen.queryAllByText("0 s")).toHaveLength(0);
    // Replier ne modifie ni les données ni la validation.
    fireEvent.press(screen.getByLabelText("Masquer le tableau des séries"));
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    expect(screen.queryByTestId("execution-sheet-message")).toBeNull();
    validate();
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText("Afficher le tableau des séries"));
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("—");
    expect(valueOf("execution-sheet-table-row-3-target")).toBe("1 min");
    // Correction de la cellule (PRE-5 story 2.6 : par sa roue) : ✓ redevient actif et le message disparaît.
    chooseCellTarget(2, 45);
    expect(screen.queryByTestId("execution-sheet-message")).toBeNull();
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: false });
  });

  // [P3-19/hold et P3-19/non-accelerated (maintien des ±, accélération) — supprimés le 06/11/2026,
  // décision de Hermann (constat c) : saisie au clavier, plus aucun ±.]

  // [Q41 : un seul Sélecteur (roue) ouvert à la fois — remplacé le 06/11/2026, décision de Hermann
  // (constat c) : saisie au clavier ; un seul champ clavier actif à la fois.]
  it("P3-19/exclusive-scroll — un seul champ actif ; le focus d'un autre champ désactive le premier ; en-tête hors du corps défilant", () => {
    renderSheet(params());
    openExecutionSheetField("execution-sheet-target");
    expect(screen.getByTestId("execution-sheet-target").props.accessibilityState).toMatchObject({ selected: true });
    openExecutionSheetField("execution-sheet-total");
    expect(screen.getByTestId("execution-sheet-target").props.accessibilityState).toMatchObject({ selected: false });
    expect(screen.getByTestId("execution-sheet-total").props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.queryByTestId("execution-sheet-total-wheel")).toBeNull();
    const body = screen.getByTestId("execution-sheet-body");
    expect(within(body).queryByTestId("execution-sheet-validate")).toBeNull();
    showSignals();
    expect(within(body).getByTestId("execution-sheet-end")).toBeTruthy();
  });

  it("P3-20/all-surfaces — titre, ✕ / ✓, lignes et libellés des écrans de référence ; valeurs « — » / Cadence « Sans » à l'état vide", () => {
    renderSheet(params({ mode: null, series: { kind: "UNIFORM", count: 1, target: unsetTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] }, sideMode: null }));
    expect(screen.getByText("Paramètres d’exécution")).toBeTruthy();
    // Story 3.3 (FR-04-01) : plus de ligne « Séries variables ». PRE-5 story 2.4 (PR-01) :
    // lignes « Mode », « Condition d’arrêt » et « Type de série » (recette du 20/10, RC-15 : plus
    // de ligne « Nombre de séries », le nombre est porté par le Type de série).
    expect(screen.queryByText("Séries variables")).toBeNull();
    expect(screen.queryByText("Nombre de séries")).toBeNull();
    for (const label of [
      "Mode",
      "Condition d’arrêt",
      "Séries",
      "Pause après chaque série",
      "De chaque côté", // ordre de Hermann du 01/11/2026, point 5 (remplace « Changement de côté »)
      "Cadence",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    // D-433 : Mode non choisi et Cible à renseigner — la ligne « Durée de l'exercice » est
    // présente (« — ») ; Compte à rebours et Fin sont repliés derrière son chevron. Libellé
    // masqué à l'accessibilité (l'annonce regroupée est portée par la valeur).
    expect(screen.getByText("Durée de l’exercice", anyNode)).toBeTruthy();
    expect(totalShown()).toBe("—");
    expect(screen.queryByText("Compte à rebours")).toBeNull();
    expect(screen.queryByText("Fin d’exercice")).toBeNull();
    showSignals();
    for (const label of ["Compte à rebours", "Fin d’exercice"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.queryByText("Mode d’exécution")).toBeNull();
    expect(screen.queryByText("Bip de cadence")).toBeNull();
    expect(modeText()).toBe("—");
    expect(valueOf("execution-sheet-series")).toBe("1 série identique");
    expect(cadenceText()).toBe("Sans");
    // Story 3.3 (AC9, FR-11-05) ; PRE-5 story 2.5 : Changement de côté non renseigné — aucune
    // option sélectionnée.
    expect(sideText()).toBe("—");
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
  });

  it("P3-20/sheet-specific — voile #1F2129 à 34 % ; Cadence avant la Durée de l'exercice applicable, sinon avant Compte à rebours ; PRE-5 story 2.5 : lignes du cadre Côtés non indentées", () => {
    renderSheet(params({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 10 }));
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-scrim").props.style)).toMatchObject({
      backgroundColor: "rgba(31, 33, 41, 0.34)",
    });
    showSignals();
    const order = ["execution-sheet-row-beep", "execution-sheet-row-total", "execution-sheet-row-countdown"];
    const json = JSON.stringify(screen.toJSON());
    const positions = order.map((id) => json.indexOf(`"${id}"`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    // Q41 : la ligne est rendue dans un cadre de révélation (`-content`). PRE-5 story 2.5
    // (Figma `9230:19534`) : plus d'indentation dans le cadre Côtés (marge 12 du cadre).
    // RC-6 : plus de ligne Enchainement ; Changement de côté vérifié à sa place.
    for (const row of ["execution-sheet-row-side", "execution-sheet-row-side-recovery", "execution-sheet-row-beep"]) {
      expect({ row, marginLeft: StyleSheet.flatten(screen.getByTestId(`${row}-content`).props.style)?.marginLeft }).toEqual({ row, marginLeft: undefined });
    }
  });

  it("P3-20/sheet-specific — tout échec (D-433) : ligne Durée de l’exercice « Non calculable », entre le Bip et Compte à rebours", () => {
    renderSheet(params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: { kind: "FAILURE" }, pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
    // D-433 : À l'échec en séries identiques — la ligne reste, « Non calculable », jamais un total.
    expect(screen.getByTestId("execution-sheet-row-total")).toBeTruthy();
    expect(totalShown()).toBe(TOTAL_NOT_CALCULABLE);
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
    showSignals();
    const json = JSON.stringify(screen.toJSON());
    const positions = ["execution-sheet-row-beep", "execution-sheet-row-total", "execution-sheet-row-countdown"].map((id) => json.indexOf(`"${id}"`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("P3-21/accessible-controls — libellés complets, états désactivés, valeurs courantes, actions ✓/✕ nommées", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 1, target: numberTarget(90), pauseSeconds: 0, loadKg: 0, workPhases: [] } }));
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityLabel).toBe("Valider les paramètres");
    expect(screen.getByTestId("execution-sheet-cancel").props.accessibilityLabel).toBe("Annuler les paramètres");
    // [− du ± de N indisponible à 1 — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au
    // clavier ; 0 saisi est ramené à la borne 1.]
    enterExecutionSheetValue("execution-sheet-series", 0, "integer");
    expect(valueOf("execution-sheet-series")).toBe("1 série identique");
    // RC-15 : à N = 1, Variables est indisponible et annoncé comme tel (P16).
    expect(screen.getByTestId(SERIES_TYPE).props.accessibilityLabel).toBe("Séries");
    expect(screen.getByTestId(`${SERIES_TYPE}-VARIABLE`).props.accessibilityLabel).toBe("Variables, sans effet pour une seule série");
    expect(screen.getByTestId("execution-sheet").props.accessibilityViewIsModal).toBe(true);
    // Champ clavier : nom du réglage, valeur courante annoncée.
    expect(screen.getByTestId("execution-sheet-target").props.accessibilityLabel).toBe("Objectif de durée");
    expect(screen.getByTestId("execution-sheet-target").props.accessibilityValue).toEqual({ text: "1 min 30 s" });
  });

  // [Roue de la Cible commune (✕ sans effet, ✓ appliqué) — remplacée le 06/11/2026, décision de Hermann
  // (constat c) : saisie au clavier « MM:SS », appliquée à la sortie du champ.]
  it("INTERACTION/keyboard — Cible commune saisie au clavier : « MM:SS » en saisie, valeur appliquée au brouillon à la sortie ; ✓ de la feuille applique", () => {
    const { onApply } = renderSheet(params());
    openExecutionSheetField("execution-sheet-target");
    expect(text("execution-sheet-target-value")).toBe("01:30");
    typeInExecutionSheetCell("execution-sheet-target", "200");
    expect(text("execution-sheet-target-value")).toBe("02:00");
    closeExecutionSheetField("execution-sheet-target");
    expect(text("execution-sheet-target-value")).toBe("2 min");
    validate();
    expect(applied(onApply).series).toEqual({ kind: "UNIFORM", count: 3, target: numberTarget(120), pauseSeconds: 15, loadKg: 0, workPhases: [] });
  });

  it("ACCESSIBILITY/keyboard — champ nommé avec sa valeur, clavier numérique, état sélectionné pendant la saisie", () => {
    renderSheet(params());
    expect(screen.getByTestId("execution-sheet-target-input", anyNode).props.keyboardType).toBe("number-pad");
    expect(screen.getByTestId("execution-sheet-target").props.accessibilityState).toMatchObject({ selected: false });
    openExecutionSheetField("execution-sheet-target");
    expect(screen.getByTestId("execution-sheet-target").props.accessibilityState).toMatchObject({ selected: true });
    closeExecutionSheetField("execution-sheet-target");
    expect(screen.getByTestId("execution-sheet-target").props.accessibilityState).toMatchObject({ selected: false });
  });

  it("INTERACTION/keyboard — Pause : borne 300 s respectée ; pas de 1 s au clavier", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(90), pauseSeconds: 300, loadKg: 0, workPhases: [] } }));
    tap("execution-sheet-pause-increment");
    expect(valueOf("execution-sheet-pause")).toBe("5 min");
    tap("execution-sheet-pause-decrement");
    expect(valueOf("execution-sheet-pause")).toBe("4 min 59 s");
    tap("execution-sheet-pause-increment");
    expect(valueOf("execution-sheet-pause")).toBe("5 min");
  });

  // [Cadence : ± ajustable (« adjustable », actions incrémenter / décrémenter) — remplacé le 06/11/2026,
  // décision de Hermann (constat c) : saisie au clavier, bornes 0..10 s.]
  it("ACCESSIBILITY/keyboard — Cadence (Autre) : champ nommé « Cadence » ; valeur saisie, bornée à 10 s", () => {
    const { onApply } = renderSheet(params({ cadenceBeepIntervalSeconds: 4 }));
    openExecutionSheetField("execution-sheet-beep");
    const beep = screen.getByTestId("execution-sheet-beep");
    expect(beep.props.accessibilityLabel).toBe("Cadence");
    expect(text("execution-sheet-beep-value")).toBe("00:04");
    typeInExecutionSheetCell("execution-sheet-beep", "30");
    closeExecutionSheetField("execution-sheet-beep");
    validate();
    expect(applied(onApply).cadenceBeepIntervalSeconds).toBe(10);
  });

  it("INTERACTION/regime (ex-interrupteur) — identiques → variables : lignes copiées ; retour uniforme = première ligne ; réactivation restaure ; égalité garde VARIABLE", () => {
    const { onApply } = renderSheet(params({ series: { kind: "UNIFORM", count: 2, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
    chooseRegime("variables");
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("30 s");
    chooseCellTarget(2, 31);
    chooseRegime("identiques");
    expect(text("execution-sheet-target-value")).toBe("30 s");
    chooseRegime("variables");
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("31 s");
    chooseCellTarget(2, 30);
    validate();
    expect(applied(onApply).series).toEqual(variableRows([[30, 10], [30, 10]]));
  });

  it("ACCESSIBILITY/regime (ex-interrupteur) — Régime effectif exposé ; N=1 rend le champ de Régime inactif et annoncé ; lignes dans l'ordre de lecture", () => {
    renderSheet(params({ series: variableRows([[30, 10], [45, 20]]) }));
    expect(seriesTypeText()).toBe("Variables");
    const json = JSON.stringify(screen.toJSON());
    expect(json.indexOf("execution-sheet-table-row-1")).toBeLessThan(json.indexOf("execution-sheet-table-row-2"));
    tap("execution-sheet-series-decrement");
    expect(seriesTypeText()).toBe("Identiques");
    // PRE-5 story 2.4 (P16) ; RC-15 : Variables indisponible, Identiques sélectionné porte le nombre.
    expect(screen.getByTestId(`${SERIES_TYPE}-VARIABLE`).props.accessibilityState).toMatchObject({ disabled: true });
    expect(within(screen.getByTestId(SERIES_TYPE)).getByTestId("execution-sheet-series")).toBeTruthy();
  });

  it("INTERACTION/sortable-rows — déplacement puis ✕ : rien n'est appliqué au parent", () => {
    const { onApply, onCancel } = renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    dragHandle(1, 42);
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("45 s");
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("30 s");
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
  });

  it("ACCESSIBILITY/sortable-rows — Monter/Descendre portent le rang ; rangs actualisés après déplacement", () => {
    renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    const handle = screen.getByTestId("execution-sheet-table-row-2-handle");
    expect(handle.props.accessibilityLabel).toBe("Déplacer la série 2");
    expect(handle.props.accessibilityActions).toEqual([
      { name: "moveUp", label: "Monter la série 2" },
      { name: "moveDown", label: "Descendre la série 2" },
    ]);
    expect(screen.getByTestId("execution-sheet-table-row-2-target").props.accessibilityLabel).toBe("Série 2, Durée");
    moveAction(2, "moveUp");
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("45 s");
    expect(screen.getByTestId("execution-sheet-table-row-1-pause").props.accessibilityLabel).toBe("Série 1, pause");
  });

  it("INTERACTION/sheet-check-cross — ✓ atomique sans service ; ✕ / retour système restaurent le parent", () => {
    const parent = params();
    const snapshot = JSON.stringify(parent);
    const { onApply, onCancel } = renderSheet(parent);
    tap("execution-sheet-series-increment");
    fireEvent(screen.getByTestId("execution-sheet-modal"), "requestClose");
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(parent)).toBe(snapshot);
    validate();
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(applied(onApply).series).toMatchObject({ count: 4 });
  });

  it("ACCESSIBILITY/sheet-check-cross — mode absent ou cible incomplète : Valider annoncé indisponible ; valeur à renseigner annoncée sur le réglage (aucun message, D-2) ; Annuler reste actif", () => {
    const { onApply, onCancel } = renderSheet(params({ mode: null, series: { kind: "UNIFORM", count: 1, target: unsetTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] } }));
    const validateButton = screen.getByTestId("execution-sheet-validate");
    expect(validateButton.props.accessibilityState).toMatchObject({ disabled: true });
    expect(validateButton.props.accessibilityLabel).toBe("Valider les paramètres, indisponible tant qu’une valeur est invalide");
    validate();
    expect(onApply).not.toHaveBeenCalled();
    // Durée choisie, cible encore vide : pastille signalée et annoncée ; décision D-2 (12/10) :
    // plus de message « Renseignez la durée d’une série. ».
    chooseMode("Durée");
    expect(screen.queryByTestId("execution-sheet-message")).toBeNull();
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("execution-sheet-target").props.accessibilityHint).toBe("Valeur à renseigner");
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

/**
 * Correction revue 1 — régressions de surface (REV-01, REV-02, v13 §6).
 */
describe("ExecutionParametersSheet — correction revue 1", () => {
  it("REV-01 — Durée variable → uniforme → Répétitions → variable : aucune cible réservée réutilisée ; retour en Durée restaure 30/60 ; ✕ annule", () => {
    const { onApply, onCancel } = renderSheet(params({ series: variableRows([[30, 10], [60, 20]]) }));
    chooseRegime("identiques");
    chooseMode("Répétitions");
    chooseRegime("variables");
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("—");
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("—");
    expect(valueOf("execution-sheet-table-row-2-pause")).toBe("20 s");
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    validate();
    expect(onApply).not.toHaveBeenCalled();
    // D-4 : le sélecteur s’est refermé après « Répétitions » ; il est rouvert.
    chooseMode("Durée");
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("30 s");
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("1 min");
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("REV-02 — tableau variable ramené à N=1 : total éditable ET appliqué (inversion), message d'ajustement sous la ligne, Annuler restitue ; ✓ uniforme", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 10], [60, 20]]) }));
    tap("execution-sheet-series-decrement");
    expect(text("execution-sheet-total")).toBe("40 s");
    // [Roue de la Durée de l'exercice — remplacée le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]
    enterExecutionSheetValue("execution-sheet-total", 100);
    // 100 s demandés sur 30 s + 10 s : N=2 → 80 s, N=3 → 120 s, égalité → N le plus grand.
    expect(valueOf("execution-sheet-series")).toBe("3 séries identiques");
    expect(text("execution-sheet-total")).toBe("2 min");
    // PRE-5 story 2.5 (AC4) : déplier la Durée de l'exercice ne retire pas le message.
    showSignals();
    const json = JSON.stringify(screen.toJSON());
    expect(json.indexOf('"execution-sheet-row-total"')).toBeLessThan(json.indexOf('"execution-sheet-adjusted"'));
    expect(json.indexOf('"execution-sheet-adjusted"')).toBeLessThan(json.indexOf('"execution-sheet-row-countdown"'));
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    expect(valueOf("execution-sheet-series")).toBe("1 série identique");
    // [Roue de la Durée de l'exercice — remplacée le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]
    enterExecutionSheetValue("execution-sheet-total", 80);
    expect(valueOf("execution-sheet-series")).toBe("2 séries identiques");
    expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
    validate();
    expect(applied(onApply).series).toEqual({ kind: "UNIFORM", count: 2, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] });
  });

  it("REV-02 — à N=1 depuis un tableau, les réglages affichés modifient la première ligne effective (aucun contrôle sans effet) ; remontée de N restaure la réserve", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 10], [60, 20]]) }));
    moveAction(2, "moveUp");
    tap("execution-sheet-series-decrement");
    expect(text("execution-sheet-target-value")).toBe("1 min");
    expect(valueOf("execution-sheet-pause")).toBe("20 s");
    tap("execution-sheet-pause-increment");
    expect(text("execution-sheet-total")).toBe("1 min 21 s");
    tap("execution-sheet-series-increment");
    expect(valueOf("execution-sheet-table-row-1-pause")).toBe("21 s");
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("30 s");
    validate();
    expect(applied(onApply).series).toEqual(variableRows([[60, 21], [30, 10]]));
  });

  it("v13 §6 — glisser : destination bornée au tableau ; un glisser trop court ne déplace rien", () => {
    expect(dragDestination(0, 20, 42, 3)).toBe(0);
    expect(dragDestination(0, 22, 42, 3)).toBe(1);
    expect(dragDestination(2, -500, 42, 3)).toBe(0);
    expect(dragDestination(0, 500, 42, 3)).toBe(2);
    renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    dragHandle(3, -84);
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("1 min");
    expect(valueOf("execution-sheet-table-row-1-pause")).toBe("30 s");
    dragHandle(1, 10);
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("1 min");
  });

  it("DSF / Q40 — groupe du tableau des séries variables (ligne Séries comprise), sans contour ; repli DSF ; steppers 137/128 ; Répétitions avec bip : total ≈ en lecture seule", () => {
    renderSheet(params({ mode: "REPETITIONS", series: variableRows([[12, 30], [10, 45]]), cadenceBeepIntervalSeconds: 2 }));
    // Q40 (Hermann, 2026-10-17, E-14) remplace le contour 1,5 #5F60EE : aucun contour, à
    // l'ouverture de la Feuille le tableau n'est pas sélectionné (état normal, sans fond).
    const group = StyleSheet.flatten(screen.getByTestId("execution-sheet-variable-group").props.style);
    expect(group.borderWidth).toBeUndefined();
    expect(group.borderColor).toBeUndefined();
    expect(group.backgroundColor).toBeUndefined();
    expect(screen.getByTestId(TABLE_TOGGLE)).toBeTruthy();
    // Story 3.3 : ± à l'appui. Recette du 20/10 (RC-15) : le stepper de N s'ouvre dans l'option
    // sélectionnée du Type de série, à la largeur de son contenu (plus la largeur DSF 137).
    openExecutionSheetField("execution-sheet-series");
    expect(within(screen.getByTestId(SERIES_TYPE)).getByTestId("execution-sheet-series")).toBeTruthy();
    // D-434 : la Pause d'une ligne se saisit au clavier numérique dans sa cellule ; plus de ±
    // révélé sous la ligne (ni sa largeur DSF de tableau, 128). Le focus de la cellule ferme
    // le champ de N dans le même geste.
    expect(screen.getByTestId("execution-sheet-table-row-1-pause-input").props.keyboardType).toBe("number-pad");
    fireEvent(screen.getByTestId("execution-sheet-table-row-1-pause-input"), "focus");
    expect(screen.queryByTestId("execution-sheet-series-field")).toBeNull();
    expect(screen.queryByTestId("execution-sheet-table-row-1-pause-increment")).toBeNull();
    fireEvent(screen.getByTestId("execution-sheet-table-row-1-pause-input"), "blur");
    // PRE-5 story 2.5 (AC4) : le libellé est affiché ; l'annonce regroupée est portée par la valeur.
    // D-433 : le titre ne porte plus ≈ ; le symbole est collé avant la valeur.
    expect(screen.getByText("Durée de l’exercice", anyNode)).toBeTruthy();
    expect(screen.queryByText("Durée de l’exercice ≈", anyNode)).toBeNull();
    // (12 + 10) × 2 s + 30 s + 45 s = 119 s.
    expect(text("execution-sheet-total")).toBe("≈ 1 min 59 s");
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
  });
});

describe("ExecutionParametersSheet — recette 1", () => {
  /**
   * F-01 : sur iPhone, le renderer recycle l'événement du responder et remet
   * `nativeEvent` à null dès la fin du gestionnaire. Toute lecture différée
   * de la position (mise à jour d'état fonctionnelle) levait
   * « Cannot read properties of null (reading 'pageY') » pendant le rendu et
   * affichait l'écran « Impossible d'afficher KODJO ». Ce test reproduit ce
   * recyclage au lieu des objets d'événement durables de fireEvent.
   */
  it("F-01 — glisser avec événements recyclés : aucune erreur, la ligne suit le doigt puis cible et Pause se déplacent ensemble", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15]]) }));
    const handle = () => screen.getByTestId("execution-sheet-table-row-1-handle");
    const recycled = (pageY: number) => ({ nativeEvent: { pageY } as { pageY: number } | null });
    const dispatch = (name: "onResponderGrant" | "onResponderMove" | "onResponderRelease", pageY: number) =>
      act(() => {
        const event = recycled(pageY);
        handle().props[name](event);
        event.nativeEvent = null;
      });

    dispatch("onResponderGrant", 100);
    dispatch("onResponderMove", 150);
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-table-row-1").props.style).transform).toEqual([
      { translateY: 50 },
    ]);
    dispatch("onResponderMove", 184);
    dispatch("onResponderRelease", 184);

    expect(valueOf("execution-sheet-table-row-1-target")).toBe("45 s");
    expect(valueOf("execution-sheet-table-row-3-target")).toBe("30 s");
    expect(valueOf("execution-sheet-table-row-3-pause")).toBe("5 s");
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-table-row-1").props.style).transform).toBeUndefined();
    validate();
    expect(applied(onApply).series).toEqual(variableRows([[45, 10], [60, 15], [30, 5]]));
  });

  it("F-01 — glisser interrompu par le système : ligne remise en place (glissade RC-5), aucun déplacement", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15]]) }));
    const handle = screen.getByTestId("execution-sheet-table-row-1-handle");
    jest.useFakeTimers();
    try {
      act(() => handle.props.onResponderGrant({ nativeEvent: { pageY: 100 } }));
      act(() => handle.props.onResponderMove({ nativeEvent: { pageY: 190 } }));
      act(() => handle.props.onResponderTerminate({ nativeEvent: null }));
      act(() => {
        jest.advanceTimersByTime(TABLE_ROW_DROP_MS + 100);
      });
    } finally {
      jest.useRealTimers();
    }
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-table-row-1").props.style).transform).toBeUndefined();
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("30 s");
  });

  it("F-02 — séries variables modifiées puis Durée → Répétitions → Durée (et inverse) avant ✓ : dernières valeurs restaurées, ✓ conserve l'effectif", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15]]) }));
    const rows = () => [1, 2, 3].map((n) => valueOf(`execution-sheet-table-row-${n}-target`));
    const choose = chooseMode;
    // PRE-4 (story 1.1, AC6) ; depuis Q36 (Hermann, 2026-10-17), la Cible Durée est admise à
    // la seconde (1..3535 s, D-430). PRE-5 story 2.6 : réglée par la roue de la cellule. Le
    // test porte sur la mémoire par Mode.
    chooseCellTarget(1, 35);
    chooseCellTarget(3, 55);
    const durations = rows();
    expect(durations).toEqual(["35 s", "45 s", "55 s"]);
    choose("Répétitions");
    expect(rows()).toEqual(["—", "—", "—"]);
    chooseCellTarget(2, 1);
    const repetitions = rows();
    choose("Durée");
    expect(rows()).toEqual(durations);
    choose("Répétitions");
    expect(rows()).toEqual(repetitions);
    choose("Durée");
    validate();
    expect(applied(onApply).mode).toBe("DURATION");
  });
});

describe("ExecutionParametersSheet — recette 1 (A-05), amendée par Q40", () => {
  // Q40 (Hermann, 2026-10-17, E-14) remplace le cadre fixe X-3 (contour 1,5, fond #F3F3F6) :
  // fond de ligne sélectionnée (#F2F2FF) tant que le tableau déployé est sélectionné ;
  // replié = état normal, sans fond ni contour. Jamais de contour.
  it("A-05 / Q40 — Séries variables actives : fond de sélection seulement tableau déployé et sélectionné ; replié = état normal, état variable et lignes conservés", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15]]) }));
    const group = () => StyleSheet.flatten(screen.getByTestId("execution-sheet-variable-group").props.style) ?? {};
    expect(group().borderWidth).toBeUndefined();
    fireEvent.press(screen.getByTestId(TABLE_TOGGLE));
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    expect(group().borderWidth).toBeUndefined();
    expect(group().backgroundColor).toBeUndefined();
    expect(seriesTypeText()).toBe("Variables");
    fireEvent.press(screen.getByTestId(TABLE_TOGGLE));
    expect(group().borderWidth).toBeUndefined();
    expect(group().backgroundColor).toBe("#F2F2FF");
    validate();
    expect(applied(onApply).series).toEqual(variableRows([[30, 5], [45, 10], [60, 15]]));
  });
});

describe("ExecutionParametersSheet — recette 1 (T-61)", () => {
  it("T-61 — texte agrandi : en-tête à hauteur minimale (jamais fixe) et titre non limité à une ligne", () => {
    renderSheet(params());
    const header = StyleSheet.flatten(screen.getByTestId("execution-sheet-header").props.style);
    expect(header.height).toBeUndefined();
    expect(header.minHeight).toBe(56);
    expect(screen.getByText("Paramètres d’exécution").props.numberOfLines).toBeUndefined();
  });
});

describe("ExecutionParametersSheet — recette 1 (A-01, A-04)", () => {
  it("A-01 — variables replié, Régime identiques puis variables : tableau déployé (état figé 6665:24616), lignes du brouillon restaurées", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15]]) }));
    fireEvent.press(screen.getByTestId(TABLE_TOGGLE));
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    chooseRegime("identiques");
    chooseRegime("variables");
    expect(screen.getByTestId("execution-sheet-table")).toBeTruthy();
    expect(valueOf("execution-sheet-table-row-3-target")).toBe("1 min");
  });

  it("A-04 — voile en fondu sur place (Modal fade, sans translation) ; seule la feuille monte depuis le bas", () => {
    renderSheet(params());
    expect(screen.getByTestId("execution-sheet-modal").props.animationType).toBe("fade");
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-scrim").props.style).transform).toBeUndefined();
    const transform = StyleSheet.flatten(screen.getByTestId("execution-sheet").props.style).transform as { translateY: unknown }[];
    expect(transform).toHaveLength(1);
    expect(transform[0]).toHaveProperty("translateY");
  });
});

describe("ExecutionParametersSheet — décisions du propriétaire (12/10)", () => {
  const { AccessibilityInfo } = jest.requireActual<typeof import("react-native")>("react-native");
  // Valeur simulée pour un seul appel : le simulacre React Native reste intact pour la suite.
  const reduceMotionOnce = (enabled: boolean) =>
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValueOnce(enabled);

  // Q39 (2026-10-17) : le repli n'est plus une animation de hauteur sur le fil JS ; après
  // le cadre (350 ms depuis Q40, 220 ms auparavant), le sélecteur est démonté et sa sortie
  // est jouée par Reanimated (fil UI, voir « PRE4-Q39 », « PRE4-Q40 »). Les échéances
  // vérifiées ici (200 ms : encore affiché ; 600 ms : replié) restent valables.
  it("D-4 / Q39 / Q40, PRE5-2.5/AC1, AC2 — Mode, Changement de côté, Enchainement : segmentés en ligne, la valeur choisie est appliquée tout de suite et reste affichée, sans sélecteur à replier", () =>
    withPlatform("android", async () => {
      jest.useFakeTimers();
      try {
        renderSheet(params());
        // PRE-5 story 2.4 (AC3) : le Mode est un segmenté en ligne, toujours affiché, sans
        // sélecteur à replier : la valeur est appliquée tout de suite et le segmenté reste.
        fireEvent.press(screen.getByTestId("execution-sheet-mode-control-REPETITIONS"));
        expect(modeText()).toBe("Répétitions");
        expect(screen.queryByTestId("execution-sheet-mode-selector")).toBeNull();
        await act(async () => {
          jest.advanceTimersByTime(600);
        });
        expect(screen.getByTestId("execution-sheet-mode-control-REPETITIONS").props.accessibilityState).toMatchObject({ selected: true });

        // PRE-5 story 2.5 (AC1, AC2) : Changement de côté puis Enchainement, segmentés en
        // ligne : plus de sélecteur ni de cadre D-4, la valeur est appliquée et reste affichée.
        chooseSide("Avec");
        expect(sideText()).toBe("Avec");
        expect(screen.queryByTestId("execution-sheet-side-selector")).toBeNull();
        await act(async () => {
          jest.advanceTimersByTime(600);
        });
        expect(screen.getByTestId(SIDE_CONTROL)).toBeTruthy();
        chooseOrder("Les deux côtés à chaque série");
        expect(screen.queryByTestId("execution-sheet-order-selector")).toBeNull();
        await act(async () => {
          jest.advanceTimersByTime(600);
        });
        expect(orderText()).toBe("Les deux côtés à chaque série");
      } finally {
        jest.useRealTimers();
      }
    }));

  it("D-4 / D-7 — « Réduire les animations » : sélecteur refermé sans animation, feuille en place sans montée", () =>
    withPlatform("android", async () => {
      reduceMotionOnce(true);
      renderSheet(params());
      await act(async () => {
        await Promise.resolve();
      });
      // Un rendu relit la valeur animée courante (Animated ne rerend pas de lui-même).
      tap("execution-sheet-beep-increment");
      const transform = StyleSheet.flatten(screen.getByTestId("execution-sheet").props.style).transform as { translateY: number }[];
      expect(transform[0]!.translateY).toBe(0);
      // PRE-5 story 2.4, 2.5 : ni le Mode ni le Changement de côté n'ont plus de sélecteur ;
      // le choix est appliqué immédiatement, sans cadre D-4 à attendre.
      chooseSide("Avec");
      expect(screen.queryByTestId("execution-sheet-side-selector")).toBeNull();
      expect(sideText()).toBe("Avec");
    }));

  it("D-5 — message d’ajustement : Annuler encadré (cadre clair) restaure ; toucher le reste du message le ferme sans annuler", () => {
    const { onApply } = renderSheet(params({ series: { kind: "UNIFORM", count: 1, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
    // Total demandé 1 min 40 s : N=3 retenu, message d’ajustement (même geste que P3-14/inverse-enumeration).
    const adjust = () => {
      // [Roue de la Durée de l'exercice — remplacée le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]
      enterExecutionSheetValue("execution-sheet-total", 100);
    };
    // Annuler encadré : restaure les valeurs précédant l’ajustement (1 série).
    adjust();
    expect(valueOf("execution-sheet-series")).toBe("3 séries identiques");
    // Recette 2 (T-58, 12/10) remplace le cadre blanc de D-5 : capsule sans contour,
    // blanc transparent à 90 %, demi-cercles, marges droite/haut/bas égales.
    const capsule = StyleSheet.flatten(screen.getByTestId("execution-sheet-adjusted-undo").props.style);
    expect(capsule).toMatchObject({ borderRadius: 999, backgroundColor: "rgba(255, 255, 255, 0.1)", minHeight: 36 });
    expect(capsule.borderWidth).toBeUndefined();
    const message = StyleSheet.flatten(screen.getByTestId("execution-sheet-adjusted").props.style);
    expect(message.paddingRight).toBe(message.paddingVertical);
    expect(message.alignItems).toBe("stretch");
    expect(screen.getByTestId("execution-sheet-adjusted").props.accessible).toBe(false);
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
    expect(valueOf("execution-sheet-series")).toBe("1 série identique");
    // Toucher le reste du message : fermé, ajustement conservé (3 séries).
    adjust();
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted"));
    expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
    expect(valueOf("execution-sheet-series")).toBe("3 séries identiques");
    validate();
    expect(applied(onApply).series).toMatchObject({ count: 3 });
  });
});

describe("ExecutionParametersSheet — D-341 / X-1 (12/10)", () => {
  it("D-341, PRE5-2.5/AC1, AC2, RC-6 — Mode sans choix affiché tant que le mode est vide ; Changement de côté en segmenté `inline` (32 de haut ; depuis le 01/11/2026 : Avec de 104 portant « DD… → GG… », Sans de 62) ; notation à la taille standard (12) ; libellés de ligne Regular 12", () =>
    withPlatform("android", () => {
      renderSheet(params({ mode: null, sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE" }));
      // PRE-5 story 2.4 (AC3, UX-DR1) : le Mode est un segmenté en ligne (32 de haut, deux
      // options de 106), sans choix affiché tant que le mode est vide ; libellés Regular 12.
      const mode = screen.getByTestId(MODE_CONTROL);
      expect(screen.queryByTestId(`${MODE_CONTROL}-indicator`)).toBeNull();
      expect(StyleSheet.flatten(mode.props.style)).toMatchObject({ height: 32, width: 220 });
      expect(StyleSheet.flatten(within(mode).getByText("Durée", anyNode).props.style)).toMatchObject({ fontSize: 12, lineHeight: 16, fontWeight: "400" });

      // PRE-5 story 2.5 (AC1) ; RC-6 (Figma `9462:18986`), RC-11 puis RC-12 : Changement de côté
      // Avec / Sans, Avec de 146 et Sans de 62 [remplacé le 01/11/2026 : Avec de 104, Figma `9462:18978` ; 104 + 2 + 62 + 2 × 3 = 174].
      expect(StyleSheet.flatten(screen.getByTestId(`${SIDE_CONTROL}-tile-WITH`, anyNode).props.style)).toMatchObject({ width: 104 });
      const side = screen.getByTestId(SIDE_CONTROL);
      expect(StyleSheet.flatten(side.props.style)).toMatchObject({ height: 32, width: 174 });
      expect(StyleSheet.flatten(screen.getByTestId(`${SIDE_CONTROL}-tile-WITHOUT`, anyNode).props.style)).toMatchObject({ width: 62 });
      expect(StyleSheet.flatten(within(side).getByText("Sans", anyNode).props.style)).toMatchObject({ fontSize: 12, lineHeight: 16, fontWeight: "400" });
      expect(within(side).queryByText(/Droite|Gauche|changement/u, anyNode)).toBeNull();

      // RC-6 : plus de ligne « Enchainement » ; Avec sélectionné porte la notation graphique
      // (police réduite 10, Semi Bold blanc) et le menu, nommé « Enchainement », de valeur neutre.
      expect(screen.queryByText("Enchainement")).toBeNull();
      expect(within(side).queryByText("Avec", anyNode)).toBeNull();
      const order = within(side).getByTestId(ORDER_MENU);
      expect(StyleSheet.flatten(within(order).getByText("DD… → GG…", anyNode).props.style)).toMatchObject({
        fontSize: 12, // ordre de Hermann du 01/11/2026, point 5 : taille standard, sans réduction (10 auparavant)
        fontWeight: "600",
        color: "#FFFFFF",
      });
      expect(order.props.accessibilityLabel).toBe("Enchainement");
      expect(order.props.accessibilityValue).toEqual({ text: "Chaque série d’un côté, puis chaque série de l’autre" });
      expect(screen.getByTestId(`${SIDE_CONTROL}-WITH`).props.accessibilityLabel).toBe("Avec, Chaque série d’un côté, puis chaque série de l’autre");
      // PRE-7 B.3 (B5, arbitrage A3) : ailleurs qu'iOS aussi, le déroulant de l'Enchainement
      // (plus d'`Alert`) : deux notations exactes, nommé « Enchainement », rôle menu.
      const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
      try {
        fireEvent.press(order);
        expect(alert).not.toHaveBeenCalled();
        const menu = within(screen.getByTestId(ORDER_PANEL)).getByTestId(`${ORDER_MENU}-menu`);
        expect(menu.props.accessibilityRole).toBe("menu");
        expect(menu.props.accessibilityLabel).toBe("Enchainement");
        expect(within(menu).getAllByRole("menuitem").map((row) => within(row).getByText(/→/u, anyNode).props.children)).toEqual([
          "DD… → GG…",
          "DG → DG → …",
        ]);
        fireEvent.press(screen.getByTestId(`${ORDER_PANEL}-outside`, anyNode));
      } finally {
        alert.mockRestore();
      }
      // PRE-5 story 2.4 (PR-03) : les titres des lignes passent en Inter Regular 12.
      expect(StyleSheet.flatten(screen.getByText("De chaque côté").props.style)).toMatchObject({ fontSize: 12, fontWeight: "400" });
    }));
});

describe("ExecutionParametersSheet — recette 2 (T-10 / F-02)", () => {
  /**
   * Cause démontrée : le répéteur du stepper était créé au premier appui et
   * gardait les bornes et la valeur de départ de ce mode. Après un appui en
   * Durée, la ligne vide en Répétitions démarrait à « 30 rép. » (durée
   * recyclée) ; désactiver puis réactiver les Séries variables recréait les
   * steppers et masquait le défaut.
   */
  it("F-02 — appui en Durée, puis en Répétitions sur la même ligne : départ à 1 rép. (jamais 30), bornes Répétitions ; retour Durée = dernières durées", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 5], [60, 5]]) }));
    const choose = chooseMode;
    chooseCellTarget(1, 31);
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("31 s");
    choose("Répétitions");
    // D-434 (QD-434-1) : la cellule Répétitions se saisit au clavier ; la cellule vide (jamais
    // 30) affiche « 0 » en saisie, la frappe « 1 » donne 1 rép.
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("—");
    fireEvent(screen.getByTestId("execution-sheet-table-row-1-target-input"), "focus");
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("0");
    typeInExecutionSheetCell("execution-sheet-table-row-1-target", "1");
    fireEvent(screen.getByTestId("execution-sheet-table-row-1-target-input"), "blur");
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("1 rép.");
    chooseCellTarget(1, 2);
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("2 rép.");
    choose("Durée");
    expect([1, 2, 3].map((n) => valueOf(`execution-sheet-table-row-${n}-target`))).toEqual(["31 s", "45 s", "1 min"]);
    choose("Répétitions");
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("2 rép.");
  });
});

describe("ExecutionParametersSheet — recette 2 (T-15)", () => {
  it("T-15 — glisser la Série 1 entre les Séries 3 et 4 : corps de la feuille immobile pendant le geste, repère d’insertion au bon endroit, dépôt à la position visée", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15], [75, 20]]) }));
    const body = () => screen.getByTestId("execution-sheet-body");
    const handle = () => screen.getByTestId("execution-sheet-table-row-1-handle");
    expect(body().props.scrollEnabled).toBe(true);
    act(() => handle().props.onResponderGrant({ nativeEvent: { pageY: 100 } }));
    expect(body().props.scrollEnabled).toBe(false);
    expect(screen.queryAllByTestId(/insertion-guide/, { includeHiddenElements: true })).toHaveLength(0);
    // +2 lignes (84) : destination rang 3, repère avant l’actuelle Série 4 (un seul repère).
    act(() => handle().props.onResponderMove({ nativeEvent: { pageY: 184 } }));
    expect(screen.queryAllByTestId(/insertion-guide/, { includeHiddenElements: true })).toHaveLength(1);
    expect(screen.getByTestId("execution-sheet-table-insertion-guide-before-4", { includeHiddenElements: true })).toBeTruthy();
    act(() => handle().props.onResponderRelease({ nativeEvent: { pageY: 184 } }));
    expect(body().props.scrollEnabled).toBe(true);
    expect(screen.queryAllByTestId(/insertion-guide/, { includeHiddenElements: true })).toHaveLength(0);
    expect([1, 2, 3, 4].map((n) => valueOf(`execution-sheet-table-row-${n}-target`))).toEqual(["45 s", "1 min", "30 s", "1 min 15 s"]);
    expect(valueOf("execution-sheet-table-row-3-pause")).toBe("5 s");
  });

  it("T-15 — geste interrompu par le système : défilement rétabli, aucun repère, aucun déplacement", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15]]) }));
    const handle = screen.getByTestId("execution-sheet-table-row-1-handle");
    act(() => handle.props.onResponderGrant({ nativeEvent: { pageY: 100 } }));
    act(() => handle.props.onResponderMove({ nativeEvent: { pageY: 150 } }));
    act(() => handle.props.onResponderTerminate({ nativeEvent: null }));
    expect(screen.getByTestId("execution-sheet-body").props.scrollEnabled).toBe(true);
    expect(screen.queryAllByTestId(/insertion-guide/, { includeHiddenElements: true })).toHaveLength(0);
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("30 s");
  });
});

describe("ExecutionParametersSheet — recette 3 (T-53), remplacée par la story 3.3", () => {
  // Story 3.3 (FR-04-01) : l'interrupteur « Séries variables » (dont T-53 recentrait le
  // Switch iOS) est retiré ; le Régime est un champ de la ligne « Séries ». La ligne garde
  // son centrage vertical et sa hauteur minimale (Q42) dans les trois états du chevron.
  it("T-53 / PRE4-3.3 — ligne « Séries » centrée, 44 pt : identiques, variables déployé, variables replié", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 2, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
    // PRE-5 story 2.4 ; recette du 20/10 (RC-15) : la ligne « Type de série » porte le nombre de
    // séries ; elle garde le centrage vertical et la hauteur minimale de 44 (Q42).
    const check = () => {
      for (const rowID of ["execution-sheet-row-series-type"]) {
        const row = StyleSheet.flatten(screen.getByTestId(`${rowID}-line`).props.style);
        expect(row).toMatchObject({ flexDirection: "row", alignItems: "center", minHeight: 44 });
      }
      expect(StyleSheet.flatten(screen.getByTestId(SERIES_TYPE).props.style)).toMatchObject({ alignItems: "center" });
    };
    check();
    chooseRegime("variables");
    expect(screen.getByTestId("execution-sheet-table")).toBeTruthy();
    check();
    fireEvent.press(screen.getByTestId(TABLE_TOGGLE));
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    check();
  });
});

/**
 * PRE-4 (story 1.1) — Feuille PRE-3 adaptée au minimum : deux Modes, Cible à
 * l'échec en lecture, Cible à renseigner signalée, validation unique avec
 * ligne de base (AC22 à AC24, H25).
 */
describe("ExecutionParametersSheet — PRE-4 story 1.1", () => {
  const withPhases = <T extends ExecutionParametersInput>(value: T): T => ({ ...value, countdownSeconds: 10, endSeconds: 5 });

  // PRE-5 story 2.4 (AC3, PR-01) : ordre « Répétitions | Durée » ; le segmenté est en ligne.
  it("PRE4-1.1/AC22 — le segmenté du Mode propose exactement Répétitions puis Durée (PR-01), sans option « À l’échec »", () =>
    withPlatform("android", () => {
      renderSheet(params());
      const control = screen.getByTestId(MODE_CONTROL);
      expect(within(control).queryByText("À l’échec", anyNode)).toBeNull();
      const labels = within(control)
        .getAllByText(/^(Durée|Répétitions|À l’échec)$/u, anyNode)
        .map((node) => String(node.props.children));
      expect(labels).toEqual(["Répétitions", "Durée"]);
    }));

  // PRE-5 story 2.4 (AC4, FR-21) remplace la pastille « à l’échec » de la story 3.5 : en
  // identiques, la Condition d'arrêt affiche À l'échec et la ligne de cible est masquée.
  it("PRE4-1.1/AC22 — Cible commune à l’échec : Condition d’arrêt « À l’échec », ligne de cible masquée, Pause visible, ni stepper ni roulette ouverte ; Mode affiché Répétitions", () => {
    renderSheet(withPhases(allFailureParameters(3, 10, { cadenceBeepIntervalSeconds: 2 })));
    expect(modeText()).toBe("Répétitions");
    expect(selectedValue(STOP_CONTROL, ["FAILURE", "TARGET"])).toBe("FAILURE");
    expect(screen.queryByTestId("execution-sheet-row-target")).toBeNull();
    expect(screen.getByTestId("execution-sheet-row-pause")).toBeTruthy();
    expect(screen.queryByTestId("execution-sheet-target-stepper")).toBeNull();
    expect(screen.queryByTestId("execution-sheet-target-wheel")).toBeNull();
    // D-433 : À l'échec en séries identiques — ligne présente, « Non calculable », sans pastille.
    expect(screen.getByTestId("execution-sheet-row-total")).toBeTruthy();
    expect(totalShown()).toBe(TOTAL_NOT_CALCULABLE);
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
  });

  it("PRE4-1.1/AC22 — cellules à l’échec en lecture ; en-têtes Mode et Pause conservés ; N augmenté depuis une dernière ligne à l’échec ajoute une ligne à l’échec de même Pause ; changer de Mode conserve les Cibles à l’échec", () => {
    const { onApply } = renderSheet(
      withPhases(variableParameters({ mode: "REPETITIONS", rows: [["FAILURE", 10], ["FAILURE", 20]] })),
    );
    const table = screen.getByTestId("execution-sheet-table");
    expect(within(table).getByText("Répétitions")).toBeTruthy();
    expect(within(table).getByText("Pause")).toBeTruthy();
    // Story 3.6 (Q13) : la cellule affiche « à l’échec » ; PRE-5 story 2.6 (AD-27) : sans ± ;
    // D-434 : cellules au clavier numérique.
    for (const row of [1, 2]) {
      expect(valueOf(`execution-sheet-table-row-${row}-target`)).toBe("à l’échec");
      expect(screen.queryByTestId(`execution-sheet-table-row-${row}-target-increment`)).toBeNull();
      expect(screen.queryByTestId(`execution-sheet-table-row-${row}-target-decrement`)).toBeNull();
      expect(screen.getByTestId(`execution-sheet-table-row-${row}-pause-input`).props.keyboardType).toBe("number-pad");
    }
    tap("execution-sheet-series-increment");
    expect(valueOf("execution-sheet-table-row-3-target")).toBe("à l’échec");
    expect(valueOf("execution-sheet-table-row-3-pause")).toBe("20 s");

    chooseMode("Durée");
    expect(within(screen.getByTestId("execution-sheet-table")).getByText("Durée")).toBeTruthy();
    for (const row of [1, 2, 3]) {
      expect(valueOf(`execution-sheet-table-row-${row}-target`)).toBe("à l’échec");
    }
    validate();
    expect(applied(onApply)).toMatchObject({
      mode: "DURATION",
      series: {
        kind: "VARIABLE",
        rows: [
          { target: { kind: "FAILURE" }, pauseSeconds: 10, loadKg: 0 },
          { target: { kind: "FAILURE" }, pauseSeconds: 20, loadKg: 0 },
          { target: { kind: "FAILURE" }, pauseSeconds: 20, loadKg: 0 },
        ],
      },
    });
  });

  it("PRE4-1.1/AC23 — Cible à renseigner héritée : « — » signalée « Valeur à renseigner », ✓ indisponible, jamais convertie en échec", () => {
    const inherited = withPhases(durationParameters("UNSET", 3, 10));
    const { onApply } = renderSheet(inherited, 10, inherited);
    expect(text("execution-sheet-target-value")).toBe("—");
    expect(screen.getByTestId("execution-sheet-target").props.accessibilityHint).toBe("Valeur à renseigner");
    expect(screen.queryByTestId("execution-sheet-target-failure")).toBeNull();
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    validate();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("PRE4-1.1/AC24 — ligne de base Durée 5999 s : ✓ disponible sans toucher la Cible, Cible appliquée 5999 s ; en création la même valeur est refusée", () => {
    const historic = withPhases(durationParameters(5999, 3, 10));
    const view = renderSheetView(historic, 10, historic);
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: false });
    validate();
    expect(view.onApply.mock.calls[0]![0].series).toEqual({ kind: "UNIFORM", count: 3, target: numberTarget(5999), pauseSeconds: 10, loadKg: 0, workPhases: [] });
    view.unmount();

    renderSheet(historic);
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
  });

  // Q36 (Hermann, 2026-10-17) et D-430 : 4 s est désormais admise (minimum 1 s) ; 3536 s reste au-dessus de la borne.
  it("PRE4-1.1/AC24 — valeur hors bornes (3536 s) signalée « Valeur non admise » (jamais « à renseigner »), ✓ indisponible au suffixe neutre", () => {
    renderSheet(withPhases(durationParameters(3536, 3, 10)));
    expect(screen.getByTestId("execution-sheet-target").props.accessibilityHint).toBe("Valeur non admise");
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityLabel).toBe(
      "Valider les paramètres, indisponible tant qu’une valeur est invalide",
    );
  });

  it("PRE4-1.1/AC22 — une Cible à l’échec est nommée pour l’accessibilité (champ ou « Série n », puis « à l’échec »)", () => {
    const view = renderSheetView(withPhases(allFailureParameters(3, 10)));
    // PRE-5 story 2.4 (AC4) : en identiques, l'échec est annoncé par l'option sélectionnée
    // de la Condition d'arrêt (la ligne de cible est masquée).
    const failure = screen.getByTestId(`${STOP_CONTROL}-FAILURE`);
    expect(failure.props.accessibilityLabel).toBe("À l’échec");
    expect(failure.props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId(STOP_CONTROL).props.accessibilityLabel).toBe("Condition d’arrêt");
    view.unmount();
    renderSheet(withPhases(variableParameters({ mode: "REPETITIONS", rows: [["FAILURE", 10], [12, 20]] })));
    // Story 3.6 (AC13) : la cellule est nommée par sa ligne et sa colonne ; sa valeur annonce « à l’échec ».
    const failureCell = screen.getByTestId("execution-sheet-table-row-1-target");
    expect(failureCell.props.accessibilityLabel).toBe("Série 1, Répétitions");
    expect(failureCell.props.accessibilityValue).toEqual({ text: "à l’échec" });
    expect(screen.getByTestId("execution-sheet-table-row-2-target")).toBeTruthy();
  });

  it("PRE4-1.1/AC24 — ligne de base Bip 11 : une Pause modifiée laisse ✓ disponible et le Bip appliqué vaut 11", () => {
    const historic = params({ cadenceBeepIntervalSeconds: 11 });
    const { onApply } = renderSheet(historic, 10, historic);
    tap("execution-sheet-pause-increment");
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: false });
    validate();
    expect(applied(onApply)).toMatchObject({
      cadenceBeepIntervalSeconds: 11,
      series: { kind: "UNIFORM", count: 3, target: numberTarget(90), pauseSeconds: 16, loadKg: 0, workPhases: [] },
    });
  });
});

describe("ExecutionParametersSheet — PRE-4 story 2.1", () => {
  // Story 3.7 (AC1, FR-14-01) : le mélange calculable n'est plus masqué mais affiché en
  // `≥` (voir `PRE4-3.7/AC1`) ; ce test garde le tout échec et la Cible à renseigner.
  // D-433 : la ligne n'est plus masquée ; tableau variable entièrement à l'échec (en attente
  // d'arbitrage) et Cible à renseigner affichent « — » (données manquantes), jamais « 0 s ».
  it("PRE4-2.1/AC9, D-433 — ligne Durée de l’exercice « — » (données manquantes) pour un tableau variable tout échec et une Cible à renseigner : ni « 0 s » ni ≥ (mélange : story 3.7)", () => {
    for (const parent of [
      variableParameters({ rows: [["FAILURE", 10], ["FAILURE", 10]] }),
      durationParameters("UNSET", 3, 10),
      variableParameters({ rows: [[30, 10], ["UNSET", 10], [45, 10]] }),
    ]) {
      const view = renderSheetView(parent);
      expect(screen.getByTestId("execution-sheet-row-total")).toBeTruthy();
      expect(totalShown()).toBe("—");
      expect(totalSpoken()).toBe(TOTAL_MISSING_SPOKEN);
      expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
      expect(screen.queryAllByText("0 s")).toHaveLength(0);
      expect(screen.queryAllByText(/≥/u)).toHaveLength(0);
      view.unmount();
    }
    // Contrôle : un total exact reste affiché.
    renderSheet(durationParameters(30, 3, 10));
    expect(screen.getByTestId("execution-sheet-row-total")).toBeTruthy();
  });

  // Q36 (Hermann, 2026-10-17) et D-430 : la saisie invalide est 3536 s, au-dessus de la borne (4 s est admise).
  it("PRE4-2.1/AC9 — autre saisie invalide (Cible Durée hors bornes, 3536 s) : comportement existant conservé, ligne présente avec « — »", () => {
    renderSheet(durationParameters(3536, 3, 10));
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("execution-sheet-row-total")).toBeTruthy();
    expect(screen.getByTestId("execution-sheet-total-text").props.children).toBe("—");
  });
});

/**
 * PRE-4 story 3.1 (S0, AD-7, NFR-02, NFR-03) — prototype de popovers natifs sur
 * iOS : ligne `Mode d’exécution` et Cible commune en Durée. Jest n'exerce que la
 * couche JS (simulacres jest-expo des vues `@expo/ui`) : ni l'ancrage, ni le
 * geste, ni l'haptique réels, jugés sur iPhone (R-3.1-00 à 03, NFR-04).
 *
 * PRE-5 story 2.4 (AC3, AD-27) : le popover natif du Mode est retiré (segmenté en ligne) ;
 * les tests du popover sont révisés par conception, ceux de la roue sont conservés.
 */
describe("ExecutionParametersSheet — PRE-4 story 3.1", () => {
  type Instance = ReturnType<typeof screen.getByTestId>;
  /**
   * Éléments tactiles React Native (`Pressable` ou tout autre responder) rendus sous
   * `ancestor`, par leur `testID` : critère plus large qu'un type de composant, il
   * attrape aussi une substitution par `TouchableOpacity` ou un voile tactile.
   */
  const touchablesUnder = (ancestor: Instance) =>
    ancestor
      .findAll((node) => typeof node.type === "string" && typeof node.props.onResponderGrant === "function")
      .map((node) => node.props.testID as string);
  const scrollViewsUnder = (ancestor: Instance) =>
    ancestor.findAll((node) => typeof node.type === "string" && /ScrollView/.test(node.type));

  /**
   * PRE-5 story 2.4 (AC3, AD-27) — révisé par conception : le popover natif du Mode de la
   * story 3.1 (`NativeRowPopover`) est retiré ; le Mode est un segmenté en ligne. Ce qui
   * était prouvé reste prouvé : aucune Modal, aucun Pressable de substitution, aucun
   * ScrollView, exactement deux options, choix appliqué au Brouillon seulement. Désormais
   * aucun Popover ni Host SwiftUI n'est rendu dans la Feuille.
   */
  it("PRE4-3.1/AC6, PRE5-2.4/AC3 — iOS : Mode en segmenté en ligne dans sa ligne, sans Popover, Host SwiftUI ni Modal ; exactement Répétitions puis Durée ; choix appliqué au Brouillon seulement", () =>
    withPlatform("ios", () => {
      const onApply = jest.fn<(value: ExecutionParameters) => void>();
      const view = render(
        <TestSafeAreaProvider>
          <ExecutionParametersSheet parent={params()} profileSideRecoverySecondsDefault={10} onApply={onApply} onCancel={jest.fn()} />
        </TestSafeAreaProvider>,
      );
      expect(view.UNSAFE_root.findAllByType(Popover)).toHaveLength(0);
      expect(screen.queryByTestId("execution-sheet-mode-host")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-mode-value")).toBeNull();
      expect(view.UNSAFE_root.findAllByType(Modal)).toHaveLength(1);
      const control = within(screen.getByTestId("execution-sheet-row-mode")).getByTestId(MODE_CONTROL);
      expect(scrollViewsUnder(control)).toHaveLength(0);
      // Seules les deux options sont tactiles, dans l'ordre PR-01 (aucune option « échec »).
      expect(touchablesUnder(control)).toEqual([`${MODE_CONTROL}-REPETITIONS`, `${MODE_CONTROL}-DURATION`]);
      expect(screen.getByTestId(`${MODE_CONTROL}-REPETITIONS`).props.accessibilityLabel).toBe("Répétitions");
      expect(screen.getByTestId(`${MODE_CONTROL}-DURATION`).props.accessibilityLabel).toBe("Durée");

      fireEvent.press(screen.getByTestId(`${MODE_CONTROL}-REPETITIONS`));
      expect(modeText()).toBe("Répétitions");
      expect(view.UNSAFE_root.findAllByType(Modal)).toHaveLength(1);
      expect(onApply).not.toHaveBeenCalled();
    }));

  it("PRE4-3.1/AC2, PRE5-2.4/AC3 — iOS : seule l’option du Mode affiché est sélectionnée ; la sélection suit un changement de Mode", () =>
    withPlatform("ios", () => {
      renderSheet(params());
      const states = () =>
        ["REPETITIONS", "DURATION"].map((mode) => screen.getByTestId(`${MODE_CONTROL}-${mode}`).props.accessibilityState.selected);
      expect(states()).toEqual([false, true]);
      chooseMode("Répétitions");
      expect(modeText()).toBe("Répétitions");
      expect(states()).toEqual([true, false]);
    }));

  it("PRE4-3.1/AC2, PRE5-2.4 — iOS : Mode non renseigné : aucune option sélectionnée, aucun cadre ; Condition d’arrêt « À l’objectif »", () =>
    withPlatform("ios", () => {
      renderSheet(params({ mode: null, series: { kind: "UNIFORM", count: 1, target: unsetTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] } }));
      expect(selectedValue(MODE_CONTROL, ["REPETITIONS", "DURATION"])).toBeNull();
      expect(screen.queryByTestId(`${MODE_CONTROL}-indicator`)).toBeNull();
      expect(selectedValue(STOP_CONTROL, ["FAILURE", "TARGET"])).toBe("TARGET");
    }));

  /**
   * PRE-5 story 2.4 — choisir le Mode range la surface ouverte et la Feuille reste tactile ;
   * re-choisir le Mode affiché ne change rien. [Champ ± de la Cadence et roue de la Cible — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier :
   * champ clavier de la Cadence (révélé par Autre) et champ clavier de la Cible.]
   */
  it("PRE4-3.1/AC3, PRE5-2.4 — iOS : choix du Mode avec un champ clavier ouvert : appliqué, champ rangé ; Feuille de nouveau tactile", () =>
    withPlatform("ios", () => {
      renderSheet(params());
      openExecutionSheetField("execution-sheet-beep");
      expect(screen.getByTestId("execution-sheet-beep", anyNode).props.accessibilityState).toMatchObject({ selected: true });
      fireEvent.press(screen.getByTestId(`${MODE_CONTROL}-DURATION`));
      expect(modeText()).toBe("Durée");
      expect(screen.queryByTestId("execution-sheet-beep-input", anyNode)).toBeNull();
      // Feuille tactile : un autre champ prend la saisie.
      openExecutionSheetField("execution-sheet-target");
      expect(screen.getByTestId("execution-sheet-target").props.accessibilityState).toMatchObject({ selected: true });
      closeExecutionSheetField("execution-sheet-target");
      expect(text("execution-sheet-target-value")).toBe("1 min 30 s");
    }));

  /**
   * [Q41 : roue de « Durée d'une série » dans un panneau sans flèche (`AnchoredPanel`) — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier.]
   * La Cible commune se saisit dans sa pastille, dans la ligne, sans panneau, Popover ni Modal
   * supplémentaire ; la saisie est appliquée au Brouillon de la Feuille à la sortie du champ.
   */
  it("PRE4-Q41 — iOS : la Cible commune se saisit au clavier dans sa pastille, sans panneau, Popover ni Modal supplémentaire ; appliquée au Brouillon de la Feuille seulement", () =>
    withPlatform("ios", () => {
      const onApply = jest.fn<(value: ExecutionParameters) => void>();
      const view = render(
        <TestSafeAreaProvider>
          <ExecutionParametersSheet parent={params()} profileSideRecoverySecondsDefault={10} onApply={onApply} onCancel={jest.fn()} />
        </TestSafeAreaProvider>,
      );
      expect(within(screen.getByTestId("execution-sheet-row-target")).getByTestId("execution-sheet-target")).toBeTruthy();
      openExecutionSheetField("execution-sheet-target");
      expect(screen.queryByTestId("execution-sheet-target-panel", anyNode)).toBeNull();
      expect(screen.queryByTestId("duration-wheel-picker", anyNode)).toBeNull();
      expect(view.UNSAFE_root.findAllByType(Popover)).toHaveLength(0);
      expect(view.UNSAFE_root.findAllByType(Modal)).toHaveLength(1);
      typeInExecutionSheetCell("execution-sheet-target", "215");
      closeExecutionSheetField("execution-sheet-target");
      expect(text("execution-sheet-target-value")).toBe("2 min 15 s");
      expect(onApply).not.toHaveBeenCalled();
      validate();
      expect(applied(onApply).series).toMatchObject({ kind: "UNIFORM", target: { kind: "NUMBER", value: 135 } });
    }));

  it("PRE4-3.1/AC4 — iOS : aucun popover de Cible commune en Répétitions ni en séries variables (hors prototype)", () =>
    withPlatform("ios", () => {
      const view = renderSheetView(params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
      expect(screen.queryByTestId("execution-sheet-target-host")).toBeNull();
      // Story 3.5 : la pastille remplace le stepper ; elle ouvre un panneau, jamais un popover.
      expect(screen.queryByTestId("execution-sheet-target-stepper")).toBeNull();
      expect(screen.getByTestId("execution-sheet-target-value")).toBeTruthy();
      view.unmount();
      renderSheet(params({ series: variableRows([[30, 10], [45, 20]]) }));
      expect(screen.queryByTestId("execution-sheet-target-host")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-target-value")).toBeNull();
    }));

  it("PRE4-3.1/AC4 — iOS : la pastille, hors de tout Popover (Q37), garde l’indicateur d’invalidité", () =>
    withPlatform("ios", () => {
      renderSheet(params({ series: { kind: "UNIFORM", count: 1, target: unsetTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] } }));
      // Décision du 06/11/2026 (constat c) : la pastille est le champ clavier `execution-sheet-target`.
      const pill = screen.getByTestId("execution-sheet-target");
      expect(screen.queryByTestId("execution-sheet-target-host-popover")).toBeNull();
      expect(within(screen.getByTestId("execution-sheet-row-target")).getByTestId("execution-sheet-target")).toBe(pill);
      expect(pill.props.accessibilityHint).toBe("Valeur à renseigner");
      // Q35 : fond rouge léger, sans liseré.
      const pillStyle = StyleSheet.flatten(pill.props.style);
      expect(pillStyle.backgroundColor).toBe("#FFF1F0");
      expect(pillStyle.borderColor).toBeUndefined();
      expect(text("execution-sheet-target-value")).toBe("—");
    }));

  // PRE-5 story 2.4 (AC3) : le test « pastille hors de Popover.Trigger, ancre transparente »
  // de la story 3.1 est retiré avec le popover du Mode ; l'absence de tout Popover et de tout
  // Host SwiftUI est prouvée par « PRE4-3.1/AC6, PRE5-2.4/AC3 ».

  // [PRE4-Q41 — géométrie du panneau de la roue de la Cible commune : supprimé, remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier.]

  // [Roulette Legacy en ligne (Android) — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : même champ clavier sur toutes les plates-formes.]
  it("PRE4-3.1/AC6 — parité Android : aucun Popover ; segmenté du Mode en ligne ; Cible commune au clavier dans sa ligne", () =>
    withPlatform("android", () => {
      renderSheet(params());
      expect(screen.queryByTestId("execution-sheet-mode-host")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-target-host")).toBeNull();
      expect(within(screen.getByTestId("execution-sheet-row-mode")).getByTestId(MODE_CONTROL)).toBeTruthy();
      expect(screen.queryAllByTestId(/^execution-sheet-mode-option-/)).toHaveLength(0);
      openExecutionSheetField("execution-sheet-target");
      expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-target-wheel")).toBeNull();
      expect(within(screen.getByTestId("execution-sheet-row-target")).getByTestId("execution-sheet-target")).toBeTruthy();
    }));
});

/**
 * PRE-4 Q39 (Hermann, 2026-10-17, recette iPhone, E-13 ; NFR-10) — apparitions et
 * disparitions fluides : les conteneurs qui entrent, sortent ou changent de place
 * portent les animations de mise en page de Reanimated (fil UI). Le simulacre officiel
 * de Reanimated (`jest.setup.js`) laisse ces props sur la vue hôte. Limite : Jest ne
 * joue aucune animation ; la fluidité réelle se juge sur iPhone.
 */
describe("ExecutionParametersSheet — PRE-4 Q39 (animations de mise en page)", () => {
  const { AccessibilityInfo } = jest.requireActual<typeof import("react-native")>("react-native");
  const reduceMotionOnce = (enabled: boolean) =>
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValueOnce(enabled);
  const motionOf = (testID: string) => {
    const props = screen.getByTestId(testID).props as { entering?: unknown; exiting?: unknown; layout?: unknown };
    return { entering: props.entering, exiting: props.exiting, layout: props.layout };
  };
  const animated = (testID: string) => {
    const motion = motionOf(testID);
    expect(motion.entering).toBeDefined();
    expect(motion.exiting).toBeDefined();
    expect(motion.layout).toBeDefined();
  };
  const bilateralVariable = () =>
    params({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE", series: variableRows([[30, 5], [45, 10]]) });

  // PRE-5 story 2.5 : le Changement de côté n'a plus de sélecteur ; le ± de la Cadence,
  // révélé sous sa ligne par Autre, porte les mêmes animations.
  it("PRE4-Q39 — lignes, ± révélé, tableau et lignes du tableau : entrée, sortie et transition de place", () =>
    withPlatform("android", () => {
    renderSheet(bilateralVariable());
    fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`));
    // Décision du 06/11/2026 : Autre révèle le champ clavier de la Cadence et lui donne le focus (simulé).
    fireEvent(screen.getByTestId("execution-sheet-beep-input", anyNode), "focus");
    animated("execution-sheet-beep-motion");
    animated("execution-sheet-row-side-recovery");
    animated("execution-sheet-row-side");
    // E-20 (2026-10-18) : le tableau n'a plus de révélation propre à l'apparition — le groupe
    // le découpe et le révèle en s'agrandissant (une seule animation) ; sortie et place gardées.
    expect(motionOf("execution-sheet-table").entering).toBeUndefined();
    expect(motionOf("execution-sheet-table").exiting).toBeDefined();
    expect(motionOf("execution-sheet-table").layout).toBeDefined();
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-variable-group").props.style).overflow).toBe("hidden");
    // Lignes du tableau : entrée / sortie, et (recette du 19/10, RC-5) transition de place
    // propre aux lignes, position seule, pour que les autres lignes se décalent à la dépose.
    const row = motionOf("execution-sheet-table-row-2-motion");
    expect(row.entering).toBeDefined();
    expect(row.exiting).toBeDefined();
    expect(row.layout).toBe(rowShiftLayout);
    // N 2 → 3 : la nouvelle ligne du tableau entre (Q41 : révélée par le bas, sans fondu).
    // Le champ de la Cadence se range quand celui de N prend la saisie (T20 ; [± — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]).
    tap("execution-sheet-series-increment");
    expect(screen.queryByTestId("execution-sheet-beep-motion")).toBeNull();
    expect(motionOf("execution-sheet-table-row-3-motion").entering).toBeDefined();
    // Surface, corps, cadres (PRE-5 story 2.4 : quatre cadres au lieu du groupe unique) et
    // groupe du tableau : transition de place seule (aucune entrée à l'ouverture).
    for (const testID of [
      "execution-sheet-surface",
      "execution-sheet-body",
      "execution-sheet-frame-execution",
      "execution-sheet-frame-series",
      "execution-sheet-frame-sides",
      "execution-sheet-frame-cadence",
      "execution-sheet-variable-group",
    ]) {
      expect(motionOf(testID).layout).toBeDefined();
      expect(motionOf(testID).entering).toBeUndefined();
    }
  }));

  it("PRE4-Q39 — Cible commune et Durée totale (champ clavier) : entrée, sortie et transition de place", () =>
    withPlatform("android", () => {
      renderSheet(params());
      animated("execution-sheet-row-target");
      animated("execution-sheet-row-total");
      // [Roulette de la Durée totale en ligne (T10 : premier appui qui la ferme sans appliquer) —
      // remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : le champ clavier ouvert n'absorbe pas le choix, appliqué d'un seul geste.]
      openExecutionSheetField("execution-sheet-total");
      expect(screen.queryByTestId("execution-sheet-total-wheel")).toBeNull();
      // PRE-5 story 2.4 (AC3) : le Mode n'a plus de sélecteur en ligne ; son segmenté reste
      // affiché. La ligne de cible masquée à l'échec (FR-21) sort et rentre avec ses animations.
      expect(screen.queryByTestId("execution-sheet-mode-selector")).toBeNull();
      fireEvent.press(screen.getByTestId(`${STOP_CONTROL}-FAILURE`));
      expect(screen.queryByTestId("execution-sheet-row-target")).toBeNull();
      fireEvent.press(screen.getByTestId(`${STOP_CONTROL}-TARGET`));
      animated("execution-sheet-row-target");
    }));

  // Q41 : sélecteur en ligne vérifié sur Android (panneau sur iOS, voir « PRE4-Q41 »).
  it("PRE4-Q39 — « Réduire les animations » (NFR-10) : aucune animation de mise en page, changement immédiat", () =>
    withPlatform("android", async () => {
    reduceMotionOnce(true);
    renderSheet(bilateralVariable());
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`));
    for (const testID of [
      "execution-sheet-beep-motion",
      "execution-sheet-beep-motion-content",
      "execution-sheet-row-side-recovery",
      "execution-sheet-row-side-recovery-content",
      "execution-sheet-table",
      "execution-sheet-table-row-1-motion",
      "execution-sheet-surface",
      "execution-sheet-body",
      "execution-sheet-frame-execution",
      "execution-sheet-frame-series",
      "execution-sheet-frame-sides",
      "execution-sheet-frame-cadence",
    ]) {
      expect(motionOf(testID)).toEqual({ entering: undefined, exiting: undefined, layout: undefined });
    }
    // Sans : Enchainement et Pause entre les côtés retirés immédiatement.
    chooseSide("Sans");
    expect(screen.queryByTestId(ORDER_MENU)).toBeNull();
    expect(screen.queryByTestId("execution-sheet-row-side-recovery")).toBeNull();
  }));

  // PRE-5 story 2.5 (AC1 à AC4) : `ClosingSelector` est retiré avec les derniers sélecteurs
  // à cadre D-4 (Changement de côté, Ordre). Les lignes et le ± révélés par les segmentés et
  // les chevrons entrent et sortent par le bas, sans fondu.
  it("PRE4-Q39 / Q41, PRE5-2.5, RC-6 — Cadence (± révélé), Pause entre les côtés (sous Avec), Compte à rebours et Fin (chevron de Durée de l'exercice) : entrée et sortie par le bas, sans fondu", () =>
    withPlatform("android", () => {
    renderSheet(params({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 10 }));
    fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`));
    expect(motionOf("execution-sheet-beep-motion")).toMatchObject({ entering: revealClipEntering, exiting: revealClipExiting });
    expect(motionOf("execution-sheet-beep-motion-content")).toMatchObject({ entering: revealContentEntering, exiting: revealContentExiting });
    // [Second appui sur Autre qui range le ± — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : le champ se range à sa sortie.]
    fireEvent(screen.getByTestId("execution-sheet-beep-input", anyNode), "focus");
    closeExecutionSheetField("execution-sheet-beep");
    expect(screen.queryByTestId("execution-sheet-beep-motion")).toBeNull();
    for (const testID of ["execution-sheet-row-side-recovery"]) {
      expect(motionOf(testID)).toMatchObject({ entering: revealClipEntering, exiting: revealClipExiting });
    }
    showSignals();
    for (const testID of ["execution-sheet-row-countdown", "execution-sheet-row-end"]) {
      expect(motionOf(testID)).toMatchObject({ entering: revealClipEntering, exiting: revealClipExiting });
    }
  }));
});

/**
 * PRE-4 Q40 (Hermann, 2026-10-17, recette iPhone, E-14 ; amende Q39) — animations plus
 * lentes (350 ms) et « par le bas » ; liseré foncé retiré des lignes sélectionnées ;
 * tableau des séries variables sélectionné (fond d'une ligne sélectionnée) quand Hermann
 * l'ouvre ou agit dedans, rendu à l'état normal dès qu'un autre champ est sélectionné.
 * Limite : Jest ne joue aucune animation ; vitesse, sens et simultanéité du fondu et de
 * la fermeture de l'espace se jugent sur iPhone.
 */
describe("ExecutionParametersSheet — PRE-4 Q40 (vitesse, sens, sélection)", () => {
  const SELECTED_SURFACE = "#F2F2FF";
  const styleOf = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style) ?? {};
  const motionOf = (testID: string) => {
    const props = screen.getByTestId(testID).props as { entering?: unknown; exiting?: unknown; layout?: unknown };
    return { entering: props.entering, exiting: props.exiting, layout: props.layout };
  };

  it("PRE4-Q40 — durées : entrée, sortie, transition de place et repli des sélecteurs à 350 ms", () => {
    expect(SHEET_MOTION_MS).toBe(350);
    expect(SELECTOR_SETTLE_MS).toBe(350);
  });

  // Q41 (Hermann, 2026-10-17, E-15) remplace le test Q40 « entrée par le bas en fondu
  // simultané ; sortie vers le bas en fondu simultané » : le fondu est supprimé ; l'entrée et
  // la sortie se font par le bas, révélées par le cadre de découpe (voir « PRE4-Q41 »).
  it("PRE4-Q41 (remplace Q40, sens) — entrée par le bas, sortie vers le bas, sans aucune opacité", () => {
    const entering = { targetHeight: 42, targetWidth: 330, targetOriginX: 0, targetOriginY: 0, targetBorderRadius: 0, targetGlobalOriginX: 0, targetGlobalOriginY: 0, windowWidth: 402, windowHeight: 874 };
    const exiting = { currentHeight: 42, currentWidth: 330, currentOriginX: 0, currentOriginY: 0, currentBorderRadius: 0, currentGlobalOriginX: 0, currentGlobalOriginY: 0, windowWidth: 402, windowHeight: 874 };
    const contentIn = revealContentEntering(entering);
    const contentOut = revealContentExiting(exiting);
    expect(contentIn.initialValues).toEqual({ transform: [{ translateY: 42 }] });
    expect(contentIn.animations).toEqual({ transform: [{ translateY: 0 }] });
    expect(contentOut.initialValues).toEqual({ transform: [{ translateY: 0 }] });
    expect(contentOut.animations).toEqual({ transform: [{ translateY: 42 }] });
    for (const animation of [contentIn, contentOut, revealClipEntering(entering), revealClipExiting(exiting)]) {
      expect(JSON.stringify(animation)).not.toContain("opacity");
    }
    // Les animations restent portées par les lignes qui entrent et sortent.
    renderSheet(params({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE" }));
    for (const testID of ["execution-sheet-row-side-recovery"]) {
      expect(motionOf(testID).entering).toBe(revealClipEntering);
      expect(motionOf(testID).exiting).toBe(revealClipExiting);
      expect(motionOf(testID).layout).toBeDefined();
    }
  });

  // Q41 (E-15) : le fond de sélection est un calque absolu (`-selection`) ; la ligne
  // (`-line`) garde son style, sans marge ni padding de sélection. Sélecteurs en ligne :
  // Android (panneaux sur iOS, voir « PRE4-Q41 »).
  it("PRE4-Q40 / Q41, PRE5-2.5 — lignes sélectionnées (Cadence au ± ouvert, Durée de l'exercice) : fond de sélection, rayon 12, sans liseré ; aucun texte ne bouge ; Mode, Changement de côté et Enchainement en ligne jamais surlignés", () =>
    withPlatform("android", () => {
    renderSheet(params({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE" }));
    const checkSelected = (testID: string) => {
      const background = styleOf(`${testID}-selection`);
      expect(background.backgroundColor).toBe(SELECTED_SURFACE);
      expect(background.borderRadius).toBe(12);
      expect(background.borderWidth).toBeUndefined();
      expect(background.borderColor).toBeUndefined();
      // Calque absolu débordant de 12 de chaque côté : le contenu reste exactement à sa place.
      expect(background).toMatchObject({ position: "absolute", top: 0, bottom: 0, left: -12, right: -12 });
      const line = styleOf(`${testID}-line`);
      expect(line.backgroundColor).toBeUndefined();
      expect(line.marginHorizontal).toBeUndefined();
      expect(line.paddingHorizontal).toBeUndefined();
    };
    // PRE-5 story 2.5 (AC1, AC2) ; RC-6 : le segmenté du Changement de côté et le menu de
    // l'Enchainement n'ouvrent aucune surface de la Feuille ; la ligne n'est jamais surlignée.
    chooseOrder("Les deux côtés à chaque série");
    expect(styleOf("execution-sheet-row-side-selection").backgroundColor).toBeUndefined();
    // AC3 : Autre révèle le champ (± — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier) sous la ligne Cadence, désignée par le fond de sélection.
    fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`));
    fireEvent(screen.getByTestId("execution-sheet-beep-input", anyNode), "focus");
    checkSelected("execution-sheet-row-beep");
    // Toucher la Durée de l'exercice range le champ de la Cadence et ouvre sa saisie d'un seul geste.
    openExecutionSheetField("execution-sheet-total");
    expect(styleOf("execution-sheet-row-beep-selection").backgroundColor).toBeUndefined();
    checkSelected("execution-sheet-row-total");
    // PRE-5 story 2.4 (AC3) : le Mode n'ouvre aucune surface ; le choisir ferme la saisie
    // ouverte et sa ligne n'est jamais surlignée (re-choisir le Mode affiché : Brouillon inchangé).
    chooseMode("Durée");
    expect(styleOf("execution-sheet-row-total-selection").backgroundColor).toBeUndefined();
    expect(styleOf("execution-sheet-row-mode-selection").backgroundColor).toBeUndefined();
  }));

  // Q41 : sur iOS, un panneau ouvert est modal (toucher extérieur = fermeture) ; cet
  // enchaînement de sélections se vérifie avec les sélecteurs en ligne, sur Android (sur
  // iOS : « PRE4-Q41 — sélection unique »).
  it("PRE4-Q40 — tableau : sélectionné à l'ouverture (passage du Type de série à Variables, chevron) et après une action dedans ; état normal après sélection d'un champ hors tableau (segmenté du Mode, ± de N, ± du Bip) ou au repli", () =>
    withPlatform("android", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15]]) }));
    // PRE-5 story 2.5 (AC4) : Compte à rebours, utilisé plus bas, est replié sous la Durée de
    // l'exercice ; il est déplié avant toute vérification de la sélection.
    showSignals();
    const group = () => styleOf("execution-sheet-variable-group");
    const expectSelected = () => {
      expect(group().backgroundColor).toBe(SELECTED_SURFACE);
      expect(group().borderWidth).toBeUndefined();
      expect(group().borderColor).toBeUndefined();
    };
    const expectNormal = () => {
      expect(group().backgroundColor).toBeUndefined();
      expect(group().borderWidth).toBeUndefined();
      expect(group().borderColor).toBeUndefined();
    };
    // Ouverture de la Feuille : aucun geste, état normal.
    expectNormal();
    // Passage du Régime à « variables » : tableau ouvert et sélectionné (story 3.3).
    chooseRegime("identiques");
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    expectNormal();
    chooseRegime("variables");
    expectSelected();
    // PRE-5 story 2.4 : la ligne « Type de série » (segmenté, chevron) est dans le groupe
    // sélectionné ; « Nombre de séries » est une ligne distincte, hors du groupe.
    const variableGroup = screen.getByTestId("execution-sheet-variable-group");
    expect(within(variableGroup).getByTestId("execution-sheet-row-series-type")).toBeTruthy();
    expect(within(variableGroup).queryByTestId("execution-sheet-row-series")).toBeNull();
    // Segmenté du Mode (hors tableau) : état normal ; retour à Durée, valeurs restaurées.
    chooseMode("Répétitions");
    expectNormal();
    chooseMode("Durée");
    // ± d'une cellule du tableau (PRE-5 story 2.6 : la Pause, ouverte par sa cellule) : de nouveau sélectionné.
    nudgeCellPause(1, 1);
    expectSelected();
    // ± de N (hors tableau) : état normal.
    tap("execution-sheet-series-increment");
    expectNormal();
    // Glisser dans le tableau : sélectionné dès la prise.
    fireEvent(screen.getByTestId("execution-sheet-table-row-1-handle"), "responderGrant", { nativeEvent: { pageY: 100 } });
    expectSelected();
    fireEvent(screen.getByTestId("execution-sheet-table-row-1-handle"), "responderRelease", { nativeEvent: { pageY: 100 } });
    // ± du Bip (hors tableau) : état normal.
    tap("execution-sheet-beep-increment");
    expectNormal();
    // Pause d'une ligne du tableau puis Changement de côté (segmenté en ligne hors tableau,
    // PRE-5 story 2.5).
    nudgeCellPause(2, 1);
    expectSelected();
    chooseSide("Avec");
    expectNormal();
    // Chevron : déplier sélectionne, replier rend l'état normal.
    nudgeCellPause(2, 1);
    expectSelected();
    fireEvent.press(screen.getByTestId(TABLE_TOGGLE));
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    expectNormal();
    fireEvent.press(screen.getByTestId(TABLE_TOGGLE));
    expectSelected();
    // Déplacement accessible : action dans le tableau.
    tap("execution-sheet-countdown-increment");
    expectNormal();
    moveAction(2, "moveUp");
    expectSelected();
  }));

  // Q41 : enchaînement vérifié avec les contrôles en ligne, sur Android ; fond de sélection
  // lu sur le calque `-selection`. PRE-5 story 2.5 : le Changement de côté n'a plus de
  // surface ; la surface hors tableau est le ± de la Cadence (révélé par Autre).
  it("PRE4-Q40 — sélection unique : ± de la Cadence ouvert, puis cellule du tableau → le ± se range, la ligne Cadence n'est plus surlignée, le tableau l'est ; et inversement", () =>
    withPlatform("android", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10]]) }));
    const group = () => styleOf("execution-sheet-variable-group");
    fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`));
    // [± de la Cadence — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : champ révélé, focus simulé.]
    fireEvent(screen.getByTestId("execution-sheet-beep-input", anyNode), "focus");
    expect(styleOf("execution-sheet-row-beep-selection").backgroundColor).toBe(SELECTED_SURFACE);
    expect(group().backgroundColor).toBeUndefined();
    // D-434 : la cellule Pause prend le focus (clavier) ; famille ± : le ± de la Cadence se
    // range dans le même geste (T20).
    fireEvent(screen.getByTestId("execution-sheet-table-row-1-pause-input"), "focus");
    expect(styleOf("execution-sheet-table-row-1-pause").backgroundColor).toBe("#EAEAFF");
    expect(screen.queryByTestId("execution-sheet-beep-input", anyNode)).toBeNull();
    expect(styleOf("execution-sheet-row-beep-selection").backgroundColor).toBeUndefined();
    expect(cadenceText()).toBe("Sans");
    expect(group().backgroundColor).toBe(SELECTED_SURFACE);
    // Champ ± de la Cadence rouvert (la cellule perd le focus), puis prise d'un glisser dans
    // le tableau : champ rangé, tableau sélectionné.
    openExecutionSheetField("execution-sheet-beep");
    fireEvent(screen.getByTestId("execution-sheet-table-row-1-pause-input"), "blur");
    expect(styleOf("execution-sheet-row-beep-selection").backgroundColor).toBe(SELECTED_SURFACE);
    expect(group().backgroundColor).toBeUndefined();
    fireEvent(screen.getByTestId("execution-sheet-table-row-1-handle"), "responderGrant", { nativeEvent: { pageY: 100 } });
    expect(screen.queryByTestId("execution-sheet-beep-input", anyNode)).toBeNull();
    expect(styleOf("execution-sheet-row-beep-selection").backgroundColor).toBeUndefined();
    expect(group().backgroundColor).toBe(SELECTED_SURFACE);
    fireEvent(screen.getByTestId("execution-sheet-table-row-1-handle"), "responderRelease", { nativeEvent: { pageY: 100 } });
    // Inversement : rouvrir le ± de la Cadence rend le tableau à l'état normal.
    fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`));
    expect(group().backgroundColor).toBeUndefined();
    expect(styleOf("execution-sheet-row-beep-selection").backgroundColor).toBe(SELECTED_SURFACE);
  }));
});

/**
 * PRE-4 Q41 (Hermann, 2026-10-17, recette iPhone, E-15 ; amende Q37, Q39 et Q40) —
 * « Le fondu perdure, il faut le supprimer » : apparitions et disparitions par le bas,
 * révélées par un cadre de découpe dont le bas est la barre horizontale du dessous ; cadre
 * de sélection englobant le contrôle en ligne ; Changement de côté, Ordre des côtés et
 * roues (Durée d'une série, Durée totale) dans un panneau sans flèche, sous le champ,
 * aligné à droite, sur iOS ; aucun mouvement du texte à la sélection.
 * Limite : Jest ne joue aucune animation ni aucune mise en page réelle ; la fluidité,
 * l'absence de fondu, la position des panneaux et le toucher se jugent sur iPhone.
 */
describe("ExecutionParametersSheet — PRE-4 Q41 (révélation par le bas, panneaux sans flèche, sélection)", () => {
  const { AccessibilityInfo } = jest.requireActual<typeof import("react-native")>("react-native");
  const SELECTED_SURFACE = "#F2F2FF";
  const REVEAL_FUNCTIONS: readonly unknown[] = [revealClipEntering, revealClipExiting, revealContentEntering, revealContentExiting];
  type Instance = ReturnType<typeof screen.getByTestId>;
  const hidden = { includeHiddenElements: true } as const;
  const get = (testID: string) => screen.getByTestId(testID, hidden);
  const styleOf = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};
  const propsOf = (testID: string) => get(testID).props as { entering?: unknown; exiting?: unknown; layout?: unknown };
  const popovers = (root: Instance) => root.findAllByType(Popover).map((node) => node.props.testID as string);

  const bilateral = (count = 3) =>
    params({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE", sideRecoverySeconds: 10, series: { kind: "UNIFORM", count, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } });

  it("PRE4-Q41 — aucune opacité animée : toutes les vues animées de la Feuille ne portent que la révélation par le bas et la transition de place", () => {
    renderSheet(params({ sideMode: "RIGHT_LEFT", series: variableRows([[30, 5], [45, 10]]) }));
    const animated = screen.UNSAFE_root.findAll(
      (node) => typeof node.type === "string" && (node.props.entering !== undefined || node.props.exiting !== undefined),
    );
    expect(animated.length).toBeGreaterThan(0);
    for (const node of animated) {
      // E-20 : le tableau n'a pas d'entrée propre (`undefined`), jamais une animation d'opacité.
      expect([...REVEAL_FUNCTIONS, undefined]).toContain(node.props.entering);
      expect(REVEAL_FUNCTIONS).toContain(node.props.exiting);
    }
    // Aucun style d'opacité animée dans les quatre animations (entrée et sortie, cadre et contenu).
    const entering = { targetHeight: 58, targetWidth: 330, targetOriginX: 0, targetOriginY: 0, targetBorderRadius: 0, targetGlobalOriginX: 0, targetGlobalOriginY: 0, windowWidth: 402, windowHeight: 874 };
    const exiting = { currentHeight: 58, currentWidth: 330, currentOriginX: 0, currentOriginY: 0, currentBorderRadius: 0, currentGlobalOriginX: 0, currentGlobalOriginY: 0, windowWidth: 402, windowHeight: 874 };
    for (const animation of [revealClipEntering(entering), revealClipExiting(exiting), revealContentEntering(entering), revealContentExiting(exiting)]) {
      expect(JSON.stringify(animation)).not.toContain("opacity");
    }
    expect(SHEET_MOTION_MS).toBe(350);
  });

  it("PRE4-Q41 — révélation par le bas : cadre de découpe overflow hidden (s'ouvre de 0 à sa hauteur, se referme à 0), contenu qui monte de sa hauteur et redescend ; voisines en transition de place", () => {
    const entering = { targetHeight: 42, targetWidth: 330, targetOriginX: 0, targetOriginY: 0, targetBorderRadius: 0, targetGlobalOriginX: 0, targetGlobalOriginY: 0, windowWidth: 402, windowHeight: 874 };
    const exiting = { currentHeight: 42, currentWidth: 330, currentOriginX: 0, currentOriginY: 0, currentBorderRadius: 0, currentGlobalOriginX: 0, currentGlobalOriginY: 0, windowWidth: 402, windowHeight: 874 };
    expect(revealClipEntering(entering)).toEqual({ initialValues: { height: 0 }, animations: { height: 42 } });
    expect(revealClipExiting(exiting)).toEqual({ initialValues: { height: 42 }, animations: { height: 0 } });
    expect(revealContentEntering(entering)).toEqual({ initialValues: { transform: [{ translateY: 42 }] }, animations: { transform: [{ translateY: 0 }] } });
    expect(revealContentExiting(exiting)).toEqual({ initialValues: { transform: [{ translateY: 0 }] }, animations: { transform: [{ translateY: 42 }] } });

    renderSheet(bilateral());
    for (const testID of ["execution-sheet-row-side-recovery", "execution-sheet-row-total"]) {
      // Cadre de découpe : son bas est le haut de la barre (séparateur) qui le suit.
      expect(styleOf(testID).overflow).toBe("hidden");
      expect(propsOf(testID)).toMatchObject({ entering: revealClipEntering, exiting: revealClipExiting });
      expect(propsOf(testID).layout).toBeDefined();
      // Contenu : monte de sous la barre à l'entrée, redescend à la sortie.
      expect(propsOf(`${testID}-content`)).toMatchObject({ entering: revealContentEntering, exiting: revealContentExiting });
      expect(propsOf(`${testID}-content`).layout).toBeUndefined();
    }
  });

  it("PRE4-Q41 — « Réduire les animations » (NFR-10) : ni révélation ni transition de place, changement immédiat", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValueOnce(true);
    renderSheet(bilateral());
    await act(async () => {
      await Promise.resolve();
    });
    for (const testID of [
      "execution-sheet-row-side-recovery",
      "execution-sheet-row-side-recovery-content",
      "execution-sheet-row-total",
      "execution-sheet-frame-execution",
      "execution-sheet-frame-series",
      "execution-sheet-frame-sides",
      "execution-sheet-frame-cadence",
    ]) {
      expect({ entering: propsOf(testID).entering, exiting: propsOf(testID).exiting, layout: propsOf(testID).layout }).toEqual({
        entering: undefined,
        exiting: undefined,
        layout: undefined,
      });
    }
  });

  it("PRE4-Q41 — cadre de sélection englobant (Android) : le contrôle en ligne est dans le cadre de sa ligne, sous un seul fond de sélection", () =>
    withPlatform("android", () => {
      renderSheet(bilateral());
      const checkEnclosed = (rowID: string, controlID: string) => {
        const content = get(`${rowID}-content`);
        expect(within(content).getByTestId(controlID)).toBeTruthy();
        expect(within(content).getByTestId(`${rowID}-selection`)).toBeTruthy();
        // Un seul fond, en calque absolu sur toute la hauteur du cadre (ligne + contrôle).
        expect(styleOf(`${rowID}-selection`)).toMatchObject({ position: "absolute", top: 0, bottom: 0, backgroundColor: SELECTED_SURFACE });
        // Le cadre de découpe déborde de 12 de chaque côté (compensé) : le fond n'est pas rogné.
        expect(styleOf(rowID)).toMatchObject({ overflow: "hidden", marginHorizontal: -12, paddingHorizontal: 12 });
      };
      // PRE-5 story 2.4 (AC3) : le Mode n'a plus de sélecteur en ligne ; son segmenté est
      // dans la ligne elle-même.
      expect(within(get("execution-sheet-row-mode-line")).getByTestId(MODE_CONTROL)).toBeTruthy();
      expect(screen.queryByTestId("execution-sheet-mode-selector")).toBeNull();
      // PRE-5 story 2.5 (AC1, AC2) ; RC-6 : Changement de côté dans sa ligne, menu de
      // l'Enchainement dans l'option Avec.
      expect(within(get("execution-sheet-row-side-line")).getByTestId(SIDE_CONTROL)).toBeTruthy();
      expect(within(get(SIDE_CONTROL)).getByTestId(ORDER_MENU)).toBeTruthy();
      expect(screen.queryByTestId("execution-sheet-row-order", hidden)).toBeNull();
      expect(screen.queryByTestId("execution-sheet-side-selector")).toBeNull();
      // AC3 : le champ de la Cadence, révélé par Autre, est dans le cadre de sa ligne.
      fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`));
      fireEvent(get("execution-sheet-beep-input"), "focus");
      checkEnclosed("execution-sheet-row-beep", "execution-sheet-beep-motion");
      // [Roues de la Cible commune et de la Durée de l'exercice en ligne — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : le champ clavier est
      // dans le cadre de sa ligne.]
      openExecutionSheetField("execution-sheet-target");
      checkEnclosed("execution-sheet-row-target", "execution-sheet-target");
      openExecutionSheetField("execution-sheet-total");
      checkEnclosed("execution-sheet-row-total", "execution-sheet-total");
      expect(screen.queryByTestId(/-panel$/)).toBeNull();
    }));

  it("PRE4-Q41 — aucun mouvement du texte : styles de cadre, de contenu et de ligne identiques sélectionnée / non sélectionnée (marges, paddings) ; groupe du tableau : seule la couleur change", () => {
    const snapshot = (rowID: string) =>
      JSON.stringify([styleOf(rowID), styleOf(`${rowID}-content`), styleOf(`${rowID}-line`)]);
    renderSheet(bilateral());
    // PRE-5 story 2.5 : la Cadence, au ± révélé par Autre, ne bouge pas non plus.
    const cadenceBefore = snapshot("execution-sheet-row-beep");
    fireEvent.press(get(`${CADENCE_CONTROL}-OTHER`));
    fireEvent(get("execution-sheet-beep-input"), "focus");
    expect(styleOf("execution-sheet-row-beep-selection").backgroundColor).toBe(SELECTED_SURFACE);
    expect(snapshot("execution-sheet-row-beep")).toBe(cadenceBefore);
    closeExecutionSheetField("execution-sheet-beep");
    expect(snapshot("execution-sheet-row-beep")).toBe(cadenceBefore);
    // [Pastilles qui ouvraient une roue, fermée par un toucher extérieur — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier.]
    for (const [rowID, fieldID] of [
      ["execution-sheet-row-target", "execution-sheet-target"],
      ["execution-sheet-row-total", "execution-sheet-total"],
    ] as const) {
      const before = snapshot(rowID);
      expect(styleOf(`${rowID}-selection`).backgroundColor).toBeUndefined();
      openExecutionSheetField(fieldID);
      expect(styleOf(`${rowID}-selection`).backgroundColor).toBe(SELECTED_SURFACE);
      expect(snapshot(rowID)).toBe(before);
      closeExecutionSheetField(fieldID);
      expect(snapshot(rowID)).toBe(before);
    }
  });

  // Contre-recette iPhone du 30/10/2026 (Hermann) : aucun trait entre la ligne « Type de série » et
  // son tableau déployé ; le trait sous le tableau est celui de la ligne « Charge », hors du groupe.
  it("contre-recette du 30/10 — tableau des séries déployé : aucun séparateur entre sa ligne et lui", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10]]) }));
    const separators = screen.getByTestId("execution-sheet-variable-group", { includeHiddenElements: true }).findAll((node) => {
      if (typeof node.type !== "string") return false;
      const style = StyleSheet.flatten(node.props.style) ?? {};
      return style.height === 1 && (style.backgroundColor === colors.divider || style.backgroundColor === "transparent");
    });
    expect(separators).toHaveLength(0);
  });

  it("PRE4-Q41 — groupe du tableau (Q40) : sélectionné ou non, mêmes marges et paddings", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10]]) }));
    const geometry = (testID: string) => {
      const style = { ...styleOf(testID) };
      delete style.backgroundColor;
      return JSON.stringify(style);
    };
    const before = geometry("execution-sheet-variable-group");
    nudgeCellPause(1, 1);
    expect(styleOf("execution-sheet-variable-group").backgroundColor).toBe(SELECTED_SURFACE);
    expect(geometry("execution-sheet-variable-group")).toBe(before);
    tap("execution-sheet-beep-increment");
    expect(styleOf("execution-sheet-variable-group").backgroundColor).toBeUndefined();
    expect(geometry("execution-sheet-variable-group")).toBe(before);
  });

  // PRE-5 story 2.5 (AC1, AC2, AD-27) : remplace les panneaux iOS du Changement de côté et de
  // l'Ordre des côtés (`popover(side | order)` retirées) — segmentés en ligne dans leur ligne,
  // sans panneau, sans Popover ni Modal ; choix appliqué tout de suite, sans cadre D-4.
  it("PRE4-Q41, PRE5-2.5/AC1, AC2, RC-6 — iOS : Changement de côté sans panneau ni Popover, segmenté en ligne dans sa ligne ; Enchainement par le menu natif de l'option Avec ; choix appliqué immédiatement", () =>
    withPlatform("ios", () => {
      renderSheetView(bilateral());
      layoutFrames({ execution: [0, 90], series: [98, 190], sides: [296, 180], cadence: [484, 200] });
      const control = within(get("execution-sheet-row-side-line")).getByTestId(SIDE_CONTROL);
      expect(control.props.accessibilityRole).toBe("tablist");
      expect(within(control).getByTestId(ORDER_MENU)).toBeTruthy();
      chooseOrder("Les deux côtés à chaque série");
      expect(orderText()).toBe("Les deux côtés à chaque série");
      chooseSide("Sans");
      expect(sideText()).toBe("Sans");
      expect(screen.queryByTestId(ORDER_MENU)).toBeNull();
      expect(screen.queryAllByTestId(/^execution-sheet-.+-panel$/)).toHaveLength(0);
      expect(popovers(screen.UNSAFE_root)).toEqual([]);
      expect(screen.UNSAFE_root.findAllByType(Modal)).toHaveLength(1);
    }));

  // [Roue de la Durée totale dans un panneau sans flèche (position, réserve, ✕, toucher extérieur) — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier.]
  it("PRE4-Q41 — iOS : Durée de l'exercice saisie au clavier dans sa pastille, sans panneau ni Modal ; sortie du champ : Inversion et message d'ajustement ; valeur inchangée : rien", () =>
    withPlatform("ios", () => {
      renderSheet(params({ series: { kind: "UNIFORM", count: 1, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
      expect(text("execution-sheet-total")).toBe("40 s");
      openExecutionSheetField("execution-sheet-total");
      expect(screen.queryByTestId("execution-sheet-total-panel", hidden)).toBeNull();
      expect(within(get("execution-sheet-row-total")).getByTestId("execution-sheet-total")).toBeTruthy();
      expect(screen.UNSAFE_root.findAllByType(Modal)).toHaveLength(1);
      expect(screen.queryByTestId("execution-sheet-panel-room", hidden)).toBeNull();
      // Saisie revenue à la valeur de départ : aucune Inversion.
      closeExecutionSheetField("execution-sheet-total");
      expect(text("execution-sheet-total")).toBe("40 s");
      expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
      // Total demandé 1 min 40 s → inversion (N = 3) et message d'ajustement.
      enterExecutionSheetValue("execution-sheet-total", 100);
      expect(valueOf("execution-sheet-series")).toBe("3 séries identiques");
      expect(screen.getByTestId("execution-sheet-adjusted")).toBeTruthy();
    }));

  it("PRE4-Q41 — iOS : un seul panneau à la fois ; la sélection suit le panneau ouvert ; le tableau n'est plus sélectionné par un choix hors tableau ; Mode, Changement de côté et Enchainement n'ouvrent ni panneau ni popover", () =>
    withPlatform("ios", () => {
      const view = renderSheetView(params({ sideMode: "RIGHT_LEFT", series: variableRows([[30, 5], [45, 10]]) }));
      nudgeCellPause(1, 1);
      expect(styleOf("execution-sheet-variable-group").backgroundColor).toBe(SELECTED_SURFACE);
      // PRE-5 story 2.5 : choix en ligne hors tableau — le tableau n'est plus sélectionné, aucun panneau.
      chooseOrder("Les deux côtés à chaque série");
      expect(styleOf("execution-sheet-variable-group").backgroundColor).toBeUndefined();
      expect(styleOf("execution-sheet-row-side-selection").backgroundColor).toBeUndefined();
      expect(screen.queryAllByTestId(/^execution-sheet-.+-panel$/)).toHaveLength(0);
      // PRE-5 story 2.4 (AC3) : Mode en segmenté en ligne, sans panneau ni popover.
      chooseMode("Répétitions");
      expect(modeText()).toBe("Répétitions");
      expect(screen.UNSAFE_root.findAllByType(Popover)).toHaveLength(0);
      expect(screen.queryAllByTestId(/^execution-sheet-.+-panel$/)).toHaveLength(0);
      view.unmount();
      // [Un seul panneau de roue à la fois (T10) — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : un seul champ sélectionné, aucun panneau.]
      renderSheet(params());
      openExecutionSheetField("execution-sheet-target");
      expect(styleOf("execution-sheet-row-target-selection").backgroundColor).toBe(SELECTED_SURFACE);
      openExecutionSheetField("execution-sheet-total");
      expect(styleOf("execution-sheet-row-target-selection").backgroundColor).toBeUndefined();
      expect(styleOf("execution-sheet-row-total-selection").backgroundColor).toBe(SELECTED_SURFACE);
      expect(screen.queryAllByTestId(/^execution-sheet-.+-panel$/)).toHaveLength(0);
    }));
});

describe("PRE4-Q42 — lignes de la Feuille à 44 pt (Hermann, 2026-10-17)", () => {
  it("PRE4-Q42, PRE5-2.6/AC2 — lignes de la Feuille : hauteur minimale 44 pt ; lignes du tableau des séries variables : 36 (AD-28)", () => {
    expect(SHEET_ROW_MIN_HEIGHT).toBe(44);
    expect(TABLE_ROW_HEIGHT).toBe(36);
    renderSheet(params({ series: { kind: "UNIFORM", count: 2, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
    // Story 3.3 : la ligne de l'interrupteur « Séries variables » est retirée. RC-15 : la ligne
    // « Type de série » porte le Type et le nombre de séries.
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-row-series-type-line").props.style).minHeight).toBe(44);
  });
});

/**
 * PRE-4 story 3.3 (AC1 à AC11) — popovers Mode, Changement de côté, Ordre des côtés et
 * Régime ; valeurs hors tableau réglées par ± à l'appui ; une seule surface ouverte
 * (AD-15, transitions du réducteur prouvées dans `sheetSurface.test.ts`). Jest n'exerce
 * que la couche JS : rendu, ancrage, gestes et VoiceOver réels sont jugés sur iPhone
 * (R-3.3-01 à 06, NFR-04).
 */
describe("ExecutionParametersSheet — PRE-4 story 3.3", () => {
  const hidden = { includeHiddenElements: true };
  /** Un panneau ouvert est modal pour VoiceOver : les éléments hors du panneau sont lus parmi les masqués. */
  const get = (testID: string) => screen.getByTestId(testID, hidden);
  const query = (testID: string) => screen.queryByTestId(testID, hidden);
  const shownValue = (testID: string) => String(get(`${testID}-value`).props.children);
  const styleOf = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};
  const SELECTED_SURFACE = "#F2F2FF";
  const bilateral = (overrides: Partial<ExecutionParametersInput> = {}) =>
    params({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE", sideRecoverySeconds: 10, ...overrides });
  const creation = () =>
    params({ mode: null, series: { kind: "UNIFORM", count: 1, target: unsetTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] }, sideMode: null });
  const popovers = () => screen.UNSAFE_root.findAllByType(Popover).map((node) => node.props.testID as string);
  const modals = () => screen.UNSAFE_root.findAllByType(Modal);

  it("PRE4-3.3/AC1 — en-tête fixe ✕ / « Paramètres d’exécution » / ✓ hors du corps défilant ; Feuille modale pour l'accessibilité ; Modal en fondu conservée", () => {
    renderSheet(params());
    const header = screen.getByTestId("execution-sheet-header");
    expect(within(header).getByTestId("execution-sheet-cancel")).toBeTruthy();
    expect(within(header).getByText("Paramètres d’exécution")).toBeTruthy();
    expect(within(header).getByTestId("execution-sheet-validate")).toBeTruthy();
    const json = JSON.stringify(screen.toJSON());
    expect(json.indexOf('"execution-sheet-cancel"')).toBeLessThan(json.indexOf('"execution-sheet-validate"'));
    expect(within(screen.getByTestId("execution-sheet-body")).queryByTestId("execution-sheet-header")).toBeNull();
    expect(screen.getByTestId("execution-sheet").props.accessibilityViewIsModal).toBe(true);
    expect(screen.getByTestId("execution-sheet-modal").props.animationType).toBe("fade");
  });

  it("PRE4-3.3/AC2, PRE5-2.4/AC1, PRE5-2.5, RC-6 — ordre du corps : Mode → Condition d’arrêt → Type de série (nombre de séries, RC-15) → Cible et Pause → Changement de côté (portant l’Enchainement) → Pause entre les côtés → Cadence → Durée de l’exercice → Compte à rebours → Fin (dépliés) ; aucun interrupteur", () => {
    renderSheet(bilateral());
    showSignals();
    const order = [
      "execution-sheet-row-mode",
      "execution-sheet-row-stop-condition",
      "execution-sheet-row-series-type",
      "execution-sheet-series",
      "execution-sheet-row-target",
      "execution-sheet-row-pause",
      "execution-sheet-row-side",
      ORDER_MENU,
      "execution-sheet-row-side-recovery",
      "execution-sheet-row-beep",
      "execution-sheet-row-total",
      "execution-sheet-row-countdown",
      "execution-sheet-row-end",
    ];
    const json = JSON.stringify(screen.toJSON());
    const positions = order.map((id) => json.indexOf(`"${id}"`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    // Recette du 20/10 (RC-15) : plus de ligne « Nombre de séries » ; le nombre est dans l'option
    // sélectionnée du Type de série.
    expect(screen.queryByTestId("execution-sheet-row-series")).toBeNull();
    expect(within(screen.getByTestId(SERIES_TYPE)).getByTestId("execution-sheet-series")).toBeTruthy();
    expect(within(screen.getByTestId("execution-sheet-row-series-type")).getByTestId(SERIES_TYPE)).toBeTruthy();
    // FR-04-01, FR-05-04 : ni interrupteur, ni ligne « Séries variables » ; « échec » n'apparaît
    // que dans l'option « À l’échec » de la Condition d'arrêt (PRE-5 story 2.4), jamais un Mode.
    expect(screen.queryByTestId("execution-sheet-variable-switch")).toBeNull();
    expect(screen.queryByTestId("execution-sheet-row-variable")).toBeNull();
    expect(screen.queryByText("Séries variables")).toBeNull();
    const failureTexts = screen.queryAllByText(/échec/i, anyNode);
    expect(failureTexts.map((node) => String(node.props.children))).toEqual(["À l’échec"]);
    expect(within(screen.getByTestId(STOP_CONTROL)).getByText("À l’échec", anyNode)).toBe(failureTexts[0]);
  });
  // D-433 : Répétitions sans Cadence — la ligne Durée de l'exercice reste (« Non calculable »),
  // juste après la Cadence ; Compte à rebours est replié derrière son chevron, puis la suit.
  it("PRE4-3.3/AC2, PRE5-2.5/AC4, D-433 — Répétitions sans Cadence : ligne Durée de l’exercice « Non calculable » juste après la Cadence, Compte à rebours replié derrière son chevron puis juste après elle", () => {
    renderSheet(params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
    expect(screen.getByTestId("execution-sheet-row-total")).toBeTruthy();
    expect(totalShown()).toBe(TOTAL_NOT_CALCULABLE);
    expect(screen.queryByTestId("execution-sheet-row-countdown")).toBeNull();
    expect(screen.getByTestId(`${DURATION_DISCLOSURE}-frame`)).toBeTruthy();
    showSignals();
    const json = JSON.stringify(screen.toJSON());
    const beep = json.indexOf('"execution-sheet-row-beep"');
    const total = json.indexOf('"execution-sheet-row-total"');
    const countdown = json.indexOf('"execution-sheet-row-countdown"');
    expect(beep).toBeLessThan(total);
    expect(total).toBeLessThan(countdown);
    expect(json.slice(beep, total)).not.toMatch(/"execution-sheet-row-(?!beep)/);
    expect(json.slice(total, countdown)).not.toMatch(/"execution-sheet-row-(?!total)/);
  });

  it("PRE4-3.3/AC3, PRE5-2.4/AC3 — iOS : Mode en segmenté en ligne, exactement Répétitions puis Durée, en identiques comme en variables ; ni popover ni panneau ; aucun retour à « — »", () =>
    withPlatform("ios", () => {
      const view = renderSheetView(creation());
      expect(modeText()).toBe("—");
      const labels = () =>
        ["REPETITIONS", "DURATION"].map((mode) => String(get(`${MODE_CONTROL}-${mode}`).props.accessibilityLabel));
      expect(labels()).toEqual(["Répétitions", "Durée"]);
      expect(popovers()).toEqual([]);
      chooseMode("Durée");
      expect(modeText()).toBe("Durée");
      // Deux options seulement : aucune ne ramène le Mode à « — ».
      expect(screen.queryAllByTestId(new RegExp(`^${MODE_CONTROL}-[A-Z]+$`))).toHaveLength(2);
      expect(labels()).toEqual(["Répétitions", "Durée"]);
      view.unmount();
      renderSheet(params({ series: variableRows([[30, 10], [45, 20]]) }));
      expect(labels()).toEqual(["Répétitions", "Durée"]);
      expect(screen.queryAllByTestId(/^execution-sheet-.+-panel$/)).toHaveLength(0);
    }));
  it("PRE4-3.3/AC4, PRE5-2.5/AC1 — iOS : Changement de côté en segmenté en ligne Avec / Sans, sans panneau ni direction ; non renseigné : aucune option ; Avec appliqué tout de suite (RIGHT_LEFT, Pause du Profil)", () =>
    withPlatform("ios", () => {
      const { onApply } = renderSheet(params({ sideMode: null }));
      expect(sideText()).toBe("—");
      const control = within(get("execution-sheet-row-side-line")).getByTestId(SIDE_CONTROL);
      expect(control.props.accessibilityRole).toBe("tablist");
      expect(control.props.accessibilityLabel).toBe("De chaque côté");
      // RC-13 (recette du 20/10) : Avec non sélectionné affiche et annonce « Avec » ; la notation
      // de l'Enchainement n'apparaît qu'une fois Avec sélectionné (N > 1).
      expect(["WITH", "WITHOUT"].map((side) => get(`${SIDE_CONTROL}-${side}`).props.accessibilityLabel)).toEqual(["Avec", "Sans"]);
      expect(query(`${SIDE_CONTROL}-RIGHT_LEFT`)).toBeNull();
      // Non renseigné : ni menu d'Enchainement ni Pause entre les côtés.
      expect(query(ORDER_MENU)).toBeNull();
      expect(query("execution-sheet-row-side-recovery")).toBeNull();
      chooseSide("Avec");
      expect(sideText()).toBe("Avec");
      expect(screen.queryAllByTestId(/^execution-sheet-.+-panel$/)).toHaveLength(0);
      expect(popovers()).toEqual([]);
      expect(modals()).toHaveLength(1);
      // La ligne n'est jamais surlignée (aucune surface).
      expect(styleOf("execution-sheet-row-side-selection").backgroundColor).toBeUndefined();
      expect(shownValue("execution-sheet-side-recovery")).toBe("10 s");
      validate();
      expect(applied(onApply)).toMatchObject({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 10 });
    }));

  it("PRE4-3.3/AC5, PRE5-2.5/AC2, RC-6, PRE7-B.3 (B5) — iOS : Enchainement par le déroulant de l'option Avec (Figma `9462:18987`) : déclencheur 104 × 26 (116 avec « DG → DG → … », largeur adaptée au contenu depuis le 01/11/2026), notation 12 et chevron ; déroulant 104 × 88 ancré sur l'option, rôle menu, deux rangées de 44 dans l'ordre D-431, la choisie en violet ; choix, même choix, extérieur, échappement ; ✓ / ✕ absorbés ; aucun hôte SwiftUI ; absent en Sans", () =>
    withPlatform("ios", () => {
      const view = renderSheetView(bilateral());
      const onApply = view.onApply;
      const side = within(get("execution-sheet-row-side-line")).getByTestId(SIDE_CONTROL);
      const trigger = within(side).getByTestId(ORDER_MENU);
      // B5 : aucun hôte natif dimensionné sur son contenu ; déclencheur React Native de taille fixe.
      expect(screen.UNSAFE_root.findAllByType(Host)).toHaveLength(0);
      expect(screen.UNSAFE_root.findAllByType(RNHostView)).toHaveLength(0);
      expect(screen.UNSAFE_root.findAllByType(Menu)).toHaveLength(0);
      expect(StyleSheet.flatten(trigger.props.style)).toMatchObject({ width: 104, height: 26 });
      expect(trigger.props.accessibilityRole).toBe("button");
      expect(trigger.props.accessibilityLabel).toBe("Enchainement");
      expect(trigger.props.accessibilityValue).toEqual({ text: "Chaque série d’un côté, puis chaque série de l’autre" });
      expect(trigger.props.accessibilityState).toMatchObject({ expanded: false });
      expect(within(trigger).getByText("DD… → GG…", hidden)).toBeTruthy();
      expect(query(ORDER_PANEL)).toBeNull();

      // Ouverture : déroulant ancré sur l'option Avec (cadre Côtés à y 400, ligne à y 5 de 44 :
      // segmenté de 32 centré, option à 3 sous son haut → 400 + 5 + 6 + 3 = 414 ; bord droit de
      // l'option à 13 + 3 + 62 + 2 = 80 du bord de l'hôte).
      layoutFrames({ sides: [400, 100] });
      layoutOf("execution-sheet-row-side", 5, 44);
      fireEvent.press(trigger);
      const panel = get(ORDER_PANEL);
      // Contrôle segmenté du 04/11/2026 (Hermann : option sélectionnée à droite) : l'option choisie est la dernière. Le déroulant part du bord droit (16). [right: 80 — remplacé.]
      expect(StyleSheet.flatten(panel.props.style)).toMatchObject({ position: "absolute", top: 414, right: 16 });
      expect(get(ORDER_MENU).props.accessibilityState).toMatchObject({ expanded: true });
      const menu = within(panel).getByTestId(`${ORDER_MENU}-menu`, hidden);
      expect(menu.props.accessibilityRole).toBe("menu");
      expect(menu.props.accessibilityLabel).toBe("Enchainement");
      expect(StyleSheet.flatten(menu.props.style)).toMatchObject({ width: 104, height: 88 });
      const rows = within(menu).getAllByRole("menuitem");
      expect(rows.map((row) => row.props.accessibilityLabel)).toEqual(["Chaque série d’un côté, puis chaque série de l’autre", "Les deux côtés à chaque série"]);
      expect(rows.map((row) => row.props.accessibilityState)).toEqual([{ selected: true }, { selected: false }]);
      expect(rows.map((row) => StyleSheet.flatten(row.props.style))).toEqual([
        expect.objectContaining({ height: 44, backgroundColor: "#5F60EE", paddingHorizontal: 8, alignItems: "flex-start" }),
        expect.objectContaining({ height: 44, backgroundColor: "#F5F7FA", paddingHorizontal: 8, alignItems: "flex-start" }),
      ]);
      // Réserve sous les cadres : seul le cadre Côtés est mesuré (bas à 500) ; le déroulant
      // descend à 414 + 88 = 502 → réserve de 2, absente une fois fermé.
      expect(StyleSheet.flatten(get("execution-sheet-panel-room").props.style)).toMatchObject({ height: 2 });
      expect(StyleSheet.flatten(get(`${ORDER_MENU}-BY_SIDE-notation`).props.style)).toMatchObject({ fontSize: 12, fontWeight: "600", color: "#FFFFFF" });
      expect(StyleSheet.flatten(get(`${ORDER_MENU}-BY_SERIES-notation`).props.style)).toMatchObject({ fontSize: 12, fontWeight: "400", color: "#4A4A52" });
      // Chevron vers le haut dans la première rangée seulement.
      expect(within(rows[0]!).queryByTestId(`${ORDER_MENU}-chevron`, hidden)).not.toBeNull();
      expect(within(rows[1]!).queryByTestId(`${ORDER_MENU}-chevron`, hidden)).toBeNull();
      // Libellés longs : nom accessible seulement, jamais affichés ; aucune notation C1S1.
      expect(screen.queryByText("Chaque série d’un côté, puis chaque série de l’autre", hidden)).toBeNull();
      expect(screen.queryByText(/C1S1|C1 S1/u, hidden)).toBeNull();
      expect(popovers()).toEqual([]);

      // ✓ et ✕ de la Feuille absorbés : fermeture seule, Feuille ni validée ni abandonnée.
      validate();
      expect(query(ORDER_PANEL)).toBeNull();
      expect(query("execution-sheet-panel-room")).toBeNull();
      expect(onApply).not.toHaveBeenCalled();
      fireEvent.press(get(ORDER_MENU));
      fireEvent.press(get("execution-sheet-cancel"));
      expect(query(ORDER_PANEL)).toBeNull();
      expect(view.onCancel).not.toHaveBeenCalled();
      // Toucher extérieur et échappement VoiceOver : fermeture sans changement.
      fireEvent.press(get(ORDER_MENU));
      fireEvent.press(get(`${ORDER_PANEL}-outside`));
      expect(query(ORDER_PANEL)).toBeNull();
      fireEvent.press(get(ORDER_MENU));
      fireEvent(get(ORDER_PANEL), "accessibilityEscape");
      expect(query(ORDER_PANEL)).toBeNull();
      // Même choix : fermeture, Brouillon inchangé.
      fireEvent.press(get(ORDER_MENU));
      fireEvent.press(get(`${ORDER_MENU}-BY_SIDE`));
      expect(query(ORDER_PANEL)).toBeNull();
      expect(orderText()).toBe("Chaque série d’un côté, puis chaque série de l’autre");
      // Choix : `setSideOrder`, fermeture, notation affichée dans l'option.
      chooseOrder("Les deux côtés à chaque série");
      expect(screen.queryAllByTestId(/^execution-sheet-.+-panel$/)).toHaveLength(0);
      expect(orderText()).toBe("Les deux côtés à chaque série");
      fireEvent.press(get(ORDER_MENU));
      expect(within(get(ORDER_PANEL)).getAllByRole("menuitem").map((row) => row.props.accessibilityState)).toEqual([
        { selected: false },
        { selected: true },
      ]);
      fireEvent.press(get(`${ORDER_PANEL}-outside`));
      validate();
      expect(applied(onApply)).toMatchObject({ sideOrder: "BY_SERIES" });
      view.unmount();

      // Réouverture de la Feuille avec BY_SERIES : notation dans le déclencheur fixe, aucun hôte SwiftUI.
      const reopened = renderSheetView(bilateral({ sideOrder: "BY_SERIES" }));
      expect(StyleSheet.flatten(get(ORDER_MENU).props.style)).toMatchObject({ width: 116, height: 26 });
      expect(within(get(ORDER_MENU)).getByText("DG → DG → …", hidden)).toBeTruthy();
      expect(screen.UNSAFE_root.findAllByType(Host)).toHaveLength(0);
      expect(screen.UNSAFE_root.findAllByType(RNHostView)).toHaveLength(0);
      reopened.unmount();
      renderSheet(params({ sideMode: "UNILATERAL" }));
      expect(screen.queryByTestId(ORDER_MENU)).toBeNull();
    }));

  it("PRE4-3.3/AC6, PRE5-2.4/AC7 — iOS : Type de série à N ≥ 2 en segmenté en ligne dans sa ligne, sans panneau ni popover ; exactement Variables puis Identiques ; choix appliqué par le Brouillon", () =>
    withPlatform("ios", () => {
      const { onApply } = renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
      expect(seriesTypeText()).toBe("Identiques");
      const control = within(get("execution-sheet-row-series-type-line")).getByTestId(SERIES_TYPE);
      expect(control.props.accessibilityRole).toBe("tablist");
      expect(control.props.accessibilityLabel).toBe("Séries");
      expect(["VARIABLE", "UNIFORM"].map((value) => get(`${SERIES_TYPE}-${value}`).props.accessibilityLabel)).toEqual(["Variables", "Identiques"]);
      // Identiques : aucun tableau, donc aucun chevron.
      expect(query(TABLE_TOGGLE)).toBeNull();
      expect(popovers()).toEqual([]);
      expect(modals()).toHaveLength(1);
      expect(screen.queryByTestId("execution-sheet-regime-panel")).toBeNull();
      // Choix Variables : tableau déployé, lignes copiées (setVariable, story 3.2), sans panneau.
      fireEvent.press(get(`${SERIES_TYPE}-VARIABLE`));
      expect(screen.queryAllByTestId(/^execution-sheet-.+-panel$/)).toHaveLength(0);
      expect(seriesTypeText()).toBe("Variables");
      expect(get(TABLE_TOGGLE).props.accessibilityState).toMatchObject({ expanded: true });
      expect(shownValue("execution-sheet-table-row-3-target")).toBe("30 s");
      validate();
      expect(applied(onApply).series).toEqual(variableRows([[30, 10], [30, 10], [30, 10]]));
    }));
  it("PRE4-3.3/AC6 — chevron : identiques sans chevron, variables déployé, variables replié ; replier ne modifie rien, ne quitte pas variables ; Cible à renseigner repliée : ✓ indisponible", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 10], [null, 20]]) }));
    expect(seriesTypeText()).toBe("Variables");
    expect(screen.getByLabelText("Masquer le tableau des séries")).toBeTruthy();
    expect(screen.getByTestId("execution-sheet-table")).toBeTruthy();
    fireEvent.press(screen.getByTestId(TABLE_TOGGLE));
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    expect(seriesTypeText()).toBe("Variables");
    expect(screen.getByLabelText("Afficher le tableau des séries")).toBeTruthy();
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    validate();
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId(TABLE_TOGGLE));
    expect(shownValue("execution-sheet-table-row-2-target")).toBe("—");
    chooseRegime("identiques");
    expect(screen.queryByTestId(TABLE_TOGGLE)).toBeNull();
  });

  it("PRE4-3.3/AC6, PRE5-2.4/AC7, RC-15 — N = 1 : Type de série non modifiable (Variables indisponible et annoncé), état uniforme, sans chevron ; le nombre reste réglable dans Identiques", () =>
    withPlatform("ios", () => {
      renderSheet(params({ series: variableRows([[30, 10], [45, 20]]) }));
      tap("execution-sheet-series-decrement");
      expect(seriesTypeText()).toBe("Identiques");
      const control = get(SERIES_TYPE);
      // Recette du 20/10 (RC-15) : le contrôle porte le nombre de séries, réglable ; seul Variables
      // est indisponible (P16).
      expect(control.props.accessibilityRole).toBe("tablist");
      expect(get(`${SERIES_TYPE}-VARIABLE`).props.accessibilityState).toMatchObject({ selected: false, disabled: true });
      expect(get(`${SERIES_TYPE}-VARIABLE`).props.accessibilityLabel).toBe("Variables, sans effet pour une seule série");
      expect(get(`${SERIES_TYPE}-UNIFORM`).props.accessibilityState).toMatchObject({ selected: true, disabled: false });
      expect(styleOf(SERIES_TYPE).opacity).toBeUndefined();
      expect(query(TABLE_TOGGLE)).toBeNull();
      // L'information non modifiable absorbe l'appui (P16, T23) : le champ de N en saisie le reste
      // ([champ ± ouvert — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]).
      openExecutionSheetField("execution-sheet-series");
      fireEvent.press(control);
      expect(get("execution-sheet-series").props.accessibilityState).toMatchObject({ selected: true });
      expect(seriesTypeText()).toBe("Identiques");
      expect(get("execution-sheet-series-type-absorb").props.onStartShouldSetResponder()).toBe(true);
      closeExecutionSheetField("execution-sheet-series");
      // N remonte : variables et ses lignes reviennent (Brouillon, story 3.2).
      tap("execution-sheet-series-increment");
      expect(seriesTypeText()).toBe("Variables");
      expect(styleOf(SERIES_TYPE).opacity).toBeUndefined();
      expect(get(TABLE_TOGGLE)).toBeTruthy();
    }));
  it("PRE4-3.3/AC7, PRE5-2.4/AC3 — choix du Mode en ligne : appliqué, ligne jamais surlignée (aucune surface) ; ✕ de la Feuille après des choix rend le parent intact", () =>
    withPlatform("ios", () => {
      const parent = params();
      const snapshot = JSON.stringify(parent);
      const { onCancel, onApply } = renderSheet(parent);
      chooseMode("Répétitions");
      expect(modeText()).toBe("Répétitions");
      expect(styleOf("execution-sheet-row-mode-selection").backgroundColor).toBeUndefined();
      chooseMode("Durée");
      chooseRegime("variables");
      fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onApply).not.toHaveBeenCalled();
      expect(JSON.stringify(parent)).toBe(snapshot);
    }));
  // [Champ ± de la Cadence puis panneau de la roue de la Cible (T15, T10) — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : une seule saisie à la fois.]
  it("PRE4-3.3/AC7 — une seule surface : la Cadence en saisie, puis la Cible commune — le champ de la Cadence se range, la Cible prend la saisie", () =>
    withPlatform("ios", () => {
      renderSheet(bilateral());
      fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`));
      fireEvent(get("execution-sheet-beep-input"), "focus");
      expect(styleOf("execution-sheet-row-beep-selection").backgroundColor).toBe(SELECTED_SURFACE);
      openExecutionSheetField("execution-sheet-target");
      expect(query("execution-sheet-beep-input")).toBeNull();
      expect(styleOf("execution-sheet-row-beep-selection").backgroundColor).toBeUndefined();
      expect(get("execution-sheet-target").props.accessibilityState).toMatchObject({ selected: true });
      expect(query("execution-sheet-target-panel")).toBeNull();
    }));

  // [± à l'appui (− et + révélés par la valeur) — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : chaque valeur est un champ clavier dans sa pastille.]
  it("PRE4-3.3/AC8 — champs clavier : au repos la valeur seule, aucun ± ; cadre 137 × 44 aligné à droite ; pastille de 32 ; Autre révèle le champ de la Cadence dans le même cadre", () => {
    renderSheet(bilateral({ cadenceBeepIntervalSeconds: 2 }));
    showSignals();
    for (const field of ["series", "pause", "side-recovery", "countdown", "end"]) {
      expect(screen.queryByTestId(`execution-sheet-${field}-increment`)).toBeNull();
      expect(screen.queryByTestId(`execution-sheet-${field}-decrement`)).toBeNull();
      expect(get(`execution-sheet-${field}-input`).props.keyboardType).toBe("number-pad");
    }
    expect(query("execution-sheet-beep-input")).toBeNull();
    expect(cadenceText()).toBe("Autre");
    expect(shownValue("execution-sheet-countdown")).toBe("10 s");
    // PRE-7 B.1 (D-447, B3) : pastille de 32, rayon 8, marges 12.
    expect(styleOf("execution-sheet-countdown")).toMatchObject({ backgroundColor: "#F5F7FA", borderRadius: 8, minHeight: 32, paddingHorizontal: 12 });
    expect(get("execution-sheet-countdown").props.accessibilityLabel).toBe("Compte à rebours");
    expect(get("execution-sheet-countdown").props.accessibilityValue).toEqual({ text: "10 s" });
    // NFR-09, Q42 : cadre d'au moins 44 de haut, sur la largeur des anciens steppers, aligné à droite.
    const frame = styleOf("execution-sheet-countdown-frame");
    expect(frame).toMatchObject({ width: 137, minHeight: 44, alignItems: "flex-end", justifyContent: "center" });
    fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`));
    fireEvent(get("execution-sheet-beep-input"), "focus");
    expect(cadenceText()).toBe("Autre");
    expect(styleOf("execution-sheet-beep-frame")).toEqual(frame);
    expect(styleOf("execution-sheet-beep-motion-content")).toMatchObject({ flexDirection: "row", justifyContent: "flex-end" });
    expect(styleOf("execution-sheet-row-beep-line").minHeight).toBe(44);
    expect(shownValue("execution-sheet-beep")).toBe("00:02");
    expect(styleOf("execution-sheet-row-beep-selection").backgroundColor).toBe(SELECTED_SURFACE);
  });

  /**
   * PRE-7 story B.1 (D-447, B3, B6, B7) : hauteur commune de 32 (pastilles sur `color/surface`),
   * alignement à droite, chevron de Durée de l'exercice sans cadre. [Steppers ouverts — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : les
   * pastilles sont des champs clavier, fond `#EAEAFF` en saisie.]
   */
  it("PRE7-B.1 — pastilles de 32 sur color/surface (champs clavier), alignées à droite, fond de saisie #EAEAFF ; chevron de Durée de l'exercice sans cadre", () => {
    renderSheet(bilateral({ cadenceBeepIntervalSeconds: 2 }));
    showSignals();
    const pill = { backgroundColor: colors.surface, borderRadius: 8, minHeight: 32, paddingHorizontal: 12 };
    expect(styleOf("execution-sheet-target")).toMatchObject(pill);
    expect(get("execution-sheet-target").props.hitSlop).toEqual({ top: 6, bottom: 6 });
    expect(styleOf("execution-sheet-total")).toMatchObject(pill);
    for (const field of ["pause", "side-recovery", "countdown", "end"]) {
      expect(styleOf(`execution-sheet-${field}-frame`)).toMatchObject({ width: 137, minHeight: 44, alignItems: "flex-end" });
      expect(styleOf(`execution-sheet-${field}`)).toMatchObject(pill);
      openExecutionSheetField(`execution-sheet-${field}`);
      expect(styleOf(`execution-sheet-${field}`)).toMatchObject({ ...pill, backgroundColor: "#EAEAFF" });
    }
    // B7 : Disclosure Cadre Non — cadre interne 28 sans fond ni contour ; cible, nom et état inchangés.
    const frame = styleOf(`${DURATION_DISCLOSURE}-frame`);
    expect(frame).toMatchObject({ width: 28, height: 28 });
    expect(frame.backgroundColor).toBeUndefined();
    expect(frame.borderWidth).toBeUndefined();
    const disclosure = screen.getByLabelText(strings.executionParameters.sheet.hideExerciseSignals);
    expect(disclosure.props.accessibilityRole).toBe("button");
    expect(disclosure.props.accessibilityState).toMatchObject({ expanded: true });
    expect(28 + 2 * (disclosure.props.hitSlop as number)).toBeGreaterThanOrEqual(48);
  });

  // [T20, T22 des champs ± — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier.]
  it("PRE4-3.3/AC8 — T20 : un seul champ actif — la saisie d'un autre champ range le premier, valeur appliquée ; Cadence saisie à la seconde", () => {
    const { onApply } = renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
    tap("execution-sheet-pause-increment");
    expect(shownValue("execution-sheet-pause")).toBe("11 s");
    openExecutionSheetField("execution-sheet-pause");
    fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`));
    fireEvent(get("execution-sheet-beep-input"), "focus");
    expect(get("execution-sheet-pause").props.accessibilityState).toMatchObject({ selected: false });
    // Perte du focus natif de la Pause (simulée : le `blur()` natif n'émet rien sous Jest).
    closeExecutionSheetField("execution-sheet-pause");
    expect(shownValue("execution-sheet-pause")).toBe("11 s");
    typeInExecutionSheetCell("execution-sheet-beep", "2");
    closeExecutionSheetField("execution-sheet-beep");
    validate();
    expect(applied(onApply)).toMatchObject({ cadenceBeepIntervalSeconds: 2, series: { kind: "UNIFORM", pauseSeconds: 11, loadKg: 0, workPhases: [] } });
  });

  // [T22 : − de N sans fermeture du champ ; − indisponible à la borne — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier.]
  it("PRE4-3.3/AC8 — N saisi au clavier : 2 retire la ligne 3, 1 rend les séries identiques ; 0 ramené à 1 ; T23 : un appui extérieur range la saisie, sans Annuler", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    enterExecutionSheetValue("execution-sheet-series", 2, "integer");
    expect(shownValue("execution-sheet-series")).toBe("2 séries variables");
    expect(screen.queryByTestId("execution-sheet-table-row-3")).toBeNull();
    enterExecutionSheetValue("execution-sheet-series", 0, "integer");
    expect(shownValue("execution-sheet-series")).toBe("1 série identique");
    openExecutionSheetField("execution-sheet-series");
    fireEvent.press(screen.getByText("Cadence"));
    expect(get("execution-sheet-series").props.accessibilityState).toMatchObject({ selected: false });
    expect(screen.queryByText("Annuler")).toBeNull();
    validate();
    expect(applied(onApply).series).toMatchObject({ kind: "UNIFORM", count: 1 });
  });

  it("PRE4-3.3/AC8 — T24 et T14 : champ en saisie, toucher la Cible commune ou le chevron le range et agit dans le même geste", () => {
    const view = renderSheetView(params());
    showSignals();
    // [Champ ± et roue — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier.]
    openExecutionSheetField("execution-sheet-countdown");
    openExecutionSheetField("execution-sheet-target");
    expect(get("execution-sheet-countdown").props.accessibilityState).toMatchObject({ selected: false });
    expect(get("execution-sheet-target").props.accessibilityState).toMatchObject({ selected: true });
    view.unmount();
    renderSheet(params({ series: variableRows([[30, 10], [45, 20]]) }));
    showSignals();
    openExecutionSheetField("execution-sheet-end");
    fireEvent.press(screen.getByTestId(TABLE_TOGGLE));
    expect(get("execution-sheet-end").props.accessibilityState).toMatchObject({ selected: false });
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
  });

  // [T19 : ± ouvert, ✓ appliqué dans le même geste — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : une saisie absorbe ✓ (Q47), bornes inchangées.]
  it("PRE4-3.3/AC8 — saisie en cours : ✓ absorbé (premier appui = sortie du champ) ; bornes inchangées (Compte à rebours ≤ 60 s)", () => {
    const { onApply } = renderSheet(params({ countdownSeconds: 60, endSeconds: 0 }));
    showSignals();
    enterExecutionSheetValue("execution-sheet-countdown", 75);
    expect(shownValue("execution-sheet-countdown")).toBe("1 min");
    openExecutionSheetField("execution-sheet-end");
    typeInExecutionSheetCell("execution-sheet-end", "1");
    validate();
    expect(onApply).not.toHaveBeenCalled();
    closeExecutionSheetField("execution-sheet-end");
    validate();
    expect(applied(onApply)).toMatchObject({ countdownSeconds: 60, endSeconds: 1 });
  });

  it("PRE4-3.3/AC9, PRE5-2.5/AC1 — création : Mode et Changement de côté sans option sélectionnée, N = 1, Pause 0 s, Cadence « Sans » ; ✓ produit Sans changement", () => {
    const { onApply } = renderSheet(creation());
    expect(modeText()).toBe("—");
    expect(sideText()).toBe("—");
    expect(screen.getByTestId(SIDE_CONTROL).props.accessibilityLabel).toBe("De chaque côté");
    expect(screen.queryByTestId(`${SIDE_CONTROL}-indicator`)).toBeNull();
    expect(valueOf("execution-sheet-series")).toBe("1 série identique");
    expect(seriesTypeText()).toBe("Identiques");
    expect(valueOf("execution-sheet-pause")).toBe("0 s");
    expect(cadenceText()).toBe("Sans");
    chooseMode("Répétitions");
    validate();
    expect(applied(onApply)).toMatchObject({ sideMode: "UNILATERAL", series: { pauseSeconds: 0 } });
  });

  it("PRE4-3.3/AC10 — Mode à renseigner ou Cible commune « — » : ✓ indisponible, fond #FFF1F0 sans contour, aucun message ; Pause 0 s valide", () => {
    const view = renderSheetView(creation());
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    chooseMode("Durée");
    const pill = styleOf("execution-sheet-target");
    expect(pill.backgroundColor).toBe("#FFF1F0");
    expect(pill.borderWidth).toBeUndefined();
    expect(screen.queryByTestId("execution-sheet-message")).toBeNull();
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    view.unmount();
    renderSheet(params({ series: { kind: "UNIFORM", count: 2, target: numberTarget(30), pauseSeconds: 0, loadKg: 0, workPhases: [] } }));
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: false });
  });

  /**
   * AC11 — repli Android et web : les quatre choix passent par le segmenté existant, en
   * ligne dans le cadre de sélection de leur ligne, avec les mêmes options et les mêmes
   * effets sur le Brouillon que sur iOS (parité vérifiée sur les paramètres appliqués).
   */
  async function chooseAll(platform: typeof Platform.OS) {
    let result: ExecutionParameters | undefined;
    await withPlatform(platform, () => {
      // La roue native et la roue Legacy ne se pilotent pas de la même façon sous Jest : la
      // Cible part de 40 s, et le Mode est basculé aller-retour (mémoire par Mode, story 3.2).
      const { onApply, unmount } = renderSheetView(
        params({ series: { kind: "UNIFORM", count: 1, target: numberTarget(40), pauseSeconds: 0, loadKg: 0, workPhases: [] }, sideMode: null }),
      );
      chooseMode("Répétitions");
      chooseMode("Durée");
      tap("execution-sheet-series-increment");
      tap("execution-sheet-series-increment");
      chooseRegime("variables");
      // PRE-5 story 2.5 : Avec / Sans (Sans → Avec écrit RIGHT_LEFT), puis Enchainement.
      chooseSide("Avec");
      chooseOrder("Les deux côtés à chaque série");
      validate();
      result = applied(onApply);
      unmount();
    });
    return result;
  }

  it("PRE4-3.3/AC11 — Android et web : Mode, Côté, Ordre et Type de série par le segmenté en ligne ; même résultat qu'iOS", async () => {
    const ios = await chooseAll("ios");
    const android = await chooseAll("android");
    const web = await chooseAll("web");
    expect(ios).toMatchObject({
      mode: "DURATION",
      sideMode: "RIGHT_LEFT",
      sideOrder: "BY_SERIES",
      series: { kind: "VARIABLE", rows: [{ target: numberTarget(40) }, { target: numberTarget(40) }, { target: numberTarget(40) }], workPhases: [] },
    });
    expect(android).toEqual(ios);
    expect(web).toEqual(ios);
  });

  it("PRE4-3.3/AC11, PRE5-2.5, RC-6 — Android : chaque segmenté est dans la ligne elle-même (Mode, Type de série, Changement de côté, Cadence), avec ses options ; Enchainement par le déroulant de l'option Avec (PRE7-B.3, A3 : plus d'`Alert`) ; ni panneau de roue ni Popover", () =>
    withPlatform("android", () => {
      renderSheet(bilateral());
      for (const [rowID, controlID, options] of [
        ["execution-sheet-row-mode", MODE_CONTROL, ["REPETITIONS", "DURATION"]],
        ["execution-sheet-row-series-type", SERIES_TYPE, ["VARIABLE", "UNIFORM"]],
        ["execution-sheet-row-side", SIDE_CONTROL, ["WITH", "WITHOUT"]],
        ["execution-sheet-row-beep", CADENCE_CONTROL, ["OTHER", "1", "NONE"]],
      ] as const) {
        const control = within(screen.getByTestId(`${rowID}-line`)).getByTestId(controlID);
        expect(options.map((option) => within(control).getByTestId(`${controlID}-${option}`))).toHaveLength(options.length);
      }
      expect(within(screen.getByTestId(SIDE_CONTROL)).getByTestId(ORDER_MENU)).toBeTruthy();
      expect(screen.UNSAFE_root.findAllByType(Menu)).toHaveLength(0);
      chooseOrder("Les deux côtés à chaque série");
      expect(orderText()).toBe("Les deux côtés à chaque série");
      expect(screen.queryAllByTestId(/^execution-sheet-.+-panel$/)).toHaveLength(0);
      expect(screen.UNSAFE_root.findAllByType(Popover)).toHaveLength(0);
    }));
  it("PRE4-3.3/AC11, PRE5-2.5 — iOS : aucune Modal, aucun Popover ni panneau pour Mode, Type de série, Changement de côté et Enchainement (segmentés en ligne)", () =>
    withPlatform("ios", () => {
      renderSheet(bilateral());
      expect(popovers()).toEqual([]);
      expect(modals()).toHaveLength(1);
      expect(query("execution-sheet-mode-value")).toBeNull();
      expect(query("execution-sheet-regime-value")).toBeNull();
      expect(query("execution-sheet-side-value")).toBeNull();
      expect(query("execution-sheet-order-value")).toBeNull();
      chooseSide("Avec");
      chooseOrder("Les deux côtés à chaque série");
      expect(query("execution-sheet-side-panel")).toBeNull();
      expect(query("execution-sheet-order-panel")).toBeNull();
      expect(popovers()).toEqual([]);
      expect(modals()).toHaveLength(1);
    }));

  // [Champs ± ouverts — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : la saisie d'un champ désigne sa ligne.]
  it("PRE4-3.3/AC8 — chaque champ en saisie désigne sa ligne (fond de sélection) : Pause, Pause entre les côtés, Cadence (Autre), Compte à rebours, Fin ; le nombre de séries, dans son option, ne surligne pas sa ligne", () => {
    renderSheet(bilateral());
    showSignals();
    openExecutionSheetField("execution-sheet-series");
    expect(get("execution-sheet-series").props.accessibilityState).toMatchObject({ selected: true });
    expect(styleOf("execution-sheet-row-series-type-selection").backgroundColor).toBeUndefined();
    const rows: [string, string][] = [
      ["pause", "execution-sheet-row-pause"],
      ["side-recovery", "execution-sheet-row-side-recovery"],
      ["beep", "execution-sheet-row-beep"],
      ["countdown", "execution-sheet-row-countdown"],
      ["end", "execution-sheet-row-end"],
    ];
    for (const [field, rowID] of rows) {
      expect(styleOf(`${rowID}-selection`).backgroundColor).toBeUndefined();
      openExecutionSheetField(`execution-sheet-${field}`);
      expect(styleOf(`${rowID}-selection`).backgroundColor).toBe(SELECTED_SURFACE);
      expect(styleOf(`${rowID}-selection`).borderRadius).toBe(12);
      for (const [, other] of rows) {
        if (other !== rowID) expect(styleOf(`${other}-selection`).backgroundColor).toBeUndefined();
      }
    }
  });

  // [PRE4-3.3/AC8 — VoiceOver des champs ± (focus au champ ouvert, échappement, Magic Tap, « Fermer ») :
  // supprimé, remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier ; le clavier se ferme par « Fermer » de sa barre.]

  it("PRE4-3.3/AC8 — T23 : la zone d'appui extérieur couvre aussi les marges du corps (dessus, côtés, sous la dernière ligne)", () => {
    renderSheet(params());
    showSignals();
    const outside = screen.getByTestId("execution-sheet-body-outside");
    expect(outside.props.accessible).toBe(false);
    expect(StyleSheet.flatten(outside.props.style)).toMatchObject({ position: "absolute", top: -12, right: -24, bottom: -24, left: -24 });
    // [Champ ± rangé — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : la saisie en cours est rangée.]
    openExecutionSheetField("execution-sheet-end");
    fireEvent.press(outside);
    expect(get("execution-sheet-end").props.accessibilityState).toMatchObject({ selected: false });
    closeExecutionSheetField("execution-sheet-end");
    // Sans champ ouvert, l'appui extérieur est sans effet.
    fireEvent.press(outside);
    expect(valueOf("execution-sheet-end")).toBe("5 s");
  });

  it("PRE4-3.3/AC8 — tableau : un toucher sur une zone neutre ne change rien ; un glisser (T-15) garde son issue, saisie de N ouverte ou non", () => {
    renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    nudgeCellPause(1, 1);
    const group = () => StyleSheet.flatten(screen.getByTestId("execution-sheet-variable-group").props.style);
    expect(group().backgroundColor).toBe(SELECTED_SURFACE);
    fireEvent.press(within(screen.getByTestId("execution-sheet-table")).getByText("Pause"));
    expect(group().backgroundColor).toBe(SELECTED_SURFACE);
    expect(valueOf("execution-sheet-table-row-1-pause")).toBe("11 s");
    // Glisser avec la saisie de N ouverte ([± — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]) : la saisie est rangée, la ligne déposée à sa place.
    openExecutionSheetField("execution-sheet-series");
    dragHandle(1, TABLE_ROW_HEIGHT);
    expect(get("execution-sheet-series").props.accessibilityState).toMatchObject({ selected: false });
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("45 s");
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("30 s");
    expect(screen.getByTestId("execution-sheet-body").props.scrollEnabled).toBe(true);
  });

  // [Pastille qui ouvrait le Sélecteur de la Cible commune (panneau, ✕, T10) — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier.]
  it("PRE4-3.3/AC7 — Cible commune Répétitions : sa saisie range le champ de la Cadence ; une seule surface", () =>
    withPlatform("ios", () => {
      renderSheet(params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
      fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`));
      fireEvent(get("execution-sheet-beep-input"), "focus");
      openExecutionSheetField("execution-sheet-target");
      expect(query("execution-sheet-beep-input")).toBeNull();
      expect(query("execution-sheet-target-panel")).toBeNull();
      closeExecutionSheetField("execution-sheet-target");
      expect(text("execution-sheet-target-value")).toBe("10 rép.");
      expect(cadenceText()).toBe("Sans");
    }));

  it("PRE4-3.3/AC6 — re-choisir « variables », tableau replié : le tableau reste replié, rien n'est modifié", () => {
    renderSheet(params({ series: variableRows([[30, 10], [45, 20]]) }));
    fireEvent.press(screen.getByTestId(TABLE_TOGGLE));
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    chooseRegime("variables");
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    expect(seriesTypeText()).toBe("Variables");
    expect(styleOf("execution-sheet-variable-group").backgroundColor).toBeUndefined();
  });

  for (const platform of ["ios", "android"] as const) {
    it(`PRE4-3.3/AC6, PRE5-2.4/AC7 — Type de série (${platform}) : Variables appliqué tout de suite, sans sélecteur ni cadre D-4 ; tableau déployé et sélectionné aussitôt, ligne Type de série dans le groupe sélectionné`, () =>
      withPlatform(platform, () => {
        renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
        fireEvent.press(get(`${SERIES_TYPE}-VARIABLE`));
        expect(seriesTypeText()).toBe("Variables");
        expect(query("execution-sheet-regime-selector")).toBeNull();
        expect(query("execution-sheet-regime-control")).toBeNull();
        expect(get("execution-sheet-table")).toBeTruthy();
        expect(styleOf("execution-sheet-variable-group").backgroundColor).toBe(SELECTED_SURFACE);
        expect(within(get("execution-sheet-variable-group")).getByTestId("execution-sheet-row-series-type")).toBeTruthy();
        expect(styleOf("execution-sheet-row-series-type-selection").backgroundColor).toBeUndefined();
      }));
  }
});

/**
 * PRE-4 story 3.4 (AD-7, AD-15, AD-16, Q12, Q21, Q25, Q36, Q41) — Cible commune en Durée dans la
 * Feuille. [Roue de la Cible commune (ouverture normalisée, ✕ / ✓, toucher extérieur, ✓ du Sélecteur
 * indisponible sur 00:00) — remplacée le 06/11/2026, décision de Hermann (constat c) : saisie au clavier
 * « MM:SS » dans la pastille, bornes 1..3535 s, hors bornes ramenée à la borne (QD-434-3), vidée → à
 * renseigner (QD-434-4), appliquée au Brouillon de la Feuille à la sortie du champ.]
 */
describe("ExecutionParametersSheet — PRE-4 story 3.4", () => {
  const durationTarget = (target: SeriesTarget, count = 3) =>
    params({ series: { kind: "UNIFORM", count, target, pauseSeconds: 15, loadKg: 0, workPhases: [] } });
  /** PRE-5 story 2.4 (AC6, FR-22) : « À l'échec » d'une cellule variable (Série 2 témoin à 45 s). */
  const cellTarget = (target: SeriesTarget) =>
    params({
      series: {
        kind: "VARIABLE",
        rows: [
          { target, pauseSeconds: 15, loadKg: 0 },
          { target: numberTarget(45), pauseSeconds: 15, loadKg: 0 },
        ],
        workPhases: [],
      },
    });
  const hiddenNode = { includeHiddenElements: true } as const;
  const TARGET = "execution-sheet-target";
  /** D-434 : focus de la cellule Cible de la Série 1 (clavier numérique). */
  const openCell = () => fireEvent(screen.getByTestId("execution-sheet-table-row-1-target-input", hiddenNode), "focus");
  const cellText = (row = 1) => String(screen.getByTestId(`execution-sheet-table-row-${row}-target-value`, hiddenNode).props.children);
  const shown = () => text("execution-sheet-target-value");
  const sheetValidateDisabled = () => screen.getByTestId("execution-sheet-validate").props.accessibilityState?.disabled === true;

  it("PRE4-3.4/AC1, PRE5-2.4/AC6 — iOS : « Durée d’une série » se saisit au clavier dans sa pastille, sans panneau ni option échec ; la saisie d'une autre valeur se range", () =>
    withPlatform("ios", () => {
      const { onApply } = renderSheet(durationTarget(numberTarget(30)));
      openExecutionSheetField("execution-sheet-pause");
      openExecutionSheetField(TARGET);
      expect(screen.getByTestId("execution-sheet-pause", hiddenNode).props.accessibilityState).toMatchObject({ selected: false });
      expect(screen.getByTestId(TARGET).props.accessibilityState).toMatchObject({ selected: true });
      expect(screen.queryByTestId("execution-sheet-target-panel", hiddenNode)).toBeNull();
      expect(screen.queryByText("Aucune durée, à l’échec")).toBeNull();
      closeExecutionSheetField(TARGET);
      closeExecutionSheetField("execution-sheet-pause");
      expect(String(screen.getByTestId("execution-sheet-pause-value", hiddenNode).props.children)).toBe("15 s");
      validate();
      expect(applied(onApply).series).toMatchObject({ kind: "UNIFORM", count: 3, target: { kind: "NUMBER", value: 30 }, pauseSeconds: 15, loadKg: 0, workPhases: [] });
    }));

  it("PRE4-3.4/AC3 — Cible commune 30 s : « 00:30 » en saisie, sans option ; D-434 : cellule à l’échec au clavier, « 00:00 » atténué et « À l'échec » sélectionné", () =>
    withPlatform("ios", () => {
      const view = renderSheetView(durationTarget(numberTarget(30)));
      openExecutionSheetField(TARGET);
      expect(shown()).toBe("00:30");
      expect(screen.queryByTestId("execution-sheet-keyboard-failure", hiddenNode)).toBeNull();
      view.unmount();
      renderSheet(cellTarget(failureTarget()));
      expect(cellText()).toBe("à l’échec");
      openCell();
      expect(cellText()).toBe("00:00");
      showExecutionSheetKeyboard();
      expect(screen.getByTestId("execution-sheet-keyboard-failure").props.accessibilityState).toMatchObject({ selected: true });
    }));

  // Recette iPhone du 29/10/2026 (« ne pas sélectionner 1 s par défaut ») : la saisie part de « 00:00 ».
  it("PRE4-3.4/AC3, recette du 29/10/2026 — Cible à renseigner : saisie sur « 00:00 », aucune valeur présélectionnée ; sortie sans frappe : « — » ; 1 min saisie rend ✓ disponible", () =>
    withPlatform("ios", () => {
      renderSheet(durationTarget(unsetTarget()));
      openExecutionSheetField(TARGET);
      expect(shown()).toBe("00:00");
      closeExecutionSheetField(TARGET);
      expect(shown()).toBe("—");
      expect(StyleSheet.flatten(screen.getByTestId(TARGET).props.style).backgroundColor).toBe("#FFF1F0");
      expect(sheetValidateDisabled()).toBe(true);
      enterExecutionSheetValue(TARGET, 60);
      expect(shown()).toBe("1 min");
      expect(sheetValidateDisabled()).toBe(false);
    }));

  it("PRE4-3.4/AC4 — Cible ancienne 5999 s : inchangée sans frappe ; une saisie au-delà de 58:55 est ramenée à 3535 s ; 7 s reste 7 s", () =>
    withPlatform("ios", () => {
      const legacy = durationTarget(numberTarget(5999));
      const view = renderSheetView(legacy, 10, legacy);
      const before = shown();
      expect(before).toBe(formatPhraseDuration(5999));
      openExecutionSheetField(TARGET);
      closeExecutionSheetField(TARGET);
      expect(shown()).toBe(before);
      // (99:58 : une saisie différente du texte d’édition « 99:59 » de 5999 s.)
      enterExecutionSheetValue(TARGET, 99 * 60 + 58);
      expect(shown()).toBe(formatPhraseDuration(3535));
      view.unmount();

      const { onApply } = renderSheet(durationTarget(numberTarget(7)));
      expect(sheetValidateDisabled()).toBe(false);
      openExecutionSheetField(TARGET);
      expect(shown()).toBe("00:07");
      closeExecutionSheetField(TARGET);
      expect(shown()).toBe("7 s");
      validate();
      expect(applied(onApply).series).toMatchObject({ kind: "UNIFORM", target: { kind: "NUMBER", value: 7 } });
    }));

  it("PRE4-3.4/AC8 — 30 s : saisir 45 s donne 45 s ; secondes > 59 reportées (01:75 → 2 min 15 s)", () =>
    withPlatform("ios", () => {
      renderSheet(durationTarget(numberTarget(30)));
      enterExecutionSheetValue(TARGET, 45);
      expect(shown()).toBe("45 s");
      openExecutionSheetField(TARGET);
      typeInExecutionSheetCell(TARGET, "175");
      closeExecutionSheetField(TARGET);
      expect(shown()).toBe("2 min 15 s");
    }));

  it("PRE4-3.4/AC7 — « 00:00 » saisi : ramené à la plus petite Cible positive (1 s), jamais l'échec ; Pause 0 s reste valide", () =>
    withPlatform("ios", () => {
      renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 0, loadKg: 0, workPhases: [] } }));
      enterExecutionSheetValue(TARGET, 0);
      expect(shown()).toBe("1 s");
      expect(selectedValue(STOP_CONTROL, ["FAILURE", "TARGET"])).toBe("TARGET");
      expect(sheetValidateDisabled()).toBe(false);
    }));

  it("PRE4-3.4/AC10, PRE5-2.4/AC4 — ligne commune : à l’échec, ligne masquée (Condition d’arrêt « À l’échec ») ; « — » sur #FFF1F0 sans contour avec ✓ de la Feuille indisponible, ou la durée formatée ; aucun écran « Série à l’échec »", () =>
    withPlatform("ios", () => {
      const failure = renderSheetView(durationTarget(failureTarget()));
      expect(screen.queryByTestId("execution-sheet-row-target")).toBeNull();
      expect(selectedValue(STOP_CONTROL, ["FAILURE", "TARGET"])).toBe("FAILURE");
      expect(screen.queryByTestId("execution-sheet-target-failure")).toBeNull();
      expect(sheetValidateDisabled()).toBe(false);
      failure.unmount();
      const unset = renderSheetView(durationTarget(unsetTarget()));
      expect(shown()).toBe("—");
      const pill = StyleSheet.flatten(screen.getByTestId(TARGET).props.style);
      expect(pill.backgroundColor).toBe("#FFF1F0");
      expect(pill.borderWidth).toBeUndefined();
      expect(sheetValidateDisabled()).toBe(true);
      unset.unmount();
      renderSheet(durationTarget(numberTarget(60)));
      expect(shown()).toBe("1 min");
      expect(screen.queryByText("Série à l’échec")).toBeNull();
    }));
});

/**
 * PRE-4 story 3.5 (AD-7, AD-15, AD-16, Q8, Q12, Q14, Q21, Q25, Q41) — Cible commune en Répétitions.
 * [Roue native à une colonne 1..100 dans le panneau sans flèche — remplacée le 06/11/2026, décision de
 * Hermann (constat c) : saisie au clavier numérique dans la pastille, bornes 1..100, hors bornes
 * ramenée à la borne, vidée → à renseigner.]
 */
describe("ExecutionParametersSheet — PRE-4 story 3.5", () => {
  const repetitionsTarget = (target: SeriesTarget, count = 3) =>
    params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count, target, pauseSeconds: 15, loadKg: 0, workPhases: [] } });
  const cellRepetitions = (target: SeriesTarget) =>
    params({
      mode: "REPETITIONS",
      series: {
        kind: "VARIABLE",
        rows: [
          { target, pauseSeconds: 15, loadKg: 0 },
          { target: numberTarget(8), pauseSeconds: 15, loadKg: 0 },
        ],
        workPhases: [],
      },
    });
  const hiddenNode = { includeHiddenElements: true } as const;
  const TARGET = "execution-sheet-target";
  const openCell = () => fireEvent(screen.getByTestId("execution-sheet-table-row-1-target-input", hiddenNode), "focus");
  const shown = () => text("execution-sheet-target-value");
  const sheetValidateDisabled = () => screen.getByTestId("execution-sheet-validate").props.accessibilityState?.disabled === true;

  it("PRE4-3.5/AC1 — iOS : « Nombre de répétitions » se saisit au clavier numérique dans sa pastille, dans sa ligne, sans panneau ; la saisie d'une autre valeur se range", () =>
    withPlatform("ios", () => {
      const { onApply } = renderSheet(repetitionsTarget(numberTarget(10)));
      openExecutionSheetField("execution-sheet-pause");
      openExecutionSheetField(TARGET);
      expect(screen.getByTestId("execution-sheet-pause", hiddenNode).props.accessibilityState).toMatchObject({ selected: false });
      expect(within(screen.getByTestId("execution-sheet-row-target", hiddenNode)).getByTestId(TARGET)).toBeTruthy();
      expect(screen.getByTestId("execution-sheet-target-input", hiddenNode).props.keyboardType).toBe("number-pad");
      expect(screen.queryByTestId("execution-sheet-target-panel", hiddenNode)).toBeNull();
      typeInExecutionSheetCell(TARGET, "12");
      closeExecutionSheetField(TARGET);
      expect(shown()).toBe("12 rép.");
      validate();
      expect(applied(onApply).series).toMatchObject({ kind: "UNIFORM", count: 3, target: { kind: "NUMBER", value: 12 }, pauseSeconds: 15, loadKg: 0, workPhases: [] });
    }));

  it("PRE4-3.5/AC2, PRE5-2.4/AC6, D-434 — Cible commune au clavier, sans ligne de tête ni stepper ; cellule variable au clavier", () =>
    withPlatform("ios", () => {
      const view = renderSheetView(repetitionsTarget(numberTarget(10)));
      expect(screen.queryByTestId("execution-sheet-target-stepper")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-target-failure")).toBeNull();
      openExecutionSheetField(TARGET);
      expect(shown()).toBe("10");
      expect(screen.queryByTestId("number-wheel-column")).toBeNull();
      view.unmount();
      renderSheet(cellRepetitions(numberTarget(10)));
      openCell();
      expect(screen.queryByTestId("number-wheel-column")).toBeNull();
      expect(screen.getByTestId("execution-sheet-table-row-1-target-input").props.keyboardType).toBe("number-pad");
    }));

  it("PRE4-3.5/AC4 — saisie : 12 → « 12 » ; ancienne 150 inchangée sans frappe, ramenée à 100 par une saisie au-delà", () =>
    withPlatform("ios", () => {
      const twelve = renderSheetView(repetitionsTarget(numberTarget(12)));
      openExecutionSheetField(TARGET);
      expect(shown()).toBe("12");
      twelve.unmount();

      const legacy = repetitionsTarget(numberTarget(150));
      renderSheet(legacy, 10, legacy);
      expect(shown()).toBe("150 rép.");
      openExecutionSheetField(TARGET);
      closeExecutionSheetField(TARGET);
      expect(shown()).toBe("150 rép.");
      enterExecutionSheetValue(TARGET, 200, "integer");
      expect(shown()).toBe("100 rép.");
    }));

  it("PRE4-3.5/AC4 — Cible à renseigner (P37) : saisie sur « 0 » atténué ; sortie sans frappe : « — » ; 1 saisi rend ✓ disponible", () =>
    withPlatform("ios", () => {
      renderSheet(repetitionsTarget(unsetTarget()));
      expect(shown()).toBe("—");
      expect(StyleSheet.flatten(screen.getByTestId(TARGET).props.style).backgroundColor).toBe("#FFF1F0");
      expect(screen.getByTestId(TARGET).props.accessibilityHint).toBe("Valeur à renseigner");
      expect(sheetValidateDisabled()).toBe(true);
      openExecutionSheetField(TARGET);
      expect(shown()).toBe("0");
      closeExecutionSheetField(TARGET);
      expect(shown()).toBe("—");
      expect(sheetValidateDisabled()).toBe(true);
      enterExecutionSheetValue(TARGET, 1, "integer");
      expect(shown()).toBe("1 rép.");
      expect(sheetValidateDisabled()).toBe(false);
    }));

  it("PRE4-3.5/AC4 — Durée à « — » passée en Répétitions : Cible initiale 1 (recette PRE-9 n° 1), saisie sur « 1 »", () =>
    withPlatform("ios", () => {
      renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: unsetTarget(), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
      chooseExecutionMode("Répétitions");
      expect(shown()).toBe("1 rép.");
      openExecutionSheetField(TARGET);
      expect(shown()).toBe("1");
    }));

  it("PRE4-3.5/AC5 — bornes : 1 et 100 atteignables ; 0 ramené à 1, 101 ramené à 100 (trois chiffres au plus)", () =>
    withPlatform("ios", () => {
      renderSheet(repetitionsTarget(numberTarget(10)));
      enterExecutionSheetValue(TARGET, 100, "integer");
      expect(shown()).toBe("100 rép.");
      enterExecutionSheetValue(TARGET, 1, "integer");
      expect(shown()).toBe("1 rép.");
      enterExecutionSheetValue(TARGET, 101, "integer");
      expect(shown()).toBe("100 rép.");
      enterExecutionSheetValue(TARGET, 0, "integer");
      expect(shown()).toBe("1 rép.");
      openExecutionSheetField(TARGET);
      typeInExecutionSheetCell(TARGET, "1234");
      expect(shown()).toBe("123");
    }));

  it("PRE4-3.5/AC7 — accessibilité : champ nommé « Nombre de répétitions », valeur annoncée", () =>
    withPlatform("ios", () => {
      renderSheetView(repetitionsTarget(numberTarget(12)));
      expect(screen.getByText("Nombre de répétitions")).toBeTruthy();
      expect(screen.getByTestId(TARGET).props.accessibilityLabel).toBe("Nombre de répétitions");
      expect(screen.getByTestId(TARGET).props.accessibilityValue).toEqual({ text: "12 rép." });
    }));
});


/**
 * PRE-4 story 3.6, réduite par Q44 (Hermann, 2026-10-17 : ni Cellule active ni Pied
 * commun ; les cellules gardent leurs ± permanents) — Tableau des séries variables :
 * Sélecteur ouvert depuis la valeur d'une cellule de Cible, règle du pas du domaine,
 * retrait par la croix, glisser. Un test nommé par critère encore applicable ; AC2 et
 * AC4 ne gardent que la partie « une seule surface ouverte » et la règle du pas de la
 * cellule (le reste est sans objet, Q44). Les transitions d'AD-15 applicables sont
 * prouvées une à une par `sheetSurface.test.ts`. Plateforme par défaut : iOS.
 */
describe("ExecutionParametersSheet — PRE-4 story 3.6 (Q44)", () => {
  type Cell = number | "FAILURE" | null;
  const toTarget = (value: Cell): SeriesTarget =>
    value === "FAILURE" ? failureTarget() : value === null ? unsetTarget() : numberTarget(value);
  const variableSheet = (rows: [Cell, number][], mode: "DURATION" | "REPETITIONS" = "DURATION", overrides: Partial<ExecutionParametersInput> = {}) =>
    params({
      mode,
      series: { kind: "VARIABLE", rows: rows.map(([target, pauseSeconds]) => ({ target: toTarget(target), pauseSeconds, loadKg: 0 })), workPhases: [] },
      ...overrides,
    });
  const hidden = { includeHiddenElements: true } as const;
  const targetID = (row: number) => `execution-sheet-table-row-${row}-target`;
  /** D-434 : focus (clavier numérique) et sortie de la cellule Cible de la ligne `row`. */
  const openCell = (row: number) => fireEvent(screen.getByTestId(`${targetID(row)}-input`, hidden), "focus");
  const closeCell = (row: number) => fireEvent(screen.getByTestId(`${targetID(row)}-input`, hidden), "blur");
  const cellValue = (row: number, column: "target" | "pause" = "target") =>
    String(screen.getByTestId(`execution-sheet-table-row-${row}-${column}-value`, hidden).props.children);
  const rowCount = () => screen.queryAllByTestId(/^execution-sheet-table-row-\d+$/, hidden).length;
  const groupBackground = () => StyleSheet.flatten(screen.getByTestId("execution-sheet-variable-group", hidden).props.style).backgroundColor;
  const sheetValidateDisabled = () => screen.getByTestId("execution-sheet-validate").props.accessibilityState?.disabled === true;
  const cellBackground = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID, hidden).props.style).backgroundColor;

  it("PRE4-3.6/AC1 — structure : chaque ligne porte poignée, numéro, Cible, Pause et croix ; en-têtes ; `30 s`, `1 min`, `12 rép.`, `à l’échec` ; sans retrait x52 ; aucun défilement propre", () => {
    const view = renderSheetView(variableSheet([[30, 10], [60, 20], ["FAILURE", 30]]));
    const table = within(screen.getByTestId("execution-sheet-variable-group")).getByTestId("execution-sheet-table");
    expect(within(table).getByText("Durée")).toBeTruthy();
    expect(within(table).getByText("Pause")).toBeTruthy();
    for (const row of [1, 2, 3]) {
      const line = within(table).getByTestId(`execution-sheet-table-row-${row}`);
      expect(within(line).getByTestId(`execution-sheet-table-row-${row}-handle`)).toBeTruthy();
      expect(within(line).getByText(String(row))).toBeTruthy();
      expect(within(line).getByTestId(targetID(row))).toBeTruthy();
      expect(within(line).getByTestId(`execution-sheet-table-row-${row}-pause`)).toBeTruthy();
      expect(within(line).getByTestId(`execution-sheet-table-row-${row}-remove`)).toBeTruthy();
    }
    expect([1, 2, 3].map((row) => cellValue(row))).toEqual(["30 s", "1 min", "à l’échec"]);
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-table-content").props.style)?.marginLeft).toBeUndefined();
    expect(table.findAll((node) => node.props.scrollEnabled !== undefined)).toHaveLength(0);
    view.unmount();

    renderSheet(variableSheet([["FAILURE", 10], ["FAILURE", 20]], "REPETITIONS"));
    const repetitions = screen.getByTestId("execution-sheet-table");
    expect(within(repetitions).getByText("Répétitions")).toBeTruthy();
    expect(within(repetitions).getByText("Pause")).toBeTruthy();
  });

  it("PRE4-3.6/AC1 — `12 rép.` en Répétitions ; Q40 : groupe normal à l'ouverture, sélectionné par une action dans le tableau (saisie d'une cellule comprise, D-434), normal dès un autre champ ou le repli", () => {
    renderSheet(variableSheet([[12, 10], [10, 20]], "REPETITIONS"));
    expect(cellValue(1)).toBe("12 rép.");
    expect(groupBackground()).toBeUndefined();
    openCell(1);
    expect(groupBackground()).toBe("#F2F2FF");
    closeCell(1);
    expect(groupBackground()).toBe("#F2F2FF");
    fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`));
    expect(groupBackground()).toBeUndefined();
    nudgeCellPause(1, 1);
    expect(groupBackground()).toBe("#F2F2FF");
    fireEvent.press(screen.getByTestId(TABLE_TOGGLE));
    expect(groupBackground()).toBeUndefined();
  });

  it("PRE4-3.6/AC2 (partie maintenue par Q44), D-434 — une seule surface ouverte : un champ ± ouvert se ferme quand une cellule de Cible prend le focus, et sa saisie s'ouvre dans le même geste (T21), sans panneau", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
    // [Champ ± de la Cadence — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : champ clavier révélé par Autre, focus simulé.]
    fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`));
    fireEvent(screen.getByTestId("execution-sheet-beep-input", hidden), "focus");
    openCell(2);
    expect(screen.queryByTestId("execution-sheet-beep-input", hidden)).toBeNull();
    expect(cellBackground(targetID(2))).toBe("#EAEAFF");
    expect(screen.queryAllByTestId(/-panel$/)).toHaveLength(0);
  });

  it("PRE4-3.6/AC2 (partie maintenue par Q44), D-434 — S4 (R-3.6-09) : − de N avec son champ ouvert retire la ligne 3 et garde le champ ; la cellule Cible de la ligne 2 ferme N et affiche « 00:45 », d'un seul geste", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
    // [− de N avec son champ ± ouvert — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : N saisi à 2, la saisie de N rouverte.]
    tap("execution-sheet-series-decrement");
    expect(rowCount()).toBe(2);
    openExecutionSheetField("execution-sheet-series");
    openCell(2);
    expect(screen.getByTestId("execution-sheet-series", hidden).props.accessibilityState).toMatchObject({ selected: false });
    expect(cellValue(2)).toBe("00:45");
  });

  it("PRE4-3.6/AC4, PRE5-2.6/AC3, D-434 — cellules sans ± : Cible `FAILURE` ou `UNSET` réglée par la seule saisie de sa cellule ; `UNSET` sur #FFF1F0, annoncée « aucune valeur », « 00:00 » en saisie (« 0 » en Répétitions) ; le fond disparaît après la saisie", () => {
    const view = renderSheetView(variableSheet([["FAILURE", 10], [null, 20]]));
    for (const row of [1, 2]) {
      expect(screen.queryByTestId(`${targetID(row)}-increment`, hidden)).toBeNull();
      expect(screen.queryByTestId(`${targetID(row)}-decrement`, hidden)).toBeNull();
    }
    expect(cellValue(1)).toBe("à l’échec");
    expect(cellBackground(targetID(2))).toBe("#FFF1F0");
    expect(screen.getByTestId(targetID(2)).props.accessibilityValue).toEqual({ text: "aucune valeur" });
    openCell(2);
    expect(cellValue(2)).toBe("00:00");
    typeInExecutionSheetCell(targetID(2), "1");
    closeCell(2);
    expect(cellValue(2)).toBe("1 s");
    expect(cellBackground(targetID(2))).not.toBe("#FFF1F0");
    view.unmount();

    renderSheet(variableSheet([[null, 10], [4, 20]], "REPETITIONS"));
    openCell(1);
    expect(cellValue(1)).toBe("0");
    typeInExecutionSheetCell(targetID(1), "1");
    closeCell(1);
    expect(cellValue(1)).toBe("1 rép.");
  });

  it("PRE4-3.6/AC7 — Cible `UNSET` après un changement de Mode : fond #FFF1F0 sans contour, ✓ indisponible, aucun message, déplié ou replié ; jamais convertie en échec", () => {
    const { onApply } = renderSheet(variableSheet([[30, 10], [45, 20]]));
    chooseMode("Répétitions");
    for (const row of [1, 2]) {
      expect(cellValue(row)).toBe("—");
      const style = StyleSheet.flatten(screen.getByTestId(targetID(row)).props.style);
      expect(style.backgroundColor).toBe("#FFF1F0");
      expect(style.borderWidth).toBeUndefined();
    }
    expect(sheetValidateDisabled()).toBe(true);
    expect(JSON.stringify(screen.toJSON())).not.toMatch(/Renseignez/);
    fireEvent.press(screen.getByTestId(TABLE_TOGGLE));
    expect(sheetValidateDisabled()).toBe(true);
    expect(JSON.stringify(screen.toJSON())).not.toMatch(/Renseignez|Série 1|Série 2/);
    validate();
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId(TABLE_TOGGLE));
    expect(cellValue(1)).toBe("—");
  });

  it("PRE4-3.6/AC8 — glisser la ligne 3 en tête : repère, corps immobile, ordre (à l'échec, 30 s), (30 s, 10 s), (45 s, 20 s) ; actions accessibles conservées", () => {
    const { onApply } = renderSheet(variableSheet([[30, 10], [45, 20], ["FAILURE", 30]]));
    const handle = screen.getByTestId("execution-sheet-table-row-3-handle");
    fireEvent(handle, "responderGrant", { nativeEvent: { pageY: 300 } });
    fireEvent(handle, "responderMove", { nativeEvent: { pageY: 300 - 2 * TABLE_ROW_HEIGHT } });
    expect(screen.getByTestId("execution-sheet-table-insertion-guide-before-1", hidden)).toBeTruthy();
    expect(screen.getByTestId("execution-sheet-body").props.scrollEnabled).toBe(false);
    fireEvent(screen.getByTestId("execution-sheet-table-row-3-handle"), "responderRelease", { nativeEvent: { pageY: 300 - 2 * TABLE_ROW_HEIGHT } });
    expect(screen.getByTestId("execution-sheet-body").props.scrollEnabled).toBe(true);
    expect([1, 2, 3].map((row) => `${cellValue(row)} / ${cellValue(row, "pause")}`)).toEqual([
      "à l’échec / 30 s",
      "30 s / 10 s",
      "45 s / 20 s",
    ]);
    expect(screen.getByTestId("execution-sheet-table-row-2-handle").props.accessibilityActions).toEqual([
      { name: "moveUp", label: "Monter la série 2" },
      { name: "moveDown", label: "Descendre la série 2" },
    ]);
    moveAction(3, "moveUp");
    expect([1, 2, 3].map((row) => cellValue(row))).toEqual(["à l’échec", "45 s", "30 s"]);
    validate();
    expect(applied(onApply).series).toEqual({
      kind: "VARIABLE",
      rows: [
        { target: failureTarget(), pauseSeconds: 30, loadKg: 0 },
        { target: numberTarget(45), pauseSeconds: 20, loadKg: 0 },
        { target: numberTarget(30), pauseSeconds: 10, loadKg: 0 },
      ],
      workPhases: [],
    });
  });

  it("PRE4-3.6/AC9 — croix de la ligne 2 (N = 4) : retrait immédiat avec sa Pause, renumérotation, « Série supprimée — Annuler » par le message existant ; Annuler restaure", () => {
    const { onApply } = renderSheet(variableSheet([[30, 10], [45, 20], [60, 30], [75, 40]]));
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove"));
    expect(rowCount()).toBe(3);
    expect([1, 2, 3].map((row) => cellValue(row))).toEqual(["30 s", "1 min", "1 min 15 s"]);
    expect(valueOf("execution-sheet-series")).toBe("3 séries variables");
    const message = screen.getByTestId("execution-sheet-adjusted");
    expect(within(message).getByText("Série supprimée")).toBeTruthy();
    expect(within(message).getByText("Annuler")).toBeTruthy();
    expect(within(screen.getByTestId("execution-sheet-variable-group")).getByTestId("execution-sheet-adjusted")).toBe(message);
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
    expect([1, 2, 3, 4].map((row) => `${cellValue(row)} / ${cellValue(row, "pause")}`)).toEqual([
      "30 s / 10 s",
      "45 s / 20 s",
      "1 min / 30 s",
      "1 min 15 s / 40 s",
    ]);
    validate();
    expect(applied(onApply).series).toMatchObject({ kind: "VARIABLE", rows: [{}, {}, {}, {}] });
  });

  it("PRE4-3.6/AC9 — Q29 : `Annuler` survit au focus puis à la sortie d'une cellule sans frappe (T27, D-434) ; une Pause modifiée l'invalide", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove"));
    // D-434 : focus puis sortie de la cellule sans frappe — aucune transition.
    openCell(2);
    closeCell(2);
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    expect([1, 2, 3].map((row) => cellValue(row))).toEqual(["30 s", "45 s", "1 min"]);

    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove"));
    expect(screen.getByTestId("execution-sheet-adjusted")).toBeTruthy();
    nudgeCellPause(1, 1);
    expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
    expect(rowCount()).toBe(2);
  });

  it("PRE4-3.6/AC9 — Q29 (report de 3.2 clos en 4.2) : Mode et Type de série re-choisis sans changement (segmentés en ligne, PRE-5 story 2.4) et panneau du Changement de côté ouvert puis fermé sans application n'invalident pas `Annuler`", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove"));
    const undoAvailable = () => screen.queryByTestId("execution-sheet-adjusted-undo", hidden) !== null;
    expect(undoAvailable()).toBe(true);

    // PRE-5 story 2.4 : le popover du Mode et le panneau du Régime sont retirés ; re-choisir
    // l'option affichée de leur segmenté ne modifie pas le Brouillon.
    const groupBackground = () => StyleSheet.flatten(screen.getByTestId("execution-sheet-variable-group", hidden).props.style).backgroundColor;
    expect(groupBackground()).toBe("#F2F2FF");
    fireEvent.press(screen.getByTestId(`${MODE_CONTROL}-DURATION`));
    expect(undoAvailable()).toBe(true);
    // Q40 : choisir un segmenté hors du tableau désélectionne le tableau.
    expect(groupBackground()).toBeUndefined();
    fireEvent.press(screen.getByTestId(`${SERIES_TYPE}-VARIABLE`));
    expect(undoAvailable()).toBe(true);
    // PRE-5 story 2.5 : le panneau du Changement de côté est retiré ; re-choisir Sans (affiché)
    // et la Cadence affichée ne modifie pas le Brouillon ; ouvrir puis refermer le ± de la
    // Cadence (Autre) ou déplier la Durée de l'exercice non plus.
    chooseSide("Sans");
    expect(undoAvailable()).toBe(true);
    fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-NONE`, hidden));
    expect(undoAvailable()).toBe(true);
    fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`, hidden));
    fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`, hidden));
    expect(undoAvailable()).toBe(true);
    showSignals();
    expect(undoAvailable()).toBe(true);
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    expect([1, 2, 3].map((row) => cellValue(row))).toEqual(["30 s", "45 s", "1 min"]);
  });

  it("PRE4-3.6/AC9 — Q29 (report de 3.2 clos en 4.2), PRE5-2.5, RC-6 : bilatéral, N ≥ 2 — Enchainement (menu d'Avec) et Avec re-choisis sans changement : `Annuler` reste valable", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]], "DURATION", { sideMode: "RIGHT_LEFT", sideRecoverySeconds: 5 }));
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove"));
    const undoAvailable = () => screen.queryByTestId("execution-sheet-adjusted-undo", hidden) !== null;
    expect(undoAvailable()).toBe(true);
    chooseOrder("Chaque série d’un côté, puis chaque série de l’autre");
    expect(undoAvailable()).toBe(true);
    chooseSide("Avec");
    expect(undoAvailable()).toBe(true);
    // RC-6 : plus de chevron de repli sur Avec.
    expect(screen.queryByTestId(`${SIDE_CONTROL}-WITH-chevron`, hidden)).toBeNull();
    expect(screen.getByTestId(ORDER_MENU)).toBeTruthy();
    expect(undoAvailable()).toBe(true);
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    expect([1, 2, 3].map((row) => cellValue(row))).toEqual(["30 s", "45 s", "1 min"]);
  });

  it("PRE4-3.6/AC9, D-434 — croix inactive tant qu'un champ ± ou une saisie de cellule est ouvert : l'appui range le champ sans retirer (T23)", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
    fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`));
    fireEvent(screen.getByTestId("execution-sheet-beep-input", hidden), "focus");
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove"));
    expect(rowCount()).toBe(3);
    expect(screen.queryByTestId("execution-sheet-beep-input", hidden)).toBeNull();
    expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
    openCell(3);
    expect(cellBackground(targetID(3))).toBe("#EAEAFF");
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove", hidden));
    expect(rowCount()).toBe(3);
    expect(cellBackground(targetID(3))).not.toBe("#EAEAFF");
    expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
  });

  it("PRE4-3.6/AC9 — croix non active : un indice annonce qu'un appui ferme d'abord le champ ouvert ; aucun indice outil rangé", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
    expect(screen.getByTestId("execution-sheet-table-row-2-remove").props.accessibilityHint).toBeUndefined();
    fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`));
    fireEvent(screen.getByTestId("execution-sheet-beep-input", hidden), "focus");
    expect(screen.getByTestId("execution-sheet-table-row-2-remove").props.accessibilityHint).toBe(
      "Ferme d’abord le champ ouvert, sans supprimer la série",
    );
  });

  it("PRE4-3.6/AC9 — T27 : `Annuler` ne range pas l'outil ouvert — champ ± (Bip) toujours ouvert après la restauration", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove"));
    fireEvent.press(screen.getByTestId(`${CADENCE_CONTROL}-OTHER`));
    fireEvent(screen.getByTestId("execution-sheet-beep-input", hidden), "focus");
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    expect(rowCount()).toBe(3);
    expect([1, 2, 3].map((row) => cellValue(row))).toEqual(["30 s", "45 s", "1 min"]);
    // [Champ ± (Bip) — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : la saisie de la Cadence reste ouverte.]
    expect(screen.getByTestId("execution-sheet-beep", hidden).props.accessibilityState).toMatchObject({ selected: true });
  });

  it("PRE4-3.6/AC9 — croix indisponible à N = 1 : un retrait qui ramène N à 1 masque le tableau ; `Annuler` le restaure", () => {
    renderSheet(variableSheet([[30, 10], [45, 20]]));
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-1-remove"));
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    expect(screen.queryAllByTestId(/-remove$/)).toHaveLength(0);
    expect(valueOf("execution-sheet-series")).toBe("1 série identique");
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    expect(rowCount()).toBe(2);
    expect([cellValue(1), cellValue(2)]).toEqual(["30 s", "45 s"]);
  });

  it("PRE4-3.6/AC10 — la ligne `Séries` affiche `1 série` puis `3 séries` (lexique)", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 1, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
    expect(valueOf("execution-sheet-series")).toBe("1 série identique");
    tap("execution-sheet-series-increment");
    tap("execution-sheet-series-increment");
    expect(screen.getByTestId("execution-sheet-series-value").props.children).toBe("3 séries identiques");
  });

  it("PRE4-3.6/AC11 — `variables` : aucune ligne ne porte de Bip ; le Bip de cadence reste au premier niveau", () => {
    renderSheet(variableSheet([[30, 10], [45, 20]], "DURATION", { cadenceBeepIntervalSeconds: 2 }));
    const table = screen.getByTestId("execution-sheet-table");
    expect(within(table).queryByText(/Bip/)).toBeNull();
    expect(within(table).queryByTestId(/beep/)).toBeNull();
    expect(within(screen.getByTestId("execution-sheet-frame-cadence")).getByTestId("execution-sheet-row-beep")).toBeTruthy();
    expect(within(screen.getByTestId("execution-sheet-variable-group")).queryByTestId("execution-sheet-row-beep")).toBeNull();
  });

  it("PRE4-3.6/AC12 — saisie refusée, retrait annulé : ✓ reçoit d'un bloc un état valide ; ✕ laisse l'Éditeur intact ; Pauses bornées à 300 indépendamment des Cibles", () => {
    const parent = variableSheet([[5999, 300], [45, 20]]);
    const view = renderSheetView(parent, 10, parent);
    // D-434 : focus puis sortie sans frappe laisse l'ancienne valeur ; une Pause frappée au-delà
    // de 300 (« 09:99 ») est ramenée à 300 (QD-434-3).
    openCell(1);
    expect(cellValue(1)).toBe("99:59");
    closeCell(1);
    expect(cellValue(1)).toBe(formatPhraseDuration(5999));
    enterExecutionSheetCell("execution-sheet-table-row-1-pause", "999");
    expect(cellValue(1, "pause")).toBe(formatPhraseDuration(300));
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove"));
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    validate();
    expect(view.onApply).toHaveBeenCalledTimes(1);
    expect(view.onApply.mock.calls[0]![0].series).toEqual({
      kind: "VARIABLE",
      rows: [
        { target: numberTarget(5999), pauseSeconds: 300, loadKg: 0 },
        { target: numberTarget(45), pauseSeconds: 20, loadKg: 0 },
      ],
      workPhases: [],
    });
    view.unmount();

    const cancelled = renderSheetView(variableSheet([[null, 10], [45, 20]]));
    chooseCellTarget(2, 50);
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    expect(cancelled.onCancel).toHaveBeenCalledTimes(1);
    expect(cancelled.onApply).not.toHaveBeenCalled();
  });

  it("PRE4-3.6/AC13, PRE5-2.6/AC1 — contrôle structurel (style + hitSlop) des cibles tactiles de 36 : cellules, poignée, croix ; cellule annoncée par sa ligne et sa colonne, valeur à part ; son appui donne le focus (D-434). Preuve sur appareil : R-2.6-01 (hitSlop hors du parent, découpe `clip`)", () => {
    renderSheet(variableSheet([[30, 10], [45, 20]]));
    const extent = (testID: string, drawn?: { width: number; height: number }) => {
      const node = screen.getByTestId(testID, hidden);
      const style = { ...drawn, ...StyleSheet.flatten(node.props.style) };
      const slop = node.props.hitSlop;
      const insets = typeof slop === "number" ? { top: slop, bottom: slop, left: slop, right: slop } : { top: 0, bottom: 0, left: 0, right: 0, ...slop };
      const height = style.height ?? style.minHeight;
      return { drawn: [style.width, height], touch: [style.width + insets.left + insets.right, height + insets.top + insets.bottom] };
    };
    expect(extent("execution-sheet-table-row-1-handle")).toEqual({ drawn: [12, 18], touch: [36, 36] });
    expect(extent("execution-sheet-table-row-1-remove")).toEqual({ drawn: [28, 28], touch: [36, 36] });
    // Cellules 71 × 24 (Figma `9290:17953`) : colonne de 71, cellule à sa largeur ; 24 + 6 + 6 = 36 de haut.
    for (const id of [targetID(1), "execution-sheet-table-row-1-pause"]) {
      expect(StyleSheet.flatten(screen.getByTestId(`${id}-cell`, hidden).props.style)).toMatchObject({ width: 71 });
      const { drawn, touch } = extent(id);
      expect([drawn[0], drawn[1], touch[1]]).toEqual(["100%", 24, 36]);
    }
    const cell = screen.getByTestId(targetID(2));
    expect(cell.props.accessibilityLabel).toBe("Série 2, Durée");
    expect(cell.props.accessibilityValue).toEqual({ text: "45 s" });
    expect(cell.props.accessibilityRole).toBe("button");
    const pause = screen.getByTestId("execution-sheet-table-row-2-pause");
    expect(pause.props.accessibilityLabel).toBe("Série 2, pause");
    expect(pause.props.accessibilityValue).toEqual({ text: "20 s" });
    expect(pause.props.accessibilityRole).toBe("button");
    // D-434 : le focus de la cellule (clavier) la rend active, annoncée sélectionnée, valeur « 00:45 ».
    openCell(2);
    expect(screen.getByTestId(targetID(2), hidden).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId(targetID(2), hidden).props.accessibilityValue).toEqual({ text: "00:45" });
    expect(screen.getByTestId("execution-sheet-table-row-1-remove", hidden).props.accessibilityLabel).toBe("Supprimer la série 1");
  });

  it("PRE4-3.6/AC13, PRE5-2.6/AC3, D-434 — cellule à l'échec ou hors bornes : aucun pas proposé (bouton) ; valeur « à l’échec » annoncée ; le focus affiche « 00:00 » et « À l'échec » est annoncé sélectionné ; cellule Pause au clavier, sans champ ±", () => {
    renderSheet(variableSheet([["FAILURE", 10], [5999, 20]]));
    const failure = screen.getByTestId(targetID(1));
    expect(failure.props.accessibilityActions).toBeUndefined();
    expect(failure.props.accessibilityRole).toBe("button");
    expect(failure.props.accessibilityValue).toEqual({ text: "à l’échec" });
    expect(screen.getByTestId(targetID(2)).props.accessibilityActions).toBeUndefined();
    expect(screen.getByTestId("execution-sheet-table-row-1-pause-input").props.keyboardType).toBe("number-pad");
    expect(screen.queryByTestId("execution-sheet-table-row-1-pause-field")).toBeNull();
    openCell(1);
    showExecutionSheetKeyboard();
    expect(cellValue(1)).toBe("00:00");
    expect(screen.getByTestId("execution-sheet-keyboard-failure").props.accessibilityState).toMatchObject({ selected: true });
  });

  it("PRE4-3.6 — identité de ligne : un rang n'est jamais pris pour une identité (`rowIds` plus court que les lignes → `null`)", () => {
    expect(tableRowIdentity([7, 9], 0)).toBe(7);
    expect(tableRowIdentity([7, 9], 1)).toBe(9);
    expect(tableRowIdentity([7, 9], 2)).toBeNull();
    expect(tableRowIdentity([7, 9], -1)).toBeNull();
    expect(tableRowIdentity([7, 9], 0.5)).toBeNull();
  });
});

/**
 * PRE-4 story 3.7 (FR-14-01 à FR-14-05, AD-5, AD-7, AD-15 T24 à T26) — ligne Durée totale
 * et Inversion dans la Feuille. Montants attendus calculés par formule dans le test,
 * jamais par `executionCalculations` ; leur rendu passe par le formateur unique
 * (`formatPhraseDuration`, AC8). Jest n'exerce ni VoiceOver ni le rendu natif : le
 * constat sur iPhone relève de R-3.7-01 à 04 (NFR-04).
 */
describe("ExecutionParametersSheet — PRE-4 story 3.7", () => {
  const sheetText = strings.executionParameters.sheet;
  const lowerBound = (seconds: number) => `${strings.shared.durationNature.lowerBoundPrefix}${formatPhraseDuration(seconds)}`;
  /**
   * PRE-5 story 2.5 (AC4) : avec le chevron de « Durée de l'exercice », l'annonce regroupée de
   * la ligne en lecture seule est portée par sa valeur (`-value-group`), le chevron restant un
   * élément distinct ; sans chevron, par le trait entier (`-line`), comme en PRE-4.
   */
  const totalLine = () => screen.queryByTestId("execution-sheet-row-total-value-group") ?? screen.getByTestId("execution-sheet-row-total-line");
  const totalRow = () => screen.getByTestId("execution-sheet-row-total-line");
  const totalLabelText = () => within(totalRow()).getAllByText(/^Durée de l’exercice/u, anyNode)[0]!.props.children as string;
  const readOnlyText = () => String(screen.getByTestId("execution-sheet-total-text").props.children);
  const sheetValidateDisabled = () => screen.getByTestId("execution-sheet-validate").props.accessibilityState?.disabled === true;
  /** Ordre des lignes Cadence, Durée de l'exercice et Compte à rebours dans le corps (absentes omises). */
  const bodyRowOrder = () => {
    const json = JSON.stringify(screen.toJSON());
    return ["beep", "total", "countdown"]
      .map((row) => ({ row, at: json.indexOf(`"execution-sheet-row-${row}"`) }))
      .filter(({ at }) => at >= 0)
      .sort((a, b) => a.at - b.at)
      .map(({ row }) => row);
  };
  /** Exercice d'AC4 : Durée, `identiques`, d = 30 s, p = 10 s, unilatéral, N = 3. */
  const ac4Exercise = () => params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } });
  const repetitionsWithBeep = () =>
    params({
      mode: "REPETITIONS",
      series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 0, workPhases: [] },
      cadenceBeepIntervalSeconds: 2,
    });
  const mixedDuration = () => variableParameters({ rows: [[30, 10], [45, 20], ["FAILURE", 30]] });

  it("PRE4-3.7/AC1, D-433 — forme de la ligne : modifiable (Durée identiques chiffrée), lecture seule (variables chiffrées, Répétitions avec Bip ≈ devant la valeur), ≥ pour un mélange, « Non calculable » ou « — » sinon ; aucune composante ajoutée", () => {
    // Durée, `identiques`, Cible numérique, N libre : pastille modifiable. T = N × (d + p).
    let view = renderSheetView(ac4Exercise());
    expect(text("execution-sheet-total")).toBe(formatPhraseDuration(3 * (30 + 10)));
    expect(screen.getByTestId("execution-sheet-total").props.accessibilityRole).toBe("button");
    expect(totalLabelText()).toBe("Durée de l’exercice");
    view.unmount();

    // Durée en `variables`, Cibles toutes numériques : lecture seule, sans symbole. T = Σ(Ti + Pi).
    view = renderSheetView(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
    expect(readOnlyText()).toBe(formatPhraseDuration(30 + 10 + 45 + 20 + 60 + 30));
    expect(totalLabelText()).toBe("Durée de l’exercice");
    view.unmount();

    // Répétitions avec Bip, Cibles toutes numériques : lecture seule, ≈. T = Σ(Ri × b + Pi).
    view = renderSheetView(repetitionsWithBeep());
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
    // D-433 : ≈ quitte le titre ; il est collé avant la valeur, dans la même zone d'affichage.
    expect(totalLabelText()).toBe("Durée de l’exercice");
    expect(readOnlyText()).toBe(`≈ ${formatPhraseDuration(3 * (10 * 2 + 15))}`);
    view.unmount();
    view = renderSheetView(params({ mode: "REPETITIONS", series: variableRows([[12, 30], [10, 45]]), cadenceBeepIntervalSeconds: 2 }));
    expect(totalLabelText()).toBe("Durée de l’exercice");
    expect(readOnlyText()).toBe(`≈ ${formatPhraseDuration(12 * 2 + 30 + 10 * 2 + 45)}`);
    view.unmount();

    // Mélange calculable : lecture seule, montant précédé de ≥ (FR-13-03 : travail connu + toutes les Pauses).
    view = renderSheetView(mixedDuration());
    expect(readOnlyText()).toBe(lowerBound(30 + 45 + 10 + 20 + 30));
    expect(readOnlyText()).toBe("≥ 2 min 15 s");
    expect(totalLabelText()).toBe("Durée de l’exercice");
    // Aucune nouvelle composante : la ligne ne porte que son libellé et sa valeur ; PRE-5 story
    // 2.5 (AC4) : seul élément touchable, le chevron qui déplie Compte à rebours et Fin.
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
    expect(
      within(screen.getByTestId("execution-sheet-row-total"))
        .queryAllByRole("button")
        .map((node) => node.props.accessibilityLabel),
    ).toEqual([sheetText.showExerciseSignals]);
    expect(within(totalRow()).getAllByText(/./u, anyNode)).toHaveLength(2);
    view.unmount();
    // Répétitions avec Bip et mélange : ≥ prime sur ≈ (P25).
    view = renderSheetView(variableParameters({ mode: "REPETITIONS", rows: [[12, 30], ["FAILURE", 45]], cadenceBeepIntervalSeconds: 2 }));
    expect(readOnlyText()).toBe(lowerBound(12 * 2 + 30 + 45));
    expect(totalLabelText()).toBe("Durée de l’exercice");
    view.unmount();

    // D-433 : plus de cas « aucune ligne ». Répétitions sans Bip et `identiques` à l'échec
    // (Durée ou Répétitions avec Bip) : « Non calculable » ; tableau variable tout à l'échec :
    // « — » (en attente d'arbitrage). Ligne après la Cadence, Compte à rebours replié (chevron).
    for (const [parent, shown] of [
      [params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 0, workPhases: [] } }), TOTAL_NOT_CALCULABLE],
      [variableParameters({ rows: [["FAILURE", 10], ["FAILURE", 20]] }), "—"],
      [{ ...allFailureParameters(3, 15, { cadenceBeepIntervalSeconds: 2 }), countdownSeconds: 10, endSeconds: 5 }, TOTAL_NOT_CALCULABLE],
      [durationParameters("FAILURE", 3, 10), TOTAL_NOT_CALCULABLE],
    ] as const) {
      view = renderSheetView(parent);
      expect(screen.getByTestId("execution-sheet-row-total")).toBeTruthy();
      expect(totalLabelText()).toBe("Durée de l’exercice");
      expect(readOnlyText()).toBe(shown);
      expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
      expect(bodyRowOrder()).toEqual(["beep", "total"]);
      expect(screen.getByTestId("execution-sheet-duration-disclosure-frame")).toBeTruthy();
      view.unmount();
    }
  });

  it("PRE4-3.7/AC2, D-433 — recalcul aussitôt (Pause, N, côtés, Mode, Bip, Cible) ; Cible `UNSET` : aucun montant (« — » ou « Non calculable »), ✓ indisponible ; ligne toujours à sa place après la Cadence", () => {
    const view = renderSheetView(ac4Exercise());
    expect(text("execution-sheet-total")).toBe(formatPhraseDuration(3 * (30 + 10)));
    tap("execution-sheet-pause-increment");
    expect(text("execution-sheet-total")).toBe(formatPhraseDuration(3 * (30 + 11)));
    tap("execution-sheet-series-increment");
    expect(text("execution-sheet-total")).toBe(formatPhraseDuration(4 * (30 + 11)));
    chooseSide("Avec");
    expect(valueOf("execution-sheet-side-recovery")).toBe("10 s");
    // Un côté après l'autre : 2 N (d + p) + PC.
    expect(text("execution-sheet-total")).toBe(formatPhraseDuration(2 * 4 * (30 + 11) + 10));
    // Mode Répétitions : la Cible numérique de Durée devient `—` (UNSET) — aucun montant.
    // D-433 : la ligne reste ; Répétitions sans Cadence → « Non calculable » (prime sur « — »).
    chooseMode("Répétitions");
    expect(screen.getByTestId("execution-sheet-row-total")).toBeTruthy();
    expect(readOnlyText()).toBe(TOTAL_NOT_CALCULABLE);
    expect(screen.queryAllByText("0 s")).toHaveLength(0);
    expect(sheetValidateDisabled()).toBe(true);
    expect(bodyRowOrder()).toEqual(["beep", "total"]);
    // Retour en Durée : Cible restaurée, total recalculé, ligne à la même place après la Cadence ;
    // PRE-5 story 2.5 (AC4) : Compte à rebours replié sous elle, puis déplié par le chevron.
    chooseMode("Durée");
    expect(text("execution-sheet-total")).toBe(formatPhraseDuration(2 * 4 * (30 + 11) + 10));
    expect(bodyRowOrder()).toEqual(["beep", "total"]);
    showSignals();
    expect(bodyRowOrder()).toEqual(["beep", "total", "countdown"]);
    view.unmount();

    // Bip : Répétitions sans Bip → « Non calculable » (D-433) ; Bip 2 s → ≈ N × (R × b + p),
    // symbole devant la valeur, titre inchangé.
    const reps = renderSheetView(params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
    expect(readOnlyText()).toBe(TOTAL_NOT_CALCULABLE);
    tap("execution-sheet-beep-increment");
    tap("execution-sheet-beep-increment");
    expect(totalLabelText()).toBe("Durée de l’exercice");
    expect(readOnlyText()).toBe(`≈ ${formatPhraseDuration(3 * (10 * 2 + 15))}`);
    reps.unmount();

    // Cible : un mélange se recalcule quand une Cible numérique change (30 → 31 s).
    const mixed = renderSheetView(mixedDuration());
    chooseCellTarget(1, 31);
    expect(readOnlyText()).toBe(lowerBound(31 + 45 + 10 + 20 + 30));
    mixed.unmount();

    // Cible `UNSET` dans un tableau : aucun montant, ✓ indisponible (H10, NFR-06). D-433 : la
    // ligne reste, « — » (données manquantes), à sa place après la Cadence.
    renderSheet(variableParameters({ rows: [[30, 10], ["UNSET", 20], [45, 30]] }));
    expect(readOnlyText()).toBe("—");
    expect(screen.queryAllByText(/^≥/u)).toHaveLength(0);
    expect(sheetValidateDisabled()).toBe(true);
    expect(bodyRowOrder()).toEqual(["beep", "total"]);
  });

  it("PRE4-3.7/AC3, D-433 — échec en `variables`, Régime `variables` ou Mode Répétitions : toucher la ligne n'ouvre aucune roulette ; échec en `identiques` : ligne « Non calculable », sans roulette", () => {
    for (const parent of [mixedDuration(), params({ series: variableRows([[30, 10], [45, 20]]) }), repetitionsWithBeep()]) {
      const view = renderSheetView(parent);
      expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
      fireEvent.press(screen.getByTestId("execution-sheet-total-text"));
      fireEvent.press(totalLine());
      expect(screen.queryByTestId("execution-sheet-total-panel")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-total-wheel")).toBeNull();
      expect(screen.queryByTestId("duration-wheel-minutes")).toBeNull();
      expect(totalLine().props.accessibilityLabel).toMatch(/non modifiable$/u);
      view.unmount();
    }
    // D-433 : la ligne reste, « Non calculable », et ne s'ouvre pas davantage.
    renderSheet(durationParameters("FAILURE", 3, 10));
    expect(readOnlyText()).toBe(TOTAL_NOT_CALCULABLE);
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
    fireEvent.press(screen.getByTestId("execution-sheet-total-text"));
    fireEvent.press(totalLine());
    expect(screen.queryByTestId("execution-sheet-total-panel")).toBeNull();
    expect(screen.queryByTestId("execution-sheet-total-wheel")).toBeNull();
    expect(totalLine().props.accessibilityLabel).toBe(TOTAL_NOT_CALCULABLE_SPOKEN);
  });

  // [Roulette distincte dans un panneau sans flèche (position, colonnes bornées, ✕, toucher extérieur) — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier.]
  it("PRE4-3.7/AC4 — iOS : Durée de l'exercice saisie au clavier dans sa pastille, « MM:SS » du total courant, sans panneau ni option échec ; bornes T(1) = 40 s à T(99) = 66 min, hors bornes ramenée à la borne", () =>
    withPlatform("ios", () => {
      renderSheet(ac4Exercise());
      openExecutionSheetField("execution-sheet-total");
      expect(text("execution-sheet-total")).toBe("02:00");
      expect(screen.queryByTestId("execution-sheet-total-panel")).toBeNull();
      expect(screen.queryByTestId("duration-wheel-failure-option")).toBeNull();
      expect(screen.UNSAFE_root.findAllByType(Modal)).toHaveLength(1);
      // Sous T(1) (00:10 saisi) : ramené à T(1) = 40 s, N = 1.
      typeInExecutionSheetCell("execution-sheet-total", "10");
      closeExecutionSheetField("execution-sheet-total");
      expect(valueOf("execution-sheet-series")).toBe("1 série identique");
      expect(text("execution-sheet-total")).toBe(formatPhraseDuration(40));
      // Au-delà de T(99) = 66 min (99:59 saisi) : ramené à T(99), N = 99.
      enterExecutionSheetValue("execution-sheet-total", 99 * 60 + 59);
      expect(valueOf("execution-sheet-series")).toBe("99 séries identiques");
      expect(text("execution-sheet-total")).toBe("66 min");
    }));

  // [PRE4-3.7/AC4 — Android et web : roulette en ligne — supprimé, remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : même champ sur toutes les plates-formes.]

  it("PRE4-3.7/AC4 — iOS : T(1) = 70 s (d = 60 s, p = 10 s), T(99) = 6 930 s > 5 999 : borne 99:59 ; saisie sur « 03:30 » ; 01:10 = T(1) : N = 1, aucun message", () =>
    withPlatform("ios", () => {
      renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(60), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
      expect(99 * (60 + 10)).toBeGreaterThan(5999);
      openExecutionSheetField("execution-sheet-total");
      expect(text("execution-sheet-total")).toBe("03:30");
      typeInExecutionSheetCell("execution-sheet-total", "110");
      closeExecutionSheetField("execution-sheet-total");
      expect(valueOf("execution-sheet-series")).toBe("1 série identique");
      expect(text("execution-sheet-total")).toBe(formatPhraseDuration(70));
      expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
    }));

  it("PRE4-3.7/AC4 — iOS : T(99) > 5 999 s (d = 95 s, p = 10 s) : saisie sur « 05:15 » ; total courant > 5 999 s ou T(1) > 5 999 s : aucun champ, lecture seule « non modifiable »", () =>
    withPlatform("ios", () => {
      let view = renderSheetView(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(95), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
      openExecutionSheetField("execution-sheet-total");
      expect(text("execution-sheet-total")).toBe("05:15");
      view.unmount();

      // Total courant 90 × (60 + 10) = 6 300 s > 5 999 : pas de champ ; T(1) = 70 s n'y change rien.
      view = renderSheetView(params({ series: { kind: "UNIFORM", count: 90, target: numberTarget(60), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
      expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
      expect(readOnlyText()).toBe(formatPhraseDuration(90 * 70));
      expect(totalLine().props.accessibilityLabel).toBe(`Durée de l’exercice, ${formatPhraseDuration(90 * 70)}, non modifiable`);
      view.unmount();

      // T(1) = 2 × (3 535 + 300) + 300 = 7 970 s > 5 999 (bilatéral, un côté après l'autre, N = 1) : pas de champ.
      renderSheet(
        params({
          series: { kind: "UNIFORM", count: 1, target: numberTarget(3535), pauseSeconds: 300, loadKg: 0, workPhases: [] },
          sideMode: "RIGHT_LEFT",
          sideRecoverySeconds: 300,
        }),
      );
      expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
      expect(readOnlyText()).toBe(formatPhraseDuration(2 * (3535 + 300) + 300));
      expect(totalLine().props.accessibilityLabel).toMatch(/non modifiable$/u);
    }));

  it("PRE4-3.7/AC5 — Tv = 160 s saisi : N = 4, T(4) = 160 s, aucun message, Cible 30 s ; ✓ de la Feuille applique à l'Éditeur", () =>
    withPlatform("ios", () => {
      const { onApply } = renderSheet(ac4Exercise());
      enterExecutionSheetValue("execution-sheet-total", 160);
      // arrondi(160 / (30 + 10)) = 4 ; T(4) = 4 × 40 = 160 s.
      expect(valueOf("execution-sheet-series")).toBe("4 séries identiques");
      expect(text("execution-sheet-total")).toBe(formatPhraseDuration(4 * 40));
      expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
      expect(screen.queryByText(/Durée ajustée/u)).toBeNull();
      expect(text("execution-sheet-target-value")).toBe("30 s");
      // Double validation (Q12) : rien n'est appliqué à l'Éditeur avant le ✓ de la Feuille.
      expect(onApply).not.toHaveBeenCalled();
      validate();
      expect(applied(onApply).series).toEqual({ kind: "UNIFORM", count: 4, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] });
    }));

  it("PRE4-3.7/AC6 — Tv = 180 s puis ✓ : N = 5 (égalité 160 / 200 vers le plus grand N), « 3 min 20 s », message littéral et `Annuler` (restaure N et total) ; toucher le message le ferme sans annuler", () =>
    withPlatform("ios", () => {
      const { onApply } = renderSheet(ac4Exercise());
      // [Roue de la Durée de l'exercice — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]
      const adjustTo180 = () => enterExecutionSheetValue("execution-sheet-total", 180);
      adjustTo180();
      // Candidats N = 4 (160 s) et N = 5 (200 s), à 20 s chacun de 180 s : N = 5 retenu.
      expect(Math.abs(4 * 40 - 180)).toBe(Math.abs(5 * 40 - 180));
      expect(valueOf("execution-sheet-series")).toBe("5 séries identiques");
      expect(text("execution-sheet-total")).toBe(formatPhraseDuration(5 * 40));
      expect(text("execution-sheet-total")).toBe("3 min 20 s");
      expect(screen.getByText("Durée ajustée à 3 min 20 s pour respecter un nombre entier de séries.")).toBeTruthy();
      expect(screen.getByTestId("execution-sheet-adjusted-undo").props.accessibilityLabel).toBe("Annuler");
      // Capsule déjà livrée (recette 2, T-58) : sans contour, blanc à 10 % d'opacité, demi-cercles.
      const capsule = StyleSheet.flatten(screen.getByTestId("execution-sheet-adjusted-undo").props.style);
      expect(capsule).toMatchObject({ borderRadius: 999, backgroundColor: "rgba(255, 255, 255, 0.1)" });
      expect(capsule.borderWidth).toBeUndefined();
      // `Annuler` : N et total d'avant l'ajustement.
      fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
      expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
      expect(valueOf("execution-sheet-series")).toBe("3 séries identiques");
      expect(text("execution-sheet-total")).toBe(formatPhraseDuration(3 * 40));
      // Toucher le reste du message : fermé, ajustement conservé.
      adjustTo180();
      fireEvent.press(screen.getByTestId("execution-sheet-adjusted"));
      expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
      expect(valueOf("execution-sheet-series")).toBe("5 séries identiques");
      validate();
      expect(applied(onApply).series).toMatchObject({ count: 5, target: numberTarget(30) });
    }));

  it("PRE4-3.7/AC7 — VoiceOver : ≈ « estimation », ≥ « total prévisionnel partiel », lecture seule « non modifiable », jamais un symbole ni un tiret ; état non transmis par le gris seul ; textes du lexique", () => {
    expect(sheetText.totalEstimatedSpoken).toBe("estimation");
    expect(sheetText.totalLowerBoundSpoken).toBe("total prévisionnel partiel");
    expect(sheetText.totalReadOnlySpoken).toBe("non modifiable");
    const spoken = () => totalLine().props.accessibilityLabel as string;

    // ≈ : Répétitions avec Bip, 3 × (10 × 2 + 15).
    let view = renderSheetView(repetitionsWithBeep());
    expect(totalLine().props.accessible).toBe(true);
    expect(totalLine().props.accessibilityRole).toBe("text");
    expect(spoken()).toBe(`Durée de l’exercice, estimation, ${formatPhraseDuration(3 * (10 * 2 + 15))}, non modifiable`);
    expect(spoken()).not.toMatch(/[≈≥—]/u);
    // La valeur n'est pas atténuée : même couleur que le libellé, aucune opacité.
    const value = StyleSheet.flatten(screen.getByTestId("execution-sheet-total-text").props.style);
    // D-433 : titre sans ≈ (le symbole est collé avant la valeur, non annoncé).
    expect(readOnlyText()).toBe(`≈ ${formatPhraseDuration(3 * (10 * 2 + 15))}`);
    const label = StyleSheet.flatten(within(totalRow()).getByText("Durée de l’exercice", anyNode).props.style);
    expect(value.color).toBe(label.color);
    expect(value.opacity).toBeUndefined();
    view.unmount();

    // ≥ : mélange calculable.
    view = renderSheetView(mixedDuration());
    expect(spoken()).toBe(`Durée de l’exercice, total prévisionnel partiel, ${formatPhraseDuration(30 + 45 + 10 + 20 + 30)}, non modifiable`);
    expect(spoken()).not.toMatch(/[≈≥—]/u);
    view.unmount();

    // Lecture seule exacte (`variables` chiffrées) : sans nature, « non modifiable ».
    view = renderSheetView(params({ series: variableRows([[30, 10], [45, 20]]) }));
    expect(spoken()).toBe(`Durée de l’exercice, ${formatPhraseDuration(30 + 10 + 45 + 20)}, non modifiable`);
    view.unmount();

    // Saisie invalide (Cible 3536 s, D-430) : « — » affiché (PRE4-2.1/AC9), annoncé par la clé dédiée, jamais par le tiret.
    expect(sheetText.totalInvalidSpoken).toBe("montant indisponible tant qu’une valeur est invalide");
    view = renderSheetView(durationParameters(3536, 3, 10));
    expect(readOnlyText()).toBe("—");
    expect(spoken()).toBe(`Durée de l’exercice, ${sheetText.totalInvalidSpoken}`);
    expect(spoken()).not.toMatch(/—/u);
    view.unmount();
    // Saisie invalide avec une nature connue : elle est gardée (≈ : Bip historique 11, hors bornes ;
    // ≥ : mélange avec une Cible hors bornes, 3536 s depuis D-430).
    view = renderSheetView({ ...repetitionsWithBeep(), cadenceBeepIntervalSeconds: 11 });
    expect(readOnlyText()).toBe("—");
    expect(spoken()).toBe(`Durée de l’exercice, estimation, ${sheetText.totalInvalidSpoken}`);
    view.unmount();
    view = renderSheetView(variableParameters({ rows: [[3536, 10], [45, 20], ["FAILURE", 30]] }));
    expect(readOnlyText()).toBe("—");
    expect(spoken()).toBe(`Durée de l’exercice, total prévisionnel partiel, ${sheetText.totalInvalidSpoken}`);
    view.unmount();

    // Ligne modifiable : annonce du champ clavier (nom, valeur) ; la ligne n'est pas regroupée.
    renderSheet(ac4Exercise());
    expect(totalLine().props.accessible).toBeUndefined();
    expect(screen.getByTestId("execution-sheet-total").props.accessibilityLabel).toBe(sheetText.exerciseDurationEditAccessibilityLabel);
    expect(screen.getByTestId("execution-sheet-total").props.accessibilityValue).toEqual({ text: formatPhraseDuration(3 * 40) });
  });

  it("PRE4-3.7/AC8 — tout montant affiché par la ligne est exactement celui du formateur unique (`2 min 15 s`, `66 min`, minutes au-delà de 59, H8), préfixe `≥ ` du lexique compris", () => {
    // Chaque cas : paramètres, montant attendu par formule, rendu attendu (pastille ou lecture seule).
    const cases: { parent: ExecutionParametersInput; seconds: number; prefix: string; editable: boolean }[] = [
      // 99 × (30 + 10) = 3 960 s → « 66 min ».
      { parent: params({ series: { kind: "UNIFORM", count: 99, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }), seconds: 99 * 40, prefix: "", editable: true },
      // 3 × (30 + 10) = 120 s → « 2 min ».
      { parent: ac4Exercise(), seconds: 3 * 40, prefix: "", editable: true },
      // 30 + 45 + 10 + 20 + 30 = 135 s → « ≥ 2 min 15 s ».
      { parent: mixedDuration(), seconds: 135, prefix: strings.shared.durationNature.lowerBoundPrefix, editable: false },
      // 3 535 + 30 + 90 + 0 = 3 655 s → « 60 min 55 s » (H8 : pas d'heures).
      { parent: params({ series: variableRows([[3535, 30], [90, 0]]) }), seconds: 3535 + 30 + 90, prefix: "", editable: false },
      // Répétitions avec Bip : 3 × (10 × 2 + 15) = 105 s → « ≈ 1 min 45 s » (D-433 : ≈ collé
      // avant la valeur, préfixe du lexique, et non plus dans le libellé).
      { parent: repetitionsWithBeep(), seconds: 105, prefix: strings.shared.durationNature.estimatedPrefix, editable: false },
      // 90 × 70 = 6 300 s → « 105 min » (au-delà du plafond de la roue : lecture seule).
      { parent: params({ series: { kind: "UNIFORM", count: 90, target: numberTarget(60), pauseSeconds: 10, loadKg: 0, workPhases: [] } }), seconds: 6300, prefix: "", editable: false },
    ];
    for (const { parent, seconds, prefix, editable } of cases) {
      const view = renderSheetView(parent);
      const shown = editable ? text("execution-sheet-total") : readOnlyText();
      expect(shown).toBe(`${prefix}${formatPhraseDuration(seconds)}`);
      view.unmount();
    }
    expect(formatPhraseDuration(99 * 40)).toBe("66 min");
    expect(`${strings.shared.durationNature.lowerBoundPrefix}${formatPhraseDuration(135)}`).toBe("≥ 2 min 15 s");
    expect(`${strings.shared.durationNature.estimatedPrefix}${formatPhraseDuration(105)}`).toBe("≈ 1 min 45 s");
    expect(formatPhraseDuration(3655)).toBe("60 min 55 s");
  });
});

/**
 * PRE-4 story 3.8 (AC1 à AC9 ; Q44 : ni Cellule active ni Pied commun) — vérification
 * d'ensemble de la Feuille : accessibilité, lexique, surface ouverte et actions
 * extérieures, règles PRE-3 maintenues, texte agrandi. Les preuves déjà fournies par
 * les stories 3.1 à 3.7 sont citées dans la spec 3.8 (Implementation Notes) et ne sont
 * pas dupliquées ici. Jest n'exerce que la couche JS : VoiceOver, focus réel, texte
 * agrandi et largeurs se jugent sur iPhone (R-3.8-01 à 03, NFR-04).
 */
describe("ExecutionParametersSheet — PRE-4 story 3.8", () => {
  const hidden = { includeHiddenElements: true } as const;
  const get = (testID: string) => screen.getByTestId(testID, hidden);
  const query = (testID: string) => screen.queryByTestId(testID, hidden);
  const pressHeader = (testID: "execution-sheet-validate" | "execution-sheet-cancel") => fireEvent.press(get(testID));
  /** Composant hôte de nom donné (`Text`, `View`, `RCTSwitch`). */
  const hostNamed = (node: { readonly type: unknown }, name: string) => node.type === name;
  const creation = () =>
    params({ mode: null, series: { kind: "UNIFORM", count: 1, target: unsetTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] }, sideMode: null });
  /** Tous les textes annoncés de la Feuille rendue : libellés, indices, valeurs, actions nommées. */
  const spokenTexts = () =>
    screen.UNSAFE_root
      .findAll((node) => typeof node.type === "string")
      .flatMap((node) => {
        const props = node.props as {
          accessibilityLabel?: unknown;
          accessibilityHint?: unknown;
          accessibilityValue?: { text?: unknown };
          accessibilityActions?: { label?: unknown }[];
        };
        return [
          props.accessibilityLabel,
          props.accessibilityHint,
          props.accessibilityValue?.text,
          ...(props.accessibilityActions ?? []).map((action) => action.label),
        ].filter((value): value is string => typeof value === "string");
      });
  /**
   * Un tiret annoncé comme valeur (« — » seul, ou après une virgule). Le séparateur « — »
   * des libellés internes des ± (« Diminuer — minimum atteint », `InlineStepper`) n'est pas
   * une valeur, et ces boutons ne sont pas atteints par VoiceOver (réglage ajustable accessible).
   */
  const dashAsValue = (spoken: string) => spoken.trim() === "—" || /(^|, )—(,|$)/.test(spoken);
  /** Glossaire (ch. 01 §8, D-077) et recette R-4.1-05 : termes absents de la Feuille. */
  const FORBIDDEN = /(^|[^\p{L}])(Activité|Set|Bloc|Circuit|Tour|Routine|Sans répétition|Mes séances)([^\p{L}]|$)/iu;

  it("PRE4-3.8/AC1 — Feuille modale (focus confiné), ✕ et ✓ libellés par le lexique, Type de série « Variables » annoncé, chevron nommé", () => {
    renderSheet(params({ series: variableRows([[30, 10], [45, 20]]) }));
    expect(screen.getByTestId("execution-sheet").props.accessibilityViewIsModal).toBe(true);
    expect(screen.getByTestId("execution-sheet-cancel").props.accessibilityLabel).toBe(strings.executionParameters.sheet.cancelAccessibilityLabel);
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityLabel).toBe(strings.executionParameters.sheet.validateAccessibilityLabel);
    // PRE-5 story 2.4 : segmenté « Type de série », option Variables annoncée sélectionnée.
    const announced = () => [
      screen.getByTestId(SERIES_TYPE).props.accessibilityLabel,
      screen.getByTestId(`${SERIES_TYPE}-VARIABLE`).props.accessibilityLabel,
      screen.getByTestId(`${SERIES_TYPE}-VARIABLE`).props.accessibilityState.selected,
    ];
    expect(announced()).toEqual(["Séries", "Variables", true]);
    // Le chevron intérieur de Variables est nommé par son action.
    fireEvent.press(screen.getByLabelText("Masquer le tableau des séries"));
    expect(announced()).toEqual(["Séries", "Variables", true]);
    expect(screen.getByLabelText("Afficher le tableau des séries")).toBeTruthy();
  });

  it("PRE4-3.8/AC2 — valeur « — » annoncée « aucune valeur », jamais un tiret : Changement de côté, Cible commune, cellule de Cible ; Mode non renseigné sans option sélectionnée", () => {
    const view = renderSheetView(creation());
    // PRE-5 story 2.4 (AC3) : le Mode non renseigné n'affiche plus « — » : aucune option
    // du segmenté n'est sélectionnée, chaque option est annoncée par son nom.
    expect(screen.getByTestId(MODE_CONTROL).props.accessibilityLabel).toBe("Mode");
    expect(["REPETITIONS", "DURATION"].map((mode) => screen.getByTestId(`${MODE_CONTROL}-${mode}`).props.accessibilityState.selected)).toEqual([false, false]);
    // PRE-5 story 2.5 (AC1) : Changement de côté non renseigné — aucune option sélectionnée,
    // chaque option annoncée par son nom, jamais un tiret.
    expect(screen.getByTestId(SIDE_CONTROL).props.accessibilityLabel).toBe("De chaque côté");
    expect(["WITH", "WITHOUT"].map((side) => screen.getByTestId(`${SIDE_CONTROL}-${side}`).props.accessibilityState.selected)).toEqual([false, false]);
    chooseMode("Durée");
    expect(text("execution-sheet-target-value")).toBe("—");
    // Décision du 06/11/2026 (constat c) : champ clavier nommé, valeur annoncée à part.
    expect(screen.getByTestId("execution-sheet-target").props.accessibilityLabel).toBe("Objectif de durée");
    expect(screen.getByTestId("execution-sheet-target").props.accessibilityValue).toEqual({ text: "aucune valeur" });
    expect(screen.getByTestId("execution-sheet-target").props.accessibilityHint).toBe("Valeur à renseigner");
    view.unmount();
    const repetitions = renderSheetView(params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: unsetTarget(), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
    expect(text("execution-sheet-target-value")).toBe("—");
    expect(screen.getByTestId("execution-sheet-target").props.accessibilityLabel).toBe("Nombre de répétitions");
    expect(screen.getByTestId("execution-sheet-target").props.accessibilityValue).toEqual({ text: "aucune valeur" });
    repetitions.unmount();
    renderSheet(params({ series: variableRows([[30, 10], [null, 20]]) }));
    const cell = screen.getByTestId("execution-sheet-table-row-2-target");
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("—");
    expect(cell.props.accessibilityLabel).toBe("Série 2, Durée");
    expect(cell.props.accessibilityValue).toEqual({ text: "aucune valeur" });
    expect(cell.props.accessibilityHint).toBe("Valeur à renseigner");
    expect(spokenTexts().filter(dashAsValue)).toEqual([]);
  });

  // [± de la Cadence (réglage ajustable, actions augmenter / diminuer, limites annoncées) — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier.]
  it("PRE4-3.8/AC2, PRE5-2.5/AC3 — Cadence : segmenté nommé, option « Sans » annoncée sélectionnée ; champ clavier (Autre) nommé « Cadence », valeur annoncée ; bornes 0..10 s", () => {
    const { onApply } = renderSheet(params({ cadenceBeepIntervalSeconds: 0 }));
    expect(screen.getByTestId(CADENCE_CONTROL).props.accessibilityLabel).toBe("Cadence");
    expect(screen.getByTestId(`${CADENCE_CONTROL}-NONE`).props.accessibilityLabel).toBe("Sans");
    expect(screen.getByTestId(`${CADENCE_CONTROL}-NONE`).props.accessibilityState).toMatchObject({ selected: true });
    openExecutionSheetField("execution-sheet-beep");
    const beep = () => screen.getByTestId("execution-sheet-beep");
    expect(beep().props.accessibilityLabel).toBe("Cadence");
    expect(beep().props.accessibilityValue).toEqual({ text: "00:00" });
    typeInExecutionSheetCell("execution-sheet-beep", "15");
    closeExecutionSheetField("execution-sheet-beep");
    validate();
    expect(applied(onApply).cadenceBeepIntervalSeconds).toBe(10);
  });

  it("PRE4-3.8/AC2, PRE5-2.6/AC3, D-434 — cellules sans ± : valeur seule annoncée (1 s, 3535 s, anciennes 4000 s et 5999 s, à l’échec ; Pauses 0 s, 5 min) ; en saisie, la valeur « MM:SS » affichée", () => {
    renderSheet(
      params({
        series: {
          kind: "VARIABLE",
          rows: [
            { target: numberTarget(1), pauseSeconds: 10, loadKg: 0 },
            { target: numberTarget(5999), pauseSeconds: 300, loadKg: 0 },
            { target: failureTarget(), pauseSeconds: 0, loadKg: 0 },
            { target: numberTarget(3535), pauseSeconds: 10, loadKg: 0 },
            { target: numberTarget(4000), pauseSeconds: 10, loadKg: 0 },
          ],
          workPhases: [],
        },
      }),
    );
    const spoken = (testID: string) => screen.getByTestId(testID).props.accessibilityValue.text as string;
    const target = (row: number) => spoken(`execution-sheet-table-row-${row}-target`);
    // PRE-5 story 2.6 : la roue borne la Cible ; la cellule n'annonce que sa valeur.
    expect(target(1)).toBe("1 s");
    expect(target(4)).toBe(formatPhraseDuration(3535));
    // Valeurs anciennes hors bornes (Q21, P38) : la valeur seule.
    expect(target(2)).toBe(formatPhraseDuration(5999));
    expect(target(5)).toBe(formatPhraseDuration(4000));
    expect(target(3)).toBe("à l’échec");
    expect(spoken("execution-sheet-table-row-2-pause")).toBe(formatPhraseDuration(300));
    expect(spoken("execution-sheet-table-row-3-pause")).toBe("0 s");
    fireEvent(screen.getByTestId("execution-sheet-table-row-2-pause-input"), "focus");
    expect(spoken("execution-sheet-table-row-2-pause")).toBe("05:00");
  });

  it("PRE4-3.8/AC3, D-434 — « À l'échec » de la barre du clavier (cellule variable) annoncé sélectionné ou non (état, pas le seul style) ; Cible à l’échec annoncée sur la cellule", () =>
    withPlatform("ios", () => {
      renderSheet(params({ series: variableRows([[30, 10], [45, 20]]) }));
      fireEvent(get("execution-sheet-table-row-1-target-input"), "focus");
      showExecutionSheetKeyboard();
      const option = () => screen.getByTestId("execution-sheet-keyboard-failure");
      expect(option().props.accessibilityLabel).toBe("À l’échec");
      expect(option().props.accessibilityState).toMatchObject({ selected: false });
      fireEvent.press(option());
      expect(option().props.accessibilityState).toMatchObject({ selected: true });
      fireEvent(get("execution-sheet-table-row-1-target-input"), "blur");
      expect(get("execution-sheet-table-row-1-target").props.accessibilityValue).toEqual({ text: "à l’échec" });
    }));

  // [PRE4-3.8/AC3 — colonnes « Minutes » / « Secondes » de la roue : supprimé, remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier.]

  it("PRE4-3.8/AC4 — textes annoncés : lexique, apostrophe ’, aucun tiret, aucun terme interdit, dans chaque état de la Feuille", () =>
    withPlatform("ios", () => {
      const states: ExecutionParametersInput[] = [
        creation(),
        params({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 10, cadenceBeepIntervalSeconds: 2 }),
        params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 0, workPhases: [] }, cadenceBeepIntervalSeconds: 2 }),
        // Répétitions, Cible commune vide : « Nombre de répétitions, aucune valeur ».
        params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: unsetTarget(), pauseSeconds: 15, loadKg: 0, workPhases: [] } }),
        params({
          series: {
            kind: "VARIABLE",
            rows: [
              { target: numberTarget(30), pauseSeconds: 10, loadKg: 0 },
              { target: unsetTarget(), pauseSeconds: 20, loadKg: 0 },
              { target: failureTarget(), pauseSeconds: 30, loadKg: 0 },
            ],
            workPhases: [],
          },
        }),
      ];
      const collected: string[] = [];
      for (const state of states) {
        const view = renderSheetView(state);
        collected.push(...spokenTexts());
        // Chaque surface ouverte une fois : saisie de la Cible commune (décision du 06/11/2026 : clavier,
        // [panneau de roue — remplacé]), Durée de l'exercice dépliée (PRE-5 story 2.5), champ de la Cadence.
        if (query("execution-sheet-target-input")) {
          openExecutionSheetField("execution-sheet-target");
          collected.push(...spokenTexts());
          closeExecutionSheetField("execution-sheet-target");
        }
        showSignals();
        collected.push(...spokenTexts());
        openExecutionSheetField("execution-sheet-beep");
        collected.push(...spokenTexts());
        view.unmount();
      }
      // Décision du 06/11/2026 : nom du champ et valeur annoncés séparément.
      expect(collected).toContain("Nombre de répétitions");
      expect(collected).toContain("aucune valeur");
      expect(collected.length).toBeGreaterThan(100);
      const offending = collected.filter(
        (spoken) => spoken.trim() === "" || spoken.includes("'") || dashAsValue(spoken) || FORBIDDEN.test(spoken),
      );
      expect(offending).toEqual([]);
    }));

  it("PRE4-3.8/AC4 — aucun texte d'annonce en dur dans la Feuille et ses composants (libellés, indices, valeurs, actions, gabarits) ; lexique à l’apostrophe ’, sans terme interdit", () => {
    const sources = [
      "src/features/activities/ExecutionParametersSheet.tsx",
      "src/features/activities/AnchoredPanel.tsx",
      "src/shared/ui/ProfileStepper.tsx",
      "src/shared/ui/SegmentedControl.tsx",
      "src/shared/ui/DisclosureControl.tsx",
      "src/features/sessions/DurationWheelPicker.tsx",
      "src/features/sessions/NumberWheelPicker.tsx",
    ];
    /** Partie littérale d'un gabarit `…` : les interpolations `${…}` (accolades imbriquées comprises) sont retirées. */
    const literalPart = (template: string) => {
      let out = "";
      for (let index = 0; index < template.length; index += 1) {
        if (template[index] === "$" && template[index + 1] === "{") {
          let depth = 0;
          for (index += 1; index < template.length; index += 1) {
            if (template[index] === "{") depth += 1;
            if (template[index] === "}") depth -= 1;
            if (depth === 0) break;
          }
        } else out += template[index];
      }
      return out;
    };
    const LETTER = /\p{L}/u;
    // Lecture du source tel quel, CR retirés (checkout Windows).
    const fs = jest.requireActual<typeof import("node:fs")>("node:fs");
    for (const source of sources) {
      const code = fs.readFileSync(source, "utf8").replace(/\r/g, "");
      const hardCoded = [
        // Libellé ou indice en chaîne littérale.
        ...(code.match(/accessibility(Label|Hint)(=\{?|:\s*)["'][^"']*["']/g) ?? []).filter((match) => LETTER.test(match.replace(/^accessibility(Label|Hint)/, ""))),
        // Valeur annoncée en chaîne littérale.
        ...(code.match(/accessibilityValue=\{\{[^}]*text:\s*["'][^"']*\p{L}[^"']*["']/gu) ?? []),
        // Action nommée par une chaîne littérale.
        ...(code.match(/name:\s*"[^"]*",\s*label:\s*["'][^"']*\p{L}[^"']*["']/gu) ?? []),
        // Gabarit dont la partie littérale contient des lettres.
        ...[...code.matchAll(/accessibility(?:Label|Hint)(?:=\{|:\s*)`([^`]*)`/g)]
          .map((match) => match[1]!)
          .filter((template) => LETTER.test(literalPart(template))),
      ];
      expect({ source, hardCoded }).toEqual({ source, hardCoded: [] });
    }
    // Le contrôle détecte bien chaque forme interdite.
    expect(literalPart("${t.rowTarget.replace(\"{n}\", String(n))}, ${display}")).toBe(", ");
    expect(LETTER.test(literalPart("Série ${n}"))).toBe(true);
    const lexicon: string[] = [];
    const walk = (value: unknown) => {
      if (typeof value === "string") lexicon.push(value);
      else if (value && typeof value === "object") Object.values(value).forEach(walk);
    };
    walk(strings.executionParameters.sheet);
    walk(strings.screens.profile.stepper);
    walk(strings.screens.exercise.wheelPicker);
    walk(strings.screens.exercise.adjustedTotalDurationUndoAction);
    expect(lexicon).toContain("Minutes");
    expect(lexicon).toContain("Annuler");
    expect(lexicon.filter((value) => value.includes("'") || FORBIDDEN.test(value))).toEqual([]);
  });

  // [Roue de la Cible commune ouverte — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : saisie de la Cible en cours (Q47 : premier appui = sortie du champ).]
  it("PRE4-3.8/AC5 — iOS : saisie de la Cible commune en cours, ✓ puis ✕ de la Feuille et retour système : saisie rangée, Feuille ni validée ni abandonnée ; la valeur saisie est appliquée à la sortie du champ", () =>
    withPlatform("ios", () => {
      const { onApply, onCancel } = renderSheet(params());
      openExecutionSheetField("execution-sheet-target");
      typeInExecutionSheetCell("execution-sheet-target", "200");
      pressHeader("execution-sheet-validate");
      expect(onApply).not.toHaveBeenCalled();
      expect(get("execution-sheet-target").props.accessibilityState).toMatchObject({ selected: false });
      closeExecutionSheetField("execution-sheet-target");
      expect(text("execution-sheet-target-value")).toBe("2 min");
      openExecutionSheetField("execution-sheet-target");
      pressHeader("execution-sheet-cancel");
      expect(onCancel).not.toHaveBeenCalled();
      closeExecutionSheetField("execution-sheet-target");
      openExecutionSheetField("execution-sheet-target");
      fireEvent(screen.getByTestId("execution-sheet-modal"), "requestClose");
      expect(onCancel).not.toHaveBeenCalled();
      closeExecutionSheetField("execution-sheet-target");
      validate();
      expect(applied(onApply).series).toMatchObject({ target: numberTarget(120) });
    }));

  it("PRE4-3.8/AC5 — ✓ grisé (Brouillon invalide) avec une saisie ouverte : l'appui range la saisie ; état d'accessibilité cohérent ; saisie rangée, ✓ de nouveau indisponible", () =>
    withPlatform("ios", () => {
      const { onApply } = renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: unsetTarget(), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
      const validateButton = () => get("execution-sheet-validate");
      expect(validateButton().props.accessibilityState).toMatchObject({ disabled: true });
      // [Panneau de la roue de la Cible commune — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier.]
      openExecutionSheetField("execution-sheet-target");
      // Activable pour ranger la saisie ; le libellé garde l'indisponibilité de la validation.
      expect(validateButton().props.accessibilityState).toMatchObject({ disabled: false });
      expect(validateButton().props.accessibilityLabel).toBe("Valider les paramètres, indisponible tant qu’une valeur est invalide");
      pressHeader("execution-sheet-validate");
      expect(get("execution-sheet-target").props.accessibilityState).toMatchObject({ selected: false });
      expect(onApply).not.toHaveBeenCalled();
      expect(validateButton().props.accessibilityState).toMatchObject({ disabled: true });
      pressHeader("execution-sheet-validate");
      expect(onApply).not.toHaveBeenCalled();
    }));

  // [Roues ouvertes ; champ ± ouvert qui laissait ✓ appliquer (T19) — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : toute saisie absorbe ✓ (Q47).]
  it("PRE4-3.8/AC5 — iOS : saisie de la Cible commune, de la Durée de l'exercice, de la Pause ou d'une cellule (D-434) : ✓ de la Feuille absorbé ; saisie rangée, ✓ applique", () =>
    withPlatform("ios", () => {
      const view = renderSheetView(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
      for (const field of ["execution-sheet-target", "execution-sheet-total", "execution-sheet-pause"]) {
        openExecutionSheetField(field);
        pressHeader("execution-sheet-validate");
        expect({ field, applied: view.onApply.mock.calls.length }).toEqual({ field, applied: 0 });
        closeExecutionSheetField(field);
      }
      pressHeader("execution-sheet-validate");
      expect(view.onApply).toHaveBeenCalledTimes(1);
      view.unmount();
      // D-434 : saisie d'une cellule en cours — ✓ absorbé (premier appui = sortie du champ, Q47).
      const table = renderSheetView(params({ series: variableRows([[30, 10], [45, 20]]) }));
      fireEvent(get("execution-sheet-table-row-1-target-input"), "focus");
      expect(StyleSheet.flatten(get("execution-sheet-table-row-1-target").props.style).backgroundColor).toBe("#EAEAFF");
      pressHeader("execution-sheet-validate");
      expect(table.onApply).not.toHaveBeenCalled();
      expect(StyleSheet.flatten(get("execution-sheet-table-row-1-target").props.style).backgroundColor).not.toBe("#EAEAFF");
    }));

  // [Roue en ligne ouverte (Android) — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier.]
  it("PRE4-3.8/AC5 — Android : saisie ouverte, ✓ et ✕ de la Feuille ne font que la ranger ; PRE-5 story 2.5 : choix du Changement de côté appliqué tout de suite, ✓ applique", () =>
    withPlatform("android", () => {
      const { onApply, onCancel } = renderSheet(params());
      openExecutionSheetField("execution-sheet-target");
      pressHeader("execution-sheet-validate");
      expect(onApply).not.toHaveBeenCalled();
      closeExecutionSheetField("execution-sheet-target");
      openExecutionSheetField("execution-sheet-target");
      pressHeader("execution-sheet-cancel");
      expect(onCancel).not.toHaveBeenCalled();
      closeExecutionSheetField("execution-sheet-target");
      // Segmenté en ligne : aucune surface à fermer, le choix est déjà dans le Brouillon.
      chooseSide("Avec");
      pressHeader("execution-sheet-validate");
      expect(applied(onApply).sideMode).toBe("RIGHT_LEFT");
    }));

  it("PRE4-3.8/AC6 — règles PRE-3 supersédées absentes (iOS), chaque contrôle d'absence ayant son contrôle positif : ni interrupteur, ni stepper permanent hors tableau, ni segmenté intégré, ni message nommant la Série, ni retrait x52 ; PRE-5 story 2.6 : ni ± permanents des cellules (Q44 remplacé) ; D-434 : Pause de cellule au clavier", async () => {
    // Contrôle positif du nom d'hôte de l'interrupteur natif.
    const switchView = render(<Switch value={false} />);
    expect(screen.UNSAFE_root.findAll((node) => hostNamed(node, "RCTSwitch")).length).toBeGreaterThan(0);
    switchView.unmount();
    // Contrôle positif du message : le lexique le porte toujours, le motif le reconnaît.
    expect(strings.executionParameters.sheet.incompleteSeries.DURATION.replace("{n}", "2")).toMatch(/Série \d+ : renseignez/);
    // Contrôle positif des segmentés intégrés : en ligne sur Android (repli AD-7).
    await withPlatform("android", () => {
      const view = renderSheetView(params({ series: variableRows([[30, 10], [45, 20]]), sideMode: "RIGHT_LEFT", sideRecoverySeconds: 10 }));
      expect(within(screen.getByTestId("execution-sheet-row-side")).getByTestId(SIDE_CONTROL)).toBeTruthy();
      view.unmount();
    });
    await withPlatform("ios", () => {
      renderSheet(params({ series: variableRows([[30, 10], [null, 20]]), sideMode: "RIGHT_LEFT", sideRecoverySeconds: 10 }));
      const json = JSON.stringify(screen.toJSON());
      expect(json).not.toContain("Séries variables");
      expect(screen.UNSAFE_root.findAll((node) => hostNamed(node, "RCTSwitch"))).toHaveLength(0);
      // Message nommant la Série incomplète : aucun (D-337, Q35) ; ✓ indisponible.
      expect(json).not.toMatch(/Série \d+ : renseignez/);
      expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
      // Tableau sans retrait x52 (P23), dans les deux sens d'écriture.
      const tableStyle = StyleSheet.flatten(screen.getByTestId("execution-sheet-table").props.style) ?? {};
      expect([tableStyle.marginLeft, tableStyle.paddingLeft, tableStyle.marginStart, tableStyle.paddingStart]).toEqual([
        undefined,
        undefined,
        undefined,
        undefined,
      ]);
      // PRE-5 story 2.5 (AC1, AC2) : Changement de côté en segmenté `inline` dans sa ligne
      // (remplacement accepté des panneaux de PRE-4), sans panneau ; RC-6 : l'Enchainement est
      // le menu natif de son option Avec.
      expect(within(get("execution-sheet-row-side-line")).getByTestId(SIDE_CONTROL, hidden)).toBeTruthy();
      expect(within(get(SIDE_CONTROL)).getByTestId(ORDER_MENU, hidden)).toBeTruthy();
      expect(query("execution-sheet-side-value")).toBeNull();
      expect(query("execution-sheet-order-value")).toBeNull();
      // PRE-5 story 2.4 (AC3, AC7) : Mode et Type de série sont des segmentés `inline` dans
      // leur ligne (remplacement accepté du popover et du panneau du Régime).
      expect(within(get("execution-sheet-row-mode-line")).getByTestId(MODE_CONTROL, hidden)).toBeTruthy();
      expect(within(get("execution-sheet-row-series-type-line")).getByTestId(SERIES_TYPE, hidden)).toBeTruthy();
      expect(query("execution-sheet-regime-panel")).toBeNull();
      // Hors tableau : au repos, valeur seule ; [± à l'appui — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : aucun ±, même en saisie
      // (contrôle positif : l'entrée au clavier numérique)]. D-433 : Compte à rebours et Fin sont
      // d'abord dépliés par le chevron de la Durée de l'exercice.
      showSignals();
      for (const field of ["series", "beep", "countdown", "end", "side-recovery"]) {
        expect(query(`execution-sheet-${field}-increment`)).toBeNull();
        openExecutionSheetField(`execution-sheet-${field}`);
        expect(get(`execution-sheet-${field}-input`).props.keyboardType).toBe("number-pad");
        expect(query(`execution-sheet-${field}-increment`)).toBeNull();
        closeExecutionSheetField(`execution-sheet-${field}`);
      }
      // PRE-5 story 2.6 (AD-27, FR-29) : plus de ± permanents dans les cellules ; D-434 : la
      // cellule Pause se saisit au clavier, sans ± même au focus (contrôle positif : l'entrée).
      expect(query("execution-sheet-table-row-1-target-increment")).toBeNull();
      expect(query("execution-sheet-table-row-1-pause-decrement")).toBeNull();
      fireEvent(get("execution-sheet-table-row-1-pause-input"), "focus");
      expect(get("execution-sheet-table-row-1-pause-input").props.keyboardType).toBe("number-pad");
      expect(query("execution-sheet-table-row-1-pause-decrement")).toBeNull();
      expect(query("execution-sheet-table-row-1-target-increment")).toBeNull();
    });
  });

  it("PRE4-3.8/AC7 — texte agrandi : aucun texte de la Feuille ne plafonne ni ne réduit sa taille (maxFontSizeMultiplier, allowFontScaling faux, numberOfLines, adjustsFontSizeToFit), au repos et avec chaque panneau ou roue ouvert (Durée, Répétitions, Durée de l'exercice), saisie d'une cellule avec la barre du clavier (D-434), signaux dépliés et un champ ±", () =>
    withPlatform("ios", () => {
      const texts = () => screen.UNSAFE_root.findAll((node) => hostNamed(node, "Text")).map((node) => node.props as Record<string, unknown>);
      const capped = (props: Record<string, unknown>) =>
        props.maxFontSizeMultiplier !== undefined ||
        props.allowFontScaling === false ||
        props.numberOfLines !== undefined ||
        props.adjustsFontSizeToFit === true;
      const seen: Record<string, unknown>[] = [];
      const opened: string[] = [];
      // [Panneaux des roues — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : chaque champ en saisie.]
      const withOpen = (field: string) => {
        openExecutionSheetField(field);
        expect(get(field).props.accessibilityState).toMatchObject({ selected: true });
        opened.push(field);
        seen.push(...texts());
        closeExecutionSheetField(field);
      };
      // Durée, identiques, bilatéral, N = 3 : Durée, Durée de l'exercice, champ ± (PRE-5
      // stories 2.4, 2.5 : plus de panneau du Régime, du Côté ni de l'Ordre ; segmentés toujours
      // affichés, notations de l'Enchainement comprises).
      let view = renderSheetView(params({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 10, cadenceBeepIntervalSeconds: 2 }));
      seen.push(...texts());
      withOpen("execution-sheet-target");
      withOpen("execution-sheet-total");
      showSignals();
      seen.push(...texts());
      openExecutionSheetField("execution-sheet-beep");
      seen.push(...texts());
      view.unmount();
      // Répétitions : saisie de la Cible commune.
      view = renderSheetView(params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
      withOpen("execution-sheet-target");
      view.unmount();
      // Tableau : saisie d'une cellule et barre du clavier (D-434) ; résultat dérivé en lecture seule.
      renderSheet(params({ series: variableRows([[30, 10], [null, 20], [60, 30]]) }));
      seen.push(...texts());
      fireEvent(get("execution-sheet-table-row-1-target-input"), "focus");
      showExecutionSheetKeyboard();
      expect(query("execution-sheet-keyboard-failure")).not.toBeNull();
      seen.push(...texts());
      expect(opened).toHaveLength(3);
      expect(seen.length).toBeGreaterThan(80);
      expect(seen.filter(capped)).toEqual([]);
    }));

  it("PRE4-3.8/AC7 — hauteurs : aucun texte de la Feuille sous une hauteur fixe, saisie d'une cellule comprise, hors les exceptions consignées (ligne du tableau, TABLE_ROW_HEIGHT, géométrie du glisser PRE-3 ; R-3.8-03 ; segmentés `inline`)", () =>
    withPlatform("ios", () => {
      const fixedHeights = () => {
        const fixed = new Set<string>();
        for (const textNode of screen.UNSAFE_root.findAll((node) => hostNamed(node, "Text"))) {
          for (let node = textNode.parent; node !== null; node = node.parent) {
            if (node.props.testID === "execution-sheet") break;
            if (!hostNamed(node, "View")) continue;
            const style = StyleSheet.flatten(node.props.style) ?? {};
            if (typeof style.height === "number") fixed.add(`${String(node.props.testID ?? "")}:${style.height}`);
          }
        }
        return [...fixed].sort();
      };
      renderSheet(params({ series: variableRows([[30, 10], [45, 20]]), cadenceBeepIntervalSeconds: 2, sideMode: "RIGHT_LEFT", sideRecoverySeconds: 10 }));
      // Seule exception au repos : la ligne du tableau (`tableRow`, hauteur dont dépend
      // `dragDestination`), à 36 depuis PRE-5 story 2.6 (AD-28 ; 44 pt de Q42 ailleurs).
      // PRE-5 story 2.4 : seconde exception au repos, la géométrie fixe des segmentés `inline`
      // (cadre 32, option 26, relevé UX-DR1 de la story 2.3 ; texte agrandi à juger sur
      // iPhone, report consigné par la revue de 2.3) — Mode, Condition d'arrêt, Type de série.
      // PRE-5 story 2.2 : segmenté `inline` de la ligne Charge (« Avec | Sans »), même exception.
      // PRE-5 story 2.5 : Changement de côté et Cadence, même exception ; RC-6 : déclencheur du
      // menu de l'Enchainement, à la hauteur d'une option (26). PRE-5 story 2.8 : segmenté
      // `inline` de la ligne « Phases de l'exercice », même exception. PRE-7 B.3 (B5) : le
      // déclencheur du déroulant de l'Enchainement est la vue de taille fixe (146 × 26) elle-même.
      const inlineSegmented = [
        ":26",
        "execution-sheet-cadence-control:32",
        "execution-sheet-load-control:32",
        "execution-sheet-mode-control:32",
        "execution-sheet-phases-control:32",
        "execution-sheet-series-type-control:32",
        "execution-sheet-side-control:32",
        "execution-sheet-side-order-menu:26",
        "execution-sheet-stop-condition-control:32",
      ];
      const tableRows = [`execution-sheet-table-row-1:${TABLE_ROW_HEIGHT}`, `execution-sheet-table-row-2:${TABLE_ROW_HEIGHT}`];
      const atRest = [...inlineSegmented, ...tableRows];
      expect(fixedHeights()).toEqual(atRest);
      // Signaux dépliés : aucune hauteur fixe ajoutée.
      showSignals();
      expect(fixedHeights()).toEqual(atRest);
      // D-434 : saisie d'une cellule (clavier) — aucune hauteur fixe ajoutée (plus de roue de cellule).
      fireEvent(get("execution-sheet-table-row-1-target-input"), "focus");
      expect(fixedHeights()).toEqual(atRest);
      expect(StyleSheet.flatten(get("execution-sheet-header").props.style)).toMatchObject({ minHeight: 56 });
      expect(StyleSheet.flatten(get("execution-sheet-row-beep-line").props.style)).toMatchObject({ minHeight: SHEET_ROW_MIN_HEIGHT });
    }));
});

/**
 * PRE-5 story 2.4 (AC1 à AC9 ; FR-19 à FR-22, FR-26 à FR-28, FR-32, FR-44 ; AD-23, AD-24,
 * AD-27, AD-28) — Feuille en quatre cadres, Mode, Condition d'arrêt et Type de série en
 * segmentés `inline`, résultat dérivé en lecture seule, ligne de cible masquée à l'échec,
 * repère unique des panneaux. Jest ne prouve que l'arbre JS : rendu, gestes et VoiceOver
 * réels relèvent de la recette du lot Feuille (R-2.4-01 à R-2.4-08), sans constat inventé.
 */
describe("ExecutionParametersSheet — PRE-5 story 2.4", () => {
  const hidden = { includeHiddenElements: true } as const;
  const get = (testID: string) => screen.getByTestId(testID, hidden);
  const query = (testID: string) => screen.queryByTestId(testID, hidden);
  const styleOf = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};
  // PRE-9 (ordre de Hermann du 01/11/2026, point 3 ; CE-UI-10, D-413) : six blocs — Exécution, Phases du
  // mouvement, Séries, Côtés, Cadence et durée, Récupération. Le bloc 6 (point 2) n'est pas encore rendu :
  // les cinq blocs présents sont contrôlés ici, dans l'ordre. [Remplacé le 01/11/2026 : quatre cadres.]
  const FRAMES = ["execution", "phases", "series", "sides", "cadence"] as const;
  type Cell = number | "FAILURE" | null;
  const toTarget = (value: Cell): SeriesTarget =>
    value === "FAILURE" ? failureTarget() : value === null ? unsetTarget() : numberTarget(value);
  const variableSheet = (cells: Cell[], mode: "DURATION" | "REPETITIONS" = "DURATION") =>
    params({ mode, series: { kind: "VARIABLE", rows: cells.map((cell) => ({ target: toTarget(cell), pauseSeconds: 10, loadKg: 0 })), workPhases: [] } });
  const stopSelected = () => selectedValue(STOP_CONTROL, ["FAILURE", "TARGET"]);
  /** Options rendues du résultat dérivé (lecture seule : tuiles fixes, sans zone de sélection). */
  const derivedOptions = () =>
    screen.queryAllByTestId(new RegExp(`^${STOP_CONTROL}-tile-`), hidden).map((tile) => String(tile.props.testID).replace(`${STOP_CONTROL}-tile-`, ""));
  const twoPhases = () =>
    params({
      series: {
        kind: "UNIFORM",
        count: 3,
        target: numberTarget(9),
        pauseSeconds: 15,
        loadKg: 0,
        workPhases: [
          { id: 1, label: "A", durationSeconds: 6 },
          { id: 2, label: "B", durationSeconds: 3 },
        ],
      },
    });

  it("PRE5-2.4/AC1, PRE-9 (01/11, point 3) — blocs dans l'ordre Exécution ; Phases du mouvement ; Séries ; Côtés ; Cadence et durée (Récupération : Exercice de Séance seulement, `ExecutionParametersSheet.recovery.test.tsx`), enfants directs de l'hôte des panneaux ; fond #EFF0F2, contour blanc de 1, rayon 12, espacés de 8 ; chaque ligne dans son cadre", () => {
    renderSheet(params({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 10, cadenceBeepIntervalSeconds: 2 }));
    // PRE-5 story 2.5 (AC4) : Compte à rebours et Fin, repliés, sont d'abord dépliés.
    showSignals();
    const host = get("execution-sheet-panel-host");
    const frames = host.children.filter(
      (child): child is ReturnType<typeof screen.getByTestId> =>
        typeof child !== "string" && /^execution-sheet-frame-/.test(String(child.props.testID)),
    );
    expect(frames.map((frame) => frame.props.testID)).toEqual(FRAMES.map((frame) => `execution-sheet-frame-${frame}`));
    FRAMES.forEach((frame, index) => {
      expect(styleOf(`execution-sheet-frame-${frame}`)).toMatchObject({
        backgroundColor: "#EFF0F2",
        borderWidth: 1,
        borderColor: "#FFFFFF",
        borderRadius: 12,
        paddingHorizontal: 12,
      });
      // Cadres espacés de 8 : marge haute sur les trois derniers.
      expect(styleOf(`execution-sheet-frame-${frame}`).marginTop).toBe(index === 0 ? undefined : 8);
      // Transition de place (Q39) sans entrée propre à l'ouverture.
      expect(get(`execution-sheet-frame-${frame}`).props.layout).toBeDefined();
    });
    const rowsOf: Record<(typeof FRAMES)[number], readonly string[]> = {
      execution: ["row-mode", "row-stop-condition"],
      phases: ["row-phases", "phases-group"],
      series: ["row-series-type", "variable-group", "row-target", "row-pause"],
      sides: ["row-side", "side-order-menu", "row-side-recovery"],
      cadence: ["row-beep", "row-total", "row-countdown", "row-end"],
    };
    for (const frame of FRAMES) {
      for (const row of rowsOf[frame]) {
        expect({ frame, row, inside: within(get(`execution-sheet-frame-${frame}`)).queryByTestId(`execution-sheet-${row}`, hidden) !== null }).toEqual({
          frame,
          row,
          inside: true,
        });
      }
    }
    // PRE-9 (01/11, point 3) : le bloc Séries commence par la ligne Séries et ne contient pas les
    // phases ; le bloc Phases ne porte que sa ligne (et son tableau, déployé).
    const rowIdsOf = (frame: string) =>
      within(get(`execution-sheet-frame-${frame}`))
        .queryAllByTestId(/^execution-sheet-row-[a-z-]+$/, hidden)
        .map((node) => String(node.props.testID))
        .filter((id) => !/-(selection|line|content|value-group)$/.test(id));
    expect(rowIdsOf("phases")).toEqual(["execution-sheet-row-phases"]);
    expect(rowIdsOf("series")[0]).toBe("execution-sheet-row-series-type");
    expect(rowIdsOf("series")).not.toContain("execution-sheet-row-phases");
    expect(within(get("execution-sheet-frame-phases")).getByText("Phases du mouvement", hidden)).toBeTruthy();
    expect(screen.queryByText("Phases de l’exercice", hidden)).toBeNull();
    // [Point 2 (à venir) — livré le 01/11/2026 :] sans `recovery` (Exercice du Catalogue, fiche
    // Mouvement), aucun bloc Récupération ; le bloc 6 est couvert par `ExecutionParametersSheet.recovery.test.tsx`.
    expect(query("execution-sheet-frame-recovery")).toBeNull();
    // Libellés de ligne Inter Regular 12 (PR-03), plus petits que les valeurs.
    expect(StyleSheet.flatten(screen.getByText("Condition d’arrêt").props.style)).toMatchObject({ fontSize: 12, fontWeight: "400" });
    expect(StyleSheet.flatten(screen.getByText("Séries").props.style)).toMatchObject({ fontSize: 12, fontWeight: "400" });
  });

  // [PRE5-2.4/AC2 — repère unique des panneaux des roues de la Cible commune et de la Durée de l'exercice :
  // supprimé, remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier ; le seul panneau restant, le déroulant de l'Enchainement, est couvert par PRE7-B.3 (B5).]

  it("PRE5-2.4/AC4, AC6 — identiques à la cible (Durée, 90 s) : Condition « À l’objectif » ; ligne « Durée d’une série » visible ; roue sans « À l’échec »", () =>
    withPlatform("ios", () => {
      renderSheet(params());
      expect(stopSelected()).toBe("TARGET");
      expect(["FAILURE", "TARGET"].map((value) => get(`${STOP_CONTROL}-${value}`).props.accessibilityLabel)).toEqual(["À l’échec", "À l’objectif"]);
      expect(StyleSheet.flatten(get(STOP_CONTROL).props.style)).toMatchObject({ width: 220, height: 32 });
      expect(get("execution-sheet-row-target")).toBeTruthy();
      fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
      expect(query("duration-wheel-failure-option")).toBeNull();
      expect(screen.queryByText("Aucune durée, à l’échec")).toBeNull();
    }));

  it("PRE5-2.4/AC4 — passage à l'échec puis retour à la cible : Cible FAILURE pour toutes les séries, ligne de durée masquée, Pause visible ; 90 s restaurée ; même règle en Répétitions", () => {
    const { onApply } = renderSheet(params());
    fireEvent.press(screen.getByTestId(`${STOP_CONTROL}-FAILURE`));
    expect(stopSelected()).toBe("FAILURE");
    expect(query("execution-sheet-row-target")).toBeNull();
    expect(get("execution-sheet-row-pause")).toBeTruthy();
    fireEvent.press(screen.getByTestId(`${STOP_CONTROL}-TARGET`));
    expect(text("execution-sheet-target-value")).toBe("1 min 30 s");
    fireEvent.press(screen.getByTestId(`${STOP_CONTROL}-FAILURE`));
    validate();
    expect(applied(onApply).series).toEqual({ kind: "UNIFORM", count: 3, target: failureTarget(), pauseSeconds: 15, loadKg: 0, workPhases: [] });
  });

  it("PRE5-2.4/AC4 — Répétitions : à l'échec, ligne « Nombre de répétitions » masquée ; retour à la cible : 12 rép. restaurées", () => {
    renderSheet(params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: numberTarget(12), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
    expect(screen.getByText("Nombre de répétitions")).toBeTruthy();
    fireEvent.press(screen.getByTestId(`${STOP_CONTROL}-FAILURE`));
    expect(screen.queryByText("Nombre de répétitions")).toBeNull();
    expect(get("execution-sheet-row-pause")).toBeTruthy();
    fireEvent.press(screen.getByTestId(`${STOP_CONTROL}-TARGET`));
    expect(text("execution-sheet-target-value")).toBe("12 rép.");
  });

  it("PRE5-2.4/AC4 — retour à la cible sans valeur chiffrée connue : « — » sur fond rouge pâle, ✓ indisponible ; aucune valeur inventée", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: failureTarget(), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
    expect(stopSelected()).toBe("FAILURE");
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(screen.getByTestId(`${STOP_CONTROL}-TARGET`));
    expect(text("execution-sheet-target-value")).toBe("—");
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-target").props.style).backgroundColor).toBe("#FFF1F0");
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("PRE5-2.4/AC5 — variables homogènes : lecture seule, deux options, À la cible (30 s, 45 s) ou À l’échec (échec, échec) sélectionnée ; violet atténué à 45 %, texte blanc ; information non modifiable", () => {
    const view = renderSheetView(variableSheet([30, 45]));
    const control = get(STOP_CONTROL);
    expect(control.props.accessibilityRole).toBe("text");
    expect(control.props.accessibilityLabel).toBe("Condition d’arrêt, À l’objectif");
    expect(derivedOptions()).toEqual(["FAILURE", "TARGET"]);
    expect(query(`${STOP_CONTROL}-TARGET`)).toBeNull();
    expect(screen.UNSAFE_queryAllByProps({ accessibilityRole: "tab", accessibilityLabel: "À l’objectif" })).toHaveLength(0);
    expect(styleOf(STOP_CONTROL).opacity).toBe(0.45);
    expect(styleOf(`${STOP_CONTROL}-indicator`).backgroundColor).toBe("#5F60EE");
    expect(StyleSheet.flatten(within(control).getByText("À l’objectif", hidden).props.style).color).toBe("#FFFFFF");
    view.unmount();
    renderSheet(variableSheet(["FAILURE", "FAILURE"]));
    expect(get(STOP_CONTROL).props.accessibilityLabel).toBe("Condition d’arrêt, À l’échec");
    // Contrôle segmenté du 04/11/2026 (Hermann : option sélectionnée à droite) : l'option choisie est la dernière.
    expect(derivedOptions()).toEqual(["TARGET", "FAILURE"]);
  });

  it("PRE5-2.4/AC5 — variables mixtes (30 s, échec) : une seule option « À l’objectif et à l’échec », même largeur totale ; recalculé à chaque cellule, les deux options reviennent quand le détail redevient homogène", () => {
    renderSheet(variableSheet([30, 45, null]));
    // Cellule vide non comptée : les deux séries renseignées sont à la cible.
    expect(get(STOP_CONTROL).props.accessibilityLabel).toBe("Condition d’arrêt, À l’objectif");
    // D-434 : cellule 1 mise à l'échec par « À l'échec » de la barre du clavier.
    chooseCellTarget(1, "FAILURE");
    // Une série à l'échec, une à la cible → mixte.
    expect(get(STOP_CONTROL).props.accessibilityLabel).toBe("Condition d’arrêt, À l’objectif et à l’échec");
    expect(derivedOptions()).toEqual(["MIXED"]);
    expect(within(get(STOP_CONTROL)).getByText("À l’objectif et à l’échec", hidden)).toBeTruthy();
    expect(styleOf(STOP_CONTROL).width).toBe(220);
    // La cellule 1 revient à 30 s : détail homogène, toujours en Variables (N = 3) — deux
    // options en lecture seule, À la cible sélectionnée.
    chooseCellTarget(1, 30);
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("30 s");
    expect(seriesTypeText()).toBe("Variables");
    expect(get(STOP_CONTROL).props.accessibilityRole).toBe("text");
    expect(get(STOP_CONTROL).props.accessibilityLabel).toBe("Condition d’arrêt, À l’objectif");
    expect(derivedOptions()).toEqual(["FAILURE", "TARGET"]);
    expect(styleOf(STOP_CONTROL).width).toBe(220);
  });

  it("PRE5-2.4/AC5 — variables vides (`UNSET` partout) : « — », annoncé « Condition d’arrêt, aucune valeur », de rôle texte ; aucune validation ajoutée (✓ indisponible comme avant)", () => {
    renderSheet(variableSheet([null, null]));
    expect(query(STOP_CONTROL)).toBeNull();
    const none = get("execution-sheet-stop-condition-none");
    expect(String(none.props.children)).toBe("—");
    expect(none.props.accessibilityLabel).toBe("Condition d’arrêt, aucune valeur");
    expect(none.props.accessibilityRole).toBe("text");
    expect(none.props.accessible).toBe(true);
    expect(within(get("execution-sheet-row-stop-condition")).getByTestId("execution-sheet-stop-condition-none", hidden)).toBe(none);
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("PRE5-2.4/AC5 — Variables → Identiques suit la normalisation N1 : la première série donne la Cible commune et la Condition d'arrêt redevient modifiable", () => {
    const { onApply } = renderSheet(variableSheet(["FAILURE", 30]));
    expect(get(STOP_CONTROL).props.accessibilityRole).toBe("text");
    chooseRegime("Identiques");
    expect(get(STOP_CONTROL).props.accessibilityRole).toBe("tablist");
    expect(stopSelected()).toBe("FAILURE");
    validate();
    expect(applied(onApply).series).toMatchObject({ kind: "UNIFORM", count: 2, target: failureTarget() });
  });

  it("PRE5-2.4/AC3, AC4, AC7 — avec des phases : PRE-7 (D-446) Répétitions et À l’échec disponibles et appliqués ; complément du 26/10/2026 : Variables disponible et appliqué, phases conservées (Durée, À la cible, Identiques au départ)", () => {
    renderSheet(twoPhases());
    const option = (control: string, value: string) => get(`${control}-${value}`).props.accessibilityState;
    expect(option(MODE_CONTROL, "REPETITIONS")).toMatchObject({ disabled: false, selected: false });
    expect(option(MODE_CONTROL, "DURATION")).toMatchObject({ disabled: false, selected: true });
    expect(option(STOP_CONTROL, "FAILURE")).toMatchObject({ disabled: false, selected: false });
    expect(option(STOP_CONTROL, "TARGET")).toMatchObject({ disabled: false, selected: true });
    // D-446 (complément du 26/10/2026) : compatibilité phases + séries variables.
    expect(option(SERIES_TYPE, "VARIABLE")).toMatchObject({ disabled: false, selected: false });
    expect(option(SERIES_TYPE, "UNIFORM")).toMatchObject({ disabled: false, selected: true });
    fireEvent.press(get(`${STOP_CONTROL}-FAILURE`));
    fireEvent.press(get(`${MODE_CONTROL}-REPETITIONS`));
    expect([modeText(), stopSelected(), seriesTypeText()]).toEqual(["Répétitions", "FAILURE", "Identiques"]);
    fireEvent.press(get(`${SERIES_TYPE}-VARIABLE`));
    expect(seriesTypeText()).toBe("Variables");
    expect(get("execution-sheet-phases-control-WITH").props.accessibilityState).toMatchObject({ selected: true });
  });

  it("PRE5-2.4/AC3 — Mode non renseigné : aucun segment sélectionné ; Condition « À l’objectif » ; choisir un Mode ferme le champ ± ouvert", () => {
    renderSheet(params({ mode: null, series: { kind: "UNIFORM", count: 2, target: unsetTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] } }));
    expect(selectedValue(MODE_CONTROL, ["REPETITIONS", "DURATION"])).toBeNull();
    expect(stopSelected()).toBe("TARGET");
    openExecutionSheetField("execution-sheet-series");
    chooseMode("Répétitions");
    expect(modeText()).toBe("Répétitions");
    expect(query("execution-sheet-series-increment")).toBeNull();
  });

  it("PRE5-2.4/AC7 — chevron de Variables : haut si déployé, bas si replié (icône graphique), absent en identiques ; repli et dépli sans perte ; libellés Afficher / Masquer", () => {
    const { onApply } = renderSheet(variableSheet([30, 45]));
    const icon = () => get(`${TABLE_TOGGLE}-icon`).props.source;
    expect(icon()).toEqual([require("../../../../assets/icons/control-chevron-up.svg")]);
    expect(get(TABLE_TOGGLE).props.accessibilityLabel).toBe("Masquer le tableau des séries");
    fireEvent.press(get(TABLE_TOGGLE));
    expect(query("execution-sheet-table")).toBeNull();
    expect(icon()).toEqual([require("../../../../assets/icons/control-chevron-down.svg")]);
    expect(get(TABLE_TOGGLE).props.accessibilityLabel).toBe("Afficher le tableau des séries");
    expect(seriesTypeText()).toBe("Variables");
    fireEvent.press(get(TABLE_TOGGLE));
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("45 s");
    chooseRegime("Identiques");
    expect(query(TABLE_TOGGLE)).toBeNull();
    chooseRegime("Variables");
    validate();
    expect(applied(onApply).series).toEqual(variableRows([[30, 10], [45, 10]]));
  });

  // [Stepper du nombre de séries (± à l'appui, réglage ajustable) — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier.]
  it("PRE5-2.4/AC9 (NR Δ38, présentation remplacée par RC-15) — nombre de séries : valeur au repos dans le Type de série, saisie au clavier numérique, nom accessible « Séries », bornes 1..99 ; le tableau variable suit N", () => {
    renderSheet(variableSheet([30, 45]));
    expect(query("execution-sheet-row-series")).toBeNull();
    expect(query("execution-sheet-series-increment")).toBeNull();
    expect(get("execution-sheet-series").props.accessibilityLabel).toBe("Séries");
    expect(get("execution-sheet-series").props.accessibilityValue).toEqual({ text: "2 séries variables" });
    expect(get("execution-sheet-series-input").props.keyboardType).toBe("number-pad");
    tap("execution-sheet-series-increment");
    expect(valueOf("execution-sheet-series")).toBe("3 séries variables");
    expect(get("execution-sheet-table-row-3")).toBeTruthy();
    enterExecutionSheetValue("execution-sheet-series", 100, "integer");
    expect(valueOf("execution-sheet-series")).toBe("99 séries variables");
  });
});

/**
 * PRE-5 story 2.6 (AC2 à AC5 ; FR-29, FR-22, FR-4 ; AD-27, AD-28 ; UX-DR3) — tableau des
 * séries sans steppers de cellule, lignes de 36 : cellules à valeur seule ; D-434 : les
 * cellules Cible et Pause se saisissent au clavier numérique (famille ±, surface `keyboard`) ;
 * briques partagées (`sheetTable.tsx`). Jest ne prouve que l'arbre JS : la cible tactile de
 * 36 (AC1, R-2.6-01) et le rendu (R-2.6-02, R-2.6-03) relèvent de Hermann sur iPhone.
 */
describe("ExecutionParametersSheet — PRE-5 story 2.6", () => {
  const hidden = { includeHiddenElements: true } as const;
  const get = (testID: string) => screen.getByTestId(testID, hidden);
  const query = (testID: string) => screen.queryByTestId(testID, hidden);
  const styleOf = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};
  const rows = () => screen.queryAllByTestId(/^execution-sheet-table-row-\d+$/, hidden).length;
  const cell = (row: number, column: "target" | "pause") => `execution-sheet-table-row-${row}-${column}`;
  const focusCell = (row: number, column: "target" | "pause") => fireEvent(get(`${cell(row, column)}-input`), "focus");
  const blurCell = (row: number, column: "target" | "pause") => fireEvent(get(`${cell(row, column)}-input`), "blur");
  const active = (row: number, column: "target" | "pause") => styleOf(cell(row, column)).backgroundColor === "#EAEAFF";

  it("PRE5-2.6/AC2 — bloc blanc sans contour, rayon 8, à 8 du cadre ; en-têtes et cellules sur la même suite de colonnes (71, écart 7) ; lignes de 36 ; aucun espace sous la dernière (recette du 19/10, RC-9) ; aucun InlineStepper au repos", () => {
    renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    const block = styleOf("execution-sheet-table-content");
    expect(block).toMatchObject({ backgroundColor: "#FFFFFF", borderRadius: 8, marginVertical: 12, paddingHorizontal: 4 });
    // RC-9 : la hauteur de ligne de PR-02 sous la dernière ligne est retirée.
    expect([block.paddingBottom, block.paddingVertical, block.padding]).toEqual([undefined, undefined, undefined]);
    expect(block.borderWidth).toBeUndefined();
    // Le cadre de découpe déborde de 4 dans la marge de 12 du groupe : bloc à 8 du contour.
    expect(styleOf("execution-sheet-table")).toMatchObject({ marginHorizontal: -4, paddingHorizontal: 4 });
    expect(block.marginHorizontal).toBe(-4);
    for (const row of [1, 2, 3]) {
      expect(styleOf(`execution-sheet-table-row-${row}`)).toMatchObject({ height: 36, borderTopWidth: 1 });
      for (const column of ["target", "pause"] as const) {
        expect(styleOf(`${cell(row, column)}-cell`)).toMatchObject({ width: 71, flexShrink: 1 });
        expect(styleOf(cell(row, column))).toMatchObject({ width: "100%", minHeight: 24, borderRadius: 8 });
      }
    }
    const header = get("execution-sheet-table-header");
    expect(StyleSheet.flatten(header.props.style)).toMatchObject({ minHeight: 32 });
    const headers = within(header).getAllByText(/^(Durée|Pause)$/);
    expect(headers.map((node) => StyleSheet.flatten(node.props.style)).map((style) => [style.width, style.textAlign, style.fontSize, style.color])).toEqual([
      [71, "center", 12, "#595E66"],
      [71, "center", 12, "#595E66"],
    ]);
    // La ligne « Type de série » (nombre de séries compris, RC-15) et les autres lignes de la Feuille restent à 44.
    expect(styleOf("execution-sheet-row-series-type-line")).toMatchObject({ minHeight: 44 });
    expect(screen.UNSAFE_root.findAllByType(InlineStepper)).toHaveLength(0);
    // D-434 : la cellule Pause en saisie ne révèle aucun stepper.
    focusCell(2, "pause");
    expect(screen.UNSAFE_root.findAllByType(InlineStepper)).toHaveLength(0);
  });

  it("PRE5-2.6/AC3, D-434 — cellule Cible : saisie au clavier dans SA cellule, « À l'échec » dans la barre ; ne change que cette ligne ; la cellule active passe à #EAEAFF ; le tableau reste sélectionné", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    focusCell(2, "target");
    expect(query("execution-sheet-cell-panel")).toBeNull();
    expect(active(2, "target")).toBe(true);
    expect(active(1, "target")).toBe(false);
    expect(styleOf("execution-sheet-variable-group").backgroundColor).toBe("#F2F2FF");
    showExecutionSheetKeyboard();
    fireEvent.press(get("execution-sheet-keyboard-failure"));
    blurCell(2, "target");
    validate();
    expect(applied(onApply).series).toEqual({
      kind: "VARIABLE",
      rows: [
        { target: numberTarget(30), pauseSeconds: 10, loadKg: 0 },
        { target: failureTarget(), pauseSeconds: 20, loadKg: 0 },
        { target: numberTarget(60), pauseSeconds: 30, loadKg: 0 },
      ],
      workPhases: [],
    });
  });

  it("PRE5-2.6/AC3, D-434 — autre surface : Pause de la ligne 1 en saisie, toucher la Cible de la ligne 2 applique la Pause et passe à la Cible dans le même geste ; le tableau reste sélectionné ; un champ hors tableau ferme la saisie", () => {
    renderSheet(params({ series: variableRows([[30, 10], [45, 20]]) }));
    focusCell(1, "pause");
    typeInExecutionSheetCell(cell(1, "pause"), "11");
    expect(valueOf(cell(1, "pause"))).toBe("00:11");
    expect(styleOf("execution-sheet-variable-group").backgroundColor).toBe("#F2F2FF");
    // Système : la Pause perd le focus, la Cible de la ligne 2 le prend.
    blurCell(1, "pause");
    focusCell(2, "target");
    expect(active(1, "pause")).toBe(false);
    expect(active(2, "target")).toBe(true);
    expect(valueOf(cell(1, "pause"))).toBe("11 s");
    expect(styleOf("execution-sheet-variable-group").backgroundColor).toBe("#F2F2FF");
    // Un champ hors tableau (N, [± — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]) prend la saisie dans le même geste et désélectionne le tableau.
    openExecutionSheetField("execution-sheet-series");
    blurCell(2, "target");
    expect(active(2, "target")).toBe(false);
    expect(get("execution-sheet-series").props.accessibilityState).toMatchObject({ selected: true });
    expect(styleOf("execution-sheet-variable-group").backgroundColor).toBeUndefined();
  });

  it("PRE5-2.6/AC3, D-434 — croix pendant la saisie de la Pause : l'appui range la saisie (valeur appliquée), aucune ligne retirée ; appui extérieur : rangé ; ✓ de la Feuille absorbé pendant la saisie (Q47)", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    focusCell(1, "pause");
    typeInExecutionSheetCell(cell(1, "pause"), "11");
    fireEvent.press(get("execution-sheet-table-row-2-remove"));
    blurCell(1, "pause");
    expect(active(1, "pause")).toBe(false);
    expect(rows()).toBe(3);
    expect(query("execution-sheet-adjusted")).toBeNull();
    focusCell(1, "pause");
    fireEvent.press(get("execution-sheet-body-outside"));
    blurCell(1, "pause");
    expect(active(1, "pause")).toBe(false);
    focusCell(1, "pause");
    validate();
    expect(onApply).not.toHaveBeenCalled();
    blurCell(1, "pause");
    validate();
    expect(applied(onApply).series).toEqual(variableRows([[30, 11], [45, 20], [60, 30]]));
  });

  it("PRE5-2.6/AC3, D-434 — retrait d'une autre ligne puis Annuler : la saisie ouverte reste sur SA ligne (identité, jamais rang)", () => {
    renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    fireEvent.press(get("execution-sheet-table-row-1-remove"));
    expect(rows()).toBe(2);
    // L'ancienne ligne 3 est maintenant la ligne 2 : sa Pause s'affiche « 00:30 » en saisie.
    focusCell(2, "pause");
    expect(valueOf(cell(2, "pause"))).toBe("00:30");
    fireEvent.press(get("execution-sheet-adjusted-undo"));
    expect(rows()).toBe(3);
    expect(active(3, "pause")).toBe(true);
    expect(active(2, "pause")).toBe(false);
    blurCell(3, "pause");
    expect(valueOf(cell(3, "pause"))).toBe("30 s");
  });

  it("PRE5-2.6/AC5 (NR Δ38) — le tableau suit N (saisi au clavier depuis le 06/11/2026) : ligne ajoutée puis retirée, réserves restaurées (Q29) ; D-434 : seules les cellules Cible et Pause ont un clavier, numérique", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    tap("execution-sheet-series-decrement");
    expect(rows()).toBe(2);
    expect(query("execution-sheet-table-row-3")).toBeNull();
    tap("execution-sheet-series-increment");
    expect(rows()).toBe(3);
    expect([valueOf("execution-sheet-table-row-3-target"), valueOf("execution-sheet-table-row-3-pause")]).toEqual(["1 min", "30 s"]);
    tap("execution-sheet-series-increment");
    expect(rows()).toBe(4);
    tap("execution-sheet-series-decrement");
    expect(rows()).toBe(3);
    // Décision du 06/11/2026 : les valeurs hors tableau ont aussi leur entrée clavier ; seules celles du tableau sont comptées ici.
    const keyboards = screen.UNSAFE_root.findAll(
      (node) => node.props.keyboardType !== undefined && typeof node.type === "string" && String(node.props.testID).startsWith("execution-sheet-table-row-"),
    );
    expect(keyboards.map((node) => String(node.props.testID)).sort()).toEqual(
      [1, 2, 3].flatMap((row) => [`${cell(row, "pause")}-input`, `${cell(row, "target")}-input`]).sort(),
    );
    expect(keyboards.every((node) => node.props.keyboardType === "number-pad")).toBe(true);
    validate();
    expect(applied(onApply).series).toEqual(variableRows([[30, 10], [45, 20], [60, 30]]));
  });

  it("PRE5-2.6/AC4 — briques partagées : la Feuille ré-exporte `dragDestination`, `tableRowIdentity` et `TABLE_ROW_HEIGHT` du module `sheetTable` ; glisser d'une hauteur de ligne de 36", () => {
    expect(TABLE_ROW_HEIGHT).toBe(SHARED_TABLE_ROW_HEIGHT);
    expect(dragDestination).toBe(sharedDragDestination);
    expect(tableRowIdentity).toBe(sharedTableRowIdentity);
    renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    dragHandle(1, TABLE_ROW_HEIGHT);
    expect([1, 2].map((row) => valueOf(`execution-sheet-table-row-${row}-target`))).toEqual(["45 s", "30 s"]);
  });
});

/**
 * PRE-5 story 2.2 (AC1 à AC5, AC8 ; FR-23 à FR-25, AD-26, AD-27) — essai du champ clavier
 * de la charge : ligne « Charge » (Avec / Sans), champ commun en identiques, colonne Charge
 * en variables, barre Précédent / Suivant / « Fermer », surface `keyboard`. Le focus natif
 * est simulé (`focus`, `changeText`, `blur`) : Jest ne prouve ni le clavier, ni la barre, ni
 * le défilement réels, qui relèvent de la recette iPhone R-2.2-01 à 07 (aucun constat inventé).
 */
describe("ExecutionParametersSheet — PRE-5 story 2.2", () => {
  const hidden = { includeHiddenElements: true } as const;
  const get = (testID: string) => screen.getByTestId(testID, hidden);
  const query = (testID: string) => screen.queryByTestId(testID, hidden);
  const styleOf = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};
  const UNIFORM = "execution-sheet-load-input";
  const cell = (row: number) => `execution-sheet-table-row-${row}-load`;
  // D-434 : une cellule du tableau (`…-load`) porte son entrée native transparente (`…-input`)
  // et sa valeur affichée (`…-value`) ; recette du 20/10 (RC-14) : la charge commune aussi (`cellDecimal`).
  const input = (testID: string) => `${testID}-input`;
  const focus = (testID: string) => fireEvent(get(input(testID)), "focus");
  const blur = (testID: string) => fireEvent(get(input(testID)), "blur");
  // Cellule : frappes au clavier natif (la première remplace) ; texte vide = Retour arrière
  // jusqu'à vider la cellule.
  const type = (testID: string, text: string) => {
    if (text === "") typeInExecutionSheetCell(testID, CELL_BACKSPACE.repeat(String(get(input(testID)).props.value).length));
    else typeInExecutionSheetCell(testID, text);
  };
  const shown = (testID: string) => String(get(`${testID}-value`).props.children);
  const loadChoice = () => selectedValue("execution-sheet-load-control", ["WITH", "WITHOUT"]);
  const uniformLoad = (loadKg: number, enabled = true) =>
    params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(90), pauseSeconds: 15, loadKg, workPhases: [] }, loadEnabled: enabled });
  const variableLoads = (loads: number[], enabled = true) =>
    params({
      series: { kind: "VARIABLE", rows: loads.map((loadKg, index) => ({ target: numberTarget(30 + index), pauseSeconds: 10, loadKg })), workPhases: [] },
      loadEnabled: enabled,
    });
  const inputs = () => screen.UNSAFE_root.findAll((node) => node.props.keyboardType !== undefined && typeof node.type === "string");
  let keyboard: ReturnType<typeof captureKeyboard>;
  beforeEach(() => {
    keyboard = captureKeyboard();
  });
  afterEach(() => keyboard.restore());

  it("PRE5-2.2/AC5 — Sans : ligne « Charge » en dernier dans le cadre Séries, segmenté « Avec | Sans » sur Sans, aucun champ ni colonne", () => {
    renderSheet(params());
    const frame = get("execution-sheet-frame-series");
    expect(within(frame).getByTestId("execution-sheet-row-load", hidden)).toBeTruthy();
    expect(loadChoice()).toBe("WITHOUT");
    expect(within(get("execution-sheet-row-load")).getByText("Charge", hidden)).toBeTruthy();
    expect(within(get("execution-sheet-load-control")).getAllByText(/^(Avec|Sans)$/, hidden).map((node) => node.props.children)).toEqual(["Avec", "Sans"]);
    // Aucun champ de charge (décision du 06/11/2026 : les autres valeurs ont leur propre entrée clavier).
    expect(inputs().filter((node) => String(node.props.testID).includes("load"))).toHaveLength(0);
    // La ligne Charge suit la Pause (dernière ligne du cadre).
    const rowIds = within(frame)
      .queryAllByTestId(/^execution-sheet-row-[a-z-]+$/, hidden)
      .map((node) => String(node.props.testID))
      .filter((id) => !/-(selection|line|content)$/.test(id));
    expect(rowIds.slice(-2)).toEqual(["execution-sheet-row-pause", "execution-sheet-row-load"]);
  });

  it("PRE5-2.2/AC5, AC3 — identiques : Avec pose 0,25 kg ; focus : surface clavier, fond #EAEAFF annoncé « sélectionné » ; « 1,3 » puis sortie → 1,5 kg ; ✓ applique", () => {
    const { onApply } = renderSheet(params());
    fireEvent.press(get("execution-sheet-load-control-WITH"));
    expect(loadChoice()).toBe("WITH");
    expect(shown(UNIFORM)).toBe("0,25 kg");
    expect(get(input(UNIFORM)).props.keyboardType).toBe("decimal-pad");
    // Recette du 19/10 : barre rendue par la Feuille (RC-1). Recette du 20/10 (RC-14) : Avec
    // demande le focus de la charge commune ; le champ est actif quand le focus natif arrive.
    expect(get(input(UNIFORM)).props.inputAccessoryViewID).toBeUndefined();
    expect(get(UNIFORM).props.accessibilityState).toMatchObject({ selected: false });
    focus(UNIFORM);
    expect(shown(UNIFORM)).toBe("0,25");
    expect(styleOf(UNIFORM).backgroundColor).toBe("#EAEAFF");
    expect(get(UNIFORM).props.accessibilityState).toMatchObject({ selected: true });
    type(UNIFORM, "1,3");
    expect(shown(UNIFORM)).toBe("1,3");
    blur(UNIFORM);
    expect(shown(UNIFORM)).toBe("1,5 kg");
    expect(styleOf(UNIFORM).backgroundColor).not.toBe("#EAEAFF");
    validate();
    expect(applied(onApply)).toMatchObject({ loadEnabled: true, series: { kind: "UNIFORM", loadKg: 1.5 } });
  });

  it("PRE5-2.2/AC1, RC-14 — illisible : valeur précédente ; second séparateur et signe refusés à la frappe (D-434) ; champ vidé : 0 kg, et à la fermeture en identiques → Sans", () => {
    const { onApply } = renderSheet(uniformLoad(20));
    focus(UNIFORM);
    type(UNIFORM, ",");
    blur(UNIFORM);
    expect(shown(UNIFORM)).toBe("20 kg");
    // RC-14 : même composition que les cellules (`cellDecimal`) — un seul séparateur, aucun signe.
    focus(UNIFORM);
    type(UNIFORM, "1,2,3");
    expect(shown(UNIFORM)).toBe("1,23");
    type(UNIFORM, "⌫⌫⌫⌫");
    type(UNIFORM, "-2");
    expect(shown(UNIFORM)).toBe("2");
    fireEvent.changeText(get(input(UNIFORM)), "");
    type(UNIFORM, ",");
    blur(UNIFORM);
    expect(shown(UNIFORM)).toBe("20 kg");
    focus(UNIFORM);
    type(UNIFORM, "");
    blur(UNIFORM);
    expect(loadChoice()).toBe("WITHOUT");
    expect(query(UNIFORM)).toBeNull();
    validate();
    expect(applied(onApply)).toMatchObject({ loadEnabled: false, series: { kind: "UNIFORM", loadKg: 0 } });
  });

  it("PRE5-2.2/AC1 (Q47) — ✓ pendant la saisie : 1er appui = sortie du champ, valeur appliquée, Feuille non validée ; 2e appui = validation ; ✕ de même", () => {
    const { onApply, onCancel } = renderSheet(uniformLoad(20));
    focus(UNIFORM);
    type(UNIFORM, "2");
    validate();
    expect(onApply).not.toHaveBeenCalled();
    // Le premier appui retire le focus natif : la sortie du champ applique la valeur.
    blur(UNIFORM);
    expect(shown(UNIFORM)).toBe("2 kg");
    validate();
    expect(applied(onApply)).toMatchObject({ series: { kind: "UNIFORM", loadKg: 2 } });
    focus(UNIFORM);
    fireEvent.press(get("execution-sheet-cancel"));
    expect(onCancel).not.toHaveBeenCalled();
    blur(UNIFORM);
    fireEvent.press(get("execution-sheet-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("PRE5-2.2/AC1 — valeur appliquée avant toute autre transition : « 1,3 » puis Condition d'arrêt À l'échec, sans sortie du champ ; ✓ (surface fermée, non absorbé) applique 1,5 kg", () => {
    const { onApply } = renderSheet(uniformLoad(20));
    focus(UNIFORM);
    type(UNIFORM, "1,3");
    fireEvent.press(get(`${STOP_CONTROL}-FAILURE`));
    validate();
    expect(applied(onApply)).toMatchObject({ series: { kind: "UNIFORM", target: failureTarget(), loadKg: 1.5 } });
  });

  // [Champ ± de N ouvert dans le même geste — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : N prend la saisie.]
  it("PRE5-2.2/AC1 — une seule surface : toucher le champ de N pendant la saisie de la charge lui donne la saisie dans le même geste ; la sortie de la charge applique sa valeur", () => {
    renderSheet(uniformLoad(20));
    focus(UNIFORM);
    type(UNIFORM, "4");
    openExecutionSheetField("execution-sheet-series");
    expect(get("execution-sheet-series").props.accessibilityState).toMatchObject({ selected: true });
    expect(styleOf(UNIFORM).backgroundColor).not.toBe("#EAEAFF");
    blur(UNIFORM);
    expect(shown(UNIFORM)).toBe("4 kg");
    expect(get("execution-sheet-series").props.accessibilityState).toMatchObject({ selected: true });
  });

  it("PRE5-2.2/AC1 — sortie sans changement (« 20 » sur 20 kg) : aucune transition, « Série supprimée — Annuler » reste valable (Q29)", () => {
    renderSheet(variableLoads([20, 30, 40]));
    fireEvent.press(get("execution-sheet-table-row-3-remove"));
    expect(get("execution-sheet-adjusted")).toBeTruthy();
    focus(cell(1));
    expect(shown(cell(1))).toBe("20");
    type(cell(1), "20");
    blur(cell(1));
    expect(get("execution-sheet-adjusted")).toBeTruthy();
    fireEvent.press(get("execution-sheet-adjusted-undo"));
    expect(screen.queryAllByTestId(/^execution-sheet-table-row-\d+$/, hidden)).toHaveLength(3);
  });

  it("PRE5-2.2/AC2, AC3, D-434 (QD-434-2) — variables : colonne Charge après la Pause ; Suivant / Précédent parcourent le tableau ligne par ligne (Cible, Pause, Charge) sans normalisation ; extrémités indisponibles ; le fond actif suit ; « Fermer » applique", () => {
    const { onApply } = renderSheet(variableLoads([0, 20, 5, 6, 7, 8]));
    expect(within(get("execution-sheet-table-header")).getByText("Charge", hidden)).toBeTruthy();
    // Largeur de la colonne de 71 (qui peut rétrécir), cellule 24 de haut, cible tactile de 36.
    expect(styleOf(cell(1))).toMatchObject({ width: "100%", minHeight: 24, borderRadius: 8 });
    expect(styleOf("execution-sheet-table-row-1-load-cell")).toMatchObject({ width: 71, flexShrink: 1 });
    expect(get(cell(1)).props.hitSlop).toEqual({ top: 6, bottom: 6 });
    expect([1, 2, 6].map((row) => shown(cell(row)))).toEqual(["0 kg", "20 kg", "8 kg"]);
    expect(get(cell(2)).props.accessibilityLabel).toBe("Série 2, charge");
    const target = (row: number) => `execution-sheet-table-row-${row}-target`;
    const pause = (row: number) => `execution-sheet-table-row-${row}-pause`;
    const activeCell = (id: string) => styleOf(id).backgroundColor === "#EAEAFF";
    focus(target(1));
    keyboard.show();
    expect(get("execution-sheet-keyboard-previous").props.accessibilityState).toMatchObject({ disabled: true });
    expect(get("execution-sheet-keyboard-next").props.accessibilityState).toMatchObject({ disabled: false });
    // Le focus d'une cellule sélectionne le tableau (Q40).
    expect(styleOf("execution-sheet-variable-group").backgroundColor).toBe("#F2F2FF");
    // Ligne 1 de gauche à droite : Cible → Pause → Charge, puis Cible de la ligne 2.
    fireEvent.press(get("execution-sheet-keyboard-next"));
    expect(activeCell(pause(1))).toBe(true);
    expect(activeCell(target(1))).toBe(false);
    blur(target(1));
    focus(pause(1));
    fireEvent.press(get("execution-sheet-keyboard-next"));
    expect(activeCell(cell(1))).toBe(true);
    blur(pause(1));
    focus(cell(1));
    fireEvent.press(get("execution-sheet-keyboard-next"));
    expect(activeCell(target(2))).toBe(true);
    blur(cell(1));
    focus(target(2));
    fireEvent.press(get("execution-sheet-keyboard-next"));
    blur(target(2));
    focus(pause(2));
    fireEvent.press(get("execution-sheet-keyboard-next"));
    expect(activeCell(cell(2))).toBe(true);
    // Système : le focus passe de la Pause 2 à la Charge 2 (perte puis prise), clavier ouvert.
    blur(pause(2));
    focus(cell(2));
    type(cell(2), "");
    fireEvent.press(get("execution-sheet-keyboard-previous"));
    blur(cell(2));
    focus(pause(2));
    // Toutes les charges à 0, mais aucune normalisation pendant Précédent : colonne présente.
    expect(shown(cell(2))).toBe("0 kg");
    expect(loadChoice()).toBe("WITH");
    expect(activeCell(pause(2))).toBe(true);
    // Dernière cellule du tableau (Charge 6) : Suivant indisponible, sans boucle.
    blur(pause(2));
    expect(loadChoice()).toBe("WITH");
    focus(cell(6));
    expect(get("execution-sheet-keyboard-next").props.accessibilityState).toMatchObject({ disabled: true });
    expect(get("execution-sheet-keyboard-previous").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(get("execution-sheet-keyboard-next"));
    expect(activeCell(cell(6))).toBe(true);
    type(cell(6), "1,3");
    fireEvent.press(get("execution-sheet-keyboard-close"));
    blur(cell(6));
    expect(shown(cell(6))).toBe("1,5 kg");
    validate();
    expect(applied(onApply).series).toMatchObject({
      kind: "VARIABLE",
      rows: [{ loadKg: 0 }, { loadKg: 0 }, { loadKg: 5 }, { loadKg: 6 }, { loadKg: 7 }, { loadKg: 1.5 }],
    });
  });

  it("PRE5-2.2/AC2, PRE7-B.2 (B10) — variables, toutes les charges à 0 à la fermeture : Sans, colonne conservée avec des tirets, valeurs conservées", () => {
    const { onApply } = renderSheet(variableLoads([0, 20]));
    focus(cell(2));
    keyboard.show();
    type(cell(2), "0");
    fireEvent.press(get("execution-sheet-keyboard-close"));
    blur(cell(2));
    expect(loadChoice()).toBe("WITHOUT");
    expect(query(cell(1))).toBeNull();
    expect(within(get("execution-sheet-table-header")).getByText("Charge", hidden)).toBeTruthy();
    expect(get(`${cell(1)}-unset`).props.accessibilityLabel).toBe("Série 1, charge, Sans");
    validate();
    expect(applied(onApply)).toMatchObject({ loadEnabled: false });
  });

  it("PRE5-2.2/AC5, AC8 — variables : Avec déplie le tableau replié, pose 0,25 kg sur chaque ligne et rend la colonne ; textes de la barre par le lexique", () => {
    renderSheet(variableLoads([0, 0, 0], false));
    fireEvent.press(get(TABLE_TOGGLE));
    expect(query("execution-sheet-table")).toBeNull();
    fireEvent.press(get("execution-sheet-load-control-WITH"));
    expect(query("execution-sheet-table")).not.toBeNull();
    expect([1, 2, 3].map((row) => shown(cell(row)))).toEqual(["0,25 kg", "0,25 kg", "0,25 kg"]);
    // RC-2 : aucune cellule active, aucune barre ; la barre vient avec le clavier d'un champ touché.
    expect([1, 2, 3].map((row) => get(cell(row)).props.accessibilityState.selected)).toEqual([false, false, false]);
    expect(query("execution-sheet-keyboard-bar")).toBeNull();
    focus(cell(1));
    keyboard.show();
    const bar = strings.executionParameters.sheet.keyboardBar;
    expect([bar.previous, bar.next, bar.close]).toEqual(["← Précédent", "Suivant →", "Fermer"]);
    expect(within(get("execution-sheet-keyboard-previous")).getByText(bar.previous, hidden)).toBeTruthy();
    expect(get("execution-sheet-keyboard-previous").props.accessibilityLabel).toBe("Précédent");
    expect(get("execution-sheet-keyboard-next").props.accessibilityLabel).toBe("Suivant");
    expect(within(get("execution-sheet-keyboard-close")).getByText("Fermer", hidden)).toBeTruthy();
  });

  it("PRE5-2.2/AC1 (NR Δ30), D-434 — claviers du tableau : Charge au clavier décimal ; Cible et Pause au clavier numérique (D-434 remplace, pour ces cellules, la saisie au clavier propre à la charge)", () => {
    renderSheet(variableLoads([10, 20]));
    // Décision du 06/11/2026 : les valeurs hors tableau ont aussi leur entrée ; seules celles du tableau sont comptées ici.
    const ids = inputs()
      .map((node) => String(node.props.testID))
      .filter((id) => id.startsWith("execution-sheet-table-row-"));
    expect(ids.filter((id) => id.endsWith("-load-input")).sort()).toEqual([`${cell(1)}-input`, `${cell(2)}-input`]);
    expect(inputs().filter((node) => String(node.props.testID).endsWith("-load-input")).every((node) => node.props.keyboardType === "decimal-pad")).toBe(true);
    expect(inputs().filter((node) => !String(node.props.testID).endsWith("-load-input")).every((node) => node.props.keyboardType === "number-pad")).toBe(true);
    expect(ids).toHaveLength(6);
  });

  it("Recette du 19/10, RC-1 — barre rendue par la Feuille (dans son cadre modal, au bas de la Modal) seulement clavier affiché pour un champ Charge ; maintenue d'une cellule à l'autre ; masquée clavier rangé", () => {
    renderSheet(variableLoads([10, 20]));
    expect(query("execution-sheet-keyboard-bar")).toBeNull();
    focus(cell(1));
    // Clavier pas encore affiché : pas de barre posée sur la Feuille.
    expect(query("execution-sheet-keyboard-bar")).toBeNull();
    keyboard.show();
    expect(within(get("execution-sheet")).getByTestId("execution-sheet-keyboard-bar", hidden)).toBeTruthy();
    expect(styleOf("execution-sheet-keyboard-bar-host")).toMatchObject({ position: "absolute", left: 0, right: 0, bottom: 0 });
    // Recette iPhone du 29/10/2026 : marges 8 (barre de 52) et fond du clavier iOS 26 (Figma `9295:43707`).
    expect(styleOf("execution-sheet-keyboard-bar")).toMatchObject({ minHeight: 52, paddingVertical: 8, backgroundColor: "#E1E4E8" });
    // Toucher direct d'une autre cellule (sortie puis prise de focus) : la barre reste.
    blur(cell(1));
    expect(query("execution-sheet-keyboard-bar")).not.toBeNull();
    focus(cell(2));
    expect(get("execution-sheet-keyboard-previous").props.accessibilityState).toMatchObject({ disabled: false });
    keyboard.hide();
    expect(query("execution-sheet-keyboard-bar")).toBeNull();
  });

  it("Recette du 19/10, RC-1 — décalage de la barre : hauteur du clavier qui recouvre la zone de la Modal (jamais négatif)", () => {
    expect(keyboardBarLift({ screenY: 500, duration: 250 }, 844)).toBe(344);
    expect(keyboardBarLift({ screenY: 500, duration: 250 }, 820)).toBe(320);
    expect(keyboardBarLift({ screenY: 900, duration: 0 }, 844)).toBe(0);
  });
});

/**
 * PRE-5 story 2.2 (revue) — raccordement au focus natif (`TextInput.prototype.focus` /
 * `blur` espionnés) et application de la saisie avant chaque autre transition du même geste.
 */
describe("ExecutionParametersSheet — PRE-5 story 2.2 (focus natif et application préalable)", () => {
  const hidden = { includeHiddenElements: true } as const;
  const get = (testID: string) => screen.getByTestId(testID, hidden);
  const UNIFORM = "execution-sheet-load-input";
  const cell = (row: number) => `execution-sheet-table-row-${row}-load`;
  // D-434 : une cellule du tableau (`…-load`) porte son entrée native transparente (`…-input`)
  // et sa valeur affichée (`…-value`) ; recette du 20/10 (RC-14) : la charge commune aussi (`cellDecimal`).
  const input = (testID: string) => `${testID}-input`;
  const focus = (testID: string) => fireEvent(get(input(testID)), "focus");
  const blur = (testID: string) => fireEvent(get(input(testID)), "blur");
  // Cellule : frappes au clavier natif (la première remplace) ; texte vide = Retour arrière
  // jusqu'à vider la cellule.
  const type = (testID: string, text: string) => {
    if (text === "") typeInExecutionSheetCell(testID, CELL_BACKSPACE.repeat(String(get(input(testID)).props.value).length));
    else typeInExecutionSheetCell(testID, text);
  };
  const shown = (testID: string) => String(get(`${testID}-value`).props.children);
  const uniformLoad = (loadKg: number) =>
    params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(90), pauseSeconds: 15, loadKg, workPhases: [] }, loadEnabled: true });
  const variableLoads = (loads: number[], enabled = true) =>
    params({
      series: { kind: "VARIABLE", rows: loads.map((loadKg, index) => ({ target: numberTarget(30 + index), pauseSeconds: 10, loadKg })), workPhases: [] },
      loadEnabled: enabled,
    });
  /** Identifiants des entrées sur lesquelles la méthode espionnée a été appelée. */
  const targets = (spy: { mock: { contexts: unknown[] } }) =>
    spy.mock.contexts.map((instance) => String((instance as { props: { testID?: string } }).props.testID));
  const spies: { mockRestore: () => void }[] = [];
  const spyOn = (method: "focus" | "blur") => {
    const spy = jest.spyOn(TextInput.prototype as unknown as Record<"focus" | "blur", () => void>, method);
    spies.push(spy);
    return spy;
  };

  let keyboard: ReturnType<typeof captureKeyboard>;
  beforeEach(() => {
    keyboard = captureKeyboard();
  });
  afterEach(() => {
    spies.splice(0).forEach((spy) => spy.mockRestore());
    keyboard.restore();
  });

  it("PRE5-2.2/AC1 — ✓ absorbé, autre surface touchée, « Fermer » : le focus natif du champ est retiré", () => {
    const blurSpy = spyOn("blur");
    renderSheet(uniformLoad(20));
    focus(UNIFORM);
    blurSpy.mockClear();
    validate();
    expect(targets(blurSpy)).toEqual([input(UNIFORM)]);
    blur(UNIFORM);
    focus(UNIFORM);
    blurSpy.mockClear();
    // [Champ ± de N — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : autre surface touchée, le chevron de la Durée de l'exercice (un autre champ
    // clavier prend lui-même le focus natif).]
    showSignals();
    expect(targets(blurSpy)).toEqual([input(UNIFORM)]);
    blur(UNIFORM);
    focus(UNIFORM);
    keyboard.show();
    blurSpy.mockClear();
    fireEvent.press(get("execution-sheet-keyboard-close"));
    expect(targets(blurSpy)).toEqual([input(UNIFORM)]);
  });

  it("PRE5-2.2/AC2, D-434 — Suivant et Précédent donnent le focus natif au champ voisin (Charge 2 → Cible 3), sans retirer celui du champ courant", () => {
    const focusSpy = spyOn("focus");
    const blurSpy = spyOn("blur");
    renderSheet(variableLoads([10, 20, 30]));
    focus(cell(2));
    keyboard.show();
    focusSpy.mockClear();
    blurSpy.mockClear();
    fireEvent.press(get("execution-sheet-keyboard-next"));
    expect(targets(focusSpy)).toEqual(["execution-sheet-table-row-3-target-input"]);
    blur(cell(2));
    focus("execution-sheet-table-row-3-target");
    focusSpy.mockClear();
    fireEvent.press(get("execution-sheet-keyboard-previous"));
    expect(targets(focusSpy)).toEqual([input(cell(2))]);
    expect(blurSpy).not.toHaveBeenCalled();
  });

  it("PRE5-2.2/AC5, recette du 19/10 (RC-2) et du 20/10 (RC-14) — Avec : en identiques, focus natif de la charge commune dans l'option (RC-14) ; en variables, aucun focus natif, aucun champ actif, aucune barre (RC-2)", () => {
    const focusSpy = spyOn("focus");
    const view = renderSheetView(params());
    fireEvent.press(get("execution-sheet-load-control-WITH"));
    expect(targets(focusSpy)).toEqual([input(UNIFORM)]);
    focusSpy.mockClear();
    view.unmount();
    renderSheet(variableLoads([0, 0], false));
    fireEvent.press(get("execution-sheet-load-control-WITH"));
    expect(targets(focusSpy)).toEqual([]);
    expect([1, 2].map((row) => get(cell(row)).props.accessibilityState.selected)).toEqual([false, false]);
    expect(screen.queryByTestId("execution-sheet-keyboard-bar", hidden)).toBeNull();
  });

  it("PRE5-2.2/AC1 — saisie qui change la charge puis « Annuler » d'un retrait : la charge est appliquée, rien n'est annulé (Q29)", () => {
    renderSheet(variableLoads([20, 30, 40]));
    fireEvent.press(get("execution-sheet-table-row-3-remove"));
    focus(cell(1));
    type(cell(1), "25");
    fireEvent.press(get("execution-sheet-adjusted-undo"));
    expect(screen.queryByTestId("execution-sheet-adjusted", hidden)).toBeNull();
    expect(screen.queryAllByTestId(/^execution-sheet-table-row-\d+$/, hidden)).toHaveLength(2);
    blur(cell(1));
    expect(shown(cell(1))).toBe("25 kg");
  });

  it("PRE5-2.2/AC1 — Type de série pendant la saisie : re-choisir Identiques applique la valeur ; passer à Variables la reporte sur chaque série", () => {
    const { onApply } = renderSheet(uniformLoad(20));
    focus(UNIFORM);
    type(UNIFORM, "3");
    fireEvent.press(get(`${SERIES_TYPE}-UNIFORM`));
    // Décision du 06/11/2026 : re-choisir Identiques ouvre la saisie du nombre de séries ; la charge perd
    // le focus natif (simulé).
    blur(UNIFORM);
    validate();
    expect(applied(onApply)).toMatchObject({ series: { kind: "UNIFORM", loadKg: 3 } });
    onApply.mockClear();
    focus(UNIFORM);
    type(UNIFORM, "4");
    fireEvent.press(get(`${SERIES_TYPE}-VARIABLE`));
    expect([1, 2, 3].map((row) => shown(cell(row)))).toEqual(["4 kg", "4 kg", "4 kg"]);
  });

  it("PRE5-2.2/AC1 — Sans pendant la saisie : la valeur est appliquée avant la désactivation, et conservée sous Sans", () => {
    const { onApply } = renderSheet(uniformLoad(20));
    focus(UNIFORM);
    type(UNIFORM, "3");
    fireEvent.press(get("execution-sheet-load-control-WITHOUT"));
    validate();
    expect(applied(onApply)).toMatchObject({ loadEnabled: false, series: { kind: "UNIFORM", loadKg: 3 } });
  });

  it("PRE5-2.2/AC1 — déplacement par action accessible pendant une saisie de cellule : la valeur est appliquée avant le déplacement et suit sa série", () => {
    const { onApply } = renderSheet(variableLoads([10, 20, 30]));
    focus(cell(1));
    type(cell(1), "15");
    moveAction(1, "moveDown");
    validate();
    expect(applied(onApply).series).toMatchObject({ kind: "VARIABLE", rows: [{ loadKg: 20 }, { loadKg: 15 }, { loadKg: 30 }] });
  });

  it("PRE5-2.2/AC1 — tableau replié pendant la saisie d'une cellule : champ démonté, la valeur est appliquée", () => {
    const { onApply } = renderSheet(variableLoads([10, 20]));
    focus(cell(1));
    type(cell(1), "15");
    fireEvent.press(get(TABLE_TOGGLE));
    expect(screen.queryByTestId(cell(1), hidden)).toBeNull();
    validate();
    expect(applied(onApply).series).toMatchObject({ kind: "VARIABLE", rows: [{ loadKg: 15 }, { loadKg: 20 }] });
  });
});

/**
 * Recette iPhone du 19/10 (RC-4, RC-5) — stepper révélé refermé par le toucher de sa valeur ;
 * ligne glissée opaque et soulevée, insertion et décalage animés. Jest ne joue pas les
 * animations de Reanimated : la vitesse et la lisibilité réelles se jugent sur iPhone.
 */
describe("ExecutionParametersSheet — recette iPhone du 19/10 (RC-4, RC-5)", () => {
  const hidden = { includeHiddenElements: true } as const;
  const get = (testID: string) => screen.getByTestId(testID, hidden);
  const query = (testID: string) => screen.queryByTestId(testID, hidden);
  const styleOf = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};
  const motionLayout = (testID: string) => (get(testID).props as { layout?: unknown }).layout;

  // [Toucher la valeur du stepper ouvert — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : re-choisir l'option affichée ferme le clavier.]
  it("RC-4 — Nombre de séries : en saisie, re-choisir l'option affichée ferme la saisie ; la valeur au repos est de nouveau affichée", () => {
    const blurSpy = jest.spyOn(TextInput.prototype as unknown as Record<"blur", () => void>, "blur");
    try {
      renderSheet(params());
      openExecutionSheetField("execution-sheet-series");
      expect(get("execution-sheet-series").props.accessibilityState).toMatchObject({ selected: true });
      blurSpy.mockClear();
      fireEvent.press(get(`${SERIES_TYPE}-UNIFORM`));
      expect(blurSpy).toHaveBeenCalled();
      closeExecutionSheetField("execution-sheet-series");
      expect(get("execution-sheet-series").props.accessibilityState).toMatchObject({ selected: false });
      expect(valueOf("execution-sheet-series")).toBe("3 séries identiques");
    } finally {
      blurSpy.mockRestore();
    }
  });

  // [« activer » de VoiceOver qui refermait le ± de la Cadence — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier.]
  it("RC-4, D-434 — la Pause d'une cellule n'a plus de champ ±", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10]]) }));
    // D-434 : la Pause d'une cellule n'a plus de champ ± (clavier numérique).
    expect(query("execution-sheet-table-row-1-pause-toggle")).toBeNull();
    expect(get("execution-sheet-table-row-1-pause-input").props.keyboardType).toBe("number-pad");
  });

  it("RC-5 — dès la saisie : ligne opaque (fond #EAEAFF), soulevée (ombre), cadre au-dessus des autres et sans transition de place ; les autres lignes gardent la leur", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15]]) }));
    expect(styleOf("execution-sheet-table-row-1").backgroundColor).toBeUndefined();
    act(() => get("execution-sheet-table-row-1-handle").props.onResponderGrant({ nativeEvent: { pageY: 100 } }));
    expect(styleOf("execution-sheet-table-row-1")).toMatchObject({ backgroundColor: "#EAEAFF", shadowOpacity: 0.18, elevation: 4 });
    expect(styleOf("execution-sheet-table-row-1-motion").zIndex).toBe(1);
    expect(motionLayout("execution-sheet-table-row-1-motion")).toBeUndefined();
    expect(motionLayout("execution-sheet-table-row-2-motion")).toBe(rowShiftLayout);
    expect(styleOf("execution-sheet-table-row-2").backgroundColor).toBeUndefined();
    act(() => get("execution-sheet-table-row-1-handle").props.onResponderRelease({ nativeEvent: { pageY: 100 } }));
    // Aucun déplacement : ligne reposée sans glissade (écart nul).
    expect(styleOf("execution-sheet-table-row-1").backgroundColor).toBeUndefined();
    expect(motionLayout("execution-sheet-table-row-1-motion")).toBe(rowShiftLayout);
  });

  it("RC-5 — à la dépose : la ligne prend sa place sous le doigt (écart restant) puis y glisse en TABLE_ROW_DROP_MS (≈ 280 ms, comme le décalage des autres lignes) ; reposée ensuite", () => {
    expect(TABLE_ROW_DROP_MS).toBe(SHEET_ROW_SHIFT_MS);
    expect(SHEET_ROW_SHIFT_MS).toBeGreaterThanOrEqual(250);
    expect(SHEET_ROW_SHIFT_MS).toBeLessThanOrEqual(300);
    renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15]]) }));
    jest.useFakeTimers();
    try {
      const handle = () => get("execution-sheet-table-row-1-handle");
      act(() => handle().props.onResponderGrant({ nativeEvent: { pageY: 100 } }));
      act(() => handle().props.onResponderMove({ nativeEvent: { pageY: 184 } }));
      act(() => handle().props.onResponderRelease({ nativeEvent: { pageY: 184 } }));
      // 84 points vers le bas : destination 3 (2 lignes de 36), écart restant 84 − 72 = 12.
      expect(valueOf("execution-sheet-table-row-3-target")).toBe("30 s");
      expect(styleOf("execution-sheet-table-row-3")).toMatchObject({ transform: [{ translateY: 12 }], backgroundColor: "#EAEAFF" });
      expect(styleOf("execution-sheet-table-row-3-motion").zIndex).toBe(1);
      act(() => {
        jest.advanceTimersByTime(TABLE_ROW_DROP_MS / 2);
      });
      const halfway = (styleOf("execution-sheet-table-row-3").transform as { translateY: number }[])[0]!.translateY;
      expect(halfway).toBeGreaterThan(0);
      expect(halfway).toBeLessThan(12);
      act(() => {
        jest.advanceTimersByTime(TABLE_ROW_DROP_MS);
      });
    } finally {
      jest.useRealTimers();
    }
    expect(styleOf("execution-sheet-table-row-3").transform).toBeUndefined();
    expect(styleOf("execution-sheet-table-row-3").backgroundColor).toBeUndefined();
    expect(styleOf("execution-sheet-table-row-3-motion").zIndex).toBeUndefined();
    expect(motionLayout("execution-sheet-table-row-3-motion")).toBe(rowShiftLayout);
  });

  it("RC-5 — transition de place des lignes : position seule (taille posée directement), durée SHEET_ROW_SHIFT_MS", () => {
    const values = {
      currentOriginX: 0,
      currentOriginY: 36,
      currentWidth: 300,
      currentHeight: 36,
      targetOriginX: 0,
      targetOriginY: 108,
      targetWidth: 300,
      targetHeight: 36,
    } as unknown as Parameters<typeof rowShiftLayout>[0];
    const animation = rowShiftLayout(values);
    expect(animation.initialValues).toEqual({ originX: 0, originY: 36, width: 300, height: 36 });
    expect(Object.keys(animation.animations).sort()).toEqual(["originX", "originY"]);
  });
});

/**
 * PRE-5 story 2.5 (AC1 à AC6 ; FR-15 à FR-17, FR-30, FR-31, FR-44 ; AD-21, AD-24, AD-27,
 * AD-28 ; D-431) — Côtés Avec / Sans, Enchainement, Cadence et Durée de l'exercice.
 * Matrice de la spécification. Jest ne prouve que l'arbre JS : rendu, police réduite des
 * notations, gestes et VoiceOver réels relèvent de la recette du lot Feuille (R-2.5-01 à
 * R-2.5-05), sans constat inventé.
 */
describe("ExecutionParametersSheet — PRE-5 story 2.5", () => {
  const hidden = { includeHiddenElements: true } as const;
  const get = (testID: string) => screen.getByTestId(testID, hidden);
  const query = (testID: string) => screen.queryByTestId(testID, hidden);
  const sideChevron = `${SIDE_CONTROL}-WITH-chevron`;
  // RC-6 : l'Enchainement est le menu de l'option Avec (plus de ligne propre).
  const sideRows = () => ({
    order: query(ORDER_MENU) !== null,
    recovery: query("execution-sheet-row-side-recovery") !== null,
  });
  const signals = () => ({
    countdown: query("execution-sheet-row-countdown") !== null,
    end: query("execution-sheet-row-end") !== null,
    disclosure: query(`${DURATION_DISCLOSURE}-frame`) !== null,
  });
  /** Feuille avec la prop des signaux (Exercice ouvert depuis une Séance : `"absent"`). */
  function renderWithSignals(parent: ExecutionParametersInput, exerciseSignals: "present" | "absent") {
    const onApply = jest.fn<(value: ExecutionParameters) => void>();
    const view = render(
      <TestSafeAreaProvider>
        <ExecutionParametersSheet
          parent={parent}
          profileSideRecoverySecondsDefault={10}
          exerciseSignals={exerciseSignals}
          onApply={onApply}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );
    return { onApply, unmount: view.unmount };
  }

  it("PRE5-2.5/AC1, RC-6 — Activation : Sans (UNILATERAL), Profil 20 s → Avec : RIGHT_LEFT, Pause entre les côtés 20 s, menu d'Enchainement et Pause visibles, sans chevron de repli", () => {
    const { onApply } = renderSheet(params({ sideMode: "UNILATERAL", sideRecoverySeconds: 0 }), 20);
    expect(sideText()).toBe("Sans");
    expect(sideRows()).toEqual({ order: false, recovery: false });
    // Sans sélectionné : Avec affiche « Avec », sans notation ni menu (RC-13, recette du 20/10).
    expect(within(get(SIDE_CONTROL)).queryByText("DD… → GG…", hidden)).toBeNull();
    expect(within(get(SIDE_CONTROL)).getByText("Avec", hidden)).toBeTruthy();
    chooseSide("Avec");
    expect(within(get(SIDE_CONTROL)).getByText("DD… → GG…", hidden)).toBeTruthy();
    expect(sideText()).toBe("Avec");
    expect(sideRows()).toEqual({ order: true, recovery: true });
    expect(valueOf("execution-sheet-side-recovery")).toBe("20 s");
    expect(query(sideChevron)).toBeNull();
    validate();
    expect(applied(onApply)).toMatchObject({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 20 });
  });

  it("PRE5-2.5/AC1 — Historique : LEFT_RIGHT et BY_SERIES affichés Avec et « (D1 → G1) ➜ (D2 → G2) » ; Avec et l'Enchainement re-choisis sans changement ; ✓ enregistre LEFT_RIGHT et BY_SERIES", () => {
    const { onApply } = renderSheet(params({ sideMode: "LEFT_RIGHT", sideOrder: "BY_SERIES", sideRecoverySeconds: 12 }), 20);
    expect(sideText()).toBe("Avec");
    expect(orderText()).toBe("Les deux côtés à chaque série");
    chooseSide("Avec");
    chooseOrder("Les deux côtés à chaque série");
    // Avec re-choisi : ni réécriture de LEFT_RIGHT, ni copie du Profil.
    expect(valueOf("execution-sheet-side-recovery")).toBe("12 s");
    validate();
    expect(applied(onApply)).toMatchObject({ sideMode: "LEFT_RIGHT", sideOrder: "BY_SERIES", sideRecoverySeconds: 12 });
  });

  it("PRE5-2.5/AC1 — Sans puis Avec : lignes masquées puis réaffichées ; Pause entre les côtés recopiée du Profil (P3-10) ; Enchainement conservé", () => {
    const { onApply } = renderSheet(params({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES", sideRecoverySeconds: 12 }), 20);
    expect(valueOf("execution-sheet-side-recovery")).toBe("12 s");
    chooseSide("Sans");
    expect(sideRows()).toEqual({ order: false, recovery: false });
    // Sans re-choisi sur UNILATERAL : Brouillon inchangé.
    chooseSide("Sans");
    chooseSide("Avec");
    expect(sideRows()).toEqual({ order: true, recovery: true });
    expect(valueOf("execution-sheet-side-recovery")).toBe("20 s");
    expect(orderText()).toBe("Les deux côtés à chaque série");
    validate();
    expect(applied(onApply)).toMatchObject({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES", sideRecoverySeconds: 20 });
  });

  // Recette du 19/10 (RC-6) : remplace le test « Repli » de la story 2.5 (chevron d'Avec
  // repliant Enchainement et Pause entre les côtés) — la frame `9462:18987` n'a plus ce repli.
  it("RC-6 — Changement de côté porte l'Enchainement : aucune ligne Enchainement ni chevron de repli ; Pause entre les côtés visible sous Avec ; Avec (146) porte la notation, Sans (62) (RC-12) ; choix par le menu, `setSideOrder` seulement si différent", () => {
    const { onApply } = renderSheet(params({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE", sideRecoverySeconds: 12 }), 20);
    expect(query("execution-sheet-row-order")).toBeNull();
    expect(screen.queryByText("Enchainement", hidden)).toBeNull();
    expect(query(sideChevron)).toBeNull();
    expect(sideRows()).toEqual({ order: true, recovery: true });
    const side = get(SIDE_CONTROL);
    expect(StyleSheet.flatten(side.props.style)).toMatchObject({ width: 174 }); // 216 avant le 01/11/2026 (Avec de 104)
    expect(within(side).getByTestId(ORDER_MENU)).toBeTruthy();
    expect(within(get(ORDER_MENU)).getByText("DD… → GG…", hidden)).toBeTruthy();
    expect(get(`${SIDE_CONTROL}-WITH`).props.accessibilityLabel).toBe("Avec, Chaque série d’un côté, puis chaque série de l’autre");
    // Re-choisir l'Enchainement affiché ne change rien ; l'autre s'applique et reste affiché.
    chooseOrder("Chaque série d’un côté, puis chaque série de l’autre");
    expect(orderText()).toBe("Chaque série d’un côté, puis chaque série de l’autre");
    chooseOrder("Les deux côtés à chaque série");
    expect(orderText()).toBe("Les deux côtés à chaque série");
    expect(get(`${SIDE_CONTROL}-WITH`).props.accessibilityLabel).toBe("Avec, Les deux côtés à chaque série");
    expect(sideText()).toBe("Avec");
    expect(valueOf("execution-sheet-side-recovery")).toBe("12 s");
    validate();
    expect(applied(onApply)).toMatchObject({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES", sideRecoverySeconds: 12 });
  });

  // Recette du 20/10 (RC-13, remplace RC-11 et RC-12 pour les largeurs) : Avec et Sans de 62 tant
  // qu'Avec n'est pas sélectionné ; Avec sélectionné (N > 1) porte la notation et le chevron dans 146.
  it("RC-13 — Changement de côté : Avec non sélectionné « Avec » de 62, sans chevron (segmenté de 132) ; Avec sélectionné à N > 1 : notation D-431 et chevron dans 146 (216) ; retour à Sans : « Avec » de 62 ; N = 1 : « Avec » de 62, sans menu ; place de 216 réservée dans la ligne (libellé sur deux lignes)", () => {
    const flat = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};
    const widths = () => ({
      control: flat(SIDE_CONTROL).width,
      with: flat(`${SIDE_CONTROL}-tile-WITH`).width,
      without: flat(`${SIDE_CONTROL}-tile-WITHOUT`).width,
    });
    const narrow = { control: 132, with: 62, without: 62 };
    renderSheet(params({ sideMode: "UNILATERAL" }), 20);
    expect(widths()).toEqual(narrow);
    expect(within(get(SIDE_CONTROL)).getByText("Avec", hidden)).toBeTruthy();
    expect(query(ORDER_MENU)).toBeNull();
    expect(query(sideChevron)).toBeNull();
    expect(get(`${SIDE_CONTROL}-WITH`).props.accessibilityLabel).toBe("Avec");
    // La ligne réserve la place du segmenté le plus large, segmenté aligné à droite.
    expect(flat("execution-sheet-side-control-slot")).toMatchObject({ minWidth: 186, flexDirection: "row", justifyContent: "flex-end", alignItems: "center" });
    chooseSide("Avec");
    // Depuis le 01/11/2026 (ordre de Hermann, point 5) : Avec adapté au contenu, 104 pour « DD… → GG… ».
    expect(widths()).toEqual({ control: 174, with: 104, without: 62 });
    expect(within(get(ORDER_MENU)).getByText("DD… → GG…", hidden)).toBeTruthy();
    expect(within(get(SIDE_CONTROL)).queryByText("Avec", hidden)).toBeNull();
    chooseSide("Sans");
    expect(widths()).toEqual(narrow);
    expect(query(ORDER_MENU)).toBeNull();
    expect(within(get(SIDE_CONTROL)).getByText("Avec", hidden)).toBeTruthy();
    screen.unmount();
    // N = 1 (Q38) : Avec sélectionné affiche « Avec », sans menu, de 62.
    renderSheet(params({ sideMode: "RIGHT_LEFT", series: { kind: "UNIFORM", count: 1, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
    expect(sideText()).toBe("Avec");
    expect(widths()).toEqual(narrow);
    expect(query(ORDER_MENU)).toBeNull();
    expect(within(get(SIDE_CONTROL)).getByText("Avec", hidden)).toBeTruthy();
  });

  // Recette du 19/10 (RC-8) : segmentés `inline` centrés verticalement avec le libellé de leur
  // ligne (le cadre de 32 était posé au bas de la ligne de 44 par `alignSelf: flex-end`).
  it("RC-8 — chaque segmenté `inline` (Mode, Condition d'arrêt, Type de série, Charge, Changement de côté, Cadence) est centré verticalement avec le libellé dans sa ligne de 44 ; Cadence : ± révélé hors de la ligne, centrage inchangé", () => {
    renderSheet(params({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE", sideRecoverySeconds: 10 }));
    const flat = (node: ReturnType<typeof get>) => StyleSheet.flatten(node.props.style) ?? {};
    const check = () => {
      for (const [rowID, controlID] of [
        ["execution-sheet-row-mode", MODE_CONTROL],
        ["execution-sheet-row-stop-condition", STOP_CONTROL],
        ["execution-sheet-row-series-type", SERIES_TYPE],
        ["execution-sheet-row-load", "execution-sheet-load-control"],
        ["execution-sheet-row-side", SIDE_CONTROL],
        ["execution-sheet-row-beep", CADENCE_CONTROL],
      ] as const) {
        const line = get(`${rowID}-line`);
        expect({ rowID, line: flat(line) }).toMatchObject({
          rowID,
          line: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
        });
        const control = within(line).getByTestId(controlID, hidden);
        expect({ rowID, alignSelf: flat(control).alignSelf, height: flat(control).height }).toEqual({ rowID, alignSelf: "center", height: 32 });
        // Entre la ligne et le contrôle, aucun conteneur ne le décale verticalement.
        for (let node = control.parent; node !== null && node !== line; node = node.parent) {
          if (typeof node.type !== "string") continue;
          const style = flat(node);
          expect(["auto", "center"]).toContain(style.alignSelf ?? "auto");
          if (style.flexDirection === "row") expect(style.alignItems).toBe("center");
        }
        // Le libellé n'a pas d'alignement propre : centré par la ligne.
        const label = within(line).getAllByText(/./u, hidden)[0]!;
        expect(flat(label).alignSelf).toBeUndefined();
      }
    };
    check();
    // Cadence, ± révélé par Autre : rendu sous la ligne, hors de `-line` ; centrage inchangé.
    fireEvent.press(get(`${CADENCE_CONTROL}-OTHER`));
    expect(within(get("execution-sheet-row-beep-line")).queryByTestId("execution-sheet-beep-motion", hidden)).toBeNull();
    expect(within(get("execution-sheet-row-beep")).getByTestId("execution-sheet-beep-motion", hidden)).toBeTruthy();
    check();
  });

  // [Roue ouverte (T10 : premier appui qui la ferme sans appliquer le choix) — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : une saisie au
  // clavier n'est pas un Sélecteur ; le choix est appliqué dans le même geste, la saisie rangée.]
  it("PRE5-2.5/AC1 — choix dans les segmentés des côtés pendant la saisie de la Cible : saisie rangée, choix appliqué dans le même geste", () =>
    withPlatform("ios", () => {
      renderSheet(params({ sideMode: "UNILATERAL" }));
      openExecutionSheetField("execution-sheet-target");
      fireEvent.press(get(`${SIDE_CONTROL}-WITH`));
      expect(get("execution-sheet-target").props.accessibilityState).toMatchObject({ selected: false });
      expect(sideText()).toBe("Avec");
    }));

  it("PRE5-2.5/AC2, RC-6, PRE7-B.3 — Enchainement : déroulant de l'option Avec, rangées BY_SIDE puis BY_SERIES, notations exactes à flèche centrale ➜ (D-431, rétablies par RC-12), notation affichée en police réduite, nom accessible neutre ; effectif affiché ; masqué à N = 1 (Avec reprend son libellé, BY_SIDE écrit), conservé au retour à N ≥ 2", () => {
    const { onApply } = renderSheet(params({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE", sideRecoverySeconds: 10 }));
    // PRE-7 B.3 (B5) : rangées du déroulant, dans l'ordre D-431.
    fireEvent.press(get(ORDER_MENU));
    const labels = within(get(ORDER_PANEL))
      .getAllByRole("menuitem")
      .map((row) => String(row.props.accessibilityLabel));
    expect(labels).toEqual(["Chaque série d’un côté, puis chaque série de l’autre", "Les deux côtés à chaque série"]);
    expect(SIDE_ORDER_VALUES.map((order) => get(`${ORDER_MENU}-${order}-notation`).props.children)).toEqual([
      "DD… → GG…",
      "DG → DG → …",
    ]);
    fireEvent.press(get(`${ORDER_PANEL}-outside`));
    // Ordre de Hermann du 01/11/2026, point 5 : taille standard des options (12), sans réduction.
    expect(StyleSheet.flatten(get(`${ORDER_MENU}-notation`).props.style)).toMatchObject({ fontSize: 12, fontWeight: "600" });
    chooseOrder("Les deux côtés à chaque série");
    expect(orderText()).toBe("Les deux côtés à chaque série");
    tap("execution-sheet-series-decrement");
    tap("execution-sheet-series-decrement");
    expect(query(ORDER_MENU)).toBeNull();
    expect(get(`${SIDE_CONTROL}-WITH`).props.accessibilityLabel).toBe("Avec");
    expect(within(get(SIDE_CONTROL)).getByText("Avec", hidden)).toBeTruthy();
    tap("execution-sheet-series-increment");
    expect(orderText()).toBe("Les deux côtés à chaque série");
    tap("execution-sheet-series-decrement");
    validate();
    // NR Δ24 : BY_SIDE écrit à N = 1 (tests Q38 inchangés).
    expect(applied(onApply)).toMatchObject({ series: { count: 1 }, sideOrder: "BY_SIDE" });
  });

  it("PRE5-2.5/AC3, RC-10 — Cadence : 0, 1, 2, 5, 7 → Sans, 1 s, Autre, Autre, Autre ; options Autre / 1 s / Sans de 62", () => {
    const expected: readonly [number, string][] = [
      [0, "Sans"],
      [1, "1 s"],
      [2, "Autre"],
      [5, "Autre"],
      [7, "Autre"],
    ];
    for (const [value, option] of expected) {
      const view = renderSheetView(params({ cadenceBeepIntervalSeconds: value }));
      expect({ value, option: cadenceText() }).toEqual({ value, option });
      view.unmount();
    }
    renderSheet(params());
    const control = get(CADENCE_CONTROL);
    expect(["OTHER", "1", "NONE"].map((option) => get(`${CADENCE_CONTROL}-${option}`).props.accessibilityLabel)).toEqual([
      "Autre",
      "1 s",
      "Sans",
    ]);
    expect(query(`${CADENCE_CONTROL}-5`)).toBeNull();
    expect(query(`${CADENCE_CONTROL}-2`)).toBeNull();
    // Chaque option a la largeur de l'option Sans de la Charge (62).
    expect(StyleSheet.flatten(control.props.style)).toMatchObject({ height: 32, width: 3 * 62 + 2 * 2 + 2 * 3 });
  });

  it("PRE5-2.5/AC3 — Autre : valeur inchangée, ± ouvert sous la ligne, Autre affiché ; fermeture → option de la valeur ; 1 s / Sans écrivent leur valeur et ferment le ± (RC-10) ; aucune valeur personnalisée mémorisée", () => {
    const { onApply } = renderSheet(params({ cadenceBeepIntervalSeconds: 0 }));
    // [± révélé sous la ligne — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : champ clavier révélé et focalisé (focus simulé).]
    fireEvent.press(get(`${CADENCE_CONTROL}-OTHER`));
    fireEvent(get("execution-sheet-beep-input"), "focus");
    expect(cadenceText()).toBe("Autre");
    expect(valueOf("execution-sheet-beep")).toBe("00:00");
    expect(within(get("execution-sheet-row-beep")).getByTestId("execution-sheet-beep", hidden)).toBeTruthy();
    // Sortie sans frappe : Sans, valeur 0.
    closeExecutionSheetField("execution-sheet-beep");
    expect(query("execution-sheet-beep-input")).toBeNull();
    expect(cadenceText()).toBe("Sans");
    // 7 s saisies (Autre, « Autre, 7 s »), puis 1 s par le segmenté, qui range la saisie.
    enterExecutionSheetValue("execution-sheet-beep", 7);
    expect(get(`${CADENCE_CONTROL}-OTHER`).props.accessibilityLabel).toBe("Autre, 7 s");
    openExecutionSheetField("execution-sheet-beep");
    fireEvent.press(get(`${CADENCE_CONTROL}-1`));
    expect(query("execution-sheet-beep-input")).toBeNull();
    expect(cadenceText()).toBe("1 s");
    // Sans puis Autre : rien n'est restauré (7 s oublié).
    fireEvent.press(get(`${CADENCE_CONTROL}-NONE`));
    fireEvent.press(get(`${CADENCE_CONTROL}-OTHER`));
    fireEvent(get("execution-sheet-beep-input"), "focus");
    expect(valueOf("execution-sheet-beep")).toBe("00:00");
    // 1 s pendant la saisie : écrit, saisie rangée.
    fireEvent.press(get(`${CADENCE_CONTROL}-1`));
    expect(query("execution-sheet-beep-input")).toBeNull();
    validate();
    expect(applied(onApply).cadenceBeepIntervalSeconds).toBe(1);
  });

  it("PRE5-2.5/AC3 — re-choisir l'option affichée laisse le Brouillon inchangé (`Annuler` d'un retrait reste valable) ; roue ouverte (T10) : choix non appliqué", () =>
    withPlatform("ios", () => {
      const view = renderSheetView(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]), cadenceBeepIntervalSeconds: 1 }));
      fireEvent.press(get("execution-sheet-table-row-2-remove"));
      expect(query("execution-sheet-adjusted-undo")).not.toBeNull();
      fireEvent.press(get(`${CADENCE_CONTROL}-1`));
      expect(query("execution-sheet-adjusted-undo")).not.toBeNull();
      fireEvent.press(get("execution-sheet-adjusted-undo"));
      view.unmount();
      // [T10 : roue de la Cible commune ouverte, Sans non appliqué — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : la saisie de la Cible n'est
      // pas un Sélecteur ; Sans est appliqué dans le même geste.]
      renderSheet(params({ cadenceBeepIntervalSeconds: 1 }));
      openExecutionSheetField("execution-sheet-target");
      fireEvent.press(get(`${CADENCE_CONTROL}-NONE`));
      expect(cadenceText()).toBe("Sans");
    }));

  it("PRE5-2.5/AC4 — Durée de l'exercice : repliée à l'ouverture, Compte à rebours et Fin absents ; chevron à 12 du libellé → visibles ; valeur, nature et roue inchangées ; chevron et pastille distincts", () => {
    const { onApply } = renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] }, countdownSeconds: 10, endSeconds: 5 }));
    expect(screen.getByText("Durée de l’exercice", hidden)).toBeTruthy();
    expect(text("execution-sheet-total")).toBe(formatPhraseDuration(3 * 40));
    expect(signals()).toEqual({ countdown: false, end: false, disclosure: true });
    // Chevron à 12 du libellé, bas replié.
    let labelGroup = get(`${DURATION_DISCLOSURE}-frame`).parent;
    while (labelGroup && StyleSheet.flatten(labelGroup.props.style)?.flexDirection !== "row") labelGroup = labelGroup.parent;
    expect(StyleSheet.flatten(labelGroup?.props.style)).toMatchObject({ flexDirection: "row", gap: 12 });
    expect(within(labelGroup!).getByText("Durée de l’exercice", hidden)).toBeTruthy();
    const disclosure = screen.getByLabelText(strings.executionParameters.sheet.showExerciseSignals);
    expect(disclosure.props.accessibilityState).toMatchObject({ expanded: false });
    fireEvent.press(disclosure);
    expect(signals()).toEqual({ countdown: true, end: true, disclosure: true });
    expect(text("execution-sheet-total")).toBe(formatPhraseDuration(3 * 40));
    expect(screen.getByLabelText(strings.executionParameters.sheet.hideExerciseSignals).props.accessibilityState).toMatchObject({ expanded: true });
    // Pastille : ouvre la saisie ([roue — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]), sans replier.
    openExecutionSheetField("execution-sheet-total");
    expect(get("execution-sheet-total").props.accessibilityState).toMatchObject({ selected: true });
    expect(signals()).toEqual({ countdown: true, end: true, disclosure: true });
    closeExecutionSheetField("execution-sheet-total");
    // Compte à rebours réglé, puis replié pendant sa saisie : rangé, valeur conservée.
    tap("execution-sheet-countdown-increment");
    openExecutionSheetField("execution-sheet-countdown");
    fireEvent.press(screen.getByLabelText(strings.executionParameters.sheet.hideExerciseSignals));
    expect(signals()).toEqual({ countdown: false, end: false, disclosure: true });
    validate();
    expect(applied(onApply)).toMatchObject({ countdownSeconds: 11, endSeconds: 5 });
  });

  // D-433 : la ligne n'est plus jamais absente ; Compte à rebours et Fin sont toujours repliés
  // par défaut derrière son chevron, y compris en « Non calculable ».
  it("PRE5-2.5/AC4, D-433 — Sans total (Durée à l'échec, Répétitions sans Cadence) : ligne « Non calculable », Compte à rebours et Fin repliés derrière le chevron ; Cadence 1 s : valeur ≈, toujours repliée", () => {
    const view = renderSheetView(durationParameters("FAILURE", 3, 10));
    expect(query("execution-sheet-row-total")).not.toBeNull();
    expect(totalShown()).toBe(TOTAL_NOT_CALCULABLE);
    expect(signals()).toEqual({ countdown: false, end: false, disclosure: true });
    showSignals();
    expect(signals()).toEqual({ countdown: true, end: true, disclosure: true });
    view.unmount();
    renderSheet(params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
    expect(totalShown()).toBe(TOTAL_NOT_CALCULABLE);
    expect(signals()).toEqual({ countdown: false, end: false, disclosure: true });
    // Cadence 1 s (RC-10) : la valeur ≈ remplace « Non calculable », titre inchangé, repliée.
    fireEvent.press(get(`${CADENCE_CONTROL}-1`));
    expect(screen.getByText("Durée de l’exercice", hidden)).toBeTruthy();
    expect(totalShown()).toBe(`≈ ${formatPhraseDuration(3 * (10 * 1 + 15))}`);
    expect(signals()).toEqual({ countdown: false, end: false, disclosure: true });
  });

  it("PRE5-2.5/AC4, D-433 — Exercice ouvert depuis une Séance : ni Compte à rebours, ni Fin, ni chevron, ligne chiffrée ou « Non calculable » ; valeurs conservées au ✓", () => {
    let view = renderWithSignals(params({ countdownSeconds: 12, endSeconds: 7 }), "absent");
    expect(query("execution-sheet-row-total")).not.toBeNull();
    expect(signals()).toEqual({ countdown: false, end: false, disclosure: false });
    fireEvent.press(get("execution-sheet-validate"));
    expect(applied(view.onApply)).toMatchObject({ countdownSeconds: 12, endSeconds: 7 });
    view.unmount();
    // D-433 : à l'échec en identiques, la ligne reste (« Non calculable »), toujours sans chevron.
    view = renderWithSignals({ ...durationParameters("FAILURE", 3, 10), countdownSeconds: 12, endSeconds: 7 }, "absent");
    expect(query("execution-sheet-row-total")).not.toBeNull();
    expect(totalShown()).toBe(TOTAL_NOT_CALCULABLE);
    expect(signals()).toEqual({ countdown: false, end: false, disclosure: false });
    view.unmount();
    // Défaut : signaux présents (Catalogue).
    renderWithSignals(params(), "present");
    expect(signals()).toEqual({ countdown: false, end: false, disclosure: true });
  });

  it("PRE5-2.5/AC4 — annonce de la ligne en lecture seule portée par la valeur, chevron élément distinct ; libellé non annoncé deux fois", () => {
    renderSheet(params({ series: variableRows([[30, 10], [45, 20]]) }));
    const valueGroup = get("execution-sheet-row-total-value-group");
    expect(valueGroup.props).toMatchObject({ accessible: true, accessibilityRole: "text" });
    expect(valueGroup.props.accessibilityLabel).toBe(`Durée de l’exercice, ${formatPhraseDuration(30 + 10 + 45 + 20)}, non modifiable`);
    expect(get("execution-sheet-row-total-line").props.accessible).toBeUndefined();
    expect(screen.getByText("Durée de l’exercice", hidden).props.accessibilityElementsHidden).toBe(true);
    expect(screen.getByLabelText(strings.executionParameters.sheet.showExerciseSignals).props.accessibilityRole).toBe("button");
  });
});

/**
 * PRE-5 story 2.7 (AC1 à AC5 ; FR-10 à FR-14, FR-23, Δ48 ; AD-28) — charge dans la Feuille :
 * en identiques, le champ commun (`KeyboardField` de 2.2, inchangé) est le contenu de l'option
 * Avec sélectionnée (« 20 kg » dans le segment, Figma `9289:17849`) ; en variables, l'option
 * garde « Avec » et la colonne Charge porte les champs. Écart d'amorce du tableau rétrécissable
 * (tenue à 375). Focus natif simulé : clavier, barre, rendu et tenue à 375 se jugent sur iPhone
 * (R-2.7-01 à 07), sans constat inventé.
 */
describe("ExecutionParametersSheet — PRE-5 story 2.7", () => {
  const hidden = { includeHiddenElements: true } as const;
  const get = (testID: string) => screen.getByTestId(testID, hidden);
  const query = (testID: string) => screen.queryByTestId(testID, hidden);
  const styleOf = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};
  const LOAD_CONTROL = "execution-sheet-load-control";
  const UNIFORM = "execution-sheet-load-input";
  const cell = (row: number) => `execution-sheet-table-row-${row}-load`;
  // D-434 : une cellule du tableau (`…-load`) porte son entrée native transparente (`…-input`)
  // et sa valeur affichée (`…-value`) ; recette du 20/10 (RC-14) : la charge commune aussi (`cellDecimal`).
  const input = (testID: string) => `${testID}-input`;
  const focus = (testID: string) => fireEvent(get(input(testID)), "focus");
  const blur = (testID: string) => fireEvent(get(input(testID)), "blur");
  // Cellule : frappes au clavier natif (la première remplace) ; texte vide = Retour arrière
  // jusqu'à vider la cellule.
  const type = (testID: string, text: string) => {
    if (text === "") typeInExecutionSheetCell(testID, CELL_BACKSPACE.repeat(String(get(input(testID)).props.value).length));
    else typeInExecutionSheetCell(testID, text);
  };
  const shown = (testID: string) => String(get(`${testID}-value`).props.children);
  const loadChoice = () => selectedValue(LOAD_CONTROL, ["WITH", "WITHOUT"]);
  /** Libellés texte rendus dans le segmenté de la Charge. */
  const controlLabels = () => within(get(LOAD_CONTROL)).queryAllByText(/^(Avec|Sans)$/, hidden).map((node) => node.props.children);
  // Décision du 06/11/2026 (constat c) : les valeurs hors tableau ont aussi leur entrée clavier ; seules celles
  // de la charge sont comptées ici.
  const inputs = () =>
    screen.UNSAFE_root.findAll((node) => node.props.keyboardType !== undefined && typeof node.type === "string" && String(node.props.testID).includes("load"));
  const uniformLoad = (loadKg: number, enabled = true, overrides: Partial<ExecutionParametersInput> = {}) =>
    params({
      series: { kind: "UNIFORM", count: 3, target: numberTarget(90), pauseSeconds: 15, loadKg, workPhases: [] },
      loadEnabled: enabled,
      ...overrides,
    });
  const variableLoads = (loads: number[], enabled = true, overrides: Partial<ExecutionParametersInput> = {}) =>
    params({
      series: { kind: "VARIABLE", rows: loads.map((loadKg, index) => ({ target: numberTarget(10 + index), pauseSeconds: 10, loadKg })), workPhases: [] },
      loadEnabled: enabled,
      ...overrides,
    });
  const spies: { mockRestore: () => void }[] = [];
  let keyboard: ReturnType<typeof captureKeyboard>;
  beforeEach(() => {
    keyboard = captureKeyboard();
  });
  afterEach(() => {
    spies.splice(0).forEach((spy) => spy.mockRestore());
    keyboard.restore();
  });

  it("PRE5-2.7/AC1, RC-14 — identiques, Sans → Avec : le segment Avec affiche « 0,25 kg » (champ commun dans l'option, aucune pastille séparée) et le focus natif lui est donné (clavier ouvert, RC-14)", () => {
    const focusSpy = jest.spyOn(TextInput.prototype as unknown as Record<"focus", () => void>, "focus");
    // `focus` du simulacre de `TextInput` est partagé : appels des tests précédents effacés (depuis le 06/11/2026,
    // des champs hors tableau reçoivent aussi le focus natif).
    focusSpy.mockClear();
    spies.push(focusSpy);
    renderSheet(params());
    expect(controlLabels()).toEqual(["Avec", "Sans"]);
    fireEvent.press(get(`${LOAD_CONTROL}-WITH`));
    expect(loadChoice()).toBe("WITH");
    // Le champ est rendu DANS le segmenté, à la place du libellé « Avec » ; « Sans » reste.
    expect(within(get(LOAD_CONTROL)).getByTestId(UNIFORM, hidden)).toBeTruthy();
    expect(controlLabels()).toEqual(["Sans"]);
    expect(shown(UNIFORM)).toBe("0,25 kg");
    expect(inputs().map((node) => String(node.props.testID))).toEqual([`${UNIFORM}-input`]);
    // RC-14 : Avec ouvre le clavier dans l'option (focus natif de l'entrée de la charge commune).
    expect(focusSpy.mock.contexts.map((instance) => String((instance as { props: { testID?: string } }).props.testID))).toEqual([
      `${UNIFORM}-input`,
    ]);
    // Plein cadre de l'option (62 × 26, rayon 5), texte centré blanc Semi Bold 12, sans fond propre.
    expect(styleOf(UNIFORM)).toMatchObject({ width: 62, height: 26, borderRadius: 5, alignItems: "center", justifyContent: "center" });
    expect(styleOf(`${UNIFORM}-value`)).toMatchObject({
      textAlign: "center",
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.background,
    });
    expect(styleOf(UNIFORM).backgroundColor).toBeUndefined();
    expect(styleOf(UNIFORM).minWidth).toBeUndefined();
    // Le segment Avec annonce aussi la valeur affichée.
    expect(get(`${LOAD_CONTROL}-WITH`).props.accessibilityLabel).toBe("Avec, 0,25 kg");
  });

  it("PRE5-2.7/AC1, RC-14 — toucher le segment à 20 kg : focus du champ, « 20 » sans sélection native (la première frappe remplace), fond #EAEAFF et texte primaire, barre ; « 1,3 » puis « Fermer » → « 1,5 kg » dans le segment", () => {
    const { onApply } = renderSheet(uniformLoad(20));
    expect(shown(UNIFORM)).toBe("20 kg");
    expect(controlLabels()).toEqual(["Sans"]);
    focus(UNIFORM);
    keyboard.show();
    expect(shown(UNIFORM)).toBe("20");
    expect(get(input(UNIFORM)).props.selectTextOnFocus).toBe(false);
    expect(get(input(UNIFORM)).props.keyboardType).toBe("decimal-pad");
    expect(styleOf(UNIFORM)).toMatchObject({ backgroundColor: "#EAEAFF" });
    expect(styleOf(`${UNIFORM}-value`)).toMatchObject({ color: colors.primary });
    expect(get(UNIFORM).props.accessibilityState).toMatchObject({ selected: true });
    expect(query("execution-sheet-keyboard-bar")).not.toBeNull();
    type(UNIFORM, "1,3");
    fireEvent.press(get("execution-sheet-keyboard-close"));
    keyboard.hide();
    blur(UNIFORM);
    expect(shown(UNIFORM)).toBe("1,5 kg");
    expect(styleOf(UNIFORM).backgroundColor).toBeUndefined();
    expect(styleOf(`${UNIFORM}-value`).color).toBe(colors.background);
    expect(loadChoice()).toBe("WITH");
    validate();
    expect(applied(onApply)).toMatchObject({ loadEnabled: true, series: { kind: "UNIFORM", loadKg: 1.5 } });
  });

  it("PRE5-2.7/AC3 — identiques : texte illisible → valeur précédente dans le segment ; « 0 » puis fermeture → Sans, le segment affiche de nouveau « Avec »", () => {
    const { onApply } = renderSheet(uniformLoad(20));
    focus(UNIFORM);
    type(UNIFORM, ",");
    blur(UNIFORM);
    expect(shown(UNIFORM)).toBe("20 kg");
    focus(UNIFORM);
    type(UNIFORM, "0");
    blur(UNIFORM);
    expect(loadChoice()).toBe("WITHOUT");
    expect(query(UNIFORM)).toBeNull();
    expect(controlLabels()).toEqual(["Avec", "Sans"]);
    validate();
    expect(applied(onApply)).toMatchObject({ loadEnabled: false, series: { kind: "UNIFORM", loadKg: 0 } });
  });

  it("PRE5-2.7/AC2 — variables : l'option garde « Avec » (aucun champ dans le segment), colonne Charge au titre non interactif, une cellule clavier par série", () => {
    renderSheet(variableLoads([20, 0, 5]));
    expect(loadChoice()).toBe("WITH");
    // Contrôle segmenté du 04/11/2026 (Hermann : option sélectionnée à droite) : l'option choisie est la dernière.
    expect(controlLabels()).toEqual(["Sans", "Avec"]);
    expect(within(get(LOAD_CONTROL)).queryByTestId(UNIFORM, hidden)).toBeNull();
    expect(get(`${LOAD_CONTROL}-WITH`).props.accessibilityLabel).toBe("Avec");
    const header = within(get("execution-sheet-table-header")).getByText("Charge", hidden);
    expect(header.props.onPress).toBeUndefined();
    // D-434 : une entrée par cellule (Cible, Pause, Charge) ; la Charge au clavier décimal.
    expect(inputs().map((node) => String(node.props.testID)).filter((id) => id.endsWith("-load-input")).sort()).toEqual(
      [1, 2, 3].map((row) => input(cell(row))),
    );
    expect([1, 2, 3].map((row) => shown(cell(row)))).toEqual(["20 kg", "0 kg", "5 kg"]);
  });

  it("PRE5-2.7/AC5 (Δ48) — Répétitions × Identiques : « 20 kg » dans le segment, saisie appliquée, Répétitions et Pause inchangées", () => {
    const { onApply } = renderSheet(
      uniformLoad(20, true, { mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: numberTarget(12), pauseSeconds: 15, loadKg: 20, workPhases: [] } }),
    );
    expect(selectedValue(MODE_CONTROL, ["REPETITIONS", "DURATION"])).toBe("REPETITIONS");
    expect(get("execution-sheet-row-target")).toBeTruthy();
    expect(shown(UNIFORM)).toBe("20 kg");
    focus(UNIFORM);
    type(UNIFORM, "22,5");
    blur(UNIFORM);
    expect(shown(UNIFORM)).toBe("22,5 kg");
    validate();
    expect(applied(onApply)).toMatchObject({
      mode: "REPETITIONS",
      loadEnabled: true,
      series: { kind: "UNIFORM", count: 3, target: numberTarget(12), pauseSeconds: 15, loadKg: 22.5 },
    });
  });

  it("PRE5-2.7/AC5 (Δ48) — Répétitions × Variables : colonne Charge, saisie par cellule, cibles et pauses inchangées", () => {
    const { onApply } = renderSheet(variableLoads([10, 20], true, { mode: "REPETITIONS" }));
    expect(selectedValue(MODE_CONTROL, ["REPETITIONS", "DURATION"])).toBe("REPETITIONS");
    // Contrôle segmenté du 04/11/2026 (Hermann : option sélectionnée à droite) : l'option choisie est la dernière.
    expect(controlLabels()).toEqual(["Sans", "Avec"]);
    focus(cell(2));
    type(cell(2), "1,3");
    blur(cell(2));
    expect(shown(cell(2))).toBe("1,5 kg");
    validate();
    expect(applied(onApply)).toMatchObject({
      mode: "REPETITIONS",
      series: {
        kind: "VARIABLE",
        rows: [
          { target: numberTarget(10), pauseSeconds: 10, loadKg: 10 },
          { target: numberTarget(11), pauseSeconds: 10, loadKg: 1.5 },
        ],
      },
    });
  });

  it.each(["DURATION", "REPETITIONS"] as const)(
    "PRE5-2.7/AC1, AC5 (Δ48) — %s, cible À l'échec avec charge : ligne de cible masquée, ligne Charge présente, segment éditable",
    (mode) => {
      const { onApply } = renderSheet(
        uniformLoad(20, true, { mode, series: { kind: "UNIFORM", count: 3, target: failureTarget(), pauseSeconds: 15, loadKg: 20, workPhases: [] } }),
      );
      expect(query("execution-sheet-row-target")).toBeNull();
      expect(get("execution-sheet-row-load")).toBeTruthy();
      expect(shown(UNIFORM)).toBe("20 kg");
      focus(UNIFORM);
      type(UNIFORM, "0,01");
      blur(UNIFORM);
      expect(shown(UNIFORM)).toBe("0,25 kg");
      validate();
      expect(applied(onApply)).toMatchObject({ mode, series: { kind: "UNIFORM", target: failureTarget(), loadKg: 0.25 } });
    },
  );

  it("PRE5-2.7/AC5 (Δ48) — Condition d'arrêt À l'échec puis À la cible avec la charge active : le segment garde « 20 kg »", () => {
    renderSheet(uniformLoad(20));
    fireEvent.press(get(`${STOP_CONTROL}-FAILURE`));
    expect(query("execution-sheet-row-target")).toBeNull();
    expect(shown(UNIFORM)).toBe("20 kg");
    fireEvent.press(get(`${STOP_CONTROL}-TARGET`));
    expect(get("execution-sheet-row-target")).toBeTruthy();
    expect(shown(UNIFORM)).toBe("20 kg");
  });

  it("PRE5-2.7/AC5 — Sans conserve la valeur après ✓ et réouverture ; Avec la restaure dans le segment", () => {
    const first = renderSheetView(uniformLoad(20));
    fireEvent.press(get(`${LOAD_CONTROL}-WITHOUT`));
    expect(query(UNIFORM)).toBeNull();
    validate();
    const saved = applied(first.onApply);
    expect(saved).toMatchObject({ loadEnabled: false, series: { kind: "UNIFORM", loadKg: 20 } });
    first.unmount();
    renderSheet(saved);
    expect(loadChoice()).toBe("WITHOUT");
    expect(controlLabels()).toEqual(["Avec", "Sans"]);
    fireEvent.press(get(`${LOAD_CONTROL}-WITH`));
    expect(shown(UNIFORM)).toBe("20 kg");
  });

  it("PRE5-2.7/AC2 — déplacement d'une série : sa charge la suit dans la colonne", () => {
    const { onApply } = renderSheet(variableLoads([10, 20, 30]));
    moveAction(1, "moveDown");
    expect([1, 2, 3].map((row) => shown(cell(row)))).toEqual(["20 kg", "10 kg", "30 kg"]);
    validate();
    expect(applied(onApply).series).toMatchObject({ kind: "VARIABLE", rows: [{ loadKg: 20 }, { loadKg: 10 }, { loadKg: 30 }] });
  });

  it("PRE5-2.7 (tenue à 375) — écart d'amorce de 20 absorbant presque tout le manque (pondération flexShrink × largeur), identique dans l'en-tête et les lignes ; amorce de 38 et cellules inchangées", () => {
    renderSheet(variableLoads([10, 20]));
    const gap = { width: TABLE_LEAD_GAP, flexShrink: TABLE_LEAD_GAP_SHRINK };
    expect(TABLE_LEAD_GAP).toBe(20);
    expect(TABLE_LEAD_GAP_SHRINK).toBeGreaterThan(1);
    expect(styleOf("execution-sheet-table-header-lead-gap")).toEqual(gap);
    expect(styleOf("execution-sheet-table-row-1-lead-gap")).toEqual(gap);
    expect(styleOf("execution-sheet-table-row-2-lead-gap")).toEqual(gap);
    // Amorce de l'en-tête : 38 seulement (l'écart est la vue qui suit) ; amorce des lignes sans marge.
    const headerLead = get("execution-sheet-table-header").children[0];
    if (typeof headerLead === "string") throw new Error("amorce de l’en-tête absente");
    expect(StyleSheet.flatten(headerLead.props.style)).toEqual({ width: TABLE_LEAD_WIDTH });
    // Amorce d'une ligne : premier conteneur natif au-dessus de la poignée.
    const handle = get("execution-sheet-table-row-1-handle");
    let lead = handle.parent!;
    while (typeof lead.type !== "string" || lead.props.testID === handle.props.testID) lead = lead.parent!;
    expect(StyleSheet.flatten(lead.props.style)).toMatchObject({ width: TABLE_LEAD_WIDTH });
    expect(StyleSheet.flatten(lead.props.style).marginRight).toBeUndefined();
    // Cellules : 71, facteur de rétrécissement 1 (rétrécissement négligeable tant que l’écart n’est pas épuisé).
    expect(styleOf("execution-sheet-table-row-1-load-cell")).toMatchObject({ width: 71, flexShrink: 1 });
  });

  it("PRE5-2.7 — Sans : ligne Charge réduite au segmenté « Avec | Sans », aucun champ ni pastille", () => {
    renderSheet(uniformLoad(20, false));
    expect(loadChoice()).toBe("WITHOUT");
    expect(controlLabels()).toEqual(["Avec", "Sans"]);
    expect(inputs()).toHaveLength(0);
    expect(query(UNIFORM)).toBeNull();
  });

  // Recette du 20/10 (RC-14) : charge commune saisie comme les cellules (D-434, `cellDecimal`).
  it("RC-14 — identiques : Avec sélectionne l'option et ouvre la saisie dans l'option (valeur restaurée) ; première frappe qui remplace, Retour arrière ; barre : Précédent et Suivant vers les champs voisins, Fermer, pas d'« À l'échec » ; validation : « 34,1 » → « 34,25 kg » sans chevron ; toucher l'option sélectionnée rouvre la saisie ; Sans : « Avec », non sélectionné", () => {
    const focusSpy = jest.spyOn(TextInput.prototype as unknown as Record<"focus", () => void>, "focus");
    // `focus` du simulacre de `TextInput` est partagé : appels des tests précédents effacés (depuis le 06/11/2026,
    // des champs hors tableau reçoivent aussi le focus natif).
    focusSpy.mockClear();
    spies.push(focusSpy);
    // Entrées ayant reçu le focus (sans doublon : le `focus` simulé de React Native peut se rappeler lui-même).
    const focused = () => [...new Set(focusSpy.mock.contexts.map((instance) => String((instance as { props: { testID?: string } }).props.testID)))];
    const { onApply } = renderSheet(uniformLoad(20, false));
    fireEvent.press(get(`${LOAD_CONTROL}-WITH`));
    expect(loadChoice()).toBe("WITH");
    expect(focused()).toEqual([input(UNIFORM)]);
    // Le focus natif arrive : saisie dans l'option, réactivation restaurée (20).
    focus(UNIFORM);
    keyboard.show();
    expect(shown(UNIFORM)).toBe("20");
    expect(get(UNIFORM).props.accessibilityState).toMatchObject({ selected: true });
    expect(styleOf(UNIFORM)).toMatchObject({ backgroundColor: "#EAEAFF" });
    // [Précédent et Suivant indisponibles (charge commune seule) — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : la charge est un des champs hors
    // tableau, entre la Pause et la Durée de l'exercice.]
    expect(get("execution-sheet-keyboard-previous").props.accessibilityState).toMatchObject({ disabled: false });
    expect(get("execution-sheet-keyboard-next").props.accessibilityState).toMatchObject({ disabled: false });
    expect(query("execution-sheet-keyboard-close")).not.toBeNull();
    expect(query("execution-sheet-keyboard-failure")).toBeNull();
    type(UNIFORM, "3");
    expect(shown(UNIFORM)).toBe("3");
    type(UNIFORM, "5");
    type(UNIFORM, "⌫");
    expect(shown(UNIFORM)).toBe("3");
    type(UNIFORM, "4,1");
    fireEvent.press(get("execution-sheet-keyboard-close"));
    keyboard.hide();
    blur(UNIFORM);
    // Arrondi au 0,25 supérieur ; la valeur remplace « Avec » dans l'option, sans chevron.
    expect(shown(UNIFORM)).toBe("34,25 kg");
    expect(query(`${LOAD_CONTROL}-WITH-chevron`)).toBeNull();
    expect(get(UNIFORM).props.accessibilityState).toMatchObject({ selected: false });
    // Toucher l'option sélectionnée (valeur affichée) rouvre la saisie.
    focusSpy.mockClear();
    fireEvent.press(get(UNIFORM));
    expect(focused()).toEqual([input(UNIFORM)]);
    // Sans : l'option reprend « Avec », non sélectionnée.
    fireEvent.press(get(`${LOAD_CONTROL}-WITHOUT`));
    expect(loadChoice()).toBe("WITHOUT");
    expect(controlLabels()).toEqual(["Avec", "Sans"]);
    expect(query(UNIFORM)).toBeNull();
    // Réactivation : valeur restaurée, saisie rouverte.
    focusSpy.mockClear();
    fireEvent.press(get(`${LOAD_CONTROL}-WITH`));
    expect(shown(UNIFORM)).toBe("34,25 kg");
    expect(focused()).toEqual([input(UNIFORM)]);
    validate();
    expect(applied(onApply)).toMatchObject({ loadEnabled: true, series: { kind: "UNIFORM", loadKg: 34.25 } });
  });

  it("RC-14 — première activation : 0,25 kg et saisie ouverte ; zéro à la validation → Sans ; variables : Avec n'ouvre pas le clavier (RC-2)", () => {
    const focusSpy = jest.spyOn(TextInput.prototype as unknown as Record<"focus", () => void>, "focus");
    // `focus` du simulacre de `TextInput` est partagé : appels des tests précédents effacés (depuis le 06/11/2026,
    // des champs hors tableau reçoivent aussi le focus natif).
    focusSpy.mockClear();
    spies.push(focusSpy);
    // Entrées ayant reçu le focus (sans doublon : le `focus` simulé de React Native peut se rappeler lui-même).
    const focused = () => [...new Set(focusSpy.mock.contexts.map((instance) => String((instance as { props: { testID?: string } }).props.testID)))];
    renderSheet(uniformLoad(0, false));
    fireEvent.press(get(`${LOAD_CONTROL}-WITH`));
    expect(focused()).toEqual([input(UNIFORM)]);
    focus(UNIFORM);
    expect(shown(UNIFORM)).toBe("0,25");
    type(UNIFORM, "0");
    blur(UNIFORM);
    expect(loadChoice()).toBe("WITHOUT");
    expect(controlLabels()).toEqual(["Avec", "Sans"]);
    screen.unmount();
    focusSpy.mockClear();
    renderSheet(variableLoads([0, 0], false));
    fireEvent.press(get(`${LOAD_CONTROL}-WITH`));
    expect(focused()).toEqual([]);
    // Contrôle segmenté du 04/11/2026 (Hermann : option sélectionnée à droite) : l'option choisie est la dernière.
    expect(controlLabels()).toEqual(["Sans", "Avec"]);
  });

  it("RC-14 — largeur de l'option Avec : 62 si la valeur tient (« 99,75 kg ») ; sinon le strict nécessaire (« 487,75 kg » → 67), pendant la saisie comprise ; en variables, 62", () => {
    const flat = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};
    const widths = () => ({ option: flat(`${LOAD_CONTROL}-tile-WITH`).width, field: flat(UNIFORM).width, control: flat(LOAD_CONTROL).width });
    renderSheet(uniformLoad(99.75));
    expect(widths()).toEqual({ option: 62, field: 62, control: 132 });
    screen.unmount();
    renderSheet(uniformLoad(487.75));
    expect(widths()).toEqual({ option: 67, field: 67, control: 137 });
    screen.unmount();
    renderSheet(uniformLoad(20));
    focus(UNIFORM);
    type(UNIFORM, "1234567,25");
    expect(widths()).toEqual({ option: 77, field: 77, control: 147 });
    blur(UNIFORM);
    expect(shown(UNIFORM)).toBe("1234567,25 kg");
    expect(widths()).toEqual({ option: 95, field: 95, control: 165 });
    screen.unmount();
    renderSheet(variableLoads([20, 30]));
    expect(flat(`${LOAD_CONTROL}-tile-WITH`).width).toBe(62);
  });
});

/**
 * D-433 (décision de Hermann du 19/10, fait foi) — la ligne « Durée de l’exercice » est
 * toujours affichée dans la Feuille, à la même place (après la Cadence), en trois états :
 * « Non calculable » quand la configuration seule exclut le calcul (Répétitions sans Cadence,
 * À l'échec en séries identiques ; prime sur « — ») ; « — » quand des données manquent (Mode non
 * choisi, Cible à renseigner, saisie invalide, tableau variable entièrement à l'échec — ce
 * dernier en attente d'arbitrage) ; sinon la valeur, précédée de son symbole (≈, ≥) dans la même
 * zone d'affichage. Compte à rebours et Fin sont toujours repliés par défaut derrière le chevron
 * de la ligne, sauf depuis une Séance (ni lignes ni chevron). Jest n'exerce ni VoiceOver ni le
 * rendu natif : le constat sur iPhone appartient à Hermann.
 */
describe("ExecutionParametersSheet — D-433 (ligne Durée de l’exercice toujours affichée)", () => {
  const hidden = { includeHiddenElements: true } as const;
  const get = (testID: string) => screen.getByTestId(testID, hidden);
  const query = (testID: string) => screen.queryByTestId(testID, hidden);
  const sheetText = strings.executionParameters.sheet;
  /** Lignes du cadre « Cadence et durée », dans l'ordre d'affichage (testID de la ligne). */
  const cadenceFrameRows = () =>
    within(get("execution-sheet-frame-cadence"))
      .queryAllByTestId(/^execution-sheet-row-.+-line$/, hidden)
      .map((node) => String(node.props.testID).replace(/-line$/u, ""));
  const totalIndex = () => cadenceFrameRows().indexOf("execution-sheet-row-total");
  const titleText = () => String(within(get("execution-sheet-row-total-line")).getAllByText(/^Durée de l’exercice/u, hidden)[0]!.props.children);
  const signals = () => ({
    countdown: query("execution-sheet-row-countdown") !== null,
    end: query("execution-sheet-row-end") !== null,
    disclosure: query(`${DURATION_DISCLOSURE}-frame`) !== null,
  });
  /** Feuille avec la prop des signaux (Exercice ouvert depuis une Séance : `"absent"`), comme en story 2.5. */
  function renderWithSignals(parent: ExecutionParametersInput, exerciseSignals: "present" | "absent") {
    const view = render(
      <TestSafeAreaProvider>
        <ExecutionParametersSheet
          parent={parent}
          profileSideRecoverySecondsDefault={10}
          exerciseSignals={exerciseSignals}
          onApply={jest.fn<(value: ExecutionParameters) => void>()}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );
    return { unmount: view.unmount };
  }
  /**
   * Invariants de la ligne dans tout état : présente, à l'index attendu du cadre, titre exact
   * sans symbole, valeur affichée attendue (jamais « 0 s »), chevron présent, Compte à rebours
   * et Fin repliés.
   */
  function expectLine(shown: string, index: number) {
    expect(query("execution-sheet-row-total")).not.toBeNull();
    expect(totalIndex()).toBe(index);
    expect(titleText()).toBe("Durée de l’exercice");
    expect(titleText()).not.toMatch(/[≈≥]/u);
    expect(totalShown()).toBe(shown);
    expect(totalShown()).not.toBe("0 s");
    expect(screen.queryAllByText("0 s", hidden)).toHaveLength(0);
    expect(signals()).toEqual({ countdown: false, end: false, disclosure: true });
  }

  it("D-433 — transitions dans une même Feuille : valeur sans symbole → À l'échec « Non calculable » → retour → Répétitions sans Cadence, Cible manquante « Non calculable » (préséance) → Cadence 1 s « — » → Cible 10 « ≈ » → Cadence Sans « Non calculable » ; même place, chevron, signaux repliés, annonces", () => {
    // Durée, identiques, 3 × (90 s + 15 s) = 315 s : pastille modifiable, sans symbole.
    renderSheet(params());
    const index = totalIndex();
    expect(index).toBeGreaterThan(0);
    expect(cadenceFrameRows()[index - 1]).toBe("execution-sheet-row-beep");
    expectLine(formatPhraseDuration(3 * (90 + 15)), index);
    expect(totalShown()).toBe("5 min 15 s");
    // Décision du 06/11/2026 : champ clavier nommé, valeur annoncée à part.
    expect(get("execution-sheet-total").props.accessibilityLabel).toBe(sheetText.exerciseDurationEditAccessibilityLabel);
    expect(get("execution-sheet-total").props.accessibilityValue).toEqual({ text: "5 min 15 s" });

    // Condition d'arrêt À l'échec en identiques : la configuration exclut le calcul.
    fireEvent.press(get(`${STOP_CONTROL}-FAILURE`));
    expectLine(TOTAL_NOT_CALCULABLE, index);
    expect(query("execution-sheet-total")).toBeNull();
    expect(totalSpoken()).toBe(TOTAL_NOT_CALCULABLE_SPOKEN);

    // Retour à une Cible : la valeur revient, à la même place.
    fireEvent.press(get(`${STOP_CONTROL}-TARGET`));
    expectLine("5 min 15 s", index);

    // Répétitions, Cadence 0 (Sans), Cible devenue à renseigner : « Non calculable » prime sur « — ».
    chooseMode("Répétitions");
    expect(cadenceText()).toBe("Sans");
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    expectLine(TOTAL_NOT_CALCULABLE, index);
    expect(totalSpoken()).toBe(TOTAL_NOT_CALCULABLE_SPOKEN);

    // Cadence 1 s, Cible toujours à renseigner : données manquantes, « — ».
    fireEvent.press(get(`${CADENCE_CONTROL}-1`));
    expectLine("—", index);
    expect(totalSpoken()).toBe(TOTAL_MISSING_SPOKEN);
    expect(totalSpoken()).not.toMatch(/—/u);

    // Cible 10 répétitions : estimation 3 × (10 × 1 s + 15 s) = 75 s, ≈ devant la valeur.
    // [Roue de la Cible commune — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]
    enterExecutionSheetValue("execution-sheet-target", 10, "integer");
    expectLine(`≈ ${formatPhraseDuration(3 * (10 * 1 + 15))}`, index);
    expect(totalShown()).toBe("≈ 1 min 15 s");
    expect(totalSpoken()).toBe(`Durée de l’exercice, ${sheetText.totalEstimatedSpoken}, 1 min 15 s, ${sheetText.totalReadOnlySpoken}`);

    // Cadence Sans : de nouveau « Non calculable », jamais zéro.
    fireEvent.press(get(`${CADENCE_CONTROL}-NONE`));
    expectLine(TOTAL_NOT_CALCULABLE, index);

    // Le chevron déplie Compte à rebours et Fin juste sous la ligne, sans la déplacer.
    showSignals();
    expect(signals()).toEqual({ countdown: true, end: true, disclosure: true });
    expect(totalIndex()).toBe(index);
    expect(cadenceFrameRows().slice(index, index + 3)).toEqual([
      "execution-sheet-row-total",
      "execution-sheet-row-countdown",
      "execution-sheet-row-end",
    ]);
  });

  it("D-433 — chaque état à l'ouverture : même index dans le cadre Cadence et durée, chevron présent, Compte à rebours et Fin repliés, annonce attendue", () => {
    const repetitions = (cadenceBeepIntervalSeconds: number, target: SeriesTarget = numberTarget(10)) =>
      params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target, pauseSeconds: 15, loadKg: 0, workPhases: [] }, cadenceBeepIntervalSeconds });
    const cases: { name: string; parent: ExecutionParametersInput; shown: string; spoken: string | undefined }[] = [
      { name: "Mode non choisi", parent: params({ mode: null }), shown: "—", spoken: TOTAL_MISSING_SPOKEN },
      {
        name: "Mode non choisi, À l'échec en identiques (« — » prime : Mode non choisi)",
        parent: params({ mode: null, series: { kind: "UNIFORM", count: 3, target: { kind: "FAILURE" }, pauseSeconds: 15, loadKg: 0, workPhases: [] } }),
        shown: "—",
        spoken: TOTAL_MISSING_SPOKEN,
      },
      { name: "Cible à renseigner (identiques)", parent: durationParameters("UNSET", 3, 10), shown: "—", spoken: TOTAL_MISSING_SPOKEN },
      { name: "Cible à renseigner (variables)", parent: params({ series: variableRows([[30, 10], [null, 20]]) }), shown: "—", spoken: TOTAL_MISSING_SPOKEN },
      {
        name: "saisie invalide (3536 s, D-430)",
        parent: durationParameters(3536, 3, 10),
        shown: "—",
        spoken: `Durée de l’exercice, ${sheetText.totalInvalidSpoken}`,
      },
      { name: "tableau variable tout à l'échec (Durée)", parent: variableParameters({ rows: [["FAILURE", 10], ["FAILURE", 20]] }), shown: "—", spoken: TOTAL_MISSING_SPOKEN },
      {
        name: "tableau variable tout à l'échec (Répétitions, Cadence 2 s)",
        parent: variableParameters({ mode: "REPETITIONS", rows: [["FAILURE", 10], ["FAILURE", 20]], cadenceBeepIntervalSeconds: 2 }),
        shown: "—",
        spoken: TOTAL_MISSING_SPOKEN,
      },
      { name: "À l'échec en identiques (Durée)", parent: durationParameters("FAILURE", 3, 10), shown: TOTAL_NOT_CALCULABLE, spoken: TOTAL_NOT_CALCULABLE_SPOKEN },
      {
        name: "À l'échec en identiques (Répétitions, Cadence 2 s)",
        parent: allFailureParameters(3, 15, { cadenceBeepIntervalSeconds: 2 }),
        shown: TOTAL_NOT_CALCULABLE,
        spoken: TOTAL_NOT_CALCULABLE_SPOKEN,
      },
      { name: "Répétitions sans Cadence", parent: repetitions(0), shown: TOTAL_NOT_CALCULABLE, spoken: TOTAL_NOT_CALCULABLE_SPOKEN },
      { name: "Répétitions sans Cadence, Cible à renseigner", parent: repetitions(0, unsetTarget()), shown: TOTAL_NOT_CALCULABLE, spoken: TOTAL_NOT_CALCULABLE_SPOKEN },
      {
        name: "Répétitions avec Cadence 2 s",
        parent: repetitions(2),
        shown: `≈ ${formatPhraseDuration(3 * (10 * 2 + 15))}`,
        spoken: `Durée de l’exercice, ${sheetText.totalEstimatedSpoken}, ${formatPhraseDuration(3 * (10 * 2 + 15))}, ${sheetText.totalReadOnlySpoken}`,
      },
      {
        name: "variables mixtes",
        parent: variableParameters({ rows: [[30, 10], [45, 20], ["FAILURE", 30]] }),
        shown: "≥ 2 min 15 s",
        spoken: `Durée de l’exercice, ${sheetText.totalLowerBoundSpoken}, 2 min 15 s, ${sheetText.totalReadOnlySpoken}`,
      },
      {
        name: "variables chiffrées",
        parent: params({ series: variableRows([[30, 10], [45, 20]]) }),
        shown: formatPhraseDuration(30 + 10 + 45 + 20),
        spoken: `Durée de l’exercice, ${formatPhraseDuration(30 + 10 + 45 + 20)}, ${sheetText.totalReadOnlySpoken}`,
      },
      // Ligne modifiable : l'annonce reste celle de la pastille (ligne non regroupée).
      { name: "Durée identiques chiffrée", parent: params(), shown: "5 min 15 s", spoken: undefined },
    ];
    const indexes = new Set<number>();
    for (const { name, parent, shown, spoken } of cases) {
      const view = renderSheetView(parent);
      expect({ name, present: query("execution-sheet-row-total") !== null }).toEqual({ name, present: true });
      indexes.add(totalIndex());
      expect({ name, previous: cadenceFrameRows()[totalIndex() - 1] }).toEqual({ name, previous: "execution-sheet-row-beep" });
      expect({ name, title: titleText() }).toEqual({ name, title: "Durée de l’exercice" });
      expect({ name, shown: totalShown() }).toEqual({ name, shown });
      expect({ name, spoken: totalSpoken() }).toEqual({ name, spoken });
      if (spoken !== undefined) expect({ name, symbol: /[≈≥—]/u.test(spoken) }).toEqual({ name, symbol: false });
      expect({ name, zero: screen.queryAllByText("0 s", hidden).length }).toEqual({ name, zero: 0 });
      expect({ name, signals: signals() }).toEqual({ name, signals: { countdown: false, end: false, disclosure: true } });
      view.unmount();
    }
    expect(indexes.size).toBe(1);
  });

  it("D-433 — ≥ et ≈ collés avant la valeur dans le même élément texte, jamais dans le titre ni dans un élément distinct", () => {
    let view = renderSheetView(variableParameters({ rows: [[30, 10], [45, 20], ["FAILURE", 30]] }));
    const lowerBoundText = get("execution-sheet-total-text");
    expect(lowerBoundText.props.children).toBe(`${strings.shared.durationNature.lowerBoundPrefix}${formatPhraseDuration(135)}`);
    expect(lowerBoundText.props.children).toBe("≥ 2 min 15 s");
    const row = get("execution-sheet-row-total-line");
    expect(within(row).getAllByText(/≥/u, hidden)).toEqual([lowerBoundText]);
    expect(within(row).queryAllByText(/^Durée de l’exercice.*[≈≥]/u, hidden)).toHaveLength(0);
    view.unmount();
    view = renderSheetView(params({ mode: "REPETITIONS", series: variableRows([[12, 30], [10, 45]]), cadenceBeepIntervalSeconds: 2 }));
    const estimatedText = get("execution-sheet-total-text");
    expect(estimatedText.props.children).toBe(`${strings.shared.durationNature.estimatedPrefix}${formatPhraseDuration(12 * 2 + 30 + 10 * 2 + 45)}`);
    expect(within(get("execution-sheet-row-total-line")).getAllByText(/≈/u, hidden)).toEqual([estimatedText]);
    view.unmount();
    // Clé du titre ≈ supprimée du lexique.
    expect("exerciseDurationEstimated" in sheetText).toBe(false);
  });

  it("D-433 — tableau variable entièrement à l'échec : « — » (données manquantes), jamais « Non calculable » ni zéro ; Répétitions sans Cadence : « Non calculable » (configuration)", () => {
    let view = renderSheetView(variableParameters({ rows: [["FAILURE", 10], ["FAILURE", 20], ["FAILURE", 30]] }));
    expect(totalShown()).toBe("—");
    expect(totalShown()).not.toBe(TOTAL_NOT_CALCULABLE);
    expect(screen.queryAllByText(TOTAL_NOT_CALCULABLE, hidden)).toHaveLength(0);
    expect(totalSpoken()).toBe(TOTAL_MISSING_SPOKEN);
    expect(screen.queryAllByText("0 s", hidden)).toHaveLength(0);
    view.unmount();
    // Contrôle : le même tableau en Répétitions sans Cadence est exclu par la configuration.
    view = renderSheetView(variableParameters({ mode: "REPETITIONS", rows: [["FAILURE", 10], ["FAILURE", 20]] }));
    expect(totalShown()).toBe(TOTAL_NOT_CALCULABLE);
    expect(totalSpoken()).toBe(TOTAL_NOT_CALCULABLE_SPOKEN);
    view.unmount();
  });

  it("D-433 — depuis une Séance (RC-7) : ligne présente dans chaque état, ni chevron, ni Compte à rebours, ni Fin", () => {
    for (const [parent, shown] of [
      [durationParameters(30, 3, 10), formatPhraseDuration(3 * 40)],
      [durationParameters("FAILURE", 3, 10), TOTAL_NOT_CALCULABLE],
      [durationParameters("UNSET", 3, 10), "—"],
      [params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 0, workPhases: [] }, cadenceBeepIntervalSeconds: 2 }), `≈ ${formatPhraseDuration(3 * (10 * 2 + 15))}`],
      [variableParameters({ rows: [[30, 10], [45, 20], ["FAILURE", 30]] }), "≥ 2 min 15 s"],
    ] as const) {
      const view = renderWithSignals({ ...parent, countdownSeconds: 12, endSeconds: 7 }, "absent");
      expect(query("execution-sheet-row-total")).not.toBeNull();
      expect(titleText()).toBe("Durée de l’exercice");
      expect(totalShown()).toBe(shown);
      expect(signals()).toEqual({ countdown: false, end: false, disclosure: false });
      expect(screen.queryByLabelText(sheetText.showExerciseSignals)).toBeNull();
      view.unmount();
    }
  });
});

/**
 * D-434 (décision de Hermann du 19/10 ; QD-434-1 à 4 validées le 19/10) — saisie au clavier
 * numérique des cellules du tableau des séries variables : Cible (MMSS en Durée, entier en
 * Répétitions), Pause (MMSS), Charge (décimal) ; barre « À l'échec | ← Précédent | Suivant →
 * | Fermer » rendue par la Feuille. Le focus natif et le clavier sont simulés : l'absence
 * réelle des poignées iOS, le clavier, la barre et la révélation se jugent sur iPhone
 * (recette `recette-iphone-pre5.md`, section D-434), sans constat inventé.
 */
describe("ExecutionParametersSheet — D-434 (saisie au clavier des cellules)", () => {
  const hidden = { includeHiddenElements: true } as const;
  const get = (testID: string) => screen.getByTestId(testID, hidden);
  const query = (testID: string) => screen.queryByTestId(testID, hidden);
  const styleOf = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};
  const target = (row: number) => `execution-sheet-table-row-${row}-target`;
  const pause = (row: number) => `execution-sheet-table-row-${row}-pause`;
  const load = (row: number) => `execution-sheet-table-row-${row}-load`;
  const focus = (id: string) => fireEvent(get(`${id}-input`), "focus");
  const blur = (id: string) => fireEvent(get(`${id}-input`), "blur");
  const shown = (id: string) => String(get(`${id}-value`).props.children);
  const failureButton = () => query("execution-sheet-keyboard-failure");
  const variable = (rows: [SeriesTarget, number][], mode: "DURATION" | "REPETITIONS" = "DURATION", loadEnabled = false) =>
    params({ mode, loadEnabled, series: { kind: "VARIABLE", rows: rows.map(([rowTarget, pauseSeconds]) => ({ target: rowTarget, pauseSeconds, loadKg: 20 })), workPhases: [] } });

  it("Durée : au repos en unités explicites (5 s, 1 min 5 s, 1 min 30 s, 12 min, 0 s), en saisie « MM:SS » dans la même cellule, sur fond #EAEAFF ; aucun champ supplémentaire", () => {
    renderSheet(variable([[numberTarget(5), 0], [numberTarget(65), 90], [numberTarget(720), 30]]));
    expect([1, 2, 3].map((row) => shown(target(row)))).toEqual(["5 s", "1 min 5 s", "12 min"]);
    expect([1, 2, 3].map((row) => shown(pause(row)))).toEqual(["0 s", "1 min 30 s", "30 s"]);
    const before = screen.UNSAFE_root.findAll((node) => typeof node.type === "string").length;
    focus(target(2));
    expect(shown(target(2))).toBe("01:05");
    expect(styleOf(target(2)).backgroundColor).toBe("#EAEAFF");
    expect(screen.UNSAFE_root.findAll((node) => typeof node.type === "string").length).toBe(before);
    blur(target(2));
    focus(pause(2));
    expect(shown(pause(2))).toBe("01:30");
    blur(pause(2));
    focus(target(1));
    expect(shown(target(1))).toBe("00:05");
  });

  it("frappe : la première remplace, les suivantes composent, quatre chiffres au plus ; à la sortie, 01:75 → 2 min 15 s ; hors bornes ramenée à la borne (3535, 1 s [PRE-9 B.3 : 0 s admis] ; Pause 300)", () => {
    const { onApply } = renderSheet(variable([[numberTarget(65), 10], [numberTarget(45), 20], [numberTarget(30), 30]]));
    focus(target(1));
    typeInExecutionSheetCell(target(1), "175");
    expect(shown(target(1))).toBe("01:75");
    blur(target(1));
    expect(shown(target(1))).toBe("2 min 15 s");
    enterExecutionSheetCell(target(2), "99999");
    expect(shown(target(2))).toBe(formatPhraseDuration(3535));
    // PRE-9 (B.3, COMP §3) : 0 saisi est une Cible 0 (participation volontairement absente).
    enterExecutionSheetCell(target(3), "0");
    expect(shown(target(3))).toBe("0 s");
    enterExecutionSheetCell(pause(1), "1000");
    expect(shown(pause(1))).toBe(formatPhraseDuration(300));
    validate();
    expect(applied(onApply).series).toEqual({
      kind: "VARIABLE",
      rows: [
        { target: numberTarget(135), pauseSeconds: 300, loadKg: 20 },
        { target: numberTarget(3535), pauseSeconds: 20, loadKg: 20 },
        { target: numberTarget(0), pauseSeconds: 30, loadKg: 20 },
      ],
      workPhases: [],
    });
  });

  it("QD-434-4 : cellule vidée par Retour arrière → Pause 0 s ; Cible « — » à renseigner (#FFF1F0), ✓ indisponible", () => {
    renderSheet(variable([[numberTarget(45), 20], [numberTarget(30), 10]]));
    enterExecutionSheetCell(pause(1), CELL_BACKSPACE.repeat(4));
    expect(shown(pause(1))).toBe("0 s");
    enterExecutionSheetCell(target(1), CELL_BACKSPACE.repeat(4));
    expect(shown(target(1))).toBe("—");
    expect(styleOf(target(1)).backgroundColor).toBe("#FFF1F0");
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("barre : « À l'échec » | « ← Précédent » | « Suivant → » | « Fermer », sur une ligne ; « À l'échec » seulement pour une cellule Cible, jamais pour une Pause ni une Charge", () => {
    renderSheet(variable([[numberTarget(45), 20], [numberTarget(30), 10]], "DURATION", true));
    focus(target(1));
    showExecutionSheetKeyboard();
    const bar = get("execution-sheet-keyboard-bar");
    expect(styleOf("execution-sheet-keyboard-bar")).toMatchObject({ flexDirection: "row", minHeight: 52 });
    const order = bar.findAll((node) => typeof node.props.testID === "string" && /^execution-sheet-keyboard-(failure|previous|next|close)$/.test(node.props.testID) && typeof node.type === "string");
    expect([...new Set(order.map((node) => node.props.testID))]).toEqual([
      "execution-sheet-keyboard-failure",
      "execution-sheet-keyboard-previous",
      "execution-sheet-keyboard-next",
      "execution-sheet-keyboard-close",
    ]);
    expect(within(get("execution-sheet-keyboard-failure")).getByText("À l’échec", hidden)).toBeTruthy();
    expect(get("execution-sheet-keyboard-failure").props.accessibilityState).toMatchObject({ selected: false });
    // PRE-7 B.3 (B9, arbitrage A4) : quatre emplacements égaux (base nulle, même part), boutons
    // arrondis sur le blanc des touches ; Fermer bleu KODJO, texte blanc ; fond de barre conservé.
    const slotIDs = [
      "execution-sheet-keyboard-failure",
      "execution-sheet-keyboard-previous",
      "execution-sheet-keyboard-next",
      "execution-sheet-keyboard-close",
    ];
    for (const id of slotIDs) {
      expect(styleOf(id)).toMatchObject({ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 44, minHeight: 36, borderRadius: 8, paddingHorizontal: 2 });
    }
    expect(styleOf("execution-sheet-keyboard-bar")).toMatchObject({ backgroundColor: "#E1E4E8", gap: 6, paddingHorizontal: 8 });
    expect(styleOf("execution-sheet-keyboard-previous").backgroundColor).toBe("#FFFFFF");
    expect(styleOf("execution-sheet-keyboard-close").backgroundColor).toBe("#0508E5");
    expect(StyleSheet.flatten(within(get("execution-sheet-keyboard-close")).getByText("Fermer", hidden).props.style).color).toBe("#FFFFFF");
    expect(StyleSheet.flatten(within(get("execution-sheet-keyboard-next")).getByText(/Suivant|→/u, hidden).props.style).color).toBe("#5C4DFF");
    expect(query("execution-sheet-keyboard-failure-slot")).toBeNull();
    fireEvent.press(get("execution-sheet-keyboard-next"));
    blur(target(1));
    focus(pause(1));
    expect(failureButton()).toBeNull();
    // Pause : emplacement 1 réservé, vide et non accessible ; Précédent et Suivant aux emplacements
    // 2 et 3, de même largeur que Fermer.
    const reserved = get("execution-sheet-keyboard-failure-slot");
    expect(reserved.props.accessible).toBe(false);
    expect(reserved.props.children).toBeUndefined();
    expect(styleOf("execution-sheet-keyboard-failure-slot")).toMatchObject({ flexGrow: 1, flexShrink: 1, flexBasis: 0 });
    const ordered = get("execution-sheet-keyboard-bar").findAll(
      (node) => typeof node.props.testID === "string" && /^execution-sheet-keyboard-(failure-slot|previous|next|close)$/.test(node.props.testID) && typeof node.type === "string",
    );
    expect([...new Set(ordered.map((node) => node.props.testID))]).toEqual([
      "execution-sheet-keyboard-failure-slot",
      "execution-sheet-keyboard-previous",
      "execution-sheet-keyboard-next",
      "execution-sheet-keyboard-close",
    ]);
    const { backgroundColor: _previousBackground, ...previousSlot } = styleOf("execution-sheet-keyboard-previous");
    const { backgroundColor: _closeBackground, ...closeSlot } = styleOf("execution-sheet-keyboard-close");
    expect(previousSlot).toEqual(closeSlot);
    fireEvent.press(get("execution-sheet-keyboard-next"));
    blur(pause(1));
    focus(load(1));
    expect(failureButton()).toBeNull();
    expect(query("execution-sheet-keyboard-failure-slot")).not.toBeNull();
    expect(query("execution-sheet-keyboard-close")).not.toBeNull();
    hideExecutionSheetKeyboard();
  });

  it("« À l'échec » : bascule numérique ↔ échec pour la seule série, valeur préservée ; en saisie « 00:00 » atténué, la frappe suivante remplace ; résultat dérivé suivi", () => {
    const { onApply } = renderSheet(variable([[numberTarget(45), 20], [numberTarget(30), 10]]));
    focus(target(1));
    showExecutionSheetKeyboard();
    fireEvent.press(get("execution-sheet-keyboard-failure"));
    expect(shown(target(1))).toBe("00:00");
    expect(get("execution-sheet-keyboard-failure").props.accessibilityState).toMatchObject({ selected: true });
    expect(get(STOP_CONTROL).props.accessibilityLabel).toBe("Condition d’arrêt, À l’objectif et à l’échec");
    // De nouveau : la valeur numérique revient (« 00:45 »), la frappe suivante remplace.
    fireEvent.press(get("execution-sheet-keyboard-failure"));
    expect(shown(target(1))).toBe("00:45");
    expect(get("execution-sheet-keyboard-failure").props.accessibilityState).toMatchObject({ selected: false });
    fireEvent.press(get("execution-sheet-keyboard-failure"));
    blur(target(1));
    expect(shown(target(1))).toBe("à l’échec");
    expect(shown(target(2))).toBe("30 s");
    // Cellule à l'échec : focus « 00:00 », une frappe la rend numérique à la sortie.
    focus(target(1));
    expect(shown(target(1))).toBe("00:00");
    typeInExecutionSheetCell(target(1), "50");
    expect(get("execution-sheet-keyboard-failure").props.accessibilityState).toMatchObject({ selected: false });
    blur(target(1));
    expect(shown(target(1))).toBe("50 s");
    // Frappe en cours puis « À l'échec » : la cellule passe à l'échec, la valeur frappée est mémorisée.
    focus(target(1));
    typeInExecutionSheetCell(target(1), "40");
    fireEvent.press(get("execution-sheet-keyboard-failure"));
    fireEvent.press(get("execution-sheet-keyboard-failure"));
    expect(shown(target(1))).toBe("00:40");
    blur(target(1));
    hideExecutionSheetKeyboard();
    validate();
    expect(applied(onApply).series).toMatchObject({ kind: "VARIABLE", rows: [{ target: numberTarget(40) }, { target: numberTarget(30) }] });
  });

  it("revue : cellule à l'échec, frappe puis Retour arrière jusqu'à la saisie vide : « À l'échec » de nouveau sélectionné, la cellule reste à l'échec", () => {
    renderSheet(variable([[failureTarget(), 20], [numberTarget(30), 10]]));
    focus(target(1));
    showExecutionSheetKeyboard();
    typeInExecutionSheetCell(target(1), "5");
    expect(get("execution-sheet-keyboard-failure").props.accessibilityState).toMatchObject({ selected: false });
    typeInExecutionSheetCell(target(1), CELL_BACKSPACE);
    expect(get("execution-sheet-keyboard-failure").props.accessibilityState).toMatchObject({ selected: true });
    blur(target(1));
    hideExecutionSheetKeyboard();
    expect(shown(target(1))).toBe("à l’échec");
  });

  it("QD-434-1 : Répétitions — cible entière au clavier (bornes 1..100), « À l'échec » dans la barre ; plus de roue de cellule", () => {
    const { onApply } = renderSheet(variable([[numberTarget(12), 20], [numberTarget(10), 10]], "REPETITIONS"));
    focus(target(1));
    expect(get(`${target(1)}-input`).props.keyboardType).toBe("number-pad");
    expect(shown(target(1))).toBe("12");
    expect(query("number-wheel-column")).toBeNull();
    typeInExecutionSheetCell(target(1), "150");
    blur(target(1));
    expect(shown(target(1))).toBe("100 rép.");
    focus(target(2));
    showExecutionSheetKeyboard();
    fireEvent.press(get("execution-sheet-keyboard-failure"));
    expect(shown(target(2))).toBe("0");
    blur(target(2));
    hideExecutionSheetKeyboard();
    expect(shown(target(2))).toBe("à l’échec");
    validate();
    expect(applied(onApply).series).toMatchObject({ kind: "VARIABLE", rows: [{ target: numberTarget(100) }, { target: failureTarget() }] });
  });

  it("tableau entièrement « À l'échec » : la Durée de l'exercice reste « — » (comportement actuel)", () => {
    renderSheet(variable([[numberTarget(45), 20], [numberTarget(30), 10]]));
    chooseCellTarget(1, "FAILURE");
    chooseCellTarget(2, "FAILURE");
    expect([1, 2].map((row) => shown(target(row)))).toEqual(["à l’échec", "à l’échec"]);
    expect(totalShown()).toBe("—");
  });

  it("libellés Précédent / Suivant si la largeur le permet, sinon flèches seules avec leurs libellés d'accessibilité ; zones tactiles préservées ; PRE7-B.3 (B9) : le plus large libellé doit tenir dans un emplacement", () => {
    // PRE-7 B.3 (B9, arbitrage A4) : emplacement = (barre − 2 × 8 − 3 × 6) / 4 ; libellé + 2 × 2.
    expect(keyboardBarSlotWidth(390)).toBe(89);
    expect([360, 402, 440].map(keyboardBarSlotWidth)).toEqual([81.5, 92, 101.5]);
    expect(keyboardBarCompact(0, 60)).toBe(false);
    expect(keyboardBarCompact(390, 0)).toBe(false);
    expect(keyboardBarCompact(390, 85)).toBe(false);
    expect(keyboardBarCompact(390, 86)).toBe(true);
    renderSheet(variable([[numberTarget(45), 20], [numberTarget(30), 10]]));
    focus(target(1));
    showExecutionSheetKeyboard();
    const labels = strings.executionParameters.sheet.keyboardBar;
    expect(within(get("execution-sheet-keyboard-previous")).getByText(labels.previous, hidden)).toBeTruthy();
    const measure = (key: "previous" | "next", width: number) =>
      fireEvent(get(`execution-sheet-keyboard-bar-measure-${key}`), "layout", { nativeEvent: { layout: { x: 0, y: 0, width, height: 20 } } });
    // Barre de 402 (emplacement 92). Garde : tant qu'une mesure manque, rien n'est réduit, même
    // si la seule mesure connue (100) ne tiendrait pas.
    fireEvent(get("execution-sheet-keyboard-bar"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 402, height: 44 } } });
    measure("previous", 100);
    expect(within(get("execution-sheet-keyboard-previous")).getByText(labels.previous, hidden)).toBeTruthy();
    expect(within(get("execution-sheet-keyboard-next")).getByText(labels.next, hidden)).toBeTruthy();
    // Les deux mesures connues : le plus large (100 + 2 × 2 > 92) ne tient pas — flèches seules.
    measure("next", 60);
    expect(within(get("execution-sheet-keyboard-previous")).getByText("←", hidden)).toBeTruthy();
    expect(within(get("execution-sheet-keyboard-next")).getByText("→", hidden)).toBeTruthy();
    // « ← Précédent » de 85,4 tient à 402 (85,4 + 4 ≤ 92) : libellés complets.
    measure("previous", 85.4);
    expect(within(get("execution-sheet-keyboard-previous")).getByText(labels.previous, hidden)).toBeTruthy();
    expect(within(get("execution-sheet-keyboard-next")).getByText(labels.next, hidden)).toBeTruthy();
    // Barre de 360 (emplacement 81,5) : le plus large (85,4) ne tient plus — flèches seules, pour les deux.
    fireEvent(get("execution-sheet-keyboard-bar"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 44 } } });
    expect(within(get("execution-sheet-keyboard-previous")).getByText("←", hidden)).toBeTruthy();
    expect(within(get("execution-sheet-keyboard-next")).getByText("→", hidden)).toBeTruthy();
    expect(get("execution-sheet-keyboard-previous").props.accessibilityLabel).toBe("Précédent");
    expect(get("execution-sheet-keyboard-next").props.accessibilityLabel).toBe("Suivant");
    expect(within(get("execution-sheet-keyboard-failure")).getByText("À l’échec", hidden)).toBeTruthy();
    // Zone tactile de 52 de haut (recette du 29/10/2026) : bouton de 36 au moins, débord de 8 en haut et en bas.
    expect(styleOf("execution-sheet-keyboard-previous")).toMatchObject({ minHeight: 36 });
    expect(get("execution-sheet-keyboard-previous").props.hitSlop).toMatchObject({ top: 8, bottom: 8 });
    blur(target(1));
    hideExecutionSheetKeyboard();
  });

  it("Charge d'une cellule et charge commune (recette du 20/10, RC-14) : plus de sélection au focus (RC-3 remplacée), la première frappe remplace", () => {
    const prototype = TextInput.prototype as unknown as { setSelection?: (start: number, end: number) => void };
    const original = prototype.setSelection;
    const setSelection = jest.fn<(start: number, end: number) => void>();
    prototype.setSelection = setSelection;
    try {
      const view = renderSheetView(variable([[numberTarget(45), 20], [numberTarget(30), 10]], "DURATION", true));
      focus(load(1));
      expect(get(`${load(1)}-input`).props.selectTextOnFocus).toBe(false);
      typeInExecutionSheetCell(load(1), "25");
      blur(load(1));
      expect(shown(load(1))).toBe("25 kg");
      expect(setSelection).not.toHaveBeenCalled();
      view.unmount();
      renderSheet(params({ loadEnabled: true, series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 10, loadKg: 20, workPhases: [] } }));
      focus("execution-sheet-load-input");
      expect(get("execution-sheet-load-input-input").props.selectTextOnFocus).toBe(false);
      typeInExecutionSheetCell("execution-sheet-load-input", "7");
      expect(shown("execution-sheet-load-input")).toBe("7");
      blur("execution-sheet-load-input");
      expect(shown("execution-sheet-load-input")).toBe("7 kg");
      expect(setSelection).not.toHaveBeenCalled();
    } finally {
      prototype.setSelection = original;
    }
  });
});

/**
 * PRE-7 story B.2 (D-447, CE-UI-10) — B8 : valeur personnalisée de la Cadence affichée à la
 * place de « Autre » (arbitrage A2) ; B10 : colonne Charge des séries variables toujours
 * présente, tiret gris non éditable sous Sans (arbitrage A3).
 */
describe("ExecutionParametersSheet — PRE-7 story B.2", () => {
  const hidden = { includeHiddenElements: true } as const;
  const get = (testID: string) => screen.getByTestId(testID, hidden);
  const query = (testID: string) => screen.queryByTestId(testID, hidden);
  const OTHER = `${CADENCE_CONTROL}-OTHER`;
  const otherLabel = () => ({
    // Libellé de l'option Autre, rendu à côté de sa zone de sélection : première option, ou dernière quand elle est
    // sélectionnée (contrôle segmenté du 04/11/2026, option choisie à droite).
    text: (() => {
      const texts = within(get(CADENCE_CONTROL)).queryAllByText(/./u, hidden);
      const at = get(OTHER).props.accessibilityState?.selected === true ? texts.length - 1 : 0;
      return texts.slice(at, at + 1).map((node) => String(node.props.children));
    })(),
    spoken: get(OTHER).props.accessibilityLabel as string,
  });

  it("PRE7-B.2 (B8) — Cadence 3 s : l'option Autre affiche « 3 s », annoncée « Autre, 3 s » ; 1 et 0 : « Autre »", () => {
    const expected: readonly [number, string, string][] = [
      [3, "3 s", "Autre, 3 s"],
      [10, "10 s", "Autre, 10 s"],
      [1, "Autre", "Autre"],
      [0, "Autre", "Autre"],
    ];
    for (const [value, text, spoken] of expected) {
      const view = renderSheetView(params({ cadenceBeepIntervalSeconds: value }));
      expect({ value, ...otherLabel() }).toEqual({ value, text: [text], spoken });
      view.unmount();
    }
  });

  // [± ouvert à 3 s, suivi en direct — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : la valeur saisie s'affiche dans l'option à la sortie du champ.]
  it("PRE7-B.2 (B8) — appui sur « 3 s » : la saisie s'ouvre sur « 00:03 » ; valeur saisie affichée dans l'option ; 1 s pendant la saisie : l'option redevient « Autre »", () => {
    const { onApply } = renderSheet(params({ cadenceBeepIntervalSeconds: 3 }));
    fireEvent.press(get(OTHER));
    fireEvent(get("execution-sheet-beep-input"), "focus");
    expect(valueOf("execution-sheet-beep")).toBe("00:03");
    expect(cadenceText()).toBe("Autre");
    closeExecutionSheetField("execution-sheet-beep");
    tap("execution-sheet-beep-increment");
    expect(otherLabel()).toEqual({ text: ["4 s"], spoken: "Autre, 4 s" });
    // Saisie rouverte : la valeur du Brouillon est conservée.
    openExecutionSheetField("execution-sheet-beep");
    expect(valueOf("execution-sheet-beep")).toBe("00:04");
    // 1 s saisi : « Autre » (borne basse du classement Autre).
    typeInExecutionSheetCell("execution-sheet-beep", "1");
    closeExecutionSheetField("execution-sheet-beep");
    expect(otherLabel().text).toEqual(["Autre"]);
    fireEvent.press(get(`${CADENCE_CONTROL}-1`));
    expect(cadenceText()).toBe("1 s");
    expect(otherLabel().text).toEqual(["Autre"]);
    fireEvent.press(get(`${CADENCE_CONTROL}-NONE`));
    expect(otherLabel().text).toEqual(["Autre"]);
    // Sans puis Autre (ch13 l.1209, D-420) : la saisie s'ouvre à « 00:00 », l'option reste « Autre » (4 s oublié).
    fireEvent.press(get(OTHER));
    fireEvent(get("execution-sheet-beep-input"), "focus");
    expect(valueOf("execution-sheet-beep")).toBe("00:00");
    expect(otherLabel()).toEqual({ text: ["Autre"], spoken: "Autre" });
    closeExecutionSheetField("execution-sheet-beep");
    validate();
    expect(applied(onApply).cadenceBeepIntervalSeconds).toBe(0);
  });

  describe("B10 — colonne Charge des séries variables", () => {
    const cell = (row: number) => `execution-sheet-table-row-${row}-load`;
    const target = (row: number) => `execution-sheet-table-row-${row}-target`;
    const pause = (row: number) => `execution-sheet-table-row-${row}-pause`;
    const input = (testID: string) => `${testID}-input`;
    const focus = (testID: string) => fireEvent(get(input(testID)), "focus");
    const blur = (testID: string) => fireEvent(get(input(testID)), "blur");
    const activeCell = (id: string) => StyleSheet.flatten(get(id).props.style)?.backgroundColor === "#EAEAFF";
    const variableLoads = (loads: number[], enabled: boolean) =>
      params({
        series: { kind: "VARIABLE", rows: loads.map((loadKg, index) => ({ target: numberTarget(30 + index), pauseSeconds: 10, loadKg })), workPhases: [] },
        loadEnabled: enabled,
      });
    let keyboard: ReturnType<typeof captureKeyboard>;
    beforeEach(() => {
      keyboard = captureKeyboard();
    });
    afterEach(() => keyboard.restore());

    it("Sans, charges [10, 0, 15] : en-tête « Charge » et trois tirets gris centrés, non éditables, annoncés « Série n, charge, Sans »", () => {
      renderSheet(variableLoads([10, 0, 15], false));
      expect(get("execution-sheet-table-header-load")).toHaveTextContent("Charge");
      for (const row of [1, 2, 3]) {
        expect(StyleSheet.flatten(get(`${cell(row)}-cell`).props.style)).toMatchObject({ width: 71, flexShrink: 1 });
        const dash = get(`${cell(row)}-unset`);
        expect(dash.props).toMatchObject({ accessibilityRole: "text", accessibilityLabel: `Série ${row}, charge, Sans` });
        expect(StyleSheet.flatten(dash.props.style)).toMatchObject({ alignItems: "center", justifyContent: "center" });
        const text = within(dash).getByText("—", hidden);
        expect(StyleSheet.flatten(text.props.style).color).toBe(colors.disabled);
        expect(query(cell(row))).toBeNull();
        expect(query(input(cell(row)))).toBeNull();
      }
    });

    it("Sans : Précédent / Suivant ne passent jamais par une cellule Charge", () => {
      renderSheet(variableLoads([10, 0, 15], false));
      focus(pause(1));
      keyboard.show();
      fireEvent.press(get("execution-sheet-keyboard-next"));
      expect(activeCell(target(2))).toBe(true);
      blur(pause(1));
      focus(target(2));
      fireEvent.press(get("execution-sheet-keyboard-previous"));
      expect(activeCell(pause(1))).toBe(true);
    });

    it("Sans → Avec : en-tête et emplacements de la colonne restent montés ; les champs y apparaissent avec les valeurs conservées", () => {
      renderSheet(variableLoads([10, 0, 15], false));
      const header = get("execution-sheet-table-header-load");
      const slots = [1, 2, 3].map((row) => get(`${cell(row)}-cell`));
      fireEvent.press(get("execution-sheet-load-control-WITH"));
      expect(get("execution-sheet-table-header-load")).toBe(header);
      expect([1, 2, 3].map((row) => get(`${cell(row)}-cell`))).toEqual(slots);
      expect([1, 2, 3].map((row) => query(`${cell(row)}-unset`))).toEqual([null, null, null]);
      expect([1, 2, 3].map((row) => String(get(`${cell(row)}-value`).props.children))).toEqual(["10 kg", "0 kg", "15 kg"]);
    });
  });
});

/**
 * PRE-9 — ordre de Hermann du 01/11/2026, points 3 à 5 (CE-UI-10 §2b, §5, §7, §8 ; D-413, D-431) :
 * bloc « Phases du mouvement » entre Exécution et Séries ; « Objectif de durée » en séries
 * identiques, mode Durée ; notations « DD… → GG… » / « DG → DG → … » dans Avec et le déroulant,
 * taille standard, largeur adaptée au contenu ; ligne « De chaque côté » ; règles N = 1 inchangées.
 */
describe("ExecutionParametersSheet — PRE-9, ordre de Hermann du 01/11/2026 (points 3 à 5)", () => {
  const hidden = { includeHiddenElements: true } as const;
  const get = (testID: string) => screen.getByTestId(testID, hidden);
  const query = (testID: string) => screen.queryByTestId(testID, hidden);
  const flat = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};
  const SIDE = "execution-sheet-side-control";
  const MENU = "execution-sheet-side-order-menu";
  const bilateral = (overrides: Partial<ExecutionParametersInput> = {}) =>
    params({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE", sideRecoverySeconds: 10, ...overrides });

  it("point 3 — blocs Exécution → Phases du mouvement → Séries → Côtés → Cadence et durée (Récupération à venir) ; Séries commence par la ligne Séries", () => {
    renderSheet(params());
    const frames = get("execution-sheet-panel-host")
      .children.filter((child): child is ReturnType<typeof screen.getByTestId> => typeof child !== "string")
      .map((child) => String(child.props.testID))
      .filter((id) => id.startsWith("execution-sheet-frame-"));
    expect(frames).toEqual([
      "execution-sheet-frame-execution",
      "execution-sheet-frame-phases",
      "execution-sheet-frame-series",
      "execution-sheet-frame-sides",
      "execution-sheet-frame-cadence",
    ]);
    expect(within(get("execution-sheet-frame-phases")).getByText("Phases du mouvement", hidden)).toBeTruthy();
    expect(screen.queryByText("Phases de l’exercice", hidden)).toBeNull();
    expect(within(get("execution-sheet-frame-series")).queryByTestId("execution-sheet-row-phases", hidden)).toBeNull();
    expect(flat("execution-sheet-frame-phases").marginTop).toBe(8);
    expect(flat("execution-sheet-frame-series").marginTop).toBe(8);
  });

  it("point 4 — identiques + Durée : « Objectif de durée » (titre et nom accessible) ; Répétitions : « Nombre de répétitions » ; « Durée de l’exercice » et en-têtes du tableau variable inchangés", () => {
    const view = renderSheetView(params());
    expect(within(get("execution-sheet-row-target")).getByText("Objectif de durée", hidden)).toBeTruthy();
    // Décision du 06/11/2026 : champ clavier nommé, valeur annoncée à part.
    expect(get("execution-sheet-target").props.accessibilityLabel).toBe("Objectif de durée");
    expect(get("execution-sheet-target").props.accessibilityValue).toEqual({ text: "1 min 30 s" });
    expect(screen.queryByText("Durée d’une série", hidden)).toBeNull();
    expect(screen.getByText("Durée de l’exercice", hidden)).toBeTruthy();
    view.unmount();

    const repetitions = renderSheetView(params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: numberTarget(12), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
    expect(within(get("execution-sheet-row-target")).getByText("Nombre de répétitions", hidden)).toBeTruthy();
    expect(screen.queryByText("Objectif de durée", hidden)).toBeNull();
    repetitions.unmount();

    renderSheet(params({ series: variableRows([[30, 10], [45, 20]]) }));
    expect(query("execution-sheet-row-target")).toBeNull();
    expect(screen.queryByText("Objectif de durée", hidden)).toBeNull();
    const header = get("execution-sheet-table-header");
    expect(within(header).getByText("Durée", hidden)).toBeTruthy();
    expect(within(header).getByText("Pause", hidden)).toBeTruthy();
    expect(within(header).getByText("Charge", hidden)).toBeTruthy();
  });

  it("point 5 — « De chaque côté » sur une ligne ; Avec et déroulant : « DD… → GG… » par défaut (104), « DG → DG → … », taille 12 sans réduction ; libellés accessibles ; aucune Droite / Gauche", () => {
    const { onApply } = renderSheet(bilateral());
    const row = get("execution-sheet-row-side-line");
    expect(within(row).getByText("De chaque côté", hidden)).toBeTruthy();
    expect(StyleSheet.flatten(within(row).getByText("De chaque côté", hidden).props.style).maxWidth).toBeUndefined();
    expect(get(SIDE).props.accessibilityLabel).toBe("De chaque côté");
    // Défaut BY_SIDE : notation dans l'option Avec, largeur adaptée au contenu (104, Figma `9462:18978`).
    expect(get(`${MENU}-notation`).props.children).toBe("DD… → GG…");
    expect(flat(`${MENU}-notation`)).toMatchObject({ fontSize: 12, fontWeight: "600" });
    expect(flat(`${SIDE}-tile-WITH`).width).toBe(104);
    expect(flat(MENU)).toMatchObject({ width: 104, height: 26 });
    expect(get(`${SIDE}-WITH`).props.accessibilityLabel).toBe("Avec, Chaque série d’un côté, puis chaque série de l’autre");
    expect(get(MENU).props.accessibilityValue).toEqual({ text: "Chaque série d’un côté, puis chaque série de l’autre" });
    // Déroulant : mêmes notations, même taille, libellés accessibles.
    fireEvent.press(get(MENU));
    const items = within(get("execution-sheet-side-order-panel")).getAllByRole("menuitem");
    expect(items.map((item) => item.props.accessibilityLabel)).toEqual([
      "Chaque série d’un côté, puis chaque série de l’autre",
      "Les deux côtés à chaque série",
    ]);
    expect(["BY_SIDE", "BY_SERIES"].map((order) => get(`${MENU}-${order}-notation`).props.children)).toEqual(["DD… → GG…", "DG → DG → …"]);
    expect(["BY_SIDE", "BY_SERIES"].map((order) => flat(`${MENU}-${order}-notation`).fontSize)).toEqual([12, 12]);
    expect(flat(`${MENU}-menu`).width).toBe(104);
    fireEvent.press(get(`${MENU}-BY_SERIES`));
    expect(get(`${MENU}-notation`).props.children).toBe("DG → DG → …");
    expect(get(`${SIDE}-WITH`).props.accessibilityLabel).toBe("Avec, Les deux côtés à chaque série");
    // Le contenu plus long élargit l'option ; la place réservée de la ligne ne change pas.
    expect(flat(`${SIDE}-tile-WITH`).width).toBe(116);
    expect(flat("execution-sheet-side-control-slot").minWidth).toBe(186);
    expect(screen.queryByText(/Droite|Gauche/u, hidden)).toBeNull();
    validate();
    expect(applied(onApply)).toMatchObject({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES" });
  });

  it("point 5 — N = 1 : règles inchangées (D-415) — pas de notation ni de déroulant, Avec / Sans disponible, BY_SIDE écrit", () => {
    const { onApply } = renderSheet(
      bilateral({ sideOrder: "BY_SERIES", series: { kind: "UNIFORM", count: 1, target: numberTarget(90), pauseSeconds: 15, loadKg: 0, workPhases: [] } }),
    );
    expect(query(MENU)).toBeNull();
    expect(get(`${SIDE}-WITH`).props.accessibilityLabel).toBe("Avec");
    expect(flat(`${SIDE}-tile-WITH`).width).toBe(62);
    expect(screen.queryByText(/DD…|DG →/u, hidden)).toBeNull();
    chooseExecutionSide("Sans");
    chooseExecutionSide("Avec");
    expect(get(`${SIDE}-WITH`).props.accessibilityLabel).toBe("Avec");
    validate();
    expect(applied(onApply)).toMatchObject({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE" });
  });
});

/**
 * Recette iPhone du 01/11/2026 (m11-objectif, classe B, Hermann : « Ok. La transition entre les deux
 * textes doit se faire en apparition/disparition en fondu ») — Jest ne joue aucune animation : la ligne
 * reste montée, son titre change de texte avec une entrée et une sortie en fondu de 350 ms ; aucune
 * sous « Réduire les animations ».
 */
describe("ExecutionParametersSheet — recette du 01/11 (m11-objectif) : titre de la cible en fondu croisé", () => {
  const hidden = { includeHiddenElements: true } as const;
  const label = () => screen.getByTestId("execution-sheet-row-target-label", hidden);

  it("Durée ↔ Répétitions : une seule ligne de cible ; « Objectif de durée » ↔ « Nombre de répétitions » en fondu (entrée et sortie, 350 ms) ; premier titre sans fondu", () => {
    renderSheet(params());
    expect(screen.getAllByTestId("execution-sheet-row-target", hidden)).toHaveLength(1);
    expect(label().props.children).toBe("Objectif de durée");
    // Titre présent à l'ouverture : aucune apparition.
    expect(label().props.entering).toBeUndefined();
    expect(label().props.exiting).toBeTruthy();
    expect(ROW_LABEL_CROSSFADE_MS).toBe(350);

    chooseMode("Répétitions");
    expect(screen.getAllByTestId("execution-sheet-row-target", hidden)).toHaveLength(1);
    expect(label().props.children).toBe("Nombre de répétitions");
    expect(label().props.entering).toBeTruthy();
    expect(label().props.exiting).toBeTruthy();
    // La pastille suit le mode (cible commune en répétitions).
    expect(String(screen.getByTestId("execution-sheet-target", hidden).props.accessibilityLabel)).toBe("Nombre de répétitions");

    chooseMode("Durée");
    expect(label().props.children).toBe("Objectif de durée");
    expect(label().props.entering).toBeTruthy();
    expect(String(screen.getByTestId("execution-sheet-target", hidden).props.accessibilityLabel)).toBe("Objectif de durée");
  });

  it("« Réduire les animations » : changement immédiat, sans fondu", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValueOnce(true);
    renderSheet(params());
    await act(async () => {
      await Promise.resolve();
    });
    chooseMode("Répétitions");
    expect(label().props.children).toBe("Nombre de répétitions");
    expect(label().props.entering).toBeUndefined();
    expect(label().props.exiting).toBeUndefined();
  });
});
