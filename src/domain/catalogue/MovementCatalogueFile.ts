/**
 * Format de fichier catalogue autonome `KODJO_MOVEMENT_CATALOGUE` v3 (18/11/2026), qui relit la v2
 * (P0, 11/11/2026) et la v1 (CA-1, 10/11/2026) par conversion déterministe.
 *
 * v3 — mise en conformité avec l'inventaire MOUV-ADM-20261117 (décisions de Hermann du 17/11/2026) :
 * - champs abandonnés retirés du modèle et des échanges : position de départ (reprise au début des
 *   étapes), fondement, revue et classification d'origine, spécialités proposées à l'origine, section
 *   `sources`, identifiant de geste, diffuseur (fiche et catalogue), statut éditorial, visibilité de la
 *   fiche, texte alternatif des photos, éditeur de Bibliothèque, gestionnaire du catalogue, cases
 *   `publicationAllowed` de Bibliothèque et de catalogue ;
 * - phases de la fiche source (ordre, libellé, durée par défaut facultative), transmises à l'installation ;
 * - licence de la fiche facultative : `null` (« Non renseignée ») ou conditions connues (nom et lien, ou texte) ;
 * - ayant droit facultatif : `null` = le propriétaire (aucune double saisie) ;
 * - publication : autorisation système portée par la révision de fiche (`validation.publicationAllowed`) ;
 *   Bibliothèque et catalogue n'en donnent qu'une synthèse calculée (`libraryPublicationSynthesis`,
 *   `cataloguePublicationSynthesis`), jamais saisie.
 *
 * v2 : auteur unique `provenance.author` (MOUV-D1), Bibliothèques `libraries[]` distinctes du fichier
 * (A-1 du 11/11/2026 : une Bibliothèque est une collection logique de références vers des fiches, sans
 * copie ; une fiche peut appartenir à plusieurs Bibliothèques), refus de l'origine `LOCAL_DERIVED` (A-2).
 * Le fichier n'est qu'une unité de stockage et de transport ; `catalogue.id` est l'espace d'identité
 * des fiches qu'il définit : identité d'une fiche = `(catalogue.id, sheetId)`.
 *
 * Identités distinctes (spécification provenance du 06/11) : `catalogue.id`, `sheetId` (fiche,
 * unique dans son catalogue) et `Movement.id` local, attribué à l'installation. Les identifiants
 * locaux déjà utilisés par d'anciens importeurs (`pilot:*`) sont des données de rapprochement
 * (`install.knownLocalMovementIds`), jamais l'identité de la fiche.
 *
 * Spécification : docs/KODJO-Format-catalogue-mouvements-v1.md (§ 13 pour la v3).
 * Module pur : aucune lecture de fichier, aucune écriture SQLite, aucune dépendance au moteur.
 */
import { encodeInstructionSteps } from "@/domain/activities/instructionSteps";
import {
  movementPhasesProblem,
  normalizeMovementName,
  validateMovement,
  type Movement,
  type MovementPhase,
} from "@/domain/activities/Movement";
import {
  validateMovementEditorialProvenance,
  type EditorialActorRef,
  type EditorialVisibility,
  type MovementEditorialOrigin,
  type MovementLicense,
  type MovementUpstream,
} from "@/domain/catalogue/MovementEditorialProvenance";

export const MOVEMENT_CATALOGUE_FORMAT = "KODJO_MOVEMENT_CATALOGUE";
export const MOVEMENT_CATALOGUE_FORMAT_VERSION = "3.0.0";
/** Versions relues : v1 et v2 sont converties en v3 à la lecture (aucune écriture v1 ni v2). */
export const MOVEMENT_CATALOGUE_READABLE_VERSIONS = ["1.0.0", "2.0.0", "3.0.0"] as const;

/** Limites reprises de l'administration Web (`tools/catalogue-admin/static-ovh`). */
export const CATALOGUE_MAX_MEDIA_PER_SHEET = 30;
export const CATALOGUE_MAX_EMBEDDED_PHOTO_CHARS = 580000;
export const CATALOGUE_MEDIA_RIGHTS = ["UNVERIFIED", "PERMISSION_CONFIRMED", "RESTRICTED"] as const;

/** Résumé de la révision créée par la conversion quand la position de départ rejoint les étapes. */
export const STARTING_POSITION_MERGE_SUMMARY = "Format 3.0.0 : position de départ reprise au début des étapes";

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

/**
 * Média éditorial : modèle de l'administration Web. v3 : sans texte alternatif saisi (MOUV-ADM, décision
 * sur le texte alternatif) ; le nom du mouvement sert de libellé d'accessibilité.
 */
