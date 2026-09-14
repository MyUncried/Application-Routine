import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { ScrollView, StyleSheet } from "react-native";

import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { ExerciseScreen } from "@/features/sessions/ExerciseScreen";
import type { SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { SessionDraftContext } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors, dimensions, minTouchTarget, type } from "@/shared/ui/tokens";

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
 * Rend l'écran en mode AJOUT (`draftExercise` omis — `draft.exercises` vide,
 * aucun `exerciseId` en paramètre de route) ou en mode MODIFICATION
 * (`draftExercise` fourni — inséré dans `draft.exercises` ET son `id`
 * transmis comme `exerciseId`, exactement comme `CompositionScreen.tsx` le
 * fait via `router.push({pathname: "/exercise", params: {exerciseId}})`).
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

  const { unmount } = render(
    <TestSafeAreaProvider>
      <SessionDraftContext.Provider value={contextValue}>
        <ExerciseScreen />
      </SessionDraftContext.Provider>
    </TestSafeAreaProvider>,
  );

  return { updateDraft, unmount };
}

const t = strings.screens.exercise;

/**
 * Nom accessible COMPOSÉ de l'en-tête d'une section repliable (T02-S02) :
 * `« Déployer/Replier la section {titre} »`. Jamais le titre nu — celui-ci
 * est déjà le libellé du champ contenu par la section (voir le bloc
 * « unicité des noms accessibles » plus bas).
 */
function sectionHeaderLabel(title: string, expanded: boolean): string {
  return `${expanded ? t.sections.collapseAction : t.sections.expandAction} ${title}`;
}

/** Déploie une section repliable par son `testID` d'en-tête (jamais par son titre, volontairement non unique). */
function expandSection(testID: string): void {
  fireEvent.press(screen.getByTestId(`${testID}-header`));
}

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

/**
 * Confirme une durée complète sur la roulette ouverte : minutes ET secondes.
 * Ne fixer que les minutes laisserait les secondes du brouillon initial en
 * place — piège réel rencontré sur la roulette de `Durée totale`, dont la
 * valeur initiale n'est pas ronde.
 */
function confirmDuration(minutes: number, seconds: number): void {
  fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), minutes);
  fireNativeSelectionChange(screen.getByTestId("duration-wheel-seconds"), seconds);
  fireEvent.press(
    within(screen.getByTestId("wheel-picker-overlay")).getByLabelText(
      t.wheelPicker.validateAccessibilityLabel,
    ),
  );
}

beforeEach(() => {
  mockExitGuard.mockReset();
  mockExitGuard.mockReturnValue(defaultExitGuardResult());
  mockBack.mockReset();
  mockSearchParams = {};
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

describe("ExerciseScreen — Shell partagé (header/séparateur fixes, bandeau contextuel fixe, formulaire central défilant, action finale fixe)", () => {
  it("uses the shared FixedHeader/HeaderSeparator, showing the functional title 'Ajouter une activité' — never the Session name (D-105)", () => {
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
    expect(within(band).queryByText(new RegExp(t.context.prefix))).toBeNull();
    expect(within(band).queryByText(/Séance simple/u)).toBeNull();
  });

  /**
   * T02-S02 (D-137) : l'écran est UNIFIÉ — le Retour n'a plus d'étape interne
   * à défaire, il quitte toujours réellement l'écran (la garde de sortie
   * intercepte, comme avant, un brouillon sale).
   */
  it("Retour (Action / Back) always calls router.back() — the screen has no internal step to return to any more", () => {
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
    expect(within(body).queryByLabelText(t.finishAction)).toBeNull();
  });

  it("keeps the blue context band — and its media button — visible at all times, the screen having no second step any more", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Pompes");
    expandSection("exercise-section-description");

    expect(screen.getByTestId("exercise-context-band")).toBeTruthy();
    expect(screen.getByTestId("exercise-add-media")).toBeTruthy();
  });
});

/**
 * **T02-S02 (D-137) — écran unifié.** L'étape 2 « Informations
 * complémentaires » (Consigne + Zones corporelles, atteinte par `Valider`)
 * disparaît : Description et Zone corporelle deviennent deux sections
 * REPLIABLES du même écran, Mode d'exécution une troisième, et `Terminer`
 * est l'unique action finale.
 */
describe("ExerciseScreen — écran unifié et sections repliables (T02-S02, D-137, CE-T01-13/CE-T01-15)", () => {
  it("no longer exposes any intermediate Valider action — Terminer is the only final action", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Pompes");

    expect(screen.getByLabelText(t.finishAction)).toBeTruthy();
    expect(screen.queryByText("Informations complémentaires")).toBeNull();
  });

  it("no longer exposes the Type d'activité segment: Récupération is a parameter, not an Activity type", () => {
    renderScreen(null);

    expect(screen.queryByLabelText("Type d’activité")).toBeNull();
    expect(screen.queryByLabelText("Exercice")).toBeNull();
    // « Récupération » n'existe plus que comme LIBELLÉ DE PARAMÈTRE.
    expect(screen.getByTestId("exercise-field-recoverySeconds")).toBeTruthy();
    expect(screen.queryByText("Paramètres de l’activité")).toBeNull();
  });

  it("renders the three collapsible sections in order: Description, Zone corporelle, Mode d'exécution", () => {
    renderScreen(null);

    const order = testIdOrder(screen.toJSON(), [
      "exercise-section-description",
      "exercise-section-body-zones",
      "exercise-section-execution-mode",
      "exercise-parameter-card",
      "exercise-summary-card",
    ]);
    expect(order).toEqual([
      "exercise-section-description",
      "exercise-section-body-zones",
      "exercise-section-execution-mode",
      "exercise-parameter-card",
      "exercise-summary-card",
    ]);
  });

  it("shows the three section titles visibly", () => {
    renderScreen(null);

    const order = textOrder(screen.toJSON(), [
      t.sections.description,
      t.sections.bodyZones,
      t.sections.executionMode,
    ]);
    expect(order).toEqual([
      t.sections.description,
      t.sections.bodyZones,
      t.sections.executionMode,
    ]);
  });

  it("starts with Description and Zone corporelle CLOSED and Mode d'exécution OPEN (CE-T01-15)", () => {
    renderScreen(null);

    expect(screen.queryByTestId("exercise-section-description-content")).toBeNull();
    expect(screen.queryByTestId("exercise-section-body-zones-content")).toBeNull();
    expect(screen.getByTestId("exercise-section-execution-mode-content")).toBeTruthy();
    // Le contenu réellement caché, pas seulement masqué visuellement.
    expect(screen.queryByLabelText(t.instruction.label)).toBeNull();
    expect(screen.queryByLabelText("Dos")).toBeNull();
    expect(screen.getByLabelText(t.executionMode.label)).toBeTruthy();
  });

  it("expands and collapses a section on its header press, exposing then hiding its content", () => {
    renderScreen(null);

    expandSection("exercise-section-description");
    expect(screen.getByTestId("exercise-section-description-content")).toBeTruthy();
    expect(screen.getByLabelText(t.instruction.label)).toBeTruthy();

    expandSection("exercise-section-description");
    expect(screen.queryByTestId("exercise-section-description-content")).toBeNull();
    expect(screen.queryByLabelText(t.instruction.label)).toBeNull();
  });

  /**
   * **T02-S02 (continuation après recette visuelle)** : le chevron de la
   * section `Mode d'exécution` replie et déploie D'UN SEUL GESTE le contrôle
   * segmenté ET l'intégralité du cadre de paramètres — les deux forment un
   * bloc fonctionnel unique (le mode choisi détermine le paramètre affiché
   * par la première rangée).
   */
  it("collapses the segmented control AND the whole parameter card together, from the Mode d'exécution chevron", () => {
    renderScreen(null);

    // Déployée par défaut : les deux sont visibles, et le cadre de
    // paramètres est bien DANS le contenu de la section.
    const content = screen.getByTestId("exercise-section-execution-mode-content");
    expect(within(content).getByLabelText(t.executionMode.label)).toBeTruthy();
    expect(within(content).getByTestId("exercise-parameter-card")).toBeTruthy();

    expandSection("exercise-section-execution-mode");

    // Repliée : ni le segment, ni AUCUN champ de paramètre ne subsiste.
    expect(screen.queryByTestId("exercise-section-execution-mode-content")).toBeNull();
    expect(screen.queryByLabelText(t.executionMode.label)).toBeNull();
    expect(screen.queryByTestId("exercise-parameter-card")).toBeNull();
    for (const field of [
      "exercise-field-seriesCount",
      "exercise-field-duration",
      "exercise-field-pauseSeconds",
      "exercise-field-recoverySeconds",
      "exercise-field-totalDuration",
    ]) {
      expect(screen.queryByTestId(field)).toBeNull();
    }

    // Redéployée : tout revient ensemble.
    expandSection("exercise-section-execution-mode");
    expect(screen.getByTestId("exercise-parameter-card")).toBeTruthy();
    expect(screen.getByLabelText(t.executionMode.label)).toBeTruthy();
  });

  it("keeps a REDUCED vertical gap between the segmented control and the parameter card, not the structural section gap", () => {
    renderScreen(null);

    const groupStyle = StyleSheet.flatten(
      screen.getByTestId("exercise-execution-mode-group").props.style,
    );
    // `8` — le même token que l'écart interne du cadre de paramètres, et non
    // l'écart structurel `24` de `bodyContent` qui séparait auparavant les
    // deux éléments.
    expect(groupStyle.gap).toBe(8);
    expect(groupStyle.gap).toBeLessThan(24);
  });

  it("reports the expanded state on each header, and reflects the toggle", () => {
    renderScreen(null);

    const header = screen.getByTestId("exercise-section-description-header");
    expect(header.props.accessibilityRole).toBe("button");
    expect(header.props.accessibilityState).toMatchObject({ expanded: false });

    fireEvent.press(header);
    expect(
      screen.getByTestId("exercise-section-description-header").props.accessibilityState,
    ).toMatchObject({ expanded: true });
  });

  it("uses the canonical DSF Disclosure control for the chevron, never a local graphic copy", () => {
    renderScreen(null);

    expect(screen.getByTestId("exercise-section-description-disclosure-frame")).toBeTruthy();
    expect(screen.getByTestId("exercise-section-description-disclosure-chevron")).toBeTruthy();
  });

  it("exposes exactly ONE accessible button per section header — the nested chevron never adds a second one", () => {
    renderScreen(null);

    // Le chevron imbriqué est rendu DÉCORATIF (`decorative`, voir
    // `DisclosureControl.test.tsx`) : l'en-tête reste le seul nœud nommé et
    // le seul bouton de la section. Sans cela, chaque section exposerait deux
    // boutons superposés, dont un sans nom.
    for (const [testID, title, expanded] of [
      ["exercise-section-description", t.sections.description, false],
      ["exercise-section-body-zones", t.sections.bodyZones, false],
      ["exercise-section-execution-mode", t.sections.executionMode, true],
    ] as const) {
      const header = screen.getByTestId(`${testID}-header`);
      expect(header.props.accessibilityLabel).toBe(sectionHeaderLabel(title, expanded));
      expect(screen.getAllByLabelText(sectionHeaderLabel(title, expanded))).toHaveLength(1);
    }
  });
});

