import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo, FlatList, StyleSheet } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { MOVEMENT_GRID, MovementCatalogueGrid } from "@/features/activities/MovementCatalogueGrid";
import { EMPTY_MOVEMENT_FILTERS } from "@/features/activities/movementCatalogueView";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { colors } from "@/shared/ui/tokens";

/**
 * Grille du catalogue des Mouvements à quatre colonnes — décisions de Hermann du 16/11/2026 (ch07, « Catalogue des
 * Mouvements — grille à quatre colonnes » ; ch13, CE-MVT-03 ; Figma `12530:27177`) : dimensions, nom sans niveau ni
 * description, feuille unique de la pile repliée, pile déployée dans le flux, badge « New » réduit à 62 %. Le rendu se
 * juge sur iPhone (Hermann) ; ici, la structure et les valeurs.
 */

jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

const NOW = "2026-11-16T09:00:00.000Z";
let database: NodeSqliteDatabase;
let sequence = 0;
const movements = () => new SqliteMovementRepository(database, () => `grp-${++sequence}`, () => NOW);
const service = () => new ActivityDefinitionService(undefined, undefined, undefined, undefined, movements());

const movement = (id: string, name: string): Movement => ({
  id,
  name,
  description: "Première étape",
  media: [],
  categoryId: "cardio",
  bodyZoneIds: ["cuisses"],
  phases: [],
  nextPhaseId: 1,
  aliases: [],
  levelGroup: null,
});

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  sequence = 0;
  jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
});

afterEach(() => {
  jest.restoreAllMocks();
  database.close();
});

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

const onOpen = jest.fn();
async function renderGrid(props: Partial<Parameters<typeof MovementCatalogueGrid>[0]> = {}) {
  onOpen.mockClear();
  render(
    <ActivityDefinitionServiceContext.Provider value={service()}>
      <MovementCatalogueGrid reloadToken={0} query="" filters={EMPTY_MOVEMENT_FILTERS} onOpenMovement={onOpen} {...props} />
    </ActivityDefinitionServiceContext.Provider>,
  );
  await settle();
}

/** Famille Squats assistés (1) / Squats (2) / Squats sautés (3) ; Fentes avant et Gainage indépendants. */
async function seed() {
  const repository = movements();
  await repository.create(movement("squat", "Squats"));
  await repository.create(movement("fentes", "Fentes avant"));
  await repository.create(movement("gainage", "Gainage sur les genoux"));
  await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
  await repository.createVariant(movement("jump", "Squats sautés"), "squat", "AFTER_ORIGIN");
}

const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;
const press = async (testID: string) => {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
  await settle();
};

describe("Grille à quatre colonnes — dimensions (CE-MVT-03, Carte)", () => {
  it("quatre colonnes séparées de 8, rangées séparées de 10 ; carte 86,5 × 112, photo de 70 ; 4 × 86,5 + 3 × 8 + 2 × 16 = 402", async () => {
    await seed();
    await renderGrid();
    const list = screen.UNSAFE_getByType(FlatList);
    expect(list.props.numColumns).toBe(4);
    expect(StyleSheet.flatten(list.props.columnWrapperStyle)).toMatchObject({ gap: 8 });
    expect(StyleSheet.flatten(list.props.contentContainerStyle)).toMatchObject({ paddingHorizontal: 16 });
    expect(4 * MOVEMENT_GRID.cardWidth + 3 * MOVEMENT_GRID.columnGap + 2 * 16).toBe(402);
    // La case porte l'écart de 10 sous sa carte.
    expect(style("movement-grid-cell-fentes")).toMatchObject({ width: 86.5, height: 112 + 10 });
    expect(style("movement-grid-surface-fentes")).toMatchObject({ width: 86.5, height: 112, borderRadius: 12, backgroundColor: colors.background });
    expect(style("movement-grid-photo-fentes")).toMatchObject({ width: 86.5, height: 70 });
  });

  it("nom en 10,5 Regular sur deux lignes au plus ; ni pastille de niveau, ni description", async () => {
    await seed();
    await renderGrid();
    const name = screen.getByTestId("movement-grid-name-gainage");
    expect(name.props.numberOfLines).toBe(2);
    expect(name.props.children).toBe("Gainage sur les genoux");
    expect(StyleSheet.flatten(name.props.style)).toMatchObject({ fontFamily: "Inter_400Regular", fontSize: 10.5, color: "#14171C", marginTop: 8, marginHorizontal: 6 });
    // Pile repliée (tête Squats sautés, niveau 3) et cartes seules : aucun niveau, aucune description.
    expect(screen.queryByText(/Niveau/)).toBeNull();
    expect(screen.queryByText("Première étape")).toBeNull();
    expect(screen.queryAllByTestId(/^movement-card-level-/)).toHaveLength(0);
    expect(screen.queryAllByTestId(/^movement-card-step-/)).toHaveLength(0);
  });
});

