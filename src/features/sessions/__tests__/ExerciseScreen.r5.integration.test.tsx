import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";

import type { CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import type { ExecutionParameters, WorkPhase } from "@/domain/activities/ExecutionParameters";
import type { Movement } from "@/domain/activities/Movement";
import { uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Category } from "@/domain/categories/Category";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import {
  createExerciseDraft,
  draftMovementOf,
  type DraftMovement,
  type SessionDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
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
 * PRE-7 story R-5 (D-445 C01, C02, v7 §2 et §6 R02 à R05 ; matrice de
 * `spec-r-5-creation-unicite-variante-recherche.md`) — parcours de création sur les VRAIS services
 * et une base SQLite réelle : panneau sous le nom pendant la saisie, nom déjà utilisé signalé dès la
 * frappe, variante Plus facile / Plus difficile (description et médias vierges, invite grise,
 * insertion avant / après l'origine), écran de recherche R03 (« Voir tous les mouvements »,
 * mouvements sans exercice), Catalogue et Séance. Remplace les parcours A2.3 (feuille à trois
 * choix). Rappel : ces tests ne valent pas recette sur iPhone (JA).
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

const NOW = "2026-10-26T11:00:00.000Z";
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
const panelText = editor.movementSuggestion;
const anyNode = { includeHiddenElements: true } as const;
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

/** Exercice « Squats » du Catalogue, mouvement à deux phases. */
async function catalogueSquats(overrides: Partial<CreateActivityDefinitionInput> = {}) {
  const result = await service().createActivityDefinitionWithOrigin(input(overrides), { kind: "INDEPENDENT" });
  if (result.status !== "CREATED") throw new Error(result.status);
  return result.value;
}

/** Mouvement LOCAL : créé dans une Séance, sans aucun Exercice ni occurrence (v7 l.27). */
async function localMovement(id = "genou", name = "Mobilisation du genou"): Promise<Movement> {
  return movements().create({
    id,
    name,
    description: "Genou souple",
    media: [],
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
    phases: [
      { id: 1, label: "Flexion" },
      { id: 2, label: "Extension" },
    ],
    nextPhaseId: 3,
    aliases: [],
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
  return {
    getProfile: jest.fn(async () => ({ ...createDefaultProfile("profile-1", NOW), exerciseCountdownSecondsDefault: 7 })),
  } as unknown as ProfileService;
}

async function renderEditor(
  params: Record<string, string>,
  exercises: readonly SessionDraftExercise[] = [],
  draftMovements?: Record<string, DraftMovement>,
) {
  mockSearchParams = params;
  const draft: SessionDraft = {
    name: "Séance",
    labelId: null,
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    exercises,
    ...(draftMovements !== undefined ? { movements: draftMovements } : {}),
  };
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
  await settle(20);
}

async function settle(ms = 0) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

const nameInput = () => screen.getByTestId("exercise-name-input");

/** Frappe du nom, clavier visible (aucune fin de saisie). */
async function typeName(name: string) {
  fireEvent.changeText(nameInput(), name);
  await settle(10);
}

/** Entrée / clavier fermé : fin de la saisie du nom. */
async function endNameEditing() {
  fireEvent(nameInput(), "endEditing", { nativeEvent: { text: nameInput().props.value } });
  await settle(10);
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
  await settle(20);
}

async function finish(testID = "activity-editor-finish-action") {
  await press(testID);
  await settle(50);
}

const finishDisabled = (testID = "activity-editor-finish-action") =>
  screen.getByTestId(testID).props.accessibilityState?.disabled === true;

/** Mouvements des cartes du panneau, dans l'ordre affiché. */
const resultIds = () =>
  screen
    .queryAllByTestId(/^movement-suggestion-result-.+-summary$/)
    .map((node) => String(node.props.testID).replace(/^movement-suggestion-result-(.+)-summary$/, "$1"));
/** Mouvements des cartes de l'écran de recherche, dans l'ordre affiché. */
const searchResultIds = () =>
  screen
    .queryAllByTestId(/^movement-search-result-.+-summary$/)
    .map((node) => String(node.props.testID).replace(/^movement-search-result-(.+)-summary$/, "$1"));

/** Paramètres d'un mouvement neuf : Durée 45 s. */
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

/** Durées des deux phases du mouvement repris, côté Sans. */
function fillPhaseDurations() {
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  enterExecutionSheetCell("execution-sheet-phase-row-1-duration", "7");
  enterExecutionSheetCell("execution-sheet-phase-row-2-duration", "2");
  fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
  fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 0 } });
  fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 9 } });
  pressInExecutionSheet(screen.getByTestId("duration-wheel-validate"));
  chooseExecutionSide("Sans");
  fireEvent.press(screen.getByTestId("execution-sheet-validate"));
  expect(screen.queryByTestId("execution-sheet")).toBeNull();
}

