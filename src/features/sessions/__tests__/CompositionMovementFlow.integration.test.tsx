import { router as expoRouter } from "expo-router";
import { act, fireEvent, renderRouter, screen, waitFor, within } from "expo-router/testing-library";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceProvider } from "@/features/activities/ActivityDefinitionServiceProvider";
import { chooseExecutionMode, enterExecutionSheetValue } from "@/features/activities/testing/executionSheetActions";
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
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { CreationRootStack } from "@/features/sessions/testing/CreationRootStack";

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


function renderApp(initialUrl = "/composition") {
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
      _layout: CreationRootStack,
      index: () => null,
      movement: require("../../../../app/movement").default,
      "(creation)/_layout": require("../../../../app/(creation)/_layout").default,
      "(creation)/composition": require("../../../../app/(creation)/composition").default,
      "(creation)/exercise": require("../../../../app/(creation)/exercise").default,
      // Recette iPhone du 04/11/2026 (décision de Hermann) : fiche de l'Exercice en lecture seule, ouverte par la photo.
      "(creation)/exercise-sheet": require("../../../../app/(creation)/exercise-sheet").default,
      // [PRE-9 A.3 du 04/11/2026 : route « activity-selection » retirée avec les anciennes définitions du Catalogue.]
      "(creation)/movement-selection": require("../../../../app/(creation)/movement-selection").default,
      "formats-window": require("../../../../app/formats-window").default,
    },
    { initialUrl, wrapper: Wrapper },
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
  // [Roue de la Cible commune (minutes, secondes, ✓) — remplacée le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]
  enterExecutionSheetValue("execution-sheet-target", 45);
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

  // Recette iPhone du 06/11/2026 (t-fiche-choix, Hermann : « il faut aussi que le résultat de la recherche disparaisse, que la Croix
  // se transforme en bouton retour, et que le nom du mouvement soit remplacé par celui du mouvement sélectionné et que le contenu soit
  // celui de la fiche sélectionnée et en lecture seule (catégorie, zone corporelle, niveau, média, description et phase). Appuyer sur
  // le bouton retour, ramène à la fiche de mouvement telle qu’elle était avant d’avoir sélectionné le mouvement du résultat de la
  // recherche, appuyer sur valider la ferme et on arrive à la composition de séance. »). Ce test ne vaut pas recette sur iPhone : la
  // superposition réelle des couches (zIndex) et le fondu restent à contrôler par Hermann.
  it("Exercice libre : toucher un résultat — résultats retirés, bouton Retour, fiche complète du mouvement choisi ; Retour restaure la saisie ; Valider → Composition avec l'exercice (t-fiche-choix)", async () => {
    await movements().create(movement("pompes", "Pompes", { description: "Mains au sol" }));
    await movements().createVariant(movement("pompes-genoux", "Pompes sur les genoux"), "pompes", "BEFORE_ORIGIN");
    const router = renderApp();
    await settle();
    await openMenuAction(addToSession.newActivity);
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Pomp");
    await settle();
    await act(async () => {
      fireEvent.press(await screen.findByTestId("movement-suggestion-result-pompes"));
    });
    await settle(300);

    const overlay = await screen.findByTestId("movement-chosen-overlay");
    // Résultats de la recherche retirés.
    expect(screen.queryByTestId("movement-suggestion-panel")).toBeNull();
    expect(screen.queryByTestId("movement-suggestion-result-pompes-genoux")).toBeNull();
    // La croix devient Retour (chevron standard) ; la coche Valider reste à droite.
    const back = within(overlay).getByTestId("screen-header-back");
    expect(back.props.accessibilityLabel).toBe(strings.screens.movement.back);
    const backIcon = within(overlay).UNSAFE_getAllByType(KodjoIcon).find((icon) => icon.props.testID === "screen-header-back-icon");
    expect(backIcon?.props.name).toBe("control-back");
    expect(within(overlay).getByTestId("screen-header-validate")).toBeTruthy();
    // Fiche complète du mouvement choisi, en lecture seule : nom, Catégorie, Zones, Niveau, Description.
    expect(within(overlay).getByTestId("exercise-name-input").props.value).toBe("Pompes");
    expect(within(overlay).getByTestId("exercise-name-input").props.editable).toBe(false);
    expect(within(overlay).getByTestId("activity-editor-category-button").props.accessibilityLabel).toMatch(/Cardio/i);
    expect(within(overlay).getByTestId("exercise-body-zones-label").props.children).toMatch(/Cuisses/i);
    expect(within(overlay).getByTestId("activity-editor-level").props.accessibilityLabel).toBe("Niveau 2");
    expect(within(overlay).getByDisplayValue("Mains au sol")).toBeTruthy();
    // La fiche choisie passe au-dessus des couches de l'éditeur de création (zone de contexte zIndex 1, résultats zIndex 2).
    const overlayStyle = StyleSheet.flatten(overlay.props.style) as { zIndex?: number };
    expect(overlayStyle.zIndex ?? 0).toBeGreaterThan(10);

    // Retour : fiche de création telle qu'avant le choix (nom tapé, résultats).
    await act(async () => {
      fireEvent.press(back);
    });
    await settle(300);
    expect(screen.queryByTestId("movement-chosen-overlay")).toBeNull();
    expect(router.getPathname()).toBe("/movement");
    expect(screen.getByTestId("exercise-name-input").props.value).toBe("Pomp");
    expect(screen.getByTestId("movement-suggestion-result-pompes")).toBeTruthy();

    // Nouveau choix, puis Valider : Composition avec l'exercice, sans doublon.
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-suggestion-result-pompes"));
    });
    await settle(300);
    await act(async () => {
      fireEvent.press(within(await screen.findByTestId("movement-chosen-overlay")).getByTestId("screen-header-validate"));
    });
    await settle(300);
    expect(router.getPathname()).toBe("/composition");
    expect(cardNames()).toEqual(["Pompes - N2"]);
    expect(await database.getAllAsync("SELECT id FROM movements")).toHaveLength(2);
  }, 40000);
});

