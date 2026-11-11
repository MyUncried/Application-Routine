/**
 * Format de fichier catalogue autonome `KODJO_MOVEMENT_CATALOGUE` v2 (P0, 11/11/2026), qui relit
 * la v1 (CA-1, 10/11/2026) par conversion déterministe.
 *
 * v2 : auteur unique `provenance.author` (MOUV-D1), Bibliothèques `libraries[]` distinctes du fichier
 * (A-1 du 11/11/2026 : une Bibliothèque est une collection logique de références vers des fiches, sans
 * copie ; une fiche peut appartenir à plusieurs Bibliothèques), refus de l'origine `LOCAL_DERIVED` (A-2).
 * Le fichier n'est qu'une unité de stockage et de transport ; `catalogue.id` est l'espace d'identité
 * des fiches qu'il définit : identité d'une fiche = `(catalogue.id, sheetId)`.
 *
 * Le fichier est la source éditable du catalogue : il contient la fiche éditoriale complète
 * (contenu, classifications, sources, validation, provenance, médias, révisions) et ne dépend
 * d'aucune donnée embarquée dans le code. Spécification : docs/KODJO-Format-catalogue-mouvements-v1.md.
 *
 * Identités distinctes (spécification provenance du 06/11) : `catalogue.id`, `sheetId` (fiche,
 * unique dans son catalogue) et `Movement.id` local, attribué à l'installation. Les identifiants
 * locaux déjà utilisés par d'anciens importeurs (`pilot:*`) sont des données de rapprochement
 * (`install.knownLocalMovementIds`), jamais l'identité de la fiche.
 *
 * Module pur : aucune lecture de fichier, aucune écriture SQLite, aucune dépendance au moteur.
 */
import { encodeInstructionSteps } from "@/domain/activities/instructionSteps";
import { normalizeMovementName, validateMovement, type Movement } from "@/domain/activities/Movement";
import {
  validateMovementEditorialProvenance,
  type EditorialActorRef,
  type EditorialReviewStatus,
  type EditorialVisibility,
  type MovementEditorialOrigin,
  type MovementUpstream,
} from "@/domain/catalogue/MovementEditorialProvenance";

export const MOVEMENT_CATALOGUE_FORMAT = "KODJO_MOVEMENT_CATALOGUE";
export const MOVEMENT_CATALOGUE_FORMAT_VERSION = "2.0.0";
/** Versions relues : la v1 est convertie en v2 à la lecture (aucune écriture v1). */
export const MOVEMENT_CATALOGUE_READABLE_VERSIONS = ["1.0.0", "2.0.0"] as const;

/** Limites reprises de l'administration Web (`tools/catalogue-admin/static-ovh`). */
export const CATALOGUE_MAX_MEDIA_PER_SHEET = 30;
export const CATALOGUE_MAX_EMBEDDED_PHOTO_CHARS = 580000;
export const CATALOGUE_MEDIA_RIGHTS = ["UNVERIFIED", "PERMISSION_CONFIRMED", "RESTRICTED"] as const;

export type CatalogueReferenceEntry = {
  readonly id: string;
  readonly label: string;
  /** Typologie éventuelle (ex. `FUNCTIONAL_DEFICIT`, `MUSCLE_GROUP`). */
  readonly kind: string | null;
  /** Statut éditorial de la valeur (ex. `PROPOSED`). */
  readonly status: string | null;
};

/** Référentiels du catalogue ; l'ordre de chaque liste est l'ordre d'affichage. */
export type CatalogueReferences = {
  readonly categories: readonly CatalogueReferenceEntry[];
  readonly bodyZones: readonly CatalogueReferenceEntry[];
  readonly specialties: readonly CatalogueReferenceEntry[];
  readonly gesturalFamilies: readonly CatalogueReferenceEntry[];
  readonly clinicalProblems: readonly CatalogueReferenceEntry[];
  readonly anatomicalTargets: readonly CatalogueReferenceEntry[];
};

/** Média éditorial : modèle de l'administration Web, conservé intégralement. */
export type CatalogueMedia = {
  readonly id: string;
  readonly kind: "PHOTO" | "VIDEO";
  readonly storage: "EMBEDDED" | "REMOTE";
  readonly url: string;
  readonly fileName: string;
  readonly caption: string;
  readonly alt: string;
  readonly sourceUrl: string | null;
  readonly attribution: string;
  readonly license: string;
  readonly rightsStatus: (typeof CATALOGUE_MEDIA_RIGHTS)[number];
};

export type CatalogueGlossaryEntry = {
  readonly id: string;
  readonly term: string;
  readonly definition: string;
  readonly synonyms: readonly string[];
  readonly relatedSheetIds: readonly string[];
};

export type CatalogueSheetRevision = {
  readonly revision: string;
  /** Date ISO 8601 (AAAA-MM-JJ ou horodatage complet). */
  readonly date: string;
  readonly author: EditorialActorRef | null;
  readonly summary: string;
};

/**
 * Provenance de la fiche : modèle `MovementEditorialProvenance` sans `sheetId` (porté par la fiche),
 * `revision` (portée par la fiche) ni `localMovementId` (propre à une installation).
 * `owner` peut rester inconnu (`null`) : aucune attribution par déduction.
 */
