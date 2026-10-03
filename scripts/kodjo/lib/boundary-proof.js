'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
// Narrow static proof: a unique named function declaration, byte for byte after Git-compatible CRLF/LF normalization.
// Unsupported syntax stays NON_VERIFIABLE; semantic equivalence is never inferred.
function declaration(source,symbol){
 source=String(source).replace(/\r\n/g,'\n');
 const escaped=symbol.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const matches=[...source.matchAll(new RegExp('^(?:export\\s+)?(?:async\\s+)?function\\s+'+escaped+'\\s*\\(','gm'))];
 if(matches.length!==1)return null;
 const start=matches[0].index;
 let prefixQuote=null,prefixComment=null,prefixDepth=0;
 for(let i=0;i<start;i++){
  const c=source[i],next=source[i+1];
  if(prefixComment==='line'){if(c==='\n')prefixComment=null;continue;}
  if(prefixComment==='block'){if(c==='*'&&next==='/'){prefixComment=null;i++;}continue;}
  if(prefixQuote){if(c==='\\'){i++;continue;}if(c===prefixQuote)prefixQuote=null;continue;}
  if(c==='/'&&next==='/'){prefixComment='line';i++;continue;}
  if(c==='/'&&next==='*'){prefixComment='block';i++;continue;}
  if(c==='/'||c==='`')return null;
  if(c==='\"'||c==="'"){prefixQuote=c;continue;}
  if(c==='{')prefixDepth++;if(c==='}')prefixDepth--;
 }
 if(prefixQuote||prefixComment||prefixDepth!==0)return null;
 const signature=source.slice(start).match(new RegExp('^(?:export\\s+)?(?:async\\s+)?function\\s+'+escaped+'\\s*\\([^{};]*?\\)\\s*(?::\\s*(?:void|string|number|boolean))?\\s*\\{'));
 if(!signature)return null;
 let depth=0,body=false,quote=null,comment=null;
 for(let i=start;i<source.length;i++){
  const c=source[i],next=source[i+1];
  if(comment==='line'){if(c==='\n')comment=null;continue;}
  if(comment==='block'){if(c==='*'&&next==='/'){comment=null;i++;}continue;}
  if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote=null;continue;}
  if(c==='/'&&next==='/'){comment='line';i++;continue;}
  if(c==='/'&&next==='*'){comment='block';i++;continue;}
  // Regex and template literals need a real language parser, never a guessed proof.
  if(c==='/'||c==='`')return null;
  if(c==='"'||c==="'"){quote=c;continue;}
  if(c==='{'){body=true;depth++;}
  if(c==='}'&&body){depth--;if(depth===0)return source.slice(start,i+1);}
 }
 return null;
}
function compareSymbol(before,after,symbol){const a=declaration(before,symbol),b=declaration(after,symbol);return !a||!b?'NON_VERIFIABLE':a===b?'PASS':'FAIL';}
function boundaryProof(locator,changedSet,{cwd=process.cwd(),sourceHead}={}){
 if(!locator||locator.kind==='SEMANTIC')return null;
 const file=locator.path||locator.value;
 const git=args=>spawnSync('git',args,{cwd,encoding:'utf8',shell:false,windowsHide:true});
 if(git(['rev-parse','--verify','HEAD^{commit}']).status!==0)return 'NON_VERIFIABLE';
 if(locator.invariant_type==='PATH_ABSENT'){
  const tracked=git(['ls-tree','-r','-z','--name-only','HEAD','--',file]);
  const untracked=git(['ls-files','--others','-z','--',file]);
  if(tracked.status!==0||untracked.status!==0)return 'NON_VERIFIABLE';
  return tracked.stdout||untracked.stdout?'FAIL':'PASS';
 }
 if(!/^[0-9a-f]{40}$/.test(sourceHead||''))return 'NON_VERIFIABLE';
 const before=git(['rev-parse','--verify',sourceHead+':'+file]);
 if(before.status!==0)return 'NON_VERIFIABLE';
 if(locator.kind==='PATH'){
  const after=git(['rev-parse','--verify','HEAD:'+file]);
  if(after.status!==0)return 'FAIL';
  return before.stdout.trim()===after.stdout.trim()?'PASS':'FAIL';
 }
 const blob=git(['show',sourceHead+':'+file]);
 if(blob.status!==0)return 'NON_VERIFIABLE';
 try{return compareSymbol(blob.stdout,fs.readFileSync(path.resolve(cwd,file),'utf8'),locator.symbol);}catch(_){return 'NON_VERIFIABLE';}
}

module.exports={declaration,compareSymbol,boundaryProof};
