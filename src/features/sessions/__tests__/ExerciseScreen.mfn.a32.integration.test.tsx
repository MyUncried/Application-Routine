import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Menu } from "@expo/ui/swift-ui";
import { disabled as swiftUIDisabled } from "@expo/ui/swift-ui/modifiers";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { Platform, View } from "react-native";

import type { CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import type { ExecutionParameters, WorkPhase } from "@/domain/activities/ExecutionParameters";
import { uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Category } from "@/domain/categories/Category";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
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
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-7 story A3.2 (D-439, MFN-05, MFN/AC07, MFN/AC33 ; matrice de
 * `spec-a3-2-consultation-reordonnancement-niveaux.md`) — écran des niveaux ouvert depuis le popover
 * de la fiche, sur les VRAIS services et une base SQLite réelle : réordonnancement écrit sans
 * question d'identité ni modification des Exercices, brouillon de la fiche intact, pastille et
 * popover relus à la fermeture. Rappel : ces tests ne valent pas recette sur iPhone (JA).
 */

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-id") }));

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams: Record<string, string> = {};
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ back: mockBack, push: jest.fn(), replace: mockReplace }),
    useLocalSearchParams: () => mockSearchParams,
  };
});
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: () => ({ isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() }),
}));

const NOW = "2026-10-24T11:00:00.000Z";
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
  mockSearchParams = {};
});

afterEach(() => {
  database.close();
});

const phases = (...durations: number[]): WorkPhase[] =>
  durations.map((durationSeconds, index) => ({ id: index + 1, label: `Phase ${index + 1}`, durationSeconds }));

const phased = (workPhases: readonly WorkPhase[], count = 3): ExecutionParameters =>
  uniformParameters({
    mode: "DURATION",
    count,
    target: workPhases.reduce((sum, phase) => sum + phase.durationSeconds, 0),
    pauseSeconds: 10,
    sideMode: "UNILATERAL",
    workPhases: [...workPhases],
  });

const input = (overrides: Partial<CreateActivityDefinitionInput> = {}): CreateActivityDefinitionInput => ({
  name: "Squats assistés",
  description: "Buste droit",
  category: { kind: "EXISTING", categoryId: "cardio" },
  bodyZoneIds: ["cuisses"],
  executionParameters: phased(phases(6, 3)),
  ...overrides,
});

async function create(
  overrides: Partial<CreateActivityDefinitionInput>,
  origin: Parameters<ActivityDefinitionService["createActivityDefinitionWithOrigin"]>[1] = { kind: "INDEPENDENT" },
) {
  const result = await service().createActivityDefinitionWithOrigin(input(overrides), origin);
  if (result.status !== "CREATED") throw new Error(result.status);
  return result.value;
}

/** Groupe « Squats assistés » (niveau 1) → « Squats » (niveau 2). */
async function twoLevels() {
  const assisted = await create({});
  const squats = await create({ name: "Squats", description: "Cuisses parallèles" }, {
    kind: "VARIANT",
    originMovementId: assisted.movementId,
    joinOriginGroup: true,
  });
  return { assisted, squats };
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
  return {
    getProfile: jest.fn(async () => ({ ...createDefaultProfile("profile-1", NOW), exerciseCountdownSecondsDefault: 7 })),
  } as unknown as ProfileService;
}

