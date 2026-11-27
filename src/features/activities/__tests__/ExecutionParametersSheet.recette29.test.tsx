import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Alert } from "react-native";

import { numberTarget, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import { KeyboardField, KeyboardFieldGrowContext } from "@/features/activities/KeyboardField";
import {
  durationKeys,
  hideExecutionSheetKeyboard,
  openExecutionSheetField,
  showExecutionSheetKeyboard,
  typeInExecutionSheetCell,
} from "@/features/activities/testing/executionSheetActions";
import { KEYBOARD_ALERT_RETURN_MS } from "@/features/activities/useSheetKeyboard";
import { strings } from "@/shared/i18n";
import { fieldFocusTokens } from "@/shared/ui/fieldFocus";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Réponses de Hermann du 27/11/2026 aux questions du lot 24 :
 * - « Arrondi de la durée de série : son message a sûrement le même défaut que celui du Death by. Je le corrige aussi ? » — « oui » ;
 * - standard du focus sur les champs de texte — « libellé de phase oui ».
 *
 * Jest ne prouve que l'arbre JS : la disparition du clavier par l'alerte native est simulée par les événements `Keyboard` ; la position
 * de la feuille, le retour du clavier et le rendu du focus restent à vérifier sur iPhone.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const t = strings.executionParameters.sheet;
const hidden = { includeHiddenElements: true } as const;
const get = (testID: string) => screen.getByTestId(testID, hidden);
const inset = () => (get("execution-sheet-body").props.contentInset as { bottom: number }).bottom;

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

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("Réponses du 27/11/2026 (lot 24) — arrondi de la durée de série : écran tel quel pendant l'alerte", () => {
  it("durée non multiple du motif, puis Suivant : la feuille garde le cadre du clavier pendant l'alerte ; arrondi appliqué ; clavier non revenu → disparition appliquée", () => {
    jest.useFakeTimers();
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    render(
      <TestSafeAreaProvider>
        <ExecutionParametersSheet parent={phased} profileSideRecoverySecondsDefault={0} onApply={jest.fn()} onCancel={jest.fn()} />
      </TestSafeAreaProvider>,
    );
    openExecutionSheetField("execution-sheet-target");
    showExecutionSheetKeyboard();
    typeInExecutionSheetCell("execution-sheet-target", durationKeys(20));
    if (alert.mock.calls.length === 0) fireEvent.press(get("execution-sheet-keyboard-next"));
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0]?.[0]).toBe(t.phaseCycleRoundTitle);
    expect(inset()).toBeGreaterThan(0);
    // L'alerte native prend la fenêtre clé : iOS retire le clavier — la feuille ne redescend pas.
    hideExecutionSheetKeyboard();
    // … et peut retirer le focus natif du champ (simulé : Jest ne déplace pas le focus natif) — aucune seconde alerte.
    fireEvent(get("execution-sheet-target-input"), "blur");
    expect(alert).toHaveBeenCalledTimes(1);
    expect(inset()).toBeGreaterThan(0);
    const buttons = (alert.mock.calls[0]?.[2] ?? []) as AlertButton[];
    act(() => buttons[0]!.onPress!());
    expect(get("execution-sheet-target-value").props.children).toContain("15");
    act(() => {
      jest.advanceTimersByTime(KEYBOARD_ALERT_RETURN_MS);
    });
    expect(inset()).toBe(0);
  });
});

describe("Réponses du 27/11/2026 (lot 24) — libellé de phase : standard unique du focus", () => {
  const field = (active: boolean) => (
    <KeyboardFieldGrowContext.Provider value={{ reduceMotion: true }}>
      <KeyboardField
        mode="text"
        displayValue="Descente"
        editText="Descente"
        active={active}
        onFocus={jest.fn()}
        onBlur={jest.fn()}
        onChangeText={jest.fn()}
        accessibilityLabel="Libellé"
        style={{ width: 80, height: 26 }}
        testID="label"
      />
    </KeyboardFieldGrowContext.Provider>
  );
  const flat = () => {
    const style = screen.getByTestId("label").props.style as unknown;
    const list = (Array.isArray(style) ? style.flat(3) : [style]) as (Record<string, unknown> | null)[];
    return Object.assign({}, ...list.filter(Boolean)) as Record<string, unknown>;
  };

  it("en saisie : fond bleu pâle, liseré bleu fin, agrandi ; au repos : ni liseré ni agrandissement", () => {
    const { rerender } = render(field(true));
    expect(flat()).toMatchObject({
      backgroundColor: fieldFocusTokens.surface,
      borderWidth: fieldFocusTokens.frameWidth,
      borderColor: fieldFocusTokens.frameColor,
    });
    expect(JSON.stringify(flat().transform)).toContain(String(fieldFocusTokens.scale));
    rerender(field(false));
    expect(flat().borderWidth).toBeUndefined();
    expect(JSON.stringify(flat().transform)).toContain('"scale":1');
  });
});
