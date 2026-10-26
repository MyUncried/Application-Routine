import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { Modal, Platform } from "react-native";

import type { CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import type { ExecutionParameters, WorkPhase } from "@/domain/activities/ExecutionParameters";
import type { Movement } from "@/domain/activities/Movement";
import { uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Category } from "@/domain/categories/Category";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { MediaAsset } from "@/domain/media/MediaAsset";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import {
  chooseExecutionMode,
  chooseExecutionSide,
  enterExecutionSheetCell,
  pressInExecutionSheet,
} from "@/features/activities/testing/executionSheetActions";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { ExerciseScreen } from "@/features/sessions/ExerciseScreen";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-7 story A2.3 (MFN-04, MFN-05, MFN-06, MFN-09, D-439 ; matrice de la spec
 * `spec-a2-3-recherche-suggestions-gestes.md`) — suggestion d'un geste proche et recherche
 * explicite à la création, sur les VRAIS services et une base SQLite réelle (schéma 012) : trois
 * choix explicites, aucun rattachement automatique, reprise du geste réellement choisi (gestes
 * locaux compris), création depuis le Catalogue et depuis une Séance, rien d'écrit avant
 * `Terminer` / « Continuer ». Rappel : ces tests ne valent pas recette sur iPhone (JA).
 */

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-id") }));

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

const NOW = "2026-10-24T11:00:00.000Z";
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
const PHOTO: MediaAsset = {
  id: "p1",
  uri: "kodjo-media/p1.jpg",
  createdAt: NOW,
  kind: "PHOTO",
  mimeType: "image/jpeg",
  fileName: null,
  sizeBytes: 10,
  durationMs: null,
  width: 1,
  height: 1,
};
const suggestionText = editor.movementSuggestion;

let database: NodeSqliteDatabase;
let sequence = 0;
let updateDraft: jest.Mock;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
const movements = () => new SqliteMovementRepository(database, ids("grp"), () => NOW);
const service = () =>
  new ActivityDefinitionService(
    new SqliteActivityDefinitionRepository(database, ids("def"), () => NOW),
    undefined,
    new SqliteBodyZoneRepository(database),
    undefined,
    undefined,
    movements(),
  );

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  mockBack.mockReset();
  mockSearchParams = {};
  updateDraft = jest.fn();
});

afterEach(() => {
  database.close();
});

const phases = (...durations: number[]): WorkPhase[] =>
  durations.map((durationSeconds, index) => ({ id: index + 1, label: `Phase ${index + 1}`, durationSeconds }));

const phased = (workPhases: readonly WorkPhase[]): ExecutionParameters =>
  uniformParameters({
    mode: "DURATION",
    count: 3,
    target: workPhases.reduce((sum, phase) => sum + phase.durationSeconds, 0),
    pauseSeconds: 10,
    sideMode: "UNILATERAL",
    workPhases: [...workPhases],
  });

const input = (overrides: Partial<CreateActivityDefinitionInput> = {}): CreateActivityDefinitionInput => ({
  name: "Squats",
  description: "Buste droit",
  category: { kind: "EXISTING", categoryId: "cardio" },
  bodyZoneIds: ["cuisses"],
  executionParameters: phased(phases(6, 3)),
  ...overrides,
});

/** Exercice « Squats » du Catalogue, geste à deux phases. */
async function catalogueSquats() {
  const result = await service().createActivityDefinitionWithOrigin(input(), { kind: "INDEPENDENT" });
  if (result.status !== "CREATED") throw new Error(result.status);
  return result.value;
}

/** Geste LOCAL : créé dans une Séance, sans aucun Exercice au Catalogue (MFN-04). */
async function localGesture(): Promise<Movement> {
  return movements().create({
    id: "genou",
    name: "Mobilisation du genou",
    description: "Genou souple",
    media: [],
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
    phases: [
      { id: 1, label: "Flexion" },
      { id: 2, label: "Extension" },
    ],
    nextPhaseId: 3,
    used: true,
    levelGroup: null,
  });
}

