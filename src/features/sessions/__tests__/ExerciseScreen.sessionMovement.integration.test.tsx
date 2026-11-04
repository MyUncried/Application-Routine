import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import type { CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { durationParameters, uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Category } from "@/domain/categories/Category";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import {
  createEmptyDraft,
  createExerciseDraft,
  draftMovementOf,
  toSessionDraft,
  type SessionDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { tapExecutionSheetStep } from "@/features/activities/testing/executionSheetActions";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { ExerciseScreen } from "@/features/sessions/ExerciseScreen";
import { SessionDraftContext, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { SessionService } from "@/features/sessions/SessionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { createTestMovement } from "@/infrastructure/database/testing/createTestMovement";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-9 (recette iPhone du 29/10, Hermann : « la carte d'exercice qui s'ouvre à partir d'une
 * composition de séance est l'ancien format, il faudrait que ce soit le nouveau ») — un Exercice
 * existant d'une Séance (`/exercise?exerciseId=…`, contrat de la Composition inchangé) s'ouvre au
 * gabarit Mouvement (CE-MVT-01 ; DSF Mouvements l.67-71) : média derrière la zone de contexte,
 * Description, Phases ; Mouvement enregistré en lecture seule, sans crayon (ch13 l.192, l.238,
 * l.268) ; paramètres locaux par leur carte et leur Feuille (CE-UI-10, ch13 l.1053, l.2594).
 * Vrais services, base SQLite réelle (`node:sqlite`). Ne vaut pas recette sur iPhone.
 */

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));
let mockUuid = 0;
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => `uuid-${++mockUuid}`) }));

const mockBack = jest.fn();
let mockSearchParams: Record<string, string> = {};
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ back: mockBack, push: jest.fn() }),
    useLocalSearchParams: () => mockSearchParams,
  };
});
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: () => ({ isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() }),
}));

const NOW = "2026-10-29T09:00:00.000Z";
const CARDIO: Category = {
  id: "cardio",
  name: "Cardio",
  canonicalKey: "cardio",
  color: "#3B82F6",
  isPredefined: true,
  displayOrder: 1,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};
const PHASED = uniformParameters({
  mode: "DURATION",
  count: 3,
  target: 30,
  pauseSeconds: 10,
  workPhases: [
    { id: 1, label: "Descente", durationSeconds: 2 },
    { id: 2, label: "Montée", durationSeconds: 1 },
  ],
});

let database: NodeSqliteDatabase;
let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
const service = () =>
  new ActivityDefinitionService(
    undefined,
    new SqliteBodyZoneRepository(database),
    undefined,
    undefined,
    new SqliteMovementRepository(database, ids("grp"), () => NOW),
  );
const sessionService = () => new SessionService(new SqliteSessionRepository(database, ids("ses"), () => NOW));

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  mockBack.mockReset();
  mockSearchParams = {};
});

afterEach(() => {
  database.close();
});

const input = (parameters: ExecutionParameters): CreateActivityDefinitionInput => ({
  name: "Squat",
  description: "Buste droit\nGenoux dans l'axe",
  category: { kind: "EXISTING", categoryId: "cardio" },
  bodyZoneIds: ["cuisses"],
  executionParameters: parameters,
});

function fakeReferential(): ReferentialService {
  return {
    listBodyZones: jest.fn(async () => new SqliteBodyZoneRepository(database).listAll()),
    listCategories: jest.fn(async () => [CARDIO]),
    isBodyZoneUsed: jest.fn(async () => false),
  } as unknown as ReferentialService;
}

function fakeProfile(): ProfileService {
  return { getProfile: jest.fn(async () => createDefaultProfile("profile-1", NOW)) } as unknown as ProfileService;
}

/** Brouillon de Séance tenu par le test : `updateDraft` fusionne comme le fournisseur réel. */
let currentDraft: SessionDraft;
const updateDraft = jest.fn((update: SessionDraftUpdate) => {
  currentDraft = { ...currentDraft, ...(typeof update === "function" ? update(currentDraft) : update) };
});

async function renderEditor(params: Record<string, string>, draft: SessionDraft = createEmptyDraft()) {
  mockSearchParams = params;
  currentDraft = draft;
  updateDraft.mockClear();
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service()}>
        <ReferentialServiceContext.Provider value={fakeReferential()}>
          <ProfileServiceContext.Provider value={fakeProfile()}>
            <SessionDraftContext.Provider value={{ draft, updateDraft, resetDraft: jest.fn() }}>
              <ExerciseScreen />
            </SessionDraftContext.Provider>
          </ProfileServiceContext.Provider>
        </ReferentialServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  await settle();
}

async function settle(ms = 0) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
  await settle(50);
}

