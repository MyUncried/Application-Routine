import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo, StyleSheet } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { MovementCatalogueList } from "@/features/activities/MovementCatalogueList";
import { EMPTY_MOVEMENT_FILTERS } from "@/features/activities/movementCatalogueView";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-8 — familles de niveaux par geste dans le Catalogue des Mouvements (règles A à E du
 * 28/10/2026, DSF « Composition et ordre des familles », FAM-01 à FAM-08) sur SQLite réelle. Les
 * places des cartes sont simulées par des évènements de mise en page (cartes de 80, écart 12 entre
 * entrées, 4 entre membres d'une pile).
 */

jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

const NOW = "2026-10-28T09:00:00.000Z";
let database: NodeSqliteDatabase;
let sequence = 0;
const movements = () => new SqliteMovementRepository(database, () => `grp-${++sequence}`, () => NOW);
const service = () =>
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

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  sequence = 0;
});

afterEach(() => {
  database.close();
});

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

async function renderList() {
  render(
    <ActivityDefinitionServiceContext.Provider value={service()}>
      <MovementCatalogueList reloadToken={0} query="" filters={EMPTY_MOVEMENT_FILTERS} onOpenMovement={jest.fn()} onCreateVariant={jest.fn()} />
    </ActivityDefinitionServiceContext.Provider>,
  );
  await settle();
}

const layoutEvent = (y: number, height: number) => ({ nativeEvent: { layout: { x: 0, y, width: 370, height } } });
/** Entrées du Catalogue, de haut en bas : carte de 80 + écart de 12 ; une pile dépliée : n cartes et n − 1 écarts de 4. */
async function layOut(entries: readonly { readonly key: string; readonly members?: readonly string[] }[]) {
  await act(async () => {
    let y = 0;
    for (const entry of entries) {
      const members = entry.members ?? [];
      const height = members.length > 0 ? members.length * 80 + (members.length - 1) * 4 + 12 : 92;
      fireEvent(screen.getByTestId(`movement-item-${entry.key}`), "layout", layoutEvent(y, height));
      members.forEach((id, index) => {
        fireEvent(
          screen.getByTestId(`movement-pile-${entry.key}-member-${id}`),
          "layout",
          layoutEvent(index === 0 ? 0 : index * 84 - 4, index === 0 ? 80 : 84),
        );
      });
      y += height;
    }
  });
}

const START_Y = 500;
async function grab(movementId: string) {
  await act(async () => {
    fireEvent(screen.getByTestId("movement-catalogue-items"), "touchStart", { nativeEvent: { pageX: 100, pageY: START_Y } });
    fireEvent(screen.getByTestId(`movement-card-${movementId}-card`), "longPress");
  });
}
async function moveBy(dy: number) {
  await act(async () => {
    fireEvent(screen.getByTestId("movement-catalogue-items"), "touchMove", { nativeEvent: { pageX: 100, pageY: START_Y + dy } });
  });
}
async function release() {
  await act(async () => {
    fireEvent(screen.getByTestId("movement-catalogue-items"), "touchEnd", { nativeEvent: { pageX: 100, pageY: 0 } });
  });
  await settle();
}
/** Recette du 28/10 : une famille repliée ne se déplie qu'après un arrêt de la carte portée (500 ms). */
const dwell = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
  });
const level = (id: string) => screen.queryByTestId(`movement-card-level-${id}`)?.props.children ?? null;
const membership = async (id: string) => (await movements().findById(id))?.levelGroup ?? null;
const notice = () => (screen.queryByTestId("movement-catalogue-notice-message")?.props.children as string | undefined) ?? null;

