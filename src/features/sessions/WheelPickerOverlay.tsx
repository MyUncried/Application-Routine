import type { ReactNode } from "react";
import { Modal, StyleSheet, View } from "react-native";

import { colors } from "@/shared/ui/tokens";

export type WheelPickerOverlayProps = {
  /** Rend la superposition uniquement lorsque vrai — même convention que le reste de l'écran appelant (`openOverlay !== null`). */
  visible: boolean;
  children: ReactNode;
};

/**
 * Couche de superposition plein écran, TRANSVERSALE à tout sélecteur
 * numérique à roulette (`DurationWheelPicker`/`NumberWheelPicker`),
 * introduite par la correction VISUAL (T01-S09, correction tentative 2,
 * point D — commentaire de revue 5551813745).
 *
 * Règle transversale : « Tout sélecteur numérique à roulette s'ouvre dans
 * une couche d'overlay au-dessus de l'écran, centrée dans la zone utile,
 * avec arrière-plan atténué. Sa position ne dépend ni du contrôle
 * déclencheur ni du défilement. Le contenu sous-jacent reste inaccessible
 * au toucher et au défilement jusqu'à Annuler ou Confirmer. »
 *
 * Remplace l'ancien mécanisme d'ancrage local (`PopoverAnchor` +
 * `AnchoredRow.elevated` + `zIndex`), qui positionnait le sélecteur en
 * popover descendant de sa ligne/carte déclenchrice à l'intérieur du
 * `ScrollView` de l'écran — une position par construction dépendante du
 * déclencheur et du défilement, contraire à la règle ci-dessus (root cause
 * du défaut signalé).
 *
 * Implémentation : `Modal` React Native natif (`transparent`, plein écran
 * par construction, rendu dans une couche native séparée du reste de
 * l'arborescence) — sa position ne dépend donc jamais du `ScrollView` ou de
 * la ligne qui l'a ouvert, et tout le contenu sous-jacent est
 * structurellement inaccessible au toucher/défilement tant qu'elle est
 * montée, sans mécanisme `zIndex`/`elevated` à maintenir manuellement.
 *
 * Le voile de fond (`backdrop`) n'est délibérément PAS pressable : contraire
 * à l'ancien `composition-backdrop`/`exercise-backdrop` (qui fermait au
 * toucher), un sélecteur numérique à roulette ne se ferme désormais QUE par
 * ses propres actions Annuler/Confirmer — jamais par un toucher en dehors,
 * conformément à la règle ci-dessus.
 *
 * Ne modifie ni ne remplace `DurationWheelPicker.tsx`/`NumberWheelPicker
 * .tsx` eux-mêmes (baseline gelée, mécanisme d'interaction natif inchangé)
 * — uniquement leur CONTENEUR de positionnement dans l'écran appelant
 * (`CompositionScreen.tsx`/`ExerciseScreen.tsx`), conformément à « Priorité
 * aux primitives natives de l'OS » (`.github/AI_ORCHESTRATION.md`) : « Si le
 * rendu natif nécessite une adaptation de conteneur... corriger
 * l'intégration autour de la primitive native sans remplacer son mécanisme
 * d'interaction. »
 */
export function WheelPickerOverlay({ visible, children }: WheelPickerOverlayProps) {
  if (!visible) {
    return null;
  }
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent testID="wheel-picker-overlay">
      <View style={styles.backdrop} testID="wheel-picker-overlay-backdrop">
        <View style={styles.center} testID="wheel-picker-overlay-center">
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
  },
});
