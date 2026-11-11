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

/**
 * Provenance affichée sur la fiche d'un Mouvement importé (Figma 12119:25304 : « Fitness · rév. 2 ») :
 * Bibliothèque installée qui référence la fiche et révision active. `null` pour un Mouvement personnel.
 */
export async function importedMovementLabel(movementId: string): Promise<string | null> {
  const registry = await sharedCatalogueRegistry();
  const record = await registry.installedSheetOfMovement(movementId);
  if (!record) return null;
  const library = (await registry.installedLibraries()).find((entry) =>
    entry.library.members.some((member) => member.catalogueId === record.catalogueId && member.sheetId === record.sheetId));
  return (library ? library.library.title + " · " : "") + "rév. " + record.revision;
}

/** Informations d'une fiche importée (recette du 11/11/2026, a1-lecture-seule). */
export type ImportedMovementInfo = {
  /** Bibliothèques installées qui contiennent la fiche. */
  readonly libraries: readonly string[];
  readonly catalogueId: string;
  readonly sheetId: string;
  readonly revision: string;
  readonly installedAt: string;
  readonly updatedAt: string;
  readonly origin: string;
  readonly upstream: { readonly catalogueId: string; readonly sheetId: string; readonly revision: string } | null;
  readonly owner: string | null;
  readonly author: string | null;
  readonly publisher: string | null;
  readonly editors: readonly string[];
  readonly rightsHolder: string | null;
  readonly license: string | null;
};

const actor = (ref: { readonly kind: string; readonly id: string } | null): string | null => (ref ? ref.id : null);

/**
 * Recette du 11/11/2026 (Hermann) : « A l'appui, affichage des informations complémentaires de la fiche (source,
 * propriétaire, auteur, éditeur, version, etc.) ». Lecture du registre ; `null` pour un Mouvement personnel.
 */
export async function importedMovementInfo(movementId: string): Promise<ImportedMovementInfo | null> {
  const registry = await sharedCatalogueRegistry();
  const record = await registry.installedSheetOfMovement(movementId);
  if (!record) return null;
  const containing = (await registry.installedLibraries()).filter((entry) =>
    entry.library.members.some((member) => member.catalogueId === record.catalogueId && member.sheetId === record.sheetId));
  const provenance = record.sheet.provenance;
  return {
    libraries: containing.map((entry) => entry.library.title),
    catalogueId: record.catalogueId,
    sheetId: record.sheetId,
    revision: record.revision,
    installedAt: record.installedAt,
    updatedAt: record.updatedAt,
    origin: provenance.origin,
    upstream: provenance.upstream,
    owner: actor(provenance.owner),
    author: actor(provenance.author),
    publisher: actor(provenance.publisher),
    editors: containing.flatMap((entry) => (entry.library.editor ? [entry.library.editor.id] : [])),
    rightsHolder: actor(provenance.rightsHolder),
    license: provenance.license,
  };
}
