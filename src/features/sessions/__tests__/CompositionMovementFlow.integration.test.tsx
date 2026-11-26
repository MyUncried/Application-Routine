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
  fireEvent.press(screen.getByLabelText(strings.shared.floatingCreate.openCreateMenu));
  fireEvent.press(within(screen.getByTestId("composition-add-activity-tree")).getByLabelText(label));
  await settle(300);
  // Complément du 5 novembre 2026 (§1, §3) : « Créer un exercice » ouvre la modale de création ; « Exercice libre » ouvre la
  // fiche de création (mouvement, puis paramètres).
  if (label === addToSession.newActivity) {
    fireEvent.press(screen.getByTestId("formats-window-free-exercise"));
    await settle(300);
  }
}

/**
 * D-608 (D-573 point 5, 26/11/2026 ; Formats § 9.10) : reprendre un Mouvement existant par « Créer un exercice » → Libre → écran
 * « Exercice libre — Choix du mouvement » (toucher de sa carte, ✓) → page « Exercice libre » (Mode Durée, 45 s) → ✓.
 * [01/11/2026 : saisie du nom dans la fiche de création, toucher de la carte de suggestion, coche de la fiche choisie ; Exercice posé
 * « Paramètres à compléter » — remplacé le 26/11/2026.]
 */
async function useExistingMovement(id: string) {
  await openMenuAction(addToSession.newActivity);
  fireEvent.press(await screen.findByTestId(`free-exercise-card-${id}`));
  await act(async () => {
    fireEvent.press(screen.getByTestId("free-exercise-choice-validate"));
  });
  await settle(300);
  await validateFreePage();
}

/** Page « Exercice libre » : Mode Durée, 45 s, ✓ (exercice remis à la Composition). */
async function validateFreePage() {
  expect(screen.getByTestId("execution-sheet-page")).toBeTruthy();
  chooseExecutionMode("Durée");
  enterExecutionSheetValue("execution-sheet-target", 45);
  await act(async () => {
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
  });
  await settle(300);
}

