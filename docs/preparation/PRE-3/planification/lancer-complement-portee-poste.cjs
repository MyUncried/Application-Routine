'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const CANDIDATE='bdfde87b9f034021dc30c6412071e895283d716c';
const root=path.resolve(__dirname,'../../../..');
function command(bin,args,cwd=root,inherit=false){const r=spawnSync(bin,args,{cwd,encoding:'utf8',shell:false,windowsHide:true,stdio:inherit?'inherit':['ignore','pipe','pipe']});if(r.error)throw r.error;if(r.status!==0)throw Error('Command failed: '+path.basename(bin)+' '+args[0]+'. Preserve all evidence; no automatic retry.');return r.stdout?.trim();}
const recover=process.argv[2]==='--recover';if(process.argv.slice(2).some(x=>x!=='--recover')||process.argv.length>3)throw Error('Usage: launcher [--recover]');
if(Number(process.versions.node.split('.')[0])<24)throw Error('Node 24+ required');
const operation=path.join(os.tmpdir(),'p3-1d424791'),original=path.join(operation,'evidence-lf');
const produced=path.join(original,'produced.json'),receipt=[path.join(original,'review-receipt.json'),path.join(original,'revue-pre3-lisible.json')].find(fs.existsSync);
if(!fs.existsSync(produced)||!receipt)throw Error('Original sealed produced.json and review receipt required in '+original+'; no reconstruction or INITIAL relaunch.');
const work=path.join(operation,'scope-reentry-'+CANDIDATE.slice(0,8)),checkout=path.join(work,'checkout'),evidence=path.join(work,'evidence'),output=path.join(evidence,'scope-review-receipt.json'),config=path.join(evidence,'scope-review-config.json');
console.log('Operation #340; independent scope supplement only. Durable evidence: '+evidence);
if(fs.existsSync(output))throw Error('Scope receipt already exists: '+output+'; return it instead of invoking Claude again.');
if(recover){if(!fs.existsSync(config))throw Error('No existing scope config to recover');command(process.execPath,['--max-old-space-size=7168','scripts/kodjo/vnext-chain.js','recover-review-scope',config,output],checkout,true);console.log('Recovered: '+output);}
else{
 if(fs.existsSync(work))throw Error('Existing scope operation: inspect evidence; do not launch a duplicate. Use --recover only for a durable response.');
 command('git',['fetch','origin','main'],root,true);const head=command('git',['rev-parse','FETCH_HEAD']);
 try{command('git',['merge-base','--is-ancestor',CANDIDATE,head]);}catch{throw Error('PR #347 must be qualified and merged into main before this launch. No reviewer invoked.');}
 const files=['scripts/kodjo/lib/vnext-review-scope.js','scripts/kodjo/lib/revision-contract.js','scripts/kodjo/lib/vnext-live-chain.js','scripts/kodjo/vnext-chain.js'];
 for(const file of files)if(command('git',['rev-parse',head+':'+file])!==command('git',['rev-parse',CANDIDATE+':'+file]))throw Error('Qualified protocol bytes changed: '+file+'. No invocation.');
 fs.mkdirSync(work,{recursive:true});command('git',['-c','core.autocrlf=false','worktree','add','--detach',checkout,head],root,true);
 const claude=require(path.join(checkout,'scripts/kodjo/lib/claude-local')).resolveClaudeBinary();command(claude,['--version'],checkout,true);
 let auth;try{auth=JSON.parse(command(claude,['auth','status'],checkout));}catch{throw Error('Claude authentication status unavailable; preserve operation folder.');}if(!auth.loggedIn)throw Error('Claude local login required; no reviewer invoked.');console.log('Claude authenticated; account details omitted.');
 command(process.execPath,['--max-old-space-size=7168',path.join(__dirname,'preparer-complement-portee.cjs'),produced,receipt,evidence,checkout],root,true);
 console.log('Starting independent scope supplement. Follow '+path.join(evidence,'claude-scope','scope-review-progress.json'));
 command(process.execPath,['--max-old-space-size=7168','scripts/kodjo/vnext-chain.js','review-scope',config,output],checkout,true);
 console.log('Completed scope receipt: '+output+'; findings remain open until correction and plan review.');
}
