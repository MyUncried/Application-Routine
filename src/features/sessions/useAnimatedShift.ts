import { useLayoutEffect, useState } from "react";
import { Animated, Easing } from "react-native";

/** PRE-6 (story 2.3b) : durée d'un décalage animé pendant le glisser (fourchette 150–200 ms). */
export const DRAG_SHIFT_DURATION_MS = 180;

/**
 * PRE-6 (story 2.3b) : décalage vertical animé d'un élément de la Composition pendant le glisser
 * d'une carte (bloc d'occurrence, bords du Circuit, ligne après le Circuit). Translation seule —
 * aucun recalcul de mise en page —, sur le pilote natif, à courbe douce.
 *
 * `animated` faux : la valeur est posée immédiatement (dépôt appliqué, « Réduire les animations »).
 * Effet de mise en page : la remise à 0 d'un dépôt appliqué est posée avant l'affichage de la
 * nouvelle disposition, sans saut.
 */
export function useAnimatedShift(value: number, animated: boolean): Animated.Value {
  const [shift] = useState(() => new Animated.Value(value));
  useLayoutEffect(() => {
    if (!animated) {
      shift.stopAnimation();
      shift.setValue(value);
      return undefined;
    }
    const animation = Animated.timing(shift, {
      toValue: value,
      duration: DRAG_SHIFT_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [animated, shift, value]);
  return shift;
}
