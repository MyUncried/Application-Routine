'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const P=require('../../scripts/kodjo/lib/vnext-publication');
const root=path.resolve(__dirname,'../..');
test('publication compiles the complete frozen Figma async function body without execution, rejects invalid Figma and ordinary Node syntax',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-context-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const rel='docs/preparation/PRE-3/planification/controle-fraicheur-figma.js',file=path.join(dir,'capture.js');
 const compile=(relative)=>spawnSync(process.execPath,P.javascriptSyntaxArgs(relative,file),{encoding:'utf8'});
 fs.writeFileSync(file,fs.readFileSync(path.join(root,rel)));assert.equal(compile(rel).status,0);
 fs.writeFileSync(file,'await figma.getNodeByIdAsync("id"); return {valid:true};');assert.equal(compile(rel).status,0);
 assert.notEqual(compile('scripts/kodjo/example.js').status,0);
 fs.writeFileSync(file,'await figma.getNodeByIdAsync(; return {};');assert.notEqual(compile(rel).status,0);
 fs.writeFileSync(file,'throw Error("must never execute"); return {};');assert.equal(compile(rel).status,0);
});
