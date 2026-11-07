import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Profiler, useMemo, useState, type ReactNode } from "react";
import { Platform, type LayoutChangeEvent } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { SessionStructure, StructureStopPoint } from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { SessionDraftContext, type SessionDraftContextValue, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-9 — incident iPhone du 01/11/2026 (Hermann : « J'ai ouvert une séance, replié une carte et ai eu
 * cette erreur. » — « Maximum update depth exceeded », `LayoutCycleBlock`, `onLayout` du Cycle ; non
 * systématique ; geste confirmé : repli d'un Circuit par son chevron).
 *
 * Sous Fabric, un événement `layout` est distribué en priorité discrète (voie synchrone de React) ;
 * pendant le repli, l'animation des cartes (`useCircuitCardsReveal`, fil UI) avance entre deux
 * validations React, et chaque validation reprend la hauteur animée la plus récente : chaque rendu
 * provoqué par une mesure produit une NOUVELLE mesure, distribuée aussitôt. Quand un rendu du Cycle
 * dure plus d'une image, la chaîne ne s'arrête qu'à la fin de l'animation (900 ms) : au-delà de 50
 * mises à jour synchrones imbriquées, React lève l'erreur.
 *
 * Le harnais reproduit ce mécanisme : un `Profiler` (rappel appelé dans la phase de validation, comme
 * un événement synchrone) transmet à chaque validation une nouvelle mesure du Cycle et du Circuit
 * (hauteur qui décroît d'un point, comme une image de l'animation). Jest ne prouve ni le moteur Fabric
 * ni le rendu sur iPhone.
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

function DraftHost({ initial, children }: { initial: SessionDraft; children: ReactNode }) {
  const [draft, setDraft] = useState(initial);
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

/** Mesure transmise à chaque validation React (événement `layout` synchrone simulé). */
const fabric: { onCommit: (() => void) | null } = { onCommit: null };

function exercise(id: string): SessionDraftExercise {
  return { ...createExerciseDraft(id, 0), name: `Exercice ${id}`, structuralPosition: "BEFORE_TOUR", executionParameters: durationParameters(30, 1) };
}

/** e0, Cycle Y { Circuit C [c1, c2] }, e9. */
const circuitInCycle: SessionStructure<string, StructureStopPoint> = {
  elements: [
    { kind: "EXERCISE", exercise: "e0" },
    {
      kind: "CYCLE",
      cycle: {
        id: "cy",
        repeatCount: 2,
        members: [{ kind: "CIRCUIT", circuit: { id: "cc", repeatCount: 1, nature: "TOURS", exercises: ["c1", "c2"] } }],
      },
    },
    { kind: "EXERCISE", exercise: "e9" },
  ],
  stopPoints: [],
};

const hidden = { includeHiddenElements: true } as const;

function layoutEvent(y: number, height: number): LayoutChangeEvent {
  return { nativeEvent: { layout: { x: 0, y, width: 354, height } } } as LayoutChangeEvent;
}

async function renderComposition() {
  render(
    // Rappel appelé à chaque validation de l'arbre, dans sa phase de validation (comme `useLayoutEffect`).
    <Profiler id="composition" onRender={() => fabric.onCommit?.()}>
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider value={activityDefinitionService}>
          <ReferentialServiceContext.Provider value={referentialService}>
            <DraftHost
              initial={withLocalMovements({
                name: "Séance",
                labelId: null,
                initialCountdownSeconds: 10,
                finalPhaseSeconds: 5,
                exercises: ["e0", "c1", "c2", "e9"].map(exercise),
                structure: circuitInCycle,
              })}
            >
              <CompositionScreen />
            </DraftHost>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>
    </Profiler>,
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
  fabric.onCommit = null;
  mockExitGuard.mockReset();
  mockExitGuard.mockReturnValue({ isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() });
});

describe("Incident du 01/11/2026 — repli d'un Circuit dans un Cycle, « Maximum update depth exceeded »", () => {
  it("une mesure qui change à chaque validation (animation de repli en cours) ne boucle pas", async () => {
    await renderComposition();
    const cycleLayout = screen.getByTestId("composition-layout-cycle-cy", hidden).props.onLayout as (event: LayoutChangeEvent) => void;
    const circuitLayout = screen.getByTestId("composition-layout-circuit-cc", hidden).props.onLayout as (event: LayoutChangeEvent) => void;
    const e9Layout = screen.getByTestId("composition-layout-exercise-e9", hidden).props.onLayout as (event: LayoutChangeEvent) => void;
    act(() => {
      cycleLayout(layoutEvent(100, 330));
      circuitLayout(layoutEvent(41, 260));
      e9Layout(layoutEvent(450, 80));
    });
    // Repli du Circuit (chevron) : 120 images d'animation, une nouvelle mesure à chaque validation.
    let frame = 0;
    fabric.onCommit = () => {
      if (frame >= 120) return;
      frame += 1;
      cycleLayout(layoutEvent(100, 330 - frame));
      circuitLayout(layoutEvent(41, 260 - frame));
      e9Layout(layoutEvent(450 - frame, 80));
    };
    await act(async () => {
      fireEvent.press(screen.getByTestId("composition-layout-circuit-cc-header-collapse", hidden));
    });
    await act(async () => undefined);
    fabric.onCommit = null;
    expect(frame).toBeGreaterThan(50);
    expect(screen.getByTestId("composition-layout-circuit-cc-header-collapse", hidden).props.accessibilityState?.expanded).toBe(false);
  });

  it("une mesure qui oscille d'un sous-pixel (arrondi) ne provoque aucun nouveau rendu", async () => {
    await renderComposition();
    const cycleLayout = screen.getByTestId("composition-layout-cycle-cy", hidden).props.onLayout as (event: LayoutChangeEvent) => void;
    act(() => cycleLayout(layoutEvent(100, 330)));
    let commits = 0;
    fabric.onCommit = () => {
      if (commits >= 120) return;
      commits += 1;
      cycleLayout(layoutEvent(100 + 0.25 * (commits % 2),330 + 0.25 * (commits % 2)));
    };
    act(() => cycleLayout(layoutEvent(100.25, 330.25)));
    await act(async () => undefined);
    fabric.onCommit = null;
    // Aucune mesure retenue (écart < 0,5) : la chaîne s'arrête aussitôt (au plus la validation sans
    // changement qui suit la première mesure ignorée).
    expect(commits).toBeLessThanOrEqual(1);
  });
});
