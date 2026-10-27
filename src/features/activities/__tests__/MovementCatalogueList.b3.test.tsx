import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { MovementCatalogueList } from "@/features/activities/MovementCatalogueList";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { strings } from "@/shared/i18n";

/**
 * PRE-8 story B.3 (DSF Mouvements §1, recette MVT-03 côté Catalogue) — segment « Mouvements » sur
 * une base SQLite réelle : familles contiguës, rang de la famille complète, Mouvement sans
 * Exercice listé, recherche R02 par nom et alias, ouverture de la fiche. Aucune commande de pile,
 * filtre, tri ou action glissée n'est rendue (règles non arrêtées).
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

async function renderList(onOpen = jest.fn()) {
  render(
    <ActivityDefinitionServiceContext.Provider value={service()}>
      <MovementCatalogueList reloadToken={0} onOpenMovement={onOpen} />
    </ActivityDefinitionServiceContext.Provider>,
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  return onOpen;
}

const names = () => screen.queryAllByTestId(/^movement-card-name-/).map((node) => node.props.children as string);

describe("PRE-8 B.3 — Catalogue des Mouvements", () => {
  it("affiche un état vide sans Mouvement", async () => {
    await renderList();
    expect(screen.getByText(t.empty)).toBeTruthy();
  });

  it("liste les familles contiguës avec le rang de la famille complète ; un Mouvement indépendant n'a pas de pastille", async () => {
    const repository = movements();
    await repository.create(movement("squat", "Squats"));
    await repository.create(movement("fentes", "Fentes avant", { description: "Grand pas en avant" }));
    await repository.createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
    await repository.createVariant(movement("jump", "Squats sautés"), "squat", "AFTER_ORIGIN");
    await renderList();
    expect(names()).toEqual(["Fentes avant", "Squats assistés", "Squats", "Squats sautés"]);
    expect(screen.getByTestId("movement-card-level-assist").props.children).toBe("Niveau 1");
    expect(screen.getByTestId("movement-card-level-jump").props.children).toBe("Niveau 3");
    expect(screen.queryByTestId("movement-card-level-fentes")).toBeNull();
    expect(screen.getByText("Grand pas en avant")).toBeTruthy();
  });

  it("recherche au fil du nom et des alias (R02), sans reclasser les rangs ; aucun résultat signalé", async () => {
    const repository = movements();
    await repository.create(movement("squat", "Squats", { aliases: ["Flexion"] }));
    await repository.createVariant(movement("jump", "Squats sautés"), "squat", "AFTER_ORIGIN");
    await repository.create(movement("gainage", "Gainage"));
    await renderList();
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("movement-catalogue-search"), "sautes");
    });
    expect(names()).toEqual(["Squats sautés"]);
    expect(screen.getByTestId("movement-card-level-jump").props.children).toBe("Niveau 2");
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("movement-catalogue-search"), "flexion");
    });
    expect(names()).toEqual(["Squats"]);
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("movement-catalogue-search"), "zzz");
    });
    expect(screen.getByText(t.noResult)).toBeTruthy();
  });

  it("ouvre la fiche du Mouvement touché ; aucune commande de pile, filtre, tri ni action glissée", async () => {
    await movements().create(movement("gainage", "Gainage"));
    const onOpen = await renderList();
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-card-gainage"));
    });
    expect(onOpen).toHaveBeenCalledWith("gainage");
    for (const label of ["Partager", "Créer une variante", "Archiver", "Filtres"]) {
      expect(screen.queryByText(label)).toBeNull();
    }
  });
});
