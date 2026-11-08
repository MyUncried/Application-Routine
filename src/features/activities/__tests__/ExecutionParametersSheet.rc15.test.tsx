import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { Dimensions, StyleSheet } from "react-native";

import { numberTarget, type ExecutionParameters, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import {
  SERIES_TYPE_LABEL_MIN_WIDTH,
  seriesSelectedOptionWidth,
  seriesUnselectedOptionWidth,
} from "@/features/activities/seriesTypeOptionWidths";
import { enterExecutionSheetValue, typeInExecutionSheetCell } from "@/features/activities/testing/executionSheetActions";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

/**
 * Recette du 20/10 (RC-15) — contrôle segmenté « Séries » : le nombre de séries est porté par
 * l'option sélectionnée du Type de série (Figma `9436:18101`, `9439:18307`, `9436:18305`,
 * `9445:18410`), plus de ligne « Nombre de séries ». Règles, bornes, transitions et accessibilité
 * du stepper conservées (NR Δ38). Jest ne prouve que l'arbre JS : rendu, gestes et largeurs réelles
 * relèvent de la recette iPhone (aucun constat inventé).
 *
 * Recette du 20/10 (RC-17, décisions de Hermann) : la ligne s'intitule « Séries » (au lieu de « Type
 * de série ») ; stepper ouvert, le chevron du tableau est grisé et indisponible ; l'activation d'une
 * cellule du tableau ferme le stepper (une seule surface) et rend le chevron actif.
 *
 * [Stepper « − | n séries | + » révélé par le toucher du nombre — remplacé le 06/11/2026, décision de
 * Hermann (constat c) : saisie au clavier] : le nombre est un champ clavier numérique dans l'option
 * (`execution-sheet-series`, entrée `-input`) ; en saisie, ses chiffres ; bornes 1..99 appliquées à la
 * sortie du champ ; l'option garde sa largeur de repos ; pendant la saisie, le chevron du tableau reste
 * grisé et indisponible (RC-17) et son appui ferme le clavier.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const t = strings.executionParameters.sheet;
const hidden = { includeHiddenElements: true } as const;
const get = (testID: string) => screen.getByTestId(testID, hidden);
const query = (testID: string) => screen.queryByTestId(testID, hidden);
const styleOf = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};

const CONTROL = "execution-sheet-series-type-control";
const VARIABLE = `${CONTROL}-VARIABLE`;
const UNIFORM = `${CONTROL}-UNIFORM`;
const CHEVRON = `${VARIABLE}-chevron`;
const STEPPER = "execution-sheet-series";
const INPUT = `${STEPPER}-input`;
const UP = [require("../../../../assets/icons/control-chevron-up.svg")];
const DOWN = [require("../../../../assets/icons/control-chevron-down.svg")];

function params(overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 5,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 15, loadKg: 0, workPhases: [] },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    loadEnabled: false,
    ...overrides,
  };
}

const variable = (count: number): Partial<ExecutionParametersInput> => ({
  series: {
    kind: "VARIABLE",
    rows: Array.from({ length: count }, (_, index) => ({ target: numberTarget(30 + index), pauseSeconds: 10, loadKg: 0 })),
    workPhases: [],
  },
});

function renderSheet(parent: ExecutionParametersInput) {
  const onApply = jest.fn<(value: ExecutionParameters) => void>();
  render(
    <TestSafeAreaProvider>
      <ExecutionParametersSheet parent={parent} profileSideRecoverySecondsDefault={10} onApply={onApply} onCancel={jest.fn()} />
    </TestSafeAreaProvider>,
  );
  return { onApply };
}

const closedText = () => String(get(`${STEPPER}-value`).props.children);
/** Décision du 06/11/2026 : le nombre de séries en saisie (focus natif simulé) ou non. */
const focusCount = () => fireEvent(get(INPUT), "focus");
const blurCount = () => fireEvent(get(INPUT), "blur");
const countActive = () => get(STEPPER).props.accessibilityState?.selected === true;
const tableRows = () => screen.queryAllByTestId(/^execution-sheet-table-row-\d+$/, hidden).length;
/** Largeur de l'option : premier ancêtre de sa zone de sélection qui porte une largeur. */
function optionWidth(option: string): number | undefined {
  let node: ReturnType<typeof get> | null = get(option).parent;
  while (node) {
    const width = (StyleSheet.flatten(node.props.style) ?? {}).width;
    if (typeof width === "number") return width;
    node = node.parent;
  }
  return undefined;
}

const initialWindow = Dimensions.get("window");
const initialScreen = Dimensions.get("screen");
function setWidth(width: number) {
  act(() => {
    Dimensions.set({ window: { ...initialWindow, width }, screen: { ...initialScreen, width } });
  });
}
afterEach(() => {
  act(() => {
    Dimensions.set({ window: initialWindow, screen: initialScreen });
  });
});

describe("RC-15 — contrôle segmenté Séries (recette du 20/10)", () => {
  it("identiques : un seul segmenté, « 3 séries identiques » dans l'option sélectionnée, « Variables » à côté ; plus de ligne « Nombre de séries » ni de second stepper ; segmenté de 32", () => {
    renderSheet(params());
    expect(query("execution-sheet-row-series")).toBeNull();
    expect(screen.queryByText("Nombre de séries", hidden)).toBeNull();
    // RC-17 : titre de la ligne « Séries » (Figma `9436:18101`), nom accessible du segmenté identique.
    expect(t.seriesType).toBe("Séries");
    expect(within(get("execution-sheet-row-series-type")).getByText("Séries", hidden)).toBeTruthy();
    expect(within(get("execution-sheet-row-series-type")).queryByText("Type de série", hidden)).toBeNull();
    expect(get(CONTROL).props.accessibilityLabel).toBe("Séries");
    expect(closedText()).toBe("3 séries identiques");
    expect(within(get(CONTROL)).getByTestId(STEPPER)).toBeTruthy();
    expect(get(UNIFORM).props.accessibilityState).toMatchObject({ selected: true });
    expect(within(get(CONTROL)).getByText("Variables", hidden)).toBeTruthy();
    expect(query(CHEVRON)).toBeNull();
    expect(query(`${STEPPER}-increment`)).toBeNull();
    expect(get(INPUT).props.keyboardType).toBe("number-pad");
    expect(styleOf(CONTROL).height).toBe(32);
    // Fond de l'option sélectionnée : cadre violet existant (`colors.selection`) ; fond clair des autres.
    expect(styleOf(`${CONTROL}-indicator`).backgroundColor).toBe(colors.selection);
    expect(styleOf(`${CONTROL}-tile-VARIABLE`).backgroundColor).toBe(colors.surface);
    expect(get(STEPPER).props.accessibilityLabel).toBe("Séries");
    expect(get(STEPPER).props.accessibilityValue).toMatchObject({ text: "3 séries identiques" });
  });

  it("toucher le nombre ouvre le clavier numérique dans l'option (chiffres en saisie, fond #EAEAFF, sans cadre violet, segmenté de 32) ; la valeur est appliquée à la sortie du champ et le libellé complet revient [stepper — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]", () => {
    const { onApply } = renderSheet(params());
    focusCount();
    expect(countActive()).toBe(true);
    expect(String(get(`${STEPPER}-value`).props.children)).toBe("3");
    expect(styleOf(STEPPER).backgroundColor).toBe("#EAEAFF");
    expect(styleOf(CONTROL).height).toBe(32);
    expect(query(`${CONTROL}-indicator`)).toBeNull();
    typeInExecutionSheetCell(STEPPER, "4");
    expect(String(get(`${STEPPER}-value`).props.children)).toBe("4");
    blurCount();
    expect(countActive()).toBe(false);
    expect(closedText()).toBe("4 séries identiques");
    fireEvent.press(get("execution-sheet-validate"));
    expect(onApply.mock.calls.at(-1)![0].series).toMatchObject({ kind: "UNIFORM", count: 4 });
  });

  it("un toucher ailleurs ou l'ouverture d'un autre champ ferme la saisie sans changer le nombre", () => {
    renderSheet(params());
    focusCount();
    fireEvent.press(get("execution-sheet-body-outside"));
    expect(countActive()).toBe(false);
    blurCount();
    expect(closedText()).toBe("3 séries identiques");
    focusCount();
    fireEvent(get("execution-sheet-pause-input"), "focus");
    expect(countActive()).toBe(false);
    expect(get("execution-sheet-pause").props.accessibilityState).toMatchObject({ selected: true });
    // Perte du focus natif du nombre (simulée), qui suit le focus d'un autre champ.
    blurCount();
    expect(closedText()).toBe("3 séries identiques");
  });

  it("bornes 1..99 appliquées à la sortie (« 1 série identique », accord au singulier) [± indisponibles aux bornes — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 2, target: numberTarget(30), pauseSeconds: 0, loadKg: 0, workPhases: [] } }));
    enterExecutionSheetValue(STEPPER, 0, "integer");
    expect(closedText()).toBe("1 série identique");
    // P16 : à N = 1, Variables est indisponible ; le nombre reste réglable.
    expect(get(VARIABLE).props.accessibilityState).toMatchObject({ disabled: true, selected: false });
    enterExecutionSheetValue(STEPPER, 150, "integer");
    expect(closedText()).toBe("99 séries identiques");
  });

  it("variables : « 3 séries variables » et chevron graphique (haut = déployé) ; le chevron replie et déploie sans changer le nombre ni ouvrir le réglage ; le tableau suit N ; réglage ouvert, chevron indisponible (RC-17)", () => {
    renderSheet(params(variable(3)));
    expect(closedText()).toBe("3 séries variables");
    expect(within(get(CONTROL)).getByText("Identiques", hidden)).toBeTruthy();
    expect(get(`${CHEVRON}-icon`).props.source).toEqual(UP);
    expect(tableRows()).toBe(3);
    fireEvent.press(get(CHEVRON));
    expect(query("execution-sheet-table")).toBeNull();
    expect(get(`${CHEVRON}-icon`).props.source).toEqual(DOWN);
    expect(countActive()).toBe(false);
    expect(closedText()).toBe("3 séries variables");
    fireEvent.press(get(CHEVRON));
    expect(tableRows()).toBe(3);
    // Saisie ouverte : le chevron reste visible dans le segment, grisé et indisponible (RC-17) ;
    // le tableau suit N.
    expect(get(CHEVRON).props.accessibilityState).toMatchObject({ disabled: false, expanded: true });
    focusCount();
    expect(get(CHEVRON)).toBeTruthy();
    expect(styleOf(`${CHEVRON}-icon`).tintColor).toBe(colors.disabled);
    expect(get(CHEVRON).props.accessibilityState).toMatchObject({ disabled: true, expanded: true });
    typeInExecutionSheetCell(STEPPER, "4");
    blurCount();
    expect(tableRows()).toBe(4);
    enterExecutionSheetValue(STEPPER, 2, "integer");
    expect(tableRows()).toBe(2);
    expect(closedText()).toBe("2 séries variables");
  });

  it("passage Identiques ↔ Variables : règles existantes, le segment non sélectionné garde son libellé", () => {
    renderSheet(params());
    fireEvent.press(get(VARIABLE));
    expect(closedText()).toBe("3 séries variables");
    expect(tableRows()).toBe(3);
    fireEvent.press(get(UNIFORM));
    expect(closedText()).toBe("3 séries identiques");
    expect(query("execution-sheet-table")).toBeNull();
  });

  // PRE-7 story B.1 (D-447, B4) : marge du bouton actif fermé portée de 8 à 12 de chaque côté —
  // options fermées « 3 séries identiques » 126 → 134 et « 3 séries variables » 134 → 142.
  // [Stepper ouvert (138, 154 ; non sélectionnée réduite à 95) — remplacé le 06/11/2026, décision de
  // Hermann (constat c) : saisie au clavier] : la saisie garde la largeur de repos.
  it("largeurs : option sélectionnée adaptée au contenu (fermées 134 / 142 depuis B.1), inchangée pendant la saisie ; non sélectionnée de 106 (RC-17)", () => {
    setWidth(402);
    renderSheet(params());
    expect(optionWidth(UNIFORM)).toBe(134);
    expect(optionWidth(VARIABLE)).toBe(106);
    focusCount();
    expect(optionWidth(UNIFORM)).toBe(134);
    expect(optionWidth(VARIABLE)).toBe(106);
    screen.unmount();
    setWidth(375);
    renderSheet(params(variable(3)));
    expect(optionWidth(VARIABLE)).toBe(142);
    expect(optionWidth(UNIFORM)).toBe(106);
    focusCount();
    expect(optionWidth(VARIABLE)).toBe(142);
    expect(optionWidth(UNIFORM)).toBe(106);
  });

  // PRE-7 story B.1 (B4) : largeurs 360 et 440 ajoutées (marges fermées de 12).
  it("à 360, 375, 402 et 440, de 1 à 99 séries, dans les deux types, réglage ouvert ou fermé : le libellé « Séries » garde au moins 36 (une ligne, RC-17), sans débordement ; à 402 et 440, l'option non sélectionnée garde toujours 106", () => {
    expect(SERIES_TYPE_LABEL_MIN_WIDTH).toBe(36);
    for (const screenWidth of [360, 375, 402, 440]) {
      const rowWidth = screenWidth - 74 - 8;
      for (let count = 1; count <= 99; count += 1) {
        for (const type of ["UNIFORM", "VARIABLE"] as const) {
          for (const open of [false, true]) {
            const word = type === "UNIFORM" ? (count === 1 ? "série identique" : "séries identiques") : count === 1 ? "série variable" : "séries variables";
            const selected = seriesSelectedOptionWidth({
              label: `${count} ${word}`,
              stepperValue: `${count} ${count === 1 ? "série" : "séries"}`,
              open,
              chevron: type === "VARIABLE",
            });
            const unselected = seriesUnselectedOptionWidth(type === "UNIFORM" ? "VARIABLE" : "UNIFORM", selected, rowWidth);
            const control = 3 + selected + 2 + unselected + 3;
            if (screenWidth >= 402) expect({ count, type, open, unselected }).toEqual({ count, type, open, unselected: 106 });
            expect({ screenWidth, count, type, open, fits: rowWidth - control >= SERIES_TYPE_LABEL_MIN_WIDTH }).toEqual({
              screenWidth,
              count,
              type,
              open,
              fits: true,
            });
          }
        }
      }
    }
  });
});

