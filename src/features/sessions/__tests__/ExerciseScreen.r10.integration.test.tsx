import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { useState, type ReactNode } from "react";

import { activityDefinitionToDraftExercise, type CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Category } from "@/domain/categories/Category";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import {
  createEmptyDraft,
  createExerciseDraft,
  draftMovementOf,
  toSessionDraft,
  type SessionDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { ExerciseScreen } from "@/features/sessions/ExerciseScreen";
import { SessionDraftContext, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { SessionService } from "@/features/sessions/SessionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-7 story R-10 (recette JA3 du 26/10/2026, `spec-r-10-recette-ja3-variante-crayon.md`) — sur les
 * VRAIS services et une base SQLite réelle (`node:sqlite`), plate-forme iOS (`jest-expo`) :
 * - r8-5 : « Ajouter un niveau » au Catalogue reprend le nom de l'origine avec l'invite grise ;
 *   unicité C01 comme pour la variante du panneau ;
 * - r9-5 : crayon retouché après un changement du contenu — décision de sauvegarde C03 au lieu de
 *   la confirmation d'abandon ; correction inscrite dans le brouillon, éditeur ouvert, reverrouillé.
 * Le brouillon de Séance est tenu dans un état React, comme le fournisseur réel : l'éditeur relit
 * le brouillon mis à jour. Rappel : ces tests ne valent pas recette sur iPhone (JA3).
 */

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));
let mockUuid = 0;
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => `uuid-${++mockUuid}`) }));

const mockBack = jest.fn();
let mockSearchParams: Record<string, string> = {};
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
    useLocalSearchParams: () => mockSearchParams,
  };
});
// Garde de sortie : l'argument `shouldBlock` est capturé (même patron que `ExerciseScreen.test.tsx`).
const mockExitGuard = jest.fn((_shouldBlock: boolean) => ({ isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() }));
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: (shouldBlock: boolean) => mockExitGuard(shouldBlock),
}));
const lastShouldBlock = () => mockExitGuard.mock.calls.at(-1)![0];

const NOW = "2026-10-26T09:00:00.000Z";
const CARDIO: Category = {
  id: "cardio",
  name: "Cardio",
  canonicalKey: "cardio",
  color: "#3B82F6",
  isPredefined: true,
  displayOrder: 1,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};
const anyNode = { includeHiddenElements: true } as const;
const editorStrings = strings.screens.activities.editor;
const movementSave = editorStrings.movementSave;

let database: NodeSqliteDatabase;
let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
const service = () =>
  new ActivityDefinitionService(
    new SqliteActivityDefinitionRepository(database, ids("def"), () => NOW),
    undefined,
    new SqliteBodyZoneRepository(database),
    undefined,
    undefined,
    new SqliteMovementRepository(database, ids("grp"), () => NOW),
  );
const sessionService = () => new SessionService(new SqliteSessionRepository(database, ids("ses"), () => NOW));

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  mockBack.mockReset();
  mockExitGuard.mockClear();
  mockSearchParams = {};
});

afterEach(() => {
  database.close();
});

const input = (name: string, description: string): CreateActivityDefinitionInput => ({
  name,
  description,
  category: { kind: "EXISTING", categoryId: "cardio" },
  bodyZoneIds: ["cuisses"],
  executionParameters: durationParameters(30, 3, 10),
});

async function create(
  value: CreateActivityDefinitionInput,
  origin: Parameters<ActivityDefinitionService["createActivityDefinitionWithOrigin"]>[1] = { kind: "INDEPENDENT" },
) {
  const result = await service().createActivityDefinitionWithOrigin(value, origin);
  if (result.status !== "CREATED") throw new Error(result.status);
  return result.value;
}

/** Groupe de deux niveaux : « Squats assistés » → « Squats ». */
async function twoLevels() {
  const assisted = await create(input("Squats assistés", "Avec appui"));
  const squats = await create(input("Squats", "Buste droit"), {
    kind: "VARIANT",
    originMovementId: assisted.movementId,
    joinOriginGroup: true,
  });
  return { assisted, squats };
}

