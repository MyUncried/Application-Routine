#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
function validate(file,{cwd=process.cwd(),repository=process.env.GITHUB_REPOSITORY}={}) {
  require('./lib/vnext-figma-source').safePath(file);
  if(!file.startsWith('.github/orchestration/vnext-closure/') || !file.endsWith('.json')) throw Error('VNEXT_CLOSURE_REQUEST_PATH_INVALID');
  const c=require('./lib/vnext-github-closure').validateConfig(JSON.parse(fs.readFileSync(require('node:path').join(cwd,file),'utf8')),{cwd});
  if(repository!==c.repository) throw Error('VNEXT_CLOSURE_REPOSITORY_MISMATCH');
  return c;
}
if(require.main===module)try{
 const file=process.env.REQUEST_PATH,c=validate(file);
 fs.appendFileSync(process.env.GITHUB_OUTPUT,'request_path='+file+'\ndelivery_head='+c.delivery_head+'\n');
}catch(e){console.error(e.message);process.exitCode=1;}
module.exports={validate};
