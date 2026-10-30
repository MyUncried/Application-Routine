import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Activity } from "@/domain/sessions/Session";
import type { CatalogueSessionRecord } from "@/domain/sessions/SessionRepository";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CatalogueScreen } from "@/features/sessions/CatalogueScreen";
import type { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-9 CAT.1 (spécification « Zones de contexte des Catalogues » du 30/10/2026 ; CE-CAT-CTX-01 ;
 * Figma `10266:20575`, `10465:23141`, `10495:24099`, `1992:9910`, `4549:6742`) — zones de contexte
 * dans l'écran : géométrie de la bande, compteurs « N familles · N mouvements » activables et
 * exclusifs, « Un exercice N | Plusieurs N » informatifs, « N résultats » en état filtré ou archivé,
 * recherche combinée, données réelles (Mouvements sur une base SQLite réelle).
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

const NOW = "2026-10-30T09:00:00.000Z";
let database: NodeSqliteDatabase;
let sequence = 0;
const movements = () => new SqliteMovementRepository(database, () => `grp-${++sequence}`, () => NOW);
const activityService = () =>
  new ActivityDefinitionService(
    new SqliteActivityDefinitionRepository(database, () => `def-${++sequence}`, () => NOW),
    undefined,
    undefined,
    undefined,
    undefined,
    movements(),
  );

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

/** Famille Squats assistés (1) / Squats (2) / Squats sautés (3) ; Fentes avant et Gainage indépendants. */
async function seedMovements() {
  const repository = movements();
  await repository.create(movement("squat", "Squats"));
  await repository.create(movement("fentes", "Fentes avant"));
  await repository.create(movement("gainage", "Gainage"));
  await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
  await repository.createVariant(movement("jump", "Squats sautés"), "squat", "AFTER_ORIGIN");
}

const exercise = (): Activity => ({
  id: `ex-${++sequence}`,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  position: 0,
  name: "Ex",
  executionParameters: durationParameters(30),
  postActivityRecoverySeconds: null,
  instruction: null,
  bodyZoneIds: [],
  categoryId: null,
  media: [],
});

const record = (id: string, name: string, count: number, status: "ACTIVE" | "ARCHIVED" = "ACTIVE"): CatalogueSessionRecord => ({
  id,
  name,
  color: "#3B82F6",
  labelId: null,
  status,
  archivedAt: null,
  updatedAt: "2026-10-30T08:00:00.000Z",
  structure: { elements: Array.from({ length: count }, () => ({ kind: "EXERCISE" as const, exercise: exercise() })), stopPoints: [] },
});

const SESSIONS = [
  record("genou", "Renforcement du genou", 5),
  record("emom", "EMOM du matin", 1),
  record("tabata", "Tabata gainage", 1),
  record("mobilite", "Mobilité du matin", 3, "ARCHIVED"),
  record("etirements", "Étirements après course", 1, "ARCHIVED"),
];

const referentials = {
  listCategories: jest.fn(async () => []),
  listBodyZones: jest.fn(async () => []),
  listLabels: jest.fn(async () => []),
} as unknown as ReferentialService;

function renderScreen(sessions: readonly CatalogueSessionRecord[] = SESSIONS) {
  const service = { listCatalogueSessions: jest.fn(async () => sessions) } as unknown as SessionService;
  render(
    <TestSafeAreaProvider>
      <SessionServiceContext.Provider value={service}>
        <ReferentialServiceContext.Provider value={referentials}>
          <ActivityDefinitionServiceContext.Provider value={activityService()}>
            <CatalogueScreen />
          </ActivityDefinitionServiceContext.Provider>
        </ReferentialServiceContext.Provider>
      </SessionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
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

const sessionsShown = () =>
  screen.queryAllByTestId(/^catalogue-session-item-(?!.*-content$)/).map((node) => (node.props.testID as string).replace("catalogue-session-item-", ""));
const movementsShown = () => screen.queryAllByTestId(/^movement-card-name-/).map((node) => node.props.children as string);
const text = (testID: string) => screen.getByTestId(testID).props.children as string;
const searchWidth = (testID: string) => StyleSheet.flatten(screen.getByTestId(`${testID}-field`).props.style).width;
/**
 * Recette iPhone du 30/10/2026 (Hermann, cat-commandes : « le champ de la zone de recherche est trop
 * raccourci, il faut qu'il conserve le même espace qu'entre deux boutons d'action ») : en état filtré
 * ou archivé, le champ s'étend jusqu'à la commande Filtre, à l'écart 12 des commandes, sans descendre
 * sous 107.
 */
function expectSearchFillsToFilter(testID: string) {
  expect(StyleSheet.flatten(screen.getByTestId(`${testID}-field`).props.style)).toMatchObject({ flexGrow: 1, flexBasis: 0, minWidth: 107 });
  expect(searchWidth(testID)).toBeUndefined();
  expect(StyleSheet.flatten(screen.getByTestId("catalogue-command-row").props.style).gap).toBe(12);
  expect(StyleSheet.flatten(screen.getByTestId("catalogue-context-commands").props.style).gap).toBe(12);
}

beforeEach(async () => {
  mockPush.mockClear();
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
});

afterEach(() => {
  database.close();
});

describe("PRE-9 CAT.1 — géométrie de la zone de contexte (référence 402 × 874)", () => {
  it("bande de 115, ligne 1 à 26 sous son haut (y = 118) et retrait de 8 (x = 24) ; ligne 2 de 44 à 8 du bas (y = 155) ; titre masqué", async () => {
    renderScreen();
    await focus();
    const band = StyleSheet.flatten(screen.getByTestId("screen-context-band").props.style);
    expect(band).toMatchObject({ height: 115, paddingTop: 26, paddingBottom: 8, paddingHorizontal: 16 });
    expect(StyleSheet.flatten(screen.getByTestId("catalogue-context-zone").props.style)).toMatchObject({
      flex: 1,
      justifyContent: "space-between",
    });
    expect(StyleSheet.flatten(screen.getByTestId("catalogue-context-line1").props.style)).toMatchObject({
      height: 17,
      paddingHorizontal: 8,
    });
    expect(StyleSheet.flatten(screen.getByTestId("catalogue-command-row").props.style)).toMatchObject({ height: 44, gap: 12 });
    expect(screen.queryByText("Catalogue des séances")).toBeNull();
    expect(within(screen.getByTestId("screen-header")).getByTestId("catalogue-content-type-row")).toBeTruthy();
  });

  it("champ Rechercher 216 × 44, placeholder « Rechercher » 15 pt #7A7A80 ; Filtre, Tri, Créer 34 avec cibles 44 × 44", async () => {
    renderScreen();
    await focus();
    expect(searchWidth("session-catalogue-search")).toBe(216);
    const field = screen.getByTestId("session-catalogue-search");
    expect(field.props.placeholder).toBe("Rechercher");
    expect(field.props.placeholderTextColor).toBe("#7A7A80");
    expect(StyleSheet.flatten(field.props.style)).toMatchObject({ fontSize: 15, height: 44 });
    expect(StyleSheet.flatten(screen.getByTestId("session-catalogue-search-field").props.style).height).toBe(44);
    for (const testID of ["catalogue-filter-action", "catalogue-sort-action", "catalogue-create-action"]) {
      const action = screen.getByTestId(testID);
      const style = StyleSheet.flatten(action.props.style);
      expect(style).toMatchObject({ width: 34, height: 34 });
      expect(style.width + action.props.hitSlop.left + action.props.hitSlop.right).toBe(44);
      expect(style.height + action.props.hitSlop.top + action.props.hitSlop.bottom).toBe(44);
    }
    // Écart 12 entre commandes = 2 × 5 de débord de cible + 2 : aucun recouvrement des cibles voisines.
    expect(StyleSheet.flatten(screen.getByTestId("catalogue-context-commands").props.style).gap).toBe(12);
  });
});

describe("PRE-9 CAT.1 — Catalogue des Séances", () => {
  it("« Un exercice N | Plusieurs N » : nombres réels, informatifs, hors de la cible ; bascule et désélection inchangées", async () => {
    renderScreen();
    await focus();
    expect(text("catalogue-session-view-SINGLE-count")).toBe("2");
    expect(text("catalogue-session-view-MULTIPLE-count")).toBe("1");
    // Les nombres ne sont pas des commandes : texte simple, hors du `Pressable` du libellé.
    const count = screen.getByTestId("catalogue-session-view-SINGLE-count");
    expect(count.props.onPress).toBeUndefined();
    expect(count.props.accessibilityRole).toBeUndefined();
    expect(within(screen.getByTestId("catalogue-session-view-SINGLE")).queryByTestId("catalogue-session-view-SINGLE-count")).toBeNull();
    expect(StyleSheet.flatten(count.props.style)).toMatchObject({ fontSize: 14, color: "#333333" });
    const label = () => screen.getByTestId("catalogue-session-view-SINGLE");
    expect(StyleSheet.flatten(within(label()).getByText("Un exercice").props.style)).toMatchObject({ fontSize: 14, color: "#595E66" });
    expect(StyleSheet.flatten(screen.getByTestId("catalogue-session-view-separator").props.style).color).toBe("#9499A8");

    await press("catalogue-session-view-SINGLE");
    expect(sessionsShown()).toEqual(["emom", "tabata"]);
    expect(label().props.accessibilityState).toEqual({ selected: true });
    expect(StyleSheet.flatten(within(label()).getByText("Un exercice").props.style)).toMatchObject({
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
    });
    // Le choix de vue ne change pas les nombres ; aucun « N résultats » sans filtre.
    expect(text("catalogue-session-view-SINGLE-count")).toBe("2");
    expect(screen.queryByTestId("catalogue-results")).toBeNull();
    await press("catalogue-session-view-MULTIPLE");
    expect(sessionsShown()).toEqual(["genou"]);
    await press("catalogue-session-view-MULTIPLE");
    expect(sessionsShown()).toEqual(["genou", "emom", "tabata"]);
  });

  it("recherche combinée à la vue ; les nombres suivent la collection recherchée", async () => {
    renderScreen();
    await focus();
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("session-catalogue-search"), "matin");
    });
    expect(sessionsShown()).toEqual(["emom"]);
    expect(text("catalogue-session-view-SINGLE-count")).toBe("1");
    expect(text("catalogue-session-view-MULTIPLE-count")).toBe("0");
    await press("catalogue-session-view-MULTIPLE");
    expect(screen.getByTestId("catalogue-session-no-match")).toHaveTextContent("Aucune séance ne correspond à la recherche.");
  });

  it("archivées : champ étendu jusqu'à Filtre (≥ 107) et « N résultats » recalculé en direct après recherche et vue (2, 1, 0)", async () => {
    renderScreen();
    await focus();
    await press("catalogue-filter-action");
    fireEvent.press(screen.getByTestId("session-filter-status-archived"));
    await press("session-filter-apply");
    expect(sessionsShown()).toEqual(["mobilite", "etirements"]);
    expectSearchFillsToFilter("session-catalogue-search");
    expect(text("catalogue-results")).toBe("2 résultats");
    expect(StyleSheet.flatten(screen.getByTestId("catalogue-results").props.style)).toMatchObject({ fontSize: 14, color: "#333333" });
    await press("catalogue-session-view-SINGLE");
    expect(text("catalogue-results")).toBe("1 résultat");
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("session-catalogue-search"), "zzz");
    });
    expect(text("catalogue-results")).toBe("0 résultat");
    // Réinitialiser les filtres : champ pleine largeur, plus de « N résultats » ; recherche et vue conservées.
    await press("catalogue-filter-action-clear");
    expect(screen.queryByTestId("catalogue-results")).toBeNull();
    expect(searchWidth("session-catalogue-search")).toBe(216);
    expect(screen.getByTestId("session-catalogue-search").props.value).toBe("zzz");
  });

  it("Catalogue vide : nombres à 0", async () => {
    renderScreen([]);
    await focus();
    expect(text("catalogue-session-view-SINGLE-count")).toBe("0");
    expect(text("catalogue-session-view-MULTIPLE-count")).toBe("0");
  });
});

