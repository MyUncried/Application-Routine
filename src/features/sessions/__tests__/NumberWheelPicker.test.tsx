import { fireEvent, render, screen } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { NumberWheelPicker } from "@/features/sessions/NumberWheelPicker";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Haptics = require("expo-haptics") as { selectionAsync: jest.Mock<() => Promise<void>> };

const ITEM_HEIGHT = 40;

function scrollTo(element: ReturnType<typeof screen.getByTestId>, offsetY: number) {
  fireEvent.scroll(element, {
    nativeEvent: { contentOffset: { y: offsetY }, contentSize: {}, layoutMeasurement: {} },
  });
}

beforeEach(() => {
  Haptics.selectionAsync.mockClear();
});

describe("NumberWheelPicker", () => {
  it("renders with accessibilityRole=adjustable and bounds 1..99", () => {
    render(<NumberWheelPicker value={1} onChange={jest.fn()} accessibilityLabel="Répétitions" />);

    const picker = screen.getByTestId("number-wheel-picker");
    expect(picker.props.accessibilityRole).toBe("adjustable");
    expect(picker.props.accessibilityValue).toEqual({ min: 1, max: 99, now: 1 });
  });

  it("initializes accessibilityValue.now from the supplied value", () => {
    render(<NumberWheelPicker value={12} onChange={jest.fn()} accessibilityLabel="Séries" />);

    expect(screen.getByTestId("number-wheel-picker").props.accessibilityValue).toEqual({
      min: 1,
      max: 99,
      now: 12,
    });
  });

  it("calls neither onChange nor the haptic when two consecutive onScroll events report the same index", () => {
    const onChange = jest.fn();
    render(<NumberWheelPicker value={1} onChange={onChange} accessibilityLabel="Répétitions" />);
    const picker = screen.getByTestId("number-wheel-picker");

    scrollTo(picker, 0);
    scrollTo(picker, 0);

    expect(onChange).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it("triggers exactly one haptic call and one onChange call per newly observed index (value = 1 + index)", () => {
    const onChange = jest.fn();
    render(<NumberWheelPicker value={1} onChange={onChange} accessibilityLabel="Répétitions" />);
    const picker = screen.getByTestId("number-wheel-picker");

    scrollTo(picker, ITEM_HEIGHT); // index 1 -> value 2

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("clamps the lower bound: an overscrolled negative offset never reports a value below 1", () => {
    const onChange = jest.fn();
    render(<NumberWheelPicker value={5} onChange={onChange} accessibilityLabel="Séries" />);
    const picker = screen.getByTestId("number-wheel-picker");

    scrollTo(picker, -999);

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("clamps the upper bound: an overscrolled excessive offset never reports a value above 99", () => {
    const onChange = jest.fn();
    render(<NumberWheelPicker value={1} onChange={onChange} accessibilityLabel="Séries" />);
    const picker = screen.getByTestId("number-wheel-picker");

    scrollTo(picker, ITEM_HEIGHT * 999);

    expect(onChange).toHaveBeenLastCalledWith(99);
  });

  it("never calls the haptic on mount alone, before any scroll event fires", () => {
    render(<NumberWheelPicker value={42} onChange={jest.fn()} accessibilityLabel="Séries" />);

    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it("does not call onChange/haptic again if onMomentumScrollEnd fires after onScroll already settled on that index", () => {
    const onChange = jest.fn();
    render(<NumberWheelPicker value={1} onChange={onChange} accessibilityLabel="Séries" />);
    const picker = screen.getByTestId("number-wheel-picker");

    scrollTo(picker, ITEM_HEIGHT * 2);
    expect(onChange).toHaveBeenCalledTimes(1);
    Haptics.selectionAsync.mockClear();
    onChange.mockClear();

    fireEvent(picker, "momentumScrollEnd", { nativeEvent: { contentOffset: { y: ITEM_HEIGHT * 2 } } });

    expect(onChange).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it("still commits the value change to onChange even if Haptics.selectionAsync rejects", async () => {
    Haptics.selectionAsync.mockRejectedValueOnce(new Error("no haptics engine"));
    const onChange = jest.fn();
    render(<NumberWheelPicker value={1} onChange={onChange} accessibilityLabel="Répétitions" />);
    const picker = screen.getByTestId("number-wheel-picker");

    scrollTo(picker, ITEM_HEIGHT);

    expect(onChange).toHaveBeenCalledWith(2);
    await Promise.resolve().then(() => Promise.resolve());
  });

  it("accepts a custom testID", () => {
    render(
      <NumberWheelPicker
        value={1}
        onChange={jest.fn()}
        accessibilityLabel="Répétitions"
        testID="repetition-wheel-picker"
      />,
    );

    expect(screen.getByTestId("repetition-wheel-picker")).toBeTruthy();
  });
});
