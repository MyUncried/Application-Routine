import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactTestInstance } from "react-test-renderer";
import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { Animated, Platform, StyleSheet } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { SessionStructure, StructureElement, StructureStopPoint } from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { LAYOUT_COLLAPSED_HOVER_DELAY_MS } from "@/features/sessions/layoutDrop";
import { SessionDraftContext, type SessionDraftContextValue, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-9 — recette iPhone n° 2 du 31/10/2026, constats de Hermann :
 * b) « L'arrêt d'une carte sur un circuit replié doit l'ouvrir » ;
 * c) « Appui long sur la zone de la durée d'un circuit ou d'un cycle doit permettre de le déplacer ».
 * Harnais de `CompositionScreen.recette2.test.tsx` (mesures injectées, pilote natif simulé). Jest ne
 * prouve ni le rendu, ni le geste, ni le délai ressenti sur iPhone. Le délai d'arrêt est piloté de
 * façon déterministe : les minuteries de `LAYOUT_COLLAPSED_HOVER_DELAY_MS` sont retenues, puis
 * déclenchées par le test (`elapseHoverDelay`).
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

function exercise(id: string): SessionDraftExercise {
  return { ...createExerciseDraft(id, 0), name: `Exercice ${id}`, structuralPosition: "BEFORE_TOUR", executionParameters: durationParameters(30, 1) };
}

type Layout = SessionStructure<string, StructureStopPoint>;

function draftOf(structure: Layout, ids: readonly string[]): SessionDraft {
  return withLocalMovements({
    name: "Séance",
    labelId: null,
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    exercises: ids.map(exercise),
    structure,
  });
}

/** e0, Circuit A [a1, a2], Circuit B [b1], e9. */
const twoCircuits: Layout = {
  elements: [
    { kind: "EXERCISE", exercise: "e0" },
    { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 1, nature: "TOURS", exercises: ["a1", "a2"] } },
    { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1"] } },
    { kind: "EXERCISE", exercise: "e9" },
  ],
  stopPoints: [],
};

/** e0, Cycle Y { Circuit C [c1] }, e9. */
const circuitInCycle: Layout = {
  elements: [
    { kind: "EXERCISE", exercise: "e0" },
    {
      kind: "CYCLE",
      cycle: { id: "cy", repeatCount: 2, members: [{ kind: "CIRCUIT", circuit: { id: "cc", repeatCount: 1, nature: "TOURS", exercises: ["c1"] } }] },
    },
    { kind: "EXERCISE", exercise: "e9" },
  ],
  stopPoints: [],
};

const hidden = { includeHiddenElements: true } as const;

function layout(testID: string, y: number, height: number) {
  fireEvent(screen.getByTestId(testID, hidden), "layout", { nativeEvent: { layout: { x: 0, y, width: 354, height } } });
}

/** e0 0–80 ; Circuit A 100–320 (a1 141–221, a2 230–310) ; Circuit B 340–470 (b1 381–461) ; e9 490–570. */
function measureTwoCircuits() {
  layout("composition-layout-exercise-e0", 0, 80);
  layout("composition-layout-circuit-ca", 100, 220);
  layout("composition-layout-circuit-ca-header-frame", 14, 18);
  layout("composition-layout-circuit-ca-exercises", 41, 169);
  layout("composition-activity-a1", 0, 80);
  layout("composition-activity-a2", 89, 80);
  layout("composition-layout-circuit-cb", 340, 130);
  layout("composition-layout-circuit-cb-header-frame", 14, 18);
  layout("composition-layout-circuit-cb-exercises", 41, 80);
  layout("composition-activity-b1", 0, 80);
  layout("composition-layout-exercise-e9", 490, 80);
}

function liftCard(id: string, fromY: number) {
  const container = screen.getByTestId(`composition-activity-${id}`, hidden);
  fireEvent(container, "touchStart", { nativeEvent: { pageX: 200, pageY: fromY } });
  fireEvent(screen.getByTestId(`composition-exercise-row-${id}`), "longPress");
  return container;
}

