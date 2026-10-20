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
  } as Parameters<typeof DurationWheelPicker>[0] & { onValidate: jest.Mock; onCancel: jest.Mock };
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

/**
 * PRE-3 (R-1) — obligations effectives de la roulette utilisée EN PLACE dans
 * la feuille Paramètres (Durée d'une série, Durée totale). Seules les
 * propriétés simulables sont prouvées ici ; l'annonce VoiceOver native de
 * `SwiftUI.Picker(.wheel)` reste une vérification sur appareil.
 */
describe("DurationWheelPicker — PRE-3 R-1 (roulette en place de la feuille Paramètres)", () => {
  let originalPlatformOS: typeof Platform.OS;

  beforeEach(() => {
    originalPlatformOS = Platform.OS;
    Platform.OS = "ios";
  });

  afterEach(() => {
    Platform.OS = originalPlatformOS;
  });

  it("R-1/native-delegation — iOS délègue à SwiftUI Picker(.wheel) avec la borne Exercice 5999 s ; aucun ScrollView de substitution", () => {
    const { UNSAFE_root } = render(<DurationWheelPicker {...renderProps({ totalSeconds: 90, maxTotalSeconds: 5999 })} />);
    const minutes = screen.getByTestId("duration-wheel-minutes");
    const modifiers = minutes.props.modifiers as { $type: string; style?: string }[];
    expect(modifiers.some((modifier) => modifier.$type === "pickerStyle")).toBe(true);
    expect(minutes.props.selection).toBe(1);
    expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(30);
    expect(UNSAFE_root.findAllByType(ScrollView)).toHaveLength(0);
  });

  it("R-1/distinct-actions — Valider et Annuler sont deux actions distinctes nommées ; aucun commit au démontage", () => {
    const props = renderProps({ totalSeconds: 30, maxTotalSeconds: 5999 });
    const { unmount } = render(<DurationWheelPicker {...props} />);
    fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 2 } });
    const cancel = screen.getByTestId("duration-wheel-cancel");
    const validate = screen.getByTestId("duration-wheel-validate");
    expect(cancel.props.accessibilityLabel).toBe(CANCEL_LABEL);
    expect(validate.props.accessibilityLabel).toBe(VALIDATE_LABEL);
    expect(cancel).not.toBe(validate);
    // Fermeture de la feuille / démontage sans action : rien n'est validé ni annulé.
    unmount();
    expect(props.onValidate).not.toHaveBeenCalled();
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("R-1/accessibility-props — chaque colonne porte un nom simulable (minutes / secondes) ; Valider renvoie la valeur centrée exacte", () => {
    const props = renderProps({ totalSeconds: 0, maxTotalSeconds: 5999 });
    render(<DurationWheelPicker {...props} />);
    const labelOf = (testID: string) =>
      (screen.getByTestId(testID).props.modifiers as { $type: string; label?: string }[]).find(
        (modifier) => modifier.$type === "accessibilityLabel",
      );
    expect(labelOf("duration-wheel-minutes")).toBeDefined();
    expect(labelOf("duration-wheel-seconds")).toBeDefined();
    fireEvent(screen.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: 99 } });
    fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 59 } });
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(props.onValidate).toHaveBeenCalledWith(5999);
  });
});

/**
 * PRE-4 story 3.4 (AD-7, Q36, Q41) — Sélecteur de cible en Durée : props optionnelles
 * `targetBounds` et `failureOption`, `validateDisabled` de `PickerToolbar`. Le rendu
 * natif (niveaux de la roue, ✓ indisponible) reste à juger sur iPhone (NFR-04, P33).
 */
