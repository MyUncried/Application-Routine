import { useCallback, useEffect, useRef, useState } from "react";

import type { ActivityDefinition } from "@/domain/activities";
import { groupDefinitionsByMovement } from "@/domain/activities/ActivityDefinition";
import type { MovementLevelPosition } from "@/domain/activities/movementSuggestion";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";

/**
 * Hook de chargement pur du segment `Activités` du Catalogue (V2-CAT-01) —
 * même patron que `@/features/sessions/useSessionCatalogue` : ne connaît ni
 * `expo-router` ni la navigation, c'est l'appelant qui décide quand
 * déclencher `reload`/`cancelPending` (typiquement au focus/blur d'un
 * `useFocusEffect`, et à l'activation du segment). N'importe ni
 * `SqliteActivityDefinitionRepository`, ni `Database`, ni `expo-sqlite` — le
 * seul point d'accès aux données est `useActivityDefinitionService()`.
 *
 * PRE-7 (A4.1, D-439, MFN-10 ; CE-T03-02 §5, CE-T03-07 §5) : `definitions`
 * porte l'ordre regroupé par geste, aplati — groupes dans l'ordre de première
 * apparition de la liste `updatedAt DESC` du Repository, définitions d'un
 * groupe dans cet ordre (`groupDefinitionsByMovement`, A1.3). Le Catalogue et
 * la modale « Sélection des exercices » affichent cet ordre, chaque définition
 * gardant sa propre carte et son résumé : aucune ligne de groupe n'existe,
 * rien ne se lance ni ne s'insère sans désigner une définition précise.
 *
 * PRE-7 (R-6, D-445 C06, MFN-10 l.426) : `levelPositions` porte la position de niveau de chaque
 * mouvement groupé (par identifiant de mouvement), lue avec la liste : suffixe « - Nn » des cartes
 * sans pastille. Absente ou illisible : cartes sans suffixe, liste inchangée.
 */
export type ActivityCatalogueState =
  | { status: "loading" }
  | { status: "empty" }
  | {
      status: "ready";
      definitions: readonly ActivityDefinition[];
      levelPositions?: ReadonlyMap<string, MovementLevelPosition>;
    }
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
    // PRE-4 story 4.1 (AC1, AC2) : un rechargement au retour sur le Catalogue
    // garde la liste déjà affichée jusqu’à la réponse, au lieu de repasser par
    // l’indicateur de chargement : la liste n’est pas démontée, sa position de
    // défilement est restituée. Le premier chargement reste « loading ».
    setState((current) => (current.status === "ready" ? current : { status: "loading" }));

    Promise.all([
      activityDefinitionService.listActivityDefinitions(),
      readLevelPositions(activityDefinitionService),
    ]).then(
      ([definitions, levelPositions]) => {
        if (requestIdRef.current !== requestId || !isMountedRef.current) {
          return;
        }
        setState(
          definitions.length === 0
            ? { status: "empty" }
            : { status: "ready", definitions: groupedByMovement(definitions), levelPositions },
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

/**
 * PRE-7 (R-6) : positions de niveau, dégradation silencieuse (journal) — un échec, ou un service
 * sans cette lecture (doublures antérieures), laisse les cartes sans suffixe sans priver la liste.
 */
async function readLevelPositions(
  service: ActivityDefinitionService,
): Promise<ReadonlyMap<string, MovementLevelPosition>> {
  if (typeof service.listMovementLevelPositions !== "function") {
    return new Map();
  }
  try {
    return await service.listMovementLevelPositions();
  } catch (error) {
    console.error("Impossible de charger les niveaux des mouvements.", error);
    return new Map();
  }
}

/**
 * Ordre regroupé par geste, aplati (A4.1) ; aucun retri au sein d'un groupe.
 * Reproduit exactement `ActivityDefinitionService.listActivityDefinitionsByMovement`
 * (même fonction de domaine `groupDefinitionsByMovement` sur la même liste) :
 * les deux doivent rester alignés.
 */
function groupedByMovement(
  definitions: readonly ActivityDefinition[],
): readonly ActivityDefinition[] {
  return groupDefinitionsByMovement(definitions).flatMap((group) => group.definitions);
}