/** D-608 : nom saisi sur le choix du mouvement, validé par la touche Entrée (nom inexistant : fiche de création). */
async function submitFreeName(name: string) {
  fireEvent.changeText(screen.getByTestId("free-exercise-search"), name);
  await act(async () => {
    fireEvent(screen.getByTestId("free-exercise-search"), "submitEditing");
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

describe("PRE-9 A.2 — « Créer un exercice » [« Créer un nouveau mouvement » avant le 01/11/2026] : création d'un Mouvement, puis carte à compléter", () => {
  // [« Terminer enregistre le Mouvement, revient à la Composition et pose l'Exercice « Paramètres à compléter », sans feuille ; la carte
  // ouvre la feuille » — remplacé le 26/11/2026 (D-608, D-573 point 5) : un nom inexistant validé sur le choix du mouvement ouvre la
  // fiche de création avec ce nom ; enregistrée, elle ouvre la page « Exercice libre », dont le ✓ remet l'exercice réglé.]
  it("D-608 — nom inexistant validé : fiche de création avec ce nom ; enregistrée : page « Exercice libre » ; ✓ : Composition avec l'exercice réglé ; la carte ouvre la modale commune, la photo la fiche", async () => {
    const router = renderApp();
    await settle();
    await openMenuAction(addToSession.newActivity);
    expect(router.getPathname()).toBe("/formats-window");
    expect(screen.getByTestId("free-exercise-choice")).toBeTruthy();
    expect(screen.queryByText(/Créer un mouvement/)).toBeNull();
    await submitFreeName("Burpees");
    expect(router.getPathname()).toBe("/movement");
    expect(router.getSearchParams()).toMatchObject({ context: "free", name: "Burpees" });
    expect(within(screen.getByTestId("screen-header")).getAllByText("Choisir ou créer un mouvement").length).toBeGreaterThan(0);
    expect(screen.getByTestId("exercise-name-input").props.value).toBe("Burpees");

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

    // D-608 : le mouvement enregistré revient au choix du mouvement, qui ouvre la page « Exercice libre ».
    expect(router.getPathname()).toBe("/formats-window");
    const saved = await database.getAllAsync<{ id: string; name: string }>("SELECT id, name FROM movements WHERE name = 'Burpees'");
    expect(saved).toHaveLength(1);
    expect(screen.getByTestId("execution-sheet-title")).toHaveTextContent("Exercice libre");
    await validateFreePage();

    expect(router.getPathname()).toBe("/composition");
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    expect(cardNames()).toEqual(["Burpees"]);
    // Réglé sur la page : carte complète, Récupération 30″ de la page (D-608). [Carte « Paramètres à compléter », sans Récupération — remplacé.]
    expect(screen.queryByText(strings.executionParameters.card.incomplete)).toBeNull();
    expect(String(card("Burpees").props.accessibilityLabel)).toMatch(/^Exercice, Burpees, 1 sur 1, .*récupération 30 secondes$/);
    // La carte ouvre la modale « Paramètres d'exécution » commune (titre = nom du mouvement), pas la page « Exercice libre ».
    await tapCard("Burpees");
    expect(router.getPathname()).toBe("/composition");
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
    expect(screen.getByTestId("execution-sheet-title")).toHaveTextContent("Burpees");
    expect(screen.queryByTestId("execution-sheet-free-context")).toBeNull();
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
  // [Toucher de la carte de suggestion de la fiche de création — remplacé le 26/11/2026 (D-608) : carte du choix du mouvement, puis page.]
  it("D-608 — mouvement existant choisi sur le choix du mouvement : repris sans doublon ; ARB-07 : après le dernier Exercice", async () => {
    await movements().create(movement("pompes", "Pompes"));
    await movements().create(movement("squats", "Squats"));
    const router = renderApp();
    await settle();
    await useExistingMovement("squats");
    await useExistingMovement("pompes");
    expect(router.getPathname()).toBe("/composition");
    expect(await database.getAllAsync("SELECT id FROM movements WHERE name = 'Pompes'")).toHaveLength(1);
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    expect(cardNames()).toEqual(["Squats", "Pompes"]);
  }, 40000);

  // Recette iPhone du 06/11/2026 (t-fiche-choix, Hermann : « il faut aussi que le résultat de la recherche disparaisse, que la Croix
  // se transforme en bouton retour, et que le nom du mouvement soit remplacé par celui du mouvement sélectionné et que le contenu soit
  // celui de la fiche sélectionnée et en lecture seule (catégorie, zone corporelle, niveau, média, description et phase). Appuyer sur
  // le bouton retour, ramène à la fiche de mouvement telle qu’elle était avant d’avoir sélectionné le mouvement du résultat de la
  // recherche, appuyer sur valider la ferme et on arrive à la composition de séance. »). Ce test ne vaut pas recette sur iPhone : la
  // superposition réelle des couches (zIndex) et le fondu restent à contrôler par Hermann.
  // D-608 (26/11/2026) : la fiche de création s'ouvre désormais par un nom inexistant validé sur le choix du mouvement ; son Valider
  // ouvre la page « Exercice libre », dont le ✓ remet l'exercice. [Fiche ouverte directement par la carte Libre — remplacé.]
  it("Exercice libre (fiche de création ouverte par un nom inexistant) : toucher un résultat — résultats retirés, bouton Retour, fiche complète du mouvement choisi ; Retour restaure la saisie ; Valider → page « Exercice libre » → Composition avec l'exercice (t-fiche-choix)", async () => {
    await movements().create(movement("pompes", "Pompes", { description: "Mains au sol" }));
    await movements().createVariant(movement("pompes-genoux", "Pompes sur les genoux"), "pompes", "BEFORE_ORIGIN");
    const router = renderApp();
    await settle();
    await openMenuAction(addToSession.newActivity);
    await submitFreeName("Pomp");
    expect(router.getPathname()).toBe("/movement");
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
    // D-608 : le mouvement choisi revient au choix du mouvement, qui ouvre la page.
    expect(router.getPathname()).toBe("/formats-window");
    await validateFreePage();
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
  // [« la croix de la fiche revient à la modale » — remplacé le 26/11/2026 (D-608) : la croix du choix du mouvement rend le contenu de
  // la modale « Créer un exercice » (même feuille).]
  it("D-608 — la croix du choix du mouvement revient à la modale « Créer un exercice » ; la croix de la modale revient au Catalogue ; aucune Composition ouverte", async () => {
    const router = renderApp("/");
    await settle();
    act(() => expoRouter.push("/formats-window"));
    await settle(300);
    expect(router.getPathname()).toBe("/formats-window");
    fireEvent.press(screen.getByTestId("formats-window-free-exercise"));
    await settle(300);
    expect(router.getPathname()).toBe("/formats-window");
    expect(screen.getByTestId("free-exercise-choice")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId("free-exercise-choice-cancel"));
    });
    await settle(300);
    expect(router.getPathname()).toBe("/formats-window");
    expect(screen.getByTestId("formats-window-free-exercise")).toBeTruthy();
    expect(screen.queryByTestId("composition-header", { includeHiddenElements: true })).toBeNull();
    act(() => fireEvent.press(screen.getByTestId("formats-window-close")));
    await settle(300);
    expect(router.getPathname()).toBe("/");
  }, 40000);

  it("depuis le Catalogue, mouvement choisi puis page validée : les feuilles se retirent, la Composition s'ouvre avec l'exercice", async () => {
    await movements().create(movement("squats", "Squats"));
    const router = renderApp("/");
    await settle();
    act(() => expoRouter.push("/formats-window"));
    await settle(300);
    fireEvent.press(screen.getByTestId("formats-window-free-exercise"));
    await settle(300);
    fireEvent.press(await screen.findByTestId("free-exercise-card-squats"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("free-exercise-choice-validate"));
    });
    await settle(300);
    await validateFreePage();
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
  it("D-608 — mouvements repris par le choix du mouvement → Exercices réglés, dans l'ordre d'ajout ; chaque carte ouvre la modale commune", async () => {
    await movements().create(movement("gainage", "Gainage"));
    await movements().create(movement("abdos", "Abdos"));
    const router = renderApp();
    await settle();

    fireEvent.press(screen.getByLabelText(strings.shared.floatingCreate.openCreateMenu));
    // Complément du 5 novembre 2026 (§3) : « Utiliser des mouvements existants » retiré du menu.
    expect(within(screen.getByTestId("composition-add-activity-tree")).queryByLabelText(addToSession.existingActivity)).toBeNull();
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-cancel"));
    await settle(300);

    // D-608 (26/11/2026) : chaque exercice est réglé sur sa page « Exercice libre » avant d'entrer dans la Composition. [Exercices posés
    // « Paramètres à compléter », réglés ensuite par la carte — remplacé.]
    await useExistingMovement("abdos");
    await useExistingMovement("gainage");

    expect(router.getPathname()).toBe("/composition");
    expect(cardNames()).toEqual(["Abdos", "Gainage"]);
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    expect(screen.queryByText(strings.executionParameters.card.incomplete)).toBeNull();
    // Chaque carte ouvre la modale « Paramètres d'exécution » commune.
    for (const name of ["Abdos", "Gainage"]) {
      await tapCard(name);
      expect(screen.getByTestId("execution-sheet-title")).toHaveTextContent(name);
      fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
      await settle(300);
      expect(screen.queryByTestId("execution-sheet")).toBeNull();
    }
    expect(router.getPathname()).toBe("/composition");
    const [abdos, gainage] = screen.getAllByLabelText(new RegExp(`^${composition.occurrenceCard.accessibilityType}, `));
    expect(String(abdos!.props.accessibilityLabel)).toMatch(/^Exercice, Abdos, 1 sur 2, .*récupération 30 secondes$/);
    expect(String(gainage!.props.accessibilityLabel)).toMatch(/^Exercice, Gainage, 2 sur 2, .*récupération 30 secondes$/);
    // Aucun Mouvement créé ni modifié par la reprise.
    expect(await database.getAllAsync("SELECT id FROM movements")).toHaveLength(2);
  }, 40000);

  it("Annuler (le « + » transformé) revient à la Composition sans rien ajouter", async () => {
    await movements().create(movement("fentes", "Fentes"));
    const router = renderApp();
    await settle();
    fireEvent.press(screen.getByLabelText(strings.shared.floatingCreate.openCreateMenu));
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-cancel"));
    await settle(300);
    expect(screen.queryByTestId("composition-add-activity-tree")).toBeNull();
    expect(router.getPathname()).toBe("/composition");
    expect(cardNames()).toEqual([]);
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    expect(await database.getAllAsync("SELECT id FROM movements")).toHaveLength(1);
  }, 40000);
});
