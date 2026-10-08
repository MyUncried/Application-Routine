#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const Review=require('./lib/vnext-figma-implementation-review');
try{
 const [plan,input,output]=process.argv.slice(2);
 if(!plan||!input||!output)throw Error('USAGE: review-vnext-figma-implementation <approved-plan.md> <delivery-observations.json> <external-evidence-directory>');
 const observations=JSON.parse(fs.readFileSync(input,'utf8'));
 const receipt=Review.review(fs.readFileSync(plan,'utf8'),{...observations,cwd:process.cwd(),evidenceDirectory:output});
 if(receipt.assessment.verdict!=='APPROVE')throw Error('VNEXT_FIGMA_IMPLEMENTATION_REVISE');
}catch(e){process.stderr.write(e.message+'\n');process.exitCode=1;}
