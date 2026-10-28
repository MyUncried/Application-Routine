import { router as expoRouter } from "expo-router";
import { act, fireEvent, renderRouter, screen, testRouter, waitFor, within } from "expo-router/testing-library";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Stack } from "expo-router/stack";
import type { ReactNode } from "react";

import { activityDefinitionToDraftExercise, validateActivityDefinitionInput, type ActivityDefinition } from "@/domain/activities/ActivityDefinition";
import {
  ActivityMediaImportService,
  type MediaCopyPort,
  type MediaPickerPort,
  type PickedMedia,
  type PickOutcome,
} from "@/domain/media/ActivityMediaImportService";
import type { MediaAsset } from "@/domain/media/MediaAsset";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { toTarget, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createEmptyDraft, toCreateSessionInput, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceProvider } from "@/features/activities/ActivityDefinitionServiceProvider";
import { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import type { Database } from "@/infrastructure/database/Database";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteLabelRepository } from "@/infrastructure/database/repositories/SqliteLabelRepository";
import { SqliteMediaRepository } from "@/infrastructure/database/repositories/SqliteMediaRepository";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { failOnWrite } from "@/infrastructure/database/testing/failOnWrite";
import { ActivityEditorForm } from "@/features/activities/ActivityEditorForm";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import {
  chooseExecutionMode,
  chooseExecutionRegime,
  chooseExecutionSide,
  durationKeys,
  enterExecutionSheetCell,
  openExecutionSheetField,
  showExerciseDurationSignals,
  tapExecutionSheetStep,
} from "@/features/activities/testing/executionSheetActions";
import { openMediaMenu } from "@/features/activities/testing/mediaMenu";
import { strings } from "@/shared/i18n";

/**
 * PRE-4 story 4.1 — les quatre Parcours d'édition (CC, MC, CS, MS) avec le
 * VRAI navigateur et les VRAIES routes : Catalogue (`app/(tabs)/index`),
 * groupe `(creation)` (Composition, Éditeur, Catégories, sélection), vrais
 * services sur une base SQLite réelle en mémoire (`node:sqlite`).
 *
 * Seuls sont doublés : `expo-sqlite` (référentiel des Étiquettes de
 * Composition, dégradé en vide), `expo-haptics`, `expo-crypto` (UUID réels
 * de Node) et le générateur d'affiches vidéo. `ActivityEditorForm` et
 * `ExecutionParametersSheet` sont enveloppés dans un espion qui appelle le
 * composant réel : il prouve que c'est le même composant qui est rendu dans
 * chaque parcours (AC6), sans en changer le rendu.
 *
 * Rappel NFR-04 : ces tests ne valent pas recette sur iPhone.
 */

/**
 * PRE-7 (R-3, D-445 C05) : l'occurrence ne stocke ni nom ni description — vue SQL des occurrences
 * avec le contenu courant de leur Mouvement (`name`, `instruction`), pour les relectures directes.
 */
const OCCURRENCES =
  "(SELECT activities.*, movements.name AS name, movements.description AS instruction FROM activities JOIN movements ON movements.id = activities.source_movement_id) AS occurrence_view";

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => ({}),
}));

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

jest.mock("expo-crypto", () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  randomUUID: () => (require("node:crypto") as typeof import("node:crypto")).randomUUID(),
}));

jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

jest.mock("@/features/activities/ActivityEditorForm", () => {
  const actual = jest.requireActual("@/features/activities/ActivityEditorForm") as Record<string, unknown>;
  return { ...actual, ActivityEditorForm: jest.fn(actual.ActivityEditorForm as (...args: unknown[]) => unknown) };
});

jest.mock("@/features/activities/ExecutionParametersSheet", () => {
  const actual = jest.requireActual("@/features/activities/ExecutionParametersSheet") as Record<string, unknown>;
  return { ...actual, ExecutionParametersSheet: jest.fn(actual.ExecutionParametersSheet as (...args: unknown[]) => unknown) };
});

const editorSpy = ActivityEditorForm as unknown as jest.Mock;
const sheetSpy = ExecutionParametersSheet as unknown as jest.Mock;

const sessions = strings.screens.sessions;
const composition = strings.screens.composition;
const exercise = strings.screens.exercise;
const activities = strings.screens.activities;

class CountingStore implements MediaCopyPort {
  readonly files = new Set<string>();
  /** Story 4.4 (AC5) : sources dont la prochaine copie échoue (erreur simulée `COPY_FAILED`). */
  readonly failOnce = new Set<string>();
  /** Story 4.4 (AC5) : octets disponibles (`STORAGE_FULL` si dépassés) ; `null` = inconnu. */
  available: number | null = null;
  async copyToInternal(source: PickedMedia, assetId: string) {
    if (this.failOnce.delete(source.uri)) {
      throw new Error("copie interrompue");
    }
    const uri = `kodjo-media/${assetId}`;
    this.files.add(uri);
    return { uri, sizeBytes: 10 };
  }
  availableBytes() {
    return this.available;
  }
  async deletePrepared(uri: string) {
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
  editorSpy.mockClear();
  sheetSpy.mockClear();
});

afterEach(() => {
  database.close();
});

function asset(id: string): MediaAsset {
  const uri = `kodjo-media/${id}`;
  store.files.add(uri);
  return { id, uri, createdAt: "2026-10-16T10:00:00.000Z", kind: "PHOTO", mimeType: "image/jpeg", fileName: null, sizeBytes: 10, durationMs: null, width: null, height: null };
}

/**
 * AC10 : Régime variables à Cibles mixtes (Durée 30 s, 45 s, à l'échec ;
 * Pauses 10, 20, 30 s), bilatéral, Bip 2 s, Compte à rebours 10 s, Fin 5 s.
 */
const MIXED_PARAMETERS = variableParameters({
  mode: "DURATION",
  rows: [
    [30, 10],
    [45, 20],
    ["FAILURE", 30],
  ],
  sideMode: "RIGHT_LEFT",
  sideRecoverySeconds: 5,
  cadenceBeepIntervalSeconds: 2,
  countdownSeconds: 10,
  endSeconds: 5,
});

/** Définition complète : nom, Catégorie, deux Zones, paramètres typés, description, deux Médias. */
async function savedDefinition(
  executionParameters: ExecutionParameters = variableParameters({
    mode: "DURATION",
    rows: [
      [30, 10],
      [45, 20],
    ],
    sideMode: "RIGHT_LEFT",
    sideRecoverySeconds: 5,
  }),
  description: string = "Genou au-dessus de la cheville.",
): Promise<ActivityDefinition> {
  const validated = validateActivityDefinitionInput({
    name: "Fentes",
    description,
    category: { kind: "EXISTING", categoryId: "cardio" },
    bodyZoneIds: ["cuisses", "dos"],
    executionParameters,
    media: [asset("p1"), asset("p2")].map((item) => ({ assetId: item.id, asset: item })),
  });
  if (!validated.ok) {
    throw new Error(JSON.stringify(validated.violations));
  }
  return new SqliteActivityDefinitionRepository(database, ids("def")).create(validated.value);
}

/** Nom de la Catégorie enregistrée par `savedDefinition` (`cardio`), relu dans la base. */
async function savedCategoryName(): Promise<string> {
  const row = await database.getFirstAsync<{ name: string }>("SELECT name FROM categories WHERE id = ?", ["cardio"]);
  return row!.name;
}

/** Séance persistée qui contient une Copie de la Définition. */
async function savedSessionWithCopy(definition: ActivityDefinition): Promise<{ sessionId: string; copy: SessionDraftExercise }> {
  const copy = activityDefinitionToDraftExercise(definition, "occ-1", 0);
  const input = toCreateSessionInput({ ...createEmptyDraft(), name: "Jambes", exercises: [copy] });
  if (!input.ok) {
    throw new Error(JSON.stringify(input.violations));
  }
  const session = await new SqliteSessionRepository(database, ids("ses")).create(input.value);
  const [persisted] = await database.getAllAsync<{ id: string }>("SELECT id FROM activities");
  return { sessionId: session.id, copy: { ...copy, id: persisted!.id } };
}

/**
 * Contenu de TOUTES les tables de la base (schéma lu dans `sqlite_master`) :
 * « rien n'est écrit » vaut pour les tables de lien (Zones, Catégories,
 * points d'arrêt, cycles, tours, Médias…), pas seulement pour les tables principales.
 */
async function dump(): Promise<Record<string, unknown[]>> {
  const tables = await database.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  const result: Record<string, unknown[]> = {};
  for (const { name } of tables) {
    const rows = await database.getAllAsync(`SELECT * FROM "${name}"`);
    result[name] = rows.map((row) => JSON.stringify(row)).sort();
  }
  return result;
}

/** Racine en pile, comme `app/_layout.tsx` (sans splash ni base native). */
function RootStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

/**
 * `definitionDatabase` (story 4.2, AC10) : base passée au seul repository des
 * Définitions, pour y injecter un échec d'écriture (motif `FailingDatabase`,
 * `failOnWrite`) ; par défaut, la base commune.
 */
function renderApp(options: { readonly definitionDatabase?: Database; readonly picker?: MediaPickerPort } = {}) {
  const importService = new ActivityMediaImportService(
    options.picker ?? { pickFromLibrary: async () => ({ status: "CANCELED" }) },
    store,
    ids("asset"),
  );
  const activityDefinitionService = new ActivityDefinitionService(
    new SqliteActivityDefinitionRepository(options.definitionDatabase ?? database),
    new SqliteCategoryRepository(database),
    new SqliteBodyZoneRepository(database),
    new SqliteLabelRepository(database),
    { importService, repository: new SqliteMediaRepository(database) },
  );
  const sessionService = new SessionService(new SqliteSessionRepository(database), new SqliteCategoryRepository(database));
  const referentialService = new ReferentialService(
    new SqliteCategoryRepository(database),
    new SqliteBodyZoneRepository(database),
    new SqliteLabelRepository(database),
  );
  const profileService = new ProfileService(new SqliteProfileRepository(database));

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SessionServiceContext.Provider value={sessionService}>
        <ActivityDefinitionServiceProvider service={activityDefinitionService}>
          <ReferentialServiceContext.Provider value={referentialService}>
            <ProfileServiceContext.Provider value={profileService}>{children}</ProfileServiceContext.Provider>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceProvider>
      </SessionServiceContext.Provider>
    );
  }

  return renderRouter(
    {
      // Racine en pile, comme `app/_layout.tsx` : le Catalogue reste monté sous l’Éditeur.
      _layout: RootStack,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      index: require("../../../../app/(tabs)/index").default,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/_layout": require("../../../../app/(creation)/_layout").default,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/composition": require("../../../../app/(creation)/composition").default,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/exercise": require("../../../../app/(creation)/exercise").default,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/activity-selection": require("../../../../app/(creation)/activity-selection").default,
    },
    { initialUrl: "/", wrapper: Wrapper },
  );
}

/**
 * Laisse se résoudre les lectures asynchrones (services SQLite) et l'animation
 * du segmenté (220 ms). `renderRouter` installe des minuteries simulées
 * (`jest.useFakeTimers`) : le temps est avancé explicitement, les promesses
 * étant vidées entre deux minuteries.
 */
async function settle(ms = 0) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
    for (let round = 0; round < 5; round += 1) {
      await jest.advanceTimersByTimeAsync(0);
    }
  });
}

