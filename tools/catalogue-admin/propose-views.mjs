/**
 * Marquage des photos (D-600) — propositions en lot pour un fichier catalogue.
 *
 * Pour chaque photo intégrée, détecte les vues (`viewDetection.js`, même module que la page) et
 * propose la vue retenue. Avec `--write`, n'ajoute QUE la clé `view` des photos (image simple : aucune
 * clé, l'image est retenue entière) ; tout le reste du fichier est conservé à l'identique, ce qui est
 * contrôlé avant écriture. Aucune révision n'est calculée : ce sont des propositions, que la personne
 * qui publie vérifie ensuite dans la page « Marquage des photos ».
 *
 * Décodage : Node ne décode pas le WebP. Les photos sont converties en PNG temporaires par le décodeur
 * WIC de Windows (PowerShell, `System.Windows.Media.Imaging`), puis lues avec `pngjs` (déjà présent
 * dans `node_modules`). Windows uniquement.
 *
 * Usage (racine du dépôt) :
 *   node tools/catalogue-admin/propose-views.mjs [--file <catalogue.json>] [--write] [--replace] [--work-dir <dossier>]
 *   --file      défaut : catalogue/illustrations/kodjo-pilote-60.illustre-v3.json
 *   --write     écrit les propositions dans le fichier (sinon : tableau seulement)
 *   --replace   remplace aussi les vues déjà présentes (défaut : photos sans vue seulement)
 *   --work-dir  dossier des fichiers temporaires (défaut : dossier temporaire du système, supprimé à la fin)
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";

import { buildDomain, generatedModuleUrl } from "./build-domain.mjs";
import { proposeView } from "./viewDetection.js";

const TOOL_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TOOL_DIR, "../..");
const DEFAULT_FILE = "catalogue/illustrations/kodjo-pilote-60.illustre-v3.json";

function option(name) {
  const index = process.argv.indexOf(name);
  return index > 0 ? process.argv[index + 1] : undefined;
}

/** Conversion en PNG par WIC (Windows). */
function convertToPng(sourceDir, targetDir) {
  if (process.platform !== "win32") throw new Error("Décodage WebP disponible sous Windows uniquement (WIC).");
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "Add-Type -AssemblyName PresentationCore",
    "$src = $env:KODJO_MARQUAGE_SRC; $dst = $env:KODJO_MARQUAGE_DST",
    "foreach ($f in Get-ChildItem -LiteralPath $src -File) {",
    "  $s = [System.IO.File]::OpenRead($f.FullName)",
    "  try { $d = [System.Windows.Media.Imaging.BitmapDecoder]::Create($s, [System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat, [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad) } finally { $s.Close() }",
    "  $e = New-Object System.Windows.Media.Imaging.PngBitmapEncoder",
    "  $e.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($d.Frames[0]))",
    "  $o = [System.IO.File]::Create((Join-Path $dst ($f.BaseName + '.png')))",
    "  try { $e.Save($o) } finally { $o.Close() }",
    "}",
  ].join("\n");
  execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")], {
    env: { ...process.env, KODJO_MARQUAGE_SRC: sourceDir, KODJO_MARQUAGE_DST: targetDir },
    stdio: ["ignore", "ignore", "pipe"],
  });
}

const withoutViews = (file) => ({
  ...file,
  sheets: file.sheets.map((sheet) => ({
    ...sheet,
    media: sheet.media.map((media) => {
      const { view: _view, ...rest } = media;
      return rest;
    }),
  })),
});

