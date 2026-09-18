import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import type { ActivityDefinition } from "@/domain/activities";
import type { SessionSummary } from "@/domain/sessions/Session";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { CatalogueScreen } from "@/features/sessions/CatalogueScreen";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import type { SessionService } from "@/features/sessions/SessionService";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
import { colors } from "@/shared/ui/tokens";

/**
 * Seul `expo-router` est mocké (frontière de navigation). Les hooks réels
 * `useSessionCatalogue`/`useActivityCatalogue` et des services fictifs
 * contrôlables sont utilisés partout ailleurs : ces tests exercent donc
 * l'intégration réelle écran + hooks + services, pas seulement des props
 * injectées.
 *
 * V2-CAT-01 : le segment `Activités` devient fonctionnel — `useActivityCatalogue`
 * exige désormais un `ActivityDefinitionServiceContext`, fourni ici par un
 * service fictif contrôlable, au même titre que `SessionServiceContext`.
 */
const focusEffectHarness: { effect: (() => (() => void) | void) | null } = { effect: null };
const mockPush = jest.fn();

jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useFocusEffect: (effect: () => (() => void) | void) => {
      focusEffectHarness.effect = effect;
    },
    useRouter: () => ({ push: mockPush }),
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
    isEstimatedDurationApproximate: false,
    tourRepeatCount: 1,
    updatedAt: "2026-01-01T00:00:00.000Z",
    categoryNames: [],
    bodyZoneNames: [],
  };
}

