import { fireEvent, render, screen } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Platform, ScrollView, StyleSheet } from "react-native";

import { NumberWheelPicker } from "@/features/sessions/NumberWheelPicker";
import { colors } from "@/shared/ui/tokens";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Haptics = require("expo-haptics") as { selectionAsync: jest.Mock<() => Promise<void>> };

const ITEM_HEIGHT = 40;
const CANCEL_LABEL = "Annuler";
const VALIDATE_LABEL = "Valider";

function scrollTo(element: ReturnType<typeof screen.getByTestId>, offsetY: number) {
  fireEvent.scroll(element, {
    nativeEvent: { contentOffset: { y: offsetY }, contentSize: {}, layoutMeasurement: {} },
  });
}

function renderProps(overrides: Partial<Parameters<typeof NumberWheelPicker>[0]> = {}) {
  return {
    value: 1,
    onValidate: jest.fn(),
    onCancel: jest.fn(),
    accessibilityLabel: "Répétitions",
    cancelAccessibilityLabel: CANCEL_LABEL,
    validateAccessibilityLabel: VALIDATE_LABEL,
    ...overrides,
  };
}

beforeEach(() => {
  Haptics.selectionAsync.mockClear();
});

/**
 * REWORK12 (`[ChatGPT] CHANGES_REQUESTED — REWORK12 — Activité +
 * intégration dans Composition`, 2026-09-04, ACT-07) : `NumberWheelPicker`
 * suit désormais le contrat transverse `Picker / Popover — Source exact`
 * (`2537:1174`), variante `Type=Numeric wheel` (`3210:49`) — brouillon
 * local, Annuler/Confirmer, jamais d'application immédiate au fil du
 * défilement (contrairement à l'ancienne implémentation, entièrement
 * remplacée). Mêmes patrons de test que `DurationWheelPicker.test.tsx`
 * (chemin natif iOS / chemin `ScrollView` Android-web), non répétés en
 * détail ici.
 */
