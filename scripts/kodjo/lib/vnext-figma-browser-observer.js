'use strict';
// Disposable browser measurement, never a native-device certification.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawn}=require('node:child_process'),{pathToFileURL}=require('node:url');
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
document.getElementById('mount').innerHTML=subject.render();
window.subjectReady=true;
`)+'</script>';
}
async function observe({screen,keep,directory,viewport,height,frameId,titleId,transitions,browser=resolveBrowser()}){
 if(!Number.isSafeInteger(viewport)||viewport<1||!Number.isSafeInteger(height)||height<1)throw Error('VNEXT_FIGMA_BROWSER_VIEWPORT_INVALID');
 if(typeof frameId!=='string'||!frameId||typeof titleId!=='string'||!titleId||!Array.isArray(transitions)||transitions.some(t=>typeof t.scenario_id!=='string'||typeof t.method!=='string'||typeof t.expected!=='boolean'))throw Error('VNEXT_FIGMA_BROWSER_SUBJECTS_INVALID');
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-figma-browser-'));let child,ws,send,stderr='',sequence=0;const pending=new Map();
 const html=path.join(directory,'rendered.html');fs.writeFileSync(html,host(fs.readFileSync(screen,'utf8'),fs.readFileSync(keep,'utf8')),{flag:'wx'});
 try{
  const endpoint=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('VNEXT_FIGMA_BROWSER_START_TIMEOUT')),20000);
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
   if(subject.__figmaWidthDelta)frame.style.width=(frame.getBoundingClientRect().width+subject.__figmaWidthDelta)+'px';
   const rect=frame.getBoundingClientRect(),scenarios={};
   for(const t of ${JSON.stringify(transitions)}){if(typeof subject[t.method]!=='function')throw Error('Scenario method absent');scenarios[t.scenario_id]=subject[t.method]()===t.expected;}
   return {viewport:innerWidth,width:rect.width,height:rect.height,title:title.textContent,scenarios,observer:'BROWSER_DOM_LAYOUT',native_certification:false};
  })()`,returnByValue:true},sessionId);
  if(result.exceptionDetails)throw Error('VNEXT_FIGMA_BROWSER_OBSERVATION_FAILED:'+result.exceptionDetails.text);
  const facts={...result.result.value,browser_version:version.product};if(facts.viewport!==viewport)throw Error('VNEXT_FIGMA_BROWSER_VIEWPORT_MISMATCH');
  const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},sessionId);fs.writeFileSync(path.join(directory,'rendered.png'),Buffer.from(image.data,'base64'),{flag:'wx'});
  fs.writeFileSync(path.join(directory,'browser-facts.json'),JSON.stringify(facts,null,2)+'\n',{flag:'wx'});return facts;
 }finally{
  if(send&&ws?.readyState===WebSocket.OPEN){try{await send('Browser.close');}catch(_){}ws.close();}
  for(const item of pending.values()){clearTimeout(item.timer);item.reject(Error('VNEXT_FIGMA_BROWSER_CLOSED'));}pending.clear();
  if(child&&child.exitCode===null){await new Promise(resolve=>{const timer=setTimeout(()=>{child.kill();resolve();},3000);child.once('exit',()=>{clearTimeout(timer);resolve();});});}
  fs.writeFileSync(path.join(directory,'browser-stderr.log'),stderr);
  fs.rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200});
 }
}
if(require.main===module)observe(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))).then(r=>process.stdout.write(JSON.stringify(r))).catch(e=>{process.stderr.write(e.message+'\n');process.exitCode=1;});
module.exports={resolveBrowser,host,observe};