export type CatalogueSheetProvenance = {
  readonly gestureId: string | null;
  readonly origin: MovementEditorialOrigin;
  readonly upstream: MovementUpstream | null;
  readonly owner: EditorialActorRef | null;
  /** Auteur unique (MOUV-D1) ; `null` = inconnu. v1 `authors[]` convertie : 0 → null, 1 → auteur, 2+ → refus. */
  readonly author: EditorialActorRef | null;
  readonly publisher: EditorialActorRef | null;
  readonly rightsHolder: EditorialActorRef | null;
  readonly license: string | null;
  readonly reviewStatus: EditorialReviewStatus;
  readonly visibility: EditorialVisibility;
};

/** Contenu descriptif ; les étapes structurées et leur ordre en font partie. */
export type CatalogueSheetContent = {
  readonly name: string;
  /** Ordonnés (ordre d'affichage et de stockage des alias). */
  readonly aliases: readonly string[];
  readonly startingPosition: string | null;
  readonly equipment: string | null;
  /** Ordonnées : une étape par entrée. */
  readonly steps: readonly string[];
  readonly safetyNotes: string | null;
  /** Notes éditoriales libres (administration). */
  readonly notes: string;
};

export type CatalogueClassificationReview = {
  readonly status: string;
  readonly needsReview: boolean;
  readonly flags: readonly string[];
  readonly note: string | null;
};

export type CatalogueSheetClassification = {
  readonly categoryId: string | null;
  /** Ensembles : l'ordre n'a pas de signification. */
  readonly bodyZoneIds: readonly string[];
  readonly specialtyIds: readonly string[];
  readonly gesturalFamilyIds: readonly string[];
  readonly clinicalProblemIds: readonly string[];
  readonly anatomicalTargetIds: readonly string[];
  /** Fondement des valeurs (ex. préclassement non approuvé). */
  readonly basis: string;
  readonly review: CatalogueClassificationReview | null;
  /** Classification de la source d'origine, conservée sans remplacement. */
  readonly original: Readonly<Record<string, string>>;
  /** Spécialités proposées par la source d'origine (libellés libres). */
  readonly originalProposedSpecialties: readonly string[];
};

export type CatalogueSheetSources = {
  /**
   * Référence documentaire originale de la fiche (sourceId, section, URL, conditions d'usage).
   * Distincte de la source d'import (`provenance.upstream`) et des informations de propriété
   * intellectuelle (`provenance.owner`, `rightsHolder`, `license`, `validation.rights`, `licensing`).
   */
  readonly documentary: {
    readonly sourceId: string | null;
    readonly section: string | null;
    readonly url: string | null;
    readonly usageStatement: string | null;
  } | null;
  /** Contexte de prescription d'origine (dose, fréquence), non normatif. */
  readonly prescriptionContext: Readonly<Record<string, string>>;
};

export type CatalogueSheetValidation = {
  readonly classification: string;
  readonly clinical: string;
  readonly rights: string;
  readonly corpusReview: string | null;
  readonly licensing: string | null;
  readonly clinicalValidation: string | null;
  readonly publicationAllowed: boolean;
};

export type CatalogueSheet = {
  readonly sheetId: string;
  readonly revision: string;
  /** Du plus ancien au plus récent ; la dernière entrée porte `revision`. */
  readonly history: readonly CatalogueSheetRevision[];
  readonly provenance: CatalogueSheetProvenance;
  readonly content: CatalogueSheetContent;
  readonly classification: CatalogueSheetClassification;
  readonly sources: CatalogueSheetSources;
  readonly validation: CatalogueSheetValidation;
  /** Ordonnés. */
  readonly media: readonly CatalogueMedia[];
  readonly install: {
    readonly knownLocalMovementIds: readonly string[];
    /**
     * Sous-ensemble de `knownLocalMovementIds` : Mouvements **personnels** envoyés par un téléphone (A2) puis
     * ajoutés ou rapprochés par l'administration. Leur rattachement n'est pas appliqué tant que la règle de
     * transition n'est pas arbitrée (A-2 du 11/11/2026). Facultatif ; absent = aucun.
     */
    readonly personalMovementIds?: readonly string[];
  };
};

/** Référence d'une fiche par son identité éditoriale ; jamais une copie (A-1). */
export type CatalogueLibraryMember = {
  /** Espace d'identité de la fiche : ce fichier (`catalogue.id`) ou une autre source. */
  readonly catalogueId: string;
  readonly sheetId: string;
};

/**
 * Bibliothèque (A-1, BIB-03/04) : collection logique identifiée par `(catalogue.id, libraryId)`,
 * composée de références ordonnées vers des fiches ; aucune restriction sur leur nombre, leur
 * nature ni leur source. Sa révision est indépendante de celles des fiches.
 */
