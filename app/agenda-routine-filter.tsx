import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import { usePlanningService } from "@/features/planning/PlanningServiceContext";
import { pendingPlanningSheet, releasePlanningSheet } from "@/features/planning/planningSheetRelay";
import { RoutineFilterSheet, type RoutineFilterChoice } from "@/features/planning/RoutineFilterSheet";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";
import { useTitleCappedSheetDetent } from "@/shared/ui/nativeSheet";

/**
 * Modale « Filtrer par routine » de l'Agenda (D-539, 20/11/2026) — feuille native iOS, comme « Catalogue des séances »
 * ouvert depuis la planification. La demande (sélection en cours, rappel) passe par le relais des feuilles de la
 * planification ; rien n'est persisté ici.
 */
export default function AgendaRoutineFilterRoute() {
  const router = useRouter();
  const planning = usePlanningService();
  const detent = useTitleCappedSheetDetent(null);
  const [request] = useState(() => pendingPlanningSheet("routineFilter"));
  const [choices, setChoices] = useState<readonly RoutineFilterChoice[] | null>(null);
  const { state: catalogue, reload } = useSessionCatalogue();
  useEffect(() => {
    if (request === null && router.canGoBack()) router.back();
    return () => releasePlanningSheet();
  }, [request, router]);
  useEffect(() => {
    reload();
    let cancelled = false;
    planning.routineFilterChoices().then(
      (list) => {
        if (!cancelled) setChoices(list);
      },
      () => {
        if (!cancelled) setChoices([]);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [planning, reload]);
  const sessions = useMemo(() => {
    const map = new Map<string, SessionCatalogueProjection>();
    if (catalogue.status === "ready") for (const projection of catalogue.sessions) map.set(projection.id, projection);
    return map;
  }, [catalogue]);
  if (request === null) return null;
  return (
    <>
      <Stack.Screen options={{ sheetAllowedDetents: [detent] }} />
      <RoutineFilterSheet
        choices={choices ?? []}
        loading={choices === null}
        sessions={sessions}
        onClose={() => router.back()}
        onValidate={(selected) => {
          request.onValidate(selected);
          router.back();
        }}
      />
    </>
  );
}
