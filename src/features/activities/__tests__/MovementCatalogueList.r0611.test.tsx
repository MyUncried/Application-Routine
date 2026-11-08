import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo, Animated, StyleSheet } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { MovementCatalogueList, PLACE_DWELL_MS } from "@/features/activities/MovementCatalogueList";
import { EMPTY_MOVEMENT_FILTERS } from "@/features/activities/movementCatalogueView";
import { MOTION_FADE_DURATION_MS } from "@/features/sessions/compositionMotion";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Recette iPhone du 06/11/2026 (Hermann) — Catalogue des Mouvements :
 * - t-glisser : le filet de placement et le décalage de la carte visée n'apparaissent qu'après un arrêt d'environ 0,4 s ;
 * - t-catalogue : apparition progressive de la liste ; repli et dépli d'une pile par glissement des cartes ;
 * - t-niveau : pastille « NEW » — remplacée par D-510, voir `MovementCatalogueList.d510.test.tsx`.
 * Les animations elles-mêmes (fil UI) se jugent sur iPhone ; ici, leur présence et leurs paramètres.
 */

jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

const NOW = "2026-11-06T09:00:00.000Z";
let database: NodeSqliteDatabase;
let sequence = 0;
const movements = () => new SqliteMovementRepository(database, () => `grp-${++sequence}`, () => NOW);
const service = () => new ActivityDefinitionService(undefined, undefined, undefined, undefined, movements());

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
  // Réglage « Réduire les animations » explicite pour chaque test (le simulacre est partagé entre les tests).
  jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
});

afterEach(() => {
  jest.useRealTimers();
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
/** Entrées isolées de 72 (D-508) + écart de 12, de haut en bas. */
async function layOut(keys: readonly string[]) {
  await act(async () => {
    keys.forEach((key, index) => fireEvent(screen.getByTestId(`movement-item-${key}`), "layout", layoutEvent(index * 84, 84)));
  });
}

const START_Y = 500;
const items = () => screen.getByTestId("movement-catalogue-items");
async function grab(movementId: string) {
  await act(async () => {
    fireEvent(items(), "touchStart", { nativeEvent: { pageX: 100, pageY: START_Y } });
    fireEvent(screen.getByTestId(`movement-card-${movementId}-card`), "longPress");
  });
}
/** Déplacement synchrone (minuteries simulées). */
const moveBy = (dy: number) =>
  act(() => {
    fireEvent(items(), "touchMove", { nativeEvent: { pageX: 100, pageY: START_Y + dy } });
  });
const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });
const rail = (id: string) => screen.queryByTestId(`movement-card-${id}-formation-rail`);
const translateY = (testID: string) =>
  (StyleSheet.flatten(screen.getByTestId(testID).props.style).transform as { translateY: number }[] | undefined)?.[0]?.translateY ?? 0;

async function seedThree() {
  const repository = movements();
  for (const [id, name] of [["fentes", "Fentes avant"], ["gainage", "Gainage"], ["mob", "Mobilisation du genou"]] as const) {
    await repository.create(movement(id, name));
  }
}

