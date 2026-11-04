import { useWindowDimensions } from "react-native";
import { initialWindowMetrics } from "react-native-safe-area-context";

import { dimensions } from "@/shared/ui/tokens";

/**
 * Feuilles natives iOS (`presentation: "formSheet"`) — demande de Hermann du 04/11/2026 : « Afficher en mode modale iOS
 * (mode d'apparition identique à la fiche des mouvements du questionnaire par exemple) les 3 modales et écrans suivants :
 * Catalogue des mouvements : Filtres ; Catalogue des mouvements : Créer un mouvement ; Catalogue des séances : Filtres ».
 * Mêmes réglages que la fiche du questionnaire (`app/(creation)/movement-sheet.tsx`) et que les feuilles adoptées le
 * 04/11/2026 (`app/(creation)/_layout.tsx`, Hermann : « l'écran blanc s'arrête avant la fin de l'écran ce qui crée une
 * séparation ») : sans poignée, fond blanc sur toute la hauteur, hauteur plafonnée sous le titre de l'écran ouvert dessous.
 */
export const NATIVE_SHEET_CONTENT = { backgroundColor: "#FFFFFF" } as const;

/** Options de route d'une feuille native (geste de fermeture désactivé : fermeture par ✕ / ✓, comme la fiche). */
export const NATIVE_SHEET_OPTIONS = {
  presentation: "formSheet",
  sheetGrabberVisible: false,
  contentStyle: NATIVE_SHEET_CONTENT,
  gestureEnabled: false,
} as const;

/** Écart iOS entre la zone sûre haute et le haut d'une feuille à sa plus grande hauteur (comme la fiche du mouvement). */
const LARGE_SHEET_TOP_GAP = 10;

/**
 * Détent (fraction de la grande hauteur de feuille) d'une feuille de hauteur `needed`, plafonnée au bas du titre de
 * l'écran ouvert dessous — même calcul que la fiche du mouvement (`movement-sheet`). `needed` absent : le plafond.
 */
export function useTitleCappedSheetDetent(needed: number | null): number {
  const { height } = useWindowDimensions();
  const safeTop = initialWindowMetrics?.insets.top ?? 0;
  const largest = height - safeTop - LARGE_SHEET_TOP_GAP;
  const limit = height - safeTop - dimensions.header.contentHeight;
  if (largest <= 0) return 1;
  return Math.min(1, Math.round((Math.min(needed ?? limit, limit) / largest) * 1000) / 1000);
}
