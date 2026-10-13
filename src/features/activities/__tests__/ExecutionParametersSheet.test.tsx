import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import type { ExecutionParameters, ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { dragDestination, ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-3 (CE-UI-10) — rendu et actions de la feuille Paramètres. Les montants
 * et transitions sont calculés par le Domaine (`executionCalculations`,
 * `ExecutionParametersDraft`) et prouvés dans leurs suites ; ici, on vérifie
 * que la surface les affiche, les délègue et n'écrit rien (aucun service).
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

function params(overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 1,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 3, target: 90, pauseSeconds: 15 },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    ...overrides,
  };
}

const variableRows = (rows: [number | null, number][]) => ({
  kind: "VARIABLE" as const,
  rows: rows.map(([target, pauseSeconds]) => ({ target, pauseSeconds })),
});

function renderSheet(parent: ExecutionParametersInput, profileSideRecovery = 10) {
  const onApply = jest.fn<(value: ExecutionParameters) => void>();
  const onCancel = jest.fn();
  render(
    <TestSafeAreaProvider>
      <ExecutionParametersSheet
        parent={parent}
        profileSideRecoverySecondsDefault={profileSideRecovery}
        onApply={onApply}
        onCancel={onCancel}
      />
    </TestSafeAreaProvider>,
  );
  return { onApply, onCancel };
}

function tap(testID: string) {
  fireEvent(screen.getByTestId(testID), "pressIn");
  fireEvent(screen.getByTestId(testID), "pressOut");
}

const valueOf = (testID: string) => screen.getByTestId(`${testID}-value`).props.children as string;
const text = (testID: string) => String(screen.getByTestId(`${testID}-text`).props.children);
const validate = () => fireEvent.press(screen.getByTestId("execution-sheet-validate"));
const applied = (onApply: jest.Mock<(value: ExecutionParameters) => void>) => onApply.mock.calls[0]![0];
/** Action accessible de la poignée d'une ligne (même déplacement métier que le glisser). */
const moveAction = (row: number, actionName: "moveUp" | "moveDown") =>
  fireEvent(screen.getByTestId(`execution-sheet-table-row-${row}-handle`), "accessibilityAction", {
    nativeEvent: { actionName },
  });
const actionNames = (row: number) =>
  (screen.getByTestId(`execution-sheet-table-row-${row}-handle`).props.accessibilityActions as { name: string }[]).map(
    (action) => action.name,
  );
/** Glisser vertical réel sur la poignée (responder natif) : de `dy` points. */
function dragHandle(row: number, dy: number) {
  const handle = screen.getByTestId(`execution-sheet-table-row-${row}-handle`);
  fireEvent(handle, "responderGrant", { nativeEvent: { pageY: 100 } });
  fireEvent(handle, "responderMove", { nativeEvent: { pageY: 100 + dy } });
  fireEvent(screen.getByTestId(`execution-sheet-table-row-${row}-handle`), "responderRelease", {
    nativeEvent: { pageY: 100 + dy },
  });
}

afterEach(() => {
  jest.useRealTimers();
});

