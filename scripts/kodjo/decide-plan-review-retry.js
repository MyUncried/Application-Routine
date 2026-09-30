#!/usr/bin/env node
'use strict';
const fs=require('node:fs');

function decide(pages,sliceId,currentReviewId,limit=1){
  const comments=(Array.isArray(pages)?pages.flatMap(page=>Array.isArray(page)?page:Array.isArray(page?.comments)?page.comments:[]):[])
    .sort((a,b)=>Number(a.id)-Number(b.id));
  const id=Number(currentReviewId);
  const current=comments.find(row=>Number(row.id)===id);
  if(!current||!String(current.body||'').includes('verdict=REVISE'))throw new Error('PLAN_RETRY_CURRENT_REVIEW_MISSING');
  const field=(body,key)=>String(body||'').replace(/\r/g,'').match(new RegExp('^'+key+'=([^\\n]+)$','m'))?.[1]||'';
  if(field(current.body,'slice_id')!==sliceId)throw new Error('PLAN_RETRY_SLICE_MISMATCH');
  const starts=comments.filter(row=>Number(row.id)<id&&row.user?.login==='MyUncried'&&
    /^\[KODJO_V2\] START_(?:INITIAL_PLAN|PLAN_REVISION)\s*$/m.test(String(row.body||'').replace(/\r/g,''))&&field(row.body,'slice_id')===sliceId);
  if(!starts.length)return {schema:'kodjo.plan-review-retry.v1',status:'USER_VALIDATION',review_count:0,auto_retry_limit:limit,reason:'USER_START_MISSING'};
  const start=starts.at(-1);
  const count=comments.filter(row=>Number(row.id)>Number(start.id)&&Number(row.id)<=id&&
    /^\[KODJO_V2\] PLAN_REVIEW_OUTPUT\s*$/m.test(String(row.body||'').replace(/\r/g,''))&&
    field(row.body,'slice_id')===sliceId&&field(row.body,'verdict')==='REVISE').length;
  return {schema:'kodjo.plan-review-retry.v1',status:count<=limit?'RETRY':'USER_VALIDATION',review_count:count,auto_retry_limit:limit,user_start_comment_id:start.id};
}
if(require.main===module){
  try{
    const [file,slice,id]=process.argv.slice(2);
    if(!file||!slice||!/^[1-9][0-9]*$/.test(String(id||'')))throw new Error('USAGE_INVALID');
    process.stdout.write(JSON.stringify(decide(JSON.parse(fs.readFileSync(file,'utf8')),slice,id))+'\n');
  }catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={decide};
