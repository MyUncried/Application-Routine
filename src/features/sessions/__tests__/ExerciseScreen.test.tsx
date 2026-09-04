import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ScrollView, StyleSheet } from "react-native";

import { createExerciseDraft } from "@/domain/sessions/SessionDraft";
import { ExerciseScreen } from "@/features/sessions/ExerciseScreen";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import type { SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { colors, dimensions } from "@/shared/ui/tokens";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

const mockBack = jest.fn();
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ back: mockBack, push: jest.fn() }),
  };
});

/**
 * `useCompositionExitGuard` mocké : ce test porte sur le contrat propre de
 * l'écran (états locaux, validations, isolement du brouillon), pas sur le
 * mécanisme réel de prévention de navigation — couvert avec un vrai
 * navigateur par `ExerciseNavigationGuard.integration.test.tsx`.
 */
const mockExitGuard = jest.fn();
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: (shouldBlock: boolean, onConfirmExit: () => void) =>
    mockExitGuard(shouldBlock, onConfirmExit),
}));

function defaultExitGuardResult() {
  return { isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() };
}

function renderScreen(draftExercise: ReturnType<typeof createExerciseDraft> | null = null) {
  const updateDraft = jest.fn();
  const contextValue: SessionDraftContextValue = {
    draft: {
      name: "Séance simple",
      color: "#3B82F6",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercise: draftExercise,
    },
    updateDraft,
    resetDraft: jest.fn(),
  };

  render(
    <TestSafeAreaProvider>
      <SessionDraftContext.Provider value={contextValue}>
        <ExerciseScreen />
      </SessionDraftContext.Provider>
    </TestSafeAreaProvider>,
  );

  return { updateDraft };
}

const t = strings.screens.exercise;

/**
 * `Platform.OS` par défaut dans cet environnement Jest (`jest-expo`) est
 * `"ios"` — `DurationWheelPicker` délègue donc à la roulette native SwiftUI
 * (voir `DurationWheelPicker.tsx`) ; les interactions ci-dessous utilisent
 * `fireNativeSelectionChange` (événement `selectionChange`), jamais
 * `fireEvent.scroll` (chemin Android/web uniquement).
 */
function fireNativeSelectionChange(
  element: ReturnType<typeof screen.getByTestId>,
  selection: number,
) {
  fireEvent(element, "selectionChange", { nativeEvent: { selection } });
}

beforeEach(() => {
  mockExitGuard.mockReset();
  mockExitGuard.mockReturnValue(defaultExitGuardResult());
  mockBack.mockReset();
});

