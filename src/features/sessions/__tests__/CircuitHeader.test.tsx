import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Button as SwiftUIButton, Menu, RNHostView } from "@expo/ui/swift-ui";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { AccessibilityInfo, Platform, StyleSheet } from "react-native";

import type { CircuitNature } from "@/domain/sessions/circuit";
import {
  CIRCUIT_HEADER_COLLAPSED_HEIGHT,
  CIRCUIT_HEADER_HEIGHT,
  CIRCUIT_HEADER_TOUCH_GEOMETRY,
  CircuitHeader,
  circuitCountSpokenValue,
  circuitNatureAdjective,
  circuitUnitLabel,
} from "@/features/sessions/CircuitHeader";
import { CircuitNaturePanel } from "@/features/sessions/CircuitNatureMenu";
import { colors, type } from "@/shared/ui/tokens";

type HeaderOverrides = Partial<{
  nature: CircuitNature;
  count: number;
  duration: string;
  isCounterOpen: boolean;
  isNatureMenuOpen: boolean;
  natureFocusRequest: number;
  isCollapsed: boolean;
  memberNames: readonly string[];
  isAttenuated: boolean;
  isChoicePending: boolean;
}>;

function renderHeader(overrides: HeaderOverrides = {}) {
  const onChangeCount = jest.fn<(count: number) => void>();
  const onToggleCounter = jest.fn();
  const onOpenNatureMenu = jest.fn();
  const onCloseNatureMenu = jest.fn();
  const onSelectNature = jest.fn<(nature: CircuitNature) => void>();
  const onToggleCollapsed = jest.fn();
  const counterRef: { current: unknown } = { current: null };
  const element = (next: HeaderOverrides) => (
    <CircuitHeader
      nature={next.nature ?? "TOURS"}
      count={next.count ?? 1}
      duration={next.duration ?? "≈ 4 min"}
      isCounterOpen={next.isCounterOpen ?? false}
      onToggleCounter={onToggleCounter}
      onChangeCount={onChangeCount}
      isNatureMenuOpen={next.isNatureMenuOpen ?? false}
      natureFocusRequest={next.natureFocusRequest ?? 0}
      onOpenNatureMenu={onOpenNatureMenu}
      onCloseNatureMenu={onCloseNatureMenu}
      onSelectNature={onSelectNature}
      isCollapsed={next.isCollapsed ?? false}
      onToggleCollapsed={onToggleCollapsed}
      memberNames={next.memberNames ?? []}
      counterRef={counterRef as { current: null }}
      isAttenuated={next.isAttenuated}
      isChoicePending={next.isChoicePending}
      testID="header"
    />
  );
  const view = render(element(overrides));
  return {
    onChangeCount,
    onToggleCounter,
    onOpenNatureMenu,
    onCloseNatureMenu,
    onSelectNature,
    onToggleCollapsed,
    counterRef,
    rerender: (next: HeaderOverrides) => view.rerender(element({ ...overrides, ...next })),
  };
}

const anyNode = { includeHiddenElements: true } as const;
const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID, anyNode).props.style);

function withPlatform(os: typeof Platform.OS, run: () => void) {
  const before = Platform.OS;
  Platform.OS = os;
  try {
    run();
  } finally {
    Platform.OS = before;
  }
}

function accessibilityAction(testID: string, actionName: string) {
  fireEvent(screen.getByTestId(testID), "accessibilityAction", { nativeEvent: { actionName } });
}

function tap(testID: string) {
  const button = screen.getByTestId(testID);
  fireEvent(button, "pressIn");
  fireEvent(button, "pressOut");
}

const MINUS = "header-counter-stepper-decrement";
const PLUS = "header-counter-stepper-increment";

