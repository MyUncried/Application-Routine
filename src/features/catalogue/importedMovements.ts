/**
 * A-2 (11/11/2026) — garde de lecture seule des Mouvements importés, raccordée au service du
 * Catalogue des Mouvements (`ActivityDefinitionService.movementCatalogue`).
 *
 * La source est le registre des catalogues (`kodjo-catalogue-registry.db`) : un Mouvement rattaché à
 * une fiche installée est importé. Aucune heuristique sur le nom. Le registre est ouvert une seule
 * fois, à la première vérification, et partagé par les écrans des Bibliothèques.
 *
 * Sous Jest, aucun module natif : `jest.setup.js` remplace ce module par une garde inactive ; les
 * tests de la garde injectent un registre réel (`ImportedMovementCheck`).
 */
import type { ImportedMovementCheck } from "@/features/activities/MovementCatalogueService";
import { openCatalogueRegistry } from "@/infrastructure/catalogue/openCatalogueRegistry";
import type { SqliteCatalogueRegistry } from "@/infrastructure/catalogue/SqliteCatalogueRegistry";

let shared: Promise<SqliteCatalogueRegistry> | null = null;

/** Registre partagé de l'application, ouvert à la première demande. */
export function sharedCatalogueRegistry(): Promise<SqliteCatalogueRegistry> {
  if (shared === null) {
    shared = openCatalogueRegistry().then((opened) => opened.registry);
    // Échec d'ouverture : nouvelle tentative à la prochaine demande, l'erreur est propagée.
    shared.catch(() => {
      shared = null;
    });
  }
  return shared;
}

export const isImportedMovement: ImportedMovementCheck = async (movementId) =>
  (await sharedCatalogueRegistry()).isInstalledMovement(movementId);
