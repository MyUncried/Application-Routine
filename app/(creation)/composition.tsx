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

  // Correction non-flash (LOT_3_OF_3) : `sessionId` est désormais transmis
  // EN PROP, et pas seulement via l'effet de réhydratation ci-dessus. Cet
  // effet ne s'exécute qu'APRÈS le premier commit ; sans cette prop, ce
  // premier rendu affichait le formulaire de création et ses valeurs par
  // défaut le temps d'une frame, avant que `editStatus` ne passe à
  // `"loading"`. Voir `CompositionScreenProps.sessionId`.
  return <CompositionScreen sessionId={sessionId} />;
}
