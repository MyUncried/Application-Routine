/**
 * Administration locale du catalogue KODJO — format v2 (W1) et connexion Wi-Fi (W2), 11/11/2026.
 *
 * Deux serveurs `node:http`, sans dépendance :
 * - **administration** : 127.0.0.1 uniquement (port 4738), en-tête Host local exigé, adresse
 *   distante de bouclage exigée ; édite directement `catalogue/catalogues/*.catalogue.json` ;
 * - **téléphone** (option `--lan` ou `KODJO_ADMIN_LAN=1`) : port distinct (4739) sur le réseau
 *   local, n'expose QUE l'API `/phone/*` (aucune route d'administration).
 *
 * Validation : uniquement le domaine partagé de l'application (`src/domain/**`), transpilé par
 * `build-domain.mjs` et importé ici comme par la page du navigateur. Aucun second validateur.
 * Écritures : file sérialisée, fichier temporaire puis renommage (atomique), révision optimiste
 * (empreinte SHA-256 des octets du fichier → 409 si périmée). Les révisions éditoriales sont
 * calculées ici à partir du fichier sur disque (`applyFileEdit`) : un client ne peut pas les forger.
 * Rien n'est envoyé sur Internet ni sur l'hébergement OVH.
 */
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { readdir, readFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildDomain, GENERATED_DIR, generatedModuleUrl } from "./build-domain.mjs";
import { atomicWrite, createInboxStore, createPairingStore } from "./phone.mjs";

const TOOL_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TOOL_DIR, "../..");

const DOMAIN_MODULES = buildDomain();
const catalogueDomain = await import(generatedModuleUrl("src/domain/catalogue/MovementCatalogueFile.ts"));
const editing = await import(generatedModuleUrl("src/domain/catalogue/catalogueEditing.ts"));
const inboxDomain = await import(generatedModuleUrl("src/domain/catalogue/MovementInbox.ts"));
const { parseMovementCatalogueFile, serializeMovementCatalogueFile, MOVEMENT_CATALOGUE_FORMAT_VERSION } = catalogueDomain;

export const ADMIN_PORT = 4738;
export const PHONE_PORT = 4739;
/** Catalogue avec photos intégrées (même plafond que l'export de l'administration Web). */
export const MAX_CATALOGUE_BODY = 24 * 1024 * 1024;
export const MAX_ADMIN_BODY = 64 * 1024;
export const MAX_PAIR_BODY = 4 * 1024;
export const MAX_INBOX_BODY = 1024 * 1024;
const CATALOGUE_FILE = /^[a-z0-9][a-z0-9._-]{0,100}\.catalogue\.json$/;
const LOCAL_HOST = /^(?:127\.0\.0\.1|localhost|\[::1\]):[0-9]{1,5}$/;
const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

/**
 * Défense en profondeur de l'API téléphone : seules les adresses de réseau local (RFC 1918,
 * liens locaux, bouclage, IPv6 ULA/lien local) sont servies, même si le pare-feu laissait passer
 * une connexion venue d'ailleurs.
 */
export function isLocalNetworkAddress(address) {
  const ip = String(address ?? "").replace(/^::ffff:/i, "");
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
  }
  const v6 = ip.toLowerCase();
  return v6 === "::1" || /^f[cd][0-9a-f]{2}:/.test(v6) || /^fe[89ab][0-9a-f]:/.test(v6);
}
const ACTOR_KINDS = ["LOCAL_USER", "PERSON", "ORGANIZATION", "PLATFORM"];

const STATIC_ASSETS = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
  "/media.js": ["media.js", "text/javascript; charset=utf-8"],
  "/styles.css": ["styles.css", "text/css; charset=utf-8"],
};
const DOMAIN_ASSETS = new Set(DOMAIN_MODULES.map((name) => "/domain/" + name));

const digest = (data) => createHash("sha256").update(data).digest("hex");

class HttpError extends Error {
  constructor(status, code, extra = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

const ADMIN_CSP = "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; " +
  "img-src 'self' data: blob: https:; media-src https:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

function baseHeaders(response, csp) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Security-Policy", csp);
}

function sendJson(response, status, value, extra = {}) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    ...extra,
  });
  response.end(body);
}

