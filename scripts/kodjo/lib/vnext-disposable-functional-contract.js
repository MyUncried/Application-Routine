'use strict';
// The disposable benchmark's execution contract, not a product/UI validator.
const path=require('node:path');
const SCREEN='src/features/example/Screen.js',TEST='tests/ui.test.js',KEEP='src/shared/ui/Existing.js';
const ID='kodjo.vnext.disposable-functional.v1';
const EXPECTED='Before launching either inline child, tests/ui.test.js MUST import node:path and resolve both module filenames in the parent test: screenPath = require.resolve(path.join(__dirname, "../src/features/example/Screen.js")) and keepPath = require.resolve(path.join(__dirname, "../src/shared/ui/Existing.js")). Launch each child with process.execPath and arguments ["-e", inlineSource, screenPath, keepPath]; inside the inline source use process.argv[1] for Screen and process.argv[2] for the shared module. These are absolute filenames resolved from the parent test location; never reuse a relative module specifier inside node -e or derive these filenames from process.cwd(). The parent MUST inspect each child result and fail closed: error MUST be absent, signal MUST be null, and status MUST equal 0. On any child failure the parent MUST surface that child\'s stdout and stderr and exit non-zero; merely spawning both children is insufficient. In one fresh child Node process, require Screen once, call toggle() twice on that same module instance, and assert true then false in that order. In a separate fresh child Node process, clear both Screen and shared module cache entries, require the shared module again, require Screen, and check the normal Existing export identity. Capture that shared module export and its original Existing value before substitution. Clear only Screen from the cache, replace shared.Existing by a unique object sentinel, require Screen again, and check sentinel reference identity. In finally restore the exact original shared.Existing value, then restore the original cache entries even if an assertion fails. No sentinel may remain in the shared export after the probe. Use inline subprocess source; create no helper files. The trusted orchestration already resolves both module filenames to absolute paths from its verified fixture root and injects those absolute filenames into its independent inline probes. It independently executes both probes against the implementation, not just the delivered test, and records their actual results in execution.json alongside the delivered-test receipt, source hashes and separate gate outcome, without copying success flags reported by the test. Neither the test nor its probes may modify test or implementation source.';
function transitions(screenPath){
 const subject=require(screenPath),first=subject.toggle(),second=subject.toggle();
 return {contract_id:'kodjo.vnext.disposable-functional.v1',execution_model:'ONE_MODULE_INSTANCE_TWO_ORDERED_CALLS_BY_CONSTRUCTION',process_id:process.pid,module_path:require.resolve(screenPath),call_order:['toggle-off-on','toggle-on-off'],returned_values:[first,second],scenarios:{'toggle-off-on':first===true,'toggle-on-off':first===true&&second===false}};
}
function preservation(screenPath,keepPath){
 const screenId=require.resolve(screenPath),keepId=require.resolve(keepPath);
 const oldScreen=require.cache[screenId],oldKeep=require.cache[keepId];
 let shared,originalExisting;
 try{
  delete require.cache[screenId];delete require.cache[keepId];
  shared=require(keepId);originalExisting=shared.Existing;
  const normal=require(screenId);
  if(!Object.hasOwn(normal,'Existing')||normal.Existing!==shared.Existing)throw Error('VNEXT_FIGMA_REAL_EXPORT_PRESERVATION_FAILED');
  delete require.cache[screenId];const sentinel={};shared.Existing=sentinel;
  if(require(screenId).Existing!==sentinel)throw Error('VNEXT_FIGMA_REAL_EXPORT_PROVENANCE_FAILED');
  return {status:'PASS',normal_identity:true,sentinel_identity:true,independent_child_process:true};
 }finally{
  try{if(shared)shared.Existing=originalExisting;}finally{
   if(oldScreen)require.cache[screenId]=oldScreen;else delete require.cache[screenId];
   if(oldKeep)require.cache[keepId]=oldKeep;else delete require.cache[keepId];
  }
 }
}
function source(fn,cwd,paths){return 'process.stdout.write(JSON.stringify(('+fn.toString()+')('+paths.map(p=>JSON.stringify(path.resolve(cwd,p))).join(',')+')));';}
function observe(cwd,command){return JSON.parse(command(process.execPath,['-e',source(transitions,cwd,[SCREEN])],cwd));}
function preserve(cwd,command){return JSON.parse(command(process.execPath,['-e',source(preservation,cwd,[SCREEN,KEEP])],cwd));}
module.exports={ID,SCREEN,TEST,KEEP,EXPECTED,transitions,preservation,observe,preserve};
