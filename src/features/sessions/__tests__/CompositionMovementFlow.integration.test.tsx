import { act, fireEvent, renderRouter, screen, waitFor, within } from "expo-router/testing-library";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Stack } from "expo-router/stack";
import type { ReactNode } from "react";

import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceProvider } from "@/features/activities/ActivityDefinitionServiceProvider";
import { chooseExecutionMode } from "@/features/activities/testing/executionSheetActions";
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
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { strings } from "@/shared/i18n";

/**
 * PRE-9 A.2 — Créer un Exercice depuis un Mouvement (ARB-22a, ARB-07, D-449, Q6 ; CE-MVT-01).
 * Vrai navigateur (pile racine + groupe `(creation)` réel, `SessionDraftProvider` réel), SQLite en
 * mémoire : « Créer un nouvel exercice » ouvre la création d'un Mouvement (plus `/exercise`) ;
 * « Utiliser un mouvement existant » ouvre la sélection des Mouvements actifs du Catalogue (plus
 * `/activity-selection`) ; les Mouvements choisis deviennent des Exercices insérés après le dernier
 * Exercice entré. Demande de Hermann du 29/10/2026 : aucune feuille ne s'ouvre à l'insertion ; les
 * cartes sont posées « Paramètres à compléter » ; toucher une telle carte ouvre directement la
 * feuille de paramètres (pas l'éditeur) ; complète, la carte ouvre l'éditeur comme avant.
 * [Remplacé le 01/11/2026 (ordre de Hermann, ch13 CE-T03-08 « Menu Créer — état cible ») : l'entrée
 * « Utiliser un mouvement existant » est retirée du menu ; un Mouvement existant est repris par la
 * saisie du nom dans « Créer un exercice » (toucher de sa carte de suggestion). La sélection multiple
 * du Catalogue n'est plus atteinte depuis la Composition.] [Rétablie le même jour par la recette iPhone
 * du 01/11/2026 (m11-menu, Hermann) : « Utiliser un mouvement existant », 2e option du menu.]
 */

jest.mock("expo-sqlite", () => ({ useSQLiteContext: () => ({}) }));
jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined) }));
jest.mock("expo-crypto", () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  randomUUID: () => (require("node:crypto") as typeof import("node:crypto")).randomUUID(),
}));
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

const composition = strings.screens.composition;
const addToSession = strings.screens.activities.addToSession;
const NOW = "2026-10-29T09:00:00.000Z";

let database: NodeSqliteDatabase;
let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
const movements = () => new SqliteMovementRepository(database, ids("grp"), () => NOW);

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
});

afterEach(() => {
  database.close();
});

const movement = (id: string, name: string, overrides: Partial<Movement> = {}): Movement => ({
  id,
  name,
  description: null,
  media: [],
  categoryId: "cardio",
  bodyZoneIds: ["cuisses"],
  phases: [],
  nextPhaseId: 1,
  aliases: [],
  levelGroup: null,
  ...overrides,
});

function RootStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

function renderApp() {
  const service = new ActivityDefinitionService(
    new SqliteCategoryRepository(database),
    new SqliteBodyZoneRepository(database),
    new SqliteLabelRepository(database),
    undefined,
    movements(),
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
        <ActivityDefinitionServiceProvider service={service}>
          <ReferentialServiceContext.Provider value={referentialService}>
            <ProfileServiceContext.Provider value={profileService}>{children}</ProfileServiceContext.Provider>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceProvider>
      </SessionServiceContext.Provider>
    );
  }
  /* eslint-disable @typescript-eslint/no-require-imports */
  return renderRouter(
    {
      _layout: RootStack,
      index: () => null,
      movement: require("../../../../app/movement").default,
      "(creation)/_layout": require("../../../../app/(creation)/_layout").default,
      "(creation)/composition": require("../../../../app/(creation)/composition").default,
      "(creation)/exercise": require("../../../../app/(creation)/exercise").default,
      // Recette iPhone du 04/11/2026 (décision de Hermann) : fiche de l'Exercice en lecture seule, ouverte par la photo.
      "(creation)/exercise-sheet": require("../../../../app/(creation)/exercise-sheet").default,
      // [PRE-9 A.3 du 04/11/2026 : route « activity-selection » retirée avec les anciennes définitions du Catalogue.]
      "(creation)/movement-selection": require("../../../../app/(creation)/movement-selection").default,
      "(creation)/formats-window": require("../../../../app/(creation)/formats-window").default,
    },
    { initialUrl: "/composition", wrapper: Wrapper },
  );
  /* eslint-enable @typescript-eslint/no-require-imports */
}

