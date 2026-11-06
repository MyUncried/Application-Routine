import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { NavigationContext } from "expo-router/react-navigation";
import type { ComponentProps } from "react";
import { StyleSheet } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CatalogueScreen } from "@/features/sessions/CatalogueScreen";
import type { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Recette iPhone du 06/11/2026 (Hermann) — écran du Catalogue :
 * - t-niveau : « il faut que la nouvelle fiche soit identifiée dans le catalogue des mouvements […] Ce cadre disparait après
 *   avoir changé de vue à partir de la barre de navigation du haut (mouvement, séance, programme) ou de la barre de
 *   navigation du bas. » ;
 * - t-catalogue : le symbole Trier s'affiche avec son cercle, sans chargement différé.
 */

jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

const focusEffectHarness: { effect: (() => (() => void) | void) | null } = { effect: null };
const mockPush = jest.fn();
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useFocusEffect: (effect: () => (() => void) | void) => {
      focusEffectHarness.effect = effect;
    },
    useRouter: () => ({ push: mockPush, setParams: jest.fn() }),
    useLocalSearchParams: () => ({}),
  };
});

const NOW = "2026-11-06T09:00:00.000Z";
let database: NodeSqliteDatabase;
let sequence = 0;
const movements = () => new SqliteMovementRepository(database, () => `grp-${++sequence}`, () => NOW);

const movement = (id: string, name: string): Movement => ({
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
});

const referentials = {
  listCategories: jest.fn(async () => []),
  listBodyZones: jest.fn(async () => []),
  listLabels: jest.fn(async () => []),
} as unknown as ReferentialService;

/** Navigation simulée de l'onglet du Catalogue : écouteurs de `blur` et état du navigateur d'onglets. */
function fakeTabNavigation() {
  const listeners: (() => void)[] = [];
  const tabs = { index: 0, routes: [{ name: "index" }, { name: "calendar" }] };
  const navigation = {
    addListener: (_type: string, listener: () => void) => {
      listeners.push(listener);
      return () => undefined;
    },
    getState: () => tabs,
  };
  return {
    navigation: navigation as unknown as ComponentProps<typeof NavigationContext.Provider>["value"],
    blur: (focusedTab: number) =>
      act(() => {
        tabs.index = focusedTab;
        listeners.forEach((listener) => listener());
      }),
  };
}

function renderScreen(navigation?: ComponentProps<typeof NavigationContext.Provider>["value"]) {
  const service = { listCatalogueSessions: jest.fn(async () => []) } as unknown as SessionService;
  const screenTree = (
    <TestSafeAreaProvider>
      <SessionServiceContext.Provider value={service}>
        <ReferentialServiceContext.Provider value={referentials}>
          <ActivityDefinitionServiceContext.Provider
            value={new ActivityDefinitionService(undefined, undefined, undefined, undefined, movements())}
          >
            <CatalogueScreen />
          </ActivityDefinitionServiceContext.Provider>
        </ReferentialServiceContext.Provider>
      </SessionServiceContext.Provider>
    </TestSafeAreaProvider>
  );
  render(navigation === undefined ? screenTree : <NavigationContext.Provider value={navigation}>{screenTree}</NavigationContext.Provider>);
}

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
async function focus() {
  await act(async () => {
    focusEffectHarness.effect?.();
  });
  await settle();
}
const press = async (testID: string) => {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
  await settle();
};
const badges = () => screen.queryAllByTestId(/^movement-card-new-/).map((node) => (node.props.testID as string).replace("movement-card-new-", ""));

beforeEach(async () => {
  mockPush.mockClear();
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  await movements().create(movement("gainage", "Gainage"));
});

afterEach(() => {
  database.close();
});

/** Créer depuis le Catalogue des Mouvements, puis enregistrer la fiche (simulé) et revenir. */
async function createFromCatalogue(id: string, name: string) {
  await press("catalogue-create-action");
  expect(mockPush).toHaveBeenLastCalledWith("/movement");
  await movements().create(movement(id, name));
  await focus();
}

