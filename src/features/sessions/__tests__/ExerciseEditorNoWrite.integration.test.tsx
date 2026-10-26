import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import {
  activityDefinitionToDraftExercise,
  validateActivityDefinitionInput,
  type ActivityDefinition,
} from "@/domain/activities/ActivityDefinition";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { allFailureParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import {
  ActivityMediaImportService,
  type MediaCopyPort,
  type PickedMedia,
} from "@/domain/media/ActivityMediaImportService";
import type { MediaAsset } from "@/domain/media/MediaAsset";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { createEmptyDraft, toCreateSessionInput, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
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
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteMediaRepository } from "@/infrastructure/database/repositories/SqliteMediaRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { failOnWrite } from "@/infrastructure/database/testing/failOnWrite";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { strings } from "@/shared/i18n";
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
let mockSearchParams: { exerciseId?: string; catalogueDefinitionId?: string } = {};
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
    new SqliteActivityDefinitionRepository(on, ids("def")),
    new SqliteCategoryRepository(on),
    new SqliteBodyZoneRepository(on),
    undefined,
    { importService, repository: new SqliteMediaRepository(on) },
  );
}

async function savedDefinition(parameters: ExecutionParameters = PARAMETERS): Promise<ActivityDefinition> {
  const validated = validateActivityDefinitionInput({
    name: "Fentes",
    description: null,
    category: { kind: "EXISTING", categoryId: "cardio" },
    bodyZoneIds: ["cuisses"],
    executionParameters: parameters,
    media: [asset("p1"), asset("p2")].map((item) => ({ assetId: item.id, asset: item })),
  });
  if (!validated.ok) {
    throw new Error(JSON.stringify(validated.violations));
  }
  return new SqliteActivityDefinitionRepository(database, ids("def")).create(validated.value);
}

async function dump(): Promise<Record<string, unknown[]>> {
  const result: Record<string, unknown[]> = {};
  // PRE-7 (A1.2) : contenu partagé porté par le Mouvement (`movements` et ses tables).
  for (const table of ["activity_definitions", "movements", "movement_phases", "movement_body_zones", "movement_media", "media_assets", "sessions", "activities", "session_activity_media", "categories"]) {
    result[table] = await database.getAllAsync(`SELECT * FROM ${table} ORDER BY rowid`);
  }
  return result;
}

