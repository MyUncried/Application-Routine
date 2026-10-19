import { INLINE_OPTION_WIDTHS } from "@/shared/ui/SegmentedControl";

/**
 * Recette du 20/10 (RC-14) — largeur de l'option Avec de la Charge en séries identiques, qui
 * porte la charge commune (« 20 kg » au repos, le texte saisi au focus) : 62 (`narrow`, comme
 * les autres options de la ligne) si le texte tient, sinon le strict nécessaire (la charge n'a
 * pas de plafond, AD-19).
 *
 * Mesure : avances d'Inter Semi Bold 12 (police du libellé sélectionné, `Inter_600SemiBold`
 * de l'application, unités par em 2048), sans crénage ; un caractère absent de la table compte
 * pour le chiffre le plus large. Le texte tient si sa largeur plus une marge de 4 de chaque côté
 * ne dépasse pas 62 (« 99,75 kg » : 50,8 ; « 487,75 kg » : 58,0 → 67).
 */
const SEMI_BOLD_12_ADVANCES: Readonly<Record<string, number>> = {
  "0": 7.92,
  "1": 5.07,
  "2": 7.48,
  "3": 7.63,
  "4": 7.99,
  "5": 7.35,
  "6": 7.68,
  "7": 6.91,
  "8": 7.68,
  "9": 7.68,
  ",": 3.83,
  ".": 3.83,
  " ": 3.02,
  k: 6.83,
  g: 7.51,
};
const WIDEST_ADVANCE = 7.99;
/** Marge de rendu de chaque côté du texte dans l'option. */
export const LOAD_OPTION_TEXT_INSET = 4;

/** Largeur du texte en Inter Semi Bold 12. */
export function loadTextWidth(text: string): number {
  return [...text].reduce((sum, character) => sum + (SEMI_BOLD_12_ADVANCES[character] ?? WIDEST_ADVANCE), 0);
}

/** Largeur de l'option Avec de la Charge pour les textes donnés (le plus large décide). */
export function loadOptionWidth(...texts: readonly string[]): number {
  const widest = Math.max(0, ...texts.map(loadTextWidth));
  return Math.max(INLINE_OPTION_WIDTHS.narrow, Math.ceil(widest + LOAD_OPTION_TEXT_INSET * 2));
}
