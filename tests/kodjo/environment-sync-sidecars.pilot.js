'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname,'..','..');
const { resolve: resolveReview } = require('../../scripts/kodjo/resolve-review-environment-sync');
const { resolve: resolveStable } = require('../../scripts/kodjo/resolve-stable-environment-sync');
const { classify } = require('../../scripts/kodjo/classify-environment-update');

function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
function json(rel){return JSON.parse(read(rel));}
function loadAppConfig(variant){
  const file=path.join(root,'app.config.js');
  delete require.cache[require.resolve(file)];
  const previous=process.env.APP_VARIANT;
  if(variant===undefined) delete process.env.APP_VARIANT; else process.env.APP_VARIANT=variant;
  try { return require(file).expo; }
  finally {
    delete require.cache[require.resolve(file)];
    if(previous===undefined) delete process.env.APP_VARIANT; else process.env.APP_VARIANT=previous;
  }
}

test('environment sync: EAS project identity and update runtime are persistent in Git',()=>{
  const app=json('app.json').expo;
  assert.equal(app.extra.eas.projectId,'0ee44f86-bd22-4b92-8780-e265b72907d9');
  assert.equal(app.updates.url,'https://u.expo.dev/0ee44f86-bd22-4b92-8780-e265b72907d9');
  assert.deepEqual(app.runtimeVersion,{policy:'appVersion'});
  assert.doesNotMatch(read('app.json'),/110c4abe-921e-44b3-aff3-465ee1573efe/);
});

test('environment sync: Routine and Routine Dev identities are versioned and distinct',()=>{
  const stable=loadAppConfig('production');
  const review=loadAppConfig('development');
  assert.equal(stable.name,'Routine');
  assert.equal(stable.ios.bundleIdentifier,'com.ankusha.kodjo');
  assert.equal(review.name,'Routine Dev');
  assert.equal(review.ios.bundleIdentifier,'com.ankusha.kodjo.dev');
  assert.equal(stable.extra.eas.projectId,review.extra.eas.projectId);
});

test('environment sync: EAS profiles separate local development, remote review and stable channels',()=>{
  const eas=json('eas.json');
  assert.equal(eas.build.development.developmentClient,true);
  assert.equal(eas.build.development.env.APP_VARIANT,'development');
  assert.equal(eas.build.review.distribution,'internal');
  assert.equal(eas.build.review.channel,'review');
  assert.equal(eas.build.review.env.APP_VARIANT,'development');
  assert.equal(eas.build.preview.distribution,'internal');
  assert.equal(eas.build.preview.channel,'stable');
  assert.equal(eas.build.preview.env.APP_VARIANT,'production');
});

test('environment sync: expo-updates is fully locked',()=>{
  const pkg=json('package.json');
  const lock=json('package-lock.json');
  assert.equal(pkg.dependencies['expo-updates'],'~57.0.23');
  assert.equal(lock.packages[''].dependencies['expo-updates'],'~57.0.23');
  assert.equal(lock.packages['node_modules/expo-updates'].version,'57.0.23');
  assert.equal(lock.packages['node_modules/expo-eas-client'].version,'57.0.4');
  assert.equal(lock.packages['node_modules/expo-manifests'].version,'57.0.2');
  assert.equal(lock.packages['node_modules/expo-structured-headers'].version,'57.0.1');
  assert.equal(lock.packages['node_modules/expo-updates-interface'].version,'57.0.2');
  assert.equal(lock.packages['node_modules/expo-updates/node_modules/arg'].version,'4.1.3');
});

test('environment sync: review resolver binds review -> implementation -> exact open PR HEAD',()=>{
  const head='a'.repeat(40), base='b'.repeat(40);
  const issue='https://api.github.com/repos/o/r/issues/42';
  const review={id:20,issue_url:issue,user:{login:'github-actions[bot]'},body:[
    '[KODJO_SLICE] IMPLEMENTATION_REVIEW_OUTPUT',
    'head='+head,
    'source_implementation_comment_id=10',
    'verdict=APPROVE',
    'STATUT : IMPLEMENTATION_REVIEW_APPROVED'
  ].join('\n')};
  const implementation={id:10,issue_url:issue,user:{login:'github-actions[bot]'},body:[
    '[KODJO_SLICE] IMPLEMENTATION_OUTPUT',
    'slice_id=V2-TEST-01',
    'base_head='+base,
    'head='+head,
    'continuity_origin=V2_LEAN_QUEUE',
    'application_pr=123',
    'application_branch=kodjo/v2-test',
    'STATUT : IMPLEMENTATION_READY_FOR_REVIEW'
  ].join('\n')};
  const pr={number:123,state:'open',base:{ref:'main'},head:{ref:'kodjo/v2-test',sha:head}};
  const result=resolveReview(review,implementation,pr);
  assert.equal(result.application_head,head);
  assert.equal(result.base_head,base);
  assert.equal(result.application_pr,123);
  assert.throws(()=>resolveReview(review,implementation,{...pr,head:{...pr.head,sha:'c'.repeat(40)}}),/ENV_SYNC_APPLICATION_HEAD_MOVED/);
});

