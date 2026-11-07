import assert from "node:assert/strict";
import { mkdtemp, mkdir, copyFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";

import { createAdminServer, pathsFor } from "./server.mjs";
import { initialMovementDraft, validateAdminDrafts } from "./drafts.mjs";

const root = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
let folder, server, address, snapshot, originalPilot;
async function put(revision, drafts, origin = address) {
  const response = await fetch(address + "/api/drafts", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({ revision, drafts }),
  });
  return { status: response.status, body: await response.json() };
}

describe("Catalogue admin — localhost et brouillons", () => {
  before(async () => {
    folder = await mkdtemp(path.join(tmpdir(), "kodjo-admin-"));
    const from = pathsFor(root), to = pathsFor(folder);
    for (const key of ["pilot", "taxonomy", "drafts", "categories", "zones", "html", "js", "css"]) {
      await mkdir(path.dirname(to[key]), { recursive: true });
      await copyFile(from[key], to[key]);
    }
    originalPilot = await readFile(to.pilot, "utf8");
    server = createAdminServer({ rootDir: folder });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    address = "http://127.0.0.1:" + server.address().port;
  });
  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (folder) await rm(folder, { recursive: true, force: true });
  });

  it("expose les sources pilotes sans les publier, et l'interface statique", async () => {
    const res = await fetch(address + "/api/state");
    assert.equal(res.status, 200);
    snapshot = await res.json();
    assert.equal(snapshot.pilot.records.length, 60);
    assert.equal(snapshot.drafts.publicationAllowed, false);
    assert.equal(snapshot.categories.length, 10);
    assert.equal(snapshot.zones.length, 10);
    assert.equal(snapshot.taxonomy.proposedAxes.specialties.values.length, 6);
    for (const asset of ["/", "/app.js", "/styles.css"]) {
      assert.equal((await fetch(address + asset)).status, 200);
    }
  });

  it("rejette une requête cross-origin et un champ de publication interdit", async () => {
    const notAllowed = await put(snapshot.revision, snapshot.drafts, "https://untrusted.example");
    assert.equal(notAllowed.status, 403);
    const invalid = structuredClone(snapshot.drafts);
    invalid.publicationAllowed = true;
    const refused = await put(snapshot.revision, invalid);
    assert.equal(refused.status, 422);
    assert(refused.body.details.some((s) => s.includes("publicationAllowed")));
  });

  it("enregistre un brouillon atomiquement sans modifier le corpus original", async () => {
    const next = structuredClone(snapshot.drafts);
    const candidate = snapshot.pilot.records[0];
    const draft = initialMovementDraft(candidate);
    draft.categoryId = snapshot.categories[0].id;
    draft.bodyZoneIds = [snapshot.zones[0].id];
    draft.specialtyIds = ["reeducation"];
    draft.owner = { kind: "PERSON", id: "coach-test" };
    draft.authors = [{ kind: "PERSON", id: "coach-test" }];
    next.movementEdits[candidate.candidateId] = draft;
    next.glossary.push({
      id: "flexion-test", term: "Flexion test", definition: "Terme de démonstration",
      synonyms: ["Pliure test"], relatedCandidateIds: [candidate.candidateId],
    });
    assert.deepEqual(validateAdminDrafts(next, snapshot), []);
    const saved = await put(snapshot.revision, next);
    assert.equal(saved.status, 200);
    assert.equal(saved.body.publicationAllowed, false);
    assert(saved.body.revision !== snapshot.revision);
    const stored = JSON.parse(await readFile(pathsFor(folder).drafts, "utf8"));
    assert.deepEqual(stored, next);
    assert.equal(await readFile(pathsFor(folder).pilot, "utf8"), originalPilot);
    const reloaded = await (await fetch(address + "/api/state")).json();
    assert.equal(reloaded.revision, saved.body.revision);
    assert.equal(reloaded.drafts.glossary.length, 1);
  });

  it("refuse une sauvegarde concurrente fondée sur une ancienne révision", async () => {
    const conflict = await put(snapshot.revision, snapshot.drafts);
    assert.equal(conflict.status, 409);
    assert.match(conflict.body.error, /changé/);
  });

  it("refuse références absentes et doublons de glossaire", async () => {
    const current = await (await fetch(address + "/api/state")).json();
    const bad = structuredClone(current.drafts);
    const id = Object.keys(bad.movementEdits)[0];
    bad.movementEdits[id].specialtyIds = ["does-not-exist"];
    bad.glossary.push({ ...bad.glossary[0], id: "test-2" });
    const response = await put(current.revision, bad);
    assert.equal(response.status, 422);
    assert(response.body.details.some((x) => x.includes("specialtyIds")));
    assert(response.body.details.some((x) => x.includes("duplicate term")));
    assert.equal((await fetch(address + "/api/export")).status, 200);
  });
});