async function settle(ms = 0) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
    for (let round = 0; round < 5; round += 1) {
      await jest.advanceTimersByTimeAsync(0);
    }
  });
}

/** Noms des cartes d'Exercice de la Composition, dans l'ordre affiché. */
function cardNames(): string[] {
  const prefix = `${composition.occurrenceCard.accessibilityType}, `;
  return screen
    .queryAllByLabelText(new RegExp(`^${prefix}`))
    .map((node) => String(node.props.accessibilityLabel).slice(prefix.length).split(",")[0]!);
}

async function openMenuAction(label: string) {
  fireEvent.press(screen.getByLabelText(composition.addActivity));
  fireEvent.press(within(screen.getByTestId("composition-add-activity-tree")).getByLabelText(label));
  await settle(300);
  // Complément du 5 novembre 2026 (§1, §3) : « Créer un exercice » ouvre la modale de création ; « Exercice libre » ouvre la
  // fiche de création (mouvement, puis paramètres).
  if (label === addToSession.newActivity) {
    fireEvent.press(screen.getByTestId("formats-window-free-exercise"));
    await settle(300);
  }
}

/** 01/11/2026 : reprendre un Mouvement existant par « Créer un exercice », saisie du nom, toucher de la carte. */
async function useExistingMovement(name: string, id: string) {
  await openMenuAction(addToSession.newActivity);
  fireEvent.changeText(screen.getByTestId("exercise-name-input"), name);
  await settle();
  const result = await screen.findByTestId(`movement-suggestion-result-${id}`);
  await act(async () => {
    fireEvent.press(result);
  });
  await settle(300);
  // Recette du 05/11/2026 au soir (r-creer) : la fiche du mouvement choisi s'affiche ; sa coche le remet à la Composition.
  await act(async () => {
    fireEvent.press(within(await screen.findByTestId("movement-chosen-overlay")).getByTestId("screen-header-validate"));
  });
  await settle(300);
}

/** Carte d'Exercice de la Composition, par son nom. */
const card = (name: string) => screen.getByLabelText(new RegExp(`^${composition.occurrenceCard.accessibilityType}, ${name},`));

/** Toucher d'une carte (feuille ouverte après lecture du Profil). */
async function tapCard(name: string) {
  fireEvent.press(card(name));
  await settle(300);
}

/** Feuille de paramètres : mode Durée, 45 s, ✓. */
async function setDuration45() {
  chooseExecutionMode("Durée");
  fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
  fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 45 } });
  fireEvent.press(screen.getByTestId("duration-wheel-validate"));
  await act(async () => {
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
  });
  await settle(300);
}