export type CatalogueLibrary = {
  readonly libraryId: string;
  readonly title: string;
  readonly description: string | null;
  readonly revision: string;
  /** Du plus ancien au plus récent ; vide admis, sinon la dernière entrée porte `revision`. */
  readonly history: readonly CatalogueSheetRevision[];
  /** Éditeur de la Bibliothèque (composition) ; `null` = inconnu. */
  readonly editor: EditorialActorRef | null;
  /** Propriétaire ; `null` = inconnu, alors privée et non publiable. */
  readonly owner: EditorialActorRef | null;
  readonly visibility: EditorialVisibility;
  readonly publicationAllowed: boolean;
  /** Ordonnés (ordre d'affichage) ; sans doublon. */
  readonly members: readonly CatalogueLibraryMember[];
};

export type MovementCatalogueFile = {
  readonly format: typeof MOVEMENT_CATALOGUE_FORMAT;
  readonly formatVersion: typeof MOVEMENT_CATALOGUE_FORMAT_VERSION;
  readonly catalogue: {
    readonly id: string;
    readonly title: string;
    readonly revision: string;
    /** Propriétaire du catalogue ; `null` = inconnu déclaré (aucune identité fictive). */
    readonly owner: EditorialActorRef | null;
    /**
     * Gestionnaire administratif du fichier (tenue, révisions, diffusion interne).
     * Ni propriétaire ni ayant droit des fiches : n'emporte aucun droit sur leur contenu.
     */
    readonly manager: EditorialActorRef | null;
    readonly publisher: EditorialActorRef | null;
    /** `true` interdit tant que `owner` est inconnu. */
    readonly publicationAllowed: boolean;
    readonly notes: readonly string[];
  };
  readonly references: CatalogueReferences;
  readonly glossary: readonly CatalogueGlossaryEntry[];
  readonly libraries: readonly CatalogueLibrary[];
  readonly sheets: readonly CatalogueSheet[];
};

export type CatalogueIssueCode =
  | "REQUIRED"
  | "INVALID"
  | "UNRECOGNIZED"
  | "DUPLICATE"
  | "INCONSISTENT"
  | "UNKNOWN_REFERENCE"
  | "MOVEMENT_CONTRACT";

export type CatalogueIssue = { readonly path: string; readonly code: CatalogueIssueCode; readonly detail?: string };

/** Signalements non bloquants (spécification provenance : inconnu ≠ erreur ; homonymie A1 ouverte). */
export type CatalogueWarning = {
  readonly path: string;
  readonly code: "UNKNOWN_OWNER" | "DUPLICATE_NAME" | "EXTERNAL_MEMBER" | "CONVERTED_FROM_V1";
};

export type CatalogueParseResult =
  | {
      readonly ok: true;
      /** Toujours au format courant (v2), y compris pour un fichier v1 relu. */
      readonly file: MovementCatalogueFile;
      readonly warnings: readonly CatalogueWarning[];
      readonly sourceFormatVersion: (typeof MOVEMENT_CATALOGUE_READABLE_VERSIONS)[number];
    }
  | { readonly ok: false; readonly issues: readonly CatalogueIssue[] };

const REFERENCE_AXES = [
  "categories",
  "bodyZones",
  "specialties",
  "gesturalFamilies",
  "clinicalProblems",
  "anatomicalTargets",
] as const;

/** Champ de classification → référentiel du catalogue. */
const CLASSIFICATION_AXES = [
  ["bodyZoneIds", "bodyZones"],
  ["specialtyIds", "specialties"],
  ["gesturalFamilyIds", "gesturalFamilies"],
  ["clinicalProblemIds", "clinicalProblems"],
  ["anatomicalTargetIds", "anatomicalTargets"],
] as const;

type Raw = Record<string, unknown>;

const isObject = (value: unknown): value is Raw =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const present = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const isString = (value: unknown): value is string => typeof value === "string";
const isStringOrNull = (value: unknown): value is string | null => value === null || typeof value === "string";
const isStrings = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);
const isStringRecord = (value: unknown): value is Record<string, string> =>
  isObject(value) && Object.values(value).every(isString);
