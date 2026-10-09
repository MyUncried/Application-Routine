'use strict';
// Same PRE-3 objects; a proposal is not an authorization or a reviewed plan.
const fs=require('node:fs'),path=require('node:path');
const [producedFile,receiptFile,out,protocolRoot]=process.argv.slice(2);
if(![producedFile,receiptFile,out,protocolRoot].every(x=>x&&path.isAbsolute(x)))throw Error('Usage: absolute produced receipt new-output-directory qualified-protocol-checkout');
if(fs.existsSync(out))throw Error('Output already exists; no duplicate preparation');
fs.mkdirSync(out,{recursive:true});
const lib=n=>require(path.join(protocolRoot,'scripts/kodjo/lib',n));
const B=lib('vnext-file-bundle'),V=lib('vnext-contract'),R=lib('revision-contract'),S=lib('vnext-review-scope'),Chain=lib('vnext-live-chain');
const progress=stage=>{fs.writeFileSync(path.join(out,'scope-preparation-progress.json'),JSON.stringify({operation:340,stage,at:new Date().toISOString()})+'\n');console.log(stage);};
progress('READING_EXACT_INITIAL_OBJECTS');
const produced=B.read(producedFile),receipt=B.read(receiptFile);
if(produced.contract_hash!=='603de045f94fec3f14aa2198edaaad0b91020b79adddb19041b06314cc725e16'||receipt.contract_hash!=='56568e7ae81d44c60cb5185d0b69f3099fb64650953804dbf322e478d3845ce9')throw Error('Exact original PRE-3 objects required');
progress('VERIFYING_ORIGINAL_RECEIPT');const report=Chain.verifyReceipt(produced,receipt),a=produced.artifacts;
progress('BUILDING_CAUSAL_TARGET_PROPOSAL');const graph=R.buildArtifactGraph(a);
const docReqs=new Set(a.requirementRegistry.requirements.filter(q=>q.unit_id==='UNIT-d27f377c24336720e09fd06b').map(q=>q.requirement_id));
if(docReqs.size!==95)throw Error('Expected 95 original documentary requirements');
const docTargets=new Set(docReqs),visualContextReqs=new Set();
for(const item of a.planContract.plan_items)if(docReqs.has(item.requirement_id)){docTargets.add(item.plan_item_id);for(const t of item.test_obligations)docTargets.add(t.test_id);for(const p of item.proof_obligations)docTargets.add(p.proof_id);}
for(const c of a.uiAtomicityContract.criteria){
 if(docReqs.has(c.requirement_id))docTargets.add(c.criterion_id);
 // Candidate context is deliberately broader than a definitive visual waiver.
 // The independent reviewer must separate observable rendering from metadata.
 if(c.assertions.some(s=>/\.(vectorPaths|blendMode|strokeJoin|strokeAlign|strokeCap|dashPattern)$/.test(s.subject)))visualContextReqs.add(c.requirement_id);
}
const modifiedImpacts=new Set(a.impactGraph.impacts.filter(i=>i.change_kind==='MODIFY').map(i=>i.impact_id));
const candidates=[];
for(const f of report.findings.filter(f=>f.blocking)){
 let proposed=docTargets,reason='Identifier les dépendances documentaires réellement nécessaires au correctif demandé, sans ouvrir les objets non concernés.';
 if(f.finding_id==='FND-45a23a9dc1c196e22ec192fd'){proposed=docReqs;reason='Le constat demande le typage réel des exigences documentaires existantes ; le reçu en préserve 91 sur 95. Identifier les exigences à modifier précisément.';}
 if(f.finding_id==='FND-6bcfecf4fd3ab1c1e7461630'){proposed=visualContextReqs;reason='Identifier les exigences regroupant des propriétés de contexte interne non observables ; conserver les assertions sur le rendu effectivement observable. Aucune exemption globale vectorielle.';}
 if(f.finding_id==='FND-aa97db96722333411e8d8c28'){proposed=modifiedImpacts;reason='Identifier les impacts dont les obligations de conservation doivent être complétées ; conserver les contrats PRE-1/PRE-2 et les consommateurs hors périmètre.';}
 const target_ids=[...proposed].filter(id=>id!==f.target_id&&!f.dependency_target_ids.includes(id));
 if(target_ids.length)candidates.push({finding_id:f.finding_id,target_ids,reason});
}
const request=S.buildRequest({reviewContext:a.reviewContext,reviewReport:report,artifactGraph:graph,candidates});S.validateRequest(request);
const requestFile=path.join(out,'scope-request.json');B.write(requestFile,request,{exclusive:true,pretty:true});
const config={produced_file:producedFile,review_receipt_file:receiptFile,scope_request_file:requestFile,evidence_directory:path.join(out,'claude-scope')};
fs.writeFileSync(path.join(out,'scope-review-config.json'),JSON.stringify(config,null,2)+'\n',{flag:'wx'});
const summary={operation:340,status:'SCOPE_PROPOSAL_READY_NOT_AUTHORIZED',original_produced_hash:produced.contract_hash,original_receipt_hash:receipt.contract_hash,original_report_hash:report.contract_hash,request_hash:request.contract_hash,requests:request.requests.map(r=>({finding_id:r.finding_id,candidate_targets:r.targets.length})),candidate_target_total:request.requests.reduce((n,r)=>n+r.targets.length,0),unique_candidate_targets:new Set(request.requests.flatMap(r=>r.targets.map(t=>t.target_id))).size,original_objects_unchanged:true,independent_review:false,owner_plan_approval:false,implementation_started:false};
fs.writeFileSync(path.join(out,'scope-preparation-result.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
progress('READY_FOR_INDEPENDENT_SCOPE_SUPPLEMENT');console.log(JSON.stringify(summary));
