'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path'), { execFileSync } = require('node:child_process');
const Batch = require('../../scripts/kodjo/lib/vnext-git-batch');
function fixture(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext-batch-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true, maxRetries:10,retryDelay:100 }));
  const git = (...args) => execFileSync('git', args, { cwd, stdio:['pipe','pipe','pipe'], windowsHide:true });
  git('init'); git('config','user.name','Test'); git('config','user.email','test@example.invalid');
  git('config','core.autocrlf','false');
  const files = ['écran espace.js','empty.js','binary.js'];
  fs.writeFileSync(path.join(cwd,files[0]),Buffer.from('écran\r\nline\n'));
  fs.writeFileSync(path.join(cwd,files[1]),''); fs.writeFileSync(path.join(cwd,files[2]),Buffer.from([0,255,10,13,0]));
  for(let i=0;i<130;i++){ const file='entry-'+i+'.js'; files.push(file);fs.writeFileSync(path.join(cwd,file),'module.exports='+i+';\n'); }
  git('add','.');git('commit','-m','batch fixture'); const revision=git('rev-parse','HEAD').toString().trim();
  return {cwd,git,files,revision};
}
test('batch reads preserve exact Git bytes across chunks, packing and changed checkout with bounded process count',t=>{
  const f=fixture(t);f.git('repack','-ad');fs.writeFileSync(path.join(f.cwd,f.files[0]),'changed checkout');
  const calls=[];
  const result=Batch.readBlobs({revision:f.revision,files:f.files,run:(args,input)=>{calls.push(args);return execFileSync('git',args,{cwd:f.cwd,input,windowsHide:true});}});
  assert.equal(calls.length,3);assert.equal(calls.filter(a=>a[0]==='cat-file').length,2);
  for(const file of f.files)assert.deepEqual(result.get(file),f.git('show',f.revision+':'+file));
  f.git('add','.');f.git('commit','-m','new checkout revision'); const revision=f.git('rev-parse','HEAD').toString().trim();
  assert.equal(Batch.readBlobs({revision,files:[f.files[0]],run:(a,input)=>execFileSync('git',a,{cwd:f.cwd,input})}).get(f.files[0]).toString(),'changed checkout');
});
test('batch refuses absent paths, altered bytes, wrong objects, truncation and trailing data',t=>{
  const f=fixture(t),run=(a,input)=>execFileSync('git',a,{cwd:f.cwd,input});
  assert.throws(()=>Batch.readBlobs({revision:f.revision,files:['absent.js'],run}),/PATH_ABSENT/);
  for(const mutate of [b=>b.subarray(0,b.length-2),b=>Buffer.concat([b,Buffer.from('extra')]),b=>{const c=Buffer.from(b);c[0]=c[0]===97?98:97;return c;},b=>{const c=Buffer.from(b);c[c.indexOf(10)+1]^=1;return c;}]){
    assert.throws(()=>Batch.readBlobs({revision:f.revision,files:[f.files[0]],run:(a,input)=>{const b=run(a,input);return a[0]==='cat-file'?mutate(b):b;}}),/VNEXT_GIT_BATCH_/);
  }
});
