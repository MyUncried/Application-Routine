import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Garde-fou pour le corpus pilote éditorial NON PUBLIABLE.
 * N'effectue aucun import SQLite et ne requalifie aucune valeur métier.
 */
export function validatePilotCorpus(corpus) {
  const errors = [];
  if (!corpus || typeof corpus !== "object") return ["Invalid corpus object"];
  if (corpus.kind !== "KODJO_EDITORIAL_CANDIDATE_CORPUS") errors.push("Invalid corpus kind");
  if (corpus.schemaVersion !== "0.1.0") errors.push("Unsupported corpus version");
  if (corpus.publicationAllowed !== false) errors.push("Publication must be disabled");
  if (!Array.isArray(corpus.records)) return [...errors, "Missing records"];

  const ids = new Set();
  const originalIds = new Set();
  let totalSteps = 0;
  for (const [i, r] of corpus.records.entries()) {
    const prefix = `records[${i}]`;
    if (!r || typeof r !== "object") {
      errors.push(`${prefix}: invalid entry`);
      continue;
    }
    if (typeof r.candidateId !== "string" || !r.candidateId.startsWith("pilot:")) {
      errors.push(`${prefix}: invalid candidateId`);
    } else if (ids.has(r.candidateId)) {
      errors.push(`${prefix}: duplicate candidateId`);
    } else ids.add(r.candidateId);
    if (typeof r.originalId !== "string" || !/^(REED|FIT)-/.test(r.originalId)) {
      errors.push(`${prefix}: invalid originalId`);
    } else if (originalIds.has(r.originalId)) {
      errors.push(`${prefix}: duplicate originalId`);
    } else originalIds.add(r.originalId);
    if (r.candidateId !== `pilot:${r.originalId}`) errors.push(`${prefix}: inconsistent IDs`);
    if (!r.name || typeof r.name !== "string" || !r.name.trim()) errors.push(`${prefix}: no name`);
    if (r.reviewStatus !== "UNREVIEWED") errors.push(`${prefix}: unapproved status`);
    if (!Array.isArray(r.proposedSpecialties) || r.proposedSpecialties.length < 1) {
      errors.push(`${prefix}: missing proposed specialty`);
    }
    // Aucun mapping non arbitré ne doit devenir une valeur de production.
    if (r.kodjoCategoryId !== null || !Array.isArray(r.kodjoBodyZoneIds) || r.kodjoBodyZoneIds.length !== 0) {
      errors.push(`${prefix}: premature KODJO mapping`);
    }
    const steps = r.description?.steps;
    if (!Array.isArray(steps) || steps.length < 3 || steps.length > 4) {
      errors.push(`${prefix}: invalid steps`);
    } else {
      totalSteps += steps.length;
      if (steps.some((s) => typeof s !== "string" || !s.trim() || [...s].length > 65)) {
        errors.push(`${prefix}: step is empty or exceeds 65 characters`);
      }
    }
    const evidence = r.evidence;
    if (!evidence || typeof evidence.sourceId !== "string" || !evidence.sourceId.trim() ||
        typeof evidence.url !== "string" || !/^https:\/\//.test(evidence.url)) {
      errors.push(`${prefix}: missing documentary source`);
    }
    if (r.validation?.classification !== "PENDING" || r.validation?.rights !== "PENDING") {
      errors.push(`${prefix}: unsupported validation claim`);
    }
  }
  if (corpus.records.length !== 60) errors.push(`Expected 60 candidates, got ${corpus.records.length}`);
  if (totalSteps !== 239) errors.push(`Expected 239 steps, got ${totalSteps}`);
  return errors;
}

const invokedFile = process.argv[1];
if (invokedFile && fileURLToPath(import.meta.url) === invokedFile) {
  const file = process.argv[2] ?? "catalogue/pilote/mouvements-60-candidats.json";
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    const errors = validatePilotCorpus(parsed);
    if (errors.length > 0) {
      console.error(errors.join("\n"));
      process.exitCode = 1;
    } else {
      console.log(`Corpus pilote valide: ${parsed.records.length} candidats, 239 étapes, publication interdite.`);
    }
  } catch (error) {
    console.error(String(error));
    process.exitCode = 1;
  }
}