/**
 * Séance enregistrée avec deux occurrences d'un Mouvement enregistré, relue en brouillon. [PRE-9 A.3
 * du 04/11/2026 : Mouvement créé directement, sans ancienne définition du Catalogue.]
 */
async function sessionWithTwoOccurrences(parameters: ExecutionParameters = PHASED) {
  const value = input(parameters);
  const { movementId } = await createTestMovement(database, value, { kind: "INDEPENDENT" }, ids("mov"), () => NOW);
  const occurrence = (id: string): SessionDraftExercise => ({
    ...createExerciseDraft(id, null),
    name: value.name,
    instruction: value.description,
    categoryId: value.category.kind === "EXISTING" ? value.category.categoryId : null,
    bodyZoneIds: [...value.bodyZoneIds],
    executionParameters: value.executionParameters,
    sideMode: value.executionParameters.sideMode,
    sourceMovementId: movementId,
  });
  const created = await sessionService().createSession({
    ...createEmptyDraft(),
    name: "Jambes",
    exercises: [occurrence("occ-1"), occurrence("occ-2")],
  });
  if (!created.ok) throw new Error(JSON.stringify(created.violations));
  return { movementId, draft: toSessionDraft(created.value) };
}

const occurrenceOf = (id: string) => currentDraft.exercises.find((exercise) => exercise.id === id)!;

