#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const {inventory}=require('./lib/artifact-policy');
if(require.main===module){
  try{
    const [input,output]=process.argv.slice(2);
    if(!input||!output)throw new Error('USAGE_INVALID');
    const result={schema:'kodjo.v2-closure-artifact-inventory.v1',...inventory(JSON.parse(fs.readFileSync(input,'utf8')))};
    fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
    process.stdout.write(JSON.stringify(result)+'\n');
  }catch(e){console.error(e.message);process.exitCode=1;}
}
