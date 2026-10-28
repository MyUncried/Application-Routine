import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { CatalogueSearchField, FilterCommand } from "@/shared/ui/CatalogueCommands";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-8, recette A/B (D03 à D05 ; ch13 §4.5 ; Figma `10465:23141`) — commandes communes de la zone de
 * contexte : Filtrer rond sans critère, étendu avec résumé quand un critère est actif (le rond bleu
 * retire les filtres, la zone texte ouvre la feuille) ; champ Rechercher de même hauteur visible.
 */

const props = {
  label: "Filtrer",
  title: "Filtres",
  clearLabel: "Retirer les filtres",
  editLabel: "Modifier les filtres",
  testID: "filter",
};

describe("CatalogueCommands — Filtrer et Rechercher", () => {
  it("sans critère : bouton rond 34 qui ouvre la feuille", () => {
    const onOpen = jest.fn();
    render(<FilterCommand {...props} summary={null} onOpen={onOpen} onClear={jest.fn()} />);
    expect(StyleSheet.flatten(screen.getByTestId("filter").props.style)).toMatchObject({ width: 34, height: 34, borderRadius: 17 });
    expect(screen.queryByTestId("filter-summary")).toBeNull();
    fireEvent.press(screen.getByTestId("filter"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("avec critère : pilule étendue de même hauteur, résumé ; le rond bleu retire, la zone texte ouvre", () => {
    const onOpen = jest.fn();
    const onClear = jest.fn();
    render(<FilterCommand {...props} summary="Renforcement" onOpen={onOpen} onClear={onClear} />);
    expect(StyleSheet.flatten(screen.getByTestId("filter").props.style)).toMatchObject({ height: 34, borderColor: colors.primary });
    expect(StyleSheet.flatten(screen.getByTestId("filter-clear").props.style)).toMatchObject({ backgroundColor: colors.primary });
    expect(screen.getByTestId("filter-summary").props.children).toBe("Renforcement");
    fireEvent.press(screen.getByTestId("filter-edit"));
    expect(onOpen).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByTestId("filter-clear"));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("désactivée : bouton rond grisé, même avec un résumé", () => {
    render(<FilterCommand {...props} summary="Renforcement" disabled onOpen={jest.fn()} onClear={jest.fn()} />);
    expect(screen.getByTestId("filter").props.accessibilityState).toMatchObject({ disabled: true });
    expect(StyleSheet.flatten(screen.getByTestId("filter").props.style).borderColor).toBe(colors.disabled);
  });

  it("Rechercher : champ visible 34 dans une cible de 44, largeur flexible ; croix d'effacement seulement avec une saisie", () => {
    const onChangeText = jest.fn();
    const view = render(
      <CatalogueSearchField value="" onChangeText={onChangeText} placeholder="Rechercher" accessibilityLabel="Rechercher" clearLabel="Effacer" testID="search" />,
    );
    expect(StyleSheet.flatten(screen.getByTestId("search").props.style).height).toBe(34);
    expect(screen.queryByTestId("search-clear")).toBeNull();
    view.rerender(
      <CatalogueSearchField value="squat" onChangeText={onChangeText} placeholder="Rechercher" accessibilityLabel="Rechercher" clearLabel="Effacer" testID="search" />,
    );
    fireEvent.press(screen.getByTestId("search-clear"));
    expect(onChangeText).toHaveBeenCalledWith("");
  });
});
