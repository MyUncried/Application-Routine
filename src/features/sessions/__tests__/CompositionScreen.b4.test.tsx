import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
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
 * PRE-9 story B.4 (COMP §6 G1–G8, ARB-06, ARB-09 ; précision de Hermann du 30/10/2026 sur le retrait
 * d'un Circuit) — glisser-déposer dans une disposition générale : destination éclairée, dépose,
 * refus sans modification, confirmation de perte, Circuit vidé effacé progressivement, Circuit
 * déployé replié à la saisie, Cycle entier, « Monter » / « Descendre ». Harnais repris de B.3 ;
 * mesures injectées (`layout`). Jest ne prouve pas le rendu ni le geste sur iPhone.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-id") }));
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

/** e0, Circuit A groupé × 1 [a1, a2], Circuit B alterné × 2 [b1], e9. */
const twoCircuits: Layout = {
  elements: [
    { kind: "EXERCISE", exercise: "e0" },
    { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 1, nature: "TOURS", exercises: ["a1", "a2"] } },
    { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 2, nature: "SERIES", exercises: ["b1"] } },
    { kind: "EXERCISE", exercise: "e9" },
  ],
  stopPoints: [],
};

function draftOf(structure: Layout, exercises: readonly SessionDraftExercise[]): SessionDraft {
  return withLocalMovements({ name: "Séance", labelId: null, initialCountdownSeconds: 10, finalPhaseSeconds: 5, exercises, structure });
}

const twoCircuitsDraft = (overrides: Partial<Record<string, SessionDraftExercise>> = {}) =>
  draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"].map((id) => overrides[id] ?? exercise(id, id === "b1" ? 2 : 1)));

const hidden = { includeHiddenElements: true } as const;

function layout(testID: string, y: number, height: number) {
  fireEvent(screen.getByTestId(testID, hidden), "layout", { nativeEvent: { layout: { x: 0, y, width: 354, height } } });
}

/**
 * Mesures (repère du contenu défilant) : e0 0–80 ; Circuit A 100–320 (en-tête 114–132, cartes a1
 * 141–221, a2 230–310) ; Circuit B 340–470 (en-tête 354–372, carte b1 381–461) ; e9 490–570.
 */
function measureTwoCircuits() {
  layout("composition-layout-exercise-e0", 0, 80);
  layout("composition-layout-circuit-ca", 100, 220);
  layout("composition-layout-circuit-ca-header", 14, 18);
  layout("composition-layout-circuit-ca-exercises", 41, 169);
  layout("composition-activity-a1", 0, 80);
  layout("composition-activity-a2", 89, 80);
  layout("composition-layout-circuit-cb", 340, 130);
  layout("composition-layout-circuit-cb-header", 14, 18);
  layout("composition-layout-circuit-cb-exercises", 41, 80);
  layout("composition-activity-b1", 0, 80);
  layout("composition-layout-exercise-e9", 490, 80);
}

/** Appui long sur la carte, déplacement du doigt jusqu'à `toY` (ordonnée du contenu), sans relâcher. */
function liftCard(id: string, fromY: number, toY: number) {
  const container = screen.getByTestId(`composition-activity-${id}`, hidden);
  fireEvent(container, "touchStart", { nativeEvent: { pageX: 200, pageY: fromY } });
  fireEvent(screen.getByTestId(`composition-exercise-row-${id}`), "longPress");
  fireEvent(container, "responderMove", { nativeEvent: { pageX: 200, pageY: toY } });
  return container;
}

function release(container: ReturnType<typeof screen.getByTestId>, y: number) {
  fireEvent(container, "touchEnd", { nativeEvent: { pageX: 200, pageY: y, touches: [] } });
}

function shape(draft: SessionDraft | null): string {
  return (draft?.structure?.elements ?? [])
    .map((element: StructureElement<string>) =>
      element.kind === "EXERCISE"
        ? element.exercise
        : element.kind === "CIRCUIT"
          ? `${element.circuit.id}[${element.circuit.exercises.join(",")}]`
          : `${element.cycle.id}{…}`,
    )
    .join(" ");
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
  mockExitGuard.mockReset();
  mockExitGuard.mockReturnValue({ isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() });
});

