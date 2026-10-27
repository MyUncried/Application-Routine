import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import type { Movement } from "@/domain/activities/Movement";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { MovementCatalogueList } from "@/features/activities/MovementCatalogueList";
import { EMPTY_MOVEMENT_FILTERS, type MovementCatalogueFilters } from "@/features/activities/movementCatalogueView";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { strings } from "@/shared/i18n";

/**
 * PRE-8 (stories B.3, B.5 à B.8) — segment « Mouvements » sur une base SQLite réelle :
 * piles (rang le plus haut en tête, dépliage et repli), recherche en piles dépliables, ouverture de
 * la fiche, actions glissées (Partager grisé, Créer une variante, Archiver), archivage refusé ou
 * annulé, Archives (Restaurer, Supprimer après confirmation). Remplace la recette B.3 en liste
 * plate, supplantée par les arbitrages Q-B2 et Q3 du 27/10/2026.
 */

jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

const NOW = "2026-10-27T09:00:00.000Z";
const t = strings.screens.movement.catalogue;
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

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
});

afterEach(() => {
  database.close();
});

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

async function renderList(filters: MovementCatalogueFilters = EMPTY_MOVEMENT_FILTERS) {
  const onOpen = jest.fn();
  const onCreateVariant = jest.fn();
  const view = render(
    <ActivityDefinitionServiceContext.Provider value={service()}>
      <MovementCatalogueList reloadToken={0} filters={filters} onOpenMovement={onOpen} onCreateVariant={onCreateVariant} />
    </ActivityDefinitionServiceContext.Provider>,
  );
  await settle();
  return { onOpen, onCreateVariant, view };
}

const names = () => screen.queryAllByTestId(/^movement-card-name-/).map((node) => node.props.children as string);
const press = async (testID: string) => {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
  await settle();
};
const action = async (movementId: string, actionName: string) => {
  await act(async () => {
    fireEvent(screen.getByTestId(`movement-card-${movementId}-card`), "accessibilityAction", { nativeEvent: { actionName } });
  });
  await settle();
};

/** Famille Squats assistés (1) / Squats (2) / Squats sautés (3), plus Fentes avant (indépendant). */
async function seed() {
  const repository = movements();
  await repository.create(movement("squat", "Squats"));
  await repository.create(movement("fentes", "Fentes avant", { description: "Grand pas en avant" }));
  await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
  await repository.createVariant(movement("jump", "Squats sautés"), "squat", "AFTER_ORIGIN");
}

