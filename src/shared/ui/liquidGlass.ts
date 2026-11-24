import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { Platform } from "react-native";

/**
 * Verre natif d'iOS 26 (`expo-glass-effect`, déjà dans la build) : disponible ou non. Sans lui (iOS antérieur, module absent),
 * les surfaces gardent leur rendu opaque d'origine.
 */
export function liquidGlassAvailable(): boolean {
  if (Platform.OS !== "ios") return false;
  try {
    return isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

/**
 * Effet lentille (Hermann, 24/11/2026 : « On garde l'effet lentille, c'est parfait » pour le bouton flottant, puis « je veux
 * qu'on applique cet effet lentille sur la barre de navigation et sur les cadres des 5 options ») : verre « clear » sous un
 * voile blanc léger à 22 %, valeurs du bouton flottant et du bouton de lecture de la fiche Mouvement.
 */
export const LENS_VEIL = "rgba(255, 255, 255, 0.22)";
