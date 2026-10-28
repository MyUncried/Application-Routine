import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Dimensions, Keyboard, Platform, StyleSheet, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  FINAL_ACTION_GRADIENT,
  finalActionBottomMargin,
  finalActionContentPadding,
  finalActionSideMargin,
  finalActionVerticalPadding,
  finalActionZoneHeight,
} from "@/shared/ui/finalAction";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-6 story 7.10 (D-444) : zone d'action principale fixe et bouton au format `Terminer`.
 */
function withInsets(bottom: number, width: number, children: React.ReactNode) {
  return (
    <SafeAreaProvider
      initialMetrics={{ frame: { x: 0, y: 0, width, height: 874 }, insets: { top: 47, left: 0, right: 0, bottom } }}
    >
      {children}
    </SafeAreaProvider>
  );
}

function Probe({ onPress, disabled = false }: { onPress: () => void; disabled?: boolean }) {
  const zone = usePrimaryActionZone();
  return (
    <>
      <Text testID="reserve">{zone.scrollReserve}</Text>
      <PrimaryActionZone onContentHeightChange={zone.onContentHeightChange} testID="zone">
        <PrimaryActionButton label="Terminer" onPress={onPress} disabled={disabled} testID="action" labelTestID="action-label" />
      </PrimaryActionZone>
    </>
  );
}

const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);

describe("finalAction — règles de la zone (D-444)", () => {
  it("bottom margin: inset + 8 when a safe area exists, 16 otherwise", () => {
    expect(finalActionBottomMargin(34)).toBe(42);
    expect(finalActionBottomMargin(21)).toBe(29);
    expect(finalActionBottomMargin(0)).toBe(16);
  });

  it("correctif J6f — the button is centred in the protected zone: equal padding above and below, zone height kept", () => {
    expect(finalActionVerticalPadding(34)).toBe(33);
    expect(finalActionVerticalPadding(0)).toBe(20);
    expect(finalActionVerticalPadding(48)).toBe(40);
    for (const inset of [0, 21, 34, 48]) {
      expect(2 * finalActionVerticalPadding(inset) + 48).toBe(finalActionZoneHeight(inset));
    }
    // iPhone : bas du bouton à 33 du bord, 1 point dans l'encart de 34 (accepté, D-444).
    expect(34 - finalActionVerticalPadding(34)).toBe(1);
    expect(finalActionContentPadding("ios", 34)).toEqual({ top: 33, bottom: 33 });
    expect(finalActionContentPadding("ios", 0)).toEqual({ top: 20, bottom: 20 });
    // Android, barre de navigation à boutons (48) : jamais sous l'encart ; hauteur conservée.
    expect(finalActionContentPadding("android", 48)).toEqual({ top: 32, bottom: 48 });
    expect(finalActionContentPadding("android", 24)).toEqual({ top: 28, bottom: 28 });
  });

  it("zone height = 24 above + content (48 by default) + bottom margin", () => {
    expect(finalActionZoneHeight(34)).toBe(114);
    expect(finalActionZoneHeight(0)).toBe(88);
    expect(finalActionZoneHeight(34, 80)).toBe(146);
  });

  // Recette PRE-8 A/B (A01, arbitrage du 27/10) : marge standard unique de 16 à toutes les largeurs
  // (auparavant 24 à partir de 390, 16 en dessous).
  it("side margins of « Terminer »: the standard gutter (16) at every width", () => {
    expect([360, 375, 389, 390, 402, 440].map(finalActionSideMargin)).toEqual([16, 16, 16, 16, 16, 16]);
  });

  it("gradient: the screen white, transparent at the top to opaque at the bottom", () => {
    expect(colors.background).toBe("#FFFFFF");
    expect(FINAL_ACTION_GRADIENT).toBe("linear-gradient(to bottom, #FFFFFF00 0%, #FFFFFF 100%)");
  });
});

