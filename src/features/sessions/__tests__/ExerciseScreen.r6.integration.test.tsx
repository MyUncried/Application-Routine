import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Menu } from "@expo/ui/swift-ui";
import { disabled as swiftUIDisabled } from "@expo/ui/swift-ui/modifiers";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";

import { activityDefinitionToDraftExercise, type CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import type { ExecutionParameters, WorkPhase } from "@/domain/activities/ExecutionParameters";
import { durationParameters, uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Category } from "@/domain/categories/Category";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { createEmptyDraft, createExerciseDraft, toSessionDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import {
  chooseExecutionSide,
  enterExecutionSheetCell,
  pressInExecutionSheet,
} from "@/features/activities/testing/executionSheetActions";
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
 * PRE-7 story R-6 (D-445 C05, C06, C09 ; v7 §4 l.59, §5 l.67 ; MFN-09 l.410-418 ; CE-UI-NIV-01 ;
 * matrice de `spec-r-6-niveaux-tous-contextes.md`) — commande Niveau hors crayon en occurrence de
 * Séance et en reprise, sur les VRAIS services et une base SQLite réelle (`node:sqlite`) :
 * changement de niveau préparé dans l'éditeur (contenu du mouvement choisi, paramètres transférés
 * par rang), validé par `Terminer` (nouvelle occurrence à la même place) ou abandonné par la
 * fermeture (brouillon intact) ; groupe jamais reclassé ; durées manquantes signalées ; pastille du
 * rang prévu d'une variante créée en Séance. Plate-forme : iOS (`jest-expo`), menu natif.
 * Rappel : ces tests ne valent pas recette sur iPhone (JA2).
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
    useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
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
const anyNode = { includeHiddenElements: true } as const;
const incomplete = strings.executionParameters.card.incomplete;

let database: NodeSqliteDatabase;
let sequence = 0;
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

const phases = (labels: readonly string[], durations: readonly number[]): WorkPhase[] =>
  labels.map((label, index) => ({ id: index + 1, label, durationSeconds: durations[index]! }));

const phased = (workPhases: readonly WorkPhase[]): ExecutionParameters =>
  uniformParameters({ mode: "DURATION", count: 3, target: 45, pauseSeconds: 10, sideMode: "UNILATERAL", workPhases: [...workPhases] });

const input = (name: string, executionParameters: ExecutionParameters, description: string): CreateActivityDefinitionInput => ({
  name,
  description,
  category: { kind: "EXISTING", categoryId: "cardio" },
  bodyZoneIds: ["cuisses"],
  executionParameters,
});

async function create(
  value: CreateActivityDefinitionInput,
  origin: Parameters<ActivityDefinitionService["createActivityDefinitionWithOrigin"]>[1] = { kind: "INDEPENDENT" },
) {
  const result = await service().createActivityDefinitionWithOrigin(value, origin);
  if (result.status !== "CREATED") throw new Error(result.status);
  return result.value;
}

/**
 * Groupe de trois niveaux : « Squats assistés » (phases Montée 5 s / Descente 2 s) → « Squats »
 * (sans phases) → « Squats sautés » (trois phases).
 */
async function threeLevels() {
  const assisted = await create(input("Squats assistés", phased(phases(["Montée", "Descente"], [5, 2])), "Avec appui"));
  const squats = await create(input("Squats", durationParameters(30, 3, 10), "Cuisses parallèles"), {
    kind: "VARIANT",
    originMovementId: assisted.movementId,
    joinOriginGroup: true,
  });
  const jumps = await create(input("Squats sautés", phased(phases(["Élan", "Saut", "Réception"], [3, 1, 2])), "Explosif"), {
    kind: "VARIANT",
    originMovementId: squats.movementId,
    joinOriginGroup: true,
  });
  return { assisted, squats, jumps };
}

/** Séance enregistrée : une occurrence de « Squats » puis une de « Squats assistés » (copie 2). */
async function sessionWithAssisted() {
  const levels = await threeLevels();
  const created = await sessionService().createSession({
    ...createEmptyDraft(),
    name: "Jambes",
    exercises: [
      activityDefinitionToDraftExercise(levels.squats, "occ-0", null),
      { ...activityDefinitionToDraftExercise(levels.assisted, "occ-1", 20), copyNumber: 2 },
    ],
  });
  if (!created.ok) throw new Error(JSON.stringify(created.violations));
  return { ...levels, session: created.value, draft: toSessionDraft(created.value) };
}

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
  await settle(20);
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

async function pressNative(testID: string) {
  await act(async () => {
    fireEvent(screen.getByTestId(testID, anyNode), "buttonPress");
  });
  await settle();
}

const pastilleLabel = () => screen.getByTestId("activity-editor-level-label", anyNode).props.children;
const nativeMenu = (testID: string) =>
  within(screen.getByTestId("activity-editor-level", anyNode))
    .UNSAFE_getAllByType(Menu)
    .find((menu) => menu.props.testID === testID);
const nameInput = () => screen.getByTestId("exercise-name-input");
const finishDisabled = () => screen.getByTestId("exercise-finish-action").props.accessibilityState?.disabled === true;
const groupNames = async (movementId: string) =>
  (await service().getMovementLevels(movementId))?.levels.map((level) => level.movement.name);

describe("PRE-7 R-6 — occurrence de Séance : commande Niveau (C09, MFN-09)", () => {
  it("présente hors crayon : « Niveau 1 », un bouton par niveau (mouvement courant coché), « Ajouter un niveau » indisponible", async () => {
    const { draft } = await sessionWithAssisted();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    expect(pastilleLabel()).toBe("Niveau 1");
    const level1 = screen.getByTestId("activity-editor-level-level-1", anyNode);
    expect([level1.props.label, level1.props.systemImage]).toEqual(["Niveau 1 sur 3 · Squats assistés", "checkmark"]);
    expect(screen.getByTestId("activity-editor-level-level-3", anyNode).props.label).toBe("Niveau 3 sur 3 · Squats sautés");
    expect(JSON.stringify(nativeMenu("activity-editor-level-add")?.props.modifiers)).toContain(JSON.stringify(swiftUIDisabled(true)));
    // Le niveau courant : aucun effet.
    await pressNative("activity-editor-level-level-1");
    expect(nameInput().props.value).toBe("Squats assistés");
  });

  it("phases → sans : contenu du mouvement choisi, cible conservée, phases retirées ; Terminer → nouvelle occurrence à la même place, sans copie ; groupe non reclassé ; la Séance enregistrée référence le nouveau mouvement", async () => {
    const { assisted, squats, session, draft } = await sessionWithAssisted();
    const groupBefore = await groupNames(assisted.movementId);
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await pressNative("activity-editor-level-level-2");

    expect(nameInput().props.value).toBe("Squats");
    expect(screen.getByDisplayValue("Cuisses parallèles")).toBeTruthy();
    expect(pastilleLabel()).toBe("Niveau 2");
    expect(screen.getByTestId("activity-editor-level-level-2", anyNode).props.systemImage).toBe("checkmark");
    // Rien n'est inscrit avant `Terminer`.
    expect(updateDraft).not.toHaveBeenCalled();
    expect(finishDisabled()).toBe(false);

    await press("exercise-finish-action");
    expect(mockBack).toHaveBeenCalled();
    expect(currentDraft.exercises.map((exercise) => exercise.id)).toEqual(["occ-0", expect.stringMatching(/^uuid-/)]);
    const replaced = currentDraft.exercises[1]!;
    expect(replaced).toMatchObject({ name: "Squats", sourceMovementId: squats.movementId, copyNumber: null, postActivityRecoverySeconds: 20 });
    expect(replaced.executionParameters.series).toMatchObject({ kind: "UNIFORM", count: 3, target: { kind: "NUMBER", value: 45 }, pauseSeconds: 10 });
    expect(replaced.executionParameters.series.workPhases).toEqual([]);
    expect(currentDraft.movements).toEqual(draft.movements);
    // C09 : aucun reclassement.
    expect(await groupNames(assisted.movementId)).toEqual(groupBefore);

    const saved = await sessionService().updateSession(session.id, currentDraft);
    expect(saved).toMatchObject({ status: "UPDATED" });
    const reread = await sessionService().getSession(session.id);
    const activities = reread === null || reread === undefined
      ? []
      : [...(reread.cycle.beforeTour ?? []), ...reread.cycle.tour.exercises, ...(reread.cycle.afterTour ?? [])];
    expect(activities.map((activity) => activity.sourceMovementId)).toEqual([squats.movementId, squats.movementId]);
    expect(activities.map((activity) => activity.name)).toEqual(["Squats", "Squats"]);
    // Aucun Exercice du Catalogue créé par le remplacement.
    expect((await service().listActivityDefinitions()).length).toBe(3);
  });

  it("phases → phases (surplus cible) : rangs communs repris, troisième durée vide, « Paramètres à compléter. », Terminer indisponible ; la durée complétée, Terminer remplace", async () => {
    const { jumps, draft } = await sessionWithAssisted();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await pressNative("activity-editor-level-level-3");
    expect(nameInput().props.value).toBe("Squats sautés");
    expect(screen.getByText(incomplete)).toBeTruthy();
    expect(finishDisabled()).toBe(true);

    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    enterExecutionSheetCell("execution-sheet-phase-row-3-duration", "4");
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    expect(screen.queryByText(incomplete)).toBeNull();
    expect(finishDisabled()).toBe(false);
    await press("exercise-finish-action");
    const replaced = currentDraft.exercises[1]!;
    expect(replaced.sourceMovementId).toBe(jumps.movementId);
    expect(replaced.executionParameters.series.workPhases.map((phase) => [phase.label, phase.durationSeconds])).toEqual([
      ["Élan", 5],
      ["Saut", 2],
      ["Réception", 4],
    ]);
  });

  it("Annuler : la fermeture après un changement n'inscrit rien (occurrence restituée) ; revenir au niveau d'origine rend son contenu", async () => {
    const { draft } = await sessionWithAssisted();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await pressNative("activity-editor-level-level-2");
    expect(nameInput().props.value).toBe("Squats");
    await pressNative("activity-editor-level-level-1");
    expect(nameInput().props.value).toBe("Squats assistés");
    expect(screen.getByDisplayValue("Avec appui")).toBeTruthy();
    await press("screen-header-back");
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(updateDraft).not.toHaveBeenCalled();
    expect(currentDraft).toBe(draft);
  });

  it("crayon : pendant l'édition du contenu, pastille sans menu ; après un changement de niveau, crayon retiré", async () => {
    const { draft } = await sessionWithAssisted();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await press("activity-editor-edit-movement");
    expect(screen.queryByTestId("activity-editor-level-level-2", anyNode)).toBeNull();
    expect(pastilleLabel()).toBe("Niveau 1");
    expect(screen.getByTestId("activity-editor-level").props.accessibilityLabel).toBe("Niveau 1");
    // PRE-7 (R-9, D-448 point 10) : crayon actif ; le retoucher sans changement rend le menu.
    expect(screen.getByTestId("activity-editor-edit-movement").props.accessibilityState).toMatchObject({ selected: true });
    await press("activity-editor-edit-movement");
    expect(screen.getByTestId("activity-editor-level-level-2", anyNode)).toBeTruthy();
    screen.unmount();

    await renderEditor({ exerciseId: "occ-1" }, draft);
    expect(screen.getByTestId("activity-editor-edit-movement")).toBeTruthy();
    await pressNative("activity-editor-level-level-2");
    expect(screen.queryByTestId("activity-editor-edit-movement")).toBeNull();
  });

  it("variante créée dans la Séance (Mouvement NOUVEAU rattaché à l'enregistrement) : pastille du rang prévu, sans menu (report R-5)", async () => {
    const { squats } = await threeLevels();
    const local = {
      ...createExerciseDraft("occ-v", null),
      name: "Squats sumo",
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      executionParameters: durationParameters(30, 3, 10),
      sourceMovementId: "occ-v",
    };
    const draft: SessionDraft = {
      ...createEmptyDraft(),
      exercises: [local],
      movements: {
        "occ-v": {
          id: "occ-v",
          change: "NEW",
          name: "Squats sumo",
          description: null,
          categoryId: "cardio",
          bodyZoneIds: ["cuisses"],
          media: [],
          phases: [],
          nextPhaseId: 1,
          aliases: [],
          levelOrigin: { movementId: squats.movementId, placement: "AFTER_ORIGIN" },
        },
      },
    };
    await renderEditor({ exerciseId: "occ-v" }, draft);
    // « Squats » 2 sur 3, variante plus difficile : 3 sur 4.
    expect(pastilleLabel()).toBe("Niveau 3");
    expect(screen.getByTestId("activity-editor-level").props.accessibilityLabel).toBe("Niveau 3");
    expect(screen.queryByTestId("activity-editor-level-level-1", anyNode)).toBeNull();
  });
});

describe("PRE-7 R-6 — reprise au Catalogue : commande Niveau (C09)", () => {
  it("changer de niveau remplace en place le mouvement repris (contenu, structure, paramètres par rang) ; rien n'est écrit, groupe non reclassé, crayon conservé", async () => {
    const { assisted, squats } = await threeLevels();
    const groupBefore = await groupNames(assisted.movementId);
    const before = await database.getAllAsync("SELECT * FROM activity_definitions ORDER BY id");
    await renderEditor({ catalogueDefinitionId: "new", movementId: squats.movementId });
    expect(pastilleLabel()).toBe("Niveau 2");
    await pressNative("activity-editor-level-level-1");
    expect(nameInput().props.value).toBe("Squats assistés");
    expect(screen.getByDisplayValue("Avec appui")).toBeTruthy();
    expect(pastilleLabel()).toBe("Niveau 1");
    expect(screen.getByTestId("activity-editor-level-level-1", anyNode).props.systemImage).toBe("checkmark");
    expect(screen.getByTestId("activity-editor-edit-movement")).toBeTruthy();
    expect(await database.getAllAsync("SELECT * FROM activity_definitions ORDER BY id")).toEqual(before);
    expect(await groupNames(assisted.movementId)).toEqual(groupBefore);
  });
});

/**
 * Feuille : durées des `durations.length` premières phases, durée de série 9 s, changement de côté
 * Sans, puis ✓ (même saisie que les tests A2.2 et R-5).
 */
function fillParameters(durations: readonly string[]) {
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  durations.forEach((duration, index) => enterExecutionSheetCell(`execution-sheet-phase-row-${index + 1}-duration`, duration));
  fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
  fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 0 } });
  fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 9 } });
  pressInExecutionSheet(screen.getByTestId("duration-wheel-validate"));
  chooseExecutionSide("Sans");
  fireEvent.press(screen.getByTestId("execution-sheet-validate"));
  expect(screen.queryByTestId("execution-sheet")).toBeNull();
}

