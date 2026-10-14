'use strict';
// Cross-context import is limited to common properties, never new instance mappings.
const V=require('./vnext-contract'),F=require('./vnext-figma-source'),Chain=require('./vnext-live-chain');
function codeIdentity(cwd,head){V.assertSha40(head);const tree=Chain.command('git',['ls-tree','-r',head],cwd).split('\n').filter(line=>{const p=line.split('\t')[1];return p&&!p.startsWith('.github/')&&!p.startsWith('docs/preparation/')&&!p.startsWith('scripts/kodjo/')&&!p.startsWith('tests/kodjo/');});return V.canonicalHash(tree);}
function properties(d){
 const C=require('./vnext-component-coverage'),ui=F.unpackUi(d.ui),byProperty=new Map();
 for(const ref of ui.figma_references||[]){const rows=new Map(C.analyze(ref.packet).map(r=>[r.property_id,r])),nodes=new Map(ref.packet.nodes.map(n=>[n.id,n]));
  for(const criterion of ui.criteria)for(const a of criterion.assertions){const b=a.figma_reference;if(b?.source_id!==ref.source_id)continue;const row=rows.get(b.property_id);if(row?.level!=='COMPONENT_COMMON')continue;
   const mapping=d.component_review?.mapping_facts.find(f=>f.criterion_id===criterion.criterion_id||f.criterion_id===d.component_review.plan.inheritance_links.find(l=>l.common_assertion_id===a.assertion_id)?.common_criterion_id);
   if(!mapping)continue;const root=nodes.get(row.owner_id),node=nodes.get(row.element_id);
   if(root?.type==='INSTANCE'&&(!row.equal_to_master||!Array.isArray(root.properties.overrides)||root.properties.overrides.length||Object.keys(root.properties.componentProperties||{}).length))continue;
   const key=V.canonicalHash({file_key:ref.packet.file_key,master_id:row.master_id,master_element_id:row.master_element_id||node.id,property:row.property,observable:b.observable,bindings:node.properties.boundVariables||{},modes:node.properties.resolvedVariableModes||{},variant:root.properties.variantProperties||{},variables:ref.packet.variables,resources:ref.packet.resources.map(r=>r.sha256).sort(),mapping:{code_path:mapping.code_path,code_export:mapping.code_export,files:mapping.files.map(({revision,materialized_path,...f})=>f)}});
   if(!byProperty.has(key))byProperty.set(key,[]);byProperty.get(key).push(a.assertion_id);
  }
 }return byProperty;
}
function fromPreviousReview(source){
 let {previousPlanBody,previousOptions,previousReceipt,previousRaw,currentDossier,currentCwd}=source;
 const Review=require('./vnext-figma-implementation-review');
 const common=cwd=>require('node:fs').realpathSync(require('node:path').resolve(cwd,Chain.command('git',['rev-parse','--git-common-dir'],cwd).trim()));
 if(common(previousOptions.cwd)!==common(currentCwd))throw Error('COMPONENT_IMPORT_FOREIGN_REPOSITORY');
 if(codeIdentity(previousOptions.cwd,previousOptions.deliveryHead)!==codeIdentity(currentCwd,currentDossier.delivery_head))throw Error('COMPONENT_IMPORT_CODE_CHANGED');
 if(Chain.command('git',['rev-parse','HEAD'],previousOptions.cwd).trim()!==previousOptions.deliveryHead){
  const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-qualified-source-')),origin=previousOptions.cwd,read=previousOptions.readText;
  try{Chain.command('git',['worktree','add','--detach',dir,previousOptions.deliveryHead],origin);
   previousOptions={...previousOptions,cwd:dir,...(read?{readText:file=>read(path.join(origin,path.relative(dir,file)))}:{})};
   return fromPreviousReview({...source,previousOptions});
  }finally{try{Chain.command('git',['worktree','remove','--force',dir],origin);}finally{fs.rmSync(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100});}}
 }
 Review.verifyReceipt(previousPlanBody,previousOptions,previousReceipt,previousRaw);
 if(previousReceipt.assessment.verdict!=='APPROVE')throw Error('COMPONENT_IMPORT_PREVIOUS_NOT_APPROVED');
 const previousDossier=Review.prepare(previousPlanBody,previousOptions),before=properties(previousDossier),after=properties(currentDossier),reviewed=new Set(previousReceipt.assessment.reviewed_assertion_ids),imported=[];
 const canonical=new Set((currentDossier.component_review?.plan.inheritance_links||[]).map(l=>l.common_assertion_id));
 for(const [key,ids]of after){const source=(before.get(key)||[]).find(id=>reviewed.has(id));if(source)for(const id of ids.filter(id=>canonical.has(id)))imported.push({assertion_id:id,previous_assertion_id:source,property_signature:key});}
 return V.sealContract({schema_version:'kodjo.vnext.qualified-component-import.v1',previous_receipt_hash:previousReceipt.contract_hash,previous_raw_response_sha256:previousRaw===null?null:V.sha256(previousRaw),previous_session_ids:previousReceipt.session_ids||[previousReceipt.session_id],current_dossier_hash:require('./vnext-implementation-cumulative').hash(currentDossier),code_identity_hash:codeIdentity(currentCwd,currentDossier.delivery_head),imported_common_assertions:imported.sort((a,b)=>a.assertion_id.localeCompare(b.assertion_id)),phase:'COMMON_REVIEW_ONLY_INSTANCE_AND_INTEGRATION_STILL_DIRECT'});
}
function verify(imported,source){V.verifyContractHash(imported);const rebuilt=fromPreviousReview(source);if(imported.contract_hash!==rebuilt.contract_hash)throw Error('COMPONENT_IMPORT_EVIDENCE_CHANGED');return imported;}
module.exports={codeIdentity,properties,fromPreviousReview,verify};
