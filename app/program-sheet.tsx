import { Stack, useLocalSearchParams } from "expo-router";

import { ProgramSheetScreen } from "@/features/programs/ProgramSheetScreen";
import { useTitleCappedSheetDetent } from "@/shared/ui/nativeSheet";

/**
 * Créer ou configurer un programme (CE-PROG-02, D-548) — feuille native iOS au-dessus du catalogue des programmes, même
 * mécanisme que la planification. Paramètres : `programId` (configuration), `duplicateOf` (copie, décision de Hermann du
 * 21/11/2026) ; aucun : création.
 */
export default function ProgramSheetRoute() {
  const params = useLocalSearchParams<{ programId?: string; duplicateOf?: string }>();
  const detent = useTitleCappedSheetDetent(null);
  const pick = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : undefined);
  const programId = pick(params.programId);
  const duplicateOf = pick(params.duplicateOf);
  return (
    <>
      <Stack.Screen options={{ sheetAllowedDetents: [detent] }} />
      <ProgramSheetScreen
        params={{ ...(programId !== undefined ? { programId } : {}), ...(duplicateOf !== undefined ? { duplicateOf } : {}) }}
      />
    </>
  );
}
