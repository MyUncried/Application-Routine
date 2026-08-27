import { useCallback, useEffect, useRef, useState } from "react";

import { useSessionService } from "@/features/sessions/SessionServiceContext";
import type { SessionSummary } from "@/domain/sessions/Session";

/**
 * Hook de chargement pur du Catalogue (T01-S06). Ne connaît ni
 * `expo-router` ni la navigation : c'est l'appelant (`CatalogueScreen`) qui
 * décide quand déclencher `reload`/`cancelPending`, typiquement au focus et
 * au blur d'un `useFocusEffect`. N'importe ni `SqliteSessionRepository`, ni
 * `Database`, ni `expo-sqlite` — le seul point d'accès aux données est
 * `useSessionService()`.
 */
export type SessionCatalogueState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; sessions: readonly SessionSummary[] }
  | { status: "error"; error: unknown };

export type UseSessionCatalogueResult = {
  state: SessionCatalogueState;
  /** Démarre un nouveau chargement ; référence stable (`useCallback`). */
  reload: () => void;
  /**
   * Invalide toute requête actuellement en vol, sans en démarrer de
   * nouvelle : sa résolution ultérieure (succès ou échec) sera ignorée.
   * Référence stable (`useCallback`).
   */
  cancelPending: () => void;
};

export function useSessionCatalogue(): UseSessionCatalogueResult {
  const sessionService = useSessionService();
  const [state, setState] = useState<SessionCatalogueState>({ status: "loading" });

  // Identifiant de la dernière requête déclenchée : toute résolution dont
  // l'identifiant capturé ne correspond plus à cette valeur au moment où
  // elle arrive est ignorée — qu'elle soit périmée par un rechargement plus
  // récent (concurrence) ou invalidée explicitement par `cancelPending`
  // (blur). C'est la même garde dans les deux cas.
  const requestIdRef = useRef(0);

  // Garde de démontage. Réinitialisé DANS le corps de l'effet (pas dans
  // l'initialiseur de `useRef`) afin de redevenir correctement `true` lors
  // du remontage synthétique de React Strict Mode : `useRef(false)` ne
  // s'exécute qu'au tout premier rendu, alors que ce corps d'effet se
  // rejoue à chaque remontage — synthétique ou réel.
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

    sessionService.listActiveSessions().then(
      (sessions) => {
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          return;
        }
        setState(
          sessions.length === 0 ? { status: "empty" } : { status: "ready", sessions },
        );
      },
      (error: unknown) => {
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          return;
        }
        // L'erreur réelle est journalisée pour le diagnostic technique ;
        // aucun détail technique n'est jamais exposé à l'utilisateur (même
        // principe que RootErrorBoundary/RootErrorFallback, T01-S05).
        console.error("Impossible de charger les séances actives.", error);
        setState({ status: "error", error });
      },
    );
  }, [sessionService]);

  return { state, reload, cancelPending };
}