/**
 * PRE-8 (epic E, E.8-a) : le segment Exercices du Catalogue est retiré. Les parcours CC et MC
 * ouvrent l'éditeur des anciennes définitions par sa route existante, au-dessus du Catalogue (le
 * point d'entrée utilisateur — commande Modifier de la sélection d'Exercices — est couvert par
 * « PRE-8 E.8-a » ci-dessous et par `ActivitySelectionScreen.e8a.test.tsx`). Le Catalogue reste
 * monté dessous : Terminer ou la sortie y reviennent.
 */
async function openExercisesSegment() {
  await settle();
}

/** Éditeur d'une ancienne définition (`"new"` : création, encore atteinte par « Ajouter un niveau »). */
async function openDefinitionEditor(catalogueDefinitionId: string) {
  act(() => {
    expoRouter.push({ pathname: "/exercise", params: { catalogueDefinitionId } });
  });
  await settle();
}

/**
 * Paramètres de route qui portent le contexte d’ouverture de l’Éditeur (AC7).
 * `getSearchParams` y ajoute les paramètres hérités de la pile (`sessionId` de
 * Composition), sans rôle dans l’aiguillage d’`ExerciseScreen`.
 */
function editorContext(params: Record<string, unknown>): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  for (const key of ["catalogueDefinitionId", "exerciseId"]) {
    if (params[key] !== undefined) {
      context[key] = params[key];
    }
  }
  return context;
}

function isSelected(label: string): boolean {
  return Boolean(screen.getByLabelText(label).props.accessibilityState?.selected);
}

/** Saisie minimale valide d'un nouvel Exercice : Nom, Catégorie, Zone « dos », Durée 45 s, ✓. */
async function fillNewExercise(name: string) {
  fireEvent.changeText(screen.getByTestId("exercise-name-input"), name);
  fireEvent.press(screen.getByTestId("activity-editor-category-button"));
  const [firstCategory] = await screen.findAllByTestId(/^category-picker-tag-(?!row$)/);
  fireEvent.press(firstCategory!);
  fireEvent.press(screen.getByTestId("category-picker-confirm"));
  await waitFor(() => expect(screen.queryByTestId("category-picker-sheet")).toBeNull(), { timeout: 3000 });
  fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
  fireEvent.press(await screen.findByTestId("body-zone-selector-tag-dos"));
  await act(async () => {
    fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
  });
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  chooseExecutionMode("Durée");
  fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
  fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 45 } });
  fireEvent.press(screen.getByTestId("duration-wheel-validate"));
  fireEvent.press(screen.getByTestId("execution-sheet-validate"));
}

/** Ouvre puis valide la Feuille sans rien changer : prouve que la Feuille rendue est `ExecutionParametersSheet`. */
function openAndCloseSheet() {
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  expect(screen.getByTestId("execution-sheet")).toBeTruthy();
  fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
}

/**
 * Ouvre la Séance persistée depuis le Catalogue (segment Séances), puis attend Composition chargée.
 * PRE-8 (E.2, E.5) : carte unique, touchée par sa zone glissable (`session-card-<id>-swipe-card`).
 */
async function openSessionFromCatalogue() {
  await settle();
  const [card] = await screen.findAllByTestId(/^session-card-.+-swipe-card$/);
  fireEvent.press(card!);
  await waitFor(() => expect(screen.getByLabelText(composition.name)).toBeTruthy());
  await settle();
}

/**
 * PRE-7 story A2.2 (D-437, MFN-09, MFN/AC28) : une Copie de Séance porte une filiation — son
 * contenu (nom, description, Médias, Catégorie, Zones) est verrouillé, ses paramètres restent
 * modifiables. Les parcours MS qui modifiaient le nom de la Copie modifient désormais un paramètre
 * (2 → 1 série) après avoir vérifié le verrou du nom.
 */
function editCopyParameters() {
  expect(screen.getByDisplayValue("Fentes").props.editable).toBe(false);
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  tapExecutionSheetStep("execution-sheet-series-decrement");
  fireEvent.press(screen.getByTestId("execution-sheet-validate"));
  expect(screen.queryByTestId("execution-sheet")).toBeNull();
}

/** Nombre de séries relu dans les paramètres persistés de la Copie. */
async function copySeriesCount(): Promise<number> {
  const row = await database.getFirstAsync<{ execution_parameters: string }>("SELECT execution_parameters FROM activities");
  const parameters = JSON.parse(row!.execution_parameters) as { series: { kind: string; rows?: unknown[]; count?: number } };
  return parameters.series.kind === "VARIABLE" ? parameters.series.rows!.length : parameters.series.count!;
}

/** Q54 : `Continuer` (PRE-6 story 2.1) depuis la Composition (écran « Catégories de la séance » supprimé). */
async function continueAndSave() {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(composition.saveAction));
  });
  await settle();
}

// PRE-8 (epic E, E.8-a) : les tests PRE4-4.1/AC1 à AC3 portaient sur le segment Exercices du Catalogue
// (Créer direct, abandon restituant le segment et le défilement, carte Exercice et son bouton Lecture),
// retiré par E.8-a (plan approuvé du 28/10, option B). Ils sont remplacés par le parcours ci-dessous :
// l'ancienne définition reste consultable et modifiable depuis la sélection d'Exercices de la Composition.
describe("PRE-8 E.8-a — Modifier une ancienne définition depuis la sélection d'Exercices", () => {
  it("Composition → Un exercice existant → Modifier : éditeur existant sur la définition ; Terminer enregistre ; retour : liste relue, case cochée conservée, brouillon intact, aucune ligne créée", async () => {
    const definition = await savedDefinition();
    const router = renderApp();
    await settle();
    fireEvent.press(screen.getByLabelText(sessions.createAction));
    await settle();
    expect(router.getPathname()).toBe("/composition");
    fireEvent.changeText(screen.getByLabelText(composition.name), "Brouillon E8a");
    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(within(screen.getByTestId("composition-add-activity-tree")).getByLabelText(activities.addToSession.existingActivity));
    await settle();
    expect(router.getPathname()).toBe("/activity-selection");
    expect(screen.queryByTestId("catalogue-content-type-row-activities")).toBeNull();

    fireEvent.press(await screen.findByTestId(`activity-selection-row-${definition.id}`));
    const before = await database.getAllAsync("SELECT id FROM activity_definitions");
    fireEvent.press(screen.getByTestId(`activity-selection-row-edit-${definition.id}`));
    await settle();
    expect(router.getPathname()).toBe("/exercise");
    expect(editorContext(router.getSearchParams())).toEqual({ catalogueDefinitionId: definition.id });
    expect(screen.getByText(activities.editor.titleEdit)).toBeTruthy();
    fireEvent.changeText(await screen.findByDisplayValue("Fentes"), "Fentes avant");
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(300);
    // Le dialogue de sauvegarde du Mouvement peut s'interposer : on retient la seule issue « enregistré ».
    await waitFor(() => expect(router.getPathname()).toBe("/activity-selection"));

    expect(await screen.findByText(/Fentes avant/)).toBeTruthy();
    expect(screen.getByTestId(`activity-selection-row-${definition.id}`).props.accessibilityState).toEqual({ checked: true });
    expect(await database.getAllAsync("SELECT id FROM activity_definitions")).toEqual(before);
    fireEvent.press(screen.getByTestId("activity-selection-cancel"));
    await settle(300);
    expect(router.getPathname()).toBe("/composition");
    expect(screen.getByLabelText(composition.name).props.value).toBe("Brouillon E8a");
  }, 30000);
});

describe("PRE4-4.1/AC4 — Modifier une Copie en Séance", () => {
  it("PRE4-4.1/AC4 — appui court : l'Éditeur s'ouvre sur la Copie ; appui long : réorganisation, pas d'Éditeur", async () => {
    const definition = await savedDefinition();
    const { copy } = await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();

    // Revue 6.2 : sous Jest, `onLayout` ne se déclenche pas ; l'écran refuse un soulèvement sans
    // géométrie complète — chaque rangée affichée reçoit une mesure factice.
    screen
      .queryAllByTestId(/^composition-(activity-|stop-point-row-)/u, { includeHiddenElements: true })
      .filter((node) => typeof node.props.onLayout === "function")
      .forEach((row, index) =>
        fireEvent(row, "layout", { nativeEvent: { layout: { x: 0, y: index * 100, width: 354, height: 80 } } }),
      );
    fireEvent(screen.getByTestId(`composition-exercise-row-${copy.id}`), "longPress");
    await settle();
    expect(router.getPathname()).toBe("/composition");
    expect(screen.queryByTestId("exercise-name-input")).toBeNull();
    // État observable du réordonnancement : la carte est soulevée (`selected`).
    // Le rendu soulevé et le déplacement sont couverts par `CompositionScreen.test.tsx` (AC-02, AC-03).
    expect(screen.getByTestId(`composition-exercise-row-${copy.id}`).props.accessibilityState).toMatchObject({ selected: true });
    fireEvent(screen.getByTestId(`composition-exercise-row-${copy.id}`), "pressOut");
    await settle();
  }, 20000);

  it("PRE4-4.1/AC4 — appui court sur la carte Exercice : Éditeur sur la Copie en Séance", async () => {
    const definition = await savedDefinition();
    const { copy } = await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();

    fireEvent.press(screen.getByTestId(`composition-exercise-row-${copy.id}`));
    await settle();
    expect(router.getPathname()).toBe("/exercise");
    expect(router.getSearchParams()).toMatchObject({ exerciseId: copy.id });
    expect(screen.getByDisplayValue("Fentes")).toBeTruthy();
    expect(screen.getByText(exercise.titleEdit)).toBeTruthy();
  }, 20000);
});

describe("PRE4-4.1/AC5 — Créer dans une Séance, parcours PRE-3 conservé", () => {
  it("PRE4-4.1/AC5 — Ajouter un exercice propose Un nouvel exercice / Un exercice existant / Annuler ; le nouvel Exercice va dans le Brouillon de Composition, à la suite des Exercices affichés, jamais au Catalogue", async () => {
    const definition = await savedDefinition();
    await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();
    expect(router.getPathname()).toBe("/composition");
    const before = await dump();

    fireEvent.press(screen.getByLabelText(composition.addActivity));
    const tree = screen.getByTestId("composition-add-activity-tree");
    expect(within(tree).getByLabelText(activities.addToSession.newActivity)).toBeTruthy();
    expect(within(tree).getByLabelText(activities.addToSession.existingActivity)).toBeTruthy();
    expect(within(tree).getByLabelText(activities.addToSession.cancel)).toBeTruthy();

    fireEvent.press(within(tree).getByLabelText(activities.addToSession.existingActivity));
    await settle();
    expect(router.getPathname()).toBe("/activity-selection");
    act(() => {
      testRouter.back();
    });
    await settle(300);

    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByLabelText(activities.addToSession.newActivity));
    await settle();
    expect(router.getPathname()).toBe("/exercise");
    expect(editorContext(router.getSearchParams())).toEqual({});
    expect(screen.getByText(exercise.titleAdd)).toBeTruthy();

    await fillNewExercise("Pompes");
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    await settle();
    expect(router.getPathname()).toBe("/composition");
    // À la suite des Exercices affichés : dernière carte de Composition.
    // PRE-6 (story 2.2) : nom accessible « Exercice, {nom}, {n} sur {m}, {durée} ».
    const rows = screen.getAllByLabelText(new RegExp(`^${composition.occurrenceCard.accessibilityType}, `));
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText("Fentes")).toBeTruthy();
    expect(within(rows[1]!).getByText("Pompes")).toBeTruthy();
    // Aucune écriture avant Continuer, et jamais au Catalogue.
    expect(await dump()).toEqual(before);

    await continueAndSave();
    await waitFor(() => expect(router.getPathname()).toBe("/"));
    expect(await database.getAllAsync(`SELECT name FROM ${OCCURRENCES} ORDER BY position`)).toEqual([{ name: "Fentes" }, { name: "Pompes" }]);
    expect(await database.getAllAsync("SELECT movements.name FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id")).toEqual([{ name: "Fentes" }]);
  }, 30000);
});

