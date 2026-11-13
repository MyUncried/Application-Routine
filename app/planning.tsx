import { useLocalSearchParams } from "expo-router";

import { PlanningScreen } from "@/features/planning/PlanningScreen";

/**
 * Planifier (CE-UI-04/05). Paramètres : `routineId` (modifier une Routine), `duplicateOf` (brouillon de duplication),
 * `sessionId` (Séance préremplie depuis le Catalogue), `date` (Début le prérempli depuis le Calendrier).
 */
export default function PlanningRoute() {
  const params = useLocalSearchParams<{ routineId?: string; duplicateOf?: string; sessionId?: string; date?: string }>();
  const pick = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : undefined);
  const routineId = pick(params.routineId);
  const duplicateOf = pick(params.duplicateOf);
  const sessionId = pick(params.sessionId);
  const date = pick(params.date);
  return (
    <PlanningScreen
      params={{
        ...(routineId !== undefined ? { routineId } : {}),
        ...(duplicateOf !== undefined ? { duplicateOf } : {}),
        ...(sessionId !== undefined ? { sessionId } : {}),
        ...(date !== undefined ? { date } : {}),
      }}
    />
  );
}