export type CatalogueMedia = {
  readonly id: string;
  readonly kind: "PHOTO" | "VIDEO";
  readonly storage: "EMBEDDED" | "REMOTE";
  readonly url: string;
  readonly fileName: string;
  readonly caption: string;
  readonly sourceUrl: string | null;
  readonly attribution: string;
  readonly license: string;
  readonly rightsStatus: (typeof CATALOGUE_MEDIA_RIGHTS)[number];
  /**
   * Vue retenue d'une photo (marquage des photos, D-600, Hermann, 24-25/11/2026 ; DSF Carte de séance § 1) : rectangle
   * en pourcentage de l'image (x, y, largeur, hauteur), proposé à la publication par l'administration Web puis vérifié
   * par la personne qui publie. Absent : l'image est retenue entière. L'application l'applique tel quel, sans calcul.
   */
  readonly view?: CatalogueMediaView | null;
};

/** Rectangle de la vue retenue, en pourcentage de l'image (0 à 100). */
export type CatalogueMediaView = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** Rectangle de vue valide : nombres finis, largeur et hauteur positives, entièrement dans l'image. */
export function isValidCatalogueMediaView(view: unknown): view is CatalogueMediaView {
  if (typeof view !== "object" || view === null || Array.isArray(view)) return false;
  const { x, y, width, height } = view as Record<string, unknown>;
  const n = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
  if (!n(x) || !n(y) || !n(width) || !n(height)) return false;
  const EPSILON = 1e-6;
  return x >= 0 && y >= 0 && width > 0 && height > 0 && x + width <= 100 + EPSILON && y + height <= 100 + EPSILON;
}

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
  /** Gérée automatiquement (création, import). */
  readonly origin: MovementEditorialOrigin;
  /** Catalogue, fiche et révision source ; renseigné automatiquement à l'import. */
  readonly upstream: MovementUpstream | null;
  readonly owner: EditorialActorRef | null;
  /** Auteur unique (MOUV-D1) ; `null` = inconnu. v1 `authors[]` convertie : 0 → null, 1 → auteur, 2+ → refus. */
  readonly author: EditorialActorRef | null;
  /** Ayant droit tiers ; `null` = le propriétaire (MOUV-ADM n° 14, sans double saisie). */
  readonly rightsHolder: EditorialActorRef | null;
  /** `null` = « Non renseignée » ; sinon conditions connues (MOUV-ADM n° 15). */
  readonly license: MovementLicense | null;
};

/** Contenu descriptif ; les étapes structurées et leur ordre en font partie. */
export type CatalogueSheetContent = {
  readonly name: string;
  /** Ordonnés (ordre d'affichage et de stockage des alias). */
  readonly aliases: readonly string[];
  /** Facultatif. */
  readonly equipment: string | null;
  /** Ordonnées : une étape par entrée ; la position de départ éventuelle est la première. */
  readonly steps: readonly string[];
  /** Précautions générales, facultatives ; les indications propres à une étape restent dans l'étape. */
  readonly safetyNotes: string | null;
  /** Notes éditoriales libres, internes à l'administration : jamais présentées au destinataire. */
  readonly notes: string;
};

export type CatalogueSheetClassification = {
  readonly categoryId: string | null;
  /** Ensembles : l'ordre n'a pas de signification. */
  readonly bodyZoneIds: readonly string[];
  readonly specialtyIds: readonly string[];
  readonly gesturalFamilyIds: readonly string[];
  readonly clinicalProblemIds: readonly string[];
  readonly anatomicalTargetIds: readonly string[];
};

export type CatalogueSheetValidation = {
  readonly classification: string;
  readonly clinical: string;
  readonly rights: string;
  readonly corpusReview: string | null;
  readonly licensing: string | null;
  readonly clinicalValidation: string | null;
  /**
   * Autorisation système de publication portée par la révision de fiche (MOUV-PART) : résultat des
   * contrôles KODJO, jamais une case cochée par l'auteur. Le contrôle central est hors de ce lot.
   */
  readonly publicationAllowed: boolean;
};

/**
 * Phase de la fiche source (MOUV-UX-20261117) : même contrat que `MovementPhase` (identité entière ≥ 1,
 * libellé de 1 à 20 points de code, durée par défaut facultative 1..3535 s ; au plus 6 phases).
 * `durationSeconds: null` = aucune durée par défaut.
 */
export type CataloguePhase = {
  readonly id: number;
  readonly label: string;
  readonly durationSeconds: number | null;
};

/**
 * Famille de niveaux d'une fiche (décision de Hermann du 11/11/2026, extension de MFN-05 / D-439) :
 * même forme que `Movement.levelGroup`. `groupId` est propre au catalogue (espace d'identité
 * `catalogue.id`) ; `sortKey` croissante = niveau croissant (rang 1 = premier). Rang et nombre de
 * niveaux sont dérivés. Distincte des familles gestuelles (`classification.gesturalFamilyIds`).
 */