async function renderEditor(options: {
  readonly params: { exerciseId?: string; catalogueDefinitionId?: string };
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

/** Texte affiché de la Phrase (segments concaténés). */
function phraseOf(): string {
  const flatten = (node: unknown): string =>
    typeof node === "string" || typeof node === "number"
      ? String(node)
      : Array.isArray(node)
        ? node.map(flatten).join("")
        : node && typeof node === "object" && "props" in node
          ? flatten((node as { props: { children?: unknown } }).props.children)
          : "";
  return flatten(screen.getByTestId("exercise-parameters-phrase").props.children);
}

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

/** Une Séance persistée qui contient une Copie de la Définition (Continuer déjà fait). */
async function persistedCopy(definition: ActivityDefinition): Promise<SessionDraftExercise> {
  const copy = activityDefinitionToDraftExercise(definition, "occ-1", 30);
  const input = toCreateSessionInput({ ...createEmptyDraft(), name: "Jambes", exercises: [copy] });
  if (!input.ok) {
    throw new Error(JSON.stringify(input.violations));
  }
  await new SqliteSessionRepository(database, ids("ses")).create(input.value);
  return copy;
}

describe("PRE4-1.3/AC11 — aucune écriture à l'annulation ni avant l'enregistrement validé (quatre Parcours)", () => {
  it("PRE4-1.3/AC11 — Catalogue:create : ✕ restaure, ✓ puis fermeture sans Terminer, puis abandon confirmé : base identique", async () => {
    const before = await dump();
    const { unmount } = await renderEditor({ params: { catalogueDefinitionId: "new" } });
    await waitFor(() => expect(screen.getByTestId("exercise-parameters-card")).toBeTruthy());
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Squat");
    setNewDuration("cancel");
    setNewDuration("validate");
    await confirmAbandon();
    unmount();
    expect(await dump()).toEqual(before);
    expect(store.deleted).toEqual([]);
  });

  it("PRE4-1.3/AC11 — Catalogue:edit : ✕ garde les paramètres d'avant ouverture ; ✓ puis fermeture, ou abandon confirmé : base identique, fichiers référencés conservés", async () => {
    const definition = await savedDefinition();
    const before = await dump();

    const closed = await renderEditor({ params: { catalogueDefinitionId: definition.id } });
    await screen.findByDisplayValue("Fentes");
    changeSeriesAndCancel();
    changeSeriesAndValidate();
    fireEvent.changeText(screen.getByDisplayValue("Fentes"), "Fentes lentes");
    closed.unmount();
    expect(await dump()).toEqual(before);

    const abandoned = await renderEditor({ params: { catalogueDefinitionId: definition.id } });
    await screen.findByDisplayValue("Fentes");
    fireEvent(screen.getByTestId("media-item-1"), "accessibilityAction", { nativeEvent: { actionName: "remove" } });
    changeSeriesAndValidate();
    await confirmAbandon();
    abandoned.unmount();
    expect(await dump()).toEqual(before);
    expect(store.deleted).toEqual([]);
    expect(store.files.has("kodjo-media/p1") && store.files.has("kodjo-media/p2")).toBe(true);
  });

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
    const definition = await savedDefinition();
    const copy = await persistedCopy(definition);
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

describe("PRE4-1.3/AC12 — échec d'écriture sans perte du Brouillon", () => {
  it("PRE4-1.3/AC12 — erreur injectée à Terminer : base inchangée, Éditeur affiché avec les valeurs saisies ; la nouvelle tentative les enregistre", async () => {
    const definition = await savedDefinition();
    const before = await dump();
    // Échec au premier lien de Média, après la mise à jour de la Définition et de ses Zones dans la même transaction.
    const failing = failOnWrite(database, /INSERT INTO movement_media/);
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    await renderEditor({ params: { catalogueDefinitionId: definition.id }, service: realService(failing.database) });
    fireEvent.changeText(await screen.findByDisplayValue("Fentes"), "Fentes lentes");
    changeSeriesAndValidate();
    const edited = cardLabel();
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    expect(screen.getByTestId("activity-editor-save-error")).toBeTruthy();
    expect(screen.getByDisplayValue("Fentes lentes")).toBeTruthy();
    expect(cardLabel()).toBe(edited);
    expect(mockBack).not.toHaveBeenCalled();
    expect(failing.state.armed).toBe(false);
    expect(failing.state.writesBeforeFailure).toBeGreaterThanOrEqual(2);
    expect(await dump()).toEqual(before);

    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    const saved = await new SqliteActivityDefinitionRepository(database, ids("def")).findById(definition.id);
    expect(saved?.name).toBe("Fentes lentes");
    expect(saved?.executionParameters.series).toEqual({
      kind: "VARIABLE",
      rows: [
        { target: { kind: "NUMBER", value: 30 }, pauseSeconds: 10, loadKg: 0 },
        { target: { kind: "NUMBER", value: 45 }, pauseSeconds: 20, loadKg: 0 },
        { target: { kind: "NUMBER", value: 45 }, pauseSeconds: 20, loadKg: 0 },
      ],
      workPhases: [],
    });
    consoleError.mockRestore();
  });

  it("PRE4-1.3/AC12, PRE4-4.1/AC13 — Définition supprimée entre l'ouverture et Terminer : erreur signalée avec le texte du code de départ, aucune Définition recréée, Brouillon conservé", async () => {
    const definition = await savedDefinition();
    await renderEditor({ params: { catalogueDefinitionId: definition.id } });
    fireEvent.changeText(await screen.findByDisplayValue("Fentes"), "Fentes lentes");
    await database.runAsync("DELETE FROM activity_definitions WHERE id = ?", [definition.id]);
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    expect(screen.getByTestId("activity-editor-save-error")).toBeTruthy();
    // PRE4-4.1/AC13 (P34, FR-02-10) : texte d'échec d'enregistrement du code de départ, aucun texte nouveau.
    expect(screen.getByText(strings.screens.activities.editor.saveError)).toBeTruthy();
    expect(screen.getByDisplayValue("Fentes lentes")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
    expect(await database.getAllAsync("SELECT id FROM activity_definitions")).toEqual([]);
  });
});

describe("PRE4-1.3/AC17 — réouverture d'une Copie dans l'Éditeur", () => {
  it("PRE4-1.3/AC17 — la Copie rouverte affiche la même Phrase et la même Durée totale que sa Définition aux mêmes paramètres", async () => {
    const definition = await savedDefinition();
    const copy = await persistedCopy(definition);
    const catalogue = await renderEditor({ params: { catalogueDefinitionId: definition.id } });
    await screen.findByDisplayValue("Fentes");
    const definitionLabel = cardLabel();
    catalogue.unmount();
    await renderEditor({ params: { exerciseId: copy.id }, exercises: [copy] });
    expect(cardLabel()).toBe(definitionLabel);
  });

  it("PRE4-1.3/AC17 — Exercice tout à l'échec (Répétitions, 3 × à l’échec) : « 3 séries menées jusqu’à l’échec » et aucune Durée totale, identiques pour la Définition et la Copie rouverte", async () => {
    const definition = await savedDefinition(allFailureParameters(3, 10));
    const copy = await persistedCopy(definition);
    const catalogue = await renderEditor({ params: { catalogueDefinitionId: definition.id } });
    await screen.findByDisplayValue("Fentes");
    const definitionPhrase = phraseOf();
    const definitionLabel = cardLabel();
    catalogue.unmount();
    await renderEditor({ params: { exerciseId: copy.id }, exercises: [copy] });
    for (const [phrase, label] of [
      [definitionPhrase, definitionLabel],
      [phraseOf(), cardLabel()],
    ]) {
      expect(phrase).toBe("3 séries menées jusqu’à l’échec, avec 10 s de pause après chaque série.");
      expect(label).toContain("3 séries menées jusqu’à l’échec");
      // Aucune Durée totale (ni dans la Phrase, ni dans le libellé de la carte).
      expect(`${phrase} ${label}`).not.toContain("Durée totale");
    }
    expect(cardLabel()).toBe(definitionLabel);
  });
});