/**
 * **T02-S02 — unicité des noms accessibles (correctif du run 34288992856).**
 *
 * Le titre d'une section repliable EST le libellé du champ qu'elle contient
 * (« Description de l'activité » pour le champ multiligne, « Zone corporelle
 * d'exécution » pour le sélecteur, « Mode d'exécution » pour le segment) :
 * c'est le même élément fonctionnel, et renommer l'un des deux dégraderait
 * l'interface. L'unicité est donc obtenue en composant le nom accessible de
 * l'EN-TÊTE (`{action} {titre}`) et en rendant le chevron imbriqué décoratif
 * — jamais en renommant le champ.
 */
describe("ExerciseScreen — unicité des noms accessibles des sections (T02-S02)", () => {
  it("keeps EXACTLY ONE node named « Description de l'activité » — the field itself — once the section is expanded", () => {
    renderScreen(null);
    expandSection("exercise-section-description");

    const matches = screen.getAllByLabelText(t.instruction.label);
    expect(matches).toHaveLength(1);
    // Et c'est bien le champ de saisie, pas l'en-tête.
    expect(matches[0]!.props.testID).toBe("exercise-instruction-input");
    // `getByLabelText` (singulier) ne doit plus jamais lever « Found multiple
    // elements with accessibility label ».
    expect(() => screen.getByLabelText(t.instruction.label)).not.toThrow();
  });

  it("keeps EXACTLY ONE node named « Zones corporelles » and ONE named « Mode d'exécution »", () => {
    renderScreen(null);
    expandSection("exercise-section-body-zones");

    expect(screen.getAllByLabelText(t.bodyZones.accessibilityLabel)).toHaveLength(1);
    expect(screen.getAllByLabelText(t.executionMode.label)).toHaveLength(1);
  });

  /**
   * T02-S02 (continuation après recette visuelle) : « Zone corporelle
   * d'exécution » devient « Zones corporelles ». Le titre de section et le
   * libellé du sélecteur restent la MÊME chaîne — l'unicité du nom accessible
   * continue de reposer sur la composition du nom de l'en-tête.
   */
  it("renames the body-zones section to « Zones corporelles », title and selector alike", () => {
    renderScreen(null);

    expect(t.sections.bodyZones).toBe("Zones corporelles");
    expect(t.bodyZones.accessibilityLabel).toBe("Zones corporelles");
    expect(t.bodyZones.label).toBe(t.sections.bodyZones);
    expect(screen.getByText("Zones corporelles")).toBeTruthy();
    expect(screen.queryByText(/Zone corporelle d/u)).toBeNull();
  });

  it("names each section header with the ACTION and its target, never with the bare title", () => {
    renderScreen(null);

    expect(
      screen.getByLabelText(sectionHeaderLabel(t.sections.description, false)),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(sectionHeaderLabel(t.sections.executionMode, true)),
    ).toBeTruthy();

    expandSection("exercise-section-description");
    expect(
      screen.getByLabelText(sectionHeaderLabel(t.sections.description, true)),
    ).toBeTruthy();
    expect(
      screen.queryByLabelText(sectionHeaderLabel(t.sections.description, false)),
    ).toBeNull();
  });

  it("does not degrade the field's own accessible name: it stays exactly the documented label", () => {
    renderScreen(null);
    expandSection("exercise-section-description");

    const field = screen.getByTestId("exercise-instruction-input");
    expect(field.props.accessibilityLabel).toBe("Description de l’activité");
    expect(field.props.placeholder).toBe("Description de l’activité");
    expect(field.props.multiline).toBe(true);
  });
});

describe("ExerciseScreen — Champ Nom de l'activité (zone bleue contextuelle, D-105)", () => {
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
  });

  it("keeps Terminer disabled while the name is empty, enabled once Nom and the default Durée are both valid", () => {
    renderScreen(null);
    expect(screen.getByLabelText(t.finishAction).props.accessibilityState).toMatchObject({
      disabled: true,
    });

    fireEvent.changeText(screen.getByLabelText(t.name), "Pompes");
    expect(screen.getByLabelText(t.finishAction).props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });

  it("never calls the shared updateDraft while editing — only Terminer writes", () => {
    const { updateDraft } = renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Pompes");
    expandSection("exercise-section-description");
    fireEvent.changeText(screen.getByLabelText(t.instruction.label), "Dos droit");

    expect(updateDraft).not.toHaveBeenCalled();
  });
});