describe("RC-17 — Séries : jamais stepper et chevron actifs en même temps (recette du 20/10)", () => {
  const loaded = (count: number): Partial<ExecutionParametersInput> => ({
    loadEnabled: true,
    series: {
      kind: "VARIABLE",
      rows: Array.from({ length: count }, (_, index) => ({ target: numberTarget(30 + index), pauseSeconds: 10, loadKg: 5 * index })),
      workPhases: [],
    },
  });
  const chevronState = () => get(CHEVRON).props.accessibilityState as { disabled?: boolean; expanded?: boolean };

  it("saisie du nombre ouverte : chevron grisé et indisponible ; son appui ferme le clavier sans changer le repli ; le chevron redevient actif [stepper — remplacé le 06/11/2026, décision de Hermann (constat c) : saisie au clavier]", () => {
    renderSheet(params(variable(3)));
    expect(chevronState()).toMatchObject({ disabled: false, expanded: true });
    expect(styleOf(`${CHEVRON}-icon`).tintColor).toBe(colors.background);
    focusCount();
    typeInExecutionSheetCell(STEPPER, "4");
    expect(chevronState()).toMatchObject({ disabled: true, expanded: true });
    fireEvent.press(get(CHEVRON));
    // « Fermer » du clavier : la perte du focus natif (simulée) applique la saisie.
    blurCount();
    expect(countActive()).toBe(false);
    expect(closedText()).toBe("4 séries variables");
    expect(tableRows()).toBe(4);
    expect(get(`${CHEVRON}-icon`).props.source).toEqual(UP);
    expect(chevronState()).toMatchObject({ disabled: false, expanded: true });
    expect(styleOf(`${CHEVRON}-icon`).tintColor).toBe(colors.background);
    // Actif à nouveau : il replie le tableau sans ouvrir la saisie.
    fireEvent.press(get(CHEVRON));
    expect(query("execution-sheet-table")).toBeNull();
    expect(countActive()).toBe(false);
  });

  for (const column of ["target", "pause", "load"] as const) {
    it(`activer une cellule du tableau (${column}) ferme la saisie du nombre (surface clavier, une seule surface) ; nombre et repli inchangés ; chevron actif`, () => {
      renderSheet(params(loaded(3)));
      focusCount();
      expect(chevronState()).toMatchObject({ disabled: true });
      fireEvent(get(`execution-sheet-table-row-2-${column}-input`), "focus");
      expect(countActive()).toBe(false);
      blurCount();
      expect(closedText()).toBe("3 séries variables");
      expect(tableRows()).toBe(3);
      expect(get(`${CHEVRON}-icon`).props.source).toEqual(UP);
      expect(chevronState()).toMatchObject({ disabled: false, expanded: true });
    });
  }
});
