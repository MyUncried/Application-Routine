import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { AccessibilityInfo, Platform } from "react-native";

import { seriesCountOf } from "@/domain/activities/ExecutionParameters";
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
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-9 story B.5 (epics B.5 ; D-441, D-442 ; ARB-08, ARB-17 ; COMP §1 ; précision de Hermann du
 * 30/10/2026 sur le retrait d'un Circuit) — balayage Dupliquer / Supprimer dans une disposition
 * générale, actions accessibles, carte supprimée effacée, dernier membre : conteneur effacé lentement,
 * copie juste après sa source, « Réduire les animations ». Harnais repris de B.4. Jest ne prouve ni le
 * rendu ni le geste sur iPhone (le simulacre de Reanimated termine les animations aussitôt).
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

/** e0, Circuit A groupé [a1, a2], Cycle × 2 [y0, Circuit B alterné × 2 [b1]], Cycle Z [Circuit D [d1]], e9. */
const layout: Layout = {
  elements: [
    { kind: "EXERCISE", exercise: "e0" },
    { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 1, nature: "TOURS", exercises: ["a1", "a2"] } },
    {
      kind: "CYCLE",
      cycle: {
        id: "cy",
        repeatCount: 2,
        members: [
          { kind: "EXERCISE", exercise: "y0" },
          { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 2, nature: "SERIES", exercises: ["b1"] } },
        ],
      },
    },
    { kind: "CYCLE", cycle: { id: "cz", repeatCount: 3, members: [{ kind: "CIRCUIT", circuit: { id: "cd", repeatCount: 1, nature: "TOURS", exercises: ["d1"] } }] } },
    { kind: "EXERCISE", exercise: "e9" },
  ],
  stopPoints: [],
};

const sampleDraft = (overrides: Partial<Record<string, SessionDraftExercise>> = {}) =>
  withLocalMovements({
    name: "Séance",
    labelId: null,
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    exercises: ["e0", "a1", "a2", "y0", "b1", "d1", "e9"].map((id) => overrides[id] ?? exercise(id, id === "b1" ? 2 : 1)),
    structure: layout,
  });

const hidden = { includeHiddenElements: true } as const;
const t = strings.screens.composition.activityActions;

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

