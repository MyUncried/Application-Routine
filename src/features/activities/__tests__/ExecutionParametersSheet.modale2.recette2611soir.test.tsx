import { describe, expect, it, jest } from "@jest/globals";
import { Menu } from "@expo/ui/swift-ui";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Platform, StyleSheet } from "react-native";

import {
  numberTarget,
  unsetTarget,
  type ExecutionParameters,
  type ExecutionParametersInput,
  type WorkPhase,
} from "@/domain/activities/ExecutionParameters";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import { FIELD_GROW_SCALE } from "@/features/activities/KeyboardField";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors, type } from "@/shared/ui/tokens";

/**
 * Recette iPhone du 26/11/2026 (soir), paquet MODALE2 — modale « Paramètres d'exécution » : liseré bleu et agrandissement du champ en
 * saisie, « De chaque côté » (Avec ouvre directement le menu natif, sans valeur par défaut ; option « DD… → GG… » élargie), taille de
 * la valeur « Durée de l'exercice ». Jest ne joue ni le menu natif iOS, ni le clavier, ni le rendu : la recette iPhone reste la preuve.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const hidden = { includeHiddenElements: true } as const;
const get = (testID: string) => screen.getByTestId(testID, hidden);
const query = (testID: string) => screen.queryByTestId(testID, hidden);

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

function renderSheet(parent: ExecutionParametersInput) {
  const onApply = jest.fn<(value: ExecutionParameters) => void>();
  render(
    <TestSafeAreaProvider>
      <ExecutionParametersSheet parent={parent} profileSideRecoverySecondsDefault={10} onApply={onApply} onCancel={jest.fn()} />
    </TestSafeAreaProvider>,
  );
  return { onApply };
}

const applied = (onApply: jest.Mock<(value: ExecutionParameters) => void>) => onApply.mock.calls.at(-1)![0];
const validate = () => fireEvent.press(get("execution-sheet-validate"));

type NativeButton = { readonly key: string | null; readonly props: { readonly children: readonly unknown[]; readonly onPress: () => void } };
function nativeButtons(hostTestID: string): readonly NativeButton[] {
  const menu = get(hostTestID).findByType(Menu);
  return ([] as NativeButton[]).concat(menu.props.children as NativeButton[]);
}

describe("Recette iPhone du 26/11/2026 (soir) — « De chaque côté »", () => {
  it("iOS : Avec non sélectionné est le déclencheur du menu natif ; aucune notation cochée ; rien n'est écrit avant le choix ; le choix active Avec avec la notation", () => {
    expect(Platform.OS).toBe("ios");
    const { onApply } = renderSheet(params());
    const host = "execution-sheet-side-with-menu-host";
    expect(get(host)).toBeTruthy();
    expect(get("execution-sheet-side-with-menu-idle")).toBeTruthy();
    // Aucune coche (aucune valeur par défaut).
    expect(nativeButtons(host).map((button) => button.props.children.length)).toEqual([1, 1]);
    // Menu fermé sans choix : la Feuille reste « Sans ».
    validate();
    expect(applied(onApply)).toMatchObject({ sideMode: "UNILATERAL" });
    // Choix « DG → DG → … » : Avec, cette notation, Pause entre les côtés du Profil (P3-10).
    act(() => nativeButtons(host).find((button) => button.key === "BY_SERIES")!.props.onPress());
    expect(query(host)).toBeNull();
    const selectedHost = "execution-sheet-side-order-menu-host";
    expect(nativeButtons(selectedHost).find((button) => button.props.children.length === 2)?.key).toBe("BY_SERIES");
    validate();
    expect(applied(onApply)).toMatchObject({ sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES", sideRecoverySeconds: 10 });
  });

  it("iOS : option sélectionnée « DD… → GG… » de 116 (cadre élargi) ; un seul nombre de séries (N = 1) : pas de menu sur Avec", () => {
    renderSheet(params({ sideMode: "RIGHT_LEFT" }));
    expect(StyleSheet.flatten(get("execution-sheet-side-control-tile-WITH").props.style)).toMatchObject({ width: 116 });
    expect(StyleSheet.flatten(get("execution-sheet-side-order-menu").props.style)).toMatchObject({ width: 116, height: 26 });
    screen.unmount();
    renderSheet(params({ series: { kind: "UNIFORM", count: 1, target: numberTarget(30), pauseSeconds: 15, loadKg: 0, workPhases: [] } }));
    expect(query("execution-sheet-side-with-menu-host")).toBeNull();
  });
});

describe("Recette iPhone du 26/11/2026 (soir) — champ en saisie", () => {
  it("le champ en saisie porte un liseré bleu (calque, sans mise en page déplacée) et l'agrandissement passe à 1,15 ; sorti du champ, plus de liseré", () => {
    expect(FIELD_GROW_SCALE).toBe(1.15);
    renderSheet(params());
    const field = "execution-sheet-target";
    expect(query(`${field}-focus-frame`)).toBeNull();
    fireEvent(get(`${field}-input`), "focus");
    const frame = StyleSheet.flatten(get(`${field}-focus-frame`).props.style);
    expect(frame).toMatchObject({ position: "absolute", borderWidth: 1, borderColor: colors.primary });
    fireEvent(get(`${field}-input`), "blur");
    expect(query(`${field}-focus-frame`)).toBeNull();
  });
});

describe("Recette iPhone du 26/11/2026 (soir), remarque c — Durée de l'exercice", () => {
  it("valeur en lecture seule à la taille des valeurs de la modale (13/16), plus en 14", () => {
    const workPhases: WorkPhase[] = [
      { id: 1, label: "A", durationSeconds: 9 },
      { id: 2, label: "B", durationSeconds: 0 },
    ];
    // Durée manquante : Durée de l'exercice en lecture seule (« — »), comme `ExecutionParametersSheet.mfn.a21`.
    renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: unsetTarget(), pauseSeconds: 15, loadKg: 0, workPhases } }));
    expect(StyleSheet.flatten(get("execution-sheet-total-text").props.style)).toMatchObject({
      fontSize: type.editableValue.fontSize,
      lineHeight: type.editableValue.lineHeight,
      color: colors.textPrimary,
    });
  });
});
