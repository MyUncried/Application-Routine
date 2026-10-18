import { Popover } from "@expo/ui/swift-ui";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Modal, Pressable, StyleSheet, Text } from "react-native";

import { AnchoredPanel } from "@/features/activities/AnchoredPanel";

/**
 * PRE-4 Q41 (Hermann, 2026-10-17, recette iPhone, E-15) — panneau sans flèche, ouvert
 * sous le champ sélectionné de la Feuille Paramètres d'exécution. Conteneur de
 * positionnement seulement : ni `Modal`, ni `Popover`, ni flèche, ni animation ; son
 * contenu (segmenté, roue) est rendu tel quel. Limite : Jest ne fait aucune mise en
 * page ; la position réelle et le toucher se constatent sur iPhone.
 */
describe("AnchoredPanel — PRE4-Q41", () => {
  const hidden = { includeHiddenElements: true } as const;

  function renderPanel(placement: { top: number; right: number; left?: number }, onDismiss = jest.fn()) {
    const onChoose = jest.fn();
    const view = render(
      <AnchoredPanel
        placement={placement}
        onDismiss={onDismiss}
        outsideInsets={{ top: 12, right: 24, bottom: 24, left: 24 }}
        testID="panel"
      >
        <Pressable onPress={onChoose} testID="panel-choice">
          <Text>Choix</Text>
        </Pressable>
      </AnchoredPanel>,
    );
    return { onDismiss, onChoose, view };
  }

  it("PRE4-Q41 — position absolue sous le champ, alignée à droite (largeur du contenu sans `left`, largeur de la ligne avec `left`) ; aucune transformation (pas de flèche)", () => {
    const { view } = renderPanel({ top: 146, right: 12 });
    const style = StyleSheet.flatten(screen.getByTestId("panel").props.style);
    expect(style).toMatchObject({ position: "absolute", top: 146, right: 12 });
    expect(style.left).toBeUndefined();
    expect(style.transform).toBeUndefined();
    expect(style.opacity).toBeUndefined();
    view.unmount();
    renderPanel({ top: 80, right: 12, left: 12 });
    expect(StyleSheet.flatten(screen.getByTestId("panel").props.style)).toMatchObject({ top: 80, right: 12, left: 12 });
  });

  it("PRE4-Q41 — ni Modal, ni Popover, ni animation d'apparition : un simple conteneur ; contenu rendu tel quel et tactile", () => {
    const { onChoose, onDismiss, view } = renderPanel({ top: 0, right: 0 });
    expect(view.UNSAFE_root.findAllByType(Modal)).toHaveLength(0);
    expect(view.UNSAFE_root.findAllByType(Popover)).toHaveLength(0);
    const panel = screen.getByTestId("panel");
    expect(panel.props.entering).toBeUndefined();
    expect(panel.props.exiting).toBeUndefined();
    fireEvent.press(screen.getByTestId("panel-choice"));
    expect(onChoose).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("PRE4-Q41 — toucher hors du panneau : fermeture (sans rien appliquer) ; zone extérieure non accessible, étendue aux marges données", () => {
    const { onChoose, onDismiss } = renderPanel({ top: 0, right: 0 });
    const outside = screen.getByTestId("panel-outside", hidden);
    expect(outside.props.accessible).toBe(false);
    expect(StyleSheet.flatten(outside.props.style)).toMatchObject({ position: "absolute", top: -12, right: -24, bottom: -24, left: -24 });
    fireEvent.press(outside);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onChoose).not.toHaveBeenCalled();
  });

  it("PRE4-Q41 — VoiceOver : panneau modal ; le geste d'échappement le ferme", () => {
    const { onDismiss } = renderPanel({ top: 0, right: 0 });
    const panel = screen.getByTestId("panel");
    expect(panel.props.accessibilityViewIsModal).toBe(true);
    fireEvent(panel, "accessibilityEscape");
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("PRE4-Q41 — le panneau est rendu après la zone extérieure : il reste au-dessus d'elle", () => {
    renderPanel({ top: 0, right: 0 });
    const json = JSON.stringify(screen.toJSON());
    expect(json.indexOf('"panel-outside"')).toBeLessThan(json.indexOf('"panel"'));
  });
});
