import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { pendingPlanningSheet, releasePlanningSheet } from "@/features/planning/planningSheetRelay";
import { ProgramChoiceSheet } from "@/features/planning/ProgramChoiceSheet";
import { useProgramService } from "@/features/programs/ProgramServiceContext";
import { useTitleCappedSheetDetent } from "@/shared/ui/nativeSheet";

/**
 * Modale « Rattacher un programme » (D-545, 23/11/2026) — feuille native iOS posée sur « Planifier », comme « Catalogue des
 * séances » ouvert par « Changer ». Toucher une carte rend le choix et ferme la feuille ; ✕ ferme sans rien changer.
 */
export default function PlanningProgramRoute() {
  const router = useRouter();
  const service = useProgramService();
  const detent = useTitleCappedSheetDetent(null);
  const [request] = useState(() => pendingPlanningSheet("program"));
  useEffect(() => {
    if (request === null && router.canGoBack()) router.back();
    return () => releasePlanningSheet();
  }, [request, router]);
  if (request === null) return null;
  return (
    <>
      <Stack.Screen options={{ sheetAllowedDetents: [detent] }} />
      <ProgramChoiceSheet
        service={service}
        selectedId={request.selectedId}
        onCancel={() => router.back()}
        onChoose={(programId) => {
          request.onChoose(programId);
          router.back();
        }}
      />
    </>
  );
}