describe("PRE4-3.4 — DurationWheelPicker : option échec, bornes de Cible, ✓ indisponible", () => {
  // PRE-5 (D-430, AD-31) : bornes de la Cible Durée 1..3535.
  const BOUNDS = { min: 1, max: 3535 } as const;
  let originalPlatformOS: typeof Platform.OS;

  afterEach(() => {
    Platform.OS = originalPlatformOS;
  });

  function setPlatform(os: typeof Platform.OS) {
    originalPlatformOS = Platform.OS;
    Platform.OS = os;
  }

  function targetProps(initiallySelected = false, totalSeconds = 30) {
    const onValidateFailure = jest.fn();
    return {
      ...renderProps({
        totalSeconds,
        targetBounds: BOUNDS,
        failureOption: {
          label: "Aucune durée, à l’échec",
          initiallySelected,
          onValidateFailure,
        },
      }),
      onValidateFailure,
    };
  }

  const opacityOf = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style)?.opacity ?? 1;
  const nativeChange = (testID: string, selection: number) =>
    fireEvent(screen.getByTestId(testID), "selectionChange", { nativeEvent: { selection } });
  /** Valeurs proposées par une colonne native (modificateur `tag` de chaque `SwiftUIText`). */
  const nativeValues = (testID: string) =>
    screen
      .getByTestId(testID)
      .findAll((node) => typeof node.type === "string" && Array.isArray(node.props.modifiers))
      .flatMap((node) => (node.props.modifiers as { $type: string; tag?: number }[]).filter((modifier) => modifier.$type === "tag"))
      .map((modifier) => modifier.tag);
  const validateButton = () => screen.getByTestId("duration-wheel-validate");

  describe("iOS (roue native)", () => {
    beforeEach(() => setPlatform("ios"));

    it("PRE4-3.4/AC2 — de haut en bas : ✕/✓, « Aucune durée, à l’échec », un filet, la roue ; minutes 00..58 sans 59 ; secondes au pas de 1, 00 puis 01..59 à 0 min (D-430), 00..59 ailleurs, 00..55 à 58 min", () => {
      render(<DurationWheelPicker {...targetProps()} />);
      expect(screen.getByTestId("duration-wheel-failure-option-text").props.children).toBe("Aucune durée, à l’échec");
      // Ordre de rendu dans la surface : barre, option, filet, bloc de la roue.
      const ids = screen
        .getByTestId("duration-wheel-picker")
        .findAll((node) => typeof node.type === "string" && typeof node.props.testID === "string")
        .map((node) => node.props.testID as string);
      const at = (id: string) => ids.indexOf(id);
      expect(at("duration-wheel-toolbar")).toBeGreaterThanOrEqual(0);
      expect(at("duration-wheel-toolbar")).toBeLessThan(at("duration-wheel-failure-option"));
      expect(at("duration-wheel-failure-option")).toBeLessThan(at("duration-wheel-failure-option-rule"));
      expect(at("duration-wheel-failure-option-rule")).toBeLessThan(at("duration-wheel-block"));
      expect(nativeValues("duration-wheel-minutes")).toEqual(Array.from({ length: 59 }, (_, index) => index));
      expect(nativeValues("duration-wheel-seconds")).toEqual([0, ...Array.from({ length: 59 }, (_, index) => index + 1)]);
      nativeChange("duration-wheel-minutes", 10);
      expect(nativeValues("duration-wheel-seconds")).toEqual(Array.from({ length: 60 }, (_, index) => index));
      nativeChange("duration-wheel-minutes", 58);
      expect(nativeValues("duration-wheel-seconds")).toEqual(Array.from({ length: 56 }, (_, index) => index));
    });

    it("PRE4-3.4/AC2 — à 58 min, une seconde au-delà de 55 rejoint 55 ; ✓ applique 3535 au plus (58:55)", () => {
      const props = targetProps(false, 57 * 60 + 58);
      render(<DurationWheelPicker {...props} />);
      nativeChange("duration-wheel-minutes", 58);
      expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(55);
      fireEvent.press(validateButton());
      expect(props.onValidate).toHaveBeenCalledWith(3535);
    });

    it("PRE4-3.4/AC3 — Cible 30 s : roue sur 00:30, active, option à 45 % ; Cible échec : option à 100 %, 00:00 atténué à 45 %", () => {
      const view = render(<DurationWheelPicker {...targetProps(false, 30)} />);
      expect(screen.getByTestId("duration-wheel-minutes").props.selection).toBe(0);
      expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(30);
      expect(opacityOf("duration-wheel-failure-option")).toBe(0.45);
      expect(opacityOf("duration-wheel-block")).toBe(1);
      view.unmount();
      render(<DurationWheelPicker {...targetProps(true, 0)} />);
      expect(opacityOf("duration-wheel-failure-option")).toBe(1);
      expect(opacityOf("duration-wheel-block")).toBe(0.45);
      expect(screen.getByTestId("duration-wheel-minutes").props.selection).toBe(0);
      expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(0);
      // ✓ disponible sur l'échec.
      expect(validateButton().props.accessibilityState?.disabled).not.toBe(true);
    });

    it("PRE4-3.4/AC5 — toucher l'option : 100 %, roue à 00:00 atténuée ; ✓ émet une SeriesTarget FAILURE, jamais un nombre", () => {
      const props = targetProps(false, 30);
      render(<DurationWheelPicker {...props} />);
      fireEvent.press(screen.getByTestId("duration-wheel-failure-option"));
      expect(opacityOf("duration-wheel-failure-option")).toBe(1);
      expect(opacityOf("duration-wheel-block")).toBe(0.45);
      expect(screen.getByTestId("duration-wheel-minutes").props.selection).toBe(0);
      expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(0);
      // Aucune haptique ajoutée.
      expect(Haptics.selectionAsync).not.toHaveBeenCalled();
      fireEvent.press(validateButton());
      expect(props.onValidateFailure).toHaveBeenCalledWith({ kind: "FAILURE" });
      expect(props.onValidate).not.toHaveBeenCalled();
    });

    it("PRE4-3.4/AC6 — échec choisi, tourner la roue jusqu'à 00:30 revient au numérique sans déverrouillage ; jamais de disabled sur la roue", () => {
      const props = targetProps(true, 0);
      const { UNSAFE_root } = render(<DurationWheelPicker {...props} />);
      for (const testID of ["duration-wheel-block", "duration-wheel-minutes", "duration-wheel-seconds"]) {
        expect(screen.getByTestId(testID).props.disabled).toBeUndefined();
      }
      nativeChange("duration-wheel-seconds", 30);
      expect(opacityOf("duration-wheel-failure-option")).toBe(0.45);
      expect(opacityOf("duration-wheel-block")).toBe(1);
      fireEvent.press(validateButton());
      expect(props.onValidate).toHaveBeenCalledWith(30);
      expect(props.onValidateFailure).not.toHaveBeenCalled();
      expect(UNSAFE_root.findAllByType(ScrollView)).toHaveLength(0);
    });

    it("PRE4-3.4/AC7 — sélection numérique amenée sur 00:00 : ✓ indisponible (disabled, état d'accessibilité, 0,45), un appui n'appelle rien ; ✕ disponible ; pas d'échec", () => {
      const props = targetProps(false, 30);
      render(<DurationWheelPicker {...props} />);
      expect(validateButton().props.accessibilityState?.disabled).not.toBe(true);
      nativeChange("duration-wheel-seconds", 0);
      expect(validateButton().props.accessibilityState).toMatchObject({ disabled: true });
      expect(opacityOf("duration-wheel-validate")).toBe(0.45);
      fireEvent.press(validateButton());
      expect(props.onValidate).not.toHaveBeenCalled();
      expect(props.onValidateFailure).not.toHaveBeenCalled();
      expect(opacityOf("duration-wheel-failure-option")).toBe(0.45);
      expect(opacityOf("duration-wheel-block")).toBe(1);
      fireEvent.press(screen.getByTestId("duration-wheel-cancel"));
      expect(props.onCancel).toHaveBeenCalledTimes(1);
      // Revenir à 00:01, le minimum (D-430), rend le ✓.
      nativeChange("duration-wheel-seconds", 1);
      fireEvent.press(validateButton());
      expect(props.onValidate).toHaveBeenCalledWith(1);
    });

    it("PRE4-3.4/AC11 — option annoncée par son état natif selected (un seul canal), libellé du lexique ; cible tactile ≥ 44 pour 30 de haut", () => {
      render(<DurationWheelPicker {...targetProps(false, 30)} />);
      const option = () => screen.getByTestId("duration-wheel-failure-option");
      expect(option().props.accessibilityLabel).toBe("Aucune durée, à l’échec");
      // Un seul canal d'annonce : l'état natif « sélectionné » (pas de valeur textuelle en double).
      expect(option().props.accessibilityValue?.text).toBeUndefined();
      expect(option().props.accessibilityState).toMatchObject({ selected: false });
      const style = StyleSheet.flatten(option().props.style);
      expect(style.height).toBe(30);
      const hitSlop = option().props.hitSlop as { top: number; bottom: number };
      expect((style.height as number) + hitSlop.top + hitSlop.bottom).toBeGreaterThanOrEqual(44);
      fireEvent.press(option());
      expect(option().props.accessibilityState).toMatchObject({ selected: true });
    });

    it("PRE4-3.4/AC12 — sans les props, comportement inchangé : ni option ni bloc, ✓ disponible sur 00:00, minutes 00..59, secondes 00..59", () => {
      const props = renderProps({ totalSeconds: 0 });
      render(<DurationWheelPicker {...props} />);
      expect(screen.queryByTestId("duration-wheel-failure-option")).toBeNull();
      expect(screen.queryByTestId("duration-wheel-block")).toBeNull();
      expect(validateButton().props.accessibilityState?.disabled).not.toBe(true);
      expect(StyleSheet.flatten(validateButton().props.style).opacity).toBeUndefined();
      expect(nativeValues("duration-wheel-minutes")).toHaveLength(60);
      expect(nativeValues("duration-wheel-seconds")).toEqual(Array.from({ length: 60 }, (_, index) => index));
      fireEvent.press(validateButton());
      expect(props.onValidate).toHaveBeenCalledWith(0);
    });
  });

  describe("Android/web (roulette Legacy, parité)", () => {
    beforeEach(() => setPlatform("android"));

    it("PRE4-3.4/AC12 — Legacy : même option et mêmes transitions : échec → 00:00 atténué → FAILURE émise ; tourner → numérique ; 00:00 → ✓ indisponible", () => {
      const props = targetProps(false, 30);
      render(<DurationWheelPicker {...props} />);
      expect(opacityOf("duration-wheel-failure-option")).toBe(0.45);
      expect(opacityOf("duration-wheel-block")).toBe(1);
      // Secondes à 0 min : 00 puis 01..59 (D-430 ; index 30 = 30 s).
      expect(screen.getByTestId("duration-wheel-seconds-item-0")).toBeTruthy();
      expect(screen.getByTestId("duration-wheel-seconds-item-1")).toBeTruthy();
      expect(screen.getByTestId("duration-wheel-seconds-item-59")).toBeTruthy();

      fireEvent.press(screen.getByTestId("duration-wheel-failure-option"));
      expect(opacityOf("duration-wheel-failure-option")).toBe(1);
      expect(opacityOf("duration-wheel-block")).toBe(0.45);
      fireEvent.press(validateButton());
      expect(props.onValidateFailure).toHaveBeenCalledWith({ kind: "FAILURE" });
      expect(props.onValidate).not.toHaveBeenCalled();

      scrollTo(screen.getByTestId("duration-wheel-seconds"), ITEM_HEIGHT * 30);
      expect(opacityOf("duration-wheel-failure-option")).toBe(0.45);
      expect(opacityOf("duration-wheel-block")).toBe(1);
      fireEvent.press(validateButton());
      expect(props.onValidate).toHaveBeenCalledWith(30);

      scrollTo(screen.getByTestId("duration-wheel-seconds"), 0);
      expect(validateButton().props.accessibilityState).toMatchObject({ disabled: true });
      fireEvent.press(validateButton());
      expect(props.onValidate).toHaveBeenCalledTimes(1);
      expect(props.onValidateFailure).toHaveBeenCalledTimes(1);
    });

    it("PRE4-3.4/AC2 — Legacy : minutes 00..58, à 58 min les secondes s'arrêtent à 55 ; ✓ applique 3535", () => {
      const props = targetProps(false, 30);
      render(<DurationWheelPicker {...props} />);
      expect(screen.getByTestId("duration-wheel-minutes-item-58")).toBeTruthy();
      expect(screen.queryByTestId("duration-wheel-minutes-item-59")).toBeNull();
      scrollTo(screen.getByTestId("duration-wheel-minutes"), ITEM_HEIGHT * 58);
      expect(screen.getByTestId("duration-wheel-seconds-item-55")).toBeTruthy();
      expect(screen.queryByTestId("duration-wheel-seconds-item-56")).toBeNull();
      scrollTo(screen.getByTestId("duration-wheel-seconds"), ITEM_HEIGHT * 80);
      fireEvent.press(validateButton());
      expect(props.onValidate).toHaveBeenCalledWith(3535);
    });
  });
});

