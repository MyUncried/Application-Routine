import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { NavigationContext } from "expo-router/react-navigation";

import { numberTarget, type ExecutionParameters, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Recette iPhone du 26/11/2026 (après-midi, Hermann : « Modale des paramètres ouverte - notification routine, appui dessus,
 * affichage de la page de démarrage d'une séance, appui sur retour > composition de séance, la modale est fermée, je ne peux pas
 * ouvrir les paramètres d'exécution ou faire d'autres actions ») : pendant le recouvrement, la `Modal` n'est pas montée du tout
 * (sa vue hôte plein écran ne peut plus rester dans l'écran hôte sans feuille) ; au retour, elle revient à la fin de la
 * transition et ses commandes ✕ / ✓ agissent. Jest ne prouve ni la présentation native ni les touchers sur iPhone.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

type Handler = (event?: { data?: { closing?: boolean } }) => void;

function fakeNavigation() {
  const listeners = new Map<string, Set<Handler>>();
  return {
    addListener: (event: string, handler: Handler) => {
      const set = listeners.get(event) ?? new Set();
      set.add(handler);
      listeners.set(event, set);
      return () => set.delete(handler);
    },
    getParent: () => undefined,
    emit: (event: string, data?: { closing?: boolean }) => listeners.get(event)?.forEach((handler) => handler(data === undefined ? undefined : { data })),
  };
}

const parent: ExecutionParametersInput = {
  version: 5,
  mode: "DURATION",
  series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 60, loadKg: 0, workPhases: [] },
  sideMode: "UNILATERAL",
  sideOrder: "BY_SIDE",
  sideRecoverySeconds: 0,
  cadenceBeepIntervalSeconds: 0,
  countdownSeconds: 10,
  endSeconds: 5,
  loadEnabled: false,
};

const hidden = { includeHiddenElements: true } as const;

function renderHosted() {
  const navigation = fakeNavigation();
  const onApply = jest.fn<(value: ExecutionParameters) => void>();
  const onCancel = jest.fn();
  render(
    <NavigationContext.Provider value={navigation as never}>
      <TestSafeAreaProvider>
        <ExecutionParametersSheet parent={parent} profileSideRecoverySecondsDefault={10} onApply={onApply} onCancel={onCancel} />
      </TestSafeAreaProvider>
    </NavigationContext.Provider>,
  );
  /** Rappel touché : l'Exécution recouvre l'écran hôte, puis « Retour » la referme (transition native terminée). */
  const coverThenReturn = () => {
    act(() => navigation.emit("blur"));
    expect(screen.queryByTestId("execution-sheet-modal", hidden)).toBeNull();
    act(() => navigation.emit("focus"));
    // Transition de retour en cours : toujours rien de monté (aucune vue hôte de Modal sans feuille).
    expect(screen.queryByTestId("execution-sheet-modal", hidden)).toBeNull();
    act(() => navigation.emit("transitionEnd", { closing: false }));
  };
  return { onApply, onCancel, coverThenReturn };
}

describe("ExecutionParametersSheet — retour d'un écran ouvert par un rappel (recette du 26/11/2026, après-midi)", () => {
  it("modale démontée pendant le recouvrement, présentée de nouveau au retour : ✕ referme", () => {
    const { onCancel, coverThenReturn } = renderHosted();
    expect(screen.getByTestId("execution-sheet-modal", hidden)).toBeTruthy();
    coverThenReturn();
    expect(screen.getByTestId("execution-sheet-modal", hidden).props.visible).toBe(true);
    fireEvent.press(screen.getByTestId("execution-sheet-cancel", hidden));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("après le retour, ✓ applique les paramètres", () => {
    const { onApply, coverThenReturn } = renderHosted();
    coverThenReturn();
    fireEvent.press(screen.getByTestId("execution-sheet-validate", hidden));
    expect(onApply).toHaveBeenCalledTimes(1);
  });
});
