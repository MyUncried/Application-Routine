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
/**
 * V2-CAT-01 (UI-CAT-R-005/006) : signal PONCTUEL `catalogueSegment`, tel que
 * transmis par `CategoriesScreen.handleSave` (`dismissTo`) — `{}` par défaut
 * (aucun test existant n'en a besoin), réglé explicitement par les tests qui
 * l'exercent, puis réinitialisé par `beforeEach`.
 */
let mockSearchParams: { catalogueSegment?: string } = {};
/** Reproduit fidèlement le comportement réel de `router.setParams` : applique le correctif à l'état de route observé par `useLocalSearchParams`. */
const mockSetParams = jest.fn((patch: Record<string, string | undefined>) => {
  mockSearchParams = { ...mockSearchParams, ...patch };
});

jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useFocusEffect: (effect: () => (() => void) | void) => {
      focusEffectHarness.effect = effect;
    },
    useRouter: () => ({ push: mockPush, setParams: mockSetParams }),
    useLocalSearchParams: () => mockSearchParams,
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
  const element = (
    <TestSafeAreaProvider>
      <SessionServiceContext.Provider value={service}>
        <ActivityDefinitionServiceContext.Provider value={activityService}>
          <CatalogueScreen />
        </ActivityDefinitionServiceContext.Provider>
      </SessionServiceContext.Provider>
    </TestSafeAreaProvider>
  );
  const result = render(element);
  // V2-CAT-01 (UI-CAT-R-005/006) : `rerender` SANS argument — reconstruit le
  // MÊME arbre pour forcer un nouveau rendu qui relit `useLocalSearchParams`
  // (mocké via une variable externe, non réactive par elle-même) ; nécessaire
  // pour observer un changement de `mockSearchParams` entre deux focus.
  return { ...result, rerender: () => result.rerender(element) };
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
  mockSetParams.mockClear();
  mockSearchParams = {};
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
    // Géométrie déjà couverte par ailleurs (UI-CAT-001, D-184) — revérifiée
    // ici pour prouver qu'elle n'a pas régressé avec ce changement de fond.
    expect(flattened.width).toBe(108);
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
    // V2-CAT-01 (retour indépendant, minuteurs Jest) : ce changement de
    // segment démarre l'indicateur animé de `SegmentedControl`
    // (`Animated.timing`, 220 ms, minuteurs RÉELS — hors périmètre de
    // modification de ce composant). Laisser ce minuteur s'achever avant la
    // fin du test évite qu'il ne se déclenche après le démontage de
    // l'environnement Jest de ce fichier (avertissement `act()`
    // asynchrone, voire erreur d'environnement démonté sur certains
    // runners CI, notamment Linux).
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    expect(screen.getByText(strings.screens.activities.title)).toBeTruthy();
    expect(screen.getByText("Activité a")).toBeTruthy();
  });

  /**
   * V2-CAT-01 (UI-CAT-R-005/006) : le signal PONCTUEL `catalogueSegment`,
   * transmis par `CategoriesScreen.handleSave` via `dismissTo`, force le
   * retour déterministe sur `Séances` — INDÉPENDAMMENT du segment actif
   * avant l'ouverture du parcours de création — puis est consommé
   * exactement une fois (`router.setParams` l'efface).
   */
  it("forces the Séances segment on focus when the catalogueSegment signal is present, then consumes it exactly once", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);
    const { service: activityService, listActivityDefinitions } = makeFakeActivityService();
    listActivityDefinitions.mockResolvedValue([]);

    renderScreen(service, activityService);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Le segment actif avant l'ouverture du parcours de création était
    // `Activités` — jamais `Séances`. Le signal `catalogueSegment` est déjà
    // présent (représentatif de `dismissTo`) au moment de ce changement de
    // segment : sa seule présence ne suffit pas à agir — seul le FOCUS
    // suivant le consomme (voir plus bas), preuve qu'aucun effet de bord
    // n'a lieu avant le focus réel.
    mockSearchParams = { catalogueSegment: "sessions" };
    fireEvent.press(screen.getByLabelText(strings.screens.sessions.contentTypes.activities));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
    expect(
      screen.getByLabelText(strings.screens.sessions.contentTypes.activities).props
        .accessibilityState,
    ).toMatchObject({ selected: true });

    // Le focus suivant consomme le signal et force `Séances`.
    await act(async () => {
      simulateFocus();
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    expect(
      screen.getByLabelText(strings.screens.sessions.contentTypes.sessions).props
        .accessibilityState,
    ).toMatchObject({ selected: true });
    expect(mockSetParams).toHaveBeenCalledWith({ catalogueSegment: undefined });

    // Un focus ultérieur SANS nouveau signal (retour normal, par exemple
    // après l'édition d'une Activité) ne réapplique jamais ce forçage :
    // basculer à nouveau sur `Activités` puis refocaliser doit préserver
    // `Activités`, jamais revenir sur `Séances`.
    fireEvent.press(screen.getByLabelText(strings.screens.sessions.contentTypes.activities));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
    mockSetParams.mockClear();
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
    });
    expect(
      screen.getByLabelText(strings.screens.sessions.contentTypes.activities).props
        .accessibilityState,
    ).toMatchObject({ selected: true });
    expect(mockSetParams).not.toHaveBeenCalled();
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

  it("Créer has the exact D-184 visual frame (108×32, compact-secondary radius), and a real ≥48×48 touch target via hitSlop, not visual enlargement (UI-CAT-001, D-184)", async () => {
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
    expect(flattened.width).toBe(108);
    expect(flattened.height).toBe(32);
    expect(flattened.borderRadius).toBe(16);

    const hitSlop = createAction.props.hitSlop;
    expect(flattened.width + hitSlop.left + hitSlop.right).toBeGreaterThanOrEqual(48);
    expect(flattened.height + hitSlop.top + hitSlop.bottom).toBeGreaterThanOrEqual(48);
  });

  // Correction VISUAL_CORRECTION (revue iPhone du HEAD `cc1c618`, PR #181) :
  // preuve ciblée du mécanisme fautif diagnostiqué comme cause réelle de
  // « + Créer toujours inactif sur appareil réel ». Avec la géométrie
  // visuelle `90×32` précédente et `minTouchTarget = 48`, la formule
  // `(minTouchTarget − dimension) / 2` produisait un `hitSlop` NÉGATIF
  // (`(48 − 90) / 2 = −21`), qui RÉDUIT la zone tactile native au lieu de
  // l'agrandir — un défaut invisible pour `fireEvent.press`, qui invoque le
  // gestionnaire JS directement sans jamais passer par le calcul réel de
  // zone tactile de la plateforme. Ce test échouerait avec l'ancien calcul
  // non bridé et prouve que `hitSlop` ne peut plus jamais redevenir négatif,
  // quelle que soit la géométrie visuelle du bouton.
  it("never produces a negative hitSlop on any command action, the real cause of the button being unresponsive on device (fireEvent.press cannot reveal this)", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const testIDs = ["catalogue-create-action", "catalogue-filter-action", "catalogue-sort-action"];
    for (const testID of testIDs) {
      const action = screen.getByTestId(testID);
      const hitSlop = action.props.hitSlop;
      expect(hitSlop.top).toBeGreaterThanOrEqual(0);
      expect(hitSlop.bottom).toBeGreaterThanOrEqual(0);
      expect(hitSlop.left).toBeGreaterThanOrEqual(0);
      expect(hitSlop.right).toBeGreaterThanOrEqual(0);
    }
  });

  // Correction VISUAL_CORRECTION (Figma `G6RY5Ebhgwb4AHIOYDwwvg`, frame
  // `3786:5093`) : Filtrer (nœud `3947:5933`) et Trier (`Action/Utility`
  // type `Sort`) doivent chacun afficher leur pictogramme, plus la seule
  // étiquette texte qui existait jusqu'ici.
  it("renders the Filtrer and Trier pictograms alongside their labels (Figma frame 3786:5093)", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId("catalogue-filter-icon")).toBeTruthy();
    expect(screen.getByTestId("catalogue-sort-icon")).toBeTruthy();
  });

  // Correction VISUAL_CORRECTION (revue indépendante du HEAD `8dbe586`,
  // commentaire 5735387835) : contrat de rendu du pictogramme Trier —
  // au-delà de la seule présence d'un `testID`, prouve qu'il n'est PLUS un
  // glyphe de police (aucun texte `↕`, dont la forme et la disponibilité
  // varient d'une plateforme à l'autre) mais une composition vectorielle
  // stable : deux triangles pleins (bordures transparentes formant la
  // pointe) encadrant une tige. La commande `Trier` restant désactivée
  // dans cette tranche (recherche/filtre/tri fonctionnels hors périmètre),
  // ce test vérifie la géométrie, pas une couleur précise — la couleur de
  // l'état inerte (`colors.disabled`) est l'unique objet du test dédié
  // suivant.
  it("renders Trier as a stable vector shape (two solid triangles and a stem), not a font glyph (VISUAL_CORRECTION, comment 5735387835)", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const sortIcon = screen.getByTestId("catalogue-sort-icon");
    expect(within(sortIcon).queryByText("↕")).toBeNull();

    const arrowUp = screen.getByTestId("catalogue-sort-icon-arrow-up");
    const arrowDown = screen.getByTestId("catalogue-sort-icon-arrow-down");
    const stem = screen.getByTestId("catalogue-sort-icon-stem");

    const flattenedUp = StyleSheet.flatten(arrowUp.props.style);
    const flattenedDown = StyleSheet.flatten(arrowDown.props.style);
    const flattenedStem = StyleSheet.flatten(stem.props.style);

    // Triangle plein via bordures transparentes : une seule bordure colorée
    // (bas pour la pointe haute, haut pour la pointe basse), les bordures
    // latérales restant transparentes, quelle que soit la couleur exacte.
    expect(flattenedUp.borderBottomWidth).toBeGreaterThan(0);
    expect(flattenedUp.borderLeftColor).toBe("transparent");
    expect(flattenedUp.borderRightColor).toBe("transparent");

    expect(flattenedDown.borderTopWidth).toBeGreaterThan(0);
    expect(flattenedDown.borderLeftColor).toBe("transparent");
    expect(flattenedDown.borderRightColor).toBe("transparent");

    expect(flattenedStem.width).toBeGreaterThan(0);
    expect(flattenedStem.height).toBeGreaterThan(0);
  });

  // Trier reste désactivé dans cette tranche : ce test est l'unique
  // vérification que la forme vectorielle passe bien à `colors.disabled`
  // pendant qu'elle reste inerte.
  it("dims the Trier vector shape to colors.disabled while it remains inert (VISUAL_CORRECTION, comment 5735387835)", async () => {
    const { service, listActiveSessions } = makeFakeService();
    listActiveSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const flattenedUp = StyleSheet.flatten(screen.getByTestId("catalogue-sort-icon-arrow-up").props.style);
    const flattenedDown = StyleSheet.flatten(screen.getByTestId("catalogue-sort-icon-arrow-down").props.style);
    const flattenedStem = StyleSheet.flatten(screen.getByTestId("catalogue-sort-icon-stem").props.style);

    expect(flattenedUp.borderBottomColor).toBe(colors.disabled);
    expect(flattenedDown.borderTopColor).toBe(colors.disabled);
    expect(flattenedStem.backgroundColor).toBe(colors.disabled);
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
