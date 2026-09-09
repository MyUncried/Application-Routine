import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import {
  TRANSIENT_NOTIFICATION_DURATION_MS,
  TransientNotification,
} from "@/shared/ui/TransientNotification";
import { colors, minTouchTarget } from "@/shared/ui/tokens";

/**
 * Notification noire temporaire canonique (`12 – Architecture technique.md`,
 * `color.snackbar` et rayon `16` « message temporaire » ; RM-010 « un
 * message … propose temporairement `Annuler` »).
 */
function renderProps(overrides: Partial<Parameters<typeof TransientNotification>[0]> = {}) {
  return {
    message: "Durée ajustée à 2 min 40 s pour respecter un nombre entier de Séries.",
    actionLabel: "Annuler",
    onAction: jest.fn(),
    onDismiss: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("TransientNotification", () => {
  it("renders nothing at all when there is no message", () => {
    render(<TransientNotification {...renderProps({ message: null })} />);
    expect(screen.queryByTestId("transient-notification")).toBeNull();
  });

  it("renders the message and its correction action on the canonical black surface", () => {
    render(<TransientNotification {...renderProps()} />);

    const container = screen.getByTestId("transient-notification");
    expect(screen.getByTestId("transient-notification-message").props.children).toBe(
      "Durée ajustée à 2 min 40 s pour respecter un nombre entier de Séries.",
    );
    expect(screen.getByLabelText("Annuler")).toBeTruthy();

    const style = StyleSheet.flatten(container.props.style);
    expect(style.backgroundColor).toBe(colors.snackbar);
    expect(style.backgroundColor).toBe("#292B33");
    expect(style.borderRadius).toBe(16);
  });

  it("is SUPERPOSED, never part of the layout — it can never push the screen's content", () => {
    render(<TransientNotification {...renderProps()} />);

    const style = StyleSheet.flatten(
      screen.getByTestId("transient-notification").props.style,
    );
    expect(style.position).toBe("absolute");
  });

  /**
   * **T02-S02 (seconde recette visuelle, point 5)** : elle recouvre
   * EXACTEMENT son parent — les quatre côtés à zéro — au lieu d'être ancrée
   * au bas de l'écran. C'est le parent qui décide de sa position : l'écran
   * Activité l'enveloppe autour de son bouton `Terminer`, elle y est donc
   * centrée verticalement et le masque, sans qu'aucune coordonnée ne soit
   * calculée ni recopiée depuis la géométrie du bouton.
   */
  it("covers its parent exactly, on all four sides, and centres its content vertically", () => {
    render(<TransientNotification {...renderProps()} />);

    const style = StyleSheet.flatten(
      screen.getByTestId("transient-notification").props.style,
    );
    expect(style.top).toBe(0);
    expect(style.bottom).toBe(0);
    expect(style.left).toBe(0);
    expect(style.right).toBe(0);
    expect(style.alignItems).toBe("center");
  });

  it("keeps a real touch target on its action", () => {
    render(<TransientNotification {...renderProps()} />);

    const container = StyleSheet.flatten(
      screen.getByTestId("transient-notification").props.style,
    );
    expect(container.minHeight).toBe(minTouchTarget);
    expect(screen.getByTestId("transient-notification-action").props.hitSlop).toBeDefined();
  });

  it("calls onAction when the correction action is pressed, and never onDismiss in its place", () => {
    const props = renderProps();
    render(<TransientNotification {...props} />);

    fireEvent.press(screen.getByTestId("transient-notification-action"));

    expect(props.onAction).toHaveBeenCalledTimes(1);
    expect(props.onDismiss).not.toHaveBeenCalled();
  });

  it("dismisses itself automatically — the message is never kept permanently on screen", () => {
    const props = renderProps();
    render(<TransientNotification {...props} />);

    expect(props.onDismiss).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(TRANSIENT_NOTIFICATION_DURATION_MS);
    });
    expect(props.onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not dismiss before its full delay has elapsed", () => {
    const props = renderProps();
    render(<TransientNotification {...props} />);

    act(() => {
      jest.advanceTimersByTime(TRANSIENT_NOTIFICATION_DURATION_MS - 1);
    });
    expect(props.onDismiss).not.toHaveBeenCalled();
  });

  it("restarts the delay for a NEW message instead of inheriting the running countdown", () => {
    const props = renderProps();
    const { rerender } = render(<TransientNotification {...props} />);

    act(() => {
      jest.advanceTimersByTime(TRANSIENT_NOTIFICATION_DURATION_MS - 100);
    });
    rerender(<TransientNotification {...props} message="Un autre message" />);

    // L'ancien décompte est annulé : à `-100 ms` du premier délai, rien ne
    // s'efface encore.
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(props.onDismiss).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(TRANSIENT_NOTIFICATION_DURATION_MS);
    });
    expect(props.onDismiss).toHaveBeenCalledTimes(1);
  });

  it("schedules nothing while there is no message", () => {
    const props = renderProps({ message: null });
    render(<TransientNotification {...props} />);

    act(() => {
      jest.advanceTimersByTime(TRANSIENT_NOTIFICATION_DURATION_MS * 3);
    });
    expect(props.onDismiss).not.toHaveBeenCalled();
  });
});
