import { Stack, useLocalSearchParams } from "expo-router";

import { MovementScreen } from "@/features/activities/MovementScreen";
import { isMovementCreationRoute } from "@/features/activities/movementRoutePresentation";
import { useTitleCappedSheetDetent } from "@/shared/ui/nativeSheet";

/** Route « Mouvement » (PRE-8, CE-MVT-01) : fiche, création et modification d'un Mouvement, écran de pile racine. */
export default function MovementRoute() {
  const params = useLocalSearchParams<{ movementId?: string; variantOf?: string }>();
  // Demande de Hermann du 04/11/2026 (« Afficher en mode modale iOS […] Catalogue des mouvements : Créer un mouvement ») :
  // en création, feuille native (`app/_layout.tsx`) à pleine hauteur de feuille, plafonnée sous le titre de l'écran.
  const creating = isMovementCreationRoute(params);
  const detent = useTitleCappedSheetDetent(null);
  return (
    <>
      {creating ? <Stack.Screen options={{ sheetAllowedDetents: [detent] }} /> : null}
      <MovementScreen inSheet={creating} />
    </>
  );
}
