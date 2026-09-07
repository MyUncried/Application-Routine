import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ScrollView, StyleSheet } from "react-native";

import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { ExerciseScreen } from "@/features/sessions/ExerciseScreen";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import type { SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { colors, dimensions, type } from "@/shared/ui/tokens";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-exercise-id") }));

const mockBack = jest.fn();
let mockSearchParams: { exerciseId?: string } = {};
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ back: mockBack, push: jest.fn() }),
    useLocalSearchParams: () => mockSearchParams,
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

/**
 * Complétion REWORK12 : rend l'écran en mode AJOUT (`draftExercise` omis —
 * `draft.exercises` vide, aucun `exerciseId` en paramètre de route) ou en
 * mode MODIFICATION (`draftExercise` fourni — inséré dans `draft.exercises`
 * ET son `id` transmis comme `exerciseId`, exactement comme
 * `CompositionScreen.tsx` le fait via `router.push({pathname: "/exercise",
 * params: {exerciseId}})`).
 */
function renderScreen(draftExercise: SessionDraftExercise | null = null) {
  const updateDraft = jest.fn();
  mockSearchParams = draftExercise ? { exerciseId: draftExercise.id } : {};
  const contextValue: SessionDraftContextValue = {
    draft: {
      name: "Séance simple",
      color: "#3B82F6",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercises: draftExercise ? [draftExercise] : [],
      categoryDrafts: [],
      selectedCategoryIds: [],
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
  mockSearchParams = {};
});

describe("ExerciseScreen — REWORK09/REWORK12 — Shell partagé (header/séparateur fixes, bandeau contextuel fixe, formulaire central défilant, action finale fixe)", () => {
  it("uses the shared FixedHeader/HeaderSeparator (Header / Fixed, Action / Back), showing the functional title 'Ajouter une activité' — never the Session name (complétion REWORK12, D-105)", () => {
    renderScreen(null);

    const header = screen.getByTestId("screen-header");
    expect(within(header).getByText(t.titleAdd)).toBeTruthy();
    expect(within(header).queryByText("Séance simple")).toBeNull();
    expect(screen.getByTestId("screen-header-back")).toBeTruthy();
    expect(screen.getByTestId("screen-header-separator")).toBeTruthy();
  });

  it("shows 'Modifier une activité' in the header when editing an existing Activity (exerciseId param matches an item of draft.exercises)", () => {
    renderScreen({ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 });

    expect(within(screen.getByTestId("screen-header")).getByText(t.titleEdit)).toBeTruthy();
    expect(screen.queryByText(t.titleAdd)).toBeNull();
  });

  it("T01-S10 (doc13 §8) — the blue band starts with the Nom de l'activité field and no longer shows any Séance-name context line", () => {
    renderScreen(null);

    const band = screen.getByTestId("exercise-context-band");
    expect(within(band).getByLabelText(t.name)).toBeTruthy();
    // Plus aucun rappel du nom / du contexte de Séance.
    expect(within(band).queryByText(new RegExp(t.context.prefix))).toBeNull();
    expect(within(band).queryByText(/Séance simple/u)).toBeNull();
  });

  it("Retour (Action / Back) calls router.back() with no special handling", () => {
    renderScreen(null);
    fireEvent.press(screen.getByTestId("screen-header-back"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("exactly one scrollable container exists for the whole screen — the header, separator, context band and final action are structural siblings of it, never its descendants", () => {
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
              exercises: [],
              categoryDrafts: [],
      selectedCategoryIds: [],
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
    expect(within(body).queryByTestId("exercise-context-band")).toBeNull();
    expect(within(body).queryByLabelText(t.validateAction)).toBeNull();
  });
});

describe("ExerciseScreen — REWORK12 — étape 2 (Informations complémentaires)", () => {
  it("shows the functional title 'Informations complémentaires' at step 2, and hides the context band (absent from CE-T01-15, 1992:9292)", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Pompes");
    fireEvent.press(screen.getByLabelText(t.validateAction));

    expect(within(screen.getByTestId("screen-header")).getByText(t.titleInformation)).toBeTruthy();
    expect(screen.queryByTestId("exercise-context-band")).toBeNull();
  });
});

describe("ExerciseScreen — REWORK09/REWORK12 — ordre exact du formulaire (point 2)", () => {
  /**
   * Complétion REWORK12 (D-105) : le champ Nom de l'activité n'a plus son
   * propre titre textuel visible (`t.name` n'apparaît plus comme nœud
   * `Text` autonome, seulement comme `accessibilityLabel`/placeholder de
   * son `TextInput`, déjà vérifié par un test dédié ci-dessus) — l'ordre
   * porte désormais sur les trois titres de section du corps défilant.
   */
  it("renders, in this exact order: Type d'activité, Mode d'exécution, Paramètres de l'activité", () => {
    renderScreen(null);

    const order = textOrder(screen.toJSON(), [t.type.label, t.executionMode.label, t.parametersTitle]);
    expect(order).toEqual([t.type.label, t.executionMode.label, t.parametersTitle]);
  });

  it("REWORK12 — now DOES render the functional title (Ajouter/Modifier une activité) in the header — reintroduced with a new meaning (D-105), superseding the previous REWORK09 assertion that it had been removed", () => {
    renderScreen(null);
    expect(screen.getByText(t.titleAdd)).toBeTruthy();
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

describe("ExerciseScreen — REWORK12 — Champ Nom de l'activité (zone bleue contextuelle, D-105)", () => {
  /**
   * REWORK13 (R13-01, `[ChatGPT] CHANGES_REQUESTED — REWORK13 —
   * typographie Nom d'activité + périmètre synthèse Tour`, 2026-09-04) :
   * `type.screenTitle` (`20/24` Semi Bold) remplace `type.modalTitle`
   * (`18/22` Semi Bold, REWORK12-bis) — identique à `Nom de la séance`
   * (Composition). Géométrie/fond/liseré/bandeau : inchangés (assertions
   * héritées ci-dessous).
   */
  it("carries the canonical transparent field anatomy on the blue band (fond transparent, liseré blanc, rayon/hauteur inchangés, typographie KODJO / Screen title)", () => {
    renderScreen(null);

    const field = screen.getByLabelText(t.name);
    const flattened = StyleSheet.flatten(field.props.style);
    expect(flattened.backgroundColor).toBe("transparent");
    expect(flattened.borderWidth).toBe(1);
    expect(flattened.borderColor).toBe(colors.sessionNameBorder);
    expect(flattened.borderRadius).toBe(dimensions.exerciseTextField.radius);
    expect(flattened.height).toBe(dimensions.exerciseTextField.height);
    expect(flattened.paddingHorizontal).toBe(dimensions.exerciseTextField.paddingHorizontal);
    expect(flattened.fontSize).toBe(type.screenTitle.fontSize);
    expect(flattened.lineHeight).toBe(type.screenTitle.lineHeight);
    expect(flattened.fontWeight).toBe(type.screenTitle.fontWeight);
    expect(flattened.fontSize).toBe(20);
    expect(flattened.lineHeight).toBe(24);
    // Aucune valeur locale `18/22` (type.modalTitle) ne subsiste pour ce champ.
    expect(flattened.fontSize).not.toBe(18);
    expect(flattened.lineHeight).not.toBe(22);
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

describe("ExerciseScreen — mode À l'échec (T01-S10, D-111, frame 3369:4236)", () => {
  it("exposes three equal-width mode options (Durée / Répétitions / À l'échec)", () => {
    renderScreen(null);

    expect(screen.getByLabelText(t.executionMode.duration)).toBeTruthy();
    expect(screen.getByLabelText(t.executionMode.repetitions)).toBeTruthy();
    expect(screen.getByLabelText(t.executionMode.toFailure)).toBeTruthy();
  });

  it("switching to À l'échec hides the Durée and Répétitions target fields, keeps Séries and Pause, and needs only a valid Nom for Valider", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Tractions");
    fireEvent.press(screen.getByLabelText(t.executionMode.toFailure));

    expect(screen.queryByLabelText(t.duration.accessibilityLabel)).toBeNull();
    expect(screen.queryByLabelText(t.repetitionCount.accessibilityLabel)).toBeNull();
    expect(screen.getByLabelText(t.pauseSeconds.accessibilityLabel)).toBeTruthy();
    expect(screen.getByLabelText(t.seriesCount.accessibilityLabel)).toBeTruthy();

    expect(screen.getByLabelText(t.validateAction).props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });

  it("the recap uses the À l'échec pattern (jusqu'à l'échec), never a duration or repetition target", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Tractions");
    fireEvent.press(screen.getByLabelText(t.executionMode.toFailure));

    const recap = screen.getByTestId("exercise-summary-card");
    expect(within(recap).getByText(/jusqu.à l.échec/u)).toBeTruthy();
  });

  it("switching from À l'échec back to Répétitions restores the target field and a valid default", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Tractions");
    fireEvent.press(screen.getByLabelText(t.executionMode.toFailure));
    fireEvent.press(screen.getByLabelText(t.executionMode.repetitions));

    expect(screen.getByLabelText(t.repetitionCount.accessibilityLabel)).toBeTruthy();
    expect(screen.getByLabelText(t.validateAction).props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });
});

describe("ExerciseScreen — bouton média désactivé, aucune section Médias (T01-S10, doc13 §8)", () => {
  it("renders a centered '+ Ajouter un média' button, visible but disabled, with no Media section and no wired behaviour", () => {
    renderScreen(null);

    const mediaButton = screen.getByTestId("exercise-add-media");
    expect(within(mediaButton).getByText(t.addMedia)).toBeTruthy();
    expect(mediaButton.props.accessibilityState).toMatchObject({ disabled: true });
    expect(StyleSheet.flatten(mediaButton.props.style).alignSelf).toBe("center");
    expect(() => fireEvent.press(mediaButton)).not.toThrow();
    expect(mockBack).not.toHaveBeenCalled();
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
    const controlStyle = StyleSheet.flatten(control.props.style);
    expect(controlStyle.width).toBeGreaterThanOrEqual(74);
    expect(controlStyle.height).toBe(42);
  });
});

describe("ExerciseScreen — T01-S09 correction VISUAL (point D) — roulettes dans WheelPickerOverlay (roulette gelée, adaptation de conteneur uniquement)", () => {
  it("opens the Durée picker inside the shared full-screen WheelPickerOverlay, centered with a dimmed background, never pushing the layout below — supersedes the former REWORK09 position:absolute popover anchor shared by the whole parameter row", () => {
    renderScreen(null);

    expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();

    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();

    expect(screen.getByTestId("wheel-picker-overlay")).toBeTruthy();
    const backdrop = screen.getByTestId("wheel-picker-overlay-backdrop");
    expect(StyleSheet.flatten(backdrop.props.style).backgroundColor).toBe(colors.overlayScrim);
  });

  it("supersedes the former REWORK08-B ScrollView elevation: exercise-body never carries an ad hoc zIndex for a parameter selector any more, open or closed, now that it renders in WheelPickerOverlay (a structurally separate layer, independent of the ScrollView)", () => {
    renderScreen(null);

    const bodyClosed = StyleSheet.flatten(screen.getByTestId("exercise-body").props.style);
    expect(bodyClosed.zIndex).toBeUndefined();

    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));
    const bodyOpen = StyleSheet.flatten(screen.getByTestId("exercise-body").props.style);
    expect(bodyOpen.zIndex).toBeUndefined();
  });

  it("never renders exercise-backdrop any more for a parameter selector (it now opens in WheelPickerOverlay, whose own backdrop is not dismissible by touch — see WheelPickerOverlay.test.tsx) — supersedes the former D-03 full-screen root Pressable correction", () => {
    renderScreen(null);
    expect(screen.queryByTestId("exercise-backdrop")).toBeNull();

    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));
    expect(screen.queryByTestId("exercise-backdrop")).toBeNull();
    expect(screen.getByTestId("wheel-picker-overlay-backdrop").props.onPress).toBeUndefined();

    // Seul Annuler ferme désormais le sélecteur (jamais un toucher en dehors).
    fireEvent.press(screen.getByLabelText(t.wheelPicker.cancelAccessibilityLabel));
    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
  });

  it("opening Pause closes an already-open Durée picker (single overlay at a time, shared anchor)", () => {
    renderScreen(null);

    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));
    expect(screen.getByTestId("duration-wheel-minutes")).toBeTruthy();

    fireEvent.press(screen.getByTestId("exercise-field-pauseSeconds-control"));
    expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(0);
  });

  /**
   * REWORK12 (ACT-07) : `NumberWheelPicker` suit désormais le même contrat
   * brouillon/confirmation que `DurationWheelPicker` — plus d'application
   * immédiate au fil du geste. `Platform.OS` par défaut dans cet
   * environnement Jest (`jest-expo`) est `"ios"` : la roulette native
   * SwiftUI est donc exercée ici (`selectionChange`, jamais `scroll`).
   */
  it("opens the Séries picker (NumberWheelPicker) on its control's press, draft/confirm contract (ACT-07) — never immediate-apply", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Pompes");

    fireEvent.press(screen.getByTestId("exercise-field-seriesCount-control"));
    fireEvent(screen.getByTestId("number-wheel-column"), "selectionChange", {
      nativeEvent: { selection: 3 }, // valeur 3 (bornes 1-99)
    });
    // Brouillon uniquement — le contrôle fermé (`"1"`, valeur initiale) reste affiché tant que Confirmer n'a pas été pressé.
    expect(screen.queryByText("1")).toBeTruthy();

    fireEvent.press(screen.getByTestId("number-wheel-validate"));
    expect(screen.queryByTestId("exercise-series-count-wheel")).toBeNull();
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("Annuler on the Séries picker discards the draft — the control keeps its previous value (ACT-07)", () => {
    renderScreen(null);

    fireEvent.press(screen.getByTestId("exercise-field-seriesCount-control"));
    fireEvent(screen.getByTestId("number-wheel-column"), "selectionChange", {
      nativeEvent: { selection: 7 },
    });
    fireEvent.press(screen.getByTestId("number-wheel-cancel"));

    expect(screen.queryByTestId("exercise-series-count-wheel")).toBeNull();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.queryByText("7")).toBeNull();
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
      within(screen.getByTestId("wheel-picker-overlay")).getByLabelText(
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

/**
 * REWORK09 (point 8), **reformulé par la complétion REWORK12** (D-105) :
 * plus de préfixe `Exercice · Mode X ·`, le nom de l'Activité est désormais
 * intégré au texte — voir `compositionPresentation.test.ts` pour la
 * couverture exhaustive de `formatExerciseRecap` elle-même ; ces tests-ci
 * vérifient uniquement que l'écran la câble correctement (frère du groupe
 * Paramètres, jamais son enfant ; recalculée en direct).
 */
describe("ExerciseScreen — REWORK12 — cadre récapitulatif calculé, reformulé (point 8, ACT-08/09)", () => {
  it("shows a computed recap reflecting the current draft's own name, never a static Figma value, growing with its own content (no fixed height), as a sibling of the Paramètres group", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Pompes");

    const summary = screen.getByTestId("exercise-summary-card");
    const summaryStyle = StyleSheet.flatten(summary.props.style);
    expect(summaryStyle.height).toBeUndefined();
    expect(summaryStyle.borderColor).toBe(colors.tourSurface);
    expect(summaryStyle.borderRadius).toBe(12);

    // Valeurs par défaut de `createExerciseDraft()` : mode Durée, 1 série, pause 0 s.
    expect(within(summary).getByText(/^1 série de Pompes de/)).toBeTruthy();
    expect(within(summary).queryByText(/Exercice/)).toBeNull();
    expect(within(summary).queryByText(/Mode/)).toBeNull();
  });

  it("recomputes the recap after Valider commits a new Durée, and after switching to Répétitions mode", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Pompes");

    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 1);
    fireEvent.press(
      within(screen.getByTestId("wheel-picker-overlay")).getByLabelText(
        t.wheelPicker.validateAccessibilityLabel,
      ),
    );

    // Seules les minutes sont modifiées ; les secondes du brouillon
    // conservent leur valeur initiale (`DEFAULT_EXERCISE_DURATION_SECONDS`
    // = 30 s) — total validé : 1 min 30 s.
    const summary = screen.getByTestId("exercise-summary-card");
    expect(within(summary).getByText(/1 min 30 s/)).toBeTruthy();

    fireEvent.press(screen.getByLabelText(t.executionMode.repetitions));
    expect(within(summary).getByText(/^1 série de 1 Pompes/)).toBeTruthy();
  });

  it("omits the pause clause entirely when pauseSeconds is 0 (default), never showing 'avec 0 s de pause'", () => {
    renderScreen(null);
    const summary = screen.getByTestId("exercise-summary-card");
    expect(within(summary).queryByText(/avec 0 s de pause/)).toBeNull();
    expect(within(summary).queryByText(/avec/)).toBeNull();
  });
});

describe("ExerciseScreen — mode modification (draft.exercises contains the targeted Activity)", () => {
  it("prefills the name from the existing exercise, and shows 'Modifier une activité' (never the Session name) in the header", () => {
    renderScreen({ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 });

    expect(screen.getByLabelText(t.name).props.value).toBe("Gainage");
    expect(within(screen.getByTestId("screen-header")).getByText(t.titleEdit)).toBeTruthy();
  });

  it("Terminer calls updateDraft exactly once, replacing the edited Activity by id inside the exercises collection, and calls router.back()", () => {
    const { updateDraft } = renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Gainage",
      durationSeconds: 45,
    });

    fireEvent.press(screen.getByLabelText(t.validateAction)); // -> Étape 2
    fireEvent.press(screen.getByLabelText(t.finishAction));

    expect(updateDraft).toHaveBeenCalledTimes(1);
    expect(updateDraft).toHaveBeenCalledWith({
      exercises: [expect.objectContaining({ id: "ex-1", name: "Gainage", durationSeconds: 45 })],
    });
  });

  it("a second Terminer press before any intermediate render is a no-op (finishingRef synchronous lock)", () => {
    const { updateDraft } = renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Gainage",
      durationSeconds: 45,
    });

    fireEvent.press(screen.getByLabelText(t.validateAction));
    const finishButton = screen.getByLabelText(t.finishAction);
    fireEvent.press(finishButton);
    fireEvent.press(finishButton);

    expect(updateDraft).toHaveBeenCalledTimes(1);
  });

  /**
   * REWORK12 (ACT-10) : bout en bout mode Répétition — création,
   * validation, `Terminer`, exactement comme le test mode Durée ci-dessus.
   */
  it("REWORK12 (ACT-10) — end-to-end Répétition mode: Terminer persists the exact repetitionCount/pauseSeconds/seriesCount edited via the drafts", () => {
    const { updateDraft } = renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Squats",
      executionMode: "REPETITIONS",
      repetitionCount: 12,
      durationSeconds: null,
      pauseSeconds: 15,
      seriesCount: 3,
    });

    fireEvent.press(screen.getByLabelText(t.validateAction)); // -> Étape 2
    fireEvent.press(screen.getByLabelText(t.finishAction));

    expect(updateDraft).toHaveBeenCalledTimes(1);
    expect(updateDraft).toHaveBeenCalledWith({
      exercises: [
        expect.objectContaining({
          name: "Squats",
          executionMode: "REPETITIONS",
          repetitionCount: 12,
          durationSeconds: null,
          pauseSeconds: 15,
          seriesCount: 3,
        }),
      ],
    });
  });

  /** REWORK12 (ACT-10) : réouverture — les valeurs exactes du brouillon existant sont restituées, mode Répétition inclus (pas seulement le nom, voir le test Durée ci-dessus). */
  it("REWORK12 (ACT-10) — reopening an existing Répétition-mode Activity restores its exact repetitionCount/pauseSeconds/seriesCount", () => {
    renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Squats",
      executionMode: "REPETITIONS",
      repetitionCount: 12,
      durationSeconds: null,
      pauseSeconds: 15,
      seriesCount: 3,
    });

    expect(screen.getByLabelText(t.name).props.value).toBe("Squats");
    expect(screen.getByLabelText(t.executionMode.repetitions).props.accessibilityState.selected).toBe(
      true,
    );
    expect(screen.getByText("12")).toBeTruthy(); // Répétitions
    expect(screen.getByText("00 min 15 s")).toBeTruthy(); // Pause (formatDurationRowValue)
    expect(screen.getByText("3")).toBeTruthy(); // Séries
  });

  /**
   * Complétion REWORK12 (« Plusieurs activités et bouton persistant ») :
   * `Terminer` doit AJOUTER une nouvelle Activité en fin de collection sans
   * jamais écraser une Activité déjà présente lorsqu'aucun `exerciseId` n'a
   * été transmis (parcours ajout, `renderScreen(null)`).
   */
  it("REWORK12 (« Plusieurs activités ») — Terminer on a NEW Activity (no exerciseId param) appends it after any Activity already present in draft.exercises, never replacing it", () => {
    const updateDraft = jest.fn();
    mockSearchParams = {}; // parcours ajout — aucun exerciseId
    const existing: SessionDraftExercise = {
      ...createExerciseDraft("ex-existing"),
      name: "Gainage",
      durationSeconds: 30,
    };
    render(
      <TestSafeAreaProvider>
        <SessionDraftContext.Provider
          value={{
            draft: {
              name: "Séance simple",
              color: "#3B82F6",
              initialCountdownSeconds: 10,
              finalPhaseSeconds: 5,
              exercises: [existing],
              categoryDrafts: [],
      selectedCategoryIds: [],
            },
            updateDraft,
            resetDraft: jest.fn(),
          }}
        >
          <ExerciseScreen />
        </SessionDraftContext.Provider>
      </TestSafeAreaProvider>,
    );

    fireEvent.changeText(screen.getByLabelText(t.name), "Squats");
    fireEvent.press(screen.getByLabelText(t.validateAction));
    fireEvent.press(screen.getByLabelText(t.finishAction));

    expect(updateDraft).toHaveBeenCalledTimes(1);
    expect(updateDraft).toHaveBeenCalledWith({
      exercises: [
        expect.objectContaining({ id: "ex-existing", name: "Gainage" }),
        expect.objectContaining({ id: "generated-exercise-id", name: "Squats" }),
      ],
    });
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
