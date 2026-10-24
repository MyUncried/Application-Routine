import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useEffect, useState } from "react";

import type { ActivityDefinition, CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import type { ExecutionParameters, WorkPhase } from "@/domain/activities/ExecutionParameters";
import { durationParameters, uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { duplicateActivity } from "@/domain/sessions/composition";
import type { Session } from "@/domain/sessions/Session";
import { createEmptyDraft, toCreateSessionInput, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { ActivityCatalogueList } from "@/features/activities/ActivityCatalogueList";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { ActivitySelectionScreen } from "@/features/activities/ActivitySelectionScreen";
import { useActivityCatalogue } from "@/features/activities/useActivityCatalogue";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { formatExerciseRowSummary } from "@/features/sessions/compositionPresentation";
import { SessionDraftContext, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { SessionService } from "@/features/sessions/SessionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-7 story A4.1 (D-437, D-439, D-124, D-389, MFN-03, MFN-09, MFN-10 ; CE-T03-02 §5, CE-T03-07
 * §5 ; matrice de `spec-a4-1-catalogue-par-geste-selection.md`) — Catalogue et modale « Sélection
 * des exercices » sur les VRAIS services et une base SQLite réelle : ordre regroupé par geste,
 * une carte par définition avec son résumé, insertion dans l'ordre affiché, contenu résolu et
 * filiation, frère incomplet, brouillon abandonné, duplication puis enregistrement. Rappel : ces
 * tests ne valent pas recette sur iPhone (JA).
 */

jest.mock("expo-crypto", () => {
  let counter = 0;
  return { randomUUID: jest.fn(() => `occ-${++counter}`) };
});

const mockBack = jest.fn();
jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactActual = require("react") as typeof import("react");
  return {
    useRouter: () => ({ back: mockBack }),
    useFocusEffect: (callback: () => void | (() => void)) => {
      ReactActual.useEffect(() => callback(), []);
    },
  };
});

let database: NodeSqliteDatabase;
let sequence = 0;
let tick = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
// Horloge strictement croissante : la liste du Repository est triée par `updated_at DESC`.
const clock = () => new Date(Date.UTC(2026, 9, 24, 9, 0, ++tick)).toISOString();
const service = () =>
  new ActivityDefinitionService(
    new SqliteActivityDefinitionRepository(database, ids("def"), clock),
    new SqliteCategoryRepository(database),
    new SqliteBodyZoneRepository(database),
    undefined,
    undefined,
    new SqliteMovementRepository(database, ids("grp"), clock),
  );
const sessionService = () => new SessionService(new SqliteSessionRepository(database, ids("ses"), clock));

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  mockBack.mockReset();
});

afterEach(() => {
  database.close();
});

const phases = (...entries: [string, number][]): WorkPhase[] =>
  entries.map(([label, durationSeconds], index) => ({ id: index + 1, label, durationSeconds }));

const phased = (workPhases: readonly WorkPhase[]): ExecutionParameters =>
  uniformParameters({
    mode: "DURATION",
    count: 3,
    target: workPhases.reduce((sum, phase) => sum + phase.durationSeconds, 0),
    pauseSeconds: 10,
    workPhases: [...workPhases],
  });

const input = (name: string, parameters: ExecutionParameters): CreateActivityDefinitionInput => ({
  name,
  description: "Buste droit",
  category: { kind: "EXISTING", categoryId: "cardio" },
  bodyZoneIds: ["cuisses"],
  executionParameters: parameters,
});

async function create(
  name: string,
  parameters: ExecutionParameters,
  origin: Parameters<ActivityDefinitionService["createActivityDefinitionWithOrigin"]>[1] = { kind: "INDEPENDENT" },
): Promise<ActivityDefinition> {
  const result = await service().createActivityDefinitionWithOrigin(input(name, parameters), origin);
  if (result.status !== "CREATED") throw new Error(result.status);
  return result.value;
}