export type CatalogueLevelGroup = {
  readonly groupId: string;
  readonly sortKey: number;
};

export type CatalogueSheet = {
  readonly sheetId: string;
  readonly revision: string;
  /** Du plus ancien au plus récent ; la dernière entrée porte `revision`. */
  readonly history: readonly CatalogueSheetRevision[];
  readonly provenance: CatalogueSheetProvenance;
  readonly content: CatalogueSheetContent;
  readonly classification: CatalogueSheetClassification;
  readonly validation: CatalogueSheetValidation;
  /** Ordonnés. */
  readonly media: readonly CatalogueMedia[];
  /** Ordonnées ; `[]` = sans phases. */
  readonly phases: readonly CataloguePhase[];
  /** Famille de niveaux ; facultative (absente ou `null` = aucune famille, anciens fichiers compris). */
  readonly levelGroup?: CatalogueLevelGroup | null;
  /** Données techniques d'installation (hors fiche d'administration, MOUV-ADM n° 19). */
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
 * v3 : ni éditeur distinct ni case de publication (synthèse calculée, `libraryPublicationSynthesis`).
 */
export type CatalogueLibrary = {
  readonly libraryId: string;
  readonly title: string;
  readonly description: string | null;
  readonly revision: string;
  /** Du plus ancien au plus récent ; vide admis, sinon la dernière entrée porte `revision`. */
  readonly history: readonly CatalogueSheetRevision[];
  /** Propriétaire ; `null` = inconnu, alors privée. */
  readonly owner: EditorialActorRef | null;
  /** Personnelle (`PRIVATE`), partagée (`UNLISTED`), publique (`PUBLIC`). */
  readonly visibility: EditorialVisibility;
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
    /** Propriétaire du catalogue (compte qui le gère) ; `null` = inconnu déclaré (aucune identité fictive). */
    readonly owner: EditorialActorRef | null;
    /** Notes facultatives, internes à l'administration (MOUV-ADM n° 28). */
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
  readonly code:
    | "UNKNOWN_OWNER"
    | "DUPLICATE_NAME"
    | "EXTERNAL_MEMBER"
    | "CONVERTED_FROM_V1"
    | "CONVERTED_FROM_V2"
    /** Conversion v3 : position de départ reprise au début des étapes (nouvelle révision de la fiche). */
    | "STARTING_POSITION_MERGED";
};

export type CatalogueParseResult =
  | {
      readonly ok: true;
      /** Toujours au format courant (v3), y compris pour un fichier v1 ou v2 relu. */
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
  if (sourceFormatVersion !== MOVEMENT_CATALOGUE_FORMAT_VERSION) {
    if (sourceFormatVersion === "2.0.0") warnings.push({ path: "formatVersion", code: "CONVERTED_FROM_V2" });
    raw = upgradeToV3(raw, warnings);
  }

  validateCatalogueHeader(raw.catalogue, issue, warnings);
  const referenceIds = validateReferences(raw.references, issue);
  const sheets = Array.isArray(raw.sheets) ? raw.sheets : null;
  if (!sheets) issue("sheets", "REQUIRED");

  const sheetIds = new Set<string>();
  const localIds = new Set<string>();
  const levelKeys = new Set<string>();
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
    // Deux fiches d'une même famille ne partagent pas une clé de tri (ordre ambigu).
    const level = sheet.levelGroup;
    if (isObject(level) && present(level.groupId) && typeof level.sortKey === "number") {
      const levelKey = level.groupId + "\u0000" + level.sortKey;
      if (levelKeys.has(levelKey)) issue(path + ".levelGroup.sortKey", "DUPLICATE", level.groupId);
      levelKeys.add(levelKey);
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
  // Bibliothèque implicite : identifiant dérivé valide, privée — la conversion n'accorde aucune diffusion.
  const libraries = header === null ? [] : [{
    libraryId: implicitLibraryId(header.id),
    title: header.title,
    description: null,
    revision: header.revision,
    history: [],
    owner: header.owner ?? null,
    visibility: "PRIVATE",
    members: (sheets ?? []).filter(isObject).filter((sheet) => present(sheet.sheetId))
      .map((sheet) => ({ catalogueId: header.id, sheetId: sheet.sheetId })),
  }];
  const { sheets: _sheets, ...rest } = raw;
  void _sheets;
  return {
    ...rest,
    formatVersion: "2.0.0",
    libraries,
    ...(upgradedSheets === undefined ? {} : { sheets: upgradedSheets }),
  };
}

/**
 * Conversion déterministe v2 → v3 (MOUV-ADM-20261117). Champs abandonnés retirés ; licence texte →
 * conditions connues en texte ; ayant droit égal au propriétaire → `null` ; phases absentes → `[]`.
 * Position de départ non vide et absente des étapes : reprise en première étape, avec une nouvelle
 * révision de la fiche (règle `nextRevision`) datée de sa dernière révision, auteur inconnu, résumé
 * `STARTING_POSITION_MERGE_SUMMARY` — les installations la reçoivent comme une mise à jour ordinaire.
 * Une conversion répétée du même fichier donne le même résultat.
 */
function upgradeToV3(raw: Raw, warnings: CatalogueWarning[]): Raw {
  const header = isObject(raw.catalogue) ? stripHeader(raw.catalogue) : raw.catalogue;
  const libraries = Array.isArray(raw.libraries) ? raw.libraries.map((library) => {
    if (!isObject(library)) return library;
    const { editor: _editor, publicationAllowed: _allowed, ...rest } = library;
    void _editor;
    void _allowed;
    return rest;
  }) : raw.libraries;
  const sheets = Array.isArray(raw.sheets) ? raw.sheets.map((sheet, index) => {
    if (!isObject(sheet)) return sheet;
    const converted = convertSheetToV3(sheet, true);
    if (converted.merged) warnings.push({ path: "sheets[" + index + "].content.steps", code: "STARTING_POSITION_MERGED" });
    return converted.sheet;
  }) : raw.sheets;
  return { ...raw, formatVersion: MOVEMENT_CATALOGUE_FORMAT_VERSION, catalogue: header, libraries, sheets };
}

function stripHeader(header: Raw): Raw {
  const { manager: _manager, publisher: _publisher, publicationAllowed: _allowed, ...rest } = header;
  void _manager;
  void _publisher;
  void _allowed;
  return rest;
}

/** Comparaison des textes de la position de départ et des étapes : casse, espaces et point final ignorés. */
function comparableStep(text: string): string {
  return text.trim().replace(/\s+/g, " ").replace(/\.+$/, "").trim().toLocaleLowerCase("fr");
}

const sameActor = (a: unknown, b: unknown): boolean =>
  isObject(a) && isObject(b) && a.kind === b.kind && a.id === b.id;

/**
 * Conversion d'une fiche v2 en v3. `mergeStartingPosition` : reprise de la position de départ dans les
 * étapes (lecture d'un fichier) ; sans elle (instantané installé sur un téléphone), la position est
 * seulement retirée, sans révision : la révision convertie du fichier source arrive alors comme mise à jour.
 */
function convertSheetToV3(sheet: Raw, mergeStartingPosition: boolean): { readonly sheet: Raw; readonly merged: boolean } {
  const { sources: _sources, ...rest } = sheet;
  void _sources;
  const next: Raw = { ...rest };
  let merged = false;

  if (isObject(sheet.provenance)) {
    const {
      gestureId: _gesture, publisher: _publisher, reviewStatus: _review, visibility: _visibility, ...provenance
    } = sheet.provenance;
    void _gesture;
    void _publisher;
    void _review;
    void _visibility;
    if (typeof provenance.license === "string") {
      provenance.license = present(provenance.license) ? { name: null, url: null, text: provenance.license.trim() } : null;
    }
    if (sameActor(provenance.rightsHolder, provenance.owner)) provenance.rightsHolder = null;
    next.provenance = provenance;
  }

  if (isObject(sheet.content)) {
    const { startingPosition, ...content } = sheet.content;
    if (mergeStartingPosition && present(startingPosition) && isStrings(content.steps)) {
      const wanted = comparableStep(startingPosition);
      if (!content.steps.some((step) => comparableStep(step) === wanted)) {
        content.steps = [startingPosition.trim(), ...content.steps];
        merged = true;
      }
    }
    next.content = content;
  }

  if (isObject(sheet.classification)) {
    const {
      basis: _basis, review: _review, original: _original, originalProposedSpecialties: _proposed, ...classification
    } = sheet.classification;
    void _basis;
    void _review;
    void _original;
    void _proposed;
    next.classification = classification;
  }

  if (Array.isArray(sheet.media)) {
    next.media = sheet.media.map((media) => {
      if (!isObject(media)) return media;
      const { alt: _alt, ...kept } = media;
      void _alt;
      return kept;
    });
  }

  if (next.phases === undefined) next.phases = [];

  if (merged && present(sheet.revision) && Array.isArray(sheet.history)) {
    const history = sheet.history as unknown[];
    const last = history[history.length - 1];
    const revision = nextRevision(sheet.revision, history.filter(isObject).map((entry) => String(entry.revision)));
    next.revision = revision;
    next.history = [...history, {
      revision,
      date: isObject(last) && present(last.date) ? last.date : "1970-01-01",
      author: null,
      summary: STARTING_POSITION_MERGE_SUMMARY,
    }];
  }
  // Ordre de référence des propriétés (sérialisation stable).
  const { install, levelGroup, ...head } = next;
  return { sheet: { ...head, ...(levelGroup === undefined ? {} : { levelGroup }), install }, merged };
}

const INTEGER = /^\d+$/;
const DOTTED_SUFFIX = /^(.*\.)(\d+)$/;

/** Incrément d'une chaîne d'entiers décimaux sans perte de précision. */
function incrementDigits(digits: string): string {
  const chars = digits.split("");
  let index = chars.length - 1;
  while (index >= 0) {
    if (chars[index] !== "9") {
      chars[index] = String(Number(chars[index]) + 1);
      return chars.join("").replace(/^0+(?=\d)/, "");
    }
    chars[index] = "0";
    index -= 1;
  }
  return ("1" + chars.join("")).replace(/^0+(?=\d)/, "");
}

/**
 * Révision suivante, déterministe :
 * - révision entière (`"3"`) → entier suivant (`"4"`) ;
 * - révision terminée par `.<entier>` (`"2026-10-27.1"`, `"1.0.0"`) → ce suffixe incrémenté ;
 * - toute autre révision (`"2026-10-27"`) → suffixe `.1` ajouté (`"2026-10-27.1"`).
 * Le résultat n'est jamais une révision déjà utilisée (`used`) : la règle est réappliquée
 * jusqu'à obtenir une valeur libre.
 */
export function nextRevision(previous: string, used: Iterable<string> = []): string {
  const taken = new Set(used);
  taken.add(previous);
  const step = (value: string): string => {
    if (INTEGER.test(value)) return incrementDigits(value);
    const dotted = DOTTED_SUFFIX.exec(value);
    if (dotted) return dotted[1] + incrementDigits(dotted[2]);
    return value + ".1";
  };
  let candidate = step(previous);
  while (taken.has(candidate)) candidate = step(candidate);
  return candidate;
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
    if (library.owner === undefined) issue(path + ".owner", "REQUIRED");
    else validateActor(library.owner, path + ".owner", issue);
    if (!VISIBILITIES.includes(library.visibility)) issue(path + ".visibility", "UNRECOGNIZED");
    if (library.owner === null) {
      warnings.push({ path: path + ".owner", code: "UNKNOWN_OWNER" });
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
      if (!sheetIds.has(member.sheetId)) issue(at + ".sheetId", "UNKNOWN_REFERENCE", member.sheetId);
    });
  });
}

