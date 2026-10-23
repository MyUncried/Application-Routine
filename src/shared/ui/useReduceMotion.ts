import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Réglage iOS « Réduire les animations » (D-4, D-7, D-8). Lu au montage puis
 * suivi en direct ; `false` tant que la lecture n'a pas répondu.
 *
 * PRE-6 story 3.4 : déplacé depuis `ExecutionParametersSheet.tsx` (qui le réexporte pour ses
 * consommateurs existants) afin que les feuilles basses le partagent sans dépendre de la Feuille.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.resolve(AccessibilityInfo.isReduceMotionEnabled())
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduceMotion;
}
