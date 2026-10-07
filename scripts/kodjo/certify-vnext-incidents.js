#!/usr/bin/env node
'use strict';
// Targeted continuation of VNEXT-12-QUALIF, not a new campaign or Claude run.
const fs = require('node:fs'), path = require('node:path');
const { spawnSync, execFileSync } = require('node:child_process');
const V = require('./lib/vnext-contract');
const Versions = require('./lib/vnext-execution-provenance');
const ROOT = '.github/orchestration/reports/evidence/vnext-incidents-20261007';
const TESTS = ['vnext-proof-lifecycle','vnext-delivery-preservation','vnext-post-acceptance','vnext-finalization-incidents','disposable-consumption','vnext-post-delivery-revision'].map(name => 'tests/kodjo/' + name + '.pilot.js');
function validateConfig(config) {
  if (config.stage !== 'CERTIFY_INCIDENTS' || config.campaign_id !== '628b3349-88b4-4bf1-be6b-50bc09e7d245'
      || config.slice_id !== 'VNEXT-12-QUALIF' || config.pre1_in_scope !== false || config.final_audit_authorized !== false
      || config.revision_limit !== 1 || config.source_revision_run !== 37548553181) V.fail('VNEXT_INCIDENT_CERTIFICATION_SCOPE_REFUSED');
  return config;
}
function main(configFile,directory) {
  const cwd = process.cwd(), config = validateConfig(JSON.parse(fs.readFileSync(configFile,'utf8')));
  const out = path.resolve(directory);
  if (out === cwd || out.startsWith(cwd + path.sep)) V.fail('VNEXT_INCIDENT_EXTERNAL_EVIDENCE_REQUIRED');
  fs.mkdirSync(out,{recursive:true});
  const save = (name,data) => fs.writeFileSync(path.join(out,name),JSON.stringify(data,null,2)+'\n');
  const head = execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim();
  const summary = { campaign_id:config.campaign_id, controller_head:head, source_revision_run:config.source_revision_run,
    qualification_scope:'TARGETED_INCIDENTS_ONLY', claude_invoked:false, browser_invoked:false,
    v2_modified:false, pre2_reopened:false, github_issue_closed:false, application_published:false,
    tests_status:'NOT_RUN', real_data_replay:'NOT_RUN', vnext_live_closure_certified:false };
  try {
    const provenance = Versions.observe({controllerCwd:cwd,approvedCwd:cwd,controllerHead:head,approvedHead:head,
      controllerScript:'scripts/kodjo/certify-vnext-incidents.js',runtimeScript:'scripts/kodjo/finalize-vnext-delivery.js'});
    save('execution-provenance.json',provenance);
    const tests=config.consumer_completion_only
      ? ['tests/kodjo/vnext-finalization-incidents.pilot.js','tests/kodjo/vnext-delivery-preservation.pilot.js'] : TESTS;
    if(config.consumer_completion_only&&config.reused_targeted_run!==37557921183)V.fail('VNEXT_INCIDENT_REUSE_SOURCE_REQUIRED');
    summary.reused_targeted_run=config.consumer_completion_only?config.reused_targeted_run:null;
    summary.executed_test_paths=tests;
    const result = spawnSync(process.execPath,['--test',...tests],{cwd,encoding:'utf8',windowsHide:true,timeout:7200000,maxBuffer:16*1024*1024});
    fs.writeFileSync(path.join(out,'targeted-tests.log'),String(result.stdout||'') + String(result.stderr||''));
    if (result.error || result.status !== 0) V.fail('VNEXT_INCIDENT_TARGETED_TESTS_FAILED');
    summary.tests_status='PASS';
    const Github = require('./lib/vnext-github-qualification');
    const repository='MyUncried/Application-Routine';
    const github={comment:(_repository,id)=>Github.readGithub('repos/'+repository+'/issues/comments/'+id)};
    const manifest=JSON.parse(fs.readFileSync(path.join(cwd,ROOT,'real-data-manifest.json'),'utf8'));
    // Every decision/review is freshly read, with its origin checked by the
    // finalization entry. The closed V2 issue is only a data source.
    const comments={};
    for(const id of [manifest.reviewId,manifest.decisionId,manifest.originDecisionId]) comments[id]=github.comment(repository,id);
    save('observed-source-comments.json',comments);
    const finalization=require('./finalize-vnext-delivery').execute(manifest,{cwd,directory:path.join(out,'real-data-replay'),github:{comment:(_r,id)=>comments[id]}});
    const Delivery=require('./lib/vnext-delivery-preservation'),extract=require('./lib/plan-impact').extractTaggedJson;
    const plan=execFileSync('git',['show',manifest.planRevision+':'+manifest.planPath],{cwd,encoding:'utf8',maxBuffer:32*1024*1024});
    const matrix=Delivery.merge(extract(plan,'KODJO_UI_CRITERIA_MATRIX_JSON'),Delivery.fromMarkdown(plan));
    Delivery.validateBaseline(V.sealContract({reference:{kind:'READ_ONLY_REPLAY',source_run:37281056162},matrix,
      review:extract(comments[manifest.reviewId].body,'KODJO_UI_IMPLEMENTATION_REVIEW_JSON'),finalization,plan_blob_oid:manifest.approvedPlanBlobOid}));
    summary.real_data_next_consumer='DELIVERY_BASELINE_ADMITTED';
    summary.real_data_replay='PASS';
    summary.real_data_replay_scope='V2_INCIDENT_DATA_THROUGH_VNEXT_ENTRY_READ_ONLY';
    summary.increment_count=finalization.delivery_coverage.increment_files.length;
    summary.cumulative_count=finalization.delivery_coverage.cumulative_files.length;
    summary.real_data_finalization_hash=finalization.contract_hash;
    summary.limits=['Synthetic cases prove validators, not a new VNext GitHub closure.',
      'Read-only replay proves compatibility with the actual incident data; it neither reopens V2 nor certifies operational VNext.',
      'Existing INITIAL and REVISION runtime successes are retained; effective VNext GitHub closure remains to be exercised.'];
  } finally { save('certification.json',summary); }
}
if(require.main===module){try{main(process.argv[2],process.argv[3]);}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={validateConfig,TESTS,main};
