import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import type { MovementChoice } from "@/features/activities/ActivityDefinitionService";
import { MovementSuggestionPanel, familyRuns } from "@/features/activities/MovementSuggestionPanel";
import { strings } from "@/shared/i18n";

/**
 * PRE-7 story R-5 puis PRE-9 CAT.2 (CE-MVT-RESULT-01 ; spécification « Résultats de recherche des
 * Mouvements — PRE-9 » du 30/10/2026 ; décision de Hermann du 30/10/2026) — panneau sous le nom :
 * message d'unicité, cartes Résultat (« Ajouter un niveau » seul, aucune réutilisation) ou
 * Composition (aucun bouton, toucher = utiliser), filet de famille, état « Niveau, plus facile ou
 * plus difficile » à carte unique, appui signalé pour figer l'ordre. Géométrie lue sur les styles ;
 * le rendu réel relève de la recette sur iPhone.
 */

const t = strings.screens.activities.editor.movementSuggestion;
const hidden = { includeHiddenElements: true } as const;

function choice(id: string, name: string, overrides: Partial<MovementChoice> = {}, groupId: string | null = null): MovementChoice {
  const movement: Movement = {
    id,
    name,
    description: "Pieds largeur d’épaules\nDescente contrôlée",
    media: [],
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
    phases: [],
    nextPhaseId: 1,
    aliases: [],
    levelGroup: groupId === null ? null : { groupId, sortKey: overrides.level?.rank ?? 1 },
  };
  return { movement, definitionCount: 1, level: null, ...overrides };
}

const squats = choice("squats", "Squats", { level: { rank: 2, total: 2 } }, "famille-squat");
const assisted = choice("assistes", "Squats assistés", { level: { rank: 1, total: 2 } }, "famille-squat");
const bulgarian = choice("bulgare", "Squat bulgare");
const front = choice("front", "Front squat");
const goblet = choice("goblet", "Goblet squat");

function renderPanel(overrides: Partial<Parameters<typeof MovementSuggestionPanel>[0]> = {}) {
  const props = {
    message: null,
    results: [squats, assisted],
    variantOf: null,
    onUse: jest.fn(),
    onCreateVariant: jest.fn(),
    onChooseVariant: jest.fn(),
    onBack: jest.fn(),
    onTouchingChange: jest.fn(),
    ...overrides,
  };
  render(<MovementSuggestionPanel {...props} />);
  return props;
}

const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);

