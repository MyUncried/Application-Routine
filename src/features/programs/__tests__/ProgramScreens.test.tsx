import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useState } from "react";
import { View } from "react-native";

import { EVERY_TIME, type RoutineDraft } from "@/domain/planning/Routine";
import type { ProgramDraft, ProgramStatus } from "@/domain/programs/Program";
import { PlanningService } from "@/features/planning/PlanningService";
import { ProgramCatalogueBody, ProgramContext, programSwipeActions, useProgramSummaries } from "@/features/programs/ProgramCatalogue";
import { programCounts, visiblePrograms } from "@/features/programs/programPresentation";
import { PrivacyScreen } from "@/features/programs/PrivacyScreen";
import { ProgramService } from "@/features/programs/ProgramService";
import { ProgramServiceContext } from "@/features/programs/ProgramServiceContext";
import { ProgramSheetScreen } from "@/features/programs/ProgramSheetScreen";
import { JournalRoutineCard } from "@/features/planning/JournalRoutineCard";
import { DateCalendar, Pill, PillFace } from "@/features/planning/PlanningControls";
import { DatePicker } from "@expo/ui/swift-ui";
import * as relay from "@/features/programs/programSheetRelay";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteExecutionRepository } from "@/infrastructure/database/repositories/SqliteExecutionRepository";
import { SqliteOccurrenceExecutionRepository } from "@/infrastructure/database/repositories/SqliteOccurrenceExecutionRepository";
import { SqliteProgramRepository } from "@/infrastructure/database/repositories/SqliteProgramRepository";
import { SqliteRoutineRepository } from "@/infrastructure/database/repositories/SqliteRoutineRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import type { EngineState } from "@/domain/execution/kernel";

/**
 * PROG-CAT-01 — rendu des écrans par rapport aux contrats CE-PROG-01 à 03 et CE-PRF-01, sur SQLite réelle. Jest n'exerce
 * ni la mise en page ni le geste de glissement : recette sur iPhone nécessaire.
 */

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockNavigate = jest.fn();
const focusEffects: (() => (() => void) | void)[] = [];
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useFocusEffect: (effect: () => (() => void) | void) => {
      focusEffects.push(effect);
    },
    useRouter: () => ({ push: mockPush, back: mockBack, navigate: mockNavigate, canGoBack: () => true }),
  };
});

let database: NodeSqliteDatabase;
let planning: PlanningService;
let programs: ProgramService;
let ids = 0;
const NOW = new Date(2030, 7, 10, 12, 0);

const routineDraft = (patch: Partial<RoutineDraft> = {}): RoutineDraft => ({
  name: "Routine du soir",
  startDate: "2030-08-05",
  time: "14:00",
  repetition: { unit: "DAY", every: 1, weekdays: [], end: { kind: "UNTIL", date: "2030-08-29" } },
  entries: [
    { id: `e-${++ids}`, sessionId: "s-a", frequency: EVERY_TIME },
    { id: `e-${++ids}`, sessionId: "s-b", frequency: EVERY_TIME },
  ],
  reminderMinutes: null,
  ...patch,
});

const programDraft = (patch: Partial<ProgramDraft> = {}): ProgramDraft => ({
  name: "Rééducation genou",
  objective: "Retrouver mobilité",
  startDate: "2030-08-01",
  endDate: "2030-09-30",
  painTracking: false,
  ...patch,
});

async function createProgram(patch: Partial<ProgramDraft> = {}) {
  const result = await programs.createProgram(programDraft(patch));
  if (result.status !== "SAVED") throw new Error(result.status);
  return result.program;
}

