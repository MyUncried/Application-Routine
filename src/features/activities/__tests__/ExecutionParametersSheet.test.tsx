import { Popover, RNHostView } from "@expo/ui/swift-ui";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { AccessibilityInfo, Modal, Platform, StyleSheet, Switch, TextInput } from "react-native";

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
  SHEET_MOTION_MS,
} from "@/features/activities/SheetMotion";
import {
  chooseExecutionMode,
  chooseExecutionRegime,
  openExecutionSheetField,
  pressInExecutionSheet,
  tapExecutionSheetStep,
} from "@/features/activities/testing/executionSheetActions";
import {
  dragDestination as sharedDragDestination,
  TABLE_ROW_HEIGHT as SHARED_TABLE_ROW_HEIGHT,
  tableRowIdentity as sharedTableRowIdentity,
} from "@/features/activities/sheetTable";
import { strings } from "@/shared/i18n";
import { InlineStepper } from "@/shared/ui/ProfileStepper";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-3 (CE-UI-10) — rendu et actions de la feuille Paramètres. Les montants
 * et transitions sont calculés par le Domaine (`executionCalculations`,
 * `ExecutionParametersDraft`) et prouvés dans leurs suites ; ici, on vérifie
 * que la surface les affiche, les délègue et n'écrit rien (aucun service).
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

function params(overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 3,
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

function renderSheet(parent: ExecutionParametersInput, profileSideRecovery = 10, baseline: ExecutionParametersInput | null = null) {
  const { onApply, onCancel } = renderSheetView(parent, profileSideRecovery, baseline);
  return { onApply, onCancel };
}

/** Story 3.3 : appui bref sur un ± ; le champ hors tableau est ouvert au besoin (± à l’appui). */
const tap = tapExecutionSheetStep;
/** Story 3.3 : choix du Régime par le champ de la ligne « Séries » (l’interrupteur est retiré). */
const chooseRegime = chooseExecutionRegime;

const valueOf = (testID: string) => screen.getByTestId(`${testID}-value`).props.children as string;
const text = (testID: string) => String(screen.getByTestId(`${testID}-text`).props.children);
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
/** Mode affiché : « Durée », « Répétitions », ou « — » si aucun segment n'est sélectionné. */
function modeText(): string {
  const mode = selectedValue(MODE_CONTROL, ["REPETITIONS", "DURATION"]) as "REPETITIONS" | "DURATION" | null;
  return mode === null ? "—" : strings.executionParameters.sheet.modes[mode];
}
/** Type de série affiché (« Variables » / « Identiques »), lecture seule (N = 1) comprise. */
function seriesTypeText(): string {
  const control = screen.getByTestId(SERIES_TYPE, anyNode);
  if (control.props.accessibilityRole === "text") return String(control.props.accessibilityLabel).split(", ")[1]!;
  const value = selectedValue(SERIES_TYPE, ["VARIABLE", "UNIFORM"]) as "VARIABLE" | "UNIFORM" | null;
  return value === null ? "—" : strings.executionParameters.sheet.seriesTypes[value];
}
/**
 * Gestes sur la roulette de la Durée totale, portés par son conteneur
 * (`execution-sheet-total-wheel`) : en ligne sur Android et web, dans le panneau sans
 * flèche sur iOS (Q41).
 */
const totalWheel = () => within(screen.getByTestId("execution-sheet-total-wheel"));
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
 * PRE-5 story 2.6 (AD-27, FR-29) — les cellules n'ont plus de ± permanents : la Cible d'une
 * ligne se règle par la roue que sa cellule ouvre (Durée : minutes et secondes ; Répétitions :
 * colonne unique ; « FAILURE » : option en tête). La ligne et sa cellule sont d'abord
 * mesurées (le panneau iOS attend ces mesures).
 */
function chooseCellTarget(row: number, value: number | "FAILURE") {
  const anyNode = { includeHiddenElements: true } as const;
  fireEvent(screen.getByTestId(`execution-sheet-table-row-${row}-motion`, anyNode), "layout", {
    nativeEvent: { layout: { x: -4, y: 32 + 36 * (row - 1), width: 336, height: 36 } },
  });
  fireEvent(screen.getByTestId(`execution-sheet-table-row-${row}-target-cell`, anyNode), "layout", {
    nativeEvent: { layout: { x: 58, y: 6, width: 71, height: 24 } },
  });
  fireEvent.press(screen.getByTestId(`execution-sheet-table-row-${row}-target`, anyNode));
  if (screen.queryByTestId("duration-wheel-validate")) {
    if (value === "FAILURE") fireEvent.press(screen.getByTestId("duration-wheel-failure-option"));
    else {
      fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: Math.floor(value / 60) } });
      fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: value % 60 } });
    }
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
  } else {
    fireEvent(screen.getByTestId("number-wheel-column"), "selectionChange", { nativeEvent: { selection: value === "FAILURE" ? "failure" : value } });
    fireEvent.press(screen.getByTestId("number-wheel-validate"));
  }
}

afterEach(() => {
  jest.useRealTimers();
});

/** Q41 : mise en page simulée d'un élément (position verticale et hauteur, dans son parent). */
const layoutOf = (testID: string, y: number, height: number) =>
  fireEvent(screen.getByTestId(testID), "layout", { nativeEvent: { layout: { x: 0, y, width: 330, height } } });
/** PRE-5 story 2.4 (AD-28) : mise en page simulée des cadres ([y, hauteur] dans le contenu défilant). */
const layoutFrames = (frames: Partial<Record<"execution" | "series" | "sides" | "cadence", readonly [number, number]>>) => {
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
    expect(valueOf("execution-sheet-series")).toBe("1 série");
    // PRE-5 story 2.4 (P16) : à N = 1, le Type de série est une information non modifiable.
    expect(screen.getByTestId(SERIES_TYPE).props.accessibilityRole).toBe("text");
    expect(screen.queryByTestId(`${SERIES_TYPE}-VARIABLE`)).toBeNull();
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    // Q38 (Hermann, 2026-10-17) : la ligne « Ordre des côtés » n'est plus atténuée ni
    // désactivée à N = 1 ; elle est masquée. La Pause au changement de côté reste.
    expect(screen.queryByTestId("execution-sheet-row-order")).toBeNull();
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
    const chooseOrder = (label: string) => {
      fireEvent.press(screen.getByTestId("execution-sheet-order-value"));
      fireEvent.press(within(screen.getByTestId("execution-sheet-order-control")).getByText(label));
    };

    it("PRE4-Q38 (a) — N = 1 bilatéral : aucune ligne Ordre des côtés ; la Pause au changement de côté reste", () => {
      renderSheet(bilateral({ series: { kind: "UNIFORM", count: 1, target: numberTarget(90), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
      expect(screen.getByTestId("execution-sheet-row-side")).toBeTruthy();
      expect(screen.queryByTestId("execution-sheet-row-order")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-order-value")).toBeNull();
      expect(screen.queryByText("Ordre des côtés")).toBeNull();
      expect(screen.getByTestId("execution-sheet-row-side-recovery")).toBeTruthy();
    });

    it("PRE4-Q38 (b) — N = 2 : la ligne est présente et active", () => {
      renderSheet(bilateral({ series: { kind: "UNIFORM", count: 2, target: numberTarget(90), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
      expect(screen.getByTestId("execution-sheet-row-order")).toBeTruthy();
      const pill = screen.getByTestId("execution-sheet-order-value");
      expect(pill.props.accessibilityState?.disabled ?? false).toBe(false);
      expect(pill.props.accessibilityLabel).toBe("Ordre des côtés, Un côté après l’autre");
      chooseOrder("Les deux côtés à chaque série");
      expect(text("execution-sheet-order-value")).toBe("Les deux côtés à chaque série");
    });

    it("PRE4-Q38 (c) — Ordre choisi à N = 3, N → 1 (masqué, effectif normalisé), N → 2 : réaffiché, ✓ BY_SERIES", () => {
      const { onApply } = renderSheet(bilateral());
      chooseOrder("Les deux côtés à chaque série");
      tap("execution-sheet-series-decrement");
      tap("execution-sheet-series-decrement");
      expect(valueOf("execution-sheet-series")).toBe("1 série");
      expect(screen.queryByTestId("execution-sheet-row-order")).toBeNull();
      // Effectif normalisé « Un côté après l’autre » à N = 1 : prouvé par ✓ en (c bis).
      tap("execution-sheet-series-increment");
      expect(valueOf("execution-sheet-series")).toBe("2 séries");
      expect(screen.getByTestId("execution-sheet-row-order")).toBeTruthy();
      expect(text("execution-sheet-order-value")).toBe("Les deux côtés à chaque série");
      expect(screen.queryByTestId("execution-sheet-order-control")).toBeNull();
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

    // Q41 (2026-10-17) : sur iOS, l'Ordre s'ouvre dans un panneau modal ; un toucher hors
    // du panneau le ferme sans rien appliquer, N ne peut donc pas changer panneau ouvert.
    // L'enchaînement (sélecteur ouvert, puis N → 1) est vérifié en ligne, sur Android.
    // Story 3.3 (AD-15, T10) : sélecteur ouvert, toucher la valeur de N le ferme sans
    // ouvrir le champ ; N passe ensuite à 1 par son champ ±. La fermeture défensive d'un
    // sélecteur d'Ordre à N = 1 (« prune ») est prouvée par le réducteur (PRE4-3.3/AC5).
    it("PRE4-Q38 (c ter) — sélecteur d'Ordre ouvert : toucher N le ferme sans ouvrir le champ (T10) ; N → 1 masque la ligne, N → 2 la réaffiche sans rouvrir le sélecteur", () =>
      withPlatform("android", () => {
      renderSheet(bilateral({ series: { kind: "UNIFORM", count: 2, target: numberTarget(90), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
      fireEvent.press(screen.getByTestId("execution-sheet-order-value"));
      expect(screen.getByTestId("execution-sheet-order-control")).toBeTruthy();
      fireEvent.press(screen.getByTestId("execution-sheet-series-toggle"));
      expect(screen.queryByTestId("execution-sheet-order-control")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-series-decrement")).toBeNull();
      tap("execution-sheet-series-decrement");
      expect(screen.queryByTestId("execution-sheet-order-control")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-row-order")).toBeNull();
      tap("execution-sheet-series-increment");
      expect(screen.getByTestId("execution-sheet-row-order")).toBeTruthy();
      expect(screen.queryByTestId("execution-sheet-order-control")).toBeNull();
    }));

    it("PRE4-Q38 (d) — Séries variables : N 3 → 1 → 2, l'Ordre choisi revient avec les lignes", () => {
      const { onApply } = renderSheet(
        bilateral({ series: variableRows([[90, 15], [45, 20], [60, 30]]), sideOrder: "BY_SERIES" }),
      );
      expect(text("execution-sheet-order-value")).toBe("Les deux côtés à chaque série");
      tap("execution-sheet-series-decrement");
      tap("execution-sheet-series-decrement");
      expect(screen.queryByTestId("execution-sheet-row-order")).toBeNull();
      tap("execution-sheet-series-increment");
      expect(text("execution-sheet-order-value")).toBe("Les deux côtés à chaque série");
      validate();
      expect(applied(onApply)).toMatchObject({ series: variableRows([[90, 15], [45, 20]]), sideOrder: "BY_SERIES" });
    });
  });

  it("P3-09/directions — droite→gauche ou gauche→droite : totaux identiques ; PC une fois par côté, N fois par série", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] }, sideMode: "RIGHT_LEFT", sideRecoverySeconds: 15 }));
    // Un côté après l'autre : 2 × 3 × (30 + 10) + 15 = 255 s.
    expect(text("execution-sheet-total")).toBe("4 min 15 s");
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    fireEvent.press(within(screen.getByTestId("execution-sheet-side-control")).getByText("Gauche puis droite"));
    expect(text("execution-sheet-total")).toBe("4 min 15 s");
    fireEvent.press(screen.getByTestId("execution-sheet-order-value"));
    fireEvent.press(within(screen.getByTestId("execution-sheet-order-control")).getByText("Les deux côtés à chaque série"));
    // Les deux côtés à chaque série : 2 × 90 + 30 + 3 × 15 = 255 s — PC compté N fois.
    expect(text("execution-sheet-total")).toBe("4 min 15 s");
    tap("execution-sheet-side-recovery-increment");
    // PC 16 : par série + 3 s ; par côté il n'ajouterait qu'une seconde.
    expect(text("execution-sheet-total")).toBe("4 min 18 s");
  });

  it("P3-09/unilateral-controls — sans changement de côté : ordre et PC masqués, aucune contribution de PC", () => {
    const { onApply } = renderSheet(params({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 15 }));
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    fireEvent.press(within(screen.getByTestId("execution-sheet-side-control")).getByText("Sans changement"));
    expect(screen.queryByTestId("execution-sheet-order-value")).toBeNull();
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
    expect(valueOf("execution-sheet-beep")).toBe("2 s");
    for (const mode of ["Répétitions", "Durée"]) {
      // D-4 : le sélecteur se referme après chaque choix ; il est rouvert pour le suivant.
      chooseMode(mode);
      expect(valueOf("execution-sheet-beep")).toBe("2 s");
    }
    validate();
    expect(applied(onApply).cadenceBeepIntervalSeconds).toBe(2);
  });

  it("P3-14/inverse-enumeration — total demandé 100 s : N=3 retenu (égalité vers le plus grand), message d'ajustement 2 min ; 80 s exact sans message", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 1, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
    fireEvent.press(screen.getByTestId("execution-sheet-total"));
    fireEvent(totalWheel().getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 1 } });
    fireEvent(totalWheel().getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 40 } });
    fireEvent.press(totalWheel().getByTestId("duration-wheel-validate"));
    expect(valueOf("execution-sheet-series")).toBe("3 séries");
    expect(screen.getByText("Durée ajustée à 2 min pour respecter un nombre entier de séries.")).toBeTruthy();

    fireEvent.press(screen.getByTestId("execution-sheet-total"));
    fireEvent(totalWheel().getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 1 } });
    fireEvent(totalWheel().getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 20 } });
    fireEvent.press(totalWheel().getByTestId("duration-wheel-validate"));
    expect(valueOf("execution-sheet-series")).toBe("2 séries");
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
    // PRE-4 story 2.1 (AC9, H10, H28) : une Cible à renseigner masque la ligne Durée
    // totale — ni « — » ni « 0 s » (remplace l'ancien attendu PRE-3 « total — »).
    expect(screen.queryByTestId("execution-sheet-row-total")).toBeNull();
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

  it("P3-19/hold — Séries : tap 1, rien avant 500 ms, répétition 150 ms, pas 5 après 2 s, arrêt immédiat au relâchement", () => {
    jest.useFakeTimers();
    renderSheet(params({ series: { kind: "UNIFORM", count: 37, target: numberTarget(30), pauseSeconds: 0, loadKg: 0, workPhases: [] } }));
    // Story 3.3 : ± à l'appui — le champ est d'abord ouvert par sa valeur.
    openExecutionSheetField("execution-sheet-series");
    act(() => {
      fireEvent(screen.getByTestId("execution-sheet-series-increment"), "pressIn");
    });
    expect(valueOf("execution-sheet-series")).toBe("38 séries");
    act(() => jest.advanceTimersByTime(490));
    expect(valueOf("execution-sheet-series")).toBe("38 séries");
    act(() => jest.advanceTimersByTime(10));
    expect(valueOf("execution-sheet-series")).toBe("39 séries");
    act(() => jest.advanceTimersByTime(150));
    expect(valueOf("execution-sheet-series")).toBe("40 séries");
    act(() => {
      fireEvent(screen.getByTestId("execution-sheet-series-increment"), "pressOut");
    });
    act(() => jest.advanceTimersByTime(3000));
    expect(valueOf("execution-sheet-series")).toBe("40 séries");
  });

  it("P3-19/non-accelerated — Bip, Compte à rebours et Fin restent au pas 1 au-delà de 4 s de maintien", () => {
    jest.useFakeTimers();
    renderSheet(params({ countdownSeconds: 0 }));
    openExecutionSheetField("execution-sheet-countdown");
    act(() => {
      fireEvent(screen.getByTestId("execution-sheet-countdown-increment"), "pressIn");
    });
    act(() => jest.advanceTimersByTime(500 + 150 * 30));
    act(() => {
      fireEvent(screen.getByTestId("execution-sheet-countdown-increment"), "pressOut");
    });
    // 1 (tap) + 1 (500 ms) + 30 répétitions au pas 1 = 32 s, jamais un multiple accéléré.
    expect(valueOf("execution-sheet-countdown")).toBe("32 s");
  });

  // Q41 (2026-10-17) : sur iOS, un panneau ouvert est modal (un toucher hors du panneau
  // le ferme) ; l'ouverture d'un second contrôle panneau ouvert se vérifie en ligne, sur
  // Android. L'exclusivité des panneaux iOS est couverte par « PRE4-Q41 ».
  it("P3-19/exclusive-scroll — un seul contrôle en place ouvert ; l'ouverture d'un autre démonte le premier ; en-tête hors du corps défilant", () =>
    withPlatform("android", () => {
    renderSheet(params());
    // La roulette de la Cible n'est montée qu'ouverte ; « ouvert » se lit sur sa présence.
    const targetSelectorOpen = () => screen.queryByTestId("execution-sheet-target-wheel") !== null;
    fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
    expect(targetSelectorOpen()).toBe(true);
    // Story 3.3 (AD-15, T10) : un Sélecteur ou un popover ouvert, le toucher d'un autre
    // champ le ferme sans appliquer et n'ouvre pas le champ touché ; un second toucher l'ouvre.
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    expect(targetSelectorOpen()).toBe(false);
    expect(screen.queryByTestId("execution-sheet-side-control")).toBeNull();
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    expect(screen.getByTestId("execution-sheet-side-control")).toBeTruthy();
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    expect(screen.queryByTestId("execution-sheet-side-control")).toBeNull();
    const body = screen.getByTestId("execution-sheet-body");
    expect(within(body).queryByTestId("execution-sheet-validate")).toBeNull();
    expect(within(body).getByTestId("execution-sheet-end-toggle")).toBeTruthy();
  }));

  it("P3-20/all-surfaces — titre, ✕ / ✓, lignes et libellés des écrans de référence ; valeurs « — » / « Aucun » à l'état vide", () => {
    renderSheet(params({ mode: null, series: { kind: "UNIFORM", count: 1, target: unsetTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] }, sideMode: null }));
    expect(screen.getByText("Paramètres d’exécution")).toBeTruthy();
    // Story 3.3 (FR-04-01) : plus de ligne « Séries variables ». PRE-5 story 2.4 (PR-01) :
    // lignes « Mode », « Condition d’arrêt », « Nombre de séries » et « Type de série ».
    expect(screen.queryByText("Séries variables")).toBeNull();
    for (const label of [
      "Mode",
      "Condition d’arrêt",
      "Nombre de séries",
      "Type de série",
      "Pause après chaque série",
      "Changement de côté",
      "Bip de cadence",
      "Compte à rebours",
      "Fin d’exercice",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.queryByText("Mode d’exécution")).toBeNull();
    expect(modeText()).toBe("—");
    expect(valueOf("execution-sheet-series")).toBe("1 série");
    expect(valueOf("execution-sheet-beep")).toBe("Aucun");
    // Story 3.3 (AC9, FR-11-05) : Changement de côté non renseigné affiché « — ».
    expect(text("execution-sheet-side-value")).toBe("—");
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
  });

  it("P3-20/sheet-specific — voile #1F2129 à 34 % ; Bip avant le total applicable, sinon avant Compte à rebours ; lignes indentées vs premier niveau", () => {
    renderSheet(params({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 10 }));
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-scrim").props.style)).toMatchObject({
      backgroundColor: "rgba(31, 33, 41, 0.34)",
    });
    const order = ["execution-sheet-row-beep", "execution-sheet-row-total", "execution-sheet-row-countdown"];
    const json = JSON.stringify(screen.toJSON());
    const positions = order.map((id) => json.indexOf(`"${id}"`));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    // Q41 : la ligne est rendue dans un cadre de révélation ; l'indentation est portée par
    // son contenu (`-content`).
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-row-side-recovery-content").props.style).marginLeft).toBe(16);
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-row-beep-content").props.style)?.marginLeft).toBeUndefined();
  });

  it("P3-20/sheet-specific — tout échec : aucun total, Bip immédiatement avant Compte à rebours", () => {
    renderSheet(params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: { kind: "FAILURE" }, pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
    expect(screen.queryByTestId("execution-sheet-row-total")).toBeNull();
    const json = JSON.stringify(screen.toJSON());
    expect(json.indexOf('"execution-sheet-row-beep"')).toBeLessThan(json.indexOf('"execution-sheet-row-countdown"'));
  });

  it("P3-21/accessible-controls — libellés complets, états désactivés, valeurs courantes, actions ✓/✕ nommées", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 1, target: numberTarget(90), pauseSeconds: 0, loadKg: 0, workPhases: [] } }));
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityLabel).toBe("Valider les paramètres");
    expect(screen.getByTestId("execution-sheet-cancel").props.accessibilityLabel).toBe("Annuler les paramètres");
    openExecutionSheetField("execution-sheet-series");
    expect(screen.getByTestId("execution-sheet-series-decrement").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId(SERIES_TYPE).props.accessibilityLabel).toBe("Type de série, Identiques, sans effet pour une seule série");
    expect(screen.getByTestId("execution-sheet").props.accessibilityViewIsModal).toBe(true);
    expect(screen.getByTestId("execution-sheet-target-value").props.accessibilityLabel).toBe("Durée d’une série, 1 min 30 s");
  });

  it("INTERACTION/wheel — roulette en place : valeur validée appliquée au brouillon ; ✕ de la roulette sans effet ; ✓ de la feuille applique", () => {
    const { onApply } = renderSheet(params());
    fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
    fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 2 } });
    pressInExecutionSheet(screen.getByTestId("duration-wheel-cancel"));
    expect(text("execution-sheet-target-value")).toBe("1 min 30 s");
    fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
    fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 2 } });
    fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 0 } });
    pressInExecutionSheet(screen.getByTestId("duration-wheel-validate"));
    expect(text("execution-sheet-target-value")).toBe("2 min");
    validate();
    expect(applied(onApply).series).toEqual({ kind: "UNIFORM", count: 3, target: numberTarget(120), pauseSeconds: 15, loadKg: 0, workPhases: [] });
  });

  it("ACCESSIBILITY/wheel — réglage nommé avec sa valeur ; Valider/Annuler de la roulette nommés ; pastille annoncée déployée", () => {
    renderSheet(params());
    fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
    // Q41 : sur iOS, le panneau de la roue est modal pour VoiceOver (`accessibilityViewIsModal`) :
    // la pastille, hors du panneau, est masquée à l'accessibilité tant qu'il est ouvert ; son
    // état déployé se lit donc parmi les éléments masqués.
    expect(
      screen.getByTestId("execution-sheet-target-value", { includeHiddenElements: true }).props.accessibilityState,
    ).toMatchObject({ expanded: true });
    expect(screen.getByTestId("duration-wheel-validate").props.accessibilityLabel.length).toBeGreaterThan(0);
    expect(screen.getByTestId("duration-wheel-cancel").props.accessibilityLabel.length).toBeGreaterThan(0);
    pressInExecutionSheet(screen.getByTestId("duration-wheel-cancel"));
    expect(screen.getByTestId("execution-sheet-target-value").props.accessibilityState).toMatchObject({ expanded: false });
  });

  it("INTERACTION/stepper — tap unique ; borne respectée ; aucun pas au relâchement", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(90), pauseSeconds: 300, loadKg: 0, workPhases: [] } }));
    openExecutionSheetField("execution-sheet-pause");
    expect(screen.getByTestId("execution-sheet-pause-increment").props.accessibilityState).toMatchObject({ disabled: true });
    tap("execution-sheet-pause-decrement");
    expect(valueOf("execution-sheet-pause")).toBe("4 min 59 s");
    tap("execution-sheet-pause-increment");
    expect(valueOf("execution-sheet-pause")).toBe("5 min");
  });

  it("ACCESSIBILITY/stepper — réglage ajustable nommé avec unité ; incrémenter/décrémenter accessibles au pas 1", () => {
    renderSheet(params({ cadenceBeepIntervalSeconds: 4 }));
    openExecutionSheetField("execution-sheet-beep");
    const beep = screen.getByTestId("execution-sheet-beep");
    expect(beep.props.accessibilityRole).toBe("adjustable");
    expect(beep.props.accessibilityLabel).toBe("Bip de cadence, secondes");
    expect(beep.props.accessibilityValue).toMatchObject({ min: 0, max: 10, now: 4 });
    fireEvent(beep, "accessibilityAction", { nativeEvent: { actionName: "increment" } });
    expect(valueOf("execution-sheet-beep")).toBe("5 s");
    fireEvent(screen.getByTestId("execution-sheet-beep"), "accessibilityAction", { nativeEvent: { actionName: "decrement" } });
    expect(valueOf("execution-sheet-beep")).toBe("4 s");
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
    // PRE-5 story 2.4 (P16) : information non modifiable, sans option tactile.
    expect(screen.getByTestId(SERIES_TYPE).props.accessibilityRole).toBe("text");
    expect(screen.UNSAFE_queryAllByProps({ accessibilityRole: "tab", testID: `${SERIES_TYPE}-UNIFORM` })).toHaveLength(0);
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
    expect(screen.getByTestId("execution-sheet-table-row-1-pause-toggle").props.accessibilityLabel).toBe("Série 1, pause");
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
    expect(screen.getByTestId("execution-sheet-target-value").props.accessibilityHint).toBe("Valeur à renseigner");
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
    fireEvent.press(screen.getByTestId("execution-sheet-total"));
    fireEvent(totalWheel().getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 1 } });
    fireEvent(totalWheel().getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 40 } });
    fireEvent.press(totalWheel().getByTestId("duration-wheel-validate"));
    // 100 s demandés sur 30 s + 10 s : N=2 → 80 s, N=3 → 120 s, égalité → N le plus grand.
    expect(valueOf("execution-sheet-series")).toBe("3 séries");
    expect(text("execution-sheet-total")).toBe("2 min");
    const json = JSON.stringify(screen.toJSON());
    expect(json.indexOf('"execution-sheet-row-total"')).toBeLessThan(json.indexOf('"execution-sheet-adjusted"'));
    expect(json.indexOf('"execution-sheet-adjusted"')).toBeLessThan(json.indexOf('"execution-sheet-row-countdown"'));
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    expect(valueOf("execution-sheet-series")).toBe("1 série");
    fireEvent.press(screen.getByTestId("execution-sheet-total"));
    fireEvent(totalWheel().getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 1 } });
    fireEvent(totalWheel().getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 20 } });
    fireEvent.press(totalWheel().getByTestId("duration-wheel-validate"));
    expect(valueOf("execution-sheet-series")).toBe("2 séries");
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
    // Story 3.3 : ± à l'appui ; ouvert, le champ de N garde la largeur DSF 137.
    openExecutionSheetField("execution-sheet-series");
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-series").props.style).width).toBe(137);
    // PRE-5 story 2.6 (AD-27) : le ± de la Pause d'une ligne n'apparaît qu'à l'appui de sa
    // cellule, à la largeur DSF du tableau (128) ; le champ de N se ferme dans le même geste.
    expect(screen.queryByTestId("execution-sheet-table-row-1-pause")).toBeNull();
    openExecutionSheetField("execution-sheet-table-row-1-pause");
    expect(screen.queryByTestId("execution-sheet-series-field")).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-table-row-1-pause").props.style).width).toBe(128);
    expect(screen.getByText("Durée totale ≈")).toBeTruthy();
    // (12 + 10) × 2 s + 30 s + 45 s = 119 s.
    expect(text("execution-sheet-total")).toBe("1 min 59 s");
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

  it("F-01 — glisser interrompu par le système : ligne remise en place, aucun déplacement", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15]]) }));
    const handle = screen.getByTestId("execution-sheet-table-row-1-handle");
    act(() => handle.props.onResponderGrant({ nativeEvent: { pageY: 100 } }));
    act(() => handle.props.onResponderMove({ nativeEvent: { pageY: 190 } }));
    act(() => handle.props.onResponderTerminate({ nativeEvent: null }));
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
  it("D-4 / Q39 / Q40 — Mode, Côté, Ordre : la valeur choisie est appliquée tout de suite, reste visible, puis le sélecteur se replie (cadre 350 ms puis sortie animée)", () =>
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

        // Côté puis Ordre : D-4 inchangé.
        fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
        fireEvent.press(within(screen.getByTestId("execution-sheet-side-control")).getByText("Droite puis gauche"));
        await act(async () => {
          jest.advanceTimersByTime(600);
        });
        expect(screen.queryByTestId("execution-sheet-side-control")).toBeNull();
        fireEvent.press(screen.getByTestId("execution-sheet-order-value"));
        fireEvent.press(within(screen.getByTestId("execution-sheet-order-control")).getByText("Les deux côtés à chaque série"));
        await act(async () => {
          jest.advanceTimersByTime(600);
        });
        expect(screen.queryByTestId("execution-sheet-order-control")).toBeNull();
        expect(text("execution-sheet-order-value")).toBe("Les deux côtés à chaque série");
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
      // PRE-5 story 2.4 : le Mode n'a plus de sélecteur ; le Côté garde le sien (D-4).
      fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
      fireEvent(screen.getByTestId("execution-sheet-side-selector"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 330, height: 58 } } });
      fireEvent.press(within(screen.getByTestId("execution-sheet-side-control")).getByText("Droite puis\ngauche"));
      expect(screen.queryByTestId("execution-sheet-side-control")).toBeNull();
      expect(text("execution-sheet-side-value")).toBe("Droite puis gauche");
    }));

  it("D-5 — message d’ajustement : Annuler encadré (cadre clair) restaure ; toucher le reste du message le ferme sans annuler", () => {
    const { onApply } = renderSheet(params({ series: { kind: "UNIFORM", count: 1, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
    // Total demandé 1 min 40 s : N=3 retenu, message d’ajustement (même geste que P3-14/inverse-enumeration).
    const adjust = () => {
      fireEvent.press(screen.getByTestId("execution-sheet-total"));
      fireEvent(totalWheel().getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 1 } });
      fireEvent(totalWheel().getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 40 } });
      fireEvent.press(totalWheel().getByTestId("duration-wheel-validate"));
    };
    // Annuler encadré : restaure les valeurs précédant l’ajustement (1 série).
    adjust();
    expect(valueOf("execution-sheet-series")).toBe("3 séries");
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
    expect(valueOf("execution-sheet-series")).toBe("1 série");
    // Toucher le reste du message : fermé, ajustement conservé (3 séries).
    adjust();
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted"));
    expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
    expect(valueOf("execution-sheet-series")).toBe("3 séries");
    validate();
    expect(applied(onApply).series).toMatchObject({ count: 3 });
  });
});

