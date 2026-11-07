import { useContext, useEffect, useState } from "react";

import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";

/**
 * Référentiel des Zones corporelles lu par le service des Mouvements (même mécanisme que la carte du
 * Catalogue, `ActivityCard`) : `useContext` brut, dégradation silencieuse vers un référentiel vide
 * quand le service n'est pas fourni (tests) ou ne le lit pas.
 */
export function useBodyZonesReferential(): readonly BodyZone[] {
  const service = useContext(ActivityDefinitionServiceContext);
  const [zones, setZones] = useState<readonly BodyZone[]>([]);
  useEffect(() => {
    if (!service || typeof service.listBodyZones !== "function") return;
    let cancelled = false;
    service.listBodyZones().then(
      (result) => {
        if (!cancelled) setZones(result);
      },
      (error: unknown) => {
        if (!cancelled) console.error("Impossible de charger les Zones corporelles.", error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [service]);
  return zones;
}
