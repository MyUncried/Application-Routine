'use strict';
// Offline GitHub API adapter: real durable Git objects and atomic create-only
// update-ref; no network. Each process reconstructs its state from the same repo.
const cp=require('node:child_process');
function adapter(cwd){
  function git(args,input){return cp.spawnSync('git',args,{cwd,input,encoding:'utf8'});}
  return (method,endpoint,body)=>{
    if(method==='POST'&&endpoint.endsWith('/tags')){
      const raw='object '+body.object+'\ntype commit\ntag '+body.tag+'\ntagger Test <test@example.invalid> 1 +0000\n\n'+body.message+'\n';
      const r=git(['mktag'],raw);if(r.status!==0)throw Error(r.stderr);
      return {status:201,data:{sha:r.stdout.trim()}};
    }
    if(method==='POST'&&endpoint.endsWith('/refs')){
      const r=git(['update-ref',body.ref,body.sha,'0'.repeat(40)]);
      return {status:r.status===0?201:422,data:{}};
    }
    if(method==='GET'&&endpoint.includes('/ref/tags/')){
      const ref='refs/tags/'+endpoint.split('/ref/tags/')[1],r=git(['rev-parse','--verify',ref]);
      return r.status===0?{status:200,data:{ref,object:{sha:r.stdout.trim(),type:'tag'}}}:{status:404,data:{}};
    }
    if(method==='GET'&&endpoint.includes('/tags/')){
      const r=git(['cat-file','-p',endpoint.split('/tags/')[1]]);
      return {status:200,data:{message:r.stdout.split('\n\n').slice(1).join('\n\n').trimEnd(),object:{sha:r.stdout.match(/^object (\w+)/)[1],type:'commit'}}};
    }
    throw Error('unexpected API '+method+' '+endpoint);
  };
}
module.exports={adapter};
