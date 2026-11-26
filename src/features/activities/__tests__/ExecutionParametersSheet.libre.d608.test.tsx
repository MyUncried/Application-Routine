import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { Dimensions, StyleSheet } from "react-native";

import { numberTarget, type ExecutionParameters, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { ExecutionParametersSheet, FREE_ROW_HEIGHT, SHEET_ROW_MIN_HEIGHT } from "@/features/activities/ExecutionParametersSheet";
import { hideExecutionSheetKeyboard, showExecutionSheetKeyboard } from "@/features/activities/testing/executionSheetActions";
import { keyboardBodyReserve, revealDelta } from "@/features/activities/useSheetKeyboard";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * D-608 (D-573 point 5 de la branche de documentation, Hermann, 26/11/2026 ; Formats § 9.10 ; Figma « Exercice libre — Modale de type
 * format » `13269:26160`) — coque de la modale de l'exercice libre : le mouvement et ses phases dans un même cadre, en tête ; option
 * sélectionnée par défaut à droite (ordre de Figma : « Durée | Répétitions », « Identiques | n séries variables ») ; lignes de 38 ;
 * De chaque côté, Cadence et Récupération dans un même dernier cadre ; bandes pleine largeur.
 * D-607 (D-572 point 1, Hermann, 25/11/2026) — le clavier ne masque jamais le champ saisi (Charge notamment) : réserve de la hauteur
 * du clavier sous les cadres, qui remonte une feuille courte au-dessus du clavier.
 * Jest ne prouve ni le rendu ni le clavier réels : recette iPhone.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const hidden = { includeHiddenElements: true } as const;
const get = (testID: string) => screen.getByTestId(testID, hidden);
const query = (testID: string) => screen.queryByTestId(testID, hidden);
const styleOf = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};

function params(overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 5,
    mode: "REPETITIONS",
    series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 0, workPhases: [] },
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

const withPhases = params({
  mode: "DURATION",
  series: {
    kind: "UNIFORM",
    count: 3,
    target: numberTarget(9),
    pauseSeconds: 15,
    loadKg: 0,
    workPhases: [
      { id: 1, label: "Descente", durationSeconds: 6 },
      { id: 2, label: "Maintien", durationSeconds: 3 },
    ],
  },
});

const MOVEMENT = { movement: { name: "Squats sautés", media: [], bodyZoneIds: [] as string[] }, levelRank: 3 };

function renderFree(parent: ExecutionParametersInput, extra: { readonly freeFormat?: boolean } = {}) {
  const onApply = jest.fn<(value: ExecutionParameters) => void>();
  render(
    <TestSafeAreaProvider>
      <ExecutionParametersSheet
        parent={parent}
        profileSideRecoverySecondsDefault={10}
        exerciseSignals="absent"
        freeFormat={extra.freeFormat ?? true}
        freeMovement={MOVEMENT}
        movementName="Squats sautés"
        recovery={{ seconds: 30, onApply: jest.fn() }}
        presentation="compositionCard"
        onApply={onApply}
        onCancel={jest.fn()}
      />
    </TestSafeAreaProvider>,
  );
  return { onApply };
}

const framesInOrder = () =>
  get("execution-sheet-panel-host")
    .children.filter((child): child is ReturnType<typeof screen.getByTestId> => typeof child !== "string")
    .map((child) => String(child.props.testID))
    .filter((id) => id.startsWith("execution-sheet-frame-"));
/** Options d’un segmenté, de gauche à droite (position des fonds d’option). */
const optionOrder = (control: string) =>
  screen
    .queryAllByTestId(new RegExp(`^${control}-tile-`), hidden)
    .map((tile) => ({ value: String(tile.props.testID).replace(`${control}-tile-`, ""), left: Number(StyleSheet.flatten(tile.props.style).left) }))
    .sort((a, b) => a.left - b.left)
    .map((tile) => tile.value);

