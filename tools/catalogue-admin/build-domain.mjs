/**
 * Couche métier partagée de l'administration locale (W1, 11/11/2026).
 *
 * Transpile, sans aucune dépendance supplémentaire, la fermeture transitive des modules
 * `src/domain/**` utilisés par l'administration (format catalogue v2, édition, boîte d'arrivée)
 * en modules ESM JavaScript sous `tools/catalogue-admin/generated/` (non versionné).
 * Le serveur Node ET la page du navigateur importent ces mêmes modules : il n'existe
 * aucun second validateur. La transpilation utilise l'API du paquet `typescript` déjà
 * présent dans `node_modules` (`ts.transpileModule`, sans vérification de types).
 *
 * Réécritures : alias `@/x` → chemin relatif, et extension `.js` ajoutée aux imports
 * relatifs. Tout import externe (paquet npm) fait échouer la génération : le domaine
 * doit rester pur.
 *
 * Usage manuel : `node tools/catalogue-admin/build-domain.mjs` (le serveur l'appelle aussi
 * au démarrage ; la génération n'écrit que si une source a changé).
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const TOOL_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TOOL_DIR, "../..");
const SRC_DIR = path.join(REPO_ROOT, "src");
export const GENERATED_DIR = path.join(TOOL_DIR, "generated");
const MANIFEST = path.join(GENERATED_DIR, "manifest.json");

/** Points d'entrée du domaine partagé (chemins relatifs à `src/`). */
export const DOMAIN_ENTRY_POINTS = [
  "domain/catalogue/MovementCatalogueFile.ts",
  "domain/catalogue/catalogueEditing.ts",
  "domain/catalogue/MovementInbox.ts",
];

const SPECIFIER = /(?:\bimport|\bexport)\s[^;]*?\bfrom\s*["']([^"']+)["']|\bimport\s*["']([^"']+)["']/g;

function resolveSource(fromFile, specifier) {
  let base;
  if (specifier.startsWith("@/")) base = path.join(SRC_DIR, specifier.slice(2));
  else if (specifier.startsWith("./") || specifier.startsWith("../")) base = path.join(path.dirname(fromFile), specifier);
  else throw new Error("Import externe interdit dans le domaine partagé : " + specifier + " (" + path.relative(REPO_ROOT, fromFile) + ")");
  for (const candidate of [base + ".ts", path.join(base, "index.ts")]) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error("Module introuvable : " + specifier + " (" + path.relative(REPO_ROOT, fromFile) + ")");
}

/** Fermeture transitive des imports, dans un ordre stable. */
export function domainClosure(entries = DOMAIN_ENTRY_POINTS) {
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(SPECIFIER)) visit(resolveSource(file, match[1] ?? match[2]));
  };
  for (const entry of entries) visit(path.join(SRC_DIR, entry));
  return [...seen].sort();
}

const outputPathFor = (sourceFile) =>
  path.join(GENERATED_DIR, path.relative(REPO_ROOT, sourceFile)).replace(/\.ts$/, ".js");

function rewriteSpecifiers(sourceFile) {
  const outputFile = outputPathFor(sourceFile);
  const rewrite = (specifier) => {
    const target = outputPathFor(resolveSource(sourceFile, specifier));
    let relative = path.relative(path.dirname(outputFile), target).split(path.sep).join("/");
    if (!relative.startsWith(".")) relative = "./" + relative;
    return relative;
  };
  return (context) => (root) => {
    const { factory } = context;
    const visit = (node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        return factory.updateImportDeclaration(node, node.modifiers, node.importClause,
          factory.createStringLiteral(rewrite(node.moduleSpecifier.text)), node.attributes);
      }
      if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        return factory.updateExportDeclaration(node, node.modifiers, node.isTypeOnly, node.exportClause,
          factory.createStringLiteral(rewrite(node.moduleSpecifier.text)), node.attributes);
      }
      return node;
    };
    return ts.visitEachChild(root, visit, context);
  };
}

function atomicWrite(file, content) {
  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = file + ".tmp-" + process.pid + "-" + Math.random().toString(16).slice(2);
  writeFileSync(temporary, content);
  renameSync(temporary, file);
}

const digest = (text) => createHash("sha256").update(text).digest("hex");

/**
 * Génère les modules si une source (ou ce script) a changé. Retourne la liste des modules
 * générés, relatifs à `GENERATED_DIR` (liste blanche servie au navigateur).
 */
export function buildDomain({ force = false } = {}) {
  const files = domainClosure();
  const sources = files.map((file) => [path.relative(REPO_ROOT, file).split(path.sep).join("/"), readFileSync(file, "utf8")]);
  const fingerprint = digest(readFileSync(fileURLToPath(import.meta.url), "utf8") + ts.version +
    sources.map(([name, text]) => name + "\0" + text).join("\0"));
  const modules = sources.map(([name]) => name.replace(/\.ts$/, ".js"));
  if (!force && existsSync(MANIFEST)) {
    try {
      const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
      if (manifest.fingerprint === fingerprint && existsSync(path.join(GENERATED_DIR, "package.json")) &&
          modules.every((name) => existsSync(path.join(GENERATED_DIR, name)))) {
        return manifest.modules;
      }
    } catch {
      // Manifeste illisible : régénération complète ci-dessous.
    }
  }
  rmSync(path.join(GENERATED_DIR, "src"), { recursive: true, force: true });
  files.forEach((file, index) => {
    const result = ts.transpileModule(sources[index][1], {
      fileName: file,
      reportDiagnostics: true,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        isolatedModules: true,
        verbatimModuleSyntax: false,
        sourceMap: false,
      },
      transformers: { after: [rewriteSpecifiers(file)] },
    });
    const errors = (result.diagnostics ?? []).filter((d) => d.category === ts.DiagnosticCategory.Error);
    if (errors.length > 0) {
      throw new Error("Transpilation impossible de " + sources[index][0] + " : " +
        errors.map((d) => ts.flattenDiagnosticMessageText(d.messageText, " ")).join(" ; "));
    }
    atomicWrite(outputPathFor(file), "// Généré par tools/catalogue-admin/build-domain.mjs depuis " +
      sources[index][0] + " — ne pas modifier.\n" + result.outputText);
  });
  // Modules ESM explicites pour Node (le package.json racine de l'application n'est pas `type: module`).
  atomicWrite(path.join(GENERATED_DIR, "package.json"), JSON.stringify({ type: "module", private: true }) + "\n");
  atomicWrite(MANIFEST, JSON.stringify({ fingerprint, typescript: ts.version, modules }, null, 2) + "\n");
  return modules;
}

/** URL `file:` d'un module généré, pour `import()` côté serveur. */
export const generatedModuleUrl = (sourcePath) =>
  pathToFileURL(path.join(GENERATED_DIR, sourcePath.replace(/\.ts$/, ".js"))).href;

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const modules = buildDomain({ force: process.argv.includes("--force") });
  console.log("Domaine partagé généré : " + modules.length + " modules dans " + path.relative(REPO_ROOT, GENERATED_DIR));
}