describe("ExecutionParametersSheet — PRE-3", () => {
  it("P3-07/move-accessible — actions Monter/Descendre de la poignée : cible ET Pause ensemble, renumérotation, bornes absentes ; même résultat que le glisser", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    expect(actionNames(1)).toEqual(["moveDown"]);
    expect(actionNames(3)).toEqual(["moveUp"]);
    moveAction(3, "moveUp");
    moveAction(2, "moveUp");
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("1 min");
    expect(valueOf("execution-sheet-table-row-1-pause")).toBe("30 s");
    validate();
    expect(applied(onApply).series).toEqual(variableRows([[60, 30], [30, 10], [45, 20]]));
  });

  it("P3-08/immediate-N1 — N=1 : uniforme et un côté après l'autre immédiatement ; contrôles sans effet grisés ; total 220 s", () => {
    const { onApply } = renderSheet(
      params({ series: variableRows([[90, 15], [45, 20], [60, 30]]), sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES", sideRecoverySeconds: 10 }),
    );
    tap("execution-sheet-series-decrement");
    tap("execution-sheet-series-decrement");
    expect(valueOf("execution-sheet-series")).toBe("1 série");
    expect(screen.getByTestId("execution-sheet-variable-switch").props.disabled).toBe(true);
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    expect(screen.getByTestId("execution-sheet-order-value").props.accessibilityState).toMatchObject({ disabled: true });
    expect(text("execution-sheet-order-value")).toContain("Un côté après l’autre");
    expect(text("execution-sheet-total")).toBe("3 min 40 s");
    validate();
    expect(applied(onApply)).toMatchObject({
      series: { kind: "UNIFORM", count: 1, target: 90, pauseSeconds: 15 },
      sideOrder: "BY_SIDE",
    });
  });

  it("P3-09/directions — droite→gauche ou gauche→droite : totaux identiques ; PC une fois par côté, N fois par série", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: 30, pauseSeconds: 10 }, sideMode: "RIGHT_LEFT", sideRecoverySeconds: 15 }));
    // Un côté après l'autre : 2 × 3 × (30 + 10) + 15 = 255 s.
    expect(text("execution-sheet-total")).toBe("4 min 15 s");
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    fireEvent.press(within(screen.getByTestId("execution-sheet-side-control")).getByText("Gauche puis droite"));
    expect(text("execution-sheet-total")).toBe("4 min 15 s");
    fireEvent.press(screen.getByTestId("execution-sheet-order-value"));
    fireEvent.press(within(screen.getByTestId("execution-sheet-order-control")).getByText("Les deux côtés à chaque série"));
    // Les deux côtés à chaque série : 2 × 90 + 30 + 3 × 15 = 255 s — PC compté N fois.
    expect(text("execution-sheet-total")).toBe("4 min 15 s");
    tap("execution-sheet-side-recovery-increment");
    // PC 16 : par série + 3 s ; par côté il n'ajouterait qu'une seconde.
    expect(text("execution-sheet-total")).toBe("4 min 18 s");
  });

  it("P3-09/unilateral-controls — sans changement de côté : ordre et PC masqués, aucune contribution de PC", () => {
    const { onApply } = renderSheet(params({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 15 }));
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    fireEvent.press(within(screen.getByTestId("execution-sheet-side-control")).getByText("Sans changement"));
    expect(screen.queryByTestId("execution-sheet-order-value")).toBeNull();
    expect(screen.queryByTestId("execution-sheet-side-recovery")).toBeNull();
    // 3 × (90 + 15) = 315 s, sans PC.
    expect(text("execution-sheet-total")).toBe("5 min 15 s");
    validate();
    expect(applied(onApply).sideMode).toBe("UNILATERAL");
  });

  it("P3-11/all-modes-bip — Bip présent et commun dans les trois modes ; même valeur conservée en changeant de mode", () => {
    const { onApply } = renderSheet(params());
    tap("execution-sheet-beep-increment");
    tap("execution-sheet-beep-increment");
    expect(valueOf("execution-sheet-beep")).toBe("2 s");
    for (const mode of ["Répétitions", "À l’échec", "Durée"]) {
      // D-4 : le sélecteur se referme après chaque choix ; il est rouvert pour le suivant.
      fireEvent.press(screen.getByTestId("execution-sheet-mode-value"));
      fireEvent.press(within(screen.getByTestId("execution-sheet-mode-control")).getByText(mode));
      expect(valueOf("execution-sheet-beep")).toBe("2 s");
    }
    validate();
    expect(applied(onApply).cadenceBeepIntervalSeconds).toBe(2);
  });

  it("P3-14/inverse-enumeration — total demandé 100 s : N=3 retenu (égalité vers le plus grand), message d'ajustement 2 min ; 80 s exact sans message", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 1, target: 30, pauseSeconds: 10 } }));
    fireEvent.press(screen.getByTestId("execution-sheet-total"));
    fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 1 } });
    fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 40 } });
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(valueOf("execution-sheet-series")).toBe("3 séries");
    expect(screen.getByText("Durée ajustée à 2 min pour respecter un nombre entier de séries.")).toBeTruthy();

    fireEvent.press(screen.getByTestId("execution-sheet-total"));
    fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 1 } });
    fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 20 } });
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(valueOf("execution-sheet-series")).toBe("2 séries");
    expect(screen.queryByText(/Durée ajustée/)).toBeNull();
  });

  it("P3-14/inverse-boundaries — inversion réservée à la Durée uniforme : total non modifiable en variable, Répétitions ou À l'échec", () => {
    renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
    expect(text("execution-sheet-total")).toBe("3 min 15 s");
    fireEvent.press(screen.getByTestId("execution-sheet-mode-value"));
    fireEvent.press(within(screen.getByTestId("execution-sheet-mode-control")).getByText("À l’échec"));
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
  });

  it("P3-16/fold-incomplete — Série 2 incomplète : ✓ grisé, cellule « Série 2 » signalée (aucun message, décision D-2), même tableau replié, données intactes, total —", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 10], [null, 20], [60, 30]]) }));
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    // Décision propriétaire D-2 (12/10) : plus de message « Série 2 : renseignez la durée. » ;
    // la Série est identifiée par sa cellule signalée (contour figé) et annoncée « Valeur à renseigner ».
    expect(screen.queryByTestId("execution-sheet-message")).toBeNull();
    expect(screen.getByTestId("execution-sheet-table-row-2-target").props.accessibilityHint).toBe("Valeur à renseigner");
    expect(screen.getByTestId("execution-sheet-table-row-2-target").props.accessibilityLabel).toMatch(/2/);
    // Recette 1 (A-02/A-07) : contour figé 6665:27232 (#FF8D28, 1,5) — remplace l’ancien rouge danger (E19, non sourcé v13).
    const invalidCell = StyleSheet.flatten(screen.getByTestId("execution-sheet-table-row-2-target").props.style);
    expect(invalidCell.borderColor).toBe("#FF8D28");
    expect(invalidCell.borderWidth).toBe(1.5);
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-table-row-1-target").props.style).borderColor).toBeUndefined();
    expect(text("execution-sheet-total")).toBe("—");
    // Replier ne modifie ni les données ni la validation.
    fireEvent.press(screen.getByLabelText("Masquer le tableau des séries"));
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    expect(screen.queryByTestId("execution-sheet-message")).toBeNull();
    validate();
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText("Afficher le tableau des séries"));
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("—");
    expect(valueOf("execution-sheet-table-row-3-target")).toBe("1 min");
    // Correction de la cellule : ✓ redevient actif et le message disparaît.
    tap("execution-sheet-table-row-2-target-increment");
    expect(screen.queryByTestId("execution-sheet-message")).toBeNull();
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: false });
  });

  it("P3-19/hold — Séries : tap 1, rien avant 500 ms, répétition 150 ms, pas 5 après 2 s, arrêt immédiat au relâchement", () => {
    jest.useFakeTimers();
    renderSheet(params({ series: { kind: "UNIFORM", count: 37, target: 30, pauseSeconds: 0 } }));
    act(() => {
      fireEvent(screen.getByTestId("execution-sheet-series-increment"), "pressIn");
    });
    expect(valueOf("execution-sheet-series")).toBe("38 séries");
    act(() => jest.advanceTimersByTime(490));
    expect(valueOf("execution-sheet-series")).toBe("38 séries");
    act(() => jest.advanceTimersByTime(10));
    expect(valueOf("execution-sheet-series")).toBe("39 séries");
    act(() => jest.advanceTimersByTime(150));
    expect(valueOf("execution-sheet-series")).toBe("40 séries");
    act(() => {
      fireEvent(screen.getByTestId("execution-sheet-series-increment"), "pressOut");
    });
    act(() => jest.advanceTimersByTime(3000));
    expect(valueOf("execution-sheet-series")).toBe("40 séries");
  });

  it("P3-19/non-accelerated — Bip, Compte à rebours et Fin restent au pas 1 au-delà de 4 s de maintien", () => {
    jest.useFakeTimers();
    renderSheet(params({ countdownSeconds: 0 }));
    act(() => {
      fireEvent(screen.getByTestId("execution-sheet-countdown-increment"), "pressIn");
    });
    act(() => jest.advanceTimersByTime(500 + 150 * 30));
    act(() => {
      fireEvent(screen.getByTestId("execution-sheet-countdown-increment"), "pressOut");
    });
    // 1 (tap) + 1 (500 ms) + 30 répétitions au pas 1 = 32 s, jamais un multiple accéléré.
    expect(valueOf("execution-sheet-countdown")).toBe("32 s");
  });

  it("P3-19/exclusive-scroll — un seul contrôle en place ouvert ; l'ouverture d'un autre démonte le premier ; en-tête hors du corps défilant", () => {
    renderSheet(params());
    fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
    expect(screen.getByTestId("execution-sheet-target-wheel")).toBeTruthy();
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    expect(screen.queryByTestId("execution-sheet-target-wheel")).toBeNull();
    expect(screen.getByTestId("execution-sheet-side-control")).toBeTruthy();
    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    expect(screen.queryByTestId("execution-sheet-side-control")).toBeNull();
    const body = screen.getByTestId("execution-sheet-body");
    expect(within(body).queryByTestId("execution-sheet-validate")).toBeNull();
    expect(within(body).getByTestId("execution-sheet-end")).toBeTruthy();
  });

  it("P3-20/all-surfaces — titre, ✕ / ✓, lignes et libellés des écrans de référence ; valeurs « — » / « Aucun » à l'état vide", () => {
    renderSheet(params({ mode: null, series: { kind: "UNIFORM", count: 1, target: null, pauseSeconds: 0 }, sideMode: null }));
    expect(screen.getByText("Paramètres d’exécution")).toBeTruthy();
    for (const label of ["Mode d’exécution", "Séries", "Séries variables", "Pause après chaque série", "Changement de côté", "Bip de cadence", "Compte à rebours", "Fin d’exercice"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(text("execution-sheet-mode-value")).toBe("—");
    expect(valueOf("execution-sheet-series")).toBe("1 série");
    expect(valueOf("execution-sheet-beep")).toBe("Aucun");
    expect(text("execution-sheet-side-value")).toBe("Sans changement");
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
  });

  it("P3-20/sheet-specific — voile #1F2129 à 34 % ; Bip avant le total applicable, sinon avant Compte à rebours ; lignes indentées vs premier niveau", () => {
    renderSheet(params({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 10 }));
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-scrim").props.style)).toMatchObject({
      backgroundColor: "rgba(31, 33, 41, 0.34)",
    });
    const order = ["execution-sheet-row-beep", "execution-sheet-row-total", "execution-sheet-row-countdown"];
    const json = JSON.stringify(screen.toJSON());
    const positions = order.map((id) => json.indexOf(`"${id}"`));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-row-side-recovery").props.style).marginLeft).toBe(16);
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-row-beep").props.style).marginLeft).toBeUndefined();
  });

  it("P3-20/sheet-specific — À l'échec : aucun total, Bip immédiatement avant Compte à rebours", () => {
    renderSheet(params({ mode: "TO_FAILURE", series: { kind: "UNIFORM", count: 3, target: null, pauseSeconds: 15 } }));
    expect(screen.queryByTestId("execution-sheet-row-total")).toBeNull();
    const json = JSON.stringify(screen.toJSON());
    expect(json.indexOf('"execution-sheet-row-beep"')).toBeLessThan(json.indexOf('"execution-sheet-row-countdown"'));
  });

  it("P3-21/accessible-controls — libellés complets, états désactivés, valeurs courantes, actions ✓/✕ nommées", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 1, target: 90, pauseSeconds: 0 } }));
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityLabel).toBe("Valider les paramètres");
    expect(screen.getByTestId("execution-sheet-cancel").props.accessibilityLabel).toBe("Annuler les paramètres");
    expect(screen.getByTestId("execution-sheet-series-decrement").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("execution-sheet-variable-switch").props.accessibilityLabel).toContain("sans effet");
    expect(screen.getByTestId("execution-sheet").props.accessibilityViewIsModal).toBe(true);
    expect(screen.getByTestId("execution-sheet-target-value").props.accessibilityLabel).toBe("Durée d’une série, 1 min 30 s");
  });

  it("INTERACTION/wheel — roulette en place : valeur validée appliquée au brouillon ; ✕ de la roulette sans effet ; ✓ de la feuille applique", () => {
    const { onApply } = renderSheet(params());
    fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
    fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 2 } });
    fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
    expect(text("execution-sheet-target-value")).toBe("1 min 30 s");
    fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
    fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 2 } });
    fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 0 } });
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(text("execution-sheet-target-value")).toBe("2 min");
    validate();
    expect(applied(onApply).series).toEqual({ kind: "UNIFORM", count: 3, target: 120, pauseSeconds: 15 });
  });

  it("ACCESSIBILITY/wheel — réglage nommé avec sa valeur ; Valider/Annuler de la roulette nommés ; pastille annoncée déployée", () => {
    renderSheet(params());
    fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
    expect(screen.getByTestId("execution-sheet-target-value").props.accessibilityState).toMatchObject({ expanded: true });
    expect(screen.getByTestId("duration-wheel-validate").props.accessibilityLabel.length).toBeGreaterThan(0);
    expect(screen.getByTestId("duration-wheel-cancel").props.accessibilityLabel.length).toBeGreaterThan(0);
    fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
    expect(screen.getByTestId("execution-sheet-target-value").props.accessibilityState).toMatchObject({ expanded: false });
  });

  it("INTERACTION/stepper — tap unique ; borne respectée ; aucun pas au relâchement", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 3, target: 90, pauseSeconds: 300 } }));
    expect(screen.getByTestId("execution-sheet-pause-increment").props.accessibilityState).toMatchObject({ disabled: true });
    tap("execution-sheet-pause-decrement");
    expect(valueOf("execution-sheet-pause")).toBe("4 min 59 s");
    tap("execution-sheet-pause-increment");
    expect(valueOf("execution-sheet-pause")).toBe("5 min");
  });

  it("ACCESSIBILITY/stepper — réglage ajustable nommé avec unité ; incrémenter/décrémenter accessibles au pas 1", () => {
    renderSheet(params({ cadenceBeepIntervalSeconds: 4 }));
    const beep = screen.getByTestId("execution-sheet-beep");
    expect(beep.props.accessibilityRole).toBe("adjustable");
    expect(beep.props.accessibilityLabel).toBe("Bip de cadence, secondes");
    expect(beep.props.accessibilityValue).toMatchObject({ min: 0, max: 10, now: 4 });
    fireEvent(beep, "accessibilityAction", { nativeEvent: { actionName: "increment" } });
    expect(valueOf("execution-sheet-beep")).toBe("5 s");
    fireEvent(screen.getByTestId("execution-sheet-beep"), "accessibilityAction", { nativeEvent: { actionName: "decrement" } });
    expect(valueOf("execution-sheet-beep")).toBe("4 s");
  });

  it("INTERACTION/variable-toggle — uniforme → lignes copiées ; retour uniforme = première ligne ; réactivation restaure ; égalité garde VARIABLE", () => {
    const { onApply } = renderSheet(params({ series: { kind: "UNIFORM", count: 2, target: 30, pauseSeconds: 10 } }));
    fireEvent(screen.getByTestId("execution-sheet-variable-switch"), "valueChange", true);
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("30 s");
    tap("execution-sheet-table-row-2-target-increment");
    fireEvent(screen.getByTestId("execution-sheet-variable-switch"), "valueChange", false);
    expect(text("execution-sheet-target-value")).toBe("30 s");
    fireEvent(screen.getByTestId("execution-sheet-variable-switch"), "valueChange", true);
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("31 s");
    tap("execution-sheet-table-row-2-target-decrement");
    validate();
    expect(applied(onApply).series).toEqual(variableRows([[30, 10], [30, 10]]));
  });

  it("ACCESSIBILITY/variable-toggle — sélection effective exposée ; N=1 rend le choix inactif et annoncé ; lignes dans l'ordre de lecture", () => {
    renderSheet(params({ series: variableRows([[30, 10], [45, 20]]) }));
    expect(screen.getByTestId("execution-sheet-variable-switch").props.value).toBe(true);
    const json = JSON.stringify(screen.toJSON());
    expect(json.indexOf("execution-sheet-table-row-1")).toBeLessThan(json.indexOf("execution-sheet-table-row-2"));
    tap("execution-sheet-series-decrement");
    expect(screen.getByTestId("execution-sheet-variable-switch").props.value).toBe(false);
    expect(screen.getByTestId("execution-sheet-variable-switch").props.disabled).toBe(true);
  });

  it("INTERACTION/sortable-rows — déplacement puis ✕ : rien n'est appliqué au parent", () => {
    const { onApply, onCancel } = renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    dragHandle(1, 42);
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("45 s");
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("30 s");
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
  });

  it("ACCESSIBILITY/sortable-rows — Monter/Descendre portent le rang ; rangs actualisés après déplacement", () => {
    renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    const handle = screen.getByTestId("execution-sheet-table-row-2-handle");
    expect(handle.props.accessibilityLabel).toBe("Déplacer la série 2");
    expect(handle.props.accessibilityActions).toEqual([
      { name: "moveUp", label: "Monter la série 2" },
      { name: "moveDown", label: "Descendre la série 2" },
    ]);
    expect(screen.getByTestId("execution-sheet-table-row-2-target").props.accessibilityLabel).toBe("Série 2, Durée");
    moveAction(2, "moveUp");
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("45 s");
    expect(screen.getByTestId("execution-sheet-table-row-1-pause").props.accessibilityLabel).toBe("Série 1, pause");
  });

  it("INTERACTION/sheet-check-cross — ✓ atomique sans service ; ✕ / retour système restaurent le parent", () => {
    const parent = params();
    const snapshot = JSON.stringify(parent);
    const { onApply, onCancel } = renderSheet(parent);
    tap("execution-sheet-series-increment");
    fireEvent(screen.getByTestId("execution-sheet-modal"), "requestClose");
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(parent)).toBe(snapshot);
    validate();
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(applied(onApply).series).toMatchObject({ count: 4 });
  });

  it("ACCESSIBILITY/sheet-check-cross — mode absent ou cible incomplète : Valider annoncé indisponible ; valeur à renseigner annoncée sur le réglage (aucun message, D-2) ; Annuler reste actif", () => {
    const { onApply, onCancel } = renderSheet(params({ mode: null, series: { kind: "UNIFORM", count: 1, target: null, pauseSeconds: 0 } }));
    const validateButton = screen.getByTestId("execution-sheet-validate");
    expect(validateButton.props.accessibilityState).toMatchObject({ disabled: true });
    expect(validateButton.props.accessibilityLabel).toBe("Valider les paramètres, indisponible tant qu’une valeur requise manque");
    validate();
    expect(onApply).not.toHaveBeenCalled();
    // Durée choisie, cible encore vide : pastille signalée et annoncée ; décision D-2 (12/10) :
    // plus de message « Renseignez la durée d’une série. ».
    fireEvent.press(screen.getByTestId("execution-sheet-mode-value"));
    fireEvent.press(within(screen.getByTestId("execution-sheet-mode-control")).getByText("Durée"));
    expect(screen.queryByTestId("execution-sheet-message")).toBeNull();
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("execution-sheet-target-value").props.accessibilityHint).toBe("Valeur à renseigner");
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

/**
 * Correction revue 1 — régressions de surface (REV-01, REV-02, v13 §6).
 */
describe("ExecutionParametersSheet — correction revue 1", () => {
  it("REV-01 — Durée variable → uniforme → Répétitions → variable : aucune cible réservée réutilisée ; retour en Durée restaure 30/60 ; ✕ annule", () => {
    const { onApply, onCancel } = renderSheet(params({ series: variableRows([[30, 10], [60, 20]]) }));
    fireEvent(screen.getByTestId("execution-sheet-variable-switch"), "valueChange", false);
    fireEvent.press(screen.getByTestId("execution-sheet-mode-value"));
    fireEvent.press(within(screen.getByTestId("execution-sheet-mode-control")).getByText("Répétitions"));
    fireEvent(screen.getByTestId("execution-sheet-variable-switch"), "valueChange", true);
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("—");
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("—");
    expect(valueOf("execution-sheet-table-row-2-pause")).toBe("20 s");
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    validate();
    expect(onApply).not.toHaveBeenCalled();
    // D-4 : le sélecteur s’est refermé après « Répétitions » ; il est rouvert.
    fireEvent.press(screen.getByTestId("execution-sheet-mode-value"));
    fireEvent.press(within(screen.getByTestId("execution-sheet-mode-control")).getByText("Durée"));
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("30 s");
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("1 min");
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("REV-02 — tableau variable ramené à N=1 : total éditable ET appliqué (inversion), message d'ajustement sous la ligne, Annuler restitue ; ✓ uniforme", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 10], [60, 20]]) }));
    tap("execution-sheet-series-decrement");
    expect(text("execution-sheet-total")).toBe("40 s");
    fireEvent.press(screen.getByTestId("execution-sheet-total"));
    fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 1 } });
    fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 40 } });
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    // 100 s demandés sur 30 s + 10 s : N=2 → 80 s, N=3 → 120 s, égalité → N le plus grand.
    expect(valueOf("execution-sheet-series")).toBe("3 séries");
    expect(text("execution-sheet-total")).toBe("2 min");
    const json = JSON.stringify(screen.toJSON());
    expect(json.indexOf('"execution-sheet-row-total"')).toBeLessThan(json.indexOf('"execution-sheet-adjusted"'));
    expect(json.indexOf('"execution-sheet-adjusted"')).toBeLessThan(json.indexOf('"execution-sheet-row-countdown"'));
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    expect(valueOf("execution-sheet-series")).toBe("1 série");
    fireEvent.press(screen.getByTestId("execution-sheet-total"));
    fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 1 } });
    fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 20 } });
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(valueOf("execution-sheet-series")).toBe("2 séries");
    expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
    validate();
    expect(applied(onApply).series).toEqual({ kind: "UNIFORM", count: 2, target: 30, pauseSeconds: 10 });
  });

  it("REV-02 — à N=1 depuis un tableau, les réglages affichés modifient la première ligne effective (aucun contrôle sans effet) ; remontée de N restaure la réserve", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 10], [60, 20]]) }));
    moveAction(2, "moveUp");
    tap("execution-sheet-series-decrement");
    expect(text("execution-sheet-target-value")).toBe("1 min");
    expect(valueOf("execution-sheet-pause")).toBe("20 s");
    tap("execution-sheet-pause-increment");
    expect(text("execution-sheet-total")).toBe("1 min 21 s");
    tap("execution-sheet-series-increment");
    expect(valueOf("execution-sheet-table-row-1-pause")).toBe("21 s");
    expect(valueOf("execution-sheet-table-row-2-target")).toBe("30 s");
    validate();
    expect(applied(onApply).series).toEqual(variableRows([[60, 21], [30, 10]]));
  });

  it("v13 §6 — glisser : destination bornée au tableau ; un glisser trop court ne déplace rien", () => {
    expect(dragDestination(0, 20, 42, 3)).toBe(0);
    expect(dragDestination(0, 22, 42, 3)).toBe(1);
    expect(dragDestination(2, -500, 42, 3)).toBe(0);
    expect(dragDestination(0, 500, 42, 3)).toBe(2);
    renderSheet(params({ series: variableRows([[30, 10], [45, 20], [60, 30]]) }));
    dragHandle(3, -84);
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("1 min");
    expect(valueOf("execution-sheet-table-row-1-pause")).toBe("30 s");
    dragHandle(1, 10);
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("1 min");
  });

  it("DSF — groupe Séries variables rattachant l'interrupteur au tableau ; repli DSF ; steppers 137/128 ; Répétitions avec bip : total ≈ en lecture seule", () => {
    renderSheet(params({ mode: "REPETITIONS", series: variableRows([[12, 30], [10, 45]]), cadenceBeepIntervalSeconds: 2 }));
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-variable-group").props.style)).toMatchObject({
      borderWidth: 1.5,
      borderColor: "#5F60EE",
    });
    expect(screen.getByTestId("execution-sheet-table-toggle-frame")).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-series").props.style).width).toBe(137);
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-table-row-1-pause").props.style).width).toBe(128);
    expect(screen.getByText("Durée totale ≈")).toBeTruthy();
    // (12 + 10) × 2 s + 30 s + 45 s = 119 s.
    expect(text("execution-sheet-total")).toBe("1 min 59 s");
    expect(screen.queryByTestId("execution-sheet-total")).toBeNull();
  });
});

