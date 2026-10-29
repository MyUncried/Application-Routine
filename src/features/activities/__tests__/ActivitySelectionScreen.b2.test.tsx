import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import type { ActivityDefinition } from "@/domain/activities";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { createEmptyDraft, createExerciseDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivitySelectionScreen } from "@/features/activities/ActivitySelectionScreen";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-9 B.2 (ARB-07 : « Nouvel Exercice inséré après le dernier Exercice entré, dans son conteneur,
 * comme actuellement ») — « Utiliser un mouvement existant » sur une disposition générale : les
 * copies sont insérées après le dernier Exercice affiché, dans son conteneur.
 */

jest.mock("expo-crypto", () => {
  let counter = 0;
  return { randomUUID: jest.fn(() => `copy-${++counter}`) };
});
const mockBack = jest.fn();
jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactActual = require("react") as typeof import("react");
  return {
    useRouter: () => ({ back: mockBack }),
    useFocusEffect: (callback: () => void | (() => void)) => {
      ReactActual.useEffect(() => callback(), []);
    },
  };
});

const definition = (id: string, name: string): ActivityDefinition => ({
  id,
  movementId: `movement-${id}`,
  name,
  description: null,
  executionParameters: durationParameters(30, 3),
  categoryId: "cardio",
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  sideRecoverySeconds: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const exercise = (id: string) => ({ ...createExerciseDraft(id), name: id, executionParameters: durationParameters(30, 2) });

/** [e0, Circuit A (a1), Circuit B (b1, b2)] : dernier Exercice affiché b2, dans le Circuit B. */
const richDraft: SessionDraft = {
  ...createEmptyDraft(),
  exercises: ["e0", "a1", "b1", "b2"].map(exercise),
  structure: {
    elements: [
      { kind: "EXERCISE", exercise: "e0" },
      { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 1, nature: "TOURS", exercises: ["a1"] } },
      { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 2, nature: "TOURS", exercises: ["b1", "b2"] } },
    ],
    stopPoints: [],
  },
};

function renderScreen(updateDraft: jest.Mock<(patch: Partial<SessionDraft>) => void>) {
  const service = {
    listActivityDefinitions: jest.fn(async () => [definition("s", "Squat"), definition("f", "Fente")]),
    listBodyZones: jest.fn(async () => []),
    listCategories: jest.fn(async () => []),
  } as unknown as ActivityDefinitionService;
  const profileService = {
    getProfile: jest.fn(async () => createDefaultProfile("profile-1", "2026-01-01T00:00:00.000Z")),
  } as unknown as ProfileService;
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>
        <ProfileServiceContext.Provider value={profileService}>
          <SessionDraftContext.Provider value={{ draft: richDraft, updateDraft, resetDraft: jest.fn() }}>
            <ActivitySelectionScreen />
          </SessionDraftContext.Provider>
        </ProfileServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
}

describe("ActivitySelectionScreen — PRE-9 B.2 (ARB-07), disposition générale", () => {
  it("les copies vont après le dernier Exercice affiché, dans son Circuit, dans l'ordre de la liste ; une seule mise à jour", async () => {
    const updateDraft = jest.fn<(patch: Partial<SessionDraft>) => void>();
    renderScreen(updateDraft);
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());
    fireEvent.press(screen.getByTestId("activity-selection-row-f"));
    fireEvent.press(screen.getByTestId("activity-selection-row-s"));
    fireEvent.press(screen.getByTestId("activity-selection-add"));

    expect(updateDraft).toHaveBeenCalledTimes(1);
    const patch = updateDraft.mock.calls[0]![0];
    const circuitB = patch.structure?.elements[2];
    expect(circuitB?.kind === "CIRCUIT" ? circuitB.circuit.exercises : null).toEqual(["b1", "b2", "copy-1", "copy-2"]);
    expect(patch.exercises?.map((item) => [item.id, item.name])).toEqual([
      ["e0", "e0"],
      ["a1", "a1"],
      ["b1", "b1"],
      ["b2", "b2"],
      ["copy-1", "Squat"],
      ["copy-2", "Fente"],
    ]);
    // Aucun dialogue de perte (Circuit de Tours) ; retour à la Composition.
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
