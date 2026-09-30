#!/usr/bin/env node
'use strict';
// Mechanical bound of the PRE-1 targeted closure review: the reviewer may only
// close or keep open the eleven pinned prior findings of run 36734142447.
// A finding outside those eleven targets, a nonblocking observation, a missing
// or duplicated closure entry, or a closure record contradicting the structured
// findings fails the run instead of being published.
const fs=require('node:fs');
function need(ok,code){if(!ok)throw new Error(code);}
function closureJson(markdown){
  const m=[...String(markdown).matchAll(/<KODJO_PRE1_CLOSURE_JSON>\s*([\s\S]*?)\s*<\/KODJO_PRE1_CLOSURE_JSON>/g)];
  need(m.length===1,'PRE1_CLOSURE_JSON_MISSING_OR_DUPLICATED');
  const value=JSON.parse(m[0][1]);
  need(Array.isArray(value.closures)&&value.closures.length===11,'PRE1_CLOSURE_JSON_COUNT_INVALID');
  const rows=new Map();
  for(const r of value.closures){
    need(Number.isInteger(r.finding)&&r.finding>=1&&r.finding<=11,'PRE1_CLOSURE_JSON_NUMBER_INVALID');
    need(!rows.has(r.finding),'PRE1_CLOSURE_JSON_DUPLICATED:'+r.finding);
    need(typeof r.closed==='boolean','PRE1_CLOSURE_JSON_CLOSED_INVALID:'+r.finding);
    for(const k of ['correction_examined','evidence','justification'])need(typeof r[k]==='string'&&r[k].trim(),'PRE1_CLOSURE_JSON_FIELD_MISSING:'+r.finding+':'+k);
    rows.set(r.finding,r.closed);
  }
  return rows;
}
function tableNumbers(markdown){
  const seen=[];
  for(const line of String(markdown).split(/\r?\n/)){
    if(!/^\s*\|/.test(line))continue;
    const cells=line.trim().replace(/^\||\|$/g,'').split(/(?<!\\)\|/).map(c=>c.trim().replace(/\*\*/g,''));
    const m=/^#?\s*(\d{1,2})$/.exec(cells[0]||'');
    if(m&&cells.length>=5)seen.push(Number(m[1]));
  }
  return seen;
}
function verify(reviewMarkdown,normalized,prior){
  need(Array.isArray(prior.findings)&&prior.findings.length===11,'PRE1_PRIOR_FINDINGS_INVALID');
  const key=f=>f.target_kind+'\u0000'+f.target;
  const numberOf=new Map(prior.findings.map((f,i)=>[key(f),i+1]));
  need(numberOf.size===11,'PRE1_PRIOR_TARGETS_NOT_UNIQUE');
  const open=new Set();
  for(const f of normalized.findings){
    const n=numberOf.get(key(f));
    need(n,'PRE1_FINDING_OUTSIDE_ELEVEN:'+f.target_kind+':'+f.target);
    need(f.blocking,'PRE1_NONBLOCKING_OBSERVATION_FORBIDDEN:'+n);
    need(new RegExp('^Prior finding '+n+'\\b').test(f.diagnostic),'PRE1_FINDING_NUMBER_MISMATCH:'+n);
    open.add(n);
  }
  const rows=closureJson(reviewMarkdown);
  for(let n=1;n<=11;n++)need(rows.get(n)===!open.has(n),'PRE1_CLOSURE_CONTRADICTS_FINDINGS:'+n);
  const table=tableNumbers(reviewMarkdown);
  need(table.length===11&&new Set(table).size===11&&table.every(n=>n>=1&&n<=11),'PRE1_CLOSURE_TABLE_NOT_ELEVEN_ROWS:'+table.join(','));
  const verdict=open.size?'REVISE':'APPROVE';
  need(verdict===normalized.verdict,'PRE1_VERDICT_MISMATCH');
  return {schema:'kodjo.pre1-closure-bound.v1',prior_review_run:36734142447,verdict,closed:[...Array(11).keys()].map(i=>i+1).filter(n=>!open.has(n)),open:[...open].sort((a,b)=>a-b)};
}
if(require.main===module){
  try{
    const [review,normalized,prior,out]=process.argv.slice(2);
    need(review&&normalized&&prior&&out,'USAGE: verify-pre1-closure-review.js <review.md> <findings.json> <prior.json> <out.json>');
    const read=p=>fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'');
    const result=verify(read(review),JSON.parse(read(normalized)),JSON.parse(read(prior)));
    fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n','utf8');
    process.stdout.write('[KODJO_V2] PRE-1 closure bound verified — closed='+result.closed.length+' open='+(result.open.join(',')||'none')+' verdict='+result.verdict+'\n');
  }catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={verify,closureJson,tableNumbers};
