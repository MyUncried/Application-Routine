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
import { CIRCUIT_REVEAL_DURATION_MS } from "@/features/sessions/CircuitHeader";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { LAYOUT_COLLAPSED_HOVER_DELAY_MS } from "@/features/sessions/layoutDrop";
import { SessionDraftContext, type SessionDraftContextValue, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { AnimatedShiftRegistry } from "@/features/sessions/useAnimatedShift";
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
/** Contre-recette n° 3 : minuteries de fin de déploiement retenues (`CIRCUIT_REVEAL_DURATION_MS`). */
const revealTimers = new Map<number, () => void>();
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

/** Contre-recette n° 3 : le déploiement du Circuit se termine (minuteries de fin déclenchées). */
async function elapseReveal() {
  await act(async () => {
    const due = [...revealTimers.values()];
    revealTimers.clear();
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
  revealTimers.clear();
  const realSetTimeout = global.setTimeout;
  const realClearTimeout = global.clearTimeout;
  jest.spyOn(global, "setTimeout").mockImplementation(((callback: () => void, ms?: number, ...args: unknown[]) => {
    if (ms === CIRCUIT_REVEAL_DURATION_MS) {
      const id = ++nextHoverTimer;
      revealTimers.set(id, callback);
      return id;
    }
    if (ms !== LAYOUT_COLLAPSED_HOVER_DELAY_MS) return realSetTimeout(callback, ms, ...args);
    const id = ++nextHoverTimer;
    hoverTimers.set(id, callback);
    return id;
  }) as unknown as typeof setTimeout);
  jest.spyOn(global, "clearTimeout").mockImplementation(((id?: number) => {
    if (typeof id === "number" && (hoverTimers.delete(id) || revealTimers.delete(id))) return;
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
    // [Pendant le déploiement, destination sous le doigt recalculée — remplacé par la contre-recette n° 3 :]
    // pendant le déploiement, la destination reste la fin du Circuit : b1 ne bouge pas.
    expect(rowShift("b1")).toBe(0);
    expect(rowShift("e9")).toBe(-62);
    await elapseReveal();
    // Déploiement terminé : b1 descend pour faire la place (80 + 9) ; la carte saisie reste sous le doigt (compensation −62).
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
    await elapseReveal();
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

/**
 * Contre-recette n° 3 du 31/10/2026 (cr4-replie, Hermann) :
 * a) « le circuit déplie, ses cartes descendent mais avec un mouvement saccadé. Les cartes glissent
 *    ensuite normalement. » ;
 * b) « Si je repose la carte à son emplacement initial elle disparaît et l'emplacement reste vide. Un
 *    appui long sur une autre carte par exemple la fait réapparaître. Ce problème n'est pas
 *    systématique. »
 * Jest ne prouve ni la fluidité ni l'ordre natif des poses sous Fabric (à vérifier sur iPhone).
 */
describe("Contre-recette n° 3 (31/10) — cr4-replie", () => {
  /** Translation de la carte (vue hôte) telle que rendue — valeur portée par le dernier rendu. */
  const renderedCardShift = (id: string) =>
    (
      (StyleSheet.flatten(screen.getByTestId(`composition-exercise-row-${id}`, hidden).props.style) as { transform?: Record<string, unknown>[] })
        .transform ?? []
    ).reduce((sum: number, entry) => {
      const value = entry.translateY;
      if (value === undefined) return sum;
      return sum + (typeof value === "number" ? value : (value as { __getValue: () => number }).__getValue());
    }, 0);
  /**
   * Translation de la carte relâchée portée par le rendu du lâcher : lue quand le registre reçoit la
   * pose de départ (effet de ce même rendu, avant tout rendu suivant).
   */
  function watchReleaseRender(id: string): number[] {
    const seen: number[] = [];
    const releases = new Set<unknown>();
    const original = AnimatedShiftRegistry.prototype.apply;
    jest.spyOn(AnimatedShiftRegistry.prototype, "apply").mockImplementation(function (this: AnimatedShiftRegistry, targets, animated, release) {
      // Une pose de départ n'est consommée qu'une fois (par identité) : son premier rendu seulement.
      if (release !== null && release !== undefined && release.key.endsWith(id) && !releases.has(release)) {
        releases.add(release);
        seen.push(renderedCardShift(id));
      }
      original.call(this, targets, animated, release);
    });
    return seen;
  }
  const zIndexOf = (id: string) => (StyleSheet.flatten(screen.getByTestId(`composition-activity-${id}`, hidden).props.style) as { zIndex?: number }).zIndex;

  it("a) pendant le déploiement, la destination reste la fin du Circuit : ses cartes ne bougent pas à chaque mesure ; puis la place s'ouvre sous le doigt", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    await collapse("cb");
    layout("composition-layout-circuit-cb", 340, 68);
    layout("composition-layout-exercise-e9", 428, 80);
    const card = liftCard("e9", 468);
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 374 } });
    await elapseHoverDelay();
    expect(expanded("cb")).toBe(true);
    // Mesures intermédiaires du déploiement (fil UI → rappels de mise en page) : le Circuit grandit.
    layout("composition-layout-circuit-cb-header-frame", 14, 18);
    layout("composition-layout-circuit-cb-exercises", 41, 80);
    layout("composition-activity-b1", 0, 80);
    for (const height of [80, 95, 110, 124, 130]) {
      layout("composition-layout-circuit-cb", 340, height);
      layout("composition-layout-exercise-e9", 340 + height + 20, 80);
      await settle();
      // Carte du Circuit : aucune translation (elle apparaît en place) ; la place ouverte suit le bas.
      expect(rowShift("b1")).toBe(0);
    }
    // Un doigt qui bouge pendant le déploiement ne change pas la destination.
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 380 } });
    await settle();
    expect(rowShift("b1")).toBe(0);
    await elapseReveal();
    // Déploiement terminé : destination sous le doigt (tête du Circuit), b1 descend (80 + 9).
    expect(rowShift("b1")).toBe(89);
    fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 380, touches: [] } });
    expect(shape(probe.draft)).toBe("e0 ca[a1,a2] cb[e9,b1]");
  });

  it("a) lâcher pendant le déploiement : dépose à la fin du Circuit (la place montrée)", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    await collapse("cb");
    layout("composition-layout-circuit-cb", 340, 68);
    layout("composition-layout-exercise-e9", 428, 80);
    const card = liftCard("e9", 468);
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 374 } });
    await elapseHoverDelay();
    layout("composition-layout-circuit-cb", 340, 110);
    layout("composition-layout-circuit-cb-header-frame", 14, 18);
    layout("composition-layout-circuit-cb-exercises", 41, 80);
    layout("composition-activity-b1", 0, 80);
    layout("composition-layout-exercise-e9", 470, 80);
    await settle();
    fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 374, touches: [] } });
    expect(shape(probe.draft)).toBe("e0 ca[a1,a2] cb[b1,e9]");
    // La fin du déploiement n'est plus attendue.
    expect(revealTimers.size).toBe(0);
  });

  it("b) carte reposée à sa place (cas simple) : le rendu du lâcher porte une translation nulle de la carte ; rien ne change", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    const seen = watchReleaseRender("e9");
    const card = liftCard("e9", 530);
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 300 } });
    await settle();
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 545 } });
    await settle();
    // Contre-recette n° 4 : translation du doigt native dès sa création — lue sur la valeur animée (vivante).
    expect(translationOf("composition-exercise-row-e9")).toBe(15);
    fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 545, touches: [] } });
    await settle();
    expect(seen).toEqual([0]);
    expect(shape(probe.draft)).toBe("e0 ca[a1,a2] cb[b1] e9");
    // Retour terminé : carte à sa place, hors du premier plan.
    expect(rowShift("e9")).toBe(0);
    expect(renderedCardShift("e9")).toBe(0);
    expect(zIndexOf("e9")).toBeUndefined();
  });

  it("b) après le déploiement d'un Circuit replié AU-DESSUS d'elle, la carte reposée à sa place revient sans décalage", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    await collapse("ca");
    layout("composition-layout-circuit-ca", 100, 68);
    layout("composition-layout-circuit-cb", 188, 130);
    layout("composition-layout-exercise-e9", 338, 80);
    const seen = watchReleaseRender("e9");
    const card = liftCard("e9", 378);
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 134 } });
    await elapseHoverDelay();
    layout("composition-layout-circuit-ca", 100, 220);
    layout("composition-layout-circuit-ca-header-frame", 14, 18);
    layout("composition-layout-circuit-ca-exercises", 41, 169);
    layout("composition-activity-a1", 0, 80);
    layout("composition-activity-a2", 89, 80);
    layout("composition-layout-circuit-cb", 340, 130);
    layout("composition-layout-exercise-e9", 490, 80);
    await settle();
    await elapseReveal();
    // Compensation : la carte, descendue de 152 dans la mise en page, reste sous le doigt.
    expect(rowShift("e9")).toBe(-152);
    // Retour à sa place (après le Circuit B, 478) : la translation du doigt vaut 100.
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 478 } });
    await settle();
    expect(translationOf("composition-exercise-row-e9")).toBe(100);
    fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 478, touches: [] } });
    await settle();
    // Le rendu du lâcher ne porte plus la translation du doigt (100) : seule la translation du
    // registre (position affichée, −52) amène la carte à sa place.
    expect(seen).toEqual([0]);
    expect(shape(probe.draft)).toBe("e0 ca[a1,a2] cb[b1] e9");
    expect(rowShift("e9")).toBe(0);
    expect(renderedCardShift("e9")).toBe(0);
    expect(zIndexOf("e9")).toBeUndefined();
  });
});

