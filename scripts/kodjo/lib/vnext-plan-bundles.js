'use strict';
const fs=require('node:fs'),path=require('node:path'),M=require('./machine-block'),Source=require('./preflight-source');

// Read every referenced manifest and part at the pinned protocol revision.
// The destination is a supervisor-owned, read-only view, never application scope.
function materialize(body,directory,{cwd,revision}) {
  const root=fs.realpathSync(cwd),destination=path.resolve(directory),written=new Set();
  if(fs.existsSync(destination)&&fs.lstatSync(destination).isSymbolicLink())throw Error('VNEXT_PLAN_BUNDLE_SYMLINK_REFUSED');
  const readText=file=>{
    const relative=path.relative(root,file).replace(/\\/g,'/');
    if(!relative.startsWith('.github/orchestration/vnext-contracts/') || relative.split('/').some(p=>!p||p==='..'||p==='.') )throw Error('VNEXT_PLAN_BUNDLE_PATH_INVALID');
    // cat-file avoids Git show treating a long revision:path as a filesystem path.
    const observed=Source.command('git',['cat-file','blob',String(revision)+':'+relative],root,process.env,null);
    const bytes=observed.ok?Buffer.from(observed.stdout):Source.readFileAtHead(relative,revision,root),target=path.resolve(destination,relative);
    if(!target.startsWith(destination+path.sep))throw Error('VNEXT_PLAN_BUNDLE_PATH_INVALID');
    for(let parent=target;parent!==destination;parent=path.dirname(parent)){
      if(fs.existsSync(parent)&&fs.lstatSync(parent).isSymbolicLink())throw Error('VNEXT_PLAN_BUNDLE_SYMLINK_REFUSED');
    }
    fs.mkdirSync(path.dirname(target),{recursive:true});
    if(written.has(target)){if(!fs.readFileSync(target).equals(bytes))throw Error('VNEXT_PLAN_BUNDLE_CHANGED');}
    else{if(fs.existsSync(target))throw Error('VNEXT_PLAN_BUNDLE_VIEW_EXISTS');fs.writeFileSync(target,bytes,{flag:'wx',mode:0o400});fs.chmodSync(target,0o400);written.add(target);}
    return bytes.toString('utf8');
  };
  for(const hit of String(body).matchAll(/<([A-Z0-9_]+)>\s*([\s\S]*?)\s*<\/\1>/g)){
    let value;try{value=JSON.parse(hit[2]);}catch{continue;}
    if(value?.schema_version==='kodjo.vnext.block-bundle.v1')M.parse(body,hit[1],{cwd:root,readText});
  }
  return [...written];
}
module.exports={materialize};
