import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { Platform, StyleSheet } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createEmptyDraft, createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits } from "@/domain/sessions/structure";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { SessionDraftContext, type SessionDraftContextValue, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-9 story B.4b — enveloppe multiple et périmètre ajustable. Hermann (29/10) : « On doit pouvoir
 * sélectionner plusieurs exercices pour ajouter directement plusieurs circuits, ou plusieurs exercices
 * / circuits pour ajouter plusieurs cycles en une fois » ; traits de périmètre (« appui sur les traits
 * puis glissement ») ; précisions du 31/10 : « Un Circuit par Exercice », « idem pour la séance » =
 * « Le Cycle ». Jest ne prouve ni le rendu ni le glisser sur iPhone.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));
jest.mock("expo-crypto", () => {
  let counter = 0;
  return { randomUUID: jest.fn(() => `generated-${++counter}`) };
});
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

function exercise(id: string): SessionDraftExercise {
  return {
    ...createExerciseDraft(id, 0),
    name: `Exercice ${id}`,
    sourceMovementId: `movement-${id}`,
    structuralPosition: "BEFORE_TOUR",
    executionParameters: durationParameters(30, 1),
  };
}

/** Séance sans Circuit (D-451) : quatre Exercices au niveau de la Séance, sans structure enregistrée. */
const flatDraft = (): SessionDraft => ({ ...createEmptyDraft(), name: "Séance", exercises: ["a", "b", "c", "d"].map((id) => exercise(id)) });

const hidden = { includeHiddenElements: true } as const;
const t = strings.screens.composition.envelope;

function enter(container: "CIRCUIT" | "CYCLE") {
  fireEvent.press(screen.getByTestId("composition-add-activity-action"));
  fireEvent.press(screen.getByTestId(container === "CIRCUIT" ? "composition-add-activity-tree-circuit" : "composition-add-activity-tree-cycle"));
}

const press = (id: string) => fireEvent.press(screen.getByTestId(`composition-envelope-exercise-${id}-target`));
const handle = (id: string, edge: "top" | "bottom") => screen.getByTestId(`composition-envelope-exercise-${id}-handle-${edge}`);
const action = (node: ReturnType<typeof handle>, actionName: string) => fireEvent(node, "accessibilityAction", { nativeEvent: { actionName } });
const selected = (id: string) => screen.getByTestId(`composition-envelope-exercise-${id}-target`).props.accessibilityState;

