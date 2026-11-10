import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { Alert, Keyboard, Platform, StyleSheet } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits, type SessionStructure, type StructureStopPointLocation } from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { SessionDraftContext, type SessionDraftContextValue, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Mise à jour consolidée des écrans Formats du 04/11/2026 (§6 quinquies, §6 sexies) — Circuit replié : actions
 * glissées Renommer | (Modifier le format) | Dupliquer | Supprimer ; le Circuit déplié ne se glisse pas.
 */

let mockUuid = 0;
const mockPush = jest.fn();
jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => `uuid-${++mockUuid}`) }));
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
      updateDraft: (update: SessionDraftUpdate) => setDraft((current) => ({ ...current, ...(typeof update === "function" ? update(current) : update) })),
      resetDraft: jest.fn(),
    }),
    [draft],
  );
  return <SessionDraftContext.Provider value={value}>{children}</SessionDraftContext.Provider>;
}

const exercise = (id: string): SessionDraftExercise => ({
  ...createExerciseDraft(id, 0),
  name: `Exercice ${id}`,
  structuralPosition: "BEFORE_TOUR",
  executionParameters: durationParameters(20, 8),
});

function draftOf(originModel: "TABATA" | null): SessionDraft {
  const structure: SessionStructure<string, StructureStopPointLocation> = {
    elements: [
      { kind: "EXERCISE", exercise: "e0" },
      { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 8, nature: "SERIES", exercises: ["a1", "a2"], ...(originModel !== null ? { originModel } : {}) } },
      // Second Circuit : disposition générale (l'ancien modèle à Circuit unique n'a pas d'en-tête repliable par Circuit).
      { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1"] } },
    ],
    stopPoints: [],
  };
  return withLocalMovements({ name: "Séance", labelId: null, initialCountdownSeconds: 10, finalPhaseSeconds: 5, exercises: ["e0", "a1", "a2", "b1"].map(exercise), structure });
}

/** Recette du 10/11/2026 (constat A) : un seul Circuit, composé à la main — ancien modèle (rendu historique). */
function singleCircuitDraft(): SessionDraft {
  const structure: SessionStructure<string, StructureStopPointLocation> = {
    elements: [
      { kind: "EXERCISE", exercise: "e0" },
      { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 3, nature: "TOURS", exercises: ["a1", "a2"] } },
    ],
    stopPoints: [],
  };
  return withLocalMovements({ name: "Recette A", labelId: null, initialCountdownSeconds: 10, finalPhaseSeconds: 5, exercises: [exercise("e0"), { ...exercise("a1"), structuralPosition: "IN_TOUR" as const }, { ...exercise("a2"), structuralPosition: "IN_TOUR" as const }], structure });
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

const action = (name: string) =>
  act(async () => {
    fireEvent(screen.getByTestId("composition-layout-circuit-ca-swipe-card"), "accessibilityAction", { nativeEvent: { actionName: name } });
  });

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

describe("Circuit replié — actions glissées (MAJ 04/11 §6 quinquies, §6 sexies)", () => {
  it("déplié : aucune action glissée ; replié et issu d'un modèle : quatre actions, « Modifier le format » rouvre le récapitulatif", async () => {
    await renderComposition(draftOf("TABATA"));
    // Recette du 04/11 : rangée montée mais inerte quand le Circuit est déplié (aucune action, aucune cible propre).
    const expanded = screen.getByTestId("composition-layout-circuit-ca-swipe-card");
    expect(expanded.props.accessibilityActions).toEqual([]);
    expect(expanded.props.accessible).toBe(false);
    fireEvent.press(screen.getByTestId("composition-layout-circuit-ca-header-collapse"));
    const actions = screen.getByTestId("composition-layout-circuit-ca-swipe-card").props.accessibilityActions.map((item: { name: string }) => item.name);
    expect(actions).toEqual(["rename", "edit-format", "duplicate", "delete"]);
    await action("edit-format");
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/format-summary", params: { model: "TABATA", circuitId: "ca" } });
  });

  it("Circuit composé à la main : trois actions ; Renommer — saisie en ligne validée par Retour, nom vide = nom par défaut", async () => {
    await renderComposition(draftOf(null));
    fireEvent.press(screen.getByTestId("composition-layout-circuit-ca-header-collapse"));
    const actions = screen.getByTestId("composition-layout-circuit-ca-swipe-card").props.accessibilityActions.map((item: { name: string }) => item.name);
    expect(actions).toEqual(["rename", "duplicate", "delete"]);
    await action("rename");
    const field = screen.getByTestId("composition-layout-circuit-ca-header-rename");
    fireEvent.changeText(field, "Finisher");
    await act(async () => {
      fireEvent(field, "submitEditing");
    });
    expect(structureCircuits(probe.draft!.structure!)[0]!.name).toBe("Finisher");
    expect(screen.getByTestId("composition-layout-circuit-ca-header-title")).toHaveTextContent("Finisher");
  });

  it("Supprimer : confirmation « Supprimer ce circuit ? » ; Supprimer retire le Circuit et ses exercices", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await renderComposition(draftOf("TABATA"));
    fireEvent.press(screen.getByTestId("composition-layout-circuit-ca-header-collapse"));
    await action("delete");
    expect(alert).toHaveBeenCalledWith("Supprimer ce circuit ?", "Le circuit et ses 2 exercices seront supprimés de la séance.", expect.any(Array));
    const buttons = alert.mock.calls[0]![2] as { text: string; onPress?: () => void }[];
    await act(async () => {
      buttons.find((button) => button.text === "Supprimer")!.onPress!();
    });
    expect(probe.draft!.exercises.map((item) => item.id)).toEqual(["e0", "b1"]);
    alert.mockRestore();
  });

  it("Dupliquer : copie juste après, nom « (C) » en saisie", async () => {
    await renderComposition(draftOf("TABATA"));
    fireEvent.press(screen.getByTestId("composition-layout-circuit-ca-header-collapse"));
    await action("duplicate");
    const circuits = structureCircuits(probe.draft!.structure!);
    expect(circuits).toHaveLength(3);
    expect(circuits[1]).toMatchObject({ name: "Tabata (C)", originModel: "TABATA" });
    expect(screen.getByTestId(`composition-layout-circuit-${circuits[1]!.id}-header-rename`).props.value).toBe("Tabata (C)");
  });
});

