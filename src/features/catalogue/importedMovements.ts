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
import {
  classificationFilterOptions,
  movementClassifications,
  sheetClassification,
  type ClassificationFilterAxis,
  type ClassificationValue,
  type MovementClassification,
} from "@/domain/catalogue/catalogueFilters";
import type { MovementLicense } from "@/domain/catalogue/MovementEditorialProvenance";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import type { ImportedMovementCheck } from "@/features/activities/MovementCatalogueService";
import { openCatalogueRegistry } from "@/infrastructure/catalogue/openCatalogueRegistry";
import type { SqliteCatalogueRegistry } from "@/infrastructure/catalogue/SqliteCatalogueRegistry";
import { strings } from "@/shared/i18n";

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
  return (library ? library.library.title + " · " : "") + fillTemplate(strings.libraries.importedMovement.revision, { revision: record.revision });
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
  /** `null` = le propriétaire (MOUV-ADM n° 14). */
  readonly rightsHolder: string | null;
  /** `null` = non renseignée (MOUV-ADM n° 15). */
  readonly license: MovementLicense | null;
  /** Informations destinées à l'utilisateur ; les notes internes de l'administration n'en font jamais partie. */
  readonly equipment: string | null;
  readonly safetyNotes: string | null;
  readonly classification: MovementClassification;
  /*
   * [Retirés le 18/11/2026 (format 3.0.0, MOUV-ADM n° 13 et 21) : `publisher` (diffuseur) et `editors`
   * (éditeurs des Bibliothèques), qui alimentaient la ligne « Éditeur ».]
   */
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
  const references = (await registry.installedReferences()).get(record.catalogueId);
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
    rightsHolder: actor(provenance.rightsHolder),
    license: provenance.license,
    equipment: record.sheet.content.equipment,
    safetyNotes: record.sheet.content.safetyNotes,
    classification: sheetClassification(record.catalogueId, record.sheet, references),
  };
}

/**
 * Classifications de tous les Mouvements importés et valeurs proposables par axe, pour les filtres validés
 * (MOUV-UX-20261117). Aucune interface : le parcours de filtre sera défini dans Figma.
 */
export async function importedMovementClassifications(): Promise<{
  readonly byMovement: ReadonlyMap<string, MovementClassification>;
  readonly options: Readonly<Record<ClassificationFilterAxis, readonly ClassificationValue[]>>;
}> {
  const registry = await sharedCatalogueRegistry();
  const byMovement = movementClassifications(await registry.allInstalledSheets(), await registry.installedReferences());
  return { byMovement, options: classificationFilterOptions(byMovement) };
}

/**
 * Bibliothèques personnelles (décision de Hermann du 12/11/2026 : « avant de le supprimer on l'archive, donc il faut
 * l'annoncer pendant l'archive ») : noms des Bibliothèques personnelles qui contiennent ce Mouvement.
 */
export async function personalLibraryTitlesContaining(movementId: string): Promise<readonly string[]> {
  const registry = await sharedCatalogueRegistry();
  return (await registry.personalLibraries())
    .filter((library) => library.movementIds.includes(movementId))
    .map((library) => library.title);
}
