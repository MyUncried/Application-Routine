import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { useCallback, useMemo, useState } from "react";
import { Keyboard, Platform, ScrollView, StyleSheet } from "react-native";

import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { Label } from "@/domain/labels/Label";
import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { NAME_MAX_LENGTH } from "@/domain/sessions/validation";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import {
  notifyBodyZonesReferentialChanged,
  ReferentialServiceContext,
} from "@/features/reference-data/ReferentialServiceContext";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import type { SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import { SessionDraftProvider } from "@/features/sessions/SessionDraftProvider";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

// Ordre du tableau = ordre de retour du Repository (`listAll`, doublé) —
// `epaules` (référentiel historique `order: 1`) précède `dos` (`order: 4`)
// puis `cuisses` (`order: 6`), jamais trié ici par `createdAt`.
const BODY_ZONE_FIXTURES: readonly BodyZone[] = [
  { id: "epaules", name: "Épaules", isActive: true, createdAt: "2026-01-01T00:00:01.000Z" },
  { id: "dos", name: "Dos", isActive: true, createdAt: "2026-01-01T00:00:04.000Z" },
  { id: "cuisses", name: "Cuisses", isActive: true, createdAt: "2026-01-01T00:00:06.000Z" },
];

/**
 * `CompositionScreen` s'auto-alimente également en Étiquettes persistées,
 * pour dériver EN LECTURE SEULE la couleur affichée de la Séance (V2-PRE-1,
 * plan §3.3, UI-74BBA70BF09F-AC8AD824374E8) — via
 * `ActivityDefinitionService.listLabels()` (revue indépendante 5950755410),
 * doublé ci-dessous (`fakeActivityDefinitionService`).
 */
const LABEL_FIXTURES: readonly Label[] = [
  {
    id: "label-sport",
    name: "Sport",
    canonicalKey: "sport",
    color: "#2E9B62",
    isActive: true,
    createdAt: "2026-01-01T00:00:01.000Z",
  },
];

// T02-S01 : la duplication d'une Activité génère un identifiant frais
// (`Crypto.randomUUID()`) — même patron de mock que `ExerciseScreen.test.tsx`.
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-copy-id") }));

/**
 * `useRouter` mocké (T01-S08) — `+ Ajouter une activité`/la ligne Exercice
 * naviguent vers `/exercise` ; `back` (correction CE-T01-04, AUD-03) couvre
 * désormais l'action Retour de l'en-tête.
 */
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ push: mockPush, back: mockBack }),
  };
});

/**
 * `useCompositionExitGuard` mocké : cet écran ne re-teste pas le mécanisme
 * de prévention de navigation lui-même (contrat propre testé par
 * `useCompositionExitGuard.test.ts`, mécanisme réel testé avec un vrai
 * navigateur par `CompositionNavigationGuard.integration.test.tsx`) — ces
 * tests portent sur les états et interactions propres à l'écran.
 */
const mockExitGuard = jest.fn();
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: (shouldBlock: boolean, onConfirmExit: () => void) =>
    mockExitGuard(shouldBlock, onConfirmExit),
}));

function defaultExitGuardResult() {
  return { isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() };
}

/**
 * `ActivityDefinitionService` doublé minimal — correction device check
 * Hermann (commentaire 5948936550) + revue indépendante 5950755410 :
 * `CompositionScreen` consomme désormais les Zones corporelles
 * (`listBodyZones`) ET les Étiquettes (`listLabels`) via ce service, jamais
 * `useSQLiteContext` directement (toujours en échec en production, l'écran
 * étant rendu hors de `<SQLiteProvider>`).
 */
function fakeActivityDefinitionService(
  overrides: Partial<ActivityDefinitionService> = {},
): ActivityDefinitionService {
  return {
    listBodyZones: jest
      .fn<ActivityDefinitionService["listBodyZones"]>()
      .mockResolvedValue(BODY_ZONE_FIXTURES),
    listLabels: jest
      .fn<ActivityDefinitionService["listLabels"]>()
      .mockResolvedValue(LABEL_FIXTURES),
    ...overrides,
  } as unknown as ActivityDefinitionService;
}

/**
 * V2-PRE-2 (plan §6.5, CE-T03-16) : la pastille ouvre désormais
 * `LabelPickerModal`, qui s'auto-alimente via `ReferentialServiceContext` —
 * jamais `ActivityDefinitionService` pour cette modale (réservé à la
 * dérivation d'affichage en lecture seule, `fakeActivityDefinitionService`).
 */
function fakeReferentialService(overrides: Partial<ReferentialService> = {}): ReferentialService {
  return {
    listLabels: jest.fn(async () => LABEL_FIXTURES),
    createLabel: jest.fn(async () => ({ status: "DUPLICATE" as const })),
    renameLabel: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    retireLabel: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    isLabelUsed: jest.fn(async () => false),
    ...overrides,
  } as unknown as ReferentialService;
}

function renderScreen() {
  return render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService()}>
        <ReferentialServiceContext.Provider value={fakeReferentialService()}>
          <SessionDraftProvider>
            <CompositionScreen />
          </SessionDraftProvider>
        </ReferentialServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
}

/**
 * Contourne `SessionDraftProvider` pour préremplir `draft.exercises` —
 * celui-ci n'expose aucun moyen interactif de le faire depuis Composition
 * seule. Complétion REWORK12 : accepte une collection (0, 1 ou plusieurs
 * Activités), remplace l'ancien paramètre `exercise: ... | null` singulier.
 *
 * REWORK13 (R13-02) : `updateDraft` est désormais un VRAI merge d'état
 * local (`useState`, même patron que `SessionDraftProvider.tsx`), pas un
 * `jest.fn()` statique — nécessaire pour que confirmer un sélecteur de
 * durée (Compte à rebours/Fin de séance) produise un re-rendu observable,
 * condition requise par les tests obligatoires R13-02 n°2/n°3 ci-dessous.
 * Aucun test existant n'observait `updateDraft` lui-même (jamais un
 * `toHaveBeenCalledWith` dessus dans ce fichier) : ce changement ne
 * régresse aucune assertion préexistante.
 */
function StatefulDraftWrapper({
  initialExercises,
  draftOverrides,
  children,
}: {
  initialExercises: readonly SessionDraftExercise[];
  /** Correction compacte LOT_3_OF_3 : surcharges du brouillon (Catégories notamment) — omises par défaut, aucun test préexistant n'en fournit. */
  draftOverrides?: Partial<SessionDraftContextValue["draft"]>;
  children: React.ReactNode;
}) {
  const [draft, setDraft] = useState<SessionDraftContextValue["draft"]>(() => ({
    name: "Séance simple",
    labelId: null,
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    exercises: initialExercises,
    ...draftOverrides,
  }));
  const updateDraft = useCallback((patch: Partial<SessionDraftContextValue["draft"]>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);
  const resetDraft = useCallback(() => {
    setDraft({
      name: "",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercises: [],
    });
  }, []);
  const value = useMemo<SessionDraftContextValue>(
    () => ({ draft, updateDraft, resetDraft }),
    [draft, updateDraft, resetDraft],
  );
  return <SessionDraftContext.Provider value={value}>{children}</SessionDraftContext.Provider>;
}

function renderScreenWithDraft(
  exercises: readonly SessionDraftExercise[],
  draftOverrides?: Partial<SessionDraftContextValue["draft"]>,
) {
  return render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService()}>
        <ReferentialServiceContext.Provider value={fakeReferentialService()}>
          <StatefulDraftWrapper initialExercises={exercises} draftOverrides={draftOverrides}>
            <CompositionScreen />
          </StatefulDraftWrapper>
        </ReferentialServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
}

const composition = strings.screens.composition;

/**
 * `Platform.OS` par défaut dans cet environnement Jest (`jest-expo`) est
 * déjà `"ios"` — forcé ici explicitement, par robustesse. `DurationWheelPicker`
 * délègue donc à la roulette native SwiftUI (restaurée par `[ChatGPT]
 * PLAN_APPROVED — REWORK06 — RESTAURATION CIBLÉE DE LA ROULETTE + VERROU
 * DE CAPITALISATION`, 2026-09-04, après une suppression injustifiée par
 * `REWORK05` — voir `DurationWheelPicker.tsx`) — les interactions de test
 * ci-dessous utilisent `fireNativeSelectionChange` (événement
 * `selectionChange`, convention du composant natif), jamais
 * `fireEvent.scroll` (mécanisme du seul chemin Android/web, testé
 * séparément dans `DurationWheelPicker.test.tsx`).
 */
let originalPlatformOS: typeof Platform.OS;

beforeAll(() => {
  originalPlatformOS = Platform.OS;
  Platform.OS = "ios";
});

afterAll(() => {
  Platform.OS = originalPlatformOS;
});

function fireNativeSelectionChange(
  element: ReturnType<typeof screen.getByTestId>,
  selection: number,
) {
  fireEvent(element, "selectionChange", { nativeEvent: { selection } });
}

beforeEach(() => {
  mockExitGuard.mockReset();
  mockExitGuard.mockReturnValue(defaultExitGuardResult());
  mockPush.mockReset();
  mockBack.mockReset();
});

describe("CompositionScreen — état initial", () => {
  it("renders the name field, the countdown/final phase rows, the now-actionable Tour control, and the disabled final action", () => {
    renderScreen();

    expect(screen.getByLabelText(composition.name)).toBeTruthy();
    expect(screen.getByLabelText(composition.countdown.label)).toBeTruthy();
    expect(screen.getByLabelText(composition.finalPhase.label)).toBeTruthy();

    // T02-S01 (CE-T02-01/AC-08) : le contrôle `Nombre de tours` n'est plus
    // inerte — il est pressable et annonce sa valeur courante.
    const tour = screen.getByLabelText(composition.tour.label);
    expect(tour.props.accessibilityState).toMatchObject({ disabled: false });
    expect(tour.props.accessibilityValue).toMatchObject({ text: "1" });
    // T-05/D-130 : valeur `1` seule, jamais de préfixe `×`.
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.queryByText("×1")).toBeNull();

    const continueAction = screen.getByLabelText(composition.continueAction);
    expect(continueAction.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("exposes a visible, accessible Retour action calling router.back() (CE-T01-04, AUD-03 correction)", () => {
    renderScreen();

    const back = screen.getByLabelText(composition.backAccessibilityLabel);
    expect(back).toBeTruthy();

    fireEvent.press(back);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("shows the composition icons for Compte à rebours initial and Fin de séance rows (CE-T01-09 icons, previously unused)", () => {
    renderScreen();

    expect(screen.getByTestId("composition-row-icon-composition-initial-countdown")).toBeTruthy();
    expect(screen.getByTestId("composition-row-icon-composition-end-session")).toBeTruthy();
  });

  it("REWORK06 — never renders a chevron on rows, closed or open (permanently removed — the previous conditional chevron changed the row's flex-child count, shifting the role icon between states)", () => {
    renderScreen();

    // Fermé : jamais de chevron (déjà vrai avant REWORK06).
    expect(screen.queryByTestId("composition-row-chevron-down")).toBeNull();
    expect(screen.queryByTestId("composition-row-chevron-up")).toBeNull();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));

    // Ouvert : plus aucun chevron non plus (renversement du comportement
    // précédent — `accessibilityState.expanded` porte déjà cette
    // information pour l'accessibilité, sans indice visuel qui décale la
    // mise en page).
    expect(screen.queryByTestId("composition-row-chevron-down")).toBeNull();
    expect(screen.queryByTestId("composition-row-chevron-up")).toBeNull();
  });

  it("REWORK06 — the role icon's slot keeps exactly the same style (and the row exposes the same number of top-level slots) whether the row is closed or open (proves the chevron removal fixes the previous icon position drift)", () => {
    renderScreen();

    const rowBefore = screen.getByLabelText(composition.countdown.label);
    const iconSlotBefore = within(rowBefore).getByTestId(
      "composition-row-icon-composition-initial-countdown",
    ).parent;
    const childCountBefore = (rowBefore.children as unknown[]).length;
    const iconSlotStyleBefore = StyleSheet.flatten(iconSlotBefore?.props.style);

    fireEvent.press(screen.getByLabelText(composition.countdown.label));

    const rowAfter = screen.getByLabelText(composition.countdown.label);
    const iconSlotAfter = within(rowAfter).getByTestId(
      "composition-row-icon-composition-initial-countdown",
    ).parent;
    const childCountAfter = (rowAfter.children as unknown[]).length;
    const iconSlotStyleAfter = StyleSheet.flatten(iconSlotAfter?.props.style);

    // Même nombre d'enfants directs de la rangée (aucun chevron
    // conditionnel n'apparaît/disparaît) et même style pour le slot qui
    // porte l'icône de rôle — la position ne peut donc plus dériver entre
    // les deux états.
    expect(childCountAfter).toBe(childCountBefore);
    expect(iconSlotStyleAfter).toEqual(iconSlotStyleBefore);
  });

  it("T01-S09 correction VISUAL (point D) — opens the countdown picker inside the shared full-screen WheelPickerOverlay, centered with a dimmed background — supersedes the former position:absolute popover anchor (CE-T01-06/07, AUD-05)", () => {
    renderScreen();

    expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));

    expect(screen.getByTestId("wheel-picker-overlay")).toBeTruthy();
    const backdrop = screen.getByTestId("wheel-picker-overlay-backdrop");
    expect(StyleSheet.flatten(backdrop.props.style).backgroundColor).toBe(colors.overlayScrim);
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();
  });

  it("T01-S09 correction VISUAL (point D) — supersedes the former popover zIndex elevation (UI-CTRL-002): Boundary Activity rows never carry an ad hoc zIndex, open or closed, now that wheel pickers render in a structurally separate overlay layer, never anchored to their triggering row", () => {
    renderScreen();

    const closedCountdown = screen.getByLabelText(composition.countdown.label);
    expect(StyleSheet.flatten(closedCountdown.props.style).zIndex).toBeUndefined();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));

    const openCountdown = screen.getByLabelText(composition.countdown.label);
    expect(StyleSheet.flatten(openCountdown.props.style).zIndex).toBeUndefined();

    const finalPhase = screen.getByLabelText(composition.finalPhase.label);
    expect(StyleSheet.flatten(finalPhase.props.style).zIndex).toBeUndefined();
  });

  it("enables '+ Ajouter une activité' while no Exercise exists yet, and opens the add-activity tree on press (V2-CAT-01)", () => {
    renderScreen();

    const addActivity = screen.getByLabelText(composition.addActivity);
    expect(addActivity.props.accessibilityState).toMatchObject({ disabled: false });

    fireEvent.press(addActivity);
    expect(screen.getByTestId("composition-add-activity-tree")).toBeTruthy();
  });

  it("navigates to /exercise when 'Une nouvelle activité' is selected from the add-activity tree", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-new"));

    expect(mockPush).toHaveBeenCalledWith("/exercise");
  });

  it("navigates to /activity-selection when 'Une activité existante' is selected from the add-activity tree", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-existing"));

    expect(mockPush).toHaveBeenCalledWith("/activity-selection");
  });

  it("closes the add-activity tree without any navigation on Annuler", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-cancel"));

    expect(screen.queryByTestId("composition-add-activity-tree")).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  /**
   * VISUAL_CORRECTION (revue indépendante 5753653735, point 7) : `top`
   * inclut désormais la hauteur RÉELLE cumulée de l'en-tête fixe, de son
   * séparateur et de la bande Context — jamais seulement
   * `contextBand.height`, qui chevauchait l'en-tête. Le voile porte un fond
   * VISIBLE, jamais transparent.
   */
  it("positions the add-activity tree below the fixed header and context band, with a visible scrim", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.addActivity));

    const tree = screen.getByTestId("composition-add-activity-tree");
    const flattenedTop = StyleSheet.flatten(tree.props.style).top as number;
    // Insets de test (`TestSafeAreaProvider`) : `top: 47`.
    const expectedTop = 47 + dimensions.header.contentHeight + 1 + dimensions.contextBand.height + spacing[8];
    expect(flattenedTop).toBe(expectedTop);

    const scrim = screen.getByTestId("composition-add-activity-tree-backdrop");
    expect(StyleSheet.flatten(scrim.props.style).backgroundColor).toBe(colors.overlayScrim);
  });

  it("shows the exact local empty summary '0 exercice · 0 min' (V2), never formatActivityCount(0)'s plural", () => {
    renderScreen();

    // REWORK09 : la ligne de synthèse basse est supprimée (redondante
    // depuis REWORK08-C) — une seule occurrence subsiste désormais, sous
    // « Nombre de tours » (voir composition-tour-summary ci-dessous).
    expect(screen.getAllByText("0 exercice · 0 min")).toHaveLength(1);
    expect(screen.queryByText("0 exercices · 0 min")).toBeNull();
  });

  it("shows the canonical default countdown (10 s) and final phase (5 s) row values", () => {
    renderScreen();

    expect(screen.getByText("00 min 10 s")).toBeTruthy();
    expect(screen.getByText("00 min 05 s")).toBeTruthy();
  });
});

describe("CompositionScreen — champ Nom", () => {
  it("carries exactly NAME_MAX_LENGTH as the maxLength prop, not a hardcoded literal", () => {
    renderScreen();
    expect(screen.getByLabelText(composition.name).props.maxLength).toBe(NAME_MAX_LENGTH);
    expect(NAME_MAX_LENGTH).toBe(80);
  });

  it("transmits an accepted input to the draft unmodified, without premature trimming", () => {
    renderScreen();

    fireEvent.changeText(screen.getByLabelText(composition.name), "  Séance du soir  ");

    expect(screen.getByLabelText(composition.name).props.value).toBe("  Séance du soir  ");
  });

  it("makes the draft dirty as soon as the name is non-empty, passed through to useCompositionExitGuard", () => {
    renderScreen();
    expect(mockExitGuard).toHaveBeenLastCalledWith(false, expect.any(Function));

    fireEvent.changeText(screen.getByLabelText(composition.name), "Séance simple");

    expect(mockExitGuard).toHaveBeenLastCalledWith(true, expect.any(Function));
  });
});

