import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { Modal, StyleSheet } from "react-native";

import { MovementSaveDialog, type MovementSaveChoice } from "@/features/activities/MovementSaveDialog";
import { strings } from "@/shared/i18n";

/**
 * PRE-7 story R-4 (D-445 C03, v7 §3 ; relevé utilisateur §4, `9952:44349`, `10253:20414`,
 * `10257:20651`) — dialogue unique de sauvegarde du mouvement : variante de choix sans
 * présélection (Confirmer visible et indisponible jusqu'au choix), variante de confirmation,
 * portée réelle annoncée (zéro, un, plusieurs), Annuler sans effet de choix.
 */

const t = strings.screens.activities.editor.movementSave;

function renderChoice(otherCount = 2) {
  const onConfirm = jest.fn<(choice: MovementSaveChoice) => void>();
  const onCancel = jest.fn();
  render(<MovementSaveDialog variant="CHOICE" otherCount={otherCount} onConfirm={onConfirm} onCancel={onCancel} />);
  return { onConfirm, onCancel };
}

describe("MovementSaveDialog — variante CHOICE (nom modifié)", () => {
  it("titre « Vous souhaitez : », deux choix sans présélection ; Confirmer visible mais indisponible, Annuler disponible", () => {
    const { onConfirm } = renderChoice();
    const dialog = screen.getByTestId("movement-save-dialog");
    expect(within(dialog).getByText(t.choiceTitle)).toBeTruthy();
    expect(within(dialog).getByText(t.update)).toBeTruthy();
    expect(within(dialog).getByText(t.updateDetail)).toBeTruthy();
    expect(within(dialog).getByText(t.newMovement)).toBeTruthy();
    expect(within(dialog).getByText(t.newMovementDetail)).toBeTruthy();
    for (const choice of ["UPDATE", "NEW_MOVEMENT"]) {
      expect(screen.getByTestId(`movement-save-choice-${choice}`).props.accessibilityState).toEqual({ checked: false });
    }
    const confirm = screen.getByTestId("movement-save-confirm");
    expect(confirm.props.accessibilityState).toMatchObject({ disabled: true });
    expect(within(confirm).getByText(t.confirm)).toBeTruthy();
    fireEvent.press(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByTestId("movement-save-cancel").props.accessibilityState?.disabled).not.toBe(true);
  });

  it("un choix coché rend Confirmer disponible et transmet ce choix ; changer de choix est permis", () => {
    const { onConfirm } = renderChoice();
    fireEvent.press(screen.getByTestId("movement-save-choice-NEW_MOVEMENT"));
    expect(screen.getByTestId("movement-save-choice-NEW_MOVEMENT").props.accessibilityState).toEqual({ checked: true });
    expect(screen.getByTestId("movement-save-confirm").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(screen.getByTestId("movement-save-choice-UPDATE"));
    expect(screen.getByTestId("movement-save-choice-NEW_MOVEMENT").props.accessibilityState).toEqual({ checked: false });
    fireEvent.press(screen.getByTestId("movement-save-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith("UPDATE");
  });

  it("Annuler n'émet aucun choix", () => {
    const { onConfirm, onCancel } = renderChoice();
    fireEvent.press(screen.getByTestId("movement-save-choice-UPDATE"));
    fireEvent.press(screen.getByTestId("movement-save-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("retour système (`onRequestClose` du Modal) : Annuler, aucun choix émis", () => {
    const { onConfirm, onCancel } = renderChoice();
    fireEvent.press(screen.getByTestId("movement-save-choice-UPDATE"));
    screen.UNSAFE_getByType(Modal).props.onRequestClose();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("portée : zéro jamais masqué, accord au singulier, pluriel calculé", () => {
    renderChoice(0);
    expect(screen.getByText(t.noOther)).toBeTruthy();
    screen.unmount();
    renderChoice(1);
    expect(screen.getByText("1 autre exercice utilise ce mouvement.")).toBeTruthy();
    screen.unmount();
    renderChoice(4);
    expect(screen.getByText("4 autres exercices utilisent ce mouvement.")).toBeTruthy();
  });

  it("géométrie du relevé : fenêtre de 354, cartes de 68 de haut au moins, rayon 12", () => {
    renderChoice();
    expect(StyleSheet.flatten(screen.getByTestId("movement-save-dialog").props.style)).toMatchObject({ width: 354 });
    expect(StyleSheet.flatten(screen.getByTestId("movement-save-choice-UPDATE").props.style)).toMatchObject({
      minHeight: 68,
      borderRadius: 12,
    });
  });
});

describe("MovementSaveDialog — variante CONFIRM (nom inchangé, contenu modifié)", () => {
  it("« Vous avez modifié ce mouvement », portée et application à tous ; aucun choix ; Confirmer disponible", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(<MovementSaveDialog variant="CONFIRM" otherCount={2} onConfirm={onConfirm} onCancel={onCancel} />);
    const dialog = screen.getByTestId("movement-save-dialog");
    expect(within(dialog).getByText(t.confirmTitle)).toBeTruthy();
    expect(within(dialog).getByText(`2 autres exercices utilisent ce mouvement. ${t.appliesToAll}`)).toBeTruthy();
    expect(screen.queryByTestId("movement-save-choice-UPDATE")).toBeNull();
    expect(screen.getByTestId("movement-save-confirm").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(screen.getByTestId("movement-save-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByTestId("movement-save-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("une seule autre utilisation : accord au singulier", () => {
    render(<MovementSaveDialog variant="CONFIRM" otherCount={1} onConfirm={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByText(`1 autre exercice utilise ce mouvement. ${t.appliesToAll}`)).toBeTruthy();
  });
});
