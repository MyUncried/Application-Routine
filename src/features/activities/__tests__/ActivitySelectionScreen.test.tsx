import { fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import type { ActivityDefinition } from "@/domain/activities";
import * as Crypto from "expo-crypto";

import {
  allFailureParameters,
  durationParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { catalogueDuration } from "@/features/activities/ActivityCard";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivitySelectionScreen } from "@/features/activities/ActivitySelectionScreen";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

/** V2-PRE-2 (D-171/D-213) : `ActivitySelectionScreen` lit le Profil une seule fois au montage — doublé minimal. */
function fakeProfileService(overrides: Partial<ProfileService> = {}): ProfileService {
  return {
    getProfile: jest.fn(async () => createDefaultProfile("profile-1", "2026-01-01T00:00:00.000Z")),
    ...overrides,
  } as unknown as ProfileService;
}

const mockBack = jest.fn();

/**
 * `ActivitySelectionScreen` s'auto-alimente en Zones corporelles persistées
 * via `ActivityDefinitionService.listBodyZones()` (V2-PRE-1, plan §3.1,
 * UI-9C227EDDE427 ; correction device check Hermann, commentaire 5948936550
 * — un accès direct à `useSQLiteContext` levait TOUJOURS en production, cet
 * écran étant rendu hors de `<SQLiteProvider>`) — doublé ici via
 * `ActivityDefinitionServiceContext`, jamais `expo-sqlite`/
 * `SqliteBodyZoneRepository`.
 */
const BODY_ZONE_FIXTURES: readonly BodyZone[] = [
  { id: "cuisses", name: "Cuisses", isActive: true, createdAt: "2026-01-01T00:00:06.000Z" },
  { id: "dos", name: "Dos", isActive: true, createdAt: "2026-01-01T00:00:04.000Z" },
];

// `jest-expo` ne fournit aucune implémentation par défaut de
// `Crypto.randomUUID()` (`undefined` sous ce preset) — même contrainte déjà
// documentée par `SqliteSessionRepository.test.ts`. Un compteur garantit un
// identifiant DISTINCT par appel, nécessaire pour prouver que chaque copie
// reçoit un nouvel identifiant. Déclaré à l'intérieur de la factory
// elle-même (jamais hors-portée) — `babel-plugin-jest-hoist` interdit toute
// référence à une variable externe non préfixée `mock`.
jest.mock("expo-crypto", () => {
  let counter = 0;
  return {
    randomUUID: jest.fn(() => `generated-id-${++counter}`),
  };
});

// `require()` à l'intérieur de la factory (pas un `import` statique) :
// `babel-plugin-jest-hoist` interdit toute référence hors-portée dans une
// factory `jest.mock`, sauf variables préfixées `mock` ou modules chargés à
// l'intérieur de la factory elle-même — même patron que
// `SessionServiceProvider.test.tsx`.
/** Expose le dernier callback `useFocusEffect` capturé — permet de simuler un second focus (ex. retour d'un aller-retour) dans un test. */
const focusEffectHarness: { effect: (() => (() => void) | void) | null } = { effect: null };

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactActual = require("react") as typeof import("react");
  return {
    useRouter: () => ({ back: mockBack }),
    useFocusEffect: (callback: () => void | (() => void)) => {
      focusEffectHarness.effect = callback;
      ReactActual.useEffect(() => callback(), []);
    },
  };
});

