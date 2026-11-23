import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
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
  it("création : « Nouveau programme », coche inactive tant que nom et période manquent ; rien d'interdit dans la modale", async () => {
    render(withService(<ProgramSheetScreen params={{}} />));
    await runFocus();
    expect(screen.getByText("Nouveau programme")).toBeTruthy();
    expect(screen.getByLabelText("Enregistrer le programme").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByText("Planifications")).toBeTruthy();
    expect(screen.getByText("+ Planifier une séance")).toBeTruthy();
    expect(screen.getByText("Rattacher une routine existante")).toBeTruthy();
    expect(screen.getByTestId("program-pain-switch").props.value).toBe(false);
    for (const absent of ["Enregistrer comme modèle", "Dupliquer", "Indicateurs", "Personnes"]) expect(screen.queryByText(absent)).toBeNull();
    fireEvent.changeText(screen.getByTestId("program-name"), "Genou");
    expect(screen.getByLabelText("Enregistrer le programme").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("configuration : titre = nom ; période « Du … au … » ; routines « créneau · N contenus » ; glisser retire sans supprimer", async () => {
    const program = await createProgram();
    const created = await planning.createRoutine({ ...routineDraft(), programId: program.id });
    if (created.status !== "SAVED") throw new Error(created.status);
    render(withService(<ProgramSheetScreen params={{ programId: program.id }} />));
    await flush();
    await runFocus();
    expect(screen.getAllByText("Rééducation genou").length).toBeGreaterThan(0);
    expect(screen.getByText("1er août 2030")).toBeTruthy();
    expect(screen.getByText("30 sept. 2030")).toBeTruthy();
    expect(screen.getByText("tous les jours, 14 h  ·  2 contenus")).toBeTruthy();
    expect(screen.getByLabelText("Enregistrer le programme").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent(screen.getByTestId(`program-routine-${created.routine.id}-swipe-card`), "accessibilityAction", { nativeEvent: { actionName: "detach" } });
    await flush();
    // Recette du 23/11/2026 (p4-croix) : le retrait n'est écrit qu'à la coche.
    expect(screen.queryByText("tous les jours, 14 h  ·  2 contenus")).toBeNull();
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

  it("suivi de la douleur sans accord : la feuille de consentement s'ouvre ; Annuler laisse désactivé, Autoriser active", async () => {
    const requests: relay.ProgramSheetRequest[] = [];
    const spy = jest.spyOn(relay, "requestProgramSheet").mockImplementation((request) => {
      requests.push(request);
    });
    const program = await createProgram();
    render(withService(<ProgramSheetScreen params={{ programId: program.id }} />));
    await flush();
    fireEvent(screen.getByTestId("program-pain-switch"), "valueChange", true);
    await flush();
    expect(mockPush).toHaveBeenCalledWith("/pain-consent");
    const first = requests[0];
    if (first?.kind !== "consent") throw new Error("consent");
    act(() => first.onCancel());
    expect(screen.getByTestId("program-pain-switch").props.value).toBe(false);
    expect(await programs.painConsentAt()).toBeNull();
    fireEvent(screen.getByTestId("program-pain-switch"), "valueChange", true);
    await flush();
    const second = requests[1];
    if (second?.kind !== "consent") throw new Error("consent");
    await act(async () => second.onAllow());
    await flush();
    expect(screen.getByTestId("program-pain-switch").props.value).toBe(true);
    expect(await programs.painConsentAt()).toBe(NOW.toISOString());
    // Accord déjà donné : les activations suivantes ne redemandent rien.
    mockPush.mockClear();
    fireEvent(screen.getByTestId("program-pain-switch"), "valueChange", false);
    fireEvent(screen.getByTestId("program-pain-switch"), "valueChange", true);
    await flush();
    expect(mockPush).not.toHaveBeenCalledWith("/pain-consent");
    expect(screen.getByTestId("program-pain-switch").props.value).toBe(true);
    spy.mockRestore();
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
    fireEvent.press(screen.getByTestId("privacy-withdraw"));
    await flush();
    await waitFor(() => expect(screen.getByTestId("privacy-pain-none")).toBeTruthy());
    expect(await programs.painConsentAt()).toBeNull();
    expect((await programs.getProgram(program.id))?.painTracking).toBe(false);
  });
});
