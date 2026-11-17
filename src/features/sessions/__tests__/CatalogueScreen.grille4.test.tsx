import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import type { CatalogueSessionRecord } from "@/domain/sessions/SessionRepository";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { releaseFilterSheet } from "@/features/activities/filterSheetRelay";
import { CatalogueScreen } from "@/features/sessions/CatalogueScreen";
import type { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

/**
 * Bascule liste / grille du catalogue des Mouvements — décisions de Hermann du 16/11/2026 (ch07 ; ch13, CE-MVT-03, rubrique
 * Bascule : « le choix est mémorisé » ; composant « DSF / Controls / Bascule liste-grille », 56 × 24). Mémorisation dans le
 * Profil (`catalogue_preferences`, `migration030`), sur une base SQLite réelle relue par un second rendu de l'écran.
 */

jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

const focusEffectHarness: { effect: (() => (() => void) | void) | null } = { effect: null };
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useFocusEffect: (effect: () => (() => void) | void) => {
      focusEffectHarness.effect = effect;
    },
    useRouter: () => ({ push: jest.fn(), setParams: jest.fn() }),
    useLocalSearchParams: () => ({}),
  };
});

const NOW = "2026-11-16T09:00:00.000Z";
let database: NodeSqliteDatabase;
let sequence = 0;
const movements = () => new SqliteMovementRepository(database, () => `grp-${++sequence}`, () => NOW);
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

const referentials = {
  listCategories: jest.fn(async () => []),
  listBodyZones: jest.fn(async () => []),
  listLabels: jest.fn(async () => []),
} as unknown as ReferentialService;

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  sequence = 0;
  const repository = movements();
  await repository.create(movement("fentes", "Fentes avant"));
  await repository.create(movement("gainage", "Gainage"));
});

afterEach(() => {
  jest.restoreAllMocks();
  database.close();
});

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

async function openMovements(withProfile: boolean) {
  const sessions = { listCatalogueSessions: jest.fn(async (): Promise<readonly CatalogueSessionRecord[]> => []) } as unknown as SessionService;
  const tree = (
    <TestSafeAreaProvider>
      <SessionServiceContext.Provider value={sessions}>
        <ReferentialServiceContext.Provider value={referentials}>
          <ActivityDefinitionServiceContext.Provider value={new ActivityDefinitionService(undefined, undefined, undefined, undefined, movements())}>
            <CatalogueScreen />
          </ActivityDefinitionServiceContext.Provider>
        </ReferentialServiceContext.Provider>
      </SessionServiceContext.Provider>
    </TestSafeAreaProvider>
  );
  releaseFilterSheet();
  render(withProfile ? <ProfileServiceContext.Provider value={new ProfileService(new SqliteProfileRepository(database, () => NOW))}>{tree}</ProfileServiceContext.Provider> : tree);
  await act(async () => {
    focusEffectHarness.effect?.();
  });
  await settle();
  await press("catalogue-content-type-row-movements");
}

const press = async (testID: string) => {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
  await settle();
};
const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;
const gridStored = async () =>
  (await database.getFirstAsync<{ movement_catalogue_grid: number }>("SELECT movement_catalogue_grid FROM catalogue_preferences"))?.movement_catalogue_grid ?? null;

describe("Bascule liste / grille du catalogue des Mouvements (CE-MVT-03, Bascule)", () => {
  it("composant DSF 56 × 24 à droite des compteurs ; liste par défaut ; Grille : grille affichée et choix mémorisé, retrouvé à la réouverture ; Liste : retour mémorisé", async () => {
    await openMovements(true);
    expect(style("movement-catalogue-view-toggle")).toMatchObject({ width: 56, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.primary });
    expect(screen.getByTestId("movement-catalogue-view-toggle-active-list")).toBeTruthy();
    expect(screen.getByTestId("movement-catalogue-view-toggle-list").props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId("movement-catalogue")).toBeTruthy();
    expect(screen.queryByTestId("movement-catalogue-grid")).toBeNull();
    expect(await gridStored()).toBeNull();

    await press("movement-catalogue-view-toggle-grid");
    expect(screen.getByTestId("movement-catalogue-view-toggle-active-grid")).toBeTruthy();
    expect(screen.getByTestId("movement-catalogue-view-toggle-grid").props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId("movement-catalogue-grid")).toBeTruthy();
    expect(screen.queryByTestId("movement-catalogue")).toBeNull();
    expect(screen.getByTestId("movement-grid-card-fentes")).toBeTruthy();
    expect(await gridStored()).toBe(1);

    // Réouverture de l'écran (relance) : la grille revient directement.
    screen.unmount();
    await openMovements(true);
    expect(screen.getByTestId("movement-catalogue-grid")).toBeTruthy();
    expect(screen.queryByTestId("movement-catalogue")).toBeNull();

    await press("movement-catalogue-view-toggle-list");
    expect(screen.getByTestId("movement-catalogue")).toBeTruthy();
    expect(await gridStored()).toBe(0);
  });

  it("sans service de Profil : liste d'origine, bascule affichée sur Liste", async () => {
    await openMovements(false);
    expect(screen.getByTestId("movement-catalogue")).toBeTruthy();
    expect(screen.getByTestId("movement-catalogue-view-toggle-active-list")).toBeTruthy();
  });
});
