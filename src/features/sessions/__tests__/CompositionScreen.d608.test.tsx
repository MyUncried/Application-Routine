import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import { createFreeExerciseParameters, stopConditionOf } from "@/domain/activities/ExecutionParameters";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { freeExerciseOf } from "@/domain/sessions/carrierMembership";
import { createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { SessionStructure, StructureStopPointLocation } from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { formatOriginOf } from "@/features/sessions/formatSheetContext";
import { SessionDraftContext, type SessionDraftContextValue, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * D-608 (D-573 de la branche de documentation, Hermann, 26/11/2026 ; Formats § 9.10) : l'appui sur la carte d'un Exercice ouvre la
 * modale « Paramètres d'exécution » allégée, titrée du nom du mouvement, en-tête à la couleur du format ; la ligne « N tours · alternées /
 * groupées » et sa durée ouvrent la page globale du format. [Remplace D-606 point 1, décrit ci-dessous :]
 * D-606 (D-571 de la branche de documentation, Hermann, 25/11/2026 ; Formats § 9.8) : dans la Composition, l'appui sur la carte d'un
 * Exercice issu d'un format ouvre la page unique du format (réouverture sur ses paramètres, `circuitId`) ; la modale « Paramètres
 * d'exécution » ne s'ouvre plus pour lui. Photo (fiche en lecture seule) et actions de la carte (déplacer, dupliquer, supprimer) :
 * inchangées. Exercice libre et membre d'un Circuit composé à la main : modale, inchangée.
 * Jest ne prouve que l'arbre JS : la vérification visuelle et tactile est faite par Hermann sur iPhone.
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
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: () => ({ isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() }),
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

function draftOf(): SessionDraft {
  const structure: SessionStructure<string, StructureStopPointLocation> = {
    elements: [
      { kind: "EXERCISE", exercise: "e0" },
      { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 8, nature: "SERIES", exercises: ["a1", "a2"], originModel: "TABATA" } },
      { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1"] } },
    ],
    stopPoints: [],
  };
  return withLocalMovements({ name: "Séance", labelId: null, initialCountdownSeconds: 10, finalPhaseSeconds: 5, exercises: ["e0", "a1", "a2", "b1"].map(exercise), structure });
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
});

describe("D-608 — carte : modale ; ligne « N tours » du Circuit : page du format", () => {
  it("membre d'un Circuit issu d'un format : la carte ouvre la modale, titrée du nom du mouvement, en-tête à la couleur du format", async () => {
    await renderComposition(draftOf());
    await act(async () => {
      fireEvent.press(screen.getByTestId("composition-exercise-row-a1"));
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(await screen.findByTestId("execution-sheet")).toBeTruthy();
    expect(screen.getByTestId("execution-sheet-title")).toHaveTextContent("Exercice a1");
    // Recette iPhone du 26/11/2026 (après-midi), point A : titre sur deux lignes au plus, puis « … ». [Une ligne — remplacé.]
    expect(screen.getByTestId("execution-sheet-title").props.numberOfLines).toBe(2);
    expect(screen.getByTestId("execution-sheet-header-tint")).toHaveStyle({ backgroundColor: "#FDECEC" });
    expect(screen.queryByTestId("execution-sheet-free-context")).toBeNull();
  });

  it("Circuit issu d'un format : nombre de tours, nature et durée ouvrent la page du format ; le nom replie toujours", async () => {
    await renderComposition(draftOf());
    for (const id of [
      "composition-layout-circuit-ca-header-counter",
      "composition-layout-circuit-ca-header-counter-adjective-target",
      "composition-layout-circuit-ca-header-duration-open-format",
    ]) {
      mockPush.mockReset();
      await act(async () => {
        fireEvent.press(screen.getByTestId(id));
      });
      expect(mockPush).toHaveBeenCalledWith({ pathname: "/format-summary", params: { model: "TABATA", circuitId: "ca" } });
    }
    mockPush.mockReset();
    await act(async () => {
      fireEvent.press(screen.getByTestId("composition-layout-circuit-ca-header-collapse"));
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("Circuit composé à la main : la ligne garde le stepper et le menu de nature", async () => {
    await renderComposition(draftOf());
    expect(screen.queryByTestId("composition-layout-circuit-cb-header-duration-open-format")).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByTestId("composition-layout-circuit-cb-header-counter"));
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("photo : fiche en lecture seule ; actions de la carte (déplacer, dupliquer, supprimer) inchangées", async () => {
    await renderComposition(draftOf());
    fireEvent.press(screen.getByTestId("composition-exercise-media-button-a2"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/exercise-sheet", params: { exerciseId: "a2" } });
    const actions = screen.getByTestId("composition-exercise-row-a1").props.accessibilityActions.map((action: { name: string }) => action.name);
    expect(actions).toEqual(expect.arrayContaining(["duplicate", "delete"]));
    expect(actions.some((name: string) => name === "moveUp" || name === "moveDown")).toBe(true);
  });

  // [D-606 puis D-608 (26/11, matin) : la carte d'un exercice libre ouvrait la modale de type format « Exercice libre » (zone de contexte,
  // accroche, cadre Mouvement) — remplacé le 26/11/2026 (D-573 point 5, Formats § 9.10 : « Une fois créé, l'exercice se modifie depuis la
  // Composition par la modale « Paramètres d'exécution » allégée, comme tout exercice ») ; la page « Exercice libre » est celle de la
  // création (FreeExerciseScreen.d608).]
  it("exercice libre créé : la carte ouvre la modale « Paramètres d'exécution » commune, pas la page « Exercice libre »", async () => {
    await renderComposition(draftOf());
    await act(async () => {
      fireEvent.press(screen.getByTestId("composition-exercise-row-e0"));
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(await screen.findByTestId("execution-sheet")).toBeTruthy();
    expect(screen.getByTestId("execution-sheet-title")).toHaveTextContent("Exercice e0");
    expect(screen.getByTestId("execution-sheet-header-tint")).toHaveStyle({ backgroundColor: "#F1F2F5" });
    expect(screen.queryByTestId("execution-sheet-free-context")).toBeNull();
    expect(screen.queryByTestId("execution-sheet-free-tagline")).toBeNull();
    expect(screen.queryByTestId("execution-sheet-frame-movement")).toBeNull();
    for (const id of ["execution-sheet-row-mode", "execution-sheet-row-stop-condition", "execution-sheet-row-load", "execution-sheet-row-side"]) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
  });

  it("membre d'un Circuit composé à la main : exercice libre, même modale commune", async () => {
    await renderComposition(draftOf());
    await act(async () => {
      fireEvent.press(screen.getByTestId("composition-exercise-row-b1"));
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(await screen.findByTestId("execution-sheet-header-tint")).toBeTruthy();
    expect(screen.queryByTestId("execution-sheet-free-context")).toBeNull();
  });

  it("formatOriginOf : modèle d'origine du Circuit ; rien pour un exercice seul ou un Circuit composé à la main", () => {
    const draft = draftOf();
    expect(formatOriginOf(draft, "a2")).toEqual({ model: "TABATA", circuitId: "ca" });
    expect(formatOriginOf(draft, "e0")).toBeUndefined();
    expect(formatOriginOf(draft, "b1")).toBeUndefined();
  });
});

describe("D-606 — valeurs par défaut d'un exercice libre", () => {
  it("nouvel exercice libre et exercice sorti d'un format : Mode Répétitions, « À l'objectif » (Cible à renseigner)", () => {
    const parameters = createFreeExerciseParameters({ countdownSeconds: 10, endSeconds: 5 });
    expect(parameters.mode).toBe("REPETITIONS");
    expect(stopConditionOf(parameters)).toBe("TARGET");
    expect(parameters.series).toMatchObject({ kind: "UNIFORM", count: 1, target: { kind: "UNSET" } });
    const exited = freeExerciseOf({ ...exercise("x"), format: { key: "EMOM", settings: {} } } as SessionDraftExercise);
    expect(exited.executionParameters.mode).toBe("REPETITIONS");
    expect(exited.format).toBeUndefined();
  });
});
