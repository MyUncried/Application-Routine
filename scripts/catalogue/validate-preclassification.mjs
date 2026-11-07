import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** V0 : validation structurelle et réconciliation NON PUBLIANTE des classifications. */
const AXES = {
  specialtyIds: "specialties",
  gesturalFamilyIds: "gesturalFamilies",
  anatomicalTargetIds: "anatomicalTargets",
  clinicalProblemIds: "clinicalProblems",
};
const filled = (x) => typeof x === "string" && x.trim().length > 0;
const unique = (array) => Array.isArray(array) && new Set(array).size === array.length;
export function predefinedIds(tsSource) {
  const ids = [...tsSource.matchAll(/\{\s*id: "([^"]+)",\s*name:/g)].map(x=>x[1]);
  if (ids.length !== 10 || new Set(ids).size !== 10) throw new Error("Invalid seed reference set");
  return new Set(ids);
}
export function validatePreclassification({ pilot, taxonomy, proposals, categoryIds, zoneIds }) {
  const issues = [];
  const err = (field, message) => issues.push(field + ": " + message);
  if (pilot?.kind !== "KODJO_EDITORIAL_CANDIDATE_CORPUS" || pilot.publicationAllowed !== false) err("pilot", "untrusted source");
  if (taxonomy?.status !== "PROPOSED_NOT_APPROVED" || taxonomy.publicationAllowed !== false) err("taxonomy", "must be a proposal");
  if (proposals?.kind !== "KODJO_CLASSIFICATION_PROPOSALS" || proposals.publicationAllowed !== false || proposals.status !== "PROPOSED_NOT_APPROVED") err("proposals", "publication status invalid");
  if (!Array.isArray(proposals?.records)) return [...issues, "proposals.records: missing"];
  const candidates = new Map((pilot?.records ?? []).map(x => [x.candidateId, x]));
  const available = Object.fromEntries(Object.entries(AXES).map(([field, axis])=>[field,new Set(taxonomy.proposedAxes[axis].values.map(x=>x.id))]));
  const seen = new Set();
  for (const record of proposals.records) {
    const prefix = record?.candidateId || "<missing>";
    if (!record || !filled(prefix)) {err("record", "invalid"); continue;}
    if (seen.has(prefix)) err(prefix,"duplicate");
    seen.add(prefix);
    const existing = candidates.get(prefix);
    if (!existing || existing.originalId !== record.originalId || existing.name !== record.name) err(prefix,"does not match pilot candidate");
    if (!categoryIds.has(record.categoryId)) err(prefix,"unknown KODJO category");
    if (!unique(record.bodyZoneIds) || !record.bodyZoneIds.length || record.bodyZoneIds.some(x=>!zoneIds.has(x))) err(prefix,"invalid KODJO body zones");
    for (const [field, set] of Object.entries(available)) {
      const arr = record[field];
      if (!unique(arr) || (field==="specialtyIds" && arr.length===0) || arr.some(x=>!set.has(x))) err(prefix, "invalid "+field);
    }
    if (record.clinicalProblemIds.length) err(prefix, "clinical problems must remain unassigned before clinical review");
    if (record.review?.status !== "PENDING" || record.review?.needsReview !== true ||
        !Array.isArray(record.review.flags)) err(prefix,"not explicitly pending review");
    if (record.publicationAllowed !== false || record.licensing !== "UNVERIFIED" || record.clinicalValidation !== "NOT_APPROVED") err(prefix,"publication/rights guard failed");
  }
  if (seen.size !== candidates.size || proposals.sourceCandidateCount !== candidates.size) err("coverage","expected exactly "+candidates.size+" records");
  return issues;
}

/**
 * Ajoute UNIQUEMENT des valeurs à des emplacements vides.
 * Aucun média, nom, étape, auteur, propriétaire, note ni glossaire existant
 * n'est remplacé. L'utilisateur doit exporter sa sauvegarde locale avant et après.
 */
export function mergeProposalsIntoDrafts(pilot, proposals, inputDraft) {
  if (!inputDraft || inputDraft.kind !== "KODJO_ADMIN_DRAFTS" || inputDraft.publicationAllowed !== false ||
      !inputDraft.movementEdits || !inputDraft.referenceAdditions || !inputDraft.referenceLabels ||
      !Array.isArray(inputDraft.glossary)) throw new Error("Unrecognized drafts");
  const allowed = new Set(pilot.records.map(x=>x.candidateId));
  for (const id of Object.keys(inputDraft.movementEdits)) if(!allowed.has(id)) throw new Error("Foreign draft candidate: "+id);
  const result = structuredClone(inputDraft);
  let created=0,filledFields=0,preservedFields=0;
  const proposalsById = new Map(proposals.records.map(x => [x.candidateId,x]));
  for (const candidate of pilot.records) {
    const p = proposalsById.get(candidate.candidateId);
    if (!p) throw new Error("Missing proposal for "+candidate.candidateId);
    const old = result.movementEdits[candidate.candidateId];
    const edit = old ?? {
      name: candidate.name,
      steps: [...candidate.description.steps],
      aliases: [], categoryId:null,bodyZoneIds:[],specialtyIds:[],
      gesturalFamilyIds:[],clinicalProblemIds:[],anatomicalTargetIds:[],
      owner:null,authors:[],notes:"",editorialStatus:"DRAFT",media:[],
    };
    if (!old) created++;
    for (const field of ["categoryId","bodyZoneIds","specialtyIds","gesturalFamilyIds","anatomicalTargetIds"]) {
      const current = edit[field];
      const empty = current == null || (Array.isArray(current) && current.length===0);
      if (empty) {edit[field] = structuredClone(p[field]);filledFields++;}
      else preservedFields++;
    }
    // Les problèmes cliniques sont volontairement laissés inchangés.
    result.movementEdits[candidate.candidateId] = edit;
  }
  return { drafts:result, statistics:{created,filledFields,preservedFields}, publicationAllowed:false };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const base = resolve(process.cwd());
  const load = (path) => JSON.parse(readFileSync(resolve(base,path),"utf8"));
  const pilot=load("catalogue/pilote/mouvements-60-candidats.json");
  const taxonomy=load("catalogue/referentiels/taxonomie-v0-proposition.json");
  const proposals=load("catalogue/referentiels/preclassement-60-candidats-v0.json");
  const categoryIds=predefinedIds(readFileSync(resolve(base,"src/domain/categories/defaults.ts"),"utf8"));
  const zoneIds=predefinedIds(readFileSync(resolve(base,"src/features/reference-data/bodyZones.ts"),"utf8"));
  const errors=validatePreclassification({pilot,taxonomy,proposals,categoryIds,zoneIds});
  if(errors.length) {console.error(errors.join("\n"));process.exitCode=1;}
  else console.log("Préclassement : 60/60 candidats, 0 référence inconnue, 0 autorisation de publication, 60 revues requises.");
}