describe("PRE-7 R-5 — panneau sous le nom (R03, R04)", () => {
  it("nom proche : le panneau s'ouvre pendant la frappe, cartes Résultat à deux actions ; rien n'est présélectionné ni écrit", async () => {
    await catalogueSquats();
    await localMovement();
    const definitionsBefore = await definitionsRows();
    const movementsBefore = await movementsRows();
    await renderEditor({ catalogueDefinitionId: "new" });
    expect(screen.queryByTestId("movement-suggestion-panel")).toBeNull();
    await typeName("Squat");

    const panel = screen.getByTestId("movement-suggestion-panel");
    expect(resultIds()).toHaveLength(1);
    const [squatsId] = resultIds();
    expect(screen.getByTestId(`movement-suggestion-result-${squatsId}-name`).props.children).toBe("Squats");
    expect(screen.getByTestId(`movement-suggestion-result-${squatsId}-description`).props.children).toBe("Buste droit");
    expect(within(panel).getByText(panelText.useMovement)).toBeTruthy();
    expect(within(panel).getByText(panelText.createVariant)).toBeTruthy();
    // Proximité seulement, pas de conflit de nom.
    expect(screen.queryByTestId("movement-suggestion-message")).toBeNull();
    expect(nameInput().props.value).toBe("Squat");
    expect(await definitionsRows()).toEqual(definitionsBefore);
    expect(await movementsRows()).toEqual(movementsBefore);
  });

  it("aucun mouvement au-dessus du seuil haut : aucun panneau ; Entrée ferme le panneau sans sélection, la frappe le rouvre", async () => {
    await catalogueSquats();
    await renderEditor({ catalogueDefinitionId: "new" });
    await typeName("Gainage");
    expect(screen.queryByTestId("movement-suggestion-panel")).toBeNull();
    await typeName("Squat");
    expect(screen.getByTestId("movement-suggestion-panel")).toBeTruthy();
    await endNameEditing();
    expect(screen.queryByTestId("movement-suggestion-panel")).toBeNull();
    expect(nameInput().props.value).toBe("Squat");
    expect(nameInput().props.editable).not.toBe(false);
    await typeName("Squat ");
    expect(screen.getByTestId("movement-suggestion-panel")).toBeTruthy();
  });

  it("cinq résultats au plus ; l'ordre est figé pendant un appui sur le panneau", async () => {
    for (const name of ["Squats", "Squats A", "Squats B", "Squats C", "Squats D", "Squats E"]) {
      await catalogueSquats({ name });
    }
    await renderEditor({ catalogueDefinitionId: "new" });
    await typeName("Squats");
    expect(resultIds()).toHaveLength(5);
    const before = resultIds();
    fireEvent(screen.getByTestId("movement-suggestion-panel"), "touchStart");
    await typeName("Squats E");
    expect(resultIds()).toEqual(before);
    fireEvent(screen.getByTestId("movement-suggestion-panel"), "touchEnd");
    await settle(10);
    expect(resultIds()[0]).not.toBe(before[0]);
  });

  it("saisie détaillée commencée (description) : ni panneau ni lien de recherche", async () => {
    await catalogueSquats();
    await renderEditor({ catalogueDefinitionId: "new" });
    expect(screen.getByTestId("activity-editor-movement-search")).toBeTruthy();
    fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "Dos plat");
    await settle();
    expect(screen.queryByTestId("activity-editor-movement-search")).toBeNull();
    await typeName("Squat");
    expect(resultIds()).toEqual([]);
  });
});

