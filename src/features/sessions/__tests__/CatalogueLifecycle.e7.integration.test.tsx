import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { StructuredSessionInput } from "@/domain/sessions/structuredInput";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CatalogueScreen } from "@/features/sessions/CatalogueScreen";
import { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-8 (epic E, story E.7) — raccordements du Catalogue unifié sur SQLite réelle (`node:sqlite`) :
 * écran, service et repository réels. Carte → Composition (modification), Dupliquer, Archiver avec
 * Annuler, filtre Archivées, Restaurer, Supprimer confirmé ; Mouvements conservés.
 */

const mockPush = jest.fn();
const focusEffectHarness: { effect: (() => (() => void) | void) | null } = { effect: null };
jest.mock("expo-crypto", () => {
  let counter = 0;
  return { randomUUID: jest.fn(() => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`) };
});
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useFocusEffect: (effect: () => (() => void) | void) => {
      focusEffectHarness.effect = effect;
    },
    useRouter: () => ({ push: mockPush, setParams: jest.fn() }),
    useLocalSearchParams: () => ({}),
  };
});

let database: NodeSqliteDatabase;

beforeEach(async () => {
  mockPush.mockClear();
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  await database.runAsync(
    `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
     VALUES ('mv-squat', 'Squat', 'squat', NULL, 'cardio', 1, '2026-10-28T08:00:00.000Z', '2026-10-28T08:00:00.000Z')`,
  );
  await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES ('mv-squat', 'dos')");
});

afterEach(() => {
  database.close();
});

const input = (name: string, count: number): StructuredSessionInput => ({
  name,
  labelId: null,
  initialCountdownSeconds: 10,
  finalPhaseSeconds: 5,
  // Forme créée par la Composition actuelle : un Circuit (ancien modèle, seule représentable par la
  // duplication et l'édition tant que l'epic C n'existe pas).
  structure: {
    elements: [
      {
        kind: "CIRCUIT" as const,
        circuit: {
          id: `${name}-circuit`,
          repeatCount: 2,
          nature: "TOURS" as const,
          exercises: Array.from({ length: count }, (_, index) => ({
            id: `${name}-${index}`,
            type: "EXERCISE" as const,
            executionParameters: durationParameters(30),
            postActivityRecoverySeconds: 0,
            sourceMovementId: "mv-squat",
          })),
        },
      },
    ],
    stopPoints: [],
  },
});

async function flush() {
  await act(async () => {
    for (let index = 0; index < 20; index += 1) await new Promise((resolve) => setImmediate(resolve));
  });
}

async function renderCatalogue() {
  const repository = new SqliteSessionRepository(database);
  const service = new SessionService(repository);
  const referentials = {
    listCategories: jest.fn(async () => []),
    listBodyZones: jest.fn(async () => []),
    listLabels: jest.fn(async () => []),
  } as unknown as ReferentialService;
  render(
    <TestSafeAreaProvider>
      <SessionServiceContext.Provider value={service}>
        <ReferentialServiceContext.Provider value={referentials}>
          <ActivityDefinitionServiceContext.Provider value={{ listActivityDefinitions: jest.fn(async () => []) } as unknown as ActivityDefinitionService}>
            <CatalogueScreen />
          </ActivityDefinitionServiceContext.Provider>
        </ReferentialServiceContext.Provider>
      </SessionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  await act(async () => {
    focusEffectHarness.effect?.();
  });
  await flush();
  return repository;
}

const names = () => screen.queryAllByTestId(/^session-card-[^-]+(-[^-]+)*-name$/).map((node) => node.props.children as string);
const cardFor = (name: string) => {
  const nameNode = screen.getByText(name);
  const id = (nameNode.props.testID as string).replace(/^session-card-/, "").replace(/-name$/, "");
  return { id, swipe: screen.getByTestId(`session-card-${id}-swipe-card`) };
};
const act11y = async (name: string, action: string) => {
  fireEvent(cardFor(name).swipe, "accessibilityAction", { nativeEvent: { actionName: action } });
  await flush();
};

describe("PRE-8 E.7 — raccordements sur SQLite réelle", () => {
  it("carte → Composition en modification ; Créer → Composition", async () => {
    const repository = new SqliteSessionRepository(database);
    const created = await repository.createStructured(input("Gainage", 2));
    await renderCatalogue();
    fireEvent.press(cardFor("Gainage").swipe);
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/composition", params: { sessionId: created.id } });
    fireEvent.press(screen.getByTestId("catalogue-create-action"));
    expect(mockPush).toHaveBeenLastCalledWith("/composition");
  });

  it("Dupliquer, Archiver puis Annuler, Archiver, filtre Archivées, Restaurer, Archiver, Supprimer confirmé", async () => {
    const repository = new SqliteSessionRepository(database);
    await repository.createStructured(input("Gainage", 2));
    await renderCatalogue();
    expect(names()).toEqual(["Gainage"]);

    await act11y("Gainage", "duplicate");
    expect(names().sort()).toEqual(["Gainage", "Gainage (copie)"]);

    await act11y("Gainage (copie)", "archive");
    expect(names()).toEqual(["Gainage"]);
    expect(screen.getByText("Séance archivée")).toBeTruthy();
    fireEvent.press(screen.getByText("Annuler"));
    await flush();
    expect(names().sort()).toEqual(["Gainage", "Gainage (copie)"]);

    await act11y("Gainage (copie)", "archive");
    fireEvent.press(screen.getByTestId("catalogue-filter-action"));
    await flush();
    fireEvent.press(screen.getByTestId("session-filter-status-archived"));
    fireEvent.press(screen.getByTestId("session-filter-apply"));
    expect(names()).toEqual(["Gainage (copie)"]);
    expect(screen.queryByTestId(`session-card-${cardFor("Gainage (copie)").id}-play`)).toBeNull();

    await act11y("Gainage (copie)", "restore");
    expect(names()).toEqual([]);
    expect(screen.getByText("Séance restaurée")).toBeTruthy();
    expect(await database.getAllAsync("SELECT name, status FROM sessions ORDER BY name")).toEqual([
      { name: "Gainage", status: "ACTIVE" },
      { name: "Gainage (copie)", status: "ACTIVE" },
    ]);

    fireEvent.press(screen.getByTestId("catalogue-filter-action-clear"));
    await act11y("Gainage (copie)", "archive");
    fireEvent.press(screen.getByTestId("catalogue-filter-action"));
    await flush();
    fireEvent.press(screen.getByTestId("session-filter-status-archived"));
    fireEvent.press(screen.getByTestId("session-filter-apply"));
    await act11y("Gainage (copie)", "delete");
    fireEvent.press(within(screen.getByTestId("session-delete-confirm-card")).getByLabelText("Annuler"));
    expect(names()).toEqual(["Gainage (copie)"]);
    await act11y("Gainage (copie)", "delete");
    fireEvent.press(within(screen.getByTestId("session-delete-confirm-card")).getByLabelText("Confirmer"));
    await flush();
    expect(names()).toEqual([]);
    expect(await database.getAllAsync("SELECT name FROM sessions")).toEqual([{ name: "Gainage" }]);
    expect(await database.getAllAsync("SELECT id FROM movements")).toEqual([{ id: "mv-squat" }]);
  }, 30000);
});
