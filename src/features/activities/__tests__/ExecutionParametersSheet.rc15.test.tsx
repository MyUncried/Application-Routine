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
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

/**
 * Recette du 20/10 (RC-15) — contrôle segmenté « Séries » : le nombre de séries est porté par
 * l'option sélectionnée du Type de série (Figma `9436:18101`, `9439:18307`, `9436:18305`,
 * `9445:18410`), plus de ligne « Nombre de séries ». Règles, bornes, transitions et accessibilité
 * du stepper conservées (NR Δ38). Jest ne prouve que l'arbre JS : rendu, gestes et largeurs réelles
 * relèvent de la recette iPhone (aucun constat inventé).
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
const TOGGLE = "execution-sheet-series-toggle";
const STEPPER = "execution-sheet-series";
const FIELD = "execution-sheet-series-field";
const UP = [require("../../../../assets/icons/control-chevron-up.svg")];
const DOWN = [require("../../../../assets/icons/control-chevron-down.svg")];

function params(overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 3,
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
const stepperTap = (button: "increment" | "decrement") => {
  fireEvent(get(`${STEPPER}-${button}`), "pressIn");
  fireEvent(get(`${STEPPER}-${button}`), "pressOut");
};
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
    expect(within(get("execution-sheet-row-series-type")).getByText(t.seriesType, hidden)).toBeTruthy();
    expect(closedText()).toBe("3 séries identiques");
    expect(within(get(CONTROL)).getByTestId(TOGGLE)).toBeTruthy();
    expect(get(UNIFORM).props.accessibilityState).toMatchObject({ selected: true });
    expect(within(get(CONTROL)).getByText("Variables", hidden)).toBeTruthy();
    expect(query(CHEVRON)).toBeNull();
    expect(query(`${STEPPER}-increment`)).toBeNull();
    expect(styleOf(CONTROL).height).toBe(32);
    // Fond de l'option sélectionnée : cadre violet existant (`colors.selection`) ; fond clair des autres.
    expect(styleOf(`${CONTROL}-indicator`).backgroundColor).toBe(colors.selection);
    expect(styleOf(`${CONTROL}-tile-VARIABLE`).backgroundColor).toBe(colors.surface);
    expect(get(TOGGLE).props.accessibilityLabel).toBe("Séries, 3 séries identiques");
  });

  it("toucher la valeur révèle « − | 3 séries | + » sur fond #F2F2FF dans un segmenté de 34, sans cadre violet ; ± selon les règles existantes ; toucher la valeur referme (RC-4) et le libellé complet revient", () => {
    const { onApply } = renderSheet(params());
    fireEvent.press(get(TOGGLE));
    expect(within(get(CONTROL)).getByTestId(FIELD)).toBeTruthy();
    expect(styleOf(FIELD)).toMatchObject({ backgroundColor: colors.stepperSurface, borderRadius: 14 });
    expect(styleOf(CONTROL).height).toBe(34);
    expect(query(`${CONTROL}-indicator`)).toBeNull();
    expect(query(`${CONTROL}-tile-UNIFORM`)).toBeNull();
    expect(String(get(`${STEPPER}-value`).props.children)).toBe("3 séries");
    // Accessibilité conservée (NR Δ38) : réglage ajustable « Séries », bornes 1..99.
    expect(get(STEPPER).props).toMatchObject({ accessibilityRole: "adjustable", accessibilityLabel: t.series });
    expect(get(STEPPER).props.accessibilityValue).toMatchObject({ min: 1, max: 99, now: 3 });
    stepperTap("increment");
    expect(String(get(`${STEPPER}-value`).props.children)).toBe("4 séries");
    fireEvent.press(get(`${STEPPER}-value-press`));
    expect(query(`${STEPPER}-increment`)).toBeNull();
    expect(closedText()).toBe("4 séries identiques");
    expect(styleOf(CONTROL).height).toBe(32);
    fireEvent.press(get("execution-sheet-validate"));
    expect(onApply.mock.calls.at(-1)![0].series).toMatchObject({ kind: "UNIFORM", count: 4 });
  });

  it("un toucher ailleurs ou l'ouverture d'une autre surface ferme le réglage sans changer le nombre ; re-choisir Identiques ouvre et ferme le réglage", () => {
    renderSheet(params());
    fireEvent.press(get(TOGGLE));
    fireEvent.press(get("execution-sheet-body-outside"));
    expect(query(FIELD)).toBeNull();
    expect(closedText()).toBe("3 séries identiques");
    fireEvent.press(get(UNIFORM));
    expect(get(FIELD)).toBeTruthy();
    fireEvent.press(get("execution-sheet-pause-toggle"));
    expect(query(FIELD)).toBeNull();
    expect(get("execution-sheet-pause-field")).toBeTruthy();
    expect(closedText()).toBe("3 séries identiques");
  });

  it("bornes : − indisponible à 1 (« 1 série identique », accord au singulier), + indisponible à 99", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 1, target: numberTarget(30), pauseSeconds: 0, loadKg: 0, workPhases: [] } }));
    expect(closedText()).toBe("1 série identique");
    // P16 : à N = 1, Variables est indisponible ; le nombre reste réglable.
    expect(get(VARIABLE).props.accessibilityState).toMatchObject({ disabled: true, selected: false });
    fireEvent.press(get(TOGGLE));
    expect(String(get(`${STEPPER}-value`).props.children)).toBe("1 série");
    expect(get(`${STEPPER}-decrement`).props.accessibilityState).toMatchObject({ disabled: true });
    screen.unmount();
    renderSheet(params({ series: { kind: "UNIFORM", count: 99, target: numberTarget(30), pauseSeconds: 0, loadKg: 0, workPhases: [] } }));
    fireEvent.press(get(TOGGLE));
    expect(get(`${STEPPER}-increment`).props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("variables : « 3 séries variables » et chevron graphique (haut = déployé) ; le chevron replie et déploie sans changer le nombre ni ouvrir le réglage ; le tableau suit N", () => {
    renderSheet(params(variable(3)));
    expect(closedText()).toBe("3 séries variables");
    expect(within(get(CONTROL)).getByText("Identiques", hidden)).toBeTruthy();
    expect(get(`${CHEVRON}-icon`).props.source).toEqual(UP);
    expect(tableRows()).toBe(3);
    fireEvent.press(get(CHEVRON));
    expect(query("execution-sheet-table")).toBeNull();
    expect(get(`${CHEVRON}-icon`).props.source).toEqual(DOWN);
    expect(query(FIELD)).toBeNull();
    expect(closedText()).toBe("3 séries variables");
    fireEvent.press(get(CHEVRON));
    expect(tableRows()).toBe(3);
    // Réglage ouvert : le chevron reste dans le segment, indépendant ; le tableau suit N.
    fireEvent.press(get(TOGGLE));
    expect(get(CHEVRON)).toBeTruthy();
    expect(styleOf(`${CHEVRON}-icon`).tintColor).toBe(colors.primary);
    stepperTap("increment");
    expect(tableRows()).toBe(4);
    stepperTap("decrement");
    stepperTap("decrement");
    expect(tableRows()).toBe(2);
    expect(String(get(`${STEPPER}-value`).props.children)).toBe("2 séries");
    fireEvent.press(get(`${STEPPER}-value-press`));
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

  it("largeurs : option sélectionnée adaptée au contenu (Figma 127 / 134 / 138 à un point près) ; non sélectionnée de 106, réduite seulement si le libellé n'a plus sa place", () => {
    setWidth(402);
    renderSheet(params());
    expect(optionWidth(UNIFORM)).toBe(126);
    expect(optionWidth(VARIABLE)).toBe(106);
    fireEvent.press(get(TOGGLE));
    expect(optionWidth(UNIFORM)).toBe(138);
    screen.unmount();
    setWidth(375);
    renderSheet(params(variable(3)));
    expect(optionWidth(VARIABLE)).toBe(134);
    fireEvent.press(get(TOGGLE));
    expect(optionWidth(VARIABLE)).toBe(154);
    expect(optionWidth(UNIFORM)).toBe(84);
  });

  it("à 375 et à 402, de 1 à 99 séries, dans les deux types, réglage ouvert ou fermé : le libellé « Type de série » garde au moins 47 (deux lignes), sans débordement", () => {
    for (const screenWidth of [375, 402]) {
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

  it("le stepper des Phases (story 2.8) garde son rendu : sans surface propre, valeur blanche, segmenté de 32", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: numberTarget(9), pauseSeconds: 15, loadKg: 0, workPhases: [{ id: 1, label: "", durationSeconds: 5 }, { id: 2, label: "", durationSeconds: 4 }] } }));
    fireEvent.press(get("execution-sheet-phase-count-toggle"));
    expect(styleOf("execution-sheet-phase-count-field").backgroundColor).toBeUndefined();
    expect(styleOf("execution-sheet-phases-control").height).toBe(32);
    expect(get("execution-sheet-phases-control-indicator")).toBeTruthy();
  });
});
