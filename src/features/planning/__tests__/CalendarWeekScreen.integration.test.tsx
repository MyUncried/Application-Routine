import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { addDays, EVERY_TIME, mondayOf, type RoutineDraft } from "@/domain/planning/Routine";
import type { StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { CalendarWeekScreen } from "@/features/planning/CalendarWeekScreen";
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
 * Calendrier Semaine sur SQLite réelle (`node:sqlite`) : écran, `PlanningService`, `SessionService` et dépôts
 * réels. Semaine consultée fixée en 2030 (toujours future) ; « maintenant » injecté au service.
 */

const mockPush = jest.fn();
const focusEffectHarness: { effect: (() => (() => void) | void) | null } = { effect: null };
jest.mock("expo-crypto", () => {
  let counter = 0;
  return { randomUUID: jest.fn(() => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`) };
});
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useFocusEffect: (effect: () => (() => void) | void) => {
      focusEffectHarness.effect = effect;
    },
    useRouter: () => ({ push: mockPush, back: jest.fn(), setParams: jest.fn() }),
    useLocalSearchParams: () => ({}),
  };
});

const MONDAY = mondayOf("2030-08-05");
const THURSDAY = addDays(MONDAY, 3);
let database: NodeSqliteDatabase;
let planning: PlanningService;
let sessions: SqliteSessionRepository;
let ids = 0;

beforeEach(async () => {
  mockPush.mockClear();
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  await database.runAsync(
    `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
     VALUES ('mv-squat', 'Squat', 'squat', NULL, 'cardio', 1, '2026-10-28T08:00:00.000Z', '2026-10-28T08:00:00.000Z')`,
  );
  await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES ('mv-squat', 'dos')");
  sessions = new SqliteSessionRepository(database);
  planning = new PlanningService({
    repository: new SqliteRoutineRepository(database),
    newId: () => `routine-${++ids}`,
    now: () => new Date(2030, 0, 1, 12, 0),
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

async function renderCalendar() {
  const referentials = { listCategories: jest.fn(async () => []) } as unknown as ReferentialService;
  render(
    <TestSafeAreaProvider>
      <SessionServiceContext.Provider value={new SessionService(sessions)}>
        <ReferentialServiceContext.Provider value={referentials}>
          <PlanningServiceContext.Provider value={planning}>
            <CalendarWeekScreen initialDay={MONDAY} />
          </PlanningServiceContext.Provider>
        </ReferentialServiceContext.Provider>
      </SessionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  await act(async () => {
    focusEffectHarness.effect?.();
  });
  await flush();
}

const plan = async (draft: Partial<RoutineDraft> & Pick<RoutineDraft, "entries">) => {
  const result = await planning.createRoutine({ startDate: MONDAY, time: "08:00", repetition: null, ...draft });
  if (result.status !== "SAVED") throw new Error(result.status);
  return result.routine;
};

const entry = (sessionId: string) => ({ id: `entry-${sessionId}`, sessionId, frequency: EVERY_TIME });
const sectionDays = () => screen.queryAllByTestId(/^calendar-section-\d{4}-\d{2}-\d{2}$/).map((node) => (node.props.testID as string).slice("calendar-section-".length));
const items = () => screen.queryAllByTestId(/^calendar-item-[^]*-swipe$/).map((node) => node.props.testID as string);
const swipeCard = (routineId: string, day: string) =>
  screen.getByTestId(new RegExp(`^calendar-item-${routineId}\\|${day}T\\d{2}:\\d{2}\\|[^|]+-swipe-card$`));

describe("Calendrier Semaine", () => {
  it("semaine vide : message, aucune carte fictive", async () => {
    await renderCalendar();
    expect(screen.getByTestId("calendar-week-empty")).toBeTruthy();
    expect(items()).toEqual([]);
    expect(screen.getByTestId("calendar-week-label").props.children).toBe("5 – 11 août 2030");
  });

  it("créneau unique : une seule carte, au bon jour, à la bonne heure", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    await plan({ startDate: THURSDAY, time: "14:30", entries: [entry(created.id)] });
    await renderCalendar();
    expect(sectionDays()).toEqual([THURSDAY]);
    expect(screen.getByTestId(`calendar-section-${THURSDAY}-count`).props.children).toBe("1 prévue");
    expect(screen.getByText("Jeudi 8 août")).toBeTruthy();
    expect(screen.getByTestId(`session-card-${created.id}-time`).props.children).toBe("14:30 · ");
    expect(screen.getAllByTestId(`calendar-day-${THURSDAY}-dot`)).toHaveLength(1);
  });

  it("répétition hebdomadaire sur plusieurs jours, semaine suivante, fin de répétition", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    await plan({
      entries: [entry(created.id)],
      repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: addDays(MONDAY, 10) } },
    });
    await renderCalendar();
    expect(sectionDays()).toEqual([MONDAY, THURSDAY]);
    fireEvent.press(screen.getByTestId("calendar-next-week"));
    await flush();
    // Semaine suivante : seul le lundi est dans la borne (jusqu'au jeudi exclu : MONDAY + 10 = jeudi suivant inclus).
    expect(screen.getByTestId("calendar-week-label").props.children).toBe("12 – 18 août 2030");
    expect(sectionDays()).toEqual([addDays(MONDAY, 7), addDays(MONDAY, 10)]);
    fireEvent.press(screen.getByTestId("calendar-next-week"));
    await flush();
    expect(sectionDays()).toEqual([]);
    expect(screen.getByTestId("calendar-week-empty")).toBeTruthy();
    fireEvent.press(screen.getByTestId("calendar-previous-week"));
    fireEvent.press(screen.getByTestId("calendar-previous-week"));
    await flush();
    expect(sectionDays()).toEqual([MONDAY, THURSDAY]);
  });

  it("liste ordonnée : deux contenus du même créneau, dans l'ordre de la liste", async () => {
    const first = await sessions.createStructured(input("Zeta"));
    const second = await sessions.createStructured(input("Alpha"));
    await plan({ entries: [entry(first.id), entry(second.id)] });
    await renderCalendar();
    const names = screen.queryAllByTestId(/^session-card-[^]*-name$/).map((node) => node.props.children as string);
    expect(names).toEqual(["Zeta", "Alpha"]);
    expect(screen.getByTestId(`calendar-section-${MONDAY}-count`).props.children).toBe("2 prévues");
  });

  it("Démarrer ouvre l'Exécution PRE-10 ; la carte ouvre la modification ; Dupliquer ouvre un brouillon", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    const routine = await plan({ entries: [entry(created.id)] });
    await renderCalendar();
    fireEvent.press(screen.getByTestId(`session-card-${created.id}-start`));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/execution", params: { sessionId: created.id } });
    fireEvent.press(screen.getByTestId(`session-card-${created.id}-visual-open`));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/planning", params: { routineId: routine.id } });
    fireEvent(swipeCard(routine.id, MONDAY), "accessibilityAction", { nativeEvent: { actionName: "duplicate" } });
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/planning", params: { duplicateOf: routine.id } });
  });

  it("supprimer une planification unique : confirmation puis disparition", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    const routine = await plan({ entries: [entry(created.id)] });
    await renderCalendar();
    fireEvent(swipeCard(routine.id, MONDAY), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    expect(screen.getByText("Supprimer la planification ?")).toBeTruthy();
    fireEvent.press(screen.getByText("Annuler"));
    expect(sectionDays()).toEqual([MONDAY]);
    fireEvent(swipeCard(routine.id, MONDAY), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    fireEvent.press(screen.getByText("Confirmer"));
    await flush();
    expect(sectionDays()).toEqual([]);
    expect(await planning.getRoutine(routine.id)).toBeNull();
    // La Séance source est conservée (RM-050).
    expect(await sessions.findById(created.id)).not.toBeNull();
  });

  it("planification périodique : « Seulement cette occurrence » puis « Toutes les occurrences à venir »", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    const routine = await plan({
      entries: [entry(created.id)],
      repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: addDays(MONDAY, 30) } },
    });
    await renderCalendar();
    fireEvent(swipeCard(routine.id, MONDAY), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    expect(screen.getByText("Supprimer des occurrences ?")).toBeTruthy();
    fireEvent.press(screen.getByTestId("occurrence-delete-this"));
    await flush();
    expect(sectionDays()).toEqual([THURSDAY]);
    expect((await planning.getRoutine(routine.id))?.exclusions).toEqual([`${MONDAY}T08:00`]);

    fireEvent(swipeCard(routine.id, THURSDAY), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    fireEvent.press(screen.getByTestId("occurrence-delete-all"));
    await flush();
    expect(sectionDays()).toEqual([]);
    fireEvent.press(screen.getByTestId("calendar-next-week"));
    await flush();
    expect(sectionDays()).toEqual([]);
  });

  it("Séance archivée : ses occurrences ne sont plus proposées", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    await plan({ entries: [entry(created.id)] });
    await new SessionService(sessions).archiveSession(created.id);
    await renderCalendar();
    expect(sectionDays()).toEqual([]);
  });

  it("sélection d'un jour : il devient le jour sélectionné", async () => {
    await renderCalendar();
    fireEvent.press(screen.getByTestId(`calendar-day-${THURSDAY}`));
    expect(screen.getByTestId(`calendar-day-${THURSDAY}`).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId(`calendar-day-${MONDAY}`).props.accessibilityState).toMatchObject({ selected: false });
  });
});
