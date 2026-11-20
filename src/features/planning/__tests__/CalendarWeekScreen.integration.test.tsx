import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { addDays, EVERY_TIME, mondayOf, type RoutineDraft } from "@/domain/planning/Routine";
import type { OccurrenceExecution } from "@/domain/planning/occurrenceExecutions";
import type { StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { CalendarWeekScreen } from "@/features/planning/CalendarWeekScreen";
import { setAgendaRoutineFilter } from "@/features/planning/agendaRoutineFilter";
import { pendingPlanningSheet, releasePlanningSheet } from "@/features/planning/planningSheetRelay";
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
let linked: OccurrenceExecution[] = [];

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
  planning = new PlanningService({
    repository: new SqliteRoutineRepository(database),
    occurrenceExecutions: async () => linked,
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
const allSectionDays = () => screen.queryAllByTestId(/^calendar-section-\d{4}-\d{2}-\d{2}$/).map((node) => (node.props.testID as string).slice("calendar-section-".length));
/** Sections de la semaine du carrousel (la liste continue sur les semaines suivantes depuis le 20/11/2026, constat C). */
const sectionDays = () => {
  const week = new Set(screen.queryAllByTestId(/^calendar-day-\d{4}-\d{2}-\d{2}$/).map((node) => (node.props.testID as string).slice("calendar-day-".length)));
  return allSectionDays().filter((day) => week.has(day));
};
const items = () => screen.queryAllByTestId(/^calendar-item-[^]*-swipe$/).map((node) => node.props.testID as string);
const swipeCard = (routineId: string, day: string) => screen.getByTestId(new RegExp(`^calendar-item-${routineId}\\|${day}T\\d{2}:\\d{2}-swipe-card$`));
/** Carte d'une occurrence de routine (D-534) : `calendar-item-<routine>|<date>T<heure>-card`. */
const card = (routineId: string, day: string, time = "08:00") => `calendar-item-${routineId}|${day}T${time}-card`;

describe("Calendrier Semaine", () => {
  it("recette du 20/11/2026 : pas de message « semaine vide » tant que la semaine n'est pas chargée", async () => {
    let release: () => void = () => undefined;
    const real = planning.agendaData.bind(planning);
    const spy = jest.spyOn(planning, "agendaData").mockImplementation((from, to) => new Promise((resolve) => {
      release = () => resolve(real(from, to));
    }));
    await renderCalendar();
    expect(screen.queryByTestId("calendar-week-empty")).toBeNull();
    await act(async () => {
      release();
    });
    await flush();
    expect(screen.getByTestId("calendar-week-empty")).toBeTruthy();
    spy.mockRestore();
  });

  it("D-540 : créneau manqué au-delà du délai de rattrapage — cadre rouge, étiquette « Expirée », ni Rattraper ni Démarrer", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    // Lundi de la semaine en cours (heure passée pour l'écran) ; le service est au 1er janvier 2030 : plus de 10 jours après.
    const now = new Date();
    const monday = mondayOf(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
    const routine = await plan({ entries: [entry(created.id)], startDate: monday, time: "00:01" });
    await renderCalendar();
    fireEvent.press(screen.getByTestId("calendar-today"));
    await flush();
    const id = card(routine.id, monday, "00:01");
    expect(screen.getByTestId(`${id}-status-EXPIRED`)).toBeTruthy();
    expect(within(screen.getByTestId(`${id}-status-tag`)).getByText("Expirée")).toBeTruthy();
    expect(screen.queryByTestId(`${id}-start`)).toBeNull();
  });

  it("D-539 : filtre par routine — icône, liste et points filtrés, conservé en changeant de semaine, de mois et avec « Aujourd'hui », icône bleue = filtre désactivé sans modale", async () => {
    const a = await sessions.createStructured(input("Gainage"));
    const b = await sessions.createStructured(input("Étirements"));
    const weekly = { unit: "WEEK" as const, every: 1, weekdays: [1, 4] as (1 | 4)[], end: { kind: "UNTIL" as const, date: addDays(MONDAY, 30) } };
    const one = await plan({ entries: [entry(a.id)], repetition: weekly });
    const two = await plan({ entries: [entry(b.id)], repetition: { ...weekly, weekdays: [1] } });
    await renderCalendar();
    expect(screen.getByTestId("calendar-routine-filter-inactive")).toBeTruthy();
    expect(screen.getAllByTestId(`calendar-day-${MONDAY}-dot`)).toHaveLength(2);
    fireEvent.press(screen.getByTestId("calendar-routine-filter"));
    expect(mockPush).toHaveBeenLastCalledWith("/agenda-routine-filter");
    const request = pendingPlanningSheet("routineFilter");
    expect(request).not.toBeNull();
    await act(async () => {
      request!.onValidate([two.id]);
    });
    await flush();
    // Filtre actif : icône pleine bleue ; seuls les créneaux de la routine choisie ; le jeudi (routine 1 seule) disparaît.
    expect(screen.getByTestId("calendar-routine-filter-active")).toBeTruthy();
    expect(sectionDays()).toEqual([MONDAY]);
    expect(items().every((id) => id.includes(two.id))).toBe(true);
    expect(screen.getAllByTestId(`calendar-day-${MONDAY}-dot`)).toHaveLength(1);
    expect(screen.queryAllByTestId(`calendar-day-${THURSDAY}-dot`)).toHaveLength(0);
    // Conservé : semaine suivante, mois suivant, « Aujourd'hui ».
    fireEvent.press(screen.getByTestId("calendar-next-week"));
    await flush();
    expect(sectionDays()).toEqual([addDays(MONDAY, 7)]);
    fireEvent.press(screen.getByTestId("calendar-next-month"));
    await flush();
    fireEvent.press(screen.getByTestId("calendar-today"));
    await flush();
    expect(screen.getByTestId("calendar-routine-filter-active")).toBeTruthy();
    // D-539 mis à jour le 20/11/2026 : toucher l'icône bleue désactive le filtre sans ouvrir la modale.
    mockPush.mockClear();
    releasePlanningSheet();
    fireEvent.press(screen.getByTestId("calendar-routine-filter"));
    await flush();
    expect(mockPush).not.toHaveBeenCalled();
    expect(pendingPlanningSheet("routineFilter")).toBeNull();
    expect(screen.getByTestId("calendar-routine-filter-inactive")).toBeTruthy();
    // Rouvrir : la modale est de nouveau proposée.
    fireEvent.press(screen.getByTestId("calendar-routine-filter"));
    expect(mockPush).toHaveBeenLastCalledWith("/agenda-routine-filter");
    expect(one.id).not.toBe(two.id);
  });

  it("D-539 : vue filtrée — semaine sans créneau de la routine choisie : état vide ; suppression d'un créneau (D-537) inchangée", async () => {
    const a = await sessions.createStructured(input("Gainage"));
    const b = await sessions.createStructured(input("Étirements"));
    const one = await plan({ entries: [entry(a.id)] });
    const later = await plan({ entries: [entry(b.id)], startDate: addDays(MONDAY, 14) });
    await renderCalendar();
    fireEvent.press(screen.getByTestId("calendar-routine-filter"));
    await act(async () => {
      pendingPlanningSheet("routineFilter")!.onValidate([later.id]);
    });
    await flush();
    expect(screen.getByTestId("calendar-week-empty")).toBeTruthy();
    expect(items().some((id) => id.includes(one.id))).toBe(false);
    // Pour changer de filtre : désactiver (icône bleue), puis rouvrir.
    fireEvent.press(screen.getByTestId("calendar-routine-filter"));
    await flush();
    fireEvent.press(screen.getByTestId("calendar-routine-filter"));
    await act(async () => {
      pendingPlanningSheet("routineFilter")!.onValidate([one.id]);
    });
    await flush();
    fireEvent(swipeCard(one.id, MONDAY), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    expect(screen.getByText("Supprimer ce créneau")).toBeTruthy();
    fireEvent.press(screen.getByText("Confirmer"));
    await flush();
    expect((await planning.getRoutine(one.id))?.exclusions).toEqual([`${MONDAY}T08:00`]);
  });

  it("statut et navigation de la carte (recette du 19/11 au soir : constats B, D, G ; s19-passees)", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    const routine = await plan({ entries: [entry(created.id)] });
    await renderCalendar();
    // À venir, non exécutée : bleue, avec Démarrer.
    expect(screen.getByTestId(`${card(routine.id, MONDAY)}-status-UPCOMING`)).toBeTruthy();
    expect(screen.getByTestId(`${card(routine.id, MONDAY)}-start`)).toBeTruthy();
    // Centre : déployer ; cadre de gauche : ouvrir la planification.
    fireEvent.press(screen.getByTestId(`${card(routine.id, MONDAY)}-disclosure`));
    expect(screen.getByTestId(`${card(routine.id, MONDAY)}-chevron-open`)).toBeTruthy();
    // Constat A : la récapitulation des jours planifiés n'est plus dans l'Agenda.
    expect(screen.queryByTestId(`calendar-item-${routine.id}|${MONDAY}T08:00-recurrence`)).toBeNull();
    fireEvent.press(screen.getByTestId(`${card(routine.id, MONDAY)}-frame`));
    // D-536, point 4 (20/11/2026) : depuis l'Agenda, seule l'occurrence se modifie.
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/planning", params: { routineId: routine.id, occurrenceKey: `${MONDAY}T08:00` } });
    // Exécutée et complète : verte, « Complétée », plus de Démarrer.
    linked = [{ executionId: "x", routineId: routine.id, occurrenceKey: `${MONDAY}T08:00`, rank: 1, startedAt: "2030-08-05T08:00:00.000Z", businessStatus: "COMPLETED" }];
    await act(async () => {
      focusEffectHarness.effect?.();
    });
    await flush();
    expect(screen.getByTestId(`${card(routine.id, MONDAY)}-status-COMPLETED`)).toBeTruthy();
    expect(within(screen.getByTestId(`${card(routine.id, MONDAY)}-status-tag`)).getByText("Complétée")).toBeTruthy();
    expect(screen.queryByTestId(`${card(routine.id, MONDAY)}-start`)).toBeNull();
    // Occurrence commencée : ni modification (D-536, point 1) ni suppression (D-537, point 1) ; la zone de la pastille ne
    // fait rien (recette du 20/11/2026 : trois zones tactiles).
    mockPush.mockClear();
    fireEvent.press(screen.getByTestId(`${card(routine.id, MONDAY)}-frame`));
    fireEvent.press(screen.getByTestId(`${card(routine.id, MONDAY)}-action-zone`));
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent(swipeCard(routine.id, MONDAY), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    expect(screen.queryByText("Supprimer ce créneau")).toBeNull();
    // Arrêtée : grise, « Arrêtée ».
    linked = [{ ...linked[0]!, businessStatus: "INTERRUPTED" }];
    await act(async () => {
      focusEffectHarness.effect?.();
    });
    await flush();
    expect(within(screen.getByTestId(`${card(routine.id, MONDAY)}-status-tag`)).getByText("Arrêtée")).toBeTruthy();
  });


  it("semaine vide : message, aucune carte fictive", async () => {
    await renderCalendar();
    expect(screen.getByTestId("calendar-week-empty")).toBeTruthy();
    expect(items()).toEqual([]);
    // D-538 : mois ; le libellé « du 5 au 11 » n'est plus affiché, la semaine se lit dans la rangée des sept jours.
    expect(screen.getByTestId("calendar-month-label").props.children).toBe("Août 2030");
    expect(screen.queryByTestId("calendar-week-label")).toBeNull();
    expect(screen.getByTestId("calendar-day-2030-08-05")).toBeTruthy();
    expect(screen.getByTestId("calendar-day-2030-08-11")).toBeTruthy();
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
    expect(screen.getByTestId("calendar-day-2030-08-12")).toBeTruthy();
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

  it("liste continue : après la fin de la semaine, la semaine suivante ; le carrousel suit le défilement (recette du 20/11/2026, constat C)", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    await plan({
      entries: [entry(created.id)],
      repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: addDays(MONDAY, 10) } },
    });
    await renderCalendar();
    expect(allSectionDays()).toEqual([MONDAY, THURSDAY, addDays(MONDAY, 7), addDays(MONDAY, 10)]);
    allSectionDays().forEach((day, index) => {
      fireEvent(screen.getByTestId(`calendar-section-${day}`), "layout", { nativeEvent: { layout: { x: 0, y: index * 200, width: 400, height: 200 } } });
    });
    fireEvent.scroll(screen.getByTestId("calendar-week-list"), {
      nativeEvent: { contentOffset: { x: 0, y: 400 }, contentSize: { width: 400, height: 3000 }, layoutMeasurement: { width: 400, height: 600 } },
    });
    await flush();
    expect(screen.getByTestId("calendar-day-2030-08-18")).toBeTruthy();
    expect(screen.getByTestId(`calendar-day-${addDays(MONDAY, 7)}`).props.accessibilityState).toEqual({ selected: true });
    // La liste n'est ni rechargée ni replacée : la semaine précédente reste au-dessus.
    expect(allSectionDays()[0]).toBe(MONDAY);
  });

  it("déployé : nom de la séance même seule, sans filet ; repère « P » d'un parcours seulement (recette du 20/11/2026, r20-recap, constat A)", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    const single = await plan({ name: "Matin", entries: [{ ...entry(a.id), id: "entry-single" }] });
    const parcours = await plan({ name: "Genou", time: "10:00", entries: [entry(a.id), entry(b.id)] });
    await renderCalendar();
    expect(screen.queryByTestId(`${card(single.id, MONDAY)}-parcours`)).toBeNull();
    expect(screen.getByTestId(`${card(parcours.id, MONDAY, "10:00")}-parcours`)).toBeTruthy();
    // Recette du 20/11/2026 : repère « P » après le nom, trait du cercle affiné (1).
    const titleLine = screen.getByTestId(`${card(parcours.id, MONDAY, "10:00")}-name`).parent!.parent!;
    const ids = titleLine.findAll((node) => typeof node.props.testID === "string" && /-(name|parcours)$/.test(node.props.testID as string) && typeof node.type === "string").map((node) => (node.props.testID as string).replace(/^.*-/, ""));
    expect(ids.indexOf("name")).toBeLessThan(ids.indexOf("parcours"));
    expect(StyleSheet.flatten(screen.getByTestId(`${card(parcours.id, MONDAY, "10:00")}-parcours`).props.style).borderWidth).toBe(1);
    fireEvent.press(screen.getByTestId(`${card(single.id, MONDAY)}-disclosure`));
    expect(screen.getByTestId(`calendar-item-${single.id}|${MONDAY}T08:00-session-0-name`).props.children).toBe("Alpha");
    expect(StyleSheet.flatten(screen.getByTestId(`calendar-item-${single.id}|${MONDAY}T08:00-expanded`).props.style).borderTopWidth).toBeUndefined();
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
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/execution", params: { sessionId: first.id, chain: `${first.id},${second.id}`, rank: "1", routineId: routine.id, occurrence: `${MONDAY}T08:00` } });
  });

  it("Démarrer ouvre l'Exécution PRE-10 ; la carte ouvre la modification ; Dupliquer ouvre un brouillon", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    const routine = await plan({ entries: [entry(created.id)] });
    await renderCalendar();
    fireEvent.press(screen.getByTestId(`${card(routine.id, MONDAY)}-start`));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/execution", params: { sessionId: created.id, routineId: routine.id, occurrence: `${MONDAY}T08:00` } });
    fireEvent.press(swipeCard(routine.id, MONDAY));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/planning", params: { routineId: routine.id, occurrenceKey: `${MONDAY}T08:00` } });
    fireEvent(swipeCard(routine.id, MONDAY), "accessibilityAction", { nativeEvent: { actionName: "duplicate" } });
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/planning", params: { duplicateOf: routine.id } });
  });

  it("supprimer depuis l'Agenda : seule l'occurrence est retirée, la routine reste (recette du 20/11/2026, constat D)", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    const routine = await plan({ entries: [entry(created.id)] });
    await renderCalendar();
    fireEvent(swipeCard(routine.id, MONDAY), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    // r21-supprimer : « Supprimer ce créneau » ; recette du 20/11/2026 : « Annuler » et « Confirmer » côte à côte, même format.
    expect(screen.getByText("Supprimer ce créneau")).toBeTruthy();
    expect(screen.queryByTestId("planning-delete-occurrence-cancel")).toBeNull();
    expect(within(screen.getByTestId("planning-delete-occurrence-actions")).getByLabelText("Annuler")).toBeTruthy();
    expect(within(screen.getByTestId("planning-delete-occurrence-actions")).getByLabelText("Confirmer")).toBeTruthy();
    fireEvent.press(screen.getByText("Annuler"));
    expect(sectionDays()).toEqual([MONDAY]);
    fireEvent(swipeCard(routine.id, MONDAY), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    fireEvent.press(screen.getByText("Confirmer"));
    await flush();
    expect(sectionDays()).toEqual([]);
    // La routine reste (au Journal) ; son unique créneau est retiré. La Séance source est conservée (RM-050).
    expect((await planning.getRoutine(routine.id))?.exclusions).toEqual([`${MONDAY}T08:00`]);
    expect(await sessions.findById(created.id)).not.toBeNull();
  });

  it("planification périodique : un seul choix, l'occurrence ; les autres restent (constat D)", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    const routine = await plan({
      entries: [entry(created.id)],
      repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: addDays(MONDAY, 30) } },
    });
    await renderCalendar();
    fireEvent(swipeCard(routine.id, MONDAY), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    expect(screen.queryByText("Toutes les occurrences à venir")).toBeNull();
    fireEvent.press(screen.getByText("Confirmer"));
    await flush();
    expect(sectionDays()).toEqual([THURSDAY]);
    expect((await planning.getRoutine(routine.id))?.exclusions).toEqual([`${MONDAY}T08:00`]);
    fireEvent.press(screen.getByTestId("calendar-next-week"));
    await flush();
    expect(sectionDays()).toEqual([addDays(MONDAY, 7), addDays(MONDAY, 10)]);
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

  it("navigation : doubles flèches du mois vers le premier jour du mois ; semaine à cheval sur deux mois ; bouton « Aujourd'hui » (D-538)", async () => {
    await renderCalendar();
    fireEvent.press(screen.getByTestId("calendar-next-month"));
    await flush();
    expect(screen.getByTestId("calendar-month-label").props.children).toBe("Septembre 2030");
    // 1er septembre 2030 : dimanche — semaine du 26 août au 1er septembre ; le mois affiché est celui du jour choisi.
    expect(screen.getByTestId("calendar-day-2030-08-26")).toBeTruthy();
    expect(screen.getByTestId("calendar-day-2030-09-01").props.accessibilityState).toMatchObject({ selected: true });
    fireEvent.press(screen.getByTestId("calendar-previous-month"));
    fireEvent.press(screen.getByTestId("calendar-previous-month"));
    await flush();
    expect(screen.getByTestId("calendar-month-label").props.children).toBe("Juillet 2030");
    // D-538 : « Aujourd'hui » est une icône calendrier portant le numéro du jour courant ; bleue sur un autre jour, grise sur
    // le jour courant ; elle ramène au jour courant et à sa semaine.
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    expect(screen.getByTestId("calendar-today").props.accessibilityLabel).toBe("Aujourd’hui");
    expect(screen.getByTestId("calendar-today-icon-number").props.children).toBe(now.getDate());
    expect(screen.getByTestId("calendar-today-icon-other")).toBeTruthy();
    fireEvent.press(screen.getByTestId("calendar-today"));
    await flush();
    expect(screen.getByTestId("calendar-today-icon-current")).toBeTruthy();
    expect(screen.getByTestId(`calendar-day-${today}`).props.accessibilityState).toMatchObject({ selected: true });
    // Cartes de jour 36 × 46 ; jour choisi plein (violet-bleu), autres blancs à 30 %.
    const cell = StyleSheet.flatten(screen.getByTestId(`calendar-day-${today}`).props.style);
    expect(cell).toMatchObject({ width: 36, height: 46, borderRadius: 10, backgroundColor: "#5F60EE" });
    const otherDay = addDays(mondayOf(today), mondayOf(today) === today ? 1 : 0);
    expect(StyleSheet.flatten(screen.getByTestId(`calendar-day-${otherDay}`).props.style)).toMatchObject({ width: 36, height: 46, backgroundColor: "rgba(255, 255, 255, 0.3)" });
  });

  it("barre de titre à onglets : Journal · Agenda seulement (D-542), Agenda actif, composant partagé des Catalogues (D-532)", async () => {
    await renderCalendar();
    const tab = (value: string) => screen.getByTestId(`calendar-view-row-${value}`);
    expect(screen.getByTestId("calendar-view-row").props.accessibilityRole).toBe("tablist");
    expect(screen.getByTestId("calendar-view-row-day-label").props.children).toBe("Journal");
    expect(screen.getByTestId("calendar-view-row-week-label").props.children).toBe("Agenda");
    // D-542 : plus de troisième onglet.
    expect(screen.queryByTestId("calendar-view-row-month")).toBeNull();
    expect(screen.queryByText("Vue d’ensemble")).toBeNull();
    // Emplacements d'un tiers de la largeur, centrés (centres à x = 139,5 et 262,5).
    expect(StyleSheet.flatten(screen.getByTestId("calendar-view-row").props.style)).toMatchObject({ justifyContent: "center" });
    const slot = StyleSheet.flatten(screen.getByTestId("calendar-view-row-day-slot").props.style);
    expect(slot.flex).toBe(0);
    expect(parseFloat(String(slot.flexBasis))).toBeCloseTo(100 / 3, 5);
    expect(tab("week").props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId("calendar-view-row-week-shape", { includeHiddenElements: true })).toBeTruthy();
    // D-535 (19/11/2026) : Journal disponible (il remplace la vue Jour).
    expect(tab("day").props.accessibilityState).toMatchObject({ selected: false, disabled: false });
    expect(screen.queryByText("Semaine")).toBeNull();
  });
});