describe("ExerciseScreen — segment Mode d'exécution (Controls / Segmented)", () => {
  it("exposes three equal-width mode options (Durée / Répétitions / À l'échec) inside its own collapsible section", () => {
    renderScreen(null);

    const section = screen.getByTestId("exercise-section-execution-mode-content");
    expect(within(section).getByLabelText(t.executionMode.duration)).toBeTruthy();
    expect(within(section).getByLabelText(t.executionMode.repetitions)).toBeTruthy();
    expect(within(section).getByLabelText(t.executionMode.toFailure)).toBeTruthy();
  });

  it("colours the selected segment with color.selection (#5F60EE) and white text, the unselected one transparent with color.textSecondary text", () => {
    renderScreen(null);

    const durationTab = screen.getByLabelText(t.executionMode.duration);
    const durationLabel = within(durationTab).getByText(t.executionMode.duration);
    expect(StyleSheet.flatten(durationTab.props.style).backgroundColor).toBe(colors.selection);
    expect(StyleSheet.flatten(durationTab.props.style).backgroundColor).toBe("#5F60EE");
    expect(StyleSheet.flatten(durationLabel.props.style).color).toBe(colors.background);

    const repetitionsTab = screen.getByLabelText(t.executionMode.repetitions);
    expect(StyleSheet.flatten(repetitionsTab.props.style).backgroundColor).not.toBe(
      colors.selection,
    );
  });

  it("gives every segment a strictly equal width via flex:1 inside the 354×42 container", () => {
    renderScreen(null);

    const container = screen.getByLabelText(t.executionMode.label);
    const containerStyle = StyleSheet.flatten(container.props.style);
    expect(containerStyle.width).toBe("100%");
    expect(containerStyle.height).toBe(42);
    expect(containerStyle.backgroundColor).toBe(colors.background);
    expect(containerStyle.borderColor).toBe(colors.border);

    const durationStyle = StyleSheet.flatten(
      screen.getByLabelText(t.executionMode.duration).props.style,
    );
    const toFailureStyle = StyleSheet.flatten(
      screen.getByLabelText(t.executionMode.toFailure).props.style,
    );
    expect(durationStyle.flex).toBe(1);
    expect(durationStyle.alignItems).toBe("center");
    expect(durationStyle.justifyContent).toBe("center");
    expect(durationStyle.flex).toBe(toFailureStyle.flex);
  });

  it("switching to Répétitions clears durationSeconds and requires a valid repetitionCount for Terminer", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Fentes");
    fireEvent.press(screen.getByLabelText(t.executionMode.repetitions));

    expect(screen.getByLabelText(t.repetitionCount.accessibilityLabel)).toBeTruthy();
    expect(screen.queryByLabelText(t.duration.accessibilityLabel)).toBeNull();
    expect(screen.getByLabelText(t.finishAction).props.accessibilityState).toMatchObject({
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
  });

  it("shows the plural 'Répétitions' as the mode segment's visible label and accessible name — never the singular", () => {
    renderScreen(null);

    expect(t.executionMode.repetitions).toBe("Répétitions");
    const segment = screen.getByLabelText(t.executionMode.repetitions);
    expect(segment.props.accessibilityRole).toBe("tab");
    expect(within(segment).getByText("Répétitions")).toBeTruthy();

    const modeGroup = screen.getByLabelText(t.executionMode.label);
    expect(within(modeGroup).queryByText("Répétition")).toBeNull();
  });
});

describe("ExerciseScreen — mode À l'échec (T01-S10, D-111, frame 3369:4236)", () => {
  it("switching to À l'échec hides the Durée and Répétitions target fields, keeps Séries, Pause and Récupération, and needs only a valid Nom", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Tractions");
    fireEvent.press(screen.getByLabelText(t.executionMode.toFailure));

    expect(screen.queryByLabelText(t.duration.accessibilityLabel)).toBeNull();
    expect(screen.queryByLabelText(t.repetitionCount.accessibilityLabel)).toBeNull();
    expect(screen.getByLabelText(t.pauseSeconds.accessibilityLabel)).toBeTruthy();
    expect(screen.getByLabelText(t.seriesCount.accessibilityLabel)).toBeTruthy();
    expect(screen.getByLabelText(t.recoverySeconds.accessibilityLabel)).toBeTruthy();

    expect(screen.getByLabelText(t.finishAction).props.accessibilityState).toMatchObject({
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

  it("shows a static, non-pressable 'À l'échec' badge in the mode-parameter slot, in the violet selection token, without a chevron", () => {
    renderScreen(null);
    fireEvent.press(screen.getByLabelText(t.executionMode.toFailure));

    const row = screen.getByTestId("exercise-parameter-row");
    const badge = within(row).getByTestId("exercise-field-toFailure");
    expect(within(badge).getByText(t.executionMode.toFailure)).toBeTruthy();

    const control = screen.getByTestId("exercise-field-toFailure-control");
    expect(control.props.accessibilityRole).not.toBe("button");
    expect(screen.queryByTestId("exercise-field-toFailure-chevron")).toBeNull();
    expect(screen.queryByTestId("exercise-field-toFailure-chevron-box")).toBeNull();

    const label = within(badge).getByText(t.executionMode.toFailure);
    expect(StyleSheet.flatten(label.props.style).color).toBe(colors.selection);
    expect(StyleSheet.flatten(control.props.style).width).toBe(124);
  });

  /**
   * **T02-S02 (seconde recette visuelle, point 2)** — le cadre devait
   * REMONTER. La cale de hauteur FIXE posée à la continuation précédente
   * présumait qu'un `Text` de style `parameterColumnLabel` occupe exactement
   * sa `lineHeight` ; la mesure réelle du moteur de texte ne le garantit pas,
   * d'où un décalage résiduel visible. La réservation est désormais un `Text`
   * RÉEL du MÊME style : mêmes métriques, donc même hauteur mesurée que le
   * libellé de `Séries`/`Pause`, et alignement vrai par construction.
   */
  it("aligns the À l'échec badge on the SAME baseline as Séries and Pause, and makes its background transparent", () => {
    renderScreen(null);
    fireEvent.press(screen.getByLabelText(t.executionMode.toFailure));

    // Réservation de place = un `Text` du MÊME style que les libellés
    // voisins, et non une boîte de hauteur devinée.
    const spacer = screen.getByTestId("exercise-field-toFailure-label-spacer", {
      includeHiddenElements: true,
    });
    expect(spacer.props.numberOfLines).toBe(1);
    expect(StyleSheet.flatten(spacer.props.style)).toEqual(
      StyleSheet.flatten(
        within(screen.getByTestId("exercise-field-pauseSeconds")).getByText(
          t.pauseSeconds.compactLabel,
        ).props.style,
      ),
    );
    // Aucun contenu lisible, et retiré de l'arbre d'accessibilité : c'est une
    // réservation de place, jamais un libellé fantôme.
    expect(String(spacer.props.children).trim()).toBe("");
    expect(spacer.props.accessible).toBe(false);

    // Même écart libellé/cadre que ses voisines.
    expect(
      StyleSheet.flatten(screen.getByTestId("exercise-field-toFailure").props.style).gap,
    ).toBe(
      StyleSheet.flatten(screen.getByTestId("exercise-field-pauseSeconds").props.style).gap,
    );

    // Fond TRANSPARENT : ce cadre n'ouvre rien, il ne reprend donc pas la
    // surface blanche des contrôles réellement pressables.
    const controlStyle = StyleSheet.flatten(
      screen.getByTestId("exercise-field-toFailure-control").props.style,
    );
    expect(controlStyle.backgroundColor).toBe("transparent");
    expect(controlStyle.backgroundColor).not.toBe(colors.background);
    // Même hauteur de cadre que les contrôles voisins — l'alignement est
    // réel, pas approché.
    expect(controlStyle.height).toBe(
      StyleSheet.flatten(screen.getByTestId("exercise-field-pauseSeconds-control").props.style)
        .height,
    );
  });
});

/**
 * **T02-S02 (seconde recette visuelle, point 9)** — `Durée totale` reste
 * AFFICHÉE dans les modes non chronométrés, mais purement INFORMATIVE : la
 * durée d'une Série y est inconnue, le calcul inverse n'a donc aucun sens.
 * Cette règle remplace la demande antérieure de MASQUER ce champ.
 */
describe("ExerciseScreen — Durée totale informative en Répétitions et À l'échec (T02-S02)", () => {
  const nonTimedModes = [
    ["Répétitions", () => strings.screens.exercise.executionMode.repetitions] as const,
    ["À l'échec", () => strings.screens.exercise.executionMode.toFailure] as const,
  ];

  for (const [modeName, modeLabel] of nonTimedModes) {
    it(`keeps Durée totale VISIBLE in ${modeName} mode, labelled with the ≥ lower bound`, () => {
      renderScreen(null);
      fireEvent.press(screen.getByLabelText(modeLabel()));

      const field = screen.getByTestId("exercise-field-totalDuration");
      expect(field).toBeTruthy();
      expect(within(field).getByText(t.totalDuration.compactLabelLowerBound)).toBeTruthy();
      expect(t.totalDuration.compactLabelLowerBound).toBe("Durée totale ≥");
      // Le libellé du mode Durée n'est plus celui affiché.
      expect(within(field).queryByText(t.totalDuration.compactLabel)).toBeNull();
    });

    it(`makes Durée totale non-modifiable in ${modeName} mode: no chevron, no press, no wheel`, () => {
      renderScreen(null);
      fireEvent.press(screen.getByLabelText(modeLabel()));

      const control = screen.getByTestId("exercise-field-totalDuration-control");
      // Ni bouton, ni geste : il n'y a RIEN à presser — le champ n'expose
      // aucun gestionnaire, donc aucune roulette ne peut s'ouvrir.
      expect(control.props.accessibilityRole).not.toBe("button");
      expect(control.props.onPress).toBeUndefined();
      expect(control.props.onStartShouldSetResponder).toBeUndefined();
      // Aucun chevron.
      expect(screen.queryByTestId("exercise-field-totalDuration-chevron")).toBeNull();
      expect(screen.queryByTestId("exercise-field-totalDuration-chevron-box")).toBeNull();

      // Aucune roulette associée n'est montée.
      expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();
      expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
    });

    it(`renders Durée totale with a transparent background and violet text in ${modeName} mode`, () => {
      renderScreen(null);
      fireEvent.press(screen.getByLabelText(modeLabel()));

      const controlStyle = StyleSheet.flatten(
        screen.getByTestId("exercise-field-totalDuration-control").props.style,
      );
      expect(controlStyle.backgroundColor).toBe("transparent");
      expect(controlStyle.backgroundColor).not.toBe(colors.background);

      // Texte violet — le seul token « violet » canonique du DSF.
      const value = within(screen.getByTestId("exercise-field-totalDuration-control")).getByText(
        /min/u,
      );
      expect(StyleSheet.flatten(value.props.style).color).toBe(colors.selection);
    });
  }

  it("keeps the value informative and up to date — it still reflects the derived total", () => {
    renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Squats",
      executionMode: "REPETITIONS",
      repetitionCount: 12,
      durationSeconds: null,
      seriesCount: 3,
      pauseSeconds: 20,
    });

    // Aucune durée d'Exercice : 3 × 20 = 60 s de Pause.
    expect(
      within(screen.getByTestId("exercise-field-totalDuration-control")).getByText("01 min 00 s"),
    ).toBeTruthy();
  });

  it("restores the fully interactive Durée totale as soon as the Durée mode is selected again", () => {
    renderScreen(null);
    fireEvent.press(screen.getByLabelText(t.executionMode.toFailure));
    expect(screen.queryByTestId("exercise-field-totalDuration-chevron")).toBeNull();

    fireEvent.press(screen.getByLabelText(t.executionMode.duration));

    const control = screen.getByTestId("exercise-field-totalDuration-control");
    expect(control.props.accessibilityRole).toBe("button");
    expect(screen.getByTestId("exercise-field-totalDuration-chevron")).toBeTruthy();
    expect(within(screen.getByTestId("exercise-field-totalDuration")).getByText(
      t.totalDuration.compactLabel,
    )).toBeTruthy();

    fireEvent.press(control);
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();
  });
});

describe("ExerciseScreen — bouton média désactivé, aucune section Médias (T01-S10, doc13 §8)", () => {
  it("renders a centered 'Ajouter un média' button, visible but disabled, with no Media section and no wired behaviour", () => {
    renderScreen(null);

    const mediaButton = screen.getByTestId("exercise-add-media");
    expect(within(mediaButton).getByText(t.addMedia)).toBeTruthy();
    expect(mediaButton.props.accessibilityState).toMatchObject({ disabled: true });
    expect(StyleSheet.flatten(mediaButton.props.style).alignSelf).toBe("center");
    expect(() => fireEvent.press(mediaButton)).not.toThrow();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("the '+' is never a text character: the label has no leading '+', and the canonical action-add icon is rendered instead", () => {
    renderScreen(null);

    expect(t.addMedia.startsWith("+")).toBe(false);
    expect(screen.queryByText(/^\+/u)).toBeNull();
    expect(
      within(screen.getByTestId("exercise-add-media")).getByTestId("exercise-add-media-icon"),
    ).toBeTruthy();
  });

  it("renders that button INSIDE the blue context band, immediately under the Nom de l'activité field", () => {
    renderScreen(null);

    const band = screen.getByTestId("exercise-context-band");
    expect(within(band).getByTestId("exercise-add-media")).toBeTruthy();

    const body = screen.getByTestId("exercise-body");
    expect(within(body).queryByTestId("exercise-add-media")).toBeNull();
    expect(screen.getAllByTestId("exercise-add-media")).toHaveLength(1);

    const order = testIdOrder(screen.toJSON(), ["exercise-name-input", "exercise-add-media"]);
    expect(order).toEqual(["exercise-name-input", "exercise-add-media"]);
  });

  it("keeps the blue context band at the canonical DSF height of 115pt", () => {
    renderScreen(null);

    const bandStyle = StyleSheet.flatten(screen.getByTestId("exercise-context-band").props.style);
    expect(bandStyle.height).toBe(115);
    expect(bandStyle.paddingTop).toBe(12);
    expect(bandStyle.justifyContent).toBe("space-between");
  });
});

describe("ExerciseScreen — Rangées compactes des paramètres (Activity / Parameter Row — Source exact)", () => {
  it("renders TWO rows inside the 354-wide card: Séries/mode/Pause, then Récupération/Durée totale", () => {
    renderScreen(null);

    const card = screen.getByTestId("exercise-parameter-card");
    expect(StyleSheet.flatten(card.props.style).width).toBe(354);

    const row = screen.getByTestId("exercise-parameter-row");
    const rowStyle = StyleSheet.flatten(row.props.style);
    expect(rowStyle.width).toBe(338);
    expect(rowStyle.height).toBe(66);
    expect(rowStyle.flexDirection).toBe("row");
    expect(rowStyle.gap).toBe(8);

    expect(within(row).getByTestId("exercise-field-seriesCount")).toBeTruthy();
    expect(within(row).getByTestId("exercise-field-duration")).toBeTruthy();
    expect(within(row).getByTestId("exercise-field-pauseSeconds")).toBeTruthy();

    const secondRow = screen.getByTestId("exercise-parameter-row-secondary");
    expect(within(secondRow).getByTestId("exercise-field-recoverySeconds")).toBeTruthy();
    expect(within(secondRow).getByTestId("exercise-field-totalDuration")).toBeTruthy();
  });

  it("orders the first row as Séries, then the mode's own parameter, then Pause (Durée mode)", () => {
    renderScreen(null);

    expect(
      testIdOrder(screen.toJSON(), [
        "exercise-field-seriesCount",
        "exercise-field-duration",
        "exercise-field-pauseSeconds",
      ]),
    ).toEqual([
      "exercise-field-seriesCount",
      "exercise-field-duration",
      "exercise-field-pauseSeconds",
    ]);
  });

  it("orders the second row as Récupération, then Durée totale (CE-T01-14)", () => {
    renderScreen(null);

    expect(
      testIdOrder(screen.toJSON(), [
        "exercise-field-recoverySeconds",
        "exercise-field-totalDuration",
      ]),
    ).toEqual(["exercise-field-recoverySeconds", "exercise-field-totalDuration"]);
  });

  /**
   * T02-S02 (continuation après recette visuelle) : la seconde rangée est
   * décalée d'une colonne, pour aligner `Récupération` sous le contrôle du
   * mode (`Durée`/`Répétitions`) et `Durée totale` sous `Pause`.
   */
  it("offsets the second row by exactly one Séries column, aligning Récupération under the mode control and Durée totale under Pause", () => {
    renderScreen(null);

    const secondRow = screen.getByTestId("exercise-parameter-row-secondary");
    const spacer = within(secondRow).getByTestId("exercise-parameter-row-spacer");
    // La cale précède les deux champs et vaut EXACTEMENT la largeur de la
    // colonne `Séries` : `74 + gap` décale la rangée d'une colonne pleine.
    expect(StyleSheet.flatten(spacer.props.style).width).toBe(74);
    expect(
      StyleSheet.flatten(screen.getByTestId("exercise-field-seriesCount").props.style).width,
    ).toBe(74);
    expect(
      testIdOrder(screen.toJSON(), [
        "exercise-parameter-row-spacer",
        "exercise-field-recoverySeconds",
        "exercise-field-totalDuration",
      ]),
    ).toEqual([
      "exercise-parameter-row-spacer",
      "exercise-field-recoverySeconds",
      "exercise-field-totalDuration",
    ]);
    // La cale est purement structurelle : ni nom accessible, ni rôle.
    expect(spacer.props.accessibilityRole).toBeUndefined();
    expect(spacer.props.accessibilityLabel).toBeUndefined();
  });

  it("gives Durée, Pause, Récupération and Durée totale a 124pt column and Séries a 74pt column, with labels above each control", () => {
    renderScreen(null);

    for (const [testID, label] of [
      ["exercise-field-duration", t.duration.label],
      ["exercise-field-pauseSeconds", t.pauseSeconds.compactLabel],
      ["exercise-field-recoverySeconds", t.recoverySeconds.compactLabel],
      ["exercise-field-totalDuration", t.totalDuration.compactLabel],
    ] as const) {
      const field = screen.getByTestId(testID);
      expect(StyleSheet.flatten(field.props.style).width).toBe(124);
      expect(within(field).getByText(label)).toBeTruthy();
    }

    const seriesField = screen.getByTestId("exercise-field-seriesCount");
    expect(StyleSheet.flatten(seriesField.props.style).width).toBe(74);
    expect(within(seriesField).getByText(t.seriesCount.compactLabel)).toBeTruthy();

    const controlStyle = StyleSheet.flatten(
      screen.getByTestId("exercise-field-duration-control").props.style,
    );
    expect(controlStyle.height).toBe(42);
    expect(controlStyle.backgroundColor).toBe(colors.background);
    expect(controlStyle.borderColor).toBe(colors.exerciseParameterControlBorder);
    expect(controlStyle.borderRadius).toBe(10);
  });

  it("gives every parameter control the canonical 28×28 chevron square (#CDCEFA, rayon 6) with a white 14×14 chevron", () => {
    renderScreen(null);

    for (const fieldTestID of [
      "exercise-field-duration",
      "exercise-field-pauseSeconds",
      "exercise-field-seriesCount",
      "exercise-field-recoverySeconds",
      "exercise-field-totalDuration",
    ]) {
      const chevronBoxStyle = StyleSheet.flatten(
        screen.getByTestId(`${fieldTestID}-chevron-box`).props.style,
      );
      expect(chevronBoxStyle.width).toBe(28);
      expect(chevronBoxStyle.height).toBe(28);
      expect(chevronBoxStyle.backgroundColor).toBe(colors.tourSurface);
      expect(chevronBoxStyle.backgroundColor).toBe("#CDCEFA");
      expect(chevronBoxStyle.borderRadius).toBe(6);

      const chevronStyle = StyleSheet.flatten(
        screen.getByTestId(`${fieldTestID}-chevron`).props.style,
      );
      expect(chevronStyle.width).toBe(14);
      expect(chevronStyle.height).toBe(14);
    }
  });

  /**
   * **T02-S02 (continuation après recette visuelle, point DSF)** : le cadre
   * visible garde sa hauteur canonique `42` (`Forms / Select Field`), mais il
   * OUVRE une roulette — sa cible tactile doit atteindre `48`
   * (`size/touch-target-min`), obtenue par `hitSlop` comme partout ailleurs
   * dans ce projet, jamais en agrandissant la boîte visuelle.
   */
  it("keeps the 42pt visible frame but reaches the canonical 48pt touch target on every wheel-opening control", () => {
    renderScreen(null);

    for (const testID of [
      "exercise-field-seriesCount-control",
      "exercise-field-duration-control",
      "exercise-field-pauseSeconds-control",
      "exercise-field-recoverySeconds-control",
      "exercise-field-totalDuration-control",
    ]) {
      const control = screen.getByTestId(testID);
      expect(control.props.accessibilityRole).toBe("button");

      const visualHeight = StyleSheet.flatten(control.props.style).height;
      expect(visualHeight).toBe(42);

      const hitSlop = control.props.hitSlop as { top: number; bottom: number };
      expect(visualHeight + hitSlop.top + hitSlop.bottom).toBe(minTouchTarget);
      expect(minTouchTarget).toBe(48);
    }
  });
});

/**
 * T02-S02 — Récupération ATTACHÉE (CE-T01-14) : même contrat de roulette
 * minutes/secondes que Durée et Pause (« `Durée`, `Pause`, `Récupération` et
 * `Durée totale` héritent du même contrat »), aucun écran supplémentaire.
 */
describe("ExerciseScreen — Récupération attachée (T02-S02)", () => {
  it("starts at 00 min 00 s — a neutral value, never a default recovery nobody asked for", () => {
    renderScreen(null);

    expect(
      within(screen.getByTestId("exercise-field-recoverySeconds-control")).getByText(
        "00 min 00 s",
      ),
    ).toBeTruthy();
  });

  it("opens the canonical duration wheel and applies the confirmed value to the control", () => {
    renderScreen(null);

    fireEvent.press(screen.getByTestId("exercise-field-recoverySeconds-control"));
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();
    expect(screen.getByTestId("wheel-picker-overlay")).toBeTruthy();

    confirmDuration(1, 30);

    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
    expect(
      within(screen.getByTestId("exercise-field-recoverySeconds-control")).getByText(
        "01 min 30 s",
      ),
    ).toBeTruthy();
  });

  it("Annuler discards the drafted Récupération (same draft/confirm contract as Durée)", () => {
    renderScreen(null);

    fireEvent.press(screen.getByTestId("exercise-field-recoverySeconds-control"));
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 2);
    fireEvent.press(screen.getByLabelText(t.wheelPicker.cancelAccessibilityLabel));

    expect(
      within(screen.getByTestId("exercise-field-recoverySeconds-control")).getByText(
        "00 min 00 s",
      ),
    ).toBeTruthy();
  });

  it("adds the Récupération clause to the fixed recap and to the total duration", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Pompes");

    fireEvent.press(screen.getByTestId("exercise-field-recoverySeconds-control"));
    confirmDuration(1, 0);

    const summary = screen.getByTestId("exercise-summary-card");
    expect(within(summary).getByText(/puis 1 min de récupération\.$/u)).toBeTruthy();
    // Durée par défaut 30 s, 1 Série, aucune Pause → 30 + 60 = 90 s.
    expect(within(summary).getByText("Durée totale : 1 min 30 s")).toBeTruthy();
  });

  it("restores an existing Activity's Récupération when reopened for edition", () => {
    renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Gainage",
      durationSeconds: 45,
      recoverySeconds: 75,
    });

    expect(
      within(screen.getByTestId("exercise-field-recoverySeconds-control")).getByText(
        "01 min 15 s",
      ),
    ).toBeTruthy();
  });

  it("persists the Récupération through Terminer", () => {
    const { updateDraft } = renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Gainage",
      durationSeconds: 45,
    });

    fireEvent.press(screen.getByTestId("exercise-field-recoverySeconds-control"));
    confirmDuration(0, 20);
    fireEvent.press(screen.getByLabelText(t.finishAction));

    expect(updateDraft).toHaveBeenCalledWith({
      exercises: [expect.objectContaining({ id: "ex-1", recoverySeconds: 20 })],
    });
  });
});

