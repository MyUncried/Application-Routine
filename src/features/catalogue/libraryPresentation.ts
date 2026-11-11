/**
 * A1 — Textes des écrans Bibliothèques (libellés Figma page 510:101, vérifiés le 11/11/2026).
 */
import type { CatalogueIssue, MovementCatalogueFile } from "@/domain/catalogue/MovementCatalogueFile";
import type { FieldComparison, SheetLoadItem } from "@/domain/catalogue/catalogueLoadPlan";
import type { LibraryPreview, LibraryReviewItem, ReviewReason } from "@/domain/catalogue/libraryPlan";
import { fieldLabel, formatValue } from "@/features/catalogue/catalogueLoadPresentation";

export const plural = (count: number, singular: string, pluralForm: string) => `${count} ${count > 1 ? pluralForm : singular}`;

/** Pastille et sous-titre d'une Bibliothèque dans « Bibliothèques disponibles » (Figma 12118:25124). */
export function availableLine(preview: LibraryPreview): { readonly subtitle: string; readonly pill: string; readonly tone: "neutral" | "action" | "positive" | "warning" } {
  const count = plural(preview.memberCount, "fiche", "fiches");
  switch (preview.status) {
    case "NOT_INSTALLED": return { subtitle: `${count} · non installée`, pill: "Installer", tone: "action" };
    case "UP_TO_DATE": return { subtitle: `${count} · installée`, pill: "À jour", tone: "positive" };
    case "UPDATE_AVAILABLE": return { subtitle: `${count} · révision ${preview.targetRevision} disponible`, pill: "Mettre à jour", tone: "action" };
    case "REFUSED": return { subtitle: `${count} · révision ${preview.targetRevision} refusée`, pill: "Refusée", tone: "neutral" };
    case "INTERRUPTED": return { subtitle: `${count} · opération interrompue`, pill: "Reprendre", tone: "warning" };
  }
}

export const REVIEW_REASON_LABELS: Readonly<Record<ReviewReason, string>> = {
  TO_RECONCILE: "Modifiée sur ce téléphone : à examiner fiche par fiche, rien n'est écrasé.",
  PERSONAL_ORIGIN: "Mouvement personnel : rattachement en attente de règle, rien n'est modifié.",
  NOT_APPLICABLE: "Non appliquée (révision incohérente ou refusée, ou mouvement retiré de ce téléphone).",
  BLOCKED: "Bloquée : Catégorie, Zone ou nom incompatible avec ce téléphone.",
};

/**
 * Demande de Hermann du 11/11/2026 (« Que veulent dire ces deux messages ? ») : la cause réelle d'une fiche non
 * appliquée, et ce qu'on peut faire, à la place d'une phrase qui regroupait trois causes.
 */
const NOT_APPLICABLE_LABELS: Readonly<Record<string, string>> = {
  WITHDRAWN_LOCALLY: "Archivé ou supprimé sur ce téléphone : il n'est ni réinstallé ni modifié. S'il est archivé, restaurez-le depuis le Catalogue pour recevoir ses mises à jour.",
  INCOHERENT_REVISION: "Révision incohérente : la version reçue ne prolonge pas celle installée sur ce téléphone (même numéro pour un contenu différent, ou historique sans la révision installée). Rien n'est modifié ; enregistrer une nouvelle modification de la fiche dans l'administration la propose de nouveau.",
  REFUSED_REVISION: "Révision refusée sur ce téléphone : elle n'est plus proposée. La prochaine révision de la fiche le sera.",
  INTERRUPTED: "Installation de cette fiche interrompue : elle sera reprise au prochain chargement.",
};

/** Libellé d'une fiche non appliquée par l'action groupée, avec sa cause précise. */
export function reviewLabel(entry: LibraryReviewItem): string {
  if (entry.reason === "NOT_APPLICABLE") return NOT_APPLICABLE_LABELS[entry.item.state] ?? REVIEW_REASON_LABELS.NOT_APPLICABLE;
  return REVIEW_REASON_LABELS[entry.reason];
}