describe("PRE4-4.1/AC6, AC7, AC8 — un seul Éditeur, contexte par la route, Terminer selon le contexte", () => {
  it("PRE4-4.1/AC6 AC7 AC8 — CC : ActivityEditorForm et ExecutionParametersSheet ; route catalogueDefinitionId=new ; Terminer crée la Définition puis restitue le Catalogue", async () => {
    const router = renderApp();
    await openExercisesSegment();
    await openDefinitionEditor("new");
    await settle();

    expect(editorContext(router.getSearchParams())).toEqual({ catalogueDefinitionId: "new" });
    expect(editorSpy).toHaveBeenCalled();
    openAndCloseSheet();
    expect(sheetSpy).toHaveBeenCalled();

    await fillNewExercise("Gainage");
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(300);
    expect(router.getPathname()).toBe("/");
    expect(isSelected(sessions.contentTypes.sessions)).toBe(true);
    expect(await database.getAllAsync("SELECT movements.name FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id")).toEqual([{ name: "Gainage" }]);
  }, 20000);

  it("PRE4-4.1/AC6 AC7 AC8 — MC : même Éditeur et même Feuille ; route catalogueDefinitionId=<id> ; Terminer met à jour la Définition", async () => {
    const definition = await savedDefinition();
    const router = renderApp();
    await openExercisesSegment();
    await openDefinitionEditor(definition.id);
    await screen.findByDisplayValue("Fentes");

    expect(editorContext(router.getSearchParams())).toEqual({ catalogueDefinitionId: definition.id });
    expect(editorSpy).toHaveBeenCalled();
    openAndCloseSheet();
    expect(sheetSpy).toHaveBeenCalled();

    fireEvent.changeText(screen.getByDisplayValue("Fentes"), "Fentes lentes");
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(300);
    expect(router.getPathname()).toBe("/");
    expect(isSelected(sessions.contentTypes.sessions)).toBe(true);
    expect(await database.getAllAsync("SELECT activity_definitions.id, movements.name FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id")).toEqual([{ id: definition.id, name: "Fentes lentes" }]);
  }, 20000);

  it("PRE4-4.1/AC6 AC7 AC8 — CS : même Éditeur et même Feuille ; route sans paramètre ; Terminer ne modifie que le Brouillon de Composition", async () => {
    const definition = await savedDefinition();
    await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();
    const before = await dump();

    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByLabelText(activities.addToSession.newActivity));
    await settle();
    // Le contexte est porté par la route : ni `catalogueDefinitionId` ni `exerciseId` (création en Séance).
    expect(editorContext(router.getSearchParams())).toEqual({});
    expect(editorSpy).toHaveBeenCalled();
    openAndCloseSheet();
    expect(sheetSpy).toHaveBeenCalled();

    await fillNewExercise("Pompes");
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    await settle();
    expect(router.getPathname()).toBe("/composition");
    expect(screen.getByText("Pompes")).toBeTruthy();
    expect(await dump()).toEqual(before);

    await continueAndSave();
    await waitFor(() => expect(router.getPathname()).toBe("/"));
    const names = (await database.getAllAsync<{ name: string }>(`SELECT name FROM ${OCCURRENCES} ORDER BY position`)).map((row) => row.name);
    expect(names).toContain("Pompes");
    expect(await database.getAllAsync("SELECT movements.name FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id")).toEqual([{ name: "Fentes" }]);
  }, 30000);

  it("PRE4-4.1/AC6 AC7 AC8 — MS : même Éditeur et même Feuille ; route exerciseId=<Copie> ; Terminer ne modifie que le Brouillon, rien n'est écrit avant Continuer", async () => {
    const definition = await savedDefinition();
    const { copy } = await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();
    const before = await dump();

    fireEvent.press(screen.getByTestId(`composition-exercise-row-${copy.id}`));
    await settle();
    expect(editorContext(router.getSearchParams())).toEqual({ exerciseId: copy.id });
    expect(editorSpy).toHaveBeenCalled();
    openAndCloseSheet();
    expect(sheetSpy).toHaveBeenCalled();

    // PRE-7 A2.2 (MFN-09) : nom verrouillé, paramètre modifié (2 → 1 série).
    editCopyParameters();
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    await settle();
    expect(router.getPathname()).toBe("/composition");
    expect(screen.getByText("Fentes")).toBeTruthy();
    expect(await dump()).toEqual(before);

    await continueAndSave();
    await waitFor(() => expect(router.getPathname()).toBe("/"));
    expect(await database.getAllAsync(`SELECT id, name FROM ${OCCURRENCES}`)).toEqual([{ id: copy.id, name: "Fentes" }]);
    expect(await copySeriesCount()).toBe(1);
  }, 30000);
});

describe("PRE4-4.1/AC9 — Copie isolée, dans les deux sens", () => {
  it("PRE4-4.1/AC9 — modifier la Copie (MS) puis Continuer laisse la Définition intacte ; modifier la Définition (MC) laisse la Copie intacte ; aucun doublon au Catalogue", async () => {
    const definition = await savedDefinition();
    const { copy } = await savedSessionWithCopy(definition);
    const definitionRow = async () => database.getAllAsync("SELECT * FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id");
    const copyRow = async () => database.getAllAsync("SELECT * FROM activities");
    const definitionBefore = await definitionRow();

    const router = renderApp();
    await openSessionFromCatalogue();
    fireEvent.press(screen.getByTestId(`composition-exercise-row-${copy.id}`));
    await settle();
    // PRE-7 A2.2 (MFN-09) : contenu de la Copie verrouillé ; son paramètre est modifié.
    editCopyParameters();
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    await settle();
    await continueAndSave();
    await waitFor(() => expect(router.getPathname()).toBe("/"));
    expect(await definitionRow()).toEqual(definitionBefore);
    const copyAfterMs = await copyRow();
    expect(await database.getAllAsync(`SELECT name FROM ${OCCURRENCES}`)).toEqual([{ name: "Fentes" }]);
    expect(await copySeriesCount()).toBe(1);

    await openExercisesSegment();
    expect(await database.getAllAsync("SELECT id FROM activity_definitions")).toHaveLength(1);
    await openDefinitionEditor(definition.id);
    fireEvent.changeText(await screen.findByDisplayValue("Fentes"), "Fentes du Catalogue");
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(300);
    expect(await database.getAllAsync("SELECT movements.name FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id")).toEqual([{ name: "Fentes du Catalogue" }]);
    // Paramètres de la Copie intacts ; PRE-7 (R-3, D-445 C05) : son nom est celui, corrigé, du Mouvement.
    expect(await copyRow()).toEqual(copyAfterMs);
    expect(await database.getAllAsync(`SELECT name FROM ${OCCURRENCES}`)).toEqual([{ name: "Fentes du Catalogue" }]);
    expect(await database.getAllAsync("SELECT id FROM activity_definitions")).toHaveLength(1);
  }, 30000);
});

/**
 * Appui bref sur un contrôle à pas (`pressIn` puis `pressOut`, comme les tests de la Feuille).
 * Story 3.3 : le champ hors tableau est ouvert au besoin (± à l’appui).
 */
const tap = tapExecutionSheetStep;

/** Action accessible de la poignée d'une ligne du tableau (même déplacement que le glisser). */
function moveRow(row: number, actionName: "moveUp" | "moveDown") {
  fireEvent(screen.getByTestId(`execution-sheet-table-row-${row}-handle`), "accessibilityAction", { nativeEvent: { actionName } });
}

/**
 * Contenu typé relu par l'Éditeur à son dernier rendu : les props transmises
 * à `ActivityEditorForm` (nom, description, Zones, Médias dans leur ordre,
 * Paramètres d'exécution typés) et la Catégorie résolue.
 */
function editorContent() {
  const props = editorSpy.mock.calls.at(-1)![0] as {
    value: {
      name: string;
      instructionSteps: readonly string[];
      bodyZoneIds: readonly string[];
      media: readonly { assetId: string }[];
      executionParameters: unknown;
    };
    category: { name: string } | null;
  };
  return {
    name: props.value.name,
    // PRE-5 story 3.1 : la Description relue en étapes (décodage à l'ouverture).
    instructionSteps: [...props.value.instructionSteps],
    category: props.category?.name ?? null,
    // Ensemble de Zones : l’Éditeur les relit dans l’ordre du référentiel, quel que soit l’ordre de sélection.
    bodyZoneIds: [...props.value.bodyZoneIds].sort(),
    media: props.value.media.map((item) => item.assetId),
    executionParameters: props.value.executionParameters,
  };
}

/**
 * AC10 : bascules de la Feuille sur l'Exercice à Cibles mixtes — Mode
 * Répétitions puis retour en Durée, déplacement d'une Série puis retour,
 * N = 3 → 1 → 3 — puis ✓. Le contenu relu doit rester identique.
 */
function toggleMixedSheetAndValidate() {
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  chooseExecutionMode("Répétitions");
  chooseExecutionMode("Durée");
  moveRow(3, "moveUp");
  moveRow(2, "moveDown");
  tap("execution-sheet-series-decrement");
  tap("execution-sheet-series-decrement");
  expect(screen.getByTestId("execution-sheet-series-value").props.children).toBe("1 série");
  tap("execution-sheet-series-increment");
  tap("execution-sheet-series-increment");
  fireEvent.press(screen.getByTestId("execution-sheet-validate"));
  expect(screen.queryByTestId("execution-sheet")).toBeNull();
}

/** Bascule de Mode puis retour, sur un nouvel Exercice (Cible unique), puis ✓. */
function toggleModeAndValidate() {
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  chooseExecutionMode("Répétitions");
  chooseExecutionMode("Durée");
  fireEvent.press(screen.getByTestId("execution-sheet-validate"));
  expect(screen.queryByTestId("execution-sheet")).toBeNull();
}

/** Ajoute la deuxième Zone « cuisses » et une description au nouvel Exercice. */
async function completeNewExercise(description: string) {
  fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
  fireEvent.press(await screen.findByTestId("body-zone-selector-tag-cuisses"));
  await act(async () => {
    fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
  });
  fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), description);
}

/** Textes et libellés accessibles rendus sous une instance (Éditeur ou Feuille). */
function renderedWords(root: ReturnType<typeof screen.UNSAFE_getByType>): string[] {
  const found: string[] = [];
  const visit = (node: ReturnType<typeof screen.UNSAFE_getByType> | string) => {
    if (typeof node === "string") {
      found.push(node);
      return;
    }
    for (const key of ["accessibilityLabel", "accessibilityHint", "placeholder", "value", "title"]) {
      const prop: unknown = node.props[key];
      if (typeof prop === "string") {
        found.push(prop);
      }
    }
    for (const child of node.children) {
      visit(child);
    }
  };
  visit(root);
  return found;
}