describe("CircuitHeader (PRE-6 story 3.1 ; PRE-9 B.1a)", () => {
  // D-451, complément du 28/10 (remplace D-442 / D-443) : l'unité reste « tour(s) » pour les deux
  // natures ; la nature est l'adjectif « groupées » / « alternées ».
  it("unit is always « tour(s) », accorded with N; nature adjective « groupées » / « alternées »", () => {
    expect(circuitUnitLabel(1)).toBe("tour");
    expect(circuitUnitLabel(2)).toBe("tours");
    expect(circuitCountSpokenValue(4)).toBe("4 tours");
    expect(circuitNatureAdjective("TOURS")).toBe("groupées");
    expect(circuitNatureAdjective("SERIES")).toBe("alternées");
  });

  it("one line: « Circuit », chevron, « N tours · adjective », duration right-aligned", () => {
    renderHeader({ count: 3, nature: "SERIES", duration: "≥ 19 min" });
    expect(screen.getByTestId("header-title").props.children).toBe("Circuit");
    expect(screen.getByTestId("header-counter-value").props.children).toBe(3);
    expect(screen.getByTestId("header-counter-unit", anyNode).props.children).toBe("tours · ");
    expect(screen.getByTestId("header-counter-adjective", anyNode).props.children).toBe("alternées");
    expect(screen.getByTestId("header-duration", anyNode).props.children).toBe("≥ 19 min");
    const row = screen.getByTestId("header-row");
    const children = ([] as unknown[])
      .concat(row.props.children)
      .filter((child): child is { props: { testID: string } } => child !== null && typeof child === "object");
    expect(children.map((child) => child.props.testID)).toEqual(["header-collapse", "header-counter-slot", "header-duration"]);
    expect(style("header-duration")).toMatchObject({ textAlign: "right", flex: 1, minWidth: 0, color: "#7A7A80" });
    expect(screen.getByTestId("header-duration", anyNode).props.numberOfLines).toBe(1);
    // VoiceOver : la durée est lue avec le nom.
    expect(screen.getByTestId("header-collapse").props.accessibilityLabel).toBe("Circuit, ≥ 19 min");
    // Aucune lettre pour un Circuit unique.
    expect(screen.queryByText(/Circuit [A-Z]$/)).toBeNull();
  });

  it("text sizes and colours (reference §4): name and number 15, unit and adjective 13, duration 12; number and nature in blue", () => {
    renderHeader({ count: 3 });
    expect(style("header-title")).toMatchObject({ fontSize: 15, color: colors.textPrimary });
    expect(style("header-counter-value")).toMatchObject({ fontSize: 15, color: colors.primary });
    expect(style("header-counter-unit")).toMatchObject({ fontSize: 13, color: colors.textPrimary });
    expect(style("header-counter-adjective")).toMatchObject({ fontSize: 13, color: colors.primary });
    expect(style("header-duration")).toMatchObject({ fontSize: type.supporting.fontSize });
    expect(type.supporting.fontSize).toBe(12);
  });

  describe("nature choice on the adjective (PRE-6 story 3.2 ; RM-027)", () => {
    it("iOS: the adjective is the trigger of a native SwiftUI Menu (two options, current checked, subtitle in the accessible name)", () =>
      withPlatform("ios", () => {
        const { onSelectNature, onChangeCount, onToggleCounter } = renderHeader({ nature: "TOURS", count: 3 });
        const host = screen.getByTestId("header-counter-nature", anyNode);
        const menu = within(host).UNSAFE_getByType(Menu);
        expect(within(host).UNSAFE_getAllByType(RNHostView)).toHaveLength(1);
        // L'adjectif est rendu dans le déclencheur (avec sa cible de 44) ; l'unité ne l'est pas.
        expect(within(host).getByTestId("header-counter-adjective", anyNode).props.children).toBe("groupées");
        expect(within(host).getByTestId("header-counter-adjective-target", anyNode)).toBeTruthy();
        expect(within(host).queryByTestId("header-counter-unit", anyNode)).toBeNull();
        const modifiers = JSON.stringify(menu.props.modifiers);
        expect(modifiers).toContain("Nature du circuit");
        expect(modifiers).toContain("Séries groupées");
        const items = within(menu).UNSAFE_getAllByType(SwiftUIButton);
        expect(items.map((item) => [item.props.label, item.props.systemImage ?? null])).toEqual([
          ["Séries groupées", "checkmark"],
          ["Séries alternées", null],
        ]);
        expect(items.map((item) => JSON.stringify(item.props.modifiers))).toEqual([
          expect.stringContaining("Séries groupées, toutes les séries d’un exercice exécutées à chaque tour"),
          expect.stringContaining("Séries alternées, une série de chaque exercice exécutée à chaque tour"),
        ]);
        act(() => {
          fireEvent(screen.getByTestId("header-counter-nature-SERIES", anyNode), "buttonPress");
        });
        expect(onSelectNature).toHaveBeenCalledWith("SERIES");
        expect(onChangeCount).not.toHaveBeenCalled();
        expect(onToggleCounter).not.toHaveBeenCalled();
        // Le nombre reste un réglage distinct.
        expect(screen.getByTestId("header-counter").props.accessibilityLabel).toBe("Nombre de tours");
      }));

    it("Android: the adjective is a distinct button « Nature du circuit » (44 target) opening the choice", () =>
      withPlatform("android", () => {
        const { onOpenNatureMenu, onCloseNatureMenu, onChangeCount, onToggleCounter, rerender } = renderHeader({
          nature: "SERIES",
          count: 2,
        });
        const trigger = screen.getByTestId("header-counter-nature");
        expect(trigger.props.accessibilityRole).toBe("button");
        expect(trigger.props.accessibilityLabel).toBe("Nature du circuit");
        expect(trigger.props.accessibilityValue).toEqual({ text: "Séries alternées" });
        expect(StyleSheet.flatten(trigger.props.style)).toMatchObject({ minWidth: 44, minHeight: 44 });
        expect(screen.getByTestId("header-counter").props.accessibilityLabel).toBe("Nombre de tours");
        fireEvent.press(trigger);
        expect(onOpenNatureMenu).toHaveBeenCalledTimes(1);
        expect(onChangeCount).not.toHaveBeenCalled();
        expect(onToggleCounter).not.toHaveBeenCalled();
        rerender({ isNatureMenuOpen: true });
        expect(screen.getByTestId("header-counter-nature").props.accessibilityState).toMatchObject({ expanded: true });
        fireEvent.press(screen.getByTestId("header-counter-nature"));
        expect(onCloseNatureMenu).toHaveBeenCalledTimes(1);
      }));

    it("Android: focus goes to the adjective only on a focus request, never on a mere close", () =>
      withPlatform("android", () => {
        const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
        try {
          const { rerender } = renderHeader({ isNatureMenuOpen: true, natureFocusRequest: 0 });
          expect(focus).not.toHaveBeenCalled();
          rerender({ isNatureMenuOpen: false });
          expect(focus).not.toHaveBeenCalled();
          rerender({ natureFocusRequest: 1 });
          expect(focus).toHaveBeenCalledTimes(1);
          expect((focus.mock.calls[0]![0] as unknown as { props: { testID?: string } }).props.testID).toBe("header-counter-nature");
          expect(focus.mock.calls[0]![1]).toBe("focus");
        } finally {
          focus.mockRestore();
        }
      }));

    it("iOS: the native menu host is remounted when the adjective changes (story 7.9), kept otherwise", () =>
      withPlatform("ios", () => {
        const host = () => screen.getByTestId("header-counter-nature", anyNode);
        const { rerender } = renderHeader({ nature: "TOURS", count: 3 });
        const grouped = host();
        rerender({ count: 12 });
        expect(host()).toBe(grouped);
        rerender({ nature: "SERIES" });
        expect(host()).not.toBe(grouped);
        expect(screen.getByTestId("header-counter-adjective", anyNode).props.children).toBe("alternées");
      }));
  });

  describe("CircuitNaturePanel (Android / web)", () => {
    it("lists both options with subtitles, the current one checked; choosing or dismissing reports it", () => {
      const onSelect = jest.fn<(nature: CircuitNature) => void>();
      const onDismiss = jest.fn();
      render(
        <CircuitNaturePanel nature="TOURS" placement={{ top: 50, right: 24 }} onDismiss={onDismiss} onSelect={onSelect} testID="panel" />,
      );
      const panel = screen.getByTestId("panel");
      expect(StyleSheet.flatten(panel.props.style)).toMatchObject({ top: 50, right: 24 });
      expect(within(panel).getByText("Séries groupées")).toBeTruthy();
      expect(within(panel).getByText("toutes les séries d’un exercice exécutées à chaque tour")).toBeTruthy();
      expect(within(panel).getByText("Séries alternées")).toBeTruthy();
      expect(within(panel).getByText("une série de chaque exercice exécutée à chaque tour")).toBeTruthy();
      expect(screen.getByTestId("panel-TOURS").props.accessibilityState).toMatchObject({ selected: true });
      expect(screen.getByTestId("panel-SERIES").props.accessibilityState).toMatchObject({ selected: false });
      expect(screen.getByTestId("panel-TOURS").props.accessibilityLabel).toBe(
        "Séries groupées, toutes les séries d’un exercice exécutées à chaque tour",
      );
      expect(screen.getByTestId("panel-TOURS-check")).toBeTruthy();
      expect(screen.queryByTestId("panel-SERIES-check")).toBeNull();

      fireEvent.press(screen.getByTestId("panel-SERIES"));
      expect(onSelect).toHaveBeenCalledWith("SERIES");
      fireEvent.press(screen.getByTestId("panel-outside", anyNode));
      fireEvent(panel, "accessibilityEscape");
      expect(onDismiss).toHaveBeenCalledTimes(2);
    });
  });
});

