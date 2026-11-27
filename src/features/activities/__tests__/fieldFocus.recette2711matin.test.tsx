import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Platform, StyleSheet } from "react-native";

import { numberTarget, type ExecutionParameters, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import { FIELD_GROW_SCALE } from "@/features/activities/KeyboardField";
import { TABLE_CELL_ACTIVE_BACKGROUND } from "@/features/activities/sheetTable";
import { formatSeconds, TableCell } from "@/features/sessions/FormatTables";
import { fieldFocusTokens } from "@/shared/ui/fieldFocus";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";
import { valueFieldColors } from "@/shared/ui/valueField";

/**
 * Recette iPhone du 27/11/2026 (matin), paquet FOCUS — standard unique du champ en saisie (agrandi, liseré bleu, ligne inchangée) dans
 * la modale, la page « Exercice libre », les cases des tableaux des Formats et la saisie en place de la Composition (Compte à rebours,
 * Fin de séance) ; hôte natif de « De chaque côté » à la taille de l'option. Jest ne joue ni le clavier, ni le menu natif, ni le
 * rendu iOS : la recette iPhone reste la preuve.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const hidden = { includeHiddenElements: true } as const;
const get = (testID: string) => screen.getByTestId(testID, hidden);
const query = (testID: string) => screen.queryByTestId(testID, hidden);
const styleOf = (testID: string) => StyleSheet.flatten(get(testID).props.style);

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

function renderSheet(parent: ExecutionParametersInput, page = false) {
  render(
    <TestSafeAreaProvider>
      <ExecutionParametersSheet
        parent={parent}
        profileSideRecoverySecondsDefault={10}
        onApply={jest.fn<(value: ExecutionParameters) => void>()}
        onCancel={jest.fn()}
        {...(page ? { presentation: "page" as const, freeFormat: true } : {})}
      />
    </TestSafeAreaProvider>,
  );
}

describe("Standard unique du focus — jetons", () => {
  it("un seul jeu de valeurs : échelle 1,15, liseré de 1 en couleur primaire, fond de saisie #EAEAFF partagé par la modale et les Formats", () => {
    expect(fieldFocusTokens).toMatchObject({ scale: 1.15, frameWidth: 1, frameColor: colors.primary, surface: "#EAEAFF" });
    expect(FIELD_GROW_SCALE).toBe(fieldFocusTokens.scale);
    expect(TABLE_CELL_ACTIVE_BACKGROUND).toBe(fieldFocusTokens.surface);
    expect(valueFieldColors.active).toBe(fieldFocusTokens.surface);
  });
});

describe("Exercice libre (page) — champ en saisie", () => {
  it("le champ grossit avec le liseré bleu ; la ligne ne change pas de couleur", () => {
    renderSheet(params(), true);
    const field = "execution-sheet-target";
    expect(query(`${field}-focus-frame`)).toBeNull();
    fireEvent(get(`${field}-input`), "focus");
    expect(StyleSheet.flatten(get(`${field}-focus-frame`).props.style)).toMatchObject({ position: "absolute", borderWidth: 1, borderColor: colors.primary });
    expect(styleOf(field).transform).toBeDefined();
    expect(styleOf("execution-sheet-row-target-selection").backgroundColor).toBeUndefined();
    fireEvent(get(`${field}-input`), "blur");
    expect(query(`${field}-focus-frame`)).toBeNull();
  });
});

describe("Case de tableau des Formats et saisie en place de la Composition (`TableCell`)", () => {
  it("tableau (largeur fixe) : en saisie, agrandie et liseré bleu, sans changer la hauteur de la case ; hors saisie, rien", () => {
    render(<TableCell kind="duration" value={30} onChange={jest.fn()} format={formatSeconds} label="Durée" width={44} testID="cell" />);
    const heightBefore = styleOf("cell").height;
    expect(query("cell-focus-frame")).toBeNull();
    fireEvent(get("cell"), "focus");
    expect(StyleSheet.flatten(get("cell-focus-frame").props.style)).toMatchObject({ position: "absolute", borderWidth: 1, borderColor: colors.primary, borderRadius: 10 });
    expect(styleOf("cell").height).toBe(heightBefore);
    expect(styleOf("cell-focus-scale").transform).toBeDefined();
    expect(styleOf("cell").backgroundColor).toBe(fieldFocusTokens.surface);
    fireEvent(get("cell"), "blur");
    expect(query("cell-focus-frame")).toBeNull();
  });

  it("ligne de paramètres / Compte à rebours / Fin de séance (sans largeur) : même standard", () => {
    render(<TableCell kind="duration" value={10} onChange={jest.fn()} format={formatSeconds} label="Compte à rebours" badge testID="boundary" />);
    fireEvent(get("boundary"), "focus");
    expect(get("boundary-focus-frame")).toBeTruthy();
    expect(styleOf("boundary-focus-scale").transform).toBeDefined();
  });

  it("case désactivée : ni liseré ni agrandissement", () => {
    render(<TableCell kind="integer" value={3} onChange={jest.fn()} format={String} label="Max" width={44} disabled active testID="off" />);
    expect(query("off-focus-frame")).toBeNull();
  });
});

describe("« De chaque côté » — hôte du menu natif à la taille de l'option", () => {
  it("Avec non sélectionné : hôte de 62 × 26 ; Avec « DD… → GG… » : hôte de 116 × 26 (plus de dimensionnement sur le contenu)", () => {
    expect(Platform.OS).toBe("ios");
    renderSheet(params());
    expect(styleOf("execution-sheet-side-with-menu-host")).toMatchObject({ width: 62, height: 26 });
    expect(get("execution-sheet-side-with-menu-host").props.matchContents).toBeUndefined();
    screen.unmount();
    renderSheet(params({ sideMode: "RIGHT_LEFT" }));
    expect(styleOf("execution-sheet-side-order-menu-host")).toMatchObject({ width: 116, height: 26 });
  });
});