describe("PRE-9 CAT.2 — MovementSuggestionPanel, carte Résultat (Créer un Mouvement)", () => {
  it("nom tel que saisi, « Niveau N » dérivé (absent sans groupe), description sur deux lignes « … » ; « Ajouter un niveau » seul", () => {
    const props = renderPanel({ results: [squats, bulgarian] });
    expect(screen.getByTestId("movement-suggestion-result-squats-name").props.children).toBe("Squats");
    expect(screen.getByTestId("movement-suggestion-result-squats-level").props.children).toBe("Niveau 2");
    expect(screen.queryByTestId("movement-suggestion-result-bulgare-level")).toBeNull();
    const description = screen.getByTestId("movement-suggestion-result-squats-description");
    expect(description.props.children).toBe("Pieds largeur d’épaules Descente contrôlée");
    expect(description.props.numberOfLines).toBe(2);
    expect(description.props.ellipsizeMode).toBe("tail");
    expect(screen.queryByTestId("movement-suggestion-message")).toBeNull();
    expect(screen.queryByTestId("movement-suggestion-back")).toBeNull();
    // Aucun « Utiliser » ni « Utiliser ce mouvement » / « Ouvrir ce mouvement ».
    expect(screen.queryByTestId("movement-suggestion-result-squats-use")).toBeNull();
    expect(screen.queryByText(t.useMovement)).toBeNull();
    expect(screen.queryByText(strings.screens.movement.suggestion.useMovement)).toBeNull();

    const add = screen.getByTestId("movement-suggestion-result-squats-variant");
    expect(add.props.accessibilityLabel).toBe("Ajouter un niveau, Squats");
    expect(add.props.accessibilityState).toMatchObject({ expanded: false });
    expect(screen.getByTestId("movement-suggestion-result-squats-variant-label").props.children).toBe("Ajouter\nun niveau");
    fireEvent.press(add);
    expect(props.onCreateVariant).toHaveBeenCalledWith(squats);
    expect(props.onChooseVariant).not.toHaveBeenCalled();
  });

  it("décision du 30/10/2026 : le toucher du corps de la carte Résultat ne réutilise rien", () => {
    const props = renderPanel();
    const body = screen.getByTestId("movement-suggestion-result-squats-summary");
    expect(body.props.accessibilityRole).toBeUndefined();
    fireEvent.press(body);
    expect(props.onUse).not.toHaveBeenCalled();
  });

  it("géométrie du composant : 338 × 73 nominal, bouton 66 × 32 à x = 264, zone tactile 78 × 36 à (258, 31), description 179", () => {
    renderPanel();
    expect(style("movement-suggestion-result-squats")).toMatchObject({ minHeight: 73, borderWidth: 0.5, borderRadius: 12 });
    // Zone tactile : bord droit à 338 − 258 − 78 = 2 du bord (1,5 sous le contour), y = 31.
    expect(style("movement-suggestion-result-squats-variant")).toMatchObject({ position: "absolute", width: 78, height: 36, top: 30.5, right: 1.5 });
    // Libellé 66 × 32, centré dans la zone : x = 258 + 6 = 264, y = 31 + 2 = 33, bas à 65 (fin de la description).
    expect(style("movement-suggestion-result-squats-variant-label")).toMatchObject({ width: 66, height: 32, textAlign: "right", fontSize: 13, lineHeight: 16 });
    expect(style("movement-suggestion-result-squats-description")).toMatchObject({ marginTop: 4, fontSize: 12, lineHeight: 16 });
    // Colonne de texte : bord droit à 82 du bord de la carte (7,5 de marge + 0,5 de contour + 74) ;
    // à 338 : 338 − 77 − 82 = 179.
    const column = StyleSheet.flatten(screen.getByTestId("movement-suggestion-result-squats-description").parent!.parent!.props.style);
    expect(column).toMatchObject({ marginRight: 74 });
  });
});

describe("PRE-9 CAT.2 — état « Niveau, plus facile ou plus difficile » (`10415:21939`)", () => {
  it("une seule carte dépliée 338 × 104, ligne « Plus facile | Plus difficile », cadre de retour ; Plus facile → avant, Plus difficile → après", () => {
    const props = renderPanel({ variantOf: "squats" });
    expect(screen.queryByTestId("movement-suggestion-result-assistes")).toBeNull();
    expect(style("movement-suggestion-result-squats")).toMatchObject({ minHeight: 104 });
    expect(screen.getByTestId("movement-suggestion-result-squats-variant").props.accessibilityState).toMatchObject({ expanded: true });
    // Aucun « Utiliser ce mouvement », aucun second cadre, aucun symbole d'arborescence.
    expect(screen.queryByText(t.useMovement)).toBeNull();
    expect(screen.queryByTestId("movement-suggestion-result-squats-use")).toBeNull();
    expect(screen.queryAllByTestId(/^movement-suggestion-result-.+-slot$/)).toHaveLength(1);
    expect(screen.queryAllByTestId(/family-rail/, hidden)).toHaveLength(0);
    // Contrôles : x 90,5 (largeur 64) et 183,5, y 68, hauteur 28 ; séparateur 1,5 × 12 à (166,5 ; 74,5).
    expect(style("movement-suggestion-result-squats-easier")).toMatchObject({ left: 90, width: 64, height: 28 });
    expect(style("movement-suggestion-result-squats-harder")).toMatchObject({ left: 183, height: 28 });
    expect(style("movement-suggestion-result-squats-options-separator")).toMatchObject({ left: 166, top: 6.5, width: 1.5, height: 12 });
    expect(style("movement-suggestion-result-squats-options")).toMatchObject({ height: 28, marginBottom: 7.5 });
    // Panneau : 14 + 36 + 10 + 104 + 14 = 178.
    expect(style("movement-suggestion-back")).toMatchObject({ height: 36, marginTop: 13 });
    expect(StyleSheet.flatten(screen.getByTestId("movement-suggestion-list").props.contentContainerStyle)).toMatchObject({ paddingTop: 10, paddingBottom: 13 });

    expect(screen.getByLabelText(t.easier)).toBeTruthy();
    fireEvent.press(screen.getByTestId("movement-suggestion-result-squats-easier"));
    expect(props.onChooseVariant).toHaveBeenLastCalledWith(squats, "BEFORE_ORIGIN");
    fireEvent.press(screen.getByTestId("movement-suggestion-result-squats-harder"));
    expect(props.onChooseVariant).toHaveBeenLastCalledWith(squats, "AFTER_ORIGIN");
    fireEvent.press(screen.getByTestId("movement-suggestion-back"));
    expect(props.onBack).toHaveBeenCalledTimes(1);
    // « Ajouter un niveau » touché à nouveau : replie (retour à la liste), rien n'est choisi.
    fireEvent.press(screen.getByTestId("movement-suggestion-result-squats-variant"));
    expect(props.onBack).toHaveBeenCalledTimes(2);
    expect(props.onCreateVariant).not.toHaveBeenCalled();
  });
});