describe("ExecutionParametersSheet — recette 1", () => {
  /**
   * F-01 : sur iPhone, le renderer recycle l'événement du responder et remet
   * `nativeEvent` à null dès la fin du gestionnaire. Toute lecture différée
   * de la position (mise à jour d'état fonctionnelle) levait
   * « Cannot read properties of null (reading 'pageY') » pendant le rendu et
   * affichait l'écran « Impossible d'afficher KODJO ». Ce test reproduit ce
   * recyclage au lieu des objets d'événement durables de fireEvent.
   */
  it("F-01 — glisser avec événements recyclés : aucune erreur, la ligne suit le doigt puis cible et Pause se déplacent ensemble", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15]]) }));
    const handle = () => screen.getByTestId("execution-sheet-table-row-1-handle");
    const recycled = (pageY: number) => ({ nativeEvent: { pageY } as { pageY: number } | null });
    const dispatch = (name: "onResponderGrant" | "onResponderMove" | "onResponderRelease", pageY: number) =>
      act(() => {
        const event = recycled(pageY);
        handle().props[name](event);
        event.nativeEvent = null;
      });

    dispatch("onResponderGrant", 100);
    dispatch("onResponderMove", 150);
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-table-row-1").props.style).transform).toEqual([
      { translateY: 50 },
    ]);
    dispatch("onResponderMove", 184);
    dispatch("onResponderRelease", 184);

    expect(valueOf("execution-sheet-table-row-1-target")).toBe("45 s");
    expect(valueOf("execution-sheet-table-row-3-target")).toBe("30 s");
    expect(valueOf("execution-sheet-table-row-3-pause")).toBe("5 s");
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-table-row-1").props.style).transform).toBeUndefined();
    validate();
    expect(applied(onApply).series).toEqual(variableRows([[45, 10], [60, 15], [30, 5]]));
  });

  it("F-01 — glisser interrompu par le système : ligne remise en place, aucun déplacement", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15]]) }));
    const handle = screen.getByTestId("execution-sheet-table-row-1-handle");
    act(() => handle.props.onResponderGrant({ nativeEvent: { pageY: 100 } }));
    act(() => handle.props.onResponderMove({ nativeEvent: { pageY: 190 } }));
    act(() => handle.props.onResponderTerminate({ nativeEvent: null }));
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-table-row-1").props.style).transform).toBeUndefined();
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("30 s");
  });

  it("F-02 — séries variables modifiées puis Durée → Répétitions → Durée (et inverse) avant ✓ : dernières valeurs restaurées, ✓ conserve l'effectif", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15]]) }));
    const rows = () => [1, 2, 3].map((n) => valueOf(`execution-sheet-table-row-${n}-target`));
    const choose = (label: string) => {
      if (!screen.queryByTestId("execution-sheet-mode-control")) fireEvent.press(screen.getByTestId("execution-sheet-mode-value"));
      fireEvent.press(screen.getByText(label));
    };
    tap("execution-sheet-table-row-1-target-increment");
    tap("execution-sheet-table-row-3-target-decrement");
    const durations = rows();
    choose("Répétitions");
    expect(rows()).toEqual(["—", "—", "—"]);
    tap("execution-sheet-table-row-2-target-increment");
    const repetitions = rows();
    choose("Durée");
    expect(rows()).toEqual(durations);
    choose("Répétitions");
    expect(rows()).toEqual(repetitions);
    choose("Durée");
    validate();
    expect(applied(onApply).mode).toBe("DURATION");
  });
});

