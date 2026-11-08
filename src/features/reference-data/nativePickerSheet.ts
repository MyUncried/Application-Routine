import { initialWindowMetrics } from "react-native-safe-area-context";

/**
 * Recette du 06/11/2026 (x-dedans, KO). Hermann, mot pour mot : « Corriger - Ouvrir toutes les modales de filtre comme une
 * modale iOS, pareil pour les modales de catégorie, d'étiquette et de zone corporelle. »
 *
 * Sélecteurs de Catégorie, d'Étiquette et de Zone corporelle (`CategoryPickerModal`, `LabelPickerModal`,
 * `BodyZonePickerModal`) présentés en feuille native iOS (`Modal` de React Native, `presentationStyle="formSheet"` :
 * `UIModalPresentationFormSheet`, grande hauteur sur iPhone) : montée, descente, voile et vitesse du système (règle
 * permanente de Hermann du 06/11/2026 : les feuilles natives gardent la vitesse iOS). Fermeture par ✕ / ✓ seulement
 * (glissement désactivé, comme les autres feuilles natives du projet). Les appelants sont inchangés (mêmes props).
 * [Modale transparente en fondu, feuille dessinée (voile, poignée, hauteur 90 %, sortie animée à la validation) — remplacée.]
 */
export const NATIVE_PICKER_MODAL = {
  animationType: "slide",
  presentationStyle: "formSheet",
  allowSwipeDismissal: false,
} as const;

/** Écart iOS entre la zone sûre haute et le haut d'une feuille à sa plus grande hauteur (même calibrage que `nativeSheet.ts`). */
const LARGE_SHEET_TOP_GAP = 10;

/**
 * Décalage du `KeyboardAvoidingView` racine de la feuille : il mesure sa position dans la feuille (y = 0), pas dans l'écran ;
 * le haut de la feuille (grande hauteur) est sous la zone sûre haute.
 */
export function nativePickerKeyboardOffset(): number {
  return (initialWindowMetrics?.insets.top ?? 0) + LARGE_SHEET_TOP_GAP;
}
