import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { NavigationContext } from "expo-router/react-navigation";
import type { ComponentProps } from "react";
import { StyleSheet } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { markMovementCreated, resetNewMovementMarks } from "@/features/activities/newMovementMarks";
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
 * - D-510 (remplace t-niveau) : badge « New » ; t-niveau : « il faut que la nouvelle fiche soit identifiée dans le catalogue des mouvements […] Ce cadre disparait après
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

let definitions: ActivityDefinitionService;

function renderScreen(navigation?: ComponentProps<typeof NavigationContext.Provider>["value"]) {
  definitions = new ActivityDefinitionService(undefined, undefined, undefined, undefined, movements());
  const service = { listCatalogueSessions: jest.fn(async () => []) } as unknown as SessionService;
  const screenTree = (
    <TestSafeAreaProvider>
      <SessionServiceContext.Provider value={service}>
        <ReferentialServiceContext.Provider value={referentials}>
          <ActivityDefinitionServiceContext.Provider value={definitions}>
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
  resetNewMovementMarks();
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  await movements().create(movement("gainage", "Gainage"));
});

afterEach(() => {
  database.close();
});

/** Fiche enregistrée par le service du Catalogue (bouton +, Ajouter un niveau, duplication) — puis retour au Catalogue. */
async function createWithService(id: string, name: string) {
  const outcome = await definitions.movementCatalogue!.createIndependent(movement(id, name));
  expect(outcome.status).toBe("SAVED");
  await focus();
}

describe("D-510 (06/11/2026) : badge « New » d'une fiche créée", () => {
  it("bouton + : la fiche créée porte « New » au retour ; ouvrir une fiche puis revenir le conserve ; plusieurs fiches à la fois", async () => {
    renderScreen();
    await focus();
    await press("catalogue-content-type-row-movements");
    // Fiche existante écrite sans création par l'utilisateur (données) : aucun badge.
    await movements().create(movement("autre", "Abdos"));
    await focus();
    expect(badges()).toEqual([]);
    await press("catalogue-create-action");
    expect(mockPush).toHaveBeenLastCalledWith("/movement");
    await createWithService("fentes", "Fentes avant");
    expect(badges()).toEqual(["fentes"]);
    await press("movement-card-gainage-card");
    await focus();
    expect(badges()).toEqual(["fentes"]);
    await createWithService("pompes", "Pompes");
    expect(badges().sort()).toEqual(["fentes", "pompes"]);
    expect(screen.getByLabelText("Fentes avant, nouveau")).toBeTruthy();
  });

  it("Ajouter un niveau : pile repliée — « New ↓ » sur la tête ; dépliée — « New » sur le niveau créé seulement", async () => {
    renderScreen();
    await focus();
    await press("catalogue-content-type-row-movements");
    const outcome = await definitions.movementCatalogue!.createVariant(movement("gainage-facile", "Gainage sur les genoux"), "gainage", "EASIER");
    expect(outcome.status).toBe("SAVED");
    await focus();
    expect(badges()).toEqual(["gainage"]);
    expect(screen.getByTestId("movement-card-badge-label-gainage").props.children).toBe("New ↓");
    expect(screen.getByLabelText(/contient un niveau nouveau$/)).toBeTruthy();
    // Aucun dépliage automatique : la pile reste repliée.
    expect(screen.getByTestId("movement-pile-" + "grp-1")).toBeTruthy();
    await press("movement-card-gainage-card");
    expect(badges()).toEqual(["gainage-facile"]);
    expect(screen.getByTestId("movement-card-badge-label-gainage-facile").props.children).toBe("New");
  });

  it("création depuis la Composition (catalogue des séances affiché) : badge à la visite suivante du catalogue des mouvements", async () => {
    const tabs = fakeTabNavigation();
    renderScreen(tabs.navigation);
    await focus();
    // Séance enregistrée avec une fiche créée depuis la Composition (`SessionService` marque les fiches `NEW`).
    await movements().create(movement("burpees", "Burpees"));
    markMovementCreated("burpees");
    // Changer d'onglet avant d'avoir vu le catalogue des mouvements ne retire rien.
    await tabs.blur(1);
    await focus();
    await press("catalogue-content-type-row-movements");
    expect(badges()).toEqual(["burpees"]);
    await press("catalogue-content-type-row-sessions");
    await press("catalogue-content-type-row-movements");
    expect(badges()).toEqual([]);
  });

  it("changer de vue par la barre du haut retire le badge", async () => {
    renderScreen();
    await focus();
    await press("catalogue-content-type-row-movements");
    await createWithService("fentes", "Fentes avant");
    expect(badges()).toEqual(["fentes"]);
    await press("catalogue-content-type-row-sessions");
    await press("catalogue-content-type-row-movements");
    expect(badges()).toEqual([]);
  });

  it("changer d'onglet par la barre du bas retire le badge ; une fiche ouverte au-dessus des onglets, non", async () => {
    const tabs = fakeTabNavigation();
    renderScreen(tabs.navigation);
    await focus();
    await press("catalogue-content-type-row-movements");
    await createWithService("fentes", "Fentes avant");
    await tabs.blur(0);
    expect(badges()).toEqual(["fentes"]);
    await tabs.blur(1);
    expect(badges()).toEqual([]);
  });

  it("fermeture de l'application : rien n'est persisté — le badge disparaît au redémarrage", async () => {
    renderScreen();
    await focus();
    await press("catalogue-content-type-row-movements");
    await createWithService("fentes", "Fentes avant");
    expect(badges()).toEqual(["fentes"]);
    // Redémarrage : la mémoire est vidée (le marquage n'existe nulle part ailleurs) ; la base garde la fiche, sans marque.
    resetNewMovementMarks();
    screen.unmount();
    renderScreen();
    await focus();
    await press("catalogue-content-type-row-movements");
    expect(screen.getByTestId("movement-card-fentes")).toBeTruthy();
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
