'use strict';

const crypto=require('node:crypto');

const CATEGORIES=new Set(['REQUIREMENT_GAP','SCOPE','PATH','TEST','MIGRATION','COMPATIBILITY','PRESERVATION','UI_CRITERION','ARCHITECTURE','CLARIFICATION','OTHER']);
const TARGET_KINDS=new Set(['REQUIREMENT_ID','CRITERION_ID','PATH','PLAN','SOURCE']);
function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value);}
function sha(value){return crypto.createHash('sha256').update(canonical(value),'utf8').digest('hex');}
function text(value,label){if(typeof value!=='string'||!value.trim())throw new Error('PLAN_REVIEW_FINDING_INVALID:'+label);return value.trim();}
function parseBlock(markdown){
  const matches=[...String(markdown||'').matchAll(/<KODJO_REVIEW_FINDINGS_JSON>\s*([\s\S]*?)\s*<\/KODJO_REVIEW_FINDINGS_JSON>/g)];
  if(matches.length!==1)throw new Error('PLAN_REVIEW_FINDINGS_MISSING_OR_DUPLICATED');
  return JSON.parse(matches[0][1]);
}
function normalize(value){
  if(!value||!Array.isArray(value.findings))throw new Error('PLAN_REVIEW_FINDINGS_INVALID:findings');
  const findings=value.findings.map((row,index)=>{
    if(!row||typeof row!=='object'||Array.isArray(row))throw new Error('PLAN_REVIEW_FINDING_INVALID:'+index);
    const category=text(row.category,'category'); if(!CATEGORIES.has(category))throw new Error('PLAN_REVIEW_FINDING_CATEGORY_INVALID:'+category);
    const target_kind=text(row.target_kind,'target_kind'); if(!TARGET_KINDS.has(target_kind))throw new Error('PLAN_REVIEW_FINDING_TARGET_KIND_INVALID:'+target_kind);
    const target=text(row.target,'target');
    if(typeof row.blocking!=='boolean'||typeof row.dependency_expansion_required!=='boolean')throw new Error('PLAN_REVIEW_FINDING_BOOLEAN_INVALID:'+index);
    const diagnostic=text(row.diagnostic,'diagnostic');
    const expected_correction=text(row.expected_correction,'expected_correction');
    const dependency_evidence=String(row.dependency_evidence||'').trim();
    if(row.dependency_expansion_required&&!dependency_evidence)throw new Error('PLAN_REVIEW_DEPENDENCY_EVIDENCE_MISSING:'+target);
    const identity={category,target_kind,target,diagnostic,expected_correction};
    return {finding_id:'RF-'+sha(identity).slice(0,16).toUpperCase(),category,target_kind,target,blocking:row.blocking,diagnostic,expected_correction,dependency_expansion_required:row.dependency_expansion_required,dependency_evidence};
  }).sort((a,b)=>a.finding_id.localeCompare(b.finding_id));
  const ids=findings.map(x=>x.finding_id); if(new Set(ids).size!==ids.length)throw new Error('PLAN_REVIEW_FINDING_DUPLICATE');
  const verdict=findings.some(x=>x.blocking||x.category==='CLARIFICATION')?'REVISE':'APPROVE';
  const affected_targets=[...new Set(findings.filter(x=>x.blocking||x.category==='CLARIFICATION').map(x=>x.target))].sort();
  return {schema:'kodjo.plan-review-findings.v1',finding_count:findings.length,verdict,affected_targets,findings};
}
function inspect(markdown){return normalize(parseBlock(markdown));}

module.exports={CATEGORIES,TARGET_KINDS,parseBlock,normalize,inspect};