/** A2 (plus ancienne), B (autre geste), puis A1 (même geste que A2, la plus récente). */
async function interleaved() {
  const a2 = await create("Squat", durationParameters(30, 3, 10));
  const b = await create("Pompes", durationParameters(20, 2, 10));
  const a1 = await create("Squat", durationParameters(45, 4, 10), { kind: "SAME_MOVEMENT", movementId: a2.movementId });
  return { a1, a2, b };
}

const order = (prefix: string) =>
  screen
    .getAllByTestId(new RegExp(`^${prefix}-[^-]+-\\d+$`))
    .map((node) => String(node.props.testID).slice(prefix.length + 1))
    .filter((id, index, all) => all.indexOf(id) === index);

function CatalogueHarness() {
  const { state, reload } = useActivityCatalogue();
  useEffect(() => reload(), [reload]);
  return <ActivityCatalogueList state={state} onRetry={reload} onOpenDefinition={jest.fn()} />;
}

function renderCatalogue() {
  render(
    <ActivityDefinitionServiceContext.Provider value={service()}>
      <CatalogueHarness />
    </ActivityDefinitionServiceContext.Provider>,
  );
}

const draftHolder: { current: SessionDraft } = { current: createEmptyDraft() };

function DraftHost({ initial }: { initial: SessionDraft }) {
  const [draft, setDraft] = useState(initial);
  useEffect(() => {
    draftHolder.current = draft;
  }, [draft]);
  const updateDraft = (update: SessionDraftUpdate) =>
    setDraft((current) => ({ ...current, ...(typeof update === "function" ? update(current) : update) }));
  return (
    <SessionDraftContext.Provider value={{ draft, updateDraft, resetDraft: () => setDraft(createEmptyDraft()) }}>
      <ActivitySelectionScreen />
    </SessionDraftContext.Provider>
  );
}

const profileService = {
  getProfile: jest.fn(async () => createDefaultProfile("profile-1", "2026-01-01T00:00:00.000Z")),
} as unknown as ProfileService;

async function renderSelection(initial: SessionDraft = { ...createEmptyDraft(), name: "Jambes" }) {
  draftHolder.current = initial;
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service()}>
        <ProfileServiceContext.Provider value={profileService}>
          <DraftHost initial={initial} />
        </ProfileServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());
}

const occurrencesOf = (session: Session) => [
  ...(session.cycle.beforeTour ?? []),
  ...session.cycle.tour.exercises,
  ...(session.cycle.afterTour ?? []),
];

