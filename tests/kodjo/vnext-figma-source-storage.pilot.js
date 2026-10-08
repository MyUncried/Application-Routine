'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../../scripts/kodjo/lib/vnext-figma-source');
const V=require('../../scripts/kodjo/lib/vnext-contract');
const Fixture=require('./helpers/vnext-figma-fixture');
const Launch=require('../../scripts/kodjo/lib/vnext-figma-launch');
const Chain=require('../../scripts/kodjo/lib/vnext-live-chain');
test('legacy source bytes and fingerprints remain unchanged',()=>{
 const packet=Fixture.packet('a'.repeat(40)),legacy=JSON.stringify(packet,null,2)+'\n';
 assert.equal(F.snapshotContent(packet),legacy);assert.deepEqual(F.snapshotPacket(legacy),packet);
 assert.equal(F.sourceInput(packet,'a'.repeat(40),'snapshot.json').fingerprint,V.sha256(legacy));
});
test('compact source reconstructs every property, decision and contract hash',()=>{
 const packet=Fixture.packet('a'.repeat(40)),content=F.snapshotContent(packet,{packed:true});
 const reconstructed=F.snapshotPacket(content);assert.deepEqual(reconstructed,packet);
 assert.equal(reconstructed.contract_hash,packet.contract_hash);
 assert.equal(F.sourceInput(packet,'a'.repeat(40),'snapshot.json',content).fingerprint,V.sha256(content));
});
test('changed packed value, missing property and noncanonical source bytes are refused',()=>{
 const packet=Fixture.packet('a'.repeat(40));
 const changed=JSON.parse(F.snapshotContent(packet,{packed:true}));changed.nodes[0][3]='altered name';
 assert.throws(()=>F.snapshotPacket(JSON.stringify(changed)+'\n'),/HASH/);
 const missing=JSON.parse(F.snapshotContent(packet,{packed:true}));missing.nodes[0][5].pop();
 assert.throws(()=>F.snapshotPacket(JSON.stringify(missing)+'\n'),/HASH|OMITTED|COVERAGE/);
 assert.throws(()=>F.snapshotPacket(F.snapshotContent(packet,{packed:true}).trim()),/FROZEN_BYTES_MISMATCH/);
 assert.throws(()=>F.snapshotPacket(JSON.stringify(JSON.parse(F.snapshotContent(packet,{packed:true})),null,2)+'\n'),/FROZEN_BYTES_MISMATCH/);
});
test('packed frozen Git source is observed by the real chain without changing semantics',async t=>{
 const f=Fixture.fixture({launchMode:true});t.after(()=>f.cleanup());
 const content=F.snapshotContent(f.snapshot,{packed:true});
 require('node:fs').writeFileSync(require('node:path').join(f.cwd,f.packetPath),content);
 f.git('add',f.packetPath);f.git('commit','-qm','freeze compact source');f.head=f.git('rev-parse','HEAD').trim();
 const legacy=f.recipe.sourceManifestInput.sources.find(s=>s.source_kind==='FIGMA');
 const source=F.sourceInput(f.snapshot,f.head,f.packetPath,content);
 const observed=F.observe(source,{cwd:f.cwd,readGit:Chain.readGit});assert.equal(observed.content,content);assert.deepEqual(observed.packet,f.snapshot);
 assert.equal(legacy.units.length,source.units.length);assert.deepEqual(legacy.units,source.units);
 const prepared=Launch.requirements(f.snapshot,f.head,f.packetPath,content);
 assert.equal(prepared.sources[0].fingerprint,V.sha256(content));
 const scope={slice_id:f.recipe.planningInput.slice_id,launch_id:'TEST compact storage',file_key:f.snapshot.file_key,frames:f.snapshot.frames,documents:f.snapshot.documents};
 const p=f.snapshot;
 const checkpoint=await Launch.launch(scope,{capture:s=>({launch_id:s.launch_id,file_key:p.file_key,captured_at:p.captured_at,frames:p.frames,inventories:[{end:true,count:p.nodes.length,rows:p.nodes.map(n=>[n.id,n.parent_id,n.type,n.name])}],batches:[{end:true,requested_ids:p.nodes.map(n=>n.id),rows:p.nodes.map(n=>({id:n.id,child_ids:n.child_ids,properties:n.properties}))}],variables:p.variables,collections:p.collections,resources:p.resources}),reconcile:(raw,documents)=>({...raw,documents,states:p.states,decisions:p.decisions,conflicts:p.conflicts}),persist:()=>({revision:f.head,path:f.packetPath,content:Chain.readGit(f.cwd,f.head,f.packetPath)})});
 Launch.validate(checkpoint);assert.equal(checkpoint.reference_hash,p.contract_hash);assert.equal(checkpoint.frozen.content,content);
 const Source=require('../../scripts/kodjo/lib/source-manifest');const manifest=Source.build(checkpoint.sourceManifestInput);
 const observations=Chain.observeSources(manifest,f.cwd);assert.equal(observations.find(o=>manifest.sources.find(s=>s.source_id===o.source_id)?.source_kind==='FIGMA').content,content);
});