const definitionsRows = () => database.getAllAsync("SELECT * FROM activity_definitions ORDER BY id");
const movementsRows = () => database.getAllAsync("SELECT * FROM movements ORDER BY id");

function fakeReferential(): ReferentialService {
  return {
    listBodyZones: jest.fn(async () => []),
    listCategories: jest.fn(async () => [CARDIO]),
    isBodyZoneUsed: jest.fn(async () => false),
  } as unknown as ReferentialService;
}

function fakeProfile(): ProfileService {
  // Compte à rebours du Profil distinct du défaut : sa recopie au brouillon rechargé est observable.
  return {
    getProfile: jest.fn(async () => ({ ...createDefaultProfile("profile-1", NOW), exerciseCountdownSecondsDefault: 7 })),
  } as unknown as ProfileService;
}

async function renderEditor(params: Record<string, string>, exercises: readonly SessionDraftExercise[] = []) {
  mockSearchParams = params;
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service()}>
        <ReferentialServiceContext.Provider value={fakeReferential()}>
          <ProfileServiceContext.Provider value={fakeProfile()}>
            <SessionDraftContext.Provider
              value={{
                draft: { name: "Séance", labelId: null, initialCountdownSeconds: 10, finalPhaseSeconds: 5, exercises },
                updateDraft,
                resetDraft: jest.fn(),
              }}
            >
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

const nameInput = () => screen.getByTestId("exercise-name-input");

/** Saisie du nom puis fin de saisie (clavier fermé). */
async function typeName(name: string) {
  fireEvent.changeText(nameInput(), name);
  fireEvent(nameInput(), "endEditing", { nativeEvent: { text: name } });
  await settle(20);
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
  await settle(20);
}

/** iOS (`jest-expo`) : fin de la fermeture animée de la feuille (`onDismiss` du `Modal`). */
async function dismissSuggestionSheet() {
  const sheetModal = screen.UNSAFE_getAllByType(Modal).find((modal) => modal.props.animationType === "fade" && modal.props.visible === false);
  await act(async () => {
    sheetModal?.props.onDismiss?.();
  });
  await settle(20);
}

async function finish(testID = "activity-editor-finish-action") {
  await press(testID);
  await settle(50);
}

/** Durées des deux phases du geste repris, côté Sans (aucune valeur inventée par l'écran). */
function fillPhaseDurations() {
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  enterExecutionSheetCell("execution-sheet-phase-row-1-duration", "7");
  enterExecutionSheetCell("execution-sheet-phase-row-2-duration", "2");
  // PRE-7 (D-446) : la durée de série, à renseigner, n'est plus la somme des phases — 9 s saisies.
  fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
  fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 0 } });
  fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 9 } });
  pressInExecutionSheet(screen.getByTestId("duration-wheel-validate"));
  chooseExecutionSide("Sans");
  fireEvent.press(screen.getByTestId("execution-sheet-validate"));
  expect(screen.queryByTestId("execution-sheet")).toBeNull();
}

/** Paramètres d'un geste neuf : Durée 45 s. */
function fillDurationParameters() {
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  chooseExecutionMode("Durée");
  fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
  fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 0 } });
  fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 45 } });
  pressInExecutionSheet(screen.getByTestId("duration-wheel-validate"));
  fireEvent.press(screen.getByTestId("execution-sheet-validate"));
  expect(screen.queryByTestId("execution-sheet")).toBeNull();
}