describe("Pile (CE-MVT-03) : une seule feuille repliée ; dépliée dans le flux, liseré, repli", () => {
  it("repliée : une seule feuille sous la tête, 4 plus bas, 5 de chaque côté ; appui : niveaux dans le flux, liseré, feuille retirée ; appui sur le liseré : repliée", async () => {
    await seed();
    await renderGrid();
    // Tête : rang le plus haut (Squats sautés).
    expect(screen.getByTestId("movement-grid-card-jump")).toBeTruthy();
    expect(screen.queryByTestId("movement-grid-card-squat")).toBeNull();
    expect(screen.queryAllByTestId(/^movement-grid-leaf-/)).toHaveLength(1);
    expect(style("movement-grid-leaf-jump")).toMatchObject({ position: "absolute", top: 4, left: 5, width: 76.5, height: 112 });
    expect(screen.getByTestId("movement-grid-card-jump").props.accessibilityLabel).toBe("Squats sautés, 3 niveaux affichés");

    await press("movement-grid-card-jump");
    expect(onOpen).not.toHaveBeenCalled();
    expect(screen.queryAllByTestId(/^movement-grid-leaf-/)).toHaveLength(0);
    const order = screen.getAllByTestId(/^movement-grid-card-/).map((node) => String(node.props.testID).replace("movement-grid-card-", ""));
    expect(order.slice(order.indexOf("jump"), order.indexOf("jump") + 3)).toEqual(["jump", "squat", "assist"]);
    // Liseré : sous chaque niveau, prolongé jusqu'au niveau suivant de la même rangée ; centré dans l'écart de 10.
    expect(style("movement-grid-rail-jump")).toMatchObject({ top: 112 + 3.5, height: 3, borderRadius: 2, backgroundColor: "rgba(5, 8, 229, 0.6)" });
    const rails = ["jump", "squat", "assist"].map((id) => style(`movement-grid-rail-${id}`).width);
    const firstIndex = order.indexOf("jump");
    rails.forEach((width, rank) => {
      const column = (firstIndex + rank) % 4;
      expect(width).toBe(rank < 2 && column < 3 ? 86.5 + 8 : 86.5);
    });
    expect(screen.queryByTestId("movement-grid-rail-fentes")).toBeNull();

    // Un niveau s'ouvre ; un appui sur le liseré replie la pile.
    await press("movement-grid-card-squat");
    expect(onOpen).toHaveBeenCalledWith("squat");
    await press("movement-grid-rail-assist");
    expect(screen.queryByTestId("movement-grid-card-squat")).toBeNull();
    expect(screen.queryAllByTestId(/^movement-grid-leaf-/)).toHaveLength(1);
  });

  it("compteur « mouvements » : toutes les piles se déplient, comme en liste", async () => {
    await seed();
    await renderGrid({ counter: null });
    expect(screen.queryByTestId("movement-grid-card-squat")).toBeNull();
    screen.rerender(
      <ActivityDefinitionServiceContext.Provider value={service()}>
        <MovementCatalogueGrid reloadToken={0} query="" filters={EMPTY_MOVEMENT_FILTERS} onOpenMovement={onOpen} counter="MOVEMENTS" />
      </ActivityDefinitionServiceContext.Provider>,
    );
    await settle();
    expect(screen.getByTestId("movement-grid-card-squat")).toBeTruthy();
    expect(screen.queryAllByTestId(/^movement-grid-leaf-/)).toHaveLength(0);
  });
});

describe("Badge « New » (D-510) : en bas à droite, collé au coin, réduit à 62 %", () => {
  it("fiche nouvelle : onglet de 34,1 × 19,84 au coin bas droit, libellé 7,44 ; annoncé « nouveau »", async () => {
    await seed();
    await renderGrid({ newMovementIds: new Set(["fentes"]) });
    expect(style("movement-grid-new-fentes")).toMatchObject({ position: "absolute", right: 0, bottom: 0 });
    expect(style("movement-grid-new-fentes").width).toBeCloseTo(34.1, 5);
    expect(style("movement-grid-new-fentes").height).toBeCloseTo(19.84, 5);
    const label = screen.getByTestId("movement-grid-badge-label-fentes");
    expect(label.props.children).toBe("New");
    expect(StyleSheet.flatten(label.props.style).fontSize).toBeCloseTo(7.44, 5);
    expect(StyleSheet.flatten(label.props.style).left).toBeCloseTo(11.47, 5);
    expect(StyleSheet.flatten(label.props.style).top).toBeCloseTo(7.44, 5);
    expect(screen.getByTestId("movement-grid-card-fentes").props.accessibilityLabel).toBe("Fentes avant, nouveau");
    expect(screen.queryByTestId("movement-grid-new-gainage")).toBeNull();
  });

  it("pile repliée dont un niveau caché est nouveau : « New ↓ » sur la tête (69 × 62 %) ; dépliée : « New » sur ce niveau seul", async () => {
    await seed();
    await renderGrid({ newMovementIds: new Set(["assist"]) });
    expect(screen.getByTestId("movement-grid-badge-label-jump").props.children).toBe("New ↓");
    expect(style("movement-grid-new-jump").width).toBeCloseTo(69 * 0.62, 5);
    await press("movement-grid-card-jump");
    expect(screen.queryByTestId("movement-grid-new-jump")).toBeNull();
    expect(screen.getByTestId("movement-grid-badge-label-assist").props.children).toBe("New");
  });
});