/**
 * Contre-recette n° 3 du 31/10/2026 (b6-deplacer, Hermann) : « Exercice dans un cycle / un circuit avec
 * un point d'arrêt en début de cycle / circuit : le déplacement de l'exercice avant le point d'arrêt est
 * interdit. Par contre, le déplacement du point d'arrêt après l'exercice à la fin du cycle / circuit est
 * autorisée. La situation à la fin est pourtant la même mais la solution autorise l'un mais pas
 * l'autre. » — classe A (RM-219, RM-251, D-441, D-442 : le verdict ne dépend que de la structure
 * obtenue). Glisser et « Monter » (VoiceOver), Circuit et Cycle, un ou deux membres, N = 1 et 2.
 */
describe("Contre-recette n° 3 (31/10) — b6-deplacer : Exercice monté au-dessus du Point de tête de son conteneur", () => {
  type Point = StructureStopPoint & { readonly id: string };
  const headPoint = (kind: "CIRCUIT" | "CYCLE"): Point =>
    (kind === "CIRCUIT" ? { id: "p", circuitId: "ca", position: 0 } : { id: "p", circuitId: null, cycleId: "ca", position: 0 }) as Point;
  /** e0, conteneur ca [P, ...membres] (Circuit ou Cycle, N), Circuit cb [b1], e9. */
  const withHeadPoint = (kind: "CIRCUIT" | "CYCLE", members: string[], repeatCount: number): Layout => ({
    elements: [
      { kind: "EXERCISE", exercise: "e0" },
      kind === "CIRCUIT"
        ? { kind: "CIRCUIT", circuit: { id: "ca", repeatCount, nature: "TOURS", exercises: members } }
        : { kind: "CYCLE", cycle: { id: "ca", repeatCount, members: members.map((member) => ({ kind: "EXERCISE" as const, exercise: member })) } },
      { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1"] } },
      { kind: "EXERCISE", exercise: "e9" },
    ],
    stopPoints: [headPoint(kind)],
  });
  /** e0 0–80 ; conteneur 100– (en-tête 114–132 ; Point 141–171 ; membres de 180, pas de 89) ; cb ; e9. */
  function measureHeadPoint(kind: "CIRCUIT" | "CYCLE", members: string[]) {
    const prefix = kind === "CIRCUIT" ? "composition-layout-circuit-ca" : "composition-layout-cycle-ca";
    const height = 80 + members.length * 89;
    layout("composition-layout-exercise-e0", 0, 80);
    layout(prefix, 100, height);
    if (kind === "CIRCUIT") {
      layout(`${prefix}-header-frame`, 14, 18);
      layout(`${prefix}-exercises`, 41, height - 41);
      layout("composition-layout-stop-point-p", 0, 30);
      members.forEach((member, index) => layout(`composition-activity-${member}`, 39 + index * 89, 80));
    } else {
      layout(`${prefix}-header`, 14, 18);
      layout("composition-layout-stop-point-p", 41, 30);
      members.forEach((member, index) => layout(`composition-layout-exercise-${member}`, 80 + index * 89, 80));
    }
    const cb = 100 + height + 20;
    layout("composition-layout-circuit-cb", cb, 130);
    layout("composition-layout-circuit-cb-header-frame", 14, 18);
    layout("composition-layout-circuit-cb-exercises", 41, 80);
    layout("composition-activity-b1", 0, 80);
    layout("composition-layout-exercise-e9", cb + 150, 80);
  }
  const pointOf = (draft: SessionDraft | null) =>
    (draft?.structure?.stopPoints ?? []).map((point) => ({ container: point.circuitId ?? point.cycleId ?? null, position: point.position }));
  const containerShape = (kind: "CIRCUIT" | "CYCLE", members: string[]) => (kind === "CIRCUIT" ? `ca[${members.join(",")}]` : `ca{${members.join(",")}}`);

  for (const kind of ["CIRCUIT", "CYCLE"] as const) {
    for (const repeatCount of [1, 2]) {
      for (const members of [["a1"], ["a1", "a2"]]) {
        for (const moved of members) {
          const after = [moved, ...members.filter((member) => member !== moved)];
          const label = `${kind === "CIRCUIT" ? "Circuit" : "Cycle"} × ${repeatCount} [P, ${members.join(", ")}]`;

          it(`${label} — glisser ${moved} au-dessus du Point : accepté, ${moved} devant le Point dans le conteneur`, async () => {
            await renderComposition(draftOf(withHeadPoint(kind, members, repeatCount), ["e0", ...members, "b1", "e9"]));
            measureHeadPoint(kind, members);
            const card = liftCard(moved, 180 + members.indexOf(moved) * 89 + 40);
            // Doigt juste sous l'en-tête, au-dessus du Point.
            fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 137 } });
            await settle();
            fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 137, touches: [] } });
            await settle();
            expect(shape(probe.draft)).toBe(`e0 ${containerShape(kind, after)} cb[b1] e9`);
            expect(pointOf(probe.draft)).toEqual([{ container: "ca", position: 1 }]);
          });

          it(`${label} — « Monter » ${moved} : ${members.indexOf(moved) === 0 ? "franchit le Point" : "échange avec le membre voisin"}`, async () => {
            await renderComposition(draftOf(withHeadPoint(kind, members, repeatCount), ["e0", ...members, "b1", "e9"]));
            fireEvent(screen.getByTestId(`composition-exercise-row-${moved}`), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
            await settle();
            const first = members.indexOf(moved) === 0;
            // Décision de Hermann du 31/10 : « Monter » franchit d'abord le Point voisin.
            expect(shape(probe.draft)).toBe(`e0 ${containerShape(kind, first ? members : [...members].reverse())} cb[b1] e9`);
            expect(pointOf(probe.draft)).toEqual([{ container: "ca", position: first ? 1 : 0 }]);
          });
        }

        it(`${kind === "CIRCUIT" ? "Circuit" : "Cycle"} × ${repeatCount} [P, ${members.join(", ")}] — reposé sous le Point (sa place) : rien ne change`, async () => {
          const initial = draftOf(withHeadPoint(kind, members, repeatCount), ["e0", ...members, "b1", "e9"]);
          await renderComposition(initial);
          measureHeadPoint(kind, members);
          const card = liftCard("a1", 220);
          fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 300 } });
          await settle();
          fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 222 } });
          await settle();
          fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 222, touches: [] } });
          await settle();
          expect(probe.draft!.structure).toEqual(initial.structure);
        });
      }
    }
  }
});

