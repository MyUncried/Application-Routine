import { Stack } from "expo-router";

import { MovementScreen } from "@/features/activities/MovementScreen";
import { useTitleCappedSheetDetent } from "@/shared/ui/nativeSheet";

/** Route « Mouvement » (PRE-8, CE-MVT-01) : fiche, création et modification d'un Mouvement, écran de pile racine. */
export default function MovementRoute() {
  // Demande de Hermann du 04/11/2026 (« Afficher en mode modale iOS […] Catalogue des mouvements : Créer un mouvement ») ;
  // Hermann, 04/11/2026 : « catalogue des mouvements, appuyer sur la photo ouvre la fiche des mouvements en modification, elle doit être ouverte sous forme de modale iOS » : feuille native (`app/_layout.tsx`) à pleine hauteur de feuille, plafonnée sous le titre de l'écran, dans tous
  // les cas (création, modification, consultation, ajout d'un niveau).
  const detent = useTitleCappedSheetDetent(null);
  return (
    <>
      <Stack.Screen options={{ sheetAllowedDetents: [detent] }} />
      <MovementScreen inSheet />
    </>
  );
}