async function main() {
  const relativeFile = option("--file") ?? DEFAULT_FILE;
  const filePath = path.resolve(REPO_ROOT, relativeFile);
  const write = process.argv.includes("--write");
  const replace = process.argv.includes("--replace");
  const raw = readFileSync(filePath, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const text = raw.replace(/\r\n/g, "\n");
  const original = JSON.parse(text);

  buildDomain();
  const { parseMovementCatalogueFile, serializeMovementCatalogueFile } =
    await import(generatedModuleUrl("src/domain/catalogue/MovementCatalogueFile.ts"));
  const parsed = parseMovementCatalogueFile(JSON.parse(text));
  if (!parsed.ok) throw new Error("Fichier catalogue invalide avant marquage : " + JSON.stringify(parsed.issues.slice(0, 5)));
  if (serializeMovementCatalogueFile(original) !== text) {
    throw new Error("Le fichier n'est pas dans la sérialisation de référence : écriture refusée (le diff ne serait pas limité aux vues).");
  }

  const ownWorkDir = option("--work-dir") === undefined;
  const workDir = ownWorkDir ? mkdtempSync(path.join(tmpdir(), "kodjo-marquage-")) : path.resolve(option("--work-dir"));
  const encodedDir = path.join(workDir, "source");
  const pngDir = path.join(workDir, "png");
  mkdirSync(encodedDir, { recursive: true });
  mkdirSync(pngDir, { recursive: true });
  const rows = [];
  try {
    const targets = [];
    original.sheets.forEach((sheet, sheetIndex) => sheet.media.forEach((media, mediaIndex) => {
      if (media.kind !== "PHOTO" || media.storage !== "EMBEDDED") return;
      const match = /^data:image\/(jpeg|webp|png);base64,(.+)$/.exec(media.url);
      if (!match) return;
      const base = "s" + String(sheetIndex).padStart(4, "0") + "-m" + String(mediaIndex).padStart(2, "0");
      writeFileSync(path.join(encodedDir, base + "." + match[1]), Buffer.from(match[2], "base64"));
      targets.push({ base, sheetIndex, mediaIndex });
    }));
    convertToPng(encodedDir, pngDir);
    const { PNG } = createRequire(path.join(REPO_ROOT, "package.json"))("pngjs");
    const converted = new Set(readdirSync(pngDir));
    for (const target of targets) {
      const sheet = original.sheets[target.sheetIndex];
      const media = sheet.media[target.mediaIndex];
      if (!converted.has(target.base + ".png")) throw new Error("Conversion manquante : " + sheet.sheetId + " / " + media.id);
      const png = PNG.sync.read(readFileSync(path.join(pngDir, target.base + ".png")));
      const proposal = proposeView(png.width, png.height, png.data);
      const existing = media.view ?? null;
      const applied = existing === null || replace;
      rows.push({ sheet, media, proposal, existing, applied, target });
    }
  } finally {
    if (ownWorkDir) rmSync(workDir, { recursive: true, force: true });
  }

  const pct = (v) => v.x + " ; " + v.y + " ; " + v.width + " ; " + v.height;
  console.log("| Fiche | Photo | Taille | Vues | Règle | Vue proposée (x ; y ; l ; h, %) | Remarques |");
  console.log("|---|---|---|---|---|---|---|");
  for (const { sheet, media, proposal, existing, applied } of rows) {
    const notes = [...proposal.notes];
    if (!applied) notes.push("vue existante conservée (" + pct(existing) + ")");
    console.log("| " + [sheet.sheetId, media.id, proposal.width + "×" + proposal.height, proposal.views.length, proposal.rule,
      proposal.view ? pct(proposal.view) : "image entière", notes.join(" ; ") || ""].join(" | ") + " |");
  }
  const counts = {};
  for (const { proposal } of rows) counts[proposal.views.length] = (counts[proposal.views.length] ?? 0) + 1;
  console.log("\nPhotos : " + rows.length + " ; nombre de vues → photos : " + JSON.stringify(counts));

  if (!write) {
    console.log("Aucune écriture (ajouter --write pour appliquer les propositions).");
    return;
  }
  const next = JSON.parse(text);
  for (const { proposal, applied, target } of rows) {
    if (!applied) continue;
    const media = next.sheets[target.sheetIndex].media[target.mediaIndex];
    if (proposal.view) media.view = proposal.view;
    else delete media.view;
  }
  // Contrôles : seules des clés `view` changent ; fichier valide pour le parseur partagé.
  if (!isDeepStrictEqual(withoutViews(next), withoutViews(original))) throw new Error("Contrôle échoué : autre chose que des vues a changé.");
  const checked = parseMovementCatalogueFile(JSON.parse(JSON.stringify(next)));
  if (!checked.ok) throw new Error("Fichier invalide après marquage : " + JSON.stringify(checked.issues.slice(0, 5)));
  const output = serializeMovementCatalogueFile(next);
  writeFileSync(filePath, eol === "\n" ? output : output.replace(/\n/g, eol));
  const written = rows.filter((row) => row.applied && row.proposal.view).length;
  console.log("Écrit : " + path.relative(REPO_ROOT, filePath) + " — " + written + " vues proposées, " +
    rows.filter((row) => row.applied && !row.proposal.view).length + " images entières (aucune clé).");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
