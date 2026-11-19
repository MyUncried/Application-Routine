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
 * Calendrier — vue Agenda (ancienne vue Semaine ; D-532 à D-534, CE-UI-15) sur SQLite réelle (`node:sqlite`) : écran,
 * `PlanningService`, `SessionService` et dépôts réels. Semaine consultée fixée en 2030 ; « maintenant » injecté au service.
 * Jest n'exerce pas la mise en page : vérification sur iPhone nécessaire.
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

let planned = 0;
const plan = async (draft: Partial<RoutineDraft> & Pick<RoutineDraft, "entries">) => {
  planned += 1;
  const result = await planning.createRoutine({ name: `Planification ${planned}`, startDate: MONDAY, time: "08:00", repetition: null, ...draft });
  if (result.status !== "SAVED") throw new Error(result.status);
  return result.routine;
};

const entry = (sessionId: string) => ({ id: `entry-${sessionId}`, sessionId, frequency: EVERY_TIME });
const sectionDays = () => screen.queryAllByTestId(/^calendar-section-\d{4}-\d{2}-\d{2}$/).map((node) => (node.props.testID as string).slice("calendar-section-".length));
const items = () => screen.queryAllByTestId(/^calendar-item-[^]*-swipe$/).map((node) => node.props.testID as string);
const swipeCard = (routineId: string, day: string) => screen.getByTestId(new RegExp(`^calendar-item-${routineId}\\|${day}T\\d{2}:\\d{2}-swipe-card$`));
/** Carte d'une occurrence de routine (D-534) : `calendar-item-<routine>|<date>T<heure>-card`. */
const card = (routineId: string, day: string, time = "08:00") => `calendar-item-${routineId}|${day}T${time}-card`;

