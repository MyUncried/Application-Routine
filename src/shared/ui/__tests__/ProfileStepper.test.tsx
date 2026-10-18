import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import { EXECUTION_ACCELERATED_HOLD_POLICY, InlineStepper, ProfileStepper } from "@/shared/ui/ProfileStepper";

describe("ProfileStepper — closed state (D-227)", () => {
  it("shows the label and the confirmed value, replacing nothing until opened", () => {
    render(
      <ProfileStepper
        label="Compte à rebours d’exercice"
        unit="s"
        value={10}
        min={0}
        max={60}
        isOpen={false}
        onToggle={() => {}}
        onCommit={async () => true}
        testID="stepper"
      />,
    );
    expect(screen.getByTestId("stepper-value").props.children).toBe("10 s");
  });

  it("opens on press (only one stepper open at a time, controlled by the caller)", () => {
    const onToggle = jest.fn();
    render(
      <ProfileStepper
        label="Fin d’exercice"
        unit="s"
        value={5}
        min={0}
        max={60}
        isOpen={false}
        onToggle={onToggle}
        onCommit={async () => true}
        testID="stepper"
      />,
    );
    fireEvent.press(screen.getByTestId("stepper"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe("ProfileStepper — open state, bounds (T4)", () => {
  it("disables the − button at the lower bound and announces it", () => {
    render(
      <ProfileStepper
        label="Fin d’exercice"
        unit="s"
        value={0}
        min={0}
        max={60}
        isOpen
        onToggle={() => {}}
        onCommit={async () => true}
        testID="stepper"
      />,
    );
    const decrement = screen.getByTestId("stepper-decrement");
    expect(decrement.props.accessibilityState.disabled).toBe(true);
    expect(decrement.props.accessibilityLabel).toContain("minimum atteint");
  });

  it("disables the + button at the upper bound and announces it", () => {
    render(
      <ProfileStepper
        label="Fin d’exercice"
        unit="s"
        value={60}
        min={0}
        max={60}
        isOpen
        onToggle={() => {}}
        onCommit={async () => true}
        testID="stepper"
      />,
    );
    const increment = screen.getByTestId("stepper-increment");
    expect(increment.props.accessibilityState.disabled).toBe(true);
    expect(increment.props.accessibilityLabel).toContain("maximum atteint");
  });

  /**
   * CE-UI-07 L2569 : annoncée par la valeur, en TOUTE position (mi-course,
   * borne basse, borne haute) — valeur, unité ET bornes du réglage, jamais
   * seulement au bouton désactivé à la limite.
   */
  it("announces the value, unit AND the setting's bounds via accessibilityLabel, at mid-range", () => {
    render(
      <ProfileStepper
        label="Fin d’exercice"
        unit="s"
        value={10}
        min={0}
        max={60}
        isOpen
        onToggle={() => {}}
        onCommit={async () => true}
        testID="stepper"
      />,
    );
    const valueText = screen.getByTestId("stepper-value");
    expect(valueText.props.accessibilityLabel).toBe("10 s, de 0 à 60 s");
    expect(valueText.props.accessibilityValue).toEqual({ min: 0, max: 60, now: 10 });
  });

  it("announces the value, unit AND the setting's bounds via accessibilityLabel, at the lower bound", () => {
    render(
      <ProfileStepper
        label="Fin d’exercice"
        unit="s"
        value={0}
        min={0}
        max={60}
        isOpen
        onToggle={() => {}}
        onCommit={async () => true}
        testID="stepper"
      />,
    );
    const valueText = screen.getByTestId("stepper-value");
    expect(valueText.props.accessibilityLabel).toBe("0 s, de 0 à 60 s");
    expect(valueText.props.accessibilityValue).toEqual({ min: 0, max: 60, now: 0 });
  });

  it("announces the value, unit AND the setting's bounds via accessibilityLabel, at the upper bound", () => {
    render(
      <ProfileStepper
        label="Fin d’exercice"
        unit="s"
        value={60}
        min={0}
        max={60}
        isOpen
        onToggle={() => {}}
        onCommit={async () => true}
        testID="stepper"
      />,
    );
    const valueText = screen.getByTestId("stepper-value");
    expect(valueText.props.accessibilityLabel).toBe("60 s, de 0 à 60 s");
    expect(valueText.props.accessibilityValue).toEqual({ min: 0, max: 60, now: 60 });
  });
});

describe("ProfileStepper — interaction (T5/T6, CE-UI-07 L2549/L2545/L2557/L2565)", () => {
  it("a simple tap increments by one step immediately and commits exactly once on release", async () => {
    jest.useFakeTimers();
    const onCommit = jest.fn(async () => true);
    render(
      <ProfileStepper
        label="Fin d’exercice"
        unit="s"
        value={10}
        min={0}
        max={60}
        isOpen
        onToggle={() => {}}
        onCommit={onCommit}
        testID="stepper"
      />,
    );
    const increment = screen.getByTestId("stepper-increment");

    fireEvent(increment, "pressIn");
    expect(screen.getByTestId("stepper-value").props.children).toBe("11 s");

    await act(async () => {
      fireEvent(increment, "pressOut");
      await Promise.resolve();
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(11);
    jest.useRealTimers();
  });

  it("a hold repeats after 450 ms, then every 150 ms, stopping on release — a single write for the whole gesture", async () => {
    jest.useFakeTimers();
    const onCommit = jest.fn(async () => true);
    render(
      <ProfileStepper
        label="Fin d’exercice"
        unit="s"
        value={10}
        min={0}
        max={60}
        isOpen
        onToggle={() => {}}
        onCommit={onCommit}
        testID="stepper"
      />,
    );
    const increment = screen.getByTestId("stepper-increment");

    fireEvent(increment, "pressIn");
    expect(screen.getByTestId("stepper-value").props.children).toBe("11 s");

    act(() => {
      jest.advanceTimersByTime(450);
    });
    expect(screen.getByTestId("stepper-value").props.children).toBe("12 s");

    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(screen.getByTestId("stepper-value").props.children).toBe("13 s");

    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(screen.getByTestId("stepper-value").props.children).toBe("14 s");

    await act(async () => {
      fireEvent(increment, "pressOut");
      await Promise.resolve();
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(14);

    // Plus aucun tic après le relâchement — même en avançant le temps.
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("stepper-value").props.children).toBe("14 s");
    jest.useRealTimers();
  });

  it("restores the last confirmed value and shows an error message when the write fails (T6)", async () => {
    const onCommit = jest.fn(async () => false);
    render(
      <ProfileStepper
        label="Fin d’exercice"
        unit="s"
        value={10}
        min={0}
        max={60}
        isOpen
        onToggle={() => {}}
        onCommit={onCommit}
        testID="stepper"
      />,
    );
    const increment = screen.getByTestId("stepper-increment");

    await act(async () => {
      fireEvent(increment, "pressIn");
      fireEvent(increment, "pressOut");
      await Promise.resolve();
    });

    expect(screen.getByTestId("stepper-value").props.children).toBe("10 s");
    expect(screen.getByTestId("stepper-error")).toBeTruthy();
  });

  it("uses the pause grid (not a 1 s step) when gridBased is set", () => {
    render(
      <ProfileStepper
        label="Récupération après exercice"
        unit="s"
        value={5}
        min={0}
        max={300}
        gridBased
        isOpen
        onToggle={() => {}}
        onCommit={async () => true}
        testID="stepper"
      />,
    );
    fireEvent(screen.getByTestId("stepper-increment"), "pressIn");
    expect(screen.getByTestId("stepper-value").props.children).toBe("10 s");
  });
});

/**
 * PRE-4 story 3.6 — props optionnelles d'`InlineStepper` : `stepRule` (règle de pas de
 * l'appelant) et `onValuePress` (valeur tactile). Un réglage désactivé n'ouvre rien ;
 * des ± indisponibles par la règle (échec, borne) laissent la valeur touchable.
 */
describe("PRE4-3.6 — InlineStepper : valeur tactile et règle de pas", () => {
  const renderStepper = (props: { disabled?: boolean; value?: number | null; stepRule?: (value: number | null, direction: 1 | -1) => number | "unavailable" }) => {
    const onValuePress = jest.fn();
    const onChange = jest.fn();
    render(
      <InlineStepper
        value={props.value === undefined ? 30 : props.value}
        min={5}
        max={3535}
        policy={EXECUTION_ACCELERATED_HOLD_POLICY}
        formatValue={(value) => (value === null ? "à l’échec" : `${value} s`)}
        onChange={onChange}
        accessibilityLabel="Série 1, Durée"
        disabled={props.disabled}
        stepRule={props.stepRule}
        onValuePress={onValuePress}
        testID="cell"
      />,
    );
    return { onValuePress, onChange };
  };
  const unavailable = () => "unavailable" as const;

  it("PRE4-3.6/AC3 — réglage désactivé : toucher la valeur n'ouvre rien ; l'action « activer » n'est pas proposée", () => {
    const { onValuePress } = renderStepper({ disabled: true });
    fireEvent.press(screen.getByTestId("cell-value-press"));
    expect(onValuePress).not.toHaveBeenCalled();
    const actions = (screen.getByTestId("cell").props.accessibilityActions as { name: string }[]).map((action) => action.name);
    expect(actions).not.toContain("activate");
  });

  it("PRE4-3.6/AC3 — ± indisponibles par la règle de pas (échec) : la valeur reste touchable et « activer » l'ouvre", () => {
    const { onValuePress, onChange } = renderStepper({ value: null, stepRule: unavailable });
    expect(screen.getByTestId("cell-increment").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("cell-decrement").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("cell-value-press"));
    expect(onValuePress).toHaveBeenCalledTimes(1);
    fireEvent(screen.getByTestId("cell"), "accessibilityAction", { nativeEvent: { actionName: "activate" } });
    expect(onValuePress).toHaveBeenCalledTimes(2);
    fireEvent(screen.getByTestId("cell"), "accessibilityAction", { nativeEvent: { actionName: "increment" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("PRE4-3.6/AC13 — avec une règle de pas, VoiceOver ne propose que les pas disponibles ; valeur annoncée telle qu'affichée", () => {
    renderStepper({ value: null, stepRule: unavailable });
    const node = screen.getByTestId("cell");
    expect(node.props.accessibilityActions).toEqual([{ name: "activate" }]);
    expect(node.props.accessibilityValue).toEqual({ text: "à l’échec" });
  });

  it("PRE4-3.6/AC5 — borne haute par la règle : seul − est proposé ; sans règle, les deux actions restent (comportement inchangé)", () => {
    const view = render(
      <InlineStepper
        value={5999}
        min={5}
        max={3535}
        policy={EXECUTION_ACCELERATED_HOLD_POLICY}
        formatValue={(value) => `${value} s`}
        onChange={() => undefined}
        accessibilityLabel="Série 1, Durée"
        stepRule={(_value, direction) => (direction === 1 ? "unavailable" : 3535)}
        testID="bound"
      />,
    );
    expect(screen.getByTestId("bound").props.accessibilityActions).toEqual([{ name: "decrement" }]);
    view.unmount();
    render(
      <InlineStepper
        value={30}
        min={5}
        max={3535}
        policy={EXECUTION_ACCELERATED_HOLD_POLICY}
        formatValue={(value) => `${value} s`}
        onChange={() => undefined}
        accessibilityLabel="Pause"
        testID="plain"
      />,
    );
    expect(screen.getByTestId("plain").props.accessibilityActions).toEqual([{ name: "increment" }, { name: "decrement" }]);
    expect(screen.queryByTestId("plain-value-press")).toBeNull();
  });
});

/**
 * PRE-4 story 3.8 (AC2, ch. 13 §18 « limites annoncées ») — suffixe de limite d'`InlineStepper`,
 * sur opt-in explicite (`announceLimits`, passé par la Feuille seule) : annoncé seulement pour une
 * valeur DANS les bornes ; les deux suffixes si min = max. Sans l'opt-in, valeur seule (aucun
 * autre écran ne reçoit le suffixe ; `ProfileStepper` du Profil garde sa propre annonce, sans suffixe).
 */
describe("PRE4-3.8 — InlineStepper : limites annoncées sur opt-in", () => {
  const spoken = (props: { value: number | null; min?: number; max?: number; announceLimits?: boolean }) => {
    const view = render(
      <InlineStepper
        value={props.value}
        min={props.min ?? 5}
        max={props.max ?? 3535}
        policy={EXECUTION_ACCELERATED_HOLD_POLICY}
        formatValue={(value) => (value === null ? "—" : `${value} s`)}
        onChange={jest.fn()}
        accessibilityLabel="Réglage"
        announceLimits={props.announceLimits}
        testID="limits"
      />,
    );
    const text = (screen.getByTestId("limits").props.accessibilityValue as { text: string }).text;
    view.unmount();
    return text;
  };

  it("PRE4-3.8/AC2 — sans opt-in : valeur seule, même à une borne", () => {
    expect(spoken({ value: 5 })).toBe("5 s");
    expect(spoken({ value: 3535 })).toBe("3535 s");
  });

  it("PRE4-3.8/AC2 — avec opt-in : borne basse, borne haute, les deux si min = max ; mi-course sans suffixe", () => {
    expect(spoken({ value: 5, announceLimits: true })).toBe("5 s, minimum atteint");
    expect(spoken({ value: 3535, announceLimits: true })).toBe("3535 s, maximum atteint");
    expect(spoken({ value: 30, announceLimits: true })).toBe("30 s");
    expect(spoken({ value: 7, min: 7, max: 7, announceLimits: true })).toBe("7 s, minimum atteint, maximum atteint");
  });

  it("PRE4-3.8/AC2 — avec opt-in : valeur ancienne hors bornes (4 s, 5999 s) ou sans nombre : aucun suffixe", () => {
    expect(spoken({ value: 4, announceLimits: true })).toBe("4 s");
    expect(spoken({ value: 5999, announceLimits: true })).toBe("5999 s");
    expect(spoken({ value: null, announceLimits: true })).toBe("—");
  });
});