/** Autorisation système d'une révision de fiche : propriétaire identifié et contrôles KODJO favorables. */
export function sheetPublicationAllowed(sheet: CatalogueSheet): boolean {
  return sheet.provenance.owner !== null && sheet.validation.publicationAllowed === true;
}

/**
 * Synthèse de publication d'une Bibliothèque (MOUV-ADM n° 23, MOUV-PART) : calculée, jamais saisie.
 * Vraie seulement si le propriétaire est identifié, la Bibliothèque non vide et chacune de ses fiches
 * autorisée (une fiche d'un autre catalogue, non vérifiable ici, la rend fausse).
 */
export function libraryPublicationSynthesis(file: MovementCatalogueFile, library: CatalogueLibrary): boolean {
  if (library.owner === null || library.members.length === 0) return false;
  const sheets = new Map(file.sheets.map((sheet) => [sheet.sheetId, sheet]));
  return library.members.every((member) => {
    const sheet = member.catalogueId === file.catalogue.id ? sheets.get(member.sheetId) : undefined;
    return sheet !== undefined && sheetPublicationAllowed(sheet);
  });
}

/** Synthèse de publication du catalogue (MOUV-ADM n° 27) : propriétaire identifié et toutes ses fiches autorisées. */
export function cataloguePublicationSynthesis(file: MovementCatalogueFile): boolean {
  return file.catalogue.owner !== null && file.sheets.length > 0 && file.sheets.every(sheetPublicationAllowed);
}