async function settle() {
  await act(async () => undefined);
  await act(async () => undefined);
}

/** Minuteries d'arrêt retenues (identifiant → rappel) ; les autres minuteries restent réelles. */
const hoverTimers = new Map<number, () => void>();
let nextHoverTimer = 1_000_000;

/** Le délai d'arrêt s'écoule : les minuteries d'arrêt encore programmées se déclenchent. */
async function elapseHoverDelay() {
  await act(async () => {
    const due = [...hoverTimers.values()];
    hoverTimers.clear();
    for (const callback of due) callback();
  });
  await settle();
}

function translationOf(testID: string): number {
  const transformOf = (instance: ReactTestInstance) =>
    (StyleSheet.flatten(instance.props.style) as { transform?: Record<string, unknown>[] } | undefined)?.transform;
  let node: ReactTestInstance = screen.getByTestId(testID, hidden);
  for (let parent = node.parent; parent !== null && parent.props.testID === testID; parent = parent.parent) {
    if (transformOf(parent) !== undefined) node = parent;
  }
  return (transformOf(node) ?? []).reduce((sum: number, entry) => {
    const value = entry.translateY;
    if (value === undefined) return sum;
    return sum + (typeof value === "number" ? value : (value as { __getValue: () => number }).__getValue());
  }, 0);
}

const rowShift = (id: string) => translationOf(`composition-activity-${id}`);
const expanded = (circuitId: string) =>
  screen.getByTestId(`composition-layout-circuit-${circuitId}-header-collapse`, hidden).props.accessibilityState?.expanded as boolean;

async function collapse(circuitId: string) {
  fireEvent.press(screen.getByTestId(`composition-layout-circuit-${circuitId}-header-collapse`, hidden));
  await settle();
  expect(expanded(circuitId)).toBe(false);
}

function memberShape(member: StructureElement<string>): string {
  if (member.kind === "EXERCISE") return member.exercise;
  if (member.kind === "CIRCUIT") return `${member.circuit.id}[${member.circuit.exercises.join(",")}]`;
  return `${member.cycle.id}{${member.cycle.members.map((inner) => memberShape(inner as StructureElement<string>)).join(",")}}`;
}

