'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const Cache=require('../../scripts/kodjo/lib/vnext-work-archive-cache'),V=require('../../scripts/kodjo/lib/vnext-contract'),E=require('../../scripts/kodjo/lib/vnext-work-execution'),W=require('../../scripts/kodjo/signal-vnext-agent-continuation');
function fixture(){
 const bytes=Buffer.from(Array.from({length:10000},(_,i)=>i%256));const a={artifact_id:11,artifact_sha256:crypto.createHash('sha256').update(bytes).digest('hex')};return {bytes,a,value:Cache.encode(a,bytes)};
}
test('cache transports original binary bytes without network and refuses altered or truncated copies',()=>{
 const f=fixture();assert(Cache.decode(f.value,f.a).equals(f.bytes));assert(f.value.zip_base64_chunks.length>1);
 for(const value of [{...f.value,zip_bytes:1},{...f.value,artifact_id:12},{...f.value,zip_base64_chunks:f.value.zip_base64_chunks.slice(1)},{...f.value,zip_base64_chunks:['!']},{...f.value,encoding:'utf8'}])assert.throws(()=>Cache.decode(value,f.a));
 assert.throws(()=>Cache.encode({...f.a,artifact_sha256:'0'.repeat(64)},f.bytes),/DIGEST/);assert.throws(()=>Cache.pathFor('../business'));
});
test('publisher commits signal and verified byte cache atomically, without a second event or a model invocation',()=>{
 const f=fixture(),c=V.sealContract({schema_version:'kodjo.vnext.work-transport.v1',repository:'owner/repo',transport_pr:42,transport_branch:'orchestration/vnext-work-signals',automation_id:'A',conversation_id:'C',allowed_workflows:[{path:'.github/workflows/check.yml',artifact_prefix:'check-',operation_kind:'CI'}]});
 const op=E.descriptor({kind:'CI',repository:c.repository,source_head:'a'.repeat(40),request_path:null,request_hash:null,slice_id:null,issue_number:8,bootstrap_hash:null,subject_ref:'https://github.com/owner/repo/pull/8'});
 const run={id:9,run_attempt:1,status:'completed',conclusion:'success',event:'pull_request',path:c.allowed_workflows[0].path,head_sha:'a'.repeat(40),repository:{full_name:c.repository,id:1},head_repository:{full_name:c.repository,id:1},actor:{login:'owner'}};
 const files=[{path:'proof.json',sha256:'f'.repeat(64),bytes:100}],archives=[{...f.a,artifact_name:'check',run_id:9,run_attempt:1,run_head:run.head_sha,files,manifest_hash:V.canonicalHash(files)}];
 const signal=E.makeSignal(c,op,run,[{id:10,run_id:9,status:'completed',name:'check',conclusion:'success',started_at:'2026-10-15T00:00:00Z',completed_at:'2026-10-15T00:01:00Z'}],archives);
 let head='1'.repeat(40),count=1,patches=0;const blobs=new Map();let entries;
 const api=(url,method='GET',data)=>{
  if(url.endsWith('/pulls/42'))return {state:'open',head:{repo:{full_name:c.repository},ref:c.transport_branch,sha:head}};
  if(url.endsWith('/git/refs/heads/'+c.transport_branch)){if(method==='PATCH'){assert.equal(data.force,false);head=data.sha;patches++;}return {object:{sha:head}};}
  if(url.includes('/contents/'))return null;
  if(url.includes('/git/commits/'))return {tree:{sha:'2'.repeat(40)}};
  if(url.endsWith('/git/blobs')){const sha=String(++count).padStart(40,'0');blobs.set(sha,data.content);return {sha};}
  if(url.endsWith('/git/trees')){entries=data.tree;return {sha:'3'.repeat(40)};}
  if(url.endsWith('/git/commits'))return {sha:'4'.repeat(40)};
  throw Error(url);
 };
 const result=W.publish(c,signal,api,[f.value]);assert.equal(result.status,'SIGNAL_PUBLISHED');assert.equal(patches,1);assert.equal(entries.length,2);
 const cached=entries.find(e=>e.path===Cache.pathFor(f.a.artifact_sha256));assert(Cache.decode(JSON.parse(blobs.get(cached.sha)),f.a).equals(f.bytes));
 let calls=0;assert.throws(()=>W.publish(c,signal,()=>{calls++;},[{...f.value,artifact_id:999}]),/NOT_IN_SIGNAL/);assert.equal(calls,0);
});

test('only exact archive cache JSON is nonnormative; executable, malformed and mixed paths remain qualified',()=>{
 const Impact=require('../../scripts/kodjo/classify-protocol-impact'),cache=Cache.pathFor('a'.repeat(64));
 assert.equal(Impact.classifyFiles([cache]).full_windows_required,false);
 for(const paths of [[cache.replace('.json','.js')],[cache.replace('a'.repeat(64),'arbitrary')],[cache,'scripts/kodjo/signal-vnext-agent-continuation.js']])assert.equal(Impact.classifyFiles(paths).full_windows_required,true);
});