/**
 * Fiche installée sur un téléphone (instantané du registre), lue dans un stockage antérieur (v1
 * `provenance.authors[]`, v2) : conversion au format courant **sans reprise de la position de départ ni
 * nouvelle révision** (la révision convertie du fichier source arrive comme mise à jour), et notes internes
 * retirées (le destinataire ne les conserve pas, MOUV-ADM n° 5). Une liste de plusieurs auteurs est laissée
 * intacte (aucun choix arbitraire) : son empreinte diffère alors et le chargement la signale comme révision
 * incohérente. Sans effet sur une fiche déjà au format courant et sans notes.
 */
export function normalizeStoredSheet(sheet: CatalogueSheet): CatalogueSheet {
  let raw = sheet as unknown as Raw;
  const provenance = raw.provenance;
  if (isObject(provenance) && "authors" in provenance) {
    const { authors, ...rest } = provenance;
    if (Array.isArray(authors) && authors.length <= 1) raw = { ...raw, provenance: { ...rest, author: authors[0] ?? null } };
  }
  if (isLegacySheet(raw)) raw = convertSheetToV3(raw, false).sheet;
  if (isObject(raw.content) && present(raw.content.notes)) raw = { ...raw, content: { ...raw.content, notes: "" } };
  return raw === (sheet as unknown) ? sheet : (raw as unknown as CatalogueSheet);
}

