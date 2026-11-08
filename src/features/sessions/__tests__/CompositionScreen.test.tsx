import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, Alert, Animated, BackHandler, Keyboard, Platform, ScrollView, StyleSheet, Text, type AlertButton } from "react-native";

import {
  allFailureParameters,
  durationParameters,
  repetitionParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import { spokenDurations } from "@/domain/activities/durationFormat";
import { DuplicateMovementNameError } from "@/domain/activities/MovementRepository";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import type { Label } from "@/domain/labels/Label";
import { createDefaultProfile } from "@/domain/preferences/Profile";
import { createEmptyDraft, createExerciseDraft, sessionDraftsEqual, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import * as circuitModule from "@/domain/sessions/circuit";
import { scopeSequence, type StopPoint } from "@/domain/sessions/StopPoint";
import { NAME_MAX_LENGTH } from "@/domain/sessions/validation";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import {
  notifyBodyZonesReferentialChanged,
  ReferentialServiceContext,
} from "@/features/reference-data/ReferentialServiceContext";
import { STOP_POINT_LINE_HEIGHT } from "@/features/sessions/ActivityRecoveryLine";
import { CIRCUIT_HEADER_HEIGHT } from "@/features/sessions/CircuitHeader";
import { CompositionScreen, predictedInsertionHeight } from "@/features/sessions/CompositionScreen";
import { TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";
import { MOTION_EASING, MOTION_SHIFT_DURATION_MS } from "@/features/sessions/compositionMotion";
import type { SessionDraftContextValue, SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import {
  OCCURRENCE_CARD_BORDER_WIDTH,
  OCCURRENCE_CARD_HEIGHT,
  OCCURRENCE_CARD_MEDIA,
} from "@/features/sessions/OccurrenceCard";
import { SessionDraftProvider } from "@/features/sessions/SessionDraftProvider";
import type { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { UNSELECTED_OPACITY } from "@/shared/ui/opacity";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { FINAL_ACTION_BUTTON, finalActionBottomMargin, finalActionZoneHeight } from "@/shared/ui/finalAction";
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

/**
 * Revue 6.2 : sous Jest, `onLayout` ne se déclenche jamais ; l'écran refuse alors tout soulèvement
 * (géométrie incomplète). Mesure factice de chaque rangée affichée (cartes, points), dans sa liste —
 * positions séquentielles, sans valeur de référence : les tests qui vérifient une géométrie
 * l'injectent explicitement.
 */
function measureDisplayedRows() {
  const rows = screen
    .queryAllByTestId(/^composition-(activity-|stop-point-row-)/u, { includeHiddenElements: true })
    .filter((node) => typeof node.props.onLayout === "function");
  rows.forEach((row, index) =>
    fireEvent(row, "layout", { nativeEvent: { layout: { x: 0, y: index * 100, width: 354, height: 80 } } }),
  );
}

function renderScreen() {
  const view = render(
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
  measureDisplayedRows();
  return view;
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
  // PRE-7 (R-3, C05) : les Exercices préremplis sont des créations locales terminées (Mouvement NEW à
  // leur identifiant, `withLocalMovements`), comme après l'éditeur d'occurrence.
  const [draft, setDraft] = useState<SessionDraftContextValue["draft"]>(() =>
    withLocalMovements({
      name: "Séance simple",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercises: initialExercises,
      ...draftOverrides,
    }),
  );
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

/** 08/11/2026 : source de l'icône rendue par `KodjoIcon` (variantes du pictogramme de la carte), rendue et démontée avant l'écran. */
function probeIconSource(name: "card-media-exercise" | "card-media-exercise-out-of-circuit"): unknown {
  const probe = render(<KodjoIcon name={name} testID="icon-probe" />);
  const source: unknown = probe.getByTestId("icon-probe").props.source;
  probe.unmount();
  return source;
}

function renderScreenWithDraft(
  exercises: readonly SessionDraftExercise[],
  draftOverrides?: Partial<SessionDraftContextValue["draft"]>,
) {
  const view = render(
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
  measureDisplayedRows();
  return view;
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
    // PRE-9 B.2 — D-451, COMP §1 : une Séance commence sans Circuit (aucun compteur de Circuit).
    expect(screen.queryByLabelText(composition.circuit.countAccessibilityLabel)).toBeNull();

    const continueAction = screen.getByLabelText(composition.saveAction);
    expect(continueAction.props.accessibilityState).toMatchObject({ disabled: true });
  });

  // PRE-9 B.2 — D-451, COMP §1 : le compteur est vérifié sur une Séance qui a un Circuit.
  it("renders the Circuit counter of a session with a Circuit", () => {
    renderScreenWithDraft([anActivity("circuit-member", "IN_TOUR")]);

    // PRE-6 (story 3.1, CIR-10) : le compteur du Circuit est un réglage ajustable qui annonce
    // N avec son unité ; au repos, « 1 » puis « tour · groupées » (PRE-9 B.1a, D-451, complément
    // du 28/10, remplace D-442 / D-443).
    const counter = screen.getByLabelText(composition.circuit.countAccessibilityLabel);
    expect(counter.props.accessibilityRole).toBe("adjustable");
    expect(counter.props.accessibilityValue).toMatchObject({ now: 1, text: "1 tour" });
    expect(screen.getByTestId("composition-circuit-header-counter-value").props.children).toBe(1);
    expect(screen.getByTestId("composition-circuit-header-counter-unit", { includeHiddenElements: true }).props.children).toBe("tour");
    expect(screen.getByTestId("composition-circuit-header-counter-adjective", { includeHiddenElements: true }).props.children).toBe("groupées");
    expect(screen.queryByText("×1")).toBeNull();
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
  // PRE-6 story 5.2 (D-435, `8328:28605`) : plus de rail continu ; des segments relient les anneaux
  // (cercle de 10, contour extérieur 1,5 `#7A7A80`, fond blanc).
  it("PRE6-2.1 / 5.2 — Séquence : segments de rail, anneau pour Compte à rebours, Circuit et Fin ; aucune icône de rôle de carte limite", () => {
    // PRE-9 B.2 — D-451, COMP §1 : l'anneau du Circuit n'existe qu'avec un Circuit (jamais vide).
    renderScreenWithDraft([anActivity("circuit-member", "IN_TOUR")]);

    // Rail et anneaux sont décoratifs, masqués à l'accessibilité.
    const hidden = { includeHiddenElements: true };
    expect(screen.queryByTestId("composition-sequence-rail", hidden)).toBeNull();
    // Revue 5.2 : l'anneau des bornes est posé sur la rangée, hors de son atténuation de placement.
    for (const boundary of ["composition-boundary-countdown", "composition-boundary-final-phase"]) {
      expect(screen.getByTestId(`${boundary}-rail-ring`, hidden)).toBeTruthy();
    }
    expect(
      StyleSheet.flatten(screen.getByTestId("composition-sequence-marker-circuit", hidden).props.style),
    ).toMatchObject({ width: 13, height: 13, borderWidth: 1.5, borderColor: TEXT_TERTIARY, backgroundColor: colors.background });
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

  // PRE-6 story 2.1 : la borne garde le même nombre d'enfants, fermée comme ouverte (acquis REWORK06 transposé). [La pastille
  // de valeur gardait aussi son style ouverte (déclencheur de la roulette) — remplacé le 08/11/2026 (a-bornes-clavier, Hermann :
  // « Le focus est directement dans le champ sélectionné ») : ouverte, la case de saisie prend la place de la pastille.]
  it("PRE6-2.1 — la borne garde la même structure, fermée ou ouverte ; ouverte, la case de saisie remplace la pastille", () => {
    renderScreen();

    const rowBefore = screen.getByTestId("composition-boundary-countdown");
    const childCountBefore = (rowBefore.children as unknown[]).length;
    expect(StyleSheet.flatten(screen.getByTestId("composition-boundary-countdown-value").props.style)).toBeTruthy();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));

    const rowAfter = screen.getByTestId("composition-boundary-countdown");
    expect((rowAfter.children as unknown[]).length).toBe(childCountBefore);
    expect(screen.queryByTestId("composition-boundary-countdown-value")).toBeNull();
    expect(within(rowAfter).getByTestId("carrier-duration-field")).toBeTruthy();
  });

  // [Test de la roulette dans `WheelPickerOverlay` (T01-S09 point D) — retiré le 07/11/2026 : bornes saisies au clavier.]

  // [Test de la roulette dans `WheelPickerOverlay` (T01-S09 point D) — retiré le 07/11/2026 : bornes saisies au clavier.]

  it("enables '+ Ajouter une activité' while no Exercise exists yet, and opens the add-activity tree on press (V2-CAT-01)", () => {
    renderScreen();

    const addActivity = screen.getByLabelText(composition.addActivity);
    // PRE-6 story 2.1 : aucun état `disabled` constant sur le « + » ; il reste utilisable.
    expect(addActivity.props.accessibilityState?.disabled).not.toBe(true);

    fireEvent.press(addActivity);
    expect(screen.getByTestId("composition-add-activity-tree")).toBeTruthy();
  });

  // Complément du 5 novembre 2026 (§3) : « Créer un exercice » ouvre la modale de création commune (Exercice libre et
  // Formats). [PRE-9 A.2 : création directe d'un Mouvement en contexte Séance — remplacé ; « Exercice libre » y mène.]
  it("navigates to the creation modal when 'Créer un exercice' is selected from the add-activity tree", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-new"));

    expect(mockPush).toHaveBeenCalledWith("/formats-window");
    expect(mockPush).not.toHaveBeenCalledWith("/exercise");
  });

  // PRE-9 A.2 — ARB-22a, D-449 : « Utiliser un mouvement existant » ouvrait la sélection des Mouvements
  // du Catalogue. [Remplacé le 01/11/2026 (ordre de Hermann, ch13 CE-T03-08 « Menu Créer — état
  // cible ») : plus d'entrée « Utiliser un mouvement existant » ; la recherche passe par la saisie du
  // nom dans « Créer un exercice ».] [Rétabli par la recette iPhone du 01/11/2026 (m11-menu, Hermann :
  // « il faut intégrer de nouveau l'option du menu « utiliser un mouvement existant » ») : test d'avant
  // le 01/11 restauré.]
  // [Complément du 5 novembre 2026 (§3) : « Utiliser des mouvements existants » retiré du menu.]
  it("the add-activity tree no longer offers 'Utiliser des mouvements existants' nor 'Utiliser un format d'entraînement'", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.addActivity));

    expect(screen.queryByTestId("composition-add-activity-tree-existing")).toBeNull();
    expect(screen.queryByTestId("composition-add-activity-tree-format")).toBeNull();
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

    // PRE-9 B.2 (Figma `10705:20223`) : la première rangée du menu Créer est à 8 sous la zone de contexte.
    const firstRow = screen.getByTestId("composition-add-activity-tree-new");
    const flattenedTop = StyleSheet.flatten(firstRow.props.style).top as number;
    // Insets de test (`TestSafeAreaProvider`) : `top: 47`.
    // Recette 3 (D-353) : plus de séparateur de 1 entre l’en-tête et la bande (auparavant « + 1 »).
    const expectedTop = 47 + dimensions.header.contentHeight + dimensions.contextBand.height + spacing[8];
    expect(flattenedTop).toBe(expectedTop);

    const scrim = screen.getByTestId("composition-add-activity-tree-backdrop");
    // PRE-9 B.2 : voile modal de Figma `10705:20311`.
    expect(StyleSheet.flatten(scrim.props.style).backgroundColor).toBe("rgba(31, 33, 41, 0.42)");
  });

  // Story 7.8 : la séance vide affiche « 0 s » dans la zone de contexte (remplace le résumé vide
  // « — min » des stories 1.3 / REWORK09). PRE-9 B.1a — D-451, complément du 28/10 (remplace la
  // clause de D-443 qui masquait la durée du Circuit) : la durée du Circuit est de nouveau affichée
  // à droite de son en-tête, au même format ; Circuit vide : « 0 s ».
  // PRE-9 B.2 — D-451, COMP §1 : une Séance vide n'a plus de Circuit (ni sa durée).
  it("PRE-9 B.1a — the Circuit duration is shown again (« 0″ » when empty); the empty session shows « 0″ » in the context area", () => {
    renderScreen();

    expect(screen.queryByTestId("composition-circuit-header-duration", { includeHiddenElements: true })).toBeNull();
    expect(screen.queryByText("— min")).toBeNull();
    expect(screen.getByTestId("composition-session-duration").props.children).toBe("0″");
  });

  it("shows the canonical default countdown (10″) and final phase (5″) row values, in seconds only (story 7.8)", () => {
    renderScreen();

    expect(within(screen.getByTestId("composition-boundary-countdown-value")).getByText("10″")).toBeTruthy();
    expect(within(screen.getByTestId("composition-boundary-final-phase-value")).getByText("5″")).toBeTruthy();
    expect(screen.queryByText("00 min 10″")).toBeNull();
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
  // Recette iPhone du 07/11/2026 (Hermann : « Je vois que le compte à rebours et la pause d'une composition de séance s'ouvrent
  // encore en modale, il faut leur substituer le clavier. ») : Compte à rebours initial et Fin de séance se saisissent au clavier
  // (`CarrierDurationSheet`), bornes 0..60 s (D-443). [Roulette d'une colonne `NumberWheelPicker` (story 7.8) et ses tests
  // D-06 / R4-09 / REWORK08-B — remplacés.]
  const countdownValue = () => within(screen.getByTestId("composition-boundary-countdown-value")).getByText(/″$/).props.children;
  const finalPhaseValue = () => within(screen.getByTestId("composition-boundary-final-phase-value")).getByText(/″$/).props.children;
  const INPUT = "carrier-duration-input";
  const type = (keys: string) => {
    fireEvent(screen.getByTestId(INPUT), "focus");
    for (const key of [...keys]) {
      const input = screen.getByTestId(INPUT);
      fireEvent.changeText(input, String(input.props.value ?? "") + key);
    }
  };
  // 08/11/2026 (a-bornes-clavier) : saisie en place, appliquée à la perte du focus ou par « Fermer » de la barre du clavier.
  const close = () => fireEvent(screen.getByTestId(INPUT), "blur");

  it("07/11/2026 — la borne ouvre la case au clavier (aucune roulette), libellée du nom de la borne", () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    expect(screen.queryByTestId("number-wheel-picker")).toBeNull();
    expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();
    expect(screen.getByTestId(INPUT).props.keyboardType).toBe("number-pad");
    // 08/11/2026 (a-bornes-clavier) : plus de fenêtre volante ; la case est la valeur de la borne elle-même.
    expect(screen.queryByTestId("carrier-duration-card")).toBeNull();
    expect(screen.queryByTestId("carrier-duration-sheet")).toBeNull();
    expect(within(screen.getByTestId("composition-boundary-countdown")).getByTestId(INPUT).props.accessibilityLabel).toBe(composition.countdown.label);
  });

  it("07/11/2026 — la saisie est appliquée à la fermeture ; la durée de séance ne compte pas les bornes", () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    type("45");
    expect(screen.getByTestId(INPUT).props.value).toBe("00:45");
    close();
    expect(screen.queryByTestId(INPUT)).toBeNull();
    expect(countdownValue()).toBe("45″");
    expect(screen.getByTestId("composition-session-duration").props.children).toBe("0″");
  });

  it("07/11/2026 — au-delà de 1′00″, ramené à 60 ; case vidée : valeur précédente gardée", () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    type("130");
    close();
    expect(countdownValue()).toBe("1′00″");
    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    fireEvent(screen.getByTestId(INPUT), "focus");
    fireEvent.changeText(screen.getByTestId(INPUT), "");
    close();
    expect(countdownValue()).toBe("1′00″");
  });

  it("07/11/2026 — Fin de séance au clavier, 0 admis ; le Compte à rebours n'est pas touché", () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(composition.finalPhase.label));
    expect(within(screen.getByTestId("composition-boundary-final-phase")).getByTestId(INPUT).props.accessibilityLabel).toBe(composition.finalPhase.label);
    type("0");
    close();
    expect(finalPhaseValue()).toBe("0″");
    expect(countdownValue()).toBe("10″");
  });

  // [« dismisses the keyboard when opening a duration picker » (le clavier se fermait à l'ouverture d'une roulette) — remplacé le
  // 08/11/2026 : le focus passe directement dans la case de la borne ; ouvrir l'autre borne applique d'abord la première.]
  it("08/11/2026 — ouvrir une borne garde le clavier (focus dans sa case) ; ouvrir l'autre applique d'abord la première", () => {
    const dismissSpy = jest.spyOn(Keyboard, "dismiss").mockImplementation(() => {});
    try {
      renderScreen();
      fireEvent.press(screen.getByLabelText(composition.countdown.label));
      expect(dismissSpy).not.toHaveBeenCalled();
      type("20");

      fireEvent.press(screen.getByLabelText(composition.finalPhase.label));
      expect(dismissSpy).toHaveBeenCalledTimes(1);
      expect(countdownValue()).toBe("20″");
      expect(within(screen.getByTestId("composition-boundary-final-phase")).getByTestId(INPUT)).toBeTruthy();
    } finally {
      dismissSpy.mockRestore();
    }
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
      // PRE-6 story 7.2 (D-442) : icône d’étiquette teintée de la couleur de l’Étiquette, plus de pastille.
      const swatch = screen.getByTestId("composition-session-label-icon");
      expect(StyleSheet.flatten(swatch.props.style).tintColor).toBe("#2E9B62");
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
    expect(screen.queryByTestId("composition-session-label-icon")).toBeNull();
  });

  it("never writes to draft.color when a Label is derived (no autonomous colour write)", async () => {
    renderScreenWithDraft([], { labelId: "label-sport" });

    await waitFor(() => {
      // PRE-6 story 7.2 (D-442) : icône d’étiquette teintée de la couleur de l’Étiquette, plus de pastille.
      const swatch = screen.getByTestId("composition-session-label-icon");
      expect(StyleSheet.flatten(swatch.props.style).tintColor).toBe("#2E9B62");
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
      // PRE-6 story 7.2 (D-442) : icône d’étiquette teintée de la couleur de l’Étiquette, plus de pastille.
      const swatch = screen.getByTestId("composition-session-label-icon");
      expect(StyleSheet.flatten(swatch.props.style).tintColor).toBe("#2E9B62");
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
  // PRE-6 story 5.1 (D-435) : plus de poignée au repos ; le média intégré tient la place à gauche.
  it("REWORK12 (COMP-01), révisé PRE6-5.1 — no handle on the Exercise row: the integrated media sits on the left, never composition-main-content nor a side icon for a unilateral", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    expect(within(row).queryByTestId("composition-boundary-handle-slot")).toBeNull();
    expect(within(row).queryByTestId("composition-boundary-handle-icon")).toBeNull();
    expect(within(row).getByTestId("composition-exercise-media")).toBeTruthy();
    expect(screen.queryByTestId("composition-exercise-icon")).toBeNull();
    expect(within(row).queryByTestId("composition-row-icon-composition-main-content")).toBeNull();
    // PRE-6 (story 2.2) : aucune icône de changement de côté pour un unilatéral.
    expect(within(row).queryByTestId("composition-exercise-side-change-icon")).toBeNull();
  });

  // PRE-6 (story 5.1, D-435, `9798:44464`) : fond blanc, bord 1 #E4E7EF hors Circuit, rayon 12 ;
  // marges 8 à gauche (jusqu'au média) et 8 du bord extérieur à droite (bord des valeurs).
  // PRE-6 story 5.2 (Standard `8328:28605`) : le média est à 8 du bord EXTÉRIEUR (1 de bord + 7),
  // sur l'axe du rail.
  // Demande de Hermann du 08/11/2026 (D-511) : carte « DSF / Cards / Exercice — Composition » — fond blanc, liseré 0,5
  // à 50 % (couleur des cartes de séance), rayon 12, dans le Circuit comme hors Circuit ; contenu mesuré depuis le bord
  // extérieur. [Carte v2 : bord 1 #E4E7EF hors Circuit, aucun dans le Circuit — remplacé le 08/11/2026.]
  it("D-511 — outside the Circuit: white card, 0.5 hairline at 50 %, radius 12; « Hors circuit » variant", () => {
    const black = probeIconSource("card-media-exercise-out-of-circuit");
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]);

    const exerciseCardStyle = StyleSheet.flatten(screen.getByTestId("composition-exercise-row-ex-1").props.style);
    expect(exerciseCardStyle.borderColor).toBe("rgba(204, 209, 224, 0.5)");
    expect(exerciseCardStyle.borderWidth).toBe(0.5);
    expect(exerciseCardStyle.borderRadius).toBe(12);
    expect(exerciseCardStyle.backgroundColor).toBe(colors.background);
    expect(StyleSheet.flatten(screen.getByTestId("composition-activity-main-card").props.style)).toMatchObject({ top: -0.5, left: -0.5, right: -0.5 });
    expect(within(screen.getByTestId("composition-exercise-media")).getByTestId("composition-exercise-media-icon").props.source).toEqual(black);
  });

  it("D-511 — inside the Circuit: same hairline; « Dans un circuit » variant (grey pictogram); the lifted card gets a 1 border", () => {
    const grey = probeIconSource("card-media-exercise");
    renderScreenWithDraft([anActivity("ex-1", "IN_TOUR", { name: "Gainage" })]);

    const exerciseCardStyle = StyleSheet.flatten(screen.getByTestId("composition-exercise-row-ex-1").props.style);
    expect(exerciseCardStyle.borderWidth).toBe(0.5);
    expect(exerciseCardStyle.borderRadius).toBe(12);
    expect(exerciseCardStyle.backgroundColor).toBe(colors.background);
    expect(within(screen.getByTestId("composition-exercise-media")).getByTestId("composition-exercise-media-icon").props.source).toEqual(grey);
    // L'état soulevé garde son contour de 1.
    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");
    expect(StyleSheet.flatten(screen.getByTestId("composition-exercise-row-ex-1").props.style).borderWidth).toBe(1);
  });

  it("D-511 — the integrated media is a 64 × 64 placeholder at 4 from the edge (radius 8, 1 pt #7A7A80 border, #EEF0F6 fill) with the 24 pictogram when the occurrence has no media (story 5.1b: photo or video poster otherwise)", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]);

    const media = screen.getByTestId("composition-exercise-media");
    expect(StyleSheet.flatten(media.props.style)).toMatchObject({
      top: 4,
      left: 4,
      width: 64,
      height: 64,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#7A7A80",
      backgroundColor: "#EEF0F6",
      alignItems: "center",
      justifyContent: "center",
    });
    const icon = within(media).getByTestId("composition-exercise-media-icon");
    expect(StyleSheet.flatten(icon.props.style)).toMatchObject({ width: 24, height: 24 });
    expect(within(media).queryAllByRole("image")).toHaveLength(0);
  });

  // Intention d'édition conservée dans l'indice (`exerciseRow.editAccessibilityLabel`), avant les gestes.
  it("PRE6-2.2 — the card hint announces the edit intent, then the reorder / actions gestures", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]);

    // [« editAccessibilityLabel » — remplacé par la recette iPhone n° 2 du 31/10/2026 (constat c) : la carte
    // ouvre les paramètres d'exécution, « Modifier les paramètres ».]
    expect(screen.getByTestId("composition-exercise-row-ex-1").props.accessibilityHint).toBe(
      `${composition.exerciseRow.editParametersAccessibilityLabel}. ${composition.activityActions.reorderAccessibilityHint}`,
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
    expect(screen.getByTestId("composition-exercise-summary").props.children).toBe("3 × 1′30″");
    expect(screen.queryByText(/pause/)).toBeNull();
    expect(screen.queryByText("Ne pas creuser le dos")).toBeNull();
  });

  it("pressing the Exercise row navigates to /exercise with its own exerciseId (reopen for editing, complétion REWORK12 — édition ciblée par identifiant)", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]);

    // Recette iPhone n° 2 du 31/10/2026 (constat c) : [la carte] — remplacé : la photo ouvre l'Exercice.
    fireEvent.press(screen.getByTestId("composition-exercise-media-button-ex-1"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/exercise-sheet", // [04/11/2026 : la photo ouvre la fiche en lecture seule, décision de Hermann — remplace « /exercise ».]
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

    // Recette iPhone n° 2 du 31/10/2026 (constat c) : [la carte] — remplacé : la photo ouvre l'Exercice.
    fireEvent.press(screen.getByTestId("composition-exercise-media-button-ex-2"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/exercise-sheet", // [04/11/2026 : la photo ouvre la fiche en lecture seule, décision de Hermann — remplace « /exercise ».]
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
    // PRE-9 B.2 — D-451, COMP §1 : une Séance commence sans Circuit — aucun Circuit entre les bornes.
    expect(labelOrder).toEqual([composition.countdown.label, composition.finalPhase.label]);
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
    // PRE-9 B.2 — D-451, COMP §1 : l'Exercice créé est au niveau de la Séance, sans Circuit.
    expect(labelOrder).toEqual([composition.countdown.label, composition.finalPhase.label]);
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
    // Revue 5.1b : cible réelle — le `Pressable` est la boîte de 44, le cercle de 34 y est centré.
    expect(StyleSheet.flatten(addActivity.props.style)).toMatchObject({ width: 44, height: 44 });
    expect(addActivity.props.hitSlop).toBeUndefined();
    const flattened = StyleSheet.flatten(screen.getByTestId("composition-add-activity-action-circle").props.style);
    expect(flattened.width).toBe(34);
    expect(flattened.height).toBe(34);
    expect(flattened.borderRadius).toBe(17);
    expect(flattened.borderColor).toBe(colors.primary);
    expect(flattened.backgroundColor).toBe(colors.background);
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
  it("PRE6-2.1 — puce Étiquette (26, rayon 13, fond blanc 35 %, icône 18, « Étiquette » 13 primaire, cible 44) et durée de séance « 0″ » (Inter 14 tertiaire)", () => {
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
    // Story 7.8 (D-443) : séance vide → « 0 s ».
    expect(duration.props.children).toBe("0″");
    expect(StyleSheet.flatten(duration.props.style)).toMatchObject({ fontSize: 14, fontWeight: "400", color: TEXT_TERTIARY });
    // Revue 5.1b : la bande de 32 est une boîte de 44 (cibles contenues) aux marges verticales de −6 :
    // encombrement 32 inchangé.
    const infoRow = StyleSheet.flatten(screen.getByTestId("composition-info-row").props.style);
    expect(infoRow).toMatchObject({ height: 44, marginVertical: -6 });
    expect((infoRow.height as number) + 2 * (infoRow.marginVertical as number)).toBe(32);
  });

  // Revue 5.1b : écran étroit — la durée de séance s'abrège (ellipse) et le groupe d'informations
  // cède sa place ; rien ne passe sous les commandes contextuelles, qui ne rétrécissent pas.
  it("story 5.1b — narrow screens: the session duration and the information group may shrink, the contextual commands never do", () => {
    renderScreen();
    const duration = screen.getByTestId("composition-session-duration");
    expect(duration.props.numberOfLines).toBe(1);
    expect(StyleSheet.flatten(duration.props.style)).toMatchObject({ flexShrink: 1, minWidth: 0 });
    expect(StyleSheet.flatten(screen.getByTestId("composition-info-group").props.style)).toMatchObject({ flex: 1, minWidth: 0 });
    expect(StyleSheet.flatten(screen.getByTestId("composition-context-actions").props.style).flexShrink).toBe(0);
  });

  it("PRE6-3.1 — Circuit header (Figma `8328:28667`): the outer structure keeps the only surface; « Circuit » Semi Bold 16 primary; the counter on the right (story 7.8 : no Circuit duration)", () => {
    // PRE-9 B.2 — D-451, COMP §1 : le Circuit n'est rendu qu'avec au moins un Exercice.
    renderScreenWithDraft([anActivity("circuit-member", "IN_TOUR")]);

    // La seule surface visuelle est la structure extérieure (PRE-6 story 5.2, D-435, choix D5 :
    // aplat `#F3F4F9` sans contour, rayon 18 ; `tourSurface` inchangé). PRE-6 (story 2.3b,
    // amendement du 21/10/2026) : non mesurée, elle porte un fond statique ; mesurée, le fond est
    // porté par les trois couches de `CircuitSurface` (haut et bas arrondis, bande centrale), qui
    // suivent les bords pendant le glisser.
    // Contre-recette du 30/10 (constat b) : le fond statique est porté par une couche
    // (`composition-tour-section-static-surface`, apparition progressive à la pose), plus par le conteneur.
    const tourSection = screen.getByTestId("composition-tour-section");
    const tourSectionStyle = StyleSheet.flatten(tourSection.props.style);
    expect(tourSectionStyle.backgroundColor).toBeUndefined();
    expect(tourSectionStyle.borderRadius).toBe(18);
    expect(tourSectionStyle.borderWidth).toBeUndefined();
    expect(
      StyleSheet.flatten(within(tourSection).getByTestId("composition-tour-section-static-surface", { includeHiddenElements: true }).props.style),
    ).toMatchObject({ backgroundColor: "#EBEDF5", borderRadius: 18 });
    expect(screen.queryByTestId("composition-tour-section-surface", { includeHiddenElements: true })).toBeNull();

    fireLayout(tourSection, 230, 170);
    const measuredStyle = StyleSheet.flatten(screen.getByTestId("composition-tour-section").props.style);
    expect(measuredStyle.backgroundColor).toBeUndefined();
    expect(measuredStyle.borderRadius).toBe(18);
    expect(screen.queryByTestId("composition-tour-section-static-surface", { includeHiddenElements: true })).toBeNull();
    const surface = (part: string) =>
      StyleSheet.flatten(
        within(tourSection).getByTestId(`composition-tour-section-surface-${part}`, { includeHiddenElements: true }).props
          .style,
      );
    for (const part of ["top", "band", "bottom"]) {
      expect(surface(part).backgroundColor).toBe("#EBEDF5");
    }
    expect(surface("top")).toMatchObject({ top: 0, borderTopLeftRadius: 18, borderTopRightRadius: 18 });
    expect(surface("bottom")).toMatchObject({ bottom: 0, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 });
    expect(surface("band")).toMatchObject({ top: 18, bottom: 18 });

    const header = within(tourSection).getByTestId("composition-circuit-header");
    const headerStyle = StyleSheet.flatten(header.props.style);
    expect(headerStyle.backgroundColor).toBeUndefined();
    const rowStyle = StyleSheet.flatten(within(header).getByTestId("composition-circuit-header-row").props.style);
    expect(rowStyle.flexDirection).toBe("row");

    const title = within(header).getByTestId("composition-circuit-header-title");
    expect(title.props.children).toBe("Circuit");
    // PRE-9 B.1a (référence §4) : nom en Semi Bold 15.
    expect(StyleSheet.flatten(title.props.style)).toMatchObject({ fontSize: 15, fontWeight: "600", color: colors.textPrimary });

    // PRE-9 B.1a — D-451, complément du 28/10 (remplace la clause de D-443) : durée à droite.
    expect(within(header).getByTestId("composition-circuit-header-duration", { includeHiddenElements: true })).toBeTruthy();
    // Story 5.2 (D-435, `9819:19948`) : en-tête sur une ligne, titre à x 69 (après l'anneau). Recette du
    // 29/10 (obs-3 b) : ligne de 18 (Figma `10744:20185`, au lieu de 40), hauteur MINIMALE (Dynamic
    // Type) ; titre d'au moins 95 (compteur à x 103 du titre, aligné sur celui du Cycle).
    expect(headerStyle).toMatchObject({ minHeight: 18, paddingLeft: 45 });
    expect(rowStyle).toMatchObject({ minHeight: 18, alignItems: "center" });
    // Le nom (et son chevron) cède (ellipse) après la durée ; le compteur jamais.
    expect(StyleSheet.flatten(within(header).getByTestId("composition-circuit-header-collapse").props.style)).toMatchObject({
      flexShrink: 1,
      minWidth: 95,
    });
    const counter = within(header).getByTestId("composition-circuit-header-counter-slot");
    expect(StyleSheet.flatten(counter.props.style).flexShrink).toBe(0);

    // Plus de roulette du compte ni de « Nombre de tours » affiché, ni d'icône Tour.
    expect(screen.queryByText("Nombre de tours")).toBeNull();
    expect(screen.queryByTestId("composition-tour-control")).toBeNull();
    expect(screen.queryByTestId("composition-tour-icon")).toBeNull();
  });

  // PRE-9 B.1a — D-451, complément du 28/10 (remplace D-442 : nombre et pastille à 16, stepper
  // permanent) ; RM-027 : nombre bleu 15 (cible de 44), unité 13 non interactive, adjectif bleu 13.
  it("PRE-9 B.1a — number in blue 15 (44 target), unit 13 not interactive, adjective in blue 13", () => {
    // PRE-9 B.2 — D-451, COMP §1 : le Circuit n'est rendu qu'avec au moins un Exercice.
    renderScreenWithDraft([anActivity("circuit-member", "IN_TOUR")]);

    const digit = screen.getByTestId("composition-circuit-header-counter-value");
    expect(StyleSheet.flatten(digit.props.style)).toMatchObject({ fontSize: 15, color: colors.primary });
    expect(StyleSheet.flatten(screen.getByTestId("composition-circuit-header-counter").props.style)).toMatchObject({
      minWidth: 44,
      minHeight: 44,
    });

    const unit = screen.getByTestId("composition-circuit-header-counter-unit", { includeHiddenElements: true });
    expect(StyleSheet.flatten(unit.props.style)).toMatchObject({ fontSize: 13, color: colors.textPrimary });
    expect(unit.props.onPress).toBeUndefined();
    expect(unit.props.accessibilityRole).toBeUndefined();
    const adjective = screen.getByTestId("composition-circuit-header-counter-adjective", { includeHiddenElements: true });
    expect(StyleSheet.flatten(adjective.props.style)).toMatchObject({ fontSize: 13, color: colors.primary });
    // Story 3.2 : l'adjectif n'est que le dessin du déclencheur du choix de nature (menu natif
    // sur iOS), qui porte seul le rôle et l'action.
    expect(adjective.props.onPress).toBeUndefined();
    expect(adjective.props.accessibilityRole).toBeUndefined();
  });

  /**
   * Story 7.8 : ces tests (REWORK08-C, REWORK13) portent sur la durée de la Séance de la zone de
   * contexte, qui compte EXCLUSIVEMENT les occurrences (jamais le Compte à rebours ni la Fin de
   * séance), arrondie aux 15 s. PRE-9 B.1a (D-451, complément du 28/10, remplace la clause de
   * D-443) : la durée du Circuit est de nouveau affichée, même calcul, même format.
   */
  it("REWORK08-C/REWORK09/REWORK13 — the session and Circuit durations reflect the real computed Activity-only duration, not a static placeholder", () => {
    renderScreenWithDraft([
      { ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45), structuralPosition: "IN_TOUR" },
    ]);

    expect(screen.getByTestId("composition-circuit-header-duration", { includeHiddenElements: true }).props.children).toBe("≈ 45″");
    expect(screen.getByTestId("composition-session-duration").props.children).toBe("≈ 45″");
  });

  it("REWORK13 (R13-02) — confirming Compte à rebours initial or Fin de séance updates only their own card, never the session duration", () => {
    renderScreenWithDraft([
      { ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45), structuralPosition: "IN_TOUR" },
    ]);

    const sessionBefore = screen.getByTestId("composition-session-duration").props.children;
    expect(sessionBefore).toBe("≈ 45″");

    // Compte à rebours initial : ouvre, change, confirme.
    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    // 07/11/2026 : saisie au clavier (roulette remplacée).
    fireEvent(screen.getByTestId("carrier-duration-input"), "focus");
    for (const key of "50") fireEvent.changeText(screen.getByTestId("carrier-duration-input"), String(screen.getByTestId("carrier-duration-input").props.value ?? "") + key);
    fireEvent(screen.getByTestId("carrier-duration-input"), "blur");
    expect(within(screen.getByTestId("composition-boundary-countdown-value")).getByText("50″")).toBeTruthy();
    expect(screen.getByTestId("composition-session-duration").props.children).toBe(sessionBefore);

    // Fin de séance : idem.
    fireEvent.press(screen.getByLabelText(composition.finalPhase.label));
    fireEvent(screen.getByTestId("carrier-duration-input"), "focus");
    for (const key of "30") fireEvent.changeText(screen.getByTestId("carrier-duration-input"), String(screen.getByTestId("carrier-duration-input").props.value ?? "") + key);
    fireEvent(screen.getByTestId("carrier-duration-input"), "blur");
    expect(within(screen.getByTestId("composition-boundary-final-phase-value")).getByText("30″")).toBeTruthy();
    expect(screen.getByTestId("composition-session-duration").props.children).toBe(sessionBefore);
  });

  it("REWORK13 (R13-02) — adding a second Activity updates the session duration accordingly", () => {
    renderScreenWithDraft([
      { ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45), structuralPosition: "IN_TOUR" },
      { ...createExerciseDraft("ex-2"), name: "Squats", executionParameters: durationParameters(30), structuralPosition: "IN_TOUR" },
    ]);

    // 45 + 30 = 75 s → « ≈ 1 min 15 s ».
    expect(screen.getByTestId("composition-session-duration").props.children).toBe("≈ 1′15″");
  });

  // PRE-6 story 2.1 (Figma `8328:28636`) : borne = repère, libellé, pastille de valeur à droite
  // (remplace l'anatomie CMP-03/CMP-05 poignée / libellé + valeur / icône de rôle).
  // PRE-6 story 5.2 (`9819:19907`, `9819:20050`) : Compte à rebours 27 (contenu 24 + 3), Fin 24.
  it("PRE6-2.1 — Boundary steps (Compte à rebours, Fin de séance): ring marker, label, then the value pill on the right; no handle, no role icon, no chevron", () => {
    renderScreen();

    for (const [testID, label, value, height] of [
      ["composition-boundary-countdown", composition.countdown.label, "10″", 27],
      ["composition-boundary-final-phase", composition.finalPhase.label, "5″", 24],
    ] as const) {
      const row = screen.getByTestId(testID);
      // Revue 5.3 : boîte tactile réelle de 44, marges négatives : l'encombrement reste 27 / 24.
      const rowStyle = StyleSheet.flatten(row.props.style);
      expect(rowStyle).toMatchObject({ height: 44, flexDirection: "row" });
      expect((rowStyle.height as number) + (rowStyle.marginTop as number) + (rowStyle.marginBottom as number)).toBe(height);
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
    expect(within(bottomAction).queryByText("0″")).toBeNull();
    expect(within(bottomAction).getByLabelText(composition.saveAction)).toBeTruthy();
    // Story 7.8 (D-443) : la durée reste affichée ailleurs — celle de la Séance, dans la zone de
    // contexte (plus de durée du Circuit).
    expect(screen.getByTestId("composition-session-duration")).toBeTruthy();
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
    // Cible tactile : la rangée entière portée à 44 (story 5.2 : Compte à rebours de 27, Fin de 24),
    // sans dépasser l'écart de 8 du côté de la carte voisine. Revue 5.3 : boîte réelle du `Pressable`
    // (marges négatives : l'encombrement reste 27 / 24), jamais un hitSlop.
    const row = StyleSheet.flatten(screen.getByLabelText(composition.countdown.label).props.style);
    expect(row.height).toBe(44);
    expect(-(row.marginTop as number) - (row.marginBottom as number)).toBe(44 - 27);
    expect(-(row.marginBottom as number)).toBeLessThanOrEqual(8);
    expect(row).toMatchObject({ paddingTop: -(row.marginTop as number), paddingBottom: 3 - (row.marginBottom as number) });
    const end = StyleSheet.flatten(screen.getByLabelText(composition.finalPhase.label).props.style);
    expect(end.height).toBe(44);
    expect(-(end.marginTop as number) - (end.marginBottom as number)).toBe(44 - 24);
    expect(-(end.marginTop as number)).toBeLessThanOrEqual(8);
    expect(screen.getByLabelText(composition.finalPhase.label).props.hitSlop).toBeUndefined();
    expect(StyleSheet.flatten(within(pill).getByText("10″").props.style)).toMatchObject({
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
    // PRE-9 B.2 — D-451, COMP §1 : le Circuit n'est rendu qu'avec au moins un Exercice.
    renderScreenWithDraft([anActivity("circuit-member", "IN_TOUR")]);

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
    // celui de la carte d'Exercice. PRE-6 story 5.2 (D-435, `9819:19906`) : rayon 18.
    expect(tourSectionStyle.borderRadius).toBe(18);
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

  // PRE-6 (story 2.2, `5544:6797`) : nom de l'occurrence en Inter Semi Bold 15, une ligne.
  // PRE-9 B.1a (D-451, complément du 28/10 ; référence §4) : le nom du Circuit passe à 15 (16 avant).
  it("PRE6-2.2 — the occurrence name is Inter Semi Bold 15 on one line; the Circuit name is 15 (PRE-9 B.1a)", () => {
    // PRE-9 B.2 — D-451, COMP §1 : un Exercice dans le Circuit, pour que le Circuit soit rendu.
    renderScreenWithDraft([
      { ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) },
      anActivity("circuit-member", "IN_TOUR"),
    ]);

    const name = within(screen.getByTestId("composition-exercise-row-ex-1")).getByText("Gainage");
    expect(name.props.numberOfLines).toBe(1);
    expect(StyleSheet.flatten(name.props.style)).toMatchObject({ ...type.listCardTitle, color: colors.textPrimary });

    const tourLabel = within(screen.getByTestId("composition-circuit-header")).getByText(
      composition.circuit.title,
    );
    expect(StyleSheet.flatten(tourLabel.props.style).fontSize).toBe(15);
  });

  // D-511 (08/11/2026) : prescription Semi Bold 12 `text-primary`, à droite de la ligne 2, sans chronomètre.
  // [PRE-6 (story 5.1) : synthèse Regular 12 #7A7A80 après le symbole de durée 13 — remplacé le 08/11/2026.]
  it("D-511 — the prescription is Inter Semi Bold 12 text-primary, last on line 2, with no stopwatch", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]);

    const summary = within(screen.getByTestId("composition-exercise-row-ex-1")).getByText("45″");
    expect(summary.props.numberOfLines).toBe(1);
    expect(StyleSheet.flatten(summary.props.style)).toMatchObject({
      fontFamily: "Inter_600SemiBold",
      fontSize: 12,
      color: colors.textPrimary,
    });
    expect(screen.queryByTestId("composition-exercise-work-symbol")).toBeNull();
    const row = screen.getByTestId("composition-exercise-work-row");
    expect(testIdOrder(screen.toJSON(), ["composition-exercise-work-row", "composition-exercise-summary", "composition-exercise-zones-line"])).toEqual([
      "composition-exercise-work-row",
      "composition-exercise-summary",
      "composition-exercise-zones-line",
    ]);
    expect(within(row).getByTestId("composition-exercise-summary").props.children).toBe("45″");
  });

  // PRE-6 (story 3.1, Figma `8328:28667`) : l'en-tête du Circuit n'a plus d'icône Tour (R4-11 /
  // REWORK12 retirés) — absence vérifiée par le test « PRE6-3.1 — Circuit header ».

  it("R4-12 — the Tour Section container is wider than its inner card (breaks out of body's own padding by the canonical inset on each side)", () => {
    // PRE-9 B.2 — D-451, COMP §1 : le Circuit n'est rendu qu'avec au moins un Exercice.
    renderScreenWithDraft([anActivity("circuit-member", "IN_TOUR")]);

    const container = screen.getByTestId("composition-tour-section");
    const flattened = StyleSheet.flatten(container.props.style);
    // PRE-6 story 5.2 (D-435, `9819:19906`) : Circuit de 386 à x 8 — 16 de chaque côté de la
    // colonne, 8 au-delà des cartes (370 à x 16), dont le contenu revient à la colonne.
    expect(flattened.marginHorizontal).toBe(-16);
    expect(flattened.paddingHorizontal).toBe(16);
    // Recette PRE-8 A/B (A01) : marge standard de 16 (auparavant 24).
    expect(StyleSheet.flatten(screen.getByTestId("composition-body").props.contentContainerStyle)).toMatchObject({
      paddingLeft: 16,
      paddingRight: 16,
    });
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
    // PRE-9 B.2 — D-451, COMP §1 : le Circuit n'est rendu qu'avec au moins un Exercice.
    renderScreenWithDraft([anActivity("circuit-member", "IN_TOUR")]);

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

  // [Test de la roulette dans `WheelPickerOverlay` (T01-S09 point D) — retiré le 07/11/2026 : bornes saisies au clavier.]

  // PRE-6 story 7.10 (D-444, remplace S-08 et le pied de la story 7.9) : zone d'action principale
  // fixe — en absolu au bas de l'écran, zone protégée de 114 (encart 34), bouton centré (correctif J6f), dégradé blanc ;
  // le corps défilant réserve toute sa hauteur (24 + 48 + 42 = 114 avec l'encart de test 34).
  it("story 7.10 — fixed primary action zone: absolute at the bottom, button 8 above the safe area, scroll reserve = zone height", () => {
    renderScreen();
    const zone = StyleSheet.flatten(screen.getByTestId("composition-bottom-action").props.style);
    // Correctif J6f (D-444) : bouton centré dans la zone protégée — 33 au-dessus et au-dessous avec l'encart de test 34 (zone 114).
    expect(zone).toMatchObject({ position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 33, paddingBottom: 33 });
    expect(screen.getByTestId("composition-bottom-action").props.pointerEvents).toBe("box-none");
    const scrollContent = StyleSheet.flatten(screen.getByTestId("composition-body").props.contentContainerStyle);
    expect(scrollContent.paddingBottom).toBe(24 + 48 + 34 + 8);
    expect(finalActionZoneHeight(34)).toBe(114);
    // Le dégradé couvre toute la zone, sans capter de toucher.
    const gradient = screen.getByTestId("composition-bottom-action-gradient");
    expect(gradient.props.pointerEvents).toBe("none");
    expect(StyleSheet.flatten(gradient.props.style)).toMatchObject({
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      experimental_backgroundImage: "linear-gradient(to bottom, #FFFFFF00 0%, #FFFFFF 100%)",
    });
  });

  it("story 7.10 — « Continuer » has the format of « Terminer »: 48 high, radius 24, shadow G-8, side margins 16 (A01, recette PRE-8 A/B)", () => {
    renderScreen();
    const button = StyleSheet.flatten(screen.getByTestId("composition-save-action").props.style);
    expect(button).toMatchObject({ ...FINAL_ACTION_BUTTON, backgroundColor: colors.disabled });
    expect(button).toMatchObject({ minHeight: 48, borderRadius: 24, shadowColor: "#1A1A26", shadowOpacity: 0.18, shadowRadius: 10 });
    expect(StyleSheet.flatten(screen.getByTestId("composition-bottom-action").props.style).paddingHorizontal).toBe(16);
  });

  it("story 7.10 — « Continuer » enabled for a valid Composition: primary, still in the format of « Terminer »", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) }]);
    const button = screen.getByTestId("composition-save-action");
    expect(button.props.accessibilityState).toMatchObject({ disabled: false });
    expect(StyleSheet.flatten(button.props.style)).toMatchObject({ backgroundColor: colors.primary, minHeight: 48, shadowColor: "#1A1A26" });
    expect(finalActionBottomMargin(0)).toBe(16);
  });
});

describe("CompositionScreen — fermeture par toucher en dehors (CMP-01, backdrop dédié, correction D-03)", () => {
  it("renders no dismissing backdrop while no selector is open (non-interactive root, correction of the previous full-screen root Pressable)", () => {
    renderScreen();
    expect(screen.queryByTestId("composition-backdrop")).toBeNull();
  });

  // [Test de la roulette dans `WheelPickerOverlay` (T01-S09 point D) — retiré le 07/11/2026 : bornes saisies au clavier.]

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

  it("PRE-7 R-5 (C01, report R-3) — nom de mouvement déjà pris à l'enregistrement : message propre, pas l'erreur générique", async () => {
    const service = {
      createSession: jest.fn(async () => {
        throw new DuplicateMovementNameError("gainage");
      }),
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
    expect(screen.getByTestId("composition-save-error").props.children).toBe(composition.nameTakenError);
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

  it("recette du 28/10 (e5-12, r2-02) : an archived Séance opens in this Composition, read-only", () => {
    const archived = {
      ...emptyEditDraft(),
      name: "Séance archivée",
      exercises: [{ ...createExerciseDraft("keep-1"), name: "Gainage", executionParameters: durationParameters(30) }],
    };
    renderWithEditStatus("consulting", { draft: archived, hydratedBaseline: archived }, "s-archived");

    // Recette E (28/10) : the screen title reads « Séance archivée ».
    expect(screen.getByText("Séance archivée")).toBeTruthy();
    expect(screen.queryByText(composition.title)).toBeNull();
    // The real Composition is shown: same name field and exercise card…
    expect(screen.getByLabelText(composition.name)).toBeTruthy();
    expect(screen.getByText("Gainage")).toBeTruthy();
    expect(screen.queryByTestId("composition-edit-state")).toBeNull();
    // …but nothing receives a touch, and « Continuer » gives way to the consultation notice.
    const frames = screen.getAllByTestId("composition-read-only");
    expect(frames.length).toBe(2);
    for (const frame of frames) expect(frame.props.pointerEvents).toBe("none");
    expect(screen.queryByTestId("composition-save-action")).toBeNull();
    expect(screen.getByTestId("composition-read-only-notice")).toHaveTextContent(
      "Séance archivée : consultation seule. Restaurez-la depuis le Catalogue pour la modifier.",
    );
  });

  it("outside consultation, no read-only frame is rendered", () => {
    renderWithEditStatus("ready", { draft: { ...emptyEditDraft(), name: "Séance" } });

    expect(screen.queryByTestId("composition-read-only")).toBeNull();
    expect(screen.getByTestId("composition-save-action")).toBeTruthy();
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
      expect(screen.queryByText("10″")).toBeNull();
      expect(screen.queryByText("5″")).toBeNull();
      expect(screen.queryByTestId("composition-session-duration")).toBeNull();
    });

    it("without a sessionId, 'creating' still renders the creation form — the creation path is strictly unchanged", () => {
      renderWithEditStatus("creating", {}, null);

      expect(screen.getByLabelText(composition.name)).toBeTruthy();
      expect(screen.getByTestId("composition-session-duration").props.children).toBe("0″");
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

  // PRE-6 story 5.2 (D-435, Standard `8328:28605`) : écart 8 hors Circuit (6 auparavant), cartes de
  // 370 à x 16 — la liste déborde de 8 de chaque côté de la colonne.
  // Demande de Hermann du 08/11/2026 (D-511, écran `11789:21914`) : cartes de 362 à x 20 — débord de 4. [370 à x 16 — remplacé.]
  it("PRE6-5.2 — the gap between two consecutive Activity cards is 8 outside the Circuit, carried by their own dedicated container (D-511: cards 362 at x 20)", () => {
    renderScreenWithDraft(twoActivities);

    const list = screen.getByTestId("composition-zone-before-tour");
    expect(StyleSheet.flatten(list.props.style).gap).toBe(spacing[8]);
    expect(StyleSheet.flatten(list.props.style).marginHorizontal).toBe(-4);
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
    // PRE-6 story 5.2 (D-435) : 8.
    expect(content.gap).toBe(spacing[8]);
    expect(content.gap).not.toBe(16);
  });

  it("keeps Compte à rebours initial, the Tour section and Fin de séance OUTSIDE the reduced-gap container — they are direct children of the scrollable content, which now carries the SAME gap", () => {
    // PRE-9 B.2 — D-451, COMP §1 : le Circuit n'est rendu qu'avec au moins un Exercice.
    renderScreenWithDraft([...twoActivities, anActivity("circuit-member", "IN_TOUR")]);

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
  // PRE-6 story 7.7 : actions glissées animées (pilote JS, minuteurs simulés).
  swipeMotion();
  const activityWithZones = {
    ...createExerciseDraft("ex-1"),
    name: "Gainage",
    executionParameters: durationParameters(90, 3, 15),
    // Ordre de SÉLECTION volontairement inverse de l'ordre du référentiel
    // (`epaules` order 1, `dos` order 4) — prouve que l'affichage suit le
    // référentiel, jamais l'ordre de sélection de l'utilisateur.
    bodyZoneIds: ["dos", "epaules"],
  };
  const summaryText = "3 × 1′30″";

  it("shows the Activity's own body zones on the single classification line, in referential order, with the canonical ' · ' separator", async () => {
    renderScreenWithDraft([activityWithZones]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    const zones = await within(row).findByTestId("composition-exercise-body-zones");
    expect(zones.props.children).toBe("Épaules · Dos");
    // PRE-6 (story 5.1, D-435) : Zones seules sur la ligne 3, une ligne, tronquées si nécessaire.
    expect(zones.props.numberOfLines).toBe(1);
    expect(within(screen.getByTestId("composition-exercise-zones-line")).getByTestId("composition-exercise-body-zones")).toBe(zones);
  });

  // D-511 (08/11/2026) : prescription en ligne 2, zones en ligne 3. [Zones avant la synthèse (colonne des valeurs) — remplacé.]
  it("D-511 — name on line 1, prescription on line 2, zones on line 3", async () => {
    renderScreenWithDraft([activityWithZones]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    await within(row).findByTestId("composition-exercise-body-zones");

    const order = textOrder(screen.toJSON(), ["Gainage", summaryText, "Épaules · Dos"]);
    expect(order).toEqual(["Gainage", summaryText, "Épaules · Dos"]);
  });

  // PRE-6 (story 5.1, D-435, `9798:19919`, `9798:19922`) : Zones en Inter Regular 12 #7A7A80 sur la
  // ligne 3, après leur pastille 13 (écart 6), coupées avant la colonne des symboles ; la synthèse
  // reste sur la ligne 2, dans la colonne de droite.
  // D-511 (08/11/2026) : zones à gauche de la ligne 3 (y 48), pastille 13 centrée dans la colonne de 10 ; prescription en ligne 2.
  it("D-511 — zones are Inter Regular 12 tertiary on line 3 after their 13 badge (10 column); the prescription stays on line 2", async () => {
    renderScreenWithDraft([activityWithZones]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    const zones = await within(row).findByTestId("composition-exercise-body-zones");
    expect(StyleSheet.flatten(zones.props.style)).toMatchObject({
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: TEXT_TERTIARY,
      flex: 1,
    });
    const zonesLine = within(row).getByTestId("composition-exercise-zones-line");
    expect(StyleSheet.flatten(zonesLine.props.style)).toMatchObject({ flexDirection: "row", top: 48, height: 16 });
    const badge = within(zonesLine).getByTestId("composition-exercise-body-zones-badge");
    expect(StyleSheet.flatten(badge.props.style)).toMatchObject({ width: 13, height: 13 });
    expect(StyleSheet.flatten(within(zonesLine).getByTestId("composition-exercise-body-zones-column").props.style).width).toBe(10);
    const summary = within(row).getByTestId("composition-exercise-summary");
    expect(summary.props.children).toBe(summaryText);
    expect(within(zonesLine).queryByTestId("composition-exercise-summary")).toBeNull();
    expect(within(within(row).getByTestId("composition-exercise-work-row")).getByTestId("composition-exercise-summary").props.children).toBe(summaryText);
  });

  it("without a body zone nor a Category, both lines stay (empty), without badge, and the card height does not change", () => {
    renderScreenWithDraft([
      { ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) },
    ]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    expect(within(row).queryByTestId("composition-exercise-body-zones")).toBeNull();
    expect(within(row).queryByTestId("composition-exercise-body-zones-badge")).toBeNull();
    expect(within(row).queryByTestId("composition-exercise-category-badge")).toBeNull();
    expect(within(row).getByTestId("composition-exercise-work-row")).toBeTruthy();
    expect(within(row).getByTestId("composition-exercise-zones-line")).toBeTruthy();
    expect(StyleSheet.flatten(row.props.style).height).toBe(72);
  });

  // PRE-6 (story 5.1, D-435, `9798:19913`, `9798:19916`) : pastille de Catégorie 13 (dessin Figma,
  // sans la couleur de Catégorie) puis Catégorie en Regular 12 #7A7A80 sur la ligne 2 ; Zones sur la
  // ligne 3, jamais concaténées à la Catégorie.
  it("PRE6-5.1 — with a Category: 13 badge then the Category (Regular 12, #7A7A80) on line 2; zones on line 3", async () => {
    renderScreenWithDraft([{ ...activityWithZones, categoryId: "renforcement" }]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    const category = await within(row).findByTestId("composition-exercise-category");
    expect(category.props.children).toBe("Renforcement");
    expect(category.props.numberOfLines).toBe(1);
    expect(StyleSheet.flatten(category.props.style)).toMatchObject({
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: TEXT_TERTIARY,
    });
    const classification = within(row).getByTestId("composition-exercise-work-row");
    const badge = within(classification).getByTestId("composition-exercise-category-badge");
    expect(StyleSheet.flatten(badge.props.style)).toMatchObject({ width: 13, height: 13 });
    expect(within(row).queryByTestId("composition-exercise-category-dot")).toBeNull();
    expect(within(classification).queryByTestId("composition-exercise-body-zones")).toBeNull();
    expect(
      within(within(row).getByTestId("composition-exercise-zones-line")).getByTestId("composition-exercise-body-zones").props
        .children,
    ).toBe("Épaules · Dos");
  });

  it("PRE6-5.1 — with a Category but no zone: line 2 carries the Category, line 3 has no zone badge", async () => {
    renderScreenWithDraft([
      // PRE-7 (R-3) : vue d'un Mouvement déjà référencé, rendu seul (sans Zone) — hors création locale.
      { ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45), categoryId: "renforcement", sourceMovementId: "mov-gainage" },
    ]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    await within(row).findByTestId("composition-exercise-category");
    expect(within(row).queryByTestId("composition-exercise-body-zones-badge")).toBeNull();
    expect(within(row).queryByTestId("composition-exercise-body-zones")).toBeNull();
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

    // PRE-6 story 2.1 : les bornes sont des étapes (Figma `8328:28636`), inchangées par la ligne.
    // PRE-6 story 5.2 (`9819:19907`, `9819:20050`) : Compte à rebours 27, Fin de séance 24.
    // Revue 5.3 : encombrement = boîte tactile de 44 + marges négatives.
    const footprint = (node: typeof countdown) => {
      const style = StyleSheet.flatten(node.props.style);
      return (style.height as number) + (style.marginTop as number) + (style.marginBottom as number);
    };
    expect(footprint(countdown)).toBe(27);
    expect(footprint(finalPhase)).toBe(24);
  });
});

/* ------------------------------------------------------------------------ *
 * T02-S01 — Composition complète (CE-T02-01/CE-T02-02, D-124/D-127/D-129/
 * D-130, AC-01 à AC-11).
 * ------------------------------------------------------------------------ */

/**
 * PRE-6 story 7.2 (D-442) : dialogue natif « Début de tour / Fin de tour / Annuler » (`Alert.alert`,
 * espionné). `tourChoiceAlert()` installe l'espion ; `answerTourChoice` presse un bouton du dernier
 * dialogue affiché.
 */
function tourChoiceAlert() {
  return jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
}
function answerTourChoice(alert: ReturnType<typeof tourChoiceAlert>, label: string) {
  const call = alert.mock.calls.at(-1);
  if (call === undefined) throw new Error("aucun dialogue de choix de Tour");
  const button = (call[2] as AlertButton[]).find((candidate) => candidate.text === label);
  if (button?.onPress === undefined) throw new Error(`bouton absent : ${label}`);
  act(() => button.onPress!());
}

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
/**
 * PRE-6 story 7.5 : sous Jest, une animation sur le pilote natif (simulé) ne se termine jamais ; la
 * suppression animée (fondu, glissement) est rejouée sur le pilote JS, mêmes durées. Rend la remise
 * en état.
 */
function jsDrivenAnimations(): () => void {
  // Déjà actif (`swipeMotion()` du `describe`) : rien de plus.
  if (jest.isMockFunction(Animated.timing)) return () => undefined;
  jest.useFakeTimers();
  const realTiming = Animated.timing;
  const spy = jest.spyOn(Animated, "timing").mockImplementation((value, config) => realTiming(value, { ...config, useNativeDriver: false }));
  return () => {
    spy.mockRestore();
    jest.useRealTimers();
  };
}

/** PRE-6 story 7.5 : laisse se dérouler une suppression animée (fondu, puis glissement). */
function finishDeletionAnimation() {
  for (let pass = 0; pass < 3; pass += 1) {
    act(() => {
      jest.advanceTimersByTime(400);
    });
  }
}

/**
 * PRE-6 story 7.7 : la carte rejoint sa position de repos par une animation (actions glissées) ;
 * sous `swipeMotion()` (pilote JS, minuteurs simulés), les gestes la laissent se terminer.
 */
let swipeMotionDriven = false;
function settleMotion() {
  if (!swipeMotionDriven) return;
  act(() => {
    jest.advanceTimersByTime(600);
  });
}
/** Dans un `describe` : animations de la carte rejouées sur le pilote JS, minuteurs simulés. */
function swipeMotion() {
  let restore: (() => void) | null = null;
  beforeEach(() => {
    restore = jsDrivenAnimations();
    swipeMotionDriven = true;
  });
  afterEach(() => {
    swipeMotionDriven = false;
    restore?.();
  });
}

function fireSwipe(activityId: string, deltaX: number) {
  const container = () => screen.getByTestId(`composition-activity-${activityId}`);
  const startX = 300;
  fireEvent(container(), "touchStart", { nativeEvent: { pageX: startX, pageY: 100 } });
  fireEvent(container(), "touchMove", {
    nativeEvent: { pageX: startX + deltaX, pageY: 100 },
  });
  fireEvent(container(), "touchEnd", { nativeEvent: { pageX: startX + deltaX, pageY: 100 } });
  settleMotion();
}

/** Balayage GAUCHE, au-delà de la moitié de la course — révèle `Dupliquer`/`Supprimer`. */
function fireSwipeLeft(activityId: string) {
  fireSwipe(activityId, -80);
}

/** Balayage DROIT, au-delà de la moitié de la course — masque les actions révélées. */
function fireSwipeRight(activityId: string) {
  fireSwipe(activityId, 80);
}

describe("CompositionScreen — suffixe de niveau « - Nn » (PRE-7 R-6, D-445 C06, MFN-10)", () => {
  // Demande de Hermann du 08/11/2026 (D-511) : le niveau s'affiche à droite de la ligne 1 (« Niveau 2 ») ; le nom visible garde le
  // suffixe de copie. Le nom accessible garde « nom - Nn (copie n) ». [Nom visible « nom - Nn » — remplacé le 08/11/2026.]
  it("D-511 — level « Niveau N » on the right of line 1, visible name with the copy suffix only; accessible name unchanged; no level: nothing on the right", async () => {
    const listMovementLevelPositions = jest
      .fn<ActivityDefinitionService["listMovementLevelPositions"]>()
      .mockResolvedValue(new Map([["mov-squats", { rank: 2, total: 3 }]]));
    render(
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService({ listMovementLevelPositions })}>
          <ReferentialServiceContext.Provider value={fakeReferentialService()}>
            <StatefulDraftWrapper
              initialExercises={[
                { ...createExerciseDraft("ex-1"), name: "Squats", executionParameters: durationParameters(30, 3, 10), sourceMovementId: "mov-squats", copyNumber: 2 },
                { ...createExerciseDraft("ex-2"), name: "Pompes", executionParameters: durationParameters(30, 3, 10), sourceMovementId: "mov-alone" },
              ]}
            >
              <CompositionScreen />
            </StatefulDraftWrapper>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
    await waitFor(() => expect(listMovementLevelPositions).toHaveBeenCalled());
    const squats = screen.getByTestId("composition-exercise-row-ex-1");
    await waitFor(() => expect(within(squats).getByTestId("composition-exercise-level").props.children).toBe("Niveau 2"));
    expect(within(squats).getByTestId("composition-exercise-name").props.children).toBe("Squats (copie 2)");
    expect(squats.props.accessibilityLabel).toContain("Squats - N2 (copie 2)");
    const alone = screen.getByTestId("composition-exercise-row-ex-2");
    expect(within(alone).getByTestId("composition-exercise-name").props.children).toBe("Pompes");
    expect(within(alone).queryByTestId("composition-exercise-level")).toBeNull();
  });
});

describe("CompositionScreen — trois zones structurelles (T02-S01, AC-01)", () => {
  // PRE-6 story 7.7 : actions glissées animées (pilote JS, minuteurs simulés).
  swipeMotion();
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
   * balayage) — seule une carte DANS le Tour montre le fond du Circuit (PRE-6 story 5.2 : l'aplat
   * `#F3F4F9`, D5 ; `tourSurface` inchangé).
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
    ).toBe("#EBEDF5");
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

  // [AC-02 : « a short press opens the Activity for editing » — remplacé par la recette iPhone n° 2 du
  // 31/10/2026 (constat c) : l'appui court sur la carte ouvre les paramètres d'exécution ; la photo ouvre
  // l'Exercice.]
  it("AC-02 — a short press opens the execution parameters; the photo opens the Activity for editing", async () => {
    renderScreenWithDraft(twoActivities);

    fireEvent.press(screen.getByTestId("composition-exercise-row-ex-2"));
    await act(async () => undefined);
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    await act(async () => undefined);
    fireEvent.press(screen.getByTestId("composition-exercise-media-button-ex-2"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/exercise-sheet", // [04/11/2026 : la photo ouvre la fiche en lecture seule, décision de Hermann — remplace « /exercise ».]
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
    // PRE-6 (story 5.1, D-435) : rayon unique de la carte d'occurrence v2 (12 ; 14 en story 2.2).
    expect(liftedStyle.borderRadius).toBe(12);
    expect(liftedStyle.shadowColor).toBe(colors.compositionDraggedCardShadow);
    expect(liftedStyle.shadowOpacity).toBe(0.22);
    expect(liftedStyle.marginHorizontal).toBe(-4);
  });

  it("correctif 2.3b — la zone qui porte la carte soulevée passe au-dessus de ses sœurs, jamais les autres", async () => {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage" }),
      anActivity("core", "IN_TOUR", { name: "Pompes" }),
      anActivity("ex-3", "AFTER_TOUR", { name: "Squats" }),
    ]);
    const zIndexOf = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style).zIndex;

    expect(zIndexOf("composition-zone-before-tour")).toBeUndefined();
    expect(zIndexOf("composition-tour-section")).toBeUndefined();

    const rowBackground = (testID: string) =>
      StyleSheet.flatten(screen.getByTestId(testID).props.style).backgroundColor;
    expect(rowBackground("composition-activity-ex-1")).toBe(colors.background);
    expect(rowBackground("composition-activity-core")).toBe("#EBEDF5");

    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");
    // La rangée soulevée, restée à sa place, ne masque plus la voisine qui remonte dans la place libérée.
    expect(rowBackground("composition-activity-ex-1")).toBe("transparent");
    expect(zIndexOf("composition-zone-before-tour")).toBe(1);
    expect(zIndexOf("composition-tour-section")).toBeUndefined();
    expect(zIndexOf("composition-zone-after-tour")).toBeUndefined();
    fireEvent(screen.getByTestId("composition-activity-ex-1"), "responderTerminate", {});
    // Story 5.2b : la carte reste au premier plan jusqu'à la fin de son retour (ici, rien à animer).
    expect(rowBackground("composition-activity-ex-1")).toBe("transparent");
    await act(async () => {});

    expect(rowBackground("composition-activity-ex-1")).toBe(colors.background);
    expect(zIndexOf("composition-zone-before-tour")).toBeUndefined();

    fireEvent(screen.getByTestId("composition-exercise-row-core"), "longPress");
    expect(rowBackground("composition-activity-core")).toBe("transparent");
    expect(zIndexOf("composition-tour-section")).toBe(1);
    expect(zIndexOf("composition-zone-before-tour")).toBeUndefined();
    expect(zIndexOf("composition-zone-after-tour")).toBeUndefined();
  });

  it("CE-T02-02 — the other cards, the Tour and the structural rows keep their exact style while a card is lifted", () => {
    // PRE-9 B.2 — D-451, COMP §1 : le Circuit n'est rendu qu'avec au moins un Exercice.
    renderScreenWithDraft([...twoActivities, anActivity("circuit-member", "IN_TOUR")]);

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

  // PRE-6 story 5.1 (D-435) : plus de poignée ; [le média n'est qu'un repère, sans cible propre — remplacé
  // par la recette iPhone n° 2 du 31/10/2026 (constat c) : la photo est un bouton « Ouvrir le mouvement »].
  it("AC-03 — the long press is recognized on the whole card; no handle; the photo is its own « Ouvrir le mouvement » button", () => {
    renderScreenWithDraft(twoActivities);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    expect(within(row).queryByTestId("composition-boundary-handle-slot")).toBeNull();
    const photo = screen.getByTestId("composition-exercise-media-button-ex-1");
    expect(photo.props.accessibilityLabel).toBe(composition.exerciseRow.openMovementAccessibilityLabel);
    fireEvent.press(photo);
    expect(mockPush).toHaveBeenCalledTimes(1);
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
    // PRE-9 B.2 — D-451, COMP §1 : le Circuit n'existe qu'avec un Exercice — `ex-3`, à 290–360 en absolu.
    fireLayout(screen.getByTestId("composition-zone-in-tour"), 60, 70);
    fireLayout(screen.getByTestId("composition-activity-ex-3"), 0, 70);
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
      anActivity("ex-3", "IN_TOUR", { name: "Pompes" }),
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
  // PRE-6 story 7.7 : ouverture, fermeture et retour animés.
  swipeMotion();
  function renderTwo() {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", bodyZoneIds: ["dos"] }),
      // PRE-7 (R-3) : vue d'un Mouvement déjà référencé (sans Zone) — hors création locale.
      anActivity("ex-2", "BEFORE_TOUR", { name: "Squats", sourceMovementId: "mov-squats" }),
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
    // PRE-6 (story 5.1, D-435) : même rayon que la carte v2 (12 ; 14 en story 2.2).
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

  /** PRE-6 story 7.7 (D-443) : la carte rejoint sa position de repos sans arrêt brutal. */
  it("story 7.7 — ouverture, fermeture et retour : la carte rejoint sa position de repos en décélérant, les actions restent dessous jusqu'à la fin", () => {
    renderTwo();
    const container = () => screen.getByTestId("composition-activity-ex-1");
    const x = () =>
      (StyleSheet.flatten(screen.getByTestId("composition-exercise-row-ex-1").props.style).transform as Record<string, number>[])[0]!
        .translateX;
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 300, pageY: 100 } });
    fireEvent(container(), "touchMove", { nativeEvent: { pageX: 210, pageY: 100 } });
    expect(x()).toBe(-90);
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 210, pageY: 100 } });
    // Ouverture : pas de saut à -154, un mouvement qui ralentit.
    expect(x()).toBe(-90);
    act(() => {
      jest.advanceTimersByTime(80);
    });
    const early = x();
    act(() => {
      jest.advanceTimersByTime(80);
    });
    const later = x();
    expect(early).toBeLessThan(-90);
    expect(-90 - early).toBeGreaterThan(early - later);
    settleMotion();
    expect(x()).toBe(-154);
    // Fermeture (balayage droit en deçà du seuil d'ouverture) : les actions restent visibles
    // derrière la carte jusqu'à la fin du retour.
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 100, pageY: 100 } });
    fireEvent(container(), "touchMove", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 200, pageY: 100 } });
    act(() => {
      jest.advanceTimersByTime(80);
    });
    expect(x()).toBeLessThan(0);
    // Revue 7.7 : dessous, mais inertes et masquées à VoiceOver pendant le retour.
    const closing = screen.getByTestId("composition-activity-actions-ex-1", { includeHiddenElements: true });
    expect(closing.props.pointerEvents).toBe("none");
    expect(closing.props.accessibilityElementsHidden).toBe(true);
    settleMotion();
    expect(x()).toBe(0);
    expect(screen.queryByTestId("composition-activity-actions-ex-1")).toBeNull();
  });

  it("story 7.7 — « Réduire les animations » : la carte est posée ouverte ou fermée sans mouvement", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    renderTwo();
    await act(async () => {
      await Promise.resolve();
    });
    const container = () => screen.getByTestId("composition-activity-ex-1");
    const x = () =>
      (StyleSheet.flatten(screen.getByTestId("composition-exercise-row-ex-1").props.style).transform as Record<string, number>[])[0]!
        .translateX;
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 300, pageY: 100 } });
    fireEvent(container(), "touchMove", { nativeEvent: { pageX: 210, pageY: 100 } });
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 210, pageY: 100 } });
    expect(x()).toBe(-154);
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 100, pageY: 100 } });
    fireEvent(container(), "touchMove", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 200, pageY: 100 } });
    expect(x()).toBe(0);
    expect(screen.queryByTestId("composition-activity-actions-ex-1", { includeHiddenElements: true })).toBeNull();
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
    // Recette iPhone n° 2 du 31/10/2026 (constat c) : la photo, bouton distinct, est bloquée de même.
    fireEvent.press(screen.getByTestId("composition-exercise-media-button-ex-2"));
    expect(mockPush).not.toHaveBeenCalled();

    // Une fois refermée, l'autre carte redevient interactive.
    fireSwipeRight("ex-1");
    expect(
      screen.getByTestId("composition-activity-ex-2").props.pointerEvents,
    ).toBe("auto");
    fireEvent.press(screen.getByTestId("composition-exercise-media-button-ex-2"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/exercise-sheet", // [04/11/2026 : la photo ouvre la fiche en lecture seule, décision de Hermann — remplace « /exercise ».]
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

    settleMotion();
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

    settleMotion();
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

    settleMotion();
    expect(screen.queryByTestId("composition-activity-actions-ex-1")).toBeNull();
  });

  it("drops the pending swipe when the TOUCH itself is cancelled — no ghost action on the next release", () => {
    renderTwo();

    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 300, pageY: 100 } });
    fireEvent(container(), "touchMove", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(container(), "touchCancel", {});
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 200, pageY: 100 } });

    settleMotion();
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
    settleMotion();
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
    settleMotion();
    expect(screen.queryByTestId("composition-activity-actions-ex-1")).toBeNull();
  });

  it("AC-06 (T02-S02) — Dupliquer copies the attached Récupération, sub-card included", () => {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: 90 }),
    ]);

    // PRE-6 story 5.1 (D-435) : une récupération en ligne 3 de la carte, sans rangée sous la carte.
    expect(screen.getAllByTestId(/^composition-activity-recovery-.*-recovery$/u)).toHaveLength(1);
    expect(screen.queryByTestId("composition-activity-recovery-ex-1")).toBeNull();

    fireSwipeLeft("ex-1");
    fireEvent.press(screen.getByTestId("composition-activity-duplicate-ex-1"));

    // La copie porte SA PROPRE récupération, à la même valeur.
    expect(screen.getByTestId("composition-activity-recovery-generated-copy-id-recovery")).toBeTruthy();
    expect(screen.getAllByText("1′30″")).toHaveLength(2);
  });

  it("AC-07 — Supprimer removes ONLY the targeted Activity (story 7.5 : after the fade and the slide)", () => {
    const restoreTiming = jsDrivenAnimations();
    try {
      renderTwo();
      fireSwipeLeft("ex-1");
      fireEvent.press(screen.getByTestId("composition-activity-delete-ex-1"));

      finishDeletionAnimation();
      expect(screen.queryByTestId("composition-exercise-row-ex-1")).toBeNull();
      expect(screen.getByTestId("composition-exercise-row-ex-2")).toBeTruthy();
      expect(screen.queryByText("Gainage")).toBeNull();
      expect(screen.getByText("Squats")).toBeTruthy();
    } finally {
      restoreTiming();
    }
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
  const restoreTiming = jsDrivenAnimations();
  try {
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

    finishDeletionAnimation();
    expect(screen.queryByTestId("composition-exercise-row-ex-1")).toBeNull();
    expect(
      screen.getByLabelText(composition.saveAction).props.accessibilityState,
    ).toMatchObject({ disabled: true });
  } finally {
    restoreTiming();
  }
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
    // PRE-6 story 5.2 (D-435, `8328:28605`) : écart 8 (6 depuis T02-S02), très en deçà du `16`
    // structurel.
    expect(cardsGap).toBe(spacing[8]);
    expect(bodyContentGap).toBeLessThan(spacing[16]);
  });
});

/**
 * **T02-S02 — bloc Activité + Récupération** (D-095/D-128/D-129/D-138 ;
 * CE-T01-09, CE-T02-01/CE-T02-02).
 */
/**
 * PRE-6 story 5.1 (D-435, choix D1, D2 et D7 de l'epic 5, Figma `9798:44464`, `8328:28605`) : la
 * récupération quitte la ligne structurelle sous la carte (story 2.1) pour la ligne 3 de la carte
 * v2 (sablier + valeur sans préfixe, calée à droite) ; R absente ou R = 0 : ni sablier ni valeur.
 * Plus de trait de démarcation ; hors placement, la rangée sous la carte n'existe que pour un point
 * d'arrêt (rendu provisoire jusqu'à la story 5.2). La carte fait 80 dans toutes les variantes.
 */
describe("CompositionScreen — carte v2 : récupération en ligne 3 et géométrie (PRE-6 story 5.1, révise les stories 2.1 et 2.2)", () => {
  // PRE-6 story 7.7 : actions glissées animées (pilote JS, minuteurs simulés).
  swipeMotion();
  const withZeroRecovery = [anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage" })];
  const withRecovery = [
    anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: 90 }),
  ];
  const pointAfter = (position: number) => ({ id: `p${position}`, scope: "BEFORE_TOUR" as const, position });

  function blockStyle(activityId = "ex-1") {
    return StyleSheet.flatten(
      screen.getByTestId(`composition-exercise-row-${activityId}`).props.style,
    );
  }

  it("PRE6-5.1 — R = 0 ou R absente, sans point : ni sablier ni valeur en ligne 3, aucune rangée sous la carte (D2)", () => {
    for (const recovery of [0, null] as const) {
      const view = renderScreenWithDraft([
        anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: recovery }),
        anActivity("ex-2", "BEFORE_TOUR", { name: "Planche" }),
      ]);

      expect(screen.queryByTestId("composition-activity-recovery-ex-1")).toBeNull();
      expect(screen.queryByTestId("composition-activity-recovery-slot-ex-1")).toBeNull();
      expect(screen.queryByTestId("composition-activity-recovery-ex-1-recovery")).toBeNull();
      expect(screen.queryAllByTestId("composition-recovery-line-icon")).toHaveLength(0);
      expect(screen.queryByText(/Récupération/u)).toBeNull();
      // D-511 : la ligne 3 garde sa place dans la carte, sans sablier ni valeur.
      const zonesLine = within(screen.getByTestId("composition-exercise-row-ex-1")).getByTestId("composition-exercise-zones-line");
      expect(within(zonesLine).queryByTestId("composition-recovery-line-label")).toBeNull();
      view.unmount();
    }
  });

  it("PRE6-5.1 / 6.2 — R > 0 : sablier + valeur en ligne 3 de la carte ; un point a sa propre rangée après la carte, sans trait", () => {
    // R > 0 seul : dans la carte, aucune rangée.
    let view = renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: 20 }),
      anActivity("ex-2", "BEFORE_TOUR", { name: "Planche" }),
    ]);
    const card = screen.getByTestId("composition-exercise-row-ex-1");
    const recovery = within(card).getByTestId("composition-activity-recovery-ex-1-recovery");
    expect(within(recovery).getByText("20″")).toBeTruthy();
    expect(screen.queryByTestId(/^composition-stop-point-/u)).toBeNull();
    expect(screen.queryByTestId("composition-activity-recovery-slot-ex-1")).toBeNull();
    view.unmount();

    // Point (R absente, puis R = 0) : rangée autonome du point, sans trait ni récupération.
    for (const recovery of [null, 0] as const) {
      view = renderScreenWithDraft(
        [
          anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: recovery }),
          anActivity("ex-2", "BEFORE_TOUR", { name: "Planche" }),
        ],
        { stopPoints: [pointAfter(1)] },
      );
      const line = screen.getByTestId("composition-stop-point-p1");
      expect(line.findAll((node) => typeof node.type === "string" && node !== line && node.props.testID !== undefined).map((node) => node.props.testID)[0]).toBe(
        "composition-stop-point-p1-chip",
      );
      expect(screen.queryByTestId("composition-recovery-line-label")).toBeNull();
      expect(screen.queryByTestId("composition-activity-recovery-slot-ex-1")).toBeNull();
      view.unmount();
    }

    // Les deux : la valeur dans la carte, le point dans sa rangée.
    renderScreenWithDraft(
      [
        anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: 20 }),
        anActivity("ex-2", "BEFORE_TOUR", { name: "Planche" }),
      ],
      { stopPoints: [pointAfter(1)] },
    );
    const line = screen.getByTestId("composition-stop-point-p1");
    expect(within(line).queryByText("20″")).toBeNull();
    expect(within(line).queryByTestId("composition-recovery-line-icon")).toBeNull();
    expect(within(screen.getByTestId("composition-exercise-row-ex-1")).getByText("20″")).toBeTruthy();
  });

  // D-511 (08/11/2026) : sablier dans la colonne de 10 puis « 20″ » Regular 12 `text-secondary`, à droite de la ligne 3.
  // [Story 5.1 : sablier sous le symbole de durée, valeur #7A7A80 — remplacé le 08/11/2026.]
  it("D-511 — R = 20: hourglass in its 10 column then « 20″ » Regular 12 text-secondary, last on line 3, no prefix", () => {
    renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: 20 })]);

    const zonesLine = screen.getByTestId("composition-exercise-zones-line");
    const recovery = within(zonesLine).getByTestId("composition-activity-recovery-ex-1-recovery");
    expect(StyleSheet.flatten(recovery.props.style)).toMatchObject({ flexDirection: "row", alignItems: "center" });
    expect(StyleSheet.flatten(within(recovery).getByTestId("composition-recovery-line-icon").props.style)).toMatchObject({
      width: 13,
      height: 13,
    });
    expect(StyleSheet.flatten(within(recovery).getByTestId("composition-recovery-line-column").props.style).width).toBe(10);
    const value = within(recovery).getByText("20″");
    expect(value.props.numberOfLines).toBe(1);
    expect(StyleSheet.flatten(value.props.style)).toMatchObject({
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: colors.textSecondary,
    });
    expect(within(zonesLine).getByTestId("composition-activity-recovery-ex-1-recovery").props.testID).toBe(recovery.props.testID);
    expect(screen.queryByText("Récupération 20″")).toBeNull();
  });

  // D-511 (08/11/2026) : lignes à 8, 30 et 48 du haut de la carte de 72. [Cadre de 58 centré dans 80 — remplacé.]
  it("D-511 — lines start at 8, 30 and 48 from the top of the 72 card", () => {
    renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: 20 })]);

    const row = screen.getByTestId("composition-exercise-row-ex-1");
    expect(StyleSheet.flatten(within(row).getByTestId("composition-exercise-name-row").props.style)).toMatchObject({ top: 8, height: 20 });
    expect(StyleSheet.flatten(within(row).getByTestId("composition-exercise-work-row").props.style)).toMatchObject({ top: 30, height: 16 });
    expect(StyleSheet.flatten(within(row).getByTestId("composition-exercise-zones-line").props.style)).toMatchObject({ top: 48, height: 16 });
    expect(blockStyle().height).toBe(72);
  });

  // PRE-6 story 6.2 (D-441) : remplace « la rangée du point fait bloc avec l'occurrence » (ARB-3).
  it("PRE6-6.2 — la rangée du point est une sœur des cartes, hors du conteneur gestuel de l'occurrence", () => {
    renderScreenWithDraft(withRecovery, { stopPoints: [pointAfter(1)] });
    const container = screen.getByTestId("composition-activity-ex-1");
    expect(within(container).queryByTestId("composition-stop-point-p1")).toBeNull();
    const list = screen.getByTestId("composition-zone-before-tour");
    expect(within(list).getByTestId("composition-stop-point-row-p1")).toBeTruthy();
    expect(testIdOrder(screen.toJSON(), ["composition-activity-ex-1", "composition-stop-point-row-p1"])).toEqual([
      "composition-activity-ex-1",
      "composition-stop-point-row-p1",
    ]);
    // Écart entre la carte et la rangée : celui de la liste (8 hors Circuit).
    expect(StyleSheet.flatten(list.props.style).gap).toBe(8);
  });

  it("D-511 — the card is 72 with or without Zones, recovery or stop point", async () => {
    renderScreenWithDraft(withZeroRecovery);
    expect(blockStyle().height).toBe(72);

    renderScreenWithDraft(withRecovery);
    expect(blockStyle().height).toBe(72);

    renderScreenWithDraft(withRecovery, { stopPoints: [pointAfter(1)] });
    expect(blockStyle().height).toBe(72);

    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", bodyZoneIds: ["dos"] }),
    ]);
    await screen.findByTestId("composition-exercise-body-zones");
    expect(blockStyle().height).toBe(72);
  });

  // D-511 (08/11/2026) : jamais de durée estimée sur la carte — les estimations appartiennent aux en-têtes.
  // [Story 5.1 : « 10 rép. / ≈ 1 min » en ligne 2 pour les Répétitions avec bip — remplacé le 08/11/2026.]
  it("D-511 — Répétitions with a beep: prescription only, no estimated duration (« ≈ ») on the card", () => {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", {
        name: "Extension",
        executionParameters: repetitionParameters(10, 1, 0, { cadenceBeepIntervalSeconds: 6 }),
      }),
    ]);

    expect(screen.getByTestId("composition-exercise-summary").props.children).toBe("10 rép.");
    expect(screen.queryByTestId("composition-exercise-estimated-duration")).toBeNull();
    expect(within(screen.getByTestId("composition-exercise-row-ex-1")).queryByText(/≈|≥/u)).toBeNull();
    expect(blockStyle().height).toBe(72);
  });

  it("D-511 — Répétitions without a beep: no estimated duration, card 72", () => {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Extension", executionParameters: repetitionParameters(10) }),
    ]);

    expect(screen.queryByTestId("composition-exercise-estimated-duration")).toBeNull();
    expect(blockStyle().height).toBe(72);
  });

  // Matrice de la spec : textes longs à 360 — ellipses, aucune superposition (colonnes en flux).
  it("PRE6-5.1 — long name, Category and Zones are cut by an ellipsis; the values column is relative to the usable width, never an absolute x", async () => {
    const longName = "Étirement prolongé des ischio-jambiers en position assise avec sangle";
    renderScreenWithDraft([
      {
        ...anActivity("ex-1", "BEFORE_TOUR", { name: longName, postActivityRecoverySeconds: 20 }),
        bodyZoneIds: ["dos", "epaules"],
        categoryId: "renforcement",
      },
    ]);
    const row = screen.getByTestId("composition-exercise-row-ex-1");
    await within(row).findByTestId("composition-exercise-body-zones");

    for (const testID of [
      "composition-exercise-name",
      "composition-exercise-category",
      "composition-exercise-body-zones",
      "composition-exercise-summary",
      "composition-recovery-line-label",
    ]) {
      expect(within(row).getByTestId(testID).props.numberOfLines).toBe(1);
    }
    expect(StyleSheet.flatten(within(row).getByTestId("composition-exercise-name").props.style)).toMatchObject({ flex: 1 });
    // D-511 (08/11/2026) : catégorie et zones prennent le reste et se coupent avant les valeurs de droite, qui ne
    // s'abrègent pas ; lignes posées depuis les bords (gauche 76, droite 12), jamais une largeur codée.
    for (const testID of ["composition-exercise-category", "composition-exercise-body-zones"]) {
      expect(StyleSheet.flatten(within(row).getByTestId(testID).props.style)).toMatchObject({ flex: 1, minWidth: 0 });
    }
    expect(StyleSheet.flatten(within(row).getByTestId("composition-exercise-summary").props.style).flexShrink).toBe(0);
    for (const testID of ["composition-exercise-name-row", "composition-exercise-work-row", "composition-exercise-zones-line"]) {
      const line = StyleSheet.flatten(within(row).getByTestId(testID).props.style);
      expect(line).toMatchObject({ left: 76, right: 12 });
      expect(line.width).toBeUndefined();
    }
  });

  it("PRE6-7.2 (D-442) — hors placement, la récupération n'est plus une cible : un toucher sur la ligne 3 ouvre l'Exercice, un appui long saisit la carte, jamais de roulette ni de bulle", async () => {
    renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: 20 })]);

    const recovery = screen.getByTestId("composition-activity-recovery-ex-1-recovery");
    // Aucun répondeur propre, aucune cible étendue : le geste revient à la carte.
    expect(recovery.props.onStartShouldSetResponder).toBeUndefined();
    expect(recovery.props.onPress).toBeUndefined();
    expect(recovery.props.onLongPress).toBeUndefined();
    expect(StyleSheet.flatten(recovery.props.style).pointerEvents).toBe("none");
    expect(recovery.props.hitSlop).toBeUndefined();
    expect(StyleSheet.flatten(recovery.props.style).marginTop).toBeUndefined();

    // Toucher la ligne 3 : l'appui de la carte ; aucune roulette. [« la carte ouvre l'Exercice » — remplacé par la
    // recette iPhone n° 2 du 31/10/2026 (constat c) : la carte ouvre la feuille des paramètres d'exécution.]
    fireEvent.press(recovery);
    await act(async () => undefined);
    expect(screen.queryByTestId("duration-wheel-title")).toBeNull();
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    await act(async () => undefined);

    // Appui long sur la ligne 3 : la carte est saisie (état soulevé) ; aucune bulle « Retirer ».
    fireEvent(recovery, "longPress");
    expect(screen.getByTestId("composition-exercise-row-ex-1").props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.queryByTestId("composition-removal-bubble-remove")).toBeNull();
    expect(screen.queryByText("Retirer la récupération")).toBeNull();
  });

  it("PRE6-5.1 — the nested recovery control is hidden from accessibility; the card's name carries « récupération 20″ »", () => {
    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: 20 }),
      anActivity("ex-2", "BEFORE_TOUR", { name: "Planche", postActivityRecoverySeconds: 0 }),
    ]);

    const recovery = screen.getByTestId("composition-activity-recovery-ex-1-recovery");
    expect(recovery.props.accessible).toBe(false);
    expect(recovery.props.importantForAccessibility).toBe("no");
    expect(recovery.props.accessibilityRole).toBeUndefined();
    expect(recovery.props.accessibilityActions).toBeUndefined();
    expect(screen.getByTestId("composition-exercise-row-ex-1").props.accessibilityLabel).toMatch(/, récupération 20 secondes$/u);
    expect(screen.getByTestId("composition-exercise-row-ex-2").props.accessibilityLabel).not.toMatch(/récupération/u);
  });

  it("PRE6-5.1 — a non-finite recovery (NaN) shows nothing and offers no recovery action", () => {
    renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: Number.NaN })]);

    expect(screen.queryByTestId("composition-activity-recovery-ex-1-recovery")).toBeNull();
    expect(screen.queryByText(/NaN/u)).toBeNull();
    const card = screen.getByTestId("composition-exercise-row-ex-1");
    expect((card.props.accessibilityActions as { name: string }[]).map((action) => action.name)).not.toContain("modifyRecovery");
    expect(card.props.accessibilityLabel).not.toMatch(/récupération/u);
  });

  // D-511 (08/11/2026) : plus de durée estimée ; la prescription ne s'abrège pas. [Revue 5.1 : la durée estimée s'abrégeait la première — remplacé.]
  it("D-511 — « Séries variables »: values then « … » with no estimate; « À l'échec » keeps its summary; the prescription never shrinks", () => {
    const view = renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", {
        name: "Extension",
        executionParameters: variableParameters({
          mode: "REPETITIONS",
          cadenceBeepIntervalSeconds: 2,
          rows: [
            [10, 0],
            [12, 0],
            [14, 0],
            [16, 0],
          ],
        }),
      }),
    ]);
    const summary = screen.getByTestId("composition-exercise-summary");
    expect(summary.props.children).toBe("10 · 12 · 14 … rép.");
    expect(screen.queryByTestId("composition-exercise-estimated-duration")).toBeNull();
    expect(summary.props.numberOfLines).toBe(1);
    view.unmount();

    renderScreenWithDraft([
      anActivity("ex-1", "BEFORE_TOUR", { name: "Pompes", executionParameters: allFailureParameters(3) }),
    ]);
    expect(screen.getByTestId("composition-exercise-summary").props.children).toBe("3 séries à l’échec");
    expect(screen.queryByTestId("composition-exercise-estimated-duration")).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId("composition-exercise-summary").props.style).flexShrink).toBe(0);
  });

  it("D-511 — the lifted card inside the Circuit gets a 1 border; the content stays measured from the outer edge (media and values do not move)", () => {
    renderScreenWithDraft([anActivity("ex-1", "IN_TOUR", { name: "Gainage" })]);
    const content = () => StyleSheet.flatten(screen.getByTestId("composition-activity-main-card").props.style);
    const card = () => StyleSheet.flatten(screen.getByTestId("composition-exercise-row-ex-1").props.style);
    const atRest = { border: card().borderWidth as number, left: content().left as number, right: content().right as number };
    expect(atRest).toEqual({ border: 0.5, left: -0.5, right: -0.5 });

    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");
    const lifted = { border: card().borderWidth as number, left: content().left as number, right: content().right as number };
    expect(lifted.border).toBe(OCCURRENCE_CARD_BORDER_WIDTH);
    // Bord + décalage : le contenu reste repéré sur le bord extérieur.
    expect(lifted.border + lifted.left).toBe(atRest.border + atRest.left);
    expect(lifted.border + lifted.right).toBe(atRest.border + atRest.right);
  });

  // VoiceOver n'atteint pas un bouton imbriqué dans la carte : la carte reprend ses deux actions.
  it("PRE6-7.2 (D-442) — the card offers no recovery action (no « Modifier » / « Retirer la récupération »), whatever its value", () => {
    const card = () => screen.getByTestId("composition-exercise-row-ex-1");
    for (const seconds of [20, 0, null]) {
      const view = renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: seconds })]);
      expect((card().props.accessibilityActions as { name: string }[]).map((action) => action.name)).toEqual([
        "moveDown",
        "duplicate",
        "delete",
      ]);
      view.unmount();
    }
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

  it("sizes each revealed action to the FULL height of the card (72 × 72, D-511)", async () => {
    renderScreenWithDraft(withZeroRecovery);
    fireSwipeLeft("ex-1");
    for (const testID of [
      "composition-activity-duplicate-ex-1",
      "composition-activity-delete-ex-1",
    ]) {
      const style = StyleSheet.flatten(screen.getByTestId(testID).props.style);
      expect(style.width).toBe(72);
      expect(style.height).toBe(72);
    }
    expect(
      StyleSheet.flatten(screen.getByTestId("composition-activity-actions-ex-1").props.style).height,
    ).toBe(72);
  });

  it("CE-T02-02 — the lifted card keeps its constant delta: 72 + 4 = 76 (D-511), width expressed as a ±4 margin", () => {
    renderScreenWithDraft(withZeroRecovery);
    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");

    const lifted = blockStyle();
    expect(lifted.height).toBe(72 + dimensions.compositionActivityRow.heightDelta);
    expect(lifted.marginHorizontal).toBe(-4);
  });

  // PRE-6 story 5.2b (ch13, CE-T03-08, « Réorganisation » : « Les autres cartes et éléments structurels restent
  // inchangés ») : l'agrandissement vertical est neutre pour la mise en page — −2 en haut et en bas,
  // la carte reste centrée sur sa place et son conteneur garde la hauteur de repos. Ce test prouve les
  // styles (hauteur et marges) ; la mise en page elle-même (Yoga) se vérifie sur iPhone.
  it("PRE6-5.2b — styles of the lifted card: ±2 vertical margins, so its footprint in the flow stays the rest height (the layout itself is checked on iPhone)", () => {
    renderScreenWithDraft(withZeroRecovery);
    const rest = blockStyle();
    const restFootprint = (rest.height as number) + ((rest.marginTop ?? rest.marginVertical ?? 0) as number) * 2;
    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");

    const lifted = blockStyle();
    expect(lifted.height).toBe(76);
    expect(lifted.marginVertical).toBe(-dimensions.compositionActivityRow.heightDelta / 2);
    expect(lifted.marginVertical).toBe(-2);
    // Encombrement dans le flux (hauteur + marges) identique au repos : rien ne bouge dessous.
    expect((lifted.height as number) + 2 * (lifted.marginVertical as number)).toBe(restFootprint);
    expect(restFootprint).toBe(72);
  });

  // PRE-6 (story 5.1, D-435) : un seul rayon (12) pour la carte, les actions glissées et l'état soulevé.
  it("PRE6-5.1 — card, swipe actions group and lifted card share the radius 12", () => {
    renderScreenWithDraft(withZeroRecovery);
    expect(blockStyle().borderRadius).toBe(12);
    fireSwipeLeft("ex-1");
    expect(StyleSheet.flatten(screen.getByTestId("composition-activity-actions-ex-1").props.style).borderRadius).toBe(12);

    renderScreenWithDraft(withZeroRecovery);
    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");
    expect(blockStyle().borderRadius).toBe(12);
  });

  it("CE-T02-02 — the lifted card takes the blue surface; the stop point row has no surface of its own", () => {
    renderScreenWithDraft(withRecovery, { stopPoints: [pointAfter(1)] });

    expect(StyleSheet.flatten(screen.getByTestId("composition-stop-point-p1").props.style).backgroundColor).toBeUndefined();

    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");

    expect(blockStyle().backgroundColor).toBe(colors.exerciseContextBandBackground);
    expect(StyleSheet.flatten(screen.getByTestId("composition-stop-point-p1").props.style).backgroundColor).toBeUndefined();
  });

  it("moves the Récupération WITH its Activity — it stays in line 3 of the card across zones", () => {
    // PRE-9 B.2 — D-451, COMP §1 : le Circuit n'existe qu'avec un Exercice (`circuit-member`, 290–360).
    renderScreenWithDraft([...withRecovery, anActivity("circuit-member", "IN_TOUR")]);

    fireLayout(screen.getByTestId("composition-zone-before-tour"), 70, 100);
    fireLayout(screen.getByTestId("composition-activity-ex-1"), 0, 80);
    fireLayout(screen.getByTestId("composition-tour-section"), 230, 170);
    fireLayout(screen.getByTestId("composition-zone-in-tour"), 60, 70);
    fireLayout(screen.getByTestId("composition-activity-circuit-member"), 0, 70);

    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 200, pageY: 300 } });
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 200, pageY: 300 } });

    const inTour = screen.getByTestId("composition-zone-in-tour");
    const card = within(inTour).getByTestId("composition-exercise-row-ex-1");
    expect(within(card).getByTestId("composition-activity-recovery-ex-1-recovery")).toBeTruthy();
    expect(within(card).getByText("1′30″")).toBeTruthy();
  });

  it("drag still works on a card without a stop point row (décision Hermann 21/10/2026)", () => {
    // PRE-9 B.2 — D-451, COMP §1 : le Circuit n'existe qu'avec un Exercice (`circuit-member`, 290–360).
    renderScreenWithDraft([...withZeroRecovery, anActivity("circuit-member", "IN_TOUR")]);
    expect(screen.queryByTestId("composition-activity-recovery-slot-ex-1")).toBeNull();

    fireLayout(screen.getByTestId("composition-zone-before-tour"), 70, 100);
    // Bloc sans rangée : la mesure du conteneur n'est que la carte.
    fireLayout(screen.getByTestId("composition-activity-ex-1"), 0, 80);
    fireLayout(screen.getByTestId("composition-tour-section"), 230, 170);
    fireLayout(screen.getByTestId("composition-zone-in-tour"), 60, 70);
    fireLayout(screen.getByTestId("composition-activity-circuit-member"), 0, 70);

    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 200, pageY: 300 } });
    // La carte suit le doigt, sans rangée à entraîner.
    expect(blockStyle().transform).toEqual([{ translateX: 0 }, { translateY: 200 }]);
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 200, pageY: 300 } });

    const inTour = screen.getByTestId("composition-zone-in-tour");
    expect(within(inTour).getByTestId("composition-exercise-row-ex-1")).toBeTruthy();
    expect(screen.queryByTestId("composition-activity-recovery-slot-ex-1")).toBeNull();
  });

  it("removes the Récupération with its Activity — `Supprimer` never leaves an orphan recovery", () => {
    const restoreTiming = jsDrivenAnimations();
    try {
      renderScreenWithDraft([
        anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: 90 }),
      ]);

      fireSwipeLeft("ex-1");
      fireEvent.press(screen.getByTestId("composition-activity-delete-ex-1"));
      finishDeletionAnimation();
      expect(screen.queryByTestId("composition-exercise-row-ex-1")).toBeNull();

      expect(screen.queryByTestId("composition-activity-recovery-ex-1-recovery")).toBeNull();
      expect(screen.queryByText("1′30″")).toBeNull();
      expect(screen.queryByTestId("composition-exercise-row-ex-1")).toBeNull();
    } finally {
      restoreTiming();
    }
  });
});

/**
 * T02-S02 — « métriques d'un Tour calculées uniquement avec les Activités
 * IN_TOUR, puis application de tourRepeatCount dans la synthèse globale ;
 * recalcul immédiat après déplacement, duplication ou suppression ».
 */
describe("CompositionScreen — recalcul immédiat de la durée du Circuit (T02-S02)", () => {
  // PRE-6 story 7.7 : actions glissées animées (pilote JS, minuteurs simulés).
  swipeMotion();
  // Story 7.8 (D-443) : la durée du Circuit n'est plus affichée ; ces recalculs immédiats portent
  // sur la durée de la Séance (zone de contexte), arrondie aux 15 s.
  const sessionDuration = () => screen.getByTestId("composition-session-duration").props.children;
  it("counts the out-of-Circuit Activities once and multiplies ONLY the IN_TOUR zone by tourRepeatCount", () => {
    renderScreenWithDraft([
      anActivity("warmup", "BEFORE_TOUR", { name: "Échauffement", executionParameters: durationParameters(600) }),
      anActivity("core", "IN_TOUR", { name: "Gainage", executionParameters: durationParameters(60) }),
      anActivity("stretch", "AFTER_TOUR", { name: "Étirements", executionParameters: durationParameters(600) }),
    ]);

    // Hors Tour : `600 + 600` comptés une seule fois, plus le Circuit `60 × 1`.
    expect(sessionDuration()).toBe("≈ 21′00″");

    setCircuitCountWithStepper(3);

    // Seule la zone `IN_TOUR` est développée : `1 200 + 60 × 3 = 23 min`.
    expect(sessionDuration()).toBe("≈ 23′00″");
    // PRE-9 B.1a (D-451, complément du 28/10, remplace la clause de D-443) : durée du Circuit seul.
    expect(screen.getByTestId("composition-circuit-header-duration", { includeHiddenElements: true }).props.children).toBe("≈ 3′00″");
  });

  it("recomputes immediately after a DUPLICATION", () => {
    renderScreenWithDraft([anActivity("core", "IN_TOUR", { name: "Gainage", executionParameters: durationParameters(60) })]);
    expect(sessionDuration()).toBe("≈ 1′00″");

    fireSwipeLeft("core");
    fireEvent.press(screen.getByTestId("composition-activity-duplicate-core"));

    expect(sessionDuration()).toBe("≈ 2′00″");
  });

  it("recomputes immediately after a DELETION (story 7.5 : once the animated deletion is written)", () => {
    const restoreTiming = jsDrivenAnimations();
    try {
      renderScreenWithDraft([
        anActivity("core-1", "IN_TOUR", { name: "Gainage", executionParameters: durationParameters(60) }),
        anActivity("core-2", "IN_TOUR", { name: "Squats", executionParameters: durationParameters(60) }),
      ]);
      expect(sessionDuration()).toBe("≈ 2′00″");

      fireSwipeLeft("core-1");
      fireEvent.press(screen.getByTestId("composition-activity-delete-core-1"));

      finishDeletionAnimation();
      expect(sessionDuration()).toBe("≈ 1′00″");
    } finally {
      restoreTiming();
    }
  });

  it("recomputes immediately after a MOVE out of the Tour", () => {
    renderScreenWithDraft(
      [anActivity("core", "IN_TOUR", { name: "Gainage", executionParameters: durationParameters(60) })],
      { tourRepeatCount: 3 },
    );
    // Dans le Circuit à 3 tours : 60 × 3.
    expect(sessionDuration()).toBe("≈ 3′00″");

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

    // Sortie du Circuit : l'occurrence ne compte plus qu'une fois.
    expect(sessionDuration()).toBe("≈ 1′00″");
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

/**
 * PRE-9 B.1a — D-451, complément du 28/10 (remplace D-442 : stepper permanent) ; RM-027 : toucher
 * le nombre révèle le stepper. Sans effet s'il est déjà révélé.
 */
function openCircuitStepper() {
  if (screen.queryByTestId("composition-circuit-header-counter-stepper-increment") !== null) return;
  fireEvent.press(screen.getByTestId("composition-circuit-header-counter"));
}

/** PRE-6 (story 3.1) : règle N depuis 1 par le + du stepper (PRE-9 B.1a : révélé d'abord ; un appui par pas). */
function setCircuitCountWithStepper(target: number) {
  openCircuitStepper();
  for (let i = 1; i < target; i += 1) {
    const plus = screen.getByTestId("composition-circuit-header-counter-stepper-increment");
    fireEvent(plus, "pressIn");
    fireEvent(plus, "pressOut");
  }
}

describe("CompositionScreen — en-tête du Circuit et compteur (PRE-6 story 3.1, CIR-10 ; PRE-9 B.1a, RM-027)", () => {
  // PRE-6 story 7.7 : actions glissées animées (pilote JS, minuteurs simulés).
  swipeMotion();
  const oneActivity = [anActivity("ex-1", "IN_TOUR", { name: "Gainage", executionParameters: durationParameters(60) })];
  const unitText = () => screen.getByTestId("composition-circuit-header-counter-unit", { includeHiddenElements: true }).props.children;
  const adjectiveText = () =>
    screen.getByTestId("composition-circuit-header-counter-adjective", { includeHiddenElements: true }).props.children;
  const counterValue = () => screen.getByTestId("composition-circuit-header-counter-value").props.children;
  // Story 7.8 : les pas du compteur se lisent dans la durée de la Séance (zone de contexte),
  // arrondie aux 15 s ; PRE-9 B.1a : et dans la durée du Circuit, de nouveau affichée.
  const sessionDuration = () => screen.getByTestId("composition-session-duration").props.children;
  const circuitDuration = () =>
    screen.getByTestId("composition-circuit-header-duration", { includeHiddenElements: true }).props.children;
  const stepper = () => screen.queryByTestId("composition-circuit-header-counter-stepper-increment");

  // PRE-9 B.1a — D-451, complément du 28/10 (remplace D-442 / D-443) : « N tours · groupées » /
  // « N tours · alternées » ; l'unité reste tour(s) pour les deux natures ; stepper révélé.
  it("« 1 tour · groupées » in grouped series, « 3 tours · alternées » in alternated series; the stepper is hidden at rest", () => {
    renderScreenWithDraft(oneActivity);
    expect(counterValue()).toBe(1);
    expect(unitText()).toBe("tour");
    expect(adjectiveText()).toBe("groupées");
    expect(stepper()).toBeNull();

    screen.unmount();
    renderScreenWithDraft(oneActivity, { tourRepeatCount: 3, circuitNature: "SERIES" });
    expect(counterValue()).toBe(3);
    expect(unitText()).toBe("tours");
    expect(adjectiveText()).toBe("alternées");
  });

  it("alternated N = 1 is singular « tour »; grouped N = 2 is plural « tours »", () => {
    renderScreenWithDraft(oneActivity, { tourRepeatCount: 1, circuitNature: "SERIES" });
    expect(unitText()).toBe("tour");
    screen.unmount();
    renderScreenWithDraft(oneActivity, { tourRepeatCount: 2 });
    expect(unitText()).toBe("tours");
  });

  it("RM-027 — tapping the number reveals − N + on the white radius-18 background with surface circles; tapping it again closes it", () => {
    renderScreenWithDraft(oneActivity, { tourRepeatCount: 4 });
    expect(stepper()).toBeNull();
    openCircuitStepper();

    const field = screen.getByTestId("composition-circuit-header-counter-stepper");
    expect(StyleSheet.flatten(field.props.style)).toMatchObject({ backgroundColor: colors.background, borderRadius: 18 });
    for (const direction of ["decrement", "increment"]) {
      const circle = within(field).getByTestId(`composition-circuit-header-counter-stepper-${direction}-circle`);
      expect(StyleSheet.flatten(circle.props.style)).toMatchObject({ width: 28, height: 28, backgroundColor: colors.surface });
      expect(StyleSheet.flatten(within(field).getByTestId(`composition-circuit-header-counter-stepper-${direction}`).props.style)).toMatchObject({
        width: 44,
        height: 44,
      });
    }
    // Ordre : −, nombre, unité (recette du 29/10 : contiguë au nombre, dans le stepper), +, puis
    // l'adjectif.
    const order = [
      "composition-circuit-header-counter-stepper-decrement",
      "composition-circuit-header-counter-value",
      "composition-circuit-header-counter-unit",
      "composition-circuit-header-counter-stepper-increment",
      "composition-circuit-header-counter-adjective",
    ];
    expect(testIdOrder(screen.toJSON(), order)).toEqual(order);
    expect(counterValue()).toBe(4);
    expect(screen.getByTestId("composition-circuit-header-counter").props.accessibilityState).toMatchObject({ expanded: true });

    fireEvent.press(screen.getByTestId("composition-circuit-header-counter"));
    expect(stepper()).toBeNull();
    expect(counterValue()).toBe(4);
  });

  it("bounds: − unavailable at 1, + unavailable at 99", () => {
    renderScreenWithDraft(oneActivity);
    openCircuitStepper();
    expect(
      screen.getByTestId("composition-circuit-header-counter-stepper-decrement").props.accessibilityState,
    ).toMatchObject({ disabled: true });
    expect(
      screen.getByTestId("composition-circuit-header-counter-stepper-increment").props.accessibilityState,
    ).toMatchObject({ disabled: false });

    screen.unmount();
    renderScreenWithDraft(oneActivity, { tourRepeatCount: 99 });
    openCircuitStepper();
    expect(
      screen.getByTestId("composition-circuit-header-counter-stepper-increment").props.accessibilityState,
    ).toMatchObject({ disabled: true });
    expect(
      screen.getByTestId("composition-circuit-header-counter-stepper-decrement").props.accessibilityState,
    ).toMatchObject({ disabled: false });
  });

  it("each step updates N, the Circuit and session durations, without any message; the unit agrees", () => {
    renderScreenWithDraft(oneActivity);
    expect(circuitDuration()).toBe("≈ 1′00″");
    expect(sessionDuration()).toBe("≈ 1′00″");

    setCircuitCountWithStepper(3);

    expect(counterValue()).toBe(3);
    expect(unitText()).toBe("tours");
    expect(sessionDuration()).toBe("≈ 3′00″");
    expect(circuitDuration()).toBe("≈ 3′00″");
    // Sans message : aucun dialogue de confirmation.
    expect(screen.queryByText("Confirmer")).toBeNull();

    const minus = screen.getByTestId("composition-circuit-header-counter-stepper-decrement");
    fireEvent(minus, "pressIn");
    fireEvent(minus, "pressOut");
    expect(sessionDuration()).toBe("≈ 2′00″");
  });

  it("story 7.8 — the session duration is rounded to the nearest 15″, prefixed « ≈ » (replaces the story 7.3 minute rounding)", () => {
    // 2 × 95 s = 190 s → 195 s (190 / 15 = 12,67 → 13 tranches) : « ≈ 3 min 15 s ».
    renderScreenWithDraft(
      [anActivity("ex-1", "IN_TOUR", { name: "Gainage", executionParameters: durationParameters(95), postActivityRecoverySeconds: 0 })],
      { tourRepeatCount: 2 },
    );
    expect(sessionDuration()).toBe("≈ 3′15″");
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
    expect(sessionDuration()).toBe("≈ 10′00″");

    openCircuitStepper();
    const minus = screen.getByTestId("composition-circuit-header-counter-stepper-decrement");
    fireEvent(minus, "pressIn");
    fireEvent(minus, "pressOut");
    expect(sessionDuration()).toBe("≈ 6′00″");
    expect(unitText()).toBe("tours");

    const plus = screen.getByTestId("composition-circuit-header-counter-stepper-increment");
    fireEvent(plus, "pressIn");
    fireEvent(plus, "pressOut");
    expect(sessionDuration()).toBe("≈ 10′00″");
  });

  // PRE-9 B.1a (RM-027, RC-4 de la story 3.1, comme avant D-442) : le stepper révélé se referme par
  // un toucher ailleurs ou le défilement de la liste, sans rien appliquer.
  const stepperClosers: [string, () => void][] = [
    ["scrolling the list", () => {
      fireEvent(screen.getByTestId("composition-body"), "scrollBeginDrag");
    }],
    ["a touch on the body outside zone", () => {
      fireEvent.press(screen.getByTestId("composition-circuit-nature-outside", { includeHiddenElements: true }));
    }],
    ["a touch on the Circuit outside zone", () => {
      fireEvent.press(screen.getByTestId("composition-circuit-nature-outside-section", { includeHiddenElements: true }));
    }],
  ];
  it.each(stepperClosers)("RM-027 — %s closes the revealed stepper, N unchanged", (_label, trigger) => {
    renderScreenWithDraft(oneActivity, { tourRepeatCount: 3 });
    expect(screen.queryByTestId("composition-circuit-nature-outside", { includeHiddenElements: true })).toBeNull();
    openCircuitStepper();
    expect(stepper()).toBeTruthy();
    trigger();
    expect(stepper()).toBeNull();
    expect(counterValue()).toBe(3);
  });

  it("RM-027 — one control at a time: opening the nature choice (Android) closes the revealed stepper", () => {
    const before = Platform.OS;
    Platform.OS = "android";
    try {
      renderScreenWithDraft(oneActivity, { tourRepeatCount: 3 });
      openCircuitStepper();
      fireEvent.press(screen.getByTestId("composition-circuit-header-counter-nature"));
      expect(stepper()).toBeNull();
      expect(screen.getByTestId("composition-circuit-header-counter-nature").props.accessibilityState).toMatchObject({ expanded: true });
    } finally {
      Platform.OS = before;
    }
  });

  it("VoiceOver: adjustable « Nombre de tours » between the − and + buttons; increment announces « 4 tours »", () => {
    renderScreenWithDraft(oneActivity, { tourRepeatCount: 3 });

    const counter = () => screen.getByLabelText(composition.circuit.countAccessibilityLabel);
    expect(counter().props.accessibilityRole).toBe("adjustable");
    expect(counter().props.accessibilityValue).toMatchObject({ min: 1, max: 99, now: 3, text: "3 tours" });

    stepCircuitCounter("increment");
    expect(counter().props.accessibilityValue).toMatchObject({ now: 4, text: "4 tours" });
    expect(sessionDuration()).toBe("≈ 4′00″");

    stepCircuitCounter("decrement", 3);
    expect(counter().props.accessibilityValue).toMatchObject({ now: 1, text: "1 tour" });
    // À la borne basse, « décrémenter » n'est plus proposé ; PRE-9 B.1a (RM-027) : « activer »
    // révèle le stepper.
    const actions = (counter().props.accessibilityActions as { name: string }[]).map((action) => action.name);
    expect(actions).toEqual(["increment", "activate"]);
    fireEvent(counter(), "accessibilityAction", { nativeEvent: { actionName: "activate" } });

    // − et + : boutons accessibles distincts, nommés selon le tour.
    expect(screen.getByLabelText("Retirer un tour — minimum atteint").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent(screen.getByLabelText("Ajouter un tour"), "pressIn");
    fireEvent(screen.getByLabelText("Ajouter un tour"), "pressOut");
    expect(counter().props.accessibilityValue).toMatchObject({ now: 2, text: "2 tours" });
  });

  // PRE-9 B.1a — D-451, complément du 28/10 : l'unité reste « tour(s) » en séries alternées.
  it("VoiceOver in alternated series: « Nombre de tours », value announced « 2 tours »", () => {
    renderScreenWithDraft(oneActivity, { tourRepeatCount: 2, circuitNature: "SERIES" });
    const counter = screen.getByLabelText(composition.circuit.countAccessibilityLabel);
    expect(counter.props.accessibilityValue).toMatchObject({ text: "2 tours" });
  });

  it("empty Circuit: session and Circuit « 0″ »; rehydrated drafts show their persisted count", () => {
    // PRE-9 B.2 — D-451, COMP §1 : sans Exercice, aucun Circuit (ni sa durée, ni son compteur).
    renderScreenWithDraft([], { tourRepeatCount: 7 });
    expect(sessionDuration()).toBe("0″");
    expect(screen.queryByTestId("composition-circuit-header-duration", { includeHiddenElements: true })).toBeNull();
    expect(screen.queryByTestId("composition-circuit-header-counter-value")).toBeNull();

    renderScreenWithDraft([anActivity("circuit-member", "IN_TOUR")], { tourRepeatCount: 7 });
    expect(counterValue()).toBe(7);
    expect(unitText()).toBe("tours");
  });

  it("an out-of-Circuit occurrence counts once in the session duration, whatever N (correctif T02, 2026-09-08)", () => {
    renderScreenWithDraft(
      [
        anActivity("ex-1", "BEFORE_TOUR", { name: "Échauffement", executionParameters: durationParameters(600) }),
        anActivity("ex-2", "IN_TOUR", { name: "Squats", executionParameters: durationParameters(60) }),
      ],
      { tourRepeatCount: 5 },
    );
    // 600 (une fois) + 60 × 5 = 900 s.
    expect(sessionDuration()).toBe("≈ 15′00″");
  });

  it("PRE-6 (story 1.3) — a Series Circuit's contribution follows the passes of the draft's nature (session duration, story 7.8)", () => {
    // 3 séries de 60 s, pause 30 s, R 0 : Séries N = 2 → série 1 et 2 seulement, (60 + 30) × 2 = 180 s ;
    // en Tours, N = 2 développerait les trois séries deux fois (540 s → 9 min).
    renderScreenWithDraft(
      [anActivity("ex-1", "IN_TOUR", { name: "Squats", executionParameters: durationParameters(60, 3, 30) })],
      { tourRepeatCount: 2, circuitNature: "SERIES" },
    );
    expect(sessionDuration()).toBe("≈ 3′00″");
  });
});

/**
 * PRE-9 B.1a (D-451 ; ARB-12 ; référence « Composition : circuits, cycles et création » §4) : le
 * nom ou le chevron replie le Circuit — seconde ligne des noms, cartes masquées ; état de l'écran,
 * non persisté, Circuit déplié à l'ouverture ; aucun contenu du brouillon changé ni perdu.
 */
describe("CompositionScreen — repli du Circuit (PRE-9 B.1a, ARB-12)", () => {
  type Draft = SessionDraftContextValue["draft"];
  const probe: { draft: Draft | null } = { draft: null };
  function DraftProbe() {
    const value = useContext(SessionDraftContext);
    useEffect(() => {
      probe.draft = value?.draft ?? null;
    }, [value]);
    return null;
  }
  function renderWithProbe(exercises: readonly SessionDraftExercise[], overrides?: Partial<Draft>) {
    const view = render(
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
    measureDisplayedRows();
    return view;
  }
  const hidden = { includeHiddenElements: true } as const;
  const COLLAPSE = "composition-circuit-header-collapse";
  const exercises = [
    anActivity("warmup", "BEFORE_TOUR", { name: "Échauffement", executionParameters: durationParameters(60) }),
    anActivity("squat", "IN_TOUR", { name: "Squat", executionParameters: durationParameters(60) }),
    anActivity("pompes", "IN_TOUR", { name: "Pompes", executionParameters: durationParameters(60) }),
  ];
  const isExpanded = () => screen.getByTestId(COLLAPSE).props.accessibilityState.expanded as boolean;

  it("the Circuit is expanded when the screen opens: chevron up, cards shown, no names line", () => {
    renderWithProbe(exercises, { tourRepeatCount: 3 });
    expect(isExpanded()).toBe(true);
    expect(screen.getByTestId(COLLAPSE).props.accessibilityLabel).toBe("Circuit, ≈ 6 minutes");
    expect(screen.getByTestId("composition-zone-in-tour")).toBeTruthy();
    expect(screen.getByTestId("composition-activity-squat")).toBeTruthy();
    expect(screen.queryByTestId("composition-circuit-header-names", hidden)).toBeNull();
  });

  it("collapsing shows the names line and hides the cards without changing the draft; expanding restores them", async () => {
    renderWithProbe(exercises, { tourRepeatCount: 3 });
    const before = probe.draft;

    fireEvent.press(screen.getByTestId(COLLAPSE));
    // Recette du 29/10 (obs-3 b) : les cartes sont retirées à la fin du repli animé (rappel en microtâche).
    await act(async () => {});

    expect(isExpanded()).toBe(false);
    expect(screen.getByTestId("composition-circuit-header-names").props.children).toBe("Squat · Pompes");
    expect(screen.queryByTestId("composition-zone-in-tour", hidden)).toBeNull();
    expect(screen.queryByTestId("composition-activity-squat", hidden)).toBeNull();
    expect(screen.queryByTestId("composition-activity-pompes", hidden)).toBeNull();
    // Hors du Circuit, rien ne change ; la durée et le compteur restent sur la ligne d'en-tête.
    expect(screen.getByTestId("composition-activity-warmup")).toBeTruthy();
    expect(screen.getByTestId("composition-circuit-header-duration", hidden).props.children).toBe("≈ 6′00″");
    expect(screen.getByTestId("composition-circuit-header-counter-value").props.children).toBe(3);
    // Recette du 29/10 : l'en-tête replié n'a plus de hauteur imposée (68 = Circuit replié entier).
    expect(StyleSheet.flatten(screen.getByTestId("composition-circuit-header").props.style).minHeight).toBe(CIRCUIT_HEADER_HEIGHT);
    // ARB-12 : le repli est un état de l'écran, jamais une écriture du brouillon.
    expect(probe.draft).toBe(before);

    fireEvent.press(screen.getByTestId(COLLAPSE));

    expect(isExpanded()).toBe(true);
    expect(screen.getByTestId("composition-activity-squat")).toBeTruthy();
    expect(screen.getByTestId("composition-activity-pompes")).toBeTruthy();
    // [Recette du 29/10 : ligne des noms retirée aussitôt — remplacé par la recette iPhone n° 2 du
    // 31/10/2026 (b4-cycle) : elle se referme avec les cartes, puis est démontée (rappel en microtâche).]
    await act(async () => {});
    expect(screen.queryByTestId("composition-circuit-header-names", hidden)).toBeNull();
    expect(probe.draft).toBe(before);
  });

  it("not persisted: a new screen opens the Circuit expanded", () => {
    renderWithProbe(exercises);
    fireEvent.press(screen.getByTestId(COLLAPSE));
    expect(isExpanded()).toBe(false);
    screen.unmount();
    renderWithProbe(exercises);
    expect(isExpanded()).toBe(true);
  });

  it("collapsed: the rail links the Circuit ring straight to the bottom of the Circuit (no hidden card in the chain)", () => {
    renderWithProbe(exercises);
    fireEvent.press(screen.getByTestId(COLLAPSE));
    expect(screen.getByTestId("composition-sequence-marker-circuit", hidden)).toBeTruthy();
    expect(screen.getByTestId("composition-rail-tail-circuit-header", hidden)).toBeTruthy();
    // Bas du Circuit : la marge basse seule (14), depuis le bas de l'en-tête.
    const end = StyleSheet.flatten(screen.getByTestId("composition-rail-link-circuit-end", hidden).props.style);
    expect(end.height).toBe(14);
    expect(screen.queryByTestId("composition-rail-link-squat", hidden)).toBeNull();
  });

  it("collapsing closes the revealed stepper (one control at a time)", () => {
    renderWithProbe(exercises);
    openCircuitStepper();
    expect(screen.getByTestId("composition-circuit-header-counter-stepper-increment")).toBeTruthy();
    fireEvent.press(screen.getByTestId(COLLAPSE));
    expect(screen.queryByTestId("composition-circuit-header-counter-stepper-increment")).toBeNull();
  });

  // [« collapsed: a long press on a card is refused (nothing lifted, nothing written) and the Circuit
  // expands » — remplacé par la recette iPhone du 01/11/2026 (cr7-carte, Hermann : « appui long sur un
  // des exercices hors circuit, sans aucun mouvement, cela déplie le Circuit. » — KO) : la carte est
  // soulevée, le Circuit reste replié ; il ne se déplie qu'à l'arrêt d'une carte amenée sur lui
  // (recette n° 2 du 31/10 : « L'arrêt d'une carte sur un circuit replié doit l'ouvrir »).]
  describe("recette du 01/11 — cr7-carte : Circuit replié, carte hors du Circuit", () => {
    const withAfter = [...exercises, anActivity("cool", "AFTER_TOUR", { name: "Retour au calme", executionParameters: durationParameters(60) })];
    /** Avant : warmup 70–150 ; Circuit replié 160–228 ; après : cool 238–318. */
    function collapseAndMeasure() {
      renderWithProbe(withAfter);
      fireEvent.press(screen.getByTestId(COLLAPSE));
      fireLayout(screen.getByTestId("composition-zone-before-tour"), 70, 80);
      fireLayout(screen.getByTestId("composition-activity-warmup"), 0, 80);
      fireLayout(screen.getByTestId("composition-tour-section"), 160, 68);
      fireLayout(screen.getByTestId("composition-zone-after-tour"), 238, 80);
      fireLayout(screen.getByTestId("composition-activity-cool"), 0, 80);
    }
    const card = (id: string) => screen.getByTestId(`composition-activity-${id}`);
    function lift(id: string, pageY: number) {
      fireEvent(card(id), "touchStart", { nativeEvent: { pageX: 200, pageY } });
      fireEvent(screen.getByTestId(`composition-exercise-row-${id}`), "longPress");
    }
    const move = (id: string, pageY: number) => fireEvent(card(id), "responderMove", { nativeEvent: { pageX: 200, pageY } });
    const release = (id: string, pageY: number) => fireEvent(card(id), "touchEnd", { nativeEvent: { pageX: 200, pageY } });
    const order = () => probe.draft!.exercises.map((exercise) => `${exercise.id}:${exercise.structuralPosition}`);
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it("appui long sans mouvement (avant ou après le Circuit) : la carte est soulevée, le Circuit reste replié ; reposée, rien ne change", () => {
      collapseAndMeasure();
      const before = probe.draft;
      for (const [id, pageY] of [
        ["warmup", 110],
        ["cool", 278],
      ] as const) {
        lift(id, pageY);
        expect(screen.getByTestId("composition-body").props.scrollEnabled).toBe(false);
        move(id, pageY);
        move(id, pageY + 2);
        act(() => {
          jest.advanceTimersByTime(2000);
        });
        expect(isExpanded()).toBe(false);
        release(id, pageY);
        act(() => {
          jest.advanceTimersByTime(2000);
        });
        expect(isExpanded()).toBe(false);
        expect(probe.draft).toBe(before);
      }
    });

    it("lâcher sur le Circuit replié avant le délai : dépose à sa fin (après sa dernière carte) ; le changement de contenu le déplie (ARB-12)", () => {
      collapseAndMeasure();
      lift("warmup", 110);
      move("warmup", 194);
      expect(isExpanded()).toBe(false);
      release("warmup", 194);
      expect(order()).toEqual(["squat:IN_TOUR", "pompes:IN_TOUR", "warmup:IN_TOUR", "cool:AFTER_TOUR"]);
      expect(isExpanded()).toBe(true);
    });

    it("carte amenée et arrêtée sur le Circuit replié : il se déplie après le délai ; ses cartes deviennent des destinations", () => {
      collapseAndMeasure();
      lift("cool", 278);
      move("cool", 194);
      act(() => {
        jest.advanceTimersByTime(499);
      });
      expect(isExpanded()).toBe(false);
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(isExpanded()).toBe(true);
      // Déployé : Circuit 160–400 (squat 220–300, pompes 310–390) ; cool descend à 410–490 (+172).
      fireLayout(screen.getByTestId("composition-tour-section"), 160, 240);
      fireLayout(screen.getByTestId("composition-zone-in-tour"), 60, 170);
      fireLayout(screen.getByTestId("composition-activity-squat"), 0, 80);
      fireLayout(screen.getByTestId("composition-activity-pompes"), 90, 80);
      fireLayout(screen.getByTestId("composition-zone-after-tour"), 410, 80);
      fireLayout(screen.getByTestId("composition-activity-cool"), 0, 80);
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      // Doigt immobile à 194 (pointeur 278 − 84 = 194 dans le contenu) : avant squat (centre 260), en tête du Circuit.
      release("cool", 194);
      expect(order()).toEqual(["warmup:BEFORE_TOUR", "cool:IN_TOUR", "squat:IN_TOUR", "pompes:IN_TOUR"]);
    });

    it("passage sans arrêt : la carte quitte le Circuit replié avant le délai — il reste replié", () => {
      collapseAndMeasure();
      lift("cool", 278);
      move("cool", 194);
      act(() => {
        jest.advanceTimersByTime(300);
      });
      move("cool", 155);
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(isExpanded()).toBe(false);
      release("cool", 155);
      expect(order()).toEqual(["warmup:BEFORE_TOUR", "cool:BEFORE_TOUR", "squat:IN_TOUR", "pompes:IN_TOUR"]);
    });
  });

  it("collapsed: a change of the Circuit content (« Descendre » into it) expands it, so that nothing stays hidden", () => {
    renderWithProbe(exercises);
    fireEvent.press(screen.getByTestId(COLLAPSE));
    fireEvent(screen.getByTestId("composition-exercise-row-warmup"), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
    expect(probe.draft!.exercises.find((exercise) => exercise.id === "warmup")!.structuralPosition).toBe("IN_TOUR");
    expect(isExpanded()).toBe(true);
    expect(screen.getByTestId("composition-activity-warmup")).toBeTruthy();
  });

  it("collapsed: entering placement (« Ajouter un arrêt ») expands the Circuit", () => {
    renderWithProbe(exercises);
    fireEvent.press(screen.getByTestId(COLLAPSE));
    fireEvent.press(screen.getByTestId("composition-add-stop-action"));
    expect(screen.getByTestId(COLLAPSE, hidden).props.accessibilityState).toMatchObject({ expanded: true });
    expect(screen.getByTestId("composition-zone-in-tour", hidden)).toBeTruthy();
  });

  it("collapsed: the counter still works and changes N (the draft), the Circuit staying collapsed", () => {
    renderWithProbe(exercises, { tourRepeatCount: 2 });
    fireEvent.press(screen.getByTestId(COLLAPSE));
    stepCircuitCounter("increment");
    expect(probe.draft!.tourRepeatCount).toBe(3);
    expect(isExpanded()).toBe(false);
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
  // D-511 (08/11/2026) : icône 16 sur la ligne 2, immédiatement avant la prescription. [PRE-6 (story 5.1, D-435) : à droite
  // de la ligne 1, après le nom — remplacé le 08/11/2026.]
  it.each(["RIGHT_LEFT", "LEFT_RIGHT"] as const)("D-511 — shows the neutral 16 side-change icon on line 2, immediately before the prescription, for a bilateral Exercise (%s), never a direction", (sideMode) => {
    renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { sideMode })]);

    const indicator = screen.getByTestId("composition-activity-side-mode-ex-1");
    expect(StyleSheet.flatten(indicator.props.style)).toMatchObject({ width: 16, height: 16 });
    const icon = within(indicator).getByTestId("composition-exercise-side-change-icon");
    expect(StyleSheet.flatten(icon.props.style)).toMatchObject({ width: 16, height: 16 });
    expect(screen.queryByText(/D→G|G→D/)).toBeNull();
    const workRow = screen.getByTestId("composition-exercise-work-row");
    expect(within(workRow).getByTestId("composition-activity-side-mode-ex-1").props.testID).toBe(indicator.props.testID);
    expect(within(screen.getByTestId("composition-exercise-name-row")).queryByTestId("composition-activity-side-mode-ex-1")).toBeNull();
    expect(testIdOrder(screen.toJSON(), ["composition-exercise-category", "composition-activity-side-mode-ex-1", "composition-exercise-summary"]).slice(-2)).toEqual([
      "composition-activity-side-mode-ex-1",
      "composition-exercise-summary",
    ]);
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

    expect(screen.getByTestId("composition-exercise-summary").props.children).toBe("3 × 1′30″");
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
    // Recette iPhone du 29/10/2026 : bande transparente, couleur propre de la Composition (pas la
    // lavande de l’éditeur) peinte par le remplissage de `ContextBand`, qui s’efface vers le bas.
    expect(StyleSheet.flatten(band.props.style).backgroundColor).toBe("transparent");

    const effects = screen.getByTestId("composition-context-band-effects", { includeHiddenElements: true });
    expect(effects.props.pointerEvents).toBe("none");
    expect(effects.props.importantForAccessibility).toBe("no-hide-descendants");
    expect(StyleSheet.flatten(effects.props.style)).toMatchObject({ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" });

    // Recette iPhone du 29/10/2026 — fondu des 20 % inférieurs (23 points sous 92) vers la
    // TRANSPARENCE : couches superposées de la couleur de la bande, aucune couche blanche ; opaque en
    // haut de la part fondue, presque transparent en bas.
    const fade = screen.getByTestId("screen-context-band-fade", { includeHiddenElements: true });
    expect(StyleSheet.flatten(fade.props.style)).toMatchObject({ position: "absolute", top: 92, height: 23 });
    const layers = (fade.props.children as { props: { style: unknown } }[]).map(
      (layer) => StyleSheet.flatten(layer.props.style as never) as { height: number; opacity: number; backgroundColor: string },
    );
    expect(layers.length).toBeGreaterThanOrEqual(10);
    // D-509 (Hermann, 06/11/2026) : bande de la Composition à #EAEAFF (`colors.contextBand`, chapitre 06).
    // [Avant : `colors.selectionSurface` (#E5F0FF) — remplacé.]
    for (const layer of layers) expect(layer.backgroundColor).toBe(colors.contextBand);
    expect(colors.contextBand).toBe("#EAEAFF");
    expect(1 - layers.reduce((rest, layer) => rest * (1 - layer.opacity), 1)).toBeCloseTo(1, 5);
    expect(layers[0]!.height).toBe(23);
    expect(layers[0]!.opacity).toBeLessThan(0.1);

    // Courbe : halo blanc Ø 59,28 concentrique au bouton Retour (marge 16 depuis A01, cercle 38, contenu 48, séparateur 1).
    const halo = StyleSheet.flatten(screen.getByTestId("composition-context-band-halo", { includeHiddenElements: true }).props.style);
    expect(halo).toMatchObject({ position: "absolute", width: 59.28, height: 59.28, borderRadius: 29.64, backgroundColor: colors.background });
    expect(halo.left).toBeCloseTo(16 + 19 - 29.64, 5);
    expect(halo.top).toBeCloseTo(-24 - 29.64, 5);

    // Remplissage puis effets dessinés en premier : sous le champ Nom et sous Ajouter.
    const order = (band.props.children as { props?: { testID?: string } }[])
      .flat()
      .map((child) => child?.props?.testID)
      .filter(Boolean);
    expect(order.slice(0, 2)).toEqual(["screen-context-band-fill", "composition-context-band-effects"]);
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
 * PRE-6 (story 1.2 ; D-441 / RM-251 depuis la story 6.1, remplace ARB-3) : Dupliquer,
 * Supprimer et déposer laissent les Points d'arrêt du brouillon à leur place dans la
 * séquence ; une suppression qui rendrait un point interdit ou consécutif est refusée ; un dépôt est appliqué et retire les points en cause (story 7.1, D-442). Aucun rendu de point n'existe encore
 * (story 4.1) : une sonde lit `draft.stopPoints` dans le contexte.
 */
describe("CompositionScreen — Points d'arrêt du brouillon (PRE-6 story 1.2)", () => {
  // PRE-6 story 7.7 : actions glissées animées (pilote JS, minuteurs simulés).
  swipeMotion();
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
    // PRE-9 B.2 — D-451, COMP §1 : le Circuit n'est rendu qu'avec au moins un Exercice.
    const tour = screen.queryByTestId("composition-tour-section");
    if (tour !== null) fireLayout(tour, 230, 170);
  }

  const twoBefore = () => [
    anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage" }),
    anActivity("ex-2", "BEFORE_TOUR", { name: "Squats" }),
  ];

  it("D-441 — Dupliquer ne copie pas le point : la copie suit la source, le point garde sa place ([A, P, B] → [A, A′, P, B])", () => {
    renderWithStopPoints(twoBefore());
    fireSwipeLeft("ex-1");
    fireEvent.press(screen.getByTestId("composition-activity-duplicate-ex-1"));

    expect(readStopPoints()).toEqual([{ id: "s-1", scope: "BEFORE_TOUR", position: 2 }]);
  });

  it("story 7.5 (D-442 amendée) — Supprimer une occurrence qui laisserait le point juste après le Compte à rebours : appliqué, le point retiré", () => {
    const restoreTiming = jsDrivenAnimations();
    try {
      renderWithStopPoints(twoBefore());
      fireSwipeLeft("ex-1");
      fireEvent.press(screen.getByTestId("composition-activity-delete-ex-1"));

      finishDeletionAnimation();
      expect(screen.queryByTestId("composition-exercise-row-ex-1")).toBeNull();
      expect(readStopPoints()).toEqual([]);
    } finally {
      restoreTiming();
    }
  });

  // Story 7.1 (D-442) : le déplacement d'un Exercice est tolérant — un dépôt qui rendrait le point
  // interdit est appliqué et le point en cause retiré, sans message. La rangée du point est mesurée
  // (revue 6.2 : sans géométrie complète, le soulèvement est refusé).
  it("D-442 — un dépôt qui laisserait le point en tête de séquence est appliqué, le point retiré ; story 7.2 : annonce discrète, sans message visuel", () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
    try {
      renderWithStopPoints(twoBefore());
      layoutTwoBeforeTour();
      fireLayout(screen.getByTestId("composition-stop-point-row-s-1"), 75, 0);
      dragBy("ex-1", 100);

      expect(
        testIdOrder(screen.toJSON(), ["composition-exercise-row-ex-1", "composition-exercise-row-ex-2"]),
      ).toEqual(["composition-exercise-row-ex-2", "composition-exercise-row-ex-1"]);
      expect(readStopPoints()).toEqual([]);
      const removed = strings.screens.composition.stopPointsRemovedAnnouncement.singular;
      expect(announce).toHaveBeenCalledWith(removed);
      expect(screen.queryByText(removed)).toBeNull();
    } finally {
      announce.mockRestore();
    }
  });

  it("D-442 — le point ne suit plus son occurrence ; avec un Circuit après, même dépôt : appliqué, le point retiré", () => {
    renderWithStopPoints([...twoBefore(), anActivity("core", "IN_TOUR", { name: "Pompes" })]);
    layoutTwoBeforeTour();
    fireLayout(screen.getByTestId("composition-stop-point-row-s-1"), 75, 0);
    fireLayout(screen.getByTestId("composition-activity-core"), 0, 70);
    dragBy("ex-1", 100);

    expect(
      testIdOrder(screen.toJSON(), ["composition-exercise-row-ex-1", "composition-exercise-row-ex-2"]),
    ).toEqual(["composition-exercise-row-ex-2", "composition-exercise-row-ex-1"]);
    expect(readStopPoints()).toEqual([]);
  });
});

/**
 * PRE-6 story 2.1 — En-tête, bornes de séance et Continuer (matrice de la spec) : durée de
 * séance de l'en-tête (toutes les occurrences, nature du Circuit, sans Compte à rebours ni
 * Fin, RM-159), bouton fermer, « + », bornes et action « Continuer ».
 */
describe("CompositionScreen — PRE-6 story 2.1 (en-tête, bornes, Continuer)", () => {
  // PRE-6 story 7.7 : actions glissées animées (pilote JS, minuteurs simulés).
  swipeMotion();
  function headerDuration() {
    return screen.getByTestId("composition-session-duration").props.children as string;
  }

  it("PRE6-2.1 — séance vide : « 0″ » dans l'en-tête (story 7.8) et Continuer désactivé", () => {
    renderScreen();
    expect(headerDuration()).toBe("0″");
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
    // 60 + 60 × 3 + 60 = 300 s → « ≈ 5 min » (story 7.8) ; Compte à rebours et Fin exclus.
    expect(headerDuration()).toBe("≈ 5′00″");
    // PRE-9 B.1a — D-451, complément du 28/10 (remplace la clause de D-443) : durée du Circuit
    // seul, 60 × 3 = 180 s.
    expect(screen.getByTestId("composition-circuit-header-duration", { includeHiddenElements: true }).props.children).toBe("≈ 3′00″");
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

  it("PRE6-2.1 — bornes toujours présentes, défauts 10″ et 5″, 0″ admis (secondes seules, story 7.8 ; clavier depuis le 07/11/2026)", () => {
    renderScreenWithDraft([], { initialCountdownSeconds: 0 });
    expect(within(screen.getByLabelText(composition.countdown.label)).getByText("0″")).toBeTruthy();
    expect(within(screen.getByLabelText(composition.finalPhase.label)).getByText("5″")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(composition.finalPhase.label));
    expect(screen.getAllByLabelText(composition.finalPhase.label)[0].props.accessibilityState).toMatchObject({ expanded: true });
    expect(screen.getByTestId("carrier-duration-input").props.value).toBe("5″");
  });

  it("story 7.8 — a boundary value above 1′00″ in the draft is shown at 1′00″ (keyboard entry since 07/11/2026)", () => {
    renderScreenWithDraft([], { initialCountdownSeconds: 600, finalPhaseSeconds: 75 });
    expect(within(screen.getByLabelText(composition.countdown.label)).getByText("1′00″")).toBeTruthy();
    expect(within(screen.getByLabelText(composition.finalPhase.label)).getByText("1′00″")).toBeTruthy();
  });

  it("story 7.8 — the session duration's accessible name carries the rounded value and its sign (≈ / ≥)", () => {
    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(734) }]);
    const duration = () => screen.getByTestId("composition-session-duration");
    expect(duration().props.children).toBe("≈ 12′15″");
    expect(duration().props.accessibilityLabel).toBe(`${composition.sessionDurationAccessibilityLabel} ≈ 12 minutes 15 secondes`);

    renderScreenWithDraft([{ ...createExerciseDraft("ex-1"), name: "Pompes", executionParameters: allFailureParameters(3, 20) }]);
    expect(duration().props.children).toMatch(/^≥ /u);
    expect(duration().props.accessibilityLabel).toBe(`${composition.sessionDurationAccessibilityLabel} ${spokenDurations(duration().props.children as string)}`);
  });

  it("story 7.8 — each boundary entry is named after its boundary; Fin de séance reads its value in seconds (keyboard since 07/11/2026)", () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(composition.finalPhase.label));
    expect(within(screen.getByTestId("composition-boundary-final-phase")).getByTestId("carrier-duration-input").props.accessibilityLabel).toBe(composition.finalPhase.label);
    fireEvent(screen.getByTestId("carrier-duration-input"), "focus");
    for (const key of "100") fireEvent.changeText(screen.getByTestId("carrier-duration-input"), String(screen.getByTestId("carrier-duration-input").props.value ?? "") + key);
    fireEvent(screen.getByTestId("carrier-duration-input"), "blur");
    expect(screen.getByLabelText(composition.finalPhase.label).props.accessibilityValue).toMatchObject({ text: "1′00″" });
    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    expect(within(screen.getByTestId("composition-boundary-countdown")).getByTestId("carrier-duration-input").props.accessibilityLabel).toBe(composition.countdown.label);
  });

  it("story 7.8 — Compte à rebours and Fin de séance frames align on the right edge of the Exercise cards", () => {
    renderScreenWithDraft([
      { ...createExerciseDraft("ex-1"), name: "Gainage", executionParameters: durationParameters(45) },
    ]);
    // Les cartes débordent de la colonne à droite (`CARD_OUTSET` : 4 depuis D-511, 8 auparavant) ; les deux bornes aussi.
    const cardOutset = -(StyleSheet.flatten(screen.getByTestId("composition-zone-before-tour").props.style).marginHorizontal as number);
    expect(cardOutset).toBe(4);
    for (const testID of ["composition-boundary-countdown-step", "composition-boundary-final-phase-track"]) {
      expect(StyleSheet.flatten(screen.getByTestId(testID).props.style)).toMatchObject({ marginRight: -cardOutset });
    }
  });

  it("PRE6-2.1 — la durée de séance suit la nature du Circuit (Séries : passages, pas Tours × contenu)", () => {
    // Même fixture que le résumé du Circuit (story 1.3) : 3 séries de 60 s, pause 30 s, N = 2.
    // Séries : (60 + 30) × 2 = 180 s → « 3 min » ; en Tours, 540 s → « 9 min ».
    const exercises = [anActivity("ex-1", "IN_TOUR", { name: "Squats", executionParameters: durationParameters(60, 3, 30) })];
    renderScreenWithDraft(exercises, { tourRepeatCount: 2, circuitNature: "SERIES" });
    expect(headerDuration()).toBe("≈ 3′00″");

    renderScreenWithDraft(exercises, { tourRepeatCount: 2, circuitNature: "TOURS" });
    expect(headerDuration()).toBe("≈ 9′00″");
  });

  it("PRE6-2.1 — une Récupération positive d'une occurrence du Circuit compte à chaque Tour", () => {
    // 60 s + Récupération 30 s par Tour, 2 Tours : 180 s → « 3 min » (sans Récupération : « 2 min »).
    renderScreenWithDraft(
      [anActivity("ex-1", "IN_TOUR", { name: "Gainage", executionParameters: durationParameters(60), postActivityRecoverySeconds: 30 })],
      { tourRepeatCount: 2 },
    );
    expect(headerDuration()).toBe("≈ 3′00″");

    renderScreenWithDraft(
      [anActivity("ex-1", "IN_TOUR", { name: "Gainage", executionParameters: durationParameters(60), postActivityRecoverySeconds: 0 })],
      { tourRepeatCount: 2 },
    );
    expect(headerDuration()).toBe("≈ 2′00″");
  });

  // PRE-6 story 5.1 : la récupération est dans la carte ; la rangée sous la carte ne porte plus qu'un point.
  // PRE-6 story 5.2 (D-435) : plus de repère par occurrence ; le rail de l'occurrence ne suit pas le
  // balayage (le rail ne glisse pas), et la carte soulevée sort du rail.
  // PRE-6 story 6.2 (D-441) : la rangée du point est AUTONOME — elle ne suit ni le balayage ni le
  // glisser de la carte qui la précède ; le rail de la carte ne suit ni l'un ni l'autre.
  it("PRE6-6.2 — la rangée du point ne suit ni le balayage ni le glisser de la carte ; le rail de la carte non plus", () => {
    renderScreenWithDraft(
      [anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: 20 }), anActivity("ex-2", "BEFORE_TOUR", { name: "Planche" })],
      { stopPoints: [{ id: "p1", scope: "BEFORE_TOUR", position: 1 }] },
    );
    const hidden = { includeHiddenElements: true };
    const transformOf = (testID: string) =>
      (StyleSheet.flatten(screen.getByTestId(testID, hidden).props.style).transform ?? []) as Record<string, number>[];
    const cardTransform = () => transformOf("composition-exercise-row-ex-1");
    const translation = (testID: string) => transformOf(testID).reduce((sum, entry) => sum + (entry.translateY ?? 0), 0);

    fireSwipeLeft("ex-1");
    expect(cardTransform()[0]!.translateX).toBeLessThan(0);
    expect(transformOf("composition-stop-point-p1").some((entry) => (entry.translateX ?? 0) !== 0)).toBe(false);
    expect(StyleSheet.flatten(screen.getByTestId("composition-rail-tail-ex-1", hidden).props.style).transform).toBeUndefined();
    expect(transformOf("composition-rail-link-ex-1").some((entry) => entry.translateX !== undefined)).toBe(false);
    fireSwipeRight("ex-1");

    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 200, pageY: 150 } });

    expect(cardTransform()[1]!.translateY).toBe(50);
    // Le point reste à sa place (D-441, R1) : aucune translation de sa ligne ni de sa rangée.
    expect(translation("composition-stop-point-p1")).toBe(0);
    expect(screen.getByTestId("composition-rail-dot-stop-p1", hidden)).toBeTruthy();
    expect(screen.queryByTestId("composition-rail-link-ex-1", hidden)).toBeNull();
    expect(screen.queryByTestId("composition-rail-tail-ex-1", hidden)).toBeNull();
  });

  // PRE-6 story 5.2 (D-435) : le rail passe sur les marges de la carte (jusqu'aux bords du média) :
  // il est peint après la carte, et avant la rangée sous la carte (les puces passent dessus).
  it("PRE6-5.2 — le rail d'une occurrence est peint après les actions glissées et la carte ; story 6.2 : la rangée du point est hors du bloc", () => {
    renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage" }), anActivity("ex-2", "BEFORE_TOUR", { name: "Planche" })], {
      stopPoints: [{ id: "p1", scope: "BEFORE_TOUR", position: 1 }],
    });
    fireSwipeLeft("ex-1");
    const children = (screen.getByTestId("composition-activity-ex-1").children as { props: { testID?: string } }[]).map(
      (child) => child.props.testID,
    );
    const at = (testID: string) => children.indexOf(testID);
    expect(at("composition-activity-actions-ex-1")).toBeGreaterThanOrEqual(0);
    expect(at("composition-exercise-row-ex-1")).toBeGreaterThan(at("composition-activity-actions-ex-1"));
    for (const rail of ["composition-rail-link-ex-1", "composition-rail-tail-ex-1"]) {
      expect(at(rail)).toBeGreaterThan(at("composition-exercise-row-ex-1"));
    }
    // Ni rangée ni point de raccord dans le bloc de la carte.
    expect(at("composition-activity-recovery-slot-ex-1")).toBe(-1);
    expect(at("composition-rail-dot-ex-1")).toBe(-1);
    // Dans la rangée du point : le rail est peint avant la puce (les puces passent dessus).
    const row = (screen.getByTestId("composition-stop-point-row-p1").children as { props: { testID?: string } }[]).map(
      (child) => child.props.testID,
    );
    expect(row.indexOf("composition-rail-dot-stop-p1")).toBeLessThan(row.indexOf("composition-stop-point-p1"));
  });

  it("PRE6-2.1 — toute la rangée d'une borne ouvre la saisie (clavier depuis le 07/11/2026), y compris un toucher sur le libellé", () => {
    renderScreen();
    fireEvent.press(within(screen.getByTestId("composition-boundary-countdown")).getByText(composition.countdown.label));
    expect(screen.getAllByLabelText(composition.countdown.label)[0].props.accessibilityState).toMatchObject({ expanded: true });
    expect(screen.getByTestId("carrier-duration-input")).toBeTruthy();
  });

  it("PRE6-2.1, révisé 7.2 — la puce Étiquette ouvre LabelPickerModal ; avec une Étiquette, elle montre l’icône teintée et le nom", async () => {
    renderScreenWithDraft([], { labelId: null });
    fireEvent.press(screen.getByLabelText(composition.label.accessibilityLabel));
    expect(await screen.findByTestId("label-picker-tag-label-sport")).toBeTruthy();

    renderScreenWithDraft([], { labelId: "label-sport" });
    await waitFor(() => {
      const chip = screen.getByLabelText(composition.label.accessibilityLabel);
      expect(StyleSheet.flatten(within(chip).getByTestId("composition-session-label-icon").props.style).tintColor).toBe("#2E9B62");
      // Story 7.2 (D-442) : plus de pastille ronde ; l'icône est celle d'étiquette (contour), de la taille de la puce.
      expect(within(chip).queryByTestId("composition-session-color-swatch")).toBeNull();
      expect(within(chip).queryByTestId("composition-session-label-outline-icon")).toBeNull();
      expect(within(chip).getByTestId("composition-session-label-name").props.children).toBe("Sport");
      expect(within(chip).queryByTestId("composition-session-label-outline-icon")).toBeNull();
    });
  });

  // PRE-6 story 5.1 (revue) : la récupération est dans la carte, dont le nom accessible la porte.
  it("PRE6-2.1, révisé 5.1 — la récupération figure dans le nom accessible de la carte", () => {
    renderScreenWithDraft([anActivity("ex-1", "BEFORE_TOUR", { name: "Gainage", postActivityRecoverySeconds: 20 })]);
    expect(screen.getByTestId("composition-exercise-row-ex-1").props.accessibilityLabel).toMatch(/, récupération 20 secondes$/u);
  });

  // PRE-6 story 5.2 (D-435, `8328:28605`) : plus de repère par occurrence — le média sert d'ancrage.
  // Hors Circuit comme dans le Circuit, le rail (1,5, `#7A7A80`) arrive au haut du média et repart de son bas, centré
  // sur lui. D-511 (08/11/2026) : média à 4 (haut 4, bas 68, x 36 dans la carte de 362 à x 20 : x 56 à 402).
  // [Média à 8 (8, 72, x 40 dans la carte de 370 à x 16) — remplacé le 08/11/2026.]
  it("PRE6-5.2 — rail ancré sur le média, hors Circuit et dans le Circuit ; plus aucun repère par occurrence", () => {
    renderScreenWithDraft([
      { ...createExerciseDraft("out"), name: "Échauffement", structuralPosition: "BEFORE_TOUR", executionParameters: durationParameters(60) },
      { ...createExerciseDraft("in"), name: "Gainage", structuralPosition: "IN_TOUR", executionParameters: durationParameters(60) },
    ]);
    const hidden = { includeHiddenElements: true };
    for (const id of ["out", "in"]) {
      expect(screen.queryByTestId(`composition-sequence-marker-${id}`, hidden)).toBeNull();
      const link = StyleSheet.flatten(screen.getByTestId(`composition-rail-link-${id}`, hidden).props.style);
      const tail = StyleSheet.flatten(screen.getByTestId(`composition-rail-tail-${id}`, hidden).props.style);
      expect(link).toMatchObject({ position: "absolute", width: 1.5, left: 36 - 0.75, backgroundColor: TEXT_TERTIARY });
      expect((link.top as number) + (link.height as number)).toBe(4);
      expect(tail).toMatchObject({ width: 1.5, left: 36 - 0.75, top: 68, bottom: 0, backgroundColor: TEXT_TERTIARY });
      expect(link.pointerEvents ?? screen.getByTestId(`composition-rail-link-${id}`, hidden).props.pointerEvents).toBe("none");
    }
    // Média à 4 du bord extérieur dans les deux variantes : contenu repéré sur le bord extérieur, le rail passe par son centre.
    for (const id of ["out", "in"]) {
      expect(StyleSheet.flatten(within(screen.getByTestId(`composition-exercise-row-${id}`)).getByTestId("composition-activity-main-card").props.style).left).toBe(-0.5);
      expect(StyleSheet.flatten(within(screen.getByTestId(`composition-exercise-row-${id}`)).getByTestId("composition-exercise-media").props.style).left).toBe(4);
    }
  });
});

/**
 * PRE-6 (story 2.3) : organisation des occurrences et Circuit de Séries — entrée adaptée à N
 * avec confirmation de perte, sortie sans message, actions accessibles (CE-T03-08 §18).
 */
describe("CompositionScreen — organisation des occurrences et Circuit (PRE-6, story 2.3)", () => {
  // PRE-6 story 7.7 : actions glissées animées.
  swipeMotion();
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
    // PRE-9 B.2 : `circuit-member` à 290–360 en absolu ; le dépôt (300) le précède.
    fireLayout(screen.getByTestId("composition-zone-in-tour"), 60, 70);
    fireLayout(screen.getByTestId("composition-activity-circuit-member"), 0, 70);
    const container = () => screen.getByTestId("composition-activity-ex-1");
    fireEvent(container(), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(screen.getByTestId("composition-exercise-row-ex-1"), "longPress");
    fireEvent(container(), "responderMove", { nativeEvent: { pageX: 200, pageY: 300 } });
    fireEvent(container(), "touchEnd", { nativeEvent: { pageX: 200, pageY: 300 } });
  }

  const seriesDraft = (count: number): Partial<Draft> => ({ circuitNature: "SERIES", tourRepeatCount: count });
  // PRE-9 B.2 — D-451, COMP §1 : le Circuit n'existe qu'avec un Exercice (N séries en Séries).
  const circuitMember = (series: number) => anActivity("circuit-member", "IN_TOUR", { executionParameters: durationParameters(30, series) });

  it("glisser vers un Circuit de Séries avec perte : dialogue ; Annuler restitue la position", () => {
    renderWithProbe([anActivity("ex-1", "BEFORE_TOUR", { executionParameters: durationParameters(30, 3) }), circuitMember(2)], seriesDraft(2));
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
    renderWithProbe([anActivity("ex-1", "BEFORE_TOUR", { executionParameters: durationParameters(30, 3) }), circuitMember(2)], seriesDraft(2));
    dragIntoCircuit();
    fireEvent.press(screen.getByLabelText(t.confirm));

    expect(screen.queryByTestId("circuit-entry-confirm-card")).toBeNull();
    expect(exerciseOf("ex-1").structuralPosition).toBe("IN_TOUR");
    expect(seriesCountOfDraft("ex-1")).toBe(2);
  });

  it("entrée en Séries sans perte : adaptée à N, sans dialogue", () => {
    renderWithProbe([anActivity("ex-1", "BEFORE_TOUR", { executionParameters: durationParameters(30, 3) }), circuitMember(4)], seriesDraft(4));
    dragIntoCircuit();

    expect(screen.queryByTestId("circuit-entry-confirm-card")).toBeNull();
    expect(exerciseOf("ex-1").structuralPosition).toBe("IN_TOUR");
    expect(seriesCountOfDraft("ex-1")).toBe(4);
  });

  it("Circuit de Tours : déplacement inchangé, paramètres conservés, sans dialogue", () => {
    renderWithProbe([anActivity("ex-1", "BEFORE_TOUR", { executionParameters: durationParameters(30, 3) }), circuitMember(1)], {
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
    // Deux copies successives : deux identifiants distincts (le Domaine refuse une collision).
    (jest.requireMock("expo-crypto") as { randomUUID: jest.Mock }).randomUUID
      .mockReturnValueOnce("copy-1")
      .mockReturnValueOnce("copy-2");
    renderWithProbe([anActivity("ex-1", "BEFORE_TOUR", { name: "Squat" })]);
    a11yAction("ex-1", "duplicate");
    expect(screen.getByText("Squat (copie)")).toBeTruthy();
    a11yAction("ex-1", "duplicate");
    // PRE-7 (R-3, Q3) : même nom (celui du Mouvement), suffixe porté par le numéro de copie.
    expect(probe.draft!.exercises.map((exercise) => [exercise.name, exercise.copyNumber ?? null])).toEqual([
      ["Squat", null],
      ["Squat", 2],
      ["Squat", 1],
    ]);
    expect(screen.getByText("Squat (copie 2)")).toBeTruthy();
  });

  it("story 7.5 (D-442 amendée) — Supprimer une occurrence suivie d'un point qui deviendrait premier : appliqué, le point retiré", () => {
    const restoreTiming = jsDrivenAnimations();
    try {
      renderWithProbe([anActivity("ex-1", "BEFORE_TOUR"), anActivity("ex-2", "BEFORE_TOUR")], {
        stopPoints: [{ id: "p1", scope: "BEFORE_TOUR", position: 1 }],
      });
      a11yAction("ex-1", "delete");

      finishDeletionAnimation();
      expect(probe.draft!.exercises.map((exercise) => exercise.id)).toEqual(["ex-2"]);
      expect(probe.draft!.stopPoints ?? []).toEqual([]);
    } finally {
      restoreTiming();
    }
  });

  it("D-441 — Supprimer une occurrence : le point reste à sa place dans la séquence quand c'est permis", () => {
    renderWithProbe(
      [anActivity("ex-1", "BEFORE_TOUR"), anActivity("ex-2", "BEFORE_TOUR"), anActivity("ex-3", "BEFORE_TOUR")],
      { stopPoints: [{ id: "p1", scope: "BEFORE_TOUR", position: 2 }] },
    );
    a11yAction("ex-1", "delete");

    expect(probe.draft!.exercises.map((exercise) => exercise.id)).toEqual(["ex-2", "ex-3"]);
    expect(probe.draft!.stopPoints).toEqual([{ id: "p1", scope: "BEFORE_TOUR", position: 1 }]);
  });

  it("D-442 — « Descendre » qui rendrait un point interdit : offert et appliqué, le point en cause retiré", () => {
    renderWithProbe([anActivity("ex-1", "AFTER_TOUR"), anActivity("ex-2", "AFTER_TOUR")], {
      stopPoints: [{ id: "p1", scope: "AFTER_TOUR", position: 1 }],
    });
    // « Descendre » échange ex-1 avec le point, qui suivrait alors le Compte à rebours : déplacement
    // tolérant (story 7.1), le point est retiré sans message.
    expect(actionNames("ex-1")).toEqual(["moveUp", "moveDown", "duplicate", "delete"]);
    a11yAction("ex-1", "moveDown");

    expect(probe.draft!.exercises.map((exercise) => exercise.id)).toEqual(["ex-1", "ex-2"]);
    expect(probe.draft!.stopPoints).toEqual([]);
  });

  it("une action accessible de déplacement referme les actions glissées révélées", () => {
    renderWithProbe([anActivity("ex-1", "BEFORE_TOUR"), anActivity("ex-2", "BEFORE_TOUR")]);
    fireSwipeLeft("ex-1");
    expect(screen.getByTestId("composition-activity-actions-ex-1")).toBeTruthy();
    a11yAction("ex-1", "moveDown");

    settleMotion();
    expect(screen.queryByTestId("composition-activity-actions-ex-1")).toBeNull();
    expect(probe.draft!.exercises.map((exercise) => exercise.id)).toEqual(["ex-2", "ex-1"]);
  });

  it("Confirmer rejoue le déplacement sur le brouillon courant : une modification faite pendant le dialogue est conservée", () => {
    renderWithProbe([anActivity("ex-1", "BEFORE_TOUR", { executionParameters: durationParameters(30, 3) }), circuitMember(2)], seriesDraft(2));
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
      ["circuit-member", "IN_TOUR"],
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
      // PRE-9 B.1a (RM-027) : le stepper est révélé au toucher du nombre.
      openCircuitStepper();
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
    // PRE-9 B.1a — D-451, complément du 28/10 : la nature se lit dans l'adjectif (l'unité reste
    // « tours »).
    const natureText = () =>
      screen.getByTestId("composition-circuit-header-counter-adjective", { includeHiddenElements: true }).props.children;
    const unitText = () => screen.getByTestId("composition-circuit-header-counter-unit", { includeHiddenElements: true }).props.children;

    it("Tours → Séries sous N : l'exercice suit N, sans dialogue ; le nombre affiché ne change pas", () => {
      renderWithProbe([anActivity("ex-1", "IN_TOUR", { executionParameters: durationParameters(30, 3) })], toursDraft(4));
      expect(natureText()).toBe("groupées");

      chooseNature("SERIES");

      expect(screen.queryByTestId("circuit-nature-confirm-card")).toBeNull();
      expect(probe.draft!.circuitNature).toBe("SERIES");
      expect(probe.draft!.tourRepeatCount).toBe(4);
      expect(seriesCountOfDraft("ex-1")).toBe(4);
      expect(screen.getByTestId("composition-circuit-header-counter-value").props.children).toBe(4);
      expect(natureText()).toBe("alternées");
      expect(unitText()).toBe("tours");
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
      // Story 7.8 (D-443) : plus de durée du Circuit ; la durée de séance suit la nature.
      const sessionDuration = () => screen.getByTestId("composition-session-duration").props.children;
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
      // Durée de séance et adjectif suivent la nature.
      expect(natureText()).toBe("alternées");
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
      expect(natureText()).toBe("groupées");
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
        // PRE-9 B.1a — D-451, complément du 28/10 : « Nombre de tours », « Séries groupées / alternées ».
        expect(screen.getByTestId("composition-circuit-header-counter").props.accessibilityLabel).toBe("Nombre de tours");
        const items = [screen.getByTestId(`${NATURE}-TOURS`, anyNode), screen.getByTestId(`${NATURE}-SERIES`, anyNode)];
        // Recette du 29/10 (ent-3) : titre et description (sous-titre natif) en `Text`, coche en `Image`.
        const parts = (item: (typeof items)[number]) =>
          ([] as { props: { children?: unknown; systemName?: string } }[])
            .concat(item.props.children)
            .map((child) => child.props.systemName ?? child.props.children);
        expect(items.map(parts)).toEqual([
          ["Séries groupées", "toutes les séries d’un exercice exécutées à chaque tour"],
          ["Séries alternées", "une série de chaque exercice exécutée à chaque tour", "checkmark"],
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

      // Story 7.9 (revue) : le menu natif est remonté quand l'unité change ; il ne peut plus rendre le
      // focus — la pastille le reçoit, même sur iOS, quand la nature change sans dialogue.
      it("story 7.9 — iOS: a nature change without loss gives the focus back to the pill; choosing the current nature does not", () => {
        const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
        const focusTargets = () =>
          focus.mock.calls.map(([target, event]) => [(target as unknown as { props: { testID?: string } }).props.testID, event]);
        try {
          renderWithProbe([anActivity("ex-1", "IN_TOUR", { executionParameters: variableParameters({ rows: rowsOf([10, 20]) }) })], toursDraft(2));
          focus.mockClear();
          chooseNature("TOURS");
          expect(focusTargets()).toEqual([]);
          chooseNature("SERIES");
          expect(probe.draft!.circuitNature).toBe("SERIES");
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

      it("révéler le stepper (toucher du nombre, PRE-9 B.1a) referme le choix ; toucher ailleurs ferme sans rien changer ; une option s'applique", () => {
        renderWithProbe([anActivity("ex-1", "IN_TOUR", { executionParameters: durationParameters(30, 2) })], toursDraft(3));
        const before = probe.draft;

        // Avant la mesure de l'en-tête : aucun panneau.
        fireEvent.press(screen.getByTestId(NATURE));
        expect(screen.queryByTestId(PANEL, anyNode)).toBeNull();
        fireEvent.press(screen.getByTestId("composition-circuit-nature-outside"));

        measureHeader();
        fireEvent.press(screen.getByTestId(NATURE));
        const panel = screen.getByTestId(PANEL);
        // Hébergé par le contenu défilant, sous l'en-tête, aligné sur le bord droit du contenu.
        expect(StyleSheet.flatten(panel.props.style)).toMatchObject({ top: 230 + 12 + 44 + spacing[4], right: spacing[16] });

        // PRE-9 B.1a (RM-027, remplace le stepper toujours affiché de la story 7.3) : toucher le
        // nombre révèle le stepper et referme le choix (un seul contrôle ouvert) ; un pas
        // s'applique ; le pas inverse rend le brouillon à N = 3.
        // Panneau ouvert : le reste de l'écran est masqué à l'accessibilité (requêtes `anyNode`).
        expect(screen.queryByTestId("composition-circuit-header-counter-stepper-increment", anyNode)).toBeNull();
        fireEvent.press(screen.getByTestId("composition-circuit-header-counter", anyNode));
        expect(screen.queryByTestId(PANEL)).toBeNull();
        const plus = screen.getByTestId("composition-circuit-header-counter-stepper-increment", anyNode);
        fireEvent(plus, "pressIn");
        fireEvent(plus, "pressOut");
        expect(screen.queryByTestId(PANEL)).toBeNull();
        expect(probe.draft!.tourRepeatCount).toBe(4);
        const minus = screen.getByTestId("composition-circuit-header-counter-stepper-decrement");
        fireEvent(minus, "pressIn");
        fireEvent(minus, "pressOut");
        expect(probe.draft!.tourRepeatCount).toBe(3);
        const reverted = probe.draft;

        // Toucher ailleurs (corps, puis conteneur Circuit, puis hors du panneau) : sans mutation.
        fireEvent.press(screen.getByTestId(NATURE));
        fireEvent.press(screen.getByTestId("composition-circuit-nature-outside", anyNode));
        expect(screen.queryByTestId(PANEL)).toBeNull();
        fireEvent.press(screen.getByTestId(NATURE));
        fireEvent.press(screen.getByTestId("composition-circuit-nature-outside-section", anyNode));
        expect(screen.queryByTestId(PANEL)).toBeNull();
        fireEvent.press(screen.getByTestId(NATURE));
        fireEvent.press(screen.getByTestId(`${PANEL}-outside`, anyNode));
        expect(screen.queryByTestId(PANEL)).toBeNull();
        expect(probe.draft).toBe(reverted);
        expect(probe.draft!.circuitNature).toBe(before!.circuitNature);

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
          fireEvent.press(screen.getByTestId("composition-circuit-nature-outside-section", anyNode));
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

// Complément du 5 novembre 2026 (Hermann, §6) : le bouton œil « Voir les volumes » et la fenêtre « Volumes du circuit »
// (CE-CIR-03) sont retirés ; « Ajouter un arrêt » et « + » gardent leur place. [Tests de la story 3.4 / 5.1b — remplacés.]
describe("CompositionScreen — œil et « Volumes du circuit » retirés (complément du 5 novembre 2026)", () => {
  it("la zone de contexte ne porte plus l'œil : seuls « Ajouter un arrêt » et « + »", () => {
    renderScreen();
    expect(screen.queryByTestId("composition-volumes-action")).toBeNull();
    expect(screen.queryByTestId("composition-circuit-volumes")).toBeNull();
    expect(screen.getByLabelText(composition.addActivity)).toBeTruthy();
  });
});

/**
 * PRE-6 story 4.1 (AD-43, E7, E13, `8328:28622`, `8328:29270`, `8328:28733`) : action
 * « Ajouter un arrêt », mode placement sur un sous-brouillon local, puces des emplacements,
 * roulette « Durée de récupération », barre « Confirmer N points d’arrêt ajoutés » / « Annuler ».
 */
describe("CompositionScreen — mode placement et sous-brouillon (PRE-6 story 4.1)", () => {
  type Draft = SessionDraftContextValue["draft"];
  const anyNode = { includeHiddenElements: true } as const;
  const p = strings.screens.composition.placement;
  const probe: { draft: Draft | null; updates: number } = { draft: null, updates: 0 };

  /** Brouillon d'état réel qui compte les appels à `updateDraft` (une seule mise à jour à « Confirmer »). */
  function CountingDraftWrapper({ initial, children }: { initial: Draft; children: React.ReactNode }) {
    const [draft, setDraft] = useState<Draft>(initial);
    const updateDraft = useCallback((update: SessionDraftUpdate) => {
      probe.updates += 1;
      setDraft((current) => ({ ...current, ...(typeof update === "function" ? update(current) : update) }));
    }, []);
    const resetDraft = useCallback(() => setDraft(initial), [initial]);
    const value = useMemo<SessionDraftContextValue>(() => ({ draft, updateDraft, resetDraft }), [draft, updateDraft, resetDraft]);
    useEffect(() => {
      probe.draft = draft;
    }, [draft]);
    return <SessionDraftContext.Provider value={value}>{children}</SessionDraftContext.Provider>;
  }

  function renderPlacement(
    exercises: readonly SessionDraftExercise[],
    { overrides, profileRecoverySeconds }: { overrides?: Partial<Draft>; profileRecoverySeconds?: number } = {},
  ) {
    probe.draft = null;
    probe.updates = 0;
    const initial: Draft = {
      name: "Séance simple",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercises,
      ...overrides,
    };
    const profileService =
      profileRecoverySeconds === undefined
        ? null
        : ({
            getProfile: async () => ({
              ...createDefaultProfile("profile", "2026-10-21T00:00:00.000Z"),
              postActivityRecoverySecondsDefault: profileRecoverySeconds,
            }),
          } as unknown as ProfileService);
    const view = render(
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService()}>
          <ReferentialServiceContext.Provider value={fakeReferentialService()}>
            <ProfileServiceContext.Provider value={profileService}>
              <CountingDraftWrapper initial={initial}>
                <CompositionScreen />
              </CountingDraftWrapper>
            </ProfileServiceContext.Provider>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
    measureDisplayedRows();
    return view;
  }

  /** Matrice de la story : A (avant), Circuit [B, C], D (après). */
  const matrix = (overrides: Partial<Record<"A" | "B" | "C" | "D", Partial<SessionDraftExercise>>> = {}) => [
    anActivity("A", "BEFORE_TOUR", { name: "A", ...overrides.A }),
    anActivity("B", "IN_TOUR", { name: "B", ...overrides.B }),
    anActivity("C", "IN_TOUR", { name: "C", ...overrides.C }),
    anActivity("D", "AFTER_TOUR", { name: "D", ...overrides.D }),
  ];
  const ADD_STOP = "composition-add-stop-action";
  const BAR = "composition-placement-bar";
  const confirm = () => screen.getByTestId(`${BAR}-confirm`);
  const enter = () => fireEvent.press(screen.getByTestId(ADD_STOP));
  const recoveryLabel = (name: string) => p.addRecoveryAccessibilityLabel.replace("{exercise}", name);
  const stopLabel = (name: string) => p.addStopPointAccessibilityLabel.replace("{exercise}", name);

  it("the header action « Ajouter un arrêt » (round 34, target 44) sits left of « + » and enters placement, filled while active", () => {
    renderPlacement(matrix());
    const action = screen.getByLabelText(p.addStopAccessibilityLabel);
    expect(action.props.testID).toBe(ADD_STOP);
    // Revue 5.1b : boîte tactile réelle de 44 (plus de hitSlop), cercle de 34 centré.
    expect(StyleSheet.flatten(action.props.style)).toMatchObject({ width: 44, height: 44 });
    expect(action.props.hitSlop).toBeUndefined();
    expect(StyleSheet.flatten(screen.getByTestId(`${ADD_STOP}-circle`).props.style)).toMatchObject({ width: 34, height: 34, borderRadius: 17 });
    expect(action.props.accessibilityState).toMatchObject({ selected: false });
    expect(screen.getByTestId("composition-add-stop-icon")).toBeTruthy();
    const order = screen
      .getByTestId("composition-info-row")
      .findAll((node) => typeof node.props.testID === "string")
      .map((node) => node.props.testID as string);
    expect(order.indexOf(ADD_STOP)).toBeGreaterThanOrEqual(0);
    expect(order.indexOf(ADD_STOP)).toBeLessThan(order.indexOf("composition-add-activity-action"));

    enter();
    expect(screen.getByTestId(ADD_STOP).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId("composition-add-stop-icon-active")).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId(`${ADD_STOP}-circle`).props.style).backgroundColor).toBe("#F1F1FF");
  });

  it("placement: « Continuer » is replaced by the bar, the rest is inactive (cards not attenuated, D6), the demarcation rule is hidden", () => {
    // PRE-6 story 5.1 (D-435, choix D1) : aucun trait ; la récupération de A est en ligne 3 de sa carte.
    renderPlacement(matrix({ A: { postActivityRecoverySeconds: 20 } }));
    // Story 7.2 (D-442) : hors placement, la récupération n'est pas une cible.
    expect(screen.getByTestId("composition-activity-recovery-A-recovery").props.onStartShouldSetResponder).toBeUndefined();
    enter();
    // [Story 7.2 (D-442) : « en placement, la récupération existante est une zone SÉLECTIONNÉE (cadre) » —
    // remplacé le 01/11/2026 (ordre de Hermann, point 2 ; ch07 « Récupération de l'Exercice et défauts du
    // Profil ») : aucune zone de récupération en placement ; la récupération de A reste affichée en ligne 3,
    // non interactive.]
    expect(screen.queryByTestId("composition-placement-slot-A-recovery", anyNode)).toBeNull();
    const shownRecovery = screen.getByTestId("composition-activity-recovery-A-recovery", anyNode);
    expect(shownRecovery.props.onStartShouldSetResponder).toBeUndefined();
    expect(within(shownRecovery).getByText("20″", anyNode)).toBeTruthy();

    expect(screen.queryByTestId("composition-save-action", anyNode)).toBeNull();
    expect(screen.getByTestId(BAR)).toBeTruthy();
    // PRE-6 story 5.3 (D-435) : emplacements de point sous A, B, C (aucun avant la Fin, sous D).
    for (const id of ["A", "B", "C"]) {
      expect(screen.getByTestId(`composition-activity-recovery-slot-${id}`)).toBeTruthy();
    }
    expect(screen.queryByTestId("composition-activity-recovery-slot-D", anyNode)).toBeNull();
    for (const id of ["A", "B", "C", "D"]) {
      expect(screen.queryByTestId(`composition-placement-slot-${id}-recovery`, anyNode)).toBeNull();
    }
    // « + » atténué et inactif ; revue 5.3 (Figma `8328:29270`) : compteur / œil, bornes et cartes
    // inactifs, non atténués (D6).
    const add = screen.getByTestId("composition-add-activity-action");
    expect(add.props.accessibilityState).toMatchObject({ disabled: true });
    expect(StyleSheet.flatten(add.props.style).opacity).toBe(0.45);
    const header = screen.getByTestId("composition-circuit-header", anyNode);
    expect(header.props.pointerEvents ?? StyleSheet.flatten(header.props.style).pointerEvents).toBe("none");
    expect(StyleSheet.flatten(header.props.style).opacity).toBeUndefined();
    const card = screen.getByTestId("composition-exercise-row-A", anyNode);
    expect(StyleSheet.flatten(card.props.style).opacity).toBeUndefined();
    fireEvent.press(card);
    expect(mockPush).not.toHaveBeenCalled();
    for (const id of ["composition-boundary-countdown-placement", "composition-boundary-final-phase-placement"]) {
      const boundary = screen.getByTestId(id, anyNode);
      expect(boundary.props.pointerEvents).toBe("none");
      expect(StyleSheet.flatten(boundary.props.style)?.opacity).toBeUndefined();
    }
    expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();
  });

  // [PRE-9, 01/11/2026 — ordre de Hermann, point 2 ; ch07 « Récupération de l'Exercice et défauts du
  // Profil » : plus de zone « récupération après A, B, C, D » en placement.]
  it("matrix: stop points after A, B, C and after the Circuit ; none after D (before the End) ; no recovery zone (PRE-9)", () => {
    renderPlacement(matrix());
    enter();
    for (const name of ["A", "B", "C", "D"]) {
      expect(screen.queryByLabelText(recoveryLabel(name), anyNode)).toBeNull();
    }
    for (const name of ["A", "B", "C"]) {
      expect(screen.getByLabelText(stopLabel(name))).toBeTruthy();
    }
    expect(screen.getByLabelText(p.addStopPointAfterCircuitAccessibilityLabel)).toBeTruthy();
    expect(screen.queryByLabelText(stopLabel("D"))).toBeNull();
    // Ordre de focus : le point seul à chaque emplacement (PRE-9 : plus de cadre de récupération) ; la
    // carte elle-même n'est plus un élément accessible.
    const slot = screen.getByTestId("composition-activity-A");
    const labels = slot
      .findAll(
        (node) =>
          node.props.accessible !== false &&
          node.props.accessibilityRole === "button" &&
          typeof node.props.accessibilityLabel === "string",
      )
      .map((node) => node.props.accessibilityLabel as string);
    expect(labels.filter((label, index) => labels.indexOf(label) === index)).toEqual([stopLabel("A")]);
  });

  // [« a single exercise: a recovery after it, no stop point » — remplacé le 01/11/2026 (ordre de Hermann,
  // point 2 ; ch07 « Récupération de l'Exercice et défauts du Profil ») : sans Point possible, le placement
  // n'est pas proposé.]
  it("a single exercise (PRE-9): no stop point, no recovery zone — « Ajouter un arrêt » is unavailable", () => {
    renderPlacement([anActivity("A", "BEFORE_TOUR", { name: "A" })]);
    expect(screen.getByTestId(ADD_STOP).props.accessibilityState).toMatchObject({ disabled: true });
    enter();
    expect(screen.queryByTestId(BAR)).toBeNull();
    expect(screen.queryByLabelText(recoveryLabel("A"), anyNode)).toBeNull();
    expect(screen.queryByLabelText(stopLabel("A"))).toBeNull();
    expect(screen.queryByLabelText(p.addStopPointAfterCircuitAccessibilityLabel)).toBeNull();
  });

  it("an existing recovery (B, 20″) stays on B's card, without any recovery zone (PRE-9) ; an existing point is shown as existing", () => {
    renderPlacement(matrix({ B: { postActivityRecoverySeconds: 20 } }), {
      overrides: { stopPoints: [{ id: "kept", scope: "BEFORE_TOUR", position: 1 }] },
    });
    enter();
    expect(screen.queryByLabelText(recoveryLabel("B"), anyNode)).toBeNull();
    // [Story 7.2 (D-442) : zone de récupération existante sélectionnée — remplacé le 01/11/2026 (PRE-9,
    // ordre de Hermann, point 2) : la récupération de B est seulement affichée en ligne 3 de sa carte.]
    expect(screen.queryByLabelText(p.existingRecoveryAccessibilityLabel.replace("{exercise}", "B"), anyNode)).toBeNull();
    expect(screen.queryByTestId("composition-placement-slot-B-recovery", anyNode)).toBeNull();
    expect(within(screen.getByTestId("composition-activity-recovery-B-recovery", anyNode)).getByText("20″", anyNode)).toBeTruthy();
    expect(screen.queryByLabelText(stopLabel("A"))).toBeNull();
    expect(screen.getByLabelText(p.existingStopPointAccessibilityLabel.replace("{exercise}", "A"))).toBeTruthy();
  });

  // [PRE-9, 01/11/2026 — ordre de Hermann, point 2 ; ch07 « Récupération de l'Exercice et défauts du Profil » : tests de la récupération en placement (stories 4.1/4.2/5.3/7.2) retirés — le placement ne porte que les Points d'arrêt ; la récupération se règle dans Paramètres d'exécution. Retirés ici : ajout d'une récupération à la roulette (défaut du Profil 30 s), grille 0..300 s de la roulette, défaut du Profil (45 s), ✕ de la roulette.]

  it("two stop points: N = 2 ; touching an added chip deselects it (N decreases)", () => {
    renderPlacement(matrix());
    enter();
    fireEvent.press(screen.getByLabelText(stopLabel("A")));
    fireEvent.press(screen.getByLabelText(stopLabel("B")));
    expect(screen.getByLabelText(stopLabel("B")).props.accessibilityState).toMatchObject({ selected: true });
    expect(confirm().props.accessibilityLabel).toBe("Confirmer 2 points d’arrêt ajoutés");

    fireEvent.press(screen.getByLabelText(stopLabel("B")));
    expect(confirm().props.accessibilityLabel).toBe("Confirmer 1 point d’arrêt ajouté");
    fireEvent.press(screen.getByLabelText(stopLabel("A")));
    expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();
    expect(confirm().props.accessibilityLabel).toBe("Confirmer 0 point d’arrêt ajouté");
    expect(confirm().props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("each change of N is announced (by the screen since review 6.3, effect then label)", () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
    announce.mockClear();
    try {
      renderPlacement(matrix());
      enter();
      const confirmAnnouncements = () =>
        announce.mock.calls.filter(([message]) => String(message).startsWith("Confirmer"));
      expect(confirmAnnouncements()).toHaveLength(0);
      fireEvent.press(screen.getByLabelText(stopLabel("A")));
      expect(announce).toHaveBeenLastCalledWith(`${p.stopPointAddedAnnouncement}. Confirmer 1 point d’arrêt ajouté`);
    } finally {
      announce.mockRestore();
    }
  });

  // [« (recoveries and stopPoints) » — remplacé le 01/11/2026 (PRE-9, ordre de Hermann, point 2) : le
  // sous-brouillon ne porte que les Points d'arrêt ; les récupérations des Exercices ne changent pas.]
  it("Confirmer applies the sub-draft (stopPoints only) in a single update, then leaves placement", () => {
    renderPlacement(matrix());
    enter();
    fireEvent.press(screen.getByLabelText(stopLabel("A")));
    fireEvent.press(screen.getByLabelText(p.addStopPointAfterCircuitAccessibilityLabel));
    expect(confirm().props.accessibilityLabel).toBe("Confirmer 2 points d’arrêt ajoutés");
    fireEvent.press(confirm());

    expect(probe.updates).toBe(1);
    expect(probe.draft!.exercises.map((exercise) => exercise.postActivityRecoverySeconds)).toEqual([null, null, null, null]);
    expect(probe.draft!.stopPoints?.map(({ scope, position }) => ({ scope, position }))).toEqual(
      expect.arrayContaining([
        { scope: "BEFORE_TOUR", position: 1 },
        { scope: "AFTER_TOUR", position: 0 },
      ]),
    );
    expect(probe.draft!.stopPoints).toHaveLength(2);
    expect(screen.queryByTestId(BAR)).toBeNull();
    expect(screen.getByTestId("composition-save-action")).toBeTruthy();
    expect(screen.getByTestId(ADD_STOP).props.accessibilityState).toMatchObject({ selected: false });
  });

  it("PRE-9 (01/11/2026) — placement shows no recovery zone; A's 20″ recovery stays on its card; adding a point and Confirmer leaves every recovery unchanged", () => {
    renderPlacement(matrix({ A: { postActivityRecoverySeconds: 20 }, C: { postActivityRecoverySeconds: 45 } }));
    const recoveriesBefore = probe.draft!.exercises.map((exercise) => exercise.postActivityRecoverySeconds);
    expect(recoveriesBefore).toEqual([20, null, 45, null]);
    enter();
    // Aucune zone ni cadre de récupération, aucune roulette « Durée de récupération ».
    expect(screen.queryAllByTestId(/^composition-placement-slot-.*-recovery/u, anyNode)).toHaveLength(0);
    expect(screen.queryByLabelText(recoveryLabel("A"), anyNode)).toBeNull();
    expect(screen.queryByLabelText(p.existingRecoveryAccessibilityLabel.replace("{exercise}", "A"), anyNode)).toBeNull();
    // La récupération de A reste affichée en ligne 3 de sa carte (masquée à l'accessibilité en placement).
    const shown = screen.getByTestId("composition-activity-recovery-A-recovery", anyNode);
    expect(within(shown).getByText("20″", anyNode)).toBeTruthy();
    expect(shown.props.onStartShouldSetResponder).toBeUndefined();
    fireEvent.press(shown);
    expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();
    expect(screen.queryByTestId("duration-wheel-title")).toBeNull();

    fireEvent.press(screen.getByLabelText(stopLabel("A")));
    // Seuls les Points d'arrêt sont comptés.
    expect(confirm().props.accessibilityLabel).toBe("Confirmer 1 point d’arrêt ajouté");
    fireEvent.press(confirm());
    expect(probe.updates).toBe(1);
    expect(probe.draft!.exercises.map((exercise) => exercise.postActivityRecoverySeconds)).toEqual(recoveriesBefore);
    expect(probe.draft!.stopPoints?.map(({ scope, position }) => ({ scope, position }))).toEqual([{ scope: "BEFORE_TOUR", position: 1 }]);
    expect(within(screen.getByTestId("composition-activity-recovery-A-recovery")).getByText("20″")).toBeTruthy();
  });

  it("Annuler restores the entry state: same draft (identity), no update", () => {
    renderPlacement(matrix({ A: { postActivityRecoverySeconds: 20 } }));
    const before = probe.draft;
    enter();
    fireEvent.press(screen.getByLabelText(stopLabel("B")));
    fireEvent.press(screen.getByLabelText(stopLabel("A")));
    fireEvent.press(screen.getByTestId(`${BAR}-cancel`));

    expect(probe.updates).toBe(0);
    expect(probe.draft).toBe(before);
    expect(screen.queryByTestId(BAR)).toBeNull();
    // Nouvelle entrée : sous-brouillon vide.
    enter();
    expect(confirm().props.accessibilityLabel).toBe("Confirmer 0 point d’arrêt ajouté");
  });

  it("the system back (Android) cancels the placement without mutation", () => {
    const addListener = jest.spyOn(BackHandler, "addEventListener");
    try {
      renderPlacement(matrix());
      const before = probe.draft;
      enter();
      fireEvent.press(screen.getByLabelText(stopLabel("A")));
      const handler = addListener.mock.calls.at(-1)![1] as () => boolean;
      let handled = false;
      act(() => {
        handled = handler();
      });
      expect(handled).toBe(true);
      expect(screen.queryByTestId(BAR)).toBeNull();
      expect(probe.draft).toBe(before);
    } finally {
      addListener.mockRestore();
    }
  });

  // [PRE-9, 01/11/2026 — ordre de Hermann, point 2 ; ch07 « Récupération de l'Exercice et défauts du Profil » : test de la récupération en placement (story 4.1, « R = 0 ✓ ») retiré — le placement ne porte que les Points d'arrêt ; la récupération se règle dans Paramètres d'exécution.]

  // [PRE-9, 01/11/2026 — ordre de Hermann, point 2 ; ch07 « Récupération de l'Exercice et défauts du Profil » : test de la récupération en placement (story 7.8 / B.1a, « the session and Circuit durations are recalculated live during placement ») retiré — seule une récupération modifiait les durées en placement ; un Point d'arrêt ne les change pas ; la récupération se règle dans Paramètres d'exécution.]
  it("entering placement closes every open surface (add tree, revealed Circuit stepper); the Circuit header is inactive", () => {
    renderPlacement(matrix());
    fireEvent.press(screen.getByTestId("composition-add-activity-action"));
    expect(screen.getByTestId("composition-add-activity-tree")).toBeTruthy();
    openCircuitStepper();
    expect(screen.getByTestId("composition-circuit-header-counter-stepper-increment", anyNode)).toBeTruthy();
    enter();
    expect(screen.queryByTestId("composition-add-activity-tree", anyNode)).toBeNull();
    // PRE-9 B.1a (RM-027) : le stepper révélé se referme, comme les autres surfaces.
    expect(screen.queryByTestId("composition-circuit-header-counter-stepper-increment", anyNode)).toBeNull();
    expect(screen.getByTestId("composition-circuit-header", anyNode).props.pointerEvents).toBe("none");
    expect(screen.getByTestId(BAR)).toBeTruthy();
  });

  // [« story 7.2: an existing recovery alone makes it available (removal only) » — remplacé le 01/11/2026
  // (PRE-9, ordre de Hermann, point 2 ; ch07 « Récupération de l'Exercice et défauts du Profil ») : une
  // récupération seule ne rend plus « Ajouter un arrêt » disponible ; plus d'indication
  // `addStopChangesOnlyHint`.]
  it("« Ajouter un arrêt » is unavailable when no slot offers anything (empty Composition); PRE-9: an Exercise with only a recovery leaves it unavailable", () => {
    const view = renderPlacement([]);
    expect(screen.getByTestId(ADD_STOP).props.accessibilityState).toMatchObject({ disabled: true, selected: false });
    enter();
    expect(screen.queryByTestId(BAR)).toBeNull();
    view.unmount();
    renderPlacement([anActivity("A", "BEFORE_TOUR", { name: "A", postActivityRecoverySeconds: 20 })]);
    expect(screen.getByTestId(ADD_STOP).props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId(ADD_STOP).props.accessibilityHint).not.toBe(p.addStopChangesOnlyHint);
    enter();
    expect(screen.queryByTestId(BAR)).toBeNull();
    expect(probe.draft!.exercises[0].postActivityRecoverySeconds).toBe(20);
    screen.unmount();
    renderPlacement([anActivity("A", "BEFORE_TOUR", { name: "A" }), anActivity("B", "BEFORE_TOUR", { name: "B" })]);
    expect(screen.getByTestId(ADD_STOP).props.accessibilityState).toMatchObject({ disabled: false });
    expect(screen.getByTestId(ADD_STOP).props.accessibilityHint).toBeUndefined();
  });

  it("the header X during placement cancels the placement first (no mutation, no navigation)", () => {
    renderPlacement(matrix());
    const before = probe.draft;
    enter();
    fireEvent.press(screen.getByLabelText(stopLabel("A")));
    fireEvent.press(screen.getByLabelText(composition.closeAccessibilityLabel));
    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.queryByTestId(BAR)).toBeNull();
    expect(probe.draft).toBe(before);
    expect(probe.updates).toBe(0);
    fireEvent.press(screen.getByLabelText(composition.closeAccessibilityLabel));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("an exit intercepted by the guard during placement cancels the placement, without the abandon dialog over the bar", () => {
    const guard = { pending: false, lastShouldBlock: false };
    const cancelExit = jest.fn(() => {
      guard.pending = false;
    });
    mockExitGuard.mockImplementation((shouldBlock: unknown) => {
      guard.lastShouldBlock = shouldBlock as boolean;
      return { isPendingExit: guard.pending, cancelExit, confirmExit: jest.fn() };
    });
    renderPlacement(matrix());
    const before = probe.draft;
    enter();
    // Le placement bloque toujours la sortie (pour l’annuler d’abord).
    expect(guard.lastShouldBlock).toBe(true);
    guard.pending = true;
    fireEvent.press(screen.getByLabelText(stopLabel("A")));

    expect(cancelExit).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId(BAR)).toBeNull();
    expect(screen.queryByText(composition.abandonModal.title)).toBeNull();
    expect(probe.draft).toBe(before);
    expect(probe.updates).toBe(0);
  });

  it("focus loss (useFocusEffect cleanup) leaves placement without mutation; re-entry starts empty", () => {
    mockFocusHarness.callbacks = [];
    renderPlacement(matrix());
    const before = probe.draft;
    enter();
    fireEvent.press(screen.getByLabelText(stopLabel("A")));
    act(() => {
      mockFocusHarness.callbacks.forEach((callback) => (callback() as unknown as (() => void) | undefined)?.());
    });
    expect(screen.queryByTestId(BAR)).toBeNull();
    expect(probe.draft).toBe(before);
    expect(probe.updates).toBe(0);
    enter();
    expect(confirm().props.accessibilityLabel).toBe("Confirmer 0 point d’arrêt ajouté");
  });

  // [PRE-9, 01/11/2026 — ordre de Hermann, point 2 ; ch07 « Récupération de l'Exercice et défauts du Profil » : test de la récupération en placement (story 4.1, « Profile default: a tap before it resolves… ») retiré — le placement ne lit plus le défaut du Profil ; la récupération se règle dans Paramètres d'exécution.]

  it("in placement, swipe and drag sequences on a card reveal nothing and change nothing", () => {
    renderPlacement(matrix());
    const before = probe.draft;
    enter();
    fireSwipeLeft("B");
    expect(screen.queryByTestId("composition-activity-actions-B", anyNode)).toBeNull();
    const card = screen.getByTestId("composition-exercise-row-B", anyNode);
    fireEvent(card, "longPress");
    const container = screen.getByTestId("composition-activity-B");
    fireEvent(container, "touchStart", { nativeEvent: { pageX: 100, pageY: 100 } });
    fireEvent(container, "touchMove", { nativeEvent: { pageX: 100, pageY: 400 } });
    fireEvent(container, "touchEnd", { nativeEvent: { pageX: 100, pageY: 400 } });
    expect(screen.queryByTestId("composition-activity-actions-B", anyNode)).toBeNull();
    expect(probe.updates).toBe(0);
    expect(probe.draft).toBe(before);
  });

  it("chips: target bounded by the surrounding gaps (story 5.3) and a selected chip says a tap removes it", () => {
    renderPlacement(matrix());
    enter();
    const chip = screen.getByLabelText(stopLabel("A"));
    // PRE-6 story 5.3 : rangée de 22 entre deux écarts de 8 (9 dans le Circuit) ; la cible (boîte réelle,
    // revue 5.3) s'étend à ces écarts sans atteindre les cartes voisines (38 / 40, 44 n'étant pas atteignable).
    expect(StyleSheet.flatten(chip.props.style)).toMatchObject({ height: 38, marginTop: -8, marginBottom: -8 });
    expect(StyleSheet.flatten(screen.getByLabelText(stopLabel("B")).props.style)).toMatchObject({ height: 40, marginTop: -9, marginBottom: -9 });
    expect(chip.props.accessibilityHint).toBeUndefined();
    fireEvent.press(chip);
    expect(screen.getByLabelText(stopLabel("A")).props.accessibilityHint).toBe(p.selectedHint);
  });

  it("VoiceOver focus moves to the bar on entry and back to « Ajouter un arrêt » after Annuler / Confirmer", () => {
    const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
    try {
      renderPlacement(matrix());
      focus.mockClear();
      const targets = () => focus.mock.calls.map(([target]) => (target as unknown as { props: { testID?: string } }).props.testID);
      enter();
      expect(targets()).toEqual([`${BAR}-confirm`]);
      focus.mockClear();
      fireEvent.press(screen.getByTestId(`${BAR}-cancel`));
      expect(targets()).toEqual([ADD_STOP]);
      enter();
      fireEvent.press(screen.getByLabelText(stopLabel("A")));
      focus.mockClear();
      fireEvent.press(confirm());
      expect(targets()).toEqual([ADD_STOP]);
    } finally {
      focus.mockRestore();
    }
  });

  it("the after-Circuit slot sits between the Circuit and the AFTER_TOUR occurrences; an existing point there is shown as existing", () => {
    renderPlacement(matrix(), { overrides: { stopPoints: [{ id: "after", scope: "AFTER_TOUR", position: 0 }] } });
    enter();
    const ids = screen
      .getByTestId("composition-body")
      .findAll((node) => typeof node.type === "string" && typeof node.props.testID === "string")
      .map((node) => node.props.testID as string);
    const at = (id: string) => ids.indexOf(id);
    expect(at("composition-placement-slot-after-circuit")).toBeGreaterThan(at("composition-tour-section"));
    expect(at("composition-placement-slot-after-circuit")).toBeGreaterThan(at("composition-activity-C"));
    expect(at("composition-placement-slot-after-circuit")).toBeLessThan(at("composition-zone-after-tour"));
    expect(screen.queryByLabelText(p.addStopPointAfterCircuitAccessibilityLabel)).toBeNull();
    const existing = screen.getByLabelText(p.existingStopPointAfterCircuitAccessibilityLabel);
    // PRE-6 story 6.3 (D-441, R3) : point existant sélectionné, désélectionnable (puce pleine de la story 5.3).
    expect(existing.props.accessibilityRole).toBe("button");
    expect(existing.props.accessibilityState).toMatchObject({ selected: true });
    expect(existing.props.testID).toBe("composition-placement-slot-after-circuit-stop-point-existing");
    // Revue 5.3 : rangée de 22 comme hors placement (Figma : 24), sans saut à l'entrée.
    expect(StyleSheet.flatten(screen.getByTestId("composition-placement-slot-after-circuit").props.style).height).toBe(22);
    expect(
      StyleSheet.flatten(screen.getByTestId("composition-placement-slot-after-circuit-stop-point-existing-face").props.style),
    ).toMatchObject({ backgroundColor: "#0508E5", borderStyle: "solid", borderRadius: 10 });
  });

  it("names containing replacement patterns ($&, $1) are inserted verbatim in chip labels", () => {
    renderPlacement([anActivity("A", "BEFORE_TOUR", { name: "Squat $& $1" }), anActivity("B", "IN_TOUR", { name: "B" })]);
    enter();
    expect(screen.getByLabelText("Ajouter un point d’arrêt après Squat $& $1")).toBeTruthy();
  });

  describe("placement mixte et défilement (PRE-6 story 5.3, D-435, `8328:29270`)", () => {
    const box = (node: ReturnType<typeof screen.getByTestId>) => StyleSheet.flatten(node.props.style);
    const PLACEMENT_SURFACE = "rgba(5, 8, 229, 0.05)";

    // [« a « Récupération » frame in line 3 of A and B » — remplacé le 01/11/2026 (PRE-9, ordre de Hermann,
    // point 2 ; ch07 « Récupération de l'Exercice et défauts du Profil ») : plus de cadre de récupération.]
    it("matrix — entry: A, B outside the Circuit, no pause: no recovery frame (PRE-9), a centred « Point d’arrêt » chip between A and B", () => {
      renderPlacement([anActivity("A", "BEFORE_TOUR", { name: "A" }), anActivity("B", "BEFORE_TOUR", { name: "B" })]);
      enter();
      for (const id of ["A", "B"]) {
        expect(screen.queryByTestId(`composition-placement-slot-${id}-recovery`, anyNode)).toBeNull();
        expect(screen.queryByTestId(`composition-placement-slot-${id}-recovery-face`, anyNode)).toBeNull();
        expect(within(screen.getByTestId(`composition-exercise-row-${id}`)).queryByText(p.recovery, anyNode)).toBeNull();
      }
      // Puce entre A et B (aucune après B : juste avant la Fin).
      expect(box(screen.getByTestId("composition-placement-slot-A"))).toMatchObject({
        height: 22,
        justifyContent: "center",
        alignItems: "center",
      });
      expect(box(screen.getByTestId("composition-activity-recovery-slot-A")).marginTop).toBe(8);
      expect(box(screen.getByTestId("composition-placement-slot-A-stop-point-face"))).toMatchObject({
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: colors.primary,
        borderRadius: 10,
        backgroundColor: PLACEMENT_SURFACE,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 6,
      });
      expect(StyleSheet.flatten(within(screen.getByLabelText(stopLabel("A"))).getByText(p.stopPoint).props.style)).toMatchObject({
        fontSize: 10,
        fontWeight: "500",
        color: colors.textLabel,
      });
      expect(screen.queryByLabelText(stopLabel("B"))).toBeNull();
      expect(screen.queryByTestId("composition-activity-recovery-slot-B")).toBeNull();
    });

    // [PRE-9, 01/11/2026 — ordre de Hermann, point 2 ; ch07 « Récupération de l'Exercice et défauts du Profil » : tests de la récupération en placement (stories 5.3/7.2 : R = 0 existante, R = 20 s existante, appui lent, choix d'une récupération) retirés — le placement ne porte que les Points d'arrêt ; la récupération se règle dans Paramètres d'exécution.]

    it("matrix — choosing a point: the chip is selected, N + 1 ; touched again: deselected", () => {
      renderPlacement(matrix());
      enter();
      fireEvent.press(screen.getByLabelText(stopLabel("A")));
      expect(screen.getByLabelText(stopLabel("A")).props.accessibilityState).toMatchObject({ selected: true });
      expect(box(screen.getByTestId("composition-placement-slot-A-stop-point-face"))).toMatchObject({
        borderStyle: "solid",
        backgroundColor: colors.primary,
      });
      expect(confirm().props.accessibilityLabel).toBe("Confirmer 1 point d’arrêt ajouté");
      fireEvent.press(screen.getByLabelText(stopLabel("A")));
      expect(screen.getByLabelText(stopLabel("A")).props.accessibilityState).toMatchObject({ selected: false });
      expect(confirm().props.accessibilityLabel).toBe("Confirmer 0 point d’arrêt ajouté");
    });

    // [« frame in line 3 » — remplacé le 01/11/2026 (PRE-9, ordre de Hermann, point 2) : plus de cadre de
    // récupération ; la rangée de point sous B et C est inchangée.]
    it("matrix — in the Circuit: same presentation, gap 9 (chip row under B and C), no recovery frame (PRE-9)", () => {
      renderPlacement(matrix());
      enter();
      for (const id of ["B", "C"]) {
        expect(screen.queryByTestId(`composition-placement-slot-${id}-recovery`, anyNode)).toBeNull();
        expect(box(screen.getByTestId(`composition-activity-recovery-slot-${id}`)).marginTop).toBe(9);
        expect(box(screen.getByTestId(`composition-placement-slot-${id}`)).height).toBe(22);
      }
    });

    // [PRE-9, 01/11/2026 — ordre de Hermann, point 2 ; ch07 « Récupération de l'Exercice et défauts du Profil » : tests de la récupération en placement (story 5.3 : boîte tactile du cadre hors Circuit / dans le Circuit, largeur du cadre et Zones) retirés — le placement ne porte que les Points d'arrêt ; la récupération se règle dans Paramètres d'exécution.]

    it("the chip's touch box spans its row and the gaps around it: disjoint from the neighbouring cards", () => {
      renderPlacement(matrix());
      enter();
      // Rangée de 22 sous A (écart 8 au-dessus, 8 jusqu'au Circuit) et sous B (9 / 9) : la boîte de la
      // puce s'étend sur ces écarts (marges négatives : la rangée garde 22) et s'arrête au bord des cartes.
      for (const [id, gap] of [
        ["A", 8],
        ["B", 9],
      ] as const) {
        const target = box(screen.getByTestId(`composition-placement-slot-${id}-stop-point`));
        expect(target).toMatchObject({ height: 22 + 2 * gap, marginTop: -gap, marginBottom: -gap });
        expect(target.hitSlop).toBeUndefined();
        expect(box(screen.getByTestId(`composition-activity-recovery-slot-${id}`)).marginTop).toBe(gap);
      }
      expect(box(screen.getByTestId("composition-placement-slot-after-circuit-stop-point"))).toMatchObject({
        height: 38,
        marginTop: -8,
        marginBottom: -8,
      });
    });

    // D-513 (08/11/2026) : la ligne 3 ne porte plus de contrôle en placement — tout le contenu de la carte est grisé.
    // [« sauf la récupération de la ligne 3 » (cadre « Récupération », arbitrage D6) — remplacé le 08/11/2026.]
    it("arbitrage D6 (PR #391), D-513 : the whole card content is greyed, cards stay inactive; boundaries and Circuit header are not greyed but inactive", () => {
      renderPlacement(matrix());
      const row = () => screen.getByTestId("composition-exercise-row-A");
      const content = () => within(row()).getByTestId("composition-exercise-card-content", anyNode);
      expect(box(content()).opacity).toBeUndefined();
      enter();
      const card = row();
      // Surface de la carte non grisée ; son contenu l'est.
      expect(box(card).opacity).toBeUndefined();
      expect(box(content()).opacity).toBe(0.45);
      // D-513 : aucun cadre « Récupération » en pointillés sur la carte.
      for (const node of card.findAll((n) => typeof n.type === "string")) expect(box(node).borderStyle).not.toBe("dashed");
      expect(card.props.accessible).toBe(false);
      fireEvent.press(card);
      fireEvent(card, "longPress");
      expect(mockPush).not.toHaveBeenCalled();
      expect(card.props.accessibilityState).toMatchObject({ selected: false });
      // Contenu de la carte hors ligne 3 : masqué à l'accessibilité. [« le cadre reste exposé » — remplacé
      // le 01/11/2026 (PRE-9, ordre de Hermann, point 2) : plus de cadre de récupération en placement.]
      expect(screen.queryByText("A")).toBeNull();
      expect(screen.getByText("A", anyNode)).toBeTruthy();
      expect(screen.queryByLabelText(recoveryLabel("A"), anyNode)).toBeNull();
      expect(screen.getByLabelText(stopLabel("A"))).toBeTruthy();
      for (const id of ["composition-boundary-countdown-placement", "composition-boundary-final-phase-placement"]) {
        const boundary = screen.getByTestId(id, anyNode);
        expect(boundary.props.pointerEvents).toBe("none");
        expect(box(boundary)?.opacity).toBeUndefined();
      }
      const header = screen.getByTestId("composition-circuit-header", anyNode);
      expect(header.props.pointerEvents).toBe("none");
      expect(box(header).opacity).toBeUndefined();
    });

    it("in placement, swipe and drag on a card reveal no action and change nothing", () => {
      renderPlacement(matrix());
      const before = probe.draft;
      enter();
      fireSwipeLeft("A");
      expect(screen.queryByTestId("composition-activity-actions-A", anyNode)).toBeNull();
      const container = screen.getByTestId("composition-activity-A");
      fireEvent(container, "touchStart", { nativeEvent: { pageX: 100, pageY: 100 } });
      fireEvent(container, "touchMove", { nativeEvent: { pageX: 100, pageY: 400 } });
      fireEvent(container, "touchEnd", { nativeEvent: { pageX: 100, pageY: 400 } });
      expect(screen.queryByTestId("composition-activity-actions-A", anyNode)).toBeNull();
      expect(probe.draft).toBe(before);
      expect(probe.updates).toBe(0);
    });

    it("an existing point after A: selected chip (story 6.3), real target box, no rail dot for A", () => {
      renderPlacement(matrix(), { overrides: { stopPoints: [{ id: "pA", scope: "BEFORE_TOUR", position: 1 }] } });
      enter();
      const existing = screen.getByLabelText(p.existingStopPointAccessibilityLabel.replace("{exercise}", "A"));
      expect(existing.props.testID).toBe("composition-placement-slot-A-stop-point-existing");
      expect(existing.props.accessibilityRole).toBe("button");
      expect(existing.props.accessibilityState).toMatchObject({ selected: true });
      // Boîte réelle de 22 + 2 × 8 (marges négatives), jamais un hitSlop.
      expect(box(existing)).toMatchObject({ height: 22 + 2 * 8, marginTop: -8, marginBottom: -8 });
      expect(existing.props.hitSlop).toBeUndefined();
      expect(screen.queryByLabelText(stopLabel("A"))).toBeNull();
      // Rangée de 22, comme hors placement (aucun saut à l'entrée).
      expect(box(screen.getByTestId("composition-placement-slot-A")).height).toBe(22);
      expect(screen.queryByTestId("composition-rail-dot-A", anyNode)).toBeNull();
    });

    it("a point at a position placement no longer offers (before the End) stays shown as a placed face, its row kept", () => {
      renderPlacement(matrix(), { overrides: { stopPoints: [{ id: "pD", scope: "AFTER_TOUR", position: 1 }] } });
      expect(screen.getByTestId("composition-stop-point-pD-chip")).toBeTruthy();
      enter();
      expect(screen.getByTestId("composition-activity-recovery-slot-D")).toBeTruthy();
      expect(screen.getByLabelText(p.existingStopPointAccessibilityLabel.replace("{exercise}", "D"))).toBeTruthy();
      expect(screen.queryByLabelText(stopLabel("D"))).toBeNull();
    });

    // [PRE-9, 01/11/2026 — ordre de Hermann, point 2 : la composition A, R ne s'ouvrait en placement que
    // grâce à la zone de récupération de A ; un Exercice B est ajouté pour qu'un Point d'arrêt soit
    // possible. Toute récupération affichée en placement (Exercice ou activité de récupération) est
    // désormais non interactive et masquée à l'accessibilité.]
    it("a non-interactive recovery shown in placement is hidden from accessibility (PRE-9: Exercise recoveries too)", () => {
      renderPlacement([
        anActivity("A", "BEFORE_TOUR", { name: "A", postActivityRecoverySeconds: 20 }),
        anActivity("R", "BEFORE_TOUR", { name: "R", type: "RECOVERY", postActivityRecoverySeconds: 20 }),
        anActivity("B", "BEFORE_TOUR", { name: "B" }),
      ]);
      enter();
      expect(screen.getByTestId(BAR)).toBeTruthy();
      for (const id of ["A", "R"]) {
        const shown = screen.getByTestId(`composition-activity-recovery-${id}-recovery`, anyNode);
        expect(shown.props.onStartShouldSetResponder).toBeUndefined();
        // 08/11/2026 : masquée avec tout le contenu de la carte (`OccurrenceCard`, `hideContentFromAccessibility`).
        const content = within(screen.getByTestId(`composition-exercise-row-${id}`, anyNode)).getByTestId("composition-activity-main-card", anyNode);
        expect(content.props.accessibilityElementsHidden).toBe(true);
        expect(content.props.importantForAccessibility).toBe("no-hide-descendants");
        expect(screen.queryByTestId(`composition-activity-recovery-${id}-recovery`)).toBeNull();
        expect(screen.queryByTestId(`composition-placement-slot-${id}-recovery`, anyNode)).toBeNull();
      }
    });

    it("rail: continuous through the slot rows (each block's tail runs to its bottom), no rail dot on a slot", () => {
      renderPlacement(matrix(), { overrides: { stopPoints: [{ id: "after", scope: "AFTER_TOUR", position: 0 }] } });
      enter();
      for (const id of ["A", "B", "C", "D"]) {
        expect(box(screen.getByTestId(`composition-rail-tail-${id}`, anyNode))).toMatchObject({ bottom: 0 });
        expect(screen.queryByTestId(`composition-rail-dot-${id}`, anyNode)).toBeNull();
      }
      expect(box(screen.getByTestId("composition-rail-tail-after-circuit", anyNode))).toMatchObject({ top: 0, bottom: 0 });
      expect(screen.queryByTestId("composition-rail-dot-after-circuit", anyNode)).toBeNull();
      // Un point posé garde la rangée de 22, puce centrée.
      expect(box(screen.getByTestId("composition-placement-slot-after-circuit"))).toMatchObject({
        height: 22,
        justifyContent: "center",
      });
    });

    // Story 7.10 (D-444) : « Continuer » et la barre ✓ / Annuler occupent la même zone, au même
    // emplacement vertical et à la même hauteur (48) : aucun saut à l'entrée ni à la sortie du placement.
    it("story 7.10 — entering and leaving placement keeps the action zone and its content height unchanged (no jump)", () => {
      renderPlacement(matrix({ B: { postActivityRecoverySeconds: 20 } }));
      const zone = () => screen.getByTestId("composition-bottom-action");
      const zoneStyle = () => StyleSheet.flatten(zone().props.style);
      const reserve = () => StyleSheet.flatten(screen.getByTestId("composition-body").props.contentContainerStyle).paddingBottom;
      // Contenu de la zone mesuré : le bouton seul (48), puis la barre seule (48).
      const measureContent = (height: number) =>
        act(() => {
          fireEvent(screen.getByTestId("composition-bottom-action-content"), "layout", {
            nativeEvent: { layout: { x: 0, y: 0, width: 354, height } },
          });
        });
      const before = zoneStyle();
      const buttonHeight = StyleSheet.flatten(screen.getByTestId("composition-save-action").props.style).minHeight;
      expect(buttonHeight).toBe(48);
      measureContent(48);
      expect(reserve()).toBe(114);
      enter();
      // La barre est rendue DANS la même zone, à la place du bouton, à la même hauteur.
      expect(within(zone()).getByTestId(BAR)).toBeTruthy();
      expect(within(zone()).queryByTestId("composition-save-action")).toBeNull();
      expect(StyleSheet.flatten(screen.getByTestId(BAR).props.style).height).toBe(buttonHeight);
      measureContent(48);
      expect(zoneStyle()).toEqual(before);
      expect(reserve()).toBe(114);
      fireEvent.press(screen.getByTestId(`${BAR}-cancel`));
      measureContent(48);
      expect(zoneStyle()).toEqual(before);
      expect(reserve()).toBe(114);
    });

    it("matrix — long sequence: the whole list scrolls; the last slot is in the scrolled content, above the protected footer", () => {
      const many = Array.from({ length: 12 }, (_, index) =>
        anActivity(`E${index}`, index < 6 ? "BEFORE_TOUR" : "AFTER_TOUR", { name: `E${index}` }),
      );
      renderPlacement(many);
      enter();
      const body = screen.getByTestId("composition-body");
      const footer = screen.getByTestId("composition-bottom-action");
      // Le pied (barre de placement ; story 7.2 : plus d'avertissement D-301) est HORS du contenu
      // défilant, après lui.
      expect(within(footer).getByTestId(BAR)).toBeTruthy();
      expect(within(body).queryByTestId(BAR)).toBeNull();
      expect(within(footer).queryByTestId("composition-unpaused-warning")).toBeNull();
      expect(testIdOrder(screen.toJSON(), ["composition-body", "composition-bottom-action"])).toEqual([
        "composition-body",
        "composition-bottom-action",
      ]);
      // Le corps défile et occupe la place restante ; son contenu se termine par une marge basse.
      expect(box(body).flex).toBe(1);
      expect(body.props.scrollEnabled).toBe(true);
      // Story 7.10 (D-444) : réserve de défilement = hauteur de la zone d'action fixe (114).
      expect(StyleSheet.flatten(body.props.contentContainerStyle).paddingBottom).toBe(finalActionZoneHeight(34));
      // Dernier emplacement (point après l'avant-dernière occurrence) : dans le contenu défilant, avant
      // la Fin. [« cadre de la dernière occurrence » — remplacé le 01/11/2026 (PRE-9, ordre de Hermann,
      // point 2) : plus de cadre de récupération en placement.]
      expect(within(body).queryByTestId("composition-placement-slot-E11-recovery", anyNode)).toBeNull();
      expect(within(body).getByTestId("composition-placement-slot-E10-stop-point")).toBeTruthy();
      expect(
        testIdOrder(screen.toJSON(), ["composition-placement-slot-E10-stop-point", "composition-boundary-final-phase-track"]),
      ).toEqual(["composition-placement-slot-E10-stop-point", "composition-boundary-final-phase-track"]);
      // Story 7.10 (D-444) : la barre de placement est dans la même zone que « Continuer », au-dessus
      // de la zone de sécurité (34 + 8), sans chevaucher l'indicateur d'accueil.
      // Correctif J6f : barre centrée dans la zone protégée, comme « Continuer » (33 / 33).
      expect(box(footer)).toMatchObject({ position: "absolute", bottom: 0, paddingTop: 33, paddingBottom: 33 });
    });
  });

  /**
   * PRE-6 story 4.2, révisée par la story 7.2 (D-442, ch13 CE-T03-08 L1496, complément D-442 point
   * 4) : hors placement, la récupération n'est plus une cible (ni roulette, ni bulle « Retirer », ni
   * action accessible) ; elle se modifie et se retire seulement en placement, où sa zone est
   * sélectionnée — la désélectionner programme son retrait (Pause terminale rétablie, RM-038), la
   * resélectionner à une durée la modifie. Les rangées de point (stories 4.2, 6.2) sont inchangées.
   */
  describe("durée, modification et retrait (PRE-6 story 4.2, révisée par la story 7.2, D-442)", () => {
    /** Story 6.2 : ligne et puce de la rangée autonome d'un point, par identifiant de point. */
    const line = (pointId: string) => screen.getByTestId(`composition-stop-point-${pointId}`);
    const stopChip = (pointId: string) => screen.getByTestId(`composition-stop-point-${pointId}-chip`);
    const displayed = (id: string) => screen.getByTestId(`composition-activity-recovery-${id}-recovery`);

    it("a stop point after A is a centred chip « ❚❚ Point d’arrêt » on its own row after A's card (8328:29428 ; story 5.2 : 9819:20018 ; story 6.2 : autonomous row)", () => {
      renderPlacement(matrix({ A: { postActivityRecoverySeconds: 20 } }), {
        overrides: { stopPoints: [{ id: "pA", scope: "BEFORE_TOUR", position: 1 }] },
      });
      const chip = stopChip("pA");
      expect(chip.props.accessibilityLabel).toBe("Point d’arrêt après A");
      expect(chip.props.accessibilityRole).toBeUndefined();
      // Revue 5.3 : la puce dessinée est la face ; le `Pressable` porte la cible réelle (30).
      expect(StyleSheet.flatten(screen.getByTestId("composition-stop-point-pA-chip-face").props.style)).toMatchObject({
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: "#C8C8D7",
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 6,
      });
      expect(StyleSheet.flatten(within(chip).getByText(p.stopPoint).props.style)).toMatchObject({
        fontSize: 10,
        fontWeight: "500",
        color: colors.textLabel,
      });
      // Plus de trait (story 5.1, D1) ; rangée de 22, puce centrée (story 5.2).
      expect(StyleSheet.flatten(line("pA").props.style)).toMatchObject({ height: 22, justifyContent: "center" });
      expect(within(line("pA")).queryByTestId("composition-recovery-line-icon")).toBeNull();
      // Story 6.2 (D-441) : rangée autonome, entre A et B, hors du bloc de A ; la récupération de A
      // reste dans la ligne 3 de sa carte.
      expect(within(screen.getByTestId("composition-activity-A")).queryByTestId("composition-stop-point-pA-chip")).toBeNull();
      expect(
        testIdOrder(screen.toJSON(), [
          "composition-activity-recovery-A-recovery",
          "composition-stop-point-row-pA",
          "composition-activity-B",
        ]),
      ).toEqual(["composition-activity-recovery-A-recovery", "composition-stop-point-row-pA", "composition-activity-B"]);
      expect(screen.queryByTestId("composition-activity-recovery-slot-A")).toBeNull();
      expect(screen.getAllByTestId(/^composition-stop-point-row-/u)).toHaveLength(1);
    });

    it("story 6.2 — a point after the Circuit is the first row of the zone after the Circuit; in placement, the dedicated slot takes over", () => {
      renderPlacement(matrix(), { overrides: { stopPoints: [{ id: "t", scope: "AFTER_TOUR", position: 0 }] } });
      const ids = screen
        .getByTestId("composition-body")
        .findAll((node) => typeof node.type === "string" && typeof node.props.testID === "string")
        .map((node) => node.props.testID as string);
      const at = (id: string) => ids.indexOf(id);
      expect(at("composition-stop-point-row-t")).toBeGreaterThan(at("composition-tour-section"));
      expect(at("composition-stop-point-row-t")).toBeGreaterThan(at("composition-zone-after-tour"));
      expect(at("composition-stop-point-row-t")).toBeLessThan(at("composition-activity-D"));
      expect(screen.queryByTestId("composition-after-circuit-line-track")).toBeNull();
      expect(stopChip("t").props.accessibilityLabel).toBe("Point d’arrêt après le circuit");
      enter();
      expect(screen.queryByTestId("composition-stop-point-row-t")).toBeNull();
      expect(screen.getByTestId("composition-after-circuit-line-track")).toBeTruthy();
    });

    // [« a touch opens the Exercise » — remplacé par la recette iPhone n° 2 du 31/10/2026 (constat c) : le
    // toucher de la carte ouvre la feuille des paramètres d'exécution (annulée ici : rien ne change).]
    it("story 7.2 — outside placement the recovery is display only: a touch is the card's (execution parameters), a long press lifts the card; nothing changes", async () => {
      renderPlacement(matrix({ A: { postActivityRecoverySeconds: 20 } }));
      const before = probe.draft;
      expect(within(displayed("A")).getByText("20″")).toBeTruthy();
      fireEvent.press(displayed("A"));
      await act(async () => undefined);
      expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();
      expect(screen.getByTestId("execution-sheet")).toBeTruthy();
      fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
      await act(async () => undefined);
      expect(mockPush).not.toHaveBeenCalled();
      fireEvent(displayed("A"), "longPress");
      expect(screen.getByTestId("composition-exercise-row-A").props.accessibilityState).toMatchObject({ selected: true });
      expect(screen.queryByText("Retirer la récupération")).toBeNull();
      expect(probe.updates).toBe(0);
      expect(probe.draft).toBe(before);
    });

    it("an absent or zero recovery shows nothing outside placement (décision Hermann 21/10/2026, remplace D-303)", () => {
      renderPlacement(matrix({ B: { postActivityRecoverySeconds: 0 } }));
      expect(screen.queryByTestId("composition-activity-recovery-A-recovery", anyNode)).toBeNull();
      expect(screen.queryByTestId("composition-activity-recovery-B-recovery", anyNode)).toBeNull();
      expect(screen.queryByTestId("composition-activity-recovery-A")).toBeNull();
      expect(screen.queryByTestId("composition-activity-recovery-B")).toBeNull();
    });

    // [PRE-9, 01/11/2026 — ordre de Hermann, point 2 ; ch07 « Récupération de l'Exercice et défauts du Profil » : tests de la récupération en placement (stories 4.2/7.2 : retrait d'une récupération hors et dans le Circuit, modification 20 → 45, Confirmer d'une modification seule, ✕ de la roulette et ✓ 0, valeurs hors grille, resélection à la valeur d'origine, aperçu des durées) retirés — le placement ne porte que les Points d'arrêt ; la récupération se règle dans Paramètres d'exécution.]

    // PRE-6 story 6.2 (D-441) : l'appui long d'un point le saisit (glisser) ; plus de bulle ni d'action
    // de retrait (le retrait revient en placement, story 6.3). Story 7.2 (D-442) : la puce saisie est
    // marquée soulevée (style sélectionné, ombre de la carte soulevée), la rangée garde sa hauteur.
    it("story 6.2 / 7.2 — long press on a point grabs it, marked lifted: no bubble, no « remove » action, nothing removed (also after the Circuit)", () => {
      renderPlacement(matrix(), {
        overrides: {
          stopPoints: [
            { id: "pA", scope: "BEFORE_TOUR", position: 1 },
            { id: "t", scope: "AFTER_TOUR", position: 0 },
          ],
        },
      });
      const before = probe.draft;
      for (const id of ["pA", "t"]) {
        const actions = (stopChip(id).props.accessibilityActions ?? []) as { name: string }[];
        expect(actions.map((action) => action.name)).not.toContain("remove");
        expect(StyleSheet.flatten(screen.getByTestId(`composition-stop-point-${id}-chip-face`).props.style).backgroundColor).toBe(
          colors.background,
        );
        fireEvent(screen.getByTestId(`composition-stop-point-row-${id}`), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
        fireEvent(stopChip(id), "longPress");
        expect(screen.queryByText("Retirer le point d’arrêt")).toBeNull();
        // Le point est réellement soulevé : défilement neutralisé, rangée au premier plan, puce marquée.
        expect(screen.getByTestId("composition-body").props.scrollEnabled).toBe(false);
        expect(StyleSheet.flatten(screen.getByTestId(`composition-stop-point-row-${id}`).props.style).zIndex).toBe(1);
        expect(StyleSheet.flatten(screen.getByTestId(`composition-stop-point-${id}-chip-face`).props.style)).toMatchObject({
          backgroundColor: colors.primary,
          shadowColor: colors.compositionDraggedCardShadow,
        });
        expect(StyleSheet.flatten(line(id).props.style)).toMatchObject({ height: 22 });
        fireEvent(screen.getByTestId(`composition-stop-point-row-${id}`), "touchEnd", { nativeEvent: { pageX: 200, pageY: 100 } });
        expect(screen.getByTestId("composition-body").props.scrollEnabled).toBe(true);
        expect(StyleSheet.flatten(screen.getByTestId(`composition-stop-point-${id}-chip-face`).props.style).backgroundColor).toBe(
          colors.background,
        );
      }
      expect(probe.draft!.stopPoints).toEqual(before!.stopPoints);
    });
  });

  /**
   * PRE-6 story 6.3 (D-441 R3, RM-251, ch13 CE-T03-08, arbitrage du 22/10/2026) : en placement, les
   * points existants sont sélectionnés ; les désélectionner programme leur retrait, appliqué par
   * Confirmer ; Annuler restaure tout ; libellé du bouton selon `placementConfirmation`.
   */
  describe("retrait en placement et libellé (PRE-6 story 6.3, D-441)", () => {
    const existingLabel = (name: string) => p.existingStopPointAccessibilityLabel.replace("{exercise}", name);
    const P_AFTER_A = { id: "P", scope: "BEFORE_TOUR", position: 1 } as const;
    const face = (testID: string) => StyleSheet.flatten(screen.getByTestId(`${testID}-face`).props.style);

    it("an existing point is selected; a touch deselects it (removal programmed), a second touch reselects it", () => {
      renderPlacement(matrix(), { overrides: { stopPoints: [P_AFTER_A] } });
      enter();
      const target = "composition-placement-slot-A-stop-point-existing";
      const chip = () => screen.getByLabelText(existingLabel("A"));
      expect(chip().props.testID).toBe(target);
      expect(chip().props.accessibilityState).toMatchObject({ selected: true });
      expect(chip().props.accessibilityHint).toBe(p.existingStopPointSelectedHint);
      expect(face(target)).toMatchObject({ backgroundColor: "#0508E5", borderStyle: "solid" });
      expect(confirm().props.accessibilityLabel).toBe("Confirmer 0 point d’arrêt ajouté");
      expect(confirm().props.accessibilityState).toMatchObject({ disabled: true });

      fireEvent.press(chip());
      expect(chip().props.accessibilityState).toMatchObject({ selected: false });
      expect(chip().props.accessibilityHint).toBe(p.existingStopPointRemovedHint);
      // Sélection non fondée sur la couleur seule : contour pointillé (puce à ajouter de la story 5.3).
      expect(face(target)).toMatchObject({ borderStyle: "dashed", backgroundColor: "rgba(5, 8, 229, 0.05)" });
      expect(confirm().props.accessibilityLabel).toBe("Confirmer les modifications");
      expect(confirm().props.accessibilityState).toMatchObject({ disabled: false });
      expect(probe.updates).toBe(0);

      fireEvent.press(chip());
      expect(chip().props.accessibilityState).toMatchObject({ selected: true });
      expect(confirm().props.accessibilityLabel).toBe("Confirmer 0 point d’arrêt ajouté");
      expect(confirm().props.accessibilityState).toMatchObject({ disabled: true });
      expect(probe.updates).toBe(0);
    });

    it("Confirmer applies the removal in one update and leaves placement; the point row is gone", () => {
      renderPlacement(matrix(), { overrides: { stopPoints: [P_AFTER_A, { id: "Q", scope: "IN_TOUR", position: 1 }] } });
      enter();
      fireEvent.press(screen.getByLabelText(existingLabel("A")));
      fireEvent.press(confirm());
      expect(probe.updates).toBe(1);
      expect(probe.draft?.stopPoints).toEqual([{ id: "Q", scope: "IN_TOUR", position: 1 }]);
      expect(screen.queryByTestId(BAR)).toBeNull();
      expect(screen.queryByTestId("composition-stop-point-row-P", anyNode)).toBeNull();
      expect(screen.getByTestId("composition-stop-point-row-Q")).toBeTruthy();
    });

    it("Annuler restores the entry state, additions and removals included", () => {
      renderPlacement(matrix(), { overrides: { stopPoints: [P_AFTER_A] } });
      const before = probe.draft;
      enter();
      fireEvent.press(screen.getByLabelText(existingLabel("A")));
      fireEvent.press(screen.getByLabelText(stopLabel("B")));
      expect(confirm().props.accessibilityLabel).toBe("Confirmer les modifications");
      fireEvent.press(screen.getByTestId(`${BAR}-cancel`));
      expect(probe.draft).toBe(before);
      expect(probe.updates).toBe(0);
      enter();
      expect(screen.getByLabelText(existingLabel("A")).props.accessibilityState).toMatchObject({ selected: true });
      expect(screen.getByLabelText(stopLabel("B")).props.accessibilityState).toMatchObject({ selected: false });
    });

    it("label: additions only → « Confirmer 2 points d’arrêt ajoutés »; an addition and a removal → « Confirmer les modifications »", () => {
      renderPlacement(matrix(), { overrides: { stopPoints: [P_AFTER_A] } });
      enter();
      fireEvent.press(screen.getByLabelText(stopLabel("B")));
      fireEvent.press(screen.getByLabelText(stopLabel("C")));
      expect(confirm().props.accessibilityLabel).toBe("Confirmer 2 points d’arrêt ajoutés");
      fireEvent.press(screen.getByLabelText(stopLabel("C")));
      fireEvent.press(screen.getByLabelText(existingLabel("A")));
      expect(confirm().props.accessibilityLabel).toBe("Confirmer les modifications");
      fireEvent.press(confirm());
      expect(probe.draft?.stopPoints?.map(({ scope, position }) => ({ scope, position }))).toEqual([
        { scope: "IN_TOUR", position: 1 },
      ]);
    });

    it("free slots follow the effective state: removing the point after the Circuit frees the slot after C (RM-251)", () => {
      renderPlacement(matrix(), { overrides: { stopPoints: [{ id: "P", scope: "AFTER_TOUR", position: 0 }] } });
      enter();
      // « Après C » (dernier Exercice du Circuit) et « après le Circuit » sont consécutifs.
      expect(screen.queryByLabelText(stopLabel("C"))).toBeNull();
      const existing = () => screen.getByLabelText(p.existingStopPointAfterCircuitAccessibilityLabel);
      fireEvent.press(existing());
      expect(screen.getByLabelText(stopLabel("C"))).toBeTruthy();
      fireEvent.press(screen.getByLabelText(stopLabel("C")));
      // Resélectionner P le rendrait consécutif à l'ajout : refusé (Domaine), P reste désélectionné.
      fireEvent.press(existing());
      expect(existing().props.accessibilityState).toMatchObject({ selected: false });
      fireEvent.press(confirm());
      expect(probe.draft?.stopPoints?.map(({ scope, position }) => ({ scope, position }))).toEqual([
        { scope: "IN_TOUR", position: 2 },
      ]);
    });

    it("a point the placement does not offer (head of the Circuit, inherited data) is shown selected, at its place, and removable", () => {
      renderPlacement(matrix(), { overrides: { stopPoints: [{ id: "H", scope: "IN_TOUR", position: 0 }] } });
      enter();
      const chip = screen.getByLabelText(p.stopPointAtCircuitStartAccessibilityLabel);
      expect(chip.props.testID).toBe("composition-placement-slot-stop-H-stop-point-existing");
      expect(chip.props.accessibilityState).toMatchObject({ selected: true });
      // Cible réelle bornée à l'écart du Circuit (9).
      expect(StyleSheet.flatten(chip.props.style)).toMatchObject({ height: 22 + 2 * 9, marginTop: -9, marginBottom: -9 });
      const ids = screen
        .getByTestId("composition-zone-in-tour")
        .findAll((node) => typeof node.type === "string" && typeof node.props.testID === "string")
        .map((node) => node.props.testID as string);
      expect(ids.indexOf("composition-placement-slot-stop-H-row")).toBeLessThan(ids.indexOf("composition-activity-B"));
      fireEvent.press(chip);
      expect(confirm().props.accessibilityLabel).toBe("Confirmer les modifications");
      fireEvent.press(confirm());
      expect(probe.draft?.stopPoints).toEqual([]);
    });

    it("existing points are named after the preceding exercise with the 6.2 rule (homonyms told apart)", () => {
      renderPlacement(
        [
          anActivity("A1", "BEFORE_TOUR", { name: "Squat" }),
          anActivity("A2", "BEFORE_TOUR", { name: "Squat" }),
          anActivity("Z", "BEFORE_TOUR", { name: "Fente" }),
        ],
        { overrides: { stopPoints: [{ id: "P", scope: "BEFORE_TOUR", position: 2 }] } },
      );
      enter();
      const chip = screen.getByTestId("composition-placement-slot-A2-stop-point-existing");
      expect(chip.props.accessibilityLabel).toBe(`${existingLabel("Squat")}, 2 sur 3`);
    });

    it("« Ajouter un arrêt » stays available when only an existing point can be changed (its removal goes through placement)", () => {
      renderPlacement(
        [
          anActivity("A", "BEFORE_TOUR", { name: "A", postActivityRecoverySeconds: 20 }),
          anActivity("B", "BEFORE_TOUR", { name: "B", postActivityRecoverySeconds: 20 }),
        ],
        { overrides: { stopPoints: [P_AFTER_A] } },
      );
      expect(screen.getByTestId(ADD_STOP).props.accessibilityState).toMatchObject({ disabled: false });
      enter();
      fireEvent.press(screen.getByLabelText(existingLabel("A")));
      fireEvent.press(confirm());
      expect(probe.draft?.stopPoints).toEqual([]);
      // L'emplacement libéré après A est de nouveau proposé à l'ajout.
      enter();
      expect(screen.getByLabelText(stopLabel("A")).props.accessibilityState).toMatchObject({ selected: false });
    });

    // --- Revue 6.3 ---------------------------------------------------------------------------

    it("review: two inherited points on the same location are removed independently (by id); adjacent targets share the gap", () => {
      renderPlacement(matrix(), {
        overrides: {
          stopPoints: [
            { id: "X", scope: "BEFORE_TOUR", position: 1 },
            { id: "Y", scope: "BEFORE_TOUR", position: 1 },
          ],
        },
      });
      enter();
      const x = screen.getByTestId("composition-placement-slot-A-stop-point-existing");
      const y = screen.getByTestId("composition-placement-slot-stop-Y-stop-point-existing");
      // Rangée sous A puis rangée de Y : l'écart de 8 qui les sépare est partagé (4 / 4).
      expect(StyleSheet.flatten(x.props.style)).toMatchObject({ marginTop: -8, marginBottom: -4, height: 22 + 8 + 4 });
      expect(StyleSheet.flatten(y.props.style)).toMatchObject({ marginTop: -4, marginBottom: -8, height: 22 + 4 + 8 });
      fireEvent.press(y);
      expect(screen.getByTestId("composition-placement-slot-stop-Y-stop-point-existing").props.accessibilityState).toMatchObject({
        selected: false,
      });
      expect(screen.getByTestId("composition-placement-slot-A-stop-point-existing").props.accessibilityState).toMatchObject({
        selected: true,
      });
      fireEvent.press(confirm());
      expect(probe.draft?.stopPoints).toEqual([{ id: "X", scope: "BEFORE_TOUR", position: 1 }]);
    });

    it("review: two inherited points with a NaN position are removed independently", () => {
      renderPlacement(matrix(), {
        overrides: {
          stopPoints: [
            { id: "M", scope: "IN_TOUR", position: Number.NaN },
            { id: "N", scope: "IN_TOUR", position: Number.NaN },
          ],
        },
      });
      enter();
      fireEvent.press(screen.getByTestId("composition-placement-slot-stop-M-stop-point-existing"));
      expect(screen.getByTestId("composition-placement-slot-stop-N-stop-point-existing").props.accessibilityState).toMatchObject({
        selected: true,
      });
      fireEvent.press(confirm());
      expect(probe.draft?.stopPoints?.map((point) => point.id)).toEqual(["N"]);
    });

    it("review: a reselection the Domain refuses shows the unavailable state and its hint, and a tap announces the refusal", () => {
      const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
      try {
        renderPlacement(matrix(), { overrides: { stopPoints: [{ id: "P", scope: "AFTER_TOUR", position: 0 }] } });
        enter();
        const existing = () => screen.getByLabelText(p.existingStopPointAfterCircuitAccessibilityLabel);
        announce.mockClear();
        fireEvent.press(existing());
        // Un seul message : l'effet du toucher, puis la disponibilité de « Confirmer » (revue 6.3).
        expect(announce.mock.calls).toEqual([[`${p.stopPointRemovedAnnouncement}. Confirmer les modifications`]]);
        expect(existing().props.accessibilityState).toEqual({ selected: false });
        fireEvent.press(screen.getByLabelText(stopLabel("C")));
        expect(existing().props.accessibilityState).toEqual({ selected: false, disabled: true });
        expect(existing().props.accessibilityHint).toBe(p.existingStopPointBlockedHint);
        announce.mockClear();
        fireEvent.press(existing());
        expect(announce).toHaveBeenCalledWith(p.stopPointKeepRefusedAnnouncement);
        expect(existing().props.accessibilityState).toEqual({ selected: false, disabled: true });
        // Retirer l'ajout rend la resélection possible.
        fireEvent.press(screen.getByLabelText(stopLabel("C")));
        expect(existing().props.accessibilityState).toEqual({ selected: false });
        announce.mockClear();
        fireEvent.press(existing());
        expect(announce.mock.calls).toEqual([[`${p.stopPointKeptAnnouncement}. Confirmer 0 point d’arrêt ajouté`]]);
        expect(existing().props.accessibilityState).toEqual({ selected: true });
      } finally {
        announce.mockRestore();
      }
    });

    // [« — point or recovery — » — remplacé le 01/11/2026 (PRE-9, ordre de Hermann, point 2 ; ch07
    // « Récupération de l'Exercice et défauts du Profil ») : le placement ne porte que les Points d'arrêt.]
    it("review (ch13 L1524): each addition or cancelled addition of a point is announced with the new count, once", () => {
      const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
      try {
        renderPlacement(matrix());
        enter();
        announce.mockClear();
        fireEvent.press(screen.getByLabelText(stopLabel("A")));
        expect(announce.mock.calls).toEqual([[`${p.stopPointAddedAnnouncement}. Confirmer 1 point d’arrêt ajouté`]]);
        announce.mockClear();
        fireEvent.press(screen.getByLabelText(stopLabel("B")));
        expect(announce.mock.calls).toEqual([[`${p.stopPointAddedAnnouncement}. Confirmer 2 points d’arrêt ajoutés`]]);
        announce.mockClear();
        fireEvent.press(screen.getByLabelText(stopLabel("B")));
        expect(announce.mock.calls).toEqual([[`${p.additionCancelledAnnouncement}. Confirmer 1 point d’arrêt ajouté`]]);
        announce.mockClear();
        fireEvent.press(screen.getByLabelText(p.addStopPointAfterCircuitAccessibilityLabel));
        expect(announce.mock.calls).toEqual([[`${p.stopPointAddedAnnouncement}. Confirmer 2 points d’arrêt ajoutés`]]);
        announce.mockClear();
        fireEvent.press(screen.getByLabelText(p.addStopPointAfterCircuitAccessibilityLabel));
        expect(announce.mock.calls).toEqual([[`${p.additionCancelledAnnouncement}. Confirmer 1 point d’arrêt ajouté`]]);
        announce.mockClear();
        fireEvent.press(screen.getByLabelText(stopLabel("A")));
        expect(announce.mock.calls).toEqual([[`${p.additionCancelledAnnouncement}. Confirmer 0 point d’arrêt ajouté`]]);
        // [« ✕ de la roulette : rien n'est annoncé » — retiré le 01/11/2026 (PRE-9) : plus de roulette en placement.]
      } finally {
        announce.mockRestore();
      }
    });

    it("review: a deselected existing point does not look like a free slot (dashed and dimmed, its own name)", () => {
      renderPlacement(matrix(), { overrides: { stopPoints: [P_AFTER_A] } });
      enter();
      fireEvent.press(screen.getByLabelText(existingLabel("A")));
      const removed = face("composition-placement-slot-A-stop-point-existing");
      const free = face("composition-placement-slot-B-stop-point");
      expect(removed).toMatchObject({ borderStyle: "dashed", opacity: UNSELECTED_OPACITY });
      expect(free.opacity).toBeUndefined();
      expect(screen.getByLabelText(existingLabel("A")).props.accessibilityLabel).not.toBe(stopLabel("A"));
    });

    it("review: a truncated inherited point, once deselected, never lets a free chip appear at its drawn place", () => {
      renderPlacement(matrix(), { overrides: { stopPoints: [{ id: "T", scope: "BEFORE_TOUR", position: 1.5 }] } });
      enter();
      const truncated = screen.getByTestId("composition-placement-slot-stop-T-stop-point-existing");
      expect(truncated.props.accessibilityLabel).toBe(existingLabel("A"));
      expect(screen.queryByLabelText(stopLabel("A"))).toBeNull();
      fireEvent.press(truncated);
      // L'emplacement « après A » serait libre, mais la puce de T y est dessinée : non proposé.
      expect(screen.queryByLabelText(stopLabel("A"))).toBeNull();
      fireEvent.press(confirm());
      expect(probe.draft?.stopPoints).toEqual([]);
    });

    it("review: the « après le Circuit » row appears when the point after C is deselected and disappears when it is reselected", () => {
      renderPlacement(matrix(), { overrides: { stopPoints: [{ id: "P", scope: "IN_TOUR", position: 2 }] } });
      enter();
      expect(screen.queryByTestId("composition-placement-slot-after-circuit")).toBeNull();
      fireEvent.press(screen.getByLabelText(existingLabel("C")));
      expect(screen.getByLabelText(p.addStopPointAfterCircuitAccessibilityLabel)).toBeTruthy();
      fireEvent.press(screen.getByLabelText(existingLabel("C")));
      expect(screen.queryByTestId("composition-placement-slot-after-circuit")).toBeNull();
    });

    it("review: chips to add are named with the 6.2 rule (last Exercise, homonyms « n sur m »)", () => {
      renderPlacement([
        anActivity("A1", "BEFORE_TOUR", { name: "Squat" }),
        anActivity("A2", "BEFORE_TOUR", { name: "Squat" }),
        anActivity("Z", "BEFORE_TOUR", { name: "Fente" }),
      ]);
      enter();
      expect(screen.getByTestId("composition-placement-slot-A1-stop-point").props.accessibilityLabel).toBe(
        `${stopLabel("Squat")}, 1 sur 3`,
      );
      expect(screen.getByTestId("composition-placement-slot-A2-stop-point").props.accessibilityLabel).toBe(
        `${stopLabel("Squat")}, 2 sur 3`,
      );
    });

    it("verification gap (10): remove P, add after B, reselect P, Confirmer — P and the new point are both in the draft", () => {
      renderPlacement(matrix(), { overrides: { stopPoints: [P_AFTER_A] } });
      enter();
      fireEvent.press(screen.getByLabelText(existingLabel("A")));
      fireEvent.press(screen.getByLabelText(stopLabel("B")));
      fireEvent.press(screen.getByLabelText(existingLabel("A")));
      expect(screen.getByLabelText(existingLabel("A")).props.accessibilityState).toEqual({ selected: true });
      expect(confirm().props.accessibilityLabel).toBe("Confirmer 1 point d’arrêt ajouté");
      fireEvent.press(confirm());
      expect(probe.draft?.stopPoints?.map(({ scope, position }) => ({ scope, position }))).toEqual([
        { scope: "BEFORE_TOUR", position: 1 },
        { scope: "IN_TOUR", position: 1 },
      ]);
      expect(probe.draft?.stopPoints?.[0]).toEqual(P_AFTER_A);
    });

    // [« two additions and one modified recovery » — remplacé le 01/11/2026 (PRE-9, ordre de Hermann,
    // point 2) : plus d'ajout ni de modification de récupération en placement (la seconde « addition »
    // était une récupération) ; la récupération de B (20 s) reste inchangée.]
    it("verification gap (11): Annuler after two removals and one addition restores the very same draft (B's recovery untouched)", () => {
      renderPlacement(matrix({ B: { postActivityRecoverySeconds: 20 } }), {
        overrides: { stopPoints: [P_AFTER_A, { id: "Q", scope: "IN_TOUR", position: 1 }] },
      });
      const before = probe.draft;
      enter();
      fireEvent.press(screen.getByLabelText(existingLabel("A")));
      fireEvent.press(screen.getByLabelText(existingLabel("B")));
      fireEvent.press(screen.getByLabelText(stopLabel("C")));
      expect(screen.queryByTestId("composition-placement-slot-B-recovery", anyNode)).toBeNull();
      expect(confirm().props.accessibilityLabel).toBe("Confirmer les modifications");
      fireEvent.press(screen.getByTestId(`${BAR}-cancel`));
      expect(probe.draft).toBe(before);
      expect(probe.updates).toBe(0);
      expect(within(screen.getByTestId("composition-activity-recovery-B-recovery")).getByText("20″")).toBeTruthy();
    });

    it("review: after Confirmer, if « Ajouter un arrêt » becomes unavailable, focus goes to the first card", async () => {
      const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
      try {
        // Story 7.2 (D-442) : un Exercice offre toujours sa zone de récupération ; seule une ancienne
        // Récupération autonome (type `RECOVERY`) n'offre rien après le retrait de son point.
        renderPlacement([anActivity("A", "BEFORE_TOUR", { name: "A", type: "RECOVERY", postActivityRecoverySeconds: 20 })], {
          overrides: { stopPoints: [{ id: "H", scope: "BEFORE_TOUR", position: 1 }] },
        });
        // Seul un retrait est possible (point avant la Fin, non proposé) : indice dédié.
        expect(screen.getByTestId(ADD_STOP).props.accessibilityHint).toBe(p.addStopRemovalOnlyHint);
        enter();
        fireEvent.press(screen.getByTestId("composition-placement-slot-A-stop-point-existing"));
        focus.mockClear();
        fireEvent.press(confirm());
        expect(probe.draft?.stopPoints).toEqual([]);
        expect(screen.getByTestId(ADD_STOP).props.accessibilityState).toMatchObject({ disabled: true });
        const targets = () => focus.mock.calls.map(([target]) => (target as unknown as { props: { testID?: string } }).props.testID);
        await waitFor(() => expect(targets()).toContain("composition-exercise-row-A"));
        expect(targets()).not.toContain(ADD_STOP);
      } finally {
        focus.mockRestore();
      }
    });

    it("review: an existing point without an id does not make « Ajouter un arrêt » available", () => {
      // Story 7.2 (D-442) : une ancienne Récupération autonome (type `RECOVERY`) n'a pas de zone de
      // récupération ; seul le point sans identifiant pourrait ouvrir le placement.
      renderPlacement([anActivity("A", "BEFORE_TOUR", { name: "A", type: "RECOVERY", postActivityRecoverySeconds: 20 })], {
        overrides: { stopPoints: [{ scope: "BEFORE_TOUR", position: 1 } as unknown as StopPoint] },
      });
      expect(screen.getByTestId(ADD_STOP).props.accessibilityState).toMatchObject({ disabled: true });
    });
  });
  /**
   * PRE-6 story 7.2 (D-442, ch13 CE-T03-08 L1498, complément D-442 points 5 à 8) : tête de Circuit
   * dessinée en placement, choix « Début de tour / Fin de tour / Annuler » (dialogue natif) pour le
   * placement, le pas d'une carte ou d'un point et le passage de N = 1 à N ≥ 2, retraits annoncés.
   */
  describe("tête de Circuit, choix de Tour et points retirés (PRE-6 story 7.2, D-442)", () => {
    const tc = strings.screens.composition.tourBoundaryChoice;
    const removedOne = strings.screens.composition.stopPointsRemovedAnnouncement.singular;
    const HEAD_SLOT = "composition-placement-slot-circuit-head";
    const headTarget = () => screen.getByTestId(`${HEAD_SLOT}-stop-point`);
    const points = () => (probe.draft!.stopPoints ?? []).map(({ id, scope, position }) => `${id}:${scope}:${position}`);
    const cardAction = (id: string, actionName: string) =>
      fireEvent(screen.getByTestId(`composition-exercise-row-${id}`), "accessibilityAction", { nativeEvent: { actionName } });
    const pointAction = (id: string, actionName: string) =>
      fireEvent(screen.getByTestId(`composition-stop-point-${id}-chip`), "accessibilityAction", { nativeEvent: { actionName } });
    const counterAction = (actionName: string) =>
      fireEvent(screen.getByTestId("composition-circuit-header-counter", anyNode), "accessibilityAction", { nativeEvent: { actionName } });

    it("the free circuit-head slot is drawn inside the Circuit, between its header and its first card, centred, on the rail; named « … au début du circuit »; tapping adds (IN_TOUR, 0)", () => {
      (jest.requireMock("expo-crypto") as { randomUUID: jest.Mock }).randomUUID.mockReturnValueOnce("head-1");
      renderPlacement(matrix());
      expect(screen.queryByTestId(HEAD_SLOT, anyNode)).toBeNull();
      enter();
      const row = screen.getByTestId(HEAD_SLOT);
      expect(within(screen.getByTestId("composition-zone-in-tour")).getByTestId(HEAD_SLOT)).toBeTruthy();
      expect(testIdOrder(screen.toJSON(), ["composition-circuit-header", `${HEAD_SLOT}-row`, "composition-activity-B"])).toEqual([
        "composition-circuit-header",
        `${HEAD_SLOT}-row`,
        "composition-activity-B",
      ]);
      expect(StyleSheet.flatten(row.props.style)).toMatchObject({ height: 22, justifyContent: "center" });
      // Raccordé au rail comme les rangées du placement : lien et queue, sans point de raccord.
      expect(screen.getByTestId("composition-rail-link-rail:stop:placement-circuit-head", anyNode)).toBeTruthy();
      expect(screen.getByTestId("composition-rail-tail-rail:stop:placement-circuit-head", anyNode)).toBeTruthy();
      expect(headTarget().props.accessibilityLabel).toBe(p.addStopPointAtCircuitStartAccessibilityLabel);
      expect(headTarget().props.accessibilityState).toMatchObject({ selected: false });
      // Cible réelle bornée aux écarts du Circuit (9), sans hitSlop.
      expect(headTarget().props.hitSlop).toBeUndefined();
      expect(StyleSheet.flatten(headTarget().props.style)).toMatchObject({ height: 22 + 9 + 9, marginTop: -9, marginBottom: -9 });
      fireEvent.press(headTarget());
      expect(headTarget().props.accessibilityState).toMatchObject({ selected: true });
      // N = 1, A avant le Circuit : « après A » deviendrait consécutif, il n'est plus proposé.
      expect(screen.queryByLabelText(stopLabel("A"))).toBeNull();
      fireEvent.press(confirm());
      expect(points()).toEqual(["head-1:IN_TOUR:0"]);
    });

    it("placement, N = 2, existing end-of-Tour point: choosing the head asks which to keep — Annuler: nothing; « Fin de tour »: nothing added; « Début de tour »: head added, the end point's removal scheduled", () => {
      const alert = tourChoiceAlert();
      try {
        renderPlacement(matrix(), { overrides: { tourRepeatCount: 2, stopPoints: [{ id: "T", scope: "IN_TOUR", position: 2 }] } });
        enter();
        const tail = () => screen.getByTestId("composition-placement-slot-C-stop-point-existing");
        fireEvent.press(headTarget());
        expect(alert).toHaveBeenCalledTimes(1);
        expect(alert.mock.calls[0]![0]).toBe(tc.title);
        expect(alert.mock.calls[0]![1]).toBe(tc.message);
        expect((alert.mock.calls[0]![2] as AlertButton[]).map((button) => button.text)).toEqual([tc.head, tc.tail, tc.cancel]);
        expect(headTarget().props.accessibilityState).toMatchObject({ selected: false });
        answerTourChoice(alert, tc.cancel);
        expect(headTarget().props.accessibilityState).toMatchObject({ selected: false });
        expect(tail().props.accessibilityState).toMatchObject({ selected: true });
        expect(confirm().props.accessibilityState).toMatchObject({ disabled: true });

        fireEvent.press(headTarget());
        answerTourChoice(alert, tc.tail);
        expect(headTarget().props.accessibilityState).toMatchObject({ selected: false });
        expect(tail().props.accessibilityState).toMatchObject({ selected: true });

        fireEvent.press(headTarget());
        expect(alert).toHaveBeenCalledTimes(3);
        answerTourChoice(alert, tc.head);
        expect(headTarget().props.accessibilityState).toMatchObject({ selected: true });
        expect(tail().props.accessibilityState).toMatchObject({ selected: false });
        expect(confirm().props.accessibilityLabel).toBe(p.confirmChanges);
        expect(probe.updates).toBe(0);
        fireEvent.press(confirm());
        expect(points()).toHaveLength(1);
        expect(points()[0]).toMatch(/:IN_TOUR:0$/u);
      } finally {
        alert.mockRestore();
      }
    });

    it("placement, N = 2: reselecting an existing head point against an added end point asks which to keep (« Début de tour » keeps the point, drops the addition)", () => {
      const alert = tourChoiceAlert();
      try {
        renderPlacement(matrix(), { overrides: { tourRepeatCount: 2, stopPoints: [{ id: "H", scope: "IN_TOUR", position: 0 }] } });
        enter();
        const head = () => screen.getByTestId("composition-placement-slot-stop-H-stop-point-existing");
        fireEvent.press(head());
        expect(head().props.accessibilityState).toMatchObject({ selected: false });
        fireEvent.press(screen.getByTestId("composition-placement-slot-C-stop-point"));
        expect(alert).not.toHaveBeenCalled();
        expect(screen.getByTestId("composition-placement-slot-C-stop-point").props.accessibilityState).toMatchObject({ selected: true });
        // La resélection n'est pas « bloquée » : elle demande le choix.
        expect(head().props.accessibilityState).toEqual({ selected: false });
        fireEvent.press(head());
        expect(alert).toHaveBeenCalledTimes(1);
        answerTourChoice(alert, tc.head);
        expect(head().props.accessibilityState).toMatchObject({ selected: true });
        expect(screen.getByTestId("composition-placement-slot-C-stop-point").props.accessibilityState).toMatchObject({ selected: false });
        expect(confirm().props.accessibilityState).toMatchObject({ disabled: true });
      } finally {
        alert.mockRestore();
      }
    });

    it("placement, N = 2, reselection against an addition: Annuler and « Fin de tour » keep the addition and leave the point removed (announced)", () => {
      const alert = tourChoiceAlert();
      const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
      try {
        renderPlacement(matrix(), { overrides: { tourRepeatCount: 2, stopPoints: [{ id: "H", scope: "IN_TOUR", position: 0 }] } });
        enter();
        const head = () => screen.getByTestId("composition-placement-slot-stop-H-stop-point-existing");
        const tail = () => screen.getByTestId("composition-placement-slot-C-stop-point");
        fireEvent.press(head());
        fireEvent.press(tail());
        fireEvent.press(head());
        answerTourChoice(alert, tc.cancel);
        expect(head().props.accessibilityState).toMatchObject({ selected: false });
        expect(tail().props.accessibilityState).toMatchObject({ selected: true });
        fireEvent.press(head());
        announce.mockClear();
        answerTourChoice(alert, tc.tail);
        expect(head().props.accessibilityState).toMatchObject({ selected: false });
        expect(tail().props.accessibilityState).toMatchObject({ selected: true });
        expect(announce).toHaveBeenCalledWith(p.stopPointKeepRefusedAnnouncement);
        fireEvent.press(confirm());
        expect(points()).toHaveLength(1);
        expect(points()[0]).toMatch(/:IN_TOUR:2$/u);
      } finally {
        alert.mockRestore();
        announce.mockRestore();
      }
    });

    it("D-442 point 8 — N = 2, Circuit alone (opens and closes the Session): start and end of Tour are both offered; at N = 1 neither is", () => {
      const view = renderPlacement([anActivity("B", "IN_TOUR", { name: "B" }), anActivity("C", "IN_TOUR", { name: "C" })], {
        overrides: { tourRepeatCount: 2 },
      });
      enter();
      expect(headTarget().props.accessibilityLabel).toBe(p.addStopPointAtCircuitStartAccessibilityLabel);
      expect(screen.getByLabelText(stopLabel("C"))).toBeTruthy();
      view.unmount();
      renderPlacement([anActivity("B", "IN_TOUR", { name: "B" }), anActivity("C", "IN_TOUR", { name: "C" })]);
      enter();
      expect(screen.queryByTestId(HEAD_SLOT, anyNode)).toBeNull();
      expect(screen.queryByLabelText(stopLabel("C"))).toBeNull();
    });

    it("« Monter » of a card that would put a start and an end of Tour back to back (N = 2): offered; the choice is asked; « Fin de tour » keeps the end point, the other is removed and announced on the card", async () => {
      const alert = tourChoiceAlert();
      const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
      try {
        renderPlacement(matrix(), {
          overrides: {
            tourRepeatCount: 2,
            stopPoints: [
              { id: "S1", scope: "IN_TOUR", position: 1 },
              { id: "S2", scope: "IN_TOUR", position: 2 },
            ],
          },
        });
        cardAction("B", "moveUp");
        expect(alert).toHaveBeenCalledTimes(1);
        expect(probe.updates).toBe(0);
        answerTourChoice(alert, tc.tail);
        expect(probe.draft!.exercises.find((exercise) => exercise.id === "B")!.structuralPosition).toBe("BEFORE_TOUR");
        expect(points()).toEqual(["S2:IN_TOUR:1"]);
        await waitFor(() => expect(announce).toHaveBeenCalledWith(removedOne));
        // Annuler (nouvelle situation) : rien ne change.
      } finally {
        alert.mockRestore();
        announce.mockRestore();
      }
    });

    it("story 7.5 (D-442 amendée) — deleting a card that would put a start and an end of Tour back to back (N = 2): the choice is asked; Annuler deletes nothing; « Début de tour » deletes the card and removes the end point", () => {
      const restoreTiming = jsDrivenAnimations();
      const alert = tourChoiceAlert();
      try {
        renderPlacement(matrix(), {
          overrides: {
            tourRepeatCount: 2,
            stopPoints: [
              { id: "S1", scope: "IN_TOUR", position: 1 },
              { id: "S2", scope: "IN_TOUR", position: 2 },
            ],
          },
        });
        // [A | B, S1, C, S2 | D] : supprimer B mettrait S1 en début de Tour face à S2 en fin de Tour.
        cardAction("B", "delete");
        expect(alert).toHaveBeenCalledTimes(1);
        expect(probe.updates).toBe(0);
        answerTourChoice(alert, tc.cancel);
        finishDeletionAnimation();
        expect(probe.draft!.exercises.map((exercise) => exercise.id)).toEqual(["A", "B", "C", "D"]);
        expect(points()).toEqual(["S1:IN_TOUR:1", "S2:IN_TOUR:2"]);
        cardAction("B", "delete");
        expect(alert).toHaveBeenCalledTimes(2);
        answerTourChoice(alert, tc.head);
        finishDeletionAnimation();
        expect(probe.draft!.exercises.map((exercise) => exercise.id)).toEqual(["A", "C", "D"]);
        expect(points()).toEqual(["S1:IN_TOUR:0"]);
      } finally {
        alert.mockRestore();
        restoreTiming();
      }
    });

    it("the same card step, Annuler: nothing changes, nothing announced", () => {
      const alert = tourChoiceAlert();
      try {
        renderPlacement(matrix(), {
          overrides: {
            tourRepeatCount: 2,
            stopPoints: [
              { id: "S1", scope: "IN_TOUR", position: 1 },
              { id: "S2", scope: "IN_TOUR", position: 2 },
            ],
          },
        });
        const before = probe.draft;
        cardAction("B", "moveUp");
        answerTourChoice(alert, tc.cancel);
        expect(probe.draft).toBe(before);
        expect(probe.updates).toBe(0);
      } finally {
        alert.mockRestore();
      }
    });

    it("D-442 — a card step that removes a point: no visual message, focus on the card and a discreet « Point d'arrêt retiré »", async () => {
      const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
      const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
      try {
        renderPlacement([anActivity("X", "AFTER_TOUR", { name: "X" }), anActivity("Y", "AFTER_TOUR", { name: "Y" })], {
          overrides: { stopPoints: [{ id: "p1", scope: "AFTER_TOUR", position: 1 }] },
        });
        measureDisplayedRows();
        cardAction("X", "moveDown");
        expect(points()).toEqual([]);
        expect(screen.queryByText(removedOne)).toBeNull();
        await waitFor(() => expect(announce).toHaveBeenCalledWith(removedOne));
        const targets = focus.mock.calls.map(([target]) => (target as unknown as { props: { testID?: string } }).props.testID);
        expect(targets).toContain("composition-exercise-row-X");
        expect(screen.queryByTestId("composition-stop-point-row-p1", anyNode)).toBeNull();
      } finally {
        announce.mockRestore();
        focus.mockRestore();
      }
    });

    it("« Monter » of a point to the circuit head facing an end point (N = 2): offered, the choice is asked; « Début de tour » moves it and removes the end point", () => {
      const alert = tourChoiceAlert();
      try {
        renderPlacement(matrix(), {
          overrides: {
            tourRepeatCount: 2,
            stopPoints: [
              { id: "H", scope: "IN_TOUR", position: 1 },
              { id: "T", scope: "IN_TOUR", position: 2 },
            ],
          },
        });
        const actions = (screen.getByTestId("composition-stop-point-H-chip").props.accessibilityActions as { name: string }[]).map(
          (action) => action.name,
        );
        expect(actions).toContain("moveUp");
        pointAction("H", "moveUp");
        expect(alert).toHaveBeenCalledTimes(1);
        expect(probe.updates).toBe(0);
        answerTourChoice(alert, tc.head);
        expect(points()).toEqual(["H:IN_TOUR:0"]);
      } finally {
        alert.mockRestore();
      }
    });

    it("the same point step, « Fin de tour »: the moved point itself is removed (the end point is kept); Annuler: nothing", () => {
      const alert = tourChoiceAlert();
      try {
        renderPlacement(matrix(), {
          overrides: {
            tourRepeatCount: 2,
            stopPoints: [
              { id: "H", scope: "IN_TOUR", position: 1 },
              { id: "T", scope: "IN_TOUR", position: 2 },
            ],
          },
        });
        const before = probe.draft;
        pointAction("H", "moveUp");
        answerTourChoice(alert, tc.cancel);
        expect(probe.draft).toBe(before);
        pointAction("H", "moveUp");
        answerTourChoice(alert, tc.tail);
        expect(points()).toEqual(["T:IN_TOUR:2"]);
      } finally {
        alert.mockRestore();
      }
    });

    it("counter 1 → 2 with a start and an end of Tour: the choice is asked before any change — Annuler keeps N = 1; « Début de tour » sets N = 2 and removes the end point", async () => {
      const alert = tourChoiceAlert();
      const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
      try {
        renderPlacement(matrix(), {
          overrides: {
            stopPoints: [
              { id: "H", scope: "IN_TOUR", position: 0 },
              { id: "T", scope: "IN_TOUR", position: 2 },
            ],
          },
        });
        counterAction("increment");
        expect(alert).toHaveBeenCalledTimes(1);
        // Un second pas pendant le dialogue (maintien) est ignoré : un seul dialogue.
        counterAction("increment");
        expect(alert).toHaveBeenCalledTimes(1);
        answerTourChoice(alert, tc.cancel);
        expect(probe.draft!.tourRepeatCount ?? 1).toBe(1);
        expect(points()).toEqual(["H:IN_TOUR:0", "T:IN_TOUR:2"]);
        counterAction("increment");
        expect(alert).toHaveBeenCalledTimes(2);
        answerTourChoice(alert, tc.head);
        expect(probe.draft!.tourRepeatCount).toBe(2);
        expect(points()).toEqual(["H:IN_TOUR:0"]);
        await waitFor(() => expect(announce).toHaveBeenCalledWith(removedOne));
      } finally {
        alert.mockRestore();
        announce.mockRestore();
      }
    });

    it("story 7.3 — the same choice is asked from the + button (PRE-9 B.1a: revealed first); a hold across the dialog asks once and resumes nothing", () => {
      const alert = tourChoiceAlert();
      jest.useFakeTimers();
      try {
        renderPlacement(matrix(), {
          overrides: {
            stopPoints: [
              { id: "H", scope: "IN_TOUR", position: 0 },
              { id: "T", scope: "IN_TOUR", position: 2 },
            ],
          },
        });
        openCircuitStepper();
        const plus = () => screen.getByTestId("composition-circuit-header-counter-stepper-increment", { includeHiddenElements: true });
        fireEvent(plus(), "pressIn");
        expect(alert).toHaveBeenCalledTimes(1);
        // Maintien : le dialogue arrête la répétition, aucun second dialogue.
        act(() => {
          jest.advanceTimersByTime(2000);
        });
        expect(alert).toHaveBeenCalledTimes(1);
        answerTourChoice(alert, tc.cancel);
        act(() => {
          jest.advanceTimersByTime(2000);
        });
        fireEvent(plus(), "pressOut");
        expect(alert).toHaveBeenCalledTimes(1);
        expect(probe.draft!.tourRepeatCount ?? 1).toBe(1);
        expect(points()).toEqual(["H:IN_TOUR:0", "T:IN_TOUR:2"]);
      } finally {
        jest.useRealTimers();
        alert.mockRestore();
      }
    });

    it("counter 2 → 1 on a Circuit that opens the Session: its start-of-Tour point is removed without message, announced", async () => {
      const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
      try {
        renderPlacement([anActivity("B", "IN_TOUR", { name: "B" }), anActivity("C", "IN_TOUR", { name: "C" })], {
          overrides: { tourRepeatCount: 2, stopPoints: [{ id: "H", scope: "IN_TOUR", position: 0 }] },
        });
        counterAction("decrement");
        expect(probe.draft!.tourRepeatCount).toBe(1);
        expect(points()).toEqual([]);
        expect(screen.queryByText(removedOne)).toBeNull();
        await waitFor(() => expect(announce).toHaveBeenCalledWith(removedOne));
      } finally {
        announce.mockRestore();
      }
    });
  });
});

/**
 * PRE-6 story 7.2 (D-442, qui retire D-301 ; ch13 CE-T03-08 L1583, complément D-442 point 1) : la
 * Composition n'affiche plus aucun message lorsque deux Exercices s'enchaînent sans pause, et
 * aucun autre avertissement ne le remplace — ni texte, ni annonce, hors placement comme en placement.
 */
describe("CompositionScreen — plus d'avertissement d'enchaînement sans pause (PRE-6 story 7.2, D-442 retire D-301)", () => {
  const D301_TEXT = "Attention, les exercices vont s’enchaîner sans pause.";
  const ADD_STOP = "composition-add-stop-action";

  it("A puis B sans pause ni récupération : aucun message, aucune annonce, « Continuer » inchangé", () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
    try {
      renderScreenWithDraft([anActivity("A", "BEFORE_TOUR", { name: "A" }), anActivity("B", "BEFORE_TOUR", { name: "B" })]);
      expect(screen.queryByText(D301_TEXT)).toBeNull();
      expect(screen.queryByTestId("composition-unpaused-warning")).toBeNull();
      expect(announce).not.toHaveBeenCalledWith(D301_TEXT);
      expect(screen.getByLabelText(composition.saveAction).props.accessibilityState).toMatchObject({ disabled: false });
      // En placement non plus.
      fireEvent.press(screen.getByTestId(ADD_STOP));
      expect(screen.queryByText(D301_TEXT)).toBeNull();
      expect(announce).not.toHaveBeenCalledWith(D301_TEXT);
    } finally {
      announce.mockRestore();
    }
  });

  it("Circuit de Tours N = 2 d'un seul exercice sans pause : aucun message", () => {
    renderScreenWithDraft([anActivity("B", "IN_TOUR", { name: "B" }), anActivity("C", "IN_TOUR", { name: "C" })], {
      tourRepeatCount: 2,
    });
    expect(screen.queryByText(D301_TEXT)).toBeNull();
  });
});

/**
 * PRE-6 (story 2.3b, amendement Hermann du 21/10/2026) : réorganisation animée pendant le
 * glisser. Géométrie injectée (repère du contenu défilant) : A 70–140 et B 150–220 avant le
 * Circuit ; Circuit 230–400 (liste à 60 dans le conteneur : X 290–360) ; Z 420–490 après le
 * Circuit. Pas d'un bloc : 70 + écart 6 = 76. Les animations (pilote natif) sont menées à leur
 * terme par les minuteries simulées.
 */
describe("CompositionScreen — réorganisation animée pendant le glisser (PRE-6 story 2.3b)", () => {
  type Draft = SessionDraftContextValue["draft"];
  // PRE-6 story 5.2 (D-435) : écart 8 entre les cartes hors Circuit, 9 entre l'en-tête du Circuit et ses cartes.
  const PITCH = 70 + spacing[8];
  const CIRCUIT_GAP = 9;
  /** Pas d'une carte dans le Circuit (écart 9) et différence avec le pas du dehors (8). */
  const CIRCUIT_PITCH = 70 + CIRCUIT_GAP;
  const CIRCUIT_EXTRA = CIRCUIT_PITCH - PITCH;
  const probe: { draft: Draft | null; updateDraft: SessionDraftContextValue["updateDraft"] | null } = {
    draft: null,
    updateDraft: null,
  };
  function DraftProbe() {
    const value = useContext(SessionDraftContext);
    useEffect(() => {
      probe.draft = value?.draft ?? null;
      probe.updateDraft = value?.updateDraft ?? null;
    }, [value]);
    return null;
  }

  function renderLaidOut(
    overrides?: Partial<Draft>,
    { withX = true, withZ = true, a = {} }: { withX?: boolean; withZ?: boolean; a?: Partial<SessionDraftExercise> } = {},
  ) {
    const element = (
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService()}>
          <ReferentialServiceContext.Provider value={fakeReferentialService()}>
            <StatefulDraftWrapper
              initialExercises={[
                anActivity("A", "BEFORE_TOUR", { name: "Gainage", ...a }),
                anActivity("B", "BEFORE_TOUR", { name: "Squats" }),
                ...(withX ? [anActivity("X", "IN_TOUR", { name: "Pompes" })] : []),
                ...(withZ ? [anActivity("Z", "AFTER_TOUR", { name: "Fentes" })] : []),
              ]}
              draftOverrides={overrides}
            >
              <CompositionScreen />
              <DraftProbe />
            </StatefulDraftWrapper>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>
    );
    render(element);
    fireLayout(screen.getByTestId("composition-zone-before-tour"), 70, 150);
    fireLayout(screen.getByTestId("composition-activity-A"), 0, 70);
    fireLayout(screen.getByTestId("composition-activity-B"), 80, 70);
    // PRE-9 B.2 — D-451, COMP §1 : sans `X`, aucun Circuit n'est rendu.
    const tour = screen.queryByTestId("composition-tour-section");
    if (tour !== null) fireLayout(tour, 230, 170);
    if (withX) {
      fireLayout(screen.getByTestId("composition-zone-in-tour"), 60, 70);
      fireLayout(screen.getByTestId("composition-activity-X"), 0, 70);
    }
    if (withZ) {
      fireLayout(screen.getByTestId("composition-zone-after-tour"), 420, 70);
      fireLayout(screen.getByTestId("composition-activity-Z"), 0, 70);
    }
  }

  const container = (id: string) => screen.getByTestId(`composition-activity-${id}`);
  /**
   * PRE-6 story 6.2 : point « après le Circuit » `pc` = première rangée (22) de la zone après le
   * Circuit ; Z garde son centre à 475 (zone à 410, rangée 0–22, Z à 30).
   */
  function layOutAfterCircuitPoint() {
    fireLayout(screen.getByTestId("composition-zone-after-tour"), 410, 100);
    fireLayout(screen.getByTestId("composition-stop-point-row-pc"), 0, 22);
    fireLayout(container("Z"), 30, 70);
  }
  function lift(id: string) {
    fireEvent(container(id), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
    fireEvent(screen.getByTestId(`composition-exercise-row-${id}`), "longPress");
  }
  function moveTo(id: string, deltaY: number) {
    fireEvent(container(id), "responderMove", { nativeEvent: { pageX: 200, pageY: 100 + deltaY } });
  }
  function release(id: string, deltaY: number) {
    fireEvent(container(id), "touchEnd", { nativeEvent: { pageX: 200, pageY: 100 + deltaY } });
  }
  const settle = () =>
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  const transformOf = (testID: string) =>
    (StyleSheet.flatten(screen.getByTestId(testID, { includeHiddenElements: true }).props.style).transform ?? []) as Record<string, number>[];
  const translateY = (testID: string) =>
    transformOf(testID).reduce((sum, entry) => sum + (entry.translateY ?? 0), 0);
  const scaleY = (testID: string) => transformOf(testID).find((entry) => entry.scaleY !== undefined)?.scaleY ?? 1;
  const rowShift = (id: string) => translateY(`composition-activity-${id}`);
  const order = () => probe.draft!.exercises.map((exercise) => `${exercise.id}:${exercise.structuralPosition}`);
  const INITIAL_ORDER = ["A:BEFORE_TOUR", "B:BEFORE_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR"];
  /** Bande centrale du fond du Circuit : hauteur relevée (170) moins les deux rayons (18, story 5.2). */
  const CIRCUIT_RADIUS = 18;
  const BAND = 170 - 2 * CIRCUIT_RADIUS;

  /**
   * Sous Jest, une animation sur le pilote natif ne remonte jamais ses valeurs dans les props
   * observées : les transitions sont rejouées sur le pilote JS (mêmes durée et courbe), et le
   * choix du pilote natif est vérifié sur les configurations demandées.
   */
  const realTiming = Animated.timing;
  let timingConfigs: Animated.TimingAnimationConfig[] = [];
  beforeEach(() => {
    jest.useFakeTimers();
    timingConfigs = [];
    jest.spyOn(Animated, "timing").mockImplementation((value, config) => {
      timingConfigs.push(config);
      return realTiming(value, { ...config, useNativeDriver: false });
    });
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("vers le bas : B remonte d'un pas dès que A dépasse son milieu, redescend au retour ; aucune mutation pendant le geste", () => {
    renderLaidOut();
    lift("A");
    moveTo("A", 40);
    settle();
    expect(rowShift("B")).toBe(0);

    // Centre de A = 105 ; +100 → 205, au-delà du milieu de B (185).
    moveTo("A", 100);
    settle();
    expect(rowShift("B")).toBe(-PITCH);
    expect(rowShift("X")).toBe(0);
    expect(translateY("composition-circuit-header")).toBe(0);
    expect(order()).toEqual(INITIAL_ORDER);

    moveTo("A", 40);
    settle();
    expect(rowShift("B")).toBe(0);
    expect(order()).toEqual(INITIAL_ORDER);
  });

  it("le décalage est progressif (animation), pas immédiat", () => {
    renderLaidOut();
    lift("A");
    moveTo("A", 100);
    act(() => {
      jest.advanceTimersByTime(16 * 3);
    });
    const midway = rowShift("B");
    expect(midway).toBeLessThan(0);
    expect(midway).toBeGreaterThan(-PITCH);
    settle();
    expect(rowShift("B")).toBe(-PITCH);
    // Pilote natif ; story 7.6 : durée et courbe du jeu de mouvements partagé (320 ms, décélération).
    expect(timingConfigs.length).toBeGreaterThan(0);
    for (const config of timingConfigs) {
      expect(config.useNativeDriver).toBe(true);
      expect(config.duration).toBe(MOTION_SHIFT_DURATION_MS);
      expect(config.easing).toBe(MOTION_EASING);
    }
  });

  it("vers le haut : B au-dessus de A → A descend d'un pas", () => {
    renderLaidOut();
    lift("B");
    // Centre de B = 185 ; -100 → 85, au-dessus du milieu de A (105).
    moveTo("B", -100);
    settle();
    expect(rowShift("A")).toBe(PITCH);
  });

  it("entrée dans le Circuit : il s'agrandit d'un pas (bord haut, en-tête et anneau remontent avec B), la suite reste en place", () => {
    renderLaidOut();
    lift("A");
    // 105 + 200 = 305 : dans le Circuit (230–400), au-dessus du milieu de X (325).
    moveTo("A", 200);
    settle();
    // Story 5.2 (D-435) : A sort avec l'écart du dehors (8) et entre avec celui du Circuit (9) —
    // la suite descend du net (1).
    expect(rowShift("B")).toBe(-PITCH);
    expect(rowShift("X")).toBe(CIRCUIT_EXTRA);
    expect(rowShift("Z")).toBe(CIRCUIT_EXTRA);
    expect(translateY("composition-circuit-header")).toBe(-PITCH);
    expect(translateY("composition-sequence-marker-circuit-track")).toBe(-PITCH);
    expect(translateY("composition-tour-section-surface-top")).toBe(-PITCH);
    expect(translateY("composition-tour-section-surface-bottom")).toBe(CIRCUIT_EXTRA);
    // Bande centrale : étirée de l'écart entre les deux bords, centrée entre eux.
    expect(translateY("composition-tour-section-surface-band")).toBe((-PITCH + CIRCUIT_EXTRA) / 2);
    expect(scaleY("composition-tour-section-surface-band")).toBeCloseTo(1 + CIRCUIT_PITCH / BAND, 6);
    expect(order()).toEqual(INITIAL_ORDER);
  });

  it("entrée dans le Circuit par le bas : le bas du Circuit et la ligne après le Circuit descendent d'un pas", () => {
    renderLaidOut({ stopPoints: [{ id: "pc", scope: "AFTER_TOUR", position: 0 }] });
    layOutAfterCircuitPoint();
    lift("Z");
    // Centre de Z = 475 ; -100 → 375 : dans le Circuit, sous le milieu de X.
    moveTo("Z", -100);
    settle();
    // Story 5.2 : pas d'insertion dans le Circuit = carte + écart 9.
    expect(translateY("composition-tour-section-surface-top")).toBe(0);
    expect(translateY("composition-tour-section-surface-bottom")).toBe(CIRCUIT_PITCH);
    // Story 6.2 : le point après le Circuit (rangée de la zone après) suit le bas du Circuit.
    expect(translateY("composition-stop-point-row-pc")).toBe(CIRCUIT_PITCH);
    expect(translateY("composition-circuit-header")).toBe(0);
    expect(scaleY("composition-tour-section-surface-band")).toBeCloseTo(1 + CIRCUIT_PITCH / BAND, 6);
    expect(order()).toEqual(INITIAL_ORDER);
  });

  it("sortie du Circuit : il se rétracte, ce qui le suit remonte", () => {
    renderLaidOut();
    lift("X");
    // Centre de X = 325 ; +200 → 525 : après le Circuit, sous le milieu de Z (455).
    moveTo("X", 200);
    settle();
    expect(translateY("composition-tour-section-surface-top")).toBe(0);
    // Circuit vidé : la carte et l'écart en-tête / liste (12) disparaissent.
    expect(translateY("composition-tour-section-surface-bottom")).toBe(-(70 + CIRCUIT_GAP));
    expect(scaleY("composition-tour-section-surface-band")).toBeCloseTo(1 - (70 + CIRCUIT_GAP) / BAND, 6);
    // X va sous Z : Z remonte de toute la hauteur libérée dans le Circuit.
    expect(rowShift("Z")).toBe(-(70 + CIRCUIT_GAP));
  });

  it("dépôt appliqué : nouvelle disposition, décalages remis à 0 sans animation", () => {
    renderLaidOut();
    lift("A");
    moveTo("A", 200);
    settle();
    release("A", 200);

    expect(order()).toEqual(["B:BEFORE_TOUR", "A:IN_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR"]);
    // Sans avancer le temps : aucune transition vers la nouvelle disposition.
    expect(rowShift("B")).toBe(0);
    expect(translateY("composition-circuit-header")).toBe(0);
    expect(translateY("composition-tour-section-surface-top")).toBe(0);
    expect(scaleY("composition-tour-section-surface-band")).toBe(1);
  });

  it("geste interrompu : les cartes reviennent en douceur, brouillon inchangé", () => {
    renderLaidOut();
    lift("A");
    moveTo("A", 100);
    settle();
    fireEvent(container("A"), "responderTerminate", {});
    act(() => {
      jest.advanceTimersByTime(16 * 3);
    });
    expect(rowShift("B")).toBeLessThan(0);
    expect(rowShift("B")).toBeGreaterThan(-PITCH);
    settle();
    expect(rowShift("B")).toBe(0);
    expect(order()).toEqual(INITIAL_ORDER);
  });

  it("D-442 — dépôt qui rendrait un point interdit : appliqué, le point retiré, cartes à leur place", () => {
    renderLaidOut({ stopPoints: [{ id: "s-1", scope: "BEFORE_TOUR", position: 1 }] }, { withX: false, withZ: false });
    // Story 6.2 : la rangée du point (entre A et B) est mesurée — sans quoi le soulèvement est refusé.
    fireLayout(screen.getByTestId("composition-stop-point-row-s-1"), 75, 0);
    lift("A");
    moveTo("A", 100);
    settle();
    expect(rowShift("B")).toBe(-PITCH);
    // [A, s-1, B] → [s-1, B, A] : s-1 suivrait le Compte à rebours, il est retiré (story 7.1).
    release("A", 100);
    settle();
    expect(rowShift("B")).toBe(0);
    expect(order()).toEqual(["B:BEFORE_TOUR", "A:BEFORE_TOUR"]);
    expect(probe.draft!.stopPoints).toEqual([]);
  });

  /** Séries, N = 2 : A (3 séries) entrant dans le Circuit perd une série → dialogue de perte. */
  function dragAIntoSeriesCircuit() {
    renderLaidOut({ circuitNature: "SERIES", tourRepeatCount: 2 }, { a: { executionParameters: durationParameters(30, 3) } });
    lift("A");
    moveTo("A", 200);
    settle();
    expect(translateY("composition-tour-section-surface-top")).toBe(-PITCH);
    release("A", 200);
    expect(screen.getByTestId("circuit-entry-confirm-card")).toBeTruthy();
  }

  it("confirmation de perte : l'aperçu reste affiché pendant le dialogue ; Annuler le ramène en douceur, brouillon inchangé", () => {
    dragAIntoSeriesCircuit();
    settle();
    expect(rowShift("B")).toBe(-PITCH);
    expect(translateY("composition-tour-section-surface-top")).toBe(-PITCH);
    expect(order()).toEqual(INITIAL_ORDER);

    fireEvent.press(screen.getByLabelText(composition.circuitEntryConfirmModal.cancel));
    act(() => {
      jest.advanceTimersByTime(16 * 3);
    });
    expect(rowShift("B")).toBeLessThan(0);
    expect(rowShift("B")).toBeGreaterThan(-PITCH);
    settle();
    expect(rowShift("B")).toBe(0);
    expect(translateY("composition-tour-section-surface-top")).toBe(0);
    expect(order()).toEqual(INITIAL_ORDER);
  });

  it("confirmation de perte : Confirmer applique la nouvelle disposition, les voisines sont à leur place ; story 7.6 : la carte tenue glisse jusqu'à la sienne", () => {
    dragAIntoSeriesCircuit();
    fireEvent.press(screen.getByLabelText(composition.circuitEntryConfirmModal.confirm));

    expect(order()).toEqual(["B:BEFORE_TOUR", "A:IN_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR"]);
    expect(rowShift("B")).toBe(0);
    expect(translateY("composition-circuit-header")).toBe(0);
    expect(translateY("composition-tour-section-surface-top")).toBe(0);
    // Tenue à 70 + 200 pendant le dialogue ; sa place : 290 + 1 − 9 − 70 = 212.
    expect(rowShift("A")).toBe(70 + 200 - 212);
    settle();
    expect(rowShift("A")).toBe(0);
  });

  it("géométrie figée : une mesure onLayout pendant le geste ne change ni l'aperçu ni le dépôt", () => {
    renderLaidOut();
    lift("A");
    // B « re-mesurée » bien plus bas pendant le geste : sur la géométrie courante, A resterait en tête.
    fireLayout(screen.getByTestId("composition-activity-B"), 300, 70);
    moveTo("A", 100);
    settle();
    expect(rowShift("B")).toBe(-PITCH);
    release("A", 100);
    expect(order()).toEqual(["B:BEFORE_TOUR", "A:BEFORE_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR"]);
  });

  it("la carte soulevée suit le doigt (dy) après un changement d'emplacement ; son bloc n'est pas décalé", () => {
    renderLaidOut();
    lift("A");
    moveTo("A", 100);
    settle();
    expect(rowShift("B")).toBe(-PITCH);
    expect(rowShift("A")).toBe(0);
    expect(translateY("composition-exercise-row-A")).toBe(100);
    moveTo("A", 130);
    expect(translateY("composition-exercise-row-A")).toBe(130);
    // Story 5.2 (D-435) : plus de repère par occurrence ; la carte glissée sort du rail.
    expect(screen.queryByTestId("composition-rail-link-A", { includeHiddenElements: true })).toBeNull();
    expect(rowShift("A")).toBe(0);
  });

  it("second glisser après un dépôt appliqué : les décalages sont de nouveau animés", () => {
    renderLaidOut();
    lift("A");
    moveTo("A", 100);
    settle();
    release("A", 100);
    expect(order()).toEqual(["B:BEFORE_TOUR", "A:BEFORE_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR"]);
    expect(rowShift("B")).toBe(0);

    // Nouvelle disposition mesurée : B 70–140, A 150–220.
    fireLayout(screen.getByTestId("composition-activity-B"), 0, 70);
    fireLayout(screen.getByTestId("composition-activity-A"), 80, 70);
    lift("B");
    moveTo("B", 100);
    act(() => {
      jest.advanceTimersByTime(16 * 3);
    });
    expect(rowShift("A")).toBeLessThan(0);
    expect(rowShift("A")).toBeGreaterThan(-PITCH);
    settle();
    expect(rowShift("A")).toBe(-PITCH);
  });

  // PRE-9 B.2 — D-451, COMP §1 (« une Séance commence sans Circuit », « un conteneur n'est jamais
  // vide ») : remplace « Fin de séance : décalée du net des pas — hors Circuit vers un Circuit vide ».
  // Sans Exercice dans le Circuit, aucun Circuit n'est rendu ni proposé comme destination : un dépôt
  // à son ancienne place reste au niveau de la Séance (un Circuit naît par « Ajouter un circuit »).
  it("sans Circuit : aucune dépose dans un Circuit vide — B reste au niveau de la Séance, entre A et Z", () => {
    renderLaidOut(undefined, { withX: false });
    expect(screen.queryByTestId("composition-tour-section", { includeHiddenElements: true })).toBeNull();
    // Z suit directement la zone avant (230–300).
    fireLayout(screen.getByTestId("composition-zone-after-tour"), 230, 70);
    lift("B");
    // Centre de B = 185 ; +70 → 255, là où se trouvait le Circuit vide.
    moveTo("B", 70);
    settle();
    release("B", 70);
    settle();
    expect(order().some((entry) => entry.endsWith(":IN_TOUR"))).toBe(false);
    expect(testIdOrder(screen.toJSON(), ["composition-exercise-row-A", "composition-exercise-row-B", "composition-exercise-row-Z"])).toEqual([
      "composition-exercise-row-A",
      "composition-exercise-row-B",
      "composition-exercise-row-Z",
    ]);
  });

  // PRE-6 story 5.1 (D-435) : la carte v2 garde 80 avec ou sans durée estimée (ligne 2) ; le calcul
  // de la hauteur prédite est inchangé et donne désormais un écart nul.
  it("hauteur prédite : une carte qui gagne la durée estimée dans le Circuit de Séries garde 80, l'emplacement ne change pas", () => {
    // Répétitions avec cadence, séries [10, échec] : hors Circuit, durée non estimable ; en Circuit
    // de Séries N = 1, seule la série 10 est jouée → durée estimée, sur la ligne 2 (carte 80).
    renderLaidOut(
      { circuitNature: "SERIES", tourRepeatCount: 1 },
      {
        a: {
          executionParameters: variableParameters({
            mode: "REPETITIONS",
            cadenceBeepIntervalSeconds: 2,
            rows: [
              [10, 0],
              ["FAILURE", 0],
            ],
          }),
        },
      },
    );
    lift("A");
    moveTo("A", 200);
    settle();
    // Carte de 80 dans les deux zones : seul l'écart change (9 dans le Circuit, 8 au dehors).
    const growth = CIRCUIT_EXTRA;
    expect(translateY("composition-tour-section-surface-top")).toBe(-PITCH);
    expect(rowShift("X")).toBe(growth);
    expect(translateY("composition-tour-section-surface-bottom")).toBe(growth);
    expect(rowShift("Z")).toBe(growth);
    expect(translateY("composition-boundary-final-phase-track")).toBe(growth);
  });

  // Revue 5.1 : le calcul de la story 2.3b reste protégé avec un écart de carte non nul (hauteur injectée).
  it("hauteur prédite (forme pure) : mesure corrigée de l'écart de carte entre l'occurrence actuelle et l'occurrence déplacée", () => {
    const draft = {
      ...createEmptyDraft(),
      exercises: [anActivity("a", "BEFORE_TOUR"), anActivity("x", "IN_TOUR")],
    };
    // Carte injectée : 64 hors Circuit, 70 dans le Circuit (géométrie de la story 2.2).
    const cardHeightOf = (exercise: SessionDraftExercise) => (exercise.structuralPosition === "IN_TOUR" ? 70 : 64);
    expect(predictedInsertionHeight(draft, "a", 100, { zone: "IN_TOUR", index: 0 }, cardHeightOf)).toBe(106);
    expect(predictedInsertionHeight(draft, "x", 106, { zone: "BEFORE_TOUR", index: 0 }, cardHeightOf)).toBe(100);
    // Même zone : aucun écart.
    expect(predictedInsertionHeight(draft, "a", 100, { zone: "AFTER_TOUR", index: 0 }, cardHeightOf)).toBe(100);
    // Bloc non mesuré ou occurrence inconnue : hauteur mesurée laissée à l'appelant.
    expect(predictedInsertionHeight(draft, "a", undefined, { zone: "IN_TOUR", index: 0 }, cardHeightOf)).toBeUndefined();
    expect(predictedInsertionHeight(draft, "z", 100, { zone: "IN_TOUR", index: 0 }, cardHeightOf)).toBeUndefined();
  });

  it("aperçu périmé : l'occurrence glissée quitte le brouillon pendant le geste → décalages remis à 0, geste annulé", () => {
    renderLaidOut();
    lift("A");
    moveTo("A", 100);
    settle();
    expect(rowShift("B")).toBe(-PITCH);
    act(() => {
      probe.updateDraft!((current) => ({
        ...current,
        exercises: current.exercises.filter((exercise) => exercise.id !== "A"),
      }));
    });
    settle();
    expect(rowShift("B")).toBe(0);
    expect(screen.getByTestId("composition-body").props.scrollEnabled).toBe(true);
    expect(order()).toEqual(["B:BEFORE_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR"]);
  });

  it("« Réduire les animations » : décalages immédiats", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    renderLaidOut();
    await act(async () => {
      await Promise.resolve();
    });
    lift("A");
    moveTo("A", 200);
    expect(rowShift("B")).toBe(-PITCH);
    expect(translateY("composition-tour-section-surface-top")).toBe(-PITCH);
    fireEvent(container("A"), "responderTerminate", {});
    expect(rowShift("B")).toBe(0);
    expect(translateY("composition-tour-section-surface-top")).toBe(0);
  });

  /**
   * PRE-6 story 7.6 (recette J6b : « on a l'impression qu'elle saute dans sa position cible »).
   * Cause : au dépôt appliqué, la translation de la carte déposée (suivi du doigt) et toutes les
   * translations de l'aperçu étaient remises à 0 dans le rendu même de la nouvelle disposition : la
   * carte passait sans transition de l'endroit du lâcher à sa place.
   */
  it("story 7.6 — dépôt appliqué : la carte part de l'endroit du lâcher et glisse jusqu'à sa place (décélération, 320 ms)", () => {
    renderLaidOut();
    lift("A");
    // Centre de A : 105 + 200 = 305 → première place du Circuit ; haut de A sous le doigt : 70 + 200.
    moveTo("A", 200);
    settle();
    release("A", 200);
    expect(order()).toEqual(["B:BEFORE_TOUR", "A:IN_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR"]);
    // Place finale de A : juste au-dessus de X (290, décalé de +1), écart 9 → 290 + 1 − 9 − 70 = 212.
    const atRelease = 70 + 200 - 212;
    expect(rowShift("A")).toBe(atRelease);
    // Les autres sont déjà à leur place : rien ne bouge.
    expect(rowShift("B")).toBe(0);
    expect(rowShift("X")).toBe(0);
    expect(translateY("composition-tour-section-surface-top")).toBe(0);
    act(() => {
      jest.advanceTimersByTime(80);
    });
    const early = rowShift("A");
    act(() => {
      jest.advanceTimersByTime(80);
    });
    const later = rowShift("A");
    // Décélération : la première moitié du temps couvre bien plus que la moitié du chemin.
    expect(early).toBeGreaterThan(0);
    expect(atRelease - early).toBeGreaterThan(early - later);
    expect(later).toBeGreaterThan(0);
    settle();
    expect(rowShift("A")).toBe(0);
  });

  it("story 7.6 — dépôt pendant le décalage des voisines : elles achèvent leur chemin au lieu de sauter à leur place", () => {
    renderLaidOut();
    lift("A");
    moveTo("A", 100);
    // B remonte d'un pas (320 ms) ; dépôt au quart du mouvement.
    act(() => {
      jest.advanceTimersByTime(80);
    });
    release("A", 100);
    expect(order()).toEqual(["B:BEFORE_TOUR", "A:BEFORE_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR"]);
    // Dans la nouvelle disposition, B reste où elle était (au-dessous de sa place) puis la rejoint.
    const remaining = rowShift("B");
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThan(PITCH);
    act(() => {
      jest.advanceTimersByTime(80);
    });
    expect(rowShift("B")).toBeLessThan(remaining);
    settle();
    expect(rowShift("B")).toBe(0);
  });

  it("story 7.6 — « Réduire les animations » : la carte déposée est posée à sa place sans mouvement", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    renderLaidOut();
    await act(async () => {
      await Promise.resolve();
    });
    lift("A");
    moveTo("A", 200);
    release("A", 200);
    expect(rowShift("A")).toBe(0);
  });

  const deleteCard = (id: string) =>
    fireEvent(screen.getByTestId(`composition-exercise-row-${id}`), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
  const advance = (ms: number) =>
    act(() => {
      jest.advanceTimersByTime(ms);
    });

  it("story 7.5 (revue) — suppression d'une carte du Circuit : pendant le glissement, la bande du fond se rétracte sans s'écraser", () => {
    renderLaidOut();
    deleteCard("X");
    // Glissement lancé pendant le fondu (200 ms ; rendu à la sortie de `act`), puis en cours.
    advance(220);
    advance(60);
    const bottom = translateY("composition-tour-section-surface-bottom");
    expect(bottom).toBeLessThan(0);
    expect(bottom).toBeGreaterThan(-(70 + CIRCUIT_GAP));
    // Hauteur relevée au début de la suppression (170), pas celle d'un glisser jamais fait (0).
    expect(scaleY("composition-tour-section-surface-band")).toBeCloseTo(1 + bottom / BAND, 6);
    advance(400);
    advance(400);
    expect(order()).toEqual(["A:BEFORE_TOUR", "B:BEFORE_TOUR", "Z:AFTER_TOUR"]);
    // PRE-9 B.2 — D-451, COMP §1 : son dernier membre supprimé, le Circuit disparaît (au lieu d'un
    // Circuit vide revenu à sa place).
    expect(screen.queryByTestId("composition-tour-section-surface-bottom", { includeHiddenElements: true })).toBeNull();
    expect(screen.queryByTestId("composition-tour-section", { includeHiddenElements: true })).toBeNull();
  });

  it("story 7.5 (revue) — pendant une suppression animée : seconde suppression, soulèvement, Dupliquer ignorés ; la carte qui s'efface est masquée à VoiceOver", () => {
    renderLaidOut();
    deleteCard("A");
    advance(20);
    expect(screen.getByTestId("composition-activity-A", { includeHiddenElements: true }).props.accessibilityElementsHidden).toBe(true);
    deleteCard("B");
    fireEvent(screen.getByTestId("composition-exercise-row-B"), "accessibilityAction", { nativeEvent: { actionName: "duplicate" } });
    lift("B");
    moveTo("B", 100);
    expect(screen.getByTestId("composition-body").props.scrollEnabled).toBe(true);
    advance(400);
    advance(400);
    advance(400);
    expect(order()).toEqual(["B:BEFORE_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR"]);
  });

  /** PRE-6 story 7.7 (D-443, j6c-4) : la copie de Dupliquer apparaît en fondu lent, la suite glisse. */
  it("story 7.7 — Dupliquer : brouillon écrit aussitôt ; la copie apparaît en fondu lent, les éléments suivants glissent pour lui faire place", () => {
    renderLaidOut();
    fireEvent(screen.getByTestId("composition-exercise-row-A"), "accessibilityAction", { nativeEvent: { actionName: "duplicate" } });
    expect(order()).toEqual(["A:BEFORE_TOUR", "generated-copy-id:BEFORE_TOUR", "B:BEFORE_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR"]);
    const copy = () => StyleSheet.flatten(screen.getByTestId("composition-activity-generated-copy-id").props.style).opacity as number;
    expect(copy()).toBe(0);
    // B, le Circuit et la suite sont posés là où ils étaient (un pas plus haut), puis glissent.
    expect(rowShift("B")).toBe(-PITCH);
    expect(translateY("composition-tour-section-surface-top")).toBe(-PITCH);
    expect(rowShift("Z")).toBe(-PITCH);
    act(() => {
      jest.advanceTimersByTime(160);
    });
    expect(copy()).toBeGreaterThan(0);
    expect(copy()).toBeLessThan(1);
    expect(rowShift("B")).toBeGreaterThan(-PITCH);
    expect(rowShift("B")).toBeLessThan(0);
    // La copie reste accessible et touchable pendant son apparition.
    expect(screen.getByTestId("composition-activity-generated-copy-id").props.accessibilityElementsHidden).toBe(false);
    settle();
    settle();
    expect(rowShift("B")).toBe(0);
    // Fin de l'apparition : la copie est une carte ordinaire (aucune opacité posée).
    expect(StyleSheet.flatten(screen.getByTestId("composition-activity-generated-copy-id").props.style).opacity).toBeUndefined();
  });

  it("story 7.7 (revue) — seconde copie pendant l'apparition de la première : la première est affichée pleinement", () => {
    renderLaidOut();
    const duplicate = (id: string) =>
      fireEvent(screen.getByTestId(`composition-exercise-row-${id}`), "accessibilityAction", { nativeEvent: { actionName: "duplicate" } });
    const crypto = jest.requireMock("expo-crypto") as { randomUUID: jest.Mock };
    crypto.randomUUID.mockReturnValueOnce("copy-1").mockReturnValueOnce("copy-2");
    duplicate("A");
    act(() => {
      jest.advanceTimersByTime(60);
    });
    const opacityOf = (id: string) => StyleSheet.flatten(screen.getByTestId(`composition-activity-${id}`).props.style).opacity as number | undefined;
    expect(opacityOf("copy-1")).toBeLessThan(1);
    duplicate("B");
    expect(opacityOf("copy-1")).toBeUndefined();
    // La première copie n'est pas encore mesurée : disposition incomplète, la seconde est affichée
    // aussitôt (choix 7.7).
    expect(opacityOf("copy-2")).toBeUndefined();
    settle();
    settle();
  });

  it("story 7.7 (revue) — Dupliquer est ignoré pendant le glisser d'un élément", () => {
    renderLaidOut();
    lift("A");
    moveTo("A", 40);
    const before = order();
    fireEvent(screen.getByTestId("composition-exercise-row-B"), "accessibilityAction", { nativeEvent: { actionName: "duplicate" } });
    expect(order()).toEqual(before);
    release("A", 40);
  });

  it("story 7.7 — « Réduire les animations » : la copie de Dupliquer est affichée aussitôt, sans glissement", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    renderLaidOut();
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent(screen.getByTestId("composition-exercise-row-A"), "accessibilityAction", { nativeEvent: { actionName: "duplicate" } });
    expect(rowShift("B")).toBe(0);
    expect(StyleSheet.flatten(screen.getByTestId("composition-activity-generated-copy-id").props.style).opacity).toBeUndefined();
  });

  it("story 7.5 — « Réduire les animations » : suppression écrite aussitôt, sans fondu ni glissement", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    renderLaidOut();
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent(screen.getByTestId("composition-exercise-row-A"), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    expect(order()).toEqual(["B:BEFORE_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR"]);
  });

  /**
   * PRE-6 story 7.4 (D-442, recette iPhone du 22/10, commentaires 3, 13 et 14).
   */
  describe("story 7.4 — défilement pendant le glisser, cohérence avec le pilote natif", () => {
    type InternalValue = {
      _updateValue: (value: number, flush: boolean) => void;
      __onAnimatedValueUpdateReceived: (value: number) => void;
      __getValue: () => number;
      stopAnimation: () => void;
    };
    /**
     * Pilote natif : `setValue` d'une valeur native ne rerend pas les vues (`AnimatedValue.setValue`,
     * `flush` seulement hors pilote natif) — l'arbre garde la valeur JS lue au dernier rendu.
     */
    function nativeSetValue() {
      jest.spyOn(Animated.Value.prototype, "setValue").mockImplementation(function (this: Animated.Value, value: number) {
        const internal = this as unknown as InternalValue;
        internal.stopAnimation();
        internal._updateValue(value, false);
      });
    }
    const circuitFrame = () => ({
      top: translateY("composition-tour-section-surface-top"),
      bottom: translateY("composition-tour-section-surface-bottom"),
      band: translateY("composition-tour-section-surface-band"),
      scale: scaleY("composition-tour-section-surface-band"),
      header: translateY("composition-circuit-header"),
      ring: translateY("composition-sequence-marker-circuit-track"),
    });
    const RESTING_FRAME = { top: 0, bottom: 0, band: 0, scale: 1, header: 0, ring: 0 };

    it("commentaire 14 — entrée dans le Circuit déposée : la nouvelle disposition est rendue avec un cadre du Circuit sans décalage", () => {
      nativeSetValue();
      renderLaidOut();
      lift("A");
      moveTo("A", 200);
      settle();
      expect(circuitFrame().top).toBe(-PITCH);
      release("A", 200);
      expect(order()).toEqual(["B:BEFORE_TOUR", "A:IN_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR"]);
      expect(circuitFrame()).toEqual(RESTING_FRAME);
      expect(rowShift("B")).toBe(0);
      expect(rowShift("X")).toBe(0);
      expect(rowShift("Z")).toBe(0);
    });

    it("commentaire 14 — sortie du Circuit déposée : cadre du Circuit sans décalage avec la nouvelle disposition", () => {
      nativeSetValue();
      renderLaidOut();
      lift("X");
      moveTo("X", 200);
      settle();
      expect(circuitFrame().bottom).toBe(-(70 + CIRCUIT_GAP));
      release("X", 200);
      expect(order()).toEqual(["A:BEFORE_TOUR", "B:BEFORE_TOUR", "Z:AFTER_TOUR", "X:AFTER_TOUR"]);
      // PRE-9 B.2 — D-451, COMP §1 : X était le dernier membre — le Circuit disparaît (aucun cadre à poser).
      expect(screen.queryByTestId("composition-tour-section", { includeHiddenElements: true })).toBeNull();
      expect(rowShift("Z")).toBe(0);
    });

    /**
     * Pilote natif simulé : la valeur JS n'avance pas pendant l'animation ; à l'arrêt, le rappel de fin
     * est appelé aussitôt, et la valeur atteinte (mi-course) arrive une tâche plus tard : React Native
     * la recopie (`__onAnimatedValueUpdateReceived`) puis rerend les vues avec la valeur JS.
     */
    function nativeTiming() {
      jest.spyOn(Animated, "timing").mockImplementation((value, config) => {
        const internal = value as unknown as InternalValue;
        const toValue = config.toValue as number;
        let onEnd: Animated.EndCallback | undefined;
        let timer: ReturnType<typeof setTimeout> | null = null;
        let from = 0;
        return {
          start: (callback?: Animated.EndCallback) => {
            onEnd = callback;
            from = internal.__getValue();
            timer = setTimeout(() => {
              timer = null;
              onEnd?.({ finished: true });
              internal.__onAnimatedValueUpdateReceived(toValue);
              internal._updateValue(internal.__getValue(), true);
            }, config.duration ?? 0);
          },
          stop: () => {
            if (timer === null) return;
            clearTimeout(timer);
            timer = null;
            onEnd?.({ finished: false });
            onEnd = undefined;
            setTimeout(() => {
              internal.__onAnimatedValueUpdateReceived((from + toValue) / 2);
              internal._updateValue(internal.__getValue(), true);
            }, 0);
          },
          reset: () => undefined,
        };
      });
    }

    it("commentaire 13 — dépôt pendant le décalage animé des voisines : rien ne reste figé à mi-course", () => {
      nativeTiming();
      renderLaidOut();
      lift("A");
      moveTo("A", 100);
      // B commence à remonter (animation native en cours) quand A est déposée sous elle.
      act(() => {
        jest.advanceTimersByTime(40);
      });
      release("A", 100);
      expect(order()).toEqual(["B:BEFORE_TOUR", "A:BEFORE_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR"]);
      settle();
      expect(rowShift("B")).toBe(0);
      expect(rowShift("A")).toBe(0);
    });

    /**
     * PRE-6 story 7.5 (recette J6, d-17) : « Déplacement du haut hors circuit, dans le circuit : une
     * zone grise rectangulaire remplace la carte qui se trouvait au dessus de la carte déplacée.
     * Déplacement de la première carte du circuit en dehors vers le haut : dans le circuit un
     * rectangle blanc persiste au niveau du circuit. » Pilote natif simulé de bout en bout.
     */
    describe("story 7.5 — d-17, cadre du Circuit après un changement de zone (pilote natif)", () => {
      const native = () => {
        nativeSetValue();
        nativeTiming();
      };
      function expectResting() {
        expect(circuitFrame()).toEqual(RESTING_FRAME);
        for (const id of ["A", "B", "X", "Z"]) expect(rowShift(id)).toBe(0);
      }
      /**
       * Cause (d-17) : sous Fabric iOS, quand la TAILLE d'une vue animée change, sa translation est
       * recalculée depuis des propriétés gardées, peut-être périmées (`RCTViewComponentView.mm`
       * l. 650-658), sans pose native ultérieure. Le Circuit change de taille au dépôt : ses bords
       * doivent alors être renvoyés au pilote natif (pose à leur cible, 0).
       */
      function expectCircuitEdgesResyncedAfterResize(height: number) {
        const setValue = Animated.Value.prototype.setValue as unknown as jest.Mock<(value: number) => void>;
        const before = setValue.mock.calls.length;
        fireLayout(screen.getByTestId("composition-tour-section"), 230, height);
        const pushed = setValue.mock.calls.slice(before).map(([value]) => value);
        expect(pushed).toEqual([0, 0]);
        // Même taille : rien n'est renvoyé.
        fireLayout(screen.getByTestId("composition-tour-section"), 230, height);
        expect(setValue.mock.calls.length).toBe(before + 2);
      }

      it("B (juste au-dessus du Circuit) entre dans le Circuit : rien ne reste décalé au-dessus (A)", () => {
        native();
        renderLaidOut();
        lift("B");
        // Centre de B : 185 ; +100 → 285 : dans le Circuit, au-dessus du milieu de X.
        moveTo("B", 100);
        settle();
        expect(circuitFrame().top).toBe(-PITCH);
        release("B", 100);
        expect(order()).toEqual(["A:BEFORE_TOUR", "B:IN_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR"]);
        settle();
        expectResting();
        // Le Circuit s'agrandit d'une carte.
        expectCircuitEdgesResyncedAfterResize(170 + 70 + CIRCUIT_GAP);
      });

      it("X (première carte du Circuit) sort vers le haut : rien ne reste décalé dans le Circuit", () => {
        native();
        renderLaidOut();
        lift("X");
        // Centre de X : 325 ; -200 → 125 : avant le Circuit, entre A (105) et B (185).
        moveTo("X", -200);
        settle();
        expect(circuitFrame().top).toBeGreaterThan(0);
        release("X", -200);
        expect(order()).toEqual(["A:BEFORE_TOUR", "X:BEFORE_TOUR", "B:BEFORE_TOUR", "Z:AFTER_TOUR"]);
        settle();
        for (const id of ["A", "B", "X", "Z"]) expect(rowShift(id)).toBe(0);
        // PRE-9 B.2 — D-451, COMP §1 : sa seule carte sortie, le Circuit disparaît (au lieu de se
        // rétracter en Circuit vide).
        expect(screen.queryByTestId("composition-tour-section", { includeHiddenElements: true })).toBeNull();
      });
    });

    describe("commentaire 3 — défilement automatique", () => {
      /** Zone visible de la liste : y 0 à 300 dans l'écran. */
      const VIEWPORT = { top: 0, height: 300 };
      /** Story 7.10 : hauteur de la zone d'action fixe qui recouvre le bas du corps. */
      const RESERVE = finalActionZoneHeight(34);
      let scrollTo: jest.Mock<(options: { y: number; animated: boolean }) => void>;
      beforeEach(() => {
        scrollTo = jest.fn();
        const prototype = ScrollView.prototype as unknown as {
          scrollTo: (options: { y: number; animated: boolean }) => void;
          getNativeScrollRef: () => unknown;
        };
        jest.spyOn(prototype, "scrollTo").mockImplementation(scrollTo);
        jest.spyOn(prototype, "getNativeScrollRef").mockReturnValue({
          measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) =>
            // Story 7.10 (D-444) : le corps passe sous la zone d'action fixe (insets de test : bas 34,
            // zone de 114) ; la zone visible, au-dessus d'elle, reste y 0 à 300.
            callback(0, VIEWPORT.top, 402, VIEWPORT.height + RESERVE),
        });
      });
      function layOutBody(contentHeight = 900, offset = 0) {
        const body = screen.getByTestId("composition-body");
        fireEvent(body, "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 402, height: VIEWPORT.height + RESERVE } } });
        fireEvent(body, "contentSizeChange", 402, contentHeight);
        fireEvent(body, "scroll", { nativeEvent: { contentOffset: { x: 0, y: offset } } });
      }
      const offsets = () => scrollTo.mock.calls.map(([options]) => options.y);
      const lastOffset = () => offsets()[offsets().length - 1] ?? 0;
      const frames = (ms: number) =>
        act(() => {
          jest.advanceTimersByTime(ms);
        });

      it("doigt dans la bande du bas : la liste défile sans animation, de plus en plus loin ; la carte reste sous le doigt et l'emplacement suit le défilement", () => {
        renderLaidOut();
        layOutBody();
        lift("A");
        // Doigt à 280 (bande du bas : 236 à 300) ; centre de A dans le contenu : 105 + 180 = 285,
        // dans le Circuit au-dessus du milieu de X (325) → emplacement 0 du Circuit, sans défilement.
        moveTo("A", 180);
        settle();
        expect(scrollTo).toHaveBeenCalled();
        for (const [options] of scrollTo.mock.calls) expect(options.animated).toBe(false);
        const values = offsets();
        for (let index = 1; index < values.length; index += 1) expect(values[index]!).toBeGreaterThan(values[index - 1]!);
        // La carte suit le doigt ET le défilement (repère du contenu).
        expect(translateY("composition-exercise-row-A")).toBeCloseTo(180 + lastOffset(), 6);
        // Le défilement a porté A au-delà du Circuit (bas à 400), doigt immobile : l'aperçu suit — A
        // quitte la zone d'avant (B, le Circuit et Z remontent d'un pas) pour se placer après Z.
        expect(lastOffset()).toBeGreaterThan(400 - 285);
        // Sous `act` synchrone, les rendus du défilement sont appliqués à sa sortie : un second
        // passage laisse les décalages de l'aperçu atteindre leur cible (l'emplacement ne change plus).
        settle();
        expect(rowShift("B")).toBe(-PITCH);
        expect(rowShift("Z")).toBe(-PITCH);
        expect(circuitFrame()).toEqual({ top: -PITCH, bottom: -PITCH, band: -PITCH, scale: 1, header: -PITCH, ring: -PITCH });
        release("A", 180);
        expect(order()).toEqual(["B:BEFORE_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR", "A:AFTER_TOUR"]);
      });

      it("vitesse progressive : plus le doigt est profond dans la bande, plus le défilement est rapide ; hors de la bande, arrêt", () => {
        renderLaidOut();
        layOutBody();
        lift("A");
        moveTo("A", 150); // 250 : 14 dans la bande.
        frames(160);
        const shallow = lastOffset();
        expect(shallow).toBeGreaterThan(0);
        moveTo("A", 195); // 295 : 59 dans la bande.
        frames(160);
        const deep = lastOffset() - shallow;
        expect(deep).toBeGreaterThan(shallow * 2);
        moveTo("A", 100); // 200 : hors de la bande.
        const calls = scrollTo.mock.calls.length;
        frames(500);
        expect(scrollTo.mock.calls.length).toBe(calls);
        release("A", 100);
      });

      it("bande du haut : défilement vers le haut jusqu'au bord du contenu, puis arrêt ; l'emplacement suit", () => {
        renderLaidOut();
        layOutBody(900, 120);
        lift("B");
        // Doigt à 20 (bande du haut : 0 à 64).
        moveTo("B", -80);
        frames(2000);
        expect(lastOffset()).toBe(0);
        const calls = scrollTo.mock.calls.length;
        frames(500);
        expect(scrollTo.mock.calls.length).toBe(calls);
        // Translation : -80 - 120 ; centre de B : 185 - 200 = -15 → avant A.
        expect(translateY("composition-exercise-row-B")).toBe(-200);
        release("B", -80);
        expect(order()).toEqual(["B:BEFORE_TOUR", "A:BEFORE_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR"]);
      });

      // Story 7.10 (revue) : le décalage maximal est celui du conteneur entier (contenu, réserve
      // comprise, moins la hauteur pleine) — la zone d'action ne fait que remonter la bande.
      it("bord bas du contenu : arrêt au décalage maximal", () => {
        renderLaidOut();
        layOutBody(400 + RESERVE);
        lift("A");
        moveTo("A", 199);
        frames(2000);
        expect(lastOffset()).toBe(100);
        const calls = scrollTo.mock.calls.length;
        frames(500);
        expect(scrollTo.mock.calls.length).toBe(calls);
        release("A", 199);
      });

      it("dépôt ou annulation : le défilement s'arrête ; le défilement par l'utilisateur est rétabli", () => {
        renderLaidOut();
        layOutBody();
        lift("A");
        moveTo("A", 190);
        frames(100);
        release("A", 190);
        const calls = scrollTo.mock.calls.length;
        frames(500);
        expect(scrollTo.mock.calls.length).toBe(calls);
        expect(screen.getByTestId("composition-body").props.scrollEnabled).toBe(true);

        // Annulation (responder repris) : arrêt aussi.
        settle();
        lift("B");
        moveTo("B", 190);
        frames(100);
        fireEvent(container("B"), "responderTerminate");
        const afterCancel = scrollTo.mock.calls.length;
        frames(500);
        expect(scrollTo.mock.calls.length).toBe(afterCancel);
      });

      it("revue 7.4 — doigt déjà immobile dans la bande au soulèvement : la liste défile sans mouvement", () => {
        renderLaidOut();
        layOutBody();
        fireEvent(container("A"), "touchStart", { nativeEvent: { pageX: 200, pageY: 290 } });
        fireEvent(screen.getByTestId("composition-exercise-row-A"), "longPress");
        frames(200);
        expect(lastOffset()).toBeGreaterThan(0);
        expect(translateY("composition-exercise-row-A")).toBeCloseTo(lastOffset(), 6);
        fireEvent(container("A"), "touchEnd", { nativeEvent: { pageX: 200, pageY: 290 } });
      });

      it("revue 7.4 — décalage de départ relevé aussi à la fin d'un défilement (`onScrollEndDrag`, `onMomentumScrollEnd`)", () => {
        renderLaidOut();
        layOutBody(900, 0);
        const body = screen.getByTestId("composition-body");
        fireEvent(body, "scrollEndDrag", { nativeEvent: { contentOffset: { x: 0, y: 40 } } });
        fireEvent(body, "momentumScrollEnd", { nativeEvent: { contentOffset: { x: 0, y: 120 } } });
        lift("A");
        moveTo("A", 195);
        frames(50);
        expect(offsets()[0]!).toBeGreaterThan(120);
        expect(offsets()[0]!).toBeLessThan(140);
        release("A", 195);
      });

      it("liste plus courte que la zone visible : aucun défilement", () => {
        renderLaidOut();
        layOutBody(250);
        lift("A");
        moveTo("A", 195);
        frames(500);
        expect(scrollTo).not.toHaveBeenCalled();
        release("A", 195);
      });

      it("glisser d'un Point d'arrêt : la liste défile aussi, et la puce reste sous le doigt", () => {
        renderLaidOut({ stopPoints: [{ id: "pc", scope: "AFTER_TOUR", position: 0 }] });
        layOutAfterCircuitPoint();
        layOutBody(900, 300);
        const row = screen.getByTestId("composition-stop-point-row-pc");
        fireEvent(row, "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
        fireEvent(screen.getByTestId("composition-stop-point-pc-chip"), "longPress");
        // Doigt à 10 (bande du haut).
        fireEvent(row, "responderMove", { nativeEvent: { pageX: 200, pageY: 10 } });
        frames(300);
        expect(lastOffset()).toBeLessThan(300);
        expect(translateY("composition-stop-point-pc")).toBeCloseTo(-90 + (lastOffset() - 300), 6);
        fireEvent(row, "touchEnd", { nativeEvent: { pageX: 200, pageY: 10 } });
        const calls = scrollTo.mock.calls.length;
        frames(500);
        expect(scrollTo.mock.calls.length).toBe(calls);
      });
    });
  });

  /**
   * PRE-6 story 5.2 (D-435) : le rail segmenté suit les décalages du glisser sans recalcul de mise en
   * page — chaque lien, porté par l'élément qu'il relie, s'étire de la différence entre la
   * translation de son élément et celle de son prédécesseur (`scaleY`, bas fixe) ; la carte glissée
   * sort de la chaîne. Au dépôt, tout revient à l'échelle 1.
   */
  describe("rail segmenté pendant le glisser (PRE-6 story 5.2)", () => {
    const hidden = { includeHiddenElements: true };
    const linkHeight = (testID: string) =>
      StyleSheet.flatten(screen.getByTestId(testID, hidden).props.style).height as number;
    /** Hauteur visible d'un lien : sa hauteur au repos multipliée par son échelle. */
    const visible = (testID: string) => linkHeight(testID) * scaleY(testID);

    it("vers le bas : le lien de B traverse la place libérée par A et se rétracte avec B ; retour à 1 au dépôt", () => {
      renderLaidOut();
      // D-511 (08/11/2026) : écart 8 + haut du média 4. [8 + 8 — remplacé.]
      expect(linkHeight("composition-rail-link-B")).toBe(8 + OCCURRENCE_CARD_MEDIA.top);
      lift("A");
      // A sort de la chaîne : B se relie au Compte à rebours, à travers la place de A (8 + 70).
      expect(screen.queryByTestId("composition-rail-link-A", hidden)).toBeNull();
      expect(screen.queryByTestId("composition-rail-tail-A", hidden)).toBeNull();
      const restLength = 8 + 70 + 8 + OCCURRENCE_CARD_MEDIA.top;
      expect(linkHeight("composition-rail-link-B")).toBe(restLength);
      moveTo("A", 100);
      settle();
      // B remonte d'un pas, le Compte à rebours ne bouge pas : le lien perd un pas, bas fixe.
      expect(rowShift("B")).toBe(-PITCH);
      expect(visible("composition-rail-link-B")).toBeCloseTo(restLength - PITCH, 6);
      expect(translateY("composition-rail-link-B")).toBeCloseTo(PITCH / 2, 6);
      // L'emplacement visé s'ouvre entre B (remonté) et le Circuit (immobile) : le lien de l'en-tête
      // le traverse, allongé d'un pas. Recette du 29/10 : 8 + 14 + 4 (anneau centré sur la ligne de 18).
      expect(visible("composition-rail-link-circuit-header")).toBeCloseTo(26 + PITCH, 6);
      release("A", 100);
      expect(order()).toEqual(["B:BEFORE_TOUR", "A:BEFORE_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR"]);
      // Story 7.6 : A glisse jusqu'à sa place (hors de la chaîne le temps du mouvement), puis la rejoint.
      settle();
      expect(linkHeight("composition-rail-link-B")).toBe(8 + OCCURRENCE_CARD_MEDIA.top);
      expect(scaleY("composition-rail-link-B")).toBe(1);
      expect(translateY("composition-rail-link-B")).toBe(0);
      expect(screen.getByTestId("composition-rail-link-A", hidden)).toBeTruthy();
    });

    it("entrée dans le Circuit par le bas : le bas du Circuit s'étire à travers l'emplacement ouvert ; la Fin se relie à la rangée après le Circuit", () => {
      renderLaidOut({ stopPoints: [{ id: "pc", scope: "AFTER_TOUR", position: 0 }] });
      layOutAfterCircuitPoint();
      lift("Z");
      moveTo("Z", -100);
      settle();
      // Bas du Circuit : de X (immobile) au bord bas, qui descend d'un pas du Circuit.
      // D-511 : marge basse = bas du média → bas de la carte (4). [8 — remplacé.]
      const circuitBottom = OCCURRENCE_CARD_HEIGHT - OCCURRENCE_CARD_MEDIA.bottom;
      expect(linkHeight("composition-rail-link-circuit-end")).toBe(circuitBottom);
      expect(visible("composition-rail-link-circuit-end")).toBeCloseTo(circuitBottom + CIRCUIT_PITCH, 6);
      // La rangée du point après le Circuit suit le bas du Circuit : son lien ne change pas.
      expect(scaleY("composition-rail-link-stop-pc")).toBe(1);
      // Fin : à travers la place de Z (8 + 70) ; elle descend du net, la rangée d'un pas du Circuit.
      const endLength = 8 + 70 + 8 + 7;
      expect(linkHeight("composition-rail-link-end")).toBe(endLength);
      expect(visible("composition-rail-link-end")).toBeCloseTo(endLength + CIRCUIT_EXTRA - CIRCUIT_PITCH, 6);
      fireEvent(container("Z"), "responderTerminate", {});
      settle();
      expect(scaleY("composition-rail-link-circuit-end")).toBe(1);
      expect(scaleY("composition-rail-link-end")).toBe(1);
    });

    /**
     * PRE-6 story 5.2b (revue) : jonction VISIBLE du rail pendant le dialogue de perte et le retour.
     * Géométrie injectée cohérente avec les constantes de l'écran : cartes de 80 (rangée du point
     * d'arrêt : écart de la zone + 22), écart 8 hors Circuit, 9 dans le Circuit, marge 14, en-tête
     * de 40 ; elle est re-mesurée à chaque appel de `layOut`.
     *
     * Invariant (`expectRailJoined`) : pour chaque élément de la chaîne, le haut visible de son lien
     * est le bas visible de son prédécesseur — ou, quand le prédécesseur chevauche l'élément, le bord
     * haut de l'élément (lien ramené à sa surface propre), ou un point recouvert par la carte au
     * premier plan — ; jamais sous sa surface propre ; et aucun lien ne traverse le média d'une carte
     * peinte sous lui, hors de ce que la carte au premier plan recouvre. Une carte hors de la chaîne
     * qui n'est pas soulevée porte le rail de sa propre surface.
     */
    describe("jonction visible pendant le dialogue et le retour (PRE-6 story 5.2b)", () => {
      const CARD = OCCURRENCE_CARD_HEIGHT;
      const MEDIA = OCCURRENCE_CARD_MEDIA;
      const HEADER = CIRCUIT_HEADER_HEIGHT;
      const GAP = spacing[8];
      const EPSILON = 1e-6;
      const BODY_TOP = 40;
      type Zone = "BEFORE_TOUR" | "IN_TOUR" | "AFTER_TOUR";
      type Element = {
        readonly key: string;
        readonly group: string;
        readonly top: number;
        readonly bottom: number;
        readonly entry: number;
        readonly minLength: number;
        readonly linkTestID: string | null;
        /** Élément qui suit le doigt quand il est soulevé (carte, ligne du point). */
        readonly liftTestID?: string;
        readonly shift: () => number;
        readonly media: { readonly top: number; readonly bottom: number } | null;
      };

      function renderRail(exercises: SessionDraftExercise[], overrides?: Partial<Draft>) {
        render(
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
        return layOut();
      }

      /** Mesure la mise en page (ordre courant du brouillon) et rend le modèle de la séquence. */
      function layOut() {
        const exercises = probe.draft!.exercises;
        // Story 6.2 (D-441) : rangées de la zone dans l'ordre affiché — cartes et points.
        const itemsOf = (zone: Zone) => scopeSequence(exercises, probe.draft!.stopPoints ?? [], zone);
        const ids = (zone: Zone) => itemsOf(zone);
        const elements: Element[] = [];
        const rowsOf = (zone: Zone, gap: number, base: number, group: string) => {
          let y = 0;
          itemsOf(zone).forEach((item, index) => {
            if (index > 0) y += gap;
            const top = base + y;
            if (item.kind === "STOP_POINT") {
              const id = item.point.id;
              fireLayout(screen.getByTestId(`composition-stop-point-row-${id}`), y, STOP_POINT_LINE_HEIGHT);
              elements.push({
                key: `stop:${id}`,
                group,
                top,
                bottom: top + STOP_POINT_LINE_HEIGHT,
                entry: top,
                minLength: 0,
                linkTestID: `composition-rail-link-stop-${id}`,
                liftTestID: `composition-stop-point-${id}`,
                shift: () => translateY(`composition-stop-point-row-${id}`),
                media: null,
              });
              y += STOP_POINT_LINE_HEIGHT;
              return;
            }
            const id = item.occurrence.id;
            fireLayout(container(id), y, CARD);
            elements.push({
              key: id,
              group,
              top,
              bottom: top + CARD,
              entry: top + MEDIA.top,
              minLength: MEDIA.top,
              linkTestID: `composition-rail-link-${id}`,
              liftTestID: `composition-exercise-row-${id}`,
              shift: () => rowShift(id),
              media: { top: top + MEDIA.top, bottom: top + MEDIA.bottom },
            });
            y += CARD;
          });
          return y;
        };
        let y = BODY_TOP;
        if (ids("BEFORE_TOUR").length > 0) {
          const height = rowsOf("BEFORE_TOUR", GAP, y, "before");
          fireLayout(screen.getByTestId("composition-zone-before-tour"), y, height);
          y += height + GAP;
        }
        const tourTop = y;
        elements.push({
          key: "header",
          group: "circuit",
          top: tourTop,
          bottom: tourTop + 14 + HEADER,
          entry: tourTop + 14 + (HEADER - 10) / 2,
          minLength: 14 + (HEADER - 10) / 2,
          linkTestID: "composition-rail-link-circuit-header",
          shift: () => translateY("composition-sequence-marker-circuit-track"),
          media: null,
        });
        const listTop = 14 + HEADER + CIRCUIT_GAP;
        let tourHeight = 14 + HEADER + 14;
        if (ids("IN_TOUR").length > 0) {
          const height = rowsOf("IN_TOUR", CIRCUIT_GAP, tourTop + listTop, "circuit");
          fireLayout(screen.getByTestId("composition-zone-in-tour"), listTop, height);
          // Contre-recette du 30/10 (obs-3) : marge basse sous les cartes = bas du média → bas de la carte (4 depuis D-511, 8 auparavant).
          tourHeight = listTop + height + (CARD - MEDIA.bottom);
        }
        fireLayout(screen.getByTestId("composition-tour-section"), tourTop, tourHeight);
        const tourBottom = tourTop + tourHeight;
        elements.push({
          key: "circuit-end",
          group: "circuit",
          top: tourBottom,
          bottom: tourBottom,
          entry: tourBottom,
          minLength: ids("IN_TOUR").length > 0 ? CARD - MEDIA.bottom : 14,
          linkTestID: "composition-rail-link-circuit-end",
          shift: () => translateY("composition-rail-circuit-end-track"),
          media: null,
        });
        y = tourBottom + GAP;
        if (ids("AFTER_TOUR").length > 0) {
          const height = rowsOf("AFTER_TOUR", GAP, y, "after");
          fireLayout(screen.getByTestId("composition-zone-after-tour"), y, height);
        }
        return elements;
      }

      const hasLink = (testID: string) => screen.queryByTestId(testID, hidden) !== null;

      /** Jonctions visibles, surface propre, aucun média traversé — voir l'en-tête du bloc. */
      function expectRailJoined(elements: readonly Element[], raisedId: string | null) {
        const raised = elements.find((element) => element.key === raisedId) ?? null;
        // Carte au premier plan : translation de sa rangée (registre) et de sa carte (doigt, soulevée).
        const raisedShift =
          raised === null ? 0 : raised.shift() + (raised.liftTestID === undefined ? 0 : translateY(raised.liftTestID));
        // Seule une carte recouvre l'axe du rail (la puce d'un point est centrée sur la page).
        const cover =
          raised === null || raised.media === null ? null : { top: raised.top + raisedShift, bottom: raised.bottom + raisedShift };
        const raisedGroup = raised?.group ?? null;
        const rank = (element: Element, index: number) =>
          element.key === raisedId ? 1e6 : element.group === raisedGroup ? 1e3 + index : index;
        const chain = elements.filter((element) => element.linkTestID === null || hasLink(element.linkTestID));
        // Revue 6.2 : un point hors de la chaîne (soulevé, tenu, en retour) ne dessine aucun segment de
        // rail : le lien de ses voisines traverse déjà sa place. [« ni point de raccord » — remplacé par
        // la recette iPhone n° 2 du 31/10/2026 (b6-ancien) : son point de raccord le suit, dans sa
        // couche propre (`-lifted`), sur l'axe du rail.]
        for (const element of elements) {
          if (element.media !== null || element.linkTestID === null || hasLink(element.linkTestID)) continue;
          const id = element.key.slice("stop:".length);
          expect(screen.queryByTestId(`composition-rail-tail-stop-${id}`, hidden)).toBeNull();
          expect(screen.getByTestId(`composition-rail-dot-stop-${id}-lifted`, hidden)).toBeTruthy();
        }
        const defects: string[] = [];
        chain.forEach((element, index) => {
          if (index === 0 && element.key !== "header") return;
          const previous = index === 0 ? null : chain[index - 1]!;
          const testID = element.linkTestID!;
          const length = visible(testID);
          const anchor = element.entry + element.shift();
          const top = anchor - length;
          if (length < element.minLength - EPSILON) defects.push(`${element.key} : sous sa surface propre`);
          if (previous !== null) {
            const previousBottom = previous.bottom + previous.shift();
            const joined =
              Math.abs(top - previousBottom) < 1e-4 ||
              (Math.abs(length - element.minLength) < 1e-4 && previousBottom >= top - 1e-4) ||
              (cover !== null && top > cover.top - EPSILON && top < cover.bottom + EPSILON);
            if (!joined) defects.push(`${element.key} : jonction ${(top - previousBottom).toFixed(3)}`);
          }
          elements.forEach((card, cardIndex) => {
            if (card.media === null || card === element || card.key === raisedId) return;
            if (rank(card, cardIndex) > rank(element, elements.indexOf(element))) return;
            let from = Math.max(top, card.media.top + card.shift());
            let to = Math.min(anchor, card.media.bottom + card.shift());
            if (cover !== null && from < cover.bottom && to > cover.top) {
              if (cover.top <= from) from = Math.max(from, cover.bottom);
              else to = Math.min(to, cover.top);
            }
            if (to - from > 1e-4) defects.push(`${element.key} : traverse le média de ${card.key}`);
          });
        });
        expect(defects).toEqual([]);
      }

      /** Carte hors de la chaîne mais pas soulevée : rail de sa propre surface, et rien d'autre. */
      function expectOwnSurfaceRail(id: string) {
        expect(hasLink(`composition-rail-link-${id}`)).toBe(false);
        expect(StyleSheet.flatten(screen.getByTestId(`composition-rail-own-top-${id}`, hidden).props.style)).toMatchObject({
          top: 0,
          height: MEDIA.top,
        });
        expect(StyleSheet.flatten(screen.getByTestId(`composition-rail-tail-${id}`, hidden).props.style)).toMatchObject({
          top: MEDIA.bottom,
          bottom: 0,
        });
      }
      /** Carte revenue, de nouveau dans la chaîne. */
      function expectBackInChain(id: string) {
        expect(rowShift(id)).toBe(0);
        expect(hasLink(`composition-rail-link-${id}`)).toBe(true);
        expect(screen.queryByTestId(`composition-rail-own-top-${id}`, hidden)).toBeNull();
      }
      const frames = (count: number) =>
        act(() => {
          jest.advanceTimersByTime(16 * count);
        });
      const zIndexOf = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style).zIndex;
      const centerOf = (elements: readonly Element[], id: string) => {
        const element = elements.find((candidate) => candidate.key === id)!;
        return (element.top + element.bottom) / 2;
      };

      it("dialogue de perte : la dernière carte avant le Circuit, relâchée dans le Circuit, y reste tenue ; « Annuler » la ramène, rail continu", () => {
        let elements = renderRail(
          [
            anActivity("B", "BEFORE_TOUR", { name: "Squats" }),
            anActivity("A", "BEFORE_TOUR", { name: "Gainage", executionParameters: durationParameters(30, 3) }),
            anActivity("X", "IN_TOUR", { name: "Pompes" }),
          ],
          { circuitNature: "SERIES", tourRepeatCount: 2 },
        );
        expectRailJoined(elements, null);
        // Vise l'emplacement après X : centre de A sous le centre de X, dans le Circuit.
        const dy = centerOf(elements, "X") + 10 - centerOf(elements, "A");
        lift("A");
        moveTo("A", dy);
        settle();
        expectRailJoined(elements, "A");
        release("A", dy);
        expect(screen.getByTestId("circuit-entry-confirm-card")).toBeTruthy();
        // Tenue à sa position de dépôt (translation du registre), aspect au repos, hors de la chaîne.
        expect(rowShift("A")).toBe(dy);
        expect(translateY("composition-exercise-row-A")).toBe(0);
        expectOwnSurfaceRail("A");
        expect(zIndexOf("composition-activity-A")).toBe(1);
        expect(zIndexOf("composition-zone-before-tour")).toBe(1);
        expectRailJoined(elements, "A");
        settle();
        expect(rowShift("A")).toBe(dy);
        expectRailJoined(elements, "A");

        fireEvent.press(screen.getByLabelText(composition.circuitEntryConfirmModal.cancel));
        for (let frame = 0; frame < 5; frame += 1) {
          frames(2);
          expect(rowShift("A")).toBeLessThan(dy);
          expectOwnSurfaceRail("A");
          expectRailJoined(elements, "A");
        }
        settle();
        expect(order()).toEqual(["B:BEFORE_TOUR", "A:BEFORE_TOUR", "X:IN_TOUR"]);
        expectBackInChain("A");
        expect(zIndexOf("composition-activity-A")).toBeUndefined();
        elements = layOut();
        expectRailJoined(elements, null);
      });

      // Story 7.1 (D-442) : un déplacement de carte n'est plus refusé pour un point interdit ou
      // consécutif ; story 7.2 : le dépôt qui demande un choix (conflit de Tour) tient la carte pendant
      // le dialogue natif, comme le dialogue de perte (story 5.2b).
      it("dépôt en attente du choix de Tour (story 7.2) : la carte reste tenue pendant le dialogue ; Annuler la ramène depuis sa position de dépôt, image par image, au premier plan, rail continu", () => {
        const alert = tourChoiceAlert();
        try {
          const elements = renderRail(
            [
              anActivity("A", "BEFORE_TOUR", { name: "Gainage" }),
              anActivity("B", "IN_TOUR", { name: "Squats" }),
              anActivity("C", "IN_TOUR", { name: "Pompes" }),
            ],
            {
              tourRepeatCount: 2,
              stopPoints: [
                { id: "s-1", scope: "IN_TOUR", position: 1 },
                { id: "s-2", scope: "IN_TOUR", position: 2 },
              ],
            },
          );
          expectRailJoined(elements, null);
          // B sort du Circuit au-dessus de A : s-1 deviendrait début de Tour, s-2 est fin de Tour (N = 2).
          const dy = centerOf(elements, "A") - 10 - centerOf(elements, "B");
          lift("B");
          moveTo("B", dy);
          settle();
          expectRailJoined(elements, "B");
          release("B", dy);
          // Dialogue natif ; rien n'est appliqué ; la carte reste là où elle a été lâchée.
          expect(alert).toHaveBeenCalledTimes(1);
          expect(alert.mock.calls[0]![0]).toBe(composition.tourBoundaryChoice.title);
          expect(order()).toEqual(["A:BEFORE_TOUR", "B:IN_TOUR", "C:IN_TOUR"]);
          frames(6);
          expect(rowShift("B")).toBe(dy);
          expectOwnSurfaceRail("B");
          answerTourChoice(alert, composition.tourBoundaryChoice.cancel);
          expect(order()).toEqual(["A:BEFORE_TOUR", "B:IN_TOUR", "C:IN_TOUR"]);
          expect(probe.draft!.stopPoints).toEqual([
            { id: "s-1", scope: "IN_TOUR", position: 1 },
            { id: "s-2", scope: "IN_TOUR", position: 2 },
          ]);
          // Ramenée par le registre depuis sa position de dépôt.
          expect(rowShift("B")).toBe(dy);
          let previous = dy;
          for (let frame = 0; frame < 6; frame += 1) {
            expectOwnSurfaceRail("B");
            expectRailJoined(elements, "B");
            frames(2);
            expect(rowShift("B")).toBeGreaterThanOrEqual(previous);
            previous = rowShift("B");
          }
          settle();
          expectBackInChain("B");
          expectRailJoined(layOut(), null);
        } finally {
          alert.mockRestore();
        }
      });

      it("dépôt en attente du choix de Tour (story 7.2) : « Début de tour » applique le déplacement, retire le point de fin et annonce le retrait ; carte posée sans saut, rail continu", async () => {
        const alert = tourChoiceAlert();
        const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
        try {
          const elements = renderRail(
            [
              anActivity("A", "BEFORE_TOUR", { name: "Gainage" }),
              anActivity("B", "IN_TOUR", { name: "Squats" }),
              anActivity("C", "IN_TOUR", { name: "Pompes" }),
            ],
            {
              tourRepeatCount: 2,
              stopPoints: [
                { id: "s-1", scope: "IN_TOUR", position: 1 },
                { id: "s-2", scope: "IN_TOUR", position: 2 },
              ],
            },
          );
          const dy = centerOf(elements, "A") - 10 - centerOf(elements, "B");
          lift("B");
          moveTo("B", dy);
          settle();
          release("B", dy);
          expect(alert).toHaveBeenCalledTimes(1);
          answerTourChoice(alert, composition.tourBoundaryChoice.head);
          expect(order()).toEqual(["B:BEFORE_TOUR", "A:BEFORE_TOUR", "C:IN_TOUR"]);
          expect(probe.draft!.stopPoints).toEqual([{ id: "s-1", scope: "IN_TOUR", position: 0 }]);
          // Appliqué ; story 7.6 : la carte tenue part de l'endroit du lâcher et glisse jusqu'à sa place.
          expect(rowShift("B")).not.toBe(0);
          settle();
          expect(rowShift("B")).toBe(0);
          await waitFor(() =>
            expect(announce).toHaveBeenCalledWith(composition.stopPointsRemovedAnnouncement.singular),
          );
          settle();
          expectRailJoined(layOut(), null);
        } finally {
          alert.mockRestore();
          announce.mockRestore();
        }
      });

      it("dernière carte du Circuit vers l'après, geste interrompu : retour animé, rail continu ; carte à rangée de point d'arrêt", () => {
        const elements = renderRail(
          [
            anActivity("X", "IN_TOUR", { name: "Pompes" }),
            anActivity("Y", "IN_TOUR", { name: "Fentes" }),
            anActivity("Z", "AFTER_TOUR", { name: "Squats" }),
          ],
          { stopPoints: [{ id: "s-1", scope: "IN_TOUR", position: 1 }] },
        );
        expect(screen.getByTestId("composition-stop-point-row-s-1", hidden)).toBeTruthy();
        expectRailJoined(elements, null);
        const dy = centerOf(elements, "Z") + 10 - centerOf(elements, "Y");
        lift("Y");
        moveTo("Y", dy);
        settle();
        expectRailJoined(elements, "Y");
        fireEvent(container("Y"), "responderTerminate", {});
        expect(rowShift("Y")).toBe(dy);
        for (let frame = 0; frame < 6; frame += 1) {
          expectOwnSurfaceRail("Y");
          expect(zIndexOf("composition-tour-section")).toBe(1);
          expectRailJoined(elements, "Y");
          frames(2);
        }
        settle();
        expectBackInChain("Y");
        expectRailJoined(layOut(), null);
      });


      it("nouveau geste pendant un retour : le retour s'arrête, tout est posé à 0 avant le relevé", () => {
        const elements = renderRail(
          [anActivity("A", "BEFORE_TOUR", { name: "Gainage" }), anActivity("B", "BEFORE_TOUR", { name: "Squats" }), anActivity("X", "IN_TOUR", { name: "Pompes" })],
        );
        const dy = centerOf(elements, "B") + 10 - centerOf(elements, "A");
        lift("A");
        moveTo("A", dy);
        settle();
        fireEvent(container("A"), "responderTerminate", {});
        frames(3);
        expect(rowShift("A")).toBeGreaterThan(0);
        expect(rowShift("B")).toBeLessThan(0);
        lift("B");
        // Synchrone, avant tout mouvement : l'écran rejoint la mise en page relevée.
        expect(rowShift("A")).toBe(0);
        expect(rowShift("B")).toBe(0);
        expectBackInChain("A");
        moveTo("B", -dy);
        settle();
        expect(rowShift("A")).toBeGreaterThan(0);
        expectRailJoined(elements, "B");
        release("B", -dy);
        expect(order()).toEqual(["B:BEFORE_TOUR", "A:BEFORE_TOUR", "X:IN_TOUR"]);
        expectRailJoined(layOut(), null);
      });

      /**
       * PRE-6 story 6.2 (D-441, R1, R2, RM-251) : glisser à un rang de la séquence mêlée — la carte
       * laisse les points en place (\`moveOccurrenceInSequence\`) ; le point se déplace seul
       * (\`moveStopPoint\`) ; refus → retour animé, rien d'écrit. Rail continu (\`expectRailJoined\`).
       */
      describe("story 6.2 — Points d'arrêt autonomes", () => {
        const circuitX = () => anActivity("X", "IN_TOUR", { name: "Pompes" });
        const before = (ids: string[]) => ids.map((id) => anActivity(id, "BEFORE_TOUR", { name: `Ex ${id}` }));
        const pointsOf = () => (probe.draft!.stopPoints ?? []).map(({ id, scope, position }) => `${id}:${scope}:${position}`);
        const pointRow = (id: string) => screen.getByTestId(`composition-stop-point-row-${id}`);
        const pointChip = (id: string) => screen.getByTestId(`composition-stop-point-${id}-chip`);
        function liftPoint(id: string) {
          fireEvent(pointRow(id), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
          fireEvent(pointChip(id), "longPress");
        }
        const movePoint = (id: string, dy: number) =>
          fireEvent(pointRow(id), "responderMove", { nativeEvent: { pageX: 200, pageY: 100 + dy } });
        const releasePoint = (id: string, dy: number) =>
          fireEvent(pointRow(id), "touchEnd", { nativeEvent: { pageX: 200, pageY: 100 + dy } });
        const pointActions = (id: string) =>
          ((pointChip(id).props.accessibilityActions ?? []) as { name: string }[]).map((action) => action.name);

        it("R1 — [W, A, P, B], A glissée sous B → [W, P, B, A] : P reste en place, rail continu pendant le geste", () => {
          let elements = renderRail([...before(["W", "A", "B"]), circuitX()], {
            stopPoints: [{ id: "P", scope: "BEFORE_TOUR", position: 2 }],
          });
          expectRailJoined(elements, null);
          const dy = centerOf(elements, "B") + 10 - centerOf(elements, "A");
          lift("A");
          moveTo("A", dy);
          settle();
          // P (rangée) remonte d'un pas avec B : la place de A se referme, l'emplacement s'ouvre sous B.
          expect(translateY("composition-stop-point-row-P")).toBeLessThan(0);
          expectRailJoined(elements, "A");
          release("A", dy);
          expect(order()).toEqual(["W:BEFORE_TOUR", "B:BEFORE_TOUR", "A:BEFORE_TOUR", "X:IN_TOUR"]);
          expect(pointsOf()).toEqual(["P:BEFORE_TOUR:1"]);
          // Story 7.6 : fin de la mise en place de A.
          settle();
          elements = layOut();
          expectRailJoined(elements, null);
          expect(testIdOrder(screen.toJSON(), ["composition-activity-W", "composition-stop-point-row-P", "composition-activity-B", "composition-activity-A"])).toEqual([
            "composition-activity-W",
            "composition-stop-point-row-P",
            "composition-activity-B",
            "composition-activity-A",
          ]);
        });

        it("D-442 — [A, P, B, Q, C], B glissée après C : appliqué, Q retiré (P conservé), rail continu", () => {
          const elements = renderRail([...before(["A", "B", "C"]), circuitX()], {
            stopPoints: [
              { id: "P", scope: "BEFORE_TOUR", position: 1 },
              { id: "Q", scope: "BEFORE_TOUR", position: 2 },
            ],
          });
          const dy = centerOf(elements, "C") + 10 - centerOf(elements, "B");
          lift("B");
          moveTo("B", dy);
          settle();
          expectRailJoined(elements, "B");
          release("B", dy);
          expect(order()).toEqual(["A:BEFORE_TOUR", "C:BEFORE_TOUR", "B:BEFORE_TOUR", "X:IN_TOUR"]);
          expect(pointsOf()).toEqual(["P:BEFORE_TOUR:1"]);
          settle();
          expect(rowShift("B")).toBe(0);
          expectRailJoined(layOut(), null);
        });

        it("R2 — [A, P, B, C], P glissé sous B → [A, B, P, C] : identité conservée, la puce suit le doigt, voisines décalées, rail continu", () => {
          let elements = renderRail([...before(["A", "B", "C"]), circuitX()], {
            stopPoints: [{ id: "P", scope: "BEFORE_TOUR", position: 1 }],
          });
          const dy = centerOf(elements, "B") + 10 - centerOf(elements, "stop:P");
          liftPoint("P");
          // Soulevé : un seul élément au premier plan, aucun balayage, aucune mise en page changée.
          expect(StyleSheet.flatten(pointRow("P").props.style).zIndex).toBe(1);
          movePoint("P", dy);
          settle();
          expect(translateY("composition-stop-point-P")).toBe(dy);
          // Recette iPhone n° 2 du 31/10/2026 (b6-ancien, Hermann : « le cercle plein sur le rail ne se
          // déplace pas en même temps, il apparaît lorsque le point est déposé ») : le point de raccord
          // suit la puce, sur l'axe du rail.
          expect(translateY("composition-rail-dot-stop-P-lifted")).toBe(dy);
          expect(StyleSheet.flatten(screen.getByTestId("composition-rail-dot-stop-P", hidden).props.style)).toMatchObject({ left: OCCURRENCE_CARD_MEDIA.centerX - 3 });
          // B remonte dans la place libérée par P.
          expect(rowShift("B")).toBeLessThan(0);
          expect(screen.queryByTestId("composition-rail-link-stop-P", hidden)).toBeNull();
          expectRailJoined(elements, "stop:P");
          releasePoint("P", dy);
          expect(pointsOf()).toEqual(["P:BEFORE_TOUR:2"]);
          expect(order()).toEqual(["A:BEFORE_TOUR", "B:BEFORE_TOUR", "C:BEFORE_TOUR", "X:IN_TOUR"]);
          expect(rowShift("B")).toBe(0);
          // Story 7.6 : la rangée du point part de l'endroit du lâcher (10 sous le milieu de B) et
          // glisse jusqu'à sa place, sous B.
          const settleFrom = translateY("composition-stop-point-row-P");
          expect(settleFrom).not.toBe(0);
          settle();
          expect(translateY("composition-stop-point-row-P")).toBe(0);
          elements = layOut();
          expectRailJoined(elements, null);
        });

        it("R2 / RM-251 — un point déposé contre un autre est refusé : retour animé, rien d'écrit", () => {
          const elements = renderRail([...before(["A", "B", "C"]), circuitX()], {
            stopPoints: [
              { id: "P", scope: "BEFORE_TOUR", position: 1 },
              { id: "Q", scope: "BEFORE_TOUR", position: 2 },
            ],
          });
          const draftBefore = probe.draft;
          // Entre le milieu de B et celui de Q : même emplacement que Q.
          const dy = centerOf(elements, "B") + 10 - centerOf(elements, "stop:P");
          liftPoint("P");
          movePoint("P", dy);
          settle();
          releasePoint("P", dy);
          expect(probe.draft!.stopPoints).toBe(draftBefore!.stopPoints);
          expect(translateY("composition-stop-point-row-P")).toBe(dy);
          for (let frame = 0; frame < 4; frame += 1) {
            expectRailJoined(elements, "stop:P");
            frames(2);
          }
          settle();
          expect(translateY("composition-stop-point-row-P")).toBe(0);
          expect(hasLink("composition-rail-link-stop-P")).toBe(true);
          expectRailJoined(layOut(), null);
        });

        it("AC3 — « Monter » / « Descendre » d'un point : vers l'emplacement autorisé voisin, proposés seulement si acceptés", () => {
          renderRail([...before(["A", "B", "C"]), circuitX(), anActivity("Z", "AFTER_TOUR", { name: "Ex Z" })], {
            stopPoints: [
              { id: "P", scope: "BEFORE_TOUR", position: 1 },
              { id: "Q", scope: "BEFORE_TOUR", position: 3 },
            ],
          });
          // P : monter le mettrait juste après le compte à rebours (jamais proposable) → absente ;
          // descendre → après B. Q (avant le Circuit) : descendre va en tête du Circuit (story 7.1, D-442), puis après X.
          expect(pointActions("P")).toEqual(["moveDown"]);
          expect(pointActions("Q")).toEqual(["moveUp", "moveDown"]);
          expect(pointChip("P").props.accessibilityHint).toBe(composition.pauses.stopPointReorderAccessibilityHint);
          fireEvent(pointChip("P"), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
          expect(pointsOf()).toEqual(["P:BEFORE_TOUR:2", "Q:BEFORE_TOUR:3"]);
          // Revue 6.2 : Q monte jusqu'au premier emplacement ACCEPTÉ — il franchit P (occupé), comme au
          // glisser : après A.
          expect(pointActions("Q")).toEqual(["moveUp", "moveDown"]);
          fireEvent(pointChip("Q"), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
          expect(pointsOf()).toEqual(["P:BEFORE_TOUR:2", "Q:BEFORE_TOUR:1"]);
          // Redescendre : il franchit de nouveau P (après B, occupé) → après C ; puis — story 7.1, D-442 —
          // en tête du Circuit (proposée), puis après X.
          fireEvent(pointChip("Q"), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
          expect(pointsOf()).toEqual(["P:BEFORE_TOUR:2", "Q:BEFORE_TOUR:3"]);
          fireEvent(pointChip("Q"), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
          expect(pointsOf()).toEqual(["P:BEFORE_TOUR:2", "Q:IN_TOUR:0"]);
          fireEvent(pointChip("Q"), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
          expect(pointsOf()).toEqual(["P:BEFORE_TOUR:2", "Q:IN_TOUR:1"]);
        });

        it("« Monter » / « Descendre » d'une carte : échange avec l'élément voisin, point compris (stepOccurrence) ; absent en début de Séance", () => {
          renderRail([...before(["W", "A", "B"]), circuitX()], {
            stopPoints: [{ id: "P", scope: "BEFORE_TOUR", position: 2 }],
          });
          const cardActions = (id: string) =>
            ((screen.getByTestId(`composition-exercise-row-${id}`).props.accessibilityActions ?? []) as { name: string }[]).map(
              (action) => action.name,
            );
          // W monter : début de la Séance → absent.
          expect(cardActions("W")).not.toContain("moveUp");
          fireEvent(screen.getByTestId("composition-exercise-row-A"), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
          // A descend d'un élément : elle passe après P, qui ne bouge pas → [W, P, A, B].
          expect(order()).toEqual(["W:BEFORE_TOUR", "A:BEFORE_TOUR", "B:BEFORE_TOUR", "X:IN_TOUR"]);
          expect(pointsOf()).toEqual(["P:BEFORE_TOUR:1"]);
        });

        it("story 7.5 (D-442 amendée) — [A, P, B] : supprimer A est appliqué après le fondu et le glissement ; P retiré, sans message visuel", () => {
          const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
          try {
            renderRail([...before(["A", "B"]), circuitX()], { stopPoints: [{ id: "P", scope: "BEFORE_TOUR", position: 1 }] });
            const draftBefore = probe.draft;
            fireEvent(screen.getByTestId("composition-exercise-row-A"), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
            // Fondu en cours : rien n'est encore écrit, la carte s'efface.
            expect(probe.draft).toBe(draftBefore);
            expect(StyleSheet.flatten(screen.getByTestId("composition-activity-A", { includeHiddenElements: true }).props.style).opacity).toBe(1);
            frames(4);
            const fading = StyleSheet.flatten(screen.getByTestId("composition-activity-A", { includeHiddenElements: true }).props.style).opacity as number;
            expect(fading).toBeLessThan(1);
            expect(fading).toBeGreaterThan(0);
            // Fondu et glissement (chevauchés), rendus appliqués à la sortie de chaque `act`.
            frames(12);
            frames(30);
            expect(order()).toEqual(["B:BEFORE_TOUR", "X:IN_TOUR"]);
            expect(pointsOf()).toEqual([]);
            expect(announce).toHaveBeenCalledWith(composition.stopPointsRemovedAnnouncement.singular);
            expect(screen.queryByTestId("composition-activity-actions-A")).toBeNull();
          } finally {
            announce.mockRestore();
          }
        });

        it("Dupliquer ne copie pas le point (arbitrage du 22/10) : [A, P, B] → [A, A′, P, B]", () => {
          renderRail([...before(["A", "B"]), circuitX()], { stopPoints: [{ id: "P", scope: "BEFORE_TOUR", position: 1 }] });
          fireEvent(screen.getByTestId("composition-exercise-row-A"), "accessibilityAction", { nativeEvent: { actionName: "duplicate" } });
          expect(order()).toEqual(["A:BEFORE_TOUR", "generated-copy-id:BEFORE_TOUR", "B:BEFORE_TOUR", "X:IN_TOUR"]);
          expect(pointsOf()).toEqual(["P:BEFORE_TOUR:2"]);
        });
        it("story 7.5 — points consécutifs : [A, P, B, Q, C], supprimer B → B supprimée, Q retiré, P conservé ; les suivantes glissent", () => {
          renderRail([...before(["A", "B", "C"]), circuitX()], {
            stopPoints: [
              { id: "P", scope: "BEFORE_TOUR", position: 1 },
              { id: "Q", scope: "BEFORE_TOUR", position: 2 },
            ],
          });
          fireEvent(screen.getByTestId("composition-exercise-row-B"), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
          // Story 7.6, 7.7 : fondu en cours (450 ms), rien ne glisse encore avant 200 ms.
          frames(5);
          const fadingB = StyleSheet.flatten(screen.getByTestId("composition-activity-B", { includeHiddenElements: true }).props.style).opacity as number;
          expect(fadingB).toBeLessThan(1);
          expect(fadingB).toBeGreaterThan(0);
          expect(StyleSheet.flatten(screen.getByTestId("composition-stop-point-row-Q", { includeHiddenElements: true }).props.style).opacity).toBe(fadingB);
          expect(rowShift("C")).toBe(0);
          // Le glissement commence pendant le fondu (chevauchement) : C, le Circuit et la suite
          // remontent ; rien n'est encore écrit.
          frames(8);
          frames(4);
          expect(rowShift("C")).toBeLessThan(0);
          // Fin du fondu (450 ms) passée, glissement en cours (fin vers 520 ms) : rien n'est encore écrit.
          frames(12);
          expect(order()).toEqual(["A:BEFORE_TOUR", "B:BEFORE_TOUR", "C:BEFORE_TOUR", "X:IN_TOUR"]);
          expect(translateY("composition-tour-section-surface-top")).toBeLessThan(0);
          expect(order()).toEqual(["A:BEFORE_TOUR", "B:BEFORE_TOUR", "C:BEFORE_TOUR", "X:IN_TOUR"]);
          frames(40);
          expect(order()).toEqual(["A:BEFORE_TOUR", "C:BEFORE_TOUR", "X:IN_TOUR"]);
          expect(pointsOf()).toEqual(["P:BEFORE_TOUR:1"]);
          expect(rowShift("C")).toBe(0);
          expect(translateY("composition-tour-section-surface-top")).toBe(0);
        });

        it("D-442 — carte glissée qui laisserait un point juste après le Compte à rebours : appliqué, le point retiré", () => {
          const elements = renderRail([...before(["A", "B"]), circuitX()], {
            stopPoints: [{ id: "P", scope: "BEFORE_TOUR", position: 1 }],
          });
          const dy = centerOf(elements, "B") + 10 - centerOf(elements, "A");
          lift("A");
          moveTo("A", dy);
          settle();
          release("A", dy);
          expect(order()).toEqual(["B:BEFORE_TOUR", "A:BEFORE_TOUR", "X:IN_TOUR"]);
          expect(pointsOf()).toEqual([]);
          settle();
          expect(rowShift("A")).toBe(0);
          expectRailJoined(layOut(), null);
        });

        it("story 7.2 — point déposé en tête d'un Circuit répété face à une fin de Tour : choix demandé, point tenu ; Annuler : rien ; « Fin de tour » : le point déplacé est retiré", () => {
          const alert = tourChoiceAlert();
          try {
            const elements = renderRail([...before(["A"]), circuitX(), anActivity("Y", "IN_TOUR", { name: "Fentes" })], {
              tourRepeatCount: 2,
              stopPoints: [
                { id: "P", scope: "BEFORE_TOUR", position: 1 },
                { id: "T", scope: "IN_TOUR", position: 2 },
              ],
            });
            const dy = centerOf(elements, "X") - 10 - centerOf(elements, "stop:P");
            liftPoint("P");
            movePoint("P", dy);
            settle();
            releasePoint("P", dy);
            expect(alert).toHaveBeenCalledTimes(1);
            expect(pointsOf()).toEqual(["P:BEFORE_TOUR:1", "T:IN_TOUR:2"]);
            // Tenu là où il a été lâché pendant le dialogue.
            frames(6);
            expect(translateY("composition-stop-point-row-P")).toBe(dy);
            answerTourChoice(alert, composition.tourBoundaryChoice.cancel);
            expect(pointsOf()).toEqual(["P:BEFORE_TOUR:1", "T:IN_TOUR:2"]);
            settle();
            expectRailJoined(layOut(), null);

            const again = layOut();
            const dy2 = centerOf(again, "X") - 10 - centerOf(again, "stop:P");
            liftPoint("P");
            movePoint("P", dy2);
            settle();
            releasePoint("P", dy2);
            expect(alert).toHaveBeenCalledTimes(2);
            answerTourChoice(alert, composition.tourBoundaryChoice.tail);
            expect(pointsOf()).toEqual(["T:IN_TOUR:2"]);
            settle();
            expectRailJoined(layOut(), null);
          } finally {
            alert.mockRestore();
          }
        });

        it("story 7.2 — même dépose, « Début de tour » : le point est déplacé en tête du Circuit, le point de fin retiré et annoncé", async () => {
          const alert = tourChoiceAlert();
          const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
          try {
            const elements = renderRail([...before(["A"]), circuitX(), anActivity("Y", "IN_TOUR", { name: "Fentes" })], {
              tourRepeatCount: 2,
              stopPoints: [
                { id: "P", scope: "BEFORE_TOUR", position: 1 },
                { id: "T", scope: "IN_TOUR", position: 2 },
              ],
            });
            const dy = centerOf(elements, "X") - 10 - centerOf(elements, "stop:P");
            liftPoint("P");
            movePoint("P", dy);
            settle();
            releasePoint("P", dy);
            answerTourChoice(alert, composition.tourBoundaryChoice.head);
            expect(pointsOf()).toEqual(["P:IN_TOUR:0"]);
            await waitFor(() => expect(announce).toHaveBeenCalledWith(composition.stopPointsRemovedAnnouncement.singular));
            settle();
            expectRailJoined(layOut(), null);
          } finally {
            alert.mockRestore();
            announce.mockRestore();
          }
        });

        it("R2 entre zones — D-442 : en tête du Circuit, accepté ; « après le Circuit » : accepté (première rangée de la zone d'après)", () => {
          let elements = renderRail([...before(["A", "B"]), circuitX(), anActivity("Z", "AFTER_TOUR", { name: "Ex Z" })], {
            stopPoints: [{ id: "P", scope: "BEFORE_TOUR", position: 1 }],
          });
          // Juste au-dessus du milieu de X : tête du Circuit.
          let dy = centerOf(elements, "X") - 10 - centerOf(elements, "stop:P");
          liftPoint("P");
          movePoint("P", dy);
          settle();
          releasePoint("P", dy);
          expect(pointsOf()).toEqual(["P:IN_TOUR:0"]);
          settle();
          // Juste au-dessus du milieu de Z : après le Circuit, avant Z.
          elements = layOut();
          dy = centerOf(elements, "Z") - 10 - centerOf(elements, "stop:P");
          liftPoint("P");
          movePoint("P", dy);
          settle();
          expectRailJoined(elements, "stop:P");
          releasePoint("P", dy);
          expect(pointsOf()).toEqual(["P:AFTER_TOUR:0"]);
          expect(within(screen.getByTestId("composition-zone-after-tour")).getByTestId("composition-stop-point-row-P")).toBeTruthy();
          expect(pointChip("P").props.accessibilityLabel).toBe(composition.placement.existingStopPointAfterCircuitAccessibilityLabel);
          expectRailJoined(layOut(), null);
        });

        it("RM-251 entre portées : un point déposé « après le Circuit » quand un autre termine le Circuit est refusé", () => {
          const elements = renderRail([...before(["A"]), circuitX(), anActivity("Z", "AFTER_TOUR", { name: "Ex Z" })], {
            stopPoints: [
              { id: "P", scope: "BEFORE_TOUR", position: 1 },
              { id: "Q", scope: "IN_TOUR", position: 1 },
            ],
          });
          const draftBefore = probe.draft;
          const dy = centerOf(elements, "Z") - 10 - centerOf(elements, "stop:P");
          liftPoint("P");
          movePoint("P", dy);
          settle();
          releasePoint("P", dy);
          expect(probe.draft!.stopPoints).toBe(draftBefore!.stopPoints);
        });

        it("« Descendre » absent quand le seul emplacement suivant précède la Fin", () => {
          renderRail([...before(["A"]), circuitX(), anActivity("Z", "AFTER_TOUR", { name: "Ex Z" })], {
            stopPoints: [{ id: "P", scope: "AFTER_TOUR", position: 0 }],
          });
          expect(pointActions("P")).toEqual(["moveUp"]);
        });

        it("toucher court et balayage sur la puce : aucun effet", () => {
          renderRail([...before(["A", "B"]), circuitX()], { stopPoints: [{ id: "P", scope: "BEFORE_TOUR", position: 1 }] });
          const draftBefore = probe.draft;
          fireEvent.press(pointChip("P"));
          fireEvent(pointRow("P"), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
          movePoint("P", 0);
          fireEvent(pointRow("P"), "responderMove", { nativeEvent: { pageX: 60, pageY: 100 } });
          releasePoint("P", 0);
          expect(probe.draft).toBe(draftBefore);
          expect(translateY("composition-stop-point-P")).toBe(0);
          expect(transformOf("composition-stop-point-P").some((entry) => (entry.translateX ?? 0) !== 0)).toBe(false);
          expect(screen.getByTestId("composition-body").props.scrollEnabled).toBe(true);
          expect(screen.queryByTestId(/^composition-activity-actions-/u)).toBeNull();
        });

        it("soulèvement refusé : rangée non mesurée, ou mesurée dans une autre zone (montée ailleurs depuis)", () => {
          renderRail([...before(["A", "B"]), circuitX()]);
          // B descend dans le Circuit (Monter / Descendre) : sa rangée remonte dans une autre liste,
          // non encore mesurée — l'ancienne mesure est celle de la zone d'avant.
          fireEvent(screen.getByTestId("composition-exercise-row-B"), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
          expect(order()).toEqual(["A:BEFORE_TOUR", "B:IN_TOUR", "X:IN_TOUR"]);
          lift("A");
          expect(screen.getByTestId("composition-body").props.scrollEnabled).toBe(true);
          expect(screen.getByTestId("composition-exercise-row-A").props.accessibilityState).toMatchObject({ selected: false });
          // Une fois mesurée, le soulèvement est accepté.
          layOut();
          lift("A");
          expect(screen.getByTestId("composition-body").props.scrollEnabled).toBe(false);
        });

        it("multitouche : un second appui long est ignoré ; le dépôt attend le dernier doigt levé ; toucher annulé = plus d'origine", () => {
          const elements = renderRail([...before(["A", "B", "C"]), circuitX()], {
            stopPoints: [{ id: "P", scope: "BEFORE_TOUR", position: 2 }],
          });
          const dy = centerOf(elements, "C") + 10 - centerOf(elements, "A");
          lift("A");
          // Second doigt sur B, puis sur le point : ignorés, A reste seul soulevé.
          lift("B");
          liftPoint("P");
          expect(screen.getByTestId("composition-exercise-row-B").props.accessibilityState).toMatchObject({ selected: false });
          expect(StyleSheet.flatten(pointRow("P").props.style).zIndex).toBeUndefined();
          moveTo("A", dy);
          // Un doigt se lève, l'autre reste : rien n'est déposé.
          fireEvent(container("A"), "touchEnd", { nativeEvent: { pageX: 200, pageY: 100 + dy, touches: [{}] } });
          expect(screen.getByTestId("composition-exercise-row-A").props.accessibilityState).toMatchObject({ selected: true });
          release("A", dy);
          expect(order()).toEqual(["B:BEFORE_TOUR", "C:BEFORE_TOUR", "A:BEFORE_TOUR", "X:IN_TOUR"]);
          // Point : toucher annulé par le système, puis appui long → aucun soulèvement.
          settle();
          layOut();
          fireEvent(pointRow("P"), "touchStart", { nativeEvent: { pageX: 200, pageY: 100 } });
          fireEvent(pointRow("P"), "touchCancel", {});
          fireEvent(pointChip("P"), "longPress");
          expect(screen.getByTestId("composition-body").props.scrollEnabled).toBe(true);
        });
        it("VoiceOver : après un pas qui change de zone, le focus suit l'élément (point, carte) à l'image suivante", () => {
          const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
          try {
            renderRail([...before(["A", "B"]), circuitX(), anActivity("Z", "AFTER_TOUR", { name: "Ex Z" })], {
              stopPoints: [{ id: "P", scope: "BEFORE_TOUR", position: 1 }],
            });
            const targets = () => focus.mock.calls.map(([target]) => (target as unknown as { props: { testID?: string } }).props.testID);
            // Images en attente des tests précédents écoulées.
            frames(1);
            focus.mockClear();
            // P descend : après B, même zone — aucun focus forcé.
            fireEvent(pointChip("P"), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
            frames(1);
            expect(targets()).toEqual([]);
            // Puis — story 7.1, D-442 — il descend en tête du Circuit : autre liste, le focus le suit.
            fireEvent(pointChip("P"), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
            expect(pointsOf()).toEqual(["P:IN_TOUR:0"]);
            frames(1);
            expect(targets()).toEqual(["composition-stop-point-P-chip"]);
            // Une carte qui change de zone : B descend en tête du Circuit.
            focus.mockClear();
            fireEvent(screen.getByTestId("composition-exercise-row-B"), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
            expect(order()).toEqual(["A:BEFORE_TOUR", "B:IN_TOUR", "X:IN_TOUR", "Z:AFTER_TOUR"]);
            frames(1);
            expect(targets()).toEqual(["composition-exercise-row-B"]);
          } finally {
            focus.mockRestore();
          }
        });

        it("bornes : le Compte à rebours suivi d'un point (tête de séquence héritée) réduit sa marge tactile basse de la marge de la puce", () => {
          renderRail([...before(["A"]), circuitX()]);
          const countdown = () => StyleSheet.flatten(screen.getByLabelText(composition.countdown.label).props.style);
          const without = -(countdown().marginBottom as number);
          screen.unmount();
          renderRail([...before(["A"]), circuitX()], { stopPoints: [{ id: "P", scope: "BEFORE_TOUR", position: 0 }] });
          const withPoint = -(countdown().marginBottom as number);
          const chipSlop = -(StyleSheet.flatten(pointChip("P").props.style).marginVertical as number);
          expect(withPoint).toBe(Math.min(without, 8 - chipSlop));
          expect(withPoint + chipSlop).toBeLessThanOrEqual(8);
        });

        it("nom du point : le dernier séparateur (Exercice) qui le précède ; des homonymes sont distingués par « n sur m »", () => {
          renderRail(
            [
              anActivity("A", "BEFORE_TOUR", { name: "Squat" }),
              anActivity("R", "BEFORE_TOUR", { name: "Pause", type: "RECOVERY" }),
              anActivity("B", "BEFORE_TOUR", { name: "Squat" }),
              anActivity("C", "BEFORE_TOUR", { name: "Gainage" }),
              circuitX(),
            ],
            {
              stopPoints: [
                { id: "P", scope: "BEFORE_TOUR", position: 2 },
                { id: "Q", scope: "BEFORE_TOUR", position: 4 },
              ],
            },
          );
          const label = (exercise: string) => composition.placement.existingStopPointAccessibilityLabel.replace("{exercise}", exercise);
          // P suit R (ancienne Récupération autonome, pas un séparateur) : nommé d'après A, 1 sur 4.
          expect(pointChip("P").props.accessibilityLabel).toBe(`${label("Squat")}, 1 sur 4`);
          // Q suit C, sans homonyme.
          expect(pointChip("Q").props.accessibilityLabel).toBe(label("Gainage"));
        });
        it("position héritée hors bornes : ramenée à l'emplacement affiché — déposée sur place, rien d'écrit ; « Monter » part de là", () => {
          renderRail([...before(["A", "B"]), circuitX()], {
            stopPoints: [{ id: "P", scope: "BEFORE_TOUR", position: 99 }],
          });
          const draftBefore = probe.draft;
          // Affiché en fin de zone (après B) ; glissé d'un rien puis déposé : même emplacement affiché.
          expect(testIdOrder(screen.toJSON(), ["composition-activity-B", "composition-stop-point-row-P"])).toEqual([
            "composition-activity-B",
            "composition-stop-point-row-P",
          ]);
          liftPoint("P");
          movePoint("P", 3);
          settle();
          releasePoint("P", 3);
          expect(probe.draft).toBe(draftBefore);
          settle();
          fireEvent(pointChip("P"), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
          expect(pointsOf()).toEqual(["P:BEFORE_TOUR:1"]);
        });
      });

      it("entrée en placement pendant un retour : la session se termine aussitôt, translations à 0", () => {
        const elements = renderRail([
          anActivity("A", "BEFORE_TOUR", { name: "Gainage" }),
          anActivity("B", "BEFORE_TOUR", { name: "Squats" }),
          anActivity("X", "IN_TOUR", { name: "Pompes" }),
        ]);
        const dy = centerOf(elements, "B") + 10 - centerOf(elements, "A");
        lift("A");
        moveTo("A", dy);
        settle();
        fireEvent(container("A"), "responderTerminate", {});
        frames(3);
        expect(rowShift("A")).toBeGreaterThan(0);
        fireEvent.press(screen.getByTestId("composition-add-stop-action"));
        expect(rowShift("A")).toBe(0);
        expect(rowShift("B")).toBe(0);
        expectBackInChain("A");
        expect(zIndexOf("composition-activity-A")).toBeUndefined();
      });
    });

    /**
     * PRE-6 story 5.2b : plusieurs déplacements successifs dans le Circuit sans quitter l'écran —
     * Circuit [P, Q, R] : P en dernier, puis R en premier. Géométrie injectée : cartes de 70 à
     * l'écart 9 du Circuit (liste à 60 dans le conteneur, à 230), re-mesurées après chaque dépôt.
     */
    it("déplacements successifs dans le Circuit : rail continu pendant chaque geste, au repos après chaque dépôt", () => {
      render(
        <TestSafeAreaProvider>
          <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService()}>
            <ReferentialServiceContext.Provider value={fakeReferentialService()}>
              <StatefulDraftWrapper
                initialExercises={[
                  anActivity("P", "IN_TOUR", { name: "Pompes" }),
                  anActivity("Q", "IN_TOUR", { name: "Squats" }),
                  anActivity("R", "IN_TOUR", { name: "Fentes" }),
                ]}
              >
                <CompositionScreen />
                <DraftProbe />
              </StatefulDraftWrapper>
            </ReferentialServiceContext.Provider>
          </ActivityDefinitionServiceContext.Provider>
        </TestSafeAreaProvider>,
      );
      const layOutCircuit = (ids: readonly string[]) => {
        fireLayout(screen.getByTestId("composition-tour-section"), 230, 60 + 3 * 70 + 2 * CIRCUIT_GAP + 8);
        fireLayout(screen.getByTestId("composition-zone-in-tour"), 60, 3 * 70 + 2 * CIRCUIT_GAP);
        ids.forEach((id, index) => fireLayout(container(id), index * CIRCUIT_PITCH, 70));
      };
      const IN_CIRCUIT_REST = CIRCUIT_GAP + OCCURRENCE_CARD_MEDIA.top;
      /** Au repos : chaque carte reliée à la précédente (écart 9 + ancre 8), échelle 1, aucun décalage. */
      const expectRest = (ids: readonly string[]) => {
        expect(order()).toEqual(ids.map((id) => `${id}:IN_TOUR`));
        for (const id of ids) {
          expect(rowShift(id)).toBe(0);
          expect(linkHeight(`composition-rail-link-${id}`)).toBe(IN_CIRCUIT_REST);
          expect(scaleY(`composition-rail-link-${id}`)).toBe(1);
          expect(translateY(`composition-rail-link-${id}`)).toBe(0);
        }
        expect(linkHeight("composition-rail-link-circuit-end")).toBe(OCCURRENCE_CARD_HEIGHT - OCCURRENCE_CARD_MEDIA.bottom);
        expect(scaleY("composition-rail-link-circuit-end")).toBe(1);
        expect(translateY("composition-tour-section-surface-top")).toBe(0);
        expect(translateY("composition-tour-section-surface-bottom")).toBe(0);
      };
      /** Haut visible du lien d'une carte = bas visible de la carte qui la précède (repère de la liste). */
      const expectJoined = (id: string, layoutTop: number, previous: { id: string; layoutTop: number }) => {
        const top = layoutTop + OCCURRENCE_CARD_MEDIA.top + rowShift(id) - visible(`composition-rail-link-${id}`);
        expect(top).toBeCloseTo(previous.layoutTop + 70 + rowShift(previous.id), 6);
      };

      layOutCircuit(["P", "Q", "R"]);
      expectRest(["P", "Q", "R"]);

      // 1. P en dernier : Q et R remontent d'un pas ; Q se relie à l'en-tête à travers la place de P.
      lift("P");
      moveTo("P", 200);
      settle();
      expect(screen.queryByTestId("composition-rail-link-P", hidden)).toBeNull();
      expect(rowShift("Q")).toBe(-CIRCUIT_PITCH);
      expect(linkHeight("composition-rail-link-Q")).toBe(CIRCUIT_GAP + 70 + IN_CIRCUIT_REST);
      expect(visible("composition-rail-link-Q")).toBeCloseTo(IN_CIRCUIT_REST, 6);
      expectJoined("R", CIRCUIT_PITCH * 2, { id: "Q", layoutTop: CIRCUIT_PITCH });
      // Le bas du Circuit traverse l'emplacement ouvert sous R.
      expect(visible("composition-rail-link-circuit-end")).toBeCloseTo(OCCURRENCE_CARD_HEIGHT - OCCURRENCE_CARD_MEDIA.bottom + CIRCUIT_PITCH, 6);
      release("P", 200);
      // Story 7.6 : P part de l'endroit du lâcher et glisse jusqu'à sa place.
      expect(rowShift("P")).toBeGreaterThan(0);
      settle();
      expectRest(["Q", "R", "P"]);
      layOutCircuit(["Q", "R", "P"]);
      expectRest(["Q", "R", "P"]);

      // 2. R (désormais au milieu) en premier : Q descend d'un pas, P ne bouge pas.
      lift("R");
      moveTo("R", -100);
      settle();
      expect(screen.queryByTestId("composition-rail-link-R", hidden)).toBeNull();
      expect(rowShift("Q")).toBe(CIRCUIT_PITCH);
      expect(rowShift("P")).toBe(0);
      // Q traverse l'emplacement ouvert au-dessus d'elle ; P se relie à Q à travers la place de R.
      expect(visible("composition-rail-link-Q")).toBeCloseTo(IN_CIRCUIT_REST + CIRCUIT_PITCH, 6);
      expect(linkHeight("composition-rail-link-P")).toBe(CIRCUIT_GAP + 70 + IN_CIRCUIT_REST);
      expectJoined("P", CIRCUIT_PITCH * 2, { id: "Q", layoutTop: 0 });
      release("R", -100);
      settle();
      expectRest(["R", "Q", "P"]);
      layOutCircuit(["R", "Q", "P"]);
      expectRest(["R", "Q", "P"]);
    });

    it("dépôt appliqué : l'occurrence reprend sa place dans le rail à la fin de sa mise en place (story 7.6)", () => {
      renderLaidOut();
      lift("A");
      moveTo("A", 100);
      settle();
      release("A", 100);
      // Story 7.6 : pendant qu'elle glisse jusqu'à sa place, elle reste hors de la chaîne.
      expect(screen.queryByTestId("composition-rail-link-A", hidden)).toBeNull();
      settle();
      expect(screen.getByTestId("composition-rail-link-A", hidden)).toBeTruthy();
    });
  });
});

/**
 * PRE-6 story 5.2 (D-435, CE-T03-08 ch13 L1478-L1480, Figma Standard `8328:28605`) : rail segmenté,
 * Circuit, bornes et points d'arrêt — matrice de la spec (rendu au repos).
 */
describe("CompositionScreen — rail segmenté, Circuit, bornes et points d'arrêt (PRE-6 story 5.2)", () => {
  const hidden = { includeHiddenElements: true };
  const styleOf = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID, hidden).props.style);
  /** Haut et bas d'un lien au repos, dans le repère de son élément. */
  const span = (testID: string) => {
    const style = styleOf(testID);
    return { top: style.top as number | undefined, height: style.height as number, bottom: style.bottom as number | undefined };
  };

  // PRE-9 B.2 — D-451, COMP §1 (« une Séance commence sans Circuit ») : remplace « séquence vide :
  // Compte à rebours → anneau du Circuit vide → bas du Circuit → Fin ».
  it("séquence vide : Compte à rebours → Fin, sans Circuit ni aucun repère d'occurrence", () => {
    renderScreen();
    // Compte à rebours : queue du bas de l'anneau (12 + 5) au bas de la rangée de 27.
    expect(styleOf("composition-boundary-countdown-rail-tail")).toMatchObject({ top: 17, height: 10, width: 1.5, left: 32 - 0.75 });
    // Aucun Circuit : ni anneau, ni lien d'en-tête, ni bas de Circuit.
    expect(screen.queryByTestId("composition-sequence-marker-circuit", hidden)).toBeNull();
    expect(screen.queryByTestId("composition-rail-link-circuit-header", hidden)).toBeNull();
    expect(screen.queryByTestId("composition-rail-link-circuit-end", hidden)).toBeNull();
    // Fin : 8 + 7, jusqu'au haut de son anneau, depuis le bas du Compte à rebours.
    expect(span("composition-rail-link-end")).toMatchObject({ top: 7 - 15, height: 15 });
    expect(screen.queryByTestId(/^composition-rail-link-(?!end)/u, hidden)).toBeNull();
  });

  it("une carte avant, dans et après le Circuit : chaque lien rejoint le bord bas de l'élément précédent", () => {
    renderScreenWithDraft([
      anActivity("b", "BEFORE_TOUR", { name: "Gainage" }),
      anActivity("i", "IN_TOUR", { name: "Pompes" }),
      anActivity("a", "AFTER_TOUR", { name: "Fentes" }),
    ]);
    // D-511 (08/11/2026) : écart 8 + haut du média 4 ; dans le Circuit : écart 9 + 4. [8 + 8 et 9 + 8 — remplacés.]
    expect(span("composition-rail-link-b").height).toBe(12);
    expect(span("composition-rail-link-i").height).toBe(13);
    expect(span("composition-rail-link-a").height).toBe(12);
    // Recette du 29/10 : 8 + 14 + 4 (anneau centré sur la ligne d'en-tête de 18, au lieu de 15 sur 40).
    expect(span("composition-rail-link-circuit-header").height).toBe(26);
    // Contre-recette du 30/10 (obs-3) : marge basse sous la carte = bas du média → bas de la carte (4 depuis D-511).
    expect(span("composition-rail-link-circuit-end").height).toBe(4);
    expect(span("composition-rail-link-end").height).toBe(15);
    // La queue de chaque carte part du bas du média (68) et descend jusqu'au bas du bloc.
    for (const id of ["b", "i", "a"]) {
      expect(styleOf(`composition-rail-tail-${id}`)).toMatchObject({ top: 68, bottom: 0 });
    }
    // Circuit : écart 9 entre l'en-tête et les cartes, cartes du Circuit sur l'aplat du Circuit.
    expect(styleOf("composition-zone-in-tour")).toMatchObject({ gap: 9, marginHorizontal: -4 });
    expect(styleOf("composition-tour-section")).toMatchObject({ paddingVertical: 14, gap: 9 });
  });

  it("point d'arrêt après A : rangée autonome de 22 à 8 sous la carte, point de raccord sur le rail (story 6.2 : nœud du rail)", () => {
    renderScreenWithDraft([anActivity("A", "BEFORE_TOUR", { name: "Gainage" }), anActivity("B", "BEFORE_TOUR", { name: "Squats" })], {
      stopPoints: [{ id: "p1", scope: "BEFORE_TOUR", position: 1 }],
    });
    expect(styleOf("composition-zone-before-tour").gap).toBe(8);
    expect(styleOf("composition-stop-point-p1")).toMatchObject({ height: 22, justifyContent: "center" });
    // Point de 6 au centre de la rangée (11), sur l'axe du média (36 dans la carte depuis D-511 ; toujours x 56 à 402).
    expect(styleOf("composition-rail-dot-stop-p1")).toMatchObject({
      width: 6,
      height: 6,
      borderRadius: 3,
      top: 11 - 3,
      left: 36 - 3,
      backgroundColor: TEXT_TERTIARY,
    });
    // La queue de A s'arrête au bas de la carte ; le lien du point remonte l'écart (8) jusqu'à A ;
    // celui de B remonte l'écart jusqu'au bas de la rangée du point ; la queue du point la traverse.
    expect(styleOf("composition-rail-tail-A")).toMatchObject({ top: 68, bottom: 0 });
    expect(span("composition-rail-link-stop-p1")).toMatchObject({ top: -8, height: 8 });
    expect(styleOf("composition-rail-tail-stop-p1")).toMatchObject({ top: 0, bottom: 0 });
    expect(span("composition-rail-link-B").height).toBe(12);
    expect(screen.queryByTestId("composition-rail-dot-A", hidden)).toBeNull();
    // Cible tactile de la puce limitée à l'écart (4 ≤ 8) : elle ne chevauche aucune carte. Revue 5.3 :
    // boîte réelle de 30 (marges négatives de 4 : la rangée garde 22).
    const chip = StyleSheet.flatten(screen.getByTestId("composition-stop-point-p1-chip").props.style);
    expect(chip).toMatchObject({ height: 30, marginVertical: -4 });
    expect(-(chip.marginVertical as number)).toBeLessThanOrEqual(8);
  });

  it("point après le Circuit (story 6.2 : première rangée de la zone après le Circuit) : reliée au bas du Circuit, la suite reliée à elle", () => {
    renderScreenWithDraft([anActivity("i", "IN_TOUR", { name: "Pompes" }), anActivity("a", "AFTER_TOUR", { name: "Fentes" })], {
      stopPoints: [{ id: "pc", scope: "AFTER_TOUR", position: 0 }],
    });
    expect(within(screen.getByTestId("composition-zone-after-tour")).getByTestId("composition-stop-point-pc")).toBeTruthy();
    expect(styleOf("composition-stop-point-pc")).toMatchObject({ height: 22, justifyContent: "center" });
    // Lien jusqu'au bas du Circuit : l'écart de la séquence (8), ancre au haut de la rangée.
    expect(span("composition-rail-link-stop-pc")).toMatchObject({ top: -8, height: 8 });
    expect(styleOf("composition-rail-tail-stop-pc")).toMatchObject({ top: 0, bottom: 0, left: 36 - 0.75 });
    expect(styleOf("composition-rail-dot-stop-pc")).toMatchObject({ top: 11 - 3, left: 36 - 3 });
    expect(span("composition-rail-link-a").height).toBe(12);
  });

  // D-511 (08/11/2026, écran `11789:21914`) : cartes à 4 (362 à x 20), Circuit toujours à 16. [Cartes à 8 — remplacé.]
  it("largeurs : cartes à 4 et Circuit à 16 de part et d'autre de la colonne (marges constantes, aucune largeur codée)", () => {
    renderScreenWithDraft([anActivity("b", "BEFORE_TOUR", { name: "Gainage" }), anActivity("i", "IN_TOUR", { name: "Pompes" })]);
    expect(styleOf("composition-zone-before-tour").marginHorizontal).toBe(-4);
    expect(styleOf("composition-zone-before-tour").width).toBeUndefined();
    expect(styleOf("composition-tour-section")).toMatchObject({ marginHorizontal: -16, paddingHorizontal: 16 });
    expect(styleOf("composition-tour-section").width).toBeUndefined();
    for (const id of ["b", "i"]) {
      expect(styleOf(`composition-exercise-row-${id}`).width).toBeUndefined();
      expect(styleOf(`composition-activity-${id}`).width).toBeUndefined();
    }
  });

  it("bornes : anneau (cercle de 10, contour extérieur 1,5 `#7A7A80`, fond blanc) sur l'axe, libellé Medium 14 `#46464C` à 45 de la colonne", () => {
    renderScreen();
    for (const boundary of ["composition-boundary-countdown", "composition-boundary-final-phase"]) {
      expect(styleOf(`${boundary}-rail-ring`)).toMatchObject({
        width: 13,
        height: 13,
        borderRadius: 6.5,
        borderWidth: 1.5,
        borderColor: TEXT_TERTIARY,
        backgroundColor: colors.background,
        left: 32 - 6.5,
        top: 12 - 6.5,
      });
      // Colonne de l'anneau (32 + 5) puis écart 8 : libellé à 45 de la colonne (x 69 à 402).
      expect(styleOf(`${boundary}-ring-column`).width).toBe(37);
      expect(styleOf(boundary).gap).toBe(8);
    }
    const label = within(screen.getByTestId("composition-boundary-countdown")).getByText(composition.countdown.label);
    expect(StyleSheet.flatten(label.props.style)).toMatchObject({
      fontFamily: type.label.fontFamily,
      fontSize: 14,
      fontWeight: "500",
      color: "#46464C",
    });
  });

  // Revue 5.3 : les bornes ne sont plus atténuées en placement ; le rail reste hors du conteneur inactif.
  it("placement : le rail des bornes est hors du conteneur inactif (opacité uniforme du rail)", () => {
    renderScreen();
    for (const boundary of ["composition-boundary-countdown", "composition-boundary-final-phase"]) {
      const attenuation = screen.getByTestId(`${boundary}-placement`);
      expect(within(attenuation).queryByTestId(`${boundary}-rail-ring`, hidden)).toBeNull();
      expect(within(attenuation).queryByTestId(`${boundary}-rail-tail`, hidden)).toBeNull();
    }
    expect(within(screen.getByTestId("composition-boundary-final-phase-placement")).queryByTestId("composition-rail-link-end", hidden)).toBeNull();
  });

  // Revue 5.2 : zones tactiles disjointes entre l'en-tête du Circuit et sa première carte.
  it("l'en-tête du Circuit et sa première carte : cibles tactiles disjointes", () => {
    renderScreenWithDraft([anActivity("i", "IN_TOUR", { name: "Pompes" })]);
    const headerHeight = styleOf("composition-circuit-header").minHeight as number;
    // Story 5.1b : l'œil a quitté l'en-tête. PRE-9 B.1a (RM-027) : restent les cibles réelles de 44
    // du nom (repli), du nombre, de l'adjectif et, stepper révélé, du − et du +. Recette du 29/10 (ligne
    // de 18) : contenu centré sur la ligne, boîte de 44 décalée vers le haut (marge interne haute de 8),
    // bas de la boîte = centre de la ligne + (44 − 8) / 2 = 27, le haut de la première carte.
    expect(screen.queryByTestId("composition-circuit-header-volumes", hidden)).toBeNull();
    openCircuitStepper();
    const firstCardTop = headerHeight + (styleOf("composition-tour-section").gap as number);
    const boxBottom = (style: ReturnType<typeof styleOf>, height: number) =>
      headerHeight / 2 + (height - ((style.paddingTop as number | undefined) ?? 0)) / 2;
    for (const id of [
      "composition-circuit-header-counter-stepper-decrement",
      "composition-circuit-header-counter-stepper-increment",
      "composition-circuit-header-counter",
      "composition-circuit-header-collapse",
    ]) {
      expect(screen.getByTestId(id).props.hitSlop).toBeUndefined();
      const style = styleOf(id);
      const height = (style.height ?? style.minHeight) as number;
      expect(height).toBeGreaterThanOrEqual(44);
      expect(boxBottom(style, height)).toBeLessThanOrEqual(firstCardTop);
    }
    const adjectiveStyle = styleOf("composition-circuit-header-counter-adjective-target");
    const adjectiveBottom = boxBottom(adjectiveStyle, adjectiveStyle.minHeight as number);
    expect(adjectiveBottom).toBeLessThanOrEqual(firstCardTop);
  });

  // Revue 5.2 : la puce d'un point d'arrêt juste au-dessus de la Fin déborde de 4 dans l'écart ;
  // la marge haute de la Fin vaut alors l'écart moins ce débord.
  it.each([
    ["point après la dernière carte", [anActivity("a", "AFTER_TOUR", { name: "Fentes" })], { id: "pa", scope: "AFTER_TOUR" as const, position: 1 }],
    ["point après le Circuit, sans carte après", [anActivity("i", "IN_TOUR", { name: "Pompes" })], { id: "pc", scope: "AFTER_TOUR" as const, position: 0 }],
  ])("Fin de séance précédée d'une rangée de point (%s) : marges tactiles disjointes", (_case, exercises, stopPoint) => {
    renderScreenWithDraft(exercises, { stopPoints: [stopPoint] });
    const chips = screen.getAllByTestId(/^composition-stop-point-.*-chip$/u);
    expect(chips).toHaveLength(1);
    // Revue 5.3 : étendues lues sur les boîtes réelles (marges négatives).
    const chipBottomSlop = -(StyleSheet.flatten(chips[0]!.props.style).marginVertical as number);
    const fin = StyleSheet.flatten(screen.getByLabelText(composition.finalPhase.label).props.style);
    const finTop = -(fin.marginTop as number);
    expect(finTop).toBe(8 - chipBottomSlop);
    expect(chipBottomSlop + finTop).toBeLessThanOrEqual(8);
    expect(fin.height).toBe(44);
  });

  it("Fin de séance précédée d'une carte sans point : marge haute de l'écart (8)", () => {
    renderScreenWithDraft([anActivity("a", "AFTER_TOUR", { name: "Fentes" })]);
    expect(StyleSheet.flatten(screen.getByLabelText(composition.finalPhase.label).props.style).marginTop).toBe(-8);
  });

  it("aucun élément du rail n'est interactif ni exposé à l'accessibilité", () => {
    // PRE-9 B.2 — D-451, COMP §1 : un Exercice dans le Circuit, pour que son rail soit rendu.
    renderScreenWithDraft([anActivity("b", "BEFORE_TOUR", { name: "Gainage" }), anActivity("i", "IN_TOUR", { name: "Pompes" })], {
      stopPoints: [{ id: "p1", scope: "BEFORE_TOUR", position: 1 }],
    });
    for (const testID of [
      "composition-rail-link-b",
      "composition-rail-tail-b",
      "composition-rail-link-stop-p1",
      "composition-rail-tail-stop-p1",
      "composition-rail-dot-stop-p1",
      "composition-rail-link-circuit-header",
      "composition-sequence-marker-circuit",
      "composition-rail-link-end",
    ]) {
      const node = screen.getByTestId(testID, hidden);
      expect(node.props.pointerEvents).toBe("none");
      expect(node.props.importantForAccessibility).toBe("no-hide-descendants");
    }
  });
});

/**
 * PRE-6 story 5.1b (AC1, AC2 ; D3 remplacé par Hermann le 21/10/2026) : le premier média de
 * l'occurrence, transporté par le brouillon (ajout depuis le Catalogue, Séance relue, duplication),
 * arrive jusqu'au gabarit de la carte ; l'URI de stockage est résolue par le service des Exercices
 * (même résolution que le Catalogue). Le rendu photo / affiche / erreur est couvert par
 * `OccurrenceCardMedia.test.tsx`.
 */
describe("CompositionScreen — photo ou affiche vidéo dans le gabarit (PRE-6 story 5.1b)", () => {
  // PRE-6 story 7.7 : actions glissées animées (pilote JS, minuteurs simulés).
  swipeMotion();
  const photoMedia = (id: string) => [
    { assetId: `asset-${id}`, asset: { id: `asset-${id}`, uri: `kodjo-media/${id}.jpg`, createdAt: "now", kind: "PHOTO" as const } },
    { assetId: `asset-${id}-2`, asset: { id: `asset-${id}-2`, uri: `kodjo-media/${id}-2.mov`, createdAt: "now", kind: "VIDEO" as const } },
  ];
  const resolveMediaUri = jest.fn((uri: string) => `file:///documents/${uri}`);
  function renderWithMedia(exercises: readonly SessionDraftExercise[]) {
    return render(
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider
          value={fakeActivityDefinitionService({ resolveMediaUri } as Partial<ActivityDefinitionService>)}
        >
          <ReferentialServiceContext.Provider value={fakeReferentialService()}>
            <StatefulDraftWrapper initialExercises={exercises}>
              <CompositionScreen />
            </StatefulDraftWrapper>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
  }
  const hidden = { includeHiddenElements: true } as const;
  const imageOf = (id: string) =>
    within(screen.getByTestId(`composition-exercise-row-${id}`, hidden)).queryByTestId("composition-exercise-media-image", hidden);

  it("the first media of the occurrence fills the template (resolved URI; the card's name is the alternative text); without media, the generic icon", () => {
    renderWithMedia([
      anActivity("a", "BEFORE_TOUR", { name: "Squat assisté", media: photoMedia("a") }),
      anActivity("b", "IN_TOUR", { name: "Pompes" }),
    ]);
    const image = imageOf("a");
    expect(image).not.toBeNull();
    expect(image!.props.source).toEqual([expect.objectContaining({ uri: "file:///documents/kodjo-media/a.jpg" })]);
    expect(within(screen.getByTestId("composition-exercise-row-a")).queryByTestId("composition-exercise-media-icon", hidden)).toBeNull();
    expect(imageOf("b")).toBeNull();
    expect(within(screen.getByTestId("composition-exercise-row-b")).getByTestId("composition-exercise-media-icon", hidden)).toBeTruthy();
  });

  // [« the media is no target of its own: a touch opens the Exercise like the rest of the card » — remplacé par
  // la recette iPhone n° 2 du 31/10/2026 (constat c) : la photo porte son propre bouton, qui ouvre l'Exercice.]
  it("the photo button opens the Exercise; the long press lifts the card with its media", () => {
    renderWithMedia([anActivity("a", "BEFORE_TOUR", { name: "Squat assisté", media: photoMedia("a") })]);
    mockPush.mockClear();
    fireEvent.press(screen.getByTestId("composition-exercise-media-button-a"));
    expect(mockPush).toHaveBeenCalledTimes(1);
    measureDisplayedRows();
    fireEvent(screen.getByTestId("composition-exercise-row-a"), "longPress");
    // État soulevé réel (surface soulevée, défilement neutralisé) ; le média reste dans la carte qui
    // se déplace (même `Pressable`).
    expect(StyleSheet.flatten(screen.getByTestId("composition-exercise-row-a").props.style)).toMatchObject({
      backgroundColor: colors.exerciseContextBandBackground,
      borderColor: colors.compositionDraggedCardBorder,
    });
    expect(screen.getByTestId("composition-body").props.scrollEnabled).toBe(false);
    expect(imageOf("a")).not.toBeNull();
  });

  it("swipe: the media stays in the card that slides (actions revealed)", () => {
    renderWithMedia([anActivity("a", "BEFORE_TOUR", { name: "Squat assisté", media: photoMedia("a") })]);
    fireSwipeLeft("a");
    expect(screen.getByTestId("composition-activity-actions-a")).toBeTruthy();
    expect(imageOf("a")).not.toBeNull();
  });

  it("duplication: the copy shows the same first media", () => {
    renderWithMedia([anActivity("a", "BEFORE_TOUR", { name: "Squat assisté", media: photoMedia("a") })]);
    fireSwipeLeft("a");
    fireEvent.press(screen.getByTestId("composition-activity-duplicate-a"));
    const copy = imageOf("generated-copy-id");
    expect(copy).not.toBeNull();
    expect(copy!.props.source).toEqual([expect.objectContaining({ uri: "file:///documents/kodjo-media/a.jpg" })]);
  });

  it("placement (arbitrage D6): the media is greyed with the card content, the card stays inactive", () => {
    renderWithMedia([
      anActivity("a", "BEFORE_TOUR", { name: "Squat assisté", media: photoMedia("a") }),
      anActivity("b", "BEFORE_TOUR", { name: "Pompes" }),
    ]);
    const media = () => within(screen.getByTestId("composition-exercise-row-a", hidden)).getByTestId("composition-exercise-media", hidden);
    // 08/11/2026 : le grisé est porté par le contenu commun de la carte (`composition-exercise-card-content`).
    const content = () => within(screen.getByTestId("composition-exercise-row-a", hidden)).getByTestId("composition-exercise-card-content", hidden);
    expect(media()).toBeTruthy();
    expect(StyleSheet.flatten(content().props.style).opacity).toBeUndefined();
    fireEvent.press(screen.getByTestId("composition-add-stop-action"));
    expect(StyleSheet.flatten(content().props.style).opacity).toBe(0.45);
    expect(imageOf("a")).not.toBeNull();
    mockPush.mockClear();
    fireEvent.press(screen.getByTestId("composition-exercise-media-image", hidden));
    expect(mockPush).not.toHaveBeenCalled();
  });
});
