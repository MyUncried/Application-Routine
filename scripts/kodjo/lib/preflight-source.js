'use strict';

const { spawnSync } = require('node:child_process');
const P = require('./preflight-contract');

function command(bin,args,cwd,env=process.env,encoding='utf8'){
  const r=spawnSync(bin,args,{cwd,env,encoding,windowsHide:true,shell:false,maxBuffer:64*1024*1024});
  return {ok:!r.error&&r.status===0,status:r.status,stdout:r.stdout||'',stderr:r.stderr||'',error:r.error||null};
}
function readFileAtHead(file,head,cwd,options={}){
  const local=command('git',['show',String(head)+':'+String(file)],cwd,process.env,null);
  if(local.ok) return Buffer.from(local.stdout);
  const repository=options.repository||process.env.GITHUB_REPOSITORY;
  if(!repository) throw new Error('PREFLIGHT_HEAD_FILE_UNREADABLE: '+file+'@'+head);
  const api=command('gh',['api','repos/'+repository+'/contents/'+String(file)+'?ref='+String(head),'--jq','.content'],cwd,process.env,'utf8');
  if(!api.ok) throw new Error('PREFLIGHT_HEAD_FILE_UNREADABLE: '+file+'@'+head);
  const base64=String(api.stdout||'').replace(/\s+/g,'');
  if(!base64) throw new Error('PREFLIGHT_HEAD_FILE_EMPTY: '+file+'@'+head);
  return Buffer.from(base64,'base64');
}
function hashFileAtHead(file,head,cwd,options={}){
  try{return P.sha256(readFileAtHead(file,head,cwd,options));}
  catch(error){
    if(options.optional===true) return null;
    throw error;
  }
}

module.exports={command,readFileAtHead,hashFileAtHead};