/**
 * Contre-recette n° 4 du 01/11/2026 (iPhone, Hermann), voir spec-recette-2-corrections-composition.md :
 * cr5-replie, cr5-reposer, constats a et c. Jest ne prouve ni la fluidité, ni l'ordre des images, ni
 * l'alignement sous le doigt sur iPhone.
 */
describe("Contre-recette n° 4 (01/11) — glisser dans la structure générale", () => {
  /** Translation rendue (vue hôte, valeur du dernier rendu) d'une vue animée. */
  const rendered = (testID: string) =>
    (
      (StyleSheet.flatten(screen.getByTestId(testID, hidden).props.style) as { transform?: Record<string, unknown>[] }).transform ?? []
    ).reduce((sum: number, entry) => {
      const value = entry.translateY;
      if (value === undefined) return sum;
      return sum + (typeof value === "number" ? value : (value as { __getValue: () => number }).__getValue());
    }, 0);
  /** Valeur lue quand le registre reçoit la pose de départ de l'élément relâché (effet du rendu du lâcher). */
  function watchRelease(keySuffix: string, read: () => number): number[] {
    const seen: number[] = [];
    const releases = new Set<unknown>();
    const original = AnimatedShiftRegistry.prototype.apply;
    jest.spyOn(AnimatedShiftRegistry.prototype, "apply").mockImplementation(function (this: AnimatedShiftRegistry, targets, animated, release) {
      if (release !== null && release !== undefined && release.key.endsWith(keySuffix) && !releases.has(release)) {
        releases.add(release);
        seen.push(read());
      }
      original.call(this, targets, animated, release);
    });
    return seen;
  }

  // [« ni pendant le déploiement » : remplacé par la contre-recette n° 5 du 01/11/2026 (« Oui, ouvrir la
  // place pendant le déploiement. ») — la place s'ouvre au départ du déploiement, qui attend la mesure du
  // contenu ; ce test ne la fournit pas : il vérifie l'arrêt et l'attente de ce départ (voir « Contre-recette
  // n° 5 » plus bas).]
  it("cr5-replie : arrêt sur un Circuit replié — aucune place ouverte avant le départ du déploiement (le cadre grandit avec ses cartes), puis la place s'ouvre", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    await collapse("cb");
    layout("composition-layout-circuit-cb", 340, 68);
    layout("composition-layout-exercise-e9", 428, 80);
    const card = liftCard("e9", 468);
    const bottomEdge = () => translationOf("composition-layout-circuit-cb-surface-layers-bottom");
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 374 } });
    await settle();
    // Avant correction : le bord bas du Circuit replié descendait de la place (80 + 9) sans ses cartes.
    expect(bottomEdge()).toBe(0);
    await elapseHoverDelay();
    expect(expanded("cb")).toBe(true);
    layout("composition-layout-circuit-cb-header-frame", 14, 18);
    layout("composition-layout-circuit-cb-exercises", 41, 80);
    layout("composition-activity-b1", 0, 80);
    for (const height of [80, 105, 130]) {
      layout("composition-layout-circuit-cb", 340, height);
      layout("composition-layout-exercise-e9", 340 + height + 20, 80);
      await settle();
      // Pendant le déploiement : le bord bas suit la mise en page seule (aucune translation ajoutée).
      expect(bottomEdge()).toBe(0);
      expect(rowShift("b1")).toBe(0);
    }
    await elapseReveal();
    // Aussitôt après : la place s'ouvre sous le doigt (tête du Circuit, avant b1).
    expect(rowShift("b1")).toBe(89);
    expect(bottomEdge()).toBe(89);
    fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 374, touches: [] } });
    expect(shape(probe.draft)).toBe("e0 ca[a1,a2] cb[e9,b1]");
  });

  it("cr5-replie : lâcher pendant l'arrêt (place non montrée) — dépose toujours à la fin du Circuit replié", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    await collapse("cb");
    layout("composition-layout-circuit-cb", 340, 68);
    layout("composition-layout-exercise-e9", 428, 80);
    const card = liftCard("e9", 468);
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 374 } });
    await settle();
    fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 374, touches: [] } });
    expect(shape(probe.draft)).toBe("e0 ca[a1,a2] cb[b1,e9]");
  });

  it("cr5-reposer : carte reposée à sa place — le rendu du lâcher la garde où elle est affichée (registre = translation du doigt, carte 0)", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    const parts: number[] = [];
    const seen = watchRelease("e9", () => {
      parts.push(rendered("composition-exercise-row-e9"));
      return rowShift("e9") + rendered("composition-exercise-row-e9");
    });
    const card = liftCard("e9", 530);
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 300 } });
    await settle();
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 545 } });
    await settle();
    fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 545, touches: [] } });
    // Avant correction : 0 (registre pas encore posé, carte déjà à 0) — une image à sa place.
    expect(seen).toEqual([15]);
    // Correctif de la contre-recette n° 3 conservé : la translation propre de la carte est rendue à 0.
    expect(parts).toEqual([0]);
    await settle();
    expect(shape(probe.draft)).toBe("e0 ca[a1,a2] cb[b1] e9");
    expect(rowShift("e9")).toBe(0);
  });

  it("cr5-reposer : carte déposée ailleurs — sa translation de registre est posée à la position affichée dès le lâcher", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    const poses: [string, number][] = [];
    const original = AnimatedShiftRegistry.prototype.pose;
    jest.spyOn(AnimatedShiftRegistry.prototype, "pose").mockImplementation(function (this: AnimatedShiftRegistry, key, value) {
      poses.push([key, value]);
      original.call(this, key, value);
    });
    const card = liftCard("e9", 530);
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 40 } });
    await settle();
    poses.length = 0;
    fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 40, touches: [] } });
    expect(poses[0]).toEqual([expect.stringMatching(/e9$/), -490]);
    expect(shape(probe.draft)).toBe("e9 e0 ca[a1,a2] cb[b1]");
  });

  it("cr5-reposer : Point d'arrêt reposé à sa place — la puce revient à 0 et la rangée prend la translation, au même rendu", async () => {
    const withPoint: Layout = { ...twoCircuits, stopPoints: [{ id: "p", circuitId: null, position: 1 }] as unknown as Layout["stopPoints"] };
    await renderComposition(draftOf(withPoint, ["e0", "a1", "a2", "b1", "e9"]));
    layout("composition-layout-exercise-e0", 0, 80);
    layout("composition-layout-stop-point-p", 88, 22);
    layout("composition-layout-circuit-ca", 118, 220);
    layout("composition-layout-circuit-ca-header-frame", 14, 18);
    layout("composition-layout-circuit-ca-exercises", 41, 169);
    layout("composition-activity-a1", 0, 80);
    layout("composition-activity-a2", 89, 80);
    layout("composition-layout-circuit-cb", 346, 130);
    layout("composition-layout-circuit-cb-header-frame", 14, 18);
    layout("composition-layout-circuit-cb-exercises", 41, 80);
    layout("composition-activity-b1", 0, 80);
    layout("composition-layout-exercise-e9", 484, 80);
    const chip: number[] = [];
    const seen = watchRelease("stop:p", () => {
      chip.push(rendered("composition-stop-point-p"));
      return rendered("composition-stop-point-row-p") + rendered("composition-stop-point-p");
    });
    const row = screen.getByTestId("composition-stop-point-row-p", hidden);
    fireEvent(row, "touchStart", { nativeEvent: { pageX: 200, pageY: 99 } });
    fireEvent(screen.getByTestId("composition-stop-point-p-chip"), "longPress");
    fireEvent(row, "responderMove", { nativeEvent: { pageX: 200, pageY: 160 } });
    await settle();
    fireEvent(row, "responderMove", { nativeEvent: { pageX: 200, pageY: 104 } });
    await settle();
    expect(translationOf("composition-stop-point-p")).toBe(5);
    fireEvent(row, "touchEnd", { nativeEvent: { pageX: 200, pageY: 104, touches: [] } });
    // Avant correction : 0 (puce rendue à 0, rangée pas encore posée) — une image à sa place.
    expect(seen).toEqual([5]);
    expect(chip).toEqual([0]);
    await settle();
    expect(probe.draft?.structure?.stopPoints).toEqual([expect.objectContaining({ id: "p", position: 1 })]);
  });

  it("constat a : Circuit saisi — le segment du rail de son bord haut à son anneau reste dessiné ; le contenu défilant garde sa hauteur pendant le repli", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    const body = () => screen.getByTestId("composition-body");
    fireEvent(body(), "contentSizeChange", 402, 900);
    const minHeight = () => (StyleSheet.flatten(body().props.contentContainerStyle) as { minHeight?: number }).minHeight;
    expect(minHeight()).toBeUndefined();
    const block = screen.getByTestId("composition-layout-circuit-cb", hidden);
    fireEvent(block, "touchStart", { nativeEvent: { pageX: 300, pageY: 363 } });
    fireEvent(screen.getByTestId("composition-layout-circuit-cb-header-duration", hidden), "longPress");
    await settle();
    expect(expanded("cb")).toBe(false);
    // [Avant : aucun lien pendant la saisie.] Segment du bord haut (0) à l'anneau.
    const link = StyleSheet.flatten(screen.getByTestId("composition-layout-circuit-cb-rail-link", hidden).props.style) as { top?: number; height?: number };
    expect(link.top).toBe(0);
    expect(link.height).toBeGreaterThan(0);
    // Repli du Circuit saisi : le contenu ne raccourcit pas (aucun recadrage du défilement sous le doigt).
    expect(minHeight()).toBe(900);
    fireEvent(block, "touchMove", { nativeEvent: { pageX: 300, pageY: 10, touches: [{}] } });
    fireEvent(block, "touchEnd", { nativeEvent: { pageX: 300, pageY: 10, touches: [] } });
    await settle();
    expect(shape(probe.draft)).toBe("cb[b1] e0 ca[a1,a2] e9");
    expect(minHeight()).toBeUndefined();
  });

  it("constat c : les cartes d'un Circuit sont dans un contenu non contraint, mesuré à chaque mise en page (base du repli et du déploiement)", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    const content = screen.getByTestId("composition-layout-circuit-ca-exercises-content", hidden);
    expect(typeof content.props.onLayout).toBe("function");
    expect(StyleSheet.flatten(content.props.style)).toMatchObject({ gap: 9 });
    expect(StyleSheet.flatten(content.props.style).maxHeight).toBeUndefined();
    expect(screen.getByTestId("composition-activity-a1", hidden)).toBeTruthy();
  });
});