function makeDefinition(
  id: string,
  name: string,
  overrides: Partial<ActivityDefinition> = {},
): ActivityDefinition {
  return {
    id,
    name,
    description: null,
    executionParameters: durationParameters(30, 2, 5),
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
    sideMode: "UNILATERAL",
    sideRecoverySeconds: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderScreen(
  definitions: readonly ActivityDefinition[],
  updateDraft = jest.fn<(patch: Partial<SessionDraft>) => void>(),
  serviceOverrides: Partial<ActivityDefinitionService> = {},
) {
  const service: Partial<ActivityDefinitionService> = {
    listActivityDefinitions: jest
      .fn<ActivityDefinitionService["listActivityDefinitions"]>()
      .mockResolvedValue(definitions),
    listBodyZones: jest
      .fn<ActivityDefinitionService["listBodyZones"]>()
      .mockResolvedValue(BODY_ZONE_FIXTURES),
    ...serviceOverrides,
  };
  const draftValue = {
    draft: createEmptyDraft(),
    updateDraft,
    resetDraft: jest.fn(),
  };
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service as ActivityDefinitionService}>
        <ProfileServiceContext.Provider value={fakeProfileService()}>
          <SessionDraftContext.Provider value={draftValue}>
            <ActivitySelectionScreen />
          </SessionDraftContext.Provider>
        </ProfileServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  return { updateDraft };
}

describe("ActivitySelectionScreen", () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it("disables Ajouter when nothing is selected", async () => {
    renderScreen([makeDefinition("a", "Squat")]);
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());
    const addButton = screen.getByTestId("activity-selection-add");
    expect(addButton.props.accessibilityState.disabled).toBe(true);
  });

  it("closes without any mutation on Annuler", async () => {
    const { updateDraft } = renderScreen([makeDefinition("a", "Squat")]);
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());

    fireEvent.press(screen.getByTestId("activity-selection-cancel"));

    expect(updateDraft).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  /**
   * V2-CAT-01 (UI-CAT-R-003), VISUAL_CORRECTION (revue indépendante
   * 5753653735, point 2) : libellé EXACT `Ajouter 1 activité` /
   * `Ajouter X activités` — jamais un compteur entre parenthèses.
   */
  it("shows the exact dynamic CTA label — Ajouter 1 activité / Ajouter X activités", async () => {
    renderScreen([makeDefinition("a", "Squat"), makeDefinition("b", "Fentes")]);
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());

    expect(screen.getByTestId("activity-selection-add-label").props.children).toBe("Ajouter");

    fireEvent.press(screen.getByTestId("activity-selection-row-a"));
    expect(screen.getByTestId("activity-selection-add-label").props.children).toBe(
      "Ajouter 1 exercice",
    );

    fireEvent.press(screen.getByTestId("activity-selection-row-b"));
    expect(screen.getByTestId("activity-selection-add-label").props.children).toBe(
      "Ajouter 2 exercices",
    );
  });

  /** V2-CAT-01 (UI-CAT-R-003) : carte détaillée + checkbox vectorielle TOUJOURS visible. */
  it("shows a detailed card (body zones, mode/target/series/pause) and an always-visible vector checkbox", async () => {
    renderScreen([makeDefinition("a", "Squat", { bodyZoneIds: ["dos"] })]);
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());

    expect(await screen.findByTestId("activity-selection-row-body-zones-a")).toBeTruthy();
    expect(screen.getByText(/série/u)).toBeTruthy();

    const checkbox = screen.getByTestId("activity-selection-row-checkbox-a");
    expect(checkbox).toBeTruthy();
    expect(screen.queryByTestId("activity-selection-row-checked-a")).toBeNull();

    fireEvent.press(screen.getByTestId("activity-selection-row-a"));
    expect(screen.getByTestId("activity-selection-row-checkbox-a")).toBeTruthy();
    expect(screen.getByTestId("activity-selection-row-checked-a")).toBeTruthy();
  });

  /**
   * PRE-6 (story 2.2, contexte « Choix composition » `8328:28445`, ch13 PR #390) :
   * Catégorie et Zones sur une seule ligne (zones tronquées), icône neutre de changement
   * de côté 8 après le texte si l'exercice en a un, durée totale à 8 du sablier dans une
   * réserve de 68 alignée à gauche.
   */
  it("PRE6-2.2 — Choix composition: Category · zones on one line, side-change icon, hourglass + duration in a 68 reserve", async () => {
    const listCategories = jest.fn<ActivityDefinitionService["listCategories"]>().mockResolvedValue([
      {
        id: "cardio",
        name: "Cardio",
        canonicalKey: "cardio",
        color: "#2E9B62",
        isPredefined: true,
        displayOrder: 1,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    const fentes = makeDefinition("a", "Fentes", { bodyZoneIds: ["cuisses", "dos"], sideMode: "RIGHT_LEFT" });
    renderScreen(
      [
        fentes,
        makeDefinition("b", "Squat", { categoryId: undefined, bodyZoneIds: [] }),
      ],
      undefined,
      { listCategories },
    );
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());

    const zones = await screen.findByTestId("activity-selection-row-body-zones-a");
    expect(zones.props.children).toBe("Cuisses · Dos");
    await waitFor(() => expect(screen.getByText("Cardio")).toBeTruthy());
    const classification = screen.getByTestId("activity-selection-row-classification-a");
    expect(StyleSheet.flatten(classification.props.style)).toMatchObject({ flexDirection: "row", gap: 8 });
    expect(screen.getByTestId("activity-selection-row-category-dot-a")).toBeTruthy();
    const sideChange = screen.getByTestId("activity-selection-row-side-change-a");
    expect(StyleSheet.flatten(sideChange.props.style)).toMatchObject({ width: 16, height: 16 });
    expect(screen.queryByTestId("activity-selection-row-side-change-b")).toBeNull();
    expect(screen.queryByText(/D→G|G→D/)).toBeNull();
    // Aucune Catégorie, aucune zone, unilatéral : aucune ligne de classement (hauteur inchangée).
    expect(screen.queryByTestId("activity-selection-row-classification-b")).toBeNull();

    const duration = screen.getByTestId("activity-selection-row-duration-a");
    expect(StyleSheet.flatten(duration.props.style)).toMatchObject({ flexDirection: "row", gap: 8 });
    // Même durée que le Catalogue (`catalogueDuration`).
    const durationText = within(duration).getByText(catalogueDuration(fentes)!);
    // Réserve d'au moins 68, jamais une largeur fixe qui tronquerait une durée plus longue.
    expect(StyleSheet.flatten(durationText.props.style)).toMatchObject({ minWidth: 68, textAlign: "left" });
    expect(StyleSheet.flatten(durationText.props.style).width).toBeUndefined();
  });

  /**
   * VISUAL_CORRECTION (revue indépendante 5753653735, point 2) : carte
   * alignée sur la carte canonique `ActivityCard.tsx` — barre gauche,
   * contour sélectionné conforme au patron DSF déjà établi
   * (`CategoriesScreen.tagSelected`, écran supprimé par Q54). V2-PRE-1 (plan §3.1,
   * UI-9C227EDDE427) : aucune sous-carte Récupération — une
   * `ActivityDefinition` ne porte plus cette notion.
   */
  it("shows the left color bar and the canonical selected outline, without any Récupération sub-card", async () => {
    renderScreen([makeDefinition("a", "Squat")]);
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());

    expect(screen.getByTestId("activity-selection-row-color-bar-a")).toBeTruthy();
    expect(screen.queryByTestId("activity-selection-row-recovery-a")).toBeNull();
    expect(screen.queryByText(/Récupération/u)).toBeNull();

    const rowBefore = screen.getByTestId("activity-selection-row-a");
    expect(StyleSheet.flatten(rowBefore.props.style).borderColor).toBe(colors.border);

    fireEvent.press(rowBefore);

    const rowAfter = screen.getByTestId("activity-selection-row-a");
    expect(StyleSheet.flatten(rowAfter.props.style).borderColor).toBe(colors.selection);
    expect(StyleSheet.flatten(rowAfter.props.style).backgroundColor).toBe(colors.selectionSurface);
    expect(
      StyleSheet.flatten(screen.getByTestId("activity-selection-row-checkbox-a").props.style)
        .borderColor,
    ).toBe(colors.selection);
  });

  /**
   * V2-CAT-01 (UI-CAT-R-003, revue indépendante 35529973203) : retrait et
   * recalcul des identifiants obsolètes — une définition sélectionnée
   * disparaît d'un rechargement ultérieur (aller-retour) ; le compteur/CTA
   * se recalcule sans jamais inclure cet identifiant, la validation ne peut
   * jamais le transmettre, ET une information EXPLICITE/VISIBLE l'annonce
   * (jamais un retrait silencieux).
   */
  it("prunes a stale selected id once the list refreshes without it, recalculating the counter/CTA and showing an explicit notice", async () => {
    const listActivityDefinitions = jest
      .fn<ActivityDefinitionService["listActivityDefinitions"]>()
      .mockResolvedValueOnce([makeDefinition("a", "Squat"), makeDefinition("b", "Fentes")])
      .mockResolvedValueOnce([makeDefinition("b", "Fentes")]);
    const service: Partial<ActivityDefinitionService> = {
      listActivityDefinitions,
      listBodyZones: jest
        .fn<ActivityDefinitionService["listBodyZones"]>()
        .mockResolvedValue(BODY_ZONE_FIXTURES),
    };
    const updateDraft = jest.fn<(patch: Partial<SessionDraft>) => void>();
    render(
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider value={service as ActivityDefinitionService}>
          <ProfileServiceContext.Provider value={fakeProfileService()}>
            <SessionDraftContext.Provider
              value={{ draft: createEmptyDraft(), updateDraft, resetDraft: jest.fn() }}
            >
              <ActivitySelectionScreen />
            </SessionDraftContext.Provider>
          </ProfileServiceContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());
    expect(screen.queryByTestId("activity-selection-stale-notice")).toBeNull();

    fireEvent.press(screen.getByTestId("activity-selection-row-a"));
    fireEvent.press(screen.getByTestId("activity-selection-row-b"));
    expect(screen.getByTestId("activity-selection-add-label").props.children).toBe(
      "Ajouter 2 exercices",
    );

    // Aller-retour : la liste se recharge SANS `a` (supprimée par ailleurs).
    if (!focusEffectHarness.effect) {
      throw new Error("No useFocusEffect callback captured yet.");
    }
    focusEffectHarness.effect();
    await waitFor(() =>
      expect(screen.getByTestId("activity-selection-add-label").props.children).toBe(
        "Ajouter 1 exercice",
      ),
    );
    expect(screen.queryByTestId("activity-selection-row-a")).toBeNull();

    // Information EXPLICITE et VISIBLE — jamais un simple retrait silencieux.
    expect(screen.getByTestId("activity-selection-stale-notice")).toBeTruthy();
    expect(
      screen.getByText("1 activité sélectionnée n’est plus disponible et a été retirée de la sélection."),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("activity-selection-add"));
    expect(updateDraft).toHaveBeenCalledTimes(1);
    expect(updateDraft.mock.calls[0][0].exercises).toHaveLength(1);
    expect(updateDraft.mock.calls[0][0].exercises?.[0]?.name).toBe("Fentes");
  });

  it("inserts copies atomically in list order, independent of touch order", async () => {
    const { updateDraft } = renderScreen([
      makeDefinition("a", "Squat"),
      makeDefinition("b", "Fentes"),
    ]);
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());

    // Touch order: b then a — insertion order must still follow the list (a, b).
    fireEvent.press(screen.getByTestId("activity-selection-row-b"));
    fireEvent.press(screen.getByTestId("activity-selection-row-a"));
    fireEvent.press(screen.getByTestId("activity-selection-add"));

    expect(updateDraft).toHaveBeenCalledTimes(1);
    const patch = updateDraft.mock.calls[0][0];
    const exercises = patch.exercises ?? [];
    expect(exercises).toHaveLength(2);
    expect(exercises[0]?.name).toBe("Squat");
    expect(exercises[1]?.name).toBe("Fentes");
    expect(exercises[0]?.id).not.toBe(exercises[1]?.id);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  /**
   * PRE-3 (spécification du 07/10, P3-13/no-auto-R) — remplace l'ancien
   * attendu V2-PRE-2 (copie de la Récupération du Profil) : une nouvelle
   * occurrence ne reçoit AUCUNE Récupération automatique ; le défaut du
   * Profil (45 s ici) ne sert qu'à l'ajout explicite (PRE-4). La copie est
   * complète (paramètres canoniques, Catégorie, médias ordonnés).
   */
  it("P3-13/no-auto-R — a new copy gets R = 0 s whatever the Profile default, and carries full parameters/category/media", async () => {
    const service: Partial<ActivityDefinitionService> = {
      listActivityDefinitions: jest
        .fn<ActivityDefinitionService["listActivityDefinitions"]>()
        .mockResolvedValue([makeDefinition("a", "Squat")]),
      listBodyZones: jest
        .fn<ActivityDefinitionService["listBodyZones"]>()
        .mockResolvedValue(BODY_ZONE_FIXTURES),
    };
    const updateDraft = jest.fn<(patch: Partial<SessionDraft>) => void>();
    render(
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider value={service as ActivityDefinitionService}>
          <ProfileServiceContext.Provider
            value={fakeProfileService({
              getProfile: jest.fn(async () => ({
                ...createDefaultProfile("profile-1", "2026-01-01T00:00:00.000Z"),
                postActivityRecoverySecondsDefault: 45,
              })),
            })}
          >
            <SessionDraftContext.Provider
              value={{ draft: createEmptyDraft(), updateDraft, resetDraft: jest.fn() }}
            >
              <ActivitySelectionScreen />
            </SessionDraftContext.Provider>
          </ProfileServiceContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("activity-selection-list")).toBeTruthy());
    // Laisse la lecture asynchrone du Profil se résoudre avant l'insertion.
    await waitFor(() => expect(screen.getByTestId("activity-selection-row-a")).toBeTruthy());

    fireEvent.press(screen.getByTestId("activity-selection-row-a"));
    fireEvent.press(screen.getByTestId("activity-selection-add"));

    expect(updateDraft).toHaveBeenCalledTimes(1);
    const exercises = updateDraft.mock.calls[0][0].exercises ?? [];
    // PRE-6 (story 1.1, AD-35) : aucune récupération automatique = absente (`null`).
    expect(exercises[0]?.postActivityRecoverySeconds).toBeNull();
    expect(exercises[0]?.executionParameters).toEqual(
      expect.objectContaining({ version: 3, mode: "DURATION" }),
    );
    // AD-9 : copie profonde des paramètres typés, jamais la référence de la définition.
    expect(exercises[0]?.executionParameters).toEqual(durationParameters(30, 2, 5));
    expect(exercises[0]).toHaveProperty("categoryId");
    expect(exercises[0]?.media).toEqual([]);
  });
});

