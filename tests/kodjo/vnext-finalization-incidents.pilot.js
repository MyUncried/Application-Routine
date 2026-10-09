'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const Final = require('../../scripts/kodjo/lib/vnext-finalization');
const Versions = require('../../scripts/kodjo/lib/vnext-execution-provenance');
const V = require('../../scripts/kodjo/lib/vnext-contract');
function fixture() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext-final-'));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).trim();
  git('init', '-q'); git('config', 'gc.auto', '0'); git('config', 'maintenance.auto', 'false'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
  const commit = text => { fs.writeFileSync(path.join(cwd, 'correction.js'), text); git('add', '.'); git('commit', '-qm', text); return git('rev-parse', 'HEAD'); };
  fs.writeFileSync(path.join(cwd,'baseline-keep.js'),'unchanged');
  require('./helpers/vnext-test-evidence-fixture').install(cwd);
  const baselineHead = commit('baseline');
  fs.writeFileSync(path.join(cwd, 'delivered.js'), 'module.exports = 1;\n');
  const first = commit('initial delivery'), second = commit('first correction'), head = commit('second correction');
  const repository = 'MyUncried/Application-Routine', issue = 269, sliceId = 'VNEXT-12-QUALIF', reviewId = '501';
  const matrix = { criteria: [{ criterion_id: 'UI-1', change_targets: ['delivered.js'], proof_required: ['FUNCTIONAL_TEST','ACCESSIBILITY_CHECK'] }] };
  const review = { verdict: 'APPROVE', criteria: [{ criterion_id: 'UI-1', implementation_status: 'NON_VERIFIABLE', preserve_status: 'PASS',
    proof_results: [{ proof_type: 'FUNCTIONAL_TEST', status: 'PASS', evidence: 'FIXTURE executed assertion' }, { proof_type: 'ACCESSIBILITY_CHECK', status: 'PENDING_DEVICE', evidence: 'FIXTURE device unavailable' }] }] };
  const body = '[KODJO_VNEXT] FUNCTIONAL_ACCEPTANCE\nslice_id=' + sliceId + '\nhead=' + head + '\nsource_review_comment_id=' + reviewId + '\nAccessibility not executed; no conformity attested.\n';
  const acceptance = { id: 502, user: { login: 'MyUncried' }, issue_url: `https://api.github.com/repos/${repository}/issues/${issue}`, body };
  const args = { cwd, matrix, review, baselineHead, incrementHead: second, head, approvedHead: head, repository, issue, sliceId, reviewId,
    acceptance, reservations: ['Accessibility not executed; no conformity attested.'], checks: { jest:'PASS', typescript:'PASS', lint:'PASS', head:'PASS', clean:'PASS' } };
  return { cwd, git, commit, first, second, head, args, cleanup: () => fs.rmSync(cwd, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }) };
}
test('incident 1: admitted accessibility waiting closes functionally with original reserves and no fabricated PASS', () => {
  const f = fixture(); try {
    const result = Final.finalize(f.args);
    assert.equal(result.final_status, 'READY_TO_CLOSE');
    assert.equal(result.pending_proofs[0].status, 'PENDING_DEVICE');
    assert.equal(result.all_device_proofs_executed, false);
    assert.equal(result.accessibility_compliance_attested, false);
    assert.equal(result.visual_compliance_attested, false);
    assert.deepEqual(result.reservations, f.args.reservations);
    assert.equal(result.proof_resolutions[0].resolution,'USER_WAIVER');
    assert.equal(result.original_decision.body, f.args.acceptance.body);
  } finally { f.cleanup(); }
});
test('incident 1: actual accessibility PASS remains technical PASS without asking for a visual gate', () => {
  const f = fixture(); try {
    f.args.review.criteria[0].implementation_status = 'CONFORME';
    f.args.review.criteria[0].proof_results[1].status = 'PASS';
    const result = Final.finalize({ ...f.args, acceptance: null, reservations: [] });
    assert.equal(result.pending_proofs.length, 0); assert.equal(result.all_device_proofs_executed, true);
  } finally { f.cleanup(); }
});
test('incident 1: existing scoped non-UI waiver is reused without a second human gate', () => {
  const f=fixture();try{
    f.args.review.criteria[0].implementation_status='CONFORME';f.args.review.criteria[0].proof_results[1].status='PASS';
    f.args.review.non_ui_plan_assessment={status:'CONFORME',requirements:[{requirement_id:'NONUI-1',status:'NON_VERIFIABLE',proof_results:[{proof_type:'FUNCTIONAL_TEST',status:'PASS',evidence:'FIXTURE test'},{proof_type:'DEVICE_CHECK',status:'PENDING_DEVICE',evidence:'FIXTURE device unavailable'}]}]};
    const waiver={requirement_id:'NONUI-1',proof_type:'DEVICE_CHECK',status:'NOT_EXECUTED',decided_by:'MyUncried',decision:'Explicit scoped waiver',residual_risk:'Device observation unavailable'};
    f.args.review.device_check_derogations=[waiver];
    const result=Final.finalize({...f.args,acceptance:null,reservations:[]});
    assert.deepEqual(result.not_executed_proofs,[waiver]);
    assert.equal(result.proof_resolutions[0].resolution,'SCOPED_DEVICE_DEROGATION');
    assert.equal(result.pending_proofs[0].status,'PENDING_DEVICE');
    assert.equal(result.all_device_proofs_executed,false);
  }finally{f.cleanup();}
});
for (const status of ['FAIL','NON_VERIFIABLE','PENDING_DEVICE']) test('incident 1: functional ' + status + ' cannot be waived by the owner', () => {
  const f = fixture(); try { f.args.review.criteria[0].proof_results[0].status = status;
    assert.throws(() => Final.finalize(f.args), /TECHNICAL_PROOF_NOT_PASSED/);
  } finally { f.cleanup(); }
});
test('incident 1: missing technical proof, missing pending resolution and invented reserves are refused', () => {
  const f = fixture(); try {
    assert.throws(() => Final.finalize({ ...f.args, acceptance: null }), /PENDING_RESOLUTION_REQUIRED/);
    assert.throws(() => Final.finalize({ ...f.args, reservations: ['invented'] }), /RESERVATIONS_NOT_IN_DECISION/);
    f.args.review.criteria[0].proof_results.shift();
    assert.throws(() => Final.finalize(f.args), /TECHNICAL_PROOF_NOT_PASSED/);
  } finally { f.cleanup(); }
});
test('incident 2: initial and multiple corrections keep cumulative delivery separate from last increment', () => {
  const f = fixture(); try {
    const result = Final.finalize(f.args), coverage = result.delivery_coverage;
    assert.deepEqual(coverage.increment_files, ['correction.js']);
    assert.deepEqual(coverage.cumulative_files, ['correction.js','delivered.js']);
    assert.equal(coverage.current_files[0].blob_oid, f.git('rev-parse', f.first + ':delivered.js'));
  } finally { f.cleanup(); }
});
test('incident 2: previously delivered but subsequently deleted file is refused even with a stale green review', () => {
  const f = fixture(); try {
    fs.unlinkSync(path.join(f.cwd, 'delivered.js')); const head = f.commit('deletion');
    assert.throws(() => Final.coverage({ ...f.args, head, approvedHead: head }), /TARGET_ABSENT/);
  } finally { f.cleanup(); }
});
test('incident 2: retained regression and inherited PASS do not close', () => {
  const f = fixture(); try {
    f.args.review.criteria[0].review_scope = 'INHERITED';
    assert.throws(() => Final.finalize(f.args), /FRESH_REVIEW_REQUIRED/);
    delete f.args.review.criteria[0].review_scope;
    f.args.review.criteria[0].preserve_status = 'FAIL';
    assert.throws(() => Final.finalize(f.args), /CRITERION_NOT_CLOSED/);
  } finally { f.cleanup(); }
});
test('incident 2: unrelated baseline, missing target and different approved head are refused', () => {
  const f = fixture(); try {
    assert.throws(() => Final.finalize({ ...f.args, approvedHead: f.first }), /UNAPPROVED_HEAD/);
    f.git('checkout', '--orphan', 'unrelated'); f.git('rm', '-rf', '.'); const other = f.commit('unrelated');
    assert.throws(() => Final.finalize({ ...f.args, baselineHead: other }), /BASELINE_NOT_ANCESTOR/);
    f.args.matrix.criteria[0].change_targets = ['absent.js'];
    assert.throws(() => Final.finalize(f.args), /TARGET_ABSENT/);
    f.args.matrix.criteria[0].change_targets = ['baseline-keep.js'];
    assert.throws(() => Final.finalize(f.args), /TARGET_NOT_DELIVERED/);
    assert.equal(Final.finalize({...f.args,retainedTargets:['baseline-keep.js']}).delivery_coverage.current_files[0].path,'baseline-keep.js');
  } finally { f.cleanup(); }
});
test('incident 2: unchanged non-UI targets require an exact retained-target declaration', () => {
  const f=fixture();try{
    const Entry=require('../../scripts/kodjo/finalize-vnext-delivery');
    const requirements=[{change_targets:['baseline-keep.js','delivered.js']}];
    const input={baselineHead:f.args.baselineHead,head:f.head,retained_non_ui_targets:['baseline-keep.js']};
    assert.deepEqual(Entry.validateRetainedNonUiTargets(input,requirements,f.cwd),['baseline-keep.js']);
    assert.throws(()=>Entry.validateRetainedNonUiTargets({...input,retained_non_ui_targets:[]},requirements,f.cwd),/RETAINED_NON_UI_INCOMPLETE/);
    assert.throws(()=>Entry.validateRetainedNonUiTargets({...input,retained_non_ui_targets:['outside.js']},requirements,f.cwd),/RETAINED_NON_UI_SCOPE_REFUSED/);
  }finally{f.cleanup();}
});
test('incident 3: technical restart retains exact original decision and reserves, rejects a different delivery', () => {
  const f = fixture(); try {
    const originDecision = f.args.acceptance;
    const acceptance = { ...originDecision, id: 503, body: originDecision.body + `Technical restart; original decision https://github.com/${f.args.repository}/issues/${f.args.issue}#issuecomment-502\n` };
    const result = Final.finalize({ ...f.args, acceptance, originDecision });
    assert.equal(result.acceptance.comment_id, '503'); assert.equal(result.original_decision.comment_id, '502');
    assert.deepEqual(result.reservations, f.args.reservations);
    assert.throws(() => Final.finalize({ ...f.args, acceptance: { ...acceptance, body: acceptance.body.replace('issuecomment-502','issuecomment-504') }, originDecision }), /PROVENANCE_MISSING/);
    assert.throws(() => Final.finalize({ ...f.args, acceptance: { ...acceptance, body: acceptance.body.replace(f.head, f.first) }, originDecision }), /DECISION_BINDING_INVALID/);
  } finally { f.cleanup(); }
});
test('incident 3: interrupted local closure resumes without duplicate or overwriting a different closure', () => {
  const f = fixture(); try {
    const result = Final.finalize(f.args), directory = path.join(f.cwd,'closure');
    const first = Final.closeLocally(directory,result);
    assert.deepEqual(Final.closeLocally(directory,result),first);
    assert.equal(fs.readdirSync(directory).length,1);
    const changed = { ...result, review_comment_id: '999' }; delete changed.contract_hash;
    assert.throws(() => Final.closeLocally(directory,V.sealContract(changed)), /CLOSURE_CONFLICT/);
    assert.equal(first.github_issue_closed,false);
  } finally { f.cleanup(); }
});
test('incident 3: pinned script or workflow fix requires a new event; runtime fix requires new handoff', () => {
  const row = { workflow: { sha256:'a' }, controller: { sha256:'b' }, runtime:{revision:'c'}, contracts:[] };
  const previous = V.sealContract(row);
  assert.equal(Versions.recovery(previous,{ ...row, controller:{sha256:'new-script'} }).action,'NEW_EVENT_SAME_DELIVERY');
  assert.equal(Versions.recovery(previous,row).action,'RESUME_EXISTING_OPERATION');
  assert.equal(Versions.recovery(previous,{ ...row, workflow:{sha256:'new-workflow'} }).action,'NEW_EVENT_SAME_DELIVERY');
  assert.equal(Versions.recovery(previous,{ ...row, runtime:{revision:'new-runtime'} }).reuse_human_decision,false);
});
test('incident 3: observer reads actual Git workflow and source bytes and rejects old workflow or working-copy drift', () => {
  const f = fixture(); try {
    const files = [Versions.WORKFLOW,'scripts/kodjo/execute-vnext12.js','scripts/kodjo/run-local-claude.js','scripts/kodjo/lib/vnext-contract.js','scripts/kodjo/lib/vnext-legacy-queue-adapter.js'];
    for (const file of files) { fs.mkdirSync(path.dirname(path.join(f.cwd,file)),{recursive:true}); fs.writeFileSync(path.join(f.cwd,file),'original'); }
    const old = f.commit('versions'); fs.writeFileSync(path.join(f.cwd,Versions.WORKFLOW),'corrected workflow'); const corrected = f.commit('workflow fix');
    const options = { controllerCwd:f.cwd,approvedCwd:f.cwd,controllerHead:corrected,approvedHead:corrected,env:{GITHUB_WORKFLOW_SHA:old,GITHUB_WORKFLOW_REF:'fixture',GITHUB_RUN_ID:'1',GITHUB_RUN_ATTEMPT:'2'} };
    assert.throws(() => Versions.observe(options), /WORKFLOW_STALE_NEW_EVENT_REQUIRED/);
    options.env.GITHUB_WORKFLOW_SHA = corrected;
    assert.equal(Versions.observe(options).workflow.revision,corrected);
    fs.writeFileSync(path.join(f.cwd,'scripts/kodjo/run-local-claude.js'),'drift');
    assert.throws(() => Versions.observe(options), /SOURCE_DRIFT/);
  } finally { f.cleanup(); }
});