test('environment sync: stable resolver requires exact FINAL_OUTPUT for the merged application PR',()=>{
  const head='a'.repeat(40), merge='c'.repeat(40), base='b'.repeat(40);
  const pr={number:123,state:'closed',merged:true,merge_commit_sha:merge,base:{ref:'main',sha:base},head:{ref:'kodjo/v2-test',sha:head}};
  const meta={
    schema:'kodjo.ui-final-verification.v1',
    slice_id:'V2-TEST-01',
    application_pr:123,
    application_branch:'kodjo/v2-test',
    head,
    final_status:'READY_TO_CLOSE'
  };
  const body=[
    '[KODJO_SLICE] FINAL_OUTPUT',
    'slice_id=V2-TEST-01',
    'final_head='+head,
    'STATUT : READY_TO_CLOSE',
    '',
    '<KODJO_UI_FINAL_VERIFICATION_JSON>',
    JSON.stringify(meta),
    '</KODJO_UI_FINAL_VERIFICATION_JSON>'
  ].join('\n');
  const result=resolveStable(pr,[{issue_number:42,comments:[{id:99,user:{login:'github-actions[bot]'},body}]}]);
  assert.equal(result.main_merge_head,merge);
  assert.equal(result.base_head,base);
  assert.equal(result.application_pr,123);
  assert.throws(()=>resolveStable({...pr,merged:false},[]),/ENV_SYNC_PR_NOT_MERGED_TO_MAIN/);
});

test('environment sync: native-sensitive changes rebuild, JS-only changes use OTA',()=>{
  assert.equal(classify(['src/foo.ts','app/index.tsx']).status,'OTA_COMPATIBLE');
  const native=classify(['src/foo.ts','package-lock.json']);
  assert.equal(native.status,'NATIVE_REBUILD_REQUIRED');
  assert.deepEqual(native.native_sensitive_files,['package-lock.json']);
});

test('environment sync: sidecars observe existing milestones without invoking or mutating the primary V2 state',()=>{
  const reviewSync=read('.github/workflows/kodjo-routine-dev-environment-sync.yml');
  const stableSync=read('.github/workflows/kodjo-routine-stable-environment-sync.yml');
  assert.match(reviewSync,/workflow_run:/);
  assert.doesNotMatch(reviewSync,/issue_comment:/);
  assert.match(reviewSync,/IMPLEMENTATION_REVIEW_OUTPUT/);
  assert.match(reviewSync,/IMPLEMENTATION_REVIEW_APPROVED/);
  assert.match(reviewSync,/resolve-review-run-environment-sync\.js/);
  assert.match(reviewSync,/--channel review/);
  assert.doesNotMatch(reviewSync,/contents:\s*write|issues:\s*write|pull-requests:\s*write|repository_dispatch|gh issue comment|gh pr create/);

  assert.match(stableSync,/pull_request:/);
  assert.match(stableSync,/types: \[closed\]/);
  assert.match(stableSync,/pull_request\.merged == true/);
  assert.match(stableSync,/resolve-stable-environment-sync\.js/);
  assert.match(stableSync,/--channel stable/);
  assert.doesNotMatch(stableSync,/contents:\s*write|issues:\s*write|pull-requests:\s*write|repository_dispatch|gh issue comment|gh pr create/);

  for(const primary of [
    '.github/workflows/kodjo-v2-lean-queue.yml',
    '.github/workflows/kodjo-slice-implementation-review.yml',
    '.github/workflows/kodjo-slice-finalize.yml'
  ]){
    const body=read(primary);
    assert.doesNotMatch(body,/routine-dev-environment-sync|routine-stable-environment-sync|resolve-review-environment-sync|resolve-stable-environment-sync/);
  }
});

test('environment sync: existing Routine preview workflow no longer rewrites projectId',()=>{
  const preview=read('.github/workflows/eas-ios-preview.yml');
  assert.doesNotMatch(preview,/Align EAS project identity for preview/);
  assert.doesNotMatch(preview,/110c4abe-921e-44b3-aff3-465ee1573efe/);
  assert.match(preview,/APP_VARIANT: production/);
  const reviewBuild=read('.github/workflows/eas-ios-routine-dev-review.yml');
  assert.match(reviewBuild,/--profile review/);
  assert.match(reviewBuild,/com\.ankusha\.kodjo\.dev/);
});

