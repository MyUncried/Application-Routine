'use strict';
// The disposable benchmark's execution contract, not a product/UI validator.
const path=require('node:path');
const SCREEN='src/features/example/Screen.js',TEST='tests/ui.test.js',KEEP='src/shared/ui/Existing.js';
const ID='kodjo.vnext.disposable-functional.v1';
const EXPECTED='In one fresh child Node process, require Screen once, call toggle() twice on that same module instance, and assert true then false in that order. In a separate fresh child Node process, clear both Screen and shared module cache entries, require the shared module again, require Screen, and check the normal Existing export identity. Clear only Screen from the cache, replace shared.Existing by a unique object sentinel, require Screen again, and check sentinel reference identity. Restore the original cache entries in finally. Use inline subprocess source; create no helper files. The trusted orchestration independently executes both probes, not just the delivered test. It records their actual results in execution.json alongside the delivered-test receipt, source hashes and separate gate outcome. Neither the test nor its probes may modify test or implementation source.';
function transitions(screenPath){
 const subject=require(screenPath),first=subject.toggle(),second=subject.toggle();
 return {contract_id:'kodjo.vnext.disposable-functional.v1',execution_model:'ONE_MODULE_INSTANCE_TWO_ORDERED_CALLS_BY_CONSTRUCTION',process_id:process.pid,module_path:require.resolve(screenPath),call_order:['toggle-off-on','toggle-on-off'],returned_values:[first,second],scenarios:{'toggle-off-on':first===true,'toggle-on-off':first===true&&second===false}};
}
function preservation(screenPath,keepPath){
 const screenId=require.resolve(screenPath),keepId=require.resolve(keepPath);
 const oldScreen=require.cache[screenId],oldKeep=require.cache[keepId];
 try{
  delete require.cache[screenId];delete require.cache[keepId];
  const shared=require(keepId),normal=require(screenId);
  if(!Object.hasOwn(normal,'Existing')||normal.Existing!==shared.Existing)throw Error('VNEXT_FIGMA_REAL_EXPORT_PRESERVATION_FAILED');
  delete require.cache[screenId];const sentinel={};shared.Existing=sentinel;
  if(require(screenId).Existing!==sentinel)throw Error('VNEXT_FIGMA_REAL_EXPORT_PROVENANCE_FAILED');
  return {status:'PASS',normal_identity:true,sentinel_identity:true,independent_child_process:true};
 }finally{
  if(oldScreen)require.cache[screenId]=oldScreen;else delete require.cache[screenId];
  if(oldKeep)require.cache[keepId]=oldKeep;else delete require.cache[keepId];
 }
}
function source(fn,cwd,paths){return 'process.stdout.write(JSON.stringify(('+fn.toString()+')('+paths.map(p=>JSON.stringify(path.resolve(cwd,p))).join(',')+')));';}
function observe(cwd,command){return JSON.parse(command(process.execPath,['-e',source(transitions,cwd,[SCREEN])],cwd));}
function preserve(cwd,command){return JSON.parse(command(process.execPath,['-e',source(preservation,cwd,[SCREEN,KEEP])],cwd));}
module.exports={ID,SCREEN,TEST,KEEP,EXPECTED,transitions,preservation,observe,preserve};
