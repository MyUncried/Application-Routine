import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import { numberTarget, type ExecutionMode, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import type { CircuitRole, FormatSettings } from "@/domain/sessions/formats";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import type { FormatSheetContext, FormatSheetRow } from "@/features/activities/FormatSettingsFrame";
import { enterExecutionSheetValue } from "@/features/activities/testing/executionSheetActions";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * D-607 (D-572 point 6 et D-573 point 1 de la branche de documentation, Hermann, 25-26/11/2026 ; Formats § 9.9, § 9.10) — modale
 * « Paramètres d'exécution » d'un EMOM. Hermann : « 7. Dans la modale « Dans chaque intervalle », afficher l'intervalle partagé du
 * circuit ; le modifier pour un mouvement le modifie pour les autres. » ; « 21. EMOM : intervalle propre à chaque mouvement et à
 * chaque tour ; plus d'un tour : tableau par série (objectif en durée ou répétitions, intervalle, charge). » Jest ne prouve que
 * l'arbre JS : rendu et saisie réels sur iPhone.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const sheet = strings.executionParameters.sheet;
const hidden = { includeHiddenElements: true } as const;
const get = (testID: string) => screen.getByTestId(testID, hidden);
const query = (testID: string) => screen.queryByTestId(testID, hidden);
const valueOf = (testID: string) => String(get(`${testID}-value`).props.children);
const validate = () => fireEvent.press(get("execution-sheet-validate"));

function params(count: number, mode: ExecutionMode = "REPETITIONS", target = 10): ExecutionParametersInput {
  return {
    version: 5,
    mode,
    series: { kind: "UNIFORM", count, target: numberTarget(target), pauseSeconds: 0, loadKg: 0, workPhases: [] },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 0,
    endSeconds: 0,
    loadEnabled: false,
  };
}

const OWN: readonly FormatSheetRow[] = ["stopTarget", "interval", "durationReadOnly"];
const SHARED: readonly FormatSheetRow[] = ["stopTarget", "interval", "noRecovery"];

function renderSheet(parent: ExecutionParametersInput, rows: readonly FormatSheetRow[], settings: FormatSettings, extra: Partial<FormatSheetContext> = {}) {
  const onFormat = jest.fn<(settings: FormatSettings, role: CircuitRole | null, shared?: readonly number[] | null) => void>();
  render(
    <TestSafeAreaProvider>
      <ExecutionParametersSheet
        parent={parent}
        profileSideRecoverySecondsDefault={0}
        inheritedSeriesCount={extra.emom?.sharedIntervals !== undefined}
        format={{ key: "EMOM", rows, settings, onApply: onFormat, ...extra }}
        onApply={jest.fn()}
        onCancel={jest.fn()}
      />
    </TestSafeAreaProvider>,
  );
  return { onFormat };
}

describe("Point 21 — EMOM : intervalle propre à chaque mouvement et à chaque tour", () => {
  it("un tour : ligne Intervalle, pas de tableau ; la valeur saisie est l'intervalle de l'exercice", () => {
    const { onFormat } = renderSheet(params(1), OWN, { intervalSeconds: 60 });
    expect(query("execution-sheet-table")).toBeNull();
    expect(valueOf("execution-sheet-format-interval")).toBe(formatPhraseDuration(60));
    enterExecutionSheetValue("execution-sheet-format-interval", 90);
    validate();
    expect(onFormat).toHaveBeenCalledWith({ intervalSeconds: 90 }, null);
  });

  it("plus d'un tour, objectif en répétitions : tableau par série (Répétitions, Intervalle, Charge) ; intervalle de la série 2 seul modifié", () => {
    const { onFormat } = renderSheet(params(3), OWN, { intervalSeconds: 60 });
    const header = get("execution-sheet-table-header");
    expect(within(header).getByText(sheet.columns.REPETITIONS, hidden)).toBeTruthy();
    expect(within(header).getByText(sheet.columns.interval, hidden)).toBeTruthy();
    expect(within(header).getByText(sheet.columns.load, hidden)).toBeTruthy();
    expect(within(header).queryByText(sheet.columns.pause, hidden)).toBeNull();
    // La ligne Intervalle laisse place à la colonne du tableau.
    expect(query("execution-sheet-format-interval-row")).toBeNull();
    for (const row of [1, 2, 3]) {
      expect(valueOf(`execution-sheet-table-row-${row}-interval`)).toBe(formatPhraseDuration(60));
      expect(valueOf(`execution-sheet-table-row-${row}-target`)).toBe(`10 ${sheet.repetitionsUnit}`);
    }
    expect(get("execution-sheet-table-row-2-interval").props.accessibilityLabel).toBe("Série 2, intervalle");
    enterExecutionSheetValue("execution-sheet-table-row-2-interval", 90);
    expect(valueOf("execution-sheet-table-row-2-interval")).toBe(formatPhraseDuration(90));
    expect(valueOf("execution-sheet-table-row-1-interval")).toBe(formatPhraseDuration(60));
    validate();
    expect(onFormat).toHaveBeenCalledWith({ intervalSeconds: 60, intervalsSeconds: [60, 90, 60] }, null);
  });

  it("plus d'un tour, objectif en durée : colonne Durée ; intervalles enregistrés repris à la réouverture", () => {
    renderSheet(params(2, "DURATION", 20), OWN, { intervalSeconds: 60, intervalsSeconds: [60, 45] });
    const header = get("execution-sheet-table-header");
    expect(within(header).getByText(sheet.columns.DURATION, hidden)).toBeTruthy();
    expect(within(header).getByText(sheet.columns.interval, hidden)).toBeTruthy();
    expect(valueOf("execution-sheet-table-row-1-interval")).toBe(formatPhraseDuration(60));
    expect(valueOf("execution-sheet-table-row-2-interval")).toBe(formatPhraseDuration(45));
  });

  it("durée au-delà de l'intervalle de sa série : intervalle de cette série en rouge, ✓ indisponible", () => {
    // Contexte réel d'un EMOM hors Circuit porteur (`formatSheetContextOf`) : intervalle propre à l'exercice.
    const { onFormat } = renderSheet(params(2, "DURATION", 40), OWN, { intervalSeconds: 60, intervalsSeconds: [60, 30] }, { emom: { windowSeconds: null, othersWorkByRank: [] } });
    expect(screen.getByText(strings.executionParameters.format.emomSeriesOverflow, hidden)).toBeTruthy();
    validate();
    expect(onFormat).not.toHaveBeenCalled();
    enterExecutionSheetValue("execution-sheet-table-row-2-interval", 50);
    expect(screen.queryByText(strings.executionParameters.format.emomSeriesOverflow, hidden)).toBeNull();
    validate();
    expect(onFormat).toHaveBeenCalledWith({ intervalSeconds: 60, intervalsSeconds: [60, 50] }, null);
  });
});

describe("Point 7 — « Dans chaque intervalle » : intervalle partagé du circuit, affiché et modifiable", () => {
  it("un tour : ligne Intervalle à la valeur du circuit ; la valeur saisie est transmise au circuit (partagée), pas à l'exercice", () => {
    const { onFormat } = renderSheet(params(1), SHARED, {}, { emom: { windowSeconds: 60, othersWorkByRank: [0], sharedIntervals: [60] } });
    expect(valueOf("execution-sheet-format-interval")).toBe(formatPhraseDuration(60));
    enterExecutionSheetValue("execution-sheet-format-interval", 45);
    validate();
    expect(onFormat).toHaveBeenCalledWith({}, null, [45]);
  });

  it("plus d'un tour : intervalle de chaque tour dans le tableau ; le tour 3 modifié est transmis au circuit", () => {
    const { onFormat } = renderSheet(params(3), SHARED, {}, { emom: { windowSeconds: 60, othersWorkByRank: [0, 0, 0], sharedIntervals: [60, 45, 60] } });
    expect(query("execution-sheet-format-interval-row")).toBeNull();
    expect(valueOf("execution-sheet-table-row-2-interval")).toBe(formatPhraseDuration(45));
    enterExecutionSheetValue("execution-sheet-table-row-3-interval", 40);
    validate();
    expect(onFormat).toHaveBeenCalledWith({}, null, [60, 45, 40]);
  });

  it("aucun changement : l'intervalle partagé est transmis tel quel (aucune valeur inventée)", () => {
    const { onFormat } = renderSheet(params(2), SHARED, {}, { emom: { windowSeconds: 60, othersWorkByRank: [0, 0], sharedIntervals: [60, 60] } });
    validate();
    expect(onFormat).toHaveBeenCalledWith({}, null, [60, 60]);
  });
});