describe("t-glisser (06/11/2026) : la pose sur une carte attend un arrêt de 0,4 s", () => {
  beforeEach(() => {
    // « Réduire les animations » : décalages appliqués aussitôt.
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
  });

  it("constante nommée de 400 ms", () => {
    expect(PLACE_DWELL_MS).toBe(400);
  });

  it("arrêt sur la carte visée : rien avant 0,4 s, filet et décalage ensuite ; un tremblement léger ne relance pas l'attente", async () => {
    await seedThree();
    await renderList();
    await layOut(["fentes", "gainage", "mob"]);
    jest.useFakeTimers();
    await grab("mob");
    // « Mobilisation » (centre 204) dans la moitié haute de « Gainage » (84 à 120).
    moveBy(-110);
    expect(rail("gainage")).toBeNull();
    expect(translateY("movement-card-gainage-slot")).toBe(0);
    advance(PLACE_DWELL_MS - 100);
    // Tremblement de 3 : toujours arrêté.
    moveBy(-113);
    advance(99);
    expect(rail("gainage")).toBeNull();
    advance(1);
    expect(rail("gainage")).toBeTruthy();
    expect(translateY("movement-card-gainage-slot")).toBe(76);
    // Annoncée, la place reste tant que la carte ne la quitte pas.
    moveBy(-115);
    expect(rail("gainage")).toBeTruthy();
    act(() => {
      fireEvent(items(), "touchCancel", { nativeEvent: { pageX: 100, pageY: 0 } });
    });
  });

  it("passer sur une carte sans s'arrêter ne déclenche rien ; relâcher avant l'arrêt n'écrit rien", async () => {
    await seedThree();
    await renderList();
    await layOut(["fentes", "gainage", "mob"]);
    jest.useFakeTimers();
    await grab("mob");
    // Glissement continu au-dessus de « Gainage » puis de « Fentes avant » : chaque pas relance l'attente.
    for (const dy of [-100, -110, -120, -130, -140, -150, -160, -170, -180, -190, -200]) {
      moveBy(dy);
      advance(PLACE_DWELL_MS / 2);
      expect(rail("gainage")).toBeNull();
      expect(rail("fentes")).toBeNull();
    }
    act(() => {
      fireEvent(items(), "touchEnd", { nativeEvent: { pageX: 100, pageY: 0 } });
    });
    jest.useRealTimers();
    await settle();
    expect(screen.queryByTestId("movement-catalogue-notice-message")).toBeNull();
    expect((await movements().findById("mob"))?.levelGroup ?? null).toBeNull();
    expect((await movements().findById("gainage"))?.levelGroup ?? null).toBeNull();
  });

  it("changer de côté de la carte visée relance l'attente ; la place déjà annoncée se referme aussitôt", async () => {
    await seedThree();
    await renderList();
    await layOut(["fentes", "gainage", "mob"]);
    jest.useFakeTimers();
    await grab("mob");
    moveBy(-110);
    advance(PLACE_DWELL_MS);
    expect(translateY("movement-card-gainage-slot")).toBe(76);
    // Moitié basse de « Gainage » : autre place — fermée tant que la carte ne s'y arrête pas.
    moveBy(-70);
    expect(translateY("movement-card-gainage-slot")).toBe(0);
    expect(rail("gainage")).toBeNull();
    advance(PLACE_DWELL_MS);
    expect(rail("gainage")).toBeTruthy();
    expect(translateY("movement-card-gainage-slot")).toBe(0);
    act(() => {
      fireEvent(items(), "touchCancel", { nativeEvent: { pageX: 100, pageY: 0 } });
    });
  });
});