describe("t-niveau (06/11/2026) : pastille « NEW » d'un Mouvement créé depuis le Catalogue", () => {
  it("Créer : le nouveau Mouvement porte « NEW » au retour ; un Mouvement créé hors du Catalogue, non", async () => {
    renderScreen();
    await focus();
    await press("catalogue-content-type-row-movements");
    // Création hors du Catalogue (par exemple depuis une Séance) : aucune pastille.
    await movements().create(movement("autre", "Abdos"));
    await focus();
    expect(badges()).toEqual([]);
    await createFromCatalogue("fentes", "Fentes avant");
    expect(badges()).toEqual(["fentes"]);
    // Ouvrir une fiche puis revenir : la pastille reste.
    await press("movement-card-gainage-card");
    await focus();
    expect(badges()).toEqual(["fentes"]);
  });

  it("Ajouter un niveau : le nouveau niveau porte « NEW »", async () => {
    renderScreen();
    await focus();
    await press("catalogue-content-type-row-movements");
    const row = screen.getByTestId("movement-card-gainage");
    await act(async () => {
      fireEvent(row, "touchStart", { nativeEvent: { pageX: 300, pageY: 10 } });
      fireEvent(row, "touchMove", { nativeEvent: { pageX: 60, pageY: 12 } });
      fireEvent(row, "touchEnd", { nativeEvent: { pageX: 60, pageY: 12 } });
    });
    await press("movement-card-gainage-action-variant");
    await press("movement-card-gainage-easier");
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/movement", params: { variantOf: "gainage", placement: "BEFORE_ORIGIN" } });
    // Fiche du nouveau niveau enregistrée (simulé), retour au Catalogue.
    await movements().createVariant(movement("gainage-facile", "Gainage sur les genoux"), "gainage", "BEFORE_ORIGIN");
    await focus();
    // Nouvelle pile repliée : sa carte du dessus annonce le niveau nouveau masqué ; dépliée, la pastille est sur lui.
    expect(badges()).toEqual(["gainage"]);
    await press("movement-card-gainage-card");
    expect(badges()).toEqual(["gainage-facile"]);
  });

  it("changer de vue par la barre du haut retire les pastilles", async () => {
    renderScreen();
    await focus();
    await press("catalogue-content-type-row-movements");
    await createFromCatalogue("fentes", "Fentes avant");
    expect(badges()).toEqual(["fentes"]);
    await press("catalogue-content-type-row-sessions");
    await press("catalogue-content-type-row-movements");
    expect(badges()).toEqual([]);
  });

  it("changer d'onglet par la barre du bas retire les pastilles ; ouvrir une fiche au-dessus des onglets, non", async () => {
    const tabs = fakeTabNavigation();
    renderScreen(tabs.navigation);
    await focus();
    await press("catalogue-content-type-row-movements");
    await createFromCatalogue("fentes", "Fentes avant");
    // Fiche ouverte au-dessus des onglets : l'onglet du Catalogue reste l'onglet actif.
    await tabs.blur(0);
    expect(badges()).toEqual(["fentes"]);
    // Onglet Calendrier choisi dans la barre du bas.
    await tabs.blur(1);
    expect(badges()).toEqual([]);
  });
});

describe("t-catalogue (06/11/2026) : symbole Trier dessiné avec son cercle", () => {
  it("le pictogramme Trier est tracé en vues (aucune image chargée à part), 20 × 20", async () => {
    renderScreen();
    await focus();
    const icon = screen.getByTestId("catalogue-sort-action-icon");
    expect(icon.props.source).toBeUndefined();
    expect(StyleSheet.flatten(icon.props.style)).toMatchObject({ width: 20, height: 20 });
    // Axe et quatre branches de chevron.
    expect(icon.children).toHaveLength(5);
  });
});
