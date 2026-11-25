/**
 * Marquage des photos (D-600) : les vues sont appliquées avec le calcul de révision du domaine, sinon le
 * téléphone verrait une empreinte différente sous la même révision (INCOHERENT_REVISION).
 * Lancement : `node --test "tools/catalogue-admin/*.test.mjs"`.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { before, describe, it } from "node:test";

import { applyViewsWithRevisions, loadDomain, MARKING_REVISION_SUMMARY } from "./propose-views.mjs";

const root = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const ILLUSTRATED = path.join(root, "catalogue/illustrations/kodjo-pilote-60.illustre-v3.json");
const meta = { date: "2026-11-25T10:00:00.000Z", author: null, summary: MARKING_REVISION_SUMMARY };

describe("applyViewsWithRevisions", () => {
  let domain;
  let source;
  before(async () => {
    domain = await loadDomain();
    source = JSON.parse(readFileSync(ILLUSTRATED, "utf8"));
  });
  const sheetOf = (file, id) => file.sheets.find((sheet) => sheet.sheetId === id);

  it("vue modifiée : nouvelle révision et entrée d'historique ; fiche sans vue inchangée", () => {
    const target = sheetOf(source, "FIT-CRO-010");
    const untouched = sheetOf(source, "FIT-STR-002");
    const view = { x: 40, y: 0, width: 60, height: 100 };
    const result = applyViewsWithRevisions(source, [{ sheetId: "FIT-CRO-010", mediaId: target.media[0].id, view }], meta, domain);
    assert.deepEqual(result.changedSheets, ["FIT-CRO-010"]);
    const sheet = sheetOf(result.file, "FIT-CRO-010");
    assert.deepEqual(sheet.media[0].view, view);
    assert.equal(sheet.revision, String(Number(target.revision) + 1));
    assert.deepEqual(sheet.history.slice(0, -1), target.history);
    assert.deepEqual(sheet.history.at(-1), { revision: sheet.revision, date: meta.date, author: null, summary: MARKING_REVISION_SUMMARY });
    assert.deepEqual(sheetOf(result.file, "FIT-STR-002"), untouched);
    assert.notEqual(result.file.catalogue.revision, source.catalogue.revision);
    assert.ok(domain.parseMovementCatalogueFile(structuredClone(result.file)).ok);
  });

  it("image entière (vue retirée) : nouvelle révision", () => {
    const target = sheetOf(source, "REED-005");
    const result = applyViewsWithRevisions(source, [{ sheetId: "REED-005", mediaId: target.media[0].id, view: null }], meta, domain);
    const sheet = sheetOf(result.file, "REED-005");
    assert.equal("view" in sheet.media[0], false);
    assert.equal(sheet.revision, String(Number(target.revision) + 1));
  });

  it("même vue : aucun changement, aucune révision", () => {
    const target = sheetOf(source, "FIT-CRO-010");
    const result = applyViewsWithRevisions(source,
      [{ sheetId: "FIT-CRO-010", mediaId: target.media[0].id, view: target.media[0].view ?? null }], meta, domain);
    assert.equal(result.changed, false);
    assert.deepEqual(result.changedSheets, []);
    assert.equal(result.file.catalogue.revision, source.catalogue.revision);
  });

  it("photo inconnue : refus", () => {
    assert.throws(() => applyViewsWithRevisions(source, [{ sheetId: "FIT-CRO-010", mediaId: "media-inconnu", view: null }], meta, domain));
  });
});