describe("PRE4-4.1/AC10 — relecture à l'identique après bascules, dans les quatre parcours", () => {
  it("PRE4-4.1/AC10 — MC : Exercice enregistré à Cibles mixtes ; Mode aller-retour, déplacement, N 3 → 1 → 3, ✓, Terminer, réouverture : contenu identique ; la Copie reste indépendante", async () => {
    const definition = await savedDefinition(MIXED_PARAMETERS);
    await savedSessionWithCopy(definition);
    const copyBefore = await database.getAllAsync("SELECT * FROM activities");
    const router = renderApp();
    await openExercisesSegment();

    await openDefinitionEditor(definition.id);
    await screen.findByDisplayValue("Fentes");
    const opened = editorContent();
    expect(opened).toEqual({
      name: "Fentes",
      instructionSteps: ["Genou au-dessus de la cheville."],
      category: await savedCategoryName(),
      bodyZoneIds: ["cuisses", "dos"],
      media: ["p1", "p2"],
      executionParameters: MIXED_PARAMETERS,
    });

    toggleMixedSheetAndValidate();
    expect(editorContent()).toEqual(opened);
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(300);
    expect(router.getPathname()).toBe("/");

    editorSpy.mockClear();
    await openDefinitionEditor(definition.id);
    await screen.findByDisplayValue("Fentes");
    await settle();
    expect(editorContent()).toEqual(opened);
    expect(await database.getAllAsync("SELECT * FROM activities")).toEqual(copyBefore);
  }, 30000);

  it("PRE4-4.1/AC10 — MS : Copie enregistrée à Cibles mixtes ; bascules, ✓, Terminer, Continuer, réouverture : contenu identique ; la Définition reste indépendante", async () => {
    const definition = await savedDefinition(MIXED_PARAMETERS);
    const { copy } = await savedSessionWithCopy(definition);
    const definitionBefore = await database.getAllAsync("SELECT * FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id");
    const router = renderApp();
    await openSessionFromCatalogue();

    fireEvent.press(screen.getByTestId(`composition-exercise-row-${copy.id}`));
    await settle();
    const opened = editorContent();
    expect(opened).toEqual({
      name: "Fentes",
      instructionSteps: ["Genou au-dessus de la cheville."],
      category: await savedCategoryName(),
      bodyZoneIds: ["cuisses", "dos"],
      media: ["p1", "p2"],
      executionParameters: MIXED_PARAMETERS,
    });

    toggleMixedSheetAndValidate();
    expect(editorContent()).toEqual(opened);
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    await settle();
    await continueAndSave();
    await waitFor(() => expect(router.getPathname()).toBe("/"));

    editorSpy.mockClear();
    await openSessionFromCatalogue();
    fireEvent.press(screen.getByTestId(`composition-exercise-row-${copy.id}`));
    await settle();
    expect(editorContent()).toEqual(opened);
    expect(await database.getAllAsync("SELECT * FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id")).toEqual(definitionBefore);
  }, 30000);

  it("PRE4-4.1/AC10 — CC : nouvel Exercice (deux Zones, description), Mode aller-retour, ✓, Terminer, réouverture au Catalogue : contenu identique", async () => {
    const router = renderApp();
    await openExercisesSegment();
    await openDefinitionEditor("new");
    await settle();

    await fillNewExercise("Gainage");
    await completeNewExercise("Dos droit.");
    toggleModeAndValidate();
    const entered = editorContent();
    expect(entered).toMatchObject({ name: "Gainage", instructionSteps: ["Dos droit."], bodyZoneIds: expect.arrayContaining(["dos", "cuisses"]) });
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(300);
    expect(router.getPathname()).toBe("/");

    const [created] = await database.getAllAsync<{ id: string }>("SELECT id FROM activity_definitions");
    editorSpy.mockClear();
    await openDefinitionEditor(created!.id);
    await screen.findByDisplayValue("Gainage");
    await settle();
    expect(editorContent()).toEqual(entered);
  }, 30000);

  it("PRE4-4.1/AC10 — CS : nouvel Exercice en Séance, Mode aller-retour, ✓, Terminer, Continuer, réouverture : contenu identique", async () => {
    const definition = await savedDefinition(MIXED_PARAMETERS);
    await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();

    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByLabelText(activities.addToSession.newActivity));
    await settle();
    await fillNewExercise("Gainage");
    await completeNewExercise("Dos droit.");
    toggleModeAndValidate();
    const entered = editorContent();
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    await settle();
    await continueAndSave();
    await waitFor(() => expect(router.getPathname()).toBe("/"));

    const [created] = await database.getAllAsync<{ id: string }>(`SELECT id FROM ${OCCURRENCES} WHERE name = 'Gainage'`);
    editorSpy.mockClear();
    await openSessionFromCatalogue();
    fireEvent.press(screen.getByTestId(`composition-exercise-row-${created!.id}`));
    await settle();
    expect(editorContent()).toEqual(entered);
    expect(await database.getAllAsync("SELECT movements.name FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id")).toEqual([{ name: "Fentes" }]);
  }, 30000);
});

/**
 * Report de 4.1 (AC10), rejoué dans la story 4.2 : les Cibles à l'échec sont
 * SAISIES dans la Feuille (D-434 : au clavier numérique de la cellule, « À l'échec »
 * de la barre du clavier), dans les quatre parcours, puis relues à l'identique après
 * les bascules (Mode aller-retour, déplacement, N 3 → 1 → 3).
 */
const hidden = { includeHiddenElements: true } as const;

/** D-434 : saisit la Cible d'une ligne au clavier de sa cellule (durée en secondes), ou « À l'échec » par la barre. */
function enterRowTarget(row: number, target: number | "FAILURE") {
  enterExecutionSheetCell(`execution-sheet-table-row-${row}-target`, target === "FAILURE" ? "FAILURE" : durationKeys(target));
  expect(screen.queryByTestId("number-wheel-column")).toBeNull();
}

/** D-434 : saisit la Pause d'une ligne au clavier de sa cellule (« MMSS »). */
function enterRowPause(row: number, seconds: number) {
  enterExecutionSheetCell(`execution-sheet-table-row-${row}-pause`, durationKeys(seconds));
  expect(String(screen.getByTestId(`execution-sheet-table-row-${row}-pause-value`, hidden).props.children)).toBe(`${seconds} s`);
}

/** Bascules de AC10 dans la Feuille déjà ouverte, puis ✓. */
function toggleOpenSheetAndValidate() {
  chooseExecutionMode("Répétitions");
  chooseExecutionMode("Durée");
  moveRow(3, "moveUp");
  moveRow(2, "moveDown");
  tap("execution-sheet-series-decrement");
  tap("execution-sheet-series-decrement");
  expect(screen.getByTestId("execution-sheet-series-value").props.children).toBe("1 série");
  tap("execution-sheet-series-increment");
  tap("execution-sheet-series-increment");
  fireEvent.press(screen.getByTestId("execution-sheet-validate"));
  expect(screen.queryByTestId("execution-sheet")).toBeNull();
}

/** MC, MS : Exercice enregistré à Cibles numériques (30 s, 45 s, 60 s) ; la troisième passe à l'échec dans la Feuille. */
const NUMERIC_PARAMETERS = variableParameters({
  mode: "DURATION",
  rows: [
    [30, 10],
    [45, 20],
    [60, 30],
  ],
  sideMode: "RIGHT_LEFT",
  sideRecoverySeconds: 5,
  cadenceBeepIntervalSeconds: 2,
  countdownSeconds: 10,
  endSeconds: 5,
});

function enterFailureOnSavedExercise() {
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  enterRowTarget(3, "FAILURE");
  toggleOpenSheetAndValidate();
  // Saisie dans la Feuille : exactement les Cibles mixtes de AC10.
  expect(editorContent().executionParameters).toEqual(MIXED_PARAMETERS);
}

/** Secondes d'un texte affiché (« 1 min 30 s », « 45 s ») ; tout autre texte (« Aucun ») vaut 0. */
function shownSeconds(text: string): number {
  const minutes = /(\d+) min/u.exec(text);
  const seconds = /(\d+) s/u.exec(text);
  return (minutes ? Number(minutes[1]) * 60 : 0) + (seconds ? Number(seconds[1]) : 0);
}

/**
 * Amène un champ à pas de la Feuille (`id`, ± `${id}-increment` / `-decrement`,
 * valeur `${id}-value`) au texte attendu, par appuis dans le sens de la cible.
 * Lève si la valeur n'est pas atteinte.
 */
function stepTo(id: string, expected: string) {
  const read = () => String(screen.getByTestId(`${id}-value`, hidden).props.children);
  const target = shownSeconds(expected);
  for (let guard = 0; guard < 60 && read() !== expected; guard += 1) {
    const before = read();
    tap(`${id}-${shownSeconds(before) < target ? "increment" : "decrement"}`);
    if (read() === before) break;
  }
  expect(read()).toBe(expected);
}

/**
 * CC, CS : nouvel Exercice — `variables`, N = 3, Cibles 30 s, 45 s, à l'échec,
 * Pauses 10, 20, 30 s, bilatéral (Pause au changement de côté 5 s), Bip 2 s,
 * Compte à rebours 10 s, Fin 5 s — tout saisi dans la Feuille.
 *
 * PRE-5 story 2.5 (AC4, D-409, RM-218) : dans un Exercice ouvert depuis une Séance (CS),
 * la Feuille ne présente ni Compte à rebours ni Fin ; leurs valeurs (celles du Profil à la
 * création) sont conservées telles quelles. En Catalogue (CC), ils sont dépliés sous la Durée
 * de l'exercice avant d'être réglés.
 */
function enterMixedTargetsOnNewExercise(context: "catalogue" | "session" = "catalogue") {
  const initial = editorContent().executionParameters as ExecutionParameters;
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  expect((sheetSpy.mock.calls.at(-1)![0] as { exerciseSignals?: string }).exerciseSignals ?? "present").toBe(
    context === "session" ? "absent" : "present",
  );
  for (let guard = 0; guard < 5 && screen.getByTestId("execution-sheet-series-value").props.children !== "3 séries"; guard += 1) {
    tap("execution-sheet-series-increment");
  }
  expect(screen.getByTestId("execution-sheet-series-value").props.children).toBe("3 séries");
  chooseExecutionRegime("variables");
  enterRowTarget(1, 30);
  enterRowTarget(2, 45);
  enterRowTarget(3, "FAILURE");
  enterRowPause(1, 10);
  enterRowPause(2, 20);
  enterRowPause(3, 30);
  chooseExecutionSide("Avec");
  stepTo("execution-sheet-side-recovery", "5 s");
  // PRE-5 story 2.5 (AC3) : le ± de la Cadence est révélé par l'option Autre.
  openExecutionSheetField("execution-sheet-beep");
  stepTo("execution-sheet-beep", "2 s");
  showExerciseDurationSignals();
  if (context === "catalogue") {
    stepTo("execution-sheet-countdown", "10 s");
    stepTo("execution-sheet-end", "5 s");
  } else {
    expect(screen.queryByTestId("execution-sheet-row-countdown", hidden)).toBeNull();
    expect(screen.queryByTestId("execution-sheet-row-end", hidden)).toBeNull();
  }
  fireEvent.press(screen.getByTestId("execution-sheet-body-outside"));
  toggleOpenSheetAndValidate();
  const entered = editorContent();
  // Exactement les Paramètres d'exécution de AC10, comme en MC et MS (CS : Compte à rebours et
  // Fin de la création conservés).
  expect(entered.executionParameters).toEqual(
    context === "catalogue"
      ? MIXED_PARAMETERS
      : { ...MIXED_PARAMETERS, countdownSeconds: initial.countdownSeconds, endSeconds: initial.endSeconds },
  );
  expect((entered.executionParameters as ExecutionParameters).series).toMatchObject({
    rows: [{ target: toTarget(30) }, { target: toTarget(45) }, { target: toTarget("FAILURE") }],
  });
  return entered;
}

