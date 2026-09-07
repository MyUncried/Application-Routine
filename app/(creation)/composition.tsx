import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";

/**
 * Route `Composition d'une séance` (T01-S07 ; T01-S10 : mode modification).
 *
 * Un paramètre `sessionId` optionnel déclenche la réhydratation du brouillon
 * partagé depuis la Séance persistée (CE-T01-S10-01/02) — sans écriture à
 * l'ouverture. Son absence conserve le parcours de création. `sessionId` est
 * transmis exclusivement par la navigation ; la Séance complète n'est jamais
 * sérialisée dans la route.
 */
export default function CompositionRoute() {
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const { hydrateFromSession } = useSessionDraft();
  const sessionId =
    typeof params.sessionId === "string" && params.sessionId.length > 0 ? params.sessionId : null;

  useEffect(() => {
    hydrateFromSession?.(sessionId);
  }, [sessionId, hydrateFromSession]);

  return <CompositionScreen />;
}