function sendBytes(response, status, bytes, contentType, extra = {}) {
  response.writeHead(status, { "Content-Type": contentType, "Content-Length": bytes.length, ...extra });
  response.end(bytes);
}

async function readBody(request, limit) {
  const declared = Number(request.headers["content-length"] ?? 0);
  if (declared > limit) throw new HttpError(413, "TOO_LARGE");
  let total = 0;
  const chunks = [];
  for await (const chunk of request) {
    total += chunk.length;
    if (total > limit) throw new HttpError(413, "TOO_LARGE");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJson(request, limit) {
  if (!/^application\/json\b/i.test(request.headers["content-type"] ?? "")) throw new HttpError(415, "JSON_REQUIRED");
  const bytes = await readBody(request, limit);
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new HttpError(400, "INVALID_JSON");
  }
}

function lanAddresses() {
  const found = [];
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) if (entry.family === "IPv4" && !entry.internal) found.push(entry.address);
  }
  return found;
}

function validActorOrNull(value) {
  if (value === null || value === undefined) return true;
  return typeof value === "object" && ACTOR_KINDS.includes(value.kind) && typeof value.id === "string" &&
    value.id.trim() !== "" && value.id.length <= 128;
}

/** Métadonnées de révision : date du serveur, auteur déclaré (ou inconnu) et résumé borné. */
function editMeta(body, now, fallback) {
  const meta = body?.meta ?? {};
  if (!validActorOrNull(meta.author)) throw new HttpError(422, "INVALID_REVISION_AUTHOR");
  if (meta.summary !== undefined && (typeof meta.summary !== "string" || meta.summary.length > 300)) {
    throw new HttpError(422, "INVALID_REVISION_SUMMARY");
  }
  return {
    date: new Date(now()).toISOString(),
    author: meta.author ? { kind: meta.author.kind, id: meta.author.id.trim() } : null,
    summary: (meta.summary ?? "").trim() || fallback,
  };
}

/**
 * @param {{ dataRoot?: string, now?: () => number, lan?: boolean, persistDevices?: boolean, name?: string }} options
 */
