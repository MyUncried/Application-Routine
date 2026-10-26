import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";

import { activityDefinitionToDraftExercise, type CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { DuplicateMovementNameError } from "@/domain/activities/MovementRepository";
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
import { enterExecutionSheetCell } from "@/features/activities/testing/executionSheetActions";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { ExerciseScreen } from "@/features/sessions/ExerciseScreen";
import { SessionDraftContext, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { SessionService } from "@/features/sessions/SessionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-7 story R-4 (D-445 C03, C04, v7 §3 ; matrice de `spec-r-4-dialogue-sauvegarde-c03-crayon.md`)
 * — dialogue unique de sauvegarde du mouvement sur les VRAIS services et une base SQLite réelle
 * (`node:sqlite`) : Catalogue (nom modifié → choix, casse comprise ; description modifiée avec un
 * frère → confirmation ; Zones seules sans autre exercice → silence), et occurrence de Séance par
 * le crayon (C04) : Mettre à jour (toutes les occurrences du brouillon affichent la correction,
 * Catalogue relu après l'enregistrement de la Séance), sauvegarde silencieuse, Créer un nouveau
 * mouvement (occurrence remplacée à la même place, nom déjà pris refusé à l'enregistrement).
 * Rappel : ces tests ne valent pas recette sur iPhone (JA).
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

const NOW = "2026-10-26T09:00:00.000Z";
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
const editor = strings.screens.activities.editor;
const movementSave = editor.movementSave;

let database: NodeSqliteDatabase;
let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
const service = () =>
  new ActivityDefinitionService(
    new SqliteActivityDefinitionRepository(database, ids("def"), () => NOW),
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

const input = (parameters: ExecutionParameters, overrides: Partial<CreateActivityDefinitionInput> = {}): CreateActivityDefinitionInput => ({
  name: "Squat",
  description: "Buste droit",
  category: { kind: "EXISTING", categoryId: "cardio" },
  bodyZoneIds: ["cuisses"],
  executionParameters: parameters,
  ...overrides,
});

async function createDefinition(overrides: Partial<CreateActivityDefinitionInput> = {}, movementId?: string) {
  const result = await service().createActivityDefinitionWithOrigin(
    input(durationParameters(30, 3, 10), overrides),
    movementId === undefined ? { kind: "INDEPENDENT" } : { kind: "SAME_MOVEMENT", movementId },
  );
  if (result.status !== "CREATED") throw new Error(result.status);
  return result.value;
}

function fakeReferential(): ReferentialService {
  return {
    // Sélecteur de Zones : référentiel réel de la base (zones amorcées par les migrations).
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

const nameInput = () => screen.getByTestId("exercise-name-input");

describe("PRE-7 R-4 — Catalogue : décision C03", () => {
  it("nom modifié (casse seule), mouvement seul : choix, « Aucun autre exercice… », aucune présélection, Confirmer indisponible ; Annuler n'écrit rien", async () => {
    const only = await createDefinition();
    const before = await database.getAllAsync("SELECT * FROM movements ORDER BY id");
    await renderEditor({ catalogueDefinitionId: only.id });
    fireEvent.changeText(nameInput(), "squat");
    await press("activity-editor-finish-action");

    const dialog = screen.getByTestId("movement-save-dialog");
    expect(within(dialog).getByText(movementSave.choiceTitle)).toBeTruthy();
    expect(within(dialog).getByText(movementSave.noOther)).toBeTruthy();
    for (const choice of ["UPDATE", "NEW_MOVEMENT"]) {
      expect(screen.getByTestId(`movement-save-choice-${choice}`).props.accessibilityState).toMatchObject({ checked: false });
    }
    expect(screen.getByTestId("movement-save-confirm").props.accessibilityState).toMatchObject({ disabled: true });
    await press("movement-save-cancel");
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(nameInput().props.value).toBe("squat");
    expect(mockBack).not.toHaveBeenCalled();
    expect(await database.getAllAsync("SELECT * FROM movements ORDER BY id")).toEqual(before);
  });

  it("description modifiée, nom inchangé, un frère : « Vous avez modifié ce mouvement » ; Confirmer → le frère relit la description", async () => {
    const first = await createDefinition();
    const second = await createDefinition({}, first.movementId);
    await renderEditor({ catalogueDefinitionId: first.id });
    fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "Dos droit");
    await press("activity-editor-finish-action");

    const dialog = screen.getByTestId("movement-save-dialog");
    expect(within(dialog).getByText(movementSave.confirmTitle)).toBeTruthy();
    expect(within(dialog).getByText(`1 autre exercice utilise ce mouvement. ${movementSave.appliesToAll}`)).toBeTruthy();
    expect(screen.queryByTestId("movement-save-choice-UPDATE")).toBeNull();
    expect(screen.getByTestId("movement-save-confirm").props.accessibilityState).toMatchObject({ disabled: false });
    await press("movement-save-confirm");
    expect(mockBack).toHaveBeenCalled();
    expect((await service().getActivityDefinition(second.id))?.description).toBe("Dos droit");
  });

  it("Zones modifiées seules, aucun autre exercice : sauvegarde silencieuse", async () => {
    const only = await createDefinition();
    await renderEditor({ catalogueDefinitionId: only.id });
    fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
    fireEvent.press(await screen.findByTestId("body-zone-selector-tag-dos"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
    });
    await settle();
    await press("activity-editor-finish-action");
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(mockBack).toHaveBeenCalled();
    expect(new Set((await service().getActivityDefinition(only.id))?.bodyZoneIds)).toEqual(new Set(["cuisses", "dos"]));
  });
});

/** Séance enregistrée avec deux occurrences du Mouvement d'un Exercice du Catalogue, relue en brouillon. */
async function sessionWithTwoOccurrences() {
  const definition = await createDefinition();
  const created = await sessionService().createSession({
    ...createEmptyDraft(),
    name: "Jambes",
    exercises: [
      activityDefinitionToDraftExercise(definition, "occ-1", null),
      activityDefinitionToDraftExercise(definition, "occ-2", null),
    ],
  });
  if (!created.ok) throw new Error(JSON.stringify(created.violations));
  return { definition, session: created.value, draft: toSessionDraft(created.value) };
}

async function saveCurrentDraft(sessionId: string) {
  return sessionService().updateSession(sessionId, currentDraft);
}

const occurrenceOf = (id: string) => currentDraft.exercises.find((exercise) => exercise.id === id)!;

describe("PRE-7 R-4 — occurrence de Séance, crayon (C04)", () => {
  it("crayon + description modifiée, autres exercices (Catalogue + autre occurrence) : confirmation ; les deux occurrences affichent la correction ; le Catalogue la relit après l'enregistrement", async () => {
    const { definition, session, draft } = await sessionWithTwoOccurrences();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    expect(screen.getByTestId("exercise-instruction-input").props.editable).toBe(false);
    await press("activity-editor-edit-movement");
    expect(screen.queryByTestId("activity-editor-edit-movement")).toBeNull();
    expect(screen.getByTestId("exercise-instruction-input").props.editable).not.toBe(false);
    fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "Dos droit");
    await press("exercise-finish-action");

    const dialog = screen.getByTestId("movement-save-dialog");
    expect(within(dialog).getByText(`2 autres exercices utilisent ce mouvement. ${movementSave.appliesToAll}`)).toBeTruthy();
    expect(updateDraft).not.toHaveBeenCalled();
    await press("movement-save-confirm");

    expect(mockBack).toHaveBeenCalled();
    expect(occurrenceOf("occ-1").instruction).toBe("Dos droit");
    expect(occurrenceOf("occ-2").instruction).toBe("Dos droit");
    expect(currentDraft.movements?.[definition.movementId]).toMatchObject({ change: "EDITED", description: "Dos droit" });
    expect(await saveCurrentDraft(session.id)).toMatchObject({ status: "UPDATED" });
    expect((await service().getActivityDefinition(definition.id))?.description).toBe("Dos droit");
  });

  it("crayon + Annuler du dialogue : brouillon intact, rien d'inscrit ; l'éditeur reste ouvert", async () => {
    const { draft } = await sessionWithTwoOccurrences();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await press("activity-editor-edit-movement");
    fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "Dos droit");
    await press("exercise-finish-action");
    await press("movement-save-cancel");
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(updateDraft).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.getByTestId("exercise-instruction-input").props.value).toBe("Dos droit");
  });

  it("crayon + nom modifié, Mettre à jour ce mouvement : les deux occurrences prennent le nom ; le Catalogue le relit", async () => {
    const { definition, session, draft } = await sessionWithTwoOccurrences();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await press("activity-editor-edit-movement");
    fireEvent.changeText(nameInput(), "Squat sumo");
    await press("exercise-finish-action");
    expect(within(screen.getByTestId("movement-save-dialog")).getByText("2 autres exercices utilisent ce mouvement.")).toBeTruthy();
    fireEvent.press(screen.getByTestId("movement-save-choice-UPDATE"));
    await press("movement-save-confirm");
    expect(occurrenceOf("occ-1").name).toBe("Squat sumo");
    expect(occurrenceOf("occ-2").name).toBe("Squat sumo");
    expect(await saveCurrentDraft(session.id)).toMatchObject({ status: "UPDATED" });
    expect((await service().getActivityDefinition(definition.id))?.name).toBe("Squat sumo");
  });

  it("crayon + nom modifié, Créer un nouveau mouvement : occurrence remplacée à la même place (nouvel identifiant, nouveau Mouvement) ; l'autre garde l'ancien ; Catalogue intact", async () => {
    const { definition, session, draft } = await sessionWithTwoOccurrences();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await press("activity-editor-edit-movement");
    fireEvent.changeText(nameInput(), "Squat sumo");
    await press("exercise-finish-action");
    fireEvent.press(screen.getByTestId("movement-save-choice-NEW_MOVEMENT"));
    await press("movement-save-confirm");

    expect(currentDraft.exercises.map((exercise) => exercise.id)).not.toContain("occ-1");
    const [replaced, other] = currentDraft.exercises;
    expect(other!.id).toBe("occ-2");
    expect(other).toMatchObject({ name: "Squat", sourceMovementId: definition.movementId });
    expect(replaced!.name).toBe("Squat sumo");
    expect(replaced!.sourceMovementId).not.toBe(definition.movementId);
    expect(replaced!.copyNumber).toBeNull();
    expect(replaced!.executionParameters.series).toEqual(occurrenceOf("occ-2").executionParameters.series);
    expect(currentDraft.movements?.[replaced!.sourceMovementId!]).toMatchObject({ change: "NEW", name: "Squat sumo", aliases: [] });

    expect(await saveCurrentDraft(session.id)).toMatchObject({ status: "UPDATED" });
    expect((await service().getActivityDefinition(definition.id))?.name).toBe("Squat");
    const reread = await sessionService().getSession(session.id);
    const activities = [...(reread?.cycle.beforeTour ?? []), ...(reread?.cycle.tour.exercises ?? []), ...(reread?.cycle.afterTour ?? [])];
    expect(activities.map((activity) => activity.name)).toEqual(["Squat sumo", "Squat"]);
    expect((await service().getMovement(replaced!.sourceMovementId!))?.levelGroup).toBeNull();
  });

  it("nom déjà pris : signalé pendant la saisie, Terminer indisponible (R-5, C01, report R-4)", async () => {
    await createDefinition({ name: "Fentes" });
    const { draft } = await sessionWithTwoOccurrences();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await press("activity-editor-edit-movement");
    fireEvent.changeText(nameInput(), "fentes ");
    await settle(20);
    expect(screen.getByTestId("movement-suggestion-message").props.children).toBe(
      strings.screens.activities.editor.movementSuggestion.nameTakenEdit,
    );
    expect(screen.getByTestId("exercise-finish-action").props.accessibilityState).toMatchObject({ disabled: true });
    // Le mouvement édité est exclu de sa propre collision : son nom (casse seule changée) est libre.
    fireEvent.changeText(nameInput(), "SQUAT");
    await settle(20);
    expect(screen.queryByTestId("movement-suggestion-message")).toBeNull();
  });

  it("casse seule + « Créer un nouveau mouvement » : refusé avec le message, rien n'est inscrit (R-5, C01, v7 l.67)", async () => {
    const { session, draft } = await sessionWithTwoOccurrences();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await press("activity-editor-edit-movement");
    fireEvent.changeText(nameInput(), "SQUAT");
    await press("exercise-finish-action");
    fireEvent.press(screen.getByTestId("movement-save-choice-NEW_MOVEMENT"));
    await press("movement-save-confirm");
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(screen.getByTestId("movement-suggestion-message").props.children).toBe(
      strings.screens.activities.editor.movementSuggestion.nameTakenEdit,
    );
    expect(mockBack).not.toHaveBeenCalled();
    expect(currentDraft).toEqual(draft);
    // Garantie du repository conservée (écriture concurrente) : une Séance portant un doublon est refusée.
    const occurrence = { ...draft.exercises[0]!, id: "occ-dup", sourceMovementId: "mov-dup", copyNumber: null };
    currentDraft = {
      ...draft,
      exercises: [...draft.exercises, occurrence],
      movements: { "mov-dup": draftMovementOf({ ...occurrence, name: "squat" }, "NEW") },
    };
    await expect(saveCurrentDraft(session.id)).rejects.toBeInstanceOf(DuplicateMovementNameError);
  });

  it("Mouvement sans autre exercice (créé dans la Séance, seule occurrence) : description modifiée → sauvegarde silencieuse", async () => {
    const occurrence: SessionDraftExercise = {
      ...createExerciseDraft("occ-local", null),
      name: "Gainage",
      instruction: "Dos plat",
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      executionParameters: durationParameters(30, 3, 10),
      sourceMovementId: "mov-local",
    };
    const created = await sessionService().createSession({
      ...createEmptyDraft(),
      name: "Gainage",
      exercises: [occurrence],
      movements: { "mov-local": draftMovementOf(occurrence, "NEW") },
    });
    if (!created.ok) throw new Error(JSON.stringify(created.violations));
    await renderEditor({ exerciseId: "occ-local" }, toSessionDraft(created.value));
    await press("activity-editor-edit-movement");
    fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "Dos bien plat");
    await press("exercise-finish-action");
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(mockBack).toHaveBeenCalled();
    expect(occurrenceOf("occ-local").instruction).toBe("Dos bien plat");
    expect(await saveCurrentDraft(created.value.id)).toMatchObject({ status: "UPDATED" });
    expect((await service().getMovement("mov-local"))?.description).toBe("Dos bien plat");
  });

  it("crayon puis paramètres seuls : aucun dialogue, aucun Mouvement inscrit", async () => {
    const { draft } = await sessionWithTwoOccurrences();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await press("activity-editor-edit-movement");
    await press("exercise-finish-action");
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(mockBack).toHaveBeenCalled();
    expect(currentDraft.movements).toBeUndefined();
  });

  it("crayon sur une autre occurrence d'un Mouvement déjà EDITED dans le brouillon : contenu courant = l'entrée EDITED ; paramètres seuls → aucun dialogue, entrée inchangée (compteur compris)", async () => {
    const { definition, draft } = await sessionWithTwoOccurrences();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await press("activity-editor-edit-movement");
    fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "Dos droit");
    await press("exercise-finish-action");
    await press("movement-save-confirm");
    const edited = currentDraft.movements?.[definition.movementId];
    expect(edited).toMatchObject({ change: "EDITED", description: "Dos droit" });

    screen.unmount();
    mockBack.mockReset();
    await renderEditor({ exerciseId: "occ-2" }, currentDraft);
    expect(screen.getByTestId("exercise-instruction-input").props.value).toBe("Dos droit");
    await press("activity-editor-edit-movement");
    await press("exercise-finish-action");
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(mockBack).toHaveBeenCalled();
    expect(currentDraft.movements?.[definition.movementId]).toEqual(edited);
    expect(currentDraft.movements?.[definition.movementId]?.nextPhaseId).toBe(edited!.nextPhaseId);
  });

  it("crayon : la Feuille reçoit le compteur de phase du Mouvement (MFN/AC30) — une phase ajoutée prend l'identité du compteur, jamais max + 1", async () => {
    await new SqliteMovementRepository(database, ids("grp"), () => NOW).create({
      id: "mov-ph",
      name: "Pompe",
      description: null,
      media: [],
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      phases: [
        { id: 1, label: "Phase 1" },
        { id: 2, label: "Phase 2" },
      ],
      nextPhaseId: 6,
      aliases: [],
      levelGroup: null,
    });
    const phased = (id: string): SessionDraftExercise => ({
      ...createExerciseDraft(id, null),
      name: "Pompe",
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      executionParameters: uniformParameters({
        mode: "DURATION",
        count: 3,
        target: 9,
        pauseSeconds: 10,
        sideMode: "UNILATERAL",
        workPhases: [
          { id: 1, label: "Phase 1", durationSeconds: 6 },
          { id: 2, label: "Phase 2", durationSeconds: 3 },
        ],
      }),
      sideMode: "UNILATERAL",
      sourceMovementId: "mov-ph",
    });
    const created = await sessionService().createSession({ ...createEmptyDraft(), name: "Haut", exercises: [phased("occ-p1"), phased("occ-p2")] });
    if (!created.ok) throw new Error(JSON.stringify(created.violations));
    await renderEditor({ exerciseId: "occ-p1" }, toSessionDraft(created.value));
    await press("activity-editor-edit-movement");
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    fireEvent.press(screen.getByTestId("execution-sheet-phase-count-toggle"));
    fireEvent(screen.getByTestId("execution-sheet-phase-count-increment"), "pressIn");
    fireEvent(screen.getByTestId("execution-sheet-phase-count-increment"), "pressOut");
    enterExecutionSheetCell("execution-sheet-phase-row-3-duration", "2");
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    await press("exercise-finish-action");
    expect(within(screen.getByTestId("movement-save-dialog")).getByText(movementSave.confirmTitle)).toBeTruthy();
    await press("movement-save-confirm");
    const movement = currentDraft.movements?.["mov-ph"];
    expect(movement?.phases.map((phase) => phase.id)).toEqual([1, 2, 6]);
    expect(movement?.nextPhaseId).toBe(7);
    expect(occurrenceOf("occ-p1").executionParameters.series.workPhases.map((phase) => phase.id)).toEqual([1, 2, 6]);
  });
});