describe("PRE4-4.1/AC10 — report : Cibles à l'échec saisies dans la Feuille, quatre parcours (story 4.2)", () => {
  it("PRE4-4.1/AC10 — MC : Cible à l'échec saisie par la roue de la cellule ; bascules, ✓, Terminer, réouverture : relu à l'identique ; Copie indépendante", async () => {
    const definition = await savedDefinition(NUMERIC_PARAMETERS);
    await savedSessionWithCopy(definition);
    const copyBefore = await database.getAllAsync("SELECT * FROM activities");
    const router = renderApp();
    await openExercisesSegment();
    await openDefinitionEditor(definition.id);
    await screen.findByDisplayValue("Fentes");

    enterFailureOnSavedExercise();
    const entered = editorContent();
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(300);
    expect(router.getPathname()).toBe("/");

    editorSpy.mockClear();
    await openDefinitionEditor(definition.id);
    await screen.findByDisplayValue("Fentes");
    await settle();
    expect(editorContent()).toEqual(entered);
    expect(await database.getAllAsync("SELECT * FROM activities")).toEqual(copyBefore);
  }, 30000);

  it("PRE4-4.1/AC10 — MS : Cible à l'échec saisie dans la Feuille de la Copie ; Terminer, Continuer, réouverture : relu à l'identique ; Définition indépendante", async () => {
    const definition = await savedDefinition(NUMERIC_PARAMETERS);
    const { copy } = await savedSessionWithCopy(definition);
    const definitionBefore = await database.getAllAsync("SELECT * FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id");
    const router = renderApp();
    await openSessionFromCatalogue();
    fireEvent.press(screen.getByTestId(`composition-exercise-row-${copy.id}`));
    await settle();

    enterFailureOnSavedExercise();
    const entered = editorContent();
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    await settle();
    await continueAndSave();
    await waitFor(() => expect(router.getPathname()).toBe("/"));

    editorSpy.mockClear();
    await openSessionFromCatalogue();
    fireEvent.press(screen.getByTestId(`composition-exercise-row-${copy.id}`));
    await settle();
    expect(editorContent()).toEqual(entered);
    expect(await database.getAllAsync("SELECT * FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id")).toEqual(definitionBefore);
  }, 30000);

  it("PRE4-4.1/AC10 — CC : Cibles mixtes (30 s, 45 s, à l'échec) saisies dans la Feuille d'un nouvel Exercice ; Terminer, réouverture : relu à l'identique", async () => {
    const router = renderApp();
    await openExercisesSegment();
    await openDefinitionEditor("new");
    await settle();
    await fillNewExercise("Gainage");
    await completeNewExercise("Dos droit.");
    const entered = enterMixedTargetsOnNewExercise();
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(300);
    expect(router.getPathname()).toBe("/");

    const [created] = await database.getAllAsync<{ id: string }>("SELECT id FROM activity_definitions");
    editorSpy.mockClear();
    await openDefinitionEditor(created!.id);
    await screen.findByDisplayValue("Gainage");
    await settle();
    expect(editorContent()).toEqual(entered);
  }, 60000);

  it("PRE4-4.1/AC10 — CS : Cibles mixtes saisies dans la Feuille d'un nouvel Exercice en Séance ; Terminer, Continuer, réouverture : relu à l'identique", async () => {
    const definition = await savedDefinition(MIXED_PARAMETERS);
    await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();
    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByLabelText(activities.addToSession.newActivity));
    await settle();
    await fillNewExercise("Gainage");
    await completeNewExercise("Dos droit.");
    const entered = enterMixedTargetsOnNewExercise("session");
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    await settle();
    await continueAndSave();
    await waitFor(() => expect(router.getPathname()).toBe("/"));

    const [created] = await database.getAllAsync<{ id: string }>(`SELECT id FROM ${OCCURRENCES} WHERE name = 'Gainage'`);
    editorSpy.mockClear();
    await openSessionFromCatalogue();
    fireEvent.press(screen.getByTestId(`composition-exercise-row-${created!.id}`));
    await settle();
    expect(editorContent()).toEqual(entered);
    expect(await database.getAllAsync("SELECT movements.name FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id")).toEqual([{ name: "Fentes" }]);
  }, 60000);
});

describe("PRE4-4.2/AC10 — enregistrement atomique et erreur d'écriture (motif FailingDatabase)", () => {
  it("PRE4-4.2/AC10 — CC : échec injecté au milieu de la transaction ; rien n'est écrit, Brouillon conservé, message du code de départ ; appuis répétés : une seule opération ; réessai : un seul Exercice", async () => {
    const failing = failOnWrite(database, /INSERT INTO movement_body_zones/u);
    const router = renderApp({ definitionDatabase: failing.database });
    await openExercisesSegment();
    await openDefinitionEditor("new");
    await settle();
    await fillNewExercise("Gainage");
    fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "Dos droit.");
    const before = await dump();

    await act(async () => {
      for (let tapCount = 0; tapCount < 3; tapCount += 1) {
        fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
      }
    });
    await settle();
    // La Définition avait été insérée avant l'échec : son annulation prouve l'atomicité.
    expect(failing.state.armed).toBe(false);
    expect(failing.state.writesBeforeFailure).toBeGreaterThanOrEqual(1);
    expect(await dump()).toEqual(before);
    expect(router.getPathname()).toBe("/exercise");
    expect(screen.getByText(activities.editor.saveError)).toBeTruthy();
    expect(screen.getByDisplayValue("Gainage")).toBeTruthy();
    expect(screen.getByDisplayValue("Dos droit.")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(300);
    expect(router.getPathname()).toBe("/");
    expect(await database.getAllAsync("SELECT movements.name, movements.description FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id")).toEqual([
      { name: "Gainage", description: "Dos droit." },
    ]);
    expect(await database.getAllAsync("SELECT body_zone_id FROM movement_body_zones")).toEqual([{ body_zone_id: "dos" }]);
  }, 30000);
});

describe("PRE4-4.2/AC10 — Séance : appuis répétés", () => {
  it("PRE4-4.2/AC10 — CS : appuis répétés sur Terminer, puis sur Continuer et Enregistrer : une seule Copie enregistrée", async () => {
    const definition = await savedDefinition();
    await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();
    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByLabelText(activities.addToSession.newActivity));
    await settle();
    await fillNewExercise("Gainage");
    await act(async () => {
      for (let tapCount = 0; tapCount < 3; tapCount += 1) {
        fireEvent.press(screen.getByTestId("exercise-finish-action"));
      }
    });
    await settle();
    expect(router.getPathname()).toBe("/composition");
    expect(screen.getAllByText("Gainage")).toHaveLength(1);
    // Q54 : double appui sur `Continuer` (Composition, PRE-6 story 2.1) — un seul enregistrement.
    await act(async () => {
      fireEvent.press(screen.getByLabelText(composition.saveAction));
      fireEvent.press(screen.getByLabelText(composition.saveAction));
    });
    await settle();
    await waitFor(() => expect(router.getPathname()).toBe("/"));
    expect(await database.getAllAsync(`SELECT name FROM ${OCCURRENCES} WHERE name = 'Gainage'`)).toEqual([{ name: "Gainage" }]);
    expect(await database.getAllAsync("SELECT movements.name FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id")).toEqual([{ name: "Fentes" }]);
  }, 30000);
});

describe("PRE4-4.2/AC12 — abandon avec confirmation, navigation réelle", () => {
  it("PRE4-4.2/AC12 — CS : dialogue de création ; Annuler conserve ; Confirmer revient à Composition sans ajouter d'Exercice", async () => {
    const definition = await savedDefinition();
    await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();
    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByLabelText(activities.addToSession.newActivity));
    await settle();
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Brouillon");
    fireEvent.press(screen.getByLabelText(exercise.backAccessibilityLabel));
    expect(screen.getByText(exercise.exitConfirmModal.createTitle)).toBeTruthy();
    expect(screen.getByText(exercise.exitConfirmModal.createMessage)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(exercise.exitConfirmModal.continueEditing));
    await settle();
    expect(router.getPathname()).toBe("/exercise");
    expect(screen.getByDisplayValue("Brouillon")).toBeTruthy();
    fireEvent.press(screen.getByLabelText(exercise.backAccessibilityLabel));
    fireEvent.press(screen.getByLabelText(exercise.exitConfirmModal.abandon));
    await settle(300);
    expect(router.getPathname()).toBe("/composition");
    expect(screen.queryByText("Brouillon")).toBeNull();
  }, 30000);

  it("PRE4-4.2/AC12 — MC : sans modification, sortie immédiate ; avec modification, dialogue de modification ; Confirmer quitte sans enregistrer", async () => {
    const definition = await savedDefinition();
    const router = renderApp();
    await openExercisesSegment();
    await openDefinitionEditor(definition.id);
    await screen.findByDisplayValue("Fentes");
    fireEvent.press(screen.getByLabelText(activities.editor.backAccessibilityLabel));
    await settle(300);
    expect(router.getPathname()).toBe("/");
    expect(screen.queryByText(exercise.exitConfirmModal.title)).toBeNull();

    const before = await dump();
    await openDefinitionEditor(definition.id);
    await screen.findByDisplayValue("Fentes");
    fireEvent.changeText(screen.getByDisplayValue("Fentes"), "Fentes modifiées");
    fireEvent.press(screen.getByLabelText(activities.editor.backAccessibilityLabel));
    expect(screen.getByText(exercise.exitConfirmModal.title)).toBeTruthy();
    expect(screen.getByText(exercise.exitConfirmModal.message)).toBeTruthy();
    expect(screen.queryByText(exercise.exitConfirmModal.createTitle)).toBeNull();
    fireEvent.press(screen.getByLabelText(exercise.exitConfirmModal.abandon));
    await settle(300);
    expect(router.getPathname()).toBe("/");
    expect(await dump()).toEqual(before);
  }, 30000);

  it("PRE4-4.2/AC12 — CC : dialogue de création ; Annuler conserve le formulaire ; Confirmer quitte sans enregistrer", async () => {
    const router = renderApp();
    await openExercisesSegment();
    const before = await dump();
    await openDefinitionEditor("new");
    await settle();
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Brouillon");
    fireEvent.press(screen.getByLabelText(activities.editor.backAccessibilityLabel));
    expect(screen.getByText(exercise.exitConfirmModal.createTitle)).toBeTruthy();
    expect(screen.getByText(exercise.exitConfirmModal.createMessage)).toBeTruthy();
    expect(screen.queryByText(exercise.exitConfirmModal.title)).toBeNull();

    fireEvent.press(screen.getByLabelText(exercise.exitConfirmModal.continueEditing));
    await settle();
    expect(router.getPathname()).toBe("/exercise");
    expect(screen.queryByText(exercise.exitConfirmModal.createTitle)).toBeNull();
    expect(screen.getByDisplayValue("Brouillon")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(activities.editor.backAccessibilityLabel));
    fireEvent.press(screen.getByLabelText(exercise.exitConfirmModal.abandon));
    await settle(300);
    expect(router.getPathname()).toBe("/");
    expect(await dump()).toEqual(before);
  }, 30000);

  it("PRE4-4.2/AC12 — MS : dialogue de modification ; sans modification, sortie immédiate", async () => {
    const definition = await savedDefinition();
    const { copy } = await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();
    fireEvent.press(screen.getByTestId(`composition-exercise-row-${copy.id}`));
    await settle();
    fireEvent.press(screen.getByLabelText(exercise.backAccessibilityLabel));
    await settle(300);
    expect(router.getPathname()).toBe("/composition");
    expect(screen.queryByText(exercise.exitConfirmModal.title)).toBeNull();

    fireEvent.press(screen.getByTestId(`composition-exercise-row-${copy.id}`));
    await settle();
    // PRE-7 A2.2 (MFN-09) : la modification porte sur un paramètre, le nom étant verrouillé.
    editCopyParameters();
    fireEvent.press(screen.getByLabelText(exercise.backAccessibilityLabel));
    expect(screen.getByText(exercise.exitConfirmModal.title)).toBeTruthy();
    expect(screen.getByText(exercise.exitConfirmModal.message)).toBeTruthy();
    expect(screen.queryByText(exercise.exitConfirmModal.createTitle)).toBeNull();
    fireEvent.press(screen.getByLabelText(exercise.exitConfirmModal.abandon));
    await settle(300);
    expect(router.getPathname()).toBe("/composition");
    expect(screen.getByText("Fentes")).toBeTruthy();
  }, 30000);
});