function aDefinition(id: string): ActivityDefinition {
  return {
    id,
    name: `Activité ${id}`,
    description: null,
    executionMode: "DURATION",
    durationSeconds: 30,
    repetitionCount: null,
    seriesCount: 1,
    pauseSeconds: 0,
    recoverySeconds: 0,
    bodyZoneIds: [],
    sideMode: "UNILATERAL",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function makeFakeService() {
  const listActiveSessions = jest.fn<() => Promise<readonly SessionSummary[]>>();
  const service = { listActiveSessions } as unknown as SessionService;
  return { service, listActiveSessions };
}

function makeFakeActivityService() {
  const listActivityDefinitions = jest
    .fn<() => Promise<readonly ActivityDefinition[]>>()
    .mockResolvedValue([]);
  const service = { listActivityDefinitions } as unknown as ActivityDefinitionService;
  return { service, listActivityDefinitions };
}

function renderScreen(
  service: SessionService,
  activityService: ActivityDefinitionService = makeFakeActivityService().service,
) {
  return render(
    <TestSafeAreaProvider>
      <SessionServiceContext.Provider value={service}>
        <ActivityDefinitionServiceContext.Provider value={activityService}>
          <CatalogueScreen />
        </ActivityDefinitionServiceContext.Provider>
      </SessionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
}

/** Simule un focus réel : invoque le callback capturé, capture son nettoyage. */
function simulateFocus(): (() => void) | void {
  if (!focusEffectHarness.effect) {
    throw new Error("No useFocusEffect callback captured yet.");
  }
  return focusEffectHarness.effect();
}

beforeEach(() => {
  mockPush.mockClear();
});

describe("CatalogueScreen — cadre commun", () => {
  it("displays the title, the full segment selector, and the active Créer action in every state", async () => {
    const { service, listActiveSessions } = makeFakeService();
    const pending = deferred<readonly SessionSummary[]>();
    listActiveSessions.mockReturnValue(pending.promise);

    renderScreen(service);
    act(() => {
      simulateFocus();
    });

    // Still loading: the frame is already present.
    const types = strings.screens.sessions.contentTypes;
    expect(screen.getByText(strings.screens.sessions.title)).toBeTruthy();
    expect(screen.getByLabelText(types.sessions)).toBeTruthy();
    expect(screen.getByLabelText(types.activities)).toBeTruthy();
    expect(
      screen.getByLabelText(types.circuitsUnavailableAccessibilityLabel),
    ).toBeTruthy();
    expect(screen.getByLabelText(strings.screens.sessions.createAction)).toBeTruthy();

    await act(async () => {
      pending.resolve([]);
      await Promise.resolve();
      await Promise.resolve();
    });

    // Empty now, frame still present.
    expect(screen.getByText(strings.screens.sessions.title)).toBeTruthy();
    expect(screen.getByLabelText(types.sessions)).toBeTruthy();
    expect(screen.getByLabelText(strings.screens.sessions.createAction)).toBeTruthy();
  });

  it("recomposes the Shell — fixed Header with the title, a separator immediately below, and a Context band (distinct background) holding the segments and the command row (LAY-01, Phase 1; Shell Foundation partagé, CMP-01)", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const header = screen.getByTestId("screen-header");
    expect(within(header).getByText(strings.screens.sessions.title)).toBeTruthy();

    // Séparateur : présent, distinct du fond général (container est
    // `colors.background`, blanc — le séparateur ne doit jamais l'être).
    const separator = screen.getByTestId("screen-header-separator");
    expect(StyleSheet.flatten(separator.props.style).backgroundColor).not.toBe(colors.background);

    // Bande Context : fond distinct du fond général, contient le sélecteur
    // de segments ET l'action Créer (pas seulement l'un des deux).
    const contextBand = screen.getByTestId("screen-context-band");
    expect(StyleSheet.flatten(contextBand.props.style).backgroundColor).not.toBe(colors.background);
    expect(
      within(contextBand).getByLabelText(strings.screens.sessions.contentTypes.sessions),
    ).toBeTruthy();
    expect(within(contextBand).getByLabelText(strings.screens.sessions.createAction)).toBeTruthy();

    // Le titre du Header n'est jamais dupliqué dans la bande Context.
    expect(within(contextBand).queryByText(strings.screens.sessions.title)).toBeNull();
  });

  it("keeps the segmented control's own container white, distinct from the pale Context band behind it (CAT-R01, contre-recette iPhone 2026-09-03)", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const filterRow = screen.getByTestId("catalogue-content-type-row");
    expect(StyleSheet.flatten(filterRow.props.style).backgroundColor).toBe(colors.background);

    // Le segment sélectionné (`Séances`, au centre) reste annoncé comme tel,
    // et son texte reste blanc — non touché par le passage au sélecteur de
    // type. Le fond bleu/violet DS est désormais porté par le cadre animé
    // unique (V2-CAT-01, revue 5732014381 obligation 3), jamais par le
    // segment lui-même.
    const selected = screen.getByLabelText(strings.screens.sessions.contentTypes.sessions);
    expect(selected.props.accessibilityState).toMatchObject({ selected: true });

    fireEvent(filterRow, "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 354, height: 42 } } });
    const indicator = screen.getByTestId("catalogue-content-type-row-indicator");
    expect(StyleSheet.flatten(indicator.props.style).backgroundColor).toBe(colors.selection);
  });

  it("gives Créer its own white background instead of letting the Context band's pale tint show through (CAT-R02, contre-recette iPhone 2026-09-03)", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const createAction = screen.getByLabelText(strings.screens.sessions.createAction);
    const flattened = StyleSheet.flatten(createAction.props.style);
    expect(flattened.backgroundColor).toBe(colors.background);
    expect(flattened.borderColor).toBe(colors.primary);
    // Géométrie déjà couverte par ailleurs (UI-CAT-001) — revérifiée ici
    // pour prouver qu'elle n'a pas régressé avec ce changement de fond.
    expect(flattened.width).toBe(90);
    expect(flattened.height).toBe(32);
    expect(flattened.borderRadius).toBe(16);
  });

  it("places the empty-state text inside a dedicated frame (surface/border/radius), not floating alone in the body (CAT-R03, contre-recette iPhone 2026-09-03)", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const frame = screen.getByTestId("catalogue-empty-frame");
    const flattened = StyleSheet.flatten(frame.props.style);
    expect(flattened.backgroundColor).not.toBe(colors.background);
    expect(flattened.borderWidth).toBeGreaterThan(0);
    expect(flattened.borderRadius).toBeGreaterThan(0);

    // Le texte est un enfant du cadre, pas un frère isolé dans le corps.
    expect(within(frame).getByText(strings.screens.sessions.empty.message)).toBeTruthy();
  });

  it("reserves the real navigation footprint at the bottom of the body, so the empty-state frame centers only between the Context band and the Bottom Shell (CAT-R04, contre-recette iPhone 2026-09-03)", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const body = screen.getByTestId("catalogue-body");
    const flattened = StyleSheet.flatten(body.props.style);
    expect(flattened.paddingBottom).toBe(navigationBarTotalHeight());
  });

  it("marks Séances as selected (centre) at first render, and Circuits as disabled with an explicit unavailable label, with no navigation when pressed (T01-S10/V2-CAT-01, D-108)", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const types = strings.screens.sessions.contentTypes;
    const row = screen.getByTestId("catalogue-content-type-row");
    const options = within(row).getAllByRole("tab");
    expect(options).toHaveLength(3);
    // `Séances` est le segment central.
    expect(options[1]?.props.accessibilityLabel).toBe(types.sessions);

    const sessionsTab = screen.getByLabelText(types.sessions);
    const circuitsTab = screen.getByLabelText(types.circuitsUnavailableAccessibilityLabel);

    expect(sessionsTab.props.accessibilityState).toMatchObject({ selected: true });
    expect(circuitsTab.props.accessibilityState).toMatchObject({ disabled: true, selected: false });

    fireEvent.press(circuitsTab);

    expect(mockPush).not.toHaveBeenCalled();
    // Toujours sur Séances : Circuit ne déclenche aucune navigation.
    expect(screen.getByLabelText(types.sessions).props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it("activates the Activités segment and loads persisted ActivityDefinition (V2-CAT-01)", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);
    const { service: activityService, listActivityDefinitions } = makeFakeActivityService();
    listActivityDefinitions.mockResolvedValue([aDefinition("a")]);

    renderScreen(service, activityService);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    fireEvent.press(screen.getByLabelText(strings.screens.sessions.contentTypes.activities));
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(strings.screens.activities.title)).toBeTruthy();
    expect(screen.getByText("Activité a")).toBeTruthy();
  });

  it("opens the Créer tree, and navigates to Composition d'une séance when 'Une séance' is selected (T01-S07, V2-CAT-01)", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const createAction = screen.getByLabelText(strings.screens.sessions.createAction);
    expect(createAction.props.accessibilityState?.disabled).toBeFalsy();

    fireEvent.press(createAction);
    expect(screen.getByTestId("catalogue-create-tree")).toBeTruthy();

    fireEvent.press(screen.getByTestId("catalogue-create-tree-new-session"));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/composition");
  });

  it("navigates to the new-activity editor when 'Une nouvelle activité' is selected from the Créer tree", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    fireEvent.press(screen.getByLabelText(strings.screens.sessions.createAction));
    fireEvent.press(screen.getByTestId("catalogue-create-tree-new-activity"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/exercise",
      params: { catalogueDefinitionId: "new" },
    });
  });

  it("Créer has the exact CE-T01-02 visual frame (90×32, compact-secondary radius), and a real ≥48×48 touch target via hitSlop, not visual enlargement (UI-CAT-001)", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const createAction = screen.getByLabelText(strings.screens.sessions.createAction);
    const flattened = StyleSheet.flatten(createAction.props.style);
    expect(flattened.width).toBe(90);
    expect(flattened.height).toBe(32);
    expect(flattened.borderRadius).toBe(16);

    const hitSlop = createAction.props.hitSlop;
    expect(flattened.width + hitSlop.left + hitSlop.right).toBeGreaterThanOrEqual(48);
    expect(flattened.height + hitSlop.top + hitSlop.bottom).toBeGreaterThanOrEqual(48);
  });

  it("pressing Séances (already selected) changes nothing: no reload, no navigation", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const sessionsTab = screen.getByLabelText(strings.screens.sessions.contentTypes.sessions);
    expect(sessionsTab.props.accessibilityState).toMatchObject({ selected: true });

    const callsBefore = listActiveSessions.mock.calls.length;
    const emptyMessageBefore = screen.getByText(strings.screens.sessions.empty.message);

    fireEvent.press(sessionsTab);

    expect(listActiveSessions.mock.calls.length).toBe(callsBefore);
    expect(sessionsTab.props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByText(strings.screens.sessions.empty.message)).toBe(emptyMessageBefore);
    expect(mockPush).not.toHaveBeenCalled();
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

  it("opening a card's main area navigates to Composition passing only that sessionId (T01-S10, CE-T01-S10-01)", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([aSummary("card-a"), aSummary("card-b")]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const openAreas = screen.getAllByTestId("session-card-open");
    expect(openAreas).toHaveLength(2);
    fireEvent.press(openAreas[1]!);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/composition",
      params: { sessionId: "card-b" },
    });
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
