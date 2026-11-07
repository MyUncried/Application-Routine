import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { validatePilotCorpus } from "../validate-pilot-corpus.mjs";

const source = new URL("../../../catalogue/pilote/mouvements-60-candidats.json", import.meta.url);
const catalogue = JSON.parse(readFileSync(source, "utf8"));

describe("Validation du corpus pilote éditorial", () => {
  it("préserve les 60 candidats et les 239 étapes sans autorisation de publication", () => {
    assert.deepEqual(validatePilotCorpus(catalogue), []);
  });

  it("refuse l'activation de publication et la classification avant arbitrage", () => {
    const changed = structuredClone(catalogue);
    changed.publicationAllowed = true;
    changed.records[0].kodjoCategoryId = "renforcement";
    const issues = validatePilotCorpus(changed);
    assert(issues.some((issue) => issue.includes("Publication must be disabled")));
    assert(issues.some((issue) => issue.includes("premature KODJO mapping")));
  });

  it("détecte les collisions d'ID et les sources manquantes", () => {
    const changed = structuredClone(catalogue);
    changed.records[1].candidateId = changed.records[0].candidateId;
    changed.records[1].evidence.url = "";
    const issues = validatePilotCorpus(changed);
    assert(issues.some((issue) => issue.includes("duplicate candidateId")));
    assert(issues.some((issue) => issue.includes("missing documentary source")));
  });

  it("refuse une étape trop longue", () => {
    const changed = structuredClone(catalogue);
    changed.records[1].description.steps[0] = "x".repeat(66);
    assert(validatePilotCorpus(changed).some((issue) => issue.includes("exceeds 65")));
  });
});
