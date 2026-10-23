import { useEffect, useState } from "react";

import type { Category } from "@/domain/categories/Category";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";

/**
 * PRE-6 (story 2.2) : référentiel persistant des Catégories (nom et couleur de
 * pastille) des cartes d'Exercice — carte d'occurrence de la Composition et carte
 * « Choix composition ». Même service que les Zones corporelles
 * (`ActivityDefinitionService`), même dégradation silencieuse : référentiel VIDE si
 * le service n'expose pas `listCategories` ou échoue (cartes sans Catégorie).
 * `refreshToken` : toute nouvelle valeur relit le référentiel (retour au premier plan,
 * Catégorie créée, renommée ou recolorée ailleurs).
 */
export function useCategoriesReferential(
  activityDefinitionService: ActivityDefinitionService,
  refreshToken: number | string = 0,
): readonly Category[] {
  const [categories, setCategories] = useState<readonly Category[]>([]);
  useEffect(() => {
    if (typeof activityDefinitionService.listCategories !== "function") {
      return;
    }
    let cancelled = false;
    activityDefinitionService.listCategories().then(
      (result) => {
        if (!cancelled) {
          setCategories(result);
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          console.error("Impossible de charger les Catégories.", error);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [activityDefinitionService, refreshToken]);
  return categories;
}