test('VNext entry reads the approved Git plan and actual comment bindings instead of trusting a supplied review object', () => {
  const f=fixture();try{
    const matrix=require('../../scripts/kodjo/lib/plan-impact').extractTaggedJson(require('./helpers/vnext-proof-lifecycle-fixture').planFixture(true,true),'KODJO_UI_CRITERIA_MATRIX_JSON');
    matrix.criteria[0].criterion_id='UI-1';matrix.criteria[0].change_targets=['delivered.js'];
    const contract={matrix_sha256:require('../../scripts/kodjo/lib/ui-criteria-contract').matrixFingerprint(matrix)};
    const coverageFixture=require('./helpers/vnext-coverage-fixture').evidence();
    const coveragePlan='plan_contract_hash='+coverageFixture.report.plan_contract_hash+'\n<KODJO_VNEXT_REVIEW_COVERAGE_JSON>'+JSON.stringify(coverageFixture)+'</KODJO_VNEXT_REVIEW_COVERAGE_JSON>\n';
    const plan=coveragePlan+'<KODJO_UI_CRITERIA_MATRIX_JSON>'+JSON.stringify(matrix)+'</KODJO_UI_CRITERIA_MATRIX_JSON>\n<KODJO_UI_PLAN_CONTRACT_JSON>'+JSON.stringify(contract)+'</KODJO_UI_PLAN_CONTRACT_JSON>';
    fs.writeFileSync(path.join(f.cwd,'plan.md'),plan);const revision=f.commit('versioned plan');
    const reviewComment={id:501,user:{login:'github-actions[bot]'},issue_url:f.args.acceptance.issue_url,
      body:'slice_id='+f.args.sliceId+'\nhead='+f.head+'\n<KODJO_UI_IMPLEMENTATION_REVIEW_JSON>'+JSON.stringify(f.args.review)+'</KODJO_UI_IMPLEMENTATION_REVIEW_JSON>'};
    const input={...f.args,planRevision:revision,planPath:'plan.md',approvedPlanBlobOid:require('../../scripts/kodjo/lib/vnext-legacy-queue-adapter').gitBlobOid(plan),decisionId:502,checksReceipt:{head:f.head,checks:f.args.checks}};
    const proof=require('./helpers/vnext-test-evidence-fixture').fixture(f.cwd,f.head);input.checksReceipt=proof.receipt;
    const options={cwd:f.cwd,directory:path.join(f.cwd,'evidence'),github:{...proof.github,comment:(_r,id)=>String(id)==='501'?reviewComment:f.args.acceptance}};
    const Entry=require('../../scripts/kodjo/finalize-vnext-delivery');
    f.args.review.schema='kodjo.ui-implementation-review.v1';
    reviewComment.body='slice_id='+f.args.sliceId+'\nhead='+f.head+'\n<KODJO_UI_IMPLEMENTATION_REVIEW_JSON>'+JSON.stringify(f.args.review)+'</KODJO_UI_IMPLEMENTATION_REVIEW_JSON>';
    const finalized=Entry.execute(input,options);
    assert.equal(finalized.test_evidence.status,'VERIFIED_EXECUTED_TESTS');
    assert.deepEqual(finalized.review_coverage.pending_target_ids,coverageFixture.report.pending_target_ids);
    assert.equal(finalized.review_coverage.coverage_status,'ACCEPTED_WITH_PENDING_SECONDARY_TARGETS');
    assert.deepEqual(Final.closeLocally(path.join(f.cwd,'local-closure'),finalized).review_coverage,finalized.review_coverage);
    proof.run.conclusion='failure';
    assert.throws(()=>Entry.execute(input,options),/TEST_RUN_NOT_VERIFIED/);
    proof.run.conclusion='success';
    assert.equal(finalized.final_status,'READY_TO_CLOSE');
    const baseline=V.sealContract({reference:{},matrix,review:f.args.review,finalization:finalized,plan_blob_oid:input.approvedPlanBlobOid});
    const Delivery=require('../../scripts/kodjo/lib/vnext-delivery-preservation');Delivery.validateBaseline(baseline);
    for(const change of [{proof_resolutions:[]},{acceptance:null,original_decision:null},{all_device_proofs_executed:true}]){
      const changed={...finalized,...change};delete changed.contract_hash;
      const altered={...baseline,finalization:V.sealContract(changed)};delete altered.contract_hash;
      assert.throws(()=>Delivery.validateBaseline(V.sealContract(altered)),/RESOLUTION|DRIFT/);
    }
    fs.writeFileSync(path.join(f.cwd,'review.json'),JSON.stringify(f.args.review));fs.writeFileSync(path.join(f.cwd,'final.json'),JSON.stringify(finalized));const proofRevision=f.commit('versioned final proof');
    const reference={revision:proofRevision,plan_path:'plan.md',review_path:'review.json',finalization_path:'final.json',repository:f.args.repository,issue_number:f.args.issue};
    const observed=Delivery.observe(reference,{cwd:f.cwd,readGit:(cwd,rev,file)=>execFileSync('git',['show',rev+':'+file],{cwd,encoding:'utf8'}),github:options.github});
    assert.equal(Delivery.build({baseline:observed,replacements:[]},[],[]).retained_criteria.length,1);
    assert.deepEqual(observed.finalization.reservations,f.args.reservations);
    assert.throws(()=>Entry.execute({...input,approvedPlanBlobOid:'f'.repeat(40)},options),/PLAN_BLOB_MISMATCH/);
    assert.throws(()=>Entry.execute({...input,checksReceipt:{head:f.first,checks:f.args.checks}},options),/CHECKS_HEAD_MISMATCH/);
    reviewComment.body=reviewComment.body.replace(f.head,f.first);
    assert.throws(()=>Entry.execute(input,options),/REVIEW_HEAD_MISMATCH/);
  }finally{f.cleanup();}
});
test('targeted continuation preserves the existing campaign and disables runtime/qualification routes', () => {
  const Cert=require('../../scripts/kodjo/certify-vnext-incidents');
  const c={stage:'CERTIFY_INCIDENTS',campaign_id:'628b3349-88b4-4bf1-be6b-50bc09e7d245',slice_id:'VNEXT-12-QUALIF',pre1_in_scope:false,final_audit_authorized:false,revision_limit:1,source_revision_run:37548553181};
  assert.equal(Cert.validateConfig(c),c);
  assert.throws(()=>Cert.validateConfig({...c,campaign_id:'other'}),/SCOPE_REFUSED/);
  const yaml=fs.readFileSync(path.resolve(__dirname,'../../.github/workflows/kodjo-vnext12-disposable.yml'),'utf8');
  const certify=yaml.slice(yaml.indexOf('  certify-incidents:'),yaml.indexOf('  historical-equivalence:'));
  assert.match(certify,/stage == 'CERTIFY_INCIDENTS'/);
  assert.doesNotMatch(certify,/contents: write|qualify-driver|execute-vnext12.js|qualify-vnext-figma-real-path.js/);
});

