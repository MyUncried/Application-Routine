import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Keyboard, Platform, ScrollView, StyleSheet } from "react-native";

import { DEFAULT_SESSION_COLOR, SESSION_COLORS } from "@/domain/sessions/Session";
import { NAME_MAX_LENGTH } from "@/domain/sessions/validation";
import { createExerciseDraft } from "@/domain/sessions/SessionDraft";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import type { SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { SessionDraftProvider } from "@/features/sessions/SessionDraftProvider";
import { colors, dimensions } from "@/shared/ui/tokens";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

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

function renderScreen() {
  return render(
    <TestSafeAreaProvider>
      <SessionDraftProvider>
        <CompositionScreen />
      </SessionDraftProvider>
    </TestSafeAreaProvider>,
  );
}

/** Contourne `SessionDraftProvider` pour préremplir `draft.exercise` — celui-ci n'expose aucun moyen interactif de le faire depuis Composition seule. */
function renderScreenWithDraft(exercise: ReturnType<typeof createExerciseDraft> | null) {
  const contextValue: SessionDraftContextValue = {
    draft: {
      name: "Séance simple",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercise,
    },
    updateDraft: jest.fn(),
    resetDraft: jest.fn(),
  };
  return render(
    <TestSafeAreaProvider>
      <SessionDraftContext.Provider value={contextValue}>
        <CompositionScreen />
      </SessionDraftContext.Provider>
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
  it("renders the name field, the countdown/final phase rows, the locked Tour, and the disabled actions", () => {
    renderScreen();

    expect(screen.getByLabelText(composition.name)).toBeTruthy();
    expect(screen.getByLabelText(composition.countdown.label)).toBeTruthy();
    expect(screen.getByLabelText(composition.finalPhase.label)).toBeTruthy();

    const tour = screen.getByLabelText(composition.tour.label);
    expect(tour.props.accessibilityState).toMatchObject({ disabled: true });
    // T-05 : contenu `1` seul, plus de préfixe `×`.
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

  it("anchors the open picker as a superposed popover (position: absolute), never pushing the layout below (CE-T01-06/07, AUD-05)", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));

    const anchor = screen.getByTestId("composition-popover-anchor");
    const flattened = StyleSheet.flatten(anchor.props.style);
    expect(flattened.position).toBe("absolute");
  });

  it("elevates the open row's zIndex above its siblings, so the following row cannot paint over its popover (UI-CTRL-002, root cause UI-CTRL-001)", () => {
    // Preuve du défaut réel constaté sur iPhone (« ouvre mais ne peut pas
    // sélectionner ») : le popover (≈136px) déborde largement de l'écart
    // jusqu'à la ligne suivante (≈20px). Sans `zIndex` différencié entre
    // lignes frères, React Native peint la ligne suivante — montée après —
    // par-dessus le popover ouvert, qui capte alors le geste à sa place.
    renderScreen();

    // Fermé : aucune ligne n'a besoin d'être élevée au-dessus de ses frères.
    const closedCountdown = screen.getByTestId("composition-anchored-row-countdown");
    expect(StyleSheet.flatten(closedCountdown.props.style).zIndex).toBeUndefined();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));

    const openCountdown = screen.getByTestId("composition-anchored-row-countdown");
    expect(StyleSheet.flatten(openCountdown.props.style).zIndex).toBe(1);

    // Le sélecteur voisin (Fin de séance), lui, reste au niveau par défaut :
    // seule la ligne réellement ouverte doit être élevée.
    const finalPhase = screen.getByTestId("composition-anchored-row-finalPhase");
    expect(StyleSheet.flatten(finalPhase.props.style).zIndex).toBeUndefined();
  });

  it("elevates the Context band (name + colour swatch) above the rows below it while the colour popover is open (same UI-CTRL-002 correction; LAY-02 renamed this zone from 'header' to 'context band')", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.colorPicker.label));

    const contextBand = screen.getByTestId("screen-context-band");
    expect(StyleSheet.flatten(contextBand.props.style).zIndex).toBe(1);
  });

  it("enables '+ Ajouter une activité' while no Exercise exists yet, and navigates to /exercise on press (T01-S08)", () => {
    renderScreen();

    const addActivity = screen.getByLabelText(composition.addActivity);
    expect(addActivity.props.accessibilityState).toMatchObject({ disabled: false });

    fireEvent.press(addActivity);
    expect(mockPush).toHaveBeenCalledWith("/exercise");
  });

  it("shows the exact local empty summary '0 activité · 0 min' (V2), never formatActivityCount(0)'s plural", () => {
    renderScreen();

    // REWORK09 : la ligne de synthèse basse est supprimée (redondante
    // depuis REWORK08-C) — une seule occurrence subsiste désormais, sous
    // « Nombre de tours » (voir composition-tour-summary ci-dessous).
    expect(screen.getAllByText("0 activité · 0 min")).toHaveLength(1);
    expect(screen.queryByText("0 activités · 0 min")).toBeNull();
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

  it("opening the color palette closes an already-open duration picker", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(composition.colorPicker.label));
    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
    expect(screen.getByLabelText(composition.colorPicker.paletteAccessibilityLabel)).toBeTruthy();
  });

  it("opening a duration picker closes an already-open color palette (reverse direction, same exclusivity)", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.colorPicker.label));
    expect(screen.getByLabelText(composition.colorPicker.paletteAccessibilityLabel)).toBeTruthy();

    fireEvent.press(screen.getByLabelText(composition.finalPhase.label));
    expect(screen.queryByLabelText(composition.colorPicker.paletteAccessibilityLabel)).toBeNull();
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();
  });

  it("dismisses the keyboard when opening a duration picker or the color palette (Name field may have had focus)", () => {
    const dismissSpy = jest.spyOn(Keyboard, "dismiss").mockImplementation(() => {});
    try {
      renderScreen();
      expect(dismissSpy).not.toHaveBeenCalled();

      fireEvent.press(screen.getByLabelText(composition.countdown.label));
      expect(dismissSpy).toHaveBeenCalledTimes(1);

      fireEvent.press(screen.getByLabelText(composition.colorPicker.label));
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
    expect(screen.getAllByText("0 activité · 0 min")).toHaveLength(1);
    // REWORK08-B (« aucun chemin onChange/sélection/défilement ne
    // déclenche la fermeture ») : le sélecteur reste réellement monté —
    // preuve explicite, pas seulement déduite du libellé du test.
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();
  });

  it("REWORK08-B — no chain of native selection-change events, however many, ever closes the picker — only Annuler/Valider do (root cause: composition-backdrop previously intercepted the very first touch on the wheel before it reached the native Host view)", () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(composition.countdown.label));

    // Simule un défilement réel : plusieurs crans successifs sur les deux
    // roues, comme un vrai geste de glissement continu.
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 1);
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 2);
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 3);
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-seconds"), 5);
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-seconds"), 10);

    // Le sélecteur — et le body élevé qui le porte — restent montés après
    // toute cette séquence, jamais fermés par un simple changement de
    // sélection.
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId("composition-body").props.style).zIndex).toBe(1);

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

  it("selecting a color actually applies it to the draft (compact swatch background) and closes the palette", () => {
    renderScreen();

    // Sanity check: the compact swatch starts on the canonical default —
    // proves the assertion below is a real change, not a no-op match.
    const compactSwatchBefore = screen.getByLabelText(composition.colorPicker.label);
    expect(StyleSheet.flatten(compactSwatchBefore.props.style).backgroundColor).toBe(
      DEFAULT_SESSION_COLOR,
    );

    fireEvent.press(compactSwatchBefore);
    const chosenColor = SESSION_COLORS.find((color) => color !== DEFAULT_SESSION_COLOR);
    if (!chosenColor) {
      throw new Error("Expected at least one non-default canonical color for this test.");
    }
    fireEvent.press(
      screen.getByLabelText(`${composition.colorPicker.swatchAccessibilityLabel} ${chosenColor}`),
    );

    // Application réelle de la couleur : le contrôle compact reflète
    // désormais la couleur choisie (preuve directe, pas seulement l'appel
    // d'un callback isolé).
    const compactSwatchAfter = screen.getByLabelText(composition.colorPicker.label);
    expect(StyleSheet.flatten(compactSwatchAfter.props.style).backgroundColor).toBe(chosenColor);
    // Fermeture automatique de la palette après sélection.
    expect(screen.queryByLabelText(composition.colorPicker.paletteAccessibilityLabel)).toBeNull();
  });
});

