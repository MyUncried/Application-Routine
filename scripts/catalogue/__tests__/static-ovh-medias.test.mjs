import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const html = readFileSync(
  new URL("../../../tools/catalogue-admin/static-ovh/index.html", import.meta.url),
  "utf8",
);

describe("Administration statique OVH — médias facultatifs", () => {
  it("reste une seule page HTML autonome sans ressource script externe", () => {
    assert.match(html, /<!doctype html>/i);
    assert.match(html, /<title>KODJO \| Administration des mouvements<\/title>/);
    assert.doesNotMatch(html, /<script\s+src=/i);
    assert.match(html, /<\/html>/i);
  });

  it("présente la galerie et les trois modes d'ajout", () => {
    assert.match(html, /id="mediaSection"/);
    for (const mode of ["PHOTO_FILE", "PHOTO_URL", "VIDEO_URL"]) {
      assert(html.includes('value="' + mode + '"'));
    }
    assert.match(html, /id="mediaGallery"/);
    assert.match(html, /id="mediaCount"/);
  });

  it("conserve la preuve de provenance et les droits sans les approuver implicitement", () => {
    for (const field of ["mediaRights", "mediaSourceUrl", "mediaAttribution", "mediaLicense", "mediaAlt"]) {
      assert(html.includes('id="' + field + '"'));
    }
    assert.match(html, /UNVERIFIED/);
    assert.match(html, /PERMISSION_CONFIRMED/);
    assert.match(html, /RESTRICTED/);
    assert.match(html, /aucune donnée transmise au serveur/i);
  });

  it("interdit les URL non HTTPS et les médias locaux trop volumineux", () => {
    assert.match(html, /protocol === 'https:'/);
    assert.match(html, /MAX_PHOTO_SOURCE_BYTES\s*=\s*8\s*\*\s*1024\s*\*\s*1024/);
    assert.match(html, /MAX_DRAFT_JSON_BYTES\s*=\s*24\s*\*\s*1024\s*\*\s*1024/);
    assert.match(html, /mediaCollectionError/);
  });

  it("ne publie ni les fiches non validées ni les médias au chargement", () => {
    assert.match(html, /id="importCatalog"/);
    assert.match(html, /publicationAllowed\s*:\s*false/);
    assert.match(html, /exportJson\(/);
    assert.doesNotMatch(html, /fetch\(\s*['"]\/api\/drafts/);
  });
});
