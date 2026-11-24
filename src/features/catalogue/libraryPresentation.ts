/**
 * A1 — Textes des écrans Bibliothèques (libellés Figma page 510:101, vérifiés le 11/11/2026).
 */
import type { CatalogueIssue, MovementCatalogueFile } from "@/domain/catalogue/MovementCatalogueFile";
import type { FieldComparison, SheetLoadItem } from "@/domain/catalogue/catalogueLoadPlan";
import type { LibraryPreview, LibraryReviewItem, ReviewReason } from "@/domain/catalogue/libraryPlan";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { fieldLabel, formatValue } from "@/features/catalogue/catalogueLoadPresentation";
import { strings } from "@/shared/i18n";
import { pluralOf } from "@/shared/i18n/plural";

const L = strings.libraries.presentation;

export const plural = (count: number, singular: string, pluralForm: string) => `${count} ${pluralOf(count, { one: singular, other: pluralForm })}`;

/** Pastille et sous-titre d'une Bibliothèque dans « Bibliothèques disponibles » (Figma 12118:25124). */
export function availableLine(preview: LibraryPreview): { readonly subtitle: string; readonly pill: string; readonly tone: "neutral" | "action" | "positive" | "warning" } {
  const count = plural(preview.memberCount, strings.libraries.common.sheetSingular, strings.libraries.common.sheetPlural);
  const line = (status: LibraryPreview["status"]) => ({ subtitle: fillTemplate(L.available[status].subtitle, { count }), pill: L.available[status].pill });
  switch (preview.status) {
    case "NOT_INSTALLED": return { ...line("NOT_INSTALLED"), tone: "action" };
    case "UP_TO_DATE": return { ...line("UP_TO_DATE"), tone: "positive" };
    // Recette du 13/11 (x-d-maj, x-d-compteurs) : textes et traçabilité dans `strings.libraries.presentation.available`.
    case "UPDATE_AVAILABLE": return { ...line("UPDATE_AVAILABLE"), tone: "action" };
    case "REFUSED": return { ...line("REFUSED"), tone: "neutral" };
    case "INTERRUPTED": return { ...line("INTERRUPTED"), tone: "warning" };
  }
}

export const REVIEW_REASON_LABELS: Readonly<Record<ReviewReason, string>> = L.reviewReasons;

/**
 * Demande de Hermann du 11/11/2026 (« Que veulent dire ces deux messages ? ») : la cause réelle d'une fiche non
 * appliquée, et ce qu'on peut faire, à la place d'une phrase qui regroupait trois causes.
 */
const NOT_APPLICABLE_LABELS: Readonly<Record<string, string>> = L.notApplicable;

/** Libellé d'une fiche non appliquée par l'action groupée, avec sa cause précise. */
export function reviewLabel(entry: LibraryReviewItem): string {
  if (entry.reason === "NOT_APPLICABLE") return NOT_APPLICABLE_LABELS[entry.item.state] ?? REVIEW_REASON_LABELS.NOT_APPLICABLE;
  return REVIEW_REASON_LABELS[entry.reason];
}

/**
 * Bandeau « Propriétaire inconnu » (Figma 12118:25170). Constat d) du 12/11/2026 : affiché uniquement si le
 * propriétaire de la bibliothèque est inconnu, avec ce texte. [Avant : « Cause : … » nommant aussi les fiches sans
 * propriétaire (recette fn14 du 11/11) — remplacé.]
 */
export const UNKNOWN_LIBRARY_OWNER_TEXT: string = L.unknownOwner;

const PROJECTED_ORDER = ["content.name", "content.steps", "content.aliases", "classification.categoryId", "classification.bodyZoneIds"];

function changedComparisons(item: SheetLoadItem): readonly FieldComparison[] {
  return item.comparison.filter((field) => field.incomingChanged);
}

function shortValue(path: string, value: unknown, labels: ReadonlyMap<string, string>): string {
  if (path === "content.steps" && Array.isArray(value)) return plural(value.length, L.stepSingular, L.stepPlural);
  return formatValue(path, value, labels);
}

/** Ligne de résumé d'une fiche modifiée (Figma 12118:25251 : « Étapes : 4 → 5 · Catégorie inchangée »). */
export function modifiedLine(item: SheetLoadItem, labels: ReadonlyMap<string, string>): string {
  const changed = changedComparisons(item);
  const projected = PROJECTED_ORDER
    .map((path) => changed.find((field) => field.path === path))
    .filter((field): field is FieldComparison => field !== undefined)
    .map((field) => fillTemplate(L.modifiedField, { field: fieldLabel(field.path), from: shortValue(field.path, field.installed, labels), to: shortValue(field.path, field.incoming, labels) }));
  const editorial = changed.length - projected.length;
  const parts = [...projected];
  if (!changed.some((field) => field.path === "classification.categoryId")) parts.push(L.categoryUnchanged);
  if (editorial > 0) parts.push(plural(editorial, L.otherFieldSingular, L.otherFieldPlural));
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
  const code: Readonly<Record<string, string>> = L.issueCodes;
  const reason = (code[issue.code] ?? issue.code) + (issue.detail ? fillTemplate(L.issueDetail, { detail: issue.detail }) : "");
  if (!match) return fillTemplate(L.issueGlobal, { path: issue.path || L.issueFile, reason });
  const index = Number(match[1]);
  const sheets = (raw as { sheets?: unknown })?.sheets;
  const sheet = Array.isArray(sheets) ? (sheets[index] as { content?: { name?: unknown } } | undefined) : undefined;
  const name = typeof sheet?.content?.name === "string" && sheet.content.name ? fillTemplate(L.issueSheetName, { name: sheet.content.name }) : "";
  const field = match[2] ? fillTemplate(L.issueField, { field: fieldLabel(match[2]) }) : "";
  return fillTemplate(L.issueSheet, { n: String(index + 1), name, field, reason });
}

/** Nom affichable d'une fiche (fichier, sinon identifiant). */
export function sheetName(file: MovementCatalogueFile, sheetId: string): string {
  return file.sheets.find((sheet) => sheet.sheetId === sheetId)?.content.name ?? sheetId;
}