describe("PRE4-4.1/AC11 — aucune Récupération automatique", () => {
  it("PRE4-4.1/AC11 — CC, CS et Copie insérée : aucune Récupération enregistrée ; Éditeur et Feuille sans réglage de Récupération ; Pause entre les côtés seulement en bilatéral", async () => {
    const definition = await savedDefinition();
    const router = renderApp();

    // CC : ni l'Éditeur ni la Feuille (tout leur texte) ne portent de réglage de
    // Récupération ; en unilatéral, pas de Pause entre les côtés.
    await openExercisesSegment();
    await openDefinitionEditor("new");
    await settle();
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    chooseExecutionMode("Durée");
    expect(screen.queryByTestId("execution-sheet-row-side-recovery")).toBeNull();
    expect(renderedWords(screen.UNSAFE_getByType(ExecutionParametersSheet as never)).filter((word) => /récupération/i.test(word))).toEqual([]);
    expect(renderedWords(screen.UNSAFE_getByType(ActivityEditorForm as never)).filter((word) => /récupération/i.test(word))).toEqual([]);
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    await settle();
    await fillNewExercise("Gainage");
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(300);
    expect(router.getPathname()).toBe("/");
    expect(await database.getAllAsync("SELECT movements.name FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id ORDER BY movements.name")).toEqual([{ name: "Fentes" }, { name: "Gainage" }]);
    // La Définition n'a aucun champ de Récupération. PRE-7 (A1.2) : ni colonne scalaire, la Pause
    // entre les côtés est portée par les paramètres (forme Catalogue v4), le contenu par le Mouvement.
    for (const table of ["activity_definitions", "movements"]) {
      const columns = await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
      expect(columns.map((column) => column.name).filter((name) => /recovery/.test(name))).toEqual([]);
    }

    // CS + Copie insérée par « Un exercice existant ».
    fireEvent.press(screen.getByLabelText(sessions.contentTypes.sessions));
    await settle(300);
    // PRE-8 (E.4) : Créer ouvre directement la Composition sur le segment Séances.
    fireEvent.press(screen.getByLabelText(sessions.createAction));
    await settle();
    fireEvent.changeText(screen.getByLabelText(composition.name), "Gainage du soir");
    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByLabelText(activities.addToSession.newActivity));
    await settle();
    await fillNewExercise("Planche");
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    await settle();
    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByLabelText(activities.addToSession.existingActivity));
    await settle();
    fireEvent.press(await screen.findByTestId(`activity-selection-row-${definition.id}`));
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-selection-add"));
    });
    await settle();
    expect(router.getPathname()).toBe("/composition");

    await continueAndSave();
    await waitFor(() => expect(router.getPathname()).toBe("/"));
    const saved = await database.getAllAsync<{ name: string; type: string; post_activity_recovery_seconds: number }>(
      `SELECT name, type, post_activity_recovery_seconds FROM ${OCCURRENCES} ORDER BY position`,
    );
    expect(saved.map((row) => row.name).sort()).toEqual(["Fentes", "Planche"]);
    expect(saved.every((row) => row.type === "EXERCISE" && row.post_activity_recovery_seconds === 0)).toBe(true);
  }, 40000);

  it("PRE4-4.1/AC11 — Pause entre les côtés visible seulement en bilatéral (Copie bilatérale en Séance)", async () => {
    const definition = await savedDefinition(MIXED_PARAMETERS);
    const { copy } = await savedSessionWithCopy(definition);
    renderApp();
    await openSessionFromCatalogue();
    fireEvent.press(screen.getByTestId(`composition-exercise-row-${copy.id}`));
    await settle();
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    expect(screen.getByTestId("execution-sheet-row-side-recovery")).toBeTruthy();
    const sheetWords = renderedWords(screen.UNSAFE_getByType(ExecutionParametersSheet as never));
    expect(sheetWords.filter((word) => /récupération/i.test(word))).toEqual([]);
  }, 30000);
});

describe("PRE4-4.1/AC12 — aucun libellé « Circuit » ni « Tour » dans l'Éditeur ni dans la Feuille", () => {
  /** Ouvre la Feuille, vérifie l'absence des deux mots dans l'Éditeur et la Feuille, puis la referme. */
  function expectNoCircuitOrTour() {
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    const forbidden = /(circuits?|tours?)/i;
    const editorWords = renderedWords(screen.UNSAFE_getByType(ActivityEditorForm as never));
    const sheetWords = renderedWords(screen.UNSAFE_getByType(ExecutionParametersSheet as never));
    expect(sheetWords.length).toBeGreaterThan(10);
    expect(editorWords.filter((word) => forbidden.test(word))).toEqual([]);
    expect(sheetWords.filter((word) => forbidden.test(word))).toEqual([]);
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
  }

  it("PRE4-4.1/AC12 — MC puis CC : ni l'Éditeur ni la Feuille ne rendent « Circuit » ou « Tour »", async () => {
    const definition = await savedDefinition(MIXED_PARAMETERS);
    renderApp();
    await openExercisesSegment();
    await openDefinitionEditor(definition.id);
    await screen.findByDisplayValue("Fentes");
    expectNoCircuitOrTour();
    fireEvent.press(screen.getByLabelText(activities.editor.backAccessibilityLabel));
    await settle(300);

    await openDefinitionEditor("new");
    await settle();
    expectNoCircuitOrTour();
  }, 30000);

  it("PRE4-4.1/AC12 — MS puis CS : ni l'Éditeur ni la Feuille ne rendent « Circuit » ou « Tour »", async () => {
    const definition = await savedDefinition(MIXED_PARAMETERS);
    const { copy } = await savedSessionWithCopy(definition);
    renderApp();
    await openSessionFromCatalogue();
    fireEvent.press(screen.getByTestId(`composition-exercise-row-${copy.id}`));
    await settle();
    expectNoCircuitOrTour();
    fireEvent.press(screen.getByLabelText(exercise.backAccessibilityLabel));
    await settle(300);

    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByLabelText(activities.addToSession.newActivity));
    await settle();
    expectNoCircuitOrTour();
  }, 30000);
});

describe("PRE4-4.1/AC13 — source supprimée pendant l'édition (Copie en Séance)", () => {
  // En MS, `Terminer` n'écrit que le Brouillon de Composition (P8) : l'écriture,
  // et donc l'erreur, n'a lieu qu'à l'enregistrement de la Séance (`Continuer`,
  // puis `Enregistrer` sur l'écran Catégories de la séance, qui l'effectue).
  async function editDeletedCopy() {
    const definition = await savedDefinition();
    const { copy } = await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();
    fireEvent.press(screen.getByTestId(`composition-exercise-row-${copy.id}`));
    await settle();
    // PRE-7 A2.2 (MFN-09) : la modification porte sur un paramètre, le nom étant verrouillé.
    editCopyParameters();

    await database.runAsync("DELETE FROM activities WHERE id = ?", [copy.id]);
    const afterDeletion = await dump();
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    await settle();
    return { router, afterDeletion };
  }

  it("PRE4-4.1/AC13 — Copie supprimée pendant l'édition : Terminer réussit dans le seul Brouillon de Composition, sans écriture ni contenu de démonstration", async () => {
    const { router, afterDeletion } = await editDeletedCopy();
    expect(router.getPathname()).toBe("/composition");
    expect(screen.getByText("Fentes")).toBeTruthy();
    expect(screen.getByLabelText(composition.name).props.value).toBe("Jambes");
    expect(await dump()).toEqual(afterDeletion);
  }, 30000);

  // La Copie était chargée à l'ouverture (`persistedExerciseIds`) : le Repository
  // refuse de la recréer (`ACTIVITY_NOT_FOUND`), sans aucune écriture.
  it("PRE4-4.1/AC13 — Copie supprimée : à l'enregistrement, erreur du code de départ, rien n'est recréé, Brouillon conservé", async () => {
    const { router, afterDeletion } = await editDeletedCopy();
    await continueAndSave();
    // Q54 : l'échec reste sur la Composition, message D-107, Brouillon conservé.
    expect(router.getPathname()).toBe("/composition");
    expect(screen.getByText(composition.saveError)).toBeTruthy();
    expect(await dump()).toEqual(afterDeletion);
    expect(screen.getByText("Fentes")).toBeTruthy();
  }, 30000);
});

/**
 * PRE-4 story 4.4 — Médias dans l'Éditeur, sans perte (AC2, AC3, AC5, AC7),
 * dans les quatre parcours, avec les vrais services et une base SQLite réelle.
 * Le sélecteur système est un port scripté (photothèque seule : le port n'a
 * aucune méthode caméra, D-334) ; la copie interne est `CountingStore`. Les
 * actions Retirer / Monter / Descendre passent par `openMediaMenu`, écrit
 * indépendamment du geste (repris par 4.5, Q31). Rappel NFR-04 : ces tests ne
 * valent pas recette sur iPhone.
 */
class ScriptedPicker implements MediaPickerPort {
  readonly outcomes: PickOutcome[] = [];
  calls = 0;
  async pickFromLibrary(): Promise<PickOutcome> {
    this.calls += 1;
    return this.outcomes.shift() ?? { status: "CANCELED" };
  }
}

const mediaText = strings.executionParameters.media;

function picked(name: string, kind: "PHOTO" | "VIDEO" | null, sizeBytes = 10): PickedMedia {
  return {
    uri: `file:///cache/${name}`,
    kind,
    mimeType: kind === "PHOTO" ? "image/jpeg" : kind === "VIDEO" ? "video/quicktime" : null,
    fileName: null,
    sizeBytes,
    durationMs: kind === "VIDEO" ? 1500 : null,
    width: null,
    height: null,
    nativeAssetId: null,
  };
}

/** Un ajout depuis la zone Médias : le sélecteur rend `outcome`, l'import se termine. */
async function addMedia(picker: ScriptedPicker, outcome: PickOutcome) {
  picker.outcomes.push(outcome);
  await act(async () => {
    fireEvent.press(screen.getByTestId("media-add"));
  });
  await settle();
}

/** Ajoute une photo, puis une vidéo, en deux ajouts successifs (AC2). */
async function addPhotoThenVideo(picker: ScriptedPicker) {
  await addMedia(picker, { status: "PICKED", items: [picked("photo.jpg", "PHOTO")], limitedAccess: false });
  await addMedia(picker, { status: "PICKED", items: [picked("video.mov", "VIDEO")], limitedAccess: false });
}

