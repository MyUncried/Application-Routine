import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import type { CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import type { ExecutionParameters, WorkPhase } from "@/domain/activities/ExecutionParameters";
import { uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Category } from "@/domain/categories/Category";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import type { DraftMovement, SessionDraft, SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { ExerciseScreen } from "@/features/sessions/ExerciseScreen";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { createTestMovement } from "@/infrastructure/database/testing/createTestMovement";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-7 story R-8 (D-448 points 1 et 2, défaut cr-8 de la recette JA2 ; matrice de
 * `spec-r-8-recherche-prefixe-variante.md`) — parcours sur les VRAIS services et une base SQLite
 * réelle, au Catalogue et en Séance : le panneau sous le nom s'ouvre sur une correspondance par
 * début de mot ; aucun lien « Rechercher un mouvement » dans l'éditeur ; l'étape de variante
 * survit à la fin de saisie (`endEditing`) et à un `changeText` du même texte, le nom saisi est
 * conservé avec l'invite grise. Mise en place reprise de `ExerciseScreen.r5.integration.test.tsx`.
 * Rappel : ces tests ne valent pas recette sur iPhone (JA).
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

let database: NodeSqliteDatabase;
let sequence = 0;
let updateDraft: jest.Mock;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
const movements = () => new SqliteMovementRepository(database, ids("grp"), () => NOW);
const service = () =>
  new ActivityDefinitionService(
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

/**
 * Mouvement « Squats » enregistré, à deux phases. [PRE-9 A.3 du 04/11/2026 : créé directement, sans
 * ancienne définition du Catalogue ; la création au Catalogue (`catalogueDefinitionId=new`) est
 * retirée avec elles : les cas « Catalogue » sont rejoués sur la création en Séance.]
 */
async function catalogueSquats(overrides: Partial<CreateActivityDefinitionInput> = {}) {
  return createTestMovement(database, input(overrides), { kind: "INDEPENDENT" }, ids("mov"), () => NOW);
}

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

/** Mouvements des cartes du panneau, dans l'ordre affiché. */
const resultIds = () =>
  screen
    .queryAllByTestId(/^movement-suggestion-result-.+-slot$/)
    .map((node) => String(node.props.testID).replace(/^movement-suggestion-result-(.+)-slot$/, "$1"));

/** Fin de saisie telle que le clavier iOS l'émet : `endEditing`, puis `changeText` du même texte. */
async function keyboardDismissedSameText() {
  const text = nameInput().props.value as string;
  await endNameEditing();
  fireEvent.changeText(nameInput(), text);
  await settle(10);
}

describe("PRE-7 R-8 — début de mot (D-448 point 1)", () => {
  it("Catalogue avec Squats et Squats sautés bas : « Squ » ouvre le panneau avec ces deux cartes", async () => {
    const squats = await catalogueSquats();
    const jumps = await catalogueSquats({ name: "Squats sautés bas" });
    await renderEditor({});
    await typeName("Squ");
    expect(screen.getByTestId("movement-suggestion-panel")).toBeTruthy();
    expect(resultIds()).toEqual([squats.movementId, jumps.movementId]);
    await typeName("Squats sau");
    // « Squats sau » : seul Squats sautés bas commence par ces deux mots, en tête ; Squats suit (R02).
    expect(resultIds()).toEqual([jumps.movementId, squats.movementId]);
  });

  it("Séance : « Squ » ouvre aussi le panneau", async () => {
    const squats = await catalogueSquats();
    await renderEditor({});
    await typeName("Squ");
    expect(resultIds()).toEqual([squats.movementId]);
  });

  it("hors étape de variante, la fin de saisie ferme un panneau ouvert par un seul début de mot", async () => {
    await catalogueSquats();
    await renderEditor({});
    await typeName("Squ");
    expect(screen.getByTestId("movement-suggestion-panel")).toBeTruthy();
    await endNameEditing();
    expect(screen.queryByTestId("movement-suggestion-panel")).toBeNull();
  });

  // Contre-recette iPhone du 30/10 (Hermann) : plus de limite à cinq résultats (R04 remplacé).
  it("plus de cinq débuts de mot : toutes les cartes, sans limite à cinq", async () => {
    for (const name of ["Squats A", "Squats B", "Squats C", "Squats D", "Squats E", "Squats F"]) {
      await catalogueSquats({ name });
    }
    await renderEditor({});
    await typeName("Squ");
    expect(resultIds()).toHaveLength(6);
  });
});

describe("PRE-7 R-8 — lien de recherche retiré (D-448 point 2)", () => {
  it("Catalogue et Séance, création disponible : aucun lien « Rechercher un mouvement »", async () => {
    await catalogueSquats();
    await renderEditor({});
    expect(screen.queryByTestId("activity-editor-movement-search")).toBeNull();
    expect(screen.queryByText(editor.movementSearch.open)).toBeNull();
    await typeName("Squ");
    expect(screen.queryByTestId("activity-editor-movement-search")).toBeNull();
    screen.unmount();

    await renderEditor({});
    expect(screen.queryByTestId("activity-editor-movement-search")).toBeNull();
    expect(screen.queryByText(editor.movementSearch.open)).toBeNull();
  });
});

// PRE-9 CAT.2 (CE-MVT-RESULT-01) : la carte Composition de l'éditeur d'Exercice n'a aucun bouton
// [remplace « Créer une variante » du panneau, R-5 C02] ; l'étape de variante et la fin de saisie
// (cr-8) sont vérifiées sur la fiche Mouvement (`MovementScreen.b2.integration.test.tsx`, CAT.2).
describe("PRE-9 CAT.2 — éditeur d'Exercice : cartes Composition, fin de saisie", () => {
  it("Catalogue et Séance : aucune étape de variante ; fin de saisie : panneau fermé, nom conservé ; la frappe le rouvre", async () => {
    const squats = await catalogueSquats();
    await renderEditor({});
    await typeName("Squ");
    expect(resultIds()).toEqual([squats.movementId]);
    expect(screen.queryByTestId(`movement-suggestion-result-${squats.movementId}-variant`)).toBeNull();
    await keyboardDismissedSameText();
    expect(screen.queryByTestId("movement-suggestion-panel")).toBeNull();
    expect(nameInput().props.value).toBe("Squ");
    await typeName("Squa");
    expect(resultIds()).toEqual([squats.movementId]);
    screen.unmount();

    await renderEditor({});
    await typeName("Squats");
    expect(screen.queryByTestId(`movement-suggestion-result-${squats.movementId}-variant`)).toBeNull();
    expect(screen.queryByTestId("movement-suggestion-back")).toBeNull();
    // Toucher de la carte (décision du 30/10/2026) : le Mouvement est repris, le panneau se ferme.
    await press(`movement-suggestion-result-${squats.movementId}`);
    expect(nameInput().props.value).toBe("Squats");
    expect(screen.queryByTestId("movement-suggestion-panel")).toBeNull();
  });
});