export async function createAdminApp({
  dataRoot = REPO_ROOT,
  now = () => Date.now(),
  lan = false,
  persistDevices = true,
  name = "Administration KODJO locale",
} = {}) {
  const cataloguesDir = path.join(dataRoot, "catalogue/catalogues");
  const adminDir = path.join(dataRoot, "catalogue/admin");
  let writeQueue = Promise.resolve();
  const serialize = (work) => {
    const next = writeQueue.then(work);
    writeQueue = next.catch(() => {});
    return next;
  };
  const pairing = await createPairingStore({
    now, serialize, file: persistDevices ? path.join(adminDir, "appareils.json") : null,
  });
  const inbox = createInboxStore({
    dir: path.join(adminDir, "inbox"), now, serialize, fingerprint: inboxDomain.inboxMovementFingerprint,
  });
  const lanState = { enabled: lan, port: null };

  // ---------- Catalogues (noms de fichiers issus du seul listage du dossier) ----------

  async function listFileNames() {
    try {
      return (await readdir(cataloguesDir)).filter((entry) => CATALOGUE_FILE.test(entry)).sort();
    } catch (error) {
      if (error?.code === "ENOENT") return [];
      throw error;
    }
  }

  async function readCatalogue(fileName) {
    const names = await listFileNames();
    if (!names.includes(fileName)) throw new HttpError(404, "UNKNOWN_CATALOGUE_FILE");
    const bytes = await readFile(path.join(cataloguesDir, fileName));
    const etag = digest(bytes);
    let parsed;
    try {
      parsed = parseMovementCatalogueFile(JSON.parse(bytes.toString("utf8").replace(/^﻿/, "")));
    } catch {
      parsed = { ok: false, issues: [{ path: "", code: "INVALID", detail: "JSON illisible" }] };
    }
    const canonical = parsed.ok ? serializeMovementCatalogueFile(parsed.file) : null;
    return { fileName, bytes, etag, parsed, canonical };
  }

  async function summaries() {
    const list = [];
    for (const fileName of await listFileNames()) {
      const entry = await readCatalogue(fileName);
      list.push(entry.parsed.ok
        ? {
            fileName, etag: entry.etag, ok: true, catalogueId: entry.parsed.file.catalogue.id,
            title: entry.parsed.file.catalogue.title, revision: entry.parsed.file.catalogue.revision,
            sheetCount: entry.parsed.file.sheets.length, libraryCount: entry.parsed.file.libraries.length,
            sourceFormatVersion: entry.parsed.sourceFormatVersion,
          }
        : { fileName, etag: entry.etag, ok: false, issueCount: entry.parsed.issues.length });
    }
    return list;
  }

  /**
   * Enregistrement commun (édition, ajout depuis la boîte d'arrivée, rapprochement), dans la
   * file d'écriture : contrôle de révision optimiste, validation partagée, calcul des révisions,
   * revalidation, écriture atomique de la sérialisation de référence.
   */
  function saveCatalogue(fileName, expectedEtag, mutate, meta, afterWrite, precheck) {
    return serialize(async () => {
      // Contrôle dans la file d'écriture (revue du 11/11) : aucune décision concurrente sur le même élément.
      if (precheck) await precheck();
      const current = await readCatalogue(fileName);
      if (typeof expectedEtag !== "string" || expectedEtag !== current.etag) {
        throw new HttpError(409, "STALE_REVISION", { etag: current.etag });
      }
      if (!current.parsed.ok) throw new HttpError(409, "CURRENT_FILE_INVALID", { issues: current.parsed.issues });
      let edited;
      try {
        edited = mutate(current.parsed.file);
      } catch (error) {
        if (error?.name === "CatalogueEditError") throw new HttpError(422, error.code, { detail: error.detail });
        throw error;
      }
      const checked = parseMovementCatalogueFile(edited);
      if (!checked.ok) throw new HttpError(422, "INVALID_CATALOGUE", { issues: checked.issues });
      const result = editing.applyFileEdit(current.parsed.file, checked.file, meta);
      if (!result.ok) throw new HttpError(422, "FORBIDDEN_EDIT", { issues: result.issues });
      if (!result.changed) {
        const outcome = { saved: false, etag: current.etag, revision: current.parsed.file.catalogue.revision };
        if (afterWrite) outcome.after = await afterWrite(current.parsed.file);
        return outcome;
      }
      const reread = parseMovementCatalogueFile(JSON.parse(serializeMovementCatalogueFile(result.file)));
      if (!reread.ok) throw new Error("Revalidation impossible après calcul des révisions");
      const text = serializeMovementCatalogueFile(result.file);
      await atomicWrite(path.join(cataloguesDir, fileName), text);
      const outcome = {
        saved: true,
        etag: digest(Buffer.from(text, "utf8")),
        revision: result.file.catalogue.revision,
        changedSheets: result.changedSheets,
        createdSheets: result.createdSheets,
        installChangedSheets: result.installChangedSheets,
        changedLibraries: result.changedLibraries,
        createdLibraries: result.createdLibraries,
      };
      if (afterWrite) outcome.after = await afterWrite(result.file);
      return outcome;
    });
  }

  /** catalogueId → nom de fichier, pour l'API téléphone (identifiants ambigus exclus). */
  async function catalogueIndex() {
    const index = new Map();
    for (const fileName of await listFileNames()) {
      const entry = await readCatalogue(fileName);
      if (!entry.parsed.ok) continue;
      const id = entry.parsed.file.catalogue.id;
      index.set(id, index.has(id) ? null : entry);
    }
    return index;
  }

  // ---------- API d'administration (bouclage uniquement) ----------

  async function handleAdmin(request, response) {
    baseHeaders(response, ADMIN_CSP);
    const host = request.headers.host ?? "";
    if (!LOCAL_HOST.test(host) || !LOOPBACK.has(request.socket.remoteAddress ?? "")) {
      return sendJson(response, 403, { error: "LOCAL_HOST_REQUIRED" });
    }
    const url = new URL(request.url ?? "/", "http://" + host);
    const route = url.pathname;
    const method = request.method ?? "GET";

    if (method === "GET" && STATIC_ASSETS[route]) {
      const [file, type] = STATIC_ASSETS[route];
      return sendBytes(response, 200, await readFile(path.join(TOOL_DIR, file)), type);
    }
    if (method === "GET" && DOMAIN_ASSETS.has(route)) {
      const bytes = await readFile(path.join(GENERATED_DIR, route.slice("/domain/".length)));
      return sendBytes(response, 200, bytes, "text/javascript; charset=utf-8");
    }
    if (!route.startsWith("/api/")) return sendJson(response, 404, { error: "NOT_FOUND" });

    // Toute écriture : même origine et JSON (aucune requête « simple » inter-sites).
    if (method !== "GET" && request.headers.origin !== "http://" + host) {
      return sendJson(response, 403, { error: "SAME_ORIGIN_REQUIRED" });
    }
    const parts = route.split("/").slice(2).map(decodeURIComponent);

    if (method === "GET" && route === "/api/status") {
      return sendJson(response, 200, {
        name, formatVersion: MOVEMENT_CATALOGUE_FORMAT_VERSION,
        lan: { enabled: lanState.enabled, port: lanState.port, addresses: lanState.enabled ? lanAddresses() : [] },
        pairing: pairing.status(),
      });
    }
    if (method === "GET" && route === "/api/catalogues") {
      return sendJson(response, 200, { catalogues: await summaries() });
    }
    if (parts[0] === "catalogues" && parts.length >= 2) {
      const fileName = parts[1];
      if (!CATALOGUE_FILE.test(fileName)) throw new HttpError(404, "UNKNOWN_CATALOGUE_FILE");
      if (method === "GET" && parts.length === 2) {
        const entry = await readCatalogue(fileName);
        return sendJson(response, 200, entry.parsed.ok
          ? { fileName, etag: entry.etag, ok: true, file: entry.parsed.file, warnings: entry.parsed.warnings,
              sourceFormatVersion: entry.parsed.sourceFormatVersion,
              canonical: Buffer.from(entry.canonical, "utf8").equals(entry.bytes) }
          : { fileName, etag: entry.etag, ok: false, issues: entry.parsed.issues });
      }
      if (method === "GET" && parts.length === 3 && parts[2] === "export") {
        const entry = await readCatalogue(fileName);
        if (!entry.parsed.ok) throw new HttpError(422, "INVALID_CATALOGUE", { issues: entry.parsed.issues });
        return sendBytes(response, 200, Buffer.from(entry.canonical, "utf8"), "application/json; charset=utf-8", {
          "Content-Disposition": 'attachment; filename="' + fileName + '"',
          ETag: '"' + digest(Buffer.from(entry.canonical, "utf8")) + '"',
        });
      }
      if (method === "PUT" && parts.length === 2) {
        const body = await readJson(request, MAX_CATALOGUE_BODY);
        const meta = editMeta(body, now, "Modification dans l'administration locale");
        return sendJson(response, 200, await saveCatalogue(fileName, body?.etag, () => body?.file, meta));
      }
    }
    if (method === "GET" && route === "/api/inbox") {
      return sendJson(response, 200, { items: await inbox.list() });
    }
    if (method === "POST" && parts[0] === "inbox" && parts.length === 3) {
      const body = await readJson(request, MAX_ADMIN_BODY);
      if (body === null || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "INVALID_JSON");
      const item = await inbox.get(parts[1]);
      if (!item) throw new HttpError(404, "UNKNOWN_INBOX_ITEM");
      if (item.status !== "PENDING") throw new HttpError(409, "ALREADY_PROCESSED", { status: item.status });
      const action = parts[2];
      const stillPending = async () => {
        const fresh = await inbox.get(item.itemId);
        if (!fresh || fresh.status !== "PENDING") throw new HttpError(409, "ALREADY_PROCESSED", { status: fresh?.status ?? null });
      };
      if (action === "dismiss") {
        const marked = await serialize(async () => {
          await stillPending();
          return inbox.mark(item.itemId, "DISMISSED", null);
        });
        return sendJson(response, 200, { item: marked });
      }
      if (action !== "add" && action !== "link") throw new HttpError(404, "NOT_FOUND");
      if (typeof body.fileName !== "string" || !CATALOGUE_FILE.test(body.fileName)) {
        throw new HttpError(422, "UNKNOWN_CATALOGUE_FILE");
      }
      const movement = item.movement;
      if (action === "add") {
        if (typeof body.categoryId !== "string" || !Array.isArray(body.bodyZoneIds) ||
            !body.bodyZoneIds.every((id) => typeof id === "string") ||
            (body.libraryId !== null && body.libraryId !== undefined && typeof body.libraryId !== "string")) {
          throw new HttpError(422, "INVALID_CLASSIFICATION");
        }
        const meta = editMeta(body, now, "Fiche créée depuis un Mouvement reçu du téléphone");
        let createdId = null;
        const outcome = await saveCatalogue(body.fileName, body.etag, (file) => {
          const holder = file.sheets.find((sheet) => sheet.install.knownLocalMovementIds.includes(movement.movementId));
          if (holder) throw new HttpError(409, "ALREADY_LINKED", { sheetId: holder.sheetId });
          const created = editing.createSheet(file, inboxDomain.inboxMovementToSheetInput(movement, {
            categoryId: body.categoryId, bodyZoneIds: body.bodyZoneIds,
          }), meta);
          createdId = created.sheet.sheetId;
          // A2 : Mouvement personnel — rattachement non appliqué sur le téléphone tant que la règle n'est pas arbitrée.
          const marked = editing.linkLocalMovement(created.file, createdId, movement.movementId, true);
          if (!body.libraryId) return marked;
          const library = marked.libraries.find((entry) => entry.libraryId === body.libraryId);
          if (!library) throw new HttpError(422, "UNKNOWN_LIBRARY");
          return editing.replaceLibrary(marked, editing.addLibraryMember(library, {
            catalogueId: marked.catalogue.id, sheetId: createdId,
          }));
        }, meta, async (file) => inbox.mark(item.itemId, "ADDED", {
          fileName: body.fileName, catalogueId: file.catalogue.id, sheetId: createdId, libraryId: body.libraryId ?? null,
        }), stillPending);
        return sendJson(response, 200, { ...outcome, sheetId: createdId });
      }
      // Rapprochement explicite : installation seulement (aucune révision éditoriale de la fiche).
      if (typeof body.sheetId !== "string") throw new HttpError(422, "UNKNOWN_SHEET");
      const meta = editMeta(body, now, "Rapprochement d'un Mouvement du téléphone");
      const outcome = await saveCatalogue(body.fileName, body.etag,
        (file) => editing.linkLocalMovement(file, body.sheetId, movement.movementId, true), meta,
        async (file) => inbox.mark(item.itemId, "LINKED", {
          fileName: body.fileName, catalogueId: file.catalogue.id, sheetId: body.sheetId,
        }), stillPending);
      return sendJson(response, 200, outcome);
    }
    if (method === "POST" && route === "/api/pairing") {
      await readJson(request, MAX_ADMIN_BODY);
      return sendJson(response, 200, pairing.newCode());
    }
    if (method === "DELETE" && route === "/api/pairing") {
      pairing.cancelCode();
      return sendJson(response, 200, { cancelled: true });
    }
    if (method === "GET" && route === "/api/devices") {
      return sendJson(response, 200, { devices: pairing.list() });
    }
    if (method === "DELETE" && parts[0] === "devices" && parts.length === 2) {
      if (!(await pairing.revoke(parts[1]))) throw new HttpError(404, "UNKNOWN_DEVICE");
      return sendJson(response, 200, { revoked: true });
    }
    return sendJson(response, 404, { error: "NOT_FOUND" });
  }

  // ---------- API téléphone (réseau local, jeton) ----------

  const PHONE_CSP = "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

  function requireDevice(request) {
    const device = pairing.authenticate(request.headers.authorization);
    if (!device) throw new HttpError(401, "UNAUTHORIZED");
    return device;
  }

  async function handlePhone(request, response) {
    baseHeaders(response, PHONE_CSP);
    if (!isLocalNetworkAddress(request.socket.remoteAddress)) return sendJson(response, 403, { error: "LOCAL_NETWORK_REQUIRED" });
    const url = new URL(request.url ?? "/", "http://phone.invalid");
    const route = url.pathname;
    const method = request.method ?? "GET";

    if (method === "GET" && route === "/phone/v1/ping") {
      return sendJson(response, 200, { ok: true, name, api: "1", formatVersion: MOVEMENT_CATALOGUE_FORMAT_VERSION });
    }
    if (method === "GET" && route === "/phone/test") {
      return sendBytes(response, 200, Buffer.from(phoneTestPage(name, new Date(now())), "utf8"), "text/html; charset=utf-8");
    }
    if (method === "POST" && route === "/phone/v1/pair") {
      const body = await readJson(request, MAX_PAIR_BODY);
      const outcome = await pairing.pair(body?.code, body?.deviceName);
      if (!outcome.ok) return sendJson(response, outcome.status, { error: outcome.error });
      return sendJson(response, 200, {
        token: outcome.token, tokenType: "Bearer", expiresAt: outcome.device.expiresAt, deviceId: outcome.device.deviceId,
      });
    }
    if (method === "GET" && route === "/phone/v1/libraries") {
      requireDevice(request);
      const libraries = [];
      for (const [catalogueId, entry] of await catalogueIndex()) {
        if (entry === null) continue; // identifiant porté par plusieurs fichiers : ambigu, non servi
        const file = entry.parsed.file;
        for (const library of file.libraries) {
          libraries.push({
            catalogueId, libraryId: library.libraryId, title: library.title, description: library.description,
            revision: library.revision, memberCount: library.members.length, fileRevision: file.catalogue.revision,
            catalogueTitle: file.catalogue.title,
          });
        }
      }
      return sendJson(response, 200, { libraries });
    }
    const download = /^\/phone\/v1\/catalogues\/([^/]+)$/.exec(route);
    if (method === "GET" && download) {
      requireDevice(request);
      let catalogueId;
      try {
        catalogueId = decodeURIComponent(download[1]);
      } catch {
        throw new HttpError(404, "UNKNOWN_CATALOGUE");
      }
      const index = await catalogueIndex();
      if (!index.has(catalogueId)) throw new HttpError(404, "UNKNOWN_CATALOGUE");
      const entry = index.get(catalogueId);
      if (entry === null) throw new HttpError(409, "AMBIGUOUS_CATALOGUE");
      // Validation stricte avant envoi : seule la sérialisation de référence d'un fichier valide part.
      const check = parseMovementCatalogueFile(JSON.parse(entry.canonical));
      if (!check.ok) throw new HttpError(503, "CATALOGUE_INVALID");
      // MOUV-D2 (11/11/2026) : aucun transfert d'un média dont les droits ne sont pas confirmés.
      // Décision de Hermann du 11/11/2026 (recette) : « Refuse uniquement la fiche, il faut en donner le nom ».
      // Les fiches concernées sont retirées du fichier envoyé (fiches, membres des Bibliothèques, renvois du
      // glossaire) ; les autres fiches partent inchangées. Leurs noms sont donnés dans l'en-tête
      // `X-Kodjo-Withheld-Sheets` (JSON encodé). Si le fichier filtré n'est pas valide, refus du fichier entier.
      const withheldSheets = check.file.sheets
        .filter((sheet) => sheet.media.some((media) => media.rightsStatus !== "PERMISSION_CONFIRMED"));
      let bytes = Buffer.from(entry.canonical, "utf8");
      const headers = {};
      if (withheldSheets.length > 0) {
        const ids = new Set(withheldSheets.map((sheet) => sheet.sheetId));
        const ownId = check.file.catalogue.id;
        const filtered = {
          ...check.file,
          sheets: check.file.sheets.filter((sheet) => !ids.has(sheet.sheetId)),
          libraries: check.file.libraries.map((library) => ({
            ...library,
            members: library.members.filter((member) => member.catalogueId !== ownId || !ids.has(member.sheetId)),
          })),
          glossary: check.file.glossary.map((term) => ({
            ...term, relatedSheetIds: term.relatedSheetIds.filter((sheetId) => !ids.has(sheetId)),
          })),
        };
        const recheck = parseMovementCatalogueFile(JSON.parse(JSON.stringify(filtered)));
        if (!recheck.ok) {
          throw new HttpError(409, "MEDIA_RIGHTS_UNCONFIRMED", { sheets: withheldSheets.map((sheet) => sheet.sheetId) });
        }
        bytes = Buffer.from(serializeMovementCatalogueFile(recheck.file), "utf8");
        headers["X-Kodjo-Withheld-Sheets"] = encodeURIComponent(JSON.stringify(
          withheldSheets.map((sheet) => ({ sheetId: sheet.sheetId, name: sheet.content.name }))));
      }
      const etag = '"' + digest(bytes) + '"';
      if (request.headers["if-none-match"] === etag) {
        response.writeHead(304, { ETag: etag });
        return response.end();
      }
      return sendBytes(response, 200, bytes, "application/json; charset=utf-8", {
        ETag: etag, "X-Kodjo-Catalogue-Revision": encodeURIComponent(entry.parsed.file.catalogue.revision), ...headers,
      });
    }
    if (method === "POST" && route === "/phone/v1/inbox") {
      const device = requireDevice(request);
      const body = await readJson(request, MAX_INBOX_BODY);
      const parsed = inboxDomain.parseMovementInbox(body);
      if (!parsed.ok) return sendJson(response, 422, { error: "INVALID_INBOX", issues: parsed.issues });
      const outcome = await inbox.receive(parsed.envelope, device);
      return sendJson(response, 200, {
        received: parsed.envelope.movements.length + parsed.collapsedDuplicates,
        stored: outcome.stored,
        duplicates: parsed.envelope.movements.length + parsed.collapsedDuplicates - outcome.stored,
        submissionId: outcome.submissionId,
      });
    }
    return sendJson(response, 404, { error: "NOT_FOUND" });
  }

  const wrap = (handler) => async (request, response) => {
    try {
      await handler(request, response);
    } catch (error) {
      if (response.headersSent) return response.destroy();
      if (error instanceof HttpError) return sendJson(response, error.status, { error: error.code, ...error.extra });
      if (error instanceof URIError) return sendJson(response, 400, { error: "INVALID_PATH" });
      console.error("catalogue-admin : erreur interne —", error?.message ?? "inconnue");
      sendJson(response, 500, { error: "INTERNAL_ERROR" });
    }
  };

  const adminServer = createServer(wrap(handleAdmin));
  const phoneServer = lan ? createServer(wrap(handlePhone)) : null;
  // Délais protecteurs pour le serveur exposé au réseau local.
  if (phoneServer) {
    phoneServer.headersTimeout = 10_000;
    phoneServer.requestTimeout = 30_000;
  }
  return {
    adminServer,
    phoneServer,
    pairing,
    inbox,
    setLanPort(port) {
      lanState.port = port;
    },
    close: () => Promise.all([adminServer, phoneServer].filter(Boolean).map((server) =>
      new Promise((resolve) => (server.listening ? server.close(resolve) : resolve())))),
  };
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

/** Page de vérification de joignabilité depuis Safari (aucun script, aucune donnée du catalogue). */
function phoneTestPage(name, date) {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>KODJO — test de connexion</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;margin:24px;line-height:1.45;color:#10203c}
.ok{background:#e6f7ef;border-left:4px solid #146a55;padding:14px;border-radius:8px}code{background:#eef2fa;padding:2px 5px;border-radius:4px}</style>
</head><body>
<p class="ok"><strong>Connexion réussie.</strong><br>Ce téléphone joint ${escapeHtml(name)} par le réseau local.</p>
<p>Heure du PC : <code>${escapeHtml(date.toISOString())}</code></p>
<p>Ce test ne transmet aucune donnée du catalogue. L'API du téléphone exige un appairage (code à 6 chiffres affiché dans l'administration du PC).</p>
</body></html>
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const adminPort = Number(process.env.KODJO_ADMIN_PORT ?? ADMIN_PORT);
  const phonePort = Number(process.env.KODJO_PHONE_PORT ?? PHONE_PORT);
  const lan = process.argv.includes("--lan") || process.env.KODJO_ADMIN_LAN === "1";
  const valid = (port) => Number.isInteger(port) && port >= 1024 && port <= 65535;
  if (!valid(adminPort) || !valid(phonePort) || adminPort === phonePort) {
    console.error("Ports invalides (KODJO_ADMIN_PORT, KODJO_PHONE_PORT).");
    process.exitCode = 1;
  } else {
    const app = await createAdminApp({ lan });
    app.adminServer.listen(adminPort, "127.0.0.1", () =>
      console.log("Administration KODJO locale : http://127.0.0.1:" + adminPort));
    if (app.phoneServer) {
      app.phoneServer.listen(phonePort, "0.0.0.0", () => {
        app.setLanPort(phonePort);
        console.log("Connexion Wi-Fi active (réseau local uniquement) sur le port " + phonePort + ".");
        for (const address of lanAddresses()) console.log("  Test depuis l'iPhone (Safari) : http://" + address + ":" + phonePort + "/phone/test");
      });
    }
  }
}
