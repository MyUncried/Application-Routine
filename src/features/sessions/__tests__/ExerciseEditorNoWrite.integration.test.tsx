import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import type { CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import {
  ActivityMediaImportService,
  type MediaCopyPort,
  type PickedMedia,
} from "@/domain/media/ActivityMediaImportService";
import type { MediaAsset } from "@/domain/media/MediaAsset";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { createEmptyDraft, createExerciseDraft, toCreateSessionInput, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { ExerciseScreen } from "@/features/sessions/ExerciseScreen";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import type { Database } from "@/infrastructure/database/Database";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteMediaRepository } from "@/infrastructure/database/repositories/SqliteMediaRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { createTestMovement } from "@/infrastructure/database/testing/createTestMovement";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import {
  chooseExecutionMode,
  pressInExecutionSheet,
  tapExecutionSheetStep,
} from "@/features/activities/testing/executionSheetActions";

/**
 * PRE-4 story 1.3 (AC11, AC12, AC17) — les quatre Parcours d'édition de
 * l'Éditeur réel (`ExerciseScreen`) sur un `ActivityDefinitionService` RÉEL
 * branché sur SQLite réelle (`node:sqlite`) et sur un magasin de fichiers
 * simulé qui compte les suppressions.
 *
 * - « Fermer l'application sans Terminer » est simulé par le démontage de
 *   l'écran : aucune écriture n'a lieu avant `Terminer` (Catalogue) ou
 *   `Continuer` (Séance).
 * - L'abandon confirmé rejoue le rappel transmis à `useCompositionExitGuard`
 *   (mécanisme de navigation réel couvert par
 *   `ExerciseNavigationGuard.integration.test.tsx`).
 */

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-id") }));

const mockBack = jest.fn();
let mockSearchParams: { exerciseId?: string } = {};
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ back: mockBack, push: jest.fn() }),
    useLocalSearchParams: () => mockSearchParams,
  };
});

const mockExitGuard = jest.fn();
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: (shouldBlock: boolean, onConfirmExit: () => void) => mockExitGuard(shouldBlock, onConfirmExit),
}));

class CountingStore implements MediaCopyPort {
  readonly files = new Set<string>();
  readonly deleted: string[] = [];
  async copyToInternal(_source: PickedMedia, assetId: string) {
    const uri = `kodjo-media/${assetId}`;
    this.files.add(uri);
    return { uri, sizeBytes: 10 };
  }
  availableBytes() {
    return null;
  }
  async deletePrepared(uri: string) {
    this.deleted.push(uri);
    this.files.delete(uri);
  }
}

let database: NodeSqliteDatabase;
let store: CountingStore;
let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  store = new CountingStore();
  mockBack.mockReset();
  mockExitGuard.mockReset();
  mockExitGuard.mockReturnValue({ isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() });
});

afterEach(() => {
  database.close();
});

function asset(id: string): MediaAsset {
  const uri = `kodjo-media/${id}`;
  store.files.add(uri);
  return { id, uri, createdAt: "2026-10-16T10:00:00.000Z", kind: "PHOTO", mimeType: "image/jpeg", fileName: null, sizeBytes: 10, durationMs: null, width: null, height: null };
}

const PARAMETERS = variableParameters({
  mode: "DURATION",
  rows: [
    [30, 10],
    [45, 20],
  ],
  sideMode: "RIGHT_LEFT",
  sideRecoverySeconds: 5,
});

function realService(on: Database = database): ActivityDefinitionService {
  const importService = new ActivityMediaImportService({ pickFromLibrary: async () => ({ status: "CANCELED" }) }, store, ids("asset"));
  return new ActivityDefinitionService(
    new SqliteCategoryRepository(on),
    new SqliteBodyZoneRepository(on),
    undefined,
    { importService, repository: new SqliteMediaRepository(on) },
  );
}

