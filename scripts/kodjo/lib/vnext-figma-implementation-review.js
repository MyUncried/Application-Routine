'use strict';
// VNext-only implementation review entry. Shared V2 workflow stays unchanged.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const V=require('./vnext-contract'),F=require('./vnext-figma-source'),Chain=require('./vnext-live-chain');
const {extractTaggedJson}=require('./plan-impact');
const digest=bytes=>require('node:crypto').createHash('sha256').update(bytes).digest('hex');
function equal(a,b,code){if(V.canonicalStringify(a)!==V.canonicalStringify(b))V.fail(code);}
function outside(cwd,dir){
 const target=path.resolve(dir);let parent=target;
 while(!fs.existsSync(parent)){const next=path.dirname(parent);if(next===parent)V.fail('VNEXT_FIGMA_REVIEW_EVIDENCE_OUTSIDE_CHECKOUT_REQUIRED');parent=next;}
 const real=path.resolve(fs.realpathSync(parent),path.relative(parent,target)),root=fs.realpathSync(cwd),rel=path.relative(root,real);
 if(!rel||(!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel)))V.fail('VNEXT_FIGMA_REVIEW_EVIDENCE_OUTSIDE_CHECKOUT_REQUIRED');
}
function actualFact(row,root){
 F.safePath(row.artifact_path);V.assertSha64(row.artifact_sha256,'VNEXT_FIGMA_REVIEW_ARTIFACT_HASH_REQUIRED');
 const file=path.resolve(root,row.artifact_path),real=fs.realpathSync(file),base=fs.realpathSync(root);
 if(!real.startsWith(base+path.sep))V.fail('VNEXT_FIGMA_REVIEW_ARTIFACT_OUTSIDE_EVIDENCE');
 const bytes=fs.readFileSync(real);if(digest(bytes)!==row.artifact_sha256)V.fail('VNEXT_FIGMA_REVIEW_ARTIFACT_CHANGED');
 // Structured execution facts are supported here. Pixel measurements need a
 // renderer-specific producer and independent reviewer; never label JSON as PNG.
 if(row.observer!=='EXECUTED_JSON_FACT'||!Array.isArray(row.value_path)||row.value_path.some(k=>typeof k!=='string'||['__proto__','constructor','prototype'].includes(k)))V.fail('VNEXT_FIGMA_REVIEW_OBSERVER_REQUIRED');
 let actual=JSON.parse(bytes.toString('utf8'));for(const k of row.value_path){if(actual===null||typeof actual!=='object'||!Object.hasOwn(actual,k))V.fail('VNEXT_FIGMA_REVIEW_FACT_MISSING');actual=actual[k];}
 equal(actual,row.value,'VNEXT_FIGMA_REVIEW_FACT_MISMATCH');return {path:real,sha256:row.artifact_sha256};
}
function prepare(planBody,{cwd,approvedPlanSha256,deliveryHead,evidenceDirectory,measurements,scenarioResults}){
 V.assertSha40(deliveryHead,'VNEXT_FIGMA_REVIEW_DELIVERY_HEAD_REQUIRED');
 V.assertSha64(approvedPlanSha256,'VNEXT_FIGMA_REVIEW_APPROVED_PLAN_REQUIRED');
 if(V.sha256(planBody)!==approvedPlanSha256)V.fail('VNEXT_FIGMA_REVIEW_PLAN_DRIFT');outside(cwd,evidenceDirectory);
 if(Chain.command('git',['rev-parse','HEAD'],cwd).trim()!==deliveryHead)V.fail('VNEXT_FIGMA_REVIEW_CHECKOUT_HEAD_MISMATCH');
 if(!Array.isArray(measurements)||!Array.isArray(scenarioResults))V.fail('VNEXT_FIGMA_REVIEW_OBSERVATIONS_REQUIRED');
 fs.mkdirSync(evidenceDirectory,{recursive:true});const assets=path.join(evidenceDirectory,'references');fs.mkdirSync(assets,{recursive:true});
 const observation=F.consume(planBody,assets,'IMPLEMENTATION_REVIEWER');
 const ui=F.unpackUi(extractTaggedJson(planBody,'KODJO_VNEXT_UI_ATOMICITY_JSON'));
 if(!ui.figma_references?.length)V.fail('VNEXT_FIGMA_REVIEW_REFERENCE_REQUIRED');
 const observedFiles=new Map();
 require('./vnext-figma-launch').validateScenarios({states:ui.figma_references.flatMap(r=>r.packet.states)});
 for(const ref of ui.figma_references){
  for(const row of measurements.filter(m=>m.reference_hash===ref.packet.contract_hash)){
   const artifact=actualFact(row,evidenceDirectory);observedFiles.set(artifact.path,artifact.sha256);
   if(row.delivery_head!==deliveryHead)V.fail('VNEXT_FIGMA_REVIEW_MEASUREMENT_HEAD_MISMATCH');
  }
  F.verifyMeasurements(ref.packet,measurements.filter(m=>m.reference_hash===ref.packet.contract_hash));
  const expected=ref.packet.states.filter(s=>s.disposition==='REQUIRED').flatMap(s=>s.scenarios||[]);
  if(ref.packet.states.some(s=>s.disposition==='REQUIRED'&&!s.scenarios?.length))V.fail('VNEXT_FIGMA_DOCUMENT_SCENARIOS_REQUIRED');
  const matches=scenarioResults.filter(s=>s.reference_hash===ref.packet.contract_hash);
  equal(matches.map(s=>s.scenario_id).sort(),expected.map(s=>s.scenario_id).sort(),'VNEXT_FIGMA_REVIEW_SCENARIO_COVERAGE_INVALID');
  for(const row of matches){
   const scenario=expected.find(s=>s.scenario_id===row.scenario_id),artifact=actualFact(row,evidenceDirectory);observedFiles.set(artifact.path,artifact.sha256);
   if(row.delivery_head!==deliveryHead||row.status!=='PASS'||row.value!==true)V.fail('VNEXT_FIGMA_REVIEW_SCENARIO_NOT_PASSED');
   equal(row.proof_results.map(p=>p.proof_type).sort(),scenario.proof_required.slice().sort(),'VNEXT_FIGMA_REVIEW_SCENARIO_PROOF_MISSING');
   if(row.proof_results.some(p=>p.status!=='PASS'))V.fail('VNEXT_FIGMA_REVIEW_SCENARIO_NOT_PASSED');
  }
 }
 if(measurements.some(m=>!ui.figma_references.some(r=>r.packet.contract_hash===m.reference_hash))||scenarioResults.some(s=>!ui.figma_references.some(r=>r.packet.contract_hash===s.reference_hash)))V.fail('VNEXT_FIGMA_REVIEW_FOREIGN_REFERENCE');
 return {schema_version:'kodjo.vnext.figma-implementation-dossier.v1',approved_plan_sha256:approvedPlanSha256,delivery_head:deliveryHead,observation,ui:F.packUi(ui),measurements,scenario_results:scenarioResults,observed_files:[...observedFiles].map(([file,sha256])=>({file,sha256})),assertion_ids:ui.criteria.flatMap(c=>c.assertions.map(a=>a.assertion_id)).sort(),scenario_ids:scenarioResults.map(s=>s.scenario_id).sort(),limits:['Execution JSON facts attest the disposable fixture only; they are not pixel or native-device compliance.','Reading resource bytes alone does not attest semantic use.']};
}
function validateAssessment(dossier,assessment){
 V.assertExactKeys(assessment,['verdict','reference_hashes','reviewed_assertion_ids','reviewed_scenario_ids','consulted_resource_sha256','findings','reservations','reason'],[],'VNEXT_FIGMA_REVIEW_ASSESSMENT_INVALID');
 if(!['APPROVE','REVISE'].includes(assessment.verdict)||!Array.isArray(assessment.findings)||!Array.isArray(assessment.reservations))V.fail('VNEXT_FIGMA_REVIEW_ASSESSMENT_INVALID');
 V.assertUnicodeExactText(assessment.reason,'VNEXT_FIGMA_REVIEW_REASON_REQUIRED');
 equal(assessment.reference_hashes.slice().sort(),dossier.observation.references.map(r=>r.reference_hash).sort(),'VNEXT_FIGMA_REVIEW_REFERENCES_UNCOVERED');
 equal(assessment.reviewed_assertion_ids.slice().sort(),dossier.assertion_ids,'VNEXT_FIGMA_REVIEW_ASSERTIONS_UNCOVERED');
 equal(assessment.reviewed_scenario_ids.slice().sort(),dossier.scenario_ids,'VNEXT_FIGMA_REVIEW_SCENARIOS_UNCOVERED');
 equal(assessment.consulted_resource_sha256.slice().sort(),dossier.observation.references.flatMap(r=>r.assets.map(a=>a.sha256)).sort(),'VNEXT_FIGMA_REVIEW_RESOURCES_UNCOVERED');
 for(const f of assessment.findings){V.assertExactKeys(f,['blocking','reason'],[],'VNEXT_FIGMA_REVIEW_FINDING_INVALID');if(typeof f.blocking!=='boolean')V.fail('VNEXT_FIGMA_REVIEW_FINDING_INVALID');V.assertUnicodeExactText(f.reason,'VNEXT_FIGMA_REVIEW_FINDING_INVALID');}
 for(const reservation of assessment.reservations)V.assertUnicodeExactText(reservation,'VNEXT_FIGMA_REVIEW_RESERVATION_INVALID');
 if(assessment.verdict==='APPROVE'&&assessment.findings.some(f=>f.blocking!==false))V.fail('VNEXT_FIGMA_REVIEW_FALSE_APPROVAL');
 return assessment;
}
function assessmentSchema(){return {type:'object',additionalProperties:false,properties:{verdict:{enum:['APPROVE','REVISE']},reference_hashes:{type:'array',items:{type:'string'}},reviewed_assertion_ids:{type:'array',items:{type:'string'}},reviewed_scenario_ids:{type:'array',items:{type:'string'}},consulted_resource_sha256:{type:'array',items:{type:'string'}},findings:{type:'array',items:{type:'object',properties:{blocking:{type:'boolean'},reason:{type:'string'}},required:['blocking','reason'],additionalProperties:false}},reservations:{type:'array',items:{type:'string'}},reason:{type:'string'}},required:['verdict','reference_hashes','reviewed_assertion_ids','reviewed_scenario_ids','consulted_resource_sha256','findings','reservations','reason']};}
function verifyReceipt(planBody,options,receipt,raw){
 V.verifyContractHash(receipt,'VNEXT_FIGMA_REVIEW_RECEIPT_HASH_INVALID');
 const dossier=prepare(planBody,options),response=JSON.parse(raw);
 if(receipt.schema_version!=='kodjo.vnext.figma-implementation-review.v1'||response.type!=='result'||response.is_error||!response.session_id||!response.structured_output)V.fail('VNEXT_FIGMA_REVIEW_PROCESS_RESULT_INVALID');
 if(receipt.approved_plan_sha256!==dossier.approved_plan_sha256||receipt.delivery_head!==dossier.delivery_head||receipt.dossier_hash!==V.canonicalHash(dossier)||receipt.raw_response_sha256!==V.sha256(raw)||receipt.session_id!==response.session_id)V.fail('VNEXT_FIGMA_REVIEW_RECEIPT_BINDING_INVALID');
 equal(receipt.assessment,response.structured_output,'VNEXT_FIGMA_REVIEW_RECEIPT_ASSESSMENT_CHANGED');
 equal(receipt.limits,dossier.limits,'VNEXT_FIGMA_REVIEW_RECEIPT_LIMITS_CHANGED');
 validateAssessment(dossier,receipt.assessment);return receipt;
}
function review(planBody,options){
 const receiptFile=path.join(options.evidenceDirectory,'implementation-review-receipt.json'),responseFile=path.join(options.evidenceDirectory,'implementation-review-response.json');
 if(fs.existsSync(receiptFile)&&fs.existsSync(responseFile))return verifyReceipt(planBody,options,JSON.parse(fs.readFileSync(receiptFile,'utf8')),fs.readFileSync(responseFile,'utf8'));
 if(fs.existsSync(receiptFile)||fs.existsSync(responseFile))V.fail('VNEXT_FIGMA_REVIEW_PREVIOUS_RESULT_UNKNOWN');
 const dossier=prepare(planBody,options),directory=options.evidenceDirectory;
 fs.writeFileSync(path.join(directory,'implementation-dossier.json'),JSON.stringify(dossier,null,2)+'\n');
 const schema=assessmentSchema();
 const input={instructions:'Independent implementation review. Read each Figma PNG and SVG asset using Read, read the property manifest and the execution facts, check every bound assertion and documentary scenario against the observed delivery. Facts are synthetic fixture observations: keep native/pixel/device limitations explicit. No inferred PASS. Return REVISE for semantic gaps, wrong scope or evidence. Do not change files or use network.',dossier};
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-figma-review-'));
 fs.writeFileSync(path.join(temp,'mcp.json'),JSON.stringify({mcpServers:{}}));fs.writeFileSync(path.join(temp,'settings.json'),JSON.stringify({disableAllHooks:true}));
 const env={...process.env};for(const k of ['GH_TOKEN','GITHUB_TOKEN','KODJO_LIVE_GH_TOKEN'])delete env[k];
 const before=Chain.command('git',['status','--porcelain','--untracked-files=all'],options.cwd)+Chain.command('git',['diff','--binary'],options.cwd);
 let raw;
 try{
  raw=(options.invoke||Chain.command)(options.claude||require('./claude-local').resolveClaudeBinary(),['-p','--restricted','--permission-mode','dontAsk','--permission-prompts','none','--output-format','json','--tools','Read,Glob,Grep','--allowedTools','Read,Glob,Grep','--disallowedTools','mcp__*','--strict-mcp-config','--mcp-config',path.join(temp,'mcp.json'),'--settings',path.join(temp,'settings.json'),'--json-schema',JSON.stringify(schema)],options.cwd,JSON.stringify(input),env,600000);
  fs.writeFileSync(path.join(directory,'implementation-review-response.json'),raw);
  const response=JSON.parse(raw);if(response.type!=='result'||response.is_error||!response.session_id||!response.structured_output)V.fail('VNEXT_FIGMA_REVIEW_PROCESS_RESULT_INVALID');
  const assessment=validateAssessment(dossier,response.structured_output);
  for(const ref of dossier.observation.references)for(const a of ref.assets)if(digest(fs.readFileSync(a.path))!==a.sha256)V.fail('VNEXT_FIGMA_REVIEW_RESOURCE_CHANGED');
  for(const a of dossier.observed_files)if(digest(fs.readFileSync(a.file))!==a.sha256)V.fail('VNEXT_FIGMA_REVIEW_ARTIFACT_CHANGED');
  const receipt=V.sealContract({schema_version:'kodjo.vnext.figma-implementation-review.v1',approved_plan_sha256:dossier.approved_plan_sha256,delivery_head:dossier.delivery_head,dossier_hash:V.canonicalHash(dossier),session_id:response.session_id,raw_response_sha256:V.sha256(raw),assessment,limits:dossier.limits});
  fs.writeFileSync(path.join(directory,'implementation-review-receipt.json'),JSON.stringify(receipt,null,2)+'\n');return receipt;
 }finally{
  fs.rmSync(temp,{recursive:true,force:true});
  const after=Chain.command('git',['status','--porcelain','--untracked-files=all'],options.cwd)+Chain.command('git',['diff','--binary'],options.cwd);
  if(before!==after)V.fail('VNEXT_FIGMA_REVIEW_CHECKOUT_CHANGED');
 }
}
module.exports={prepare,review,validateAssessment,actualFact,assessmentSchema,verifyReceipt};