/**
 * T02-S02 — dépendance bidirectionnelle `Séries ↔ Durée totale`
 * (RM-129/RM-130, DM-015/DM-016). La Durée totale est DÉRIVÉE : la modifier
 * n'écrit QUE `seriesCount`.
 */
describe("ExerciseScreen — pilotage Séries ↔ Durée totale (T02-S02)", () => {
  it("derives the displayed total from the current parameters, recomputing on every change", () => {
    renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Gainage",
      durationSeconds: 30,
      seriesCount: 3,
      pauseSeconds: 15,
    });

    // Aucune Récupération : 3 × 30 + 3 × 15 = 135 s.
    expect(
      within(screen.getByTestId("exercise-field-totalDuration-control")).getByText("02 min 15 s"),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("exercise-field-seriesCount-control"));
    fireEvent(screen.getByTestId("number-wheel-column"), "selectionChange", {
      nativeEvent: { selection: 4 }, // la roulette Séries porte la VALEUR, jamais un index
    });
    fireEvent.press(screen.getByTestId("number-wheel-validate"));

    // 4 × 30 + 4 × 15 = 180 s.
    expect(
      within(screen.getByTestId("exercise-field-totalDuration-control")).getByText("03 min 00 s"),
    ).toBeTruthy();
  });

  /**
   * T02-S02 (règle métier confirmée) : confirmer une Récupération retire la
   * dernière Pause du total — la Durée totale dérivée baisse donc de `B` et
   * remonte de `R`, jamais des deux à la fois.
   */
  it("recomputes the derived total the moment a Récupération replaces the last pause", () => {
    renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Gainage",
      durationSeconds: 30,
      seriesCount: 3,
      pauseSeconds: 15,
    });

    expect(
      within(screen.getByTestId("exercise-field-totalDuration-control")).getByText("02 min 15 s"),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("exercise-field-recoverySeconds-control"));
    confirmDuration(0, 15); // Récupération ÉGALE à la Pause

    // 3 × 30 + 2 × 15 + 15 = 135 s — inchangé : la Récupération a REMPLACÉ
    // la dernière Pause, elle ne s'y est pas ajoutée (sinon 150 s).
    expect(
      within(screen.getByTestId("exercise-field-totalDuration-control")).getByText("02 min 15 s"),
    ).toBeTruthy();
  });

  it("confirming a reachable total drives the series count and shows NO adjustment message", () => {
    renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Gainage",
      durationSeconds: 30,
      seriesCount: 1,
      pauseSeconds: 10,
    });

    fireEvent.press(screen.getByTestId("exercise-field-totalDuration-control"));
    // `A + B = 40`, aucune Récupération : `160 / 40 = 4` Séries exactement.
    confirmDuration(2, 40);

    expect(
      within(screen.getByTestId("exercise-field-seriesCount-control")).getByText("4"),
    ).toBeTruthy();
    expect(screen.queryByTestId("exercise-adjustment-notification")).toBeNull();
  });

  /**
   * **T02-S02 (continuation après recette visuelle)** : le message
   * d'ajustement est rendu dans la NOTIFICATION NOIRE TEMPORAIRE canonique,
   * porteuse de son action `Annuler` — plus jamais comme un texte permanent
   * inséré dans le corps de l'écran.
   */
  it("announces the adjustment in the canonical transient notification, with its Annuler action (RM-130, D-136)", () => {
    renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Gainage",
      durationSeconds: 30,
      seriesCount: 1,
      pauseSeconds: 10,
    });

    fireEvent.press(screen.getByTestId("exercise-field-totalDuration-control"));
    confirmDuration(2, 30); // 150 s ⇒ 3,75 Séries → 4 → 4 × 40 = 160 s

    expect(
      within(screen.getByTestId("exercise-field-seriesCount-control")).getByText("4"),
    ).toBeTruthy();

    const notification = screen.getByTestId("exercise-adjustment-notification");
    expect(
      within(notification).getByTestId("exercise-adjustment-notification-message").props.children,
    ).toBe("Durée ajustée à 2 min 40 s pour respecter un nombre entier de Séries.");
    expect(within(notification).getByLabelText(t.adjustedTotalDurationUndoAction)).toBeTruthy();

    // Fond noir canonique des messages temporaires (`color.snackbar`), porté
    // par la SURFACE, et superposition portée par le calque : elle ne
    // participe à aucune mise en page.
    expect(
      StyleSheet.flatten(
        within(notification).getByTestId("exercise-adjustment-notification-card").props.style,
      ).backgroundColor,
    ).toBe(colors.snackbar);
    expect(StyleSheet.flatten(notification.props.style).position).toBe("absolute");
    // Plus aucun message permanent dans le corps de l'écran.
    expect(screen.queryByTestId("exercise-adjustment-message")).toBeNull();
    expect(within(screen.getByTestId("exercise-body")).queryByText(/Durée ajustée/u)).toBeNull();
  });

  /**
   * **T02-S02 (seconde recette visuelle, point 5 — préservé par la
   * troisième)** : la notification doit être exactement centrée verticalement
   * SUR le bouton `Terminer`, qu'elle masque le temps de son affichage. Le
   * centrage est désormais porté par `justifyContent` du calque : la surface
   * noire, plus haute que le bouton pour accueillir deux lignes, déborde donc
   * symétriquement de part et d'autre de lui.
   */
  it("covers the Terminer button exactly, centred on it — never anchored to the screen bottom", () => {
    renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Gainage",
      durationSeconds: 30,
      seriesCount: 1,
      pauseSeconds: 10,
    });

    fireEvent.press(screen.getByTestId("exercise-field-totalDuration-control"));
    confirmDuration(2, 30);

    // Elle est rendue DANS le conteneur qui porte l'action finale : c'est ce
    // parent, et lui seul, qui définit sa position.
    const slot = screen.getByTestId("exercise-finish-action-slot");
    const notification = within(slot).getByTestId("exercise-adjustment-notification");
    expect(within(slot).getByLabelText(t.finishAction)).toBeTruthy();

    // Recouvrement EXACT du conteneur — donc du bouton, et centré sur lui.
    const style = StyleSheet.flatten(notification.props.style);
    expect(style.position).toBe("absolute");
    expect(style.top).toBe(0);
    expect(style.bottom).toBe(0);
    expect(style.left).toBe(0);
    expect(style.right).toBe(0);
    expect(style.justifyContent).toBe("center");
    // La surface noire peut être PLUS HAUTE que le bouton (deux lignes) : le
    // débordement reste visible, symétrique, plutôt que rogné.
    expect(style.overflow).toBe("visible");
    // Elle passe au-dessus du bouton qu'elle masque.
    expect(style.zIndex).toBeGreaterThan(0);
  });

  /**
   * **T02-S02 (seconde recette visuelle, point 6)** : un espace vertical
   * VISIBLE sépare désormais le cadre de synthèse du bouton `Terminer`.
   */
  it("separates the summary card from the Terminer button with a visible vertical gap", () => {
    renderScreen(null);

    const slotStyle = StyleSheet.flatten(
      screen.getByTestId("exercise-finish-action-slot").props.style,
    );
    expect(slotStyle.marginTop).toBeGreaterThan(0);
    expect(slotStyle.marginTop).toBe(16);

    // La géométrie du bouton lui-même est conservée : ses marges ont
    // simplement remonté sur son conteneur.
    const actionStyle = StyleSheet.flatten(screen.getByLabelText(t.finishAction).props.style);
    expect(slotStyle.marginHorizontal).toBe(24);
    expect(actionStyle.borderRadius).toBe(24);
    expect(actionStyle.paddingVertical).toBe(12);
    // Et l'espace bas (encoche incluse) reste appliqué une seule fois.
    expect(slotStyle.marginBottom).toBeGreaterThanOrEqual(16);
    expect(actionStyle.marginBottom).toBeUndefined();
  });

  it("Annuler on the notification restores the series count that preceded the adjustment, and closes it", () => {
    renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Gainage",
      durationSeconds: 30,
      seriesCount: 1,
      pauseSeconds: 10,
    });

    fireEvent.press(screen.getByTestId("exercise-field-totalDuration-control"));
    confirmDuration(2, 30);
    expect(
      within(screen.getByTestId("exercise-field-seriesCount-control")).getByText("4"),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("exercise-adjustment-notification-action"));

    // `Annuler` est une action de CORRECTION : elle restitue `1`, la valeur
    // d'avant l'ajustement — jamais un simple bouton de fermeture.
    expect(
      within(screen.getByTestId("exercise-field-seriesCount-control")).getByText("1"),
    ).toBeTruthy();
    expect(screen.queryByTestId("exercise-adjustment-notification")).toBeNull();
  });

  it("clears the adjustment notification as soon as any other parameter changes", () => {
    renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Gainage",
      durationSeconds: 30,
      seriesCount: 1,
      pauseSeconds: 10,
    });

    fireEvent.press(screen.getByTestId("exercise-field-totalDuration-control"));
    confirmDuration(2, 30);
    expect(screen.getByTestId("exercise-adjustment-notification")).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText(t.name), "Gainage renommé");
    expect(screen.queryByTestId("exercise-adjustment-notification")).toBeNull();
  });

  it("never persists the total duration itself — only seriesCount reaches the shared draft (DM-015/DM-016)", () => {
    const { updateDraft } = renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Gainage",
      durationSeconds: 30,
      seriesCount: 1,
      pauseSeconds: 10,
    });

    fireEvent.press(screen.getByTestId("exercise-field-totalDuration-control"));
    confirmDuration(2, 30);
    fireEvent.press(screen.getByLabelText(t.finishAction));

    expect(updateDraft).toHaveBeenCalledTimes(1);
    // Seul `seriesCount` change ; aucun champ de durée totale n'est écrit —
    // `toEqual` (et non `objectContaining`) prouve l'ABSENCE de tout champ
    // supplémentaire dans l'Activité écrite.
    expect(updateDraft).toHaveBeenCalledWith({
      exercises: [
        {
          ...createExerciseDraft("ex-1"),
          name: "Gainage",
          durationSeconds: 30,
          seriesCount: 4,
          pauseSeconds: 10,
        },
      ],
    });
  });
});

