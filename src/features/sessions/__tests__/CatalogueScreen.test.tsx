import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import type { ActivityDefinition } from "@/domain/activities";
import type { CatalogueSessionRecord } from "@/domain/sessions/SessionRepository";
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
 * transmis par `CompositionScreen.handleSave` (ex-`CategoriesScreen`, supprimé par Q54) (`dismissTo`) — `{}` par défaut
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

/** PRE-8 (E.1, E.2) : Séance lue par le Catalogue unifié (`listCatalogueSessions`). */
function aSummary(id: string): CatalogueSessionRecord {
  return {
    id,
    name: `Séance ${id}`,
    color: "#3B82F6",
    labelId: null,
    status: "ACTIVE",
    archivedAt: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
    structure: { elements: [], stopPoints: [] },
  };
}

function makeFakeService() {
  const listCatalogueSessions = jest.fn<() => Promise<readonly CatalogueSessionRecord[]>>();
  const service = { listCatalogueSessions } as unknown as SessionService;
  return { service, listCatalogueSessions };
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
    const { service, listCatalogueSessions } = makeFakeService();
    const pending = deferred<readonly CatalogueSessionRecord[]>();
    listCatalogueSessions.mockReturnValue(pending.promise);

    renderScreen(service);
    act(() => {
      simulateFocus();
    });

    // Still loading: the frame is already present.
    const types = strings.screens.sessions.contentTypes;
    expect(screen.getByText(strings.screens.sessions.title)).toBeTruthy();
    expect(screen.getByLabelText(types.sessions)).toBeTruthy();
    // PRE-8 (E.4, E.8-a) : trois segments, Programmes indisponible, plus de segment Exercices.
    expect(screen.queryByLabelText(types.activities)).toBeNull();
    expect(screen.getByLabelText(strings.screens.sessions.programsUnavailableAccessibilityLabel)).toBeTruthy();
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
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const header = screen.getByTestId("screen-header");
    expect(within(header).getByText(strings.screens.sessions.title)).toBeTruthy();

    // Recette 3 (T-49, D-356) : plus de séparateur gris sous l'en-tête du Catalogue
    // (auparavant : séparateur présent, de couleur distincte du fond).
    expect(screen.queryByTestId("screen-header-separator")).toBeNull();

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

  // Complément d'alignement du 07/10 (ajout C) : le cadre standard devient
  // blanc à 50 % (`color/background`, opacité de remplissage 0,5) — il reste
  // un fond propre au contrôle, plus clair que la zone de contexte.
  it("gives the segmented control its own white 50 % container over the pale Context band (CAT-R01, ajout C du 07/10)", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const filterRow = screen.getByTestId("catalogue-content-type-row");
    expect(StyleSheet.flatten(filterRow.props.style).backgroundColor).toBe(colors.segmentedSurface);
    expect(colors.segmentedSurface).toBe("rgba(255, 255, 255, 0.5)");

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
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);

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
    // Recette PRE-8 A/B (D01, ch13 §4.5) : cercle 34, rayon 17 — remplace le 108 × 32 de D-184.
    expect(flattened.width).toBe(34);
    expect(flattened.height).toBe(34);
    expect(flattened.borderRadius).toBe(17);
  });

  it("places the empty-state text inside a dedicated frame (surface/border/radius), not floating alone in the body (CAT-R03, contre-recette iPhone 2026-09-03)", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);

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
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);

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
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const types = strings.screens.sessions.contentTypes;
    const row = screen.getByTestId("catalogue-content-type-row");
    const options = within(row).getAllByRole("tab");
    // PRE-8 (E.4, spécification du 27/10 §4) : Mouvements, Séances, Programmes (indisponible).
    expect(options).toHaveLength(3);
    expect(options[0]?.props.accessibilityLabel).toBe(strings.screens.movement.catalogue.segment);
    expect(options[1]?.props.accessibilityLabel).toBe(types.sessions);

    const sessionsTab = screen.getByLabelText(types.sessions);
    const circuitsTab = screen.getByLabelText(strings.screens.sessions.programsUnavailableAccessibilityLabel);

    expect(sessionsTab.props.accessibilityState).toMatchObject({ selected: true });
    expect(circuitsTab.props.accessibilityState).toMatchObject({ disabled: true, selected: false });

    fireEvent.press(circuitsTab);

    expect(mockPush).not.toHaveBeenCalled();
    // Toujours sur Séances : Circuit ne déclenche aucune navigation.
    expect(screen.getByLabelText(types.sessions).props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it("E.8-a — aucun segment Exercices : le Catalogue ne lit plus les anciennes définitions", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);
    const { service: activityService, listActivityDefinitions } = makeFakeActivityService();

    renderScreen(service, activityService);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.queryByText(strings.screens.sessions.contentTypes.activities)).toBeNull();
    expect(screen.queryByTestId("catalogue-content-type-row-activities")).toBeNull();
    expect(listActivityDefinitions).not.toHaveBeenCalled();
  });

  /**
   * V2-CAT-01 (UI-CAT-R-005/006) : le signal PONCTUEL `catalogueSegment`,
   * transmis par `CompositionScreen.handleSave` (ex-`CategoriesScreen`, supprimé par Q54) via `dismissTo`, force le
   * retour déterministe sur `Séances` — INDÉPENDAMMENT du segment actif
   * avant l'ouverture du parcours de création — puis est consommé
   * exactement une fois (`router.setParams` l'efface).
   */
  it("forces the Séances segment on focus when the catalogueSegment signal is present, then consumes it exactly once", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);
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
    fireEvent.press(screen.getByLabelText(strings.screens.movement.catalogue.segment));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
    expect(
      screen.getByLabelText(strings.screens.movement.catalogue.segment).props
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
    fireEvent.press(screen.getByLabelText(strings.screens.movement.catalogue.segment));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
    mockSetParams.mockClear();
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
    });
    expect(
      screen.getByLabelText(strings.screens.movement.catalogue.segment).props
        .accessibilityState,
    ).toMatchObject({ selected: true });
    expect(mockSetParams).not.toHaveBeenCalled();
  });

  it("E.4 — sur le segment Séances, Créer ouvre directement la Composition existante ; double appui : une seule ouverture", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const createAction = screen.getByLabelText(strings.screens.sessions.createAction);
    expect(createAction.props.accessibilityState?.disabled).toBeFalsy();
    fireEvent.press(createAction);
    fireEvent.press(createAction);

    expect(screen.queryByTestId("catalogue-create-tree")).toBeNull();
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/composition");
  });

  it("renders Créer, Filtrer and Trier as 34 circles with a ≥44 touch target via hitSlop, not visual enlargement (recette PRE-8 A/B D01, ch13 §4.5)", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    for (const testID of ["catalogue-create-action", "catalogue-filter-action", "catalogue-sort-action"]) {
      const action = screen.getByTestId(testID);
      const flattened = StyleSheet.flatten(action.props.style);
      expect(flattened.width).toBe(34);
      expect(flattened.height).toBe(34);
      expect(flattened.borderRadius).toBe(17);
      const hitSlop = action.props.hitSlop;
      expect(flattened.width + hitSlop.left + hitSlop.right).toBeGreaterThanOrEqual(44);
      expect(flattened.height + hitSlop.top + hitSlop.bottom).toBeGreaterThanOrEqual(44);
    }
    expect(StyleSheet.flatten(screen.getByTestId("catalogue-command-row").props.style).gap).toBe(12);
    // Remarque 9 de la recette A/B du 27/10 : 8 sous les segments, comme sur `main`.
    expect(StyleSheet.flatten(screen.getByTestId("catalogue-command-row").props.style).marginTop).toBe(8);
  });

  it("shows Rechercher in the command row on the Mouvements segment only, with a clear cross once text is typed (recette PRE-8 A/B D02, D03)", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.queryByTestId("movement-catalogue-search")).toBeNull();
    fireEvent.press(screen.getByTestId("catalogue-content-type-row-movements"));
    const row = screen.getByTestId("catalogue-command-row");
    expect(within(row).getByTestId("movement-catalogue-search")).toBeTruthy();
    expect(screen.queryByTestId("movement-catalogue-search-clear")).toBeNull();
    fireEvent.changeText(screen.getByTestId("movement-catalogue-search"), "squat");
    expect(screen.getByTestId("movement-catalogue-search").props.value).toBe("squat");
    fireEvent.press(screen.getByTestId("movement-catalogue-search-clear"));
    expect(screen.getByTestId("movement-catalogue-search").props.value).toBe("");
    expect(screen.queryByTestId("movement-catalogue-search-clear")).toBeNull();
    expect(screen.getByTestId("movement-catalogue")).toBeTruthy();
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
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);

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
  // PRE-8 (B.7, arbitrages du 27/10) : Filtrer devient actif sur le seul segment Mouvements ; Trier
  // reste grisé partout ; Séances et Exercices sont inchangés.
  // PRE-8 (E.6) : Filtrer est actif sur les segments Mouvements (B.7) et Séances (E.6) ; Trier grisé.
  it("enables Filtrer on the Mouvements and Séances segments, Trier staying disabled (PRE-8 B.7, E.6)", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId("catalogue-filter-action").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(screen.getByTestId("catalogue-content-type-row-movements"));
    expect(screen.getByTestId("catalogue-filter-action").props.accessibilityState).toMatchObject({ disabled: false });
    expect(screen.getByTestId("catalogue-sort-action").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("catalogue-content-type-row-sessions"));
    expect(screen.getByTestId("catalogue-filter-action").props.accessibilityState).toMatchObject({ disabled: false });
  });

  it("renders the Créer, Filtrer and Trier pictograms (Figma 10579:21580), Trier from the icon/tri vector master, never a font glyph", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId("catalogue-create-action-icon")).toBeTruthy();
    expect(screen.getByTestId("catalogue-filter-action-icon")).toBeTruthy();
    const sortIcon = screen.getByTestId("catalogue-sort-action-icon");
    expect(within(screen.getByTestId("catalogue-sort-action")).queryByText("↕")).toBeNull();
    expect(StyleSheet.flatten(sortIcon.props.style)).toMatchObject({ width: 20, height: 20 });
  });

  it("dims Trier (border colors.disabled) while it remains inert", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const sort = screen.getByTestId("catalogue-sort-action");
    expect(sort.props.accessibilityState).toMatchObject({ disabled: true });
    expect(StyleSheet.flatten(sort.props.style).borderColor).toBe(colors.disabled);
  });

  it("pressing Séances (already selected) changes nothing: no reload, no navigation", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    const sessionsTab = screen.getByLabelText(strings.screens.sessions.contentTypes.sessions);
    expect(sessionsTab.props.accessibilityState).toMatchObject({ selected: true });

    const callsBefore = listCatalogueSessions.mock.calls.length;
    const emptyMessageBefore = screen.getByText(strings.screens.sessions.empty.message);

    fireEvent.press(sessionsTab);

    expect(listCatalogueSessions.mock.calls.length).toBe(callsBefore);
    expect(sessionsTab.props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByText(strings.screens.sessions.empty.message)).toBe(emptyMessageBefore);
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("CatalogueScreen — quatre états", () => {
  it("shows the loading indicator immediately after focus, before resolution", () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockReturnValue(new Promise(() => {}));

    renderScreen(service);
    act(() => {
      simulateFocus();
    });

    expect(
      screen.getByLabelText(strings.screens.sessions.loading.accessibilityLabel),
    ).toBeTruthy();
  });

  it("shows the exact empty message when no session is returned", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText(strings.screens.sessions.empty.message)).toBeTruthy();
  });

  it("shows a distinct error message and an active Réessayer button on rejection", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    const failure = new Error("boom");
    listCatalogueSessions.mockRejectedValueOnce(failure);
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
      listCatalogueSessions.mockResolvedValueOnce(reloadedSessions);

      await act(async () => {
        fireEvent.press(retry);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(listCatalogueSessions).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Séance after-retry")).toBeTruthy();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("renders exactly one SessionCard per returned session when ready", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([aSummary("a"), aSummary("b")]);

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
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([aSummary("card-a"), aSummary("card-b")]);

    renderScreen(service);
    await act(async () => {
      simulateFocus();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId("session-card-card-a-swipe-card")).toBeTruthy();
    fireEvent.press(screen.getByTestId("session-card-card-b-swipe-card"));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/composition",
      params: { sessionId: "card-b" },
    });
  });
});

