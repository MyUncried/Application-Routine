import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import type { Movement } from "@/domain/activities/Movement";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Category } from "@/domain/categories/Category";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { MovementScreen } from "@/features/activities/MovementScreen";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-8 story B.2 (CE-MVT-01, recette MVT-01, 04, 06, 09, 10, 11) — fiche Mouvement sur les VRAIS
 * services et une base SQLite réelle (`node:sqlite`). Ces tests ne valent pas recette sur iPhone :
 * gabarit photo, clavier, défilement et rendu restent à contrôler par Hermann.
 */

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));
let mockUuid = 0;
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => `uuid-${++mockUuid}`) }));

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
let mockSearchParams: Record<string, string> = {};
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ back: mockBack, push: mockPush, replace: mockReplace }),
    useLocalSearchParams: () => mockSearchParams,
  };
});
const mockExitGuard = jest.fn((_shouldBlock: boolean) => ({ isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() }));
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: (shouldBlock: boolean) => mockExitGuard(shouldBlock),
}));
const lastShouldBlock = () => mockExitGuard.mock.calls.at(-1)![0];

const NOW = "2026-10-27T09:00:00.000Z";
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
const t = strings.screens.movement;

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
  mockReplace.mockReset();
  mockPush.mockReset();
  mockExitGuard.mockClear();
  mockSearchParams = {};
});

afterEach(() => {
  database.close();
});

const movement = (id: string, name: string, overrides: Partial<Movement> = {}): Movement => ({
  id,
  name,
  description: null,
  media: [],
  categoryId: "cardio",
  bodyZoneIds: ["cuisses"],
  phases: [],
  nextPhaseId: 1,
  aliases: [],
  levelGroup: null,
  ...overrides,
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

async function settle(ms = 0) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

async function renderSheet(params: Record<string, string> = {}) {
  mockSearchParams = params;
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service()}>
        <ReferentialServiceContext.Provider value={fakeReferential()}>
          <ProfileServiceContext.Provider value={fakeProfile()}>
            <MovementScreen />
          </ProfileServiceContext.Provider>
        </ReferentialServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  await settle();
  await settle(20);
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID, anyNode));
  });
  await settle(20);
}

async function type(testID: string, text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId(testID, anyNode), text);
  });
  await settle();
}

