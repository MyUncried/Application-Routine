#!/usr/bin/env node
'use strict';
// Emits the deterministic full-source reference requested by the audit mission.
// No Claude invocation, approval, browser, product delivery or external write.
const fs=require('node:fs'),path=require('node:path'),V=require('./lib/vnext-contract'),D=require('./qualify-vnext-figma-real-path'),C=require('./lib/vnext-disposable-functional-contract'),Review=require('./lib/vnext-figma-implementation-review');
async function main(output){
 const dir=path.resolve(output),rel=path.relative(process.cwd(),dir);if(!rel||(!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel)))throw Error('VNEXT_REFERENCE_EXTERNAL_DIRECTORY_REQUIRED');
 if(fs.existsSync(dir)&&fs.readdirSync(dir).length)throw Error('VNEXT_REFERENCE_ALREADY_EXISTS');
 const file='.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/frozen-source.json',bytes=fs.readFileSync(file),original=JSON.parse(bytes),cleanup=[];
 try{
  const {f,plan,keepHash}=await require('../../tests/kodjo/helpers/vnext-functional-reference').prepare({after:fn=>cleanup.push(fn)},{frozenSource:original,output:dir});
  const receipt=D.runDeliveredTests(f,keepHash,path.join(dir,'functional-test.json'));f.git('add',C.SCREEN,C.TEST);f.git('commit','-m','Deterministic full-source reference; no model');
  fs.writeFileSync(path.join(dir,'approved-plan.md'),plan,{flag:'wx'});
  const options=D.compare(f,f.snapshot,plan,path.join(dir,'review'),receipt),dossier=Review.prepare(plan,options);
  fs.writeFileSync(path.join(dir,'implementation-dossier.json'),JSON.stringify(dossier,null,2)+'\n',{flag:'wx'});
  D.preserveFixture(f,dir);
  const source=f.snapshot;
  const result={status:'DETERMINISTIC_REFERENCE_PASS_NOT_MODEL_APPROVAL',frozen_source_sha256:V.sha256(bytes),reference_hash:f.snapshot.contract_hash,plan_sha256:V.sha256(plan),node_test_status:receipt.status,scenario_ids:dossier.scenario_ids,preservation_ids:dossier.preservation_ids,measurements:dossier.measurements.length,figma_nodes:source.nodes.length,figma_dispositions:source.decisions.length,real_model_calls:0,visual_validation:'NOT_APPLICABLE_FOR_PROTOCOL_TEST'};
  fs.writeFileSync(path.join(dir,'reference-result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});return result;
 }finally{for(const fn of cleanup.reverse())fn();}
}
if(require.main===module)main(process.argv[2]).then(x=>process.stdout.write(JSON.stringify(x)+'\n')).catch(e=>{process.stderr.write(e.message+'\n');process.exitCode=1;});
module.exports={main};
