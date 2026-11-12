/**
 * P0/A1 — Bibliothèques : classification pure d'une installation ou d'une mise à jour
 * (aucune E/S, aucune écriture). S'appuie sur le plan de chargement CA-3 (`planCatalogueLoad`),
 * fiche par fiche, sans second modèle.
 *
 * Décisions appliquées :
 * - A-1 (11/11/2026) : une Bibliothèque est une collection logique de références vers des fiches ;
 *   une fiche peut appartenir à plusieurs Bibliothèques, sans copie.
 * - A-2 (11/11/2026) : une fiche importée n'est ni copiée, ni dupliquée, ni modifiée localement.
 * - BIB-12/22, F4-A, F4-D : une mise à jour n'est appliquée que sur action explicite « Mettre à jour » ;
 *   aucune modification silencieuse.
 * - F4-G : une seule révision active par fiche source sur l'appareil ; la mise à jour d'une fiche vaut
 *   pour toutes les Bibliothèques qui la référencent, ce qui est annoncé avant validation.
 * - F4-B (Figma 12118:25370) : une fiche retirée d'une Bibliothèque reste dans le Catalogue.
 * - MOUV-D4 : les adaptations historiques (60 Mouvements du pilote) ne sont jamais écrasées ; une
 *   fiche en conflit ou à rapprocher n'est pas appliquée par la mise à jour groupée et reste à
 *   examiner fiche par fiche (canal CA-3/CA-4).
 */
