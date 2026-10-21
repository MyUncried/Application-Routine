import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { Dimensions, StyleSheet } from "react-native";

import { PlacementBar } from "@/features/sessions/PlacementBar";
import { REMOVAL_BUBBLE_HEIGHT, RemovalBubble, type RemovalBubbleAnchor } from "@/features/sessions/RemovalBubble";
import { STOP_POINT_CHIP_HEIGHT, STOP_POINT_CHIP_TOUCH_EXTENT, StopPointChip } from "@/features/sessions/StopPointChip";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

const pauses = strings.screens.composition.pauses;
const BUBBLE = "composition-removal-bubble";
const ANCHOR: RemovalBubbleAnchor = { x: 74, y: 480, width: 120, height: 13 };

function renderWithInsets(element: ReactElement) {
  return render(<TestSafeAreaProvider>{element}</TestSafeAreaProvider>);
}

/** PRE-6 story 4.2 (`8328:29133`, `8328:33689`) : bulle « Retirer ». */
describe("RemovalBubble (PRE-6 story 4.2)", () => {
  const bubble = () => screen.getByTestId(`${BUBBLE}-remove`);
  const bubbleStyle = () => StyleSheet.flatten(bubble().props.style);
  const layout = (width: number) => fireEvent(bubble(), "layout", { nativeEvent: { layout: { x: 0, y: 0, width, height: 31 } } });

  it("recovery: red pill « Retirer la récupération » with the white hourglass, 31 high", () => {
    renderWithInsets(<RemovalBubble kind="RECOVERY" anchor={ANCHOR} onRemove={jest.fn()} onDismiss={jest.fn()} />);
    expect(bubble().props.accessibilityRole).toBe("button");
    expect(bubble().props.accessibilityLabel).toBe(pauses.removeRecovery);
    expect(screen.getByTestId(`${BUBBLE}-icon`)).toBeTruthy();
    expect(REMOVAL_BUBBLE_HEIGHT).toBe(31);
    expect(bubbleStyle()).toMatchObject({ backgroundColor: colors.danger, borderRadius: 12, height: 31 });
    expect(StyleSheet.flatten(within(bubble()).getByText(pauses.removeRecovery).props.style)).toMatchObject({
      fontSize: 12,
      fontWeight: "500",
      color: colors.background,
    });
  });

  it("stop point: « Retirer le point d’arrêt » with the white ❚❚ symbol", () => {
    renderWithInsets(<RemovalBubble kind="STOP_POINT" anchor={ANCHOR} onRemove={jest.fn()} onDismiss={jest.fn()} />);
    expect(bubble().props.accessibilityLabel).toBe(pauses.removeStopPoint);
    expect(screen.queryByTestId(`${BUBBLE}-icon`)).toBeNull();
  });

  it("stays invisible until its width is known, then sits right above the anchor", () => {
    renderWithInsets(<RemovalBubble kind="RECOVERY" anchor={ANCHOR} onRemove={jest.fn()} onDismiss={jest.fn()} />);
    expect(bubbleStyle().opacity).toBe(0);
    layout(172);
    // Sablier de la bulle (12 du bord) sur celui de la ligne ; bas de la bulle sur le haut de l'ancre.
    expect(bubbleStyle()).toMatchObject({ left: 62, top: 480 - 31 });
    expect(bubbleStyle().opacity).toBeUndefined();
  });

  it("stop point: right edge on the chip's right edge", () => {
    renderWithInsets(<RemovalBubble kind="STOP_POINT" anchor={ANCHOR} onRemove={jest.fn()} onDismiss={jest.fn()} />);
    layout(166);
    expect(bubbleStyle()).toMatchObject({ left: 74 + 120 - 166, top: 480 - 31 });
  });

  it("goes below the anchor when there is no room above it", () => {
    renderWithInsets(
      <RemovalBubble kind="RECOVERY" anchor={{ x: 74, y: 20, width: 120, height: 13 }} onRemove={jest.fn()} onDismiss={jest.fn()} />,
    );
    layout(172);
    expect(bubbleStyle().top).toBe(20 + 13);
  });

  it("is clamped horizontally on both edges, for both kinds", () => {
    const { width } = Dimensions.get("window");
    const view = renderWithInsets(
      <RemovalBubble kind="RECOVERY" anchor={{ x: width - 20, y: 480, width: 10, height: 13 }} onRemove={jest.fn()} onDismiss={jest.fn()} />,
    );
    layout(172);
    expect(bubbleStyle().left).toBe(width - 8 - 172);
    view.unmount();
    renderWithInsets(
      <RemovalBubble kind="STOP_POINT" anchor={{ x: 0, y: 480, width: 40, height: 22 }} onRemove={jest.fn()} onDismiss={jest.fn()} />,
    );
    layout(166);
    expect(bubbleStyle().left).toBe(8);
  });

  it("Retirer calls onRemove; the backdrop, the system back and the VoiceOver escape only dismiss", () => {
    const onRemove = jest.fn();
    const onDismiss = jest.fn();
    renderWithInsets(<RemovalBubble kind="RECOVERY" anchor={ANCHOR} onRemove={onRemove} onDismiss={onDismiss} />);
    fireEvent.press(screen.getByTestId(`${BUBBLE}-backdrop`));
    fireEvent(screen.getByTestId(BUBBLE), "requestClose");
    fireEvent(bubble(), "accessibilityEscape");
    expect(onDismiss).toHaveBeenCalledTimes(3);
    expect(onRemove).not.toHaveBeenCalled();
    fireEvent.press(bubble());
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

/** PRE-6 story 4.2 (`8328:29428`) : puce « Point d'arrêt » hors placement. */
describe("StopPointChip (PRE-6 story 4.2)", () => {
  it("is a 22-high chip whose slop stays within its line; long press and « Retirer » action are wired", () => {
    const onLongPress = jest.fn();
    const onRemove = jest.fn();
    render(<StopPointChip accessibilityLabel="Point d’arrêt après A" onLongPress={onLongPress} onRemove={onRemove} testID="chip" />);
    const chip = screen.getByTestId("chip");
    expect(STOP_POINT_CHIP_HEIGHT).toBe(22);
    // Ligne de 30 (marges 4 / 4) : la cible ne déborde pas sur la carte au-dessus.
    // Revue 5.3 : cible réelle (boîte de 30, marges négatives de 4 : la ligne garde 22), sans hitSlop.
    expect(chip.props.hitSlop).toBeUndefined();
    expect(StyleSheet.flatten(chip.props.style)).toMatchObject({
      height: STOP_POINT_CHIP_HEIGHT + 2 * STOP_POINT_CHIP_TOUCH_EXTENT,
      marginVertical: -STOP_POINT_CHIP_TOUCH_EXTENT,
    });
    expect(STOP_POINT_CHIP_HEIGHT + 2 * STOP_POINT_CHIP_TOUCH_EXTENT).toBe(30);
    fireEvent(chip, "longPress");
    expect(onLongPress).toHaveBeenCalledTimes(1);
    fireEvent(chip, "accessibilityAction", { nativeEvent: { actionName: "other" } });
    expect(onRemove).not.toHaveBeenCalled();
    fireEvent(chip, "accessibilityAction", { nativeEvent: { actionName: "remove" } });
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

/** PRE-6 story 4.2 : « Confirmer » disponible pour une modification seule (N = 0). */
describe("PlacementBar canConfirm (PRE-6 story 4.2)", () => {
  it("keeps the N label but enables Confirmer when canConfirm is set", () => {
    const onConfirm = jest.fn();
    render(<PlacementBar count={0} canConfirm onConfirm={onConfirm} onCancel={jest.fn()} />);
    const confirm = screen.getByTestId("composition-placement-bar-confirm");
    expect(confirm.props.accessibilityLabel).toBe("Confirmer 0 pause ajoutée");
    expect(confirm.props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