describe("ExecutionParametersSheet — recette 1 (A-05)", () => {
  it("A-05 — Séries variables actives : cadre du groupe seulement tableau déployé ; replié = variante « Cadre=Non », état variable et lignes conservés", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15]]) }));
    const group = () => StyleSheet.flatten(screen.getByTestId("execution-sheet-variable-group").props.style) ?? {};
    expect(group().borderWidth).toBe(1.5);
    expect(group().backgroundColor).toBe("#F3F3F6");
    fireEvent.press(screen.getByTestId("execution-sheet-table-toggle-frame"));
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    expect(group().borderWidth).toBeUndefined();
    expect(screen.getByTestId("execution-sheet-variable-switch").props.value).toBe(true);
    fireEvent.press(screen.getByTestId("execution-sheet-table-toggle-frame"));
    expect(group().borderWidth).toBe(1.5);
    validate();
    expect(applied(onApply).series).toEqual(variableRows([[30, 5], [45, 10], [60, 15]]));
  });
});

describe("ExecutionParametersSheet — recette 1 (T-61)", () => {
  it("T-61 — texte agrandi : en-tête à hauteur minimale (jamais fixe) et titre non limité à une ligne", () => {
    renderSheet(params());
    const header = StyleSheet.flatten(screen.getByTestId("execution-sheet-header").props.style);
    expect(header.height).toBeUndefined();
    expect(header.minHeight).toBe(56);
    expect(screen.getByText("Paramètres d’exécution").props.numberOfLines).toBeUndefined();
  });
});