describe("ExerciseScreen — REWORK09 — Shell partagé (header/séparateur fixes, formulaire central défilant, action finale fixe)", () => {
  it("uses the shared FixedHeader/HeaderSeparator (Header / Fixed, Action / Back), showing the real Session name — never a local title", () => {
    renderScreen(null); // draft.name = "Séance simple" (helper de rendu)

    const header = screen.getByTestId("screen-header");
    expect(within(header).getByText("Séance simple")).toBeTruthy();
    expect(screen.getByTestId("screen-header-back")).toBeTruthy();
    expect(screen.getByTestId("screen-header-separator")).toBeTruthy();
  });

  it("falls back to the canonical 'Nom de la séance' placeholder in the header when the Session has no name yet", () => {
    const updateDraft = jest.fn();
    const contextValue: SessionDraftContextValue = {
      draft: {
        name: "",
        color: "#3B82F6",
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
        exercise: null,
      },
      updateDraft,
      resetDraft: jest.fn(),
    };
    render(
      <TestSafeAreaProvider>
        <SessionDraftContext.Provider value={contextValue}>
          <ExerciseScreen />
        </SessionDraftContext.Provider>
      </TestSafeAreaProvider>,
    );

    const header = screen.getByTestId("screen-header");
    expect(within(header).getByText(strings.screens.composition.name)).toBeTruthy();
  });

  it("Retour (Action / Back) calls router.back() with no special handling", () => {
    renderScreen(null);
    fireEvent.press(screen.getByTestId("screen-header-back"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("exactly one scrollable container exists for the whole screen — the header, separator and final action are structural siblings of it, never its descendants", () => {
    renderScreen(null);

    const { UNSAFE_root } = render(
      <TestSafeAreaProvider>
        <SessionDraftContext.Provider
          value={{
            draft: {
              name: "Séance simple",
              color: "#3B82F6",
              initialCountdownSeconds: 10,
              finalPhaseSeconds: 5,
              exercise: null,
            },
            updateDraft: jest.fn(),
            resetDraft: jest.fn(),
          }}
        >
          <ExerciseScreen />
        </SessionDraftContext.Provider>
      </TestSafeAreaProvider>,
    );
    const scrollViews = UNSAFE_root.findAllByType(ScrollView);
    expect(scrollViews).toHaveLength(1);
    expect(scrollViews[0].props.testID).toBe("exercise-body");

    const body = screen.getAllByTestId("exercise-body")[0];
    expect(within(body).queryByTestId("screen-header")).toBeNull();
    expect(within(body).queryByTestId("screen-header-separator")).toBeNull();
    expect(within(body).queryByLabelText(t.validateAction)).toBeNull();
  });
});

describe("ExerciseScreen — REWORK09 — ordre exact du formulaire (point 2)", () => {
  it("renders, in this exact order: Nom de l'activité, Type d'activité, Mode d'exécution, Paramètres de l'activité", () => {
    renderScreen(null);

    const order = textOrder(screen.toJSON(), [
      t.name,
      t.type.label,
      t.executionMode.label,
      t.parametersTitle,
    ]);
    expect(order).toEqual([t.name, t.type.label, t.executionMode.label, t.parametersTitle]);
  });

  it("no longer renders the old local body title ('Ajouter une activité'/'Modifier une activité') or any incompatible legacy hierarchy", () => {
    renderScreen(null);
    expect(screen.queryByText("Ajouter une activité")).toBeNull();
    expect(screen.queryByText("Modifier une activité")).toBeNull();
  });
});

/** Ordre de première apparition (parcours préfixe) des libellés de texte demandés dans l'arbre rendu. */
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

describe("ExerciseScreen — REWORK09 — Champ Nom de l'activité (point 3, Forms / Text Field — Source exact)", () => {
  it("carries the canonical white field anatomy (fond blanc, liseré/rayon/hauteur dédiés), no grey style inherited from the old screen", () => {
    renderScreen(null);

    const field = screen.getByLabelText(t.name);
    const flattened = StyleSheet.flatten(field.props.style);
    expect(flattened.backgroundColor).toBe(colors.background);
    expect(flattened.backgroundColor).not.toBe(colors.surface);
    expect(flattened.borderWidth).toBe(1);
    expect(flattened.borderColor).toBe(colors.exerciseFieldBorder);
    expect(flattened.borderRadius).toBe(dimensions.exerciseTextField.radius);
    expect(flattened.height).toBe(dimensions.exerciseTextField.height);
    expect(flattened.paddingHorizontal).toBe(dimensions.exerciseTextField.paddingHorizontal);
  });

  it("starts on Étape 1 with the Valider button disabled (empty name), enabled once Nom and the default Durée are both valid", () => {
    renderScreen(null);
    expect(screen.getByLabelText(t.name)).toBeTruthy();
    expect(screen.getByLabelText(t.validateAction).props.accessibilityState).toMatchObject({
      disabled: true,
    });

    fireEvent.changeText(screen.getByLabelText(t.name), "Pompes");
    expect(screen.getByLabelText(t.validateAction).props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });

  it("advances to Étape 2 on Valider, without calling the shared updateDraft", () => {
    const { updateDraft } = renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Pompes");
    fireEvent.press(screen.getByLabelText(t.validateAction));

    expect(screen.getByLabelText(t.instruction.label)).toBeTruthy();
    expect(screen.getByLabelText(t.bodyZones.accessibilityLabel)).toBeTruthy();
    expect(updateDraft).not.toHaveBeenCalled();
  });
});

describe("ExerciseScreen — REWORK09 — Contrôles segmentés (point 4/5, Controls / Segmented)", () => {
  it("shows both segmented-control titles VISIBLY (point 5 — an accessibilityLabel alone does not replace a visible title)", () => {
    renderScreen(null);
    expect(screen.getByText(t.type.label)).toBeTruthy();
    expect(screen.getByText(t.executionMode.label)).toBeTruthy();
  });

  it("colours the selected segment with color.selection (#5F60EE) and white text, the unselected segment transparent with color.textSecondary text — never the previous local component's white-background selection", () => {
    renderScreen(null);

    const exerciseTab = screen.getByLabelText(t.type.exercise);
    const exerciseLabel = within(exerciseTab).getByText(t.type.exercise);
    const exerciseTabStyle = StyleSheet.flatten(exerciseTab.props.style);
    const exerciseLabelStyle = StyleSheet.flatten(exerciseLabel.props.style);
    expect(exerciseTabStyle.backgroundColor).toBe(colors.selection);
    expect(exerciseTabStyle.backgroundColor).toBe("#5F60EE");
    expect(exerciseLabelStyle.color).toBe(colors.background);

    const recoveryTab = screen.getByLabelText(t.type.recovery);
    const recoveryLabel = within(recoveryTab).getByText(t.type.recovery);
    const recoveryTabStyle = StyleSheet.flatten(recoveryTab.props.style);
    const recoveryLabelStyle = StyleSheet.flatten(recoveryLabel.props.style);
    expect(recoveryTabStyle.backgroundColor).not.toBe(colors.selection);
    expect(recoveryLabelStyle.color).not.toBe(colors.background);
  });

  it("centers segment labels and gives the two segments a strictly equal width via flex:1 inside the 354×42 container", () => {
    renderScreen(null);

    const container = screen.getByLabelText(t.type.label);
    const containerStyle = StyleSheet.flatten(container.props.style);
    expect(containerStyle.width).toBe("100%");
    expect(containerStyle.height).toBe(42);
    expect(containerStyle.backgroundColor).toBe(colors.background);
    expect(containerStyle.borderColor).toBe(colors.border);

    const exerciseTab = screen.getByLabelText(t.type.exercise);
    const exerciseTabStyle = StyleSheet.flatten(exerciseTab.props.style);
    const recoveryTabStyle = StyleSheet.flatten(screen.getByLabelText(t.type.recovery).props.style);
    expect(exerciseTabStyle.flex).toBe(1);
    expect(exerciseTabStyle.alignItems).toBe("center");
    expect(exerciseTabStyle.justifyContent).toBe("center");
    expect(exerciseTabStyle.flex).toBe(recoveryTabStyle.flex);
  });

  it("shows the Exercice/Récupération segment, Exercice locked selected and Récupération visibly disabled — never opens any screen when pressed (CE-T01-13)", () => {
    renderScreen(null);

    const exerciseTab = screen.getByLabelText(t.type.exercise);
    const recoveryTab = screen.getByLabelText(t.type.recovery);
    expect(exerciseTab.props.accessibilityState).toMatchObject({ selected: true });
    expect(recoveryTab.props.accessibilityState).toMatchObject({ selected: false, disabled: true });

    fireEvent.press(recoveryTab);
    expect(screen.getByLabelText(t.name)).toBeTruthy();
    expect(screen.getByLabelText(t.type.exercise).props.accessibilityState).toMatchObject({
      selected: true,
    });
  });
});

describe("ExerciseScreen — REWORK09 — mode Répétitions (segment Mode d'exécution)", () => {
  it("switching to Répétitions clears durationSeconds and requires a valid repetitionCount for Valider", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Fentes");
    fireEvent.press(screen.getByLabelText(t.executionMode.repetitions));

    expect(screen.getByLabelText(t.repetitionCount.accessibilityLabel)).toBeTruthy();
    expect(screen.queryByLabelText(t.duration.accessibilityLabel)).toBeNull();
    // Default repetition count (1) is already valid: Valider stays enabled.
    expect(screen.getByLabelText(t.validateAction).props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });

  it("switching back to Durée restores a valid durationSeconds and clears repetitionCount", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Fentes");
    fireEvent.press(screen.getByLabelText(t.executionMode.repetitions));
    fireEvent.press(screen.getByLabelText(t.executionMode.duration));

    expect(screen.getByLabelText(t.duration.accessibilityLabel)).toBeTruthy();
    expect(screen.queryByLabelText(t.repetitionCount.accessibilityLabel)).toBeNull();
    expect(screen.getByLabelText(t.validateAction).props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });
});

describe("ExerciseScreen — REWORK09 — Rangée compacte des paramètres (point 6/7, Activity / Parameter Row — Source exact)", () => {
  it("shows the Paramètres de l'activité section title, and a SINGLE horizontal row (338×66 inside its 354-wide card) containing exactly the three parameter fields — never three separate vertical lines", () => {
    renderScreen(null);

    expect(screen.getByText(t.parametersTitle)).toBeTruthy();

    const card = screen.getByTestId("exercise-parameter-card");
    const cardStyle = StyleSheet.flatten(card.props.style);
    expect(cardStyle.width).toBe(354);

    const row = screen.getByTestId("exercise-parameter-row");
    const rowStyle = StyleSheet.flatten(row.props.style);
    expect(rowStyle.width).toBe(338);
    expect(rowStyle.height).toBe(66);
    expect(rowStyle.flexDirection).toBe("row");
    expect(rowStyle.gap).toBe(8);

    expect(within(row).getByTestId("exercise-field-duration")).toBeTruthy();
    expect(within(row).getByTestId("exercise-field-pauseSeconds")).toBeTruthy();
    expect(within(row).getByTestId("exercise-field-seriesCount")).toBeTruthy();
  });

  it("gives Durée and Pause a 124pt-wide column, Séries a 74pt-wide column, with labels displayed above each control (42pt tall, white background, dedicated border/radius per Forms / Select Field)", () => {
    renderScreen(null);

    const durationField = screen.getByTestId("exercise-field-duration");
    expect(StyleSheet.flatten(durationField.props.style).width).toBe(124);
    expect(within(durationField).getByText(t.duration.label)).toBeTruthy();

    const pauseField = screen.getByTestId("exercise-field-pauseSeconds");
    expect(StyleSheet.flatten(pauseField.props.style).width).toBe(124);
    expect(within(pauseField).getByText(t.pauseSeconds.compactLabel)).toBeTruthy();

    const seriesField = screen.getByTestId("exercise-field-seriesCount");
    expect(StyleSheet.flatten(seriesField.props.style).width).toBe(74);
    expect(within(seriesField).getByText(t.seriesCount.compactLabel)).toBeTruthy();

    const control = screen.getByTestId("exercise-field-duration-control");
    const controlStyle = StyleSheet.flatten(control.props.style);
    expect(controlStyle.height).toBe(42);
    expect(controlStyle.backgroundColor).toBe(colors.background);
    expect(controlStyle.borderColor).toBe(colors.exerciseParameterControlBorder);
    expect(controlStyle.borderRadius).toBe(10);
  });

  it("gives every parameter control the canonical 28×28 chevron square (fond DSF #CDCEFA, rayon 6) with a white 14×14 chevron in its canonical frame — never an isolated dark chevron", () => {
    renderScreen(null);

    for (const fieldTestID of ["exercise-field-duration", "exercise-field-pauseSeconds", "exercise-field-seriesCount"]) {
      const chevron = screen.getByTestId(`${fieldTestID}-chevron`);
      const chevronBox = screen.getByTestId(`${fieldTestID}-chevron-box`);
      const chevronBoxStyle = StyleSheet.flatten(chevronBox.props.style);
      expect(chevronBoxStyle.width).toBe(28);
      expect(chevronBoxStyle.height).toBe(28);
      expect(chevronBoxStyle.backgroundColor).toBe(colors.tourSurface);
      expect(chevronBoxStyle.backgroundColor).toBe("#CDCEFA");
      expect(chevronBoxStyle.borderRadius).toBe(6);

      const chevronStyle = StyleSheet.flatten(chevron.props.style);
      expect(chevronStyle.width).toBe(14);
      expect(chevronStyle.height).toBe(14);
    }

    // Jamais l'ancien chevron sombre 24×24 réutilisé pour cette rangée.
    expect(screen.queryByTestId("exercise-row-chevron-down")).toBeNull();
    expect(screen.queryByTestId("exercise-row-chevron-up")).toBeNull();
  });

  it("keeps a real ≥48×48 touch target on each control, independent of its 42pt-tall visual box (accessibilityRole=button, full control surface pressable)", () => {
    renderScreen(null);
    const control = screen.getByTestId("exercise-field-duration-control");
    expect(control.props.accessibilityRole).toBe("button");
    // Le contrôle occupe toute sa colonne (124×42 minimum) — cible réelle
    // supérieure aux dimensions minimales conventionnelles React Native
    // pour un `Pressable` de cette taille, sans `hitSlop` supplémentaire
    // requis ici (contrairement aux icônes isolées `28×28`).
    const controlStyle = StyleSheet.flatten(control.props.style);
    expect(controlStyle.width).toBeGreaterThanOrEqual(74);
    expect(controlStyle.height).toBe(42);
  });
});

describe("ExerciseScreen — REWORK09 — sélections et ancrage du popover unique (roulette gelée, adaptation d'ancrage uniquement)", () => {
  it("opens the Durée picker on its control's press, anchored as a superposed popover (position: absolute) shared by the whole parameter row, never pushing the layout below", () => {
    renderScreen(null);

    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();

    const anchor = screen.getByTestId("exercise-popover-anchor");
    expect(StyleSheet.flatten(anchor.props.style).position).toBe("absolute");
  });

  it("elevates the scrollable body (exercise-body) itself above the backdrop while any of the four parameter selectors is open — the same REWORK08-B fix already applied to Composition's ScrollView, adapted here since all four selectors now share one anchor", () => {
    renderScreen(null);

    const bodyClosed = StyleSheet.flatten(screen.getByTestId("exercise-body").props.style);
    expect(bodyClosed.zIndex).toBeUndefined();

    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));
    const bodyOpen = StyleSheet.flatten(screen.getByTestId("exercise-body").props.style);
    expect(bodyOpen.zIndex).toBe(1);
  });

  it("renders a dedicated backdrop only while a selector is open, and pressing it closes the selector — replaces the previous full-screen root Pressable (same D-03 correction already applied to Composition)", () => {
    renderScreen(null);
    expect(screen.queryByTestId("exercise-backdrop")).toBeNull();

    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));
    expect(screen.getByTestId("exercise-backdrop")).toBeTruthy();

    fireEvent.press(screen.getByTestId("exercise-backdrop"));
    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
    expect(screen.queryByTestId("exercise-backdrop")).toBeNull();
  });

  it("opening Pause closes an already-open Durée picker (single overlay at a time, shared anchor)", () => {
    renderScreen(null);

    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));
    expect(screen.getByTestId("duration-wheel-minutes")).toBeTruthy();

    fireEvent.press(screen.getByTestId("exercise-field-pauseSeconds-control"));
    expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(0);
  });

  it("opens the Séries picker (NumberWheelPicker) on its control's press, immediate-apply behaviour unchanged (not the draft/commit contract of DurationWheelPicker)", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Pompes");

    fireEvent.press(screen.getByTestId("exercise-field-seriesCount-control"));
    fireEvent.scroll(screen.getByTestId("exercise-series-count-wheel"), {
      nativeEvent: { contentOffset: { y: 80 } }, // index 2 -> valeur 3 (bornes 1-99)
    });
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);

    fireEvent.press(screen.getByTestId("exercise-field-seriesCount-control"));
    expect(screen.queryByTestId("exercise-series-count-wheel")).toBeNull();
    expect(screen.getByText("3")).toBeTruthy();
  });
});

