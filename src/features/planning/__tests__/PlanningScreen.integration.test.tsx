import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { EVERY_TIME } from "@/domain/planning/Routine";
import type { StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { PlanningScreen } from "@/features/planning/PlanningScreen";
import { pendingPlanningSheet } from "@/features/planning/planningSheetRelay";
import { PlanningService } from "@/features/planning/PlanningService";
import { PlanningServiceContext } from "@/features/planning/PlanningServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteRoutineRepository } from "@/infrastructure/database/repositories/SqliteRoutineRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Formulaire de planification sur SQLite réelle : sélection à cases (CE-UI-04), formulaire (CE-UI-05),
 * enregistrement par la coche d'en-tête, liste ordonnée, modification d'une Routine existante.
 */

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-crypto", () => {
  let counter = 0;
  return { randomUUID: jest.fn(() => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`) };
});
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return { ...actual, useRouter: () => ({ push: mockPush, back: mockBack }), useFocusEffect: () => undefined };
});

let database: NodeSqliteDatabase;
let planning: PlanningService;
let permission: "granted" | "denied";
const refresh = jest.fn(async () => undefined);
let sessions: SqliteSessionRepository;
let ids = 0;
const START = "2030-08-05";

beforeEach(async () => {
  mockBack.mockClear();
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  await database.runAsync(
    `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
     VALUES ('mv-squat', 'Squat', 'squat', NULL, 'cardio', 1, '2026-10-28T08:00:00.000Z', '2026-10-28T08:00:00.000Z')`,
  );
  await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES ('mv-squat', 'dos')");
  sessions = new SqliteSessionRepository(database);
  permission = "granted";
  refresh.mockClear();
  planning = new PlanningService({
    repository: new SqliteRoutineRepository(database),
    reminders: { refresh, ensurePermission: async () => permission === "granted" },
    newId: () => `routine-${++ids}`,
    now: () => new Date(2030, 0, 1),
  });
});

afterEach(() => {
  database.close();
});

const input = (name: string): StructuredSessionInput => ({
  name,
  labelId: null,
  initialCountdownSeconds: 10,
  finalPhaseSeconds: 5,
  structure: {
    elements: [
      {
        kind: "CIRCUIT" as const,
        circuit: {
          id: `${name}-circuit`,
          repeatCount: 1,
          nature: "TOURS" as const,
          exercises: [
            { id: `${name}-0`, type: "EXERCISE" as const, executionParameters: durationParameters(30), postActivityRecoverySeconds: 0, sourceMovementId: "mv-squat" },
          ],
        },
      },
    ],
    stopPoints: [],
  },
});

async function flush() {
  await act(async () => {
    for (let index = 0; index < 20; index += 1) await new Promise((resolve) => setImmediate(resolve));
  });
}

async function renderPlanning(params: Parameters<typeof PlanningScreen>[0]["params"]) {
  const referentials = { listCategories: jest.fn(async () => []) } as unknown as ReferentialService;
  render(
    <TestSafeAreaProvider>
      <SessionServiceContext.Provider value={new SessionService(sessions)}>
        <ReferentialServiceContext.Provider value={referentials}>
          <PlanningServiceContext.Provider value={planning}>
            <PlanningScreen params={params} />
          </PlanningServiceContext.Provider>
        </ReferentialServiceContext.Provider>
      </SessionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  await flush();
}

const tapStep = (testID: string) => {
  fireEvent(screen.getByTestId(testID), "pressIn");
  fireEvent(screen.getByTestId(testID), "pressOut");
};

const summary = () => screen.getByTestId("planning-summary").props.children.props.children as string;

describe("Planifier", () => {
  it("depuis le Catalogue : une Séance préremplie, créneau unique, enregistrée par la coche", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    await renderPlanning({ sessionId: created.id, date: START });
    expect(screen.getByText("Planifier une séance")).toBeTruthy();
    expect(screen.getByTestId("planning-content-name").props.children).toBe("Gainage");
    expect(summary()).toBe("Planifiée le 5 août 2030 à 8 h, sans répétition.");
    expect(screen.queryByTestId("planning-entries")).toBeNull();
    fireEvent.press(screen.getByTestId("screen-header-validate"));
    await flush();
    const [routine] = await planning.listRoutines();
    expect(routine).toMatchObject({ startDate: START, time: "08:00", repetition: null, entries: [{ sessionId: created.id, frequency: EVERY_TIME }] });
    expect(mockBack).toHaveBeenCalled();
  });

  it("répétition : toutes les 2 semaines, lundis et jeudis, jusqu'au ; récapitulatif recomposé ; désactivée → aucune récurrence", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    await renderPlanning({ sessionId: created.id, date: START });
    fireEvent(screen.getByTestId("planning-repetition-switch"), "valueChange", true);
    fireEvent.press(screen.getByTestId("planning-every"));
    tapStep("planning-every-stepper-increment");
    fireEvent.press(screen.getByTestId("planning-weekday-4"));
    expect(summary()).toBe("Toutes les 2 semaines, les lundis et jeudis, à 8 h, jusqu’au 2 septembre 2030.");
    fireEvent.press(screen.getByTestId("planning-end-kind"));
    expect(summary()).toBe("Toutes les 2 semaines, les lundis et jeudis, à 8 h, pendant 4 semaines.");
    fireEvent.press(screen.getByTestId("planning-end-count"));
    tapStep("planning-end-count-stepper-increment");
    fireEvent.press(screen.getByTestId("screen-header-validate"));
    await flush();
    const [routine] = await planning.listRoutines();
    expect(routine?.repetition).toEqual({ unit: "WEEK", every: 2, weekdays: [1, 4], end: { kind: "FOR", count: 5 } });
  });

  it("aucun jour retenu : la coche reste inactive", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    await renderPlanning({ sessionId: created.id, date: START });
    fireEvent(screen.getByTestId("planning-repetition-switch"), "valueChange", true);
    fireEvent.press(screen.getByTestId("planning-weekday-1"));
    expect(screen.getByTestId("screen-header-validate").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("screen-header-validate"));
    await flush();
    expect(await planning.listRoutines()).toEqual([]);
  });

  it("depuis le Calendrier : sélection à cases de deux Séances, liste ordonnée réordonnable, enregistrement dans cet ordre", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    await renderPlanning({ date: START });
    expect(screen.getByText("Catalogue des séances")).toBeTruthy();
    expect(screen.getByTestId("screen-header-validate").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId(`planning-selection-${b.id}`));
    fireEvent.press(screen.getByTestId(`planning-selection-${a.id}`));
    expect(screen.getByTestId(`planning-selection-${a.id}-checked`)).toBeTruthy();
    fireEvent.press(screen.getByTestId("screen-header-validate"));
    await flush();
    expect(screen.getByText("Planifier un parcours")).toBeTruthy();
    expect(within(screen.getByTestId("planning-entry-0-frequency")).getByText("à chaque fois")).toBeTruthy();
    // Ordre de sélection : Bravo puis Alpha ; on remonte Alpha.
    fireEvent(screen.getByTestId("planning-entry-1-handle"), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    fireEvent.press(screen.getByTestId("screen-header-validate"));
    await flush();
    const [routine] = await planning.listRoutines();
    expect(routine?.entries.map((entry) => entry.sessionId)).toEqual([a.id, b.id]);
  });

  it("modifier une Routine : formulaire prérempli, la modification remplace le créneau", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    const saved = await planning.createRoutine({
      startDate: START,
      time: "08:00",
      repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: "2030-09-30" } },
      entries: [{ id: "e1", sessionId: created.id, frequency: EVERY_TIME }],
    });
    if (saved.status !== "SAVED") throw new Error("setup");
    await planning.excludeOccurrence(saved.routine.id, "2030-08-12T08:00");
    await renderPlanning({ routineId: saved.routine.id });
    expect(summary()).toBe("Toutes les semaines, les lundis, à 8 h, jusqu’au 30 septembre 2030.");
    fireEvent.press(screen.getByTestId("planning-weekday-3"));
    fireEvent.press(screen.getByTestId("screen-header-validate"));
    await flush();
    const routine = await planning.getRoutine(saved.routine.id);
    expect(routine?.repetition?.weekdays).toEqual([1, 3]);
    expect(routine?.exclusions).toEqual(["2030-08-12T08:00"]);
    expect(await planning.listRoutines()).toHaveLength(1);
  });

  it("rappel : autorisation accordée, 15 min par défaut, 1h, Autre → réglage personnalisé ; rappels reprogrammés", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    await renderPlanning({ sessionId: created.id, date: START });
    expect(screen.queryByTestId("planning-reminder")).toBeNull();
    fireEvent(screen.getByTestId("planning-reminder-switch"), "valueChange", true);
    await flush();
    expect(screen.getByTestId("planning-reminder")).toBeTruthy();
    fireEvent.press(screen.getByText("1h"));
    fireEvent.press(screen.getByText("Autre"));
    expect(mockPush).toHaveBeenLastCalledWith("/planning-reminder");
    const request = pendingPlanningSheet("reminder");
    expect(request?.minutes).toBe(60);
    act(() => request!.onValidate(80));
    expect(screen.getByText("1h20")).toBeTruthy();
    fireEvent.press(screen.getByTestId("screen-header-validate"));
    await flush();
    const [routine] = await planning.listRoutines();
    expect(routine?.reminderMinutes).toBe(80);
    expect(refresh).toHaveBeenCalled();
  });

  it("rappel refusé par le système : l'interrupteur reste sur Non, information, la planification s'enregistre (RM-053)", async () => {
    permission = "denied";
    const created = await sessions.createStructured(input("Gainage"));
    await renderPlanning({ sessionId: created.id, date: START });
    fireEvent(screen.getByTestId("planning-reminder-switch"), "valueChange", true);
    await flush();
    expect(screen.getByTestId("planning-reminder-switch").props.value).toBe(false);
    expect(screen.getByTestId("planning-reminder-denied")).toBeTruthy();
    fireEvent.press(screen.getByTestId("screen-header-validate"));
    await flush();
    const [routine] = await planning.listRoutines();
    expect(routine?.reminderMinutes).toBeNull();
  });

  it("fréquence d'une ligne : la feuille reçoit le motif et rend « 2 fois sur 3 »", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    await renderPlanning({ date: START });
    fireEvent.press(screen.getByTestId(`planning-selection-${a.id}`));
    fireEvent.press(screen.getByTestId(`planning-selection-${b.id}`));
    fireEvent.press(screen.getByTestId("screen-header-validate"));
    await flush();
    fireEvent.press(screen.getByTestId("planning-entry-1-frequency"));
    expect(mockPush).toHaveBeenLastCalledWith("/planning-frequency");
    const request = pendingPlanningSheet("frequency");
    expect(request).toMatchObject({ name: "Bravo", frequency: EVERY_TIME });
    act(() => request!.onValidate({ x: 2, n: 3, positions: [1, 3] }));
    expect(screen.getByText("2 fois sur 3")).toBeTruthy();
    fireEvent.press(screen.getByTestId("screen-header-validate"));
    await flush();
    const [routine] = await planning.listRoutines();
    expect(routine?.entries.map((entry) => entry.frequency)).toEqual([EVERY_TIME, { x: 2, n: 3, positions: [1, 3] }]);
  });

  it("fermer la sélection sans contenu abandonne la planification sans rien écrire", async () => {
    await sessions.createStructured(input("Alpha"));
    await renderPlanning({ date: START });
    fireEvent.press(screen.getByTestId("screen-header-back"));
    expect(mockBack).toHaveBeenCalled();
    expect(await planning.listRoutines()).toEqual([]);
  });
});
