import { useCallback, useEffect, useRef, useState } from "react";

import type { ActivityDefinition } from "@/domain/activities";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";

/**
 * Hook de chargement pur du segment `Activités` du Catalogue (V2-CAT-01) —
 * même patron que `@/features/sessions/useSessionCatalogue` : ne connaît ni
 * `expo-router` ni la navigation, c'est l'appelant qui décide quand
 * déclencher `reload`/`cancelPending` (typiquement au focus/blur d'un
 * `useFocusEffect`, et à l'activation du segment). N'importe ni
 * `SqliteActivityDefinitionRepository`, ni `Database`, ni `expo-sqlite` — le
 * seul point d'accès aux données est `useActivityDefinitionService()`.
 */
export type ActivityCatalogueState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; definitions: readonly ActivityDefinition[] }
  | { status: "error"; error: unknown };

export type UseActivityCatalogueResult = {
  state: ActivityCatalogueState;
  /** Démarre un nouveau chargement ; référence stable (`useCallback`). */
  reload: () => void;
  /** Invalide toute requête en vol sans en démarrer de nouvelle ; référence stable. */
  cancelPending: () => void;
};

export function useActivityCatalogue(): UseActivityCatalogueResult {
  const activityDefinitionService = useActivityDefinitionService();
  const [state, setState] = useState<ActivityCatalogueState>({ status: "loading" });

  const requestIdRef = useRef(0);
  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const cancelPending = useCallback(() => {
    requestIdRef.current += 1;
  }, []);

  const reload = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setState({ status: "loading" });

    activityDefinitionService.listActivityDefinitions().then(
      (definitions) => {
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          return;
        }
        setState(
          definitions.length === 0 ? { status: "empty" } : { status: "ready", definitions },
        );
      },
      (error: unknown) => {
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          return;
        }
        console.error("Impossible de charger les activités du Catalogue.", error);
        setState({ status: "error", error });
      },
    );
  }, [activityDefinitionService]);

  return { state, reload, cancelPending };
}