/**
 * PRE-9 B.1a — D-451, complément du 28/10 (remplace D-442 / D-443) ; RM-027 : toucher le nombre
 * révèle le stepper ; l'unité n'est pas interactive.
 */
describe("CircuitHeader — stepper révélé au toucher du nombre (RM-027)", () => {
  it("at rest: no − / +; the number is a 44 target that asks the screen to reveal the stepper", () => {
    const { onToggleCounter, onChangeCount } = renderHeader({ count: 3 });
    expect(screen.queryByTestId(MINUS)).toBeNull();
    expect(screen.queryByTestId(PLUS)).toBeNull();
    const counter = screen.getByTestId("header-counter");
    expect(counter.props.accessibilityState).toMatchObject({ expanded: false });
    expect(style("header-counter")).toMatchObject({ minWidth: 44, minHeight: 44, marginVertical: -2 });
    expect(counter.props.hitSlop).toBeUndefined();
    fireEvent.press(counter);
    expect(onToggleCounter).toHaveBeenCalledTimes(1);
    expect(onChangeCount).not.toHaveBeenCalled();
  });

  it("the unit is not interactive (no role, not accessible, no press handler)", () => {
    const { onToggleCounter, onOpenNatureMenu } = renderHeader({ count: 3 });
    const unit = screen.getByTestId("header-counter-unit", anyNode);
    expect(unit.props.accessible).toBe(false);
    expect(unit.props.accessibilityRole).toBeUndefined();
    expect(unit.props.onPress).toBeUndefined();
    fireEvent.press(unit);
    expect(onToggleCounter).not.toHaveBeenCalled();
    expect(onOpenNatureMenu).not.toHaveBeenCalled();
  });

  it("revealed: − N + on the white background (36, radius 18, padding 4; circles of 28); tapping the number again closes it", () => {
    const { onToggleCounter } = renderHeader({ count: 3, isCounterOpen: true });
    expect(screen.getByTestId(MINUS)).toBeTruthy();
    expect(screen.getByTestId(PLUS)).toBeTruthy();
    expect(screen.getByTestId("header-counter").props.accessibilityState).toMatchObject({ expanded: true });
    expect(style("header-counter-stepper")).toMatchObject({
      backgroundColor: colors.background,
      minHeight: 36,
      borderRadius: 18,
      paddingHorizontal: 4,
      flexShrink: 0,
    });
    for (const id of [MINUS, PLUS]) {
      expect(style(`${id}-circle`)).toMatchObject({ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface });
      const box = style(id);
      expect(box).toMatchObject({ width: 44, height: 44, marginVertical: -4 });
      expect(screen.getByTestId(id).props.hitSlop).toBeUndefined();
    }
    expect(style("header-counter")).toMatchObject({ minHeight: 44, marginVertical: -4 });
    fireEvent.press(screen.getByTestId("header-counter"));
    expect(onToggleCounter).toHaveBeenCalledTimes(1);
  });

  it("reading order when revealed: −, the adjustable, +, then the nature", () =>
    withPlatform("android", () => {
      renderHeader({ count: 3, isCounterOpen: true });
      const row = screen.getByTestId("header-counter-row");
      const order = [MINUS, "header-counter", PLUS, "header-counter-nature"];
      const ids = within(row)
        .UNSAFE_queryAllByProps({})
        .map((node) => node.props.testID as string | undefined)
        .filter((id): id is string => id !== undefined && order.includes(id));
      expect([...new Set(ids)]).toEqual(order);
    }));

  it("− and + are active within 1..99; each tap asks the screen for N ± 1 (applied by `circuitCountOutcome`)", () => {
    const { onChangeCount } = renderHeader({ count: 5, isCounterOpen: true });
    expect(screen.getByTestId(MINUS).props.accessibilityState).toMatchObject({ disabled: false });
    expect(screen.getByTestId(PLUS).props.accessibilityState).toMatchObject({ disabled: false });
    tap(PLUS);
    expect(onChangeCount).toHaveBeenLastCalledWith(6);
  });

  it("the step follows the CURRENT N after a re-render (no stale value)", () => {
    const { onChangeCount, rerender } = renderHeader({ count: 5, isCounterOpen: true });
    tap(MINUS);
    expect(onChangeCount).toHaveBeenLastCalledWith(4);
    rerender({ count: 4 });
    tap(MINUS);
    expect(onChangeCount).toHaveBeenLastCalledWith(3);
    // N refusé par l'écran (dialogue de Tour annulé) : le pas suivant repart de N affiché.
    rerender({ count: 4 });
    tap(PLUS);
    expect(onChangeCount).toHaveBeenLastCalledWith(5);
  });

  it.each([
    [1, MINUS, "Retirer un tour — minimum atteint", PLUS],
    [99, PLUS, "Ajouter un tour — maximum atteint", MINUS],
  ])("at %i, the bound button is disabled (grey sign, announced) and does nothing; the other stays active", (count, bound, label, other) => {
    const { onChangeCount } = renderHeader({ count, isCounterOpen: true });
    const button = screen.getByTestId(bound);
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    expect(button.props.accessibilityLabel).toBe(label);
    expect(screen.getByTestId(other).props.accessibilityState).toMatchObject({ disabled: false });
    tap(bound);
    expect(onChangeCount).not.toHaveBeenCalled();
    const tint = (id: string) => StyleSheet.flatten(screen.getByTestId(`${id}-icon`, anyNode).props.style).tintColor;
    expect(tint(bound)).toBe(colors.disabled);
    expect(tint(other)).toBe(colors.primary);
  });

  it("− and + are named after « tour » for both natures", () => {
    renderHeader({ count: 3, nature: "SERIES", isCounterOpen: true });
    expect(screen.getByTestId(MINUS).props.accessibilityRole).toBe("button");
    expect(screen.getByTestId(MINUS).props.accessibilityLabel).toBe("Retirer un tour");
    expect(screen.getByTestId(PLUS).props.accessibilityLabel).toBe("Ajouter un tour");
  });

  it("revue 7.3 — activation without touch takes one step; a touch (pressIn, pressOut, press) takes only one", () => {
    const { onChangeCount, rerender } = renderHeader({ count: 3, isCounterOpen: true });
    fireEvent.press(screen.getByTestId(PLUS));
    expect(onChangeCount.mock.calls).toEqual([[4]]);
    rerender({ count: 4 });
    const minus = screen.getByTestId(MINUS);
    fireEvent(minus, "pressIn");
    fireEvent(minus, "pressOut");
    fireEvent.press(minus);
    expect(onChangeCount.mock.calls).toEqual([[4], [3]]);
  });

  it("revue 7.3 — a press delay lets a scroll starting on − or + take the gesture without a step", () => {
    renderHeader({ count: 3, isCounterOpen: true });
    for (const id of [MINUS, PLUS]) {
      const pressable = screen.UNSAFE_getAllByProps({ testID: id }).find((node) => node.props.unstable_pressDelay !== undefined);
      expect(pressable?.props.unstable_pressDelay).toBe(100);
    }
  });

  describe("maintien appuyé (EXECUTION_UNIT_HOLD_POLICY)", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it("holding + repeats after 500 ms then every 150 ms, from the last requested value; release stops", () => {
      const { onChangeCount } = renderHeader({ count: 3, isCounterOpen: true });
      const plus = screen.getByTestId(PLUS);
      fireEvent(plus, "pressIn");
      expect(onChangeCount.mock.calls).toEqual([[4]]);
      act(() => {
        jest.advanceTimersByTime(499);
      });
      expect(onChangeCount).toHaveBeenCalledTimes(1);
      act(() => {
        jest.advanceTimersByTime(1 + 150 * 2);
      });
      expect(onChangeCount.mock.calls).toEqual([[4], [5], [6], [7]]);
      fireEvent(plus, "pressOut");
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(onChangeCount).toHaveBeenCalledTimes(4);
    });

    it("holding − stops asking at the bound 1", () => {
      const { onChangeCount } = renderHeader({ count: 2, isCounterOpen: true });
      fireEvent(screen.getByTestId(MINUS), "pressIn");
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(onChangeCount.mock.calls).toEqual([[1]]);
      fireEvent(screen.getByTestId(MINUS), "pressOut");
    });

    it.each(["isAttenuated", "isChoicePending", "closed"] as const)(
      "revue 7.3 — %s stops a hold in progress (no step resumed afterwards)",
      (prop) => {
        const { onChangeCount, rerender } = renderHeader({ count: 3, isCounterOpen: true });
        fireEvent(screen.getByTestId(PLUS), "pressIn");
        expect(onChangeCount).toHaveBeenCalledTimes(1);
        rerender(
          prop === "isAttenuated" ? { isAttenuated: true } : prop === "isChoicePending" ? { isChoicePending: true } : { isCounterOpen: false },
        );
        act(() => {
          jest.advanceTimersByTime(2000);
        });
        expect(onChangeCount).toHaveBeenCalledTimes(1);
      },
    );

    it("unmounting during a hold stops the repetition", () => {
      const onChangeCount = jest.fn<(count: number) => void>();
      const view = render(
        <CircuitHeader
          nature="TOURS"
          count={3}
          duration="≈ 1 min"
          isCounterOpen
          onToggleCounter={jest.fn()}
          onChangeCount={onChangeCount}
          isNatureMenuOpen={false}
          natureFocusRequest={0}
          onOpenNatureMenu={jest.fn()}
          onCloseNatureMenu={jest.fn()}
          onSelectNature={jest.fn()}
          isCollapsed={false}
          onToggleCollapsed={jest.fn()}
          memberNames={[]}
          testID="header"
        />,
      );
      fireEvent(screen.getByTestId(PLUS), "pressIn");
      view.unmount();
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(onChangeCount).toHaveBeenCalledTimes(1);
    });
  });

  it("VoiceOver: adjustable « Nombre de tours », value with its unit, increment / decrement bounded, « activate » reveals", () => {
    const { onChangeCount, onToggleCounter, counterRef } = renderHeader({ count: 5, nature: "SERIES" });
    const counter = screen.getByTestId("header-counter");
    expect(counter.props.accessible).toBe(true);
    expect(counter.props.accessibilityRole).toBe("adjustable");
    expect(counter.props.accessibilityLabel).toBe("Nombre de tours");
    expect(counter.props.accessibilityValue).toEqual({ min: 1, max: 99, now: 5, text: "5 tours" });
    expect((counter.props.accessibilityActions as { name: string }[]).map((action) => action.name)).toEqual([
      "increment",
      "decrement",
      "activate",
    ]);
    accessibilityAction("header-counter", "increment");
    accessibilityAction("header-counter", "increment");
    accessibilityAction("header-counter", "decrement");
    // Revue 7.3 : deux gestes avant un nouveau rendu partent de la dernière valeur demandée.
    expect(onChangeCount.mock.calls).toEqual([[6], [7], [6]]);
    accessibilityAction("header-counter", "activate");
    expect(onToggleCounter).toHaveBeenCalledTimes(1);
    // Story 5.1b : l'écran porte le focus sur ce réglage, toujours monté.
    expect(counterRef.current).not.toBeNull();
  });

  it.each([
    [1, ["increment", "activate"]],
    [99, ["decrement", "activate"]],
  ])("VoiceOver at %i: only the available step is offered", (count, actions) => {
    const { onChangeCount } = renderHeader({ count });
    const counter = screen.getByTestId("header-counter");
    expect((counter.props.accessibilityActions as { name: string }[]).map((action) => action.name)).toEqual(actions);
    accessibilityAction("header-counter", count === 1 ? "decrement" : "increment");
    expect(onChangeCount).not.toHaveBeenCalled();
  });

  // Référence §4 : le compteur ne cède jamais ; la durée d'abord, puis le nom.
  it("narrow widths: the duration gives way first, then the name; the counter never shrinks", () => {
    renderHeader({ count: 3, isCounterOpen: true });
    expect(style("header-collapse")).toMatchObject({ flexShrink: 1, minWidth: 0 });
    expect(style("header-title")).toMatchObject({ flexShrink: 1, minWidth: 0 });
    expect(screen.getByTestId("header-title").props.numberOfLines).toBe(1);
    expect(style("header-counter-slot").flexShrink).toBe(0);
    expect(style("header-counter-row").flexShrink).toBe(0);
    expect(style("header-counter-stepper").flexShrink).toBe(0);
    expect(style("header-counter-adjective-slot").flexShrink).toBe(0);
    expect(style("header-duration")).toMatchObject({ flex: 1, minWidth: 0 });
    // Compteur à abscisse fixe après le nom : aucun centrage dans l'espace résiduel.
    expect(style("header-counter-slot")).toMatchObject({ marginLeft: CIRCUIT_HEADER_TOUCH_GEOMETRY.titleToCounterGap });
    expect(style("header-row").justifyContent).toBeUndefined();
  });

  it("placement: the header is not interactive and hidden from accessibility", () => {
    renderHeader({ isAttenuated: true });
    const header = screen.getByTestId("header", anyNode);
    expect(header.props.pointerEvents).toBe("none");
    expect(header.props.accessibilityElementsHidden).toBe(true);
  });

  it("no eye of the volumes in the header (story 5.1b)", () => {
    renderHeader();
    expect(screen.queryByTestId("header-volumes", anyNode)).toBeNull();
    expect(screen.queryByLabelText("Voir les volumes du circuit", anyNode)).toBeNull();
  });
});