function shape(draft: SessionDraft | null): string {
  return (draft?.structure?.elements ?? []).map(memberShape).join(" ");
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
  hoverTimers.clear();
  const realSetTimeout = global.setTimeout;
  const realClearTimeout = global.clearTimeout;
  jest.spyOn(global, "setTimeout").mockImplementation(((callback: () => void, ms?: number, ...args: unknown[]) => {
    if (ms !== LAYOUT_COLLAPSED_HOVER_DELAY_MS) return realSetTimeout(callback, ms, ...args);
    const id = ++nextHoverTimer;
    hoverTimers.set(id, callback);
    return id;
  }) as unknown as typeof setTimeout);
  jest.spyOn(global, "clearTimeout").mockImplementation(((id?: number) => {
    if (typeof id === "number" && hoverTimers.delete(id)) return;
    realClearTimeout(id);
  }) as unknown as typeof clearTimeout);
  // Pilote natif simulé : chaque animation pose sa cible à son départ et se termine aussitôt.
  jest.spyOn(Animated, "timing").mockImplementation((value, config) => {
    const animated = value as Animated.Value;
    return {
      start: (callback?: Animated.EndCallback) => {
        animated.setValue(config.toValue as number);
        callback?.({ finished: true });
      },
      stop: () => undefined,
      reset: () => undefined,
    };
  });
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe("Recette n° 2 (31/10) — b) arrêt d'une carte sur un Circuit replié", () => {
  it("le Circuit replié visé se déploie après l'arrêt ; ses cartes deviennent des destinations", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    await collapse("cb");
    // Replié : bloc de 68, aucune carte rendue ; e9 remonte (428–508).
    layout("composition-layout-circuit-cb", 340, 68);
    layout("composition-layout-exercise-e9", 428, 80);
    const card = liftCard("e9", 468);
    // Doigt au milieu du Circuit replié (374) : sa fin est la destination.
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 374 } });
    await settle();
    // Avant la fin du délai : toujours replié ; une seule minuterie d'arrêt.
    expect(expanded("cb")).toBe(false);
    expect(hoverTimers.size).toBe(1);
    // Petits déplacements sur le même Circuit : l'arrêt continue (aucune nouvelle minuterie).
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 376 } });
    expect(hoverTimers.size).toBe(1);
    await elapseHoverDelay();
    expect(expanded("cb")).toBe(true);
    // Déployé (mesures du Circuit ouvert ; e9, sous lui, descend de 62 dans la mise en page) : la
    // destination sous le doigt immobile est recalculée — en tête du Circuit (376), avant b1.
    layout("composition-layout-circuit-cb", 340, 130);
    layout("composition-layout-circuit-cb-header-frame", 14, 18);
    layout("composition-layout-circuit-cb-exercises", 41, 80);
    layout("composition-activity-b1", 0, 80);
    layout("composition-layout-exercise-e9", 490, 80);
    await settle();
    // b1 descend pour faire la place (80 + 9) ; la carte saisie reste sous le doigt (compensation −62).
    expect(rowShift("b1")).toBe(89);
    expect(rowShift("e9")).toBe(-62);
    fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 374, touches: [] } });
    expect(shape(probe.draft)).toBe("e0 ca[a1,a2] cb[e9,b1]");
  });

  it("lâcher avant la fin du délai : dépose à la fin du Circuit replié", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    await collapse("cb");
    layout("composition-layout-circuit-cb", 340, 68);
    layout("composition-layout-exercise-e9", 428, 80);
    const card = liftCard("e9", 468);
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 374 } });
    await settle();
    expect(hoverTimers.size).toBe(1);
    fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 374, touches: [] } });
    expect(shape(probe.draft)).toBe("e0 ca[a1,a2] cb[b1,e9]");
    // Le lâcher annule la minuterie d'arrêt.
    expect(hoverTimers.size).toBe(0);
  });

  it("passage sans arrêt : le doigt quitte le Circuit replié avant le délai — il reste replié", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    await collapse("cb");
    layout("composition-layout-circuit-cb", 340, 68);
    layout("composition-layout-exercise-e9", 428, 80);
    const card = liftCard("e9", 468);
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 374 } });
    await settle();
    expect(hoverTimers.size).toBe(1);
    // Vers le haut de la Séance : la destination n'est plus le Circuit — minuterie annulée.
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: -10 } });
    expect(hoverTimers.size).toBe(0);
    await elapseHoverDelay();
    expect(expanded("cb")).toBe(false);
    fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: -10, touches: [] } });
    expect(shape(probe.draft)).toBe("e9 e0 ca[a1,a2] cb[b1]");
  });

  it("Circuit replié AU-DESSUS de la carte saisie : déployé, il la déplace dans la mise en page — compensé, elle reste sous le doigt", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    await collapse("ca");
    // Circuit A replié : 100–168 ; Circuit B 188–318 ; e9 338–418.
    layout("composition-layout-circuit-ca", 100, 68);
    layout("composition-layout-circuit-cb", 188, 130);
    layout("composition-layout-exercise-e9", 338, 80);
    const card = liftCard("e9", 378);
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 134 } });
    await elapseHoverDelay();
    expect(expanded("ca")).toBe(true);
    // Déployé : Circuit A 100–320, B 340–470, e9 490–570 (+152).
    layout("composition-layout-circuit-ca", 100, 220);
    layout("composition-layout-circuit-ca-header-frame", 14, 18);
    layout("composition-layout-circuit-ca-exercises", 41, 169);
    layout("composition-activity-a1", 0, 80);
    layout("composition-activity-a2", 89, 80);
    layout("composition-layout-circuit-cb", 340, 130);
    layout("composition-layout-exercise-e9", 490, 80);
    await settle();
    expect(rowShift("e9")).toBe(-152);
    // Doigt à 134 : tête du Circuit A (136), avant a1.
    fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 134, touches: [] } });
    expect(shape(probe.draft)).toBe("e0 ca[e9,a1,a2] cb[b1]");
  });

  it("Circuit replié dans un Cycle : même déploiement après l'arrêt", async () => {
    await renderComposition(draftOf(circuitInCycle, ["e0", "c1", "e9"]));
    await collapse("cc");
    // e0 0–80 ; Cycle 100–230 (Circuit C replié à 41 dans le Cycle : 141–209) ; e9 250–330.
    layout("composition-layout-exercise-e0", 0, 80);
    layout("composition-layout-cycle-cy", 100, 130);
    layout("composition-layout-circuit-cc", 41, 68);
    layout("composition-layout-exercise-e9", 250, 80);
    const card = liftCard("e9", 290);
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 175 } });
    expect(expanded("cc")).toBe(false);
    await elapseHoverDelay();
    expect(expanded("cc")).toBe(true);
    fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 175, touches: [] } });
  });
});