describe("PRE-9 A.2 — « Créer un exercice » [« Créer un nouveau mouvement » avant le 01/11/2026] : création d'un Mouvement, puis carte à compléter", () => {
  it("ouvre la fiche de création du Mouvement (pas l'ancien éditeur) ; Terminer enregistre le Mouvement, revient à la Composition et pose l'Exercice « Paramètres à compléter », sans feuille ; la carte ouvre la feuille, puis, complète, l'éditeur", async () => {
    const router = renderApp();
    await settle();
    await openMenuAction(addToSession.newActivity);
    expect(router.getPathname()).toBe("/movement");
    expect(router.getSearchParams()).toMatchObject({ context: "session" });
    // [01/11/2026 (ch13 CE-T03-08) : titre « Créer un exercice », confirmation aussi — remplacé par la recette du 05/11 au soir
    // (r-creer : « Choisir ou créer un mouvement » ; m-valider : coche en haut, plus de bouton en bas).]
    expect(screen.queryByText(strings.screens.movement.titles.create)).toBeNull();
    expect(within(screen.getByTestId("screen-header")).getAllByText("Choisir ou créer un mouvement").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("movement-finish-action")).toBeNull();

    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Burpees");
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
    await settle(300);
    await act(async () => {
      fireEvent.press(screen.getByTestId("screen-header-validate"));
    });
    await settle(300);

    expect(router.getPathname()).toBe("/composition");
    const saved = await database.getAllAsync<{ id: string; name: string }>("SELECT id, name FROM movements WHERE name = 'Burpees'");
    expect(saved).toHaveLength(1);
    // Demande de Hermann du 29/10/2026 : aucune feuille à l'insertion ; carte à compléter (D-389).
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    expect(cardNames()).toEqual(["Burpees"]);
    // PRE-9 (01/11/2026, point 2) : Récupération du nouvel Exercice reprise du Profil (30 s par défaut), affichée sur la carte.
    expect(String(card("Burpees").props.accessibilityLabel)).toBe("Exercice, Burpees, 1 sur 1, récupération 30 s");
    expect(screen.getByText(strings.executionParameters.card.incomplete)).toBeTruthy();
    // Toucher la carte à compléter : la feuille de paramètres, par-dessus la Composition, sans l'éditeur.
    await tapCard("Burpees");
    expect(router.getPathname()).toBe("/composition");
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
    await setDuration45();
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    // 45 s, avec Compte à rebours et Fin du Profil : durée estimée de l'Exercice.
    // [« 1 min » avant le 01/11/2026 : la Récupération du Profil (30 s) s'ajoute désormais à la durée de l'Exercice.]
    expect(String(card("Burpees").props.accessibilityLabel)).toBe("Exercice, Burpees, 1 sur 1, 2 min, récupération 30 s");
    // [« Paramètres renseignés : la carte ouvre l'éditeur de l'Exercice, comme avant » — remplacé par la
    // recette iPhone n° 2 du 31/10/2026 (constat c) : la carte ouvre la feuille, la photo ouvre l'éditeur.]
    await tapCard("Burpees");
    expect(router.getPathname()).toBe("/composition");
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    await act(async () => undefined);
    fireEvent.press(screen.getByLabelText(composition.exerciseRow.openMovementAccessibilityLabel));
    await act(async () => undefined);
    // [« /exercise » (éditeur) — remplacé le 04/11/2026, décision de Hermann (recette iPhone du 04/11) : la
    // photo ouvre la fiche de l'Exercice en lecture seule (`/exercise-sheet`) : sans bouton d'action, synthèse
    // des paramètres non touchable, sections vides (Description, photo) absentes.]
    expect(router.getPathname()).toBe("/exercise-sheet");
    expect(router.getSearchParams()).toMatchObject({ exerciseId: expect.any(String) });
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    expect(screen.getByTestId("exercise-name-input").props.value).toBe("Burpees");
    expect(screen.getByTestId("exercise-name-input").props.editable).toBe(false);
    expect(screen.queryByTestId("exercise-sheet-finish-slot")).toBeNull();
    expect(screen.queryByTestId("exercise-parameters-card")).toBeNull();
    // Complément du 5 novembre 2026 (§10) : section « Dans cette séance » (Phrase et Récupération), à la place de la carte.
    expect(screen.getByTestId("exercise-section-in-this-session")).toBeTruthy();
    expect(screen.queryByTestId("exercise-section-description")).toBeNull();
    expect(screen.queryByTestId("movement-photo-template")).toBeNull();
    // Précision de Hermann du 04/11/2026 : zone de contexte gardée telle quelle (Catégorie, Zones).
    expect(screen.getByTestId("exercise-reference-row")).toBeTruthy();
    fireEvent.press(screen.getByTestId("exercise-parameters-phrase"));
    await act(async () => undefined);
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
  }, 40000);

  // PRE-9 CAT.2 et décision de Hermann du 30/10/2026 : « l'utilisateur doit simplement appuyer sur
  // la carte pour l'utiliser » — carte Composition, sans bouton.
  it("depuis une Séance, le toucher de la carte Composition reprend le Mouvement existant (aucun doublon) ; aucun bouton ; ARB-07 : après le dernier Exercice", async () => {
    await movements().create(movement("pompes", "Pompes"));
    await movements().create(movement("squats", "Squats"));
    const router = renderApp();
    await settle();
    // Premier Exercice [par la sélection — remplacé le 01/11/2026 : par la saisie du nom].
    await useExistingMovement("Squats", "squats");
    expect(screen.queryByTestId("execution-sheet")).toBeNull();

    await openMenuAction(addToSession.newActivity);
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Pompes");
    await settle();
    const result = await screen.findByTestId("movement-suggestion-result-pompes");
    expect(screen.queryByTestId("movement-suggestion-result-pompes-variant")).toBeNull();
    expect(screen.queryByTestId("movement-suggestion-result-pompes-use")).toBeNull();
    expect(within(result).queryByText(strings.screens.activities.editor.movementSuggestion.useMovement)).toBeNull();
    expect(result.props.accessibilityRole).toBe("button");
    expect(result.props.accessibilityHint).toBe(strings.screens.activities.editor.movementSuggestion.useMovement);
    await act(async () => {
      fireEvent.press(result);
    });
    await settle(300);
    // Recette du 05/11/2026 au soir (r-creer) : fiche du mouvement choisi, puis sa coche.
    expect(router.getPathname()).toBe("/movement");
    await act(async () => {
      fireEvent.press(within(await screen.findByTestId("movement-chosen-overlay")).getByTestId("screen-header-validate"));
    });
    await settle(300);

    expect(router.getPathname()).toBe("/composition");
    expect(await database.getAllAsync("SELECT id FROM movements WHERE name = 'Pompes'")).toHaveLength(1);
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    // Paramètres à compléter : l'Exercice est posé après le précédent.
    expect(cardNames()).toEqual(["Squats", "Pompes"]);
  }, 40000);
});

