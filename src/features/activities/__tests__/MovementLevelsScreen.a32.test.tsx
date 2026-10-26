import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Modal, StyleSheet } from "react-native";

import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { MovementLevelsScreen } from "@/features/activities/MovementLevelsScreen";
import { TABLE_ROW_HEIGHT } from "@/features/activities/sheetTable";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { seedCatalogueDefinition } from "@/infrastructure/database/testing/seedCatalogueDefinition";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-id") }));

/**
 * PRE-7 story A3.2 (D-439, MFN-05, MFN/AC07, MFN/AC33 ; matrice de
 * `spec-a3-2-consultation-reordonnancement-niveaux.md`) — écran des niveaux sur le VRAI service et
 * une base SQLite réelle : liste ordonnée, glisser (`DraggableRow`), Monter / Descendre accessibles,
 * bornes, échecs de lecture et d'écriture, « Réduire les animations ». Écran `NON VÉRIFIABLE` :
 * ces tests ne valent pas recette sur iPhone (JA).
 */

const NOW = "2026-10-24T12:00:00.000Z";
let database: NodeSqliteDatabase;
let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
const movements = () => new SqliteMovementRepository(database, ids("grp"), () => NOW);
const service = () =>
  new ActivityDefinitionService(
    new SqliteActivityDefinitionRepository(database, ids("def"), () => NOW),
    undefined,
    undefined,
    undefined,
    undefined,
    movements(),
  );

const { AccessibilityInfo } = jest.requireActual<typeof import("react-native")>("react-native");

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  sequence = 0;
});

afterEach(() => {
  database.close();
  jest.restoreAllMocks();
});

/** « Squats assistés » (1, un Exercice) → « Squats » (2, deux) → « Mobilisation du genou » (3, geste local). */
async function threeLevels() {
  await seedCatalogueDefinition(database, { id: "d1", movementId: "assistes", name: "Squats assistés" });
  await seedCatalogueDefinition(database, { id: "d2", movementId: "squats", name: "Squats" });
  await database.runAsync(
    "INSERT INTO activity_definitions (id, movement_id, execution_parameters, created_at, updated_at) SELECT 'd3', movement_id, execution_parameters, created_at, updated_at FROM activity_definitions WHERE id = 'd2'",
  );
  await seedCatalogueDefinition(database, { id: "d4", movementId: "genou", name: "Mobilisation du genou" });
  await database.runAsync("DELETE FROM activity_definitions WHERE id = 'd4'");
  await movements().attachToGroup("squats", "assistes");
  await movements().attachToGroup("genou", "assistes");
}

async function settle(ms = 0) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

async function renderScreen(screenService: ActivityDefinitionService = service(), movementId = "squats") {
  const onClose = jest.fn();
  render(
    <TestSafeAreaProvider>
      <MovementLevelsScreen service={screenService} movementId={movementId} onClose={onClose} />
    </TestSafeAreaProvider>,
  );
  await settle();
  await settle();
  return { onClose };
}

const row = (n: number) => `movement-levels-row-${n}`;
const names = () => [1, 2, 3].map((n) => screen.queryByTestId(`${row(n)}-name`)?.props.children ?? null);
const groupOrder = async () =>
  (await database.getAllAsync<{ id: string }>("SELECT id FROM movements WHERE level_group_id IS NOT NULL ORDER BY level_sort_key")).map(
    (movement) => movement.id,
  );
const actionNames = (n: number) =>
  (screen.getByTestId(`${row(n)}-handle`).props.accessibilityActions as { name: string; label: string }[]).map((action) => action.label);

