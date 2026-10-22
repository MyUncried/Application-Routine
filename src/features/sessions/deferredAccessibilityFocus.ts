import { AccessibilityInfo, type View } from "react-native";

/**
 * PRE-6 (story 4.2) : porte le focus d'accessibilité sur une vue à l'image suivante — un focus
 * envoyé pendant le montage ou le démontage d'une `Modal` (bulle « Retirer », roulette) peut être
 * repris par celle-ci. La vue est relue au moment de l'envoi ; rend la fonction d'annulation.
 * PRE-6 story 6.2 (revue) : `announcement`, annoncée dans la même image, après le focus (sinon
 * coupée par le démontage des éléments refermés et le déplacement du focus) ; `onDone`, appelé
 * ensuite (demande consommée).
 */
export function focusOnNextFrame(getTarget: () => View | null, announcement?: string, onDone?: () => void): () => void {
  const frame = requestAnimationFrame(() => {
    const target = getTarget();
    if (target) AccessibilityInfo.sendAccessibilityEvent(target, "focus");
    if (announcement !== undefined) AccessibilityInfo.announceForAccessibility(announcement);
    onDone?.();
  });
  return () => cancelAnimationFrame(frame);
}