describe("PRE-7 R-5 — unicité pendant la saisie (C01)", () => {
  it("création : « squats » existe → message rouge et cartes ; Terminer indisponible ; « Utiliser ce mouvement » reprend l'existant", async () => {
    const squats = await catalogueSquats();
    await renderEditor({ catalogueDefinitionId: "new" });
    await typeName("  SQUATS ");
    expect(screen.getByTestId("movement-suggestion-message").props.children).toBe(panelText.nameTaken);
    expect(resultIds()[0]).toBe(squats.movementId);
    expect(finishDisabled()).toBe(true);
    // Fin de saisie : le conflit reste signalé (deux sorties : reprendre ou corriger).
    await endNameEditing();
    expect(screen.getByTestId("movement-suggestion-message")).toBeTruthy();

    await press(`movement-suggestion-result-${squats.movementId}-use`);
    await settle(50);
    expect(screen.queryByTestId("movement-suggestion-panel")).toBeNull();
    expect(nameInput().props.value).toBe("Squats");
    expect(nameInput().props.editable).toBe(false);
    fillPhaseDurations();
    await finish();
    expect(mockBack).toHaveBeenCalled();
    const all = await service().listActivityDefinitions();
    expect(new Set(all.map((definition) => definition.movementId))).toEqual(new Set([squats.movementId]));
  });

  it("correction d'un Exercice : son propre nom n'est pas un conflit ; le nom d'un autre mouvement l'est", async () => {
    const squats = await catalogueSquats();
    await catalogueSquats({ name: "Fentes" });
    await renderEditor({ catalogueDefinitionId: squats.id });
    await typeName("squats");
    expect(screen.queryByTestId("movement-suggestion-message")).toBeNull();
    await typeName("FENTES");
    expect(screen.getByTestId("movement-suggestion-message").props.children).toBe(panelText.nameTakenEdit);
    expect(resultIds()).toEqual([]);
    expect(finishDisabled()).toBe(true);
  });

  it("casse seule puis « Créer un nouveau mouvement » : refusé avec le message, rien n'est écrit (v7 l.67, report R-4)", async () => {
    const squats = await catalogueSquats();
    const movementsBefore = await movementsRows();
    await renderEditor({ catalogueDefinitionId: squats.id });
    await typeName("SQUATS");
    await finish();
    fireEvent.press(screen.getByTestId("movement-save-choice-NEW_MOVEMENT"));
    await press("movement-save-confirm");
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(screen.getByTestId("movement-suggestion-message").props.children).toBe(panelText.nameTakenEdit);
    expect(screen.queryByTestId("activity-editor-save-error")).toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
    expect(await movementsRows()).toEqual(movementsBefore);
  });

  it("nom pris entre la lecture et l'écriture : DuplicateMovementNameError → message propre, jamais l'erreur générique", async () => {
    const squats = await catalogueSquats();
    await renderEditor({ catalogueDefinitionId: "new" });
    await typeName("Squats");
    await press(`movement-suggestion-result-${squats.movementId}-variant`);
    await press(`movement-suggestion-result-${squats.movementId}-harder`);
    await typeName("Squats lents");
    fillDurationParameters();
    // Écriture concurrente : le nom est pris après la lecture de la liste par l'éditeur.
    await localMovement("lents", "squats LENTS");
    const definitionsBefore = await definitionsRows();
    await finish();
    expect(screen.getByTestId("movement-suggestion-message").props.children).toBe(panelText.nameTakenEdit);
    expect(screen.queryByTestId("activity-editor-save-error")).toBeNull();
    expect(finishDisabled()).toBe(true);
    expect(mockBack).not.toHaveBeenCalled();
    expect(await definitionsRows()).toEqual(definitionsBefore);
    await typeName("Squats très lents");
    expect(screen.queryByTestId("movement-suggestion-message")).toBeNull();
  });
});