describe("PRE-7 A3.2 — MovementLevelsScreen", () => {
  it("consultation : titre, liste ordonnée (rang, geste, nombre d'Exercices ; geste local sans nombre), ✕ ferme", async () => {
    await threeLevels();
    const { onClose } = await renderScreen();
    expect(screen.getByText("Niveaux")).toBeTruthy();
    expect(names()).toEqual(["Squats assistés", "Squats", "Mobilisation du genou"]);
    expect(screen.getByTestId(`${row(1)}-count`).props.children).toBe("1 exercice");
    expect(screen.getByTestId(`${row(2)}-count`).props.children).toBe("2 exercices");
    expect(screen.queryByTestId(`${row(3)}-count`)).toBeNull();
    expect(screen.getByLabelText("Niveau 2")).toBeTruthy();
    expect(screen.getByTestId(`${row(2)}-handle`).props.accessibilityLabel).toBe("Déplacer le niveau 2");
    // Bornes : pas de Monter au premier, pas de Descendre au dernier.
    expect(actionNames(1)).toEqual(["Descendre le niveau 1"]);
    expect(actionNames(2)).toEqual(["Monter le niveau 2", "Descendre le niveau 2"]);
    expect(actionNames(3)).toEqual(["Monter le niveau 3"]);
    fireEvent.press(screen.getByTestId("screen-header-back"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("screen-header-back").props.accessibilityLabel).toBe("Retour");
  });

  it("glisser : repère d'insertion pendant le geste, niveau 3 déposé en tête, ordre écrit, rangs recalculés", async () => {
    await threeLevels();
    await renderScreen();
    const handle = screen.getByTestId(`${row(3)}-handle`);
    fireEvent(handle, "responderGrant", { nativeEvent: { pageY: 300 } });
    fireEvent(handle, "responderMove", { nativeEvent: { pageY: 300 - 2 * TABLE_ROW_HEIGHT } });
    expect(screen.getByTestId("movement-levels-insertion-guide-before-1", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId("movement-levels-list").props.scrollEnabled).toBe(false);
    fireEvent(screen.getByTestId(`${row(3)}-handle`), "responderRelease", { nativeEvent: { pageY: 300 - 2 * TABLE_ROW_HEIGHT } });
    // Ordre appliqué dans le rendu de la dépose.
    expect(names()).toEqual(["Mobilisation du genou", "Squats assistés", "Squats"]);
    await settle(20);
    expect(await groupOrder()).toEqual(["genou", "assistes", "squats"]);
    expect(names()).toEqual(["Mobilisation du genou", "Squats assistés", "Squats"]);
    expect(screen.queryByTestId("movement-levels-insertion-guide-before-1", { includeHiddenElements: true })).toBeNull();
    expect(screen.getByTestId("movement-levels-list").props.scrollEnabled).toBe(true);
    expect(screen.queryByTestId("movement-levels-save-error")).toBeNull();
  });

  it("Monter / Descendre accessibles : même déplacement métier que le glisser", async () => {
    await threeLevels();
    await renderScreen();
    fireEvent(screen.getByTestId(`${row(2)}-handle`), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    await settle(20);
    expect(await groupOrder()).toEqual(["squats", "assistes", "genou"]);
    expect(names()).toEqual(["Squats", "Squats assistés", "Mobilisation du genou"]);
    fireEvent(screen.getByTestId(`${row(2)}-handle`), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
    await settle(20);
    expect(await groupOrder()).toEqual(["squats", "genou", "assistes"]);
  });

  it("écriture en échec (rejet ou refus) : ordre précédent restauré, message, base intacte ; un nouveau déplacement l'efface", async () => {
    await threeLevels();
    const failing = service();
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const reorder = jest.spyOn(failing, "reorderMovementLevels").mockRejectedValueOnce(new Error("écriture"));
    await renderScreen(failing);
    fireEvent(screen.getByTestId(`${row(2)}-handle`), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    await settle(20);
    expect(names()).toEqual(["Squats assistés", "Squats", "Mobilisation du genou"]);
    expect(screen.getByTestId("movement-levels-save-error").props.children).toBe("La modification n’a pas pu être enregistrée. Réessayez.");
    expect(await groupOrder()).toEqual(["assistes", "squats", "genou"]);

    reorder.mockResolvedValueOnce({ status: "INVALID_ORDER" });
    fireEvent(screen.getByTestId(`${row(1)}-handle`), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
    expect(screen.queryByTestId("movement-levels-save-error")).toBeNull();
    await settle(20);
    expect(names()).toEqual(["Squats assistés", "Squats", "Mobilisation du genou"]);
    expect(screen.getByTestId("movement-levels-save-error")).toBeTruthy();

    fireEvent(screen.getByTestId(`${row(1)}-handle`), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
    await settle(20);
    expect(screen.queryByTestId("movement-levels-save-error")).toBeNull();
    expect(await groupOrder()).toEqual(["squats", "assistes", "genou"]);
    expect(log).toHaveBeenCalledWith("Les niveaux du geste n'ont pas pu être réordonnés.", expect.any(Error));
  });

  it("une seule écriture à la fois : un déplacement pendant l'écriture est ignoré", async () => {
    await threeLevels();
    const slow = service();
    let release: () => void = () => undefined;
    const real = slow.reorderMovementLevels.bind(slow);
    const reorder = jest.spyOn(slow, "reorderMovementLevels").mockImplementationOnce(
      (movementId, order) =>
        new Promise((resolve) => {
          release = () => resolve(real(movementId, order));
        }),
    );
    await renderScreen(slow);
    fireEvent(screen.getByTestId(`${row(2)}-handle`), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    fireEvent(screen.getByTestId(`${row(3)}-handle`), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    expect(reorder).toHaveBeenCalledTimes(1);
    expect(names()).toEqual(["Squats", "Squats assistés", "Mobilisation du genou"]);
    await act(async () => {
      release();
    });
    await settle(20);
    expect(await groupOrder()).toEqual(["squats", "assistes", "genou"]);
  });

  it("revue : fermeture pendant une écriture — onClose attend la fin de l'écriture ; plus aucun déplacement", async () => {
    await threeLevels();
    const slow = service();
    let release: () => void = () => undefined;
    const real = slow.reorderMovementLevels.bind(slow);
    const reorder = jest.spyOn(slow, "reorderMovementLevels").mockImplementationOnce(
      (movementId, order) =>
        new Promise((resolve) => {
          release = () => resolve(real(movementId, order));
        }),
    );
    const { onClose } = await renderScreen(slow);
    fireEvent(screen.getByTestId(`${row(2)}-handle`), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    fireEvent.press(screen.getByTestId("screen-header-back"));
    fireEvent.press(screen.getByTestId("screen-header-back"));
    fireEvent(screen.getByTestId(`${row(3)}-handle`), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    await settle(20);
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => {
      release();
    });
    await settle(20);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(reorder).toHaveBeenCalledTimes(1);
    expect(await groupOrder()).toEqual(["squats", "assistes", "genou"]);
  });

  it("revue : présentation de la Modal sans glissement sous « Réduire les animations »", async () => {
    await threeLevels();
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValueOnce(true);
    await renderScreen();
    expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe("none");
    screen.unmount();
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValueOnce(false);
    await renderScreen();
    expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe("slide");
  });

  it("lecture en échec : message et Réessayer, qui relit la liste", async () => {
    await threeLevels();
    const failing = service();
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(failing, "getMovementLevels").mockRejectedValueOnce(new Error("lecture"));
    await renderScreen(failing);
    expect(screen.getByText("Impossible de charger les niveaux.")).toBeTruthy();
    expect(screen.queryByTestId(row(1))).toBeNull();
    expect(log).toHaveBeenCalledWith("Les niveaux du geste n'ont pas pu être chargés.", expect.any(Error));
    fireEvent.press(screen.getByTestId("movement-levels-load-retry"));
    await settle();
    await settle();
    expect(names()).toEqual(["Squats assistés", "Squats", "Mobilisation du genou"]);
  });

  it("« Réduire les animations » : la ligne déposée est posée sans glissade ; sinon elle glisse jusqu'à sa place", async () => {
    await threeLevels();
    const dropAt = (n: number) => {
      const handle = screen.getByTestId(`${row(n)}-handle`);
      fireEvent(handle, "responderGrant", { nativeEvent: { pageY: 300 } });
      fireEvent(screen.getByTestId(`${row(n)}-handle`), "responderRelease", { nativeEvent: { pageY: 300 - 2 * TABLE_ROW_HEIGHT - 10 } });
    };
    const translateOf = (n: number) => StyleSheet.flatten(screen.getByTestId(row(n)).props.style).transform;

    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValueOnce(false);
    await renderScreen();
    dropAt(3);
    expect(translateOf(1)).toEqual([{ translateY: -10 }]);
    await settle(400);
    screen.unmount();

    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValueOnce(true);
    await renderScreen();
    dropAt(3);
    expect(translateOf(1)).toBeUndefined();
    await settle(20);
  });
});
