import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react-native";
import { Keyboard, StyleSheet } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Category } from "@/domain/categories/Category";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { MOVEMENT_PHOTO_UNDER_CONTEXT } from "@/features/activities/ActivityEditorForm";
import { MOVEMENT_EDIT_MODE_PARAM, MovementScreen } from "@/features/activities/MovementScreen";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-8 story B.2 (CE-MVT-01, recette MVT-01, 04, 06, 09, 10, 11) — fiche Mouvement sur les VRAIS
 * services et une base SQLite réelle (`node:sqlite`). Ces tests ne valent pas recette sur iPhone :
 * gabarit photo, clavier, défilement et rendu restent à contrôler par Hermann.
 */

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));
let mockUuid = 0;
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => `uuid-${++mockUuid}`) }));

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
let mockSearchParams: Record<string, string> = {};
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ back: mockBack, push: mockPush, replace: mockReplace }),
    useLocalSearchParams: () => mockSearchParams,
  };
});
const mockExitGuard = jest.fn((_shouldBlock: boolean) => ({ isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() }));
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: (shouldBlock: boolean) => mockExitGuard(shouldBlock),
}));
const lastShouldBlock = () => mockExitGuard.mock.calls.at(-1)![0];

const NOW = "2026-10-27T09:00:00.000Z";
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
const t = strings.screens.movement;

let database: NodeSqliteDatabase;
let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
const movements = () => new SqliteMovementRepository(database, ids("grp"), () => NOW);
const service = () =>
  new ActivityDefinitionService(
    new SqliteActivityDefinitionRepository(database, ids("def"), () => NOW),
    undefined,
    new SqliteBodyZoneRepository(database),
    undefined,
    undefined,
    movements(),
  );

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  mockBack.mockReset();
  mockReplace.mockReset();
  mockPush.mockReset();
  mockExitGuard.mockClear();
  mockSearchParams = {};
});

afterEach(() => {
  database.close();
});

const movement = (id: string, name: string, overrides: Partial<Movement> = {}): Movement => ({
  id,
  name,
  description: null,
  media: [],
  categoryId: "cardio",
  bodyZoneIds: ["cuisses"],
  phases: [],
  nextPhaseId: 1,
  aliases: [],
  levelGroup: null,
  ...overrides,
});

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

async function settle(ms = 0) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

async function renderSheet(params: Record<string, string> = {}) {
  mockSearchParams = params;
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service()}>
        <ReferentialServiceContext.Provider value={fakeReferential()}>
          <ProfileServiceContext.Provider value={fakeProfile()}>
            <MovementScreen />
          </ProfileServiceContext.Provider>
        </ReferentialServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  await settle();
  await settle(20);
}

function cleanupRender() {
  cleanup();
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID, anyNode));
  });
  await settle(20);
}

async function type(testID: string, text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId(testID, anyNode), text);
  });
  await settle();
}