/**
 * Fichier tel que le reçoit un destinataire : notes internes de l'administration retirées (notes de fiche
 * et notes du catalogue, MOUV-ADM n° 5 et 28). Aucune autre propriété n'est modifiée ; révisions inchangées.
 */
export function withoutInternalNotes(file: MovementCatalogueFile): MovementCatalogueFile {
  const noted = file.catalogue.notes.length > 0 || file.sheets.some((sheet) => sheet.content.notes !== "");
  if (!noted) return file;
  return {
    ...file,
    catalogue: { ...file.catalogue, notes: [] },
    sheets: file.sheets.map((sheet) => (sheet.content.notes === "" ? sheet : { ...sheet, content: { ...sheet.content, notes: "" } })),
  };
}

/** Fiche portant encore une propriété antérieure au format v3. */
function isLegacySheet(sheet: Raw): boolean {
  const provenance = isObject(sheet.provenance) ? sheet.provenance : {};
  const content = isObject(sheet.content) ? sheet.content : {};
  const classification = isObject(sheet.classification) ? sheet.classification : {};
  return "sources" in sheet || sheet.phases === undefined || typeof provenance.license === "string" ||
    ["gestureId", "publisher", "reviewStatus", "visibility"].some((field) => field in provenance) ||
    "startingPosition" in content ||
    ["basis", "review", "original", "originalProposedSpecialties"].some((field) => field in classification) ||
    (Array.isArray(sheet.media) && sheet.media.some((media) => isObject(media) && "alt" in media)) ||
    (sheet.provenance !== undefined && sameActor(provenance.rightsHolder, provenance.owner));
}

/**
 * Fiche telle qu'elle était juste avant la reprise de sa position de départ par la conversion 3.0.0 (dernière
 * révision = révision de conversion) : révision précédente, première étape retirée. `null` si la dernière
 * révision n'est pas cette conversion. Sert à reconnaître, sans registre, un Mouvement installé par un ancien
 * importeur depuis la version d'avant (la mise à jour lui est alors proposée comme à une fiche installée).
 */
export function sheetBeforeStartingPositionMerge(sheet: CatalogueSheet): CatalogueSheet | null {
  const last = sheet.history[sheet.history.length - 1];
  const previous = sheet.history[sheet.history.length - 2];
  if (!last || !previous || last.summary !== STARTING_POSITION_MERGE_SUMMARY || last.author !== null || sheet.content.steps.length === 0) {
    return null;
  }
  return {
    ...sheet,
    revision: previous.revision,
    history: sheet.history.slice(0, -1),
    content: { ...sheet.content, steps: sheet.content.steps.slice(1) },
  };
}

/** Bibliothèque installée lue dans un stockage antérieur : éditeur et case de publication retirés. */
export function normalizeStoredLibrary(library: CatalogueLibrary): CatalogueLibrary {
  const raw = library as unknown as Raw;
  if (!("editor" in raw) && !("publicationAllowed" in raw)) return library;
  const { editor: _editor, publicationAllowed: _allowed, ...rest } = raw;
  void _editor;
  void _allowed;
  return rest as unknown as CatalogueLibrary;
}

/**
 * Sérialisation de référence du format courant (administration, export, Wi-Fi) : JSON indenté,
 * ordre des clés conservé, fin de ligne finale. `parseMovementCatalogueFile` relit le résultat
 * à l'identique (aller-retour sans perte).
 */
export function serializeMovementCatalogueFile(file: MovementCatalogueFile): string {
  return JSON.stringify(file, null, 2) + "\n";
}

/** Fiche retirée d'une diffusion parce qu'un de ses médias n'a pas de droits confirmés (MOUV-D2). */
export type UndiffusableSheet = { readonly sheetId: string; readonly name: string };

export type DiffusableCatalogueResult =
  | { readonly ok: true; readonly file: MovementCatalogueFile; readonly withheld: readonly UndiffusableSheet[] }
  | { readonly ok: false; readonly withheld: readonly UndiffusableSheet[]; readonly issues: readonly CatalogueIssue[] };

/** Fiches dont au moins un média n'est pas en `PERMISSION_CONFIRMED` (MOUV-D2). */
export function undiffusableSheets(file: MovementCatalogueFile): readonly UndiffusableSheet[] {
  return file.sheets
    .filter((sheet) => sheet.media.some((media) => media.rightsStatus !== "PERMISSION_CONFIRMED"))
    .map((sheet) => ({ sheetId: sheet.sheetId, name: sheet.content.name }));
}

