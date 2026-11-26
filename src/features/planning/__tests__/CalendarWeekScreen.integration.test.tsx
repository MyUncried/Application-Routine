import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { StyleSheet } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { addDays, EVERY_TIME, mondayOf, type RoutineDraft } from "@/domain/planning/Routine";
import type { AgendaExecution, OccurrenceExecution } from "@/domain/planning/occurrenceExecutions";
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
import { expectSwipeRevealRule } from "@/shared/gestures/testing/fireSwipeReveal";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { initialDraft } from "@/features/planning/planningDraft";
import { strings } from "@/shared/i18n";

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
/**
 * D-560 (22/11/2026), développé le 23/11/2026 : heure affichée d'une carte, suivie de « * » quand elle porte l'astérisque des
 * séances hors de la répétition (créneau unique compris : les routines de ces tests sont, par défaut, sans répétition).
 */
const timeOf = (testID: string) => {
  const children: unknown = screen.getByTestId(testID).props.children;
  const time = Array.isArray(children) ? children[0] : children;
  return `${String(time)}${screen.queryByTestId(`${testID}-mark`) !== null ? "*" : ""}`;
};
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
    // D-533 : heure « 14h30 », durée sous l'heure. D-553 (21/11/2026) : titre = nom de la Séance, jamais celui de la Routine.
    // [Nom de la routine en titre — remplacé.]
    expect(timeOf(`${card(routine.id, THURSDAY, "14:30")}-time`)).toBe("14h30*");
    expect(screen.getByTestId(`${card(routine.id, THURSDAY, "14:30")}-name`).props.children).toBe("Gainage");
    expect(routine.name).not.toBe("Gainage");
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
    // Défilement de l'utilisateur (recette du 22/11/2026 : il remplace le placement initial sur le jour choisi).
    fireEvent(screen.getByTestId("calendar-week-list"), "scrollBeginDrag");
    fireEvent.scroll(screen.getByTestId("calendar-week-list"), {
      nativeEvent: { contentOffset: { x: 0, y: 400 }, contentSize: { width: 400, height: 3000 }, layoutMeasurement: { width: 400, height: 600 } },
    });
    await flush();
    expect(screen.getByTestId("calendar-day-2030-08-18")).toBeTruthy();
    expect(screen.getByTestId(`calendar-day-${addDays(MONDAY, 7)}`).props.accessibilityState).toEqual({ selected: true });
    // La liste n'est ni rechargée ni replacée : la semaine précédente reste au-dessus.
    expect(allSectionDays()[0]).toBe(MONDAY);
  });

  // D-553 (21/11/2026, Figma `12906:47`) : une carte par Séance ; parcours = ligne « Ⓟ nom de la Routine » et lien ; Routine à
  // une Séance : ni ligne ni lien ; déployé = composition seule, sans répéter le nom. [Repère « P » après le nom de la routine
  // sur la carte, nom de la séance au déployé (r20-recap) — remplacés.]
  it("parcours : ligne « Ⓟ nom de la Routine », lien, cartes décalées ; Routine à une Séance sans ligne ; déployé sans nom (D-553)", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    const single = await plan({ name: "Matin", entries: [{ ...entry(a.id), id: "entry-single" }] });
    const parcours = await plan({ name: "Mobilité du matin", time: "10:00", entries: [entry(a.id), entry(b.id)] });
    await renderCalendar();
    const group = `${parcours.id}|${MONDAY}T10:00`;
    expect(screen.getByTestId(`calendar-parcours-${group}-name`).props.children).toBe("Mobilité du matin");
    // Contre-recette du 23/11/2026, lot 4 (constat e — « mettre la couleur du nom des parcours en gris, et pas en gras »).
    expect(StyleSheet.flatten(screen.getByTestId(`calendar-parcours-${group}-name`).props.style)).toMatchObject({
      fontFamily: "Inter_400Regular",
      fontWeight: "400",
      fontSize: 15,
      color: "#595E66",
    });
    expect(screen.getByTestId(`calendar-parcours-${group}-badge`)).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId(`calendar-parcours-${group}-link`).props.style)).toMatchObject({ width: 1, backgroundColor: "#000000" });
    expect(screen.queryAllByTestId(/^calendar-parcours-.*-name$/)).toHaveLength(1);
    expect(screen.queryByTestId(`${card(single.id, MONDAY)}-parcours`)).toBeNull();
    // Titres : noms des Séances ; heure prévue pour la première, « — » pour la suivante.
    expect(screen.getByTestId(`calendar-item-${group}|1-card-name`).props.children).toBe("Alpha");
    expect(screen.getByTestId(`calendar-item-${group}|2-card-name`).props.children).toBe("Bravo");
    expect(timeOf(`calendar-item-${group}|1-card-time`)).toBe("10h00*");
    expect(screen.getByTestId(`calendar-item-${group}|2-card-time`).props.children).toBe("—");
    expect(StyleSheet.flatten(screen.getByTestId(`calendar-item-${group}|1-card-frame`).props.style)).toMatchObject({ marginLeft: 10, width: 70 });
    expect(StyleSheet.flatten(screen.getByTestId(`${card(single.id, MONDAY)}-frame`).props.style).marginLeft).toBeUndefined();
    // Déployé : composition seule.
    fireEvent.press(screen.getByTestId(`${card(single.id, MONDAY)}-disclosure`));
    expect(screen.getByTestId(`calendar-item-${single.id}|${MONDAY}T08:00-composition`)).toBeTruthy();
    expect(screen.queryByTestId(`calendar-item-${single.id}|${MONDAY}T08:00-session-0-name`)).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId(`calendar-item-${single.id}|${MONDAY}T08:00-expanded`).props.style).borderTopWidth).toBeUndefined();
    // Lot 5, 23/11/2026 (y7 — « Ce doit être le même format pour les séances que pour les parcours ») : hors parcours, même
    // format qu'une séance de parcours — traits prolongés (gauche au bord de l'écran) et aucun écart propre. [Contre-recette du
    // 23/11/2026 (constat k) : aucun trait prolongé hors parcours — remplacé.]
    const solo = `calendar-item-${single.id}|${MONDAY}T08:00`;
    expect(StyleSheet.flatten(screen.getByTestId(`${solo}-expanded-bar-left`).props.style)).toMatchObject({ position: "absolute", top: 0, bottom: 0, left: 0, width: 6 });
    expect(StyleSheet.flatten(screen.getByTestId(`${solo}-expanded-bar-right`).props.style)).toMatchObject({ position: "absolute", top: 0, bottom: 0, right: 0, width: 6 });
    expect(StyleSheet.flatten(screen.getByTestId(`${solo}-expanded-wrapper`).props.style)).toMatchObject({ paddingTop: 0 });
    expect(StyleSheet.flatten(screen.getByTestId(`${solo}-expanded`).props.style)).toMatchObject({ marginTop: 0 });
  });

  // Contre-recette du 23/11/2026 (Hermann) — constat i : « Un parcours avec deux séances, une séance exécutée une fois sur deux.
  // […] Il faut afficher le parcours à chaque fois, une fois sur deux avec une séance et l'autre fois avec deux séances. » ;
  // constat j : « marquer un peu plus le trait horizontal de séparation des dates » ; constat k : « séance déployée dans un
  // parcours : étendre les deux traits verticaux de couleur de la séance à gauche et à droite ».
  it("parcours dont la rotation ne joue qu'une Séance : parcours à chaque créneau ; séparateur des dates ; traits prolongés au déployé", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    const routine = await plan({
      name: "Alterné",
      repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: addDays(MONDAY, 10) } },
      entries: [entry(a.id), { id: "entry-b", sessionId: b.id, frequency: { x: 1, n: 2, positions: [1] } }],
    });
    await renderCalendar();
    const full = `${routine.id}|${MONDAY}T08:00`;
    const reduced = `${routine.id}|${THURSDAY}T08:00`;
    // Lundi : deux Séances ; jeudi : une seule, toujours sous la ligne « Ⓟ » du parcours.
    expect(screen.getByTestId(`calendar-parcours-${full}-name`).props.children).toBe("Alterné");
    expect(screen.getByTestId(`calendar-item-${full}|2-card-name`).props.children).toBe("Bravo");
    expect(screen.getByTestId(`calendar-parcours-${reduced}-name`).props.children).toBe("Alterné");
    expect(screen.getByTestId(`calendar-item-${reduced}|1-card-name`).props.children).toBe("Alpha");
    expect(screen.queryByTestId(`calendar-item-${reduced}|2-card`)).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId(`calendar-item-${reduced}|1-card-frame`).props.style)).toMatchObject({ marginLeft: 10 });
    // Séparateur des dates plus marqué.
    expect(StyleSheet.flatten(screen.getByTestId(`calendar-section-${THURSDAY}-separator`).props.style)).toMatchObject({ height: 1, backgroundColor: "#CCD1E0" });
    // Séance de parcours déployée : ses deux traits (couleur de son statut) se prolongent le long de la composition.
    fireEvent.press(screen.getByTestId(`calendar-item-${full}|2-card-disclosure`));
    const left = StyleSheet.flatten(screen.getByTestId(`calendar-item-${full}|2-expanded-bar-left`).props.style);
    const right = StyleSheet.flatten(screen.getByTestId(`calendar-item-${full}|2-expanded-bar-right`).props.style);
    expect(left).toMatchObject({ position: "absolute", top: 0, bottom: 0, left: 10, width: 6, backgroundColor: "#8EAAE8" });
    expect(right).toMatchObject({ position: "absolute", top: 0, bottom: 0, right: 0, width: 6, backgroundColor: "#8EAAE8" });
    expect(screen.getByTestId(`calendar-item-${full}|2-composition`)).toBeTruthy();
    // Contre-recette du 23/11/2026, lot 4 (constat f — « trop d'espace avant la première ligne ») : aucun écart propre entre la carte
    // et la composition ; les traits prolongés partent toujours du bas de la carte. [Écart de 8 — remplacé.]
    expect(StyleSheet.flatten(screen.getByTestId(`calendar-item-${full}|2-expanded-wrapper`).props.style)).toMatchObject({ paddingTop: 0 });
    expect(StyleSheet.flatten(screen.getByTestId(`calendar-item-${full}|2-expanded`).props.style)).toMatchObject({ marginTop: 0 });
  });

  // D-553 (21/11/2026) : une carte par Séance, dans l'ordre de la liste ; « Démarrer » sur la première lance toute la chaîne
  // (D-534, inchangé) ; la suivante d'un parcours non lancé n'a aucune action (arbitrage 5). [Une carte par occurrence — remplacé.]
  it("routine à deux séances : une carte par Séance ; Démarrer la première lance la chaîne ; la suivante sans action (D-553, D-534)", async () => {
    const first = await sessions.createStructured(input("Zeta"));
    const second = await sessions.createStructured(input("Alpha"));
    const routine = await plan({ name: "Genou", entries: [entry(first.id), entry(second.id)] });
    await renderCalendar();
    const group = `${routine.id}|${MONDAY}T08:00`;
    expect(items()).toEqual([`calendar-item-${group}|1-swipe`, `calendar-item-${group}|2-swipe`]);
    expect(screen.getByTestId(`calendar-item-${group}|1-card-name`).props.children).toBe("Zeta");
    expect(screen.getByTestId(`calendar-item-${group}|2-card-name`).props.children).toBe("Alpha");
    // Un point par séance du jour.
    expect(screen.getAllByTestId(`calendar-day-${MONDAY}-dot`)).toHaveLength(2);
    // Statut par Séance : aucun statut de parcours.
    expect(screen.getByTestId(`calendar-item-${group}|1-card-status-UPCOMING`)).toBeTruthy();
    expect(screen.getByTestId(`calendar-item-${group}|2-card-status-UPCOMING`)).toBeTruthy();
    expect(screen.queryByTestId(`calendar-item-${group}|2-card-start`)).toBeNull();
    mockPush.mockClear();
    fireEvent.press(screen.getByTestId(`calendar-item-${group}|2-card-action-zone`));
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId(`calendar-item-${group}|1-card-start`));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/execution", params: { sessionId: first.id, chain: `${first.id},${second.id}`, rank: "1", routineId: routine.id, occurrence: `${MONDAY}T08:00` } });
    // Le cadre gauche de n'importe quelle Séance ouvre la modification de tout le créneau (arbitrage 9).
    fireEvent.press(screen.getByTestId(`calendar-item-${group}|2-card-frame`));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/planning", params: { routineId: routine.id, occurrenceKey: `${MONDAY}T08:00` } });
  });

  it("parcours commencé : Séance exécutée à son heure réelle, statut individuel ; la suivante « Rattraper » seule ; créneau non modifiable (D-553, arbitrage 8)", async () => {
    const first = await sessions.createStructured(input("Échauffement"));
    const second = await sessions.createStructured(input("Étirement"));
    const routine = await plan({ name: "Mobilité du matin", time: "14:00", entries: [entry(first.id), entry(second.id)] });
    const started = new Date(2030, 7, 5, 14, 7).toISOString();
    linked = [{ executionId: "x1", routineId: routine.id, occurrenceKey: `${MONDAY}T14:00`, rank: 1, sessionId: first.id, startedAt: started, businessStatus: "COMPLETED" }];
    everything = [
      {
        executionId: "x1",
        sessionId: first.id,
        sessionName: "Échauffement",
        startedAt: started,
        endedAt: new Date(2030, 7, 5, 14, 13, 10).toISOString(),
        businessStatus: "COMPLETED",
        link: { routineId: routine.id, occurrenceKey: `${MONDAY}T14:00`, rank: 1 },
      },
    ];
    await renderCalendar();
    const group = `${routine.id}|${MONDAY}T14:00`;
    expect(timeOf(`calendar-item-${group}|1-card-time`)).toBe("14h07*");
    expect(screen.getByTestId(`calendar-item-${group}|1-card-duration`).props.children).toBe("6′10″");
    expect(screen.getByTestId(`calendar-item-${group}|1-card-status-COMPLETED`)).toBeTruthy();
    expect(screen.getByTestId(`calendar-item-${group}|2-card-time`).props.children).toBe("—");
    expect(within(screen.getByTestId(`calendar-item-${group}|2-card-start`)).getByText("Rattraper")).toBeTruthy();
    fireEvent.press(screen.getByTestId(`calendar-item-${group}|2-card-start`));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: "/execution",
      params: { sessionId: second.id, routineId: routine.id, occurrence: `${MONDAY}T14:00`, occurrenceRank: "2" },
    });
    // Créneau commencé : le cadre gauche ne modifie rien ; la Séance exécutée ne se supprime pas.
    mockPush.mockClear();
    fireEvent.press(screen.getByTestId(`calendar-item-${group}|2-card-frame`));
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent(screen.getByTestId(`calendar-item-${group}|1-swipe-card`), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    expect(screen.queryByText("Supprimer cette séance")).toBeNull();
  });

  it("Séance seule rattrapée plus tard : carte à sa date et heure réelles, même si le créneau est avant la période (D-553, § 3)", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    const routine = await plan({ startDate: addDays(MONDAY, -3), time: "08:00", entries: [entry(created.id)] });
    const key = `${addDays(MONDAY, -3)}T08:00`;
    const started = new Date(2030, 7, 6, 18, 20).toISOString();
    linked = [{ executionId: "c1", routineId: routine.id, occurrenceKey: key, rank: 1, sessionId: created.id, startedAt: started, businessStatus: "COMPLETED" }];
    everything = [
      { executionId: "c1", sessionId: created.id, sessionName: "Gainage", startedAt: started, endedAt: new Date(2030, 7, 6, 18, 30).toISOString(), businessStatus: "COMPLETED", link: { routineId: routine.id, occurrenceKey: key, rank: 1 } },
    ];
    await renderCalendar();
    expect(sectionDays()).toEqual([addDays(MONDAY, 1)]);
    expect(timeOf(`calendar-item-${routine.id}|${key}-card-time`)).toBe("18h20*");
    expect(screen.getByTestId(`calendar-item-${routine.id}|${key}-card-status-COMPLETED`)).toBeTruthy();
  });

  it("supprimer une Séance de parcours : elle seule ; la dernière supprime le créneau, sans ligne Ⓟ seule (D-553, arbitrage 9)", async () => {
    const first = await sessions.createStructured(input("Alpha"));
    const second = await sessions.createStructured(input("Bravo"));
    const routine = await plan({ name: "Genou", entries: [entry(first.id), entry(second.id)] });
    await renderCalendar();
    const group = `${routine.id}|${MONDAY}T08:00`;
    fireEvent(screen.getByTestId(`calendar-item-${group}|2-swipe-card`), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    expect(screen.getByText("Supprimer cette séance")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByText("Confirmer"));
    });
    await flush();
    expect(screen.queryByTestId(`calendar-item-${group}|2-card`)).toBeNull();
    expect(screen.getByTestId(`calendar-item-${group}|1-card-name`).props.children).toBe("Alpha");
    // L'occurrence a encore deux séances dans la routine (l'une désactivée) : elle reste un parcours avec sa ligne Ⓟ.
    expect(screen.getByTestId(`calendar-parcours-${group}-name`)).toBeTruthy();
    fireEvent(screen.getByTestId(`calendar-item-${group}|1-swipe-card`), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    await act(async () => {
      fireEvent.press(screen.getByText("Confirmer"));
    });
    await flush();
    expect(screen.queryByTestId(/^calendar-parcours-/)).toBeNull();
    expect(items()).toEqual([]);
    expect((await planning.getRoutine(routine.id))?.exclusions).toEqual([`${MONDAY}T08:00`]);
  });

  // D-560 (22/11/2026), développé le 23/11/2026 : l'Exécution hors planification porte la spécialité comme les autres cartes et une
  // astérisque à l'heure. [« Hors planification » en ligne 2 (D-553) — remplacé.]
  it("Exécution hors planification : carte à l'heure réelle avec astérisque, spécialité comme les autres cartes ; masquée par un filtre actif (D-553, § 4 et § 5 ; D-560)", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    const other = await sessions.createStructured(input("Dos"));
    const routine = await plan({ entries: [entry(other.id)] });
    const at = (hours: number, minutes: number) => new Date(2030, 7, 5, hours, minutes).toISOString();
    everything = [
      { executionId: "f1", sessionId: created.id, sessionName: "Gainage", startedAt: at(17, 5), endedAt: at(17, 20), businessStatus: "COMPLETED", link: null },
      // Deux Exécutions de la même Séance restent distinctes.
      { executionId: "f2", sessionId: created.id, sessionName: "Gainage", startedAt: at(19, 0), endedAt: at(19, 5), businessStatus: "PARTIAL", link: null },
      // Exécution non terminée : pas de carte.
      { executionId: "f3", sessionId: created.id, sessionName: "Gainage", startedAt: at(20, 0), endedAt: null, businessStatus: null, link: null },
    ];
    await renderCalendar();
    expect(timeOf("calendar-item-free|f1-card-time")).toBe("17h05*");
    expect(screen.getByTestId("calendar-item-free|f1-card-name").props.children).toBe("Gainage");
    expect(screen.queryByTestId("calendar-item-free|f1-card-detail-prefix")).toBeNull();
    expect(screen.queryByText(/Hors planification/)).toBeNull();
    expect(screen.getByTestId("calendar-item-free|f1-card-detail").props.children).toBe(screen.getByTestId(`${card(routine.id, MONDAY)}-detail`).props.children);
    expect(StyleSheet.flatten(screen.getByTestId("calendar-item-free|f1-card-time-mark").props.style)).toMatchObject({ fontSize: 11 });
    expect(screen.getByTestId("calendar-item-free|f1-swipe-card").props.accessibilityLabel).toContain(", hors planification");
    expect(screen.getByTestId("calendar-item-free|f2-card-status-PARTIAL")).toBeTruthy();
    expect(screen.queryByTestId("calendar-item-free|f3-card")).toBeNull();
    // Ordre chronologique du jour : 8h00 planifiée, 17h05 puis 19h00.
    expect(items()).toEqual([`calendar-item-${routine.id}|${MONDAY}T08:00-swipe`, "calendar-item-free|f1-swipe", "calendar-item-free|f2-swipe"]);
    // Ni modification, ni action glissée.
    mockPush.mockClear();
    fireEvent.press(screen.getByTestId("calendar-item-free|f1-card-frame"));
    expect(mockPush).not.toHaveBeenCalled();
    // Filtre actif : seules les Séances des routines choisies.
    setAgendaRoutineFilter(new Set([routine.id]));
    await renderCalendar();
    expect(screen.queryAllByTestId("calendar-item-free|f1-swipe")).toHaveLength(0);
  });

  // D-560 (22/11/2026), développé le 23/11/2026 : créneau ajouté à la main hors répétition (RM-273) et créneau unique (D-559 ;
  // Hermann, 23/11/2026 : « Oui. C'est le même concept ») — astérisque à l'heure, « ajouté hors répétition » au lecteur d'écran ;
  // créneau de la répétition sans marque. [Créneau unique non marqué (D-560, choix de Claude) — remplacé le 23/11/2026]
  it("D-560 : créneau ajouté et créneau unique marqués d'une astérisque (11 pour 15) ; créneau de la répétition non marqué", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    const other = await sessions.createStructured(input("Dos"));
    const weekly = await plan({ entries: [entry(created.id)], repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "FOR", count: 1 } } });
    const single = await plan({ entries: [entry(other.id)], time: "18:30", startDate: THURSDAY });
    const added = await planning.addOccurrence(weekly.id, {
      date: MONDAY,
      time: "17:05",
      sessions: [{ sessionId: created.id, entryId: `entry-${created.id}`, origin: "ROUTINE", active: true }],
      reminderMinutes: null,
    });
    expect(added.status).toBe("SAVED");
    await renderCalendar();
    const regular = card(weekly.id, MONDAY);
    const extra = `${card(weekly.id, MONDAY, "17:05+A1")}-time`;
    expect(timeOf(`${regular}-time`)).toBe("8h00");
    expect(timeOf(extra)).toBe("17h05*");
    expect(timeOf(`${card(single.id, THURSDAY, "18:30")}-time`)).toBe("18h30*");
    const mark = screen.getByTestId(`${extra}-mark`);
    expect(mark.props.children).toBe("*");
    // Même couleur que l'heure (héritée du texte de l'heure), plus petite : 11 pour 15.
    expect(StyleSheet.flatten(mark.props.style)).toEqual({ fontSize: 11 });
    expect(StyleSheet.flatten(screen.getByTestId(extra).props.style)).toMatchObject({ fontSize: 15 });
    // Lecteur d'écran.
    expect(screen.getByTestId(`calendar-item-${weekly.id}|${MONDAY}T08:00-swipe-card`).props.accessibilityLabel).not.toMatch(/hors/);
    expect(screen.getByTestId(extra.replace(/-card-time$/, "-swipe-card")).props.accessibilityLabel).toContain(", ajouté hors répétition");
    expect(screen.getByTestId(`calendar-item-${single.id}|${THURSDAY}T18:30-swipe-card`).props.accessibilityLabel).toContain(", ajouté hors répétition");
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

  it("recette du 26/11/2026 (après-midi) : règle unique du glisser-pour-options — geste court, lancer, diagonale, sans rebond", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    const routine = await plan({ entries: [entry(created.id)] });
    await renderCalendar();
    expectSwipeRevealRule(swipeCard(routine.id, MONDAY).props.testID.replace(/-card$/, ""));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("supprimer depuis l'Agenda : seule l'occurrence est retirée, la routine reste (recette du 20/11/2026, constat D)", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    const routine = await plan({ entries: [entry(created.id)] });
    await renderCalendar();
    fireEvent(swipeCard(routine.id, MONDAY), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    // r21-supprimer : « Supprimer ce créneau » ; recette du 20/11/2026 : « Annuler » et « Confirmer » côte à côte, même format.
    expect(screen.getByText("Supprimer ce créneau")).toBeTruthy();
    expect(within(screen.getByTestId("planning-delete-occurrence-actions")).getByTestId("planning-delete-occurrence-cancel")).toBeTruthy();
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
    // D-568 / RM-276 (23/11/2026) : l'occurrence prévue par la répétition reste à son heure, « Supprimée » (trace), sans retrait.
    // [Occurrence retirée (`exclusions`), lundi vide — remplacé.]
    expect(sectionDays()).toEqual([MONDAY, THURSDAY]);
    expect(screen.getByTestId(`${card(routine.id, MONDAY)}-status-DELETED`)).toBeTruthy();
    expect((await planning.getRoutine(routine.id))?.exclusions).toEqual([]);
    fireEvent.press(screen.getByTestId("calendar-next-week"));
    await flush();
    expect(sectionDays()).toEqual([addDays(MONDAY, 7), addDays(MONDAY, 10)]);
  });

  // D-568 / RM-276 (Hermann, 23/11/2026 ; Figma `12906:124`, « Dos et mobilité » du mardi 17) : trace d'une occurrence supprimée.
  it("occurrence supprimée avec trace : carte grise « Supprimée » à l'heure prévue, sans point ; le glisser propose « Rétablir » seul (D-568)", async () => {
    const created = await sessions.createStructured(input("Dos et mobilité"));
    const routine = await plan({
      time: "18:30",
      entries: [entry(created.id)],
      repetition: { unit: "WEEK", every: 1, weekdays: [1, 4], end: { kind: "UNTIL", date: addDays(MONDAY, 30) } },
    });
    await renderCalendar();
    const id = `${card(routine.id, MONDAY, "18:30")}`;
    fireEvent(swipeCard(routine.id, MONDAY), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    fireEvent.press(screen.getByText("Confirmer"));
    await flush();
    expect(screen.getByTestId(`${id}-status-DELETED`)).toBeTruthy();
    expect(screen.getByTestId(`${id}-time`).props.children).toBe("18h30");
    expect(within(screen.getByTestId(`${id}-status-tag`)).getByText("Supprimée")).toBeTruthy();
    expect(screen.queryByTestId(`${id}-start`)).toBeNull();
    // Cadre, traits et texte gris (Figma `12906:124`).
    expect(StyleSheet.flatten(screen.getByTestId(`${id}-frame`).props.style)).toMatchObject({ backgroundColor: "#F6F6F9" });
    expect(StyleSheet.flatten(screen.getByTestId(`${id}-name`).props.style)).toMatchObject({ color: "#8F949E" });
    expect(StyleSheet.flatten(screen.getByTestId(`${id}-time`).props.style)).toMatchObject({ color: "#8F949E" });
    // Figma `12906:184` : une Séance supprimée n'a pas de point dans la rangée des jours.
    expect(screen.queryAllByTestId(`calendar-day-${MONDAY}-dot`)).toHaveLength(0);
    // Le cadre n'ouvre rien ; le glisser ne propose que « Rétablir ».
    mockPush.mockClear();
    fireEvent.press(screen.getByTestId(`${id}-frame`));
    expect(mockPush).not.toHaveBeenCalled();
    const actions = (swipeCard(routine.id, MONDAY).props.accessibilityActions as readonly { name: string }[]).map((action) => action.name);
    expect(actions).toContain("restore");
    expect(actions).not.toContain("delete");
    expect(actions).not.toContain("duplicate");
    fireEvent(swipeCard(routine.id, MONDAY), "accessibilityAction", { nativeEvent: { actionName: "restore" } });
    await flush();
    expect(screen.getByTestId(`${id}-status-UPCOMING`)).toBeTruthy();
    expect(screen.getAllByTestId(`calendar-day-${MONDAY}-dot`)).toHaveLength(1);
    expect((await planning.getRoutine(routine.id))?.overrides ?? []).toEqual([]);
  });

  it("parcours prévu par la répétition : trace par Séance ; toutes supprimées, le créneau entier reste visible, supprimé (D-568)", async () => {
    const first = await sessions.createStructured(input("Alpha"));
    const second = await sessions.createStructured(input("Bravo"));
    const routine = await plan({
      name: "Genou",
      entries: [entry(first.id), entry(second.id)],
      repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: addDays(MONDAY, 14) } },
    });
    await renderCalendar();
    const group = `${routine.id}|${MONDAY}T08:00`;
    fireEvent(screen.getByTestId(`calendar-item-${group}|2-swipe-card`), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    await act(async () => {
      fireEvent.press(screen.getByText("Confirmer"));
    });
    await flush();
    // Bravo : trace grise à son rang ; Alpha reste prévue.
    expect(screen.getByTestId(`calendar-item-${group}|s1-card-status-DELETED`)).toBeTruthy();
    expect(screen.getByTestId(`calendar-item-${group}|s1-card-time`).props.children).toBe("—");
    expect(screen.getByTestId(`calendar-item-${group}|1-card-status-UPCOMING`)).toBeTruthy();
    fireEvent(screen.getByTestId(`calendar-item-${group}|1-swipe-card`), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    await act(async () => {
      fireEvent.press(screen.getByText("Confirmer"));
    });
    await flush();
    // Toutes supprimées : le créneau reste visible (ligne « Ⓟ », deux cartes « Supprimée »). [« La dernière Séance supprimée
    // supprime le créneau » — remplacé pour un créneau de la répétition.]
    expect(screen.getByTestId(`calendar-parcours-${group}-name`)).toBeTruthy();
    expect(screen.getByTestId(`calendar-item-${group}|s0-card-status-DELETED`)).toBeTruthy();
    expect(screen.getByTestId(`calendar-item-${group}|s1-card-status-DELETED`)).toBeTruthy();
    expect(screen.getByTestId(`calendar-item-${group}|s0-card-time`).props.children).toBe("8h00");
    expect((await planning.getRoutine(routine.id))?.exclusions).toEqual([]);
    // Rétablir une Séance : elle redevient prévue, l'autre reste supprimée.
    fireEvent(screen.getByTestId(`calendar-item-${group}|s0-swipe-card`), "accessibilityAction", { nativeEvent: { actionName: "restore" } });
    await flush();
    expect(screen.getByTestId(`calendar-item-${group}|1-card-status-UPCOMING`)).toBeTruthy();
    expect(screen.getByTestId(`calendar-item-${group}|s1-card-status-DELETED`)).toBeTruthy();
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

  // UI-FAB-01 (D-559) : bouton flottant calendrier « + » — créer un créneau unique au jour sélectionné : planification
  // pré-remplie à ce jour, sans répétition (répétition « Aucune » par défaut). Le créneau porte l'astérisque « hors routine »
  // (D-560, inchangé : `agendaCards` et `RoutineAgendaCard`, tests du 23/11/2026).
  it("bouton flottant : créer un créneau unique au jour sélectionné, sans répétition (D-559)", async () => {
    await renderCalendar();
    expect(screen.getByTestId("floating-create-glyph-calendar")).toBeTruthy();
    fireEvent.press(screen.getByTestId(`calendar-day-${THURSDAY}`));
    fireEvent.press(screen.getByLabelText(strings.shared.floatingCreate.createSlot));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/planning", params: { date: THURSDAY } });
    expect(initialDraft(THURSDAY, [], new Date()).repetitionOn).toBe(false);
  });

  // Recette du 21/11/2026 (q23-mois) : le mois affiché est celui qui compte le plus de jours dans la semaine ; les doubles flèches
  // ouvrent la première semaine du mois (le 1er choisi s'il y est, sinon le lundi). [Mois du jour choisi — remplacé.]
  // Recette du 22/11/2026 (c33-agenda-mois — Hermann : « Double flèches : doit être la semaine du premier jour du mois,
  // sélectionné »). [Première semaine du mois voisin (21/11/2026) — remplacé.]
  it("navigation : doubles flèches vers la semaine du 1er du mois, le 1er choisi ; mois atteint affiché ; bouton « Aujourd'hui » (D-538)", async () => {
    await renderCalendar();
    fireEvent.press(screen.getByTestId("calendar-next-month"));
    await flush();
    // 1er septembre 2030 : dimanche — semaine du 26 août au 1er septembre, le 1er choisi ; le libellé est le mois atteint.
    expect(screen.getByTestId("calendar-month-label").props.children).toBe("Septembre 2030");
    expect(screen.getByTestId("calendar-day-2030-08-26")).toBeTruthy();
    expect(screen.getByTestId("calendar-day-2030-09-01").props.accessibilityState).toMatchObject({ selected: true });
    // Pas de blocage sur cette semaine : octobre ensuite (1er octobre 2030 : mardi).
    fireEvent.press(screen.getByTestId("calendar-next-month"));
    await flush();
    expect(screen.getByTestId("calendar-month-label").props.children).toBe("Octobre 2030");
    expect(screen.getByTestId("calendar-day-2030-10-01").props.accessibilityState).toMatchObject({ selected: true });
    fireEvent.press(screen.getByTestId("calendar-previous-month"));
    await flush();
    expect(screen.getByTestId("calendar-month-label").props.children).toBe("Septembre 2030");
    expect(screen.getByTestId("calendar-day-2030-09-01").props.accessibilityState).toMatchObject({ selected: true });
    fireEvent.press(screen.getByTestId("calendar-previous-month"));
    await flush();
    // 1er août 2030 : jeudi — semaine du 29 juillet au 4 août, quatre jours en août ; le 1er est choisi.
    expect(screen.getByTestId("calendar-month-label").props.children).toBe("Août 2030");
    expect(screen.getByTestId("calendar-day-2030-07-29")).toBeTruthy();
    expect(screen.getByTestId("calendar-day-2030-08-01").props.accessibilityState).toMatchObject({ selected: true });
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

  // D-554 (21/11/2026) : trois onglets Journal · Agenda · Plan, emplacements égaux de la barre (x = 16, 139, 262). [D-542 : deux
  // onglets d'un tiers, centrés — remplacé.]
  it("barre de titre à onglets : Journal · Agenda · Plan (D-554), Agenda actif, composant partagé des Catalogues (D-532)", async () => {
    const onChangeView = jest.fn();
    const referentials = { listCategories: jest.fn(async () => []) } as unknown as ReferentialService;
    render(
      <TestSafeAreaProvider>
        <SessionServiceContext.Provider value={new SessionService(sessions)}>
          <ReferentialServiceContext.Provider value={referentials}>
            <PlanningServiceContext.Provider value={planning}>
              <CalendarWeekScreen initialDay={MONDAY} onChangeView={onChangeView} />
            </PlanningServiceContext.Provider>
          </ReferentialServiceContext.Provider>
        </SessionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
    await flush();
    const tab = (value: string) => screen.getByTestId(`calendar-view-row-${value}`);
    expect(screen.getByTestId("calendar-view-row").props.accessibilityRole).toBe("tablist");
    expect(screen.getByTestId("calendar-view-row-day-label").props.children).toBe("Journal");
    expect(screen.getByTestId("calendar-view-row-week-label").props.children).toBe("Agenda");
    expect(screen.getByTestId("calendar-view-row-plan-label").props.children).toBe("Plan");
    expect(screen.queryByText("Vue d’ensemble")).toBeNull();
    // Trois emplacements égaux sur toute la largeur, comme les Catalogues.
    expect(StyleSheet.flatten(screen.getByTestId("calendar-view-row").props.style).justifyContent).toBeUndefined();
    const slot = StyleSheet.flatten(screen.getByTestId("calendar-view-row-plan-slot").props.style);
    expect(slot).toMatchObject({ flex: 1, flexBasis: 0 });
    expect(tab("week").props.accessibilityState).toMatchObject({ selected: true });
    expect(tab("plan").props.accessibilityState).toMatchObject({ selected: false });
    fireEvent.press(tab("plan"));
    expect(onChangeView).toHaveBeenLastCalledWith("plan");
    fireEvent.press(tab("day"));
    expect(onChangeView).toHaveBeenLastCalledWith("journal");
  });

  // D-555 (21/11/2026) : mois centré sur la rangée des jours ; entonnoir au-dessus de la flèche de semaine suivante, centré sur
  // la ligne du mois ; contour bleu sans filtre, plein bleu avec filtre.
  // D-559 (UI-FAB-01, Figma `12906:47`) : sans Planifier, zone symétrique — « Aujourd'hui », mois centré sur l'écran,
  // entonnoir en miroir ; flèche, sept jours, flèche centrés sur l'écran. [D-555 : mois centré sur les jours (x = 160 du
  // contenu), entonnoir au-dessus de la flèche suivante — remplacé.]
  it("zone de contexte symétrique : mois et jours centrés sur l'écran, entonnoir en miroir d'Aujourd'hui, entonnoir bleu (D-559, D-555)", async () => {
    await renderCalendar();
    const center = 370 / 2;
    const nav = StyleSheet.flatten(screen.getByTestId("calendar-month-navigation").props.style);
    expect(nav.left + nav.width / 2).toBe(center);
    const days = StyleSheet.flatten(screen.getByTestId("calendar-day-bar").props.style);
    expect(days.left + days.width / 2).toBe(center + 0.5);
    const previous = StyleSheet.flatten(screen.getByTestId("calendar-previous-week").props.style);
    const next = StyleSheet.flatten(screen.getByTestId("calendar-next-week").props.style);
    expect((previous.left + 12 + next.left + 12) / 2).toBeCloseTo(center + 0.625, 3);
    const today = StyleSheet.flatten(screen.getByTestId("calendar-today").props.style);
    const filter = StyleSheet.flatten(screen.getByTestId("calendar-routine-filter").props.style);
    // Miroir : même distance aux bords du contenu, même hauteur (centre vertical sur la ligne du mois, 11 + 24 / 2).
    expect(today.left + filter.left + filter.width).toBe(370);
    expect(filter.top).toBe(today.top);
    expect(filter.top + filter.height / 2).toBe(11 + 12);
    expect(screen.queryByTestId("calendar-plan")).toBeNull();
    expect(screen.getByTestId("calendar-routine-filter-inactive")).toBeTruthy();
    // Icône sans filtre : contour bleu #0508E5 (composant Figma `icon/filtre-routine`, État=Inactif). [Contour gris #333333 — remplacé.]
    const svg = readFileSync(join(__dirname, "../../../../assets/icons/icon-filtre-routine.svg"), "utf8");
    expect(svg).toContain('stroke="#0508E5"');
    expect(svg).not.toContain("fill=\"#0508E5\"");
  });
});