/**
 * Contre-recette n° 5 du 01/11/2026 (Hermann, cr6-replie KO) : « Oui, ouvrir la place pendant le
 * déploiement. le circuit s'ouvre proprement mais la carte elle fait encore plusieurs soubresauts qu'il
 * faut éliminer. » — 1. classe B : la place s'ouvre à la fin du Circuit pendant son déploiement, dans le
 * même mouvement (courbe et durée du déploiement, départ dans la même tâche) ; 2. classe A : la
 * compensation de la carte saisie (Circuit déployé au-dessus d'elle) est lancée une seule fois, sur le
 * pilote natif, avec le déploiement — aucune pose depuis le fil JS à chaque mesure. Jest ne prouve ni
 * la synchronisation des deux fils natifs ni le ressenti sur iPhone.
 */
describe("Contre-recette n° 5 (01/11) — déploiement par l'arrêt : place ouverte avec lui, carte immobile sous le doigt", () => {
  /** Animations lancées (cible, durée) ; le pilote natif simulé pose sa cible au départ. */
  function recordTimings(): { toValue: number; duration: number | undefined }[] {
    const seen: { toValue: number; duration: number | undefined }[] = [];
    jest.spyOn(Animated, "timing").mockImplementation((value, config) => {
      seen.push({ toValue: config.toValue as number, duration: config.duration });
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
    return seen;
  }
  const bottomEdge = () => translationOf("composition-layout-circuit-cb-surface-layers-bottom");
  /** Translation du registre qui porte e9 (sa rangée). */
  const liftedKey = "native|rail:row:e9";

  /**
   * e9 sous le Circuit B replié (340–408, en-tête replié 40 : ligne 18 + noms 22), saisie (428), arrêtée
   * sur B (374) jusqu'à son déploiement. Croissance prévue de B : cartes 80 + écart 9 − marge basse
   * réduite 6 − noms 22 = 61 ; e9 descend d'autant dans la mise en page.
   */
  async function hoverUntilExpanded() {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    await collapse("cb");
    layout("composition-layout-circuit-cb", 340, 68);
    layout("composition-layout-circuit-cb-header-frame", 14, 40);
    layout("composition-layout-exercise-e9", 428, 80);
    await settle();
    const card = liftCard("e9", 468);
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 374 } });
    await settle();
    // Pendant l'arrêt (inchangé, contre-recette n° 4) : aucune place ouverte.
    expect(bottomEdge()).toBe(0);
    await elapseHoverDelay();
    expect(expanded("cb")).toBe(true);
    return card;
  }
  /** Départ du déploiement : première mesure du contenu de B (ses cartes, 80). */
  async function revealStarts() {
    await act(async () => {
      layout("composition-layout-circuit-cb-exercises-content", 0, 80);
    });
    await settle();
  }
  /** Mesures du déploiement (fil UI → rappels, en retard) : B grandit, e9 descend dans la mise en page. */
  async function grow(heights: readonly number[], check: () => void) {
    // La ligne des noms s'est refermée : en-tête de 18.
    layout("composition-layout-circuit-cb-header-frame", 14, 18);
    layout("composition-layout-circuit-cb-exercises", 41, 80);
    layout("composition-activity-b1", 0, 80);
    for (const height of heights) {
      layout("composition-layout-circuit-cb", 340, height);
      layout("composition-layout-exercise-e9", 340 + height + 20, 80);
      await settle();
      check();
    }
  }

  it("la place s'ouvre à la fin du Circuit pendant son déploiement, avec sa courbe et sa durée ; puis destination sous le doigt", async () => {
    const card = await hoverUntilExpanded();
    // Le déploiement attend la mesure de son contenu : rien n'est encore lancé.
    expect(bottomEdge()).toBe(0);
    const timings = recordTimings();
    await revealStarts();
    // Bord bas de B et compensation de e9 lancés ensemble, à la durée du déploiement (700 ms).
    expect(bottomEdge()).toBe(89);
    expect(timings).toEqual(
      expect.arrayContaining([
        { toValue: 89, duration: CIRCUIT_REVEAL_DURATION_MS },
        { toValue: -61, duration: CIRCUIT_REVEAL_DURATION_MS },
      ]),
    );
    await grow([80, 104, 129], () => {
      // Pendant le déploiement : la place reste ouverte (bord bas), les cartes de B apparaissent en place.
      expect(bottomEdge()).toBe(89);
      expect(rowShift("b1")).toBe(0);
    });
    await elapseReveal();
    // Déploiement terminé : destination sous le doigt (tête de B, avant b1), décalages animés une fois.
    expect(rowShift("b1")).toBe(89);
    expect(timings.filter((timing) => timing.toValue === 89 && timing.duration !== CIRCUIT_REVEAL_DURATION_MS)).toHaveLength(1);
    fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 374, touches: [] } });
    expect(shape(probe.draft)).toBe("e0 ca[a1,a2] cb[e9,b1]");
  });

  it("Circuit AU-DESSUS de la carte saisie : compensation lancée une fois avec le déploiement — aucune pose ni nouvel aperçu à chaque mesure", async () => {
    const card = await hoverUntilExpanded();
    const poses = jest.spyOn(AnimatedShiftRegistry.prototype, "pose");
    const applies = jest.spyOn(AnimatedShiftRegistry.prototype, "apply");
    await revealStarts();
    // Compensation de toute la croissance prévue (61), lancée par le registre au départ.
    expect(rowShift("e9")).toBe(-61);
    const appliesAtStart = applies.mock.calls.length;
    await grow([70, 85, 101, 117, 126, 129], () => {
      // Avant correction : la compensation suivait chaque mesure (−2, −17, −33…), posée après coup.
      expect(rowShift("e9")).toBe(-61);
    });
    expect(poses).not.toHaveBeenCalled();
    // Aucun aperçu nouveau pendant les mesures : chaque cible reçue est celle du départ.
    const later = applies.mock.calls.slice(appliesAtStart);
    expect(later.every(([targets]) => targets.get(liftedKey) === -61)).toBe(true);
    await elapseReveal();
    // Mesure réelle = prévision : rien à corriger à la fin.
    expect(poses).not.toHaveBeenCalled();
    expect(rowShift("e9")).toBe(-61);
    fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 374, touches: [] } });
    expect(shape(probe.draft)).toBe("e0 ca[a1,a2] cb[e9,b1]");
  });

  it("prévision inexacte : l'écart résiduel est posé une seule fois, à la fin du déploiement", async () => {
    await hoverUntilExpanded();
    const poses = jest.spyOn(AnimatedShiftRegistry.prototype, "pose");
    await revealStarts();
    // B grandit en réalité de 67 (et non 61).
    await grow([100, 135], () => undefined);
    expect(poses).not.toHaveBeenCalled();
    await elapseReveal();
    expect(poses.mock.calls.filter(([key]) => key === liftedKey)).toEqual([[liftedKey, -67]]);
    expect(rowShift("e9")).toBe(-67);
  });

  it("lâcher pendant le déploiement : dépose à la fin du Circuit, depuis la position affichée (compensation animée comprise)", async () => {
    const card = await hoverUntilExpanded();
    await revealStarts();
    await grow([100], () => undefined);
    const poses = jest.spyOn(AnimatedShiftRegistry.prototype, "pose");
    fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 374, touches: [] } });
    expect(shape(probe.draft)).toBe("e0 ca[a1,a2] cb[b1,e9]");
    // Translation du doigt (374 − 468 = −94) plus la compensation animée (−61).
    expect(poses.mock.calls.filter(([key]) => key === liftedKey)[0]).toEqual([liftedKey, -155]);
    expect(revealTimers.size).toBe(0);
  });
});