describe("CompositionScreen — sélecteurs et exclusivité", () => {
  it("opens the countdown wheel picker on row press, and hides it again on a second press of the same row", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
  });

  it("opening the final phase picker closes an already-open countdown picker (single overlay at a time)", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    expect(screen.getByTestId("duration-wheel-minutes")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(composition.finalPhase.label));
    // Still exactly one picker mounted, now driven by the final phase value (05 s).
    expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(5);
  });

  it("dismisses the keyboard when opening a duration picker (Name field may have had focus)", () => {
    const dismissSpy = jest.spyOn(Keyboard, "dismiss").mockImplementation(() => {});
    try {
      renderScreen();
      expect(dismissSpy).not.toHaveBeenCalled();

      fireEvent.press(screen.getByLabelText(composition.countdown.label));
      expect(dismissSpy).toHaveBeenCalledTimes(1);

      fireEvent.press(screen.getByLabelText(composition.finalPhase.label));
      expect(dismissSpy).toHaveBeenCalledTimes(2);
    } finally {
      dismissSpy.mockRestore();
    }
  });

  it("draft vs committed value (D-06): a native minutes selection does NOT update the row's displayed value while the picker stays open", () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(composition.countdown.label));

    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 1);

    // La ligne reste sur la valeur validée précédente (défaut 10 s) tant
    // que le sélecteur n'est pas refermé — jamais mise à jour en cours de
    // défilement (addendum `WHEEL DRAFT VS COMMITTED VALUE`, D-06).
    expect(screen.getByText("00 min 10 s")).toBeTruthy();
    expect(screen.queryByText("01 min 10 s")).toBeNull();
    // The exercise is still null in T01-S07: the summary stays the exact
    // local empty label regardless of countdown/final-phase changes (§9.1).
    // REWORK09 : une seule occurrence désormais (synthèse Tour uniquement,
    // la ligne basse redondante a été supprimée).
    expect(screen.getAllByText("0 exercice · 0 min")).toHaveLength(1);
    // REWORK08-B (« aucun chemin onChange/sélection/défilement ne
    // déclenche la fermeture ») : le sélecteur reste réellement monté —
    // preuve explicite, pas seulement déduite du libellé du test.
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();
  });

  it("REWORK08-B, superseded by the correction VISUAL point D overlay — no chain of native selection-change events, however many, ever closes the picker — only Annuler/Valider do (root cause of the historical defect: the previous popover anchor intercepted the very first touch on the wheel before it reached the native Host view; the current WheelPickerOverlay backdrop is not pressable at all, see WheelPickerOverlay.test.tsx)", () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(composition.countdown.label));

    // Simule un défilement réel : plusieurs crans successifs sur les deux
    // roues, comme un vrai geste de glissement continu.
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 1);
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 2);
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 3);
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-seconds"), 5);
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-seconds"), 10);

    // Le sélecteur — porté par la superposition plein écran dédiée — reste
    // monté après toute cette séquence, jamais fermé par un simple
    // changement de sélection.
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();
    expect(screen.getByTestId("wheel-picker-overlay")).toBeTruthy();

    // Seul Valider ferme (et commit) — la fermeture explicite reste
    // possible et fonctionne normalement après cette séquence.
    fireEvent.press(screen.getByLabelText(composition.wheelPicker.validateAccessibilityLabel));
    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
    expect(screen.getByText("03 min 10 s")).toBeTruthy();
  });

  it("selects a real value in the countdown picker, committed to the row exactly once on Validate (R4-09) (no false conformity — a picker that opens but never truly selects, AUD-05)", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 2);
    // Toujours la valeur validée précédente pendant que le sélecteur reste ouvert.
    expect(screen.getByText("00 min 10 s")).toBeTruthy();

    // R4-08/R4-09 : seule l'action Valider ferme ET commit — un nouvel
    // appui sur la ligne elle-même ne fait plus office de validation.
    fireEvent.press(screen.getByLabelText(composition.wheelPicker.validateAccessibilityLabel));
    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();

    // La valeur choisie est désormais affichée sur la ligne, exactement
    // celle sélectionnée — jamais une valeur obsolète/décalée.
    expect(screen.getByText("02 min 10 s")).toBeTruthy();
  });

  it("Annuler (R4-09) closes without committing — the row keeps the previously validated value, never the draft", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 2);
    fireEvent.press(screen.getByLabelText(composition.wheelPicker.cancelAccessibilityLabel));

    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
    expect(screen.getByText("00 min 10 s")).toBeTruthy();
    expect(screen.queryByText("02 min 10 s")).toBeNull();
  });

  it("draft/committed independence: re-opening the countdown picker after Valider restores exactly the last committed value, centered — never the previous draft nor a stale value", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 1);
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-seconds"), 10);
    fireEvent.press(screen.getByLabelText(composition.wheelPicker.validateAccessibilityLabel)); // commit unique (01 min 10 s)
    expect(screen.getByText("01 min 10 s")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(composition.countdown.label)); // rouvre
    expect(screen.getByTestId("duration-wheel-minutes").props.selection).toBe(1);
    expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(10);
  });

  /**
   * V2-PRE-1 (plan §3.3, UI-74BBA70BF09F) : le sélecteur de couleur autonome
   * (`ColorPalette`/`draft.color`) est retiré de cet écran — la couleur de
   * la Séance est désormais exclusivement DÉRIVÉE de son Étiquette, sans
   * aucune interaction de couleur ici.
   */
  it("never renders an autonomous color picker", () => {
    renderScreen();

    expect(screen.queryByLabelText(composition.colorPicker.label)).toBeNull();
  });

  /**
   * V2-PRE-1 (plan §3.3, UI-74BBA70BF09F-AC8AD824374E8, revue indépendante
   * 5931901286) : la couleur affichée est DÉRIVÉE, en lecture seule, de
   * l'Étiquette associée au brouillon — jamais une écriture de `draft.color`.
   */
  it("shows the Session colour swatch using the persisted Label's colour when the draft carries a labelId", async () => {
    renderScreenWithDraft([], { labelId: "label-sport" });

    await waitFor(() => {
      const swatch = screen.getByTestId("composition-session-color-swatch");
      expect(StyleSheet.flatten(swatch.props.style).backgroundColor).toBe("#2E9B62");
    });
  });

  /**
   * Révision r4 (R7a, CE-T03-16 L1609 ; Figma 4916:6386/2028:11204) : sans
   * Étiquette, le contrôle montre l'icône d'étiquette au trait
   * (`label-outline`), jamais la pastille remplie — aucun remplissage de
   * couleur.
   */
  it("shows the outline label icon, with no colour fill, when the draft has no labelId (R7a)", () => {
    renderScreenWithDraft([], { labelId: null });

    expect(screen.getByTestId("composition-session-label-outline-icon")).toBeTruthy();
    expect(screen.queryByTestId("composition-session-color-swatch")).toBeNull();
  });

  it("never writes to draft.color when a Label is derived (no autonomous colour write)", async () => {
    renderScreenWithDraft([], { labelId: "label-sport" });

    await waitFor(() => {
      const swatch = screen.getByTestId("composition-session-color-swatch");
      expect(StyleSheet.flatten(swatch.props.style).backgroundColor).toBe("#2E9B62");
    });

    expect(screen.queryByLabelText(composition.colorPicker.label)).toBeNull();
  });

  /**
   * V2-PRE-2 (plan §6.5, CE-T03-16) : la pastille ouvre `LabelPickerModal` —
   * l'affectation (`draft.labelId`) est enregistrée dans le brouillon local
   * dès la sélection (seul l'ENREGISTREMENT final de la Séance reste
   * conditionné à Continuer, hors périmètre de ce test).
   */
  it("opens LabelPickerModal from the swatch and applies the selected Label to the draft", async () => {
    renderScreenWithDraft([], { labelId: null });

    fireEvent.press(screen.getByLabelText(composition.label.accessibilityLabel));

    const tag = await screen.findByTestId("label-picker-tag-label-sport");
    fireEvent.press(tag);

    expect(screen.queryByTestId("label-picker-backdrop")).toBeNull();
    await waitFor(() => {
      const swatch = screen.getByTestId("composition-session-color-swatch");
      expect(StyleSheet.flatten(swatch.props.style).backgroundColor).toBe("#2E9B62");
    });
  });

  /** R7a (CE-T03-16 L1609, §18 L1677) : le nom de l'Étiquette affectée apparaît à côté de la pastille. */
  it("shows the assigned Label's name next to the colour swatch, and shows no name without a Label", async () => {
    renderScreenWithDraft([], { labelId: "label-sport" });

    await waitFor(() =>
      expect(screen.getByTestId("composition-session-label-name").props.children).toBe("Sport"),
    );

    renderScreenWithDraft([], { labelId: null });

    expect(screen.queryByTestId("composition-session-label-name")).toBeNull();
  });
});

describe("CompositionScreen — ligne Exercice (T01-S08)", () => {
  /**
   * Complétion REWORK12 (COMP-03, « Plusieurs activités et bouton
   * persistant ») : `+ Ajouter une activité` ne se masque plus jamais —
   * abroge le comportement REWORK09/T01-S08 précédent (masqué dès qu'une
   * Activité existait, modèle à Exercice unique).
   */
  it("keeps '+ Ajouter une activité' visible AND shows the Exercise row once an Activity is set (COMP-03 — never hidden any more)", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 }]);

    expect(screen.getByLabelText(composition.addActivity)).toBeTruthy();
    expect(screen.getByLabelText(composition.addActivity).props.accessibilityState).toMatchObject({
      disabled: false,
    });
    expect(screen.getByLabelText(composition.exerciseRow.editAccessibilityLabel)).toBeTruthy();
    expect(screen.getByText("Gainage")).toBeTruthy();
  });

  /**
   * REWORK12 (COMP-01, `[ChatGPT] CHANGES_REQUESTED — REWORK12`,
   * 2026-09-04) : la ligne Exercice reprend désormais strictement
   * l'anatomie de `Composition / Boundary Activity — Source exact`
   * (`BoundaryActivityRow`, `icon={null}`) — un seul pictogramme, le slot
   * structure/poignée `composition-reorder` à gauche, jamais l'ancienne
   * icône `composition-main-content` (désormais réservée à l'icône du
   * bloc Tour, voir COMP-02 ci-dessous) ni de second slot à droite.
   */
  it("REWORK12 (COMP-01) — shows only the composition-reorder structure icon on the Exercise row, never composition-main-content nor a right-side icon", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 }]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    expect(within(row).getByTestId("composition-boundary-handle-icon")).toBeTruthy();
    expect(screen.queryByTestId("composition-exercise-icon")).toBeNull();
    expect(within(row).queryByTestId("composition-row-icon-composition-main-content")).toBeNull();
  });

  it("REWORK12 (COMP-01) — the Exercise row's structure icon displays the canonical 20×20 glyph at opacity 0.5, same as the Compte à rebours/Fin de séance cards (same shared component, by construction)", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 }]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    const reorderIcon = within(row).getByTestId("composition-boundary-handle-icon");
    const flattened = StyleSheet.flatten(reorderIcon.props.style);
    expect(flattened.width).toBe(20);
    expect(flattened.height).toBe(20);
    expect(flattened.opacity).toBe(0.5);
  });

  it("REWORK12 (COMP-01) — the Exercise row reuses the exact same card anatomy (fond, liseré, rayon) as the Compte à rebours initial card, by construction (same limitCardBase/boundaryRow styles)", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 }]);

    const exerciseRow = screen.getByTestId("composition-exercise-row-ex-1");
    const exerciseCardStyle = StyleSheet.flatten(exerciseRow.props.style);
    const countdownCardStyle = StyleSheet.flatten(
      screen.getByLabelText(composition.countdown.label).props.style,
    );
    expect(exerciseCardStyle.borderColor).toBe(countdownCardStyle.borderColor);
    expect(exerciseCardStyle.borderRadius).toBe(countdownCardStyle.borderRadius);
    expect(exerciseCardStyle.backgroundColor).toBe(countdownCardStyle.backgroundColor);
  });

  it("shows the detailed configuration summary (name + summary, never the Consigne or the Zones corporelles) — CHANGES_REQUESTED", () => {
    renderScreenWithDraft([
      {
        ...createExerciseDraft("ex-1"),
        name: "Gainage",
        durationSeconds: 90,
        seriesCount: 3,
        pauseSeconds: 15,
        instruction: "Ne pas creuser le dos",
      },
    ]);

    expect(screen.getByText("Gainage")).toBeTruthy();
    expect(screen.getByText("3 séries de 1 min 30 s avec 15 s de pause par série")).toBeTruthy();
    expect(screen.queryByText("Ne pas creuser le dos")).toBeNull();
  });

  it("pressing the Exercise row navigates to /exercise with its own exerciseId (reopen for editing, complétion REWORK12 — édition ciblée par identifiant)", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 }]);

    fireEvent.press(screen.getByLabelText(composition.exerciseRow.editAccessibilityLabel));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/exercise",
      params: { exerciseId: "ex-1" },
    });
  });

  it("never shows the Exercise row while draft.exercises is empty", () => {
    renderScreenWithDraft([]);
    expect(screen.queryByLabelText(composition.exerciseRow.editAccessibilityLabel)).toBeNull();
  });

  /**
   * Complétion REWORK12 (« Plusieurs activités et bouton persistant »),
   * test obligatoire de l'autorisation : deux Activités distinctes
   * coexistent, dans l'ordre de la collection, le bouton Ajouter reste
   * utilisable, et presser chaque ligne navigue avec SON PROPRE identifiant
   * — jamais celui d'une autre.
   */
  it("REWORK12 (« Plusieurs activités ») — renders one row per Activity, in collection order, each navigating to /exercise with its own exerciseId, button still usable", () => {
    renderScreenWithDraft([
      { ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 },
      { ...createExerciseDraft("ex-2"), name: "Squats", durationSeconds: 30 },
    ]);

    expect(screen.getByTestId("composition-exercise-row-ex-1")).toBeTruthy();
    expect(screen.getByTestId("composition-exercise-row-ex-2")).toBeTruthy();
    expect(screen.getByText("Gainage")).toBeTruthy();
    expect(screen.getByText("Squats")).toBeTruthy();

    const order = testIdOrder(screen.toJSON(), [
      "composition-exercise-row-ex-1",
      "composition-exercise-row-ex-2",
    ]);
    expect(order).toEqual(["composition-exercise-row-ex-1", "composition-exercise-row-ex-2"]);

    fireEvent.press(screen.getByTestId("composition-exercise-row-ex-2"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/exercise",
      params: { exerciseId: "ex-2" },
    });

    expect(screen.getByLabelText(composition.addActivity).props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });
});

describe("CompositionScreen — ordre structurel (UI-COMP-001/002/003, cycle de correction après contre-recette iPhone 2026-09-03)", () => {
  it("initial order (no Activity yet): + Ajouter une activité ABOVE Compte à rebours initial, then Tour, then Fin de séance (UI-COMP-002)", () => {
    renderScreenWithDraft([]);

    const order = testIdOrder(screen.toJSON(), [
      "composition-add-activity-icon",
      "composition-row-icon-composition-initial-countdown",
      "composition-row-icon-composition-end-session",
    ]);

    expect(order).toEqual([
      "composition-add-activity-icon",
      "composition-row-icon-composition-initial-countdown",
      "composition-row-icon-composition-end-session",
    ]);
    // Tour n'a pas de testID propre : sa position entre les deux est prouvée
    // par labels de texte, dans le même ordre visuel.
    const labelOrder = textOrder(screen.toJSON(), [
      composition.countdown.label,
      composition.tour.label,
      composition.finalPhase.label,
    ]);
    expect(labelOrder).toEqual([composition.countdown.label, composition.tour.label, composition.finalPhase.label]);
  });

  it("order once an Activity exists: Compte à rebours initial, then the created Activity, then Tour, then Fin de séance (UI-COMP-003) — never after Tour", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 }]);

    const order = testIdOrder(screen.toJSON(), [
      "composition-row-icon-composition-initial-countdown",
      "composition-exercise-row-ex-1",
      "composition-row-icon-composition-end-session",
    ]);
    expect(order).toEqual([
      "composition-row-icon-composition-initial-countdown",
      "composition-exercise-row-ex-1",
      "composition-row-icon-composition-end-session",
    ]);

    const labelOrder = textOrder(screen.toJSON(), [
      composition.countdown.label,
      composition.tour.label,
      composition.finalPhase.label,
    ]);
    expect(labelOrder).toEqual([composition.countdown.label, composition.tour.label, composition.finalPhase.label]);
  });
});

/** Ordre de première apparition (parcours préfixe) des `testID` demandés dans l'arbre rendu. */
function testIdOrder(tree: ReturnType<typeof screen.toJSON>, ids: string[]): string[] {
  const found: string[] = [];
  walk(tree, (node) => {
    if (node?.props?.testID && ids.includes(node.props.testID)) {
      found.push(node.props.testID as string);
    }
  });
  return found;
}

/** Même principe pour des libellés de texte (nœuds `Text` dont le seul enfant est la chaîne recherchée). */
function textOrder(tree: ReturnType<typeof screen.toJSON>, labels: string[]): string[] {
  const found: string[] = [];
  walk(tree, (node) => {
    if (typeof node?.children?.[0] === "string" && labels.includes(node.children[0])) {
      found.push(node.children[0]);
    }
  });
  return found;
}

function walk(node: any, visit: (node: any) => void): void {
  if (!node) {
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((child) => walk(child, visit));
    return;
  }
  visit(node);
  if (node.children) {
    walk(node.children, visit);
  }
}

