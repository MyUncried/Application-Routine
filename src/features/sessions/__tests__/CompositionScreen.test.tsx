import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, Keyboard, Platform, ScrollView, StyleSheet, Text } from "react-native";

import {
  allFailureParameters,
  durationParameters,
  repetitionParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import type { Label } from "@/domain/labels/Label";
import { createExerciseDraft, sessionDraftsEqual, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import * as circuitModule from "@/domain/sessions/circuit";
import { NAME_MAX_LENGTH } from "@/domain/sessions/validation";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import {
  notifyBodyZonesReferentialChanged,
  ReferentialServiceContext,
} from "@/features/reference-data/ReferentialServiceContext";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";
import type { SessionDraftContextValue, SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import { SessionDraftProvider } from "@/features/sessions/SessionDraftProvider";
import type { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

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
/** PRE-6 (story 2.2) : référentiel des Catégories (ligne de classement des cartes d'occurrence). */
const CATEGORY_FIXTURES: readonly Category[] = [
  {
    id: "renforcement",
    name: "Renforcement",
    canonicalKey: "renforcement",
    color: "#3B82F6",
    isPredefined: true,
    displayOrder: 0,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

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
// PRE-4 Q54 : l’action finale (« Continuer » depuis PRE-6 story 2.1) ferme le parcours depuis la Composition.
const mockDismissTo = jest.fn();
/**
 * PRE-6 (story 2.2) : `useFocusEffect` réel exige un `NavigationContainer`, absent de ce
 * harnais — doublé ici : exécuté au montage, rappelable par un test (retour au premier plan).
 */
const mockFocusHarness: { callbacks: (() => void)[] } = { callbacks: [] };

jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactActual = require("react") as typeof import("react");
  return {
    ...actual,
    useRouter: () => ({ push: mockPush, back: mockBack, dismissTo: mockDismissTo }),
    useFocusEffect: (callback: () => void) => {
      mockFocusHarness.callbacks.push(callback);
      ReactActual.useEffect(() => callback(), []);
    },
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
    listCategories: jest
      .fn<ActivityDefinitionService["listCategories"]>()
      .mockResolvedValue(CATEGORY_FIXTURES),
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
  // PRE-6 (story 3.1) : mêmes deux formes que `SessionDraftProvider` (correctif ou fonction).
  const updateDraft = useCallback((update: SessionDraftUpdate) => {
    setDraft((current) => ({ ...current, ...(typeof update === "function" ? update(current) : update) }));
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
  mockDismissTo.mockReset();
});

describe("CompositionScreen — état initial", () => {
  it("renders the name field, the countdown/final phase rows, the Circuit counter, and the disabled final action", () => {
    renderScreen();

    expect(screen.getByLabelText(composition.name)).toBeTruthy();
    expect(screen.getByLabelText(composition.countdown.label)).toBeTruthy();
    expect(screen.getByLabelText(composition.finalPhase.label)).toBeTruthy();

    // PRE-6 (story 3.1, CIR-10) : le compteur du Circuit est un réglage ajustable qui annonce
    // N avec son unité ; au repos, « 1 » puis la pastille « tour ».
    const counter = screen.getByLabelText(composition.circuit.countAccessibilityLabel.TOURS);
    expect(counter.props.accessibilityRole).toBe("adjustable");
    expect(counter.props.accessibilityValue).toMatchObject({ now: 1, text: "1 tour" });
    expect(screen.getByTestId("composition-circuit-header-counter-value").props.children).toBe(1);
    expect(screen.getByTestId("composition-circuit-header-counter-unit-text", { includeHiddenElements: true }).props.children).toBe("tour");
    expect(screen.queryByText("×1")).toBeNull();

    const continueAction = screen.getByLabelText(composition.saveAction);
    expect(continueAction.props.accessibilityState).toMatchObject({ disabled: true });
  });

  // PRE-6 story 2.1 : le X de l’en-tête est annoncé « Fermer » ; même action `router.back()`.
  it("exposes a visible, accessible Fermer (X) action calling router.back() (CE-T01-04, AUD-03 correction ; PRE-6 story 2.1)", () => {
    renderScreen();

    const back = screen.getByLabelText(composition.closeAccessibilityLabel);
    expect(back).toBeTruthy();

    fireEvent.press(back);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  // PRE-6 story 2.1 (Figma `8328:28634`) : les bornes deviennent des étapes de la Séquence —
  // un anneau sur le rail remplace les anciennes icônes de rôle des cartes limites.
  it("PRE6-2.1 — Séquence : rail, anneau pour Compte à rebours, Circuit et Fin ; aucune icône de rôle de carte limite", () => {
    renderScreen();

    // Rail et repères sont décoratifs, masqués à l'accessibilité.
    const hidden = { includeHiddenElements: true };
    expect(screen.getByTestId("composition-sequence-rail", hidden)).toBeTruthy();
    for (const boundary of ["composition-boundary-countdown", "composition-boundary-final-phase"]) {
      expect(within(screen.getByTestId(boundary)).getByTestId("composition-sequence-marker-ring", hidden)).toBeTruthy();
    }
    expect(
      StyleSheet.flatten(screen.getByTestId("composition-sequence-marker-circuit", hidden).props.style),
    ).toMatchObject({ borderWidth: 2, borderColor: colors.disabled, backgroundColor: colors.background });
    expect(screen.queryByTestId("composition-row-icon-composition-initial-countdown")).toBeNull();
    expect(screen.queryByTestId("composition-row-icon-composition-end-session")).toBeNull();
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

  // PRE-6 story 2.1 : la pastille de valeur (déclencheur de la roulette) garde le même style
  // et la borne le même nombre d'enfants, fermée comme ouverte (acquis REWORK06 transposé).
  it("PRE6-2.1 — la borne et sa pastille de valeur gardent la même structure et le même style, fermées ou ouvertes", () => {
    renderScreen();

    const rowBefore = screen.getByTestId("composition-boundary-countdown");
    const childCountBefore = (rowBefore.children as unknown[]).length;
    const pillStyleBefore = StyleSheet.flatten(screen.getByTestId("composition-boundary-countdown-value").props.style);

    fireEvent.press(screen.getByLabelText(composition.countdown.label));

    const rowAfter = screen.getByTestId("composition-boundary-countdown");
    expect((rowAfter.children as unknown[]).length).toBe(childCountBefore);
    expect(StyleSheet.flatten(screen.getByTestId("composition-boundary-countdown-value").props.style)).toEqual(pillStyleBefore);
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
    // PRE-6 story 2.1 : aucun état `disabled` constant sur le « + » ; il reste utilisable.
    expect(addActivity.props.accessibilityState?.disabled).not.toBe(true);

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
    // Recette 3 (D-353) : plus de séparateur de 1 entre l’en-tête et la bande (auparavant « + 1 »).
    const expectedTop = 47 + dimensions.header.contentHeight + dimensions.contextBand.height + spacing[8];
    expect(flattenedTop).toBe(expectedTop);

    const scrim = screen.getByTestId("composition-add-activity-tree-backdrop");
    expect(StyleSheet.flatten(scrim.props.style).backgroundColor).toBe(colors.overlayScrim);
  });

  it("shows the exact local empty summary '— min' (PRE-6 story 1.3, D-390, D-399 : durée seule, aucun nombre d'exercices)", () => {
    renderScreen();

    // REWORK09 : la ligne de synthèse basse est supprimée (redondante
    // depuis REWORK08-C) — une seule occurrence subsiste désormais, sous
    // le titre « Circuit » (composition-circuit-header-duration).
    expect(screen.getAllByText("— min")).toHaveLength(1);
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
    // REWORK09 : une seule occurrence désormais (durée du Circuit uniquement,
    // la ligne basse redondante a été supprimée).
    expect(screen.getAllByText("— min")).toHaveLength(1);
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
    // Recette 3 (D-355) : le toucher MARQUE l’Étiquette ; ✓ l’applique au brouillon puis ferme
    // (auparavant : le toucher appliquait et fermait aussitôt).
    fireEvent.press(tag);
    expect(screen.getByTestId("label-picker-backdrop")).toBeTruthy();
    fireEvent.press(screen.getByTestId("label-picker-confirm"));

    // Fermeture progressive (220 ms) : dans cette suite lourde, la fermeture se termine mais en plusieurs
    // secondes réelles (mesure de la recette 3 sur ExerciseScreen) — attente portée à 20 s.
    await waitFor(() => expect(screen.queryByTestId("label-picker-backdrop")).toBeNull(), { timeout: 20000 });
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
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]);

    expect(screen.getByLabelText(composition.addActivity)).toBeTruthy();
    // PRE-6 story 2.1 : le « + » ne porte plus d'état `disabled` constant ; il reste utilisable.
    expect(screen.getByLabelText(composition.addActivity).props.accessibilityState?.disabled).not.toBe(true);
    // PRE-6 (story 2.2, CE-T03-08 §18) : type, nom, position dans la zone et durée d'occurrence.
    expect(screen.getByLabelText("Exercice, Gainage, 1 sur 1, 1 min")).toBeTruthy();
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
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    expect(within(row).getByTestId("composition-boundary-handle-icon")).toBeTruthy();
    expect(screen.queryByTestId("composition-exercise-icon")).toBeNull();
    expect(within(row).queryByTestId("composition-row-icon-composition-main-content")).toBeNull();
    // PRE-6 (story 2.2) : aucune icône de changement de côté pour un unilatéral.
    expect(within(row).queryByTestId("composition-exercise-side-change-icon")).toBeNull();
  });

  it("REWORK12 (COMP-01) — the Exercise row's structure icon displays the canonical 20×20 glyph at opacity 0.5, same as the Compte à rebours/Fin de séance cards (same shared component, by construction)", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    const reorderIcon = within(row).getByTestId("composition-boundary-handle-icon");
    const flattened = StyleSheet.flatten(reorderIcon.props.style);
    expect(flattened.width).toBe(20);
    expect(flattened.height).toBe(20);
    expect(flattened.opacity).toBe(0.5);
  });

  // PRE-6 (story 2.2, `5544:6797`) : fond blanc, bordure 1 #E4E4EB, rayon 14.
  it("PRE6-2.2 — the occurrence card surface is white, 1 pt #E4E4EB border, radius 14", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]);

    const exerciseCardStyle = StyleSheet.flatten(screen.getByTestId("composition-exercise-row-ex-1").props.style);
    expect(exerciseCardStyle.borderColor).toBe("#E4E4EB");
    expect(exerciseCardStyle.borderWidth).toBe(1);
    expect(exerciseCardStyle.borderRadius).toBe(14);
    expect(exerciseCardStyle.backgroundColor).toBe(colors.background);
    const contentStyle = StyleSheet.flatten(screen.getByTestId("composition-activity-main-card").props.style);
    expect(contentStyle.paddingHorizontal).toBe(14);
    expect(contentStyle.paddingTop).toBe(12);
    expect(contentStyle.paddingBottom).toBe(12);
    // Poignée (28) puis colonne de texte, à 8 (CE-T03-08).
    expect(contentStyle).toMatchObject({ flexDirection: "row", gap: 8 });
  });

  // Intention d'édition conservée dans l'indice (`exerciseRow.editAccessibilityLabel`), avant les gestes.
  it("PRE6-2.2 — the card hint announces the edit intent, then the reorder / actions gestures", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]);

    expect(screen.getByTestId("composition-exercise-row-ex-1").props.accessibilityHint).toBe(
      `${composition.exerciseRow.editAccessibilityLabel}. ${composition.activityActions.reorderAccessibilityHint}`,
    );
  });

  it("shows the detailed configuration summary (name + summary, never the Consigne or the Zones corporelles) — CHANGES_REQUESTED", () => {
    renderScreenWithDraft([
      {
        ...createExerciseDraft("ex-1"),
        name: "Gainage",
        executionParameters: durationParameters(90, 3, 15),
        instruction: "Ne pas creuser le dos",
      },
    ]);

    expect(screen.getByText("Gainage")).toBeTruthy();
    // PRE-6 (story 2.2, D-238) : « N × cible », aucun texte de pause.
    expect(screen.getByTestId("composition-exercise-summary").props.children).toBe("3 × 1 min 30 s");
    expect(screen.queryByText(/pause/)).toBeNull();
    expect(screen.queryByText("Ne pas creuser le dos")).toBeNull();
  });

  it("pressing the Exercise row navigates to /exercise with its own exerciseId (reopen for editing, complétion REWORK12 — édition ciblée par identifiant)", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]);

    fireEvent.press(screen.getByLabelText(/^Exercice, Gainage, /));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/exercise",
      params: { exerciseId: "ex-1" },
    });
  });

  it("never shows the Exercise row while draft.exercises is empty", () => {
    renderScreenWithDraft([]);
    expect(screen.queryByLabelText(/^Exercice, /)).toBeNull();
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
      { ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) },
      { ...createExerciseDraft("ex-2"), name: "Squats", executionParameters: durationParameters(30) },
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

    // PRE-6 story 2.1 : le « + » ne porte plus d'état `disabled` constant ; il reste utilisable.
    expect(screen.getByLabelText(composition.addActivity).props.accessibilityState?.disabled).not.toBe(true);
  });
});

