import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Validateur du projet de taxonomie v0. Vérification structurelle uniquement.
 * Ne reconnaît aucune catégorie / zone comme officiellement validée : les
 * référentiels utilisateur KODJO restent les autorités runtime.
 */
export function validateTaxonomyProposal(data) {
  const errors = [];
  if (!data || typeof data !== "object") return ["Invalid taxonomy object"];
  if (data.documentType !== "KODJO_TAXONOMY_DRAFT") errors.push("Unexpected documentType");
  if (data.schemaVersion !== "0.1.0") errors.push("Unexpected schemaVersion");
  if (data.status !== "PROPOSED_NOT_APPROVED") errors.push("Status must be PROPOSED_NOT_APPROVED");
  if (data.publicationAllowed !== false) errors.push("Publication must be disabled");
  if (data.currentProductConstraints?.category?.createNewObjectivesReferential !== false) {
    errors.push("A separate Objectives referential is forbidden");
  }
  const axes = data.proposedAxes;
  if (!axes || typeof axes !== "object") return [...errors, "Missing proposedAxes"];
  const keys = ["specialties", "gesturalFamilies", "clinicalProblems", "anatomicalTargets"];
  const valuesByKey = {};
  for (const key of keys) {
    const group = axes[key];
    if (!group || !Array.isArray(group.values)) {
      errors.push(`Missing referential ${key}`);
      continue;
    }
    const ids = new Set();
    for (const item of group.values) {
      if (!item || typeof item.id !== "string" || !item.id.trim() ||
          typeof item.label !== "string" || !item.label.trim() ||
          item.status !== "PROPOSED") {
        errors.push(`Invalid referential value in ${key}`);
        continue;
      }
      if (ids.has(item.id)) errors.push(`Duplicate ${key} id: ${item.id}`);
      ids.add(item.id);
      if (key === "clinicalProblems" &&
          (!["DIAGNOSIS","SYMPTOM","FUNCTIONAL_DEFICIT"].includes(item.kind) ||
           item.requiresClinicalValidation !== true)) errors.push(`Invalid clinical value: ${item.id}`);
      if (key === "anatomicalTargets" &&
          (!["MUSCLE","MUSCLE_GROUP","JOINT","ANATOMICAL_STRUCTURE"].includes(item.kind))) {
        errors.push(`Invalid anatomical target: ${item.id}`);
      }
    }
    valuesByKey[key] = ids;
  }
  if (!Array.isArray(data.pilotClassificationExamples)) {
    return [...errors, "Missing pilotClassificationExamples"];
  }
  const samples = new Set();
  for (const ex of data.pilotClassificationExamples) {
    if (typeof ex.sourceId !== "string" || !/^(REED|FIT)-/.test(ex.sourceId)) {
      errors.push("Invalid pilot sourceId");
      continue;
    }
    if (samples.has(ex.sourceId)) errors.push(`Duplicate sample: ${ex.sourceId}`);
    samples.add(ex.sourceId);
    if (typeof ex.categoryId !== "string" || !ex.categoryId.trim()) errors.push(`Missing Category for ${ex.sourceId}`);
    if (!Array.isArray(ex.bodyZoneIds) || !ex.bodyZoneIds.length) errors.push(`Missing Zones for ${ex.sourceId}`);
    for (const [field, key] of [
      ["specialtyIds","specialties"],
      ["gesturalFamilyIds","gesturalFamilies"],
      ["anatomicalTargetIds","anatomicalTargets"],
    ]) {
      if (!Array.isArray(ex[field])) {
        errors.push(`Invalid ${field} for ${ex.sourceId}`);
        continue;
      }
      for (const id of ex[field]) if (!valuesByKey[key]?.has(id)) {
        errors.push(`Unknown ${key}: ${String(id)} in ${ex.sourceId}`);
      }
    }
    if (!Array.isArray(ex.proposedClinicalAssociations)) {
      errors.push(`Invalid clinical associations for ${ex.sourceId}`);
    } else {
      for (const link of ex.proposedClinicalAssociations) {
        if (!valuesByKey.clinicalProblems?.has(link.problemId) ||
            link.status !== "PENDING_CLINICAL_VALIDATION") {
          errors.push(`Invalid clinical association in ${ex.sourceId}`);
        }
      }
    }
    if (ex.editorialStatus !== "PROPOSED_ONLY") errors.push(`Premature publication of ${ex.sourceId}`);
  }
  if (samples.size !== 12) errors.push(`Expected 12 samples, found ${samples.size}`);
  return errors;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const path = process.argv[2] ?? "catalogue/referentiels/taxonomie-v0-proposition.json";
  try {
    const json = JSON.parse(readFileSync(path, "utf8"));
    const issues = validateTaxonomyProposal(json);
    if (issues.length) {
      console.error(issues.join("\n"));
      process.exitCode = 1;
    } else {
      console.log("Taxonomie v0 structurée : 12 exemples, aucune valeur publiée.");
    }
  } catch (error) {
    console.error(String(error));
    process.exitCode = 1;
  }
}