describe("PRE-7 A4.1 — Catalogue par geste et sélection (NodeSqliteDatabase REAL)", () => {
  it("Catalogue : les deux Exercices du geste sont contigus (A1, A2, B), chacun sa carte et son résumé", async () => {
    const { a1, a2, b } = await interleaved();
    expect((await service().listActivityDefinitions()).map((definition) => definition.id)).toEqual([a1.id, b.id, a2.id]);

    renderCatalogue();
    await waitFor(() => expect(screen.getByTestId("activity-catalogue-list")).toBeTruthy());
    expect(order("activity-card")).toEqual([a1.id, a2.id, b.id]);
    expect(screen.getByText(formatExerciseRowSummary(a1))).toBeTruthy();
    expect(screen.getByText(formatExerciseRowSummary(a2))).toBeTruthy();
    expect(formatExerciseRowSummary(a1)).not.toBe(formatExerciseRowSummary(a2));
  });

  it("duplicatas identiques : deux cartes, deux identifiants, sur le même geste", async () => {
    const first = await create("Gainage", durationParameters(30, 3, 10));
    const second = await create("Gainage", durationParameters(30, 3, 10), { kind: "SAME_MOVEMENT", movementId: first.movementId });
    expect(second.id).not.toBe(first.id);
    expect(second.movementId).toBe(first.movementId);

    renderCatalogue();
    await waitFor(() => expect(screen.getByTestId("activity-catalogue-list")).toBeTruthy());
    expect(screen.getByTestId(`activity-card-${first.id}`)).toBeTruthy();
    expect(screen.getByTestId(`activity-card-${second.id}`)).toBeTruthy();
  });

  it("modale : même ordre regroupé ; touchers B, A2, A1 → copies insérées A1, A2, B en une mutation, filiation non nulle", async () => {
    const { a1, a2, b } = await interleaved();
    await renderSelection();
    expect(order("activity-selection-row")).toEqual([a1.id, a2.id, b.id]);

    for (const definition of [b, a2, a1]) {
      fireEvent.press(screen.getByTestId(`activity-selection-row-${definition.id}`));
    }
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-selection-add"));
    });

    const inserted = draftHolder.current.exercises;
    expect(inserted.map((exercise) => [exercise.name, exercise.sourceMovementId])).toEqual([
      ["Squat", a1.movementId],
      ["Squat", a2.movementId],
      ["Pompes", b.movementId],
    ]);
    expect(inserted.map((exercise) => exercise.executionParameters)).toEqual([
      a1.executionParameters,
      a2.executionParameters,
      b.executionParameters,
    ]);
    expect(new Set(inserted.map((exercise) => exercise.id)).size).toBe(3);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("contenu résolu : libellés et durées des phases copiés ; la source modifiée ensuite n'est pas relue", async () => {
    const source = await create("Fentes", phased(phases(["Descente", 6], ["Remontée", 3])));
    await renderSelection();
    fireEvent.press(screen.getByTestId(`activity-selection-row-${source.id}`));
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-selection-add"));
    });
    const copy = draftHolder.current.exercises[0]!;
    const series = copy.executionParameters.series;
    expect(series.kind === "UNIFORM" && series.workPhases.map((phase) => [phase.label, phase.durationSeconds])).toEqual([
      ["Descente", 6],
      ["Remontée", 3],
    ]);
    expect(copy.sourceMovementId).toBe(source.movementId);

    const updated = await service().updateActivityDefinition(source.id, input("Fentes", phased(phases(["Descente", 9], ["Remontée", 4]))));
    expect(updated.status).toBe("UPDATED");

    // Modale démontée puis rouverte sur le même brouillon : la carte de la source relit 9/4,
    // la copie du brouillon garde 6/3.
    screen.unmount();
    await renderSelection(draftHolder.current);
    const reread = (await service().getActivityDefinition(source.id))!;
    expect(formatExerciseRowSummary(reread)).not.toBe(formatExerciseRowSummary(source));
    expect(screen.getByText(formatExerciseRowSummary(reread))).toBeTruthy();
    const rereadSeries = reread.executionParameters.series;
    expect(rereadSeries.kind === "UNIFORM" && rereadSeries.workPhases.map((phase) => phase.durationSeconds)).toEqual([9, 4]);
    expect(draftHolder.current.exercises[0]).toEqual(copy);
    const kept = draftHolder.current.exercises[0]!.executionParameters.series;
    expect(kept.kind === "UNIFORM" && kept.workPhases.map((phase) => phase.durationSeconds)).toEqual([6, 3]);
  });

  it("Annuler et ✕ : brouillon inchangé, rien écrit", async () => {
    const { a1 } = await interleaved();
    const snapshot = async () => ({
      definitions: await database.getAllAsync("SELECT * FROM activity_definitions ORDER BY id"),
      movements: await database.getAllAsync("SELECT * FROM movements ORDER BY id"),
      sessions: await database.getAllAsync("SELECT * FROM sessions ORDER BY id"),
    });
    const before = await snapshot();
    const initial = { ...createEmptyDraft(), name: "Jambes" };
    await renderSelection(initial);
    fireEvent.press(screen.getByTestId(`activity-selection-row-${a1.id}`));
    fireEvent.press(screen.getByTestId("activity-selection-cancel"));
    expect(draftHolder.current).toEqual(initial);
    fireEvent.press(screen.getByLabelText(strings.screens.activities.selection.backAccessibilityLabel));
    expect(draftHolder.current).toEqual(initial);
    expect(mockBack).toHaveBeenCalledTimes(2);
    expect(await snapshot()).toEqual(before);
  });

  it("frère incomplet : « Paramètres à compléter. » sans durée, insérable sans message ; occurrence signalée, Séance refusée par `toCreateSessionInput` (condition de Continuer)", async () => {
    const first = await create("Squat", phased(phases(["Descente", 6], ["Remontée", 3])));
    const sibling = await create("Squat", phased(phases(["Descente", 8], ["Remontée", 4])), {
      kind: "SAME_MOVEMENT",
      movementId: first.movementId,
    });
    const corrected = await service().updateActivityDefinition(
      first.id,
      input("Squat", phased(phases(["Descente", 6], ["Remontée", 3], ["Pause", 2]))),
      [{ definitionId: sibling.id, phaseDurations: [{ phaseId: 3, durationSeconds: null }] }],
    );
    expect(corrected.status).toBe("UPDATED");
    expect((await service().getActivityDefinition(sibling.id))?.missingPhaseIds).toEqual([3]);

    await renderSelection();
    const incomplete = strings.executionParameters.card.incomplete;
    expect(incomplete).toBe("Paramètres à compléter.");
    expect(screen.getAllByText(incomplete)).toHaveLength(1);
    expect(screen.queryByTestId(`activity-selection-row-duration-${sibling.id}`)).toBeNull();
    expect(screen.getByTestId(`activity-selection-row-duration-${first.id}`)).toBeTruthy();

    fireEvent.press(screen.getByTestId(`activity-selection-row-${sibling.id}`));
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-selection-add"));
    });
    expect(screen.queryByTestId("activity-selection-stale-notice")).toBeNull();
    const [occurrence] = draftHolder.current.exercises;
    expect(occurrence?.sourceMovementId).toBe(first.movementId);
    expect(formatExerciseRowSummary(occurrence!)).toBe(incomplete);
    expect(toCreateSessionInput(draftHolder.current).ok).toBe(false);
  });

  it("brouillon abandonné : insertion sans enregistrement → geste non marqué « déjà utilisé »", async () => {
    const { a1 } = await interleaved();
    await renderSelection();
    fireEvent.press(screen.getByTestId(`activity-selection-row-${a1.id}`));
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-selection-add"));
    });
    expect(draftHolder.current.exercises).toHaveLength(1);
    // Brouillon abandonné : écran démonté sans enregistrement.
    screen.unmount();
    expect(await database.getFirstAsync("SELECT used FROM movements WHERE id = ?", [a1.movementId])).toEqual({ used: 0 });
  });

  it("duplication de l'occurrence (domaine de la Composition, D-124) puis enregistrement : nouvel id, même filiation, « (copie) » ; geste et définitions non renommés ; used = 1", async () => {
    const { a1, a2 } = await interleaved();
    await renderSelection();
    fireEvent.press(screen.getByTestId(`activity-selection-row-${a1.id}`));
    await act(async () => {
      fireEvent.press(screen.getByTestId("activity-selection-add"));
    });
    const [occurrence] = draftHolder.current.exercises;
    const exercises = duplicateActivity(draftHolder.current.exercises, occurrence!.id, "occ-dup");
    const result = await sessionService().createSession({ ...draftHolder.current, exercises });
    if (!result.ok) throw new Error(JSON.stringify(result.violations));

    expect(occurrencesOf(result.value).map((item) => [item.id, item.name, item.sourceMovementId])).toEqual([
      [occurrence!.id, "Squat", a1.movementId],
      ["occ-dup", "Squat (copie)", a1.movementId],
    ]);
    expect(await database.getAllAsync("SELECT id, name, used FROM movements WHERE id = ?", [a1.movementId])).toEqual([
      { id: a1.movementId, name: "Squat", used: 1 },
    ]);
    expect((await service().getActivityDefinition(a1.id))?.name).toBe("Squat");
    expect((await service().getActivityDefinition(a2.id))?.name).toBe("Squat");
    expect(await database.getFirstAsync("SELECT COUNT(*) AS count FROM movements")).toEqual({ count: 2 });
  });
});