describe("ExerciseScreen — REWORK09 — verrou de non-régression de la roulette de durée native", () => {
  it("draft vs committed value (D-06): a native minutes selection on Durée does NOT update the control's displayed value while the picker stays open", () => {
    renderScreen(null);
    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));

    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 1);

    // Valeur par défaut (`00 min 30 s`) inchangée tant que non validée
    // (D-06) — jamais le brouillon "01 min 30 s" qu'une Validation
    // produirait.
    expect(
      within(screen.getByTestId("exercise-field-duration-control")).getByText("00 min 30 s"),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("exercise-field-duration-control")).queryByText("01 min 30 s"),
    ).toBeNull();
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();
  });

  it("Valider applies the drafted value to the Durée control and closes the picker", () => {
    renderScreen(null);
    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 2);

    // Portée à l'ancre du sélecteur : le libellé "Valider" du toolbar de la
    // roulette collide textuellement avec l'action `Valider` de l'étape 1
    // (deux boutons distincts, même libellé) — `within` désambiguïse sans
    // toucher au code applicatif.
    fireEvent.press(
      within(screen.getByTestId("exercise-popover-anchor")).getByLabelText(
        t.wheelPicker.validateAccessibilityLabel,
      ),
    );
    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
    // Seules les minutes sont modifiées ; les secondes du brouillon
    // conservent leur valeur initiale (`DEFAULT_EXERCISE_DURATION_SECONDS`
    // = 30 s) — total validé : 2 min 30 s.
    expect(
      within(screen.getByTestId("exercise-field-duration-control")).getByText("02 min 30 s"),
    ).toBeTruthy();
  });

  it("Annuler restores the previously committed value, discarding the draft — never applying it", () => {
    renderScreen(null);
    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 2);

    fireEvent.press(screen.getByLabelText(t.wheelPicker.cancelAccessibilityLabel));
    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
    // Valeur par défaut de l'Exercice (`DEFAULT_EXERCISE_DURATION_SECONDS`,
    // 0 min 30 s) restaurée — jamais le brouillon "02 min 30 s" abandonné.
    expect(
      within(screen.getByTestId("exercise-field-duration-control")).queryByText("02 min 30 s"),
    ).toBeNull();
    expect(
      within(screen.getByTestId("exercise-field-duration-control")).getByText("00 min 30 s"),
    ).toBeTruthy();
  });

  it("REWORK09 — no line of DurationWheelPicker's own rendering is duplicated or reimplemented locally: the exact same shared component and testIDs (duration-wheel-picker/-minutes/-seconds/-cancel/-validate) are reused unchanged", () => {
    renderScreen(null);
    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));

    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();
    expect(screen.getByTestId("duration-wheel-minutes")).toBeTruthy();
    expect(screen.getByTestId("duration-wheel-seconds")).toBeTruthy();
    expect(screen.getByTestId("duration-wheel-cancel")).toBeTruthy();
    expect(screen.getByTestId("duration-wheel-validate")).toBeTruthy();
  });
});

