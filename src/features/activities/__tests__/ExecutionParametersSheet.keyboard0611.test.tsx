import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Platform } from "react-native";

import { numberTarget, unsetTarget, type ExecutionParameters, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import {
  CELL_BACKSPACE,
  enterExecutionSheetValue,
  openExecutionSheetField,
  showExecutionSheetKeyboard,
  showExerciseDurationSignals,
  typeInExecutionSheetCell,
  closeExecutionSheetField,
} from "@/features/activities/testing/executionSheetActions";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Décision de Hermann du 06/11/2026 (constat c : « Paramètre d'exécution : n'utiliser que le clavier
 * pour entrer les valeurs des champs, plus aucune roulette ou popover » ; « Oui » : tous les champs de la
 * fiche Exercice) — chaque valeur hors tableau se saisit au clavier numérique dans son champ, aux bornes
 * des roues et ± remplacés ; aucune roue ni ± n'est rendu ; Précédent / Suivant de la barre parcourent
 * les champs hors tableau dans l'ordre de la Feuille. Jest ne prouve que l'arbre JS : clavier, barre et
 * rendu réels relèvent de la recette iPhone.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const hidden = { includeHiddenElements: true } as const;
const get = (testID: string) => screen.getByTestId(testID, hidden);
const query = (testID: string) => screen.queryByTestId(testID, hidden);
const text = (testID: string) => String(get(`${testID}-value`).props.children);

function params(overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 5,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 15, loadKg: 0, workPhases: [] },
    sideMode: "RIGHT_LEFT",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 5,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    loadEnabled: false,
    ...overrides,
  };
}

function renderSheet(parent: ExecutionParametersInput = params(), withRecovery = true) {
  const onApply = jest.fn<(value: ExecutionParameters) => void>();
  const onRecovery = jest.fn<(seconds: number) => void>();
  render(
    <TestSafeAreaProvider>
      <ExecutionParametersSheet
        parent={parent}
        profileSideRecoverySecondsDefault={12}
        exerciseSignals="present"
        {...(withRecovery ? { recovery: { seconds: 30, onApply: onRecovery } } : {})}
        onApply={onApply}
        onCancel={() => undefined}
      />
    </TestSafeAreaProvider>,
  );
  return { onApply, onRecovery };
}

const validate = () => fireEvent.press(get("execution-sheet-validate"));