describe("t-catalogue (06/11/2026) : apparition de la liste et glissement des cartes d'une pile", () => {
  const opacity = () => StyleSheet.flatten(screen.getByTestId("movement-catalogue-appear").props.style).opacity as number;

  it("la liste apparaît en fondu (450 ms) avec une courte montée, pas d'un coup", async () => {
    const timing = jest.spyOn(Animated, "timing");
    await seedThree();
    await renderList();
    const appear = timing.mock.calls.find(([, config]) => config.duration === MOTION_FADE_DURATION_MS && config.toValue === 1);
    expect(appear).toBeDefined();
    expect(appear![1]).toMatchObject({ useNativeDriver: true });
    const transform = StyleSheet.flatten(screen.getByTestId("movement-catalogue-appear").props.style).transform as unknown[];
    expect(transform).toHaveLength(1);
    // Fondu parti de 0 (Jest ne joue pas l’animation native).
    expect(opacity()).toBe(0);
  });

  it("« Réduire les animations » : liste affichée aussitôt", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    await seedThree();
    await renderList();
    expect(opacity()).toBe(1);
  });

  it("pile dépliée : chaque carte suivante glisse depuis la carte du dessus et y remonte au repli, sous les cartes qui la précèdent", async () => {
    const repository = movements();
    await repository.create(movement("squat", "Squats"));
    await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
    await repository.createVariant(movement("jump", "Squats sautés"), "squat", "AFTER_ORIGIN");
    await renderList();
    const group = (await movements().findById("squat"))!.levelGroup!.groupId;
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-card-jump-card"));
    });
    await settle();
    const frame = (id: string) => screen.getByTestId(`movement-pile-${group}-member-${id}`);
    // Carte du dessus : aucune entrée propre ; suivantes : entrée et sortie par glissement.
    expect(frame("jump").props.entering).toBeUndefined();
    expect(typeof frame("squat").props.entering).toBe("function");
    expect(typeof frame("squat").props.exiting).toBe("function");
    expect(typeof frame("assist").props.entering).toBe("function");
    // Ordre de superposition : du dessus vers le dessous ; la zone de repli reste au-dessus de toutes.
    const z = (id: string) => StyleSheet.flatten(frame(id).props.style).zIndex as number;
    expect(z("jump")).toBeGreaterThan(z("squat"));
    expect(z("squat")).toBeGreaterThan(z("assist"));
    expect(StyleSheet.flatten(screen.getByTestId(`movement-pile-${group}-collapse`).props.style).zIndex).toBeGreaterThan(z("jump"));
    // Transition de place des entrées et des cartes.
    expect(screen.getByTestId(`movement-item-${group}`).props.layout).toBeDefined();
  });

  it("« Réduire les animations » : aucun glissement", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    const repository = movements();
    await repository.create(movement("squat", "Squats"));
    await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
    await renderList();
    const group = (await movements().findById("squat"))!.levelGroup!.groupId;
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-card-squat-card"));
    });
    await settle();
    const frame = screen.getByTestId(`movement-pile-${group}-member-assist`);
    expect(frame.props.entering).toBeUndefined();
    expect(frame.props.exiting).toBeUndefined();
    expect(frame.props.layout).toBeUndefined();
  });
});

describe("d-nonreg / t-glisser (recette du 06/11 au soir) : aucun glissement de pile pendant le geste ni juste après", () => {
  it("carte portée dans une pile dépliée : ni entrée, ni sortie, ni superposition ; retour des glissements après le calme", async () => {
    const repository = movements();
    await repository.create(movement("squat", "Squats"));
    await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
    await repository.createVariant(movement("jump", "Squats sautés"), "squat", "AFTER_ORIGIN");
    await renderList();
    const group = (await movements().findById("squat"))!.levelGroup!.groupId;
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-card-jump-card"));
    });
    await settle();
    const frame = (id: string) => screen.getByTestId(`movement-pile-${group}-member-${id}`);
    const quiet = (id: string) => {
      expect(frame(id).props.entering).toBeUndefined();
      expect(frame(id).props.exiting).toBeUndefined();
      expect(StyleSheet.flatten(frame(id).props.style).zIndex).toBeUndefined();
    };
    jest.useFakeTimers();
    await grab("squat");
    ["jump", "assist"].forEach(quiet);
    expect(StyleSheet.flatten(frame("squat").props.style).zIndex).toBeGreaterThan(0);
    // Relâchement : toujours calme pendant l'écriture et la relecture.
    await act(async () => {
      fireEvent(items(), "touchEnd", { nativeEvent: { pageX: 100, pageY: START_Y } });
    });
    expect(frame("assist").props.entering).toBeUndefined();
    expect(frame("assist").props.exiting).toBeUndefined();
    expect(StyleSheet.flatten(frame("jump").props.style).zIndex).toBeUndefined();
    await advance(900);
    expect(typeof frame("assist").props.entering).toBe("function");
    expect(StyleSheet.flatten(frame("jump").props.style).zIndex).toBeGreaterThan(StyleSheet.flatten(frame("squat").props.style).zIndex as number);
  });
});

