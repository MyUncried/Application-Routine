import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { MovementSelectionScreen } from "@/features/activities/MovementSelectionScreen";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { markMovementsInSession } from "@/features/sessions/movementExercises";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Recette iPhone CAT.1 du 30/10/2026, constat a) (Hermann : « Choisir un mouvement existant : les
 * piles où se trouvent un ou des mouvements déjà utilisés doivent être dépliées si le ou les
 * mouvements ne sont pas visibles. Réutiliser le contenu et format de la zone de contexte du
 * catalogue des mouvements, sans le bouton "Créer" ») — sélection « Utiliser un mouvement existant ».
 */

jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return { ...actual, useRouter: () => ({ push: jest.fn(), back: jest.fn(), setParams: jest.fn() }) };
});

const NOW = "2026-10-30T09:00:00.000Z";
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

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  // Famille Squats (carte du dessus : Squats sautés), Fentes et Gainage indépendants.
  await movements().create(movement("squat", "Squats"));
  await movements().create(movement("fentes", "Fentes avant"));
  await movements().create(movement("gainage", "Gainage"));
  await movements().createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
  await movements().createVariant(movement("jump", "Squats sautés"), "squat", "AFTER_ORIGIN");
});

afterEach(() => {
  markMovementsInSession([]);
  database.close();
});

async function renderSelection(inSession: readonly string[]) {
  markMovementsInSession(inSession);
  const service = new ActivityDefinitionService(
    undefined,
    undefined,
    undefined,
    undefined,
    movements(),
  );
  render(
    <TestSafeAreaProvider>
      <ReferentialServiceContext.Provider value={referentials}>
        <ActivityDefinitionServiceContext.Provider value={service}>
          <MovementSelectionScreen />
        </ActivityDefinitionServiceContext.Provider>
      </ReferentialServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

const movementsShown = () => screen.queryAllByTestId(/^movement-card-name-/).map((node) => node.props.children as string);
const text = (testID: string) => screen.getByTestId(testID).props.children as string;

describe("Recette iPhone CAT.1 du 30/10/2026 — « Utiliser un mouvement existant »", () => {
  it("pile dont un Mouvement déjà utilisé est masqué : ouverte dépliée", async () => {
    await renderSelection(["assist"]);
    expect(movementsShown()).toEqual(expect.arrayContaining(["Squats sautés", "Squats", "Squats assistés"]));
    expect(movementsShown()).toHaveLength(5);
    expect(screen.getByTestId("movement-card-in-session-assist")).toBeTruthy();
  });

  it("Mouvement déjà utilisé visible (carte du dessus) ou aucun : pile laissée repliée", async () => {
    await renderSelection(["jump"]);
    expect(movementsShown()).toEqual(["Fentes avant", "Gainage", "Squats sautés"]);
  });

  it("zone de contexte du Catalogue des Mouvements, sans Créer : compteurs, Rechercher, Filtre, Tri", async () => {
    await renderSelection([]);
    const band = screen.getByTestId("screen-context-band");
    expect(within(band).getByTestId("catalogue-context-zone")).toBeTruthy();
    expect(within(band).getByTestId("movement-selection-search")).toBeTruthy();
    expect(within(band).getByTestId("movement-selection-filter")).toBeTruthy();
    expect(within(band).getByTestId("catalogue-sort-action")).toBeTruthy();
    expect(within(band).queryByTestId("catalogue-create-action")).toBeNull();
    expect(text("movement-catalogue-counter-FAMILIES-label")).toBe("1 famille");
    expect(text("movement-catalogue-counter-MOVEMENTS-label")).toBe("5 mouvements");
    expect(screen.queryByTestId("catalogue-results")).toBeNull();

    // Même comportement qu'au Catalogue : « mouvements » déplie les piles affichées.
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-catalogue-counter-MOVEMENTS"));
    });
    expect(movementsShown()).toHaveLength(5);
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-catalogue-counter-MOVEMENTS"));
    });
    expect(movementsShown()).toHaveLength(3);
  });

  it("D-501 révisée (Hermann, 08/11/2026) : fond, zone de contexte et fondu du bas aux couleurs du Catalogue des mouvements", async () => {
    await renderSelection([]);
    const flat = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style);
    expect(flat("screen-shell").backgroundColor).toBe("#F1F7FF");
    expect(flat("screen-context-band").backgroundColor).toBe("#DDEBFF");
    expect(flat("movement-selection-bottom-action-gradient").experimental_backgroundImage).toBe(
      "linear-gradient(to bottom, #F1F7FF00 0%, #F1F7FF 100%)",
    );
  });
});
