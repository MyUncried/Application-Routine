'use strict';
const fs=require('node:fs'),path=require('node:path');
const extensions=['','.ts','.tsx','.js','.jsx','.mts','.cts','.mjs','.cjs'];
function resolver(cwd){
 let options={};try{options=JSON.parse(fs.readFileSync(path.join(cwd,'tsconfig.json'),'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,'')).compilerOptions||{};}catch{}
 const aliases=Object.entries(options.paths||{}).sort((a,b)=>b[0].split('*')[0].length-a[0].split('*')[0].length||b[0].length-a[0].length);
 return (spec,from)=>{
  let bases=[];
  if(spec.startsWith('.'))bases=[path.resolve(path.dirname(from),spec)];
  else for(const [pattern,targets]of aliases){
   const star=pattern.indexOf('*'),prefix=star<0?pattern:pattern.slice(0,star),suffix=star<0?'':pattern.slice(star+1);
   if(star<0?spec!==pattern:!spec.startsWith(prefix)||!spec.endsWith(suffix))continue;
   const middle=star<0?'':spec.slice(prefix.length,suffix?-suffix.length:undefined);
   bases=(targets||[]).map(t=>path.resolve(cwd,options.baseUrl||'.',t.replace('*',middle)));break;
  }
  for(const base of bases)for(const candidate of [...extensions.map(e=>base+e),...extensions.slice(1).map(e=>path.join(base,'index'+e))]){
   if(fs.existsSync(candidate)&&fs.statSync(candidate).isFile())return path.resolve(candidate);
  }
  return null;
 };
}
function clean(source){return source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,'');}
function componentEvidence(criterion,changedSet,cwd){
 const decision=criterion.component_decision,targets=criterion.change_targets||[];
 if(decision==='CREATE')return targets.length&&targets.every(t=>changedSet.has(t)&&fs.existsSync(path.resolve(cwd,t)))?{status:'PASS',reason:'CREATED_TARGET_PRESENT_IN_DELTA'}:{status:'FAIL',reason:'CREATED_TARGET_NOT_DELIVERED'};
 const selected=criterion.selected_component;if(!selected||typeof selected!=='object')return null;
 const component=path.resolve(cwd,selected.path);
 if(!fs.existsSync(component))return {status:'FAIL',reason:'SELECTED_COMPONENT_MISSING'};
 if(decision==='EXTEND')return changedSet.has(selected.path)?{status:'PASS',reason:'SELECTED_COMPONENT_CHANGED'}:{status:'FAIL',reason:'SELECTED_COMPONENT_NOT_CHANGED'};
 const resolve=resolver(cwd);
 // Only static named reexports and export-star of a named export are supported.
 // Unknown/dynamic forms remain unproven rather than admitting a different symbol.
 function reaches(file,name,seen=new Set()){
  if(file===component)return name===selected.export;
  const key=file+':'+name;if(!file||seen.has(key))return false;seen.add(key);
  const source=clean(fs.readFileSync(file,'utf8'));
  for(const m of source.matchAll(/\bexport\s+(\{[^}]+\}|\*)\s+from\s+['"]([^'"]+)['"]/g)){
   const next=resolve(m[2],file);if(!next)continue;
   if(m[1]==='*'){if(name!=='default'&&reaches(next,name,seen))return true;continue;}
   for(const item of m[1].slice(1,-1).split(',')){
    const parts=item.trim().split(/\s+as\s+/);if((parts[1]||parts[0])===name&&reaches(next,parts[0],seen))return true;
   }
  }
  return false;
 }
 for(const target of targets){
  const file=path.resolve(cwd,target);if(!changedSet.has(target)||!fs.existsSync(file))continue;
  const source=clean(fs.readFileSync(file,'utf8'));
  for(const m of source.matchAll(/\bimport\s+(?!type\b)([^;]+?)\s+from\s+['"]([^'"]+)['"]\s*;?/g)){
   const imported=resolve(m[2],file);if(!imported)continue;
   const bindings=[];const defaultName=/^\s*([A-Za-z_$][\w$]*)/.exec(m[1]);if(defaultName)bindings.push(['default',defaultName[1]]);
   const named=/\{([^}]+)\}/.exec(m[1]);if(named)for(const item of named[1].split(',')){if(/^\s*type\b/.test(item))continue;const parts=item.trim().split(/\s+as\s+/);bindings.push([parts[0],parts[1]||parts[0]]);}
   const remainder=source.slice(0,m.index)+source.slice(m.index+m[0].length);
   // Ignore strings and comments as use evidence. Namespace members are explicit.
   const code=remainder.replace(/(['"`])(?:\\.|(?!\1)[\s\S])*?\1/g,'');
   const namespace=/\*\s+as\s+([A-Za-z_$][\w$]*)/.exec(m[1]);if(namespace&&selected.export!=='default'&&reaches(imported,selected.export)&&new RegExp('\\b'+namespace[1]+'\\s*\\.\\s*'+selected.export+'\\b').test(code))return {status:'PASS',reason:'EXACT_IMPORT_AND_USE',target};
   for(const [name,bound]of bindings)if(/^[A-Za-z_$][\w$]*$/.test(bound)&&reaches(imported,name)&&new RegExp('\\b'+bound+'\\b').test(code))return {status:'PASS',reason:'EXACT_IMPORT_AND_USE',target};
  }
 }
 return {status:'FAIL',reason:'SELECTED_COMPONENT_USE_NOT_PROVEN'};
}
module.exports={componentEvidence,resolver};
