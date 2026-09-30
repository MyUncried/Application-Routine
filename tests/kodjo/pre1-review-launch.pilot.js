'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),test=require('node:test'),assert=require('node:assert/strict');
const {resolve,PACKAGE_EXE}=require('../../scripts/kodjo/resolve-claude-binary');
const {verify}=require('../../scripts/kodjo/verify-pre1-closure-review');

test('claude.exe is resolved from the npm launcher directory when absent from PATH',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'claude-resolve-'));
  try{
    const npm=path.join(dir,'npm'),other=path.join(dir,'other');
    fs.mkdirSync(other);fs.mkdirSync(path.join(npm,path.dirname(PACKAGE_EXE)),{recursive:true});
    fs.writeFileSync(path.join(npm,'claude.ps1'),'');
    assert.throws(()=>resolve({PATH:other}),/CLAUDE_BINARY_NOT_FOUND/);
    fs.writeFileSync(path.join(npm,PACKAGE_EXE),'');
    assert.equal(resolve({PATH:[other,npm].join(path.delimiter)}),path.resolve(npm,PACKAGE_EXE));
    assert.equal(resolve({PATH:other,APPDATA:dir}),path.resolve(npm,PACKAGE_EXE));
    fs.writeFileSync(path.join(other,'claude.exe'),'');
    assert.equal(resolve({PATH:[other,npm].join(path.delimiter)}),path.resolve(other,'claude.exe'));
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

const prior={findings:Array.from({length:11},(_,i)=>({category:'SCOPE',target_kind:'PATH',target:'src/f'+(i+1)+'.ts',blocking:true}))};
const closures=open=>'<KODJO_PRE1_CLOSURE_JSON>\n'+JSON.stringify({closures:Array.from({length:11},(_,i)=>({finding:i+1,closed:!open.includes(i+1),correction_examined:'c',evidence:'e',justification:'j'}))})+'\n</KODJO_PRE1_CLOSURE_JSON>\n';
const table=open=>'| N | Correction examinée | Preuve précise | Fermé | Justification |\n|---|---|---|---|---|\n'+Array.from({length:11},(_,i)=>'| '+(i+1)+' | c | `A \\| B` | '+(open.includes(i+1)?'NON':'OUI')+' | j |').join('\n')+'\n';
const row=(n,extra={})=>({category:'SCOPE',target_kind:'PATH',target:'src/f'+n+'.ts',blocking:true,diagnostic:'Prior finding '+n+': unmet',...extra});

test('closure guard accepts eleven closures and bound REVISE rows',()=>{
  assert.deepEqual(verify(table([])+closures([]),{verdict:'APPROVE',findings:[]},prior).closed.length,11);
  const r=verify(table([3])+closures([3]),{verdict:'REVISE',findings:[row(3)]},prior);
  assert.deepEqual([r.verdict,r.open],['REVISE',[3]]);
});

test('closure guard rejects a twelfth subject, observations and inconsistencies',()=>{
  assert.throws(()=>verify(table([])+closures([]),{verdict:'REVISE',findings:[row(12,{target:'src/new.ts'})]},prior),/OUTSIDE_ELEVEN/);
  assert.throws(()=>verify(table([])+closures([]),{verdict:'APPROVE',findings:[row(2,{blocking:false})]},prior),/NONBLOCKING/);
  assert.throws(()=>verify(table([2])+closures([2]),{verdict:'REVISE',findings:[row(2,{diagnostic:'Prior finding 5: x'})]},prior),/NUMBER_MISMATCH/);
  assert.throws(()=>verify(table([])+closures([]),{verdict:'REVISE',findings:[row(4)]},prior),/CONTRADICTS/);
  assert.throws(()=>verify(table([]),{verdict:'APPROVE',findings:[]},prior),/CLOSURE_JSON_MISSING/);
  assert.throws(()=>verify(closures([]),{verdict:'APPROVE',findings:[]},prior),/TABLE_NOT_ELEVEN_ROWS/);
});
