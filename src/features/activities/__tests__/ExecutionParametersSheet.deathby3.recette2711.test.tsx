import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Alert } from "react-native";

import { numberTarget, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import type { CircuitRole, FormatSettings } from "@/domain/sessions/formats";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import {
  durationKeys,
  hideExecutionSheetKeyboard,
  openExecutionSheetField,
  showExecutionSheetKeyboard,
  typeInExecutionSheetCell,
} from "@/features/activities/testing/executionSheetActions";
import { KEYBOARD_ALERT_RETURN_MS } from "@/features/activities/useSheetKeyboard";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Recette iPhone du 27/11/2026 (matin), paquet DEATHBY3. Hermann, mot pour mot : « Lorsque le message sur l'arrondi s'affiche, le
 * clavier disparait et la modale des paramètres se baisse faisant apparaître la modale Death by et modifier une séance (soit 4 écrans
 * affichés par couches sur un même écran). Il ne faut que l'écran reste tel quel pendant le message (le clavier ne disparaît pas). »
 *
 * Jest ne prouve que l'arbre JS : la disparition du clavier par l'alerte native (fenêtre clé prise par `RCTAlertController`) est
 * simulée par les événements `Keyboard` ; la position de la feuille (fil UI, `useAnimatedKeyboard`), le retour du clavier et le rendu
 * restent à vérifier sur iPhone.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const f = strings.executionParameters.format;
const hidden = { includeHiddenElements: true } as const;
const get = (testID: string) => screen.getByTestId(testID, hidden);
// Cadre du clavier suivi par la feuille : marge de défilement du corps de la modale (0 clavier fermé). La barre, `InputAccessoryView`, est
// toujours rendue (elle suit le clavier natif) et ne témoigne pas du cadre.
const inset = () => (get("execution-sheet-body").props.contentInset as { bottom: number }).bottom;
const selected = (testID: string) => get(testID).props.accessibilityState?.selected === true;

type AlertButton = { text?: string; style?: string; onPress?: () => void };

const phased: ExecutionParametersInput = {
  version: 5,
  mode: "DURATION",
  series: {
    kind: "UNIFORM",
    count: 1,
    target: numberTarget(30),
    pauseSeconds: 0,
    loadKg: 0,
    workPhases: [
      { id: 1, label: "A", durationSeconds: 5 },
      { id: 2, label: "B", durationSeconds: 10 },
    ],
  },
  sideMode: "UNILATERAL",
  sideOrder: "BY_SIDE",
  sideRecoverySeconds: 0,
  cadenceBeepIntervalSeconds: 0,
  countdownSeconds: 0,
  endSeconds: 0,
  loadEnabled: false,
};

function open() {
  const onFormat = jest.fn<(settings: FormatSettings, role: CircuitRole | null) => void>();
  render(
    <TestSafeAreaProvider>
      <ExecutionParametersSheet
        parent={phased}
        profileSideRecoverySecondsDefault={0}
        format={{ key: "DEATH_BY", rows: ["increment", "stopImposed"], settings: { incrementPerRound: 15 }, onApply: onFormat }}
        onApply={jest.fn()}
        onCancel={jest.fn()}
      />
    </TestSafeAreaProvider>,
  );
  return { onFormat };
}

/** Incrément saisi (20 s, non multiple de 15 s), puis Précédent de la barre (champ voisin ; Suivant suit le même chemin, `step`) : l'alerte s'ouvre, la saisie continue. */
function enterIncrementThenNext() {
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  openExecutionSheetField("execution-sheet-format-increment");
  showExecutionSheetKeyboard();
  typeInExecutionSheetCell("execution-sheet-format-increment", durationKeys(20));
  fireEvent.press(get("execution-sheet-keyboard-previous"));
  expect(alert).toHaveBeenCalledTimes(1);
  expect(alert.mock.calls[0]?.[0]).toBe(f.incrementCycleTitle);
  // Perte du focus natif du champ quitté (simulée : Jest ne déplace pas le focus natif) — aucune seconde alerte.
  fireEvent(get("execution-sheet-format-increment-input"), "blur");
  expect(alert).toHaveBeenCalledTimes(1);
  const buttons = (alert.mock.calls[0]?.[2] ?? []) as AlertButton[];
  return { buttons };
}

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("Recette du 27/11/2026 (matin) — DEATHBY3 : écran tel quel pendant l'alerte d'arrondi de l'incrément", () => {
  it("le clavier retiré par l'alerte ne change pas la feuille (cadre gardé) ni la saisie ; Annuler, puis retour du clavier : saisie continuée", () => {
    open();
    const { buttons } = enterIncrementThenNext();
    // Précédent a choisi le champ voisin (saisie qui continue).
    expect(selected("execution-sheet-format-increment")).toBe(false);
    expect(inset()).toBeGreaterThan(0);
    // L'alerte native prend la fenêtre clé : iOS retire le clavier, et peut retirer le focus du champ voisin.
    hideExecutionSheetKeyboard();
    expect(inset()).toBeGreaterThan(0);
    // Annuler : la valeur saisie reste ; le clavier revient sur le champ voulu.
    act(() => buttons.find((button) => button.style === "cancel")!.onPress!());
    showExecutionSheetKeyboard();
    expect(inset()).toBeGreaterThan(0);
    expect(get("execution-sheet-format-increment-value").props.children).toContain("20");
  });

  it("arrondi choisi : valeur arrondie ; clavier non revenu après le choix → sa disparition est appliquée", () => {
    jest.useFakeTimers();
    open();
    const { buttons } = enterIncrementThenNext();
    hideExecutionSheetKeyboard();
    expect(inset()).toBeGreaterThan(0);
    act(() => buttons[1]!.onPress!());
    expect(get("execution-sheet-format-increment-value").props.children).toContain("30");
    expect(inset()).toBeGreaterThan(0);
    act(() => {
      jest.advanceTimersByTime(KEYBOARD_ALERT_RETURN_MS);
    });
    expect(inset()).toBe(0);
  });

  it("« Fermer » / sortie du champ : la fermeture voulue suit son cours (aucune retenue)", () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    open();
    openExecutionSheetField("execution-sheet-format-increment");
    showExecutionSheetKeyboard();
    typeInExecutionSheetCell("execution-sheet-format-increment", durationKeys(20));
    fireEvent(get("execution-sheet-format-increment-input"), "blur");
    expect(alert).toHaveBeenCalledTimes(1);
    hideExecutionSheetKeyboard();
    expect(inset()).toBe(0);
  });
});