describe("PRE-8 familles — geste dans le Catalogue des Mouvements", () => {
  it("C1, C3, C4, E (FAM-04, FAM-08) : poser un isolé au-dessus d'un autre forme une famille ; filet et niveaux provisoires ; message et Annuler", async () => {
    const repository = movements();
    for (const [id, name] of [["fentes", "Fentes avant"], ["gainage", "Gainage"], ["mob", "Mobilisation du genou"]] as const) {
      await repository.create(movement(id, name));
    }
    await renderList();
    await layOut([{ key: "fentes" }, { key: "gainage" }, { key: "mob" }]);
    // « Mobilisation » (centre 224) portée dans la moitié haute de « Gainage » (92 à 132).
    await grab("mob");
    await moveBy(-110);
    expect(screen.getByTestId("movement-card-gainage-formation-rail")).toBeTruthy();
    expect(level("mob")).toBe("Niveau 2");
    expect(level("gainage")).toBe("Niveau 1");
    expect(screen.queryByTestId("movement-card-fentes-formation-rail")).toBeNull();
    // Passer de l'autre côté : les niveaux provisoires s'inversent (C4).
    await moveBy(-70);
    expect(level("mob")).toBe("Niveau 1");
    expect(level("gainage")).toBe("Niveau 2");
    await moveBy(-110);
    await release();
    expect(notice()).toBe("Nouvelle famille de niveaux créée");
    const created = await membership("mob");
    expect(created).not.toBeNull();
    expect(await membership("gainage")).toEqual({ groupId: created!.groupId, sortKey: 0 });
    expect(created!.sortKey).toBe(1);
    // Annuler : les deux Mouvements redeviennent indépendants.
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-catalogue-notice-action"));
    });
    await settle();
    expect(await membership("mob")).toBeNull();
    expect(await membership("gainage")).toBeNull();
  });

  it("A, E3 (FAM-01) : réordonner dans une pile — niveaux recalculés en direct, filet inchangé, aucun message", async () => {
    const repository = movements();
    await repository.create(movement("squat", "Squats"));
    await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
    await repository.createVariant(movement("jump", "Squats sautés"), "squat", "AFTER_ORIGIN");
    await renderList();
    const group = (await membership("squat"))!.groupId;
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-card-jump-card"));
    });
    await settle();
    await layOut([{ key: group, members: ["jump", "squat", "assist"] }]);
    await grab("jump");
    await moveBy(84);
    expect(level("jump")).toBe("Niveau 2");
    expect(level("squat")).toBe("Niveau 3");
    expect(StyleSheet.flatten(screen.getByTestId(`movement-pile-${group}-rail`).props.style).bottom).toBe(40);
    await release();
    expect(notice()).toBeNull();
    expect((await movements().listGroup(group)).map((member) => member.id)).toEqual(["assist", "jump", "squat"]);
  });

  it("B2, B4, B3 (FAM-02) : sortir — filet raccourci, pastille retirée, rangs recalculés ; revenir annule ; relâcher hors du filet fait sortir", async () => {
    const repository = movements();
    await repository.create(movement("squat", "Squats"));
    await repository.create(movement("fentes", "Fentes avant"));
    await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
    await repository.createVariant(movement("jump", "Squats sautés"), "squat", "AFTER_ORIGIN");
    await renderList();
    const group = (await membership("squat"))!.groupId;
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-card-jump-card"));
    });
    await settle();
    await layOut([{ key: "fentes" }, { key: group, members: ["jump", "squat", "assist"] }]);
    // « Squats assistés » (centre 300) portée sous la pile (emprise 92 à 340).
    await grab("assist");
    await moveBy(100);
    expect(level("assist")).toBeNull();
    expect(level("jump")).toBe("Niveau 2");
    expect(level("squat")).toBe("Niveau 1");
    expect(StyleSheet.flatten(screen.getByTestId(`movement-pile-${group}-rail`).props.style).bottom).toBe(40 + 84);
    // B4 : de retour dans le filet, la sortie est annulée.
    await moveBy(10);
    expect(level("assist")).toBe("Niveau 1");
    expect(StyleSheet.flatten(screen.getByTestId(`movement-pile-${group}-rail`).props.style).bottom).toBe(40);
    // Sortie vers le haut, au-dessus de « Fentes avant » : acceptée comme partout (B1, B5) ; aucune pose sur une autre carte (C6).
    await moveBy(-290);
    expect(screen.queryByTestId("movement-card-fentes-formation-rail")).toBeNull();
    await release();
    expect(notice()).toBe("Mouvement sorti de la famille");
    expect(await membership("assist")).toBeNull();
    expect((await movements().listGroup(group)).map((member) => member.id)).toEqual(["squat", "jump"]);
  });

  it("D2, E (FAM-07) : sortir du dernier couple dissout la famille ; Annuler la rétablit à l'identique", async () => {
    const repository = movements();
    await repository.create(movement("squat", "Squats"));
    await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
    await renderList();
    const before = { squat: await membership("squat"), assist: await membership("assist") };
    const group = before.squat!.groupId;
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-card-squat-card"));
    });
    await settle();
    await layOut([{ key: group, members: ["squat", "assist"] }]);
    await grab("assist");
    await moveBy(150);
    await release();
    expect(notice()).toBe("Famille de niveaux supprimée");
    expect(await membership("squat")).toBeNull();
    expect(await membership("assist")).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-catalogue-notice-action"));
    });
    await settle();
    expect({ squat: await membership("squat"), assist: await membership("assist") }).toEqual(before);
  });

  it("A3, C5 (FAM-05) : une pile repliée se déplie à l'approche ; un isolé posé sous un membre y entre, à ce rang", async () => {
    const repository = movements();
    await repository.create(movement("squat", "Squats"));
    await repository.create(movement("gainage", "Gainage"));
    await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
    await renderList();
    const group = (await membership("squat"))!.groupId;
    // Ordre par nom : « Gainage » puis la pile « Squats ».
    await layOut([{ key: "gainage" }, { key: group }]);
    await grab("gainage");
    await moveBy(100);
    expect(screen.queryByTestId(`movement-pile-${group}-expanded`)).toBeNull();
    await dwell();
    expect(screen.getByTestId(`movement-pile-${group}-expanded`)).toBeTruthy();
    await layOut([{ key: "gainage" }, { key: group, members: ["squat", "assist"] }]);
    // Moitié basse de « Squats » (92 à 172) : niveau juste en dessous.
    await moveBy(100 + 40);
    expect(level("gainage")).toBe("Niveau 2");
    expect(level("squat")).toBe("Niveau 3");
    expect(level("assist")).toBe("Niveau 1");
    await release();
    expect(notice()).toBe("Mouvement ajouté à la famille");
    expect((await movements().listGroup(group)).map((member) => member.id)).toEqual(["assist", "gainage", "squat"]);
  });

  it("A3 : l'appui long sur une pile repliée la déplie et porte sa carte du dessus", async () => {
    const repository = movements();
    await repository.create(movement("squat", "Squats"));
    await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
    await renderList();
    const group = (await membership("squat"))!.groupId;
    await grab("squat");
    expect(screen.getByTestId(`movement-pile-${group}-expanded`)).toBeTruthy();
    expect(screen.getByTestId(`movement-pile-${group}-lifted`)).toBeTruthy();
    await release();
    expect(notice()).toBeNull();
  });

  it("C6 (FAM-06) : un membre porté sur un isolé ne forme aucune famille ; un isolé relâché dans le vide ne change rien", async () => {
    const repository = movements();
    await repository.create(movement("aaa", "Abdos"));
    await repository.create(movement("squat", "Squats"));
    await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
    await renderList();
    const group = (await membership("squat"))!.groupId;
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-card-squat-card"));
    });
    await settle();
    await layOut([{ key: "aaa" }, { key: group, members: ["squat", "assist"] }]);
    await grab("squat");
    await moveBy(-92);
    expect(screen.queryByTestId("movement-card-aaa-formation-rail")).toBeNull();
    // Isolé relâché sur sa propre place : rien.
    await act(async () => {
      fireEvent(screen.getByTestId("movement-catalogue-items"), "touchCancel", { nativeEvent: { pageX: 100, pageY: 0 } });
    });
    await settle();
    await grab("aaa");
    await moveBy(5);
    await release();
    expect(notice()).toBeNull();
    expect(await membership("aaa")).toBeNull();
    expect((await movements().listGroup(group)).map((member) => member.id)).toEqual(["assist", "squat"]);
  });
});

