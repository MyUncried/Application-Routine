import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type Insets, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

/**
 * Position d'un panneau, dans le repère du conteneur qui l'héberge : `top` est le
 * bas du champ sélectionné (plus un léger écart), `right` le bord droit du champ.
 * `left`, s'il est donné, étire le panneau sur la largeur de la ligne ; sinon le
 * panneau prend la largeur de son contenu, aligné à droite sur le champ.
 */
export type AnchoredPanelPlacement = {
  readonly top: number;
  readonly right: number;
  readonly left?: number;
};

export type AnchoredPanelProps = {
  readonly placement: AnchoredPanelPlacement;
  /** Toucher hors du panneau, ou geste d'échappement VoiceOver : fermeture sans rien appliquer. */
  readonly onDismiss: () => void;
  /**
   * Débord de la zone de toucher extérieur au-delà du conteneur hôte (par ex. ses
   * marges internes), pour qu'un toucher dans ces marges ferme aussi le panneau.
   */
  readonly outsideInsets?: Insets;
  readonly onLayout?: ViewProps["onLayout"];
  /** Habillage du panneau (fond, rayon, ombre) ; aucun par défaut : le contenu porte le sien. */
  readonly style?: StyleProp<ViewStyle>;
  readonly children: ReactNode;
  readonly testID: string;
};

/**
 * PRE-4 Q41 (Hermann, 2026-10-17, recette iPhone, E-15) — panneau SANS FLÈCHE
 * ouvert juste sous le champ sélectionné de la Feuille Paramètres d'exécution,
 * aligné à droite sur le champ, AU-DESSUS du contenu : aucune ligne ne se décale.
 * Il porte, sur iOS, le `SegmentedControl` du Changement de côté et de l'Ordre
 * des côtés, et la roue `DurationWheelPicker` de « Durée d'une série » et de la
 * Durée totale.
 *
 * Justification (priorité aux primitives natives, AGENTS.md) : iOS ne fournit
 * pas de popover natif sans flèche. Le `Popover` SwiftUI de `@expo/ui` (gardé
 * pour le Mode, validé) dessine toujours sa flèche (« cône ») et se place
 * lui-même. Ce composant n'est donc qu'un CONTENEUR DE POSITIONNEMENT : il ne
 * réimplémente ni le segmenté (composant accepté, rendu tel quel), ni la roue
 * (roulette native SwiftUI et sa barre ✕ / ✓, rendues telles quelles), ni aucun
 * mécanisme d'interaction. Ce n'est ni une `Modal`, ni un `Popover` : une vue en
 * position absolue dans le contenu défilant de la Feuille, qui suit donc le
 * défilement de la ligne.
 *
 * Fermeture : un toucher HORS du panneau, sur la zone de toucher extérieur
 * (transparente, non accessible, rendue sous le panneau et au-dessus du reste
 * du contenu), ferme sans rien appliquer ; le choix ou le ✓ du contenu
 * appliquent, le ✕ de la roue ferme sans changer. Pour VoiceOver, le panneau
 * est modal (`accessibilityViewIsModal`) et le geste d'échappement le ferme.
 *
 * Apparition et disparition : immédiates, sans fondu ni mouvement (choix
 * « sobre » permis par Q41). Le panneau flotte au-dessus des lignes sans en
 * déplacer aucune : aucune barre horizontale ne le borne par le bas, la
 * révélation par le bas des lignes (Q41, `SheetMotionView`) ne s'y transpose
 * pas, et une animation de hauteur ou d'opacité réintroduirait ce que Q41 retire.
 * À juger sur iPhone.
 */
export function AnchoredPanel({ placement, onDismiss, outsideInsets, onLayout, style, children, testID }: AnchoredPanelProps) {
  return (
    <>
      <Pressable
        onPress={onDismiss}
        accessible={false}
        style={[
          styles.outside,
          outsideInsets
            ? {
                top: -(outsideInsets.top ?? 0),
                right: -(outsideInsets.right ?? 0),
                bottom: -(outsideInsets.bottom ?? 0),
                left: -(outsideInsets.left ?? 0),
              }
            : null,
        ]}
        testID={`${testID}-outside`}
      />
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={onDismiss}
        onLayout={onLayout}
        style={[styles.panel, { top: placement.top, right: placement.right, left: placement.left }, style]}
        testID={testID}
      >
        {children}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  outside: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  panel: {
    position: "absolute",
  },
});
