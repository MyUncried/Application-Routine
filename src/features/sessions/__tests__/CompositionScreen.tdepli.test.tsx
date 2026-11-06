import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { Platform, View } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createEmptyDraft, createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { SessionStructure, StructureCircuit, StructureStopPointLocation } from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CIRCUIT_REVEAL_DURATION_MS, CIRCUIT_REVEAL_START_FALLBACK_MS, useCircuitCardsReveal } from "@/features/sessions/CircuitHeader";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { SessionDraftContext, type SessionDraftContextValue, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Recette du 06/11/2026 (t-depli, KO). Hermann, mot pour mot : « lorsqu'on clique sur Créer > Ajouter un cycle, la séance doit
 * avoir ses circuits replié » et « Le comportement n’a pas changé, le premier déploiement se fait en se repliant d'abord. »
 * Test de recette : « Séance avec deux circuits (Tabata, EMOM) regroupés dans un cycle, repliés : le premier déploiement de
 * chacun s’ouvre directement, sans se replier d’abord. »
 *
 * Le simulacre de Reanimated termine toute animation aussitôt ; ici, `withTiming` peut être retenu (`mockTiming.hold`) pour
 * observer l'ordre des départs : la ligne des noms se referme par `withTiming(0, 700 ms)` (`CollapsedNamesLine`), les cartes
 * s'ouvrent par `withTiming(1, 700 ms)`. Jest ne prouve pas le rendu sur iPhone.
 */

const mockTiming: { hold: boolean; calls: { toValue: unknown; duration: unknown }[] } = { hold: false, calls: [] };
jest.mock("react-native-reanimated", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const actual = require("react-native-reanimated/mock") as Record<string, unknown> & {
    withTiming: (toValue: unknown, config?: { duration?: number }, callback?: (finished?: boolean) => void) => unknown;
  };
  return {
    ...actual,
    withTiming: (toValue: unknown, config?: { duration?: number }, callback?: (finished?: boolean) => void) => {
      mockTiming.calls.push({ toValue, duration: config?.duration });
      // Animation en cours (fil UI) : ni fin, ni rappel.
      if (mockTiming.hold) return toValue;
      return actual.withTiming(toValue, config, callback);
    },
  };
});
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

function exercise(id: string, structuralPosition: SessionDraftExercise["structuralPosition"] = "BEFORE_TOUR"): SessionDraftExercise {
  return {
    ...createExerciseDraft(id, 0),
    name: `Exercice ${id}`,
    sourceMovementId: `movement-${id}`,
    structuralPosition,
    executionParameters: durationParameters(30, 1),
  };
}

const circuit = (id: string, exercises: readonly string[]): StructureCircuit<string> => ({ id, repeatCount: 2, nature: "TOURS", exercises });

/** Séance : Circuit « Tabata » (ta1, ta2), Circuit « EMOM » (em1), Exercice e9 — au niveau de la Séance. */
const twoCircuits: SessionStructure<string, StructureStopPointLocation> = {
  elements: [
    { kind: "CIRCUIT", circuit: circuit("tabata", ["ta1", "ta2"]) },
    { kind: "CIRCUIT", circuit: circuit("emom", ["em1"]) },
    { kind: "EXERCISE", exercise: "e9" },
  ],
  stopPoints: [],
};

const twoCircuitsDraft = (): SessionDraft =>
  withLocalMovements({
    name: "Séance",
    labelId: null,
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    exercises: ["ta1", "ta2", "em1", "e9"].map((id) => exercise(id)),
    structure: twoCircuits,
  });

const hidden = { includeHiddenElements: true } as const;
const header = (id: string) => `composition-layout-circuit-${id}-header`;
const wait = (ms: number) => act(async () => new Promise((resolve) => setTimeout(resolve, ms)));
/** Départs de la fermeture de la ligne des noms (`CollapsedNamesLine`, déploiement). */
const namesClosings = () => mockTiming.calls.filter((call) => call.toValue === 0 && call.duration === CIRCUIT_REVEAL_DURATION_MS).length;
/** Départs du déploiement des cartes (`useCircuitCardsReveal`). */
const cardsOpenings = () => mockTiming.calls.filter((call) => call.toValue === 1 && call.duration === CIRCUIT_REVEAL_DURATION_MS).length;

