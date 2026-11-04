import { Stack } from "expo-router";

import { MovementSelectionScreen } from "@/features/activities/MovementSelectionScreen";
import { useFormatSheetDetent } from "@/features/sessions/FormatModelScreen";

/**
 * Route « Utiliser un mouvement existant » (PRE-9 A.2, ARB-22a) : sélection des Mouvements actifs du Catalogue pour la Séance en cours.
 *
 * ESSAI du 04/11/2026 (Hermann : « et l'utiliser aussi pour la modale du catalogue des mouvements lorsqu'on l'appelle à
 * partir du bouton Créer ») : feuille native iOS, haut à y = 95 comme les feuilles des Formats.
 */
export default function MovementSelectionRoute() {
  const detent = useFormatSheetDetent();
  return (
    <>
      <Stack.Screen options={{ sheetAllowedDetents: [detent] }} />
      <MovementSelectionScreen inSheet />
    </>
  );
}
