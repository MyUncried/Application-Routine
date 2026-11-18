import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ScrollView, View } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { EVERY_TIME } from "@/domain/planning/Routine";
import type { StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { PlanningScreen } from "@/features/planning/PlanningScreen";
import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import { NumberWheelPicker } from "@/features/sessions/NumberWheelPicker";
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
 * Planifier un parcours / une séance (CE-UI-12, D-519 à D-526, RM-253 à RM-264) sur SQLite réelle : nom, synthèse, quatre
 * cartes, Répétition sans interrupteur, grille créneaux × rotation, roulettes natives en popover, Rappel sans interrupteur.
 * Jest n'exerce ni la roulette SwiftUI réelle ni la mise en page : vérification sur iPhone nécessaire.
 * [Tests de l'écran CE-UI-05 / CE-UI-11 (interrupteurs, stepper, « pendant », liste réordonnable, feuille « Fréquence ») —
 * retirés avec ces écrans le 18/11/2026, D-523.]
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
  mockPush.mockClear();
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
    reminders: { refresh, ensurePermission: async () => permission === "granted", isPermitted: async () => permission === "granted" },
    newId: () => `routine-${++ids}`,
    now: () => new Date(2030, 0, 1),
  });
  // Popovers : position du champ dans la fenêtre.
  jest.spyOn(View.prototype as unknown as { measureInWindow: () => void }, "measureInWindow").mockImplementation((...args: unknown[]) => {
    (args[0] as (x: number, y: number, width: number, height: number) => void)(100, 300, 40, 32);
  });
});