describe("PRE-9 CAT.2 — carte Composition (Créer un Exercice, Composition de Séance)", () => {
  it("aucun bouton ; toute la carte est un seul bouton accessible ; le toucher utilise le Mouvement", () => {
    const props = renderPanel({ cardVariant: "composition", onCreateVariant: undefined });
    expect(screen.queryByTestId("movement-suggestion-result-squats-variant")).toBeNull();
    expect(screen.queryByTestId("movement-suggestion-result-squats-use")).toBeNull();
    expect(screen.queryByText(t.useMovement)).toBeNull();
    expect(screen.queryByText("Ajouter\nun niveau")).toBeNull();
    const card = screen.getByTestId("movement-suggestion-result-assistes");
    expect(card.props.accessibilityRole).toBe("button");
    expect(card.props.accessibilityLabel).toBe("Squats assistés, Niveau 1, Pieds largeur d’épaules Descente contrôlée");
    expect(card.props.accessibilityHint).toBe(t.useMovement);
    fireEvent.press(card);
    expect(props.onUse).toHaveBeenCalledWith(assisted);
  });

  it("variante « result » demandée sans « Ajouter un niveau » : carte Composition (jamais de carte Résultat sans action)", () => {
    renderPanel({ onCreateVariant: undefined });
    expect(screen.getByTestId("movement-suggestion-result-squats").props.accessibilityRole).toBe("button");
    expect(screen.queryByTestId("movement-suggestion-result-squats-variant")).toBeNull();
  });

  it("description sur 253 (bord droit à 8), deux lignes au plus, « … » ; aucun état de variante possible", () => {
    renderPanel({ cardVariant: "composition", onCreateVariant: undefined, variantOf: "squats" });
    // `variantOf` sans « Ajouter un niveau » : la liste reste entière.
    expect(screen.getByTestId("movement-suggestion-result-assistes")).toBeTruthy();
    expect(screen.queryByTestId("movement-suggestion-back")).toBeNull();
    const description = screen.getByTestId("movement-suggestion-result-squats-description");
    expect(description.props.numberOfLines).toBe(2);
    expect(description.props.ellipsizeMode).toBe("tail");
    expect(StyleSheet.flatten(description.parent!.parent!.props.style)).toMatchObject({ marginRight: 0 });
    expect(style("movement-suggestion-result-squats")).toMatchObject({ minHeight: 72, padding: 7.5 });
  });
});