/** Séance enregistrée : deux occurrences de « Squats » (Exercice du Catalogue), relue en brouillon. */
async function sessionWithTwoSquats() {
  const squats = await create(input("Squats", "Buste droit"));
  const created = await sessionService().createSession({
    ...createEmptyDraft(),
    name: "Jambes",
    exercises: [
      activityDefinitionToDraftExercise(squats, "occ-1", null),
      activityDefinitionToDraftExercise(squats, "occ-2", null),
    ],
  });
  if (!created.ok) throw new Error(JSON.stringify(created.violations));
  return { squats, session: created.value, draft: toSessionDraft(created.value) };
}

function fakeReferential(): ReferentialService {
  return {
    listBodyZones: jest.fn(async () => new SqliteBodyZoneRepository(database).listAll()),
    listCategories: jest.fn(async () => [CARDIO]),
    isBodyZoneUsed: jest.fn(async () => false),
  } as unknown as ReferentialService;
}

function fakeProfile(): ProfileService {
  return { getProfile: jest.fn(async () => createDefaultProfile("profile-1", NOW)) } as unknown as ProfileService;
}

/** Brouillon de Séance courant, tenu par `LiveDraft` (fusion comme le fournisseur réel). */
let currentDraft: SessionDraft;
let updateCount = 0;

function LiveDraft({ initial, children }: { initial: SessionDraft; children: ReactNode }) {
  const [draft, setDraft] = useState(initial);
  const updateDraft = (update: SessionDraftUpdate) => {
    updateCount += 1;
    currentDraft = { ...currentDraft, ...(typeof update === "function" ? update(currentDraft) : update) };
    setDraft(currentDraft);
  };
  return (
    <SessionDraftContext.Provider value={{ draft, updateDraft, resetDraft: jest.fn() }}>{children}</SessionDraftContext.Provider>
  );
}

async function renderEditor(params: Record<string, string>, draft: SessionDraft = createEmptyDraft()) {
  mockSearchParams = params;
  currentDraft = draft;
  updateCount = 0;
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service()}>
        <ReferentialServiceContext.Provider value={fakeReferential()}>
          <ProfileServiceContext.Provider value={fakeProfile()}>
            <LiveDraft initial={draft}>
              <ExerciseScreen />
            </LiveDraft>
          </ProfileServiceContext.Provider>
        </ReferentialServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  await settle();
  await settle(20);
}

async function settle(ms = 0) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
  await settle(50);
}

const nameInput = () => screen.getByTestId("exercise-name-input");
const instruction = () => screen.getByTestId("exercise-instruction-input");
const pencil = () => screen.getByTestId("activity-editor-edit-movement");
const hintShown = () => screen.queryByTestId("exercise-name-hint", anyNode) !== null;
const occurrenceOf = (id: string) => currentDraft.exercises.find((exercise) => exercise.id === id)!;
const newEntries = () => Object.values(currentDraft.movements ?? {}).filter((movement) => movement.change === "NEW");

/** Crayon, saisie (nom ou description), crayon retouché. */
async function editAndRetouch(field: "name" | "description", text: string) {
  await press("activity-editor-edit-movement");
  fireEvent.changeText(field === "name" ? nameInput() : instruction(), text);
  await settle(20);
  await press("activity-editor-edit-movement");
}

/** « Créer un nouveau mouvement » dans le dialogue à deux choix ouvert. */
async function chooseNewMovement() {
  fireEvent.press(screen.getByTestId("movement-save-choice-NEW_MOVEMENT"));
  await press("movement-save-confirm");
}

