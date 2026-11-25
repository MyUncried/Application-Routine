import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { SessionStructure, StructureStopPointLocation } from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { formatOriginOf } from "@/features/sessions/formatSheetContext";
import { SessionDraftContext, type SessionDraftContextValue, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * D-606 (D-571 de la branche de documentation, Hermann, 25/11/2026 ; Formats § 9.8) : dans la Composition, l'appui sur la carte d'un
 * Exercice issu d'un format ouvre la page unique du format (réouverture sur ses paramètres, `circuitId`) ; la modale « Paramètres
 * d'exécution » ne s'ouvre plus pour lui. Photo (fiche en lecture seule) et actions de la carte (déplacer, dupliquer, supprimer) :
 * inchangées. Exercice libre et membre d'un Circuit composé à la main : modale, inchangée.
 * Jest ne prouve que l'arbre JS : la vérification visuelle et tactile est faite par Hermann sur iPhone.
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
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: () => ({ isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() }),
}));

const activityDefinitionService = {
  listBodyZones: jest.fn(async () => []),
  listLabels: jest.fn(async () => []),
  listCategories: jest.fn(async () => []),
} as unknown as ActivityDefinitionService;
const referentialService = { listLabels: jest.fn(async () => []) } as unknown as ReferentialService;

function DraftHost({ initial, children }: { initial: SessionDraft; children: ReactNode }) {
  const [draft, setDraft] = useState(initial);
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

function draftOf(): SessionDraft {
  const structure: SessionStructure<string, StructureStopPointLocation> = {
    elements: [
      { kind: "EXERCISE", exercise: "e0" },
      { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 8, nature: "SERIES", exercises: ["a1", "a2"], originModel: "TABATA" } },
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
});

describe("D-606 — appui sur la carte d'un Exercice issu d'un format : page du format", () => {
  it("membre d'un Circuit issu d'un format : la carte ouvre la page du format, sans modale", async () => {
    await renderComposition(draftOf());
    await act(async () => {
      fireEvent.press(screen.getByTestId("composition-exercise-row-a1"));
    });
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/format-summary", params: { model: "TABATA", circuitId: "ca" } });
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
  });

  it("photo : fiche en lecture seule ; actions de la carte (déplacer, dupliquer, supprimer) inchangées", async () => {
    await renderComposition(draftOf());
    fireEvent.press(screen.getByTestId("composition-exercise-media-button-a2"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/exercise-sheet", params: { exerciseId: "a2" } });
    const actions = screen.getByTestId("composition-exercise-row-a1").props.accessibilityActions.map((action: { name: string }) => action.name);
    expect(actions).toEqual(expect.arrayContaining(["duplicate", "delete"]));
    expect(actions.some((name: string) => name === "moveUp" || name === "moveDown")).toBe(true);
  });

  it("exercice libre : la modale « Paramètres d'exécution », inchangée", async () => {
    await renderComposition(draftOf());
    await act(async () => {
      fireEvent.press(screen.getByTestId("composition-exercise-row-e0"));
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(await screen.findByTestId("execution-sheet")).toBeTruthy();
  });

  it("formatOriginOf : modèle d'origine du Circuit ; rien pour un exercice seul ou un Circuit composé à la main", () => {
    const draft = draftOf();
    expect(formatOriginOf(draft, "a2")).toEqual({ model: "TABATA", circuitId: "ca" });
    expect(formatOriginOf(draft, "e0")).toBeUndefined();
    expect(formatOriginOf(draft, "b1")).toBeUndefined();
  });
});