describe("PRE-7 A2.3 — suggestion d'un geste proche (Catalogue)", () => {
  it("nom proche : feuille à trois choix, carte du geste RÉELLEMENT proposé, rien de présélectionné ni d'écrit", async () => {
    await catalogueSquats();
    const definitionsBefore = await definitionsRows();
    const movementsBefore = await movementsRows();
    await renderEditor({ catalogueDefinitionId: "new" });
    expect(screen.queryByTestId("movement-suggestion-sheet")).toBeNull();
    await typeName("Squats assistés");

    const sheet = screen.getByTestId("movement-suggestion-sheet");
    expect(within(sheet).getByText(suggestionText.title)).toBeTruthy();
    expect(within(sheet).getByText("Squats est déjà dans votre catalogue. Voulez-vous le réutiliser ?")).toBeTruthy();
    expect(screen.getByTestId("movement-suggestion-card-name").props.children).toBe("Squats");
    expect(screen.getByTestId("movement-suggestion-card-subtitle").props.children).toBe("1 exercice");
    expect(within(sheet).getByText("Reprend la description et le média de Squats")).toBeTruthy();
    expect(within(sheet).getByText(suggestionText.variantDetail)).toBeTruthy();
    expect(within(sheet).getByText("Aucun lien avec Squats")).toBeTruthy();
    for (const id of ["movement-suggestion-same", "movement-suggestion-variant", "movement-suggestion-independent"]) {
      expect(screen.getByTestId(id).props.accessibilityState?.selected).not.toBe(true);
    }
    expect(nameInput().props.value).toBe("Squats assistés");
    expect(await definitionsRows()).toEqual(definitionsBefore);
    expect(await movementsRows()).toEqual(movementsBefore);
  });

  it("aucun nom proche : aucune feuille ; saisie détaillée commencée : ni feuille ni lien", async () => {
    await catalogueSquats();
    await renderEditor({ catalogueDefinitionId: "new" });
    expect(screen.getByTestId("activity-editor-movement-search")).toBeTruthy();
    await typeName("Gainage");
    expect(screen.queryByTestId("movement-suggestion-sheet")).toBeNull();
    fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "Dos plat");
    await settle();
    expect(screen.queryByTestId("activity-editor-movement-search")).toBeNull();
    await typeName("Squats");
    expect(screen.queryByTestId("movement-suggestion-sheet")).toBeNull();
  });

  it("Même geste : reprise du geste choisi (lecture seule + crayon, structure reprise) ; Terminer → même geste, sans question", async () => {
    const squats = await catalogueSquats();
    await renderEditor({ catalogueDefinitionId: "new" });
    await typeName("Squats assistés");
    await press("movement-suggestion-same");
    await settle(50);

    expect(screen.queryByTestId("movement-suggestion-sheet")).toBeNull();
    expect(nameInput().props.value).toBe("Squats");
    expect(nameInput().props.editable).toBe(false);
    expect(screen.getByTestId("activity-editor-edit-movement")).toBeTruthy();
    expect(screen.queryByTestId("activity-editor-movement-search")).toBeNull();
    fillPhaseDurations();
    await finish();
    expect(screen.queryByTestId("identity-decision-sheet")).toBeNull();
    expect(mockBack).toHaveBeenCalled();
    const all = await service().listActivityDefinitions();
    expect(all).toHaveLength(2);
    expect(new Set(all.map((definition) => definition.movementId))).toEqual(new Set([squats.movementId]));
    expect(await movementsRows()).toHaveLength(1);
    // Revue : Compte à rebours du Profil recopié au brouillon RECHARGÉ du geste repris.
    const reprise = all.find((definition) => definition.id !== squats.id)!;
    expect(reprise.executionParameters.countdownSeconds).toBe(7);
  });

  it("Variante : nom saisi conservé, contenu vide repris de l'origine ; Terminer → nouveau geste, sans question ni rattachement ; original intact", async () => {
    const squats = await catalogueSquats();
    const originBefore = await database.getAllAsync("SELECT * FROM movements WHERE id = ?", [squats.movementId]);
    await renderEditor({ catalogueDefinitionId: "new" });
    await typeName("Squats assistés");
    await press("movement-suggestion-variant");

    expect(nameInput().props.value).toBe("Squats assistés");
    expect(nameInput().props.editable).not.toBe(false);
    expect(screen.queryByTestId("activity-editor-edit-movement")).toBeNull();
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityLabel).toContain("Cardio");
    expect(screen.getByTestId("exercise-body-zones-open").props.accessibilityState?.disabled).not.toBe(true);
    expect(screen.queryByTestId("activity-editor-movement-search")).toBeNull();
    fillDurationParameters();
    await finish();

    expect(screen.queryByTestId("identity-decision-sheet")).toBeNull();
    expect(mockBack).toHaveBeenCalled();
    const all = await service().listActivityDefinitions();
    expect(all).toHaveLength(2);
    const variant = all.find((definition) => definition.id !== squats.id)!;
    expect(variant.movementId).not.toBe(squats.movementId);
    expect(variant).toMatchObject({ name: "Squats assistés", description: "Buste droit", categoryId: "cardio", bodyZoneIds: ["cuisses"] });
    const variantMovement = await movements().findById(variant.movementId);
    expect(variantMovement?.levelGroup).toBeNull();
    expect(await database.getAllAsync("SELECT * FROM movements WHERE id = ?", [squats.movementId])).toEqual(originBefore);
  });

  it("Geste indépendant : feuille fermée, création inchangée ; le même geste n'est plus reproposé", async () => {
    await catalogueSquats();
    await renderEditor({ catalogueDefinitionId: "new" });
    await typeName("Squats assistés");
    await press("movement-suggestion-independent");
    await dismissSuggestionSheet();
    expect(screen.queryByTestId("movement-suggestion-sheet")).toBeNull();
    expect(nameInput().props.value).toBe("Squats assistés");
    expect(nameInput().props.editable).not.toBe(false);
    expect(screen.getByTestId("activity-editor-movement-search")).toBeTruthy();
    await typeName("Squats");
    expect(screen.queryByTestId("movement-suggestion-sheet")).toBeNull();
  });
});

