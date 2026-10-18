import { act, fireEvent, screen, within } from "@testing-library/react-native";

import type { ExecutionMode } from "@/domain/activities/ExecutionParameters";

/** Libellés d'interface des deux Modes (lexique `executionParameters.sheet.modes`). */
const MODE_BY_LABEL: Readonly<Record<string, ExecutionMode>> = {
  Durée: "DURATION",
  Répétitions: "REPETITIONS",
};

/**
 * PRE-4 story 3.1 (AD-7) : choisit le Mode dans la Feuille Paramètres
 * d'exécution, quelle que soit la plateforme. Sur iOS, c'est l'option du
 * popover natif (bouton SwiftUI, événement `buttonPress`). Sur Android et le
 * web, c'est le segmenté. Ouvre le contrôle s'il est fermé. Lève une erreur
 * sur un libellé inconnu, pour ne jamais choisir un Mode par défaut.
 */
export function chooseExecutionMode(label: string): void {
  const mode = MODE_BY_LABEL[label];
  if (mode === undefined) {
    throw new Error(`chooseExecutionMode : libellé de Mode inconnu « ${label} »`);
  }
  const option = () => screen.queryByTestId(`execution-sheet-mode-option-${mode}`);
  if (!option() && !screen.queryByTestId("execution-sheet-mode-control")) {
    fireEvent.press(screen.getByTestId("execution-sheet-mode-value"));
  }
  const native = option();
  if (native) {
    fireEvent(native, "buttonPress");
  } else {
    fireEvent.press(within(screen.getByTestId("execution-sheet-mode-control")).getByText(label));
  }
}

/**
 * PRE-4 story 3.3 (AC8, FR-03-05) : ouvre le champ ± hors tableau `testID` de la
 * Feuille (N, Pauses, Bip, Compte à rebours, Fin) s'il est fermé, en touchant sa
 * valeur (`${testID}-toggle`). Au repos, seule la valeur est visible ; ses − et +
 * n'apparaissent qu'à l'appui. Sans effet si le champ est déjà ouvert, ou si ses ±
 * sont permanents (cellules du tableau des séries variables, conservés par Q44).
 */
export function openExecutionSheetField(testID: string): void {
  if (screen.queryByTestId(`${testID}-increment`)) return;
  fireEvent.press(screen.getByTestId(`${testID}-toggle`));
}

/**
 * PRE-4 story 3.3 : appui bref (`pressIn` puis `pressOut`) sur un − ou un + de la
 * Feuille (`…-increment`, `…-decrement`), après avoir ouvert son champ s'il est fermé.
 * Remplace l'appui direct sur des ± toujours visibles (PRE-3).
 */
export function tapExecutionSheetStep(buttonTestID: string): void {
  const match = /^(.*)-(increment|decrement)$/.exec(buttonTestID);
  if (!match) {
    throw new Error(`tapExecutionSheetStep : « ${buttonTestID} » n'est ni un − ni un +`);
  }
  openExecutionSheetField(match[1]!);
  fireEvent(screen.getByTestId(buttonTestID), "pressIn");
  fireEvent(screen.getByTestId(buttonTestID), "pressOut");
}

/** Libellés d'interface des deux Régimes (lexique `executionParameters.sheet.regimes`). */
const REGIME_LABELS = ["identiques", "variables"] as const;

/**
 * PRE-4 story 3.3 (FR-04-01) : choisit le Régime des séries par le champ de la
 * ligne `Séries`, quelle que soit la plateforme (panneau sans flèche sur iOS,
 * segmenté en ligne sur Android et le web ; même segmenté dans les deux cas).
 * Remplace l'ancien interrupteur « Séries variables ». Lève une erreur sur un
 * libellé inconnu.
 */
export function chooseExecutionRegime(label: string): void {
  if (!(REGIME_LABELS as readonly string[]).includes(label)) {
    throw new Error(`chooseExecutionRegime : libellé de Régime inconnu « ${label} »`);
  }
  if (!screen.queryByTestId("execution-sheet-regime-control")) {
    fireEvent.press(screen.getByTestId("execution-sheet-regime-value"));
  }
  fireEvent.press(within(screen.getByTestId("execution-sheet-regime-control")).getByText(label));
}

type TestInstance = ReturnType<typeof screen.getByTestId>;

/** `testID` du `Popover` natif d'une ligne de la Feuille (`NativeRowPopover`, `${testID}-popover`). */
const NATIVE_ROW_POPOVER_TEST_ID = /^execution-sheet-.+-host-popover$/;

/**
 * PRE-4 story 3.1 (S0) : appuie sur un élément React Native, en tenant compte
 * du contenu d'un popover natif de la Feuille.
 *
 * Sur iOS, l'ancre du `Popover` (`NativeRowPopover`) est un conteneur en
 * `pointerEvents="none"`, superposé à la pastille. Dans l'arbre React,
 * `Popover.Content` reste sous ce conteneur. Sur l'appareil, SwiftUI présente
 * la bulle dans une hiérarchie native distincte, hors de ce conteneur, et
 * `RNHostView` y attache son propre gestionnaire de touchers. `fireEvent.press`
 * de Testing Library ne modélise pas cette présentation : il remonte l'arbre
 * React et refuse l'appui sous un ancêtre `pointerEvents="none"`.
 *
 * Pour un élément du contenu d'un tel popover, ce helper déclenche donc le
 * `onPress` du composant tactile le plus proche (même rappel que l'appui
 * réel), sauf s'il est désactivé. Pour tout autre élément, il délègue à
 * `fireEvent.press`, sans changement. Le toucher réel dans la bulle reste à
 * constater sur iPhone.
 *
 * Q37 (2026-10-17) : la roue de « Durée d’une série » n'est plus dans un
 * popover natif. Q41 (2026-10-17, E-15) remplace sa couche `WheelPickerOverlay`
 * par un panneau sans flèche (`AnchoredPanel`), vue React Native ordinaire
 * sous le champ ; il en va de même pour la Durée totale, le Changement de
 * côté et l'Ordre des côtés sur iOS. Leurs ✕ / ✓ et leurs options passent
 * donc par `fireEvent.press`. Le helper reste valable pour tout contenu React
 * Native d'un popover natif de la Feuille (aujourd'hui, le seul Mode).
 */
export function pressInExecutionSheet(element: TestInstance): void {
  let node: TestInstance | null = element;
  let inNativePopover = false;
  while (node) {
    const testID: unknown = node.props.testID;
    if (typeof testID === "string" && NATIVE_ROW_POPOVER_TEST_ID.test(testID)) {
      inNativePopover = true;
      break;
    }
    node = node.parent;
  }
  if (!inNativePopover) {
    fireEvent.press(element);
    return;
  }
  let pressable: TestInstance | null = element;
  while (pressable && typeof pressable.props.onPress !== "function") {
    pressable = pressable.parent;
  }
  if (!pressable) {
    throw new Error("pressInExecutionSheet : aucun élément tactile sous le popover natif");
  }
  if (pressable.props.disabled === true) return;
  const onPress = pressable.props.onPress as (event: unknown) => void;
  act(() => {
    onPress({ nativeEvent: {} });
  });
}