describe("PRE-7 R-5 — variante (C02)", () => {
  it("Créer une variante → cadre de retour et deux sens ; « Plus facile » : nom conservé + invite grise, description et médias vierges, Catégorie et Zones reprises, Niveau 1 ; Terminer → inséré AVANT l'origine", async () => {
    const squats = await catalogueSquats({ media: [{ assetId: "p1", asset: PHOTO }] });
    const originBefore = await database.getAllAsync("SELECT name, description FROM movements WHERE id = ?", [squats.movementId]);
    await renderEditor({ catalogueDefinitionId: "new" });
    await typeName("Squats");
    await press(`movement-suggestion-result-${squats.movementId}-variant`);
    expect(screen.getByTestId("movement-suggestion-back")).toBeTruthy();
    expect(screen.getByTestId(`movement-suggestion-result-${squats.movementId}-easier`)).toBeTruthy();
    // Retour aux résultats, puis de nouveau la variante.
    await press("movement-suggestion-back");
    expect(screen.queryByTestId("movement-suggestion-back")).toBeNull();
    await press(`movement-suggestion-result-${squats.movementId}-variant`);
    await press(`movement-suggestion-result-${squats.movementId}-easier`);

    expect(screen.queryByTestId("movement-suggestion-panel")).toBeNull();
    expect(nameInput().props.value).toBe("Squats");
    expect(within(screen.getByTestId("exercise-name-hint", anyNode)).getByText(` ${panelText.completeNameHint}`, anyNode)).toBeTruthy();
    expect(screen.getByTestId("exercise-instruction-input").props.value).toBe("");
    expect(screen.queryByTestId("activity-editor-movement-search")).toBeNull();
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityLabel).toContain("Cardio");
    expect(screen.getByTestId("activity-editor-level-label", anyNode).props.children).toBe("Niveau 1");
    fillDurationParameters();
    // Nom conservé = nom de l'origine : l'invite « ne satisfait pas l'unicité ».
    expect(finishDisabled()).toBe(true);

    await typeName("Squats assistés");
    expect(screen.queryByTestId("exercise-name-hint", anyNode)).toBeNull();
    expect(screen.queryByTestId("movement-suggestion-panel")).toBeNull();
    expect(finishDisabled()).toBe(false);
    await finish();

    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(mockBack).toHaveBeenCalled();
    const variant = (await service().listActivityDefinitions()).find((definition) => definition.id !== squats.id)!;
    expect(variant).toMatchObject({ name: "Squats assistés", description: null, categoryId: "cardio", bodyZoneIds: ["cuisses"] });
    expect(variant.media ?? []).toEqual([]);
    const levels = await service().getMovementLevels(squats.movementId);
    expect(levels?.levels.map((level) => level.movement.id)).toEqual([variant.movementId, squats.movementId]);
    expect(await database.getAllAsync("SELECT name, description FROM movements WHERE id = ?", [squats.movementId])).toEqual(
      originBefore,
    );
  });

  it("depuis l'écran de recherche : « Plus difficile » → inséré APRÈS l'origine", async () => {
    const squats = await catalogueSquats();
    await renderEditor({ catalogueDefinitionId: "new" });
    await typeName("Squats");
    await endNameEditing();
    await press("activity-editor-movement-search");
    expect(screen.getByTestId("movement-search-input").props.value).toBe("Squats");
    await press(`movement-search-result-${squats.movementId}-variant`);
    await press(`movement-search-result-${squats.movementId}-harder`);
    expect(screen.queryByTestId("movement-search-input")).toBeNull();
    expect(screen.getByTestId("exercise-name-hint", anyNode)).toBeTruthy();
    expect(screen.getByTestId("activity-editor-level-label", anyNode).props.children).toBe("Niveau 2");
    await typeName("Squats sautés");
    fillDurationParameters();
    await finish();
    const variant = (await service().listActivityDefinitions()).find((definition) => definition.id !== squats.id)!;
    const levels = await service().getMovementLevels(squats.movementId);
    expect(levels?.levels.map((level) => level.movement.id)).toEqual([squats.movementId, variant.movementId]);
  });
});

