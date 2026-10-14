'use strict';
// Generic source preparation boundary, before the technical plan. The capture
// provider must declare acquisition provenance; local tests do not certify live access.
const V=require('./vnext-contract'),F=require('./vnext-figma-source'),Freeze=require('../freeze-vnext-figma');
const Source=require('./source-manifest');
const SCHEMA='kodjo.vnext.figma-launch.v1';
function equal(a,b,code){if(V.canonicalHash(a)!==V.canonicalHash(b))V.fail(code);}
function validateScope(scope){
 V.assertExactKeys(scope,['slice_id','launch_id','file_key','frames','documents'],[],'VNEXT_FIGMA_LAUNCH_SCOPE_INVALID');
 for(const k of ['slice_id','launch_id','file_key'])V.assertUnicodeExactText(scope[k],'VNEXT_FIGMA_LAUNCH_SCOPE_REQUIRED');
 if(!Array.isArray(scope.frames)||!scope.frames.length||!Array.isArray(scope.documents)||!scope.documents.length)V.fail('VNEXT_FIGMA_LAUNCH_SCOPE_REQUIRED');
 const ids=new Set();for(const frame of scope.frames){V.assertExactKeys(frame,['frame_id','page_id','state_id'],[],'VNEXT_FIGMA_LAUNCH_FRAME_INVALID');for(const k of Object.keys(frame))V.assertUnicodeExactText(frame[k],'VNEXT_FIGMA_LAUNCH_FRAME_INVALID');if(ids.has(frame.frame_id))V.fail('VNEXT_FIGMA_LAUNCH_FRAME_DUPLICATE');ids.add(frame.frame_id);}
}
// Structured state inventory lives inside the existing authoritative screen
// contract, not in a competing plan document. Missing inventory fails closed.
function documentStates(documents){
 const rows=[],ids=new Set();
 for(const document of documents){
  const tags=[...document.content.matchAll(/<KODJO_SCREEN_STATES_JSON>\s*([\s\S]*?)\s*<\/KODJO_SCREEN_STATES_JSON>/g)];
  if(tags.length!==1)V.fail('VNEXT_FIGMA_DOCUMENT_INVENTORY_REQUIRED',document.document_id);
  const inventory=JSON.parse(tags[0][1]);
  V.assertExactKeys(inventory,['schema_version','states'],[],'VNEXT_FIGMA_DOCUMENT_INVENTORY_INVALID');
  if(inventory.schema_version!=='kodjo.screen-states.v1'||!Array.isArray(inventory.states)||!inventory.states.length)V.fail('VNEXT_FIGMA_DOCUMENT_INVENTORY_INVALID');
  for(const state of inventory.states){
   V.assertExactKeys(state,['state_id','origin','disposition','expected','reason'],['scenarios','requirement_kind'],'VNEXT_FIGMA_DOCUMENT_INVENTORY_INVALID');
   if(Object.hasOwn(state,'requirement_kind')&&!require('./requirement-registry').REQUIREMENT_KINDS.includes(state.requirement_kind))V.fail('VNEXT_FIGMA_DOCUMENT_REQUIREMENT_KIND_INVALID',state.state_id);
   if(ids.has(state.state_id))V.fail('VNEXT_FIGMA_DOCUMENT_INVENTORY_CONTRADICTION',state.state_id);
   ids.add(state.state_id);rows.push({...state,document_ids:[document.document_id]});
  }
 }
 validateScenarios({states:rows});return rows;
}
function validateDocumentCoverage(packet){
 equal(packet.states,documentStates(packet.documents),'VNEXT_FIGMA_DOCUMENT_INVENTORY_COVERAGE_MISMATCH');
}
function validateScenarios(packet){
 const seen=new Set();
 for(const state of packet.states.filter(s=>s.disposition==='REQUIRED')){
  if(!Array.isArray(state.scenarios)||!state.scenarios.length)V.fail('VNEXT_FIGMA_DOCUMENT_SCENARIOS_REQUIRED',state.state_id);
  for(const s of state.scenarios){
   V.assertExactKeys(s,['scenario_id','given','when','then','proof_required'],[],'VNEXT_FIGMA_DOCUMENT_SCENARIO_INVALID');
   for(const k of ['scenario_id','given','when','then'])V.assertUnicodeExactText(s[k],'VNEXT_FIGMA_DOCUMENT_SCENARIO_INVALID');
   if(seen.has(s.scenario_id))V.fail('VNEXT_FIGMA_DOCUMENT_SCENARIO_DUPLICATE');seen.add(s.scenario_id);
   if(!Array.isArray(s.proof_required)||!s.proof_required.length||new Set(s.proof_required).size!==s.proof_required.length||s.proof_required.some(p=>!['FUNCTIONAL_TEST','STATIC_ANALYSIS','DEVICE_CHECK','ACCESSIBILITY_CHECK','VISUAL_COMPARE'].includes(p)))V.fail('VNEXT_FIGMA_DOCUMENT_SCENARIO_PROOFS_REQUIRED');
   if(!s.proof_required.some(p=>['FUNCTIONAL_TEST','STATIC_ANALYSIS'].includes(p)))V.fail('VNEXT_FIGMA_DOCUMENT_SCENARIO_FUNCTIONAL_PROOF_REQUIRED');
  }
 }
}
// Keep the complete frozen document as context; bind each required state to its
// exact inventory object, including scenarios. Historical checkpoints retain their
// original FULL_FILE requirement unit and are never rewritten during validation.
function documentUnits(document, atomic) {
 if(!atomic)return [{locator:document.locator,fingerprint:document.fingerprint,disposition:'REQUIREMENT_SOURCE'}];
 const text=document.content.replace(/\r\n/g,'\n');
 const tag=[...text.matchAll(/<KODJO_SCREEN_STATES_JSON>\s*([\s\S]*?)\s*<\/KODJO_SCREEN_STATES_JSON>/g)];
 if(tag.length!==1)V.fail('VNEXT_FIGMA_DOCUMENT_INVENTORY_REQUIRED');
 const raw=tag[0][1],inventory=JSON.parse(raw),offset=tag[0].index+tag[0][0].indexOf(raw);
 const open=/"states"\s*:\s*\[/.exec(raw);if(!open)V.fail('VNEXT_DOCUMENT_UNIT_INVENTORY_REQUIRED');
 const ranges=[];let depth=0,quoted=false,escaped=false,begin=-1;
 for(let i=open.index+open[0].length;i<raw.length;i++){
  const ch=raw[i];
  if(quoted){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')quoted=false;continue;}
  if(ch==='"'){quoted=true;continue;}
  if(ch==='{'||ch==='['){if(depth===0){if(ch!=='{')V.fail('VNEXT_DOCUMENT_UNIT_STATE_INVALID');begin=i;}depth++;}
  else if(ch==='}'||ch===']'){if(depth===0)break;if(--depth===0)ranges.push([begin,i+1]);}
 }
 if(ranges.length!==inventory.states.length)V.fail('VNEXT_DOCUMENT_UNIT_STATE_COUNT_MISMATCH');
 let last=0;
 const units=ranges.map(([a,b],i)=>{
  const state=JSON.parse(raw.slice(a,b));equal(state,inventory.states[i],'VNEXT_DOCUMENT_UNIT_STATE_MISMATCH');
  const first=text.slice(0,offset+a).split('\n').length,end=text.slice(0,offset+b).split('\n').length;
  if(first<=last)V.fail('VNEXT_DOCUMENT_UNIT_NON_ATOMIC_LINES',state.state_id);last=end;
  return {locator:'L'+first+'-L'+end,fingerprint:V.sha256(text.split('\n').slice(first-1,end).join('\n')),disposition:state.disposition==='REQUIRED'?'REQUIREMENT_SOURCE':'CONTEXT_ONLY'};
 });
 return [{locator:'FULL_FILE',fingerprint:document.fingerprint,disposition:'CONTEXT_ONLY'},...units];
}
function requirements(packet,revision,packetPath,content,atomic=false){
 if(packet.documents.some(d=>d.locator!=='FULL_FILE'))V.fail('VNEXT_FIGMA_LAUNCH_FULL_DOCUMENT_SOURCE_REQUIRED');
 const sources=[F.sourceInput(packet,revision,packetPath,content),...packet.documents.map(d=>({source_kind:'MARKDOWN',authority:'FUNCTIONAL',locator:d.path,revision:d.revision,fingerprint:d.fingerprint,units:documentUnits(d,atomic)}))];
 // Exact duplicates are shared, never used to silently pick one authority.
 const unique=[...new Map(sources.map(s=>[V.canonicalStringify(s),s])).values()];
 const manifest=Source.build({slice_id:'SOURCE-PREPARATION',product_head:revision,sources:unique});
 const visual=manifest.sources.find(s=>s.source_kind==='FIGMA');
 const look=F.lookup(packet);
 const rows=visual.units.filter(u=>u.disposition==='REQUIREMENT_SOURCE').map(u=>({source_id:visual.source_id,unit_id:u.unit_id,kind:'UI',statement:'Presentation '+u.locator+' : '+V.canonicalStringify((look.byElement.get(u.locator.slice(8))||[]).filter(d=>['REALIZE','PRESERVE'].includes(d.disposition))),priority:'MUST',status:'ACTIVE',rationale:'Observed Figma presentation, kept separate from documentary behavior.',related_unit_ids:[],conflict_unit_ids:[]}));
 for(const state of packet.states.filter(s=>s.disposition==='REQUIRED')){
  const doc=packet.documents.find(d=>state.document_ids.includes(d.document_id)&&d.content.includes(state.expected));
  const source=manifest.sources.find(s=>s.authority==='FUNCTIONAL'&&s.locator===doc.path&&s.revision===doc.revision&&s.fingerprint===doc.fingerprint);
  // Explicit typing is frozen in the authoritative documentary inventory.
  // Keep legacy inventories byte-compatible; never infer kind from UI names.
  const index=atomic?documentStates([doc]).findIndex(s=>s.state_id===state.state_id):0;
  const unit=source.units[atomic?index+1:0];
  rows.push({source_id:source.source_id,unit_id:unit.unit_id,kind:state.requirement_kind||'UI',statement:state.expected,priority:'MUST',status:'ACTIVE',rationale:'Documentary state '+state.state_id+'; scenarios '+state.scenarios.map(s=>s.scenario_id).join(', '),related_unit_ids:[],conflict_unit_ids:[]});
 }
 return {sources:unique,requirementInput:{requirements:rows}};
}
async function launch(scope,{capture,reconcile,persist,atomicDocumentUnits=false}){
 if(typeof atomicDocumentUnits!=='boolean')V.fail('VNEXT_DOCUMENT_UNIT_MODE_INVALID');
 validateScope(scope);
 if(typeof capture!=='function'||typeof reconcile!=='function'||typeof persist!=='function')V.fail('VNEXT_FIGMA_LAUNCH_ADAPTER_REQUIRED');
 const stages=[];
 const acquired=await capture(structuredClone(scope));stages.push('CAPTURE');
 if(!acquired||acquired.launch_id!==scope.launch_id||acquired.file_key!==scope.file_key)V.fail('VNEXT_FIGMA_LAUNCH_CAPTURE_MISMATCH');
 equal(acquired.frames,scope.frames,'VNEXT_FIGMA_LAUNCH_FRAME_SCOPE_MISMATCH');
 const classified=await reconcile(structuredClone(acquired),structuredClone(scope.documents));stages.push('RECONCILE');
 // The reconciler may classify observations, never rewrite the capture itself.
 for(const k of ['file_key','captured_at','frames','inventories','batches','variables','collections','resources'])equal(classified[k],acquired[k],'VNEXT_FIGMA_LAUNCH_OBSERVATION_CHANGED');
 const {launch_id:_launchId,...freezeInput}=classified;
 const extracted=Freeze.freeze(freezeInput);
 const packet=F.build({file_key:extracted.file_key,captured_at:extracted.captured_at,frames:extracted.frames,nodes:extracted.nodes,variables:extracted.variables,collections:extracted.collections,resources:extracted.resources,documents:extracted.documents,states:extracted.states,decisions:extracted.decisions,conflicts:extracted.conflicts});
 F.validate(packet,{ready:true});validateScenarios(packet);validateDocumentCoverage(packet);stages.push('INVENTORY_AND_SCENARIOS_VALIDATED');
 equal(packet.documents,scope.documents,'VNEXT_FIGMA_LAUNCH_DOCUMENT_AUTHORITY_CHANGED');
 const frozen=await persist(packet);V.assertSha40(frozen.revision,'VNEXT_FIGMA_LAUNCH_FROZEN_REVISION_REQUIRED');F.safePath(frozen.path);
 // Git's serialized object order is authoritative for the byte fingerprint.
 // Rebuilding a logically identical object must not silently change its bytes.
 const persisted=F.snapshotPacket(frozen.content);F.validate(persisted,{ready:true});
 equal(persisted,packet,'VNEXT_FIGMA_LAUNCH_FROZEN_BYTES_MISMATCH');
 stages.push('GIT_FREEZE');
 const prepared=requirements(persisted,frozen.revision,frozen.path,frozen.content,atomicDocumentUnits);stages.push('ATOMIC_REQUIREMENTS');
 return V.sealContract({schema_version:SCHEMA,...(atomicDocumentUnits?{functional_unit_mode:'ATOMIC_SCREEN_STATES'}:{}),scope,reference_hash:packet.contract_hash,frozen,stages,sourceManifestInput:{slice_id:scope.slice_id,product_head:frozen.revision,sources:prepared.sources},requirementInput:prepared.requirementInput,scenario_ids:packet.states.flatMap(s=>(s.scenarios||[]).map(x=>x.scenario_id))});
}
function validate(checkpoint,recipe){
 V.verifyContractHash(checkpoint,'VNEXT_FIGMA_LAUNCH_HASH_INVALID');validateScope(checkpoint.scope);
 if(checkpoint.schema_version!==SCHEMA)V.fail('VNEXT_FIGMA_LAUNCH_SCHEMA_INVALID');
 equal(checkpoint.stages,['CAPTURE','RECONCILE','INVENTORY_AND_SCENARIOS_VALIDATED','GIT_FREEZE','ATOMIC_REQUIREMENTS'],'VNEXT_FIGMA_LAUNCH_ORDER_INVALID');
 V.assertSha40(checkpoint.frozen.revision,'VNEXT_FIGMA_LAUNCH_FROZEN_REVISION_REQUIRED');F.safePath(checkpoint.frozen.path);
 const packet=F.snapshotPacket(checkpoint.frozen.content);
 equal(packet.documents,checkpoint.scope.documents,'VNEXT_FIGMA_LAUNCH_DOCUMENT_AUTHORITY_CHANGED');
 F.validate(packet,{ready:true});validateScenarios(packet);validateDocumentCoverage(packet);
 if(checkpoint.reference_hash!==packet.contract_hash||checkpoint.scope.file_key!==packet.file_key)V.fail('VNEXT_FIGMA_LAUNCH_REFERENCE_MISMATCH');
 equal(checkpoint.scope.frames,packet.frames,'VNEXT_FIGMA_LAUNCH_FRAME_SCOPE_MISMATCH');
 if(Object.hasOwn(checkpoint,'functional_unit_mode')&&checkpoint.functional_unit_mode!=='ATOMIC_SCREEN_STATES')V.fail('VNEXT_DOCUMENT_UNIT_MODE_INVALID');
 const expected=requirements(packet,checkpoint.frozen.revision,checkpoint.frozen.path,checkpoint.frozen.content,checkpoint.functional_unit_mode==='ATOMIC_SCREEN_STATES');
 equal(checkpoint.sourceManifestInput,{slice_id:checkpoint.scope.slice_id,product_head:checkpoint.frozen.revision,sources:expected.sources},'VNEXT_FIGMA_LAUNCH_SOURCES_MISMATCH');
 equal(checkpoint.requirementInput,expected.requirementInput,'VNEXT_FIGMA_LAUNCH_REQUIREMENTS_MISMATCH');
 equal(checkpoint.scenario_ids,packet.states.flatMap(s=>(s.scenarios||[]).map(x=>x.scenario_id)),'VNEXT_FIGMA_LAUNCH_SCENARIOS_MISMATCH');
 if(recipe){equal(recipe.sourceManifestInput,checkpoint.sourceManifestInput,'VNEXT_FIGMA_LAUNCH_RECIPE_SOURCES_MISMATCH');equal(recipe.requirementInput,checkpoint.requirementInput,'VNEXT_FIGMA_LAUNCH_RECIPE_REQUIREMENTS_MISMATCH');}
 return checkpoint;
}
module.exports={SCHEMA,launch,validate,validateScope,validateScenarios,documentStates,validateDocumentCoverage,requirements,documentUnits};
