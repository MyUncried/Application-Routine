import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo, ScrollView, StyleSheet } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { MovementCatalogueList } from "@/features/activities/MovementCatalogueList";
import { EMPTY_MOVEMENT_FILTERS } from "@/features/activities/movementCatalogueView";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { colors } from "@/shared/ui/tokens";

/**
 * D-510 et D-508 (Hermann, 06/11/2026) — catalogue des mouvements :
 * - badge « New » (états Non / Oui / Dans la pile), description raccourcie, accessibilité, aucun badge en sélection ;
 * - défilement vers la fiche créée (ou sa pile repliée, sans la déployer), sans forcer une fiche exclue par les filtres ;
 * - carte Mouvement de 72 et feuilles de pile (fond blanc, liseré à 50 %, même ombre).
 * Le rendu (onglet, arrondis, découpe) et VoiceOver se jugent sur iPhone ; ici, la structure et les valeurs.
 */

jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

const NOW = "2026-11-06T09:00:00.000Z";
let database: NodeSqliteDatabase;
let sequence = 0;
const movements = () => new SqliteMovementRepository(database, () => `grp-${++sequence}`, () => NOW);
const service = () => new ActivityDefinitionService(undefined, undefined, undefined, undefined, movements());

const movement = (id: string, name: string, description: string | null = null): Movement => ({
  id,
  name,
  description,
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

async function renderList(props: Partial<Parameters<typeof MovementCatalogueList>[0]> = {}) {
  render(
    <ActivityDefinitionServiceContext.Provider value={service()}>
      <MovementCatalogueList
        reloadToken={0}
        query=""
        filters={EMPTY_MOVEMENT_FILTERS}
        onOpenMovement={jest.fn()}
        onCreateVariant={jest.fn()}
        {...props}
      />
    </ActivityDefinitionServiceContext.Provider>,
  );
  await settle();
}

const layoutEvent = (y: number, height: number) => ({ nativeEvent: { layout: { x: 0, y, width: 370, height } } });
/** Entrées de 84 (72 + écart de 12), de haut en bas. */
async function layOut(keys: readonly string[]) {
  await act(async () => {
    keys.forEach((key, index) => fireEvent(screen.getByTestId(`movement-item-${key}`), "layout", layoutEvent(index * 84, 84)));
  });
}

async function seedThree() {
  const repository = movements();
  for (const [id, name] of [["fentes", "Fentes avant"], ["gainage", "Gainage"], ["mob", "Mobilisation du genou"]] as const) {
    await repository.create(movement(id, name, "Première étape"));
  }
}

async function seedPile() {
  const repository = movements();
  await repository.create(movement("squat", "Squats"));
  await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
}

const press = async (testID: string) => {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
  await settle();
};
const badgeLabel = (id: string) => screen.getByTestId(`movement-card-badge-label-${id}`).props.children as string;

describe("D-510 : badge « New » — états Non / Oui / Dans la pile", () => {
  it("fiche nouvelle : onglet « New » de 55 au coin bas droit, Inter Medium 12 blanc, sans majuscules forcées ; description raccourcie ; annoncée", async () => {
    await seedThree();
    await renderList({ newMovementIds: new Set(["gainage"]) });
    expect(StyleSheet.flatten(screen.getByTestId("movement-card-new-gainage").props.style)).toMatchObject({
      position: "absolute",
      right: 0,
      bottom: 0,
      height: 32,
      width: 55,
    });
    expect(badgeLabel("gainage")).toBe("New");
    const labelStyle = StyleSheet.flatten(screen.getByTestId("movement-card-badge-label-gainage").props.style);
    expect(labelStyle).toMatchObject({ color: colors.background, fontFamily: "Inter_500Medium", fontSize: 12 });
    expect(labelStyle.textTransform).toBeUndefined();
    // 8 d'écart avec le corps de l'onglet : 55 depuis le bord extérieur, moins 4 de bord et de marge.
    expect(StyleSheet.flatten(screen.getByTestId("movement-card-step-gainage-1").props.style).marginRight).toBe(51);
    expect(screen.getByLabelText("Gainage, nouveau")).toBeTruthy();
    expect(screen.queryByTestId("movement-card-new-fentes")).toBeNull();
  });

  it("badge absent : la description garde toute sa largeur", async () => {
    await seedThree();
    await renderList({ newMovementIds: new Set() });
    expect(screen.queryByTestId("movement-card-new-gainage")).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId("movement-card-step-gainage-1").props.style).marginRight).toBeUndefined();
  });

  it("pile repliée dont un niveau caché est nouveau : « New ↓ » (69) sur la tête, « contient un niveau nouveau » ; dépliée : « New » sur la fiche nouvelle seulement", async () => {
    await seedPile();
    await renderList({ newMovementIds: new Set(["assist"]) });
    expect(badgeLabel("squat")).toBe("New ↓");
    expect(StyleSheet.flatten(screen.getByTestId("movement-card-new-squat").props.style).width).toBe(69);
    expect(screen.getByLabelText(/^Squats, .*contient un niveau nouveau$/)).toBeTruthy();
    await press("movement-card-squat-card");
    expect(screen.queryByTestId("movement-card-new-squat")).toBeNull();
    expect(badgeLabel("assist")).toBe("New");
  });

  it("tête nouvelle sans niveau caché nouveau : « New » ; avec un niveau caché nouveau aussi : « New ↓ »", async () => {
    await seedPile();
    await renderList({ newMovementIds: new Set(["squat"]) });
    expect(badgeLabel("squat")).toBe("New");
    expect(screen.getByLabelText(/^Squats, .*, nouveau$/)).toBeTruthy();
  });

  it("deux fiches nouvelles dans une pile : « New ↓ » replié, « New » sur chacune une fois dépliée", async () => {
    await seedPile();
    await renderList({ newMovementIds: new Set(["squat", "assist"]) });
    expect(badgeLabel("squat")).toBe("New ↓");
    await press("movement-card-squat-card");
    expect(badgeLabel("squat")).toBe("New");
    expect(badgeLabel("assist")).toBe("New");
  });

  it("en sélection pour une Séance : aucun badge ; case vide ou cochée à la place du fond de sélection", async () => {
    await seedThree();
    await renderList({
      newMovementIds: new Set(["gainage"]),
      selection: { selectedIds: new Set(["fentes"]), onToggle: jest.fn(), bottomInset: 0 },
    });
    expect(screen.queryByTestId("movement-card-new-gainage")).toBeNull();
    expect(screen.getByTestId("movement-card-choice-fentes-checked")).toBeTruthy();
    expect(screen.getByTestId("movement-card-choice-gainage-empty")).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId("movement-card-surface-fentes").props.style).backgroundColor).toBe(colors.background);
  });

  it("le badge n'est pas une cible tactile", async () => {
    await seedThree();
    await renderList({ newMovementIds: new Set(["gainage"]) });
    expect(screen.getByTestId("movement-card-badge-clip-gainage").props.pointerEvents).toBe("none");
  });
});

