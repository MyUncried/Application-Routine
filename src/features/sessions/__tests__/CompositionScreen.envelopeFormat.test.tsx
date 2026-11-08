import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { appendModelToDraft, buildModelElements, initialAnswers, initialMovementValues } from "@/domain/sessions/formatModels";
import { createEmptyDraft, createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits } from "@/domain/sessions/structure";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { SessionDraftContext, type SessionDraftContextValue, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Recette iPhone du 05/11/2026 (soir, Hermann : « séance avec un circuit formaté : composition de séance : créer > ajouter un
 * circuit. Les circuits autorisés sont montrés, mais on ne peut pas le sélectionner, et les boutons ne fonctionnent pas »).
 */
jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));
jest.mock("expo-crypto", () => {
  let counter = 0;
  return { randomUUID: jest.fn(() => `generated-${++counter}`) };
});
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactActual = require("react") as typeof import("react");
  return {
    ...actual,
    useRouter: () => ({ push: jest.fn(), back: jest.fn(), dismissTo: jest.fn() }),
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

function exercise(id: string): SessionDraftExercise {
  return { ...createExerciseDraft(id, 0), name: `Exercice ${id}`, sourceMovementId: `movement-${id}`, structuralPosition: "BEFORE_TOUR", executionParameters: durationParameters(30, 1) };
}

function formattedDraft(): SessionDraft {
  let n = 0;
  const newId = () => `f${++n}`;
  const answers = initialAnswers("PROGRESSION");
  const movements = ["m1", "m2"].map((id) => {
    const base = exercise(id);
    return { exercise: base, values: initialMovementValues("PROGRESSION", answers, base) };
  });
  const built = buildModelElements("PROGRESSION", answers, movements, newId);
  // Un exercice libre, puis le circuit du Format (ordre réel de la Composition).
  const start: SessionDraft = { ...createEmptyDraft(), name: "Séance", exercises: [exercise("a")], structure: { elements: [{ kind: "EXERCISE", exercise: "a" }], stopPoints: [] } } as unknown as SessionDraft;
  const withModel = appendModelToDraft(start, built, newId);
  return { ...start, ...withModel } as SessionDraft;
}

beforeAll(() => {
  Platform.OS = "ios";
});
afterAll(() => undefined);
beforeEach(() => {
  probe.draft = null;
});

describe("Créer un circuit dans une séance qui porte un circuit formaté (recette du 05/11 soir)", () => {
  it("l'exercice libre se désigne et le circuit se confirme", async () => {
    const draft = formattedDraft();
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
    const before = structureCircuits(probe.draft!.structure!).length;
    fireEvent.press(screen.getByTestId("composition-add-activity-action"));
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-circuit"));
    const target = screen.getByTestId("composition-envelope-exercise-a-target");
    fireEvent.press(target);
    expect(screen.getByTestId("composition-envelope-exercise-a-target").props.accessibilityState).toEqual({ selected: true });
    fireEvent.press(screen.getByTestId("composition-envelope-bar-confirm"));
    await act(async () => undefined);
    expect(structureCircuits(probe.draft!.structure!).length).toBe(before + 1);
  });
});