describe("Recette n° 2 (31/10) — c) appui long sur la durée d'un Circuit ou d'un Cycle", () => {
  it("Circuit : l'appui long sur la durée saisit le Circuit, comme son titre (déployé : replié d'abord)", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    const block = screen.getByTestId("composition-layout-circuit-cb", hidden);
    fireEvent(block, "touchStart", { nativeEvent: { pageX: 300, pageY: 363 } });
    fireEvent(screen.getByTestId("composition-layout-circuit-cb-header-duration", hidden), "longPress");
    await settle();
    // COMP §6 : un Circuit déployé saisi est replié, comme par son titre.
    expect(expanded("cb")).toBe(false);
    fireEvent(block, "touchMove", { nativeEvent: { pageX: 300, pageY: 10, touches: [{}] } });
    fireEvent(block, "touchEnd", { nativeEvent: { pageX: 300, pageY: 10, touches: [] } });
    expect(shape(probe.draft)).toBe("cb[b1] e0 ca[a1,a2] e9");
  });

  it("Cycle : l'appui long sur la durée saisit le Cycle entier", async () => {
    await renderComposition(draftOf(circuitInCycle, ["e0", "c1", "e9"]));
    layout("composition-layout-exercise-e0", 0, 80);
    layout("composition-layout-cycle-cy", 100, 230);
    layout("composition-layout-cycle-cy-header", 14, 18);
    layout("composition-layout-exercise-e9", 350, 80);
    const block = screen.getByTestId("composition-layout-cycle-cy", hidden);
    fireEvent(block, "touchStart", { nativeEvent: { pageX: 300, pageY: 123 } });
    fireEvent(screen.getByTestId("composition-layout-cycle-cy-header-duration", hidden), "longPress");
    fireEvent(block, "touchMove", { nativeEvent: { pageX: 300, pageY: 460, touches: [{}] } });
    fireEvent(block, "touchEnd", { nativeEvent: { pageX: 300, pageY: 460, touches: [] } });
    expect(shape(probe.draft)).toBe("e0 e9 cy{cc[c1]}");
  });

  it("la durée reste hors de l'accessibilité, sans appui court ; « Monter » / « Descendre » restent sur le titre", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    const duration = screen.getByTestId("composition-layout-circuit-cb-header-duration", hidden);
    expect(duration.props.accessible).toBe(false);
    expect(duration.props.onPress).toBeUndefined();
    expect(typeof duration.props.onLongPress).toBe("function");
    const title = screen.getByTestId("composition-layout-circuit-cb-header-collapse", hidden);
    expect((title.props.accessibilityActions as { name: string }[]).map((action) => action.name)).toEqual(["moveUp", "moveDown"]);
  });
});
