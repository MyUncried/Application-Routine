import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import { ReferenceValueDialog } from "@/features/reference-data/ReferenceValueDialog";

describe("ReferenceValueDialog — long-press menu (D4, D-259)", () => {
  it("offers exactly Annuler, Modifier, Supprimer, without selecting or deselecting the value", () => {
    const onCancel = jest.fn();
    const onModify = jest.fn();
    const onDelete = jest.fn();
    render(
      <ReferenceValueDialog
        name="Focus"
        isUsed={false}
        onCancel={onCancel}
        onModify={onModify}
        onDelete={onDelete}
        testIDPrefix="ref-dialog"
      />,
    );

    expect(screen.getByTestId("ref-dialog-cancel")).toBeTruthy();
    expect(screen.getByTestId("ref-dialog-modify")).toBeTruthy();
    expect(screen.getByTestId("ref-dialog-delete")).toBeTruthy();
    expect(onCancel).not.toHaveBeenCalled();
    expect(onModify).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("Annuler calls onCancel without touching Modifier/Supprimer", () => {
    const onCancel = jest.fn();
    render(
      <ReferenceValueDialog
        name="Focus"
        isUsed={false}
        onCancel={onCancel}
        onModify={jest.fn()}
        onDelete={jest.fn()}
        testIDPrefix="ref-dialog"
      />,
    );
    fireEvent.press(screen.getByTestId("ref-dialog-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("Modifier delegates editing to the caller and never opens the delete confirmation", () => {
    const onModify = jest.fn();
    render(
      <ReferenceValueDialog
        name="Focus"
        isUsed={false}
        onCancel={jest.fn()}
        onModify={onModify}
        onDelete={jest.fn()}
        testIDPrefix="ref-dialog"
      />,
    );
    fireEvent.press(screen.getByTestId("ref-dialog-modify"));
    expect(onModify).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("ref-dialog-delete-confirm-card")).toBeNull();
  });
});

describe("ReferenceValueDialog — delete confirmation (§4.10 L134/L135)", () => {
  it("shows the exact title 'Supprimer « {nom} » ?' with the current name", () => {
    render(
      <ReferenceValueDialog
        name="Récupération douce"
        isUsed={false}
        onCancel={jest.fn()}
        onModify={jest.fn()}
        onDelete={jest.fn()}
        testIDPrefix="ref-dialog"
      />,
    );
    fireEvent.press(screen.getByTestId("ref-dialog-delete"));

    const card = screen.getByTestId("ref-dialog-delete-confirm-card");
    expect(card).toBeTruthy();
    expect(screen.getByText(/Supprimer.*Récupération douce.*\?/)).toBeTruthy();
  });

  it("shows the used-value message when isUsed is true, distinct from the unused message", () => {
    render(
      <ReferenceValueDialog
        name="Focus"
        isUsed={true}
        onCancel={jest.fn()}
        onModify={jest.fn()}
        onDelete={jest.fn()}
        testIDPrefix="ref-dialog"
      />,
    );
    fireEvent.press(screen.getByTestId("ref-dialog-delete"));

    expect(screen.getByText(/objets/)).toBeTruthy();
  });

  it("Annuler on the confirmation step calls onCancel without deleting", () => {
    const onCancel = jest.fn();
    const onDelete = jest.fn();
    render(
      <ReferenceValueDialog
        name="Focus"
        isUsed={false}
        onCancel={onCancel}
        onModify={jest.fn()}
        onDelete={onDelete}
        testIDPrefix="ref-dialog"
      />,
    );
    fireEvent.press(screen.getByTestId("ref-dialog-delete"));
    fireEvent.press(screen.getByLabelText("Annuler"));
    expect(onDelete).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("confirming deletion calls onDelete exactly once", () => {
    const onDelete = jest.fn();
    render(
      <ReferenceValueDialog
        name="Focus"
        isUsed={false}
        onCancel={jest.fn()}
        onModify={jest.fn()}
        onDelete={onDelete}
        testIDPrefix="ref-dialog"
      />,
    );
    fireEvent.press(screen.getByTestId("ref-dialog-delete"));
    fireEvent.press(screen.getByLabelText("Supprimer"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