const isSecureUrl = (value: unknown): boolean => {
  if (!present(value)) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Valide la structure complète d'un fichier catalogue. Ne lit aucune base locale : la
 * correspondance des Catégories et Zones avec celles du téléphone relève du chargement (CA-3).
 */
export function parseMovementCatalogueFile(input: unknown): CatalogueParseResult {
  const issues: CatalogueIssue[] = [];
  const warnings: CatalogueWarning[] = [];
  const issue = (path: string, code: CatalogueIssueCode, detail?: string) =>
    issues.push(detail === undefined ? { path, code } : { path, code, detail });

  if (!isObject(input)) return { ok: false, issues: [{ path: "", code: "INVALID" }] };
  let raw: Raw = input;
  if (raw.format !== MOVEMENT_CATALOGUE_FORMAT) issue("format", "UNRECOGNIZED");
  const sourceFormatVersion = raw.formatVersion;
  if (!(MOVEMENT_CATALOGUE_READABLE_VERSIONS as readonly unknown[]).includes(sourceFormatVersion)) {
    issue("formatVersion", "UNRECOGNIZED");
  }
  if (issues.length > 0) return { ok: false, issues };
  if (sourceFormatVersion === "1.0.0") {
    raw = upgradeV1(raw, issue);
    warnings.push({ path: "formatVersion", code: "CONVERTED_FROM_V1" });
    if (issues.length > 0) return { ok: false, issues };
  } else if (!Array.isArray(raw.libraries)) {
    issue("libraries", "REQUIRED");
  }

  validateCatalogueHeader(raw.catalogue, issue, warnings);
  const referenceIds = validateReferences(raw.references, issue);
  const sheets = Array.isArray(raw.sheets) ? raw.sheets : null;
  if (!sheets) issue("sheets", "REQUIRED");

  const sheetIds = new Set<string>();
  const localIds = new Set<string>();
  const names = new Map<string, string>();
  (sheets ?? []).forEach((sheet, index) => {
    const path = "sheets[" + index + "]";
    if (!isObject(sheet)) {
      issue(path, "INVALID");
      return;
    }
    validateSheet(sheet, path, referenceIds, issue, warnings);
    if (present(sheet.sheetId)) {
      if (sheetIds.has(sheet.sheetId)) issue(path + ".sheetId", "DUPLICATE", sheet.sheetId);
      sheetIds.add(sheet.sheetId);
    }
    const known = isObject(sheet.install) ? sheet.install.knownLocalMovementIds : undefined;
    if (isStrings(known)) {
      for (const id of known) {
        if (localIds.has(id)) issue(path + ".install.knownLocalMovementIds", "DUPLICATE", id);
        localIds.add(id);
      }
    }
    const name = isObject(sheet.content) ? sheet.content.name : undefined;
    if (present(name)) {
      const key = normalizeMovementName(name);
      if (names.has(key)) warnings.push({ path: path + ".content.name", code: "DUPLICATE_NAME" });
      else names.set(key, path);
    }
  });

  validateGlossary(raw.glossary, sheetIds, issue);
  validateLibraries(raw, sheetIds, issue, warnings);

  if (issues.length > 0) return { ok: false, issues };
  return {
    ok: true,
    file: raw as unknown as MovementCatalogueFile,
    warnings,
    sourceFormatVersion: sourceFormatVersion as (typeof MOVEMENT_CATALOGUE_READABLE_VERSIONS)[number],
  };
}

/**
 * Conversion déterministe v1 → v2, sans perte : `authors[]` → `author` (0 → null, 1 → l'auteur ;
 * plusieurs → refus explicite, jamais de choix arbitraire), et Bibliothèque implicite reprenant
 * l'en-tête et toutes les fiches dans l'ordre du fichier. Les autres propriétés sont recopiées.
 */
function upgradeV1(raw: Raw, issue: IssueSink): Raw {
  const sheets = Array.isArray(raw.sheets) ? raw.sheets : null;
  const upgradedSheets = sheets?.map((sheet, index) => {
    if (!isObject(sheet) || !isObject(sheet.provenance)) return sheet;
    const { authors, ...provenance } = sheet.provenance;
    let author: unknown = null;
    if (!Array.isArray(authors)) {
      issue("sheets[" + index + "].provenance.authors", "INVALID");
    } else if (authors.length > 1) {
      issue("sheets[" + index + "].provenance.authors", "INCONSISTENT", "MULTIPLE_AUTHORS");
    } else if (authors.length === 1) {
      author = authors[0];
    }
    return { ...sheet, provenance: { ...provenance, author } };
  });
  const header = isObject(raw.catalogue) ? raw.catalogue : null;
  // Bibliothèque implicite : identifiant dérivé valide, privée et non publiable — la conversion n'accorde
  // aucune diffusion (revue du 11/11 : un en-tête v1 publiable ne doit pas faire refuser le fichier).
  const libraries = header === null ? [] : [{
    libraryId: implicitLibraryId(header.id),
    title: header.title,
    description: null,
    revision: header.revision,
    history: [],
    editor: header.publisher ?? null,
    owner: header.owner ?? null,
    visibility: "PRIVATE",
    publicationAllowed: false,
    members: (sheets ?? []).filter(isObject).filter((sheet) => present(sheet.sheetId))
      .map((sheet) => ({ catalogueId: header.id, sheetId: sheet.sheetId })),
  }];
  const { sheets: _sheets, ...rest } = raw;
  void _sheets;
  return {
    ...rest,
    formatVersion: MOVEMENT_CATALOGUE_FORMAT_VERSION,
    libraries,
    ...(upgradedSheets === undefined ? {} : { sheets: upgradedSheets }),
  };
}

const LIBRARY_ID = /^[a-z0-9][a-z0-9.-]{1,63}$/;

/** Identifiant de Bibliothèque dérivé d'un identifiant de catalogue v1 quelconque (déterministe). */
function implicitLibraryId(catalogueId: unknown): string {
  const slug = (typeof catalogueId === "string" ? catalogueId : "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-").replace(/^[^a-z0-9]+/, "").slice(0, 64).replace(/[-.]+$/, "");
  return LIBRARY_ID.test(slug) ? slug : "bibliotheque";
}
const VISIBILITIES: readonly unknown[] = ["PRIVATE", "UNLISTED", "PUBLIC"];

function validateLibraries(raw: Raw, sheetIds: ReadonlySet<string>, issue: IssueSink, warnings: CatalogueWarning[]): void {
  const libraries = raw.libraries;
  if (!Array.isArray(libraries)) return; // signalé à l'entrée
  const catalogueId = isObject(raw.catalogue) ? raw.catalogue.id : undefined;
  const publishable = new Map<string, boolean>();
  if (Array.isArray(raw.sheets)) {
    for (const sheet of raw.sheets) {
      if (isObject(sheet) && present(sheet.sheetId) && isObject(sheet.validation)) {
        publishable.set(sheet.sheetId, sheet.validation.publicationAllowed === true);
      }
    }
  }
  const ids = new Set<string>();
  libraries.forEach((library, index) => {
    const path = "libraries[" + index + "]";
    if (!isObject(library)) {
      issue(path, "INVALID");
      return;
    }
    if (!isString(library.libraryId) || !LIBRARY_ID.test(library.libraryId)) {
      issue(path + ".libraryId", "INVALID");
    } else {
      if (ids.has(library.libraryId)) issue(path + ".libraryId", "DUPLICATE", library.libraryId);
      ids.add(library.libraryId);
    }
    if (!present(library.title)) issue(path + ".title", "REQUIRED");
    if (!isStringOrNull(library.description)) issue(path + ".description", "INVALID");
    if (!present(library.revision)) issue(path + ".revision", "REQUIRED");
    if (!Array.isArray(library.history)) issue(path + ".history", "REQUIRED");
    else if (library.history.length > 0) validateHistory(library.history, library.revision, path, issue);
    for (const field of ["editor", "owner"] as const) {
      if (library[field] === undefined) issue(path + "." + field, "REQUIRED");
      else validateActor(library[field], path + "." + field, issue);
    }
    if (!VISIBILITIES.includes(library.visibility)) issue(path + ".visibility", "UNRECOGNIZED");
    if (typeof library.publicationAllowed !== "boolean") issue(path + ".publicationAllowed", "REQUIRED");
    if (library.owner === null) {
      warnings.push({ path: path + ".owner", code: "UNKNOWN_OWNER" });
      if (library.publicationAllowed === true) issue(path + ".publicationAllowed", "INCONSISTENT", "UNKNOWN_OWNER");
      if (library.visibility !== "PRIVATE") issue(path + ".visibility", "INCONSISTENT", "UNKNOWN_OWNER");
    }
    if (!Array.isArray(library.members)) {
      issue(path + ".members", "REQUIRED");
      return;
    }
    const seen = new Set<string>();
    library.members.forEach((member, memberIndex) => {
      const at = path + ".members[" + memberIndex + "]";
      if (!isObject(member) || !present(member.catalogueId) || !present(member.sheetId)) {
        issue(at, "INVALID");
        return;
      }
      const key = member.catalogueId + "/" + member.sheetId;
      if (seen.has(key)) issue(at, "DUPLICATE", member.sheetId);
      seen.add(key);
      if (member.catalogueId !== catalogueId) {
        // Fiche d'une autre source : référencée sans copie ; résolue à l'installation si présente.
        warnings.push({ path: at, code: "EXTERNAL_MEMBER" });
        return;
      }
      if (!sheetIds.has(member.sheetId)) {
        issue(at + ".sheetId", "UNKNOWN_REFERENCE", member.sheetId);
      } else if (library.publicationAllowed === true && publishable.get(member.sheetId) !== true) {
        // Aucune diffusion d'une fiche dont les droits ne sont pas établis.
        issue(at, "INCONSISTENT", "MEMBER_NOT_PUBLISHABLE");
      }
    });
  });
}

/**
 * Fiche installée lue dans un stockage antérieur au format v2 (`provenance.authors[]`) :
 * conversion identique à la lecture d’un fichier v1 (0 → null, 1 → l’auteur). Une liste de
 * plusieurs auteurs est laissée intacte (aucun choix arbitraire) : son empreinte diffère alors et
 * le chargement la signale comme révision incohérente.
 */
export function normalizeStoredSheet(sheet: CatalogueSheet): CatalogueSheet {
  const provenance = sheet.provenance as unknown as Raw;
  if (!isObject(provenance) || !("authors" in provenance)) return sheet;
  const { authors, ...rest } = provenance;
  if (!Array.isArray(authors) || authors.length > 1) return sheet;
  return { ...sheet, provenance: { ...rest, author: authors[0] ?? null } as unknown as CatalogueSheetProvenance };
}

/**
 * Sérialisation de référence du format courant (administration, export, Wi-Fi) : JSON indenté,
 * ordre des clés conservé, fin de ligne finale. `parseMovementCatalogueFile` relit le résultat
 * à l'identique (aller-retour sans perte).
 */
export function serializeMovementCatalogueFile(file: MovementCatalogueFile): string {
  return JSON.stringify(file, null, 2) + "\n";
}

type IssueSink = (path: string, code: CatalogueIssueCode, detail?: string) => void;

function validateActor(value: unknown, path: string, issue: IssueSink): void {
  if (value === null) return;
  if (!isObject(value) || !["LOCAL_USER", "PERSON", "ORGANIZATION", "PLATFORM"].includes(value.kind as string)) {
    issue(path, "UNRECOGNIZED");
  } else if (!present(value.id)) {
    issue(path + ".id", "REQUIRED");
  }
}

function validateCatalogueHeader(value: unknown, issue: IssueSink, warnings: CatalogueWarning[]): void {
  if (!isObject(value)) {
    issue("catalogue", "REQUIRED");
    return;
  }
  for (const field of ["id", "title", "revision"] as const) {
    if (!present(value[field])) issue("catalogue." + field, "REQUIRED");
  }
  for (const field of ["owner", "manager", "publisher"] as const) {
    if (value[field] === undefined) issue("catalogue." + field, "REQUIRED");
    else validateActor(value[field], "catalogue." + field, issue);
  }
  if (value.owner === null) warnings.push({ path: "catalogue.owner", code: "UNKNOWN_OWNER" });
  if (typeof value.publicationAllowed !== "boolean") issue("catalogue.publicationAllowed", "REQUIRED");
  if (value.owner === null && value.publicationAllowed === true) {
    issue("catalogue.publicationAllowed", "INCONSISTENT", "UNKNOWN_OWNER");
  }
  if (!isStrings(value.notes)) issue("catalogue.notes", "INVALID");
}

function validateReferences(value: unknown, issue: IssueSink): Map<string, Set<string>> {
  const ids = new Map<string, Set<string>>();
  if (!isObject(value)) {
    issue("references", "REQUIRED");
    return ids;
  }
  for (const axis of REFERENCE_AXES) {
    const entries = value[axis];
    const seen = new Set<string>();
    ids.set(axis, seen);
    if (!Array.isArray(entries)) {
      issue("references." + axis, "REQUIRED");
      continue;
    }
    entries.forEach((entry, index) => {
      const path = "references." + axis + "[" + index + "]";
      if (!isObject(entry) || !present(entry.id) || !present(entry.label) ||
          !isStringOrNull(entry.kind) || !isStringOrNull(entry.status)) {
        issue(path, "INVALID");
        return;
      }
      if (seen.has(entry.id)) issue(path + ".id", "DUPLICATE", entry.id);
      seen.add(entry.id);
    });
  }
  return ids;
}

function validateSheet(
  sheet: Raw,
  path: string,
  references: Map<string, Set<string>>,
  issue: IssueSink,
  warnings: CatalogueWarning[],
): void {
  if (!present(sheet.sheetId)) issue(path + ".sheetId", "REQUIRED");
  if (!present(sheet.revision)) issue(path + ".revision", "REQUIRED");
  validateHistory(sheet.history, sheet.revision, path, issue);

  // Provenance : validateur existant, avec la fiche, la révision et sans installation locale.
  const provenance = sheet.provenance;
  if (!isObject(provenance)) {
    issue(path + ".provenance", "REQUIRED");
  } else {
    if (provenance.owner === null) warnings.push({ path: path + ".provenance.owner", code: "UNKNOWN_OWNER" });
    // A-2 (11/11/2026) : aucune copie ni dérivation locale d'une fiche ; l'origine historique est refusée.
    if (provenance.origin === "LOCAL_DERIVED") issue(path + ".provenance.origin", "INCONSISTENT", "LOCAL_DERIVED");
    const record = {
      ...(provenance as object),
      sheetId: sheet.sheetId,
      revision: sheet.revision,
      localMovementId: null,
    } as unknown as Parameters<typeof validateMovementEditorialProvenance>[0];
    for (const found of validateMovementEditorialProvenance(record)) {
      if (found.field === "sheetId" || found.field === "revision") continue; // signalés ci-dessus
      issue(path + ".provenance." + found.field, found.code);
    }
    // Propriétaire inconnu : admis en privé, jamais publiable (décision du 10/11/2026).
    if (provenance.owner === null && isObject(sheet.validation) && sheet.validation.publicationAllowed === true) {
      issue(path + ".validation.publicationAllowed", "INCONSISTENT", "UNKNOWN_OWNER");
    }
  }

  const content = sheet.content;
  if (!isObject(content)) {
    issue(path + ".content", "REQUIRED");
  } else {
    if (!present(content.name)) issue(path + ".content.name", "REQUIRED");
    if (!isStrings(content.aliases)) issue(path + ".content.aliases", "INVALID");
    if (!isStrings(content.steps)) issue(path + ".content.steps", "INVALID");
    for (const field of ["startingPosition", "equipment", "safetyNotes"] as const) {
      if (!isStringOrNull(content[field])) issue(path + ".content." + field, "INVALID");
    }
    if (!isString(content.notes)) issue(path + ".content.notes", "INVALID");
  }

  const classification = sheet.classification;
  if (!isObject(classification)) {
    issue(path + ".classification", "REQUIRED");
  } else {
    if (!isStringOrNull(classification.categoryId)) {
      issue(path + ".classification.categoryId", "INVALID");
    } else if (classification.categoryId !== null && !references.get("categories")?.has(classification.categoryId)) {
      issue(path + ".classification.categoryId", "UNKNOWN_REFERENCE", classification.categoryId);
    }
    for (const [field, axis] of CLASSIFICATION_AXES) {
      const values = classification[field];
      if (!isStrings(values)) {
        issue(path + ".classification." + field, "INVALID");
        continue;
      }
      if (new Set(values).size !== values.length) issue(path + ".classification." + field, "DUPLICATE");
      for (const id of values) {
        if (!references.get(axis)?.has(id)) issue(path + ".classification." + field, "UNKNOWN_REFERENCE", id);
      }
    }
    if (!present(classification.basis)) issue(path + ".classification.basis", "REQUIRED");
    const review = classification.review;
    if (review !== null && (!isObject(review) || !present(review.status) || typeof review.needsReview !== "boolean" ||
        !isStrings(review.flags) || !isStringOrNull(review.note))) {
      issue(path + ".classification.review", "INVALID");
    }
    if (!isStringRecord(classification.original)) issue(path + ".classification.original", "INVALID");
    if (!isStrings(classification.originalProposedSpecialties)) {
      issue(path + ".classification.originalProposedSpecialties", "INVALID");
    }
  }

  const sources = sheet.sources;
  if (!isObject(sources)) {
    issue(path + ".sources", "REQUIRED");
  } else {
    const documentary = sources.documentary;
    if (documentary !== null && (!isObject(documentary) ||
        !["sourceId", "section", "url", "usageStatement"].every((field) => isStringOrNull(documentary[field])))) {
      issue(path + ".sources.documentary", "INVALID");
    }
    if (!isStringRecord(sources.prescriptionContext)) issue(path + ".sources.prescriptionContext", "INVALID");
  }

  const validation = sheet.validation;
  if (!isObject(validation)) {
    issue(path + ".validation", "REQUIRED");
  } else {
    for (const field of ["classification", "clinical", "rights"] as const) {
      if (!present(validation[field])) issue(path + ".validation." + field, "REQUIRED");
    }
    for (const field of ["corpusReview", "licensing", "clinicalValidation"] as const) {
      if (!isStringOrNull(validation[field])) issue(path + ".validation." + field, "INVALID");
    }
    if (typeof validation.publicationAllowed !== "boolean") issue(path + ".validation.publicationAllowed", "REQUIRED");
  }

  validateMediaList(sheet.media, path + ".media", issue);

  const install = sheet.install;
  if (!isObject(install) || !isStrings(install.knownLocalMovementIds) ||
      !install.knownLocalMovementIds.every(present) ||
      new Set(install.knownLocalMovementIds).size !== install.knownLocalMovementIds.length) {
    issue(path + ".install.knownLocalMovementIds", "INVALID");
  } else if (install.personalMovementIds !== undefined) {
    const personal = install.personalMovementIds;
    if (!isStrings(personal) || new Set(personal).size !== personal.length ||
        !personal.every((id) => (install.knownLocalMovementIds as string[]).includes(id))) {
      issue(path + ".install.personalMovementIds", "INVALID");
    }
  }

  // Projection Mouvement : contrat `Movement` actuel (nom, étapes encodées, Catégorie, Zones).
  if (isObject(content) && isObject(classification) && present(content.name) && isStrings(content.aliases) &&
      isStrings(content.steps) && isStringOrNull(classification.categoryId) && isStrings(classification.bodyZoneIds)) {
    const projected = validateMovement(projectSheetToMovement(sheet as unknown as CatalogueSheet, "projection"));
    if (!projected.ok) {
      issue(path, "MOVEMENT_CONTRACT", projected.violations.map((violation) => violation.field).join(", "));
    }
  }
}

function validateHistory(value: unknown, revision: unknown, path: string, issue: IssueSink): void {
  if (!Array.isArray(value) || value.length === 0) {
    issue(path + ".history", "REQUIRED");
    return;
  }
  const seen = new Set<string>();
  value.forEach((entry, index) => {
    const at = path + ".history[" + index + "]";
    if (!isObject(entry) || !present(entry.revision) || !present(entry.date) || !isString(entry.summary)) {
      issue(at, "INVALID");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}/.test(entry.date)) issue(at + ".date", "INVALID");
    validateActor(entry.author, at + ".author", issue);
    if (seen.has(entry.revision)) issue(at + ".revision", "DUPLICATE", entry.revision);
    seen.add(entry.revision);
  });
  const last = value[value.length - 1];
  if (isObject(last) && present(revision) && last.revision !== revision) issue(path + ".history", "INCONSISTENT");
}