import {
  canonicalJson,
  type CatalogueLibrary,
  type CatalogueLibraryMember,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";
import {
  isPendingPersonalAttachment,
  type CatalogueLoadPlan,
  type InstalledSheetRecord,
  type SheetDecision,
  type SheetLoadItem,
} from "@/domain/catalogue/catalogueLoadPlan";

export type LibraryKey = { readonly catalogueId: string; readonly libraryId: string };

export type InstalledLibraryRecord = LibraryKey & {
  readonly revision: string;
  /** Cible appliquée (révision de la Bibliothèque et révisions de ses fiches). */
  readonly targetKey: string;
  readonly library: CatalogueLibrary;
  readonly installedAt: string;
  readonly updatedAt: string;
};

/** Opération commencée (intention durable) et non terminée : reprise après interruption. */
export type LibraryOperation = LibraryKey & {
  readonly kind: "INSTALL" | "UPDATE";
  readonly targetKey: string;
  /** Fichier source de l'opération, pour reprendre sans le recharger. */
  readonly file: MovementCatalogueFile;
  readonly startedAt: string;
};

export type LibraryDecisionRecord = LibraryKey & {
  readonly targetKey: string;
  readonly decision: SheetDecision;
  readonly decidedAt: string;
};

export type LibraryStatus = "NOT_INSTALLED" | "UP_TO_DATE" | "UPDATE_AVAILABLE" | "REFUSED" | "INTERRUPTED";

/** Raison pour laquelle une fiche n'est pas appliquée par l'action groupée. */
export type ReviewReason =
  /** Conflit ou rapprochement : décision fiche par fiche (CA-3), jamais d'écrasement. */
  | "TO_RECONCILE"
  /** Mouvement personnel envoyé à l'administration puis catalogué : règle non arbitrée (A2). */
  | "PERSONAL_ORIGIN"
  /** Révision incohérente, refusée, ou Mouvement retiré localement : rien n'est réinstallé. */
  | "NOT_APPLICABLE"
  /** Fiche bloquée (référentiel absent du téléphone, nom déjà utilisé). */
  | "BLOCKED";

export type LibraryReviewItem = { readonly item: SheetLoadItem; readonly reason: ReviewReason };

export type LibraryPreview = LibraryKey & {
  readonly title: string;
  readonly description: string | null;
  readonly targetRevision: string;
  readonly targetKey: string;
  readonly installedRevision: string | null;
  readonly status: LibraryStatus;
  readonly memberCount: number;
  /** Nouvelles fiches : un Mouvement sera ajouté au Catalogue. */
  readonly added: readonly SheetLoadItem[];
  /** Déjà présentes et identiques : rattachées sans doublon, aucun Mouvement modifié. */
  readonly attached: readonly SheetLoadItem[];
  /** Nouvelle révision sans conflit : le Mouvement sera mis à jour. */
  readonly modified: readonly SheetLoadItem[];
  readonly unchanged: readonly SheetLoadItem[];
  /** Non appliquées par l'action groupée. */
  readonly toReview: readonly LibraryReviewItem[];
  /** Retirées de la composition : elles restent dans le Catalogue. */
  readonly removed: readonly CatalogueLibraryMember[];
  /** Membres d'une autre source absents de l'appareil : non installables depuis ce fichier. */
  readonly missingExternal: readonly CatalogueLibraryMember[];
  /** F4-G : autres Bibliothèques installées qui référencent une fiche modifiée (clé `catalogueId/sheetId`). */
  readonly alsoIn: Readonly<Record<string, readonly string[]>>;
  /** Propriétaire inconnu : usage privé, aucune redistribution. */
  readonly unknownOwner: boolean;
  /** La Bibliothèque n'a pas de propriétaire déclaré (une des causes de `unknownOwner`). */
  readonly ownerlessLibrary: boolean;
  /** Noms des fiches de la Bibliothèque sans propriétaire déclaré (autre cause de `unknownOwner`). */
  readonly ownerlessSheets: readonly string[];
};

const memberKey = (member: CatalogueLibraryMember) => member.catalogueId + "/" + member.sheetId;

/** Empreinte courte et déterministe (cyrb53) d'une chaîne canonique. */
function hash(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/**
 * Cible d'une Bibliothèque : composition (révision et contenu, hors historique) et révision de
 * chaque fiche membre du fichier. Change dès qu'une fiche membre ou la composition change.
 */
export function libraryTargetKey(file: MovementCatalogueFile, library: CatalogueLibrary): string {
  const revisions = new Map(file.sheets.map((sheet) => [sheet.sheetId, sheet.revision]));
  const { history: _history, ...composition } = library;
  void _history;
  const members = library.members.map((member) =>
    memberKey(member) + "@" + (member.catalogueId === file.catalogue.id ? revisions.get(member.sheetId) ?? "?" : "ext"));
  return library.revision + "." + hash(canonicalJson({ composition, members }, null));
}

export type LibraryPlanContext = {
  /** Plan CA-3 du fichier entier (états de toutes les fiches). */
  readonly plan: CatalogueLoadPlan;
  /** Fiches installées sur l'appareil, tous catalogues confondus. */
  readonly installedSheets: readonly InstalledSheetRecord[];
  readonly installedLibraries: readonly InstalledLibraryRecord[];
  readonly operations: readonly LibraryOperation[];
  readonly decisions: readonly LibraryDecisionRecord[];
};

/** Aperçu avant installation ou mise à jour d'une Bibliothèque du fichier. */
export function planLibrary(file: MovementCatalogueFile, library: CatalogueLibrary, context: LibraryPlanContext): LibraryPreview {
  const key: LibraryKey = { catalogueId: file.catalogue.id, libraryId: library.libraryId };
  const same = (other: LibraryKey) => other.catalogueId === key.catalogueId && other.libraryId === key.libraryId;
  const targetKey = libraryTargetKey(file, library);
  const installed = context.installedLibraries.find(same) ?? null;
  const items = new Map(context.plan.items.map((item) => [item.sheetId, item]));
  const sheets = new Map(file.sheets.map((sheet) => [sheet.sheetId, sheet]));
  const installedSheetKeys = new Set(context.installedSheets.map((record) => record.catalogueId + "/" + record.sheetId));

  const added: SheetLoadItem[] = [];
  const attached: SheetLoadItem[] = [];
  const modified: SheetLoadItem[] = [];
  const unchanged: SheetLoadItem[] = [];
  const toReview: LibraryReviewItem[] = [];
  const missingExternal: CatalogueLibraryMember[] = [];

  for (const member of library.members) {
    if (member.catalogueId !== file.catalogue.id) {
      if (!installedSheetKeys.has(memberKey(member))) missingExternal.push(member);
      continue;
    }
    const item = items.get(member.sheetId);
    if (!item) continue; // le validateur garantit la présence des membres internes
    const sheet = sheets.get(member.sheetId);
    if (sheet && isPendingPersonalAttachment(sheet, item)) {
      toReview.push({ item, reason: "PERSONAL_ORIGIN" });
      continue;
    }
    if (item.blockers.length > 0) {
      toReview.push({ item, reason: "BLOCKED" });
      continue;
    }
    switch (item.state) {
      case "NEW":
        added.push(item);
        break;
      case "ADOPTABLE":
        attached.push(item);
        break;
      case "NEW_REVISION":
        if (item.summary.conflicts.length > 0) toReview.push({ item, reason: "TO_RECONCILE" });
        else modified.push(item);
        break;
      case "UP_TO_DATE":
      case "OLDER_REVISION":
        unchanged.push(item);
        break;
      case "TO_RECONCILE":
        toReview.push({ item, reason: "TO_RECONCILE" });
        break;
      default:
        toReview.push({ item, reason: "NOT_APPLICABLE" });
    }
  }

  const next = new Set(library.members.map(memberKey));
  const removed = installed ? installed.library.members.filter((member) => !next.has(memberKey(member))) : [];

  const alsoIn: Record<string, string[]> = {};
  for (const item of modified) {
    const sheetKey = key.catalogueId + "/" + item.sheetId;
    const titles = context.installedLibraries
      .filter((other) => !same(other) && other.library.members.some((member) => memberKey(member) === sheetKey))
      .map((other) => other.library.title);
    if (titles.length > 0) alsoIn[sheetKey] = titles;
  }

  const ownerlessSheets = file.sheets
    .filter((sheet) => next.has(file.catalogue.id + "/" + sheet.sheetId) && sheet.provenance.owner === null)
    .map((sheet) => sheet.content.name);

  let status: LibraryStatus;
  if (context.operations.some(same)) status = "INTERRUPTED";
  else if (installed === null) status = "NOT_INSTALLED";
  else if (installed.targetKey === targetKey && added.length + attached.length + modified.length === 0) status = "UP_TO_DATE";
  else if (context.decisions.some((decision) => same(decision) && decision.targetKey === targetKey && decision.decision === "REFUSED")) status = "REFUSED";
  else status = "UPDATE_AVAILABLE";

  return {
    ...key,
    title: library.title,
    description: library.description,
    targetRevision: library.revision,
    targetKey,
    installedRevision: installed?.revision ?? null,
    status,
    memberCount: library.members.length,
    added,
    attached,
    modified,
    unchanged,
    toReview,
    removed,
    missingExternal,
    alsoIn,
    unknownOwner: library.owner === null || ownerlessSheets.length > 0,
    ownerlessLibrary: library.owner === null,
    ownerlessSheets,
  };
}
