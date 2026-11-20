import { useLocalSearchParams } from "expo-router";

import { ExecutionScreen } from "@/features/execution/ExecutionScreen";
import { parseChain, parseOrigin } from "@/features/execution/executionChain";

/**
 * PRE-10.3 — écran d'Exécution d'une Séance (CE-EXEC-SESSION-01), ouvert par « Démarrer » d'une carte du
 * Catalogue des séances (`sessionId`) ou par la reprise d'une Exécution interrompue (sans paramètre : l'écran
 * affiche l'Exécution active du service). Plein écran, sans navigation principale ni geste de retour.
 *
 * D-534 (19/11/2026) : « Démarrer » d'une routine à plusieurs séances ajoute la chaîne (`chain` : séances dans l'ordre,
 * `rank` : rang courant) ; la fin d'une séance remplace l'écran par la suivante. La clé remonte l'écran à chaque séance.
 */
export default function ExecutionRoute() {
  const { sessionId, chain, rank, routineId, occurrence } = useLocalSearchParams<{
    sessionId?: string;
    chain?: string;
    rank?: string;
    routineId?: string;
    occurrence?: string;
  }>();
  const id = typeof sessionId === "string" && sessionId.length > 0 ? sessionId : null;
  const parsed = parseChain(id, chain, rank);
  // Recette du 19/11/2026 au soir : la séance lancée depuis une occurrence de routine y est rattachée (statut de l'occurrence).
  const origin = id === null ? null : parseOrigin(routineId, occurrence);
  return <ExecutionScreen key={`${id ?? ""}|${parsed?.rank ?? 0}`} sessionId={id} chain={parsed} origin={origin} />;
}