describe("PRE-9 CAT.1 — Catalogue des Mouvements", () => {
  async function openMovements() {
    await seedMovements();
    renderScreen();
    await focus();
    await press("catalogue-content-type-row-movements");
  }

  it("« N familles · N mouvements » : les Mouvements masqués d'une pile repliée sont comptés (recette du 30/10, cat-compteurs)", async () => {
    await openMovements();
    expect(movementsShown()).toEqual(["Fentes avant", "Gainage", "Squats sautés"]);
    expect(text("movement-catalogue-counter-FAMILIES-label")).toBe("1 famille");
    // Hermann : « Le nombre de mouvements doit inclure le comptage des cartes invisibles des plis ».
    expect(text("movement-catalogue-counter-MOVEMENTS-label")).toBe("5 mouvements");
    await press("movement-card-jump-card");
    expect(movementsShown()).toHaveLength(5);
    expect(text("movement-catalogue-counter-MOVEMENTS-label")).toBe("5 mouvements");
    expect(text("movement-catalogue-counter-FAMILIES-label")).toBe("1 famille");
  });

  it("compteurs activables, exclusifs, désélectionnables, annoncés ; actif bleu Semi Bold, inactif #333333 Regular", async () => {
    await openMovements();
    const counter = (value: "FAMILIES" | "MOVEMENTS") => screen.getByTestId(`movement-catalogue-counter-${value}`);
    const labelStyle = (value: "FAMILIES" | "MOVEMENTS") =>
      StyleSheet.flatten(screen.getByTestId(`movement-catalogue-counter-${value}-label`).props.style);
    expect(counter("FAMILIES").props.accessibilityRole).toBe("button");
    expect(counter("FAMILIES").props.accessibilityState).toEqual({ selected: false });
    expect(labelStyle("FAMILIES")).toMatchObject({ fontSize: 14, color: "#333333", fontFamily: "Inter_400Regular" });

    await press("movement-catalogue-counter-FAMILIES");
    expect(counter("FAMILIES").props.accessibilityState).toEqual({ selected: true });
    expect(labelStyle("FAMILIES")).toMatchObject({ color: colors.primary, fontFamily: "Inter_600SemiBold" });
    // Lecture retenue (À CLARIFIER) : « familles » restreint la liste aux cartes d'une famille.
    expect(movementsShown()).toEqual(["Squats sautés"]);
    expect(text("movement-catalogue-counter-MOVEMENTS-label")).toBe("3 mouvements");

    // Recette du 30/10 (cat-bascule) : « appuyer sur mouvements déplie toutes les listes affichées ».
    await press("movement-catalogue-counter-MOVEMENTS");
    expect(counter("FAMILIES").props.accessibilityState).toEqual({ selected: false });
    expect(counter("MOVEMENTS").props.accessibilityState).toEqual({ selected: true });
    expect(movementsShown()).toHaveLength(5);
    expect(screen.queryAllByTestId(/^movement-pile-.+-expanded$/)).toHaveLength(1);
    expect(text("movement-catalogue-counter-MOVEMENTS-label")).toBe("5 mouvements");

    // Désactivation : l'état de dépliage d'avant revient (pile repliée).
    await press("movement-catalogue-counter-MOVEMENTS");
    expect(counter("MOVEMENTS").props.accessibilityState).toEqual({ selected: false });
    expect(counter("FAMILIES").props.accessibilityState).toEqual({ selected: false });
    expect(movementsShown()).toEqual(["Fentes avant", "Gainage", "Squats sautés"]);
  });

  it("cumul recherche + compteur, sans réinitialiser la recherche ; « N résultats » absent hors filtre du panneau", async () => {
    await openMovements();
    await press("movement-catalogue-counter-FAMILIES");
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("movement-catalogue-search"), "fentes");
    });
    await settle();
    expect(movementsShown()).toEqual([]);
    expect(text("movement-catalogue-counter-FAMILIES-label")).toBe("0 famille");
    expect(text("movement-catalogue-counter-MOVEMENTS-label")).toBe("0 mouvement");
    await press("movement-catalogue-counter-FAMILIES");
    expect(movementsShown()).toEqual(["Fentes avant"]);
    expect(screen.getByTestId("movement-catalogue-search").props.value).toBe("fentes");
    expect(screen.queryByTestId("catalogue-results")).toBeNull();
    expect(searchWidth("movement-catalogue-search")).toBe(216);
  });

  it("filtre du panneau actif : champ étendu jusqu'à Filtre (≥ 107), « N résultats » = cartes affichées, recalculé avec compteur et recherche", async () => {
    await openMovements();
    await press("catalogue-filter-action");
    fireEvent.press(screen.getByTestId("movement-filter-status-active"));
    await press("movement-filter-apply");
    expectSearchFillsToFilter("movement-catalogue-search");
    expect(text("catalogue-results")).toBe("3 résultats");
    await press("movement-catalogue-counter-FAMILIES");
    expect(text("catalogue-results")).toBe("1 résultat");
    await press("movement-card-jump-card");
    expect(text("catalogue-results")).toBe("3 résultats");
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("movement-catalogue-search"), "zzz");
    });
    await settle();
    expect(text("catalogue-results")).toBe("0 résultat");
  });
});