describe("Feuille Paramètres d'exécution — saisie au clavier de toutes les valeurs (décision du 06/11/2026)", () => {
  it("aucune roue ni aucun ± n'est rendu ; chaque valeur est un champ clavier numérique", () => {
    renderSheet();
    showExerciseDurationSignals();
    for (const testID of [
      "execution-sheet-series",
      "execution-sheet-target",
      "execution-sheet-pause",
      "execution-sheet-side-recovery",
      "execution-sheet-total",
      "execution-sheet-countdown",
      "execution-sheet-end",
      "execution-sheet-recovery",
    ]) {
      expect(get(`${testID}-input`).props.keyboardType).toBe("number-pad");
      expect(query(`${testID}-increment`)).toBeNull();
      expect(query(`${testID}-decrement`)).toBeNull();
    }
    openExecutionSheetField("execution-sheet-target");
    openExecutionSheetField("execution-sheet-total");
    openExecutionSheetField("execution-sheet-recovery");
    expect(query("duration-wheel-validate")).toBeNull();
    expect(query("execution-sheet-target-panel")).toBeNull();
    expect(query("execution-sheet-total-panel")).toBeNull();
    expect(query("execution-sheet-recovery-panel")).toBeNull();
  });

  it("durée « MM:SS » : 00:00 de guidage, chiffres tapés par la droite, appliquée à la sortie", () => {
    const { onApply } = renderSheet();
    openExecutionSheetField("execution-sheet-pause");
    expect(text("execution-sheet-pause")).toBe("00:15");
    typeInExecutionSheetCell("execution-sheet-pause", "1");
    expect(text("execution-sheet-pause")).toBe("00:01");
    typeInExecutionSheetCell("execution-sheet-pause", "30");
    expect(text("execution-sheet-pause")).toBe("01:30");
    closeExecutionSheetField("execution-sheet-pause");
    expect(text("execution-sheet-pause")).toBe("1′30″");
    validate();
    expect(onApply.mock.calls[0]![0].series).toMatchObject({ pauseSeconds: 90 });
  });

  it("valeur hors bornes ramenée à la borne (Pause 0..300 s, Fin 0..60 s)", () => {
    const { onApply } = renderSheet();
    enterExecutionSheetValue("execution-sheet-pause", 600);
    expect(text("execution-sheet-pause")).toBe("5′00″");
    showExerciseDurationSignals();
    enterExecutionSheetValue("execution-sheet-end", 90);
    expect(text("execution-sheet-end")).toBe("1′00″");
    validate();
    expect(onApply.mock.calls[0]![0]).toMatchObject({ endSeconds: 60, series: { pauseSeconds: 300 } });
  });

  it("champ vidé : 0 si permis (Pause entre les côtés) ; nombre de séries inchangé", () => {
    const { onApply } = renderSheet();
    enterExecutionSheetValue("execution-sheet-side-recovery", "");
    expect(text("execution-sheet-side-recovery")).toBe("0″");
    enterExecutionSheetValue("execution-sheet-series", "", "integer");
    validate();
    expect(onApply.mock.calls[0]![0]).toMatchObject({ sideRecoverySeconds: 0, series: { count: 3 } });
  });

  it("nombre de séries saisi au clavier dans l'option (bornes 1..99)", () => {
    const { onApply } = renderSheet();
    openExecutionSheetField("execution-sheet-series");
    expect(text("execution-sheet-series")).toBe("3");
    typeInExecutionSheetCell("execution-sheet-series", "150");
    // Trois chiffres au plus ; 150 est ramené à 99 à la sortie.
    closeExecutionSheetField("execution-sheet-series");
    validate();
    expect(onApply.mock.calls[0]![0].series).toMatchObject({ count: 99 });
  });

  it("Cible commune : Durée en « MM:SS », vidée → à renseigner (✓ indisponible) ; Répétitions en entier", () => {
    renderSheet();
    enterExecutionSheetValue("execution-sheet-target", 75);
    expect(text("execution-sheet-target")).toBe("1′15″");
    enterExecutionSheetValue("execution-sheet-target", "");
    expect(text("execution-sheet-target")).toBe("—");
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("Cible commune en Répétitions : 0 ramené à la plus petite Cible positive (ARB-10)", () => {
    const { onApply } = renderSheet(
      params({ mode: "REPETITIONS", series: { kind: "UNIFORM", count: 3, target: unsetTarget(), pauseSeconds: 15, loadKg: 0, workPhases: [] } }),
    );
    enterExecutionSheetValue("execution-sheet-target", 0, "integer");
    expect(text("execution-sheet-target")).toBe("1 rép.");
    enterExecutionSheetValue("execution-sheet-target", 12, "integer");
    validate();
    expect(onApply.mock.calls[0]![0].series).toMatchObject({ target: { kind: "NUMBER", value: 12 } });
  });

  it("Cadence : Autre révèle un champ clavier focalisé (0..10 s) ; rangé à la sortie", () => {
    const { onApply } = renderSheet();
    fireEvent.press(get("execution-sheet-cadence-control-OTHER"));
    expect(query("execution-sheet-beep-input")).not.toBeNull();
    fireEvent(get("execution-sheet-beep-input"), "focus");
    typeInExecutionSheetCell("execution-sheet-beep", "3");
    closeExecutionSheetField("execution-sheet-beep");
    expect(query("execution-sheet-beep-input")).toBeNull();
    validate();
    expect(onApply.mock.calls[0]![0]).toMatchObject({ cadenceBeepIntervalSeconds: 3 });
  });

  it("Compte à rebours et Fin au clavier", () => {
    const { onApply } = renderSheet();
    showExerciseDurationSignals();
    enterExecutionSheetValue("execution-sheet-countdown", 20);
    enterExecutionSheetValue("execution-sheet-end", 8);
    validate();
    expect(onApply.mock.calls[0]![0]).toMatchObject({ countdownSeconds: 20, endSeconds: 8 });
  });

  it("Récupération au clavier (0..300 s, à la seconde), transmise par le ✓", () => {
    const { onRecovery } = renderSheet();
    enterExecutionSheetValue("execution-sheet-recovery", 47);
    expect(text("execution-sheet-recovery")).toBe("47″");
    enterExecutionSheetValue("execution-sheet-recovery", 900);
    expect(text("execution-sheet-recovery")).toBe("5′00″");
    validate();
    expect(onRecovery).toHaveBeenCalledWith(300);
  });

  it("Durée de l'exercice au clavier : Inversion appliquée à la sortie du champ", () => {
    renderSheet(params({ sideMode: "UNILATERAL" }), false);
    const before = text("execution-sheet-total");
    enterExecutionSheetValue("execution-sheet-total", 5 * 60);
    expect(text("execution-sheet-total")).not.toBe(before);
  });

  it("Retour arrière supprime le dernier chiffre", () => {
    renderSheet();
    openExecutionSheetField("execution-sheet-pause");
    typeInExecutionSheetCell("execution-sheet-pause", `45${CELL_BACKSPACE}`);
    expect(text("execution-sheet-pause")).toBe("00:04");
  });

  it("barre du clavier (iOS) : Suivant passe au champ hors tableau suivant, dans l'ordre de la Feuille", () => {
    const os = Platform.OS;
    Object.defineProperty(Platform, "OS", { configurable: true, get: () => "ios" });
    try {
      renderSheet();
      openExecutionSheetField("execution-sheet-series");
      showExecutionSheetKeyboard();
      expect(query("execution-sheet-keyboard-bar")).not.toBeNull();
      expect(get("execution-sheet-keyboard-previous").props.accessibilityState).toMatchObject({ disabled: true });
      fireEvent.press(get("execution-sheet-keyboard-next"));
      expect(get("execution-sheet-target").props.accessibilityState).toMatchObject({ selected: true });
      fireEvent.press(get("execution-sheet-keyboard-next"));
      expect(get("execution-sheet-pause").props.accessibilityState).toMatchObject({ selected: true });
      fireEvent.press(get("execution-sheet-keyboard-next"));
      expect(get("execution-sheet-side-recovery").props.accessibilityState).toMatchObject({ selected: true });
    } finally {
      Object.defineProperty(Platform, "OS", { configurable: true, get: () => os });
    }
  });
});
