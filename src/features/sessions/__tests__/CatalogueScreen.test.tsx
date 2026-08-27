import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import type { SessionSummary } from "@/domain/sessions/Session";
import { CatalogueScreen } from "@/features/sessions/CatalogueScreen";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import type { SessionService } from "@/features/sessions/SessionService";
import { strings } from "@/shared/i18n";

/**
 * Seul `expo-router` est mocké (frontière de navigation). Le hook réel
 * `useSessionCatalogue` et un `SessionService` fictif contrôlable sont
 * utilisés partout ailleurs : ces tests exercent donc l'intégration réelle
 * écran + hook + service, pas seulement des props injectées.
 *
 * Le mock de `useFocusEffect` capture le callback et sa fonction de
 * nettoyage pour permettre de simuler séparément focus initial, blur et
 * nouveau focus — un mock qui se contenterait d'exécuter immédiatement le
 * callback une seule fois ne permettrait de prouver ni le rechargement au
 * retour sur l'onglet, ni l'invalidation au blur.
 */
const focusEffectHarness: { effect: (() => (() => void) | void) | null } = { effect: null };

jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useFocusEffect: (effect: () => (() => void) | void) => {
      focusEffectHarness.effect = effect;
    },
  };
});

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function aSummary(id: string): SessionSummary {
  return {
    id,
    name: `Séance ${id}`,
    color: "#3B82F6",
    activityCount: 1,
    estimatedDurationSeconds: 60,
    tourRepeatCount: 1,
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function makeFakeService() {
  const listActiveSessions = jest.fn<() => Promise<readonly SessionSummary[]>>();
  const service = { listActiveSessions } as unknown as SessionService;
  return { service, listActiveSessions };
}

function renderScreen(service: SessionService) {
  return render(
    <SessionServiceContext.Provider value={service}>
      <CatalogueScreen />
    </SessionServiceContext.Provider>,
  );
}

/** Simule un focus réel : invoque le callback capturé, capture son nettoyage. */
function simulateFocus(): (() => void) | void {
  if (!focusEffectHarness.effect) {
    throw new Error("No useFocusEffect callback captured yet.");
  }
  return focusEffectHarness.effect();
}

describe("CatalogueScreen — cadre commun", () => {
  it("displays the title, the full filter selector, and the disabled Créer action in every state", async () => {
    const { service, listActiveSessions } = makeFakeService();
    const pending = deferred<readonly SessionSummary[]>();
    listActiveSessions.mockReturnValue(pending.promise);

    renderScreen(service);
    act(() => {
      simulateFocus();
    });

    // Still loading: the frame is already present.
    expect(screen.getByText(strings.screens.sessions.title)).toBeTruthy();
    expect(screen.getByLabelText(strings.screens.sessions.filters.all)).toBeTruthy();
    expect(screen.getByLabelText(strings.screens.sessions.filters.scheduled)).toBeTruthy();
    expect(screen.getByLabelText(strings.screens.sessions.filters.archived)).toBeTruthy();
    expect(screen.getByLabelText(strings.screens.sessions.createAction)).toBeTruthy();

    await act(async () => {
      pending.resolve([]);
      await Promise.resolve();
      await Promise.resolve();
    });

    // Empty now, frame still present.
    expect(screen.getByText(strings.screens.sessions.title)).toBeTruthy();
    expect(screen.getByLabelText(strings.screens.sessions.filters.all)).toBeTruthy();
    expect(screen.getByLabelText(strings.screens.sessions.createAction)).toBeTruthy();
  });

  it("marks Toutes as selected and Planifiées/Archivées as disabled, with no Service call when pressed", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const all = screen.getByLabelText(strings.screens.sessions.filters.all);
    const scheduled = screen.getByLabelText(strings.screens.sessions.filters.scheduled);
    const archived = screen.getByLabelText(strings.screens.sessions.filters.archived);
    const createAction = screen.getByLabelText(strings.screens.sessions.createAction);

    expect(all.props.accessibilityState).toMatchObject({ selected: true });
    expect(scheduled.props.accessibilityState).toMatchObject({ disabled: true, selected: false });
    expect(archived.props.accessibilityState).toMatchObject({ disabled: true, selected: false });
    expect(createAction.props.accessibilityState).toMatchObject({ disabled: true });

    const callsBefore = listActiveSessions.mock.calls.length;
    fireEvent.press(scheduled);
    fireEvent.press(archived);
    fireEvent.press(createAction);

    // No navigation, no additional Service call from any disabled control.
    expect(listActiveSessions.mock.calls.length).toBe(callsBefore);
  });

  it("pressing Toutes (already selected) changes nothing: no re-render effect, no reload, no navigation", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const all = screen.getByLabelText(strings.screens.sessions.filters.all);
    expect(all.props.accessibilityState).toMatchObject({ selected: true });

    // Structural proof, not just the declared accessibility state: this
    // control has no `onPress` at all in the current implementation — the
    // only way a press could ever trigger a reload, a navigation, or any
    // other business effect is through such a prop, and it does not exist.
    expect(all.props.onPress).toBeUndefined();

    const callsBefore = listActiveSessions.mock.calls.length;
    const emptyMessageBefore = screen.getByText(strings.screens.sessions.empty.message);

    fireEvent.press(all);

    // Behavioural confirmation, not just the structural one above: no new
    // Service call, the selection state is unchanged, and the displayed
    // content (still the empty state) is unaffected — nothing was
    // re-triggered by the press. No navigation function is imported
    // anywhere in this feature (verified separately by inspection: the
    // only `expo-router` import in `CatalogueScreen.tsx` is
    // `useFocusEffect`), so there is structurally nothing a press here
    // could navigate to either.
    expect(listActiveSessions.mock.calls.length).toBe(callsBefore);
    expect(all.props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByText(strings.screens.sessions.empty.message)).toBe(emptyMessageBefore);
  });
});

