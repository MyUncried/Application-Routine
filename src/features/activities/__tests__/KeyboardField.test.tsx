import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet, TextInput } from "react-native";

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
 * Recette du 19/10 (RC-3) — mode décimal (charge commune, hors tableau ; D-434 : mécanisme
 * inchangé hors des tableaux) : toute la valeur est sélectionnée quand le champ prend le
 * focus, après le remplacement de la valeur affichée par le texte d'édition. Aucun
 * identifiant d'accessoire (RC-1 : la barre est rendue par la Feuille). Dans les cellules
 * du tableau, RC-3 est remplacée par D-434 (voir plus bas).
 */
describe("PRE5-2.2, recette du 19/10 — KeyboardField en mode décimal (charge commune)", () => {
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

/**
 * D-434 (décision de Hermann du 19/10 ; QD-434-1 à 4) — cellules des tableaux : valeur rendue
 * par la cellule, entrée native transparente hors des touchers (aucune sélection native ni
 * poignée iOS : ni `selectTextOnFocus`, ni sélection posée, menu d'édition et curseur masqués),
 * clavier numérique ; la première frappe remplace, les suivantes composent, Retour arrière
 * supprime le dernier chiffre. Remplace RC-3 (sélection au focus) pour la cellule Charge.
 */
describe("D-434 — KeyboardField en mode cellule", () => {
  const prototype = TextInput.prototype as unknown as { setSelection?: (start: number, end: number) => void };
  const original = prototype.setSelection;
  afterEach(() => {
    prototype.setSelection = original;
  });

  function renderCell(
    mode: "cellDuration" | "cellInteger" | "cellDecimal",
    editText: string,
    displayValue: string,
    onChangeText = jest.fn<(text: string) => void>(),
    entryGeneration = 0,
  ) {
    const setSelection = jest.fn<(start: number, end: number) => void>();
    prototype.setSelection = setSelection;
    const element = (generation: number, text: string) => (
      <KeyboardField
        mode={mode}
        displayValue={displayValue}
        editText={text}
        active={false}
        onFocus={() => undefined}
        onBlur={() => undefined}
        onChangeText={onChangeText}
        accessibilityLabel="Série 1, Durée"
        entryGeneration={generation}
        testID="cell"
      />
    );
    const view = render(element(entryGeneration, editText));
    return { setSelection, onChangeText, rerender: (generation: number, text: string) => view.rerender(element(generation, text)) };
  }
  const shown = () => String(screen.getByTestId("cell-value").props.children);
  const input = () => screen.getByTestId("cell-input");
  const key = (pressed: string) => {
    const current = String(input().props.value);
    fireEvent.changeText(input(), pressed === "⌫" ? current.slice(0, -1) : current + pressed);
  };

  it("Durée : au repos « 1 min 5 s », en saisie « 01:05 » ; clavier numérique ; aucune sélection native (ni au focus, ni à la frappe), menu et curseur masqués, entrée hors des touchers", () => {
    const { setSelection } = renderCell("cellDuration", "0105", "1 min 5 s");
    expect(shown()).toBe("1 min 5 s");
    expect(input().props.keyboardType).toBe("number-pad");
    expect(input().props.selectTextOnFocus).toBe(false);
    expect(input().props.contextMenuHidden).toBe(true);
    expect(input().props.caretHidden).toBe(true);
    expect(input().props.inputAccessoryViewID).toBeUndefined();
    expect(StyleSheet.flatten(input().props.style)).toMatchObject({ opacity: 0 });
    expect(input().parent?.parent?.props.pointerEvents ?? input().parent?.props.pointerEvents).toBe("none");
    fireEvent(input(), "focus");
    expect(shown()).toBe("01:05");
    key("3");
    key("0");
    expect(setSelection).not.toHaveBeenCalled();
  });

  it("première frappe remplace, suivantes composent (décalage vers la gauche), quatre chiffres au plus ; Retour arrière supprime le dernier chiffre", () => {
    const { onChangeText } = renderCell("cellDuration", "0105", "1 min 5 s");
    fireEvent(input(), "focus");
    key("3");
    expect(shown()).toBe("00:03");
    key("0");
    expect(shown()).toBe("00:30");
    key("1");
    key("5");
    key("9");
    expect(shown()).toBe("30:15");
    key("⌫");
    expect(shown()).toBe("03:01");
    expect(onChangeText.mock.calls.map(([text]) => text)).toEqual(["3", "30", "301", "3015", "301"]);
  });

  it("Retour arrière dès la première frappe : efface depuis la valeur ; cellule vidée : « 00:00 » atténué", () => {
    renderCell("cellDuration", "0105", "1 min 5 s");
    fireEvent(input(), "focus");
    key("⌫");
    expect(shown()).toBe("00:10");
    key("⌫");
    key("⌫");
    key("⌫");
    expect(shown()).toBe("00:00");
    expect(StyleSheet.flatten(screen.getByTestId("cell-value").props.style)).toMatchObject({ color: "#595E66" });
  });

  it("entier (Répétitions) et décimal (Charge, remplace RC-3) : la première frappe remplace", () => {
    const integer = renderCell("cellInteger", "12", "12 rép.");
    fireEvent(input(), "focus");
    expect(screen.getByTestId("cell-input").props.keyboardType).toBe("number-pad");
    expect(shown()).toBe("12");
    key("8");
    expect(shown()).toBe("8");
    expect(integer.setSelection).not.toHaveBeenCalled();
    screen.unmount();
    const decimal = renderCell("cellDecimal", "20", "20 kg");
    expect(input().props.keyboardType).toBe("decimal-pad");
    fireEvent(input(), "focus");
    key("1");
    key(",");
    key("5");
    expect(shown()).toBe("1,5");
    expect(decimal.setSelection).not.toHaveBeenCalled();
  });

  it("« À l'échec » (nouvelle génération de saisie) : la saisie repart du nouveau texte d'édition, la frappe suivante remplace", () => {
    const { rerender } = renderCell("cellDuration", "0045", "45 s");
    fireEvent(input(), "focus");
    key("1");
    expect(shown()).toBe("00:01");
    rerender(1, "");
    expect(shown()).toBe("00:00");
    rerender(2, "0045");
    expect(shown()).toBe("00:45");
    key("2");
    expect(shown()).toBe("00:02");
  });

  it("toucher de la cellule : le focus est donné à l'entrée native ; nom et valeur annoncés par la cellule", () => {
    const focus = jest.spyOn(TextInput.prototype as unknown as Record<"focus", () => void>, "focus");
    renderCell("cellDuration", "0105", "1 min 5 s");
    const cell = screen.getByTestId("cell");
    expect(cell.props.accessibilityRole).toBe("button");
    expect(cell.props.accessibilityLabel).toBe("Série 1, Durée");
    expect(cell.props.accessibilityValue).toEqual({ text: "1 min 5 s" });
    fireEvent.press(cell);
    expect(focus).toHaveBeenCalledTimes(1);
    focus.mockRestore();
  });
});