/**
 * MOUV-D2 — version diffusable d'un catalogue : retire les fiches dont un média n'a pas de droits
 * confirmés (fiches, membres des Bibliothèques du même catalogue, renvois du glossaire) ; les autres
 * fiches sont inchangées. Le résultat est revalidé ; s'il n'est pas valide, `ok: false`.
 * Seule règle de filtrage : transfert Wi-Fi et export de l'administration, import d'un fichier sur
 * l'iPhone (décision de Hermann du 12/11/2026 : export filtré « pour que à la source, toute diffusion
 * non autorisée ne puisse arriver », et filtrage à l'import).
 * Les notes internes (fiche, catalogue) sont retirées de toute diffusion (MOUV-ADM n° 5 et 28) ;
 * le destinataire ne les reçoit pas.
 */
export function diffusableCatalogue(file: MovementCatalogueFile): DiffusableCatalogueResult {
  const withheld = undiffusableSheets(file);
  const ids = new Set(withheld.map((sheet) => sheet.sheetId));
  const ownId = file.catalogue.id;
  const recipient = withoutInternalNotes(file);
  const filtered: MovementCatalogueFile = {
    ...recipient,
    sheets: recipient.sheets.filter((sheet) => !ids.has(sheet.sheetId)),
    libraries: file.libraries.map((library) => ({
      ...library,
      members: library.members.filter((member) => member.catalogueId !== ownId || !ids.has(member.sheetId)),
    })),
    glossary: file.glossary.map((term) => ({
      ...term, relatedSheetIds: term.relatedSheetIds.filter((sheetId) => !ids.has(sheetId)),
    })),
  };
  const recheck = parseMovementCatalogueFile(JSON.parse(JSON.stringify(filtered)));
  return recheck.ok ? { ok: true, file: recheck.file, withheld } : { ok: false, withheld, issues: recheck.issues };
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
  if (value.owner === undefined) issue("catalogue.owner", "REQUIRED");
  else validateActor(value.owner, "catalogue.owner", issue);
  if (value.owner === null) warnings.push({ path: "catalogue.owner", code: "UNKNOWN_OWNER" });
  if (!isStrings(value.notes)) issue("catalogue.notes", "INVALID");
  for (const field of ["manager", "publisher", "publicationAllowed"]) {
    if (field in value) issue("catalogue." + field, "UNRECOGNIZED");
  }
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

/** Propriétés retirées en v3, refusées dans un fichier v3 (elles ne doivent pas réapparaître). */
const REMOVED_FIELDS: readonly (readonly [string, readonly string[]])[] = [
  ["", ["sources"]],
  ["provenance", ["gestureId", "publisher", "reviewStatus", "visibility"]],
  ["content", ["startingPosition"]],
  ["classification", ["basis", "review", "original", "originalProposedSpecialties"]],
];

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
  for (const [section, fields] of REMOVED_FIELDS) {
    const holder = section === "" ? sheet : sheet[section];
    if (!isObject(holder)) continue;
    for (const field of fields) {
      if (field in holder) issue(path + (section === "" ? "" : "." + section) + "." + field, "UNRECOGNIZED");
    }
  }

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
    for (const field of ["equipment", "safetyNotes"] as const) {
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

  const phases = sheet.phases;
  if (!Array.isArray(phases)) {
    issue(path + ".phases", "REQUIRED");
  } else {
    const problem = movementPhasesProblem(phases);
    if (problem !== null) issue(path + ".phases", "INVALID", problem);
    else if (!phases.every((phase) => isObject(phase) && (phase.durationSeconds === null || typeof phase.durationSeconds === "number") &&
        Object.keys(phase).every((key) => key === "id" || key === "label" || key === "durationSeconds"))) {
      issue(path + ".phases", "INVALID", "durationSeconds");
    }
  }

  const levelGroup = sheet.levelGroup;
  if (levelGroup !== undefined && levelGroup !== null &&
      (!isObject(levelGroup) || !present(levelGroup.groupId) || typeof levelGroup.sortKey !== "number" ||
       !Number.isFinite(levelGroup.sortKey))) {
    issue(path + ".levelGroup", "INVALID");
  }

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

  // Projection Mouvement : contrat `Movement` actuel (nom, étapes encodées, Catégorie, Zones, phases).
  if (isObject(content) && isObject(classification) && present(content.name) && isStrings(content.aliases) &&
      isStrings(content.steps) && isStringOrNull(classification.categoryId) && isStrings(classification.bodyZoneIds) &&
      Array.isArray(phases) && movementPhasesProblem(phases) === null) {
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

/** Règles de l'administration Web (`mediaError`), reprises à l'identique (sans texte alternatif en v3). */
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
  if ("alt" in media) return "texte alternatif retiré du format 3.0.0";
  if (media.view !== undefined && media.view !== null) {
    if (media.kind !== "PHOTO") return "vue retenue réservée aux photos";
    if (!isValidCatalogueMediaView(media.view)) return "vue retenue invalide (pourcentages hors de l'image)";
  }
  for (const [field, max] of [["caption", 180], ["attribution", 160], ["license", 160]] as const) {
    const text = media[field];
    if (!isString(text) || text.length > max) return field + " absent ou trop long";
  }
  if (!isString(media.fileName) || media.fileName.length > 180) return "nom de fichier invalide";
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
 * Phases de la fiche au contrat `Movement`. La durée est toujours explicite (`null` = aucune) : une durée
 * absente serait conservée par la mise à jour du Mouvement (`updateMovementContent`), et la suppression d'une
 * durée dans la fiche ne serait pas transmise.
 */
export function projectSheetPhases(phases: readonly CataloguePhase[]): readonly MovementPhase[] {
  return phases.map((phase) => ({ id: phase.id, label: phase.label, durationSeconds: phase.durationSeconds }));
}

/**
 * Projection d'une fiche vers le contrat `Movement` actuel, identique à l'importeur pilote :
 * étapes encodées dans `description` (codec unique), alias ordonnés, Catégorie, Zones et, depuis la v3,
 * phases de la fiche source (MOUV-UX-20261117) ; médias non transportés. L'identifiant local est fourni
 * par l'installation.
 */
export function projectSheetToMovement(sheet: CatalogueSheet, movementId: string): Movement {
  // La famille n'est pas projetée ici : son identifiant local dépend du catalogue et des membres déjà
  // présents sur le téléphone (`catalogueFamilies.ts`, appliqué après l'écriture du Mouvement).
  const phases = projectSheetPhases(sheet.phases ?? []);
  return {
    id: movementId,
    name: sheet.content.name,
    aliases: [...sheet.content.aliases],
    description: encodeInstructionSteps(sheet.content.steps),
    categoryId: sheet.classification.categoryId as string,
    bodyZoneIds: [...sheet.classification.bodyZoneIds],
    media: [],
    phases,
    nextPhaseId: phases.reduce((max, phase) => Math.max(max, phase.id), 0) + 1,
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
 * Sensible à toute propriété éditoriale (y compris médias, phases et métadonnées) et à l'ordre des
 * étapes, alias, médias et phases ; insensible à l'ordre des clés et des ensembles (Zones, taxonomie).
 */
export function sheetFingerprint(sheet: CatalogueSheet): string {
  const editorial = {
    sheetId: sheet.sheetId,
    provenance: sheet.provenance,
    content: sheet.content,
    classification: sheet.classification,
    validation: sheet.validation,
    // Photo intégrée représentée par son empreinte : même résultat pour la fiche complète et pour l'instantané
    // allégé du registre (`compactSheetMedia`, 19/11/2026).
    media: sheet.media.map((media) => ({ ...media, url: embeddedMediaDigest(media.url) })),
    phases: sheet.phases,
    // Absente ou `null` : omise, l'empreinte des fiches sans famille est inchangée.
    levelGroup: sheet.levelGroup ?? undefined,
  };
  return canonicalJson(editorial, null);
}

/** Empreinte courte et déterministe (cyrb53, 53 bits) d'une chaîne. */
export function cyrb53(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** Préfixe de l'empreinte qui remplace une photo intégrée dans l'instantané d'une fiche installée. */
export const EMBEDDED_MEDIA_DIGEST_PREFIX = "kodjo-embedded-digest:";

/** Photo intégrée (`data:`) → empreinte de son contenu ; toute autre URL (distante, déjà empreinte) inchangée. */
export function embeddedMediaDigest(url: string): string {
  return url.startsWith("data:") ? EMBEDDED_MEDIA_DIGEST_PREFIX + cyrb53(url) + "-" + url.length.toString(36) : url;
}

/**
 * Instantané d'une fiche installée sans le contenu de ses photos intégrées (décision de Hermann du 19/11/2026 :
 * « je ne veux pas conserver deux photos sur le téléphone »). La photo est déjà un média du Mouvement
 * (`catalogueMedia.ts`) ; l'instantané garde ses métadonnées et l'empreinte, qui suffisent aux comparaisons
 * (`sheetFingerprint`, `compareSheet`). Fiche sans photo intégrée : rendue telle quelle.
 */
export function compactSheetMedia(sheet: CatalogueSheet): CatalogueSheet {
  if (!sheet.media.some((media) => media.url.startsWith("data:"))) return sheet;
  return { ...sheet, media: sheet.media.map((media) => ({ ...media, url: embeddedMediaDigest(media.url) })) };
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
