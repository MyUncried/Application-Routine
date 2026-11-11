/**
 * Édition d'un fichier catalogue v2 par l'administration locale (W1, 11/11/2026).
 *
 * Module pur, partagé tel quel par le serveur Node et la page de l'administration (transpilé
 * par `tools/catalogue-admin/build-domain.mjs`) : création de fiches et de Bibliothèques,
 * composition des Bibliothèques (références, jamais de copie — A-1), et calcul des révisions.
 *
 * Règles de révision :
 * - une révision n'est créée que sur un changement **effectif** : l'empreinte éditoriale
 *   (`sheetFingerprint`, hors `revision`, `history` et `install`) pour une fiche, l'empreinte
 *   canonique hors `revision` et `history` pour une Bibliothèque ;
 * - `install.knownLocalMovementIds` (rapprochement d'installation) ne crée aucune révision
 *   éditoriale ; il change en revanche le fichier, donc la révision du catalogue ;
 * - la révision du catalogue (`catalogue.revision`) avance dès que le fichier change ;
 * - les révisions et l'historique fournis par un client sont ignorés : ils sont recalculés à
 *   partir du fichier précédent (le client ne peut pas forger une révision).
 *
 * Identité : un `sheetId` ou un `libraryId` n'est jamais réutilisé. La suppression d'une fiche ou
 * d'une Bibliothèque n'est pas une édition admise (refus `SHEET_REMOVED` / `LIBRARY_REMOVED`).
 * Aucune identité n'est inventée : propriétaire et auteur restent `null` s'ils ne sont pas fournis.
 */
