import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { PlanningFrequencySheet } from "@/features/planning/PlanningFrequencySheet";
import { pendingPlanningSheet, releasePlanningSheet } from "@/features/planning/planningSheetRelay";

/** « Fréquence » d'une ligne de contenu (CE-UI-11) — feuille native au-dessus du formulaire de planification. */
export default function PlanningFrequencyRoute() {
  const router = useRouter();
  const [request] = useState(() => pendingPlanningSheet("frequency"));
  useEffect(() => {
    if (request === null && router.canGoBack()) router.back();
    return () => releasePlanningSheet();
  }, [request, router]);
  if (request === null) return null;
  return (
    <PlanningFrequencySheet
      name={request.name}
      frequency={request.frequency}
      onCancel={() => router.back()}
      onValidate={(frequency) => {
        request.onValidate(frequency);
        router.back();
      }}
    />
  );
}