describe("Recette iPhone du 04/11/2026 — Circuit replié glissé", () => {
  const swipe = "composition-layout-circuit-ca-swipe";
  const wait = (ms: number) => act(async () => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const swipeOpen = () =>
    act(async () => {
      fireEvent(screen.getByTestId(swipe), "touchStart", { nativeEvent: { pageX: 360, pageY: 10 } });
      fireEvent(screen.getByTestId(swipe), "touchMove", { nativeEvent: { pageX: 40, pageY: 12 } });
      fireEvent(screen.getByTestId(swipe), "touchEnd", { nativeEvent: { pageX: 40, pageY: 12 } });
    });
  const translateX = (testID: string) => {
    const style = StyleSheet.flatten(screen.getByTestId(testID).props.style) as { transform?: { translateX?: number }[] };
    return style.transform?.find((item) => item.translateX !== undefined)?.translateX ?? 0;
  };

  it("repli et déploiement : l'en-tête n'est pas remonté (ligne des noms animée, pas retirée d'un coup)", async () => {
    await renderComposition(draftOf("TABATA"));
    fireEvent.press(screen.getByTestId("composition-layout-circuit-ca-header-collapse"));
    await act(async () => undefined);
    expect(screen.getByTestId("composition-layout-circuit-ca-header-names-reveal")).toBeTruthy();
    // Déploiement : la ligne des noms se referme par son animation (même instance), elle est encore montée.
    fireEvent.press(screen.getByTestId("composition-layout-circuit-ca-header-collapse"));
    expect(screen.getByTestId("composition-layout-circuit-ca-header-names-reveal")).toBeTruthy();
    expect(screen.getByTestId(`${swipe}-card`).props.accessibilityActions).toEqual([]);
  });

  it("glisser gauche : actions sur toute la hauteur du cadre, alignées sur son bord droit ; le cadre glisse avec l'en-tête", async () => {
    await renderComposition(draftOf("TABATA"));
    fireEvent.press(screen.getByTestId("composition-layout-circuit-ca-header-collapse"));
    await swipeOpen();
    const actions = StyleSheet.flatten(screen.getByTestId(`${swipe}-actions`).props.style) as { top: number; right: number; bottom: number };
    expect(actions.top).toBe(-14);
    expect(actions.right).toBe(-6); // Circuit à 10 du bord (débord 6). [08/11/2026 au soir — marges des cadres : Circuit à 10 du bord, cartes à 10 du cadre, bas 10 ; Cycle bas 12.]
    // CE-FMT-05 : actions de 70, bloc arrondi au rayon du cadre du Circuit (18) à ses extrémités.
    expect(StyleSheet.flatten(screen.getByTestId(`${swipe}-action-rename`).props.style)).toMatchObject({ width: 70, borderTopLeftRadius: 18 });
    expect(StyleSheet.flatten(screen.getByTestId(`${swipe}-action-delete`).props.style)).toMatchObject({ width: 70, borderBottomRightRadius: 18 });
    await wait(400);
    // Quatre actions de 70 et l'écart de 8 : le cadre et l'en-tête glissent ensemble (même valeur, suivie au doigt).
    expect(translateX(`${swipe}-card`)).toBe(-(4 * 70 + 8));
    expect(translateX("composition-layout-circuit-ca-surface-swipe")).toBe(-(4 * 70 + 8));
  });

  it("Dupliquer : les actions se referment, même si le doigt a glissé pendant l'appui", async () => {
    await renderComposition(draftOf("TABATA"));
    fireEvent.press(screen.getByTestId("composition-layout-circuit-ca-header-collapse"));
    await swipeOpen();
    await wait(400);
    await act(async () => {
      fireEvent(screen.getByTestId(swipe), "touchStart", { nativeEvent: { pageX: 300, pageY: 10 } });
      fireEvent(screen.getByTestId(swipe), "touchMove", { nativeEvent: { pageX: 288, pageY: 10 } });
      fireEvent.press(screen.getByTestId(`${swipe}-action-duplicate`));
    });
    await act(async () => {
      fireEvent(screen.getByTestId(swipe), "touchEnd", { nativeEvent: { pageX: 288, pageY: 10 } });
    });
    await wait(400);
    expect(structureCircuits(probe.draft!.structure!)).toHaveLength(3);
    // Position de repos fermée (le retour à 0 lui-même passe par le pilote natif, non simulé sous Jest).
    expect(screen.queryByTestId(`${swipe}-actions`)).toBeNull();
  });
  it("Renommer : clavier ouvert, place réservée sous le contenu pour remonter le Circuit au-dessus du clavier", async () => {
    const listeners = new Map<string, Set<(event: unknown) => void>>();
    const spy = jest.spyOn(Keyboard, "addListener").mockImplementation(((name: string, listener: (event: unknown) => void) => {
      const set = listeners.get(name) ?? new Set<(event: unknown) => void>();
      set.add(listener);
      listeners.set(name, set);
      return { remove: () => set.delete(listener) };
    }) as unknown as typeof Keyboard.addListener);
    const emit = (name: string) =>
      act(async () => listeners.get(name)?.forEach((listener) => listener({ endCoordinates: { screenX: 0, screenY: 500, width: 390, height: 344 } })));
    const padding = () => (StyleSheet.flatten(screen.getByTestId("composition-body").props.contentContainerStyle) as { paddingBottom: number }).paddingBottom;
    await renderComposition(draftOf(null));
    const before = padding();
    fireEvent.press(screen.getByTestId("composition-layout-circuit-ca-header-collapse"));
    await action("rename");
    await emit("keyboardWillShow");
    expect(padding()).toBe(before + 344);
    await emit("keyboardWillHide");
    expect(padding()).toBe(before);
    spy.mockRestore();
  });
});

describe("Circuit unique de l'ancien modèle — options (recette du 10/11/2026, constat A)", () => {
  const singleAction = (name: string) =>
    act(async () => {
      fireEvent(screen.getByTestId("composition-circuit-header-swipe-card"), "accessibilityAction", { nativeEvent: { actionName: name } });
    });

  it("déplié : aucune option ; replié : Renommer, Dupliquer, Supprimer", async () => {
    await renderComposition(singleCircuitDraft());
    expect(screen.queryByTestId("composition-layout-circuit-ca-swipe-card")).toBeNull();
    expect(screen.getByTestId("composition-circuit-header-swipe-card").props.accessibilityActions).toEqual([]);
    fireEvent.press(screen.getByTestId("composition-circuit-header-collapse"));
    const actions = screen.getByTestId("composition-circuit-header-swipe-card").props.accessibilityActions.map((item: { name: string }) => item.name);
    expect(actions).toEqual(["rename", "duplicate", "delete"]);
  });

  it("Renommer : le nom est enregistré et le Circuit passe dans la disposition générale, qui l'affiche", async () => {
    await renderComposition(singleCircuitDraft());
    fireEvent.press(screen.getByTestId("composition-circuit-header-collapse"));
    await singleAction("rename");
    const field = screen.getByTestId("composition-circuit-header-rename");
    fireEvent.changeText(field, "Finisher");
    await act(async () => {
      fireEvent(field, "submitEditing");
    });
    expect(structureCircuits(probe.draft!.structure!)[0]!.name).toBe("Finisher");
    expect(screen.getByTestId("composition-layout-circuit-ca-header-title")).toHaveTextContent("Finisher");
  });

  it("Dupliquer : deux Circuits, disposition générale ; Supprimer : confirmation puis Circuit retiré", async () => {
    await renderComposition(singleCircuitDraft());
    fireEvent.press(screen.getByTestId("composition-circuit-header-collapse"));
    await singleAction("duplicate");
    expect(structureCircuits(probe.draft!.structure!)).toHaveLength(2);
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await renderComposition(singleCircuitDraft());
    fireEvent.press(screen.getAllByTestId("composition-circuit-header-collapse").at(-1)!);
    await act(async () => {
      fireEvent(screen.getAllByTestId("composition-circuit-header-swipe-card").at(-1)!, "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    });
    expect(alert).toHaveBeenCalledWith("Supprimer ce circuit ?", "Le circuit et ses 2 exercices seront supprimés de la séance.", expect.any(Array));
    alert.mockRestore();
  });
});
