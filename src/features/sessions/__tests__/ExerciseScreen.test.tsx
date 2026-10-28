import { readFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { AccessibilityInfo, Dimensions, Modal, ScrollView, StyleSheet } from "react-native";

import {
  durationParameters,
  repetitionParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import type { ActivityDefinition } from "@/domain/activities";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import type { DraftMediaItem } from "@/domain/media/ActivityMedia";
import type { ImportItem } from "@/domain/media/ActivityMediaImportService";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { createExerciseDraft, draftMovementOf, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { EDITOR_HEADER, editorSideMargin, isActivityEditorFormValid } from "@/features/activities/ActivityEditorForm";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { ExerciseScreen } from "@/features/sessions/ExerciseScreen";
import type { SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { FixedHeader } from "@/shared/ui/ScreenShell";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import {
  chooseExecutionMode,
  chooseExecutionSide,
  pressInExecutionSheet,
  tapExecutionSheetStep,
} from "@/features/activities/testing/executionSheetActions";

/**
 * `ExerciseScreen` s'auto-alimente désormais en Zones corporelles persistées
 * via `ActivityDefinitionService.listBodyZones()` (V2-PRE-1, plan §3.1,
 * UI-1652FFC3B512 ; correction device check Hermann, commentaire 5948936550 —
 * un accès direct à `useSQLiteContext` levait TOUJOURS en production, cet
 * écran étant rendu hors de `<SQLiteProvider>`) — chaque test fournit donc un
 * `ActivityDefinitionService` doublé via `ActivityDefinitionServiceContext`,
 * jamais `expo-sqlite`/`SqliteBodyZoneRepository`.
 */
const BODY_ZONE_FIXTURES: readonly BodyZone[] = [
  { id: "cou", name: "Cou", isActive: true, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "epaules", name: "Épaules", isActive: true, createdAt: "2026-01-01T00:00:01.000Z" },
  { id: "dos", name: "Dos", isActive: true, createdAt: "2026-01-01T00:00:04.000Z" },
  { id: "cuisses", name: "Cuisses", isActive: true, createdAt: "2026-01-01T00:00:06.000Z" },
];

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-exercise-id") }));

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

/**
 * `useCompositionExitGuard` mocké : ce test porte sur le contrat propre de
 * l'écran (états locaux, validations, isolement du brouillon), pas sur le
 * mécanisme réel de prévention de navigation — couvert avec un vrai
 * navigateur par `ExerciseNavigationGuard.integration.test.tsx`.
 */
const mockExitGuard = jest.fn();
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: (shouldBlock: boolean, onConfirmExit: () => void) =>
    mockExitGuard(shouldBlock, onConfirmExit),
}));

function defaultExitGuardResult() {
  return { isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() };
}

/**
 * Rend l'écran en mode AJOUT (`draftExercise` omis — `draft.exercises` vide,
 * aucun `exerciseId` en paramètre de route) ou en mode MODIFICATION
 * (`draftExercise` fourni — inséré dans `draft.exercises` ET son `id`
 * transmis comme `exerciseId`, exactement comme `CompositionScreen.tsx` le
 * fait via `router.push({pathname: "/exercise", params: {exerciseId}})`).
 */
/** `ActivityDefinitionService` doublé minimal — seule `listBodyZones` est exercée par le flux Composition (`CompositionExerciseEditor`). */
function fakeActivityDefinitionService(
  overrides: Partial<ActivityDefinitionService> = {},
): ActivityDefinitionService {
  return {
    listBodyZones: jest
      .fn<ActivityDefinitionService["listBodyZones"]>()
      .mockResolvedValue(BODY_ZONE_FIXTURES),
    // PRE-3 : adaptateurs médias (prêts, import, nettoyage gardé) — neutres par défaut.
    supportsMediaImport: true,
    leaseDraftMedia: jest.fn(),
    commitMediaDraft: jest.fn(),
    abandonMediaDraft: jest.fn(async () => []),
    importPendingMedia: jest.fn(async () => null),
    importMedia: jest.fn(async () => ({ status: "CANCELED" as const })),
    retryMediaImport: jest.fn(),
    resolveMediaUri: (uri: string) => uri,
    ...overrides,
  } as unknown as ActivityDefinitionService;
}

/**
 * V2-PRE-2 (plan §6.5) : `ActivityEditorForm` ouvre désormais
 * `BodyZonePickerModal`, qui s'auto-alimente via `ReferentialServiceContext`
 * — jamais `ActivityDefinitionService` pour cette modale.
 */
function fakeReferentialService(overrides: Partial<ReferentialService> = {}): ReferentialService {
  return {
    listBodyZones: jest.fn(async () => BODY_ZONE_FIXTURES),
    createBodyZone: jest.fn(async () => ({ status: "DUPLICATE" as const })),
    renameBodyZone: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    retireBodyZone: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    isBodyZoneUsed: jest.fn(async () => false),
    listCategories: jest.fn(async () => []),
    ...overrides,
  } as unknown as ReferentialService;
}

/**
 * V2-PRE-2 (plan §6.1/§7, T21) : `CatalogueActivityEditorScreen` lit le
 * Profil une seule fois au montage (Pause entre les côtés par défaut,
 * silhouette) — jamais `SessionServiceProvider` en test, un `ProfileService`
 * doublé minimal suffit.
 */
function fakeProfileService(overrides: Partial<ProfileService> = {}): ProfileService {
  return {
    getProfile: jest.fn(async () => createDefaultProfile("profile-1", "2026-01-01T00:00:00.000Z")),
    ...overrides,
  } as unknown as ProfileService;
}

function renderScreen(draftExercise: SessionDraftExercise | null = null) {
  const updateDraft = jest.fn();
  mockSearchParams = draftExercise ? { exerciseId: draftExercise.id } : {};
  const contextValue: SessionDraftContextValue = {
    draft: {
      name: "Séance simple",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercises: draftExercise ? [draftExercise] : [],
    },
    updateDraft,
    resetDraft: jest.fn(),
  };

  const { unmount } = render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService()}>
        <ReferentialServiceContext.Provider value={fakeReferentialService()}>
          <ProfileServiceContext.Provider value={fakeProfileService()}>
            <SessionDraftContext.Provider value={contextValue}>
              <ExerciseScreen />
            </SessionDraftContext.Provider>
          </ProfileServiceContext.Provider>
        </ReferentialServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );

  return { updateDraft, unmount };
}

const t = strings.screens.exercise;


/**
 * `Platform.OS` par défaut dans cet environnement Jest (`jest-expo`) est
 * `"ios"` — `DurationWheelPicker` délègue donc à la roulette native SwiftUI
 * (voir `DurationWheelPicker.tsx`) ; les interactions ci-dessous utilisent
 * `fireNativeSelectionChange` (événement `selectionChange`), jamais
 * `fireEvent.scroll` (chemin Android/web uniquement).
 */
function fireNativeSelectionChange(
  element: ReturnType<typeof screen.getByTestId>,
  selection: number,
) {
  fireEvent(element, "selectionChange", { nativeEvent: { selection } });
}


beforeEach(() => {
  mockExitGuard.mockReset();
  mockExitGuard.mockReturnValue(defaultExitGuardResult());
  mockBack.mockReset();
  mockSearchParams = {};
});

const A_CATEGORY: Category = {
  id: "cardio",
  name: "Cardio",
  canonicalKey: "cardio",
  color: "#3B82F6",
  isPredefined: true,
  displayOrder: 1,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const CANONICAL: ExecutionParameters = variableParameters({
  mode: "DURATION",
  rows: [
    [30, 10],
    [45, 20],
  ],
  sideMode: "RIGHT_LEFT",
  sideOrder: "BY_SIDE",
  sideRecoverySeconds: 7,
  cadenceBeepIntervalSeconds: 4,
  countdownSeconds: 3,
  endSeconds: 2,
});

const PHOTO: DraftMediaItem = {
  assetId: "p1",
  asset: { id: "p1", uri: "kodjo-media/p1.jpg", createdAt: "now", kind: "PHOTO" },
};

function canonicalOccurrence(overrides: Partial<SessionDraftExercise> = {}): SessionDraftExercise {
  return {
    ...createExerciseDraft("occ-1", 30),
    name: "Fentes",
    sideMode: "RIGHT_LEFT",
    bodyZoneIds: ["cuisses"],
    executionParameters: CANONICAL,
    categoryId: "cardio",
    media: [PHOTO],
    ...overrides,
  };
}

/** Rend la route avec un brouillon de Composition, des services doublés et une Catégorie disponible. */
function renderRoute(options: {
  readonly params?: { exerciseId?: string; catalogueDefinitionId?: string };
  readonly exercises?: readonly SessionDraftExercise[];
  readonly service?: Partial<ActivityDefinitionService>;
  readonly profile?: Partial<ReturnType<typeof createDefaultProfile>>;
  /** PRE-4 story 4.3 : opérations de référentiel doublées (création, échec injecté). */
  readonly referential?: Partial<ReferentialService>;
  /** PRE-6 story 2.3 : surcharges du brouillon (nature et compte du Circuit). */
  readonly draft?: Partial<SessionDraftContextValue["draft"]>;
}) {
  mockSearchParams = options.params ?? {};
  const updateDraft = jest.fn<(patch: Partial<SessionDraftContextValue["draft"]>) => void>();
  const service = fakeActivityDefinitionService(options.service);
  const referential = fakeReferentialService({ listCategories: jest.fn(async () => [A_CATEGORY]), ...options.referential });
  const profileService = fakeProfileService({
    getProfile: jest.fn(async () => ({
      ...createDefaultProfile("profile-1", "2026-01-01T00:00:00.000Z"),
      ...options.profile,
    })),
  });
  const resetDraft = jest.fn();
  // PRE-6 story 3.3 : même arbre, occurrences du brouillon remplaçables (hydratation tardive).
  const tree = (exercises: readonly SessionDraftExercise[]) => (
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>
        <ReferentialServiceContext.Provider value={referential}>
          <ProfileServiceContext.Provider value={profileService}>
            <SessionDraftContext.Provider
              value={{
                draft: {
                  name: "Séance simple",
                  labelId: null,
                  initialCountdownSeconds: 10,
                  finalPhaseSeconds: 5,
                  exercises,
                  ...options.draft,
                },
                updateDraft,
                resetDraft,
              }}
            >
              <ExerciseScreen />
            </SessionDraftContext.Provider>
          </ProfileServiceContext.Provider>
        </ReferentialServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>
  );
  const view = render(tree(options.exercises ?? []));
  return { updateDraft, service, rerenderExercises: (exercises: readonly SessionDraftExercise[]) => view.rerender(tree(exercises)) };
}

async function chooseCategory() {
  fireEvent.press(screen.getByTestId("activity-editor-category-button"));
  fireEvent.press(await screen.findByTestId("category-picker-tag-cardio"));
  // Décision propriétaire D-8 (12/10) : le toucher marque la Catégorie, ✓ confirme et ferme.
  fireEvent.press(screen.getByTestId("category-picker-confirm"));
  // Fermeture progressive (220 ms). Recette 3 : dans cette suite, chaque image du rendu de
  // test est coûteuse ; la fermeture mesurée se termine ({ finished: true }) en ≈ 7 s réelles.
  await waitFor(() => expect(screen.queryByTestId("category-picker-sheet")).toBeNull(), { timeout: 20000 });
}

async function chooseZone(id = "cuisses") {
  fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
  fireEvent.press(await screen.findByTestId(`body-zone-selector-tag-${id}`));
  await act(async () => {
    fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
  });
}

/** Ouvre la feuille, choisit Durée 45 s × N séries, puis ✓. */
function setDurationParameters() {
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  // PRE-4 story 3.1 : popover natif sur iOS, segmenté ailleurs.
  chooseExecutionMode("Durée");
  fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
  fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 0);
  fireNativeSelectionChange(screen.getByTestId("duration-wheel-seconds"), 45);
  pressInExecutionSheet(screen.getByTestId("duration-wheel-validate"));
  fireEvent.press(screen.getByTestId("execution-sheet-validate"));
}

async function fillNewExercise() {
  fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Squat");
  await chooseCategory();
  await chooseZone();
  setDurationParameters();
}

function lastGuardBlock(): boolean {
  const calls = mockExitGuard.mock.calls;
  return calls[calls.length - 1]![0] as boolean;
}