/**
 * Mouvement « Fentes » enregistré, à deux médias. [PRE-9 A.3 du 04/11/2026 : créé directement, sans
 * ancienne définition du Catalogue ; les parcours Catalogue (création, modification, échec
 * d'écriture, définition supprimée, réouverture comparée à la définition) sont retirés avec elles.]
 */
async function savedMovement(parameters: ExecutionParameters = PARAMETERS) {
  const input: CreateActivityDefinitionInput = {
    name: "Fentes",
    description: null,
    category: { kind: "EXISTING", categoryId: "cardio" },
    bodyZoneIds: ["cuisses"],
    executionParameters: parameters,
    media: [asset("p1"), asset("p2")].map((item) => ({ assetId: item.id, asset: item })),
  };
  const { movementId } = await createTestMovement(database, input, { kind: "INDEPENDENT" }, ids("mov"));
  return { ...input, movementId };
}

async function dump(): Promise<Record<string, unknown[]>> {
  const result: Record<string, unknown[]> = {};
  // PRE-7 (A1.2) : contenu partagé porté par le Mouvement (`movements` et ses tables).
  for (const table of ["movements", "movement_phases", "movement_body_zones", "movement_media", "media_assets", "sessions", "activities", "movement_aliases", "categories"]) {
    result[table] = await database.getAllAsync(`SELECT * FROM ${table} ORDER BY rowid`);
  }
  return result;
}

async function renderEditor(options: {
  readonly params: { exerciseId?: string };
  readonly exercises?: readonly SessionDraftExercise[];
  readonly service?: ActivityDefinitionService;
}) {
  mockSearchParams = options.params;
  const updateDraft = jest.fn<(patch: Partial<SessionDraftContextValue["draft"]>) => void>();
  const service = options.service ?? realService();
  const referential = { listCategories: async () => new SqliteCategoryRepository(database).listAll() } as unknown as ReferentialService;
  const profile = { getProfile: async () => createDefaultProfile("profile-1", "2026-01-01T00:00:00.000Z") } as unknown as ProfileService;
  const view = render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>
        <ReferentialServiceContext.Provider value={referential}>
          <ProfileServiceContext.Provider value={profile}>
            <SessionDraftContext.Provider
              value={{ draft: { ...createEmptyDraft(), name: "Jambes", exercises: options.exercises ?? [] }, updateDraft, resetDraft: jest.fn() }}
            >
              <ExerciseScreen />
            </SessionDraftContext.Provider>
          </ProfileServiceContext.Provider>
        </ReferentialServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  // Laisse se résoudre les lectures asynchrones du montage (Profil, Zones, Catégories, Définition).
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return { updateDraft, service, unmount: view.unmount };
}

/** Story 3.3 : appui bref sur un ± de la Feuille ; le champ hors tableau est ouvert au besoin. */
const step = tapExecutionSheetStep;

const cardLabel = () => screen.getByTestId("exercise-parameters-card").props.accessibilityLabel as string;

/** Modifie N dans la Feuille puis ✓ : le Brouillon de l'Éditeur change, la base non. */
function changeSeriesAndValidate() {
  const before = cardLabel();
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  step("execution-sheet-series-increment");
  fireEvent.press(screen.getByTestId("execution-sheet-validate"));
  expect(cardLabel()).not.toBe(before);
}

/** Nouvel Exercice : choisit Durée 45 s dans la Feuille, puis ✓ (`validate`) ou ✕ (`cancel`). */
function setNewDuration(action: "validate" | "cancel") {
  const before = cardLabel();
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  // PRE-4 story 3.1 : popover natif sur iOS, segmenté ailleurs.
  chooseExecutionMode("Durée");
  fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
  fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 0 } });
  fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 45 } });
  pressInExecutionSheet(screen.getByTestId("duration-wheel-validate"));
  fireEvent.press(screen.getByTestId(`execution-sheet-${action}`));
  if (action === "cancel") {
    expect(cardLabel()).toBe(before);
  } else {
    expect(cardLabel()).not.toBe(before);
  }
}