describe("ExecutionParametersSheet — recette 1 (A-01, A-04)", () => {
  it("A-01 — variable replié, désactivé puis réactivé : tableau déployé (état figé 6665:24616), lignes du brouillon restaurées", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15]]) }));
    fireEvent.press(screen.getByTestId("execution-sheet-table-toggle-frame"));
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    fireEvent(screen.getByTestId("execution-sheet-variable-switch"), "valueChange", false);
    fireEvent(screen.getByTestId("execution-sheet-variable-switch"), "valueChange", true);
    expect(screen.getByTestId("execution-sheet-table")).toBeTruthy();
    expect(valueOf("execution-sheet-table-row-3-target")).toBe("1 min");
  });

  it("A-04 — voile en fondu sur place (Modal fade, sans translation) ; seule la feuille monte depuis le bas", () => {
    renderSheet(params());
    expect(screen.getByTestId("execution-sheet-modal").props.animationType).toBe("fade");
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-scrim").props.style).transform).toBeUndefined();
    const transform = StyleSheet.flatten(screen.getByTestId("execution-sheet").props.style).transform as { translateY: unknown }[];
    expect(transform).toHaveLength(1);
    expect(transform[0]).toHaveProperty("translateY");
  });
});

describe("ExecutionParametersSheet — décisions du propriétaire (12/10)", () => {
  const { AccessibilityInfo } = jest.requireActual<typeof import("react-native")>("react-native");
  // Valeur simulée pour un seul appel : le simulacre React Native reste intact pour la suite.
  const reduceMotionOnce = (enabled: boolean) =>
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValueOnce(enabled);

  it("D-4 — Mode, Côté, Ordre : la valeur choisie est appliquée tout de suite, reste visible, puis le sélecteur se replie progressivement (cadre 220 ms puis repli 200 ms)", async () => {
    jest.useFakeTimers();
    try {
      renderSheet(params());
      fireEvent.press(screen.getByTestId("execution-sheet-mode-value"));
      fireEvent(screen.getByTestId("execution-sheet-mode-selector"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 330, height: 58 } } });
      fireEvent.press(within(screen.getByTestId("execution-sheet-mode-control")).getByText("Répétitions"));
      // Valeur appliquée immédiatement ; le sélecteur reste affiché pendant la fermeture.
      expect(text("execution-sheet-mode-value")).toBe("Répétitions");
      expect(screen.getByTestId("execution-sheet-mode-control")).toBeTruthy();
      expect(screen.getByTestId("execution-sheet-mode-control-REPETITIONS").props.accessibilityState).toMatchObject({ selected: true });
      await act(async () => {
        jest.advanceTimersByTime(200);
      });
      expect(screen.getByTestId("execution-sheet-mode-control")).toBeTruthy();
      await act(async () => {
        jest.advanceTimersByTime(400);
      });
      expect(screen.queryByTestId("execution-sheet-mode-control")).toBeNull();

      // Côté puis Ordre : même règle.
      fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
      fireEvent.press(within(screen.getByTestId("execution-sheet-side-control")).getByText("Droite puis gauche"));
      await act(async () => {
        jest.advanceTimersByTime(600);
      });
      expect(screen.queryByTestId("execution-sheet-side-control")).toBeNull();
      fireEvent.press(screen.getByTestId("execution-sheet-order-value"));
      fireEvent.press(within(screen.getByTestId("execution-sheet-order-control")).getByText("Les deux côtés à chaque série"));
      await act(async () => {
        jest.advanceTimersByTime(600);
      });
      expect(screen.queryByTestId("execution-sheet-order-control")).toBeNull();
      expect(text("execution-sheet-order-value")).toBe("Les deux côtés à chaque série");
    } finally {
      jest.useRealTimers();
    }
  });

  it("D-4 / D-7 — « Réduire les animations » : sélecteur refermé sans animation, feuille en place sans montée", async () => {
    reduceMotionOnce(true);
    renderSheet(params());
    await act(async () => {
      await Promise.resolve();
    });
    // Un rendu relit la valeur animée courante (Animated ne rerend pas de lui-même).
    tap("execution-sheet-beep-increment");
    const transform = StyleSheet.flatten(screen.getByTestId("execution-sheet").props.style).transform as { translateY: number }[];
    expect(transform[0]!.translateY).toBe(0);
    fireEvent.press(screen.getByTestId("execution-sheet-mode-value"));
    fireEvent(screen.getByTestId("execution-sheet-mode-selector"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 330, height: 58 } } });
    fireEvent.press(within(screen.getByTestId("execution-sheet-mode-control")).getByText("Répétitions"));
    expect(screen.queryByTestId("execution-sheet-mode-control")).toBeNull();
    expect(text("execution-sheet-mode-value")).toBe("Répétitions");
  });

  it("D-5 — message d’ajustement : Annuler encadré (cadre clair) restaure ; toucher le reste du message le ferme sans annuler", () => {
    const { onApply } = renderSheet(params({ series: { kind: "UNIFORM", count: 1, target: 30, pauseSeconds: 10 } }));
    // Total demandé 1 min 40 s : N=3 retenu, message d’ajustement (même geste que P3-14/inverse-enumeration).
    const adjust = () => {
      fireEvent.press(screen.getByTestId("execution-sheet-total"));
      fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 1 } });
      fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 40 } });
      fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    };
    // Annuler encadré : restaure les valeurs précédant l’ajustement (1 série).
    adjust();
    expect(valueOf("execution-sheet-series")).toBe("3 séries");
    // Recette 2 (T-58, 12/10) remplace le cadre blanc de D-5 : capsule sans contour,
    // blanc transparent à 90 %, demi-cercles, marges droite/haut/bas égales.
    const capsule = StyleSheet.flatten(screen.getByTestId("execution-sheet-adjusted-undo").props.style);
    expect(capsule).toMatchObject({ borderRadius: 999, backgroundColor: "rgba(255, 255, 255, 0.1)", minHeight: 36 });
    expect(capsule.borderWidth).toBeUndefined();
    const message = StyleSheet.flatten(screen.getByTestId("execution-sheet-adjusted").props.style);
    expect(message.paddingRight).toBe(message.paddingVertical);
    expect(message.alignItems).toBe("stretch");
    expect(screen.getByTestId("execution-sheet-adjusted").props.accessible).toBe(false);
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted-undo"));
    expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
    expect(valueOf("execution-sheet-series")).toBe("1 série");
    // Toucher le reste du message : fermé, ajustement conservé (3 séries).
    adjust();
    fireEvent.press(screen.getByTestId("execution-sheet-adjusted"));
    expect(screen.queryByTestId("execution-sheet-adjusted")).toBeNull();
    expect(valueOf("execution-sheet-series")).toBe("3 séries");
    validate();
    expect(applied(onApply).series).toMatchObject({ count: 3 });
  });
});

