import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { DeviceEventEmitter, Platform } from "react-native";

import { CarrierDurationSheet } from "@/features/sessions/CarrierDurationSheet";

/**
 * Décision de Hermann du 06/11/2026 (constat c : « … plus aucune roulette ou popover. Idem pour la durée
 * d'un circuit formaté dans la composition de séances. ») — la durée portée par un Circuit se saisit au
 * clavier dans la case des Formats (`TableCell`), avec la barre du clavier des Formats ; plus de
 * roulette. Jest ne prouve que l'arbre JS : clavier et barre réels relèvent de la recette iPhone.
 */

const INPUT = "carrier-duration-input";

/** Frappe d'une touche dans la case (texte natif = texte affiché + touche, curseur à droite). */
function type(keys: string) {
  for (const key of [...keys]) {
    const input = screen.getByTestId(INPUT);
    fireEvent.changeText(input, String(input.props.value ?? "") + key);
  }
}

function renderSheet(seconds: number | null, allowsNone = false) {
  const onValidate = jest.fn<(seconds: number | null) => void>();
  const onCancel = jest.fn();
  render(<CarrierDurationSheet seconds={seconds} allowsNone={allowsNone} onValidate={onValidate} onCancel={onCancel} />);
  fireEvent(screen.getByTestId(INPUT), "focus");
  return { onValidate, onCancel };
}

const close = () => fireEvent.press(screen.getByTestId("carrier-duration-backdrop"));

describe("CarrierDurationSheet — durée du Circuit au clavier (décision du 06/11/2026)", () => {
  it("aucune roulette ; case clavier numérique « MM:SS » remplie par la droite", () => {
    renderSheet(720);
    expect(screen.queryByTestId("duration-wheel-validate")).toBeNull();
    expect(screen.getByTestId(INPUT).props.keyboardType).toBe("number-pad");
    expect(screen.getByTestId(INPUT).props.value).toBe("12:00");
    type("1");
    expect(screen.getByTestId(INPUT).props.value).toBe("00:01");
    type("30");
    expect(screen.getByTestId(INPUT).props.value).toBe("01:30");
  });

  it("la saisie est appliquée à la fermeture", () => {
    const { onValidate, onCancel } = renderSheet(720);
    type("1500");
    close();
    expect(onValidate).toHaveBeenCalledWith(15 * 60);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("valeur inchangée : rien n'est écrit", () => {
    const { onValidate, onCancel } = renderSheet(720);
    close();
    expect(onValidate).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });

  it("case vidée : la valeur précédente est gardée (bloc, tour)", () => {
    const { onValidate, onCancel } = renderSheet(720);
    // Retour arrière depuis la valeur (« 1200 ») jusqu'à la case vide.
    for (let index = 0; index < 4; index += 1) {
      const current = screen.getByTestId(INPUT);
      fireEvent.changeText(current, String(current.props.value).slice(0, -1));
    }
    close();
    expect(onValidate).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });

  it("Temps limite (For time) : « Sans limite » affiché vide ; une case vidée repasse à « Sans limite »", () => {
    const { onValidate } = renderSheet(600, true);
    for (let index = 0; index < 5; index += 1) {
      const current = screen.getByTestId(INPUT);
      fireEvent.changeText(current, String(current.props.value).slice(0, -1));
    }
    close();
    expect(onValidate).toHaveBeenCalledWith(null);
  });

  it("Temps limite sans valeur : « Sans limite » en texte de la case", () => {
    render(<CarrierDurationSheet seconds={null} allowsNone onValidate={() => undefined} onCancel={() => undefined} />);
    expect(screen.getByTestId(INPUT).props.placeholder).toBe("Sans limite");
  });

  it("barre du clavier des Formats (iOS) : « Fermer » applique la saisie", () => {
    const os = Platform.OS;
    Object.defineProperty(Platform, "OS", { configurable: true, get: () => "ios" });
    try {
      const { onValidate } = renderSheet(720);
      act(() => {
        DeviceEventEmitter.emit("keyboardWillShow", { endCoordinates: { screenX: 0, screenY: 500, width: 390, height: 344 }, duration: 0 });
      });
      type("45");
      fireEvent.press(screen.getByTestId("execution-sheet-keyboard-close"));
      expect(onValidate).toHaveBeenCalledWith(45);
    } finally {
      Object.defineProperty(Platform, "OS", { configurable: true, get: () => os });
    }
  });
});
