'use strict';
const fs=require('node:fs'),path=require('node:path'),test=require('node:test'),assert=require('node:assert/strict');
const {parse}=require('../../scripts/kodjo/lib/yaml');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n');
const routes=JSON.parse(read('.github/orchestration/comment-routes.json'));
const routerPath='.github/workflows/kodjo-v2-comment-router.yml';
const router=parse(read(routerPath));
const normalize=s=>String(s).replace(/^\$\{\{\s*|\s*\}\}$/g,'').replace(/'[^']*'|\s+/g,m=>m.startsWith("'")?m:' ').trim();
test('comments have exactly one native subscriber, and all workers retain their root gates and permissions',()=>{
 const subscribers=fs.readdirSync(path.join(root,'.github/workflows')).filter(p=>/\.yml$/.test(p)&&Object.hasOwn(parse(read('.github/workflows/'+p)).on||{},'issue_comment'));
 assert.deepEqual(subscribers,['kodjo-v2-comment-router.yml']);
 assert.equal(routes.length,32);
 for(const route of routes){
  const worker=parse(read(route.path)),call=router.jobs[route.id];
  assert.ok(Object.hasOwn(worker.on,'workflow_call'),route.path);
  const gates=Object.values(worker.jobs).filter(j=>!j.needs).map(j=>'('+normalize(j.if||'true')+')').join(' || ');
  assert.equal(normalize(call.if),gates,route.path);
  assert.equal(normalize(route.gate),normalize(call.if),route.path);
  assert.equal(call.uses,'./'+route.path);
  assert.deepEqual(call.permissions,worker.permissions,route.path);
  assert.deepEqual(Object.keys(call).sort(),(route.id==='implementation-review'?['name','if','permissions','uses','secrets']:['if','permissions','uses','secrets']).sort());
  assert.equal(call.secrets,'inherit');
 }
 assert.equal(router.permissions.contents,'read');
 assert.equal(router.jobs['routine-dev-sync'].needs,'implementation-review');
 assert.equal(router.jobs['routine-dev-sync'].if,"needs.implementation-review.result == 'success'");
});
test('ordinary comments, report links and wrong authors do not start production plan/review workers',()=>{
 const contains=(a,b)=>String(a??'').includes(b),startsWith=(a,b)=>String(a??'').startsWith(b);
 const format=(s,...args)=>s.replace(/\{(\d+)\}/g,(_,i)=>args[Number(i)]),fromJSON=JSON.parse;
 const evaluate=(r,login,body)=>Function('github','contains','startsWith','format','fromJSON','return ('+r.gate.replace(/\\/g,'\\\\')+');')({event_name:'issue_comment',event:{issue:{number:249},comment:{user:{login},body}}},contains,startsWith,format,fromJSON);
 for(const body of ['Merci','Correction livrée : https://github.com/MyUncried/Application-Routine/commit/abc','[KODJO_V2] PLAN_OUTPUT\nverdict=REVISE'])for(const r of routes)assert.equal(Boolean(evaluate(r,'MyUncried',body)),false,r.id);
 const initial=routes.find(r=>r.id==='v2-slice-initial-plan');
 assert.equal(evaluate(initial,'MyUncried','[KODJO_V2] START_INITIAL_PLAN\nslice_id=PRE-1'),true);
 assert.equal(evaluate(initial,'stranger','[KODJO_V2] START_INITIAL_PLAN\nslice_id=PRE-1'),false);
 assert.equal(evaluate(initial,'MyUncried','[KODJO_V2] START_INITIAL_PLAN_REVIEW'),false);
});
test('delegated contents permission cannot become an executable or arbitrary writer',()=>{
 const {main:scan}=require('../../scripts/kodjo/scan-remote-write-capability');
 const source=read(routerPath),os=require('node:os');
 const check=(s,name='kodjo-v2-comment-router.yml')=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-comment-scanner-'));
  const argv=process.argv,out=process.stdout.write,err=process.stderr.write;
  try{
   fs.mkdirSync(path.join(dir,'.github/workflows'),{recursive:true});
   fs.writeFileSync(path.join(dir,'.github/workflows',name),s);
   process.argv=[argv[0],argv[1],dir];process.stdout.write=process.stderr.write=()=>true;
   return scan();
  }finally{process.argv=argv;process.stdout.write=out;process.stderr.write=err;fs.rmSync(dir,{recursive:true,force:true});}
 };
 assert.equal(check(source),0);
 for(const mutate of [s=>s.replace('permissions:\n  contents: read','permissions:\n  contents: write'),s=>s.replace('uses: ./.github/workflows/kodjo-e2e-orchestration-test-v1-3.yml','uses: ./.github/workflows/arbitrary.yml'),s=>s.replace('    uses: ./.github/workflows/kodjo-e2e-orchestration-test-v1-3.yml','    steps: []\n    uses: ./.github/workflows/kodjo-e2e-orchestration-test-v1-3.yml')]){
  const hostile=mutate(source);assert.notEqual(hostile,source);assert.equal(check(hostile),1);
 }
 assert.equal(check(source,'kodjo-v2-other.yml'),1);
 assert.equal(check(source+'\n# mutation\nextra: git push origin HEAD\n'),1);
});
test('Routine Dev requires the exact completed review job in this router attempt',()=>{
 const {selectReview}=require('../../scripts/kodjo/resolve-review-run-environment-sync');
 const run={id:200,run_attempt:2,path:routerPath,head_repository:{full_name:'o/r'},event:'issue_comment',status:'in_progress',run_started_at:'2026-09-29T10:00:00Z'};
 const job={run_id:200,name:'Generic implementation review / review',status:'completed',conclusion:'success',started_at:'2026-09-29T10:00:01Z',completed_at:'2026-09-29T10:02:00Z'};
 const comment={user:{login:'github-actions[bot]'},created_at:'2026-09-29T10:01:00Z',body:'[KODJO_SLICE] IMPLEMENTATION_REVIEW_OUTPUT\nsource_review_run_id=200\nsource_review_run_attempt=2\nverdict=APPROVE'};
 assert.equal(selectReview(run,[comment],'o/r',200,2,[job]),comment);
 assert.equal(selectReview(run,[comment],'o/r',200,2,[]),null);
 for(const patch of [{run_id:201},{name:'other / review'},{status:'in_progress'},{conclusion:'failure'},{conclusion:'skipped'}])assert.equal(selectReview(run,[comment],'o/r',200,2,[{...job,...patch}]),null);
 assert.equal(selectReview(run,[comment],'o/r',200,2,[job,job]),null);
 assert.equal(selectReview(run,[{...comment,created_at:'2026-09-29T10:03:00Z'}],'o/r',200,2,[job]),null);
 assert.equal(selectReview(run,[{...comment,body:comment.body.replace('attempt=2','attempt=1')}],'o/r',200,2,[job]),null);
 assert.equal(selectReview({...run,path:'.github/workflows/kodjo-slice-implementation-review.yml'},[comment],'o/r',200,2,[job]),null);
});
