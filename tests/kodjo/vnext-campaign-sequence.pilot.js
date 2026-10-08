
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {parse}=require('../../scripts/kodjo/lib/yaml'),Q=require('../../scripts/kodjo/lib/vnext-github-qualification');
const workflow=name=>parse(fs.readFileSync(path.join(__dirname,'../../.github/workflows',name),'utf8'));
function condition(expression,needs){return Function('needs','always', 'return ('+expression.replace(/needs\.([a-z-]+)\./g,(_,key)=>'needs['+JSON.stringify(key)+'].')+');')(needs,()=>true);}
test('runtime history waits for a successful selected Claude job and never runs after refusal or cancellation',()=>{
 const w=workflow('kodjo-vnext12-disposable.yml'),jobs=w.jobs;
 assert.deepEqual(jobs['figma-initial'].needs,['select-stage','admission-controls']);assert.deepEqual(jobs['execute-initial'].needs,['select-stage','admission-controls']);
 const gate=jobs['historical-equivalence'];assert.deepEqual(gate.needs,['select-stage','figma-initial','execute-initial']);
 for(const result of ['failure','cancelled','skipped'])assert.equal(condition(gate.if,{'select-stage':{result:'success',outputs:{stage:'TARGETED_RESULT_RECORDED'}},'figma-initial':{result},'execute-initial':{result:'skipped'}}),false);
 assert.equal(condition(gate.if,{'select-stage':{result:'success',outputs:{stage:'TARGETED_RESULT_RECORDED'}},'figma-initial':{result:'success'},'execute-initial':{result:'skipped'}}),true);
 assert.equal(condition(gate.if,{'select-stage':{result:'success',outputs:{stage:'CERTIFY_HISTORICAL'}},'figma-initial':{result:'skipped'},'execute-initial':{result:'skipped'}}),true);
 assert.equal(condition(gate.if,{'select-stage':{result:'failure',outputs:{stage:'CERTIFY_HISTORICAL'}},'figma-initial':{result:'success'},'execute-initial':{result:'skipped'}}),false);
 assert.equal(jobs['historical-platform-coverage'].needs,'historical-equivalence');assert.equal(condition(jobs['historical-platform-coverage'].if,{'historical-equivalence':{result:'success'}}),true);assert.equal(condition(jobs['historical-platform-coverage'].if,{'historical-equivalence':{result:'skipped'}}),false);
 assert.equal(jobs['historical-local-windows'].needs,'historical-platform-coverage');assert.equal(condition(jobs['historical-local-windows'].if,{'historical-platform-coverage':{result:'success'}}),true);assert.equal(condition(jobs['historical-local-windows'].if,{'historical-platform-coverage':{result:'skipped'}}),false);assert.equal(jobs['historical-local-windows'].with.sequenced_vnext,true);assert.equal(jobs['historical-local-windows'].uses,'./.github/workflows/kodjo-vnext-historical-checks.yml');
});
test('automatic admission does not claim full validation before historical jobs',()=>{
 const head='a'.repeat(40),repository='MyUncried/Application-Routine';
 const run={id:42,repository:{full_name:repository},head_sha:head,path:Q.WORKFLOW,event:'create',head_branch:'qualification/vnext-sequence',status:'completed',conclusion:'success',run_attempt:1};
 const jobs=Q.JOBS.slice(0,2).map((name,i)=>({id:i+1,name,head_sha:head,status:'completed',conclusion:'success'}));const read=e=>e.endsWith('/42')?run:{jobs};
 assert.equal(Q.verifyQualification({repository,head,runId:42,read,controlsOnly:true}).qualification_scope,'AUTOMATIC_CONTROLS_ONLY');
 assert.throws(()=>Q.verifyQualification({repository,head,runId:42,read}),/JOB_NOT_VERIFIED/);
 for(const conclusion of ['failure','skipped','cancelled'])assert.throws(()=>Q.verifyQualification({repository,head,runId:42,controlsOnly:true,read:e=>e.endsWith('/42')?run:{jobs:jobs.map((j,i)=>i?j:{...j,conclusion})}}),/JOB_NOT_VERIFIED/);
});
test('historical V2 preflight is reusable after Claude while independent VNext PR repeats are skipped',()=>{
 const legacy=workflow('kodjo-v2-pilot-tests.yml'),proof=workflow('kodjo-vnext-proof-stability.yml');
 assert.equal(legacy.on.workflow_call.inputs.sequenced_vnext.default,false);
 assert.match(legacy.jobs.protocol.if,/inputs.sequenced_vnext == true/);assert.match(legacy.jobs.protocol.if,/protocol\/vnext-proof-stability-20260930/);
 assert.equal(legacy.jobs.protocol.steps.find(s=>s.name==='Run complete KODJO pilot suite').if,'inputs.sequenced_vnext != true');
 assert.match(proof.jobs.qualification.if,/github.head_ref != 'protocol\/vnext-proof-stability-20260930'/);
 assert.match(proof.jobs['historical-equivalence'].if,/github.event_name != 'create'/);
});
test('event routing reuses VNext admission and preserves unrelated legacy events',()=>{
 const proof=workflow('kodjo-vnext-proof-stability.yml'),legacy=workflow('kodjo-v2-pilot-tests.yml');
 const evaluate=(expression,github,inputs={})=>Function('github','inputs','needs','startsWith','return ('+expression+');')(github,inputs,{classify:{outputs:{full_required:'true'}},protocol:{outputs:{full_windows_required:'true'}}},(a,b)=>String(a||'').startsWith(b));
 const campaign={event_name:'pull_request',head_ref:'protocol/vnext-proof-stability-20260930',event:{}};
 assert.equal(evaluate(proof.jobs.qualification.if,campaign),false);assert.equal(evaluate(proof.jobs['historical-equivalence'].if,campaign),false);assert.equal(evaluate(legacy.jobs.protocol.if,campaign),false);
 assert.equal(evaluate(legacy.jobs.protocol.if,campaign,{sequenced_vnext:true}),true);
 const candidate={event_name:'create',head_ref:'',event:{ref_type:'branch',ref:'qualification/vnext-sequence'}};
 assert.equal(evaluate(proof.jobs.qualification.if,candidate),true);assert.equal(evaluate(proof.jobs['historical-equivalence'].if,candidate),false);
 const unrelated={event_name:'pull_request',head_ref:'feature/other',event:{}};
 assert.equal(evaluate(proof.jobs.qualification.if,unrelated),true);assert.equal(evaluate(proof.jobs['historical-equivalence'].if,unrelated),true);assert.equal(evaluate(legacy.jobs.protocol.if,unrelated),true);
});

