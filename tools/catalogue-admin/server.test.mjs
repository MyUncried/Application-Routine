/**
 * Tests de l'administration locale v2 (W1) et de la connexion Wi-Fi (W2), sur une copie
 * temporaire du catalogue pilote. Lancement : `node --test tools/catalogue-admin/`.
 */
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { request as httpRequest } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";

import { createAdminApp, isLocalNetworkAddress } from "./server.mjs";
import { generatedModuleUrl } from "./build-domain.mjs";

const root = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const PILOT = "kodjo-pilote-60.catalogue.json";
const { parseMovementCatalogueFile, serializeMovementCatalogueFile } =
  await import(generatedModuleUrl("src/domain/catalogue/MovementCatalogueFile.ts"));
const sha = (data) => createHash("sha256").update(data).digest("hex");

let folder, app, admin, phone, clock;

async function startApp() {
  app = await createAdminApp({ dataRoot: folder, lan: true, now: () => clock });
  app.adminServer.listen(0, "127.0.0.1");
  app.phoneServer.listen(0, "127.0.0.1");
  await Promise.all([once(app.adminServer, "listening"), once(app.phoneServer, "listening")]);
  admin = "http://127.0.0.1:" + app.adminServer.address().port;
  phone = "http://127.0.0.1:" + app.phoneServer.address().port;
}

const adminCall = async (method, route, body, headers = {}) => {
  const response = await fetch(admin + route, {
    method,
    headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), Origin: admin, ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, headers: response.headers, text, body: text ? safeJson(text) : null };
};
const phoneCall = async (method, route, { body, token, headers = {} } = {}) => {
  const response = await fetch(phone + route, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { status: response.status, headers: response.headers, bytes, body: bytes.length ? safeJson(bytes.toString("utf8")) : null };
};
function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}
/** Requête brute avec un en-tête Host arbitraire (fetch ne permet pas de le modifier). */
function rawRequest(port, route, host) {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ host: "127.0.0.1", port, path: route, headers: { Host: host } }, (res) => {
      res.resume();
      res.on("end", () => resolve(res.statusCode));
    });
    req.on("error", reject);
    req.end();
  });
}
const openPilot = async () => (await adminCall("GET", "/api/catalogues/" + PILOT)).body;
const meta = { author: { kind: "PERSON", id: "hermann" }, summary: "Test W1" };

async function pairPhone(name = "iPhone test") {
  const { body } = await adminCall("POST", "/api/pairing", {});
  const paired = await phoneCall("POST", "/phone/v1/pair", { body: { code: body.code, deviceName: name } });
  assert.equal(paired.status, 200);
  return paired.body;
}

const inboxEnvelope = (movements) => ({
  format: "KODJO_MOVEMENT_INBOX", formatVersion: "1.0.0", sentAt: "2026-11-11T10:00:00Z",
  device: { name: "iPhone de test" }, movements,
});
const phoneMovement = (overrides = {}) => ({
  movementId: "mv-perso-1", name: "Pompe murale", aliases: [], steps: ["Face au mur.", "Poussez."],
  categoryId: "renforcement", categoryLabel: "Renforcement", bodyZoneIds: ["bras"], bodyZoneLabels: ["Bras"],
  mediaCount: 1, ...overrides,
});

