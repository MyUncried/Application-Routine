import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { ActivityDefinition } from "@/domain/activities";
import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivitySelectionScreen } from "@/features/activities/ActivitySelectionScreen";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

const mockBack = jest.fn();

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

function makeDefinition(id: string, name: string): ActivityDefinition {
  return {
    id,
    name,
    description: null,
    executionMode: "DURATION",
    durationSeconds: 30,
    repetitionCount: null,
    seriesCount: 2,
    pauseSeconds: 5,
    recoverySeconds: 0,
    bodyZoneIds: [],
    sideMode: "UNILATERAL",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
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

  /** V2-CAT-01 (UI-CAT-R-003) : le libellé du CTA porte le compteur de la sélection courante. */
  it("shows a dynamic CTA label reflecting the current selection count", async () => {
    renderScreen([makeDefinition("a", "Squat"), makeDefinition("b", "Fentes")]);
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());

    expect(screen.getByTestId("activity-selection-add-label").props.children).toBe("Ajouter");

    fireEvent.press(screen.getByTestId("activity-selection-row-a"));
    expect(screen.getByTestId("activity-selection-add-label").props.children).toBe("Ajouter (1)");

    fireEvent.press(screen.getByTestId("activity-selection-row-b"));
    expect(screen.getByTestId("activity-selection-add-label").props.children).toBe("Ajouter (2)");
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
