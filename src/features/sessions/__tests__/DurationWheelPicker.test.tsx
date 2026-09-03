import { fireEvent, render, screen } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Platform } from "react-native";

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

/**
 * `Platform.OS` par défaut dans cet environnement Jest (`jest-expo`) est
 * `"ios"` — hérité par `DurationWheelPicker` (`PHASE02 REWORK01 ADDENDUM —
 * NATIVE APPLE WHEEL TARGET`, 2026-09-03), qui délègue alors à la roulette
 * native SwiftUI, jamais à la réimplémentation maison ci-dessous testée.
 * Tout ce bloc `describe` porte sur le chemin Android/web (`LegacyDuration
 * WheelPicker`, réel, toujours livré pour ces plateformes) — forcé
 * explicitement, restauré après chaque test pour ne jamais fuir vers les
 * tests de la roulette native plus bas dans ce fichier.
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
    // Pas de 5 (CE-T01-07/14) : la dernière valeur atteignable est 55, pas 59.
    expect(seconds.props.accessibilityValue).toEqual({ min: 0, max: 55, now: 0 });
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

    // Le décalage de défilement reste indexé (0..11, pas de 5) — la
    // colonne secondes convertit chaque index en valeur (`index × 5`)
    // avant `onChange`.
    scrollTo(seconds, ITEM_HEIGHT * 1); // index 1 -> 5 s
    scrollTo(seconds, ITEM_HEIGHT * 2); // index 2 -> 10 s
    scrollTo(seconds, ITEM_HEIGHT * 3); // index 3 -> 15 s

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenNthCalledWith(1, 5);
    expect(onChange).toHaveBeenNthCalledWith(2, 10);
    expect(onChange).toHaveBeenNthCalledWith(3, 15);
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
    scrollTo(seconds, ITEM_HEIGHT * 3); // index 3 -> + 15 s

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

  it("clamps the upper bound: an overscrolled excessive offset never reports a seconds index above the last step, total capped at 59 min 55 s (3595)", () => {
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

    // 59 min (index 59) + 55 s (index clampé à 11, pas de 5) = 3595, pas 3599
    // — 59 s n'est plus une valeur atteignable par la roulette.
    expect(onChange).toHaveBeenLastCalledWith(3595);
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

      // 99 min + 55 s (pas de 5, index clampé à 11) = 5995, pas 5999.
      expect(onChange).toHaveBeenLastCalledWith(5995);
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
      max: 55,
      now: 15,
    });
  });

  describe("hiérarchie visuelle (CE-T01-07, AUD-05 — T01_S01_S08_CONFORMITY_AUDIT_20260902.md)", () => {
    it("renders a central selection band and edge fade overlays, non-interactive, for both columns", () => {
      render(
        <DurationWheelPicker
          totalSeconds={0}
          onChange={jest.fn()}
          minutesAccessibilityLabel="Minutes"
          secondsAccessibilityLabel="Secondes"
        />,
      );

      const overlays = screen.getAllByTestId("wheel-selection-overlay");
      expect(overlays).toHaveLength(2); // une par colonne (minutes, secondes)
      for (const overlay of overlays) {
        expect(overlay.props.pointerEvents).toBe("none");
      }

      expect(screen.getAllByTestId("wheel-selection-band")).toHaveLength(2);
    });
  });

  describe("CTRL-01 — sélection par appui direct (contre-recette iPhone, Phase 2 Composition, 2026-09-03)", () => {
    it("selects a value by pressing it directly — not only by scrolling — with exactly one haptic and the correct onChange total", () => {
      const onChange = jest.fn();
      render(
        <DurationWheelPicker
          totalSeconds={0}
          onChange={onChange}
          minutesAccessibilityLabel="Minutes"
          secondsAccessibilityLabel="Secondes"
        />,
      );

      // Valeur "5" de la colonne minutes, jamais atteinte par un geste ici —
      // seul un appui direct peut produire ce changement.
      fireEvent.press(screen.getByTestId("duration-wheel-minutes-item-5"));

      expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(5 * 60);
    });

    it("does nothing when the pressed value is already the current one — no haptic, no onChange", () => {
      const onChange = jest.fn();
      render(
        <DurationWheelPicker
          totalSeconds={0}
          onChange={onChange}
          minutesAccessibilityLabel="Minutes"
          secondsAccessibilityLabel="Secondes"
        />,
      );

      fireEvent.press(screen.getByTestId("duration-wheel-minutes-item-0"));

      expect(Haptics.selectionAsync).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("keeps pressed selections independent between the minutes and seconds columns", () => {
      const onChange = jest.fn();
      render(
        <DurationWheelPicker
          totalSeconds={0}
          onChange={onChange}
          minutesAccessibilityLabel="Minutes"
          secondsAccessibilityLabel="Secondes"
        />,
      );

      fireEvent.press(screen.getByTestId("duration-wheel-minutes-item-2"));
      fireEvent.press(screen.getByTestId("duration-wheel-seconds-item-30"));

      expect(onChange).toHaveBeenLastCalledWith(2 * 60 + 30);
    });

    it("still lets a subsequent scroll gesture change the value after a press — the two mechanisms coexist", () => {
      const onChange = jest.fn();
      render(
        <DurationWheelPicker
          totalSeconds={0}
          onChange={onChange}
          minutesAccessibilityLabel="Minutes"
          secondsAccessibilityLabel="Secondes"
        />,
      );

      fireEvent.press(screen.getByTestId("duration-wheel-minutes-item-5"));
      scrollTo(screen.getByTestId("duration-wheel-minutes"), 3 * ITEM_HEIGHT);

      expect(onChange).toHaveBeenLastCalledWith(3 * 60);
    });
  });
});

/**
 * `Platform.OS` par défaut dans cet environnement Jest (`jest-expo`) est
 * `"ios"` — aucun forçage nécessaire ici (posé explicitement quand même,
 * par robustesse face à l'ordre d'exécution des tests). Ces tests portent
 * sur `NativeAppleDurationWheelPicker` (`PHASE02 REWORK01 ADDENDUM —
 * NATIVE APPLE WHEEL TARGET`, 2026-09-03) : la roulette native SwiftUI
 * (`@expo/ui/swift-ui`) elle-même (perspective, fondu, inertie, magnétisme
 * natifs) n'est PAS exercée par Jest — seule la couche JS de ce composant
 * (props transmises à `Picker`, propagation d'état, garde de valeur
 * inchangée, calcul du total, haptique) l'est. Aucune de ces preuves ne
 * remplace la capture/vidéo iPhone exigée avant clôture (voir le rapport
 * de mission).
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

  it("renders the native Host/Picker structure without crashing, minutes and seconds columns both present", () => {
    render(
      <DurationWheelPicker
        totalSeconds={0}
        onChange={jest.fn()}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );

    expect(screen.getByTestId("duration-wheel-picker")).toBeTruthy();
    expect(screen.getByTestId("duration-wheel-minutes")).toBeTruthy();
    expect(screen.getByTestId("duration-wheel-seconds")).toBeTruthy();
  });

  it("propagates a native minutes selection change to onChange, with exactly one haptic call", () => {
    const onChange = jest.fn();
    render(
      <DurationWheelPicker
        totalSeconds={0}
        onChange={onChange}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );

    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 5);

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(5 * 60);
  });

  it("does nothing when the native picker reports the value already selected — no haptic, no onChange", () => {
    const onChange = jest.fn();
    render(
      <DurationWheelPicker
        totalSeconds={0}
        onChange={onChange}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );

    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 0);

    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps native selections independent between the minutes and seconds columns, combining into the correct total", () => {
    const onChange = jest.fn();
    render(
      <DurationWheelPicker
        totalSeconds={0}
        onChange={onChange}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );

    fireNativeSelectionChange(screen.getByTestId("duration-wheel-minutes"), 2);
    // La roulette native transmet la valeur elle-même comme `tag`, jamais
    // un index intermédiaire — le pas de 5 est appliqué en amont, par la
    // seule présence des `<Text modifiers={[tag(valeur)]}>` générés depuis
    // `SECONDS_VALUES` (0, 5, …, 55) : aucune valeur hors pas ne peut être
    // proposée par la roulette elle-même.
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-seconds"), 30);

    expect(onChange).toHaveBeenLastCalledWith(2 * 60 + 30);
  });

  it("only ever reports seconds values on the CE-T01-07/14 step (0, 5, …, 55) — an out-of-step native selection is impossible by construction", () => {
    const onChange = jest.fn();
    render(
      <DurationWheelPicker
        totalSeconds={0}
        onChange={onChange}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );

    // La roulette native ne propose que les `<Text modifiers={[tag(v)]}>`
    // effectivement rendues (0, 5, …, 55, `SECONDS_VALUES`) — un appel de
    // `onSelectionChange` hors de cet ensemble ne peut provenir que d'un
    // scénario impossible en pratique (aucun item natif ne porte ce tag),
    // mais la garde de sortie (`toTotalSeconds`) reste défensive si jamais.
    fireNativeSelectionChange(screen.getByTestId("duration-wheel-seconds"), 55);
    expect(onChange).toHaveBeenLastCalledWith(55);
  });

  it("restores the initial value on re-mount (close/reopen), matching the legacy path's own guarantee", () => {
    const onChange = jest.fn();
    const { unmount } = render(
      <DurationWheelPicker
        totalSeconds={135} // 2 min 15 s
        onChange={onChange}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );
    unmount();

    render(
      <DurationWheelPicker
        totalSeconds={135}
        onChange={onChange}
        minutesAccessibilityLabel="Minutes"
        secondsAccessibilityLabel="Secondes"
      />,
    );

    // La roulette est démontée/remontée à chaque ouverture (même patron
    // que la version maison) — la valeur initiale reste celle du brouillon
    // réel, jamais réinitialisée à 0.
    expect(screen.getByTestId("duration-wheel-minutes").props.selection).toBe(2);
    expect(screen.getByTestId("duration-wheel-seconds").props.selection).toBe(15);
  });
});