describe("CompositionScreen — ligne Exercice (T01-S08)", () => {
  it("hides '+ Ajouter une activité' and shows the Exercise row once draft.exercise is set", () => {
    renderScreenWithDraft({ ...createExerciseDraft(), name: "Gainage", durationSeconds: 45 });

    expect(screen.queryByLabelText(composition.addActivity)).toBeNull();
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
    renderScreenWithDraft({ ...createExerciseDraft(), name: "Gainage", durationSeconds: 45 });

    const row = screen.getByTestId("composition-exercise-row");
    expect(within(row).getByTestId("composition-boundary-handle-icon")).toBeTruthy();
    expect(screen.queryByTestId("composition-exercise-icon")).toBeNull();
    expect(within(row).queryByTestId("composition-row-icon-composition-main-content")).toBeNull();
  });

  it("REWORK12 (COMP-01) — the Exercise row's structure icon displays the canonical 20×20 glyph at opacity 0.5, same as the Compte à rebours/Fin de séance cards (same shared component, by construction)", () => {
    renderScreenWithDraft({ ...createExerciseDraft(), name: "Gainage", durationSeconds: 45 });

    const row = screen.getByTestId("composition-exercise-row");
    const reorderIcon = within(row).getByTestId("composition-boundary-handle-icon");
    const flattened = StyleSheet.flatten(reorderIcon.props.style);
    expect(flattened.width).toBe(20);
    expect(flattened.height).toBe(20);
    expect(flattened.opacity).toBe(0.5);
  });

  it("REWORK12 (COMP-01) — the Exercise row reuses the exact same card anatomy (fond, liseré, rayon) as the Compte à rebours initial card, by construction (same limitCardBase/boundaryRow styles)", () => {
    renderScreenWithDraft({ ...createExerciseDraft(), name: "Gainage", durationSeconds: 45 });

    const exerciseRow = screen.getByTestId("composition-exercise-row");
    const exerciseCardStyle = StyleSheet.flatten(exerciseRow.props.style);
    const countdownCardStyle = StyleSheet.flatten(
      screen.getByLabelText(composition.countdown.label).props.style,
    );
    expect(exerciseCardStyle.borderColor).toBe(countdownCardStyle.borderColor);
    expect(exerciseCardStyle.borderRadius).toBe(countdownCardStyle.borderRadius);
    expect(exerciseCardStyle.backgroundColor).toBe(countdownCardStyle.backgroundColor);
  });

  it("shows the detailed configuration summary (name + summary, never the Consigne or the Zones corporelles) — CHANGES_REQUESTED", () => {
    renderScreenWithDraft({
      ...createExerciseDraft(),
      name: "Gainage",
      durationSeconds: 90,
      seriesCount: 3,
      pauseSeconds: 15,
      instruction: "Ne pas creuser le dos",
    });

    expect(screen.getByText("Gainage")).toBeTruthy();
    expect(screen.getByText("3 séries de 1 min 30 s avec 15 s de pause par série")).toBeTruthy();
    expect(screen.queryByText("Ne pas creuser le dos")).toBeNull();
  });

  it("pressing the Exercise row navigates to /exercise (reopen for editing)", () => {
    renderScreenWithDraft({ ...createExerciseDraft(), name: "Gainage", durationSeconds: 45 });

    fireEvent.press(screen.getByLabelText(composition.exerciseRow.editAccessibilityLabel));
    expect(mockPush).toHaveBeenCalledWith("/exercise");
  });

  it("never shows the Exercise row while draft.exercise is null", () => {
    renderScreenWithDraft(null);
    expect(screen.queryByLabelText(composition.exerciseRow.editAccessibilityLabel)).toBeNull();
  });
});

