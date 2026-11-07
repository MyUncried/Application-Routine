import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { ExerciseExitConfirmModal } from "@/features/sessions/ExerciseExitConfirmModal";

/**
 * Recette du 05/11/2026 au soir (r-libre, Hermann : « saisir un nom, appuyer sur entrée, appuyer sur la croix, confirmer
 * l’annulation > le message disparaît puis l’écran est bloqué aucune réaction sur aucun contrôle ») : la navigation rejouée après
 * « Confirmer » attend la fermeture du dialogue (`onDismiss` iOS, ou la fin du fondu) — une feuille native ne se retire pas pendant
 * qu'un dialogue se ferme par-dessus elle.
 */
describe("DecisionDialog — confirmation après fermeture (r-libre)", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("confirmAfterDismiss : le dialogue se ferme d'abord ; la confirmation arrive une seule fois, à la fermeture", () => {
    jest.useFakeTimers();
    const onConfirm = jest.fn();
    render(<ExerciseExitConfirmModal isCreation onCancel={jest.fn()} onConfirm={onConfirm} confirmAfterDismiss />);
    fireEvent.press(screen.getByLabelText("Confirmer"));
    expect(onConfirm).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("sans confirmAfterDismiss : confirmation immédiate (comportement des autres dialogues inchangé)", () => {
    const onConfirm = jest.fn();
    render(<ExerciseExitConfirmModal onCancel={jest.fn()} onConfirm={onConfirm} />);
    fireEvent.press(screen.getByLabelText("Confirmer"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