describe("CompositionScreen — ordre structurel (UI-COMP-001/002/003, cycle de correction après contre-recette iPhone 2026-09-03)", () => {
  it("initial order (no Activity yet): + Ajouter une activité ABOVE Compte à rebours initial, then the Circuit, then Fin de séance (UI-COMP-002)", () => {
    renderScreenWithDraft([]);

    const order = testIdOrder(screen.toJSON(), [
      "composition-add-activity-icon",
      "composition-boundary-countdown",
      "composition-boundary-final-phase",
    ]);

    expect(order).toEqual([
      "composition-add-activity-icon",
      "composition-boundary-countdown",
      "composition-boundary-final-phase",
    ]);
    // Tour n'a pas de testID propre : sa position entre les deux est prouvée
    // par labels de texte, dans le même ordre visuel.
    const labelOrder = textOrder(screen.toJSON(), [
      composition.countdown.label,
      composition.circuit.title,
      composition.finalPhase.label,
    ]);
    expect(labelOrder).toEqual([composition.countdown.label, composition.circuit.title, composition.finalPhase.label]);
  });

  it("order once an Activity exists: Compte à rebours initial, then the created Activity, then the Circuit, then Fin de séance (UI-COMP-003) — never after the Circuit", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]);

    const order = testIdOrder(screen.toJSON(), [
      "composition-boundary-countdown",
      "composition-exercise-row-ex-1",
      "composition-boundary-final-phase",
    ]);
    expect(order).toEqual([
      "composition-boundary-countdown",
      "composition-exercise-row-ex-1",
      "composition-boundary-final-phase",
    ]);

    const labelOrder = textOrder(screen.toJSON(), [
      composition.countdown.label,
      composition.circuit.title,
      composition.finalPhase.label,
    ]);
    expect(labelOrder).toEqual([composition.countdown.label, composition.circuit.title, composition.finalPhase.label]);
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
  it("CMP-01 — Header (Shell Foundation partagé) shows the static title with a Retour circle, never replaced by the typed name; no header separator since D-353 (recette 3), Context band distinct from the general background", () => {
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

    // Recette 3 (D-353) : plus de séparateur gris entre l’en-tête et la bande Context
    // (auparavant : séparateur présent, de couleur distincte du fond).
    expect(screen.queryByTestId("screen-header-separator")).toBeNull();

    const contextBand = screen.getByTestId("screen-context-band");
    expect(StyleSheet.flatten(contextBand.props.style).backgroundColor).not.toBe(colors.background);
    // La bande Context contient bien le nom ET Ajouter.
    expect(within(contextBand).getByLabelText(composition.name)).toBeTruthy();
    expect(within(contextBand).getByLabelText(composition.addActivity)).toBeTruthy();
  });

  it("REWORK09, révisé recette 3 (T-49, D-352) — le champ Nom est transparent, SANS contour blanc (supprimé à la demande de Hermann), la couleur de la bande Context reste visible", () => {
    renderScreen();

    const field = screen.getByTestId("composition-name-color-field");
    const flattened = StyleSheet.flatten(field.props.style);
    expect(flattened.backgroundColor).toBe("transparent");
    // Avant D-352 : borderWidth 1, borderColor sessionNameBorder (#FFFFFF).
    expect(flattened.borderWidth).toBeUndefined();
    expect(flattened.borderColor).toBeUndefined();
    expect(within(field).getByLabelText(composition.name)).toBeTruthy();
  });

  // PRE-6 story 2.1 (Figma `8328:28630`) : le bouton texte « + Ajouter un exercice » est
  // remplacé par un bouton rond « + » de 34 (fond blanc, bordure et croix primaires, cible 44),
  // nom accessible « Ajouter un exercice », qui ouvre l'arbre d'ajout existant.
  it("PRE6-2.1 — bouton rond « + » 34 (fond blanc, bordure primaire, cible 44), sans libellé visible, ouvrant l'arbre d'ajout", () => {
    renderScreen();

    const addActivity = screen.getByLabelText(composition.addActivity);
    const flattened = StyleSheet.flatten(addActivity.props.style);
    expect(flattened.width).toBe(34);
    expect(flattened.height).toBe(34);
    expect(flattened.borderRadius).toBe(17);
    expect(flattened.borderColor).toBe(colors.primary);
    expect(flattened.backgroundColor).toBe(colors.background);
    expect(flattened.height + 2 * (addActivity.props.hitSlop as number)).toBe(44);
    expect(within(addActivity).queryByText(composition.addActivity)).toBeNull();
    const bars = within(addActivity).getAllByTestId("composition-add-activity-icon-bar");
    expect(bars).toHaveLength(2);
    for (const bar of bars) {
      expect(StyleSheet.flatten(bar.props.style).backgroundColor).toBe(colors.primary);
    }

    fireEvent.press(addActivity);
    expect(screen.getByTestId("composition-add-activity-tree")).toBeTruthy();
  });

  // PRE-6 story 2.1 (Figma `8328:28611`) : puce Étiquette puis durée de séance sur une ligne de 32.
  it("PRE6-2.1 — puce Étiquette (26, rayon 13, fond blanc 35 %, icône 18, « Étiquette » 13 primaire, cible 44) et durée de séance « 0 min » (Inter 14 tertiaire)", () => {
    renderScreen();

    const chip = screen.getByLabelText(composition.label.accessibilityLabel);
    const chipStyle = StyleSheet.flatten(chip.props.style);
    expect(chipStyle).toMatchObject({ height: 26, borderRadius: 13, backgroundColor: "rgba(255, 255, 255, 0.35)" });
    expect(chipStyle.height + chip.props.hitSlop.top + chip.props.hitSlop.bottom).toBe(44);
    expect(StyleSheet.flatten(within(chip).getByTestId("composition-session-label-outline-icon").props.style)).toMatchObject({
      width: 18,
      height: 18,
    });
    const chipLabel = within(chip).getByText(composition.label.placeholder);
    expect(StyleSheet.flatten(chipLabel.props.style)).toMatchObject({ fontSize: 13, color: colors.primary });

    const duration = screen.getByTestId("composition-session-duration");
    expect(duration.props.children).toBe("0 min");
    expect(StyleSheet.flatten(duration.props.style)).toMatchObject({ fontSize: 14, fontWeight: "400", color: TEXT_TERTIARY });
    expect(StyleSheet.flatten(screen.getByTestId("composition-info-row").props.style).height).toBe(32);
  });

  it("PRE6-3.1 — Circuit header (Figma `8328:28667`): the outer structure keeps the only surface; « Circuit » Semi Bold 16 primary, then the Circuit duration Regular 12 tertiary; the counter on the right", () => {
    renderScreen();

    // REWORK07B : la SEULE surface visuelle est la structure extérieure (fond bleu, rayon 10).
    const tourSection = screen.getByTestId("composition-tour-section");
    const tourSectionStyle = StyleSheet.flatten(tourSection.props.style);
    expect(tourSectionStyle.backgroundColor).toBe(colors.tourSurface);
    expect(tourSectionStyle.borderRadius).toBe(10);

    const header = within(tourSection).getByTestId("composition-circuit-header");
    const headerStyle = StyleSheet.flatten(header.props.style);
    expect(headerStyle.backgroundColor).toBeUndefined();
    expect(headerStyle.flexDirection).toBe("row");

    const title = within(header).getByTestId("composition-circuit-header-title");
    expect(title.props.children).toBe("Circuit");
    expect(StyleSheet.flatten(title.props.style)).toMatchObject({ fontSize: 16, fontWeight: "600", color: colors.textPrimary });

    const duration = within(header).getByTestId("composition-circuit-header-duration");
    expect(duration.props.children).toBe("— min");
    expect(StyleSheet.flatten(duration.props.style)).toMatchObject({ fontSize: 12, fontWeight: "400", color: TEXT_TERTIARY });
    // La durée se tronque (une ligne) ; le bloc texte cède la place, jamais le compteur.
    expect(duration.props.numberOfLines).toBe(1);
    expect(StyleSheet.flatten(within(header).getByTestId("composition-circuit-header-text-block").props.style)).toMatchObject({
      flex: 1,
      minWidth: 0,
    });
    const counter = within(header).getByTestId("composition-circuit-header-counter-rest");
    expect(StyleSheet.flatten(counter.props.style).flexShrink).toBe(0);

    // Plus de roulette du compte ni de « Nombre de tours » affiché, ni d'icône Tour.
    expect(screen.queryByText("Nombre de tours")).toBeNull();
    expect(screen.queryByTestId("composition-tour-control")).toBeNull();
    expect(screen.queryByTestId("composition-tour-icon")).toBeNull();
  });

  it("PRE6-3.1 — at rest: the digit (Semi Bold 13 primary text, 44 touch target) then the unit pill (surface, radius 10, padding 10/4, Semi Bold 13 primary)", () => {
    renderScreen();

    const digit = screen.getByTestId("composition-circuit-header-counter-value");
    expect(StyleSheet.flatten(digit.props.style)).toMatchObject({ fontSize: 13, fontWeight: "600", color: colors.textPrimary });
    const digitTouch = screen.getByTestId("composition-circuit-header-counter-value-press");
    const digitTouchStyle = StyleSheet.flatten(digitTouch.props.style);
    expect(digitTouchStyle.minHeight).toBe(44);
    expect((digitTouchStyle.minWidth as number) + (digitTouch.props.hitSlop?.left ?? 0)).toBeGreaterThanOrEqual(44);

    const pill = screen.getByTestId("composition-circuit-header-counter-unit", { includeHiddenElements: true });
    expect(StyleSheet.flatten(pill.props.style)).toMatchObject({
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
    });
    const pillText = screen.getByTestId("composition-circuit-header-counter-unit-text", { includeHiddenElements: true });
    expect(StyleSheet.flatten(pillText.props.style)).toMatchObject({ fontSize: 13, fontWeight: "600", color: colors.primary });
    // Story 3.2 : la pastille n'est que le dessin du déclencheur du choix de nature (menu natif
    // sur iOS), qui porte seul le rôle et l'action.
    expect(pill.props.onPress).toBeUndefined();
    expect(pill.props.accessibilityRole).toBeUndefined();
  });

  /**
   * REWORK13 (R13-02) : la synthèse compte/totalise EXCLUSIVEMENT les
   * Activités — `initialCountdownSeconds`/`finalPhaseSeconds` du brouillon
   * (`10 s`/`5 s` par défaut dans `renderScreenWithDraft`) ne contribuent
   * plus du tout, contrairement à l'ancien commentaire de ce test.
   */
  it("REWORK08-C/REWORK09/REWORK13 — the Circuit duration reflects the real computed Activity-only duration, not a static placeholder", () => {
    // Correctif T02 (2026-09-08) : la durée du Circuit n'agrège que la zone
    // IN_TOUR — `createExerciseDraft` positionne par défaut `BEFORE_TOUR`,
    // d'où l'override explicite (sans quoi la synthèse serait vide).
    renderScreenWithDraft([
      { ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45), structuralPosition: "IN_TOUR" },
    ]);

    const tourSummary = screen.getByTestId("composition-circuit-header-duration");
    // Contexte : seule l'Activité contribue désormais — 45 s -> ceil(45/60) = 1 min.
    expect(tourSummary.props.children).toBe("1 min");
  });

  /**
   * REWORK13 (R13-02), tests obligatoires n°2 et n°3 : confirmer le Compte
   * à rebours initial ou la Fin de séance n'actualise jamais la synthèse du
   * Tour (seulement sa propre carte) ; modifier une Activité ou le nombre
   * de Tours l'actualise conformément aux références.
   */
  it("REWORK13 (R13-02) — confirming Compte à rebours initial or Fin de séance updates only their own card, never the Circuit duration", () => {
    // Correctif T02 (2026-09-08) : voir le test précédent.
    renderScreenWithDraft([
      { ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45), structuralPosition: "IN_TOUR" },
    ]);

    const tourSummaryBefore = screen.getByTestId("composition-circuit-header-duration").props.children;
    expect(tourSummaryBefore).toBe("1 min");

    // Compte à rebours initial : ouvre, change, confirme.
    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 2);
    fireEvent.press(screen.getByLabelText(composition.wheelPicker.validateAccessibilityLabel));
    expect(screen.getByText("02 min 10 s")).toBeTruthy(); // sa propre carte a bien changé
    expect(
      screen.getByTestId("composition-circuit-header-duration")
        .props.children,
    ).toBe(tourSummaryBefore); // la durée du Circuit, elle, reste identique

    // Fin de séance : idem.
    fireEvent.press(screen.getByLabelText(composition.finalPhase.label));
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 3);
    fireEvent.press(screen.getByLabelText(composition.wheelPicker.validateAccessibilityLabel));
    expect(screen.getByText("03 min 05 s")).toBeTruthy();
    expect(
      screen.getByTestId("composition-circuit-header-duration")
        .props.children,
    ).toBe(tourSummaryBefore);
  });

  it("REWORK13 (R13-02) — adding a second Activity updates the Circuit duration accordingly (count and duration both recomputed)", () => {
    // Correctif T02 (2026-09-08) : voir le premier test de ce bloc.
    renderScreenWithDraft([
      { ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45), structuralPosition: "IN_TOUR" },
      { ...createExerciseDraft("ex-2"), name: "Squats", executionParameters: durationParameters(30), structuralPosition: "IN_TOUR" },
    ]);

    const tourSummary = screen.getByTestId("composition-circuit-header-duration");
    // 45 + 30 = 75s -> ceil(75/60) = 2 min.
    expect(tourSummary.props.children).toBe("2 min");
  });

  // PRE-6 story 2.1 (Figma `8328:28636`) : borne = repère, libellé, pastille de valeur à droite
  // (remplace l'anatomie CMP-03/CMP-05 poignée / libellé + valeur / icône de rôle).
  it("PRE6-2.1 — Boundary steps (Compte à rebours, Fin de séance): ring marker, label, then the value pill on the right; no handle, no role icon, no chevron", () => {
    renderScreen();

    for (const [testID, label, value] of [
      ["composition-boundary-countdown", composition.countdown.label, "00 min 10 s"],
      ["composition-boundary-final-phase", composition.finalPhase.label, "00 min 05 s"],
    ] as const) {
      const row = screen.getByTestId(testID);
      expect(StyleSheet.flatten(row.props.style)).toMatchObject({ height: 24, flexDirection: "row" });
      expect(within(row).getByText(label)).toBeTruthy();
      // Toute la rangée (libellé + pastille) est le déclencheur de la roulette (acquis conservé).
      expect(screen.getByLabelText(label)).toBe(row);
      expect(row.props.accessibilityValue).toMatchObject({ text: value });
      expect(within(screen.getByTestId(`${testID}-value`)).getByText(value)).toBeTruthy();
      expect(within(row).queryByTestId("composition-boundary-handle-slot")).toBeNull();
      expect(within(row).queryByTestId("composition-row-chevron-down")).toBeNull();
    }
  });

  it("REWORK09 — supersedes CMP-06: the redundant summary line is removed from the Bottom Action zone (moved to the Circuit header since REWORK08-C) — only Continuer remains there", () => {
    renderScreen();

    const bottomAction = screen.getByTestId("composition-bottom-action");
    expect(within(bottomAction).queryByText("— min")).toBeNull();
    expect(within(bottomAction).getByLabelText(composition.saveAction)).toBeTruthy();
    // La synthèse reste bien affichée ailleurs (sous le titre « Circuit »),
    // jamais silencieusement perdue.
    expect(screen.getByTestId("composition-circuit-header-duration")).toBeTruthy();
  });

  // PRE-6 story 2.1 (`DSF / Forms / Valeur modifiable`, Texte=13) : pastille de valeur des bornes.
  it("PRE6-2.1 — the boundary value pill: surface background, radius 10, padding 10/4, Inter Semi Bold 13 primary; whole row pressable with a 44 target", () => {
    renderScreen();

    const pill = screen.getByTestId("composition-boundary-countdown-value");
    expect(StyleSheet.flatten(pill.props.style)).toMatchObject({
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
    });
    // Cible tactile : la rangée entière, 24 de haut portée à 44 par `hitSlop`.
    const row = screen.getByLabelText(composition.countdown.label);
    expect(24 + row.props.hitSlop.top + row.props.hitSlop.bottom).toBe(44);
    expect(StyleSheet.flatten(within(pill).getByText("00 min 10 s").props.style)).toMatchObject({
      ...type.editableValue,
      color: colors.primary,
    });
    const label = within(screen.getByTestId("composition-boundary-countdown")).getByText(composition.countdown.label);
    expect(StyleSheet.flatten(label.props.style)).toMatchObject({ ...type.label, color: colors.textLabel });
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

    const tourSection = screen.getByTestId("composition-tour-section");
    const tourCard = screen.getByTestId("composition-circuit-header");
    const tourSectionStyle = StyleSheet.flatten(tourSection.props.style);
    const tourCardStyle = StyleSheet.flatten(tourCard.props.style);

    // L'en-tête intérieur (PRE-6 story 3.1 : `CircuitHeader`) ne porte aucune
    // des propriétés de boîte de `limitCardBase`.
    expect(tourCardStyle.borderWidth).toBeUndefined();
    expect(tourCardStyle.borderRadius).toBeUndefined();
    expect(tourCardStyle.backgroundColor).toBeUndefined();

    // La structure extérieure (`composition-tour-section`) porte sa propre
    // géométrie canonique, explicitement distincte de celle des cartes
    // limites (`limitCardBase`, rayon `12`, bordure grise `colors.border`).
    // PRE-6 story 2.1 : les bornes ne sont plus des cartes ; le rayon 12 des cartes reste
    // celui de la carte d'Exercice.
    expect(tourSectionStyle.borderRadius).toBe(10);
    expect(tourSectionStyle.borderRadius).not.toBe(12);
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

  // PRE-6 (story 2.2, `5544:6797`) : nom de l'occurrence en Inter Semi Bold 15, une ligne ;
  // le titre 16/19 reste celui du Circuit.
  it("PRE6-2.2 — the occurrence name is Inter Semi Bold 15 on one line; the Tour title keeps 16", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]);

    const name = within(screen.getByTestId("composition-exercise-row-ex-1")).getByText("Gainage");
    expect(name.props.numberOfLines).toBe(1);
    expect(StyleSheet.flatten(name.props.style)).toMatchObject({ ...type.listCardTitle, color: colors.textPrimary });

    const tourLabel = within(screen.getByTestId("composition-circuit-header")).getByText(
      composition.circuit.title,
    );
    expect(StyleSheet.flatten(tourLabel.props.style).fontSize).toBe(16);
  });

  // PRE-6 (story 2.2) : synthèse Inter Medium 12 #46464C, alignée à droite, sur la ligne 2.
  it("PRE6-2.2 — the occurrence summary is Inter Medium 12, #46464C, right-aligned", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]);

    const summary = within(screen.getByTestId("composition-exercise-row-ex-1")).getByText("45 s");
    expect(StyleSheet.flatten(summary.props.style)).toMatchObject({
      fontFamily: "Inter_500Medium",
      fontSize: 12,
      textAlign: "right",
      color: colors.textLabel,
    });
  });

  it("REWORK07-A — the structure/move slot is back to the canonical 28×28 (down from 32×32/REWORK06 — the oversized container compensated for an undersized glyph, no longer needed once the asset itself was replaced) — the icon inside renders the canonical 20×20 glyph at opacity 0.5, with no local opacity prop needed", () => {
    // PRE-6 story 2.1 : la poignée n'existe plus que sur la carte d'Exercice (bornes immobiles).
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]);

    const handleSlot = within(screen.getByTestId("composition-exercise-row-ex-1")).getByTestId(
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

  // PRE-6 (story 3.1, Figma `8328:28667`) : l'en-tête du Circuit n'a plus d'icône Tour (R4-11 /
  // REWORK12 retirés) — absence vérifiée par le test « PRE6-3.1 — Circuit header ».

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
      composition.circuit.title,
      composition.finalPhase.label,
    ]);
    expect(labelOrder).toEqual([
      composition.countdown.label,
      composition.circuit.title,
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

    const continueAction = screen.getByLabelText(composition.saveAction);
    expect(continueAction.props.accessibilityState).toMatchObject({ disabled: true });
  });

  // PRE-4, décision Q54 : plus d'écran « Catégories de la séance » — l'action enregistre et
  // ferme le parcours depuis la Composition.
  it("PRE4-Q54/save — enables once the Composition is fully valid, saves from the Composition (one write on double tap) and dismisses to the Catalogue, never to /categories", async () => {
    let resolveCreate: (value: { ok: true; value: unknown }) => void = () => undefined;
    const createSession = jest.fn(
      () =>
        new Promise<{ ok: true; value: unknown }>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    const service = { createSession, updateSession: jest.fn() } as unknown as SessionService;
    render(
      <SessionServiceContext.Provider value={service}>
        <TestSafeAreaProvider>
          <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService()}>
            <ReferentialServiceContext.Provider value={fakeReferentialService()}>
              <StatefulDraftWrapper
                initialExercises={[{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]}
              >
                <CompositionScreen />
              </StatefulDraftWrapper>
            </ReferentialServiceContext.Provider>
          </ActivityDefinitionServiceContext.Provider>
        </TestSafeAreaProvider>
      </SessionServiceContext.Provider>,
    );

    const saveAction = screen.getByLabelText(composition.saveAction);
    expect(saveAction.props.accessibilityState).toMatchObject({ disabled: false });
    // PRE-6 story 2.1 (CE-T03-08, D-388) : libellé « Continuer », même enregistrement (Q54).
    expect(screen.getByText("Continuer")).toBeTruthy();

    fireEvent.press(saveAction);
    fireEvent.press(saveAction);
    expect(createSession).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(composition.saveAction).props.accessibilityState).toMatchObject({ disabled: true });
    await act(async () => {
      resolveCreate({ ok: true, value: {} });
    });
    await waitFor(() =>
      expect(mockDismissTo).toHaveBeenCalledWith({ pathname: "/", params: { catalogueSegment: "sessions" } }),
    );
    expect(mockPush).not.toHaveBeenCalledWith("/categories");
  });

  it("PRE4-Q54/save-failure — échec : message D-107 sur la Composition, action réactivée, aucune fermeture", async () => {
    const service = {
      createSession: jest.fn(async () => ({ ok: false, error: { violations: [] } })),
      updateSession: jest.fn(),
    } as unknown as SessionService;
    render(
      <SessionServiceContext.Provider value={service}>
        <TestSafeAreaProvider>
          <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService()}>
            <ReferentialServiceContext.Provider value={fakeReferentialService()}>
              <StatefulDraftWrapper
                initialExercises={[{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]}
              >
                <CompositionScreen />
              </StatefulDraftWrapper>
            </ReferentialServiceContext.Provider>
          </ActivityDefinitionServiceContext.Provider>
        </TestSafeAreaProvider>
      </SessionServiceContext.Provider>,
    );
    await act(async () => {
      fireEvent.press(screen.getByLabelText(composition.saveAction));
    });
    expect(screen.getByTestId("composition-save-error").props.children).toBe("La séance n’a pas pu être enregistrée. Réessayez.");
    expect(screen.getByLabelText(composition.saveAction).props.accessibilityState).toMatchObject({ disabled: false });
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  it("stays disabled again if the only Activity becomes invalid (defense in depth, mirrors toCreateSessionInput)", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "", executionParameters: durationParameters(45) }]);

    expect(screen.getByLabelText(composition.saveAction).props.accessibilityState).toMatchObject({
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
    expect(screen.queryByLabelText(composition.saveAction)).toBeNull();
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
        exercises: [{ ...createExerciseDraft("keep-1"), name: "Gainage", executionParameters: durationParameters(30) }],
      },
    });

    expect(screen.getByLabelText(composition.name)).toBeTruthy();
    expect(screen.queryByTestId("composition-edit-state")).toBeNull();
  });

  it("in modification, the exit guard compares against the rehydrated baseline: an unchanged rehydrated draft does NOT block exit", () => {
    const rehydrated = {
      ...emptyEditDraft(),
      name: "Séance persistée",
      exercises: [{ ...createExerciseDraft("keep-1"), name: "Gainage", executionParameters: durationParameters(30) }],
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
      expect(screen.queryByLabelText(composition.saveAction)).toBeNull();
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
        exercises: [{ ...createExerciseDraft("keep-1"), name: "Gainage", executionParameters: durationParameters(30) }],
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
    { ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) },
    { ...createExerciseDraft("ex-2"), name: "Squats", executionParameters: durationParameters(30) },
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
      "composition-boundary-countdown",
      "composition-exercise-row-ex-1",
      "composition-exercise-row-ex-2",
      "composition-boundary-final-phase",
    ]);
    expect(order).toEqual([
      "composition-boundary-countdown",
      "composition-exercise-row-ex-1",
      "composition-exercise-row-ex-2",
      "composition-boundary-final-phase",
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
    executionParameters: durationParameters(90, 3, 15),
    // Ordre de SÉLECTION volontairement inverse de l'ordre du référentiel
    // (`epaules` order 1, `dos` order 4) — prouve que l'affichage suit le
    // référentiel, jamais l'ordre de sélection de l'utilisateur.
    bodyZoneIds: ["dos", "epaules"],
  };
  const summaryText = "3 × 1 min 30 s";

  it("shows the Activity's own body zones on the single classification line, in referential order, with the canonical ' · ' separator", async () => {
    renderScreenWithDraft([activityWithZones]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    const zones = await within(row).findByTestId("composition-exercise-body-zones");
    expect(zones.props.children).toBe("Épaules · Dos");
    // PRE-6 (story 2.2) : une seule ligne de classement, tronquée si nécessaire.
    expect(within(row).getByTestId("composition-exercise-classification-line").props.numberOfLines).toBe(1);
  });

  it("places that line BETWEEN the Activity name and its summary", async () => {
    renderScreenWithDraft([activityWithZones]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    await within(row).findByTestId("composition-exercise-body-zones");

    const order = textOrder(screen.toJSON(), ["Gainage", "Épaules · Dos", summaryText]);
    expect(order).toEqual(["Gainage", "Épaules · Dos", summaryText]);
  });

  // PRE-6 (story 2.2, `5544:6797`) : zones en Inter Regular 12 tertiaire ; la synthèse est
  // sur la même ligne, à droite, jamais tronquée (la ligne de classement l'est en premier).
  it("PRE6-2.2 — zones are Inter Regular 12 tertiary, the summary sits on the same row, untruncatable, 8 apart", async () => {
    renderScreenWithDraft([activityWithZones]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    await within(row).findByTestId("composition-exercise-body-zones");
    const line = within(row).getByTestId("composition-exercise-classification-line");
    expect(StyleSheet.flatten(line.props.style)).toMatchObject({
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: TEXT_TERTIARY,
      flexShrink: 1,
    });
    const summary = within(row).getByTestId("composition-exercise-summary");
    expect(summary.props.children).toBe(summaryText);
    expect(StyleSheet.flatten(within(row).getByTestId("composition-exercise-secondary-row").props.style)).toMatchObject({ flexDirection: "row", gap: 8 });
  });

  it("without a body zone nor a Category, the classification line stays (empty) and the card height does not change", () => {
    renderScreenWithDraft([
      { ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) },
    ]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    expect(within(row).queryByTestId("composition-exercise-body-zones")).toBeNull();
    expect(within(row).queryByTestId("composition-exercise-category-dot")).toBeNull();
    expect(within(row).getByTestId("composition-exercise-classification")).toBeTruthy();
    expect(StyleSheet.flatten(row.props.style).height).toBe(64);
  });

  it("PRE6-2.2 — with a Category: colored 6 dot, then the Category (Semi Bold 12, #46464C), then ' · zones'", async () => {
    renderScreenWithDraft([{ ...activityWithZones, categoryId: "renforcement" }]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    const category = await within(row).findByTestId("composition-exercise-category");
    expect(category.props.children).toBe("Renforcement");
    expect(StyleSheet.flatten(category.props.style)).toMatchObject({
      fontFamily: "Inter_600SemiBold",
      fontSize: 12,
      color: colors.textLabel,
    });
    const dot = within(row).getByTestId("composition-exercise-category-dot");
    expect(StyleSheet.flatten(dot.props.style)).toMatchObject({
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#3B82F6",
    });
    const line = within(row).getByTestId("composition-exercise-classification-line");
    expect(line.props.children).toEqual([expect.anything(), " · ", expect.anything()]);
    expect(within(row).getByTestId("composition-exercise-body-zones").props.children).toBe("Épaules · Dos");
  });

  it("PRE6-2.2 — with a Category but no zone: the Category alone, no separator", async () => {
    renderScreenWithDraft([
      { ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45), categoryId: "renforcement" },
    ]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    await within(row).findByTestId("composition-exercise-category");
    const line = within(row).getByTestId("composition-exercise-classification-line");
    expect(line.props.children).toEqual([expect.anything(), null, null]);
  });

  it("PRE6-2.2 — reloads the Categories when the screen regains focus (Category created in the editor)", async () => {
    let currentCategories: readonly Category[] = [];
    const listCategories = jest
      .fn<ActivityDefinitionService["listCategories"]>()
      .mockImplementation(async () => currentCategories);
    mockFocusHarness.callbacks = [];
    render(
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService({ listCategories })}>
          <ReferentialServiceContext.Provider value={fakeReferentialService()}>
            <StatefulDraftWrapper initialExercises={[{ ...activityWithZones, categoryId: "renforcement" }]}>
              <CompositionScreen />
            </StatefulDraftWrapper>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    await waitFor(() => expect(listCategories).toHaveBeenCalled());
    await within(row).findByTestId("composition-exercise-body-zones");
    expect(within(row).queryByTestId("composition-exercise-category")).toBeNull();

    currentCategories = CATEGORY_FIXTURES;
    act(() => {
      mockFocusHarness.callbacks.forEach((callback) => callback());
    });

    expect((await within(row).findByTestId("composition-exercise-category")).props.children).toBe("Renforcement");
  });

  it("PRE6-2.2 — an unknown Category id shows no dot and no Category name", async () => {
    renderScreenWithDraft([{ ...activityWithZones, categoryId: "inconnue" }]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    await within(row).findByTestId("composition-exercise-body-zones");
    expect(within(row).queryByTestId("composition-exercise-category-dot")).toBeNull();
    expect(within(row).queryByTestId("composition-exercise-category")).toBeNull();
  });

  it("never adds that line to the Compte à rebours initial / Fin de séance cards (they have no body zones — those cards stay rigorously unchanged)", async () => {
    renderScreenWithDraft([activityWithZones]);
    await screen.findByTestId("composition-exercise-body-zones");

    const countdown = screen.getByTestId("composition-boundary-countdown");
    const finalPhase = screen.getByTestId("composition-boundary-final-phase");
    expect(within(countdown).queryByTestId("composition-exercise-body-zones")).toBeNull();
    expect(within(finalPhase).queryByTestId("composition-exercise-body-zones")).toBeNull();
    // Une seule occurrence dans tout l'écran : celle de l'Activité.
    expect(screen.getAllByTestId("composition-exercise-body-zones")).toHaveLength(1);

    // PRE-6 story 2.1 : les bornes sont des étapes de 24 (Figma `8328:28636`), inchangées.
    for (const row of [countdown, finalPhase]) {
      expect(StyleSheet.flatten(row.props.style).height).toBe(24);
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
    executionParameters: durationParameters(30),
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
      "composition-boundary-countdown",
      "composition-exercise-row-warmup",
      "composition-tour-section",
      "composition-exercise-row-core",
      "composition-exercise-row-stretch",
      "composition-boundary-final-phase",
    ]);
    expect(order).toEqual([
      "composition-boundary-countdown",
      "composition-exercise-row-warmup",
      "composition-tour-section",
      "composition-exercise-row-core",
      "composition-exercise-row-stretch",
      "composition-boundary-final-phase",
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
    // PRE-6 (story 2.2) : rayon unique de la carte d'occurrence (14), auparavant 12.
    expect(liftedStyle.borderRadius).toBe(14);
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
    // PRE-6 (story 2.2) : même rayon que la carte (14), auparavant 12.
    expect(actionsStyle.borderRadius).toBe(14);
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

  it("AC-06 — Dupliquer inserts an independent copy right after its source, with a fresh id and the « (copie) » suffix (PRE-6 story 2.3, D-124)", async () => {
    renderTwo();
    await screen.findByTestId("composition-exercise-body-zones");
    fireSwipeLeft("ex-1");
    fireEvent.press(screen.getByTestId("composition-activity-duplicate-ex-1"));

    // PRE-6 (story 2.3, D-124, ch13) : la copie est nommée « Gainage (copie) ».
    expect(screen.getAllByText("Gainage")).toHaveLength(1);
    expect(screen.getByText("Gainage (copie)")).toBeTruthy();
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

    // PRE-6 story 2.1 : une ligne de récupération (et son emplacement) par occurrence.
    expect(screen.getAllByTestId(/^composition-activity-recovery-(?!slot-)/u)).toHaveLength(1);

    fireSwipeLeft("ex-1");
    fireEvent.press(screen.getByTestId("composition-activity-duplicate-ex-1"));

    // La copie porte SA PROPRE ligne de récupération, au même libellé.
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
    screen.getByLabelText(composition.saveAction).props.accessibilityState,
  ).toMatchObject({ disabled: false });

  fireSwipeLeft("ex-1");
  fireEvent.press(screen.getByTestId("composition-activity-delete-ex-1"));

  expect(screen.queryByTestId("composition-exercise-row-ex-1")).toBeNull();
  expect(
    screen.getByLabelText(composition.saveAction).props.accessibilityState,
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
/**
 * PRE-6 story 2.1 (D-303, D-217, écart E5, Figma `8328:28657`) : la sous-carte Récupération
 * du bloc (T02-S02) est remplacée par une ligne structurelle SOUS la carte — trait toujours
 * présent, information seulement si R > 0 ; la carte reprend ses hauteurs sans sous-carte.
 */
describe("CompositionScreen — ligne structurelle de récupération et géométries conditionnelles (T02-S02, révisé PRE-6 story 2.1)", () => {
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

  it("PRE6-2.1 — R = 0 ou R absente : trait seul, aucune information (jamais « Récupération 0 s »)", () => {
    for (const recovery of [0, null] as const) {
      renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: recovery })]);

      const line = screen.getByTestId("composition-activity-recovery-ex-1");
      expect(within(line).getByTestId("composition-recovery-line-rule")).toBeTruthy();
      expect(within(line).queryByTestId("composition-recovery-line-icon")).toBeNull();
      expect(within(line).queryByTestId("composition-recovery-line-label")).toBeNull();
      expect(screen.queryByText(/Récupération/u)).toBeNull();
    }
  });

  it("PRE6-2.1 — R = 20 : sablier 13 + « Récupération 20 s » avant le trait, ligne de 21", () => {
    renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: 20 })]);

    const line = screen.getByTestId("composition-activity-recovery-ex-1");
    expect(StyleSheet.flatten(line.props.style)).toMatchObject({
      height: 21,
      flexDirection: "row",
      paddingHorizontal: 14,
      paddingVertical: 4,
    });
    expect(StyleSheet.flatten(within(line).getByTestId("composition-recovery-line-icon").props.style)).toMatchObject({
      width: 13,
      height: 13,
    });
    const label = within(line).getByText("Récupération 20 s");
    expect(StyleSheet.flatten(label.props.style)).toMatchObject({ fontSize: 11, fontWeight: "500", color: TEXT_TERTIARY });
    expect(
      testIdOrder(screen.toJSON(), ["composition-recovery-line-icon", "composition-recovery-line-label", "composition-recovery-line-rule"]),
    ).toEqual(["composition-recovery-line-icon", "composition-recovery-line-label", "composition-recovery-line-rule"]);
    const rule = StyleSheet.flatten(within(line).getByTestId("composition-recovery-line-rule").props.style);
    expect(rule).toMatchObject({ flex: 1, height: 1, backgroundColor: colors.divider });
  });

  // PRE-6 (story 2.2, `5544:6797`) : padding 14 / 12, nom 18 + 4 + ligne 16 → carte de 64.
  it("PRE6-2.2 — the occurrence card content is padded 14 / 12 and fits a 64 card (name 18, gap 4, row 16, beside the handle)", () => {
    renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage" })]);

    const content = StyleSheet.flatten(screen.getByTestId("composition-activity-main-card").props.style);
    expect(content).toMatchObject({ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, gap: 8 });
    expect(1 + 12 + type.listCardTitle.lineHeight + 4 + 16 + 12 + 1).toBe(64);
    expect(blockStyle().height).toBe(64);
  });

  it("PRE6-2.1 — la ligne fait bloc avec l'occurrence : même conteneur gestuel, sous la carte, même translation", () => {
    renderScreenWithDraft(withRecovery);

    const container = screen.getByTestId("composition-activity-ex-1");
    const card = screen.getByTestId("composition-exercise-row-ex-1");
    const line = within(container).getByTestId("composition-activity-recovery-ex-1");
    // Hors de la surface de la carte, après elle, dans le même conteneur gestuel (D-138).
    expect(within(card).queryByTestId("composition-activity-recovery-ex-1")).toBeNull();
    expect(
      testIdOrder(screen.toJSON(), ["composition-exercise-row-ex-1", "composition-activity-recovery-ex-1"]),
    ).toEqual(["composition-exercise-row-ex-1", "composition-activity-recovery-ex-1"]);
    expect(screen.getAllByTestId(/^composition-activity-ex-1$/u)).toHaveLength(1);
    expect(card.props.accessibilityRole).toBe("button");
    // Écart 6 entre la carte et la ligne (Figma `8328:28645`), même transformation que la carte.
    expect(line).toBeTruthy();
    const lineWrapper = StyleSheet.flatten(
      within(container).getByTestId("composition-activity-recovery-slot-ex-1").props.style,
    );
    expect(lineWrapper.marginTop).toBe(6);
    expect(lineWrapper.transform).toEqual(StyleSheet.flatten(card.props.style).transform);
  });

  it("PRE6-2.2 — the card is 64 with or without Zones; the recovery line never changes the card height", async () => {
    renderScreenWithDraft(withZeroRecovery);
    expect(blockStyle().height).toBe(64);

    renderScreenWithDraft(withRecovery);
    expect(blockStyle().height).toBe(64);

    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", bodyZoneIds: ["dos"] }),
    ]);
    await screen.findByTestId("composition-exercise-body-zones");
    expect(blockStyle().height).toBe(64);
  });

  // PRE-6 (story 2.2, variante « Répétitions + cadence » `9522:43875`) : seconde ligne
  // « durée estimée » (Inter 11) sous la synthèse et carte de 70.
  it("PRE6-2.2 — Répétitions with a beep: estimated duration line under the summary, card 70", () => {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", {
        name: "Extension",
        executionParameters: repetitionParameters(10, 1, 0, { cadenceBeepIntervalSeconds: 6 }),
      }),
    ]);

    expect(screen.getByTestId("composition-exercise-summary").props.children).toBe("10 rép.");
    const estimated = screen.getByTestId("composition-exercise-estimated-duration");
    expect(estimated.props.children).toBe("≈ 1 min");
    expect(StyleSheet.flatten(estimated.props.style)).toMatchObject({ fontSize: 11 });
    expect(blockStyle().height).toBe(70);
    expect(StyleSheet.flatten(screen.getByTestId("composition-activity-main-card").props.style).paddingBottom).toBe(0);
  });

  it("PRE6-2.2 — Répétitions without a beep: no estimated duration line", () => {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Extension", executionParameters: repetitionParameters(10) }),
    ]);

    expect(screen.queryByTestId("composition-exercise-estimated-duration")).toBeNull();
    expect(blockStyle().height).toBe(64);
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

  it("sizes each revealed action to the FULL height of the card (72 × 64)", async () => {
    renderScreenWithDraft(withZeroRecovery);
    fireSwipeLeft("ex-1");
    for (const testID of [
      "composition-activity-duplicate-ex-1",
      "composition-activity-delete-ex-1",
    ]) {
      const style = StyleSheet.flatten(screen.getByTestId(testID).props.style);
      expect(style.width).toBe(72);
      expect(style.height).toBe(64);
    }
    expect(
      StyleSheet.flatten(screen.getByTestId("composition-activity-actions-ex-1").props.style).height,
    ).toBe(64);
  });

  it("CE-T02-02 — the lifted card keeps its constant delta: 64 + 4 = 68, width expressed as a ±4 margin", () => {
    renderScreenWithDraft(withZeroRecovery);
    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");

    const lifted = blockStyle();
    expect(lifted.height).toBe(64 + dimensions.compositionActivityRow.heightDelta);
    expect(lifted.marginHorizontal).toBe(-4);
  });

  // PRE-6 (story 2.2) : un seul rayon (14) pour la carte, les actions glissées et l'état soulevé.
  it("PRE6-2.2 — card, swipe actions group and lifted card share the radius 14", () => {
    renderScreenWithDraft(withZeroRecovery);
    expect(blockStyle().borderRadius).toBe(14);
    fireSwipeLeft("ex-1");
    expect(StyleSheet.flatten(screen.getByTestId("composition-activity-actions-ex-1").props.style).borderRadius).toBe(14);

    renderScreenWithDraft(withZeroRecovery);
    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");
    expect(blockStyle().borderRadius).toBe(14);
  });

  it("CE-T02-02 — the lifted card takes the blue surface; the recovery line has no surface of its own", () => {
    renderScreenWithDraft(withRecovery);

    expect(
      StyleSheet.flatten(screen.getByTestId("composition-activity-recovery-ex-1").props.style).backgroundColor,
    ).toBeUndefined();

    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");

    expect(blockStyle().backgroundColor).toBe(colors.exerciseContextBandBackground);
    expect(
      StyleSheet.flatten(screen.getByTestId("composition-activity-recovery-ex-1").props.style).backgroundColor,
    ).toBeUndefined();
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
describe("CompositionScreen — recalcul immédiat de la durée du Circuit (T02-S02)", () => {
  it("counts and totals ONLY the IN_TOUR Activities, then multiplies that zone by tourRepeatCount", () => {
    renderScreenWithDraft([
      anActivity("warmup", "BEFORE_TOUR", { name: "Échauffement", executionParameters: durationParameters(600) }),
      anActivity("core", "IN_TOUR", { name: "Gainage", executionParameters: durationParameters(60) }),
      anActivity("stretch", "AFTER_TOUR", { name: "Étirements", executionParameters: durationParameters(600) }),
    ]);

    // Hors Tour : `600 + 600 = 20 min` volontairement énormes — ils ne
    // doivent NI compter, NI peser dans la durée du Circuit.
    expect(screen.getByTestId("composition-circuit-header-duration").props.children).toBe("1 min");

    setCircuitCountWithStepper(3);

    // Seule la zone `IN_TOUR` est développée : `60 × 3 = 3 min`.
    expect(screen.getByTestId("composition-circuit-header-duration").props.children).toBe("3 min");
  });

  it("recomputes immediately after a DUPLICATION", () => {
    renderScreenWithDraft([anActivity("core", "IN_TOUR", { name: "Gainage", executionParameters: durationParameters(60) })]);
    expect(screen.getByTestId("composition-circuit-header-duration").props.children).toBe("1 min");

    fireSwipeLeft("core");
    fireEvent.press(screen.getByTestId("composition-activity-duplicate-core"));

    expect(screen.getByTestId("composition-circuit-header-duration").props.children).toBe(
      "2 min",
    );
  });

  it("recomputes immediately after a DELETION", () => {
    renderScreenWithDraft([
      anActivity("core-1", "IN_TOUR", { name: "Gainage", executionParameters: durationParameters(60) }),
      anActivity("core-2", "IN_TOUR", { name: "Squats", executionParameters: durationParameters(60) }),
    ]);
    expect(screen.getByTestId("composition-circuit-header-duration").props.children).toBe(
      "2 min",
    );

    fireSwipeLeft("core-1");
    fireEvent.press(screen.getByTestId("composition-activity-delete-core-1"));

    expect(screen.getByTestId("composition-circuit-header-duration").props.children).toBe("1 min");
  });

  it("recomputes immediately after a MOVE out of the Tour", () => {
    renderScreenWithDraft([anActivity("core", "IN_TOUR", { name: "Gainage", executionParameters: durationParameters(60) })]);
    expect(screen.getByTestId("composition-circuit-header-duration").props.children).toBe("1 min");

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

    // Sortie du Circuit : la durée du Circuit redevient l'état vide.
    expect(screen.getByTestId("composition-circuit-header-duration").props.children).toBe(
      composition.summary.empty,
    );
  });
});

/** PRE-6 (story 3.1) : compteur du Circuit — réglage par l'action VoiceOver du compteur au repos. */
function stepCircuitCounter(direction: "increment" | "decrement", times = 1) {
  for (let i = 0; i < times; i += 1) {
    fireEvent(screen.getByTestId("composition-circuit-header-counter"), "accessibilityAction", {
      nativeEvent: { actionName: direction },
    });
  }
}

/** PRE-6 (story 3.1) : règle N depuis 1 par le + du stepper révélé (un appui par pas). */
function setCircuitCountWithStepper(target: number) {
  fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press"));
  for (let i = 1; i < target; i += 1) {
    const plus = screen.getByTestId("composition-circuit-header-counter-stepper-increment");
    fireEvent(plus, "pressIn");
    fireEvent(plus, "pressOut");
  }
}

describe("CompositionScreen — en-tête du Circuit et compteur (PRE-6 story 3.1, CIR-10)", () => {
  const oneActivity = [anActivity("ex-1", "IN_TOUR", { name: "Gainage", executionParameters: durationParameters(60) })];
  const unitText = () => screen.getByTestId("composition-circuit-header-counter-unit-text", { includeHiddenElements: true }).props.children;
  const counterValue = () => screen.getByTestId("composition-circuit-header-counter-value").props.children;
  const circuitDuration = () => screen.getByTestId("composition-circuit-header-duration").props.children;
  const sessionDuration = () => screen.getByTestId("composition-session-duration").props.children;

  it("at rest: « 1 » + « tour » in Tours, « 3 » + « séries » in Series (N = 1 singular)", () => {
    renderScreenWithDraft(oneActivity);
    expect(counterValue()).toBe(1);
    expect(unitText()).toBe("tour");
    // Aucun stepper au repos.
    expect(screen.queryByTestId("composition-circuit-header-counter-stepper")).toBeNull();

    screen.unmount();
    renderScreenWithDraft(oneActivity, { tourRepeatCount: 3, circuitNature: "SERIES" });
    expect(counterValue()).toBe(3);
    expect(unitText()).toBe("séries");
  });

  it("Series N = 1 is singular « série »; Tours N = 2 is plural « tours »", () => {
    renderScreenWithDraft(oneActivity, { tourRepeatCount: 1, circuitNature: "SERIES" });
    expect(unitText()).toBe("série");
    screen.unmount();
    renderScreenWithDraft(oneActivity, { tourRepeatCount: 2 });
    expect(unitText()).toBe("tours");
  });

  it("touching the digit reveals − and + around « digit + unit pill », on the white radius-18 field with surface circles", () => {
    renderScreenWithDraft(oneActivity, { tourRepeatCount: 4 });

    fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press"));

    const field = screen.getByTestId("composition-circuit-header-counter-field");
    expect(StyleSheet.flatten(field.props.style)).toMatchObject({ backgroundColor: colors.background, borderRadius: 18 });
    const minus = within(field).getByTestId("composition-circuit-header-counter-stepper-decrement");
    const plus = within(field).getByTestId("composition-circuit-header-counter-stepper-increment");
    for (const button of [minus, plus]) {
      expect(StyleSheet.flatten(button.props.style)).toMatchObject({ width: 28, height: 28, backgroundColor: colors.surface });
    }
    // Ordre : −, chiffre, pastille, +.
    expect(
      testIdOrder(screen.toJSON(), [
        "composition-circuit-header-counter-stepper-decrement",
        "composition-circuit-header-counter-stepper-value",
        "composition-circuit-header-counter-unit",
        "composition-circuit-header-counter-stepper-increment",
      ]),
    ).toEqual([
      "composition-circuit-header-counter-stepper-decrement",
      "composition-circuit-header-counter-stepper-value",
      "composition-circuit-header-counter-unit",
      "composition-circuit-header-counter-stepper-increment",
    ]);
    const digit = screen.getByTestId("composition-circuit-header-counter-stepper-value");
    expect(digit.props.children).toBe("4");
    expect(StyleSheet.flatten(digit.props.style)).toMatchObject({ fontSize: 13, fontWeight: "600", color: colors.textPrimary });
    expect(screen.getByTestId("composition-circuit-header-counter-unit-text", { includeHiddenElements: true }).props.children).toBe("tours");
  });

  it("bounds: − unavailable at 1, + unavailable at 99", () => {
    renderScreenWithDraft(oneActivity);
    fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press"));
    expect(
      screen.getByTestId("composition-circuit-header-counter-stepper-decrement").props.accessibilityState,
    ).toMatchObject({ disabled: true });
    expect(
      screen.getByTestId("composition-circuit-header-counter-stepper-increment").props.accessibilityState,
    ).toMatchObject({ disabled: false });

    screen.unmount();
    renderScreenWithDraft(oneActivity, { tourRepeatCount: 99 });
    fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press"));
    expect(
      screen.getByTestId("composition-circuit-header-counter-stepper-increment").props.accessibilityState,
    ).toMatchObject({ disabled: true });
    expect(
      screen.getByTestId("composition-circuit-header-counter-stepper-decrement").props.accessibilityState,
    ).toMatchObject({ disabled: false });
  });

  it("each step updates N, the Circuit duration and the session duration, without any message; the unit agrees", () => {
    renderScreenWithDraft(oneActivity);
    expect(circuitDuration()).toBe("1 min");
    expect(sessionDuration()).toBe("1 min");

    setCircuitCountWithStepper(3);

    expect(screen.getByTestId("composition-circuit-header-counter-stepper-value").props.children).toBe("3");
    expect(unitText()).toBe("tours");
    expect(circuitDuration()).toBe("3 min");
    expect(sessionDuration()).toBe("3 min");
    // Sans message : aucun dialogue de confirmation.
    expect(screen.queryByText("Confirmer")).toBeNull();

    const minus = screen.getByTestId("composition-circuit-header-counter-stepper-decrement");
    fireEvent(minus, "pressIn");
    fireEvent(minus, "pressOut");
    expect(circuitDuration()).toBe("2 min");
  });

  it("Series 4 → 3 → 4 goes through setCircuitCount: the 4th row goes to the reserve, then is restored (original rows)", () => {
    // Durées affichées seulement (le brouillon est vérifié ligne à ligne par le test « compteur
    // du Circuit et brouillon » de la story 2.3) : lignes de 1, 2, 3 et 4 min sans pause, donc
    // 10 min à N = 4 et 6 min à N = 3 ; revenir à 10 min (et non 9, la ligne 3 recopiée)
    // n'est compatible qu'avec le retour de la ligne 4 mise en réserve.
    renderScreenWithDraft(
      [
        anActivity("ex-1", "IN_TOUR", {
          name: "Squats",
          executionParameters: variableParameters({ rows: [[60, 0], [120, 0], [180, 0], [240, 0]] }),
        }),
      ],
      { tourRepeatCount: 4, circuitNature: "SERIES" },
    );
    expect(circuitDuration()).toBe("10 min");

    fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press"));
    const minus = screen.getByTestId("composition-circuit-header-counter-stepper-decrement");
    fireEvent(minus, "pressIn");
    fireEvent(minus, "pressOut");
    expect(circuitDuration()).toBe("6 min");
    expect(unitText()).toBe("séries");

    const plus = screen.getByTestId("composition-circuit-header-counter-stepper-increment");
    fireEvent(plus, "pressIn");
    fireEvent(plus, "pressOut");
    expect(circuitDuration()).toBe("10 min");
    expect(sessionDuration()).toBe("10 min");
  });

  it("touching the value closes the stepper (RC-4)", () => {
    renderScreenWithDraft(oneActivity);
    fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press"));
    expect(screen.getByTestId("composition-circuit-header-counter-stepper")).toBeTruthy();

    fireEvent.press(screen.getByTestId("composition-circuit-header-counter-stepper-value-press"));
    expect(screen.queryByTestId("composition-circuit-header-counter-stepper")).toBeNull();
    expect(screen.getByTestId("composition-circuit-header-counter")).toBeTruthy();
  });

  it("touching elsewhere closes the stepper (body, Circuit container, scroll)", () => {
    renderScreenWithDraft(oneActivity);

    fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press"));
    fireEvent.press(screen.getByTestId("composition-circuit-counter-outside"));
    expect(screen.queryByTestId("composition-circuit-header-counter-stepper")).toBeNull();
    // Sans stepper ouvert, aucune zone d'appui extérieur.
    expect(screen.queryByTestId("composition-circuit-counter-outside")).toBeNull();

    fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press"));
    fireEvent.press(screen.getByTestId("composition-circuit-counter-outside-section"));
    expect(screen.queryByTestId("composition-circuit-header-counter-stepper")).toBeNull();

    fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press"));
    fireEvent(screen.getByTestId("composition-body"), "scrollBeginDrag");
    expect(screen.queryByTestId("composition-circuit-header-counter-stepper")).toBeNull();
  });

  const counterClosers: [string, () => void][] = [
    ["a card press", () => {
      fireEvent.press(screen.getByTestId("composition-exercise-row-ex-1"));
    }],
    ["the Étiquette chip", () => {
      fireEvent.press(screen.getByTestId("composition-session-color-trigger"));
    }],
    ["« + »", () => {
      fireEvent.press(screen.getByTestId("composition-add-activity-action"));
    }],
    ["a long press (drag start)", () => {
      fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");
    }],
    ["a swipe revealing the card actions", () => {
      fireSwipeLeft("ex-1");
    }],
  ];
  it.each(counterClosers)("RC-4 — %s closes the revealed counter", (_label, trigger) => {
    renderScreenWithDraft(oneActivity);
    fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press"));
    expect(screen.getByTestId("composition-circuit-header-counter-stepper")).toBeTruthy();

    trigger();

    expect(screen.queryByTestId("composition-circuit-header-counter-stepper")).toBeNull();
  });

  it("RC-4 — the abandon dialog (exit guard) and « Continuer » close the revealed counter", () => {
    const view = renderScreenWithDraft(oneActivity);
    fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press"));
    mockExitGuard.mockReturnValue({ ...defaultExitGuardResult(), isPendingExit: true });
    view.rerender(
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService()}>
          <ReferentialServiceContext.Provider value={fakeReferentialService()}>
            <StatefulDraftWrapper initialExercises={oneActivity}>
              <CompositionScreen />
            </StatefulDraftWrapper>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
    expect(screen.queryByTestId("composition-circuit-header-counter-stepper")).toBeNull();

    mockExitGuard.mockReturnValue(defaultExitGuardResult());
    fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press"));
    fireEvent.press(screen.getByTestId("composition-save-action"));
    expect(screen.queryByTestId("composition-circuit-header-counter-stepper")).toBeNull();
  });

  it("one numeric field at a time: opening the counter closes a boundary wheel, and opening a boundary wheel closes the counter", () => {
    renderScreenWithDraft(oneActivity);

    fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press"));
    expect(screen.getByTestId("composition-circuit-header-counter-stepper")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    expect(screen.queryByTestId("composition-circuit-header-counter-stepper")).toBeNull();
    expect(screen.getByTestId("duration-wheel-minutes")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(composition.wheelPicker.cancelAccessibilityLabel));
    fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press"));
    expect(screen.getByTestId("composition-circuit-header-counter-stepper")).toBeTruthy();
    expect(screen.queryByTestId("duration-wheel-minutes")).toBeNull();
  });

  it("VoiceOver: adjustable « Nombre de tours » usable without revealing the stepper; increment announces « 4 tours »", () => {
    renderScreenWithDraft(oneActivity, { tourRepeatCount: 3 });

    const counter = () => screen.getByLabelText(composition.circuit.countAccessibilityLabel.TOURS);
    expect(counter().props.accessibilityRole).toBe("adjustable");
    expect(counter().props.accessibilityValue).toMatchObject({ min: 1, max: 99, now: 3, text: "3 tours" });

    stepCircuitCounter("increment");
    expect(counter().props.accessibilityValue).toMatchObject({ now: 4, text: "4 tours" });
    expect(screen.queryByTestId("composition-circuit-header-counter-stepper")).toBeNull();
    expect(circuitDuration()).toBe("4 min");

    stepCircuitCounter("decrement", 3);
    expect(counter().props.accessibilityValue).toMatchObject({ now: 1, text: "1 tour" });
    // À la borne basse, « décrémenter » n'est plus proposé.
    const actions = (counter().props.accessibilityActions as { name: string }[]).map((action) => action.name);
    expect(actions).toEqual(["increment", "activate"]);

    // « Activer » révèle le stepper, qui reste un réglage ajustable annonçant l'unité.
    fireEvent(counter(), "accessibilityAction", { nativeEvent: { actionName: "activate" } });
    const stepper = screen.getByTestId("composition-circuit-header-counter-stepper");
    expect(stepper.props.accessibilityRole).toBe("adjustable");
    expect(stepper.props.accessibilityLabel).toBe("Nombre de tours");
    expect(stepper.props.accessibilityValue).toMatchObject({ now: 1, text: "1 tour" });
  });

  it("VoiceOver in Series: « Nombre de séries », value announced « 2 séries »", () => {
    renderScreenWithDraft(oneActivity, { tourRepeatCount: 2, circuitNature: "SERIES" });
    const counter = screen.getByLabelText(composition.circuit.countAccessibilityLabel.SERIES);
    expect(counter.props.accessibilityValue).toMatchObject({ text: "2 séries" });
  });

  it("empty Circuit: « — min »; rehydrated drafts show their persisted count", () => {
    renderScreenWithDraft([], { tourRepeatCount: 7 });
    expect(circuitDuration()).toBe("— min");
    expect(counterValue()).toBe(7);
    expect(unitText()).toBe("tours");
  });

  it("an out-of-Circuit occurrence never contributes to the Circuit duration, whatever N (correctif T02, 2026-09-08)", () => {
    renderScreenWithDraft(
      [
        anActivity("ex-1", "BEFORE_TOUR", { name: "Échauffement", executionParameters: durationParameters(600) }),
        anActivity("ex-2", "IN_TOUR", { name: "Squats", executionParameters: durationParameters(60) }),
      ],
      { tourRepeatCount: 5 },
    );
    expect(circuitDuration()).toBe("5 min");
  });

  it("PRE-6 (story 1.3) — a Series Circuit duration follows the passes of the draft's nature, duration only", () => {
    // 3 séries de 60 s, pause 30 s, R 0 : Séries N = 2 → série 1 et 2 seulement, (60 + 30) × 2 = 180 s ;
    // en Tours, N = 2 développerait les trois séries deux fois (540 s → 9 min).
    renderScreenWithDraft(
      [anActivity("ex-1", "IN_TOUR", { name: "Squats", executionParameters: durationParameters(60, 3, 30) })],
      { tourRepeatCount: 2, circuitNature: "SERIES" },
    );
    expect(circuitDuration()).toBe("3 min");
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
/**
 * PRE-6 (story 2.2, RM-243, D-407, ARB-2 ; report AC6 de PRE-5) : l'indicateur `D→G` / `G→D`
 * (V2-BILAT-01) est remplacé par l'icône NEUTRE de changement de côté (16, en haut à droite),
 * sans flèche, sans badge, sans direction ; la synthèse ne porte plus « par côté » (D-238).
 */
describe("CompositionScreen — icône neutre de changement de côté et synthèse D-238 (PRE-6 story 2.2)", () => {
  it.each(["RIGHT_LEFT", "LEFT_RIGHT"] as const)("shows the neutral 16 side-change icon top right for a bilateral Exercise (%s), never a direction", (sideMode) => {
    renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { sideMode })]);

    const indicator = screen.getByTestId("composition-activity-side-mode-ex-1");
    expect(StyleSheet.flatten(indicator.props.style)).toMatchObject({
      position: "absolute",
      top: 9,
      right: 14,
      width: 16,
      height: 16,
    });
    const icon = within(indicator).getByTestId("composition-exercise-side-change-icon");
    expect(StyleSheet.flatten(icon.props.style)).toMatchObject({ width: 16, height: 16 });
    expect(screen.queryByText(/D→G|G→D/)).toBeNull();
    // Bord droit aligné sur celui de la synthèse : même marge droite (padding 14 du contenu).
    expect(StyleSheet.flatten(screen.getByTestId("composition-activity-main-card").props.style).paddingHorizontal).toBe(14);
  });

  it("omits the icon entirely for a unilateral Exercise", () => {
    renderScreenWithDraft([
      anActivity("ex-1", "AFTER_TOUR", { sideMode: "LEFT_RIGHT" }),
      anActivity("ex-2", "AFTER_TOUR", { sideMode: "UNILATERAL" }),
    ]);

    expect(screen.getByTestId("composition-activity-side-mode-ex-1")).toBeTruthy();
    expect(screen.queryByTestId("composition-activity-side-mode-ex-2")).toBeNull();
  });

  it("never writes « par côté » nor the developed direction in the summary of a bilateral Exercise", () => {
    renderScreenWithDraft([
      {
        ...createExerciseDraft("ex-1"),
        name: "Fentes",
        structuralPosition: "BEFORE_TOUR",
        executionParameters: durationParameters(90, 3, 15),
        sideMode: "RIGHT_LEFT",
      },
    ]);

    expect(screen.getByTestId("composition-exercise-summary").props.children).toBe("3 × 1 min 30 s");
    expect(screen.queryByText(/par côté/)).toBeNull();
    expect(screen.queryByText(/à droite, puis à gauche/)).toBeNull();
    expect(screen.queryByText(/à gauche, puis à droite/)).toBeNull();
  });

  // PRE-6 (story 2.2, AC4, `8328:34520`) : en Circuit de Séries, la carte reflète les N
  // séries effectives (paramètres adaptés par la story 1.4), sans règle propre.
  it("in a Series Circuit, the card reflects the occurrence's N effective series", () => {
    renderScreenWithDraft(
      [anActivity("ex-1", "IN_TOUR", { name: "Squat", executionParameters: repetitionParameters(10, 4) })],
      { circuitNature: "SERIES", tourRepeatCount: 4 },
    );

    expect(screen.getByTestId("composition-exercise-summary").props.children).toBe("4 × 10 rép.");
    // Répétitions sans bip : aucune durée annoncée.
    expect(screen.getByTestId("composition-exercise-row-ex-1").props.accessibilityLabel).toBe("Exercice, Squat, 1 sur 1");
  });

  it("in a Series Circuit, the accessible name gives the total of the occurrence's passes", () => {
    renderScreenWithDraft(
      [anActivity("ex-1", "IN_TOUR", { name: "Gainage", executionParameters: durationParameters(90, 2, 30) })],
      { circuitNature: "SERIES", tourRepeatCount: 2 },
    );

    // Deux passages : (90 + 30) × 2 = 240 s → « 4 min ».
    expect(screen.getByTestId("composition-exercise-row-ex-1").props.accessibilityLabel).toBe("Exercice, Gainage, 1 sur 1, 4 min");
  });

  // PRE-6 (story 2.2, AC5, CE-T03-08 §18) : type, nom, position dans la zone, durée d'occurrence.
  it("names each card with its type, name, position in its zone and occurrence duration", () => {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", executionParameters: durationParameters(45) }),
      anActivity("ex-2", "BEFORE_TOUR", { name: "Squat", executionParameters: durationParameters(90, 2, 30) }),
      anActivity("ex-3", "AFTER_TOUR", { name: "Étirement", executionParameters: repetitionParameters(10) }),
    ]);

    expect(screen.getByTestId("composition-exercise-row-ex-1").props.accessibilityLabel).toBe("Exercice, Gainage, 1 sur 2, 1 min");
    expect(screen.getByTestId("composition-exercise-row-ex-2").props.accessibilityLabel).toBe("Exercice, Squat, 2 sur 2, 4 min");
    // Répétitions sans bip : durée sans montant, jamais « ≥ 0 min » — partie omise.
    expect(screen.getByTestId("composition-exercise-row-ex-3").props.accessibilityLabel).toBe("Exercice, Étirement, 1 sur 1");
  });

  it("appends « changement de côté » to the accessible name of a bilateral occurrence", () => {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Fentes", executionParameters: durationParameters(45), sideMode: "RIGHT_LEFT" }),
    ]);

    expect(screen.getByTestId("composition-exercise-row-ex-1").props.accessibilityLabel).toBe(
      `Exercice, Fentes, 1 sur 1, 1 min, ${composition.occurrenceCard.accessibilitySideChange}`,
    );
  });
});

