import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
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
 * PRE-9 — recette iPhone n° 2 du 31/10/2026, lot 3 (Hermann) : périmètre étendu sur un Point d'arrêt
 * (b4b-saisie), cadre continu autour d'un Point (b6-enveloppe), écran figé pendant le glisser d'un
 * trait (b4b-etendre), carte → paramètres et photo → Mouvement (constat c). Jest ne prouve ni le rendu
 * ni les gestes sur iPhone.
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
const t = strings.screens.composition;

function enter(container: "CIRCUIT" | "CYCLE") {
  fireEvent.press(screen.getByTestId("composition-add-activity-action"));
  fireEvent.press(screen.getByTestId(container === "CIRCUIT" ? "composition-add-activity-tree-circuit" : "composition-add-activity-tree-cycle"));
}
const press = (id: string) => fireEvent.press(screen.getByTestId(`composition-envelope-exercise-${id}-target`));
const action = (testID: string, actionName: string) => fireEvent(screen.getByTestId(testID), "accessibilityAction", { nativeEvent: { actionName } });

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

describe("Recette n° 2, lot 3 (b4b-saisie) — le périmètre s'étend sur un Point d'arrêt", () => {
  it("ancien modèle : Exercice suivi d'un Point puis du Circuit — traits affichés ; le Point entre dans le nouveau Circuit", async () => {
    // a, P, Circuit [b], c — le Circuit suivant n'est pas éligible pour un Circuit.
    await renderComposition({
      ...flatDraft(),
      exercises: [exercise("a"), { ...exercise("b"), structuralPosition: "IN_TOUR" }, { ...exercise("c"), structuralPosition: "AFTER_TOUR" }],
      stopPoints: [{ id: "p1", scope: "BEFORE_TOUR", position: 1 }],
    });
    enter("CIRCUIT");
    press("a");
    // [Avant : aucun contenu atteignable, pas de traits.] Le Point est atteignable : traits présents.
    expect(screen.getByTestId("composition-envelope-exercise-a-handle-bottom")).toBeTruthy();
    action("composition-envelope-exercise-a-handle-bottom", "increment");
    // Le bord bas est sur le Point : il porte le trait et sa part du cadre (ouvert en haut).
    expect(screen.queryByTestId("composition-envelope-exercise-a-handle-bottom")).toBeNull();
    expect(screen.getByTestId("composition-envelope-stop-point-p1-handle-bottom", hidden)).toBeTruthy();
    const frame = StyleSheet.flatten(screen.getByTestId("composition-envelope-stop-point-p1-frame", hidden).props.style);
    expect(frame).toMatchObject({ borderTopWidth: 0, borderStyle: "solid" });
    expect(StyleSheet.flatten(screen.getByTestId("composition-envelope-exercise-a-target").props.style)).toMatchObject({ borderBottomWidth: 0 });
    await confirm();
    const layout = probe.draft!.structure!;
    const circuits = structureCircuits(layout);
    const created = circuits.find((circuit) => circuit.exercises.includes("a"))!;
    expect(created.exercises).toEqual(["a"]);
    expect(layout.stopPoints).toEqual([expect.objectContaining({ circuitId: created.id, position: 1 })]);
  });

  it("b6-enveloppe : un Point entre deux contenus du périmètre porte sa part du cadre (bords gauche et droit)", async () => {
    await renderComposition({ ...flatDraft(), stopPoints: [{ id: "p1", scope: "BEFORE_TOUR", position: 2 }] });
    enter("CIRCUIT");
    press("b");
    action("composition-envelope-exercise-b-handle-bottom", "increment");
    action("composition-envelope-stop-point-p1-handle-bottom", "increment");
    const frame = StyleSheet.flatten(screen.getByTestId("composition-envelope-stop-point-p1-frame", hidden).props.style);
    // Ouvert en haut et en bas (cadre continu), bords gauche et droit présents (style désigné).
    expect(frame).toMatchObject({ borderTopWidth: 0, borderBottomWidth: 0, borderStyle: "solid" });
    expect(frame.borderLeftWidth ?? frame.borderWidth).toBeGreaterThan(0);
    expect(screen.getByTestId("composition-envelope-exercise-c-handle-bottom")).toBeTruthy();
  });
});

describe("Recette n° 2, lot 3 (b4b-etendre) — l'écran reste figé pendant le glisser d'un trait", () => {
  it("le défilement par l'utilisateur est coupé de l'appui au relâchement", async () => {
    await renderComposition(flatDraft());
    enter("CIRCUIT");
    press("b");
    const body = () => screen.getByTestId("composition-body");
    expect(body().props.scrollEnabled).toBe(true);
    const bottom = screen.getByTestId("composition-envelope-exercise-b-handle-bottom");
    fireEvent(bottom, "responderGrant", { nativeEvent: { pageY: 300 } });
    expect(body().props.scrollEnabled).toBe(false);
    fireEvent(bottom, "responderMove", { nativeEvent: { pageY: 340 } });
    fireEvent(screen.getByTestId("composition-envelope-exercise-b-handle-bottom"), "responderRelease", { nativeEvent: { pageY: 340 } });
    expect(body().props.scrollEnabled).toBe(true);
  });
});

describe("Recette n° 2, lot 3 (constat c) — carte → paramètres, photo → Mouvement", () => {
  it("la carte annonce « Modifier les paramètres » et ouvre la feuille ; la photo est le bouton « Ouvrir le mouvement »", async () => {
    await renderComposition(flatDraft());
    const card = screen.getByTestId("composition-exercise-row-a");
    expect(card.props.accessibilityHint).toContain(t.exerciseRow.editParametersAccessibilityLabel);
    const photo = screen.getByTestId("composition-exercise-media-button-a");
    expect(photo.props.accessibilityRole).toBe("button");
    expect(photo.props.accessibilityLabel).toBe("Ouvrir le mouvement");
    fireEvent.press(card);
    await act(async () => undefined);
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    await act(async () => undefined);
    fireEvent.press(photo);
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/exercise", params: { exerciseId: "a" } });
  });
});
