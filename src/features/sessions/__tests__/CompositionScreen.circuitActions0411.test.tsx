import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { Alert, Platform } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits, type SessionStructure, type StructureStopPointLocation } from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { SessionDraftContext, type SessionDraftContextValue, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Mise à jour consolidée des écrans Formats du 04/11/2026 (§6 quinquies, §6 sexies) — Circuit replié : actions
 * glissées Renommer | (Modifier le format) | Dupliquer | Supprimer ; le Circuit déplié ne se glisse pas.
 */

let mockUuid = 0;
const mockPush = jest.fn();
jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => `uuid-${++mockUuid}`) }));
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactActual = require("react") as typeof import("react");
  return {
    ...actual,
    useRouter: () => ({ push: mockPush, back: jest.fn(), dismissTo: jest.fn() }),
    useFocusEffect: (callback: () => void) => {
      ReactActual.useEffect(() => callback(), []);
    },
  };
});
const mockExitGuard = jest.fn();
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: (shouldBlock: boolean, onConfirmExit: () => void) => mockExitGuard(shouldBlock, onConfirmExit),
}));

const activityDefinitionService = {
  listBodyZones: jest.fn(async () => []),
  listLabels: jest.fn(async () => []),
  listCategories: jest.fn(async () => []),
} as unknown as ActivityDefinitionService;
const referentialService = { listLabels: jest.fn(async () => []) } as unknown as ReferentialService;

const probe: { draft: SessionDraft | null } = { draft: null };

function DraftHost({ initial, children }: { initial: SessionDraft; children: ReactNode }) {
  const [draft, setDraft] = useState(initial);
  useLayoutEffect(() => {
    probe.draft = draft;
  });
  const value = useMemo<SessionDraftContextValue>(
    () => ({
      draft,
      updateDraft: (update: SessionDraftUpdate) => setDraft((current) => ({ ...current, ...(typeof update === "function" ? update(current) : update) })),
      resetDraft: jest.fn(),
    }),
    [draft],
  );
  return <SessionDraftContext.Provider value={value}>{children}</SessionDraftContext.Provider>;
}

const exercise = (id: string): SessionDraftExercise => ({
  ...createExerciseDraft(id, 0),
  name: `Exercice ${id}`,
  structuralPosition: "BEFORE_TOUR",
  executionParameters: durationParameters(20, 8),
});

function draftOf(originModel: "TABATA" | null): SessionDraft {
  const structure: SessionStructure<string, StructureStopPointLocation> = {
    elements: [
      { kind: "EXERCISE", exercise: "e0" },
      { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 8, nature: "SERIES", exercises: ["a1", "a2"], ...(originModel !== null ? { originModel } : {}) } },
      // Second Circuit : disposition générale (l'ancien modèle à Circuit unique n'a pas d'en-tête repliable par Circuit).
      { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1"] } },
    ],
    stopPoints: [],
  };
  return withLocalMovements({ name: "Séance", labelId: null, initialCountdownSeconds: 10, finalPhaseSeconds: 5, exercises: ["e0", "a1", "a2", "b1"].map(exercise), structure });
}

async function renderComposition(draft: SessionDraft) {
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={activityDefinitionService}>
        <ReferentialServiceContext.Provider value={referentialService}>
          <DraftHost initial={draft}>
            <CompositionScreen />
          </DraftHost>
        </ReferentialServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  await act(async () => undefined);
}

const action = (name: string) =>
  act(async () => {
    fireEvent(screen.getByTestId("composition-layout-circuit-ca-swipe-card"), "accessibilityAction", { nativeEvent: { actionName: name } });
  });

let originalPlatformOS: typeof Platform.OS;
beforeAll(() => {
  originalPlatformOS = Platform.OS;
  Platform.OS = "ios";
});
afterAll(() => {
  Platform.OS = originalPlatformOS;
});
beforeEach(() => {
  mockPush.mockReset();
  mockExitGuard.mockReset();
  mockExitGuard.mockReturnValue({ isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() });
});

describe("Circuit replié — actions glissées (MAJ 04/11 §6 quinquies, §6 sexies)", () => {
  it("déplié : aucune action glissée ; replié et issu d'un modèle : quatre actions, « Modifier le format » rouvre le récapitulatif", async () => {
    await renderComposition(draftOf("TABATA"));
    expect(screen.queryByTestId("composition-layout-circuit-ca-swipe-card")).toBeNull();
    fireEvent.press(screen.getByTestId("composition-layout-circuit-ca-header-collapse"));
    const actions = screen.getByTestId("composition-layout-circuit-ca-swipe-card").props.accessibilityActions.map((item: { name: string }) => item.name);
    expect(actions).toEqual(["rename", "edit-format", "duplicate", "delete"]);
    await action("edit-format");
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/format-summary", params: { model: "TABATA", circuitId: "ca" } });
  });

  it("Circuit composé à la main : trois actions ; Renommer — saisie en ligne validée par Retour, nom vide = nom par défaut", async () => {
    await renderComposition(draftOf(null));
    fireEvent.press(screen.getByTestId("composition-layout-circuit-ca-header-collapse"));
    const actions = screen.getByTestId("composition-layout-circuit-ca-swipe-card").props.accessibilityActions.map((item: { name: string }) => item.name);
    expect(actions).toEqual(["rename", "duplicate", "delete"]);
    await action("rename");
    const field = screen.getByTestId("composition-layout-circuit-ca-header-rename");
    fireEvent.changeText(field, "Finisher");
    await act(async () => {
      fireEvent(field, "submitEditing");
    });
    expect(structureCircuits(probe.draft!.structure!)[0]!.name).toBe("Finisher");
    expect(screen.getByTestId("composition-layout-circuit-ca-header-title")).toHaveTextContent("Finisher");
  });

  it("Supprimer : confirmation « Supprimer ce circuit ? » ; Supprimer retire le Circuit et ses exercices", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await renderComposition(draftOf("TABATA"));
    fireEvent.press(screen.getByTestId("composition-layout-circuit-ca-header-collapse"));
    await action("delete");
    expect(alert).toHaveBeenCalledWith("Supprimer ce circuit ?", "Le circuit et ses 2 exercices seront supprimés de la séance.", expect.any(Array));
    const buttons = alert.mock.calls[0]![2] as { text: string; onPress?: () => void }[];
    await act(async () => {
      buttons.find((button) => button.text === "Supprimer")!.onPress!();
    });
    expect(probe.draft!.exercises.map((item) => item.id)).toEqual(["e0", "b1"]);
    alert.mockRestore();
  });

  it("Dupliquer : copie juste après, nom « (C) » en saisie", async () => {
    await renderComposition(draftOf("TABATA"));
    fireEvent.press(screen.getByTestId("composition-layout-circuit-ca-header-collapse"));
    await action("duplicate");
    const circuits = structureCircuits(probe.draft!.structure!);
    expect(circuits).toHaveLength(3);
    expect(circuits[1]).toMatchObject({ name: "Tabata (C)", originModel: "TABATA" });
    expect(screen.getByTestId(`composition-layout-circuit-${circuits[1]!.id}-header-rename`).props.value).toBe("Tabata (C)");
  });
});