/** PRE-9 B.1a (ARB-12, référence §4) : chevron, Circuit replié. */
describe("CircuitHeader — repli du Circuit (ARB-12)", () => {
  it("expanded: chevron up, state expanded, no names line, row of 40 (minimum)", () => {
    renderHeader({ memberNames: ["Squat", "Pompes"] });
    const collapse = screen.getByTestId("header-collapse");
    expect(collapse.props.accessibilityRole).toBe("button");
    expect(collapse.props.accessibilityState).toMatchObject({ expanded: true });
    expect(screen.getByTestId("header-chevron", anyNode).props.source).toBeTruthy();
    expect(screen.queryByTestId("header-names", anyNode)).toBeNull();
    expect(style("header")).toMatchObject({ minHeight: CIRCUIT_HEADER_HEIGHT });
    expect(style("header").height).toBeUndefined();
    expect(style("header-row")).toMatchObject({ flexDirection: "row", minHeight: CIRCUIT_HEADER_HEIGHT, alignItems: "center" });
    expect(style("header-collapse")).toMatchObject({ minHeight: 44, marginVertical: -2 });
  });

  it("tapping the name / chevron asks the screen to collapse; collapsed: names line « A · B », one truncated line, 7 below, 68 reference", () => {
    const { onToggleCollapsed, rerender } = renderHeader({ memberNames: ["Squat", "Pompes", "Gainage"] });
    const expandedChevron = screen.getByTestId("header-chevron", anyNode).props.source;
    fireEvent.press(screen.getByTestId("header-collapse"));
    expect(onToggleCollapsed).toHaveBeenCalledTimes(1);
    rerender({ isCollapsed: true });
    expect(screen.getByTestId("header-collapse").props.accessibilityState).toMatchObject({ expanded: false });
    expect(screen.getByTestId("header-chevron", anyNode).props.source).not.toEqual(expandedChevron);
    const names = screen.getByTestId("header-names");
    expect(names.props.children).toBe("Squat · Pompes · Gainage");
    expect(names.props.numberOfLines).toBe(1);
    expect(style("header-names")).toMatchObject({ marginTop: 7 });
    expect(style("header")).toMatchObject({ minHeight: CIRCUIT_HEADER_COLLAPSED_HEIGHT });
    expect(CIRCUIT_HEADER_COLLAPSED_HEIGHT).toBe(68);
    // Le compteur et la durée restent sur la ligne d'en-tête.
    expect(within(screen.getByTestId("header-row")).getByTestId("header-counter")).toBeTruthy();
    fireEvent.press(screen.getByTestId("header-collapse"));
    expect(onToggleCollapsed).toHaveBeenCalledTimes(2);
  });
});
