import type { ViewStyle } from "react-native";

import { colors, dimensions, layout, spacing } from "@/shared/ui/tokens";

/**
 * Bouton d'action principal et sa zone fixe — SOURCE UNIQUE (D-444, PRE-6 story 7.10).
 *
 * Historique : PRE-6 story 7.9 avait déplacé ici, sans changement, les valeurs de `Terminer` de
 * l'Éditeur d'Exercice (PRE-5 story 3.2, FR-37, arbitrages G-8 et G-10 de Hermann du 19/10,
 * Figma `8328:35738`) pour « Continuer » de la Composition.
 *
 * D-444 (Hermann, 23/10/2026) : format unique sur tous les écrans dotés d'un bouton d'action
 * principal, référence `Terminer` (dimensions, marges latérales, typographie, couleurs, arrondis,
 * ombre) ; zone fixe en bas, indépendante du défilement, avec une marge de sécurité au-dessus et un
 * dégradé blanc 0 → 100 % pleine largeur ; bouton et barres de mode AU-DESSUS de la zone de
 * sécurité inférieure (interprétation retenue, réversible : plus de bas à 24 du bord de l'écran,
 * qui chevauchait la zone du geste d'accueil sur iPhone).
 */

/**
 * Marge entre le bas du bouton (ou d'une barre de mode) et le bas de la zone de sécurité quand elle
 * existe (iPhone à indicateur d'accueil, Android bord à bord avec barre de navigation) : 8. L'encart
 * (34 sur iPhone) contient déjà l'indicateur et son dégagement ; 8 détache le bouton de son bord
 * sans le remonter au-delà de la position de `Terminer` validée (24 du bord) de plus de 18.
 */
export const FINAL_ACTION_BOTTOM_MARGIN_ABOVE_INSET = spacing[8];

/**
 * Sans zone de sécurité (encart nul : iPhone à bouton d'accueil, Android à navigation par
 * gestes masquée, web) : 16 du bord de l'écran, la marge standard des écrans KODJO.
 */
export const FINAL_ACTION_BOTTOM_MARGIN_WITHOUT_INSET = spacing[16];

/**
 * Part haute de la hauteur de la zone protégée (marge de sécurité, couverte par le dégradé) : 24.
 * Depuis le correctif J6f, le bouton est centré dans la zone (`finalActionVerticalPadding`).
 */
export const FINAL_ACTION_TOP_MARGIN = spacing[24];

/** Hauteur du bouton (et d'une barre de mode) : `dimensions.finalAction.buttonHeight` (48). */
export const FINAL_ACTION_BUTTON_HEIGHT = dimensions.finalAction.buttonHeight;

/**
 * Marges latérales de `Terminer` et des corps d'Éditeur (PRE-4 story 4.2, FR-02-04 : 24 à partir de la
 * largeur 390, 16 en dessous). PRE-8, recette A/B (A01) : marge standard unique `layout.screenGutter`
 * (16) à toutes les largeurs ; la signature est conservée pour les appelants.
 */
export const FINAL_ACTION_SIDE_MARGIN_MIN_WIDTH = 390;
export function finalActionSideMargin(windowWidth: number): number {
  void windowWidth;
  return layout.screenGutter;
}

/** G-8 : ombre du bouton (Figma `8328:35738`), sans jeton d'ombre (constantes locales). */
export const FINAL_ACTION_SHADOW = { color: "#1A1A26", opacity: 0.18, offsetY: 2, radius: 10, elevation: 3 } as const;

/**
 * Part basse de la HAUTEUR de la zone protégée (D-444) : encart bas + 8 quand il existe, 16 sinon
 * (iPhone : 42 ; sans encart : 16). Depuis le correctif J6f, elle ne fixe plus la position du
 * bouton (voir `finalActionVerticalPadding`).
 */
export function finalActionBottomMargin(bottomInset: number): number {
  return bottomInset > 0 ? bottomInset + FINAL_ACTION_BOTTOM_MARGIN_ABOVE_INSET : FINAL_ACTION_BOTTOM_MARGIN_WITHOUT_INSET;
}