describe("D-608 (D-573 point 5) — modale de l'exercice libre", () => {
  it("cadres : Mouvement et phases en tête, Exécution, Séries, Durée de l'exercice, puis côté, cadence et récupération ; aucun intitulé « Paramètres d'exécution »", () => {
    renderFree(withPhases);
    expect(framesInOrder()).toEqual([
      "execution-sheet-frame-movement",
      "execution-sheet-frame-execution",
      "execution-sheet-frame-series",
      "execution-sheet-frame-cadence",
      "execution-sheet-frame-sides",
    ]);
    expect(query("execution-sheet-free-section")).toBeNull();
    expect(query("execution-sheet-frame-phases")).toBeNull();
    expect(query("execution-sheet-frame-recovery")).toBeNull();
    const movementFrame = within(get("execution-sheet-frame-movement"));
    expect(movementFrame.getByText("Mouvement", hidden)).toBeTruthy();
    expect(movementFrame.getByTestId("execution-sheet-movement-card", hidden)).toBeTruthy();
    expect(movementFrame.getByText("Squats sautés", hidden)).toBeTruthy();
    expect(movementFrame.getByText("Niveau 3", hidden)).toBeTruthy();
    expect(movementFrame.getByTestId("execution-sheet-row-phases", hidden)).toBeTruthy();
    // « Changer » : aucun parcours de changement du mouvement d'un exercice existant — non rendu (À CLARIFIER).
    expect(screen.queryByText("Changer", hidden)).toBeNull();
    // Trois dernières lignes dans le même cadre ; la Durée de l'exercice garde le sien, avant.
    const last = within(get("execution-sheet-frame-sides"));
    for (const id of ["execution-sheet-row-side", "execution-sheet-row-beep", "execution-sheet-row-recovery"]) {
      expect(last.getByTestId(id, hidden)).toBeTruthy();
    }
    expect(within(get("execution-sheet-frame-cadence")).queryByTestId("execution-sheet-row-beep", hidden)).toBeNull();
    expect(within(get("execution-sheet-frame-cadence")).getByTestId("execution-sheet-row-total", hidden)).toBeTruthy();
  });

  it("sans phases : le cadre du mouvement n'a pas de ligne de phases", () => {
    renderFree(params());
    expect(get("execution-sheet-frame-movement")).toBeTruthy();
    expect(query("execution-sheet-row-phases")).toBeNull();
  });

  // Conformité (classe A) : le segmenté partagé `inline` place déjà l'option sélectionnée à droite (essai du 04/11/2026,
  // `SegmentedControl`) — l'ordre de Figma `13269:26160` en découle ; aucun ordre propre à l'exercice libre.
  it("option sélectionnée à droite dans chaque segmenté (Mode, Condition d'arrêt, Séries, Charge, De chaque côté, Cadence)", () => {
    renderFree(params());
    expect(optionOrder("execution-sheet-mode-control")).toEqual(["DURATION", "REPETITIONS"]);
    expect(optionOrder("execution-sheet-stop-condition-control")).toEqual(["FAILURE", "TARGET"]);
    expect(optionOrder("execution-sheet-series-type-control")).toEqual(["VARIABLE", "UNIFORM"]);
    expect(optionOrder("execution-sheet-load-control")).toEqual(["WITH", "WITHOUT"]);
    expect(optionOrder("execution-sheet-side-control")).toEqual(["WITH", "WITHOUT"]);
    expect(optionOrder("execution-sheet-cadence-control")).toEqual(["OTHER", "1", "NONE"]);
  });

  it("ailleurs : lignes de 44, aucun cadre du mouvement", () => {
    renderFree(params(), { freeFormat: false });
    expect(styleOf("execution-sheet-row-mode-line").minHeight).toBe(SHEET_ROW_MIN_HEIGHT);
    expect(query("execution-sheet-frame-movement")).toBeNull();
  });

  it("lignes de 38 ; bandes pleine largeur (#F9FAFC, sans arrondi ni contour), écart de 10", () => {
    renderFree(withPhases);
    expect(FREE_ROW_HEIGHT).toBe(38);
    for (const id of ["execution-sheet-row-mode-line", "execution-sheet-row-load-line", "execution-sheet-row-recovery-line", "execution-sheet-row-movement-line"]) {
      expect(styleOf(id).minHeight).toBe(38);
    }
    for (const frame of ["movement", "execution", "series", "cadence", "sides"]) {
      expect(styleOf(`execution-sheet-frame-${frame}`)).toMatchObject({ backgroundColor: "#F9FAFC", borderRadius: 0, borderWidth: 0, marginHorizontal: -24, marginTop: 10 });
    }
  });
});

describe("D-607 (D-572 point 1) — le clavier ne masque jamais le champ saisi", () => {
  it("réserve : part du corps recouverte par le clavier ; rien clavier fermé ou sans recouvrement", () => {
    expect(keyboardBodyReserve(840, 500)).toBe(340);
    expect(keyboardBodyReserve(840, 499.4)).toBe(341);
    expect(keyboardBodyReserve(840, null)).toBe(0);
    expect(keyboardBodyReserve(840, 900)).toBe(0);
    expect(keyboardBodyReserve(840, 0)).toBe(0);
  });

  it("feuille courte (Charge et De chaque côté seulement), corps de 120 recouvert : avec la réserve, la ligne de la Charge se révèle sous le haut du corps", () => {
    // Avant : corps 720..840 entièrement sous le clavier (haut à 500) ; la ligne 760..804 ne pouvait être remontée qu'au-dessus du
    // haut du corps (720), donc rognée. Avec la réserve (340), la feuille grandit : corps 380..840, ligne 420..464, visible (0).
    expect(revealDelta(760, 804, 720, 500)).toBeGreaterThan(0);
    const reserve = keyboardBodyReserve(840, 500);
    expect(revealDelta(760 - reserve, 804 - reserve, 720 - reserve, 500)).toBe(0);
  });

  it("feuille à départ rapide, Charge au clavier : réserve de la hauteur du clavier sous les cadres, retirée à la fermeture", () => {
    const onApply = jest.fn<(value: ExecutionParameters) => void>();
    render(
      <TestSafeAreaProvider>
        <ExecutionParametersSheet
          parent={params({ loadEnabled: true, series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 20, workPhases: [] } })}
          profileSideRecoverySecondsDefault={10}
          quickFormatName="Tabata"
          quickFormatKey="TABATA"
          onApply={onApply}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );
    expect(query("execution-sheet-keyboard-room")).toBeNull();
    fireEvent(get("execution-sheet-load-input-input"), "focus");
    showExecutionSheetKeyboard();
    // Bas du corps = bas de la fenêtre − marge de sécurité (34) ; clavier simulé à 500.
    const expected = Math.ceil(Dimensions.get("window").height - 34 - 500);
    expect(styleOf("execution-sheet-keyboard-room").height).toBe(expected);
    // La réserve suit les cadres (la Charge, dernier champ, peut passer au-dessus du clavier).
    const host = get("execution-sheet-panel-host").children.map((child) => (typeof child === "string" ? "" : String(child.props.testID)));
    expect(host.indexOf("execution-sheet-keyboard-room")).toBeGreaterThan(host.indexOf("execution-sheet-frame-series"));
    fireEvent(get("execution-sheet-load-input-input"), "blur");
    hideExecutionSheetKeyboard();
    expect(query("execution-sheet-keyboard-room")).toBeNull();
  });
});
