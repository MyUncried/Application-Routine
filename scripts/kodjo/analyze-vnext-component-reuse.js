#!/usr/bin/env node
'use strict';
// Read-only, reproducible impact inventory. No source/receipt is rewritten and
// no equality candidate is represented as a qualification or an approval.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const V=require('./lib/vnext-contract'),B=require('./lib/vnext-file-bundle'),F=require('./lib/vnext-figma-source'),C=require('./lib/vnext-component-coverage');
function analyze({cwd=process.cwd(),revision,snapshotPath,uiPath,candidatePath}){
 V.assertSha40(revision);for(const file of [snapshotPath,uiPath,candidatePath])F.safePath(file);
 const cache=new Map(),read=file=>{file=file.split(path.sep).join('/');if(!cache.has(file))cache.set(file,execFileSync('git',['show',revision+':'+file],{cwd,encoding:'utf8',maxBuffer:128*1024*1024}));return cache.get(file);};
 const packet=F.snapshotPacket(read(snapshotPath));F.validate(packet,{ready:true});
 const ui=F.unpackUi(B.read(uiPath,{readText:read}));V.verifyContractHash(ui);
 const candidates=B.read(candidatePath,{readText:read});V.verifyContractHash(candidates);
 const assertions=ui.criteria.flatMap(c=>c.assertions),types={};for(const a of assertions)types[a.property_type]=(types[a.property_type]||0)+1;
 const proposal=C.build({references:ui.figma_references||[],criteria:ui.criteria,candidateManifest:candidates,componentBindings:ui.component_bindings||[],componentReuseDecisions:ui.component_reuse_decisions||[]});
 C.validate(proposal,{assertionIds:assertions.map(a=>a.assertion_id),criterionIds:ui.criteria.map(c=>c.criterion_id)});
 const rows=C.analyze(packet),candidatesByEquality=rows.filter(r=>r.level==='COMPONENT_COMMON'&&r.equal_to_master);
 const equalityGroups=new Set(candidatesByEquality.map(r=>r.master_id+'\0'+r.master_element_id+'\0'+r.property));
 const prior=ui.component_coverage||null;
 // This is an impact report, not a semantic review. Conditional links have no
 // attestation here, including if the source already contains a coverage plan.
 return V.sealContract({schema_version:'kodjo.vnext.component-impact-report.v1',revision,snapshot_path:snapshotPath,ui_path:uiPath,ui_contract_hash:ui.contract_hash,figma_reference_hash:packet.contract_hash,
  source_inventory:{nodes:packet.nodes.length,instances:packet.nodes.filter(n=>n.type==='INSTANCE').length,masters:packet.nodes.filter(n=>n.type==='COMPONENT').length,component_sets:packet.nodes.filter(n=>n.type==='COMPONENT_SET').length,required_properties:rows.length,assertions:assertions.length,assertions_by_type:types},
  before:{direct_obligations:assertions.length,inherited_obligations:0},
  after:{direct_obligations:proposal.direct_assertion_count,conditional_inheritance_links:proposal.inheritance_links.length,verified_inherited_obligations:0,remaining_to_verify:assertions.length,measured_verified_reduction:0},
  direct_instance_checks:proposal.instance_checks.length,reuse_assessment:proposal.reuse_assessment,
  levels:Object.fromEntries(Object.entries(proposal.levels).map(([k,ids])=>[k,ids.length])),direct_reasons:proposal.direct_reasons,
  exploratory_only:{equal_value_candidates:candidatesByEquality.length,distinct_master_properties:equalityGroups.size,instances_with_override_provenance:packet.nodes.filter(n=>n.type==='INSTANCE'&&Array.isArray(n.properties.overrides)).length,component_bindings:(ui.component_bindings||[]).length,warning:'These counts are neither a factorisable volume nor inherited coverage: mapping, overrides, bindings and valid qualification must still be established.'},
  conservation:{initial_assertion_ids_sha256:V.canonicalHash(assertions.map(a=>a.assertion_id).sort()),classified_assertion_ids_sha256:V.canonicalHash(Object.values(proposal.levels).flat().sort()),source_contract_unchanged:true,historical_coverage_plan_hash:prior?.contract_hash||null,proposed_coverage_plan_hash:proposal.contract_hash},
  qualification:'IMPACT_ONLY_NO_REVIEW_INVOKED',limits:['No implementation or review was run.','Historical partial-review targets are not transferred to this changed context.','No reusable implementation qualification is inferred from a component name, a token, or equal values.']});
}
function main(args=process.argv.slice(2)){
 const [revision,snapshotPath,uiPath,candidatePath,output]=args;
 if(!candidatePath)throw Error('Usage: analyze-vnext-component-reuse.js <sha40> <snapshot> <ui-contract> <candidate-manifest> [output]');
 const result=analyze({revision,snapshotPath,uiPath,candidatePath});
 if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');}
 return result;
}
if(require.main===module)try{process.stdout.write(JSON.stringify(main())+'\n');}catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
module.exports={analyze,main};
