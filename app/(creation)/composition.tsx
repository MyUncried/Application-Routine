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
 *
 * Règle de Hermann du 06/11/2026 (registre ch07 : « Je ne veux pas qu’on ouvre un écran pour rien en prévision d’un scénario où
 * l’on souhaite qu’il apparaisse après une annulation ou une validation ») : « Créer » du Catalogue des séances ouvre directement
 * la modale « Créer un exercice » (feuille de la pile racine) ; la Composition ne s'ouvre qu'après une validation (Format
 * enregistré, exercice créé), avec `keepDraft=1` : elle reprend le brouillon que la validation vient de remplir.
 * [Complément du 5 novembre 2026 (CE-CREATION-01) : Composition ouverte d'avance par `create=1`, modale présentée par elle,
 * retour au Catalogue tant que le brouillon restait vide — remplacés.]
 *
 * Le brouillon vit au niveau de l'application (`CreationDraftProviders`) : une Composition ouverte sans `keepDraft` repart d'un
 * brouillon vierge (création) ou de la Séance (`sessionId`), et le brouillon est remis à zéro quand la Composition se ferme.
 */
export default function CompositionRoute() {
  const params = useLocalSearchParams<{ sessionId?: string; keepDraft?: string }>();
  const { hydrateFromSession, resetDraft } = useSessionDraft();
  const sessionId =
    typeof params.sessionId === "string" && params.sessionId.length > 0 ? params.sessionId : null;

  // PRE-9 C.2, puis règle du 06/11/2026 : ouverte après une validation de la modale de création, la Composition reprend le
  // brouillon rempli au lieu d'en créer un nouveau.
  const keepDraft = params.keepDraft === "1" && sessionId === null;

  useEffect(() => {
    if (keepDraft) return;
    if (sessionId === null) resetDraft();
    else hydrateFromSession?.(sessionId);
  }, [keepDraft, sessionId, hydrateFromSession, resetDraft]);
  // Brouillon partagé au niveau de l'application : la Composition fermée ne le laisse pas à la suivante.
  useEffect(() => () => resetDraft(), [resetDraft]);

  // Correction non-flash (LOT_3_OF_3) : `sessionId` est désormais transmis
  // EN PROP, et pas seulement via l'effet de réhydratation ci-dessus. Cet
  // effet ne s'exécute qu'APRÈS le premier commit ; sans cette prop, ce
  // premier rendu affichait le formulaire de création et ses valeurs par
  // défaut le temps d'une frame, avant que `editStatus` ne passe à
  // `"loading"`. Voir `CompositionScreenProps.sessionId`.
  return <CompositionScreen sessionId={sessionId} />;
}
