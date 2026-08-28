import { fireEvent, render, screen } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";

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

describe("DurationWheelPicker", () => {
  it("renders both columns with accessibilityRole=adjustable and the correct accessibilityValue bounds", () => {
    render(
      <DurationWheelPicker
        totalSeconds={0}
        onChange={jest.fn()}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );

    const minutes = screen.getByTestId("duration-wheel-minutes");
    const seconds = screen.getByTestId("duration-wheel-seconds");

    expect(minutes.props.accessibilityRole).toBe("adjustable");
    expect(minutes.props.accessibilityValue).toEqual({ min: 0, max: 59, now: 0 });
    expect(seconds.props.accessibilityRole).toBe("adjustable");
    expect(seconds.props.accessibilityValue).toEqual({ min: 0, max: 59, now: 0 });
  });

  it("calls neither onChange nor the haptic when two consecutive onScroll events report the same index", () => {
    const onChange = jest.fn();
    render(
      <DurationWheelPicker
        totalSeconds={0}
        onChange={onChange}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );
    const minutes = screen.getByTestId("duration-wheel-minutes");

    scrollTo(minutes, 0);
    scrollTo(minutes, 0);

    expect(onChange).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it("triggers exactly one haptic call and one onChange call per newly observed index", () => {
    const onChange = jest.fn();
    render(
      <DurationWheelPicker
        totalSeconds={0}
        onChange={onChange}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );
    const minutes = screen.getByTestId("duration-wheel-minutes");

    scrollTo(minutes, ITEM_HEIGHT); // index 1

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(60); // 1 min 00 s
  });

  it("detects several successive index changes via several distinct onScroll events, one haptic each", () => {
    const onChange = jest.fn();
    render(
      <DurationWheelPicker
        totalSeconds={0}
        onChange={onChange}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );
    const seconds = screen.getByTestId("duration-wheel-seconds");

    scrollTo(seconds, ITEM_HEIGHT * 1);
    scrollTo(seconds, ITEM_HEIGHT * 2);
    scrollTo(seconds, ITEM_HEIGHT * 3);

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenNthCalledWith(1, 1);
    expect(onChange).toHaveBeenNthCalledWith(2, 2);
    expect(onChange).toHaveBeenNthCalledWith(3, 3);
  });

  it("does not call onChange/haptic again if onMomentumScrollEnd fires after onScroll already settled on that index", () => {
    const onChange = jest.fn();
    render(
      <DurationWheelPicker
        totalSeconds={0}
        onChange={onChange}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );
    const minutes = screen.getByTestId("duration-wheel-minutes");

    scrollTo(minutes, ITEM_HEIGHT * 2);
    expect(onChange).toHaveBeenCalledTimes(1);
    Haptics.selectionAsync.mockClear();
    onChange.mockClear();

    fireEvent(minutes, "momentumScrollEnd", {
      nativeEvent: { contentOffset: { y: ITEM_HEIGHT * 2 } },
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it("combines the independent minutes and seconds indices into the correct total (draft sync)", () => {
    const onChange = jest.fn();
    render(
      <DurationWheelPicker
        totalSeconds={0}
        onChange={onChange}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );
    const minutes = screen.getByTestId("duration-wheel-minutes");
    const seconds = screen.getByTestId("duration-wheel-seconds");

    scrollTo(minutes, ITEM_HEIGHT * 1); // 1 min
    scrollTo(seconds, ITEM_HEIGHT * 15); // + 15 s

    expect(onChange).toHaveBeenLastCalledWith(75);
  });

  it("clamps the lower bound: an overscrolled negative offset never reports an index below 0", () => {
    const onChange = jest.fn();
    render(
      <DurationWheelPicker
        totalSeconds={30}
        onChange={onChange}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );
    const seconds = screen.getByTestId("duration-wheel-seconds");

    scrollTo(seconds, -50);

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("clamps the upper bound: an overscrolled excessive offset never reports an index above 59, total capped at 3599", () => {
    const onChange = jest.fn();
    render(
      <DurationWheelPicker
        totalSeconds={0}
        onChange={onChange}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );
    const minutes = screen.getByTestId("duration-wheel-minutes");
    const seconds = screen.getByTestId("duration-wheel-seconds");

    scrollTo(minutes, ITEM_HEIGHT * 999);
    scrollTo(seconds, ITEM_HEIGHT * 999);

    expect(onChange).toHaveBeenLastCalledWith(3599);
  });

  it("never calls the haptic on mount alone, before any scroll event fires", () => {
    render(
      <DurationWheelPicker
        totalSeconds={75}
        onChange={jest.fn()}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );

    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it("still commits the value change to onChange even if Haptics.selectionAsync rejects (not silently broken logic)", async () => {
    Haptics.selectionAsync.mockRejectedValueOnce(new Error("no haptics engine"));
    const onChange = jest.fn();
    render(
      <DurationWheelPicker
        totalSeconds={0}
        onChange={onChange}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );
    const minutes = screen.getByTestId("duration-wheel-minutes");

    scrollTo(minutes, ITEM_HEIGHT);

    expect(onChange).toHaveBeenCalledWith(60);
    // Let the rejected promise's `.catch()` settle before the test ends,
    // so Jest never reports an unhandled rejection for this expected case.
    await Promise.resolve().then(() => Promise.resolve());
  });

  describe("maxTotalSeconds prop (T01-S08, Exercise Durée/Pause — 5999s bound)", () => {
    it("extends the minutes column bound to 99 and the total to 5999 when maxTotalSeconds=5999", () => {
      const onChange = jest.fn();
      render(
        <DurationWheelPicker
          totalSeconds={0}
          onChange={onChange}
          minutesAccessibilityLabel="Minutes"
          secondsAccessibilityLabel="Secondes"
          maxTotalSeconds={5999}
        />,
      );

      expect(screen.getByTestId("duration-wheel-minutes").props.accessibilityValue).toEqual({
        min: 0,
        max: 99,
        now: 0,
      });

      const minutes = screen.getByTestId("duration-wheel-minutes");
      const seconds = screen.getByTestId("duration-wheel-seconds");
      scrollTo(minutes, ITEM_HEIGHT * 999);
      scrollTo(seconds, ITEM_HEIGHT * 999);

      expect(onChange).toHaveBeenLastCalledWith(5999);
    });

    it("still defaults to the 3599s bound (minutes max 59) when maxTotalSeconds is omitted", () => {
      render(
        <DurationWheelPicker
          totalSeconds={0}
          onChange={jest.fn()}
          minutesAccessibilityLabel="Minutes"
          secondsAccessibilityLabel="Secondes"
        />,
      );

      expect(screen.getByTestId("duration-wheel-minutes").props.accessibilityValue).toEqual({
        min: 0,
        max: 59,
        now: 0,
      });
    });
  });

  it("initializes both columns from the supplied totalSeconds", () => {
    render(
      <DurationWheelPicker
        totalSeconds={75}
        onChange={jest.fn()}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );

    expect(screen.getByTestId("duration-wheel-minutes").props.accessibilityValue).toEqual({
      min: 0,
      max: 59,
      now: 1,
    });
    expect(screen.getByTestId("duration-wheel-seconds").props.accessibilityValue).toEqual({
      min: 0,
      max: 59,
      now: 15,
    });
  });
});