describe("Calendrier Semaine", () => {
  it("semaine vide : message, aucune carte fictive", async () => {
    await renderCalendar();
    expect(screen.getByTestId("calendar-week-empty")).toBeTruthy();
    expect(items()).toEqual([]);
    // DSF Agenda § 2 : mois, puis semaine « du 5 au 11 ».
    expect(screen.getByTestId("calendar-month-label").props.children).toBe("Août 2030");
    expect(screen.getByTestId("calendar-week-label").props.children).toBe("du 5 au 11");
  });

  it("créneau unique : une seule carte, au bon jour, à la bonne heure", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    const routine = await plan({ startDate: THURSDAY, time: "14:30", entries: [entry(created.id)] });
    await renderCalendar();
    expect(sectionDays()).toEqual([THURSDAY]);
    expect(screen.getByText("Jeudi 8 août")).toBeTruthy();
    // D-533 : heure « 14h30 », nom de la routine en titre, durée sous l'heure.
    expect(screen.getByTestId(`${card(routine.id, THURSDAY, "14:30")}-time`).props.children).toBe("14h30");
    expect(screen.getByTestId(`${card(routine.id, THURSDAY, "14:30")}-name`).props.children).toBe(routine.name);
    expect(screen.getByTestId(`${card(routine.id, THURSDAY, "14:30")}-duration`).props.children).not.toBe("");
    expect(screen.queryByTestId(`calendar-section-${THURSDAY}-count`)).toBeNull();
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
    expect(screen.getByTestId("calendar-week-label").props.children).toBe("du 12 au 18");
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

  it("routine à deux séances : une seule carte par occurrence, séances dans le déployé dans l'ordre de la liste (D-534)", async () => {
    const first = await sessions.createStructured(input("Zeta"));
    const second = await sessions.createStructured(input("Alpha"));
    const routine = await plan({ name: "Genou", entries: [entry(first.id), entry(second.id)] });
    await renderCalendar();
    expect(items()).toHaveLength(1);
    expect(screen.getByTestId(`${card(routine.id, MONDAY)}-name`).props.children).toBe("Genou");
    // Un point par séance du jour.
    expect(screen.getAllByTestId(`calendar-day-${MONDAY}-dot`)).toHaveLength(2);
    expect(screen.queryByTestId(`calendar-item-${routine.id}|${MONDAY}T08:00-expanded`)).toBeNull();
    fireEvent.press(screen.getByTestId(`${card(routine.id, MONDAY)}-disclosure`));
    expect(screen.getByTestId(`${card(routine.id, MONDAY)}-chevron-open`)).toBeTruthy();
    const expanded = screen.getByTestId(`calendar-item-${routine.id}|${MONDAY}T08:00-expanded`);
    expect(expanded).toBeTruthy();
    expect(screen.getByTestId(`calendar-item-${routine.id}|${MONDAY}T08:00-session-0`)).toBeTruthy();
    expect(screen.getByText("Zeta")).toBeTruthy();
    expect(screen.getByText("Alpha")).toBeTruthy();
    fireEvent.press(screen.getByTestId(`${card(routine.id, MONDAY)}-disclosure`));
    expect(screen.queryByTestId(`calendar-item-${routine.id}|${MONDAY}T08:00-expanded`)).toBeNull();
    // D-534 : « Démarrer » ouvre la première séance de la liste, avec la chaîne et le rang.
    fireEvent.press(screen.getByTestId(`${card(routine.id, MONDAY)}-start`));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/execution", params: { sessionId: first.id, chain: `${first.id},${second.id}`, rank: "1" } });
  });

  it("Démarrer ouvre l'Exécution PRE-10 ; la carte ouvre la modification ; Dupliquer ouvre un brouillon", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    const routine = await plan({ entries: [entry(created.id)] });
    await renderCalendar();
    fireEvent.press(screen.getByTestId(`${card(routine.id, MONDAY)}-start`));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/execution", params: { sessionId: created.id } });
    fireEvent.press(swipeCard(routine.id, MONDAY));
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

  it("navigation : doubles flèches du mois vers le premier jour du mois ; semaine à cheval sur deux mois ; Aujourd'hui en texte (DSF Agenda § 2)", async () => {
    await renderCalendar();
    fireEvent.press(screen.getByTestId("calendar-next-month"));
    await flush();
    expect(screen.getByTestId("calendar-month-label").props.children).toBe("Septembre 2030");
    // 1er septembre 2030 : dimanche — semaine du 26 août au 1er septembre.
    expect(screen.getByTestId("calendar-week-label").props.children).toBe("du 26 août au 1er septembre");
    expect(screen.getByTestId("calendar-day-2030-09-01").props.accessibilityState).toMatchObject({ selected: true });
    fireEvent.press(screen.getByTestId("calendar-previous-month"));
    fireEvent.press(screen.getByTestId("calendar-previous-month"));
    await flush();
    expect(screen.getByTestId("calendar-month-label").props.children).toBe("Juillet 2030");
    expect(screen.getByTestId("calendar-today")).toBeTruthy();
    expect(screen.getByText("Aujourd’hui")).toBeTruthy();
  });

  it("barre de titre à onglets : Journal · Agenda · Vue d’ensemble, Agenda actif, composant partagé des Catalogues (D-532)", async () => {
    await renderCalendar();
    const tab = (value: string) => screen.getByTestId(`calendar-view-row-${value}`);
    expect(screen.getByTestId("calendar-view-row").props.accessibilityRole).toBe("tablist");
    expect(screen.getByTestId("calendar-view-row-day-label").props.children).toBe("Journal");
    expect(screen.getByTestId("calendar-view-row-week-label").props.children).toBe("Agenda");
    expect(screen.getByTestId("calendar-view-row-month-label").props.children).toBe("Vue d’ensemble");
    expect(tab("week").props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId("calendar-view-row-week-shape", { includeHiddenElements: true })).toBeTruthy();
    // D-535 (19/11/2026) : Journal disponible (il remplace la vue Jour) ; Vue d'ensemble reste indisponible.
    expect(tab("day").props.accessibilityState).toMatchObject({ selected: false, disabled: false });
    expect(tab("month").props.accessibilityState).toMatchObject({ selected: false, disabled: true });
    expect(screen.queryByText("Semaine")).toBeNull();
  });
});