describe("ExerciseScreen — Shell partagé (header/séparateur fixes, zone bleue fixe, corps défilant, action finale fixe)", () => {
  it("uses the shared FixedHeader without separator (recette 2, T-49), showing the functional title — never the Session name (D-105)", () => {
    renderScreen();
    // Recette 2 (T-49, décision du 12/10) : aucun liseré sous l’en-tête de Créer/Modifier un exercice.
    expect(screen.queryByTestId("screen-header-separator")).toBeNull();
    expect(screen.getByText(t.titleAdd)).toBeTruthy();
    expect(screen.queryByText("Séance simple")).toBeNull();
  });

  it("shows the edit title when editing an existing Activity", () => {
    renderScreen(createExerciseDraft("ex-1"));
    expect(screen.getByText(t.titleEdit)).toBeTruthy();
  });

  it("the blue band starts with the name field and carries the Catégorie / Zones access", () => {
    renderScreen();
    const band = screen.getByTestId("exercise-context-band");
    expect(within(band).getByTestId("exercise-name-input")).toBeTruthy();
    expect(within(band).getByTestId("activity-editor-category-button")).toBeTruthy();
    expect(within(band).getByTestId("exercise-body-zones-open")).toBeTruthy();
  });

  it("Retour always calls router.back()", () => {
    renderScreen();
    fireEvent.press(screen.getByTestId("screen-header-back"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("exactly one scrollable body: header, blue band and final action stay outside it", () => {
    renderScreen();
    const body = screen.getByTestId("exercise-body");
    expect(within(body).queryByTestId("exercise-context-band")).toBeNull();
    expect(within(body).queryByTestId("exercise-finish-action")).toBeNull();
    expect(within(body).getByTestId("exercise-parameters-card")).toBeTruthy();
    expect(screen.UNSAFE_getAllByType(ScrollView).filter((node) => node.props.testID === "exercise-body")).toHaveLength(1);
  });
});

describe("ExerciseScreen — mode modification (contrats conservés)", () => {
  it("prefills the name and replaces the edited Activity by id on Terminer, exactly once (synchronous lock)", () => {
    const existing = canonicalOccurrence();
    const { updateDraft } = renderRoute({ params: { exerciseId: existing.id }, exercises: [existing] });
    expect(screen.getByDisplayValue("Fentes")).toBeTruthy();
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Fentes sautées");
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    expect(updateDraft).toHaveBeenCalledTimes(1);
    const exercises = updateDraft.mock.calls[0]![0].exercises!;
    expect(exercises).toHaveLength(1);
    expect(exercises[0]).toMatchObject({ id: "occ-1", name: "Fentes sautées" });
  });

  it("a NEW Activity is appended after the existing ones, never replacing them", async () => {
    const existing = canonicalOccurrence({ id: "occ-0" });
    const { updateDraft } = renderRoute({ exercises: [existing] });
    await fillNewExercise();
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    const exercises = updateDraft.mock.calls[0]![0].exercises!;
    expect(exercises.map((exercise) => exercise.id)).toEqual(["occ-0", "generated-exercise-id"]);
  });
});

describe("ExerciseScreen — modale d'abandon (D-094)", () => {
  it("renders ExerciseExitConfirmModal exactly when isPendingExit is true, wired to cancelExit/confirmExit", () => {
    const cancelExit = jest.fn();
    const confirmExit = jest.fn();
    mockExitGuard.mockReturnValue({ isPendingExit: true, cancelExit, confirmExit });
    renderScreen();
    expect(screen.getByTestId("exercise-exit-confirm-card")).toBeTruthy();
  });

  it("never renders the modal while isPendingExit is false", () => {
    renderScreen();
    expect(screen.queryByTestId("exercise-exit-confirm-card")).toBeNull();
  });
});

describe("ExerciseScreen — PRE-3 (quatre parcours)", () => {
  it("P3-01/Catalogue:create — Terminer écrit UNE définition (paramètres canoniques, Catégorie, Zones, médias) et jamais le brouillon de Séance", async () => {
    const createActivityDefinition = jest
      .fn<ActivityDefinitionService["createActivityDefinition"]>()
      .mockResolvedValue({ ok: true, value: {} as ActivityDefinition });
    const { updateDraft, service } = renderRoute({ params: { catalogueDefinitionId: "new" }, service: { createActivityDefinition } });
    await fillNewExercise();
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    expect(createActivityDefinition).toHaveBeenCalledTimes(1);
    expect(createActivityDefinition.mock.calls[0]![0]).toMatchObject({
      name: "Squat",
      category: { kind: "EXISTING", categoryId: "cardio" },
      bodyZoneIds: ["cuisses"],
      executionParameters: expect.objectContaining({
        mode: "DURATION",
        series: { kind: "UNIFORM", count: 1, target: { kind: "NUMBER", value: 45 }, pauseSeconds: 0, loadKg: 0, workPhases: [] },
      }),
      media: [],
    });
    expect(updateDraft).not.toHaveBeenCalled();
    expect(service.commitMediaDraft).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it("P3-01/Catalogue:edit — tous les champs rouverts (variable, côtés, bip, CR/Fin, médias) ; Terminer met à jour cette définition", async () => {
    const definition: ActivityDefinition = {
      id: "def-1",
      movementId: "mov-1",
      name: "Fentes",
      description: "Dos droit",
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      sideMode: "RIGHT_LEFT",
      sideRecoverySeconds: 7,
      executionParameters: CANONICAL,
      media: [{ id: "l1", activityDefinitionId: "def-1", assetId: "p1", position: 0, asset: PHOTO.asset }],
      createdAt: "now",
      updatedAt: "now",
    };
    const updateActivityDefinition = jest
      .fn<ActivityDefinitionService["updateActivityDefinition"]>()
      .mockResolvedValue({ status: "UPDATED", value: definition });
    renderRoute({
      params: { catalogueDefinitionId: "def-1" },
      service: { getActivityDefinition: jest.fn(async () => definition), updateActivityDefinition },
    });
    expect(await screen.findByDisplayValue("Fentes")).toBeTruthy();
    expect(screen.getByDisplayValue("Dos droit")).toBeTruthy();
    // PRE-5 story 3.2 (R-14) : CR/Fin ne sont plus sur la Carte ; la Feuille les rouvre.
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    fireEvent.press(screen.getByLabelText("Afficher le compte à rebours et la fin d’exercice"));
    expect(screen.getByTestId("execution-sheet-countdown-value").props.children).toBe("3 s");
    expect(screen.getByTestId("execution-sheet-end-value").props.children).toBe("2 s");
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    expect(screen.getByTestId("media-item-1")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    expect(updateActivityDefinition).toHaveBeenCalledWith(
      "def-1",
      expect.objectContaining({ executionParameters: CANONICAL, media: [{ assetId: "p1", asset: PHOTO.asset }] }),
    );
  });

  it("P3-01/Session:create — la copie est appliquée au brouillon de Composition seulement (aucun service d'écriture)", async () => {
    const createActivityDefinition = jest.fn<ActivityDefinitionService["createActivityDefinition"]>();
    const { updateDraft } = renderRoute({ service: { createActivityDefinition } });
    await fillNewExercise();
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    expect(updateDraft).toHaveBeenCalledTimes(1);
    expect(updateDraft.mock.calls[0]![0].exercises![0]).toMatchObject({
      name: "Squat",
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      executionParameters: expect.objectContaining({
        mode: "DURATION",
        series: expect.objectContaining({ target: { kind: "NUMBER", value: 45 } }),
      }),
    });
    expect(createActivityDefinition).not.toHaveBeenCalled();
  });

  it("P3-01/Session:edit — l'occurrence rouvre ses paramètres canoniques et médias ; Terminer les conserve", () => {
    const existing = canonicalOccurrence();
    const { updateDraft } = renderRoute({ params: { exerciseId: "occ-1" }, exercises: [existing] });
    expect(screen.getByTestId("media-item-1")).toBeTruthy();
    // PRE-5 story 3.2 (R-14) : la Fin (2 s) n'est plus sur la Carte ; Terminer la conserve (CANONICAL).
    expect(screen.queryByTestId("exercise-parameters-end")).toBeNull();
    fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "Genou aligné");
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    expect(updateDraft.mock.calls[0]![0].exercises![0]).toMatchObject({
      executionParameters: CANONICAL,
      media: [PHOTO],
      instruction: "Genou aligné",
      postActivityRecoverySeconds: 30,
    });
  });

  it("P3-01/copy-isolation — modifier une occurrence ne change ni l'autre occurrence ni ses paramètres/médias", () => {
    const first = canonicalOccurrence({ id: "occ-1" });
    const second = canonicalOccurrence({ id: "occ-2" });
    const { updateDraft } = renderRoute({ params: { exerciseId: "occ-1" }, exercises: [first, second] });
    fireEvent(screen.getByTestId("media-item-1"), "accessibilityAction", { nativeEvent: { actionName: "remove" } });
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    const [updatedFirst, untouchedSecond] = updateDraft.mock.calls[0]![0].exercises!;
    expect(updatedFirst!.media).toEqual([]);
    expect(untouchedSecond).toBe(second);
    expect(second.media).toEqual([PHOTO]);
    expect(second.executionParameters).toBe(CANONICAL);
  });

  it("P3-02/editor-fields — Terminer reste inactif jusqu'à Nom + Catégorie + Zone + paramètres valides, puis revient à l'hôte", async () => {
    renderRoute({});
    const finish = () => screen.getByTestId("exercise-finish-action").props.accessibilityState;
    expect(finish()).toMatchObject({ disabled: true });
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Squat");
    expect(finish()).toMatchObject({ disabled: true });
    await chooseCategory();
    await chooseZone();
    expect(finish()).toMatchObject({ disabled: true });
    setDurationParameters();
    expect(finish()).toMatchObject({ disabled: false });
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it("P3-03/reference-retired — une Catégorie/Zone retirée affectée à un objet existant est conservée à l'enregistrement", () => {
    const existing = canonicalOccurrence({ categoryId: "retiree", bodyZoneIds: ["zone-retiree"] });
    const { updateDraft } = renderRoute({ params: { exerciseId: "occ-1" }, exercises: [existing] });
    fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "Nouvelle description");
    expect(screen.getByTestId("exercise-finish-action").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    expect(updateDraft.mock.calls[0]![0].exercises![0]).toMatchObject({ categoryId: "retiree", bodyZoneIds: ["zone-retiree"] });
  });

  it("P3-10/profile-new-only — un nouvel Exercice copie CR/Fin du Profil ; la PC est copiée à l'activation ; un objet existant garde 7/3/2", async () => {
    const created = renderRoute({ profile: { exerciseCountdownSecondsDefault: 12, exerciseEndSecondsDefault: 6, sideChangeRecoverySecondsDefault: 9 } });
    // PRE-5 story 3.2 (R-14) : CR/Fin ne sont plus sur la Carte ; leur copie est vérifiée à Terminer.
    expect(screen.queryByTestId("exercise-parameters-countdown")).toBeNull();
    // Le Profil se charge de façon asynchrone : on attend son effet observable, la Pause entre
    // les côtés copiée du Profil (9 s) à l'activation de Avec — chaque essai annule la Feuille.
    await waitFor(() => {
      fireEvent.press(screen.getByTestId("exercise-parameters-card"));
      // PRE-5 story 2.5 (AC4, D-409, RM-218) : Exercice ouvert depuis une Séance — la Feuille ne
      // présente ni Compte à rebours ni Fin, ni le chevron de la Durée de l'exercice.
      expect(screen.queryByTestId("execution-sheet-row-countdown")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-row-end")).toBeNull();
      expect(screen.queryByTestId("execution-sheet-duration-disclosure-frame")).toBeNull();
      // PRE-5 story 2.5 (AC1) : Avec (Sans → Avec) copie la Pause entre les côtés du Profil.
      chooseExecutionSide("Avec");
      const sideRecovery = screen.getByTestId("execution-sheet-side-recovery-value").props.children as string;
      fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
      expect(sideRecovery).toBe("9 s");
    });
    await fillNewExercise();
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    expect(created.updateDraft.mock.calls[0]![0].exercises![0]!.executionParameters).toMatchObject({
      countdownSeconds: 12,
      endSeconds: 6,
    });

    const existing = canonicalOccurrence({ id: "occ-9" });
    const second = renderRoute({ params: { exerciseId: "occ-9" }, exercises: [existing], profile: { exerciseCountdownSecondsDefault: 20 } });
    fireEvent.press(screen.getAllByTestId("exercise-finish-action").at(-1)!);
    expect(second.updateDraft.mock.calls[0]![0].exercises![0]!.executionParameters).toMatchObject({
      countdownSeconds: 3,
      endSeconds: 2,
    });
  });

  it("P3-13/no-auto-R — nouvelle occurrence : R = 0 s quel que soit le Profil ; occurrence existante : R = 30 s inchangée", async () => {
    const { updateDraft } = renderRoute({ profile: { postActivityRecoverySecondsDefault: 45 } });
    await fillNewExercise();
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    expect(updateDraft.mock.calls[0]![0].exercises![0]!.postActivityRecoverySeconds).toBeNull(); // PRE-6 (story 1.1, AD-35) : absente

    const existing = canonicalOccurrence({ id: "occ-3" });
    const second = renderRoute({ params: { exerciseId: "occ-3" }, exercises: [existing], profile: { postActivityRecoverySecondsDefault: 45 } });
    fireEvent.press(screen.getAllByTestId("exercise-finish-action").at(-1)!);
    expect(second.updateDraft.mock.calls[0]![0].exercises![0]!.postActivityRecoverySeconds).toBe(30);
  });

  it("P3-16/sheet-boundary — ✕ laisse le parent identique ; ✓ applique au parent sans aucun appel de service ; la phrase change", () => {
    const existing = canonicalOccurrence();
    const { updateDraft, service } = renderRoute({ params: { exerciseId: "occ-1" }, exercises: [existing] });
    const before = screen.getByTestId("exercise-parameters-card").props.accessibilityLabel;
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    tapExecutionSheetStep("execution-sheet-series-increment");
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    expect(screen.getByTestId("exercise-parameters-card").props.accessibilityLabel).toBe(before);
    expect(lastGuardBlock()).toBe(false);
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    tapExecutionSheetStep("execution-sheet-series-increment");
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    expect(screen.getByTestId("exercise-parameters-card").props.accessibilityLabel).not.toBe(before);
    expect(screen.getByTestId("exercise-parameters-card").props.accessibilityLabel).toContain("3 séries");
    expect(updateDraft).not.toHaveBeenCalled();
    expect(service.createActivityDefinition).toBeUndefined();
    expect(lastGuardBlock()).toBe(true);
  });

  it("P3-16/parent-guard — la garde parent s'arme sur un média retiré ; Annuler la garde conserve tout ; Confirmer nettoie les seules préparations", () => {
    const cancelExit = jest.fn();
    const confirmExit = jest.fn();
    const existing = canonicalOccurrence();
    const { service } = renderRoute({ params: { exerciseId: "occ-1" }, exercises: [existing] });
    expect(lastGuardBlock()).toBe(false);
    fireEvent(screen.getByTestId("media-item-1"), "accessibilityAction", { nativeEvent: { actionName: "remove" } });
    expect(lastGuardBlock()).toBe(true);
    const onConfirmExit = mockExitGuard.mock.calls.at(-1)![1] as () => void;
    mockExitGuard.mockReturnValue({ isPendingExit: true, cancelExit, confirmExit });
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Fentes");
    fireEvent.press(within(screen.getByTestId("exercise-exit-confirm-actions")).getByText(t.exitConfirmModal.continueEditing));
    expect(cancelExit).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("media-item-1")).toBeNull();
    onConfirmExit();
    expect(service.abandonMediaDraft).toHaveBeenCalledWith("occurrence:occ-1");
  });

  it("P3-16/failure-doubletap — une seule opération en vol ; échec : brouillon et médias conservés, erreur annoncée ; réessai unique", async () => {
    let fail = true;
    const createActivityDefinition = jest.fn<ActivityDefinitionService["createActivityDefinition"]>(async () => {
      if (fail) throw new Error("rollback");
      return { ok: true, value: {} as ActivityDefinition };
    });
    renderRoute({ params: { catalogueDefinitionId: "new" }, service: { createActivityDefinition } });
    await fillNewExercise();
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    expect(createActivityDefinition).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("activity-editor-save-error")).toBeTruthy();
    expect(screen.getByDisplayValue("Squat")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
    fail = false;
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    expect(createActivityDefinition).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  });

  it("P3-23/cancel-local-error — annulation neutre ; élément échoué visible avec Réessayer ; brouillon intact ; réessai sans doublon", async () => {
    const failed: ImportItem = {
      key: "k1",
      state: "FAILED",
      picked: { uri: "file:///c.jpg", kind: "PHOTO", mimeType: null, fileName: null, sizeBytes: null, durationMs: null, width: null, height: null, nativeAssetId: null },
      error: "COPY_FAILED",
    };
    const ready: ImportItem = { key: "k2", state: "READY", picked: failed.picked, media: { assetId: "k2", asset: { ...PHOTO.asset, id: "k2" } } };
    const importMedia = jest
      .fn<ActivityDefinitionService["importMedia"]>()
      .mockResolvedValueOnce({ status: "CANCELED" })
      .mockResolvedValueOnce({ status: "IMPORTED", items: [ready, failed], limitedAccess: false });
    const retryMediaImport = jest
      .fn<ActivityDefinitionService["retryMediaImport"]>()
      .mockResolvedValue({ ...failed, state: "READY", media: { assetId: "k1", asset: { ...PHOTO.asset, id: "k1" } } } as ImportItem);
    renderRoute({ service: { importMedia, retryMediaImport } });
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Squat");
    await act(async () => {
      fireEvent.press(screen.getByTestId("media-add"));
    });
    expect(screen.queryByTestId("media-item-1")).toBeNull();
    expect(screen.queryByTestId("media-notice")).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByTestId("media-add"));
    });
    expect(screen.getByTestId("media-item-1")).toBeTruthy();
    expect(screen.getByTestId("media-pending-1-retry")).toBeTruthy();
    expect(screen.getByDisplayValue("Squat")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId("media-pending-1-retry"));
    });
    expect(screen.getByTestId("media-item-2")).toBeTruthy();
    expect(screen.queryByTestId("media-item-3")).toBeNull();
    expect(screen.queryByTestId("media-pending-1")).toBeNull();
  });

  it("INTERACTION/editor-finish — Catalogue écrit la définition, Séance applique au brouillon ; une seule action même en double appui", async () => {
    const { updateDraft } = renderRoute({});
    await fillNewExercise();
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    expect(updateDraft).toHaveBeenCalledTimes(1);
  });

  it("ACCESSIBILITY/editor-finish — Nom, description et Terminer identifiables ; état indisponible exposé ; erreur annoncée sans perte", async () => {
    const createActivityDefinition = jest.fn<ActivityDefinitionService["createActivityDefinition"]>().mockResolvedValue({
      ok: false,
      violations: [{ code: "REQUIRED", field: "activityDefinition.name" }],
    });
    renderRoute({ params: { catalogueDefinitionId: "new" }, service: { createActivityDefinition } });
    expect(screen.getByLabelText("Nom de l’exercice")).toBeTruthy();
    // PRE-5 story 3.1 (AC6) : titre « Description de l’exercice », première étape nommée « Étape 1 ».
    expect(screen.getByText("Description de l’exercice")).toBeTruthy();
    expect(screen.getByLabelText("Étape 1")).toBeTruthy();
    expect(screen.getByLabelText(t.finishAction).props.accessibilityState).toMatchObject({ disabled: true });
    await fillNewExercise();
    await act(async () => {
      fireEvent.press(screen.getByLabelText(t.finishAction));
    });
    expect(screen.getByTestId("activity-editor-save-error").props.accessibilityLiveRegion).toBe("polite");
    expect(screen.getByDisplayValue("Squat")).toBeTruthy();
    expect(screen.getByLabelText(t.finishAction).props.accessibilityState).toMatchObject({ disabled: false });
  });
});

/**
 * PRE-4 (story 1.1, AD-13, H25) — validation unique avec la ligne de base
 * relue à l'ouverture de l'Éditeur (parcours Catalogue).
 */
describe("ExerciseScreen — PRE-4 story 1.1 (ligne de base, Cible à renseigner)", () => {
  function legacyDefinition(executionParameters: ExecutionParameters): ActivityDefinition {
    return {
      id: "def-legacy",
      movementId: "mov-1",
      name: "Gainage",
      description: null,
      executionParameters,
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      sideMode: executionParameters.sideMode,
      sideRecoverySeconds: executionParameters.sideRecoverySeconds,
      media: [],
      createdAt: "now",
      updatedAt: "now",
    };
  }

  function renderDefinition(definition: ActivityDefinition) {
    const updateActivityDefinition = jest
      .fn<ActivityDefinitionService["updateActivityDefinition"]>()
      .mockResolvedValue({ status: "UPDATED", value: definition });
    renderRoute({
      params: { catalogueDefinitionId: definition.id },
      service: { getActivityDefinition: jest.fn(async () => definition), updateActivityDefinition },
    });
    return updateActivityDefinition;
  }

  /** Story 3.3 : appui bref sur un ± de la Feuille ; le champ hors tableau est ouvert au besoin. */
  const step = tapExecutionSheetStep;

  it("PRE4-1.1/AC24 — Cible Durée historique de 5999 s : renommer puis Terminer enregistre la Cible 5999 s inchangée", async () => {
    const updateActivityDefinition = renderDefinition(legacyDefinition(durationParameters(5999, 1, 0)));
    fireEvent.changeText(await screen.findByDisplayValue("Gainage"), "Gainage lent");
    expect(screen.getByTestId("activity-editor-finish-action").props.accessibilityState).toMatchObject({ disabled: false });
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    expect(updateActivityDefinition).toHaveBeenCalledTimes(1);
    expect(updateActivityDefinition.mock.calls[0]![1]).toMatchObject({
      name: "Gainage lent",
      executionParameters: { series: { kind: "UNIFORM", target: { kind: "NUMBER", value: 5999 } } },
    });
  });

  it("PRE4-1.1/AC24 — même Exercice : ✓ de la Feuille disponible sans toucher la Cible, qui reste 5999 s", async () => {
    const updateActivityDefinition = renderDefinition(legacyDefinition(durationParameters(5999, 1, 0)));
    await screen.findByDisplayValue("Gainage");
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    expect(updateActivityDefinition.mock.calls[0]![1].executionParameters.series).toEqual({
      kind: "UNIFORM",
      count: 1,
      target: { kind: "NUMBER", value: 5999 },
      pauseSeconds: 0, loadKg: 0, workPhases: [],
    });
  });

  it("PRE4-1.1/AC24 — Bip historique de 11 : changer une Pause, ✓ puis Terminer conserve le Bip 11", async () => {
    const updateActivityDefinition = renderDefinition(
      legacyDefinition(durationParameters(30, 2, 10, { cadenceBeepIntervalSeconds: 11 })),
    );
    await screen.findByDisplayValue("Gainage");
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    step("execution-sheet-pause-increment");
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    const saved = updateActivityDefinition.mock.calls[0]![1].executionParameters;
    expect(saved.cadenceBeepIntervalSeconds).toBe(11);
    expect(saved.series).toMatchObject({ kind: "UNIFORM", pauseSeconds: 11, loadKg: 0, workPhases: [] });
  });

  describe("PRE4-3.2/AC12 — ligne historique déplacée dans la Feuille, puis Terminer (ligne de base de l'Éditeur)", () => {
    const legacyRows = () =>
      legacyDefinition(variableParameters({ mode: "DURATION", rows: [[30, 10], [5999, 20], [7, 30]], cadenceBeepIntervalSeconds: 11 }));
    const moveAction = (row: number, actionName: "moveUp" | "moveDown") =>
      fireEvent(screen.getByTestId(`execution-sheet-table-row-${row}-handle`), "accessibilityAction", {
        nativeEvent: { actionName },
      });
    const expectAvailable = (testID: string) =>
      expect(screen.getByTestId(testID).props.accessibilityState).toMatchObject({ disabled: false });
    const moved = {
      kind: "VARIABLE",
      rows: [
        { target: { kind: "NUMBER", value: 5999 }, pauseSeconds: 20, loadKg: 0 },
        { target: { kind: "NUMBER", value: 30 }, pauseSeconds: 10, loadKg: 0 },
        { target: { kind: "NUMBER", value: 7 }, pauseSeconds: 30, loadKg: 0 },
      ],
      workPhases: [],
    };

    it("PRE4-3.2/AC12 — 5999 s déplacée en tête, ✓ : Terminer reste disponible et enregistre [5999, 30, 7] et le Bip 11 inchangés", async () => {
      const updateActivityDefinition = renderDefinition(legacyRows());
      await screen.findByDisplayValue("Gainage");
      fireEvent.press(screen.getByTestId("exercise-parameters-card"));
      moveAction(2, "moveUp");
      expectAvailable("execution-sheet-validate");
      fireEvent.press(screen.getByTestId("execution-sheet-validate"));
      expectAvailable("activity-editor-finish-action");
      await act(async () => {
        fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
      });
      expect(updateActivityDefinition).toHaveBeenCalledTimes(1);
      const saved = updateActivityDefinition.mock.calls[0]![1].executionParameters;
      expect(saved.series).toEqual(moved);
      expect(saved.cadenceBeepIntervalSeconds).toBe(11);
    });

    it("PRE4-3.2/AC12 — Feuille rouverte après ce ✓ : ✓ et Terminer restent disponibles, valeurs inchangées", async () => {
      const updateActivityDefinition = renderDefinition(legacyRows());
      await screen.findByDisplayValue("Gainage");
      fireEvent.press(screen.getByTestId("exercise-parameters-card"));
      moveAction(2, "moveUp");
      fireEvent.press(screen.getByTestId("execution-sheet-validate"));
      fireEvent.press(screen.getByTestId("exercise-parameters-card"));
      expectAvailable("execution-sheet-validate");
      fireEvent.press(screen.getByTestId("execution-sheet-validate"));
      expectAvailable("activity-editor-finish-action");
      await act(async () => {
        fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
      });
      const saved = updateActivityDefinition.mock.calls[0]![1].executionParameters;
      expect(saved.series).toEqual(moved);
      expect(saved.cadenceBeepIntervalSeconds).toBe(11);
    });
  });

  it("PRE4-1.1/AC23 — Cible héritée à renseigner : « Paramètres à compléter. », Terminer et ✓ indisponibles ; une Cible réglée est enregistrée NUMBER, jamais FAILURE", async () => {
    const updateActivityDefinition = renderDefinition(legacyDefinition(repetitionParameters("UNSET", 3, 10)));
    await screen.findByDisplayValue("Gainage");
    expect(screen.getByTestId("exercise-parameters-phrase").props.children).toBe("Paramètres à compléter.");
    expect(screen.getByTestId("activity-editor-finish-action").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    expect(screen.getByTestId("execution-sheet-target-value-text").props.children).toBe("—");
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    // Story 3.5 : Sélecteur ouvert sur 1 (« — », Q25), ✓ sans tourner applique 1.
    fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
    fireEvent.press(screen.getByTestId("number-wheel-validate"));
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    expect(screen.getByTestId("activity-editor-finish-action").props.accessibilityState).toMatchObject({ disabled: false });
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    const saved = updateActivityDefinition.mock.calls[0]![1].executionParameters;
    expect(saved.series).toEqual({ kind: "UNIFORM", count: 3, target: { kind: "NUMBER", value: 1 }, pauseSeconds: 10, loadKg: 0, workPhases: [] });
    expect(JSON.stringify(saved)).not.toContain("FAILURE");
  });
});

/**
 * PRE-4 (story 1.1, AC24, H25) — chemin Séance (`CompositionExerciseEditor`,
 * `params: { exerciseId }`) : une valeur héritée hors bornes, non modifiée,
 * n'empêche ni `Terminer` ni le ✓ de la Feuille, et reste inchangée dans le
 * brouillon de Composition.
 */
describe("ExerciseScreen — PRE-4 story 1.1, chemin Séance (occurrence héritée hors bornes)", () => {
  const inherited: readonly [string, ExecutionParameters, (params: ExecutionParameters) => unknown][] = [
    ["Cible Durée 5999 s", durationParameters(5999, 1, 0), (params) => params.series],
    ["Cible 150 répétitions", repetitionParameters(150, 3, 10), (params) => params.series],
    ["Bip 11", repetitionParameters(10, 3, 10, { cadenceBeepIntervalSeconds: 11 }), (params) => params.cadenceBeepIntervalSeconds],
  ];

  it.each(inherited)(
    "PRE4-1.1/AC24 — %s : renommer seulement, Terminer disponible, valeur inchangée dans le brouillon",
    (_label, executionParameters, pick) => {
      const existing = canonicalOccurrence({ executionParameters, sideMode: "UNILATERAL" });
      const { updateDraft } = renderRoute({ params: { exerciseId: existing.id }, exercises: [existing] });
      fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Fentes lentes");
      expect(screen.getByTestId("exercise-finish-action").props.accessibilityState).toMatchObject({ disabled: false });
      fireEvent.press(screen.getByTestId("exercise-finish-action"));
      expect(updateDraft).toHaveBeenCalledTimes(1);
      const saved = updateDraft.mock.calls[0]![0].exercises![0]!;
      expect(saved.name).toBe("Fentes lentes");
      expect(pick(saved.executionParameters as ExecutionParameters)).toEqual(pick(executionParameters));
    },
  );

  it("PRE4-1.1/AC24 — Cible Durée 5999 s : ✓ de la Feuille disponible sans toucher la Cible ; Terminer la garde à 5999 s", () => {
    const existing = canonicalOccurrence({ executionParameters: durationParameters(5999, 1, 0), sideMode: "UNILATERAL" });
    const { updateDraft } = renderRoute({ params: { exerciseId: existing.id }, exercises: [existing] });
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    expect(updateDraft.mock.calls[0]![0].exercises![0]!.executionParameters.series).toEqual({
      kind: "UNIFORM",
      count: 1,
      target: { kind: "NUMBER", value: 5999 },
      pauseSeconds: 0, loadKg: 0, workPhases: [],
    });
  });
});

describe("ExerciseScreen — adaptateur Catalogue (contrats conservés)", () => {
  it("shows an explicit error — never an endless loading state — when the definition is absent, and Réessayer reloads", async () => {
    const getActivityDefinition = jest
      .fn<ActivityDefinitionService["getActivityDefinition"]>()
      .mockRejectedValueOnce(new Error("io"))
      .mockResolvedValueOnce(null);
    renderRoute({ params: { catalogueDefinitionId: "def-x" }, service: { getActivityDefinition } });
    expect(await screen.findByTestId("activity-editor-load-error")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-load-retry"));
    });
    expect(getActivityDefinition).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("activity-editor-load-error")).toBeTruthy();
  });

  // PRE-5 story 3.2 (FR-38) : la pastille devient le glyphe Catégorie plein teinté de sa couleur.
  it("shows the Category's glyph tinted with its color before its name", async () => {
    renderRoute({ params: { catalogueDefinitionId: "new" } });
    await chooseCategory();
    await waitFor(() =>
      expect(StyleSheet.flatten(screen.getByTestId("activity-editor-category-glyph").props.style).tintColor).toBe("#3B82F6"),
    );
    expect(screen.getByText("Cardio")).toBeTruthy();
  });
});

/**
 * PRE-4 story 4.2 — en-tête ✕ et zone de contexte (AC1, AC4), titres des
 * quatre parcours (AC2), validation de `Terminer` (AC9), enregistrement (AC10,
 * doublé ici ; base réelle et injection d'échec dans
 * `ExerciseEditingPaths.integration.test.tsx`), états (AC11), dialogue
 * d'abandon (AC12). Rappel NFR-04 : ces tests ne valent pas recette visuelle.
 */
describe("ExerciseScreen — PRE-4 story 4.2", () => {
  const FIGMA_DIR = path.resolve(__dirname, "../../../../docs/preparation/PRE-4/figma");
  const REFERENCE_FRAMES = ["8328-35698", "8328-35740", "8328-36278", "8328-36711", "8328-36853", "8328-37022", "8328-36781"];

  const DEFINITION: ActivityDefinition = {
    id: "def-1",
    movementId: "mov-1",
    name: "Fentes",
    description: "Dos droit",
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
    sideMode: "RIGHT_LEFT",
    sideRecoverySeconds: 7,
    executionParameters: CANONICAL,
    media: [],
    createdAt: "now",
    updatedAt: "now",
  };

  /** Rend chacun des quatre parcours et renvoie le titre affiché. */
  async function renderPath(pathName: "CC" | "MC" | "CS" | "MS") {
    if (pathName === "CC") return renderRoute({ params: { catalogueDefinitionId: "new" } });
    if (pathName === "MC") {
      const view = renderRoute({
        params: { catalogueDefinitionId: "def-1" },
        service: { getActivityDefinition: jest.fn(async () => DEFINITION) },
      });
      await screen.findByDisplayValue("Fentes");
      return view;
    }
    if (pathName === "CS") return renderRoute({});
    const existing = canonicalOccurrence();
    return renderRoute({ params: { exerciseId: existing.id }, exercises: [existing] });
  }

  it("PRE4-4.2/AC1 — relevé : le séparateur d'en-tête est masqué dans les sept frames de référence et n'est pas rendu ; halo et fondu sont présents", () => {
    for (const frame of REFERENCE_FRAMES) {
      const tree = JSON.parse(gunzipSync(readFileSync(path.join(FIGMA_DIR, `${frame}.json.gz`))).toString("utf8")) as {
        nodes: { name: string; properties: { visible?: boolean } }[];
      };
      const dividers = tree.nodes.filter((node) => node.name === "Divider / Header — 1px");
      expect(dividers.length).toBeGreaterThan(0);
      expect(dividers.every((node) => node.properties.visible === false)).toBe(true);
      expect(tree.nodes.some((node) => node.name === "Halo blanc — bouton Annuler" && node.properties.visible !== false)).toBe(true);
    }
    renderScreen();
    expect(screen.queryByTestId("screen-header-separator")).toBeNull();
    expect(screen.getByTestId("exercise-context-band-halo")).toBeTruthy();
    expect(screen.getByTestId("exercise-context-band-fade")).toBeTruthy();
  });

  it("PRE4-4.2/AC2 — titre « Créer un exercice » en CC et CS, « Modifier un exercice » en MC et MS ; aucun nom de frame", async () => {
    for (const [pathName, title] of [
      ["CC", "Créer un exercice"],
      ["MC", "Modifier un exercice"],
      ["CS", "Créer un exercice"],
      ["MS", "Modifier un exercice"],
    ] as const) {
      await renderPath(pathName);
      expect(screen.getByText(title)).toBeTruthy();
      expect(screen.queryByText(/Ajouter un exercice|Création activité|Ajouter une activité/u)).toBeNull();
      screen.unmount();
    }
  });

  /**
   * Centre horizontal du halo (style rendu), padding latéral reçu par `FixedHeader` et centre du ✕
   * rendu, dans le même rendu. PRE-5 3.2, arbitrage G-1 : le retrait gauche de l'en-tête de
   * l'Éditeur (`paddingLeft`, prioritaire sur `paddingHorizontal`) place le ✕ ; le padding
   * latéral (`editorSideMargin`) ne règle plus que le bord droit.
   */
  function haloAgainstHeader() {
    const headerStyle = StyleSheet.flatten(screen.getByTestId("screen-header").props.style);
    const padding = headerStyle.paddingHorizontal as number;
    const leftInset = (headerStyle.paddingLeft ?? padding) as number;
    const halo = StyleSheet.flatten(screen.getByTestId("exercise-context-band-halo").props.style);
    const circle = StyleSheet.flatten(screen.getByTestId("screen-header-back").props.style).width as number;
    return { padding, leftInset, haloCenter: (halo.left as number) + (halo.width as number) / 2, closeCenter: leftInset + circle / 2 };
  }

  it("PRE4-4.2/AC4 — ✕ circulaire en haut à gauche dans les quatre parcours (prop locale de FixedHeader), annoncé « Retour » ; halo centré sur le ✕ ; les autres écrans gardent le chevron ; ✕ centré à 36 du bord (PRE-5 3.2, arbitrage G-1)", async () => {
    for (const pathName of ["CC", "MC", "CS", "MS"] as const) {
      await renderPath(pathName);
      expect(within(screen.getByTestId("screen-header")).UNSAFE_getByType(KodjoIcon).props.name).toBe("control-close");
      // Libellé du code de départ, en attente d'arbitrage (Q48).
      expect(screen.getByTestId("screen-header-back").props.accessibilityLabel).toBe("Retour");
      const { haloCenter, closeCenter } = haloAgainstHeader();
      expect(haloCenter).toBeCloseTo(closeCenter, 5);
      expect(closeCenter).toBe(EDITOR_HEADER.backCenterX);
      screen.unmount();
    }
  });

  it("PRE4-4.2/AC4 — ✕ : cible 48, cercle 38, icône 24 ; halo Ø 59,28 ; aucun liseré ; dégradé #EAEAFF sur 20 %", () => {
    renderScreen();
    const header = screen.getByTestId("screen-header");
    const close = within(header).getByTestId("screen-header-back");
    const circle = StyleSheet.flatten(close.props.style);
    expect(circle).toMatchObject({ width: 38, height: 38, borderRadius: 19 });
    expect(circle.width + 2 * close.props.hitSlop).toBe(48);
    const icon = within(header).UNSAFE_getByType(KodjoIcon);
    expect(icon.props.name).toBe("control-close");
    // PRE-5 3.2, compléments G-1 : trait du ✕ de l'instance Figma (`#14141A`).
    expect(icon.props.tintColor).toBe("#14141A");
    expect(StyleSheet.flatten(within(header).getByTestId("screen-header-back-icon").props.style)).toMatchObject({ width: 24, height: 24 });
    // Le ✕ est le premier élément de l'en-tête (en haut à gauche), avant le titre.
    const headerChildren = (header.props.children as unknown[]).flat().filter(Boolean) as { props: { testID?: string } }[];
    expect(headerChildren[0]!.props.testID).toBe("screen-header-back");
    // PRE-8, recette A/B (A01) : marge standard 16 (24 au-delà de 390 auparavant).
    expect(StyleSheet.flatten(header.props.style).paddingHorizontal).toBe(16);
    // PRE-5 3.2, arbitrage G-1 : cible 48 à 12 du bord (cercle 38 à 17), titre à 4 après la cible.
    expect(StyleSheet.flatten(header.props.style)).toMatchObject({ paddingLeft: 17, gap: 9 });
    expect(12 + (48 - 38) / 2).toBe(17);
    expect(17 + 38 + 9).toBe(12 + 48 + 4);
    // Cercle #FCFCFE, liseré blanc 1, ombre #1A1A26 8 % (0, 2) rayon 10.
    expect(circle).toMatchObject({
      backgroundColor: "#FCFCFE",
      borderWidth: 1,
      borderColor: "#FFFFFF",
      shadowColor: "#1A1A26",
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 10,
    });
    // Titre Inter Medium 17 #3A3A3F, toujours en-tête.
    const title = within(header).getByText("Créer un exercice");
    expect(title.props.accessibilityRole).toBe("header");
    expect(StyleSheet.flatten(title.props.style)).toMatchObject({
      fontFamily: "Inter_500Medium",
      fontWeight: "500",
      fontSize: 17,
      color: "#3A3A3F",
    });
    expect(screen.queryByTestId("screen-header-separator")).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId("exercise-context-band-halo").props.style)).toMatchObject({ width: 59.28, height: 59.28 });
    expect(StyleSheet.flatten(screen.getByTestId("exercise-context-band-fade").props.style)).toMatchObject({ height: "20%", bottom: 0 });
    expect(StyleSheet.flatten(screen.getByTestId("exercise-context-band").props.style).backgroundColor).toBe("#EAEAFF");
    expect(StyleSheet.flatten(screen.getByTestId("exercise-name-input").props.style).borderWidth).toBeUndefined();
    screen.unmount();

    // `FixedHeader` est partagé : sans la prop locale, le chevron Retour et la marge 24 sont inchangés ;
    // PRE-5 3.2, arbitrage G-1 : sans les surcharges de l'Éditeur, ni retrait, ni cercle, ni titre ne changent.
    render(
      <TestSafeAreaProvider>
        <FixedHeader title="Composition" onBack={jest.fn()} backAccessibilityLabel="Retour" />
      </TestSafeAreaProvider>,
    );
    expect(screen.UNSAFE_getByType(KodjoIcon).props.name).toBe("control-back");
    expect(screen.UNSAFE_getByType(KodjoIcon).props.tintColor).toBeUndefined();
    const defaultHeader = StyleSheet.flatten(screen.getByTestId("screen-header").props.style);
    // PRE-8, recette A/B (A01) : marge standard `layout.screenGutter` (16).
    expect(defaultHeader.paddingHorizontal).toBe(16);
    expect(defaultHeader.paddingLeft).toBeUndefined();
    expect(defaultHeader.gap).toBe(12);
    const defaultCircle = StyleSheet.flatten(screen.getByTestId("screen-header-back").props.style);
    expect(defaultCircle.backgroundColor).toBe("#E5F0FF");
    expect(defaultCircle.borderWidth).toBeUndefined();
    expect(defaultCircle.shadowOpacity).toBeUndefined();
    // Recette PRE-8 A/B du 27/10 (r9-a02) : tous les titres d’écran en Inter Medium 17.
    expect(StyleSheet.flatten(screen.getByText("Composition").props.style)).toMatchObject({
      fontFamily: "Inter_500Medium",
      fontSize: 17,
      color: "#141414",
    });
  });

  it("PRE4-4.2/AC4 AC5 — CC, MC, CS, MS à 360, 390 et 440 : l'en-tête reçoit `editorSideMargin(width)` (16 sous 390, sinon 24), comme le bandeau ; centre du halo = centre du ✕ rendu, à 36 du bord (PRE-5 3.2, arbitrage G-1)", async () => {
    const window = Dimensions.get("window");
    const screenSize = Dimensions.get("screen");
    try {
      for (const width of [360, 390, 440]) {
        act(() => {
          Dimensions.set({ window: { ...window, width }, screen: { ...screenSize, width } });
        });
        for (const pathName of ["CC", "MC", "CS", "MS"] as const) {
          await renderPath(pathName);
          const { padding, leftInset, haloCenter, closeCenter } = haloAgainstHeader();
          expect(padding).toBe(editorSideMargin(width));
          // PRE-8, recette A/B (A01) : 16 à toutes les largeurs.
          expect(padding).toBe(16);
          expect(StyleSheet.flatten(screen.getByTestId("exercise-context-band").props.style).paddingHorizontal).toBe(padding);
          // PRE-5 3.2, arbitrage G-1 : ✕ à 17 (cible à 12) et halo centré à 36, quelle que soit la largeur.
          expect(leftInset).toBe(EDITOR_HEADER.paddingLeft);
          expect(closeCenter).toBe(36);
          expect(haloCenter).toBeCloseTo(closeCenter, 5);
          screen.unmount();
        }
      }
    } finally {
      act(() => {
        Dimensions.set({ window, screen: screenSize });
      });
    }
  });

  it("PRE4-4.2/AC5 — MC, erreur de chargement : le corps d'erreur suit la marge de l'Éditeur (16 à 360, 24 à 390)", async () => {
    const window = Dimensions.get("window");
    const screenSize = Dimensions.get("screen");
    try {
      for (const width of [360, 390]) {
        act(() => {
          Dimensions.set({ window: { ...window, width }, screen: { ...screenSize, width } });
        });
        renderRoute({ params: { catalogueDefinitionId: "def-x" }, service: { getActivityDefinition: jest.fn(async () => null) } });
        const body = await screen.findByTestId("activity-editor-load-error");
        expect(StyleSheet.flatten(body.props.style).paddingHorizontal).toBe(editorSideMargin(width));
        expect(StyleSheet.flatten(screen.getByTestId("screen-header").props.style).paddingHorizontal).toBe(editorSideMargin(width));
        screen.unmount();
      }
    } finally {
      act(() => {
        Dimensions.set({ window, screen: screenSize });
      });
    }
  });

  it("PRE4-4.2/AC9 — Terminer inactif, y compris pour l'accessibilité, tant que manque : nom de 1 à 80, une Catégorie, une Zone (nouvel Exercice), des Paramètres exécutables ; héritage toléré en modification", async () => {
    // Bornes du nom (règle du domaine, saisie bornée par `maxLength`).
    const valid = { name: "Squat", instructionSteps: [], executionParameters: CANONICAL, bodyZoneIds: ["cuisses"], media: [] };
    const options = { requireReferences: true, hasCategory: true };
    expect(isActivityEditorFormValid({ ...valid, name: "a".repeat(80) }, options)).toBe(true);
    expect(isActivityEditorFormValid({ ...valid, name: "a".repeat(81) }, options)).toBe(false);
    expect(isActivityEditorFormValid({ ...valid, name: "" }, options)).toBe(false);
    expect(isActivityEditorFormValid({ ...valid, name: "   " }, options)).toBe(false);
    expect(isActivityEditorFormValid(valid, { ...options, hasCategory: false })).toBe(false);
    expect(isActivityEditorFormValid({ ...valid, bodyZoneIds: [] }, options)).toBe(false);

    renderRoute({ params: { catalogueDefinitionId: "new" } });
    const finish = () => screen.getByTestId("activity-editor-finish-action");
    const expectDisabled = (disabled: boolean) => {
      expect(finish().props.accessibilityState).toMatchObject({ disabled });
    };
    expectDisabled(true);
    // Saisie bornée à 80 caractères par le champ lui-même.
    expect(screen.getByTestId("exercise-name-input").props.maxLength).toBe(80);
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Squat");
    expectDisabled(true);
    await chooseCategory();
    expectDisabled(true);
    await chooseZone();
    // Sans Mode validé par la Feuille : toujours inactif.
    expectDisabled(true);
    setDurationParameters();
    expectDisabled(false);
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "");
    expectDisabled(true);
    // Un nom fait d'espaces seulement n'est pas un nom (normalisé vide).
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "   ");
    expectDisabled(true);
    screen.unmount();

    // Modification : valeur historique non modifiée tolérée (H25) ; Cible absente : inactif.
    const historic = canonicalOccurrence({
      executionParameters: durationParameters(5999, 3, 15, { cadenceBeepIntervalSeconds: 11, countdownSeconds: 3, endSeconds: 2 }),
    });
    renderRoute({ params: { exerciseId: historic.id }, exercises: [historic] });
    expect(screen.getByTestId("exercise-finish-action").props.accessibilityState).toMatchObject({ disabled: false });
    screen.unmount();
    const unset = canonicalOccurrence({
      executionParameters: { ...durationParameters(60, 2, 15), series: { kind: "UNIFORM", count: 2, target: { kind: "UNSET" }, pauseSeconds: 15, loadKg: 0, workPhases: [] } },
    });
    renderRoute({ params: { exerciseId: unset.id }, exercises: [unset] });
    expect(screen.getByTestId("exercise-finish-action").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("PRE4-4.2/AC10 — appuis répétés : une seule opération ; échec : message du code de départ, Brouillon conservé, réessai possible", async () => {
    let fail = true;
    const createActivityDefinition = jest.fn<ActivityDefinitionService["createActivityDefinition"]>(async () => {
      if (fail) throw new Error("Injected failure");
      return { ok: true, value: {} as ActivityDefinition };
    });
    renderRoute({ params: { catalogueDefinitionId: "new" }, service: { createActivityDefinition } });
    await fillNewExercise();
    fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "Dos droit.");
    await act(async () => {
      for (let tap = 0; tap < 3; tap += 1) fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    expect(createActivityDefinition).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("activity-editor-save-error").props.children).toBe("L’exercice n’a pas pu être enregistré. Réessayez.");
    expect(screen.getByDisplayValue("Squat")).toBeTruthy();
    expect(screen.getByDisplayValue("Dos droit.")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
    fail = false;
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    expect(createActivityDefinition).toHaveBeenCalledTimes(2);
    expect(createActivityDefinition.mock.calls[1]![0]).toMatchObject({ name: "Squat", description: "Dos droit.", bodyZoneIds: ["cuisses"] });
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  });

  it("PRE4-4.2/AC11 — états de l'écran : modification d'un Exercice existant ; abandon confirmé et annulé ; erreur d'enregistrement", async () => {
    // Modification d'un Exercice existant (MS) : titre, valeurs relues, Phrase affichée.
    const existing = canonicalOccurrence({ instruction: "Genou au-dessus de la cheville." });
    renderRoute({ params: { exerciseId: existing.id }, exercises: [existing] });
    expect(screen.getByText("Modifier un exercice")).toBeTruthy();
    expect(screen.getByDisplayValue("Fentes")).toBeTruthy();
    expect(screen.getByDisplayValue("Genou au-dessus de la cheville.")).toBeTruthy();
    expect(screen.getByTestId("exercise-parameters-phrase")).toBeTruthy();
    screen.unmount();

    // Abandon annulé puis confirmé : le dialogue délègue à la garde.
    const cancelExit = jest.fn();
    const confirmExit = jest.fn();
    mockExitGuard.mockReturnValue({ isPendingExit: true, cancelExit, confirmExit });
    renderScreen();
    fireEvent.press(screen.getByText("Annuler"));
    expect(cancelExit).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByText("Confirmer"));
    expect(confirmExit).toHaveBeenCalledTimes(1);
    screen.unmount();
    mockExitGuard.mockReturnValue(defaultExitGuardResult());

    // Erreur d'enregistrement (MC) : message annoncé, Éditeur conservé.
    const updateActivityDefinition = jest.fn<ActivityDefinitionService["updateActivityDefinition"]>(async () => {
      throw new Error("Injected failure");
    });
    renderRoute({
      params: { catalogueDefinitionId: "def-1" },
      service: { getActivityDefinition: jest.fn(async () => DEFINITION), updateActivityDefinition },
    });
    await screen.findByDisplayValue("Fentes");
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    const error = screen.getByTestId("activity-editor-save-error");
    expect(error.props.children).toBe("L’exercice n’a pas pu être enregistré. Réessayez.");
    expect(error.props.accessibilityLiveRegion).toBe("polite");
    expect(screen.getByDisplayValue("Fentes")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("PRE4-4.2/AC12 — sans modification, sortie immédiate ; avec modification, dialogue : textes de création en CC et CS, de modification en MC et MS ; Annuler neutre, Confirmer destructif", async () => {
    for (const [pathName, title, message] of [
      ["CC", "Abandonner la création ?", "Les informations saisies seront perdues et l’exercice ne sera pas créé."],
      ["CS", "Abandonner la création ?", "Les informations saisies seront perdues et l’exercice ne sera pas créé."],
      ["MC", "Abandonner les modifications ?", "Les modifications apportées à cet exercice seront perdues."],
      ["MS", "Abandonner les modifications ?", "Les modifications apportées à cet exercice seront perdues."],
    ] as const) {
      mockExitGuard.mockReset();
      mockExitGuard.mockReturnValue(defaultExitGuardResult());
      await renderPath(pathName);
      // Intact : la garde ne bloque pas (sortie immédiate, sans dialogue).
      expect(lastGuardBlock()).toBe(false);
      fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Modifié");
      expect(lastGuardBlock()).toBe(true);
      screen.unmount();

      // PRE-5 story 3.1 (AC4) : une modification de la seule Description (étapes comparées par
      // leurs encodages, hors de l'occurrence en Séance) arme aussi la garde.
      mockExitGuard.mockReset();
      mockExitGuard.mockReturnValue(defaultExitGuardResult());
      await renderPath(pathName);
      expect(lastGuardBlock()).toBe(false);
      fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "Description modifiée");
      expect(lastGuardBlock()).toBe(true);
      screen.unmount();

      mockExitGuard.mockReturnValue({ isPendingExit: true, cancelExit: jest.fn(), confirmExit: jest.fn() });
      await renderPath(pathName);
      expect(screen.getByText(title)).toBeTruthy();
      expect(screen.getByText(message)).toBeTruthy();
      // Deux actions sur une ligne : Annuler neutre, puis Confirmer destructif (rouge).
      const row = screen.getByTestId("exercise-exit-confirm-actions");
      expect(StyleSheet.flatten(row.props.style).flexDirection).toBe("row");
      const cancel = within(row).getByLabelText("Annuler");
      const confirm = within(row).getByLabelText("Confirmer");
      expect(StyleSheet.flatten(cancel.props.style).backgroundColor).toBe("#F5F7FA");
      expect(StyleSheet.flatten(confirm.props.style).backgroundColor).toBe("#D92D20");
      expect(screen.queryByText(/l'activité ne sera pas créé/u)).toBeNull();
      screen.unmount();
    }
  });

  it("PRE4-4.2/AC12 — Séance : le texte du dialogue suit l'intention de la route ; un `exerciseId` absent du Brouillon reste une modification (jamais « ne sera pas créé »)", () => {
    mockExitGuard.mockReturnValue({ isPendingExit: true, cancelExit: jest.fn(), confirmExit: jest.fn() });
    // MS sur un identifiant introuvable dans le Brouillon.
    renderRoute({ params: { exerciseId: "occ-introuvable" }, exercises: [canonicalOccurrence()] });
    expect(screen.getByText("Abandonner les modifications ?")).toBeTruthy();
    expect(screen.queryByText("Abandonner la création ?")).toBeNull();
    screen.unmount();
    // CS : aucun `exerciseId`.
    renderRoute({ exercises: [canonicalOccurrence()] });
    expect(screen.getByText("Abandonner la création ?")).toBeTruthy();
    expect(screen.queryByText("Abandonner les modifications ?")).toBeNull();
  });
});

/**
 * PRE-4 story 4.3 — accès Catégorie de l'adaptateur (AC2 : icône pleine pendant
 * l'ouverture de la feuille, montée par l'adaptateur) et conservation du
 * Brouillon à l'ouverture et à la fermeture de la feuille de Catégorie (AC3),
 * dans les deux adaptateurs. Rappel NFR-04 : pas de recette visuelle ici.
 */
describe("ExerciseScreen — PRE-4 story 4.3", () => {
  /** Source de l’image rendue (la vue native d’`expo-image` la reçoit en tableau). */
  const iconSource = (testID: string): unknown => {
    const source = screen.getByTestId(testID).props.source as unknown;
    return Array.isArray(source) ? source[0] : source;
  };
  const PLEIN_CATEGORIE = require("../../../../assets/icons/icon-categorie-plein.svg") as unknown;
  const PLEIN_HOMME = require("../../../../assets/icons/body-zone-homme-plein.svg") as unknown;

  it("PRE4-4.3/AC2 — CC : icône Catégorie pleine au repos, feuille ouverte et après ✕ (PRE-5 3.2, arbitrage G-5), « développé » seulement pendant l'ouverture ; après ✓, le glyphe teinté + nom remplace l'icône (PRE-5 3.2)", async () => {
    renderRoute({ params: { catalogueDefinitionId: "new" } });
    const button = () => screen.getByTestId("activity-editor-category-button");
    expect(await screen.findByTestId("activity-editor-category-icon")).toBeTruthy();
    expect(iconSource("activity-editor-category-icon")).toEqual(PLEIN_CATEGORIE);
    fireEvent.press(button());
    expect(await screen.findByTestId("category-picker-sheet")).toBeTruthy();
    expect(iconSource("activity-editor-category-icon")).toEqual(PLEIN_CATEGORIE);
    expect(screen.queryByTestId("activity-editor-category-icon-filled")).toBeNull();
    expect(button().props.accessibilityState).toEqual({ expanded: true });
    fireEvent.press(screen.getByTestId("category-picker-close"));
    expect(screen.queryByTestId("category-picker-sheet")).toBeNull();
    expect(iconSource("activity-editor-category-icon")).toEqual(PLEIN_CATEGORIE);
    expect(screen.queryByTestId("activity-editor-category-icon-filled")).toBeNull();
    expect(button().props.accessibilityState).toEqual({ expanded: false });
    await chooseCategory();
    expect(screen.queryByTestId("activity-editor-category-icon-filled")).toBeNull();
    expect(screen.getByTestId("activity-editor-category-glyph")).toBeTruthy();
  });

  it("PRE4-4.3/AC2 — MS : même icône pleine au repos, feuille ouverte et après ✕ (PRE-5 3.2, arbitrage G-5) ; après ✓, ni icône d'ouverture ni état « développé » (adaptateur Séance)", async () => {
    renderRoute({ params: { exerciseId: "occ-1" }, exercises: [canonicalOccurrence({ categoryId: null })] });
    expect(await screen.findByTestId("activity-editor-category-icon")).toBeTruthy();
    expect(iconSource("activity-editor-category-icon")).toEqual(PLEIN_CATEGORIE);
    fireEvent.press(screen.getByTestId("activity-editor-category-button"));
    expect(await screen.findByTestId("category-picker-sheet")).toBeTruthy();
    expect(iconSource("activity-editor-category-icon")).toEqual(PLEIN_CATEGORIE);
    expect(screen.queryByTestId("activity-editor-category-icon-filled")).toBeNull();
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityState).toEqual({ expanded: true });
    fireEvent.press(screen.getByTestId("category-picker-close"));
    expect(iconSource("activity-editor-category-icon")).toEqual(PLEIN_CATEGORIE);
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityState).toEqual({ expanded: false });
    // Chemin ✓ : la feuille fermée, l'accès n'est plus « développé » ni plein ; la
    // Catégorie choisie s'affiche en glyphe teinté + nom (PRE-5 3.2 ; ni contour ni plein d'ouverture).
    await chooseCategory();
    expect(screen.queryByTestId("activity-editor-category-icon-filled")).toBeNull();
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityState).toEqual({ expanded: false });
    expect(screen.getByTestId("activity-editor-category-glyph")).toBeTruthy();
  });

  it("PRE4-4.3/AC2 — CS : accès Zones plein au repos comme pendant l'ouverture (PRE-5 3.2, arbitrage G-5), « développé » pendant l'ouverture seulement, après ✕ puis après ✓", async () => {
    renderRoute({});
    expect(await screen.findByTestId("exercise-body-zones-icon")).toBeTruthy();
    expect(iconSource("exercise-body-zones-icon")).toEqual(PLEIN_HOMME);
    const zonesButton = () => screen.getByTestId("exercise-body-zones-open");
    for (const close of ["body-zone-picker-close", "body-zone-picker-confirm"]) {
      fireEvent.press(zonesButton());
      fireEvent.press(await screen.findByTestId("body-zone-selector-tag-cuisses"));
      expect(iconSource("exercise-body-zones-icon")).toEqual(PLEIN_HOMME);
      expect(screen.queryByTestId("exercise-body-zones-icon-filled")).toBeNull();
      expect(zonesButton().props.accessibilityState).toEqual({ expanded: true });
      await act(async () => {
        fireEvent.press(screen.getByTestId(close));
      });
      expect(iconSource("exercise-body-zones-icon")).toEqual(PLEIN_HOMME);
      expect(screen.queryByTestId("exercise-body-zones-icon-filled")).toBeNull();
      expect(zonesButton().props.accessibilityState).toEqual({ expanded: false });
    }
    expect(screen.getByTestId("exercise-body-zones-label").props.children).toBe("Cuisses");
  });

  it("PRE4-4.6/AC9 — CC et MS, par l'adaptateur réel : après ✕ puis après ✓ de la feuille de Catégorie, le focus revient à l'accès Catégorie à la FIN de la fermeture (`onDismiss` du `Modal`, iOS), jamais pendant le fondu", async () => {
    const reduceMotion = jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
    const focusTargets = () =>
      focus.mock.calls.filter(([, type]) => type === "focus").map(([node]) => (node as unknown as { props: { testID: string } }).props.testID);
    // Seule feuille de l'écran à attendre `onDismiss` : celle de la Catégorie (aucune autre ouverte).
    const categoryModal = () => screen.UNSAFE_queryAllByType(Modal).filter((modal) => modal.props.onDismiss !== undefined);
    try {
      for (const route of [
        { params: { catalogueDefinitionId: "new" } },
        { params: { exerciseId: "occ-1" }, exercises: [canonicalOccurrence({ categoryId: null })] },
      ] as Parameters<typeof renderRoute>[0][]) {
        renderRoute(route);
        await screen.findByTestId("activity-editor-category-icon");
        for (const close of ["category-picker-close", "category-picker-confirm"]) {
          fireEvent.press(screen.getByTestId("activity-editor-category-button"));
          fireEvent.press(await screen.findByTestId("category-picker-tag-cardio"));
          expect(categoryModal()).toHaveLength(1);
          expect(categoryModal()[0]!.props.visible).toBe(true);
          focus.mockClear();
          await act(async () => {
            fireEvent.press(screen.getByTestId(close));
          });
          await waitFor(() => expect(screen.queryByTestId("category-picker-sheet")).toBeNull());
          // Fondu en cours : feuille invisible mais montée, aucun focus envoyé.
          expect(categoryModal()).toHaveLength(1);
          expect(categoryModal()[0]!.props.visible).toBe(false);
          expect(focusTargets()).toEqual([]);
          await act(async () => {
            (categoryModal()[0]!.props.onDismiss as () => void)();
          });
          expect(focusTargets()).toEqual(["activity-editor-category-button"]);
          expect(categoryModal()).toHaveLength(0);
        }
        screen.unmount();
      }
    } finally {
      focus.mockRestore();
      reduceMotion.mockRestore();
    }
  });

  it("PRE4-4.3/AC3 — MS : ouvrir puis fermer la feuille de Catégorie (✕, puis ✓) conserve nom, description, Zones, Médias et Paramètres variables ; rien n'est écrit avant Terminer", async () => {
    const { updateDraft } = renderRoute({
      params: { exerciseId: "occ-1" },
      exercises: [canonicalOccurrence({ instruction: "Dos droit" })],
    });
    await screen.findByText("Cardio");
    // La Carte est un seul élément VoiceOver : son libellé porte la Phrase entière (4.2 AC6).
    const phraseBefore = screen.getByTestId("exercise-parameters-card").props.accessibilityLabel as string;
    expect(phraseBefore).toContain("séries de durée variable (30 s puis 45 s)");
    const snapshot = () => ({
      name: screen.getByTestId("exercise-name-input").props.value as string,
      instruction: screen.getByTestId("exercise-instruction-input").props.value as string,
      zones: screen.getByTestId("exercise-body-zones-label").props.children as string,
      phrase: screen.getByTestId("exercise-parameters-card").props.accessibilityLabel as string,
    });
    const before = snapshot();
    expect(before).toEqual({
      name: "Fentes",
      instruction: "Dos droit",
      zones: "Cuisses",
      phrase: phraseBefore,
    });
    fireEvent.press(screen.getByTestId("activity-editor-category-button"));
    fireEvent.press(await screen.findByTestId("category-picker-tag-cardio"));
    fireEvent.press(screen.getByTestId("category-picker-close"));
    expect(snapshot()).toEqual(before);
    expect(screen.getByText("Cardio")).toBeTruthy();
    await chooseCategory();
    expect(snapshot()).toEqual(before);
    expect(screen.getByTestId("media-item-1")).toBeTruthy();
    expect(screen.queryByTestId("media-item-2")).toBeNull();
    expect(updateDraft).not.toHaveBeenCalled();
  });
});

describe("ExerciseScreen — PRE-4 story 4.3 (AC12)", () => {
  it("PRE4-4.3/AC12 — CC : une Catégorie créée par ↑ est enregistrée dans le référentiel seul ; l'Exercice ne l'est qu'à Terminer ; un échec de création garde le Brouillon", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const reduceMotion = jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    const createActivityDefinition = jest
      .fn<ActivityDefinitionService["createActivityDefinition"]>()
      .mockResolvedValue({ ok: true, value: {} as ActivityDefinition });
    const DANSE: Category = { ...A_CATEGORY, id: "danse", name: "Danse", canonicalKey: "danse", isPredefined: false, displayOrder: null };
    const referential: Category[] = [A_CATEGORY];
    const createCategory = jest
      .fn<ReferentialService["createCategory"]>()
      .mockImplementationOnce(async () => {
        referential.push(DANSE);
        return { status: "OK", value: DANSE };
      })
      .mockRejectedValueOnce(new Error("disque plein"));
    renderRoute({
      params: { catalogueDefinitionId: "new" },
      service: { createActivityDefinition },
      referential: {
        listCategories: jest.fn(async () => [...referential]),
        createCategory,
        recolorCategory: jest.fn(),
        renameCategory: jest.fn(),
        retireCategory: jest.fn(),
        isCategoryUsed: jest.fn(async () => false),
      } as Partial<ReferentialService>,
    });
    fireEvent.changeText(await screen.findByTestId("exercise-name-input"), "Squat");
    fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "Dos droit");
    await chooseZone();
    setDurationParameters();
    const draft = () => ({
      name: screen.getByTestId("exercise-name-input").props.value as string,
      instruction: screen.getByTestId("exercise-instruction-input").props.value as string,
      zones: screen.getByTestId("exercise-body-zones-label").props.children as string,
      parameters: screen.getByTestId("exercise-parameters-card").props.accessibilityLabel as string,
    });
    const before = draft();
    expect(before).toMatchObject({ name: "Squat", instruction: "Dos droit", zones: "Cuisses" });
    fireEvent.press(screen.getByTestId("activity-editor-category-button"));
    fireEvent.press(await screen.findByTestId("category-picker-create-action"));
    fireEvent.changeText(screen.getByTestId("category-picker-new-name-input"), "Danse");
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-new-add"));
    });
    // Référentiel écrit seul ; l'Exercice n'est pas enregistré.
    expect(createCategory).toHaveBeenCalledTimes(1);
    expect(createActivityDefinition).not.toHaveBeenCalled();
    expect((await screen.findByTestId("category-picker-tag-danse")).props.accessibilityState).toEqual({ selected: true });
    // Échec injecté à la création suivante : message du code de départ, feuille ouverte,
    // « Danse » toujours marquée, Brouillon de l'Éditeur intact, aucun Exercice enregistré.
    fireEvent.changeText(screen.getByTestId("category-picker-new-name-input"), "Boxe");
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-new-add"));
    });
    expect(screen.getByTestId("category-picker-write-error").props.children).toBe(strings.referenceData.writeError);
    expect(screen.getByTestId("category-picker-tag-danse").props.accessibilityState).toEqual({ selected: true });
    expect(draft()).toEqual(before);
    expect(createActivityDefinition).not.toHaveBeenCalled();
    // ✓ affecte « Danse » ; `Terminer` enregistre l'Exercice avec la Catégorie créée.
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-confirm"));
    });
    await waitFor(() => expect(screen.queryByTestId("category-picker-sheet")).toBeNull());
    expect(draft()).toEqual(before);
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    expect(createActivityDefinition).toHaveBeenCalledTimes(1);
    expect(createActivityDefinition.mock.calls[0]![0]).toMatchObject({
      name: "Squat",
      description: "Dos droit",
      category: { kind: "EXISTING", categoryId: "danse" },
      bodyZoneIds: ["cuisses"],
    });
    reduceMotion.mockRestore();
    consoleError.mockRestore();
  });
});