describe("ExecutionParametersSheet — D-341 / X-1 (12/10)", () => {
  it("D-341 — Mode Regular 14/17 sans choix affiché tant que le mode est vide ; Côté Regular 13/16 sur deux lignes ; Ordre 14/17 + sous-titre 11/13 ; hauteurs minimales 42/42/60", () =>
    withPlatform("android", () => {
      renderSheet(params({ mode: null, sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE" }));
      // PRE-5 story 2.4 (AC3, UX-DR1) : le Mode est un segmenté en ligne (32 de haut, deux
      // options de 106), sans choix affiché tant que le mode est vide ; libellés Regular 12.
      const mode = screen.getByTestId(MODE_CONTROL);
      expect(screen.queryByTestId(`${MODE_CONTROL}-indicator`)).toBeNull();
      expect(StyleSheet.flatten(mode.props.style)).toMatchObject({ height: 32, width: 220 });
      expect(StyleSheet.flatten(within(mode).getByText("Durée", anyNode).props.style)).toMatchObject({ fontSize: 12, lineHeight: 16, fontWeight: "400" });

      // Rien n'est ouvert (le Mode n'a plus de sélecteur) : le toucher ouvre le Changement de côté.
      fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
      const side = screen.getByTestId("execution-sheet-side-control");
      expect(within(side).getByText("Droite puis\ngauche")).toBeTruthy();
      expect(StyleSheet.flatten(within(side).getByText("Sans\nchangement").props.style)).toMatchObject({ fontSize: 13, lineHeight: 16, fontWeight: "400", textAlign: "center" });
      expect(screen.getByTestId("execution-sheet-side-control-RIGHT_LEFT").props.accessibilityLabel).toBe("Droite puis gauche");

      fireEvent.press(screen.getByTestId("execution-sheet-order-value"));
      fireEvent.press(screen.getByTestId("execution-sheet-order-value"));
      const order = screen.getByTestId("execution-sheet-order-control");
      expect(StyleSheet.flatten(order.props.style).minHeight).toBe(60);
      expect(StyleSheet.flatten(order.props.style).height).toBeUndefined();
      expect(within(order).getByText("(D1 → D2) → (G1 → G2)")).toBeTruthy();
      expect(StyleSheet.flatten(within(order).getByText("Un côté après l’autre").props.style)).toMatchObject({ fontSize: 14, lineHeight: 17, fontWeight: "400" });
      // PRE-5 story 2.4 (PR-03) : les titres des lignes passent en Inter Regular 12.
      expect(StyleSheet.flatten(screen.getByText("Ordre des côtés").props.style)).toMatchObject({ fontSize: 12, fontWeight: "400" });
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
    // PRE-5 story 2.6 : plus de ± dans la cellule — sa roue Répétitions s'ouvre sur 1 (jamais 30).
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-1-target"));
    expect(screen.getByTestId("number-wheel-column").props.selection).toBe(1);
    fireEvent.press(screen.getByTestId("number-wheel-validate"));
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
    // PRE-5 story 2.4 : « Nombre de séries » et « Type de série » sont deux lignes ; toutes
    // deux gardent le centrage vertical et la hauteur minimale de 44 (Q42).
    const check = () => {
      for (const rowID of ["execution-sheet-row-series", "execution-sheet-row-series-type"]) {
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
    expect(screen.queryByTestId("execution-sheet-row-total")).toBeNull();
  });

  it("PRE4-1.1/AC22 — cellules à l’échec en lecture ; en-têtes Mode et Pause conservés ; N augmenté depuis une dernière ligne à l’échec ajoute une ligne à l’échec de même Pause ; changer de Mode conserve les Cibles à l’échec", () => {
    const { onApply } = renderSheet(
      withPhases(variableParameters({ mode: "REPETITIONS", rows: [["FAILURE", 10], ["FAILURE", 20]] })),
    );
    const table = screen.getByTestId("execution-sheet-table");
    expect(within(table).getByText("Répétitions")).toBeTruthy();
    expect(within(table).getByText("Pause")).toBeTruthy();
    // Story 3.6 (Q13) : la cellule affiche « à l’échec » ; PRE-5 story 2.6 (AD-27) : sans ±,
    // elle n'ouvre que sa roue.
    for (const row of [1, 2]) {
      expect(valueOf(`execution-sheet-table-row-${row}-target`)).toBe("à l’échec");
      expect(screen.queryByTestId(`execution-sheet-table-row-${row}-target-increment`)).toBeNull();
      expect(screen.queryByTestId(`execution-sheet-table-row-${row}-target-decrement`)).toBeNull();
      expect(screen.getByTestId(`execution-sheet-table-row-${row}-pause-toggle`)).toBeTruthy();
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
    expect(screen.getByTestId("execution-sheet-target-value").props.accessibilityHint).toBe("Valeur à renseigner");
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
    expect(screen.getByTestId("execution-sheet-target-value").props.accessibilityHint).toBe("Valeur non admise");
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
  it("PRE4-2.1/AC9 — ligne Durée totale masquée pour un tout échec et une Cible à renseigner : ni « — » ni « 0 s » (mélange : story 3.7)", () => {
    for (const parent of [
      variableParameters({ rows: [["FAILURE", 10], ["FAILURE", 10]] }),
      durationParameters("UNSET", 3, 10),
      variableParameters({ rows: [[30, 10], ["UNSET", 10], [45, 10]] }),
    ]) {
      const view = renderSheetView(parent);
      expect(screen.queryByTestId("execution-sheet-row-total")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-total-text")).toBeNull();
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

  it("PRE4-3.1/AC2, PRE5-2.4 — iOS : Mode non renseigné : aucune option sélectionnée, aucun cadre ; Condition d’arrêt « À la cible »", () =>
    withPlatform("ios", () => {
      renderSheet(params({ mode: null, series: { kind: "UNIFORM", count: 1, target: unsetTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] } }));
      expect(selectedValue(MODE_CONTROL, ["REPETITIONS", "DURATION"])).toBeNull();
      expect(screen.queryByTestId(`${MODE_CONTROL}-indicator`)).toBeNull();
      expect(selectedValue(STOP_CONTROL, ["FAILURE", "TARGET"])).toBe("TARGET");
    }));

  /**
   * PRE-5 story 2.4 — remplace les deux tests d'appui extérieur et de second toucher sur la
   * bulle du Mode (plus de bulle) : choisir le Mode range un champ ± ouvert (AD-15, la
   * surface ouverte se ferme) et la Feuille reste tactile ; re-choisir le Mode affiché ne
   * change rien (aucune double bascule possible).
   */
  it("PRE4-3.1/AC3, PRE5-2.4 — iOS : choix du Mode avec un champ ± ouvert : appliqué, champ rangé ; Feuille de nouveau tactile ; re-choisir le Mode affiché est sans effet", () =>
    withPlatform("ios", () => {
      renderSheet(params());
      openExecutionSheetField("execution-sheet-beep");
      expect(screen.getByTestId("execution-sheet-beep-increment")).toBeTruthy();
      fireEvent.press(screen.getByTestId(`${MODE_CONTROL}-DURATION`));
      expect(modeText()).toBe("Durée");
      expect(screen.queryByTestId("execution-sheet-beep-increment")).toBeNull();
      // Feuille tactile : une autre ligne s'ouvre (roue de la Cible dans son panneau sans flèche).
      fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
      expect(screen.getByTestId("execution-sheet-target-panel")).toBeTruthy();
      fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
      expect(screen.queryByTestId("execution-sheet-target-panel")).toBeNull();
      expect(text("execution-sheet-target-value")).toBe("1 min 30 s");
    }));

  /**
   * Q41 (Hermann, 2026-10-17, recette iPhone, E-15) — remplace le test PRE4-Q37 (roue dans
   * `WheelPickerOverlay`, couche centrée, voile non pressable), qui remplaçait lui-même le
   * test « voie (i) » de la story 3.1. La roue de « Durée d’une série » s'ouvre dans un
   * panneau sans flèche (`AnchoredPanel`), sous le champ, aligné à droite, au-dessus du
   * contenu ; un toucher hors du panneau le ferme sans rien appliquer. Jest ne prouve que
   * l'arbre JS : la position, l'absence de flèche et le toucher réels se constatent sur iPhone.
   */
  it("PRE4-Q41 — iOS : la pastille ouvre la roue dans un panneau sans flèche, dans la Feuille, sans Popover ni Modal supplémentaire ; roue native dedans ; ✓ applique au Brouillon, ✕ et toucher extérieur ferment sans appliquer ; Feuille intacte", () =>
    withPlatform("ios", () => {
      const onApply = jest.fn<(value: ExecutionParameters) => void>();
      const view = render(
        <TestSafeAreaProvider>
          <ExecutionParametersSheet parent={params()} profileSideRecoverySecondsDefault={10} onApply={onApply} onCancel={jest.fn()} />
        </TestSafeAreaProvider>,
      );
      // Fermée : aucun panneau, aucune roue montée, aucun Popover (PRE-5 story 2.4 : plus
      // même celui du Mode).
      expect(screen.queryByTestId("execution-sheet-target-panel")).toBeNull();
      expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-target-host-popover")).toBeNull();
      expect(view.UNSAFE_root.findAllByType(Popover)).toHaveLength(0);
      expect(view.UNSAFE_root.findAllByType(Modal)).toHaveLength(1);

      fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
      const panel = screen.getByTestId("execution-sheet-target-panel");
      expect(
        screen.getByTestId("execution-sheet-target-value", { includeHiddenElements: true }).props.accessibilityState,
      ).toMatchObject({ expanded: true });
      // Dans la Feuille, dans son corps défilant, hors de la ligne (aucune ligne ne se décale).
      expect(within(screen.getByTestId("execution-sheet-panel-host", { includeHiddenElements: true })).getByTestId("execution-sheet-target-panel")).toBe(panel);
      expect(
        within(screen.getByTestId("execution-sheet-row-target", { includeHiddenElements: true })).queryByTestId("execution-sheet-target-wheel", {
          includeHiddenElements: true,
        }),
      ).toBeNull();
      // Ni Modal supplémentaire, ni couche WheelPickerOverlay, ni Popover (donc ni flèche).
      expect(view.UNSAFE_root.findAllByType(Modal)).toHaveLength(1);
      expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();
      expect(panel.findAllByType(Popover)).toHaveLength(0);
      expect(view.UNSAFE_root.findAllByType(Popover)).toHaveLength(0);
      expect(panel.findAllByType(RNHostView)).toHaveLength(0);
      // Roue native inchangée (Picker SwiftUI, aucun ScrollView) avec sa barre ✕ / ✓, seuls éléments tactiles du panneau.
      const hosted = within(panel).getByTestId("execution-sheet-target-wheel");
      expect(within(hosted).getByTestId("duration-wheel-minutes").props.onSelectionChange).toBeInstanceOf(Function);
      expect(scrollViewsUnder(panel)).toHaveLength(0);
      // PRE-5 story 2.4 (AC6, FR-22) : la roue de la Cible commune n'offre plus l'option
      // « Aucune durée, à l’échec » (story 3.4) ; seule la barre ✕ / ✓ est tactile.
      expect(touchablesUnder(panel)).toEqual(["duration-wheel-cancel", "duration-wheel-validate"]);
      expect(screen.queryByTestId("duration-wheel-failure-option")).toBeNull();
      // Panneau modal pour VoiceOver ; le geste d'échappement le ferme.
      expect(panel.props.accessibilityViewIsModal).toBe(true);
      expect(panel.props.onAccessibilityEscape).toBeInstanceOf(Function);
      // Zone de toucher extérieur : tactile, non accessible.
      const outside = () => screen.getByTestId("execution-sheet-target-panel-outside", { includeHiddenElements: true });
      expect(outside().props.accessible).toBe(false);

      // ✓ : appliqué au Brouillon de la Feuille seulement.
      fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 2 } });
      fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 15 } });
      fireEvent.press(screen.getByTestId("duration-wheel-validate"));
      expect(screen.queryByTestId("execution-sheet-target-panel")).toBeNull();
      expect(text("execution-sheet-target-value")).toBe("2 min 15 s");
      expect(onApply).not.toHaveBeenCalled();
      // Feuille intacte : une seule Modal, toujours tactile.
      expect(view.UNSAFE_root.findAllByType(Modal)).toHaveLength(1);
      expect(screen.getByTestId("execution-sheet-target-value").props.accessibilityState).toMatchObject({ expanded: false });

      // Réouverture : la roue repart de la valeur courante ; ✕ ne change rien.
      fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
      expect(screen.getByTestId("duration-wheel-minutes").props.selection).toBe(2);
      expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(15);
      fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 4 } });
      fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
      expect(screen.queryByTestId("execution-sheet-target-panel")).toBeNull();
      expect(text("execution-sheet-target-value")).toBe("2 min 15 s");
      // Toucher hors du panneau : fermeture sans application.
      fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
      fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 5 } });
      fireEvent.press(outside());
      expect(screen.queryByTestId("execution-sheet-target-panel")).toBeNull();
      expect(text("execution-sheet-target-value")).toBe("2 min 15 s");
      // Rouverte : aucune position abandonnée n'est reprise.
      fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
      expect(screen.getByTestId("duration-wheel-minutes").props.selection).toBe(2);
      fireEvent.press(screen.getByTestId("duration-wheel-cancel"));

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
      const pill = screen.getByTestId("execution-sheet-target-value");
      // Q37 : plus de Popover de Cible ; la pastille est dans la ligne de la Feuille.
      expect(screen.queryByTestId("execution-sheet-target-host-popover")).toBeNull();
      expect(within(screen.getByTestId("execution-sheet-row-target")).getByTestId("execution-sheet-target-value")).toBe(pill);
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

  /**
   * Q41 (Hermann, 2026-10-17, E-15) — remplace le test PRE4-Q37 « roue centrée sur la page »
   * (lui-même remplaçant le correctif E-05). Le panneau s'ouvre juste sous le champ Durée,
   * cadre aligné à droite sur le champ ; la roue garde sa propre largeur (`330`), sans bulle
   * ni dimensionnement. Positions relevées à la mise en page (événements `layout`).
   */
  it("PRE4-Q41 — iOS : panneau de la roue juste sous le champ Durée, cadre aligné à droite, largeur propre de la roue (330), sans flèche ; aucune réserve quand il tient sous le dernier cadre", () =>
    withPlatform("ios", () => {
      renderSheet(params());
      // PRE-5 story 2.4 (AD-28) : repère unique — y du cadre Séries + y de la ligne dans le cadre.
      layoutFrames({ execution: [0, 90], series: [98, 230], sides: [336, 50], cadence: [394, 190] });
      layoutOf("execution-sheet-row-target", 96, 42);
      fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
      const panel = screen.getByTestId("execution-sheet-target-panel");
      const placement = StyleSheet.flatten(panel.props.style);
      // Sous la ligne du champ (98 + 96 + 42), à 4 points ; bord droit du champ (contour 1 et
      // marge interne 12 du cadre).
      expect(placement).toMatchObject({ position: "absolute", top: 98 + 96 + 42 + 4, right: 13 });
      expect(placement.left).toBeUndefined();
      // Aucun habillage ni transformation de bulle : pas de flèche, la roue garde sa surface.
      expect(placement.transform).toBeUndefined();
      expect(placement.backgroundColor).toBeUndefined();
      const hosted = within(panel).getByTestId("execution-sheet-target-wheel");
      expect(StyleSheet.flatten(hosted.props.style)).toBeUndefined();
      expect(StyleSheet.flatten(within(hosted).getByTestId("duration-wheel-picker").props.style).width).toBe(330);
      fireEvent(panel, "layout", { nativeEvent: { layout: { x: 0, y: 142, width: 330, height: 213 } } });
      expect(screen.queryByTestId("execution-sheet-panel-room", { includeHiddenElements: true })).toBeNull();
    }));

  /**
   * Limite : `withPlatform("android")` ne change que `Platform.OS` à l'exécution. Les
   * simulacres jest-expo restent ceux du préréglage, et aucun rendu Android réel n'est
   * produit. Le test vérifie la branche JS choisie et un élément propre au chemin
   * Android/web : le `ScrollView` de la roulette `LegacyDurationWheelPicker`.
   */
  it("PRE4-3.1/AC6 — parité Android : aucun Popover ; segmenté du Mode en ligne et roulette Legacy en ligne inchangés", () =>
    withPlatform("android", () => {
      renderSheet(params());
      expect(screen.queryByTestId("execution-sheet-mode-host")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-target-host")).toBeNull();
      // PRE-5 story 2.4 : même segmenté du Mode en ligne que sur iOS, toujours affiché.
      expect(within(screen.getByTestId("execution-sheet-row-mode")).getByTestId(MODE_CONTROL)).toBeTruthy();
      expect(screen.queryAllByTestId(/^execution-sheet-mode-option-/)).toHaveLength(0);
      // Rien n'est ouvert : le toucher ouvre la roulette en ligne.
      fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
      // Q37 puis Q41 ne visent que iOS : ni couche WheelPickerOverlay, ni panneau sans
      // flèche sur Android ; la roulette reste en ligne, dans le cadre de sélection (Q41).
      expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-target-panel")).toBeNull();
      expect(within(screen.getByTestId("execution-sheet-row-target")).getByTestId("execution-sheet-target-wheel")).toBeTruthy();
      const inline = screen.getByTestId("execution-sheet-target-wheel");
      expect(within(inline).getByTestId("duration-wheel-picker")).toBeTruthy();
      expect(scrollViewsUnder(inline).length).toBeGreaterThan(0);
      expect(within(inline).getByTestId("duration-wheel-minutes").props.onSelectionChange).toBeUndefined();
      pressInExecutionSheet(screen.getByTestId("duration-wheel-cancel"));
      expect(screen.queryByTestId("execution-sheet-target-wheel")).toBeNull();
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

  // Q41 : sur iOS, le Changement de côté s'ouvre dans un panneau sans flèche ; le sélecteur
  // en ligne (révélé par le bas) se vérifie sur Android.
  it("PRE4-Q39 — lignes, sélecteurs, tableau et lignes du tableau : entrée, sortie et transition de place", () =>
    withPlatform("android", () => {
    renderSheet(bilateralVariable());
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    animated("execution-sheet-side-selector");
    animated("execution-sheet-row-order");
    animated("execution-sheet-row-side-recovery");
    animated("execution-sheet-row-side");
    // E-20 (2026-10-18) : le tableau n'a plus de révélation propre à l'apparition — le groupe
    // le découpe et le révèle en s'agrandissant (une seule animation) ; sortie et place gardées.
    expect(motionOf("execution-sheet-table").entering).toBeUndefined();
    expect(motionOf("execution-sheet-table").exiting).toBeDefined();
    expect(motionOf("execution-sheet-table").layout).toBeDefined();
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-variable-group").props.style).overflow).toBe("hidden");
    // Lignes du tableau : entrée / sortie seulement, le glisser garde sa propre mécanique.
    const row = motionOf("execution-sheet-table-row-2-motion");
    expect(row.entering).toBeDefined();
    expect(row.exiting).toBeDefined();
    expect(row.layout).toBeUndefined();
    // N 2 → 3 : la nouvelle ligne du tableau entre (Q41 : révélée par le bas, sans fondu).
    // Story 3.3 (T10) : le sélecteur de côté est d'abord refermé par un second toucher.
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    tap("execution-sheet-series-increment");
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

  it("PRE4-Q39 — Cible commune, Durée totale et sa roulette en ligne : entrée, sortie et transition de place", () =>
    withPlatform("android", () => {
      renderSheet(params());
      animated("execution-sheet-row-target");
      animated("execution-sheet-row-total");
      fireEvent.press(screen.getByTestId("execution-sheet-total"));
      animated("execution-sheet-total-wheel");
      // PRE-5 story 2.4 (AC3) : le Mode n'a plus de sélecteur en ligne ; son segmenté reste
      // affiché. La ligne de cible masquée à l'échec (FR-21) sort et rentre avec ses animations.
      expect(screen.queryByTestId("execution-sheet-mode-selector")).toBeNull();
      // T10 : la roulette de la Durée totale est ouverte ; le premier appui la ferme sans
      // appliquer, le second choisit À l’échec.
      fireEvent.press(screen.getByTestId(`${STOP_CONTROL}-FAILURE`));
      expect(screen.queryByTestId("execution-sheet-total-wheel")).toBeNull();
      expect(screen.getByTestId("execution-sheet-row-target")).toBeTruthy();
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
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    for (const testID of [
      "execution-sheet-side-selector",
      "execution-sheet-side-selector-content",
      "execution-sheet-row-order",
      "execution-sheet-row-order-content",
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
    fireEvent(screen.getByTestId("execution-sheet-side-selector"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 330, height: 58 } } });
    fireEvent.press(within(screen.getByTestId("execution-sheet-side-control")).getByText("Gauche puis droite"));
    expect(screen.queryByTestId("execution-sheet-side-selector")).toBeNull();
  }));

  // Q40 : cadre porté de 220 à 350 ms. Q41 : la sortie ne comporte plus de fondu (elle
  // redescend sous la barre) ; sélecteur en ligne vérifié sur Android, le panneau iOS
  // suit le même cadre (voir « PRE4-Q41 »).
  it("PRE4-Q39 / Q40 / Q41 — ClosingSelector appelle toujours onClosed : le sélecteur se démonte après le cadre (350 ms) et sort par le bas, sans fondu", () =>
    withPlatform("android", () => {
    jest.useFakeTimers();
    renderSheet(params({ sideMode: "UNILATERAL" }));
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    fireEvent(screen.getByTestId("execution-sheet-side-selector"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 330, height: 58 } } });
    fireEvent.press(within(screen.getByTestId("execution-sheet-side-control")).getByText("Droite puis gauche"));
    expect(text("execution-sheet-side-value")).toBe("Droite puis gauche");
    expect(motionOf("execution-sheet-side-selector").exiting).toBe(revealClipExiting);
    expect(motionOf("execution-sheet-side-selector-content").exiting).toBe(revealContentExiting);
    act(() => jest.advanceTimersByTime(349));
    expect(screen.getByTestId("execution-sheet-side-selector")).toBeTruthy();
    act(() => jest.advanceTimersByTime(1));
    expect(screen.queryByTestId("execution-sheet-side-selector")).toBeNull();
    // La ligne de valeur reste refermée : un nouvel appui rouvre le sélecteur.
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    expect(screen.getByTestId("execution-sheet-side-selector")).toBeTruthy();
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
    for (const testID of ["execution-sheet-row-order", "execution-sheet-row-side-recovery"]) {
      expect(motionOf(testID).entering).toBe(revealClipEntering);
      expect(motionOf(testID).exiting).toBe(revealClipExiting);
      expect(motionOf(testID).layout).toBeDefined();
    }
  });

  // Q41 (E-15) : le fond de sélection est un calque absolu (`-selection`) ; la ligne
  // (`-line`) garde son style, sans marge ni padding de sélection. Sélecteurs en ligne :
  // Android (panneaux sur iOS, voir « PRE4-Q41 »).
  it("PRE4-Q40 / Q41 — lignes sélectionnées (Changement de côté, Ordre, Durée totale) : fond de sélection, rayon 12, sans liseré ; aucun texte ne bouge ; Mode en ligne jamais surligné", () =>
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
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    checkSelected("execution-sheet-row-side");
    // Story 3.3 (AD-15, T10) : surface ouverte, le premier toucher la ferme, le second ouvre la suivante.
    fireEvent.press(screen.getByTestId("execution-sheet-order-value"));
    expect(styleOf("execution-sheet-row-side-selection").backgroundColor).toBeUndefined();
    fireEvent.press(screen.getByTestId("execution-sheet-order-value"));
    checkSelected("execution-sheet-row-order");
    expect(styleOf("execution-sheet-row-side-selection").backgroundColor).toBeUndefined();
    fireEvent.press(screen.getByTestId("execution-sheet-total"));
    fireEvent.press(screen.getByTestId("execution-sheet-total"));
    checkSelected("execution-sheet-row-total");
    // PRE-5 story 2.4 (AC3) : le Mode n'ouvre aucune surface ; le choisir ferme la roue
    // ouverte et sa ligne n'est jamais surlignée (re-choisir le Mode affiché : Brouillon inchangé).
    chooseMode("Durée");
    expect(screen.queryByTestId("execution-sheet-total-wheel")).toBeNull();
    expect(styleOf("execution-sheet-row-total-selection").backgroundColor).toBeUndefined();
    expect(styleOf("execution-sheet-row-mode-selection").backgroundColor).toBeUndefined();
  }));

  // Q41 : sur iOS, un panneau ouvert est modal (toucher extérieur = fermeture) ; cet
  // enchaînement de sélections se vérifie avec les sélecteurs en ligne, sur Android (sur
  // iOS : « PRE4-Q41 — sélection unique »).
  it("PRE4-Q40 — tableau : sélectionné à l'ouverture (passage du Type de série à Variables, chevron) et après une action dedans ; état normal après sélection d'un champ hors tableau (segmenté du Mode, ± de N, ± du Bip) ou au repli", () =>
    withPlatform("android", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15]]) }));
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
    tap("execution-sheet-table-row-1-pause-increment");
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
    // Pause d'une ligne du tableau puis Changement de côté (contrôle en place hors tableau).
    tap("execution-sheet-table-row-2-pause-increment");
    expectSelected();
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    expectNormal();
    // Chevron : déplier sélectionne, replier rend l'état normal. PRE-5 story 2.6 : le premier
    // toucher de la cellule ferme le sélecteur ouvert sans ouvrir son champ (T10).
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-pause-toggle"));
    expect(screen.queryByTestId("execution-sheet-side-selector")).toBeNull();
    tap("execution-sheet-table-row-2-pause-increment");
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

  // Q41 : enchaînement vérifié avec les sélecteurs en ligne, sur Android ; fond de sélection
  // lu sur le calque `-selection`.
  it("PRE4-Q40 — sélection unique : sélecteur de Changement de côté ouvert, puis cellule du tableau → le sélecteur se ferme, la ligne Côté n'est plus surlignée, le tableau l'est ; et inversement", () =>
    withPlatform("android", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10]]) }));
    const group = () => styleOf("execution-sheet-variable-group");
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    expect(screen.getByTestId("execution-sheet-side-selector")).toBeTruthy();
    expect(styleOf("execution-sheet-row-side-selection").backgroundColor).toBe(SELECTED_SURFACE);
    expect(group().backgroundColor).toBeUndefined();
    // PRE-5 story 2.6 (AD-27) : la cellule Pause remplace le ± permanent ; avec un sélecteur
    // ouvert, son toucher le ferme sans ouvrir le champ (T10).
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-1-pause-toggle"));
    expect(screen.queryByTestId("execution-sheet-table-row-1-pause-field")).toBeNull();
    expect(screen.queryByTestId("execution-sheet-side-selector")).toBeNull();
    expect(styleOf("execution-sheet-row-side-selection").backgroundColor).toBeUndefined();
    expect(screen.getByTestId("execution-sheet-side-value").props.accessibilityState).toMatchObject({ expanded: false });
    expect(group().backgroundColor).toBe(SELECTED_SURFACE);
    // PRE-5 story 2.4 : le Mode n'a plus de sélecteur ; champ ± du Bip ouvert, puis prise
    // d'un glisser dans le tableau : champ rangé, tableau sélectionné.
    openExecutionSheetField("execution-sheet-beep");
    expect(styleOf("execution-sheet-row-beep-selection").backgroundColor).toBe(SELECTED_SURFACE);
    expect(group().backgroundColor).toBeUndefined();
    fireEvent(screen.getByTestId("execution-sheet-table-row-1-handle"), "responderGrant", { nativeEvent: { pageY: 100 } });
    expect(screen.queryByTestId("execution-sheet-beep-increment")).toBeNull();
    expect(styleOf("execution-sheet-row-beep-selection").backgroundColor).toBeUndefined();
    expect(group().backgroundColor).toBe(SELECTED_SURFACE);
    fireEvent(screen.getByTestId("execution-sheet-table-row-1-handle"), "responderRelease", { nativeEvent: { pageY: 100 } });
    // Inversement : rouvrir le Changement de côté rend le tableau à l'état normal.
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    expect(group().backgroundColor).toBeUndefined();
    expect(styleOf("execution-sheet-row-side-selection").backgroundColor).toBe(SELECTED_SURFACE);
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
  const textOf = (testID: string) => String(get(`${testID}-text`).props.children);
  const propsOf = (testID: string) => get(testID).props as { entering?: unknown; exiting?: unknown; layout?: unknown };
  const popovers = (root: Instance) => root.findAllByType(Popover).map((node) => node.props.testID as string);
  const PANEL_OF: Readonly<Record<string, string>> = {
    "execution-sheet-side-value": "execution-sheet-side-panel",
    "execution-sheet-order-value": "execution-sheet-order-panel",
    "execution-sheet-target-value": "execution-sheet-target-panel",
    "execution-sheet-total": "execution-sheet-total-panel",
  };

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
    for (const testID of ["execution-sheet-row-order", "execution-sheet-row-side-recovery", "execution-sheet-row-total"]) {
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
      "execution-sheet-row-order",
      "execution-sheet-row-order-content",
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
      fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
      checkEnclosed("execution-sheet-row-side", "execution-sheet-side-selector");
      // Story 3.3 (AD-15, T10) : surface ouverte, le premier toucher la ferme, le second ouvre la suivante.
      fireEvent.press(screen.getByTestId("execution-sheet-order-value"));
      fireEvent.press(screen.getByTestId("execution-sheet-order-value"));
      checkEnclosed("execution-sheet-row-order", "execution-sheet-order-selector");
      fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
      fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
      checkEnclosed("execution-sheet-row-target", "execution-sheet-target-wheel");
      fireEvent.press(screen.getByTestId("execution-sheet-total"));
      fireEvent.press(screen.getByTestId("execution-sheet-total"));
      checkEnclosed("execution-sheet-row-total", "execution-sheet-total-wheel");
      expect(screen.queryByTestId(/-panel$/)).toBeNull();
    }));

  it("PRE4-Q41 — aucun mouvement du texte : styles de cadre, de contenu et de ligne identiques sélectionnée / non sélectionnée (marges, paddings) ; groupe du tableau : seule la couleur change", () => {
    const snapshot = (rowID: string) =>
      JSON.stringify([styleOf(rowID), styleOf(`${rowID}-content`), styleOf(`${rowID}-line`)]);
    renderSheet(bilateral());
    for (const [rowID, pillID] of [
      ["execution-sheet-row-side", "execution-sheet-side-value"],
      ["execution-sheet-row-order", "execution-sheet-order-value"],
      ["execution-sheet-row-target", "execution-sheet-target-value"],
      ["execution-sheet-row-total", "execution-sheet-total"],
    ] as const) {
      const before = snapshot(rowID);
      expect(styleOf(`${rowID}-selection`).backgroundColor).toBeUndefined();
      fireEvent.press(get(pillID));
      expect(styleOf(`${rowID}-selection`).backgroundColor).toBe(SELECTED_SURFACE);
      expect(snapshot(rowID)).toBe(before);
      fireEvent.press(get(`${PANEL_OF[pillID]}-outside`));
      expect(snapshot(rowID)).toBe(before);
    }
  });

  it("PRE4-Q41 — groupe du tableau (Q40) : sélectionné ou non, mêmes marges et paddings ; le séparateur ne change que de couleur", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10]]) }));
    const geometry = (testID: string) => {
      const style = { ...styleOf(testID) };
      delete style.backgroundColor;
      return JSON.stringify(style);
    };
    const before = geometry("execution-sheet-variable-group");
    tap("execution-sheet-table-row-1-pause-increment");
    expect(styleOf("execution-sheet-variable-group").backgroundColor).toBe(SELECTED_SURFACE);
    expect(geometry("execution-sheet-variable-group")).toBe(before);
    tap("execution-sheet-beep-increment");
    expect(styleOf("execution-sheet-variable-group").backgroundColor).toBeUndefined();
    expect(geometry("execution-sheet-variable-group")).toBe(before);
  });

  it.each([
    ["Changement de côté", "execution-sheet-row-side", "execution-sheet-side-value", "execution-sheet-side-panel", "execution-sheet-side-control", "Gauche puis droite"],
    ["Ordre des côtés", "execution-sheet-row-order", "execution-sheet-order-value", "execution-sheet-order-panel", "execution-sheet-order-control", "Les deux côtés à chaque série"],
  ])(
    "PRE4-Q41 — iOS (%s) : panneau sans flèche sous le champ, largeur de la ligne, au-dessus du contenu ; segmenté inchangé ; aucun Popover ni Modal ; choix appliqué puis fermeture (D-4) ; toucher extérieur ferme sans appliquer",
    (_name, rowID, pillID, panelID, controlID, choice) =>
      withPlatform("ios", () => {
        jest.useFakeTimers();
        renderSheetView(bilateral());
        // PRE-5 story 2.4 (AD-28) : ligne à y = 130 dans le cadre Côtés, lui-même à y = 296.
        layoutFrames({ execution: [0, 90], series: [98, 190], sides: [296, 180], cadence: [484, 200] });
        layoutOf(rowID, 130, 42);
        const pillBefore = textOf(pillID);

        // Toucher extérieur : fermeture sans application.
        fireEvent.press(screen.getByTestId(pillID));
        expect(screen.getByTestId(panelID)).toBeTruthy();
        fireEvent.press(get(`${panelID}-outside`));
        expect(screen.queryByTestId(panelID)).toBeNull();
        expect(textOf(pillID)).toBe(pillBefore);
        expect(screen.getByTestId(pillID).props.accessibilityState).toMatchObject({ expanded: false });

        fireEvent.press(screen.getByTestId(pillID));
        const panel = screen.getByTestId(panelID);
        // Sous la ligne du champ, à 4 points, sur la largeur de la ligne (bords du champ à 13 du
        // bord du cadre : contour 1 et marge 12).
        expect(StyleSheet.flatten(panel.props.style)).toMatchObject({ position: "absolute", top: 296 + 130 + 42 + 4, right: 13, left: 13 });
        // Hors de la ligne : aucun contrôle en ligne, aucune ligne décalée.
        expect(within(get(rowID)).queryByTestId(controlID, hidden)).toBeNull();
        expect(within(get("execution-sheet-panel-host")).getByTestId(panelID)).toBe(panel);
        // Contenu : le segmenté accepté, tel quel (mêmes options), dans le panneau.
        const control = within(panel).getByTestId(controlID);
        expect(control.props.accessibilityRole).toBe("tablist");
        // Ni Popover (donc ni flèche), ni Modal supplémentaire, ni ScrollView.
        expect(popovers(screen.UNSAFE_root)).toEqual([]);
        expect(panel.findAllByType(Popover)).toHaveLength(0);
        expect(screen.UNSAFE_root.findAllByType(Modal)).toHaveLength(1);
        expect(panel.findAll((node) => typeof node.type === "string" && /ScrollView/.test(node.type))).toHaveLength(0);
        expect(panel.props.accessibilityViewIsModal).toBe(true);

        // Choix : appliqué tout de suite, valeur visible 350 ms (D-4, Q40), puis fermeture.
        fireEvent(within(panel).getByTestId(rowID === "execution-sheet-row-side" ? "execution-sheet-side-selector" : "execution-sheet-order-selector"), "layout", {
          nativeEvent: { layout: { x: 0, y: 0, width: 330, height: 58 } },
        });
        fireEvent.press(within(control).getByText(choice.includes("puis") ? "Gauche puis\ndroite" : choice));
        expect(textOf(pillID)).toBe(choice);
        act(() => jest.advanceTimersByTime(349));
        expect(screen.getByTestId(panelID)).toBeTruthy();
        act(() => jest.advanceTimersByTime(1));
        expect(screen.queryByTestId(panelID)).toBeNull();
        expect(textOf(pillID)).toBe(choice);
      }),
  );

  it("PRE4-Q41 — iOS : roue de la Durée totale dans un panneau sans flèche sous le champ, aligné à droite ; réserve sous le dernier cadre si elle dépasse ; ✓ applique (inversion), ✕ et toucher extérieur ferment sans appliquer ; aucune Modal ni animation de hauteur", () =>
    withPlatform("ios", () => {
      renderSheet(params({ series: { kind: "UNIFORM", count: 1, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
      // PRE-5 story 2.4 (AD-28) : ligne à y = 50 dans le cadre Cadence et durée, à y = 306.
      layoutFrames({ execution: [0, 90], series: [98, 140], sides: [246, 52], cadence: [306, 194] });
      layoutOf("execution-sheet-row-total", 50, 42);
      expect(text("execution-sheet-total")).toBe("40 s");

      fireEvent.press(screen.getByTestId("execution-sheet-total"));
      const panel = screen.getByTestId("execution-sheet-total-panel");
      expect(StyleSheet.flatten(panel.props.style)).toMatchObject({ position: "absolute", top: 306 + 50 + 42 + 4, right: 13 });
      expect(StyleSheet.flatten(panel.props.style).left).toBeUndefined();
      // Roue native dans le panneau, hors de la ligne ; aucune vue animée autour (pas de révélation de hauteur).
      const wheel = within(panel).getByTestId("execution-sheet-total-wheel");
      expect(within(wheel).getByTestId("duration-wheel-minutes").props.onSelectionChange).toBeInstanceOf(Function);
      expect(panel.props.entering).toBeUndefined();
      expect(wheel.props.entering).toBeUndefined();
      expect(within(get("execution-sheet-row-total")).queryByTestId("execution-sheet-total-wheel", hidden)).toBeNull();
      expect(screen.UNSAFE_root.findAllByType(Modal)).toHaveLength(1);
      expect(panel.findAllByType(Popover)).toHaveLength(0);
      expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();
      // Le panneau (213) dépasse le bas du dernier cadre (306 + 194 = 500) : réserve de
      // 402 + 213 − 500 = 115 sous les cadres.
      fireEvent(panel, "layout", { nativeEvent: { layout: { x: 0, y: 402, width: 330, height: 213 } } });
      expect(StyleSheet.flatten(get("execution-sheet-panel-room").props.style)).toMatchObject({ height: 115 });

      // ✕ : fermeture sans changement, réserve retirée.
      fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 3 } });
      fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
      expect(screen.queryByTestId("execution-sheet-total-panel")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-panel-room")).toBeNull();
      expect(text("execution-sheet-total")).toBe("40 s");
      // Toucher extérieur : fermeture sans changement.
      fireEvent.press(screen.getByTestId("execution-sheet-total"));
      fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 3 } });
      fireEvent.press(get("execution-sheet-total-panel-outside"));
      expect(screen.queryByTestId("execution-sheet-total-panel")).toBeNull();
      expect(text("execution-sheet-total")).toBe("40 s");
      // ✓ : total demandé 1 min 40 s → inversion (N = 3) et message d'ajustement.
      fireEvent.press(screen.getByTestId("execution-sheet-total"));
      fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 1 } });
      fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 40 } });
      fireEvent.press(screen.getByTestId("duration-wheel-validate"));
      expect(screen.queryByTestId("execution-sheet-total-panel")).toBeNull();
      expect(valueOf("execution-sheet-series")).toBe("3 séries");
      expect(screen.getByTestId("execution-sheet-adjusted")).toBeTruthy();
    }));

  it("PRE4-Q41 — iOS : un seul panneau à la fois ; la sélection suit le panneau ouvert ; le tableau n'est plus sélectionné ; le Mode n'ouvre ni panneau ni popover", () =>
    withPlatform("ios", () => {
      renderSheet(params({ sideMode: "RIGHT_LEFT", series: variableRows([[30, 5], [45, 10]]) }));
      tap("execution-sheet-table-row-1-pause-increment");
      expect(styleOf("execution-sheet-variable-group").backgroundColor).toBe(SELECTED_SURFACE);
      fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
      expect(screen.getByTestId("execution-sheet-side-panel")).toBeTruthy();
      expect(styleOf("execution-sheet-variable-group").backgroundColor).toBeUndefined();
      expect(styleOf("execution-sheet-row-side-selection").backgroundColor).toBe(SELECTED_SURFACE);
      fireEvent.press(get("execution-sheet-side-panel-outside"));
      expect(styleOf("execution-sheet-row-side-selection").backgroundColor).toBeUndefined();
      fireEvent.press(screen.getByTestId("execution-sheet-order-value"));
      expect(screen.queryAllByTestId(/^execution-sheet-.+-panel$/).map((node) => node.props.testID)).toEqual(["execution-sheet-order-panel"]);
      fireEvent.press(get("execution-sheet-order-panel-outside"));
      // PRE-5 story 2.4 (AC3) : Mode en segmenté en ligne, sans panneau ni popover.
      chooseMode("Répétitions");
      expect(modeText()).toBe("Répétitions");
      expect(screen.UNSAFE_root.findAllByType(Popover)).toHaveLength(0);
      expect(screen.queryAllByTestId(/^execution-sheet-.+-panel$/)).toHaveLength(0);
    }));
});

