import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { AccessibilityInfo, Dimensions, Platform, StyleSheet } from "react-native";

import { failureTarget, numberTarget, unsetTarget } from "@/domain/activities/ExecutionParameters";
import type { CircuitVolumes } from "@/domain/sessions/circuit";
import {
  CircuitVolumesSheet,
  VOLUMES_ALTERNATE_COLUMN_BACKGROUND,
  VOLUMES_SERIES_COLUMN_WIDTH,
  shouldDismissSheetDrag,
} from "@/features/sessions/CircuitVolumesSheet";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

const anyNode = { includeHiddenElements: true } as const;

const TWO_ROWS: CircuitVolumes = {
  seriesColumnCount: 4,
  rows: [
    {
      occurrenceId: "A",
      name: "Squat assisté",
      mode: "REPETITIONS",
      sideMode: "UNILATERAL",
      cells: [numberTarget(10), failureTarget(), null, null],
    },
    {
      occurrenceId: "B",
      name: "Fentes",
      mode: "DURATION",
      sideMode: "RIGHT_LEFT",
      cells: [numberTarget(45), numberTarget(60), numberTarget(90), unsetTarget()],
    },
  ],
};

function renderSheet(volumes: CircuitVolumes = TWO_ROWS) {
  const onClose = jest.fn();
  const element = () => (
    <TestSafeAreaProvider>
      <CircuitVolumesSheet volumes={volumes} onClose={onClose} testID="sheet" />
    </TestSafeAreaProvider>
  );
  const view = render(element());
  // Un rendu relit la valeur animée courante (Animated ne rerend pas de lui-même).
  return { onClose, rerender: () => view.rerender(element()) };
}

const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID, anyNode).props.style);
const text = (testID: string) => screen.getByTestId(testID, anyNode).props.children;

