'use strict';
// Disposable browser measurement, never a native-device certification.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawn,execFile}=require('node:child_process'),{pathToFileURL}=require('node:url');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function invoke(file,args){return new Promise((resolve,reject)=>execFile(file,args,{windowsHide:true,timeout:15000,maxBuffer:1024*1024},(error,stdout,stderr)=>error?reject(Object.assign(error,{diagnostic_stderr:stderr})):resolve(stdout)));}
async function profileProcesses(profile){
 const literal="'"+profile.replace(/'/g,"''")+"'";
 const script="$ErrorActionPreference='Stop'; $profile="+literal+"; $rows=@(Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne $PID -and $_.Name -notmatch '^(powershell|pwsh)\\.exe$' -and $_.CommandLine -and $_.CommandLine.Contains($profile) } | Select-Object ProcessId,ParentProcessId,Name); ConvertTo-Json -InputObject $rows -Compress";
 return JSON.parse((await invoke('powershell.exe',['-NoProfile','-NonInteractive','-Command',script])).trim()||'[]');
}
function waitForClose(child,timeout){
 if(child.exitCode!==null||child.signalCode!==null)return Promise.resolve(true);
 return new Promise(resolve=>{const finish=value=>{clearTimeout(timer);child.removeListener('close',closed);resolve(value);},closed=()=>finish(true),timer=setTimeout(()=>finish(false),timeout);child.once('close',closed);});
}
function waitForExit(child,timeout){
 if(child.exitCode!==null||child.signalCode!==null)return Promise.resolve(true);
 return new Promise(resolve=>{const finish=value=>{clearTimeout(timer);child.removeListener('exit',exited);resolve(value);},exited=()=>finish(true),timer=setTimeout(()=>finish(false),timeout);child.once('exit',exited);});
}
async function closeProcess(child,{profile,platform=process.platform,inventory=profileProcesses,terminate=invoke,wait=waitForExit,profileTimeoutMs=10000,diagnostic={}}){
 diagnostic.pid=child?.pid||null;diagnostic.profile=profile;
 if(child?.pid){
  diagnostic.graceful_exit=await wait(child,3000);
  if(!diagnostic.graceful_exit){
   diagnostic.forced_close=true;
   if(platform==='win32'){
    try{await terminate('taskkill.exe',['/PID',String(child.pid),'/F']);}
    catch(error){diagnostic.force_error={message:error.message,stderr:error.diagnostic_stderr||null};}
   }else child.kill('SIGKILL');
  }
 }
 // Descendants can keep inherited streams open after the root exits. Inventory
 // and terminate our unique profile BEFORE waiting for root/stream completion.
 if(platform==='win32'){
  const deadline=Date.now()+profileTimeoutMs;diagnostic.profile_process_checks=[];
  do{
   const rows=await inventory(profile);diagnostic.profile_process_checks.push({at:new Date().toISOString(),processes:rows});
   if(!rows.length){diagnostic.profile_processes_closed=true;break;}
   if(Date.now()>=deadline)throw Error('VNEXT_FIGMA_BROWSER_PROFILE_PROCESSES_REMAIN');
   for(const row of rows){
    if(!Number.isSafeInteger(row.ProcessId)||row.ProcessId<=0||row.ProcessId===process.pid)throw Error('VNEXT_FIGMA_BROWSER_PROFILE_PID_INVALID');
    try{await terminate('taskkill.exe',['/PID',String(row.ProcessId),'/F']);}
    catch(error){(diagnostic.profile_termination_errors||=[]).push({pid:row.ProcessId,message:error.message,stderr:error.diagnostic_stderr||null});}
   }
   await delay(200);
  }while(true);
 }
 if(child?.pid){
  if(!await wait(child,10000))throw Error('VNEXT_FIGMA_BROWSER_PROCESS_NOT_CLOSED');
  if(diagnostic.force_error)diagnostic.force_raced_with_exit=true;
  diagnostic.exit_code=child.exitCode;diagnostic.signal=child.signalCode;
  // Once root exit and profile absence are verified, detach inherited pipes;
  // no observed process remains which can produce browser diagnostics.
  child.stdout?.destroy();child.stderr?.destroy();
 }
 diagnostic.process_close_verified=true;
}
async function cleanupProfile({child,profile,directory,stderr,primaryError,diagnostic={},close=closeProcess,remove=fs.rmSync}){
 fs.writeFileSync(path.join(directory,'browser-stderr.log'),stderr);
 try{
  await close(child,{profile,diagnostic});
  remove(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200});diagnostic.profile_removed=true;
 }catch(error){
  diagnostic.cleanup_error={message:error.message,code:error.code||null,stderr:error.diagnostic_stderr||null};
  if(primaryError)primaryError.cleanup_error=diagnostic.cleanup_error;else throw error;
 }finally{fs.writeFileSync(path.join(directory,'browser-cleanup.json'),JSON.stringify(diagnostic,null,2)+'\n');}
}
function resolveBrowser(env=process.env,exists=fs.existsSync){
 if(env.KODJO_FIGMA_BROWSER&&(!path.isAbsolute(env.KODJO_FIGMA_BROWSER)||!exists(env.KODJO_FIGMA_BROWSER)))throw Error('VNEXT_FIGMA_BROWSER_CONFIG_INVALID');
 // Ubuntu runners provide packaged Chrome; prefer it over the Chromium snapshot,
 // whose sandbox can be refused by the host's unprivileged-namespace policy.
 const candidates=[env.KODJO_FIGMA_BROWSER,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
 const found=candidates.find(p=>path.isAbsolute(p)&&exists(p));if(!found)throw Error('VNEXT_FIGMA_BROWSER_UNAVAILABLE');return found;
}
function host(screen,keep){
 const script=s=>s.replace(/<\/script/gi,'<\\/script');
 return '<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0}</style><main id="mount"></main><script>'+script(`
const kept={exports:{}};((module)=>{${keep}\n})(kept);
const app={exports:{}};((module,require)=>{${screen}\n})(app,()=>kept.exports);
window.subject=app.exports;
window.renderedMarkup=subject.render();
if(typeof window.renderedMarkup!=='string')throw Error('Render must return HTML');
document.getElementById('mount').innerHTML=window.renderedMarkup;
window.subjectReady=true;
`)+'</script>';
}
async function observe({screen,keep,directory,viewport,height,frameId,titleId,transitions,browser=resolveBrowser()}){
 if(!Number.isSafeInteger(viewport)||viewport<1||!Number.isSafeInteger(height)||height<1)throw Error('VNEXT_FIGMA_BROWSER_VIEWPORT_INVALID');
 if(typeof frameId!=='string'||!frameId||typeof titleId!=='string'||!titleId||!Array.isArray(transitions)||transitions.some(t=>typeof t.scenario_id!=='string'||typeof t.method!=='string'||typeof t.expected!=='boolean'))throw Error('VNEXT_FIGMA_BROWSER_SUBJECTS_INVALID');
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-figma-browser-'));let child,ws,send,primaryError,stderr='',sequence=0;const pending=new Map(),cleanupDiagnostic={browser};
 const screenSource=fs.readFileSync(screen,'utf8'),keepSource=fs.readFileSync(keep,'utf8'),hostSource=host(screenSource,keepSource);
 const html=path.join(directory,'rendered.html');fs.writeFileSync(html,hostSource,{flag:'wx'});
 try{
  const endpoint=await new Promise((resolve,reject)=>{
   // Fresh runner browser startup can outlast the former 20-second allowance.
   // Keep a finite deadline; DOM and screenshot assertions still require CDP.
   const timer=setTimeout(()=>reject(Error('VNEXT_FIGMA_BROWSER_START_TIMEOUT:'+JSON.stringify({browser,stderr:stderr.slice(-8192)}))),60000);
   child=spawn(browser,['--headless','--no-first-run','--no-default-browser-check','--disable-extensions','--disable-background-networking','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
   child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',(code,signal)=>{clearTimeout(timer);reject(Error('VNEXT_FIGMA_BROWSER_EXIT_BEFORE_CONNECTION:'+JSON.stringify({browser,exit_code:code,signal,stderr:stderr.slice(-8192)})));});
   child.stderr.on('data',b=>{stderr+=b.toString();const match=stderr.match(/DevTools listening on (ws:\/\/127\.0\.0\.1:[0-9]+\/devtools\/browser\/[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});
  });
  ws=new WebSocket(endpoint);await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('VNEXT_FIGMA_BROWSER_CONNECTION_TIMEOUT')),10000);ws.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});ws.addEventListener('error',()=>{clearTimeout(timer);reject(Error('VNEXT_FIGMA_BROWSER_CONNECTION_FAILED'));},{once:true});});
  ws.addEventListener('message',e=>{const row=JSON.parse(e.data);if(!row.id)return;const item=pending.get(row.id);if(!item)return;pending.delete(row.id);clearTimeout(item.timer);row.error?item.reject(Error('VNEXT_FIGMA_BROWSER_CDP:'+JSON.stringify(row.error))):item.resolve(row.result);});
  send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('VNEXT_FIGMA_BROWSER_COMMAND_TIMEOUT:'+method));},10000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
  const version=await send('Browser.getVersion');
  const {targetId}=await send('Target.createTarget',{url:'about:blank'}),{sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
  await send('Page.enable',{},sessionId);await send('Emulation.setDeviceMetricsOverride',{width:viewport,height,deviceScaleFactor:1,mobile:false},sessionId);
  await send('Page.navigate',{url:pathToFileURL(html).href},sessionId);
  const ready=await send('Runtime.evaluate',{expression:"new Promise((resolve,reject)=>{let n=0;const tick=()=>{if(window.subjectReady)return resolve(true);if(++n>100)return reject(Error('Render not ready'));setTimeout(tick,50)};tick()})",awaitPromise:true,returnByValue:true},sessionId);
  if(ready.exceptionDetails)throw Error('VNEXT_FIGMA_BROWSER_RENDER_FAILED');
  const result=await send('Runtime.evaluate',{expression:`(()=>{
   const nodes=Array.from(document.querySelectorAll('[data-figma-id]'));
   const frame=nodes.find(n=>n.getAttribute('data-figma-id')===${JSON.stringify(frameId)}),title=nodes.find(n=>n.getAttribute('data-figma-id')===${JSON.stringify(titleId)});
   if(!frame||!title)throw Error('Required rendered subjects absent');
   const rect=frame.getBoundingClientRect(),scenarios={};
   const canonical=document.createElement('template');canonical.innerHTML=window.renderedMarkup;
   const provenance={render_string:window.renderedMarkup,canonical_render:canonical.innerHTML,measured_mount:document.getElementById('mount').innerHTML};
   for(const t of ${JSON.stringify(transitions)}){if(typeof subject[t.method]!=='function')throw Error('Scenario method absent');scenarios[t.scenario_id]=subject[t.method]()===t.expected;}
   return {viewport:innerWidth,width:rect.width,height:rect.height,title:title.textContent,scenarios,provenance,observer:'BROWSER_DOM_LAYOUT',native_certification:false};
  })()`,returnByValue:true},sessionId);
  if(result.exceptionDetails)throw Error('VNEXT_FIGMA_BROWSER_OBSERVATION_FAILED:'+result.exceptionDetails.text);
  const loaded=await send('Page.getResourceTree',{},sessionId);
  const resource=await send('Page.getResourceContent',{frameId:loaded.frameTree.frame.id,url:pathToFileURL(html).href},sessionId);
  const loadedDocument=resource.base64Encoded?Buffer.from(resource.content,'base64'):resource.content;
  const facts={...result.result.value,browser_version:version.product};
  const p=facts.provenance;
  if(digest(loadedDocument)!==digest(hostSource)||p.canonical_render!==p.measured_mount)throw Error('VNEXT_FIGMA_BROWSER_PROVENANCE_MISMATCH');
  facts.provenance={screen_source_sha256:digest(screenSource),preserved_source_sha256:digest(keepSource),render_string_sha256:digest(p.render_string),generated_host_sha256:digest(hostSource),loaded_document_sha256:digest(loadedDocument),canonical_render_sha256:digest(p.canonical_render),measured_mount_sha256:digest(p.measured_mount),verified:true};if(facts.viewport!==viewport)throw Error('VNEXT_FIGMA_BROWSER_VIEWPORT_MISMATCH');
  const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},sessionId);fs.writeFileSync(path.join(directory,'rendered.png'),Buffer.from(image.data,'base64'),{flag:'wx'});
  fs.writeFileSync(path.join(directory,'browser-facts.json'),JSON.stringify(facts,null,2)+'\n',{flag:'wx'});return facts;
 }catch(error){primaryError=error;throw error;}finally{
  if(send&&ws?.readyState===WebSocket.OPEN){try{await send('Browser.close');cleanupDiagnostic.browser_close_sent=true;}catch(error){cleanupDiagnostic.browser_close_error=error.message;}ws.close();}
  for(const item of pending.values()){clearTimeout(item.timer);item.reject(Error('VNEXT_FIGMA_BROWSER_CLOSED'));}pending.clear();
  await cleanupProfile({child,profile,directory,stderr,primaryError,diagnostic:cleanupDiagnostic});
 }
}
if(require.main===module)observe(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))).then(r=>process.stdout.write(JSON.stringify(r))).catch(e=>{process.stderr.write(e.message+'\n');process.exitCode=1;});
module.exports={resolveBrowser,host,observe,closeProcess,cleanupProfile};