describe("PRE-7 R-10 — Ajouter un niveau : nom de l'origine repris (recette JA3 r8-5)", () => {
  it("Squats > Ajouter un niveau > Plus difficile : nom « Squats », invite grise, Terminer indisponible tant que le nom n'est pas complété", async () => {
    const { squats } = await twoLevels();
    await renderEditor({ catalogueDefinitionId: "new", levelOriginDefinitionId: squats.id, levelPlacement: "AFTER_ORIGIN" });

    expect(nameInput().props.value).toBe("Squats");
    expect(
      within(screen.getByTestId("exercise-name-hint", anyNode)).getByText(
        ` ${editorStrings.movementSuggestion.completeNameHint}`,
        anyNode,
      ),
    ).toBeTruthy();
    // C01 : le nom identique tient lieu de signalement par l'invite ; Terminer reste indisponible.
    expect(screen.queryByTestId("movement-suggestion-message")).toBeNull();
    expect(screen.getByTestId("activity-editor-finish-action").props.accessibilityState).toMatchObject({ disabled: true });
    // Description et médias vierges ; Catégorie reprise.
    expect(screen.queryByDisplayValue("Buste droit")).toBeNull();
    expect(screen.getByTestId("activity-editor-category-button").props.accessibilityLabel).toBe("Catégorie Cardio");

    // Un nom pris saisi : l'invite disparaît, le conflit est signalé.
    fireEvent.changeText(nameInput(), "Squats assistés");
    await settle(20);
    expect(hintShown()).toBe(false);
    expect(screen.getByTestId("movement-suggestion-message")).toBeTruthy();
    expect(screen.getByTestId("activity-editor-finish-action").props.accessibilityState).toMatchObject({ disabled: true });

    fireEvent.changeText(nameInput(), "Squats sautés");
    await settle(20);
    expect(screen.queryByTestId("movement-suggestion-message")).toBeNull();
    expect(screen.getByTestId("activity-editor-finish-action").props.accessibilityState).toMatchObject({ disabled: false });
    await press("activity-editor-finish-action");
    expect(mockBack).toHaveBeenCalledTimes(1);
    const levels = await service().getMovementLevels(squats.movementId);
    expect(levels?.levels.map((level) => level.movement.name)).toEqual(["Squats assistés", "Squats", "Squats sautés"]);
  });

  it("Squats > Ajouter un niveau > Plus facile : inséré avant l'origine", async () => {
    const { squats } = await twoLevels();
    await renderEditor({ catalogueDefinitionId: "new", levelOriginDefinitionId: squats.id, levelPlacement: "BEFORE_ORIGIN" });
    expect(nameInput().props.value).toBe("Squats");
    expect(hintShown()).toBe(true);
    fireEvent.changeText(nameInput(), "Squats demi");
    await settle(20);
    await press("activity-editor-finish-action");
    expect(mockBack).toHaveBeenCalledTimes(1);
    const levels = await service().getMovementLevels(squats.movementId);
    expect(levels?.levels.map((level) => level.movement.name)).toEqual(["Squats assistés", "Squats demi", "Squats"]);
  });

  it("le même texte renvoyé par le clavier ne masque pas l'invite", async () => {
    const { squats } = await twoLevels();
    await renderEditor({ catalogueDefinitionId: "new", levelOriginDefinitionId: squats.id, levelPlacement: "BEFORE_ORIGIN" });
    fireEvent(nameInput(), "endEditing", { nativeEvent: { text: "Squats" } });
    fireEvent.changeText(nameInput(), "Squats");
    await settle(10);
    expect(hintShown()).toBe(true);
  });
});