async function confirm() {
  fireEvent.press(screen.getByTestId("composition-envelope-bar-confirm"));
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

describe("B.4b — sélection multiple (« Un Circuit par Exercice »)", () => {
  it("plusieurs Exercices désignés puis « Confirmer les circuits » : un Circuit par Exercice, Circuit A, B, C", async () => {
    await renderComposition(flatDraft());
    enter("CIRCUIT");
    press("a");
    expect(screen.getByTestId("composition-envelope-bar-confirm").props.accessibilityLabel).toBe(t.confirmCircuit);
    press("c");
    press("d");
    for (const id of ["a", "c", "d"]) expect(selected(id)).toEqual({ selected: true });
    expect(selected("b")).toEqual({ selected: false });
    expect(screen.getByTestId("composition-envelope-bar-confirm").props.accessibilityLabel).toBe(t.confirmCircuits);
    await confirm();

    const circuits = structureCircuits(probe.draft!.structure!);
    expect(circuits.map((circuit) => circuit.exercises)).toEqual([["a"], ["c"], ["d"]]);
    expect(circuits.map((circuit) => [circuit.repeatCount, circuit.nature])).toEqual([
      [1, "TOURS"],
      [1, "TOURS"],
      [1, "TOURS"],
    ]);
    expect(circuits.map((circuit) => screen.getByTestId(`composition-layout-circuit-${circuit.id}-header-title`, hidden).props.children)).toEqual([
      // Recette n° 3 bis du 03/11/2026 (f3s-nom) : plus de lettre après le nom d'un Circuit.
      "Circuit",
      "Circuit",
      "Circuit",
    ]);
  });

  it("un second toucher retire l'élément de la sélection ; plus rien de désigné : Confirmer indisponible", async () => {
    await renderComposition(flatDraft());
    enter("CIRCUIT");
    press("b");
    press("b");
    expect(selected("b")).toEqual({ selected: false });
    expect(screen.getByTestId("composition-envelope-bar-confirm").props.accessibilityState).toEqual({ disabled: true });
  });

  it("plusieurs Cycles en une fois : un Cycle par Exercice désigné", async () => {
    await renderComposition(flatDraft());
    enter("CYCLE");
    press("a");
    press("c");
    expect(screen.getByTestId("composition-envelope-bar-confirm").props.accessibilityLabel).toBe(t.confirmCycles);
    await confirm();
    const shape = probe.draft!.structure!.elements.map((element) =>
      element.kind === "CYCLE" ? element.cycle.members.map((member) => (member.kind === "EXERCISE" ? member.exercise : member.kind)) : element.kind,
    );
    expect(shape).toEqual([["a"], "EXERCISE", ["c"], "EXERCISE"]);
  });
});

describe("B.4b — périmètre ajustable (traits haut et bas)", () => {
  it("désigné : traits haut et bas ; « Étendre vers le bas » couvre l'Exercice suivant, un seul cadre continu", async () => {
    await renderComposition(flatDraft());
    enter("CIRCUIT");
    expect(screen.queryByTestId("composition-envelope-exercise-b-handle-top")).toBeNull();
    press("b");
    const top = handle("b", "top");
    expect(top.props.accessibilityRole).toBe("adjustable");
    expect(top.props.accessibilityLabel).toBe(t.circuitTopEdge);
    expect(top.props.accessibilityValue).toEqual({ text: "1 élément" });
    expect(top.props.accessibilityActions.map((item: { label: string }) => item.label)).toEqual(expect.arrayContaining([t.extendUp, t.reduceFromTop]));
    expect(handle("b", "bottom").props.accessibilityLabel).toBe(t.circuitBottomEdge);

    action(handle("b", "bottom"), "increment");
    // Le trait bas passe sur c ; un seul cadre : b ouvert en bas, c ouvert en haut, à travers l'écart (8).
    expect(screen.queryByTestId("composition-envelope-exercise-b-handle-bottom")).toBeNull();
    expect(handle("c", "bottom").props.accessibilityValue).toEqual({ text: "2 éléments" });
    expect(handle("b", "top").props.accessibilityValue).toEqual({ text: "2 éléments" });
    const upper = StyleSheet.flatten(screen.getByTestId("composition-envelope-exercise-b-target").props.style);
    const lower = StyleSheet.flatten(screen.getByTestId("composition-envelope-exercise-c-target").props.style);
    expect(upper).toMatchObject({ top: 0, bottom: -4, borderBottomWidth: 0, borderStyle: "solid" });
    expect(lower).toMatchObject({ top: -4, bottom: 0, borderTopWidth: 0, borderStyle: "solid" });
    expect(selected("c")).toEqual({ selected: true });

    action(handle("b", "top"), "extend");
    await confirm();
    expect(structureCircuits(probe.draft!.structure!).map((circuit) => circuit.exercises)).toEqual([["a", "b", "c"]]);
    // Un seul Circuit : ancien modèle, zones du brouillon réécrites.
    expect(Object.fromEntries(probe.draft!.exercises.map((item) => [item.id, item.structuralPosition]))).toEqual({
      a: "IN_TOUR",
      b: "IN_TOUR",
      c: "IN_TOUR",
      d: "AFTER_TOUR",
    });
  });

  it("« Réduire » ramène le périmètre, jamais sous un contenu ; toucher un contenu du périmètre le retire entier", async () => {
    await renderComposition(flatDraft());
    enter("CIRCUIT");
    press("a");
    action(handle("a", "bottom"), "increment");
    action(handle("b", "bottom"), "increment");
    expect(handle("a", "top").props.accessibilityValue).toEqual({ text: "3 éléments" });
    action(handle("a", "top"), "reduce");
    expect(selected("a")).toEqual({ selected: false });
    expect(handle("b", "top").props.accessibilityValue).toEqual({ text: "2 éléments" });
    action(handle("c", "bottom"), "decrement");
    action(handle("b", "bottom"), "decrement");
    expect(handle("b", "top").props.accessibilityValue).toEqual({ text: "1 élément" });

    action(handle("b", "bottom"), "increment");
    press("c");
    expect(selected("b")).toEqual({ selected: false });
    expect(screen.getByTestId("composition-envelope-bar-confirm").props.accessibilityState).toEqual({ disabled: true });
  });

  it("le périmètre s'arrête à un autre périmètre désigné ; deux Circuits voisins à la confirmation", async () => {
    await renderComposition(flatDraft());
    enter("CIRCUIT");
    press("a");
    press("c");
    action(handle("a", "bottom"), "increment");
    action(handle("b", "bottom"), "increment");
    expect(handle("a", "top").props.accessibilityValue).toEqual({ text: "2 éléments" });
    await confirm();
    expect(structureCircuits(probe.draft!.structure!).map((circuit) => circuit.exercises)).toEqual([["a", "b"], ["c"]]);
  });

  it("Cycle (« idem pour la séance ») : le périmètre couvre un Circuit voisin, cadre à la largeur du Circuit", async () => {
    await renderComposition(flatDraft());
    enter("CIRCUIT");
    press("b");
    await confirm();
    enter("CYCLE");
    press("a");
    expect(handle("a", "top").props.accessibilityLabel).toBe(t.cycleTopEdge);
    action(handle("a", "bottom"), "increment");
    // Largeur du Circuit (débord 6 depuis le 08/11/2026 au soir ; 16 auparavant).
    expect(StyleSheet.flatten(screen.getByTestId("composition-envelope-exercise-a-target").props.style)).toMatchObject({
      left: -6,
      right: -6,
      borderRadius: 18,
      borderBottomLeftRadius: 0,
    });
    expect(screen.getByTestId("composition-envelope-circuit-target").props.accessibilityState).toEqual({ selected: true });
    await confirm();
    const cycle = probe.draft!.structure!.elements.find((element) => element.kind === "CYCLE");
    if (cycle?.kind !== "CYCLE") throw new Error("Cycle absent");
    expect(cycle.cycle.members.map((member) => member.kind)).toEqual(["EXERCISE", "CIRCUIT"]);
    const block = screen.getByTestId(`composition-layout-cycle-${cycle.cycle.id}`);
    expect(within(block).getByTestId("composition-exercise-row-a")).toBeTruthy();
    expect(within(block).getByTestId("composition-exercise-row-b")).toBeTruthy();
    expect(within(block).queryByTestId("composition-exercise-row-c")).toBeNull();
  });

  // [B.4b : « aucun contenu atteignable (Séance à Points d'arrêt, suivi en B.6) : pas de traits » —
  // remplacé le 31/10/2026 par B.6 : une Séance à Points d'arrêt s'étend comme une autre.]
  it("Séance à Points d'arrêt (B.6) : traits présents, comme sans Point", async () => {
    await renderComposition({ ...flatDraft(), stopPoints: [{ id: "p1", scope: "BEFORE_TOUR", position: 1 }] });
    enter("CIRCUIT");
    press("a");
    expect(screen.getByTestId("composition-envelope-exercise-a-handle-bottom")).toBeTruthy();
  });

  it("Annuler après extension : aucune mutation du brouillon", async () => {
    await renderComposition(flatDraft());
    const before = probe.draft;
    enter("CIRCUIT");
    press("a");
    action(handle("a", "bottom"), "increment");
    fireEvent.press(screen.getByTestId("composition-envelope-bar-cancel"));
    expect(probe.draft).toBe(before);
  });
});
