'use strict';
// Admission reads the request's immutable source, never the operator's worktree.
// Historical receipt readers intentionally do not re-admit a closed operation.
const V=require('./vnext-contract'),Identity=require('./slice-identity');
const path=require('node:path');
const Chain=require('./vnext-live-chain'),Routing=require('./slice-protocol-routing');
const REGISTRY='.github/orchestration/v2-activation-registry.json';
function admit(request,{cwd,actor=process.env.GITHUB_ACTOR,trustedCwd=path.resolve(__dirname,'../../..')}={}){
 V.assertSliceId(request.slice_id);V.assertSha40(request.source_head);
 if(Routing.resolve(request.slice_id,{cwd,revision:request.source_head})!=='VNEXT')throw Error('VNEXT_OPERATION_LEGACY_SLICE');
 const read=file=>Chain.readGitObject(cwd,request.source_head,file);
 const bootstrap=read('.github/orchestration/v2-slices/'+request.slice_id+'/slice-bootstrap.json');
 Identity.validateBootstrap(bootstrap);const registry=read(REGISTRY);Identity.validateRegistry(registry,bootstrap);
 const trustedHead=Chain.command('git',['rev-parse','HEAD'],trustedCwd).trim(),currentRegistry=Chain.readGitObject(trustedCwd,trustedHead,REGISTRY);
 const currentRows=currentRegistry.activations.filter(a=>a.slice_id===request.slice_id);
 if(currentRows.length>1||currentRows.some(a=>a.status!=='ACTIVE'))throw Error('VNEXT_OPERATION_CURRENT_CYCLE_NOT_ACTIVE');
 if(bootstrap.protocol!=='VNEXT'||bootstrap.repository!==request.repository||bootstrap.issue_number!==request.issue_number)throw Error('VNEXT_OPERATION_IDENTITY_MISMATCH');
 if(actor&&!bootstrap.authorized_actors.includes(actor))throw Error('VNEXT_OPERATION_ACTOR_UNAUTHORIZED');
 const declarations=[...(bootstrap.operation_dependencies||[])];
 if(bootstrap.previous_slice_id){
  if(!bootstrap.previous_checkpoint)throw Error('VNEXT_OPERATION_PREVIOUS_CHECKPOINT_REQUIRED');
  const matches=registry.activations.filter(a=>a.slice_id===bootstrap.previous_slice_id);
  if(matches.length!==1)throw Error('VNEXT_OPERATION_DEPENDENCY_UNKNOWN');
  // An opaque historical checkpoint cannot be silently treated as verified.
  // Its exact archived location must be declared in the hashed bootstrap.
  if(!declarations.some(d=>d.slice_id===bootstrap.previous_slice_id&&d.checkpoint_hash===bootstrap.previous_checkpoint))throw Error('VNEXT_OPERATION_PREVIOUS_CHECKPOINT_LOCATOR_REQUIRED');
 }
 const seen=new Set();const dependencies=declarations.map(d=>{
  V.assertExactKeys(d,['slice_id','checkpoint_path','checkpoint_hash'],[],'VNEXT_OPERATION_DEPENDENCY_KEYS');
  V.assertSliceId(d.slice_id);V.assertSha64(d.checkpoint_hash);Chain.relative(d.checkpoint_path);
  if(d.slice_id===request.slice_id||seen.has(d.slice_id))throw Error('VNEXT_OPERATION_DEPENDENCY_CYCLE_OR_DUPLICATE');seen.add(d.slice_id);
  const rows=registry.activations.filter(a=>a.slice_id===d.slice_id);
  if(rows.length!==1||rows[0].status!=='CLOSED'||!Number.isSafeInteger(rows[0].issue_number))throw Error('VNEXT_OPERATION_DEPENDENCY_NOT_CLOSED');
  const currentDependencies=currentRegistry.activations.filter(a=>a.slice_id===d.slice_id);
  if(currentDependencies.length>1||currentDependencies.some(a=>a.status!=='CLOSED'))throw Error('VNEXT_OPERATION_CURRENT_DEPENDENCY_NOT_CLOSED');
  const checkpoint=read(d.checkpoint_path);V.verifyContractHash(checkpoint);
  if(checkpoint.contract_hash!==d.checkpoint_hash||checkpoint.slice_id!==d.slice_id)throw Error('VNEXT_OPERATION_DEPENDENCY_CHECKPOINT_MISMATCH');
  return {...d,issue_number:rows[0].issue_number};
 });
 return {bootstrap_hash:bootstrap.slice_bootstrap_sha256,source_head:request.source_head,dependencies};
}
module.exports={admit};