async function count(table: string): Promise<number> {
  return (await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`))!.count;
}

describe("PRE-8 B.2 — fiche Mouvement", () => {
  it("MVT-11 : gabarit photo, description et phases ; aucune carte Paramètres ni accordéon Médias ; pastille « Niveau »", async () => {
    await renderSheet();
    expect(screen.getByText(t.titles.create)).toBeTruthy();
    expect(screen.getByTestId("movement-photo-template", anyNode)).toBeTruthy();
    // Galerie du gabarit (l'ajout suit la capacité d'import du service, absente de cette doublure).
    expect(screen.getByTestId("media-gallery", anyNode)).toBeTruthy();
    expect(screen.getByTestId("movement-phases", anyNode)).toBeTruthy();
    expect(screen.getByTestId("movement-phases-invite", anyNode).props.placeholder).toBe(t.phases.firstPlaceholder);
    expect(screen.queryByTestId("exercise-section-parameters", anyNode)).toBeNull();
    expect(screen.queryByTestId("activity-editor-section-media", anyNode)).toBeNull();
    expect(screen.getByText(strings.screens.activities.editor.levelMenu.unsetLabel, anyNode)).toBeTruthy();
  });

  it("MVT-01 et MVT-09 : saisie des phases (libellés seuls, identités successives) ; Terminer indisponible sans Catégorie", async () => {
    await renderSheet();
    await type("exercise-name-input", "Burpees");
    // Catégorie et Zones sont exigées par les règles existantes : posées directement sur le brouillon
    // par les feuilles réelles serait long ; on vérifie ici le contrat de Terminer.
    expect(screen.getByTestId("movement-finish-action", anyNode).props.accessibilityState).toMatchObject({ disabled: true });
    await type("movement-phases-invite", "Descente");
    // Le focus passe sur la phase créée ; l'invite suivante n'apparaît qu'en saisie dans le bloc.
    await act(async () => {
      fireEvent(screen.getByTestId("movement-phases-label-1", anyNode), "focus");
    });
    await type("movement-phases-invite", "Saut");
    expect(screen.getByTestId("movement-phases-label-2", anyNode).props.value).toBe("Saut");
    expect(lastShouldBlock()).toBe(true);
  });

  it("MVT-04 : consultation en lecture seule, crayon → édition ; aucun doublon", async () => {
    await movements().create(movement("m1", "Pompes", { phases: [{ id: 1, label: "Descente" }], nextPhaseId: 2 }));
    await renderSheet({ movementId: "m1" });
    expect(screen.getByText(t.titles.consult)).toBeTruthy();
    expect(screen.getByTestId("exercise-name-input", anyNode).props.editable).toBe(false);
    expect(screen.getByTestId("movement-phases-label-1", anyNode).props.children).toBe("Descente");
    expect(screen.getByTestId("movement-finish-action", anyNode).props.accessibilityState).toMatchObject({ disabled: true });
    await press("activity-editor-edit-movement");
    expect(screen.getByText(t.titles.edit)).toBeTruthy();
    expect(screen.getByTestId("exercise-name-input", anyNode).props.editable).toBe(true);
    expect(await count("movements")).toBe(1);
  });

  it("MVT-06 : sans changement, Terminer revient sans écrire ; contenu modifié sans usage : mise à jour silencieuse", async () => {
    await movements().create(movement("m1", "Pompes"));
    await renderSheet({ movementId: "m1" });
    await press("activity-editor-edit-movement");
    await press("movement-finish-action");
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("movement-save-dialog", anyNode)).toBeNull();

    await type("movement-phases-invite", "Montée");
    await press("movement-finish-action");
    expect(screen.queryByTestId("movement-save-dialog", anyNode)).toBeNull();
    expect((await movements().findById("m1"))!.phases).toEqual([{ id: 1, label: "Montée" }]);
  });

  it("MVT-06 : contenu modifié avec un Exercice lié → confirmation ; nom modifié → choix sans présélection, détail « Uniquement pour cet exercice » absent", async () => {
    await movements().create(movement("m1", "Pompes"));
    await new SqliteSessionRepository(database, ids("ses"), () => NOW).create({
      name: "Séance",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises: [{ type: "EXERCISE", structuralPosition: "IN_TOUR", executionParameters: durationParameters(30), postActivityRecoverySeconds: 0, sourceMovementId: "m1" }],
    });
    await renderSheet({ movementId: "m1" });
    await press("activity-editor-edit-movement");
    await type("movement-phases-invite", "Descente");
    await press("movement-finish-action");
    expect(screen.getByTestId("movement-save-dialog", anyNode)).toBeTruthy();
    expect(screen.queryByTestId("movement-save-choice-UPDATE", anyNode)).toBeNull();
    // Annuler : brouillon intact, aucune écriture.
    await press("movement-save-cancel");
    expect((await movements().findById("m1"))!.phases).toEqual([]);

    await type("exercise-name-input", "Pompes larges");
    await press("movement-finish-action");
    expect(screen.getByTestId("movement-save-choice-NEW_MOVEMENT", anyNode)).toBeTruthy();
    expect(screen.queryByText(strings.screens.activities.editor.movementSave.newMovementDetail, anyNode)).toBeNull();
    expect(screen.getByTestId("movement-save-confirm", anyNode).props.accessibilityState).toMatchObject({ disabled: true });
    await press("movement-save-choice-NEW_MOVEMENT");
    await press("movement-save-confirm");
    // Créer un nouveau mouvement : l'original et son Exercice restent inchangés.
    expect((await movements().findById("m1"))!.name).toBe("Pompes");
    expect(await count("movements")).toBe(2);
    expect(await database.getFirstAsync("SELECT source_movement_id FROM activities")).toEqual({ source_movement_id: "m1" });
    expect(mockBack).toHaveBeenCalled();
  });

  it("MVT-05 : « Ajouter un niveau » — formulaire vierge sauf Catégorie, Zones et nom commencé ; invite non persistée", async () => {
    await movements().create(movement("squat", "Squats", { description: "Buste droit", phases: [{ id: 1, label: "Descente" }], nextPhaseId: 2 }));
    await renderSheet({ variantOf: "squat", placement: "AFTER_ORIGIN" });
    expect(screen.getByTestId("exercise-name-input", anyNode).props.value).toBe("Squats");
    expect(screen.getByTestId("exercise-name-hint", anyNode)).toBeTruthy();
    expect(screen.queryByTestId("movement-phases-label-1", anyNode)).toBeNull();
    await type("exercise-name-input", "Squats sautés");
    expect(screen.queryByTestId("exercise-name-hint", anyNode)).toBeNull();
    await press("movement-finish-action");
    const families = await service().movementCatalogue!.listFamilies();
    expect(families[0]!.members.map((entry) => [entry.movement.name, entry.level])).toEqual([
      ["Squats", { rank: 1, total: 2 }],
      ["Squats sautés", { rank: 2, total: 2 }],
    ]);
    const created = families[0]!.members[1]!.movement;
    expect(created).toMatchObject({ description: null, phases: [], categoryId: "cardio", bodyZoneIds: ["cuisses"] });
  });

  it("MVT-10 : erreur d'enregistrement — saisie conservée, message affiché, nouvel essai possible", async () => {
    await movements().create(movement("m1", "Pompes"));
    await renderSheet({ movementId: "m1" });
    await press("activity-editor-edit-movement");
    await type("movement-phases-invite", "Descente");
    database.close();
    await press("movement-finish-action");
    expect(screen.getByTestId("movement-save-error", anyNode)).toBeTruthy();
    expect(screen.getByTestId("movement-phases-label-1", anyNode).props.value).toBe("Descente");
    expect(mockBack).not.toHaveBeenCalled();
    database = NodeSqliteDatabase.openInMemory();
  });
});
