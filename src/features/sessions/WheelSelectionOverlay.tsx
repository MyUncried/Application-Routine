import { StyleSheet, View } from "react-native";

import { colors } from "@/shared/ui/tokens";

export type WheelSelectionOverlayProps = {
  /** Hauteur d'une ligne de la roulette (`ITEM_HEIGHT` de l'appelant). */
  itemHeight: number;
};

/**
 * Superposition non interactive d'une roulette à colonnes (`DurationWheelPicker`,
 * `NumberWheelPicker`) : bande de sélection centrale et estompage des
 * valeurs voisines (haut/bas). Corrige CE-T01-07 (« ligne centrale
 * sélectionnée » et « hiérarchie visuelle des valeurs voisines »),
 * jusqu'ici absentes — voir `T01_S01_S08_CONFORMITY_AUDIT_20260902.md`.
 *
 * Rendue au-dessus du `ScrollView` de la colonne, avec `pointerEvents="none"`
 * sur chaque calque : ces éléments ne doivent jamais intercepter le geste
 * de défilement porté par le `ScrollView` sous-jacent, ni le retour
 * haptique par cran, qui restent inchangés.
 *
 * La bande centrale reste statique (toujours à la ligne du milieu, sur les
 * trois lignes visibles) : le `ScrollView` aligne toujours la valeur
 * sélectionnée sur cette ligne (`snapToInterval`, correction d'alignement
 * `onMomentumScrollEnd`/`onScrollEndDrag`) — il n'est donc pas nécessaire
 * de suivre l'index courant en état React pour savoir où la positionner.
 */
export function WheelSelectionOverlay({ itemHeight }: WheelSelectionOverlayProps) {
  return (
    <View style={styles.fill} pointerEvents="none" testID="wheel-selection-overlay">
      <View style={[styles.fade, { height: itemHeight, top: 0 }]} />
      <View
        style={[
          styles.band,
          { top: itemHeight, height: itemHeight },
        ]}
        testID="wheel-selection-band"
      />
      <View style={[styles.fade, { height: itemHeight, bottom: 0 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  band: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.selectionSurface,
    opacity: 0.5,
  },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    opacity: 0.55,
  },
});
