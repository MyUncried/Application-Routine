'use strict';
const fs=require('node:fs'),path=require('node:path');
const Identity=require('../../../scripts/kodjo/lib/slice-identity');
const Cutover=require('../../../scripts/kodjo/lib/vnext-cutover-contract');
const Remote=require('../../../scripts/kodjo/lib/vnext-remote-write-security');
function register(repo,sliceId,issue=999,{dependencies=[]}={}){
 const write=(file,value)=>{const name=path.join(repo.cwd,file);fs.mkdirSync(path.dirname(name),{recursive:true});fs.writeFileSync(name,JSON.stringify(value,null,2)+'\n');};
 const base=repo.git('rev-parse','HEAD');
 const frozen={schema_version:Identity.REGISTRY_SCHEMA,activations:[{slice_id:'OLD-FIXTURE',status:'ACTIVE'},{slice_id:'PROTECTED-FIXTURE',status:'CLOSED'}]};
 const policy={schema_version:Remote.POLICY_SCHEMA,policy_mode:'CUTOVER_PREPARATION',frozen_workflows:[],frozen_scripts:[],declared_vnext_writers:[],retirement_rule:'REMOVE_OR_DISABLE_ALL_LEGACY_WRITERS_AFTER_LAST_LEGACY_SLICE'};
 policy.frozen_scripts=Remote.scanRepository(repo.cwd).files.map(r=>({path:r.path,blob_oid:r.blob_oid,authorization_condition:'TEST ONLY frozen legacy source'}));
 const plan=Cutover.buildCutoverPlan({candidateHead:base,candidatePr:1,qualificationRunId:1,qualificationStatus:'QUALIFIED_ON_VNEXT_PERIMETER',legacyActivationRegistry:frozen,protectedLegacySliceIds:['PROTECTED-FIXTURE'],remoteWriteAttestation:Remote.evaluateRemoteWriteSecurity({root:repo.cwd,policy,legacyActivationRegistry:frozen})});
 const activation=Cutover.buildActivationRecord({cutoverPlan:plan,currentLegacyActivationRegistry:frozen,activatedAtProtocolHead:base,approvalEvidence:{decision:'APPROVED',actor_id:'TEST ONLY',evidence_ref:'DISPOSABLE FIXTURE',observed_at:'2026-10-14T00:00:00.000Z',approved_cutover_plan_hash:plan.contract_hash}});
 for(const [file,value]of Object.entries({'cutover-plan.json':plan,'activation.json':activation,'legacy-registry-at-activation.json':frozen}))write('.github/orchestration/vnext-cutover/'+file,value);
 const bootstrap={schema_version:Identity.BOOTSTRAP_SCHEMA,slice_id:sliceId,issue_number:issue,repository:'MyUncried/Application-Routine',target_branch:'main',baseline_head:base,protocol_version:'0.6.12',protocol_commit:base,activation_registry:'.github/orchestration/v2-activation-registry.json',previous_slice_id:null,previous_checkpoint:null,product_sources:[{path:'docs/spec.md',sha256:'a'.repeat(64)}],authorized_actors:['MyUncried'],created_at:'2026-10-14T00:00:00.000Z',protocol:'VNEXT',operation_dependencies:dependencies};
 bootstrap.slice_bootstrap_sha256=Identity.sha256(Identity.canonical(bootstrap));
 const bp='.github/orchestration/v2-slices/'+sliceId+'/slice-bootstrap.json';write(bp,bootstrap);
 write(bootstrap.activation_registry,{schema_version:Identity.REGISTRY_SCHEMA,activations:[{slice_id:sliceId,status:'ACTIVE',issue_number:issue,baseline_head:base,bootstrap_path:bp,slice_bootstrap_sha256:bootstrap.slice_bootstrap_sha256}]});
 repo.git('add','.');repo.git('commit','-m','TEST ONLY registered VNext operation identity');
 return {bootstrap,write,head:repo.git('rev-parse','HEAD')};
}
module.exports={register};
