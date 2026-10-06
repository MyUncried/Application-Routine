#!/usr/bin/env node
'use strict';
// One independent read-only audit; never an implementation or runtime relaunch.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const Chain=require('./lib/vnext-live-chain'),Lock=require('./lib/execution-lock');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function inventory(cwd){return Chain.command('git',['ls-files','-z'],cwd).split('\0').filter(Boolean).map(file=>({file,sha256:sha(fs.readFileSync(path.join(cwd,file)))}));}
function main(directory,{cwd=process.cwd(),env=process.env,invoke=Chain.command}={}){
 if(process.platform!=='win32'||env.GITHUB_ACTIONS!=='true'||env.GITHUB_REPOSITORY!=='MyUncried/Application-Routine'||env.GITHUB_RUN_ATTEMPT!=='1'||env.RUNNER_NAME!==env.EXPECTED_RUNNER_NAME||!env.EXPECTED_RUNNER_NAME||env.QUALIFICATION_RESULT!=='success'||!String(env.AUDIT_BRANCH).startsWith('qualification/vnext-stabilization-audit-'))throw Error('VNEXT_STABILIZATION_AUDIT_CONTEXT_REFUSED');
 const head=Chain.command('git',['rev-parse','HEAD'],cwd).trim();if(head!==env.CANDIDATE_SHA)throw Error('VNEXT_STABILIZATION_AUDIT_HEAD_MISMATCH');
 if(Chain.command('git',['status','--porcelain','--untracked-files=all'],cwd).trim())throw Error('VNEXT_STABILIZATION_AUDIT_DIRTY');
 if(Lock.claudeProcessState().state!=='NONE')throw Error('VNEXT_STABILIZATION_AUDIT_OTHER_CLAUDE');
 const dir=path.resolve(directory),relative=path.relative(fs.realpathSync(cwd),dir);if(!relative||(!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative)))throw Error('VNEXT_STABILIZATION_AUDIT_EXTERNAL_EVIDENCE_REQUIRED');
 fs.mkdirSync(dir,{recursive:true});const resultPath=path.join(dir,'stabilization-response.json');if(fs.existsSync(resultPath)||fs.existsSync(path.join(dir,'stabilization-process.json')))throw Error('VNEXT_STABILIZATION_AUDIT_ALREADY_STARTED');
 const before=inventory(cwd),qualifications=['Linux','Windows'].map(platform=>{
  const file=path.join(dir,'qualification','vnext-controls-'+platform+'.txt'),bytes=fs.readFileSync(file),text=bytes.toString('utf8');
  const count=key=>{const m=new RegExp('(?:^|\\n)[^\\n]*\\b'+key+' ([0-9]+)\\s*(?:\\r?\\n|$)').exec(text);if(!m)throw Error('VNEXT_STABILIZATION_CONTROL_RESULT_MISSING:'+platform+':'+key);return Number(m[1]);};
  const result={platform,file,sha256:sha(bytes),tests:count('tests'),pass:count('pass'),fail:count('fail'),skipped:count('skipped')};
  if(result.tests<1||result.pass!==result.tests||result.fail!==0||result.skipped!==0)throw Error('VNEXT_STABILIZATION_CONTROLS_NOT_PASSED:'+platform);return result;
 });
 fs.writeFileSync(path.join(dir,'stabilization-input.json'),JSON.stringify({candidate_sha:head,github_run_id:env.GITHUB_RUN_ID,qualifications,files:before},null,2)+'\n',{flag:'wx'});
 const mcp=path.join(dir,'empty-mcp.json'),settings=path.join(dir,'read-only-settings.json');fs.writeFileSync(mcp,JSON.stringify({mcpServers:{}}));fs.writeFileSync(settings,JSON.stringify({disableAllHooks:true}));
 const prompt=fs.readFileSync(path.join(cwd,'.github/orchestration/KODJO_VNEXT_STABILIZATION_AUDIT_MISSION.md'),'utf8')+'\nExact candidate SHA: '+head+'\nAudit input manifest: '+path.join(dir,'stabilization-input.json');
 const childEnv={...env};for(const key of ['GH_TOKEN','GITHUB_TOKEN','KODJO_LIVE_GH_TOKEN','KODJO_VNEXT_CONSUMPTION_TOKEN'])delete childEnv[key];
 const args=['--add-dir',dir,'-p','--restricted','--permission-mode','dontAsk','--permission-prompts','none','--output-format','json','--tools','Read,Glob,Grep','--allowedTools','Read,Glob,Grep','--disallowedTools','mcp__*,Bash,Edit,Write','--strict-mcp-config','--mcp-config',mcp,'--settings',settings];
 let primary;
 try{
  const raw=invoke(require('./lib/claude-local').resolveClaudeBinary(),args,cwd,prompt,childEnv,7200000,{onResult:r=>{fs.writeFileSync(path.join(dir,'stabilization-process.json'),JSON.stringify(r,null,2)+'\n',{flag:'wx'});fs.writeFileSync(resultPath,r.stdout||'',{flag:'wx'});}});
  const response=JSON.parse(raw);if(response.type!=='result'||response.is_error||!response.session_id||typeof response.result!=='string'||!response.result.trim())throw Error('VNEXT_STABILIZATION_AUDIT_RESULT_INVALID');
  fs.writeFileSync(path.join(dir,'stabilization-report.md'),response.result,{flag:'wx'});
  fs.writeFileSync(path.join(dir,'stabilization-receipt.json'),JSON.stringify({candidate_sha:head,session_id:response.session_id,raw_sha256:sha(raw),input_sha256:sha(JSON.stringify(before)),status:'READ_ONLY_AUDIT_RETURNED_NOT_RUNTIME_APPROVAL'},null,2)+'\n',{flag:'wx'});
 }catch(error){primary=error;throw error;}
 finally{
  const clean=!Chain.command('git',['status','--porcelain','--untracked-files=all'],cwd).trim()&&JSON.stringify(before)===JSON.stringify(inventory(cwd));
  if(!clean)throw Error((primary?primary.message+'; ':'')+'VNEXT_STABILIZATION_AUDIT_CHECKOUT_CHANGED');
 }
}
if(require.main===module){try{main(process.argv[2]);}catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}}
module.exports={main,inventory};