/**
 * PRE-6 (story 2.3, AD-39) : une nouvelle occurrence qui arrive dans un Circuit de Séries est
 * adaptée à N ; perte de séries → confirmation avant toute mutation.
 */
describe("ExerciseScreen — création dans un Circuit de Séries (PRE-6, story 2.3)", () => {
  const modal = strings.screens.composition.circuitEntryConfirmModal;
  /** Dernière carte affichée dans le Circuit : la nouvelle occurrence y arrive. */
  const inCircuit = (count: number) =>
    canonicalOccurrence({ id: "in-1", structuralPosition: "IN_TOUR", executionParameters: durationParameters(30, count) });

  function seriesCountOf(exercise: SessionDraftExercise): number {
    const series = exercise.executionParameters.series;
    return series.kind === "UNIFORM" ? series.count : series.rows.length;
  }

  it("avec perte : dialogue ; Annuler reste sur l'écran sans ajout ; Confirmer ajoute l'occurrence adaptée", async () => {
    const { updateDraft, service } = renderRoute({
      exercises: [inCircuit(1)],
      draft: { circuitNature: "SERIES", tourRepeatCount: 1 },
    });
    await fillNewExercise();
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    tapExecutionSheetStep("execution-sheet-series-increment");
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));

    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    expect(screen.getByText(modal.addTitle)).toBeTruthy();
    expect(
      screen.getByText(
        "L’exercice ajouté aura 1 série. Les séries au-delà de la 1re seront supprimées, avec les valeurs qu’elles portent.",
      ),
    ).toBeTruthy();
    expect(updateDraft).not.toHaveBeenCalled();

    fireEvent.press(within(screen.getByTestId("circuit-entry-confirm-card")).getByLabelText(modal.cancel));
    expect(screen.queryByText(modal.addTitle)).toBeNull();
    expect(updateDraft).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();

    // « Terminer » reste disponible après Annuler.
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    fireEvent.press(within(screen.getByTestId("circuit-entry-confirm-card")).getByLabelText(modal.confirm));
    expect(updateDraft).toHaveBeenCalledTimes(1);
    const added = updateDraft.mock.calls[0]![0].exercises!.find((exercise) => exercise.id !== "in-1")!;
    expect(added.structuralPosition).toBe("IN_TOUR");
    expect(seriesCountOf(added)).toBe(1);
    // Confirmer clôt l'écran comme « Terminer » : médias préparés engagés, retour à la Composition.
    expect(service.commitMediaDraft).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  });

  it("la sortie l'emporte : le dialogue de Circuit est retiré et « Terminer » reste utilisable", async () => {
    const { updateDraft } = renderRoute({
      exercises: [inCircuit(1)],
      draft: { circuitNature: "SERIES", tourRepeatCount: 1 },
    });
    await fillNewExercise();
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    tapExecutionSheetStep("execution-sheet-series-increment");
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    expect(screen.getByTestId("circuit-entry-confirm-card")).toBeTruthy();

    // La garde de sortie se déclenche (geste système) pendant le dialogue.
    const cancelExit = jest.fn();
    mockExitGuard.mockReturnValue({ isPendingExit: true, cancelExit, confirmExit: jest.fn() });
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Squat bulgare");
    expect(screen.queryByTestId("circuit-entry-confirm-card")).toBeNull();
    expect(screen.getByTestId("exercise-exit-confirm-card")).toBeTruthy();

    // Annuler la sortie : « Terminer » rouvre le dialogue (aucun verrou resté engagé).
    mockExitGuard.mockReturnValue(defaultExitGuardResult());
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Squat");
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    expect(screen.getByTestId("circuit-entry-confirm-card")).toBeTruthy();
    expect(updateDraft).not.toHaveBeenCalled();
  });

  it("sans perte : adaptée à N, sans dialogue", async () => {
    const { updateDraft } = renderRoute({
      exercises: [inCircuit(3)],
      draft: { circuitNature: "SERIES", tourRepeatCount: 3 },
    });
    await fillNewExercise();
    fireEvent.press(screen.getByTestId("exercise-finish-action"));

    expect(screen.queryByText(modal.addTitle)).toBeNull();
    const added = updateDraft.mock.calls[0]![0].exercises!.find((exercise) => exercise.id !== "in-1")!;
    expect(seriesCountOf(added)).toBe(3);
  });

  it("Circuit de Tours : création inchangée", async () => {
    const { updateDraft } = renderRoute({ exercises: [inCircuit(3)], draft: { tourRepeatCount: 3 } });
    await fillNewExercise();
    fireEvent.press(screen.getByTestId("exercise-finish-action"));

    expect(screen.queryByText(modal.addTitle)).toBeNull();
    const added = updateDraft.mock.calls[0]![0].exercises!.find((exercise) => exercise.id !== "in-1")!;
    expect(seriesCountOf(added)).toBe(1);
  });
});

