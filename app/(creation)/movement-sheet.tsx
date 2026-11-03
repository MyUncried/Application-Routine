import { useLocalSearchParams } from "expo-router";

import { MovementSheet } from "@/features/activities/MovementScreen";

/**
 * Recette iPhone n° 3 du 03/11/2026 (autres constats, Hermann : « Mouvement de l'écran du questionnaire ou du
 * récapitulatif : un appui court doit ouvrir la fiche du mouvement en modale, par le bas, lecture seule sans
 * possibilité de modification ») : fiche d'un Mouvement en consultation seule, présentée en modale.
 */
export default function MovementSheetRoute() {
  const params = useLocalSearchParams<{ movementId?: string }>();
  return <MovementSheet movementId={params.movementId ?? null} variantOf={null} variantPlacement="AFTER_ORIGIN" readOnly />;
}