describe("ExerciseScreen — roulettes dans WheelPickerOverlay (roulette gelée, adaptation de conteneur uniquement)", () => {
  it("opens the Durée picker inside the shared full-screen WheelPickerOverlay, with a dimmed background", () => {
    renderScreen(null);

    expect(screen.queryByTestId("wheel-picker-overlay")).toBeNull();

    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();
    expect(screen.getByTestId("wheel-picker-overlay")).toBeTruthy();
    expect(
      StyleSheet.flatten(screen.getByTestId("wheel-picker-overlay-backdrop").props.style)
        .backgroundColor,
    ).toBe(colors.overlayScrim);
  });

  it("exercise-body never carries an ad hoc zIndex for a parameter selector, open or closed", () => {
    renderScreen(null);

    expect(
      StyleSheet.flatten(screen.getByTestId("exercise-body").props.style).zIndex,
    ).toBeUndefined();
    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));
    expect(
      StyleSheet.flatten(screen.getByTestId("exercise-body").props.style).zIndex,
    ).toBeUndefined();
  });

  it("never renders exercise-backdrop any more — only Annuler closes the selector", () => {
    renderScreen(null);
    expect(screen.queryByTestId("exercise-backdrop")).toBeNull();

    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));
    expect(screen.queryByTestId("exercise-backdrop")).toBeNull();
    expect(screen.getByTestId("wheel-picker-overlay-backdrop").props.onPress).toBeUndefined();

    fireEvent.press(screen.getByLabelText(t.wheelPicker.cancelAccessibilityLabel));
    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
  });

  it("opening Pause closes an already-open Durée picker (single overlay at a time)", () => {
    renderScreen(null);

    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));
    expect(screen.getByTestId("duration-wheel-minutes")).toBeTruthy();

    fireEvent.press(screen.getByTestId("exercise-field-pauseSeconds-control"));
    expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(0);
  });

  it("opens the Séries picker (NumberWheelPicker) with the draft/confirm contract (ACT-07) — never immediate-apply", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Pompes");

    fireEvent.press(screen.getByTestId("exercise-field-seriesCount-control"));
    fireEvent(screen.getByTestId("number-wheel-column"), "selectionChange", {
      nativeEvent: { selection: 3 },
    });
    expect(
      within(screen.getByTestId("exercise-field-seriesCount-control")).getByText("1"),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("number-wheel-validate"));
    expect(screen.queryByTestId("exercise-series-count-wheel")).toBeNull();
    expect(
      within(screen.getByTestId("exercise-field-seriesCount-control")).getByText("3"),
    ).toBeTruthy();
  });

  it("Annuler on the Séries picker discards the draft — the control keeps its previous value (ACT-07)", () => {
    renderScreen(null);

    fireEvent.press(screen.getByTestId("exercise-field-seriesCount-control"));
    fireEvent(screen.getByTestId("number-wheel-column"), "selectionChange", {
      nativeEvent: { selection: 7 },
    });
    fireEvent.press(screen.getByTestId("number-wheel-cancel"));

    expect(screen.queryByTestId("exercise-series-count-wheel")).toBeNull();
    expect(
      within(screen.getByTestId("exercise-field-seriesCount-control")).getByText("1"),
    ).toBeTruthy();
  });
});

