import { Easing, type EasingFunction } from "react-native";

/**
 * PRE-6 story 7.6 (recette J6b, j6b-5 et j6b-6) : UN seul jeu de durées et de courbes pour tous
 * les mouvements de la Composition — fondu de suppression, glissement des voisines (suppression et
 * glisser), mise en place de l'élément déposé (carte ou Point d'arrêt), retour d'une dépose refusée
 * ou annulée (dialogue de perte, choix de Tour), Circuit qui s'agrandit ou se rétracte.
 *
 * Retours de Hermann : « Le fondu est trop rapide, le mouvement des cartes aussi […] Il faut que
 * tous les mouvements soient plus doux avec une fin de mouvement progressive. » ; « l'arrêt des
 * mouvements peut être moins brutal ». Valeurs de conception, non dictées par la spécification
 * (choix 7.6, à valider en J6c) :
 * - glissements et mise en place : 320 ms (180 ms avant) ;
 * - fondu : 260 ms (150 ms avant) ;
 * - glissements : courbe décélérée sans rebond, Bézier (0,33 ; 1 ; 0,68 ; 1) (« ease-out cubic ») —
 *   revue 7.6 : préférée au « quint » (0,22 ; 1 ; 0,36 ; 1), dont le départ (pente 4,5) était aussi
 *   brusque que l'ancienne courbe de 180 ms ; pente de départ 3 sur 320 ms, soit environ deux fois
 *   plus lente au démarrage qu'avant, et un arrêt progressif ;
 * - fondu : courbe douce aux deux bouts, Bézier (0,4 ; 0 ; 0,2 ; 1) — l'opacité ne chute pas d'emblée
 *   (« le fondu est trop rapide ») ;
 * - le glissement de la suppression commence pendant le fondu : les deux se chevauchent.
 *
 * PRE-6 story 7.7 (D-438, recette J6c, j6c-4 : « La disparition doit être encore plus lente.
 * Lorsqu'on copie une carte, elle apparaît aussi brutalement, il faut qu'elle apparaisse en fondu
 * plus lentement […] ») : fondu de disparition et d'apparition à 450 ms (260 ms en 7.6) ; le
 * glissement de la suppression part à 200 ms (fin à 520 ms, après le fondu) ; la copie de Dupliquer
 * apparaît en fondu de 450 ms pendant que les éléments suivants glissent (320 ms) ; les actions
 * glissées rejoignent leur position de repos par le même glissement.
 *
 * Toutes les animations restent sur le pilote natif ; la courbe est échantillonnée en JS au
 * démarrage (Animated), sans coût pendant le mouvement.
 */
export const MOTION_SHIFT_DURATION_MS = 320;
export const MOTION_FADE_DURATION_MS = 450;
/** Délai entre le début du fondu et le début du glissement d'une suppression. */
export const MOTION_FADE_TO_SLIDE_DELAY_MS = 200;
/** Story 7.7 : fondu d'apparition de la copie de Dupliquer. */
export const MOTION_APPEAR_DURATION_MS = MOTION_FADE_DURATION_MS;
/** Courbe de tous les glissements : décélération jusqu'à l'arrêt, sans rebond. */
export const MOTION_EASING: EasingFunction = Easing.bezier(0.33, 1, 0.68, 1);
/** Courbe du fondu : départ et fin progressifs. */
export const MOTION_FADE_EASING: EasingFunction = Easing.bezier(0.4, 0, 0.2, 1);
