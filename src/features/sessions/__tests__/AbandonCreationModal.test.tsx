import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { Modal, StyleSheet } from "react-native";

import { AbandonCreationModal } from "@/features/sessions/AbandonCreationModal";
import { strings } from "@/shared/i18n";
import { colors, dimensions } from "@/shared/ui/tokens";

const modalStrings = strings.screens.composition.abandonModal;

describe("AbandonCreationModal", () => {
  it("displays the exact title and message from the functional specification (unchanged by REWORK10)", () => {
    render(<AbandonCreationModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

    expect(screen.getByText("Abandonner la création ?")).toBeTruthy();
    expect(
      screen.getByText("Les informations saisies seront perdues et la séance ne sera pas créée."),
    ).toBeTruthy();
  });

  describe("REWORK10 — libellés exacts (point 1)", () => {
    it("exposes exactly 'Annuler' and 'Confirmer', both visibly and accessibly", () => {
      render(<AbandonCreationModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

      expect(screen.getByText("Annuler")).toBeTruthy();
      expect(screen.getByText("Confirmer")).toBeTruthy();
      expect(screen.getByLabelText("Annuler")).toBeTruthy();
      expect(screen.getByLabelText("Confirmer")).toBeTruthy();
      expect(screen.getByLabelText(modalStrings.continueCreating)).toBeTruthy();
      expect(screen.getByLabelText(modalStrings.abandon)).toBeTruthy();
    });

    it("never shows the previous labels 'Continuer la création' or 'Abandonner', visibly or accessibly", () => {
      render(<AbandonCreationModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

      expect(screen.queryByText("Continuer la création")).toBeNull();
      expect(screen.queryByText("Abandonner")).toBeNull();
      expect(screen.queryByLabelText("Continuer la création")).toBeNull();
      expect(screen.queryByLabelText("Abandonner")).toBeNull();
    });
  });

  it("REWORK10, point 2 — centers the title horizontally, keeping its canonical typography (type.modalTitle, 18/22 Semi Bold) and adaptive behaviour (no numberOfLines/fixed width)", () => {
    render(<AbandonCreationModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

    const title = screen.getByText("Abandonner la création ?");
    const flattened = StyleSheet.flatten(title.props.style);
    expect(flattened.textAlign).toBe("center");
    expect(flattened.fontSize).toBe(18);
    expect(flattened.lineHeight).toBe(22);
    expect(flattened.fontWeight).toBe("600");
    expect(title.props.numberOfLines).toBeUndefined();
  });

  describe("REWORK10 — actions (point 3)", () => {
    it("keeps the two actions on a single row, with strictly identical 147×48 dimensions and a 12pt horizontal gap", () => {
      render(<AbandonCreationModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

      const cancelAction = screen.getByLabelText("Annuler");
      const confirmAction = screen.getByLabelText("Confirmer");
      const cancelStyle = StyleSheet.flatten(cancelAction.props.style);
      const confirmStyle = StyleSheet.flatten(confirmAction.props.style);

      expect(cancelStyle.width).toBe(147);
      expect(cancelStyle.height).toBe(48);
      expect(confirmStyle.width).toBe(147);
      expect(confirmStyle.height).toBe(48);
      expect(cancelStyle.width).toBe(confirmStyle.width);
      expect(cancelStyle.height).toBe(confirmStyle.height);

      const actionsRow = screen.getByTestId("abandon-creation-actions");
      const rowStyle = StyleSheet.flatten(actionsRow.props.style);
      expect(rowStyle.flexDirection).toBe("row");
      expect(rowStyle.gap).toBe(12);
    });

    it("centers each action's label on both axes", () => {
      render(<AbandonCreationModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

      const cancelAction = screen.getByLabelText("Annuler");
      const cancelActionStyle = StyleSheet.flatten(cancelAction.props.style);
      expect(cancelActionStyle.alignItems).toBe("center");
      expect(cancelActionStyle.justifyContent).toBe("center");
      expect(StyleSheet.flatten(screen.getByText("Annuler").props.style).textAlign).toBe("center");

      const confirmAction = screen.getByLabelText("Confirmer");
      const confirmActionStyle = StyleSheet.flatten(confirmAction.props.style);
      expect(confirmActionStyle.alignItems).toBe("center");
      expect(confirmActionStyle.justifyContent).toBe("center");
      expect(StyleSheet.flatten(screen.getByText("Confirmer").props.style).textAlign).toBe("center");
    });

    it("gives Annuler a neutral grey background with dark text, using the dedicated DSF tokens — never a local substitute style", () => {
      render(<AbandonCreationModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

      const action = StyleSheet.flatten(screen.getByLabelText("Annuler").props.style);
      const label = StyleSheet.flatten(screen.getByText("Annuler").props.style);
      expect(action.backgroundColor).toBe(colors.dialogNeutralActionBackground);
      expect(action.backgroundColor).toBe("#F3F4F6");
      expect(label.color).toBe(colors.dialogNeutralActionText);
    });

    it("gives Confirmer a destructive red background with white text, using the dedicated DSF tokens — never color.danger, a different red used elsewhere", () => {
      render(<AbandonCreationModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

      const action = StyleSheet.flatten(screen.getByLabelText("Confirmer").props.style);
      const label = StyleSheet.flatten(screen.getByText("Confirmer").props.style);
      expect(action.backgroundColor).toBe(colors.dialogDestructiveActionBackground);
      expect(action.backgroundColor).toBe("#E62B1E");
      expect(action.backgroundColor).not.toBe(colors.danger);
      expect(action.borderColor).toBe(colors.dialogDestructiveActionBorder);
      expect(label.color).toBe(colors.background);
    });
  });

  it("REWORK10, point 4 — floating card is 354pt wide with an 18pt radius, and the message→actions spacing is exactly spacing/16 (16pt)", () => {
    render(<AbandonCreationModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

    const card = screen.getByTestId("abandon-creation-card");
    const cardStyle = StyleSheet.flatten(card.props.style);
    expect(cardStyle.width).toBe(dimensions.decisionDialog.width);
    expect(cardStyle.width).toBe(354);
    expect(cardStyle.borderRadius).toBe(18);
    expect(cardStyle.gap).toBe(16);
  });

  describe("REWORK10 — comportement (point 5)", () => {
    it("calls onCancel, never onConfirm, when 'Annuler' is pressed — restoring the draft, never deleting", () => {
      const onCancel = jest.fn();
      const onConfirm = jest.fn();
      render(<AbandonCreationModal onCancel={onCancel} onConfirm={onConfirm} />);

      fireEvent.press(screen.getByLabelText(modalStrings.continueCreating));

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("calls onConfirm, never onCancel, when 'Confirmer' is pressed — only Confirmer triggers the destructive action", () => {
      const onCancel = jest.fn();
      const onConfirm = jest.fn();
      render(<AbandonCreationModal onCancel={onCancel} onConfirm={onConfirm} />);

      fireEvent.press(screen.getByLabelText(modalStrings.abandon));

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onCancel).not.toHaveBeenCalled();
    });

    it("treats the Android hardware back request (onRequestClose) as Annuler — never as Confirmer", () => {
      const onCancel = jest.fn();
      const onConfirm = jest.fn();
      render(<AbandonCreationModal onCancel={onCancel} onConfirm={onConfirm} />);

      fireEvent(screen.UNSAFE_getByType(Modal), "requestClose");

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("never wires a touch on the backdrop/voile to onConfirm — the destructive action is never triggered by dismissing the veil", () => {
      const onCancel = jest.fn();
      const onConfirm = jest.fn();
      render(<AbandonCreationModal onCancel={onCancel} onConfirm={onConfirm} />);

      // Le voile n'est pas un `Pressable` : aucune prop `onPress` n'existe
      // sur lui, ce qui prouve structurellement qu'aucun geste sur le
      // fond ne peut jamais déclencher `onConfirm` (acquis gelé, non
      // modifié par ce cycle).
      const backdrop = screen.getByTestId("abandon-creation-backdrop");
      expect(backdrop.props.onPress).toBeUndefined();
      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe("REWORK10 — non-régression des acquis gelés", () => {
    it("keeps the floating-centered dialog and fade animation (Modal transparent, animationType='fade') unchanged", () => {
      render(<AbandonCreationModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

      const modal = screen.UNSAFE_getByType(Modal);
      expect(modal.props.transparent).toBe(true);
      expect(modal.props.animationType).toBe("fade");
      expect(modal.props.visible).toBe(true);
    });

    it("keeps the exact same backdrop styling (semi-transparent dark overlay, centered content) untouched", () => {
      render(<AbandonCreationModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

      const backdrop = screen.getByTestId("abandon-creation-backdrop");
      const backdropStyle = StyleSheet.flatten(backdrop.props.style);
      expect(backdropStyle.backgroundColor).toBe("rgba(20, 20, 20, 0.5)");
      expect(backdropStyle.alignItems).toBe("center");
      expect(backdropStyle.justifyContent).toBe("center");
    });
  });
});
