import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";

import type { ActivityDefinition, CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import type { ExecutionParameters, WorkPhase } from "@/domain/activities/ExecutionParameters";
import { durationParameters, uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Category } from "@/domain/categories/Category";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import {
  chooseExecutionSide,
  enterExecutionSheetCell,
  pressInExecutionSheet,
  tapExecutionSheetStep,
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
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-7 story A2.2 (D-437, D-438, MFN-06, MFN-08, MFN-09 ; CE-T03-04 §3, §14 ; matrice de la spec
 * `spec-a2-2-contenu-partage-verrouillage.md`) — l'Éditeur d'Exercice sur les VRAIS services A1.3
 * et une base SQLite réelle (`node:sqlite`, schéma 012) : évaluation avant chaque enregistrement,
 * correction partagée, nouvelle identité, étape de complétion des durées manquantes des frères
 * (complétion passée → frère incomplet), création sur geste repris (lecture seule + crayon),
 * contenu d'occurrence verrouillé. PRE-7 (R-4, D-445 C03) : la question d'identité de MFN-08 est
 * remplacée par le dialogue unique de sauvegarde (`MovementSaveDialog`) — nom modifié → choix,
 * contenu modifié avec d'autres exercices → confirmation, sinon silence ; portée = autres
 * exercices (définitions et occurrences persistées). Rappel : ces tests ne valent pas recette sur
 * iPhone (JA).
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

const NOW = "2026-10-24T09:00:00.000Z";
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
const completion = editor.siblingCompletion;

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

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  mockBack.mockReset();
  mockSearchParams = {};
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

const input = (parameters: ExecutionParameters, overrides: Partial<CreateActivityDefinitionInput> = {}): CreateActivityDefinitionInput => ({
  name: "Squat",
  description: "Buste droit",
  category: { kind: "EXISTING", categoryId: "cardio" },
  bodyZoneIds: ["cuisses"],
  executionParameters: parameters,
  ...overrides,
});

async function created(result: Awaited<ReturnType<ActivityDefinitionService["createActivityDefinitionWithOrigin"]>>) {
  if (result.status !== "CREATED") throw new Error(result.status);
  return result.value;
}

/**
 * PRE-7 (R-3, D-445 C03, qui retire l'indicateur irréversible « déjà utilisé » de MFN-08) : un
 * Mouvement est utilisé par un autre exercice — ici une occurrence de Séance persistée qui le
 * référence (identifiants de Séance propres, sans effet sur ceux des définitions).
 */
let sessionSequence = 0;
async function persistOccurrenceOf(movementId: string): Promise<void> {
  await new SqliteSessionRepository(database, () => `ses-${++sessionSequence}`, () => NOW).create({
    name: "Utilisation",
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    tourRepeatCount: 1,
    exercises: [
      {
        type: "EXERCISE",
        structuralPosition: "IN_TOUR",
        executionParameters: durationParameters(30, 3, 10),
        postActivityRecoverySeconds: null,
        sourceMovementId: movementId,
      },
    ],
  });
}

/** Deux Exercices du même geste ; `used` : geste aussi utilisé par une occurrence de Séance (C03). */
async function twoSharing(
  parameters: readonly [ExecutionParameters, ExecutionParameters] = [durationParameters(30, 3, 10), durationParameters(45, 4, 10)],
  used = true,
): Promise<{ first: ActivityDefinition; second: ActivityDefinition }> {
  const first = await created(await service().createActivityDefinitionWithOrigin(input(parameters[0]), { kind: "INDEPENDENT" }));
  const second = await created(
    await service().createActivityDefinitionWithOrigin(input(parameters[1]), { kind: "SAME_MOVEMENT", movementId: first.movementId }),
  );
  if (used) await persistOccurrenceOf(first.movementId);
  return { first, second };
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
  return { getProfile: jest.fn(async () => createDefaultProfile("profile-1", NOW)) } as unknown as ProfileService;
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
                updateDraft: jest.fn(),
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

async function finish() {
  await act(async () => {
    fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
  });
  await settle(50);
}

/** Feuille des paramètres : nombre de séries diminué d'un (paramètre seul), puis ✓. */
function decrementSeries() {
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  tapExecutionSheetStep("execution-sheet-series-decrement");
  fireEvent.press(screen.getByTestId("execution-sheet-validate"));
  expect(screen.queryByTestId("execution-sheet")).toBeNull();
}

const nameInput = () => screen.getByTestId("exercise-name-input");

/** PRE-7 (R-4, C03) : choix explicite du dialogue de nom modifié, puis Confirmer. */
async function chooseAndConfirm(choice: "UPDATE" | "NEW_MOVEMENT") {
  fireEvent.press(screen.getByTestId(`movement-save-choice-${choice}`));
  await confirmSave();
}

/** PRE-7 (R-4, C03) : Confirmer du dialogue de sauvegarde. */
async function confirmSave() {
  await act(async () => {
    fireEvent.press(screen.getByTestId("movement-save-confirm"));
  });
  await settle(50);
}

describe("PRE-7 A2.2 — Exercice du Catalogue existant (édition directe)", () => {
  it("paramètres seuls, geste utilisé et partagé : enregistrement direct, aucune question (MFN/AC09)", async () => {
    const { first, second } = await twoSharing();
    await renderEditor({ catalogueDefinitionId: first.id });
    expect(nameInput().props.editable).not.toBe(false);
    expect(screen.queryByTestId("activity-editor-edit-movement")).toBeNull();
    decrementSeries();
    await finish();
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(mockBack).toHaveBeenCalled();
    const reread = await service().getActivityDefinition(first.id);
    expect(reread?.executionParameters.series).toMatchObject({ kind: "UNIFORM", count: 2 });
    expect((await service().getActivityDefinition(second.id))?.executionParameters.series).toMatchObject({ count: 4 });
  });

  it("nom changé, mouvement utilisé : dialogue « Vous souhaitez : », portée calculée (frère + occurrence), aucune présélection ; Annuler rend le brouillon intact, rien n'est écrit (C03)", async () => {
    const { first } = await twoSharing();
    const definitionsBefore = await definitionsRows();
    const movementsBefore = await movementsRows();
    await renderEditor({ catalogueDefinitionId: first.id });
    fireEvent.changeText(nameInput(), "Squat sauté");
    await finish();

    const dialog = screen.getByTestId("movement-save-dialog");
    expect(within(dialog).getByText(movementSave.choiceTitle)).toBeTruthy();
    expect(within(dialog).getByText("2 autres exercices utilisent ce mouvement.")).toBeTruthy();
    expect(within(dialog).getByText(movementSave.update)).toBeTruthy();
    expect(within(dialog).getByText(movementSave.newMovement)).toBeTruthy();
    expect(screen.getByTestId("movement-save-confirm").props.accessibilityState).toMatchObject({ disabled: true });

    fireEvent.press(screen.getByTestId("movement-save-cancel"));
    await settle();
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(nameInput().props.value).toBe("Squat sauté");
    expect(mockBack).not.toHaveBeenCalled();
    expect(await definitionsRows()).toEqual(definitionsBefore);
    expect(await movementsRows()).toEqual(movementsBefore);
    expect(screen.getByTestId("activity-editor-finish-action").props.accessibilityState).toMatchObject({ disabled: false });
  });

  it("Mettre à jour ce mouvement : le mouvement partagé est corrigé, tous ses Exercices relisent le nouveau nom (MFN/AC11, C03)", async () => {
    const { first, second } = await twoSharing();
    await renderEditor({ catalogueDefinitionId: first.id });
    fireEvent.changeText(nameInput(), "Squat sauté");
    await finish();
    await chooseAndConfirm("UPDATE");
    expect(mockBack).toHaveBeenCalled();
    expect((await service().getActivityDefinition(first.id))?.name).toBe("Squat sauté");
    expect((await service().getActivityDefinition(second.id))?.name).toBe("Squat sauté");
  });

  it("Créer un nouveau mouvement : nouveau mouvement portant le brouillon, sans rattachement (Q10) ; l'original et son frère restent intacts (MFN/AC34, C03)", async () => {
    const { first, second } = await twoSharing();
    await renderEditor({ catalogueDefinitionId: first.id });
    fireEvent.changeText(nameInput(), "Squat sauté");
    await finish();
    await chooseAndConfirm("NEW_MOVEMENT");
    expect(mockBack).toHaveBeenCalled();
    const all = await service().listActivityDefinitions();
    expect(all).toHaveLength(3);
    const created = all.find((definition) => definition.id !== first.id && definition.id !== second.id)!;
    expect(created.name).toBe("Squat sauté");
    expect(created.movementId).not.toBe(first.movementId);
    expect((await service().getActivityDefinition(first.id))?.name).toBe("Squat");
    expect((await service().getActivityDefinition(second.id))?.name).toBe("Squat");
    expect((await movements().findById(created.movementId))?.levelGroup).toBeNull();
  });

  // PRE-7 (R-4, D-445 C03) : un nom enregistré modifié ouvre TOUJOURS le choix, même sans autre
  // exercice (portée zéro annoncée) ; « autres exercices » = définitions et occurrences persistées.
  it("mouvement seul (aucun autre exercice) : nom changé → choix, « Aucun autre exercice… » ; Mettre à jour → nom enregistré", async () => {
    const only = await created(await service().createActivityDefinitionWithOrigin(input(durationParameters(30, 3, 10)), { kind: "INDEPENDENT" }));
    await renderEditor({ catalogueDefinitionId: only.id });
    fireEvent.changeText(nameInput(), "Squat sauté");
    await finish();
    expect(within(screen.getByTestId("movement-save-dialog")).getByText(movementSave.noOther)).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
    await chooseAndConfirm("UPDATE");
    expect(mockBack).toHaveBeenCalled();
    expect((await service().getActivityDefinition(only.id))?.name).toBe("Squat sauté");
  });

  it("mouvement partagé par un frère, sans occurrence de Séance : choix, « 1 autre exercice… » ; Mettre à jour → le frère relit le nom", async () => {
    const { first, second } = await twoSharing(undefined, false);
    await renderEditor({ catalogueDefinitionId: first.id });
    fireEvent.changeText(nameInput(), "Squat sauté");
    await finish();
    expect(within(screen.getByTestId("movement-save-dialog")).getByText("1 autre exercice utilise ce mouvement.")).toBeTruthy();
    await chooseAndConfirm("UPDATE");
    expect(mockBack).toHaveBeenCalled();
    expect((await service().getActivityDefinition(second.id))?.name).toBe("Squat sauté");
  });

  it("mouvement utilisé par une seule occurrence de Séance : l'occurrence compte comme autre exercice", async () => {
    const only = await created(await service().createActivityDefinitionWithOrigin(input(durationParameters(30, 3, 10)), { kind: "INDEPENDENT" }));
    await persistOccurrenceOf(only.movementId);
    await renderEditor({ catalogueDefinitionId: only.id });
    fireEvent.changeText(nameInput(), "Squat sauté");
    await finish();
    expect(within(screen.getByTestId("movement-save-dialog")).getByText("1 autre exercice utilise ce mouvement.")).toBeTruthy();
  });
});

/** Feuille des paramètres : troisième phase ajoutée (changement structurel du geste), durée 2 s, puis ✓. */
function addThirdPhase() {
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  fireEvent.press(screen.getByTestId("execution-sheet-phase-count-toggle"));
  fireEvent(screen.getByTestId("execution-sheet-phase-count-increment"), "pressIn");
  fireEvent(screen.getByTestId("execution-sheet-phase-count-increment"), "pressOut");
  enterExecutionSheetCell("execution-sheet-phase-row-3-duration", "2");
  fireEvent.press(screen.getByTestId("execution-sheet-validate"));
  expect(screen.queryByTestId("execution-sheet")).toBeNull();
}

/** Interrupteur natif « Passer » d'un frère à l'étape de complétion. */
function skipSibling(definitionId: string) {
  fireEvent(screen.getByTestId(`sibling-completion-${definitionId}-skip`), "valueChange", true);
}

/** Revue A2.2 : un accès verrouillé n'ouvre aucune feuille de référentiel au toucher. */
function expectReferenceAccessesClosed() {
  fireEvent.press(screen.getByTestId("activity-editor-category-button"));
  fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
  expect(screen.queryByTestId("category-picker-sheet")).toBeNull();
  expect(screen.queryByTestId("body-zone-picker-sheet")).toBeNull();
}

describe("PRE-7 A2.2 — correction structurelle et étape de complétion (MFN-08, MFN/AC23, MFN/AC24)", () => {
  it("Corriger, puis complétion du frère passée : l'édité est complet, le frère est conservé incomplet (phase 3), rien d'inventé", async () => {
    const { first, second } = await twoSharing([phased(phases(6, 3)), phased(phases(8, 4))]);
    await renderEditor({ catalogueDefinitionId: first.id });
    await addThirdPhase();
    await finish();
    // PRE-7 (R-4, C03) : nom inchangé, structure modifiée, frère et occurrence → confirmation.
    const dialog = screen.getByTestId("movement-save-dialog");
    expect(within(dialog).getByText(movementSave.confirmTitle)).toBeTruthy();
    expect(
      within(dialog).getByText(`2 autres exercices utilisent ce mouvement. ${movementSave.appliesToAll}`),
    ).toBeTruthy();
    expect(screen.queryByTestId("movement-save-choice-UPDATE")).toBeNull();
    await confirmSave();

    const step = screen.getByTestId("sibling-completion-step");
    expect(within(step).getByText(completion.title)).toBeTruthy();
    const field = screen.getByTestId(`sibling-completion-${second.id}-phase-3`);
    expect(field.props.value).toBe("");
    expect(field.props.placeholder).toBe(completion.unset);
    expect(screen.getByTestId("sibling-completion-finish").props.accessibilityState).toMatchObject({ disabled: true });
    expect(mockBack).not.toHaveBeenCalled();

    // Revue A2.2 : une saisie suivie de « Passer » n'est ni affichée ni transmise ; « 00:00 » n'est
    // jamais une durée (reste à renseigner, aucune valeur ramenée en silence à 1 s).
    fireEvent.changeText(field, "0");
    expect(screen.getByTestId(`sibling-completion-${second.id}-phase-3`).props.value).toBe("00:00");
    expect(screen.getByTestId("sibling-completion-finish").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.changeText(screen.getByTestId(`sibling-completion-${second.id}-phase-3`), "00:005");
    skipSibling(second.id);
    expect(screen.getByTestId(`sibling-completion-${second.id}-skipped`)).toBeTruthy();
    expect(screen.getByTestId(`sibling-completion-${second.id}-phase-3`).props.value).toBe("");
    expect(screen.getByTestId(`sibling-completion-${second.id}-phase-3`).props.editable).toBe(false);
    expect(screen.getByTestId("sibling-completion-finish").props.accessibilityState).toMatchObject({ disabled: false });
    await act(async () => {
      fireEvent.press(screen.getByTestId("sibling-completion-finish"));
    });
    await settle(50);

    expect(mockBack).toHaveBeenCalled();
    const edited = await service().getActivityDefinition(first.id);
    expect(edited?.missingPhaseIds).toBeUndefined();
    const sibling = await service().getActivityDefinition(second.id);
    expect(sibling?.missingPhaseIds).toEqual([3]);
  });

  it("complétion saisie pour le frère : durée enregistrée par phaseId, frère exécutable ; Annuler de l'étape n'écrit rien", async () => {
    const { first, second } = await twoSharing([phased(phases(6, 3)), phased(phases(8, 4))]);
    const definitionsBefore = await definitionsRows();
    await renderEditor({ catalogueDefinitionId: first.id });
    await addThirdPhase();
    await finish();
    await confirmSave();
    fireEvent.press(screen.getByTestId("sibling-completion-cancel"));
    await settle();
    expect(screen.queryByTestId("sibling-completion-step")).toBeNull();
    expect(await definitionsRows()).toEqual(definitionsBefore);
    expect(mockBack).not.toHaveBeenCalled();

    await finish();
    await confirmSave();
    fireEvent.changeText(screen.getByTestId(`sibling-completion-${second.id}-phase-3`), "5");
    expect(screen.getByTestId(`sibling-completion-${second.id}-phase-3`).props.value).toBe("00:05");
    await act(async () => {
      fireEvent.press(screen.getByTestId("sibling-completion-finish"));
    });
    await settle(50);
    expect(mockBack).toHaveBeenCalled();
    const sibling = await service().getActivityDefinition(second.id);
    expect(sibling?.missingPhaseIds).toBeUndefined();
    const series = sibling?.executionParameters.series;
    expect(series?.kind === "UNIFORM" ? series.workPhases.map((phase) => [phase.id, phase.durationSeconds]) : null).toEqual([
      [1, 8],
      [2, 4],
      [3, 5],
    ]);
  });
});

describe("PRE-7 A2.2 — création sur un geste repris (contenu en lecture seule + crayon)", () => {
  /** Paramètres du nouvel Exercice : durées des deux phases du geste et côté. */
  function fillRepriseParameters() {
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

  it("reprise inchangée : contenu verrouillé, crayon « Modifier le mouvement », structure reprise ; Terminer → même mouvement, aucun dialogue", async () => {
    const { first } = await twoSharing([phased(phases(6, 3)), phased(phases(8, 4))]);
    await renderEditor({ catalogueDefinitionId: "new", movementId: first.movementId });
    expect(screen.getByText(editor.titleAdd)).toBeTruthy();
    expect(nameInput().props.value).toBe("Squat");
    expect(nameInput().props.editable).toBe(false);
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("exercise-body-zones-open").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("exercise-instruction-input").props.editable).toBe(false);
    expect(screen.getByTestId("activity-editor-edit-movement").props.accessibilityLabel).toBe(editor.editMovement);
    // Revue A2.2 : accès verrouillés sans effet au toucher ; structure des phases verrouillée.
    expectReferenceAccessesClosed();
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    expect(screen.getByTestId("execution-sheet-phase-count-toggle").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));

    fillRepriseParameters();
    await finish();
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(mockBack).toHaveBeenCalled();
    const all = await service().listActivityDefinitions();
    expect(all).toHaveLength(3);
    expect(new Set(all.map((definition) => definition.movementId))).toEqual(new Set([first.movementId]));
    const phasesRows = await database.getAllAsync("SELECT * FROM movement_phases ORDER BY position");
    expect(phasesRows).toHaveLength(2);
  });

  it("crayon puis nom changé : choix, autres exercices = deux définitions + une occurrence ; Créer un nouveau mouvement → nouveau mouvement, original intact", async () => {
    const { first, second } = await twoSharing([phased(phases(6, 3)), phased(phases(8, 4))]);
    await renderEditor({ catalogueDefinitionId: "new", movementId: first.movementId });
    fireEvent.press(screen.getByTestId("activity-editor-edit-movement"));
    expect(screen.queryByTestId("activity-editor-edit-movement")).toBeNull();
    expect(nameInput().props.editable).not.toBe(false);
    // Revue A2.2 : le crayon déverrouille aussi Description, Catégorie, Zones et structure.
    expect(screen.getByTestId("exercise-instruction-input").props.editable).not.toBe(false);
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityState?.disabled).not.toBe(true);
    expect(screen.getByTestId("exercise-body-zones-open").props.accessibilityState?.disabled).not.toBe(true);
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    expect(screen.getByTestId("execution-sheet-phase-count-toggle").props.accessibilityState?.disabled).not.toBe(true);
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    fireEvent.changeText(nameInput(), "Squat sumo");
    fillRepriseParameters();
    await finish();

    const dialog = screen.getByTestId("movement-save-dialog");
    expect(within(dialog).getByText(movementSave.choiceTitle)).toBeTruthy();
    expect(within(dialog).getByText("3 autres exercices utilisent ce mouvement.")).toBeTruthy();
    await chooseAndConfirm("NEW_MOVEMENT");
    expect(mockBack).toHaveBeenCalled();
    const all = await service().listActivityDefinitions();
    expect(all).toHaveLength(3);
    const created = all.find((definition) => definition.id !== first.id && definition.id !== second.id)!;
    expect(created.name).toBe("Squat sumo");
    expect(created.movementId).not.toBe(first.movementId);
    expect((await service().getActivityDefinition(first.id))?.name).toBe("Squat");
  });

  it("crayon puis nom changé, Mettre à jour ce mouvement : un seul Exercice créé, le mouvement partagé est corrigé", async () => {
    const { first, second } = await twoSharing([phased(phases(6, 3)), phased(phases(8, 4))]);
    await renderEditor({ catalogueDefinitionId: "new", movementId: first.movementId });
    fireEvent.press(screen.getByTestId("activity-editor-edit-movement"));
    fireEvent.changeText(nameInput(), "Squat sumo");
    fillRepriseParameters();
    await finish();
    await chooseAndConfirm("UPDATE");
    expect(mockBack).toHaveBeenCalled();
    const all = await service().listActivityDefinitions();
    expect(all).toHaveLength(3);
    expect(new Set(all.map((definition) => definition.movementId))).toEqual(new Set([first.movementId]));
    expect((await service().getActivityDefinition(second.id))?.name).toBe("Squat sumo");
  });

  it("crayon puis phase ajoutée, Confirmer : étape de complétion des deux frères (une durée saisie, l'autre passée) ; création sur le même mouvement", async () => {
    const { first, second } = await twoSharing([phased(phases(6, 3)), phased(phases(8, 4))]);
    await renderEditor({ catalogueDefinitionId: "new", movementId: first.movementId });
    fireEvent.press(screen.getByTestId("activity-editor-edit-movement"));
    fillRepriseParameters();
    addThirdPhase();
    await finish();
    expect(within(screen.getByTestId("movement-save-dialog")).getByText(movementSave.confirmTitle)).toBeTruthy();
    await confirmSave();
    fireEvent.changeText(screen.getByTestId(`sibling-completion-${first.id}-phase-3`), "4");
    skipSibling(second.id);
    await act(async () => {
      fireEvent.press(screen.getByTestId("sibling-completion-finish"));
    });
    await settle(50);
    expect(mockBack).toHaveBeenCalled();
    const all = await service().listActivityDefinitions();
    expect(all).toHaveLength(3);
    expect(new Set(all.map((definition) => definition.movementId))).toEqual(new Set([first.movementId]));
    const completed = (await service().getActivityDefinition(first.id))?.executionParameters.series;
    expect(completed?.kind === "UNIFORM" ? completed.workPhases.map((phase) => [phase.id, phase.durationSeconds]) : null).toEqual([
      [1, 6],
      [2, 3],
      [3, 4],
    ]);
    expect((await service().getActivityDefinition(second.id))?.missingPhaseIds).toEqual([3]);
    const createdOne = all.find((definition) => definition.id !== first.id && definition.id !== second.id)!;
    expect(createdOne.missingPhaseIds).toBeUndefined();
  });

  it("geste repris à médias : tuiles en lecture seule, sans ajout ; reprise inchangée sans question, médias du geste intacts", async () => {
    const asset = {
      id: "p1",
      uri: "kodjo-media/p1.jpg",
      createdAt: NOW,
      kind: "PHOTO" as const,
      mimeType: "image/jpeg",
      fileName: null,
      sizeBytes: 10,
      durationMs: null,
      width: 1,
      height: 1,
    };
    const first = await created(
      await service().createActivityDefinitionWithOrigin(input(phased(phases(6, 3)), { media: [{ assetId: "p1", asset }] }), {
        kind: "INDEPENDENT",
      }),
    );
    await persistOccurrenceOf(first.movementId);
    await renderEditor({ catalogueDefinitionId: "new", movementId: first.movementId });
    expect(screen.getByTestId("media-item-1")).toBeTruthy();
    expect(screen.getByTestId("media-item-1").props.accessibilityActions).toEqual([]);
    expect(screen.queryByTestId("media-add")).toBeNull();
    fillRepriseParameters();
    await finish();
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(mockBack).toHaveBeenCalled();
    expect(await database.getAllAsync("SELECT movement_id, asset_id FROM movement_media")).toEqual([
      { movement_id: first.movementId, asset_id: "p1" },
    ]);
  });

  it("geste repris introuvable : erreur de chargement existante, aucun formulaire", async () => {
    await renderEditor({ catalogueDefinitionId: "new", movementId: "inconnu" });
    expect(screen.getByTestId("activity-editor-load-error")).toBeTruthy();
    expect(screen.queryByTestId("exercise-name-input")).toBeNull();
  });
});

describe("PRE-7 A2.2 — occurrence de Séance (MFN-09, MFN/AC28, MFN/AC29)", () => {
  const occurrence = (overrides: Partial<SessionDraftExercise>): SessionDraftExercise => ({
    ...createExerciseDraft("occ-1", null),
    name: "Fentes",
    bodyZoneIds: ["cuisses"],
    categoryId: "cardio",
    executionParameters: durationParameters(30, 3, 10),
    sideMode: "UNILATERAL",
    ...overrides,
  });

  it("occurrence d'un Mouvement enregistré : nom, description, Catégorie, Zones verrouillés, crayon « Modifier le mouvement » (R-4, C04) ; paramètres accessibles", async () => {
    await renderEditor({ exerciseId: "occ-1" }, [occurrence({ sourceMovementId: "mov-1", instruction: "Dos droit" })]);
    expect(nameInput().props.editable).toBe(false);
    expect(screen.getByTestId("exercise-instruction-input").props.editable).toBe(false);
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("exercise-body-zones-open").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("activity-editor-edit-movement").props.accessibilityLabel).toBe(editor.editMovement);
    expect(screen.queryByTestId("media-add")).toBeNull();
    expectReferenceAccessesClosed();
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
  });

  it("création locale (sans filiation) : contenu modifiable jusqu'au premier enregistrement de la Séance", async () => {
    await renderEditor({ exerciseId: "occ-1" }, [occurrence({ sourceMovementId: "" })]);
    expect(nameInput().props.editable).not.toBe(false);
    expect(screen.getByTestId("exercise-instruction-input").props.editable).not.toBe(false);
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityState?.disabled).not.toBe(true);
  });
});