describe("CompositionScreen — recette 3 (T-49, EXT-R3-2 : zone de contexte)", () => {
  it("T-49 — courbe blanche sous Retour et fondu inférieur en couches superposées, sous le contenu, sur la couleur propre de la Composition ; contenu conservé ; aucun trait gris au-dessus de la zone (D-353)", () => {
    renderScreen();

    const band = screen.getByTestId("screen-context-band");
    // Couleur propre de la Composition conservée (bande partagée inchangée, pas la lavande de l’éditeur).
    expect(StyleSheet.flatten(band.props.style).backgroundColor).toBe(colors.selectionSurface);

    const effects = screen.getByTestId("composition-context-band-effects", { includeHiddenElements: true });
    expect(effects.props.pointerEvents).toBe("none");
    expect(effects.props.importantForAccessibility).toBe("no-hide-descendants");
    expect(StyleSheet.flatten(effects.props.style)).toMatchObject({ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" });

    // Fondu : 20 % inférieurs, couches absolues jusqu’au bas (aucune bande juxtaposée), opacités croissantes vers le blanc.
    const fade = screen.getByTestId("composition-context-band-fade", { includeHiddenElements: true });
    expect(StyleSheet.flatten(fade.props.style)).toMatchObject({ position: "absolute", bottom: 0, height: "20%" });
    const layers = fade.props.children as { props: { style: unknown } }[];
    expect(layers.length).toBeGreaterThanOrEqual(10);
    const opacities = layers.map((layer) => (StyleSheet.flatten(layer.props.style as never) as { opacity: number }).opacity);
    expect([...opacities].sort((a, b) => a - b)).toEqual(opacities);
    expect(opacities[0]).toBeLessThan(0.1);
    expect(opacities[opacities.length - 1]).toBeGreaterThan(0.9);
    for (const layer of layers) {
      expect(StyleSheet.flatten(layer.props.style as never)).toMatchObject({ position: "absolute", bottom: 0, backgroundColor: colors.background });
    }

    // Courbe : halo blanc Ø 59,28 concentrique au bouton Retour (marge 24, cercle 38, contenu 48, séparateur 1).
    const halo = StyleSheet.flatten(screen.getByTestId("composition-context-band-halo", { includeHiddenElements: true }).props.style);
    expect(halo).toMatchObject({ position: "absolute", width: 59.28, height: 59.28, borderRadius: 29.64, backgroundColor: colors.background });
    expect(halo.left).toBeCloseTo(24 + 19 - 29.64, 5);
    expect(halo.top).toBeCloseTo(-24 - 29.64, 5);

    // Effets dessinés en premier : sous le champ Nom et sous Ajouter.
    const order = (band.props.children as { props?: { testID?: string } }[])
      .flat()
      .map((child) => child?.props?.testID)
      .filter(Boolean);
    expect(order[0]).toBe("composition-context-band-effects");
    // PRE-6 story 2.1 : nom, Étiquette, durée et « + » forment le bloc `CompositionContextHeader`.
    expect(order.indexOf("composition-context-header")).toBeGreaterThan(0);
    expect(within(band).getByLabelText(composition.name)).toBeTruthy();
    expect(within(band).getByLabelText(composition.addActivity)).toBeTruthy();
    expect(screen.getByTestId("composition-session-color-trigger")).toBeTruthy();
    // D-353 (retour de Hermann) : aucun trait gris au-dessus de la zone de contexte.
    expect(screen.queryByTestId("screen-header-separator")).toBeNull();
  });
});

describe("CompositionScreen — PRE-4 Q53 (8) (Étiquette retirée encore affectée)", () => {
  // Q53 (9), décision de Hermann du 2026-10-18 : l'avis textuel de l'Étiquette retirée est retiré
  // (« ce n'est pas un besoin ») ; la pilule garde l'Étiquette.
  it("PRE4-Q53/label-composition-no-notice — la Séance garde son Étiquette retirée (pilule), sans avis textuel ni annonce ; Étiquette active : idem", async () => {
    const retiredLabels: readonly Label[] = LABEL_FIXTURES.map((label) => ({ ...label, isActive: false }));
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions").mockImplementation(() => undefined);
    render(
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider
          value={fakeActivityDefinitionService({
            listLabels: jest.fn<ActivityDefinitionService["listLabels"]>().mockResolvedValue(retiredLabels),
          })}
        >
          <ReferentialServiceContext.Provider value={fakeReferentialService({ listLabels: jest.fn(async () => retiredLabels) })}>
            <StatefulDraftWrapper initialExercises={[]} draftOverrides={{ labelId: "label-sport" }}>
              <CompositionScreen />
            </StatefulDraftWrapper>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("composition-session-label-name").props.children).toBe("Sport"));
    expect(screen.queryByTestId("composition-retired-label-notice")).toBeNull();
    expect(screen.queryByText(/a été retirée|reste associée/)).toBeNull();
    expect(announce).not.toHaveBeenCalled();
    screen.unmount();
    renderScreenWithDraft([], { labelId: "label-sport" });
    await waitFor(() => expect(screen.getByTestId("composition-session-label-name").props.children).toBe("Sport"));
    expect(screen.queryByTestId("composition-retired-label-notice")).toBeNull();
    announce.mockRestore();
  });
});

/**
 * PRE-6 (story 1.2, ARB-3) : Dupliquer, Supprimer et déposer mettent à jour
 * les Points d'arrêt du brouillon. Aucun rendu de point n'existe encore
 * (story 4.1) : une sonde lit `draft.stopPoints` dans le contexte.
 */
describe("CompositionScreen — Points d'arrêt du brouillon (PRE-6 story 1.2)", () => {
  function DraftStopPointsProbe() {
    const context = useContext(SessionDraftContext);
    return <Text testID="draft-stop-points">{JSON.stringify(context?.draft.stopPoints ?? null)}</Text>;
  }

  function readStopPoints(): unknown {
    return JSON.parse(String(screen.getByTestId("draft-stop-points").props.children));
  }

  function renderWithStopPoints(exercises: readonly SessionDraftExercise[]) {
    render(
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService()}>
          <ReferentialServiceContext.Provider value={fakeReferentialService()}>
            <StatefulDraftWrapper
              initialExercises={exercises}
              draftOverrides={{ stopPoints: [{ id: "s-1", scope: "BEFORE_TOUR", position: 1 }] }}
            >
              <CompositionScreen />
              <DraftStopPointsProbe />
            </StatefulDraftWrapper>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
  }

  function dragBy(activityId: string, deltaY: number) {
    const container = () => screen.getByTestId(`composition-activity-${activityId}`);
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(screen.getByTestId(`composition-exercise-row-${activityId}`), "longPress");
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 200, pageY: 100 + deltaY } });
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 200, pageY: 100 + deltaY } });
  }

  function layoutTwoBeforeTour() {
    fireLayout(screen.getByTestId("composition-zone-before-tour"), 70, 150);
    fireLayout(screen.getByTestId("composition-activity-ex-1"), 0, 70);
    fireLayout(screen.getByTestId("composition-activity-ex-2"), 80, 70);
    fireLayout(screen.getByTestId("composition-tour-section"), 230, 170);
  }

  const twoBefore = () => [
    anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage" }),
    anActivity("ex-2", "BEFORE_TOUR", { name: "Squats" }),
  ];

  it("Dupliquer copie le point de la source sur la copie, juste après elle", () => {
    renderWithStopPoints(twoBefore());
    fireSwipeLeft("ex-1");
    fireEvent.press(screen.getByTestId("composition-activity-duplicate-ex-1"));

    expect(readStopPoints()).toEqual([
      { id: "s-1", scope: "BEFORE_TOUR", position: 1 },
      { id: "generated-copy-id", scope: "BEFORE_TOUR", position: 2 },
    ]);
  });

  it("Supprimer retire le point rattaché à l'occurrence", () => {
    renderWithStopPoints(twoBefore());
    fireSwipeLeft("ex-1");
    fireEvent.press(screen.getByTestId("composition-activity-delete-ex-1"));

    expect(screen.queryByTestId("composition-exercise-row-ex-1")).toBeNull();
    expect(readStopPoints()).toEqual([]);
  });

  it("un dépôt qui amènerait le point juste avant la Fin est invalide : ordre et points inchangés", () => {
    renderWithStopPoints(twoBefore());
    layoutTwoBeforeTour();
    dragBy("ex-1", 100);

    expect(
      testIdOrder(screen.toJSON(), ["composition-exercise-row-ex-1", "composition-exercise-row-ex-2"]),
    ).toEqual(["composition-exercise-row-ex-1", "composition-exercise-row-ex-2"]);
    expect(readStopPoints()).toEqual([{ id: "s-1", scope: "BEFORE_TOUR", position: 1 }]);
  });

  it("un dépôt valide : le point suit son occurrence", () => {
    renderWithStopPoints([...twoBefore(), anActivity("core", "IN_TOUR", { name: "Pompes" })]);
    layoutTwoBeforeTour();
    dragBy("ex-1", 100);

    expect(
      testIdOrder(screen.toJSON(), ["composition-exercise-row-ex-1", "composition-exercise-row-ex-2"]),
    ).toEqual(["composition-exercise-row-ex-2", "composition-exercise-row-ex-1"]);
    expect(readStopPoints()).toEqual([{ id: "s-1", scope: "BEFORE_TOUR", position: 2 }]);
  });
});