afterEach(() => {
  database.close();
  jest.restoreAllMocks();
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

/** Sélection initiale, dans la feuille « Planifier » : cases touchées dans l'ordre, puis la coche. */
async function validateSelection(selected: readonly string[]) {
  expect(screen.getByText("Catalogue des séances")).toBeTruthy();
  for (const id of selected) fireEvent.press(screen.getByTestId(`planning-selection-${id}`));
  fireEvent.press(screen.getByTestId("screen-header-validate"));
  await flush();
}

/** Roulette heures / minutes du voile (heure de début) : valide une valeur (en minutes). */
function validateTimeWheel(minutes: number) {
  expect(screen.getByTestId("wheel-picker-overlay")).toBeTruthy();
  act(() => screen.UNSAFE_getByType(DurationWheelPicker).props.onValidate(minutes));
}

/** Cran de la roulette native SwiftUI (`Picker`, `pickerStyle("wheel")`). */
function turnWheel(testID: string, value: number) {
  fireEvent(screen.getByTestId(testID), "selectionChange", { nativeEvent: { selection: value } });
}

const validateEnabled = () => screen.getByTestId("screen-header-validate").props.accessibilityState?.disabled !== true;
const synthesis = () => screen.getByTestId("planning-synthesis").props.children as string;
const mention = (row: number) => screen.getByTestId(`planning-row-${row}-mention`).props.children as string;
const played = (row: number, column: number) => screen.getByTestId(`planning-point-${row}-${column}`).props.accessibilityState?.checked === true;
const save = async () => {
  fireEvent.press(screen.getByTestId("screen-header-validate"));
  await flush();
};

describe("Planifier (CE-UI-12)", () => {
  it("séance seule depuis « Planifier » : nom copié (RM-258), quatre cartes, synthèse sans majuscule ni point final (RM-259), 15' si autorisé", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    await renderPlanning({ sessionId: created.id, date: START });
    expect(screen.getByText("Planifier une séance")).toBeTruthy();
    expect(screen.getByTestId("planning-name").props.value).toBe("Gainage");
    for (const card of ["planning-slot", "planning-repetition", "planning-grid", "planning-reminder"]) expect(screen.getByTestId(card)).toBeTruthy();
    expect(within(screen.getByTestId("planning-slot")).getByText("Programme")).toBeTruthy();
    expect(within(screen.getByTestId("planning-slot")).getByText("Début")).toBeTruthy();
    expect(synthesis()).toMatch(/ le 5 août 2030, à 8h$/);
    expect(synthesis()).not.toMatch(/^[A-Z]|\.$/);
    expect(screen.queryByText(/Prochain créneau/)).toBeNull();
    // D-524 : notifications déjà autorisées → 15' présélectionnées.
    expect(screen.getByTestId("planning-reminder-options-15").props.accessibilityState.selected).toBe(true);
    await save();
    const [routine] = await planning.listRoutines();
    expect(routine).toMatchObject({ name: "Gainage", startDate: START, time: "08:00", repetition: null, reminderMinutes: 15 });
    expect(routine?.entries).toEqual([expect.objectContaining({ sessionId: created.id, frequency: EVERY_TIME })]);
    expect(mockBack).toHaveBeenCalled();
  });

  it("répétition sans interrupteur : « aucune » → « toutes les » semaines avec jours ; « tous les » jours sans jours (RM-257, D-520)", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    await renderPlanning({ sessionId: created.id, date: START });
    expect(screen.queryByTestId("planning-repetition-switch")).toBeNull();
    expect(within(screen.getByTestId("planning-repetition-kind")).getByText("aucune")).toBeTruthy();
    expect(screen.queryByTestId("planning-weekdays")).toBeNull();
    fireEvent.press(screen.getByTestId("planning-repetition-kind"));
    expect(within(screen.getByTestId("planning-repetition-kind")).getByText("toutes les")).toBeTruthy();
    expect(within(screen.getByTestId("planning-unit")).getByText("semaine")).toBeTruthy();
    expect(screen.getByTestId("planning-weekdays")).toBeTruthy();
    fireEvent.press(screen.getByTestId("planning-weekday-4"));
    expect(synthesis()).toMatch(/ toutes les semaines, les lundis et jeudis, à 8h, jusqu’au 2 septembre 2030$/);
    fireEvent.press(screen.getByTestId("planning-unit"));
    expect(within(screen.getByTestId("planning-repetition-kind")).getByText("tous les")).toBeTruthy();
    expect(within(screen.getByTestId("planning-unit")).getByText("jour")).toBeTruthy();
    expect(screen.queryByTestId("planning-weekdays")).toBeNull();
    expect(screen.queryByText("Mois")).toBeNull();
    expect(synthesis()).toMatch(/ tous les jours, à 8h, jusqu’au 2 septembre 2030$/);
    await save();
    const [routine] = await planning.listRoutines();
    expect(routine?.repetition).toEqual({ unit: "DAY", every: 1, weekdays: [], end: { kind: "UNTIL", date: "2030-09-02" } });
  });

  it("nombre de semaines : roulette native SwiftUI en popover près du champ — ni titre, ni bouton, ni unité, aucun stepper (D-520)", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    await renderPlanning({ sessionId: created.id, date: START });
    fireEvent.press(screen.getByTestId("planning-repetition-kind"));
    fireEvent.press(screen.getByTestId("planning-every"));
    const wheel = screen.getByTestId("planning-every-wheel");
    // Primitive native : `Picker` SwiftUI (`selection` / `onSelectionChange`, `pickerStyle("wheel")`), jamais un ScrollView.
    expect(wheel.props.selection).toBe(1);
    expect(wheel.props.onSelectionChange).toBeInstanceOf(Function);
    expect(JSON.stringify(wheel.props.modifiers)).toContain("wheel");
    const panel = screen.getByTestId("planning-every-popover-panel");
    expect(panel.findAllByType(ScrollView)).toHaveLength(0);
    expect(screen.UNSAFE_queryAllByType(NumberWheelPicker)).toHaveLength(0);
    expect(within(panel).queryByText(/semaine/)).toBeNull();
    expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();
    expect(screen.queryByTestId("planning-every-stepper")).toBeNull();
    // Près du champ : sous le champ mesuré (y 300 + 32 + écart).
    expect(panel.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ top: 338 })]));
    turnWheel("planning-every-wheel", 2);
    expect(within(screen.getByTestId("planning-every")).getByText("2")).toBeTruthy();
    fireEvent.press(screen.getByTestId("planning-every-popover-scrim", { includeHiddenElements: true }));
    expect(screen.queryByTestId("planning-every-wheel")).toBeNull();
    expect(synthesis()).toMatch(/ toutes les 2 semaines, les lundis, à 8h, /);
  });

  it("parcours : nom vide et obligatoire, puis déjà pris (RM-258, RM-261) ; enregistré avec le nom saisi", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    const existing = await planning.createRoutine({ name: "Matin", startDate: START, time: "07:00", repetition: null, entries: [{ id: "x", sessionId: a.id, frequency: EVERY_TIME }] });
    expect(existing.status).toBe("SAVED");
    await renderPlanning({ date: START });
    await validateSelection([b.id, a.id]);
    expect(screen.getByText("Planifier un parcours")).toBeTruthy();
    expect(screen.getByTestId("planning-name").props.value).toBe("");
    expect(screen.getByTestId("planning-name-error").props.children).toBe("Nom obligatoire");
    expect(validateEnabled()).toBe(false);
    fireEvent.changeText(screen.getByTestId("planning-name"), "  MATIN ");
    expect(screen.getByTestId("planning-name-error").props.children).toBe("Ce nom est déjà utilisé");
    expect(validateEnabled()).toBe(false);
    fireEvent.changeText(screen.getByTestId("planning-name"), "Genou");
    expect(screen.queryByTestId("planning-name-error")).toBeNull();
    expect(validateEnabled()).toBe(true);
    await save();
    const routines = await planning.listRoutines();
    expect(routines[1]).toMatchObject({ name: "Genou" });
    // D-519 : ordre des lignes = ordre de sélection.
    expect(routines[1]?.entries.map((entry) => entry.sessionId)).toEqual([b.id, a.id]);
  });

  it("une seule séance cochée dans la sélection : son nom est copié (RM-258)", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    await renderPlanning({ date: START });
    await validateSelection([a.id]);
    expect(screen.getByTestId("planning-name").props.value).toBe("Alpha");
  });

  it("grille : #1 seul actif au départ ; toucher #3 règle le cycle ; mention calculée ; au moins un point par ligne et par colonne (RM-253 à RM-256, RM-260, RM-262)", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    await renderPlanning({ date: START });
    await validateSelection([a.id, b.id]);
    fireEvent.changeText(screen.getByTestId("planning-name"), "Genou");
    expect(screen.getByTestId("planning-change")).toBeTruthy();
    for (let column = 1; column <= 7; column += 1) expect(screen.getByTestId(`planning-column-${column}`)).toBeTruthy();
    expect(played(0, 1) && played(1, 1)).toBe(true);
    expect(played(0, 2)).toBe(false);
    expect(mention(0)).toBe("(à chaque fois)");
    // RM-262 : une seule colonne, le point ne peut pas être retiré.
    fireEvent.press(screen.getByTestId("planning-point-0-1"));
    expect(played(0, 1)).toBe(true);
    // RM-260 : allonger → chaque nouvelle colonne pointée pour toutes les séances.
    fireEvent.press(screen.getByTestId("planning-column-3"));
    expect([1, 2, 3].every((column) => played(0, column) && played(1, column))).toBe(true);
    expect(played(0, 4)).toBe(false);
    fireEvent.press(screen.getByTestId("planning-point-1-3"));
    expect(mention(1)).toBe("(2 fois sur 3)");
    expect(mention(0)).toBe("(à chaque fois)");
    // Colonne 3 : Alpha y reste seul — son point ne peut pas être retiré.
    fireEvent.press(screen.getByTestId("planning-point-0-3"));
    expect(played(0, 3)).toBe(true);
    // Colonne inactive : sans effet.
    fireEvent.press(screen.getByTestId("planning-point-0-5"));
    expect(played(0, 5)).toBe(false);
    await save();
    const [routine] = await planning.listRoutines();
    expect(routine?.entries.map((entry) => entry.frequency)).toEqual([
      { x: 3, n: 3, positions: [1, 2, 3] },
      { x: 2, n: 3, positions: [1, 2] },
    ]);
  });

  it("grille : raccourcir le cycle retire les colonnes ; une séance restée sans point est jouée partout (RM-260)", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    await renderPlanning({ date: START });
    await validateSelection([a.id, b.id]);
    fireEvent.press(screen.getByTestId("planning-column-3"));
    fireEvent.press(screen.getByTestId("planning-point-1-1"));
    fireEvent.press(screen.getByTestId("planning-point-1-2"));
    expect(mention(1)).toBe("(1 fois sur 3)");
    fireEvent.press(screen.getByTestId("planning-column-2"));
    expect(played(1, 1) && played(1, 2)).toBe(true);
    expect(mention(1)).toBe("(à chaque fois)");
  });

  it("planification existante : nom vide à compléter (RM-264), « pendant » converti en date, motifs n différents ramenés à un cycle commun (RM-263), retraits conservés", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    const now = new Date().toISOString();
    await database.runAsync(
      `INSERT INTO routines (id, owner_id, name, start_date, start_time, repeat_unit, repeat_every, repeat_weekdays, end_kind, end_date, end_count, reminder_minutes, created_at, updated_at)
       SELECT 'legacy', id, '', '${START}', '08:00', 'WEEK', 1, '1', 'FOR', NULL, 6, NULL, '${now}', '${now}' FROM users`,
    );
    await database.runAsync(`INSERT INTO routine_entries VALUES ('l1', 'legacy', 0, '${a.id}', 2, 2, '1,2'), ('l2', 'legacy', 1, '${b.id}', 2, 3, '1,3')`);
    await planning.excludeOccurrence("legacy", "2030-08-12T08:00");
    await renderPlanning({ routineId: "legacy" });
    expect(screen.getByTestId("planning-name").props.value).toBe("");
    expect(validateEnabled()).toBe(false);
    // Lundi 5 août 2030 + 6 semaines civiles : dimanche 15 septembre 2030.
    expect(synthesis()).toContain("jusqu’au 15 septembre 2030");
    expect(screen.getByTestId("planning-column-6")).toBeTruthy();
    expect(mention(0)).toBe("(à chaque fois)");
    expect(mention(1)).toBe("(4 fois sur 6)");
    fireEvent.changeText(screen.getByTestId("planning-name"), "Ancienne");
    await save();
    const routine = await planning.getRoutine("legacy");
    expect(routine).toMatchObject({ name: "Ancienne", exclusions: ["2030-08-12T08:00"] });
    expect(routine?.repetition?.end).toEqual({ kind: "UNTIL", date: "2030-09-15" });
    expect(routine?.entries.map((entry) => entry.frequency.positions)).toEqual([
      [1, 2, 3, 4, 5, 6],
      [1, 3, 4, 6],
    ]);
  });

  it("cycle enregistré au-delà de 7 : la modification demande de le ramener à 7 au plus (RM-263)", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    const now = new Date().toISOString();
    await database.runAsync(
      `INSERT INTO routines (id, owner_id, name, start_date, start_time, repeat_unit, repeat_every, repeat_weekdays, end_kind, end_date, end_count, reminder_minutes, created_at, updated_at)
       SELECT 'long', id, 'Long', '${START}', '08:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '${now}', '${now}' FROM users`,
    );
    await database.runAsync(`INSERT INTO routine_entries VALUES ('l1', 'long', 0, '${a.id}', 1, 4, '1'), ('l2', 'long', 1, '${b.id}', 1, 3, '2')`);
    await renderPlanning({ routineId: "long" });
    expect(screen.getByTestId("planning-cycle-too-long")).toBeTruthy();
    expect(validateEnabled()).toBe(false);
    fireEvent.press(screen.getByTestId("planning-column-4"));
    expect(screen.queryByTestId("planning-cycle-too-long")).toBeNull();
    // Colonnes 3 et 4 restées vides : au moins un point par colonne (RM-254) avant l’enregistrement.
    expect(validateEnabled()).toBe(false);
    fireEvent.press(screen.getByTestId("planning-point-0-3"));
    fireEvent.press(screen.getByTestId("planning-point-1-4"));
    expect(validateEnabled()).toBe(true);
  });

  it("rappel sans interrupteur : Sans / 15' / 30' / 1h / Autre ; « Autre » ouvre la roulette native heures / minutes sans unité (D-524)", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    await renderPlanning({ sessionId: created.id, date: START });
    expect(screen.queryByTestId("planning-reminder-switch")).toBeNull();
    const options = screen.getByTestId("planning-reminder-options");
    for (const label of ["Sans", "15’", "30’", "1h", "Autre"]) expect(within(options).getByText(label)).toBeTruthy();
    expect(within(options).queryByText("5’")).toBeNull();
    fireEvent.press(screen.getByText("Autre"));
    await flush();
    const panel = screen.getByTestId("planning-reminder-popover-panel");
    expect(screen.getByTestId("planning-reminder-hours").props.onSelectionChange).toBeInstanceOf(Function);
    expect(screen.getByTestId("planning-reminder-minutes").props.onSelectionChange).toBeInstanceOf(Function);
    expect(screen.UNSAFE_queryAllByType(DurationWheelPicker)).toHaveLength(0);
    expect(within(panel).queryByText(/heure|minute|Rappel/)).toBeNull();
    turnWheel("planning-reminder-hours", 1);
    turnWheel("planning-reminder-minutes", 20);
    fireEvent.press(screen.getByTestId("planning-reminder-popover-scrim", { includeHiddenElements: true }));
    expect(within(screen.getByTestId("planning-reminder-options-OTHER")).getByText("1h20")).toBeTruthy();
    fireEvent.press(screen.getByText("1h"));
    expect(screen.getByText("Autre")).toBeTruthy();
    fireEvent.press(screen.getByText("Sans"));
    await save();
    const [routine] = await planning.listRoutines();
    expect(routine?.reminderMinutes).toBeNull();
  });

  it("notifications non autorisées : « Sans » par défaut ; un délai refusé par le système reste « Sans » avec l'information (RM-053)", async () => {
    permission = "denied";
    const created = await sessions.createStructured(input("Gainage"));
    await renderPlanning({ sessionId: created.id, date: START });
    expect(screen.getByTestId("planning-reminder-options-NONE").props.accessibilityState.selected).toBe(true);
    fireEvent.press(screen.getByText("30’"));
    await flush();
    expect(screen.getByTestId("planning-reminder-options-NONE").props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId("planning-reminder-denied")).toBeTruthy();
    await save();
    const [routine] = await planning.listRoutines();
    expect(routine?.reminderMinutes).toBeNull();
  });

  it("notifications retirées dans Réglages : un rappel enregistré revient à « Sans » avec l'information (e3)", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    const saved = await planning.createRoutine({ name: "Gainage", startDate: START, time: "08:00", repetition: null, entries: [{ id: "e1", sessionId: created.id, frequency: EVERY_TIME }], reminderMinutes: 15 });
    if (saved.status !== "SAVED") throw new Error("setup");
    permission = "denied";
    await renderPlanning({ routineId: saved.routine.id });
    expect(screen.getByTestId("planning-reminder-options-NONE").props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId("planning-reminder-denied")).toBeTruthy();
  });

  it("date et heure : voile et sélecteurs existants, valeurs en noir (demande du 18/11/2026)", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    await renderPlanning({ sessionId: created.id, date: START });
    fireEvent.press(screen.getByTestId("planning-start-time"));
    validateTimeWheel(9 * 60 + 30);
    expect(within(screen.getByTestId("planning-start-time")).getByText("09:30")).toBeTruthy();
    fireEvent.press(screen.getByTestId("planning-start-date"));
    const calendar = screen.getByTestId("planning-date-panel").findAll((node) => typeof node.props.onDateChange === "function")[0]!;
    act(() => calendar.props.onDateChange(new Date(2030, 7, 7, 12, 0)));
    fireEvent.press(screen.getByTestId("planning-date-panel-validate"));
    expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();
    expect(synthesis()).toContain("le 7 août 2030, à 9h30");
  });

  it("jours qui ne tiennent pas : « X jours par semaine » (RM-259)", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    await renderPlanning({ sessionId: created.id, date: START });
    fireEvent.press(screen.getByTestId("planning-repetition-kind"));
    for (const day of [2, 3, 4, 5]) fireEvent.press(screen.getByTestId(`planning-weekday-${day}`));
    fireEvent(screen.getByTestId("planning-synthesis"), "textLayout", { nativeEvent: { lines: [{}, {}, {}] } });
    expect(synthesis()).toContain("toutes les semaines, 5 jours par semaine, à 8h");
  });

  it("« Changer » ouvre la sélection en feuille avec la liste actuelle ; une séance ajoutée est jouée dans tous les créneaux", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    await renderPlanning({ sessionId: a.id, date: START });
    fireEvent.press(screen.getByTestId("planning-column-2"));
    fireEvent.press(screen.getByTestId("planning-change"));
    expect(mockPush).toHaveBeenLastCalledWith("/planning-selection");
    const request = pendingPlanningSheet("selection");
    expect(request).toMatchObject({ initial: [a.id] });
    act(() => request!.onValidate([a.id, b.id]));
    expect(played(1, 1) && played(1, 2)).toBe(true);
    expect(screen.getByTestId("planning-name").props.value).toBe("");
  });

  it("fermer la sélection initiale sans contenu ferme Planifier sans rien écrire", async () => {
    await sessions.createStructured(input("Alpha"));
    await renderPlanning({ date: START });
    fireEvent.press(screen.getByTestId("screen-header-back"));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(await planning.listRoutines()).toEqual([]);
  });
});
