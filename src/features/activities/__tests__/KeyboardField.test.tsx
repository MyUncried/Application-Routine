import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { TextInput } from "react-native";

import { KEYBOARD_TEXT_MAX_CODE_POINTS, KeyboardField } from "@/features/activities/KeyboardField";

/**
 * PRE-5 story 2.2 (AC1 ; FR-6, composant seulement) — mode texte du champ clavier unique,
 * utilisé par le libellé de phase (story 2.8) : clavier texte, au plus 20 points de code,
 * fermé par Retour, sans barre.
 */
describe("PRE5-2.2 — KeyboardField en mode texte", () => {
  function renderText(onChangeText = jest.fn<(text: string) => void>()) {
    render(
      <KeyboardField
        mode="text"
        displayValue="Phase 1"
        editText="Phase 1"
        active={false}
        onFocus={() => undefined}
        onBlur={() => undefined}
        onChangeText={onChangeText}
        accessibilityLabel="Libellé"
        testID="field"
      />,
    );
    return onChangeText;
  }

  it("PRE5-2.2/AC1 — clavier texte, Retour « terminé » qui ferme, aucune barre (pas d'identifiant d'accessoire), aucune sélection au focus", () => {
    renderText();
    const input = screen.getByTestId("field");
    expect(input.props.keyboardType).toBe("default");
    expect(input.props.returnKeyType).toBe("done");
    expect(input.props.submitBehavior).toBe("blurAndSubmit");
    expect(input.props.inputAccessoryViewID).toBeUndefined();
    expect(input.props.selectTextOnFocus).toBe(false);
  });

  it("PRE5-2.2/AC1 — au plus 20 points de code (un émoji compte pour un) ; une saisie plus longue est refusée", () => {
    expect(KEYBOARD_TEXT_MAX_CODE_POINTS).toBe(20);
    const onChangeText = renderText();
    fireEvent(screen.getByTestId("field"), "focus");
    const twenty = `${"🏋".repeat(10)}${"a".repeat(10)}`;
    expect([...twenty]).toHaveLength(20);
    expect(twenty.length).toBeGreaterThan(20);
    fireEvent.changeText(screen.getByTestId("field"), twenty);
    expect(screen.getByTestId("field").props.value).toBe(twenty);
    fireEvent.changeText(screen.getByTestId("field"), `${twenty}b`);
    expect(screen.getByTestId("field").props.value).toBe(twenty);
    expect(onChangeText.mock.calls.map(([text]) => text)).toEqual([twenty]);
  });
});

/**
 * Recette du 19/10 (RC-3) — mode décimal : toute la valeur est sélectionnée quand le champ
 * prend le focus (au toucher comme par Précédent / Suivant), après le remplacement de la
 * valeur affichée par le texte d'édition. Aucun identifiant d'accessoire (RC-1 : la barre
 * est rendue par la Feuille).
 */
describe("PRE5-2.2, recette du 19/10 — KeyboardField en mode décimal", () => {
  const prototype = TextInput.prototype as unknown as { setSelection?: (start: number, end: number) => void };
  const original = prototype.setSelection;
  afterEach(() => {
    prototype.setSelection = original;
  });

  function renderDecimal(editText: string) {
    const setSelection = jest.fn<(start: number, end: number) => void>();
    prototype.setSelection = setSelection;
    render(
      <KeyboardField
        mode="decimal"
        displayValue="20 kg"
        editText={editText}
        active={false}
        onFocus={() => undefined}
        onBlur={() => undefined}
        onChangeText={() => undefined}
        accessibilityLabel="Charge"
        testID="field"
      />,
    );
    return setSelection;
  }

  it("RC-3 — au focus, la valeur d'édition est sélectionnée en entier (`selectTextOnFocus` et sélection posée après le rendu)", () => {
    const setSelection = renderDecimal("20");
    const input = screen.getByTestId("field");
    expect(input.props.selectTextOnFocus).toBe(true);
    expect(input.props.inputAccessoryViewID).toBeUndefined();
    expect(setSelection).not.toHaveBeenCalled();
    fireEvent(input, "focus");
    expect(screen.getByTestId("field").props.value).toBe("20");
    expect(setSelection.mock.calls).toEqual([[0, 2]]);
    // La frappe ne resélectionne rien.
    fireEvent.changeText(screen.getByTestId("field"), "205");
    expect(setSelection).toHaveBeenCalledTimes(1);
  });

  it("RC-3 — valeur d'édition vide (0 kg) : rien à sélectionner", () => {
    const setSelection = renderDecimal("");
    fireEvent(screen.getByTestId("field"), "focus");
    expect(setSelection).not.toHaveBeenCalled();
  });
});
