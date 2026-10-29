import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { useState, type ReactNode } from "react";

import type { CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Category } from "@/domain/categories/Category";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import {
  createEmptyDraft,
  type SessionDraft,
} from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { ExerciseScreen } from "@/features/sessions/ExerciseScreen";
import { SessionDraftContext, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
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

function LiveDraft({ initial, children }: { initial: SessionDraft; children: ReactNode }) {
  const [draft, setDraft] = useState(initial);
  const updateDraft = (update: SessionDraftUpdate) => {
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
const hintShown = () => screen.queryByTestId("exercise-name-hint", anyNode) !== null;

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

// PRE-9 (recette iPhone du 29/10 ; CE-MVT-01 §3, §13, DSF Mouvements l.67, ch13 l.268) : « crayon retouché » (R-10) retiré —
// depuis une Séance, le Mouvement repris reste en lecture seule, sans crayon (C04 remplacé sur ce point).
// Couverture du nouveau parcours : ExerciseScreen.sessionMovement.integration.test.tsx.