async function renderEditor(params: Record<string, string>, editorService: ActivityDefinitionService = service()) {
  mockSearchParams = params;
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={editorService}>
        <ReferentialServiceContext.Provider value={fakeReferential()}>
          <ProfileServiceContext.Provider value={fakeProfile()}>
            <SessionDraftContext.Provider
              value={{
                draft: { name: "Séance", labelId: null, initialCountdownSeconds: 10, finalPhaseSeconds: 5, exercises: [] },
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
  await settle(20);
}

async function settle(ms = 0) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

async function pressNative(testID: string) {
  await act(async () => {
    fireEvent(screen.getByTestId(testID, anyNode), "buttonPress");
  });
}

const pastilleLabel = () => screen.getByTestId("activity-editor-level-label", anyNode).props.children;
const nativeMenu = (testID: string) =>
  within(screen.getByTestId("activity-editor-level", anyNode))
    .UNSAFE_getAllByType(Menu)
    .find((menu) => menu.props.testID === testID);


/** Groupe « Squats assistés » (1) → « Squats » (2) → « Squats sautés » (3). */
async function threeLevels() {
  const { assisted, squats } = await twoLevels();
  const jumped = await create({ name: "Squats sautés", description: "Réception souple" }, {
    kind: "VARIANT",
    originMovementId: squats.movementId,
    joinOriginGroup: true,
  });
  return { assisted, squats, jumped };
}

const levelNames = () =>
  [1, 2, 3].map((n) => screen.queryByTestId(`movement-levels-row-${n}-name`)?.props.children ?? null);

type Measurable = { measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void };

describe("PRE-7 A3.2 — écran des niveaux depuis la fiche", () => {
  it("iOS : « Réordonner les niveaux » ouvre la liste ; Monter écrit l'ordre ; fermeture → pastille et popover relus", async () => {
    const { squats } = await threeLevels();
    await renderEditor({ catalogueDefinitionId: squats.id });
    expect(pastilleLabel()).toBe("Niveau 2");
    const definitionsBefore = await definitionsRows();
    const movementsBefore = (await movementsRows()) as Record<string, unknown>[];

    await pressNative("activity-editor-level-reorder");
    await settle();
    await settle();
    expect(levelNames()).toEqual(["Squats assistés", "Squats", "Squats sautés"]);
    await act(async () => {
      fireEvent(screen.getByTestId("movement-levels-row-2-handle"), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    });
    await settle(20);
    expect(levelNames()).toEqual(["Squats", "Squats assistés", "Squats sautés"]);
    // Aucune question d'identité, aucune navigation, aucun Exercice touché (MFN-05, MFN-08).
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(await definitionsRows()).toEqual(definitionsBefore);
    const strip = (row: Record<string, unknown>) => {
      const { level_sort_key: _sortKey, updated_at: _updatedAt, ...rest } = row;
      return rest;
    };
    expect(((await movementsRows()) as Record<string, unknown>[]).map(strip)).toEqual(movementsBefore.map(strip));

    await act(async () => {
      fireEvent.press(screen.getAllByTestId("screen-header-back").at(-1)!);
    });
    await settle(20);
    expect(screen.queryByTestId("movement-levels-list")).toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
    expect(pastilleLabel()).toBe("Niveau 1");
    expect(screen.getByTestId("activity-editor-level-level-1", anyNode).props.label).toBe("Niveau 1 sur 3 · Squats");
    expect(screen.getByTestId("activity-editor-level-level-2", anyNode).props.label).toBe("Niveau 2 sur 3 · Squats assistés");
  });

  it("brouillon de la fiche intact pendant et après l'écran des niveaux (formulaire monté)", async () => {
    const { squats } = await threeLevels();
    await renderEditor({ catalogueDefinitionId: squats.id });
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Squats lents");
    await pressNative("activity-editor-level-reorder");
    await settle();
    await act(async () => {
      fireEvent(screen.getByTestId("movement-levels-row-3-handle"), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    });
    await settle(20);
    await act(async () => {
      fireEvent.press(screen.getAllByTestId("screen-header-back").at(-1)!);
    });
    await settle(20);
    expect(screen.getByTestId("exercise-name-input").props.value).toBe("Squats lents");
    expect(pastilleLabel()).toBe("Niveau 3");
    // Rien du brouillon n'est écrit par le réordonnancement.
    expect(((await definitionsRows()) as { id: string }[]).length).toBe(3);
    expect(await database.getFirstAsync("SELECT name FROM movements WHERE id = ?", [squats.movementId])).toEqual({ name: "Squats" });
  });

  it("Android : ligne « Réordonner les niveaux » de la racine du panneau (R-9, D-448) → écran des niveaux", async () => {
    const os = jest.replaceProperty(Platform, "OS", "android");
    try {
      const { squats } = await threeLevels();
      const rects: Record<string, readonly [number, number, number, number]> = {
        "activity-editor-level-panel-host": [0, 50, 400, 800],
        "activity-editor-level": [300, 150, 80, 26],
      };
      const prototype = View.prototype as unknown as Measurable;
      const measure = jest
        .spyOn(prototype, "measureInWindow")
        .mockImplementation(function (this: { props?: { testID?: string } }, callback) {
          const rect = rects[this.props?.testID ?? ""];
          if (rect) callback(...rect);
        });
      await renderEditor({ catalogueDefinitionId: squats.id });
      await act(async () => {
        fireEvent.press(screen.getByTestId("activity-editor-level"));
      });
      measure.mockRestore();
      await act(async () => {
        fireEvent.press(screen.getByTestId("activity-editor-level-panel-reorder"));
      });
      await settle();
      expect(screen.queryByTestId("activity-editor-level-panel")).toBeNull();
      expect(levelNames()).toEqual(["Squats assistés", "Squats", "Squats sautés"]);
    } finally {
      os.restore();
    }
  });

  it("geste sans groupe : « Naviguer vers » et « Réordonner les niveaux » indisponibles (R-9, D-448)", async () => {
    const alone = await create({ name: "Pompes" });
    await renderEditor({ catalogueDefinitionId: alone.id });
    const change = nativeMenu("activity-editor-level-change");
    expect(JSON.stringify(change?.props.modifiers)).toContain(JSON.stringify(swiftUIDisabled(true)));
    expect(change?.props.label).toBe("Naviguer vers");
    const reorder = screen.getByTestId("activity-editor-level-reorder", anyNode);
    expect(within(change!).queryByTestId("activity-editor-level-reorder", anyNode)).toBeNull();
    expect(JSON.stringify(reorder.props.modifiers)).toContain(JSON.stringify(swiftUIDisabled(true)));
  });
});