/** Bandeau « Propriétaire inconnu » : ce qui le déclenche (Bibliothèque, fiches nommées) et sa conséquence. */
export function unknownOwnerText(preview: LibraryPreview): string {
  const causes: string[] = [];
  if (preview.ownerlessLibrary) causes.push("la bibliothèque n'a pas de propriétaire déclaré");
  const sheets = preview.ownerlessSheets;
  if (sheets.length > 0) {
    const shown = sheets.slice(0, 3).map((name) => `« ${name} »`).join(", ");
    const more = sheets.length > 3 ? ` et ${plural(sheets.length - 3, "autre", "autres")}` : "";
    causes.push(`${plural(sheets.length, "fiche", "fiches")} sans propriétaire déclaré (${shown}${more})`);
  }
  const cause = causes.length > 0 ? causes.join(" ; ") : "propriétaire non déclaré";
  return `Cause : ${cause}. Ces fiches s'utilisent normalement sur ce téléphone, mais ne peuvent être ni partagées, ni redistribuées. ` +
    "Pour lever cette restriction, renseignez le propriétaire dans l'administration.";
}

const PROJECTED_ORDER = ["content.name", "content.steps", "content.aliases", "classification.categoryId", "classification.bodyZoneIds"];

function changedComparisons(item: SheetLoadItem): readonly FieldComparison[] {
  return item.comparison.filter((field) => field.incomingChanged);
}

function shortValue(path: string, value: unknown, labels: ReadonlyMap<string, string>): string {
  if (path === "content.steps" && Array.isArray(value)) return plural(value.length, "étape", "étapes");
  return formatValue(path, value, labels);
}

/** Ligne de résumé d'une fiche modifiée (Figma 12118:25251 : « Étapes : 4 → 5 · Catégorie inchangée »). */
export function modifiedLine(item: SheetLoadItem, labels: ReadonlyMap<string, string>): string {
  const changed = changedComparisons(item);
  const projected = PROJECTED_ORDER
    .map((path) => changed.find((field) => field.path === path))
    .filter((field): field is FieldComparison => field !== undefined)
    .map((field) => `${fieldLabel(field.path)} : ${shortValue(field.path, field.installed, labels)} → ${shortValue(field.path, field.incoming, labels)}`);
  const editorial = changed.length - projected.length;
  const parts = [...projected];
  if (!changed.some((field) => field.path === "classification.categoryId")) parts.push("Catégorie inchangée");
  if (editorial > 0) parts.push(plural(editorial, "autre champ modifié", "autres champs modifiés"));
  return parts.join(" · ");
}

/** Détail d'une fiche (Figma 12118:25316) : champs modifiés et inchangés, valeurs lisibles. */
export function sheetDetail(item: SheetLoadItem, labels: ReadonlyMap<string, string>) {
  const rows = item.comparison.map((field) => ({
    path: field.path,
    label: fieldLabel(field.path),
    current: formatValue(field.path, field.installed === undefined ? field.local : field.installed, labels),
    next: formatValue(field.path, field.incoming, labels),
    changed: field.incomingChanged,
    conflict: field.conflict,
  }));
  return { changed: rows.filter((row) => row.changed), unchanged: rows.filter((row) => !row.changed) };
}

/** Problème lisible d'un fichier refusé (Figma 12119:25162 : « Fiche 12 « Burpee » — Zone corporelle inconnue »). */
export function issueLine(issue: CatalogueIssue, raw: unknown): string {
  const match = /^sheets\[(\d+)\](?:\.(.*))?$/.exec(issue.path);
  const code: Readonly<Record<string, string>> = {
    REQUIRED: "valeur manquante",
    INVALID: "valeur invalide",
    UNRECOGNIZED: "valeur non reconnue",
    DUPLICATE: "en double",
    INCONSISTENT: "incohérent",
    UNKNOWN_REFERENCE: "référence inconnue",
    MOVEMENT_CONTRACT: "incompatible avec un mouvement",
  };
  const reason = (code[issue.code] ?? issue.code) + (issue.detail ? ` (${issue.detail})` : "");
  if (!match) return `${issue.path || "Fichier"} — ${reason}`;
  const index = Number(match[1]);
  const sheets = (raw as { sheets?: unknown })?.sheets;
  const sheet = Array.isArray(sheets) ? (sheets[index] as { content?: { name?: unknown } } | undefined) : undefined;
  const name = typeof sheet?.content?.name === "string" && sheet.content.name ? ` « ${sheet.content.name} »` : "";
  const field = match[2] ? fieldLabel(match[2]) + " : " : "";
  return `Fiche ${index + 1}${name} — ${field}${reason}`;
}

/** Nom affichable d'une fiche (fichier, sinon identifiant). */
export function sheetName(file: MovementCatalogueFile, sheetId: string): string {
  return file.sheets.find((sheet) => sheet.sheetId === sheetId)?.content.name ?? sheetId;
}