/** Modifie N dans la Feuille puis ✕ : le Brouillon de l'Éditeur garde ses paramètres d'avant ouverture. */
function changeSeriesAndCancel() {
  const before = cardLabel();
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  step("execution-sheet-series-increment");
  fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
  expect(cardLabel()).toBe(before);
}

async function confirmAbandon() {
  const onConfirmExit = mockExitGuard.mock.calls.at(-1)![1] as () => void;
  await act(async () => {
    onConfirmExit();
  });
}

/** Une Séance persistée qui contient une occurrence du Mouvement (Continuer déjà fait). */
async function persistedCopy(movement: Awaited<ReturnType<typeof savedMovement>>): Promise<SessionDraftExercise> {
  const copy: SessionDraftExercise = {
    ...createExerciseDraft("occ-1", 30),
    name: movement.name,
    instruction: movement.description,
    categoryId: "cardio",
    bodyZoneIds: [...movement.bodyZoneIds],
    executionParameters: movement.executionParameters,
    sideMode: movement.executionParameters.sideMode,
    media: (movement.media ?? []).map((item) => ({ assetId: item.assetId, asset: item.asset! })),
    sourceMovementId: movement.movementId,
  };
  const input = toCreateSessionInput({ ...createEmptyDraft(), name: "Jambes", exercises: [copy] });
  if (!input.ok) {
    throw new Error(JSON.stringify(input.violations));
  }
  await new SqliteSessionRepository(database, ids("ses")).create(input.value);
  return copy;
}

describe("PRE4-1.3/AC11 — aucune écriture à l'annulation ni avant l'enregistrement validé (quatre Parcours)", () => {
  // [PRE-9 A.3 du 04/11/2026 : parcours Catalogue:create et Catalogue:edit retirés avec les anciennes définitions du Catalogue.]


  it("PRE4-1.3/AC11 — Séance:create : ✓ puis fermeture, ou abandon confirmé : aucun updateDraft, base identique", async () => {
    const before = await dump();
    const { updateDraft, unmount } = await renderEditor({ params: {} });
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Squat");
    setNewDuration("cancel");
    setNewDuration("validate");
    await confirmAbandon();
    unmount();
    expect(updateDraft).not.toHaveBeenCalled();
    expect(await dump()).toEqual(before);
  });

  it("PRE4-1.3/AC11 — Séance:edit : ✕, ✓ puis fermeture, abandon confirmé : brouillon de Composition et base intacts ; Terminer n'écrit que dans le brouillon", async () => {
    const copy = await persistedCopy(await savedMovement());
    const before = await dump();

    const abandoned = await renderEditor({ params: { exerciseId: copy.id }, exercises: [copy] });
    changeSeriesAndCancel();
    fireEvent(screen.getByTestId("media-item-1"), "accessibilityAction", { nativeEvent: { actionName: "remove" } });
    changeSeriesAndValidate();
    await confirmAbandon();
    abandoned.unmount();
    expect(abandoned.updateDraft).not.toHaveBeenCalled();
    expect(await dump()).toEqual(before);
    expect(store.deleted).toEqual([]);

    const finished = await renderEditor({ params: { exerciseId: copy.id }, exercises: [copy] });
    changeSeriesAndValidate();
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    expect(finished.updateDraft).toHaveBeenCalledTimes(1);
    expect(finished.updateDraft.mock.calls[0]![0].exercises![0]!.executionParameters.series).toMatchObject({ kind: "VARIABLE" });
    finished.unmount();
    expect(await dump()).toEqual(before);
  });
});

// [PRE-9 A.3 du 04/11/2026 : « PRE4-1.3/AC12 — échec d'écriture » (écriture d'une définition) et « PRE4-1.3/AC17 — réouverture d'une Copie » (comparée à sa définition) retirés avec les anciennes définitions du Catalogue.]