describe("ExecutionParametersSheet — D-341 / X-1 (12/10)", () => {
  it("D-341 — Mode Regular 14/17 sans choix affiché tant que le mode est vide ; Côté Regular 13/16 sur deux lignes ; Ordre 14/17 + sous-titre 11/13 ; hauteurs minimales 42/42/60", () => {
    renderSheet(params({ mode: null, sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE" }));
    fireEvent.press(screen.getByTestId("execution-sheet-mode-value"));
    const mode = screen.getByTestId("execution-sheet-mode-control");
    fireEvent(mode, "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 330, height: 42 } } });
    expect(screen.queryByTestId("execution-sheet-mode-control-indicator")).toBeNull();
    expect(StyleSheet.flatten(mode.props.style)).toMatchObject({ minHeight: 42, borderColor: "#DBDEE3" });
    expect(StyleSheet.flatten(within(mode).getByText("Durée").props.style)).toMatchObject({ fontSize: 14, lineHeight: 17, fontWeight: "400" });

    fireEvent.press(screen.getByTestId("execution-sheet-side-value"));
    const side = screen.getByTestId("execution-sheet-side-control");
    expect(within(side).getByText("Droite puis\ngauche")).toBeTruthy();
    expect(StyleSheet.flatten(within(side).getByText("Sans\nchangement").props.style)).toMatchObject({ fontSize: 13, lineHeight: 16, fontWeight: "400", textAlign: "center" });
    expect(screen.getByTestId("execution-sheet-side-control-RIGHT_LEFT").props.accessibilityLabel).toBe("Droite puis gauche");

    fireEvent.press(screen.getByTestId("execution-sheet-order-value"));
    const order = screen.getByTestId("execution-sheet-order-control");
    expect(StyleSheet.flatten(order.props.style).minHeight).toBe(60);
    expect(StyleSheet.flatten(order.props.style).height).toBeUndefined();
    expect(within(order).getByText("(D1 → D2) → (G1 → G2)")).toBeTruthy();
    expect(StyleSheet.flatten(within(order).getByText("Un côté après l’autre").props.style)).toMatchObject({ fontSize: 14, lineHeight: 17, fontWeight: "400" });
    // Les titres des lignes ne changent pas (type.label, Medium 14).
    expect(StyleSheet.flatten(screen.getByText("Ordre des côtés").props.style)).toMatchObject({ fontSize: 14, fontWeight: "500" });
  });
});

describe("ExecutionParametersSheet — recette 2 (T-10 / F-02)", () => {
  /**
   * Cause démontrée : le répéteur du stepper était créé au premier appui et
   * gardait les bornes et la valeur de départ de ce mode. Après un appui en
   * Durée, la ligne vide en Répétitions démarrait à « 30 rép. » (durée
   * recyclée) ; désactiver puis réactiver les Séries variables recréait les
   * steppers et masquait le défaut.
   */
  it("F-02 — appui en Durée, puis en Répétitions sur la même ligne : départ à 1 rép. (jamais 30), bornes Répétitions ; retour Durée = dernières durées", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 5], [60, 5]]) }));
    const choose = (label: string) => {
      if (!screen.queryByTestId("execution-sheet-mode-control")) fireEvent.press(screen.getByTestId("execution-sheet-mode-value"));
      fireEvent.press(within(screen.getByTestId("execution-sheet-mode-control")).getByText(label));
    };
    tap("execution-sheet-table-row-1-target-increment");
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("31 s");
    choose("Répétitions");
    tap("execution-sheet-table-row-1-target-increment");
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("1 rép.");
    tap("execution-sheet-table-row-1-target-increment");
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("2 rép.");
    choose("Durée");
    expect([1, 2, 3].map((n) => valueOf(`execution-sheet-table-row-${n}-target`))).toEqual(["31 s", "45 s", "1 min"]);
    choose("Répétitions");
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("2 rép.");
  });
});

