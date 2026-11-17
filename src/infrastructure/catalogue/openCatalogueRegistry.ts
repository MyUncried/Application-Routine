import { openExpoDatabase } from "@/infrastructure/database/ExpoDatabase";

import { CATALOGUE_REGISTRY_DATABASE_NAME, SqliteCatalogueRegistry } from "./SqliteCatalogueRegistry";

/**
 * Ouvre le registre d'installation dans sa base distincte (`kodjo-catalogue-registry.db`),
 * avec les PRAGMA standard de l'application. Raccordement à l'écran : CA-4.
 */
export async function openCatalogueRegistry(): Promise<{
  registry: SqliteCatalogueRegistry;
  closeAsync(): Promise<void>;
}> {
  const opened = await openExpoDatabase(CATALOGUE_REGISTRY_DATABASE_NAME);
  return { registry: await SqliteCatalogueRegistry.open(opened.database), closeAsync: opened.closeAsync };
}
