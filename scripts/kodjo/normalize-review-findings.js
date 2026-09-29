#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const {inspect}=require('./lib/review-findings');
try{
 const [reviewFile,outFile]=process.argv.slice(2);
 if(!reviewFile||!outFile)throw new Error('USAGE: normalize-review-findings.js <review.md> <out.json>');
 const result=inspect(fs.readFileSync(reviewFile,'utf8'));
 fs.writeFileSync(outFile,JSON.stringify(result,null,2)+'\n','utf8');
 process.stdout.write('[KODJO_V2] review findings normalized — findings='+result.finding_count+' verdict='+result.verdict+'\n');
}catch(e){process.stderr.write(String(e.message||e)+'\n');process.exit(1);}
