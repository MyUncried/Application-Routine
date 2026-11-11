/**
 * CA-3 — Classification pure d'un chargement de catalogue (aucune E/S, aucune écriture).
 *
 * Trois termes (plan, § 5) : B = fiche installée (instantané du registre), L = Mouvement local
 * actuel, R = fiche du fichier. Le suivi couvre TOUTES les propriétés éditoriales de la fiche ;
 * seuls cinq champs sont projetés sur le Mouvement et peuvent donc entrer en conflit avec une
 * modification locale.
 *
 * Décisions de Hermann du 10/11/2026 :
 * - conflit : la modification locale est conservée et la révision reportée par défaut ; aucun
 *   écrasement, refus ni remplacement automatique, la décision appartient au destinataire ;
 * - acceptation fiche par fiche, avec un résumé systématique des changements et une comparaison
 *   détaillée champ par champ qui identifie précisément les conflits ;
 * - aucun mécanisme de fusion automatique.
 */
import { decodeInstructionSteps } from "@/domain/activities/instructionSteps";
import { normalizeMovementName, type Movement } from "@/domain/activities/Movement";
import {
  canonicalJson,
  projectSheetToMovement,
  sheetFingerprint,
  type CatalogueSheet,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";

// ——— Registre (instantané lu par le service ; stockage : SqliteCatalogueRegistry) ———

export type SheetKey = { readonly catalogueId: string; readonly sheetId: string };

export type InstalledSheetRecord = SheetKey & {
  readonly movementId: string;
  readonly revision: string;
  readonly fingerprint: string;
  /** Instantané éditorial complet installé (B), provenance comprise. */
  readonly sheet: CatalogueSheet;
  readonly installedAt: string;
  readonly updatedAt: string;
};

/** Valeur locale sauvegardée avant qu'un choix explicite ne la remplace. */
export type SavedLocalValue = { readonly field: ProjectedField; readonly value: unknown };

/** Opération commencée (écriture du Mouvement) et non encore confirmée dans le registre. */
export type PendingOperation = SheetKey & {
  readonly kind: "INSTALL" | "UPDATE";
  readonly movementId: string;
  /** Fiche dont l'installation est en cours (devient B à la confirmation). */
  readonly sheet: CatalogueSheet;
  /** Mouvement visé par l'écriture. */
  readonly movement: Movement;
  readonly savedLocalValues: readonly SavedLocalValue[];
  readonly createdAt: string;
};

export type SheetDecision = "REFUSED" | "DEFERRED";

export type SheetDecisionRecord = SheetKey & {
  readonly revision: string;
  readonly decision: SheetDecision;
  readonly decidedAt: string;
};

export type RegistryState = {
  readonly installed: readonly InstalledSheetRecord[];
  readonly pending: readonly PendingOperation[];
  readonly decisions: readonly SheetDecisionRecord[];
};

export type LocalMovement = { readonly movement: Movement; readonly archived: boolean };

export type LocalReferentials = {
  readonly categoryIds: ReadonlySet<string>;
  readonly bodyZoneIds: ReadonlySet<string>;
};

// ——— Comparaison champ par champ ———

/** Champs de la fiche projetés sur le Mouvement (seuls susceptibles de conflit local). */
export const PROJECTED_FIELDS = [
  "content.name",
  "content.aliases",
  "content.steps",
  "classification.categoryId",
  "classification.bodyZoneIds",
] as const;
export type ProjectedField = (typeof PROJECTED_FIELDS)[number];

export type EditorialSection = "provenance" | "content" | "classification" | "sources" | "validation" | "media" | "levelGroup";

export type FieldComparison = {
  /** Chemin dans la fiche, ex. `content.steps`, `provenance.owner`, `classification.original.Objectif`. */
  readonly path: string;
  readonly section: EditorialSection;
  /** Valeur installée (B) ; `undefined` si la fiche n'a jamais été installée ou si le champ était absent. */
  readonly installed: unknown;
  /** Valeur du fichier (R) ; `undefined` si le champ a disparu. */
  readonly incoming: unknown;
  /** Valeur actuelle du Mouvement local, pour les seuls champs projetés. */
  readonly local?: unknown;
  readonly projected: boolean;
  /** R diffère de B (ou B inconnu). */
  readonly incomingChanged: boolean;
  /** L diffère de B (champs projetés ; B inconnu : L diffère de R). */
  readonly localModified: boolean;
  /** Modification locale ET nouvelle valeur différente sur le même champ. */
  readonly conflict: boolean;
};

export type ChangeSummary = {
  /** Nombre de champs différents (entre B et R, ou avec L pour les champs projetés). */
  readonly changedFields: number;
  readonly bySection: Readonly<Record<EditorialSection, number>>;
  /** Champs dont l'acceptation modifierait le Mouvement (sans conflit). */
  readonly movementFields: readonly ProjectedField[];
  /** Champs en conflit, à résoudre explicitement avant toute acceptation. */
  readonly conflicts: readonly ProjectedField[];
  /** Champs modifiés localement et conservés (aucun changement entrant sur eux). */
  readonly keptLocal: readonly ProjectedField[];
  /** Modifications purement éditoriales (hors Mouvement). */
  readonly editorialOnly: boolean;
};

// ——— États ———

export type SheetLoadState =
  /** Aucune trace locale : installation proposée. */
  | "NEW"
  /** Mouvement déjà présent (identifiant connu du fichier) et identique : rattachement au registre seul. */
  | "ADOPTABLE"
  /** Mouvement local probable (identifiant connu ou même nom) sans base fiable : rapprochement explicite. */
  | "TO_RECONCILE"
  | "UP_TO_DATE"
  | "NEW_REVISION"
  /** Révision du fichier antérieure à la révision installée : ignorée. */
  | "OLDER_REVISION"
  /** Même révision et empreinte différente, ou filiation de révisions rompue : refusée. */
  | "INCOHERENT_REVISION"
  /** Révision déjà refusée par le destinataire. */
  | "REFUSED_REVISION"
  /** Mouvement installé supprimé ou archivé localement : ni réinstallé ni modifié. */
  | "WITHDRAWN_LOCALLY"
  /** Opération interrompue non reprise (voir `recoverInterrupted`). */
  | "INTERRUPTED";

/**
 * A-2 (11/11/2026) : rattacher un Mouvement **personnel** à une fiche (création éditoriale `LOCAL_CREATED`, ou
 * Mouvement envoyé par le téléphone puis rapproché : `install.personalMovementIds`) le rendrait importé, donc
 * verrouillé. Cette transition n'est pas arbitrée : elle n'est jamais appliquée (ni rattachement, ni rapprochement).
 * Les 60 Mouvements du pilote (fiches `EXTERNAL_IMPORTED`) ne sont pas concernés (A-2, point 8).
 */
export function isPendingPersonalAttachment(sheet: CatalogueSheet, item: Pick<SheetLoadItem, "state" | "movementId">): boolean {
  if (item.movementId === null || (item.state !== "ADOPTABLE" && item.state !== "TO_RECONCILE")) return false;
  return sheet.provenance.origin === "LOCAL_CREATED" || (sheet.install.personalMovementIds ?? []).includes(item.movementId);
}

export type SheetBlocker =
  | { readonly code: "LOCAL_REFERENCE_MISSING"; readonly field: "categoryId" | "bodyZoneIds"; readonly ids: readonly string[] }
  | { readonly code: "NAME_CONFLICT"; readonly movementId: string };

export type SheetLoadItem = SheetKey & {
  readonly state: SheetLoadState;
  readonly name: string;
  readonly revision: string;
  readonly installedRevision: string | null;
  /** Mouvement local concerné (installé, connu ou homonyme), s'il existe. */
  readonly movementId: string | null;
  /** Révision déjà reportée : elle est reproposée à chaque chargement. */
  readonly deferred: boolean;
  /** Empêchements à l'écriture du Mouvement (référentiels du téléphone, homonymie). */
  readonly blockers: readonly SheetBlocker[];
  /** Résumé systématique, présenté avant toute acceptation. */
  readonly summary: ChangeSummary;
  /** Comparaison détaillée, à la demande. */
  readonly comparison: readonly FieldComparison[];
  /** Proposition par défaut ; jamais appliquée sans décision du destinataire. */
  readonly recommended: "DEFER" | null;
};

export type CatalogueLoadPlan = {
  readonly catalogueId: string;
  readonly items: readonly SheetLoadItem[];
};

// ——— Implémentation ———

const SECTIONS: readonly EditorialSection[] = ["provenance", "content", "classification", "sources", "validation", "media", "levelGroup"];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Feuilles éditoriales comparées : objets dépliés tant qu'ils existent des deux côtés, tableaux et
 * références d'acteurs comparés en entier (ordre ou ensemble). Clé : chemin ; valeur : [avant, après].
 */
function editorialPairs(before: CatalogueSheet | null, after: CatalogueSheet): Map<string, [unknown, unknown]> {
  const pairs = new Map<string, [unknown, unknown]>();
  const isActor = (value: unknown) => isPlainObject(value) && "kind" in value && "id" in value;
  const visit = (a: unknown, b: unknown, path: string) => {
    const expandable = (value: unknown) => value === undefined || (isPlainObject(value) && !isActor(value) && Object.keys(value).length > 0);
    if (expandable(a) && expandable(b) && (a !== undefined || b !== undefined)) {
      const left = (a ?? {}) as Record<string, unknown>;
      const right = (b ?? {}) as Record<string, unknown>;
      for (const key of new Set([...Object.keys(left), ...Object.keys(right)])) visit(left[key], right[key], path + "." + key);
    } else {
      pairs.set(path, [a, b]);
    }
  };
  for (const section of SECTIONS) visit(before === null ? undefined : before[section], after[section], section);
  return pairs;
}

const lastKey = (path: string) => path.slice(path.lastIndexOf(".") + 1);
const same = (path: string, a: unknown, b: unknown) =>
  canonicalJson(a === undefined ? null : a, lastKey(path)) === canonicalJson(b === undefined ? null : b, lastKey(path));

/** Valeur locale d'un champ projeté, exprimée comme dans la fiche (étapes décodées). */
export function localValueOf(movement: Movement, field: ProjectedField): unknown {
  switch (field) {
    case "content.name": return movement.name;
    case "content.aliases": return [...movement.aliases];
    case "content.steps": return decodeInstructionSteps(movement.description);
    case "classification.categoryId": return movement.categoryId;
    case "classification.bodyZoneIds": return [...movement.bodyZoneIds];
  }
}

/** Valeur d'un champ projeté dans la fiche, normalisée comme la projection Mouvement. */
export function sheetValueOf(sheet: CatalogueSheet, field: ProjectedField): unknown {
  return localValueOf(projectSheetToMovement(sheet, "-"), field);
}

/** Applique une valeur de fiche (champ projeté) au Mouvement, sans toucher aux autres propriétés. */
export function withProjectedValue(movement: Movement, sheet: CatalogueSheet, field: ProjectedField): Movement {
  const projection = projectSheetToMovement(sheet, movement.id);
  switch (field) {
    case "content.name": return { ...movement, name: projection.name };
    case "content.aliases": return { ...movement, aliases: projection.aliases };
    case "content.steps": return { ...movement, description: projection.description };
    case "classification.categoryId": return { ...movement, categoryId: projection.categoryId };
    case "classification.bodyZoneIds": return { ...movement, bodyZoneIds: projection.bodyZoneIds };
  }
}

/** Les champs projetés du Mouvement local égalent-ils ceux de la fiche ? */
export function movementMatchesSheet(movement: Movement, sheet: CatalogueSheet): boolean {
  return PROJECTED_FIELDS.every((field) => same(field, localValueOf(movement, field), sheetValueOf(sheet, field)));
}

/**
 * Comparaison détaillée B / R (toutes propriétés éditoriales) et, pour les champs projetés, L.
 * `installed = null` : aucune base fiable (fiche nouvelle ou registre perdu).
 */
export function compareSheet(
  installed: CatalogueSheet | null,
  incoming: CatalogueSheet,
  local: Movement | null,
): readonly FieldComparison[] {
  const projectedPaths = new Set<string>(PROJECTED_FIELDS);
  const result: FieldComparison[] = [];
  for (const [path, [was, now]] of editorialPairs(installed, incoming)) {
    const section = path.slice(0, path.indexOf(".") < 0 ? path.length : path.indexOf(".")) as EditorialSection;
    if (projectedPaths.has(path)) continue;
    const incomingChanged = installed === null || !same(path, was, now);
    if (!incomingChanged) continue;
    result.push({
      path, section, installed: was, incoming: now,
      projected: false, incomingChanged, localModified: false, conflict: false,
    });
  }
  for (const field of PROJECTED_FIELDS) {
    const base = installed === null ? undefined : sheetValueOf(installed, field);
    const next = sheetValueOf(incoming, field);
    const current = local === null ? undefined : localValueOf(local, field);
    // Sans base : comparaison directe L / R (fiche nouvelle : tout est entrant).
    const incomingChanged = installed === null ? local === null || !same(field, current, next) : !same(field, base, next);
    const localModified = local !== null && (installed === null ? !same(field, current, next) : !same(field, current, base));
    const conflict = localModified && incomingChanged && !same(field, current, next);
    if (!incomingChanged && !localModified) continue;
    result.push({
      path: field,
      section: field.startsWith("content.") ? "content" : "classification",
      installed: base,
      incoming: next,
      ...(local === null ? {} : { local: current }),
      projected: true,
      incomingChanged,
      localModified,
      conflict,
    });
  }
  return result;
}

/** Résumé systématique d'une comparaison. */
export function summarize(comparison: readonly FieldComparison[]): ChangeSummary {
  const bySection = Object.fromEntries(SECTIONS.map((section) => [section, 0])) as Record<EditorialSection, number>;
  const movementFields: ProjectedField[] = [];
  const conflicts: ProjectedField[] = [];
  const keptLocal: ProjectedField[] = [];
  for (const entry of comparison) {
    bySection[entry.section]++;
    if (!entry.projected) continue;
    const field = entry.path as ProjectedField;
    if (entry.conflict) conflicts.push(field);
    else if (entry.incomingChanged && !entry.localModified) movementFields.push(field);
    else if (entry.localModified && !entry.incomingChanged) keptLocal.push(field);
  }
  return {
    changedFields: comparison.length,
    bySection,
    movementFields,
    conflicts,
    keptLocal,
    editorialOnly: movementFields.length === 0 && conflicts.length === 0,
  };
}

function referenceBlockers(sheet: CatalogueSheet, referentials: LocalReferentials): SheetBlocker[] {
  const blockers: SheetBlocker[] = [];
  const category = sheet.classification.categoryId;
  if (category === null || !referentials.categoryIds.has(category)) {
    blockers.push({ code: "LOCAL_REFERENCE_MISSING", field: "categoryId", ids: category === null ? [] : [category] });
  }
  const zones = sheet.classification.bodyZoneIds.filter((id) => !referentials.bodyZoneIds.has(id));
  if (zones.length > 0) blockers.push({ code: "LOCAL_REFERENCE_MISSING", field: "bodyZoneIds", ids: zones });
  return blockers;
}

const keyOf = (key: SheetKey) => key.catalogueId + "\u0000" + key.sheetId;

/**
 * Classe chaque fiche du fichier (déjà validé par `parseMovementCatalogueFile`). Aucune écriture.
 * Une fiche absente du fichier n'est jamais signalée pour suppression.
 */
export function planCatalogueLoad(
  file: MovementCatalogueFile,
  registry: RegistryState,
  localMovements: readonly LocalMovement[],
  referentials: LocalReferentials,
): CatalogueLoadPlan {
  const catalogueId = file.catalogue.id;
  const installedByKey = new Map(registry.installed.map((record) => [keyOf(record), record]));
  const pendingByKey = new Map(registry.pending.map((operation) => [keyOf(operation), operation]));
  const registeredMovements = new Set(registry.installed.map((record) => record.movementId));
  const localById = new Map(localMovements.map((entry) => [entry.movement.id, entry]));
  const localByName = new Map(localMovements.map((entry) => [normalizeMovementName(entry.movement.name), entry]));
  const decisionOf = (sheetId: string, revision: string) =>
    registry.decisions.find((d) => d.catalogueId === catalogueId && d.sheetId === sheetId && d.revision === revision)?.decision;

  const items = file.sheets.map((sheet): SheetLoadItem => {
    const key = { catalogueId, sheetId: sheet.sheetId };
    const installed = installedByKey.get(keyOf(key)) ?? null;
    const decision = decisionOf(sheet.sheetId, sheet.revision);
    const make = (
      state: SheetLoadState,
      base: CatalogueSheet | null,
      local: LocalMovement | null,
      blockers: SheetBlocker[] = [],
    ): SheetLoadItem => {
      const comparison = compareSheet(base, sheet, local?.movement ?? null);
      const summary = summarize(comparison);
      return {
        ...key,
        state,
        name: sheet.content.name,
        revision: sheet.revision,
        installedRevision: installed?.revision ?? null,
        movementId: local?.movement.id ?? installed?.movementId ?? null,
        deferred: decision === "DEFERRED",
        blockers,
        summary,
        comparison,
        recommended: summary.conflicts.length > 0 ? "DEFER" : null,
      };
    };
    // Blocages d'écriture : référentiels du téléphone et homonymie avec un autre Mouvement.
    const writeBlockers = (target: LocalMovement | null): SheetBlocker[] => {
      const blockers = referenceBlockers(sheet, referentials);
      const homonym = localByName.get(normalizeMovementName(sheet.content.name));
      if (homonym && homonym.movement.id !== target?.movement.id) {
        blockers.push({ code: "NAME_CONFLICT", movementId: homonym.movement.id });
      }
      return blockers;
    };

    if (pendingByKey.has(keyOf(key))) return make("INTERRUPTED", installed?.sheet ?? null, null);

    if (installed !== null) {
      const local = localById.get(installed.movementId) ?? null;
      if (local === null || local.archived) return make("WITHDRAWN_LOCALLY", installed.sheet, local);
      if (sheet.revision === installed.revision) {
        return sheetFingerprint(sheet) === installed.fingerprint
          ? make("UP_TO_DATE", installed.sheet, local)
          : make("INCOHERENT_REVISION", installed.sheet, local);
      }
      const incomingHistory = sheet.history.map((entry) => entry.revision);
      const installedHistory = installed.sheet.history.map((entry) => entry.revision);
      if (incomingHistory.slice(0, -1).includes(installed.revision)) {
        if (decision === "REFUSED") return make("REFUSED_REVISION", installed.sheet, local);
        return make("NEW_REVISION", installed.sheet, local, writeBlockers(local));
      }
      if (installedHistory.includes(sheet.revision)) return make("OLDER_REVISION", installed.sheet, local);
      return make("INCOHERENT_REVISION", installed.sheet, local);
    }

    if (decision === "REFUSED") return make("REFUSED_REVISION", null, null);
    // Rapprochement : identifiant local connu du fichier, puis homonymie (jamais automatique).
    const known = sheet.install.knownLocalMovementIds
      .map((id) => localById.get(id))
      .find((entry): entry is LocalMovement => entry !== undefined && !registeredMovements.has(entry.movement.id));
    if (known) {
      if (known.archived) return make("WITHDRAWN_LOCALLY", null, known);
      return movementMatchesSheet(known.movement, sheet)
        ? make("ADOPTABLE", null, known)
        : make("TO_RECONCILE", null, known, writeBlockers(known));
    }
    const homonym = localByName.get(normalizeMovementName(sheet.content.name));
    if (homonym && !registeredMovements.has(homonym.movement.id) && !homonym.archived) {
      return make("TO_RECONCILE", null, homonym, writeBlockers(homonym));
    }
    return make("NEW", null, null, writeBlockers(null));
  });
  return { catalogueId, items };
}