test('read-only historical callee preserves exact legacy checks and excludes its privileged disposable job',()=>{
 const legacy=workflow('kodjo-v2-pilot-tests.yml'),callee=workflow('kodjo-vnext-historical-checks.yml');
 assert.deepEqual(Object.keys(callee.jobs),['classify','protocol','protocol-windows-preflight']);
 assert.deepEqual(callee.permissions,{contents:'read',actions:'read','pull-requests':'read'});
 const legacyCertification=legacy.jobs['protocol-windows-preflight'].steps.find(s=>s.name==='Certify historical run 16 recovery without gating the disposable slice');
 const certification=callee.jobs['protocol-windows-preflight'].steps.find(s=>s.name==='Certify present historical run 16 recovery package');
 assert.equal(certification['continue-on-error'],undefined);assert.equal(legacyCertification['continue-on-error'],true);
 assert.deepEqual({...certification,name:legacyCertification.name,'continue-on-error':true},legacyCertification);
 // Only the proven IA-F09 diagnostic difference is exempted from byte-equivalent checks.
 const steps=callee.jobs['protocol-windows-preflight'].steps;
 steps[steps.indexOf(certification)]={...legacyCertification};
 const proof=steps.find(s=>s.name==='Preserve real recovery certification'),oldProof=legacy.jobs['protocol-windows-preflight'].steps.find(s=>s.name===proof.name);
 assert.match(proof.run,/HISTORICAL_RECOVERY_CERTIFICATION_FAILED/);assert.match(proof.run,/HISTORICAL_RECOVERY_ARTIFACT_UNAVAILABLE/);
 steps[steps.indexOf(proof)]={...oldProof};
 for(const name of Object.keys(callee.jobs))assert.deepEqual(callee.jobs[name],legacy.jobs[name]);
});
test('independent workflow parser rejects nested write permissions even for a skipped callee job',t=>{
 const {execFileSync}=require('child_process'),os=require('os');const root=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-reusable-permissions-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const dir=path.join(root,'.github/workflows');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'caller.yml'),'permissions: {contents: read}\njobs:\n  history:\n    uses: ./.github/workflows/callee.yml\n');
 const callee=level=>'permissions: {contents: read}\njobs:\n  unused:\n    if: false\n    permissions: {contents: '+level+'}\n    runs-on: ubuntu-latest\n    steps: []\n';
 const run=()=>execFileSync(process.env.KODJO_PYTHON||'python',[path.join(__dirname,'../../scripts/kodjo/validate-workflow-syntax.py'),root],{encoding:'utf8',stdio:'pipe'});
 fs.writeFileSync(path.join(dir,'callee.yml'),callee('write'));assert.throws(run,e=>String(e.stderr).includes('REUSABLE_PERMISSION_ESCALATION'));
 fs.writeFileSync(path.join(dir,'callee.yml'),callee('read'));assert.match(run(),/workflows accepted/);
});

