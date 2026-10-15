'use strict';
const V = require('./vnext-contract');
const Identity = require('./slice-identity');
const REGISTRY = '.github/orchestration/v2-activation-registry.json';
// Only a verified VNext finalization may close its own activation. Unrelated
// rows (including all historical V2 cycles) are retained byte-for-byte as data.
function update(registry, sourceRegistry, bootstrap, config, finalization, finalOutputCommentId) {
  Identity.validateBootstrap(bootstrap);
  Identity.validateRegistry(sourceRegistry, bootstrap);
  if (bootstrap.protocol !== 'VNEXT' || bootstrap.repository !== config.repository
      || bootstrap.slice_id !== config.slice_id || bootstrap.issue_number !== config.issue_number) {
    V.fail('VNEXT_ACTIVATION_CLOSURE_IDENTITY_MISMATCH');
  }
  require('./vnext-github-closure').prepare(config, finalization);
  if (!/^[1-9][0-9]*$/.test(String(finalOutputCommentId))) V.fail('VNEXT_ACTIVATION_CLOSURE_OUTPUT_REQUIRED');
  const source = sourceRegistry.activations.filter(row => row.slice_id === config.slice_id);
  const rows = registry.activations.filter(row => row.slice_id === config.slice_id);
  if (source.length !== 1 || rows.length > 1) V.fail('VNEXT_ACTIVATION_CLOSURE_AMBIGUOUS');
  const baseline = source[0];
  const closure = {
    schema_version:'kodjo.vnext.activation-closure.v1', final_head:config.delivery_head,
    finalization_hash:finalization.contract_hash, implementation_review_comment_id:String(finalization.review_comment_id),
    final_output_comment_id:String(finalOutputCommentId), source_registry_revision:config.delivery_head,
    original_decision:finalization.original_decision, reservations:finalization.reservations,
    pending_proofs:finalization.pending_proofs, acceptance_scope:finalization.acceptance_scope,
  };
  if (rows.length) {
    const row = rows[0];
    const identity = value => Object.fromEntries(Object.entries(value).filter(([key]) => !['status','closure'].includes(key)));
    if (V.canonicalStringify(identity(row)) !== V.canonicalStringify(identity(baseline))) V.fail('VNEXT_ACTIVATION_CLOSURE_CYCLE_DRIFT');
    if (row.status === 'CLOSED') {
      if (V.canonicalStringify(row.closure) !== V.canonicalStringify(closure)) V.fail('VNEXT_ACTIVATION_CLOSURE_PROOF_DRIFT');
      return {changed:false, registry};
    }
    if (row.status !== 'ACTIVE' || row.closure) V.fail('VNEXT_ACTIVATION_CLOSURE_STATE_REFUSED');
  }
  const result = structuredClone(registry);
  const row = result.activations.find(value => value.slice_id === config.slice_id);
  if (row) { row.status='CLOSED'; row.closure=closure; }
  else result.activations.push({...baseline,status:'CLOSED',closure});
  return {changed:true,registry:result};
}
function record(config, finalization, finalOutputCommentId, github) {
  const root='.github/orchestration/v2-slices/'+config.slice_id+'/slice-bootstrap.json';
  const sourceRegistry=github.registryFile(config.repository,REGISTRY,config.delivery_head).value;
  const bootstrap=github.registryFile(config.repository,root,config.delivery_head).value;
  // A file-SHA compare-and-swap preserves changes to other slices. A lost write
  // response is reconciled by the next observation, never by an unconditional PUT.
  for(let attempt=0;attempt<=3;attempt++) {
    const observed=github.registryFile(config.repository,REGISTRY,'main');
    const next=update(observed.value,sourceRegistry,bootstrap,config,finalization,finalOutputCommentId);
    if(!next.changed) return {status:'CLOSED',path:REGISTRY,finalization_hash:finalization.contract_hash};
    if(attempt===3) V.fail('VNEXT_ACTIVATION_CLOSURE_NOT_OBSERVED');
    try { github.writeRegistry(config.repository,REGISTRY,observed.sha,next.registry); }
    catch(error) { if(attempt===2) throw error; }
  }
  V.fail('VNEXT_ACTIVATION_CLOSURE_NOT_OBSERVED');
}
module.exports={REGISTRY,update,record};
