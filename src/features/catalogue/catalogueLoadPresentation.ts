/**
 * CA-4 — Présentation du chargement de catalogue (outil de recette interne, hors MVP, sans
 * référence Figma) : libellés d'états et de champs, résumé systématique, valeurs lisibles.
 * Aucune décision n'est prise ici.
 */
import type { CatalogueWarning, MovementCatalogueFile } from "@/domain/catalogue/MovementCatalogueFile";
import type {
  EditorialSection,
  FieldComparison,
  ProjectedField,
  SheetBlocker,
  SheetLoadItem,
  SheetLoadState,
} from "@/domain/catalogue/catalogueLoadPlan";

/** Ordre d'affichage : fiches qui attendent une décision d'abord. */
export const STATE_ORDER: readonly SheetLoadState[] = [
  "NEW_REVISION",
  "TO_RECONCILE",
  "NEW",
  "ADOPTABLE",
  "INTERRUPTED",
  "INCOHERENT_REVISION",
  "REFUSED_REVISION",
  "WITHDRAWN_LOCALLY",
  "OLDER_REVISION",
  "UP_TO_DATE",
];

export const STATE_LABELS: Readonly<Record<SheetLoadState, string>> = {
  NEW_REVISION: "Nouvelle révision",
  TO_RECONCILE: "À rapprocher",
  NEW: "Nouvelle fiche",
  ADOPTABLE: "Déjà présente, identique",
  INTERRUPTED: "Opération interrompue",
  INCOHERENT_REVISION: "Révision incohérente",
  REFUSED_REVISION: "Révision refusée",
  WITHDRAWN_LOCALLY: "Retirée sur ce téléphone",
  OLDER_REVISION: "Révision antérieure",
  UP_TO_DATE: "À jour",
};

/** États pour lesquels le destinataire peut accepter, reporter ou refuser. */
export const DECIDABLE_STATES: ReadonlySet<SheetLoadState> = new Set(["NEW_REVISION", "TO_RECONCILE", "NEW", "ADOPTABLE"]);

const SECTION_LABELS: Readonly<Record<EditorialSection, string>> = {
  provenance: "provenance",
  content: "contenu",
  classification: "classification",
  sources: "sources",
  validation: "validation",
  media: "médias",
  levelGroup: "famille de niveaux",
};

const FIELD_LABELS: Readonly<Record<string, string>> = {
  "content.name": "Nom",
  levelGroup: "Famille de niveaux",
  "levelGroup.groupId": "Famille de niveaux",
  "levelGroup.sortKey": "Position dans la famille",
  "content.aliases": "Alias",
  "content.steps": "Étapes",
  "content.startingPosition": "Position de départ",
  "content.equipment": "Matériel",
  "content.safetyNotes": "Sécurité",
  "content.notes": "Notes",
  "classification.categoryId": "Catégorie",
  "classification.bodyZoneIds": "Zones",
  "classification.specialtyIds": "Spécialités",
  "classification.gesturalFamilyIds": "Familles gestuelles",
  "classification.clinicalProblemIds": "Problèmes cliniques",
  "classification.anatomicalTargetIds": "Cibles anatomiques",
  "classification.basis": "Fondement de la classification",
  "provenance.origin": "Origine",
  "provenance.upstream": "Source d'import",
  "provenance.owner": "Propriétaire",
  "provenance.authors": "Auteurs",
  "provenance.publisher": "Diffuseur",
  "provenance.rightsHolder": "Ayant droit",
  "provenance.license": "Licence",
  "provenance.reviewStatus": "Statut éditorial",
  "provenance.visibility": "Visibilité",
  "provenance.gestureId": "Geste",
  "sources.documentary.sourceId": "Référence documentaire",
  "sources.documentary.section": "Section documentaire",
  "sources.documentary.url": "Lien documentaire",
  "sources.documentary.usageStatement": "Conditions d'usage",
  "validation.publicationAllowed": "Publication autorisée",
  media: "Médias",
};

export function fieldLabel(path: string): string {
  return FIELD_LABELS[path] ?? path;
}

/** Libellés des référentiels du fichier (Catégories, Zones, taxonomie) pour l'affichage des identifiants. */
export function referenceLabels(file: MovementCatalogueFile): ReadonlyMap<string, string> {
  const labels = new Map<string, string>();
  for (const entries of Object.values(file.references)) {
    for (const entry of entries) labels.set(entry.id, entry.label);
  }
  return labels;
}

const REFERENCE_PATHS = new Set([
  "classification.categoryId",
  "classification.bodyZoneIds",
  "classification.specialtyIds",
  "classification.gesturalFamilyIds",
  "classification.clinicalProblemIds",
  "classification.anatomicalTargetIds",
]);

/** Valeur lisible ; `undefined` = absente, `null` = non renseignée. */
export function formatValue(path: string, value: unknown, labels: ReadonlyMap<string, string>): string {
  if (value === undefined) return "—";
  if (value === null || value === "") return "Non renseigné";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (REFERENCE_PATHS.has(path)) {
    const ids = Array.isArray(value) ? (value as string[]) : [String(value)];
    return ids.length === 0 ? "Aucune" : ids.map((id) => labels.get(id) ?? id).join(", ");
  }
  if (path === "content.steps" && Array.isArray(value)) {
    return value.length === 0 ? "Aucune" : value.map((step, index) => `${index + 1}. ${String(step)}`).join("\n");
  }
  if (path === "media" && Array.isArray(value)) return `${value.length} média(s)`;
  if (Array.isArray(value)) {
    if (value.length === 0) return "Aucun";
    return value.map((item) => (typeof item === "string" ? item : actorOrJson(item))).join(", ");
  }
  if (typeof value === "object") return actorOrJson(value);
  return String(value);
}