test('native syntax preparation expands GitHub templates while preserving PowerShell interpolation and invalid code',()=>{
 const {renderGithubExpressionsForSyntax:render}=require('../../scripts/kodjo/lib/vnext-publication');
 assert.equal(render('$run="${{ github.run_id }}"; $local="${name}"; $bad = {'),'$run="VNEXT_GITHUB_EXPRESSION"; $local="${name}"; $bad = {');
 assert.equal(render("$name='${{ github.repository }}'\nif($x){Write-Output $x}"),"$name='VNEXT_GITHUB_EXPRESSION'\nif($x){Write-Output $x}");
 assert.equal(render('$bad = "${{ incomplete"'),'$bad = "${{ incomplete"');
});

test('stabilization audit is read-only, waits for both automatic platforms, and launches no runtime or history',()=>{
 const proof=workflow('kodjo-vnext-proof-stability.yml'),audit=proof.jobs['architecture-audit'];
 const evaluate=(expression,github)=>Function('github','startsWith','return ('+expression+');')(github,(a,b)=>String(a||'').startsWith(b));
 const event={event_name:'create',run_attempt:1,event:{ref_type:'branch',ref:'qualification/vnext-stabilization-audit-REFERENCE'}};
 assert.equal(evaluate(proof.jobs.qualification.if,event),true);assert.equal(audit.needs,'qualification');assert.equal(evaluate(audit.if,event),true);
 assert.equal(evaluate(audit.if,{...event,run_attempt:2}),false);assert.equal(evaluate(audit.if,{...event,event:{...event.event,ref:'qualification/vnext-normal'}}),false);
 assert.equal(evaluate(proof.jobs['historical-equivalence'].if,event),false);assert.equal(evaluate(proof.jobs['historical-platform-coverage'].if,event),false);
 const disposable=workflow('kodjo-vnext12-disposable.yml');assert.equal(Object.hasOwn(disposable.on,'create'),false);
 assert.ok(audit['timeout-minutes']>=120);assert.equal(proof.permissions.contents,'read');
 const source=fs.readFileSync(path.join(__dirname,'../../scripts/kodjo/qualify-vnext-stabilization-audit.js'),'utf8');
 assert.match(source,/7200000/);assert.match(source,/disableAllHooks:true/);assert.match(source,/mcp__\*,Bash,Edit,Write/);assert.match(source,/READ_ONLY_AUDIT_RETURNED_NOT_RUNTIME_APPROVAL/);
 assert.doesNotMatch(source,/\.initial\(|\.review\(|write:true|--resume/);
});