describe("PRE-7 A2.3 — recherche explicite (Catalogue)", () => {
  it("geste LOCAL recherché et repris : la définition référence ce geste, aucune autre création (MFN/AC19, relevé recette 4)", async () => {
    await catalogueSquats();
    const local = await localGesture();
    await renderEditor({ catalogueDefinitionId: "new" });
    await press("activity-editor-movement-search");

    expect(screen.getByText(editor.movementSearch.title)).toBeTruthy();
    expect(screen.getByText(editor.movementSearch.localNote)).toBeTruthy();
    expect(screen.getByTestId("movement-search-result-genou")).toBeTruthy();
    expect(screen.getByTestId(`movement-search-result-${(await service().listActivityDefinitions())[0]!.movementId}`)).toBeTruthy();
    // Gestes locaux : aucun « 0 exercice » ni mention d'origine inventée.
    expect(screen.queryByTestId("movement-search-result-genou-subtitle")).toBeNull();
    fireEvent.changeText(screen.getByTestId("movement-search-input"), "genou");
    await settle(20);
    expect(screen.queryAllByTestId(/^movement-search-result-[^-]+$/).map((node) => node.props.testID)).toEqual([
      "movement-search-result-genou",
    ]);
    await press("movement-search-result-genou");
    await settle(50);

    expect(screen.queryByTestId("movement-search-input")).toBeNull();
    expect(nameInput().props.value).toBe(local.name);
    expect(nameInput().props.editable).toBe(false);
    fillPhaseDurations();
    await finish();
    expect(mockBack).toHaveBeenCalled();
    const created = (await service().listActivityDefinitions()).filter((definition) => definition.movementId === "genou");
    expect(created).toHaveLength(1);
    expect(await service().listActivityDefinitions()).toHaveLength(2);
    expect(await movementsRows()).toHaveLength(2);
  });

  it("✕ de la recherche : retour au brouillon intact, rien d'écrit ; « Rechercher un autre geste » ouvre la recherche après la feuille", async () => {
    await catalogueSquats();
    const movementsBefore = await movementsRows();
    await renderEditor({ catalogueDefinitionId: "new" });
    await typeName("Squats assistés");
    await press("movement-suggestion-search");
    await dismissSuggestionSheet();
    expect(screen.getByTestId("movement-search-input")).toBeTruthy();
    // ✕ de l'écran de recherche, rendu après l'en-tête de l'éditeur.
    fireEvent.press(screen.getAllByLabelText(editor.movementSearch.closeAccessibilityLabel).at(-1)!);
    await settle(20);
    expect(screen.queryByTestId("movement-search-input")).toBeNull();
    expect(nameInput().props.value).toBe("Squats assistés");
    expect(nameInput().props.editable).not.toBe(false);
    expect(mockBack).not.toHaveBeenCalled();
    expect(await movementsRows()).toEqual(movementsBefore);
    expect(await definitionsRows()).toHaveLength(1);
  });

  it("modification d'un Exercice existant ou reprise par la route : ni lien ni suggestion", async () => {
    const squats = await catalogueSquats();
    await renderEditor({ catalogueDefinitionId: squats.id });
    expect(screen.queryByTestId("activity-editor-movement-search")).toBeNull();
    await typeName("Squats");
    expect(screen.queryByTestId("movement-suggestion-sheet")).toBeNull();
  });
});