/** Règles de l'administration Web (`mediaError`), reprises à l'identique. */
function validateMediaList(value: unknown, path: string, issue: IssueSink): void {
  if (!Array.isArray(value) || value.length > CATALOGUE_MAX_MEDIA_PER_SHEET) {
    issue(path, "INVALID");
    return;
  }
  const ids = new Set<string>();
  value.forEach((media, index) => {
    const at = path + "[" + index + "]";
    const problem = mediaProblem(media);
    if (problem) {
      issue(at, "INVALID", problem);
      return;
    }
    const id = (media as CatalogueMedia).id;
    if (ids.has(id)) issue(at + ".id", "DUPLICATE", id);
    ids.add(id);
  });
}

function mediaProblem(media: unknown): string | null {
  if (!isObject(media)) return "média invalide";
  if (!isString(media.id) || !/^media-[a-z0-9-]{6,70}$/i.test(media.id)) return "identifiant média invalide";
  if (media.kind !== "PHOTO" && media.kind !== "VIDEO") return "type de média inconnu";
  if (media.storage !== "EMBEDDED" && media.storage !== "REMOTE") return "origine technique inconnue";
  if (media.storage === "EMBEDDED") {
    if (media.kind !== "PHOTO" || !isString(media.url) || media.url.length > CATALOGUE_MAX_EMBEDDED_PHOTO_CHARS ||
        !/^data:image\/(?:jpeg|webp|png);base64,[A-Za-z0-9+/=]+$/.test(media.url)) {
      return "photo intégrée invalide ou trop volumineuse";
    }
  } else if (!isSecureUrl(media.url)) {
    return "lien média HTTPS invalide";
  }
  if (media.sourceUrl !== null && !isSecureUrl(media.sourceUrl)) return "URL de provenance invalide";
  if (media.storage === "REMOTE" && !media.sourceUrl) return "source obligatoire pour un média distant";
  for (const [field, max] of [["caption", 180], ["alt", 180], ["attribution", 160], ["license", 160]] as const) {
    const text = media[field];
    if (!isString(text) || text.length > max) return field + " absent ou trop long";
  }
  if (!isString(media.fileName) || media.fileName.length > 180) return "nom de fichier invalide";
  if (media.kind === "PHOTO" && !(media.alt as string).trim()) return "description accessible obligatoire pour une photo";
  if (!(CATALOGUE_MEDIA_RIGHTS as readonly unknown[]).includes(media.rightsStatus)) return "statut des droits invalide";
  if (media.rightsStatus === "PERMISSION_CONFIRMED" &&
      (!(media.license as string).trim() || !(media.attribution as string).trim())) {
    return "attribution et licence requises pour des droits confirmés";
  }
  return null;
}