describe("ExerciseScreen — REWORK09 — cadre récapitulatif calculé (point 8)", () => {
  it("shows a computed recap reflecting the current draft, never a static Figma value, growing with its own content (no fixed height)", () => {
    renderScreen(null);

    const summary = screen.getByTestId("exercise-summary-card");
    const summaryStyle = StyleSheet.flatten(summary.props.style);
    expect(summaryStyle.height).toBeUndefined();
    expect(summaryStyle.borderColor).toBe(colors.tourSurface);
    expect(summaryStyle.borderRadius).toBe(12);

    // Valeurs par défaut de `createExerciseDraft()` : mode Durée, 1 série, pause 0 s.
    expect(within(summary).getByText(/^Exercice · Mode Durée · 1 série de/)).toBeTruthy();
  });

  it("recomputes the recap after Valider commits a new Durée, and after switching to Répétitions mode", () => {
    renderScreen(null);

    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 1);
    fireEvent.press(
      within(screen.getByTestId("exercise-popover-anchor")).getByLabelText(
        t.wheelPicker.validateAccessibilityLabel,
      ),
    );

    // Seules les minutes sont modifiées ; les secondes du brouillon
    // conservent leur valeur initiale (`DEFAULT_EXERCISE_DURATION_SECONDS`
    // = 30 s) — total validé : 1 min 30 s.
    const summary = screen.getByTestId("exercise-summary-card");
    expect(within(summary).getByText(/1 min 30 s/)).toBeTruthy();

    fireEvent.press(screen.getByLabelText(t.executionMode.repetitions));
    expect(within(summary).getByText(/^Exercice · Mode Répétition ·/)).toBeTruthy();
  });

  it("omits the pause clause entirely when pauseSeconds is 0 (default), never showing 'avec 0 s de pause'", () => {
    renderScreen(null);
    const summary = screen.getByTestId("exercise-summary-card");
    expect(within(summary).queryByText(/avec 0 s de pause/)).toBeNull();
    expect(within(summary).queryByText(/avec/)).toBeNull();
  });
});

