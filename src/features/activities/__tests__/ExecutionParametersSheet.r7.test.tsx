import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ScrollView, StyleSheet } from "react-native";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import {
  numberTarget,
  type ExecutionParameters,
  type ExecutionParametersInput,
  type WorkPhase,
} from "@/domain/activities/ExecutionParameters";
import { computeIntrinsicDuration } from "@/domain/activities/executionCalculations";
import { transferParametersByRank } from "@/domain/activities/Movement";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import { typeInExecutionSheetCell } from "@/features/activities/testing/executionSheetActions";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-7 story R-7 (D-448, recette JA2 du 26/10/2026) — Feuille des paramètres : total en Durée
 * malgré une phase vide (PH-5), 0 s accepté et refusé (point 6), libellé, largeur et défilement
 * au dépliage (point 8), durée de rang surnuméraire vide (NV-3). Jest ne prouve ni le rendu ni le
 * défilement réels (recette iPhone de Hermann).
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const t = strings.executionParameters.sheet;
const hidden = { includeHiddenElements: true } as const;
const get = (testID: string) => screen.getByTestId(testID, hidden);
const styleOf = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};
const duration = (n: number) => `execution-sheet-phase-row-${n}-duration`;
const shownDuration = (n: number) => String(get(`${duration(n)}-value`).props.children);
const totalText = () => String(get("execution-sheet-total-text").props.children);
const validateDisabled = () => get("execution-sheet-validate").props.accessibilityState?.disabled === true;

function params(workPhases: readonly WorkPhase[] = []): ExecutionParametersInput {
  return {
    version: 5,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 60, loadKg: 0, workPhases: [...workPhases] },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    loadEnabled: false,
  };
}

const phases = (...durations: number[]): WorkPhase[] =>
  durations.map((durationSeconds, index) => ({ id: index + 1, label: `P${index + 1}`, durationSeconds }));

function renderSheet(parent: ExecutionParametersInput) {
  const onApply = jest.fn<(value: ExecutionParameters) => void>();
  render(
    <TestSafeAreaProvider>
      <ExecutionParametersSheet parent={parent} profileSideRecoverySecondsDefault={10} onApply={onApply} onCancel={jest.fn()} />
    </TestSafeAreaProvider>,
  );
  return { onApply };
}

function enterDuration(n: number, keys: string) {
  fireEvent(get(`${duration(n)}-input`), "focus");
  typeInExecutionSheetCell(duration(n), keys);
  fireEvent(get(`${duration(n)}-input`), "blur");
}

describe("R-7 — Feuille des paramètres", () => {
  it("PH-5 — Durée, phase vide (3 × 30 s, pause 60 s, phases 3 s / —) : total affiché, cellule rouge, ✓ indisponible", () => {
    const { onApply } = renderSheet(params(phases(3, 0)));
    const expected = computeIntrinsicDuration(params()).seconds!;
    expect(totalText()).toBe(formatPhraseDuration(expected));
    expect(shownDuration(2)).toBe(t.unset);
    expect(styleOf(duration(2)).backgroundColor).toBe(colors.dangerSurface);
    expect(validateDisabled()).toBe(true);
    fireEvent.press(get("execution-sheet-validate"));
    expect(onApply).not.toHaveBeenCalled();
  });

  it("PH-5 — Répétitions, phase vide : pas d'estimation (« — »)", () => {
    renderSheet({
      ...params(phases(3, 0)),
      mode: "REPETITIONS",
      series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 60, loadKg: 0, workPhases: phases(3, 0) },
    });
    expect(totalText()).toBe(t.unset);
  });

  it("point 6 — « 0000 » dans une durée de phase : 0 s affichée, cellule rouge, ✓ indisponible ; le total reste affiché", () => {
    const { onApply } = renderSheet(params(phases(3, 2)));
    expect(validateDisabled()).toBe(false);
    enterDuration(1, "0000");
    expect(shownDuration(1)).toBe(formatPhraseDuration(0));
    expect(styleOf(duration(1)).backgroundColor).toBe(colors.dangerSurface);
    expect(validateDisabled()).toBe(true);
    fireEvent.press(get("execution-sheet-validate"));
    expect(onApply).not.toHaveBeenCalled();
    expect(totalText()).toBe(formatPhraseDuration(computeIntrinsicDuration(params()).seconds!));
  });

  it("point 8 — libellé « Phases du mouvement » ; option « n phases » de 110, chevron à 12 du nombre", () => {
    renderSheet(params(phases(3, 2)));
    expect(t.workPhases).toBe("Phases du mouvement");
    expect(screen.getAllByText("Phases du mouvement", hidden).length).toBeGreaterThan(0);
    expect(styleOf("execution-sheet-phases-control-tile-WITH").width).toBe(110);
    expect(styleOf("execution-sheet-phases-control-WITH-chevron")).toMatchObject({ marginLeft: 12 });
  });

  it("point 8 — dépliage de « Durée de l'exercice » : Compte à rebours et Fin rendus, défilement jusqu'à eux à la mise en page de Fin ; repli sans défilement", () => {
    const scrollToEnd = jest.spyOn(ScrollView.prototype, "scrollToEnd");
    try {
      renderSheet(params(phases(3, 0)));
      scrollToEnd.mockClear();
      fireEvent.press(get("execution-sheet-duration-disclosure-frame"));
      expect(get("execution-sheet-row-countdown")).toBeTruthy();
      expect(totalText()).toBe(formatPhraseDuration(computeIntrinsicDuration(params()).seconds!));
      fireEvent(get("execution-sheet-row-end"), "layout", { nativeEvent: { layout: { x: 0, y: 300, width: 300, height: 44 } } });
      expect(scrollToEnd).toHaveBeenCalledTimes(1);
      // Une nouvelle mise en page sans dépliage ne défile plus.
      fireEvent(get("execution-sheet-row-end"), "layout", { nativeEvent: { layout: { x: 0, y: 320, width: 300, height: 44 } } });
      expect(scrollToEnd).toHaveBeenCalledTimes(1);
      fireEvent.press(get("execution-sheet-duration-disclosure-frame"));
      expect(screen.queryByTestId("execution-sheet-row-end", hidden)).toBeNull();
    } finally {
      scrollToEnd.mockRestore();
    }
  });

  it("NV-3 — après un changement de niveau (2 → 3 phases) : rangs communs conservés, durée du rang surnuméraire vide (« — »)", () => {
    const transferred = transferParametersByRank(params(phases(5, 2)), [
      { id: 10, label: "Montée" },
      { id: 11, label: "Tenue" },
      { id: 12, label: "Descente" },
    ]);
    renderSheet(transferred);
    expect([shownDuration(1), shownDuration(2), shownDuration(3)]).toEqual(["5 s", "2 s", t.unset]);
    expect(styleOf(duration(3)).backgroundColor).toBe(colors.dangerSurface);
  });
});
