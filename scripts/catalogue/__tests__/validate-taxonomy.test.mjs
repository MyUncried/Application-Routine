import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { validateTaxonomyProposal } from "../validate-taxonomy.mjs";

const file = new URL("../../../catalogue/referentiels/taxonomie-v0-proposition.json", import.meta.url);
const current = JSON.parse(readFileSync(file, "utf8"));

describe("Taxonomie KODJO V0 — proposition", () => {
  it("valide le corpus d'arbitrage de 12 exemples, sans publication", () => {
    assert.deepEqual(validateTaxonomyProposal(current), []);
  });

  it("refuse un Objectif distinct de la Catégorie KODJO", () => {
    const data = structuredClone(current);
    data.currentProductConstraints.category.createNewObjectivesReferential = true;
    assert(validateTaxonomyProposal(data).some((x) => x.includes("Objectives")));
  });

  it("refuse les références gestuelles inconnues", () => {
    const data = structuredClone(current);
    data.pilotClassificationExamples[0].gesturalFamilyIds.push("unknown-family");
    assert(validateTaxonomyProposal(data).some((x) => x.includes("Unknown gesturalFamilies")));
  });

  it("refuse la publication ou validation clinique implicite", () => {
    const data = structuredClone(current);
    data.publicationAllowed = true;
    data.pilotClassificationExamples[0].proposedClinicalAssociations[0].status = "APPROVED";
    const errors = validateTaxonomyProposal(data);
    assert(errors.some((x) => x.includes("Publication must be disabled")));
    assert(errors.some((x) => x.includes("Invalid clinical association")));
  });

  it("refuse les collisions d'identifiants", () => {
    const data = structuredClone(current);
    data.proposedAxes.specialties.values[1].id = data.proposedAxes.specialties.values[0].id;
    assert(validateTaxonomyProposal(data).some((x) => x.includes("Duplicate specialties")));
  });
});