describe("PRE-7 R-10 — crayon retouché : décision de sauvegarde C03 (recette JA3 r9-5)", () => {
  it("mouvement partagé : « Vous avez modifié ce mouvement » avec le nombre ; Confirmer → correction sur l'autre occurrence, éditeur ouvert, reverrouillé", async () => {
    const { squats, session, draft } = await sessionWithTwoSquats();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await press("activity-editor-edit-movement");
    fireEvent.changeText(instruction(), "Dos droit");
    await settle();
    await press("activity-editor-edit-movement");

    expect(screen.queryByTestId("exercise-exit-confirm-card")).toBeNull();
    const dialog = screen.getByTestId("movement-save-dialog");
    expect(within(dialog).getByText(movementSave.confirmTitle)).toBeTruthy();
    expect(within(dialog).getByText(`2 autres exercices utilisent ce mouvement. ${movementSave.appliesToAll}`)).toBeTruthy();
    expect(updateCount).toBe(0);
    expect(lastShouldBlock()).toBe(true);

    await press("movement-save-confirm");
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
    // La correction inscrite n'est plus proposée à l'abandon par la garde de sortie.
    expect(lastShouldBlock()).toBe(false);
    expect(pencil().props.accessibilityState).toMatchObject({ selected: false });
    expect(instruction().props.editable).toBe(false);
    expect(instruction().props.value).toBe("Dos droit");
    expect(occurrenceOf("occ-1").instruction).toBe("Dos droit");
    expect(occurrenceOf("occ-2").instruction).toBe("Dos droit");
    expect(currentDraft.movements?.[squats.movementId]).toMatchObject({ change: "EDITED", description: "Dos droit" });
    // Rien n'est écrit en base avant l'enregistrement de la Séance.
    expect((await service().getActivityDefinition(squats.id))?.description).toBe("Buste droit");

    // Terminer garde son comportement : fermeture, sans nouveau dialogue.
    await press("exercise-finish-action");
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(await sessionService().updateSession(session.id, currentDraft)).toMatchObject({ status: "UPDATED" });
    expect((await service().getActivityDefinition(squats.id))?.description).toBe("Dos droit");
  });

  it("Annuler : l'édition reste ouverte, rien n'est inscrit", async () => {
    const { draft } = await sessionWithTwoSquats();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await press("activity-editor-edit-movement");
    fireEvent.changeText(instruction(), "Dos droit");
    await settle();
    await press("activity-editor-edit-movement");
    await press("movement-save-cancel");

    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(pencil().props.accessibilityState).toMatchObject({ selected: true });
    expect(instruction().props.editable).not.toBe(false);
    expect(instruction().props.value).toBe("Dos droit");
    expect(updateCount).toBe(0);
    expect(currentDraft).toEqual(draft);
  });

  it("nom modifié : deux choix ; « Créer un nouveau mouvement » remplace l'occurrence, éditeur ouvert et reverrouillé", async () => {
    const { squats, draft } = await sessionWithTwoSquats();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await press("activity-editor-edit-movement");
    fireEvent.changeText(nameInput(), "Squats lents");
    await settle(20);
    await press("activity-editor-edit-movement");

    expect(within(screen.getByTestId("movement-save-dialog")).getByText(movementSave.choiceTitle)).toBeTruthy();
    fireEvent.press(screen.getByTestId("movement-save-choice-NEW_MOVEMENT"));
    await press("movement-save-confirm");

    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
    const [replaced, other] = currentDraft.exercises;
    expect(replaced!.id).not.toBe("occ-1");
    expect(replaced).toMatchObject({ name: "Squats lents", copyNumber: null });
    expect(replaced!.sourceMovementId).not.toBe(squats.movementId);
    expect(currentDraft.movements?.[replaced!.sourceMovementId!]).toMatchObject({ change: "NEW", name: "Squats lents" });
    expect(other).toMatchObject({ id: "occ-2", name: "Squats", sourceMovementId: squats.movementId });
    expect(nameInput().props.value).toBe("Squats lents");
    expect(pencil().props.accessibilityState).toMatchObject({ selected: false });
    expect(instruction().props.editable).toBe(false);

    // Terminer : l'occurrence remplaçante reste à sa place, sans dialogue.
    await press("exercise-finish-action");
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(currentDraft.exercises.map((exercise) => exercise.id)).toEqual([replaced!.id, "occ-2"]);
    expect(currentDraft.exercises[0]!.name).toBe("Squats lents");
  });

  it("mouvement non partagé : sans dialogue, reverrouillé, correction gardée", async () => {
    const occurrence: SessionDraftExercise = {
      ...createExerciseDraft("occ-local", null),
      name: "Gainage",
      instruction: "Dos plat",
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      executionParameters: durationParameters(30, 3, 10),
      sourceMovementId: "mov-local",
    };
    const created = await sessionService().createSession({
      ...createEmptyDraft(),
      name: "Gainage",
      exercises: [occurrence],
      movements: { "mov-local": draftMovementOf(occurrence, "NEW") },
    });
    if (!created.ok) throw new Error(JSON.stringify(created.violations));
    await renderEditor({ exerciseId: "occ-local" }, toSessionDraft(created.value));
    await press("activity-editor-edit-movement");
    fireEvent.changeText(instruction(), "Dos bien plat");
    await settle();
    await press("activity-editor-edit-movement");

    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(screen.queryByTestId("exercise-exit-confirm-card")).toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
    expect(pencil().props.accessibilityState).toMatchObject({ selected: false });
    expect(instruction().props.editable).toBe(false);
    expect(instruction().props.value).toBe("Dos bien plat");
    expect(occurrenceOf("occ-local").instruction).toBe("Dos bien plat");
    expect(currentDraft.movements?.["mov-local"]).toMatchObject({ change: "EDITED", description: "Dos bien plat" });
  });

  it("lecture du nombre d'utilisations en échec : aucun dialogue, édition ouverte, texte gardé, brouillon intact ; Terminer fonctionne ensuite", async () => {
    const { draft } = await sessionWithTwoSquats();
    const failure = jest
      .spyOn(ActivityDefinitionService.prototype, "countMovementUsage")
      .mockRejectedValueOnce(new Error("lecture impossible"));
    const silenced = jest.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      await renderEditor({ exerciseId: "occ-1" }, draft);
      await editAndRetouch("description", "Dos droit");
      expect(failure).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
      expect(pencil().props.accessibilityState).toMatchObject({ selected: true });
      expect(instruction().props.editable).not.toBe(false);
      expect(instruction().props.value).toBe("Dos droit");
      expect(updateCount).toBe(0);
      expect(currentDraft).toEqual(draft);

      await press("exercise-finish-action");
      await press("movement-save-confirm");
      expect(mockBack).toHaveBeenCalledTimes(1);
      expect(occurrenceOf("occ-2").instruction).toBe("Dos droit");
    } finally {
      failure.mockRestore();
      silenced.mockRestore();
    }
  });

  it("second cycle après « Créer un nouveau mouvement » : correction de la description, le Mouvement reste NEW, une seule entrée NEW", async () => {
    const { squats, draft } = await sessionWithTwoSquats();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await editAndRetouch("name", "Squats lents");
    await chooseNewMovement();
    const replacedId = currentDraft.exercises[0]!.id;
    const movementId = currentDraft.exercises[0]!.sourceMovementId!;

    await editAndRetouch("description", "Lentement");
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(pencil().props.accessibilityState).toMatchObject({ selected: false });
    expect(currentDraft.movements?.[movementId]).toMatchObject({ change: "NEW", name: "Squats lents", description: "Lentement" });
    expect(newEntries()).toHaveLength(1);
    expect(occurrenceOf(replacedId).instruction).toBe("Lentement");
    expect(currentDraft.movements?.[squats.movementId]).toBeUndefined();

    await press("exercise-finish-action");
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(currentDraft.movements?.[movementId]?.change).toBe("NEW");
  });

  it("second « Créer un nouveau mouvement » sur un Mouvement NEW : l'ancienne entrée NEW, plus référencée, est retirée", async () => {
    const { draft } = await sessionWithTwoSquats();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await editAndRetouch("name", "Squats lents");
    await chooseNewMovement();
    const firstMovementId = currentDraft.exercises[0]!.sourceMovementId!;

    await editAndRetouch("name", "Squats très lents");
    expect(within(screen.getByTestId("movement-save-dialog")).getByText(movementSave.choiceTitle)).toBeTruthy();
    await chooseNewMovement();
    const secondMovementId = currentDraft.exercises[0]!.sourceMovementId!;
    expect(secondMovementId).not.toBe(firstMovementId);
    expect(currentDraft.movements?.[firstMovementId]).toBeUndefined();
    expect(newEntries().map((movement) => movement.name)).toEqual(["Squats très lents"]);
    expect(currentDraft.exercises.map((exercise) => exercise.name)).toEqual(["Squats très lents", "Squats"]);
  });

  it("dialogue à deux choix au crayon, nom pris (casse seule) + « Créer un nouveau mouvement » : dialogue fermé, édition ouverte, rien d'inscrit", async () => {
    const { draft } = await sessionWithTwoSquats();
    await renderEditor({ exerciseId: "occ-1" }, draft);
    await editAndRetouch("name", "SQUATS");
    await chooseNewMovement();
    expect(screen.queryByTestId("movement-save-dialog")).toBeNull();
    expect(screen.getByTestId("movement-suggestion-message").props.children).toBe(
      editorStrings.movementSuggestion.nameTakenEdit,
    );
    expect(pencil().props.accessibilityState).toMatchObject({ selected: true });
    expect(nameInput().props.value).toBe("SQUATS");
    expect(updateCount).toBe(0);
    expect(currentDraft).toEqual(draft);
  });
});
