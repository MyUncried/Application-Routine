import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { addDays, EVERY_TIME, mondayOf, type RoutineDraft } from "@/domain/planning/Routine";
import type { AgendaExecution, OccurrenceExecution } from "@/domain/planning/occurrenceExecutions";
import type { StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { PlanScreen } from "@/features/planning/PlanScreen";
import { setAgendaRoutineFilter } from "@/features/planning/agendaRoutineFilter";
import { releasePlanningSheet } from "@/features/planning/planningSheetRelay";
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
 * Calendrier — Plan (D-554, DSF Plan, CE-UI-16, 21/11/2026) sur SQLite réelle : écran, `PlanningService`, `SessionService` et
 * dépôts réels. Semaine consultée en août 2030. Jest n'exerce pas la mise en page : vérification sur iPhone nécessaire.
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
let linked: OccurrenceExecution[] = [];
/** D-553 : toutes les Exécutions lues par l'Agenda (liées ou « Hors planification »). */
let everything: AgendaExecution[] = [];

beforeEach(async () => {
  mockPush.mockClear();
  setAgendaRoutineFilter(null);
  releasePlanningSheet();
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  await database.runAsync(
    `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
     VALUES ('mv-squat', 'Squat', 'squat', NULL, 'cardio', 1, '2026-10-28T08:00:00.000Z', '2026-10-28T08:00:00.000Z')`,
  );
  await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES ('mv-squat', 'dos')");
  sessions = new SqliteSessionRepository(database);
  linked = [];
  everything = [];
  planning = new PlanningService({
    repository: new SqliteRoutineRepository(database),
    occurrenceExecutions: async () => linked,
    executions: async () => everything,
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

async function renderPlan(onChangeView: (view: string) => void = () => undefined) {
  const referentials = { listCategories: jest.fn(async () => []) } as unknown as ReferentialService;
  render(
    <TestSafeAreaProvider>
      <SessionServiceContext.Provider value={new SessionService(sessions)}>
        <ReferentialServiceContext.Provider value={referentials}>
          <PlanningServiceContext.Provider value={planning}>
            <PlanScreen initialDay={MONDAY} onChangeView={onChangeView} />
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
describe("Calendrier — Plan (D-554)", () => {
  it("onglet Plan actif ; semaines du mois (août 2030 : S31 à S35), semaine affichée pleine ; navigation", async () => {
    const onChangeView = jest.fn();
    await renderPlan(onChangeView);
    expect(screen.getByTestId("calendar-view-row-plan").props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId("calendar-view-row-plan-label").props.children).toBe("Plan");
    fireEvent.press(screen.getByTestId("calendar-view-row-week"));
    expect(onChangeView).toHaveBeenLastCalledWith("agenda");
    expect(screen.getByTestId("plan-month-label").props.children).toBe("Août 2030");
    const weeks = screen.queryAllByTestId(/^plan-week-\d{4}-\d{2}-\d{2}$/).map((node) => node.props.testID as string);
    expect(weeks).toEqual(["plan-week-2030-07-29", "plan-week-2030-08-05", "plan-week-2030-08-12", "plan-week-2030-08-19", "plan-week-2030-08-26"]);
    expect(within(screen.getByTestId("plan-week-2030-08-05")).getByText("S32")).toBeTruthy();
    expect(within(screen.getByTestId("plan-week-2030-08-05")).getByText("5–11")).toBeTruthy();
    expect(screen.getByTestId("plan-week-2030-08-05").props.accessibilityState).toMatchObject({ selected: true });
    // Même largeur de cadre à 4 et 5 semaines ; bloc centré sous le mois (x = 160 du contenu).
    const block = StyleSheet.flatten(screen.getByTestId("plan-weeks").props.style);
    expect(block.width).toBe(5 * 51 + 4 * 3);
    expect(block.left + block.width / 2).toBe(160);
    fireEvent.press(screen.getByTestId("plan-next-month"));
    await flush();
    expect(screen.getByTestId("plan-month-label").props.children).toBe("Septembre 2030");
    expect(screen.getByTestId("plan-week-2030-09-02").props.accessibilityState).toMatchObject({ selected: true });
    expect(StyleSheet.flatten(screen.getByTestId("plan-weeks").props.style).width).toBe(4 * 51 + 3 * 3);
    fireEvent.press(screen.getByTestId("plan-week-2030-09-09"));
    await flush();
    expect(screen.getByTestId("plan-week-2030-09-09").props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.queryByTestId("calendar-routine-filter")).toBeNull();
  });

  // Recette du 21/11/2026 (p32-hors-plan) : une séance lancée depuis le catalogue est visible dans le Plan, groupe « Hors
  // planification », hors du Total. [Hors planification absente — remplacé.]
  it("grille : « Sans programme », routines par ordre alphabétique, parcours en lignes de Séance, Total ; hors planification à part", async () => {
    const a = await sessions.createStructured(input("Échauffement"));
    const b = await sessions.createStructured(input("Étirement"));
    const c = await sessions.createStructured(input("Gainage"));
    const zeta = await plan({ name: "Zeta", entries: [entry(c.id)], repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: addDays(MONDAY, 6) } } });
    const parcours = await plan({ name: "Mobilité du matin", time: "14:00", entries: [{ ...entry(a.id), id: "p-0" }, { ...entry(b.id), id: "p-1" }] });
    everything = [
      { executionId: "f", sessionId: c.id, sessionName: "Gainage", startedAt: new Date(2030, 7, 7, 9).toISOString(), endedAt: new Date(2030, 7, 7, 9, 5).toISOString(), businessStatus: "COMPLETED", link: null },
    ];
    await renderPlan();
    expect(screen.getByTestId("plan-group-none-label").props.children).toBe("Sans programme");
    const rows = screen.queryAllByTestId(/^plan-row-.*-name$/).map((node) => node.props.children as string);
    expect(rows).toEqual(["Mobilité du matin", "Échauffement", "Étirement", "Zeta", "Gainage"]);
    expect(screen.getByTestId("plan-group-unplanned-label").props.children).toBe("Hors planification");
    expect(screen.queryByTestId("plan-group-unplanned-add")).toBeNull();
    expect(screen.getByTestId(`plan-cell-${zeta.id}|${MONDAY}T08:00-label`).props.children).toBe("8h");
    expect(screen.getByTestId(`plan-cell-${zeta.id}|${THURSDAY}T08:00-label`).props.children).toBe("8h");
    expect(screen.getByTestId(`plan-cell-${parcours.id}|${MONDAY}T14:00|1-label`).props.children).toBe("14h");
    expect(screen.getByTestId(`plan-cell-${parcours.id}|${MONDAY}T14:00|2-label`).props.children).toBe("—");
    // Hors planification : case à l'heure réelle sur sa propre ligne (le mercredi de Zeta reste vide), vert ; pas de case vide.
    expect(screen.getByTestId(`plan-cell-${zeta.id}-${addDays(MONDAY, 2)}-empty`)).toBeTruthy();
    expect(screen.getByTestId("plan-cell-free|f-label").props.children).toBe("9h");
    expect(screen.queryAllByTestId(/^plan-cell-unplanned.*-empty$/)).toHaveLength(0);
    // Durée de la Séance sous son nom (constat b).
    expect(screen.getByTestId(`plan-row-${zeta.id}-duration`)).toBeTruthy();
    expect(screen.getByTestId(`plan-total-${MONDAY}`).props.children).not.toBe("—");
    expect(screen.getByTestId(`plan-total-${addDays(MONDAY, 1)}`).props.children).toBe("—");
    expect(String(screen.getByTestId("plan-total-week").props.children)).toMatch(/^Total · /);
    expect(screen.getByTestId("plan-legend")).toBeTruthy();
  });

  it("gestes : case vide → ajout d'un créneau (parcours entier) ; case pleine → modification ; créneau commencé : rien ; « + Routine »", async () => {
    const a = await sessions.createStructured(input("Échauffement"));
    const b = await sessions.createStructured(input("Étirement"));
    const single = await plan({ name: "Seule", entries: [entry(a.id)] });
    const parcours = await plan({ name: "Parcours", time: "14:00", entries: [{ ...entry(a.id), id: "p-0" }, { ...entry(b.id), id: "p-1" }] });
    linked = [{ executionId: "x", routineId: single.id, occurrenceKey: `${MONDAY}T08:00`, rank: 1, sessionId: a.id, startedAt: new Date(2030, 7, 5, 8).toISOString(), businessStatus: "COMPLETED" }];
    await renderPlan();
    mockPush.mockClear();
    // Case vide d'une routine : pointillés pendant le toucher, puis modale pré-remplie avec le jour touché.
    fireEvent(screen.getByTestId(`plan-cell-${single.id}-${THURSDAY}-empty`), "pressIn");
    expect(screen.getByTestId(`plan-cell-${single.id}-${THURSDAY}-touched`)).toBeTruthy();
    fireEvent.press(screen.getByTestId(`plan-cell-${single.id}-${THURSDAY}-empty`));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/planning", params: { addTo: single.id, date: THURSDAY } });
    // Case vide d'une Séance de parcours : le créneau du parcours entier.
    fireEvent.press(screen.getByTestId(`plan-cell-${parcours.id}|p-1-${THURSDAY}-empty`));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/planning", params: { addTo: parcours.id, date: THURSDAY } });
    // Case pleine : modification de tout le créneau.
    fireEvent.press(screen.getByTestId(`plan-cell-${parcours.id}|${MONDAY}T14:00|2`));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/planning", params: { routineId: parcours.id, occurrenceKey: `${MONDAY}T14:00` } });
    // Créneau commencé : ne s'ouvre pas.
    mockPush.mockClear();
    fireEvent.press(screen.getByTestId(`plan-cell-${single.id}|${MONDAY}T08:00`));
    expect(mockPush).not.toHaveBeenCalled();
    // « + Routine » sous « Sans programme » : planification sans programme.
    fireEvent.press(screen.getByTestId("plan-group-none-add"));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/planning", params: { date: MONDAY } });
  });

  it("créneau ajouté : visible dans le Plan ; deux créneaux le même jour empilés dans l'ordre chronologique", async () => {
    const a = await sessions.createStructured(input("Échauffement"));
    const routine = await plan({ name: "Seule", time: "18:30", entries: [entry(a.id)] });
    const added = await planning.addOccurrence(routine.id, {
      date: MONDAY,
      time: "07:00",
      sessions: [{ sessionId: a.id, entryId: `entry-${a.id}`, origin: "ROUTINE", active: true }],
      reminderMinutes: null,
    });
    expect(added.status).toBe("SAVED");
    await renderPlan();
    const labels = screen.queryAllByTestId(/^plan-cell-.*-label$/).map((node) => node.props.children as string);
    expect(labels).toEqual(["7h", "18h30"]);
  });
});
