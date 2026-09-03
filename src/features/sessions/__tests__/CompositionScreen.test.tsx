import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Keyboard, Platform, StyleSheet } from "react-native";

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
 * déjà `"ios"` — forcé ici explicitement, par robustesse, plutôt que de
 * dépendre implicitement de ce défaut. `DurationWheelPicker` (`PHASE02
 * REWORK01 ADDENDUM — NATIVE APPLE WHEEL TARGET`, 2026-09-03) délègue donc
 * à la roulette native SwiftUI — les interactions de test ci-dessous
 * utilisent `fireNativeSelectionChange` (événement `selectionChange`,
 * convention du composant natif), jamais `fireEvent.scroll` (mécanisme du
 * seul chemin Android/web, testé séparément dans
 * `DurationWheelPicker.test.tsx`).
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
    expect(screen.getByText("×1")).toBeTruthy();

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

  it("shows no chevron on rows by default (absent from the closed-state reference, CMP-03/05), and an open chevron once toggled", () => {
    renderScreen();

    // Deux lignes repliables (Compte à rebours, Fin de séance), toutes deux
    // fermées par défaut — aucun chevron n'est rendu tant qu'elles restent
    // fermées (correction consolidée, CMP-03/CMP-05, 2026-09-03 : supprime
    // le chevron `LAY-05` précédent, absent de la référence en état fermé).
    expect(screen.queryByTestId("composition-row-chevron-down")).toBeNull();
    expect(screen.queryByTestId("composition-row-chevron-up")).toBeNull();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));

    // Seule la ligne ouverte porte le chevron, comme unique indice visuel
    // restant de l'état développé.
    expect(screen.getByTestId("composition-row-chevron-up")).toBeTruthy();
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

    expect(screen.getByText("0 activité · 0 min")).toBeTruthy();
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
    expect(screen.getByText("0 activité · 0 min")).toBeTruthy();
  });

  it("selects a real value in the countdown picker, committed to the row exactly once when the picker closes (no false conformity — a picker that opens but never truly selects, AUD-05)", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 2);
    // Toujours la valeur validée précédente pendant que le sélecteur reste ouvert.
    expect(screen.getByText("00 min 10 s")).toBeTruthy();

    // Fermer le sélecteur en pressant de nouveau la ligne -> validation unique.
    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();

    // La valeur choisie est désormais affichée sur la ligne, exactement
    // celle sélectionnée — jamais une valeur obsolète/décalée.
    expect(screen.getByText("02 min 10 s")).toBeTruthy();
  });

  it("draft/committed independence: re-opening the countdown picker after closing it restores exactly the last committed value, centered — never the previous draft nor a stale value", () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText(composition.countdown.label));
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 1);
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-seconds"), 10);
    fireEvent.press(screen.getByLabelText(composition.countdown.label)); // ferme -> commit unique (01 min 10 s)
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

  it("shows the composition-main-content and composition-reorder icons on the Exercise row (CE-T01-09 icons, previously unused)", () => {
    renderScreenWithDraft({ ...createExerciseDraft(), name: "Gainage", durationSeconds: 45 });

    expect(screen.getByTestId("composition-exercise-icon")).toBeTruthy();
    expect(screen.getByTestId("composition-reorder-icon")).toBeTruthy();
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
      "composition-exercise-icon",
      "composition-row-icon-composition-end-session",
    ]);
    expect(order).toEqual([
      "composition-row-icon-composition-initial-countdown",
      "composition-exercise-icon",
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

  it("CMP-02 — Name field and colour selector share a single white rounded field, distinct from the loose Context band background", () => {
    renderScreen();

    const field = screen.getByTestId("composition-name-color-field");
    expect(StyleSheet.flatten(field.props.style).backgroundColor).toBe(colors.background);
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

  it("CMP-04 — the Tour card is a distinct DS component (background different from the general background), showing the Tour label and a white ×1 control with a disclosure chevron, never the Activity icon", () => {
    renderScreen();

    const tourCard = screen.getByTestId("composition-tour-card");
    expect(StyleSheet.flatten(tourCard.props.style).backgroundColor).not.toBe(colors.background);
    expect(within(tourCard).getByText(composition.tour.label)).toBeTruthy();
    expect(within(tourCard).getByText("×1")).toBeTruthy();

    const control = screen.getByTestId("composition-tour-control");
    expect(StyleSheet.flatten(control.props.style).backgroundColor).toBe(colors.background);
    expect(within(control).getByTestId("composition-tour-control-chevron")).toBeTruthy();

    // Jamais l'icône d'une Activité réutilisée comme icône Tour.
    expect(within(tourCard).queryByTestId("composition-exercise-icon")).toBeNull();
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

  it("CMP-06 — the summary and Continuer are grouped in a single Bottom Action zone, summary immediately above Continuer", () => {
    renderScreen();

    const bottomAction = screen.getByTestId("composition-bottom-action");
    expect(within(bottomAction).getByText("0 activité · 0 min")).toBeTruthy();
    expect(within(bottomAction).getByLabelText(composition.continueAction)).toBeTruthy();
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
