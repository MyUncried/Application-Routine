import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import {
  projectSessionForCatalogue,
  type CatalogueCategoryRef,
  type SessionCatalogueProjection,
} from "@/features/sessions/sessionCatalogueProjection";
import { useSessionService } from "@/features/sessions/SessionServiceContext";

/**
 * Hook de chargement pur du Catalogue (T01-S06). Ne connaît ni
 * `expo-router` ni la navigation : c'est l'appelant (`CatalogueScreen`) qui
 * décide quand déclencher `reload`/`cancelPending`, typiquement au focus et
 * au blur d'un `useFocusEffect`. N'importe ni `SqliteSessionRepository`, ni
 * `Database`, ni `expo-sqlite` — le seul point d'accès aux données est
 * `useSessionService()`.
 *
 * PRE-8 (epic E, E.1 et E.2) : lit le Catalogue unifié (`listCatalogueSessions`, Séances actives et
 * archivées) et le projette (`projectSessionForCatalogue`) avec les Catégories du référentiel,
 * inactives comprises (une Catégorie retirée garde son nom sur les Séances qui la portent). `empty` :
 * aucune Séance du tout (Catalogue réellement vide, Q-E6) ; le filtrage est l'affaire de l'écran.
 * Référentiel absent ou en échec : aucune catégorie, jamais un blocage du Catalogue.
 *
 * E.4 / E.5 : une relecture (retour au premier plan, action du glissé) garde la liste affichée
 * jusqu'à la nouvelle lecture — l'état `loading` n'est montré qu'au premier chargement ou après une
 * erreur ou un Catalogue vide : position, déploiement et snackbar sont conservés.
 */
export type SessionCatalogueState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; sessions: readonly SessionCatalogueProjection[] }
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
  const referentials = useContext(ReferentialServiceContext);
  const [state, setState] = useState<SessionCatalogueState>({ status: "loading" });

  // Identifiant de la dernière requête déclenchée : toute résolution dont
  // l'identifiant capturé ne correspond plus à cette valeur au moment où
  // elle arrive est ignorée — qu'elle soit périmée par un rechargement plus
  // récent (concurrence) ou invalidée explicitement par `cancelPending`
  // (blur). C'est la même garde dans les deux cas.
  const requestIdRef = useRef(0);

  // Garde de démontage. Réinitialisé DANS le corps de l'effet (pas dans
  // l'initialiseur de `useRef`) afin de redevenir correctement `true` lors
  // du remontage synthétique de React Strict Mode.
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
    setState((current) => (current.status === "ready" ? current : { status: "loading" }));

    const categories: Promise<ReadonlyMap<string, CatalogueCategoryRef>> =
      referentials && typeof referentials.listCategories === "function"
        ? referentials.listCategories().then(
            (list) => new Map(list.map((category) => [category.id, { id: category.id, name: category.name, color: category.color }])),
            (error: unknown) => {
              console.error("Les catégories n'ont pas pu être chargées.", error);
              return new Map();
            },
          )
        : Promise.resolve(new Map());

    Promise.all([sessionService.listCatalogueSessions(), categories]).then(
      ([records, categoriesById]) => {
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          return;
        }
        setState(
          records.length === 0
            ? { status: "empty" }
            : { status: "ready", sessions: records.map((record) => projectSessionForCatalogue(record, categoriesById)) },
        );
      },
      (error: unknown) => {
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          return;
        }
        // L'erreur réelle est journalisée pour le diagnostic technique ;
        // aucun détail technique n'est jamais exposé à l'utilisateur (même
        // principe que RootErrorBoundary/RootErrorFallback, T01-S05).
        console.error("Impossible de charger les séances.", error);
        setState({ status: "error", error });
      },
    );
  }, [sessionService, referentials]);

  return { state, reload, cancelPending };
}
