import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import type { ActivityDefinition } from "@/domain/activities";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivitySelectionScreen } from "@/features/activities/ActivitySelectionScreen";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

const mockBack = jest.fn();

/**
 * `ActivitySelectionScreen` s'auto-alimente en Zones corporelles persistées
 * via `ActivityDefinitionService.listBodyZones()` (V2-PRE-1, plan §3.1,
 * UI-9C227EDDE427 ; correction device check Hermann, commentaire 5948936550
 * — un accès direct à `useSQLiteContext` levait TOUJOURS en production, cet
 * écran étant rendu hors de `<SQLiteProvider>`) — doublé ici via
 * `ActivityDefinitionServiceContext`, jamais `expo-sqlite`/
 * `SqliteBodyZoneRepository`.
 */
const BODY_ZONE_FIXTURES: readonly BodyZone[] = [
  { id: "cuisses", name: "Cuisses", isActive: true, createdAt: "2026-01-01T00:00:06.000Z" },
  { id: "dos", name: "Dos", isActive: true, createdAt: "2026-01-01T00:00:04.000Z" },
];

// `jest-expo` ne fournit aucune implémentation par défaut de
// `Crypto.randomUUID()` (`undefined` sous ce preset) — même contrainte déjà
// documentée par `SqliteSessionRepository.test.ts`. Un compteur garantit un
// identifiant DISTINCT par appel, nécessaire pour prouver que chaque copie
// reçoit un nouvel identifiant. Déclaré à l'intérieur de la factory
// elle-même (jamais hors-portée) — `babel-plugin-jest-hoist` interdit toute
// référence à une variable externe non préfixée `mock`.
jest.mock("expo-crypto", () => {
  let counter = 0;
  return {
    randomUUID: jest.fn(() => `generated-id-${++counter}`),
  };
});

// `require()` à l'intérieur de la factory (pas un `import` statique) :
// `babel-plugin-jest-hoist` interdit toute référence hors-portée dans une
// factory `jest.mock`, sauf variables préfixées `mock` ou modules chargés à
// l'intérieur de la factory elle-même — même patron que
// `SessionServiceProvider.test.tsx`.
/** Expose le dernier callback `useFocusEffect` capturé — permet de simuler un second focus (ex. retour d'un aller-retour) dans un test. */
const focusEffectHarness: { effect: (() => (() => void) | void) | null } = { effect: null };

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactActual = require("react") as typeof import("react");
  return {
    useRouter: () => ({ back: mockBack }),
    useFocusEffect: (callback: () => void | (() => void)) => {
      focusEffectHarness.effect = callback;
      ReactActual.useEffect(() => callback(), []);
    },
  };
});