/** Libellés des tuiles de la galerie, dans l'ordre rendu. */
function galleryLabels(): string[] {
  return screen.queryAllByTestId(/^media-item-\d+$/u).map((tile) => tile.props.accessibilityLabel as string);
}

async function definitionMedia(definitionId: string): Promise<string[]> {
  const rows = await database.getAllAsync<{ asset_id: string }>(
    "SELECT asset_id FROM movement_media WHERE movement_id = (SELECT movement_id FROM activity_definitions WHERE id = ?) ORDER BY position",
    [definitionId],
  );
  return rows.map((row) => row.asset_id);
}

/** PRE-7 (R-3, C05) : médias relus par l'occurrence — ceux de son Mouvement (aucun lien propre). */
async function copyMedia(activityId: string): Promise<string[]> {
  const rows = await database.getAllAsync<{ asset_id: string }>(
    "SELECT asset_id FROM movement_media WHERE movement_id = (SELECT source_movement_id FROM activities WHERE id = ?) ORDER BY position",
    [activityId],
  );
  return rows.map((row) => row.asset_id);
}

describe("PRE4-4.4/AC2 — ajouter une photo puis une vidéo dans les quatre parcours", () => {
  it("PRE4-4.4/AC2 — CC : chaque Média s'affiche en dernière position ; enregistrés dans l'ordre à Terminer ; un sélecteur par ajout", async () => {
    const picker = new ScriptedPicker();
    renderApp({ picker });
    await openExercisesSegment();
    await openDefinitionEditor("new");
    await settle();
    await fillNewExercise("Gainage");

    await addPhotoThenVideo(picker);
    expect(galleryLabels()).toEqual(["Photo 1 sur 2", "Vidéo 2 sur 2"]);
    expect(picker.calls).toBe(2);
    const added = editorContent().media;
    expect(await database.getAllAsync("SELECT id FROM activity_definitions")).toEqual([]);

    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(300);
    const [created] = await database.getAllAsync<{ id: string }>("SELECT id FROM activity_definitions");
    expect(await definitionMedia(created!.id)).toEqual(added);
  }, 30000);

  it("PRE4-4.4/AC2 — MC : ajoutés après les deux Médias existants, enregistrés à Terminer dans cet ordre", async () => {
    const picker = new ScriptedPicker();
    const definition = await savedDefinition();
    renderApp({ picker });
    await openExercisesSegment();
    await openDefinitionEditor(definition.id);
    await screen.findByDisplayValue("Fentes");

    await addPhotoThenVideo(picker);
    expect(galleryLabels()).toEqual(["Photo 1 sur 4", "Photo 2 sur 4", "Photo 3 sur 4", "Vidéo 4 sur 4"]);
    const media = editorContent().media;
    expect(media.slice(0, 2)).toEqual(["p1", "p2"]);
    expect(await definitionMedia(definition.id)).toEqual(["p1", "p2"]);

    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(300);
    expect(await definitionMedia(definition.id)).toEqual(media);
  }, 30000);

  it("PRE4-4.4/AC2 — CS : ajoutés au Brouillon de Composition à Terminer (rien d'écrit), enregistrés au Continuer", async () => {
    const picker = new ScriptedPicker();
    const definition = await savedDefinition();
    await savedSessionWithCopy(definition);
    const router = renderApp({ picker });
    await openSessionFromCatalogue();
    const before = await dump();

    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByLabelText(activities.addToSession.newActivity));
    await settle();
    await fillNewExercise("Pompes");
    await addPhotoThenVideo(picker);
    expect(galleryLabels()).toEqual(["Photo 1 sur 2", "Vidéo 2 sur 2"]);
    const added = editorContent().media;
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    await settle();
    expect(router.getPathname()).toBe("/composition");
    expect(await dump()).toEqual(before);

    await continueAndSave();
    await waitFor(() => expect(router.getPathname()).toBe("/"));
    const [created] = await database.getAllAsync<{ id: string }>(`SELECT id FROM ${OCCURRENCES} WHERE name = 'Pompes'`);
    expect(await copyMedia(created!.id)).toEqual(added);
    expect(await definitionMedia(definition.id)).toEqual(["p1", "p2"]);
  }, 30000);

  // PRE-7 story A2.2 (D-437, MFN-09, MFN/AC28) : la Copie porte une filiation, ses Médias sont
  // verrouillés — l'ajout qu'exerçait ce parcours n'existe plus ; consultation conservée.
  it("PRE4-4.4/AC2 — MS (PRE-7 A2.2, MFN/AC28) : Médias de la Copie verrouillés — aucun ajout possible, Terminer et Continuer ne changent ni la Copie ni la Définition", async () => {
    const picker = new ScriptedPicker();
    const definition = await savedDefinition();
    const { copy } = await savedSessionWithCopy(definition);
    const router = renderApp({ picker });
    await openSessionFromCatalogue();
    const before = await dump();

    fireEvent.press(screen.getByTestId(`composition-exercise-row-${copy.id}`));
    await settle();
    expect(screen.queryByTestId("media-add")).toBeNull();
    expect(galleryLabels()).toEqual(["Photo 1 sur 2", "Photo 2 sur 2"]);
    expect(picker.calls).toBe(0);
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    await settle();
    expect(await dump()).toEqual(before);

    await continueAndSave();
    await waitFor(() => expect(router.getPathname()).toBe("/"));
    expect(await copyMedia(copy.id)).toEqual(["p1", "p2"]);
    expect(await definitionMedia(definition.id)).toEqual(["p1", "p2"]);
  }, 30000);
});

describe("PRE4-4.4/AC3 — ordre relu après réouverture, vignette du Catalogue, retrait sans perte de fichier", () => {
  it("PRE4-4.4/AC3 — MC : la vignette suit le premier Média ; Monter puis Terminer, réouverture : même ordre, même identité ; Retirer ne supprime que l'association", async () => {
    const definition = await savedDefinition();
    renderApp();
    await openExercisesSegment();
    // PRE-8 (E.8-a) : la carte Exercice du Catalogue (et sa vignette) est retirée avec le segment ;
    // l'ordre des Médias reste vérifié dans l'éditeur et en base.

    await openDefinitionEditor(definition.id);
    await screen.findByDisplayValue("Fentes");
    expect(openMediaMenu(1).options).toEqual([mediaText.menuRemove, mediaText.menuMoveDown]);
    openMediaMenu(2).choose(mediaText.menuMoveUp);
    expect(editorContent().media).toEqual(["p2", "p1"]);
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(300);
    expect(await definitionMedia(definition.id)).toEqual(["p2", "p1"]);

    editorSpy.mockClear();
    await openDefinitionEditor(definition.id);
    await screen.findByDisplayValue("Fentes");
    await settle();
    expect(editorContent().media).toEqual(["p2", "p1"]);
    const reopened = editorSpy.mock.calls.at(-1)![0] as { value: { media: readonly { assetId: string; asset: { id: string; uri: string } }[] } };
    expect(reopened.value.media.map((item) => [item.assetId, item.asset.id, item.asset.uri])).toEqual([
      ["p2", "p2", "kodjo-media/p2"],
      ["p1", "p1", "kodjo-media/p1"],
    ]);

    // Retrait par l'action VoiceOver (alternative au menu) : l'association seule disparaît.
    fireEvent(screen.getByTestId("media-item-1"), "accessibilityAction", { nativeEvent: { actionName: "remove" } });
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(300);
    expect(await definitionMedia(definition.id)).toEqual(["p1"]);
    expect(await database.getAllAsync("SELECT id FROM media_assets WHERE id = 'p2'")).toEqual([{ id: "p2" }]);
    expect(store.files.has("kodjo-media/p2")).toBe(true);
  }, 30000);
});

describe("PRE4-4.4/AC5 — import annulé ou en erreur", () => {
  it("PRE4-4.4/AC5 — MC, deux Médias : annulation sans effet ; photothèque indisponible et refus : avis du départ ; COPY_FAILED, STORAGE_FULL, INCOMPATIBLE : Brouillon intact, messages du lexique, Réessayer ajoute un seul Média en dernière position", async () => {
    const picker = new ScriptedPicker();
    const definition = await savedDefinition();
    renderApp({ picker });
    await openExercisesSegment();
    await openDefinitionEditor(definition.id);
    await screen.findByDisplayValue("Fentes");
    fireEvent.changeText(screen.getByDisplayValue("Fentes"), "Fentes lentes");
    const draft = editorContent();
    expect(draft.media).toEqual(["p1", "p2"]);

    await addMedia(picker, { status: "CANCELED" });
    expect(editorContent()).toEqual(draft);
    expect(galleryLabels()).toEqual(["Photo 1 sur 2", "Photo 2 sur 2"]);
    expect(screen.queryByTestId("media-notice")).toBeNull();

    await addMedia(picker, { status: "ERROR" });
    expect(within(screen.getByTestId("media-notice")).getByText(mediaText.errors.ERROR)).toBeTruthy();
    await addMedia(picker, { status: "PERMISSION_DENIED", canAskAgain: true });
    expect(within(screen.getByTestId("media-notice")).getByText(mediaText.permissionDenied)).toBeTruthy();
    expect(editorContent()).toEqual(draft);

    store.failOnce.add("file:///cache/copie.jpg");
    store.available = 100;
    await addMedia(picker, {
      status: "PICKED",
      items: [picked("copie.jpg", "PHOTO"), picked("lourde.mov", "VIDEO", 1000), picked("inconnu.bin", null)],
      limitedAccess: false,
    });
    expect(screen.queryByTestId("media-notice")).toBeNull();
    expect(editorContent()).toEqual(draft);
    expect(screen.getByDisplayValue("Fentes lentes")).toBeTruthy();
    expect(["media-pending-1-error", "media-pending-2-error", "media-pending-3-error"].map((id) => screen.getByTestId(id).props.children)).toEqual([
      mediaText.errors.COPY_FAILED,
      mediaText.errors.STORAGE_FULL,
      mediaText.errors.INCOMPATIBLE,
    ]);

    // Réessai de l'élément COPY_FAILED, touché deux fois avant toute réponse : un seul Média ajouté.
    const retryCopy = screen.getByTestId("media-pending-1-retry");
    await act(async () => {
      fireEvent.press(retryCopy);
      fireEvent.press(retryCopy);
    });
    await settle();
    const afterRetry = editorContent().media;
    expect(afterRetry).toHaveLength(3);
    expect(new Set(afterRetry).size).toBe(3);
    expect(afterRetry.slice(0, 2)).toEqual(["p1", "p2"]);
    expect(galleryLabels()).toEqual(["Photo 1 sur 3", "Photo 2 sur 3", "Photo 3 sur 3"]);
    // L'élément réussi a quitté les échecs ; restent STORAGE_FULL et INCOMPATIBLE, avec Réessayer.
    expect(screen.getAllByTestId(/^media-pending-\d+-error$/u).map((node) => node.props.children)).toEqual([
      mediaText.errors.STORAGE_FULL,
      mediaText.errors.INCOMPATIBLE,
    ]);
    expect(screen.getAllByTestId(/^media-pending-\d+-retry$/u)).toHaveLength(2);

    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(300);
    expect(await definitionMedia(definition.id)).toEqual(afterRetry);
  }, 30000);

  it("PRE4-4.4/AC5 — textes d'erreur, de permission, d'accès limité et de fichier introuvable : ceux du code de départ", () => {
    expect(mediaText.errors).toEqual({
      COPY_FAILED: "Import impossible.",
      STORAGE_FULL: "Espace de stockage insuffisant.",
      INCOMPATIBLE: "Format non pris en charge.",
      ERROR: "La photothèque n’a pas pu être ouverte.",
    });
    expect(mediaText.permissionDenied).toBe("Accès à la photothèque refusé.");
    expect(mediaText.openSettings).toBe("Ouvrir les réglages");
    expect(mediaText.limitedAccess).toBe("Accès limité : seuls les médias autorisés sont proposés.");
    expect(mediaText.missingFile).toBe("Fichier introuvable");
    expect(mediaText.retry).toBe("Réessayer");
  });
});

