import { render, screen, waitFor, within } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useEffect } from "react";

import type { CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { createEmptyDraft } from "@/domain/sessions/SessionDraft";
import { ActivityCatalogueList } from "@/features/activities/ActivityCatalogueList";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { ActivitySelectionScreen } from "@/features/activities/ActivitySelectionScreen";
import { withLevelSuffix } from "@/features/activities/movementChoicePresentation";
import { useActivityCatalogue } from "@/features/activities/useActivityCatalogue";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-7 story R-6 (D-445 C06, v7 l.69, MFN-10 l.426 ; relevé du 25/10 §6 « Squat assisté - N1 ») —
 * suffixe dérivé « - Nn » des cartes sans pastille (Catalogue, choix d'exercices), sur les VRAIS
 * services et une base SQLite réelle : présent pour un mouvement groupé, absent sans groupe ou en
 * groupe singleton, jamais stocké dans le nom. Rappel : ces tests ne valent pas recette sur iPhone.
 */

jest.mock("expo-crypto", () => {
  let counter = 0;
  return { randomUUID: jest.fn(() => `occ-${++counter}`) };
});
jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactActual = require("react") as typeof import("react");
  return {
    useRouter: () => ({ back: jest.fn() }),
    useFocusEffect: (callback: () => void | (() => void)) => {
      ReactActual.useEffect(() => callback(), []);
    },
  };
});

let database: NodeSqliteDatabase;
let sequence = 0;
let tick = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
const clock = () => new Date(Date.UTC(2026, 9, 26, 9, 0, ++tick)).toISOString();
const movements = () => new SqliteMovementRepository(database, ids("grp"), clock);
const service = () =>
  new ActivityDefinitionService(
    new SqliteActivityDefinitionRepository(database, ids("def"), clock),
    new SqliteCategoryRepository(database),
    new SqliteBodyZoneRepository(database),
    undefined,
    undefined,
    movements(),
  );

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
});

afterEach(() => {
  database.close();
});

const input = (name: string): CreateActivityDefinitionInput => ({
  name,
  description: null,
  category: { kind: "EXISTING", categoryId: "cardio" },
  bodyZoneIds: ["cuisses"],
  executionParameters: durationParameters(30, 3, 10),
});

async function create(name: string, origin: Parameters<ActivityDefinitionService["createActivityDefinitionWithOrigin"]>[1] = { kind: "INDEPENDENT" }) {
  const result = await service().createActivityDefinitionWithOrigin(input(name), origin);
  if (result.status !== "CREATED") throw new Error(result.status);
  return result.value;
}

/** « Squats assistés » (1 sur 2) → « Squats » (2 sur 2) ; « Pompes » sans groupe. */
async function fixtures() {
  const assisted = await create("Squats assistés");
  const squats = await create("Squats", { kind: "VARIANT", originMovementId: assisted.movementId, joinOriginGroup: true });
  const pushUps = await create("Pompes");
  return { assisted, squats, pushUps };
}

function CatalogueHarness() {
  const { state, reload } = useActivityCatalogue();
  useEffect(() => reload(), [reload]);
  return <ActivityCatalogueList state={state} onRetry={reload} onOpenDefinition={jest.fn()} />;
}

const titleOf = (definitionId: string) => {
  const card = screen.getByTestId(`activity-card-${definitionId}`);
  return within(card).getAllByText(/./u)[0]!.props.children;
};

describe("PRE-7 R-6 — withLevelSuffix", () => {
  it("« nom - Nn » avec une position ; nom seul sans position", () => {
    expect(withLevelSuffix("Squat assisté", { rank: 1, total: 3 })).toBe("Squat assisté - N1");
    expect(withLevelSuffix("Squats", { rank: 12, total: 12 })).toBe("Squats - N12");
    expect(withLevelSuffix("Pompes", null)).toBe("Pompes");
    expect(withLevelSuffix("Pompes", undefined)).toBe("Pompes");
    // Un nom contenant un motif de remplacement reste littéral.
    expect(withLevelSuffix("A $& B", { rank: 2, total: 2 })).toBe("A $& B - N2");
  });
});

describe("PRE-7 R-6 — listMovementLevelPositions", () => {
  it("positions des mouvements groupés seulement ; singleton et mouvement sans groupe absents", async () => {
    const { assisted, squats, pushUps } = await fixtures();
    const positions = await service().listMovementLevelPositions();
    expect(positions.get(assisted.movementId)).toEqual({ rank: 1, total: 2 });
    expect(positions.get(squats.movementId)).toEqual({ rank: 2, total: 2 });
    expect(positions.has(pushUps.movementId)).toBe(false);
    await movements().detachFromGroup(squats.movementId);
    const after = await service().listMovementLevelPositions();
    expect(after.has(assisted.movementId)).toBe(false);
    expect(after.has(squats.movementId)).toBe(false);
  });
});

describe("PRE-7 R-6 — cartes sans pastille", () => {
  it("Catalogue : « Squats assistés - N1 », « Squats - N2 », « Pompes » ; le nom enregistré reste sans suffixe", async () => {
    const { assisted, squats, pushUps } = await fixtures();
    render(
      <ActivityDefinitionServiceContext.Provider value={service()}>
        <CatalogueHarness />
      </ActivityDefinitionServiceContext.Provider>,
    );
    await waitFor(() => expect(screen.getByTestId("activity-catalogue-list")).toBeTruthy());
    expect(titleOf(assisted.id)).toBe("Squats assistés - N1");
    expect(titleOf(squats.id)).toBe("Squats - N2");
    expect(titleOf(pushUps.id)).toBe("Pompes");
    expect((await service().getActivityDefinition(squats.id))?.name).toBe("Squats");
  });

  it("Catalogue : lecture des positions en échec — liste affichée, cartes sans suffixe (journal)", async () => {
    const { squats } = await fixtures();
    const failing = service();
    jest.spyOn(failing, "listMovementLevelPositions").mockRejectedValue(new Error("lecture"));
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <ActivityDefinitionServiceContext.Provider value={failing}>
        <CatalogueHarness />
      </ActivityDefinitionServiceContext.Provider>,
    );
    await waitFor(() => expect(screen.getByTestId("activity-catalogue-list")).toBeTruthy());
    expect(titleOf(squats.id)).toBe("Squats");
    expect(log).toHaveBeenCalledWith("Impossible de charger les niveaux des mouvements.", expect.any(Error));
    log.mockRestore();
  });

  it("choix d'exercices : la ligne et son nom accessible portent le suffixe", async () => {
    const { squats, pushUps } = await fixtures();
    const profileService = {
      getProfile: jest.fn(async () => createDefaultProfile("profile-1", "2026-01-01T00:00:00.000Z")),
    } as unknown as ProfileService;
    render(
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider value={service()}>
          <ProfileServiceContext.Provider value={profileService}>
            <SessionDraftContext.Provider value={{ draft: createEmptyDraft(), updateDraft: jest.fn(), resetDraft: jest.fn() }}>
              <ActivitySelectionScreen />
            </SessionDraftContext.Provider>
          </ProfileServiceContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());
    expect(screen.getByTestId(`activity-selection-row-${squats.id}`).props.accessibilityLabel).toBe("Squats - N2");
    expect(within(screen.getByTestId(`activity-selection-row-${squats.id}`)).getByText("Squats - N2")).toBeTruthy();
    expect(screen.getByTestId(`activity-selection-row-${pushUps.id}`).props.accessibilityLabel).toBe("Pompes");
  });
});
