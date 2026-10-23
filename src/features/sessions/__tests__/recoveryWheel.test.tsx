import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Platform } from "react-native";

import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import {
  RECOVERY_WHEEL_VALUES,
  gridMinutesValues,
  gridSecondsValues,
  snapGridSeconds,
  snapToGrid,
} from "@/features/sessions/wheelPickerMath";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

/**
 * PRE-6 story 4.1 (CE-T03-08 §14, E12, `8328:28733`) : roulette « Durée de récupération »,
 * 0..300 s, grille de 1 s jusqu'à 5, de 5 s jusqu'à 120, de 30 s jusqu'à 300.
 */
describe("RECOVERY_WHEEL_VALUES and grid helpers (PRE-6 story 4.1)", () => {
  it("lists 0..5 by 1 s, 10..120 by 5 s, 150..300 by 30 s", () => {
    expect(RECOVERY_WHEEL_VALUES).toEqual([
      0, 1, 2, 3, 4, 5,
      10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120,
      150, 180, 210, 240, 270, 300,
    ]);
  });

  it("splits the grid into minutes and per-minute seconds", () => {
    expect(gridMinutesValues(RECOVERY_WHEEL_VALUES)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(gridSecondsValues(RECOVERY_WHEEL_VALUES, 0)).toEqual([0, 1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    expect(gridSecondsValues(RECOVERY_WHEEL_VALUES, 1)).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    expect(gridSecondsValues(RECOVERY_WHEEL_VALUES, 2)).toEqual([0, 30]);
    expect(gridSecondsValues(RECOVERY_WHEEL_VALUES, 4)).toEqual([0, 30]);
    expect(gridSecondsValues(RECOVERY_WHEEL_VALUES, 5)).toEqual([0]);
  });

  it("snaps to the nearest grid value (ties: the larger)", () => {
    expect(snapToGrid(30, RECOVERY_WHEEL_VALUES)).toBe(30);
    expect(snapToGrid(7, RECOVERY_WHEEL_VALUES)).toBe(5);
    expect(snapToGrid(8, RECOVERY_WHEEL_VALUES)).toBe(10);
    expect(snapToGrid(135, RECOVERY_WHEEL_VALUES)).toBe(150);
    expect(snapToGrid(999, RECOVERY_WHEEL_VALUES)).toBe(300);
    expect(snapGridSeconds(45, 2, RECOVERY_WHEEL_VALUES)).toBe(30);
    expect(snapGridSeconds(45, 5, RECOVERY_WHEEL_VALUES)).toBe(0);
    expect(snapToGrid(10, [])).toBe(0);
  });
});

function props(overrides: Partial<Parameters<typeof DurationWheelPicker>[0]> = {}) {
  return {
    totalSeconds: 30,
    valueGrid: RECOVERY_WHEEL_VALUES,
    title: "Durée de récupération",
    onValidate: jest.fn(),
    onCancel: jest.fn(),
    minutesAccessibilityLabel: "Minutes",
    secondsAccessibilityLabel: "Secondes",
    cancelAccessibilityLabel: "Annuler",
    validateAccessibilityLabel: "Valider",
    ...overrides,
  } as Parameters<typeof DurationWheelPicker>[0] & { onValidate: jest.Mock; onCancel: jest.Mock };
}

describe("DurationWheelPicker — valueGrid and title (PRE-6 story 4.1)", () => {
  let originalPlatformOS: typeof Platform.OS;
  beforeEach(() => {
    originalPlatformOS = Platform.OS;
  });
  afterEach(() => {
    Platform.OS = originalPlatformOS;
  });

  /** Valeurs proposées par une colonne native (modificateur `tag`). */
  const nativeValues = (testID: string) =>
    screen
      .getByTestId(testID)
      .findAll((node) => typeof node.type === "string" && Array.isArray(node.props.modifiers))
      .flatMap((node) => (node.props.modifiers as { $type: string; tag?: number }[]).filter((modifier) => modifier.$type === "tag"))
      .map((modifier) => modifier.tag);

  it("iOS: shows the title between ✕ and ✓, offers the grid, and ✓ returns a grid value (2 min 30 = 150 s)", () => {
    Platform.OS = "ios";
    const p = props();
    render(<DurationWheelPicker {...p} />);
    expect(screen.getByTestId("duration-wheel-title").props.children).toBe("Durée de récupération");
    expect(screen.getByTestId("duration-wheel-title").props.accessibilityRole).toBe("header");
    expect(nativeValues("duration-wheel-minutes")).toEqual([0, 1, 2, 3, 4, 5]);
    fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 2 } });
    // 30 s reste proposé à 2 min (2:30 = 150 s).
    expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(30);
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(p.onValidate).toHaveBeenCalledWith(150);
  });

  it("iOS: opens on the nearest grid value and caps at 300 s", () => {
    Platform.OS = "ios";
    const p = props({ totalSeconds: 8 });
    const view = render(<DurationWheelPicker {...p} />);
    expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(10);
    view.unmount();
    const q = props({ totalSeconds: 75 });
    render(<DurationWheelPicker {...q} />);
    fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 5 } });
    expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(0);
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(q.onValidate).toHaveBeenCalledWith(300);
  });

  it("Android / web: the legacy columns follow the grid, ✓ returns 0 (kept as present)", () => {
    Platform.OS = "android";
    const p = props({ totalSeconds: 0 });
    render(<DurationWheelPicker {...p} />);
    expect(screen.getByTestId("duration-wheel-minutes").props.accessibilityValue).toMatchObject({ min: 0, max: 5, now: 0 });
    expect(screen.getByTestId("duration-wheel-seconds").props.accessibilityValue).toMatchObject({ max: 55, now: 0 });
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(p.onValidate).toHaveBeenCalledWith(0);
  });

  it("without a title the toolbar is unchanged", () => {
    Platform.OS = "ios";
    render(<DurationWheelPicker {...props({ title: undefined, valueGrid: undefined })} />);
    expect(screen.queryByTestId("duration-wheel-title")).toBeNull();
  });
});