describe("B.4 — glisser-déposer dans une disposition générale (COMP §6, ARB-06)", () => {
  it("Exercice de la Séance glissé dans un Circuit : destination éclairée pendant le geste, dépose au rang visé", async () => {
    await renderComposition(twoCircuitsDraft());
    measureTwoCircuits();
    const before = probe.draft;
    // Centre de e9 : 530 ; entre a1 et a2 : 225,5.
    const card = liftCard("e9", 530, 225.5);
    expect(screen.getByTestId("composition-body").props.scrollEnabled).toBe(false);
    expect(screen.getByTestId("composition-layout-circuit-ca-drop-target", hidden)).toBeTruthy();
    expect(screen.queryByTestId("composition-layout-circuit-cb-drop-target", hidden)).toBeNull();
    expect(screen.getByTestId("composition-layout-drop-line", hidden)).toBeTruthy();
    // Aucune écriture avant le relâchement.
    expect(probe.draft).toBe(before);

    release(card, 225.5);
    expect(shape(probe.draft)).toBe("e0 ca[a1,e9,a2] cb[b1]");
    expect(screen.queryByTestId("composition-layout-drop-line", hidden)).toBeNull();
    expect(screen.getByTestId("composition-body").props.scrollEnabled).toBe(true);
  });

  it("dernier membre d'un Circuit sorti : Circuit retiré au relâchement, effacé progressivement à sa place puis démonté", async () => {
    await renderComposition(twoCircuitsDraft());
    measureTwoCircuits();
    // Centre de b1 : 421 ; sous e9 : 578.
    const card = liftCard("b1", 421, 578);
    expect(screen.queryByTestId("composition-layout-circuit-cb-drop-target", hidden)).toBeNull();
    release(card, 578);

    expect(shape(probe.draft)).toBe("e0 ca[a1,a2] e9 b1");
    // Séance redevenue représentable dans l'ancien modèle : le rendu par structure est conservé le
    // temps de l'effacement, le Circuit vidé à sa place (avant e9).
    const ghost = screen.getByTestId("composition-layout-vanishing-circuit-cb", hidden);
    expect(ghost.props.pointerEvents).toBe("none");
    expect(screen.queryByTestId("composition-layout-circuit-cb", hidden)).toBeNull();
    // Fondu puis fermeture (rappels en microtâche du simulacre).
    await act(async () => undefined);
    await act(async () => undefined);
    await act(async () => undefined);
    expect(screen.queryByTestId("composition-layout-vanishing-circuit-cb", hidden)).toBeNull();
  });

  it("entrée dans un Circuit alterné avec perte : dialogue ; Annuler ne change rien ; Confirmer déplace et adapte à N", async () => {
    await renderComposition(twoCircuitsDraft({ e0: exercise("e0", 3) }));
    measureTwoCircuits();
    const before = probe.draft;
    // Centre de e0 : 40 ; sous b1 (fin du Circuit B) : 465.
    release(liftCard("e0", 40, 465), 465);
    const t = strings.screens.composition.circuitEntryConfirmModal;
    expect(screen.getByTestId("circuit-entry-confirm-card")).toBeTruthy();
    expect(probe.draft).toBe(before);
    fireEvent.press(screen.getByLabelText(t.cancel));
    expect(screen.queryByTestId("circuit-entry-confirm-card")).toBeNull();
    expect(probe.draft).toBe(before);

    measureTwoCircuits();
    release(liftCard("e0", 40, 465), 465);
    fireEvent.press(screen.getByLabelText(t.confirm));
    expect(shape(probe.draft)).toBe("ca[a1,a2] cb[b1,e0] e9");
    expect(seriesCountOf(probe.draft!.exercises.find((item) => item.id === "e0")!.executionParameters)).toBe(2);
  });

  it("Exercice formaté incompatible avec un Circuit alterné : refus sans modification, raison annoncée", async () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
    const amrap: SessionDraftExercise = { ...exercise("e0", 2), format: { key: "AMRAP", settings: {} } };
    await renderComposition(twoCircuitsDraft({ e0: amrap }));
    measureTwoCircuits();
    const before = probe.draft;
    release(liftCard("e0", 40, 465), 465);
    expect(probe.draft).toBe(before);
    expect(screen.queryByTestId("circuit-entry-confirm-card")).toBeNull();
    expect(announce).toHaveBeenCalledWith(strings.screens.composition.layoutMove.refused.FORMAT_INCOMPATIBLE);
    announce.mockRestore();
  });

  it("Circuit déployé saisi par son en-tête : replié au début du geste, jamais déposé dans un Circuit (D-451), déplacé au niveau Séance", async () => {
    await renderComposition(twoCircuitsDraft());
    measureTwoCircuits();
    const block = screen.getByTestId("composition-layout-circuit-cb", hidden);
    fireEvent(block, "touchStart", { nativeEvent: { pageX: 100, pageY: 363 } });
    fireEvent(screen.getByTestId("composition-layout-circuit-cb-header-collapse"), "longPress");
    await act(async () => undefined);
    // COMP §6 : le Circuit déployé est replié.
    expect(screen.getByTestId("composition-layout-circuit-cb-header-collapse").props.accessibilityState).toMatchObject({ expanded: false });
    // Vers le milieu du Circuit A (entre a1 et a2) : aucune destination dans un Circuit ; la plus
    // proche admise est au niveau Séance.
    fireEvent(block, "responderMove", { nativeEvent: { pageX: 100, pageY: 225.5 } });
    expect(screen.queryByTestId("composition-layout-circuit-ca-drop-target", hidden)).toBeNull();
    // Avant e0 (ligne à −8).
    fireEvent(block, "responderMove", { nativeEvent: { pageX: 100, pageY: -8 } });
    fireEvent(block, "touchEnd", { nativeEvent: { pageX: 100, pageY: -8, touches: [] } });
    expect(shape(probe.draft)).toBe("cb[b1] e0 ca[a1,a2] e9");
  });

  it("Cycle entier saisi par son titre (ARB-09) et déplacé au niveau Séance", async () => {
    const withCycle: Layout = {
      elements: [
        { kind: "EXERCISE", exercise: "e0" },
        { kind: "CYCLE", cycle: { id: "cy", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: "a1" }] } },
        { kind: "EXERCISE", exercise: "e9" },
      ],
      stopPoints: [],
    };
    await renderComposition(draftOf(withCycle, ["e0", "a1", "e9"].map((id) => exercise(id))));
    layout("composition-layout-exercise-e0", 0, 80);
    layout("composition-layout-cycle-cy", 100, 140);
    layout("composition-layout-cycle-cy-header-reveal", 14, 18);
    layout("composition-layout-exercise-a1", 41, 80);
    layout("composition-layout-exercise-e9", 260, 80);
    const block = screen.getByTestId("composition-layout-cycle-cy", hidden);
    fireEvent(block, "touchStart", { nativeEvent: { pageX: 100, pageY: 123 } });
    fireEvent(screen.getByTestId("composition-layout-cycle-cy-header-grab"), "longPress");
    fireEvent(block, "responderMove", { nativeEvent: { pageX: 100, pageY: 348 } });
    fireEvent(block, "touchEnd", { nativeEvent: { pageX: 100, pageY: 348, touches: [] } });
    const elements = probe.draft!.structure!.elements;
    expect(elements.map((element) => element.kind)).toEqual(["EXERCISE", "EXERCISE", "CYCLE"]);
    const cycle = elements[2];
    expect(cycle?.kind === "CYCLE" && cycle.cycle).toMatchObject({ id: "cy", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: "a1" }] });
  });

  it("« Monter » / « Descendre » (stepOccurrence généralisé) : sortie et entrée d'un Circuit", async () => {
    await renderComposition(twoCircuitsDraft());
    const actions = (id: string) =>
      screen.getByTestId(`composition-exercise-row-${id}`).props.accessibilityActions.map((action: { name: string }) => action.name);
    expect(actions("e0")).toEqual(["moveDown"]);
    fireEvent(screen.getByTestId("composition-exercise-row-a1"), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    expect(shape(probe.draft)).toBe("e0 a1 ca[a2] cb[b1] e9");
    fireEvent(screen.getByTestId("composition-exercise-row-e0"), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
    expect(shape(probe.draft)).toBe("a1 e0 ca[a2] cb[b1] e9");
  });
});
