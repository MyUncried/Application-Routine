'use strict';
// An implementation review creates its own proof, bound to actual delivery Git
// bytes. It cannot promote the plan review's inheritance into conformity.
const fs=require('node:fs'),path=require('node:path');
const V=require('./vnext-contract'),Chain=require('./vnext-live-chain'),C=require('./vnext-component-coverage');
function prepare(ui,{cwd,deliveryHead,evidenceDirectory}){
 const plan=ui.component_coverage;if(!plan?.inheritance_links.length)return null;
 C.validate(plan,{assertionIds:ui.criteria.flatMap(c=>c.assertions.map(a=>a.assertion_id)),criterionIds:ui.criteria.map(c=>c.criterion_id)});
 const criteria=new Map(ui.criteria.map(c=>[c.criterion_id,c]));
 const mappingIds=[...new Set(plan.inheritance_links.flatMap(r=>[r.instance_criterion_id,r.common_criterion_id]))].sort();
 const mappingFacts=mappingIds.map(id=>{
  const criterion=criteria.get(id),binding=ui.component_bindings.find(b=>b.source_id===criterion.source.source_id&&'ELEMENT:'+b.element_id===criterion.source.unit_locator);
  if(!binding)throw Error('VNEXT_IMPLEMENTATION_COMPONENT_MAPPING_MISSING');
  const files=[...new Set([binding.code_path,...binding.usage_paths])].sort().map(file=>{
   require('./vnext-figma-source').safePath(file);
   const content=Chain.readGit(cwd,deliveryHead,file),sha256=V.sha256(content),target=path.join(evidenceDirectory,'component-code',sha256+'.txt');
   if(fs.existsSync(path.dirname(target))&&fs.lstatSync(path.dirname(target)).isSymbolicLink())throw Error('VNEXT_IMPLEMENTATION_COMPONENT_SOURCE_SYMLINK');
   fs.mkdirSync(path.dirname(target),{recursive:true});
   if(fs.existsSync(target)&&fs.lstatSync(target).isSymbolicLink())throw Error('VNEXT_IMPLEMENTATION_COMPONENT_SOURCE_SYMLINK');
   if(fs.existsSync(target)){if(V.sha256(fs.readFileSync(target))!==sha256)throw Error('VNEXT_IMPLEMENTATION_COMPONENT_SOURCE_CHANGED');}
   else fs.writeFileSync(target,content,{flag:'wx'});
   return {path:file,revision:deliveryHead,sha256,materialized_path:target};
  });
  return {criterion_id:id,code_path:binding.code_path,code_export:binding.code_export,files};
 });
 return {phase:'IMPLEMENTATION_REVIEW',delivery_head:deliveryHead,plan,mapping_facts:mappingFacts,
  signature:V.canonicalHash({deliveryHead,plan_hash:plan.contract_hash,mappings:mappingFacts.map(({files,...rest})=>({...rest,files:files.map(({materialized_path,...file})=>file)}))})};
}
function coverage(dossier,assessment){
 const descriptor=dossier.component_review;if(!descriptor)return null;
 const observations=assessment.component_mapping_observations;
 if(!Array.isArray(observations)||observations.length!==descriptor.mapping_facts.length)throw Error('VNEXT_IMPLEMENTATION_MAPPING_REVIEW_REQUIRED');
 const seen=new Set(),matched=[];
 for(const row of observations){
  V.assertExactKeys(row,['criterion_id','status','observed_files','reason'],[],'VNEXT_IMPLEMENTATION_MAPPING_OBSERVATION_KEYS');
  const fact=descriptor.mapping_facts.find(f=>f.criterion_id===row.criterion_id);
  if(!fact||seen.has(row.criterion_id)||!['MATCH','MISMATCH'].includes(row.status))throw Error('VNEXT_IMPLEMENTATION_MAPPING_OBSERVATION_INVALID');seen.add(row.criterion_id);
  V.assertUnicodeExactText(row.reason,'VNEXT_IMPLEMENTATION_MAPPING_REASON_REQUIRED');
  const expected=fact.files.map(({materialized_path,...file})=>file).sort((a,b)=>a.path.localeCompare(b.path));
  if(V.canonicalHash(row.observed_files.slice().sort((a,b)=>a.path.localeCompare(b.path)))!==V.canonicalHash(expected))throw Error('VNEXT_IMPLEMENTATION_MAPPING_SOURCE_UNVERIFIED');
  if(row.status==='MATCH')matched.push(row.criterion_id);else if(assessment.verdict==='APPROVE')throw Error('VNEXT_IMPLEMENTATION_MAPPING_FALSE_APPROVAL');
 }
 const imported=qualifiedIds(dossier,observations);
 const inherited=C.covered(descriptor.plan,[...assessment.reviewed_assertion_ids,...matched,...imported]);
 return V.sealContract({schema_version:'kodjo.vnext.component-implementation-coverage.v1',delivery_head:descriptor.delivery_head,signature:descriptor.signature,
  direct_assertion_ids:[...assessment.reviewed_assertion_ids].sort(),inherited_assertion_ids:inherited,...(imported.length?{qualified_common_assertion_ids:imported.sort()}:{}),mapping_observations_hash:V.canonicalHash(observations)});
}
function schema(){return {type:'array',items:{type:'object',additionalProperties:false,required:['criterion_id','status','observed_files','reason'],properties:{criterion_id:{type:'string'},status:{enum:['MATCH','MISMATCH']},observed_files:{type:'array',items:{type:'object',additionalProperties:false,required:['path','revision','sha256'],properties:{path:{type:'string'},revision:{type:'string'},sha256:{type:'string'}}}},reason:{type:'string'}}}};}
function qualifiedIds(dossier,observations){const matched=new Set((observations||[]).filter(o=>o.status==='MATCH').map(o=>o.criterion_id));return [...new Set((dossier.qualified_common_imports||[]).flatMap(q=>q.imported_common_assertions.map(x=>x.assertion_id)))].filter(id=>(dossier.component_review?.plan.inheritance_links||[]).some(l=>l.common_assertion_id===id&&matched.has(l.common_criterion_id)));}
module.exports={prepare,coverage,schema,qualifiedIds};
