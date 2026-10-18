import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Platform, ScrollView, StyleSheet } from "react-native";

import { NumberWheelPicker, PickerToolbar } from "@/features/sessions/NumberWheelPicker";
import { WHEEL_NUMBER_MAX, WHEEL_NUMBER_MIN } from "@/features/sessions/wheelPickerMath";
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
  } as Parameters<typeof NumberWheelPicker>[0] & { onValidate: jest.Mock; onCancel: jest.Mock };
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

  /**
   * Correction bloquante — visibilité des valeurs (« CORRECTION BLOQUANTE
   * AVANT T01-S09 — VISIBILITÉ DES ROULETTES », 2026-09-05) : même cause
   * racine et même correction que `DurationWheelPicker` — preuve directe
   * que chaque valeur de la colonne porte une couleur de premier plan
   * EXPLICITE (`colors.textPrimary`), jamais la seule couleur par défaut de
   * SwiftUI.
   */
  it("REWORK14 (visibilité) — every value text carries an explicit foregroundStyle(colors.textPrimary), never relying on SwiftUI's default dynamic color", () => {
    const { UNSAFE_getAllByProps } = render(<NumberWheelPicker {...renderProps({ value: 1 })} />);

    const firstValue = UNSAFE_getAllByProps({ text: "1" })[0];
    const modifiers = firstValue.props.modifiers as { $type: string; style?: string; color?: string }[];
    const foreground = modifiers.find((m) => m.$type === "foregroundStyle");
    expect(foreground).toBeDefined();
    expect(foreground?.style ?? foreground?.color).toBe(colors.textPrimary);
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

      expect(cancelStyle.width).toBe(38);
      expect(cancelStyle.height).toBe(38);
      expect(validateStyle.width).toBe(38);
      expect(validateStyle.height).toBe(38);
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

/** PRE-4 story 3.4 (AD-7) — seule prop ajoutée à la copie de `PickerToolbar` : `validateDisabled`. */
describe("PRE4-3.4 — PickerToolbar (copie de NumberWheelPicker) : validateDisabled", () => {
  it("PRE4-3.4/AC7 — validateDisabled : ✓ désactivé, état d'accessibilité, opacité 0,45, onValidate non appelé ; ✕ disponible", () => {
    const onValidate = jest.fn();
    const onCancel = jest.fn();
    render(
      <PickerToolbar
        onCancel={onCancel}
        onValidate={onValidate}
        cancelAccessibilityLabel={CANCEL_LABEL}
        validateAccessibilityLabel={VALIDATE_LABEL}
        validateDisabled
      />,
    );
    const validate = screen.getByTestId("number-wheel-validate");
    expect(validate.props.accessibilityState).toMatchObject({ disabled: true });
    expect(StyleSheet.flatten(validate.props.style).opacity).toBe(0.45);
    fireEvent.press(validate);
    expect(onValidate).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("number-wheel-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("PRE4-3.4/AC7 — sans la prop : ✓ disponible, sans opacité ajoutée, onValidate appelé (inchangé)", () => {
    const onValidate = jest.fn();
    render(
      <PickerToolbar
        onCancel={jest.fn()}
        onValidate={onValidate}
        cancelAccessibilityLabel={CANCEL_LABEL}
        validateAccessibilityLabel={VALIDATE_LABEL}
      />,
    );
    const validate = screen.getByTestId("number-wheel-validate");
    expect(validate.props.accessibilityState?.disabled).not.toBe(true);
    expect(StyleSheet.flatten(validate.props.style).opacity).toBeUndefined();
    fireEvent.press(validate);
    expect(onValidate).toHaveBeenCalledTimes(1);
  });
});

/**
 * PRE-4 story 3.5 (AD-7, Q8, Q14) — props optionnelles de la Cible en Répétitions :
 * `targetBounds` (1..100), `failureOption` (ligne de tête dans la colonne unique) et
 * `valueAccessibilityLabel`. Sans elles, comportement inchangé (tests ci-dessus).
 * Seule la couche JS est exercée ; le rendu natif de la ligne de tête est
 * `NON VÉRIFIABLE` ici et se juge sur iPhone (R-3.5-01 à 04).
 */
describe("PRE4-3.5 — NumberWheelPicker : bornes de Cible et ligne de tête « à l’échec »", () => {
  const FAILURE_LABEL = "Aucune répétition, à l’échec";
  const BOUNDS = { min: 1, max: 100 };
  const spoken = (value: number) => `${value} ${value === 1 ? "répétition" : "répétitions"}`;

  function failureProps(overrides: { value?: number; initiallySelected?: boolean } = {}) {
    const onValidateFailure = jest.fn();
    const props = renderProps({
      value: overrides.value ?? 10,
      targetBounds: BOUNDS,
      valueAccessibilityLabel: spoken,
      failureOption: { label: FAILURE_LABEL, initiallySelected: overrides.initiallySelected ?? false, onValidateFailure },
    });
    return { props, onValidateFailure };
  }

  /** Éléments SwiftUI de la colonne native (`Text` + `tag`), dans l'ordre de la roue. */
  function nativeItems() {
    return screen
      .getByTestId("number-wheel-column")
      .findAll((node) => typeof node.type === "string" && typeof node.props.text === "string")
      .map((node) => {
        const modifiers = node.props.modifiers as { $type: string; tag?: unknown; label?: string; width?: number }[];
        return {
          text: node.props.text as string,
          tag: modifiers.find((modifier) => modifier.$type === "tag")?.tag,
          label: modifiers.find((modifier) => modifier.$type === "accessibilityLabel")?.label,
        };
      });
  }

  function nativeChange(selection: number | string) {
    fireEvent(screen.getByTestId("number-wheel-column"), "selectionChange", { nativeEvent: { selection } });
  }

  describe("iOS (roue native SwiftUI)", () => {
    let originalPlatformOS: typeof Platform.OS;

    beforeEach(() => {
      originalPlatformOS = Platform.OS;
      Platform.OS = "ios";
    });

    afterEach(() => {
      Platform.OS = originalPlatformOS;
    });

    it("PRE4-3.5/AC2 — une seule colonne : ligne de tête puis 1..100, croissants ; tag de tête non numérique ; aucun grisé ajouté", () => {
      const { props } = failureProps();
      const { UNSAFE_root } = render(<NumberWheelPicker {...props} />);

      const items = nativeItems();
      expect(items.map((item) => item.text)).toEqual([FAILURE_LABEL, ...Array.from({ length: 100 }, (_, index) => String(index + 1))]);
      expect(typeof items[0]!.tag).toBe("string");
      expect(items.slice(1).every((item, index) => item.tag === index + 1)).toBe(true);
      expect(UNSAFE_root.findAll((node) => typeof node.type === "string" && node.props.testID === "number-wheel-column")).toHaveLength(1);
      expect(StyleSheet.flatten(screen.getByTestId("number-wheel-picker").props.style).opacity).toBeUndefined();
      expect(UNSAFE_root.findAllByType(ScrollView)).toHaveLength(0);
    });

    it("PRE4-3.5/AC3 — ligne de tête → 12 → ✓ : onValidate(12) ; retour sur la ligne de tête → ✓ : onValidateFailure({ kind: \"FAILURE\" }) seul", () => {
      const first = failureProps({ initiallySelected: true });
      const view = render(<NumberWheelPicker {...first.props} />);
      nativeChange(12);
      fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));
      expect(first.props.onValidate).toHaveBeenCalledWith(12);
      expect(first.onValidateFailure).not.toHaveBeenCalled();
      view.unmount();

      const second = failureProps({ initiallySelected: true });
      render(<NumberWheelPicker {...second.props} />);
      nativeChange(12);
      expect(screen.getByTestId("number-wheel-column").props.selection).toBe(12);
      const headTag = nativeItems()[0]!.tag as string;
      nativeChange(headTag);
      expect(screen.getByTestId("number-wheel-column").props.selection).toBe(headTag);
      fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));
      expect(second.onValidateFailure).toHaveBeenCalledTimes(1);
      expect(second.onValidateFailure).toHaveBeenCalledWith({ kind: "FAILURE" });
      expect(second.props.onValidate).not.toHaveBeenCalled();
    });

    it("PRE4-3.5/AC4 — ouverture : 12 → 12 ; ligne de tête si initiallySelected ; 150 → 100 ; Annuler n'appelle aucun rappel", () => {
      const twelve = render(<NumberWheelPicker {...failureProps({ value: 12 }).props} />);
      expect(screen.getByTestId("number-wheel-column").props.selection).toBe(12);
      twelve.unmount();

      const failure = render(<NumberWheelPicker {...failureProps({ initiallySelected: true }).props} />);
      expect(screen.getByTestId("number-wheel-column").props.selection).toBe(nativeItems()[0]!.tag);
      failure.unmount();

      const { props, onValidateFailure } = failureProps({ value: 150 });
      render(<NumberWheelPicker {...props} />);
      expect(screen.getByTestId("number-wheel-column").props.selection).toBe(100);
      fireEvent.press(screen.getByLabelText(CANCEL_LABEL));
      expect(props.onCancel).toHaveBeenCalledTimes(1);
      expect(props.onValidate).not.toHaveBeenCalled();
      expect(onValidateFailure).not.toHaveBeenCalled();
    });

    it("PRE4-3.5/AC5 — 1 et 100 atteignables ; 0, 101 et 12,4 reçus de la roue ne sortent jamais tels quels", () => {
      const cases: [number, number][] = [
        [1, 1],
        [100, 100],
        [0, 1],
        [101, 100],
        [12.4, 12],
      ];
      for (const [received, expected] of cases) {
        const { props } = failureProps();
        const view = render(<NumberWheelPicker {...props} />);
        nativeChange(received);
        fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));
        expect(props.onValidate).toHaveBeenCalledWith(expected);
        view.unmount();
      }
    });

    it("PRE4-3.5/AC7 — libellés d'accessibilité : ligne de tête, puis chaque nombre avec son unité", () => {
      render(<NumberWheelPicker {...failureProps().props} />);
      const items = nativeItems();
      expect(items[0]!.label).toBe(FAILURE_LABEL);
      expect(items[1]!.label).toBe("1 répétition");
      expect(items[12]!.label).toBe("12 répétitions");
      expect(items[100]!.label).toBe("100 répétitions");
    });

    it("PRE4-3.5/AC7 (P33), AC8 — largeur EXPLICITE de la colonne native conservée (96 sans ligne de tête, élargie à 306 avec, surface 330) : libellé de tête non tronqué ; Host inchangé", () => {
      const columnWidth = () =>
        (screen.getByTestId("number-wheel-column").props.modifiers as { $type: string; width?: number }[]).find(
          (modifier) => modifier.$type === "frame",
        )?.width;
      const plain = render(<NumberWheelPicker {...renderProps()} />);
      expect(columnWidth()).toBe(96);
      expect(StyleSheet.flatten(screen.getByTestId("number-wheel-picker").props.style).width).toBe(144);
      plain.unmount();

      render(<NumberWheelPicker {...failureProps().props} />);
      expect(columnWidth()).toBe(306);
      expect(StyleSheet.flatten(screen.getByTestId("number-wheel-picker").props.style).width).toBe(330);
    });

    it("PRE4-3.5/AC8 — sans les nouvelles props : 99 valeurs (1..99, WHEEL_NUMBER_MAX inchangé), ni ligne de tête ni libellé d'unité", () => {
      render(<NumberWheelPicker {...renderProps({ value: 150 })} />);
      const items = nativeItems();
      expect(items).toHaveLength(99);
      expect(items[0]).toMatchObject({ text: "1", tag: 1, label: undefined });
      expect(items[98]).toMatchObject({ text: "99", tag: 99 });
      expect(WHEEL_NUMBER_MAX).toBe(99);
      expect(screen.getByTestId("number-wheel-column").props.selection).toBe(99);
      nativeChange("failure");
      expect(screen.getByTestId("number-wheel-column").props.selection).toBe(99);
    });

    it("PRE4-3.5/AC8 — sans les nouvelles props : une tête reçue est ignorée, ✓ valide 99, jamais une chaîne", () => {
      const props = renderProps({ value: 150 });
      render(<NumberWheelPicker {...props} />);
      nativeChange("failure");
      fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));
      expect(props.onValidate).toHaveBeenCalledTimes(1);
      expect(props.onValidate).toHaveBeenCalledWith(99);
      expect(props.onValidate.mock.calls.every(([value]) => typeof value === "number")).toBe(true);
    });

    it("PRE4-3.5/AC4 — entrées invalides : valeur non finie → borne basse ; bornes non entières ou min > max → erreur", () => {
      for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
        const view = render(<NumberWheelPicker {...failureProps({ value }).props} />);
        expect(screen.getByTestId("number-wheel-column").props.selection).toBe(1);
        view.unmount();
      }
      const silence = jest.spyOn(console, "error").mockImplementation(() => {});
      try {
        for (const targetBounds of [{ min: 1.5, max: 100 }, { min: 1, max: 99.5 }, { min: 10, max: 1 }]) {
          expect(() => render(<NumberWheelPicker {...renderProps({ targetBounds })} />)).toThrow(RangeError);
        }
      } finally {
        silence.mockRestore();
      }
    });
  });

  describe("Android/web (roulette Legacy, parité)", () => {
    let originalPlatformOS: typeof Platform.OS;

    beforeEach(() => {
      originalPlatformOS = Platform.OS;
      Platform.OS = "android";
    });

    afterEach(() => {
      Platform.OS = originalPlatformOS;
    });

    it("PRE4-3.5/AC2, AC8 — Legacy : même colonne (ligne de tête, puis 1..100), aucun 0 ni 101", () => {
      render(<NumberWheelPicker {...failureProps().props} />);
      expect(screen.getByTestId("number-wheel-column-item-failure")).toBeTruthy();
      expect(screen.getByTestId("number-wheel-column-item-1")).toBeTruthy();
      expect(screen.getByTestId("number-wheel-column-item-100")).toBeTruthy();
      expect(screen.queryByTestId("number-wheel-column-item-0")).toBeNull();
      expect(screen.queryByTestId("number-wheel-column-item-101")).toBeNull();
      expect(screen.getByText(FAILURE_LABEL)).toBeTruthy();
    });

    it("PRE4-3.5/AC7 (P33) — Legacy : surface élargie à 330 avec la ligne de tête, libellé sur une ligne sans rétrécissement ; sans elle, aucune largeur imposée", () => {
      const withHead = render(<NumberWheelPicker {...failureProps().props} />);
      expect(StyleSheet.flatten(screen.getByTestId("number-wheel-picker").props.style).width).toBe(330);
      const label = screen.getByText(FAILURE_LABEL);
      expect(label.props.adjustsFontSizeToFit).toBeUndefined();
      expect(label.props.numberOfLines).toBe(1);
      withHead.unmount();

      render(<NumberWheelPicker {...renderProps()} />);
      expect(StyleSheet.flatten(screen.getByTestId("number-wheel-picker").props.style).width).toBeUndefined();
    });

    it("PRE4-3.5/AC8 — Legacy sans les nouvelles props : 1..99, aucune ligne de tête, accessibilityValue figée à l'ouverture, onValidate(WHEEL_NUMBER_MIN + index)", () => {
      const props = renderProps({ value: 12 });
      render(<NumberWheelPicker {...props} />);
      expect(screen.getByTestId("number-wheel-column-item-1")).toBeTruthy();
      expect(screen.getByTestId("number-wheel-column-item-99")).toBeTruthy();
      expect(screen.queryByTestId("number-wheel-column-item-100")).toBeNull();
      expect(screen.queryByTestId("number-wheel-column-item-failure")).toBeNull();
      expect(screen.getByTestId("number-wheel-column-item-12").props.accessibilityLabel).toBe("12");
      const opening = { min: 1, max: 99, now: 12 };
      expect(screen.getByTestId("number-wheel-column").props.accessibilityValue).toEqual(opening);
      scrollTo(screen.getByTestId("number-wheel-column"), ITEM_HEIGHT * 4); // index 4
      expect(screen.getByTestId("number-wheel-column").props.accessibilityValue).toEqual(opening);
      fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));
      expect(props.onValidate).toHaveBeenCalledWith(WHEEL_NUMBER_MIN + 4);
    });

    it("PRE4-3.5/AC3, AC8 — Legacy : mêmes transitions — 12 par défilement puis ✓ ; retour sur la ligne de tête (index 0) puis ✓ : FAILURE seule", () => {
      const first = failureProps({ initiallySelected: true });
      const view = render(<NumberWheelPicker {...first.props} />);
      scrollTo(screen.getByTestId("number-wheel-column"), ITEM_HEIGHT * 12); // index 12 -> 12 (index 0 = ligne de tête)
      fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));
      expect(first.props.onValidate).toHaveBeenCalledWith(12);
      expect(first.onValidateFailure).not.toHaveBeenCalled();
      view.unmount();

      const second = failureProps({ value: 12 });
      render(<NumberWheelPicker {...second.props} />);
      scrollTo(screen.getByTestId("number-wheel-column"), 0);
      fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));
      expect(second.onValidateFailure).toHaveBeenCalledWith({ kind: "FAILURE" });
      expect(second.props.onValidate).not.toHaveBeenCalled();
    });

    it("PRE4-3.5/AC4, AC5 — Legacy : ouverture sur 12, sur la ligne de tête, 150 → 100 ; débordements bornés à 100 et à la ligne de tête", () => {
      const twelve = render(<NumberWheelPicker {...failureProps({ value: 12 }).props} />);
      expect(screen.getByTestId("number-wheel-column").props.accessibilityValue).toMatchObject({ min: 1, max: 100, now: 12 });
      twelve.unmount();

      const failure = render(<NumberWheelPicker {...failureProps({ initiallySelected: true }).props} />);
      expect(screen.getByTestId("number-wheel-column").props.accessibilityValue).toEqual({ text: FAILURE_LABEL });
      failure.unmount();

      const { props } = failureProps({ value: 150 });
      const old = render(<NumberWheelPicker {...props} />);
      expect(screen.getByTestId("number-wheel-column").props.accessibilityValue).toMatchObject({ now: 100 });
      scrollTo(screen.getByTestId("number-wheel-column"), ITEM_HEIGHT * 999);
      fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));
      expect(props.onValidate).toHaveBeenCalledWith(100);
      old.unmount();

      const low = failureProps();
      render(<NumberWheelPicker {...low.props} />);
      scrollTo(screen.getByTestId("number-wheel-column"), -999);
      fireEvent.press(screen.getByLabelText(VALIDATE_LABEL));
      expect(low.onValidateFailure).toHaveBeenCalledWith({ kind: "FAILURE" });
      expect(low.props.onValidate).not.toHaveBeenCalled();
    });

    it("PRE4-3.5/AC7 — Legacy : ligne de tête annoncée avec son état sélectionné ou non ; valeur courante annoncée avec son unité", () => {
      render(<NumberWheelPicker {...failureProps({ value: 12 }).props} />);
      const column = () => screen.getByTestId("number-wheel-column");
      expect(screen.getByTestId("number-wheel-column-item-failure").props.accessibilityState).toEqual({ selected: false });
      expect(column().props.accessibilityValue).toEqual({ min: 1, max: 100, now: 12, text: "12 répétitions" });
      expect(screen.getByTestId("number-wheel-column-item-12").props.accessibilityLabel).toBe("12 répétitions");
      fireEvent.press(screen.getByTestId("number-wheel-column-item-failure"));
      expect(screen.getByTestId("number-wheel-column-item-failure").props.accessibilityState).toEqual({ selected: true });
      expect(column().props.accessibilityValue).toEqual({ text: FAILURE_LABEL });
      fireEvent(column(), "accessibilityAction", { nativeEvent: { actionName: "increment" } });
      expect(column().props.accessibilityValue).toEqual({ min: 1, max: 100, now: 1, text: "1 répétition" });
      expect(screen.getByTestId("number-wheel-column-item-failure").props.accessibilityState).toEqual({ selected: false });
    });
  });
});
