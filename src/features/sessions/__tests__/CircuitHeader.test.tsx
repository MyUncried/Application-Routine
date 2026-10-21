import { describe, expect, it, jest } from "@jest/globals";
import { Button as SwiftUIButton, Menu, RNHostView } from "@expo/ui/swift-ui";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { AccessibilityInfo, Platform, StyleSheet } from "react-native";

import type { CircuitNature } from "@/domain/sessions/circuit";
import {
  CIRCUIT_HEADER_TOUCH_GEOMETRY,
  CircuitHeader,
  circuitCountSpokenValue,
  circuitUnitLabel,
} from "@/features/sessions/CircuitHeader";
import { CircuitNaturePanel } from "@/features/sessions/CircuitNatureMenu";
import { TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";
import { colors } from "@/shared/ui/tokens";

type HeaderOverrides = Partial<{
  nature: CircuitNature;
  count: number;
  isCounterOpen: boolean;
  duration: string;
  isNatureMenuOpen: boolean;
  natureFocusRequest: number;
  volumesFocusRequest: number;
}>;

function renderHeader(overrides: HeaderOverrides = {}) {
  const onToggleCounter = jest.fn();
  const onChangeCount = jest.fn<(count: number) => void>();
  const onOpenNatureMenu = jest.fn();
  const onCloseNatureMenu = jest.fn();
  const onSelectNature = jest.fn<(nature: CircuitNature) => void>();
  const onOpenVolumes = jest.fn();
  const element = (next: HeaderOverrides) => (
    <CircuitHeader
      nature={next.nature ?? "TOURS"}
      count={next.count ?? 1}
      duration={next.duration ?? "— min"}
      isCounterOpen={next.isCounterOpen ?? false}
      onToggleCounter={onToggleCounter}
      onChangeCount={onChangeCount}
      isNatureMenuOpen={next.isNatureMenuOpen ?? false}
      natureFocusRequest={next.natureFocusRequest ?? 0}
      onOpenNatureMenu={onOpenNatureMenu}
      onCloseNatureMenu={onCloseNatureMenu}
      onSelectNature={onSelectNature}
      onOpenVolumes={onOpenVolumes}
      volumesFocusRequest={next.volumesFocusRequest ?? 0}
      testID="header"
    />
  );
  const view = render(element(overrides));
  return {
    onToggleCounter,
    onChangeCount,
    onOpenNatureMenu,
    onCloseNatureMenu,
    onSelectNature,
    onOpenVolumes,
    rerender: (next: HeaderOverrides) => view.rerender(element({ ...overrides, ...next })),
  };
}

const anyNode = { includeHiddenElements: true } as const;

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

describe("CircuitHeader (PRE-6 story 3.1)", () => {
  it("accords the unit with the nature and N (N = 1 singular)", () => {
    expect(circuitUnitLabel("TOURS", 1)).toBe("tour");
    expect(circuitUnitLabel("TOURS", 2)).toBe("tours");
    expect(circuitUnitLabel("SERIES", 1)).toBe("série");
    expect(circuitUnitLabel("SERIES", 3)).toBe("séries");
    expect(circuitCountSpokenValue("TOURS", 4)).toBe("4 tours");
  });

  it("renders « Circuit », the duration (one line, tertiary) and the counter at rest", () => {
    renderHeader({ duration: "≈ 12 min", count: 3, nature: "SERIES" });

    expect(screen.getByTestId("header-title").props.children).toBe("Circuit");
    const duration = screen.getByTestId("header-duration");
    expect(duration.props.children).toBe("≈ 12 min");
    expect(duration.props.numberOfLines).toBe(1);
    expect(StyleSheet.flatten(duration.props.style).color).toBe(TEXT_TERTIARY);
    expect(screen.getByTestId("header-counter-value").props.children).toBe(3);
    expect(screen.getByTestId("header-counter-unit-text", anyNode).props.children).toBe("séries");
    expect(screen.queryByTestId("header-counter-stepper")).toBeNull();
  });

  it("touching the digit asks to reveal the stepper, never the nature choice", () => {
    const { onToggleCounter, onChangeCount, onOpenNatureMenu } = renderHeader();
    fireEvent.press(screen.getByTestId("header-counter-value-press"));
    expect(onToggleCounter).toHaveBeenCalledTimes(1);
    expect(onChangeCount).not.toHaveBeenCalled();
    expect(onOpenNatureMenu).not.toHaveBeenCalled();
  });

  describe("nature choice (PRE-6 story 3.2, CE-CIR-01)", () => {
    it("iOS: the pill is the trigger of a native SwiftUI Menu (two options, current checked, subtitle in the accessible name)", () =>
      withPlatform("ios", () => {
        const { onSelectNature, onToggleCounter } = renderHeader({ nature: "TOURS", count: 3 });
        const host = screen.getByTestId("header-counter-nature", anyNode);
        const menu = within(host).UNSAFE_getByType(Menu);
        expect(within(host).UNSAFE_getAllByType(RNHostView)).toHaveLength(1);
        // Pastille rendue dans le déclencheur, sans rôle propre.
        expect(within(host).getByTestId("header-counter-unit-text", anyNode).props.children).toBe("tours");
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
        expect(onToggleCounter).not.toHaveBeenCalled();
        // Le chiffre reste un réglage distinct.
        expect(screen.getByTestId("header-counter").props.accessibilityLabel).toBe("Nombre de tours");
      }));

    it("Android: the pill is a distinct button « Nature du circuit » (44 target) opening the choice", () =>
      withPlatform("android", () => {
        const { onOpenNatureMenu, onCloseNatureMenu, onToggleCounter, rerender } = renderHeader({ nature: "SERIES", count: 2 });
        const pill = screen.getByTestId("header-counter-nature");
        expect(pill.props.accessibilityRole).toBe("button");
        expect(pill.props.accessibilityLabel).toBe("Nature du circuit");
        expect(pill.props.accessibilityValue).toEqual({ text: "Circuit de séries" });
        expect(StyleSheet.flatten(pill.props.style)).toMatchObject({ minWidth: 44, minHeight: 44 });
        expect(screen.getByTestId("header-counter").props.accessibilityLabel).toBe("Nombre de séries");
        fireEvent.press(pill);
        expect(onOpenNatureMenu).toHaveBeenCalledTimes(1);
        expect(onToggleCounter).not.toHaveBeenCalled();
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

  it("at rest, VoiceOver increments / decrements within 1..99 and « activate » reveals", () => {
    const { onToggleCounter, onChangeCount } = renderHeader({ count: 5 });
    const counter = screen.getByTestId("header-counter");
    expect(counter.props.accessibilityLabel).toBe("Nombre de tours");
    expect(counter.props.accessibilityValue).toEqual({ min: 1, max: 99, now: 5, text: "5 tours" });

    accessibilityAction("header-counter", "increment");
    accessibilityAction("header-counter", "decrement");
    expect(onChangeCount.mock.calls).toEqual([[6], [4]]);
    accessibilityAction("header-counter", "activate");
    expect(onToggleCounter).toHaveBeenCalledTimes(1);
  });

  it("at 99, no increment is offered nor applied", () => {
    const { onChangeCount } = renderHeader({ count: 99 });
    const actions = (screen.getByTestId("header-counter").props.accessibilityActions as { name: string }[]).map(
      (action) => action.name,
    );
    expect(actions).toEqual(["decrement", "activate"]);
    accessibilityAction("header-counter", "increment");
    expect(onChangeCount).not.toHaveBeenCalled();
  });

  it("revealed: each step calls onChangeCount; touching the value or escaping closes", () => {
    const { onToggleCounter, onChangeCount } = renderHeader({ count: 2, isCounterOpen: true });

    const plus = screen.getByTestId("header-counter-stepper-increment");
    fireEvent(plus, "pressIn");
    fireEvent(plus, "pressOut");
    expect(onChangeCount).toHaveBeenLastCalledWith(3);

    fireEvent.press(screen.getByTestId("header-counter-stepper-value-press"));
    expect(onToggleCounter).toHaveBeenCalledTimes(1);
    fireEvent(screen.getByTestId("header-counter-field"), "accessibilityEscape");
    expect(onToggleCounter).toHaveBeenCalledTimes(2);
  });

  it("revealed: « Fermer » (closeField) and « activer » are offered by the focused adjustable itself and close", () => {
    const { onToggleCounter } = renderHeader({ count: 2, isCounterOpen: true });
    const stepper = screen.getByTestId("header-counter-stepper");
    const actions = stepper.props.accessibilityActions as { name: string; label?: string }[];
    expect(actions).toContainEqual({ name: "close", label: "Fermer" });
    expect(actions.map((action) => action.name)).toContain("activate");

    accessibilityAction("header-counter-stepper", "close");
    expect(onToggleCounter).toHaveBeenCalledTimes(1);
    accessibilityAction("header-counter-stepper", "activate");
    expect(onToggleCounter).toHaveBeenCalledTimes(2);
  });

  // Revue 5.2 (remplace « le titre ne rétrécit jamais ») : à court de place, la durée cède d'abord
  // (base 0, `flex: 1`), puis le titre (ellipse) ; l'œil et le compteur (stepper, pastille de nature)
  // ne rétrécissent jamais et ne quittent pas la ligne.
  it.each([false, true])("narrow widths (counter open: %s): the duration gives way first, then the title; the eye and the counter never shrink", (isCounterOpen) => {
    renderHeader({ isCounterOpen, duration: "≈ 1 h 12 min" });
    const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);
    // 1. La durée : aucune place réservée (base 0), elle ne prend que le reste et se tronque.
    expect(style("header-duration")).toMatchObject({ flex: 1, minWidth: 0 });
    expect(screen.getByTestId("header-duration").props.numberOfLines).toBe(1);
    // 2. Puis le titre : son bloc et lui cèdent jusqu'à 0, avec une ellipse.
    expect(style("header-text-block")).toMatchObject({ flexShrink: 1, minWidth: 0 });
    expect(style("header-title-row").minWidth).toBe(0);
    expect(style("header-title")).toMatchObject({ flexShrink: 1, minWidth: 0 });
    expect(screen.getByTestId("header-title").props.numberOfLines).toBe(1);
    // Jamais : l'œil, l'emplacement du compteur et le compteur lui-même.
    expect(style("header-volumes").flexShrink).toBe(0);
    expect(style("header-counter-slot").flexShrink).toBe(0);
    expect(style(isCounterOpen ? "header-counter-field" : "header-counter-rest").flexShrink).toBe(0);
    // Pas de retour à la ligne : une seule rangée, hauteur MINIMALE de 40 (Dynamic Type).
    expect(style("header")).toMatchObject({ flexDirection: "row", minHeight: 40 });
    expect(style("header").height).toBeUndefined();
    expect(style("header").flexWrap).toBeUndefined();
  });

  // Revue 5.2 : les cibles de l'œil et du compteur sont disjointes (un toucher sur le bord de l'œil
  // n'ouvre jamais le compteur) — rectangles calculés depuis les constantes et les styles rendus.
  it.each([false, true])("the eye and the counter touch targets never overlap (counter open: %s)", (isCounterOpen) => {
    renderHeader({ isCounterOpen });
    const g = CIRCUIT_HEADER_TOUCH_GEOMETRY;
    const eye = screen.getByTestId("header-volumes");
    expect(StyleSheet.flatten(eye.props.style).width).toBe(g.volumesSize);
    expect(eye.props.hitSlop).toBe(g.volumesHitSlop);
    const gap = StyleSheet.flatten(screen.getByTestId("header-counter-slot").props.style).marginLeft as number;
    // Repère : bord droit de l'œil = 0 ; le compteur commence à `gap`.
    const eyeTargetRight = g.volumesHitSlop;
    let counterTargetLeft: number;
    if (isCounterOpen) {
      const field = StyleSheet.flatten(screen.getByTestId("header-counter-field").props.style);
      expect(field.padding).toBe(g.openFieldPadding);
      const minus = screen.getByTestId("header-counter-stepper-decrement");
      expect(minus.props.hitSlop).toBe(g.stepHitSlop);
      counterTargetLeft = gap + g.openFieldPadding - g.stepHitSlop;
    } else {
      const digit = screen.getByTestId("header-counter-value-press");
      expect(digit.props.hitSlop).toEqual({ left: g.digitHitSlopLeft });
      expect(StyleSheet.flatten(digit.props.style).minWidth).toBe(g.digitMinWidth);
      counterTargetLeft = gap - g.digitHitSlopLeft;
    }
    expect(counterTargetLeft).toBeGreaterThanOrEqual(eyeTargetRight);
    // Au repos, le chiffre garde une cible de 44 de large.
    expect(g.digitMinWidth + g.digitHitSlopLeft).toBe(44);
  });

  // Revue 5.2 : la durée, affichée à droite, est lue juste après le titre (VoiceOver).
  it("VoiceOver reads the Circuit duration right after the title; the right-hand duration text is not a separate element", () => {
    renderHeader({ duration: "≈ 12 min" });
    expect(screen.getByTestId("header-title").props.accessibilityLabel).toBe("Circuit, ≈ 12 min");
    const duration = screen.getByTestId("header-duration");
    expect(duration.props.accessible).toBe(false);
    expect(duration.props.importantForAccessibility).toBe("no");
    expect(duration.props.children).toBe("≈ 12 min");
  });

  it("revealed: white field radius 18, surface circles, the counter never shrinks", () => {
    renderHeader({ isCounterOpen: true });
    const field = screen.getByTestId("header-counter-field");
    expect(StyleSheet.flatten(field.props.style)).toMatchObject({
      backgroundColor: colors.background,
      borderRadius: 18,
      flexShrink: 0,
    });
    expect(StyleSheet.flatten(screen.getByTestId("header-counter-stepper-decrement").props.style).backgroundColor).toBe(
      colors.surface,
    );
    // Stepper ajustable annonçant l'unité.
    expect(screen.getByTestId("header-counter-stepper").props.accessibilityValue).toMatchObject({ text: "1 tour" });
  });
});

describe("CircuitHeader — œil des volumes (PRE-6 story 3.4, CE-CIR-03)", () => {
  it("renders the eye between the title and the counter: DSF circle 32 (light fill, white rim, light shadow), icon 24, target 44", () => {
    renderHeader();
    const eye = screen.getByTestId("header-volumes");
    expect(eye.props.accessibilityRole).toBe("button");
    expect(eye.props.accessibilityLabel).toBe("Voir les volumes du circuit");
    expect(StyleSheet.flatten(eye.props.style)).toMatchObject({
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#FCFCFE",
      borderWidth: 1,
      borderColor: colors.background,
      shadowOpacity: 0.08,
      flexShrink: 0,
    });
    expect(eye.props.hitSlop).toBe(6);
    const icon = screen.getByTestId("header-volumes-icon", anyNode);
    expect(StyleSheet.flatten(icon.props.style)).toMatchObject({ width: 24, height: 24 });
  });

  // PRE-6 story 5.2 (D-435, `9819:19948`, choix D4) : une seule ligne de 40 — titre, œil, compteur,
  // puis la durée calée à droite (elle n'est plus sous le titre).
  it("sits on the title line, right after « Circuit »; story 5.2: the counter follows, the duration is right-aligned on the same line", () => {
    renderHeader({ duration: "≈ 1 h 12 min, durée très longue" });
    const titleRow = screen.getByTestId("header-title-row");
    expect(StyleSheet.flatten(titleRow.props.style)).toMatchObject({ flexDirection: "row", alignItems: "center" });
    // Ligne du titre : « Circuit » puis l'œil, rien d'autre (ni durée, ni compteur).
    const children = (titleRow.props.children as { props: { testID: string } }[]).flat();
    expect(children.map((child) => child.props.testID)).toEqual(["header-title", "header-volumes"]);
    expect(within(titleRow).queryByTestId("header-duration")).toBeNull();
    expect(within(titleRow).queryByTestId("header-counter-rest")).toBeNull();
    // Ligne de l'en-tête : bloc du titre, compteur, durée (calée à droite, seule à se tronquer).
    const header = screen.getByTestId("header");
    expect(StyleSheet.flatten(header.props.style)).toMatchObject({ minHeight: 40, flexDirection: "row", alignItems: "center" });
    const rowChildren = (header.props.children as ({ props: { testID: string } } | null)[])
      .flat()
      .filter((child): child is { props: { testID: string } } => child !== null);
    expect(rowChildren.map((child) => child.props.testID)).toEqual([
      "header-text-block",
      "header-counter-slot",
      "header-duration",
    ]);
    expect(StyleSheet.flatten(screen.getByTestId("header-duration").props.style)).toMatchObject({
      flex: 1,
      minWidth: 0,
      textAlign: "right",
    });
    // L'œil (32) déborde de la ligne (19) sans en changer la hauteur : marges -6,5.
    expect(StyleSheet.flatten(screen.getByTestId("header-volumes").props.style).marginVertical).toBe(-6.5);
  });

  it.each(["TOURS", "SERIES"] as const)("is present in %s, counter at rest or revealed, and asks to open the volumes", (nature) => {
    const { onOpenVolumes, onToggleCounter, onOpenNatureMenu, rerender } = renderHeader({ nature });
    fireEvent.press(screen.getByTestId("header-volumes"));
    expect(onOpenVolumes).toHaveBeenCalledTimes(1);
    expect(onToggleCounter).not.toHaveBeenCalled();
    expect(onOpenNatureMenu).not.toHaveBeenCalled();
    rerender({ isCounterOpen: true });
    expect(screen.getByTestId("header-volumes")).toBeTruthy();
  });

  it("gives the focus back to the eye on a focus request, never on mount", () => {
    const spy = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
    spy.mockClear();
    try {
      const { rerender } = renderHeader();
      expect(spy).not.toHaveBeenCalled();
      act(() => rerender({ volumesFocusRequest: 1 }));
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.anything(), "focus");
    } finally {
      spy.mockRestore();
    }
  });
});
