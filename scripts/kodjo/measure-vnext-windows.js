#!/usr/bin/env node
'use strict';
// Bounded diagnostic, never an operational qualification or Claude invocation.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),Module=require('node:module'),crypto=require('node:crypto'),{spawnSync,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),baseline='e0c766feda827c2df6d3d8a523759007a9f05c85';
const selected=['vnext-live-chain.pilot.js','vnext-runtime-plan.pilot.js','vnext-post-acceptance.pilot.js','vnext12-revision-supervisor.pilot.js'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function git(args,cwd=root){return execFileSync('git',args,{cwd,windowsHide:true,stdio:['pipe','pipe','pipe']});}
function loadBefore(){
 // Only Impact changed in this dependency closure; refuse an incomparable baseline.
 for(const name of ['vnext-contract','scope-path','plan-impact','requirement-registry','source-manifest']){
  const file='scripts/kodjo/lib/'+name+'.js';if(!git(['show',baseline+':'+file]).equals(fs.readFileSync(path.join(root,file))))throw Error('VNEXT_PERF_BASELINE_DEPENDENCY_CHANGED:'+file);
 }
 const file=path.join(root,'scripts/kodjo/lib/impact-graph.js'),m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(git(['show',baseline+':scripts/kodjo/lib/impact-graph.js']).toString('utf8'),file);return m.exports;
}
function scanner(mode,cwd){
 const I=mode==='before'?loadBefore():require('./lib/impact-graph'),revision=git(['rev-parse','HEAD'],cwd).toString().trim();
 const manifest=I.buildCandidateManifest({cwd,revision}),start=performance.now();
 const scan=I.scanOneLevelDirectImporters({cwd,candidateManifest:manifest,modifyCandidateIds:[manifest.candidates.find(c=>c.path==='target.js').candidate_id]});
 return {mode,duration_ms:performance.now()-start,scan};
}
function run(directory){
 if(!path.isAbsolute(directory)||fs.existsSync(directory))throw Error('VNEXT_PERF_NEW_ABSOLUTE_DIRECTORY_REQUIRED');fs.mkdirSync(directory,{recursive:true});
 const head=git(['rev-parse','HEAD']).toString().trim();if(process.env.VNEXT_PERF_EXPECTED_HEAD&&head!==process.env.VNEXT_PERF_EXPECTED_HEAD)throw Error('VNEXT_PERF_HEAD_MOVED');
 const result={status:'IN_PROGRESS',diagnostic_only:true,operational_qualification:false,claude_invoked:false,baseline,head,platform:process.platform,node:process.version,selected_files:selected,scanner:[],concurrency:[]};
 const save=()=>fs.writeFileSync(path.join(directory,'summary.json'),JSON.stringify(result,null,2)+'\n');save();
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-perf-measure-'));
 try{
  git(['init','--quiet'],fixture);git(['config','user.name','VNext benchmark'],fixture);git(['config','user.email','benchmark@example.invalid'],fixture);git(['config','core.autocrlf','false'],fixture);
  fs.writeFileSync(path.join(fixture,'target.js'),'module.exports=1;\n');for(let i=0;i<700;i++)fs.writeFileSync(path.join(fixture,'entry-'+i+'.js'),i%10===0?"module.exports=require('./target');\n":'module.exports='+i+';\n');
  git(['add','.'],fixture);git(['-c','core.hooksPath='+path.join(fixture,'no-hooks'),'commit','--quiet','-m','synthetic measured sources'],fixture);
  const baseEnv={...process.env};for(const key of ['GH_TOKEN','GITHUB_TOKEN','ANTHROPIC_API_KEY','KODJO_LIVE_GH_TOKEN','KODJO_VNEXT_CONSUMPTION_TOKEN'])delete baseEnv[key];
  for(const mode of ['before','after']){
   const child=spawnSync(process.execPath,[__filename,'--scanner',mode,fixture],{cwd:root,env:baseEnv,encoding:'utf8',windowsHide:true,timeout:180000,maxBuffer:16*1024*1024});
   fs.writeFileSync(path.join(directory,'scanner-'+mode+'.json'),child.stdout||'');fs.writeFileSync(path.join(directory,'scanner-'+mode+'.stderr.log'),child.stderr||'');
   if(child.error||child.status!==0)throw Error('VNEXT_PERF_SCANNER_FAILED:'+mode+':'+(child.error?.code||child.status));result.scanner.push(JSON.parse(child.stdout));save();
  }
  if(JSON.stringify(result.scanner[0].scan)!==JSON.stringify(result.scanner[1].scan))throw Error('VNEXT_PERF_SCAN_NOT_EQUIVALENT');result.scanner_equivalent=true;
  for(const concurrency of [1,2,4]){
   const profile=path.join(directory,'profile-'+concurrency),start=performance.now();
   const child=spawnSync(process.execPath,['--test','--test-concurrency='+concurrency,...selected.map(f=>path.join(root,'tests/kodjo',f))],{cwd:root,env:{...baseEnv,KODJO_VNEXT_PERF_DIR:profile},encoding:'utf8',windowsHide:true,timeout:240000,maxBuffer:32*1024*1024});
   const stdout=child.stdout||'',stderr=child.stderr||'';fs.writeFileSync(path.join(directory,'tests-'+concurrency+'.log'),stdout);fs.writeFileSync(path.join(directory,'tests-'+concurrency+'.stderr.log'),stderr);
   const count=name=>{const m=new RegExp('(?:ℹ |# )'+name+' ([0-9]+)').exec(stdout);return m?Number(m[1]):null;};
   const row={concurrency,duration_ms:performance.now()-start,exit_code:child.status,error_code:child.error?.code||null,tests:count('tests'),pass:count('pass'),fail:count('fail'),skipped:count('skipped'),stdout_sha256:hash(stdout)};result.concurrency.push(row);save();
   if(child.error||child.status!==0||row.tests===null||row.fail!==0)throw Error('VNEXT_PERF_TARGETED_TESTS_FAILED:'+concurrency);
  }
  const reference=result.concurrency[0];if(result.concurrency.some(r=>r.tests!==reference.tests||r.pass!==reference.pass||r.skipped!==reference.skipped))throw Error('VNEXT_PERF_CONCURRENCY_COVERAGE_CHANGED');
  result.fastest_observed_concurrency=[...result.concurrency].sort((a,b)=>a.duration_ms-b.duration_ms)[0].concurrency;result.status='DIAGNOSTIC_PASS';save();return result;
 }catch(e){result.status='DIAGNOSTIC_FAILED';result.error=e.message;save();throw e;}
 finally{fs.rmSync(fixture,{recursive:true,force:true,maxRetries:10,retryDelay:200});}
}
if(require.main===module){try{const a=process.argv.slice(2);if(a[0]==='--scanner'){if(!['before','after'].includes(a[1])||!path.isAbsolute(a[2]))throw Error('VNEXT_PERF_WORKER_INVALID');process.stdout.write(JSON.stringify(scanner(a[1],a[2])));}else{if(a.length!==1)throw Error('Usage: node measure-vnext-windows.js ABSOLUTE_NEW_DIRECTORY');console.log(JSON.stringify(run(a[0])));}}catch(e){process.stderr.write(e.message+'\n');process.exitCode=1;}}
module.exports={run,scanner,selected};