async function flush() {
  await act(async () => {
    for (let index = 0; index < 8; index += 1) await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function runFocus() {
  await act(async () => {
    for (const effect of focusEffects.splice(0)) effect();
  });
  await flush();
}

beforeEach(async () => {
  mockPush.mockClear();
  mockBack.mockClear();
  mockNavigate.mockClear();
  focusEffects.length = 0;
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const occurrenceExecutions = new SqliteOccurrenceExecutionRepository(database);
  planning = new PlanningService({
    repository: new SqliteRoutineRepository(database),
    newId: () => `r-${++ids}`,
    now: () => NOW,
    occurrenceExecutions: () => occurrenceExecutions.list(),
  });
  programs = new ProgramService({ repository: new SqliteProgramRepository(database), planning, newId: () => `p-${++ids}`, now: () => NOW });
});

afterEach(() => {
  database.close();
});

/** Segment Programmes tel que `CatalogueScreen` l'assemble (zone de contexte et corps). */
function CatalogueHarness() {
  const catalogue = useProgramSummaries(programs);
  const [status, setStatus] = useState<ProgramStatus>("ACTIVE");
  const [query, setQuery] = useState("");
  const today = programs.today();
  const [loaded, setLoaded] = useState(false);
  if (!loaded) {
    setLoaded(true);
    catalogue.reload();
  }
  return (
    <View>
      <ProgramContext
        status={status}
        onChangeStatus={setStatus}
        counts={catalogue.summaries === null ? null : programCounts(catalogue.summaries.map((item) => item.program), today)}
        query={query}
        onChangeQuery={setQuery}
        onCreate={() => mockPush("/program-sheet")}
      />
      <ProgramCatalogueBody
        service={programs}
        summaries={catalogue.summaries}
        visible={catalogue.summaries === null ? [] : visiblePrograms(catalogue.summaries, status, query, today)}
        failed={catalogue.failed}
        today={today}
        topInset={0}
        bottomInset={0}
        onOpen={(programId) => mockPush({ pathname: "/program-sheet", params: { programId } })}
        onDuplicate={(programId) => mockPush({ pathname: "/program-sheet", params: { duplicateOf: programId } })}
        onChanged={catalogue.reload}
        onRetry={catalogue.reload}
      />
    </View>
  );
}

const withService = (children: React.ReactNode) => (
  <TestSafeAreaProvider>
    <ProgramServiceContext.Provider value={programs}>{children}</ProgramServiceContext.Provider>
  </TestSafeAreaProvider>
);

describe("CE-PROG-01 — catalogue des programmes", () => {
  it("état vide : « Actifs 0 · Terminés 0 », contrôles visibles, texte d'état vide", async () => {
    render(withService(<CatalogueHarness />));
    await flush();
    expect(screen.getByTestId("program-status-ACTIVE-count").props.children).toBe("0");
    expect(screen.getByTestId("program-status-TERMINATED-count").props.children).toBe("0");
    expect(screen.getByTestId("program-catalogue-search")).toBeTruthy();
    expect(screen.getByTestId("program-filter-action")).toBeTruthy();
    expect(screen.getByTestId("catalogue-sort-action")).toBeTruthy();
    expect(screen.getByTestId("program-catalogue-empty")).toBeTruthy();
    fireEvent.press(screen.getByTestId("catalogue-create-action"));
    expect(mockPush).toHaveBeenCalledWith("/program-sheet");
  });

  it("liste des actifs par défaut, aucun terminé ; cartes « période · statut » et « N planifications · N séances »", async () => {
    const active = await createProgram();
    const finished = await createProgram({ name: "Ancien", startDate: "2030-06-01", endDate: "2030-07-31" });
    await planning.createRoutine({ ...routineDraft(), programId: active.id });
    render(withService(<CatalogueHarness />));
    await flush();
    expect(screen.getByTestId("program-status-ACTIVE").props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId(`program-card-${active.id}-status`).props.children).toBe("1er août – 30 sept.   ·   En cours");
    expect(screen.getByTestId(`program-card-${active.id}-counts`).props.children).toBe("1 planification   ·   2 séances");
    expect(screen.queryByTestId(`program-card-${finished.id}`)).toBeNull();
    fireEvent.press(screen.getByTestId("program-status-TERMINATED"));
    expect(screen.getByTestId(`program-card-${finished.id}`)).toBeTruthy();
    expect(screen.queryByTestId(`program-card-${active.id}`)).toBeNull();
  });

  it("actions glissées dans l'ordre : Enregistrer comme modèle (grisé, inactif), Dupliquer, Supprimer ; aucune action Archiver", async () => {
    const program = await createProgram();
    render(withService(<CatalogueHarness />));
    await flush();
    const actions = programSwipeActions({ onDuplicate: () => undefined, onDelete: () => undefined });
    expect(actions.map((action) => [action.key, action.label, action.backgroundColor, action.disabled === true])).toEqual([
      ["template", "Enregistrer comme modèle", "#5F60EE", true],
      ["duplicate", "Dupliquer", "#8C8C94", false],
      ["delete", "Supprimer", "#D92D20", false],
    ]);
    // L'action grisée n'est pas proposée à VoiceOver ; les deux autres le sont, dans l'ordre.
    const card = screen.getByTestId(`program-item-${program.id}-swipe-card`);
    expect(card.props.accessibilityActions.map((action: { name: string }) => action.name)).toEqual(["duplicate", "delete"]);
    fireEvent(card, "accessibilityAction", { nativeEvent: { actionName: "duplicate" } });
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/program-sheet", params: { duplicateOf: program.id } });
  });

  it("CE-PROG-03 : sans créneau à venir, pas de « Garder les routines » ; Supprimer avec ses routines supprime", async () => {
    const program = await createProgram();
    render(withService(<CatalogueHarness />));
    await flush();
    fireEvent(screen.getByTestId(`program-item-${program.id}-swipe-card`), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    await flush();
    expect(screen.getByText("Supprimer ce programme")).toBeTruthy();
    expect(screen.getByText("Le programme sera supprimé.")).toBeTruthy();
    expect(screen.queryByTestId("program-delete-secondary")).toBeNull();
    expect(screen.getByTestId("program-delete-cancel")).toBeTruthy();
    fireEvent.press(screen.getByTestId("program-delete-confirm"));
    await flush();
    expect(await programs.getProgram(program.id)).toBeNull();
    expect(screen.getByTestId("program-catalogue-empty")).toBeTruthy();
  });

  it("CE-PROG-03 : avec historique et créneaux à venir, message, bouton violet ; Garder détache les routines", async () => {
    const program = await createProgram();
    const created = await planning.createRoutine({ ...routineDraft(), programId: program.id });
    if (created.status !== "SAVED") throw new Error(created.status);
    await new SqliteExecutionRepository(database).create(
      {
        id: "x1",
        origin: "SESSION",
        sessionId: null,
        snapshotJson: "{}",
        snapshotVersion: 1,
        planVersion: 1,
        engineVersion: 1,
        state: { status: "RUNNING" } as unknown as EngineState,
        startedAt: "2030-08-05T14:00:00.000Z",
        clockWallMs: 0,
        occurrence: { routineId: created.routine.id, occurrenceKey: "2030-08-05T14:00", rank: 1 },
      },
      [],
    );
    render(withService(<CatalogueHarness />));
    await flush();
    fireEvent(screen.getByTestId(`program-item-${program.id}-swipe-card`), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    await flush();
    // 25 créneaux du 5 au 29 août, un commencé.
    expect(screen.getByText("24 créneaux non commencés seront supprimés. Le programme sera terminé.")).toBeTruthy();
    expect(screen.getByText("Garder les routines dans le calendrier")).toBeTruthy();
    fireEvent.press(screen.getByTestId("program-delete-secondary"));
    await flush();
    expect((await programs.getProgram(program.id))?.terminatedAt).not.toBeNull();
    expect((await planning.getRoutine(created.routine.id))?.programId).toBeUndefined();
    expect(screen.queryByTestId(`program-card-${program.id}`)).toBeNull();
    expect(screen.getByTestId("program-status-TERMINATED-count").props.children).toBe("1");
  });
});

describe("CE-PROG-02 — créer ou configurer un programme", () => {
  it("création : « Créer un programme » (contre-recette du 23/11, m), coche inactive tant que nom et période manquent ; rien d'interdit dans la modale", async () => {
    render(withService(<ProgramSheetScreen params={{}} />));
    await runFocus();
    expect(screen.getByText("Créer un programme")).toBeTruthy();
    expect(screen.queryByText("Nouveau programme")).toBeNull();
    expect(screen.getByLabelText("Enregistrer le programme").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByText("Planifications")).toBeTruthy();
    expect(screen.getByText("+ Planifier une séance")).toBeTruthy();
    expect(screen.getByText("Rattacher une routine existante")).toBeTruthy();
    expect(screen.getByTestId("program-pain-switch").props.value).toBe(false);
    for (const absent of ["Enregistrer comme modèle", "Dupliquer", "Indicateurs", "Personnes"]) expect(screen.queryByText(absent)).toBeNull();
    fireEvent.changeText(screen.getByTestId("program-name"), "Genou");
    expect(screen.getByLabelText("Enregistrer le programme").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("configuration : titre « Modifier le programme » (contre-recette du 23/11, m) ; période « Du … au … » ; routines au format du Journal, « N créneaux, jusqu'au … » (D-544, lot 5) ; glisser retire sans supprimer", async () => {
    const program = await createProgram();
    const created = await planning.createRoutine({ ...routineDraft(), programId: program.id });
    if (created.status !== "SAVED") throw new Error(created.status);
    render(withService(<ProgramSheetScreen params={{ programId: program.id }} />));
    await flush();
    await runFocus();
    expect(screen.getByText("Modifier le programme")).toBeTruthy();
    expect(screen.getByTestId("program-name").props.value).toBe("Rééducation genou");
    expect(screen.getByText("1er août 2030")).toBeTruthy();
    expect(screen.getByText("30 sept. 2030")).toBeTruthy();
    expect(screen.getByText("25 créneaux, jusqu’au 29 août")).toBeTruthy();
    expect(screen.getByLabelText("Enregistrer le programme").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent(screen.getByTestId(`program-routine-${created.routine.id}-swipe-card`), "accessibilityAction", { nativeEvent: { actionName: "detach" } });
    await flush();
    // Recette du 23/11/2026 (p4-croix) : le retrait n'est écrit qu'à la coche.
    expect(screen.queryByText("25 créneaux, jusqu’au 29 août")).toBeNull();
    expect((await planning.getRoutine(created.routine.id))?.programId).toBe(program.id);
    fireEvent.press(screen.getByTestId("program-plan"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/planning", params: { programId: program.id } });
    fireEvent.press(screen.getByLabelText("Enregistrer le programme"));
    await flush();
    expect((await planning.getRoutine(created.routine.id))?.programId).toBeUndefined();
  });

  it("p4-croix : la croix annule tout — retrait non écrit, routine planifiée depuis la modale supprimée", async () => {
    const program = await createProgram();
    const kept = await planning.createRoutine({ ...routineDraft(), programId: program.id });
    if (kept.status !== "SAVED") throw new Error(kept.status);
    const view = render(withService(<ProgramSheetScreen params={{ programId: program.id }} />));
    await flush();
    await runFocus();
    fireEvent(screen.getByTestId(`program-routine-${kept.routine.id}-swipe-card`), "accessibilityAction", { nativeEvent: { actionName: "detach" } });
    fireEvent.press(screen.getByTestId("program-plan"));
    // Retour de la planification : une routine du programme a été créée.
    const planned = await planning.createRoutine({ ...routineDraft({ name: "Planifiée" }), programId: program.id });
    if (planned.status !== "SAVED") throw new Error(planned.status);
    await runFocus();
    fireEvent.press(screen.getByLabelText("Fermer sans enregistrer"));
    view.unmount();
    await flush();
    expect(await planning.getRoutine(planned.routine.id)).toBeNull();
    expect((await planning.getRoutine(kept.routine.id))?.programId).toBe(program.id);
    expect(await programs.getProgram(program.id)).not.toBeNull();
  });

  it("p4-rattacher : plusieurs routines rendues par la feuille, écrites à la coche ; « Supprimer » retire les créneaux hors période (D-566)", async () => {
    const requests: relay.ProgramSheetRequest[] = [];
    const spy = jest.spyOn(relay, "requestProgramSheet").mockImplementation((request) => {
      requests.push(request);
    });
    const program = await createProgram();
    const first = await planning.createRoutine(routineDraft({ name: "Hanche" }));
    const second = await planning.createRoutine(
      routineDraft({ name: "Dos", repetition: { unit: "DAY", every: 1, weekdays: [], end: { kind: "UNTIL", date: "2030-10-10" } } }),
    );
    if (first.status !== "SAVED" || second.status !== "SAVED") throw new Error("routine");
    render(withService(<ProgramSheetScreen params={{ programId: program.id }} />));
    await flush();
    await runFocus();
    fireEvent.press(screen.getByTestId("program-attach"));
    expect(mockPush).toHaveBeenCalledWith("/program-attach");
    const request = requests[0];
    if (request?.kind !== "attach") throw new Error("attach");
    expect(request.period).toEqual({ start: "2030-08-01", end: "2030-09-30" });
    act(() =>
      request.onAttach([
        { routine: first.routine, removeOutside: false },
        { routine: second.routine, removeOutside: true },
      ]),
    );
    await flush();
    expect(screen.getByText("Hanche")).toBeTruthy();
    expect(screen.getByText("Dos")).toBeTruthy();
    expect((await planning.getRoutine(first.routine.id))?.programId).toBeUndefined();
    fireEvent.press(screen.getByLabelText("Enregistrer le programme"));
    await flush();
    expect((await planning.getRoutine(first.routine.id))?.programId).toBe(program.id);
    expect((await planning.getRoutine(second.routine.id))?.programId).toBe(program.id);
    // Du 1er au 10 octobre : dix créneaux à venir hors période, supprimés.
    const counts = await planning.periodSlotCountsFor([(await planning.getRoutine(second.routine.id))!], "2030-08-01", "2030-09-30");
    expect(counts.get(second.routine.id)?.outside).toBe(0);
    spy.mockRestore();
  });

  it("la coche enregistre ; la croix ferme sans enregistrer", async () => {
    const program = await createProgram();
    render(withService(<ProgramSheetScreen params={{ programId: program.id }} />));
    await flush();
    fireEvent.changeText(screen.getByTestId("program-name"), "Genou 2");
    fireEvent.press(screen.getByLabelText("Fermer sans enregistrer"));
    expect((await programs.getProgram(program.id))?.name).toBe("Rééducation genou");
    fireEvent.press(screen.getByLabelText("Enregistrer le programme"));
    await flush();
    expect((await programs.getProgram(program.id))?.name).toBe("Genou 2");
    expect(mockBack).toHaveBeenCalled();
  });

  it("Dupliquer : copie sans dates (coche inactive), nom « (copie) », suivi repris", async () => {
    const program = await createProgram({ painTracking: true });
    render(withService(<ProgramSheetScreen params={{ duplicateOf: program.id }} />));
    await flush();
    expect(screen.getByTestId("program-name").props.value).toBe("Rééducation genou (copie)");
    expect(screen.getAllByText("Choisir")).toHaveLength(2);
    expect(screen.getByTestId("program-pain-switch").props.value).toBe(true);
    expect(screen.getByLabelText("Enregistrer le programme").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("suivi de la douleur sans accord : fenêtre de consentement dans la modale (contre-recette du 23/11, a) ; Annuler laisse désactivé, Autoriser active", async () => {
    const program = await createProgram();
    render(withService(<ProgramSheetScreen params={{ programId: program.id }} />));
    await flush();
    fireEvent(screen.getByTestId("program-pain-switch"), "valueChange", true);
    await flush();
    // La modale du programme reste ouverte : aucune feuille poussée, fenêtre centrée sur le voile partagé.
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.getByTestId("wheel-picker-overlay")).toBeTruthy();
    expect(screen.getByTestId("pain-consent")).toBeTruthy();
    fireEvent.press(screen.getByTestId("pain-consent-cancel"));
    await flush();
    expect(screen.queryByTestId("pain-consent")).toBeNull();
    expect(screen.getByTestId("program-pain-switch").props.value).toBe(false);
    expect(await programs.painConsentAt()).toBeNull();
    fireEvent(screen.getByTestId("program-pain-switch"), "valueChange", true);
    await flush();
    fireEvent.press(screen.getByTestId("pain-consent-allow"));
    await flush();
    expect(screen.queryByTestId("pain-consent")).toBeNull();
    expect(screen.getByTestId("program-pain-switch").props.value).toBe(true);
    expect(await programs.painConsentAt()).toBe(NOW.toISOString());
    // Accord déjà donné : les activations suivantes ne redemandent rien.
    fireEvent(screen.getByTestId("program-pain-switch"), "valueChange", false);
    fireEvent(screen.getByTestId("program-pain-switch"), "valueChange", true);
    await flush();
    expect(screen.queryByTestId("pain-consent")).toBeNull();
    expect(screen.getByTestId("program-pain-switch").props.value).toBe(true);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("contre-recette du 23/11 (l) : toucher la ligne d'une routine l'ouvre en modification ; une routine rattachée dans la modale est relue au retour", async () => {
    const requests: relay.ProgramSheetRequest[] = [];
    const spy = jest.spyOn(relay, "requestProgramSheet").mockImplementation((request) => {
      requests.push(request);
    });
    const program = await createProgram();
    const own = await planning.createRoutine({ ...routineDraft({ name: "Genou" }), programId: program.id });
    const free = await planning.createRoutine(routineDraft({ name: "Hanche" }));
    if (own.status !== "SAVED" || free.status !== "SAVED") throw new Error("routine");
    const view = render(withService(<ProgramSheetScreen params={{ programId: program.id }} />));
    await flush();
    await runFocus();
    fireEvent.press(screen.getByTestId(`program-routine-${own.routine.id}-swipe-card`));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/planning", params: { routineId: own.routine.id } });
    // Rattachée dans la modale (non enregistrée), puis modifiée depuis sa ligne : le nouveau nom s'affiche au retour.
    fireEvent.press(screen.getByTestId("program-attach"));
    const request = requests[0];
    if (request?.kind !== "attach") throw new Error("attach");
    act(() => request.onAttach([{ routine: free.routine, removeOutside: false }]));
    await flush();
    fireEvent.press(screen.getByTestId(`program-routine-${free.routine.id}-swipe-card`));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/planning", params: { routineId: free.routine.id } });
    const edited = await planning.updateRoutine(free.routine.id, routineDraft({ name: "Hanche droite" }));
    if (edited.status !== "SAVED") throw new Error(edited.status);
    await runFocus();
    expect(screen.getByText("Hanche droite")).toBeTruthy();
    // La croix n'annule pas une modification enregistrée par la planification ; seules les routines planifiées depuis la modale
    // sont supprimées (p4-croix).
    fireEvent.press(screen.getByLabelText("Fermer sans enregistrer"));
    view.unmount();
    await flush();
    expect((await planning.getRoutine(free.routine.id))?.name).toBe("Hanche droite");
    expect(await planning.getRoutine(own.routine.id)).not.toBeNull();
    spy.mockRestore();
  });
});

/** Lot 4 du 23/11/2026, chantier A : D-544 (routines au format du Journal), D-543 (période), x5 (fenêtre de consentement). */
describe("Lot 4 — modale du programme", () => {
  // Lot 5, 23/11/2026 (y4) : « au » / « pendant » et l'unité sont des `Pill` de la planification qui basculent d'un toucher.
  const toggleMode = () => fireEvent.press(screen.getByTestId("program-period-mode"));
  // Lot 5 bis : l'unité garde son menu natif (Hermann : « il ne faut pas changer le popover ») ; l'option se touche dans le menu.
  const chooseUnit = (unit: string) => act(() => screen.UNSAFE_getByProps({ testID: `program-period-unit-option-${unit}` }).props.onPress());

  it("D-544 (lot 5, point 4) : ligne du Journal (JournalRoutineCard compacte) — cadre = début dans le programme, « N créneaux, jusqu'au … » borné par la fin du programme", async () => {
    const program = await createProgram();
    const created = await planning.createRoutine({ ...routineDraft(), programId: program.id });
    if (created.status !== "SAVED") throw new Error(created.status);
    render(withService(<ProgramSheetScreen params={{ programId: program.id }} />));
    await flush();
    await runFocus();
    const cards = screen.UNSAFE_getAllByType(JournalRoutineCard);
    expect(cards).toHaveLength(1);
    expect(cards[0]!.props.compact).toBe(true);
    expect(cards[0]!.props.planned).toBe(true);
    const id = `program-routine-${created.routine.id}`;
    // Cadre : début de la routine (5 août), postérieur au début du programme (1er août) — jour et mois abrégé, année dessous.
    expect(screen.getByTestId(`${id}-date`).props.children).toBe("5 août");
    expect(screen.getByTestId(`${id}-year`).props.children).toBe("2030");
    expect(screen.getByTestId(`${id}-name`).props.children).toBe("Routine du soir");
    expect(screen.getByTestId(`${id}-slots`).props.children).toBe("25 créneaux, jusqu’au 29 août");
    expect(screen.queryByText(/14 h/)).toBeNull();
  });

  it("D-544 (lot 5, point 4) : routine débordant la période — cadre ramené au début du programme, créneaux et fin bornés par la période", async () => {
    const program = await createProgram({ startDate: "2030-08-10", endDate: "2030-08-20" });
    const created = await planning.createRoutine({ ...routineDraft(), programId: program.id });
    if (created.status !== "SAVED") throw new Error(created.status);
    render(withService(<ProgramSheetScreen params={{ programId: program.id }} />));
    await flush();
    await runFocus();
    const id = `program-routine-${created.routine.id}`;
    expect(screen.getByTestId(`${id}-date`).props.children).toBe("10 août");
    // Tous les jours du 10 au 20 août : 11 créneaux ; la fin affichée est celle du programme, pas le 29 août.
    expect(screen.getByTestId(`${id}-slots`).props.children).toBe("11 créneaux, jusqu’au 20 août");
  });

  it("lot 5 (calendrier) : la période utilise le calendrier de la planification (DateCalendar, DatePicker graphique, 360), sans marquage de période ; il reste ouvert après un choix", async () => {
    jest.spyOn(View.prototype as unknown as { measureInWindow: () => void }, "measureInWindow").mockImplementation((...args: unknown[]) => {
      (args[0] as (x: number, y: number, width: number, height: number) => void)(100, 300, 40, 32);
    });
    const program = await createProgram({ startDate: "2030-09-15", endDate: "2030-12-15" });
    render(withService(<ProgramSheetScreen params={{ programId: program.id }} />));
    await flush();
    fireEvent.press(screen.getByTestId("program-start-date"));
    expect(screen.UNSAFE_getAllByType(DateCalendar)).toHaveLength(1);
    expect(screen.UNSAFE_root.findAll((node) => node.props.testID === "program-date-popover" && node.props.width === 360).length).toBeGreaterThan(0);
    const panel = screen.getByTestId("program-date-panel");
    expect(panel.findAll((node) => node.props.colorScheme === "light").length).toBeGreaterThan(0);
    let picker = screen.UNSAFE_getByType(DatePicker);
    // Début : aucune borne basse.
    expect(picker.props.range).toBeUndefined();
    // Début après la fin : la fin est ramenée au début (D-499) ; le calendrier reste ouvert.
    act(() => picker.props.onDateChange(new Date(2030, 11, 20, 12, 0)));
    expect(screen.getByTestId("program-date-panel")).toBeTruthy();
    expect(within(screen.getByTestId("program-start-date")).getByText("20 déc. 2030")).toBeTruthy();
    expect(within(screen.getByTestId("program-end-date")).getByText("20 déc. 2030")).toBeTruthy();
    fireEvent.press(screen.getByTestId("program-date-popover-scrim", { includeHiddenElements: true }));
    expect(screen.queryByTestId("program-date-panel")).toBeNull();
    // Fin : bornée par le début.
    fireEvent.press(screen.getByTestId("program-end-date"));
    picker = screen.UNSAFE_getByType(DatePicker);
    expect((picker.props.range as { start: Date }).start.getDate()).toBe(20);
    act(() => picker.props.onDateChange(new Date(2031, 0, 31, 12, 0)));
    expect(within(screen.getByTestId("program-end-date")).getByText("31 janv. 2031")).toBeTruthy();
    // Mode durée : le début choisi recalcule la fin.
    fireEvent.press(screen.getByTestId("program-date-popover-scrim", { includeHiddenElements: true }));
    toggleMode();
    fireEvent.press(screen.getByTestId("program-start-date"));
    act(() => screen.UNSAFE_getByType(DatePicker).props.onDateChange(new Date(2031, 0, 1, 12, 0)));
    expect(screen.getByTestId("program-period-info").props.children).toBe("Se termine le 12 février 2031");
  });

  it("y4 (lot 5) : valeurs modifiables de la période au format de la planification (Pill) — « pendant », nombre et unité", async () => {
    const program = await createProgram({ startDate: "2030-09-15", endDate: "2030-12-14" });
    render(withService(<ProgramSheetScreen params={{ programId: program.id }} />));
    await flush();
    toggleMode();
    const labels = screen.UNSAFE_getAllByType(Pill).map((pill) => pill.props.label);
    expect(labels).toEqual(["15 sept. 2030", "pendant", "13"]);
    // Lot 5 bis : l'unité reste un menu natif (popover inchangé), avec une pastille pour étiquette.
    expect(screen.UNSAFE_getAllByType(PillFace).map((face) => face.props.label)).toEqual(["semaines"]);
    expect(screen.UNSAFE_getByProps({ testID: "program-period-unit-option-WEEK" }).props.systemImage).toBe("checkmark");
  });

  it("D-543 : « N jours, soit S semaines et J jour » ; « au / pendant » ; de dates vers durée sans perte ; mois ; « Se termine le … »", async () => {
    const program = await createProgram({ startDate: "2030-09-15", endDate: "2030-12-15" });
    render(withService(<ProgramSheetScreen params={{ programId: program.id }} />));
    await flush();
    expect(screen.getByTestId("program-period-info").props.children).toBe("92 jours, soit 13 semaines et 1 jour");
    toggleMode();
    expect(screen.getByText("92")).toBeTruthy();
    expect(screen.getByTestId("program-period-info").props.children).toBe("Se termine le 15 décembre 2030");
    chooseUnit("MONTH");
    expect(screen.getByText("mois")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Enregistrer le programme"));
    await flush();
    // 92 mois depuis le 15 septembre 2030 : même quantième moins un jour.
    expect((await programs.getProgram(program.id))?.endDate).toBe("2038-05-14");
  });

  it("D-543 : retour au mode dates sans perte (91 jours → 13 semaines → « au 14 déc. 2030 »)", async () => {
    const program = await createProgram({ startDate: "2030-09-15", endDate: "2030-12-14" });
    render(withService(<ProgramSheetScreen params={{ programId: program.id }} />));
    await flush();
    toggleMode();
    expect(screen.getByText("13")).toBeTruthy();
    expect(screen.getByText("semaines")).toBeTruthy();
    // y3 (lot 5) : semaines → « X jours, se termine le … ».
    expect(screen.getByTestId("program-period-info").props.children).toBe("91 jours, se termine le 14 décembre 2030");
    toggleMode();
    expect(screen.getByText("14 déc. 2030")).toBeTruthy();
    expect(screen.getByTestId("program-period-info").props.children).toBe("91 jours, soit 13 semaines");
  });

  it("D-543 : raccourcir la période demande « N créneaux seront supprimés » ; Annuler n'enregistre rien, Confirmer enregistre et supprime", async () => {
    const program = await createProgram({ startDate: "2030-08-01", endDate: "2030-09-30" });
    // Tous les jours du 5 au 29 août 2030 (aujourd'hui : 10 août).
    const created = await planning.createRoutine({ ...routineDraft(), programId: program.id });
    if (created.status !== "SAVED") throw new Error(created.status);
    render(withService(<ProgramSheetScreen params={{ programId: program.id }} />));
    await flush();
    await runFocus();
    // 61 jours : la durée est en jours.
    toggleMode();
    const wheel = screen.UNSAFE_root.findAll((node) => node.props.testID === "program-period-count-popover" && Array.isArray(node.props.columns))[0]!;
    act(() => wheel.props.columns[0].onChange(24));
    expect(screen.getByTestId("program-period-info").props.children).toBe("Se termine le 24 août 2030");
    fireEvent.press(screen.getByLabelText("Enregistrer le programme"));
    await flush();
    // Créneaux du 25 au 29 août.
    expect(screen.getByText("5 créneaux seront supprimés")).toBeTruthy();
    fireEvent.press(screen.getByTestId("program-shortened-cancel"));
    await flush();
    expect(mockBack).not.toHaveBeenCalled();
    expect((await programs.getProgram(program.id))?.endDate).toBe("2030-09-30");
    fireEvent.press(screen.getByLabelText("Enregistrer le programme"));
    await flush();
    fireEvent.press(screen.getByTestId("program-shortened-confirm"));
    await flush();
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect((await programs.getProgram(program.id))?.endDate).toBe("2030-08-24");
    const stored = await planning.getRoutine(created.routine.id);
    if (stored === null) throw new Error("routine");
    expect((await planning.periodSlotCountsFor([stored], "2030-08-25", "2030-09-30")).get(stored.id)?.inside).toBe(0);
    expect((await planning.periodSlotCountsFor([stored], "2030-08-10", "2030-08-24")).get(stored.id)?.inside).toBe(15);
  });

  it("D-543 : prolonger ou garder la fin : aucune question", async () => {
    const program = await createProgram({ startDate: "2030-08-01", endDate: "2030-08-31" });
    const created = await planning.createRoutine({ ...routineDraft(), programId: program.id });
    if (created.status !== "SAVED") throw new Error(created.status);
    render(withService(<ProgramSheetScreen params={{ programId: program.id }} />));
    await flush();
    await runFocus();
    fireEvent.press(screen.getByLabelText("Enregistrer le programme"));
    await flush();
    expect(screen.queryByTestId("program-shortened-card")).toBeNull();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("x5 : fenêtre de consentement — titre centré au token des modales (18), texte de Hermann recopié tel quel", async () => {
    const program = await createProgram();
    render(withService(<ProgramSheetScreen params={{ programId: program.id }} />));
    await flush();
    fireEvent(screen.getByTestId("program-pain-switch"), "valueChange", true);
    await flush();
    const title = screen.getAllByText("Suivi de la douleur").find((node) => node.props.accessibilityRole === "header")!;
    expect(Object.assign({}, ...[title.props.style].flat())).toMatchObject({ fontSize: 18, fontWeight: "600", textAlign: "center" });
    expect(
      screen.getByText("Une échelle de douleur et la zone concernée vous seront demandés avant et après chaque séance exécutée dans ce programme"),
    ).toBeTruthy();
  });
});

describe("CE-PRF-01 — Profil › Confidentialité", () => {
  it("sans accord : « Non utilisé », sans réglage ; Partage communautaire grisé avec la mention", async () => {
    render(withService(<PrivacyScreen />));
    await runFocus();
    expect(screen.getByTestId("privacy-pain-none")).toBeTruthy();
    expect(screen.queryByText("Retirer mon accord")).toBeNull();
    expect(screen.getByTestId("privacy-community").props.accessibilityState).toEqual({ disabled: true });
    expect(screen.getByText("Disponible avec la gestion des comptes")).toBeTruthy();
    expect(screen.getByText("@hermann — visible par tous")).toBeTruthy();
    expect(screen.getByTestId("profile-tabs-privacy").props.accessibilityState).toMatchObject({ selected: true });
  });

  it("avec accord : date, programmes concernés ; Effacer grisé sans relevé ; Retirer désactive partout", async () => {
    await programs.grantPainConsent();
    const program = await createProgram({ painTracking: true });
    render(withService(<PrivacyScreen />));
    await runFocus();
    expect(screen.getByText("Accordé le 10 août 2030")).toBeTruthy();
    expect(screen.getByText("Utilisé par 1 programme · Rééducation genou")).toBeTruthy();
    expect(screen.getByTestId("privacy-erase").props.accessibilityState).toEqual({ disabled: true });
    // Contre-recette du 23/11/2026 (constat b) : confirmation nommant les programmes concernés ; Annuler ne retire rien.
    fireEvent.press(screen.getByTestId("privacy-withdraw"));
    expect(screen.getByTestId("privacy-withdraw-confirm-card")).toBeTruthy();
    expect(
      screen.getByText(
        "L’information de douleur rapportée avant et après l’exécution d’une séance ne sera plus mesurée ni partagée dans les programmes suivants : Rééducation genou",
      ),
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId("privacy-withdraw-confirm-cancel"));
    await flush();
    expect(screen.queryByTestId("privacy-withdraw-confirm-card")).toBeNull();
    expect(await programs.painConsentAt()).not.toBeNull();
    expect((await programs.getProgram(program.id))?.painTracking).toBe(true);
    fireEvent.press(screen.getByTestId("privacy-withdraw"));
    fireEvent.press(screen.getByTestId("privacy-withdraw-confirm-confirm"));
    await flush();
    await waitFor(() => expect(screen.getByTestId("privacy-pain-none")).toBeTruthy());
    expect(await programs.painConsentAt()).toBeNull();
    expect((await programs.getProgram(program.id))?.painTracking).toBe(false);
  });

  it("avec accord sans programme concerné : « Retirer mon accord » agit sans confirmation (question ouverte)", async () => {
    await programs.grantPainConsent();
    render(withService(<PrivacyScreen />));
    await runFocus();
    expect(screen.getByText("Utilisé par aucun programme")).toBeTruthy();
    fireEvent.press(screen.getByTestId("privacy-withdraw"));
    expect(screen.queryByTestId("privacy-withdraw-confirm-card")).toBeNull();
    await flush();
    await waitFor(() => expect(screen.getByTestId("privacy-pain-none")).toBeTruthy());
    expect(await programs.painConsentAt()).toBeNull();
  });
});