describe("PrimaryActionZone", () => {
  it("is fixed at the bottom, full width, above the safe area, with the gradient over the whole zone; touches pass through", () => {
    render(withInsets(34, 402, <Probe onPress={jest.fn()} />));
    expect(style("zone")).toMatchObject({
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      // Correctif J6f : centré dans la zone de 114 — 33 au-dessus, 33 au-dessous.
      paddingTop: 33,
      paddingBottom: 33,
    });
    expect(screen.getByTestId("zone").props.pointerEvents).toBe("box-none");
    expect(screen.getByTestId("zone-content").props.pointerEvents).toBe("box-none");
    expect(screen.getByTestId("zone-gradient").props.pointerEvents).toBe("none");
    expect(style("zone-gradient")).toMatchObject({
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      experimental_backgroundImage: FINAL_ACTION_GRADIENT,
    });
  });

  it("without inset: zone 88, button centred (20 / 20); side margins follow the window width (rule of « Terminer »)", () => {
    render(withInsets(0, 375, <Probe onPress={jest.fn()} />));
    expect(style("zone")).toMatchObject({ paddingHorizontal: finalActionSideMargin(Dimensions.get("window").width), paddingTop: 20, paddingBottom: 20 });
    expect(screen.getByTestId("reserve").props.children).toBe(88);
  });

  it("scroll reserve follows the measured content (an error message above the button)", () => {
    render(withInsets(34, 402, <Probe onPress={jest.fn()} />));
    expect(screen.getByTestId("reserve").props.children).toBe(114);
    act(() => {
      fireEvent(screen.getByTestId("zone-content"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 354, height: 80 } } });
    });
    expect(screen.getByTestId("reserve").props.children).toBe(146);
  });

  it("hidden: no touch and hidden from accessibility", () => {
    render(
      withInsets(
        34,
        402,
        <PrimaryActionZone hidden testID="zone">
          <Text>x</Text>
        </PrimaryActionZone>,
      ),
    );
    const zone = screen.getByTestId("zone", { includeHiddenElements: true });
    expect(zone.props.pointerEvents).toBe("none");
    expect(zone.props.accessibilityElementsHidden).toBe(true);
    expect(zone.props.importantForAccessibility).toBe("no-hide-descendants");
  });
});

describe("PrimaryActionZone — clavier (revue 7.10)", () => {
  type Listener = () => void;
  function captureKeyboard() {
    const listeners: Record<string, Listener> = {};
    const spy = jest.spyOn(Keyboard, "addListener").mockImplementation(((event: string, listener: Listener) => {
      listeners[event] = listener;
      return { remove: jest.fn() } as unknown as ReturnType<typeof Keyboard.addListener>;
    }) as unknown as typeof Keyboard.addListener);
    return { listeners, spy };
  }

  it("Android: hidden (no touch, not read, transparent) while the keyboard is shown, back when it hides", () => {
    const os = jest.replaceProperty(Platform, "OS", "android");
    const { listeners, spy } = captureKeyboard();
    try {
      render(withInsets(34, 402, <Probe onPress={jest.fn()} />));
      const zone = () => screen.getByTestId("zone", { includeHiddenElements: true });
      expect(zone().props.pointerEvents).toBe("box-none");
      act(() => listeners.keyboardDidShow?.());
      expect(zone().props.pointerEvents).toBe("none");
      expect(zone().props.accessibilityElementsHidden).toBe(true);
      expect(StyleSheet.flatten(zone().props.style).opacity).toBe(0);
      act(() => listeners.keyboardDidHide?.());
      expect(zone().props.pointerEvents).toBe("box-none");
      expect(StyleSheet.flatten(zone().props.style).opacity).toBeUndefined();
    } finally {
      spy.mockRestore();
      os.restore();
    }
  });

  it("iOS: no keyboard listener, the zone stays (under the keyboard)", () => {
    const { spy } = captureKeyboard();
    try {
      render(withInsets(34, 402, <Probe onPress={jest.fn()} />));
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});

describe("PrimaryActionButton", () => {
  it("format of « Terminer »: 48, radius 24, shadow G-8, primary; disabled: grey, no press; accessible button named after its label", () => {
    const onPress = jest.fn();
    const view = render(withInsets(34, 402, <Probe onPress={onPress} />));
    expect(style("action")).toMatchObject({
      minHeight: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      shadowColor: "#1A1A26",
      shadowOpacity: 0.18,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 10,
      elevation: 3,
    });
    expect(style("action-label")).toMatchObject({ color: colors.background, fontSize: 14 });
    const action = screen.getByTestId("action");
    expect(action.props.accessibilityRole).toBe("button");
    expect(action.props.accessibilityLabel).toBe("Terminer");
    fireEvent.press(action);
    expect(onPress).toHaveBeenCalledTimes(1);
    view.unmount();

    render(withInsets(34, 402, <Probe onPress={onPress} disabled />));
    expect(style("action")).toMatchObject({ backgroundColor: colors.disabled, shadowColor: "#1A1A26" });
    expect(screen.getByTestId("action").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("action"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