describe("PRE-7 R-5 — écran de recherche (R03)", () => {
  it("prérempli avec le nom ; sans résultat : annonce et « Voir tous les mouvements » ; tous les mouvements, sans exercice compris ; reprise d'un mouvement local", async () => {
    await catalogueSquats();
    const local = await localMovement();
    await renderEditor({ catalogueDefinitionId: "new" });
    await typeName("Natation");
    await press("activity-editor-movement-search");
    expect(screen.getByTestId("movement-search-input").props.value).toBe("Natation");
    expect(screen.getByTestId("movement-search-empty")).toBeTruthy();
    expect(screen.getByText(editor.movementSearch.noResult)).toBeTruthy();
    await press("movement-search-show-all");
    expect(screen.getByTestId("movement-search-input").props.value).toBe("");
    expect(screen.queryByTestId("movement-search-empty")).toBeNull();
    expect(screen.getByTestId("movement-search-result-genou")).toBeTruthy();
    expect(searchResultIds()).toHaveLength(2);

    fireEvent.changeText(screen.getByTestId("movement-search-input"), "genoux mobilisation");
    await settle(10);
    expect(searchResultIds()).toEqual(["genou"]);
    await press("movement-search-result-genou-use");
    await settle(50);
    expect(screen.queryByTestId("movement-search-input")).toBeNull();
    expect(nameInput().props.value).toBe(local.name);
    expect(nameInput().props.editable).toBe(false);
    fillPhaseDurations();
    await finish();
    expect((await service().listActivityDefinitions()).filter((definition) => definition.movementId === "genou")).toHaveLength(1);
  });

  it("✕ : retour au brouillon intact, rien d'écrit", async () => {
    await catalogueSquats();
    const movementsBefore = await movementsRows();
    await renderEditor({ catalogueDefinitionId: "new" });
    await typeName("Squats assistés");
    await press("activity-editor-movement-search");
    fireEvent.press(screen.getAllByLabelText(editor.movementSearch.closeAccessibilityLabel).at(-1)!);
    await settle(20);
    expect(screen.queryByTestId("movement-search-input")).toBeNull();
    expect(nameInput().props.value).toBe("Squats assistés");
    expect(mockBack).not.toHaveBeenCalled();
    expect(await movementsRows()).toEqual(movementsBefore);
  });
});

describe("PRE-7 R-5 — Séance", () => {
  it("deux créations locales de même nom dans le brouillon : signalé pendant la saisie, Terminer indisponible (report R-3)", async () => {
    const first: SessionDraftExercise = {
      ...createExerciseDraft("occ-1", null),
      name: "Gainage maison",
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      sourceMovementId: "occ-1",
    };
    await renderEditor({}, [first], { "occ-1": draftMovementOf(first, "NEW") });
    await typeName("gainage MAISON");
    expect(screen.getByTestId("movement-suggestion-message").props.children).toBe(panelText.nameTakenEdit);
    expect(finishDisabled("exercise-finish-action")).toBe(true);
    await typeName("Gainage maison 2");
    expect(screen.queryByTestId("movement-suggestion-message")).toBeNull();
  });

  it("l'occurrence d'un Mouvement NOUVEAU garde son propre nom sans conflit", async () => {
    const first: SessionDraftExercise = {
      ...createExerciseDraft("occ-1", null),
      name: "Gainage maison",
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      sourceMovementId: "occ-1",
    };
    await renderEditor({ exerciseId: "occ-1" }, [first], { "occ-1": draftMovementOf(first, "NEW") });
    await typeName("GAINAGE MAISON");
    expect(screen.queryByTestId("movement-suggestion-message")).toBeNull();
  });

  it("variante « Plus facile » : Mouvement NEW du brouillon avec son origine de niveau, description et médias vierges ; aucune définition publiée", async () => {
    const squats = await catalogueSquats({ media: [{ assetId: "p1", asset: PHOTO }] });
    const definitionsBefore = await definitionsRows();
    await renderEditor({});
    await typeName("Squats");
    await press(`movement-suggestion-result-${squats.movementId}-variant`);
    await press(`movement-suggestion-result-${squats.movementId}-easier`);
    expect(screen.getByTestId("exercise-name-hint", anyNode)).toBeTruthy();
    await typeName("Squats sumo");
    fillDurationParameters();
    await finish("exercise-finish-action");

    const patch = updateDraft.mock.calls[0]![0] as {
      exercises: readonly SessionDraftExercise[];
      movements?: Record<string, DraftMovement>;
    };
    const occurrence = patch.exercises[0]!;
    expect(occurrence).toMatchObject({ name: "Squats sumo", instruction: null, categoryId: "cardio", bodyZoneIds: ["cuisses"] });
    expect(occurrence.media ?? []).toEqual([]);
    expect(patch.movements?.[occurrence.id]).toMatchObject({
      change: "NEW",
      name: "Squats sumo",
      levelOrigin: { movementId: squats.movementId, placement: "BEFORE_ORIGIN" },
    });
    expect(await definitionsRows()).toEqual(definitionsBefore);
  });
});

