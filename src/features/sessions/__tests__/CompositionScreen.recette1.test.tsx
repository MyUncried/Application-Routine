import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createEmptyDraft, createExerciseDraft, toSessionDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { SessionStructure, StructureStopPointLocation } from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { CARD_SHEET_MOTION_MS } from "@/features/activities/ExecutionParametersSheet";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { resolveRichLayout } from "@/features/sessions/compositionLayout";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { exerciseOfMovement } from "@/features/sessions/movementExercises";
import { SessionDraftContext, type SessionDraftContextValue, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { SessionService } from "@/features/sessions/SessionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { DEFAULT_GUIDANCE_EVENTS } from "@/domain/preferences/guidanceSettings";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-9 — recette iPhone n° 1 (29/10/2026). Jest ne prouve pas le rendu sur iPhone.
 *
 * 1. « Ajouter un arrêt » avec UN seul Circuit (ancien modèle) : disponible comme avant PRE-9, pour
 *    une Séance enregistrée puis rouverte (vrai service, SQLite en mémoire) comme pour un Circuit
 *    posé par « Ajouter un circuit » (B.2) ; début et fin du Circuit proposés. Plusieurs Circuits ou
 *    un Cycle : indisponible jusqu'à B.6 (limite connue).
 * 2. Demande de Hermann du 29/10/2026 : toucher une carte « Paramètres à compléter » ouvre
 *    directement la feuille de paramètres (sans l'éditeur) ; une carte complète ouvre l'éditeur.
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

function exercise(id: string, structuralPosition: SessionDraftExercise["structuralPosition"] = "BEFORE_TOUR"): SessionDraftExercise {
  return {
    ...createExerciseDraft(id, 0),
    name: `Exercice ${id}`,
    sourceMovementId: `movement-${id}`,
    structuralPosition,
    executionParameters: durationParameters(30, 1),
  };
}

/** Exercice tout juste créé depuis un Mouvement (A.2) : paramètres à compléter. */
function incomplete(id: string, structuralPosition: SessionDraftExercise["structuralPosition"] = "BEFORE_TOUR"): SessionDraftExercise {
  const created = exerciseOfMovement(
    { id: `movement-${id}`, name: `Exercice ${id}`, description: null, media: [], categoryId: "cardio", bodyZoneIds: [], phases: [], nextPhaseId: 1, aliases: [], levelGroup: null },
    id,
    { countdownSeconds: 5, endSeconds: 5, recoverySeconds: 30 },
  );
  return { ...created, structuralPosition };
}

/** Séance sans Circuit (D-451) : trois Exercices au niveau de la Séance, sans structure enregistrée. */
const flatDraft = (): SessionDraft => ({ ...createEmptyDraft(), name: "Séance", exercises: ["a", "b", "c"].map((id) => exercise(id)) });

async function envelopeAround(container: "CIRCUIT" | "CYCLE", targetTestID: string) {
  fireEvent.press(screen.getByTestId("composition-add-activity-action"));
  fireEvent.press(screen.getByTestId(container === "CIRCUIT" ? "composition-add-activity-tree-circuit" : "composition-add-activity-tree-cycle"));
  fireEvent.press(screen.getByTestId(`${targetTestID}-target`));
  fireEvent.press(screen.getByTestId("composition-envelope-bar-confirm"));
  await act(async () => undefined);
}

/** Séance enregistrée par le vrai service (SQLite en mémoire), rouverte en modification. */
async function savedAndReopened(draft: SessionDraft): Promise<SessionDraft> {
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const service = new SessionService(new SqliteSessionRepository(database), new SqliteCategoryRepository(database));
  const created = await service.createSession(
    withLocalMovements({ ...draft, exercises: draft.exercises.map(({ sourceMovementId: _source, ...rest }) => rest) }),
  );
  if (!created.ok) throw new Error(JSON.stringify(created.violations));
  const opened = await service.getSessionForEdit(created.value.id);
  if (opened.status !== "OK") throw new Error(opened.status);
  return toSessionDraft(opened.session);
}

const addStop = () => screen.getByTestId("composition-add-stop-action");
const placementStrings = strings.screens.composition.placement;
const enabled = { selected: false, disabled: false };
const cardOf = (id: string) =>
  screen.getByLabelText(new RegExp(`^${strings.screens.composition.occurrenceCard.accessibilityType}, Exercice ${id},`));

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

// [« (ancien modèle) » — remplacé le 10/11/2026 : modèle unique des Circuits, décision de Hermann.]
describe("Recette n° 1 — « Ajouter un arrêt » avec un seul Circuit", () => {
  it("Séance enregistrée avec un Circuit et des Points d'arrêt, rouverte : rendu historique, « Ajouter un arrêt » disponible ; emplacements du Circuit proposés", async () => {
    const draft = await savedAndReopened({
      ...createEmptyDraft(),
      name: "Ancienne",
      tourRepeatCount: 3,
      exercises: [exercise("a"), exercise("b", "IN_TOUR"), exercise("c", "IN_TOUR"), exercise("d", "AFTER_TOUR")],
      stopPoints: [
        { id: "p1", scope: "BEFORE_TOUR", position: 1 },
        { id: "p2", scope: "IN_TOUR", position: 1 },
      ],
    });
    // Modèle unique des Circuits (10/11/2026) : un Circuit unique relève de la disposition générale.
    expect(resolveRichLayout(draft)).not.toBeNull();
    await renderComposition(draft);
    expect(addStop().props.accessibilityState).toEqual(enabled);
    fireEvent.press(addStop());
    await act(async () => undefined);
    expect(screen.getByLabelText(placementStrings.addStopPointAfterCircuitAccessibilityLabel)).toBeTruthy();
    expect(screen.getByLabelText(placementStrings.addStopPointAccessibilityLabel.replace("{exercise}", "Exercice c"))).toBeTruthy();
  });

  it("Séance rouverte dont le Circuit (N = 3) ouvre la Séance, Point en tête : « Ajouter un arrêt » disponible", async () => {
    const draft = await savedAndReopened({
      ...createEmptyDraft(),
      name: "Circuit seul",
      tourRepeatCount: 3,
      exercises: [exercise("b", "IN_TOUR"), exercise("c", "IN_TOUR")],
      stopPoints: [{ id: "p1", scope: "IN_TOUR", position: 0 }],
    });
    // Modèle unique des Circuits (10/11/2026) : un Circuit unique relève de la disposition générale.
    expect(resolveRichLayout(draft)).not.toBeNull();
    await renderComposition(draft);
    expect(addStop().props.accessibilityState).toEqual(enabled);
  });

  it("Circuit posé par « Ajouter un circuit » (B.2) : « Ajouter un arrêt » disponible ; début et fin du Circuit proposés", async () => {
    await renderComposition(flatDraft());
    expect(addStop().props.accessibilityState).toEqual(enabled);
    await envelopeAround("CIRCUIT", "composition-envelope-exercise-b");
    expect(resolveRichLayout(probe.draft!)).not.toBeNull(); // modèle unique des Circuits (10/11/2026)
    expect(addStop().props.accessibilityState).toEqual(enabled);
    fireEvent.press(addStop());
    await act(async () => undefined);
    expect(screen.getByLabelText(placementStrings.addStopPointAtCircuitStartAccessibilityLabel)).toBeTruthy();
    expect(screen.getByLabelText(placementStrings.addStopPointAfterCircuitAccessibilityLabel)).toBeTruthy();
  });

  it("Séance à Point d'arrêt sans Circuit, puis « Ajouter un circuit » : Point conservé, « Ajouter un arrêt » disponible", async () => {
    await renderComposition({ ...flatDraft(), stopPoints: [{ id: "p1", scope: "BEFORE_TOUR", position: 1 }] });
    await envelopeAround("CIRCUIT", "composition-envelope-exercise-b");
    // Modèle unique des Circuits (10/11/2026) : le Point est conservé à sa place dans la structure générale.
    expect(probe.draft!.structure?.stopPoints).toEqual([{ id: "p1", circuitId: null, position: 1 }]);
    expect(addStop().props.accessibilityState).toEqual(enabled);
  });

  // [« limite connue jusqu'à B.6 : deux Circuits (disposition générale) — « Ajouter un arrêt »
  // indisponible » — levée le 31/10/2026 par B.6.]
  it("B.6 : deux Circuits (disposition générale) — « Ajouter un arrêt » disponible", async () => {
    await renderComposition(flatDraft());
    await envelopeAround("CIRCUIT", "composition-envelope-exercise-a");
    await envelopeAround("CIRCUIT", "composition-envelope-exercise-c");
    expect(resolveRichLayout(probe.draft!)).not.toBeNull();
    expect(addStop().props.accessibilityState).toEqual({ selected: false, disabled: false });
  });
});

describe("Demande de Hermann du 29/10/2026 — toucher d'une carte « Paramètres à compléter »", () => {
  it("ancien modèle : carte à compléter → feuille de paramètres, sans l'éditeur ; carte complète → éditeur", async () => {
    await renderComposition({ ...flatDraft(), exercises: [exercise("a"), incomplete("b")] });
    fireEvent.press(cardOf("b"));
    await act(async () => undefined);
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    await act(async () => undefined);
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    // [« carte complète → éditeur » — remplacé par la recette iPhone n° 2 du 31/10/2026 (constat c) :
    // toute carte d'Exercice ouvre la feuille ; la photo ouvre l'éditeur.]
    fireEvent.press(cardOf("a"));
    await act(async () => undefined);
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    await act(async () => undefined);
    fireEvent.press(screen.getByTestId("composition-exercise-media-button-a"));
    await act(async () => undefined);
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/exercise-sheet", params: { exerciseId: "a" } }); // [04/11/2026 : fiche en lecture seule, décision de Hermann — remplace « /exercise ».]
  });

  it("disposition générale (deux Circuits) : même comportement", async () => {
    const structure: SessionStructure<string, StructureStopPointLocation> = {
      elements: [
        { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 2, nature: "TOURS", exercises: ["a"] } },
        { kind: "CIRCUIT", circuit: { id: "c2", repeatCount: 2, nature: "TOURS", exercises: ["b"] } },
      ],
      stopPoints: [],
    };
    await renderComposition({ ...flatDraft(), exercises: [exercise("a", "IN_TOUR"), incomplete("b", "IN_TOUR")], structure });
    expect(resolveRichLayout(probe.draft!)).not.toBeNull();
    fireEvent.press(cardOf("b"));
    await act(async () => undefined);
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    // Feuille ouverte depuis une carte de la disposition générale : elle redescend (CARD_SHEET_MOTION_MS) avant de se fermer
    // (recette iPhone n° 2, constat d) — le test attend la fin de la descente (diagnostic du 08/11/2026 : échec de test, pas d'anomalie).
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, CARD_SHEET_MOTION_MS + 150));
    });
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    // Recette iPhone n° 2 du 31/10/2026 (constat c) : carte complète → feuille ; photo → éditeur.
    fireEvent.press(cardOf("a"));
    await act(async () => undefined);
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, CARD_SHEET_MOTION_MS + 150));
    });
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("composition-exercise-media-button-a"));
    await act(async () => undefined);
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/exercise-sheet", params: { exerciseId: "a" } }); // [04/11/2026 : fiche en lecture seule, décision de Hermann — remplace « /exercise ».]
  });
});

