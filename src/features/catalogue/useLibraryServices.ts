import * as Crypto from "expo-crypto";
import { useContext, useEffect, useMemo, useState } from "react";

import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { CatalogueLoadService } from "@/features/catalogue/CatalogueLoadService";
import { LibraryService } from "@/features/catalogue/LibraryService";
import { sharedCatalogueRegistry } from "@/features/catalogue/importedMovements";
import { freshLocalMovementReader } from "@/features/catalogue/readLocalMovements";
import type { SqliteCatalogueRegistry } from "@/infrastructure/catalogue/SqliteCatalogueRegistry";

export type LibraryServices = {
  readonly libraries: LibraryService;
  readonly load: CatalogueLoadService;
  readonly registry: SqliteCatalogueRegistry;
};

/**
 * A1 — Services des Bibliothèques sur le registre partagé de l'application et le service du
 * Catalogue des Mouvements (mêmes validations que les écrans). `null` pendant l'ouverture ;
 * `error` si le registre ne peut pas être ouvert.
 */
export function useLibraryServices(): { readonly services: LibraryServices | null; readonly error: string | null } {
  // Sans service de Mouvements (doublures d’écrans antérieures), les Bibliothèques restent indisponibles.
  const activityDefinitionService = useContext(ActivityDefinitionServiceContext);
  const [registry, setRegistry] = useState<SqliteCatalogueRegistry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    sharedCatalogueRegistry().then(
      (opened) => { if (!cancelled) setRegistry(opened); },
      (reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason)); },
    );
    return () => { cancelled = true; };
  }, []);

  const services = useMemo(() => {
    if (!activityDefinitionService) return null;
    const movements = activityDefinitionService.movementCatalogue;
    const reader = activityDefinitionService.freshMovementReader;
    if (!registry || !movements || !reader) return null;
    const load = new CatalogueLoadService({
      registry,
      movements,
      readLocalMovements: freshLocalMovementReader(reader),
      listReferentials: async () => ({
        categoryIds: new Set((await activityDefinitionService.listCategories()).map((category) => category.id)),
        bodyZoneIds: new Set((await activityDefinitionService.listBodyZones()).map((zone) => zone.id)),
      }),
      newMovementId: Crypto.randomUUID,
      families: movements,
    });
    return { load, libraries: new LibraryService({ registry, load }), registry };
  }, [registry, activityDefinitionService]);

  return { services, error };
}
