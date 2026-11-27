import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render, screen } from "@testing-library/react-native";
import { NavigationContext } from "expo-router/react-navigation";
import { Text } from "react-native";

import { HOST_SCREEN_SETTLE_FALLBACK_MS, useHostScreenFocused } from "@/shared/ui/useHostScreenFocused";

/**
 * Remarque e du 26/11/2026 : la modale des paramètres d'exécution est retirée pendant qu'un écran ouvert d'ailleurs (rappel
 * touché) recouvre son écran hôte, puis présentée de nouveau au retour. Recette du 26/11/2026 (après-midi) : au retour, elle
 * n'est présentée de nouveau qu'à la fin de la transition native (`transitionEnd` de l'écran ou d'un navigateur parent), au plus
 * tard après le délai de secours — pas dès `focus`. Jest ne prouve pas le comportement sur iPhone.
 */
function Probe() {
  return <Text testID="probe">{useHostScreenFocused() ? "focused" : "covered"}</Text>;
}

type Handler = (event?: { data?: { closing?: boolean } }) => void;
type FakeNavigation = {
  addListener: (event: string, handler: Handler) => () => void;
  getParent: () => FakeNavigation | undefined;
  emit: (event: string, data?: { closing?: boolean }) => void;
  count: () => number;
};

function fakeNavigation(parent?: FakeNavigation): FakeNavigation {
  const listeners = new Map<string, Set<Handler>>();
  return {
    addListener: (event, handler) => {
      const set = listeners.get(event) ?? new Set();
      set.add(handler);
      listeners.set(event, set);
      return () => set.delete(handler);
    },
    getParent: () => parent,
    emit: (event, data) => listeners.get(event)?.forEach((handler) => handler(data === undefined ? undefined : { data })),
    count: () => [...listeners.values()].reduce((total, set) => total + set.size, 0),
  };
}

function renderWith(navigation: FakeNavigation) {
  return render(
    <NavigationContext.Provider value={navigation as never}>
      <Probe />
    </NavigationContext.Provider>,
  );
}

const shown = () => String(screen.getByTestId("probe").props.children);

describe("useHostScreenFocused (remarque e du 26/11/2026, recette du 26/11 après-midi)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("hors navigateur (test isolé) : toujours au premier plan", () => {
    render(<Probe />);
    expect(shown()).toBe("focused");
  });

  it("recouvert (blur) puis revenu : reste retiré pendant la transition de retour, revient à sa fin ; écoutes retirées au démontage", () => {
    const navigation = fakeNavigation();
    const { unmount } = renderWith(navigation);
    expect(shown()).toBe("focused");
    act(() => navigation.emit("blur"));
    expect(shown()).toBe("covered");
    // `focus` arrive avant la transition native : la Modal n'est pas encore présentée de nouveau.
    act(() => navigation.emit("focus"));
    expect(shown()).toBe("covered");
    // Fin d'une transition de fermeture : ignorée.
    act(() => navigation.emit("transitionEnd", { closing: true }));
    expect(shown()).toBe("covered");
    act(() => navigation.emit("transitionEnd", { closing: false }));
    expect(shown()).toBe("focused");
    unmount();
    expect(navigation.count()).toBe(0);
  });

  it("écran hôte imbriqué (Composition dans `(creation)`) : la fin de transition du navigateur parent suffit", () => {
    const root = fakeNavigation();
    const nested = fakeNavigation(root);
    const { unmount } = renderWith(nested);
    act(() => nested.emit("blur"));
    act(() => nested.emit("focus"));
    expect(shown()).toBe("covered");
    act(() => root.emit("transitionEnd", { closing: false }));
    expect(shown()).toBe("focused");
    unmount();
    expect(root.count() + nested.count()).toBe(0);
  });

  it("sans fin de transition signalée : présentée de nouveau après le délai de secours, pas avant", () => {
    const navigation = fakeNavigation();
    renderWith(navigation);
    act(() => navigation.emit("blur"));
    act(() => navigation.emit("focus"));
    act(() => {
      jest.advanceTimersByTime(HOST_SCREEN_SETTLE_FALLBACK_MS - 1);
    });
    expect(shown()).toBe("covered");
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(shown()).toBe("focused");
  });

  it("recouvert de nouveau avant la fin du délai : reste retiré (délai annulé)", () => {
    const navigation = fakeNavigation();
    renderWith(navigation);
    act(() => navigation.emit("blur"));
    act(() => navigation.emit("focus"));
    act(() => navigation.emit("blur"));
    act(() => {
      jest.advanceTimersByTime(HOST_SCREEN_SETTLE_FALLBACK_MS * 2);
    });
    expect(shown()).toBe("covered");
    // Une fin de transition sans retour au premier plan ne présente rien.
    act(() => navigation.emit("transitionEnd", { closing: false }));
    expect(shown()).toBe("covered");
  });
});
