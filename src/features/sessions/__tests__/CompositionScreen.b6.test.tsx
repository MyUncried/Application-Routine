import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { AccessibilityInfo, Alert, Platform, type AlertButton } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { SessionStructure, StructureStopPointLocation } from "@/domain/sessions/structure";
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
 * PRE-9 story B.6 (ARB-02, ARB-02a, ARB-02b, ARB-06 ; D-441, D-442 ; ch08 « Placement des récupérations
 * et des points d'arrêt » ; CE-T03-08) — Points d'arrêt rendus sur toute la structure d'une disposition
 * générale, « Monter » / « Descendre » d'un Point, compte du Cycle, mode Placement sur tous les niveaux et
 * choix de début ou de fin de répétition. Harnais repris de B.5. Jest ne prouve ni le rendu ni le
 * geste sur iPhone (glisser d'un Point : recette).
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

type Point = StructureStopPointLocation & { readonly id: string };
const withPoints = (stopPoints: Point[]) => {
  const draft = sampleDraft();
  return { ...draft, structure: { ...draft.structure!, stopPoints } };
};
const pointsOf = (draft: SessionDraft | null) =>
  (draft?.structure?.stopPoints ?? []).map((point) => [point.circuitId, point.cycleId ?? null, point.position]);

function tourChoiceAlert() {
  return jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
}
function answerTourChoice(alert: ReturnType<typeof tourChoiceAlert>, label: string) {
  const call = alert.mock.calls.at(-1);
  if (call === undefined) throw new Error("aucun dialogue de choix");
  const button = (call[2] as AlertButton[]).find((candidate) => candidate.text === label);
  if (button?.onPress === undefined) throw new Error(`bouton absent : ${label}`);
  act(() => button.onPress!());
}

const placement = strings.screens.composition.placement;
const CZ_COUNTER = "composition-layout-cycle-cz-header-counter";

describe("PRE-9 B.6 — Points d'arrêt rendus sur toute la structure (D-441, ARB-02a)", () => {
  it("Séance, Cycle, Circuit d'un Cycle : chaque Point est une rangée à sa place, nommée par l'Exercice qui le précède", async () => {
    await renderComposition(
      withPoints([
        { id: "p-session", circuitId: null, position: 1 },
        { id: "p-cycle", circuitId: null, cycleId: "cy", position: 1 },
        { id: "p-circuit", circuitId: "cb", position: 1 },
      ]),
    );
    for (const id of ["p-session", "p-cycle", "p-circuit"]) {
      expect(screen.getByTestId(`composition-layout-stop-point-${id}`)).toBeTruthy();
    }
    expect(within(screen.getByTestId("composition-layout-cycle-cy")).getByTestId("composition-layout-stop-point-p-cycle")).toBeTruthy();
    expect(within(screen.getByTestId("composition-layout-circuit-cb")).getByTestId("composition-layout-stop-point-p-circuit")).toBeTruthy();
    expect(screen.getByTestId("composition-stop-point-p-session-chip").props.accessibilityLabel).toBe(
      placement.existingStopPointAccessibilityLabel.replace("{exercise}", "Exercice e0"),
    );
  });

  it("« Descendre » d'un Point : il entre dans le conteneur suivant à la première position acceptée (ARB-06)", async () => {
    await renderComposition(withPoints([{ id: "p", circuitId: null, cycleId: "cy", position: 1 }]));
    // Après y0 (Cycle) → tête du Circuit B (début de Tour de cb, dans le Cycle).
    fireEvent(screen.getByTestId("composition-stop-point-p-chip"), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
    await settle();
    expect(pointsOf(probe.draft)).toEqual([["cb", null, 0]]);
  });

  it("compte du Cycle ramené à 1 : un Point de fin de répétition devenu interdit est retiré sans message (D-442, ARB-02b)", async () => {
    // Cycle Z × 3 [Circuit D [d1]] suivi de e9 ; e9 retiré de la disposition : le Cycle Z clôt la Séance.
    const draft = withPoints([{ id: "t", circuitId: null, cycleId: "cz", position: 1 }]);
    const closing = {
      ...draft,
      exercises: draft.exercises.filter((item) => item.id !== "e9"),
      structure: { ...draft.structure!, elements: draft.structure!.elements.slice(0, 4) },
    };
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
    await renderComposition(closing);
    for (let step = 0; step < 2; step += 1) {
      act(() => {
        fireEvent(screen.getByTestId(CZ_COUNTER), "accessibilityAction", { nativeEvent: { actionName: "decrement" } });
      });
    }
    await settle();
    const cycle = probe.draft?.structure?.elements[3];
    expect(cycle?.kind === "CYCLE" ? cycle.cycle.repeatCount : null).toBe(1);
    expect(pointsOf(probe.draft)).toEqual([]);
    expect(announce).toHaveBeenCalledWith(strings.screens.composition.stopPointsRemovedAnnouncement.singular);
  });
});

describe("PRE-9 B.6 — mode Placement sur une disposition générale (ch08, CE-T03-08)", () => {
  async function enterPlacement() {
    fireEvent.press(screen.getByTestId("composition-add-stop-action"));
    await settle();
  }

  it("emplacements de tous les niveaux : sous les cartes, en tête de Cycle et de Circuit ; ajout confirmé dans le Cycle", async () => {
    await renderComposition(sampleDraft());
    await enterPlacement();
    expect(screen.getByTestId("composition-placement-bar")).toBeTruthy();
    // Sous la carte e0 (niveau Séance), sous y0 (Cycle), sous b1 (Circuit du Cycle).
    for (const id of ["e0", "y0", "b1"]) expect(screen.getByTestId(`composition-placement-slot-${id}-stop-point`)).toBeTruthy();
    // Têtes du Cycle et du Circuit B : rangées autonomes.
    expect(screen.getByTestId("composition-layout-placement-cycle-cy-0-stop-point")).toBeTruthy();
    expect(screen.getByTestId("composition-layout-placement-circuit-cb-0-stop-point")).toBeTruthy();
    fireEvent.press(screen.getByTestId("composition-layout-placement-cycle-cy-0-stop-point"));
    expect(screen.getByTestId("composition-placement-bar-confirm")).toBeTruthy();
    fireEvent.press(screen.getByTestId("composition-placement-bar-confirm"));
    await settle();
    expect(pointsOf(probe.draft)).toEqual([[null, "cy", 0]]);
    expect(screen.queryByTestId("composition-placement-bar")).toBeNull();
    expect(screen.getByTestId(`composition-layout-stop-point-${(probe.draft!.structure!.stopPoints[0] as Point).id}`)).toBeTruthy();
  });

  it("ARB-02b : début et fin de répétition d'un Cycle répété — choix « Début / Fin de répétition » (même dialogue)", async () => {
    const alert = tourChoiceAlert();
    await renderComposition(withPoints([{ id: "h", circuitId: null, cycleId: "cy", position: 0 }]));
    await enterPlacement();
    // Fin du Cycle × 2 (après le Circuit B) : rangée autonome « après le circuit » dans le Cycle.
    fireEvent.press(screen.getByTestId("composition-layout-placement-cycle-cy-2-stop-point"));
    const choice = strings.screens.composition.repetitionBoundaryChoice;
    expect(alert.mock.calls.at(-1)?.[0]).toBe(choice.title);
    answerTourChoice(alert, choice.tail);
    fireEvent.press(screen.getByTestId("composition-placement-bar-confirm"));
    await settle();
    expect(pointsOf(probe.draft)).toEqual([[null, "cy", 2]]);
  });

  it("D-441 : un Point existant apparaît sélectionné ; le désélectionner programme son retrait, confirmé", async () => {
    await renderComposition(withPoints([{ id: "p", circuitId: "cb", position: 1 }]));
    await enterPlacement();
    const existing = screen.getByTestId("composition-placement-slot-b1-stop-point-existing");
    expect(existing.props.accessibilityState).toMatchObject({ selected: true });
    fireEvent.press(existing);
    expect(screen.getByTestId("composition-placement-bar-confirm").props.accessibilityLabel ?? "").toContain(placement.confirmChanges);
    fireEvent.press(screen.getByTestId("composition-placement-bar-confirm"));
    await settle();
    expect(pointsOf(probe.draft)).toEqual([]);
  });

  it("RM-209 / RM-210 : la zone de récupération d'une carte de Circuit de Cycle se règle en placement", async () => {
    await renderComposition(sampleDraft());
    await enterPlacement();
    expect(screen.getByTestId("composition-placement-slot-b1-recovery")).toBeTruthy();
  });
});
