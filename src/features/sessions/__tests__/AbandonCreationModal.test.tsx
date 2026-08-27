import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { Modal } from "react-native";

import { AbandonCreationModal } from "@/features/sessions/AbandonCreationModal";
import { strings } from "@/shared/i18n";

describe("AbandonCreationModal", () => {
  it("displays the exact title and message from the functional specification", () => {
    render(<AbandonCreationModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

    expect(screen.getByText("Abandonner la création ?")).toBeTruthy();
    expect(
      screen.getByText("Les informations saisies seront perdues et la séance ne sera pas créée."),
    ).toBeTruthy();
  });

  it("exposes exactly the two specified actions", () => {
    render(<AbandonCreationModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

    expect(screen.getByLabelText(strings.screens.composition.abandonModal.continueCreating)).toBeTruthy();
    expect(screen.getByLabelText(strings.screens.composition.abandonModal.abandon)).toBeTruthy();
  });

  it("calls onCancel, never onConfirm, when 'Continuer la création' is pressed", () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    render(<AbandonCreationModal onCancel={onCancel} onConfirm={onConfirm} />);

    fireEvent.press(screen.getByLabelText(strings.screens.composition.abandonModal.continueCreating));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm, never onCancel, when 'Abandonner' is pressed", () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    render(<AbandonCreationModal onCancel={onCancel} onConfirm={onConfirm} />);

    fireEvent.press(screen.getByLabelText(strings.screens.composition.abandonModal.abandon));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("treats the Android hardware back request (onRequestClose) as 'Continuer la création'", () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    render(<AbandonCreationModal onCancel={onCancel} onConfirm={onConfirm} />);

    fireEvent(screen.UNSAFE_getByType(Modal), "requestClose");

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
