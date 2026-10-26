import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Menu } from "@expo/ui/swift-ui";
import { disabled as swiftUIDisabled } from "@expo/ui/swift-ui/modifiers";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { Platform, View } from "react-native";

import type { MediaAsset } from "@/domain/media/MediaAsset";

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
 * PRE-7 story A3.1 (D-439, MFN-05, MFN-07, MFN-08, MFN/AC16 ; matrice de la spec
 * `spec-a3-1-pastille-popover-niveau.md`) — pastille et popover de Niveau de la fiche, sur les VRAIS
 * services et une base SQLite réelle (schéma 012) : rang dérivé, état vide sans groupe, « Changer de
 * niveau » vers l'Exercice explicitement choisi, « Ajouter un niveau » (nouveau geste et son
 * Exercice, inséré juste après l'origine, sans question d'identité, rien d'écrit avant `Terminer`).
 * Plate-forme : iOS (`jest-expo`), menu natif. Rappel : ces tests ne valent pas recette sur iPhone (JA).
 *
 * PRE-7 story R-6 (MFN-07 l.371-373, C02, C09) : « Ajouter un niveau » demande le sens (Plus facile /
 * Plus difficile : avant / après l'origine) ; description et médias vierges ; en reprise, la commande
 * Niveau est présente (choix par mouvement, « Ajouter » indisponible).
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

describe("PRE-7 A3.1 — pastille de Niveau (rangée de classification)", () => {
  it("Exercice rang 2 sur 2 : « Niveau 2 », deux tranches pleines, troisième accès de la rangée (écart 12, Zones élastiques)", async () => {
    const { squats } = await twoLevels();
    await renderEditor({ catalogueDefinitionId: squats.id });
    expect(pastilleLabel()).toBe("Niveau 2");
    expect(screen.getByTestId("activity-editor-level-gauge-segment-2-reached", anyNode)).toBeTruthy();
    expect(screen.queryByTestId("activity-editor-level-gauge-segment-3-reached", anyNode)).toBeNull();
    const row = screen.getByTestId("exercise-reference-row");
    expect(row.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ flexWrap: "nowrap", columnGap: 12 })]));
    expect(within(row).getByTestId("activity-editor-level", anyNode)).toBeTruthy();
    expect(screen.getByTestId("exercise-body-zones-open").props.hitSlop).toMatchObject({ left: 6, right: 6, top: 1, bottom: 17 });
  });

  it("geste sans groupe, puis singleton : pastille vide « Niveau », « Changer de niveau » indisponible", async () => {
    const alone = await create({ name: "Pompes" });
    await renderEditor({ catalogueDefinitionId: alone.id });
    expect(pastilleLabel()).toBe("Niveau");
    expect(screen.getByTestId("activity-editor-level-focus", anyNode)).toBeTruthy();
    expect(JSON.stringify(nativeMenu("activity-editor-level-change")?.props.modifiers)).toContain(JSON.stringify(swiftUIDisabled(true)));
    screen.unmount();

    const { assisted, squats } = await twoLevels();
    await movements().detachFromGroup(squats.movementId);
    await renderEditor({ catalogueDefinitionId: assisted.id });
    expect(pastilleLabel()).toBe("Niveau");
  });

  it("création sans geste : aucune pastille ; création sur geste repris : pastille du geste et commande Niveau (R-6, C09), « Ajouter » indisponible", async () => {
    const { squats } = await twoLevels();
    await renderEditor({ catalogueDefinitionId: "new" });
    expect(screen.queryByTestId("activity-editor-level", anyNode)).toBeNull();
    screen.unmount();
    await renderEditor({ catalogueDefinitionId: "new", movementId: squats.movementId });
    expect(pastilleLabel()).toBe("Niveau 2");
    expect(JSON.stringify(nativeMenu("activity-editor-level-change")?.props.modifiers)).toContain(JSON.stringify(swiftUIDisabled(false)));
    expect(JSON.stringify(nativeMenu("activity-editor-level-add")?.props.modifiers)).toContain(JSON.stringify(swiftUIDisabled(true)));
  });

  it("lecture des niveaux en échec : pastille vide sans popover (journal)", async () => {
    const { squats } = await twoLevels();
    const failing = service();
    jest.spyOn(failing, "getMovementLevels").mockRejectedValue(new Error("lecture"));
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
    await renderEditor({ catalogueDefinitionId: squats.id }, failing);
    expect(pastilleLabel()).toBe("Niveau");
    expect(screen.getByTestId("activity-editor-level").props.accessibilityLabel).toBe("Niveau — non renseigné");
    expect(screen.queryByTestId("activity-editor-level-add", anyNode)).toBeNull();
    expect(log).toHaveBeenCalledWith("Les niveaux du geste n'ont pas pu être chargés.", expect.any(Error));
    log.mockRestore();
  });
});

