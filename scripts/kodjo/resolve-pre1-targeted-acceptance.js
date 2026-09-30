'use strict';
// One owner-authorized disposition for PRE-1 PR #267, not a general audit bypass.
function resolve(pr,sha,comments){
 if(String(pr)!=='267'||! /^[0-9a-f]{40}$/.test(sha)||!Array.isArray(comments))return null;
 const relevant=comments.filter(c=>c.user?.login==='MyUncried'&&typeof c.body==='string'&&c.body.split(/\r?\n/)[0]==='[KODJO_V2] PRE1_TARGETED_PROTOCOL_ACCEPTANCE'&&c.body.split(/\r?\n/).includes('candidate_sha='+sha)).sort((a,b)=>Number(b.id)-Number(a.id));
 const c=relevant[0];if(!c)return null;
 const lines=c.body.split(/\r?\n/);
 if(!['acceptance=OWNER_ACCEPTED_AFTER_QUALIFICATION','scope=PRE1_TARGETED_CORRECTION','base_audit_run=36705478288','audited_predecessor_sha=3a7039ef03190e15a3878178aaf65edbf4c319bf','no_additional_global_audit=true'].every(line=>lines.filter(x=>x===line).length===1))return null;
 if(lines.filter(x=>x.startsWith('candidate_sha=')).length!==1||lines.filter(x=>x.startsWith('acceptance=')).length!==1)return null;
 return {comment_id:c.id,candidate_sha:sha};
}
if(require.main===module){const fs=require('node:fs');const [pr,sha,file]=process.argv.slice(2);let comments=JSON.parse(fs.readFileSync(file,'utf8'));if(Array.isArray(comments))comments=comments.flat();const result=resolve(pr,sha,comments);process.stdout.write(result?String(result.comment_id):'NONE');}
module.exports={resolve};