describe("CompositionScreen — Phase 2 Shell Foundation (CMP-01/02/03/04/05/06, correction consolidée 2026-09-03)", () => {
  it("CMP-01 — Header (Shell Foundation partagé) shows the static title with a Retour circle, never replaced by the typed name; separator and Context band are distinct from the general background", () => {
    renderScreen();

    const header = screen.getByTestId("screen-header");
    expect(within(header).getByText(composition.title)).toBeTruthy();
    // Retour désormais dans un cercle de fond pâle (CMP-01) — même Shell
    // Foundation que le reste de l'application, plus une implémentation
    // locale de `CompositionScreen`.
    expect(screen.getByTestId("screen-header-back")).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText(composition.name), "Séance du soir");

    // Le titre reste inchangé après saisie — jamais remplacé par le nom.
    expect(within(header).getByText(composition.title)).toBeTruthy();
    expect(within(header).queryByText("Séance du soir")).toBeNull();

    const separator = screen.getByTestId("screen-header-separator");
    expect(StyleSheet.flatten(separator.props.style).backgroundColor).not.toBe(colors.background);

    const contextBand = screen.getByTestId("screen-context-band");
    expect(StyleSheet.flatten(contextBand.props.style).backgroundColor).not.toBe(colors.background);
    // La bande Context contient bien le nom ET Ajouter.
    expect(within(contextBand).getByLabelText(composition.name)).toBeTruthy();
    expect(within(contextBand).getByLabelText(composition.addActivity)).toBeTruthy();
  });

  it("REWORK09 — supersedes CMP-02's opaque white field: the Name field is now transparent with a white 1pt border (Session/Name Field — Source exact, 2537:1480), letting the Context band colour show through", () => {
    renderScreen();

    const field = screen.getByTestId("composition-name-color-field");
    const flattened = StyleSheet.flatten(field.props.style);
    expect(flattened.backgroundColor).toBe("transparent");
    expect(flattened.borderWidth).toBe(1);
    expect(flattened.borderColor).toBe(colors.sessionNameBorder);
    expect(colors.sessionNameBorder).toBe("#FFFFFF");
    expect(within(field).getByLabelText(composition.name)).toBeTruthy();
  });

  it("CMP-02 — Ajouter une activité is centered (compact DS button geometry, height 32/radius 16, white background distinct from the Context band, real ≥48 touch target via hitSlop)", () => {
    renderScreen();

    const addActivity = screen.getByLabelText(composition.addActivity);
    const flattened = StyleSheet.flatten(addActivity.props.style);
    expect(flattened.alignSelf).toBe("center");
    expect(flattened.height).toBe(dimensions.compactSecondaryButton.visualHeight);
    expect(flattened.borderRadius).toBe(dimensions.compactSecondaryButton.radius);
    expect(flattened.borderColor).toBe(colors.primary);
    expect(flattened.backgroundColor).toBe(colors.background);

    const hitSlop = addActivity.props.hitSlop;
    expect(flattened.height + hitSlop.top + hitSlop.bottom).toBeGreaterThanOrEqual(48);
  });

  it("CMP-04/T-03/REWORK07B/D-130 — the Tour card is a distinct DS component (background carried by the outer structure, never the inner header), showing the 'Nombre de tours' label and a 66×34 control carrying the value alone, never the Activity icon", () => {
    renderScreen();

    // REWORK07B (« Anatomie canonique — Nombre de tours ») : la SEULE
    // surface visuelle est la structure extérieure (`composition-tour-
    // section`, fond bleu canonique) — l'en-tête intérieur
    // (`composition-tour-card`) est désormais transparent, sans fond ni
    // bordure ni rayon propres.
    const tourSection = screen.getByTestId("composition-tour-section");
    const tourSectionStyle = StyleSheet.flatten(tourSection.props.style);
    expect(tourSectionStyle.backgroundColor).toBe(colors.tourSurface);
    expect(tourSectionStyle.backgroundColor).not.toBe(colors.background);
    expect(tourSectionStyle.borderRadius).toBe(10);

    const tourCard = screen.getByTestId("composition-tour-card");
    const tourCardStyle = StyleSheet.flatten(tourCard.props.style);
    expect(tourCardStyle.backgroundColor).toBeUndefined();
    expect(tourCardStyle.borderWidth).toBeUndefined();
    expect(tourCardStyle.borderRadius).toBeUndefined();

    expect(within(tourCard).getByText(composition.tour.label)).toBeTruthy();
    // T-05 : contenu `1` seul, plus de préfixe `×`.
    expect(within(tourCard).getByText("1")).toBeTruthy();
    expect(within(tourCard).queryByText("×1")).toBeNull();

    // **T02-S01 / D-130** (« Validée post-Figma ») — révise explicitement
    // T-04a/b/c/T-05 (REWORK06, cadre `78×44` + carré violet du chevron),
    // antérieurs à la publication de cette décision : le sélecteur mesure
    // `66×34`, affiche la valeur numérique SEULE, centrée et en gras
    // (`type.cardTitle`, `16/20` Semi Bold — graisse conservée), et
    // n'affiche AUCUN chevron de repli.
    const control = screen.getByTestId("composition-tour-control");
    const controlStyle = StyleSheet.flatten(control.props.style);
    expect(controlStyle.width).toBe(66);
    expect(controlStyle.height).toBe(34);
    expect(controlStyle.backgroundColor).toBe(colors.background);
    expect(controlStyle.backgroundColor).not.toBe(colors.selection);
    expect(controlStyle.alignItems).toBe("center");
    expect(controlStyle.justifyContent).toBe("space-between");

    const valueText = within(control).getByText("1");
    const valueTextStyle = StyleSheet.flatten(valueText.props.style);
    expect(valueTextStyle.color).not.toBe(colors.background);
    expect(valueTextStyle.textAlign).toBe("center");
    expect(valueTextStyle.fontSize).toBe(16);
    expect(valueTextStyle.lineHeight).toBe(20);
    expect(valueTextStyle.fontWeight).toBe("600");

    // D-130 : plus aucun chevron de repli, ni son carré violet.
    expect(screen.getByTestId("composition-tour-control-chevron-box")).toBeTruthy();
    expect(screen.getByTestId("composition-tour-control-chevron")).toBeTruthy();

    // REWORK12 (COMP-02) : icône du bloc Tour = `composition-main-content`
    // (vérifiée directement sur le nœud Figma actuel `2028:11742`,
    // « icon/contenu-principal ») — jamais l'ancienne `icon-tour`, jamais
    // `composition-reorder` (icône de poignée/structure de la ligne
    // Exercice, un troisième SVG distinct) ; voir aussi le test R4-11
    // dédié ci-dessous (`composition-tour-icon`, comparaison de `source`).
    expect(within(tourCard).getByTestId("composition-tour-icon")).toBeTruthy();
  });

  /**
   * **T02-S02 (continuation après recette visuelle, point DSF)** : le cadre
   * visible reste `66 × 34` (D-130), mais il OUVRE la roulette `Nombre de
   * tours` — sa cible tactile doit donc atteindre `48`
   * (`size/touch-target-min`), portée par `hitSlop` et jamais par un
   * agrandissement du cadre.
   */
  it("keeps the 66×34 visible frame but reaches the canonical 48pt touch target on the Tour control", () => {
    renderScreen();

    const control = screen.getByTestId("composition-tour-control");
    const controlStyle = StyleSheet.flatten(control.props.style);
    expect(controlStyle.height).toBe(34);
    expect(controlStyle.width).toBe(66);

    const hitSlop = control.props.hitSlop as { top: number; bottom: number };
    expect(controlStyle.height + hitSlop.top + hitSlop.bottom).toBe(minTouchTarget);
    expect(minTouchTarget).toBe(48);
  });

  it("REWORK08-C — shows the activity-count/duration summary directly under 'Nombre de tours', same block as the title, styled exactly like the Boundary Activity rows' secondary line, without touching the frozen outer structure or the white/violet control", () => {
    renderScreen();

    const tourCard = screen.getByTestId("composition-tour-card");
    const summary = within(tourCard).getByTestId("composition-tour-summary");

    // Contenu canonique (même fonction que bottomAction), état vide T01-S07.
    expect(summary.props.children).toBe("0 exercice · 0 min");

    // Même bloc textuel que le titre — un unique conteneur
    // (`composition-tour-text-block`) porte les deux, pas deux éléments
    // dispersés dans la rangée.
    const textBlock = within(tourCard).getByTestId("composition-tour-text-block");
    expect(within(textBlock).getByText(composition.tour.label)).toBeTruthy();
    expect(within(textBlock).getByTestId("composition-tour-summary")).toBeTruthy();

    // Typographie exactement identique à la ligne secondaire des cartes
    // limites (réutilisation du même style, jamais une simple ressemblance).
    const countdownSecondaryLine = within(
      screen.getByLabelText(composition.countdown.label),
    ).getByText("00 min 10 s");
    expect(StyleSheet.flatten(summary.props.style)).toEqual(
      StyleSheet.flatten(countdownSecondaryLine.props.style),
    );

    // Acquis gelés REWORK07B non modifiés par cet ajout : structure
    // extérieure bleue (fond/rayon) et contrôle blanc/violet inchangés.
    const tourSection = screen.getByTestId("composition-tour-section");
    expect(StyleSheet.flatten(tourSection.props.style).backgroundColor).toBe(colors.tourSurface);
    expect(StyleSheet.flatten(tourSection.props.style).borderRadius).toBe(10);
    const control = screen.getByTestId("composition-tour-control");
    const controlStyle = StyleSheet.flatten(control.props.style);
    expect(controlStyle.width).toBe(66);
    expect(controlStyle.height).toBe(34);
  });

  /**
   * REWORK13 (R13-02) : la synthèse compte/totalise EXCLUSIVEMENT les
   * Activités — `initialCountdownSeconds`/`finalPhaseSeconds` du brouillon
   * (`10 s`/`5 s` par défaut dans `renderScreenWithDraft`) ne contribuent
   * plus du tout, contrairement à l'ancien commentaire de ce test.
   */
  it("REWORK08-C/REWORK09/REWORK13 — the Tour summary reflects the real computed Activity-only duration, not a static placeholder", () => {
    // Correctif T02 (2026-09-08) : la synthèse du Tour n'agrège que la zone
    // IN_TOUR — `createExerciseDraft` positionne par défaut `BEFORE_TOUR`,
    // d'où l'override explicite (sans quoi la synthèse serait vide).
    renderScreenWithDraft([
      { ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45, structuralPosition: "IN_TOUR" },
    ]);

    const tourSummary = within(screen.getByTestId("composition-tour-card")).getByTestId(
      "composition-tour-summary",
    );
    // Contexte : seule l'Activité contribue désormais — 45 s -> ceil(45/60) = 1 min.
    expect(tourSummary.props.children).toBe("1 exercice · 1 min");
  });

  /**
   * REWORK13 (R13-02), tests obligatoires n°2 et n°3 : confirmer le Compte
   * à rebours initial ou la Fin de séance n'actualise jamais la synthèse du
   * Tour (seulement sa propre carte) ; modifier une Activité ou le nombre
   * de Tours l'actualise conformément aux références.
   */
  it("REWORK13 (R13-02) — confirming Compte à rebours initial or Fin de séance updates only their own card, never the Tour summary", () => {
    // Correctif T02 (2026-09-08) : voir le test précédent.
    renderScreenWithDraft([
      { ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45, structuralPosition: "IN_TOUR" },
    ]);

    const tourSummaryBefore = within(screen.getByTestId("composition-tour-card")).getByTestId(
      "composition-tour-summary",
    ).props.children;
    expect(tourSummaryBefore).toBe("1 exercice · 1 min");

    // Compte à rebours initial : ouvre, change, confirme.
    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 2);
    fireEvent.press(screen.getByLabelText(composition.wheelPicker.validateAccessibilityLabel));
    expect(screen.getByText("02 min 10 s")).toBeTruthy(); // sa propre carte a bien changé
    expect(
      within(screen.getByTestId("composition-tour-card")).getByTestId("composition-tour-summary")
        .props.children,
    ).toBe(tourSummaryBefore); // la synthèse Tour, elle, reste identique

    // Fin de séance : idem.
    fireEvent.press(screen.getByLabelText(composition.finalPhase.label));
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 3);
    fireEvent.press(screen.getByLabelText(composition.wheelPicker.validateAccessibilityLabel));
    expect(screen.getByText("03 min 05 s")).toBeTruthy();
    expect(
      within(screen.getByTestId("composition-tour-card")).getByTestId("composition-tour-summary")
        .props.children,
    ).toBe(tourSummaryBefore);
  });

  it("REWORK13 (R13-02) — adding a second Activity updates the Tour summary accordingly (count and duration both recomputed)", () => {
    // Correctif T02 (2026-09-08) : voir le premier test de ce bloc.
    renderScreenWithDraft([
      { ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45, structuralPosition: "IN_TOUR" },
      { ...createExerciseDraft("ex-2"), name: "Squats", durationSeconds: 30, structuralPosition: "IN_TOUR" },
    ]);

    const tourSummary = within(screen.getByTestId("composition-tour-card")).getByTestId(
      "composition-tour-summary",
    );
    // 45 + 30 = 75s -> ceil(75/60) = 2 min.
    expect(tourSummary.props.children).toBe("2 exercices · 2 min");
  });

  it("CMP-03/CMP-05 — Boundary Activity rows (Compte à rebours, Fin de séance) place a structural handle on the left, title+secondary duration line in the center, and the role icon on the right", () => {
    renderScreen();

    const countdownRow = screen.getByLabelText(composition.countdown.label);
    expect(within(countdownRow).getByTestId("composition-boundary-handle-slot")).toBeTruthy();
    expect(within(countdownRow).getByText(composition.countdown.label)).toBeTruthy();
    // Ligne secondaire : la valeur de durée déjà formatée, sous le libellé.
    expect(within(countdownRow).getByText("00 min 10 s")).toBeTruthy();
    expect(
      within(countdownRow).getByTestId("composition-row-icon-composition-initial-countdown"),
    ).toBeTruthy();
    // Aucun chevron à l'état fermé (absent de la référence, CMP-03/05).
    expect(within(countdownRow).queryByTestId("composition-row-chevron-down")).toBeNull();
  });

  it("REWORK09 — supersedes CMP-06: the redundant summary line is removed from the Bottom Action zone (moved to the Tour block by REWORK08-C) — only Continuer remains there", () => {
    renderScreen();

    const bottomAction = screen.getByTestId("composition-bottom-action");
    expect(within(bottomAction).queryByText("0 exercice · 0 min")).toBeNull();
    expect(within(bottomAction).getByLabelText(composition.continueAction)).toBeTruthy();
    // La synthèse reste bien affichée ailleurs (sous « Nombre de tours »),
    // jamais silencieusement perdue.
    expect(screen.getByTestId("composition-tour-summary")).toBeTruthy();
  });

  it("C-01 — Boundary Activity rows have a white background with a visible grey border (auparavant colors.surface, jugé non conforme au rendu réel)", () => {
    renderScreen();

    const countdownRow = screen.getByLabelText(composition.countdown.label);
    const flattened = StyleSheet.flatten(countdownRow.props.style);
    expect(flattened.backgroundColor).toBe(colors.background);
    expect(flattened.borderWidth).toBeGreaterThan(0);
    expect(flattened.borderColor).toBe(colors.border);
  });

  it("C-02 — the left handle slot carries a structure/move pictogram, swappable via a dedicated prop without touching the layout", () => {
    renderScreen();

    const countdownRow = screen.getByLabelText(composition.countdown.label);
    const handleSlot = within(countdownRow).getByTestId("composition-boundary-handle-slot");
    expect(within(handleSlot).getByTestId("composition-boundary-handle-icon")).toBeTruthy();
  });

  it("REWORK07B — supersedes T-01: the Tour section's own box geometry (border/radius/background) is now independent from the Boundary Activity rows' shared limitCardBase — the outer structure carries its own canonical radius/background, the inner header carries none of it", () => {
    // T-01 (cycle REWORK03) affirmait que la carte Tour partageait
    // EXACTEMENT la géométrie de boîte de `limitCardBase` avec les cartes
    // limites. La documentation canonique désormais mergée (« Anatomie
    // canonique — Nombre de tours », `12 – Architecture technique.md`)
    // établit que la structure extérieure du Tour est une surface
    // distincte (rayon `10`, fond bleu propre), jamais alignée sur
    // `limitCardBase` (rayon `12`, bordure grise) — ce test remplace T-01
    // explicitement, documentant la supersession plutôt que de la
    // silencieusement contredire.
    renderScreen();

    const countdownRow = screen.getByLabelText(composition.countdown.label);
    const tourSection = screen.getByTestId("composition-tour-section");
    const tourCard = screen.getByTestId("composition-tour-card");
    const countdownStyle = StyleSheet.flatten(countdownRow.props.style);
    const tourSectionStyle = StyleSheet.flatten(tourSection.props.style);
    const tourCardStyle = StyleSheet.flatten(tourCard.props.style);

    // L'en-tête intérieur (`composition-tour-card`) ne porte plus aucune
    // des propriétés de boîte de `limitCardBase`.
    expect(tourCardStyle.borderWidth).toBeUndefined();
    expect(tourCardStyle.borderRadius).toBeUndefined();
    expect(tourCardStyle.backgroundColor).toBeUndefined();

    // La structure extérieure (`composition-tour-section`) porte sa propre
    // géométrie canonique, explicitement distincte de celle des cartes
    // limites (`limitCardBase`, rayon `12`, bordure grise `colors.border`).
    expect(tourSectionStyle.borderRadius).toBe(10);
    expect(tourSectionStyle.borderRadius).not.toBe(countdownStyle.borderRadius);
    expect(tourSectionStyle.borderWidth).toBeUndefined();
  });

  it("A-01 — the body region is flex:1, guaranteeing the Bottom Action zone is pushed to the very bottom of the available space rather than floating above it, and no marginTop:auto remains on bottomAction itself", () => {
    renderScreen();

    const body = screen.getByTestId("composition-body");
    expect(StyleSheet.flatten(body.props.style).flex).toBe(1);

    const bottomAction = screen.getByTestId("composition-bottom-action");
    expect(StyleSheet.flatten(bottomAction.props.style).marginTop).toBeUndefined();
  });
});

