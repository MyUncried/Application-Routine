/**
 * Marquage des photos (D-600) — propositions en lot pour un fichier catalogue.
 *
 * Pour chaque photo intégrée, détecte les vues (`viewDetection.js`, même module que la page) et
 * propose la vue retenue. Avec `--write`, applique les vues (image simple : aucune clé, l'image est
 * retenue entière) par le calcul de révision du domaine (`applyFileEdit`, comme l'enregistrement du
 * serveur) : chaque fiche dont une vue change reçoit une révision et une entrée d'historique
 * (« Marquage des photos : vue retenue proposée », auteur inconnu, date du moment), et la révision du
 * catalogue avance. Sans cela, le téléphone verrait une empreinte différente sous la même révision
 * (`INCOHERENT_REVISION`, `catalogueLoadPlan.ts`). Rien d'autre ne change, ce qui est contrôlé avant
 * écriture. Ce sont des propositions, que la personne qui publie vérifie ensuite dans la page
 * « Marquage des photos ».
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

export const MARKING_REVISION_SUMMARY = "Marquage des photos : vue retenue proposée";

/** Domaine partagé (mêmes modules que le serveur). */
export async function loadDomain() {
  buildDomain();
  const file = await import(generatedModuleUrl("src/domain/catalogue/MovementCatalogueFile.ts"));
  const editing = await import(generatedModuleUrl("src/domain/catalogue/catalogueEditing.ts"));
  return { ...file, applyFileEdit: editing.applyFileEdit };
}

/**
 * Applique des vues (`[{ sheetId, mediaId, view | null }]`, null = image entière) à un fichier catalogue
 * valide, avec le calcul de révision du domaine. Contrôle que seules changent : la clé `view` des médias
 * visés, la révision et l'historique (une entrée ajoutée) des fiches concernées, la révision du catalogue.
 * @returns {{ file: object, changedSheets: string[], changed: boolean }}
 */
export function applyViewsWithRevisions(source, views, meta, domain) {
  const previous = domain.parseMovementCatalogueFile(structuredClone(source));
  if (!previous.ok) throw new Error("Fichier catalogue invalide avant marquage : " + JSON.stringify(previous.issues.slice(0, 5)));
  const edited = structuredClone(previous.file);
  for (const { sheetId, mediaId, view } of views) {
    const media = edited.sheets.find((sheet) => sheet.sheetId === sheetId)?.media.find((entry) => entry.id === mediaId);
    if (!media) throw new Error("Photo introuvable : " + sheetId + " / " + mediaId);
    if (view) media.view = view;
    else delete media.view;
  }
  const checked = domain.parseMovementCatalogueFile(edited);
  if (!checked.ok) throw new Error("Fichier invalide après marquage : " + JSON.stringify(checked.issues.slice(0, 5)));
  const result = domain.applyFileEdit(previous.file, checked.file, meta);
  if (!result.ok) throw new Error("Calcul des révisions refusé : " + JSON.stringify(result.issues));
  const file = JSON.parse(domain.serializeMovementCatalogueFile(result.file));
  const reread = domain.parseMovementCatalogueFile(structuredClone(file));
  if (!reread.ok) throw new Error("Revalidation impossible après calcul des révisions");

  // Contrôles de portée.
  const before = JSON.parse(domain.serializeMovementCatalogueFile(previous.file));
  const changed = new Set(result.changedSheets);
  const { sheets: sheetsAfter, catalogue: headerAfter, ...restAfter } = file;
  const { sheets: sheetsBefore, catalogue: headerBefore, ...restBefore } = before;
  if (!isDeepStrictEqual(restAfter, restBefore)) throw new Error("Contrôle échoué : autre chose que des fiches a changé.");
  if (!isDeepStrictEqual({ ...headerAfter, revision: null }, { ...headerBefore, revision: null })) {
    throw new Error("Contrôle échoué : l'en-tête du catalogue a changé au-delà de sa révision.");
  }
  if (sheetsAfter.length !== sheetsBefore.length) throw new Error("Contrôle échoué : nombre de fiches modifié.");
  sheetsAfter.forEach((sheet, index) => {
    const old = sheetsBefore[index];
    if (!changed.has(sheet.sheetId)) {
      if (!isDeepStrictEqual(sheet, old)) throw new Error("Contrôle échoué : fiche " + sheet.sheetId + " modifiée sans révision.");
      return;
    }
    const core = (entry) => withoutViews({ sheets: [{ ...entry, revision: null, history: null }] }).sheets[0];
    if (!isDeepStrictEqual(core(sheet), core(old))) throw new Error("Contrôle échoué : fiche " + sheet.sheetId + " modifiée au-delà des vues.");
    if (sheet.revision === old.revision || sheet.history.length !== old.history.length + 1 ||
        !isDeepStrictEqual(sheet.history.slice(0, -1), old.history) || sheet.history.at(-1).revision !== sheet.revision) {
      throw new Error("Contrôle échoué : révision ou historique incohérent pour " + sheet.sheetId + ".");
    }
  });
  return { file, changedSheets: result.changedSheets, changed: result.changed };
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

  const domain = await loadDomain();
  const { parseMovementCatalogueFile, serializeMovementCatalogueFile } = domain;
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
  // Même calcul que l'enregistrement du serveur (`editMeta` sans auteur déclaré : auteur inconnu, date du moment).
  const meta = { date: new Date().toISOString(), author: null, summary: MARKING_REVISION_SUMMARY };
  const views = rows.filter((row) => row.applied).map(({ sheet, media, proposal }) => ({ sheetId: sheet.sheetId, mediaId: media.id, view: proposal.view }));
  const result = applyViewsWithRevisions(original, views, meta, domain);
  if (!result.changed) {
    console.log("Aucun changement : fichier non réécrit.");
    return;
  }
  const output = serializeMovementCatalogueFile(result.file);
  writeFileSync(filePath, eol === "\n" ? output : output.replace(/\n/g, eol));
  console.log("Écrit : " + path.relative(REPO_ROOT, filePath) + " — " + result.changedSheets.length + " fiche(s) révisée(s), " +
    "révision du catalogue " + original.catalogue.revision + " → " + result.file.catalogue.revision + ".");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
