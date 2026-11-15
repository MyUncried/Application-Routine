import { router as expoRouter } from "expo-router";
import { act, fireEvent, renderRouter, screen, testRouter, waitFor, within } from "expo-router/testing-library";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import type { ReactNode } from "react";

import type { CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
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
import { createEmptyDraft, createExerciseDraft, toCreateSessionInput, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceProvider } from "@/features/activities/ActivityDefinitionServiceProvider";
import { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteLabelRepository } from "@/infrastructure/database/repositories/SqliteLabelRepository";
import { SqliteMediaRepository } from "@/infrastructure/database/repositories/SqliteMediaRepository";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { createTestMovement } from "@/infrastructure/database/testing/createTestMovement";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
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
  enterExecutionSheetValue,
} from "@/features/activities/testing/executionSheetActions";
import { openMediaMenu } from "@/features/activities/testing/mediaMenu";
import { strings } from "@/shared/i18n";
import { CreationRootStack } from "@/features/sessions/testing/CreationRootStack";

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

/**
 * Mouvement complet : nom, Catégorie, deux Zones, paramètres typés, description, deux Médias.
 * [PRE-9 A.3 du 04/11/2026 : créé directement, sans ancienne définition du Catalogue ; `id` est celui
 * du Mouvement. Les parcours Catalogue (CC, MC, sélection E.8-a) sont retirés avec elles.]
 */
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
) {
  const input: CreateActivityDefinitionInput = {
    name: "Fentes",
    description,
    category: { kind: "EXISTING", categoryId: "cardio" },
    bodyZoneIds: ["cuisses", "dos"],
    executionParameters,
    media: [asset("p1"), asset("p2")].map((item) => ({ assetId: item.id, asset: item })),
  };
  const { movementId } = await createTestMovement(database, input, { kind: "INDEPENDENT" }, ids("mov"));
  return { ...input, id: movementId, movementId };
}

type SavedMovement = Awaited<ReturnType<typeof savedDefinition>>;

/** Nom de la Catégorie enregistrée par `savedDefinition` (`cardio`), relu dans la base. */
async function savedCategoryName(): Promise<string> {
  const row = await database.getFirstAsync<{ name: string }>("SELECT name FROM categories WHERE id = ?", ["cardio"]);
  return row!.name;
}

