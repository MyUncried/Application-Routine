import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Alert, AppState, Linking, ScrollView, View } from "react-native";

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
 * [Tests de l'écran CE-UI-05 / CE-UI-11 (interrupteurs, stepper, liste réordonnable, feuille « Fréquence ») — retirés avec
 * ces écrans le 18/11/2026, D-523. « pendant » rétabli par la recette du 19/11/2026 (d4).]
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
let permission: "granted" | "denied" | "undetermined";
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
    reminders: {
      refresh,
      ensurePermission: async () => permission === "granted",
      isPermitted: async () => permission === "granted",
      permissionStatus: async () => permission,
    },
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
  // Modification depuis le Journal (D-536, constat E du 20/11/2026) : confirmation « N créneaux à venir seront modifiés. ».
  const confirm = screen.queryByTestId("planning-modify-confirm");
  if (confirm !== null) {
    fireEvent.press(confirm);
    await flush();
  }
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

  // D-553 (21/11/2026) : nom généré « Bravo + Alpha » ; doublon autorisé ; nom vidé bloquant (« Nom obligatoire ») ; nom saisi
  // = personnalisé. [RM-258 / RM-261 : nom vide et obligatoire à plusieurs séances, « Ce nom est déjà utilisé » — remplacés.]
  it("parcours : nom généré, doublon autorisé, nom vidé bloquant, nom saisi personnalisé (D-553)", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    const existing = await planning.createRoutine({ name: "Matin", startDate: START, time: "07:00", repetition: null, entries: [{ id: "x", sessionId: a.id, frequency: EVERY_TIME }] });
    expect(existing.status).toBe("SAVED");
    await renderPlanning({ date: START });
    await validateSelection([b.id, a.id]);
    expect(screen.getByText("Planifier un parcours")).toBeTruthy();
    expect(screen.getByTestId("planning-name").props.value).toBe("Bravo + Alpha");
    expect(screen.queryByTestId("planning-name-error")).toBeNull();
    expect(validateEnabled()).toBe(true);
    fireEvent.changeText(screen.getByTestId("planning-name"), "");
    expect(screen.getByTestId("planning-name-error").props.children).toBe("Nom obligatoire");
    expect(validateEnabled()).toBe(false);
    fireEvent.changeText(screen.getByTestId("planning-name"), "  MATIN ");
    expect(screen.queryByTestId("planning-name-error")).toBeNull();
    expect(screen.queryByText("Ce nom est déjà utilisé")).toBeNull();
    expect(validateEnabled()).toBe(true);
    await save();
    const routines = await planning.listRoutines();
    expect(routines[1]).toMatchObject({ name: "MATIN" });
    expect(routines[1]?.nameGenerated).toBeUndefined();
    // D-519 : ordre des lignes = ordre de sélection.
    expect(routines[1]?.entries.map((entry) => entry.sessionId)).toEqual([b.id, a.id]);
  });

  it("nom généré enregistré comme tel ; à la modification il suit la composition (D-553)", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    await renderPlanning({ date: START });
    await validateSelection([a.id, b.id]);
    await save();
    const [created] = await planning.listRoutines();
    expect(created).toMatchObject({ name: "Alpha + Bravo", nameGenerated: true });
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

  it("tableau : réordonner les séances avec leurs points (recette du 19/11 au soir, q19-deplacement)", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    await renderPlanning({ date: START });
    await validateSelection([a.id, b.id]);
    fireEvent.press(screen.getByTestId("planning-column-2"));
    fireEvent.press(screen.getByTestId("planning-point-1-1"));
    expect(mention(1)).toBe("(1 fois sur 2)");
    fireEvent(screen.getByTestId("planning-row-0-handle"), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
    expect(within(screen.getByTestId("planning-row-0")).getByText("Bravo")).toBeTruthy();
    expect(mention(0)).toBe("(1 fois sur 2)");
    fireEvent.changeText(screen.getByTestId("planning-name"), "Ordre");
    await save();
    const [routine] = await planning.listRoutines();
    expect(routine?.entries.map((item) => item.sessionId)).toEqual([b.id, a.id]);
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

  it("occurrence seule depuis l'Agenda (D-536, point 4) : nom figé, sans répétition, seul le créneau ouvert se modifie, sans confirmation", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    const created = await planning.createRoutine({
      name: "Genou",
      startDate: START,
      time: "08:00",
      repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: "2030-08-26" } },
      entries: [
        { id: "ea", sessionId: a.id, frequency: { x: 1, n: 2, positions: [1] } },
        { id: "eb", sessionId: b.id, frequency: EVERY_TIME },
      ],
      reminderMinutes: null,
    });
    if (created.status !== "SAVED") throw new Error(created.status);
    // 12 août : deuxième occurrence, colonne #2 du cycle (Alpha n'y joue pas).
    await renderPlanning({ routineId: created.routine.id, occurrenceKey: "2030-08-12T08:00" });
    expect(screen.getByTestId("planning-name").props.editable).toBe(false);
    expect(screen.queryByTestId("planning-repetition")).toBeNull();
    expect(screen.getByTestId("planning-column-1-muted")).toBeTruthy();
    expect(screen.queryByTestId("planning-column-2-muted")).toBeNull();
    expect(screen.getByTestId("planning-point-0-1").props.accessibilityState).toMatchObject({ disabled: true });
    // Recette du 21/11/2026 (c22-6) : les lignes se réordonnent aussi pour un créneau seul.
    expect(screen.getByTestId("planning-row-0-handle")).toBeTruthy();
    // Activer Alpha dans ce créneau, puis désactiver Bravo.
    fireEvent.press(screen.getByTestId("planning-point-0-2"));
    fireEvent.press(screen.getByTestId("planning-point-1-2"));
    expect([played(0, 2), played(1, 2)]).toEqual([true, false]);
    fireEvent.press(screen.getByTestId("screen-header-validate"));
    await flush();
    expect(screen.queryByTestId("planning-modify-confirm")).toBeNull();
    const occurrences = await planning.rangeOccurrences("2030-08-01", "2030-08-31", () => true);
    expect(occurrences.map((occurrence) => occurrence.contents.map((content) => content.sessionId))).toEqual([[a.id, b.id], [a.id], [a.id, b.id], [b.id]]);
    // La routine elle-même est inchangée.
    expect((await planning.getRoutine(created.routine.id))?.entries.map((entry) => entry.frequency.positions)).toEqual([[1], [1]]);
  });

  // D-554 / RM-273 (DSF Plan § 7) : case vide du Plan — modale du créneau avec la date touchée et l'heure habituelle de la
  // routine ; parcours entier (rotation non appliquée) ; Enregistrer ajoute un créneau sans modifier la répétition.
  it("créneau ajouté depuis le Plan : date et heure pré-remplies, parcours entier, répétition inchangée (D-554)", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    const created = await planning.createRoutine({
      name: "Genou",
      startDate: START,
      time: "08:00",
      repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: "2030-08-26" } },
      entries: [
        { id: "ea", sessionId: a.id, frequency: { x: 1, n: 2, positions: [1] } },
        { id: "eb", sessionId: b.id, frequency: EVERY_TIME },
      ],
      reminderMinutes: null,
    });
    if (created.status !== "SAVED") throw new Error(created.status);
    await renderPlanning({ addTo: created.routine.id, date: "2030-08-07" });
    expect(screen.getByTestId("planning-start-date").props.accessibilityLabel).toContain("7");
    expect(screen.getByTestId("planning-start-time").props.accessibilityLabel).toContain("08:00");
    expect(screen.queryByTestId("planning-repetition")).toBeNull();
    expect(screen.getByTestId("planning-name").props.editable).toBe(false);
    expect([played(0, 1), played(1, 1)]).toEqual([true, true]);
    fireEvent.press(screen.getByTestId("screen-header-validate"));
    await flush();
    const routine = await planning.getRoutine(created.routine.id);
    expect(routine?.repetition).toEqual({ unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: "2030-08-26" } });
    expect(routine?.overrides).toMatchObject([{ key: "2030-08-07T08:00+A1", date: "2030-08-07", time: "08:00", sessions: null, added: true }]);
    const occurrences = await planning.rangeOccurrences("2030-08-07", "2030-08-07", () => true);
    expect(occurrences.map((occurrence) => occurrence.contents.map((content) => content.sessionId))).toEqual([[a.id, b.id]]);
  });

  // Recette du 21/11/2026 (c22-5, c22-6) : désactiver dans un créneau seul la seule pastille d'une séance reste enregistrable ;
  // l'ordre choisi est conservé pour ce créneau seulement, et relu à la réouverture.
  it("créneau seul : séance sans autre pastille désactivable, ordre conservé pour ce créneau (recette du 21/11/2026)", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const b = await sessions.createStructured(input("Bravo"));
    const c = await sessions.createStructured(input("Charlie"));
    const created = await planning.createRoutine({
      name: "Genou",
      startDate: START,
      time: "08:00",
      repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: "2030-08-26" } },
      entries: [
        { id: "ea", sessionId: a.id, frequency: { x: 1, n: 2, positions: [1] } },
        { id: "eb", sessionId: b.id, frequency: EVERY_TIME },
        { id: "ec", sessionId: c.id, frequency: EVERY_TIME },
      ],
      reminderMinutes: null,
    });
    if (created.status !== "SAVED") throw new Error(created.status);
    // 5 août : colonne #1, Alpha n'a de pastille que là.
    await renderPlanning({ routineId: created.routine.id, occurrenceKey: "2030-08-05T08:00" });
    fireEvent.press(screen.getByTestId("planning-point-0-1"));
    expect(played(0, 1)).toBe(false);
    expect(validateEnabled()).toBe(true);
    // Charlie remonte en tête (deux montées).
    fireEvent(screen.getByTestId("planning-row-2-handle"), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    fireEvent(screen.getByTestId("planning-row-1-handle"), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    await save();
    const occurrences = await planning.rangeOccurrences("2030-08-05", "2030-08-12", () => true);
    expect(occurrences.map((occurrence) => occurrence.contents.map((content) => content.sessionId))).toEqual([
      [c.id, b.id],
      [b.id, c.id],
    ]);
    // La routine est inchangée.
    expect((await planning.getRoutine(created.routine.id))?.entries.map((entry) => entry.id)).toEqual(["ea", "eb", "ec"]);
    // Réouverture : l'ordre du créneau est relu.
    screen.unmount();
    await renderPlanning({ routineId: created.routine.id, occurrenceKey: "2030-08-05T08:00" });
    expect(screen.getByTestId("planning-row-0-handle").props.accessibilityLabel).toContain("Charlie");
  });

  it("modification depuis le Journal sans changement : ni confirmation ni enregistrement (recette du 21/11/2026)", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const created = await planning.createRoutine({
      name: "Genou",
      startDate: START,
      time: "08:00",
      repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: "2030-08-26" } },
      entries: [{ id: "ea", sessionId: a.id, frequency: EVERY_TIME }],
      reminderMinutes: null,
    });
    if (created.status !== "SAVED") throw new Error(created.status);
    const before = (await planning.getRoutine(created.routine.id))?.updatedAt;
    await renderPlanning({ routineId: created.routine.id });
    fireEvent.press(screen.getByTestId("screen-header-validate"));
    await flush();
    expect(screen.queryByTestId("planning-modify-confirm")).toBeNull();
    expect((await planning.getRoutine(created.routine.id))?.updatedAt).toBe(before);
  });

  it("modification depuis le Journal : confirmation « N créneaux à venir seront modifiés. » (constat E du 20/11/2026)", async () => {
    const a = await sessions.createStructured(input("Alpha"));
    const created = await planning.createRoutine({
      name: "Genou",
      startDate: START,
      time: "08:00",
      repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: "2030-08-26" } },
      entries: [{ id: "ea", sessionId: a.id, frequency: EVERY_TIME }],
      reminderMinutes: null,
    });
    if (created.status !== "SAVED") throw new Error(created.status);
    await renderPlanning({ routineId: created.routine.id });
    // Recette du 21/11/2026 : la confirmation suit une modification réelle.
    fireEvent.changeText(screen.getByTestId("planning-name"), "Genou droit");
    fireEvent.press(screen.getByTestId("screen-header-validate"));
    await flush();
    expect(screen.getByText("4 créneaux à venir seront modifiés.")).toBeTruthy();
    fireEvent.press(screen.getByTestId("planning-modify-cancel"));
    await flush();
    expect(screen.queryByTestId("planning-modify-confirm")).toBeNull();
  });

  it("planification existante : nom vide à compléter (RM-264), « pendant » conservé, motifs n différents ramenés à un cycle commun (RM-263), retraits conservés", async () => {
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
    // Recette du 19/11/2026 (d4) : « pendant 6 semaines » reste une durée.
    expect(within(screen.getByTestId("planning-end-kind")).getByText("pendant")).toBeTruthy();
    expect(within(screen.getByTestId("planning-end-count")).getByText("6")).toBeTruthy();
    expect(screen.getByTestId("planning-column-6")).toBeTruthy();
    expect(mention(0)).toBe("(à chaque fois)");
    expect(mention(1)).toBe("(4 fois sur 6)");
    fireEvent.changeText(screen.getByTestId("planning-name"), "Ancienne");
    await save();
    const routine = await planning.getRoutine("legacy");
    expect(routine).toMatchObject({ name: "Ancienne", exclusions: ["2030-08-12T08:00"] });
    expect(routine?.repetition?.end).toEqual({ kind: "FOR", count: 6 });
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

  it("rappel sans interrupteur : Sans / 15' / 30' / 1h / Autre ; « Autre » ouvre la roulette native heures / minutes avec ses unités (D-524, recette du 19/11 k13)", async () => {
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
    // Recette du 19/11/2026 (k13, e2) : unités à droite des roues ; ni titre ni bouton.
    expect(screen.getByTestId("planning-reminder-hours-unit").props.text).toBe("heures");
    expect(screen.getByTestId("planning-reminder-minutes-unit").props.text).toBe("minutes");
    expect(within(panel).queryByText(/Rappel|Valider|Annuler/)).toBeNull();
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

  it("notifications jamais demandées : la demande système a lieu au choix d'un délai ; refusée, le rappel reste « Sans » sans texte (RM-052, RM-053)", async () => {
    permission = "undetermined";
    const created = await sessions.createStructured(input("Gainage"));
    await renderPlanning({ sessionId: created.id, date: START });
    expect(screen.getByTestId("planning-reminder-options-NONE").props.accessibilityState.selected).toBe(true);
    const alert = jest.spyOn(Alert, "alert");
    fireEvent.press(screen.getByText("30’"));
    await flush();
    expect(alert).not.toHaveBeenCalled();
    expect(screen.getByTestId("planning-reminder-options-NONE").props.accessibilityState.selected).toBe(true);
    expect(screen.queryByTestId("planning-reminder-denied")).toBeNull();
    await save();
    const [routine] = await planning.listRoutines();
    expect(routine?.reminderMinutes).toBeNull();
  });

  it("notifications refusées : choisir un délai ouvre le message natif ; « Autoriser » mène à Réglages et le délai s'applique au retour (recette du 19/11, k14)", async () => {
    permission = "denied";
    const listeners: ((state: string) => void)[] = [];
    jest.spyOn(AppState, "addEventListener").mockImplementation(((_type: string, listener: (state: string) => void) => {
      listeners.push(listener);
      return { remove: () => undefined };
    }) as never);
    const openSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue(undefined);
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const created = await sessions.createStructured(input("Gainage"));
    await renderPlanning({ sessionId: created.id, date: START });
    fireEvent.press(screen.getByText("30’"));
    await flush();
    expect(alert).toHaveBeenCalledWith("Notifications désactivées", expect.any(String), expect.any(Array));
    expect(screen.getByTestId("planning-reminder-options-NONE").props.accessibilityState.selected).toBe(true);
    expect(screen.queryByTestId("planning-reminder-denied")).toBeNull();
    const buttons = alert.mock.calls[0]![2] as { text: string; onPress?: () => void }[];
    act(() => buttons.find((button) => button.text === "Autoriser")!.onPress!());
    expect(openSettings).toHaveBeenCalled();
    permission = "granted";
    act(() => listeners.forEach((listener) => listener("active")));
    await flush();
    expect(screen.getByTestId("planning-reminder-options-30").props.accessibilityState.selected).toBe(true);
  });

  it("notifications retirées dans Réglages : un rappel enregistré revient à « Sans », sans texte sous la carte (e3, k14)", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    const saved = await planning.createRoutine({ name: "Gainage", startDate: START, time: "08:00", repetition: null, entries: [{ id: "e1", sessionId: created.id, frequency: EVERY_TIME }], reminderMinutes: 15 });
    if (saved.status !== "SAVED") throw new Error("setup");
    permission = "denied";
    await renderPlanning({ routineId: saved.routine.id });
    expect(screen.getByTestId("planning-reminder-options-NONE").props.accessibilityState.selected).toBe(true);
    expect(screen.queryByTestId("planning-reminder-denied")).toBeNull();
  });

  it("date et heure : popovers natifs sans titre ni bouton, fermés par le voile ; calendrier en apparence claire ; valeurs en bleu KODJO (recette du 19/11, k8, k19)", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    await renderPlanning({ sessionId: created.id, date: START });
    // k8 : date et heure dans le style des autres valeurs (bleu KODJO).
    const valueColor = (testID: string) => within(screen.getByTestId(testID)).getByText(/./).props.style.color;
    expect(valueColor("planning-start-time")).toBe(valueColor("planning-repetition-kind"));
    fireEvent.press(screen.getByTestId("planning-start-time"));
    expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();
    expect(screen.UNSAFE_queryAllByType(DurationWheelPicker)).toHaveLength(0);
    expect(screen.getByTestId("planning-time-hours-unit").props.text).toBe("heures");
    turnWheel("planning-time-hours", 9);
    turnWheel("planning-time-minutes", 30);
    expect(within(screen.getByTestId("planning-start-time")).getByText("09:30")).toBeTruthy();
    expect(within(screen.getByTestId("planning-time-popover-panel")).queryByText(/Heure|Valider|Annuler/)).toBeNull();
    fireEvent.press(screen.getByTestId("planning-time-popover-scrim", { includeHiddenElements: true }));
    expect(screen.queryByTestId("planning-time-hours")).toBeNull();
    fireEvent.press(screen.getByTestId("planning-start-date"));
    const panel = screen.getByTestId("planning-date-panel");
    expect(panel.findAll((node) => node.props.colorScheme === "light").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("planning-date-panel-validate")).toBeNull();
    const calendar = panel.findAll((node) => typeof node.props.onDateChange === "function")[0]!;
    act(() => calendar.props.onDateChange(new Date(2030, 7, 7, 12, 0)));
    expect(synthesis()).toContain("le 7 août 2030, à 9h30");
    fireEvent.press(screen.getByTestId("planning-date-popover-scrim", { includeHiddenElements: true }));
    expect(screen.queryByTestId("planning-date-panel")).toBeNull();
  });

  it("borne « pendant » rétablie pour l'unité semaines : bascule avec « jusqu'au », conversion, roulette du nombre de semaines (recette du 19/11, d4)", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    await renderPlanning({ sessionId: created.id, date: START });
    fireEvent.press(screen.getByTestId("planning-repetition-kind"));
    expect(within(screen.getByTestId("planning-end-kind")).getByText("jusqu’au")).toBeTruthy();
    fireEvent.press(screen.getByTestId("planning-end-kind"));
    // Lundi 5 août → 2 septembre 2030 : 5 semaines civiles.
    expect(within(screen.getByTestId("planning-end-count")).getByText("5")).toBeTruthy();
    expect(synthesis()).toContain("pendant 5 semaines");
    fireEvent.press(screen.getByTestId("planning-end-count"));
    expect(screen.getByTestId("planning-end-count-wheel").props.selection).toBe(5);
    turnWheel("planning-end-count-wheel", 3);
    fireEvent.press(screen.getByTestId("planning-end-count-popover-scrim", { includeHiddenElements: true }));
    expect(synthesis()).toContain("pendant 3 semaines");
    // Retour à « jusqu'au » : dimanche de la 3e semaine.
    fireEvent.press(screen.getByTestId("planning-end-kind"));
    expect(synthesis()).toContain("jusqu’au 25 août 2030");
    fireEvent.press(screen.getByTestId("planning-end-kind"));
    // Unité jours : la borne reste « pendant », recomptée en jours (5 → 25 août : 21 jours) ; retour aux semaines : 3.
    fireEvent.press(screen.getByTestId("planning-unit"));
    expect(within(screen.getByTestId("planning-end-kind")).getByText("pendant")).toBeTruthy();
    expect(within(screen.getByTestId("planning-end-count")).getByText("21")).toBeTruthy();
    expect(synthesis()).toContain("pendant 21 jours");
    fireEvent.press(screen.getByTestId("planning-unit"));
    expect(synthesis()).toContain("pendant 3 semaines");
    await save();
    const [routine] = await planning.listRoutines();
    expect(routine?.repetition?.end).toEqual({ kind: "FOR", count: 3 });
  });

  it("unité jours : « pendant » N jours disponible, bascule avec « jusqu'au », enregistré (recette du 19/11 au soir)", async () => {
    const created = await sessions.createStructured(input("Gainage"));
    await renderPlanning({ sessionId: created.id, date: START });
    fireEvent.press(screen.getByTestId("planning-repetition-kind"));
    fireEvent.press(screen.getByTestId("planning-unit"));
    expect(within(screen.getByTestId("planning-unit")).getByText("jour")).toBeTruthy();
    expect(within(screen.getByTestId("planning-end-kind")).getByText("jusqu’au")).toBeTruthy();
    fireEvent.press(screen.getByTestId("planning-end-kind"));
    // Lundi 5 août → 2 septembre 2030 inclus : 29 jours.
    expect(within(screen.getByTestId("planning-end-count")).getByText("29")).toBeTruthy();
    fireEvent.press(screen.getByTestId("planning-end-count"));
    turnWheel("planning-end-count-wheel", 10);
    fireEvent.press(screen.getByTestId("planning-end-count-popover-scrim", { includeHiddenElements: true }));
    expect(synthesis()).toContain("pendant 10 jours");
    // Retour à « jusqu'au » : 10e jour depuis le 5 août compris.
    fireEvent.press(screen.getByTestId("planning-end-kind"));
    expect(synthesis()).toContain("jusqu’au 14 août 2030");
    fireEvent.press(screen.getByTestId("planning-end-kind"));
    await save();
    const [routine] = await planning.listRoutines();
    expect(routine?.repetition).toMatchObject({ unit: "DAY", end: { kind: "FOR", count: 10 } });
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
    // D-553 : le nom généré suit la composition. [Nom vidé à plusieurs séances (RM-258) — remplacé.]
    expect(screen.getByTestId("planning-name").props.value).toBe("Alpha + Bravo");
  });

  it("fermer la sélection initiale sans contenu ferme Planifier sans rien écrire", async () => {
    await sessions.createStructured(input("Alpha"));
    await renderPlanning({ date: START });
    fireEvent.press(screen.getByTestId("screen-header-back"));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(await planning.listRoutines()).toEqual([]);
  });
});