/**
 * Hauteur de la zone d'action fixe (zone protégée), du haut du dégradé au bord de l'écran : 24 +
 * contenu (bouton 48 par défaut, ou hauteur mesurée : message d'erreur au-dessus) + marge basse de
 * référence (`finalActionBottomMargin`). Sert de réserve de défilement : la dernière ligne du
 * contenu remonte au-dessus du dégradé. iPhone (encart 34) : 24 + 48 + 42 = 114 ; sans encart : 88.
 */
export function finalActionZoneHeight(bottomInset: number, contentHeight: number = FINAL_ACTION_BUTTON_HEIGHT): number {
  return FINAL_ACTION_TOP_MARGIN + contentHeight + finalActionBottomMargin(bottomInset);
}

/**
 * PRE-6 story 7.10, correctif J6f (D-444 « Position verticale », Hermann : « le bouton d'action est
 * trop haut, priorité à l'espace accordé à l'écran. Conserver la hauteur de la zone protégée mais
 * recentrer verticalement le bouton dans cette zone ») : marge au-dessus = marge au-dessous du
 * contenu = (24 + marge basse de référence) / 2, ce qui garde la hauteur de la zone et centre le
 * bouton. iPhone (encart 34) : 33 (bas du bouton à 33 du bord : 1 point dans l'encart de 34, zone
 * de l'indicateur d'accueil, accepté par Hermann) ; sans encart : 20.
 */
export function finalActionVerticalPadding(bottomInset: number): number {
  return (FINAL_ACTION_TOP_MARGIN + finalActionBottomMargin(bottomInset)) / 2;
}

/**
 * Marges haute et basse du contenu dans la zone (hauteur de zone conservée). Centrées
 * (`finalActionVerticalPadding`), sauf sur Android quand l'encart bas est une barre de navigation
 * à boutons (encart 48 : centré à 40, le bouton couvrirait 8 points de la barre, zone tactile du
 * système) : le bas ne descend jamais sous l'encart, la différence passe au-dessus (48 / 32).
 */
export function finalActionContentPadding(platformOS: string, bottomInset: number): { top: number; bottom: number } {
  const centred = finalActionVerticalPadding(bottomInset);
  const bottom = platformOS === "android" ? Math.max(centred, bottomInset) : centred;
  return { top: 2 * centred - bottom, bottom };
}

/**
 * Gabarit du bouton : hauteur 48, rayon 24, ombre G-8 dans les deux états ; fond `colors.primary`
 * (l'état inactif pose `colors.disabled`). Libellé : `type.button`, `colors.background`.
 */
export const FINAL_ACTION_BUTTON: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  minHeight: FINAL_ACTION_BUTTON_HEIGHT,
  borderRadius: 24,
  backgroundColor: colors.primary,
  shadowColor: FINAL_ACTION_SHADOW.color,
  shadowOpacity: FINAL_ACTION_SHADOW.opacity,
  shadowOffset: { width: 0, height: FINAL_ACTION_SHADOW.offsetY },
  shadowRadius: FINAL_ACTION_SHADOW.radius,
  elevation: FINAL_ACTION_SHADOW.elevation,
};

/**
 * Dégradé de la zone (D-444) : blanc de l'écran (`colors.background`), opacité 0 en haut → 1 en bas,
 * linéaire, pleine largeur. Primitive de la plateforme : style `experimental_backgroundImage` de
 * React Native 0.86 (analysé par `processBackgroundImage`, rendu natif iOS et Android sous Fabric),
 * sans dépendance. Le blanc transparent est le même blanc à alpha 0 (pas `transparent`, noir à alpha 0,
 * qui grisaillerait le milieu du fondu).
 */
export const FINAL_ACTION_GRADIENT = `linear-gradient(to bottom, ${colors.background}00 0%, ${colors.background} 100%)`;
