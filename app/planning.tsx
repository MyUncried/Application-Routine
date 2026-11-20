import { Stack, useLocalSearchParams } from "expo-router";

import { PlanningScreen } from "@/features/planning/PlanningScreen";
import { useTitleCappedSheetDetent } from "@/shared/ui/nativeSheet";

/**
 * Planifier (CE-UI-04/05). Paramètres : `routineId` (modifier une Routine), `duplicateOf` (brouillon de duplication),
 * `sessionId` (Séance préremplie depuis le Catalogue), `date` (Planifié le prérempli depuis le Calendrier), `occurrenceKey` (avec
 * `routineId` : modifier cette seule occurrence depuis l'Agenda, D-536 du 20/11/2026).
 * Recette du 17/11/2026 (Hermann : « Ouvrir l'écran de Planification d'une séance / d'un parcours par une modale iOS ») :
 * feuille native iOS, comme la fiche d'un mouvement. [Modale plein écran — remplacée.]
 */
export default function PlanningRoute() {
  const params = useLocalSearchParams<{ routineId?: string; duplicateOf?: string; sessionId?: string; date?: string; occurrenceKey?: string }>();
  const detent = useTitleCappedSheetDetent(null);
  const pick = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : undefined);
  const routineId = pick(params.routineId);
  const duplicateOf = pick(params.duplicateOf);
  const sessionId = pick(params.sessionId);
  const date = pick(params.date);
  const occurrenceKey = pick(params.occurrenceKey);
  return (
    <>
      <Stack.Screen options={{ sheetAllowedDetents: [detent] }} />
      <PlanningScreen
        params={{
          ...(routineId !== undefined ? { routineId } : {}),
          ...(duplicateOf !== undefined ? { duplicateOf } : {}),
          ...(sessionId !== undefined ? { sessionId } : {}),
          ...(date !== undefined ? { date } : {}),
          ...(occurrenceKey !== undefined ? { occurrenceKey } : {}),
        }}
      />
    </>
  );
}
