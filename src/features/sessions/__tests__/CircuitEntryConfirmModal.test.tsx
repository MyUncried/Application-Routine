import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Modal } from "react-native";

import { CircuitEntryConfirmModal, formatCircuitEntryMessage } from "@/features/sessions/CircuitEntryConfirmModal";
import { strings } from "@/shared/i18n";

const t = strings.screens.composition.circuitEntryConfirmModal;

/** PRE-6 (story 3.2, CE-CIR-02, Figma `8328:34964`) : conversion Tours → Séries avec perte. */
describe("CircuitEntryConfirmModal — kind NATURE (PRE-6 story 3.2)", () => {
  function renderNature(seriesCount: number) {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    render(<CircuitEntryConfirmModal kind="NATURE" seriesCount={seriesCount} onCancel={onCancel} onConfirm={onConfirm} />);
    return { onCancel, onConfirm };
  }

  it("title and plural message (« 2 séries », « 2e »)", () => {
    renderNature(2);
    expect(screen.getByText("Passer en circuit de séries ?")).toBeTruthy();
    expect(
      screen.getByText(
        "Tous les exercices auront 2 séries. Les séries au-delà de la 2e seront supprimées, avec les valeurs qu’elles portent.",
      ),
    ).toBeTruthy();
  });

  it("singular message at N = 1 (« 1 série », « 1re »)", () => {
    expect(formatCircuitEntryMessage("NATURE", 1)).toBe(
      "Tous les exercices auront 1 série. Les séries au-delà de la 1re seront supprimées, avec les valeurs qu’elles portent.",
    );
  });

  it("uses its own testID prefix", () => {
    renderNature(3);
    expect(screen.getByTestId("circuit-nature-confirm-card")).toBeTruthy();
    expect(screen.getByTestId("circuit-nature-confirm-backdrop")).toBeTruthy();
    expect(screen.queryByTestId("circuit-entry-confirm-card")).toBeNull();
  });

  it("Annuler and Confirmer call their own callback", () => {
    const { onCancel, onConfirm } = renderNature(2);
    fireEvent.press(screen.getByLabelText(t.cancel));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText(t.confirm));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("Android back (onRequestClose) is Annuler", () => {
    const { onCancel, onConfirm } = renderNature(2);
    screen.UNSAFE_getByType(Modal).props.onRequestClose();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("the backdrop does not confirm", () => {
    const { onCancel, onConfirm } = renderNature(2);
    fireEvent.press(screen.getByTestId("circuit-nature-confirm-backdrop"));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
