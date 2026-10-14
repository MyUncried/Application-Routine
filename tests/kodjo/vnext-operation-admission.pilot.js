'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const V=require('../../scripts/kodjo/lib/vnext-contract'),Identity=require('../../scripts/kodjo/lib/slice-identity');
const Admission=require('../../scripts/kodjo/lib/vnext-operation-admission'),Fixture=require('./helpers/vnext-figma-fixture'),Registration=require('./helpers/vnext-operation-admission-fixture');
function fixture(t){const repo=Fixture.fixture();t.after(()=>repo.cleanup());Registration.register(repo,'VNEXT-DEPENDENT',999);const bootstrapPath='.github/orchestration/v2-slices/VNEXT-DEPENDENT/slice-bootstrap.json',registryPath='.github/orchestration/v2-activation-registry.json';
 const bootstrap=JSON.parse(fs.readFileSync(path.join(repo.cwd,bootstrapPath))),registry=JSON.parse(fs.readFileSync(path.join(repo.cwd,registryPath)));
 const checkpoint=V.sealContract({schema_version:'kodjo.vnext.github-closure.v1',slice_id:'PREREQUISITE',issue_number:123,status:'SLICE_CLOSED',github_issue_closed:true,provenance:'TEST ONLY DISPOSABLE FIXTURE'}),checkpointPath='.github/orchestration/prerequisite-closed.json';
 repo.write(checkpointPath,JSON.stringify(checkpoint));registry.activations.push({slice_id:'PREREQUISITE',issue_number:123,status:'CLOSED'});
 const dependency={slice_id:'PREREQUISITE',checkpoint_path:checkpointPath,checkpoint_hash:checkpoint.contract_hash};
 function commit(){delete bootstrap.slice_bootstrap_sha256;bootstrap.slice_bootstrap_sha256=Identity.sha256(Identity.canonical(bootstrap));registry.activations.find(r=>r.slice_id===bootstrap.slice_id).slice_bootstrap_sha256=bootstrap.slice_bootstrap_sha256;repo.write(bootstrapPath,JSON.stringify(bootstrap));repo.write(registryPath,JSON.stringify(registry));repo.git('add','.');repo.git('commit','-m','TEST ONLY operation dependency state');return {slice_id:bootstrap.slice_id,issue_number:999,repository:bootstrap.repository,source_head:repo.git('rev-parse','HEAD')};}
 return {repo,bootstrap,registry,dependency,checkpointPath,commit};
}
test('exact declared dependencies admit without any unrelated issue prerequisite and preserve immutable checkpoint binding',t=>{
 const f=fixture(t);f.bootstrap.operation_dependencies=[f.dependency];const request=f.commit();const result=Admission.admit(request,{cwd:f.repo.cwd,trustedCwd:f.repo.cwd,actor:'MyUncried'});
 assert.equal(result.dependencies.length,1);assert.equal(result.dependencies[0].issue_number,123);assert.ok(!result.dependencies.some(d=>d.issue_number===340));
 f.repo.write(f.checkpointPath,JSON.stringify(V.sealContract({slice_id:'OTHER',status:'TEST ONLY'})));f.repo.git('add','.');f.repo.git('commit','-m','TEST ONLY changed source checkpoint');
 assert.throws(()=>Admission.admit({...request,source_head:f.repo.git('rev-parse','HEAD')},{cwd:f.repo.cwd,trustedCwd:f.repo.cwd}),/CHECKPOINT_MISMATCH/);
 // The archived original is still verified from its exact source bytes.
 assert.equal(Admission.admit(request,{cwd:f.repo.cwd,trustedCwd:f.repo.cwd}).dependencies[0].checkpoint_hash,f.dependency.checkpoint_hash);
});
test('open dependencies, cycles, opaque previous checkpoints and current closed cycles cannot be admitted from old active bytes',t=>{
 const f=fixture(t);f.bootstrap.operation_dependencies=[f.dependency];f.registry.activations.find(r=>r.slice_id==='PREREQUISITE').status='ACTIVE';assert.throws(()=>Admission.admit(f.commit(),{cwd:f.repo.cwd,trustedCwd:f.repo.cwd}),/DEPENDENCY_NOT_CLOSED/);
 f.registry.activations.find(r=>r.slice_id==='PREREQUISITE').status='CLOSED';f.bootstrap.operation_dependencies=[{...f.dependency,slice_id:'VNEXT-DEPENDENT'}];assert.throws(()=>Admission.admit(f.commit(),{cwd:f.repo.cwd,trustedCwd:f.repo.cwd}),/CYCLE_OR_DUPLICATE/);
 f.bootstrap.operation_dependencies=[];f.bootstrap.previous_slice_id='PREREQUISITE';f.bootstrap.previous_checkpoint=f.dependency.checkpoint_hash;assert.throws(()=>Admission.admit(f.commit(),{cwd:f.repo.cwd,trustedCwd:f.repo.cwd}),/PREVIOUS_CHECKPOINT_LOCATOR_REQUIRED/);
 f.bootstrap.previous_slice_id=null;f.bootstrap.previous_checkpoint=null;const active=f.commit();f.registry.activations.find(r=>r.slice_id==='VNEXT-DEPENDENT').status='CLOSED';f.commit();assert.throws(()=>Admission.admit(active,{cwd:f.repo.cwd,trustedCwd:f.repo.cwd}),/CURRENT_CYCLE_NOT_ACTIVE/);
});
