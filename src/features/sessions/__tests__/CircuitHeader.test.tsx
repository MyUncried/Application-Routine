import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Button as SwiftUIButton, Menu, RNHostView } from "@expo/ui/swift-ui";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { AccessibilityInfo, Platform, StyleSheet } from "react-native";

import type { CircuitNature } from "@/domain/sessions/circuit";
import {
  CIRCUIT_HEADER_HEIGHT,
  CIRCUIT_HEADER_TOUCH_GEOMETRY,
  CircuitHeader,
  circuitCountSpokenValue,
  circuitUnitLabel,
} from "@/features/sessions/CircuitHeader";
import { CircuitNaturePanel } from "@/features/sessions/CircuitNatureMenu";
import { colors, type } from "@/shared/ui/tokens";

type HeaderOverrides = Partial<{
  nature: CircuitNature;
  count: number;
  isNatureMenuOpen: boolean;
  natureFocusRequest: number;
  isAttenuated: boolean;
  isChoicePending: boolean;
}>;

function renderHeader(overrides: HeaderOverrides = {}) {
  const onChangeCount = jest.fn<(count: number) => void>();
  const onOpenNatureMenu = jest.fn();
  const onCloseNatureMenu = jest.fn();
  const onSelectNature = jest.fn<(nature: CircuitNature) => void>();
  const counterRef: { current: unknown } = { current: null };
  const element = (next: HeaderOverrides) => (
    <CircuitHeader
      nature={next.nature ?? "TOURS"}
      count={next.count ?? 1}
      onChangeCount={onChangeCount}
      isNatureMenuOpen={next.isNatureMenuOpen ?? false}
      natureFocusRequest={next.natureFocusRequest ?? 0}
      onOpenNatureMenu={onOpenNatureMenu}
      onCloseNatureMenu={onCloseNatureMenu}
      onSelectNature={onSelectNature}
      counterRef={counterRef as { current: null }}
      isAttenuated={next.isAttenuated}
      isChoicePending={next.isChoicePending}
      testID="header"
    />
  );
  const view = render(element(overrides));
  return {
    onChangeCount,
    onOpenNatureMenu,
    onCloseNatureMenu,
    onSelectNature,
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

describe("CircuitHeader (PRE-6 story 3.1)", () => {
  it("accords the unit with the nature and N (N = 1 singular)", () => {
    expect(circuitUnitLabel("TOURS", 1)).toBe("tour");
    expect(circuitUnitLabel("TOURS", 2)).toBe("tours");
    expect(circuitUnitLabel("SERIES", 1)).toBe("série");
    expect(circuitUnitLabel("SERIES", 3)).toBe("séries");
    expect(circuitCountSpokenValue("TOURS", 4)).toBe("4 tours");
  });

  describe("nature choice (PRE-6 story 3.2, CE-CIR-01)", () => {
    it("iOS: the pill is the trigger of a native SwiftUI Menu (two options, current checked, subtitle in the accessible name)", () =>
      withPlatform("ios", () => {
        const { onSelectNature, onChangeCount } = renderHeader({ nature: "TOURS", count: 3 });
        const host = screen.getByTestId("header-counter-nature", anyNode);
        const menu = within(host).UNSAFE_getByType(Menu);
        expect(within(host).UNSAFE_getAllByType(RNHostView)).toHaveLength(1);
        // Pastille rendue dans le déclencheur (avec sa cible de 44), sans rôle propre.
        expect(within(host).getByTestId("header-counter-unit-text", anyNode).props.children).toBe("tours");
        expect(within(host).getByTestId("header-counter-unit-target", anyNode)).toBeTruthy();
        const modifiers = JSON.stringify(menu.props.modifiers);
        expect(modifiers).toContain("Nature du circuit");
        expect(modifiers).toContain("Circuit de tours");
        const items = within(menu).UNSAFE_getAllByType(SwiftUIButton);
        expect(items.map((item) => [item.props.label, item.props.systemImage ?? null])).toEqual([
          ["Circuit de tours", "checkmark"],
          ["Circuit de séries", null],
        ]);
        expect(items.map((item) => JSON.stringify(item.props.modifiers))).toEqual([
          expect.stringContaining("Circuit de tours, les séries d’un exercice s’enchaînent"),
          expect.stringContaining("Circuit de séries, une série de chaque exercice par passage"),
        ]);
        act(() => {
          fireEvent(screen.getByTestId("header-counter-nature-SERIES", anyNode), "buttonPress");
        });
        expect(onSelectNature).toHaveBeenCalledWith("SERIES");
        expect(onChangeCount).not.toHaveBeenCalled();
        // Le chiffre reste un réglage distinct.
        expect(screen.getByTestId("header-counter").props.accessibilityLabel).toBe("Nombre de tours");
      }));

    it("Android: the pill is a distinct button « Nature du circuit » (44 target) opening the choice", () =>
      withPlatform("android", () => {
        const { onOpenNatureMenu, onCloseNatureMenu, onChangeCount, rerender } = renderHeader({ nature: "SERIES", count: 2 });
        const pill = screen.getByTestId("header-counter-nature");
        expect(pill.props.accessibilityRole).toBe("button");
        expect(pill.props.accessibilityLabel).toBe("Nature du circuit");
        expect(pill.props.accessibilityValue).toEqual({ text: "Circuit de séries" });
        expect(StyleSheet.flatten(pill.props.style)).toMatchObject({ minWidth: 44, minHeight: 44 });
        expect(screen.getByTestId("header-counter").props.accessibilityLabel).toBe("Nombre de séries");
        fireEvent.press(pill);
        expect(onOpenNatureMenu).toHaveBeenCalledTimes(1);
        expect(onChangeCount).not.toHaveBeenCalled();
        rerender({ isNatureMenuOpen: true });
        expect(screen.getByTestId("header-counter-nature").props.accessibilityState).toMatchObject({ expanded: true });
        fireEvent.press(screen.getByTestId("header-counter-nature"));
        expect(onCloseNatureMenu).toHaveBeenCalledTimes(1);
      }));

    it("Android: focus goes to the pill only on a focus request, never on a mere close", () =>
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
      expect(within(panel).getByText("Circuit de tours")).toBeTruthy();
      expect(within(panel).getByText("les séries d’un exercice s’enchaînent")).toBeTruthy();
      expect(within(panel).getByText("Circuit de séries")).toBeTruthy();
      expect(within(panel).getByText("une série de chaque exercice par passage")).toBeTruthy();
      expect(screen.getByTestId("panel-TOURS").props.accessibilityState).toMatchObject({ selected: true });
      expect(screen.getByTestId("panel-SERIES").props.accessibilityState).toMatchObject({ selected: false });
      expect(screen.getByTestId("panel-TOURS").props.accessibilityLabel).toBe(
        "Circuit de tours, les séries d’un exercice s’enchaînent",
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

  // Story 7.8 (D-438) : plus de durée du Circuit — le titre est lu seul, sans durée.
  it("story 7.8 — no Circuit duration: neither text nor accessible name", () => {
    renderHeader({ count: 3 });
    expect(screen.queryByTestId("header-duration", anyNode)).toBeNull();
    expect(screen.getByTestId("header-title").props.accessibilityLabel).toBeUndefined();
    expect(screen.getByTestId("header-title").props.children).toBe("Circuit");
  });
});

/**
 * PRE-6 story 7.3 (D-437, recette du 22/10, commentaires 8 à 11 ; Figma `8328:28605`) : stepper
 * toujours affiché et actif, nombre en « Valeur modifiable », textes à la taille du titre, cibles
 * réelles de 44 espacées.
 */
describe("CircuitHeader — stepper toujours affiché (PRE-6 story 7.3, D-437)", () => {
  it("renders « Circuit » and − N unit + at once, without any reveal", () => {
    renderHeader({ count: 3, nature: "SERIES" });
    expect(screen.getByTestId("header-title").props.children).toBe("Circuit");
    expect(screen.getByTestId(MINUS)).toBeTruthy();
    expect(screen.getByTestId(PLUS)).toBeTruthy();
    expect(screen.getByTestId("header-counter-value").props.children).toBe(3);
    expect(screen.getByTestId("header-counter-unit-text", anyNode).props.children).toBe("séries");
    // Ni état révélé, ni chiffre tactile, ni champ ouvert.
    expect(screen.queryByTestId("header-counter-value-press")).toBeNull();
    expect(screen.queryByTestId("header-counter-field")).toBeNull();
    expect(screen.queryByTestId("header-counter-rest")).toBeNull();
    expect(screen.getByTestId("header-counter").props.accessibilityState).toBeUndefined();
  });

  it("− and + are active within 1..99; each tap asks the screen for N ± 1 (applied by `circuitCountOutcome`)", () => {
    const { onChangeCount } = renderHeader({ count: 5 });
    expect(screen.getByTestId(MINUS).props.accessibilityState).toMatchObject({ disabled: false });
    expect(screen.getByTestId(PLUS).props.accessibilityState).toMatchObject({ disabled: false });
    tap(PLUS);
    expect(onChangeCount).toHaveBeenLastCalledWith(6);
  });

  it("the step follows the CURRENT N after a re-render (no stale value)", () => {
    const { onChangeCount, rerender } = renderHeader({ count: 5 });
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
    const { onChangeCount } = renderHeader({ count });
    const button = screen.getByTestId(bound);
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    expect(button.props.accessibilityLabel).toBe(label);
    expect(screen.getByTestId(other).props.accessibilityState).toMatchObject({ disabled: false });
    tap(bound);
    expect(onChangeCount).not.toHaveBeenCalled();
  });

  it("revue 7.3 — activation without touch (TalkBack, keyboard: `onPress` alone) takes one step; a touch (pressIn, pressOut, press) takes only one", () => {
    const { onChangeCount, rerender } = renderHeader({ count: 3 });
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
    renderHeader({ count: 3 });
    for (const id of [MINUS, PLUS]) {
      const pressable = screen.UNSAFE_getAllByProps({ testID: id }).find((node) => node.props.unstable_pressDelay !== undefined);
      expect(pressable?.props.unstable_pressDelay).toBe(100);
    }
  });

  it("revue 7.3 — the sign is greyed (`colors.disabled`) at the bound, primary otherwise", () => {
    renderHeader({ count: 1 });
    const tint = (id: string) => StyleSheet.flatten(screen.getByTestId(`${id}-icon`, anyNode).props.style).tintColor;
    expect(tint(MINUS)).toBe(colors.disabled);
    expect(tint(PLUS)).toBe(colors.primary);
  });

  it("− and + are separate accessible buttons named after the nature", () => {
    renderHeader({ count: 3, nature: "SERIES" });
    expect(screen.getByTestId(MINUS).props.accessibilityRole).toBe("button");
    expect(screen.getByTestId(MINUS).props.accessibilityLabel).toBe("Retirer une série");
    expect(screen.getByTestId(PLUS).props.accessibilityLabel).toBe("Ajouter une série");
  });

  describe("maintien appuyé (EXECUTION_UNIT_HOLD_POLICY)", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it("holding + repeats after 500 ms then every 150 ms, from the last requested value; release stops", () => {
      const { onChangeCount } = renderHeader({ count: 3 });
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
      const { onChangeCount } = renderHeader({ count: 2 });
      fireEvent(screen.getByTestId(MINUS), "pressIn");
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(onChangeCount.mock.calls).toEqual([[1]]);
      fireEvent(screen.getByTestId(MINUS), "pressOut");
    });

    it.each(["isAttenuated", "isChoicePending"] as const)("revue 7.3 — %s stops a hold in progress (no step resumed after the dialog)", (prop) => {
      const { onChangeCount, rerender } = renderHeader({ count: 3 });
      fireEvent(screen.getByTestId(PLUS), "pressIn");
      expect(onChangeCount).toHaveBeenCalledTimes(1);
      rerender(prop === "isAttenuated" ? { isAttenuated: true } : { isChoicePending: true });
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(onChangeCount).toHaveBeenCalledTimes(1);
    });

    it("unmounting during a hold stops the repetition", () => {
      const onChangeCount = jest.fn<(count: number) => void>();
      const view = render(
        <CircuitHeader
          nature="TOURS"
          count={3}
          onChangeCount={onChangeCount}
          isNatureMenuOpen={false}
          natureFocusRequest={0}
          onOpenNatureMenu={jest.fn()}
          onCloseNatureMenu={jest.fn()}
          onSelectNature={jest.fn()}
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

  it("VoiceOver: adjustable « Nombre de tours », value with its unit, increment / decrement bounded, no « activate »", () => {
    const { onChangeCount, counterRef } = renderHeader({ count: 5 });
    const counter = screen.getByTestId("header-counter");
    expect(counter.props.accessible).toBe(true);
    expect(counter.props.accessibilityRole).toBe("adjustable");
    expect(counter.props.accessibilityLabel).toBe("Nombre de tours");
    expect(counter.props.accessibilityValue).toEqual({ min: 1, max: 99, now: 5, text: "5 tours" });
    expect((counter.props.accessibilityActions as { name: string }[]).map((action) => action.name)).toEqual([
      "increment",
      "decrement",
    ]);
    accessibilityAction("header-counter", "increment");
    accessibilityAction("header-counter", "increment");
    accessibilityAction("header-counter", "decrement");
    accessibilityAction("header-counter", "activate");
    // Revue 7.3 : deux gestes avant un nouveau rendu partent de la dernière valeur demandée.
    expect(onChangeCount.mock.calls).toEqual([[6], [7], [6]]);
    // Story 5.1b : l'écran porte le focus sur ce réglage, toujours monté.
    expect(counterRef.current).not.toBeNull();
  });

  it.each([
    [1, ["increment"]],
    [99, ["decrement"]],
  ])("VoiceOver at %i: only the available step is offered", (count, actions) => {
    const { onChangeCount } = renderHeader({ count });
    const counter = screen.getByTestId("header-counter");
    expect((counter.props.accessibilityActions as { name: string }[]).map((action) => action.name)).toEqual(actions);
    accessibilityAction("header-counter", count === 1 ? "decrement" : "increment");
    expect(onChangeCount).not.toHaveBeenCalled();
  });

  it("reading order: −, the adjustable, the nature pill, +", () =>
    withPlatform("android", () => {
      renderHeader({ count: 3 });
      const stepper = screen.getByTestId("header-counter-stepper");
      const order = [MINUS, "header-counter", "header-counter-nature", PLUS];
      const ids = within(stepper)
        .UNSAFE_queryAllByProps({})
        .map((node) => node.props.testID as string | undefined)
        .filter((id): id is string => id !== undefined && order.includes(id));
      expect([...new Set(ids)]).toEqual(order);
    }));

  it("the number is a « Valeur modifiable » (surface, radius 10, 10 / 4, primary); number and unit at the title size", () => {
    renderHeader({ count: 3 });
    expect(style("header-counter")).toMatchObject({
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
    });
    const titleSize = style("header-title").fontSize;
    expect(titleSize).toBe(type.cardTitle.fontSize);
    expect(style("header-counter-value")).toMatchObject({ color: colors.primary, fontSize: titleSize });
    expect(style("header-counter-unit-text")).toMatchObject({ color: colors.primary, fontSize: titleSize });
    expect(style("header-counter-unit")).toMatchObject({ backgroundColor: colors.surface, borderRadius: 10 });
  });

  it("stepper background (Figma `9819:19951`): white, 36 high, radius 18, padding 4; surface circles of 28", () => {
    renderHeader({ count: 3 });
    expect(style("header-counter-stepper")).toMatchObject({
      backgroundColor: colors.background,
      minHeight: 36,
      borderRadius: 18,
      paddingHorizontal: 4,
      flexShrink: 0,
    });
    for (const id of [MINUS, PLUS]) {
      expect(style(`${id}-circle`)).toMatchObject({ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface });
    }
  });

  /**
   * Cibles réelles (revue 5.3 : Fabric iOS écarte un `hitSlop` hors du parent) : boîtes de 44 dont
   * le débordement est compensé par des marges négatives — la mise en page garde 36 dans le fond et
   * 40 pour l'en-tête. Rectangles calculés le long de la ligne depuis les styles rendus.
   */
  it("−, + and the pill are real 44-high boxes, overflowing the 36 background without growing the 40 header", () => {
    renderHeader({ count: 3 });
    const g = CIRCUIT_HEADER_TOUCH_GEOMETRY;
    expect(g.touchTarget).toBe(44);
    for (const id of [MINUS, PLUS]) {
      const box = style(id);
      expect(box).toMatchObject({ width: 44, height: 44, marginVertical: -4 });
      expect(screen.getByTestId(id).props.hitSlop).toBeUndefined();
      // Hauteur occupée dans le fond : 44 − 2 × 4 = 36.
      expect((box.height as number) + 2 * (box.marginVertical as number)).toBe(g.stepperHeight);
    }
    expect(style("header-counter-unit-target")).toMatchObject({ minHeight: 44 });
    expect(style("header-counter-unit-slot")).toMatchObject({ marginVertical: -4 });
    // L'en-tête : une rangée de hauteur MINIMALE 40 ; le fond de 36 y tient, les cibles débordent de 2.
    expect(style("header")).toMatchObject({ flexDirection: "row", minHeight: CIRCUIT_HEADER_HEIGHT, alignItems: "center" });
    expect(style("header").height).toBeUndefined();
    expect((g.touchTarget - CIRCUIT_HEADER_HEIGHT) / 2).toBe(2);
  });

  it("targets never overlap each other nor the title; the circles sit 4 inside the background (Figma)", () => {
    renderHeader({ count: 3 });
    const g = CIRCUIT_HEADER_TOUCH_GEOMETRY;
    const slotGap = style("header-counter-slot").marginLeft as number;
    const padding = style("header-counter-stepper").paddingHorizontal as number;
    const minus = style(MINUS);
    const plus = style(PLUS);
    const circleInset = (g.touchTarget - g.stepCircle) / 2;
    // Repère : bord droit du bloc du titre = 0.
    const minusLeft = slotGap + padding + (minus.marginLeft as number);
    // Valeurs littérales (revue 7.3) : la cible du − commence à 4 du titre.
    expect(minusLeft).toBe(4);
    expect(g.minusTargetLeft).toBe(4);
    // Cercle − à 4 du bord gauche du fond, cercle + à 4 du bord droit.
    expect(padding + (minus.marginLeft as number) + circleInset).toBe(4);
    expect(padding + (plus.marginRight as number) + circleInset).toBe(4);
    // Entre la cible du − et le chiffre (non tactile) : rien ne se chevauche au-delà de la boîte.
    expect(minus.marginRight as number).toBeGreaterThanOrEqual(0);
    // Pastille → + : la cible du + commence après la pastille (écart ≥ 4).
    expect(plus.marginLeft as number).toBe(4);
    expect(g.unitToPlusTargetGap).toBe(4);
    // Écarts visibles : cercle − → chiffre 8, chiffre → pastille 6, pastille → cercle + 12.
    expect((minus.marginRight as number) + circleInset).toBe(8);
    expect(style("header-counter-unit-slot").marginLeft).toBe(6);
    expect((plus.marginLeft as number) + circleInset).toBe(12);
  });

  // Revue 5.2 / story 7.8 : à court de place, le titre cède (ellipse) ; le stepper (et la pastille
  // de nature) ne rétrécit jamais et ne quitte pas la ligne.
  it("narrow widths: the title gives way; the stepper never shrinks", () => {
    renderHeader({ count: 3 });
    expect(style("header-text-block")).toMatchObject({ flexShrink: 1, minWidth: 0 });
    expect(style("header-title-row").minWidth).toBe(0);
    expect(style("header-title")).toMatchObject({ flexShrink: 1, minWidth: 0 });
    expect(screen.getByTestId("header-title").props.numberOfLines).toBe(1);
    expect(style("header-counter-slot").flexShrink).toBe(0);
    expect(style("header-counter-stepper").flexShrink).toBe(0);
    expect(style("header-counter").flexShrink).toBe(0);
    expect(style("header-counter-unit-slot").flexShrink).toBe(0);
    expect(style("header").flexWrap).toBeUndefined();
  });

  it("placement: the header is not interactive and hidden from accessibility", () => {
    renderHeader({ isAttenuated: true });
    const header = screen.getByTestId("header", anyNode);
    expect(header.props.pointerEvents).toBe("none");
    expect(header.props.accessibilityElementsHidden).toBe(true);
  });
});

// PRE-6 story 5.1b (D4 remplacé par Hermann le 22/10/2026) : l'œil des Volumes est dans la zone de
// contexte (`CompositionContextHeader.test.tsx`, `CompositionScreen.test.tsx`), plus dans l'en-tête.
describe("CircuitHeader — sans l'œil des volumes (PRE-6 story 5.1b)", () => {
  it("no eye in the header", () => {
    renderHeader();
    expect(screen.queryByTestId("header-volumes", anyNode)).toBeNull();
    expect(screen.queryByLabelText("Voir les volumes du circuit", anyNode)).toBeNull();
    expect(screen.queryByTestId("header-volumes-icon", anyNode)).toBeNull();
  });

  // Story 5.2 (D-435, `9819:19948`) : une seule ligne de 40 ; story 5.1b : la ligne du titre ne
  // porte que « Circuit » ; story 7.8 (D-438) : plus de durée, le stepper est calé à droite.
  it("story 7.8 — one line: « Circuit » alone on the left, the stepper right-aligned, nothing after it", () => {
    renderHeader({ count: 3 });
    const titleRow = screen.getByTestId("header-title-row");
    expect(StyleSheet.flatten(titleRow.props.style)).toMatchObject({ flexDirection: "row", alignItems: "center" });
    const children = ([] as unknown[])
      .concat(titleRow.props.children)
      .filter((child): child is { props: { testID: string } } => child !== null && typeof child === "object");
    expect(children.map((child) => child.props.testID)).toEqual(["header-title"]);
    expect(within(titleRow).queryByTestId("header-counter-stepper")).toBeNull();
    const header = screen.getByTestId("header");
    const rowChildren = (header.props.children as ({ props: { testID: string } } | null)[])
      .flat()
      .filter((child): child is { props: { testID: string } } => child !== null);
    // Le stepper est le DERNIER élément de la ligne, et le bloc du titre prend toute la place libre :
    // le bord droit du stepper est donc le bord droit de l'en-tête (aligné à droite).
    expect(rowChildren.map((child) => child.props.testID)).toEqual(["header-text-block", "header-counter-slot"]);
    expect(style("header-text-block").flexGrow).toBe(1);
    expect(style("header-counter-slot").marginRight).toBeUndefined();
    expect(style("header").paddingRight).toBeUndefined();
    expect(style("header").justifyContent).toBeUndefined();
  });
});
