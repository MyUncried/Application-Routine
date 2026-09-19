'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const {consume}=require('../../scripts/kodjo/consume-queue-request');
const {adapter}=require('./helpers/consumption-git-api');
const root=path.resolve(__dirname,'../..');
function fixture(){
  const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-consumed-'));
  function git(args){const r=cp.spawnSync('git',args,{cwd,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
  git(['init','-q']);git(['config','user.name','test']);git(['config','user.email','test@example.invalid']);
  fs.writeFileSync(path.join(cwd,'proof.txt'),'fixture');git(['add','.']);git(['commit','-qm','base']);
  const receipt={repository:'o/r',request_id:'550e8400-e29b-41d4-a716-446655440001',queue_commit:git(['rev-parse','HEAD']),queue_blob_oid:git(['hash-object','proof.txt']),run_id:'100',run_attempt:'1'};
  return {cwd,receipt,api:adapter(cwd)};
}
function child(f,runId){
  const code="const {consume}=require(process.argv[1]);const {adapter}=require(process.argv[2]);try{consume(JSON.parse(process.argv[4]),adapter(process.argv[3]));process.stdout.write('EXECUTE');}catch(e){process.stderr.write(e.message);process.exit(1)}";
  return cp.spawn(process.execPath,['-e',code,path.join(root,'scripts/kodjo/consume-queue-request.js'),path.join(__dirname,'helpers/consumption-git-api.js'),f.cwd,JSON.stringify({...f.receipt,run_id:runId})]);
}
function result(child){return new Promise(resolve=>{let stdout='',stderr='';child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);child.on('close',status=>resolve({status,stdout,stderr}));});}
test('F10/D1: distinct process/run attempt=1 cannot execute a consumed request after restart',async()=>{
  const f=fixture();try{
    const first=await result(child(f,'100'));assert.equal(first.status,0,first.stderr);assert.equal(first.stdout,'EXECUTE');
    const next=await result(child(f,'101'));assert.equal(next.status,1);assert.equal(next.stdout,'');assert.match(next.stderr,/CONSUMED_REFUSED/);
    const same=await result(child(f,'100'));assert.equal(same.status,1);
    const renamed={...f.receipt,request_id:f.receipt.request_id.toUpperCase(),queue_path:'renamed.json'};
    assert.throws(()=>consume(renamed,adapter(f.cwd)),/CONSUMED_REFUSED/);
    assert.doesNotThrow(()=>consume({...f.receipt,request_id:f.receipt.request_id.replace(/1$/,'2'),run_id:'102',mode:'RESUME_DELTA',retry_of_run_id:'100'},adapter(f.cwd)));
  }finally{fs.rmSync(f.cwd,{recursive:true,force:true});}
});
test('F10/D1: competing runs have exactly one execution permission',async()=>{
  const f=fixture();try{
    const runs=await Promise.all([result(child(f,'200')),result(child(f,'201'))]);
    assert.equal(runs.filter(x=>x.status===0&&x.stdout==='EXECUTE').length,1,JSON.stringify(runs));
    assert.equal(runs.filter(x=>x.status===1&&x.stdout==='').length,1);
  }finally{fs.rmSync(f.cwd,{recursive:true,force:true});}
});
test('F10/D1: unavailable API, lost creation response and failed readback never authorize execution',()=>{
  for(const scenario of ['unavailable','lost-response','bad-readback']){
    const f=fixture();try{
      let created=false;
      const api=(method,url,body)=>{
        if(scenario==='unavailable')throw Error('offline');
        const r=f.api(method,url,body);
        if(method==='POST'&&url.endsWith('/refs')){created=true;if(scenario==='lost-response')throw Error('response lost');}
        if(created&&method==='GET'&&scenario==='bad-readback')return {status:200,data:{}};
        return r;
      };
      assert.throws(()=>consume(f.receipt,api));
      if(created)assert.throws(()=>consume({...f.receipt,run_id:'999'},adapter(f.cwd)),/CONSUMED_REFUSED/);
    }finally{fs.rmSync(f.cwd,{recursive:true,force:true});}
  }
});
test('F10/D1: runner consumes after preflight and before checkout/agent without releasing the receipt',()=>{
  const runner=fs.readFileSync(path.join(root,'scripts/kodjo/run-queued-request.ps1'),'utf8');
  const consumeIndex=runner.indexOf("'consume-queue-request.js'");
  assert.ok(consumeIndex>runner.indexOf("'verify-preflight-attestation.js'"));
  assert.ok(consumeIndex<runner.indexOf('git switch'));assert.match(runner,/KODJO_QUEUE_CONSUMPTION_REFUSED/);
  const source=fs.readFileSync(path.join(root,'scripts/kodjo/consume-queue-request.js'),'utf8');
  assert.doesNotMatch(source,/api\('(?:PATCH|DELETE)'/);
});