/**
 * PRE-6 (story 3.3, AD-37, AD-44) : N hérité dans la Feuille des paramètres. Une occurrence
 * existante `IN_TOUR`, de type `EXERCISE`, d'un Circuit de Séries ouvre la Feuille avec le nombre
 * de séries indisponible ; Tours, hors Circuit, autre type et nouvelle occurrence : Feuille
 * inchangée. Une occurrence dont les séries diffèrent de celles de l'ouverture perd son entrée de
 * réserve de Circuit à « Terminer », dans la même mise à jour que les occurrences.
 */
describe("ExerciseScreen — N hérité dans la Feuille (PRE-6, story 3.3)", () => {
  const hint = strings.executionParameters.circuit.inheritedSeriesCount;
  type Draft = SessionDraftContextValue["draft"];
  type Updater = (current: Draft) => Partial<Draft>;
  const occurrence = (overrides: Partial<SessionDraftExercise> = {}) =>
    canonicalOccurrence({ id: "in-1", structuralPosition: "IN_TOUR", ...overrides });
  const openSheet = () => fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  const seriesToggle = () => screen.getByTestId("execution-sheet-series-toggle");
  const isLocked = () => seriesToggle().props.accessibilityState?.disabled === true;
  const reserve = { "in-1": [{ target: { kind: "NUMBER" as const, value: 60 }, pauseSeconds: 10, loadKg: 0 }] };
  const other = { "in-2": reserve["in-1"] };
  const seriesDraft = { circuitNature: "SERIES" as const, tourRepeatCount: 2, circuitSeriesReserve: { ...reserve, ...other } };

  it("Séries, occurrence du Circuit : nombre affiché, indisponible et expliqué ; croix indisponibles ; régime modifiable, N conservé", () => {
    const { updateDraft } = renderRoute({
      params: { exerciseId: "in-1" },
      exercises: [occurrence()],
      draft: { circuitNature: "SERIES", tourRepeatCount: 2 },
    });
    openSheet();
    expect(isLocked()).toBe(true);
    expect(seriesToggle().props.accessibilityHint).toBe(hint);
    expect(String(screen.getByTestId("execution-sheet-series-value").props.children)).toBe("2 séries variables");
    expect(screen.getByTestId("execution-sheet-table-row-1-remove").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("execution-sheet-series-type-control-UNIFORM"));
    expect(String(screen.getByTestId("execution-sheet-series-value").props.children)).toBe("2 séries identiques");
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    const finished = (updateDraft.mock.calls[0]![0] as Partial<Draft>).exercises![0]!;
    expect(finished.executionParameters.series).toMatchObject({ kind: "UNIFORM", count: 2 });
  });

  it("Tours (explicite ou par défaut), hors Circuit (avant, après), occurrence non `EXERCISE` ou nouvelle occurrence : nombre modifiable, sans indice", () => {
    const cases: { readonly exercise: SessionDraftExercise; readonly draft: Partial<Draft>; readonly id?: string }[] = [
      { exercise: occurrence(), draft: { circuitNature: "TOURS", tourRepeatCount: 2 }, id: "in-1" },
      { exercise: occurrence(), draft: { tourRepeatCount: 2 }, id: "in-1" },
      { exercise: occurrence({ structuralPosition: "BEFORE_TOUR" }), draft: { circuitNature: "SERIES", tourRepeatCount: 2 }, id: "in-1" },
      { exercise: occurrence({ structuralPosition: "AFTER_TOUR" }), draft: { circuitNature: "SERIES", tourRepeatCount: 2 }, id: "in-1" },
      { exercise: occurrence({ type: "RECOVERY" }), draft: { circuitNature: "SERIES", tourRepeatCount: 2 }, id: "in-1" },
      { exercise: occurrence(), draft: { circuitNature: "SERIES", tourRepeatCount: 2 } },
    ];
    for (const { exercise, draft, id } of cases) {
      renderRoute({ params: id === undefined ? {} : { exerciseId: id }, exercises: [exercise], draft });
      openSheet();
      expect(isLocked()).toBe(false);
      expect(seriesToggle().props.accessibilityHint).toBeUndefined();
      screen.unmount();
    }
  });

  it("sortie du Circuit : la prochaine ouverture (occurrence désormais hors Circuit) rend le nombre modifiable, sans message", () => {
    renderRoute({
      params: { exerciseId: "in-1" },
      exercises: [occurrence()],
      draft: { circuitNature: "SERIES", tourRepeatCount: 2 },
    });
    openSheet();
    expect(isLocked()).toBe(true);
    screen.unmount();
    renderRoute({
      params: { exerciseId: "in-1" },
      exercises: [occurrence({ structuralPosition: "AFTER_TOUR" })],
      draft: { circuitNature: "SERIES", tourRepeatCount: 2 },
    });
    openSheet();
    expect(isLocked()).toBe(false);
    expect(screen.queryByText(hint)).toBeNull();
  });

  it("hydratation tardive : l'occurrence absente au montage est lue dès qu'elle paraît ; le contexte reste ensuite figé", () => {
    const { rerenderExercises } = renderRoute({
      params: { exerciseId: "in-1" },
      exercises: [],
      draft: { circuitNature: "SERIES", tourRepeatCount: 2 },
    });
    rerenderExercises([occurrence()]);
    openSheet();
    expect(isLocked()).toBe(true);
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    // Figé : l'occurrence sortie du Circuit pendant l'édition garde le contexte de l'ouverture.
    rerenderExercises([occurrence({ structuralPosition: "AFTER_TOUR" })]);
    openSheet();
    expect(isLocked()).toBe(true);
  });

  it("réserve : séries modifiées → UNE mise à jour fonctionnelle (occurrences et réserve sans l'entrée de l'occurrence)", () => {
    const { updateDraft } = renderRoute({ params: { exerciseId: "in-1" }, exercises: [occurrence()], draft: seriesDraft });
    openSheet();
    fireEvent.press(screen.getByTestId("execution-sheet-series-type-control-UNIFORM"));
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    expect(updateDraft).toHaveBeenCalledTimes(1);
    const updater = updateDraft.mock.calls[0]![0] as unknown as Updater;
    expect(typeof updater).toBe("function");
    const current = { exercises: [occurrence()], circuitSeriesReserve: { ...reserve, ...other } } as unknown as Draft;
    const patch = updater(current);
    expect(patch.circuitSeriesReserve).toEqual(other);
    expect(patch.exercises![0]!.executionParameters.series).toMatchObject({ kind: "UNIFORM", count: 2 });
    // Calculé sur le brouillon courant : réserve devenue vide → clé présente, `undefined`.
    expect(updater({ ...current, circuitSeriesReserve: reserve })).toHaveProperty("circuitSeriesReserve", undefined);
  });

  it("réserve conservée : nom seul, ✓ de la Feuille sans modification, ou paramètre hors séries (cadence) — mise à jour simple, sans réserve", () => {
    const keepsReserve = (edit: () => void) => {
      const { updateDraft } = renderRoute({ params: { exerciseId: "in-1" }, exercises: [occurrence()], draft: seriesDraft });
      edit();
      fireEvent.press(screen.getByTestId("exercise-finish-action"));
      expect(updateDraft).toHaveBeenCalledTimes(1);
      const patch = updateDraft.mock.calls[0]![0];
      expect(typeof patch).toBe("object");
      expect(patch).not.toHaveProperty("circuitSeriesReserve");
      screen.unmount();
      return patch.exercises![0]!;
    };
    keepsReserve(() => fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Fentes sautées"));
    const unchanged = keepsReserve(() => {
      openSheet();
      fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    });
    expect(unchanged.executionParameters).toEqual(CANONICAL);
    const cadence = keepsReserve(() => {
      openSheet();
      fireEvent.press(screen.getByTestId("execution-sheet-cadence-control-NONE"));
      fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    });
    expect(cadence.executionParameters.cadenceBeepIntervalSeconds).toBe(0);
  });
});

/**
 * PRE-7 story A2.1 (D-437, D-438, MFN-02, MFN-09, MFN/AC28, AC30 ; CE-UI-10) : l'éditeur transmet à
 * la Feuille le verrou de structure d'une occurrence portant une filiation (copie, Séance
 * enregistrée, duplication), jamais pour une création locale non enregistrée ; et, au Catalogue,
 * le compteur de phase du Mouvement relu avec la définition. Frère incomplet : signalé par la
 * Carte, `Terminer` inactif.
 */
describe("ExerciseScreen — Feuille des paramètres MFN (PRE-7, story A2.1)", () => {
  const PHASED: ExecutionParameters = (() => {
    const base = durationParameters(9, 3, 15);
    return {
      ...base,
      series: {
        ...(base.series as Extract<ExecutionParameters["series"], { kind: "UNIFORM" }>),
        workPhases: [
          { id: 1, label: "Descente", durationSeconds: 6 },
          { id: 2, label: "Maintien", durationSeconds: 3 },
        ],
      },
    };
  })();
  const openSheet = () => fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  const isStructureLocked = () =>
    screen.getByTestId("execution-sheet-phase-row-1-remove").props.accessibilityState?.disabled === true &&
    screen.getByTestId("execution-sheet-phases-control-WITHOUT").props.accessibilityState?.disabled === true;

  it("occurrence copiée d'un geste (filiation persistée) : structure verrouillée, durées modifiables", () => {
    const { updateDraft } = renderRoute({
      params: { exerciseId: "occ-1" },
      exercises: [canonicalOccurrence({ executionParameters: PHASED, sideMode: "UNILATERAL", sourceMovementId: "mov-1" })],
    });
    openSheet();
    expect(isStructureLocked()).toBe(true);
    expect(screen.getByTestId("execution-sheet-phase-row-1-label").props.editable).toBe(false);
    fireEvent(screen.getByTestId("execution-sheet-phase-row-1-duration-input"), "focus");
    fireEvent.changeText(screen.getByTestId("execution-sheet-phase-row-1-duration-input"), "8");
    fireEvent(screen.getByTestId("execution-sheet-phase-row-1-duration-input"), "blur");
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    const finished = (updateDraft.mock.calls[0]![0] as Partial<SessionDraftContextValue["draft"]>).exercises![0]!;
    expect(finished.executionParameters.series).toMatchObject({
      kind: "UNIFORM",
      // PRE-7 (D-446) : la durée de série (9 s) n'est plus redérivée de la somme des phases.
      target: { kind: "NUMBER", value: 9 },
      workPhases: [
        { id: 1, label: "Descente", durationSeconds: 8 },
        { id: 2, label: "Maintien", durationSeconds: 3 },
      ],
    });
    expect(finished.sourceMovementId).toBe("mov-1");
  });

  // PRE-7 (R-3, D-445 C05, arbitrage de Hermann du 26/10/2026) : la copie d'une création locale
  // référence le même Mouvement NEW du brouillon (`pendingLocalMovement` retiré) ; contenu et
  // structure modifiables comme la source, la modification s'inscrit dans ce Mouvement partagé.
  it("recette JA (Hermann, 26/10/2026), R-3 : copie d'une occurrence locale — contenu et structure modifiables comme la source ; Mouvement NEW partagé mis à jour, original et copie relisent le nouveau nom", () => {
    const source = canonicalOccurrence({ id: "occ-0", executionParameters: PHASED, sideMode: "UNILATERAL", sourceMovementId: "occ-0" });
    const { updateDraft } = renderRoute({
      params: { exerciseId: "occ-1" },
      exercises: [source, { ...source, id: "occ-1", copyNumber: 1 }],
      draft: { movements: { "occ-0": draftMovementOf(source, "NEW") } },
    });
    expect(screen.getByTestId("exercise-name-input").props.editable).toBe(true);
    expect(screen.getByTestId("exercise-instruction-input").props.editable).not.toBe(false);
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityState?.disabled).not.toBe(true);
    expect(screen.getByTestId("exercise-body-zones-open").props.accessibilityState?.disabled).not.toBe(true);
    openSheet();
    expect(isStructureLocked()).toBe(false);
    expect(screen.getByTestId("execution-sheet-phase-row-1-label").props.editable).toBeUndefined();
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Fentes lentes");
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    const patch = updateDraft.mock.calls[0]![0] as Partial<SessionDraftContextValue["draft"]>;
    expect(patch.exercises!.map((exercise) => [exercise.id, exercise.name, exercise.sourceMovementId, exercise.copyNumber ?? null])).toEqual([
      ["occ-0", "Fentes lentes", "occ-0", null],
      ["occ-1", "Fentes lentes", "occ-0", 1],
    ]);
    expect(patch.movements?.["occ-0"]).toMatchObject({ change: "NEW", name: "Fentes lentes" });
    expect(patch.exercises![1]).not.toHaveProperty("pendingLocalMovement");
  });

  it("création locale (nouvelle occurrence, ou occurrence sans filiation non encore enregistrée) : structure modifiable (exception MFN-09)", () => {
    renderRoute({ params: { exerciseId: "occ-1" }, exercises: [canonicalOccurrence({ executionParameters: PHASED, sideMode: "UNILATERAL" })] });
    openSheet();
    expect(isStructureLocked()).toBe(false);
    expect(screen.getByTestId("execution-sheet-phase-row-1-label").props.editable).toBeUndefined();
    screen.unmount();
    renderRoute({});
    openSheet();
    chooseExecutionMode("Durée");
    expect(screen.getByTestId("execution-sheet-phases-control-WITH").props.accessibilityState?.disabled).toBe(false);
  });

  it("Catalogue : la Feuille reçoit le compteur de phase du Mouvement — une phase ajoutée reçoit l'identité du compteur (7), jamais max + 1 (MFN/AC30)", async () => {
    const definition: ActivityDefinition = {
      id: "def-1",
      movementId: "mov-1",
      movementNextPhaseId: 7,
      name: "Planche",
      description: "",
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      sideMode: "UNILATERAL",
      executionParameters: PHASED,
      media: [],
      createdAt: "now",
      updatedAt: "now",
    };
    const updateActivityDefinition = jest
      .fn<ActivityDefinitionService["updateActivityDefinition"]>()
      .mockResolvedValue({ status: "UPDATED", value: definition });
    renderRoute({
      params: { catalogueDefinitionId: "def-1" },
      service: { getActivityDefinition: jest.fn(async () => definition), updateActivityDefinition },
    });
    await screen.findByDisplayValue("Planche");
    openSheet();
    // Catalogue : structure modifiable, croix disponible dès deux phases (D-438).
    expect(isStructureLocked()).toBe(false);
    fireEvent.press(screen.getByTestId("execution-sheet-phase-count-toggle"));
    fireEvent(screen.getByTestId("execution-sheet-phase-count-increment"), "pressIn");
    fireEvent(screen.getByTestId("execution-sheet-phase-count-increment"), "pressOut");
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    const input = updateActivityDefinition.mock.calls[0]![1];
    const series = input.executionParameters.series;
    expect(series.kind === "UNIFORM" ? series.workPhases.map((phase) => phase.id) : []).toEqual([1, 2, 7]);
  });

  it("frère incomplet ouvert au Catalogue : Carte « Paramètres à compléter. », Terminer inactif ; Feuille : durée « — », D « — », ✓ indisponible", async () => {
    const incomplete: ExecutionParameters = {
      ...PHASED,
      series: {
        ...(PHASED.series as Extract<ExecutionParameters["series"], { kind: "UNIFORM" }>),
        target: { kind: "UNSET" },
        workPhases: [
          { id: 1, label: "Descente", durationSeconds: 6 },
          { id: 2, label: "Maintien", durationSeconds: 0 },
        ],
      },
    };
    const definition: ActivityDefinition = {
      id: "def-2",
      movementId: "mov-1",
      movementNextPhaseId: 3,
      missingPhaseIds: [2],
      name: "Planche",
      description: "",
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      sideMode: "UNILATERAL",
      executionParameters: incomplete,
      media: [],
      createdAt: "now",
      updatedAt: "now",
    };
    renderRoute({ params: { catalogueDefinitionId: "def-2" }, service: { getActivityDefinition: jest.fn(async () => definition) } });
    await screen.findByDisplayValue("Planche");
    expect(String(screen.getByTestId("exercise-parameters-phrase").props.children)).toBe(strings.executionParameters.card.incomplete);
    expect(screen.getByTestId("activity-editor-finish-action").props.accessibilityState).toMatchObject({ disabled: true });
    openSheet();
    const sheet = strings.executionParameters.sheet;
    expect(String(screen.getByTestId("execution-sheet-phase-row-2-duration-value").props.children)).toBe(sheet.unset);
    // PRE-7 (D-446) : « Durée d'une série » garde sa pastille modifiable, ici « — » (Cible lue à renseigner).
    expect(String(screen.getByTestId("execution-sheet-target-value-text").props.children)).toBe(sheet.unset);
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("PRE-7 (D-446) — frère incomplet à Cible chiffrée ouvert au Catalogue : Carte « Paramètres à compléter. », Terminer inactif", async () => {
    const incomplete: ExecutionParameters = {
      ...PHASED,
      series: {
        ...(PHASED.series as Extract<ExecutionParameters["series"], { kind: "UNIFORM" }>),
        target: { kind: "NUMBER", value: 6 },
        workPhases: [
          { id: 1, label: "Descente", durationSeconds: 6 },
          { id: 2, label: "Maintien", durationSeconds: 0 },
        ],
      },
    };
    const definition: ActivityDefinition = {
      id: "def-3",
      movementId: "mov-1",
      movementNextPhaseId: 3,
      missingPhaseIds: [2],
      name: "Planche",
      description: "",
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      sideMode: "UNILATERAL",
      executionParameters: incomplete,
      media: [],
      createdAt: "now",
      updatedAt: "now",
    };
    renderRoute({ params: { catalogueDefinitionId: "def-3" }, service: { getActivityDefinition: jest.fn(async () => definition) } });
    await screen.findByDisplayValue("Planche");
    expect(String(screen.getByTestId("exercise-parameters-phrase").props.children)).toBe(strings.executionParameters.card.incomplete);
    expect(screen.getByTestId("activity-editor-finish-action").props.accessibilityState).toMatchObject({ disabled: true });
  });
});
