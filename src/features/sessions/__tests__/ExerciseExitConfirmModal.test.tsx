import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { Modal } from "react-native";

import { ExerciseExitConfirmModal } from "@/features/sessions/ExerciseExitConfirmModal";
import { strings } from "@/shared/i18n";

describe("ExerciseExitConfirmModal (D-094)", () => {
  it("displays the exact title and message from D-094", () => {
    render(<ExerciseExitConfirmModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

    expect(screen.getByText("Abandonner les modifications ?")).toBeTruthy();
    expect(
      screen.getByText("Les modifications apportées à cette activité seront perdues."),
    ).toBeTruthy();
  });

  it("exposes exactly the two specified actions", () => {
    render(<ExerciseExitConfirmModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

    expect(
      screen.getByLabelText(strings.screens.exercise.exitConfirmModal.continueEditing),
    ).toBeTruthy();
    expect(screen.getByLabelText(strings.screens.exercise.exitConfirmModal.abandon)).toBeTruthy();
  });

  it("calls onCancel, never onConfirm, when 'Continuer la modification' is pressed", () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    render(<ExerciseExitConfirmModal onCancel={onCancel} onConfirm={onConfirm} />);

    fireEvent.press(
      screen.getByLabelText(strings.screens.exercise.exitConfirmModal.continueEditing),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm, never onCancel, when 'Abandonner' is pressed", () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    render(<ExerciseExitConfirmModal onCancel={onCancel} onConfirm={onConfirm} />);

    fireEvent.press(screen.getByLabelText(strings.screens.exercise.exitConfirmModal.abandon));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("treats the Android hardware back request (onRequestClose) as 'Continuer la modification'", () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    render(<ExerciseExitConfirmModal onCancel={onCancel} onConfirm={onConfirm} />);

    fireEvent(screen.UNSAFE_getByType(Modal), "requestClose");

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