/**
 * PRE-4 story 1.3 (FR-19-05) — copie groupée atomique et ordonnée, Cibles
 * typées comprises. L'écran n'a pas de filtre : l'ordre de présentation est
 * celui de `listActivityDefinitions` (aucun filtre inventé).
 */
describe("ActivitySelectionScreen — PRE-4 story 1.3", () => {
  const typed = [
    makeDefinition("a", "Squat", { executionParameters: variableParameters({ mode: "REPETITIONS", rows: [[10, 10], ["FAILURE", 20]] }) }),
    makeDefinition("b", "Fentes", { executionParameters: allFailureParameters(3, 15) }),
    makeDefinition("c", "Gainage", { executionParameters: durationParameters(45, 2, 10) }),
  ];

  beforeEach(() => {
    mockBack.mockClear();
  });

  it("PRE4-1.3/AC3 — trois Définitions : copies dans l'ordre de la liste, chacune avec ses Cibles typées, en un seul updateDraft", async () => {
    const { updateDraft } = renderScreen(typed);
    await waitFor(() => expect(screen.getByTestId("activity-selection-row-c")).toBeTruthy());
    fireEvent.press(screen.getByTestId("activity-selection-row-c"));
    fireEvent.press(screen.getByTestId("activity-selection-row-a"));
    fireEvent.press(screen.getByTestId("activity-selection-row-b"));
    fireEvent.press(screen.getByTestId("activity-selection-add"));

    expect(updateDraft).toHaveBeenCalledTimes(1);
    const exercises = updateDraft.mock.calls[0]![0].exercises ?? [];
    expect(exercises.map((exercise) => exercise.name)).toEqual(["Squat", "Fentes", "Gainage"]);
    expect(exercises.map((exercise) => exercise.executionParameters)).toEqual(typed.map((definition) => definition.executionParameters));
    exercises.forEach((exercise, index) => expect(exercise.executionParameters).not.toBe(typed[index]!.executionParameters));
  });

  it("PRE4-1.3/AC3 — échec pendant la copie groupée : Composition inchangée, aucun sous-ensemble inséré", async () => {
    const { updateDraft } = renderScreen(typed);
    await waitFor(() => expect(screen.getByTestId("activity-selection-row-c")).toBeTruthy());
    fireEvent.press(screen.getByTestId("activity-selection-row-a"));
    fireEvent.press(screen.getByTestId("activity-selection-row-b"));
    fireEvent.press(screen.getByTestId("activity-selection-row-c"));
    // Échec provoqué à la deuxième copie (identifiant indisponible).
    const randomUUID = jest.mocked(Crypto.randomUUID);
    const original = randomUUID.getMockImplementation();
    randomUUID
      .mockImplementationOnce(() => "copy-1" as ReturnType<typeof Crypto.randomUUID>)
      .mockImplementationOnce(() => {
        throw new Error("Injected failure");
      });
    let thrown: unknown = null;
    try {
      fireEvent.press(screen.getByTestId("activity-selection-add"));
    } catch (error) {
      thrown = error;
    } finally {
      // Aucune implémentation « une fois » ne doit fuir vers les tests suivants.
      randomUUID.mockReset();
      if (original) {
        randomUUID.mockImplementation(original);
      }
    }
    expect(thrown).toEqual(new Error("Injected failure"));
    expect(updateDraft).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
  });
});