function enterCycleEnvelope() {
  fireEvent.press(screen.getByTestId("composition-add-activity-action"));
  fireEvent.press(screen.getByTestId("composition-add-activity-tree-cycle"));
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
  mockTiming.hold = false;
  mockTiming.calls = [];
});

describe("t-depli (b) — Créer > Ajouter un cycle : les Circuits de la Séance sont repliés", () => {
  it("disposition générale : à l'entrée du mode, chaque Circuit est replié (ligne des noms, cartes masquées) ; brouillon inchangé", async () => {
    await renderComposition(twoCircuitsDraft());
    expect(screen.getByTestId("composition-exercise-row-ta1", hidden)).toBeTruthy();
    expect(screen.queryByTestId(`${header("tabata")}-names`, hidden)).toBeNull();
    const before = probe.draft;

    enterCycleEnvelope();
    await act(async () => undefined);

    expect(screen.getByTestId("composition-envelope-bar")).toBeTruthy();
    for (const [id, names] of [
      ["tabata", "Exercice ta1 · Exercice ta2"],
      ["emom", "Exercice em1"],
    ] as const) {
      expect(screen.getByTestId(`${header(id)}-names`, hidden).props.children).toBe(names);
      expect(screen.getByTestId(`${header(id)}-collapse`, hidden).props.accessibilityState).toMatchObject({ expanded: false });
    }
    for (const id of ["ta1", "ta2", "em1"]) expect(screen.queryByTestId(`composition-exercise-row-${id}`, hidden)).toBeNull();
    // L'Exercice direct reste affiché ; les Circuits restent éligibles, en bloc.
    expect(screen.getByTestId("composition-exercise-row-e9", hidden)).toBeTruthy();
    expect(screen.getByTestId("composition-envelope-circuit-tabata-target")).toBeTruthy();
    expect(probe.draft).toBe(before);
  });

  it("Ajouter un circuit ne replie rien (seul le mode Cycle est concerné)", async () => {
    await renderComposition(
      withLocalMovements({
        ...twoCircuitsDraft(),
        structure: { elements: [{ kind: "CIRCUIT", circuit: circuit("tabata", ["ta1", "ta2"]) }, { kind: "EXERCISE", exercise: "e9" }, { kind: "EXERCISE", exercise: "em1" }], stopPoints: [] },
      }),
    );
    fireEvent.press(screen.getByTestId("composition-add-activity-action"));
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-circuit"));
    await act(async () => undefined);
    expect(screen.getByTestId("composition-envelope-bar")).toBeTruthy();
    expect(screen.queryByTestId(`${header("tabata")}-names`, hidden)).toBeNull();
    expect(screen.getByTestId("composition-exercise-row-ta1", hidden)).toBeTruthy();
  });

  it("Circuit unique de l'ancien modèle : replié à l'entrée du mode Cycle", async () => {
    await renderComposition({
      ...createEmptyDraft(),
      name: "Séance",
      exercises: [exercise("a"), exercise("b", "IN_TOUR"), exercise("c", "IN_TOUR")],
      tourRepeatCount: 2,
    });
    expect(screen.getByTestId("composition-exercise-row-b", hidden)).toBeTruthy();
    enterCycleEnvelope();
    await act(async () => undefined);
    expect(screen.getByTestId("composition-circuit-header-names", hidden).props.children).toBe("Exercice b · Exercice c");
    expect(screen.queryByTestId("composition-exercise-row-b", hidden)).toBeNull();
  });
});