describe("PRE-9 CAT.2 — filet « groupe de niveaux » et espacements", () => {
  it("suites consécutives d'une même famille seulement ; ordre du classement inchangé", () => {
    expect(familyRuns([squats, assisted, bulgarian, front, goblet])).toEqual([[0, 1]]);
    expect(familyRuns([bulgarian, squats, assisted])).toEqual([[1, 2]]);
    // Membres séparés par un autre résultat : aucune suite (pas de réordonnancement).
    expect(familyRuns([squats, bulgarian, assisted])).toEqual([]);
    expect(familyRuns([bulgarian, front])).toEqual([]);
    expect(familyRuns([])).toEqual([]);
  });

  it("Mouvements proches : filet x = 3, largeur 2, du centre de la première au centre de la dernière carte ; 4 dans la famille, 8 sinon (421 pour cinq)", () => {
    renderPanel({ results: [squats, assisted, bulgarian, front, goblet] });
    const order = screen.getAllByTestId(/^movement-suggestion-result-.+-slot$/).map((node) => node.props.testID);
    expect(order).toEqual([
      "movement-suggestion-result-squats-slot",
      "movement-suggestion-result-assistes-slot",
      "movement-suggestion-result-bulgare-slot",
      "movement-suggestion-result-front-slot",
      "movement-suggestion-result-goblet-slot",
    ]);
    expect(style("movement-suggestion-result-assistes-slot")).toMatchObject({ marginTop: 4 });
    expect(style("movement-suggestion-result-bulgare-slot")).toMatchObject({ marginTop: 8 });
    const rails = screen.getAllByTestId(/^movement-suggestion-family-rail-/, hidden);
    expect(rails).toHaveLength(1);
    // Repère du contenu (sous le contour de 1) : première carte à 13, centres 49,5 et 126,5 → filet
    // à y = 50,5 du panneau, hauteur 77 (Figma `10906:19879`).
    expect(StyleSheet.flatten(rails[0]!.props.style)).toMatchObject({ position: "absolute", left: 2, width: 2, top: 49.5, height: 77 });
    expect(StyleSheet.flatten(screen.getByTestId("movement-suggestion-list").props.contentContainerStyle)).toMatchObject({
      paddingTop: 13,
      paddingBottom: 13,
      paddingHorizontal: 7,
    });
  });

  it("le filet suit les hauteurs réellement affichées (onLayout)", () => {
    renderPanel({ results: [bulgarian, squats, assisted] });
    fireEvent(screen.getByTestId("movement-suggestion-result-squats-slot"), "layout", { nativeEvent: { layout: { x: 7, y: 94, width: 338, height: 90 } } });
    fireEvent(screen.getByTestId("movement-suggestion-result-assistes-slot"), "layout", { nativeEvent: { layout: { x: 7, y: 188, width: 338, height: 73 } } });
    const rail = StyleSheet.flatten(screen.getByTestId("movement-suggestion-family-rail-squats", hidden).props.style);
    expect(rail).toMatchObject({ top: 139, height: 188 + 36.5 - 139 });
  });

  it("Nom déjà utilisé : message Medium 12 rouge annoncé au-dessus des cartes, 12 au-dessus de la première ; filet conservé (carte Composition comprise)", () => {
    renderPanel({ message: t.nameTaken, cardVariant: "composition", onCreateVariant: undefined, results: [squats, assisted, bulgarian] });
    const message = screen.getByTestId("movement-suggestion-message");
    expect(message.props.children).toBe(t.nameTaken);
    expect(message.props.accessibilityRole).toBe("alert");
    expect(StyleSheet.flatten(message.props.style)).toMatchObject({ fontSize: 12, fontWeight: "500", marginTop: 11, marginHorizontal: 13 });
    expect(StyleSheet.flatten(screen.getByTestId("movement-suggestion-list").props.contentContainerStyle)).toMatchObject({ paddingTop: 12 });
    expect(screen.getAllByTestId(/^movement-suggestion-family-rail-/, hidden)).toHaveLength(1);
  });
});

describe("PRE-7 R-5 — comportements conservés", () => {
  it("appui posé puis levé sur le panneau : signalé à l'appelant (ordre figé, R04)", () => {
    const props = renderPanel();
    fireEvent(screen.getByTestId("movement-suggestion-panel"), "touchStart");
    expect(props.onTouchingChange).toHaveBeenLastCalledWith(true);
    fireEvent(screen.getByTestId("movement-suggestion-panel"), "touchEnd");
    expect(props.onTouchingChange).toHaveBeenLastCalledWith(false);
  });

  it("message seul, sans carte (correction, Séance)", () => {
    renderPanel({ message: t.nameTakenEdit, results: [] });
    expect(screen.getByTestId("movement-suggestion-message").props.children).toBe(t.nameTakenEdit);
    expect(screen.queryByText(t.useMovement)).toBeNull();
    expect(screen.queryAllByTestId(/family-rail/, hidden)).toHaveLength(0);
  });
});