describe("y-pile (recette iPhone du 07/11) : dans une pile ouverte, les cartes s'écartent au passage, sans arrêt", () => {
  beforeEach(() => {
    // « Réduire les animations » : décalages appliqués aussitôt.
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
  });

  it("entrée dans une pile dépliée (C2) : place ouverte dès le survol de chaque membre, relâchée aussitôt à la bonne place, carte présente", async () => {
    const repository = movements();
    await repository.create(movement("squat", "Squats"));
    await repository.create(movement("tirage", "Tirage"));
    await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
    await repository.createVariant(movement("jump", "Squats sautés"), "squat", "AFTER_ORIGIN");
    await renderList();
    const group = (await movements().findById("squat"))!.levelGroup!.groupId;
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-card-jump-card"));
    });
    await settle();
    // Pile dépliée (0 à 240 : « jump » 0-72, « squat » 76-148, « assist » 152-224, + 12), « Tirage » dessous (240 à 324, carte de 72, centre 276).
    await act(async () => {
      fireEvent(screen.getByTestId(`movement-item-${group}`), "layout", layoutEvent(0, 240));
      ["jump", "squat", "assist"].forEach((id, index) =>
        fireEvent(screen.getByTestId(`movement-pile-${group}-member-${id}`), "layout", layoutEvent(index === 0 ? 0 : index * 76 - 4, index === 0 ? 72 : 76)),
      );
      fireEvent(screen.getByTestId("movement-item-tirage"), "layout", layoutEvent(240, 84));
    });
    jest.useFakeTimers();
    await grab("tirage");
    // Moitié basse de « assist » (152 à 224 ; centre porté 192) : place ouverte sous elle, aucun membre décalé — sans attendre.
    moveBy(-84);
    expect(translateY("movement-card-assist-slot")).toBe(0);
    expect(StyleSheet.flatten(screen.getByTestId(`movement-pile-${group}-rail`).props.style).bottom).toBe(36 - 76);
    // Moitié haute de « assist » : « assist » descend d'un pas, aussitôt.
    moveBy(-110);
    expect(translateY("movement-card-assist-slot")).toBe(76);
    expect(translateY("movement-card-squat-slot")).toBe(0);
    // Moitié haute de « squat » (76 à 148 ; centre porté 96) : « squat » et « assist » décalés, aussitôt.
    moveBy(-180);
    expect(translateY("movement-card-squat-slot")).toBe(76);
    expect(translateY("movement-card-assist-slot")).toBe(76);
    expect(translateY("movement-card-jump-slot")).toBe(0);
    // Niveaux provisoires annoncés sans arrêt.
    expect(screen.getByTestId("movement-card-level-tirage").props.children).toBe("Niveau 3");
    // Relâchée sans s'arrêter : entrée à la place annoncée.
    act(() => {
      fireEvent(items(), "touchEnd", { nativeEvent: { pageX: 100, pageY: 0 } });
    });
    jest.useRealTimers();
    await settle();
    expect(screen.getByTestId("movement-catalogue-notice-message").props.children).toBe("Mouvement ajouté à la famille");
    expect((await movements().listGroup(group)).map((member) => member.id)).toEqual(["assist", "squat", "tirage", "jump"]);
    // d-nonreg : la carte déposée est affichée dans la pile, à sa place.
    expect(screen.getByTestId(`movement-pile-${group}-member-tirage`)).toBeTruthy();
  });

  it("former une famille sur une carte sans famille (C1) attend toujours l'arrêt de 0,4 s", async () => {
    await seedThree();
    await renderList();
    await layOut(["fentes", "gainage", "mob"]);
    jest.useFakeTimers();
    await grab("mob");
    moveBy(-110);
    expect(rail("gainage")).toBeNull();
    expect(translateY("movement-card-gainage-slot")).toBe(0);
    advance(PLACE_DWELL_MS);
    expect(rail("gainage")).toBeTruthy();
    act(() => {
      fireEvent(items(), "touchCancel", { nativeEvent: { pageX: 100, pageY: 0 } });
    });
  });
});