describe("CircuitVolumesSheet (PRE-6 story 3.4, CE-CIR-03)", () => {
  it("bottom sheet: scrim, handle 50 × 4 at 8, header 60 with X on the left and the centered Semi Bold 18 title, rule 1, bottom safe area", () => {
    renderSheet();
    expect(style("sheet-scrim")).toBeDefined();
    expect(style("sheet-handle")).toMatchObject({ width: 50, height: 4, top: 8 });
    expect(style("sheet-header")).toMatchObject({ minHeight: 60, borderBottomWidth: 1, borderBottomColor: colors.divider });
    expect(text("sheet-title")).toBe("Volumes du circuit");
    expect(style("sheet-title")).toMatchObject({ fontSize: 18, fontWeight: "600", textAlign: "center" });
    expect(screen.getByTestId("sheet-title").props.accessibilityRole).toBe("header");
    const header = screen.getByTestId("sheet-header");
    expect(header.props.children[1].props.testID).toBe("sheet-close");
    expect(screen.getByTestId("sheet-close").props.accessibilityLabel).toBe("Fermer les volumes du circuit");
    // Hauteur selon le contenu, bornée par l'écran ; zone sûre du bas.
    expect(style("sheet-surface")).toMatchObject({ maxHeight: Dimensions.get("window").height - 47 - 24, paddingBottom: 34 });
    expect(style("sheet-body").flexGrow).toBe(0);
    expect(screen.getByTestId("sheet-sheet").props.accessibilityViewIsModal).toBe(true);
  });

  it("closes by X, by the scrim, by the system back and by escaping, without anything else", () => {
    const { onClose } = renderSheet();
    fireEvent.press(screen.getByTestId("sheet-close"));
    fireEvent.press(screen.getByTestId("sheet-scrim", anyNode));
    fireEvent(screen.getByTestId("sheet-modal", anyNode), "requestClose");
    fireEvent(screen.getByTestId("sheet-sheet"), "accessibilityEscape");
    expect(onClose).toHaveBeenCalledTimes(4);
  });

  it("drag down on the handle: the handle zone carries the gesture; past 80 (or a fast swipe) it closes, otherwise it comes back", () => {
    renderSheet();
    const zone = screen.getByTestId("sheet-drag-zone");
    expect(typeof zone.props.onMoveShouldSetResponder).toBe("function");
    expect(within(zone).getByTestId("sheet-handle", anyNode)).toBeTruthy();
    expect(shouldDismissSheetDrag(81, 0)).toBe(true);
    expect(shouldDismissSheetDrag(10, 0.8)).toBe(true);
    expect(shouldDismissSheetDrag(40, 0.1)).toBe(false);
    expect(shouldDismissSheetDrag(-200, -2)).toBe(false);
  });

  /** Geste synthétique sur la zone de la poignée : appui, déplacement lent de `dy` en 1 s, relâche. */
  function dragHandle(dy: number) {
    const zone = screen.getByTestId("sheet-drag-zone");
    const touchEvent = (y: number, time: number) => ({
      nativeEvent: { touches: [], changedTouches: [], pageX: 0, pageY: y, timestamp: time },
      touchHistory: {
        numberActiveTouches: 1,
        indexOfSingleActiveTouch: 0,
        mostRecentTimeStamp: time,
        touchBank: [
          {
            touchActive: true,
            startPageX: 0,
            startPageY: 0,
            startTimeStamp: 0,
            currentPageX: 0,
            currentPageY: y,
            currentTimeStamp: time,
            previousPageX: 0,
            previousPageY: 0,
            previousTimeStamp: 0,
          },
        ],
      },
    });
    // Appel direct des gestionnaires du répondeur : `fireEvent` interroge `onMoveShouldSetResponder`
    // sans événement, ce que le `PanResponder` ne prend pas en charge.
    const handlers = zone.props as Record<string, (event: unknown) => void>;
    act(() => {
      handlers.onResponderGrant!(touchEvent(0, 0));
      handlers.onResponderMove!(touchEvent(dy, 1000));
      handlers.onResponderRelease!(touchEvent(dy, 1000));
    });
  }

  it("synthetic drag of the handle: past 80 closes, below it does not", () => {
    const { onClose } = renderSheet();
    dragHandle(40);
    expect(onClose).not.toHaveBeenCalled();
    dragHandle(120);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("D-7 — reduce motion: no fade (animationType none) and the sheet is in place immediately (translateY 0)", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValueOnce(true);
    const { onClose, rerender } = renderSheet();
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId("sheet-modal", anyNode).props.animationType).toBe("none");
    // Un glisser court revient en place sans animation.
    dragHandle(40);
    expect(onClose).not.toHaveBeenCalled();
    rerender();
    const transform = style("sheet-sheet").transform as { translateY: number }[];
    expect(transform[0]!.translateY).toBe(0);
  });

  it("without reduce motion: fade and entry from below", () => {
    renderSheet();
    expect(screen.getByTestId("sheet-modal", anyNode).props.animationType).toBe("fade");
    const transform = style("sheet-sheet").transform as { translateY: number }[];
    expect(transform[0]!.translateY).toBeGreaterThan(0);
  });

  it("dismissal: iOS reports it through the Modal onDismiss, Android as soon as it is hidden", () => {
    const before = Platform.OS;
    const onDismissed = jest.fn();
    const element = (visible: boolean) => (
      <TestSafeAreaProvider>
        <CircuitVolumesSheet volumes={TWO_ROWS} onClose={jest.fn()} visible={visible} onDismissed={onDismissed} testID="sheet" />
      </TestSafeAreaProvider>
    );
    try {
      Platform.OS = "ios";
      const ios = render(element(true));
      expect(screen.getByTestId("sheet-modal", anyNode).props.onDismiss).toBe(onDismissed);
      ios.rerender(element(false));
      expect(onDismissed).not.toHaveBeenCalled();
      ios.unmount();

      Platform.OS = "android";
      const android = render(element(true));
      expect(screen.getByTestId("sheet-modal", anyNode).props.onDismiss).toBeUndefined();
      android.rerender(element(false));
      expect(onDismissed).toHaveBeenCalledTimes(1);
      android.unmount();
    } finally {
      Platform.OS = before;
    }
  });

  it("a row with fewer cells than Smax shows « — » (missing series) in the absent columns", () => {
    renderSheet({
      seriesColumnCount: 3,
      rows: [{ occurrenceId: "A", name: "Pompes", mode: "REPETITIONS", sideMode: "UNILATERAL", cells: [numberTarget(10)] }],
    });
    expect(["sheet-cell-A-1", "sheet-cell-A-2", "sheet-cell-A-3"].map(text)).toEqual(["10", "—", "—"]);
    expect(screen.getByLabelText("Pompes, série 1 : 10 répétitions, série 2 : pas de série, série 3 : pas de série")).toBeTruthy();
  });

  it("grid: Exercice (fixed) | S1…Smax (horizontal scroll) | Unité (fixed); headers Medium 12 #595E66", () => {
    renderSheet();
    const exercise = screen.getByTestId("sheet-exercise-column", anyNode);
    const scroll = screen.getByTestId("sheet-series-scroll", anyNode);
    const unit = screen.getByTestId("sheet-unit-column", anyNode);
    expect(within(exercise).getByText("Exercice", anyNode)).toBeTruthy();
    expect(within(unit).getByText("Unité", anyNode)).toBeTruthy();
    expect(within(scroll).queryByText("Exercice", anyNode)).toBeNull();
    expect(within(scroll).queryByText("Unité", anyNode)).toBeNull();
    for (const label of ["S1", "S2", "S3", "S4"]) {
      expect(within(scroll).getByText(label, anyNode)).toBeTruthy();
    }
    expect(scroll.props.horizontal).toBe(true);
    expect(StyleSheet.flatten(within(scroll).getByText("S1", anyNode).props.style)).toMatchObject({
      fontSize: 12,
      fontWeight: "500",
      color: colors.textSecondary,
    });
    expect(StyleSheet.flatten(exercise.props.style)).toMatchObject({ flexShrink: 0 });
    expect(StyleSheet.flatten(unit.props.style)).toMatchObject({ flexShrink: 0 });
  });

  it("values: Semi Bold 13 centered; « — » for a missing series (never 0) or an unset target; « ✓ » to failure; m:ss durations; units", () => {
    renderSheet();
    expect(["sheet-cell-A-1", "sheet-cell-A-2", "sheet-cell-A-3", "sheet-cell-A-4"].map(text)).toEqual(["10", "✓", "—", "—"]);
    expect(["sheet-cell-B-1", "sheet-cell-B-2", "sheet-cell-B-3", "sheet-cell-B-4"].map(text)).toEqual(["0:45", "1:00", "1:30", "—"]);
    expect(style("sheet-cell-A-1")).toMatchObject({ fontSize: 13, fontWeight: "600", textAlign: "center" });
    expect(text("sheet-unit-A")).toBe("rép.");
    expect(text("sheet-unit-B")).toBe("durée");
    expect(style("sheet-unit-A")).toMatchObject({ fontSize: 12, fontWeight: "500" });
    expect(screen.queryByText("0", anyNode)).toBeNull();
  });

  it("names: Medium 13, one line with ellipsis, in order; bilateral → side change icon near the name, without direction", () => {
    renderSheet();
    expect(text("sheet-name-A-text")).toBe("Squat assisté");
    expect(style("sheet-name-A-text")).toMatchObject({ fontSize: 13, fontWeight: "500" });
    expect(screen.getByTestId("sheet-name-A-text", anyNode).props.numberOfLines).toBe(1);
    expect(screen.queryByTestId("sheet-side-change-A", anyNode)).toBeNull();
    expect(within(screen.getByTestId("sheet-name-B", anyNode)).getByTestId("sheet-side-change-B", anyNode)).toBeTruthy();
  });

  it("odd S columns on the light alternate background (named constant), even ones without", () => {
    renderSheet();
    expect(VOLUMES_ALTERNATE_COLUMN_BACKGROUND).toBe("#F9FBFB");
    expect(style("sheet-column-1-body").backgroundColor).toBe(VOLUMES_ALTERNATE_COLUMN_BACKGROUND);
    expect(style("sheet-column-2-body")?.backgroundColor).toBeUndefined();
    expect(style("sheet-column-3-body").backgroundColor).toBe(VOLUMES_ALTERNATE_COLUMN_BACKGROUND);
    expect(style("sheet-column-4-body")?.backgroundColor).toBeUndefined();
  });

  it("12 series: 12 columns in the horizontal scroll (Exercice and Unité stay outside)", () => {
    renderSheet({
      seriesColumnCount: 12,
      rows: [
        {
          occurrenceId: "A",
          name: "Pompes",
          mode: "REPETITIONS",
          sideMode: "UNILATERAL",
          cells: Array.from({ length: 12 }, () => numberTarget(10)),
        },
      ],
    });
    const scroll = screen.getByTestId("sheet-series-scroll", anyNode);
    expect(within(scroll).getByText("S12", anyNode)).toBeTruthy();
    expect(StyleSheet.flatten(scroll.props.style)).toMatchObject({ width: 12 * VOLUMES_SERIES_COLUMN_WIDTH, flexShrink: 1 });
  });

  it("read-only and accessible: one element per row, the visual grid hidden, no interactive cell", () => {
    renderSheet();
    expect(screen.getByLabelText(
      "Squat assisté, série 1 : 10 répétitions, série 2 : à l’échec, série 3 : pas de série, série 4 : pas de série",
    )).toBeTruthy();
    expect(screen.getByLabelText(
      "Fentes, changement de côté, série 1 : 45 s, série 2 : 1 min, série 3 : 1 min 30 s, série 4 : à renseigner",
    )).toBeTruthy();
    // La grille visuelle n'est pas lue par VoiceOver.
    expect(screen.queryByText("Squat assisté")).toBeNull();
    const grid = screen.getByTestId("sheet-grid");
    expect(within(grid).queryAllByRole("button")).toHaveLength(0);
    expect(style("sheet-row-A")).toMatchObject({ top: 42, height: 36 });
    expect(style("sheet-row-B")).toMatchObject({ top: 78, height: 36 });
  });

  it("empty Circuit: empty state, no fictitious value", () => {
    renderSheet({ seriesColumnCount: 0, rows: [] });
    expect(text("sheet-empty")).toBe("Aucun exercice dans le circuit");
    expect(screen.queryByTestId("sheet-grid", anyNode)).toBeNull();
    expect(screen.queryByText("—", anyNode)).toBeNull();
  });
});
