import { fireEvent, render, screen } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
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

function renderProps(overrides: Partial<Parameters<typeof DurationWheelPicker>[0]> = {}) {
  return {
    totalSeconds: 0,
    onValidate: jest.fn(),
    onCancel: jest.fn(),
    minutesAccessibilityLabel: "Minutes",
    secondsAccessibilityLabel: "Secondes",
    cancelAccessibilityLabel: CANCEL_LABEL,
    validateAccessibilityLabel: VALIDATE_LABEL,
    ...overrides,
  };
}

beforeEach(() => {
  Haptics.selectionAsync.mockClear();
});

/**
 * **Changement de primitive — audit indépendant REWORK04** (`[ChatGPT]
 * CHANGES_REQUESTED — Composition d'une séance — audit indépendant
 * REWORK04`, 2026-09-03) : `DurationWheelPicker` utilise désormais une
 * seule implémentation (`ScrollView` + calcul manuel) sur toutes les
 * plateformes — plus de délégation à la roulette native SwiftUI ni de
 * `Platform.OS`. Ce fichier ne teste donc plus qu'un seul chemin, entièrement
 * composé de primitives React Native standard réellement exercées par ces
 * tests (contrairement aux mocks `@expo/ui` du cycle précédent, qui ne
 * prouvaient que la couche JS).
 *
 * **Toolbar Annuler/Valider — contrat R4-08/R4-09** : `onValidate` n'est
 * appelé QUE par un appui sur le bouton Valider, jamais pendant le
 * défilement ni au démontage seul ; `onCancel` ferme sans jamais appeler
 * `onValidate`.
 */