describe("DurationWheelPicker — legacy grid and empty grid (PRE-6 story 4.1, review)", () => {
  let originalPlatformOS: typeof Platform.OS;
  beforeEach(() => {
    originalPlatformOS = Platform.OS;
  });
  afterEach(() => {
    Platform.OS = originalPlatformOS;
  });

  it("Android / web, opened at 45 s: scrolling minutes to 2 snaps seconds to 30 and ✓ returns 150", () => {
    Platform.OS = "android";
    const p = props({ totalSeconds: 45 });
    render(<DurationWheelPicker {...p} />);
    expect(screen.getByTestId("duration-wheel-seconds").props.accessibilityValue).toMatchObject({ now: 45 });
    fireEvent.scroll(screen.getByTestId("duration-wheel-minutes"), {
      nativeEvent: { contentOffset: { y: 2 * 40 }, contentSize: {}, layoutMeasurement: {} },
    });
    expect(screen.getByTestId("duration-wheel-minutes").props.accessibilityValue).toMatchObject({ now: 2 });
    expect(screen.getByTestId("duration-wheel-seconds").props.accessibilityValue).toMatchObject({ now: 30, max: 30 });
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(p.onValidate).toHaveBeenCalledWith(150);
  });

  it("an empty valueGrid behaves like no grid (minutes 0..59, seconds 0..59)", () => {
    Platform.OS = "android";
    render(<DurationWheelPicker {...props({ valueGrid: [] })} />);
    expect(screen.getByTestId("duration-wheel-minutes").props.accessibilityValue).toMatchObject({ min: 0, max: 59 });
    expect(screen.getByTestId("duration-wheel-seconds").props.accessibilityValue).toMatchObject({ max: 59 });
  });
});
