import type { ViewStyle } from "react-native";

import { colors, dimensions, spacing } from "@/shared/ui/tokens";

/**
 * Pied d'action principal partagé (PRE-6 story 7.9, recette J6d : « le bouton « Continuer » doit
 * être à la même hauteur que le bouton d'action de l'écran de création d'un exercice »).
 *
 * Référence : `Terminer` de l'Éditeur d'Exercice (`ActivityEditorForm`, PRE-5 story 3.2, FR-37,
 * arbitrages G-8 et G-10 de Hermann du 19/10, Figma `8328:35738` ; frame `Action finale` : `pb` 24,
 * bouton à y802 sur 874) — valeurs déplacées ici sans changement, puis reprises par « Continuer »
 * de la Composition.
 */

/** Bas du bouton à 24 du bord bas de l'écran (iOS : indépendamment de `insets.bottom`). */
export const FINAL_ACTION_BOTTOM_OFFSET = spacing[24];

/** G-8 : ombre du bouton (Figma `8328:35738`), sans jeton d'ombre (constantes locales). */
export const FINAL_ACTION_SHADOW = { color: "#1A1A26", opacity: 0.18, offsetY: 2, radius: 10, elevation: 3 } as const;

/**
 * Marge basse du pied : 24 sur iOS ; sur Android (bord à bord sous Expo 57, revue PRE-5 3.2),
 * jamais sous l'encart bas (barre de navigation système).
 */
export function finalActionBottomMargin(platformOS: string, bottomInset: number): number {
  return platformOS === "android" ? Math.max(FINAL_ACTION_BOTTOM_OFFSET, bottomInset) : FINAL_ACTION_BOTTOM_OFFSET;
}

/**
 * Gabarit du bouton : hauteur `dimensions.finalAction.buttonHeight` (48), rayon 24, ombre G-8
 * dans les deux états ; fond `colors.primary` (l'appelant pose `colors.disabled` à l'état inactif).
 */
export const FINAL_ACTION_BUTTON: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  minHeight: dimensions.finalAction.buttonHeight,
  borderRadius: 24,
  backgroundColor: colors.primary,
  shadowColor: FINAL_ACTION_SHADOW.color,
  shadowOpacity: FINAL_ACTION_SHADOW.opacity,
  shadowOffset: { width: 0, height: FINAL_ACTION_SHADOW.offsetY },
  shadowRadius: FINAL_ACTION_SHADOW.radius,
  elevation: FINAL_ACTION_SHADOW.elevation,
};
