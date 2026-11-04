import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Category } from "@/domain/categories/Category";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
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
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
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

let database: NodeSqliteDatabase;
let sequence = 0;
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
});

afterEach(() => {
  database.close();
});

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

const nameInput = () => screen.getByTestId("exercise-name-input");

// [PRE-9 A.3 du 04/11/2026 : « Exercice du Catalogue existant (édition directe) », « correction structurelle et étape de complétion » et « création sur un geste repris » retirés avec les anciennes définitions du Catalogue.]

/** Interrupteur natif « Passer » d'un frère à l'étape de complétion. */

/** Revue A2.2 : un accès verrouillé n'ouvre aucune feuille de référentiel au toucher. */
function expectReferenceAccessesClosed() {
  fireEvent.press(screen.getByTestId("activity-editor-category-button"));
  fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
  expect(screen.queryByTestId("category-picker-sheet")).toBeNull();
  expect(screen.queryByTestId("body-zone-picker-sheet")).toBeNull();
}



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

  it("occurrence d'un Mouvement enregistré : nom, description, Catégorie, Zones verrouillés, sans crayon (PRE-9, CE-MVT-01 §3 : C04 remplacé depuis une Séance) ; paramètres accessibles", async () => {
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