/**
 * PRE-6 story 2.1 — En-tête, bornes de séance et Continuer (matrice de la spec) : durée de
 * séance de l'en-tête (toutes les occurrences, nature du Circuit, sans Compte à rebours ni
 * Fin, RM-159), bouton fermer, « + », bornes et action « Continuer ».
 */
describe("CompositionScreen — PRE-6 story 2.1 (en-tête, bornes, Continuer)", () => {
  function headerDuration() {
    return screen.getByTestId("composition-session-duration").props.children as string;
  }

  it("PRE6-2.1 — séance vide : « 0 min » dans l'en-tête et Continuer désactivé", () => {
    renderScreen();
    expect(headerDuration()).toBe("0 min");
    expect(screen.getByLabelText(composition.saveAction).props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByText("Continuer")).toBeTruthy();
  });

  it("PRE6-2.1 — la durée de séance totalise toutes les occurrences (Circuit × Tours), jamais le Compte à rebours ni la Fin", () => {
    renderScreenWithDraft(
      [
        { ...createExerciseDraft("before"), name: "Échauffement", structuralPosition: "BEFORE_TOUR", executionParameters: durationParameters(60) },
        { ...createExerciseDraft("in"), name: "Gainage", structuralPosition: "IN_TOUR", executionParameters: durationParameters(60) },
        { ...createExerciseDraft("after"), name: "Étirements", structuralPosition: "AFTER_TOUR", executionParameters: durationParameters(60) },
      ],
      { tourRepeatCount: 3, initialCountdownSeconds: 600, finalPhaseSeconds: 600 },
    );
    // 60 + 60 × 3 + 60 = 300 s → « 5 min » ; Compte à rebours et Fin (10 min chacun) exclus.
    expect(headerDuration()).toBe("5 min");
    // Le résumé du Circuit reste limité à la zone IN_TOUR.
    expect(screen.getByTestId("composition-circuit-header-duration").props.children).toBe("3 min");
  });

  it("PRE6-2.1 — une cible À l'échec : « ≥ … » dans l'en-tête", () => {
    renderScreenWithDraft([
      { ...createExerciseDraft("ex-1"), name: "Pompes", executionParameters: allFailureParameters(3, 20) },
    ]);
    expect(headerDuration()).toMatch(/^≥ /u);
  });

  it("PRE6-2.1 — bouton fermer (X) : icône `control-close`, même action que le retour (garde d'abandon existante)", () => {
    renderScreen();
    const close = screen.getByTestId("screen-header-back");
    expect(close.props.accessibilityLabel).toBe("Fermer");
    expect(close.props.accessibilityLabel).toBe(composition.closeAccessibilityLabel);
    const headerIconSource: unknown = screen.getByTestId("screen-header-back-icon").props.source;
    const closeSource: unknown = render(<KodjoIcon name="control-close" testID="reference-close-icon" />).getByTestId(
      "reference-close-icon",
    ).props.source;
    const backSource: unknown = render(<KodjoIcon name="control-back" testID="reference-back-icon" />).getByTestId(
      "reference-back-icon",
    ).props.source;
    expect(headerIconSource).toEqual(closeSource);
    expect(headerIconSource).not.toEqual(backSource);
  });

  it("PRE6-2.1 — Fermer avec un brouillon modifié : la garde de sortie demande la confirmation d'abandon existante", () => {
    renderScreen();
    fireEvent.changeText(screen.getByLabelText(composition.name), "Séance du soir");
    // Le mécanisme réel est couvert par `CompositionNavigationGuard.integration.test.tsx` ;
    // ici, l'écran signale bien un brouillon à protéger et route le X sur `router.back()`.
    expect(mockExitGuard).toHaveBeenLastCalledWith(true, expect.any(Function));
    fireEvent.press(screen.getByTestId("screen-header-back"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("PRE6-2.1 — Continuer reste désactivé pour un nom vide ou une cible manquante, actif pour une Composition valide", () => {
    const valid = { ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) };
    renderScreenWithDraft([valid], { name: "" });
    expect(screen.getByLabelText(composition.saveAction).props.accessibilityState).toMatchObject({ disabled: true });

    renderScreenWithDraft([{ ...valid, executionParameters: durationParameters("UNSET") }]);
    expect(screen.getByLabelText(composition.saveAction).props.accessibilityState).toMatchObject({ disabled: true });

    renderScreenWithDraft([valid]);
    expect(screen.getByLabelText(composition.saveAction).props.accessibilityState).toMatchObject({ disabled: false });
  });

  it("PRE6-2.1 — bornes toujours présentes, défauts 10 s et 5 s, 0 s admis via la roulette existante", () => {
    renderScreenWithDraft([], { initialCountdownSeconds: 0 });
    expect(within(screen.getByLabelText(composition.countdown.label)).getByText("00 min 00 s")).toBeTruthy();
    expect(within(screen.getByLabelText(composition.finalPhase.label)).getByText("00 min 05 s")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(composition.finalPhase.label));
    expect(screen.getByLabelText(composition.finalPhase.label).props.accessibilityState).toMatchObject({ expanded: true });
    expect(screen.getByTestId("duration-wheel-minutes")).toBeTruthy();
  });

  it("PRE6-2.1 — la durée de séance suit la nature du Circuit (Séries : passages, pas Tours × contenu)", () => {
    // Même fixture que le résumé du Circuit (story 1.3) : 3 séries de 60 s, pause 30 s, N = 2.
    // Séries : (60 + 30) × 2 = 180 s → « 3 min » ; en Tours, 540 s → « 9 min ».
    const exercises = [anActivity("ex-1", "IN_TOUR", { name: "Squats", executionParameters: durationParameters(60, 3, 30) })];
    renderScreenWithDraft(exercises, { tourRepeatCount: 2, circuitNature: "SERIES" });
    expect(headerDuration()).toBe("3 min");

    renderScreenWithDraft(exercises, { tourRepeatCount: 2, circuitNature: "TOURS" });
    expect(headerDuration()).toBe("9 min");
  });

  it("PRE6-2.1 — une Récupération positive d'une occurrence du Circuit compte à chaque Tour", () => {
    // 60 s + Récupération 30 s par Tour, 2 Tours : 180 s → « 3 min » (sans Récupération : « 2 min »).
    renderScreenWithDraft(
      [anActivity("ex-1", "IN_TOUR", { name: "Gainage", executionParameters: durationParameters(60), postActivityRecoverySeconds: 30 })],
      { tourRepeatCount: 2 },
    );
    expect(headerDuration()).toBe("3 min");

    renderScreenWithDraft(
      [anActivity("ex-1", "IN_TOUR", { name: "Gainage", executionParameters: durationParameters(60), postActivityRecoverySeconds: 0 })],
      { tourRepeatCount: 2 },
    );
    expect(headerDuration()).toBe("2 min");
  });

  it("PRE6-2.1 — la ligne de récupération suit la carte : même translateX au balayage, même translateY au déplacement ; le repère ne suit que le déplacement", () => {
    renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: 20 })]);
    const hidden = { includeHiddenElements: true };
    const transformOf = (testID: string) =>
      StyleSheet.flatten(screen.getByTestId(testID, hidden).props.style).transform as Record<string, number>[];
    const cardTransform = () => transformOf("composition-exercise-row-ex-1");
    const lineTransform = () => transformOf("composition-activity-recovery-slot-ex-1");

    fireSwipeLeft("ex-1");
    expect(cardTransform()[0]!.translateX).toBeLessThan(0);
    expect(lineTransform()).toEqual(cardTransform());
    expect(transformOf("composition-sequence-marker-ex-1")).toEqual([{ translateY: 0 }]);
    fireSwipeRight("ex-1");

    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 200, pageY: 150 } });

    expect(cardTransform()[1]!.translateY).toBe(50);
    expect(lineTransform()).toEqual(cardTransform());
    expect(transformOf("composition-sequence-marker-ex-1")).toEqual([{ translateY: 50 }]);
  });

  it("PRE6-2.1 — le repère d'une occurrence est rendu avant les actions glissées et la carte", () => {
    renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage" })]);
    fireSwipeLeft("ex-1");
    const children = (screen.getByTestId("composition-activity-ex-1").children as { props: { testID?: string } }[]).map(
      (child) => child.props.testID,
    );
    expect(children.indexOf("composition-sequence-marker-ex-1")).toBe(0);
    expect(children.indexOf("composition-activity-actions-ex-1")).toBeGreaterThan(0);
    expect(children.indexOf("composition-exercise-row-ex-1")).toBeGreaterThan(
      children.indexOf("composition-activity-actions-ex-1"),
    );
  });

  it("PRE6-2.1 — toute la rangée d'une borne ouvre la roulette, y compris un toucher sur le libellé", () => {
    renderScreen();
    fireEvent.press(within(screen.getByTestId("composition-boundary-countdown")).getByText(composition.countdown.label));
    expect(screen.getByLabelText(composition.countdown.label).props.accessibilityState).toMatchObject({ expanded: true });
    expect(screen.getByTestId("duration-wheel-minutes")).toBeTruthy();
  });

  it("PRE6-2.1 — la puce Étiquette ouvre LabelPickerModal ; avec une Étiquette, elle montre la pastille et le nom", async () => {
    renderScreenWithDraft([], { labelId: null });
    fireEvent.press(screen.getByLabelText(composition.label.accessibilityLabel));
    expect(await screen.findByTestId("label-picker-tag-label-sport")).toBeTruthy();

    renderScreenWithDraft([], { labelId: "label-sport" });
    await waitFor(() => {
      const chip = screen.getByLabelText(composition.label.accessibilityLabel);
      expect(within(chip).getByTestId("composition-session-color-swatch")).toBeTruthy();
      expect(within(chip).getByTestId("composition-session-label-name").props.children).toBe("Sport");
      expect(within(chip).queryByTestId("composition-session-label-outline-icon")).toBeNull();
    });
  });

  it("PRE6-2.1 — la ligne de récupération a pour nom accessible son seul libellé visible", () => {
    renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: 20 })]);
    expect(screen.getByTestId("composition-activity-recovery-ex-1").props.accessibilityLabel).toBe("Récupération 20 s");
  });

  it("PRE6-2.1 — repère point pour une occurrence hors Circuit, aucun pour une occurrence du Circuit", () => {
    renderScreenWithDraft([
      { ...createExerciseDraft("out"), name: "Échauffement", structuralPosition: "BEFORE_TOUR", executionParameters: durationParameters(60) },
      { ...createExerciseDraft("in"), name: "Gainage", structuralPosition: "IN_TOUR", executionParameters: durationParameters(60) },
    ]);
    const hidden = { includeHiddenElements: true };
    expect(StyleSheet.flatten(screen.getByTestId("composition-sequence-marker-out", hidden).props.style)).toMatchObject({
      width: 14,
      height: 14,
      borderWidth: 3,
      borderColor: colors.background,
      backgroundColor: colors.disabled,
    });
    expect(screen.queryByTestId("composition-sequence-marker-in", hidden)).toBeNull();
  });
});