describe("CatalogueScreen — cycle focus/blur/focus/démontage", () => {
  it("reloads on initial focus, invalidates the in-flight request on blur, and reloads again authoritatively on the next focus", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    const first = deferred<readonly CatalogueSessionRecord[]>();
    const second = deferred<readonly CatalogueSessionRecord[]>();
    listCatalogueSessions.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    renderScreen(service);

    // 1. Focus initial.
    let cleanupAfterFirstFocus: (() => void) | void;
    act(() => {
      cleanupAfterFirstFocus = simulateFocus();
    });
    expect(listCatalogueSessions).toHaveBeenCalledTimes(1);
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
    expect(listCatalogueSessions).toHaveBeenCalledTimes(2);

    await act(async () => {
      second.resolve([aSummary("fresh")]);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText("Séance fresh")).toBeTruthy();
    expect(screen.queryByText("Séance stale")).toBeNull();
  });

  it("does not throw when the screen unmounts", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);

    const { unmount } = renderScreen(service);
    act(() => {
      simulateFocus();
    });

    expect(() => unmount()).not.toThrow();
  });
});

describe("CatalogueScreen — recette 3 (T-49, EXT-R3-1 : bords de la zone de contexte)", () => {
  it("T-49 — vues Mouvements et Séances : aucun trait au-dessus de la zone, fondu inférieur en couches superposées vers le blanc (aucun bord net), couleur et commandes conservées", async () => {
    const { service, listCatalogueSessions } = makeFakeService();
    listCatalogueSessions.mockResolvedValue([]);
    renderScreen(service);
    await act(async () => {});

    for (const segment of ["movements", "sessions"] as const) {
      fireEvent.press(screen.getByTestId(`catalogue-content-type-row-${segment}`));
      expect(screen.queryByTestId("screen-header-separator")).toBeNull();
      const band = screen.getByTestId("screen-context-band");
      // Couleur propre du Catalogue conservée (pas la lavande de l’éditeur).
      expect(StyleSheet.flatten(band.props.style).backgroundColor).toBe(colors.selectionSurface);
      const fade = screen.getByTestId("catalogue-context-band-fade", { includeHiddenElements: true });
      expect(fade.props.pointerEvents).toBe("none");
      expect(StyleSheet.flatten(fade.props.style)).toMatchObject({ position: "absolute", bottom: 0, height: "20%" });
      const layers = fade.props.children as { props: { style: unknown } }[];
      expect(layers.length).toBeGreaterThanOrEqual(10);
      const opacities = layers.map((layer) => (StyleSheet.flatten(layer.props.style as never) as { opacity: number }).opacity);
      expect([...opacities].sort((a, b) => a - b)).toEqual(opacities);
      expect(opacities[opacities.length - 1]).toBeGreaterThan(0.9);
      for (const layer of layers) {
        expect(StyleSheet.flatten(layer.props.style as never)).toMatchObject({ position: "absolute", bottom: 0, backgroundColor: colors.background });
      }
      // Fondu dessiné en premier, sous le sélecteur et les commandes, qui restent présents.
      const order = (band.props.children as { props?: { testID?: string } }[]).flat().map((child) => child?.props?.testID).filter(Boolean);
      expect(order[0]).toBe("catalogue-context-band-fade");
      expect(screen.getByTestId("catalogue-content-type-row")).toBeTruthy();
      expect(screen.getByTestId("catalogue-create-action")).toBeTruthy();
    }
  });
});