describe("t-depli (a) — premier déploiement d'un Circuit monté replié : il s'ouvre directement", () => {
  it("parcours : Ajouter un cycle (Circuits repliés), Tabata dans le Cycle, Confirmer ; le premier déploiement attend la mesure des cartes, même tardive, avant de refermer la ligne des noms", async () => {
    await renderComposition(twoCircuitsDraft());
    enterCycleEnvelope();
    await act(async () => undefined);
    fireEvent.press(screen.getByTestId("composition-envelope-circuit-tabata-target"));
    fireEvent.press(screen.getByTestId("composition-envelope-bar-confirm"));
    await act(async () => undefined);

    // Tabata, dans le Cycle posé, est replié (monté replié : ses cartes n'ont jamais été mesurées).
    const cycle = probe.draft?.structure?.elements.find((element) => element.kind === "CYCLE");
    expect(cycle?.kind === "CYCLE" ? cycle.cycle.members.map((member) => member.kind) : null).toEqual(["CIRCUIT"]);
    expect(screen.getByTestId(`${header("tabata")}-names`, hidden)).toBeTruthy();
    expect(screen.queryByTestId("composition-exercise-row-ta1", hidden)).toBeNull();

    // Animations « en cours » (fil UI) : seul l'ordre des départs est observé.
    mockTiming.hold = true;
    mockTiming.calls = [];
    fireEvent.press(screen.getByTestId(`${header("tabata")}-collapse`));
    expect(screen.getByTestId("composition-exercise-row-ta1", hidden)).toBeTruthy();
    // iPhone, écran chargé : la mesure des cartes arrive APRÈS le délai de secours.
    await wait(CIRCUIT_REVEAL_START_FALLBACK_MS + 80);
    // Défaut d'origine : la ligne des noms se refermait ici, cartes encore fermées (hauteur inconnue) — « se replie d'abord ».
    expect(namesClosings()).toBe(0);

    // Mesure tardive : le déploiement repart avec elle, et la ligne des noms se referme à ce départ réel.
    const openingsBefore = cardsOpenings();
    await act(async () => {
      fireEvent(screen.getByTestId("composition-layout-circuit-tabata-exercises-content", hidden), "layout", {
        nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 180 } },
      });
    });
    expect(cardsOpenings()).toBe(openingsBefore + 1);
    expect(namesClosings()).toBe(1);
  });
});

describe("t-depli (a) — useCircuitCardsReveal, mesure après le délai de secours", () => {
  function Cards({ collapsed, onStart }: { collapsed: boolean; onStart: (height: number) => void }) {
    const reveal = useCircuitCardsReveal(collapsed, 9, 6, true, onStart);
    return (
      <>
        <View testID={reveal.waiting ? "names-wait" : "names-free"} />
        {reveal.mounted ? (
          <View style={reveal.style as never} testID="cards">
            <View onLayout={reveal.onContentLayout} testID="cards-content" />
          </View>
        ) : null}
      </>
    );
  }

  it("départ à l'aveugle : ligne des noms ouverte, écran non prévenu ; la mesure tardive relance le déploiement avec sa hauteur", async () => {
    mockTiming.hold = true;
    const onStart = jest.fn();
    const view = render(<Cards collapsed onStart={onStart} />);
    view.rerender(<Cards collapsed={false} onStart={onStart} />);
    expect(screen.getByTestId("names-wait")).toBeTruthy();
    await wait(CIRCUIT_REVEAL_START_FALLBACK_MS + 50);
    expect(screen.getByTestId("names-wait")).toBeTruthy();
    expect(onStart).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent(screen.getByTestId("cards-content"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 169 } } });
    });
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(169);
    expect(screen.getByTestId("names-free")).toBeTruthy();
    // Mesure suivante : aucun second départ.
    await act(async () => {
      fireEvent(screen.getByTestId("cards-content"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 170 } } });
    });
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("aucune mesure jusqu'à la fin de la progression (sans mise en page) : l'état déployé est posé, la ligne des noms se referme", async () => {
    const onStart = jest.fn();
    const view = render(<Cards collapsed onStart={onStart} />);
    view.rerender(<Cards collapsed={false} onStart={onStart} />);
    await wait(CIRCUIT_REVEAL_START_FALLBACK_MS + 50);
    expect(screen.getByTestId("names-free")).toBeTruthy();
    expect(screen.getByTestId("cards")).toBeTruthy();
  });
});

describe("t-depli — preuve iPhone du 06/11 au soir : contenu mesuré à 0 dans la liste fermée", () => {
  function Cards({ collapsed }: { collapsed: boolean }) {
    const reveal = useCircuitCardsReveal(collapsed, 9, 6, true);
    return reveal.mounted ? (
      <View style={reveal.style as never} testID="cards">
        <View style={reveal.contentStyle} onLayout={reveal.onContentLayout} testID="cards-content" />
      </View>
    ) : null;
  }

  it("en attente de sa première mesure, le contenu est hors du flux (position absolue) ; mesuré, il y revient", async () => {
    mockTiming.hold = true;
    const view = render(<Cards collapsed />);
    view.rerender(<Cards collapsed={false} />);
    expect(screen.getByTestId("cards-content").props.style).toMatchObject({ position: "absolute", left: 0, right: 0, top: 0 });
    await act(async () => {
      fireEvent(screen.getByTestId("cards-content"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 169 } } });
    });
    expect(screen.getByTestId("cards-content").props.style).toBeNull();
  });
});