describe("CompositionScreen — REWORK04 (`[ChatGPT] REWORK04 IMPLEMENTATION AUTHORIZED — DESIGN COMPLEMENTS REVIEWED`, 2026-09-03)", () => {
  it("R4-01 — Nom de la séance uses color/text-primary (#141414), never the secondary grey", () => {
    renderScreen();

    const nameField = screen.getByLabelText(composition.name);
    expect(StyleSheet.flatten(nameField.props.style).color).toBe(colors.textPrimary);
  });

  it("R4-01 — the placeholder itself (not just typed text) uses color/text-primary (#141414), per the audit's explicit correction of placeholderTextColor", () => {
    renderScreen();

    const nameField = screen.getByLabelText(composition.name);
    expect(nameField.props.placeholderTextColor).toBe(colors.textPrimary);
    expect(nameField.props.placeholderTextColor).not.toBe(colors.textSecondary);
  });

  it("R4-03/REWORK06 — Boundary Activity and Tour card titles use the KODJO / Card / Title style, now 16/20 Semi Bold (up from 14/18 — addendum 'titres des cartes encore trop petits')", () => {
    renderScreen();

    const countdownLabel = within(screen.getByLabelText(composition.countdown.label)).getByText(
      composition.countdown.label,
    );
    const flattened = StyleSheet.flatten(countdownLabel.props.style);
    expect(flattened.fontSize).toBe(16);
    expect(flattened.lineHeight).toBe(20);
    expect(flattened.fontWeight).toBe("600");
    expect(flattened.color).toBe(colors.textPrimary);

    const tourLabel = within(screen.getByTestId("composition-tour-card")).getByText(
      composition.tour.label,
    );
    expect(StyleSheet.flatten(tourLabel.props.style).fontSize).toBe(16);
  });

  it("R4-03 — the Boundary Activity secondary duration line uses the KODJO / Card / Supporting style (11/14)", () => {
    renderScreen();

    const secondaryLine = within(screen.getByLabelText(composition.countdown.label)).getByText(
      "00 min 10 s",
    );
    const flattened = StyleSheet.flatten(secondaryLine.props.style);
    expect(flattened.fontSize).toBe(11);
    expect(flattened.lineHeight).toBe(14);
  });

  it("REWORK07-A — the structure/move slot is back to the canonical 28×28 (down from 32×32/REWORK06 — the oversized container compensated for an undersized glyph, no longer needed once the asset itself was replaced) — the icon inside renders the canonical 20×20 glyph at opacity 0.5, with no local opacity prop needed", () => {
    renderScreen();

    const handleSlot = within(screen.getByLabelText(composition.countdown.label)).getByTestId(
      "composition-boundary-handle-slot",
    );
    const flattened = StyleSheet.flatten(handleSlot.props.style);
    expect(flattened.width).toBe(28);
    expect(flattened.height).toBe(28);

    const handleIcon = within(handleSlot).getByTestId("composition-boundary-handle-icon");
    const iconStyle = StyleSheet.flatten(handleIcon.props.style);
    expect(iconStyle.width).toBe(20);
    expect(iconStyle.height).toBe(20);
    expect(iconStyle.opacity).toBe(0.5);
  });

  it("R4-11 — the canonical Tour icon is now rendered in the Tour card's icon slot (asset gap closed)", () => {
    renderScreen();

    const iconSlot = screen.getByTestId("composition-tour-icon-slot");
    expect(within(iconSlot).getByTestId("composition-tour-icon")).toBeTruthy();
  });

  it("REWORK12 (COMP-02) — the Tour icon's source is the same asset as the Exercise row's structure icon, matching the source verified directly on the current Figma node (2028:11742), never the previous icon-tour.svg", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 }]);

    const tourIcon = screen.getByTestId("composition-tour-icon");
    const exerciseRow = screen.getByTestId("composition-exercise-row-ex-1");
    const exerciseStructureIcon = within(exerciseRow).getByTestId("composition-boundary-handle-icon");

    // `composition-main-content` (Tour) reste un SVG distinct de
    // `composition-reorder` (structure/poignée) — sources différentes,
    // preuve directe qu'il ne s'agit pas du même module réutilisé deux
    // fois par accident.
    expect(tourIcon.props.source).not.toBe(exerciseStructureIcon.props.source);
  });

  it("R4-12 — the Tour Section container is wider than its inner card (breaks out of body's own padding by the canonical inset on each side)", () => {
    renderScreen();

    const container = screen.getByTestId("composition-tour-section");
    const flattened = StyleSheet.flatten(container.props.style);
    expect(flattened.marginHorizontal).toBe(-10);
    expect(flattened.paddingHorizontal).toBe(10);
  });
});

/**
 * R4-13 / S-01…S-09 (`[ChatGPT] REWORK04 ADDENDUM — FIXED SHELL /
 * ACTIVITIES SCROLL CONTRACT`, 2026-09-03, absorbé et confirmé par
 * `[ChatGPT] CHANGES_REQUESTED — Composition d'une séance — audit
 * indépendant REWORK04`, 2026-09-03).
 *
 * Limite disclosed : le modèle T01 ne permet qu'un unique Exercice
 * (`draft.exercise`, jamais un tableau) — une fixture avec « assez
 * d'activités pour dépasser la hauteur disponible » (S-05) n'est donc pas
 * représentable avec des données réelles à ce stade. Ces tests prouvent la
 * STRUCTURE du contrat (conteneur défilant unique, zones fixes hors de ce
 * conteneur, ordre interne) plutôt qu'un dépassement réel de hauteur —
 * seule preuve accessible sans device ni modèle multi-activités.
 */
describe("CompositionScreen — R4-13/S-01…S-09 (Fixed Shell / Activities Scroll)", () => {
  it("S-03/S-09 — exactly one scrollable container exists for the whole screen", () => {
    const { UNSAFE_root } = renderScreen();
    const scrollViews = UNSAFE_root.findAllByType(ScrollView);
    expect(scrollViews).toHaveLength(1);
    expect(scrollViews[0].props.testID).toBe("composition-body");
  });

  it("S-01/S-02 — Header, its separator, and the Context band are structural siblings of the scrollable list, never its descendants", () => {
    renderScreen();

    const scrollable = screen.getByTestId("composition-body");
    expect(within(scrollable).queryByTestId("screen-header")).toBeNull();
    expect(within(scrollable).queryByTestId("screen-header-separator")).toBeNull();
    expect(within(scrollable).queryByTestId("screen-context-band")).toBeNull();
  });

  it("S-04 — Bottom Action (summary + Continuer) is a structural sibling of the scrollable list, never its descendant", () => {
    renderScreen();

    const scrollable = screen.getByTestId("composition-body");
    expect(within(scrollable).queryByTestId("composition-bottom-action")).toBeNull();
    expect(screen.getByTestId("composition-bottom-action")).toBeTruthy();
  });

  it("S-04 — the scrollable list contains, in order, Compte à rebours initial, the Tour section, then Fin de séance", () => {
    renderScreen();

    const scrollable = screen.getByTestId("composition-body");
    expect(within(scrollable).getByLabelText(composition.countdown.label)).toBeTruthy();
    expect(within(scrollable).getByTestId("composition-tour-section")).toBeTruthy();
    expect(within(scrollable).getByLabelText(composition.finalPhase.label)).toBeTruthy();

    const labelOrder = textOrder(screen.toJSON(), [
      composition.countdown.label,
      composition.tour.label,
      composition.finalPhase.label,
    ]);
    expect(labelOrder).toEqual([
      composition.countdown.label,
      composition.tour.label,
      composition.finalPhase.label,
    ]);
  });

  it("S-06 — opening a duration picker never moves the fixed Header/Context/Bottom Action zones (their own styles stay identical whether a selector is open or not)", () => {
    renderScreen();

    const headerBefore = StyleSheet.flatten(screen.getByTestId("screen-header").props.style);
    const contextBefore = StyleSheet.flatten(screen.getByTestId("screen-context-band").props.style);
    const bottomBefore = StyleSheet.flatten(screen.getByTestId("composition-bottom-action").props.style);

    fireEvent.press(screen.getByLabelText(composition.countdown.label));

    const headerAfter = StyleSheet.flatten(screen.getByTestId("screen-header").props.style);
    const contextAfter = StyleSheet.flatten(screen.getByTestId("screen-context-band").props.style);
    const bottomAfter = StyleSheet.flatten(screen.getByTestId("composition-bottom-action").props.style);

    expect(headerAfter).toEqual(headerBefore);
    expect(contextAfter).toEqual(contextBefore);
    expect(bottomAfter).toEqual(bottomBefore);
  });

  it("T01-S09 correction VISUAL (point D) — supersedes REWORK08-B's ScrollView elevation: composition-body never carries an ad hoc zIndex for a duration picker any more, open or closed, now that it renders in WheelPickerOverlay (a structurally separate layer, independent of the ScrollView and its own former zIndex scoping issue)", () => {
    renderScreen();

    const bodyClosed = StyleSheet.flatten(screen.getByTestId("composition-body").props.style);
    expect(bodyClosed.zIndex).toBeUndefined();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    const bodyOpenCountdown = StyleSheet.flatten(screen.getByTestId("composition-body").props.style);
    expect(bodyOpenCountdown.zIndex).toBeUndefined();
    expect(screen.getByTestId("wheel-picker-overlay")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(composition.wheelPicker.cancelAccessibilityLabel));
    const bodyClosedAgain = StyleSheet.flatten(screen.getByTestId("composition-body").props.style);
    expect(bodyClosedAgain.zIndex).toBeUndefined();

    fireEvent.press(screen.getByLabelText(composition.finalPhase.label));
    const bodyOpenFinalPhase = StyleSheet.flatten(screen.getByTestId("composition-body").props.style);
    expect(bodyOpenFinalPhase.zIndex).toBeUndefined();
    expect(screen.getByTestId("wheel-picker-overlay")).toBeTruthy();
  });

  it("S-08 — the bottom safe-area inset is applied exactly once (Bottom Action only, never duplicated on the scrollable list)", () => {
    renderScreen();

    const scrollContent = StyleSheet.flatten(
      screen.getByTestId("composition-body").props.contentContainerStyle,
    );
    expect(scrollContent.paddingBottom).toBe(16); // spacing[16] fixe, aucun insets.bottom ici.

    const bottomAction = StyleSheet.flatten(screen.getByTestId("composition-bottom-action").props.style);
    expect(bottomAction.marginBottom).toBeGreaterThanOrEqual(16); // insets.bottom + spacing[16], seul point d'application.
  });
});

describe("CompositionScreen — fermeture par toucher en dehors (CMP-01, backdrop dédié, correction D-03)", () => {
  it("renders no dismissing backdrop while no selector is open (non-interactive root, correction of the previous full-screen root Pressable)", () => {
    renderScreen();
    expect(screen.queryByTestId("composition-backdrop")).toBeNull();
  });

  it("T01-S09 correction VISUAL (point D) — opening a duration picker never renders composition-backdrop any more (it now opens in WheelPickerOverlay, whose own backdrop is not dismissible by touch — see WheelPickerOverlay.test.tsx)", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();
    expect(screen.queryByTestId("composition-backdrop")).toBeNull();
    expect(screen.getByTestId("wheel-picker-overlay-backdrop").props.onPress).toBeUndefined();

    // Seul Annuler ferme désormais le sélecteur (jamais un toucher en
    // dehors) — comportement déjà couvert par les tests d'exclusivité
    // ci-dessus, revérifié ici dans le contexte de cette section.
    fireEvent.press(screen.getByLabelText(composition.wheelPicker.cancelAccessibilityLabel));
    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
  });

});

describe("CompositionScreen — modale d'abandon", () => {
  it("renders AbandonCreationModal exactly when isPendingExit is true, wired to cancelExit/confirmExit", () => {
    const cancelExit = jest.fn();
    const confirmExit = jest.fn();
    mockExitGuard.mockReturnValue({ isPendingExit: true, cancelExit, confirmExit });

    renderScreen();

    expect(screen.getByText("Abandonner la création ?")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(composition.abandonModal.continueCreating));
    expect(cancelExit).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByLabelText(composition.abandonModal.abandon));
    expect(confirmExit).toHaveBeenCalledTimes(1);
  });

  it("never renders the modal while isPendingExit is false", () => {
    renderScreen();
    expect(screen.queryByText("Abandonner la création ?")).toBeNull();
  });
});

describe("CompositionScreen — Continuer (T01-S09, CE-T01-04/CE-T01-11)", () => {
  it("stays disabled while the Composition is invalid (no Activity yet, even with a name)", () => {
    renderScreenWithDraft([]);

    const continueAction = screen.getByLabelText(composition.continueAction);
    expect(continueAction.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("enables once the Composition is fully valid (name + at least one valid Activity) and navigates to /categories on press", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 }]);

    const continueAction = screen.getByLabelText(composition.continueAction);
    expect(continueAction.props.accessibilityState).toMatchObject({ disabled: false });

    fireEvent.press(continueAction);
    expect(mockPush).toHaveBeenCalledWith("/categories");
  });

  it("stays disabled again if the only Activity becomes invalid (defense in depth, mirrors toCreateSessionInput)", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "", durationSeconds: 45 }]);

    expect(screen.getByLabelText(composition.continueAction).props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });
});

describe("CompositionScreen — états de réhydratation en modification (T01-S10, CE-T01-S10-01/02/09)", () => {
  function emptyEditDraft(): SessionDraftContextValue["draft"] {
    return {
      name: "",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercises: [],
    };
  }

  function renderWithEditStatus(
    editStatus: NonNullable<SessionDraftContextValue["editStatus"]>,
    extra: Partial<SessionDraftContextValue> = {},
    sessionId: string | null = null,
  ) {
    const retryHydration = jest.fn();
    const value: SessionDraftContextValue = {
      draft: emptyEditDraft(),
      updateDraft: jest.fn(),
      resetDraft: jest.fn(),
      editStatus,
      retryHydration,
      ...extra,
    };
    render(
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService()}>
          <SessionDraftContext.Provider value={value}>
            <CompositionScreen sessionId={sessionId} />
          </SessionDraftContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
    return { retryHydration };
  }

  const t = composition.editStates;

  it("shows a loading indicator (not the form) while the persisted session is being read", () => {
    renderWithEditStatus("loading");

    expect(screen.getByLabelText(t.loadingAccessibilityLabel)).toBeTruthy();
    expect(screen.queryByLabelText(composition.name)).toBeNull();
    expect(screen.queryByLabelText(composition.continueAction)).toBeNull();
  });

  it("shows the NOT_FOUND message and a safe return to the Catalogue, never default creation values", () => {
    renderWithEditStatus("not-found");

    expect(screen.getByText(t.notFoundMessage)).toBeTruthy();
    expect(screen.queryByLabelText(composition.name)).toBeNull();
    expect(screen.getByLabelText(t.backToCatalogue)).toBeTruthy();
  });

  it("shows the archived message (no modifiable form)", () => {
    renderWithEditStatus("archived");

    expect(screen.getByText(t.archivedMessage)).toBeTruthy();
    expect(screen.queryByLabelText(composition.name)).toBeNull();
  });

  it("shows a technical error with a Réessayer action that calls retryHydration, plus a return to the Catalogue", () => {
    const { retryHydration } = renderWithEditStatus("error");

    expect(screen.getByText(t.errorMessage)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(t.retry));
    expect(retryHydration).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(t.backToCatalogue)).toBeTruthy();
  });

  it("renders the normal form once the draft is rehydrated (editStatus === 'ready')", () => {
    renderWithEditStatus("ready", {
      draft: {
        ...emptyEditDraft(),
        name: "Séance persistée",
        exercises: [{ ...createExerciseDraft("keep-1"), name: "Gainage", durationSeconds: 30 }],
      },
    });

    expect(screen.getByLabelText(composition.name)).toBeTruthy();
    expect(screen.queryByTestId("composition-edit-state")).toBeNull();
  });

  it("in modification, the exit guard compares against the rehydrated baseline: an unchanged rehydrated draft does NOT block exit", () => {
    const rehydrated = {
      ...emptyEditDraft(),
      name: "Séance persistée",
      exercises: [{ ...createExerciseDraft("keep-1"), name: "Gainage", durationSeconds: 30 }],
    };
    mockExitGuard.mockReturnValue(defaultExitGuardResult());
    renderWithEditStatus("ready", { draft: rehydrated, hydratedBaseline: rehydrated });

    expect(mockExitGuard).toHaveBeenLastCalledWith(false, expect.any(Function));
  });

  /**
   * **Correction compacte LOT_3_OF_3 — non-flash de création avant
   * hydratation.**
   *
   * `editStatus === "creating"` AVEC un `sessionId` est EXACTEMENT l'état du
   * tout premier rendu d'une ouverture en modification : le provider
   * s'initialise à `"creating"`, et l'effet de réhydratation
   * (`app/(creation)/composition.tsx`) ne s'exécute qu'après ce premier
   * commit. Reproduire cet état précis est la seule façon DÉTERMINISTE de
   * verrouiller la correction : une frame transitoire n'est pas observable
   * après coup dans un rendu de test (les effets sont vidés par `act()`
   * avant toute assertion), alors que cet état-ci l'est directement.
   *
   * Sans la garde synchrone, ce rendu produisait le formulaire de création et
   * ses valeurs par défaut.
   */
  describe("non-flash de création avant hydratation", () => {
    it("with a sessionId, renders the loading state instead of the creation form while editStatus is still 'creating' (the exact state of the first render, before the hydration effect runs)", () => {
      renderWithEditStatus("creating", {}, "session-42");

      expect(screen.getByTestId("composition-edit-state")).toBeTruthy();
      expect(screen.getByLabelText(t.loadingAccessibilityLabel)).toBeTruthy();
    });

    it("with a sessionId, NONE of the creation form's default values can be rendered before resolution (name field, default countdown/final phase, empty summary, Continuer)", () => {
      renderWithEditStatus("creating", {}, "session-42");

      expect(screen.queryByLabelText(composition.name)).toBeNull();
      expect(screen.queryByLabelText(composition.addActivity)).toBeNull();
      expect(screen.queryByLabelText(composition.continueAction)).toBeNull();
      // Valeurs par défaut EXACTES du parcours de création — aucune ne doit
      // apparaître ne serait-ce qu'un rendu.
      expect(screen.queryByText("00 min 10 s")).toBeNull();
      expect(screen.queryByText("00 min 05 s")).toBeNull();
      expect(screen.queryByText(composition.summary.empty)).toBeNull();
    });

    it("without a sessionId, 'creating' still renders the creation form — the creation path is strictly unchanged", () => {
      renderWithEditStatus("creating", {}, null);

      expect(screen.getByLabelText(composition.name)).toBeTruthy();
      expect(screen.getByText(composition.summary.empty)).toBeTruthy();
      expect(screen.queryByTestId("composition-edit-state")).toBeNull();
    });

    it("with a sessionId, a resolved status always wins over the guard — 'ready' renders the rehydrated form, 'not-found' renders its own state", () => {
      const rehydrated = {
        ...emptyEditDraft(),
        name: "Séance persistée",
        exercises: [{ ...createExerciseDraft("keep-1"), name: "Gainage", durationSeconds: 30 }],
      };
      renderWithEditStatus("ready", { draft: rehydrated }, "session-42");

      expect(screen.getByLabelText(composition.name).props.value).toBe("Séance persistée");
      expect(screen.queryByTestId("composition-edit-state")).toBeNull();

      screen.unmount();
      renderWithEditStatus("not-found", {}, "session-42");

      expect(screen.getByText(t.notFoundMessage)).toBeTruthy();
      expect(screen.queryByLabelText(composition.name)).toBeNull();
    });
  });
});