describe("PRE-8 familles — recette iPhone du 28/10", () => {
  const translateY = (testID: string) =>
    (StyleSheet.flatten(screen.getByTestId(testID).props.style).transform as { translateY: number }[] | undefined)?.[0]?.translateY ?? 0;
  // « Réduire les animations » : décalages appliqués aussitôt, sans attendre la transition.
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("FAM-05 : une pile dépliée au-dessus de la carte portée la fait descendre — la carte reste sous le doigt", async () => {
    const repository = movements();
    await repository.create(movement("squat", "Squats"));
    await repository.create(movement("tirage", "Tirage"));
    await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
    await renderList();
    const group = (await membership("squat"))!.groupId;
    // Pile repliée (0 à 92), « Tirage » dessous (centre 132), portée dans la pile : elle se déplie.
    await layOut([{ key: group }, { key: "tirage" }]);
    await grab("tirage");
    await moveBy(-60);
    await dwell();
    expect(screen.getByTestId(`movement-pile-${group}-expanded`)).toBeTruthy();
    expect(translateY("movement-card-tirage-lifted")).toBe(-60);
    // La pile dépliée (176) repousse la place de « Tirage » de 84 : le décalage la compense aussitôt.
    await layOut([{ key: group, members: ["squat", "assist"] }, { key: "tirage" }]);
    expect(translateY("movement-card-tirage-lifted")).toBe(-60 - 84);
    await moveBy(-70);
    expect(translateY("movement-card-tirage-lifted")).toBe(-70 - 84);
    // Centre 62 : moitié basse de « Squats » (0 à 80) — entrée juste en dessous, là où est le doigt.
    await release();
    expect(notice()).toBe("Mouvement ajouté à la famille");
    expect((await movements().listGroup(group)).map((member) => member.id)).toEqual(["assist", "tirage", "squat"]);
  });

  it("C5 : une famille repliée survolée sans s'arrêter ne se déplie pas ; un arrêt dessus la déplie", async () => {
    const repository = movements();
    await repository.create(movement("abdos", "Abdos"));
    await repository.create(movement("squat", "Squats"));
    await repository.create(movement("tirage", "Tirage"));
    await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
    await renderList();
    const group = (await membership("squat"))!.groupId;
    // « Abdos » (0 à 92), pile repliée (92 à 184), « Tirage » (184 à 276, centre 224).
    await layOut([{ key: "abdos" }, { key: group }, { key: "tirage" }]);
    await grab("tirage");
    await moveBy(-90);
    await moveBy(-180);
    await dwell();
    expect(screen.queryByTestId(`movement-pile-${group}-expanded`)).toBeNull();
    // Revenir sur la pile et s'y arrêter : elle se déplie.
    await moveBy(-90);
    await dwell();
    expect(screen.getByTestId(`movement-pile-${group}-expanded`)).toBeTruthy();
    await act(async () => {
      fireEvent(screen.getByTestId("movement-catalogue-items"), "touchCancel", { nativeEvent: { pageX: 100, pageY: 0 } });
    });
  });

  it("FAM-06, C2 : entrer dans une pile dépliée ouvre la place — membres suivants, filet et entrées suivantes décalés d'un pas", async () => {
    const repository = movements();
    await repository.create(movement("squat", "Squats"));
    await repository.create(movement("tirage", "Tirage"));
    await repository.create(movement("zumba", "Zumba"));
    await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
    await renderList();
    const group = (await membership("squat"))!.groupId;
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-card-squat-card"));
    });
    await settle();
    await layOut([{ key: group, members: ["squat", "assist"] }, { key: "tirage" }, { key: "zumba" }]);
    // « Tirage » (centre 216) portée dans la moitié basse de « Squats » (centre 60).
    await grab("tirage");
    await moveBy(-156);
    expect(translateY("movement-card-squat-slot")).toBe(0);
    expect(translateY("movement-card-assist-slot")).toBe(84);
    expect(StyleSheet.flatten(screen.getByTestId(`movement-pile-${group}-rail`).props.style).bottom).toBe(40 - 84);
    expect(translateY("movement-item-zumba-shift")).toBe(84);
    expect(translateY(`movement-item-${group}-shift`)).toBe(0);
    // Hors de la pile : la place se referme.
    await moveBy(0);
    expect(translateY("movement-card-assist-slot")).toBe(0);
    expect(translateY("movement-item-zumba-shift")).toBe(0);
    expect(StyleSheet.flatten(screen.getByTestId(`movement-pile-${group}-rail`).props.style).bottom).toBe(40);
    await release();
  });

  it("C1 : créer une famille ouvre aussi la place — carte visée décalée quand on se pose au-dessus", async () => {
    const repository = movements();
    for (const [id, name] of [["fentes", "Fentes avant"], ["gainage", "Gainage"], ["mob", "Mobilisation du genou"]] as const) {
      await repository.create(movement(id, name));
    }
    await renderList();
    await layOut([{ key: "fentes" }, { key: "gainage" }, { key: "mob" }]);
    await grab("mob");
    await moveBy(-110);
    expect(translateY("movement-card-gainage-slot")).toBe(84);
    expect(translateY("movement-item-fentes-shift")).toBe(0);
    await moveBy(-70);
    // Moitié basse de « Gainage » : la carte visée reste, la place s'ouvre dessous.
    expect(translateY("movement-card-gainage-slot")).toBe(0);
    await act(async () => {
      fireEvent(screen.getByTestId("movement-catalogue-items"), "touchCancel", { nativeEvent: { pageX: 100, pageY: 0 } });
    });
    await settle();
    expect(await membership("mob")).toBeNull();
  });
});
