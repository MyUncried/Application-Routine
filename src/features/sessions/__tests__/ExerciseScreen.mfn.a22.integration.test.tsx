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
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-7 story A2.2 (D-437, D-438, MFN-06, MFN-08, MFN-09 ; CE-T03-04 §3, §14 ; matrice de la spec
 * `spec-a2-2-contenu-partage-verrouillage.md`) — l'Éditeur d'Exercice sur les VRAIS services A1.3
 * et une base SQLite réelle (`node:sqlite`, schéma 012) : évaluation avant chaque enregistrement,
 * question d'identité conditionnelle et comptée (feuille `9952:44349`), Annuler sans écriture,
 * correction partagée, nouvelle identité, étape de complétion des durées manquantes des frères
 * (complétion passée → frère incomplet), création sur geste repris (lecture seule + crayon),
 * contenu d'occurrence verrouillé. Rappel : ces tests ne valent pas recette sur iPhone (JA).
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
const identity = editor.identityDecision;
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

/** Deux Exercices du même geste ; `used` : geste « déjà utilisé » (MFN-08). */
async function twoSharing(
  parameters: readonly [ExecutionParameters, ExecutionParameters] = [durationParameters(30, 3, 10), durationParameters(45, 4, 10)],
  used = true,
): Promise<{ first: ActivityDefinition; second: ActivityDefinition }> {
  const first = await created(await service().createActivityDefinitionWithOrigin(input(parameters[0]), { kind: "INDEPENDENT" }));
  const second = await created(
    await service().createActivityDefinitionWithOrigin(input(parameters[1]), { kind: "SAME_MOVEMENT", movementId: first.movementId }),
  );
  if (used) await movements().markUsed([first.movementId]);
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

describe("PRE-7 A2.2 — Exercice du Catalogue existant (édition directe)", () => {
  it("paramètres seuls, geste utilisé et partagé : enregistrement direct, aucune question (MFN/AC09)", async () => {
    const { first, second } = await twoSharing();
    await renderEditor({ catalogueDefinitionId: first.id });
    expect(nameInput().props.editable).not.toBe(false);
    expect(screen.queryByTestId("activity-editor-edit-movement")).toBeNull();
    decrementSeries();
    await finish();
    expect(screen.queryByTestId("identity-decision-sheet")).toBeNull();
    expect(mockBack).toHaveBeenCalled();
    const reread = await service().getActivityDefinition(first.id);
    expect(reread?.executionParameters.series).toMatchObject({ kind: "UNIFORM", count: 2 });
    expect((await service().getActivityDefinition(second.id))?.executionParameters.series).toMatchObject({ count: 4 });
  });

  it("nom changé, geste utilisé : feuille « Vous avez modifié Squat », portée calculée, libellés Catalogue ; Annuler rend le brouillon intact, rien n'est écrit (MFN/AC10)", async () => {
    const { first } = await twoSharing();
    const definitionsBefore = await definitionsRows();
    const movementsBefore = await movementsRows();
    await renderEditor({ catalogueDefinitionId: first.id });
    fireEvent.changeText(nameInput(), "Squat sauté");
    await finish();

    const sheet = screen.getByTestId("identity-decision-sheet");
    expect(within(sheet).getByText(identity.title.replace("{name}", "Squat"))).toBeTruthy();
    expect(within(sheet).getByText("1 autre exercice utilise ce geste.")).toBeTruthy();
    expect(within(sheet).getByText(identity.catalogue.correct)).toBeTruthy();
    expect(within(sheet).getByText(identity.catalogue.newIdentity)).toBeTruthy();
    expect(within(sheet).getByText("La correction s’applique aux 2 exercices qui l’utilisent")).toBeTruthy();
    expect(screen.queryByTestId("identity-decision-new-identity-detail")).toBeNull();
    expect(within(sheet).queryByText(identity.reprise.correct)).toBeNull();

    fireEvent.press(screen.getByTestId("identity-decision-cancel"));
    await settle();
    expect(screen.queryByTestId("identity-decision-sheet")).toBeNull();
    expect(nameInput().props.value).toBe("Squat sauté");
    expect(mockBack).not.toHaveBeenCalled();
    expect(await definitionsRows()).toEqual(definitionsBefore);
    expect(await movementsRows()).toEqual(movementsBefore);
    expect(screen.getByTestId("activity-editor-finish-action").props.accessibilityState).toMatchObject({ disabled: false });
  });

  it("Corriger cet exercice : le geste partagé est corrigé, tous ses Exercices relisent le nouveau nom (MFN/AC11)", async () => {
    const { first, second } = await twoSharing();
    await renderEditor({ catalogueDefinitionId: first.id });
    fireEvent.changeText(nameInput(), "Squat sauté");
    await finish();
    await act(async () => {
      fireEvent.press(screen.getByTestId("identity-decision-correct"));
    });
    await settle(50);
    expect(mockBack).toHaveBeenCalled();
    expect((await service().getActivityDefinition(first.id))?.name).toBe("Squat sauté");
    expect((await service().getActivityDefinition(second.id))?.name).toBe("Squat sauté");
  });

  it("Créer un nouvel exercice : nouveau geste portant le brouillon, sans rattachement ; l'original et son frère restent intacts (MFN/AC34)", async () => {
    const { first, second } = await twoSharing();
    await renderEditor({ catalogueDefinitionId: first.id });
    fireEvent.changeText(nameInput(), "Squat sauté");
    await finish();
    await act(async () => {
      fireEvent.press(screen.getByTestId("identity-decision-new-identity"));
    });
    await settle(50);
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

  it("geste non utilisé : nom changé, enregistrement direct sans question ; le frère relit le nom", async () => {
    const { first, second } = await twoSharing(undefined, false);
    await renderEditor({ catalogueDefinitionId: first.id });
    fireEvent.changeText(nameInput(), "Squat sauté");
    await finish();
    expect(screen.queryByTestId("identity-decision-sheet")).toBeNull();
    expect(mockBack).toHaveBeenCalled();
    expect((await service().getActivityDefinition(second.id))?.name).toBe("Squat sauté");
  });

  it("geste utilisé par un seul Exercice : question sans nombre (au-delà d'un seulement)", async () => {
    const only = await created(await service().createActivityDefinitionWithOrigin(input(durationParameters(30, 3, 10)), { kind: "INDEPENDENT" }));
    await movements().markUsed([only.movementId]);
    await renderEditor({ catalogueDefinitionId: only.id });
    fireEvent.changeText(nameInput(), "Squat sauté");
    await finish();
    expect(screen.getByTestId("identity-decision-sheet")).toBeTruthy();
    expect(screen.queryByTestId("identity-decision-others")).toBeNull();
    expect(screen.queryByTestId("identity-decision-correct-detail")).toBeNull();
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
    expect(within(screen.getByTestId("identity-decision-sheet")).getByText("1 autre exercice utilise ce geste.")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId("identity-decision-correct"));
    });
    await settle(50);

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
    await act(async () => {
      fireEvent.press(screen.getByTestId("identity-decision-correct"));
    });
    await settle(50);
    fireEvent.press(screen.getByTestId("sibling-completion-cancel"));
    await settle();
    expect(screen.queryByTestId("sibling-completion-step")).toBeNull();
    expect(await definitionsRows()).toEqual(definitionsBefore);
    expect(mockBack).not.toHaveBeenCalled();

    await finish();
    await act(async () => {
      fireEvent.press(screen.getByTestId("identity-decision-correct"));
    });
    await settle(50);
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

  it("reprise inchangée : contenu verrouillé, crayon « Modifier le geste », structure du geste reprise ; Terminer → même geste, aucune question", async () => {
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
    expect(screen.queryByTestId("identity-decision-sheet")).toBeNull();
    expect(mockBack).toHaveBeenCalled();
    const all = await service().listActivityDefinitions();
    expect(all).toHaveLength(3);
    expect(new Set(all.map((definition) => definition.movementId))).toEqual(new Set([first.movementId]));
    const phasesRows = await database.getAllAsync("SELECT * FROM movement_phases ORDER BY position");
    expect(phasesRows).toHaveLength(2);
  });

  it("crayon puis nom changé, geste utilisé : libellés de reprise, création en cours comptée ; En faire un geste distinct → nouveau geste, original intact", async () => {
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

    const sheet = screen.getByTestId("identity-decision-sheet");
    expect(within(sheet).getByText("2 autres exercices utilisent ce geste.")).toBeTruthy();
    expect(within(sheet).getByText(identity.reprise.correct)).toBeTruthy();
    expect(within(sheet).getByText(identity.reprise.newIdentity)).toBeTruthy();
    expect(within(sheet).getByText("La correction s’applique aux 3 exercices qui l’utilisent")).toBeTruthy();
    expect(within(sheet).getByText("Seul cet exercice change, Squat reste intact")).toBeTruthy();
    expect(within(sheet).queryByText(identity.catalogue.correct)).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByTestId("identity-decision-new-identity"));
    });
    await settle(50);
    expect(mockBack).toHaveBeenCalled();
    const all = await service().listActivityDefinitions();
    expect(all).toHaveLength(3);
    const created = all.find((definition) => definition.id !== first.id && definition.id !== second.id)!;
    expect(created.name).toBe("Squat sumo");
    expect(created.movementId).not.toBe(first.movementId);
    expect((await service().getActivityDefinition(first.id))?.name).toBe("Squat");
  });

  it("crayon puis nom changé, Corriger ce geste : un seul Exercice créé, le geste partagé est corrigé", async () => {
    const { first, second } = await twoSharing([phased(phases(6, 3)), phased(phases(8, 4))]);
    await renderEditor({ catalogueDefinitionId: "new", movementId: first.movementId });
    fireEvent.press(screen.getByTestId("activity-editor-edit-movement"));
    fireEvent.changeText(nameInput(), "Squat sumo");
    fillRepriseParameters();
    await finish();
    await act(async () => {
      fireEvent.press(screen.getByTestId("identity-decision-correct"));
    });
    await settle(50);
    expect(mockBack).toHaveBeenCalled();
    const all = await service().listActivityDefinitions();
    expect(all).toHaveLength(3);
    expect(new Set(all.map((definition) => definition.movementId))).toEqual(new Set([first.movementId]));
    expect((await service().getActivityDefinition(second.id))?.name).toBe("Squat sumo");
  });

  it("crayon puis phase ajoutée, Corriger ce geste : étape de complétion des deux frères (une durée saisie, l'autre passée) ; création sur le même geste", async () => {
    const { first, second } = await twoSharing([phased(phases(6, 3)), phased(phases(8, 4))]);
    await renderEditor({ catalogueDefinitionId: "new", movementId: first.movementId });
    fireEvent.press(screen.getByTestId("activity-editor-edit-movement"));
    fillRepriseParameters();
    addThirdPhase();
    await finish();
    await act(async () => {
      fireEvent.press(screen.getByTestId("identity-decision-correct"));
    });
    await settle(50);
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
    await movements().markUsed([first.movementId]);
    await renderEditor({ catalogueDefinitionId: "new", movementId: first.movementId });
    expect(screen.getByTestId("media-item-1")).toBeTruthy();
    expect(screen.getByTestId("media-item-1").props.accessibilityActions).toEqual([]);
    expect(screen.queryByTestId("media-add")).toBeNull();
    fillRepriseParameters();
    await finish();
    expect(screen.queryByTestId("identity-decision-sheet")).toBeNull();
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

  it("occurrence portant une filiation : nom, description, Catégorie, Zones verrouillés, aucun crayon ; paramètres accessibles", async () => {
    await renderEditor({ exerciseId: "occ-1" }, [occurrence({ sourceMovementId: "mov-1", instruction: "Dos droit" })]);
    expect(nameInput().props.editable).toBe(false);
    expect(screen.getByTestId("exercise-instruction-input").props.editable).toBe(false);
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("exercise-body-zones-open").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.queryByTestId("activity-editor-edit-movement")).toBeNull();
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
