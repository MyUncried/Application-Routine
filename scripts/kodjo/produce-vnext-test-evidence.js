#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),Evidence=require('./lib/vnext-test-evidence');
if(require.main===module)try{
  const [cwd,file]=process.argv.slice(2);
  if(!cwd||!file) throw Error('Usage: produce-vnext-test-evidence.js <delivery-checkout> <external-receipt>');
  const target=path.resolve(file),root=fs.realpathSync(cwd);
  if(target===root||target.startsWith(root+path.sep)) throw Error('VNEXT_TEST_EVIDENCE_OUTSIDE_DELIVERY_REQUIRED');
  const result=Evidence.produce({cwd:root});fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
  if(Object.values(result.checks).some(s=>s!=='PASS')) process.exitCode=1;
}catch(e){console.error(e.message);process.exitCode=1;}
