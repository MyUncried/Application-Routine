'use strict';
// Review coverage is not an implementation conformity certificate. All source
// assertions survive. A link becomes coverage only after its common property
// AND its two component/code mapping criteria have actually been reviewed.
const V=require('./vnext-contract');
const SCHEMA='kodjo.vnext.component-review-coverage.v1';
const INSTANCE_FIELDS=new Set(['main_component_id','variantProperties','componentProperties','overrides','boundVariables','explicitVariableModes','resolvedVariableModes']);
const INTEGRATION_FIELDS=new Set(['characters','text','visible','x','y','constraints','layoutPositioning','layoutAlign','layoutGrow','layoutSizingHorizontal','layoutSizingVertical','minWidth','minHeight','maxWidth','maxHeight','overflowDirection']);
function same(a,b){return V.canonicalHash(a)===V.canonicalHash(b);}
function hasObservableOverrides(root,property){
 const overrides=root.properties.overrides;
 if(!Array.isArray(overrides))return true;
 // A layer rename is metadata. It does not change an unrelated observable;
 // every other override remains conservative until dependencies are qualified.
 return overrides.some(o=>!o||typeof o.id!=='string'||!Array.isArray(o.overriddenFields)||o.overriddenFields.some(f=>f!=='name'||property==='name'));
}
function ownership(packet){
 const nodes=new Map(packet.nodes.map(n=>[n.id,n]));
 function owner(node){const seen=new Set();while(node){if(seen.has(node.id))throw Error('VNEXT_COMPONENT_ANCESTRY_CYCLE');seen.add(node.id);if(node.type==='INSTANCE'||node.type==='COMPONENT')return node;node=nodes.get(node.parent_id);}return null;}
 function descendant(node,ancestor){const seen=new Set();while(node){if(node.id===ancestor.id)return true;if(seen.has(node.id))return false;seen.add(node.id);node=nodes.get(node.parent_id);}return false;}
 function masterElement(node,root){
  const master=nodes.get(root.properties.main_component_id);if(master?.type!=='COMPONENT')return null;
  if(node.id===root.id)return master;
  // Figma's inherited identifier is corroborated by both ancestry trees.
  const target=nodes.get(node.id.split(';').at(-1));
  return node.id.startsWith('I'+root.id+';')&&target&&descendant(target,master)&&target.type===node.type?target:null;
 }
 return {nodes,owner,masterElement};
}
function analyze(packet){
 const o=ownership(packet),rows=[];
 for(const d of packet.decisions.filter(d=>['REALIZE','PRESERVE'].includes(d.disposition))){
  const node=o.nodes.get(d.element_id),root=o.owner(node),master=root?.type==='INSTANCE'?o.masterElement(node,root):null;
  const level=INSTANCE_FIELDS.has(d.property)?'INSTANCE':!root||INTEGRATION_FIELDS.has(d.property)||node.id===root.id&&['width','height','rotation'].includes(d.property)?'INTEGRATION':'COMPONENT_COMMON';
  const equal=!!master&&Object.hasOwn(master.properties,d.property)&&same(node.properties[d.property],master.properties[d.property]);
  rows.push({property_id:d.property_id,element_id:d.element_id,property:d.property,level,owner_id:root?.id||null,master_element_id:master?.id||null,master_id:root?.type==='INSTANCE'?root.properties.main_component_id:root?.type==='COMPONENT'?root.id:null,
   equal_to_master:equal,override_provenance_available:root?.type==='INSTANCE'&&Array.isArray(root.properties.overrides)});
 }
 return rows;
}
function build({references,criteria,candidateManifest,componentBindings=[],componentReuseDecisions=[]}){
 if(!Array.isArray(componentBindings))throw Error('VNEXT_COMPONENT_BINDINGS_INVALID');
 const candidates=new Map(candidateManifest.candidates.map(c=>[c.candidate_id,c]));
 const assertions=criteria.flatMap(c=>c.assertions.map(a=>({a,c}))),byProperty=new Map(),byElement=new Map();
 for(const row of assertions){const b=row.a.figma_reference;if(b){byProperty.set(b.source_id+'\0'+b.property_id,row);byElement.set(b.source_id+'\0'+row.c.source.unit_locator,row.c);}}
 const bindings=new Map();
 for(const b of componentBindings){
  V.assertExactKeys(b,['source_id','element_id','master_id','code_path','code_export','usage_paths','evidence_refs'],[],'VNEXT_COMPONENT_BINDING_KEYS');
  V.uniqueStrings(b.usage_paths,'VNEXT_COMPONENT_USAGE_PATHS_REQUIRED','usage_paths');
  if(b.usage_paths.some(p=>!candidateManifest.candidates.some(c=>c.path===p&&c.origin==='GIT_TREE'&&c.candidate_kind==='CODE')))throw Error('VNEXT_COMPONENT_USAGE_PATH_UNAVAILABLE');
  V.uniqueStrings(b.evidence_refs,'VNEXT_COMPONENT_MAPPING_EVIDENCE_REQUIRED','evidence_refs');
  const key=b.source_id+'\0ELEMENT:'+b.element_id,c=byElement.get(key),candidate=candidates.get(c?.selected_component_candidate_id);
  if(bindings.has(key)||!c||candidate?.origin!=='GIT_TREE'||candidate.path!==b.code_path||c.selected_component!==b.code_export)throw Error('VNEXT_COMPONENT_CODE_MAPPING_UNCERTAIN');
  bindings.set(key,{b,c});
 }
 const levels={COMPONENT_COMMON:[],INSTANCE:[],INTEGRATION:[]},links=[],instanceChecks=[],reasons={},reasonByAssertion=new Map(),seen=new Set(),canonicalByGroup=new Map(),unresolved=new Map(),potentialGroups=new Map();
 const direct=(id,reason)=>{reasons[reason]=(reasons[reason]||0)+1;reasonByAssertion.set(id,reason);seen.add(id);};
 for(const ref of references){
  const o=ownership(ref.packet),analysis=analyze(ref.packet),decisionByElementProperty=new Map(ref.packet.decisions.map(d=>[d.element_id+'\0'+d.property,d]));
  for(const node of ref.packet.nodes.filter(n=>n.type==='INSTANCE')){
   const criterion=byElement.get(ref.source_id+'\0ELEMENT:'+node.id),mapping=bindings.get(ref.source_id+'\0ELEMENT:'+node.id);
   instanceChecks.push({source_id:ref.source_id,instance_id:node.id,criterion_id:criterion?.criterion_id||null,master_id:node.properties.main_component_id,
    identity_variant_parameters_bindings_hash:V.canonicalHash(node.properties),override_capture:Array.isArray(node.properties.overrides)?'CAPTURED':'MISSING',mapping_status:mapping?'TO_REVIEW':'UNQUALIFIED',coverage_mode:'DIRECT'});
  }
  for(const row of analysis){
   const record=byProperty.get(ref.source_id+'\0'+row.property_id);if(!record)continue;
   const {a,c}=record;levels[row.level].push(a.assertion_id);
   if(row.level!=='COMPONENT_COMMON'){direct(a.assertion_id,row.level);continue;}
   const root=o.nodes.get(row.owner_id),node=o.nodes.get(row.element_id);
   if(root?.type!=='INSTANCE'){direct(a.assertion_id,'COMMON_PROPERTY_REQUIRES_DIRECT_QUALIFICATION');continue;}
   if(!row.override_provenance_available){direct(a.assertion_id,'OVERRIDE_PROVENANCE_UNAVAILABLE');continue;}
   if(Object.keys(root.properties.componentProperties||{}).length){direct(a.assertion_id,'INSTANCE_PARAMETERS_REQUIRE_DEPENDENCY_QUALIFICATION');continue;}
   if(hasObservableOverrides(root,row.property)){direct(a.assertion_id,'INSTANCE_HAS_OVERRIDES');continue;}
   if(!row.equal_to_master){direct(a.assertion_id,'PARAMETER_OR_PROPERTY_DIFFERS');continue;}
   const current=bindings.get(ref.source_id+'\0ELEMENT:'+row.element_id)||bindings.get(ref.source_id+'\0ELEMENT:'+row.owner_id),common=bindings.get(ref.source_id+'\0ELEMENT:'+row.master_element_id);
   if(!current||current.b.master_id!==row.master_id||candidates.get(c.selected_component_candidate_id)?.path!==current.b.code_path||c.selected_component!==current.b.code_export){direct(a.assertion_id,'COMPONENT_CODE_MAPPING_UNQUALIFIED');continue;}
   const master=o.nodes.get(row.master_element_id),masterDecision=decisionByElementProperty.get(master.id+'\0'+row.property);
   const masterAssertion=masterDecision&&byProperty.get(ref.source_id+'\0'+masterDecision.property_id);
   const key=V.canonicalHash({source_id:ref.source_id,master:row.master_id,element:row.master_element_id,property:row.property,rule:a.figma_reference.observable,mapping:{path:current.b.code_path,export:current.b.code_export}});
   const declaredCommon=common&&common.b.master_id===row.master_id&&common.b.code_path===current.b.code_path&&common.b.code_export===current.b.code_export?masterAssertion:null;
   const canonical=declaredCommon||canonicalByGroup.get(key);
   // Binding values, variable modes, rules and property-local paint aliases all
   // belong to the signature. A token reference alone grants no coverage.
   if(canonical&&!same(canonical.a.figma_reference.observable,a.figma_reference.observable)
    ||!same(node.properties.boundVariables||{},master.properties.boundVariables||{})
    ||!same(node.properties.resolvedVariableModes||{},master.properties.resolvedVariableModes||{})
    ||!same(root.properties.variantProperties||{},o.nodes.get(row.master_id)?.properties.variantProperties||{})){
    direct(a.assertion_id,'VARIANT_BINDING_OR_RULE_DIFFERS');continue;
   }
   const instanceCriterion=byElement.get(ref.source_id+'\0ELEMENT:'+row.owner_id);
   if(!instanceCriterion){direct(a.assertion_id,'INSTANCE_IDENTITY_REQUIREMENT_MISSING');continue;}
   if(!canonical){canonicalByGroup.set(key,record);direct(a.assertion_id,'COMMON_PROPERTY_REQUIRES_DIRECT_QUALIFICATION');continue;}
   const commonRoot=o.owner(o.nodes.get(canonical.c.source.unit_locator.slice('ELEMENT:'.length))),commonCriterion=commonRoot&&byElement.get(ref.source_id+'\0ELEMENT:'+commonRoot.id);
   if(!commonCriterion){direct(a.assertion_id,'COMMON_IDENTITY_REQUIREMENT_MISSING');continue;}
   links.push({source_id:ref.source_id,master_id:row.master_id,master_element_id:row.master_element_id,property:row.property,assertion_id:a.assertion_id,common_assertion_id:canonical.a.assertion_id,instance_criterion_id:instanceCriterion.criterion_id,common_criterion_id:commonCriterion.criterion_id,
    required_review_target_ids:[...new Set([canonical.a.assertion_id,instanceCriterion.criterion_id,commonCriterion.criterion_id])].sort(),
    signature:V.canonicalHash({packet_hash:ref.packet.contract_hash,code_tree_hash:candidateManifest.git_tree_sha256,master_id:row.master_id,master_element_id:row.master_element_id,property:row.property,rule:a.figma_reference.observable,mapping:{path:current.b.code_path,export:current.b.code_export}})});
   seen.add(a.assertion_id);
  }
 }
 const justified=new Set();
 if(!Array.isArray(componentReuseDecisions))throw Error('VNEXT_COMPONENT_REUSE_DECISIONS_INVALID');
 for(const d of componentReuseDecisions){
  V.assertExactKeys(d,['source_id','master_id','disposition','reason','evidence_refs'],[],'VNEXT_COMPONENT_REUSE_DECISION_KEYS');
  const ref=references.find(r=>r.source_id===d.source_id);if(!ref?.packet.nodes.some(n=>n.id===d.master_id&&n.type==='COMPONENT')||d.disposition!=='DIRECT_JUSTIFIED')throw Error('VNEXT_COMPONENT_REUSE_DECISION_INVALID');
  V.assertUnicodeExactText(d.reason,'VNEXT_COMPONENT_REUSE_DIRECT_REASON_REQUIRED');V.uniqueStrings(d.evidence_refs,'VNEXT_COMPONENT_REUSE_DIRECT_EVIDENCE_REQUIRED','evidence_refs');
  const key=d.source_id+'\0'+d.master_id;if(justified.has(key))throw Error('VNEXT_COMPONENT_REUSE_DECISION_DUPLICATE');justified.add(key);
 }
 for(const ref of references){
  const groups=new Map();for(const row of analyze(ref.packet).filter(r=>r.level==='COMPONENT_COMMON'&&r.equal_to_master)){
   const key=row.master_id+'\0'+row.master_element_id+'\0'+row.property,rows=groups.get(key)||[];rows.push(row);groups.set(key,rows);
  }
  for(const [key,rows]of groups)if(rows.length>1){
   potentialGroups.set(ref.source_id+'\0'+key,rows.length);
   if(justified.has(ref.source_id+'\0'+rows[0].master_id))continue;
   if(rows.some(row=>{const record=byProperty.get(ref.source_id+'\0'+row.property_id),reason=record&&reasonByAssertion.get(record.a.assertion_id);return ['OVERRIDE_PROVENANCE_UNAVAILABLE','COMPONENT_CODE_MAPPING_UNQUALIFIED','INSTANCE_IDENTITY_REQUIREMENT_MISSING','COMMON_IDENTITY_REQUIREMENT_MISSING'].includes(reason);}))unresolved.set(ref.source_id+'\0'+rows[0].master_id,{source_id:ref.source_id,master_id:rows[0].master_id});
  }
 }
 for(const {a}of assertions)if(!seen.has(a.assertion_id)){levels.INTEGRATION.push(a.assertion_id);direct(a.assertion_id,'FUNCTION_OR_ACCESSIBILITY_OR_NON_FIGMA');}
 for(const ids of Object.values(levels))ids.sort();links.sort((a,b)=>a.assertion_id.localeCompare(b.assertion_id));
 return V.sealContract({schema_version:SCHEMA,phase:'PLANNING_REVIEW',assertion_count:assertions.length,levels,instance_checks:instanceChecks,reuse_assessment:{status:unresolved.size?'REQUIRES_SOURCE_OR_MAPPING_QUALIFICATION':'ASSESSED',unresolved_components:[...unresolved.values()],repeated_equal_groups:potentialGroups.size,direct_decisions:componentReuseDecisions},inheritance_links:links,direct_assertion_count:assertions.length-links.length,direct_reasons:reasons,
  dependencies:{figma_reference_hashes:references.map(r=>r.packet.contract_hash).sort(),code_revision:candidateManifest.revision,code_tree_hash:candidateManifest.git_tree_sha256},
  limits:['Links are conditional review coverage, never implementation conformity.','Instance and integration obligations remain direct.','Missing override capture or mapping forbids inheritance.','A changed frozen packet or code tree invalidates this coverage plan.']});
}
function validate(plan,{assertionIds,criterionIds}){
 V.assertExactKeys(plan,['schema_version','phase','assertion_count','levels','instance_checks','reuse_assessment','inheritance_links','direct_assertion_count','direct_reasons','dependencies','limits','contract_hash'],[],'VNEXT_COMPONENT_COVERAGE_KEYS');
 V.assertExactKeys(plan.levels,['COMPONENT_COMMON','INSTANCE','INTEGRATION'],[],'VNEXT_COMPONENT_LEVELS_INVALID');
 V.verifyContractHash(plan);if(plan.schema_version!==SCHEMA||plan.phase!=='PLANNING_REVIEW')throw Error('VNEXT_COMPONENT_COVERAGE_SCHEMA');
 const ids=Object.values(plan.levels).flat();
 if(new Set(ids).size!==ids.length||!same([...ids].sort(),[...assertionIds].sort())||plan.assertion_count!==ids.length)throw Error('VNEXT_COMPONENT_OBLIGATION_LOST');
 const allowed=new Set(assertionIds),criteria=new Set(criterionIds),seen=new Set();
 for(const row of plan.inheritance_links){
  if(seen.has(row.assertion_id)||row.assertion_id===row.common_assertion_id||!allowed.has(row.assertion_id)||!allowed.has(row.common_assertion_id)||!plan.levels.COMPONENT_COMMON.includes(row.assertion_id))throw Error('VNEXT_COMPONENT_INHERITANCE_INVALID');seen.add(row.assertion_id);
  V.assertSha64(row.signature);if(!criteria.has(row.instance_criterion_id)||!criteria.has(row.common_criterion_id)||!same([...new Set([row.common_assertion_id,row.instance_criterion_id,row.common_criterion_id])].sort(),row.required_review_target_ids)||row.required_review_target_ids.some(id=>id!==row.common_assertion_id&&!criteria.has(id)))throw Error('VNEXT_COMPONENT_MAPPING_REVIEW_REQUIRED');
 }
 if(plan.inheritance_links.some(row=>seen.has(row.common_assertion_id))||plan.direct_assertion_count!==ids.length-seen.size)throw Error('VNEXT_COMPONENT_INHERITANCE_CYCLE');
 return plan;
}
function covered(plan,reviewedIds){
 const direct=new Set(reviewedIds);
 return plan.inheritance_links.filter(row=>!direct.has(row.assertion_id)&&row.required_review_target_ids.every(id=>direct.has(id))).map(row=>row.assertion_id).sort();
}
function assertReviewReady(ui){if(!ui?.figma_references?.length)return;if(!ui.component_coverage)throw Error('VNEXT_COMPONENT_REUSE_ASSESSMENT_REQUIRED');if(ui.component_coverage.reuse_assessment.status!=='ASSESSED')throw Error('VNEXT_COMPONENT_REUSE_QUALIFICATION_REQUIRED_BEFORE_LARGE_REVIEW');}
module.exports={SCHEMA,analyze,build,validate,covered,assertReviewReady,hasObservableOverrides};