describe("PRE-9 — Exercice d'une Séance ouvert au gabarit Mouvement (CE-MVT-01)", () => {
  it("Mouvement enregistré : titre « Mouvement », gabarit photo, Description et Phases en lecture seule, carte des paramètres, aucun crayon ni accordéon Médias", async () => {
    const { draft } = await sessionWithTwoOccurrences();
    await renderEditor({ exerciseId: "occ-1" }, draft);

    expect(screen.getByText(strings.screens.movement.titles.consult)).toBeTruthy();
    expect(screen.queryByText(strings.screens.exercise.titleEdit)).toBeNull();
    expect(screen.queryByTestId("activity-editor-edit-movement")).toBeNull();
    expect(screen.getByTestId("movement-photo-template")).toBeTruthy();
    expect(screen.queryByTestId("activity-editor-section-media")).toBeNull();
    expect(screen.getByTestId("activity-editor-description-title").props.children).toBe(strings.screens.movement.descriptionTitle);

    expect(screen.getByTestId("exercise-name-input").props.value).toBe("Squat");
    expect(screen.getByTestId("exercise-name-input").props.editable).toBe(false);
    expect(screen.getByTestId("exercise-instruction-input").props.editable).toBe(false);
    // Contre-recette iPhone du 30/10 (r1-exo) : aucune section « Phases du mouvement » (titre et
    // contenu) — les phases sont dans les paramètres d'exécution.
    expect(screen.queryByTestId("movement-section-phases")).toBeNull();
    expect(screen.queryByText(strings.screens.movement.phases.title)).toBeNull();

    expect(screen.getByTestId("exercise-parameters-card")).toBeTruthy();
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityState).toMatchObject({ disabled: true });

    // Phases lues dans la Feuille, structure verrouillée (Mouvement enregistré, MFN-09).
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    // Hermann, 01/11/2026 : « Lorsque la modale des paramètres s'ouvre, le tableau des phases doit
    // être fermé s'il n'y a aucune valeur à vérifier ou à renseigner. » Durées complètes : replié,
    // déployé par son chevron.
    expect(screen.queryByTestId("execution-sheet-phases-table")).toBeNull();
    fireEvent.press(screen.getByTestId("execution-sheet-phases-control-WITH-chevron"));
    expect(screen.getByTestId("execution-sheet-phase-row-1-label").props.value).toBe("Descente");
    expect(screen.getByTestId("execution-sheet-phase-row-1-label").props.editable).toBe(false);
  });

  it("paramètres locaux modifiables par la Feuille ; Terminer les inscrit dans le brouillon, sans Mouvement inscrit ni autre occurrence touchée", async () => {
    const { draft } = await sessionWithTwoOccurrences();
    await renderEditor({ exerciseId: "occ-1" }, draft);

    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
    // Ouverte depuis une Séance, la Feuille ne présente ni Compte à rebours ni Fin (ch13 l.2594, RM-246).
    expect(screen.queryByLabelText(strings.executionParameters.sheet.showExerciseSignals)).toBeNull();
    tapExecutionSheetStep("execution-sheet-series-increment");
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    expect(screen.queryByTestId("execution-sheet")).toBeNull();

    await press("exercise-finish-action");
    expect(mockBack).toHaveBeenCalled();
    const series = occurrenceOf("occ-1").executionParameters.series;
    expect(series.kind === "UNIFORM" ? series.count : null).toBe(4);
    // Durées de phase de l'occurrence conservées.
    expect(series.workPhases).toEqual(PHASED.series.workPhases);
    expect(occurrenceOf("occ-2")).toEqual(draft.exercises[1]);
    expect(currentDraft.movements).toBeUndefined();
  });

  it("Terminer sans changement : brouillon rendu inchangé à la Composition", async () => {
    const { draft } = await sessionWithTwoOccurrences();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await press("exercise-finish-action");
    expect(mockBack).toHaveBeenCalled();
    expect(currentDraft.exercises).toEqual(draft.exercises);
    expect(currentDraft.movements).toBeUndefined();
  });

  it("Mouvement encore NOUVEAU du brouillon (non enregistré) : contenu modifiable au gabarit ; Terminer le partage avec ses occurrences", async () => {
    const occurrence: SessionDraftExercise = {
      ...createExerciseDraft("occ-local", null),
      name: "Gainage",
      instruction: "Dos plat",
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      executionParameters: uniformParameters({ count: 3, target: 30, pauseSeconds: 10, workPhases: [{ id: 1, label: "Tenir", durationSeconds: 5 }] }),
      sourceMovementId: "mov-local",
    };
    const draft: SessionDraft = {
      ...createEmptyDraft(),
      name: "Gainage",
      exercises: [occurrence],
      movements: { "mov-local": draftMovementOf(occurrence, "NEW") },
    };
    await renderEditor({ exerciseId: "occ-local" }, draft);

    expect(screen.getByText(strings.screens.movement.titles.edit)).toBeTruthy();
    expect(screen.queryByTestId("activity-editor-edit-movement")).toBeNull();
    expect(screen.getByTestId("exercise-name-input").props.editable).not.toBe(false);
    fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "Dos bien plat");
    // Contre-recette du 30/10 (r1-exo) : pas de bloc Phases au gabarit ; libellé renommé dans la
    // Feuille des paramètres (structure modifiable : Mouvement NOUVEAU), durée gardée par identité.
    expect(screen.queryByTestId("movement-section-phases")).toBeNull();
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    // Hermann, 01/11/2026 : durée complète, tableau des phases replié à l'ouverture — chevron d'abord.
    expect(screen.queryByTestId("execution-sheet-phases-table")).toBeNull();
    fireEvent.press(screen.getByTestId("execution-sheet-phases-control-WITH-chevron"));
    const phaseLabel = screen.getByTestId("execution-sheet-phase-row-1-label");
    expect(phaseLabel.props.editable).not.toBe(false);
    fireEvent(phaseLabel, "focus");
    fireEvent.changeText(screen.getByTestId("execution-sheet-phase-row-1-label"), "Gainer");
    fireEvent(screen.getByTestId("execution-sheet-phase-row-1-label"), "blur");
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    await press("exercise-finish-action");

    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(mockBack).toHaveBeenCalled();
    expect(occurrenceOf("occ-local").instruction).toBe("Dos bien plat");
    expect(occurrenceOf("occ-local").executionParameters.series.workPhases).toEqual([{ id: 1, label: "Gainer", durationSeconds: 5 }]);
    expect(currentDraft.movements?.["mov-local"]).toMatchObject({
      change: "NEW",
      description: "Dos bien plat",
      phases: [{ id: 1, label: "Gainer" }],
      nextPhaseId: 2,
    });
  });

  it("Exercice antérieur au modèle Mouvement (sans Mouvement) : ouvert au gabarit avec son nom et ses paramètres, sans erreur", async () => {
    const legacy: SessionDraftExercise = {
      ...createExerciseDraft("occ-legacy", null),
      name: "Corde à sauter",
      instruction: "",
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      executionParameters: durationParameters(60, 1, 0),
    };
    await renderEditor({ exerciseId: "occ-legacy" }, { ...createEmptyDraft(), exercises: [legacy] });

    expect(screen.getByTestId("movement-photo-template")).toBeTruthy();
    expect(screen.getByTestId("exercise-name-input").props.value).toBe("Corde à sauter");
    expect(screen.getByTestId("exercise-parameters-card")).toBeTruthy();
    expect(screen.queryByTestId("activity-editor-edit-movement")).toBeNull();
  });

  it("création sans `exerciseId` : ancien éditeur conservé (hors périmètre, retrait en A.3)", async () => {
    await renderEditor({});
    expect(screen.getByText(strings.screens.exercise.titleAdd)).toBeTruthy();
    expect(screen.queryByTestId("movement-photo-template")).toBeNull();
    expect(screen.getByTestId("exercise-section-parameters")).toBeTruthy();
  });
});