describe("PRE4-4.4/AC7 — Copie en Séance : réordonner et retirer sans effet sur la Définition", () => {
  // PRE-7 story A2.2 (D-437, MFN-09, MFN/AC28) : Médias de la Copie verrouillés — ni menu
  // Retirer / Monter / Descendre, ni actions d'accessibilité équivalentes ; consultation conservée.
  it("PRE4-4.4/AC7 — MS (PRE-7 A2.2, MFN/AC28) : Médias de la Copie verrouillés — ni Monter ni Retirer ; Terminer, Continuer : Copie et Définition gardent leurs deux Médias dans leur ordre", async () => {
    const definition = await savedDefinition();
    const { copy } = await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();

    fireEvent.press(screen.getByTestId(`composition-exercise-row-${copy.id}`));
    await settle();
    expect(editorContent().media).toEqual(["p1", "p2"]);
    expect(() => openMediaMenu(2)).toThrow();
    for (const index of [1, 2]) {
      const tile = screen.getByTestId(`media-item-${index}`);
      expect(tile.props.accessibilityActions).toEqual([]);
      expect(tile.props.accessibilityHint).toBe(mediaText.photoHintLocked);
    }
    expect(editorContent().media).toEqual(["p1", "p2"]);
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    await settle();
    await continueAndSave();
    await waitFor(() => expect(router.getPathname()).toBe("/"));

    expect(await copyMedia(copy.id)).toEqual(["p1", "p2"]);
    expect(await definitionMedia(definition.id)).toEqual(["p1", "p2"]);
    expect(await database.getAllAsync("SELECT id FROM media_assets ORDER BY id")).toEqual([{ id: "p1" }, { id: "p2" }]);
  }, 30000);
});

describe("PRE4-4.5/AC4 — consulter un Média sans perdre le Brouillon", () => {
  it("PRE4-4.5/AC4 — MC : Brouillon modifié (nom, description, Paramètres par ✓, ordre des Médias), photo ouverte en plein écran puis fermée : Brouillon identique champ par champ, base inchangée, Terminer dans le même état", async () => {
    const definition = await savedDefinition();
    renderApp();
    await openExercisesSegment();
    await openDefinitionEditor(definition.id);
    await screen.findByDisplayValue("Fentes");
    await settle();

    fireEvent.changeText(screen.getByDisplayValue("Fentes"), "Fentes consultées");
    fireEvent.changeText(screen.getByDisplayValue("Genou au-dessus de la cheville."), "Dos droit.");
    toggleModeAndValidate();
    openMediaMenu(2).choose(mediaText.menuMoveUp);
    const before = editorContent();
    expect(before).toMatchObject({ name: "Fentes consultées", instructionSteps: ["Dos droit."], media: ["p2", "p1"] });
    const finishState = screen.getByTestId("activity-editor-finish-action").props.accessibilityState;
    const databaseBefore = await dump();

    // Toucher la tuile : consultation (photo plein écran), puis fermeture.
    fireEvent.press(screen.getByTestId("media-item-1"));
    expect(screen.getByTestId("media-item-1-consultation").props).toMatchObject({ visible: true, presentationStyle: "fullScreen" });
    fireEvent.press(screen.getByTestId("media-item-1-consultation-close"));
    await settle();
    expect(screen.queryByTestId("media-item-1-consultation")).toBeNull();

    expect(editorContent()).toEqual(before);
    expect(screen.getByDisplayValue("Fentes consultées")).toBeTruthy();
    expect(screen.getByDisplayValue("Dos droit.")).toBeTruthy();
    expect(screen.getByTestId("activity-editor-finish-action").props.accessibilityState).toEqual(finishState);
    expect(await dump()).toEqual(databaseBefore);
    expect(await definitionMedia(definition.id)).toEqual(["p1", "p2"]);
  }, 30000);
});

/**
 * PRE-5 story 3.1 : saisit des étapes dans la Description, chacune suivie d'Entrée
 * (texte vide : Entrée seule, qui crée une étape vide intercalée).
 */
function typeSteps(texts: readonly string[]) {
  texts.forEach((text, index) => {
    const testID = index === 0 ? "exercise-instruction-input" : `exercise-instruction-step-${index + 1}`;
    // PRE-7 story B.2 (B1) : la ligne prend le focus, comme sur l'appareil (l'invite est alors rendue).
    fireEvent(screen.getByTestId(testID), "focus");
    if (text !== "") fireEvent.changeText(screen.getByTestId(testID), text);
    fireEvent.changeText(screen.getByTestId(testID), `${text}\n`);
  });
}

describe("PRE5-3.1/AC4, AC5 — étapes : encodage à Terminer, relecture, transport, garde d'abandon", () => {
  it("PRE5-3.1/AC4 — CC : étapes vides intercalées retirées à Terminer (`A\\nB`), relues renumérotées ; copie Définition → Séance transportée", async () => {
    const router = renderApp();
    await openExercisesSegment();
    await openDefinitionEditor("new");
    await settle();
    await fillNewExercise("Gainage");
    typeSteps(["Dos droit", "", "Genoux fléchis"]);
    expect(editorContent().instructionSteps).toEqual(["Dos droit", "", "Genoux fléchis", ""]);
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(300);
    expect(router.getPathname()).toBe("/");
    const [created] = await database.getAllAsync<{ id: string; description: string | null }>(
      "SELECT activity_definitions.id, movements.description FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id",
    );
    expect(created!.description).toBe("Dos droit\nGenoux fléchis");

    editorSpy.mockClear();
    await openDefinitionEditor(created!.id);
    await screen.findByDisplayValue("Gainage");
    await settle();
    expect(editorContent().instructionSteps).toEqual(["Dos droit", "Genoux fléchis"]);
    expect(screen.getByTestId("exercise-instruction-input").props.value).toBe("Dos droit");
    expect(screen.getByTestId("exercise-instruction-step-2").props.value).toBe("Genoux fléchis");
    // PRE-7 story B.2 (B1) : l'invite « Étape suivante » n'est rendue qu'en saisie.
    expect(screen.queryByTestId("exercise-instruction-step-3")).toBeNull();
    fireEvent(screen.getByTestId("exercise-instruction-input"), "focus");
    expect(screen.getByTestId("exercise-instruction-step-3").props.placeholder).toBe(exercise.instruction.nextStepPlaceholder);

    // Copie Définition → Séance : la chaîne encodée est transportée telle quelle.
    const definition = await new SqliteActivityDefinitionRepository(database).findById(created!.id);
    expect(activityDefinitionToDraftExercise(definition!, "occ-steps", 0).instruction).toBe("Dos droit\nGenoux fléchis");
  }, 30000);

  // PRE-7 story A2.2 (D-437, MFN-09, MFN/AC28) : la Description de la Copie (filiation) est
  // verrouillée — les étapes sont lues, ni Entrée ni saisie ne les modifient.
  it("PRE5-3.1/AC4 — MS (PRE-7 A2.2, MFN/AC28) : Copie à étapes, Description verrouillée ; aucune saisie, aucune garde d'abandon ; à Terminer, étapes transportées à l'identique ; la Définition reste inchangée", async () => {
    const definition = await savedDefinition(undefined, "Genou aligné\nDos droit");
    const { copy } = await savedSessionWithCopy(definition);
    const definitionBefore = await database.getAllAsync("SELECT * FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id");
    const router = renderApp();
    await openSessionFromCatalogue();

    fireEvent.press(screen.getByTestId(`composition-exercise-row-${copy.id}`));
    await settle();
    expect(editorContent().instructionSteps).toEqual(["Genou aligné", "Dos droit"]);
    expect(screen.getByTestId("exercise-instruction-input").props.editable).toBe(false);
    expect(screen.getByTestId("exercise-instruction-step-2").props.editable).toBe(false);
    fireEvent.changeText(screen.getByTestId("exercise-instruction-step-2"), "Dos droit\n");
    expect(editorContent().instructionSteps).toEqual(["Genou aligné", "Dos droit"]);
    fireEvent.press(screen.getByLabelText(exercise.backAccessibilityLabel));
    await settle(300);
    expect(screen.queryByText(exercise.exitConfirmModal.title)).toBeNull();
    expect(router.getPathname()).toBe("/composition");

    fireEvent.press(screen.getByTestId(`composition-exercise-row-${copy.id}`));
    await settle();
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    await settle();
    await continueAndSave();
    await waitFor(() => expect(router.getPathname()).toBe("/"));
    const rows = await database.getAllAsync<{ instruction: string | null }>(`SELECT instruction FROM ${OCCURRENCES}`);
    expect(rows).toEqual([{ instruction: "Genou aligné\nDos droit" }]);
    expect(await database.getAllAsync("SELECT * FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id")).toEqual(definitionBefore);
  }, 30000);

  it("PRE5-3.1/AC5 — MC : ancienne Description `\\r\\n` à ligne vide relue une ligne = une étape, sans étape fantôme ; non modifiée (ou une étape vide ajoutée) : aucune garde, rien d'écrit", async () => {
    const definition = await savedDefinition(undefined, "Genou aligné\r\n\r\nDos droit");
    const before = await dump();
    const router = renderApp();
    await openExercisesSegment();
    await openDefinitionEditor(definition.id);
    await screen.findByDisplayValue("Fentes");
    await settle();
    expect(editorContent().instructionSteps).toEqual(["Genou aligné", "", "Dos droit"]);
    expect(editorContent().instructionSteps.some((step) => step.includes("\r"))).toBe(false);
    expect(screen.getByTestId("exercise-instruction-step-2").props.value).toBe("");
    expect(screen.getByTestId("exercise-instruction-step-2").props.placeholder).toBeUndefined();

    fireEvent.changeText(screen.getByTestId("exercise-instruction-step-3"), "Dos droit\n");
    fireEvent.press(screen.getByLabelText(activities.editor.backAccessibilityLabel));
    await settle(300);
    expect(screen.queryByText(exercise.exitConfirmModal.title)).toBeNull();
    expect(router.getPathname()).toBe("/");
    expect(await dump()).toEqual(before);
  }, 30000);

  it("PRE5-3.1/AC4 — MC : Description entièrement effacée, Terminer : enregistrée NULL", async () => {
    const definition = await savedDefinition();
    const router = renderApp();
    await openExercisesSegment();
    await openDefinitionEditor(definition.id);
    await screen.findByDisplayValue("Fentes");
    await settle();
    expect(editorContent().instructionSteps).toEqual(["Genou au-dessus de la cheville."]);
    fireEvent.changeText(screen.getByTestId("exercise-instruction-input"), "");
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-editor-finish-action"));
    });
    await settle(300);
    expect(router.getPathname()).toBe("/");
    const row = await database.getFirstAsync<{ description: string | null }>(
      "SELECT movements.description FROM activity_definitions JOIN movements ON movements.id = activity_definitions.movement_id WHERE activity_definitions.id = ?",
      [definition.id],
    );
    expect(row).toEqual({ description: null });
  }, 30000);
});
