import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors } from "@/shared/ui/tokens";

/**
 * Standard unique du champ en saisie (focus, clavier ouvert) — recette iPhone du 27/11/2026 (matin), Hermann : « Appliquer ce même
 * principe de manière cohérente et standard sur tous les champs des modales de tous les formats, et de la composition de séance.
 * Comment se fait-il qu'il y a ces différences, n'y a-t-il pas un token pour cela ? » ; « J'aimerais qu'on applique un standard pour
 * toute la solution le format d'un standard pour le focus d'un champ dans la composition de séance, ou la modale des paramètres
 * d'exécution. » ; « […] (la hauteur des lignes du tableau ne doit pas varier) ».
 *
 * Référence : le champ en saisie de la modale « Paramètres d'exécution » (recette du 26/11/2026 soir, `KeyboardField`) :
 * - le champ grossit (`scale`, transformation seule : aucune mise en page déplacée, la hauteur d'une ligne de tableau ne varie pas) ;
 * - un liseré bleu fin (`frameWidth`, `frameColor`), calque posé sur le cadre du champ, de son rayon ;
 * - le fond du champ passe au bleu pâle de saisie (`surface`, Figma `9292:18077`) ;
 * - la ligne qui porte le champ ne change pas de couleur.
 *
 * Jetons dans ce fichier : `tokens.ts` reste figé (empreinte vérifiée par `pre4Story11Controls`), comme `toVerifyColors` et
 * `valueField`.
 */
export const fieldFocusTokens = {
  /** Agrandissement du champ en saisie. [1,08 (26/11/2026 après-midi) — remplacé le 26/11/2026 soir.] */
  scale: 1.15,
  /** Durée de l'agrandissement (immédiat avec « Réduire les animations »). */
  durationMs: 160,
  /** Liseré du champ en saisie. */
  frameColor: colors.primary,
  frameWidth: 1,
  /** Fond du champ en saisie (`TABLE_CELL_ACTIVE_BACKGROUND`, `valueFieldColors.active`). */
  surface: "#EAEAFF",
} as const;

/** Agrandissement animé (fil natif) du champ en saisie ; immédiat si `reduceMotion`. */
export function useFieldFocusScale(focused: boolean, reduceMotion: boolean): Animated.Value {
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const target = focused ? fieldFocusTokens.scale : 1;
    if (reduceMotion) {
      scale.setValue(target);
      return undefined;
    }
    const animation = Animated.timing(scale, {
      toValue: target,
      duration: fieldFocusTokens.durationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [focused, reduceMotion, scale]);
  return scale;
}

/** Style de transformation du champ (à poser sur la vue qui porte son cadre). */
export function fieldFocusTransform(scale: Animated.Value): { readonly transform: readonly [{ readonly scale: Animated.Value }] } {
  return { transform: [{ scale }] };
}

/**
 * Liseré du champ en saisie : calque absolu, sans toucher, du rayon du cadre (`radius`) — aucune mise en page déplacée.
 * Identifiant : `${testID}-focus-frame`.
 */
export function FieldFocusFrame({ radius, style, testID }: { readonly radius?: number; readonly style?: StyleProp<ViewStyle>; readonly testID: string }) {
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.frame, { borderRadius: radius }, style]} testID={`${testID}-focus-frame`} />;
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: fieldFocusTokens.frameWidth,
    borderColor: fieldFocusTokens.frameColor,
  },
});
