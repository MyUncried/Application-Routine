#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),F=require('./lib/vnext-figma-source');
const [plan,directory,stage,output]=process.argv.slice(2);
try{
  if(!plan||!directory||!stage||!output)throw Error('USAGE: consume-vnext-figma <plan.md> <existing external directory> <PLANNER|IMPLEMENTER|IMPLEMENTATION_REVIEWER> <observation.json>');
  const result=F.consume(fs.readFileSync(plan,'utf8'),directory,stage);
  fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
}catch(e){process.stderr.write(e.message+'\n');process.exitCode=1;}
