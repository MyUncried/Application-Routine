import { useSyncExternalStore } from "react";

import type { MovementCatalogueFilters } from "@/features/activities/movementCatalogueView";
import type { SessionCatalogueFilters } from "@/features/sessions/sessionCatalogueFilters";

/**
 * Demande de Hermann du 04/11/2026 (« Afficher en mode modale iOS […] Catalogue des mouvements : Filtres […] Catalogue
 * des séances : Filtres ») : la feuille de filtres est une route en feuille native iOS (`catalogue-filters`, et
 * `selection-filters` dans le parcours de création). Les filtres courants et l'application des filtres choisis passent
 * par ce relais de module (même principe que `handMovementsToFormat`), l'écran appelant gardant ses filtres.
 */
export type FilterSheetRequest =
  | {
      readonly kind: "movements";
      readonly filters: MovementCatalogueFilters;
      readonly onApply: (filters: MovementCatalogueFilters, labels: readonly string[]) => void;
    }
  | {
      readonly kind: "sessions";
      readonly filters: SessionCatalogueFilters;
      readonly onApply: (filters: SessionCatalogueFilters, labels: readonly string[]) => void;
    };

let current: FilterSheetRequest | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

/** Dépose la demande lue par la feuille qui va s'ouvrir (avant `router.push`). */
export function requestFilterSheet(request: FilterSheetRequest): void {
  current = request;
  notify();
}

/** Retire la demande (feuille démontée, fin de la descente) ; sans effet si une autre demande l'a remplacée. */
export function releaseFilterSheet(request: FilterSheetRequest | null = current): void {
  if (request === null || current !== request) return;
  current = null;
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useFilterSheetRequest(): FilterSheetRequest | null {
  return useSyncExternalStore(subscribe, () => current, () => current);
}
