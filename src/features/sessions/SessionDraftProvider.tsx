import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  createEmptyDraft,
  sessionDraftsEqual,
  toSessionDraft,
  type SessionDraft,
  type SessionDraftDefaults,
} from "@/domain/sessions/SessionDraft";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
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
 *
 * **V2-PRE-2 (plan §6.1/§6.3, D-213)** : un nouveau brouillon de CRÉATION
 * reçoit Compte à rebours initial et Fin de séance depuis la valeur
 * COURANTE du Profil, lue une seule fois (`ProfileService`, facultatif —
 * en son absence, T19, les constantes du Domaine s'appliquent inchangées).
 * `creationBaseline` expose le brouillon RÉELLEMENT créé, pour que la garde
 * de sortie compare le brouillon courant à ses valeurs initiales réelles
 * (T18), jamais aux constantes du Domaine si le Profil en diffère.
 */
export function SessionDraftProvider({ children }: SessionDraftProviderProps) {
  const service = useContext(SessionServiceContext);
  const serviceRef = useRef(service);
  useEffect(() => {
    serviceRef.current = service;
  }, [service]);

  const profileService = useContext(ProfileServiceContext);
  const sessionDefaultsRef = useRef<SessionDraftDefaults>({});

  const [draft, setDraft] = useState<SessionDraft>(() => createEmptyDraft());
  const [creationBaseline, setCreationBaseline] = useState<SessionDraft>(() => createEmptyDraft());
  const [editStatus, setEditStatusState] = useState<SessionDraftEditStatus>("creating");
  const [hydratedBaseline, setHydratedBaseline] = useState<SessionDraft | null>(null);

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
    const fresh = createEmptyDraft(sessionDefaultsRef.current);
    setDraft(fresh);
    setCreationBaseline(fresh);
    setHydratedBaseline(null);
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
          const hydrated = toSessionDraft(result.session);
          setDraft(hydrated);
          setHydratedBaseline(hydrated);
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
      setHydratedBaseline(null);
      runHydration(sessionId);
    },
    [resetDraft, runHydration],
  );

  const retryHydration = useCallback(() => {
    if (currentSessionId.current !== null) {
      runHydration(currentSessionId.current);
    }
  }, [runHydration]);

  // V2-PRE-2 (D-213) : lu une seule fois par montage de ce fournisseur — un
  // changement ultérieur du Profil n'affecte jamais un brouillon déjà
  // initialisé (« sans rétroactivité »). N'applique les valeurs lues que si
  // le brouillon courant est encore le brouillon de création VIERGE (jamais
  // sur un brouillon de modification réhydraté, ni sur un brouillon de
  // création déjà modifié par l'utilisateur).
  useEffect(() => {
    if (!profileService) {
      return;
    }
    let cancelled = false;
    profileService.getProfile().then(
      (profile) => {
        if (cancelled) {
          return;
        }
        const defaults: SessionDraftDefaults = {
          initialCountdownSeconds: profile.sessionInitialCountdownSecondsDefault,
          finalPhaseSeconds: profile.sessionFinalPhaseSecondsDefault,
        };
        sessionDefaultsRef.current = defaults;
        if (statusRef.current === "creating" && currentSessionId.current === null) {
          const fresh = createEmptyDraft(defaults);
          setDraft((current) => (sessionDraftsEqual(current, createEmptyDraft()) ? fresh : current));
          setCreationBaseline(fresh);
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          console.error("Impossible de charger les valeurs initiales du Profil.", error);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [profileService]);

  const value = useMemo<SessionDraftContextValue>(
    () => ({
      draft,
      updateDraft,
      resetDraft,
      editStatus,
      hydrateFromSession,
      retryHydration,
      hydratedBaseline,
      creationBaseline,
    }),
    [
      draft,
      updateDraft,
      resetDraft,
      editStatus,
      hydrateFromSession,
      retryHydration,
      hydratedBaseline,
      creationBaseline,
    ],
  );

  return <SessionDraftContext.Provider value={value}>{children}</SessionDraftContext.Provider>;
}