async function count(table: string): Promise<number> {
  return (await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`))!.count;
}

describe("PRE-8 B.2 — fiche Mouvement", () => {
  it("MVT-11 : gabarit photo, description et phases ; aucune carte Paramètres ni accordéon Médias ; pastille « Niveau »", async () => {
    await renderSheet();
    expect(screen.getByText(t.titles.create)).toBeTruthy();
    expect(screen.getByTestId("movement-photo-template", anyNode)).toBeTruthy();
    // Galerie du gabarit (l'ajout suit la capacité d'import du service, absente de cette doublure).
    expect(screen.getByTestId("media-gallery", anyNode)).toBeTruthy();
    expect(screen.getByTestId("movement-phases", anyNode)).toBeTruthy();
    expect(screen.getByTestId("movement-phases-invite", anyNode).props.placeholder).toBe(t.phases.firstPlaceholder);
    expect(screen.queryByTestId("exercise-section-parameters", anyNode)).toBeNull();
    expect(screen.queryByTestId("activity-editor-section-media", anyNode)).toBeNull();
    expect(screen.getByText(strings.screens.activities.editor.levelMenu.unsetLabel, anyNode)).toBeTruthy();
  });

  it("MVT-01 et MVT-09 : saisie des phases (libellés seuls, identités successives) ; Terminer indisponible sans Catégorie", async () => {
    await renderSheet();
    await type("exercise-name-input", "Burpees");
    // Catégorie et Zones sont exigées par les règles existantes : posées directement sur le brouillon
    // par les feuilles réelles serait long ; on vérifie ici le contrat de Terminer.
    expect(screen.getByTestId("movement-finish-action", anyNode).props.accessibilityState).toMatchObject({ disabled: true });
    await type("movement-phases-invite", "Descente");
    // Le focus passe sur la phase créée ; l'invite suivante n'apparaît qu'en saisie dans le bloc.
    await act(async () => {
      fireEvent(screen.getByTestId("movement-phases-label-1", anyNode), "focus");
    });
    await type("movement-phases-invite", "Saut");
    expect(screen.getByTestId("movement-phases-label-2", anyNode).props.value).toBe("Saut");
    expect(lastShouldBlock()).toBe(true);
  });

  it("MVT-04 : consultation en lecture seule, crayon → édition ; aucun doublon", async () => {
    await movements().create(movement("m1", "Pompes", { phases: [{ id: 1, label: "Descente" }], nextPhaseId: 2 }));
    await renderSheet({ movementId: "m1" });
    expect(screen.getByText(t.titles.consult)).toBeTruthy();
    expect(screen.getByTestId("exercise-name-input", anyNode).props.editable).toBe(false);
    expect(screen.getByTestId("movement-phases-label-1", anyNode).props.children).toBe("Descente");
    expect(screen.getByTestId("movement-finish-action", anyNode).props.accessibilityState).toMatchObject({ disabled: true });
    await press("activity-editor-edit-movement");
    expect(screen.getByText(t.titles.edit)).toBeTruthy();
    expect(screen.getByTestId("exercise-name-input", anyNode).props.editable).toBe(true);
    expect(await count("movements")).toBe(1);
  });

  it("B.8 (Q6) : un Mouvement archivé n'est plus proposé à la saisie du nom", async () => {
    await movements().create(movement("gainage", "Gainage"));
    await movements().create(movement("gainage-lateral", "Gainage latéral"));
    await movements().archive("gainage-lateral");
    await renderSheet();
    await type("exercise-name-input", "Gainage");
    expect(screen.getByTestId("movement-suggestion-result-gainage", anyNode)).toBeTruthy();
    expect(screen.queryByTestId("movement-suggestion-result-gainage-lateral", anyNode)).toBeNull();
  });

  it("B.8 : la fiche d'un Mouvement archivé s'ouvre en consultation, sans crayon", async () => {
    await movements().create(movement("gainage-lateral", "Gainage latéral"));
    await movements().archive("gainage-lateral");
    await renderSheet({ movementId: "gainage-lateral" });
    expect(screen.getByText(t.titles.consult)).toBeTruthy();
    expect(screen.queryByTestId("activity-editor-edit-movement", anyNode)).toBeNull();
  });

  it("MVT-06 : sans changement, Terminer revient sans écrire ; contenu modifié sans usage : mise à jour silencieuse", async () => {
    await movements().create(movement("m1", "Pompes"));
    await renderSheet({ movementId: "m1" });
    await press("activity-editor-edit-movement");
    await press("movement-finish-action");
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("movement-save-dialog", anyNode)).toBeNull();

    await type("movement-phases-invite", "Montée");
    await press("movement-finish-action");
    expect(screen.queryByTestId("movement-save-dialog", anyNode)).toBeNull();
    expect((await movements().findById("m1"))!.phases).toEqual([{ id: 1, label: "Montée" }]);
  });

  it("MVT-06 : contenu modifié avec un Exercice lié → confirmation ; nom modifié → choix sans présélection, détail « Uniquement pour cet exercice » absent", async () => {
    await movements().create(movement("m1", "Pompes"));
    await new SqliteSessionRepository(database, ids("ses"), () => NOW).create({
      name: "Séance",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises: [{ type: "EXERCISE", structuralPosition: "IN_TOUR", executionParameters: durationParameters(30), postActivityRecoverySeconds: 0, sourceMovementId: "m1" }],
    });
    await renderSheet({ movementId: "m1" });
    await press("activity-editor-edit-movement");
    await type("movement-phases-invite", "Descente");
    await press("movement-finish-action");
    expect(screen.getByTestId("movement-save-dialog", anyNode)).toBeTruthy();
    expect(screen.queryByTestId("movement-save-choice-UPDATE", anyNode)).toBeNull();
    // Annuler : brouillon intact, aucune écriture.
    await press("movement-save-cancel");
    expect((await movements().findById("m1"))!.phases).toEqual([]);

    await type("exercise-name-input", "Pompes larges");
    await press("movement-finish-action");
    expect(screen.getByTestId("movement-save-choice-NEW_MOVEMENT", anyNode)).toBeTruthy();
    expect(screen.queryByText(strings.screens.activities.editor.movementSave.newMovementDetail, anyNode)).toBeNull();
    expect(screen.getByTestId("movement-save-confirm", anyNode).props.accessibilityState).toMatchObject({ disabled: true });
    await press("movement-save-choice-NEW_MOVEMENT");
    await press("movement-save-confirm");
    // Créer un nouveau mouvement : l'original et son Exercice restent inchangés.
    expect((await movements().findById("m1"))!.name).toBe("Pompes");
    expect(await count("movements")).toBe(2);
    expect(await database.getFirstAsync("SELECT source_movement_id FROM activities")).toEqual({ source_movement_id: "m1" });
    expect(mockBack).toHaveBeenCalled();
  });

  it("MVT-05 : « Ajouter un niveau » — formulaire vierge sauf Catégorie, Zones et nom commencé ; invite non persistée", async () => {
    await movements().create(movement("squat", "Squats", { description: "Buste droit", phases: [{ id: 1, label: "Descente" }], nextPhaseId: 2 }));
    await renderSheet({ variantOf: "squat", placement: "AFTER_ORIGIN" });
    expect(screen.getByTestId("exercise-name-input", anyNode).props.value).toBe("Squats");
    expect(screen.getByTestId("exercise-name-hint", anyNode)).toBeTruthy();
    expect(screen.queryByTestId("movement-phases-label-1", anyNode)).toBeNull();
    await type("exercise-name-input", "Squats sautés");
    expect(screen.queryByTestId("exercise-name-hint", anyNode)).toBeNull();
    await press("movement-finish-action");
    const families = await service().movementCatalogue!.listFamilies();
    expect(families[0]!.members.map((entry) => [entry.movement.name, entry.level])).toEqual([
      ["Squats", { rank: 1, total: 2 }],
      ["Squats sautés", { rank: 2, total: 2 }],
    ]);
    const created = families[0]!.members[1]!.movement;
    expect(created).toMatchObject({ description: null, phases: [], categoryId: "cardio", bodyZoneIds: ["cuisses"] });
  });

  it("MVT-10 : erreur d'enregistrement — saisie conservée, message affiché, nouvel essai possible", async () => {
    await movements().create(movement("m1", "Pompes"));
    await renderSheet({ movementId: "m1" });
    await press("activity-editor-edit-movement");
    await type("movement-phases-invite", "Descente");
    database.close();
    await press("movement-finish-action");
    expect(screen.getByTestId("movement-save-error", anyNode)).toBeTruthy();
    expect(screen.getByTestId("movement-phases-label-1", anyNode).props.value).toBe("Descente");
    expect(mockBack).not.toHaveBeenCalled();
    database = NodeSqliteDatabase.openInMemory();
  });
});

describe("PRE-8 — recette A/B : fiche et formulaire Mouvement", () => {
  it("F07 : `mode=edit` (Catalogue) ouvre la fiche directement en édition, sans crayon ; menu Niveau conservé", async () => {
    await movements().create(movement("m1", "Pompes", { phases: [{ id: 1, label: "Descente" }], nextPhaseId: 2 }));
    await renderSheet({ movementId: "m1", mode: MOVEMENT_EDIT_MODE_PARAM });
    expect(screen.getByText(t.titles.edit)).toBeTruthy();
    expect(screen.getByTestId("exercise-name-input", anyNode).props.editable).toBe(true);
    expect(screen.getByTestId("movement-phases-label-1", anyNode).props.value).toBe("Descente");
    expect(screen.queryByTestId("activity-editor-edit-movement", anyNode)).toBeNull();
    // Aucun changement : pas de garde d'abandon ; Terminer revient sans écrire.
    expect(lastShouldBlock()).toBe(false);
    await press("movement-finish-action");
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("F07 : sans `mode`, la fiche reste en consultation ; un Mouvement archivé reste en consultation même avec `mode=edit`", async () => {
    await movements().create(movement("m1", "Pompes"));
    await renderSheet({ movementId: "m1" });
    expect(screen.getByText(t.titles.consult)).toBeTruthy();
    cleanupRender();
    await movements().create(movement("old", "Gainage latéral"));
    await movements().archive("old");
    await renderSheet({ movementId: "old", mode: MOVEMENT_EDIT_MODE_PARAM });
    expect(screen.getByText(t.titles.consult)).toBeTruthy();
    expect(screen.getByTestId("exercise-name-input", anyNode).props.editable).toBe(false);
  });

  it("C01 et C02 : « Ajouter un niveau » ouvre le formulaire en édition, nom commencé sans rang ajouté, invite non persistée ; abandon sans création", async () => {
    await movements().create(movement("squat", "Squats"));
    await renderSheet({ variantOf: "squat", placement: "BEFORE_ORIGIN" });
    expect(screen.getByText(t.titles.create)).toBeTruthy();
    expect(screen.getByTestId("exercise-name-input", anyNode).props.value).toBe("Squats");
    expect(screen.getByTestId("exercise-name-input", anyNode).props.editable).toBe(true);
    expect(screen.queryByTestId("activity-editor-edit-movement", anyNode)).toBeNull();
    expect(screen.getByTestId("exercise-name-hint", anyNode)).toBeTruthy();
    // Recette A/B B.10 (remarque 7) : nom repris = nom existant — le reste de la fiche attend un nom
    // disponible ; une fois le nom complété, la fiche est modifiable.
    expect(screen.queryByTestId("movement-phases-invite", anyNode)).toBeNull();
    await type("exercise-name-input", "Squats sautés");
    expect(screen.getByTestId("movement-phases-invite", anyNode)).toBeTruthy();
    expect(await count("movements")).toBe(1);
  });

  it("F03 à F06 : « Description du mouvement » ; phases en liste d'étapes (sans tableau ni durée) ; libellé limité à 20 points de code", async () => {
    await renderSheet();
    expect(screen.getByTestId("activity-editor-description-title", anyNode).props.children).toBe(t.descriptionTitle);
    expect(screen.getByTestId("movement-phases-title", anyNode).props.children).toBe(t.phases.title);
    const titleStyle = StyleSheet.flatten(screen.getByTestId("movement-phases-title", anyNode).props.style);
    const descriptionStyle = StyleSheet.flatten(screen.getByTestId("activity-editor-description-title", anyNode).props.style);
    expect(titleStyle).toMatchObject({ fontSize: 11, fontFamily: descriptionStyle.fontFamily, color: descriptionStyle.color });
    expect(descriptionStyle.fontSize).toBe(11);
    // Aucune poignée ni croix de ligne de tableau.
    await type("movement-phases-invite", "Descente");
    expect(screen.queryByTestId("movement-phases-row-1-handle", anyNode)).toBeNull();
    expect(screen.queryByTestId("movement-phases-remove-1", anyNode)).toBeNull();
    // 20 points de code admis (emoji compté pour un), 21 refusés : le libellé reste inchangé.
    const twenty = "Descente contrôlée 😀";
    expect([...twenty].length).toBe(20);
    await type("movement-phases-label-1", twenty);
    expect(screen.getByTestId("movement-phases-label-1", anyNode).props.value).toBe(twenty);
    await type("movement-phases-label-1", `${twenty}!`);
    expect(screen.getByTestId("movement-phases-label-1", anyNode).props.value).toBe(twenty);
    // Retour arrière sur une phase vide : retrait (règle de la Description).
    await type("movement-phases-label-1", "");
    await act(async () => {
      fireEvent(screen.getByTestId("movement-phases-label-1", anyNode), "keyPress", { nativeEvent: { key: "Backspace" } });
    });
    expect(screen.queryByTestId("movement-phases-label-1", anyNode)).toBeNull();
  });

  it("F01, F02 : gabarit photo hors du défilement, sous la zone de contexte (recouvrement 21), présent sans média", async () => {
    await renderSheet();
    const template = screen.getByTestId("movement-photo-template", anyNode);
    expect(StyleSheet.flatten(template.props.style)).toMatchObject({ marginTop: -MOVEMENT_PHOTO_UNDER_CONTEXT });
    expect(StyleSheet.flatten(template.props.style).height).toBeGreaterThan(0);
    expect(within(screen.getByTestId("exercise-body", anyNode)).queryByTestId("movement-photo-template", anyNode)).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId("exercise-context-band", anyNode).props.style)).toMatchObject({ backgroundColor: "transparent", zIndex: 1 });
    expect(screen.getByTestId("movement-context-band-fill", anyNode)).toBeTruthy();
    expect(screen.queryByTestId("exercise-context-band-fade", anyNode)).toBeNull();
  });

  it("A02 : titre de la fiche en Inter Medium 17", async () => {
    await renderSheet();
    const title = screen.getByText(t.titles.create);
    expect(StyleSheet.flatten(title.props.style)).toMatchObject({ fontFamily: "Inter_500Medium", fontSize: 17 });
  });
});

describe("Recette A/B B.10 — fiche Mouvement", () => {
  it("remarque 5 : curseur dans le Nom à l'ouverture d'une création, pas en consultation", async () => {
    await renderSheet();
    expect(screen.getByTestId("exercise-name-input", anyNode).props.autoFocus).toBe(true);
    cleanupRender();
    await movements().create(movement("squat", "Squats"));
    await renderSheet({ movementId: "squat" });
    expect(screen.getByTestId("exercise-name-input", anyNode).props.autoFocus).toBe(false);
  });

  it("b2-5 : nom déjà utilisé — message, Entrée garde le Nom, reste de la fiche non modifiable ; panneau sous la zone de contexte, au-dessus d'elle", async () => {
    await movements().create(movement("squat", "Squats"));
    await renderSheet();
    await type("exercise-name-input", "squats");
    expect(screen.getByTestId("movement-suggestion-message", anyNode).props.children).toBe(
      strings.screens.activities.editor.movementSuggestion.nameTaken,
    );
    expect(screen.getByTestId("exercise-name-input", anyNode).props.submitBehavior).toBe("submit");
    expect(screen.getByTestId("exercise-name-input", anyNode).props.editable).toBe(true);
    expect(screen.getByTestId("exercise-instruction-input", anyNode).props.editable).toBe(false);
    expect(screen.queryByTestId("movement-phases-invite", anyNode)).toBeNull();
    expect(screen.getByTestId("activity-editor-category-button", anyNode).props.accessibilityState).toMatchObject({ disabled: true });
    expect(StyleSheet.flatten(screen.getByTestId("exercise-name-assist-host", anyNode).props.style)).toMatchObject({ zIndex: 2 });
    expect(screen.getByTestId("movement-finish-action", anyNode).props.accessibilityState).toMatchObject({ disabled: true });
    // Nom disponible : la fiche redevient modifiable, Entrée termine de nouveau la saisie.
    await type("exercise-name-input", "Squats lents");
    expect(screen.getByTestId("exercise-name-input", anyNode).props.submitBehavior).toBeUndefined();
    expect(screen.getByTestId("exercise-instruction-input", anyNode).props.editable).toBe(true);
    expect(screen.getByTestId("movement-phases-invite", anyNode)).toBeTruthy();
  });

  it("remarque 6 : cartes de résultat « Ajouter un niveau » et « Ouvrir ce mouvement »", async () => {
    await movements().create(movement("squat", "Squats"));
    await renderSheet();
    await type("exercise-name-input", "Squats");
    const card = screen.getByTestId("movement-suggestion-result-squat", anyNode);
    expect(within(card).getByText(t.suggestion.createVariant, anyNode)).toBeTruthy();
    expect(within(card).getByText(t.suggestion.useMovement, anyNode)).toBeTruthy();
    expect(screen.getByTestId("movement-suggestion-result-squat-use", anyNode).props.accessibilityLabel).toBe("Ouvrir ce mouvement, Squats");
    await press("movement-suggestion-result-squat-use");
    expect(mockReplace).toHaveBeenCalledWith({ pathname: "/movement", params: { movementId: "squat" } });
  });

  it("remarque 7 : nouveau niveau — recherche de mouvement similaire et blocage du nom déjà utilisé", async () => {
    await movements().create(movement("squat", "Squats"));
    await movements().create(movement("pompes", "Pompes"));
    await renderSheet({ variantOf: "squat", placement: "AFTER_ORIGIN" });
    // Nom repris : invite « (compléter le nom) », aucun panneau.
    expect(screen.queryByTestId("movement-suggestion-panel", anyNode)).toBeNull();
    await type("exercise-name-input", "Pompes");
    expect(screen.getByTestId("movement-suggestion-message", anyNode)).toBeTruthy();
    expect(screen.getByTestId("movement-suggestion-result-pompes", anyNode)).toBeTruthy();
    expect(screen.getByTestId("exercise-instruction-input", anyNode).props.editable).toBe(false);
    expect(screen.getByTestId("movement-finish-action", anyNode).props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("KBD-01 à KBD-07 : clavier — média et contexte fixes, la couche éditable remonte devant le média puis redescend", async () => {
    // Évènements clavier capturés (iOS : `Will`), durée native 250.
    const listeners = new Map<string, Set<(event: unknown) => void>>();
    const spy = jest.spyOn(Keyboard, "addListener").mockImplementation(((name: string, listener: (event: unknown) => void) => {
      const set = listeners.get(name) ?? new Set<(event: unknown) => void>();
      set.add(listener);
      listeners.set(name, set);
      return { remove: () => set.delete(listener) };
    }) as unknown as typeof Keyboard.addListener);
    const emit = (name: string) =>
      act(() => listeners.get(name)?.forEach((listener) => listener({ endCoordinates: { screenX: 0, screenY: 500, width: 390, height: 344 }, duration: 250, easing: "keyboard" })));
    try {
      await renderSheet();
      const photoStyle = () => StyleSheet.flatten(screen.getByTestId("movement-photo-template", anyNode).props.style);
      // Le simulacre Jest de Reanimated ne conserve pas la valeur animée : l’état de remontée est lu
      // sur la couche (`-lifted`) ; le déplacement lui-même se vérifie sur l’iPhone.
      const isLifted = () => screen.queryByTestId("movement-editable-layer-lifted", anyNode) !== null;
      const resting = photoStyle();
      const layer = screen.getByTestId("movement-editable-layer", anyNode);
      // Couches séparées : le média n'est pas dans la couche éditable ; Description et Phases y sont.
      expect(within(layer).queryByTestId("movement-photo-template", anyNode)).toBeNull();
      expect(within(layer).getByTestId("exercise-section-description", anyNode)).toBeTruthy();
      expect(within(layer).getByTestId("movement-section-phases", anyNode)).toBeTruthy();
      expect(StyleSheet.flatten(layer.props.style).backgroundColor).toBe("rgba(255, 255, 255, 0.9)");
      expect(isLifted()).toBe(false);
      // KBD-02 : focus d'une étape → la couche remonte jusqu'au bas de la zone de contexte.
      await act(async () => {
        fireEvent(screen.getByTestId("exercise-instruction-input", anyNode), "focus");
      });
      emit("keyboardWillShow");
      await settle(300);
      expect(isLifted()).toBe(true);
      expect(photoStyle()).toEqual(resting);
      // KBD-05 : passage aux Phases, clavier ouvert — aucune nouvelle translation.
      await act(async () => {
        fireEvent(screen.getByTestId("exercise-instruction-input", anyNode), "blur");
        fireEvent(screen.getByTestId("movement-phases-invite", anyNode), "focus");
      });
      await settle(300);
      expect(isLifted()).toBe(true);
      // KBD-06 : fermeture du clavier → disposition normale, média inchangé, saisie conservée.
      await type("movement-phases-invite", "Descente");
      emit("keyboardWillHide");
      await settle(300);
      expect(isLifted()).toBe(false);
      expect(photoStyle()).toEqual(resting);
      expect(screen.getByTestId("movement-phases-label-1", anyNode).props.value).toBe("Descente");
      // Clavier rouvert, Phase toujours active (aucun nouveau focus) : la couche remonte.
      emit("keyboardWillShow");
      await settle(300);
      expect(isLifted()).toBe(true);
      emit("keyboardWillHide");
      await settle(300);
      await act(async () => {
        fireEvent(screen.getByTestId("movement-phases-label-1", anyNode), "blur");
      });
      // Le Nom n'entraîne pas la couche.
      await act(async () => {
        fireEvent(screen.getByTestId("exercise-name-input", anyNode), "focus");
      });
      emit("keyboardWillShow");
      await settle(300);
      expect(isLifted()).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });

  it("recette du 27/10 (remarque 2) : Entrée sur une phase ouvre la suivante juste après elle, comme la Description", async () => {
    await renderSheet();
    await type("movement-phases-invite", "Descente");
    // Bloc en saisie (la phase créée a le focus) : l'invite reste en fin de liste.
    await act(async () => {
      fireEvent(screen.getByTestId("movement-phases-label-1", anyNode), "focus");
    });
    await type("movement-phases-invite", "Remontée");
    expect(screen.getByTestId("movement-phases-label-1", anyNode).props.returnKeyType).toBe("default");
    // Entrée sur la phase 1 : l'invite se place sous elle ; la saisie y insère la nouvelle phase.
    await act(async () => {
      fireEvent(screen.getByTestId("movement-phases-label-1", anyNode), "focus");
      fireEvent(screen.getByTestId("movement-phases-label-1", anyNode), "submitEditing");
    });
    await type("movement-phases-invite", "Maintien");
    expect([1, 2, 3].map((rank) => screen.getByTestId(`movement-phases-label-${rank}`, anyNode).props.value)).toEqual([
      "Descente",
      "Maintien",
      "Remontée",
    ]);
  });

  it("r11-entree-phases : l'invite insérée garde son champ pendant la saisie ; retirer une phase vidée la retire", async () => {
    await renderSheet();
    await type("movement-phases-invite", "Descente");
    await act(async () => {
      fireEvent(screen.getByTestId("movement-phases-label-1", anyNode), "focus");
    });
    await type("movement-phases-invite", "Remontée");
    await act(async () => {
      fireEvent(screen.getByTestId("movement-phases-label-1", anyNode), "focus");
      fireEvent(screen.getByTestId("movement-phases-label-1", anyNode), "submitEditing");
    });
    // Invite sous la phase 1 : la saisie y crée la phase 2 sans démonter le champ de l'invite, qui reste
    // juste sous la phase créée.
    const invite = screen.getByTestId("movement-phases-invite", anyNode);
    await type("movement-phases-invite", "Maintien");
    expect(screen.getByTestId("movement-phases-invite", anyNode)).toBe(invite);
    // Retour arrière sur une phase vidée : elle est retirée (le focus passe d'abord à la précédente ;
    // l'absence de fermeture du clavier se vérifie sur l'iPhone).
    await type("movement-phases-label-2", "");
    await act(async () => {
      fireEvent(screen.getByTestId("movement-phases-label-2", anyNode), "keyPress", { nativeEvent: { key: "Backspace" } });
    });
    expect([1, 2].map((rank) => screen.getByTestId(`movement-phases-label-${rank}`, anyNode).props.value)).toEqual(["Descente", "Remontée"]);
  });

  it("r11-remontee : clavier ouvert, la couche ne redescend pas d'un champ à l'autre et la zone de contexte ne fait que fermer le clavier", async () => {
    const listeners = new Map<string, Set<(event: unknown) => void>>();
    const spy = jest.spyOn(Keyboard, "addListener").mockImplementation(((name: string, listener: (event: unknown) => void) => {
      const set = listeners.get(name) ?? new Set<(event: unknown) => void>();
      set.add(listener);
      listeners.set(name, set);
      return { remove: () => set.delete(listener) };
    }) as unknown as typeof Keyboard.addListener);
    const dismiss = jest.spyOn(Keyboard, "dismiss");
    const emit = (name: string) =>
      act(() => listeners.get(name)?.forEach((listener) => listener({ endCoordinates: { screenX: 0, screenY: 500, width: 390, height: 344 }, duration: 250, easing: "keyboard" })));
    try {
      await renderSheet();
      const isLifted = () => screen.queryByTestId("movement-editable-layer-lifted", anyNode) !== null;
      const shield = () => screen.queryByTestId("movement-context-keyboard-shield", anyNode);
      expect(shield()).toBeNull();
      await act(async () => {
        fireEvent(screen.getByTestId("exercise-instruction-input", anyNode), "focus");
      });
      emit("keyboardWillShow");
      await settle(300);
      expect(isLifted()).toBe(true);
      // Nom, Catégorie, Zones et Niveau recouverts : un toucher ferme seulement le clavier.
      const band = screen.getByTestId("exercise-context-band", anyNode);
      expect(within(band).getByTestId("movement-context-keyboard-shield", anyNode)).toBeTruthy();
      // Phases puis retour sur la Description, clavier ouvert : la couche reste remontée.
      await act(async () => {
        fireEvent(screen.getByTestId("exercise-instruction-input", anyNode), "blur");
        fireEvent(screen.getByTestId("movement-phases-invite", anyNode), "focus");
      });
      await type("movement-phases-invite", "Descente");
      await act(async () => {
        fireEvent(screen.getByTestId("movement-phases-label-1", anyNode), "blur");
        fireEvent(screen.getByTestId("exercise-instruction-input", anyNode), "focus");
      });
      await settle(300);
      expect(isLifted()).toBe(true);
      dismiss.mockClear();
      await act(async () => {
        fireEvent.press(shield()!);
      });
      expect(dismiss).toHaveBeenCalled();
      emit("keyboardWillHide");
      await settle(300);
      expect(isLifted()).toBe(false);
      expect(shield()).toBeNull();
      // r12-limite : la réserve basse mesurée atteint bien la vue (bas de couche non mesuré sous Jest :
      // haut du clavier fictif à -300 pour une réserve de 300).
      act(() => listeners.get("keyboardWillShow")?.forEach((listener) => listener({ endCoordinates: { screenX: 0, screenY: -300, width: 390, height: 344 }, duration: 250, easing: "keyboard" })));
      expect(StyleSheet.flatten(screen.getByTestId("editor-keyboard-reserve", anyNode).props.style).paddingBottom).toBe(300);
      // r13-limite : clavier ouvert, le défilement s'arrête à 12 sous la dernière ligne (aucune réserve de zone d'action).
      expect(StyleSheet.flatten(screen.getByTestId("exercise-body", anyNode).props.contentContainerStyle).paddingBottom).toBe(12);
      emit("keyboardWillHide");
      expect(StyleSheet.flatten(screen.getByTestId("exercise-body", anyNode).props.contentContainerStyle).paddingBottom).toBeGreaterThan(12);
    } finally {
      spy.mockRestore();
      dismiss.mockRestore();
    }
  });

  it("b2-4 : ↑ des Phases pendant leur saisie, qui ferme seulement le clavier", async () => {
    await renderSheet();
    expect(screen.queryByTestId("movement-phases-submit", anyNode)).toBeNull();
    await act(async () => {
      fireEvent(screen.getByTestId("movement-phases-invite", anyNode), "focus");
    });
    const submit = screen.getByTestId("movement-phases-submit", anyNode);
    expect(submit.props.accessibilityLabel).toBe(t.phasesSubmitAccessibilityLabel);
    await act(async () => {
      fireEvent(screen.getByTestId("movement-phases-invite", anyNode), "blur");
    });
    await settle(5);
    expect(screen.queryByTestId("movement-phases-submit", anyNode)).toBeNull();
  });

  it("q6-2 : Mouvement archivé — « (archivé) » après le nom, en consultation", async () => {
    await movements().create(movement("squat", "Squats"));
    await movements().archive("squat");
    await renderSheet({ movementId: "squat", mode: MOVEMENT_EDIT_MODE_PARAM });
    expect(screen.getByTestId("exercise-name-hint", anyNode)).toBeTruthy();
    expect(screen.getByText(` ${t.archivedNameSuffix}`, anyNode)).toBeTruthy();
    expect(screen.getByTestId("exercise-name-input", anyNode).props.editable).toBe(false);
  });
});
