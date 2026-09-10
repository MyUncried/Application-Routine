import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import {
  TRANSIENT_NOTIFICATION_DURATION_MS,
  TRANSIENT_NOTIFICATION_MESSAGE_LINES,
  TRANSIENT_NOTIFICATION_MIN_HEIGHT,
  TransientNotification,
} from "@/shared/ui/TransientNotification";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

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

    expect(screen.getByTestId("transient-notification-message").props.children).toBe(
      "Durée ajustée à 2 min 40 s pour respecter un nombre entier de Séries.",
    );
    expect(screen.getByLabelText("Annuler")).toBeTruthy();

    // La surface noire est la CARTE, distincte du calque de position : c'est
    // elle qui porte le fond et le rayon canoniques.
    const style = StyleSheet.flatten(
      screen.getByTestId("transient-notification-card").props.style,
    );
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
   * **T02-S02 (seconde recette visuelle, point 5 — préservé par la
   * troisième)** : elle recouvre EXACTEMENT son parent — les quatre côtés à
   * zéro — au lieu d'être ancrée au bas de l'écran. C'est le parent qui décide
   * de sa position : l'écran Activité l'enveloppe autour de son bouton
   * `Terminer`, elle y est donc centrée verticalement et le masque, sans
   * qu'aucune coordonnée ne soit calculée ni recopiée depuis la géométrie du
   * bouton.
   *
   * **Troisième recette, point 2** : le CENTRAGE VERTICAL est désormais porté
   * par `justifyContent` du calque — la carte n'étant plus contrainte à la
   * hauteur du bouton, c'est ce centrage qui la fait déborder symétriquement
   * de part et d'autre de lui, `overflow: "visible"` autorisant ce
   * débordement au lieu de le rogner.
   */
  it("covers its parent exactly, on all four sides, and centres the black surface vertically on it", () => {
    render(<TransientNotification {...renderProps()} />);

    const style = StyleSheet.flatten(
      screen.getByTestId("transient-notification").props.style,
    );
    expect(style.top).toBe(0);
    expect(style.bottom).toBe(0);
    expect(style.left).toBe(0);
    expect(style.right).toBe(0);
    expect(style.justifyContent).toBe("center");
    expect(style.overflow).toBe("visible");
  });

  it("keeps a real touch target on its action", () => {
    render(<TransientNotification {...renderProps()} />);

    const action = StyleSheet.flatten(
      screen.getByTestId("transient-notification-action").props.style,
    );
    expect(action.minWidth).toBe(minTouchTarget);
    expect(screen.getByTestId("transient-notification-action").props.hitSlop).toBeDefined();
  });

  /**
   * **T02-S02 (troisième recette visuelle, point 2)** — largeurs DISJOINTES :
   * le message occupe tout ce que l'action laisse (`flex: 1`) et l'action ne
   * rétrécit jamais (`flexShrink: 0`). Les deux ne peuvent donc ni se
   * chevaucher, ni se comprimer l'un l'autre, quelle que soit la longueur du
   * message.
   */
  it("reserves a distinct width for the message and for the Annuler action", () => {
    render(<TransientNotification {...renderProps()} />);

    const message = StyleSheet.flatten(
      screen.getByTestId("transient-notification-message").props.style,
    );
    const action = StyleSheet.flatten(
      screen.getByTestId("transient-notification-action").props.style,
    );
    const card = StyleSheet.flatten(
      screen.getByTestId("transient-notification-card").props.style,
    );

    expect(message.flex).toBe(1);
    expect(action.flexShrink).toBe(0);
    expect(action.minWidth).toBe(minTouchTarget);
    // Rangée unique : le texte et l'action restent côte à côte, séparés par
    // une gouttière — jamais superposés.
    expect(card.flexDirection).toBe("row");
    expect(card.gap).toBe(spacing[12]);
  });

  /**
   * **T02-S02 (troisième recette visuelle, point 2)** — DEUX lignes pleines,
   * sans troncature : le message est autorisé à deux lignes et la surface
   * noire réserve la hauteur nécessaire pour les afficher entièrement, marges
   * internes comprises.
   */
  it("allows two FULL lines of message and reserves the height they need", () => {
    render(<TransientNotification {...renderProps()} />);

    expect(screen.getByTestId("transient-notification-message").props.numberOfLines).toBe(2);
    expect(TRANSIENT_NOTIFICATION_MESSAGE_LINES).toBe(2);

    const card = StyleSheet.flatten(
      screen.getByTestId("transient-notification-card").props.style,
    );
    expect(card.minHeight).toBe(TRANSIENT_NOTIFICATION_MIN_HEIGHT);
    // La hauteur réservée couvre réellement deux interlignes de `type.body`
    // PLUS les deux marges verticales : aucune des deux lignes ne peut être
    // rognée. L'ancien plancher `minTouchTarget` ne suffisait qu'à une seule.
    expect(card.minHeight).toBe(type.body.lineHeight * 2 + spacing[12] * 2);
    expect(card.paddingVertical).toBe(spacing[12]);
    expect(card.minHeight).toBeGreaterThan(minTouchTarget);
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
