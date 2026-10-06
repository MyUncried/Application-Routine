'use strict';
// Deterministic reference only: real Git/Node, no model verdict.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const D=require('../../../scripts/kodjo/qualify-vnext-figma-real-path'),C=require('../../../scripts/kodjo/lib/vnext-disposable-functional-contract'),Chain=require('../../../scripts/kodjo/lib/vnext-live-chain'),Recipe=require('../../../scripts/kodjo/lib/vnext-figma-recipe'),Adapter=require('../../../scripts/kodjo/lib/vnext-legacy-queue-adapter'),V=require('../../../scripts/kodjo/lib/vnext-contract'),Fixture=require('./vnext-figma-fixture');
const reference="const {Existing}=require('../../shared/ui/Existing');let selected=false;module.exports={Existing,toggle(){return selected=!selected;}};\n";
async function prepare(t,{frozenSource,output}={}){
 const f=Fixture.fixture({launchMode:true,documentContent:D.DOCUMENT,documentaryStates:D.DOCUMENTARY_STATES,transformPacket:p=>D.scopedPacket(frozenSource||p,p.documents[0])});t.after(f.cleanup);
 const out=output||fs.mkdtempSync(path.join(os.tmpdir(),'vnext-coherence-'));if(output)fs.mkdirSync(out,{recursive:true});else t.after(()=>fs.rmSync(out,{recursive:true,force:true}));
 const scope={slice_id:f.recipe.planningInput.slice_id,launch_id:'REFERENCE-NO-MODEL',file_key:f.snapshot.file_key,frames:f.snapshot.frames,documents:f.snapshot.documents};
 const produced=await Chain.launchAndProduce(scope,{cwd:f.cwd,capture:s=>D.capture(f.snapshot,s),reconcile:(raw,documents)=>({...raw,documents,states:f.snapshot.states,decisions:f.snapshot.decisions,conflicts:[]}),persist:()=>({revision:f.head,path:f.packetPath,content:Chain.readGit(f.cwd,f.head,f.packetPath)}),buildRecipe:c=>Recipe.build(f.cwd,c,{applicationPath:C.SCREEN,testPath:C.TEST,componentPath:C.KEEP,componentBinding:D.BINDING,qualificationContract:D.QUALIFICATION_CONTRACT,scenarioPropertyType:'STATE',observationIntent:'Reference probe: functional only; no visual gate.',issueId:'github_issue:MyUncried/Application-Routine#269',intent:'Reference fixture implements documentary toggle transitions; MODIFY existing Screen and preserve Existing.',executionContext:{mode:'LOCAL',writer_id:'CLAUDE:figma-disposable'}})});
 Chain.verifyProduced(produced,f.cwd);const a=produced.artifacts,plan=Adapter.renderCompatibilityPlan({application_head:a.planningEnvelope.application_head,plan_contract_hash:a.planContract.contract_hash},a.planContract,a.uiAtomicityContract,a.requirementRegistry,a.candidateManifest);
 f.write(C.SCREEN,reference);
 const delivered=`const assert=require('node:assert/strict'),cp=require('node:child_process');\nconst transition=JSON.parse(cp.execFileSync(process.execPath,['-e',${JSON.stringify('process.stdout.write(JSON.stringify(('+C.transitions.toString()+')(require("node:path").resolve('+JSON.stringify(C.SCREEN)+'))));')}],{encoding:'utf8'}));assert.deepEqual(transition.returned_values,[true,false]);\ncp.execFileSync(process.execPath,['-e',${JSON.stringify('('+C.preservation.toString()+')(require("node:path").resolve('+JSON.stringify(C.SCREEN)+'),require("node:path").resolve('+JSON.stringify(C.KEEP)+'));')}]);\n`;
 f.write(C.TEST,delivered);const keepHash=V.sha256(fs.readFileSync(path.join(f.cwd,C.KEEP)));return {f,out,plan,produced,keepHash};
}
module.exports={prepare};