describe("ExecutionParametersSheet — recette 2 (T-15)", () => {
  it("T-15 — glisser la Série 1 entre les Séries 3 et 4 : corps de la feuille immobile pendant le geste, repère d’insertion au bon endroit, dépôt à la position visée", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15], [75, 20]]) }));
    const body = () => screen.getByTestId("execution-sheet-body");
    const handle = () => screen.getByTestId("execution-sheet-table-row-1-handle");
    expect(body().props.scrollEnabled).toBe(true);
    act(() => handle().props.onResponderGrant({ nativeEvent: { pageY: 100 } }));
    expect(body().props.scrollEnabled).toBe(false);
    expect(screen.queryAllByTestId(/insertion-guide/, { includeHiddenElements: true })).toHaveLength(0);
    // +2 lignes (84) : destination rang 3, repère avant l’actuelle Série 4 (un seul repère).
    act(() => handle().props.onResponderMove({ nativeEvent: { pageY: 184 } }));
    expect(screen.queryAllByTestId(/insertion-guide/, { includeHiddenElements: true })).toHaveLength(1);
    expect(screen.getByTestId("execution-sheet-table-insertion-guide-before-4", { includeHiddenElements: true })).toBeTruthy();
    act(() => handle().props.onResponderRelease({ nativeEvent: { pageY: 184 } }));
    expect(body().props.scrollEnabled).toBe(true);
    expect(screen.queryAllByTestId(/insertion-guide/, { includeHiddenElements: true })).toHaveLength(0);
    expect([1, 2, 3, 4].map((n) => valueOf(`execution-sheet-table-row-${n}-target`))).toEqual(["45 s", "1 min", "30 s", "1 min 15 s"]);
    expect(valueOf("execution-sheet-table-row-3-pause")).toBe("5 s");
  });

  it("T-15 — geste interrompu par le système : défilement rétabli, aucun repère, aucun déplacement", () => {
    renderSheet(params({ series: variableRows([[30, 5], [45, 10], [60, 15]]) }));
    const handle = screen.getByTestId("execution-sheet-table-row-1-handle");
    act(() => handle.props.onResponderGrant({ nativeEvent: { pageY: 100 } }));
    act(() => handle.props.onResponderMove({ nativeEvent: { pageY: 150 } }));
    act(() => handle.props.onResponderTerminate({ nativeEvent: null }));
    expect(screen.getByTestId("execution-sheet-body").props.scrollEnabled).toBe(true);
    expect(screen.queryAllByTestId(/insertion-guide/, { includeHiddenElements: true })).toHaveLength(0);
    expect(valueOf("execution-sheet-table-row-1-target")).toBe("30 s");
  });
});

describe("ExecutionParametersSheet — recette 3 (T-53 : interrupteur Séries variables)", () => {
  it("T-53 — l’interrupteur iOS est centré sur la ligne (le Switch RN impose alignSelf flex-start) : désactivé, activé déployé, activé replié", () => {
    renderSheet(params({ series: { kind: "UNIFORM", count: 2, target: 30, pauseSeconds: 10 } }));
    const check = () => {
      const row = StyleSheet.flatten(screen.getByTestId("execution-sheet-row-variable").props.style);
      expect(row).toMatchObject({ flexDirection: "row", alignItems: "center", minHeight: 42 });
      // Style réellement transmis au composant natif iOS (après composition par Switch.js).
      expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-variable-switch").props.style).alignSelf).toBe("center");
    };
    check();
    fireEvent(screen.getByTestId("execution-sheet-variable-switch"), "valueChange", true);
    expect(screen.getByTestId("execution-sheet-table")).toBeTruthy();
    check();
    fireEvent.press(screen.getByTestId("execution-sheet-table-toggle-frame"));
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    check();
  });
});
