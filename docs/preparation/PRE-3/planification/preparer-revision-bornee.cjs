'use strict';
// Prepare the authorized semantic patch and diagnose scope conflicts.
// Does not change contracts, invoke a reviewer or approve the plan.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../../..');
const B=require(path.join(root,'scripts/kodjo/lib/vnext-file-bundle'));
const V=require(path.join(root,'scripts/kodjo/lib/vnext-contract'));
const R=require(path.join(root,'scripts/kodjo/lib/revision-contract'));
const [registryFile,allowedFile,out]=process.argv.slice(2);
if(![registryFile,allowedFile,out].every(x=>x&&path.isAbsolute(x)))throw Error('Usage: absolute registry allowed-change-set output-directory');
const registry=B.read(registryFile),allowed=B.read(allowedFile);
R.validateAllowedChangeSet(allowed);
if(allowed.contract_hash!=='481f2b88d48c128a01c14014fdc4e952a17d6bd985952ea20fad9faab93d2d39')throw Error('Exact PRE3 clarified AllowedChangeSet required');
const ledger=JSON.parse(fs.readFileSync(path.join(__dirname,'registre-corrections-revue-initiale.json'),'utf8'));
const findings=new Map(ledger.findings.map(x=>[x.finding_id,x]));
const corrections=allowed.authorized_targets.map(t=>({target_type:t.target_type,target_id:t.target_id,finding_ids:t.finding_ids,correction:t.finding_ids.map(id=>findings.get(id).required_correction).join('\n')}));
const patch=R.buildRevisionPatch({allowedChangeSet:allowed,corrections});
R.validateRevisionPatch(patch,allowed);
const application=R.applyRevisionPatch({allowedChangeSet:allowed,revisionPatch:patch});
const preserved=new Map(allowed.preserved_targets.map(t=>[t.target_id,t]));
const documentary=registry.requirements.filter(q=>q.unit_id==='UNIT-d27f377c24336720e09fd06b');
const locked=documentary.filter(q=>preserved.has(q.requirement_id));
const example=locked.find(q=>q.rationale.includes('PRE3-DOC-P3-16-parent-guard'));
if(!example)throw Error('Expected preserved functional example missing');
const proposed={...example,kind:'FUNCTIONAL'};
let rejection=null;
try{R.buildRevisionPatch({allowedChangeSet:allowed,corrections:[{target_type:'REQUIREMENT',target_id:example.requirement_id,finding_ids:['FND-45a23a9dc1c196e22ec192fd'],correction:'Reclassify the parent draft cancellation rule as FUNCTIONAL without changing its semantics.'}]});}catch(e){rejection={code:e.code||null,message:e.message};}
if(!rejection||!rejection.message.includes('VNEXT_REVISION_PATCH_TARGET_UNAUTHORIZED'))throw Error('Expected canonical unauthorized-target refusal not observed');
const result={operation:340,status:'BLOCKED_BY_REVIEW_AUTHORIZATION_SCOPE',allowed_change_set_hash:allowed.contract_hash,revision_patch_hash:patch.contract_hash,revision_application_hash:application.contract_hash,canonical_patch_validation:'PASS',blocking_findings_covered:allowed.blocking_finding_ids.length,authorized_corrections:corrections.length,patch_applied_to_artifacts:false,documentary_requirements:documentary.length,documentary_preserved_requirements:locked.length,example:{target_id:example.requirement_id,statement:example.statement,current_kind:example.kind,proposed_kind:proposed.kind,mutation_mode:preserved.get(example.requirement_id).mutation_mode,original_hash:V.canonicalHash(example),proposed_hash:V.canonicalHash(proposed),canonical_patch_rejection:rejection},review_scope_conflict:{finding_id:'FND-45a23a9dc1c196e22ec192fd',source_anchor:'UNIT-d27f377c24336720e09fd06b',anchor_mode:'ANCHOR_ONLY',preserved_documentary_target_ids:locked.map(q=>q.requirement_id),interpretation:'The report requests re-registration of documentary requirements with their actual kinds; 91 of 95 existing documentary requirements must nevertheless remain byte-for-byte equivalent in the allowed graph. An anchor does not authorize their mutation (spec 17.3). This diagnostic does not authorize expanding the scope.'},independent_review:false,owner_plan_approval:false,implementation_started:false};
fs.mkdirSync(out,{recursive:true});
for(const [name,value]of Object.entries({'revision-patch.json':patch,'revision-application.json':application,'diagnostic-portee-revision.json':result}))fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));