const RESERVE_ROWS = [{ target: { kind: "NUMBER" as const, value: 30 }, pauseSeconds: 10, loadKg: 0 }];

describe("PRE-7 R-6 — revue : compléments de vérification", () => {
  it("occurrence : phases (5 s, 2 s) → niveau sans phases → retour au niveau d'origine : paramètres d'origine restitués, Terminer sans remplacement", async () => {
    const { draft } = await sessionWithAssisted();
    const original = draft.exercises.find((exercise) => exercise.id === "occ-1")!;
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await pressNative("activity-editor-level-level-2");
    await pressNative("activity-editor-level-level-1");
    expect(finishDisabled()).toBe(false);
    expect(screen.queryByText(incomplete)).toBeNull();
    await press("exercise-finish-action");
    expect(currentDraft.exercises.map((exercise) => exercise.id)).toEqual(["occ-0", "occ-1"]);
    expect(currentDraft.exercises[1]!.executionParameters).toEqual(original.executionParameters);
  });

  it("reprise au Catalogue : retour au mouvement repris → valeur initiale de la reprise restituée (jamais un second transfert)", async () => {
    const { assisted } = await threeLevels();
    await renderEditor({ catalogueDefinitionId: "new", movementId: assisted.movementId });
    expect(screen.getByText(incomplete)).toBeTruthy();
    await pressNative("activity-editor-level-level-2");
    expect(nameInput().props.value).toBe("Squats");
    await pressNative("activity-editor-level-level-1");
    expect(nameInput().props.value).toBe("Squats assistés");
    expect(screen.getByDisplayValue("Avec appui")).toBeTruthy();
    expect(screen.getByText(incomplete)).toBeTruthy();
    // Structure du mouvement repris rétablie : deux phases.
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    expect(screen.getByTestId("execution-sheet-phase-row-2-duration-input", anyNode)).toBeTruthy();
    expect(screen.queryByTestId("execution-sheet-phase-row-3-duration-input", anyNode)).toBeNull();
    expect(await groupNames(assisted.movementId)).toEqual(["Squats assistés", "Squats", "Squats sautés"]);
  });

  it("reprise au Catalogue : changement vers un niveau à phases, durées complétées, Terminer → Exercice du mouvement choisi, structure transférée, aucun dialogue C03 ; mouvements inchangés", async () => {
    const { assisted, jumps } = await threeLevels();
    const jumpsBefore = await service().getMovement(jumps.movementId);
    const assistedBefore = await service().getMovement(assisted.movementId);
    await renderEditor({ catalogueDefinitionId: "new", movementId: assisted.movementId });
    await pressNative("activity-editor-level-level-3");
    expect(nameInput().props.value).toBe("Squats sautés");
    fillParameters(["5", "1", "3"]);
    await press("activity-editor-finish-action");
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(mockBack).toHaveBeenCalled();
    const rows = await database.getAllAsync<{ id: string; movement_id: string }>(
      "SELECT id, movement_id FROM activity_definitions WHERE movement_id = ? ORDER BY id",
      [jumps.movementId],
    );
    expect(rows).toHaveLength(2);
    const created = (await service().listActivityDefinitions()).find(
      (definition) => definition.movementId === jumps.movementId && definition.id !== jumps.id,
    );
    expect(created?.executionParameters.series.workPhases.map((phase) => [phase.label, phase.durationSeconds])).toEqual([
      ["Élan", 5],
      ["Saut", 1],
      ["Réception", 3],
    ]);
    expect(await service().getMovement(jumps.movementId)).toEqual(jumpsBefore);
    expect(await service().getMovement(assisted.movementId)).toEqual(assistedBefore);
  });

  it("réserve de Circuit : séries inchangées (sans → sans), l'entrée suit la nouvelle occurrence ; séries modifiées (phases retirées), l'entrée est retirée (PRE-6)", async () => {
    const lunges = await create(input("Fentes", durationParameters(30, 3, 10), "Pas long"));
    const jumpLunges = await create(input("Fentes sautées", durationParameters(30, 3, 10), "Explosif"), {
      kind: "VARIANT",
      originMovementId: lunges.movementId,
      joinOriginGroup: true,
    });
    const created = await sessionService().createSession({
      ...createEmptyDraft(),
      name: "Fentes",
      exercises: [activityDefinitionToDraftExercise(lunges, "occ-f", null)],
    });
    if (!created.ok) throw new Error(JSON.stringify(created.violations));
    await renderEditor({ exerciseId: "occ-f" }, { ...toSessionDraft(created.value), circuitSeriesReserve: { "occ-f": RESERVE_ROWS } });
    await pressNative("activity-editor-level-level-2");
    await press("exercise-finish-action");
    const replaced = currentDraft.exercises[0]!;
    expect(replaced.sourceMovementId).toBe(jumpLunges.movementId);
    expect(currentDraft.circuitSeriesReserve).toEqual({ [replaced.id]: RESERVE_ROWS });
    screen.unmount();

    const { draft } = await sessionWithAssisted();
    await renderEditor({ exerciseId: "occ-1" }, { ...draft, circuitSeriesReserve: { "occ-1": RESERVE_ROWS } });
    await pressNative("activity-editor-level-level-2");
    await press("exercise-finish-action");
    expect(Object.keys(currentDraft.circuitSeriesReserve ?? {})).toEqual([]);
  });

  it("création dans une Séance sur un mouvement groupé repris : changement de niveau, Terminer → l'occurrence ajoutée porte le mouvement choisi et les phases transférées", async () => {
    const { assisted, jumps } = await threeLevels();
    await renderEditor({});
    fireEvent.changeText(nameInput(), "Squats sauté");
    await settle(10);
    await press(`movement-suggestion-result-${jumps.movementId}-use`);
    await settle(20);
    fillParameters(["7", "2", "4"]);
    expect(pastilleLabel()).toBe("Niveau 3");
    await pressNative("activity-editor-level-level-1");
    expect(nameInput().props.value).toBe("Squats assistés");
    await press("exercise-finish-action");
    expect(currentDraft.exercises).toHaveLength(1);
    const added = currentDraft.exercises[0]!;
    expect(added.sourceMovementId).toBe(assisted.movementId);
    expect(added.executionParameters.series.workPhases.map((phase) => [phase.label, phase.durationSeconds])).toEqual([
      ["Montée", 7],
      ["Descente", 2],
    ]);
  });

  it("Plus facile depuis un mouvement sans groupe : le nouveau niveau devient le niveau 1 d'un nouveau groupe", async () => {
    const alone = await create(input("Pompes", durationParameters(30, 3, 10), "Corps gainé"));
    await renderEditor({ catalogueDefinitionId: "new", levelOriginDefinitionId: alone.id, levelPlacement: "BEFORE_ORIGIN" });
    expect(pastilleLabel()).toBe("Niveau 1");
    fireEvent.changeText(nameInput(), "Pompes sur les genoux");
    await settle();
    await press("activity-editor-finish-action");
    const levels = await service().getMovementLevels(alone.movementId);
    expect(levels?.position).toEqual({ rank: 2, total: 2 });
    expect(levels?.levels.map((level) => level.movement.name)).toEqual(["Pompes sur les genoux", "Pompes"]);
  });
});
