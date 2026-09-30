'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
function transport(){
 const source=fs.readFileSync(path.join(root,'.github/workflows/kodjo-v2-next-evolution-independent-audit.yml'),'utf8').replace(/\r\n/g,'\n');
 const match=source.match(/          \$previousOutputEncoding=\$OutputEncoding\n([\s\S]*?)          }\n          \$status=git status/);
 assert.ok(match,'actual workflow transport block');
 return ('$previousOutputEncoding=$OutputEncoding\n'+match[1]+'          }').replace(/^          /gm,'');
}
test('audit prompt transport keeps the dossier out of native argv and restores UTF-8 input encoding',()=>{
 const block=transport();assert.match(block,/\$prompt \| & claude -p /);assert.doesNotMatch(block,/permissions \$prompt/);
 assert.match(block,/UTF8Encoding\(\$false\)/);assert.match(block,/finally \{\s*\$OutputEncoding=\$previousOutputEncoding/);
});
test('actual audit transport through PowerShell 5.1 and npm-style shim preserves a large Unicode dossier', {skip:process.platform!=='win32'},()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-audit-transport-'));
 try{
  const prompt=('Réserve majeure : périmètre, clôture, dépendance — 🚦\n').repeat(2500)+'END_DOSSIER';
  assert.ok(prompt.length>32767);
  fs.writeFileSync(path.join(d,'prompt.txt'),prompt,'utf8');
  fs.writeFileSync(path.join(d,'probe.js'),"const fs=require('node:fs'),crypto=require('node:crypto');const text=fs.readFileSync(0,'utf8').replace(/\\r\\n/g,'\\n').trimEnd();console.log(JSON.stringify({hash:crypto.createHash('sha256').update(text).digest('hex'),args:process.argv.slice(2),length:text.length}));");
  // Reproduce the npm PowerShell shim's input forwarding to a real native process.
  fs.writeFileSync(path.join(d,'claude.ps1'),"if($MyInvocation.ExpectingInput){$input | & $env:TRANSPORT_NODE (Join-Path $PSScriptRoot 'probe.js') @args}else{& $env:TRANSPORT_NODE (Join-Path $PSScriptRoot 'probe.js') @args}\nexit $LASTEXITCODE\n");
  const script="$ErrorActionPreference='Stop'\n$env:PATH=$PSScriptRoot+';'+$env:PATH\n$prompt=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'prompt.txt') -Raw -Encoding UTF8\n$out=Join-Path $PSScriptRoot 'out.json'\n$err=Join-Path $PSScriptRoot 'err.txt'\n$before=$OutputEncoding\n"+transport()+"\nif($code-ne0){throw 'native probe failed'}\nif($OutputEncoding-ne$before){throw 'encoding was not restored'}\n";
  fs.writeFileSync(path.join(d,'run.ps1'),script);
  const r=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(d,'run.ps1')],{encoding:'utf8',timeout:30000,env:{...process.env,TRANSPORT_NODE:process.execPath}});
  assert.equal(r.status,0,r.stderr||String(r.error));
  const bytes=fs.readFileSync(path.join(d,'out.json'));const result=JSON.parse(bytes.toString(bytes[0]===255&&bytes[1]===254?'utf16le':'utf8').replace(/^\uFEFF/,''));
  assert.equal(result.hash,crypto.createHash('sha256').update(prompt).digest('hex'));assert.equal(result.length,prompt.length);
  assert.deepEqual(result.args,['-p','--output-format','json','--dangerously-skip-permissions']);
 }finally{fs.rmSync(d,{recursive:true,force:true});}
});