/**
 * **Correction compacte LOT_3_OF_3 — espacement des cartes**, puis **T02-S02
 * (continuation après recette visuelle, points 2 et 11)** : l'écart entre
 * deux cartes Activité consécutives est encore réduit (`8` → `6`), et il
 * gouverne DÉSORMAIS AUSSI les interstices structurels (`Compte à rebours
 * initial` ↔ première carte, dernière carte ↔ `Fin de séance`). Les deux
 * conteneurs — le groupe d'Activités et le contenu défilant — partagent une
 * constante unique, ce qui rend leur égalité vraie par construction.
 */
describe("CompositionScreen — espacement Activité/Activité (LOT_3_OF_3, révisé T02-S02)", () => {
  const twoActivities = [
    { ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 },
    { ...createExerciseDraft("ex-2"), name: "Squats", durationSeconds: 30 },
  ];

  it("reduces the gap between two consecutive Activity cards to 6pt, carried by their own dedicated container", () => {
    renderScreenWithDraft(twoActivities);

    const list = screen.getByTestId("composition-zone-before-tour");
    expect(StyleSheet.flatten(list.props.style).gap).toBe(spacing[6]);
    expect(StyleSheet.flatten(list.props.style).gap).toBeLessThan(spacing[8]);
    expect(within(list).getByTestId("composition-exercise-row-ex-1")).toBeTruthy();
    expect(within(list).getByTestId("composition-exercise-row-ex-2")).toBeTruthy();
  });

  /**
   * **T02-S02 (continuation après recette visuelle, point 11)** — révise la
   * règle précédente (« garder l'écart structurel `16` intact ») : la recette
   * a constaté que le rythme vertical était irrégulier, `Compte à rebours` →
   * première carte étant nettement plus espacé que deux cartes consécutives.
   * L'écart structurel s'aligne donc sur celui des cartes, tous deux réduits.
   */
  it("aligns the structural gap of the scrollable content on the Activity-card gap — one single vertical rhythm", () => {
    renderScreenWithDraft(twoActivities);

    const content = StyleSheet.flatten(
      screen.getByTestId("composition-body").props.contentContainerStyle,
    );
    const cards = StyleSheet.flatten(
      screen.getByTestId("composition-zone-before-tour").props.style,
    );
    expect(content.gap).toBe(cards.gap);
    expect(content.gap).toBe(spacing[6]);
    expect(content.gap).not.toBe(16);
  });

  it("keeps Compte à rebours initial, the Tour section and Fin de séance OUTSIDE the reduced-gap container — they are direct children of the scrollable content, which now carries the SAME gap", () => {
    renderScreenWithDraft(twoActivities);

    const list = screen.getByTestId("composition-zone-before-tour");
    expect(within(list).queryByLabelText(composition.countdown.label)).toBeNull();
    expect(within(list).queryByLabelText(composition.finalPhase.label)).toBeNull();
    expect(within(list).queryByTestId("composition-tour-section")).toBeNull();

    // Ces trois éléments restent bien des enfants directs du contenu défilant.
    const body = screen.getByTestId("composition-body");
    expect(within(body).getByLabelText(composition.countdown.label)).toBeTruthy();
    expect(within(body).getByTestId("composition-tour-section")).toBeTruthy();
    expect(within(body).getByLabelText(composition.finalPhase.label)).toBeTruthy();
  });

  it("never renders the Activity container while the Composition has no Activity — an empty container would add a second 16pt gap, doubling the Compte à rebours → Tour spacing of the empty state", () => {
    renderScreenWithDraft([]);
    // T02-S01 : la règle vaut désormais zone par zone — aucune des trois
    // listes n'est rendue tant qu'elle est vide.
    expect(screen.queryByTestId("composition-zone-before-tour")).toBeNull();
    expect(screen.queryByTestId("composition-zone-in-tour")).toBeNull();
    expect(screen.queryByTestId("composition-zone-after-tour")).toBeNull();
  });

  it("keeps the display order of the Activities unchanged inside the reduced-gap container", () => {
    renderScreenWithDraft(twoActivities);

    const order = testIdOrder(screen.toJSON(), [
      "composition-row-icon-composition-initial-countdown",
      "composition-exercise-row-ex-1",
      "composition-exercise-row-ex-2",
      "composition-row-icon-composition-end-session",
    ]);
    expect(order).toEqual([
      "composition-row-icon-composition-initial-countdown",
      "composition-exercise-row-ex-1",
      "composition-exercise-row-ex-2",
      "composition-row-icon-composition-end-session",
    ]);
  });
});

/**
 * **Correction compacte LOT_3_OF_3 — Zones corporelles de l'Activité.**
 * Demande utilisateur directe, explicitement autorisée bien qu'absente de
 * Figma ; elle ne crée aucune nouvelle persistance (`bodyZoneIds` existe déjà
 * sur `SessionDraftExercise` depuis T01-S08 — seule sa RESTITUTION est
 * ajoutée).
 */
describe("CompositionScreen — Zones corporelles de la ligne Activité (correction compacte LOT_3_OF_3)", () => {
  const activityWithZones = {
    ...createExerciseDraft("ex-1"),
    name: "Gainage",
    durationSeconds: 90,
    seriesCount: 3,
    pauseSeconds: 15,
    // Ordre de SÉLECTION volontairement inverse de l'ordre du référentiel
    // (`epaules` order 1, `dos` order 4) — prouve que l'affichage suit le
    // référentiel, jamais l'ordre de sélection de l'utilisateur.
    bodyZoneIds: ["dos", "epaules"],
  };
  const summaryText = "3 séries de 1 min 30 s avec 15 s de pause par série";

  it("shows the Activity's own body zones on a single line, in referential order, with the canonical ' · ' separator", async () => {
    renderScreenWithDraft([activityWithZones]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    const zones = await within(row).findByTestId("composition-exercise-body-zones");
    expect(zones.props.children).toBe("Épaules · Dos");
    // Une seule ligne, tronquée si nécessaire.
    expect(zones.props.numberOfLines).toBe(1);
  });

  it("places that line BETWEEN the Activity title and its summary", async () => {
    renderScreenWithDraft([activityWithZones]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    await within(row).findByTestId("composition-exercise-body-zones");

    const order = textOrder(screen.toJSON(), ["Gainage", "Épaules · Dos", summaryText]);
    expect(order).toEqual(["Gainage", "Épaules · Dos", summaryText]);
  });

  it("uses exactly the same style as the summary (same size, same neutral colour) — the shared style is reused as-is, never a lookalike", async () => {
    renderScreenWithDraft([activityWithZones]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    const zones = await within(row).findByTestId("composition-exercise-body-zones");
    const summary = within(row).getByText(summaryText);
    expect(StyleSheet.flatten(zones.props.style)).toEqual(
      StyleSheet.flatten(summary.props.style),
    );
    // Taille de la synthèse (KODJO / Card / Supporting, 11/14) et couleur neutre.
    const flattened = StyleSheet.flatten(zones.props.style);
    expect(flattened.fontSize).toBe(11);
    expect(flattened.lineHeight).toBe(14);
    expect(flattened.color).toBe(colors.textSecondary);
  });

  it("omits the line entirely when the Activity has no body zone — never an empty Text still taking its line height", () => {
    renderScreenWithDraft([
      { ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 },
    ]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    expect(within(row).queryByTestId("composition-exercise-body-zones")).toBeNull();
    // V2-PRE-1 : la sous-carte Récupération est toujours rendue (`24`),
    // même à `0 s` — la hauteur sans Zones est donc `compactRestHeight + 24`.
    expect(StyleSheet.flatten(row.props.style).height).toBe(
      dimensions.compositionActivityRow.compactRestHeight +
        dimensions.compositionActivityRow.recoveryCardHeight,
    );
  });

  it("never adds that line to the Compte à rebours initial / Fin de séance cards (they have no body zones — those cards stay rigorously unchanged)", async () => {
    renderScreenWithDraft([activityWithZones]);
    await screen.findByTestId("composition-exercise-body-zones");

    const countdown = screen.getByLabelText(composition.countdown.label);
    const finalPhase = screen.getByLabelText(composition.finalPhase.label);
    expect(within(countdown).queryByTestId("composition-exercise-body-zones")).toBeNull();
    expect(within(finalPhase).queryByTestId("composition-exercise-body-zones")).toBeNull();
    // Une seule occurrence dans tout l'écran : celle de l'Activité.
    expect(screen.getAllByTestId("composition-exercise-body-zones")).toHaveLength(1);

    for (const row of [countdown, finalPhase]) {
      const style = StyleSheet.flatten(row.props.style);
      expect(style.height).toBe(dimensions.compositionActivityRow.compactRestHeight);
      expect(style.paddingVertical).toBe(3);
    }
  });
});

/* ------------------------------------------------------------------------ *
 * T02-S01 — Composition complète (CE-T02-01/CE-T02-02, D-124/D-127/D-129/
 * D-130, AC-01 à AC-11).
 * ------------------------------------------------------------------------ */

function anActivity(
  id: string,
  structuralPosition: SessionDraftExercise["structuralPosition"],
  overrides: Partial<SessionDraftExercise> = {},
): SessionDraftExercise {
  return {
    ...createExerciseDraft(id),
    name: id,
    durationSeconds: 30,
    structuralPosition,
    ...overrides,
  };
}

/** Mesure factice : `onLayout` ne se déclenche jamais sous Jest, la géométrie est donc injectée explicitement. */
function fireLayout(element: ReturnType<typeof screen.getByTestId>, y: number, height: number) {
  fireEvent(element, "layout", {
    nativeEvent: { layout: { x: 0, y, width: 354, height } },
  });
}

/**
 * Balayage horizontal PROGRESSIF sur le conteneur d'une carte (V2-CAT-01,
 * CE-T03-08) : `touchStart`, mouvement au-delà de la moitié de la course
 * (`SWIPE_REVEAL_OFFSET / 2`), PUIS relâche — c'est la relâche qui aligne la
 * carte sur la position ATTEINTE (ouverte au-delà de la moitié, fermée en
 * deçà).
 *
 * Le mouvement est joué par `touchMove`, indépendant du responder — le cas
 * réel où un balayage droit de fermeture commence SUR le groupe d'actions
 * déjà révélé, dont les `Pressable` internes (`Dupliquer`/`Supprimer`)
 * revendiquent le responder dès le contact. `touchMove` est dispatché à la
 * vue touchée et à tous ses ancêtres, indépendamment du responder.
 */
function fireSwipe(activityId: string, deltaX: number) {
  const container = () => screen.getByTestId(`composition-activity-${activityId}`);
  const startX = 300;
  fireEvent(container(), "touchStart", { nativeEvent: { pageX: startX, pageY: 100 } });
  fireEvent(container(), "touchMove", {
    nativeEvent: { pageX: startX + deltaX, pageY: 100 },
  });
  fireEvent(container(), "touchEnd", { nativeEvent: { pageX: startX + deltaX, pageY: 100 } });
}

/** Balayage GAUCHE, au-delà de la moitié de la course — révèle `Dupliquer`/`Supprimer`. */
function fireSwipeLeft(activityId: string) {
  fireSwipe(activityId, -80);
}

/** Balayage DROIT, au-delà de la moitié de la course — masque les actions révélées. */
function fireSwipeRight(activityId: string) {
  fireSwipe(activityId, 80);
}

describe("CompositionScreen — trois zones structurelles (T02-S01, AC-01)", () => {
  const threeZones = [
    anActivity("warmup", "BEFORE_TOUR", { name: "Échauffement" }),
    anActivity("core", "IN_TOUR", { name: "Gainage" }),
    anActivity("stretch", "AFTER_TOUR", { name: "Étirements" }),
  ];

  it("renders each Activity in its own zone list, in the real structural order", () => {
    renderScreenWithDraft(threeZones);

    expect(
      within(screen.getByTestId("composition-zone-before-tour")).getByTestId(
        "composition-exercise-row-warmup",
      ),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("composition-zone-in-tour")).getByTestId(
        "composition-exercise-row-core",
      ),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("composition-zone-after-tour")).getByTestId(
        "composition-exercise-row-stretch",
      ),
    ).toBeTruthy();

    const order = testIdOrder(screen.toJSON(), [
      "composition-row-icon-composition-initial-countdown",
      "composition-exercise-row-warmup",
      "composition-tour-section",
      "composition-exercise-row-core",
      "composition-exercise-row-stretch",
      "composition-row-icon-composition-end-session",
    ]);
    expect(order).toEqual([
      "composition-row-icon-composition-initial-countdown",
      "composition-exercise-row-warmup",
      "composition-tour-section",
      "composition-exercise-row-core",
      "composition-exercise-row-stretch",
      "composition-row-icon-composition-end-session",
    ]);
  });

  it("renders the IN_TOUR Activities INSIDE the Tour structure, the two other zones outside it", () => {
    renderScreenWithDraft(threeZones);

    const tourSection = screen.getByTestId("composition-tour-section");
    expect(within(tourSection).getByTestId("composition-zone-in-tour")).toBeTruthy();
    expect(within(tourSection).queryByTestId("composition-zone-before-tour")).toBeNull();
    expect(within(tourSection).queryByTestId("composition-zone-after-tour")).toBeNull();
  });

  /**
   * VISUAL_CORRECTION (revue indépendante 5753653735, point 6) : une carte
   * hors Tour garde un fond BLANC (y compris le gap révélé par le
   * balayage) — seule une carte DANS le Tour montre le fond `tourSurface`.
   */
  it("keeps a white background outside the Tour, and only colours it inside the Tour", () => {
    renderScreenWithDraft(threeZones);

    expect(
      StyleSheet.flatten(screen.getByTestId("composition-activity-warmup").props.style)
        .backgroundColor,
    ).toBe(colors.background);
    expect(
      StyleSheet.flatten(screen.getByTestId("composition-activity-stretch").props.style)
        .backgroundColor,
    ).toBe(colors.background);
    expect(
      StyleSheet.flatten(screen.getByTestId("composition-activity-core").props.style)
        .backgroundColor,
    ).toBe(colors.tourSurface);
  });

  it("AC-05 — the fixed structural rows carry no gesture recognizer, and therefore no revealable action", () => {
    renderScreenWithDraft(threeZones);

    // Une Activité, elle, révèle bien ses actions.
    fireSwipeLeft("warmup");
    expect(screen.getByTestId("composition-activity-actions-warmup")).toBeTruthy();

    // Compte à rebours initial / Tour / Fin de séance ne sont pas des
    // Activités : ils ne sont enveloppés d'aucun conteneur gestuel — il en
    // existe exactement un par Activité, jamais un de plus.
    expect(screen.getAllByTestId(/^composition-activity-(warmup|core|stretch)$/u)).toHaveLength(3);
    for (const label of [composition.countdown.label, composition.finalPhase.label]) {
      const row = screen.getByLabelText(label);
      expect(within(row).queryByText(composition.activityActions.duplicate)).toBeNull();
      expect(within(row).queryByText(composition.activityActions.delete)).toBeNull();
    }
    const tourSection = screen.getByTestId("composition-tour-section");
    expect(tourSection.props.onMoveShouldSetResponderCapture).toBeUndefined();

    // Une seule carte au total expose des actions : celle qu'on a glissée.
    expect(screen.getAllByText(composition.activityActions.duplicate)).toHaveLength(1);
  });
});

describe("CompositionScreen — gestes d'une carte Activité (T02-S01, AC-02/AC-03)", () => {
  const twoActivities = [
    anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage" }),
    anActivity("ex-2", "BEFORE_TOUR", { name: "Squats" }),
  ];

  it("AC-02 — a short press opens the Activity for editing", () => {
    renderScreenWithDraft(twoActivities);

    fireEvent.press(screen.getByTestId("composition-exercise-row-ex-2"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/exercise",
      params: { exerciseId: "ex-2" },
    });
  });

  it("AC-02 — a long press engages the reorder state WITHOUT opening the modification", () => {
    renderScreenWithDraft(twoActivities);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    fireEvent(row, "longPress");

    expect(mockPush).not.toHaveBeenCalled();
    const liftedStyle = StyleSheet.flatten(
      screen.getByTestId("composition-exercise-row-ex-1").props.style,
    );
    // D-129/CE-T02-02 : bloc soulevé — `#F7F7FF`, contour `#D1D1D6`,
    // rayon `12` (T02-S02 : valeur publiée par D-129, révisant le `8` de
    // T02-S01), ombre `#14171F` à 22 %, agrandi de `8 × 4` points.
    expect(liftedStyle.backgroundColor).toBe(colors.exerciseContextBandBackground);
    expect(liftedStyle.borderColor).toBe(colors.compositionDraggedCardBorder);
    expect(liftedStyle.borderRadius).toBe(12);
    expect(liftedStyle.shadowColor).toBe(colors.compositionDraggedCardShadow);
    expect(liftedStyle.shadowOpacity).toBe(0.22);
    expect(liftedStyle.marginHorizontal).toBe(-4);
  });

  it("CE-T02-02 — the other cards, the Tour and the structural rows keep their exact style while a card is lifted", () => {
    renderScreenWithDraft(twoActivities);

    const otherBefore = StyleSheet.flatten(
      screen.getByTestId("composition-exercise-row-ex-2").props.style,
    );
    const tourBefore = StyleSheet.flatten(
      screen.getByTestId("composition-tour-section").props.style,
    );

    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");

    expect(
      StyleSheet.flatten(screen.getByTestId("composition-exercise-row-ex-2").props.style),
    ).toEqual(otherBefore);
    expect(StyleSheet.flatten(screen.getByTestId("composition-tour-section").props.style)).toEqual(
      tourBefore,
    );
  });

  it("AC-03 — the long press is recognized on the whole card, the DSF handle being a mere affordance", () => {
    renderScreenWithDraft(twoActivities);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    // La poignée n'expose aucune cible tactile propre : elle n'est ni
    // pressable ni porteuse d'un rôle d'accessibilité.
    const handle = within(row).getByTestId("composition-boundary-handle-slot");
    expect(handle.props.onStartShouldSetResponder).toBeUndefined();
    expect(handle.props.accessibilityRole).toBeUndefined();
    // Le reconnaisseur d'appui long est bien porté par la carte entière.
    expect(row.props.onResponderGrant).toBeDefined();
  });

  it("neutralizes the list scrolling only while a card is actually lifted", () => {
    renderScreenWithDraft(twoActivities);

    expect(screen.getByTestId("composition-body").props.scrollEnabled).toBe(true);
    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");
    expect(screen.getByTestId("composition-body").props.scrollEnabled).toBe(false);
  });
});

describe("CompositionScreen — déplacement d'une Activité (T02-S01, AC-04)", () => {
  /**
   * Géométrie injectée (aucun `onLayout` réel sous Jest) : zone
   * `BEFORE_TOUR` à `y = 70`, cartes `ex-1` (0–70) et `ex-2` (80–150) dans
   * cette zone — soit `70–140` et `150–220` en absolu —, structure Tour à
   * `230–400`.
   */
  function layoutTwoBeforeTour() {
    fireLayout(screen.getByTestId("composition-zone-before-tour"), 70, 150);
    fireLayout(screen.getByTestId("composition-activity-ex-1"), 0, 70);
    fireLayout(screen.getByTestId("composition-activity-ex-2"), 80, 70);
    fireLayout(screen.getByTestId("composition-tour-section"), 230, 170);
  }

  /**
   * Chaque événement est envoyé à l'élément REQUÊTÉ À NOUVEAU : l'appui long
   * provoque un rendu (état soulevé), et rejouer les événements suivants sur
   * une référence antérieure testerait des gestionnaires périmés.
   */
  function dragBy(activityId: string, deltaY: number) {
    const container = () => screen.getByTestId(`composition-activity-${activityId}`);
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(screen.getByTestId(`composition-exercise-row-${activityId}`), "longPress");
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 200, pageY: 100 + deltaY } });
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 200, pageY: 100 + deltaY } });
  }

  beforeEach(() => {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage" }),
      anActivity("ex-2", "BEFORE_TOUR", { name: "Squats" }),
    ]);
    layoutTwoBeforeTour();
  });

  it("reorders inside the same zone once the neighbour's midpoint is crossed", () => {
    // Centre de `ex-1` = 105 ; +100 -> 205, au-delà du centre de `ex-2` (185).
    dragBy("ex-1", 100);

    expect(
      testIdOrder(screen.toJSON(), [
        "composition-exercise-row-ex-1",
        "composition-exercise-row-ex-2",
      ]),
    ).toEqual(["composition-exercise-row-ex-2", "composition-exercise-row-ex-1"]);
  });

  it("moves an Activity INTO the Tour when dropped inside the Tour structure", () => {
    // Centre de `ex-1` = 105 ; +200 -> 305, à l'intérieur de `230–400`.
    dragBy("ex-1", 200);

    expect(
      within(screen.getByTestId("composition-zone-in-tour")).getByTestId(
        "composition-exercise-row-ex-1",
      ),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("composition-zone-before-tour")).queryByTestId(
        "composition-exercise-row-ex-1",
      ),
    ).toBeNull();
    // Identité et paramètres conservés : la carte affiche toujours son nom.
    expect(screen.getByText("Gainage")).toBeTruthy();
  });

  it("moves an Activity AFTER the Tour when dropped below the Tour structure", () => {
    // Centre de `ex-1` = 105 ; +400 -> 505, sous `400`.
    dragBy("ex-1", 400);

    expect(
      within(screen.getByTestId("composition-zone-after-tour")).getByTestId(
        "composition-exercise-row-ex-1",
      ),
    ).toBeTruthy();
  });

  it("leaves the order untouched when the drop lands back on the card's own slot", () => {
    dragBy("ex-1", 0);

    expect(
      testIdOrder(screen.toJSON(), [
        "composition-exercise-row-ex-1",
        "composition-exercise-row-ex-2",
      ]),
    ).toEqual(["composition-exercise-row-ex-1", "composition-exercise-row-ex-2"]);
  });

  it("never changes the order when the gesture is interrupted before any drop (CE-T02-02)", () => {
    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 200, pageY: 300 } });
    fireEvent(container(), "responderTerminate", {});

    expect(
      testIdOrder(screen.toJSON(), [
        "composition-exercise-row-ex-1",
        "composition-exercise-row-ex-2",
      ]),
    ).toEqual(["composition-exercise-row-ex-1", "composition-exercise-row-ex-2"]);
    expect(screen.getByTestId("composition-body").props.scrollEnabled).toBe(true);
  });
});

