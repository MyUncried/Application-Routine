import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";

import type { CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Category } from "@/domain/categories/Category";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import {
  createEmptyDraft,
  type SessionDraft,
} from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { ExerciseScreen } from "@/features/sessions/ExerciseScreen";
import { SessionDraftContext, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
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

// PRE-9 (recette iPhone du 29/10 ; CE-MVT-01 §3, §13, DSF Mouvements l.67, ch13 l.268) : « occurrence de Séance, crayon (C04) » (R-4) retiré —
// depuis une Séance, le Mouvement repris reste en lecture seule, sans crayon (C04 remplacé sur ce point).
// Couverture du nouveau parcours : ExerciseScreen.sessionMovement.integration.test.tsx.
