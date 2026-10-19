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
import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { editorSideMargin, isActivityEditorFormValid } from "@/features/activities/ActivityEditorForm";
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
}) {
  mockSearchParams = options.params ?? {};
  const updateDraft = jest.fn<SessionDraftContextValue["updateDraft"]>();
  const service = fakeActivityDefinitionService(options.service);
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>
        <ReferentialServiceContext.Provider
          value={fakeReferentialService({ listCategories: jest.fn(async () => [A_CATEGORY]), ...options.referential })}
        >
          <ProfileServiceContext.Provider
            value={fakeProfileService({
              getProfile: jest.fn(async () => ({
                ...createDefaultProfile("profile-1", "2026-01-01T00:00:00.000Z"),
                ...options.profile,
              })),
            })}
          >
            <SessionDraftContext.Provider
              value={{
                draft: {
                  name: "Séance simple",
                  labelId: null,
                  initialCountdownSeconds: 10,
                  finalPhaseSeconds: 5,
                  exercises: options.exercises ?? [],
                },
                updateDraft,
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
  return { updateDraft, service };
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
    expect(screen.getByTestId("exercise-parameters-countdown").props.children).toBe("3 s");
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
    expect(screen.getByTestId("exercise-parameters-end").props.children).toBe("2 s");
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
    renderRoute({ profile: { exerciseCountdownSecondsDefault: 12, exerciseEndSecondsDefault: 6, sideChangeRecoverySecondsDefault: 9 } });
    await waitFor(() => expect(screen.getByTestId("exercise-parameters-countdown").props.children).toBe("12 s"));
    expect(screen.getByTestId("exercise-parameters-end").props.children).toBe("6 s");
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    // PRE-5 story 2.5 (AC4, D-409, RM-218) : Exercice ouvert depuis une Séance — la Feuille ne
    // présente ni Compte à rebours ni Fin, ni le chevron de la Durée de l'exercice.
    expect(screen.queryByTestId("execution-sheet-row-countdown")).toBeNull();
    expect(screen.queryByTestId("execution-sheet-row-end")).toBeNull();
    expect(screen.queryByTestId("execution-sheet-duration-disclosure-frame")).toBeNull();
    // PRE-5 story 2.5 (AC1) : Avec (Sans → Avec) copie la Pause entre les côtés du Profil.
    chooseExecutionSide("Avec");
    expect(screen.getByTestId("execution-sheet-side-recovery-value").props.children).toBe("9 s");
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));

    const existing = canonicalOccurrence({ id: "occ-9" });
    renderRoute({ params: { exerciseId: "occ-9" }, exercises: [existing], profile: { exerciseCountdownSecondsDefault: 20 } });
    expect(screen.getAllByTestId("exercise-parameters-countdown").at(-1)!.props.children).toBe("3 s");
  });

  it("P3-13/no-auto-R — nouvelle occurrence : R = 0 s quel que soit le Profil ; occurrence existante : R = 30 s inchangée", async () => {
    const { updateDraft } = renderRoute({ profile: { postActivityRecoverySecondsDefault: 45 } });
    await fillNewExercise();
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    expect(updateDraft.mock.calls[0]![0].exercises![0]!.postActivityRecoverySeconds).toBe(0);

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

  it("shows the Category's colored swatch before its name in the pill", async () => {
    renderRoute({ params: { catalogueDefinitionId: "new" } });
    await chooseCategory();
    await waitFor(() =>
      expect(StyleSheet.flatten(screen.getByTestId("activity-editor-category-swatch").props.style).backgroundColor).toBe("#3B82F6"),
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

  /** Centre horizontal du halo (style rendu) et padding réellement reçu par `FixedHeader`, dans le même rendu. */
  function haloAgainstHeader() {
    const padding = StyleSheet.flatten(screen.getByTestId("screen-header").props.style).paddingHorizontal as number;
    const halo = StyleSheet.flatten(screen.getByTestId("exercise-context-band-halo").props.style);
    const circle = StyleSheet.flatten(screen.getByTestId("screen-header-back").props.style).width as number;
    return { padding, haloCenter: (halo.left as number) + (halo.width as number) / 2, closeCenter: padding + circle / 2 };
  }

  it("PRE4-4.2/AC4 — ✕ circulaire en haut à gauche dans les quatre parcours (prop locale de FixedHeader), annoncé « Retour » ; halo centré sur le ✕ ; les autres écrans gardent le chevron", async () => {
    for (const pathName of ["CC", "MC", "CS", "MS"] as const) {
      await renderPath(pathName);
      expect(within(screen.getByTestId("screen-header")).UNSAFE_getByType(KodjoIcon).props.name).toBe("control-close");
      // Libellé du code de départ, en attente d'arbitrage (Q48).
      expect(screen.getByTestId("screen-header-back").props.accessibilityLabel).toBe("Retour");
      const { haloCenter, closeCenter } = haloAgainstHeader();
      expect(haloCenter).toBeCloseTo(closeCenter, 5);
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
    expect(StyleSheet.flatten(within(header).getByTestId("screen-header-back-icon").props.style)).toMatchObject({ width: 24, height: 24 });
    // Le ✕ est le premier élément de l'en-tête (en haut à gauche), avant le titre.
    const headerChildren = (header.props.children as unknown[]).flat().filter(Boolean) as { props: { testID?: string } }[];
    expect(headerChildren[0]!.props.testID).toBe("screen-header-back");
    expect(StyleSheet.flatten(header.props.style).paddingHorizontal).toBe(24);
    expect(screen.queryByTestId("screen-header-separator")).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId("exercise-context-band-halo").props.style)).toMatchObject({ width: 59.28, height: 59.28 });
    expect(StyleSheet.flatten(screen.getByTestId("exercise-context-band-fade").props.style)).toMatchObject({ height: "20%", bottom: 0 });
    expect(StyleSheet.flatten(screen.getByTestId("exercise-context-band").props.style).backgroundColor).toBe("#EAEAFF");
    expect(StyleSheet.flatten(screen.getByTestId("exercise-name-input").props.style).borderWidth).toBeUndefined();
    screen.unmount();

    // `FixedHeader` est partagé : sans la prop locale, le chevron Retour et la marge 24 sont inchangés.
    render(
      <TestSafeAreaProvider>
        <FixedHeader title="Composition" onBack={jest.fn()} backAccessibilityLabel="Retour" />
      </TestSafeAreaProvider>,
    );
    expect(screen.UNSAFE_getByType(KodjoIcon).props.name).toBe("control-back");
    expect(StyleSheet.flatten(screen.getByTestId("screen-header").props.style).paddingHorizontal).toBe(24);
  });

  it("PRE4-4.2/AC4 AC5 — CC, MC, CS, MS à 360, 390 et 440 : l'en-tête reçoit `editorSideMargin(width)` (16 sous 390, sinon 24), comme le bandeau ; centre du halo = centre du ✕ rendu", async () => {
    const window = Dimensions.get("window");
    const screenSize = Dimensions.get("screen");
    try {
      for (const width of [360, 390, 440]) {
        act(() => {
          Dimensions.set({ window: { ...window, width }, screen: { ...screenSize, width } });
        });
        for (const pathName of ["CC", "MC", "CS", "MS"] as const) {
          await renderPath(pathName);
          const { padding, haloCenter, closeCenter } = haloAgainstHeader();
          expect(padding).toBe(editorSideMargin(width));
          expect(padding).toBe(width < 390 ? 16 : 24);
          expect(StyleSheet.flatten(screen.getByTestId("exercise-context-band").props.style).paddingHorizontal).toBe(padding);
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
  it("PRE4-4.3/AC2 — CC : icône Catégorie pleine pendant l'ouverture de sa feuille, au contour après ✕ ; après ✓, la pilule pastille + nom remplace l'icône", async () => {
    renderRoute({ params: { catalogueDefinitionId: "new" } });
    expect(await screen.findByTestId("activity-editor-category-icon")).toBeTruthy();
    fireEvent.press(screen.getByTestId("activity-editor-category-button"));
    expect(await screen.findByTestId("category-picker-sheet")).toBeTruthy();
    expect(screen.getByTestId("activity-editor-category-icon-filled")).toBeTruthy();
    expect(screen.queryByTestId("activity-editor-category-icon")).toBeNull();
    fireEvent.press(screen.getByTestId("category-picker-close"));
    expect(screen.queryByTestId("category-picker-sheet")).toBeNull();
    expect(screen.getByTestId("activity-editor-category-icon")).toBeTruthy();
    expect(screen.queryByTestId("activity-editor-category-icon-filled")).toBeNull();
    await chooseCategory();
    expect(screen.queryByTestId("activity-editor-category-icon-filled")).toBeNull();
    expect(screen.getByTestId("activity-editor-category-swatch")).toBeTruthy();
  });

  it("PRE4-4.3/AC2 — MS : même icône pleine pendant l'ouverture, au contour après ✕ ; après ✓, ni icône pleine ni état « développé » (adaptateur Séance)", async () => {
    renderRoute({ params: { exerciseId: "occ-1" }, exercises: [canonicalOccurrence({ categoryId: null })] });
    expect(await screen.findByTestId("activity-editor-category-icon")).toBeTruthy();
    fireEvent.press(screen.getByTestId("activity-editor-category-button"));
    expect(await screen.findByTestId("category-picker-sheet")).toBeTruthy();
    expect(screen.getByTestId("activity-editor-category-icon-filled")).toBeTruthy();
    fireEvent.press(screen.getByTestId("category-picker-close"));
    expect(screen.getByTestId("activity-editor-category-icon")).toBeTruthy();
    // Chemin ✓ : la feuille fermée, l'accès n'est plus « développé » ni plein ; la
    // Catégorie choisie s'affiche en pastille + nom (aucune icône dans cet état).
    await chooseCategory();
    expect(screen.queryByTestId("activity-editor-category-icon-filled")).toBeNull();
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityState).toEqual({ expanded: false });
    expect(screen.getByTestId("activity-editor-category-swatch")).toBeTruthy();
  });

  it("PRE4-4.3/AC2 — CS : accès Zones plein et « développé » pendant l'ouverture de sa feuille, au contour après ✕ puis après ✓", async () => {
    renderRoute({});
    expect(await screen.findByTestId("exercise-body-zones-icon")).toBeTruthy();
    const zonesButton = () => screen.getByTestId("exercise-body-zones-open");
    for (const close of ["body-zone-picker-close", "body-zone-picker-confirm"]) {
      fireEvent.press(zonesButton());
      fireEvent.press(await screen.findByTestId("body-zone-selector-tag-cuisses"));
      expect(screen.getByTestId("exercise-body-zones-icon-filled")).toBeTruthy();
      expect(screen.queryByTestId("exercise-body-zones-icon")).toBeNull();
      expect(zonesButton().props.accessibilityState).toEqual({ expanded: true });
      await act(async () => {
        fireEvent.press(screen.getByTestId(close));
      });
      expect(screen.getByTestId("exercise-body-zones-icon")).toBeTruthy();
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
