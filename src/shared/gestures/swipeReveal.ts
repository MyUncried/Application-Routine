/**
 * Règle UNIQUE du glisser-pour-options (cartes et en-têtes à actions révélées par un glisser gauche, refermées par un glisser
 * droit) — recette iPhone du 26/11/2026 (après-midi), Hermann : « Défini une règle une bonne fois pour toute pour ce geste sur
 * ces cartes et réutilise le que ce soit stabilisé une fois pour toute » ; « il faut qu'un geste court vers la gauche et vers la
 * droite ouvre et ferme les options, et qu'on n'ait jamais de rebond qui annule le geste, même si le doigt part un peu en
 * diagonale vers le haut ou le bas. Je ne dois pas avoir à accompagner le mouvement sur toute la largeur de la distance
 * parcourue par les cadres d'options. »
 *
 * Fonctions pures (sans React Native) ; le geste natif qui les applique est `useSwipeRevealPan` (même dossier).
 *
 * 1. **Reconnaissance** : `Pan` natif de react-native-gesture-handler, actif dès `SWIPE_ACTIVATION_DISTANCE` de déplacement
 *    horizontal tant que le doigt n'a pas parcouru `SWIPE_VERTICAL_TOLERANCE` à la verticale — un départ en diagonale reste un
 *    glisser. Une fois actif, le `Pan` natif empêche le défilement de la liste (iOS : un seul reconnaisseur gagne) : plus aucune
 *    annulation du toucher par la liste, donc plus de rebond ; la direction n'est plus réévaluée jusqu'au relâchement.
 * 2. **Suivi** : la carte suit le doigt, bornée entre fermée et ouverte (`clampSwipeTranslateX` de la Composition).
 * 3. **Décision au relâchement** (`resolveSwipeRelease`) : un lancer (vitesse ≥ `SWIPE_FLICK_VELOCITY`) décide par son sens ;
 *    sinon un déplacement d'au moins `SWIPE_DECISION_DISTANCE` dans le sens utile suffit — jamais la moitié de la course.
 * 4. **Fin** : l'animation rejoint seule la position décidée (mouvement partagé de la Composition), sans retour arrière.
 *
 * [Avant le 26/11/2026 : responder system de React Native (capture si |dx| > |dy| au-delà de 8), décision à la moitié de la
 * course — remplacé pour la Composition (cartes, en-têtes de Circuit) et les rangées `nativeGesture` de `SwipeActionsRow`.]
 */

/** Déplacement horizontal (pt) qui active le glisser. Court : le glisser gagne contre le défilement d'un départ en diagonale. */
export const SWIPE_ACTIVATION_DISTANCE = 10;
/**
 * Déplacement vertical (pt) toléré avant l'activation : au-delà, le geste appartient au défilement. Généreux : un départ jusqu'à
 * environ 65° de l'horizontale reste un glisser (le défilement natif tranche souvent plus tôt pour un geste franchement vertical).
 */
export const SWIPE_VERTICAL_TOLERANCE = 24;
/** Déplacement (pt) dans le sens utile qui suffit, au relâchement, à ouvrir ou à fermer. */
export const SWIPE_DECISION_DISTANCE = 24;
/** Vitesse horizontale (pt/s) d'un lancer : son sens décide, quelle que soit la distance parcourue. */
export const SWIPE_FLICK_VELOCITY = 300;

/**
 * Position décidée au relâchement d'un glisser actif : `true` ouverte, `false` fermée.
 *
 * - lancer (|vitesse| ≥ `SWIPE_FLICK_VELOCITY`) : vers la gauche, ouverte ; vers la droite, fermée ;
 * - sinon, depuis fermée : ouverte si le doigt a parcouru au moins `SWIPE_DECISION_DISTANCE` vers la gauche ;
 * - sinon, depuis ouverte : fermée si le doigt a parcouru au moins `SWIPE_DECISION_DISTANCE` vers la droite ;
 * - en deçà : la position de départ est conservée.
 */
export function resolveSwipeRelease({
  wasOpen,
  translationX,
  velocityX = 0,
}: {
  readonly wasOpen: boolean;
  /** Déplacement horizontal du doigt depuis le début du geste (négatif : vers la gauche). */
  readonly translationX: number;
  /** Vitesse horizontale au relâchement, pt/s (négative : vers la gauche). */
  readonly velocityX?: number;
}): boolean {
  const velocity = Number.isFinite(velocityX) ? velocityX : 0;
  if (Math.abs(velocity) >= SWIPE_FLICK_VELOCITY) return velocity < 0;
  if (wasOpen) return translationX < SWIPE_DECISION_DISTANCE;
  return translationX <= -SWIPE_DECISION_DISTANCE;
}
