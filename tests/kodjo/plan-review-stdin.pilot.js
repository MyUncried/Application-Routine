'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {run}=require('../../scripts/kodjo/run-plan-review-cli');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pre1-stdin-'));
try{
 const promptFile=path.join(dir,'prompt with spaces.txt'),outputFile=path.join(dir,'result.json'),errorFile=path.join(dir,'stderr.txt'),fixture=path.join(dir,'fake-cli.js');
 fs.writeFileSync(fixture,"let s='';process.stdin.setEncoding('utf8');process.stdin.on('data',x=>s+=x);process.stdin.on('end',()=>{process.stdout.write(JSON.stringify({prompt:s,args:process.argv.slice(2)}));if(process.env.PRE1_FIXTURE_FAIL){process.stderr.write('fixture failure');process.exitCode=7;}});");
 const prompt='Catégorie « Aucun »\r\n"quoted value" -> next\n--resume fake\n`$() ; & | \\ paths\n'+JSON.stringify({findings:[{expected:'"exact" -> value'}]})+'\n'+'é'.repeat(180000);
 fs.writeFileSync(promptFile,prompt);
 const invoke=session=>run({binary:process.execPath,binaryArgs:[fixture],promptFile,outputFile,errorFile,session});
 assert.equal(invoke(''),0);let got=JSON.parse(fs.readFileSync(outputFile,'utf8'));assert.equal(got.prompt,prompt);assert.deepEqual(got.args,['-p','--output-format','json','--dangerously-skip-permissions']);
 const session='390b171d-4fed-4fa4-b9d0-82ce6584b7be';assert.equal(invoke(session),0);got=JSON.parse(fs.readFileSync(outputFile,'utf8'));assert.equal(got.prompt,prompt);assert.deepEqual(got.args,['-p','--resume',session,'--output-format','json','--dangerously-skip-permissions']);
 process.env.PRE1_FIXTURE_FAIL='1';assert.equal(invoke(''),7);assert.equal(fs.readFileSync(errorFile,'utf8'),'fixture failure');delete process.env.PRE1_FIXTURE_FAIL;
 assert.throws(()=>invoke('invalid-session'),/SESSION_INVALID/);
 console.log('PASS: exact Unicode/multiline/quotes/arrows/large-prompt stdin; fixed argv; resume; failure capture; invalid session. No Claude call performed.');
}finally{delete process.env.PRE1_FIXTURE_FAIL;fs.rmSync(dir,{recursive:true,force:true});}