describe("DurationWheelPicker", () => {
  it("renders both columns with accessibilityRole=adjustable and the correct accessibilityValue bounds (R4-05: seconds 0…59)", () => {
    render(<DurationWheelPicker {...renderProps()} />);

    const minutes = screen.getByTestId("duration-wheel-minutes");
    const seconds = screen.getByTestId("duration-wheel-seconds");

    expect(minutes.props.accessibilityRole).toBe("adjustable");
    expect(minutes.props.accessibilityValue).toEqual({ min: 0, max: 59, now: 0 });
    expect(seconds.props.accessibilityRole).toBe("adjustable");
    expect(seconds.props.accessibilityValue).toEqual({ min: 0, max: 59, now: 0 });
  });

  it("W-09/W-10 — renders the initial digits and units immediately, visible at mount (never an empty spinning wheel)", () => {
    render(<DurationWheelPicker {...renderProps({ totalSeconds: 75 })} />); // 1 min 15 s

    expect(screen.getByTestId("duration-wheel-minutes-item-1")).toBeTruthy();
    expect(screen.getByTestId("duration-wheel-seconds-item-15")).toBeTruthy();
    expect(screen.getByText("min")).toBeTruthy();
    expect(screen.getByText("s")).toBeTruthy();
  });

  it("renders the Cancel and Validate toolbar actions", () => {
    render(<DurationWheelPicker {...renderProps()} />);

    expect(screen.getByTestId("duration-wheel-toolbar")).toBeTruthy();
    expect(screen.getByLabelText(CANCEL_LABEL)).toBeTruthy();
    expect(screen.getByLabelText(VALIDATE_LABEL)).toBeTruthy();
  });

  it("R4-08 — never calls onValidate or onCancel while scrolling/pressing values — draft only, the picker stays open", () => {
    const props = renderProps();
    render(<DurationWheelPicker {...props} />);

    scrollTo(screen.getByTestId("duration-wheel-minutes"), ITEM_HEIGHT * 3);
    scrollTo(screen.getByTestId("duration-wheel-seconds"), ITEM_HEIGHT * 17);
    fireEvent.press(screen.getByTestId("duration-wheel-minutes-item-5"));

    expect(props.onValidate).not.toHaveBeenCalled();
    expect(props.onCancel).not.toHaveBeenCalled();
    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();
  });

  it("R4-09b — Cancel calls onCancel exactly once, never onValidate, regardless of prior scrolling", () => {
    const props = renderProps();
    render(<DurationWheelPicker {...props} />);

    scrollTo(screen.getByTestId("duration-wheel-minutes"), ITEM_HEIGHT * 5);
    fireEvent.press(screen.getByLabelText(CANCEL_LABEL));

    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onValidate).not.toHaveBeenCalled();
  });

  it("R4-09c/W-08 — Validate calls onValidate exactly once, with exactly the currently centered draft total, never onCancel", () => {
    const props = renderProps({ totalSeconds: 0 });
    render(<DurationWheelPicker {...props} />);

    scrollTo(screen.getByTestId("duration-wheel-minutes"), ITEM_HEIGHT); // 1 min
    scrollTo(screen.getByTestId("duration-wheel-seconds"), ITEM_HEIGHT * 11); // 11 s
    fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));

    expect(props.onValidate).toHaveBeenCalledTimes(1);
    expect(props.onValidate).toHaveBeenCalledWith(60 + 11); // 01 min 11 s
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("triggers exactly one haptic call per newly observed index during scroll", () => {
    render(<DurationWheelPicker {...renderProps()} />);

    scrollTo(screen.getByTestId("duration-wheel-minutes"), ITEM_HEIGHT);

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  it("calls the haptic neither on mount nor when two consecutive onScroll events report the same index", () => {
    render(<DurationWheelPicker {...renderProps()} />);
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();

    const minutes = screen.getByTestId("duration-wheel-minutes");
    scrollTo(minutes, 0);
    scrollTo(minutes, 0);
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it("does not haptic again if onMomentumScrollEnd fires after onScroll already settled on that index", () => {
    render(<DurationWheelPicker {...renderProps()} />);
    const minutes = screen.getByTestId("duration-wheel-minutes");

    scrollTo(minutes, ITEM_HEIGHT * 2);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    Haptics.selectionAsync.mockClear();

    fireEvent(minutes, "momentumScrollEnd", { nativeEvent: { contentOffset: { y: ITEM_HEIGHT * 2 } } });
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it("clamps the lower bound: an overscrolled negative offset never validates an index below 0", () => {
    const props = renderProps({ totalSeconds: 30 });
    render(<DurationWheelPicker {...props} />);

    scrollTo(screen.getByTestId("duration-wheel-seconds"), -50);
    fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));

    expect(props.onValidate).toHaveBeenCalledWith(0);
  });

  it("clamps the upper bound: an overscrolled excessive offset never validates beyond 59 min 59 s (3599)", () => {
    const props = renderProps();
    render(<DurationWheelPicker {...props} />);

    scrollTo(screen.getByTestId("duration-wheel-minutes"), ITEM_HEIGHT * 999);
    scrollTo(screen.getByTestId("duration-wheel-seconds"), ITEM_HEIGHT * 999);
    fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));

    expect(props.onValidate).toHaveBeenCalledWith(3599);
  });

  it("still commits the value to onValidate even if Haptics.selectionAsync rejects (not silently broken logic)", async () => {
    Haptics.selectionAsync.mockRejectedValueOnce(new Error("no haptics engine"));
    const props = renderProps();
    render(<DurationWheelPicker {...props} />);

    scrollTo(screen.getByTestId("duration-wheel-minutes"), ITEM_HEIGHT);
    await Promise.resolve().then(() => Promise.resolve());
    fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));

    expect(props.onValidate).toHaveBeenCalledWith(60);
  });

  describe("maxTotalSeconds prop (T01-S08, Exercise Durée/Pause — 5999s bound)", () => {
    it("extends the minutes column bound to 99 and the validated total to 5999 when maxTotalSeconds=5999", () => {
      const props = renderProps({ maxTotalSeconds: 5999 });
      render(<DurationWheelPicker {...props} />);

      expect(screen.getByTestId("duration-wheel-minutes").props.accessibilityValue).toEqual({
        min: 0,
        max: 99,
        now: 0,
      });

      scrollTo(screen.getByTestId("duration-wheel-minutes"), ITEM_HEIGHT * 999);
      scrollTo(screen.getByTestId("duration-wheel-seconds"), ITEM_HEIGHT * 999);
      fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));

      expect(props.onValidate).toHaveBeenCalledWith(5999);
    });

    it("still defaults to the 3599s bound (minutes max 59) when maxTotalSeconds is omitted", () => {
      render(<DurationWheelPicker {...renderProps()} />);

      expect(screen.getByTestId("duration-wheel-minutes").props.accessibilityValue).toEqual({
        min: 0,
        max: 59,
        now: 0,
      });
    });
  });

  it("initializes both columns from the supplied totalSeconds", () => {
    render(<DurationWheelPicker {...renderProps({ totalSeconds: 75 })} />);

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

  it("W-08 — restores exactly the last committed value on re-mount (close/reopen), example 01 min 10 s — Cancel never changes it", () => {
    const props = renderProps({ totalSeconds: 70 }); // 1 min 10 s
    const { unmount } = render(<DurationWheelPicker {...props} />);

    scrollTo(screen.getByTestId("duration-wheel-minutes"), ITEM_HEIGHT * 9); // draft only, never committed
    fireEvent.press(screen.getByLabelText(CANCEL_LABEL));
    expect(props.onValidate).not.toHaveBeenCalled();
    unmount();

    render(<DurationWheelPicker {...props} />);
    expect(screen.getByTestId("duration-wheel-minutes").props.accessibilityValue).toEqual({
      min: 0,
      max: 59,
      now: 1,
    });
    expect(screen.getByTestId("duration-wheel-seconds").props.accessibilityValue).toEqual({
      min: 0,
      max: 59,
      now: 10,
    });
  });

  describe("R4-06/W-07/W-11 — bande de sélection unique (traverse colonnes ET unités)", () => {
    it("renders exactly one selection band spanning the full wheel row, never one per column", () => {
      render(<DurationWheelPicker {...renderProps()} />);

      // Une seule instance du calque de superposition (pas une par colonne).
      expect(screen.getAllByTestId("wheel-selection-overlay")).toHaveLength(1);
      expect(screen.getAllByTestId("wheel-selection-band")).toHaveLength(1);
    });

    it("colours the band neutral grey (colors.surface/colors.divider), never the pale blue selectionSurface token", () => {
      render(<DurationWheelPicker {...renderProps()} />);

      const band = screen.getByTestId("wheel-selection-band");
      const flattened = StyleSheet.flatten(band.props.style);
      expect(flattened.backgroundColor).toBe(colors.surface);
      expect(flattened.backgroundColor).not.toBe(colors.selectionSurface);
      expect(flattened.borderColor).toBe(colors.divider);
    });

    it("positions the band's width to cover the entire wheel row (both columns and both units), not a single column's width", () => {
      render(<DurationWheelPicker {...renderProps()} />);

      const overlay = screen.getByTestId("wheel-selection-overlay");
      const row = screen.getByTestId("duration-wheel-row");
      const overlayStyle = StyleSheet.flatten(overlay.props.style);
      const rowStyle = StyleSheet.flatten(row.props.style);

      // Le calque est positionné en absolu, left/right à 0, à l'intérieur du
      // MÊME conteneur (`duration-wheel-row`) que les deux colonnes et les
      // deux unités — sa largeur effective est donc celle de ce conteneur.
      expect(overlayStyle.position).toBe("absolute");
      expect(overlayStyle.left).toBe(0);
      expect(overlayStyle.right).toBe(0);
      expect(rowStyle.width).toBeGreaterThan(0);
    });

    it("never intercepts scroll/press gestures (pointerEvents=none)", () => {
      render(<DurationWheelPicker {...renderProps()} />);
      expect(screen.getByTestId("wheel-selection-overlay").props.pointerEvents).toBe("none");
    });
  });

  describe("R4-07 — géométrie canonique de la roulette (largeurs exactes, mission de design)", () => {
    it("gives the minutes and seconds columns their exact canonical widths (76 each)", () => {
      render(<DurationWheelPicker {...renderProps()} />);

      const minutesStyle = StyleSheet.flatten(screen.getByTestId("duration-wheel-minutes").props.style);
      const secondsStyle = StyleSheet.flatten(screen.getByTestId("duration-wheel-seconds").props.style);
      expect(minutesStyle.width).toBe(76);
      expect(secondsStyle.width).toBe(76);
    });

    it("gives the 'min' and 's' units their exact canonical widths (32 and 20) in bold 14/18, positioned with the canonical gaps (4 digit/unit, 22 between groups)", () => {
      render(<DurationWheelPicker {...renderProps()} />);

      const minUnit = screen.getByText("min");
      const sUnit = screen.getByText("s");
      const minStyle = StyleSheet.flatten(minUnit.props.style);
      const sStyle = StyleSheet.flatten(sUnit.props.style);

      expect(minStyle.width).toBe(32);
      expect(minStyle.marginRight).toBe(22);
      expect(minStyle.fontWeight).toBe("600");
      expect(minStyle.fontSize).toBe(14);
      expect(minStyle.lineHeight).toBe(18);

      expect(sStyle.width).toBe(20);
      expect(sStyle.fontWeight).toBe("600");

      const minutesStyle = StyleSheet.flatten(screen.getByTestId("duration-wheel-minutes").props.style);
      const secondsStyle = StyleSheet.flatten(screen.getByTestId("duration-wheel-seconds").props.style);
      expect(minutesStyle.marginRight).toBe(4);
      expect(secondsStyle.marginRight).toBe(4);
    });

    it("never lets any column or unit overflow the wheel row's own bounded width", () => {
      render(<DurationWheelPicker {...renderProps()} />);

      const rowWidth = StyleSheet.flatten(screen.getByTestId("duration-wheel-row").props.style).width as number;
      const minutesWidth = StyleSheet.flatten(screen.getByTestId("duration-wheel-minutes").props.style)
        .width as number;
      const secondsWidth = StyleSheet.flatten(screen.getByTestId("duration-wheel-seconds").props.style)
        .width as number;
      const minUnitWidth = StyleSheet.flatten(screen.getByText("min").props.style).width as number;
      const sUnitWidth = StyleSheet.flatten(screen.getByText("s").props.style).width as number;

      // Somme exacte des six mesures R4-07 (76+4+32+22+76+4+20=234) — jamais
      // moins que ce que les éléments réclament, jamais plus (pas d'espace
      // résiduel où un élément pourrait déborder sans être détecté).
      const minutesGap = StyleSheet.flatten(screen.getByTestId("duration-wheel-minutes").props.style)
        .marginRight as number;
      const secondsGap = StyleSheet.flatten(screen.getByTestId("duration-wheel-seconds").props.style)
        .marginRight as number;
      const minUnitGap = StyleSheet.flatten(screen.getByText("min").props.style).marginRight as number;

      const total = minutesWidth + minutesGap + minUnitWidth + minUnitGap + secondsWidth + secondsGap + sUnitWidth;
      expect(total).toBe(rowWidth);
    });
  });

  describe("CTRL-01 — sélection par appui direct (contre-recette iPhone, Phase 2 Composition, 2026-09-03)", () => {
    it("selects a value by pressing it directly, committed only on Validate", () => {
      const props = renderProps();
      render(<DurationWheelPicker {...props} />);

      fireEvent.press(screen.getByTestId("duration-wheel-minutes-item-5"));
      expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
      expect(props.onValidate).not.toHaveBeenCalled();

      fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));
      expect(props.onValidate).toHaveBeenCalledWith(5 * 60);
    });

    it("does nothing when the pressed value is already the current one — no haptic", () => {
      render(<DurationWheelPicker {...renderProps()} />);

      fireEvent.press(screen.getByTestId("duration-wheel-minutes-item-0"));
      expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    });

    it("keeps pressed selections independent between the minutes and seconds columns, committed together on Validate", () => {
      const props = renderProps();
      render(<DurationWheelPicker {...props} />);

      fireEvent.press(screen.getByTestId("duration-wheel-minutes-item-2"));
      fireEvent.press(screen.getByTestId("duration-wheel-seconds-item-30"));
      fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));

      expect(props.onValidate).toHaveBeenCalledWith(2 * 60 + 30);
    });
  });

  describe("toolbar Annuler/Valider — géométrie (R4-09a, D-098)", () => {
    it("gives Cancel and Validate a 28×28 visual circle with a hitSlop that extends the touch target to 48×48", () => {
      render(<DurationWheelPicker {...renderProps()} />);

      const cancel = screen.getByTestId("duration-wheel-cancel");
      const validate = screen.getByTestId("duration-wheel-validate");
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
      render(<DurationWheelPicker {...renderProps()} />);

      const cancelStyle = StyleSheet.flatten(screen.getByTestId("duration-wheel-cancel").props.style);
      const validateStyle = StyleSheet.flatten(
        screen.getByTestId("duration-wheel-validate").props.style,
      );
      expect(cancelStyle.backgroundColor).toBe(colors.wheelActionCancelBackground);
      expect(validateStyle.backgroundColor).toBe(colors.wheelActionValidateBackground);
    });
  });
});
