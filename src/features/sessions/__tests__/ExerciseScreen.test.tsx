import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { ScrollView, StyleSheet } from "react-native";

import type { ActivityDefinition } from "@/domain/activities";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import type { DraftMediaItem } from "@/domain/media/ActivityMedia";
import type { ImportItem } from "@/domain/media/ActivityMediaImportService";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
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
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

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

const CANONICAL: ExecutionParameters = {
  version: 1,
  mode: "DURATION",
  series: {
    kind: "VARIABLE",
    rows: [
      { target: 30, pauseSeconds: 10 },
      { target: 45, pauseSeconds: 20 },
    ],
  },
  sideMode: "RIGHT_LEFT",
  sideOrder: "BY_SIDE",
  sideRecoverySeconds: 7,
  cadenceBeepIntervalSeconds: 4,
  countdownSeconds: 3,
  endSeconds: 2,
};

const PHOTO: DraftMediaItem = {
  assetId: "p1",
  asset: { id: "p1", uri: "kodjo-media/p1.jpg", createdAt: "now", kind: "PHOTO" },
};

function canonicalOccurrence(overrides: Partial<SessionDraftExercise> = {}): SessionDraftExercise {
  return {
    ...createExerciseDraft("occ-1", 30),
    name: "Fentes",
    executionMode: "DURATION",
    durationSeconds: 30,
    seriesCount: 2,
    pauseSeconds: 10,
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
}) {
  mockSearchParams = options.params ?? {};
  const updateDraft = jest.fn<SessionDraftContextValue["updateDraft"]>();
  const service = fakeActivityDefinitionService(options.service);
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>
        <ReferentialServiceContext.Provider value={fakeReferentialService({ listCategories: jest.fn(async () => [A_CATEGORY]) })}>
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
  fireEvent.press(screen.getByTestId("execution-sheet-mode-value"));
  fireEvent.press(within(screen.getByTestId("execution-sheet-mode-control")).getByText("Durée"));
  fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
  fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 0);
  fireNativeSelectionChange(screen.getByTestId("duration-wheel-seconds"), 45);
  fireEvent.press(screen.getByTestId("duration-wheel-validate"));
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
  it("uses the shared FixedHeader/HeaderSeparator, showing the functional title — never the Session name (D-105)", () => {
    renderScreen();
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
      executionParameters: expect.objectContaining({ mode: "DURATION", series: { kind: "UNIFORM", count: 1, target: 45, pauseSeconds: 0 } }),
      media: [],
      durationSeconds: 45,
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
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 2,
      pauseSeconds: 10,
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
      executionMode: "DURATION",
      durationSeconds: 45,
      executionParameters: expect.objectContaining({ mode: "DURATION" }),
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
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    fireEvent.press(within(screen.getByTestId("execution-sheet-side-control")).getByText("Droite puis gauche"));
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
    fireEvent(screen.getByTestId("execution-sheet-series-increment"), "pressIn");
    fireEvent(screen.getByTestId("execution-sheet-series-increment"), "pressOut");
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    expect(screen.getByTestId("exercise-parameters-card").props.accessibilityLabel).toBe(before);
    expect(lastGuardBlock()).toBe(false);
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    fireEvent(screen.getByTestId("execution-sheet-series-increment"), "pressIn");
    fireEvent(screen.getByTestId("execution-sheet-series-increment"), "pressOut");
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
    expect(screen.getByLabelText("Description de l’exercice")).toBeTruthy();
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
