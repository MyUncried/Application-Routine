import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Menu } from "@expo/ui/swift-ui";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { Platform, View } from "react-native";

import { activityDefinitionToDraftExercise, type CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Category } from "@/domain/categories/Category";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { createEmptyDraft, toSessionDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { ExerciseScreen } from "@/features/sessions/ExerciseScreen";
import { SessionDraftContext, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { SessionService } from "@/features/sessions/SessionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-7 story R-9 (D-448 points 9 et 10, recette JA2 ; matrice de `spec-r-9-menu-niveau-crayon.md`)
 * — sur les VRAIS services et une base SQLite réelle (`node:sqlite`), plate-forme iOS (`jest-expo`) :
 * - menu Niveau à trois entrées de premier niveau dans les trois contextes (Catalogue en
 *   modification « Naviguer vers », Séance et reprise « Changer de niveau ») ;
 * - crayon de l'occurrence de Séance : interrupteur actif ; sortie sans changement immédiate ; avec
 *   changements, depuis R-10 (recette JA3 r9-5), dialogue de sauvegarde C03 (Annuler laisse
 *   l'édition ouverte, Confirmer inscrit et reverrouille). Rappel : ces tests ne valent pas recette sur iPhone (JA3, R-10).
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
    useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
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
const anyNode = { includeHiddenElements: true } as const;

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
const sessionService = () => new SessionService(new SqliteSessionRepository(database, ids("ses"), () => NOW));

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  mockBack.mockReset();
  mockSearchParams = {};
});

afterEach(() => {
  database.close();
});

const input = (name: string, description: string): CreateActivityDefinitionInput => ({
  name,
  description,
  category: { kind: "EXISTING", categoryId: "cardio" },
  bodyZoneIds: ["cuisses"],
  executionParameters: durationParameters(30, 3, 10),
});

async function create(
  value: CreateActivityDefinitionInput,
  origin: Parameters<ActivityDefinitionService["createActivityDefinitionWithOrigin"]>[1] = { kind: "INDEPENDENT" },
) {
  const result = await service().createActivityDefinitionWithOrigin(value, origin);
  if (result.status !== "CREATED") throw new Error(result.status);
  return result.value;
}

/** Groupe de deux niveaux : « Squats assistés » → « Squats ». */
async function twoLevels() {
  const assisted = await create(input("Squats assistés", "Avec appui"));
  const squats = await create(input("Squats", "Buste droit"), {
    kind: "VARIANT",
    originMovementId: assisted.movementId,
    joinOriginGroup: true,
  });
  return { assisted, squats };
}

/** Séance enregistrée : une occurrence de « Squats », relue en brouillon. */
async function sessionWithSquats() {
  const levels = await twoLevels();
  const created = await sessionService().createSession({
    ...createEmptyDraft(),
    name: "Jambes",
    exercises: [activityDefinitionToDraftExercise(levels.squats, "occ-1", null)],
  });
  if (!created.ok) throw new Error(JSON.stringify(created.violations));
  return { ...levels, draft: toSessionDraft(created.value) };
}

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
  await settle(20);
}

async function settle(ms = 0) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

/** Entrées de la racine du menu natif, dans l'ordre. */
function rootEntries(): string[] {
  const root = within(screen.getByTestId("activity-editor-level", anyNode)).UNSAFE_getAllByType(Menu)[0]!;
  return ([root.props.children] as unknown[])
    .flat(2)
    .filter(Boolean)
    .map((entry) => (entry as { props: { testID: string } }).props.testID);
}

const ROOT = ["activity-editor-level-change", "activity-editor-level-add", "activity-editor-level-reorder"];
const submenuLabel = () => screen.getByTestId("activity-editor-level-change", anyNode).props.label;

describe("PRE-7 R-9 — menu Niveau à trois entrées (D-448 point 9)", () => {
  it("Catalogue en modification : « Naviguer vers », « Ajouter un niveau », « Réordonner les niveaux »", async () => {
    const { squats } = await twoLevels();
    await renderEditor({ catalogueDefinitionId: squats.id });
    expect(rootEntries()).toEqual(ROOT);
    expect(submenuLabel()).toBe("Naviguer vers");
    expect(screen.getByTestId("activity-editor-level-add", anyNode).props.label).toBe("Ajouter un niveau");
    expect(screen.getByTestId("activity-editor-level-reorder", anyNode).props.label).toBe("Réordonner les niveaux");
  });

  it("occurrence de Séance : même racine, sous-menu « Changer de niveau »", async () => {
    const { draft } = await sessionWithSquats();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    expect(rootEntries()).toEqual(ROOT);
    expect(submenuLabel()).toBe("Changer de niveau");
  });

  it("reprise au Catalogue : même racine, sous-menu « Changer de niveau »", async () => {
    const { squats } = await twoLevels();
    await renderEditor({ catalogueDefinitionId: "new", movementId: squats.movementId });
    expect(rootEntries()).toEqual(ROOT);
    expect(submenuLabel()).toBe("Changer de niveau");
  });
});

// PRE-9 (recette iPhone du 29/10 ; CE-MVT-01 §3, §13, DSF Mouvements l.67, ch13 l.268) : « crayon interrupteur de l'occurrence de Séance » (R-9) retiré —
// depuis une Séance, le Mouvement repris reste en lecture seule, sans crayon (C04 remplacé sur ce point).
// Couverture du nouveau parcours : ExerciseScreen.sessionMovement.integration.test.tsx.

type Measurable = { measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void };

describe("PRE-7 R-9 — panneau de repli (Android), occurrence de Séance", () => {
  it("« Réordonner les niveaux » est la troisième ligne de la racine et ouvre l'écran des niveaux", async () => {
    const os = jest.replaceProperty(Platform, "OS", "android");
    try {
      const { draft } = await sessionWithSquats();
      const rects: Record<string, readonly [number, number, number, number]> = {
        "activity-editor-level-panel-host": [0, 50, 400, 800],
        "activity-editor-level": [300, 150, 80, 26],
      };
      const measure = jest
        .spyOn(View.prototype as unknown as Measurable, "measureInWindow")
        .mockImplementation(function (this: { props?: { testID?: string } }, callback) {
          const rect = rects[this.props?.testID ?? ""];
          if (rect) callback(...rect);
        });
      await renderEditor({ exerciseId: "occ-1" }, draft);
      await act(async () => {
        fireEvent.press(screen.getByTestId("activity-editor-level"));
      });
      measure.mockRestore();
      const rows = within(screen.getByTestId("activity-editor-level-panel"))
        .getAllByRole("button")
        .map((row) => row.props.testID);
      expect(rows).toEqual([
        "activity-editor-level-panel-change",
        "activity-editor-level-panel-add",
        "activity-editor-level-panel-reorder",
      ]);
      expect(screen.getByTestId("activity-editor-level-panel-change").props.accessibilityLabel).toBe("Changer de niveau");
      await act(async () => {
        fireEvent.press(screen.getByTestId("activity-editor-level-panel-reorder"));
      });
      await settle(20);
      expect(screen.queryByTestId("activity-editor-level-panel")).toBeNull();
      expect(screen.getByTestId("movement-levels-row-1-name").props.children).toBe("Squats assistés");
      expect(screen.getByTestId("movement-levels-row-2-name").props.children).toBe("Squats");
    } finally {
      os.restore();
    }
  });
});
