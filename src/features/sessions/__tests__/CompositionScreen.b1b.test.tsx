import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { SessionStructure, StructureCircuit, StructureStopPointLocation } from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { formatSessionDurationEstimate } from "@/features/sessions/compositionPresentation";
import { SessionDraftContext, type SessionDraftContextValue, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-9 story B.1b (D-451, COMP §1, §2 et §4, ARB-12, ARB-13) — Composition d'une disposition
 * générale : Exercices directs, Circuits et Cycles rendus selon la structure ; comptes, nature et repli
 * par conteneur. Jest ne prouve pas le rendu sur iPhone.
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

/** [E0, Cycle × 2 [D1, Circuit A × 3 (A1, A2), Circuit B × 2 (B1)], E2] */
const richLayout: Layout = {
  elements: [
    { kind: "EXERCISE", exercise: "e0" },
    {
      kind: "CYCLE",
      cycle: {
        id: "cy",
        repeatCount: 2,
        members: [
          { kind: "EXERCISE", exercise: "d1" },
          { kind: "CIRCUIT", circuit: circuit("ca", ["a1", "a2"], 3) },
          { kind: "CIRCUIT", circuit: circuit("cb", ["b1"], 2) },
        ],
      },
    },
    { kind: "EXERCISE", exercise: "e2" },
  ],
  stopPoints: [],
};

function draftOf(structure: Layout, exercises: readonly SessionDraftExercise[]): SessionDraft {
  return withLocalMovements({
    name: "Séance",
    labelId: null,
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    exercises,
    structure,
  });
}

const richDraft = (overrides: Partial<Record<string, SessionDraftExercise>> = {}) =>
  draftOf(
    richLayout,
    ["e0", "d1", "a1", "a2", "b1", "e2"].map((id) => overrides[id] ?? exercise(id)),
  );

const hidden = { includeHiddenElements: true } as const;
const text = (testID: string) => screen.getByTestId(testID, hidden).props.children;
const estimate = (seconds: number) => formatSessionDurationEstimate({ kind: "exact", seconds });
const CA = "composition-layout-circuit-ca-header";
const CB = "composition-layout-circuit-cb-header";
const CY = "composition-layout-cycle-cy-header";

function layoutCircuits(draft: SessionDraft | null) {
  const cycle = draft?.structure?.elements.find((element) => element.kind === "CYCLE");
  if (cycle?.kind !== "CYCLE") throw new Error("Cycle absent");
  return cycle.cycle.members.flatMap((member) => (member.kind === "CIRCUIT" ? [member.circuit] : []));
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

describe("B.1b — rendu d'une disposition générale", () => {
  it("Exercices directs, Cycle, Circuits A et B, cartes dans l'ordre ; comptes et durées ; bornes hors des conteneurs", async () => {
    await renderComposition(richDraft());

    // Cycle unique : aucune lettre ; deux Circuits : A et B (ARB-13).
    expect(text(`${CY}-title`)).toBe("Cycle");
    expect(text(`${CA}-title`)).toBe("Circuit A");
    expect(text(`${CB}-title`)).toBe("Circuit B");
    // Comptes : « 2 répétitions » (sans adjectif), « 3 tours · groupées », « 2 tours · groupées ».
    expect(text(`${CY}-counter-value`)).toBe(2);
    expect(text(`${CY}-counter-unit`)).toBe("répétitions");
    expect(screen.queryByTestId(`${CY}-counter-adjective`, hidden)).toBeNull();
    expect(screen.queryByTestId(`${CY}-collapse`, hidden)).toBeNull();
    expect(text(`${CA}-counter-value`)).toBe(3);
    expect(text(`${CA}-counter-unit`)).toBe("tours");
    expect(text(`${CA}-counter-adjective`)).toBe("groupées");
    expect(text(`${CB}-counter-value`)).toBe(2);
    // Durées : Circuit A 2 × 30 s × 3 ; Circuit B 30 s × 2 ; Cycle (30 + 180 + 60) × 2 ; Séance + E0 + E2.
    expect(text(`${CA}-duration`)).toBe(estimate(180));
    expect(text(`${CB}-duration`)).toBe(estimate(60));
    expect(text(`${CY}-duration`)).toBe(estimate(540));
    expect(text("composition-session-duration")).toBe(estimate(600));

    // Cartes dans l'ordre de la structure, chacune dans son conteneur.
    const ids = screen.getAllByTestId(/^composition-exercise-row-/, hidden).map((node) => node.props.testID);
    expect(ids).toEqual(["e0", "d1", "a1", "a2", "b1", "e2"].map((id) => `composition-exercise-row-${id}`));
    const cycle = screen.getByTestId("composition-layout-cycle-cy", hidden);
    expect(within(cycle).getByTestId("composition-exercise-row-d1", hidden)).toBeTruthy();
    const circuitA = screen.getByTestId("composition-layout-circuit-ca", hidden);
    expect(within(circuitA).getByTestId("composition-exercise-row-a2", hidden)).toBeTruthy();
    expect(within(circuitA).queryByTestId("composition-exercise-row-b1", hidden)).toBeNull();
    expect(within(cycle).queryByTestId("composition-exercise-row-e0", hidden)).toBeNull();
    // Compte à rebours et Fin de séance présents ; aucune zone de l'ancien modèle.
    expect(screen.getByTestId("composition-boundary-countdown", hidden)).toBeTruthy();
    expect(screen.getByTestId("composition-boundary-final-phase", hidden)).toBeTruthy();
    expect(screen.queryByTestId("composition-tour-section", hidden)).toBeNull();
    expect(screen.queryByTestId("composition-circuit-header", hidden)).toBeNull();
  });

  it("toucher une carte ouvre l'éditeur de cet Exercice, comme dans l'ancien modèle", async () => {
    await renderComposition(richDraft());
    fireEvent.press(screen.getByTestId("composition-exercise-row-a2"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/exercise", params: { exerciseId: "a2" } });
  });

  // [B.1b : « ni glisser, ni balayage, ni actions accessibles » — remplacé pour le glisser et « Monter »
  // / « Descendre » par B.4 (31/10/2026) ; pour le balayage et « Dupliquer » / « Supprimer » par B.5
  // (31/10/2026, `CompositionScreen.b5.test.tsx`) ; placement (B.6) toujours indisponible.]
  it("gestes non disponibles (B.6) : placement et Volumes indisponibles ; actions accessibles des cartes (B.4, B.5)", async () => {
    await renderComposition(richDraft());
    const card = screen.getByTestId("composition-exercise-row-a1");
    expect(card.props.accessibilityActions.map((action: { name: string }) => action.name)).toEqual(["moveUp", "moveDown", "duplicate", "delete"]);
    // Sans mesure de la carte, l'appui long ne la soulève pas (géométrie incomplète).
    fireEvent(card, "longPress");
    expect(screen.queryByTestId("composition-activity-actions-a1", hidden)).toBeNull();
    expect(screen.getByTestId("composition-body").props.scrollEnabled).toBe(true);
    expect(screen.getByTestId("composition-add-stop-action").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("composition-volumes-action").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("stepper du Circuit A : seul ce Circuit change (structure du brouillon) ; Circuit B et Cycle inchangés", async () => {
    await renderComposition(richDraft());
    fireEvent.press(screen.getByTestId(`${CA}-counter`));
    const plus = screen.getByTestId(`${CA}-counter-stepper-increment`);
    fireEvent(plus, "pressIn");
    fireEvent(plus, "pressOut");

    const [a, b] = layoutCircuits(probe.draft);
    expect(a).toMatchObject({ id: "ca", repeatCount: 4 });
    expect(b).toMatchObject({ id: "cb", repeatCount: 2 });
    expect(text(`${CA}-counter-value`)).toBe(4);
    expect(text(`${CB}-counter-value`)).toBe(2);
    // Un seul contrôle ouvert : ouvrir le stepper du Cycle referme celui du Circuit A.
    fireEvent.press(screen.getByTestId(`${CY}-counter`));
    expect(screen.queryByTestId(`${CA}-counter-stepper-increment`)).toBeNull();
    expect(screen.getByTestId(`${CY}-counter-stepper-increment`)).toBeTruthy();
  });

  it("stepper du Cycle : borné 1..99", async () => {
    await renderComposition(richDraft());
    fireEvent.press(screen.getByTestId(`${CY}-counter`));
    const plus = screen.getByTestId(`${CY}-counter-stepper-increment`);
    fireEvent(plus, "pressIn");
    fireEvent(plus, "pressOut");
    expect(text(`${CY}-counter-value`)).toBe(3);
    // VoiceOver : décrément borné à 1.
    for (let i = 0; i < 4; i += 1) {
      fireEvent(screen.getByTestId(`${CY}-counter`), "accessibilityAction", { nativeEvent: { actionName: "decrement" } });
    }
    expect(text(`${CY}-counter-value`)).toBe(1);
    expect(text(`${CY}-counter-unit`)).toBe("répétition");
    expect(screen.getByTestId(`${CY}-counter-stepper-decrement`).props.accessibilityState).toMatchObject({ disabled: true });
    // VoiceOver : incrément borné à 99.
    for (let i = 0; i < 120; i += 1) {
      fireEvent(screen.getByTestId(`${CY}-counter`), "accessibilityAction", { nativeEvent: { actionName: "increment" } });
    }
    expect(text(`${CY}-counter-value`)).toBe(99);
    const cycle = probe.draft?.structure?.elements.find((element) => element.kind === "CYCLE");
    expect(cycle?.kind === "CYCLE" ? cycle.cycle.repeatCount : null).toBe(99);
    expect(screen.getByTestId(`${CY}-counter`).props.accessibilityValue).toMatchObject({ min: 1, max: 99, now: 99, text: "99 répétitions" });
  });

  it("nature avec perte : confirmation ; Annuler ne change rien ; Confirmer adapte le seul Circuit concerné", async () => {
    // A1 a 5 séries, au-delà de N = 3 : passer le Circuit A en alternées tronquerait.
    await renderComposition(richDraft({ a1: exercise("a1", 5), b1: exercise("b1", 5) }));
    const before = probe.draft;
    act(() => {
      fireEvent(screen.getByTestId(`${CA}-counter-nature-SERIES`, hidden), "buttonPress");
    });
    expect(screen.getByTestId("circuit-nature-confirm-card")).toBeTruthy();
    expect(probe.draft).toBe(before);

    fireEvent.press(screen.getByText("Annuler"));
    expect(screen.queryByTestId("circuit-nature-confirm-card")).toBeNull();
    expect(probe.draft).toBe(before);
    expect(text(`${CA}-counter-adjective`)).toBe("groupées");

    act(() => {
      fireEvent(screen.getByTestId(`${CA}-counter-nature-SERIES`, hidden), "buttonPress");
    });
    fireEvent.press(screen.getByText("Confirmer"));
    const [a, b] = layoutCircuits(probe.draft);
    expect(a).toMatchObject({ nature: "SERIES", repeatCount: 3 });
    expect(b).toMatchObject({ nature: "TOURS" });
    const seriesOf = (id: string) => {
      const series = probe.draft!.exercises.find((item) => item.id === id)!.executionParameters.series;
      return series.kind === "UNIFORM" ? series.count : series.rows.length;
    };
    expect(seriesOf("a1")).toBe(3);
    expect(seriesOf("b1")).toBe(5);
    expect(text(`${CA}-counter-adjective`)).toBe("alternées");
    expect(text(`${CA}-counter-unit`)).toBe("tours");
  });

  it("repli du Circuit B : ligne des noms, cartes masquées ; Circuit A et brouillon inchangés ; dépli", async () => {
    await renderComposition(richDraft());
    const before = probe.draft;
    fireEvent.press(screen.getByTestId(`${CB}-collapse`));
    // Recette du 29/10 (obs-3 b) : les cartes sont retirées à la fin du repli animé (rappel en microtâche).
    await act(async () => {});

    expect(text(`${CB}-names`)).toBe("Exercice b1");
    expect(screen.queryByTestId("composition-exercise-row-b1", hidden)).toBeNull();
    expect(screen.getByTestId("composition-exercise-row-a1", hidden)).toBeTruthy();
    expect(screen.queryByTestId(`${CA}-names`, hidden)).toBeNull();
    expect(screen.getByTestId(`${CB}-collapse`).props.accessibilityState).toMatchObject({ expanded: false });
    expect(probe.draft).toBe(before);

    fireEvent.press(screen.getByTestId(`${CB}-collapse`));
    expect(screen.getByTestId("composition-exercise-row-b1", hidden)).toBeTruthy();
    expect(screen.queryByTestId(`${CB}-names`, hidden)).toBeNull();
  });

  it("un seul Circuit et un seul Cycle : aucune lettre", async () => {
    await renderComposition(
      draftOf(
        {
          elements: [
            {
              kind: "CYCLE",
              cycle: { id: "cy", repeatCount: 1, members: [{ kind: "CIRCUIT", circuit: circuit("ca", ["a1"], 2) }] },
            },
            { kind: "EXERCISE", exercise: "e2" },
          ],
          stopPoints: [],
        },
        [exercise("a1"), exercise("e2")],
      ),
    );
    expect(text(`${CY}-title`)).toBe("Cycle");
    expect(text(`${CY}-counter-unit`)).toBe("répétition");
    expect(text(`${CA}-title`)).toBe("Circuit");
  });

  it("deux Cycles : Cycle A et Cycle B ; Circuits lettrés à l'échelle de la Séance", async () => {
    await renderComposition(
      draftOf(
        {
          elements: [
            { kind: "CYCLE", cycle: { id: "c1", repeatCount: 1, members: [{ kind: "CIRCUIT", circuit: circuit("k1", ["a1"], 1) }] } },
            { kind: "CIRCUIT", circuit: circuit("k2", ["b1"], 1) },
            { kind: "CYCLE", cycle: { id: "c2", repeatCount: 1, members: [{ kind: "CIRCUIT", circuit: circuit("k3", ["e2"], 1) }] } },
          ],
          stopPoints: [],
        },
        [exercise("a1"), exercise("b1"), exercise("e2")],
      ),
    );
    expect(text("composition-layout-cycle-c1-header-title")).toBe("Cycle A");
    expect(text("composition-layout-cycle-c2-header-title")).toBe("Cycle B");
    expect(text("composition-layout-circuit-k1-header-title")).toBe("Circuit A");
    expect(text("composition-layout-circuit-k2-header-title")).toBe("Circuit B");
    expect(text("composition-layout-circuit-k3-header-title")).toBe("Circuit C");
  });

  it("disposition de l'ancien modèle (Circuit unique) : rendu historique inchangé", async () => {
    const legacy = draftOf(
      { elements: [{ kind: "EXERCISE", exercise: "e0" }, { kind: "CIRCUIT", circuit: circuit("only", ["a1"], 2) }], stopPoints: [] },
      [exercise("e0"), { ...exercise("a1"), structuralPosition: "IN_TOUR" }],
    );
    await renderComposition({ ...legacy, tourRepeatCount: 2 });
    expect(screen.getByTestId("composition-tour-section", hidden)).toBeTruthy();
    expect(text("composition-circuit-header-title")).toBe("Circuit");
    expect(screen.queryByTestId(/^composition-layout-/, hidden)).toBeNull();
    // Gestes historiques présents.
    expect(screen.getByTestId("composition-exercise-row-a1").props.accessibilityActions.length).toBeGreaterThan(0);
  });
});
