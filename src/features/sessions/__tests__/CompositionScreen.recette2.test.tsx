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
import { SessionDraftContext, type SessionDraftContextValue, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-9 — recette iPhone n° 2 du 31/10/2026 (b4-entrer, b4-sortir, b4-cycle-entier, b6-glisser,
 * b6-recup). Hermann : « Je ne veux pas d'encadré bleu et de trait d'insertion, mais le comportement
 * tel qu'il a été défini initialement, et qui fonctionne avec un seul circuit : déplacement des bords
 * des circuits / cycle et déplacement des cartes pour faire la place à la carte déplacée. » ;
 * « le cercle plein du rail se retrouve sur un rail parallèle au rail ».
 *
 * Disposition générale : pendant le glisser, cartes, Points d'arrêt et bords des conteneurs reçoivent
 * leurs translations (registre partagé, valeurs natives) ; aucun cadre ni trait d'insertion. Sous Jest,
 * le pilote natif ne remonte pas les valeurs : les animations sont simulées (cible posée au départ) et
 * les translations sont lues sur les valeurs animées des vues. Jest ne prouve pas le rendu sur iPhone.
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

/** e0, Circuit A [a1, a2], Circuit B [b1], e9 (mesures de `CompositionScreen.b4.test.tsx`). */
const twoCircuits: Layout = {
  elements: [
    { kind: "EXERCISE", exercise: "e0" },
    { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 1, nature: "TOURS", exercises: ["a1", "a2"] } },
    { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1"] } },
    { kind: "EXERCISE", exercise: "e9" },
  ],
  stopPoints: [],
};

const hidden = { includeHiddenElements: true } as const;

function layout(testID: string, y: number, height: number) {
  fireEvent(screen.getByTestId(testID, hidden), "layout", { nativeEvent: { layout: { x: 0, y, width: 354, height } } });
}

/** e0 0–80 ; Circuit A 100–320 (cartes a1 141–221, a2 230–310) ; Circuit B 340–470 (b1 381–461) ; e9 490–570. */
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

/** Laisse démarrer (microtâche) et aboutir les animations simulées. */
async function settle() {
  await act(async () => undefined);
  await act(async () => undefined);
}

/**
 * Translation verticale d'une vue : somme des `translateY` de son composant animé, valeurs animées
 * lues à leur valeur courante (`__getValue`).
 */
function translationOf(testID: string): number {
  const transformOf = (instance: ReactTestInstance) =>
    (StyleSheet.flatten(instance.props.style) as { transform?: Record<string, unknown>[] } | undefined)?.transform;
  // Le plus haut des nœuds de ce `testID` qui porte une transformation (composant animé : valeurs animées).
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

function shape(draft: SessionDraft | null): string {
  return (draft?.structure?.elements ?? [])
    .map((element: StructureElement<string>) =>
      element.kind === "EXERCISE"
        ? element.exercise
        : element.kind === "CIRCUIT"
          ? `${element.circuit.id}[${element.circuit.exercises.join(",")}]`
          : `${element.cycle.id}{${element.cycle.members.map((member) => (member.kind === "EXERCISE" ? member.exercise : member.circuit.id)).join(",")}}`,
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

describe("Recette iPhone n° 2 — glisser d'une disposition générale : les éléments font la place (pas d'éclairage)", () => {
  it("b4-entrer : carte amenée dans un Circuit — les cartes suivantes descendent, le Circuit s'agrandit, le Circuit suivant descend ; ni cadre ni trait", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    const before = probe.draft;
    const card = liftCard("e9", 530);
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 225.5 } });
    await settle();
    // Aucun éclairage (B.4 remplacé) : ni cadre de conteneur, ni trait d'insertion.
    expect(screen.queryByTestId("composition-layout-drop-line", hidden)).toBeNull();
    expect(screen.queryByTestId("composition-layout-circuit-ca-drop-target", hidden)).toBeNull();
    // a1 reste ; a2 descend de la carte plus l'écart du Circuit (80 + 9).
    expect(rowShift("a1")).toBe(0);
    expect(rowShift("a2")).toBe(89);
    // Bords du Circuit A : haut immobile (en-tête), bas abaissé — le fond s'étire (trois couches).
    expect(translationOf("composition-layout-circuit-ca-header-frame")).toBe(0);
    expect(translationOf("composition-layout-circuit-ca-surface-layers-top")).toBe(0);
    expect(translationOf("composition-layout-circuit-ca-surface-layers-bottom")).toBe(89);
    // Circuit B : descend en bloc (en-tête, fond, carte).
    expect(translationOf("composition-layout-circuit-cb-header-frame")).toBe(89);
    expect(translationOf("composition-layout-circuit-cb-surface-layers-bottom")).toBe(89);
    expect(rowShift("b1")).toBe(89);
    // e0, au-dessus : immobile ; rien n'est écrit avant le relâchement.
    expect(rowShift("e0")).toBe(0);
    expect(probe.draft).toBe(before);

    fireEvent(card, "touchEnd", { nativeEvent: { pageX: 200, pageY: 225.5, touches: [] } });
    expect(shape(probe.draft)).toBe("e0 ca[a1,e9,a2] cb[b1]");
    await settle();
    // Nouvelle disposition : translations nulles, carte déposée à sa place.
    expect(rowShift("a2")).toBe(0);
    expect(rowShift("e9")).toBe(0);
  });

  it("b4-sortir : dernière carte d'un Circuit amenée au niveau Séance — le Circuit se rétracte, ce qui suit remonte", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    const card = liftCard("b1", 421);
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 578 } });
    await settle();
    expect(translationOf("composition-layout-circuit-cb-header-frame")).toBe(0);
    expect(translationOf("composition-layout-circuit-cb-surface-layers-bottom")).toBe(-89);
    expect(rowShift("e9")).toBe(-89);
    expect(translationOf("composition-layout-circuit-ca-surface-layers-bottom")).toBe(0);
  });

  it("refus ou geste interrompu : tout revient à sa place, rien n'est écrit", async () => {
    await renderComposition(draftOf(twoCircuits, ["e0", "a1", "a2", "b1", "e9"]));
    measureTwoCircuits();
    const before = probe.draft;
    const card = liftCard("e9", 530);
    fireEvent(card, "responderMove", { nativeEvent: { pageX: 200, pageY: 225.5 } });
    await settle();
    expect(rowShift("a2")).toBe(89);
    fireEvent(card, "responderTerminate", {});
    await settle();
    expect(rowShift("a2")).toBe(0);
    expect(rowShift("e9")).toBe(0);
    expect(translationOf("composition-layout-circuit-cb-header-frame")).toBe(0);
    expect(probe.draft).toBe(before);
  });

  it("b4-cycle-entier : Cycle saisi par son titre — les éléments font la place, le Cycle se dépose ; aucun trait", async () => {
    const withCycle: Layout = {
      elements: [
        { kind: "EXERCISE", exercise: "e0" },
        { kind: "CYCLE", cycle: { id: "cy", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: "a1" }] } },
        { kind: "EXERCISE", exercise: "e9" },
      ],
      stopPoints: [],
    };
    await renderComposition(draftOf(withCycle, ["e0", "a1", "e9"]));
    layout("composition-layout-exercise-e0", 0, 80);
    layout("composition-layout-cycle-cy", 88, 140);
    layout("composition-layout-cycle-cy-header-track", 14, 18);
    layout("composition-layout-exercise-a1", 41, 80);
    layout("composition-layout-exercise-e9", 236, 80);
    const block = screen.getByTestId("composition-layout-cycle-cy", hidden);
    fireEvent(block, "touchStart", { nativeEvent: { pageX: 100, pageY: 111 } });
    fireEvent(screen.getByTestId("composition-layout-cycle-cy-header-grab"), "longPress");
    // Avant e0 (emplacement à −8) : e0 descend de la hauteur du Cycle plus l'écart (140 + 8).
    fireEvent(block, "responderMove", { nativeEvent: { pageX: 100, pageY: -8 } });
    await settle();
    expect(rowShift("e0")).toBe(148);
    // e9 : place refermée puis rouverte au-dessus, net 0 ; le contenu du Cycle suit le doigt, sans translation propre.
    expect(rowShift("e9")).toBe(0);
    expect(rowShift("a1")).toBe(0);
    expect(translationOf("composition-layout-cycle-cy")).toBe(-119);
    expect(screen.queryByTestId("composition-layout-drop-line", hidden)).toBeNull();
    fireEvent(block, "touchEnd", { nativeEvent: { pageX: 100, pageY: -8, touches: [] } });
    expect(shape(probe.draft)).toBe("cy{a1} e0 e9");
    await settle();
    expect(rowShift("e0")).toBe(0);
    expect(translationOf("composition-layout-cycle-cy")).toBe(0);
  });

  it("b6-glisser : Point d'arrêt du niveau Séance — rangée sur l'axe du rail des cartes, point de raccord qui suit la puce, voisins qui font la place", async () => {
    const withPoint: Layout = {
      elements: [
        { kind: "EXERCISE", exercise: "e0" },
        { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 1, nature: "TOURS", exercises: ["a1", "a2"] } },
        { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1"] } },
        { kind: "EXERCISE", exercise: "e9" },
      ],
      stopPoints: [{ id: "p", circuitId: null, position: 1 }],
    };
    await renderComposition(draftOf(withPoint, ["e0", "a1", "a2", "b1", "e9"]));
    // Débord des cartes (recette n° 2 : un seul rail) : la rangée du Point, hors Circuit, s'aligne sur les cartes.
    expect(StyleSheet.flatten(screen.getByTestId("composition-layout-stop-point-p", hidden).props.style)).toMatchObject({ marginHorizontal: -8 });
    // Mesures : e0 0–80, Point 88–110, Circuit A 118–338 (a1 159–239, a2 248–328), Circuit B 346–476 (b1 387–467), e9 484–564.
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
    const row = screen.getByTestId("composition-stop-point-row-p", hidden);
    fireEvent(row, "touchStart", { nativeEvent: { pageX: 200, pageY: 99 } });
    fireEvent(screen.getByTestId("composition-stop-point-p-chip"), "longPress");
    // Entre a1 et a2 (243,5) : déplacement de 144,5.
    fireEvent(row, "responderMove", { nativeEvent: { pageX: 200, pageY: 243.5 } });
    await settle();
    // Le point de raccord suit la puce, sur l'axe du rail (centre du média des cartes).
    expect(translationOf("composition-rail-dot-stop-p-lifted")).toBe(144.5);
    expect(translationOf("composition-stop-point-p")).toBe(144.5);
    // La place du Point se referme (22 + 8), celle visée s'ouvre dans le Circuit A (22 + 9).
    expect(translationOf("composition-layout-circuit-ca-header-frame")).toBe(-30);
    expect(rowShift("a1")).toBe(-30);
    expect(rowShift("a2")).toBe(1);
    expect(translationOf("composition-layout-circuit-ca-surface-layers-bottom")).toBe(1);
    expect(screen.queryByTestId("composition-layout-drop-line", hidden)).toBeNull();
    fireEvent(row, "touchEnd", { nativeEvent: { pageX: 200, pageY: 243.5, touches: [] } });
    expect(probe.draft?.structure?.stopPoints).toEqual([expect.objectContaining({ id: "p", circuitId: "ca", position: 1 })]);
  });
});
