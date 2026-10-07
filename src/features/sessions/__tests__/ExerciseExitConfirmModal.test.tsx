import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { Modal, StyleSheet } from "react-native";

import { ExerciseExitConfirmModal } from "@/features/sessions/ExerciseExitConfirmModal";
import { strings } from "@/shared/i18n";
import { colors, dimensions } from "@/shared/ui/tokens";

const modalStrings = strings.screens.exercise.exitConfirmModal;

describe("ExerciseExitConfirmModal (D-094, CE-T01-16)", () => {
  it("displays the exact title and message from D-094 (unchanged by REWORK11)", () => {
    render(<ExerciseExitConfirmModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

    expect(screen.getByText("Abandonner les modifications ?")).toBeTruthy();
    expect(
      screen.getByText("Les modifications apportées à cet exercice seront perdues."),
    ).toBeTruthy();
  });

  describe("REWORK11 — libellés exacts", () => {
    it("exposes exactly 'Annuler' and 'Confirmer', both visibly and accessibly", () => {
      render(<ExerciseExitConfirmModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

      expect(screen.getByText("Annuler")).toBeTruthy();
      expect(screen.getByText("Confirmer")).toBeTruthy();
      expect(screen.getByLabelText(modalStrings.continueEditing)).toBeTruthy();
      expect(screen.getByLabelText(modalStrings.abandon)).toBeTruthy();
    });

    it("never shows the previous labels 'Continuer la modification' or 'Abandonner', visibly or accessibly", () => {
      render(<ExerciseExitConfirmModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

      expect(screen.queryByText("Continuer la modification")).toBeNull();
      expect(screen.queryByText("Abandonner")).toBeNull();
      expect(screen.queryByLabelText("Continuer la modification")).toBeNull();
      expect(screen.queryByLabelText("Abandonner")).toBeNull();
    });
  });

  it("REWORK11 — centers the title horizontally, same canonical typography as the Session dialog (type.modalTitle, 18/22 Semi Bold)", () => {
    render(<ExerciseExitConfirmModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

    const title = screen.getByText("Abandonner les modifications ?");
    const flattened = StyleSheet.flatten(title.props.style);
    expect(flattened.textAlign).toBe("center");
    expect(flattened.fontSize).toBe(18);
    expect(flattened.lineHeight).toBe(22);
    expect(flattened.fontWeight).toBe("600");
  });

  describe("REWORK11 — actions", () => {
    it("keeps the two actions on a single row, with strictly identical 147×48 dimensions and a 12pt horizontal gap — same shared geometry as the Session dialog", () => {
      render(<ExerciseExitConfirmModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

      const cancelAction = screen.getByLabelText("Annuler");
      const confirmAction = screen.getByLabelText("Confirmer");
      const cancelStyle = StyleSheet.flatten(cancelAction.props.style);
      const confirmStyle = StyleSheet.flatten(confirmAction.props.style);

      expect(cancelStyle.width).toBe(dimensions.decisionDialog.actionWidth);
      expect(cancelStyle.height).toBe(dimensions.decisionDialog.actionHeight);
      expect(confirmStyle.width).toBe(147);
      expect(confirmStyle.height).toBe(48);

      const actionsRow = screen.getByTestId("exercise-exit-confirm-actions");
      const rowStyle = StyleSheet.flatten(actionsRow.props.style);
      expect(rowStyle.flexDirection).toBe("row");
      expect(rowStyle.gap).toBe(12);
    });

    it("centers each action's label on both axes", () => {
      render(<ExerciseExitConfirmModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

      const cancelActionStyle = StyleSheet.flatten(screen.getByLabelText("Annuler").props.style);
      expect(cancelActionStyle.alignItems).toBe("center");
      expect(cancelActionStyle.justifyContent).toBe("center");
      expect(StyleSheet.flatten(screen.getByText("Annuler").props.style).textAlign).toBe("center");

      const confirmActionStyle = StyleSheet.flatten(screen.getByLabelText("Confirmer").props.style);
      expect(confirmActionStyle.alignItems).toBe("center");
      expect(confirmActionStyle.justifyContent).toBe("center");
      expect(StyleSheet.flatten(screen.getByText("Confirmer").props.style).textAlign).toBe("center");
    });

    it("gives Annuler the same neutral grey background token as the Session dialog (color.dialogNeutralActionBackground) — never a local substitute style", () => {
      render(<ExerciseExitConfirmModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

      const action = StyleSheet.flatten(screen.getByLabelText("Annuler").props.style);
      expect(action.backgroundColor).toBe(colors.dialogNeutralActionBackground);
      // Alignement DSF 07/10 (D3) : ramené à `color.surface` (ancien `#F3F4F6`).
      expect(action.backgroundColor).toBe(colors.surface);
    });

    // Alignement DSF 07/10 (D3) : rouge destructif fusionné avec `color.danger`.
    it("gives Confirmer the same destructive red background token as the Session dialog (color.dialogDestructiveActionBackground, now color.danger) with white text", () => {
      render(<ExerciseExitConfirmModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

      const action = StyleSheet.flatten(screen.getByLabelText("Confirmer").props.style);
      const label = StyleSheet.flatten(screen.getByText("Confirmer").props.style);
      expect(action.backgroundColor).toBe(colors.dialogDestructiveActionBackground);
      expect(action.backgroundColor).toBe(colors.danger);
      expect(label.color).toBe(colors.background);
    });

    it("REWORK11 — never gives Confirmer a border on this instance (verified absent on the Activity Figma node 3224:4140, unlike the Session dialog which keeps its own)", () => {
      render(<ExerciseExitConfirmModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

      const action = StyleSheet.flatten(screen.getByLabelText("Confirmer").props.style);
      expect(action.borderWidth).toBeUndefined();
    });
  });

  it("REWORK11 — floating card is 354pt wide with an 18pt radius, and the message→actions spacing is exactly spacing/16 (16pt) — same shared geometry as the Session dialog", () => {
    render(<ExerciseExitConfirmModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

    const card = screen.getByTestId("exercise-exit-confirm-card");
    const cardStyle = StyleSheet.flatten(card.props.style);
    expect(cardStyle.width).toBe(dimensions.decisionDialog.width);
    expect(cardStyle.width).toBe(354);
    expect(cardStyle.borderRadius).toBe(18);
    expect(cardStyle.gap).toBe(16);
  });

  describe("REWORK11 — comportement", () => {
    it("calls onCancel, never onConfirm, when 'Annuler' is pressed — restoring the local working copy, never destroying it", () => {
      const onCancel = jest.fn();
      const onConfirm = jest.fn();
      render(<ExerciseExitConfirmModal onCancel={onCancel} onConfirm={onConfirm} />);

      fireEvent.press(screen.getByLabelText(modalStrings.continueEditing));

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("calls onConfirm, never onCancel, when 'Confirmer' is pressed — only Confirmer abandons the local Activity draft", () => {
      const onCancel = jest.fn();
      const onConfirm = jest.fn();
      render(<ExerciseExitConfirmModal onCancel={onCancel} onConfirm={onConfirm} />);

      fireEvent.press(screen.getByLabelText(modalStrings.abandon));

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onCancel).not.toHaveBeenCalled();
    });

    it("treats the Android hardware back request (onRequestClose) as Annuler — never as Confirmer", () => {
      const onCancel = jest.fn();
      const onConfirm = jest.fn();
      render(<ExerciseExitConfirmModal onCancel={onCancel} onConfirm={onConfirm} />);

      fireEvent(screen.UNSAFE_getByType(Modal), "requestClose");

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("never wires a touch on the backdrop/voile to onConfirm — the destructive action is never triggered by dismissing the veil, and the backdrop blocks interaction with the screen underneath", () => {
      const onCancel = jest.fn();
      const onConfirm = jest.fn();
      render(<ExerciseExitConfirmModal onCancel={onCancel} onConfirm={onConfirm} />);

      const backdrop = screen.getByTestId("exercise-exit-confirm-backdrop");
      expect(backdrop.props.onPress).toBeUndefined();
      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  it("REWORK11 — reuses the shared DecisionDialog geometry (Modal transparent, animationType='fade', semi-transparent centered backdrop) — never a locally-duplicated implementation", () => {
    render(<ExerciseExitConfirmModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

    const modal = screen.UNSAFE_getByType(Modal);
    expect(modal.props.transparent).toBe(true);
    expect(modal.props.animationType).toBe("fade");

    const backdrop = screen.getByTestId("exercise-exit-confirm-backdrop");
    const backdropStyle = StyleSheet.flatten(backdrop.props.style);
    // Complément d'alignement du 07/10 (ajout A) : voile modal unique.
    expect(backdropStyle.backgroundColor).toBe(colors.overlayScrim);
    expect(backdropStyle.backgroundColor).toBe("rgba(31, 33, 41, 0.34)");
    expect(backdropStyle.alignItems).toBe("center");
    expect(backdropStyle.justifyContent).toBe("center");
  });
});