describe("ExerciseScreen — verrou de non-régression de la roulette de durée native", () => {
  it("draft vs committed value (D-06): a native minutes selection on Durée does NOT update the control while the picker stays open", () => {
    renderScreen(null);
    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));

    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 1);

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
    fireEvent.press(
      within(screen.getByTestId("wheel-picker-overlay")).getByLabelText(
        t.wheelPicker.validateAccessibilityLabel,
      ),
    );

    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
    expect(
      within(screen.getByTestId("exercise-field-duration-control")).getByText("02 min 30 s"),
    ).toBeTruthy();
  });

  it("Annuler restores the previously committed value, discarding the draft", () => {
    renderScreen(null);
    fireEvent.press(screen.getByTestId("exercise-field-duration-control"));
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 2);
    fireEvent.press(screen.getByLabelText(t.wheelPicker.cancelAccessibilityLabel));

    expect(screen.queryByTestId("duration-wheel-picker")).toBeNull();
    expect(
      within(screen.getByTestId("exercise-field-duration-control")).getByText("00 min 30 s"),
    ).toBeTruthy();
  });

  it("no line of DurationWheelPicker's own rendering is duplicated locally: the same shared testIDs are reused unchanged", () => {
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
 * La synthèse est FIXE (jamais repliable, CE-T01-13) : la phrase
 * récapitulative puis la ligne de durée. La couverture exhaustive des deux
 * formats vit dans `compositionPresentation.test.ts` — ces tests-ci ne
 * vérifient que le câblage de l'écran.
 */
describe("ExerciseScreen — synthèse fixe (recap + ligne de durée)", () => {
  it("shows a computed recap reflecting the current draft's own name, growing with its content (no fixed height)", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Pompes");

    const summary = screen.getByTestId("exercise-summary-card");
    const summaryStyle = StyleSheet.flatten(summary.props.style);
    expect(summaryStyle.height).toBeUndefined();
    expect(summaryStyle.borderColor).toBe(colors.tourSurface);
    expect(summaryStyle.borderRadius).toBe(12);

    expect(within(summary).getByText(/^1 série de Pompes de/)).toBeTruthy();
    expect(within(summary).queryByText(/Exercice/)).toBeNull();
  });

  it("is never collapsible — it has no section header of its own", () => {
    renderScreen(null);

    expect(screen.getByTestId("exercise-summary-card")).toBeTruthy();
    expect(screen.queryByTestId("exercise-summary-card-header")).toBeNull();
  });

  /**
   * **T02-S02 (continuation après recette visuelle)** : « La synthèse est
   * immuable : le déploiement d'une section fait défiler le contenu sans
   * déplacer sa zone ni l'action finale `Terminer` » (CE-T01-13). Elle doit
   * donc être un FRÈRE du corps défilant, jamais son dernier enfant.
   */
  it("is FIXED and non-scrolling: it sits outside the scrollable body, between it and the final action", () => {
    renderScreen(null);

    const body = screen.getByTestId("exercise-body");
    expect(within(body).queryByTestId("exercise-summary-card")).toBeNull();
    expect(screen.getByTestId("exercise-summary-card")).toBeTruthy();

    // Ordre à l'écran : corps défilant, puis synthèse, puis action finale.
    expect(
      testIdOrder(screen.toJSON(), ["exercise-body", "exercise-summary-card"]),
    ).toEqual(["exercise-body", "exercise-summary-card"]);
    // La cale flexible qui la poussait au bas du contenu défilant n'a plus
    // d'objet : la synthèse n'est plus dans ce contenu.
    expect(screen.queryByTestId("exercise-recap-spacer")).toBeNull();
  });

  it("never moves when a section is expanded or collapsed", () => {
    renderScreen(null);

    const before = StyleSheet.flatten(screen.getByTestId("exercise-summary-card").props.style);
    expandSection("exercise-section-description");
    expandSection("exercise-section-body-zones");

    expect(
      StyleSheet.flatten(screen.getByTestId("exercise-summary-card").props.style),
    ).toEqual(before);
    // Et elle reste hors du corps défilant, quel que soit l'état déployé.
    expect(
      within(screen.getByTestId("exercise-body")).queryByTestId("exercise-summary-card"),
    ).toBeNull();
  });

  it("shows 'Durée totale : {D}' in Durée mode and 'Durée minimale : ≥ {D}' in the non-timed modes", () => {
    renderScreen(null);
    fireEvent.changeText(screen.getByLabelText(t.name), "Pompes");

    expect(screen.getByTestId("exercise-summary-duration").props.children).toBe(
      "Durée totale : 30 s",
    );

    fireEvent.press(screen.getByLabelText(t.executionMode.repetitions));
    expect(screen.getByTestId("exercise-summary-duration").props.children).toBe(
      "Durée minimale : ≥ 0 s",
    );
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

    const summary = screen.getByTestId("exercise-summary-card");
    expect(within(summary).getAllByText(/1 min 30 s/)).toHaveLength(2);

    fireEvent.press(screen.getByLabelText(t.executionMode.repetitions));
    expect(within(summary).getByText(/^1 série de 1 Pompes/)).toBeTruthy();
  });

  it("omits the pause clause entirely when pauseSeconds is 0 (default), never showing 'avec 0 s de pause'", () => {
    renderScreen(null);
    const summary = screen.getByTestId("exercise-summary-card");
    expect(within(summary).queryByText(/avec 0 s de pause/)).toBeNull();
  });
});

describe("ExerciseScreen — mode modification (draft.exercises contains the targeted Activity)", () => {
  it("prefills the name from the existing exercise, and shows 'Modifier une activité' in the header", () => {
    renderScreen({ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 45 });

    expect(screen.getByLabelText(t.name).props.value).toBe("Gainage");
    expect(within(screen.getByTestId("screen-header")).getByText(t.titleEdit)).toBeTruthy();
  });

  it("Terminer calls updateDraft exactly once, replacing the edited Activity by id, and calls router.back()", () => {
    const { updateDraft } = renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Gainage",
      durationSeconds: 45,
    });

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

    const finishButton = screen.getByLabelText(t.finishAction);
    fireEvent.press(finishButton);
    fireEvent.press(finishButton);

    expect(updateDraft).toHaveBeenCalledTimes(1);
  });

  it("end-to-end Répétition mode: Terminer persists the exact repetitionCount/pauseSeconds/seriesCount", () => {
    const { updateDraft } = renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Squats",
      executionMode: "REPETITIONS",
      repetitionCount: 12,
      durationSeconds: null,
      pauseSeconds: 15,
      seriesCount: 3,
    });

    fireEvent.press(screen.getByLabelText(t.finishAction));

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

  it("reopening an existing Répétition-mode Activity restores its exact repetitionCount/pauseSeconds/seriesCount", () => {
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
    expect(
      screen.getByLabelText(t.executionMode.repetitions).props.accessibilityState.selected,
    ).toBe(true);
    expect(
      within(screen.getByTestId("exercise-field-repetitionCount-control")).getByText("12"),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("exercise-field-pauseSeconds-control")).getByText("00 min 15 s"),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("exercise-field-seriesCount-control")).getByText("3"),
    ).toBeTruthy();
  });

  it("restores an existing Activity's instruction and body zones inside their collapsed sections", () => {
    renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Gainage",
      durationSeconds: 45,
      instruction: "Ne pas creuser le dos",
      bodyZoneIds: ["dos"],
    });

    expandSection("exercise-section-description");
    expect(screen.getByLabelText(t.instruction.label).props.value).toBe("Ne pas creuser le dos");

    expandSection("exercise-section-body-zones");
    expect(screen.getByLabelText("Dos").props.accessibilityState).toMatchObject({ checked: true });
  });

  it("Terminer on a NEW Activity (no exerciseId param) appends it after any Activity already present, never replacing it", () => {
    const updateDraft = jest.fn();
    mockSearchParams = {};
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
    fireEvent.press(screen.getByLabelText(t.finishAction));

    expect(updateDraft).toHaveBeenCalledTimes(1);
    expect(updateDraft).toHaveBeenCalledWith({
      exercises: [
        expect.objectContaining({ id: "ex-existing", name: "Gainage" }),
        expect.objectContaining({ id: "generated-exercise-id", name: "Squats" }),
      ],
    });
  });

  /**
   * **T02-S02 (troisième recette visuelle, point 1)** — insertion DYNAMIQUE :
   * la nouvelle Activité se place après la dernière carte AFFICHÉE et en
   * reprend la zone, l'ordre du brouillon étant relu au moment exact de
   * `Terminer`.
   */
  function renderAddScreenWith(exercises: readonly SessionDraftExercise[]) {
    const updateDraft = jest.fn();
    mockSearchParams = {};
    render(
      <TestSafeAreaProvider>
        <SessionDraftContext.Provider
          value={{
            draft: {
              name: "Séance simple",
              color: "#3B82F6",
              initialCountdownSeconds: 10,
              finalPhaseSeconds: 5,
              exercises,
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
    return { updateDraft };
  }

  function anExisting(id: string, zone: SessionDraftExercise["structuralPosition"]) {
    return { ...createExerciseDraft(id), name: id, structuralPosition: zone };
  }

  it("appends a NEW Activity right after the last DISPLAYED card, taking that card's zone", () => {
    const { updateDraft } = renderAddScreenWith([
      anExisting("before-1", "BEFORE_TOUR"),
      anExisting("in-1", "IN_TOUR"),
      anExisting("after-1", "AFTER_TOUR"),
    ]);

    fireEvent.changeText(screen.getByLabelText(t.name), "Squats");
    fireEvent.press(screen.getByLabelText(t.finishAction));

    expect(updateDraft).toHaveBeenCalledTimes(1);
    // Dernière carte affichée : `after-1`. La nouvelle la suit et hérite de
    // sa zone `AFTER_TOUR` — elle se place donc avant `Fin de séance`. Le
    // tableau attendu est exhaustif : aucune Activité n'est perdue.
    expect(updateDraft).toHaveBeenCalledWith({
      exercises: [
        expect.objectContaining({ id: "before-1" }),
        expect.objectContaining({ id: "in-1" }),
        expect.objectContaining({ id: "after-1" }),
        expect.objectContaining({
          id: "generated-exercise-id",
          name: "Squats",
          structuralPosition: "AFTER_TOUR",
        }),
      ],
    });
  });

  it("makes the new Activity the LAST of the Tour when the last displayed card is IN_TOUR", () => {
    const { updateDraft } = renderAddScreenWith([
      anExisting("before-1", "BEFORE_TOUR"),
      anExisting("in-1", "IN_TOUR"),
    ]);

    fireEvent.changeText(screen.getByLabelText(t.name), "Squats");
    fireEvent.press(screen.getByLabelText(t.finishAction));

    expect(updateDraft).toHaveBeenCalledWith({
      exercises: [
        expect.objectContaining({ id: "before-1" }),
        expect.objectContaining({ id: "in-1" }),
        expect.objectContaining({
          id: "generated-exercise-id",
          structuralPosition: "IN_TOUR",
        }),
      ],
    });
  });

  it("places it just after the last BEFORE_TOUR card — therefore before the Tour", () => {
    const { updateDraft } = renderAddScreenWith([anExisting("before-1", "BEFORE_TOUR")]);

    fireEvent.changeText(screen.getByLabelText(t.name), "Squats");
    fireEvent.press(screen.getByLabelText(t.finishAction));

    expect(updateDraft).toHaveBeenCalledWith({
      exercises: [
        expect.objectContaining({ id: "before-1" }),
        expect.objectContaining({
          id: "generated-exercise-id",
          structuralPosition: "BEFORE_TOUR",
        }),
      ],
    });
  });

  /**
   * Le placement est décidé au moment de `Terminer`, PAS à l'ouverture de
   * l'écran : la zone que `createExerciseDraft` fige au montage
   * (`BEFORE_TOUR`) ne doit jamais l'emporter sur la Composition réelle.
   */
  it("never uses the zone memorised when the screen opened", () => {
    const { updateDraft } = renderAddScreenWith([anExisting("in-1", "IN_TOUR")]);

    fireEvent.changeText(screen.getByLabelText(t.name), "Squats");
    fireEvent.press(screen.getByLabelText(t.finishAction));

    const written = updateDraft.mock.calls[0]?.[0] as { exercises: SessionDraftExercise[] };
    const added = written.exercises.find((exercise) => exercise.id === "generated-exercise-id");
    expect(added?.structuralPosition).toBe("IN_TOUR");
    expect(added?.structuralPosition).not.toBe(createExerciseDraft("x").structuralPosition);
  });

  it("reads the CURRENT reading order, not the raw collection order", () => {
    // Collection délibérément NON contiguë : la dernière carte AFFICHÉE est
    // `after-1`, bien qu'elle soit le premier élément du tableau.
    const { updateDraft } = renderAddScreenWith([
      anExisting("after-1", "AFTER_TOUR"),
      anExisting("in-1", "IN_TOUR"),
    ]);

    fireEvent.changeText(screen.getByLabelText(t.name), "Squats");
    fireEvent.press(screen.getByLabelText(t.finishAction));

    expect(updateDraft).toHaveBeenCalledWith({
      exercises: [
        expect.objectContaining({ id: "after-1" }),
        expect.objectContaining({
          id: "generated-exercise-id",
          structuralPosition: "AFTER_TOUR",
        }),
        expect.objectContaining({ id: "in-1" }),
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

  it("arms the guard as soon as the local draft differs from its snapshot, including via the Récupération", () => {
    renderScreen(null);
    expect(mockExitGuard).toHaveBeenLastCalledWith(false, expect.any(Function));

    fireEvent.press(screen.getByTestId("exercise-field-recoverySeconds-control"));
    confirmDuration(0, 30);

    expect(mockExitGuard).toHaveBeenLastCalledWith(true, expect.any(Function));
  });
});

/**
 * V2-BILAT-01 (plan `## UI`) : contrôle `Côtés`, APRÈS le segment de mode et
 * AVANT les paramètres, dans les trois modes — enfant `IN_TOUR` d'un Tour
 * bilatéral : visible, désactivé, proprement `UNILATERAL`.
 */
describe("ExerciseScreen — contrôle Côtés (V2-BILAT-01)", () => {
  const sideModeStrings = strings.shared.sideMode;

  function renderWithTourSideMode(
    draftExercise: SessionDraftExercise,
    tourSideMode: "UNILATERAL" | "RIGHT_LEFT" | "LEFT_RIGHT",
  ) {
    const updateDraft = jest.fn();
    mockSearchParams = { exerciseId: draftExercise.id };
    render(
      <TestSafeAreaProvider>
        <SessionDraftContext.Provider
          value={{
            draft: {
              name: "Séance simple",
              color: "#3B82F6",
              initialCountdownSeconds: 10,
              finalPhaseSeconds: 5,
              tourSideMode,
              exercises: [draftExercise],
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
    return { updateDraft };
  }

  it("is rendered after the mode segment and before the parameter card, in every execution mode", () => {
    for (const executionMode of ["DURATION", "REPETITIONS", "TO_FAILURE"] as const) {
      const { unmount } = renderScreen({ ...createExerciseDraft("ex-1"), executionMode });
      expect(screen.getByTestId("exercise-side-mode")).toBeTruthy();
      expect(screen.getByText(sideModeStrings.compactLabel)).toBeTruthy();
      unmount();
    }
  });

  it("displays 'Unilatéral' by default, and cycles Unilatéral → D→G → G→D on successive presses", () => {
    renderScreen({ ...createExerciseDraft("ex-1") });
    expect(screen.getByText(sideModeStrings.valueLabels.UNILATERAL)).toBeTruthy();

    fireEvent.press(screen.getByTestId("exercise-side-mode-control"));
    expect(screen.getByText(sideModeStrings.valueLabels.RIGHT_LEFT)).toBeTruthy();

    fireEvent.press(screen.getByTestId("exercise-side-mode-control"));
    expect(screen.getByText(sideModeStrings.valueLabels.LEFT_RIGHT)).toBeTruthy();
  });

  it("is enabled for a BEFORE_TOUR Activity, even under a bilateral Tour", () => {
    renderWithTourSideMode(
      { ...createExerciseDraft("ex-1"), structuralPosition: "BEFORE_TOUR" },
      "RIGHT_LEFT",
    );
    expect(screen.getByTestId("exercise-side-mode-control").props.accessibilityState).toMatchObject(
      { disabled: false },
    );
  });

  it("is disabled for an IN_TOUR Activity governed by a bilateral Tour", () => {
    renderWithTourSideMode(
      { ...createExerciseDraft("ex-1"), structuralPosition: "IN_TOUR" },
      "RIGHT_LEFT",
    );
    expect(screen.getByTestId("exercise-side-mode-control").props.accessibilityState).toMatchObject(
      { disabled: true },
    );
  });

  it("is enabled for an IN_TOUR Activity when the Tour stays unilateral", () => {
    renderWithTourSideMode(
      { ...createExerciseDraft("ex-1"), structuralPosition: "IN_TOUR" },
      "UNILATERAL",
    );
    expect(screen.getByTestId("exercise-side-mode-control").props.accessibilityState).toMatchObject(
      { disabled: false },
    );
  });

  it("persists the chosen side mode through Terminer", () => {
    const { updateDraft } = renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Gainage",
      durationSeconds: 30,
    });

    fireEvent.press(screen.getByTestId("exercise-side-mode-control"));
    fireEvent.press(screen.getByLabelText(t.finishAction));

    expect(updateDraft).toHaveBeenCalledWith({
      exercises: [expect.objectContaining({ id: "ex-1", sideMode: "RIGHT_LEFT" })],
    });
  });

  it("doubles the displayed total duration for a bilateral direction, without ever doubling the Récupération", () => {
    renderScreen({
      ...createExerciseDraft("ex-1"),
      name: "Gainage",
      durationSeconds: 30,
      seriesCount: 3,
      pauseSeconds: 15,
      recoverySeconds: 20,
    });

    // Unilatéral (défaut) : 3×30 + 2×15 + 20 = 140 s -> "2 min 20 s".
    expect(
      within(screen.getByTestId("exercise-summary-card")).getByText("Durée totale : 2 min 20 s"),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("exercise-side-mode-control"));

    // Bilatéral : (3×30 + 2×15) × 2 + 20 (jamais doublée) = 260 s -> "4 min 20 s".
    expect(
      within(screen.getByTestId("exercise-summary-card")).getByText("Durée totale : 4 min 20 s"),
    ).toBeTruthy();
  });
});