/** Séance persistée qui contient une Copie (occurrence) du Mouvement. */
async function savedSessionWithCopy(definition: SavedMovement): Promise<{ sessionId: string; copy: SessionDraftExercise }> {
  const copy: SessionDraftExercise = {
    ...createExerciseDraft("occ-1", 0),
    name: definition.name,
    instruction: definition.description,
    categoryId: "cardio",
    bodyZoneIds: [...definition.bodyZoneIds],
    executionParameters: definition.executionParameters,
    sideMode: definition.executionParameters.sideMode,
    media: (definition.media ?? []).map((item) => ({ assetId: item.assetId, asset: item.asset! })),
    sourceMovementId: definition.movementId,
  };
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

function renderApp(options: { readonly picker?: MediaPickerPort } = {}) {
  const importService = new ActivityMediaImportService(
    options.picker ?? { pickFromLibrary: async () => ({ status: "CANCELED" }) },
    store,
    ids("asset"),
  );
  const activityDefinitionService = new ActivityDefinitionService(
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
      _layout: CreationRootStack,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      index: require("../../../../app/(tabs)/index").default,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/_layout": require("../../../../app/(creation)/_layout").default,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/composition": require("../../../../app/(creation)/composition").default,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/exercise": require("../../../../app/(creation)/exercise").default,
      // PRE-9 A.2 (ARB-22a) : sélection des Mouvements depuis la Composition.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/movement-selection": require("../../../../app/(creation)/movement-selection").default,
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
 * Paramètres de route qui portent le contexte d’ouverture de l’Éditeur (AC7).
 * `getSearchParams` y ajoute les paramètres hérités de la pile (`sessionId` de
 * Composition), sans rôle dans l’aiguillage d’`ExerciseScreen`.
 */
function editorContext(params: Record<string, unknown>): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  for (const key of ["exerciseId"]) {
    if (params[key] !== undefined) {
      context[key] = params[key];
    }
  }
  return context;
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
  // [Roue de la Cible commune (minutes, secondes, ✓) — remplacée le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]
  enterExecutionSheetValue("execution-sheet-target", 45);
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
 * PRE-8 (E.2, E.5) : carte unique, touchée par sa zone glissable (`session-card-<id>-swipe-card`). [— remplacé le 03/11/2026 : touchée par son visuel (`session-card-<id>-visual-open`), recette iPhone n° 3 du 03/11/2026.]
 */
async function openSessionFromCatalogue() {
  await settle();
  const [card] = await screen.findAllByTestId(/^session-card-.+-visual-open$/);
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
/**
 * PRE-9 A.2 — ARB-22a, D-449 : « Créer un nouvel exercice » du menu Créer n'ouvre plus l'ancien
 * éditeur (création d'un Mouvement, `CompositionMovementFlow.integration.test.tsx`). L'ancien
 * éditeur de création reste dans le code jusqu'à A.3 : ses contrats sont conservés en l'ouvrant
 * directement par sa route.
 */
function openLegacyExerciseCreation() {
  act(() => {
    expoRouter.push("/exercise");
  });
}

/**
 * [Remplacé le 04/11/2026 — décision de Hermann (recette iPhone du 04/11) : l'appui court sur la photo d'une
 * carte d'Exercice ouvre la fiche de l'Exercice en lecture seule (`/exercise-sheet`), plus l'éditeur.] Les
 * contrats de l'éditeur d'une occurrence existante restent vérifiés en l'ouvrant par sa route.
 */
function openOccurrenceEditor(exerciseId: string) {
  act(() => {
    expoRouter.push({ pathname: "/exercise", params: { exerciseId } });
  });
}

// [PRE-9 A.3 du 04/11/2026 : « PRE-8 E.8-a — Modifier une ancienne définition depuis la sélection d'Exercices » retiré(s) avec les anciennes définitions du Catalogue.]

describe("PRE4-4.1/AC4 — Modifier une Copie en Séance", () => {
  it("PRE4-4.1/AC4 — appui court : l'Éditeur s'ouvre sur la Copie ; appui long : réorganisation, pas d'Éditeur", async () => {
    const definition = await savedDefinition();
    const { copy } = await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();

    // Revue 6.2 : sous Jest, `onLayout` ne se déclenche pas ; l'écran refuse un soulèvement sans
    // géométrie complète — chaque rangée affichée reçoit une mesure factice.
    screen
      .queryAllByTestId(/^composition-(activity-|stop-point-row-|layout-)/u, { includeHiddenElements: true })
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

    openOccurrenceEditor(copy.id); // [04/11/2026 : la photo ouvre la fiche en lecture seule (décision de Hermann) ; l'éditeur, par sa route.]
    await settle();
    expect(router.getPathname()).toBe("/exercise");
    expect(router.getSearchParams()).toMatchObject({ exerciseId: copy.id });
    expect(screen.getByDisplayValue("Fentes")).toBeTruthy();
    // PRE-9 (recette iPhone du 29/10, CE-MVT-01) : gabarit Mouvement, Mouvement repris en lecture seule, sans crayon.
    expect(screen.getByText(strings.screens.movement.titles.consult)).toBeTruthy();
    expect(screen.getByTestId("movement-photo-template")).toBeTruthy();
    expect(screen.queryByTestId("activity-editor-edit-movement")).toBeNull();
    expect(screen.getByTestId("exercise-parameters-card")).toBeTruthy();
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
    // [« Utiliser un mouvement existant » et rangée « Annuler » — remplacés le 01/11/2026 (ordre de
    // Hermann, ch13 CE-T03-08 « Menu Créer — état cible ») : plus d'entrée « mouvement existant » ;
    // Annuler est le « + » transformé, qui ferme le menu sans action.]
    // [Rétabli par la recette iPhone du 01/11/2026 (m11-menu, Hermann) : « Utiliser un mouvement
    // existant » est de nouveau une option, 2e après « Créer un exercice ».]
    // [Complément du 5 novembre 2026 (§3) : « Utiliser des mouvements existants » retiré du menu Créer.]
    expect(within(tree).queryByLabelText(activities.addToSession.existingActivity)).toBeNull();
    expect(within(tree).getByLabelText(activities.addToSession.cancel)).toBeTruthy();
    fireEvent.press(within(tree).getByLabelText(activities.addToSession.cancel));
    await settle();
    expect(screen.queryByTestId("composition-add-activity-tree")).toBeNull();
    expect(router.getPathname()).toBe("/composition");

    openLegacyExerciseCreation();
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
    expect(await database.getAllAsync("SELECT name FROM movements WHERE id = ?", [definition.id])).toEqual([{ name: "Fentes" }]);
  }, 30000);
});

describe("PRE4-4.1/AC6, AC7, AC8 — un seul Éditeur, contexte par la route, Terminer selon le contexte", () => {


  it("PRE4-4.1/AC6 AC7 AC8 — CS : même Éditeur et même Feuille ; route sans paramètre ; Terminer ne modifie que le Brouillon de Composition", async () => {
    const definition = await savedDefinition();
    await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();
    const before = await dump();

    openLegacyExerciseCreation();
    await settle();
    // Le contexte est porté par la route : aucun `exerciseId` (création en Séance).
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
    expect(await database.getAllAsync("SELECT name FROM movements WHERE id = ?", [definition.id])).toEqual([{ name: "Fentes" }]);
  }, 30000);

  it("PRE4-4.1/AC6 AC7 AC8 — MS : même Éditeur et même Feuille ; route exerciseId=<Copie> ; Terminer ne modifie que le Brouillon, rien n'est écrit avant Continuer", async () => {
    const definition = await savedDefinition();
    const { copy } = await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();
    const before = await dump();

    openOccurrenceEditor(copy.id); // [04/11/2026 : la photo ouvre la fiche en lecture seule (décision de Hermann) ; l'éditeur, par sa route.]
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
  expect(screen.getByTestId("execution-sheet-series-value").props.children).toBe("1 série identique"); // libellé de l'option (saisie au clavier, 06/11/2026)
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

  it("PRE4-4.1/AC10 — MS : Copie enregistrée à Cibles mixtes ; bascules, ✓, Terminer, Continuer, réouverture : contenu identique ; la Définition reste indépendante", async () => {
    const definition = await savedDefinition(MIXED_PARAMETERS);
    const { copy } = await savedSessionWithCopy(definition);
    const definitionBefore = await database.getAllAsync("SELECT * FROM movements");
    const router = renderApp();
    await openSessionFromCatalogue();

    openOccurrenceEditor(copy.id); // [04/11/2026 : la photo ouvre la fiche en lecture seule (décision de Hermann) ; l'éditeur, par sa route.]
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
    openOccurrenceEditor(copy.id); // [04/11/2026 : la photo ouvre la fiche en lecture seule (décision de Hermann) ; l'éditeur, par sa route.]
    await settle();
    expect(editorContent()).toEqual(opened);
    expect(await database.getAllAsync("SELECT * FROM movements")).toEqual(definitionBefore);
  }, 30000);


  it("PRE4-4.1/AC10 — CS : nouvel Exercice en Séance, Mode aller-retour, ✓, Terminer, Continuer, réouverture : contenu identique", async () => {
    const definition = await savedDefinition(MIXED_PARAMETERS);
    await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();

    openLegacyExerciseCreation();
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
    openOccurrenceEditor(created!.id); // [04/11/2026 : la photo ouvre la fiche en lecture seule (décision de Hermann) ; l'éditeur, par sa route.]
    await settle();
    expect(editorContent()).toEqual(entered);
    expect(await database.getAllAsync("SELECT name FROM movements WHERE id = ?", [definition.id])).toEqual([{ name: "Fentes" }]);
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
  expect(String(screen.getByTestId(`execution-sheet-table-row-${row}-pause-value`, hidden).props.children)).toBe(formatPhraseDuration(seconds)); // Format du 08/11/2026 au soir. [`${seconds} s` — remplacé.]
}

/** Bascules de AC10 dans la Feuille déjà ouverte, puis ✓. */
function toggleOpenSheetAndValidate() {
  chooseExecutionMode("Répétitions");
  chooseExecutionMode("Durée");
  moveRow(3, "moveUp");
  moveRow(2, "moveDown");
  tap("execution-sheet-series-decrement");
  tap("execution-sheet-series-decrement");
  expect(screen.getByTestId("execution-sheet-series-value").props.children).toBe("1 série identique"); // libellé de l'option (saisie au clavier, 06/11/2026)
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
  // Format du 08/11/2026 au soir : « M′SS″ » ou « S″ ». [« X min Y s » — remplacé.]
  const minutes = /(\d+)′/u.exec(text);
  const seconds = /(\d+)″/u.exec(text);
  return (minutes ? Number(minutes[1]) * 60 : 0) + (seconds ? Number(seconds[1]) : 0);
}

/**
 * Amène un champ à pas de la Feuille (`id`, ± `${id}-increment` / `-decrement`,
 * valeur `${id}-value`) au texte attendu, par appuis dans le sens de la cible.
 * Lève si la valeur n'est pas atteinte.
 */
function stepTo(id: string, expected: string) {
  // [Appuis ± dans le sens de la cible — remplacés le 06/11/2026, décision de Hermann (constat c) : saisie au clavier : la valeur est tapée.]
  enterExecutionSheetValue(id, shownSeconds(expected));
  // La Cadence se range à la sortie de son champ (valeur relue dans l'option Autre).
  if (screen.queryByTestId(`${id}-value`, hidden)) {
    expect(String(screen.getByTestId(`${id}-value`, hidden).props.children)).toBe(expected);
  }
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
  // [± du nombre de séries jusqu'à « 3 séries » — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier.]
  enterExecutionSheetValue("execution-sheet-series", 3, "integer");
  expect(screen.getByTestId("execution-sheet-series-value").props.children).toBe("3 séries identiques");
  chooseExecutionRegime("variables");
  enterRowTarget(1, 30);
  enterRowTarget(2, 45);
  enterRowTarget(3, "FAILURE");
  enterRowPause(1, 10);
  enterRowPause(2, 20);
  enterRowPause(3, 30);
  chooseExecutionSide("Avec");
  stepTo("execution-sheet-side-recovery", "5″");
  // PRE-5 story 2.5 (AC3) : le ± de la Cadence est révélé par l'option Autre.
  openExecutionSheetField("execution-sheet-beep");
  stepTo("execution-sheet-beep", "2″");
  showExerciseDurationSignals();
  if (context === "catalogue") {
    stepTo("execution-sheet-countdown", "10″");
    stepTo("execution-sheet-end", "5″");
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

  it("PRE4-4.1/AC10 — MS : Cible à l'échec saisie dans la Feuille de la Copie ; Terminer, Continuer, réouverture : relu à l'identique ; Définition indépendante", async () => {
    const definition = await savedDefinition(NUMERIC_PARAMETERS);
    const { copy } = await savedSessionWithCopy(definition);
    const definitionBefore = await database.getAllAsync("SELECT * FROM movements");
    const router = renderApp();
    await openSessionFromCatalogue();
    openOccurrenceEditor(copy.id); // [04/11/2026 : la photo ouvre la fiche en lecture seule (décision de Hermann) ; l'éditeur, par sa route.]
    await settle();

    enterFailureOnSavedExercise();
    const entered = editorContent();
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    await settle();
    await continueAndSave();
    await waitFor(() => expect(router.getPathname()).toBe("/"));

    editorSpy.mockClear();
    await openSessionFromCatalogue();
    openOccurrenceEditor(copy.id); // [04/11/2026 : la photo ouvre la fiche en lecture seule (décision de Hermann) ; l'éditeur, par sa route.]
    await settle();
    expect(editorContent()).toEqual(entered);
    expect(await database.getAllAsync("SELECT * FROM movements")).toEqual(definitionBefore);
  }, 30000);


  it("PRE4-4.1/AC10 — CS : Cibles mixtes saisies dans la Feuille d'un nouvel Exercice en Séance ; Terminer, Continuer, réouverture : relu à l'identique", async () => {
    const definition = await savedDefinition(MIXED_PARAMETERS);
    await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();
    openLegacyExerciseCreation();
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
    openOccurrenceEditor(created!.id); // [04/11/2026 : la photo ouvre la fiche en lecture seule (décision de Hermann) ; l'éditeur, par sa route.]
    await settle();
    expect(editorContent()).toEqual(entered);
    expect(await database.getAllAsync("SELECT name FROM movements WHERE id = ?", [definition.id])).toEqual([{ name: "Fentes" }]);
  }, 60000);
});

// [PRE-9 A.3 du 04/11/2026 : « PRE4-4.2/AC10 — enregistrement atomique et erreur d'écriture » (parcours CC) retiré(s) avec les anciennes définitions du Catalogue.]

describe("PRE4-4.2/AC10 — Séance : appuis répétés", () => {
  it("PRE4-4.2/AC10 — CS : appuis répétés sur Terminer, puis sur Continuer et Enregistrer : une seule Copie enregistrée", async () => {
    const definition = await savedDefinition();
    await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();
    openLegacyExerciseCreation();
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
    expect(await database.getAllAsync("SELECT name FROM movements WHERE id = ?", [definition.id])).toEqual([{ name: "Fentes" }]);
  }, 30000);
});

describe("PRE4-4.2/AC12 — abandon avec confirmation, navigation réelle", () => {
  it("PRE4-4.2/AC12 — CS : dialogue de création ; Annuler conserve ; Confirmer revient à Composition sans ajouter d'Exercice", async () => {
    const definition = await savedDefinition();
    await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();
    openLegacyExerciseCreation();
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



  it("PRE4-4.2/AC12 — MS : dialogue de modification ; sans modification, sortie immédiate", async () => {
    const definition = await savedDefinition();
    const { copy } = await savedSessionWithCopy(definition);
    const router = renderApp();
    await openSessionFromCatalogue();
    openOccurrenceEditor(copy.id); // [04/11/2026 : la photo ouvre la fiche en lecture seule (décision de Hermann) ; l'éditeur, par sa route.]
    await settle();
    fireEvent.press(screen.getByLabelText(exercise.backAccessibilityLabel));
    await settle(300);
    expect(router.getPathname()).toBe("/composition");
    expect(screen.queryByText(exercise.exitConfirmModal.title)).toBeNull();

    openOccurrenceEditor(copy.id); // [04/11/2026 : la photo ouvre la fiche en lecture seule (décision de Hermann) ; l'éditeur, par sa route.]
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

  it("PRE4-4.1/AC11 — Pause entre les côtés visible seulement en bilatéral (Copie bilatérale en Séance)", async () => {
    const definition = await savedDefinition(MIXED_PARAMETERS);
    const { copy } = await savedSessionWithCopy(definition);
    renderApp();
    await openSessionFromCatalogue();
    openOccurrenceEditor(copy.id); // [04/11/2026 : la photo ouvre la fiche en lecture seule (décision de Hermann) ; l'éditeur, par sa route.]
    await settle();
    fireEvent.press(screen.getByTestId("exercise-parameters-card"));
    expect(screen.getByTestId("execution-sheet-row-side-recovery")).toBeTruthy();
    // [« aucun réglage de Récupération dans la Feuille » — remplacé le 01/11/2026 (ordre de Hermann,
    // point 2) : la Feuille d'un Exercice de Séance porte le bloc 6 « Récupération », seule ligne ;
    // un Exercice sans récupération antérieure y affiche 0 s.]
    expect(within(screen.getByTestId("execution-sheet-frame-recovery")).getByTestId("execution-sheet-row-recovery")).toBeTruthy();
    expect(String(screen.getByTestId("execution-sheet-recovery-value").props.children)).toBe("0″");
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


  it("PRE4-4.1/AC12 — MS puis CS : ni l'Éditeur ni la Feuille ne rendent « Circuit » ou « Tour »", async () => {
    const definition = await savedDefinition(MIXED_PARAMETERS);
    const { copy } = await savedSessionWithCopy(definition);
    renderApp();
    await openSessionFromCatalogue();
    openOccurrenceEditor(copy.id); // [04/11/2026 : la photo ouvre la fiche en lecture seule (décision de Hermann) ; l'éditeur, par sa route.]
    await settle();
    expectNoCircuitOrTour();
    fireEvent.press(screen.getByLabelText(exercise.backAccessibilityLabel));
    await settle(300);

    openLegacyExerciseCreation();
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
    openOccurrenceEditor(copy.id); // [04/11/2026 : la photo ouvre la fiche en lecture seule (décision de Hermann) ; l'éditeur, par sa route.]
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
    "SELECT asset_id FROM movement_media WHERE movement_id = ? ORDER BY position",
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


  it("PRE4-4.4/AC2 — CS : ajoutés au Brouillon de Composition à Terminer (rien d'écrit), enregistrés au Continuer", async () => {
    const picker = new ScriptedPicker();
    const definition = await savedDefinition();
    await savedSessionWithCopy(definition);
    const router = renderApp({ picker });
    await openSessionFromCatalogue();
    const before = await dump();

    openLegacyExerciseCreation();
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

    openOccurrenceEditor(copy.id); // [04/11/2026 : la photo ouvre la fiche en lecture seule (décision de Hermann) ; l'éditeur, par sa route.]
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

// [PRE-9 A.3 du 04/11/2026 : « PRE4-4.4/AC3 — ordre relu après réouverture » (parcours MC) retiré(s) avec les anciennes définitions du Catalogue.]

describe("PRE4-4.4/AC5 — import annulé ou en erreur", () => {

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

    openOccurrenceEditor(copy.id); // [04/11/2026 : la photo ouvre la fiche en lecture seule (décision de Hermann) ; l'éditeur, par sa route.]
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

// [PRE-9 A.3 du 04/11/2026 : « PRE4-4.5/AC4 — consulter un Média sans perdre le Brouillon » (parcours MC) retiré(s) avec les anciennes définitions du Catalogue.]

describe("PRE5-3.1/AC4, AC5 — étapes : encodage à Terminer, relecture, transport, garde d'abandon", () => {

  // PRE-7 story A2.2 (D-437, MFN-09, MFN/AC28) : la Description de la Copie (filiation) est
  // verrouillée — les étapes sont lues, ni Entrée ni saisie ne les modifient.
  it("PRE5-3.1/AC4 — MS (PRE-7 A2.2, MFN/AC28) : Copie à étapes, Description verrouillée ; aucune saisie, aucune garde d'abandon ; à Terminer, étapes transportées à l'identique ; la Définition reste inchangée", async () => {
    const definition = await savedDefinition(undefined, "Genou aligné\nDos droit");
    const { copy } = await savedSessionWithCopy(definition);
    const definitionBefore = await database.getAllAsync("SELECT * FROM movements");
    const router = renderApp();
    await openSessionFromCatalogue();

    openOccurrenceEditor(copy.id); // [04/11/2026 : la photo ouvre la fiche en lecture seule (décision de Hermann) ; l'éditeur, par sa route.]
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

    openOccurrenceEditor(copy.id); // [04/11/2026 : la photo ouvre la fiche en lecture seule (décision de Hermann) ; l'éditeur, par sa route.]
    await settle();
    fireEvent.press(screen.getByTestId("exercise-finish-action"));
    await settle();
    await continueAndSave();
    await waitFor(() => expect(router.getPathname()).toBe("/"));
    const rows = await database.getAllAsync<{ instruction: string | null }>(`SELECT instruction FROM ${OCCURRENCES}`);
    expect(rows).toEqual([{ instruction: "Genou aligné\nDos droit" }]);
    expect(await database.getAllAsync("SELECT * FROM movements")).toEqual(definitionBefore);
  }, 30000);


});
