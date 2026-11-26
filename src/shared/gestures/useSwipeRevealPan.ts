import { Gesture } from "react-native-gesture-handler";

import { SWIPE_ACTIVATION_DISTANCE, SWIPE_VERTICAL_TOLERANCE } from "./swipeReveal";

/**
 * Geste natif du glisser-pour-options (règle unique : `swipeReveal.ts`, recette iPhone du 26/11/2026 après-midi). `Pan` de
 * react-native-gesture-handler : actif dès `SWIPE_ACTIVATION_DISTANCE` à l'horizontale avant `SWIPE_VERTICAL_TOLERANCE` à la
 * verticale ; une fois actif, il empêche le défilement de la liste et suit le doigt jusqu'au relâchement, quelle que soit sa
 * direction. Rappels sur le fil JavaScript (`runOnJS`) ; l'appelant applique la translation, puis `resolveSwipeRelease`.
 *
 * L'appelant pose le geste par `GestureDetector` sur la rangée entière (carte et actions révélées : le glisser droit de fermeture
 * peut partir d'une action). Sur Android, un ancêtre `GestureHandlerRootView` est nécessaire ; sur iOS, il est sans effet.
 */
export type SwipeRevealPanCallbacks = {
  /** Activation du glisser (le doigt a franchi le seuil horizontal). */
  readonly onBegin: () => void;
  /** Déplacement horizontal du doigt depuis le début du toucher. */
  readonly onUpdate: (translationX: number) => void;
  /** Relâchement (ou interruption) d'un glisser actif : déplacement et vitesse horizontaux. */
  readonly onRelease: (translationX: number, velocityX: number) => void;
};

export function useSwipeRevealPan({
  enabled,
  testID,
  onBegin,
  onUpdate,
  onRelease,
}: SwipeRevealPanCallbacks & { readonly enabled: boolean; readonly testID: string }) {
  // Geste reconstruit à chaque rendu (rappels à jour) ; react-native-gesture-handler met à jour le reconnaisseur natif en place.
  return Gesture.Pan()
    .enabled(enabled)
    .withTestId(testID)
    .runOnJS(true)
    .activeOffsetX([-SWIPE_ACTIVATION_DISTANCE, SWIPE_ACTIVATION_DISTANCE])
    .failOffsetY([-SWIPE_VERTICAL_TOLERANCE, SWIPE_VERTICAL_TOLERANCE])
    .onStart(() => onBegin())
    .onUpdate((event) => onUpdate(event.translationX))
    .onEnd((event) => onRelease(event.translationX, event.velocityX));
}