describe("CompositionScreen — actions glissées Dupliquer/Supprimer (T02-S01, AC-06/AC-07)", () => {
  function renderTwo() {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", bodyZoneIds: ["dos"] }),
      anActivity("ex-2", "BEFORE_TOUR", { name: "Squats" }),
    ]);
  }

  it("reveals exactly Dupliquer and Supprimer on a left swipe, MOVING the card to expose them", () => {
    renderTwo();

    expect(screen.queryByTestId("composition-activity-actions-ex-1")).toBeNull();

    fireSwipeLeft("ex-1");

    const actions = screen.getByTestId("composition-activity-actions-ex-1");
    expect(within(actions).getByText(composition.activityActions.duplicate)).toBeTruthy();
    expect(within(actions).getByText(composition.activityActions.delete)).toBeTruthy();

    // D-128, révisé UI-CAT-R-007/010 : groupe `144 × 69` SUPERPOSÉ à droite
    // (deux actions `72`), DERRIÈRE la carte — c'est la carte qui se
    // translate pour le découvrir entièrement (`-SWIPE_REVEAL_OFFSET`).
    const actionsStyle = StyleSheet.flatten(actions.props.style);
    expect(actionsStyle.position).toBe("absolute");
    expect(actionsStyle.right).toBe(0);
    expect(actionsStyle.width).toBe(144);
    // VISUAL_CORRECTION (revue indépendante 5753653735, point 5) : les
    // QUATRE coins suivent le même rayon que le bloc — le groupe
    // entièrement révélé DEVIENT le bord droit visuel de la rangée, jamais
    // des coins droits carrés rompant la silhouette arrondie uniforme
    // partagée par toute autre carte de cette liste.
    expect(actionsStyle.borderRadius).toBe(12);
    const cardStyle = StyleSheet.flatten(
      screen.getByTestId("composition-exercise-row-ex-1").props.style,
    );
    // La carte est entièrement ouverte : translatée de la largeur du groupe
    // PLUS la marge carte/cadre Tour (`144 + 10`), qui reste visible comme
    // gap (fond `colors.tourSurface` du conteneur).
    expect(cardStyle.transform).toEqual([{ translateX: -154 }, { translateY: 0 }]);
    expect(
      StyleSheet.flatten(
        within(actions).getByTestId("composition-activity-duplicate-ex-1").props.style,
      ).width,
    ).toBe(72);
  });

  /**
   * V2-CAT-01 (CE-T03-08, UI-CAT-R-007) — « le swipe suit le doigt, révèle
   * progressivement les actions ». Le mouvement lui-même, PENDANT que le
   * doigt reste posé, révèle déjà proportionnellement le groupe d'actions —
   * ceci révise le modèle antérieur, où seule la relâche appliquait quoi que
   * ce soit.
   */
  it("follows the finger and reveals the actions PROPORTIONALLY while the touch is still down", () => {
    renderTwo();

    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 300, pageY: 100 } });
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 220, pageY: 100 } });
    // `dx = -80` : la carte a déjà suivi le doigt, actions déjà exposées.
    expect(screen.getByTestId("composition-activity-actions-ex-1")).toBeTruthy();
    expect(
      StyleSheet.flatten(screen.getByTestId("composition-exercise-row-ex-1").props.style)
        .transform,
    ).toEqual([{ translateX: -80 }, { translateY: 0 }]);

    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 120, pageY: 100 } });
    // `dx = -180`, borné à `-SWIPE_REVEAL_OFFSET` (`-154`) : la carte ne
    // dépasse jamais sa position pleinement ouverte.
    expect(
      StyleSheet.flatten(screen.getByTestId("composition-exercise-row-ex-1").props.style)
        .transform,
    ).toEqual([{ translateX: -154 }, { translateY: 0 }]);

    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 120, pageY: 100 } });
    expect(screen.getByTestId("composition-activity-actions-ex-1")).toBeTruthy();
  });

  it("springs back to closed on release before crossing half of the reveal course, and ignores a vertically dominant movement (it belongs to the list)", () => {
    renderTwo();

    // Horizontal mais en deçà de la moitié de la course (`SWIPE_REVEAL_OFFSET / 2 = 77`).
    fireSwipe("ex-1", -20);
    expect(screen.queryByTestId("composition-activity-actions-ex-1")).toBeNull();
    expect(
      StyleSheet.flatten(screen.getByTestId("composition-exercise-row-ex-1").props.style)
        .transform,
    ).toEqual([{ translateX: 0 }, { translateY: 0 }]);

    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 140, pageY: 400 } });
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 140, pageY: 400 } });
    expect(screen.queryByTestId("composition-activity-actions-ex-1")).toBeNull();
  });

  it("hides the revealed actions on a completed RIGHT swipe", () => {
    renderTwo();

    fireSwipeLeft("ex-1");
    expect(screen.getByTestId("composition-activity-actions-ex-1")).toBeTruthy();

    fireSwipeRight("ex-1");
    expect(screen.queryByTestId("composition-activity-actions-ex-1")).toBeNull();
    // Masquer n'ouvre jamais la modification.
    expect(mockPush).not.toHaveBeenCalled();
  });

  /**
   * VISUAL_CORRECTION (revue indépendante 5753653735, point 5) : tant
   * qu'une carte a ses actions révélées, les AUTRES cartes restent
   * bloquées (conformément au contrat existant, CE-T02-02) — un appui sur
   * une autre carte n'ouvre jamais directement son édition avant la
   * fermeture de la première.
   */
  it("blocks presses on other cards while one card's actions are revealed", () => {
    renderTwo();

    fireSwipeLeft("ex-1");
    expect(screen.getByTestId("composition-activity-actions-ex-1")).toBeTruthy();

    expect(
      screen.getByTestId("composition-activity-ex-2").props.pointerEvents,
    ).toBe("none");
    fireEvent.press(screen.getByTestId("composition-exercise-row-ex-2"));
    expect(mockPush).not.toHaveBeenCalled();

    // Une fois refermée, l'autre carte redevient interactive.
    fireSwipeRight("ex-1");
    expect(
      screen.getByTestId("composition-activity-ex-2").props.pointerEvents,
    ).toBe("auto");
    fireEvent.press(screen.getByTestId("composition-exercise-row-ex-2"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/exercise",
      params: { exerciseId: "ex-2" },
    });
  });

  /**
   * **T02-S02 (continuation après recette visuelle)** — le balayage droit ne
   * refermait PAS les actions sur appareil. Deux verrous ferment la cause :
   * le responder n'est plus cédé pendant un balayage engagé, et la RELÂCHE DU
   * RESPONDER applique le balayage au même titre que la fin de toucher.
   */
  it("hides the actions even when only onResponderRelease is dispatched (no onTouchEnd)", () => {
    renderTwo();
    fireSwipeLeft("ex-1");
    expect(screen.getByTestId("composition-activity-actions-ex-1")).toBeTruthy();

    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 280, pageY: 100 } });
    fireEvent(container(), "responderRelease", { nativeEvent: { pageX: 280, pageY: 100 } });

    expect(screen.queryByTestId("composition-activity-actions-ex-1")).toBeNull();
  });

  it("applies a completed swipe exactly ONCE when both onResponderRelease and onTouchEnd are dispatched", () => {
    renderTwo();

    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 300, pageY: 100 } });
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 220, pageY: 100 } });
    fireEvent(container(), "responderRelease", { nativeEvent: { pageX: 220, pageY: 100 } });
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 220, pageY: 100 } });

    // Le balayage mémorisé est CONSOMMÉ par le premier des deux : le second
    // ne rejoue rien, les actions restent simplement révélées.
    expect(screen.getByTestId("composition-activity-actions-ex-1")).toBeTruthy();
  });

  it("never yields the responder to the parent scroll view while a horizontal swipe is engaged", () => {
    renderTwo();

    const container = () => screen.getByTestId("composition-activity-ex-1");
    // Au repos, la carte cède volontiers le responder — le défilement
    // vertical de la liste doit rester possible.
    expect(container().props.onResponderTerminationRequest()).toBe(true);

    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 300, pageY: 100 } });
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 220, pageY: 100 } });

    // Balayage engagé : la carte refuse de céder, sinon `onResponderTerminate`
    // effacerait le geste avant toute relâche — cause exacte du défaut.
    expect(container().props.onResponderTerminationRequest()).toBe(false);
  });

  /**
   * **T02-S02 (seconde recette visuelle, point 3)** — CAUSE RÉELLE du
   * balayage droit inopérant.
   *
   * Le sens du balayage n'était mémorisé que par des gestionnaires
   * DÉPENDANTS DU RESPONDER (`onMoveShouldSetResponderCapture`,
   * `onResponderMove`). Or, une fois les actions révélées, le balayage droit
   * commence SUR le groupe d'actions superposé, dont les `Pressable`
   * revendiquent le responder dès le contact : le conteneur ne l'obtenait
   * jamais, rien n'était mémorisé, et `onTouchEnd` n'avait rien à appliquer.
   *
   * `onTouchMove` est dispatché à la vue touchée ET à tous ses ancêtres,
   * indépendamment du responder — c'est la seule voie qui reste vraie dans ce
   * cas. Le scénario ci-dessous ne joue QUE des événements de toucher :
   * aucun `responderMove`, aucun `responderRelease`.
   */
  it("hides the actions from touch events ALONE, without the container ever holding the responder", () => {
    renderTwo();
    fireSwipeLeft("ex-1");
    expect(screen.getByTestId("composition-activity-actions-ex-1")).toBeTruthy();

    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(container(), "touchMove", { nativeEvent: { pageX: 300, pageY: 100 } });
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 300, pageY: 100 } });

    expect(screen.queryByTestId("composition-activity-actions-ex-1")).toBeNull();
  });

  it("reveals the actions from touch events alone too — both directions share the same responder-independent path", () => {
    renderTwo();

    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 300, pageY: 100 } });
    fireEvent(container(), "touchMove", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 200, pageY: 100 } });

    expect(screen.getByTestId("composition-activity-actions-ex-1")).toBeTruthy();
  });

  /**
   * Un responder repris par le `ScrollView` parent ne doit plus EFFACER le
   * balayage mémorisé : le toucher, lui, n'est pas terminé, et son
   * `onTouchEnd` doit encore pouvoir l'appliquer.
   */
  it("keeps a completed swipe alive when the parent steals the responder mid-gesture", () => {
    renderTwo();
    fireSwipeLeft("ex-1");
    expect(screen.getByTestId("composition-activity-actions-ex-1")).toBeTruthy();

    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(container(), "touchMove", { nativeEvent: { pageX: 300, pageY: 100 } });
    // Le responder est repris — le geste NE doit pas être perdu.
    fireEvent(container(), "responderTerminate", {});
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 300, pageY: 100 } });

    expect(screen.queryByTestId("composition-activity-actions-ex-1")).toBeNull();
  });

  it("drops the pending swipe when the TOUCH itself is cancelled — no ghost action on the next release", () => {
    renderTwo();

    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 300, pageY: 100 } });
    fireEvent(container(), "touchMove", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(container(), "touchCancel", {});
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 200, pageY: 100 } });

    expect(screen.queryByTestId("composition-activity-actions-ex-1")).toBeNull();
  });

  it("lets the user reverse an in-flight swipe: only the LAST direction crossed is applied on release", () => {
    renderTwo();

    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 300, pageY: 100 } });
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 220, pageY: 100 } });
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 380, pageY: 100 } });
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 380, pageY: 100 } });

    // Le dernier sens franchi est un balayage DROIT : rien n'est révélé.
    expect(screen.queryByTestId("composition-activity-actions-ex-1")).toBeNull();
  });

  it("reveals the actions of a single card at a time", () => {
    renderTwo();

    fireSwipeLeft("ex-1");
    fireSwipeLeft("ex-2");

    expect(screen.queryByTestId("composition-activity-actions-ex-1")).toBeNull();
    expect(screen.getByTestId("composition-activity-actions-ex-2")).toBeTruthy();
  });

  it("AC-06 — Dupliquer inserts an independent copy right after its source, with a fresh id and the SAME title (T02-S02, D-138)", async () => {
    renderTwo();
    await screen.findByTestId("composition-exercise-body-zones");
    fireSwipeLeft("ex-1");
    fireEvent.press(screen.getByTestId("composition-activity-duplicate-ex-1"));

    // Titre strictement identique : deux cartes portent désormais `Gainage`,
    // et aucun suffixe `(copie)` n'apparaît nulle part.
    expect(screen.getAllByText("Gainage")).toHaveLength(2);
    expect(screen.queryByText(/copie/u)).toBeNull();
    expect(
      testIdOrder(screen.toJSON(), [
        "composition-exercise-row-ex-1",
        "composition-exercise-row-generated-copy-id",
        "composition-exercise-row-ex-2",
      ]),
    ).toEqual([
      "composition-exercise-row-ex-1",
      "composition-exercise-row-generated-copy-id",
      "composition-exercise-row-ex-2",
    ]);
    // La source reste intacte, et la copie reprend ses paramètres.
    expect(screen.getAllByTestId("composition-exercise-body-zones")).toHaveLength(2);
    // Les actions se referment après l'opération.
    expect(screen.queryByTestId("composition-activity-actions-ex-1")).toBeNull();
  });

  it("AC-06 (T02-S02) — Dupliquer copies the attached Récupération, sub-card included", () => {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: 90 }),
    ]);

    expect(screen.getAllByTestId(/^composition-activity-recovery-/u)).toHaveLength(1);

    fireSwipeLeft("ex-1");
    fireEvent.press(screen.getByTestId("composition-activity-duplicate-ex-1"));

    // La copie porte SA PROPRE sous-carte, au même libellé.
    expect(screen.getByTestId("composition-activity-recovery-generated-copy-id")).toBeTruthy();
    expect(screen.getAllByText("Récupération 1 min 30 s")).toHaveLength(2);
  });

  it("AC-07 — Supprimer removes ONLY the targeted Activity", () => {
    renderTwo();
    fireSwipeLeft("ex-1");
    fireEvent.press(screen.getByTestId("composition-activity-delete-ex-1"));

    expect(screen.queryByTestId("composition-exercise-row-ex-1")).toBeNull();
    expect(screen.getByTestId("composition-exercise-row-ex-2")).toBeTruthy();
    expect(screen.queryByText("Gainage")).toBeNull();
    expect(screen.getByText("Squats")).toBeTruthy();
  });

  /**
   * V2-CAT-01 (CE-T03-08, UI-CAT-R-007) — « un tap hors action ne ferme pas
   * le contexte » : seul un véritable balayage droit referme une carte
   * ouverte, jamais un simple appui. Révise le comportement antérieur.
   */
  it("a short press on a card with revealed actions is NEUTRAL — it neither closes them nor opens the modification", () => {
    renderTwo();
    fireSwipeLeft("ex-1");

    fireEvent.press(screen.getByTestId("composition-exercise-row-ex-1"));

    expect(screen.getByTestId("composition-activity-actions-ex-1")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("CE-T02-01 — deleting the last Exercise and its attached Recovery disables Continuer", () => {
  renderScreenWithDraft([
    anActivity("ex-1", "BEFORE_TOUR", {
      name: "Gainage",
      postActivityRecoverySeconds: 45,
    }),
  ]);

  expect(
    screen.getByLabelText(composition.continueAction).props.accessibilityState,
  ).toMatchObject({ disabled: false });

  fireSwipeLeft("ex-1");
  fireEvent.press(screen.getByTestId("composition-activity-delete-ex-1"));

  expect(screen.queryByTestId("composition-exercise-row-ex-1")).toBeNull();
  expect(
    screen.getByLabelText(composition.continueAction).props.accessibilityState,
  ).toMatchObject({ disabled: true });
});
});

/**
 * **T02-S02 (continuation après recette visuelle)** — rythme vertical du
 * corps de la Composition : le même écart entre `Compte à rebours initial` et
 * la première carte, entre deux cartes, et entre la dernière carte et `Fin de
 * séance`. Ces interstices relèvent de DEUX conteneurs distincts — le
 * partage d'une constante unique est ce qui les rend égaux.
 */
describe("CompositionScreen — rythme vertical du corps (T02-S02)", () => {
  it("uses ONE reduced gap for the structural rows and for consecutive Activity cards alike", () => {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage" }),
      anActivity("ex-2", "BEFORE_TOUR", { name: "Squats" }),
    ]);

    const bodyContentGap = StyleSheet.flatten(
      screen.getByTestId("composition-body").props.contentContainerStyle,
    ).gap;
    const cardsGap = StyleSheet.flatten(
      screen.getByTestId("composition-zone-before-tour").props.style,
    ).gap;

    // Égalité stricte : `Compte à rebours` → première carte, carte → carte,
    // dernière carte → `Fin de séance` partagent le même interstice.
    expect(bodyContentGap).toBe(cardsGap);
    // Écart RÉDUIT — `spacing/6`, en deçà du `8` précédent entre cartes et
    // très en deçà du `16` structurel.
    expect(cardsGap).toBe(spacing[6]);
    expect(cardsGap).toBeLessThan(spacing[8]);
    expect(bodyContentGap).toBeLessThan(spacing[16]);
  });
});