describe("D-510, règles 7 et 8 : défilement vers la fiche créée", () => {
  it("la liste se positionne sur la fiche créée, puis la cible est consommée", async () => {
    await seedThree();
    const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo").mockImplementation(() => undefined);
    scrollTo.mockClear();
    const onScrollTargetHandled = jest.fn();
    await renderList({ newMovementIds: new Set(["mob"]), scrollTarget: "mob", onScrollTargetHandled });
    await layOut(["fentes", "gainage", "mob"]);
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 2 * 84 - 12, animated: true });
    expect(onScrollTargetHandled).toHaveBeenCalledWith("mob");
  });

  it("fiche dans une pile repliée : la liste se positionne sur la pile, sans la déployer", async () => {
    await movements().create(movement("fentes", "Fentes avant"));
    await seedPile();
    const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo").mockImplementation(() => undefined);
    scrollTo.mockClear();
    await renderList({ newMovementIds: new Set(["assist"]), scrollTarget: "assist", onScrollTargetHandled: jest.fn() });
    const pile = screen.getByTestId(/^movement-pile-[^-]+-?[^-]*$/);
    const pileKey = (pile.props.testID as string).replace("movement-pile-", "");
    await layOut(["fentes", pileKey]);
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 84 - 12, animated: true });
    expect(screen.queryByTestId(`movement-pile-${pileKey}-expanded`)).toBeNull();
  });

  it("fiche exclue par la recherche ou un filtre : rien n'est forcé à l'écran, aucun défilement, cible abandonnée", async () => {
    await seedThree();
    const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo").mockImplementation(() => undefined);
    scrollTo.mockClear();
    const onScrollTargetHandled = jest.fn();
    await renderList({ query: "Fentes", newMovementIds: new Set(["mob"]), scrollTarget: "mob", onScrollTargetHandled });
    expect(screen.queryByTestId("movement-card-mob")).toBeNull();
    expect(onScrollTargetHandled).toHaveBeenCalledWith("mob");
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe("D-508 : carte Mouvement et feuilles de pile", () => {
  it("carte de 72, fond blanc, liseré à 50 %, photo à 4 du bord et rayon 8, Niveau noir aligné sur le nom", async () => {
    await seedPile();
    await renderList();
    await press("movement-card-squat-card");
    expect(StyleSheet.flatten(screen.getByTestId("movement-card-surface-assist").props.style)).toMatchObject({
      height: 72,
      padding: 3.5,
      borderWidth: 0.5,
      borderColor: "rgba(204, 209, 224, 0.5)",
      backgroundColor: colors.background,
    });
    expect(StyleSheet.flatten(screen.getByTestId("movement-card-level-assist").props.style).color).toBe(colors.textPrimary);
    expect(StyleSheet.flatten(screen.getByTestId("movement-card-title-assist").props.style)).toMatchObject({
      alignItems: "baseline",
      marginRight: 8,
    });
  });

  it("feuilles de pile : 72 de haut, blanches, même liseré et même ombre que la carte", async () => {
    await seedPile();
    await renderList();
    const leaf = StyleSheet.flatten(screen.getByTestId(/-leaf-1$/).props.style);
    const card = StyleSheet.flatten(screen.getByTestId("movement-card-surface-squat").props.style);
    expect(leaf).toMatchObject({ height: 72, backgroundColor: colors.background, borderWidth: card.borderWidth, borderColor: card.borderColor });
    expect(leaf).toMatchObject({ shadowOpacity: card.shadowOpacity, shadowRadius: card.shadowRadius, shadowOffset: card.shadowOffset });
  });
});
