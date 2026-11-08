import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { SessionStructure, StructureElement, StructureStopPointLocation } from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { SessionDraftContext, type SessionDraftContextValue, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Recette du 08/11/2026 au soir — Superset limité (Hermann : « Superset : il est possible dans le circuit de la
 * composition de séance d'ajouter un troisième exercice, ça ne doit pas être autorisé. ») : dans la Composition,
 * « Dupliquer » est indisponible sur un membre d'un Superset à deux (grisé, absent des actions accessibles) et
 * « Monter » / « Descendre » franchit le Superset au lieu d'y entrer. Harnais repris de B.5. Jest ne prouve ni le rendu
 * ni le geste sur iPhone.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "copy-id") }));
const mockPush = jest.fn();
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
      updateDraft: (update: SessionDraftUpdate) =>
        setDraft((current) => ({ ...current, ...(typeof update === "function" ? update(current) : update) })),
      resetDraft: jest.fn(),
    }),
    [draft],
  );
  return <SessionDraftContext.Provider value={value}>{children}</SessionDraftContext.Provider>;
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

function exercise(id: string, seriesCount = 1): SessionDraftExercise {
  return {
    ...createExerciseDraft(id, 0),
    name: `Exercice ${id}`,
    structuralPosition: "BEFORE_TOUR",
    executionParameters: durationParameters(30, seriesCount),
  };
}

type Layout = SessionStructure<string, StructureStopPointLocation>;

/** e0, Superset ss [a1, a2] (alterné × 3), Circuit standard cs [c1], e9. */
const layout: Layout = {
  elements: [
    { kind: "EXERCISE", exercise: "e0" },
    { kind: "CIRCUIT", circuit: { id: "ss", repeatCount: 3, nature: "SERIES", exercises: ["a1", "a2"], originModel: "SUPERSET" } },
    { kind: "CIRCUIT", circuit: { id: "cs", repeatCount: 3, nature: "SERIES", exercises: ["c1"] } },
    { kind: "EXERCISE", exercise: "e9" },
  ],
  stopPoints: [],
};

const sampleDraft = () =>
  withLocalMovements({
    name: "Séance",
    labelId: null,
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    exercises: ["e0", "a1", "a2", "c1", "e9"].map((id) => exercise(id, 3)),
    structure: layout,
  });

const hidden = { includeHiddenElements: true } as const;

function shape(draft: SessionDraft | null): string {
  const circuitOf = (c: { id: string; exercises: readonly string[] }) => `${c.id}[${c.exercises.join(",")}]`;
  return (draft?.structure?.elements ?? [])
    .map((element: StructureElement<string>) =>
      element.kind === "EXERCISE"
        ? element.exercise
        : element.kind === "CIRCUIT"
          ? circuitOf(element.circuit)
          : `${element.cycle.id}{${element.cycle.members.map((m) => (m.kind === "EXERCISE" ? m.exercise : circuitOf(m.circuit))).join(" ")}}`,
    )
    .join(" ");
}

/** Balayage gauche au-delà de la moitié de la course : révèle Dupliquer / Supprimer. */
function swipeLeft(id: string) {
  const container = () => screen.getByTestId(`composition-activity-${id}`, hidden);
  fireEvent(container(), "touchStart", { nativeEvent: { pageX: 300, pageY: 100 } });
  fireEvent(container(), "touchMove", { nativeEvent: { pageX: 220, pageY: 100 } });
  fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 220, pageY: 100, touches: [] } });
}

/** Rappels des animations simulées (microtâches). */
async function settle() {
  await act(async () => undefined);
  await act(async () => undefined);
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
  mockExitGuard.mockReset();
  mockExitGuard.mockReturnValue({ isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() });
});
afterEach(() => {
  jest.restoreAllMocks();
});

const actionNames = (id: string): string[] =>
  screen.getByTestId(`composition-exercise-row-${id}`, hidden).props.accessibilityActions.map((action: { name: string }) => action.name);

describe("Recette du 08/11/2026 au soir — Superset limité dans la Composition", () => {
  it("membre d'un Superset à deux : « Dupliquer » absent des actions accessibles ; présent ailleurs", async () => {
    await renderComposition(sampleDraft());
    expect(actionNames("a1")).not.toContain("duplicate");
    expect(actionNames("a2")).not.toContain("duplicate");
    expect(actionNames("a1")).toContain("delete");
    for (const id of ["e0", "c1", "e9"]) expect(actionNames(id)).toContain("duplicate");
  });

  it("balayage d'un membre du Superset : « Dupliquer » grisé et sans effet ; « Supprimer » disponible", async () => {
    await renderComposition(sampleDraft());
    swipeLeft("a1");
    const duplicate = screen.getByTestId("composition-activity-duplicate-a1", hidden);
    expect(duplicate.props.accessibilityState).toMatchObject({ disabled: true });
    const before = probe.draft;
    fireEvent.press(duplicate);
    expect(probe.draft).toBe(before);
    expect(shape(probe.draft)).toBe("e0 ss[a1,a2] cs[c1] e9");
    expect(screen.getByTestId("composition-activity-delete-a1", hidden)).toBeTruthy();
  });

  it("témoin : « Dupliquer » d'un membre d'un Circuit standard reste actif", async () => {
    await renderComposition(sampleDraft());
    swipeLeft("c1");
    fireEvent.press(screen.getByTestId("composition-activity-duplicate-c1", hidden));
    expect(shape(probe.draft)).toBe("e0 ss[a1,a2] cs[c1,copy-id] e9");
  });

  it("« Descendre » au-dessus du Superset : la carte le franchit, hors de lui", async () => {
    await renderComposition(sampleDraft());
    fireEvent(screen.getByTestId("composition-exercise-row-e0", hidden), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
    await settle();
    expect(shape(probe.draft)).toBe("ss[a1,a2] e0 cs[c1] e9");
  });

  it("« Monter » d'un membre du Circuit standard placé sous le Superset : il passe au-dessus du Superset, hors de lui", async () => {
    await renderComposition(sampleDraft());
    fireEvent(screen.getByTestId("composition-exercise-row-c1", hidden), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    await settle();
    // c1 sort de son Circuit (vidé, retiré) vers le niveau Séance, entre le Superset et la fin.
    const first = shape(probe.draft);
    fireEvent(screen.getByTestId("composition-exercise-row-c1", hidden), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    await settle();
    expect(first).toBe("e0 ss[a1,a2] c1 e9");
    expect(shape(probe.draft)).toBe("e0 c1 ss[a1,a2] e9");
  });
});