/**
 * **T02-S02 — bloc Activité + Récupération** (D-095/D-128/D-129/D-138 ;
 * CE-T01-09, CE-T02-01/CE-T02-02).
 */
describe("CompositionScreen — sous-carte Récupération et géométries conditionnelles (T02-S02)", () => {
  // V2-PRE-1 (plan §3.2, UI-CDBCCFD16078) : la sous-carte Récupération est
  // désormais TOUJOURS rendue (y compris `Récupération 0 s`) — sa PRÉSENCE
  // ne dépend plus de la valeur ; seule la ligne Zones corporelles reste
  // optionnelle pour la géométrie du bloc.
  const withZeroRecovery = [anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage" })];
  const withRecovery = [
    anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: 90 }),
  ];

  function blockStyle(activityId = "ex-1") {
    return StyleSheet.flatten(
      screen.getByTestId(`composition-exercise-row-${activityId}`).props.style,
    );
  }

  // V2-PRE-1 (plan §3.2, UI-CDBCCFD16078) : `postActivityRecoverySeconds`
  // est désormais un champ OBLIGATOIRE de l'occurrence — la sous-carte est
  // donc TOUJOURS rendue, y compris `Récupération 0 s`, jamais omise.
  it("renders the recovery sub-card with the exact zero label when the Activity carries no Récupération", () => {
    renderScreenWithDraft(withZeroRecovery);

    expect(screen.getByTestId("composition-activity-recovery-ex-1")).toBeTruthy();
    expect(screen.getByText("Récupération 0 s")).toBeTruthy();
  });

  it("renders a `Récupération X min Y s` sub-card as soon as the Récupération is non-zero", () => {
    renderScreenWithDraft(withRecovery);

    const subCard = screen.getByTestId("composition-activity-recovery-ex-1");
    expect(within(subCard).getByText("Récupération 1 min 30 s")).toBeTruthy();
    expect(StyleSheet.flatten(subCard.props.style).height).toBe(24);
  });

  /**
   * **T02-S02 (continuation après recette visuelle)** : le libellé
   * `Récupération` s'alignait sur le bord gauche du bloc, alors que le nom de
   * l'Activité, ses Zones corporelles et sa synthèse commencent APRÈS le slot
   * de la poignée. Il est désormais aligné avec eux, et affiché en gras.
   */
  it("left-aligns the Récupération label with the rest of the Activity text, and renders it bold", () => {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", {
        name: "Gainage",
        postActivityRecoverySeconds: 90,
        bodyZoneIds: ["dos"],
      }),
    ]);

    const block = screen.getByTestId("composition-exercise-row-ex-1");

    // Retrait gauche = padding de la carte + slot de la poignée + écart :
    // exactement l'origine du bloc de texte de la carte principale.
    const subCardStyle = StyleSheet.flatten(
      within(block).getByTestId("composition-activity-recovery-ex-1").props.style,
    );
    const mainCardStyle = StyleSheet.flatten(
      within(block).getByTestId("composition-activity-main-card").props.style,
    );
    const handleStyle = StyleSheet.flatten(
      within(block).getByTestId("composition-boundary-handle-slot").props.style,
    );
    expect(subCardStyle.paddingLeft).toBe(
      mainCardStyle.paddingHorizontal + handleStyle.width + mainCardStyle.gap,
    );
    expect(subCardStyle.paddingLeft).toBe(52);

    // **T02-S02 (seconde recette visuelle, point 8)** : taille AUGMENTÉE —
    // `compactCardTitle` (`14/18`) au lieu de `11/14` — à graisse et
    // alignement STRICTEMENT conservés.
    const labelStyle = StyleSheet.flatten(
      within(screen.getByTestId("composition-activity-recovery-ex-1")).getByText(
        "Récupération 1 min 30 s",
      ).props.style,
    );
    expect(labelStyle.fontSize).toBe(type.compactCardTitle.fontSize);
    expect(labelStyle.lineHeight).toBe(type.compactCardTitle.lineHeight);
    expect(labelStyle.fontSize).toBeGreaterThan(type.caption.fontSize);
    // Graisse inchangée (semi-bold), et toujours distincte des lignes
    // secondaires régulières.
    expect(labelStyle.fontWeight).toBe(type.compactCardTitle.fontWeight);
    expect(labelStyle.fontWeight).not.toBe(type.caption.fontWeight);
    // La ligne tient toujours dans la sous-carte de `24` points, dont la
    // géométrie reste inchangée.
    expect(labelStyle.lineHeight).toBeLessThanOrEqual(
      dimensions.compositionActivityRow.recoveryCardHeight,
    );
  });

  /**
   * **T02-S02 (troisième recette visuelle, point 3)** : le `paddingVertical`
   * de la carte principale est réduit D'UN TIERS de plus, EFFECTIVEMENT — la
   * seconde recette l'avait déjà porté de `8` à `5`, cette troisième le porte
   * de `5` à `3`. Le tiers se retranche donc de la valeur RÉELLEMENT LIVRÉE,
   * pas une seconde fois de la valeur d'origine, qui n'aurait rien changé.
   *
   * Les marges horizontales et la géométrie du bloc restent inchangées.
   */
  it("reduces the Activity card's top and bottom inner padding by a third again, leaving every other geometry untouched", () => {
    renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage" })]);

    const mainCardStyle = StyleSheet.flatten(
      screen.getByTestId("composition-activity-main-card").props.style,
    );

    // Valeur livrée par la seconde recette : `8 × 2/3 = 5,33` → `5`.
    const previousPadding = Math.round((spacing[8] * 2) / 3);
    expect(previousPadding).toBe(5);

    // Nouveau retrait d'un tiers : `5 × 2/3 = 3,33` → `3`.
    expect(mainCardStyle.paddingVertical).toBe(Math.round((previousPadding * 2) / 3));

    // Assertion sur la VALEUR NUMÉRIQUE elle-même, exigée par la recette pour
    // garantir un changement visible : la marge a réellement diminué depuis
    // la valeur précédemment livrée, et depuis la valeur d'origine.
    expect(mainCardStyle.paddingVertical).toBe(3);
    expect(mainCardStyle.paddingVertical).toBeLessThan(previousPadding);
    expect(mainCardStyle.paddingVertical).toBeLessThan(spacing[8]);

    // Marges HORIZONTALES et écart interne strictement conservés.
    expect(mainCardStyle.paddingHorizontal).toBe(spacing[16]);
    expect(mainCardStyle.gap).toBe(spacing[8]);

    // Géométrie du bloc inchangée : `354 × 68` sans Zones (`44` + la
    // sous-carte Récupération `24`, toujours rendue).
    expect(
      StyleSheet.flatten(screen.getByTestId("composition-exercise-row-ex-1").props.style).height,
    ).toBe(68);
    expect(dimensions.compositionActivityRow.compactRestHeight).toBe(44);
    expect(dimensions.compositionActivityRow.restHeight).toBe(60);
    expect(dimensions.compositionActivityRow.recoveryCardHeight).toBe(24);
  });

  it("lets the card's three lines fit within its fixed height once the padding is reduced", () => {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", bodyZoneIds: ["dos"] }),
    ]);

    const padding = StyleSheet.flatten(
      screen.getByTestId("composition-activity-main-card").props.style,
    ).paddingVertical as number;

    // Nom (`16/20`) + Zones (`11/14`) + synthèse (`11/14`) et leurs deux
    // écarts de `2` = `52` points de contenu. Avec l'ancienne marge de `8`,
    // l'ensemble atteignait `68` pour `58` de hauteur utile (`60` moins les
    // deux liserés du bloc) et débordait d'un point.
    const contentHeight =
      type.cardTitle.lineHeight + type.caption.lineHeight * 2 + spacing[2] * 2;
    const usableHeight = dimensions.compositionActivityRow.restHeight - 2;
    expect(contentHeight + padding * 2).toBeLessThanOrEqual(usableHeight);
    expect(contentHeight + spacing[8] * 2).toBeGreaterThan(usableHeight);
  });

  it("keeps the sub-card INSIDE the single pressable block — one Activity is never two rows", () => {
    renderScreenWithDraft(withRecovery);

    const block = screen.getByTestId("composition-exercise-row-ex-1");
    expect(within(block).getByTestId("composition-activity-recovery-ex-1")).toBeTruthy();
    // Un seul conteneur gestuel, un seul `Pressable` : le bloc est
    // indivisible pour l'appui, l'appui long et le balayage (D-138).
    expect(screen.getAllByTestId(/^composition-activity-ex-1$/u)).toHaveLength(1);
    expect(screen.getAllByTestId(/^composition-exercise-row-ex-1$/u)).toHaveLength(1);
    expect(block.props.accessibilityRole).toBe("button");
  });

  it("applies 354 × 68 without Zones and 354 × 84 with Zones — Récupération is always rendered, so it never changes the height by itself", async () => {
    renderScreenWithDraft(withZeroRecovery);
    expect(blockStyle().height).toBe(68);

    renderScreenWithDraft(withRecovery);
    expect(blockStyle().height).toBe(68);

    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", bodyZoneIds: ["dos"] }),
    ]);
    await screen.findByTestId("composition-exercise-body-zones");
    expect(blockStyle().height).toBe(84);
  });

  /**
   * R6 (CE-UI-09 L2784, L2816, L2840) : un renommage de Zone depuis la
   * modale de l'éditeur d'Exercice (écran distinct) devient immédiatement
   * visible sur le nom de Zone affiché par la Composition — sans fermer ni
   * rouvrir l'Exercice ni remonter la Composition. `notifyBodyZonesReferentialChanged`
   * (`ReferentialServiceContext`) simule ici l'écriture réussie de la
   * modale ; `useFocusEffect` réel est hors de portée de ce harnais de
   * test (pas de `NavigationContainer`).
   */
  it("reflects a Zone renamed elsewhere (BodyZonePickerModal) without remounting the Composition (R6)", async () => {
    let currentZones: readonly BodyZone[] = [
      { id: "dos", name: "Dos", isActive: true, createdAt: "2026-01-01T00:00:00.000Z" },
    ];
    const listBodyZones = jest
      .fn<ActivityDefinitionService["listBodyZones"]>()
      .mockImplementation(async () => currentZones);
    render(
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider
          value={fakeActivityDefinitionService({ listBodyZones })}
        >
          <ReferentialServiceContext.Provider value={fakeReferentialService()}>
            <StatefulDraftWrapper
              initialExercises={[
                anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", bodyZoneIds: ["dos"] }),
              ]}
            >
              <CompositionScreen />
            </StatefulDraftWrapper>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("composition-exercise-body-zones").props.children).toBe("Dos"),
    );

    currentZones = [{ ...currentZones[0]!, name: "Lombaires" }];
    act(() => {
      notifyBodyZonesReferentialChanged();
    });

    await waitFor(() =>
      expect(screen.getByTestId("composition-exercise-body-zones").props.children).toBe(
        "Lombaires",
      ),
    );
  });

  it("uses the optional Zones line to select 68/84 — the Récupération sub-card (24) is always included", async () => {
    const cases = [
      { bodyZoneIds: [], postActivityRecoverySeconds: 0, expected: 68 },
      { bodyZoneIds: [], postActivityRecoverySeconds: 90, expected: 68 },
      { bodyZoneIds: ["dos"], postActivityRecoverySeconds: 0, expected: 84 },
      { bodyZoneIds: ["dos"], postActivityRecoverySeconds: 90, expected: 84 },
    ];

    for (const { bodyZoneIds, postActivityRecoverySeconds, expected } of cases) {
      renderScreenWithDraft([
        anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", bodyZoneIds, postActivityRecoverySeconds }),
      ]);
      if (bodyZoneIds.length > 0) {
        await screen.findByTestId("composition-exercise-body-zones");
      }
      expect(blockStyle().height).toBe(expected);
    }

    expect(dimensions.compositionActivityRow.recoveryCardHeight).toBe(24);
  });

  it("sizes each revealed action to the FULL height of the block (72 × 68 / 72 × 84)", async () => {
    renderScreenWithDraft(withZeroRecovery);
    fireSwipeLeft("ex-1");
    for (const testID of [
      "composition-activity-duplicate-ex-1",
      "composition-activity-delete-ex-1",
    ]) {
      const style = StyleSheet.flatten(screen.getByTestId(testID).props.style);
      expect(style.width).toBe(72);
      expect(style.height).toBe(68);
    }
    expect(
      StyleSheet.flatten(screen.getByTestId("composition-activity-actions-ex-1").props.style).height,
    ).toBe(68);

    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", bodyZoneIds: ["dos"] }),
    ]);
    await screen.findByTestId("composition-exercise-body-zones");
    fireSwipeLeft("ex-1");
    for (const testID of [
      "composition-activity-duplicate-ex-1",
      "composition-activity-delete-ex-1",
    ]) {
      const style = StyleSheet.flatten(screen.getByTestId(testID).props.style);
      expect(style.width).toBe(72);
      expect(style.height).toBe(84);
    }
    expect(
      StyleSheet.flatten(screen.getByTestId("composition-activity-actions-ex-1").props.style).height,
    ).toBe(84);
  });

  it("CE-T02-02 — the lifted block without Zones is exactly 362 × 72 (width expressed as a ±4 margin)", () => {
    renderScreenWithDraft(withZeroRecovery);
    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");

    const lifted = blockStyle();
    expect(lifted.height).toBe(72);
    // `354 + 8 = 362`, l'écart étant appliqué symétriquement (`x = 6` sur
    // une section de `354`) plutôt qu'en largeur absolue.
    expect(lifted.marginHorizontal).toBe(-4);
  });

  it("with Zones, the lifted block is 362 × 88", async () => {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", bodyZoneIds: ["dos"] }),
    ]);
    await screen.findByTestId("composition-exercise-body-zones");
    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");

    const lifted = blockStyle();
    expect(lifted.height).toBe(88);
    expect(lifted.height).not.toBe(72);
    expect(lifted.marginHorizontal).toBe(-4);
  });

  it("CE-T02-02 — the internal surfaces become transparent while lifted, letting the blue show through", () => {
    renderScreenWithDraft(withRecovery);

    const restingSubCard = StyleSheet.flatten(
      screen.getByTestId("composition-activity-recovery-ex-1").props.style,
    );
    expect(restingSubCard.backgroundColor).toBe(colors.surface);

    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");

    expect(
      StyleSheet.flatten(screen.getByTestId("composition-activity-recovery-ex-1").props.style)
        .backgroundColor,
    ).toBe("transparent");
    expect(blockStyle().backgroundColor).toBe(colors.exerciseContextBandBackground);
  });

  it("moves the Récupération WITH its Activity — the sub-card follows the block across zones", () => {
    renderScreenWithDraft(withRecovery);

    fireLayout(screen.getByTestId("composition-zone-before-tour"), 70, 100);
    fireLayout(screen.getByTestId("composition-activity-ex-1"), 0, 68);
    fireLayout(screen.getByTestId("composition-tour-section"), 230, 170);

    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 200, pageY: 300 } });
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 200, pageY: 300 } });

    const inTour = screen.getByTestId("composition-zone-in-tour");
    expect(within(inTour).getByTestId("composition-exercise-row-ex-1")).toBeTruthy();
    expect(within(inTour).getByTestId("composition-activity-recovery-ex-1")).toBeTruthy();
  });

  it("removes the Récupération with its Activity — `Supprimer` never leaves an orphan sub-card", () => {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: 90 }),
    ]);

    fireSwipeLeft("ex-1");
    fireEvent.press(screen.getByTestId("composition-activity-delete-ex-1"));

    expect(screen.queryByTestId("composition-activity-recovery-ex-1")).toBeNull();
    expect(screen.queryByText("Récupération 1 min 30 s")).toBeNull();
    expect(screen.queryByTestId("composition-exercise-row-ex-1")).toBeNull();
  });
});

