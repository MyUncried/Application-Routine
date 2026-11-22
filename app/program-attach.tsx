import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { ProgramAttachSheet } from "@/features/programs/ProgramAttachSheet";
import { useProgramService } from "@/features/programs/ProgramServiceContext";
import { pendingProgramSheet, releaseProgramSheet } from "@/features/programs/programSheetRelay";
import { useTitleCappedSheetDetent } from "@/shared/ui/nativeSheet";

/** « Rattacher une routine existante » (D-549) — feuille native posée sur la modale du programme. */
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
      <ProgramAttachSheet service={service} programId={request.programId} onAttached={request.onAttached} onClose={() => router.back()} />
    </>
  );
}