import {
  canonicalJson,
  MOVEMENT_CATALOGUE_FORMAT,
  MOVEMENT_CATALOGUE_FORMAT_VERSION,
  sheetFingerprint,
  type CatalogueLibrary,
  type CatalogueLibraryMember,
  type CatalogueSheet,
  type CatalogueSheetRevision,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";
import type { EditorialActorRef } from "@/domain/catalogue/MovementEditorialProvenance";

/** Métadonnées d'une révision : date ISO 8601, auteur de la révision (ou inconnu) et résumé. */
export type CatalogueEditMeta = {
  readonly date: string;
  readonly author: EditorialActorRef | null;
  readonly summary: string;
};

export type CatalogueEditErrorCode =
  | "INVALID_SHEET_ID"
  | "SHEET_ID_TAKEN"
  | "INVALID_LIBRARY_ID"
  | "LIBRARY_ID_TAKEN"
  | "UNKNOWN_SHEET"
  | "UNKNOWN_LIBRARY"
  | "SHEET_ID_CHANGED"
  | "LIBRARY_ID_CHANGED"
  | "MEMBER_ALREADY_PRESENT"
  | "UNKNOWN_MEMBER"
  | "LOCAL_ID_ALREADY_LINKED"
  | "INVALID_LOCAL_ID"
  | "INVALID_INPUT";

export class CatalogueEditError extends Error {
  readonly code: CatalogueEditErrorCode;
  readonly detail: string | null;
  constructor(code: CatalogueEditErrorCode, detail: string | null = null) {
    super(detail === null ? code : code + " : " + detail);
    this.name = "CatalogueEditError";
    this.code = code;
    this.detail = detail;
  }
}

/** Valeurs initiales d'une nouvelle fiche, alignées sur le corpus pilote (rien n'est validé). */
export const NEW_SHEET_VALIDATION = {
  classification: "PENDING",
  clinical: "NOT_ASSESSED",
  rights: "PENDING",
  corpusReview: "UNREVIEWED",
  licensing: "UNVERIFIED",
  clinicalValidation: "NOT_APPROVED",
  publicationAllowed: false,
} as const;

export const NEW_SHEET_BASIS = "LOCAL_ADMIN_ENTRY (saisie dans l'administration locale, non approuvée)";

export type NewSheetInput = {
  /** Identifiant souhaité ; généré à partir du nom s'il est absent. */
  readonly sheetId?: string;
  readonly name: string;
  readonly aliases?: readonly string[];
  readonly startingPosition?: string | null;
  readonly equipment?: string | null;
  readonly steps?: readonly string[];
  readonly safetyNotes?: string | null;
  readonly notes?: string;
  /** Catégorie et Zones : obligatoires par le contrat `Movement` (projection). */
  readonly categoryId: string;
  readonly bodyZoneIds: readonly string[];
  readonly specialtyIds?: readonly string[];
  readonly gesturalFamilyIds?: readonly string[];
  readonly clinicalProblemIds?: readonly string[];
  readonly anatomicalTargetIds?: readonly string[];
  readonly basis?: string;
  readonly owner?: EditorialActorRef | null;
  readonly author?: EditorialActorRef | null;
  readonly knownLocalMovementIds?: readonly string[];
};

const SHEET_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const LIBRARY_ID = /^[a-z0-9][a-z0-9.-]{1,63}$/;
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

const historyEntry = (revision: string, meta: CatalogueEditMeta, fallback: string): CatalogueSheetRevision => ({
  revision,
  date: meta.date,
  author: meta.author,
  summary: meta.summary.trim() === "" ? fallback : meta.summary.trim(),
});

/** Ordre de référence des propriétés d'une fiche (sérialisation stable). */
function orderedSheet(sheet: CatalogueSheet): CatalogueSheet {
  return {
    sheetId: sheet.sheetId,
    revision: sheet.revision,
    history: sheet.history,
    provenance: sheet.provenance,
    content: sheet.content,
    classification: sheet.classification,
    sources: sheet.sources,
    validation: sheet.validation,
    media: sheet.media,
    install: sheet.install,
  };
}

function orderedLibrary(library: CatalogueLibrary): CatalogueLibrary {
  return {
    libraryId: library.libraryId,
    title: library.title,
    description: library.description,
    revision: library.revision,
    history: library.history,
    editor: library.editor,
    owner: library.owner,
    visibility: library.visibility,
    publicationAllowed: library.publicationAllowed,
    members: library.members,
  };
}

/** Fragment ASCII d'identifiant tiré d'un libellé (accents retirés). */
function slugOf(text: string, maxLength: number): string {
  const slug = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  return slug === "" ? "sans-titre" : slug;
}

function uniqueId(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  for (let suffix = 2; ; suffix += 1) {
    const candidate = base + "-" + suffix;
    if (!taken.has(candidate)) return candidate;
  }
}

/** Tous les identifiants de fiche connus du fichier (fiches, membres internes, glossaire). */
function knownSheetIds(file: MovementCatalogueFile): Set<string> {
  const ids = new Set(file.sheets.map((sheet) => sheet.sheetId));
  for (const library of file.libraries) {
    for (const member of library.members) if (member.catalogueId === file.catalogue.id) ids.add(member.sheetId);
  }
  for (const entry of file.glossary) for (const id of entry.relatedSheetIds) ids.add(id);
  return ids;
}

/**
 * Nouvelle fiche créée dans l'administration : révision `"1"` et une entrée d'historique,
 * origine `LOCAL_CREATED` sans amont, privée, brouillon, non publiable, aucune installation
 * connue sauf rapprochement explicite. Le fichier retourné contient la fiche en dernière position.
 */
export function createSheet(
  file: MovementCatalogueFile,
  input: NewSheetInput,
  meta: CatalogueEditMeta,
): { readonly file: MovementCatalogueFile; readonly sheet: CatalogueSheet } {
  if (typeof input.name !== "string" || input.name.trim() === "") throw new CatalogueEditError("INVALID_INPUT", "name");
  const taken = knownSheetIds(file);
  let sheetId: string;
  if (input.sheetId !== undefined) {
    if (!SHEET_ID.test(input.sheetId)) throw new CatalogueEditError("INVALID_SHEET_ID", input.sheetId);
    if (taken.has(input.sheetId)) throw new CatalogueEditError("SHEET_ID_TAKEN", input.sheetId);
    sheetId = input.sheetId;
  } else {
    sheetId = uniqueId("fiche-" + slugOf(input.name, 48), taken);
  }
  const sheet: CatalogueSheet = {
    sheetId,
    revision: "1",
    history: [historyEntry("1", meta, "Création de la fiche dans l'administration locale")],
    provenance: {
      gestureId: null,
      origin: "LOCAL_CREATED",
      upstream: null,
      owner: input.owner ?? null,
      author: input.author ?? null,
      publisher: null,
      rightsHolder: null,
      license: null,
      reviewStatus: "DRAFT",
      visibility: "PRIVATE",
    },
    content: {
      name: input.name.trim(),
      aliases: [...(input.aliases ?? [])],
      startingPosition: input.startingPosition ?? null,
      equipment: input.equipment ?? null,
      steps: [...(input.steps ?? [])],
      safetyNotes: input.safetyNotes ?? null,
      notes: input.notes ?? "",
    },
    classification: {
      categoryId: input.categoryId,
      bodyZoneIds: [...input.bodyZoneIds],
      specialtyIds: [...(input.specialtyIds ?? [])],
      gesturalFamilyIds: [...(input.gesturalFamilyIds ?? [])],
      clinicalProblemIds: [...(input.clinicalProblemIds ?? [])],
      anatomicalTargetIds: [...(input.anatomicalTargetIds ?? [])],
      basis: input.basis ?? NEW_SHEET_BASIS,
      review: { status: "PENDING", needsReview: true, flags: [], note: null },
      original: {},
      originalProposedSpecialties: [],
    },
    sources: { documentary: null, prescriptionContext: {} },
    validation: { ...NEW_SHEET_VALIDATION },
    media: [],
    install: { knownLocalMovementIds: [...(input.knownLocalMovementIds ?? [])] },
  };
  return { file: { ...file, sheets: [...file.sheets, sheet] }, sheet };
}

/**
 * Applique une édition à une fiche existante. Sans changement de l'empreinte éditoriale, la
 * fiche précédente est retournée telle quelle (avec, le cas échéant, la nouvelle liste
 * `install`) : aucune révision. Sinon, révision suivante et entrée d'historique ajoutée.
 */
export function applySheetEdit(previous: CatalogueSheet, edited: CatalogueSheet, meta: CatalogueEditMeta): CatalogueSheet {
  if (edited.sheetId !== previous.sheetId) throw new CatalogueEditError("SHEET_ID_CHANGED", previous.sheetId);
  const candidate = orderedSheet({ ...edited, revision: previous.revision, history: previous.history });
  if (sheetFingerprint(candidate) === sheetFingerprint(previous)) {
    return canonicalJson(edited.install, null) === canonicalJson(previous.install, null)
      ? previous
      : orderedSheet({ ...previous, install: edited.install });
  }
  const revision = nextRevision(previous.revision, previous.history.map((entry) => entry.revision));
  return orderedSheet({
    ...candidate,
    revision,
    history: [...previous.history, historyEntry(revision, meta, "Modification de la fiche")],
  });
}

/** Empreinte d'une Bibliothèque : tout sauf `revision` et `history` (membres ordonnés). */
export function libraryFingerprint(library: CatalogueLibrary): string {
  const { revision: _revision, history: _history, ...rest } = library;
  void _revision;
  void _history;
  return canonicalJson(rest, null);
}

/** Même règle que `applySheetEdit`, appliquée à la composition et à l'en-tête d'une Bibliothèque. */
export function applyLibraryEdit(previous: CatalogueLibrary, edited: CatalogueLibrary, meta: CatalogueEditMeta): CatalogueLibrary {
  if (edited.libraryId !== previous.libraryId) throw new CatalogueEditError("LIBRARY_ID_CHANGED", previous.libraryId);
  const candidate = orderedLibrary({ ...edited, revision: previous.revision, history: previous.history });
  if (libraryFingerprint(candidate) === libraryFingerprint(previous)) return previous;
  const revision = nextRevision(previous.revision, previous.history.map((entry) => entry.revision));
  return orderedLibrary({
    ...candidate,
    revision,
    history: [...previous.history, historyEntry(revision, meta, "Modification de la Bibliothèque")],
  });
}

export type CatalogueFileEditIssue = {
  readonly code: "CATALOGUE_ID_CHANGED" | "SHEET_REMOVED" | "LIBRARY_REMOVED" | "SHEET_ID_CHANGED" | "LIBRARY_ID_CHANGED";
  readonly id: string;
};

export type CatalogueFileEditResult =
  | {
      readonly ok: true;
      /** Fichier précédent tel quel si rien n'a changé. */
      readonly file: MovementCatalogueFile;
      readonly changed: boolean;
      /** Fiches ayant reçu une nouvelle révision (créations comprises). */
      readonly changedSheets: readonly string[];
      /** Fiches dont seule la liste `install` a changé (aucune révision éditoriale). */
      readonly installChangedSheets: readonly string[];
      readonly createdSheets: readonly string[];
      readonly changedLibraries: readonly string[];
      readonly createdLibraries: readonly string[];
    }
  | { readonly ok: false; readonly issues: readonly CatalogueFileEditIssue[] };

/**
 * Calcule le fichier à enregistrer à partir du fichier précédent (référence, ex. sur disque) et
 * du fichier édité (client). Les deux doivent avoir été acceptés par `parseMovementCatalogueFile`.
 * Révisions de fiches et de Bibliothèques recalculées ; nouvelle fiche ou Bibliothèque → révision
 * `"1"` ; révision du catalogue avancée si le fichier change (comparaison canonique).
 */
export function applyFileEdit(
  previousFile: MovementCatalogueFile,
  editedFile: MovementCatalogueFile,
  meta: CatalogueEditMeta,
): CatalogueFileEditResult {
  const issues: CatalogueFileEditIssue[] = [];
  if (editedFile.catalogue.id !== previousFile.catalogue.id) {
    issues.push({ code: "CATALOGUE_ID_CHANGED", id: previousFile.catalogue.id });
  }
  const editedSheetIds = new Set(editedFile.sheets.map((sheet) => sheet.sheetId));
  for (const sheet of previousFile.sheets) {
    if (!editedSheetIds.has(sheet.sheetId)) issues.push({ code: "SHEET_REMOVED", id: sheet.sheetId });
  }
  const editedLibraryIds = new Set(editedFile.libraries.map((library) => library.libraryId));
  for (const library of previousFile.libraries) {
    if (!editedLibraryIds.has(library.libraryId)) issues.push({ code: "LIBRARY_REMOVED", id: library.libraryId });
  }
  if (issues.length > 0) return { ok: false, issues };

  const previousSheets = new Map(previousFile.sheets.map((sheet) => [sheet.sheetId, sheet]));
  const changedSheets: string[] = [];
  const installChangedSheets: string[] = [];
  const createdSheets: string[] = [];
  const sheets = editedFile.sheets.map((edited) => {
    const previous = previousSheets.get(edited.sheetId);
    if (previous === undefined) {
      createdSheets.push(edited.sheetId);
      changedSheets.push(edited.sheetId);
      return orderedSheet({
        ...edited,
        revision: "1",
        history: [historyEntry("1", meta, "Création de la fiche dans l'administration locale")],
      });
    }
    const next = applySheetEdit(previous, edited, meta);
    if (next.revision !== previous.revision) changedSheets.push(edited.sheetId);
    else if (next !== previous) installChangedSheets.push(edited.sheetId);
    return next;
  });

  const previousLibraries = new Map(previousFile.libraries.map((library) => [library.libraryId, library]));
  const changedLibraries: string[] = [];
  const createdLibraries: string[] = [];
  const libraries = editedFile.libraries.map((edited) => {
    const previous = previousLibraries.get(edited.libraryId);
    if (previous === undefined) {
      createdLibraries.push(edited.libraryId);
      changedLibraries.push(edited.libraryId);
      return orderedLibrary({
        ...edited,
        revision: "1",
        history: [historyEntry("1", meta, "Création de la Bibliothèque")],
      });
    }
    const next = applyLibraryEdit(previous, edited, meta);
    if (next !== previous) changedLibraries.push(edited.libraryId);
    return next;
  });

  const header = {
    id: previousFile.catalogue.id,
    title: editedFile.catalogue.title,
    revision: previousFile.catalogue.revision,
    owner: editedFile.catalogue.owner,
    manager: editedFile.catalogue.manager,
    publisher: editedFile.catalogue.publisher,
    publicationAllowed: editedFile.catalogue.publicationAllowed,
    notes: editedFile.catalogue.notes,
  };
  const candidate: MovementCatalogueFile = {
    format: MOVEMENT_CATALOGUE_FORMAT,
    formatVersion: MOVEMENT_CATALOGUE_FORMAT_VERSION,
    catalogue: header,
    references: editedFile.references,
    glossary: editedFile.glossary,
    libraries,
    sheets,
  };
  if (canonicalJson(candidate, null) === canonicalJson(previousFile, null)) {
    return {
      ok: true, file: previousFile, changed: false, changedSheets: [], installChangedSheets: [],
      createdSheets: [], changedLibraries: [], createdLibraries: [],
    };
  }
  return {
    ok: true,
    file: { ...candidate, catalogue: { ...header, revision: nextRevision(previousFile.catalogue.revision) } },
    changed: true,
    changedSheets,
    installChangedSheets,
    createdSheets,
    changedLibraries,
    createdLibraries,
  };
}

export type NewLibraryInput = {
  readonly libraryId?: string;
  readonly title: string;
  readonly description?: string | null;
  readonly editor?: EditorialActorRef | null;
  readonly owner?: EditorialActorRef | null;
  readonly members?: readonly CatalogueLibraryMember[];
};

/**
 * Nouvelle Bibliothèque : révision `"1"`, privée et non publiable (aucune diffusion implicite),
 * éditeur et propriétaire `null` sauf déclaration. Ajoutée en dernière position.
 */
export function createLibrary(
  file: MovementCatalogueFile,
  input: NewLibraryInput,
  meta: CatalogueEditMeta,
): { readonly file: MovementCatalogueFile; readonly library: CatalogueLibrary } {
  if (typeof input.title !== "string" || input.title.trim() === "") throw new CatalogueEditError("INVALID_INPUT", "title");
  const taken = new Set(file.libraries.map((library) => library.libraryId));
  let libraryId: string;
  if (input.libraryId !== undefined) {
    if (!LIBRARY_ID.test(input.libraryId)) throw new CatalogueEditError("INVALID_LIBRARY_ID", input.libraryId);
    if (taken.has(input.libraryId)) throw new CatalogueEditError("LIBRARY_ID_TAKEN", input.libraryId);
    libraryId = input.libraryId;
  } else {
    libraryId = uniqueId("bib-" + slugOf(input.title, 40), taken);
  }
  let library: CatalogueLibrary = {
    libraryId,
    title: input.title.trim(),
    description: input.description ?? null,
    revision: "1",
    history: [historyEntry("1", meta, "Création de la Bibliothèque")],
    editor: input.editor ?? null,
    owner: input.owner ?? null,
    visibility: "PRIVATE",
    publicationAllowed: false,
    members: [],
  };
  for (const member of input.members ?? []) library = addLibraryMember(library, member);
  return { file: { ...file, libraries: [...file.libraries, library] }, library };
}

const sameMember = (a: CatalogueLibraryMember, b: CatalogueLibraryMember) =>
  a.catalogueId === b.catalogueId && a.sheetId === b.sheetId;

/** Ajoute une référence (jamais une copie) ; `position` absente = fin de liste. */
export function addLibraryMember(
  library: CatalogueLibrary,
  member: CatalogueLibraryMember,
  position?: number,
): CatalogueLibrary {
  if (library.members.some((existing) => sameMember(existing, member))) {
    throw new CatalogueEditError("MEMBER_ALREADY_PRESENT", member.catalogueId + "/" + member.sheetId);
  }
  const members = [...library.members];
  const at = position === undefined ? members.length : Math.max(0, Math.min(members.length, Math.trunc(position)));
  members.splice(at, 0, { catalogueId: member.catalogueId, sheetId: member.sheetId });
  return { ...library, members };
}

export function removeLibraryMember(library: CatalogueLibrary, member: CatalogueLibraryMember): CatalogueLibrary {
  const index = library.members.findIndex((existing) => sameMember(existing, member));
  if (index < 0) throw new CatalogueEditError("UNKNOWN_MEMBER", member.catalogueId + "/" + member.sheetId);
  return { ...library, members: library.members.filter((_, at) => at !== index) };
}

/** Déplace un membre de `from` vers `to` (indices bornés à la liste). */
export function moveLibraryMember(library: CatalogueLibrary, from: number, to: number): CatalogueLibrary {
  if (!Number.isInteger(from) || from < 0 || from >= library.members.length) {
    throw new CatalogueEditError("UNKNOWN_MEMBER", String(from));
  }
  const members = [...library.members];
  const [moved] = members.splice(from, 1);
  members.splice(Math.max(0, Math.min(members.length, Math.trunc(to))), 0, moved);
  return { ...library, members };
}

/** Remplace une Bibliothèque du fichier (même `libraryId`). */
export function replaceLibrary(file: MovementCatalogueFile, library: CatalogueLibrary): MovementCatalogueFile {
  if (!file.libraries.some((existing) => existing.libraryId === library.libraryId)) {
    throw new CatalogueEditError("UNKNOWN_LIBRARY", library.libraryId);
  }
  return {
    ...file,
    libraries: file.libraries.map((existing) => (existing.libraryId === library.libraryId ? library : existing)),
  };
}

/**
 * Rapprochement explicite d'un Mouvement local avec une fiche : ajoute `movementId` à
 * `install.knownLocalMovementIds`. Aucune révision éditoriale (l'installation est hors
 * empreinte) ; la révision du catalogue avancera à l'enregistrement. Refus si l'identifiant
 * est déjà rattaché à une autre fiche ; sans effet s'il l'est déjà à cette fiche.
 */
/**
 * Rapprochement d'un Mouvement local. `personal` : Mouvement personnel reçu d'un téléphone (A2) — inscrit aussi
 * dans `install.personalMovementIds` pour que le téléphone n'applique pas le rattachement tant que la règle
 * de transition n'est pas arbitrée.
 */
export function linkLocalMovement(file: MovementCatalogueFile, sheetId: string, movementId: string, personal = false): MovementCatalogueFile {
  if (typeof movementId !== "string" || movementId.trim() === "") throw new CatalogueEditError("INVALID_LOCAL_ID", movementId);
  const target = file.sheets.find((sheet) => sheet.sheetId === sheetId);
  if (target === undefined) throw new CatalogueEditError("UNKNOWN_SHEET", sheetId);
  const holder = file.sheets.find((sheet) => sheet.install.knownLocalMovementIds.includes(movementId));
  if (holder !== undefined && holder.sheetId !== sheetId) {
    throw new CatalogueEditError("LOCAL_ID_ALREADY_LINKED", holder.sheetId);
  }
  const withPersonal = (install: CatalogueSheet["install"]): CatalogueSheet["install"] => {
    if (!personal || (install.personalMovementIds ?? []).includes(movementId)) return install;
    return { ...install, personalMovementIds: [...(install.personalMovementIds ?? []), movementId] };
  };
  if (holder !== undefined) {
    if (!personal) return file;
    return { ...file, sheets: file.sheets.map((sheet) => (sheet.sheetId === sheetId ? { ...sheet, install: withPersonal(sheet.install) } : sheet)) };
  }
  return {
    ...file,
    sheets: file.sheets.map((sheet) =>
      sheet.sheetId === sheetId
        ? { ...sheet, install: withPersonal({ ...sheet.install, knownLocalMovementIds: [...sheet.install.knownLocalMovementIds, movementId] }) }
        : sheet,
    ),
  };
}
