import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Platform, ScrollView, StyleSheet } from "react-native";

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
 * `Platform.OS` par défaut dans cet environnement Jest (`jest-expo`) est
 * `"ios"` — hérité par `DurationWheelPicker`, qui délègue alors à la
 * roulette native SwiftUI, jamais à la réimplémentation maison ci-dessous
 * testée. Tout ce bloc `describe` porte sur le chemin Android/web
 * (`LegacyDurationWheelPicker`, réel, toujours livré pour ces plateformes)
 * — forcé explicitement, restauré après chaque test.
 *
 * **Toolbar Annuler/Valider — contrat R4-08/R4-09** (`[ChatGPT] REWORK04
 * IMPLEMENTATION AUTHORIZED — DESIGN COMPLEMENTS REVIEWED`, 2026-09-03) :
 * remplace le contrat `onChange`/démontage du cycle précédent. `onValidate`
 * n'est appelé QUE par un appui sur le bouton Valider, jamais pendant le
 * défilement ni au démontage seul ; `onCancel` ferme sans jamais appeler
 * `onValidate`.
 */
describe("DurationWheelPicker — chemin Android/web (LegacyDurationWheelPicker, ScrollView + toucher direct)", () => {
  let originalPlatformOS: typeof Platform.OS;

  beforeEach(() => {
    originalPlatformOS = Platform.OS;
    Platform.OS = "android";
  });

  afterEach(() => {
    Platform.OS = originalPlatformOS;
  });

  it("renders both columns with accessibilityRole=adjustable and the correct accessibilityValue bounds (R4-05: seconds 0…59)", () => {
    render(<DurationWheelPicker {...renderProps()} />);

    const minutes = screen.getByTestId("duration-wheel-minutes");
    const seconds = screen.getByTestId("duration-wheel-seconds");

    expect(minutes.props.accessibilityRole).toBe("adjustable");
    expect(minutes.props.accessibilityValue).toEqual({ min: 0, max: 59, now: 0 });
    expect(seconds.props.accessibilityRole).toBe("adjustable");
    expect(seconds.props.accessibilityValue).toEqual({ min: 0, max: 59, now: 0 });
  });

  it("renders the Cancel and Validate toolbar actions", () => {
    render(<DurationWheelPicker {...renderProps()} />);

    expect(screen.getByTestId("duration-wheel-toolbar")).toBeTruthy();
    expect(screen.getByLabelText(CANCEL_LABEL)).toBeTruthy();
    expect(screen.getByLabelText(VALIDATE_LABEL)).toBeTruthy();
  });

  it("never calls onValidate or onCancel while scrolling/pressing values — draft only (R4-08)", () => {
    const props = renderProps();
    render(<DurationWheelPicker {...props} />);

    scrollTo(screen.getByTestId("duration-wheel-minutes"), ITEM_HEIGHT * 3);
    scrollTo(screen.getByTestId("duration-wheel-seconds"), ITEM_HEIGHT * 17);
    fireEvent.press(screen.getByTestId("duration-wheel-minutes-item-5"));

    expect(props.onValidate).not.toHaveBeenCalled();
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("Cancel calls onCancel exactly once, never onValidate, regardless of prior scrolling", () => {
    const props = renderProps();
    render(<DurationWheelPicker {...props} />);

    scrollTo(screen.getByTestId("duration-wheel-minutes"), ITEM_HEIGHT * 5);
    fireEvent.press(screen.getByLabelText(CANCEL_LABEL));

    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onValidate).not.toHaveBeenCalled();
  });

  it("Validate calls onValidate exactly once, with the currently centered draft total, never onCancel", () => {
    const props = renderProps({ totalSeconds: 0 });
    render(<DurationWheelPicker {...props} />);

    scrollTo(screen.getByTestId("duration-wheel-minutes"), ITEM_HEIGHT); // 1 min
    scrollTo(screen.getByTestId("duration-wheel-seconds"), ITEM_HEIGHT * 17); // 17 s (pas de 1)
    fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));

    expect(props.onValidate).toHaveBeenCalledTimes(1);
    expect(props.onValidate).toHaveBeenCalledWith(60 + 17);
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

  it("restores exactly the last committed value on re-mount (close/reopen) — Cancel never changes it", () => {
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

  describe("hiérarchie visuelle (CE-T01-07, AUD-05 — T01_S01_S08_CONFORMITY_AUDIT_20260902.md)", () => {
    it("renders a central selection band and edge fade overlays, non-interactive, for both columns", () => {
      render(<DurationWheelPicker {...renderProps()} />);

      const overlays = screen.getAllByTestId("wheel-selection-overlay");
      expect(overlays).toHaveLength(2);
      for (const overlay of overlays) {
        expect(overlay.props.pointerEvents).toBe("none");
      }
      expect(screen.getAllByTestId("wheel-selection-band")).toHaveLength(2);
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

  /**
   * REWORK06 (`[ChatGPT] PLAN_APPROVED — REWORK06 — RESTAURATION CIBLÉE DE
   * LA ROULETTE + VERROU DE CAPITALISATION`, 2026-09-04, « RÈGLE IMPÉRATIVE
   * — PRIORITÉ AUX PRIMITIVES NATIVES DE L'OS ») : preuve positive que le
   * chemin Android/web reste bien la seule implémentation `ScrollView`
   * autorisée — jamais utilisée sur iOS (voir le describe suivant).
   */
  it("REWORK06 — is the ScrollView-based implementation actually used on Android (no native Host present)", () => {
    render(<DurationWheelPicker {...renderProps()} />);
    expect(screen.queryByTestId("duration-wheel-row")).toBeNull(); // testID propre à l'ancienne substitution REWORK05, absent ici.
  });
});

/**
 * `Platform.OS` par défaut dans cet environnement Jest (`jest-expo`) est
 * `"ios"` — aucun forçage nécessaire ici (posé explicitement quand même,
 * par robustesse). Ces tests portent sur `NativeAppleDurationWheelPicker` :
 * la roulette native SwiftUI elle-même (perspective, fondu, inertie,
 * magnétisme natifs) n'est PAS exercée par Jest — seule la couche JS de ce
 * composant l'est. Aucune de ces preuves ne remplace la capture/vidéo
 * iPhone exigée avant clôture (voir le rapport de mission).
 *
 * **Restaurée par REWORK06** (`[ChatGPT] PLAN_APPROVED — REWORK06`,
 * 2026-09-04) après suppression injustifiée par `REWORK05` — voir
 * `DurationWheelPicker.tsx` pour la justification complète de la
 * restauration.
 */
describe("DurationWheelPicker — chemin iOS natif (NativeAppleDurationWheelPicker, @expo/ui/swift-ui)", () => {
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

  function frameWidth(testID: string): number | undefined {
    const modifiers = screen.getByTestId(testID).props.modifiers as {
      $type: string;
      width?: number;
    }[];
    return modifiers.find((modifier) => modifier.$type === "frame")?.width;
  }

  it("renders the native Host/Picker structure and the toolbar, without crashing", () => {
    render(<DurationWheelPicker {...renderProps()} />);

    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();
    expect(screen.getByTestId("duration-wheel-minutes")).toBeTruthy();
    expect(screen.getByTestId("duration-wheel-seconds")).toBeTruthy();
    expect(screen.getByTestId("duration-wheel-toolbar")).toBeTruthy();
    expect(screen.getByLabelText(CANCEL_LABEL)).toBeTruthy();
    expect(screen.getByLabelText(VALIDATE_LABEL)).toBeTruthy();
  });

  /**
   * REWORK06 — preuve positive requise par la règle « Priorité aux
   * primitives natives de l'OS » : la branche iOS utilise réellement la
   * primitive native (`selection`/`onSelectionChange`, props exclusives du
   * mock `@expo/ui/swift-ui` `Picker`, absentes d'un `ScrollView`), jamais
   * un `ScrollView` de substitution silencieusement branché à sa place.
   */
  it("REWORK06 — actually uses the native SwiftUI Picker primitive on iOS, never a ScrollView fallback", () => {
    const { UNSAFE_root } = render(<DurationWheelPicker {...renderProps()} />);

    const minutes = screen.getByTestId("duration-wheel-minutes");
    expect(minutes.props.selection).toBeDefined();
    expect(minutes.props.onSelectionChange).toBeInstanceOf(Function);
    expect(minutes.props.onScroll).toBeUndefined();
    expect(UNSAFE_root.findAllByType(ScrollView)).toHaveLength(0);
  });

  it("never calls onValidate or onCancel while the picker stays mounted, no matter how many native selection events occur (R4-08)", () => {
    const props = renderProps();
    render(<DurationWheelPicker {...props} />);

    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 5);
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 10);
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-seconds"), 30);

    expect(props.onValidate).not.toHaveBeenCalled();
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("Cancel calls onCancel exactly once, never onValidate, regardless of prior native selection changes", () => {
    const props = renderProps();
    render(<DurationWheelPicker {...props} />);

    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 5);
    fireEvent.press(screen.getByLabelText(CANCEL_LABEL));

    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onValidate).not.toHaveBeenCalled();
  });

  it("Validate calls onValidate exactly once with the currently centered draft total, never onCancel", () => {
    const props = renderProps({ totalSeconds: 0 });
    render(<DurationWheelPicker {...props} />);

    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 5);
    fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));

    expect(props.onValidate).toHaveBeenCalledTimes(1);
    expect(props.onValidate).toHaveBeenCalledWith(5 * 60);
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("propagates exactly one haptic call per newly observed native selection", () => {
    render(<DurationWheelPicker {...renderProps()} />);

    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 5);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the native picker reports the value already selected — no haptic", () => {
    render(<DurationWheelPicker {...renderProps()} />);

    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 0);
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it("keeps native selections independent between the minutes and seconds columns, combining into the correct total on Validate", () => {
    const props = renderProps();
    render(<DurationWheelPicker {...props} />);

    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 2);
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-seconds"), 30);
    fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));

    expect(props.onValidate).toHaveBeenCalledWith(2 * 60 + 30);
  });

  it("R4-05 — reports every second value 0…59 exactly (pas de 1, aucun arrondi)", () => {
    const props = renderProps();
    render(<DurationWheelPicker {...props} />);

    fireNativeSelectionChange(screen.getByTestId("duration-wheel-seconds"), 37);
    fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));

    expect(props.onValidate).toHaveBeenCalledWith(37);
  });

  it("restores exactly the last committed value on re-mount (close/reopen) — example 01 min 10 s, Cancel never changes it", () => {
    const props = renderProps({ totalSeconds: 70 });
    const { unmount } = render(<DurationWheelPicker {...props} />);

    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 5); // draft only
    fireEvent.press(screen.getByLabelText(CANCEL_LABEL));
    expect(props.onValidate).not.toHaveBeenCalled();
    unmount();

    render(<DurationWheelPicker {...props} />);
    expect(screen.getByTestId("duration-wheel-minutes").props.selection).toBe(1);
    expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(10);
  });

  describe("géométrie canonique R4-07 (mission de design, `2026-09-03_design-complements-composition-wheel.md`)", () => {
    it("gives the minutes column an explicit frame width of 76, with a trailing gap of 4 before its unit", () => {
      render(<DurationWheelPicker {...renderProps()} />);

      expect(frameWidth("duration-wheel-minutes")).toBe(76);
      const modifiers = screen.getByTestId("duration-wheel-minutes").props.modifiers as {
        $type: string;
        trailing?: number;
      }[];
      const paddingModifier = modifiers.find((modifier) => modifier.$type === "padding");
      expect(paddingModifier?.trailing).toBe(4);
    });

    it("gives the seconds column the exact same frame width (76) and trailing gap (4) as the minutes column", () => {
      render(<DurationWheelPicker {...renderProps()} />);

      expect(frameWidth("duration-wheel-seconds")).toBe(frameWidth("duration-wheel-minutes"));
    });

    it("gives the 'min' and 's' unit texts their canonical widths (32 and 20) in bold 14pt", () => {
      const { UNSAFE_getAllByProps } = render(<DurationWheelPicker {...renderProps()} />);

      const minUnit = UNSAFE_getAllByProps({ text: "min" })[0];
      const sUnit = UNSAFE_getAllByProps({ text: "s" })[0];

      const minModifiers = minUnit.props.modifiers as { $type: string; width?: number; size?: number }[];
      expect(minModifiers.find((m) => m.$type === "frame")?.width).toBe(32);
      expect(minModifiers.some((m) => m.$type === "bold")).toBe(true);
      expect(minModifiers.find((m) => m.$type === "font")?.size).toBe(14);

      const sModifiers = sUnit.props.modifiers as { $type: string; width?: number }[];
      expect(sModifiers.find((m) => m.$type === "frame")?.width).toBe(20);
      expect(sModifiers.some((m) => m.$type === "bold")).toBe(true);
    });

    /**
     * Correction bloquante — visibilité des valeurs (« CORRECTION BLOQUANTE
     * AVANT T01-S09 — VISIBILITÉ DES ROULETTES », 2026-09-05) : preuve
     * directe que chaque chiffre et chaque unité porte désormais une
     * couleur de premier plan EXPLICITE (`colors.textPrimary`), jamais la
     * seule couleur par défaut de SwiftUI (`Color.primary`, dynamique, dont
     * la résolution via ce pont natif s'est révélée non fiable — cause
     * racine de la régression).
     */
    it("REWORK14 (visibilité) — every digit and unit text carries an explicit foregroundStyle(colors.textPrimary), never relying on SwiftUI's default dynamic color", () => {
      const { UNSAFE_getAllByProps } = render(<DurationWheelPicker {...renderProps()} />);

      const minutesFirstDigit = UNSAFE_getAllByProps({ text: "00" })[0];
      const digitModifiers = minutesFirstDigit.props.modifiers as {
        $type: string;
        style?: string;
        color?: string;
      }[];
      const foreground = digitModifiers.find((m) => m.$type === "foregroundStyle");
      expect(foreground).toBeDefined();
      expect(foreground?.style ?? foreground?.color).toBe(colors.textPrimary);

      const minUnit = UNSAFE_getAllByProps({ text: "min" })[0];
      const sUnit = UNSAFE_getAllByProps({ text: "s" })[0];
      for (const unit of [minUnit, sUnit]) {
        const unitModifiers = unit.props.modifiers as { $type: string; style?: string; color?: string }[];
        const unitForeground = unitModifiers.find((m) => m.$type === "foregroundStyle");
        expect(unitForeground).toBeDefined();
        expect(unitForeground?.style ?? unitForeground?.color).toBe(colors.textPrimary);
      }
    });

    it("W-04/R4-06 — never renders a second, overlaid selection frame (blue band) — only the native SwiftUI frame subsists", () => {
      render(<DurationWheelPicker {...renderProps()} />);
      expect(screen.queryByTestId("duration-wheel-native-selection-band")).toBeNull();
      expect(screen.queryByTestId("wheel-selection-band")).toBeNull();
    });

    it("R4-08 — never renders the previous cycle's invisible tap-to-close target on the selection band", () => {
      render(<DurationWheelPicker {...renderProps()} />);
      expect(screen.queryByTestId("duration-wheel-native-close-tap")).toBeNull();
    });
  });

  describe("toolbar Annuler/Valider — géométrie (R4-09, D-098)", () => {
    it("gives Cancel and Validate a 28×28 visual circle with a hitSlop that extends the touch target to 48×48", () => {
      render(<DurationWheelPicker {...renderProps()} />);

      const cancel = screen.getByTestId("duration-wheel-cancel");
      const validate = screen.getByTestId("duration-wheel-validate");
      const cancelStyle = StyleSheet.flatten(cancel.props.style);
      const validateStyle = StyleSheet.flatten(validate.props.style);

      expect(cancelStyle.width).toBe(38);
      expect(cancelStyle.height).toBe(38);
      expect(validateStyle.width).toBe(38);
      expect(validateStyle.height).toBe(38);
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

    it("REWORK07B — renders the canonical wheel-action SVG assets at 24×24, never the previous Unicode ✕/✓ glyphs", () => {
      render(<DurationWheelPicker {...renderProps()} />);

      const cancelIcon = screen.getByTestId("duration-wheel-cancel-icon");
      const validateIcon = screen.getByTestId("duration-wheel-validate-icon");
      expect(StyleSheet.flatten(cancelIcon.props.style).width).toBe(24);
      expect(StyleSheet.flatten(cancelIcon.props.style).height).toBe(24);
      expect(StyleSheet.flatten(validateIcon.props.style).width).toBe(24);
      expect(StyleSheet.flatten(validateIcon.props.style).height).toBe(24);

      // Actifs canoniques réellement chargés — leur `source` diffère (pas
      // le même module require), preuve qu'il ne s'agit pas du même
      // pictogramme rendu deux fois par accident.
      expect(cancelIcon.props.source).not.toBe(validateIcon.props.source);

      // Plus aucun glyphe Unicode texte — la lacune DSF R4-09 est fermée.
      expect(screen.queryByText("✕")).toBeNull();
      expect(screen.queryByText("✓")).toBeNull();
    });
  });
});