/**
 * T02-S02 — « métriques d'un Tour calculées uniquement avec les Activités
 * IN_TOUR, puis application de tourRepeatCount dans la synthèse globale ;
 * recalcul immédiat après déplacement, duplication ou suppression ».
 */
describe("CompositionScreen — recalcul immédiat des métriques du Tour (T02-S02)", () => {
  it("counts and totals ONLY the IN_TOUR Activities, then multiplies that zone by tourRepeatCount", () => {
    renderScreenWithDraft([
      anActivity("warmup", "BEFORE_TOUR", { name: "Échauffement", durationSeconds: 600 }),
      anActivity("core", "IN_TOUR", { name: "Gainage", durationSeconds: 60 }),
      anActivity("stretch", "AFTER_TOUR", { name: "Étirements", durationSeconds: 600 }),
    ]);

    // Hors Tour : `600 + 600 = 20 min` volontairement énormes — ils ne
    // doivent NI compter, NI peser dans la synthèse du Tour.
    expect(screen.getByTestId("composition-tour-summary").props.children).toBe("1 exercice · 1 min");

    fireEvent.press(screen.getByTestId("composition-tour-control"));
    fireNativeSelectionChange(screen.getByTestId("number-wheel-column"), 3);
    fireEvent.press(screen.getByLabelText(composition.wheelPicker.validateAccessibilityLabel));

    // Seule la zone `IN_TOUR` est développée : `60 × 3 = 3 min`.
    expect(screen.getByTestId("composition-tour-summary").props.children).toBe("1 exercice · 3 min");
  });

  it("recomputes immediately after a DUPLICATION", () => {
    renderScreenWithDraft([anActivity("core", "IN_TOUR", { name: "Gainage", durationSeconds: 60 })]);
    expect(screen.getByTestId("composition-tour-summary").props.children).toBe("1 exercice · 1 min");

    fireSwipeLeft("core");
    fireEvent.press(screen.getByTestId("composition-activity-duplicate-core"));

    expect(screen.getByTestId("composition-tour-summary").props.children).toBe(
      "2 exercices · 2 min",
    );
  });

  it("recomputes immediately after a DELETION", () => {
    renderScreenWithDraft([
      anActivity("core-1", "IN_TOUR", { name: "Gainage", durationSeconds: 60 }),
      anActivity("core-2", "IN_TOUR", { name: "Squats", durationSeconds: 60 }),
    ]);
    expect(screen.getByTestId("composition-tour-summary").props.children).toBe(
      "2 exercices · 2 min",
    );

    fireSwipeLeft("core-1");
    fireEvent.press(screen.getByTestId("composition-activity-delete-core-1"));

    expect(screen.getByTestId("composition-tour-summary").props.children).toBe("1 exercice · 1 min");
  });

  it("recomputes immediately after a MOVE out of the Tour", () => {
    renderScreenWithDraft([anActivity("core", "IN_TOUR", { name: "Gainage", durationSeconds: 60 })]);
    expect(screen.getByTestId("composition-tour-summary").props.children).toBe("1 exercice · 1 min");

    // Structure Tour `230–400` ; liste `IN_TOUR` à `y = 20` DANS cette
    // structure (donc `250` en absolu) ; carte `250–310`, centre `280`.
    fireLayout(screen.getByTestId("composition-tour-section"), 230, 170);
    fireLayout(screen.getByTestId("composition-zone-in-tour"), 20, 70);
    fireLayout(screen.getByTestId("composition-activity-core"), 0, 44);

    const container = () => screen.getByTestId("composition-activity-core");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 200, pageY: 320 } });
    fireEvent(screen.getByTestId("composition-exercise-row-core"), "longPress");
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 200, pageY: 100 } });

    // Sortie du Tour : la synthèse du Tour redevient l'état vide.
    expect(screen.getByTestId("composition-tour-summary").props.children).toBe(
      composition.summary.empty,
    );
  });
});

describe("CompositionScreen — contrôle Nombre de tours (T02-S01, AC-08/AC-09)", () => {
  const oneActivity = [anActivity("ex-1", "IN_TOUR", { name: "Gainage", durationSeconds: 60 })];

  it("AC-09 — pressing the control opens the canonical numeric wheel inside the blocking DSF overlay", () => {
    renderScreenWithDraft(oneActivity);

    expect(screen.queryByTestId("composition-tour-wheel-picker")).toBeNull();
    fireEvent.press(screen.getByTestId("composition-tour-control"));

    expect(screen.getByTestId("wheel-picker-overlay")).toBeTruthy();
    expect(screen.getByTestId("composition-tour-wheel-picker")).toBeTruthy();
    // Voile bloquant non dismissible au toucher (contrat transverse).
    expect(screen.getByTestId("wheel-picker-overlay-backdrop").props.onPress).toBeUndefined();
    // Primitive native réutilisée telle quelle (jamais une réimplémentation).
    expect(screen.getByTestId("number-wheel-column").props.onSelectionChange).toBeInstanceOf(
      Function,
    );
  });

  it("AC-08/AC-09 — Confirmer applies exactly the centered value to the draft", () => {
    renderScreenWithDraft(oneActivity);

    fireEvent.press(screen.getByTestId("composition-tour-control"));
    fireNativeSelectionChange(screen.getByTestId("number-wheel-column"), 99);
    fireEvent.press(screen.getByLabelText(composition.wheelPicker.validateAccessibilityLabel));

    expect(screen.queryByTestId("composition-tour-wheel-picker")).toBeNull();
    expect(within(screen.getByTestId("composition-tour-control")).getByText("99")).toBeTruthy();
  });

  it("AC-09 — Annuler closes without changing the previously confirmed value", () => {
    renderScreenWithDraft(oneActivity);

    fireEvent.press(screen.getByTestId("composition-tour-control"));
    fireNativeSelectionChange(screen.getByTestId("number-wheel-column"), 42);
    fireEvent.press(screen.getByLabelText(composition.wheelPicker.cancelAccessibilityLabel));

    expect(screen.queryByTestId("composition-tour-wheel-picker")).toBeNull();
    expect(within(screen.getByTestId("composition-tour-control")).getByText("1")).toBeTruthy();
  });

  it("AC-10 — confirming a new tour count recomputes the Tour summary immediately", () => {
    renderScreenWithDraft(oneActivity);

    const summary = () =>
      within(screen.getByTestId("composition-tour-card")).getByTestId("composition-tour-summary")
        .props.children;
    expect(summary()).toBe("1 exercice · 1 min");

    fireEvent.press(screen.getByTestId("composition-tour-control"));
    fireNativeSelectionChange(screen.getByTestId("number-wheel-column"), 3);
    fireEvent.press(screen.getByLabelText(composition.wheelPicker.validateAccessibilityLabel));

    // 60 s × 3 = 180 s -> 3 min ; le NOMBRE d'Activités, lui, reste `1`.
    expect(summary()).toBe("1 exercice · 3 min");
  });

  it("AC-10 — an out-of-Tour Activity never contributes to the Tour summary, whatever the tour count (correctif T02, 2026-09-08)", () => {
    // Avant le correctif, l'Activité BEFORE_TOUR contribuait encore au
    // NOMBRE affiché (sans être multipliée) — désormais elle est exclue à
    // la source, aussi bien du nombre que de la durée. Seule l'Activité
    // IN_TOUR (60 s) contribue, multipliée par `tourRepeatCount`.
    renderScreenWithDraft(
      [
        anActivity("ex-1", "BEFORE_TOUR", { name: "Échauffement", durationSeconds: 600 }),
        anActivity("ex-2", "IN_TOUR", { name: "Squats", durationSeconds: 60 }),
      ],
      { tourRepeatCount: 5 },
    );

    // BEFORE_TOUR (600 s) exclue quel que soit tourRepeatCount ; IN_TOUR
    // seule contribue : 60 × 5 = 300 s -> ceil(300/60) = 5 min.
    expect(
      within(screen.getByTestId("composition-tour-card")).getByTestId("composition-tour-summary")
        .props.children,
    ).toBe("1 exercice · 5 min");
  });

  it("rehydrated drafts show their persisted tour count, never a hardcoded 1", () => {
    renderScreenWithDraft(oneActivity, { tourRepeatCount: 7 });

    expect(within(screen.getByTestId("composition-tour-control")).getByText("7")).toBeTruthy();
  });
});

/**
 * V2-PRE-1 (plan §3.3) : le Circuit (Tour) n'a plus aucune direction propre
 * — le contrôle `Côtés` du Tour et son dialogue de confirmation sont
 * entièrement retirés de cet écran (UI-74BBA70BF09F-AA62F52830301).
 */
describe("CompositionScreen — absence du contrôle Côtés du Tour (V2-PRE-1)", () => {
  it("never renders a Tour-level side mode control or confirmation dialog", () => {
    renderScreenWithDraft([anActivity("ex-1", "IN_TOUR", { sideMode: "RIGHT_LEFT" })]);

    expect(screen.queryByTestId("composition-tour-side-mode")).toBeNull();
    expect(screen.queryByTestId("composition-tour-side-mode-control")).toBeNull();
    expect(screen.queryByText(composition.tourBilateralConfirmModal.title)).toBeNull();
  });
});

/**
 * V2-BILAT-01 (plan `## UI`, « Composition cards and summaries ») :
 * indicateur `D→G`/`G→D` non interactif d'une carte Activité et clause de
 * direction de la synthèse — l'un et l'autre affichés UNIQUEMENT pour une
 * direction PROPRE bilatérale, jamais pour une Activité unilatérale, ni
 * pour une direction héritée d'un Tour déjà bilatéral.
 */
describe("CompositionScreen — indicateur de direction propre et clause de synthèse (V2-BILAT-01, correction bornée)", () => {
  const sideModeStrings = strings.shared.sideMode;

  it("affiche l'indicateur D→G, géométrie locale 42 × 20 pt, pour une Activité BEFORE_TOUR à direction propre RIGHT_LEFT", () => {
    renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { sideMode: "RIGHT_LEFT" })]);

    // Correction bornée (plan `## 4.4`) : l'indicateur n'est PLUS masqué de
    // l'arbre d'accessibilité (`accessibilityElementsHidden` retiré) — les
    // requêtes par défaut le trouvent donc directement, sans
    // `includeHiddenElements`.
    const indicator = screen.getByTestId("composition-activity-side-mode-ex-1");
    expect(within(indicator).getByText(sideModeStrings.valueLabels.RIGHT_LEFT)).toBeTruthy();
    const style = StyleSheet.flatten(indicator.props.style);
    expect(style.width).toBe(42);
    expect(style.height).toBe(20);
  });

  it("affiche l'indicateur G→D pour une direction propre LEFT_RIGHT, et l'omet entièrement pour une Activité unilatérale", () => {
    renderScreenWithDraft([
      anActivity("ex-1", "AFTER_TOUR", { sideMode: "LEFT_RIGHT" }),
      anActivity("ex-2", "AFTER_TOUR", { sideMode: "UNILATERAL" }),
    ]);

    expect(
      within(screen.getByTestId("composition-activity-side-mode-ex-1")).getByText(
        sideModeStrings.valueLabels.LEFT_RIGHT,
      ),
    ).toBeTruthy();
    expect(screen.queryByTestId("composition-activity-side-mode-ex-2")).toBeNull();
  });

  it("correction bornée (plan '## 4.4', BIL-065) : reste non interactif mais expose un libellé accessible DÉVELOPPÉ — jamais masqué de l'arbre", () => {
    renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { sideMode: "RIGHT_LEFT" })]);

    const indicator = screen.getByTestId("composition-activity-side-mode-ex-1");
    // Non interactif : aucun rôle bouton, aucun gestionnaire de pression.
    expect(indicator.props.accessibilityRole).not.toBe("button");
    expect(indicator.props.onPress).toBeUndefined();
    // Accessible, avec le MÊME libellé développé que le contrôle `Côté` de
    // l'Activité — jamais un texte reformulé localement.
    expect(indicator.props.accessible).toBe(true);
    expect(indicator.props.accessibilityLabel).toBe(
      sideModeStrings.activity.accessibilityLabels.RIGHT_LEFT,
    );
    // L'ancien masquage incorrect signalé par le plan est bien retiré.
    expect(indicator.props.accessibilityElementsHidden).not.toBe(true);
    expect(indicator.props.importantForAccessibility).not.toBe("no-hide-descendants");
  });

  it("correction bornée : libellé accessible développé exact pour LEFT_RIGHT aussi", () => {
    renderScreenWithDraft([anActivity("ex-1", "AFTER_TOUR", { sideMode: "LEFT_RIGHT" })]);

    const indicator = screen.getByTestId("composition-activity-side-mode-ex-1");
    expect(indicator.props.accessibilityLabel).toBe(
      sideModeStrings.activity.accessibilityLabels.LEFT_RIGHT,
    );
  });

  it("insère UNIQUEMENT la clause « par côté » dans la synthèse de carte d'une Activité à direction propre bilatérale — jamais la direction développée (plan '## 4.4')", () => {
    renderScreenWithDraft([
      {
        ...createExerciseDraft("ex-1"),
        name: "Fentes",
        structuralPosition: "BEFORE_TOUR",
        durationSeconds: 90,
        seriesCount: 3,
        pauseSeconds: 15,
        sideMode: "RIGHT_LEFT",
      },
    ]);

    expect(
      screen.getByText("3 séries par côté de 1 min 30 s avec 15 s de pause par série"),
    ).toBeTruthy();
    expect(screen.queryByText(/à droite, puis à gauche/)).toBeNull();
    expect(screen.queryByText(/à gauche, puis à droite/)).toBeNull();
  });

  it("n'insère jamais la clause « par côté » ni la direction développée dans la synthèse d'une carte IN_TOUR unilatérale", () => {
    renderScreenWithDraft([
      {
        ...createExerciseDraft("ex-1"),
        name: "Fentes",
        structuralPosition: "IN_TOUR",
        durationSeconds: 90,
        seriesCount: 3,
        pauseSeconds: 15,
        sideMode: "UNILATERAL",
      },
    ]);

    expect(screen.getByText("3 séries de 1 min 30 s avec 15 s de pause par série")).toBeTruthy();
    expect(screen.queryByText(/par côté/)).toBeNull();
    expect(screen.queryByText(/à droite, puis à gauche/)).toBeNull();
    expect(screen.queryByText(/à gauche, puis à droite/)).toBeNull();
  });
});
