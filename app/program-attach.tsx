import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { ProgramAttachSheet } from "@/features/programs/ProgramAttachSheet";
import { useProgramService } from "@/features/programs/ProgramServiceContext";
import { pendingProgramSheet, releaseProgramSheet } from "@/features/programs/programSheetRelay";
import { useTitleCappedSheetDetent } from "@/shared/ui/nativeSheet";

/**
 * « Rattacher des routines existantes » (D-549 ; recette du 23/11/2026, p4-rattacher) — feuille native posée sur la modale du
 * programme, comme « Filtrer par routine » sur l'Agenda.
 */
export default function ProgramAttachRoute() {
  const router = useRouter();
  const service = useProgramService();
  const detent = useTitleCappedSheetDetent(null);
  const [request] = useState(() => pendingProgramSheet("attach"));
  useEffect(() => {
    if (request === null && router.canGoBack()) router.back();
    return () => releaseProgramSheet();
  }, [request, router]);
  if (request === null) return null;
  return (
    <>
      <Stack.Screen options={{ sheetAllowedDetents: [detent] }} />
      <ProgramAttachSheet
        service={service}
        request={request}
        onClose={() => router.back()}
        // Contre-recette du 23/11/2026 (c) : la date d'une carte ouvre la planification en modification, comme le Journal.
        onEditRoutine={(routineId) => router.push({ pathname: "/planning", params: { routineId } })}
      />
    </>
  );
}
