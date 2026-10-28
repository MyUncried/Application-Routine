import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import type { ActivityDefinition } from "@/domain/activities";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivitySelectionScreen } from "@/features/activities/ActivitySelectionScreen";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-8 (epic E, story E.8-a, option 1 de Hermann du 28/10) — accès transitoire aux anciennes
 * définitions d'Exercices depuis la sélection de la Composition : commande Modifier distincte de la
 * sélection, éditeur existant (`/exercise?catalogueDefinitionId=…`), sélections et brouillon conservés
 * au retour, aucune ligne créée.
 */

const mockBack = jest.fn();
const mockPush = jest.fn();
const focusEffectHarness: { effect: (() => (() => void) | void) | null } = { effect: null };

jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-id") }));
jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactActual = require("react") as typeof import("react");
  return {
    useRouter: () => ({ back: mockBack, push: mockPush }),
    useFocusEffect: (callback: () => void | (() => void)) => {
      focusEffectHarness.effect = callback;
      ReactActual.useEffect(() => callback(), []);
    },
  };
});

const definition = (id: string, name: string): ActivityDefinition => ({
  id,
  movementId: `mov-${id}`,
  name,
  description: null,
  executionParameters: durationParameters(30, 2, 5),
  categoryId: "cardio",
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  sideRecoverySeconds: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

function renderScreen(definitions: { current: readonly ActivityDefinition[] }) {
  const updateDraft = jest.fn<(patch: Partial<SessionDraft>) => void>();
  const listActivityDefinitions = jest.fn(async () => definitions.current);
  const service = {
    listActivityDefinitions,
    listBodyZones: jest.fn(async () => []),
    listCategories: jest.fn(async () => []),
  } as unknown as ActivityDefinitionService;
  const profile = { getProfile: jest.fn(async () => createDefaultProfile("p", "2026-01-01T00:00:00.000Z")) } as unknown as ProfileService;
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>
        <ProfileServiceContext.Provider value={profile}>
          <SessionDraftContext.Provider value={{ draft: createEmptyDraft(), updateDraft, resetDraft: jest.fn() }}>
            <ActivitySelectionScreen />
          </SessionDraftContext.Provider>
        </ProfileServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  return { updateDraft, listActivityDefinitions };
}

describe("PRE-8 E.8-a — commande Modifier dans la sélection d'Exercices", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPush.mockClear();
  });

  it("une commande Modifier sur chaque ligne, distincte de la sélection, cible d'au moins 44, libellé propre", async () => {
    renderScreen({ current: [definition("a", "Squat"), definition("b", "Fentes")] });
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());
    for (const [id, name] of [["a", "Squat"], ["b", "Fentes"]] as const) {
      const edit = screen.getByTestId(`activity-selection-row-edit-${id}`);
      expect(edit.props.accessibilityRole).toBe("button");
      expect(edit.props.accessibilityLabel).toBe(`Modifier l’exercice ${name}`);
      const style = StyleSheet.flatten(edit.props.style);
      expect(style.minWidth).toBeGreaterThanOrEqual(44);
      expect(style.minHeight).toBeGreaterThanOrEqual(44);
      expect(edit).not.toBe(screen.getByTestId(`activity-selection-row-${id}`));
    }
  });

  it("Modifier ouvre l'éditeur existant sur la bonne définition, sans cocher la ligne ni écrire le brouillon", async () => {
    const { updateDraft } = renderScreen({ current: [definition("a", "Squat"), definition("b", "Fentes")] });
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());
    fireEvent.press(screen.getByTestId("activity-selection-row-edit-b"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/exercise", params: { catalogueDefinitionId: "b" } });
    expect(screen.getByTestId("activity-selection-row-b").props.accessibilityState).toEqual({ checked: false });
    expect(updateDraft).not.toHaveBeenCalled();
  });

  it("la sélection reste inchangée : toucher la ligne coche sans ouvrir l'éditeur", async () => {
    renderScreen({ current: [definition("a", "Squat")] });
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());
    fireEvent.press(screen.getByTestId("activity-selection-row-a"));
    expect(screen.getByTestId("activity-selection-row-a").props.accessibilityState).toEqual({ checked: true });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("retour de l'éditeur : liste relue (modification visible), sélections conservées, aucune ligne créée", async () => {
    const definitions = { current: [definition("a", "Squat"), definition("b", "Fentes")] as readonly ActivityDefinition[] };
    const { listActivityDefinitions, updateDraft } = renderScreen(definitions);
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());
    fireEvent.press(screen.getByTestId("activity-selection-row-a"));
    fireEvent.press(screen.getByTestId("activity-selection-row-edit-b"));
    // Modification enregistrée dans l'éditeur, puis retour : nouveau focus.
    definitions.current = [definition("a", "Squat"), definition("b", "Fentes sautées")];
    await act(async () => {
      focusEffectHarness.effect?.();
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.getByText("Fentes sautées")).toBeTruthy());
    expect(listActivityDefinitions).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("activity-selection-row-a").props.accessibilityState).toEqual({ checked: true });
    expect(screen.getAllByTestId(/^activity-selection-row-edit-/)).toHaveLength(2);
    expect(updateDraft).not.toHaveBeenCalled();
  });

  it("un double toucher n'ouvre qu'un éditeur", async () => {
    renderScreen({ current: [definition("a", "Squat")] });
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());
    fireEvent.press(screen.getByTestId("activity-selection-row-edit-a"));
    fireEvent.press(screen.getByTestId("activity-selection-row-edit-a"));
    expect(mockPush).toHaveBeenCalledTimes(1);
  });
});
