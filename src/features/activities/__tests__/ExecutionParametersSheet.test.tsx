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
    fireEvent.press(screen.getByTestId("execution-sheet-mode-value"));
    for (const mode of ["Répétitions", "À l’échec", "Durée"]) {
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

  it("P3-16/fold-incomplete — Série 2 incomplète : ✓ grisé, message en ligne « Série 2 » même tableau replié, cellule signalée, données intactes, total —", () => {
    const { onApply } = renderSheet(params({ series: variableRows([[30, 10], [null, 20], [60, 30]]) }));
    expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("execution-sheet-message").props.children).toBe("Série 2 : renseignez la durée.");
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-table-row-2-target").props.style).borderColor).toBe("#D92D20");
    expect(StyleSheet.flatten(screen.getByTestId("execution-sheet-table-row-1-target").props.style).borderColor).toBeUndefined();
    expect(text("execution-sheet-total")).toBe("—");
    // Replier ne modifie ni les données ni la validation.
    fireEvent.press(screen.getByLabelText("Masquer le tableau des séries"));
    expect(screen.queryByTestId("execution-sheet-table")).toBeNull();
    expect(screen.getByTestId("execution-sheet-message").props.children).toBe("Série 2 : renseignez la durée.");
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

  it("ACCESSIBILITY/sheet-check-cross — mode absent ou cible incomplète : Valider annoncé indisponible ; message en ligne annoncé ; Annuler reste actif", () => {
    const { onApply, onCancel } = renderSheet(params({ mode: null, series: { kind: "UNIFORM", count: 1, target: null, pauseSeconds: 0 } }));
    const validateButton = screen.getByTestId("execution-sheet-validate");
    expect(validateButton.props.accessibilityState).toMatchObject({ disabled: true });
    expect(validateButton.props.accessibilityLabel).toBe("Valider les paramètres, indisponible tant qu’une valeur requise manque");
    validate();
    expect(onApply).not.toHaveBeenCalled();
    // Durée choisie, cible encore vide : message nommant la valeur à renseigner, pastille signalée.
    fireEvent.press(screen.getByTestId("execution-sheet-mode-value"));
    fireEvent.press(within(screen.getByTestId("execution-sheet-mode-control")).getByText("Durée"));
    expect(screen.getByTestId("execution-sheet-message").props.accessibilityLiveRegion).toBe("polite");
    expect(screen.getByTestId("execution-sheet-message").props.children).toBe("Renseignez la durée d’une série.");
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
