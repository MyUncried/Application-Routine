import type { View } from "react-native";

/** Rectangle d'ancrage en coordonnées de fenêtre. */
export type AnchorRect = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

/**
 * PRE-6 (story 4.2) : mesure dans la fenêtre l'élément qui ancre la bulle « Retirer ». Une mesure
 * vide (largeur ou hauteur nulle, vue non montée) rend `null` : la bulle n'est alors pas affichée.
 * Module isolé pour que les tests puissent fournir une mesure.
 */
export function measureAnchor(view: View | null, onMeasured: (anchor: AnchorRect | null) => void): void {
  if (view === null) {
    onMeasured(null);
    return;
  }
  view.measureInWindow((x, y, width, height) => {
    onMeasured(width > 0 && height > 0 ? { x, y, width, height } : null);
  });
}
