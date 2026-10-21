import { AccessibilityInfo, type View } from "react-native";

/**
 * PRE-6 (story 4.2) : porte le focus d'accessibilité sur une vue à l'image suivante — un focus
 * envoyé pendant le montage ou le démontage d'une `Modal` (bulle « Retirer », roulette) peut être
 * repris par celle-ci. La vue est relue au moment de l'envoi ; rend la fonction d'annulation.
 */
export function focusOnNextFrame(getTarget: () => View | null): () => void {
  const frame = requestAnimationFrame(() => {
    const target = getTarget();
    if (target) AccessibilityInfo.sendAccessibilityEvent(target, "focus");
  });
  return () => cancelAnimationFrame(frame);
}