describe("CatalogueScreen — quatre états", () => {
  it("shows the loading indicator immediately after focus, before resolution", () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockReturnValue(new Promise(() => {}));

    renderScreen(service);
    act(() => {
      simulateFocus();
    });

    expect(
      screen.getByLabelText(strings.screens.sessions.loading.accessibilityLabel),
    ).toBeTruthy();
  });

  it("shows the exact empty message when no session is returned", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText(strings.screens.sessions.empty.message)).toBeTruthy();
  });

  it("shows a distinct error message and an active Réessayer button on rejection", async () => {
    const { service, listActiveSessions } = makeFakeService();
    const failure = new Error("boom");
    listActiveSessions.mockRejectedValueOnce(failure);
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      renderScreen(service);
      await act(async () => {
        simulateFocus();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(screen.getByText(strings.screens.sessions.error.message)).toBeTruthy();
      expect(screen.queryByText(strings.screens.sessions.empty.message)).toBeNull();

      const retry = screen.getByLabelText(strings.screens.sessions.error.retry);
      const [reloadedSessions] = [[aSummary("after-retry")]];
      listActiveSessions.mockResolvedValueOnce(reloadedSessions);

      await act(async () => {
        fireEvent.press(retry);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(listActiveSessions).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Séance after-retry")).toBeTruthy();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("renders exactly one SessionCard per returned session when ready", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([aSummary("a"), aSummary("b")]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText("Séance a")).toBeTruthy();
    expect(screen.getByText("Séance b")).toBeTruthy();
  });
});

describe("CatalogueScreen — cycle focus/blur/focus/démontage", () => {
  it("reloads on initial focus, invalidates the in-flight request on blur, and reloads again authoritatively on the next focus", async () => {
    const { service, listActiveSessions } = makeFakeService();
    const first = deferred<readonly SessionSummary[]>();
    const second = deferred<readonly SessionSummary[]>();
    listActiveSessions.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    renderScreen(service);

    // 1. Focus initial.
    let cleanupAfterFirstFocus: (() => void) | void;
    act(() => {
      cleanupAfterFirstFocus = simulateFocus();
    });
    expect(listActiveSessions).toHaveBeenCalledTimes(1);
    expect(
      screen.getByLabelText(strings.screens.sessions.loading.accessibilityLabel),
    ).toBeTruthy();

    // 2. Blur — invalidates the request currently in flight.
    act(() => {
      cleanupAfterFirstFocus?.();
    });

    // The first request resolves late: it must be ignored (still loading,
    // not switched to ready/empty by this stale resolution).
    await act(async () => {
      first.resolve([aSummary("stale")]);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(
      screen.getByLabelText(strings.screens.sessions.loading.accessibilityLabel),
    ).toBeTruthy();
    expect(screen.queryByText("Séance stale")).toBeNull();

    // 3. Nouveau focus — déclenche un chargement indépendant, qui fait autorité.
    act(() => {
      simulateFocus();
    });
    expect(listActiveSessions).toHaveBeenCalledTimes(2);

    await act(async () => {
      second.resolve([aSummary("fresh")]);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText("Séance fresh")).toBeTruthy();
    expect(screen.queryByText("Séance stale")).toBeNull();
  });

  it("does not throw when the screen unmounts", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    const { unmount } = renderScreen(service);
    act(() => {
      simulateFocus();
    });

    expect(() => unmount()).not.toThrow();
  });
});
