'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {resolve}=require('../../scripts/kodjo/resolve-pre1-targeted-acceptance');
const sha='a'.repeat(40);
function comment(id=1){return {id,user:{login:'MyUncried'},body:['[KODJO_V2] PRE1_TARGETED_PROTOCOL_ACCEPTANCE','candidate_sha='+sha,'acceptance=OWNER_ACCEPTED_AFTER_QUALIFICATION','scope=PRE1_TARGETED_CORRECTION','base_audit_run=36705478288','audited_predecessor_sha=3a7039ef03190e15a3878178aaf65edbf4c319bf','no_additional_global_audit=true'].join('\n')};}
test('PRE-1 disposition is restricted to the exact owner, PR, candidate and source audit',()=>{
 assert.deepEqual(resolve(267,sha,[comment()]),{comment_id:1,candidate_sha:sha});
 for(const [pr,head,c] of [[268,sha,comment()],[267,'b'.repeat(40),comment()],[267,sha,{...comment(),user:{login:'github-actions[bot]'}}],[267,sha,{...comment(),body:comment().body.replace('base_audit_run=36705478288','base_audit_run=1')}],[267,sha,{...comment(),body:comment().body+'\nacceptance=OTHER'}]])assert.equal(resolve(pr,head,[c]),null);
});
test('PRE-1 latest owner disposition can revoke acceptance; unrelated candidates cannot override it',()=>{
 const revoked={...comment(2),body:comment(2).body.replace('acceptance=OWNER_ACCEPTED_AFTER_QUALIFICATION','acceptance=REVOKED')};
 assert.equal(resolve(267,sha,[comment(),revoked]),null);
 assert.equal(resolve(267,sha,[comment(),{...revoked,body:revoked.body.replace(sha,'b'.repeat(40))}]).comment_id,1);
});
test('PRE-1 exception is resolved only after exact qualification and never changes the audit verdict',()=>{
 const w=require('../../scripts/kodjo/lib/yaml').parse(fs.readFileSync(path.resolve(__dirname,'../../.github/workflows/kodjo-v2-next-evolution-independent-audit.yml'),'utf8'));
 const gate=w.jobs.await_qualified_head;
 assert.equal(gate.steps[0].name,'Require pilot qualification PASS on exact candidate HEAD');
 const disposition=gate.steps.find(s=>s.id==='owner_disposition');assert.ok(gate.steps.indexOf(disposition)>0);assert.equal(disposition.if,undefined);
 assert.equal(gate.outputs.owner_accepted,'${{ steps.owner_disposition.outputs.owner_accepted }}');
 assert.equal(w.jobs['independent-audit'].if,"needs.await_qualified_head.result == 'success' && needs.await_qualified_head.outputs.owner_accepted != 'true'");
 assert.ok(!disposition.run.includes('verdict=APPROVE'));
});