describe("PRE-8 B.5 à B.8 — Catalogue des Mouvements", () => {
  it("affiche un état vide sans Mouvement", async () => {
    await renderList();
    expect(screen.getByText(t.empty)).toBeTruthy();
  });

  it("B.5 : pile fermée, rang le plus haut en tête ; toucher la déplie (3, 2, 1), le trait la replie ; indépendant sans pastille", async () => {
    await seed();
    const { onOpen } = await renderList();
    expect(names()).toEqual(["Fentes avant", "Squats sautés"]);
    expect(screen.getByTestId("movement-card-level-jump").props.children).toBe("Niveau 3");
    expect(screen.queryByTestId("movement-card-level-fentes")).toBeNull();
    await press("movement-card-jump-card");
    expect(onOpen).not.toHaveBeenCalled();
    expect(names()).toEqual(["Fentes avant", "Squats sautés", "Squats", "Squats assistés"]);
    expect(screen.getByTestId("movement-card-level-assist").props.children).toBe("Niveau 1");
    await press("movement-card-squat-card");
    expect(onOpen).toHaveBeenCalledWith("squat");
    const pileKey = (await movements().findById("squat"))!.levelGroup!.groupId;
    await press(`movement-pile-${pileKey}-collapse`);
    expect(names()).toEqual(["Fentes avant", "Squats sautés"]);
    await press("movement-card-fentes-card");
    expect(onOpen).toHaveBeenCalledWith("fentes");
  });

  it("B.7 : la recherche présente la pile entière de ses membres correspondants, dépliable ; aucun résultat signalé", async () => {
    await seed();
    await renderList();
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("movement-catalogue-search"), "assistes");
    });
    expect(names()).toEqual(["Squats sautés"]);
    await press("movement-card-jump-card");
    expect(names()).toEqual(["Squats sautés", "Squats", "Squats assistés"]);
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("movement-catalogue-search"), "zzz");
    });
    expect(screen.getByText(t.noResult)).toBeTruthy();
  });

  it("B.6 : le glissement révèle Partager (grisé), Créer une variante, Archiver ; la variante propose Plus facile / Plus difficile", async () => {
    await movements().create(movement("gainage", "Gainage"));
    const { onCreateVariant } = await renderList();
    const row = screen.getByTestId("movement-card-gainage");
    await act(async () => {
      fireEvent(row, "touchStart", { nativeEvent: { pageX: 300, pageY: 10 } });
      fireEvent(row, "touchMove", { nativeEvent: { pageX: 60, pageY: 12 } });
      fireEvent(row, "touchEnd", { nativeEvent: { pageX: 60, pageY: 12 } });
    });
    expect(screen.getByTestId("movement-card-gainage-actions")).toBeTruthy();
    expect(screen.getByTestId("movement-card-gainage-action-share").props.accessibilityState).toMatchObject({ disabled: true });
    await press("movement-card-gainage-action-variant");
    await press("movement-card-gainage-harder");
    expect(onCreateVariant).toHaveBeenCalledWith("gainage", "AFTER_ORIGIN");
  });

  it("B.8 : archivage refusé tant qu'un Exercice utilise le Mouvement — « utilisé par 1 exercice », rien n'est écrit", async () => {
    await movements().create(movement("pompes", "Pompes"));
    await new SqliteSessionRepository(database, () => `ses-${++sequence}`, () => NOW).create({
      name: "Séance",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 3,
      exercises: [
        { type: "EXERCISE", structuralPosition: "IN_TOUR", executionParameters: durationParameters(30, 4), postActivityRecoverySeconds: 0, sourceMovementId: "pompes" },
      ],
    });
    await renderList();
    await action("pompes", "archive");
    expect(screen.getByTestId("movement-refusal-message").props.children).toBe(t.archiveRefused.messageOne);
    await press("movement-refusal-acknowledge");
    expect(screen.queryByTestId("movement-refusal-dialog")).toBeNull();
    expect(names()).toEqual(["Pompes"]);
    expect(await movements().listArchivedIds()).toEqual(new Set());
  });

  it("B.8 : archiver retire le membre de la vue active sans changer les rangs ; Annuler le restaure", async () => {
    await seed();
    await renderList();
    await action("jump", "archive");
    expect(screen.getByTestId("movement-catalogue-notice-message").props.children).toBe(t.archived);
    // Rang le plus haut ACTIF en tête, rang de la famille complète conservé : « Niveau 2 ».
    expect(names()).toEqual(["Fentes avant", "Squats"]);
    expect(screen.getByTestId("movement-card-level-squat").props.children).toBe("Niveau 2");
    await press("movement-catalogue-notice-action");
    expect(names()).toEqual(["Fentes avant", "Squats sautés"]);
    expect(await movements().listArchivedIds()).toEqual(new Set());
  });

  it("B.8 : vue Archivés — Restaurer (annulable), Supprimer après confirmation, sans annulation", async () => {
    await seed();
    await movements().archive("fentes");
    await movements().archive("squat");
    await renderList({ ...EMPTY_MOVEMENT_FILTERS, statuses: new Set(["ARCHIVED"]) });
    expect(names()).toEqual(["Fentes avant", "Squats"]);
    expect(screen.getByTestId("movement-card-level-squat").props.children).toBe("Niveau 2");
    await action("squat", "restore");
    expect(screen.getByTestId("movement-catalogue-notice-message").props.children).toBe(t.restored);
    expect(names()).toEqual(["Fentes avant"]);
    await press("movement-catalogue-notice-action");
    expect(names()).toEqual(["Fentes avant", "Squats"]);

    await action("fentes", "delete");
    expect(screen.getByText(t.deleteConfirm.title)).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByLabelText(t.deleteConfirm.cancel));
    });
    expect(await movements().findById("fentes")).not.toBeNull();
    await action("fentes", "delete");
    await act(async () => {
      fireEvent.press(screen.getByLabelText(t.deleteConfirm.confirm));
    });
    await settle();
    expect(await movements().findById("fentes")).toBeNull();
    expect(names()).toEqual(["Squats"]);
    expect(screen.queryByTestId("movement-catalogue-notice")).toBeNull();
  });
});
