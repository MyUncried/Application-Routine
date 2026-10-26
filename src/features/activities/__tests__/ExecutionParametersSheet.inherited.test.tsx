import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { numberTarget, type ExecutionParameters, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-6 story 3.3 (AD-37, AD-44) — Feuille des paramètres d'un exercice d'un Circuit de Séries :
 * N hérité (`inheritedSeriesCount`). Le nombre de séries est affiché indisponible, aucune commande
 * ne le change (stepper du nombre, croix de retrait) ; le Régime et les autres réglages restent
 * libres, et changer de Régime conserve N. Sans l'indicateur, la Feuille de PRE-5 est inchangée
 * (ses suites ne sont pas modifiées). Jest ne prouve que l'arbre JS : rendu et VoiceOver relèvent
 * de la recette iPhone (J2).
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const t = strings.executionParameters.circuit;
const hint = t.inheritedSeriesCount;
const hidden = { includeHiddenElements: true } as const;
const get = (testID: string) => screen.getByTestId(testID, hidden);
const query = (testID: string) => screen.queryByTestId(testID, hidden);

const CONTROL = "execution-sheet-series-type-control";
const TOGGLE = "execution-sheet-series-toggle";
const STEPPER = "execution-sheet-series";

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

function renderSheet(parent: ExecutionParametersInput, inheritedSeriesCount?: boolean) {
  const onApply = jest.fn<(value: ExecutionParameters) => void>();
  render(
    <TestSafeAreaProvider>
      <ExecutionParametersSheet
        parent={parent}
        profileSideRecoverySecondsDefault={10}
        inheritedSeriesCount={inheritedSeriesCount}
        onApply={onApply}
        onCancel={jest.fn()}
      />
    </TestSafeAreaProvider>,
  );
  return { onApply };
}

const closedText = () => String(get(`${STEPPER}-value`).props.children);
const tableRows = () => screen.queryAllByTestId(/^execution-sheet-table-row-\d+$/, hidden).length;
const validated = (onApply: ReturnType<typeof renderSheet>["onApply"]) => {
  fireEvent.press(get("execution-sheet-validate"));
  return onApply.mock.calls.at(-1)![0];
};

describe("PRE-6 3.3 — N hérité dans la Feuille des paramètres", () => {
  it("Séries, N = 3 : « 3 séries identiques » affiché, indisponible et expliqué ; son toucher n'ouvre aucun stepper ; ✓ conserve N", () => {
    const { onApply } = renderSheet(params(), true);
    expect(closedText()).toBe("3 séries identiques");
    const toggle = get(TOGGLE);
    expect(toggle.props.accessibilityState).toMatchObject({ disabled: true, expanded: false });
    expect(toggle.props.accessibilityHint).toBe(hint);
    expect(toggle.props.accessibilityLabel).toBe(`Séries, 3 séries identiques, ${t.inheritedSeriesCountSuffix}`);
    expect(StyleSheet.flatten(toggle.props.style).opacity).toBeLessThan(1);
    fireEvent.press(toggle);
    expect(query(`${STEPPER}-increment`)).toBeNull();
    expect(query(`${STEPPER}-field`)).toBeNull();
    // Re-choisir Identiques (option déjà sélectionnée) n'ouvre pas non plus le réglage.
    fireEvent.press(get(`${CONTROL}-UNIFORM`));
    expect(query(`${STEPPER}-increment`)).toBeNull();
    expect(StyleSheet.flatten(get(CONTROL).props.style).height).toBe(32);
    expect(validated(onApply).series).toMatchObject({ kind: "UNIFORM", count: 3 });
  });

  it("Séries, variables : re-choisir l'option sélectionnée (toucher ou activation VoiceOver) n'ouvre aucune surface du nombre ; chevron actif, segmenté de 32, retrait toujours indisponible", () => {
    renderSheet(params(variable(3)), true);
    for (const activate of [
      () => fireEvent.press(get(`${CONTROL}-VARIABLE`)),
      () => fireEvent(get(`${CONTROL}-VARIABLE`), "accessibilityAction", { nativeEvent: { actionName: "activate" } }),
    ]) {
      activate();
      expect(query(`${STEPPER}-field`)).toBeNull();
      expect(query(`${STEPPER}-increment`)).toBeNull();
      expect(StyleSheet.flatten(get(CONTROL).props.style).height).toBe(32);
      expect(get(`${CONTROL}-VARIABLE-chevron`).props.accessibilityState).toMatchObject({ disabled: false });
      expect(get(TOGGLE).props.accessibilityState).toMatchObject({ disabled: true });
    }
    // Le chevron replie le tableau (aucun stepper ouvert à fermer).
    fireEvent.press(get(`${CONTROL}-VARIABLE-chevron`));
    expect(query("execution-sheet-table")).toBeNull();
  });

  it("Séries, passer en variables : 3 lignes ; croix de retrait indisponibles et expliquées ; retour en identiques : N conservé", () => {
    const { onApply } = renderSheet(params(), true);
    fireEvent.press(get(`${CONTROL}-VARIABLE`));
    expect(tableRows()).toBe(3);
    expect(closedText()).toBe("3 séries variables");
    expect(get(TOGGLE).props.accessibilityState).toMatchObject({ disabled: true });
    for (const row of [1, 2, 3]) {
      const remove = get(`execution-sheet-table-row-${row}-remove`);
      expect(remove.props.accessibilityState).toMatchObject({ disabled: true });
      expect(remove.props.accessibilityHint).toBe(hint);
      fireEvent.press(remove);
    }
    expect(tableRows()).toBe(3);
    expect(query("execution-sheet-adjustment")).toBeNull();
    fireEvent.press(get(`${CONTROL}-UNIFORM`));
    expect(closedText()).toBe("3 séries identiques");
    expect(validated(onApply).series).toMatchObject({ kind: "UNIFORM", count: 3 });
  });

  it("Séries, tableau variable ouvert : croix indisponibles, N et lignes inchangés au ✓", () => {
    const { onApply } = renderSheet(params(variable(3)), true);
    expect(tableRows()).toBe(3);
    expect(get("execution-sheet-table-row-2-remove").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(get("execution-sheet-table-row-2-remove"));
    expect(tableRows()).toBe(3);
    const value = validated(onApply);
    expect(value.series.kind).toBe("VARIABLE");
    expect(value.series.kind === "VARIABLE" && value.series.rows).toHaveLength(3);
  });

  it("Inversion : sous N hérité, la Durée totale est en lecture seule ; sans l'indicateur, elle reste modifiable (PRE-5)", () => {
    renderSheet(params(), true);
    expect(query("execution-sheet-total")).toBeNull();
    expect(get("execution-sheet-total-text")).toBeTruthy();
    screen.unmount();
    renderSheet(params());
    expect(get("execution-sheet-total")).toBeTruthy();
  });

  it("hors contexte (indicateur absent ou faux) : nombre réglable, croix actives, sans indice", () => {
    for (const inherited of [undefined, false]) {
      renderSheet(params(variable(3)), inherited);
      const toggle = get(TOGGLE);
      expect(toggle.props.accessibilityState).toMatchObject({ expanded: false });
      expect(toggle.props.accessibilityState.disabled).toBeFalsy();
      expect(toggle.props.accessibilityHint).toBeUndefined();
      expect(get("execution-sheet-table-row-2-remove").props.accessibilityState).toMatchObject({ disabled: false });
      fireEvent.press(get("execution-sheet-table-row-2-remove"));
      expect(tableRows()).toBe(2);
      fireEvent.press(get(TOGGLE));
      expect(within(get(CONTROL)).getByTestId(`${STEPPER}-increment`)).toBeTruthy();
      screen.unmount();
    }
  });
});
