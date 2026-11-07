import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { validatePreclassification, predefinedIds, mergeProposalsIntoDrafts } from "../validate-preclassification.mjs";

const root = new URL("../../../", import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p,root),"utf8"));
const pilot = read("catalogue/pilote/mouvements-60-candidats.json");
const taxonomy = read("catalogue/referentiels/taxonomie-v0-proposition.json");
const proposals = read("catalogue/referentiels/preclassement-60-candidats-v0.json");
const categoryIds = predefinedIds(readFileSync(new URL("src/domain/categories/defaults.ts",root),"utf8"));
const zoneIds = predefinedIds(readFileSync(new URL("src/features/reference-data/bodyZones.ts",root),"utf8"));
const args = {pilot,taxonomy,proposals,categoryIds,zoneIds};
const emptyDrafts=()=>({
 schemaVersion:"0.1.0",kind:"KODJO_ADMIN_DRAFTS",publicationAllowed:false,
 movementEdits:{},
 referenceAdditions:{specialties:[],gesturalFamilies:[],clinicalProblems:[],anatomicalTargets:[]},
 referenceLabels:{specialties:{},gesturalFamilies:{},clinicalProblems:{},anatomicalTargets:{}},
 glossary:[],
});
describe("Préclassement 60 fiches KODJO — V0 non approuvée",()=>{
 it("contrôle l'intégralité des 60 propositions contre les sources physiques KODJO",()=>{
   assert.deepEqual(validatePreclassification(args),[]);
   assert.equal(proposals.records.length,60);
   assert.equal(proposals.records.filter(x=>x.review.flags.length).length,9);
   assert(proposals.records.every(x=>x.review.needsReview));
 });
 it("refuse une Catégorie KODJO inconnue et une zone inconnue",()=>{
   const a=structuredClone(proposals);
   a.records[0].categoryId="objectif-nouveau";
   a.records[1].bodyZoneIds=["zone-inconnue"];
   const errors=validatePreclassification({...args,proposals:a});
   assert(errors.some(x=>x.includes("unknown KODJO category")));
   assert(errors.some(x=>x.includes("invalid KODJO body zones")));
 });
 it("refuse les références gestuelles inconnues et les candidats manquants",()=>{
   const a=structuredClone(proposals);
   a.records[0].gesturalFamilyIds.push("does-not-exist");
   a.records.pop();
   const errors=validatePreclassification({...args,proposals:a});
   assert(errors.some(x=>x.includes("invalid gesturalFamilyIds")));
   assert(errors.some(x=>x.includes("coverage")));
 });
 it("refuse une autorisation de publication et une indication clinique implicite",()=>{
   const a=structuredClone(proposals);
   a.publicationAllowed=true;
   a.records[0].clinicalProblemIds=["knee-strength-deficit"];
   const errors=validatePreclassification({...args,proposals:a});
   assert(errors.some(x=>x.includes("publication status invalid")));
   assert(errors.some(x=>x.includes("clinical problems must remain unassigned")));
 });
 it("génère uniquement des brouillons, sans altérer les photos et les saisies existantes",()=>{
   const d=emptyDrafts();
   const id=pilot.records[0].candidateId;
   const media=[{id:"photo-a",kind:"PHOTO",url:"data:image/jpeg;base64,ZGF0YQ==",caption:"photo d'essai"}];
   d.movementEdits[id]={name:"Ma version personnalisée",steps:["Une étape personnelle"],
    aliases:["Mon alias"],categoryId:"equilibre",bodyZoneIds:["cou"],
    specialtyIds:["yoga"],gesturalFamilyIds:[],clinicalProblemIds:["knee-strength-deficit"],
    anatomicalTargetIds:[],owner:{kind:"LOCAL_USER",id:"local"},
    authors:[],notes:"Une note importante",editorialStatus:"DRAFT",media};
   const source=structuredClone(d);
   const merged=mergeProposalsIntoDrafts(pilot,proposals,d);
   assert.deepEqual(d,source,"Le fichier source doit rester inchangé");
   assert.deepEqual(merged.drafts.movementEdits[id].media,media);
   assert.equal(merged.drafts.movementEdits[id].categoryId,"equilibre");
   assert.deepEqual(merged.drafts.movementEdits[id].bodyZoneIds,["cou"]);
   assert.deepEqual(merged.drafts.movementEdits[id].specialtyIds,["yoga"]);
   assert.deepEqual(merged.drafts.movementEdits[id].clinicalProblemIds,["knee-strength-deficit"]);
   assert.equal(merged.drafts.movementEdits[id].name,"Ma version personnalisée");
   assert.equal(merged.drafts.movementEdits[id].notes,"Une note importante");
   assert.equal(Object.keys(merged.drafts.movementEdits).length,60);
   assert.equal(merged.drafts.publicationAllowed,false);
   assert.equal(merged.statistics.created,59);
 });
 it("est idempotent lors d'un second rapprochement",()=>{
   const first=mergeProposalsIntoDrafts(pilot,proposals,emptyDrafts());
   const second=mergeProposalsIntoDrafts(pilot,proposals,first.drafts);
   assert.deepEqual(second.drafts,first.drafts);
   assert.equal(second.statistics.created,0);
 });
 it("refuse les brouillons de démonstration étrangers au catalogue de 60 fiches",()=>{
   const d=emptyDrafts();
   d.movementEdits["demo:AIR-SQUAT"]={name:"Démo"};
   assert.throws(()=>mergeProposalsIntoDrafts(pilot,proposals,d),/Foreign draft/);
 });
});