function makeDefinition(
  id: string,
  name: string,
  overrides: Partial<ActivityDefinition> = {},
): ActivityDefinition {
  return {
    id,
    name,
    description: null,
    executionMode: "DURATION",
    durationSeconds: 30,
    repetitionCount: null,
    seriesCount: 2,
    pauseSeconds: 5,
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
    sideMode: "UNILATERAL",
    sideRecoverySeconds: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderScreen(
  definitions: readonly ActivityDefinition[],
  updateDraft = jest.fn<(patch: Partial<SessionDraft>) => void>(),
) {
  const service: Partial<ActivityDefinitionService> = {
    listActivityDefinitions: jest
      .fn<ActivityDefinitionService["listActivityDefinitions"]>()
      .mockResolvedValue(definitions),
    listBodyZones: jest
      .fn<ActivityDefinitionService["listBodyZones"]>()
      .mockResolvedValue(BODY_ZONE_FIXTURES),
  };
  const draftValue = {
    draft: createEmptyDraft(),
    updateDraft,
    resetDraft: jest.fn(),
  };
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service as ActivityDefinitionService}>
        <SessionDraftContext.Provider value={draftValue}>
          <ActivitySelectionScreen />
        </SessionDraftContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  return { updateDraft };
}

describe("ActivitySelectionScreen", () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it("disables Ajouter when nothing is selected", async () => {
    renderScreen([makeDefinition("a", "Squat")]);
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());
    const addButton = screen.getByTestId("activity-selection-add");
    expect(addButton.props.accessibilityState.disabled).toBe(true);
  });

  it("closes without any mutation on Annuler", async () => {
    const { updateDraft } = renderScreen([makeDefinition("a", "Squat")]);
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());

    fireEvent.press(screen.getByTestId("activity-selection-cancel"));

    expect(updateDraft).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  /**
   * V2-CAT-01 (UI-CAT-R-003), VISUAL_CORRECTION (revue indépendante
   * 5753653735, point 2) : libellé EXACT `Ajouter 1 activité` /
   * `Ajouter X activités` — jamais un compteur entre parenthèses.
   */
  it("shows the exact dynamic CTA label — Ajouter 1 activité / Ajouter X activités", async () => {
    renderScreen([makeDefinition("a", "Squat"), makeDefinition("b", "Fentes")]);
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());

    expect(screen.getByTestId("activity-selection-add-label").props.children).toBe("Ajouter");

    fireEvent.press(screen.getByTestId("activity-selection-row-a"));
    expect(screen.getByTestId("activity-selection-add-label").props.children).toBe(
      "Ajouter 1 exercice",
    );

    fireEvent.press(screen.getByTestId("activity-selection-row-b"));
    expect(screen.getByTestId("activity-selection-add-label").props.children).toBe(
      "Ajouter 2 exercices",
    );
  });

  /** V2-CAT-01 (UI-CAT-R-003) : carte détaillée + checkbox vectorielle TOUJOURS visible. */
  it("shows a detailed card (body zones, mode/target/series/pause) and an always-visible vector checkbox", async () => {
    renderScreen([makeDefinition("a", "Squat", { bodyZoneIds: ["dos"] })]);
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());

    expect(await screen.findByTestId("activity-selection-row-body-zones-a")).toBeTruthy();
    expect(screen.getByText(/série/u)).toBeTruthy();

    const checkbox = screen.getByTestId("activity-selection-row-checkbox-a");
    expect(checkbox).toBeTruthy();
    expect(screen.queryByTestId("activity-selection-row-checked-a")).toBeNull();

    fireEvent.press(screen.getByTestId("activity-selection-row-a"));
    expect(screen.getByTestId("activity-selection-row-checkbox-a")).toBeTruthy();
    expect(screen.getByTestId("activity-selection-row-checked-a")).toBeTruthy();
  });

  /**
   * VISUAL_CORRECTION (revue indépendante 5753653735, point 2) : carte
   * alignée sur la carte canonique `ActivityCard.tsx` — barre gauche,
   * contour sélectionné conforme au patron DSF déjà établi
   * (`CategoriesScreen.tagSelected`). V2-PRE-1 (plan §3.1,
   * UI-9C227EDDE427) : aucune sous-carte Récupération — une
   * `ActivityDefinition` ne porte plus cette notion.
   */
  it("shows the left color bar and the canonical selected outline, without any Récupération sub-card", async () => {
    renderScreen([makeDefinition("a", "Squat")]);
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());

    expect(screen.getByTestId("activity-selection-row-color-bar-a")).toBeTruthy();
    expect(screen.queryByTestId("activity-selection-row-recovery-a")).toBeNull();
    expect(screen.queryByText(/Récupération/u)).toBeNull();

    const rowBefore = screen.getByTestId("activity-selection-row-a");
    expect(StyleSheet.flatten(rowBefore.props.style).borderColor).toBe(colors.border);

    fireEvent.press(rowBefore);

    const rowAfter = screen.getByTestId("activity-selection-row-a");
    expect(StyleSheet.flatten(rowAfter.props.style).borderColor).toBe(colors.selection);
    expect(StyleSheet.flatten(rowAfter.props.style).backgroundColor).toBe(colors.selectionSurface);
    expect(
      StyleSheet.flatten(screen.getByTestId("activity-selection-row-checkbox-a").props.style)
        .borderColor,
    ).toBe(colors.selection);
  });

  /**
   * V2-CAT-01 (UI-CAT-R-003, revue indépendante 35529973203) : retrait et
   * recalcul des identifiants obsolètes — une définition sélectionnée
   * disparaît d'un rechargement ultérieur (aller-retour) ; le compteur/CTA
   * se recalcule sans jamais inclure cet identifiant, la validation ne peut
   * jamais le transmettre, ET une information EXPLICITE/VISIBLE l'annonce
   * (jamais un retrait silencieux).
   */
  it("prunes a stale selected id once the list refreshes without it, recalculating the counter/CTA and showing an explicit notice", async () => {
    const listActivityDefinitions = jest
      .fn<ActivityDefinitionService["listActivityDefinitions"]>()
      .mockResolvedValueOnce([makeDefinition("a", "Squat"), makeDefinition("b", "Fentes")])
      .mockResolvedValueOnce([makeDefinition("b", "Fentes")]);
    const service: Partial<ActivityDefinitionService> = {
      listActivityDefinitions,
      listBodyZones: jest
        .fn<ActivityDefinitionService["listBodyZones"]>()
        .mockResolvedValue(BODY_ZONE_FIXTURES),
    };
    const updateDraft = jest.fn<(patch: Partial<SessionDraft>) => void>();
    render(
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider value={service as ActivityDefinitionService}>
          <SessionDraftContext.Provider
            value={{ draft: createEmptyDraft(), updateDraft, resetDraft: jest.fn() }}
          >
            <ActivitySelectionScreen />
          </SessionDraftContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());
    expect(screen.queryByTestId("activity-selection-stale-notice")).toBeNull();

    fireEvent.press(screen.getByTestId("activity-selection-row-a"));
    fireEvent.press(screen.getByTestId("activity-selection-row-b"));
    expect(screen.getByTestId("activity-selection-add-label").props.children).toBe(
      "Ajouter 2 exercices",
    );

    // Aller-retour : la liste se recharge SANS `a` (supprimée par ailleurs).
    if (!focusEffectHarness.effect) {
      throw new Error("No useFocusEffect callback captured yet.");
    }
    focusEffectHarness.effect();
    await waitFor(() =>
      expect(screen.getByTestId("activity-selection-add-label").props.children).toBe(
        "Ajouter 1 exercice",
      ),
    );
    expect(screen.queryByTestId("activity-selection-row-a")).toBeNull();

    // Information EXPLICITE et VISIBLE — jamais un simple retrait silencieux.
    expect(screen.getByTestId("activity-selection-stale-notice")).toBeTruthy();
    expect(
      screen.getByText("1 activité sélectionnée n’est plus disponible et a été retirée de la sélection."),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("activity-selection-add"));
    expect(updateDraft).toHaveBeenCalledTimes(1);
    expect(updateDraft.mock.calls[0][0].exercises).toHaveLength(1);
    expect(updateDraft.mock.calls[0][0].exercises?.[0]?.name).toBe("Fentes");
  });

  it("inserts copies atomically in list order, independent of touch order", async () => {
    const { updateDraft } = renderScreen([
      makeDefinition("a", "Squat"),
      makeDefinition("b", "Fentes"),
    ]);
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());

    // Touch order: b then a — insertion order must still follow the list (a, b).
    fireEvent.press(screen.getByTestId("activity-selection-row-b"));
    fireEvent.press(screen.getByTestId("activity-selection-row-a"));
    fireEvent.press(screen.getByTestId("activity-selection-add"));

    expect(updateDraft).toHaveBeenCalledTimes(1);
    const patch = updateDraft.mock.calls[0][0];
    const exercises = patch.exercises ?? [];
    expect(exercises).toHaveLength(2);
    expect(exercises[0]?.name).toBe("Squat");
    expect(exercises[1]?.name).toBe("Fentes");
    expect(exercises[0]?.id).not.toBe(exercises[1]?.id);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