/** PRE-4 story 3.4 — revue : recalage des secondes, accessibilité Legacy, union de props. */
describe("PRE4-3.4 — DurationWheelPicker : recalage et parité (revue)", () => {
  // PRE-5 (D-430, AD-31) : bornes de la Cible Durée 1..3535.
  const BOUNDS = { min: 1, max: 3535 } as const;
  let originalPlatformOS: typeof Platform.OS;

  afterEach(() => {
    Platform.OS = originalPlatformOS;
  });

  function setPlatform(os: typeof Platform.OS) {
    originalPlatformOS = Platform.OS;
    Platform.OS = os;
  }

  function boundedProps(totalSeconds: number) {
    const onValidateFailure = jest.fn();
    return {
      ...renderProps({
        totalSeconds,
        targetBounds: BOUNDS,
        failureOption: { label: "Aucune durée, à l’échec", initiallySelected: false, onValidateFailure },
      }),
      onValidateFailure,
    };
  }

  const nativeChange = (testID: string, selection: number) =>
    fireEvent(screen.getByTestId(testID), "selectionChange", { nativeEvent: { selection } });
  const validateButton = () => screen.getByTestId("duration-wheel-validate");

  it("PRE4-3.4/AC12 — union de props : failureOption exige targetBounds (vérifié par le typage)", () => {
    setPlatform("ios");
    const props = renderProps({ totalSeconds: 30 });
    // @ts-expect-error — `failureOption` sans `targetBounds` : 00:00 resterait validable.
    const invalid = <DurationWheelPicker {...props} failureOption={{ label: "x", initiallySelected: false, onValidateFailure: jest.fn() }} />;
    expect(invalid).toBeTruthy();
  });

  describe("iOS", () => {
    beforeEach(() => setPlatform("ios"));

    it("PRE4-3.4/AC2 — une seconde native absente de la liste (57 reçu à 58 min) est ramenée à 55 : brouillon = valeur affichée, ✓ → 3535", () => {
      const props = boundedProps(58 * 60);
      render(<DurationWheelPicker {...props} />);
      nativeChange("duration-wheel-seconds", 57);
      expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(55);
      fireEvent.press(validateButton());
      expect(props.onValidate).toHaveBeenCalledWith(3535);
    });

    it("PRE4-3.4/AC7, D-430 — 01:02 descendu à 0 min : 00:02 gardée (au-dessus du minimum de 1 s), jamais 00:00 ; ✓ disponible → 2", () => {
      const props = boundedProps(62);
      render(<DurationWheelPicker {...props} />);
      nativeChange("duration-wheel-minutes", 0);
      expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(2);
      expect(validateButton().props.accessibilityState?.disabled).not.toBe(true);
      fireEvent.press(validateButton());
      expect(props.onValidate).toHaveBeenCalledWith(2);
    });
  });

  describe("Android/web (Legacy)", () => {
    beforeEach(() => setPlatform("android"));

    it("PRE4-3.4/AC7, D-430 — Legacy : 01:02 descendu à 0 min : 00:02 gardée, jamais 00:00 ; ✓ → 2", () => {
      const props = boundedProps(62);
      render(<DurationWheelPicker {...props} />);
      scrollTo(screen.getByTestId("duration-wheel-minutes"), 0);
      expect(screen.getByTestId("duration-wheel-seconds").props.accessibilityValue.now).toBe(2);
      expect(validateButton().props.accessibilityState?.disabled).not.toBe(true);
      fireEvent.press(validateButton());
      expect(props.onValidate).toHaveBeenCalledWith(2);
    });

    it("PRE4-3.4/AC2 — Legacy : index des secondes remappé au changement de minute : 00:30 → minutes seules à 1 → ✓ 90 ; 57:58 → minutes seules à 58 → ✓ 3535", () => {
      const first = boundedProps(30);
      const view = render(<DurationWheelPicker {...first} />);
      scrollTo(screen.getByTestId("duration-wheel-minutes"), ITEM_HEIGHT);
      fireEvent.press(validateButton());
      expect(first.onValidate).toHaveBeenCalledWith(90);
      view.unmount();

      const second = boundedProps(57 * 60 + 58);
      render(<DurationWheelPicker {...second} />);
      scrollTo(screen.getByTestId("duration-wheel-minutes"), ITEM_HEIGHT * 58);
      expect(screen.getByTestId("duration-wheel-seconds").props.accessibilityValue).toMatchObject({ now: 55, max: 55 });
      fireEvent.press(validateButton());
      expect(second.onValidate).toHaveBeenCalledWith(3535);
    });

    it("PRE4-3.4/AC11 — Legacy : accessibilityValue.now suit la valeur courante ; l'action increment part de 00:30 → ✓ 31", () => {
      const props = boundedProps(30);
      render(<DurationWheelPicker {...props} />);
      const seconds = () => screen.getByTestId("duration-wheel-seconds");
      expect(seconds().props.accessibilityValue).toMatchObject({ now: 30 });
      fireEvent(seconds(), "accessibilityAction", { nativeEvent: { actionName: "increment" } });
      expect(seconds().props.accessibilityValue).toMatchObject({ now: 31 });
      fireEvent.press(validateButton());
      expect(props.onValidate).toHaveBeenCalledWith(31);
      // Après l'option échec, la valeur annoncée est celle de la roue (00:00).
      fireEvent.press(screen.getByTestId("duration-wheel-failure-option"));
      expect(seconds().props.accessibilityValue).toMatchObject({ now: 0 });
      expect(screen.getByTestId("duration-wheel-minutes").props.accessibilityValue).toMatchObject({ now: 0 });
    });
  });
});

