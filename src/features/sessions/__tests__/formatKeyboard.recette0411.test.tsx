import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { KeyboardAccessoryBar } from "@/features/activities/KeyboardAccessoryBar";
import { emomNoLoadFrom, emomSeriesLoads } from "@/domain/sessions/formatModels";
import { TableCell } from "@/features/sessions/FormatTables";

/**
 * Recette iPhone du 04/11/2026 (Hermann) — barre d'unité et cases des tableaux de Formats :
 * « Appuyer sur durée doit mettre le champ dans le format cible 00:00 » ; « Appuyer manuellement sur un champ doit
 * positionner le curseur à droite de la valeur » ; « Le bouton sélectionné en position à gauche pendant la frappe, y
 * reste lorsqu'on appuie dessus pour afficher l'autre option, qui elle apparaît à sa droite. »
 */
describe("barre d'unité des tableaux de Formats", () => {
  const renderBar = (units: { current: "REPETITIONS" | "DURATION"; picking: boolean }) => {
    const onPick = jest.fn();
    const onReopen = jest.fn();
    render(
      <KeyboardAccessoryBar
        keyboardFrame={{ screenY: 500, duration: 0 }}
        containerBottom={800}
        reduceMotion
        onHeight={() => undefined}
        canPrevious
        canNext
        onPrevious={() => undefined}
        onNext={() => undefined}
        onClose={() => undefined}
        units={{ ...units, allowed: ["REPETITIONS", "DURATION"], onPick, onReopen }}
      />,
    );
    return { onPick, onReopen };
  };

  it("unité choisie : toucher l'unité de gauche repropose les deux unités ; l'autre est inactive tant qu'elle est masquée", () => {
    const { onPick, onReopen } = renderBar({ current: "DURATION", picking: false });
    fireEvent.press(screen.getByTestId("keyboard-unit-duration"));
    expect(onReopen).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("keyboard-unit-repetitions").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("keyboard-unit-repetitions"));
    expect(onPick).not.toHaveBeenCalled();
  });

  it("choix proposé : chaque unité se choisit ; Précédent et Suivant sont masqués", () => {
    const { onPick } = renderBar({ current: "REPETITIONS", picking: true });
    fireEvent.press(screen.getByTestId("keyboard-unit-duration"));
    expect(onPick).toHaveBeenCalledWith("DURATION");
    expect(screen.getByTestId("execution-sheet-keyboard-close")).toBeTruthy();
  });
});

describe("incrément de charge EMOM négatif (Hermann, 04/11/2026)", () => {
  it("charges arrêtées à 0 ; première série sans charge", () => {
    expect(emomSeriesLoads(12, -2.5, 6)).toEqual([12, 9.5, 7, 4.5, 2, 0]);
    expect(emomNoLoadFrom(12, -2.5, 6)).toBe(6);
    expect(emomNoLoadFrom(12, -2.5, 5)).toBeNull();
    expect(emomNoLoadFrom(12, 2.5, 6)).toBeNull();
  });

  it("case signée : « − » devant la valeur, saisie en valeur absolue, valeur rendue négative", () => {
    const onChange = jest.fn();
    render(<TableCell kind="decimal" value={null} sign={-1} onChange={onChange} format={String} label="+ / série" testID="inc" />);
    fireEvent(screen.getByTestId("inc"), "focus");
    expect(screen.getByTestId("inc").props.value).toBe("−");
    fireEvent.changeText(screen.getByTestId("inc"), "−2");
    expect(onChange).toHaveBeenLastCalledWith(-2);
  });

  it("barre : « ± » dans le premier emplacement, état annoncé", () => {
    const onPress = jest.fn();
    render(
      <KeyboardAccessoryBar keyboardFrame={{ screenY: 500, duration: 0 }} containerBottom={800} reduceMotion onHeight={() => undefined} canPrevious canNext onPrevious={() => undefined} onNext={() => undefined} onClose={() => undefined} sign={{ negative: true, onPress }} />,
    );
    fireEvent.press(screen.getByTestId("keyboard-sign"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("keyboard-sign").props.accessibilityState).toMatchObject({ selected: true });
  });
});

describe("case de durée", () => {
  it("en saisie, vide : « 00:00 » ; curseur à droite de la valeur", () => {
    render(<TableCell kind="duration" value={null} onChange={() => undefined} format={String} label="Objectif" testID="cell" />);
    const cell = screen.getByTestId("cell");
    expect(cell.props.value).toBe("");
    fireEvent(cell, "focus");
    expect(screen.getByTestId("cell").props.value).toBe("00:00");
    expect(screen.getByTestId("cell").props.selection).toEqual({ start: 5, end: 5 });
  });

  it("répétitions : curseur à droite de la valeur affichée", () => {
    render(<TableCell kind="integer" value={12} onChange={() => undefined} format={String} label="Objectif" testID="cell" />);
    fireEvent(screen.getByTestId("cell"), "focus");
    expect(screen.getByTestId("cell").props.selection).toEqual({ start: 2, end: 2 });
  });
});
