import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

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
        accessoryID="execution-sheet-keyboard-bar"
        accessibilityLabel="Libellé"
        testID="field"
      />,
    );
    return onChangeText;
  }

  it("PRE5-2.2/AC1 — clavier texte, Retour « terminé » qui ferme, aucune barre (pas d'identifiant d'accessoire)", () => {
    renderText();
    const input = screen.getByTestId("field");
    expect(input.props.keyboardType).toBe("default");
    expect(input.props.returnKeyType).toBe("done");
    expect(input.props.submitBehavior).toBe("blurAndSubmit");
    expect(input.props.inputAccessoryViewID).toBeUndefined();
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
