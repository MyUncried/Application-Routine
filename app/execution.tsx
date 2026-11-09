import { useLocalSearchParams } from "expo-router";

import { ExecutionScreen } from "@/features/execution/ExecutionScreen";

/**
 * PRE-10.3 — écran d'Exécution d'une Séance (CE-EXEC-SESSION-01), ouvert par « Démarrer » d'une carte du
 * Catalogue des séances (`sessionId`) ou par la reprise d'une Exécution interrompue (sans paramètre : l'écran
 * affiche l'Exécution active du service). Plein écran, sans navigation principale ni geste de retour.
 */
export default function ExecutionRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  return <ExecutionScreen sessionId={typeof sessionId === "string" && sessionId.length > 0 ? sessionId : null} />;
}