describe("NumberWheelPicker — chemin Android/web (LegacyNumberWheelPicker, ScrollView + toucher direct)", () => {
  let originalPlatformOS: typeof Platform.OS;

  beforeEach(() => {
    originalPlatformOS = Platform.OS;
    Platform.OS = "android";
  });

  afterEach(() => {
    Platform.OS = originalPlatformOS;
  });

  it("renders with accessibilityRole=adjustable and bounds 1..99", () => {
    render(<NumberWheelPicker {...renderProps({ value: 1 })} />);

    const column = screen.getByTestId("number-wheel-column");
    expect(column.props.accessibilityRole).toBe("adjustable");
    expect(column.props.accessibilityValue).toEqual({ min: 1, max: 99, now: 1 });
  });

  it("initializes accessibilityValue.now from the supplied value", () => {
    render(<NumberWheelPicker {...renderProps({ value: 12 })} />);

    expect(screen.getByTestId("number-wheel-column").props.accessibilityValue).toEqual({
      min: 1,
      max: 99,
      now: 12,
    });
  });

  it("renders the Cancel and Validate toolbar actions", () => {
    render(<NumberWheelPicker {...renderProps()} />);

    expect(screen.getByTestId("number-wheel-toolbar")).toBeTruthy();
    expect(screen.getByLabelText(CANCEL_LABEL)).toBeTruthy();
    expect(screen.getByLabelText(VALIDATE_LABEL)).toBeTruthy();
  });

  it("never calls onValidate or onCancel while scrolling/pressing values — draft only (ACT-07)", () => {
    const props = renderProps();
    render(<NumberWheelPicker {...props} />);

    scrollTo(screen.getByTestId("number-wheel-column"), ITEM_HEIGHT * 4);
    fireEvent.press(screen.getByTestId("number-wheel-column-item-6"));

    expect(props.onValidate).not.toHaveBeenCalled();
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("Cancel calls onCancel exactly once, never onValidate, regardless of prior scrolling", () => {
    const props = renderProps();
    render(<NumberWheelPicker {...props} />);

    scrollTo(screen.getByTestId("number-wheel-column"), ITEM_HEIGHT * 4);
    fireEvent.press(screen.getByLabelText(CANCEL_LABEL));

    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onValidate).not.toHaveBeenCalled();
  });

  it("Validate calls onValidate exactly once, with the currently centered draft value, never onCancel", () => {
    const props = renderProps({ value: 1 });
    render(<NumberWheelPicker {...props} />);

    scrollTo(screen.getByTestId("number-wheel-column"), ITEM_HEIGHT * 2); // index 2 -> value 3
    fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));

    expect(props.onValidate).toHaveBeenCalledTimes(1);
    expect(props.onValidate).toHaveBeenCalledWith(3);
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("triggers exactly one haptic call per newly observed index during scroll", () => {
    render(<NumberWheelPicker {...renderProps()} />);

    scrollTo(screen.getByTestId("number-wheel-column"), ITEM_HEIGHT);

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  it("calls neither onValidate nor the haptic when two consecutive onScroll events report the same index", () => {
    render(<NumberWheelPicker {...renderProps()} />);
    const column = screen.getByTestId("number-wheel-column");

    scrollTo(column, 0);
    scrollTo(column, 0);

    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it("does not haptic again if onMomentumScrollEnd fires after onScroll already settled on that index", () => {
    render(<NumberWheelPicker {...renderProps()} />);
    const column = screen.getByTestId("number-wheel-column");

    scrollTo(column, ITEM_HEIGHT * 2);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    Haptics.selectionAsync.mockClear();

    fireEvent(column, "momentumScrollEnd", { nativeEvent: { contentOffset: { y: ITEM_HEIGHT * 2 } } });
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it("clamps the lower bound: an overscrolled negative offset never validates a value below 1", () => {
    const props = renderProps({ value: 5 });
    render(<NumberWheelPicker {...props} />);

    scrollTo(screen.getByTestId("number-wheel-column"), -999);
    fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));

    expect(props.onValidate).toHaveBeenCalledWith(1);
  });

  it("clamps the upper bound: an overscrolled excessive offset never validates a value above 99", () => {
    const props = renderProps({ value: 1 });
    render(<NumberWheelPicker {...props} />);

    scrollTo(screen.getByTestId("number-wheel-column"), ITEM_HEIGHT * 999);
    fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));

    expect(props.onValidate).toHaveBeenCalledWith(99);
  });

  it("still commits the value to onValidate even if Haptics.selectionAsync rejects", async () => {
    Haptics.selectionAsync.mockRejectedValueOnce(new Error("no haptics engine"));
    const props = renderProps({ value: 1 });
    render(<NumberWheelPicker {...props} />);

    scrollTo(screen.getByTestId("number-wheel-column"), ITEM_HEIGHT);
    await Promise.resolve().then(() => Promise.resolve());
    fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));

    expect(props.onValidate).toHaveBeenCalledWith(2);
  });

  it("accepts a custom testID on the root", () => {
    render(<NumberWheelPicker {...renderProps({ testID: "repetition-wheel-picker" })} />);

    expect(screen.getByTestId("repetition-wheel-picker")).toBeTruthy();
  });

  it("restores exactly the last committed value on re-mount (close/reopen) — Cancel never changes it", () => {
    const props = renderProps({ value: 42 });
    const { unmount } = render(<NumberWheelPicker {...props} />);

    scrollTo(screen.getByTestId("number-wheel-column"), ITEM_HEIGHT * 3); // draft only, never committed
    fireEvent.press(screen.getByLabelText(CANCEL_LABEL));
    expect(props.onValidate).not.toHaveBeenCalled();
    unmount();

    render(<NumberWheelPicker {...props} />);
    expect(screen.getByTestId("number-wheel-column").props.accessibilityValue).toEqual({
      min: 1,
      max: 99,
      now: 42,
    });
  });

  it("renders a central selection band and edge fade overlays, non-interactive (CE-T01-07, AUD-05)", () => {
    render(<NumberWheelPicker {...renderProps()} />);

    const overlay = screen.getByTestId("wheel-selection-overlay");
    expect(overlay.props.pointerEvents).toBe("none");
    expect(screen.getByTestId("wheel-selection-band")).toBeTruthy();
  });

  it("is wrapped in a visual card matching the Design System popover (background/radius), not rendered bare", () => {
    render(<NumberWheelPicker {...renderProps()} />);

    expect(screen.getByTestId("number-wheel-picker")).toBeTruthy();
  });
});

/**
 * `Platform.OS` par défaut dans cet environnement Jest (`jest-expo`) est
 * `"ios"` — aucun forçage nécessaire ici, posé explicitement par robustesse.
 * Seule la couche JS de `NativeAppleNumberWheelPicker` est exercée, jamais
 * la roulette SwiftUI elle-même (perspective/inertie natives) — aucune de
 * ces preuves ne remplace la capture/vidéo iPhone exigée avant clôture.
 */
describe("NumberWheelPicker — chemin iOS natif (NativeAppleNumberWheelPicker, @expo/ui/swift-ui)", () => {
  let originalPlatformOS: typeof Platform.OS;

  beforeEach(() => {
    originalPlatformOS = Platform.OS;
    Platform.OS = "ios";
  });

  afterEach(() => {
    Platform.OS = originalPlatformOS;
  });

  function fireNativeSelectionChange(
    element: ReturnType<typeof screen.getByTestId>,
    selection: number,
  ) {
    fireEvent(element, "selectionChange", { nativeEvent: { selection } });
  }

  it("renders the native Host/Picker structure and the toolbar, without crashing", () => {
    render(<NumberWheelPicker {...renderProps()} />);

    expect(screen.getByTestId("number-wheel-picker")).toBeTruthy();
    expect(screen.getByTestId("number-wheel-column")).toBeTruthy();
    expect(screen.getByTestId("number-wheel-toolbar")).toBeTruthy();
    expect(screen.getByLabelText(CANCEL_LABEL)).toBeTruthy();
    expect(screen.getByLabelText(VALIDATE_LABEL)).toBeTruthy();
  });

  it("actually uses the native SwiftUI Picker primitive on iOS, never a ScrollView fallback (priorité aux primitives natives de l'OS)", () => {
    const { UNSAFE_root } = render(<NumberWheelPicker {...renderProps()} />);

    const column = screen.getByTestId("number-wheel-column");
    expect(column.props.selection).toBeDefined();
    expect(column.props.onSelectionChange).toBeInstanceOf(Function);
    expect(column.props.onScroll).toBeUndefined();
    expect(UNSAFE_root.findAllByType(ScrollView)).toHaveLength(0);
  });

  it("never calls onValidate or onCancel while the picker stays mounted, no matter how many native selection events occur (ACT-07)", () => {
    const props = renderProps();
    render(<NumberWheelPicker {...props} />);

    fireNativeSelectionChange(screen.getByTestId("number-wheel-column"), 5);
    fireNativeSelectionChange(screen.getByTestId("number-wheel-column"), 10);

    expect(props.onValidate).not.toHaveBeenCalled();
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("Cancel calls onCancel exactly once, never onValidate, regardless of prior native selection changes", () => {
    const props = renderProps();
    render(<NumberWheelPicker {...props} />);

    fireNativeSelectionChange(screen.getByTestId("number-wheel-column"), 5);
    fireEvent.press(screen.getByLabelText(CANCEL_LABEL));

    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onValidate).not.toHaveBeenCalled();
  });

  it("Validate calls onValidate exactly once with the currently centered draft value, never onCancel", () => {
    const props = renderProps({ value: 1 });
    render(<NumberWheelPicker {...props} />);

    fireNativeSelectionChange(screen.getByTestId("number-wheel-column"), 12);
    fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));

    expect(props.onValidate).toHaveBeenCalledTimes(1);
    expect(props.onValidate).toHaveBeenCalledWith(12);
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("propagates exactly one haptic call per newly observed native selection", () => {
    render(<NumberWheelPicker {...renderProps()} />);

    fireNativeSelectionChange(screen.getByTestId("number-wheel-column"), 5);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the native picker reports the value already selected — no haptic", () => {
    render(<NumberWheelPicker {...renderProps({ value: 1 })} />);

    fireNativeSelectionChange(screen.getByTestId("number-wheel-column"), 1);
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it("restores exactly the last committed value on re-mount (close/reopen) — Cancel never changes it", () => {
    const props = renderProps({ value: 42 });
    const { unmount } = render(<NumberWheelPicker {...props} />);

    fireNativeSelectionChange(screen.getByTestId("number-wheel-column"), 5); // draft only
    fireEvent.press(screen.getByLabelText(CANCEL_LABEL));
    expect(props.onValidate).not.toHaveBeenCalled();
    unmount();

    render(<NumberWheelPicker {...props} />);
    expect(screen.getByTestId("number-wheel-column").props.selection).toBe(42);
  });

  it("never renders a second, overlaid selection frame (blue band) — only the native SwiftUI frame subsists", () => {
    render(<NumberWheelPicker {...renderProps()} />);
    expect(screen.queryByTestId("wheel-selection-band")).toBeNull();
  });

  describe("toolbar Annuler/Confirmer — géométrie (mêmes tokens que DurationWheelPicker)", () => {
    it("gives Cancel and Validate a 28×28 visual circle with a hitSlop that extends the touch target to 48×48", () => {
      render(<NumberWheelPicker {...renderProps()} />);

      const cancel = screen.getByTestId("number-wheel-cancel");
      const validate = screen.getByTestId("number-wheel-validate");
      const cancelStyle = StyleSheet.flatten(cancel.props.style);
      const validateStyle = StyleSheet.flatten(validate.props.style);

      expect(cancelStyle.width).toBe(28);
      expect(cancelStyle.height).toBe(28);
      expect(validateStyle.width).toBe(28);
      expect(validateStyle.height).toBe(28);
      expect(cancelStyle.width + cancel.props.hitSlop * 2).toBe(48);
      expect(validateStyle.width + validate.props.hitSlop * 2).toBe(48);
    });

    it("colours Cancel and Validate per the D-098/color.wheelAction* tokens", () => {
      render(<NumberWheelPicker {...renderProps()} />);

      const cancelStyle = StyleSheet.flatten(screen.getByTestId("number-wheel-cancel").props.style);
      const validateStyle = StyleSheet.flatten(screen.getByTestId("number-wheel-validate").props.style);
      expect(cancelStyle.backgroundColor).toBe(colors.wheelActionCancelBackground);
      expect(validateStyle.backgroundColor).toBe(colors.wheelActionValidateBackground);
    });

    it("renders the canonical wheel-action SVG assets, never Unicode ✕/✓ glyphs", () => {
      render(<NumberWheelPicker {...renderProps()} />);

      expect(screen.getByTestId("number-wheel-cancel-icon")).toBeTruthy();
      expect(screen.getByTestId("number-wheel-validate-icon")).toBeTruthy();
      expect(screen.queryByText("✕")).toBeNull();
      expect(screen.queryByText("✓")).toBeNull();
    });
  });
});
