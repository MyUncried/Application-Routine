/**
 * Identité des acteurs dans l'administration (décision de Hermann du 12/11/2026) :
 * menu à deux options, identité « Utilisateur local » générée une fois et stable, nom affiché
 * « PC Administrateur », aucun texte libre produit, lecture inchangée des fichiers existants.
 * Lancement : `node --test tools/catalogue-admin/`.
 */
import assert from "node:assert/strict";
import { once } from "node:events";
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";

import { ACTOR_MENU, actorFor, describeActor, KEPT } from "./actors.js";
import { INSTALLATION_ID_PATTERN, LOCAL_ADMIN_DISPLAY_NAME, loadInstallationIdentity } from "./installation.mjs";
import { createAdminApp } from "./server.mjs";

const root = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const PILOT = "kodjo-pilote-60.catalogue.json";
const installation = { kind: "LOCAL_USER", id: "pc-0f8e1c2a-3b4d-4e5f-8a9b-0c1d2e3f4a5b", displayName: "PC Administrateur" };

async function started(options) {
  const app = await createAdminApp(options);
  app.adminServer.listen(0, "127.0.0.1");
  await once(app.adminServer, "listening");
  const base = "http://127.0.0.1:" + app.adminServer.address().port;
  const get = async (route) => {
    const response = await fetch(base + route);
    const text = await response.text();
    let body = null;
    try { body = JSON.parse(text); } catch { body = null; }
    return { status: response.status, text, body };
  };
  return { app, get };
}

describe("Menu des acteurs (fiche et Bibliothèque)", () => {
  it("ne propose que « Inconnu (null) » et « Utilisateur local »", () => {
    assert.deepEqual(ACTOR_MENU.map(([value]) => value), ["", "LOCAL_USER"]);
    assert.deepEqual(ACTOR_MENU.map(([, label]) => label), ["Inconnu (null)", "Utilisateur local"]);
  });

  it("un choix ne produit que null ou l'identité générée de ce PC, jamais un texte libre", () => {
    assert.equal(actorFor("", installation), null);
    assert.deepEqual(actorFor("LOCAL_USER", installation), { kind: "LOCAL_USER", id: installation.id });
    assert.equal(actorFor("PERSON", installation), null);
    assert.throws(() => actorFor("LOCAL_USER", null), /INSTALLATION_IDENTITY_UNAVAILABLE/);
  });

  it("l'identité de ce PC s'affiche « PC Administrateur », en lecture seule", () => {
    const shown = describeActor({ kind: "LOCAL_USER", id: installation.id }, installation);
    assert.deepEqual(shown, { choice: "LOCAL_USER", label: "PC Administrateur", id: installation.id, warning: null });
    assert.equal(describeActor(null, installation).choice, "");
  });

  it("une valeur enregistrée hors menu reste lisible, inchangée et signalée", () => {
    const freeText = describeActor({ kind: "LOCAL_USER", id: "hermann Adjou Moumouni" }, installation);
    assert.equal(freeText.choice, KEPT);
    assert.equal(freeText.label, "Utilisateur local : hermann Adjou Moumouni");
    assert.match(freeText.warning, /saisi à la main, non conforme/);
    const otherPc = describeActor({ kind: "LOCAL_USER", id: "pc-11111111-2222-4333-8444-555555555555" }, installation);
    assert.match(otherPc.warning, /autre installation PC/);
    const organization = describeActor({ kind: "ORGANIZATION", id: "ankusha" }, installation);
    assert.equal(organization.choice, KEPT);
    assert.equal(organization.label, "Organisation : ankusha");
    assert.match(organization.warning, /reviendra avec les comptes/);
  });
});

describe("Identité « Utilisateur local » de l'installation PC", () => {
  let folder;
  before(async () => {
    folder = await mkdtemp(path.join(tmpdir(), "kodjo-installation-"));
    await mkdir(path.join(folder, "catalogue/catalogues"), { recursive: true });
    await copyFile(path.join(root, "catalogue/catalogues", PILOT), path.join(folder, "catalogue/catalogues", PILOT));
  });
  after(async () => {
    await rm(folder, { recursive: true, force: true });
  });

  it("générée au premier démarrage, conservée et identique au démarrage suivant", async () => {
    const first = await started({ dataRoot: folder });
    const status = (await first.get("/api/status")).body;
    await first.app.close();
    assert.equal(status.installation.kind, "LOCAL_USER");
    assert.equal(status.installation.displayName, LOCAL_ADMIN_DISPLAY_NAME);
    assert.match(status.installation.id, INSTALLATION_ID_PATTERN);
    const stored = JSON.parse(await readFile(path.join(folder, "catalogue/admin/installation.json"), "utf8"));
    assert.equal(stored.id, status.installation.id);

    const second = await started({ dataRoot: folder });
    const again = (await second.get("/api/status")).body;
    await second.app.close();
    assert.equal(again.installation.id, status.installation.id);
  });

  it("un fichier d'identité illisible n'est jamais remplacé", async () => {
    const other = await mkdtemp(path.join(tmpdir(), "kodjo-installation-bad-"));
    const file = path.join(other, "installation.json");
    await writeFile(file, "{ pas du json");
    await assert.rejects(loadInstallationIdentity({ file }), /illisible/);
    assert.equal(await readFile(file, "utf8"), "{ pas du json");
    await rm(other, { recursive: true, force: true });
  });

  it("sans persistance (tests), aucune écriture sur disque", async () => {
    const other = await mkdtemp(path.join(tmpdir(), "kodjo-installation-mem-"));
    const local = await started({ dataRoot: other, persistDevices: false });
    const status = (await local.get("/api/status")).body;
    await local.app.close();
    assert.match(status.installation.id, INSTALLATION_ID_PATTERN);
    await assert.rejects(stat(path.join(other, "catalogue/admin/installation.json")), { code: "ENOENT" });
    await rm(other, { recursive: true, force: true });
  });

  it("le module des acteurs est servi à la page", async () => {
    const local = await started({ dataRoot: folder });
    const served = await local.get("/actors.js");
    await local.app.close();
    assert.equal(served.status, 200);
    assert.match(served.text, /export const ACTOR_MENU/);
  });

  it("lecture inchangée : un fichier avec Personne, Organisation et un texte libre reste ouvert tel quel", async () => {
    const name = "acteurs-anciens.catalogue.json";
    const file = JSON.parse(await readFile(path.join(folder, "catalogue/catalogues", PILOT), "utf8"));
    file.sheets[0].provenance.owner = { kind: "LOCAL_USER", id: "hermann Adjou Moumouni" };
    file.sheets[0].provenance.author = { kind: "PERSON", id: "hermann" };
    file.sheets[0].provenance.publisher = { kind: "PLATFORM", id: "kodjo" };
    await writeFile(path.join(folder, "catalogue/catalogues", name), JSON.stringify(file, null, 2) + "\n");
    const local = await started({ dataRoot: folder, persistDevices: false });
    const opened = await local.get("/api/catalogues/" + name);
    await local.app.close();
    assert.equal(opened.status, 200);
    const provenance = opened.body.file.sheets[0].provenance;
    assert.deepEqual(provenance.owner, { kind: "LOCAL_USER", id: "hermann Adjou Moumouni" });
    assert.deepEqual(provenance.author, { kind: "PERSON", id: "hermann" });
    // Format 3.0.0 (MOUV-ADM n° 13 et 25) : diffuseur et gestionnaire retirés à la lecture du fichier 2.0.0.
    assert.equal("publisher" in provenance, false);
    assert.equal("manager" in opened.body.file.catalogue, false);
  });
});
