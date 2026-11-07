import { colors } from "@/shared/ui/tokens";

/**
 * PRE-9 — recette iPhone n° 2 du 31/10/2026, constat e (Hermann : « que les champs (et l'ensemble de
 * la ligne de couleur) soient identifiés en orange, avec le texte « Paramètre à vérifier » ») :
 * couleurs de l'état « Paramètre à vérifier ». Rendu CHOISI SANS MAQUETTE (aucun état Figma) : bord
 * et accent sur l'orange existant `colors.warning` (`#FF8D28`, symbole du Point d'arrêt) ; fond
 * orange pâle et texte orange foncé (lisibilité sur fond blanc) en constantes locales, `tokens.ts`
 * restant figé. À juger en recette.
 */
export const toVerifyColors = {
  /** Bord des cadres et des cartes « à vérifier ». */
  border: colors.warning,
  /** Fond des champs, de la ligne et de la carte « à vérifier ». */
  surface: "#FFF4EA",
  /** Texte « Paramètre à vérifier » (orange foncé, contraste ≥ 4,5:1 sur blanc). */
  text: "#B35900",
} as const;