describe("Administration locale v2 et connexion Wi-Fi", () => {
  before(async () => {
    clock = Date.parse("2026-11-11T09:00:00Z");
    folder = await mkdtemp(path.join(tmpdir(), "kodjo-admin-v2-"));
    await mkdir(path.join(folder, "catalogue/catalogues"), { recursive: true });
    await copyFile(path.join(root, "catalogue/catalogues", PILOT), path.join(folder, "catalogue/catalogues", PILOT));
    await startApp();
  });
  after(async () => {
    if (app) await app.close();
    if (folder) await rm(folder, { recursive: true, force: true });
  });

  describe("W1 — édition du format v2", () => {
    it("sert l'interface, le domaine partagé et la liste des catalogues", async () => {
      for (const asset of ["/", "/app.js", "/media.js", "/styles.css", "/domain/src/domain/catalogue/MovementCatalogueFile.js"]) {
        const response = await fetch(admin + asset);
        assert.equal(response.status, 200, asset);
        assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
        assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      }
      assert.equal((await fetch(admin + "/domain/../server.mjs")).status, 404);
      assert.equal((await fetch(admin + "/domain/src/domain/catalogue/inconnu.js")).status, 404);
      const list = await adminCall("GET", "/api/catalogues");
      assert.equal(list.status, 200);
      assert.deepEqual(list.body.catalogues.map((c) => [c.fileName, c.ok, c.sheetCount, c.libraryCount]), [[PILOT, true, 60, 1]]);
    });

    it("ouvre le pilote (60 fiches, signalements) avec une révision optimiste = SHA-256 des octets", async () => {
      const opened = await openPilot();
      const bytes = await readFile(path.join(folder, "catalogue/catalogues", PILOT));
      assert.equal(opened.ok, true);
      assert.equal(opened.file.sheets.length, 60);
      assert.equal(opened.etag, sha(bytes));
      assert(opened.warnings.some((w) => w.code === "UNKNOWN_OWNER"));
    });

    it("réenregistrer sans changement effectif ne crée aucune révision ni écriture", async () => {
      const opened = await openPilot();
      const before = await readFile(path.join(folder, "catalogue/catalogues", PILOT));
      const file = structuredClone(opened.file);
      file.sheets[0].classification.bodyZoneIds.reverse(); // ensemble : ordre sans signification
      const saved = await adminCall("PUT", "/api/catalogues/" + PILOT, { etag: opened.etag, file, meta });
      assert.equal(saved.status, 200);
      assert.equal(saved.body.saved, false);
      assert.deepEqual(await readFile(path.join(folder, "catalogue/catalogues", PILOT)), before);
    });

    it("crée une 61e fiche : révision 1 imposée par le serveur, catalogue +1, relu par le parseur partagé", async () => {
      const opened = await openPilot();
      const file = structuredClone(opened.file);
      const sheet = structuredClone(file.sheets[0]);
      Object.assign(sheet, { sheetId: "fiche-test-61", revision: "77", history: [{ revision: "77", date: "1999-01-01", author: null, summary: "forgé" }] });
      sheet.provenance = { ...sheet.provenance, origin: "LOCAL_CREATED", upstream: null };
      sheet.content = { ...sheet.content, name: "Fiche de test 61" };
      sheet.install = { knownLocalMovementIds: [] };
      file.sheets.push(sheet);
      const saved = await adminCall("PUT", "/api/catalogues/" + PILOT, { etag: opened.etag, file, meta });
      assert.equal(saved.status, 200, saved.text);
      assert.equal(saved.body.saved, true);
      assert.deepEqual(saved.body.createdSheets, ["fiche-test-61"]);
      assert.equal(saved.body.revision, "2");
      const text = await readFile(path.join(folder, "catalogue/catalogues", PILOT), "utf8");
      assert.equal(saved.body.etag, sha(Buffer.from(text, "utf8")));
      const reread = parseMovementCatalogueFile(JSON.parse(text));
      assert.equal(reread.ok, true);
      assert.equal(serializeMovementCatalogueFile(reread.file), text);
      const created = reread.file.sheets.find((s) => s.sheetId === "fiche-test-61");
      assert.equal(created.revision, "1");
      assert.equal(created.history.length, 1);
      assert.deepEqual(created.history[0].author, meta.author);
      assert.equal(reread.file.sheets.length, 61);
    });

    it("édition effective d'une fiche : révision +1 de cette fiche seulement", async () => {
      const opened = await openPilot();
      const file = structuredClone(opened.file);
      file.sheets[4].content.notes = "Note de recette";
      const saved = await adminCall("PUT", "/api/catalogues/" + PILOT, { etag: opened.etag, file, meta });
      assert.equal(saved.status, 200, saved.text);
      assert.deepEqual(saved.body.changedSheets, [opened.file.sheets[4].sheetId]);
      assert.equal(saved.body.revision, "3");
      const reread = await openPilot();
      assert.equal(reread.file.sheets[4].revision, "2");
      assert.equal(reread.file.sheets[3].revision, "1");
      assert.equal(reread.canonical, true);
    });

    it("refuse une révision périmée (409) sans écrire", async () => {
      const opened = await openPilot();
      const stale = await adminCall("PUT", "/api/catalogues/" + PILOT, { etag: "0".repeat(64), file: opened.file, meta });
      assert.equal(stale.status, 409);
      assert.equal(stale.body.error, "STALE_REVISION");
      assert.equal(stale.body.etag, opened.etag);
    });

    it("refuse un fichier invalide avec la liste des problèmes du parseur partagé, et une suppression de fiche", async () => {
      const opened = await openPilot();
      const invalid = structuredClone(opened.file);
      invalid.sheets[0].provenance.origin = "LOCAL_DERIVED";
      invalid.sheets[1].validation.publicationAllowed = true;
      const refused = await adminCall("PUT", "/api/catalogues/" + PILOT, { etag: opened.etag, file: invalid, meta });
      assert.equal(refused.status, 422);
      assert.equal(refused.body.error, "INVALID_CATALOGUE");
      assert(refused.body.issues.some((i) => i.path === "sheets[0].provenance.origin" && i.detail === "LOCAL_DERIVED"));
      assert(refused.body.issues.some((i) => i.path === "sheets[1].validation.publicationAllowed"));
      const removed = structuredClone(opened.file);
      removed.sheets.pop();
      removed.libraries[0].members = removed.libraries[0].members.filter((m) => m.sheetId !== opened.file.sheets.at(-1).sheetId);
      const forbidden = await adminCall("PUT", "/api/catalogues/" + PILOT, { etag: opened.etag, file: removed, meta });
      assert.equal(forbidden.status, 422);
      assert.equal(forbidden.body.error, "FORBIDDEN_EDIT");
      const badAuthor = await adminCall("PUT", "/api/catalogues/" + PILOT, { etag: opened.etag, file: opened.file, meta: { author: { kind: "ROBOT", id: "x" } } });
      assert.equal(badAuthor.status, 422);
      assert.equal((await openPilot()).etag, opened.etag);
    });

    it("composition d'une Bibliothèque : révision de la Bibliothèque, fiches inchangées", async () => {
      const opened = await openPilot();
      const file = structuredClone(opened.file);
      const members = file.libraries[0].members;
      members.push(members.shift());
      file.libraries.push({
        libraryId: "bib-recette", title: "Recette", description: null, revision: "9", history: [], editor: null,
        owner: null, visibility: "PRIVATE", publicationAllowed: false,
        members: [{ catalogueId: file.catalogue.id, sheetId: "REED-001" }, { catalogueId: file.catalogue.id, sheetId: "fiche-test-61" }],
      });
      const saved = await adminCall("PUT", "/api/catalogues/" + PILOT, { etag: opened.etag, file, meta });
      assert.equal(saved.status, 200, saved.text);
      assert.deepEqual(saved.body.changedLibraries, ["kodjo.pilote-60", "bib-recette"]);
      assert.deepEqual(saved.body.changedSheets, []);
      const reread = await openPilot();
      assert.equal(reread.file.libraries[0].revision, "2");
      assert.equal(reread.file.libraries[1].revision, "1");
    });

    it("export : octets identiques au fichier enregistré", async () => {
      const response = await fetch(admin + "/api/catalogues/" + PILOT + "/export");
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-disposition"), /attachment/);
      const exported = Buffer.from(await response.arrayBuffer());
      assert.deepEqual(exported, await readFile(path.join(folder, "catalogue/catalogues", PILOT)));
    });

    it("sécurité : Host non local, origine étrangère, chemin forgé, corps trop volumineux", async () => {
      const port = app.adminServer.address().port;
      assert.equal(await rawRequest(port, "/api/catalogues", "192.168.1.20:" + port), 403);
      assert.equal(await rawRequest(port, "/", "evil.example:" + port), 403);
      assert.equal(await rawRequest(port, "/api/catalogues", "127.0.0.1:" + port), 200);
      const opened = await openPilot();
      const foreign = await adminCall("PUT", "/api/catalogues/" + PILOT, { etag: opened.etag, file: opened.file }, { Origin: "https://evil.example" });
      assert.equal(foreign.status, 403);
      const textPlain = await fetch(admin + "/api/catalogues/" + PILOT, { method: "PUT", headers: { Origin: admin, "Content-Type": "text/plain" }, body: "{}" });
      assert.equal(textPlain.status, 415);
      assert.equal((await adminCall("GET", "/api/catalogues/..%2F..%2Fpackage.json")).status, 404);
      assert.equal((await adminCall("GET", "/api/catalogues/inconnu.catalogue.json")).status, 404);
      const huge = await fetch(admin + "/api/pairing", { method: "POST", headers: { Origin: admin, "Content-Type": "application/json" }, body: JSON.stringify({ x: "y".repeat(70 * 1024) }) });
      assert.equal(huge.status, 413);
    });
  });

  describe("W2 — appairage et API téléphone", () => {
    it("ping et page de test sans authentification ; aucune route d'administration sur le réseau local", async () => {
      const ping = await phoneCall("GET", "/phone/v1/ping");
      assert.equal(ping.status, 200);
      assert.equal(ping.body.ok, true);
      assert.equal(typeof ping.body.name, "string");
      const page = await phoneCall("GET", "/phone/test");
      assert.equal(page.status, 200);
      assert.match(page.headers.get("content-type"), /text\/html/);
      assert.match(page.bytes.toString("utf8"), /Connexion réussie/);
      for (const route of ["/api/catalogues", "/", "/app.js", "/api/devices"]) {
        assert.equal((await phoneCall("GET", route)).status, 404, route);
      }
      assert.equal(ping.headers.get("access-control-allow-origin"), null);
    });

    it("authentification exigée sur les routes protégées", async () => {
      for (const route of ["/phone/v1/libraries", "/phone/v1/catalogues/kodjo.pilote-60"]) {
        assert.equal((await phoneCall("GET", route)).status, 401);
        assert.equal((await phoneCall("GET", route, { token: "x".repeat(43) })).status, 401);
      }
      assert.equal((await phoneCall("POST", "/phone/v1/inbox", { body: inboxEnvelope([phoneMovement()]) })).status, 401);
    });

    it("appairage : succès, usage unique, mauvais code, expiration", async () => {
      const closed = await phoneCall("POST", "/phone/v1/pair", { body: { code: "123456", deviceName: "x" } });
      assert.equal(closed.status, 403);
      const { body: code } = await adminCall("POST", "/api/pairing", {});
      assert.match(code.code, /^\d{6}$/);
      const wrong = String((Number(code.code) + 1) % 1_000_000).padStart(6, "0");
      assert.equal((await phoneCall("POST", "/phone/v1/pair", { body: { code: wrong, deviceName: "x" } })).body.error, "WRONG_CODE");
      assert.equal((await phoneCall("POST", "/phone/v1/pair", { body: { code: "12", deviceName: "x" } })).status, 400);
      const paired = await phoneCall("POST", "/phone/v1/pair", { body: { code: code.code, deviceName: "iPhone de Hermann" } });
      assert.equal(paired.status, 200);
      assert.equal(paired.body.tokenType, "Bearer");
      assert.match(paired.body.token, /^[A-Za-z0-9_-]{43}$/);
      const reuse = await phoneCall("POST", "/phone/v1/pair", { body: { code: code.code, deviceName: "Autre" } });
      assert.equal(reuse.status, 403);
      // Le jeton n'est stocké que sous forme d'empreinte.
      const registry = await readFile(path.join(folder, "catalogue/admin/appareils.json"), "utf8");
      assert(!registry.includes(paired.body.token));
      assert(registry.includes(sha(paired.body.token)));
      // Expiration du code après 5 minutes.
      const { body: late } = await adminCall("POST", "/api/pairing", {});
      clock += 5 * 60 * 1000 + 1;
      assert.equal((await phoneCall("POST", "/phone/v1/pair", { body: { code: late.code, deviceName: "x" } })).status, 403);
    });

    it("verrouillage : 5 essais faux brûlent le code", async () => {
      const { body: code } = await adminCall("POST", "/api/pairing", {});
      const wrong = String((Number(code.code) + 7) % 1_000_000).padStart(6, "0");
      const errors = [];
      for (let i = 0; i < 5; i += 1) errors.push((await phoneCall("POST", "/phone/v1/pair", { body: { code: wrong, deviceName: "x" } })).body.error);
      assert.deepEqual(errors, ["WRONG_CODE", "WRONG_CODE", "WRONG_CODE", "WRONG_CODE", "CODE_REVOKED_AFTER_FAILURES"]);
      const good = await phoneCall("POST", "/phone/v1/pair", { body: { code: code.code, deviceName: "x" } });
      assert.equal(good.status, 403);
      assert.equal(good.body.error, "PAIRING_CLOSED");
    });

    it("verrouillage global après 20 échecs en 10 minutes, puis réouverture", async () => {
      clock += 11 * 60 * 1000; // fenêtre précédente expirée
      for (let i = 0; i < 20; i += 1) await phoneCall("POST", "/phone/v1/pair", { body: { code: "000000", deviceName: "x" } });
      const { body: code } = await adminCall("POST", "/api/pairing", {});
      const locked = await phoneCall("POST", "/phone/v1/pair", { body: { code: code.code, deviceName: "x" } });
      assert.equal(locked.status, 429);
      clock += 11 * 60 * 1000;
      const { body: fresh } = await adminCall("POST", "/api/pairing", {});
      assert.equal((await phoneCall("POST", "/phone/v1/pair", { body: { code: fresh.code, deviceName: "Après verrou" } })).status, 200);
    });

    it("bibliothèques et téléchargement : octets identiques, relus par le parseur partagé", async () => {
      const { token } = await pairPhone();
      const libraries = await phoneCall("GET", "/phone/v1/libraries", { token });
      assert.equal(libraries.status, 200);
      const pilot = libraries.body.libraries.find((l) => l.libraryId === "kodjo.pilote-60");
      assert.deepEqual(Object.keys(pilot).sort(), ["catalogueId", "catalogueTitle", "description", "fileRevision", "libraryId", "memberCount", "revision", "title"]);
      assert.equal(pilot.catalogueId, "kodjo.pilote-60");
      assert.equal(pilot.memberCount, 60);
      const disk = await readFile(path.join(folder, "catalogue/catalogues", PILOT));
      assert.equal(pilot.fileRevision, JSON.parse(disk.toString("utf8")).catalogue.revision);
      const download = await phoneCall("GET", "/phone/v1/catalogues/kodjo.pilote-60", { token });
      assert.equal(download.status, 200);
      assert.deepEqual(download.bytes, disk);
      const parsed = parseMovementCatalogueFile(JSON.parse(download.bytes.toString("utf8")));
      assert.equal(parsed.ok, true);
      assert.equal(download.headers.get("etag"), '"' + sha(disk) + '"');
      const notModified = await phoneCall("GET", "/phone/v1/catalogues/kodjo.pilote-60", { token, headers: { "If-None-Match": download.headers.get("etag") } });
      assert.equal(notModified.status, 304);
      assert.equal((await phoneCall("GET", "/phone/v1/catalogues/inconnu", { token })).status, 404);
      assert.equal((await phoneCall("GET", "/phone/v1/catalogues/..%2F..%2Fpackage.json", { token })).status, 404);
    });

    it("refuse de servir un fichier invalide et un identifiant ambigu", async () => {
      const { token } = await pairPhone();
      const broken = JSON.parse(await readFile(path.join(folder, "catalogue/catalogues", PILOT), "utf8"));
      broken.catalogue.id = "kodjo.casse";
      broken.sheets[0].content.name = "";
      await writeFile(path.join(folder, "catalogue/catalogues/casse.catalogue.json"), JSON.stringify(broken));
      assert.equal((await phoneCall("GET", "/phone/v1/catalogues/kodjo.casse", { token })).status, 404);
      const listed = await phoneCall("GET", "/phone/v1/libraries", { token });
      assert(!listed.body.libraries.some((l) => l.catalogueId === "kodjo.casse"));
      await copyFile(path.join(folder, "catalogue/catalogues", PILOT), path.join(folder, "catalogue/catalogues/copie.catalogue.json"));
      assert.equal((await phoneCall("GET", "/phone/v1/catalogues/kodjo.pilote-60", { token })).status, 409);
      await rm(path.join(folder, "catalogue/catalogues/copie.catalogue.json"));
      await rm(path.join(folder, "catalogue/catalogues/casse.catalogue.json"));
    });

    it("MOUV-D2 : un fichier contenant un média aux droits non confirmés n'est pas transféré au téléphone", async () => {
      const { token } = await pairPhone();
      const withMedia = JSON.parse(await readFile(path.join(folder, "catalogue/catalogues", PILOT), "utf8"));
      withMedia.catalogue.id = "kodjo.medias";
      withMedia.libraries[0].members = withMedia.libraries[0].members.map((m) => ({ ...m, catalogueId: "kodjo.medias" }));
      withMedia.sheets[0].media = [{
        id: "media-000001", kind: "PHOTO", storage: "REMOTE", url: "https://exemple.fr/photo.webp", fileName: "photo.webp",
        caption: "", alt: "Position", sourceUrl: "https://exemple.fr/source", attribution: "", license: "", rightsStatus: "UNVERIFIED",
      }];
      await writeFile(path.join(folder, "catalogue/catalogues/medias.catalogue.json"), JSON.stringify(withMedia));
      const refused = await phoneCall("GET", "/phone/v1/catalogues/kodjo.medias", { token });
      assert.equal(refused.status, 409);
      assert.equal(refused.body.error, "MEDIA_RIGHTS_UNCONFIRMED");
      assert.deepEqual(refused.body.sheets, [withMedia.sheets[0].sheetId]);
      await rm(path.join(folder, "catalogue/catalogues/medias.catalogue.json"));
    });

    it("révocation : le jeton est refusé ensuite ; expiration après 12 h", async () => {
      const { token, deviceId } = await pairPhone("À révoquer");
      assert.equal((await phoneCall("GET", "/phone/v1/libraries", { token })).status, 200);
      const devices = await adminCall("GET", "/api/devices");
      assert(devices.body.devices.some((d) => d.deviceId === deviceId && d.name === "À révoquer"));
      assert(!JSON.stringify(devices.body).includes(token));
      assert.equal((await adminCall("DELETE", "/api/devices/" + deviceId)).status, 200);
      assert.equal((await phoneCall("GET", "/phone/v1/libraries", { token })).status, 401);
      const other = await pairPhone("Expirant");
      clock += 12 * 60 * 60 * 1000 + 1;
      assert.equal((await phoneCall("GET", "/phone/v1/libraries", { token: other.token })).status, 401);
    });

    it("boîte d'arrivée : validation partagée, stockage atomique, idempotence", async () => {
      const { token } = await pairPhone();
      const invalid = await phoneCall("POST", "/phone/v1/inbox", { token, body: inboxEnvelope([phoneMovement({ name: "x".repeat(81) })]) });
      assert.equal(invalid.status, 422);
      assert.deepEqual(invalid.body.issues, [{ path: "movements[0].name", code: "TOO_LONG" }]);
      const textPlain = await fetch(phone + "/phone/v1/inbox", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "text/plain" }, body: "{}" });
      assert.equal(textPlain.status, 415);
      const first = await phoneCall("POST", "/phone/v1/inbox", { token, body: inboxEnvelope([phoneMovement(), phoneMovement({ movementId: "mv-perso-2", name: "Élévation de jambe tendue" })]) });
      assert.equal(first.status, 200);
      assert.deepEqual({ ...first.body, submissionId: undefined }, { received: 2, stored: 2, duplicates: 0, submissionId: undefined });
      const again = await phoneCall("POST", "/phone/v1/inbox", { token, body: inboxEnvelope([phoneMovement(), phoneMovement({ movementId: "mv-perso-2", name: "Élévation de jambe tendue" })]) });
      assert.deepEqual(again.body, { received: 2, stored: 0, duplicates: 2, submissionId: null });
      const changed = await phoneCall("POST", "/phone/v1/inbox", { token, body: inboxEnvelope([phoneMovement({ steps: ["Nouvelle consigne."] })]) });
      assert.equal(changed.body.stored, 1);
      const files = (await readdir(path.join(folder, "catalogue/admin/inbox"))).filter((n) => n.endsWith(".json"));
      assert.equal(files.length, 2);
      const items = (await adminCall("GET", "/api/inbox")).body.items;
      assert.equal(items.length, 3);
      assert(items.every((i) => i.status === "PENDING"));
      const tooBig = await fetch(phone + "/phone/v1/inbox", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ pad: "x".repeat(1024 * 1024 + 10) }) });
      assert.equal(tooBig.status, 413);
    });

    it("« Ajouter au catalogue » : fiche LOCAL_CREATED privée, rapprochée, ajoutée à une Bibliothèque", async () => {
      const items = (await adminCall("GET", "/api/inbox")).body.items;
      const item = items.find((i) => i.movement.movementId === "mv-perso-1" && i.movement.steps.length === 2);
      const opened = await openPilot();
      const added = await adminCall("POST", "/api/inbox/" + item.itemId + "/add", {
        fileName: PILOT, etag: opened.etag, categoryId: "renforcement", bodyZoneIds: ["bras"], libraryId: "bib-recette", meta,
      });
      assert.equal(added.status, 200, added.text);
      assert.equal(added.body.saved, true);
      const reread = await openPilot();
      const sheet = reread.file.sheets.find((s) => s.sheetId === added.body.sheetId);
      assert.equal(sheet.provenance.origin, "LOCAL_CREATED");
      assert.equal(sheet.provenance.owner, null);
      assert.equal(sheet.provenance.author, null);
      assert.equal(sheet.provenance.visibility, "PRIVATE");
      assert.equal(sheet.validation.publicationAllowed, false);
      assert.deepEqual(sheet.install.knownLocalMovementIds, ["mv-perso-1"]);
      assert(reread.file.libraries.find((l) => l.libraryId === "bib-recette").members.some((m) => m.sheetId === sheet.sheetId));
      const processed = (await adminCall("GET", "/api/inbox")).body.items.find((i) => i.itemId === item.itemId);
      assert.equal(processed.status, "ADDED");
      assert.equal(processed.result.sheetId, sheet.sheetId);
      assert.equal((await adminCall("POST", "/api/inbox/" + item.itemId + "/add", { fileName: PILOT, etag: reread.etag, categoryId: "renforcement", bodyZoneIds: ["bras"] })).status, 409);
      // La nouvelle version du même Mouvement est déjà rapprochée : création refusée, rapprochement possible.
      const newer = (await adminCall("GET", "/api/inbox")).body.items.find((i) => i.movement.movementId === "mv-perso-1" && i.status === "PENDING");
      const dup = await adminCall("POST", "/api/inbox/" + newer.itemId + "/add", { fileName: PILOT, etag: reread.etag, categoryId: "renforcement", bodyZoneIds: ["bras"] });
      assert.equal(dup.status, 409);
      assert.equal(dup.body.error, "ALREADY_LINKED");
    });

    it("« Rapprocher » : installation seulement, sans révision de la fiche ; catalogue révisé", async () => {
      const item = (await adminCall("GET", "/api/inbox")).body.items.find((i) => i.movement.movementId === "mv-perso-2");
      const opened = await openPilot();
      const before = opened.file.sheets.find((s) => s.sheetId === "REED-001");
      const linked = await adminCall("POST", "/api/inbox/" + item.itemId + "/link", { fileName: PILOT, etag: opened.etag, sheetId: "REED-001" });
      assert.equal(linked.status, 200, linked.text);
      assert.deepEqual(linked.body.installChangedSheets, ["REED-001"]);
      assert.deepEqual(linked.body.changedSheets, []);
      const reread = await openPilot();
      const after = reread.file.sheets.find((s) => s.sheetId === "REED-001");
      assert.equal(after.revision, before.revision);
      assert.deepEqual(after.install.knownLocalMovementIds, [...before.install.knownLocalMovementIds, "mv-perso-2"]);
      assert.notEqual(reread.file.catalogue.revision, opened.file.catalogue.revision);
      const dismissed = (await adminCall("GET", "/api/inbox")).body.items.find((i) => i.status === "PENDING");
      assert.equal((await adminCall("POST", "/api/inbox/" + dismissed.itemId + "/dismiss", {})).body.item.status, "DISMISSED");
      assert.equal((await adminCall("POST", "/api/inbox/inconnu.1/dismiss", {})).status, 404);
    });

    it("le serveur sans --lan n'ouvre aucun serveur réseau local", async () => {
      const local = await createAdminApp({ dataRoot: folder, persistDevices: false });
      assert.equal(local.phoneServer, null);
      await local.close();
    });

    it("API téléphone réservée aux adresses du réseau local ; chemin mal encodé refusé", async () => {
      for (const address of ["192.168.1.20", "10.0.0.5", "172.16.3.4", "169.254.1.1", "127.0.0.1", "::ffff:192.168.0.9", "fe80::1", "fd12:3456::1", "::1"]) {
        assert.equal(isLocalNetworkAddress(address), true, address);
      }
      for (const address of ["8.8.8.8", "172.32.0.1", "100.64.0.1", "2001:db8::1", "::ffff:1.1.1.1", "", undefined]) {
        assert.equal(isLocalNetworkAddress(address), false, String(address));
      }
      assert.equal((await adminCall("GET", "/api/catalogues/%E0%A4%A")).status, 400);
      assert.equal((await adminCall("POST", "/api/inbox/x.1/dismiss", null)).status, 400);
    });
  });
});
