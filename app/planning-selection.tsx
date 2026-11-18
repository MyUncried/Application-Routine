import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import { pendingPlanningSheet, releasePlanningSheet } from "@/features/planning/planningSheetRelay";
import { PlanningSelection } from "@/features/planning/PlanningSelection";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";
import { useTitleCappedSheetDetent } from "@/shared/ui/nativeSheet";

/**
 * « Catalogue des séances » de la planification (CE-UI-04) — feuille native iOS posée sur « Planifier » (recette du
 * 17/11/2026, Hermann : « Ouvrir l'écran de catalogue des séances par une modale iOS », option « Feuilles iOS »).
 */
export default function PlanningSelectionRoute() {
  const router = useRouter();
  const detent = useTitleCappedSheetDetent(null);
  const [request] = useState(() => pendingPlanningSheet("selection"));
  const { state: catalogue, reload } = useSessionCatalogue();
  useEffect(() => {
    if (request === null && router.canGoBack()) router.back();
    return () => releasePlanningSheet();
  }, [request, router]);
  useEffect(() => {
    reload();
  }, [reload]);
  const sessions = useMemo(
    () => (catalogue.status === "ready" ? catalogue.sessions.filter((projection) => projection.status === "ACTIVE") : []),
    [catalogue],
  );
  if (request === null) return null;
  return (
    <>
      <Stack.Screen options={{ sheetAllowedDetents: [detent] }} />
      <PlanningSelection
        sessions={sessions}
        loading={catalogue.status === "loading"}
        failed={catalogue.status === "error"}
        initial={request.initial}
        onCancel={() => (request.closeAll ? router.dismiss(2) : router.back())}
        onValidate={(selected) => {
          request.onValidate(selected);
          router.back();
        }}
      />
    </>
  );
}