describe("ExerciseScreen — mode modification (draft.exercise !== null)", () => {
  it("prefills the name from the existing exercise, and shows the real Session name (never a body title) in the header", () => {
    renderScreen({ ...createExerciseDraft(), name: "Gainage", durationSeconds: 45 });

    expect(screen.getByLabelText(t.name).props.value).toBe("Gainage");
    expect(within(screen.getByTestId("screen-header")).getByText("Séance simple")).toBeTruthy();
  });

  it("Terminer calls updateDraft exactly once with the edited local copy, and calls router.back()", () => {
    const { updateDraft } = renderScreen({
      ...createExerciseDraft(),
      name: "Gainage",
      durationSeconds: 45,
    });

    fireEvent.press(screen.getByLabelText(t.validateAction)); // -> Étape 2
    fireEvent.press(screen.getByLabelText(t.finishAction));

    expect(updateDraft).toHaveBeenCalledTimes(1);
    expect(updateDraft).toHaveBeenCalledWith({
      exercise: expect.objectContaining({ name: "Gainage", durationSeconds: 45 }),
    });
  });

  it("a second Terminer press before any intermediate render is a no-op (finishingRef synchronous lock)", () => {
    const { updateDraft } = renderScreen({
      ...createExerciseDraft(),
      name: "Gainage",
      durationSeconds: 45,
    });

    fireEvent.press(screen.getByLabelText(t.validateAction));
    const finishButton = screen.getByLabelText(t.finishAction);
    fireEvent.press(finishButton);
    fireEvent.press(finishButton);

    expect(updateDraft).toHaveBeenCalledTimes(1);
  });
});

describe("ExerciseScreen — modale d'abandon (D-094)", () => {
  it("renders ExerciseExitConfirmModal exactly when isPendingExit is true, wired to cancelExit/confirmExit", () => {
    const cancelExit = jest.fn();
    const confirmExit = jest.fn();
    mockExitGuard.mockReturnValue({ isPendingExit: true, cancelExit, confirmExit });

    renderScreen(null);

    expect(screen.getByText("Abandonner les modifications ?")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(t.exitConfirmModal.continueEditing));
    expect(cancelExit).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByLabelText(t.exitConfirmModal.abandon));
    expect(confirmExit).toHaveBeenCalledTimes(1);
  });

  it("never renders the modal while isPendingExit is false", () => {
    renderScreen(null);
    expect(screen.queryByText("Abandonner les modifications ?")).toBeNull();
  });
});