describe("PRE-7 A2.3 — création depuis une Séance (locale)", () => {
  it("Même geste : l'occurrence porte la filiation du geste choisi, contenu verrouillé sans crayon ; rien n'est écrit en base", async () => {
    const squats = await catalogueSquats();
    const definitionsBefore = await definitionsRows();
    const movementsBefore = await movementsRows();
    await renderEditor({});
    await typeName("Squats lents");
    expect(screen.getByTestId("movement-suggestion-sheet")).toBeTruthy();
    await press("movement-suggestion-same");

    expect(nameInput().props.value).toBe("Squats");
    expect(nameInput().props.editable).toBe(false);
    expect(screen.queryByTestId("activity-editor-edit-movement")).toBeNull();
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    expect(screen.getByTestId("execution-sheet-phase-count-toggle").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    fillPhaseDurations();
    await finish("exercise-finish-action");

    expect(updateDraft).toHaveBeenCalledTimes(1);
    const patch = updateDraft.mock.calls[0]![0] as { exercises: readonly SessionDraftExercise[] };
    expect(patch.exercises).toHaveLength(1);
    expect(patch.exercises[0]).toMatchObject({
      name: "Squats",
      sourceMovementId: squats.movementId,
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      instruction: "Buste droit",
    });
    expect(patch.exercises[0]!.pendingLocalMovement).toBeUndefined();
    expect(await definitionsRows()).toEqual(definitionsBefore);
    expect(await movementsRows()).toEqual(movementsBefore);
  });

  it("Variante : création locale (aucune filiation), contenu vide repris de l'origine, modifiable ; aucune définition publiée", async () => {
    await catalogueSquats();
    const definitionsBefore = await definitionsRows();
    await renderEditor({});
    await typeName("Squats sumo");
    await press("movement-suggestion-variant");
    expect(nameInput().props.value).toBe("Squats sumo");
    expect(nameInput().props.editable).not.toBe(false);
    fillDurationParameters();
    await finish("exercise-finish-action");

    const patch = updateDraft.mock.calls[0]![0] as { exercises: readonly SessionDraftExercise[] };
    expect(patch.exercises[0]).toMatchObject({ name: "Squats sumo", instruction: "Buste droit", categoryId: "cardio", bodyZoneIds: ["cuisses"] });
    expect(patch.exercises[0]!.sourceMovementId ?? "").toBe("");
    expect(await definitionsRows()).toEqual(definitionsBefore);
  });
});

describe("PRE-7 A2.3 — revue : disponibilité, Android, médias de la variante", () => {
  it("Séance : saisie détaillée commencée → ni lien ni feuille ; occurrence existante → ni lien ni feuille", async () => {
    await catalogueSquats();
    await renderEditor({});
    expect(screen.getByTestId("activity-editor-movement-search")).toBeTruthy();
    fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "Dos plat");
    await settle();
    expect(screen.queryByTestId("activity-editor-movement-search")).toBeNull();
    await typeName("Squats");
    expect(screen.queryByTestId("movement-suggestion-sheet")).toBeNull();
    screen.unmount();

    const existing: SessionDraftExercise = {
      ...createExerciseDraft("occ-1", null),
      name: "Gainage",
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
    };
    await renderEditor({ exerciseId: "occ-1" }, [existing]);
    expect(screen.queryByTestId("activity-editor-movement-search")).toBeNull();
    await typeName("Squats");
    expect(screen.queryByTestId("movement-suggestion-sheet")).toBeNull();
  });

  it("Catalogue : paramètres seuls saisis → ni lien ni feuille ; fin de saisie provoquée par l'ouverture d'une feuille → aucune suggestion", async () => {
    await catalogueSquats();
    await renderEditor({ catalogueDefinitionId: "new" });
    fireEvent.changeText(nameInput(), "Squats assistés");
    fireEvent(nameInput(), "focus");
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    fireEvent(nameInput(), "endEditing", { nativeEvent: { text: "Squats assistés" } });
    await settle(20);
    expect(screen.queryByTestId("movement-suggestion-sheet")).toBeNull();
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    fillDurationParameters();
    await settle();
    expect(screen.queryByTestId("activity-editor-movement-search")).toBeNull();
    fireEvent(nameInput(), "focus");
    await typeName("Squats");
    expect(screen.queryByTestId("movement-suggestion-sheet")).toBeNull();
  });

  it("Android : « Rechercher un autre geste » ouvre la recherche sans `onDismiss` ; retour système → feuille fermée sans choix ni écriture", async () => {
    const os = jest.replaceProperty(Platform, "OS", "android");
    try {
      await catalogueSquats();
      const movementsBefore = await movementsRows();
      await renderEditor({ catalogueDefinitionId: "new" });
      await typeName("Squats assistés");
      await press("movement-suggestion-search");
      expect(screen.queryByTestId("movement-suggestion-sheet")).toBeNull();
      expect(screen.getByTestId("movement-search-input")).toBeTruthy();
      fireEvent.press(screen.getAllByLabelText(editor.movementSearch.closeAccessibilityLabel).at(-1)!);
      await settle(20);
      screen.unmount();

      await renderEditor({ catalogueDefinitionId: "new" });
      await typeName("Squats sautés");
      const sheetModal = screen.UNSAFE_getAllByType(Modal).find((modal) => modal.props.animationType === "fade");
      await act(async () => {
        sheetModal?.props.onRequestClose?.();
      });
      await settle(20);
      expect(screen.queryByTestId("movement-suggestion-sheet")).toBeNull();
      expect(nameInput().props.value).toBe("Squats sautés");
      expect(nameInput().props.editable).not.toBe(false);
      expect(await movementsRows()).toEqual(movementsBefore);
    } finally {
      os.restore();
    }
  });

  it("Variante d'un geste à média : le média de l'origine est repris par la variante (MFN-07)", async () => {
    const origin = await service().createActivityDefinitionWithOrigin(
      input({ media: [{ assetId: "p1", asset: PHOTO }] }),
      { kind: "INDEPENDENT" },
    );
    if (origin.status !== "CREATED") throw new Error(origin.status);
    await renderEditor({ catalogueDefinitionId: "new" });
    await typeName("Squats assistés");
    await press("movement-suggestion-variant");
    fillDurationParameters();
    await finish();
    const variant = (await service().listActivityDefinitions()).find((definition) => definition.id !== origin.value.id)!;
    expect(variant.movementId).not.toBe(origin.value.movementId);
    expect((variant.media ?? []).map((item) => item.assetId)).toEqual(["p1"]);
    expect((await service().getActivityDefinition(origin.value.id))?.media?.map((item) => item.assetId)).toEqual(["p1"]);
  });
});