describe("PRE-7 R-5 — revue : disponibilité, reprise en Séance, réédition", () => {
  it("Séance, « Utiliser ce mouvement » : l'occurrence porte le mouvement choisi, contenu verrouillé ; aucun Mouvement du brouillon ; rien n'est écrit", async () => {
    const squats = await catalogueSquats();
    const definitionsBefore = await definitionsRows();
    const movementsBefore = await movementsRows();
    await renderEditor({});
    await typeName("Squat");
    await press(`movement-suggestion-result-${squats.movementId}-use`);
    expect(nameInput().props.value).toBe("Squats");
    expect(nameInput().props.editable).toBe(false);
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityState).toMatchObject({ disabled: true });
    fillPhaseDurations();
    await finish("exercise-finish-action");

    const patch = updateDraft.mock.calls[0]![0] as {
      exercises: readonly SessionDraftExercise[];
      movements?: Record<string, DraftMovement>;
    };
    expect(patch.exercises[0]).toMatchObject({ name: "Squats", sourceMovementId: squats.movementId, instruction: "Buste droit" });
    expect(patch.movements?.[squats.movementId]).toBeUndefined();
    expect(patch.movements?.[patch.exercises[0]!.id]).toBeUndefined();
    expect(await definitionsRows()).toEqual(definitionsBefore);
    expect(await movementsRows()).toEqual(movementsBefore);
  });

  it("occurrence existante ou reprise par la route : ni panneau ni lien de recherche", async () => {
    const squats = await catalogueSquats();
    const existing: SessionDraftExercise = {
      ...createExerciseDraft("occ-1", null),
      name: "Gainage",
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      sourceMovementId: "occ-1",
    };
    await renderEditor({ exerciseId: "occ-1" }, [existing], { "occ-1": draftMovementOf(existing, "NEW") });
    expect(screen.queryByTestId("activity-editor-movement-search")).toBeNull();
    await typeName("Squat");
    expect(screen.queryByTestId("movement-suggestion-panel")).toBeNull();
    screen.unmount();

    await renderEditor({ catalogueDefinitionId: "new", movementId: squats.movementId });
    expect(nameInput().props.value).toBe("Squats");
    expect(screen.queryByTestId("activity-editor-movement-search")).toBeNull();
    expect(screen.queryByTestId("movement-suggestion-panel")).toBeNull();
  });

  it("réédition d'une occurrence variante NEW (paramètre modifié) : l'origine de niveau est conservée", async () => {
    const squats = await catalogueSquats();
    const variant: SessionDraftExercise = {
      ...createExerciseDraft("occ-v", null),
      name: "Squats sumo",
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      executionParameters: uniformParameters({ mode: "DURATION", count: 3, target: 30, pauseSeconds: 10 }),
      sourceMovementId: "occ-v",
    };
    const levelOrigin = { movementId: squats.movementId, placement: "BEFORE_ORIGIN" as const };
    await renderEditor({ exerciseId: "occ-v" }, [variant], { "occ-v": draftMovementOf(variant, "NEW", { levelOrigin }) });
    fillDurationParameters();
    await finish("exercise-finish-action");
    const patch = updateDraft.mock.calls[0]![0] as { movements?: Record<string, DraftMovement> };
    expect(patch.movements?.["occ-v"]).toMatchObject({ change: "NEW", levelOrigin });
  });

  it("Catégorie choisie avant la saisie du nom : panneau et lien de recherche toujours présents", async () => {
    const squats = await catalogueSquats();
    await renderEditor({ catalogueDefinitionId: "new" });
    fireEvent.press(screen.getByTestId("activity-editor-category-button"));
    fireEvent.press(await screen.findByTestId("category-picker-tag-cardio"));
    fireEvent.press(screen.getByTestId("category-picker-confirm"));
    await settle(400);
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityLabel).toContain("Cardio");
    expect(screen.getByTestId("activity-editor-movement-search")).toBeTruthy();
    await typeName("Squat");
    expect(resultIds()).toEqual([squats.movementId]);
  });
});