function validateGlossary(value: unknown, sheetIds: ReadonlySet<string>, issue: IssueSink): void {
  if (!Array.isArray(value)) {
    issue("glossary", "REQUIRED");
    return;
  }
  const ids = new Set<string>();
  value.forEach((entry, index) => {
    const path = "glossary[" + index + "]";
    if (!isObject(entry) || !present(entry.id) || !present(entry.term) || !isString(entry.definition) ||
        !isStrings(entry.synonyms) || !isStrings(entry.relatedSheetIds)) {
      issue(path, "INVALID");
      return;
    }
    if (ids.has(entry.id)) issue(path + ".id", "DUPLICATE", entry.id);
    ids.add(entry.id);
    for (const sheetId of entry.relatedSheetIds) {
      if (!sheetIds.has(sheetId)) issue(path + ".relatedSheetIds", "UNKNOWN_REFERENCE", sheetId);
    }
  });
}

/**
 * Projection d'une fiche vers le contrat `Movement` actuel, identique à l'importeur pilote :
 * étapes encodées dans `description` (codec unique), alias ordonnés, Catégorie, Zones ;
 * médias non transportés, structure par défaut. L'identifiant local est fourni par l'installation.
 */
export function projectSheetToMovement(sheet: CatalogueSheet, movementId: string): Movement {
  return {
    id: movementId,
    name: sheet.content.name,
    aliases: [...sheet.content.aliases],
    description: encodeInstructionSteps(sheet.content.steps),
    categoryId: sheet.classification.categoryId as string,
    bodyZoneIds: [...sheet.classification.bodyZoneIds],
    media: [],
    phases: [],
    nextPhaseId: 1,
    levelGroup: null,
  };
}

