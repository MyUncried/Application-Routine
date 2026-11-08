import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import { seriesRowsOf } from "@/domain/activities/ExecutionParameters";
import { durationParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createExerciseDraft, toStructuredSessionInput, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import {
  structureCircuits,
  structureExercises,
  type SessionStructure,
  type StructureCircuit,
  type StructureStopPointLocation,
} from "@/domain/sessions/structure";
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
 * PRE-9 story B.3 (COMP §2 et §3, ch10 l.1026-1182, ARB-10, D-07, D-09) — dans une Séance à plusieurs
 * Circuits, chaque Circuit a sa nature et son N : stepper et conversions par Circuit, confirmation si
 * perte, réserve de brouillon jusqu'à l'enregistrement ; cibles à 0 et volume total nul. Harnais repris
 * de B.1b. Jest ne prouve pas le rendu sur iPhone.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-id") }));
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

/** Exercice de 30 s exactes (une série, sans pause ni récupération). */
function exercise(id: string, seriesCount = 1): SessionDraftExercise {
  return {
    ...createExerciseDraft(id, 0),
    name: `Exercice ${id}`,
    structuralPosition: "BEFORE_TOUR",
    executionParameters: durationParameters(30, seriesCount),
  };
}

type Layout = SessionStructure<string, StructureStopPointLocation>;

const circuit = (id: string, exercises: readonly string[], repeatCount: number, nature: "TOURS" | "SERIES" = "TOURS"): StructureCircuit<string> => ({
  id,
  repeatCount,
  nature,
  exercises,
});

/**
 * Séance à deux Circuits de natures différentes : E0, Circuit A alterné × 3 [A1 (variables 10 · 20 · 30 s),
 * A2], Cycle × 2 [Circuit B groupé × 2 [B1], D1].
 */
const twoNaturesLayout: Layout = {
  elements: [
    { kind: "EXERCISE", exercise: "e0" },
    { kind: "CIRCUIT", circuit: circuit("ca", ["a1", "a2"], 3, "SERIES") },
    {
      kind: "CYCLE",
      cycle: { id: "cy", repeatCount: 2, members: [{ kind: "CIRCUIT", circuit: circuit("cb", ["b1"], 2) }, { kind: "EXERCISE", exercise: "d1" }] },
    },
  ],
  stopPoints: [],
};

function draftOf(exercises: readonly SessionDraftExercise[]): SessionDraft {
  return withLocalMovements({ name: "Séance", labelId: null, initialCountdownSeconds: 10, finalPhaseSeconds: 5, exercises, structure: twoNaturesLayout });
}

const variableA1: SessionDraftExercise = {
  ...exercise("a1"),
  executionParameters: variableParameters({ rows: [[10, 0], [20, 0], [30, 0]] }),
};
const twoNatures = (overrides: Partial<Record<string, SessionDraftExercise>> = {}) =>
  draftOf([exercise("e0"), variableA1, exercise("a2", 3), exercise("b1"), exercise("d1")].map((item) => overrides[item.id] ?? item));

const hidden = { includeHiddenElements: true } as const;
const text = (testID: string) => screen.getByTestId(testID, hidden).props.children;
const CA = "composition-layout-circuit-ca-header";
const CB = "composition-layout-circuit-cb-header";
const circuitsOf = (draft: SessionDraft | null) => structureCircuits(draft!.structure!);
const targetsOf = (id: string) =>
  seriesRowsOf(probe.draft!.exercises.find((item) => item.id === id)!.executionParameters).map((row) =>
    row.target.kind === "NUMBER" ? row.target.value : row.target.kind,
  );

function stepCircuit(header: string, direction: "increment" | "decrement") {
  const button = screen.getByTestId(`${header}-counter-stepper-${direction}`);
  fireEvent(button, "pressIn");
  fireEvent(button, "pressOut");
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

describe("B.3 — séries groupées / alternées par Circuit (COMP §2, ch10 l.1026-1182)", () => {
  it("deux Circuits de natures différentes dans une Séance : chacun son N et son adjectif", async () => {
    await renderComposition(twoNatures());
    expect(text(`${CA}-counter-value`)).toBe(3);
    expect(text(`${CA}-counter-adjective`)).toBe("alternées");
    expect(text(`${CB}-counter-value`)).toBe(2);
    expect(text(`${CB}-counter-adjective`)).toBe("groupées");
  });

  it("N du Circuit alterné A diminué : ses Exercices suivent, ligne retirée en réserve jusqu'à l'enregistrement ; réaugmenté : restaurée ; Circuit B intact", async () => {
    await renderComposition(twoNatures());
    fireEvent.press(screen.getByTestId(`${CA}-counter`));
    stepCircuit(CA, "decrement");
    expect(text(`${CA}-counter-value`)).toBe(2);
    expect(targetsOf("a1")).toEqual([10, 20]);
    expect(targetsOf("a2")).toEqual([30, 30]);
    expect(Object.keys(probe.draft!.circuitSeriesReserve ?? {})).toEqual(["a1"]);
    expect(circuitsOf(probe.draft)[1]).toMatchObject({ id: "cb", repeatCount: 2, nature: "TOURS" });
    expect(targetsOf("b1")).toEqual([30]);
    // L'enregistrement ne conserve que les lignes actives : la réserve ne fait pas partie de l'entrée.
    const input = toStructuredSessionInput(probe.draft!, () => "new-container");
    expect(input.ok).toBe(true);
    if (input.ok) {
      const a1 = structureExercises(input.value.structure).find((item) => item.id === "a1")!;
      expect(seriesRowsOf(a1.executionParameters)).toHaveLength(2);
    }

    stepCircuit(CA, "increment");
    expect(targetsOf("a1")).toEqual([10, 20, 30]);
    expect(probe.draft!.circuitSeriesReserve).toBeUndefined();
  });

  it("conversion du Circuit B sans perte : aucune confirmation, B1 porté à N ; le Circuit A n'est pas touché", async () => {
    await renderComposition(twoNatures());
    const a1Before = probe.draft!.exercises.find((item) => item.id === "a1");
    act(() => {
      fireEvent(screen.getByTestId(`${CB}-counter-nature-SERIES`, hidden), "buttonPress");
    });
    expect(screen.queryByTestId("circuit-nature-confirm-card")).toBeNull();
    expect(circuitsOf(probe.draft)[1]).toMatchObject({ id: "cb", nature: "SERIES", repeatCount: 2 });
    expect(targetsOf("b1")).toEqual([30, 30]);
    expect(probe.draft!.exercises.find((item) => item.id === "a1")).toBe(a1Before);
    expect(text(`${CB}-counter-adjective`)).toBe("alternées");
  });

  it("conversion du Circuit B avec perte : confirmation ; Annuler restitue tout ; Confirmer tronque B1 seul", async () => {
    await renderComposition(twoNatures({ b1: exercise("b1", 5) }));
    const before = probe.draft;
    act(() => {
      fireEvent(screen.getByTestId(`${CB}-counter-nature-SERIES`, hidden), "buttonPress");
    });
    expect(screen.getByTestId("circuit-nature-confirm-card")).toBeTruthy();
    fireEvent.press(screen.getByText("Annuler"));
    expect(probe.draft).toBe(before);
    expect(text(`${CB}-counter-adjective`)).toBe("groupées");

    act(() => {
      fireEvent(screen.getByTestId(`${CB}-counter-nature-SERIES`, hidden), "buttonPress");
    });
    fireEvent.press(screen.getByText("Confirmer"));
    expect(targetsOf("b1")).toEqual([30, 30]);
    expect(targetsOf("a1")).toEqual([10, 20, 30]);
    expect(circuitsOf(probe.draft).map((item) => item.nature)).toEqual(["SERIES", "SERIES"]);
  });

  it("alternées → groupées : sans confirmation, séries conservées", async () => {
    await renderComposition(twoNatures());
    act(() => {
      fireEvent(screen.getByTestId(`${CA}-counter-nature-TOURS`, hidden), "buttonPress");
    });
    expect(screen.queryByTestId("circuit-nature-confirm-card")).toBeNull();
    expect(circuitsOf(probe.draft)[0]).toMatchObject({ id: "ca", nature: "TOURS", repeatCount: 3 });
    expect(targetsOf("a1")).toEqual([10, 20, 30]);
  });
});

describe("B.3 — cibles à 0 (COMP §3, ARB-10)", () => {
  it("une série à 0 : carte lisible, Continuer disponible ; toutes à 0 : « Paramètres à compléter. », Continuer indisponible", async () => {
    const withZero: SessionDraftExercise = { ...exercise("d1"), executionParameters: variableParameters({ rows: [[30, 0], [0, 0]] }) };
    await renderComposition(twoNatures({ d1: withZero }));
    const card = screen.getByTestId("composition-exercise-row-d1", hidden);
    expect(within(card).queryByText(strings.executionParameters.card.incomplete, hidden)).toBeNull();
    expect(screen.getByTestId("composition-save-action").props.accessibilityState).not.toMatchObject({ disabled: true });
    screen.unmount();

    const allZero: SessionDraftExercise = { ...exercise("d1"), executionParameters: variableParameters({ rows: [[0, 0], [0, 0]] }) };
    await renderComposition(twoNatures({ d1: allZero }));
    const zeroCard = screen.getByTestId("composition-exercise-row-d1", hidden);
    expect(within(zeroCard).getByText(strings.executionParameters.card.incomplete, hidden)).toBeTruthy();
    expect(screen.getByTestId("composition-save-action").props.accessibilityState).toMatchObject({ disabled: true });
  });
});
