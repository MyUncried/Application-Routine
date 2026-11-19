import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { EVERY_TIME, type RoutineDraft } from "@/domain/planning/Routine";
import type { StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { JournalScreen } from "@/features/planning/JournalScreen";
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
 * Journal des routines (D-535, DSF Journal) sur SQLite réelle : une carte par routine, ordre, compteurs, déployé,
 * crayon, recherche, onglets. Jest n'exerce pas la mise en page : vérification sur iPhone nécessaire.
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

let database: NodeSqliteDatabase;
let planning: PlanningService;
let sessions: SqliteSessionRepository;
let ids = 0;
let clock = 0;
const onChangeView = jest.fn();

beforeEach(async () => {
  mockPush.mockClear();
  onChangeView.mockClear();
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  await database.runAsync(
    `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
     VALUES ('mv-squat', 'Squat', 'squat', NULL, 'cardio', 1, '2026-10-28T08:00:00.000Z', '2026-10-28T08:00:00.000Z')`,
  );
  await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES ('mv-squat', 'dos')");
  sessions = new SqliteSessionRepository(database);
  clock = 0;
  // Horloge du service : chaque écriture est postérieure à la précédente (dates de création distinctes).
  planning = new PlanningService({
    repository: new SqliteRoutineRepository(database),
    newId: () => `routine-${++ids}`,
    now: () => new Date(Date.UTC(2026, 10, 1 + clock++, 9, 0)),
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

async function renderJournal() {
  const referentials = { listCategories: jest.fn(async () => []) } as unknown as ReferentialService;
  render(
    <TestSafeAreaProvider>
      <SessionServiceContext.Provider value={new SessionService(sessions)}>
        <ReferentialServiceContext.Provider value={referentials}>
          <PlanningServiceContext.Provider value={planning}>
            <JournalScreen onChangeView={onChangeView} />
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

const plan = async (draft: Partial<RoutineDraft> & Pick<RoutineDraft, "entries" | "name">) => {
  const result = await planning.createRoutine({ startDate: "2030-08-05", time: "08:00", repetition: null, ...draft });
  if (result.status !== "SAVED") throw new Error(result.status);
  return result.routine;
};
const entry = (sessionId: string, id = `entry-${sessionId}`) => ({ id, sessionId, frequency: EVERY_TIME });
const cards = () => screen.queryAllByTestId(/^journal-card-[^-]+-\d+$/).map((node) => node.props.testID as string);
const text = (testID: string) => {
  const children = screen.getByTestId(testID).props.children as unknown;
  return Array.isArray(children) ? children.join("") : String(children);
};

describe("Journal des routines (D-535)", () => {
  it("une carte par routine — une routine à deux séances donne une seule carte ; plus récente en haut ; aucun bouton d'action", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    const first = await plan({ name: "Matin", entries: [entry(a.id)] });
    const second = await plan({ name: "Genou", entries: [entry(a.id, "x1"), entry(b.id, "x2")] });
    await renderJournal();
    expect(cards()).toEqual([`journal-card-${second.id}`, `journal-card-${first.id}`]);
    expect(text(`journal-card-${second.id}-name`)).toBe("Genou");
    expect(text(`journal-card-${second.id}-recurrence`)).toBe("Une seule fois · le 5 août 2030");
    expect(text(`journal-card-${second.id}-year`)).toBe("2026");
    expect(screen.queryByText("Démarrer")).toBeNull();
    expect(screen.queryByText("Terminer")).toBeNull();
    // Modifier la routine : la plus ancienne repasse en tête.
    await planning.updateRoutine(first.id, { name: "Matin", startDate: "2030-08-05", time: "09:00", repetition: null, entries: [entry(a.id)] });
    await act(async () => {
      focusEffectHarness.effect?.();
    });
    await flush();
    expect(cards()[0]).toBe(`journal-card-${first.id}`);
  });

  it("compteurs : Actives (occurrence à venir) · Terminées (plus aucune)", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    await plan({ name: "Avenir", entries: [entry(a.id, "c1")] });
    await plan({ name: "Passée", startDate: "2020-01-06", entries: [entry(a.id, "c2")] });
    await plan({
      name: "Récurrente",
      startDate: "2020-01-06",
      repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: "2030-12-30" } },
      entries: [entry(a.id, "c3")],
    });
    await renderJournal();
    expect(text("journal-count-active")).toBe("2");
    expect(text("journal-count-finished")).toBe("1");
    expect(screen.getByText("Actives ")).toBeTruthy();
  });

  it("toucher la carte la déploie (filet puis composition) ; le crayon ouvre la routine", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    const routine = await plan({ name: "Genou", entries: [entry(a.id), entry(b.id)] });
    await renderJournal();
    expect(screen.queryByTestId(`journal-item-${routine.id}-expanded`)).toBeNull();
    fireEvent.press(screen.getByTestId(`journal-card-${routine.id}-toggle`));
    expect(screen.getByTestId(`journal-card-${routine.id}-chevron-open`)).toBeTruthy();
    expect(screen.getByTestId(`journal-item-${routine.id}-session-0`)).toBeTruthy();
    expect(screen.getByTestId(`journal-item-${routine.id}-composition-1`)).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId(`journal-card-${routine.id}-edit`));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/planning", params: { routineId: routine.id } });
    fireEvent.press(screen.getByTestId(`journal-card-${routine.id}-toggle`));
    expect(screen.queryByTestId(`journal-item-${routine.id}-expanded`)).toBeNull();
  });

  it("recherche : nom de la routine ou de ses séances, sans casse ni accents", async () => {
    const a = await sessions.createStructured(input("Étirements"));
    const b = await sessions.createStructured(input("Gainage"));
    const one = await plan({ name: "Matin", entries: [entry(a.id)] });
    const two = await plan({ name: "Soir", entries: [entry(b.id)] });
    await renderJournal();
    fireEvent.changeText(screen.getByTestId("journal-search"), "etire");
    expect(cards()).toEqual([`journal-card-${one.id}`]);
    fireEvent.changeText(screen.getByTestId("journal-search"), "SOIR");
    expect(cards()).toEqual([`journal-card-${two.id}`]);
    fireEvent.changeText(screen.getByTestId("journal-search"), "zzz");
    expect(screen.getByTestId("journal-no-result")).toBeTruthy();
  });

  it("zone de contexte : filtre du Catalogue des séances, tri inactif, Planifier ; onglet Agenda", async () => {
    await renderJournal();
    expect(screen.getByTestId("journal-empty")).toBeTruthy();
    fireEvent.press(screen.getByTestId("journal-filter"));
    expect(mockPush).toHaveBeenLastCalledWith("/catalogue-filters");
    expect(screen.getByTestId("catalogue-sort-action").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("journal-plan"));
    expect(mockPush).toHaveBeenLastCalledWith(expect.objectContaining({ pathname: "/planning" }));
    expect(screen.getByTestId("calendar-view-row-day").props.accessibilityState).toMatchObject({ selected: true });
    fireEvent.press(screen.getByTestId("calendar-view-row-week"));
    expect(onChangeView).toHaveBeenCalledWith("agenda");
  });
});