/**
 * PRE-4 story 3.7 (FR-14-03, H8 ; revue) — bornes génériques sous `targetBounds` : la
 * colonne des minutes commence à `floor(min / 60)` dès que `min ≥ 60`, sans aucune minute
 * dont la liste de secondes serait vide (iOS et Legacy). Sous 60 s, story 3.4 inchangée.
 */
describe("PRE4-3.7 — DurationWheelPicker : bornes de Durée totale (borne basse ≥ 60 s)", () => {
  let originalPlatformOS: typeof Platform.OS;
  afterEach(() => {
    Platform.OS = originalPlatformOS;
  });
  function setPlatform(os: typeof Platform.OS) {
    originalPlatformOS = Platform.OS;
    Platform.OS = os;
  }
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);
  const nativeValues = (testID: string) =>
    screen
      .getByTestId(testID)
      .findAll((node) => typeof node.type === "string" && Array.isArray(node.props.modifiers))
      .flatMap((node) => (node.props.modifiers as { $type: string; tag?: number }[]).filter((modifier) => modifier.$type === "tag"))
      .map((modifier) => modifier.tag);
  const nativeChange = (testID: string, selection: number) =>
    fireEvent(screen.getByTestId(testID), "selectionChange", { nativeEvent: { selection } });
  // d = 60 s, p = 10 s : T(1) = 70 s ; T(99) = 6 930 s plafonné à 5 999 s.
  const T1_70 = { min: 1 * (60 + 10), max: 5999 } as const;
  // Bilatéral un côté après l'autre, d = 25 s, p = 5 s, PC = 7 s : T(N) = 2N(d + p) + PC.
  const BILATERAL = { min: 2 * 1 * 30 + 7, max: 2 * 99 * 30 + 7 } as const;

  it("PRE4-3.7/AC4 — iOS : T(1) = 70 s — minutes 01..99, secondes 10..59 à 1 min ; ouverture exacte (03:30) ; ✓ applique la valeur choisie", () => {
    setPlatform("ios");
    const props = renderProps({ totalSeconds: 3 * 70, targetBounds: T1_70 });
    render(<DurationWheelPicker {...props} />);
    expect(nativeValues("duration-wheel-minutes")).toEqual(range(1, 99));
    expect(screen.getByTestId("duration-wheel-minutes").props.selection).toBe(3);
    expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(30);
    nativeChange("duration-wheel-minutes", 1);
    expect(nativeValues("duration-wheel-seconds")).toEqual(range(10, 59));
    expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(30);
    nativeChange("duration-wheel-seconds", 10);
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(props.onValidate).toHaveBeenCalledWith(70);
  });

  it("PRE4-3.7/AC4 — iOS : bilatéral 67..5947 — secondes 07..59 à 1 min, 00..07 à 99 min ; 99:30 → 99:07", () => {
    setPlatform("ios");
    const props = renderProps({ totalSeconds: 4 * 2 * 30 + 7, targetBounds: BILATERAL });
    render(<DurationWheelPicker {...props} />);
    expect(nativeValues("duration-wheel-minutes")).toEqual(range(1, 99));
    nativeChange("duration-wheel-minutes", 1);
    expect(nativeValues("duration-wheel-seconds")).toEqual(range(7, 59));
    nativeChange("duration-wheel-seconds", 30);
    nativeChange("duration-wheel-minutes", 99);
    expect(nativeValues("duration-wheel-seconds")).toEqual(range(0, 7));
    expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(7);
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(props.onValidate).toHaveBeenCalledWith(5947);
  });

  it("PRE4-3.7/AC4 — Legacy : T(1) = 70 s — première minute 01 (aucune 00), index remappé ; ✓ 70 puis 5999", () => {
    setPlatform("android");
    const props = renderProps({ totalSeconds: 3 * 70, targetBounds: T1_70 });
    const view = render(<DurationWheelPicker {...props} />);
    expect(screen.queryByTestId("duration-wheel-minutes-item-0")).toBeNull();
    expect(screen.getByTestId("duration-wheel-minutes-item-1")).toBeTruthy();
    expect(screen.getByTestId("duration-wheel-minutes-item-99")).toBeTruthy();
    expect(screen.getByTestId("duration-wheel-minutes").props.accessibilityValue).toMatchObject({ now: 3, max: 99 });
    // Index 0 de la colonne = minute 1 ; secondes 10..59 (30 conservée).
    scrollTo(screen.getByTestId("duration-wheel-minutes"), 0);
    expect(screen.getByTestId("duration-wheel-minutes").props.accessibilityValue).toMatchObject({ now: 1 });
    expect(screen.queryByTestId("duration-wheel-seconds-item-9")).toBeNull();
    expect(screen.getByTestId("duration-wheel-seconds-item-10")).toBeTruthy();
    expect(screen.getByTestId("duration-wheel-seconds").props.accessibilityValue).toMatchObject({ now: 30 });
    // Secondes en tête de liste : index 0 = 10 s → 1:10 = 70 s.
    scrollTo(screen.getByTestId("duration-wheel-seconds"), 0);
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(props.onValidate).toHaveBeenCalledWith(70);
    view.unmount();
    const top = renderProps({ totalSeconds: 3 * 70, targetBounds: T1_70 });
    render(<DurationWheelPicker {...top} />);
    scrollTo(screen.getByTestId("duration-wheel-minutes"), ITEM_HEIGHT * 98);
    scrollTo(screen.getByTestId("duration-wheel-seconds"), ITEM_HEIGHT * 80);
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(top.onValidate).toHaveBeenCalledWith(5999);
  });

  it("PRE4-3.7/AC4 — Legacy : bilatéral 67..5947 — à 99 min, secondes 00..07 ; ✓ 5947", () => {
    setPlatform("android");
    const props = renderProps({ totalSeconds: 4 * 2 * 30 + 7, targetBounds: BILATERAL });
    render(<DurationWheelPicker {...props} />);
    scrollTo(screen.getByTestId("duration-wheel-minutes"), ITEM_HEIGHT * 98);
    expect(screen.getByTestId("duration-wheel-seconds-item-7")).toBeTruthy();
    expect(screen.queryByTestId("duration-wheel-seconds-item-8")).toBeNull();
    scrollTo(screen.getByTestId("duration-wheel-seconds"), ITEM_HEIGHT * 80);
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
    expect(props.onValidate).toHaveBeenCalledWith(5947);
  });

  it("PRE4-3.7 — non-régression 3.4 (1..3535 depuis D-430) : minutes 00..58 avec la minute 0, `00` puis 01..59", () => {
    setPlatform("ios");
    render(<DurationWheelPicker {...renderProps({ totalSeconds: 30, targetBounds: { min: 1, max: 3535 } })} />);
    expect(nativeValues("duration-wheel-minutes")).toEqual(range(0, 58));
    expect(nativeValues("duration-wheel-seconds")).toEqual([0, ...range(1, 59)]);
  });
});
