'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const I = require('../../scripts/kodjo/lib/slice-identity');

function fixture() {
  const b = { schema_version:I.BOOTSTRAP_SCHEMA, slice_id:'V2-BILAT-01', issue_number:51, repository:'MyUncried/Application-Routine', target_branch:'main', source_head:'a'.repeat(40), protocol_version:'0.6.12', protocol_commit:'b'.repeat(40), activation_registry:'.github/orchestration/v2-activation-registry.json', previous_slice_id:null, previous_checkpoint:null, product_sources:['docs/PRODUCT.md'], authorized_actors:['user','chatgpt-protocole','claude-local'], created_at:'2026-09-10T18:00:00.000Z' };
  b.slice_bootstrap_sha256=I.sha256(I.canonical(b));
  return b;
}

test('bootstrap canonique valide et hash stable',()=>{const b=fixture();assert.equal(I.validateBootstrap(b).hash,b.slice_bootstrap_sha256);});
test('bootstrap altéré refusé',()=>{const b=fixture();b.source_head='c'.repeat(40);assert.throws(()=>I.validateBootstrap(b),/HASH_MISMATCH/);});
test('manifeste V1 refusé comme bootstrap V2',()=>{assert.throws(()=>I.validateBootstrap({schema:'kodjo.slice.v1'}),/SCHEMA_UNSUPPORTED/);});
test('activation absente ou divergente refusée',()=>{const b=fixture();assert.throws(()=>I.validateRegistry({schema_version:I.REGISTRY_SCHEMA,activations:[]},b),/SLICE_NOT_ACTIVATED/);const r={schema_version:I.REGISTRY_SCHEMA,activations:[{slice_id:b.slice_id,status:'ACTIVE',issue_number:b.issue_number,source_head:b.source_head,bootstrap_path:`.github/orchestration/v2-slices/${b.slice_id}/slice-bootstrap.json`,slice_bootstrap_sha256:'0'.repeat(64)}]};assert.throws(()=>I.validateRegistry(r,b),/BINDING_MISMATCH/);});
test('activation unique cohérente acceptée',()=>{const b=fixture();const r={schema_version:I.REGISTRY_SCHEMA,activations:[{slice_id:b.slice_id,status:'ACTIVE',issue_number:b.issue_number,source_head:b.source_head,bootstrap_path:`.github/orchestration/v2-slices/${b.slice_id}/slice-bootstrap.json`,slice_bootstrap_sha256:b.slice_bootstrap_sha256}]};assert.equal(I.validateRegistry(r,b).status,'ACTIVE');});