test('incident 3: corrected controller script is actually observed with an unchanged workflow and immutable approved runtime', () => {
  const f=fixture();const approved=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-approved-'));fs.rmdirSync(approved);
  try {
    for(const file of [Versions.WORKFLOW,'scripts/kodjo/execute-vnext12.js','scripts/kodjo/run-local-claude.js','scripts/kodjo/lib/vnext-contract.js','scripts/kodjo/lib/vnext-legacy-queue-adapter.js']){
      fs.mkdirSync(path.dirname(path.join(f.cwd,file)),{recursive:true});fs.writeFileSync(path.join(f.cwd,file),'original');
    }
    const before=f.commit('script versions');f.git('worktree','add','--detach',approved,before);
    fs.writeFileSync(path.join(f.cwd,'scripts/kodjo/execute-vnext12.js'),'corrected script');const after=f.commit('script correction');
    const env={GITHUB_WORKFLOW_SHA:before,GITHUB_WORKFLOW_REF:'fixture',GITHUB_RUN_ID:'1',GITHUB_RUN_ATTEMPT:'2'};
    const result=Versions.observe({controllerCwd:f.cwd,approvedCwd:approved,controllerHead:after,approvedHead:before,env});
    assert.equal(result.controller.revision,after);assert.equal(result.runtime.revision,before);
    assert.equal(result.controller.sha256,V.sha256('corrected script'));
    assert.equal(result.runtime.sha256,V.sha256('original'));
  }finally{if(fs.existsSync(approved))f.git('worktree','remove','--force',approved);f.cleanup();}
});
