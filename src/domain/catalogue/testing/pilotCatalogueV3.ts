/**
 * Jeu d'essai des tests (jamais importé par l'application) : catalogue pilote versionné (format 2.0.0, non
 * modifié) exprimé au format 3.0.0 **sans reprise de la position de départ** — champs abandonnés retirés,
 * révisions et étapes inchangées. Il reproduit un catalogue déjà au format courant, pour les tests dont le
 * sujet n'est pas la conversion (rattachement des 60, Bibliothèques, conflits…). La conversion réelle du
 * fichier 2.0.0 (reprise et révision 2) est couverte par ses propres tests.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  MOVEMENT_CATALOGUE_FORMAT_VERSION,
  normalizeStoredLibrary,
  normalizeStoredSheet,
  type CatalogueLibrary,
  type CatalogueSheet,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";

export const PILOT_CATALOGUE_FILE = join(__dirname, "../../../../catalogue/catalogues/kodjo-pilote-60.catalogue.json");

/** Fichier pilote brut tel que versionné (format 2.0.0). */
export function pilotCatalogueV2Raw(): Record<string, unknown> {
  return JSON.parse(readFileSync(PILOT_CATALOGUE_FILE, "utf8")) as Record<string, unknown>;
}

/** Pilote au format 3.0.0, sans reprise de la position de départ (voir l'en-tête). */
export function pilotCatalogueV3(): MovementCatalogueFile {
  const raw = pilotCatalogueV2Raw();
  const { manager: _manager, publisher: _publisher, publicationAllowed: _allowed, ...catalogue } = raw.catalogue as Record<string, unknown>;
  void _manager;
  void _publisher;
  void _allowed;
  return {
    ...raw,
    formatVersion: MOVEMENT_CATALOGUE_FORMAT_VERSION,
    catalogue,
    libraries: (raw.libraries as CatalogueLibrary[]).map(normalizeStoredLibrary),
    sheets: (raw.sheets as CatalogueSheet[]).map(normalizeStoredSheet),
  } as unknown as MovementCatalogueFile;
}
