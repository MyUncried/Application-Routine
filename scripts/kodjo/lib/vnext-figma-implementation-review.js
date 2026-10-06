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
function functionalPreservation(row,cwd,root){
 const C=require('./vnext-disposable-functional-contract'),payload=JSON.parse(fs.readFileSync(path.join(root,row.artifact_path),'utf8'));
 if(payload.contract_id!==C.ID)return [];
 const receipt=payload.node_test_receipt;
 if(!receipt)V.fail('VNEXT_FUNCTIONAL_GATE_RECEIPT_REQUIRED');
 if(receipt.contract_id!==C.ID||receipt.status!=='PASS'||receipt.exit_code!==0||receipt.test_path!==C.TEST)V.fail('VNEXT_FUNCTIONAL_GATE_RECEIPT_INVALID');
 for(const file of [C.SCREEN,C.TEST,C.KEEP])if(receipt.source_sha256?.[file]!==digest(fs.readFileSync(path.join(cwd,file))))V.fail('VNEXT_FUNCTIONAL_GATE_RECEIPT_SOURCE_DRIFT');
 if(receipt.preservation_probe?.status!=='PASS'||receipt.preservation_probe.independent_child_process!==true)V.fail('VNEXT_FUNCTIONAL_PRESERVATION_NOT_PASSED');
 return ['normal_identity','sentinel_identity'].map(key=>{
  const proof={...row,preservation_id:'Existing.'+key,value:true,value_path:['node_test_receipt','preservation_probe',key]};
  actualFact(proof,root);return proof;
 });
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
 const preservationResults=new Map();
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
   for(const proof of functionalPreservation(row,cwd,evidenceDirectory)){
    if(preservationResults.has(proof.preservation_id)&&preservationResults.get(proof.preservation_id).artifact_sha256!==proof.artifact_sha256)V.fail('VNEXT_FUNCTIONAL_PRESERVATION_ARTIFACT_CONTRADICTION');
    preservationResults.set(proof.preservation_id,proof);
   }
   equal(row.proof_results.map(p=>p.proof_type).sort(),scenario.proof_required.slice().sort(),'VNEXT_FIGMA_REVIEW_SCENARIO_PROOF_MISSING');
   if(row.proof_results.some(p=>p.status!=='PASS'))V.fail('VNEXT_FIGMA_REVIEW_SCENARIO_NOT_PASSED');
  }
 }
 if(measurements.some(m=>!ui.figma_references.some(r=>r.packet.contract_hash===m.reference_hash))||scenarioResults.some(s=>!ui.figma_references.some(r=>r.packet.contract_hash===s.reference_hash)))V.fail('VNEXT_FIGMA_REVIEW_FOREIGN_REFERENCE');
 return {schema_version:'kodjo.vnext.figma-implementation-dossier.v1',approved_plan_sha256:approvedPlanSha256,delivery_head:deliveryHead,observation,ui:F.packUi(ui),measurements,scenario_results:scenarioResults,preservation_results:[...preservationResults.values()],preservation_ids:[...preservationResults.keys()].sort(),observed_files:[...observedFiles].map(([file,sha256])=>({file,sha256})),assertion_ids:ui.criteria.flatMap(c=>c.assertions.map(a=>a.assertion_id)).sort(),scenario_ids:scenarioResults.map(s=>s.scenario_id).sort(),limits:['Execution JSON facts attest the disposable fixture only; they are not pixel or native-device compliance.','Reading resource bytes alone does not attest semantic use.']};
}
function validateAssessment(dossier,assessment){
 V.assertExactKeys(assessment,['verdict','reference_hashes','reviewed_assertion_ids','reviewed_scenario_ids','findings','reservations','reason'],['reviewed_preservation_ids','consulted_resource_sha256'],'VNEXT_FIGMA_REVIEW_ASSESSMENT_INVALID');
 if(!['APPROVE','REVISE'].includes(assessment.verdict)||!Array.isArray(assessment.findings)||!Array.isArray(assessment.reservations))V.fail('VNEXT_FIGMA_REVIEW_ASSESSMENT_INVALID');
 V.assertUnicodeExactText(assessment.reason,'VNEXT_FIGMA_REVIEW_REASON_REQUIRED');
 equal(assessment.reference_hashes.slice().sort(),dossier.observation.references.map(r=>r.reference_hash).sort(),'VNEXT_FIGMA_REVIEW_REFERENCES_UNCOVERED');
 equal(assessment.reviewed_assertion_ids.slice().sort(),dossier.assertion_ids,'VNEXT_FIGMA_REVIEW_ASSERTIONS_UNCOVERED');
 equal(assessment.reviewed_scenario_ids.slice().sort(),dossier.scenario_ids,'VNEXT_FIGMA_REVIEW_SCENARIOS_UNCOVERED');
 if(dossier.preservation_ids?.length||assessment.reviewed_preservation_ids)equal((assessment.reviewed_preservation_ids||[]).slice().sort(),dossier.preservation_ids||[],'VNEXT_FIGMA_REVIEW_PRESERVATION_UNCOVERED');
 // Legacy declarations remain readable, but are not evidence of file integrity
 // or tool use and never determine approval. Orchestration checks actual bytes.
 for(const f of assessment.findings){V.assertExactKeys(f,['blocking','reason'],[],'VNEXT_FIGMA_REVIEW_FINDING_INVALID');if(typeof f.blocking!=='boolean')V.fail('VNEXT_FIGMA_REVIEW_FINDING_INVALID');V.assertUnicodeExactText(f.reason,'VNEXT_FIGMA_REVIEW_FINDING_INVALID');}
 for(const reservation of assessment.reservations)V.assertUnicodeExactText(reservation,'VNEXT_FIGMA_REVIEW_RESERVATION_INVALID');
 if(assessment.verdict==='APPROVE'&&assessment.findings.some(f=>f.blocking!==false))V.fail('VNEXT_FIGMA_REVIEW_FALSE_APPROVAL');
 return assessment;
}
function assessmentSchema(){return {type:'object',additionalProperties:false,properties:{verdict:{enum:['APPROVE','REVISE']},reference_hashes:{type:'array',items:{type:'string'}},reviewed_assertion_ids:{type:'array',items:{type:'string'}},reviewed_scenario_ids:{type:'array',items:{type:'string'}},reviewed_preservation_ids:{type:'array',items:{type:'string'}},findings:{type:'array',items:{type:'object',properties:{blocking:{type:'boolean'},reason:{type:'string'}},required:['blocking','reason'],additionalProperties:false}},reservations:{type:'array',items:{type:'string'}},reason:{type:'string'}},required:['verdict','reference_hashes','reviewed_assertion_ids','reviewed_scenario_ids','findings','reservations','reason']};}
function resourceIntegrity(dossier){
 const resources=dossier.observation.references.flatMap(ref=>ref.assets.map(asset=>{
  const actual=digest(fs.readFileSync(asset.path));
  if(actual!==asset.sha256)V.fail('VNEXT_FIGMA_REVIEW_RESOURCE_CHANGED');
  return {resource_id:asset.resource_id,expected_sha256:asset.sha256,actual_sha256:actual};
 }));
 return {producer:'ORCHESTRATION',status:'PASS',reading_attested:false,resources};
}
function verifyReceipt(planBody,options,receipt,raw){
 V.verifyContractHash(receipt,'VNEXT_FIGMA_REVIEW_RECEIPT_HASH_INVALID');
 const dossier=prepare(planBody,options),response=JSON.parse(raw);
 if(receipt.schema_version!=='kodjo.vnext.figma-implementation-review.v1'||response.type!=='result'||response.is_error||!response.session_id||!response.structured_output)V.fail('VNEXT_FIGMA_REVIEW_PROCESS_RESULT_INVALID');
 if(receipt.approved_plan_sha256!==dossier.approved_plan_sha256||receipt.delivery_head!==dossier.delivery_head||receipt.dossier_hash!==V.canonicalHash(dossier)||receipt.raw_response_sha256!==V.sha256(raw)||receipt.session_id!==response.session_id)V.fail('VNEXT_FIGMA_REVIEW_RECEIPT_BINDING_INVALID');
 equal(receipt.assessment,response.structured_output,'VNEXT_FIGMA_REVIEW_RECEIPT_ASSESSMENT_CHANGED');
 equal(receipt.limits,dossier.limits,'VNEXT_FIGMA_REVIEW_RECEIPT_LIMITS_CHANGED');
 const integrity=resourceIntegrity(dossier);
 if(receipt.resource_integrity)equal(receipt.resource_integrity,integrity,'VNEXT_FIGMA_REVIEW_RECEIPT_BINDING_INVALID');
 validateAssessment(dossier,receipt.assessment);return receipt;
}
function review(planBody,options){
 const receiptFile=path.join(options.evidenceDirectory,'implementation-review-receipt.json'),responseFile=path.join(options.evidenceDirectory,'implementation-review-response.json');
 if(fs.existsSync(receiptFile)&&fs.existsSync(responseFile))return verifyReceipt(planBody,options,JSON.parse(fs.readFileSync(receiptFile,'utf8')),fs.readFileSync(responseFile,'utf8'));
 if(fs.existsSync(receiptFile)||fs.existsSync(responseFile))V.fail('VNEXT_FIGMA_REVIEW_PREVIOUS_RESULT_UNKNOWN');
 const dossier=prepare(planBody,options),directory=options.evidenceDirectory;
 resourceIntegrity(dossier);
 fs.writeFileSync(path.join(directory,'implementation-dossier.json'),JSON.stringify(dossier,null,2)+'\n');
 const schema=assessmentSchema();
const input={instructions:'Independent implementation review. Read the referenced source context, property manifest and execution artifacts, check every bound assertion and documentary scenario against the observed delivery. Orchestration constructs the resource inventory and verifies actual file SHA-256 bytes before and after review; do not compute or report consulted-resource hashes. This mechanical integrity check does not attest which files you read. Distinguish actual execution facts on a disposable fixture from injected unit-test observations; neither proves product appearance or native-device compliance. For the functional-only protocol benchmark, no browser, automatic rendering or human visual gate is required or authorized. Do not invent such obligations. Read every preservation_results fact and cover every preservation_id in reviewed_preservation_ids when present; these are the existing shared-export preservation obligations. No inferred PASS. Return REVISE for semantic gaps, wrong scope or evidence. Do not change files or use network.',dossier};
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-figma-review-'));
 fs.writeFileSync(path.join(temp,'mcp.json'),JSON.stringify({mcpServers:{}}));fs.writeFileSync(path.join(temp,'settings.json'),JSON.stringify({disableAllHooks:true}));
 const env={...process.env};for(const k of ['GH_TOKEN','GITHUB_TOKEN','KODJO_LIVE_GH_TOKEN'])delete env[k];
 const before=Chain.command('git',['status','--porcelain','--untracked-files=all'],options.cwd)+Chain.command('git',['diff','--binary'],options.cwd);
 let raw;
 try{
  raw=(options.invoke||Chain.command)(options.claude||require('./claude-local').resolveClaudeBinary(),['--add-dir',directory,'-p','--restricted','--permission-mode','dontAsk','--permission-prompts','none','--output-format','json','--tools','Read,Glob,Grep','--allowedTools','Read,Glob,Grep','--disallowedTools','mcp__*','--strict-mcp-config','--mcp-config',path.join(temp,'mcp.json'),'--settings',path.join(temp,'settings.json'),'--json-schema',JSON.stringify(schema)],options.cwd,JSON.stringify(input),env,Chain.CLAUDE_TIMEOUT_MS);
  fs.writeFileSync(path.join(directory,'implementation-review-response.json'),raw);
  const response=JSON.parse(raw);if(response.type!=='result'||response.is_error||!response.session_id||!response.structured_output)V.fail('VNEXT_FIGMA_REVIEW_PROCESS_RESULT_INVALID');
  const assessment=validateAssessment(dossier,response.structured_output);
  const resource_integrity=resourceIntegrity(dossier);
  for(const a of dossier.observed_files)if(digest(fs.readFileSync(a.file))!==a.sha256)V.fail('VNEXT_FIGMA_REVIEW_ARTIFACT_CHANGED');
  const receipt=V.sealContract({schema_version:'kodjo.vnext.figma-implementation-review.v1',approved_plan_sha256:dossier.approved_plan_sha256,delivery_head:dossier.delivery_head,dossier_hash:V.canonicalHash(dossier),session_id:response.session_id,raw_response_sha256:V.sha256(raw),assessment,resource_integrity,limits:dossier.limits});
  fs.writeFileSync(path.join(directory,'implementation-review-receipt.json'),JSON.stringify(receipt,null,2)+'\n');return receipt;
 }finally{
  fs.rmSync(temp,{recursive:true,force:true});
  const after=Chain.command('git',['status','--porcelain','--untracked-files=all'],options.cwd)+Chain.command('git',['diff','--binary'],options.cwd);
  if(before!==after)V.fail('VNEXT_FIGMA_REVIEW_CHECKOUT_CHANGED');
 }
}
module.exports={prepare,review,validateAssessment,actualFact,assessmentSchema,verifyReceipt};