describe("PRE4-Q42 — lignes de la Feuille à 44 pt (Hermann, 2026-10-17)", () => {
  it("PRE4-Q42, PRE5-2.6/AC2 — lignes de la Feuille : hauteur minimale 44 pt ; lignes du tableau des séries variables : 36 (AD-28)", () => {
    expect(SHEET_ROW_MIN_HEIGHT).toBe(44);
    expect(TABLE_ROW_HEIGHT).toBe(36);
    renderSheet(params({ series: { kind: "UNIFORM", count: 2, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
    // Story 3.3 : la ligne de l'interrupteur « Séries variables » est retirée ; la ligne
    // « Séries » porte le champ de Régime.
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-row-series-line").props.style).minHeight).toBe(44);
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
  const textOf = (testID: string) => String(get(`${testID}-text`).props.children);
  const shownValue = (testID: string) => String(get(`${testID}-value`).props.children);
  const styleOf = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};
  const SELECTED_SURFACE = "#F2F2FF";
  const bilateral = (overrides: Partial<ExecutionParametersInput> = {}) =>
    params({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE", sideRecoverySeconds: 10, ...overrides });
  const creation = () =>
    params({ mode: null, series: { kind: "UNIFORM", count: 1, target: unsetTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] }, sideMode: null });
  const popovers = () => screen.UNSAFE_root.findAllByType(Popover).map((node) => node.props.testID as string);
  const modals = () => screen.UNSAFE_root.findAllByType(Modal);
  const press = (testID: string) => {
    fireEvent(get(testID), "pressIn");
    fireEvent(get(testID), "pressOut");
  };

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

  it("PRE4-3.3/AC2, PRE5-2.4/AC1 — ordre du corps : Mode → Condition d’arrêt → Nombre de séries → Type de série → Cible et Pause → Côté → Ordre et Pause entre les côtés → Bip → Durée totale → Compte à rebours → Fin ; aucun interrupteur", () => {
    renderSheet(bilateral());
    const order = [
      "execution-sheet-row-mode",
      "execution-sheet-row-stop-condition",
      "execution-sheet-row-series",
      "execution-sheet-series-toggle",
      "execution-sheet-row-series-type",
      "execution-sheet-row-target",
      "execution-sheet-row-pause",
      "execution-sheet-row-side",
      "execution-sheet-row-order",
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
    // Le nombre appartient à la ligne « Nombre de séries » ; le Type de série à sa propre ligne.
    const series = screen.getByTestId("execution-sheet-row-series");
    expect(within(series).getByTestId("execution-sheet-series-toggle")).toBeTruthy();
    expect(within(series).queryByTestId(SERIES_TYPE)).toBeNull();
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
  it("PRE4-3.3/AC2 — sans ligne Durée totale, le Bip est juste avant le Compte à rebours", () => {
    renderSheet(params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
    expect(screen.queryByTestId("execution-sheet-row-total")).toBeNull();
    const json = JSON.stringify(screen.toJSON());
    const beep = json.indexOf('"execution-sheet-row-beep"');
    const countdown = json.indexOf('"execution-sheet-row-countdown"');
    expect(beep).toBeLessThan(countdown);
    expect(json.slice(beep, countdown)).not.toMatch(/"execution-sheet-row-(?!beep)/);
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
  it("PRE4-3.3/AC4 — iOS : Changement de côté dans un panneau sans flèche sous le champ, segmenté accepté ; trois options en toutes lettres ; choix appliqué puis fermeture ; toucher extérieur sans application", () =>
    withPlatform("ios", () => {
      const { onApply } = renderSheet(params({ sideMode: null }));
      // PRE-5 story 2.4 (AD-28) : cadre Côtés à y = 330, ligne en tête du cadre (y = 4).
      layoutFrames({ execution: [0, 98], series: [106, 216], sides: [330, 54], cadence: [392, 190] });
      layoutOf("execution-sheet-row-side", 4, 44);
      expect(textOf("execution-sheet-side-value")).toBe("—");
      fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
      const panel = get("execution-sheet-side-panel");
      expect(StyleSheet.flatten(panel.props.style)).toMatchObject({ position: "absolute", top: 330 + 4 + 44 + 4, right: 13, left: 13 });
      expect(within(panel).getByTestId("execution-sheet-side-control")).toBeTruthy();
      expect(["UNILATERAL", "RIGHT_LEFT", "LEFT_RIGHT"].map((side) => get(`execution-sheet-side-control-${side}`).props.accessibilityLabel)).toEqual([
        "Sans changement",
        "Droite puis gauche",
        "Gauche puis droite",
      ]);
      expect(popovers()).toEqual([]);
      expect(modals()).toHaveLength(1);
      expect(styleOf("execution-sheet-row-side-selection").backgroundColor).toBe(SELECTED_SURFACE);
      // Toucher extérieur : fermeture sans application.
      fireEvent.press(get("execution-sheet-side-panel-outside"));
      expect(query("execution-sheet-side-panel")).toBeNull();
      expect(textOf("execution-sheet-side-value")).toBe("—");
      // Choix : appliqué au Brouillon, puis fermeture (D-4).
      fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
      fireEvent.press(get("execution-sheet-side-control-RIGHT_LEFT"));
      expect(query("execution-sheet-side-panel")).toBeNull();
      expect(textOf("execution-sheet-side-value")).toBe("Droite puis gauche");
      validate();
      expect(applied(onApply).sideMode).toBe("RIGHT_LEFT");
    }));

  it("PRE4-3.3/AC5 — iOS : Ordre des côtés dans le même panneau, deux options et leurs sous-titres ; ligne absente en Sans changement", () =>
    withPlatform("ios", () => {
      const view = renderSheetView(bilateral());
      fireEvent.press(screen.getByTestId("execution-sheet-order-value"));
      const panel = get("execution-sheet-order-panel");
      expect(within(panel).getByTestId("execution-sheet-order-control")).toBeTruthy();
      expect(String(get("execution-sheet-order-control-BY_SIDE-subtitle").props.children)).toBe("(D1 → D2) → (G1 → G2)");
      expect(String(get("execution-sheet-order-control-BY_SERIES-subtitle").props.children)).toBe("(D1 → G1) → (D2 → G2)");
      expect(within(panel).getByText("Un côté après l’autre")).toBeTruthy();
      expect(within(panel).getByText("Les deux côtés à chaque série")).toBeTruthy();
      fireEvent.press(get("execution-sheet-order-control-BY_SERIES"));
      expect(query("execution-sheet-order-panel")).toBeNull();
      expect(textOf("execution-sheet-order-value")).toBe("Les deux côtés à chaque série");
      view.unmount();
      renderSheet(params({ sideMode: "UNILATERAL" }));
      expect(screen.queryByTestId("execution-sheet-row-order")).toBeNull();
    }));

  it("PRE4-3.3/AC6, PRE5-2.4/AC7 — iOS : Type de série à N ≥ 2 en segmenté en ligne dans sa ligne, sans panneau ni popover ; exactement Variables puis Identiques ; choix appliqué par le Brouillon", () =>
    withPlatform("ios", () => {
      const { onApply } = renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
      expect(seriesTypeText()).toBe("Identiques");
      const control = within(get("execution-sheet-row-series-type-line")).getByTestId(SERIES_TYPE);
      expect(control.props.accessibilityRole).toBe("tablist");
      expect(control.props.accessibilityLabel).toBe("Type de série");
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

  it("PRE4-3.3/AC6, PRE5-2.4/AC7 — N = 1 : Type de série non modifiable (information de rôle texte), état uniforme, atténué (UNSELECTED_OPACITY 0,45), sans option tactile ni chevron", () =>
    withPlatform("ios", () => {
      renderSheet(params({ series: variableRows([[30, 10], [45, 20]]) }));
      tap("execution-sheet-series-decrement");
      expect(seriesTypeText()).toBe("Identiques");
      const control = get(SERIES_TYPE);
      expect(control.props.accessibilityRole).toBe("text");
      expect(control.props.accessibilityLabel).toBe("Type de série, Identiques, sans effet pour une seule série");
      expect(styleOf(SERIES_TYPE).opacity).toBe(0.45);
      expect(query(`${SERIES_TYPE}-VARIABLE`)).toBeNull();
      expect(query(`${SERIES_TYPE}-UNIFORM`)).toBeNull();
      expect(query(TABLE_TOGGLE)).toBeNull();
      // L'information non modifiable absorbe l'appui (P16, T23) : le champ de N, ouvert,
      // n'est pas rangé ; sur l'appareil, le conteneur reste responder.
      expect(screen.getByTestId("execution-sheet-series-increment")).toBeTruthy();
      fireEvent.press(control);
      expect(screen.getByTestId("execution-sheet-series-increment")).toBeTruthy();
      expect(seriesTypeText()).toBe("Identiques");
      expect(get("execution-sheet-series-type-absorb").props.onStartShouldSetResponder()).toBe(true);
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
  it("PRE4-3.3/AC7 — une seule surface : un champ ± ouvert puis un panneau — le champ se range, le panneau s'ouvre (T15) ; panneau ouvert, un toucher extérieur ferme sans ouvrir de champ (T10)", () =>
    withPlatform("ios", () => {
      renderSheet(bilateral());
      fireEvent.press(screen.getByTestId("execution-sheet-beep-toggle"));
      expect(screen.getByTestId("execution-sheet-beep-increment")).toBeTruthy();
      fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
      expect(get("execution-sheet-side-panel")).toBeTruthy();
      expect(query("execution-sheet-beep-increment")).toBeNull();
      expect(styleOf("execution-sheet-row-beep-selection").backgroundColor).toBeUndefined();
      // Sur iOS, le panneau couvre le corps : un toucher hors du panneau atteint sa zone
      // extérieure (fermeture sans application) et n'ouvre pas le champ touché.
      fireEvent.press(get("execution-sheet-side-panel-outside"));
      expect(query("execution-sheet-side-panel")).toBeNull();
      expect(query("execution-sheet-beep-increment")).toBeNull();
    }));

  it("PRE4-3.3/AC8 — ± à l'appui : au repos seule la valeur ; l'appui fait apparaître − et + ; largeur fixe 137 ; ligne désignée ; mécanisme accepté inchangé", () => {
    renderSheet(bilateral({ cadenceBeepIntervalSeconds: 2 }));
    for (const field of ["series", "pause", "side-recovery", "beep", "countdown", "end"]) {
      expect(screen.queryByTestId(`execution-sheet-${field}-increment`)).toBeNull();
      expect(screen.queryByTestId(`execution-sheet-${field}-decrement`)).toBeNull();
      expect(screen.getByTestId(`execution-sheet-${field}-toggle`).props.accessibilityState).toMatchObject({ expanded: false });
    }
    expect(shownValue("execution-sheet-beep")).toBe("2 s");
    expect(styleOf("execution-sheet-beep-pill")).toMatchObject({ backgroundColor: "#F5F7FA", borderRadius: 10 });
    expect(screen.getByTestId("execution-sheet-beep-toggle").props.accessibilityLabel).toBe("Bip de cadence, 2 s");
    // NFR-09, Q42 : zone de toucher fermée d'au moins 44 × 44 (toute la largeur du champ).
    expect(styleOf("execution-sheet-beep-toggle")).toMatchObject({ width: 137, minHeight: 44 });
    // Q41 : même cadre fermé et ouvert (largeur, centrage, hauteur) — la valeur ne bouge pas.
    const closedFrame = styleOf("execution-sheet-beep-toggle");
    fireEvent.press(screen.getByTestId("execution-sheet-beep-toggle"));
    const openFrame = styleOf("execution-sheet-beep-field");
    expect(openFrame).toEqual(closedFrame);
    expect(openFrame).toMatchObject({ width: 137, minHeight: 44, alignItems: "center", justifyContent: "center" });
    expect(styleOf("execution-sheet-row-beep-line").minHeight).toBe(44);
    expect(screen.getByTestId("execution-sheet-beep-decrement")).toBeTruthy();
    expect(screen.getByTestId("execution-sheet-beep-increment")).toBeTruthy();
    expect(shownValue("execution-sheet-beep")).toBe("2 s");
    expect(styleOf("execution-sheet-beep").width).toBe(137);
    expect(styleOf("execution-sheet-row-beep-selection").backgroundColor).toBe(SELECTED_SURFACE);
    expect(screen.getByTestId("execution-sheet-beep").props.accessibilityRole).toBe("adjustable");
    expect(screen.getByTestId("execution-sheet-beep").props.accessibilityValue).toMatchObject({ min: 0, max: 10, now: 2 });
  });

  it("PRE4-3.3/AC8 — T20 : un seul champ actif — toucher une autre valeur ferme le premier et ouvre le second d'un seul geste ; T22 : ± du champ ouvert sans fermeture, Bip au pas de 1", () => {
    const { onApply } = renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
    fireEvent.press(screen.getByTestId("execution-sheet-pause-toggle"));
    press("execution-sheet-pause-increment");
    expect(shownValue("execution-sheet-pause")).toBe("11 s");
    fireEvent.press(screen.getByTestId("execution-sheet-beep-toggle"));
    expect(screen.queryByTestId("execution-sheet-pause-increment")).toBeNull();
    expect(shownValue("execution-sheet-pause")).toBe("11 s");
    press("execution-sheet-beep-increment");
    press("execution-sheet-beep-increment");
    expect(screen.getByTestId("execution-sheet-beep-increment")).toBeTruthy();
    expect(shownValue("execution-sheet-beep")).toBe("2 s");
    validate();
    expect(applied(onApply)).toMatchObject({ cadenceBeepIntervalSeconds: 2, series: { kind: "UNIFORM", pauseSeconds: 11, loadKg: 0, workPhases: [] } });
  });

  it("PRE4-3.3/AC8 — T22 : le − de N retire des lignes du tableau sans fermer le champ de N ; T23 : un appui extérieur le range, valeurs conservées, sans Annuler", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    fireEvent.press(screen.getByTestId("execution-sheet-series-toggle"));
    press("execution-sheet-series-decrement");
    expect(shownValue("execution-sheet-series")).toBe("2 séries");
    expect(screen.queryByTestId("execution-sheet-table-row-3")).toBeNull();
    expect(screen.getByTestId("execution-sheet-series-decrement")).toBeTruthy();
    press("execution-sheet-series-decrement");
    expect(shownValue("execution-sheet-series")).toBe("1 série");
    // − à la borne : indisponible ; le conteneur du champ retient le toucher (pas d'appui extérieur).
    expect(screen.getByTestId("execution-sheet-series-decrement").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("execution-sheet-series-field").props.onStartShouldSetResponder()).toBe(true);
    // Appui extérieur (libellé, fond du corps) : rangement, aucun bouton Annuler.
    fireEvent.press(screen.getByText("Compte à rebours"));
    expect(screen.queryByTestId("execution-sheet-series-decrement")).toBeNull();
    expect(shownValue("execution-sheet-series")).toBe("1 série");
    expect(screen.queryByText("Annuler")).toBeNull();
    validate();
    expect(applied(onApply).series).toMatchObject({ kind: "UNIFORM", count: 1 });
  });

  it("PRE4-3.3/AC8 — T24 et T14 : champ ± ouvert, toucher la Cible commune ou le chevron le range et agit dans le même geste", () => {
    const view = renderSheetView(params());
    fireEvent.press(screen.getByTestId("execution-sheet-countdown-toggle"));
    fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
    expect(query("execution-sheet-countdown-increment")).toBeNull();
    expect(get("execution-sheet-target-wheel")).toBeTruthy();
    view.unmount();
    renderSheet(params({ series: variableRows([[30, 10], [45, 20]]) }));
    fireEvent.press(screen.getByTestId("execution-sheet-end-toggle"));
    fireEvent.press(screen.getByTestId(TABLE_TOGGLE));
    expect(screen.queryByTestId("execution-sheet-end-increment")).toBeNull();
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
  });

  it("PRE4-3.3/AC8 — T19 : champ ± ouvert, ✓ de la Feuille applique dans le même geste ; bornes de saisie inchangées", () => {
    const { onApply } = renderSheet(params({ countdownSeconds: 60, endSeconds: 0 }));
    fireEvent.press(screen.getByTestId("execution-sheet-countdown-toggle"));
    expect(screen.getByTestId("execution-sheet-countdown-increment").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("execution-sheet-end-toggle"));
    expect(screen.getByTestId("execution-sheet-end-decrement").props.accessibilityState).toMatchObject({ disabled: true });
    press("execution-sheet-end-increment");
    validate();
    expect(applied(onApply)).toMatchObject({ countdownSeconds: 60, endSeconds: 1 });
  });

  it("PRE4-3.3/AC9 — création : Mode et Changement de côté « — », N = 1, Pause 0 s, Bip « Aucun » ; ✓ produit Sans changement", () => {
    const { onApply } = renderSheet(creation());
    expect(modeText()).toBe("—");
    expect(text("execution-sheet-side-value")).toBe("—");
    // Story 3.8 (AC2, AC4) : « — » affiché, annoncé « aucune valeur » (jamais « tiret »).
    expect(screen.getByTestId("execution-sheet-side-value").props.accessibilityLabel).toBe("Changement de côté, aucune valeur");
    expect(valueOf("execution-sheet-series")).toBe("1 série");
    expect(seriesTypeText()).toBe("Identiques");
    expect(valueOf("execution-sheet-pause")).toBe("0 s");
    expect(valueOf("execution-sheet-beep")).toBe("Aucun");
    chooseMode("Répétitions");
    validate();
    expect(applied(onApply)).toMatchObject({ sideMode: "UNILATERAL", series: { pauseSeconds: 0 } });
  });

  it("PRE4-3.3/AC10 — Mode à renseigner ou Cible commune « — » : ✓ indisponible, fond #FFF1F0 sans contour, aucun message ; Pause 0 s valide", () => {
    const view = renderSheetView(creation());
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    chooseMode("Durée");
    const pill = styleOf("execution-sheet-target-value");
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
      fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
      fireEvent.press(get("execution-sheet-side-control-LEFT_RIGHT"));
      fireEvent.press(screen.getByTestId("execution-sheet-order-value"));
      fireEvent.press(get("execution-sheet-order-control-BY_SERIES"));
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
      sideMode: "LEFT_RIGHT",
      sideOrder: "BY_SERIES",
      series: { kind: "VARIABLE", rows: [{ target: numberTarget(40) }, { target: numberTarget(40) }, { target: numberTarget(40) }] },
    });
    expect(android).toEqual(ios);
    expect(web).toEqual(ios);
  });

  it("PRE4-3.3/AC11 — Android : chaque segmenté est en ligne, dans le cadre de sélection de sa ligne (Côté, Ordre) ou dans la ligne elle-même (Mode, Type de série, PRE-5 story 2.4), avec les mêmes options ; ni panneau ni Popover", () =>
    withPlatform("android", () => {
      renderSheet(bilateral());
      const inline = (rowID: string, valueID: string, controlID: string, options: string[]) => {
        fireEvent.press(screen.getByTestId(valueID));
        const content = screen.getByTestId(`${rowID}-content`);
        const control = within(content).getByTestId(controlID);
        expect(options.map((option) => within(control).getByTestId(`${controlID}-${option}`))).toHaveLength(options.length);
        expect(screen.queryAllByTestId(/^execution-sheet-.+-panel$/)).toHaveLength(0);
        fireEvent.press(screen.getByTestId(valueID));
        expect(screen.queryByTestId(controlID)).toBeNull();
      };
      for (const [rowID, controlID, options] of [
        ["execution-sheet-row-mode", MODE_CONTROL, ["REPETITIONS", "DURATION"]],
        ["execution-sheet-row-series-type", SERIES_TYPE, ["VARIABLE", "UNIFORM"]],
      ] as const) {
        const control = within(screen.getByTestId(`${rowID}-line`)).getByTestId(controlID);
        expect(options.map((option) => within(control).getByTestId(`${controlID}-${option}`))).toHaveLength(options.length);
      }
      inline("execution-sheet-row-side", "execution-sheet-side-value", "execution-sheet-side-control", ["UNILATERAL", "RIGHT_LEFT", "LEFT_RIGHT"]);
      inline("execution-sheet-row-order", "execution-sheet-order-value", "execution-sheet-order-control", ["BY_SIDE", "BY_SERIES"]);
      expect(screen.UNSAFE_root.findAllByType(Popover)).toHaveLength(0);
    }));
  it("PRE4-3.3/AC11 — iOS : aucune Modal ni aucun Pressable de substitution à la place d'un popover — Côté et Ordre (segmenté accepté seul dans le panneau) ; Mode et Type de série en ligne, sans Popover (PRE-5 story 2.4)", () =>
    withPlatform("ios", () => {
      renderSheet(bilateral());
      expect(popovers()).toEqual([]);
      expect(modals()).toHaveLength(1);
      expect(query("execution-sheet-mode-value")).toBeNull();
      expect(query("execution-sheet-regime-value")).toBeNull();
      for (const [valueID, panelID, controlID, count] of [
        ["execution-sheet-side-value", "execution-sheet-side-panel", "execution-sheet-side-control", 3],
        ["execution-sheet-order-value", "execution-sheet-order-panel", "execution-sheet-order-control", 2],
      ] as const) {
        fireEvent.press(screen.getByTestId(valueID));
        const panel = get(panelID);
        // Le panneau ne contient que le segmenté accepté : ses options sont les seuls éléments tactiles.
        const touchables = panel
          .findAll((node) => typeof node.type === "string" && typeof node.props.onResponderGrant === "function")
          .map((node) => node.props.testID as string);
        expect(touchables).toHaveLength(count);
        expect(touchables.every((id) => id.startsWith(`${controlID}-`))).toBe(true);
        expect(panel.findAllByType(Modal)).toHaveLength(0);
        expect(panel.findAllByType(Popover)).toHaveLength(0);
        expect(modals()).toHaveLength(1);
        fireEvent.press(get(`${panelID}-outside`));
        expect(query(panelID)).toBeNull();
      }
    }));

  it("PRE4-3.3/AC8 — chaque champ ± ouvert désigne sa ligne (fond de sélection) : Séries, Pause, Pause entre les côtés, Bip, Compte à rebours, Fin", () => {
    renderSheet(bilateral());
    const rows: [string, string][] = [
      ["series", "execution-sheet-row-series"],
      ["pause", "execution-sheet-row-pause"],
      ["side-recovery", "execution-sheet-row-side-recovery"],
      ["beep", "execution-sheet-row-beep"],
      ["countdown", "execution-sheet-row-countdown"],
      ["end", "execution-sheet-row-end"],
    ];
    for (const [field, rowID] of rows) {
      expect(styleOf(`${rowID}-selection`).backgroundColor).toBeUndefined();
      fireEvent.press(screen.getByTestId(`execution-sheet-${field}-toggle`));
      expect(styleOf(`${rowID}-selection`).backgroundColor).toBe(SELECTED_SURFACE);
      expect(styleOf(`${rowID}-selection`).borderRadius).toBe(12);
      for (const [, other] of rows) {
        if (other !== rowID) expect(styleOf(`${other}-selection`).backgroundColor).toBeUndefined();
      }
    }
  });

  it("PRE4-3.3/AC8 — VoiceOver : à l'ouverture, le focus passe au champ ouvert ; l'échappement, Magic Tap ou l'action « Fermer » le rangent et rendent le focus à la valeur", () => {
    const spy = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
    /** Demandes de focus seules (d'autres composants envoient d'autres événements). */
    const focus = { get calls() { return spy.mock.calls.filter((call) => call[1] === "focus"); } };
    try {
      renderSheet(params());
      spy.mockClear();
      fireEvent.press(screen.getByTestId("execution-sheet-beep-toggle"));
      const field = screen.getByTestId("execution-sheet-beep-field");
      expect(focus.calls).toHaveLength(1);
      expect(field.props.accessibilityActions).toEqual([{ name: "escape" }, { name: "magicTap" }, { name: "close", label: "Fermer" }]);
      fireEvent(field, "accessibilityAction", { nativeEvent: { actionName: "close" } });
      expect(screen.queryByTestId("execution-sheet-beep-increment")).toBeNull();
      expect(focus.calls).toHaveLength(2);
      fireEvent.press(screen.getByTestId("execution-sheet-beep-toggle"));
      fireEvent(screen.getByTestId("execution-sheet-beep-field"), "accessibilityEscape");
      expect(screen.queryByTestId("execution-sheet-beep-increment")).toBeNull();
      fireEvent.press(screen.getByTestId("execution-sheet-beep-toggle"));
      fireEvent(screen.getByTestId("execution-sheet-beep-field"), "magicTap");
      expect(screen.queryByTestId("execution-sheet-beep-increment")).toBeNull();
      // Un champ rangé par un autre champ (T20) ne reprend pas le focus : seul le nouveau le reçoit.
      spy.mockClear();
      fireEvent.press(screen.getByTestId("execution-sheet-beep-toggle"));
      fireEvent.press(screen.getByTestId("execution-sheet-end-toggle"));
      expect(focus.calls).toHaveLength(2);
    } finally {
      spy.mockRestore();
    }
  });

  it("PRE4-3.3/AC8 — T23 : la zone d'appui extérieur couvre aussi les marges du corps (dessus, côtés, sous la dernière ligne)", () => {
    renderSheet(params());
    const outside = screen.getByTestId("execution-sheet-body-outside");
    expect(outside.props.accessible).toBe(false);
    expect(StyleSheet.flatten(outside.props.style)).toMatchObject({ position: "absolute", top: -12, right: -24, bottom: -24, left: -24 });
    fireEvent.press(screen.getByTestId("execution-sheet-end-toggle"));
    fireEvent.press(outside);
    expect(screen.queryByTestId("execution-sheet-end-increment")).toBeNull();
    // Sans champ ouvert, l'appui extérieur est sans effet.
    fireEvent.press(outside);
    expect(valueOf("execution-sheet-end")).toBe("5 s");
  });

  it("PRE4-3.3/AC8 — tableau : un toucher sur une zone neutre ne change rien ; un glisser (T-15) garde son issue, champ ± ouvert ou non", () => {
    renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    tap("execution-sheet-table-row-1-pause-increment");
    const group = () => StyleSheet.flatten(screen.getByTestId("execution-sheet-variable-group").props.style);
    expect(group().backgroundColor).toBe(SELECTED_SURFACE);
    fireEvent.press(within(screen.getByTestId("execution-sheet-table")).getByText("Pause"));
    expect(group().backgroundColor).toBe(SELECTED_SURFACE);
    expect(valueOf("execution-sheet-table-row-1-pause")).toBe("11 s");
    // Glisser avec le champ de N ouvert : le champ est rangé, la ligne est déposée à sa place.
    fireEvent.press(screen.getByTestId("execution-sheet-series-toggle"));
    dragHandle(1, TABLE_ROW_HEIGHT);
    expect(screen.queryByTestId("execution-sheet-series-increment")).toBeNull();
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("45 s");
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("30 s");
    expect(screen.getByTestId("execution-sheet-body").props.scrollEnabled).toBe(true);
  });

  // Story 3.5 : le stepper permanent est retiré ; la pastille de la Cible commune
  // Répétitions ouvre son Sélecteur, qui reste la seule surface ouverte (AD-15).
  it("PRE4-3.3/AC7 — Cible commune Répétitions (pastille depuis 3.5) : l'ouvrir ferme la surface ouverte (champ ±, panneau)", () =>
    withPlatform("ios", () => {
      renderSheet(params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
      fireEvent.press(screen.getByTestId("execution-sheet-beep-toggle"));
      fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
      expect(screen.queryByTestId("execution-sheet-beep-increment")).toBeNull();
      expect(screen.getByTestId("execution-sheet-target-panel")).toBeTruthy();
      fireEvent.press(screen.getByTestId("number-wheel-cancel"));
      expect(text("execution-sheet-target-value")).toBe("10 rép.");
      // PRE-5 story 2.4 : le popover du Mode est retiré ; même règle (T10) avec le panneau du
      // Changement de côté : toucher la Cible le ferme sans ouvrir la roue.
      fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
      expect(get("execution-sheet-side-panel")).toBeTruthy();
      fireEvent.press(get("execution-sheet-target-value"));
      expect(query("execution-sheet-side-panel")).toBeNull();
      expect(query("execution-sheet-target-panel")).toBeNull();
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
 * PRE-4 story 3.4 (AD-7, AD-15, AD-16, Q12, Q21, Q25, Q36, Q41) — Sélecteur de cible en
 * Durée dans la Feuille : roue de la Cible commune avec l'option « Aucune durée, à
 * l’échec », ouverture normalisée par le domaine, `00:00` refusé, ✓ au Brouillon
 * seulement. Le rendu (niveaux de la roue, ✓ indisponible) se juge sur iPhone.
 */
describe("ExecutionParametersSheet — PRE-4 story 3.4", () => {
  const durationTarget = (target: SeriesTarget, count = 3) =>
    params({ series: { kind: "UNIFORM", count, target, pauseSeconds: 15, loadKg: 0, workPhases: [] } });
  /**
   * PRE-5 story 2.4 (AC6, FR-22) : l'option « Aucune durée, à l’échec » ne reste qu'à la roue
   * d'une cellule variable (Q8). Les preuves de la story 3.4 sur cette option sont donc faites
   * sur la cellule de la Série 1 (Série 2 témoin à 45 s) ; celles sur la roue seule restent
   * sur la Cible commune, qui n'a plus l'option.
   */
  const cellTarget = (target: SeriesTarget) =>
    params({
      series: {
        kind: "VARIABLE",
        rows: [
          { target, pauseSeconds: 15, loadKg: 0 },
          { target: numberTarget(45), pauseSeconds: 15, loadKg: 0 },
        ],
      },
    });
  const hiddenNode = { includeHiddenElements: true } as const;
  const openTarget = () => fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
  /** Toucher la valeur de la Cible de la Série 1, ligne et cellule mesurées (le panneau iOS les attend). */
  const openCell = () => {
    fireEvent(screen.getByTestId("execution-sheet-table-row-1-motion", hiddenNode), "layout", {
      nativeEvent: { layout: { x: -4, y: 32, width: 336, height: 36 } },
    });
    fireEvent(screen.getByTestId("execution-sheet-table-row-1-target-cell", hiddenNode), "layout", {
      nativeEvent: { layout: { x: 58, y: 6, width: 71, height: 24 } },
    });
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-1-target", hiddenNode));
  };
  const cellText = (row = 1) => String(screen.getByTestId(`execution-sheet-table-row-${row}-target-value`, hiddenNode).props.children);
  const wheelChange = (column: "minutes" | "seconds", selection: number) =>
    fireEvent(screen.getByTestId(`duration-wheel-${column}`), "selectionChange", { nativeEvent: { selection } });
  const opacity = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style)?.opacity ?? 1;
  const selection = (column: "minutes" | "seconds") => screen.getByTestId(`duration-wheel-${column}`).props.selection as number;
  const wheelValidate = () => fireEvent.press(screen.getByTestId("duration-wheel-validate"));
  /** Texte de la ligne pendant l'ouverture (le panneau est modal pour VoiceOver). */
  const rowText = () =>
    String(screen.getByTestId("execution-sheet-target-value-text", { includeHiddenElements: true }).props.children);
  const sheetValidateDisabled = () => screen.getByTestId("execution-sheet-validate").props.accessibilityState?.disabled === true;
  const variableSeries = (first: SeriesTarget) => ({
    kind: "VARIABLE",
    rows: [
      { target: first, pauseSeconds: 15, loadKg: 0 },
      { target: numberTarget(45), pauseSeconds: 15, loadKg: 0 },
    ],
  });

  it("PRE4-3.4/AC1, PRE5-2.4/AC6 — iOS : la valeur de « Durée d’une série » ouvre le Sélecteur dans le panneau sans flèche sous le champ, avec ses ✕ / ✓ et sans option échec ; toute autre surface se ferme sans appliquer", () =>
    withPlatform("ios", () => {
      const { onApply } = renderSheet(durationTarget(numberTarget(30)));
      fireEvent.press(screen.getByTestId("execution-sheet-pause-toggle"));
      expect(screen.getByTestId("execution-sheet-pause-field")).toBeTruthy();
      openTarget();
      expect(screen.queryByTestId("execution-sheet-pause-field")).toBeNull();
      // L'autre surface se ferme sans rien appliquer : Brouillon inchangé.
      expect(String(screen.getByTestId("execution-sheet-pause-value", { includeHiddenElements: true }).props.children)).toBe("15 s");
      expect(rowText()).toBe("30 s");
      const panel = screen.getByTestId("execution-sheet-target-panel");
      expect(within(panel).queryByTestId("duration-wheel-failure-option")).toBeNull();
      expect(within(panel).queryByText("Aucune durée, à l’échec")).toBeNull();
      expect(within(panel).getByTestId("duration-wheel-cancel")).toBeTruthy();
      expect(within(panel).getByTestId("duration-wheel-validate")).toBeTruthy();
      expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();
      fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
      validate();
      expect(applied(onApply).series).toMatchObject({ kind: "UNIFORM", count: 3, target: { kind: "NUMBER", value: 30 }, pauseSeconds: 15, loadKg: 0, workPhases: [] });
    }));

  it("PRE4-3.4/AC5, AC6, AC8 — cellule à l’échec (Q8) : toucher l'option est sans effet ; ✕ et toucher extérieur gardent « à l’échec » ; la colonne des minutes revient au numérique", () =>
    withPlatform("ios", () => {
      const { onApply } = renderSheet(cellTarget(failureTarget()));
      openCell();
      fireEvent.press(screen.getByTestId("duration-wheel-failure-option"));
      expect([opacity("duration-wheel-failure-option"), opacity("duration-wheel-block"), selection("minutes"), selection("seconds")]).toEqual([
        1, 0.45, 0, 0,
      ]);
      wheelChange("seconds", 30);
      fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
      expect(cellText()).toBe("à l’échec");

      openCell();
      wheelChange("seconds", 30);
      fireEvent.press(screen.getByTestId("execution-sheet-cell-panel-outside", { includeHiddenElements: true }));
      expect(screen.queryByTestId("execution-sheet-cell-panel")).toBeNull();
      expect(cellText()).toBe("à l’échec");

      openCell();
      wheelChange("minutes", 1);
      expect([opacity("duration-wheel-failure-option"), opacity("duration-wheel-block")]).toEqual([0.45, 1]);
      wheelValidate();
      expect(cellText()).toBe("1 min");
      validate();
      expect(applied(onApply).series).toMatchObject(variableSeries(numberTarget(60)));
    }));

  it("PRE4-3.4/AC3 — Cible commune 30 s : roue sur 00:30, sans option ; cellule à l’échec : option à 100 % et 00:00 atténué ; exactement une sélection", () =>
    withPlatform("ios", () => {
      const view = renderSheetView(durationTarget(numberTarget(30)));
      openTarget();
      expect([selection("minutes"), selection("seconds")]).toEqual([0, 30]);
      expect(screen.queryByTestId("duration-wheel-failure-option")).toBeNull();
      expect(screen.queryByTestId("duration-wheel-block")).toBeNull();
      view.unmount();
      const cell = renderSheetView(cellTarget(numberTarget(30)));
      openCell();
      expect([selection("minutes"), selection("seconds")]).toEqual([0, 30]);
      expect(opacity("duration-wheel-failure-option")).toBe(0.45);
      expect(opacity("duration-wheel-block")).toBe(1);
      cell.unmount();
      renderSheet(cellTarget(failureTarget()));
      expect(cellText()).toBe("à l’échec");
      openCell();
      expect(opacity("duration-wheel-failure-option")).toBe(1);
      expect(opacity("duration-wheel-block")).toBe(0.45);
      expect([selection("minutes"), selection("seconds")]).toEqual([0, 0]);
      expect(screen.getByTestId("duration-wheel-failure-option").props.accessibilityState).toMatchObject({ selected: true });
    }));

  it("PRE4-3.4/AC3 — Cible à renseigner : ouverture sur 00:01 (Q25, D-430), active, sans option, ✓ du Sélecteur disponible ; la ligne garde « — » ; ✕ la laisse à renseigner ; ✓ sans tourner applique 1 s", () =>
    withPlatform("ios", () => {
      renderSheet(durationTarget(unsetTarget()));
      openTarget();
      expect([selection("minutes"), selection("seconds")]).toEqual([0, 1]);
      expect(screen.queryByTestId("duration-wheel-failure-option")).toBeNull();
      expect(screen.getByTestId("duration-wheel-validate").props.accessibilityState?.disabled).not.toBe(true);
      expect(rowText()).toBe("—");
      fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
      expect(text("execution-sheet-target-value")).toBe("—");
      expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-target-value").props.style).backgroundColor).toBe("#FFF1F0");
      expect(sheetValidateDisabled()).toBe(true);
      openTarget();
      wheelValidate();
      expect(text("execution-sheet-target-value")).toBe("1 s");
      expect(sheetValidateDisabled()).toBe(false);
    }));

  it("PRE4-3.4/AC4 — Cible ancienne 5999 s : roue sur 58:55 (nearestGridValue), ligne inchangée pendant l'ouverture ; ✕ garde 5999 s ; ✓ sans tourner applique 3535 s ; 7 s ouvre sur 00:07 et reste 7 s", () =>
    withPlatform("ios", () => {
      const legacy = durationTarget(numberTarget(5999));
      const view = renderSheetView(legacy, 10, legacy);
      const before = text("execution-sheet-target-value");
      expect(before).toBe(formatPhraseDuration(5999));
      openTarget();
      expect([selection("minutes"), selection("seconds")]).toEqual([58, 55]);
      expect(rowText()).toBe(before);
      fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
      expect(text("execution-sheet-target-value")).toBe(before);
      openTarget();
      wheelValidate();
      expect(text("execution-sheet-target-value")).toBe(formatPhraseDuration(3535));
      view.unmount();

      const { onApply } = renderSheet(durationTarget(numberTarget(7)));
      expect(sheetValidateDisabled()).toBe(false);
      openTarget();
      expect([selection("minutes"), selection("seconds")]).toEqual([0, 7]);
      wheelValidate();
      expect(text("execution-sheet-target-value")).toBe("7 s");
      validate();
      expect(applied(onApply).series).toMatchObject({ kind: "UNIFORM", target: { kind: "NUMBER", value: 7 } });
    }));

  it("PRE4-3.4/AC5, AC8, PRE5-2.4/AC6 — cellule passée à l'échec : ✓ du Sélecteur applique FAILURE à cette seule série, au Brouillon seulement, et le résultat dérivé suit ; ✓ de la Feuille applique ensuite ; ✕ de la Feuille annule tout", () =>
    withPlatform("ios", () => {
      const view = renderSheetView(cellTarget(numberTarget(30)));
      openCell();
      fireEvent.press(screen.getByTestId("duration-wheel-failure-option"));
      wheelValidate();
      expect(screen.queryByTestId("execution-sheet-cell-panel")).toBeNull();
      expect(cellText()).toBe("à l’échec");
      expect(cellText(2)).toBe("45 s");
      // FR-20 : une série à l'échec, une à la cible → résultat mixte.
      expect(screen.getByTestId(STOP_CONTROL).props.accessibilityLabel).toBe("Condition d’arrêt, À la cible et à l’échec");
      expect(view.onApply).not.toHaveBeenCalled();
      validate();
      expect(applied(view.onApply).series).toMatchObject(variableSeries(failureTarget()));
      view.unmount();

      const second = renderSheetView(cellTarget(numberTarget(30)));
      openCell();
      fireEvent.press(screen.getByTestId("duration-wheel-failure-option"));
      wheelValidate();
      fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
      expect(second.onCancel).toHaveBeenCalledTimes(1);
      expect(second.onApply).not.toHaveBeenCalled();
    }));

  it("PRE4-3.4/AC8 — 30 s : tourner vers 45 s puis ✕ garde 30 s ; tourner puis toucher hors du panneau garde 30 s ; tourner vers 45 s puis ✓ donne 45 s", () =>
    withPlatform("ios", () => {
      renderSheet(durationTarget(numberTarget(30)));
      openTarget();
      wheelChange("seconds", 45);
      fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
      expect(text("execution-sheet-target-value")).toBe("30 s");
      openTarget();
      wheelChange("seconds", 45);
      fireEvent.press(screen.getByTestId("execution-sheet-target-panel-outside", { includeHiddenElements: true }));
      expect(screen.queryByTestId("execution-sheet-target-panel")).toBeNull();
      expect(text("execution-sheet-target-value")).toBe("30 s");
      openTarget();
      wheelChange("seconds", 45);
      wheelValidate();
      expect(text("execution-sheet-target-value")).toBe("45 s");
    }));

  it("PRE4-3.4/AC9 — scénario FR-08-05 sur une cellule : ouvrir (00:30, 45 %), option (100 %, 00:00 à 45 %), tourner vers 00:30, ✓ ; rouvrir, échec, ✓ ; rouvrir, changer, ✕ : état d'avant restauré", () =>
    withPlatform("ios", () => {
      const { onApply } = renderSheet(cellTarget(numberTarget(30)));
      openCell();
      expect([selection("minutes"), selection("seconds"), opacity("duration-wheel-failure-option")]).toEqual([0, 30, 0.45]);
      fireEvent.press(screen.getByTestId("duration-wheel-failure-option"));
      expect([selection("minutes"), selection("seconds"), opacity("duration-wheel-failure-option"), opacity("duration-wheel-block")]).toEqual([
        0, 0, 1, 0.45,
      ]);
      wheelChange("seconds", 30);
      expect([opacity("duration-wheel-failure-option"), opacity("duration-wheel-block")]).toEqual([0.45, 1]);
      wheelValidate();
      expect(cellText()).toBe("30 s");

      openCell();
      fireEvent.press(screen.getByTestId("duration-wheel-failure-option"));
      wheelValidate();
      expect(cellText()).toBe("à l’échec");

      openCell();
      expect([opacity("duration-wheel-failure-option"), opacity("duration-wheel-block"), selection("seconds")]).toEqual([1, 0.45, 0]);
      wheelChange("seconds", 20);
      fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
      expect(cellText()).toBe("à l’échec");
      validate();
      expect(applied(onApply).series).toMatchObject(variableSeries(failureTarget()));
    }));

  it("PRE4-3.4/AC7 — sélection numérique amenée sur 00:00 : ✓ du Sélecteur indisponible, pas d'échec ; la Cible reste inchangée ; Pause 0 s reste valide", () =>
    withPlatform("ios", () => {
      renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 0, loadKg: 0, workPhases: [] } }));
      openTarget();
      wheelChange("seconds", 0);
      const check = screen.getByTestId("duration-wheel-validate");
      expect(check.props.accessibilityState).toMatchObject({ disabled: true });
      fireEvent.press(check);
      expect(screen.getByTestId("execution-sheet-target-panel")).toBeTruthy();
      // PRE-5 story 2.4 (FR-22) : « À l'échec » n'est pas une durée nulle ; la roue commune n'a pas d'option échec.
      expect(screen.queryByTestId("duration-wheel-failure-option")).toBeNull();
      fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
      expect(text("execution-sheet-target-value")).toBe("30 s");
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
      expect(text("execution-sheet-target-value")).toBe("—");
      const pill = StyleSheet.flatten(screen.getByTestId("execution-sheet-target-value").props.style);
      expect(pill.backgroundColor).toBe("#FFF1F0");
      expect(pill.borderWidth).toBeUndefined();
      expect(sheetValidateDisabled()).toBe(true);
      unset.unmount();
      renderSheet(durationTarget(numberTarget(60)));
      expect(text("execution-sheet-target-value")).toBe("1 min");
      expect(screen.queryByText("Série à l’échec")).toBeNull();
    }));

  it("PRE4-3.4/AC12, PRE5-2.4/AC6 — Android : la roulette Legacy en ligne d'une cellule porte la même option et les mêmes transitions ; FAILURE appliquée à cette série ; la roulette commune n'a pas l'option", () =>
    withPlatform("android", () => {
      const view = renderSheetView(durationTarget(numberTarget(30)));
      openTarget();
      const common = within(screen.getByTestId("execution-sheet-row-target")).getByTestId("execution-sheet-target-wheel");
      expect(within(common).queryByTestId("duration-wheel-failure-option")).toBeNull();
      view.unmount();

      const { onApply } = renderSheet(cellTarget(numberTarget(30)));
      openCell();
      const inline = within(screen.getByTestId("execution-sheet-table-row-1-motion")).getByTestId("execution-sheet-cell-wheel");
      expect(within(inline).getByTestId("duration-wheel-failure-option")).toBeTruthy();
      expect(opacity("duration-wheel-failure-option")).toBe(0.45);
      fireEvent.press(screen.getByTestId("duration-wheel-failure-option"));
      expect(opacity("duration-wheel-block")).toBe(0.45);
      wheelValidate();
      expect(cellText()).toBe("à l’échec");
      validate();
      expect(applied(onApply).series).toMatchObject(variableSeries(failureTarget()));
    }));
});

/**
 * PRE-4 story 3.5 (AD-7, AD-15, AD-16, Q8, Q12, Q14, Q21, Q25, Q41) — Sélecteur de cible
 * en Répétitions dans la Feuille : pastille de la ligne commune, roue native à une
 * colonne (ligne de tête « Aucune répétition, à l’échec », puis 1..100) dans le
 * panneau sans flèche, ouverture normalisée par le domaine, ✓ au Brouillon seulement.
 * Le rendu de la ligne de tête (`NON VÉRIFIABLE`) se juge sur iPhone (R-3.5-01 à 04).
 */
describe("ExecutionParametersSheet — PRE-4 story 3.5", () => {
  const repetitionsTarget = (target: SeriesTarget, count = 3) =>
    params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count, target, pauseSeconds: 15, loadKg: 0, workPhases: [] } });
  /**
   * PRE-5 story 2.4 (AC6, FR-22) : la ligne de tête « Aucune répétition, à l’échec » ne reste
   * qu'à la roue d'une cellule variable (Q8) ; ses preuves sont faites sur la cellule de la
   * Série 1 (Série 2 témoin à 8 rép.). La roue de la Cible commune n'a plus que 1..100.
   */
  const cellRepetitions = (target: SeriesTarget) =>
    params({
      mode: "REPETITIONS",
      series: {
        kind: "VARIABLE",
        rows: [
          { target, pauseSeconds: 15, loadKg: 0 },
          { target: numberTarget(8), pauseSeconds: 15, loadKg: 0 },
        ],
      },
    });
  const variableSeries = (first: SeriesTarget) => ({
    kind: "VARIABLE",
    rows: [
      { target: first, pauseSeconds: 15, loadKg: 0 },
      { target: numberTarget(8), pauseSeconds: 15, loadKg: 0 },
    ],
  });
  const hiddenNode = { includeHiddenElements: true } as const;
  const openTarget = () => fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
  /** Toucher la valeur de la Cible de la Série 1, ligne et cellule mesurées (le panneau iOS les attend). */
  const openCell = () => {
    fireEvent(screen.getByTestId("execution-sheet-table-row-1-motion", hiddenNode), "layout", {
      nativeEvent: { layout: { x: -4, y: 32, width: 336, height: 36 } },
    });
    fireEvent(screen.getByTestId("execution-sheet-table-row-1-target-cell", hiddenNode), "layout", {
      nativeEvent: { layout: { x: 58, y: 6, width: 71, height: 24 } },
    });
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-1-target", hiddenNode));
  };
  const cellText = (row = 1) => String(screen.getByTestId(`execution-sheet-table-row-${row}-target-value`, hiddenNode).props.children);
  const wheelChange = (selection: number | string) =>
    fireEvent(screen.getByTestId("number-wheel-column"), "selectionChange", { nativeEvent: { selection } });
  const selection = () => screen.getByTestId("number-wheel-column").props.selection as number | string;
  const wheelValidate = () => fireEvent.press(screen.getByTestId("number-wheel-validate"));
  const wheelCancel = () => fireEvent.press(screen.getByTestId("number-wheel-cancel"));
  /** Texte de la ligne pendant l'ouverture (le panneau est modal pour VoiceOver). */
  const rowText = () =>
    String(screen.getByTestId("execution-sheet-target-value-text", { includeHiddenElements: true }).props.children);
  const sheetValidateDisabled = () => screen.getByTestId("execution-sheet-validate").props.accessibilityState?.disabled === true;
  /** Éléments SwiftUI (`Text` + `tag`) de la colonne native, dans l'ordre de la roue. */
  const columnNodes = () =>
    screen
      .getByTestId("number-wheel-column")
      .findAll((node) => typeof node.type === "string" && typeof node.props.text === "string");
  const columnItems = () => columnNodes().map((node) => node.props.text as string);
  const oneToHundred = Array.from({ length: 100 }, (_, index) => String(index + 1));

  it("PRE4-3.5/AC1 — iOS : panneau juste sous le champ Répétitions, aligné à droite (Q41)", () =>
    withPlatform("ios", () => {
      renderSheet(repetitionsTarget(numberTarget(10)));
      // PRE-5 story 2.4 (AD-28) : y du cadre Séries + y de la ligne dans le cadre.
      layoutFrames({ execution: [0, 98], series: [106, 230], sides: [344, 54], cadence: [406, 190] });
      layoutOf("execution-sheet-row-target", 96, 44);
      openTarget();
      const panel = screen.getByTestId("execution-sheet-target-panel");
      const placement = StyleSheet.flatten(panel.props.style);
      // Sous la ligne du champ (106 + 96 + 44), à 4 points ; bord droit du champ (13 : contour et marge du cadre).
      expect(placement).toMatchObject({ position: "absolute", top: 106 + 96 + 44 + 4, right: 13 });
      expect(placement.left).toBeUndefined();
      expect(placement.transform).toBeUndefined();
      expect(placement.backgroundColor).toBeUndefined();
      const hosted = within(panel).getByTestId("execution-sheet-target-wheel");
      expect(StyleSheet.flatten(hosted.props.style)).toBeUndefined();
      // PRE-5 story 2.4 (AC6) : sans ligne de tête, la roue garde sa largeur propre à une colonne (144).
      expect(StyleSheet.flatten(within(hosted).getByTestId("execution-sheet-repetitions-wheel").props.style).width).toBe(144);
    }));

  it("PRE4-3.5/AC1 — iOS : la valeur de « Nombre de répétitions » ouvre le Sélecteur dans le panneau sans flèche sous le champ, avec ses ✕ / ✓ ; toute autre surface se ferme ; toucher extérieur ferme sans appliquer", () =>
    withPlatform("ios", () => {
      const { onApply } = renderSheet(repetitionsTarget(numberTarget(10)));
      fireEvent.press(screen.getByTestId("execution-sheet-pause-toggle"));
      expect(screen.getByTestId("execution-sheet-pause-field")).toBeTruthy();
      openTarget();
      expect(screen.queryByTestId("execution-sheet-pause-field")).toBeNull();
      const panel = screen.getByTestId("execution-sheet-target-panel");
      expect(within(screen.getByTestId("execution-sheet-panel-host", { includeHiddenElements: true })).getByTestId("execution-sheet-target-panel")).toBe(panel);
      // Q41 : le panneau n'est pas dans la ligne (au-dessus du contenu, aucune ligne décalée).
      expect(
        within(screen.getByTestId("execution-sheet-row-target", { includeHiddenElements: true })).queryByTestId("execution-sheet-target-wheel", {
          includeHiddenElements: true,
        }),
      ).toBeNull();
      expect(within(panel).getByTestId("execution-sheet-repetitions-wheel")).toBeTruthy();
      expect(within(panel).getByTestId("number-wheel-cancel")).toBeTruthy();
      expect(within(panel).getByTestId("number-wheel-validate")).toBeTruthy();
      expect(screen.getByTestId("execution-sheet-target-value", { includeHiddenElements: true }).props.accessibilityState).toMatchObject({ expanded: true });
      wheelChange(12);
      fireEvent.press(screen.getByTestId("execution-sheet-target-panel-outside", { includeHiddenElements: true }));
      expect(screen.queryByTestId("execution-sheet-target-panel")).toBeNull();
      expect(text("execution-sheet-target-value")).toBe("10 rép.");
      validate();
      expect(applied(onApply).series).toMatchObject({ kind: "UNIFORM", count: 3, target: { kind: "NUMBER", value: 10 }, pauseSeconds: 15, loadKg: 0, workPhases: [] });
    }));

  it("PRE4-3.5/AC2, PRE5-2.4/AC6 — une colonne : Cible commune 1..100 sans ligne de tête ; cellule variable : ligne de tête puis 1..100 ; ni filet, ni option séparée, ni grisé ; plus de stepper en ligne", () =>
    withPlatform("ios", () => {
      const view = renderSheetView(repetitionsTarget(numberTarget(10)));
      expect(screen.queryByTestId("execution-sheet-target-stepper")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-target-failure")).toBeNull();
      openTarget();
      expect(columnItems()).toEqual(oneToHundred);
      expect(screen.queryByTestId("duration-wheel-failure-option")).toBeNull();
      view.unmount();
      renderSheet(cellRepetitions(numberTarget(10)));
      openCell();
      expect(columnItems()).toEqual(["Aucune répétition, à l’échec", ...oneToHundred]);
      expect(screen.queryByTestId("duration-wheel-failure-option")).toBeNull();
      expect(screen.queryByTestId("duration-wheel-failure-option-rule")).toBeNull();
      expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-repetitions-wheel").props.style).opacity).toBeUndefined();
    }));

  it("PRE4-3.5/AC3 — cellule : la position de la roue choisit : 12, puis retour sur la ligne de tête → l'échec ; FAILURE émise, jamais un nombre", () =>
    withPlatform("ios", () => {
      const { onApply } = renderSheet(cellRepetitions(failureTarget()));
      openCell();
      expect(selection()).toBe("failure");
      wheelChange(12);
      wheelValidate();
      expect(cellText()).toBe("12 rép.");
      openCell();
      expect(selection()).toBe(12);
      wheelChange("failure");
      wheelValidate();
      expect(cellText()).toBe("à l’échec");
      validate();
      expect(applied(onApply).series).toEqual(variableSeries(failureTarget()));
    }));

  it("PRE4-3.5/AC4 — ouverture : NUMBER 12 → 12 ; FAILURE (cellule) → ligne de tête ; ancienne 150 → 100, ligne inchangée pendant l'ouverture, ✕ garde 150, ✓ sans tourner applique 100", () =>
    withPlatform("ios", () => {
      const twelve = renderSheetView(repetitionsTarget(numberTarget(12)));
      openTarget();
      expect(selection()).toBe(12);
      twelve.unmount();

      const failure = renderSheetView(cellRepetitions(failureTarget()));
      openCell();
      expect(selection()).toBe("failure");
      failure.unmount();

      const legacy = repetitionsTarget(numberTarget(150));
      renderSheet(legacy, 10, legacy);
      expect(text("execution-sheet-target-value")).toBe("150 rép.");
      openTarget();
      expect(selection()).toBe(100);
      expect(rowText()).toBe("150 rép.");
      wheelCancel();
      expect(text("execution-sheet-target-value")).toBe("150 rép.");
      openTarget();
      wheelValidate();
      expect(text("execution-sheet-target-value")).toBe("100 rép.");
    }));

  it("PRE4-3.5/AC4 — Cible à renseigner (P37) : roue sur 1, pas sur la ligne de tête ; la ligne garde « — » ; ✕ la laisse à renseigner ; ✓ sans tourner applique 1", () =>
    withPlatform("ios", () => {
      renderSheet(repetitionsTarget(unsetTarget()));
      expect(text("execution-sheet-target-value")).toBe("—");
      expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-target-value").props.style).backgroundColor).toBe("#FFF1F0");
      expect(screen.getByTestId("execution-sheet-target-value").props.accessibilityHint).toBe("Valeur à renseigner");
      expect(sheetValidateDisabled()).toBe(true);
      openTarget();
      expect(selection()).toBe(1);
      expect(rowText()).toBe("—");
      wheelCancel();
      expect(text("execution-sheet-target-value")).toBe("—");
      expect(sheetValidateDisabled()).toBe(true);
      openTarget();
      wheelValidate();
      expect(text("execution-sheet-target-value")).toBe("1 rép.");
      expect(sheetValidateDisabled()).toBe(false);
    }));

  it("PRE4-3.5/AC4 — Durée à « — » passée en Répétitions : le Sélecteur ouvre sur 1 (selectorOpeningPosition, Q25)", () =>
    withPlatform("ios", () => {
      renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: unsetTarget(), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
      chooseExecutionMode("Répétitions");
      expect(text("execution-sheet-target-value")).toBe("—");
      openTarget();
      expect(selection()).toBe(1);
    }));

  it("PRE4-3.5/AC5 — bornes : 1 et 100 atteignables ; aucune valeur 0, 101 ou fractionnaire ne sort du Sélecteur", () =>
    withPlatform("ios", () => {
      renderSheet(repetitionsTarget(numberTarget(10)));
      openTarget();
      const items = columnItems();
      // Contrôle positif d'abord (la liste est bien lue), puis les absences.
      expect(items).toContain("1");
      expect(items).toContain("100");
      expect(items).not.toContain("0");
      expect(items).not.toContain("101");
      expect(items.every((item) => Number.isInteger(Number(item)))).toBe(true);
      wheelChange(100);
      wheelValidate();
      expect(text("execution-sheet-target-value")).toBe("100 rép.");
      openTarget();
      wheelChange(1);
      wheelValidate();
      expect(text("execution-sheet-target-value")).toBe("1 rép.");
      // Valeurs natives hors liste (défense) : ramenées dans les bornes, à l'entier.
      openTarget();
      wheelChange(101);
      wheelValidate();
      expect(text("execution-sheet-target-value")).toBe("100 rép.");
      openTarget();
      wheelChange(0);
      wheelValidate();
      expect(text("execution-sheet-target-value")).toBe("1 rép.");
      openTarget();
      wheelChange(12.4);
      wheelValidate();
      expect(text("execution-sheet-target-value")).toBe("12 rép.");
    }));

  it("PRE4-3.5/AC6 — cellule à 10 : tourner vers 12 puis ✕ garde 10 ; tourner vers l'échec puis ✓ donne « à l’échec » à cette série, au Brouillon seulement ; ✓ de la Feuille applique ; ✕ de la Feuille annule tout", () =>
    withPlatform("ios", () => {
      const view = renderSheetView(cellRepetitions(numberTarget(10)));
      openCell();
      wheelChange(12);
      wheelCancel();
      expect(screen.queryByTestId("execution-sheet-cell-panel")).toBeNull();
      expect(cellText()).toBe("10 rép.");
      openCell();
      wheelChange("failure");
      wheelValidate();
      expect(screen.queryByTestId("execution-sheet-cell-panel")).toBeNull();
      expect(cellText()).toBe("à l’échec");
      expect(cellText(2)).toBe("8 rép.");
      expect(view.onApply).not.toHaveBeenCalled();
      validate();
      expect(applied(view.onApply).series).toMatchObject(variableSeries(failureTarget()));
      view.unmount();

      const second = renderSheetView(cellRepetitions(numberTarget(10)));
      openCell();
      wheelChange("failure");
      wheelValidate();
      fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
      expect(second.onCancel).toHaveBeenCalledTimes(1);
      expect(second.onApply).not.toHaveBeenCalled();
    }));

  it("PRE4-3.5/AC7 — accessibilité : nombres libellés (« 12 répétitions ») ; ligne de tête libellée dans la cellule ; pastille annoncée avec la Cible", () =>
    withPlatform("ios", () => {
      const view = renderSheetView(repetitionsTarget(numberTarget(12)));
      // H14 : libellé de la ligne commune « Nombre de répétitions ».
      expect(screen.getByText("Nombre de répétitions")).toBeTruthy();
      expect(screen.getByTestId("execution-sheet-target-value").props.accessibilityLabel).toBe("Nombre de répétitions, 12 rép.");
      openTarget();
      // Recherche limitée à la colonne de la roue (`number-wheel-column`).
      const labelOf = (textValue: string) => {
        const node = columnNodes().find((candidate) => candidate.props.text === textValue)!;
        const modifiers = node.props.modifiers as { $type: string; label?: string }[];
        return modifiers.find((modifier) => modifier.$type === "accessibilityLabel")?.label;
      };
      expect(labelOf("1")).toBe("1 répétition");
      expect(labelOf("12")).toBe("12 répétitions");
      view.unmount();
      renderSheet(cellRepetitions(failureTarget()));
      openCell();
      expect(labelOf("Aucune répétition, à l’échec")).toBe("Aucune répétition, à l’échec");
      expect(labelOf("12")).toBe("12 répétitions");
    }));

  it("PRE4-3.5/AC8, PRE5-2.4/AC6 — Android : la roulette Legacy en ligne d'une cellule porte la même ligne de tête et les mêmes transitions ; FAILURE puis 12 appliqués à cette série ; la roulette commune n'a pas de ligne de tête", () =>
    withPlatform("android", () => {
      const view = renderSheetView(repetitionsTarget(numberTarget(10)));
      openTarget();
      const common = within(screen.getByTestId("execution-sheet-row-target")).getByTestId("execution-sheet-target-wheel");
      expect(within(common).queryByTestId("number-wheel-column-item-failure")).toBeNull();
      view.unmount();

      const { onApply } = renderSheet(cellRepetitions(numberTarget(10)));
      openCell();
      const inline = within(screen.getByTestId("execution-sheet-table-row-1-motion")).getByTestId("execution-sheet-cell-wheel");
      const head = within(inline).getByTestId("number-wheel-column-item-failure");
      expect(head.props.accessibilityState).toMatchObject({ selected: false });
      fireEvent.press(head);
      expect(screen.getByTestId("number-wheel-column-item-failure").props.accessibilityState).toMatchObject({ selected: true });
      wheelValidate();
      expect(cellText()).toBe("à l’échec");
      openCell();
      expect(screen.getByTestId("number-wheel-column").props.accessibilityValue).toEqual({ text: "Aucune répétition, à l’échec" });
      fireEvent.press(screen.getByTestId("number-wheel-column-item-12"));
      wheelValidate();
      expect(cellText()).toBe("12 rép.");
      validate();
      expect(applied(onApply).series).toMatchObject(variableSeries(numberTarget(12)));
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
      series: { kind: "VARIABLE", rows: rows.map(([target, pauseSeconds]) => ({ target: toTarget(target), pauseSeconds, loadKg: 0 })) },
      ...overrides,
    });
  const hidden = { includeHiddenElements: true } as const;
  const targetID = (row: number) => `execution-sheet-table-row-${row}-target`;
  /** Mise en page simulée de la ligne `row` et de sa cellule de Cible (le panneau attend ces mesures). */
  const measureRow = (row: number) => {
    fireEvent(screen.getByTestId(`execution-sheet-table-row-${row}-motion`, hidden), "layout", {
      nativeEvent: { layout: { x: -4, y: 32 + 36 * (row - 1), width: 336, height: 36 } },
    });
    fireEvent(screen.getByTestId(`${targetID(row)}-cell`, hidden), "layout", {
      nativeEvent: { layout: { x: 58, y: 6, width: 71, height: 24 } },
    });
  };
  const pressValue = (row: number) => fireEvent.press(screen.getByTestId(targetID(row), hidden));
  /** Toucher la valeur de la Cible, ligne mesurée (iOS : panneau ; Android, web : en ligne). */
  const openCell = (row: number) => {
    measureRow(row);
    pressValue(row);
  };
  const cellValue = (row: number, column: "target" | "pause" = "target") =>
    String(screen.getByTestId(`execution-sheet-table-row-${row}-${column}-value`, hidden).props.children);
  const press = (testID: string) => {
    fireEvent(screen.getByTestId(testID, hidden), "pressIn");
    fireEvent(screen.getByTestId(testID, hidden), "pressOut");
  };
  const cellPanel = () => screen.queryByTestId("execution-sheet-cell-panel");
  const durationSelection = () => [
    screen.getByTestId("duration-wheel-minutes").props.selection as number,
    screen.getByTestId("duration-wheel-seconds").props.selection as number,
  ];
  const rowCount = () => screen.queryAllByTestId(/^execution-sheet-table-row-\d+$/, hidden).length;
  const groupBackground = () => StyleSheet.flatten(screen.getByTestId("execution-sheet-variable-group", hidden).props.style).backgroundColor;
  const sheetValidateDisabled = () => screen.getByTestId("execution-sheet-validate").props.accessibilityState?.disabled === true;
  const layoutBox = (testID: string, layout: { x?: number; y: number; width: number; height: number }) =>
    fireEvent(screen.getByTestId(testID, hidden), "layout", { nativeEvent: { layout: { x: 0, ...layout } } });

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
      expect(within(line).getByTestId(`execution-sheet-table-row-${row}-pause-toggle`)).toBeTruthy();
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

  it("PRE4-3.6/AC1 — `12 rép.` en Répétitions ; Q40 : groupe normal à l'ouverture, sélectionné par une action dans le tableau (Sélecteur de cellule compris), normal dès un autre champ ou le repli", () => {
    renderSheet(variableSheet([[12, 10], [10, 20]], "REPETITIONS"));
    expect(cellValue(1)).toBe("12 rép.");
    expect(groupBackground()).toBeUndefined();
    openCell(1);
    expect(groupBackground()).toBe("#F2F2FF");
    fireEvent.press(screen.getByTestId("number-wheel-cancel"));
    expect(groupBackground()).toBe("#F2F2FF");
    fireEvent.press(screen.getByTestId("execution-sheet-beep-toggle"));
    expect(groupBackground()).toBeUndefined();
    tap("execution-sheet-table-row-1-pause-increment");
    expect(groupBackground()).toBe("#F2F2FF");
    fireEvent.press(screen.getByTestId(TABLE_TOGGLE));
    expect(groupBackground()).toBeUndefined();
  });

  it("PRE4-3.6/AC2 (partie maintenue par Q44) — une seule surface ouverte : un champ ± ouvert se ferme quand la valeur d'une Cible est touchée, et son Sélecteur s'ouvre dans le même geste (T21)", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
    fireEvent.press(screen.getByTestId("execution-sheet-beep-toggle"));
    expect(screen.getByTestId("execution-sheet-beep-field")).toBeTruthy();
    openCell(2);
    expect(screen.queryByTestId("execution-sheet-beep-field")).toBeNull();
    expect(cellPanel()).not.toBeNull();
    expect(screen.getAllByTestId(/-panel$/)).toHaveLength(1);
  });

  it("PRE4-3.6/AC2 (partie maintenue par Q44) — S4 (R-3.6-09) : − de N avec son champ ouvert retire la ligne 3 et garde le champ ; la valeur de la Cible de la ligne 2 ferme N et ouvre sa roue sur 00:45, d'un seul geste", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
    tap("execution-sheet-series-decrement");
    expect(rowCount()).toBe(2);
    expect(screen.getByTestId("execution-sheet-series-field")).toBeTruthy();
    openCell(2);
    expect(screen.queryByTestId("execution-sheet-series-field")).toBeNull();
    expect(cellPanel()).not.toBeNull();
    expect(durationSelection()).toEqual([0, 45]);
  });

  it("PRE4-3.6/AC3 — valeur de la Cible de la ligne 3 : Sélecteur de la story 3.4 sur 00:45 dans le panneau sous la cellule ; ✓ échec, ✓ nombre, ✕ ; seule cette ligne change", () => {
    const { onApply } = renderSheet(variableSheet([[30, 10], [60, 20], [45, 30]]));
    openCell(3);
    const panel = screen.getByTestId("execution-sheet-cell-panel");
    expect(within(panel).getByTestId("execution-sheet-cell-wheel")).toBeTruthy();
    expect(within(panel).getByTestId("duration-wheel-failure-option")).toBeTruthy();
    expect(durationSelection()).toEqual([0, 45]);
    expect(screen.getByTestId(targetID(3), hidden).props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(screen.getByTestId("duration-wheel-failure-option"));
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(cellPanel()).toBeNull();
    expect(cellValue(3)).toBe("à l’échec");

    openCell(3);
    fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 1 } });
    fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 15 } });
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(cellValue(3)).toBe("1 min 15 s");

    openCell(3);
    fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 40 } });
    fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
    expect(cellPanel()).toBeNull();
    expect([cellValue(1), cellValue(2), cellValue(3)]).toEqual(["30 s", "1 min", "1 min 15 s"]);
    validate();
    expect(applied(onApply).series).toEqual({
      kind: "VARIABLE",
      rows: [
        { target: numberTarget(30), pauseSeconds: 10, loadKg: 0 },
        { target: numberTarget(60), pauseSeconds: 20, loadKg: 0 },
        { target: numberTarget(75), pauseSeconds: 30, loadKg: 0 },
      ],
    });
  });

  it("PRE4-3.6/AC3 — ouverture normalisée : 5999 s → 58:55, `UNSET` → 00:01 (D-430) ; Répétitions (roue de la story 3.5) : 12 → 12, 150 → 100, `UNSET` → 1", () => {
    const view = renderSheetView(variableSheet([[5999, 10], [null, 20]]));
    openCell(1);
    expect(durationSelection()).toEqual([58, 55]);
    fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
    expect(cellValue(1)).toBe(formatPhraseDuration(5999));
    openCell(2);
    expect(durationSelection()).toEqual([0, 1]);
    fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
    expect(cellValue(2)).toBe("—");
    view.unmount();

    renderSheet(variableSheet([[12, 10], [150, 20], [null, 30]], "REPETITIONS"));
    const selection = () => screen.getByTestId("number-wheel-column").props.selection as number | string;
    openCell(1);
    expect(within(screen.getByTestId("execution-sheet-cell-panel")).getByTestId("execution-sheet-repetitions-wheel")).toBeTruthy();
    expect(selection()).toBe(12);
    fireEvent.press(screen.getByTestId("number-wheel-cancel"));
    openCell(2);
    expect(selection()).toBe(100);
    fireEvent.press(screen.getByTestId("number-wheel-cancel"));
    openCell(3);
    expect(selection()).toBe(1);
    fireEvent(screen.getByTestId("number-wheel-column"), "selectionChange", { nativeEvent: { selection: 8 } });
    fireEvent.press(screen.getByTestId("number-wheel-validate"));
    expect([cellValue(1), cellValue(2), cellValue(3)]).toEqual(["12 rép.", "150 rép.", "8 rép."]);
  });

  it("PRE4-3.6/AC3 — toucher hors du panneau (zone extérieure) : fermeture sans appliquer, rien d'autre n'est activé (T7)", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
    openCell(3);
    fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 50 } });
    fireEvent.press(screen.getByTestId("execution-sheet-cell-panel-outside", hidden));
    expect(cellPanel()).toBeNull();
    expect(cellValue(3)).toBe("1 min");
    expect(rowCount()).toBe(3);
    expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
  });

  it("PRE4-3.6/AC3, PRE5-2.6/AC3 — Q41, Q45 : panneau sous la ligne ; aligné à droite sur la cellule quand la roue tient, sinon ramené au bord gauche des lignes", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
    // PRE-5 story 2.4 (AD-28) : cadre Séries à y = 106 ; le groupe « Type de série » est dans le cadre.
    // PRE-5 story 2.6 (UX-DR3) : bloc blanc de 336 (à 8 du contour), marge haute 12, lignes de 36 ;
    // la cellule est mesurée dans sa ligne, elle-même en retrait de 4 dans le bloc.
    layoutBox("execution-sheet-frame-series", { y: 106, width: 354, height: 600 });
    layoutBox("execution-sheet-variable-group", { y: 48, width: 354, height: 300 });
    layoutBox("execution-sheet-table", { y: 50, width: 336, height: 200 });
    layoutBox("execution-sheet-table-row-2-motion", { y: 68, width: 336, height: 36 });
    layoutBox("execution-sheet-table-row-2-target-cell", { x: 58, y: 6, width: 71, height: 24 });
    // Géométrie mesurée par ligne : une autre cellule (ligne 1) n'influe pas sur la ligne 2.
    layoutBox("execution-sheet-table-row-1-motion", { y: 32, width: 336, height: 36 });
    layoutBox("execution-sheet-table-row-1-target-cell", { x: 0, y: 0, width: 10, height: 10 });
    pressValue(2);
    const placement = () => StyleSheet.flatten(screen.getByTestId("execution-sheet-cell-panel").props.style);
    // Bas de la ligne : 106 + 48 + 50 + 12 + 68 + 36 = 320, puis 4 d'écart.
    expect(placement()).toMatchObject({ position: "absolute", top: 324 });
    // Roue de 330 : alignée sur la cellule (1 + 8 + 336 − (4 + 58 + 71) = 212), elle sortirait à
    // gauche ; elle est ramenée au bord des lignes (354 − 13 − 330 = 11 ; 13 = contour et marge du cadre).
    expect(placement().right).toBe(11);
    expect(placement().left).toBeUndefined();
    fireEvent(screen.getByTestId("execution-sheet-cell-panel"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 100, height: 200 } } });
    expect(placement().right).toBe(212);
    // La largeur mesurée vaut pour cette ouverture seulement : rouvert, le panneau repart de
    // la largeur par défaut de la roue montée (330).
    fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
    pressValue(2);
    expect(placement().right).toBe(11);
  });

  it("PRE4-3.6/AC3 — Q41 : tant que la ligne n'est pas mesurée, le panneau n'est pas rendu (aucun saut en tête de tableau) ; mesures élaguées au retrait", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
    pressValue(2);
    expect(cellPanel()).toBeNull();
    measureRow(2);
    expect(cellPanel()).not.toBeNull();
    fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
    // Retrait de la ligne 2 : ses mesures sont élaguées ; restaurée, elle attend une nouvelle mesure.
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove"));
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    pressValue(2);
    expect(cellPanel()).toBeNull();
    measureRow(2);
    expect(cellPanel()).not.toBeNull();
  });

  it("PRE4-3.6/AC3 — roue Durée d'une ligne : minutes et secondes annoncées avec le contexte « Série n, Durée »", () => {
    renderSheet(variableSheet([[30, 10], [45, 20]]));
    openCell(2);
    // iOS : libellé porté par le modificateur SwiftUI `accessibilityLabel` de chaque colonne.
    const labelOf = (testID: string) => {
      const modifiers = (screen.getByTestId(testID).props.modifiers ?? []) as { $type: string; label?: string }[];
      return String(modifiers.find((modifier) => modifier.$type === "accessibilityLabel")?.label ?? "");
    };
    const minutes = labelOf("duration-wheel-minutes");
    const seconds = labelOf("duration-wheel-seconds");
    expect(minutes.startsWith("Série 2, Durée, ")).toBe(true);
    expect(seconds.startsWith("Série 2, Durée, ")).toBe(true);
  });

  it("PRE4-3.6/AC3 — Android : le Sélecteur de la cellule s'ouvre en ligne sous sa ligne ; ✓ applique à cette ligne seule", () =>
    withPlatform("android", () => {
      renderSheet(variableSheet([[12, 10], [10, 20]], "REPETITIONS"));
      openCell(2);
      expect(cellPanel()).toBeNull();
      const inline = within(screen.getByTestId("execution-sheet-table-row-2-motion")).getByTestId("execution-sheet-cell-wheel");
      fireEvent.press(within(inline).getByTestId("number-wheel-column-item-failure"));
      fireEvent.press(within(inline).getByTestId("number-wheel-validate"));
      expect([cellValue(1), cellValue(2)]).toEqual(["12 rép.", "à l’échec"]);
    }));

  it("PRE4-3.6/AC4, PRE5-2.6/AC3 — cellules sans ± : Cible `FAILURE` ou `UNSET` réglée par la seule roue de sa cellule ; `UNSET` sur #FFF1F0, annoncée « aucune valeur », ouverte sur 00:01 (D-430, 1 en Répétitions) ; le fond disparaît après ✓", () => {
    const view = renderSheetView(variableSheet([["FAILURE", 10], [null, 20]]));
    for (const row of [1, 2]) {
      expect(screen.queryByTestId(`${targetID(row)}-increment`, hidden)).toBeNull();
      expect(screen.queryByTestId(`${targetID(row)}-decrement`, hidden)).toBeNull();
    }
    expect(cellValue(1)).toBe("à l’échec");
    expect(StyleSheet.flatten(screen.getByTestId(targetID(2)).props.style).backgroundColor).toBe("#FFF1F0");
    expect(screen.getByTestId(targetID(2)).props.accessibilityValue).toEqual({ text: "aucune valeur" });
    openCell(2);
    expect(durationSelection()).toEqual([0, 1]);
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(cellValue(2)).toBe("1 s");
    expect(StyleSheet.flatten(screen.getByTestId(targetID(2)).props.style).backgroundColor).not.toBe("#FFF1F0");
    view.unmount();

    renderSheet(variableSheet([[null, 10], [4, 20]], "REPETITIONS"));
    openCell(1);
    expect(screen.getByTestId("number-wheel-column").props.selection).toBe(1);
    fireEvent.press(screen.getByTestId("number-wheel-validate"));
    expect(cellValue(1)).toBe("1 rép.");
  });

  it("PRE5-2.6/AC3 — cellule Pause : son toucher ouvre le ± de cette seule cellule, sous la ligne ; + → 11 s, − → 9 s, champ toujours ouvert (T22) ; bornes 0 et 300 indisponibles ; second toucher : fermé", () => {
    const view = renderSheetView(variableSheet([[30, 10], [45, 300], [60, 0]]));
    // Au repos, aucun stepper dans le tableau (AC2 de la story).
    expect(screen.UNSAFE_root.findAll((node) => /^execution-sheet-table-row-\d+-(target|pause)-(increment|decrement)$/.test(String(node.props.testID ?? "")))).toHaveLength(0);
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-1-pause-toggle"));
    const field = screen.getByTestId("execution-sheet-table-row-1-pause-field");
    expect(within(screen.getByTestId("execution-sheet-table-row-1-motion")).getByTestId("execution-sheet-table-row-1-pause-motion")).toBeTruthy();
    expect(within(field).getByTestId("execution-sheet-table-row-1-pause-increment")).toBeTruthy();
    // Une seule cellule ouverte : les autres lignes restent à valeur seule.
    expect(screen.queryByTestId("execution-sheet-table-row-2-pause-field")).toBeNull();
    expect(screen.getByTestId("execution-sheet-table-row-1-pause-toggle").props.accessibilityState).toMatchObject({ expanded: true });
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-table-row-1-pause-toggle").props.style).backgroundColor).toBe("#EAEAFF");
    press("execution-sheet-table-row-1-pause-increment");
    expect(valueOf("execution-sheet-table-row-1-pause")).toBe("11 s");
    press("execution-sheet-table-row-1-pause-decrement");
    press("execution-sheet-table-row-1-pause-decrement");
    expect(valueOf("execution-sheet-table-row-1-pause")).toBe("9 s");
    expect(screen.getByTestId("execution-sheet-table-row-1-pause-field")).toBeTruthy();
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-1-pause-toggle"));
    expect(screen.queryByTestId("execution-sheet-table-row-1-pause-field")).toBeNull();
    expect(cellValue(1, "pause")).toBe("9 s");
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-pause-toggle"));
    expect(screen.getByTestId("execution-sheet-table-row-2-pause-increment").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-3-pause-toggle"));
    expect(screen.queryByTestId("execution-sheet-table-row-2-pause-field")).toBeNull();
    expect(screen.getByTestId("execution-sheet-table-row-3-pause-decrement").props.accessibilityState).toMatchObject({ disabled: true });
    view.unmount();
  });

  it("PRE4-3.6/AC6, PRE5-2.6/AC3 — maintien sur + de la Pause d'une ligne : pas 1 puis paliers, saturation à 300 sans rebouclage ; relâchement sans pas", () => {
    jest.useFakeTimers();
    renderSheet(variableSheet([[30, 10], [45, 20]]));
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-1-pause-toggle"));
    const plus = () => screen.getByTestId("execution-sheet-table-row-1-pause-increment");
    fireEvent(plus(), "pressIn");
    expect(valueOf("execution-sheet-table-row-1-pause")).toBe("11 s");
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(valueOf("execution-sheet-table-row-1-pause")).toBe("12 s");
    act(() => {
      jest.advanceTimersByTime(120_000);
    });
    expect(valueOf("execution-sheet-table-row-1-pause")).toBe(formatPhraseDuration(300));
    fireEvent(plus(), "pressOut");
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(valueOf("execution-sheet-table-row-1-pause")).toBe(formatPhraseDuration(300));
    expect(cellValue(2, "pause")).toBe("20 s");
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
    });
  });

  it("PRE4-3.6/AC9 — croix de la ligne 2 (N = 4) : retrait immédiat avec sa Pause, renumérotation, « Série supprimée — Annuler » par le message existant ; Annuler restaure", () => {
    const { onApply } = renderSheet(variableSheet([[30, 10], [45, 20], [60, 30], [75, 40]]));
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove"));
    expect(rowCount()).toBe(3);
    expect([1, 2, 3].map((row) => cellValue(row))).toEqual(["30 s", "1 min", "1 min 15 s"]);
    expect(valueOf("execution-sheet-series")).toBe("3 séries");
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

  it("PRE4-3.6/AC9 — Q29 : `Annuler` survit à l'ouverture puis ✕ d'un Sélecteur de cellule (T27) ; une Pause modifiée l'invalide", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove"));
    openCell(2);
    fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    expect([1, 2, 3].map((row) => cellValue(row))).toEqual(["30 s", "45 s", "1 min"]);

    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove"));
    expect(screen.getByTestId("execution-sheet-adjusted")).toBeTruthy();
    tap("execution-sheet-table-row-1-pause-increment");
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
    // Panneau de 3.3 : ouvert puis refermé sans choix, par sa valeur et par un toucher extérieur (`AnchoredPanel`).
    for (const control of ["side"] as const) {
      for (const close of ["value", "outside"] as const) {
        fireEvent.press(screen.getByTestId(`execution-sheet-${control}-value`, hidden));
        expect(screen.getByTestId(`execution-sheet-${control}-control`, hidden)).toBeTruthy();
        fireEvent.press(
          screen.getByTestId(close === "value" ? `execution-sheet-${control}-value` : `execution-sheet-${control}-panel-outside`, hidden),
        );
        expect(screen.queryByTestId(`execution-sheet-${control}-control`, hidden)).toBeNull();
        expect(undoAvailable()).toBe(true);
      }
    }
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    expect([1, 2, 3].map((row) => cellValue(row))).toEqual(["30 s", "45 s", "1 min"]);
  });

  it("PRE4-3.6/AC9 — Q29 (report de 3.2 clos en 4.2) : bilatéral, N ≥ 2 — panneau Ordre des côtés ouvert puis fermé sans choix (valeur, toucher extérieur) n'invalide pas `Annuler`", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]], "DURATION", { sideMode: "RIGHT_LEFT", sideRecoverySeconds: 5 }));
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove"));
    const undoAvailable = () => screen.queryByTestId("execution-sheet-adjusted-undo", hidden) !== null;
    expect(undoAvailable()).toBe(true);
    for (const close of ["value", "outside"] as const) {
      fireEvent.press(screen.getByTestId("execution-sheet-order-value", hidden));
      expect(screen.getByTestId("execution-sheet-order-control", hidden)).toBeTruthy();
      fireEvent.press(screen.getByTestId(close === "value" ? "execution-sheet-order-value" : "execution-sheet-order-panel-outside", hidden));
      expect(screen.queryByTestId("execution-sheet-order-control", hidden)).toBeNull();
      expect(undoAvailable()).toBe(true);
    }
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    expect([1, 2, 3].map((row) => cellValue(row))).toEqual(["30 s", "45 s", "1 min"]);
  });

  it("PRE4-3.6/AC9 — croix inactive tant qu'un champ ± ou une surface est ouvert : l'appui range le champ sans retirer (T23) ; avec un panneau, la zone extérieure ferme sans appliquer (T7)", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
    fireEvent.press(screen.getByTestId("execution-sheet-beep-toggle"));
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove"));
    expect(rowCount()).toBe(3);
    expect(screen.queryByTestId("execution-sheet-beep-field")).toBeNull();
    expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
    openCell(3);
    fireEvent.press(screen.getByTestId("execution-sheet-cell-panel-outside", hidden));
    expect(rowCount()).toBe(3);
    expect(cellPanel()).toBeNull();
  });

  it("PRE4-3.6/AC9 — iOS : panneau de ligne ouvert, appui DIRECT sur la croix : le panneau se ferme, rien n'est retiré", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
    openCell(3);
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove", hidden));
    expect(cellPanel()).toBeNull();
    expect(rowCount()).toBe(3);
    expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
  });

  it("PRE4-3.6/AC9 — Android : Sélecteur de ligne ouvert en ligne, appui sur la croix : Sélecteur fermé, ligne conservée", () =>
    withPlatform("android", () => {
      renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
      openCell(3);
      expect(screen.getByTestId("execution-sheet-cell-wheel")).toBeTruthy();
      fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove"));
      expect(screen.queryByTestId("execution-sheet-cell-wheel")).toBeNull();
      expect(rowCount()).toBe(3);
      expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
    }));

  it("PRE4-3.6/AC9 — croix non active : un indice annonce qu'un appui ferme d'abord le champ ouvert ; aucun indice outil rangé", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
    expect(screen.getByTestId("execution-sheet-table-row-2-remove").props.accessibilityHint).toBeUndefined();
    fireEvent.press(screen.getByTestId("execution-sheet-beep-toggle"));
    expect(screen.getByTestId("execution-sheet-table-row-2-remove").props.accessibilityHint).toBe(
      "Ferme d’abord le champ ouvert, sans supprimer la série",
    );
  });

  it("PRE4-3.6/AC9 — T27 : `Annuler` ne range pas l'outil ouvert — champ ± (Bip) toujours ouvert après la restauration", () => {
    renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove"));
    fireEvent.press(screen.getByTestId("execution-sheet-beep-toggle"));
    expect(screen.getByTestId("execution-sheet-beep-field")).toBeTruthy();
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    expect(rowCount()).toBe(3);
    expect([1, 2, 3].map((row) => cellValue(row))).toEqual(["30 s", "45 s", "1 min"]);
    expect(screen.getByTestId("execution-sheet-beep-field")).toBeTruthy();
  });

  it("PRE4-3.6/AC9 — T27, Android : `Annuler` avec le Sélecteur d'une ligne ouvert en ligne : ligne restaurée, Sélecteur toujours ouvert sur sa ligne", () =>
    withPlatform("android", () => {
      renderSheet(variableSheet([[30, 10], [45, 20], [60, 30]]));
      fireEvent.press(screen.getByTestId("execution-sheet-table-row-2-remove"));
      openCell(2);
      expect(within(screen.getByTestId("execution-sheet-table-row-2-motion")).getByTestId("execution-sheet-cell-wheel")).toBeTruthy();
      fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
      expect(rowCount()).toBe(3);
      // La ligne « 1 min » (identité suivie) redevient la 3e ; son Sélecteur reste ouvert.
      expect(within(screen.getByTestId("execution-sheet-table-row-3-motion")).getByTestId("execution-sheet-cell-wheel")).toBeTruthy();
    }));

  it("PRE4-3.6/AC9 — croix indisponible à N = 1 : un retrait qui ramène N à 1 masque le tableau ; `Annuler` le restaure", () => {
    renderSheet(variableSheet([[30, 10], [45, 20]]));
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-1-remove"));
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    expect(screen.queryAllByTestId(/-remove$/)).toHaveLength(0);
    expect(valueOf("execution-sheet-series")).toBe("1 série");
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    expect(rowCount()).toBe(2);
    expect([cellValue(1), cellValue(2)]).toEqual(["30 s", "45 s"]);
  });

  it("PRE4-3.6/AC10 — la ligne `Séries` affiche `1 série` puis `3 séries` (lexique)", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 1, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
    expect(valueOf("execution-sheet-series")).toBe("1 série");
    tap("execution-sheet-series-increment");
    tap("execution-sheet-series-increment");
    expect(screen.getByTestId("execution-sheet-series-value").props.children).toBe("3 séries");
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
    // PRE-5 story 2.6 : plus de ± de Cible ; la roue ouverte puis ✕ laisse l'ancienne valeur.
    openCell(1);
    fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
    expect(cellValue(1)).toBe(formatPhraseDuration(5999));
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-1-pause-toggle"));
    expect(screen.getByTestId("execution-sheet-table-row-1-pause-increment").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-1-pause-toggle"));
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
    });
    view.unmount();

    const cancelled = renderSheetView(variableSheet([[null, 10], [45, 20]]));
    chooseCellTarget(2, 50);
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    expect(cancelled.onCancel).toHaveBeenCalledTimes(1);
    expect(cancelled.onApply).not.toHaveBeenCalled();
  });

  it("PRE4-3.6/AC13, PRE5-2.6/AC1 — contrôle structurel (style + hitSlop) des cibles tactiles de 36 : cellules, poignée, croix ; cellule annoncée par sa ligne et sa colonne, valeur à part ; son appui ouvre la roue. Preuve sur appareil : R-2.6-01 (hitSlop hors du parent, découpe `clip`)", () => {
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
    // Cellules 71 × 24 (Figma `9290:17953`) : 24 + 6 + 6 = 36 de haut.
    expect(extent(targetID(1))).toEqual({ drawn: [71, 24], touch: [71, 36] });
    expect(extent("execution-sheet-table-row-1-pause-toggle")).toEqual({ drawn: [71, 24], touch: [71, 36] });
    const cell = screen.getByTestId(targetID(2));
    expect(cell.props.accessibilityLabel).toBe("Série 2, Durée");
    expect(cell.props.accessibilityValue).toEqual({ text: "45 s" });
    expect(cell.props.accessibilityRole).toBe("button");
    const pause = screen.getByTestId("execution-sheet-table-row-2-pause-toggle");
    expect(pause.props.accessibilityLabel).toBe("Série 2, pause");
    expect(pause.props.accessibilityValue).toEqual({ text: "20 s" });
    expect(pause.props.accessibilityRole).toBe("button");
    measureRow(2);
    fireEvent.press(cell);
    expect(cellPanel()).not.toBeNull();
    expect(screen.getByTestId(targetID(2), hidden).props.accessibilityState).toMatchObject({ expanded: true });
    expect(screen.getByTestId("execution-sheet-table-row-1-remove", hidden).props.accessibilityLabel).toBe("Supprimer la série 1");
  });

  it("PRE4-3.6/AC13, PRE5-2.6/AC3 — cellule à l'échec ou hors bornes : aucun pas proposé (bouton) ; valeur « à l’échec » annoncée ; l'appui ouvre la roue ; champ ± de la Pause : actions « Fermer », focus VoiceOver au champ puis rendu à la cellule", () => {
    const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
    renderSheet(variableSheet([["FAILURE", 10], [5999, 20]]));
    const failure = screen.getByTestId(targetID(1));
    expect(failure.props.accessibilityActions).toBeUndefined();
    expect(failure.props.accessibilityRole).toBe("button");
    expect(failure.props.accessibilityValue).toEqual({ text: "à l’échec" });
    expect(screen.getByTestId(targetID(2)).props.accessibilityActions).toBeUndefined();
    fireEvent.press(screen.getByTestId("execution-sheet-table-row-1-pause-toggle"));
    const field = screen.getByTestId("execution-sheet-table-row-1-pause-field");
    expect(focus).toHaveBeenLastCalledWith(expect.anything(), "focus");
    expect(field.props.accessibilityActions).toEqual([{ name: "escape" }, { name: "magicTap" }, { name: "close", label: "Fermer" }]);
    focus.mockClear();
    fireEvent(field, "accessibilityAction", { nativeEvent: { actionName: "close" } });
    expect(screen.queryByTestId("execution-sheet-table-row-1-pause-field")).toBeNull();
    expect(focus).toHaveBeenCalledTimes(1);
    focus.mockRestore();
    measureRow(1);
    fireEvent.press(failure);
    expect(cellPanel()).not.toBeNull();
    expect(screen.getByTestId("duration-wheel-failure-option").props.accessibilityState).toMatchObject({ selected: true });
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
  const totalLine = () => screen.getByTestId("execution-sheet-row-total-line");
  const totalLabelText = () => within(totalLine()).getAllByText(/^Durée totale/u)[0]!.props.children as string;
  const readOnlyText = () => String(screen.getByTestId("execution-sheet-total-text").props.children);
  const sheetValidateDisabled = () => screen.getByTestId("execution-sheet-validate").props.accessibilityState?.disabled === true;
  const nativeChange = (column: "minutes" | "seconds", selection: number) =>
    fireEvent(screen.getByTestId(`duration-wheel-${column}`), "selectionChange", { nativeEvent: { selection } });
  /** Valeurs proposées par une colonne de la roue native (modificateur `tag` de chaque `SwiftUIText`). */
  const nativeValues = (column: "minutes" | "seconds") =>
    screen
      .getByTestId(`duration-wheel-${column}`)
      .findAll((node) => typeof node.type === "string" && Array.isArray(node.props.modifiers))
      .flatMap((node) => (node.props.modifiers as { $type: string; tag?: number }[]).filter((modifier) => modifier.$type === "tag"))
      .map((modifier) => modifier.tag);
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);
  /** Ordre des lignes Bip, Durée totale et Compte à rebours dans le corps (absentes omises). */
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

  it("PRE4-3.7/AC1 — forme de la ligne : modifiable (Durée identiques chiffrée), lecture seule (variables chiffrées, Répétitions avec Bip ≈), ≥ pour un mélange, aucune ligne sinon ; aucune composante ajoutée", () => {
    // Durée, `identiques`, Cible numérique, N libre : pastille modifiable. T = N × (d + p).
    let view = renderSheetView(ac4Exercise());
    expect(text("execution-sheet-total")).toBe(formatPhraseDuration(3 * (30 + 10)));
    expect(screen.getByTestId("execution-sheet-total").props.accessibilityRole).toBe("button");
    expect(totalLabelText()).toBe("Durée totale");
    view.unmount();

    // Durée en `variables`, Cibles toutes numériques : lecture seule, sans symbole. T = Σ(Ti + Pi).
    view = renderSheetView(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
    expect(readOnlyText()).toBe(formatPhraseDuration(30 + 10 + 45 + 20 + 60 + 30));
    expect(totalLabelText()).toBe("Durée totale");
    view.unmount();

    // Répétitions avec Bip, Cibles toutes numériques : lecture seule, ≈. T = Σ(Ri × b + Pi).
    view = renderSheetView(repetitionsWithBeep());
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
    expect(totalLabelText()).toBe("Durée totale ≈");
    expect(readOnlyText()).toBe(formatPhraseDuration(3 * (10 * 2 + 15)));
    view.unmount();
    view = renderSheetView(params({ mode: "REPETITIONS", series: variableRows([[12, 30], [10, 45]]), cadenceBeepIntervalSeconds: 2 }));
    expect(totalLabelText()).toBe("Durée totale ≈");
    expect(readOnlyText()).toBe(formatPhraseDuration(12 * 2 + 30 + 10 * 2 + 45));
    view.unmount();

    // Mélange calculable : lecture seule, montant précédé de ≥ (FR-13-03 : travail connu + toutes les Pauses).
    view = renderSheetView(mixedDuration());
    expect(readOnlyText()).toBe(lowerBound(30 + 45 + 10 + 20 + 30));
    expect(readOnlyText()).toBe("≥ 2 min 15 s");
    expect(totalLabelText()).toBe("Durée totale");
    // Aucune nouvelle composante : la ligne ne porte que son libellé et sa valeur, rien de touchable.
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
    expect(within(screen.getByTestId("execution-sheet-row-total")).queryAllByRole("button")).toHaveLength(0);
    expect(within(totalLine()).getAllByText(/./u)).toHaveLength(2);
    view.unmount();
    // Répétitions avec Bip et mélange : ≥ prime sur ≈ (P25).
    view = renderSheetView(variableParameters({ mode: "REPETITIONS", rows: [[12, 30], ["FAILURE", 45]], cadenceBeepIntervalSeconds: 2 }));
    expect(readOnlyText()).toBe(lowerBound(12 * 2 + 30 + 45));
    expect(totalLabelText()).toBe("Durée totale");
    view.unmount();

    // Aucune ligne : Répétitions sans Bip, tout à l'échec (Durée ou Répétitions avec Bip), `identiques` à l'échec.
    for (const parent of [
      params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 0, workPhases: [] } }),
      variableParameters({ rows: [["FAILURE", 10], ["FAILURE", 20]] }),
      { ...allFailureParameters(3, 15, { cadenceBeepIntervalSeconds: 2 }), countdownSeconds: 10, endSeconds: 5 },
      durationParameters("FAILURE", 3, 10),
    ]) {
      view = renderSheetView(parent);
      expect(screen.queryByTestId("execution-sheet-row-total")).toBeNull();
      expect(screen.queryAllByText(/^Durée totale/u)).toHaveLength(0);
      expect(bodyRowOrder()).toEqual(["beep", "countdown"]);
      view.unmount();
    }
  });

  it("PRE4-3.7/AC2 — recalcul aussitôt (Pause, N, côtés, Mode, Bip, Cible) ; Cible `UNSET` : ni ligne ni montant, ✓ indisponible ; ligne retirée, Bip juste avant Compte à rebours", () => {
    const view = renderSheetView(ac4Exercise());
    expect(text("execution-sheet-total")).toBe(formatPhraseDuration(3 * (30 + 10)));
    tap("execution-sheet-pause-increment");
    expect(text("execution-sheet-total")).toBe(formatPhraseDuration(3 * (30 + 11)));
    tap("execution-sheet-series-increment");
    expect(text("execution-sheet-total")).toBe(formatPhraseDuration(4 * (30 + 11)));
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    fireEvent.press(within(screen.getByTestId("execution-sheet-side-control")).getByText("Droite puis gauche"));
    expect(valueOf("execution-sheet-side-recovery")).toBe("10 s");
    // Un côté après l'autre : 2 N (d + p) + PC.
    expect(text("execution-sheet-total")).toBe(formatPhraseDuration(2 * 4 * (30 + 11) + 10));
    // Mode Répétitions : la Cible numérique de Durée devient `—` (UNSET) — ni ligne ni montant.
    chooseMode("Répétitions");
    expect(screen.queryByTestId("execution-sheet-row-total")).toBeNull();
    expect(screen.queryAllByText(/^Durée totale/u)).toHaveLength(0);
    expect(screen.queryAllByText("0 s")).toHaveLength(0);
    expect(sheetValidateDisabled()).toBe(true);
    expect(bodyRowOrder()).toEqual(["beep", "countdown"]);
    // Retour en Durée : Cible restaurée, total recalculé, ligne de retour entre Bip et Compte à rebours.
    chooseMode("Durée");
    expect(text("execution-sheet-total")).toBe(formatPhraseDuration(2 * 4 * (30 + 11) + 10));
    expect(bodyRowOrder()).toEqual(["beep", "total", "countdown"]);
    view.unmount();

    // Bip : Répétitions sans Bip → aucune ligne ; Bip 2 s → ≈ N × (R × b + p).
    const reps = renderSheetView(params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
    expect(screen.queryByTestId("execution-sheet-row-total")).toBeNull();
    tap("execution-sheet-beep-increment");
    tap("execution-sheet-beep-increment");
    expect(totalLabelText()).toBe("Durée totale ≈");
    expect(readOnlyText()).toBe(formatPhraseDuration(3 * (10 * 2 + 15)));
    reps.unmount();

    // Cible : un mélange se recalcule quand une Cible numérique change (30 → 31 s).
    const mixed = renderSheetView(mixedDuration());
    chooseCellTarget(1, 31);
    expect(readOnlyText()).toBe(lowerBound(31 + 45 + 10 + 20 + 30));
    mixed.unmount();

    // Cible `UNSET` dans un tableau : aucune ligne, aucun montant, ✓ indisponible (H10, NFR-06).
    renderSheet(variableParameters({ rows: [[30, 10], ["UNSET", 20], [45, 30]] }));
    expect(screen.queryByTestId("execution-sheet-row-total")).toBeNull();
    expect(screen.queryAllByText(/^≥|^Durée totale/u)).toHaveLength(0);
    expect(sheetValidateDisabled()).toBe(true);
    expect(bodyRowOrder()).toEqual(["beep", "countdown"]);
  });

  it("PRE4-3.7/AC3 — échec en `variables`, Régime `variables` ou Mode Répétitions : toucher la ligne n'ouvre aucune roulette ; échec en `identiques` : aucune ligne", () => {
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
    renderSheet(durationParameters("FAILURE", 3, 10));
    expect(screen.queryByTestId("execution-sheet-row-total")).toBeNull();
  });

  // Présentation du panneau (Q41) prouvée ici et, plus largement (réserve sous le groupe,
  // aucune animation de hauteur), par « PRE4-Q41 — iOS : roue de la Durée totale dans un
  // panneau sans flèche sous le champ… ».
  it("PRE4-3.7/AC4 — iOS : roulette distincte dans le panneau sans flèche sous le champ, aligné à droite, ouverte sur le total courant ; bornes T(1) = 40 s à T(99) = 66 min à la seconde ; aucune option échec ; ✕ et toucher extérieur ferment sans appliquer", () =>
    withPlatform("ios", () => {
      renderSheet(ac4Exercise());
      // PRE-5 story 2.4 (AD-28) : ligne à y = 50 dans le cadre Cadence et durée, à y = 306.
      layoutFrames({ execution: [0, 98], series: [106, 132], sides: [246, 52], cadence: [306, 194] });
      layoutOf("execution-sheet-row-total", 50, 42);
      fireEvent.press(screen.getByTestId("execution-sheet-total"));
      const panel = screen.getByTestId("execution-sheet-total-panel");
      // Juste sous la ligne (306 + 50 + 42 + 4), aligné à droite (contour et marge du cadre, 13), sans bord gauche imposé.
      expect(StyleSheet.flatten(panel.props.style)).toMatchObject({ position: "absolute", top: 306 + 50 + 42 + 4, right: 13 });
      expect(StyleSheet.flatten(panel.props.style).left).toBeUndefined();
      expect(within(panel).getByTestId("execution-sheet-total-wheel")).toBeTruthy();
      // Distincte du Sélecteur de cible : ni option échec, ni panneau de la Cible ; aucun Popover ni Modal ajouté.
      expect(screen.queryByTestId("duration-wheel-failure-option")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-target-panel")).toBeNull();
      expect(panel.findAllByType(Popover)).toHaveLength(0);
      expect(screen.UNSAFE_root.findAllByType(Modal)).toHaveLength(1);
      // Ouverture sur T(3) = 3 × 40 = 120 s (02:00).
      expect(screen.getByTestId("duration-wheel-minutes").props.selection).toBe(2);
      expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(0);
      // Bornes : T(1) = 1 × (30 + 10) = 40 s ; T(99) = 99 × 40 = 3 960 s = 66 min.
      const t1 = 1 * (30 + 10);
      const t99 = 99 * (30 + 10);
      expect(nativeValues("minutes")).toEqual(range(0, t99 / 60));
      expect(nativeValues("seconds")).toEqual(range(0, 59));
      nativeChange("minutes", 0);
      expect(nativeValues("seconds")).toEqual([0, ...range(t1, 59)]);
      nativeChange("minutes", t99 / 60);
      expect(nativeValues("seconds")).toEqual([0]);
      expect(formatPhraseDuration(t99)).toBe("66 min");
      // Sous T(1) (`00:00`) : ✓ indisponible, sans effet.
      nativeChange("minutes", 0);
      nativeChange("seconds", 0);
      expect(screen.getByTestId("duration-wheel-validate").props.accessibilityState).toMatchObject({ disabled: true });
      fireEvent.press(screen.getByTestId("duration-wheel-validate"));
      expect(screen.getByTestId("execution-sheet-total-panel")).toBeTruthy();
      // ✕ : fermeture sans appliquer, valeur d'avant ouverture.
      fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
      expect(screen.queryByTestId("execution-sheet-total-panel")).toBeNull();
      expect(text("execution-sheet-total")).toBe(formatPhraseDuration(3 * 40));
      expect(valueOf("execution-sheet-series")).toBe("3 séries");
      // Toucher hors du panneau : fermé sans appliquer la valeur tournée.
      fireEvent.press(screen.getByTestId("execution-sheet-total"));
      nativeChange("minutes", 5);
      fireEvent.press(screen.getByTestId("execution-sheet-total-panel-outside", { includeHiddenElements: true }));
      expect(screen.queryByTestId("execution-sheet-total-panel")).toBeNull();
      expect(text("execution-sheet-total")).toBe(formatPhraseDuration(3 * 40));
      expect(valueOf("execution-sheet-series")).toBe("3 séries");
    }));

  for (const os of ["android", "web"] as const) {
    it(`PRE4-3.7/AC4 — ${os} : roulette en ligne dans le cadre de sélection de la ligne, sans option échec ; ✕ ferme sans appliquer`, () =>
      withPlatform(os, () => {
        renderSheet(ac4Exercise());
        fireEvent.press(screen.getByTestId("execution-sheet-total"));
        expect(within(screen.getByTestId("execution-sheet-row-total")).getByTestId("execution-sheet-total-wheel")).toBeTruthy();
        expect(screen.queryByTestId("execution-sheet-total-panel")).toBeNull();
        expect(screen.queryByTestId("duration-wheel-failure-option")).toBeNull();
        fireEvent.press(totalWheel().getByTestId("duration-wheel-cancel"));
        expect(screen.queryByTestId("execution-sheet-total-wheel")).toBeNull();
        expect(text("execution-sheet-total")).toBe(formatPhraseDuration(3 * 40));
      }));
  }

  it("PRE4-3.7/AC4 — iOS : T(1) = 70 s (d = 60 s, p = 10 s) : minutes 01..99 sans 00, secondes 10..59 à 1 min ; T(99) = 6 930 s > 5 999 : borne 99:59 ; ouverture exacte sur 03:30", () =>
    withPlatform("ios", () => {
      renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(60), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
      expect(99 * (60 + 10)).toBeGreaterThan(5999);
      fireEvent.press(screen.getByTestId("execution-sheet-total"));
      expect(screen.getByTestId("duration-wheel-minutes").props.selection).toBe(Math.floor((3 * 70) / 60));
      expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe((3 * 70) % 60);
      expect(nativeValues("minutes")).toEqual(range(1, 99));
      nativeChange("minutes", 1);
      expect(nativeValues("seconds")).toEqual(range(70 - 60, 59));
      nativeChange("minutes", 99);
      expect(nativeValues("seconds")).toEqual(range(0, 59));
      // ✓ sur 1:10 = T(1) : N = 1, aucun message.
      nativeChange("minutes", 1);
      nativeChange("seconds", 10);
      fireEvent.press(screen.getByTestId("duration-wheel-validate"));
      expect(valueOf("execution-sheet-series")).toBe("1 série");
      expect(text("execution-sheet-total")).toBe(formatPhraseDuration(70));
      expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
    }));

  it("PRE4-3.7/AC4 — iOS : T(99) > 5 999 s (d = 95 s, p = 10 s) : minutes jusqu'à 99, secondes 00..59 à 99 min, ouverture exacte sur 05:15 ; total courant > 5 999 s ou T(1) > 5 999 s : aucune roue, lecture seule « non modifiable »", () =>
    withPlatform("ios", () => {
      let view = renderSheetView(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(95), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
      fireEvent.press(screen.getByTestId("execution-sheet-total"));
      // Ouverture sur 3 × (95 + 10) = 315 s = 05:15.
      expect(screen.getByTestId("duration-wheel-minutes").props.selection).toBe(5);
      expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(15);
      expect(nativeValues("minutes")).toEqual(range(1, 99));
      nativeChange("minutes", 99);
      expect(nativeValues("seconds")).toEqual(range(0, 59));
      view.unmount();

      // Total courant 90 × (60 + 10) = 6 300 s > 5 999 : pas de roue ; T(1) = 70 s n'y change rien.
      view = renderSheetView(params({ series: { kind: "UNIFORM", count: 90, target: numberTarget(60), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
      expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
      expect(readOnlyText()).toBe(formatPhraseDuration(90 * 70));
      expect(totalLine().props.accessibilityLabel).toBe(`Durée totale, ${formatPhraseDuration(90 * 70)}, non modifiable`);
      fireEvent.press(screen.getByTestId("execution-sheet-total-text"));
      expect(screen.queryByTestId("execution-sheet-total-panel")).toBeNull();
      view.unmount();

      // T(1) = 2 × (3 535 + 300) + 300 = 7 970 s > 5 999 (bilatéral, un côté après l'autre, N = 1) : pas de roue.
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

  it("PRE4-3.7/AC5 — Tv = 160 s puis ✓ : N = 4, T(4) = 160 s, aucun message, Cible 30 s ; ✓ de la Feuille applique à l'Éditeur", () =>
    withPlatform("ios", () => {
      const { onApply } = renderSheet(ac4Exercise());
      fireEvent.press(screen.getByTestId("execution-sheet-total"));
      nativeChange("minutes", 2);
      nativeChange("seconds", 40);
      fireEvent.press(screen.getByTestId("duration-wheel-validate"));
      // arrondi(160 / (30 + 10)) = 4 ; T(4) = 4 × 40 = 160 s.
      expect(valueOf("execution-sheet-series")).toBe("4 séries");
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
      const adjustTo180 = () => {
        fireEvent.press(screen.getByTestId("execution-sheet-total"));
        nativeChange("minutes", 3);
        nativeChange("seconds", 0);
        fireEvent.press(screen.getByTestId("duration-wheel-validate"));
      };
      adjustTo180();
      // Candidats N = 4 (160 s) et N = 5 (200 s), à 20 s chacun de 180 s : N = 5 retenu.
      expect(Math.abs(4 * 40 - 180)).toBe(Math.abs(5 * 40 - 180));
      expect(valueOf("execution-sheet-series")).toBe("5 séries");
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
      expect(valueOf("execution-sheet-series")).toBe("3 séries");
      expect(text("execution-sheet-total")).toBe(formatPhraseDuration(3 * 40));
      // Toucher le reste du message : fermé, ajustement conservé.
      adjustTo180();
      fireEvent.press(screen.getByTestId("execution-sheet-adjusted"));
      expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
      expect(valueOf("execution-sheet-series")).toBe("5 séries");
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
    expect(spoken()).toBe(`Durée totale, estimation, ${formatPhraseDuration(3 * (10 * 2 + 15))}, non modifiable`);
    expect(spoken()).not.toMatch(/[≈≥—]/u);
    // La valeur n'est pas atténuée : même couleur que le libellé, aucune opacité.
    const value = StyleSheet.flatten(screen.getByTestId("execution-sheet-total-text").props.style);
    const label = StyleSheet.flatten(within(totalLine()).getByText("Durée totale ≈").props.style);
    expect(value.color).toBe(label.color);
    expect(value.opacity).toBeUndefined();
    view.unmount();

    // ≥ : mélange calculable.
    view = renderSheetView(mixedDuration());
    expect(spoken()).toBe(`Durée totale, total prévisionnel partiel, ${formatPhraseDuration(30 + 45 + 10 + 20 + 30)}, non modifiable`);
    expect(spoken()).not.toMatch(/[≈≥—]/u);
    view.unmount();

    // Lecture seule exacte (`variables` chiffrées) : sans nature, « non modifiable ».
    view = renderSheetView(params({ series: variableRows([[30, 10], [45, 20]]) }));
    expect(spoken()).toBe(`Durée totale, ${formatPhraseDuration(30 + 10 + 45 + 20)}, non modifiable`);
    view.unmount();

    // Saisie invalide (Cible 3536 s, D-430) : « — » affiché (PRE4-2.1/AC9), annoncé par la clé dédiée, jamais par le tiret.
    expect(sheetText.totalInvalidSpoken).toBe("montant indisponible tant qu’une valeur est invalide");
    view = renderSheetView(durationParameters(3536, 3, 10));
    expect(readOnlyText()).toBe("—");
    expect(spoken()).toBe(`Durée totale, ${sheetText.totalInvalidSpoken}`);
    expect(spoken()).not.toMatch(/—/u);
    view.unmount();
    // Saisie invalide avec une nature connue : elle est gardée (≈ : Bip historique 11, hors bornes ;
    // ≥ : mélange avec une Cible hors bornes, 3536 s depuis D-430).
    view = renderSheetView({ ...repetitionsWithBeep(), cadenceBeepIntervalSeconds: 11 });
    expect(readOnlyText()).toBe("—");
    expect(spoken()).toBe(`Durée totale, estimation, ${sheetText.totalInvalidSpoken}`);
    view.unmount();
    view = renderSheetView(variableParameters({ rows: [[3536, 10], [45, 20], ["FAILURE", 30]] }));
    expect(readOnlyText()).toBe("—");
    expect(spoken()).toBe(`Durée totale, total prévisionnel partiel, ${sheetText.totalInvalidSpoken}`);
    view.unmount();

    // Ligne modifiable : annonce de la pastille, inchangée ; la ligne n'est pas regroupée.
    renderSheet(ac4Exercise());
    expect(totalLine().props.accessible).toBeUndefined();
    expect(screen.getByTestId("execution-sheet-total").props.accessibilityLabel).toBe(
      `${sheetText.totalEditAccessibilityLabel}, ${formatPhraseDuration(3 * 40)}`,
    );
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
      // Répétitions avec Bip : 3 × (10 × 2 + 15) = 105 s → « 1 min 45 s » (≈ dans le libellé).
      { parent: repetitionsWithBeep(), seconds: 105, prefix: "", editable: false },
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
  /** Mise en page simulée d'une ligne du tableau et de sa cellule de Cible (le panneau attend ces mesures). */
  const measureTableRow = (row: number) => {
    fireEvent(get(`execution-sheet-table-row-${row}-motion`), "layout", {
      nativeEvent: { layout: { x: -4, y: 32 + 36 * (row - 1), width: 336, height: 36 } },
    });
    fireEvent(get(`execution-sheet-table-row-${row}-target-cell`), "layout", {
      nativeEvent: { layout: { x: 58, y: 6, width: 71, height: 24 } },
    });
  };

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
    expect(announced()).toEqual(["Type de série", "Variables", true]);
    // Le chevron intérieur de Variables est nommé par son action.
    fireEvent.press(screen.getByLabelText("Masquer le tableau des séries"));
    expect(announced()).toEqual(["Type de série", "Variables", true]);
    expect(screen.getByLabelText("Afficher le tableau des séries")).toBeTruthy();
  });

  it("PRE4-3.8/AC2 — valeur « — » annoncée « aucune valeur », jamais un tiret : Changement de côté, Cible commune, cellule de Cible ; Mode non renseigné sans option sélectionnée", () => {
    const view = renderSheetView(creation());
    // PRE-5 story 2.4 (AC3) : le Mode non renseigné n'affiche plus « — » : aucune option
    // du segmenté n'est sélectionnée, chaque option est annoncée par son nom.
    expect(screen.getByTestId(MODE_CONTROL).props.accessibilityLabel).toBe("Mode");
    expect(["REPETITIONS", "DURATION"].map((mode) => screen.getByTestId(`${MODE_CONTROL}-${mode}`).props.accessibilityState.selected)).toEqual([false, false]);
    expect(screen.getByTestId("execution-sheet-side-value").props.accessibilityLabel).toBe("Changement de côté, aucune valeur");
    chooseMode("Durée");
    expect(text("execution-sheet-target-value")).toBe("—");
    expect(screen.getByTestId("execution-sheet-target-value").props.accessibilityLabel).toBe("Durée d’une série, aucune valeur");
    expect(screen.getByTestId("execution-sheet-target-value").props.accessibilityHint).toBe("Valeur à renseigner");
    view.unmount();
    const repetitions = renderSheetView(params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: unsetTarget(), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
    expect(text("execution-sheet-target-value")).toBe("—");
    expect(screen.getByTestId("execution-sheet-target-value").props.accessibilityLabel).toBe("Nombre de répétitions, aucune valeur");
    repetitions.unmount();
    renderSheet(params({ series: variableRows([[30, 10], [null, 20]]) }));
    const cell = screen.getByTestId("execution-sheet-table-row-2-target");
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("—");
    expect(cell.props.accessibilityLabel).toBe("Série 2, Durée");
    expect(cell.props.accessibilityValue).toEqual({ text: "aucune valeur" });
    expect(cell.props.accessibilityHint).toBe("Valeur à renseigner");
    expect(spokenTexts().filter(dashAsValue)).toEqual([]);
  });

  it("PRE4-3.8/AC2 — `Bip de cadence` : nom, valeur `Aucun` ou intervalle en secondes, actions augmenter et diminuer, limites annoncées", () => {
    renderSheet(params({ cadenceBeepIntervalSeconds: 0 }));
    expect(screen.getByTestId("execution-sheet-beep-toggle").props.accessibilityLabel).toBe("Bip de cadence, Aucun");
    openExecutionSheetField("execution-sheet-beep");
    const beep = () => screen.getByTestId("execution-sheet-beep");
    const act11y = (actionName: "increment" | "decrement") => fireEvent(beep(), "accessibilityAction", { nativeEvent: { actionName } });
    expect(beep().props.accessibilityRole).toBe("adjustable");
    expect(beep().props.accessibilityLabel).toBe("Bip de cadence, secondes");
    expect(beep().props.accessibilityActions).toEqual([{ name: "increment" }, { name: "decrement" }]);
    expect(beep().props.accessibilityValue).toEqual({ min: 0, max: 10, now: 0, text: "Aucun, minimum atteint" });
    act11y("increment");
    expect(beep().props.accessibilityValue).toEqual({ min: 0, max: 10, now: 1, text: "1 s" });
    for (let step = 0; step < 9; step += 1) act11y("increment");
    expect(beep().props.accessibilityValue).toEqual({ min: 0, max: 10, now: 10, text: "10 s, maximum atteint" });
    // Augmenter à la borne : sans effet, la limite reste annoncée.
    act11y("increment");
    expect(beep().props.accessibilityValue).toMatchObject({ now: 10, text: "10 s, maximum atteint" });
    act11y("decrement");
    expect(beep().props.accessibilityValue).toMatchObject({ now: 9, text: "9 s" });
  });

  it("PRE4-3.8/AC2, PRE5-2.6/AC3 — cellules sans ± : valeur seule annoncée (1 s, 3535 s, anciennes 4000 s et 5999 s, à l’échec) ; limites de la Pause annoncées dans son champ ± ouvert, seulement DANS les bornes (0 s, 300 s)", () => {
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
    expect(spoken("execution-sheet-table-row-2-pause-toggle")).toBe(formatPhraseDuration(300));
    const openPause = (row: number) => {
      fireEvent.press(screen.getByTestId(`execution-sheet-table-row-${row}-pause-toggle`));
      return spoken(`execution-sheet-table-row-${row}-pause`);
    };
    expect(openPause(1)).toBe("10 s");
    expect(openPause(2)).toBe(`${formatPhraseDuration(300)}, maximum atteint`);
    expect(openPause(3)).toBe("0 s, minimum atteint");
  });

  it("PRE4-3.8/AC3 — option échec (cellule variable, PRE-5 story 2.4) annoncée sélectionnée ou non (état natif, pas le seul grisé) ; Cible à l’échec annoncée sur la cellule", () =>
    withPlatform("ios", () => {
      renderSheet(params({ series: variableRows([[30, 10], [45, 20]]) }));
      measureTableRow(1);
      fireEvent.press(get("execution-sheet-table-row-1-target"));
      const option = () => screen.getByTestId("duration-wheel-failure-option");
      expect(option().props.accessibilityLabel).toBe("Aucune durée, à l’échec");
      expect(option().props.accessibilityState).toMatchObject({ selected: false });
      fireEvent.press(option());
      expect(option().props.accessibilityState).toMatchObject({ selected: true });
      fireEvent.press(screen.getByTestId("duration-wheel-validate"));
      expect(get("execution-sheet-table-row-1-target").props.accessibilityValue).toEqual({ text: "à l’échec" });
    }));

  it("PRE4-3.8/AC3 — valeur et unité dans le Sélecteur Durée : colonnes nommées « Minutes » et « Secondes »", () =>
    withPlatform("ios", () => {
      renderSheet(params());
      fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
      const labelOf = (testID: string) =>
        (screen.getByTestId(testID).props.modifiers as { $type: string; label?: string }[]).find(
          (modifier) => modifier.$type === "accessibilityLabel",
        )?.label;
      expect(labelOf("duration-wheel-minutes")).toBe("Minutes");
      expect(labelOf("duration-wheel-seconds")).toBe("Secondes");
    }));

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
          },
        }),
      ];
      const collected: string[] = [];
      for (const state of states) {
        const view = renderSheetView(state);
        collected.push(...spokenTexts());
        // Chaque surface ouverte une fois : panneau de la Cible commune, panneau du Côté, champ ± du Bip.
        if (query("execution-sheet-target-value")) {
          fireEvent.press(get("execution-sheet-target-value"));
          collected.push(...spokenTexts());
          fireEvent.press(get("execution-sheet-target-panel-outside"));
        }
        fireEvent.press(get("execution-sheet-side-value"));
        collected.push(...spokenTexts());
        fireEvent.press(get("execution-sheet-side-panel-outside"));
        openExecutionSheetField("execution-sheet-beep");
        collected.push(...spokenTexts());
        view.unmount();
      }
      expect(collected).toContain("Nombre de répétitions, aucune valeur");
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

  it("PRE4-3.8/AC5 — iOS : roue de la Cible commune ouverte, ✓ puis ✕ de la Feuille et retour système : panneau fermé sans appliquer, Feuille ni validée ni abandonnée", () =>
    withPlatform("ios", () => {
      const { onApply, onCancel } = renderSheet(params());
      fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
      fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 2 } });
      pressHeader("execution-sheet-validate");
      expect(onApply).not.toHaveBeenCalled();
      expect(query("execution-sheet-target-panel")).toBeNull();
      fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
      pressHeader("execution-sheet-cancel");
      expect(onCancel).not.toHaveBeenCalled();
      expect(query("execution-sheet-target-panel")).toBeNull();
      fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
      fireEvent(screen.getByTestId("execution-sheet-modal"), "requestClose");
      expect(onCancel).not.toHaveBeenCalled();
      expect(query("execution-sheet-target-panel")).toBeNull();
      // Surface fermée : ✓ applique le Brouillon, sans la valeur tournée et non validée.
      validate();
      expect(applied(onApply).series).toMatchObject({ target: numberTarget(90) });
    }));

  it("PRE4-3.8/AC5 — ✓ grisé (Brouillon invalide) avec une surface ouverte : l'appui ferme la surface ; état d'accessibilité cohérent ; surface fermée, ✓ de nouveau indisponible", () =>
    withPlatform("ios", () => {
      const { onApply } = renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: unsetTarget(), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
      const validateButton = () => get("execution-sheet-validate");
      expect(validateButton().props.accessibilityState).toMatchObject({ disabled: true });
      fireEvent.press(get("execution-sheet-side-value"));
      expect(query("execution-sheet-side-panel")).not.toBeNull();
      // Activable pour fermer la surface ; le libellé garde l'indisponibilité de la validation.
      expect(validateButton().props.accessibilityState).toMatchObject({ disabled: false });
      expect(validateButton().props.accessibilityLabel).toBe("Valider les paramètres, indisponible tant qu’une valeur est invalide");
      pressHeader("execution-sheet-validate");
      expect(query("execution-sheet-side-panel")).toBeNull();
      expect(onApply).not.toHaveBeenCalled();
      expect(validateButton().props.accessibilityState).toMatchObject({ disabled: true });
      pressHeader("execution-sheet-validate");
      expect(onApply).not.toHaveBeenCalled();
    }));

  it("PRE4-3.8/AC5 — iOS : panneau du Côté, roue de la Durée totale ou d'une cellule ouverts : ✓ de la Feuille absorbé ; champ ± ouvert : ✓ applique dans le même geste (T19) ; le Mode n'ouvre plus de popover (PRE-5 story 2.4)", () =>
    withPlatform("ios", () => {
      const view = renderSheetView(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] } }));
      for (const field of ["execution-sheet-side-value", "execution-sheet-total"]) {
        fireEvent.press(get(field));
        pressHeader("execution-sheet-validate");
        expect({ field, applied: view.onApply.mock.calls.length }).toEqual({ field, applied: 0 });
      }
      expect(query("execution-sheet-side-panel")).toBeNull();
      expect(query("execution-sheet-total-panel")).toBeNull();
      openExecutionSheetField("execution-sheet-pause");
      pressHeader("execution-sheet-validate");
      expect(view.onApply).toHaveBeenCalledTimes(1);
      view.unmount();
      const table = renderSheetView(params({ series: variableRows([[30, 10], [45, 20]]) }));
      measureTableRow(1);
      fireEvent.press(get("execution-sheet-table-row-1-target"));
      expect(query("execution-sheet-cell-panel")).not.toBeNull();
      pressHeader("execution-sheet-validate");
      expect(table.onApply).not.toHaveBeenCalled();
      expect(query("execution-sheet-cell-panel")).toBeNull();
    }));

  it("PRE4-3.8/AC5 — Android : roue en ligne ou segmenté ouvert, ✓ et ✕ de la Feuille ne font que le fermer ; pendant le cadre D-4 d'un choix déjà appliqué, ✓ applique", () =>
    withPlatform("android", () => {
      jest.useFakeTimers();
      try {
        const { onApply, onCancel } = renderSheet(params());
        fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
        expect(screen.getByTestId("execution-sheet-target-wheel")).toBeTruthy();
        pressHeader("execution-sheet-validate");
        expect(onApply).not.toHaveBeenCalled();
        expect(screen.queryByTestId("execution-sheet-target-wheel")).toBeNull();
        fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
        pressHeader("execution-sheet-cancel");
        expect(onCancel).not.toHaveBeenCalled();
        expect(screen.queryByTestId("execution-sheet-target-wheel")).toBeNull();
        fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
        pressHeader("execution-sheet-cancel");
        expect(onCancel).not.toHaveBeenCalled();
        act(() => {
          jest.advanceTimersByTime(SELECTOR_SETTLE_MS + 1000);
        });
        fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
        fireEvent.press(screen.getByTestId("execution-sheet-side-control-RIGHT_LEFT"));
        pressHeader("execution-sheet-validate");
        expect(applied(onApply).sideMode).toBe("RIGHT_LEFT");
      } finally {
        jest.useRealTimers();
      }
    }));

  it("PRE4-3.8/AC6 — règles PRE-3 supersédées absentes (iOS), chaque contrôle d'absence ayant son contrôle positif : ni interrupteur, ni stepper permanent hors tableau, ni segmenté intégré, ni message nommant la Série, ni retrait x52 ; PRE-5 story 2.6 : ni ± permanents des cellules (Q44 remplacé), ± de la Pause à l'appui de sa cellule", async () => {
    // Contrôle positif du nom d'hôte de l'interrupteur natif.
    const switchView = render(<Switch value={false} />);
    expect(screen.UNSAFE_root.findAll((node) => hostNamed(node, "RCTSwitch")).length).toBeGreaterThan(0);
    switchView.unmount();
    // Contrôle positif du message : le lexique le porte toujours, le motif le reconnaît.
    expect(strings.executionParameters.sheet.incompleteSeries.DURATION.replace("{n}", "2")).toMatch(/Série \d+ : renseignez/);
    // Contrôle positif des segmentés intégrés : en ligne sur Android (repli AD-7).
    await withPlatform("android", () => {
      const view = renderSheetView(params({ series: variableRows([[30, 10], [45, 20]]), sideMode: "RIGHT_LEFT", sideRecoverySeconds: 10 }));
      fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
      expect(within(screen.getByTestId("execution-sheet-row-side")).getByTestId("execution-sheet-side-control")).toBeTruthy();
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
      // Segmentés intégrés : aucun dans les lignes ; à l'ouverture, le même contrôle est dans le panneau.
      for (const [control, row] of [["side", "side"], ["order", "order"]] as const) {
        expect(within(get(`execution-sheet-row-${row}`)).queryByTestId(`execution-sheet-${control}-control`, hidden)).toBeNull();
        fireEvent.press(get(`execution-sheet-${control}-value`));
        expect(within(get(`execution-sheet-${control}-panel`)).getByTestId(`execution-sheet-${control}-control`, hidden)).toBeTruthy();
        fireEvent.press(get(`execution-sheet-${control}-panel-outside`));
      }
      // PRE-5 story 2.4 (AC3, AC7) : Mode et Type de série sont des segmentés `inline` dans
      // leur ligne (remplacement accepté du popover et du panneau du Régime).
      expect(within(get("execution-sheet-row-mode-line")).getByTestId(MODE_CONTROL, hidden)).toBeTruthy();
      expect(within(get("execution-sheet-row-series-type-line")).getByTestId(SERIES_TYPE, hidden)).toBeTruthy();
      expect(query("execution-sheet-regime-panel")).toBeNull();
      // Hors tableau : au repos, valeur seule ; les ± n'apparaissent qu'à l'appui.
      for (const field of ["series", "beep", "countdown", "end", "side-recovery"]) {
        expect(query(`execution-sheet-${field}-increment`)).toBeNull();
        openExecutionSheetField(`execution-sheet-${field}`);
        expect(get(`execution-sheet-${field}-increment`)).toBeTruthy();
        fireEvent.press(get("execution-sheet-body-outside"));
      }
      // PRE-5 story 2.6 (AD-27, FR-29) : plus de ± permanents dans les cellules ; la cellule
      // Pause ouvre le ± de cette seule cellule (contrôle positif).
      expect(query("execution-sheet-table-row-1-target-increment")).toBeNull();
      expect(query("execution-sheet-table-row-1-pause-decrement")).toBeNull();
      fireEvent.press(get("execution-sheet-table-row-1-pause-toggle"));
      expect(get("execution-sheet-table-row-1-pause-decrement")).toBeTruthy();
      expect(query("execution-sheet-table-row-1-target-increment")).toBeNull();
    });
  });

  it("PRE4-3.8/AC7 — texte agrandi : aucun texte de la Feuille ne plafonne ni ne réduit sa taille (maxFontSizeMultiplier, allowFontScaling faux, numberOfLines, adjustsFontSizeToFit), au repos et avec chaque panneau ou roue ouvert (Côté, Ordre, Durée, Répétitions, Durée totale, cellule) et un champ ±", () =>
    withPlatform("ios", () => {
      const texts = () => screen.UNSAFE_root.findAll((node) => hostNamed(node, "Text")).map((node) => node.props as Record<string, unknown>);
      const capped = (props: Record<string, unknown>) =>
        props.maxFontSizeMultiplier !== undefined ||
        props.allowFontScaling === false ||
        props.numberOfLines !== undefined ||
        props.adjustsFontSizeToFit === true;
      const seen: Record<string, unknown>[] = [];
      const opened: string[] = [];
      const withOpen = (trigger: string, panel: string) => {
        fireEvent.press(get(trigger));
        expect(query(panel)).not.toBeNull();
        opened.push(panel);
        seen.push(...texts());
        fireEvent.press(get(`${panel}-outside`));
      };
      // Durée, identiques, bilatéral, N = 3 : Durée, Durée totale, Côté, Ordre, champ ± (PRE-5
      // story 2.4 : plus de panneau du Régime ; Mode et Type de série toujours affichés).
      let view = renderSheetView(params({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 10, cadenceBeepIntervalSeconds: 2 }));
      seen.push(...texts());
      withOpen("execution-sheet-target-value", "execution-sheet-target-panel");
      withOpen("execution-sheet-total", "execution-sheet-total-panel");
      withOpen("execution-sheet-side-value", "execution-sheet-side-panel");
      withOpen("execution-sheet-order-value", "execution-sheet-order-panel");
      openExecutionSheetField("execution-sheet-beep");
      seen.push(...texts());
      view.unmount();
      // Répétitions : roue de la Cible commune.
      view = renderSheetView(params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
      withOpen("execution-sheet-target-value", "execution-sheet-target-panel");
      view.unmount();
      // Tableau : roue d'une cellule (avec l'option échec) ; résultat dérivé en lecture seule.
      renderSheet(params({ series: variableRows([[30, 10], [null, 20], [60, 30]]) }));
      seen.push(...texts());
      measureTableRow(1);
      withOpen("execution-sheet-table-row-1-target", "execution-sheet-cell-panel");
      expect(opened).toHaveLength(6);
      expect(seen.length).toBeGreaterThan(80);
      expect(seen.filter(capped)).toEqual([]);
    }));

  it("PRE4-3.8/AC7 — hauteurs : aucun texte de la Feuille sous une hauteur fixe, panneau du Côté et roue ouverts compris, hors les exceptions consignées (ligne du tableau, TABLE_ROW_HEIGHT, géométrie du glisser PRE-3 ; R-3.8-03)", () =>
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
      const inlineSegmented = [
        ":26",
        "execution-sheet-load-control:32",
        "execution-sheet-mode-control:32",
        "execution-sheet-series-type-control:32",
        "execution-sheet-stop-condition-control:32",
      ];
      const tableRows = [`execution-sheet-table-row-1:${TABLE_ROW_HEIGHT}`, `execution-sheet-table-row-2:${TABLE_ROW_HEIGHT}`];
      const atRest = [...inlineSegmented, ...tableRows];
      expect(fixedHeights()).toEqual(atRest);
      fireEvent.press(get("execution-sheet-side-value"));
      expect(fixedHeights()).toEqual(atRest);
      fireEvent.press(get("execution-sheet-side-panel-outside"));
      measureTableRow(1);
      fireEvent.press(get("execution-sheet-table-row-1-target"));
      expect(query("execution-sheet-cell-panel")).not.toBeNull();
      // Roue ouverte : seconde exception, l'option « Aucune durée, à l’échec » (story 3.4,
      // hauteur 30 du relevé `8452:13319`). Non modifiée : constat soumis à Hermann (R-3.8-03).
      expect(fixedHeights()).toEqual([":26", "duration-wheel-failure-option:30", ...inlineSegmented.slice(1), ...tableRows]);
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
  const FRAMES = ["execution", "series", "sides", "cadence"] as const;
  type Cell = number | "FAILURE" | null;
  const toTarget = (value: Cell): SeriesTarget =>
    value === "FAILURE" ? failureTarget() : value === null ? unsetTarget() : numberTarget(value);
  const variableSheet = (cells: Cell[], mode: "DURATION" | "REPETITIONS" = "DURATION") =>
    params({ mode, series: { kind: "VARIABLE", rows: cells.map((cell) => ({ target: toTarget(cell), pauseSeconds: 10, loadKg: 0 })) } });
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

  it("PRE5-2.4/AC1 — quatre cadres dans l'ordre Exécution ; Séries ; Côtés ; Cadence et durée, enfants directs de l'hôte des panneaux ; fond #EFF0F2, contour blanc de 1, rayon 12, espacés de 8 ; chaque ligne dans son cadre", () => {
    renderSheet(params({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 10, cadenceBeepIntervalSeconds: 2 }));
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
      series: ["row-series", "row-series-type", "variable-group", "row-target", "row-pause"],
      sides: ["row-side", "row-order", "row-side-recovery"],
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
    // Libellés de ligne Inter Regular 12 (PR-03), plus petits que les valeurs.
    expect(StyleSheet.flatten(screen.getByText("Condition d’arrêt").props.style)).toMatchObject({ fontSize: 12, fontWeight: "400" });
    expect(StyleSheet.flatten(screen.getByText("Nombre de séries").props.style)).toMatchObject({ fontSize: 12, fontWeight: "400" });
  });

  it("PRE5-2.4/AC2 — repère unique : le haut du panneau vaut y du cadre + y de la ligne + hauteur + 4, dans chaque cadre ; il suit un cadre qui se déplace ; panneau rendu dans l'hôte, hors des cadres", () =>
    withPlatform("ios", () => {
      renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 10, loadKg: 0, workPhases: [] }, sideMode: "RIGHT_LEFT", sideRecoverySeconds: 10 }));
      layoutFrames({ execution: [0, 98], series: [106, 230], sides: [344, 190], cadence: [542, 236] });
      layoutOf("execution-sheet-row-target", 100, 44);
      layoutOf("execution-sheet-row-order", 52, 44);
      layoutOf("execution-sheet-row-total", 52, 44);
      const topOf = (panelID: string) => StyleSheet.flatten(get(panelID).props.style).top as number;
      const notInFrame = (panelID: string) =>
        FRAMES.every((frame) => within(get(`execution-sheet-frame-${frame}`)).queryByTestId(panelID, hidden) === null);
      // Cadre Séries.
      fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
      expect(topOf("execution-sheet-target-panel")).toBe(106 + 100 + 44 + 4);
      expect(notInFrame("execution-sheet-target-panel")).toBe(true);
      // Le cadre se déplace (ligne apparue au-dessus) : le panneau suit, sans autre mesure.
      fireEvent(get("execution-sheet-frame-series"), "layout", { nativeEvent: { layout: { x: 0, y: 150, width: 330, height: 230 } } });
      expect(topOf("execution-sheet-target-panel")).toBe(150 + 100 + 44 + 4);
      fireEvent.press(get("execution-sheet-target-panel-outside"));
      // Cadre Côtés.
      fireEvent.press(screen.getByTestId("execution-sheet-order-value"));
      expect(topOf("execution-sheet-order-panel")).toBe(344 + 52 + 44 + 4);
      expect(notInFrame("execution-sheet-order-panel")).toBe(true);
      fireEvent.press(get("execution-sheet-order-panel-outside"));
      // Cadre Cadence et durée.
      fireEvent.press(screen.getByTestId("execution-sheet-total"));
      expect(topOf("execution-sheet-total-panel")).toBe(542 + 52 + 44 + 4);
      expect(within(get("execution-sheet-panel-host")).getByTestId("execution-sheet-total-panel", hidden)).toBeTruthy();
    }));

  it("PRE5-2.4/AC4, AC6 — identiques à la cible (Durée, 90 s) : Condition « À la cible » ; ligne « Durée d’une série » visible ; roue sans « À l’échec »", () =>
    withPlatform("ios", () => {
      renderSheet(params());
      expect(stopSelected()).toBe("TARGET");
      expect(["FAILURE", "TARGET"].map((value) => get(`${STOP_CONTROL}-${value}`).props.accessibilityLabel)).toEqual(["À l’échec", "À la cible"]);
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
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-target-value").props.style).backgroundColor).toBe("#FFF1F0");
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("PRE5-2.4/AC5 — variables homogènes : lecture seule, deux options, À la cible (30 s, 45 s) ou À l’échec (échec, échec) sélectionnée ; violet atténué à 45 %, texte blanc ; information non modifiable", () => {
    const view = renderSheetView(variableSheet([30, 45]));
    const control = get(STOP_CONTROL);
    expect(control.props.accessibilityRole).toBe("text");
    expect(control.props.accessibilityLabel).toBe("Condition d’arrêt, À la cible");
    expect(derivedOptions()).toEqual(["FAILURE", "TARGET"]);
    expect(query(`${STOP_CONTROL}-TARGET`)).toBeNull();
    expect(screen.UNSAFE_queryAllByProps({ accessibilityRole: "tab", accessibilityLabel: "À la cible" })).toHaveLength(0);
    expect(styleOf(STOP_CONTROL).opacity).toBe(0.45);
    expect(styleOf(`${STOP_CONTROL}-indicator`).backgroundColor).toBe("#5F60EE");
    expect(StyleSheet.flatten(within(control).getByText("À la cible", hidden).props.style).color).toBe("#FFFFFF");
    view.unmount();
    renderSheet(variableSheet(["FAILURE", "FAILURE"]));
    expect(get(STOP_CONTROL).props.accessibilityLabel).toBe("Condition d’arrêt, À l’échec");
    expect(derivedOptions()).toEqual(["FAILURE", "TARGET"]);
  });

  it("PRE5-2.4/AC5 — variables mixtes (30 s, échec) : une seule option « À la cible et à l’échec », même largeur totale ; recalculé à chaque cellule, les deux options reviennent quand le détail redevient homogène", () => {
    renderSheet(variableSheet([30, 45, null]));
    // Cellule vide non comptée : les deux séries renseignées sont à la cible.
    expect(get(STOP_CONTROL).props.accessibilityLabel).toBe("Condition d’arrêt, À la cible");
    // Roue de la cellule 1 (ligne et cellule mesurées) : choix « à l’échec », puis ✓.
    const cellWheel = () => {
      fireEvent(get("execution-sheet-table-row-1-motion"), "layout", { nativeEvent: { layout: { x: -4, y: 32, width: 336, height: 36 } } });
      fireEvent(get("execution-sheet-table-row-1-target-cell"), "layout", { nativeEvent: { layout: { x: 58, y: 6, width: 71, height: 24 } } });
      fireEvent.press(get("execution-sheet-table-row-1-target"));
    };
    cellWheel();
    fireEvent.press(screen.getByTestId("duration-wheel-failure-option"));
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    // Une série à l'échec, une à la cible → mixte.
    expect(get(STOP_CONTROL).props.accessibilityLabel).toBe("Condition d’arrêt, À la cible et à l’échec");
    expect(derivedOptions()).toEqual(["MIXED"]);
    expect(within(get(STOP_CONTROL)).getByText("À la cible et à l’échec", hidden)).toBeTruthy();
    expect(styleOf(STOP_CONTROL).width).toBe(220);
    // La cellule 1 revient à 30 s : détail homogène, toujours en Variables (N = 3) — deux
    // options en lecture seule, À la cible sélectionnée.
    cellWheel();
    fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 30 } });
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("30 s");
    expect(seriesTypeText()).toBe("Variables");
    expect(get(STOP_CONTROL).props.accessibilityRole).toBe("text");
    expect(get(STOP_CONTROL).props.accessibilityLabel).toBe("Condition d’arrêt, À la cible");
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

  it("PRE5-2.4/AC3, AC4, AC7 — avec des phases : Répétitions, À l’échec et Variables indisponibles, valeur réelle affichée (Durée, À la cible, Identiques)", () => {
    renderSheet(twoPhases());
    const option = (control: string, value: string) => get(`${control}-${value}`).props.accessibilityState;
    expect(option(MODE_CONTROL, "REPETITIONS")).toMatchObject({ disabled: true, selected: false });
    expect(option(MODE_CONTROL, "DURATION")).toMatchObject({ disabled: false, selected: true });
    expect(option(STOP_CONTROL, "FAILURE")).toMatchObject({ disabled: true, selected: false });
    expect(option(STOP_CONTROL, "TARGET")).toMatchObject({ disabled: false, selected: true });
    expect(option(SERIES_TYPE, "VARIABLE")).toMatchObject({ disabled: true, selected: false });
    expect(option(SERIES_TYPE, "UNIFORM")).toMatchObject({ disabled: false, selected: true });
    fireEvent.press(get(`${MODE_CONTROL}-REPETITIONS`));
    fireEvent.press(get(`${STOP_CONTROL}-FAILURE`));
    fireEvent.press(get(`${SERIES_TYPE}-VARIABLE`));
    expect([modeText(), stopSelected(), seriesTypeText()]).toEqual(["Durée", "TARGET", "Identiques"]);
  });

  it("PRE5-2.4/AC3 — Mode non renseigné : aucun segment sélectionné ; Condition « À la cible » ; choisir un Mode ferme le champ ± ouvert", () => {
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

  it("PRE5-2.4/AC9 (NR Δ38) — stepper « Nombre de séries » conservé : ligne « Nombre de séries », valeur au repos, ± à l'appui, nom accessible « Séries », largeur 137 ; le tableau variable suit N", () => {
    renderSheet(variableSheet([30, 45]));
    const row = get("execution-sheet-row-series");
    expect(within(row).getByText("Nombre de séries")).toBeTruthy();
    expect(query("execution-sheet-series-increment")).toBeNull();
    expect(get("execution-sheet-series-toggle").props.accessibilityLabel).toBe("Séries, 2 séries");
    openExecutionSheetField("execution-sheet-series");
    expect(get("execution-sheet-series").props.accessibilityLabel).toBe("Séries");
    expect(styleOf("execution-sheet-series").width).toBe(137);
    tap("execution-sheet-series-increment");
    expect(valueOf("execution-sheet-series")).toBe("3 séries");
    expect(get("execution-sheet-table-row-3")).toBeTruthy();
  });
});

/**
 * PRE-5 story 2.6 (AC2 à AC5 ; FR-29, FR-22, FR-4 ; AD-27, AD-28 ; UX-DR3) — tableau des
 * séries sans steppers de cellule, lignes de 36 : cellules à valeur seule ; la cellule Cible
 * ouvre la roue de sa ligne, la cellule Pause le ± de cette seule cellule (famille ±) ;
 * briques partagées (`sheetTable.tsx`). Jest ne prouve que l'arbre JS : la cible tactile de
 * 36 (AC1, R-2.6-01) et le rendu (R-2.6-02, R-2.6-03) relèvent de Hermann sur iPhone.
 */
describe("ExecutionParametersSheet — PRE-5 story 2.6", () => {
  const hidden = { includeHiddenElements: true } as const;
  const get = (testID: string) => screen.getByTestId(testID, hidden);
  const query = (testID: string) => screen.queryByTestId(testID, hidden);
  const styleOf = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};
  const rows = () => screen.queryAllByTestId(/^execution-sheet-table-row-\d+$/, hidden).length;
  const pauseField = (row: number) => query(`execution-sheet-table-row-${row}-pause-field`);
  const measureRow = (row: number) => {
    fireEvent(get(`execution-sheet-table-row-${row}-motion`), "layout", {
      nativeEvent: { layout: { x: -4, y: 32 + 36 * (row - 1), width: 336, height: 36 } },
    });
    fireEvent(get(`execution-sheet-table-row-${row}-target-cell`), "layout", { nativeEvent: { layout: { x: 58, y: 6, width: 71, height: 24 } } });
  };

  it("PRE5-2.6/AC2 — bloc blanc sans contour, rayon 8, à 8 du cadre ; en-têtes et cellules sur la même suite de colonnes (71, écart 7) ; lignes de 36 ; une hauteur de ligne sous la dernière ; aucun InlineStepper au repos", () => {
    renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    const block = styleOf("execution-sheet-table-content");
    expect(block).toMatchObject({ backgroundColor: "#FFFFFF", borderRadius: 8, marginVertical: 12, paddingHorizontal: 4, paddingBottom: TABLE_ROW_HEIGHT });
    expect(block.borderWidth).toBeUndefined();
    // Le cadre de découpe déborde de 4 dans la marge de 12 du groupe : bloc à 8 du contour.
    expect(styleOf("execution-sheet-table")).toMatchObject({ marginHorizontal: -4, paddingHorizontal: 4 });
    expect(block.marginHorizontal).toBe(-4);
    for (const row of [1, 2, 3]) {
      expect(styleOf(`execution-sheet-table-row-${row}`)).toMatchObject({ height: 36, borderTopWidth: 1 });
      expect(styleOf(`execution-sheet-table-row-${row}-target`)).toMatchObject({ width: 71, minHeight: 24, borderRadius: 8 });
      expect(styleOf(`execution-sheet-table-row-${row}-pause-toggle`)).toMatchObject({ width: 71, minHeight: 24, borderRadius: 8 });
    }
    const header = get("execution-sheet-table-header");
    expect(StyleSheet.flatten(header.props.style)).toMatchObject({ minHeight: 32 });
    const headers = within(header).getAllByText(/^(Durée|Pause)$/);
    expect(headers.map((node) => StyleSheet.flatten(node.props.style)).map((style) => [style.width, style.textAlign, style.fontSize, style.color])).toEqual([
      [71, "center", 12, "#595E66"],
      [71, "center", 12, "#595E66"],
    ]);
    // La ligne « Nombre de séries » et les autres lignes de la Feuille restent à 44.
    expect(styleOf("execution-sheet-row-series-line")).toMatchObject({ minHeight: 44 });
    expect(screen.UNSAFE_root.findAllByType(InlineStepper)).toHaveLength(0);
    fireEvent.press(get("execution-sheet-table-row-2-pause-toggle"));
    expect(screen.UNSAFE_root.findAllByType(InlineStepper)).toHaveLength(1);
  });

  it("PRE5-2.6/AC3 — cellule Cible : roue de SA ligne sous la ligne, « À l'échec » en tête ; ✓ ne change que cette ligne ; la cellule active passe à #EAEAFF ; le tableau reste sélectionné", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    measureRow(2);
    fireEvent.press(get("execution-sheet-table-row-2-target"));
    expect(within(get("execution-sheet-cell-panel")).getByTestId("duration-wheel-failure-option")).toBeTruthy();
    expect(styleOf("execution-sheet-table-row-2-target").backgroundColor).toBe("#EAEAFF");
    expect(styleOf("execution-sheet-table-row-1-target").backgroundColor).not.toBe("#EAEAFF");
    expect(styleOf("execution-sheet-variable-group").backgroundColor).toBe("#F2F2FF");
    fireEvent.press(get("duration-wheel-failure-option"));
    fireEvent.press(get("duration-wheel-validate"));
    expect(query("execution-sheet-cell-panel")).toBeNull();
    validate();
    expect(applied(onApply).series).toEqual({
      kind: "VARIABLE",
      rows: [
        { target: numberTarget(30), pauseSeconds: 10, loadKg: 0 },
        { target: failureTarget(), pauseSeconds: 20, loadKg: 0 },
        { target: numberTarget(60), pauseSeconds: 30, loadKg: 0 },
      ],
    });
  });

  it("PRE5-2.6/AC3 — autre surface : ± de la Pause de la ligne 1 ouvert, toucher la Cible de la ligne 2 le ferme et ouvre la roue dans le même geste ; ses ± ne le ferment jamais ; le tableau reste sélectionné", () => {
    renderSheet(params({ series: variableRows([[30, 10], [45, 20]]) }));
    measureRow(2);
    tap("execution-sheet-table-row-1-pause-increment");
    expect(pauseField(1)).not.toBeNull();
    expect(styleOf("execution-sheet-variable-group").backgroundColor).toBe("#F2F2FF");
    fireEvent.press(get("execution-sheet-table-row-2-target"));
    expect(pauseField(1)).toBeNull();
    expect(query("execution-sheet-cell-panel")).not.toBeNull();
    expect(String(get("execution-sheet-table-row-1-pause-value").props.children)).toBe("11 s");
    // Inversement : un Sélecteur ouvert se ferme sans ouvrir la Pause touchée (T10).
    fireEvent.press(get("execution-sheet-table-row-1-pause-toggle"));
    expect(query("execution-sheet-cell-panel")).toBeNull();
    expect(pauseField(1)).toBeNull();
    // Un champ hors tableau (N) ferme la Pause dans le même geste et désélectionne le tableau.
    fireEvent.press(get("execution-sheet-table-row-1-pause-toggle"));
    fireEvent.press(get("execution-sheet-series-toggle"));
    expect(pauseField(1)).toBeNull();
    expect(get("execution-sheet-series-field")).toBeTruthy();
    expect(styleOf("execution-sheet-variable-group").backgroundColor).toBeUndefined();
  });

  it("PRE5-2.6/AC3 — croix avec le ± de la Pause ouvert : l'appui le range, aucune ligne retirée ; appui extérieur : rangé ; ✓ de la Feuille non absorbé", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    tap("execution-sheet-table-row-1-pause-increment");
    fireEvent.press(get("execution-sheet-table-row-2-remove"));
    expect(pauseField(1)).toBeNull();
    expect(rows()).toBe(3);
    expect(query("execution-sheet-adjusted")).toBeNull();
    fireEvent.press(get("execution-sheet-table-row-1-pause-toggle"));
    fireEvent.press(get("execution-sheet-body-outside"));
    expect(pauseField(1)).toBeNull();
    fireEvent.press(get("execution-sheet-table-row-1-pause-toggle"));
    validate();
    expect(applied(onApply).series).toEqual(variableRows([[30, 11], [45, 20], [60, 30]]));
  });

  it("PRE5-2.6/AC3 — retrait d'une autre ligne puis Annuler : le ± ouvert reste sur SA ligne (identité, jamais rang)", () => {
    renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    fireEvent.press(get("execution-sheet-table-row-1-remove"));
    expect(rows()).toBe(2);
    // L'ancienne ligne 3 est maintenant la ligne 2 : son champ s'ouvre sur 30 s.
    fireEvent.press(get("execution-sheet-table-row-2-pause-toggle"));
    expect(valueOf("execution-sheet-table-row-2-pause")).toBe("30 s");
    fireEvent.press(get("execution-sheet-adjusted-undo"));
    expect(rows()).toBe(3);
    expect(pauseField(3)).not.toBeNull();
    expect(pauseField(2)).toBeNull();
    expect(valueOf("execution-sheet-table-row-3-pause")).toBe("30 s");
  });

  it("PRE5-2.6/AC5 (NR Δ38) — le tableau suit N par le stepper PRE-4 inchangé : ligne ajoutée puis retirée, réserves restaurées (Q29) ; aucune valeur au clavier", () => {
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
    expect(screen.UNSAFE_root.findAll((node) => node.props.keyboardType !== undefined)).toHaveLength(0);
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
  const focus = (testID: string) => fireEvent(get(testID), "focus");
  const blur = (testID: string) => fireEvent(get(testID), "blur");
  const type = (testID: string, text: string) => fireEvent.changeText(get(testID), text);
  const shown = (testID: string) => String(get(testID).props.value);
  const loadChoice = () => selectedValue("execution-sheet-load-control", ["WITH", "WITHOUT"]);
  const uniformLoad = (loadKg: number, enabled = true) =>
    params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(90), pauseSeconds: 15, loadKg, workPhases: [] }, loadEnabled: enabled });
  const variableLoads = (loads: number[], enabled = true) =>
    params({
      series: { kind: "VARIABLE", rows: loads.map((loadKg, index) => ({ target: numberTarget(30 + index), pauseSeconds: 10, loadKg })) },
      loadEnabled: enabled,
    });
  const inputs = () => screen.UNSAFE_root.findAll((node) => node.props.keyboardType !== undefined && typeof node.type === "string");

  it("PRE5-2.2/AC5 — Sans : ligne « Charge » en dernier dans le cadre Séries, segmenté « Avec | Sans » sur Sans, aucun champ ni colonne", () => {
    renderSheet(params());
    const frame = get("execution-sheet-frame-series");
    expect(within(frame).getByTestId("execution-sheet-row-load", hidden)).toBeTruthy();
    expect(loadChoice()).toBe("WITHOUT");
    expect(within(get("execution-sheet-row-load")).getByText("Charge", hidden)).toBeTruthy();
    expect(within(get("execution-sheet-load-control")).getAllByText(/^(Avec|Sans)$/, hidden).map((node) => node.props.children)).toEqual(["Avec", "Sans"]);
    expect(inputs()).toHaveLength(0);
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
    expect(get(UNIFORM).props.keyboardType).toBe("decimal-pad");
    expect(get(UNIFORM).props.inputAccessoryViewID).toBe("execution-sheet-keyboard-bar");
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

  it("PRE5-2.2/AC1 — illisible ou négatif : valeur précédente ; champ vidé : 0 kg, et à la fermeture en identiques → Sans", () => {
    const { onApply } = renderSheet(uniformLoad(20));
    focus(UNIFORM);
    type(UNIFORM, "1,2,3");
    blur(UNIFORM);
    expect(shown(UNIFORM)).toBe("20 kg");
    focus(UNIFORM);
    type(UNIFORM, "-2");
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

  it("PRE5-2.2/AC1 — une seule surface : toucher le champ de N pendant la saisie ouvre son ± dans le même geste (clavier rangé) ; la sortie applique la valeur", () => {
    renderSheet(uniformLoad(20));
    focus(UNIFORM);
    type(UNIFORM, "4");
    fireEvent.press(get("execution-sheet-series-toggle"));
    expect(get("execution-sheet-series-field")).toBeTruthy();
    expect(styleOf(UNIFORM).backgroundColor).not.toBe("#EAEAFF");
    blur(UNIFORM);
    expect(shown(UNIFORM)).toBe("4 kg");
    expect(get("execution-sheet-series-field")).toBeTruthy();
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

  it("PRE5-2.2/AC2, AC3 — variables : colonne Charge après la Pause ; Suivant / Précédent passent au champ voisin sans normalisation ; extrémités indisponibles ; le fond actif suit ; « Fermer » applique", () => {
    const { onApply } = renderSheet(variableLoads([0, 20, 5, 6, 7, 8]));
    expect(within(get("execution-sheet-table-header")).getByText("Charge", hidden)).toBeTruthy();
    // Largeur de la colonne de 71 (qui peut rétrécir), cellule 24 de haut, cible tactile de 36.
    expect(styleOf(cell(1))).toMatchObject({ width: "100%", minHeight: 24, borderRadius: 8, height: 24 });
    expect(styleOf("execution-sheet-table-row-1-load-cell")).toMatchObject({ width: 71, flexShrink: 1 });
    expect(get(cell(1)).props.hitSlop).toEqual({ top: 6, bottom: 6 });
    expect([1, 2, 6].map((row) => shown(cell(row)))).toEqual(["0 kg", "20 kg", "8 kg"]);
    expect(get(cell(2)).props.accessibilityLabel).toBe("Série 2, charge");
    focus(cell(1));
    expect(get("execution-sheet-keyboard-previous").props.accessibilityState).toMatchObject({ disabled: true });
    expect(get("execution-sheet-keyboard-next").props.accessibilityState).toMatchObject({ disabled: false });
    // Le focus d'une cellule sélectionne le tableau (Q40).
    expect(styleOf("execution-sheet-variable-group").backgroundColor).toBe("#F2F2FF");
    fireEvent.press(get("execution-sheet-keyboard-next"));
    expect(styleOf(cell(2)).backgroundColor).toBe("#EAEAFF");
    expect(styleOf(cell(1)).backgroundColor).not.toBe("#EAEAFF");
    // Système : le focus passe de la ligne 1 à la ligne 2 (perte puis prise), clavier ouvert.
    blur(cell(1));
    focus(cell(2));
    type(cell(2), "");
    fireEvent.press(get("execution-sheet-keyboard-previous"));
    blur(cell(2));
    focus(cell(1));
    // Toutes les charges à 0, mais aucune normalisation pendant Précédent : colonne présente.
    expect(shown(cell(2))).toBe("0 kg");
    expect(loadChoice()).toBe("WITH");
    expect(styleOf(cell(1)).backgroundColor).toBe("#EAEAFF");
    // Dernière ligne : Suivant indisponible, sans boucle.
    blur(cell(1));
    expect(loadChoice()).toBe("WITH");
    focus(cell(6));
    expect(get("execution-sheet-keyboard-next").props.accessibilityState).toMatchObject({ disabled: true });
    expect(get("execution-sheet-keyboard-previous").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(get("execution-sheet-keyboard-next"));
    expect(styleOf(cell(6)).backgroundColor).toBe("#EAEAFF");
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

  it("PRE5-2.2/AC2 — variables, toutes les charges à 0 à la fermeture : Sans, colonne retirée, valeurs conservées", () => {
    const { onApply } = renderSheet(variableLoads([0, 20]));
    focus(cell(2));
    type(cell(2), "0");
    fireEvent.press(get("execution-sheet-keyboard-close"));
    blur(cell(2));
    expect(loadChoice()).toBe("WITHOUT");
    expect(query(cell(1))).toBeNull();
    expect(within(get("execution-sheet-table-header")).queryByText("Charge", hidden)).toBeNull();
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
    const bar = strings.executionParameters.sheet.keyboardBar;
    expect([bar.previous, bar.next, bar.close]).toEqual(["← Précédent", "Suivant →", "Fermer"]);
    expect(within(get("execution-sheet-keyboard-previous")).getByText(bar.previous, hidden)).toBeTruthy();
    expect(get("execution-sheet-keyboard-previous").props.accessibilityLabel).toBe("Précédent");
    expect(get("execution-sheet-keyboard-next").props.accessibilityLabel).toBe("Suivant");
    expect(within(get("execution-sheet-keyboard-close")).getByText("Fermer", hidden)).toBeTruthy();
  });

  it("PRE5-2.2/AC5 (revue E2 de 2.6) — ± de la Pause d'une ligne centré sur la cellule Pause mesurée, borné à la ligne", () => {
    renderSheet(variableLoads([10, 20]));
    fireEvent(get("execution-sheet-table-row-1-pause-cell"), "layout", { nativeEvent: { layout: { x: 120, y: 6, width: 60, height: 24 } } });
    fireEvent.press(get("execution-sheet-table-row-1-pause-toggle"));
    fireEvent(get("execution-sheet-table-row-1-pause-motion"), "layout", { nativeEvent: { layout: { x: 0, y: 36, width: 300, height: 40 } } });
    // Centre 150, ± de 128 : 150 − 64 = 86.
    expect(styleOf("execution-sheet-table-row-1-pause-column").marginLeft).toBe(86);
    fireEvent(get("execution-sheet-table-row-1-pause-cell"), "layout", { nativeEvent: { layout: { x: 250, y: 6, width: 71, height: 24 } } });
    // Centre 285,5 : borné à 300 − 128 = 172.
    expect(styleOf("execution-sheet-table-row-1-pause-column").marginLeft).toBe(172);
  });

  it("PRE5-2.2/AC1 (NR Δ30) — aucune autre valeur au clavier : seuls les champs de charge en ont un, au clavier décimal", () => {
    renderSheet(variableLoads([10, 20]));
    expect(inputs().map((node) => String(node.props.testID)).sort()).toEqual([cell(1), cell(2)]);
    expect(inputs().every((node) => node.props.keyboardType === "decimal-pad")).toBe(true);
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
  const focus = (testID: string) => fireEvent(get(testID), "focus");
  const blur = (testID: string) => fireEvent(get(testID), "blur");
  const type = (testID: string, text: string) => fireEvent.changeText(get(testID), text);
  const shown = (testID: string) => String(get(testID).props.value);
  const uniformLoad = (loadKg: number) =>
    params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(90), pauseSeconds: 15, loadKg, workPhases: [] }, loadEnabled: true });
  const variableLoads = (loads: number[], enabled = true) =>
    params({
      series: { kind: "VARIABLE", rows: loads.map((loadKg, index) => ({ target: numberTarget(30 + index), pauseSeconds: 10, loadKg })) },
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

  afterEach(() => {
    spies.splice(0).forEach((spy) => spy.mockRestore());
  });

  it("PRE5-2.2/AC1 — ✓ absorbé, autre surface touchée, « Fermer » : le focus natif du champ est retiré", () => {
    const blurSpy = spyOn("blur");
    renderSheet(uniformLoad(20));
    focus(UNIFORM);
    blurSpy.mockClear();
    validate();
    expect(targets(blurSpy)).toEqual([UNIFORM]);
    blur(UNIFORM);
    focus(UNIFORM);
    blurSpy.mockClear();
    fireEvent.press(get("execution-sheet-series-toggle"));
    expect(targets(blurSpy)).toEqual([UNIFORM]);
    blur(UNIFORM);
    focus(UNIFORM);
    blurSpy.mockClear();
    fireEvent.press(get("execution-sheet-keyboard-close"));
    expect(targets(blurSpy)).toEqual([UNIFORM]);
  });

  it("PRE5-2.2/AC2 — Suivant et Précédent donnent le focus natif au champ voisin, sans retirer celui du champ courant", () => {
    const focusSpy = spyOn("focus");
    const blurSpy = spyOn("blur");
    renderSheet(variableLoads([10, 20, 30]));
    focus(cell(2));
    focusSpy.mockClear();
    blurSpy.mockClear();
    fireEvent.press(get("execution-sheet-keyboard-next"));
    expect(targets(focusSpy)).toEqual([cell(3)]);
    blur(cell(2));
    focus(cell(3));
    focusSpy.mockClear();
    fireEvent.press(get("execution-sheet-keyboard-previous"));
    expect(targets(focusSpy)).toEqual([cell(2)]);
    expect(blurSpy).not.toHaveBeenCalled();
  });

  it("PRE5-2.2/AC5 — Avec : focus natif du premier champ après le rendu (charge commune ; première cellule en variables)", () => {
    const focusSpy = spyOn("focus");
    const view = renderSheetView(params());
    fireEvent.press(get("execution-sheet-load-control-WITH"));
    expect(targets(focusSpy)).toEqual([UNIFORM]);
    view.unmount();
    focusSpy.mockClear();
    renderSheet(variableLoads([0, 0], false));
    fireEvent.press(get("execution-sheet-load-control-WITH"));
    expect(targets(focusSpy)).toEqual([cell(1)]);
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