function actorOrJson(value: unknown): string {
  if (typeof value === "object" && value !== null && "kind" in value && "id" in value) {
    const actor = value as { kind: string; id: string };
    return `${actor.id} (${actor.kind})`;
  }
  return JSON.stringify(value);
}

const fieldList = (fields: readonly ProjectedField[]) => fields.map(fieldLabel).join(", ");

function blockerText(blocker: SheetBlocker, labels: ReadonlyMap<string, string>): string {
  if (blocker.code === "NAME_CONFLICT") return "Nom déjà utilisé par un autre mouvement de ce téléphone.";
  const what = blocker.field === "categoryId" ? "Catégorie absente" : "Zone(s) absente(s)";
  return `${what} de ce téléphone : ${blocker.ids.map((id) => labels.get(id) ?? id).join(", ") || "non renseignée"}.`;
}

/** Résumé systématique d'une fiche, présenté avant toute décision (y compris sans conflit). */
export function summaryLines(item: SheetLoadItem, labels: ReadonlyMap<string, string>): readonly string[] {
  const { summary } = item;
  const lines: string[] = [];
  switch (item.state) {
    case "NEW":
      lines.push("Nouvelle fiche : un mouvement sera ajouté au Catalogue.");
      break;
    case "ADOPTABLE":
      lines.push("Mouvement déjà présent et identique : rattachement sans aucune modification du mouvement.");
      break;
    case "TO_RECONCILE":
      lines.push("Mouvement probablement déjà présent, sans historique d'installation : chaque différence est à trancher.");
      break;
    case "NEW_REVISION":
      lines.push(`Révision ${item.installedRevision ?? "?"} → ${item.revision}.`);
      break;
    case "UP_TO_DATE":
      lines.push("Aucune nouveauté.");
      break;
    case "OLDER_REVISION":
      lines.push(`Révision ${item.revision} antérieure à la révision installée (${item.installedRevision ?? "?"}) : ignorée.`);
      break;
    case "INCOHERENT_REVISION":
      lines.push("Contenu différent sous le même numéro de révision, ou historique rompu : fiche à corriger dans le fichier.");
      break;
    case "REFUSED_REVISION":
      lines.push(`Révision ${item.revision} déjà refusée : elle ne sera plus proposée.`);
      break;
    case "WITHDRAWN_LOCALLY":
      lines.push("Mouvement supprimé ou archivé sur ce téléphone : ni réinstallé ni modifié.");
      break;
    case "INTERRUPTED":
      lines.push("Opération interrompue : elle sera reprise au prochain chargement.");
      break;
  }
  if (item.state !== "NEW" && summary.changedFields > 0) {
    const sections = (Object.keys(summary.bySection) as EditorialSection[])
      .filter((section) => summary.bySection[section] > 0)
      .map((section) => `${SECTION_LABELS[section]} ${summary.bySection[section]}`);
    lines.push(`${summary.changedFields} champ(s) différent(s) : ${sections.join(", ")}.`);
  }
  if (item.state !== "NEW" && summary.movementFields.length > 0) {
    lines.push(`Le mouvement sera modifié : ${fieldList(summary.movementFields)}.`);
  }
  if (summary.conflicts.length > 0) {
    lines.push(`Conflit avec tes modifications : ${fieldList(summary.conflicts)}. Ton choix est nécessaire ; à défaut, la révision reste reportée.`);
  }
  if (summary.keptLocal.length > 0) lines.push(`Tes modifications conservées : ${fieldList(summary.keptLocal)}.`);
  if (item.state === "NEW_REVISION" && summary.editorialOnly) {
    lines.push("Changements éditoriaux uniquement : le mouvement ne sera pas modifié.");
  }
  if (item.deferred) lines.push("Révision déjà reportée.");
  for (const blocker of item.blockers) lines.push(blockerText(blocker, labels));
  return lines;
}

/** Ligne courte de la liste. */
export function shortSummary(item: SheetLoadItem): string {
  const parts: string[] = [];
  if (item.summary.conflicts.length > 0) parts.push(`${item.summary.conflicts.length} conflit(s)`);
  if (item.state === "NEW_REVISION") {
    parts.push(item.summary.editorialOnly ? "éditorial seulement" : `mouvement : ${fieldList(item.summary.movementFields)}`);
  }
  if (item.deferred) parts.push("reportée");
  if (item.blockers.length > 0) parts.push("bloquée");
  return parts.join(" · ");
}

/** Signalements non bloquants du fichier (propriétaire inconnu, homonymie). */
export function warningLines(warnings: readonly CatalogueWarning[]): readonly string[] {
  const lines: string[] = [];
  const unknownOwners = warnings.filter((warning) => warning.code === "UNKNOWN_OWNER").length;
  if (unknownOwners > 0) {
    lines.push(`Propriétaire inconnu (${unknownOwners}) : chargement privé possible, aucune publication.`);
  }
  const homonyms = warnings.filter((warning) => warning.code === "DUPLICATE_NAME").length;
  if (homonyms > 0) lines.push(`${homonyms} fiche(s) homonyme(s) dans le fichier.`);
  return lines;
}

/** Comparaison triée : conflits, puis champs du mouvement, puis le reste par section. */
export function orderedComparison(comparison: readonly FieldComparison[]): readonly FieldComparison[] {
  const rank = (entry: FieldComparison) => (entry.conflict ? 0 : entry.projected ? 1 : 2);
  return [...comparison].sort((a, b) => rank(a) - rank(b));
}
