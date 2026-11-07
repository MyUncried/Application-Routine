import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import type { Movement } from "@/domain/activities/Movement";
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
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-9, recette iPhone n° 2 du 31/10/2026 (constat a de Hermann) — « Créer un nouveau mouvement >
 * entrer Squat : les noms similaires apparaissent > appuyer sur entrée : la liste de recherche
 * disparaît > effacer des lettres et réécrire Squat : la liste de recherche n'affiche rien ».
 * Vrais services, base SQLite réelle (`node:sqlite`). Ne vaut pas recette sur iPhone.
 */

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));
let mockUuid = 0;
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => `uuid-${++mockUuid}`) }));
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
    useLocalSearchParams: () => ({}),
  };
});
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: () => ({ isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() }),
}));

const NOW = "2026-10-31T09:00:00.000Z";
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

const movement = (id: string, name: string): Movement => ({
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
});

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
});

afterEach(() => {
  database.close();
});

async function settle(ms = 0) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

async function renderSheet() {
  const referential = {
    listBodyZones: jest.fn(async () => new SqliteBodyZoneRepository(database).listAll()),
    listCategories: jest.fn(async () => [CARDIO]),
    isBodyZoneUsed: jest.fn(async () => false),
  } as unknown as ReferentialService;
  const profile = { getProfile: jest.fn(async () => createDefaultProfile("profile-1", NOW)) } as unknown as ProfileService;
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service()}>
        <ReferentialServiceContext.Provider value={referential}>
          <ProfileServiceContext.Provider value={profile}>
            <MovementScreen />
          </ProfileServiceContext.Provider>
        </ReferentialServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  await settle();
  await settle(20);
}

async function type(text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId("exercise-name-input", anyNode), text);
  });
  await settle();
}

async function endEditing(text: string) {
  await act(async () => {
    fireEvent(screen.getByTestId("exercise-name-input", anyNode), "endEditing", { nativeEvent: { text } });
  });
  await settle(10);
}

const panel = () => screen.queryByTestId("movement-suggestion-panel", anyNode);

describe("PRE-9 recette n° 2 (31/10/2026) — suggestions après Entrée puis nouvelle saisie", () => {
  it("Entrée ferme la liste ; effacer puis réécrire le même nom la rouvre (fermeture oubliée à la première modification)", async () => {
    await movements().create(movement("squat", "Squats"));
    await movements().create(movement("bulgare", "Squats bulgares"));
    await renderSheet();
    await type("Squat");
    expect(panel()).not.toBeNull();
    expect(screen.getByTestId("movement-suggestion-result-squat", anyNode)).toBeTruthy();

    await endEditing("Squat");
    expect(panel()).toBeNull();

    await type("Squa");
    expect(panel()).not.toBeNull();
    await type("Squ");
    await type("Squa");
    await type("Squat");
    expect(panel()).not.toBeNull();
    expect(screen.getByTestId("movement-suggestion-result-squat", anyNode)).toBeTruthy();
    expect(screen.getByTestId("movement-suggestion-result-bulgare", anyNode)).toBeTruthy();

    // Une nouvelle fin de saisie ferme encore la liste (comportement conservé).
    await endEditing("Squat");
    expect(panel()).toBeNull();
  });

  it("étape « Niveau » ouverte sur « Squ » : effacer puis revenir à « Squ » montre la liste, pas l'étape oubliée", async () => {
    await movements().create(movement("squat", "Squats"));
    await renderSheet();
    await type("Squ");
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-suggestion-result-squat-variant", anyNode));
    });
    await settle(20);
    expect(screen.getByTestId("movement-suggestion-back", anyNode)).toBeTruthy();
    await type("Sq");
    await type("Squ");
    expect(screen.queryByTestId("movement-suggestion-back", anyNode)).toBeNull();
    expect(screen.getByTestId("movement-suggestion-result-squat", anyNode)).toBeTruthy();
  });
});
