import { describe, expect, it } from "@jest/globals";
import { act, render, screen } from "@testing-library/react-native";
import { NavigationContext } from "expo-router/react-navigation";
import { Text } from "react-native";

import { useHostScreenFocused } from "@/shared/ui/useHostScreenFocused";

/**
 * Remarque e du 26/11/2026 : la modale des paramètres d'exécution est retirée pendant qu'un écran poussé d'ailleurs (rappel
 * touché) recouvre son écran hôte, puis présentée de nouveau au retour. Jest ne prouve pas le comportement sur iPhone.
 */
function Probe() {
  return <Text testID="probe">{useHostScreenFocused() ? "focused" : "covered"}</Text>;
}

function fakeNavigation() {
  const listeners = new Map<string, Set<() => void>>();
  return {
    addListener: (event: string, handler: () => void) => {
      const set = listeners.get(event) ?? new Set();
      set.add(handler);
      listeners.set(event, set);
      return () => set.delete(handler);
    },
    emit: (event: string) => listeners.get(event)?.forEach((handler) => handler()),
    count: () => [...listeners.values()].reduce((total, set) => total + set.size, 0),
  };
}

describe("useHostScreenFocused (remarque e du 26/11/2026)", () => {
  it("hors navigateur (test isolé) : toujours au premier plan", () => {
    render(<Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("focused");
  });

  it("recouvert par un écran poussé (blur) puis revenu (focus) : faux puis vrai ; écoutes retirées au démontage", () => {
    const navigation = fakeNavigation();
    const { unmount } = render(
      <NavigationContext.Provider value={navigation as never}>
        <Probe />
      </NavigationContext.Provider>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("focused");
    act(() => navigation.emit("blur"));
    expect(screen.getByTestId("probe")).toHaveTextContent("covered");
    act(() => navigation.emit("focus"));
    expect(screen.getByTestId("probe")).toHaveTextContent("focused");
    unmount();
    expect(navigation.count()).toBe(0);
  });
});