// Recette iPhone du 01/11/2026 (m11-menu, Hermann : « il faut intégrer de nouveau l'option du menu
// « utiliser un mouvement existant » ») : entrée rétablie (2e, après « Créer un exercice ») ; tests
// d'avant le 01/11 restaurés (ordre du Catalogue, sélection multiple, coin « dans la séance »).
describe("PRE-9 A.2 — « Utiliser un mouvement existant » : sélection par le Catalogue des Mouvements", () => {
  // [Test retiré — Complément du 5 novembre 2026 (§3) : « Utiliser des mouvements existants » retiré du menu Créer ; la reprise d'un mouvement existant passe par la fiche de création (suggestions, `useExistingMovement`).]
  // [Test retiré — Complément du 5 novembre 2026 (§3) : « Utiliser des mouvements existants » retiré du menu Créer ; la reprise d'un mouvement existant passe par la fiche de création (suggestions, `useExistingMovement`).]
});

// [« Utiliser un mouvement existant » : sélection par le Catalogue des Mouvements — entrée retirée du
// menu Créer le 01/11/2026 (ordre de Hermann, ch13 CE-T03-08). Ordre du Catalogue, sélection multiple
// et coin « dans la séance » ne sont plus atteints depuis la Composition ; l'écran de sélection reste
// couvert par `MovementSelectionScreen.cat1.test.tsx`.] [Rétablie le même jour (recette iPhone du
// 01/11/2026, m11-menu) : voir le bloc précédent. La reprise par la saisie du nom reste valable.]
describe("PRE-9 A.2 — Mouvements existants repris par « Créer un exercice » (01/11/2026)", () => {
  it("Mouvements repris par la saisie du nom → Exercices posés à compléter, dans l'ordre d'ajout ; chaque carte ouvre ses paramètres [« le menu ne propose plus « Utiliser un mouvement existant » » : remplacé par la recette du 01/11 (m11-menu)]", async () => {
    await movements().create(movement("gainage", "Gainage"));
    await movements().create(movement("abdos", "Abdos"));
    const router = renderApp();
    await settle();

    fireEvent.press(screen.getByLabelText(composition.addActivity));
    // Complément du 5 novembre 2026 (§3) : « Utiliser des mouvements existants » retiré du menu.
    expect(within(screen.getByTestId("composition-add-activity-tree")).queryByLabelText(addToSession.existingActivity)).toBeNull();
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-cancel"));
    await settle(300);

    await useExistingMovement("Abdos", "abdos");
    await useExistingMovement("Gainage", "gainage");

    expect(router.getPathname()).toBe("/composition");
    expect(cardNames()).toEqual(["Abdos", "Gainage"]);
    // Aucune feuille à l'insertion : les deux cartes sont à compléter.
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    expect(screen.getAllByText(strings.executionParameters.card.incomplete)).toHaveLength(2);
    // Carte touchée → ses paramètres : Abdos (✓), puis Gainage (✕ : laissé à compléter).
    await tapCard("Abdos");
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
    await setDuration45();
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    await tapCard("Gainage");
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    await settle(300);
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    expect(router.getPathname()).toBe("/composition");
    const [abdos, gainage] = screen.getAllByLabelText(new RegExp(`^${composition.occurrenceCard.accessibilityType}, `));
    // [« 1 min » avant le 01/11/2026 : Récupération du Profil (30 s) reprise par le nouvel Exercice.]
    expect(String(abdos!.props.accessibilityLabel)).toBe("Exercice, Abdos, 1 sur 2, 2 min, récupération 30 s");
    // Paramètres à compléter : aucune durée annoncée (D-389).
    expect(String(gainage!.props.accessibilityLabel)).toBe("Exercice, Gainage, 2 sur 2, récupération 30 s");
    // Aucun Mouvement créé ni modifié par la reprise.
    expect(await database.getAllAsync("SELECT id FROM movements")).toHaveLength(2);
  }, 40000);

  it("Annuler (le « + » transformé) revient à la Composition sans rien ajouter", async () => {
    await movements().create(movement("fentes", "Fentes"));
    const router = renderApp();
    await settle();
    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-cancel"));
    await settle(300);
    expect(screen.queryByTestId("composition-add-activity-tree")).toBeNull();
    expect(router.getPathname()).toBe("/composition");
    expect(cardNames()).toEqual([]);
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    expect(await database.getAllAsync("SELECT id FROM movements")).toHaveLength(1);
  }, 40000);
});
