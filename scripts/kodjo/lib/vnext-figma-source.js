'use strict';
// Frozen visual observations are source evidence, never a live-Figma fallback.
const fs=require('node:fs'),path=require('node:path');
const V=require('./vnext-contract');
const SCHEMA='kodjo.vnext.figma-source.v1';
const eq=(a,b,code)=>{if(V.canonicalStringify(a)!==V.canonicalStringify(b))V.fail(code);};
const text=(s,code)=>V.assertUnicodeExactText(s,code);
const id=(node,property)=>V.stableId('FIGPROP',[node,property]);
function pngComplete(b){
  let offset=8,ended=false;const data=[];
  while(offset<b.length){
    if(offset+12>b.length)V.fail('VNEXT_FIGMA_SCREENSHOT_TRUNCATED');const size=b.readUInt32BE(offset),end=offset+12+size;
    if(end>b.length)V.fail('VNEXT_FIGMA_SCREENSHOT_TRUNCATED');
    let crc=0xffffffff;for(const byte of b.subarray(offset+4,end-4)){crc^=byte;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
    if(((crc^0xffffffff)>>>0)!==b.readUInt32BE(end-4))V.fail('VNEXT_FIGMA_SCREENSHOT_CRC_INVALID');
    if(b.subarray(offset+4,offset+8).toString()==='IDAT')data.push(b.subarray(offset+8,end-4));
    if(b.subarray(offset+4,offset+8).toString()==='IEND'){if(size||end!==b.length)V.fail('VNEXT_FIGMA_SCREENSHOT_INVALID');ended=true;}
    offset=end;
  }
  if(!ended)V.fail('VNEXT_FIGMA_SCREENSHOT_TRUNCATED');
  const channels={0:1,2:3,3:1,4:2,6:4}[b[25]],width=b.readUInt32BE(16),height=b.readUInt32BE(20);
  if(!data.length||!channels||!width||!height||b[28]!==0)V.fail('VNEXT_FIGMA_SCREENSHOT_ENCODING_UNSUPPORTED');
  const expected=(1+Math.ceil(width*channels*b[24]/8))*height;
  if(expected>64*1024*1024)V.fail('VNEXT_FIGMA_SCREENSHOT_TOO_LARGE');
  let raw;try{raw=require('node:zlib').inflateSync(Buffer.concat(data),{maxOutputLength:expected});}catch(_){V.fail('VNEXT_FIGMA_SCREENSHOT_DECODE_FAILED');}
  if(raw.length!==expected)V.fail('VNEXT_FIGMA_SCREENSHOT_DECODE_FAILED');
}
function safePath(p){
  if(typeof p!=='string'||!p||p.includes('\\')||p.startsWith('/')||/^[A-Za-z]:/.test(p)||p.split('/').some(s=>!s||s==='.'||s==='..'))V.fail('VNEXT_FIGMA_PATH_INVALID');
  return p;
}
function index(rows,key,code){
  if(!Array.isArray(rows))V.fail(code);
  const m=new Map();for(const r of rows){text(r[key],code);if(m.has(r[key]))V.fail(code);m.set(r[key],r);}return m;
}
function aliases(value,visit){
  if(Array.isArray(value))value.forEach(v=>aliases(v,visit));
  else if(value&&typeof value==='object'){if(value.type==='VARIABLE_ALIAS')visit(value.id);else Object.values(value).forEach(v=>aliases(v,visit));}
}
function checkResource(r){
  V.assertExactKeys(r,['resource_id','node_ids','path','media_type','sha256','byte_length','base64'],[],'VNEXT_FIGMA_RESOURCE_KEYS_INVALID');
  safePath(r.path);V.assertSha64(r.sha256,'VNEXT_FIGMA_RESOURCE_HASH_INVALID');
  if(typeof r.base64!=='string'||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(r.base64))V.fail('VNEXT_FIGMA_RESOURCE_BYTES_REQUIRED');
  const b=Buffer.from(r.base64,'base64');
  if(b.length!==r.byte_length||require('node:crypto').createHash('sha256').update(b).digest('hex')!==r.sha256)V.fail('VNEXT_FIGMA_RESOURCE_BYTES_MISMATCH');
  if(r.media_type==='image/png'){
    if(b.length<24||b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||b.subarray(12,16).toString()!=='IHDR')V.fail('VNEXT_FIGMA_SCREENSHOT_INVALID');
    pngComplete(b);
  }else if(r.media_type==='image/svg+xml'){
    if(!/<svg\b/.test(b.toString())||!/<\/svg>/.test(b.toString()))V.fail('VNEXT_FIGMA_SVG_INVALID');
  }else V.fail('VNEXT_FIGMA_RESOURCE_TYPE_INVALID');
  return b;
}
function validate(packet,{ready=false}={}){
  V.assertExactKeys(packet,['schema_version','file_key','captured_at','frames','nodes','variables','collections','resources','documents','states','decisions','conflicts','contract_hash'],[],'VNEXT_FIGMA_PACKET_KEYS_INVALID');
  if(packet.schema_version!==SCHEMA)V.fail('VNEXT_FIGMA_SCHEMA_INVALID');
  V.verifyContractHash(packet,'VNEXT_FIGMA_PACKET_HASH_INVALID');
  text(packet.file_key,'VNEXT_FIGMA_FILE_KEY_REQUIRED');V.assertIsoDate(packet.captured_at,'VNEXT_FIGMA_DATE_REQUIRED');
  const nodes=index(packet.nodes,'id','VNEXT_FIGMA_INVENTORY_INVALID'),states=index(packet.states,'state_id','VNEXT_FIGMA_STATES_INVALID');
  if(!nodes.size||!packet.frames.length||!states.size)V.fail('VNEXT_FIGMA_SCOPE_REQUIRED');
  const frames=index(packet.frames,'frame_id','VNEXT_FIGMA_FRAME_DUPLICATE');
  const reached=new Set();
  function walk(node,stack=new Set()){
    if(stack.has(node.id))V.fail('VNEXT_FIGMA_NODE_CYCLE');
    if(reached.has(node.id))return;reached.add(node.id);
    const branch=new Set([...stack,node.id]);
    for(const child of node.child_ids){const c=nodes.get(child);if(!c||c.parent_id!==node.id)V.fail('VNEXT_FIGMA_ELEMENT_OMITTED',child);walk(c,branch);}
    const master=node.properties.main_component_id;
    if(node.type==='INSTANCE'){
      if(!master||!nodes.has(master))V.fail('VNEXT_FIGMA_MASTER_UNAVAILABLE',node.id);
      const m=nodes.get(master),set=nodes.get(m.parent_id);walk(set?.type==='COMPONENT_SET'?set:m,branch);
    }
  }
  for(const f of frames.values()){
    if(!nodes.has(f.frame_id)||!states.has(f.state_id)||!f.page_id)V.fail('VNEXT_FIGMA_FRAME_REFERENCE_INVALID');
    walk(nodes.get(f.frame_id));
    const screenshots=packet.resources.filter(r=>r.media_type==='image/png'&&r.node_ids.includes(f.frame_id));
    if(!screenshots.length)V.fail('VNEXT_FIGMA_SCREENSHOT_REQUIRED');
    const b=checkResource(screenshots[0]),p=nodes.get(f.frame_id).properties;
    if(b.readUInt32BE(16)!==p.width||b.readUInt32BE(20)!==p.height)V.fail('VNEXT_FIGMA_SCREENSHOT_DIMENSIONS_MISMATCH');
  }
  if(reached.size!==nodes.size)V.fail('VNEXT_FIGMA_UNBOUND_ELEMENT');
  for(const n of nodes.values()){
    V.assertExactKeys(n,['id','parent_id','type','name','child_ids','properties'],[],'VNEXT_FIGMA_NODE_KEYS_INVALID');
    text(n.name,'VNEXT_FIGMA_NODE_NAME_REQUIRED');
    if(!Array.isArray(n.child_ids)||new Set(n.child_ids).size!==n.child_ids.length||!n.properties||typeof n.properties!=='object')V.fail('VNEXT_FIGMA_NODE_PROPERTIES_REQUIRED');
    // Variant closure is the set's child list, not a planner-selected variant.
    if(n.type==='COMPONENT_SET'&&!n.child_ids.length)V.fail('VNEXT_FIGMA_VARIANT_OMITTED');
    if(n.type==='VECTOR'&&!Array.isArray(n.properties.vectorPaths)&&!packet.resources.some(r=>r.node_ids.includes(n.id)))V.fail('VNEXT_FIGMA_VECTOR_GEOMETRY_REQUIRED',n.id);
  }
  const variables=index(packet.variables,'id','VNEXT_FIGMA_VARIABLES_INVALID'),collections=index(packet.collections,'id','VNEXT_FIGMA_COLLECTIONS_INVALID');
  function variable(v,seen=new Set()){
    if(!v||seen.has(v.id))V.fail('VNEXT_FIGMA_VARIABLE_UNAVAILABLE_OR_CYCLIC');
    const c=collections.get(v.collection_id);if(!c||!Array.isArray(c.modes)||!c.modes.length)V.fail('VNEXT_FIGMA_MODES_REQUIRED');
    for(const mode of c.modes)if(!(mode.modeId in v.valuesByMode))V.fail('VNEXT_FIGMA_MODE_VALUE_REQUIRED');
    aliases(v.valuesByMode,x=>variable(variables.get(x),new Set([...seen,v.id])));
  }
  for(const n of nodes.values())aliases(n.properties,x=>variable(variables.get(x)));
  for(const v of variables.values())variable(v);
  const resources=index(packet.resources,'resource_id','VNEXT_FIGMA_RESOURCES_INVALID');
  const resourcePaths=new Set();for(const r of resources.values()){
    checkResource(r);if(resourcePaths.has(r.path)||!r.node_ids.length||r.node_ids.some(x=>!nodes.has(x)))V.fail('VNEXT_FIGMA_RESOURCE_BINDING_INVALID');resourcePaths.add(r.path);
  }
  for(const n of nodes.values())for(const paint of n.properties.fills||[])if(paint.type==='IMAGE'&&!packet.resources.some(r=>r.node_ids.includes(n.id)))V.fail('VNEXT_FIGMA_IMAGE_RESOURCE_REQUIRED');
  const documents=index(packet.documents,'document_id','VNEXT_FIGMA_DOCUMENTS_INVALID');
  for(const d of documents.values()){
    V.assertSha40(d.revision,'VNEXT_FIGMA_DOCUMENT_REVISION_INVALID');safePath(d.path);text(d.locator,'VNEXT_FIGMA_DOCUMENT_LOCATOR_REQUIRED');
    if(V.sha256(d.content)!==d.fingerprint)V.fail('VNEXT_FIGMA_DOCUMENT_HASH_MISMATCH');
  }
  for(const s of states.values()){
    text(s.reason,'VNEXT_FIGMA_STATE_REASON_REQUIRED');
    if(!['REQUIRED','CONTEXT_ONLY'].includes(s.disposition))V.fail('VNEXT_FIGMA_STATE_DISPOSITION_REQUIRED');
    if(s.disposition==='REQUIRED'){
      text(s.expected,'VNEXT_FIGMA_DOCUMENT_STATE_EXPECTATION_REQUIRED');
      if(!s.document_ids.some(x=>documents.get(x)?.content.includes(s.expected)))V.fail('VNEXT_FIGMA_STATE_DOCUMENT_MISMATCH');
    }
    if(!['FIGMA','DOCUMENT_ONLY'].includes(s.origin)||!Array.isArray(s.document_ids)||!s.document_ids.length||s.document_ids.some(x=>!documents.has(x)))V.fail('VNEXT_FIGMA_STATE_DOCUMENT_REQUIRED');
    if(s.origin==='FIGMA'&&!packet.frames.some(f=>f.state_id===s.state_id))V.fail('VNEXT_FIGMA_STATE_FRAME_REQUIRED');
  }
  const decisions=index(packet.decisions,'property_id','VNEXT_FIGMA_DECISIONS_INVALID');
  const slots=[];for(const n of nodes.values())for(const [property,observed]of Object.entries(n.properties)){
    const propertyId=id(n.id,property),d=decisions.get(propertyId);slots.push(propertyId);
    if(!d||d.element_id!==n.id||d.property!==property)V.fail('VNEXT_FIGMA_PROPERTY_OMITTED',propertyId);
    V.assertExactKeys(d,['property_id','element_id','property','disposition','reason','document_ids','rule'],[],'VNEXT_FIGMA_DECISION_KEYS_INVALID');
    text(d.reason,'VNEXT_FIGMA_DISPOSITION_REASON_REQUIRED');
    if(!['REALIZE','PRESERVE','OBSERVED_ONLY','EXCLUDE','UNRESOLVED'].includes(d.disposition)||!Array.isArray(d.document_ids)||!d.document_ids.length||d.document_ids.some(x=>!documents.has(x)))V.fail('VNEXT_FIGMA_DISPOSITION_INVALID');
    if(['REALIZE','PRESERVE'].includes(d.disposition)){
      if(!d.rule||!['EQUALS','RELATION','ADAPTIVE'].includes(d.rule.kind))V.fail('VNEXT_FIGMA_OBSERVABLE_REQUIRED');
      V.assertExactKeys(d.rule,['kind','value','viewports','tolerance','unit'],[],'VNEXT_FIGMA_RULE_INVALID');
      if(d.rule.value===null||typeof d.rule.value==='string'&&!d.rule.value.trim()||!Number.isFinite(d.rule.tolerance)||d.rule.tolerance<0||!Array.isArray(d.rule.viewports)||!d.rule.viewports.length)V.fail('VNEXT_FIGMA_RULE_INVALID');
      if(new Set(d.rule.viewports).size!==d.rule.viewports.length||d.rule.viewports.some(v=>!Number.isInteger(v)||v<1))V.fail('VNEXT_FIGMA_VIEWPORT_INVALID');
      text(d.rule.unit,'VNEXT_FIGMA_RULE_UNIT_REQUIRED');
      if(d.rule.kind==='EQUALS')eq(d.rule.value,observed,'VNEXT_FIGMA_REFERENCE_CONSTRAINT_MISMATCH');
      if(observed==='MIXED')V.fail('VNEXT_FIGMA_MIXED_PROPERTY_UNRESOLVED');
      if(d.rule.kind!=='EQUALS'){
        if(!d.rule.value||!Array.isArray(d.rule.value.constraints)||!d.rule.value.constraints.length)V.fail('VNEXT_FIGMA_RELATIONAL_RULE_REQUIRED');
        for(const c of d.rule.value.constraints){
          V.assertExactKeys(c,['field','operator','value'],[],'VNEXT_FIGMA_RELATIONAL_RULE_REQUIRED');
          text(c.field,'VNEXT_FIGMA_RELATIONAL_RULE_REQUIRED');
          if(!['EQ','MIN','MAX'].includes(c.operator)||c.value===null||['MIN','MAX'].includes(c.operator)&&!Number.isFinite(c.value))V.fail('VNEXT_FIGMA_RELATIONAL_RULE_REQUIRED');
        }
      }
    }else if(d.rule!==null)V.fail('VNEXT_FIGMA_UNUSED_RULE');
    if(ready&&d.disposition==='UNRESOLVED')V.fail('WAIT_FOR_CLARIFICATION',propertyId);
  }
  eq([...decisions.keys()].sort(),slots.sort(),'VNEXT_FIGMA_PROPERTY_COVERAGE_INVALID');
  const conflicts=index(packet.conflicts,'conflict_id','VNEXT_FIGMA_CONFLICTS_INVALID');
  for(const c of conflicts.values()){
    if(!decisions.has(c.property_id)||!documents.has(c.document_id)||!['OPEN','RESOLVED'].includes(c.status)||!['PRESENTATION','BEHAVIOR','MIXED'].includes(c.domain))V.fail('VNEXT_FIGMA_CONFLICT_INVALID');
    text(c.description,'VNEXT_FIGMA_CONFLICT_DESCRIPTION_REQUIRED');
    if(c.status==='RESOLVED'){
      if(!c.resolution||!['FIGMA_PRESENTATION','DOCUMENT_BEHAVIOR','EXPLICIT_DECISION'].includes(c.resolution.authority))V.fail('VNEXT_FIGMA_CONFLICT_RESOLUTION_REQUIRED');
      text(c.resolution.reason,'VNEXT_FIGMA_CONFLICT_RESOLUTION_REQUIRED');
      if(c.domain==='MIXED'&&c.resolution.authority!=='EXPLICIT_DECISION')V.fail('VNEXT_FIGMA_MIXED_CONFLICT_DECISION_REQUIRED');
    }else if(ready)V.fail('WAIT_FOR_CLARIFICATION',c.conflict_id);
  }
  return packet;
}
function build(input){const packet=V.sealContract({schema_version:SCHEMA,...input});validate(packet);return packet;}
function lookup(packet){
 const nodes=new Map(packet.nodes.map(n=>[n.id,n])),decisions=new Map(),byElement=new Map();
 for(const d of packet.decisions){decisions.set(d.property_id,d);const rows=byElement.get(d.element_id)||[];rows.push(d);byElement.set(d.element_id,rows);}
 return {nodes,decisions,byElement};
}
function propertyUnit(packet,propertyId,look=null){
  const d=look?look.decisions.get(propertyId):packet.decisions.find(d=>d.property_id===propertyId);if(!d)V.fail('VNEXT_FIGMA_PROPERTY_UNKNOWN');
  return {reference_hash:packet.contract_hash,...d,observed:(look?look.nodes.get(d.element_id):packet.nodes.find(n=>n.id===d.element_id)).properties[d.property]};
}
function unitText(packet,locator,look=null){
  if(locator==='FULL_FILE')V.fail('VNEXT_FIGMA_PROPERTY_UNIT_REQUIRED');
  if(locator.startsWith('PROPERTY:'))return V.canonicalStringify(propertyUnit(packet,locator.slice(9),look));
  if(locator.startsWith('ELEMENT:')){
    const node=look?look.nodes.get(locator.slice(8)):packet.nodes.find(n=>n.id===locator.slice(8));if(!node)V.fail('VNEXT_FIGMA_ELEMENT_UNKNOWN');
    return V.canonicalStringify({reference_hash:packet.contract_hash,node,decisions:look?(look.byElement.get(node.id)||[]):packet.decisions.filter(d=>d.element_id===node.id)});
  }
  V.fail('VNEXT_FIGMA_UNIT_LOCATOR_INVALID');
}
// The existing lossless UI transport can also be the frozen Git source.
// Old pretty-printed source bytes stay admissible and retain their fingerprints.
const STORAGE_SCHEMA='kodjo.vnext.figma-storage.v1';
function snapshotContent(packet,{packed=false,gzip=false}={}){
  if(gzip){
    const compact=JSON.stringify(pack(packet))+'\n';
    return JSON.stringify({schema_version:STORAGE_SCHEMA,encoding:'gzip-base64',uncompressed_sha256:V.sha256(compact),data:require('node:zlib').gzipSync(Buffer.from(compact),{level:9}).toString('base64')})+'\n';
  }
  return packed ? JSON.stringify(pack(packet))+'\n' : JSON.stringify(packet,null,2)+'\n';
}
function snapshotPacket(content,{verifySerialization=true}={}){
  let serialized;try{serialized=JSON.parse(content);}catch(_){V.fail('VNEXT_FIGMA_SNAPSHOT_TRUNCATED');}
  const compressed=serialized.schema_version===STORAGE_SCHEMA;
  if(compressed){
    V.assertExactKeys(serialized,['schema_version','encoding','uncompressed_sha256','data'],[],'VNEXT_FIGMA_STORAGE_INVALID');
    if(serialized.encoding!=='gzip-base64'||typeof serialized.data!=='string'||!serialized.data.length)V.fail('VNEXT_FIGMA_STORAGE_INVALID');
    const buffer=Buffer.from(serialized.data,'base64');
    if(buffer.toString('base64')!==serialized.data)V.fail('VNEXT_FIGMA_STORAGE_INVALID');
    let compact;try{compact=require('node:zlib').gunzipSync(buffer,{maxOutputLength:64*1024*1024}).toString('utf8');}catch(_){V.fail('VNEXT_FIGMA_STORAGE_DECOMPRESSION_FAILED');}
    if(V.sha256(compact)!==serialized.uncompressed_sha256)V.fail('VNEXT_FIGMA_STORAGE_HASH_MISMATCH');
    if(verifySerialization&&content!==JSON.stringify(serialized)+'\n')V.fail('VNEXT_FIGMA_LAUNCH_FROZEN_BYTES_MISMATCH');
    // Decode the original compact source with its own contract and serialization checks.
    let inner;try{inner=JSON.parse(compact);}catch(_){V.fail('VNEXT_FIGMA_SNAPSHOT_TRUNCATED');}
    if(inner.schema_version!=='kodjo.vnext.figma-transport.v1')V.fail('VNEXT_FIGMA_STORAGE_INVALID');
    return snapshotPacket(compact);
  }
  const packed=serialized.schema_version==='kodjo.vnext.figma-transport.v1';
  const packet=unpack(serialized);
  if(verifySerialization&&content!==(packed?JSON.stringify(serialized)+'\n':JSON.stringify(serialized,null,2)+'\n'))V.fail('VNEXT_FIGMA_LAUNCH_FROZEN_BYTES_MISMATCH');
  return packet;
}
function sourceInput(packet,revision,packetPath,content=snapshotContent(packet)){
  validate(packet,{ready:true});V.assertSha40(revision,'VNEXT_FIGMA_FROZEN_REVISION_REQUIRED');
  eq(snapshotPacket(content),packet,'VNEXT_FIGMA_LAUNCH_FROZEN_BYTES_MISMATCH');
  const look=lookup(packet);
  return {source_kind:'FIGMA',authority:'VISUAL',locator:'figma-snapshot:'+safePath(packetPath),revision,fingerprint:V.sha256(content),
    units:packet.nodes.map(n=>({locator:'ELEMENT:'+n.id,fingerprint:V.sha256(unitText(packet,'ELEMENT:'+n.id,look)),disposition:(look.byElement.get(n.id)||[]).some(d=>['REALIZE','PRESERVE'].includes(d.disposition))?'REQUIREMENT_SOURCE':'CONTEXT_ONLY'}))};
}
function observe(source,{cwd,readGit}){
  if(source.authority!=='VISUAL'||!source.locator.startsWith('figma-snapshot:'))V.fail('VNEXT_FIGMA_FROZEN_REFERENCE_REQUIRED');
  V.assertSha40(source.revision,'VNEXT_FIGMA_FROZEN_REVISION_REQUIRED');
  const content=readGit(cwd,source.revision,safePath(source.locator.slice(15)));
  // Byte fingerprints are checked by observeSources after decoding, as before.
  const packet=snapshotPacket(content,{verifySerialization:false});
  validate(packet,{ready:true});
  eq(source.units.map(u=>u.locator).sort(),packet.nodes.map(n=>'ELEMENT:'+n.id).sort(),'VNEXT_FIGMA_SOURCE_UNIT_OMITTED');
  const look=lookup(packet);
  for(const n of packet.nodes){const unit=source.units.find(u=>u.locator==='ELEMENT:'+n.id);
    if(unit.disposition!==((look.byElement.get(n.id)||[]).some(d=>['REALIZE','PRESERVE'].includes(d.disposition))?'REQUIREMENT_SOURCE':'CONTEXT_ONLY'))V.fail('VNEXT_FIGMA_SOURCE_DISPOSITION_DRIFT');}
  for(const d of packet.documents){const bytes=readGit(cwd,d.revision,d.path);if(d.locator==='FULL_FILE'&&V.sha256(bytes)!==d.fingerprint)V.fail('VNEXT_FIGMA_DOCUMENT_STALE');
    if(d.locator!=='FULL_FILE'&&!bytes.includes(d.content))V.fail('VNEXT_FIGMA_DOCUMENT_STALE');}
  return {content,packet};
}
function required(packet){return packet.decisions.filter(d=>['REALIZE','PRESERVE'].includes(d.disposition));}
function validateRegistry(references,registry){
  for(const ref of references){
    for(const d of required(ref.packet))if(!registry.requirements.some(r=>r.status==='ACTIVE'&&r.source_id===ref.source_id&&r.source.unit_locator==='ELEMENT:'+d.element_id))V.fail('VNEXT_FIGMA_REQUIREMENT_OMITTED',d.property_id);
    for(const s of ref.packet.states.filter(s=>s.disposition==='REQUIRED'))if(!registry.requirements.some(r=>r.status==='ACTIVE'&&r.source.authority==='FUNCTIONAL'&&r.statement===s.expected&&ref.packet.documents.some(d=>s.document_ids.includes(d.document_id)&&r.source.locator===d.path&&r.source.revision===d.revision)))V.fail('VNEXT_FIGMA_DOCUMENT_REQUIREMENT_OMITTED',s.state_id);
  }
}
function validateCoverage(references,criteria,registry){
  const requirementById=new Map(registry.requirements.map(r=>[r.requirement_id,r]));
  const seen=new Set();for(const ref of references){
    validate(ref.packet,{ready:true});if(seen.has(ref.source_id))V.fail('VNEXT_FIGMA_REFERENCE_DUPLICATE');seen.add(ref.source_id);
    const look=lookup(ref.packet);
    const expected=new Set(required(ref.packet).map(d=>d.property_id)),covered=new Set();
    for(const c of criteria)for(const a of c.assertions){
      if(a.figma_reference?.source_id!==ref.source_id)continue;
      const binding=a.figma_reference,d=look.decisions.get(binding.property_id);
      V.assertExactKeys(binding,['source_id','reference_hash','property_id','observable'],[],'VNEXT_FIGMA_ASSERTION_BINDING_INVALID');
      if(!d||!expected.has(d.property_id)||binding.reference_hash!==ref.packet.contract_hash)V.fail('VNEXT_FIGMA_ASSERTION_REFERENCE_MISMATCH');
      if(a.expected!==V.canonicalStringify(d.rule)||V.canonicalStringify(a.figma_reference.observable)!==V.canonicalStringify(d.rule))V.fail('VNEXT_FIGMA_ASSERTION_VAGUE');
      const r=requirementById.get(c.requirement_id);
      if(!r||r.source_id!==ref.source_id||r.source.unit_locator!=='ELEMENT:'+d.element_id)V.fail('VNEXT_FIGMA_ASSERTION_SOURCE_MISMATCH');
      if(!a.proof_required.includes('VISUAL_COMPARE'))V.fail('VNEXT_FIGMA_ASSERTION_PROOF_REQUIRED');
      covered.add(d.property_id);
    }
    eq([...expected].sort(),[...covered].sort(),'VNEXT_FIGMA_REQUIRED_PROPERTY_UNCOVERED');
    for(const state of ref.packet.states.filter(s=>s.disposition==='REQUIRED')){
      const assertions=criteria.flatMap(c=>c.assertions.map(a=>({c,a}))).filter(({a})=>a.figma_document_state?.source_id===ref.source_id&&a.figma_document_state.state_id===state.state_id);
      if(!assertions.length)V.fail('VNEXT_FIGMA_DOCUMENT_STATE_UNCOVERED',state.state_id);
      for(const {c,a}of assertions){
        V.assertExactKeys(a.figma_document_state,['source_id','reference_hash','state_id'],['scenario_ids'],'VNEXT_FIGMA_DOCUMENT_BINDING_INVALID');
        const r=requirementById.get(c.requirement_id),docs=ref.packet.documents.filter(d=>state.document_ids.includes(d.document_id));
        if(a.figma_document_state.reference_hash!==ref.packet.contract_hash||a.expected!==state.expected||!r||r.source.authority!=='FUNCTIONAL'
            ||!docs.some(d=>d.path===r.source.locator&&d.revision===r.source.revision))V.fail('VNEXT_FIGMA_DOCUMENT_ASSERTION_MISMATCH');
        if(!a.proof_required.some(p=>['FUNCTIONAL_TEST','STATIC_ANALYSIS'].includes(p)))V.fail('VNEXT_FIGMA_DOCUMENT_PROOF_REQUIRED');
      }
      if(state.scenarios){
        const seenScenarios=new Set();
        for(const {a}of assertions){
          if(!Array.isArray(a.figma_document_state.scenario_ids)||!a.figma_document_state.scenario_ids.length)V.fail('VNEXT_FIGMA_DOCUMENT_SCENARIO_UNCOVERED',state.state_id);
          for(const id of a.figma_document_state.scenario_ids){
            const scenario=state.scenarios.find(s=>s.scenario_id===id);
            if(!scenario||seenScenarios.has(id))V.fail('VNEXT_FIGMA_DOCUMENT_SCENARIO_BINDING_INVALID',id);
            if(scenario.proof_required.some(p=>!a.proof_required.includes(p)))V.fail('VNEXT_FIGMA_DOCUMENT_SCENARIO_PROOF_REQUIRED',id);
            seenScenarios.add(id);
          }
        }
        eq([...seenScenarios].sort(),state.scenarios.map(s=>s.scenario_id).sort(),'VNEXT_FIGMA_DOCUMENT_SCENARIO_UNCOVERED');
      }
    }
  }
  for(const c of criteria)for(const a of c.assertions){
    for(const binding of [a.figma_reference,a.figma_document_state])if(binding&&!seen.has(binding.source_id))V.fail('VNEXT_FIGMA_ASSERTION_SOURCE_UNKNOWN');
  }
}
function assertCurrent(packet,current){
  validate(packet);validate(current);if(packet.contract_hash!==current.contract_hash)V.fail('VNEXT_FIGMA_CHANGED_REQUALIFICATION_REQUIRED');
}
function verifyMeasurements(packet,measurements){
  validate(packet,{ready:true});
  const rows=index(measurements,'measurement_id','VNEXT_FIGMA_MEASUREMENT_DUPLICATE');
  const targets=required(packet);
  for(const m of rows.values())if(m.reference_hash!==packet.contract_hash||!targets.some(d=>d.property_id===m.property_id&&d.rule.viewports.includes(m.viewport)))V.fail('VNEXT_FIGMA_MEASUREMENT_UNBOUND');
  for(const d of targets)for(const viewport of d.rule.viewports){
    const matches=[...rows.values()].filter(m=>m.property_id===d.property_id&&m.viewport===viewport&&m.reference_hash===packet.contract_hash);
    if(matches.length!==1)V.fail('VNEXT_FIGMA_MEASUREMENT_REQUIRED',d.property_id);
    const m=matches[0];text(m.evidence,'VNEXT_FIGMA_MEASUREMENT_EVIDENCE_REQUIRED');
    if(d.rule.kind==='EQUALS'){
      if(typeof d.rule.value==='number'&&typeof m.value==='number'){
        if(!Number.isFinite(m.value)||Math.abs(m.value-d.rule.value)>d.rule.tolerance)V.fail('VNEXT_FIGMA_TARGET_NOT_SATISFIED',d.property_id);
      }else eq(m.value,d.rule.value,'VNEXT_FIGMA_TARGET_NOT_SATISFIED');
    }else for(const c of d.rule.value.constraints){
      const v=m.value?.[c.field];
      if(c.operator==='EQ'){
        if(typeof v==='number'&&typeof c.value==='number'){if(!Number.isFinite(v)||Math.abs(v-c.value)>d.rule.tolerance)V.fail('VNEXT_FIGMA_TARGET_NOT_SATISFIED');}
        else eq(v,c.value,'VNEXT_FIGMA_TARGET_NOT_SATISFIED');
      }
      else if(!Number.isFinite(v)||(c.operator==='MIN'?v<c.value-d.rule.tolerance:v>c.value+d.rule.tolerance))V.fail('VNEXT_FIGMA_TARGET_NOT_SATISFIED');
    }
  }
  return true;
}
function pack(packet){
  validate(packet);const {nodes,decisions,...metadata}=packet;
  const keys=[...new Set(nodes.flatMap(n=>Object.keys(n.properties)))],values=[],byValue=new Map(),nodeIndex=new Map(nodes.map((n,i)=>[n.id,i]));
  const intern=v=>{const key=V.canonicalStringify(v);if(!byValue.has(key)){byValue.set(key,values.length);values.push(v);}return byValue.get(key);};
  const rows=nodes.map(n=>[n.id,n.parent_id,n.type,n.name,n.child_ids,Object.entries(n.properties).map(([k,v])=>[keys.indexOf(k),intern(v)])]);
  const classified=decisions.map(d=>[nodeIndex.get(d.element_id),keys.indexOf(d.property),d.disposition,intern(d.reason),intern(d.document_ids),intern(d.rule)]);
  return {schema_version:'kodjo.vnext.figma-transport.v1',metadata,property_keys:keys,values,nodes:rows,decisions:classified};
}
function unpack(transport){
  if(transport.schema_version!== 'kodjo.vnext.figma-transport.v1')return validate(transport);
  V.assertExactKeys(transport,['schema_version','metadata','property_keys','values','nodes','decisions'],[],'VNEXT_FIGMA_TRANSPORT_KEYS_INVALID');
  const keys=transport.property_keys,values=transport.values;
  const nodes=transport.nodes.map(r=>({id:r[0],parent_id:r[1],type:r[2],name:r[3],child_ids:r[4],properties:Object.fromEntries(r[5].map(([k,v])=>[keys[k],values[v]]))}));
  const decisions=transport.decisions.map(r=>({property_id:id(nodes[r[0]].id,keys[r[1]]),element_id:nodes[r[0]].id,property:keys[r[1]],disposition:r[2],reason:values[r[3]],document_ids:values[r[4]],rule:values[r[5]]}));
  return validate({...transport.metadata,nodes,decisions});
}
function packUi(ui){return {...ui,figma_references:ui.figma_references.map(r=>({...r,packet:pack(r.packet)}))};}
function unpackUi(ui){return {...ui,figma_references:ui.figma_references.map(r=>({...r,packet:unpack(r.packet)}))};}
function consume(planBody,directory,stage){
  const parsed=require('./machine-block').parse(planBody,'KODJO_VNEXT_UI_ATOMICITY_JSON',{code:'VNEXT_FIGMA_TRANSPORT_REQUIRED'});
  const registry=require('./machine-block').parse(planBody,'KODJO_VNEXT_REQUIREMENT_REGISTRY_JSON',{code:'VNEXT_FIGMA_REGISTRY_TRANSPORT_REQUIRED'});
  return consumeArtifacts(unpackUi(parsed),registry,directory,stage,V.sha256(planBody));
}
function consumeArtifacts(ui,registry,directory,stage,planHash=null){
  if(!['PLANNER','IMPLEMENTER','IMPLEMENTATION_REVIEWER'].includes(stage))V.fail('VNEXT_FIGMA_CONSUMER_STAGE_INVALID');
  const references=ui.figma_references;
  if(!Array.isArray(references)||!references.length)V.fail('VNEXT_FIGMA_TRANSPORT_REQUIRED');
  V.verifyContractHash(ui,'VNEXT_FIGMA_UI_TRANSPORT_HASH_INVALID');
  V.verifyContractHash(registry,'VNEXT_FIGMA_REGISTRY_TRANSPORT_HASH_INVALID');
  validateCoverage(references,ui.criteria,registry);
  const base=fs.realpathSync(directory),observed=[];
  for(const ref of references){validate(ref.packet,{ready:true});const assets=[],look=lookup(ref.packet);
    for(const r of ref.packet.resources){const target=path.resolve(base,safePath(r.path));
      // Reject existing symlink parents before writing even within a disposable view.
      let parent=path.dirname(target);while(parent!==base){if(fs.existsSync(parent)&&fs.lstatSync(parent).isSymbolicLink())V.fail('VNEXT_FIGMA_RESOURCE_SYMLINK');parent=path.dirname(parent);}
      if(fs.existsSync(target)&&fs.lstatSync(target).isSymbolicLink())V.fail('VNEXT_FIGMA_RESOURCE_SYMLINK');
      if(fs.existsSync(target)){if(!fs.readFileSync(target).equals(checkResource(r)))V.fail('VNEXT_FIGMA_RESOURCE_DESTINATION_CHANGED');}
      else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,checkResource(r),{flag:'wx'});}
      if(!fs.readFileSync(target).equals(checkResource(r)))V.fail('VNEXT_FIGMA_RESOURCE_MATERIALIZATION_MISMATCH');assets.push({resource_id:r.resource_id,path:target,sha256:r.sha256});}
    observed.push({source_id:ref.source_id,reference_hash:ref.packet.contract_hash,documentary_states:ref.packet.states,properties:required(ref.packet).map(d=>propertyUnit(ref.packet,d.property_id,look)),assets});
  }
  return V.sealContract({schema_version:'kodjo.vnext.figma-consumer-observation.v1',stage,plan_sha256:planHash||V.canonicalHash({ui_contract_hash:ui.contract_hash,requirement_registry_hash:registry.contract_hash}),references:observed,semantic_use:'NOT_ATTESTED_BY_BYTE_OBSERVATION'});
}
module.exports={lookup,SCHEMA,id,safePath,build,validate,sourceInput,observe,unitText,propertyUnit,required,validateRegistry,validateCoverage,assertCurrent,verifyMeasurements,pack,unpack,packUi,unpackUi,consume,consumeArtifacts,snapshotContent,snapshotPacket};
