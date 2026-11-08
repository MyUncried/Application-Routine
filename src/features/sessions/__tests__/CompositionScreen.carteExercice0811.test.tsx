import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { Platform, StyleSheet } from "react-native";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
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
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Demande de Hermann du 08/11/2026 : toutes les cartes d'exercice de la Composition passent par le composant
 * « DSF / Cards / Exercice — Composition » (\`OccurrenceCard\`, Figma \`11810:2159\`, D-511 à D-513) — variante selon
 * l'appartenance effective à un Circuit (un Exercice directement dans un Cycle est « Hors circuit »), actualisée par
 * un déplacement ; buy-in / buy-out avec récupération ; prescription à incrément ; mode placement (Points d'arrêt
 * seuls, bandeau « Confirmer N points d'arrêt ajoutés »). Harnais de B.6. Jest ne prouve pas le rendu sur iPhone.
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
const hidden = { includeHiddenElements: true } as const;

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

async function settle() {
  await act(async () => undefined);
  await act(async () => undefined);
  await act(async () => undefined);
}

function exercise(id: string, overrides: Partial<SessionDraftExercise> = {}): SessionDraftExercise {
  return {
    ...createExerciseDraft(id, 0),
    name: `Exercice ${id}`,
    structuralPosition: "BEFORE_TOUR",
    executionParameters: durationParameters(30),
    ...overrides,
  };
}

type Layout = SessionStructure<string, StructureStopPointLocation>;

/** e0, Circuit A [a1, a2], Cycle [y0, Circuit B [b1]], e9. */
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
          { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1"] } },
        ],
      },
    },
    { kind: "EXERCISE", exercise: "e9" },
  ],
  stopPoints: [],
};

const sampleDraft = (structure: Layout = layout, exercises?: SessionDraftExercise[]) =>
  withLocalMovements({
    name: "Séance",
    labelId: null,
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    exercises: exercises ?? ["e0", "a1", "a2", "y0", "b1", "e9"].map((id) => exercise(id)),
    structure,
  });

/** Source de l'icône rendue par `KodjoIcon`, rendue et démontée avant l'écran. */
function probeIconSource(name: "card-media-exercise" | "card-media-exercise-out-of-circuit"): unknown {
  const view = render(<KodjoIcon name={name} testID="icon-probe" />);
  const source: unknown = view.getByTestId("icon-probe").props.source;
  view.unmount();
  return source;
}

const pictogramOf = (id: string) =>
  within(screen.getByTestId(`composition-exercise-row-${id}`, hidden)).getByTestId("composition-exercise-media-icon", hidden).props.source;

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

describe("Carte d'exercice de la Composition — variante selon l'appartenance à un Circuit (08/11/2026)", () => {
  it("Séance et Cycle direct : « Hors circuit » (pictogramme noir) ; Circuit, Circuit d'un Cycle : « Dans un circuit » (gris)", async () => {
    const black = probeIconSource("card-media-exercise-out-of-circuit");
    const grey = probeIconSource("card-media-exercise");
    await renderComposition(sampleDraft());
    for (const id of ["e0", "y0", "e9"]) expect(pictogramOf(id)).toEqual(black);
    for (const id of ["a1", "a2", "b1"]) expect(pictogramOf(id)).toEqual(grey);
    // Toutes les cartes passent par le composant : 72 de haut, aucun chevron de carte. Hermann, 08/11/2026 au soir : « change uniquement le liseré de la carte d'exercice lorsqu'elle est hors circuit (directement dans la séance, pas dans un circuit ni un cycle). Épaisseur : 0,75 pt (au lieu de 0,5 pt). » ; « Le liseré de la carte d'exercice dans un circuit reste à 0,5 pt. »
    // Liseré 0,75 directement dans la Séance (e0, e9) ; 0,5 dans un Circuit (a1, b1) ou directement dans un Cycle (y0).
    for (const id of ["e0", "a1", "y0", "b1", "e9"]) {
      const card = screen.getByTestId(`composition-exercise-row-${id}`, hidden);
      const hairline = id === "e0" || id === "e9" ? 0.75 : 0.5;
      expect(StyleSheet.flatten(card.props.style)).toMatchObject({ height: 72, borderWidth: hairline, borderRadius: 12, borderColor: "rgba(204, 209, 224, 0.5)" });
      expect(StyleSheet.flatten(within(card).getByTestId("composition-activity-main-card", hidden).props.style)).toMatchObject({ left: -hairline });
      expect(within(card).getByTestId("composition-exercise-card-content", hidden)).toBeTruthy();
      expect(within(card).queryByTestId(/chevron|disclosure/u, hidden)).toBeNull();
    }
  });

  it("« Monter » hors du Circuit puis « Descendre » dans le Circuit : la variante suit l'appartenance effective", async () => {
    const black = probeIconSource("card-media-exercise-out-of-circuit");
    const grey = probeIconSource("card-media-exercise");
    await renderComposition(sampleDraft());
    expect(pictogramOf("a1")).toEqual(grey);
    fireEvent(screen.getByTestId("composition-exercise-row-a1"), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    await settle();
    const elements = probe.draft!.structure!.elements;
    expect(elements[1]).toEqual({ kind: "EXERCISE", exercise: "a1" });
    expect(pictogramOf("a1")).toEqual(black);
    fireEvent(screen.getByTestId("composition-exercise-row-a1"), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
    await settle();
    const circuit = probe.draft!.structure!.elements.find((element) => element.kind === "CIRCUIT");
    expect(circuit?.kind === "CIRCUIT" && circuit.circuit.exercises).toContain("a1");
    expect(pictogramOf("a1")).toEqual(grey);
  });
});

describe("Carte d'exercice de la Composition — buy-in / buy-out et prescriptions à incrément (08/11/2026)", () => {
  /** Circuit AMRAP porteur : buy-in (rôle 1) avec récupération de 30 s, membre à Volume croissant (+2/tour). */
  const amrapLayout: Layout = {
    elements: [
      {
        kind: "CIRCUIT",
        circuit: {
          id: "am",
          repeatCount: 2,
          nature: "TOURS",
          format: { key: "AMRAP", settings: { blockSeconds: 600, restBetweenBlocksSeconds: 0 } },
          exercises: ["in", "m1", "m2"],
        },
      },
    ],
    stopPoints: [],
  };
  const amrapDraft = () =>
    sampleDraft(amrapLayout, [
      exercise("in", {
        executionParameters: repetitionParameters(50),
        postActivityRecoverySeconds: 30,
        format: { key: "AMRAP", settings: { incrementPerRound: 0, circuitRole: 1 } },
      }),
      exercise("m1", { executionParameters: repetitionParameters(10), format: { key: "AMRAP", settings: { incrementPerRound: 2 } } }),
      exercise("m2", { executionParameters: repetitionParameters(10), postActivityRecoverySeconds: 0, format: { key: "AMRAP", settings: { incrementPerRound: 0 } } }),
    ]);

  it("buy-in avec récupération : « Buy-in » puis sablier et « 30″ » en ligne 3 ; membre sans récupération : ni sablier ni valeur", async () => {
    await renderComposition(amrapDraft());
    const card = screen.getByTestId("composition-exercise-row-in");
    const line = within(card).getByTestId("composition-exercise-zones-line");
    expect(within(line).getByTestId("composition-activity-passage-in").props.children).toBe(strings.screens.composition.carrier.buyIn);
    expect(within(line).getByTestId("composition-recovery-line-label").props.children).toBe("30″");
    const order = line
      .findAll((node) => typeof node.props.testID === "string" && ["composition-activity-passage-in", "composition-recovery-line-icon"].includes(node.props.testID))
      .map((node) => node.props.testID as string);
    expect(order[0]).toBe("composition-activity-passage-in");
    expect(order).toContain("composition-recovery-line-icon");
    const m2 = screen.getByTestId("composition-exercise-row-m2");
    expect(within(m2).queryByTestId("composition-recovery-line-icon")).toBeNull();
    expect(within(m2).queryByTestId("composition-activity-passage-m2")).toBeNull();
  });

  it("AMRAP « Volume croissant » : « 10 rép. +2/tour » ; sans incrément : « 10 rép. » ; jamais d'estimation", async () => {
    await renderComposition(amrapDraft());
    expect(within(screen.getByTestId("composition-exercise-row-m1")).getByTestId("composition-exercise-summary").props.children).toBe("10 rép. +2/tour");
    expect(within(screen.getByTestId("composition-exercise-row-m2")).getByTestId("composition-exercise-summary").props.children).toBe("10 rép.");
    expect(screen.queryByTestId("composition-exercise-estimated-duration", hidden)).toBeNull();
  });

  it("Death by groupé : intervalle du Circuit porteur — « 1 rép. +1/min »", async () => {
    const deathBy: Layout = {
      elements: [
        {
          kind: "CIRCUIT",
          circuit: {
            id: "db",
            repeatCount: 1,
            nature: "TOURS",
            format: { key: "DEATH_BY", settings: { windowSeconds: 60 } },
            exercises: ["d1"],
          },
        },
      ],
      stopPoints: [],
    };
    await renderComposition(
      sampleDraft(deathBy, [exercise("d1", { executionParameters: repetitionParameters(1), format: { key: "DEATH_BY", settings: { incrementPerRound: 1 } } })]),
    );
    expect(within(screen.getByTestId("composition-exercise-row-d1")).getByTestId("composition-exercise-summary").props.children).toBe("1 rép. +1/min");
  });
});

describe("Carte d'exercice de la Composition — mode placement (D-513, 08/11/2026)", () => {
  it("emplacements sélectionnables sans récupération ni point ; aucun cadre en pointillés sur les cartes ; bandeau « Confirmer 1 point d'arrêt ajouté » puis confirmation", async () => {
    await renderComposition(sampleDraft());
    fireEvent.press(screen.getByTestId("composition-add-stop-action"));
    await settle();
    expect(screen.getByTestId("composition-placement-bar")).toBeTruthy();
    // Aucune récupération ni aucun point : les emplacements sont proposés.
    expect(screen.getByTestId("composition-placement-slot-e0-stop-point")).toBeTruthy();
    for (const id of ["e0", "a1", "y0", "b1", "e9"]) {
      const card = screen.getByTestId(`composition-exercise-row-${id}`, hidden);
      expect(within(card).queryByTestId(`composition-placement-slot-${id}-recovery`, hidden)).toBeNull();
      for (const node of card.findAll((n) => typeof n.type === "string")) {
        expect((StyleSheet.flatten(node.props.style) ?? {}).borderStyle).not.toBe("dashed");
      }
    }
    fireEvent.press(screen.getByTestId("composition-placement-slot-e0-stop-point"));
    const confirm = screen.getByTestId("composition-placement-bar-confirm");
    expect(confirm.props.accessibilityLabel).toBe("Confirmer 1 point d’arrêt ajouté");
    fireEvent.press(confirm);
    await settle();
    expect(screen.queryByTestId("composition-placement-bar")).toBeNull();
    expect(probe.draft!.structure!.stopPoints).toHaveLength(1);
  });
});