describe("PRE-7 A3.1 — Changer de niveau (MFN-07, MFN/AC16)", () => {
  it("niveau à un Exercice : ouverture directe de cet Exercice ; l'Exercice ouvert est coché, sans effet", async () => {
    const { assisted, squats } = await twoLevels();
    await renderEditor({ catalogueDefinitionId: squats.id });
    const level2 = screen.getByTestId("activity-editor-level-level-2", anyNode);
    expect([level2.props.label, level2.props.systemImage]).toEqual(["Niveau 2 sur 2 · Squats", "checkmark"]);
    await pressNative("activity-editor-level-level-2");
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByTestId("activity-editor-level-level-1", anyNode).props.label).toBe("Niveau 1 sur 2 · Squats assistés");
    await pressNative("activity-editor-level-level-1");
    expect(mockReplace).toHaveBeenCalledWith({ pathname: "/exercise", params: { catalogueDefinitionId: assisted.id } });
  });

  it("niveau à plusieurs Exercices : choix explicite par le résumé des paramètres, aucun par défaut", async () => {
    const { assisted, squats } = await twoLevels();
    const second = await create({ executionParameters: phased(phases(6, 3), 5) }, { kind: "SAME_MOVEMENT", movementId: assisted.movementId });
    await renderEditor({ catalogueDefinitionId: squats.id });
    const level1 = nativeMenu("activity-editor-level-level-1");
    expect(level1?.props.label).toBe("Niveau 1 sur 2 · Squats assistés");
    const labels = [assisted.id, second.id].map((id) => screen.getByTestId(`activity-editor-level-level-1-${id}`, anyNode).props.label);
    expect(new Set(labels).size).toBe(2);
    expect(labels.every((label: string) => /séries/.test(label))).toBe(true);
    expect(mockReplace).not.toHaveBeenCalled();
    await pressNative(`activity-editor-level-level-1-${second.id}`);
    expect(mockReplace).toHaveBeenCalledWith({ pathname: "/exercise", params: { catalogueDefinitionId: second.id } });
  });

  it("niveau d'un geste local (sans Exercice au Catalogue) : option indisponible", async () => {
    const { assisted, squats } = await twoLevels();
    await movements().create({
      id: "genou",
      name: "Mobilisation du genou",
      description: null,
      media: [],
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      phases: [],
      nextPhaseId: 1,
      aliases: [],
      levelGroup: null,
    });
    await movements().attachToGroup("genou", assisted.movementId);
    await renderEditor({ catalogueDefinitionId: squats.id });
    const level3 = screen.getByTestId("activity-editor-level-level-3", anyNode);
    expect(level3.props.label).toBe("Niveau 3 sur 3 · Mobilisation du genou");
    expect(JSON.stringify(level3.props.modifiers)).toContain(JSON.stringify(swiftUIDisabled(true)));
    await pressNative("activity-editor-level-level-3");
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe("PRE-7 A3.1 — Ajouter un niveau (MFN-07, MFN-05, MFN-08 ; R-6 : sens et contenu C02)", () => {
  it("depuis la fiche : Plus difficile → création du niveau ; description vierge, Catégorie reprise (nom vide) ; Terminer → inséré juste après l'origine, sans question d'identité", async () => {
    const { assisted, squats } = await twoLevels();
    await renderEditor({ catalogueDefinitionId: assisted.id });
    await pressNative("activity-editor-level-add-harder");
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/exercise",
      params: { catalogueDefinitionId: "new", levelOriginDefinitionId: assisted.id, levelPlacement: "AFTER_ORIGIN" },
    });
    screen.unmount();

    const definitionsBefore = await definitionsRows();
    const movementsBefore = await movementsRows();
    await renderEditor({ catalogueDefinitionId: "new", levelOriginDefinitionId: assisted.id, levelPlacement: "AFTER_ORIGIN" });
    expect(screen.getByTestId("exercise-name-input").props.value).toBe("");
    // PRE-7 (R-6, MFN-07 l.373, C02) : description vierge.
    expect(screen.queryByDisplayValue("Buste droit")).toBeNull();
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityLabel).toBe("Catégorie Cardio");
    // Aucune suggestion ni recherche de geste : l'origine est déjà choisie.
    expect(screen.queryByTestId("activity-editor-movement-search")).toBeNull();
    // PRE-7 (R-6, C06) : pastille du rang prévu, affichage seul (origine 1 sur 2 → 2 sur 3).
    expect(pastilleLabel()).toBe("Niveau 2");
    expect(screen.getByTestId("activity-editor-level").props.accessibilityLabel).toBe("Niveau 2");
    // Rien n'est écrit avant `Terminer`.
    expect(await definitionsRows()).toEqual(definitionsBefore);
    expect(await movementsRows()).toEqual(movementsBefore);

    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Squats sautés");
    fireEvent(screen.getByTestId("exercise-name-input"), "endEditing", { nativeEvent: { text: "Squats sautés" } });
    await settle(20);
    expect(screen.queryByTestId("movement-suggestion-panel")).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(50);
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(mockBack).toHaveBeenCalledTimes(1);

    const created = (await service().listActivityDefinitions()).find((definition) => definition.name === "Squats sautés");
    expect(created).toBeDefined();
    expect(created?.movementId).not.toBe(assisted.movementId);
    expect(created?.executionParameters).toEqual(assisted.executionParameters);
    expect(created?.description ?? "").toBe("");
    const levels = await service().getMovementLevels(created!.movementId);
    expect(levels?.position).toEqual({ rank: 2, total: 3 });
    expect(levels?.levels.map((level) => level.movement.name)).toEqual(["Squats assistés", "Squats sautés", "Squats"]);
    // Original et ses Exercices intacts.
    expect(await service().getActivityDefinition(assisted.id)).toEqual(assisted);
    expect(await service().getActivityDefinition(squats.id)).toEqual(squats);
  });

  it("Plus facile : inséré AVANT l'origine (R-6, MFN-07 l.371) ; pastille du rang prévu", async () => {
    const { assisted, squats } = await twoLevels();
    await renderEditor({ catalogueDefinitionId: squats.id });
    await pressNative("activity-editor-level-add-easier");
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/exercise",
      params: { catalogueDefinitionId: "new", levelOriginDefinitionId: squats.id, levelPlacement: "BEFORE_ORIGIN" },
    });
    screen.unmount();
    await renderEditor({ catalogueDefinitionId: "new", levelOriginDefinitionId: squats.id, levelPlacement: "BEFORE_ORIGIN" });
    expect(pastilleLabel()).toBe("Niveau 2");
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Squats demi");
    await settle();
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(50);
    const levels = await service().getMovementLevels(assisted.movementId);
    expect(levels?.levels.map((level) => level.movement.name)).toEqual(["Squats assistés", "Squats demi", "Squats"]);
  });

  it("depuis un geste sans groupe : le groupe est créé (origine niveau 1, nouveau niveau 2)", async () => {
    const alone = await create({ name: "Pompes" });
    await renderEditor({ catalogueDefinitionId: "new", levelOriginDefinitionId: alone.id });
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Pompes inclinées");
    await settle();
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(50);
    const levels = await service().getMovementLevels(alone.movementId);
    expect(levels?.position).toEqual({ rank: 1, total: 2 });
    expect(levels?.levels.map((level) => level.movement.name)).toEqual(["Pompes", "Pompes inclinées"]);
  });
});