describe("CompositionScreen — ordre structurel (UI-COMP-001/002/003, cycle de correction après contre-recette iPhone 2026-09-03)", () => {
  it("initial order (no Activity yet): + Ajouter une activité ABOVE Compte à rebours initial, then Tour, then Fin de séance (UI-COMP-002)", () => {
    renderScreenWithDraft(null);

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
    renderScreenWithDraft({ ...createExerciseDraft(), name: "Gainage", durationSeconds: 45 });

    const order = testIdOrder(screen.toJSON(), [
      "composition-row-icon-composition-initial-countdown",
      "composition-exercise-row",
      "composition-row-icon-composition-end-session",
    ]);
    expect(order).toEqual([
      "composition-row-icon-composition-initial-countdown",
      "composition-exercise-row",
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
    // La bande Context contient bien le nom, la couleur ET Ajouter.
    expect(within(contextBand).getByLabelText(composition.name)).toBeTruthy();
    expect(within(contextBand).getByLabelText(composition.colorPicker.label)).toBeTruthy();
    expect(within(contextBand).getByLabelText(composition.addActivity)).toBeTruthy();
  });

  it("REWORK09 — supersedes CMP-02's opaque white field: Name field and colour selector still share a single rounded field, but it is now transparent with a white 1pt border (Session/Name Field — Source exact, 2537:1480), letting the Context band colour show through", () => {
    renderScreen();

    const field = screen.getByTestId("composition-name-color-field");
    const flattened = StyleSheet.flatten(field.props.style);
    expect(flattened.backgroundColor).toBe("transparent");
    expect(flattened.borderWidth).toBe(1);
    expect(flattened.borderColor).toBe(colors.sessionNameBorder);
    expect(colors.sessionNameBorder).toBe("#FFFFFF");
    expect(within(field).getByLabelText(composition.name)).toBeTruthy();
    expect(within(field).getByLabelText(composition.colorPicker.label)).toBeTruthy();
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

  it("CMP-04/T-03/T-04a/b/c/T-05/REWORK07B — the Tour card is a distinct DS component (background carried by the outer structure, never the inner header), showing the 'Nombre de tours' label and a control frame with '1' distinct from a dedicated violet chevron square, never the Activity icon", () => {
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

    // T-04a/b/c/REWORK06 : cadre parent clair `78×44` (agrandi depuis
    // `66×30` — addendum « cadre plus haut, marges visibles identiques en
    // haut/bas/droite ») — `1` en texte nu (jamais sur fond violet), centré
    // et en gras (`type.cardTitle`, `16/20` Semi Bold), carré violet `28×28`
    // distinct (inchangé) contenant SEULEMENT le chevron blanc.
    const control = screen.getByTestId("composition-tour-control");
    const controlStyle = StyleSheet.flatten(control.props.style);
    expect(controlStyle.width).toBe(78);
    expect(controlStyle.height).toBe(44);
    expect(controlStyle.backgroundColor).not.toBe(colors.selection);
    // REWORK06 : marges visibles identiques en haut, en bas et à droite du
    // carré violet (`28×28`, inchangé) — dérivées, pas de simple test de
    // présence : `alignItems: "center"` centre mécaniquement le carré dans
    // les `44` de hauteur (`(44-28)/2 = 8` en haut/bas), et
    // `paddingRight` égale explicitement cette même valeur à droite.
    expect(controlStyle.alignItems).toBe("center");
    expect(controlStyle.paddingRight).toBe(8);
    expect((controlStyle.height - 28) / 2).toBe(controlStyle.paddingRight);

    const valueText = within(control).getByText("1");
    const valueTextStyle = StyleSheet.flatten(valueText.props.style);
    expect(valueTextStyle.color).not.toBe(colors.background);
    // REWORK06 : valeur centrée (horizontalement par `flex`+`textAlign`,
    // verticalement par le centrage flex hérité du cadre parent) et plus
    // grande/grasse (`type.cardTitle`, `16/20` Semi Bold — auparavant
    // `type.label`, `14/18` Medium).
    expect(valueTextStyle.textAlign).toBe("center");
    expect(valueTextStyle.fontSize).toBe(16);
    expect(valueTextStyle.lineHeight).toBe(20);
    expect(valueTextStyle.fontWeight).toBe("600");

    const chevronBox = screen.getByTestId("composition-tour-control-chevron-box");
    const chevronBoxStyle = StyleSheet.flatten(chevronBox.props.style);
    expect(chevronBoxStyle.backgroundColor).toBe(colors.selection);
    expect(chevronBoxStyle.width).toBe(28);
    expect(chevronBoxStyle.height).toBe(28);
    // Le "1" n'est jamais un enfant du carré violet.
    expect(within(chevronBox).queryByText("1")).toBeNull();

    const chevron = within(chevronBox).getByTestId("composition-tour-control-chevron");
    expect(chevron.props.style.tintColor).toBe(colors.background);

    // REWORK12 (COMP-02) : icône du bloc Tour = `composition-main-content`
    // (vérifiée directement sur le nœud Figma actuel `2028:11742`,
    // « icon/contenu-principal ») — jamais l'ancienne `icon-tour`, jamais
    // `composition-reorder` (icône de poignée/structure de la ligne
    // Exercice, un troisième SVG distinct) ; voir aussi le test R4-11
    // dédié ci-dessous (`composition-tour-icon`, comparaison de `source`).
    expect(within(tourCard).getByTestId("composition-tour-icon")).toBeTruthy();
  });

  it("REWORK08-C — shows the activity-count/duration summary directly under 'Nombre de tours', same block as the title, styled exactly like the Boundary Activity rows' secondary line, without touching the frozen outer structure or the white/violet control", () => {
    renderScreen();

    const tourCard = screen.getByTestId("composition-tour-card");
    const summary = within(tourCard).getByTestId("composition-tour-summary");

    // Contenu canonique (même fonction que bottomAction), état vide T01-S07.
    expect(summary.props.children).toBe("0 activité · 0 min");

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
    expect(controlStyle.width).toBe(78);
    expect(controlStyle.height).toBe(44);
  });

  it("REWORK08-C/REWORK09 — the Tour summary reflects the real computed activity count/duration, not a static placeholder (the redundant bottomAction copy no longer exists to compare against since REWORK09)", () => {
    renderScreenWithDraft({ ...createExerciseDraft(), name: "Gainage", durationSeconds: 45 });

    const tourSummary = within(screen.getByTestId("composition-tour-card")).getByTestId(
      "composition-tour-summary",
    );
    // Contexte : Compte à rebours 10 s + Exercice 45 s + Fin de séance 5 s = 60 s = 1 min.
    expect(tourSummary.props.children).toBe("1 activité · 1 min");
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
    expect(within(bottomAction).queryByText("0 activité · 0 min")).toBeNull();
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
    renderScreenWithDraft({ ...createExerciseDraft(), name: "Gainage", durationSeconds: 45 });

    const tourIcon = screen.getByTestId("composition-tour-icon");
    const exerciseRow = screen.getByTestId("composition-exercise-row");
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

  it("REWORK08-B — elevates the scrollable body itself (composition-body) above the backdrop while a duration picker is anchored inside it — the AnchoredRow's own zIndex alone is scoped to its siblings inside the ScrollView, never reaching a non-sibling backdrop rendered at the ScreenShell level", () => {
    renderScreen();

    const bodyClosed = StyleSheet.flatten(screen.getByTestId("composition-body").props.style);
    expect(bodyClosed.zIndex).toBeUndefined();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    const bodyOpenCountdown = StyleSheet.flatten(screen.getByTestId("composition-body").props.style);
    expect(bodyOpenCountdown.zIndex).toBe(1);

    // Fermeture par Annuler (jamais le backdrop lui-même, pour isoler la
    // preuve de retour à l'état non élevé, indépendamment du mécanisme de
    // fermeture) : le body redescend à son zIndex par défaut.
    fireEvent.press(screen.getByLabelText(composition.wheelPicker.cancelAccessibilityLabel));
    const bodyClosedAgain = StyleSheet.flatten(screen.getByTestId("composition-body").props.style);
    expect(bodyClosedAgain.zIndex).toBeUndefined();

    // Même élévation pour l'autre sélecteur de durée ancré dans le body.
    fireEvent.press(screen.getByLabelText(composition.finalPhase.label));
    const bodyOpenFinalPhase = StyleSheet.flatten(screen.getByTestId("composition-body").props.style);
    expect(bodyOpenFinalPhase.zIndex).toBe(1);
  });

  it("REWORK08-B — never elevates the scrollable body for the colour palette (ContextBand is already a direct sibling of the backdrop and carries its own correct elevation — no need to also elevate the unrelated ScrollView)", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.colorPicker.label));
    const bodyStyle = StyleSheet.flatten(screen.getByTestId("composition-body").props.style);
    expect(bodyStyle.zIndex).toBeUndefined();

    const contextBand = screen.getByTestId("screen-context-band");
    expect(StyleSheet.flatten(contextBand.props.style).zIndex).toBe(1);
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

  it("renders a dedicated backdrop while a selector is open, and pressing it closes the selector", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();
    expect(screen.getByTestId("composition-backdrop")).toBeTruthy();

    fireEvent.press(screen.getByTestId("composition-backdrop"));
    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
    expect(screen.queryByTestId("composition-backdrop")).toBeNull();
  });

  it("pressing the backdrop while the colour palette is open closes it too (same single-overlay mechanism)", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.colorPicker.label));
    expect(screen.getByLabelText(composition.colorPicker.paletteAccessibilityLabel)).toBeTruthy();

    fireEvent.press(screen.getByTestId("composition-backdrop"));
    expect(screen.queryByLabelText(composition.colorPicker.paletteAccessibilityLabel)).toBeNull();
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
