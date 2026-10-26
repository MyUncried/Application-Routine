import { useEffect, useState } from "react";

import type { MovementLevelPosition } from "@/domain/activities/movementSuggestion";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";

const NO_POSITIONS: ReadonlyMap<string, MovementLevelPosition> = new Map();

/**
 * PRE-7 (R-6, D-445 C06, v7 l.69, MFN-10 l.426) : positions de niveau des mouvements groupés, par
 * identifiant de mouvement — suffixe « - Nn » des cartes d'occurrence de la Composition, qui n'ont
 * pas de pastille. Même dégradation silencieuse que `useCategoriesReferential` : table VIDE si le
 * service n'expose pas la lecture ou échoue (cartes sans suffixe). `refreshToken` : toute nouvelle
 * valeur relit les positions (retour au premier plan après un réordonnancement ou un niveau ajouté).
 */
export function useMovementLevelPositions(
  activityDefinitionService: ActivityDefinitionService,
  refreshToken: number | string = 0,
): ReadonlyMap<string, MovementLevelPosition> {
  const [positions, setPositions] = useState<ReadonlyMap<string, MovementLevelPosition>>(NO_POSITIONS);
  useEffect(() => {
    if (typeof activityDefinitionService.listMovementLevelPositions !== "function") {
      return;
    }
    let cancelled = false;
    activityDefinitionService.listMovementLevelPositions().then(
      (result) => {
        if (!cancelled) {
          setPositions(result);
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          console.error("Impossible de charger les niveaux des mouvements.", error);
          // Relecture en échec : aucun suffixe périmé ne reste affiché.
          setPositions(NO_POSITIONS);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [activityDefinitionService, refreshToken]);
  return positions;
}