// Recette iPhone du 01/11/2026 (m11-menu, Hermann : « il faut intégrer de nouveau l'option du menu
// « utiliser un mouvement existant » ») : entrée rétablie (2e, après « Créer un exercice ») ; tests
// d'avant le 01/11 restaurés (ordre du Catalogue, sélection multiple, coin « dans la séance »).
/**
 * Arbitrage de Hermann du 06/11/2026 (« A. Revenir à la modale avec tous les formats. »), après le constat : « j'appuie sur le bouton
 * créer, puis sur exercice libre, j'annule, et là, l'écran disparaît vers le bas, puis je tombe sur l'écran de composition de séance,
 * qui disparaît par la droite, pour tomber sur le catalogue » — n-cat-libre : « Annulée > Modale de Création d'un exercice […]
 * Annuler > Catalogue des séances ».
 */
describe("Catalogue → Créer → Exercice libre → Annuler (arbitrage du 06/11/2026, A)", () => {
  // Règle du 06/11/2026 (ordre des écrans, aucun écran ouvert par anticipation) : la modale s'ouvre au-dessus du Catalogue.
  it("la croix de la fiche revient à la modale « Créer un exercice » ; la croix de la modale revient au Catalogue ; aucune Composition ouverte", async () => {
    const router = renderApp("/");
    await settle();
    act(() => expoRouter.push("/formats-window"));
    await settle(300);
    expect(router.getPathname()).toBe("/formats-window");
    fireEvent.press(screen.getByTestId("formats-window-free-exercise"));
    await settle(300);
    expect(router.getPathname()).toBe("/movement");
    await act(async () => {
      fireEvent.press(screen.getByTestId("screen-header-back"));
    });
    await settle(300);
    expect(router.getPathname()).toBe("/formats-window");
    expect(screen.getByTestId("formats-window-free-exercise")).toBeTruthy();
    expect(screen.queryByTestId("composition-header", { includeHiddenElements: true })).toBeNull();
    act(() => fireEvent.press(screen.getByTestId("formats-window-close")));
    await settle(300);
    expect(router.getPathname()).toBe("/");
  }, 40000);

  it("depuis le Catalogue, mouvement choisi puis coche : les feuilles se retirent, la Composition s'ouvre avec l'exercice", async () => {
    await movements().create(movement("squats", "Squats"));
    const router = renderApp("/");
    await settle();
    act(() => expoRouter.push("/formats-window"));
    await settle(300);
    fireEvent.press(screen.getByTestId("formats-window-free-exercise"));
    await settle(300);
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Squats");
    await settle();
    await act(async () => {
      fireEvent.press(await screen.findByTestId("movement-suggestion-result-squats"));
    });
    await settle(300);
    await act(async () => {
      fireEvent.press(within(await screen.findByTestId("movement-chosen-overlay")).getByTestId("screen-header-validate"));
    });
    await settle(300);
    expect(router.getPathname()).toBe("/composition");
    expect(cardNames()).toEqual(["Squats"]);
  }, 40000);
});

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