/**
 * Contre-recette iPhone du 30/10 (Hermann : « Appuyer de nouveau sur le bouton d'action point
 * d'arrêt referme l'écran de sélection (même comportement sur confirmer) »).
 */
describe("contre-recette du 30/10 — second appui sur « Ajouter un arrêt »", () => {
  it("in placement the button stays active (selected); pressing it again applies the selection like « Confirmer »", async () => {
    await renderComposition(flatDraft());
    await envelopeAround("CIRCUIT", "composition-envelope-exercise-b");
    const before = probe.draft!.structure?.stopPoints ?? []; // modèle unique des Circuits (10/11/2026)
    fireEvent.press(addStop());
    await act(async () => undefined);
    expect(addStop().props.accessibilityState).toEqual({ selected: true, disabled: false });
    fireEvent.press(screen.getByLabelText(placementStrings.addStopPointAfterCircuitAccessibilityLabel));
    await act(async () => undefined);
    expect(screen.getByTestId("composition-placement-bar-confirm").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(addStop());
    await act(async () => undefined);
    // Sélection refermée, Point posé (comme « Confirmer »).
    expect(screen.queryByTestId("composition-placement-bar")).toBeNull();
    expect(probe.draft!.structure?.stopPoints ?? []).toHaveLength(before.length + 1);
    expect(addStop().props.accessibilityState).toEqual(enabled);
  });

  it("without any applicable change, the second press closes the selection without mutation", async () => {
    await renderComposition(flatDraft());
    await envelopeAround("CIRCUIT", "composition-envelope-exercise-b");
    const before = probe.draft;
    fireEvent.press(addStop());
    await act(async () => undefined);
    expect(screen.getByTestId("composition-placement-bar")).toBeTruthy();
    fireEvent.press(addStop());
    await act(async () => undefined);
    expect(screen.queryByTestId("composition-placement-bar")).toBeNull();
    expect(probe.draft).toBe(before);
  });
});

/**
 * Bouton Guidage sonore de l'en-tête de Composition (documentation de main `ebe72f76`, ch12 « DSF — Actions », ch13 ;
 * demande de Hermann du 11/11/2026, cahier, constat d). [Remplacé le 11/11/2026 — élément Guidage au-dessus du Compte à
 * rebours, retiré avec l'espace qu'il occupait.]
 */
describe("bouton Guidage sonore de l'en-tête de Composition", () => {
  const g = strings.screens.soundGuidance;

  it("dans l'en-tête, libellé « Guidage sonore », symbole fin ; ouvre la modale ; plus d'élément Guidage dans la séquence", async () => {
    await renderComposition(flatDraft());
    expect(screen.queryByTestId("composition-guidance")).toBeNull();
    expect(screen.queryByTestId("composition-guidance-step")).toBeNull();
    const button = screen.getByTestId("composition-guidance-action");
    expect(button.props.accessibilityLabel).toBe(g.buttonLabel);
    expect(screen.getByTestId("composition-guidance-icon-light")).toBeTruthy();
    fireEvent.press(button);
    expect(mockPush).toHaveBeenCalledWith("/session-guidance");
    expect(screen.getByTestId("composition-guidance-icon-fill")).toBeTruthy();
  });

  it("une Séance à réglages propres garde le symbole fin tant que la modale est fermée", async () => {
    await renderComposition({ ...flatDraft(), guidance: { announcements: { session: true, names: true, phases: true, objective: true, pauses: true, sides: false }, events: DEFAULT_GUIDANCE_EVENTS } });
    expect(screen.getByTestId("composition-guidance-icon-light")).toBeTruthy();
    expect(screen.queryByTestId("composition-guidance-icon-fill")).toBeNull();
  });
});