describe("B.5 — balayage et actions d'une carte dans une disposition générale", () => {
  it("balayage gauche : Dupliquer et Supprimer révélés ; une carte à la fois ; appui court neutre sur la carte ouverte", async () => {
    await renderComposition(sampleDraft());
    expect(screen.queryByTestId("composition-activity-actions-a1", hidden)).toBeNull();
    swipeLeft("a1");
    const group = screen.getByTestId("composition-activity-actions-a1", hidden);
    expect(within(group).getByText(t.duplicate, hidden)).toBeTruthy();
    expect(within(group).getByText(t.delete, hidden)).toBeTruthy();
    // Les autres cartes sont bloquées tant que celle-ci est ouverte.
    expect(screen.getByTestId("composition-activity-a2", hidden).props.pointerEvents).toBe("none");
    // Appui court sur la carte ouverte : ni modification, ni fermeture.
    fireEvent.press(screen.getByTestId("composition-exercise-row-a1", hidden));
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByTestId("composition-activity-actions-a1", hidden)).toBeTruthy();
  });

  it("actions accessibles « Dupliquer » / « Supprimer » sur chaque carte ; aucune sur les en-têtes de Circuit ou de Cycle (ARB-08)", async () => {
    await renderComposition(sampleDraft());
    for (const id of ["e0", "a1", "y0", "b1", "d1"]) {
      const names = screen.getByTestId(`composition-exercise-row-${id}`, hidden).props.accessibilityActions.map((action: { name: string }) => action.name);
      expect(names).toEqual(expect.arrayContaining(["duplicate", "delete"]));
    }
    const withActions = screen.UNSAFE_root.findAll(
      (node) => typeof node.type === "string" && Array.isArray(node.props.accessibilityActions) && node.props.accessibilityActions.length > 0,
    );
    const duplicators = withActions
      .filter((node) => node.props.accessibilityActions.some((action: { name: string }) => action.name === "duplicate" || action.name === "delete"))
      .map((node) => String(node.props.testID));
    expect(duplicators.length).toBeGreaterThan(0);
    for (const testID of duplicators) expect(testID).toMatch(/^composition-exercise-row-/);
  });

  it("Supprimer (membre parmi d'autres) : la carte s'efface puis le Circuit se resserre, sans autre changement", async () => {
    await renderComposition(sampleDraft());
    swipeLeft("a1");
    const before = probe.draft;
    fireEvent.press(screen.getByTestId("composition-activity-delete-a1", hidden));
    // La carte s'efface dans son enveloppe, inerte et cachée à VoiceOver ; le brouillon est écrit à la
    // fin du mouvement (comme la suppression de l'ancien modèle).
    const motion = screen.getByTestId("composition-layout-card-motion-a1", hidden);
    expect(motion.props.pointerEvents).toBe("none");
    expect(motion.props.accessibilityElementsHidden).toBe(true);
    expect(probe.draft).toBe(before);
    await settle();
    expect(shape(probe.draft)).toBe("e0 ca[a2] cy{y0 cb[b1]} cz{cd[d1]} e9");
    expect(screen.queryByTestId("composition-activity-a1", hidden)).toBeNull();
    expect(screen.getByTestId("composition-layout-circuit-ca", hidden)).toBeTruthy();
  });

  it("Supprimer le dernier membre d'un Circuit : brouillon écrit, Circuit (avec sa carte) effacé lentement à sa place, puis démonté", async () => {
    await renderComposition(sampleDraft());
    fireEvent(screen.getByTestId("composition-exercise-row-b1", hidden), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    expect(shape(probe.draft)).toBe("e0 ca[a1,a2] cy{y0} cz{cd[d1]} e9");
    const ghost = screen.getByTestId("composition-layout-vanishing-circuit-cb", hidden);
    expect(ghost.props.pointerEvents).toBe("none");
    expect(within(ghost).getByTestId("composition-exercise-row-b1", hidden)).toBeTruthy();
    expect(screen.queryByTestId("composition-layout-circuit-cb", hidden)).toBeNull();
    await settle();
    expect(screen.queryByTestId("composition-layout-vanishing-circuit-cb", hidden)).toBeNull();
  });

  it("Supprimer le dernier membre du seul Circuit d'un Cycle : Circuit et Cycle retirés, le Cycle s'efface à sa place", async () => {
    await renderComposition(sampleDraft());
    swipeLeft("d1");
    fireEvent.press(screen.getByTestId("composition-activity-delete-d1", hidden));
    expect(shape(probe.draft)).toBe("e0 ca[a1,a2] cy{y0 cb[b1]} e9");
    const ghost = screen.getByTestId("composition-layout-vanishing-cycle-cz", hidden);
    expect(within(ghost).getByTestId("composition-exercise-row-d1", hidden)).toBeTruthy();
    await settle();
    expect(screen.queryByTestId("composition-layout-vanishing-cycle-cz", hidden)).toBeNull();
  });

  it("Dupliquer : copie juste après la source, dans le même conteneur ; Circuit alterné : N conservé", async () => {
    await renderComposition(sampleDraft());
    swipeLeft("b1");
    fireEvent.press(screen.getByTestId("composition-activity-duplicate-b1", hidden));
    expect(shape(probe.draft)).toBe("e0 ca[a1,a2] cy{y0 cb[b1,copy-id]} cz{cd[d1]} e9");
    // Les actions se referment : les autres cartes ne sont plus bloquées.
    expect(screen.getByTestId("composition-activity-a1", hidden).props.pointerEvents).toBe("auto");
    const copy = probe.draft!.exercises.find((item) => item.id === "copy-id")!;
    expect(seriesCountOf(copy.executionParameters)).toBe(2);
    // La copie apparaît dans son enveloppe, puis repose.
    expect(screen.getByTestId("composition-layout-card-motion-copy-id", hidden)).toBeTruthy();
    await settle();
    expect(screen.getByTestId("composition-exercise-row-copy-id", hidden)).toBeTruthy();
  });

  it("Dupliquer un Exercice formaté : Format et réglages conservés, rien transmis (ARB-17, correction C.1)", async () => {
    const amrap: SessionDraftExercise = { ...exercise("e0", 1), format: { key: "AMRAP", settings: { durationSeconds: 720 } } };
    await renderComposition(sampleDraft({ e0: amrap }));
    fireEvent(screen.getByTestId("composition-exercise-row-e0", hidden), "accessibilityAction", { nativeEvent: { actionName: "duplicate" } });
    expect(shape(probe.draft)).toBe("e0 copy-id ca[a1,a2] cy{y0 cb[b1]} cz{cd[d1]} e9");
    expect(probe.draft!.exercises.find((item) => item.id === "copy-id")!.format).toEqual({ key: "AMRAP", settings: { durationSeconds: 720 } });
    expect(probe.draft!.exercises.filter((item) => (item.format ?? null) !== null).map((item) => item.id).sort()).toEqual(["copy-id", "e0"]);
  });

  it("« Réduire les animations » : suppression du dernier membre écrite aussitôt, sans effacement progressif", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    await renderComposition(sampleDraft());
    fireEvent(screen.getByTestId("composition-exercise-row-b1", hidden), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    expect(shape(probe.draft)).toBe("e0 ca[a1,a2] cy{y0} cz{cd[d1]} e9");
    expect(screen.queryByTestId("composition-layout-vanishing-circuit-cb", hidden)).toBeNull();
    // Membre parmi d'autres : écrit aussitôt aussi.
    fireEvent(screen.getByTestId("composition-exercise-row-a1", hidden), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    expect(shape(probe.draft)).toBe("e0 ca[a2] cy{y0} cz{cd[d1]} e9");
  });
});
