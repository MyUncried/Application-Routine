import {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { createEmptyDraft, toSessionDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import {
  SessionDraftContext,
  type SessionDraftContextValue,
  type SessionDraftEditStatus,
} from "@/features/sessions/SessionDraftContext";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";

export type SessionDraftProviderProps = {
  children: ReactNode;
};

/**
 * État réel du brouillon de Composition (T01-S07 ; T01-S10 : mode
 * modification). Un unique `useState` local, initialisé à
 * `createEmptyDraft()`. `updateDraft`/`resetDraft`/`hydrateFromSession`/
 * `retryHydration` restent des références stables (`useCallback` sans
 * dépendance variable — l'état lu est passé par ref) : condition nécessaire
 * pour que `useCompositionExitGuard` (qui reçoit `resetDraft`) et l'effet de
 * réhydratation de la route ne resouscrivent / ne rebouclent pas.
 *
 * Monté par `app/(creation)/_layout.tsx`, au-dessus d'un `Stack` imbriqué :
 * le brouillon survit à toute navigation entre écrans enfants de ce `Stack`.
 *
 * **Modification (T01-S10, CE-T01-S10-01/02/09)** : `hydrateFromSession(id)`
 * lit la Séance persistée via `SessionService.getSessionForEdit` (lecture
 * seule, jamais d'écriture à l'ouverture) et remplace le brouillon par
 * `toSessionDraft(session)`. Une réponse asynchrone dont l'identifiant n'est
 * plus l'identifiant courant est ignorée (garde par numéro de requête
 * monotone) : le brouillon d'une nouvelle Séance n'est jamais écrasé par la
 * réponse tardive d'une ancienne. `hydrateFromSession(null)` (ré)initialise
 * un brouillon de création. Le `SessionService` est facultatif ici (le
 * parcours de création n'en a pas besoin) : en son absence, une demande de
 * réhydratation échoue proprement en `"error"`.
 */
export function SessionDraftProvider({ children }: SessionDraftProviderProps) {
  const service = useContext(SessionServiceContext);
  const serviceRef = useRef(service);
  serviceRef.current = service;

  const [draft, setDraft] = useState<SessionDraft>(() => createEmptyDraft());
  const [editStatus, setEditStatusState] = useState<SessionDraftEditStatus>("creating");

  // Numéro de requête monotone : seule la réponse de la requête la plus
  // récente est appliquée (garde anti-brouillon-contaminé).
  const requestSeq = useRef(0);
  const currentSessionId = useRef<string | null>(null);
  const statusRef = useRef<SessionDraftEditStatus>("creating");

  const setEditStatus = useCallback((next: SessionDraftEditStatus) => {
    statusRef.current = next;
    setEditStatusState(next);
  }, []);

  const updateDraft = useCallback((patch: Partial<SessionDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const resetDraft = useCallback(() => {
    requestSeq.current += 1;
    currentSessionId.current = null;
    setDraft(createEmptyDraft());
    setEditStatus("creating");
  }, [setEditStatus]);

  const runHydration = useCallback(
    (sessionId: string) => {
      const seq = (requestSeq.current += 1);
      setEditStatus("loading");

      const activeService = serviceRef.current;
      if (!activeService) {
        setEditStatus("error");
        return;
      }

      activeService
        .getSessionForEdit(sessionId)
        .then((result) => {
          if (seq !== requestSeq.current) {
            return; // Réponse obsolète : un autre identifiant a pris la main.
          }
          if (result.status === "NOT_FOUND") {
            setEditStatus("not-found");
            return;
          }
          if (result.status === "ARCHIVED") {
            setEditStatus("archived");
            return;
          }
          setDraft(toSessionDraft(result.session));
          setEditStatus("ready");
        })
        .catch(() => {
          if (seq !== requestSeq.current) {
            return;
          }
          setEditStatus("error");
        });
    },
    [setEditStatus],
  );

  const hydrateFromSession = useCallback(
    (sessionId: string | null) => {
      if (sessionId === null) {
        if (currentSessionId.current === null && statusRef.current === "creating") {
          return; // Déjà en création vierge : aucun effet.
        }
        resetDraft();
        return;
      }
      if (
        sessionId === currentSessionId.current &&
        (statusRef.current === "ready" || statusRef.current === "loading")
      ) {
        return; // Déjà chargé / en cours pour ce même identifiant.
      }
      currentSessionId.current = sessionId;
      // Aucun brouillon obsolète affiché pendant le chargement.
      setDraft(createEmptyDraft());
      runHydration(sessionId);
    },
    [resetDraft, runHydration],
  );

  const retryHydration = useCallback(() => {
    if (currentSessionId.current !== null) {
      runHydration(currentSessionId.current);
    }
  }, [runHydration]);

  const value = useMemo<SessionDraftContextValue>(
    () => ({
      draft,
      updateDraft,
      resetDraft,
      editStatus,
      hydrateFromSession,
      retryHydration,
    }),
    [draft, updateDraft, resetDraft, editStatus, hydrateFromSession, retryHydration],
  );

  return <SessionDraftContext.Provider value={value}>{children}</SessionDraftContext.Provider>;
}