const PHOTO: MediaAsset = {
  id: "p1",
  uri: "kodjo-media/p1.jpg",
  createdAt: NOW,
  kind: "PHOTO",
  mimeType: "image/jpeg",
  fileName: null,
  sizeBytes: 10,
  durationMs: null,
  width: 1,
  height: 1,
};

type Measurable = { measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void };

describe("PRE-7 A3.1 — revue : compléments de vérification", () => {
  it("rangée sans pastille (création sans geste) : géométrie Catégorie / Zones inchangée ; avec pastille : cibles de la Catégorie à 6", async () => {
    const { squats } = await twoLevels();
    await renderEditor({ catalogueDefinitionId: "new" });
    expect(screen.getByTestId("activity-editor-category-button").props.hitSlop).toMatchObject({ left: 10, right: 10 });
    expect(screen.getByTestId("exercise-body-zones-open").props.hitSlop).toMatchObject({ left: 10, right: 10 });
    screen.unmount();
    await renderEditor({ catalogueDefinitionId: squats.id });
    expect(screen.getByTestId("activity-editor-category-button").props.hitSlop).toMatchObject({ left: 6, right: 6, top: 1, bottom: 17 });
  });

  it("création sur un geste repris sans groupe : pastille vide « Niveau », commande présente (R-6, CE-UI-NIV-01 §8)", async () => {
    const alone = await create({ name: "Pompes" });
    await renderEditor({ catalogueDefinitionId: "new", movementId: alone.movementId });
    expect(screen.getByTestId("exercise-name-input").props.value).toBe("Pompes");
    expect(pastilleLabel()).toBe("Niveau");
    expect(JSON.stringify(nativeMenu("activity-editor-level-change")?.props.modifiers)).toContain(JSON.stringify(swiftUIDisabled(true)));
  });

  it("Ajouter un niveau : médias VIERGES (R-6, C02), Zones reprises, origine intacte, Compte à rebours de l'original conservé", async () => {
    const origin = await create({ media: [{ assetId: "p1", asset: PHOTO }], bodyZoneIds: ["cuisses"] });
    await renderEditor({ catalogueDefinitionId: "new", levelOriginDefinitionId: origin.id });
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Squats sautés");
    await settle();
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(50);
    const created = (await service().listActivityDefinitions()).find((definition) => definition.name === "Squats sautés");
    expect(created?.media ?? []).toEqual([]);
    expect(created?.bodyZoneIds).toEqual(["cuisses"]);
    // Profil : Compte à rebours 7 ; l'original garde le sien, repris tel quel.
    expect(origin.executionParameters.countdownSeconds).not.toBe(7);
    expect(created?.executionParameters.countdownSeconds).toBe(origin.executionParameters.countdownSeconds);
    expect((await service().getActivityDefinition(origin.id))?.media?.map((item) => item.assetId)).toEqual(["p1"]);
  });

  it("Ajouter un niveau, Exercice d'origine introuvable : écran d'erreur de chargement, rien d'écrit", async () => {
    const definitionsBefore = await definitionsRows();
    await renderEditor({ catalogueDefinitionId: "new", levelOriginDefinitionId: "inconnu" });
    expect(screen.getByTestId("activity-editor-load-error")).toBeTruthy();
    expect(await definitionsRows()).toEqual(definitionsBefore);
  });

  it("Android : la pastille ouvre le panneau sous elle (position mesurée), le choix d'un niveau ouvre son Exercice", async () => {
    const os = jest.replaceProperty(Platform, "OS", "android");
    try {
      const { assisted, squats } = await twoLevels();
      // Mesures simulées (le simulacre de `View` ne rappelle pas) : seules l'ancre (pastille) et
      // l'hôte du panneau ont une position dans la fenêtre.
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
      const panel = screen.getByTestId("activity-editor-level-panel");
      // top = 150 − 50 + 26 + 4 ; right = 0 + 400 − (300 + 80).
      expect(panel.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ top: 130, right: 20 })]));
      expect(screen.getByTestId("activity-editor-level").props.accessibilityState).toEqual({ expanded: true });
      fireEvent.press(screen.getByTestId("activity-editor-level-panel-change"));
      await act(async () => {
        fireEvent.press(screen.getByTestId("activity-editor-level-panel-level-1"));
      });
      expect(mockReplace).toHaveBeenCalledWith({ pathname: "/exercise", params: { catalogueDefinitionId: assisted.id } });
      expect(screen.queryByTestId("activity-editor-level-panel")).toBeNull();
    } finally {
      os.restore();
    }
  });
});