/** Champs dont l'ordre n'a pas de signification fonctionnelle (ensembles). */
const SET_FIELDS = new Set([
  "bodyZoneIds",
  "specialtyIds",
  "gesturalFamilyIds",
  "clinicalProblemIds",
  "anatomicalTargetIds",
]);

/**
 * Empreinte canonique de la fiche éditoriale complète, hors `revision`, `history` et `install`.
 * Sensible à toute propriété éditoriale (y compris médias et métadonnées) et à l'ordre des
 * étapes, alias et médias ; insensible à l'ordre des clés et des ensembles (Zones, taxonomie).
 */
export function sheetFingerprint(sheet: CatalogueSheet): string {
  const editorial = {
    sheetId: sheet.sheetId,
    provenance: sheet.provenance,
    content: sheet.content,
    classification: sheet.classification,
    sources: sheet.sources,
    validation: sheet.validation,
    media: sheet.media,
  };
  return canonicalJson(editorial, null);
}

/** JSON canonique (clés triées, ensembles triés) : base commune de l'empreinte et des comparaisons de chargement. */
export function canonicalJson(value: unknown, key: string | null): string {
  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalJson(item, null));
    if (key !== null && SET_FIELDS.has(key)) items.sort();
    return "[" + items.join(",") + "]";
  }
  if (isObject(value)) {
    return "{" + Object.keys(value)
      .filter((name) => value[name] !== undefined)
      .sort()
      .map((name) => JSON.stringify(name) + ":" + canonicalJson(value[name], name))
      .join(",") + "}";
  }
  return JSON.stringify(value);
}