test('audit F05: completion binds one bot review to the exact run and attempt',()=>{
  const {selectReview}=require('../../scripts/kodjo/resolve-review-run-environment-sync');
  const run={id:200,run_attempt:1,path:'.github/workflows/kodjo-slice-implementation-review.yml',head_repository:{full_name:'o/r'},event:'repository_dispatch',status:'completed',conclusion:'success',run_started_at:'2026-09-19T10:00:00Z',updated_at:'2026-09-19T10:02:00Z'};
  const comment={id:20,user:{login:'github-actions[bot]'},created_at:'2026-09-19T10:01:00Z',body:'[KODJO_SLICE] IMPLEMENTATION_REVIEW_OUTPUT\nsource_review_run_id=200\nsource_review_run_attempt=1\nverdict=APPROVE\nSTATUT : IMPLEMENTATION_REVIEW_APPROVED'};
  assert.equal(selectReview(run,[comment],'o/r'),comment);
  assert.throws(()=>selectReview(run,[comment],'o/r',200,2),/IDENTITY_MISMATCH/);
  assert.throws(()=>selectReview(run,[comment],'o/r',201,1),/IDENTITY_MISMATCH/);
  for(const patch of [{conclusion:'failure'},{status:'in_progress'}])assert.equal(selectReview({...run,...patch},[comment],'o/r'),null);
  for(const body of [comment.body.replace('run_id=200','run_id=201'),comment.body.replace('attempt=1','attempt=2'),comment.body.replace('APPROVE','REVISE')])assert.equal(selectReview(run,[{...comment,body}],'o/r'),null);
  assert.equal(selectReview(run,[{...comment,user:{login:'stranger'}}],'o/r'),null);
  assert.equal(selectReview(run,[{...comment,created_at:'2026-09-19T09:59:00Z'}],'o/r'),null);
  assert.throws(()=>selectReview(run,[comment,comment],'o/r'),/AMBIGUOUS/);
  for(const patch of [{path:'.github/workflows/other.yml'},{head_repository:{full_name:'fork/r'}},{event:'pull_request'}])assert.throws(()=>selectReview({...run,...patch},[comment],'o/r'),/RUN_INVALID/);
});

test('audit F04: the actual jq expressions preserve false and reject every non-boolean',(t)=>{
  const {spawnSync}=require('node:child_process');
  if(process.platform==='win32' && spawnSync('jq',['--version']).status!==0){t.skip('jq unavailable on Windows; real expressions covered by Linux CI');return;}
  for(const name of ['dev','stable']){
    const body=read('.github/workflows/kodjo-routine-'+name+'-environment-sync.yml');
    const match=body.match(/applicable="\$\(jq -r '([^']+)'\s+"\$meta"\)"/);assert.ok(match);
    for(const value of [true,false,null,'','false','true',0,[],{},undefined]){
      const result=spawnSync('jq',['-r',match[1]],{input:JSON.stringify(value===undefined?{}:{applicable:value}),encoding:'utf8'});
      if(typeof value==='boolean'){assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),String(value));}
      else assert.notEqual(result.status,0,JSON.stringify(value));
    }
  }
});

test('audit F03: structural parser rejects the original colon-space scalar defect',()=>{
  const {parse}=require('../../scripts/kodjo/lib/yaml');
  assert.throws(()=>parse("jobs:\n  sync:\n    if: contains(body, 'STATUT : IMPLEMENTATION_REVIEW_APPROVED')\n"),/colon-space/);
  assert.doesNotThrow(()=>parse("jobs:\n  sync:\n    if: >-\n      contains(body, 'STATUT : IMPLEMENTATION_REVIEW_APPROVED')\n"));
});


test('qualification-only changes never request an environment update; mixed product changes retain normal classification',()=>{
  assert.equal(classify(['tests/kodjo-prod-qualif/e2e-sum.ts','tests/kodjo-prod-qualif/e2e-sum.test.ts']).status,'NO_ENVIRONMENT_UPDATE');
  assert.equal(classify(['tests/kodjo-prod-qualif/e2e-sum.ts','src/foo.ts']).status,'OTA_COMPATIBLE');
  assert.equal(classify(['tests/kodjo-prod-qualif/e2e-sum.ts','package-lock.json']).status,'NATIVE_REBUILD_REQUIRED');
  assert.notEqual(classify(['tests/kodjo-prod-qualif/../../src/foo.ts']).status,'NO_ENVIRONMENT_UPDATE');
});