/**
 * PRE-6 (story 2.3) : organisation des occurrences et Circuit de Séries — entrée adaptée à N
 * avec confirmation de perte, sortie sans message, actions accessibles (CE-T03-08 §18).
 */
describe("CompositionScreen — organisation des occurrences et Circuit (PRE-6, story 2.3)", () => {
  type Draft = SessionDraftContextValue["draft"];
  const probe: { draft: Draft | null; updateDraft: SessionDraftContextValue["updateDraft"] | null } = {
    draft: null,
    updateDraft: null,
  };
  const recordDraft = (value: SessionDraftContextValue | null) => {
    probe.draft = value?.draft ?? null;
    probe.updateDraft = value?.updateDraft ?? null;
  };
  /** Relève le brouillon courant (et `updateDraft`) après chaque rendu. */
  function DraftProbe() {
    const value = useContext(SessionDraftContext);
    useEffect(() => recordDraft(value), [value]);
    return null;
  }
  const reserveRow = { target: { kind: "NUMBER" as const, value: 30 }, pauseSeconds: 0, loadKg: 0 };
  function renderWithProbe(exercises: readonly SessionDraftExercise[], overrides?: Partial<Draft>) {
    return render(
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService()}>
          <ReferentialServiceContext.Provider value={fakeReferentialService()}>
            <StatefulDraftWrapper initialExercises={exercises} draftOverrides={overrides}>
              <CompositionScreen />
              <DraftProbe />
            </StatefulDraftWrapper>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
  }
  const exerciseOf = (id: string) => probe.draft!.exercises.find((exercise) => exercise.id === id)!;
  const seriesCountOfDraft = (id: string) => {
    const series = exerciseOf(id).executionParameters.series;
    return series.kind === "UNIFORM" ? series.count : series.rows.length;
  };
  const a11yAction = (id: string, actionName: string) =>
    fireEvent(screen.getByTestId(`composition-exercise-row-${id}`), "accessibilityAction", {
      nativeEvent: { actionName },
    });
  const actionNames = (id: string) =>
    (screen.getByTestId(`composition-exercise-row-${id}`).props.accessibilityActions as { name: string }[]).map(
      (action) => action.name,
    );
  const t = composition.circuitEntryConfirmModal;

  /** Glisser `ex-1` (avant le Circuit) dans le Circuit : même géométrie que les tests T02-S01. */
  function dragIntoCircuit() {
    fireLayout(screen.getByTestId("composition-zone-before-tour"), 70, 150);
    fireLayout(screen.getByTestId("composition-activity-ex-1"), 0, 70);
    fireLayout(screen.getByTestId("composition-tour-section"), 230, 170);
    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 200, pageY: 300 } });
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 200, pageY: 300 } });
  }

  const seriesDraft = (count: number): Partial<Draft> => ({ circuitNature: "SERIES", tourRepeatCount: count });

  it("glisser vers un Circuit de Séries avec perte : dialogue ; Annuler restitue la position", () => {
    renderWithProbe([anActivity("ex-1", "BEFORE_TOUR", { executionParameters: durationParameters(30, 3) })], seriesDraft(2));
    dragIntoCircuit();

    expect(screen.getByText(t.moveTitle)).toBeTruthy();
    expect(
      screen.getByText(
        "L’exercice déplacé aura 2 séries. Les séries au-delà de la 2e seront supprimées, avec les valeurs qu’elles portent.",
      ),
    ).toBeTruthy();
    // Aucune mutation avant confirmation.
    expect(exerciseOf("ex-1").structuralPosition).toBe("BEFORE_TOUR");

    fireEvent.press(screen.getByLabelText(t.cancel));
    expect(screen.queryByTestId("circuit-entry-confirm-card")).toBeNull();
    expect(exerciseOf("ex-1").structuralPosition).toBe("BEFORE_TOUR");
    expect(seriesCountOfDraft("ex-1")).toBe(3);
  });

  it("glisser vers un Circuit de Séries avec perte : Confirmer déplace et adapte à N", () => {
    renderWithProbe([anActivity("ex-1", "BEFORE_TOUR", { executionParameters: durationParameters(30, 3) })], seriesDraft(2));
    dragIntoCircuit();
    fireEvent.press(screen.getByLabelText(t.confirm));

    expect(screen.queryByTestId("circuit-entry-confirm-card")).toBeNull();
    expect(exerciseOf("ex-1").structuralPosition).toBe("IN_TOUR");
    expect(seriesCountOfDraft("ex-1")).toBe(2);
  });

  it("entrée en Séries sans perte : adaptée à N, sans dialogue", () => {
    renderWithProbe([anActivity("ex-1", "BEFORE_TOUR", { executionParameters: durationParameters(30, 3) })], seriesDraft(4));
    dragIntoCircuit();

    expect(screen.queryByTestId("circuit-entry-confirm-card")).toBeNull();
    expect(exerciseOf("ex-1").structuralPosition).toBe("IN_TOUR");
    expect(seriesCountOfDraft("ex-1")).toBe(4);
  });

  it("Circuit de Tours : déplacement inchangé, paramètres conservés, sans dialogue", () => {
    renderWithProbe([anActivity("ex-1", "BEFORE_TOUR", { executionParameters: durationParameters(30, 3) })], {
      tourRepeatCount: 2,
    });
    dragIntoCircuit();

    expect(screen.queryByTestId("circuit-entry-confirm-card")).toBeNull();
    expect(exerciseOf("ex-1").structuralPosition).toBe("IN_TOUR");
    expect(seriesCountOfDraft("ex-1")).toBe(3);
  });

  it("sortie du Circuit : nombre et paramètres conservés, réserve retirée, sans message", () => {
    const inside = anActivity("ex-1", "IN_TOUR", { executionParameters: durationParameters(30, 2) });
    renderWithProbe([inside], {
      ...seriesDraft(2),
      circuitSeriesReserve: { "ex-1": [{ target: { kind: "NUMBER", value: 30 }, pauseSeconds: 0, loadKg: 0 }] },
    });
    a11yAction("ex-1", "moveDown");

    expect(screen.queryByTestId("circuit-entry-confirm-card")).toBeNull();
    expect(exerciseOf("ex-1").structuralPosition).toBe("AFTER_TOUR");
    expect(exerciseOf("ex-1").executionParameters).toEqual(inside.executionParameters);
    expect(probe.draft!.circuitSeriesReserve).toBeUndefined();
  });

  it("actions accessibles : Monter / Descendre absentes aux extrémités, Dupliquer et Supprimer toujours présentes", () => {
    renderWithProbe([anActivity("ex-1", "BEFORE_TOUR"), anActivity("ex-2", "AFTER_TOUR")]);

    expect(actionNames("ex-1")).toEqual(["moveDown", "duplicate", "delete"]);
    expect(actionNames("ex-2")).toEqual(["moveUp", "duplicate", "delete"]);
    const labels = screen.getByTestId("composition-exercise-row-ex-1").props.accessibilityActions as {
      label: string;
    }[];
    expect(labels.map((action) => action.label)).toEqual([
      composition.activityActions.moveDown,
      composition.activityActions.duplicate,
      composition.activityActions.delete,
    ]);
    // Le balayage existant est conservé.
    fireSwipeLeft("ex-1");
    expect(screen.getByTestId("composition-activity-actions-ex-1")).toBeTruthy();
  });

  it("« Descendre » sur la dernière carte avant le Circuit : entre dans le Circuit (règles du glisser, confirmation comprise)", () => {
    renderWithProbe(
      [
        anActivity("ex-1", "BEFORE_TOUR", { executionParameters: durationParameters(30, 3) }),
        anActivity("ex-2", "IN_TOUR", { executionParameters: durationParameters(30, 2) }),
      ],
      seriesDraft(2),
    );
    a11yAction("ex-1", "moveDown");
    expect(screen.getByText(t.moveTitle)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(t.confirm));

    expect(probe.draft!.exercises.map((exercise) => [exercise.id, exercise.structuralPosition])).toEqual([
      ["ex-1", "IN_TOUR"],
      ["ex-2", "IN_TOUR"],
    ]);
    expect(seriesCountOfDraft("ex-1")).toBe(2);
  });

  it("« Monter » en tête du Circuit : rejoint la fin de la portée précédente", () => {
    renderWithProbe([anActivity("ex-1", "BEFORE_TOUR"), anActivity("ex-2", "IN_TOUR")]);
    a11yAction("ex-2", "moveUp");

    expect(probe.draft!.exercises.map((exercise) => [exercise.id, exercise.structuralPosition])).toEqual([
      ["ex-1", "BEFORE_TOUR"],
      ["ex-2", "BEFORE_TOUR"],
    ]);
  });

  it("actions accessibles Dupliquer / Supprimer : mêmes opérations que le balayage", () => {
    renderWithProbe([anActivity("ex-1", "BEFORE_TOUR", { name: "Squat" })]);
    a11yAction("ex-1", "duplicate");
    expect(screen.getByText("Squat (copie)")).toBeTruthy();
    a11yAction("ex-1", "duplicate");
    expect(probe.draft!.exercises.map((exercise) => exercise.name)).toEqual(["Squat", "Squat (copie 2)", "Squat (copie)"]);
  });

  it("Supprimer une occurrence portant un point d'arrêt : le point part avec elle", () => {
    renderWithProbe([anActivity("ex-1", "BEFORE_TOUR"), anActivity("ex-2", "BEFORE_TOUR")], {
      stopPoints: [{ id: "p1", scope: "BEFORE_TOUR", position: 1 }],
    });
    a11yAction("ex-1", "delete");

    expect(probe.draft!.exercises.map((exercise) => exercise.id)).toEqual(["ex-2"]);
    expect(probe.draft!.stopPoints).toEqual([]);
  });

  it("dépôt amenant un point d'arrêt sur un emplacement interdit (dernière position) : action non offerte, position restituée", () => {
    renderWithProbe([anActivity("ex-1", "AFTER_TOUR"), anActivity("ex-2", "AFTER_TOUR")], {
      stopPoints: [{ id: "p1", scope: "AFTER_TOUR", position: 1 }],
    });
    // « Descendre » amènerait le point juste avant la Fin : refusé, donc non offert.
    expect(actionNames("ex-1")).toEqual(["moveUp", "duplicate", "delete"]);
    a11yAction("ex-1", "moveDown");

    expect(probe.draft!.exercises.map((exercise) => exercise.id)).toEqual(["ex-1", "ex-2"]);
    expect(probe.draft!.stopPoints).toEqual([{ id: "p1", scope: "AFTER_TOUR", position: 1 }]);
  });

  it("une action accessible de déplacement referme les actions glissées révélées", () => {
    renderWithProbe([anActivity("ex-1", "BEFORE_TOUR"), anActivity("ex-2", "BEFORE_TOUR")]);
    fireSwipeLeft("ex-1");
    expect(screen.getByTestId("composition-activity-actions-ex-1")).toBeTruthy();
    a11yAction("ex-1", "moveDown");

    expect(screen.queryByTestId("composition-activity-actions-ex-1")).toBeNull();
    expect(probe.draft!.exercises.map((exercise) => exercise.id)).toEqual(["ex-2", "ex-1"]);
  });

  it("Confirmer rejoue le déplacement sur le brouillon courant : une modification faite pendant le dialogue est conservée", () => {
    renderWithProbe([anActivity("ex-1", "BEFORE_TOUR", { executionParameters: durationParameters(30, 3) })], seriesDraft(2));
    dragIntoCircuit();
    expect(screen.getByText(t.moveTitle)).toBeTruthy();

    act(() => {
      probe.updateDraft!({
        name: "Renommée",
        exercises: [...probe.draft!.exercises, anActivity("ex-new", "AFTER_TOUR")],
      });
    });
    fireEvent.press(screen.getByLabelText(t.confirm));

    expect(probe.draft!.name).toBe("Renommée");
    expect(probe.draft!.exercises.map((exercise) => [exercise.id, exercise.structuralPosition])).toEqual([
      ["ex-1", "IN_TOUR"],
      ["ex-new", "AFTER_TOUR"],
    ]);
    expect(seriesCountOfDraft("ex-1")).toBe(2);
  });

  it("Supprimer une occurrence du Circuit de Séries porteuse d'une réserve : sa réserve est retirée", () => {
    renderWithProbe(
      [
        anActivity("ex-1", "IN_TOUR", { executionParameters: durationParameters(30, 2) }),
        anActivity("ex-2", "IN_TOUR", { executionParameters: durationParameters(30, 2) }),
      ],
      { ...seriesDraft(2), circuitSeriesReserve: { "ex-1": [reserveRow], "ex-2": [reserveRow] } },
    );
    fireSwipeLeft("ex-1");
    fireEvent.press(screen.getByTestId("composition-activity-delete-ex-1"));

    expect(probe.draft!.exercises.map((exercise) => exercise.id)).toEqual(["ex-2"]);
    expect(probe.draft!.circuitSeriesReserve).toEqual({ "ex-2": [reserveRow] });

    a11yAction("ex-2", "delete");
    expect(probe.draft!.circuitSeriesReserve).toBeUndefined();
  });

  it("Dupliquer dans un Circuit de Séries : la copie reçoit une copie de la réserve de sa source", () => {
    renderWithProbe([anActivity("ex-1", "IN_TOUR", { executionParameters: durationParameters(30, 2) })], {
      ...seriesDraft(2),
      circuitSeriesReserve: { "ex-1": [reserveRow] },
    });
    a11yAction("ex-1", "duplicate");

    const reserve = probe.draft!.circuitSeriesReserve!;
    expect(reserve).toEqual({ "ex-1": [reserveRow], "generated-copy-id": [reserveRow] });
    expect(reserve["generated-copy-id"]![0]).not.toBe(reserve["ex-1"]![0]);
  });
  /** PRE-6 (story 3.1) : compteur du Circuit et brouillon — `setCircuitCount` appliqué tel quel. */
  describe("compteur du Circuit et brouillon (PRE-6, story 3.1)", () => {
    const rowsOfDraft = (id: string) => {
      const series = exerciseOf(id).executionParameters.series;
      return series.kind === "VARIABLE" ? series.rows : [];
    };
    const step = (direction: "increment" | "decrement") => {
      const button = screen.getByTestId(`composition-circuit-header-counter-stepper-${direction}`);
      fireEvent(button, "pressIn");
      fireEvent(button, "pressOut");
    };
    const row = (value: number) => ({ target: { kind: "NUMBER" as const, value }, pauseSeconds: 0, loadKg: 0 });

    it("Séries 4 → 3 → 4 : la ligne 4 passe en réserve, puis les 4 lignes d'origine reviennent et la réserve disparaît", () => {
      renderWithProbe(
        [anActivity("ex-1", "IN_TOUR", { executionParameters: variableParameters({ rows: [[10, 0], [20, 0], [30, 0], [40, 0]] }) })],
        seriesDraft(4),
      );
      fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press"));

      step("decrement");
      expect(probe.draft!.tourRepeatCount).toBe(3);
      expect(rowsOfDraft("ex-1")).toEqual([row(10), row(20), row(30)]);
      expect(probe.draft!.circuitSeriesReserve).toEqual({ "ex-1": [row(40)] });

      step("increment");
      expect(probe.draft!.tourRepeatCount).toBe(4);
      expect(rowsOfDraft("ex-1")).toEqual([row(10), row(20), row(30), row(40)]);
      expect(probe.draft!.circuitSeriesReserve).toBeUndefined();
    });

    it("Séries 1 → 2 : un exercice d'une ligne reçoit une copie de sa dernière ligne", () => {
      renderWithProbe(
        [anActivity("ex-1", "IN_TOUR", { executionParameters: variableParameters({ rows: [[25, 0]] }) })],
        seriesDraft(1),
      );
      fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press"));

      step("increment");
      expect(probe.draft!.tourRepeatCount).toBe(2);
      expect(rowsOfDraft("ex-1")).toEqual([row(25), row(25)]);
      expect(probe.draft!.circuitSeriesReserve).toBeUndefined();
    });
  });

  /**
   * PRE-6 (story 3.2, CE-CIR-01, CE-CIR-02) : choix de nature depuis la pastille d'unité (menu
   * natif sur iOS, événement `buttonPress` de ses `Button` SwiftUI ; panneau ancré ailleurs),
   * conversion par `prepareNatureChange` / `applyNatureChange` et dialogue de perte.
   */
  describe("choix de nature et confirmation de perte (PRE-6, story 3.2)", () => {
    const NATURE = "composition-circuit-header-counter-nature";
    const anyNode = { includeHiddenElements: true } as const;
    const toursDraft = (count: number): Partial<Draft> => ({ circuitNature: "TOURS", tourRepeatCount: count });
    const chooseNature = (nature: "TOURS" | "SERIES") =>
      act(() => {
        fireEvent(screen.getByTestId(`${NATURE}-${nature}`, anyNode), "buttonPress");
      });
    const rowsOf = (values: readonly number[]) => values.map((value) => [value, 0] as const);
    const row = (value: number) => ({ target: { kind: "NUMBER" as const, value }, pauseSeconds: 0, loadKg: 0 });
    const rowsOfDraft = (id: string) => {
      const series = exerciseOf(id).executionParameters.series;
      return series.kind === "VARIABLE" ? series.rows : [];
    };
    const unitText = () => screen.getByTestId("composition-circuit-header-counter-unit-text", { includeHiddenElements: true }).props.children;

    it("Tours → Séries sous N : l'exercice suit N, sans dialogue ; le nombre affiché ne change pas", () => {
      renderWithProbe([anActivity("ex-1", "IN_TOUR", { executionParameters: durationParameters(30, 3) })], toursDraft(4));
      expect(unitText()).toBe("tours");

      chooseNature("SERIES");

      expect(screen.queryByTestId("circuit-nature-confirm-card")).toBeNull();
      expect(probe.draft!.circuitNature).toBe("SERIES");
      expect(probe.draft!.tourRepeatCount).toBe(4);
      expect(seriesCountOfDraft("ex-1")).toBe(4);
      expect(screen.getByTestId("composition-circuit-header-counter-value").props.children).toBe(4);
      expect(unitText()).toBe("séries");
    });

    it("Tours → Séries à N : séries inchangées, nature Séries, sans dialogue", () => {
      renderWithProbe([anActivity("ex-1", "IN_TOUR", { executionParameters: durationParameters(30, 3) })], toursDraft(3));
      chooseNature("SERIES");

      expect(screen.queryByTestId("circuit-nature-confirm-card")).toBeNull();
      expect(probe.draft!.circuitNature).toBe("SERIES");
      expect(seriesCountOfDraft("ex-1")).toBe(3);
    });

    it("Tours → Séries au-delà de N : dialogue ; Annuler ne change rien ; Confirmer tronque à N", () => {
      renderWithProbe(
        [anActivity("ex-1", "IN_TOUR", { executionParameters: variableParameters({ rows: rowsOf([10, 20, 30]) }) })],
        toursDraft(2),
      );
      const before = probe.draft;
      const duration = () => screen.getByTestId("composition-circuit-header-duration").props.children;
      const sessionDuration = () => screen.getByTestId("composition-session-duration").props.children;
      const toursDuration = duration();
      const toursSessionDuration = sessionDuration();
      chooseNature("SERIES");

      expect(screen.getByText(t.natureTitle)).toBeTruthy();
      expect(
        screen.getByText(
          "Tous les exercices auront 2 séries. Les séries au-delà de la 2e seront supprimées, avec les valeurs qu’elles portent.",
        ),
      ).toBeTruthy();
      expect(probe.draft).toBe(before);

      fireEvent.press(screen.getByLabelText(t.cancel));
      expect(screen.queryByTestId("circuit-nature-confirm-card")).toBeNull();
      expect(probe.draft).toBe(before);
      expect(probe.draft!.circuitNature).toBe("TOURS");

      chooseNature("SERIES");
      fireEvent.press(screen.getByLabelText(t.confirm));
      expect(screen.queryByTestId("circuit-nature-confirm-card")).toBeNull();
      expect(probe.draft!.circuitNature).toBe("SERIES");
      expect(probe.draft!.tourRepeatCount).toBe(2);
      expect(rowsOfDraft("ex-1")).toEqual([row(10), row(20)]);
      // Conversion confirmée : aucune réserve (troncature définitive).
      expect(probe.draft!.circuitSeriesReserve).toBeUndefined();
      // Durée du Circuit, durée de séance et unité suivent la nature.
      expect(unitText()).toBe("séries");
      expect(duration()).not.toBe(toursDuration);
      expect(sessionDuration()).not.toBe(toursSessionDuration);
    });

    it("N = 1 : message accordé au singulier (« 1 série », « 1re »)", () => {
      renderWithProbe([anActivity("ex-1", "IN_TOUR", { executionParameters: durationParameters(30, 2) })], toursDraft(1));
      chooseNature("SERIES");
      expect(
        screen.getByText(
          "Tous les exercices auront 1 série. Les séries au-delà de la 1re seront supprimées, avec les valeurs qu’elles portent.",
        ),
      ).toBeTruthy();
    });

    it("Séries → Tours : sans message, comptes et valeurs conservés", () => {
      renderWithProbe(
        [anActivity("ex-1", "IN_TOUR", { executionParameters: variableParameters({ rows: rowsOf([10, 20, 30]) }) })],
        seriesDraft(3),
      );
      const exercises = probe.draft!.exercises;
      chooseNature("TOURS");

      expect(screen.queryByTestId("circuit-nature-confirm-card")).toBeNull();
      expect(probe.draft!.circuitNature).toBe("TOURS");
      expect(probe.draft!.tourRepeatCount).toBe(3);
      expect(probe.draft!.exercises).toBe(exercises);
      expect(unitText()).toBe("tours");
    });

    it("même nature : rien", () => {
      renderWithProbe([anActivity("ex-1", "IN_TOUR")], toursDraft(2));
      const before = probe.draft;
      chooseNature("TOURS");
      expect(probe.draft).toBe(before);
      expect(screen.queryByTestId("circuit-nature-confirm-card")).toBeNull();
    });

    it("double appui sur Confirmer : une seule conversion", () => {
      renderWithProbe(
        [anActivity("ex-1", "IN_TOUR", { executionParameters: variableParameters({ rows: rowsOf([10, 20, 30]) }) })],
        toursDraft(2),
      );
      chooseNature("SERIES");
      const spy = jest.spyOn(circuitModule, "applyNatureChange");
      try {
        const confirm = screen.getByLabelText(t.confirm);
        act(() => {
          fireEvent.press(confirm);
          fireEvent.press(confirm);
        });
        expect(spy).toHaveBeenCalledTimes(1);
      } finally {
        spy.mockRestore();
      }
      expect(rowsOfDraft("ex-1")).toEqual([row(10), row(20)]);
      expect(probe.draft!.circuitNature).toBe("SERIES");
    });

    it("brouillon modifié pendant le dialogue : la perte est recalculée sur l'état courant", () => {
      renderWithProbe(
        [anActivity("ex-1", "IN_TOUR", { executionParameters: variableParameters({ rows: rowsOf([10, 20, 30]) }) })],
        toursDraft(2),
      );
      chooseNature("SERIES");
      // N passe à 3 pendant le dialogue : plus aucune série au-delà de N.
      act(() => probe.updateDraft!({ tourRepeatCount: 3 }));
      fireEvent.press(screen.getByLabelText(t.confirm));

      expect(probe.draft!.circuitNature).toBe("SERIES");
      expect(probe.draft!.tourRepeatCount).toBe(3);
      expect(rowsOfDraft("ex-1")).toEqual([row(10), row(20), row(30)]);
    });

    describe("iOS : menu natif", () => {
      let platformBefore: typeof Platform.OS;
      beforeEach(() => {
        platformBefore = Platform.OS;
        Platform.OS = "ios";
      });
      afterEach(() => {
        Platform.OS = platformBefore;
      });

      it("deux options, la nature courante cochée ; chiffre et pastille distincts", () => {
        renderWithProbe([anActivity("ex-1", "IN_TOUR")], seriesDraft(3));
        expect(screen.getByTestId("composition-circuit-header-counter").props.accessibilityLabel).toBe("Nombre de séries");
        const items = [screen.getByTestId(`${NATURE}-TOURS`, anyNode), screen.getByTestId(`${NATURE}-SERIES`, anyNode)];
        expect(items.map((item) => [item.props.label, item.props.systemImage ?? null])).toEqual([
          ["Circuit de tours", null],
          ["Circuit de séries", "checkmark"],
        ]);
      });

      it("le dialogue de perte refermé (Annuler ou Confirmer) rend le focus à la pastille ; son ouverture, non", () => {
        const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
        const focusTargets = () =>
          focus.mock.calls.map(([target, event]) => [(target as unknown as { props: { testID?: string } }).props.testID, event]);
        try {
          renderWithProbe(
            [anActivity("ex-1", "IN_TOUR", { executionParameters: variableParameters({ rows: rowsOf([10, 20, 30]) }) })],
            toursDraft(2),
          );
          focus.mockClear();
          chooseNature("SERIES");
          expect(focusTargets()).toEqual([]);
          fireEvent.press(screen.getByLabelText(t.cancel));
          expect(focusTargets()).toEqual([[`${NATURE}-focus`, "focus"]]);

          focus.mockClear();
          chooseNature("SERIES");
          fireEvent.press(screen.getByLabelText(t.confirm));
          expect(focusTargets()).toEqual([[`${NATURE}-focus`, "focus"]]);
        } finally {
          focus.mockRestore();
        }
      });

      it("une sortie (abandon) pendant le dialogue de perte le referme sans rien appliquer", () => {
        renderWithProbe(
          [anActivity("ex-1", "IN_TOUR", { executionParameters: variableParameters({ rows: rowsOf([10, 20, 30]) }) })],
          toursDraft(2),
        );
        chooseNature("SERIES");
        expect(screen.getByTestId("circuit-nature-confirm-card")).toBeTruthy();
        mockExitGuard.mockReturnValue({ ...defaultExitGuardResult(), isPendingExit: true });
        act(() => probe.updateDraft!({ name: "Séance modifiée" }));
        expect(screen.queryByTestId("circuit-nature-confirm-card")).toBeNull();
        expect(probe.draft!.circuitNature).toBe("TOURS");
        expect(rowsOfDraft("ex-1")).toEqual([row(10), row(20), row(30)]);
      });
    });

    describe("Android : panneau ancré", () => {
      let platformBefore: typeof Platform.OS;
      beforeEach(() => {
        platformBefore = Platform.OS;
        Platform.OS = "android";
      });
      afterEach(() => {
        Platform.OS = platformBefore;
      });
      const PANEL = `${NATURE}-panel`;
      /** Mesures injectées : le panneau n'est jamais rendu avant celle de l'en-tête. */
      const measureHeader = () => {
        fireLayout(screen.getByTestId("composition-tour-section"), 230, 170);
        fireLayout(screen.getByTestId("composition-circuit-header"), 12, 44);
      };

      it("révéler le compteur referme le choix et inversement ; toucher ailleurs ferme sans rien changer ; une option s'applique", () => {
        renderWithProbe([anActivity("ex-1", "IN_TOUR", { executionParameters: durationParameters(30, 2) })], toursDraft(3));
        const before = probe.draft;

        // Avant la mesure de l'en-tête : aucun panneau.
        fireEvent.press(screen.getByTestId(NATURE));
        expect(screen.queryByTestId(PANEL, anyNode)).toBeNull();
        fireEvent.press(screen.getByTestId("composition-circuit-counter-outside"));

        measureHeader();
        fireEvent.press(screen.getByTestId(NATURE));
        const panel = screen.getByTestId(PANEL);
        // Hébergé par le contenu défilant, sous l'en-tête, aligné sur le bord droit du contenu.
        expect(StyleSheet.flatten(panel.props.style)).toMatchObject({ top: 230 + 12 + 44 + spacing[4], right: spacing[24] });

        // Révéler le compteur referme le choix (un seul contrôle actif).
        fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press", anyNode));
        expect(screen.queryByTestId(PANEL)).toBeNull();
        expect(screen.getByTestId("composition-circuit-header-counter-stepper")).toBeTruthy();
        fireEvent.press(screen.getByTestId("composition-circuit-header-counter-stepper-value-press"));
        expect(screen.queryByTestId("composition-circuit-header-counter-stepper")).toBeNull();

        // Toucher ailleurs (corps, puis conteneur Circuit, puis hors du panneau) : sans mutation.
        fireEvent.press(screen.getByTestId(NATURE));
        fireEvent.press(screen.getByTestId("composition-circuit-counter-outside", anyNode));
        expect(screen.queryByTestId(PANEL)).toBeNull();
        fireEvent.press(screen.getByTestId(NATURE));
        fireEvent.press(screen.getByTestId("composition-circuit-counter-outside-section", anyNode));
        expect(screen.queryByTestId(PANEL)).toBeNull();
        fireEvent.press(screen.getByTestId(NATURE));
        fireEvent.press(screen.getByTestId(`${PANEL}-outside`, anyNode));
        expect(screen.queryByTestId(PANEL)).toBeNull();
        expect(probe.draft).toBe(before);

        fireEvent.press(screen.getByTestId(NATURE));
        fireEvent.press(screen.getByTestId(`${PANEL}-SERIES`));
        expect(screen.queryByTestId(PANEL)).toBeNull();
        expect(probe.draft!.circuitNature).toBe("SERIES");
        expect(seriesCountOfDraft("ex-1")).toBe(3);
      });

      it("focus rendu à la pastille sur une fermeture par l'utilisateur, jamais quand une sortie referme le choix", () => {
        const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
        const focusTargets = () =>
          focus.mock.calls.map(([target, event]) => [(target as unknown as { props: { testID?: string } }).props.testID, event]);
        try {
          renderWithProbe([anActivity("ex-1", "IN_TOUR")], toursDraft(3));
          measureHeader();
          focus.mockClear();

          fireEvent.press(screen.getByTestId(NATURE));
          fireEvent.press(screen.getByTestId("composition-circuit-counter-outside-section", anyNode));
          expect(focusTargets()).toEqual([[NATURE, "focus"]]);

          // Sortie (abandon) pendant l'ouverture : panneau refermé, brouillon intact, aucun focus.
          focus.mockClear();
          fireEvent.press(screen.getByTestId(NATURE));
          const before = probe.draft;
          mockExitGuard.mockReturnValue({ ...defaultExitGuardResult(), isPendingExit: true });
          act(() => probe.updateDraft!({}));
          expect(screen.queryByTestId(PANEL, anyNode)).toBeNull();
          expect(probe.draft!.circuitNature).toBe(before!.circuitNature);
          expect(probe.draft!.exercises).toBe(before!.exercises);
          expect(focusTargets()).toEqual([]);
        } finally {
          focus.mockRestore();
        }
      });
    });
  });
});

