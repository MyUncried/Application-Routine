/**
 * T1 « Gestion des langues » (23/11/2026, RM-092, D-081) — garde-fou : aucun texte français destiné à l'utilisateur
 * ne doit réapparaître dans le code des écrans, de l'infrastructure ou des routes ; il passe par `strings`.
 *
 * Portée : `app/`, `src/features/`, `src/shared/ui/`, `src/infrastructure/`. `src/domain/` est hors portée : il est
 * aussi compilé pour l'administration et ne peut pas importer le catalogue ; ses textes (phrase de synthèse,
 * référentiels) relèvent des lots T6 et T7 (`docs/preparation/langues/T1-PLAN-EXTERNALISATION-TEXTES-2026-11-23.md`).
 *
 * Un littéral est signalé s'il contient une lettre accentuée, une apostrophe typographique ou des guillemets
 * français, ou s'il s'agit d'un texte JSX de plusieurs mots. Sont ignorés : commentaires, imports, types littéraux,
 * `testID`, arguments de `console.*`, messages d'`Error`.
 */
import { describe, expect, it } from "@jest/globals";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = path.resolve(__dirname, "../../..");
const SCOPES = ["app", "src/features", "src/shared/ui", "src/infrastructure"];

/** Exclusions motivées (plan T1, tableau « Exclus »). Chemins relatifs à la racine, préfixes acceptés. */
const EXCLUDED: readonly { readonly path: string; readonly reason: string }[] = [
  { path: "src/features/diagnostics/", reason: "écrans de diagnostic de développement" },
  { path: "src/shared/utils/devSoundDiagnosticMenu.ts", reason: "menu de développement" },
  { path: "app/diagnostic-sons.tsx", reason: "route de diagnostic de développement" },
  { path: "app/diagnostic-updates.tsx", reason: "route de diagnostic de développement" },
  { path: "app/catalogue-load.tsx", reason: "outil de recette « Routine Catalogue »" },
  { path: "src/features/catalogue/CatalogueLoadScreen.tsx", reason: "outil de recette « Routine Catalogue »" },
  { path: "src/features/catalogue/catalogueLoadPresentation.ts", reason: "outil de recette « Routine Catalogue »" },
  { path: "src/features/catalogue/CatalogueLoadCommand.tsx", reason: "outil de recette « Routine Catalogue »" },
  { path: "src/features/catalogue/pickCatalogueFile.ts", reason: "outil de recette « Routine Catalogue »" },
  { path: "src/features/activities/pilotMovementImport.ts", reason: "outil de recette « Routine Catalogue »" },
  { path: "src/features/activities/PilotMovementImportCommand.tsx", reason: "outil de recette « Routine Catalogue »" },
  { path: "src/features/activities/testing/", reason: "outils de test" },
  { path: "src/infrastructure/database/", reason: "migrations, dépôts et contrôles techniques" },
  { path: "src/features/sessions/sessionFormats.ts", reason: "libellés de référentiel KODJO (lot T7)" },
  { path: "src/features/reference-data/bodyZones.ts", reason: "référentiel KODJO des Zones (lot T7)" },
  { path: "src/features/activities/ActivityEditorForm.tsx", reason: "« Durée totale » de la phrase de synthèse (lot T6)" },
];

/** Littéraux techniques autorisés dans un fichier en portée : fichier, texte exact, motif. */
const ALLOWED_LITERALS: readonly { readonly path: string; readonly text: string; readonly reason: string }[] = [
  { path: "src/features/activities/loadOptionWidth.ts", text: "é", reason: "table de largeur de glyphes, pas un texte" },
  { path: "src/shared/ui/KodjoSplash.tsx", text: "Keep On. Do Just One.", reason: "slogan de marque, identique dans toutes les langues" },
  { path: "src/features/sessions/SessionFilterSheet.tsx", text: "Les catégories", reason: "libellé du journal console.error" },
  { path: "src/features/sessions/SessionFilterSheet.tsx", text: "Les étiquettes", reason: "libellé du journal console.error" },
];

const FRENCH = /[À-ÖØ-öø-ÿŒœ’«»]/;
const ENTITY = /&apos;|&quot;/;

type Finding = { file: string; line: number; text: string };

function isIgnoredContext(node: ts.Node): boolean {
  for (let current: ts.Node | undefined = node.parent; current !== undefined; current = current.parent) {
    if (ts.isImportDeclaration(current) || ts.isExportDeclaration(current) || ts.isLiteralTypeNode(current)) return true;
    if (ts.isJsxAttribute(current) && current.name.getText() === "testID") return true;
    if (ts.isCallExpression(current) && /^console\./.test(current.expression.getText())) return true;
    if (ts.isNewExpression(current) && /Error$/.test(current.expression.getText())) return true;
    if (ts.isCallExpression(current) && /^(require|describe|it|test)$|Journal$/.test(current.expression.getText())) return true;
  }
  return false;
}

function scanFile(file: string): Finding[] {
  const source = fs.readFileSync(file, "utf8");
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
  const findings: Finding[] = [];
  const visit = (node: ts.Node) => {
    let text: string | null = null;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) text = node.text;
    else if (ts.isTemplateExpression(node)) text = [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join("{}");
    else if (ts.isJsxText(node)) text = node.getText().trim();
    const relative = path.relative(ROOT, file).split(path.sep).join("/");
    const allowed = ALLOWED_LITERALS.some((entry) => entry.path === relative && entry.text === text);
    if (text !== null && text !== "" && !allowed && !isIgnoredContext(node)) {
      const jsxWords = ts.isJsxText(node) && /[A-Za-zÀ-ÿ]{2,}\s+[A-Za-zÀ-ÿ]{2,}/.test(text);
      if (FRENCH.test(text) || ENTITY.test(text) || jsxWords) {
        findings.push({ file: relative, line: tree.getLineAndCharacterOfPosition(node.getStart()).line + 1, text });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return findings;
}

function sourceFiles(directory: string): string[] {
  const absolute = path.join(ROOT, directory);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" || entry.name === "node_modules" ? [] : sourceFiles(relative);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path.join(ROOT, relative)] : [];
  });
}

describe("T1 — textes destinés à l'utilisateur hors du catalogue", () => {
  it("aucun texte français écrit dans le code des écrans, de l'infrastructure ou des routes", () => {
    const files = SCOPES.flatMap(sourceFiles).filter((file) => {
      const relative = path.relative(ROOT, file).split(path.sep).join("/");
      return !EXCLUDED.some((entry) => relative.startsWith(entry.path));
    });
    const findings = files.flatMap(scanFile).map((finding) => `${finding.file}:${finding.line} ${finding.text}`);
    expect(findings).toEqual([]);
  });
});