describe("CompositionScreen — modales « Volumes du circuit » (PRE-6 story 3.4, CE-CIR-03)", () => {
  type Draft = SessionDraftContextValue["draft"];
  const anyNode = { includeHiddenElements: true } as const;
  const probe: { draft: Draft | null } = { draft: null };
  function DraftProbe() {
    const value = useContext(SessionDraftContext);
    useEffect(() => {
      probe.draft = value?.draft ?? null;
    }, [value]);
    return null;
  }
  function renderWithProbe(exercises: readonly SessionDraftExercise[], overrides?: Partial<Draft>) {
    return render(
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService()}>
          <ReferentialServiceContext.Provider value={fakeReferentialService()}>
            <StatefulDraftWrapper initialExercises={exercises} draftOverrides={overrides}>
              <CompositionScreen />
              <DraftProbe />
            </StatefulDraftWrapper>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
  }
  const EYE = "composition-circuit-header-volumes";
  const SHEET = "composition-circuit-volumes-sheet";
  const circuitExercises = () => [
    anActivity("before", "BEFORE_TOUR", { name: "Échauffement", executionParameters: repetitionParameters(20, 6) }),
    anActivity("a", "IN_TOUR", { name: "Squat assisté", executionParameters: repetitionParameters(10, 2) }),
    anActivity("b", "IN_TOUR", { name: "Extension du genou", executionParameters: durationParameters(45, 4) }),
  ];

  it("the eye sits in the Circuit header, in both natures and with an empty Circuit", () => {
    renderWithProbe([]);
    const header = screen.getByTestId("composition-circuit-header");
    expect(within(header).getByLabelText("Voir les volumes du circuit")).toBeTruthy();
    screen.unmount();
    renderWithProbe(circuitExercises(), { circuitNature: "SERIES", tourRepeatCount: 4 });
    expect(screen.getByTestId(EYE)).toBeTruthy();
  });

  it("opening the sheet closes the revealed counter (one active control) and shows the Domain grid, occurrences outside the Circuit excluded", () => {
    renderWithProbe(circuitExercises());
    fireEvent.press(screen.getByTestId("composition-circuit-header-counter-value-press"));
    expect(screen.getByTestId("composition-circuit-header-counter-field")).toBeTruthy();

    fireEvent.press(screen.getByTestId(EYE));
    expect(screen.getByTestId(SHEET)).toBeTruthy();
    expect(screen.queryByTestId("composition-circuit-header-counter-field")).toBeNull();
    expect(screen.queryByTestId("composition-circuit-counter-outside", anyNode)).toBeNull();

    const sheet = screen.getByTestId(SHEET);
    expect(within(sheet).getByLabelText(
      "Squat assisté, série 1 : 10 répétitions, série 2 : 10 répétitions, série 3 : pas de série, série 4 : pas de série",
    )).toBeTruthy();
    expect(within(sheet).getByLabelText(
      "Extension du genou, série 1 : 45 s, série 2 : 45 s, série 3 : 45 s, série 4 : 45 s",
    )).toBeTruthy();
    expect(within(sheet).queryByText("Échauffement", anyNode)).toBeNull();
    expect(screen.getByTestId("composition-circuit-volumes-cell-b-1", anyNode).props.children).toBe("0:45");
  });

  it("Series nature (N = 3): same grid, from each exercise's own series", () => {
    renderWithProbe(
      [
        anActivity("a", "IN_TOUR", { name: "Squat assisté", executionParameters: repetitionParameters(12, 3) }),
        anActivity("b", "IN_TOUR", { name: "Pompes", executionParameters: allFailureParameters(3) }),
      ],
      { circuitNature: "SERIES", tourRepeatCount: 3 },
    );
    fireEvent.press(screen.getByTestId(EYE));
    expect(screen.getByTestId("composition-circuit-volumes-unit-b", anyNode).props.children).toBe("À l’échec");
    expect(screen.getByTestId("composition-circuit-volumes-cell-b-3", anyNode).props.children).toBe("✓");
    expect(screen.getByTestId("composition-circuit-volumes-cell-a-3", anyNode).props.children).toBe("12");
  });

  it.each([
    ["X", () => fireEvent.press(screen.getByTestId("composition-circuit-volumes-close"))],
    ["scrim", () => fireEvent.press(screen.getByTestId("composition-circuit-volumes-scrim", anyNode))],
    ["system back", () => fireEvent(screen.getByTestId("composition-circuit-volumes-modal", anyNode), "requestClose")],
  ])("closing by %s leaves the draft strictly identical; the focus goes back to the eye once the Modal is dismissed (iOS)", (_label, close) => {
    const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
    const focusTargets = () =>
      focus.mock.calls.map(([target, event]) => [(target as unknown as { props: { testID?: string } }).props.testID, event]);
    try {
      renderWithProbe(circuitExercises(), { circuitNature: "SERIES", tourRepeatCount: 2 });
      const before = probe.draft!;
      focus.mockClear();
      fireEvent.press(screen.getByTestId(EYE));
      expect(probe.draft).toBe(before);
      const onDismiss = screen.getByTestId("composition-circuit-volumes-modal", anyNode).props.onDismiss as () => void;
      act(() => close());
      expect(screen.queryByTestId(SHEET)).toBeNull();
      expect(probe.draft).toBe(before);
      expect(sessionDraftsEqual(probe.draft!, before)).toBe(true);
      // Pas de focus tant que la `Modal` native n'a pas fini de disparaître.
      expect(focusTargets()).toEqual([]);
      act(() => onDismiss());
      expect(focusTargets()).toEqual([[EYE, "focus"]]);
    } finally {
      focus.mockRestore();
    }
  });

  it("a stale or repeated close does nothing more (one focus request, sheet stays closed)", () => {
    const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
    try {
      renderWithProbe(circuitExercises());
      fireEvent.press(screen.getByTestId(EYE));
      const modal = screen.getByTestId("composition-circuit-volumes-modal", anyNode);
      const onDismiss = modal.props.onDismiss as () => void;
      const staleClose = modal.props.onRequestClose as () => void;
      focus.mockClear();
      act(() => {
        staleClose();
        staleClose();
      });
      act(() => onDismiss());
      act(() => staleClose());
      expect(screen.queryByTestId(SHEET)).toBeNull();
      expect(focus).toHaveBeenCalledTimes(1);
    } finally {
      focus.mockRestore();
    }
  });

  it("focus loss (useFocusEffect cleanup) closes the sheet with the draft unchanged, without moving the focus", () => {
    const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
    try {
      mockFocusHarness.callbacks = [];
      renderWithProbe(circuitExercises());
      fireEvent.press(screen.getByTestId(EYE));
      expect(screen.getByTestId(SHEET)).toBeTruthy();
      const before = probe.draft;
      const onDismiss = screen.getByTestId("composition-circuit-volumes-modal", anyNode).props.onDismiss as () => void;
      focus.mockClear();
      act(() => {
        mockFocusHarness.callbacks.forEach((callback) => (callback() as unknown as (() => void) | undefined)?.());
      });
      expect(screen.queryByTestId(SHEET)).toBeNull();
      act(() => onDismiss());
      expect(probe.draft).toBe(before);
      expect(focus).not.toHaveBeenCalled();
    } finally {
      focus.mockRestore();
    }
  });

  it("Android: the eye closes the open nature panel (one active control); closing the sheet gives the focus back without onDismiss", () => {
    const platformBefore = Platform.OS;
    Platform.OS = "android";
    const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
    try {
      renderWithProbe(circuitExercises());
      fireLayout(screen.getByTestId("composition-tour-section"), 230, 170);
      fireLayout(screen.getByTestId("composition-circuit-header"), 12, 44);
      const PANEL = "composition-circuit-header-counter-nature-panel";
      fireEvent.press(screen.getByTestId("composition-circuit-header-counter-nature"));
      expect(screen.getByTestId(PANEL)).toBeTruthy();
      const before = probe.draft;
      // Panneau ouvert : le reste de l'écran est masqué pour l'accessibilité, l'œil reste touchable.
      fireEvent.press(screen.getByTestId(EYE, anyNode));
      expect(screen.queryByTestId(PANEL, anyNode)).toBeNull();
      expect(screen.getByTestId(SHEET)).toBeTruthy();
      focus.mockClear();
      fireEvent.press(screen.getByTestId("composition-circuit-volumes-close"));
      expect(screen.queryByTestId(SHEET)).toBeNull();
      expect(probe.draft).toBe(before);
      const targets = focus.mock.calls.map(([target]) => (target as unknown as { props: { testID?: string } }).props.testID);
      expect(targets).toEqual([EYE]);
    } finally {
      focus.mockRestore();
      Platform.OS = platformBefore;
    }
  });

  it("empty Circuit: the sheet opens on the empty state, without fictitious value", () => {
    renderWithProbe([anActivity("before", "BEFORE_TOUR")]);
    fireEvent.press(screen.getByTestId(EYE));
    expect(screen.getByTestId("composition-circuit-volumes-empty").props.children).toBe("Aucun exercice dans le circuit");
    expect(screen.queryByTestId("composition-circuit-volumes-grid", anyNode)).toBeNull();
  });

  it("a pending exit (abandon dialog) closes the sheet: never two stacked modals", () => {
    renderWithProbe(circuitExercises());
    fireEvent.press(screen.getByTestId(EYE));
    const before = probe.draft;
    mockExitGuard.mockReturnValue({ ...defaultExitGuardResult(), isPendingExit: true });
    screen.rerender(
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService()}>
          <ReferentialServiceContext.Provider value={fakeReferentialService()}>
            <StatefulDraftWrapper initialExercises={circuitExercises()}>
              <CompositionScreen />
              <DraftProbe />
            </StatefulDraftWrapper>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
    expect(screen.queryByTestId(SHEET)).toBeNull();
    expect(probe.draft).toBe(before);
  });
});
