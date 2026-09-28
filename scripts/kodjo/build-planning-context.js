#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const normalize=s=>String(s||'').replace(/\r/g,'');
function field(body,key,required=false) {
  const hits=[...normalize(body).matchAll(new RegExp('^'+key+'=([^\\n]+)$','gm'))];
  if(hits.length>1 || (required&&!hits.length)) throw new Error('CONTEXT_FIELD_INVALID:'+key);
  return hits[0]?.[1].trim()||null;
}
function select({comments,command,commandId,issueUrl,slice,sourceHead,applicationHead,applicationPr,mode}) {
  if(!['initial','revision'].includes(mode)) throw new Error('CONTEXT_MODE_INVALID');
  if(!Array.isArray(comments)) throw new Error('CONTEXT_COMMENTS_INVALID');
  const ordered=[...comments].sort((a,b)=>Number(a.id)-Number(b.id));
  const ids=ordered.map(c=>String(c.id));
  if(new Set(ids).size!==ids.length) throw new Error('CONTEXT_DUPLICATE_ID');
  const upper=commandId?Number(commandId):Infinity;
  const eligible=ordered.filter(c=>Number(c.id)<=upper);
  const authority=(c,author)=>{
    if(!c || c.issue_url!==issueUrl || c.user?.login!==author) throw new Error('CONTEXT_COMMENT_AUTHORITY_INVALID');
    return c;
  };
  if(commandId) {
    const event=authority(eligible.find(c=>String(c.id)===String(commandId)),'MyUncried');
    if(normalize(event.body)!==normalize(command)) throw new Error('CONTEXT_COMMAND_MISMATCH');
  }
  const matches=(c,marker)=>normalize(c.body).startsWith(marker+'\n') && field(c.body,'slice_id')===slice;
  const bound=c=>field(c.body,'application_head')===applicationHead && field(c.body,'application_pr')===String(applicationPr);
  const initialBound=c=>field(c.body,'source_head')===sourceHead && field(c.body,'planning_mode')==='INITIAL';
  const latest=items=>items.at(-1);
  const selected=[];
  function add(role,c,author='github-actions[bot]') {
    authority(c,author);
    const body=normalize(c.body);
    if(Buffer.byteLength(body)>120000) throw new Error('PROMPT_TOO_LARGE:CONTEXT_COMMENT');
    selected.push({role,id:String(c.id),sha256:digest(body),body});return c;
  }
  const pinnedPlan=field(command,'base_plan_comment_id');
  const pinnedReview=field(command,'base_review_comment_id');
  if(Boolean(pinnedPlan)!==Boolean(pinnedReview)) throw new Error('CONTEXT_PLAN_REVIEW_PAIR_REQUIRED');
  if(mode==='initial') {
    const plans=eligible.filter(c=>matches(c,'[KODJO_V2] PLAN_OUTPUT')&&initialBound(c));
    const findLatestReview=(plan)=>latest(eligible.filter(c=>matches(c,'[KODJO_V2] PLAN_REVIEW_OUTPUT')&&
      field(c.body,'source_head')===sourceHead&&field(c.body,'source_plan_comment_id')===String(plan.id)));
    if(pinnedPlan) {
      const plan=plans.find(c=>String(c.id)===pinnedPlan);
      if(!plan) throw new Error('CONTEXT_BASE_PLAN_INVALID');
      const review=findLatestReview(plan);
      if(!review || String(review.id)!==pinnedReview) throw new Error('CONTEXT_LATEST_REVIEW_REQUIRED');
      if(field(review.body,'verdict')!=='REVISE' || !/^STATUT : PLAN_REVISION_REQUIRED$/m.test(normalize(review.body))) {
        throw new Error('CONTEXT_INITIAL_REVISE_REQUIRED');
      }
      add('BASE_PLAN',plan);
      add('INDEPENDENT_REVIEW',review);
    } else {
      const plan=latest(plans);
      if(plan) {
        const review=findLatestReview(plan);
        if(!review) throw new Error('CONTEXT_INITIAL_PLAN_PENDING_REVIEW');
        const verdict=field(review.body,'verdict');
        if(verdict==='REVISE' && /^STATUT : PLAN_REVISION_REQUIRED$/m.test(normalize(review.body))) {
          add('BASE_PLAN',plan);
          add('INDEPENDENT_REVIEW',review);
        } else if(verdict==='APPROVE') {
          throw new Error('CONTEXT_INITIAL_PLAN_ALREADY_APPROVED');
        } else {
          throw new Error('CONTEXT_INITIAL_REVIEW_INVALID');
        }
      }
    }
  }
  if(mode==='revision') {
    const plans=eligible.filter(c=>matches(c,'[KODJO_V2] PLAN_OUTPUT')&&bound(c));
    const plan=pinnedPlan?plans.find(c=>String(c.id)===pinnedPlan):latest(plans);
    if(plan) {
      add('BASE_PLAN',plan);
      const reviews=eligible.filter(c=>matches(c,'[KODJO_V2] PLAN_REVIEW_OUTPUT')&&bound(c)&&field(c.body,'source_plan_comment_id')===String(plan.id));
      const review=latest(reviews);
      if(!review || (pinnedReview&&String(review.id)!==pinnedReview)) throw new Error('CONTEXT_LATEST_REVIEW_REQUIRED');
      add('INDEPENDENT_REVIEW',review);
    } else if(pinnedPlan || plans.length) throw new Error('CONTEXT_BASE_PLAN_INVALID');
    // No candidate yet: the committed approved plan/review remain the base.
    const checkpoints=eligible.filter(c=>matches(c,'[KODJO_V2] TARGETED_VALIDATION_OUTPUT'));
    const checkpoint=latest(checkpoints.filter(c=>{
      const tag=normalize(c.body).match(/<KODJO_TARGETED_VALIDATION_JSON>\s*([\s\S]*?)\s*<\/KODJO_TARGETED_VALIDATION_JSON>/);
      if(!tag) throw new Error('CONTEXT_TARGETED_PROOF_INVALID');
      const p=JSON.parse(tag[1]);return p.head===applicationHead && String(p.application_pr)===String(applicationPr);
    }));
    if(checkpoint) {
      add('TARGETED_VALIDATION_ONLY',checkpoint);
      const proof=JSON.parse(normalize(checkpoint.body).match(/<KODJO_TARGETED_VALIDATION_JSON>\s*([\s\S]*?)\s*<\/KODJO_TARGETED_VALIDATION_JSON>/)[1]);
      if(proof.global_approval!==false || proof.merge_authorized!==false || proof.close_authorized!==false || proof.final_status!=='REQUALIFICATION_REQUIRED') throw new Error('CONTEXT_TARGETED_SCOPE_INVALID');
      add('TARGETED_HUMAN_EVIDENCE',eligible.find(c=>String(c.id)===String(proof.human_device_approval_comment_id)),'MyUncried');
    }
  }
  const resumed=field(command,'resume_command_comment_id');
  if(resumed) {
    const original=eligible.find(c=>String(c.id)===resumed);
    add('RESUMED_COMMAND',original,'MyUncried');
    if(field(original.body,'slice_id')!==slice || !bound(original) || field(original.body,'resume_command_comment_id')) throw new Error('CONTEXT_RESUME_BINDING_INVALID');
  }
  if(selected.length>5 || selected.reduce((n,c)=>n+Buffer.byteLength(c.body),0)>300000) throw new Error('PROMPT_TOO_LARGE:CONTEXT_PACKET');
  return selected;
}
function build(directory,env=process.env) {
  const read=name=>fs.readFileSync(path.join(directory,name),'utf8');
  const b=JSON.parse(read('slice-bootstrap.json'));
  const mode=env.PLANNING_MODE||'revision';
  const command=env.TRIGGER_BODY;
  if(!command || field(command,'slice_id',true)!==b.slice_id) throw new Error('CONTEXT_COMMAND_REQUIRED');
  const issue=JSON.parse(read('issue.json'));
  if(Number(issue.number)!==Number(b.issue_number) || issue.url!==`https://api.github.com/repos/${b.repository}/issues/${b.issue_number}`) throw new Error('CONTEXT_ISSUE_MISMATCH');
  const selected=select({comments:JSON.parse(read('comments.json')),command,commandId:env.COMMAND_COMMENT_ID,
    issueUrl:issue.url,slice:b.slice_id,sourceHead:env.SOURCE_HEAD,applicationHead:env.APPLICATION_HEAD,applicationPr:env.APPLICATION_PR,mode});
  const sections=[], manifest={schema:'kodjo.planning-context.v1',slice_id:b.slice_id,mode,
    source_head:env.SOURCE_HEAD,application_head:env.APPLICATION_HEAD||env.SOURCE_HEAD,
    command_comment_id:env.COMMAND_COMMENT_ID||null,selection:selected.map(({body,...rest})=>rest),sections:[]};
  function append(role,body,source) {
    if(typeof body!=='string' || !body.trim()) throw new Error('CONTEXT_SECTION_EMPTY:'+role);
    sections.push('\n===== '+role+' =====\n'+body+'\n');
    manifest.sections.push({role,source,utf8_bytes:Buffer.byteLength(body),sha256:digest(body)});
  }
  append('CURRENT_COMMAND',command,env.COMMAND_COMMENT_ID||'verified-targeted-dispatch');
  append('ISSUE',issue.body||'(empty issue)',issue.url);
  for(const file of ['slice-bootstrap.json','planning-mission.md','product-evidence.txt','code-files.txt']) append(file,read(file),file);
  if(mode==='revision' && !selected.some(c=>c.role==='BASE_PLAN')) {
    for(const file of ['prior-technical-plan.md','prior-independent-review.md']) append(file,read(file),file);
  }
  if(mode==='initial' && !selected.some(c=>c.role==='BASE_PLAN') && fs.existsSync(path.join(directory,'non-opposable-seed-plan.md'))) append('NON_OPPOSABLE_SEED',read('non-opposable-seed-plan.md'),'non-opposable-seed-plan.md');
  for(const c of selected) append(c.role,c.body,'comment:'+c.id);
  const packet=sections.join('');
  manifest.utf8_bytes=Buffer.byteLength(packet);manifest.sha256=digest(packet);
  manifest.status=manifest.utf8_bytes<=1500000?'PASS':'PROMPT_TOO_LARGE';
  fs.writeFileSync(path.join(directory,'context-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  if(manifest.status!=='PASS') throw new Error('PROMPT_TOO_LARGE:CANONICAL_PACKET');
  fs.writeFileSync(path.join(directory,'canonical-context.txt'),packet);
  fs.writeFileSync(path.join(directory,'current-command.txt'),command+'\n');
  return manifest;
}
if(require.main===module) {try{build(process.argv[2]);}catch(e){
  const dir=process.argv[2];if(dir&&fs.existsSync(dir))fs.writeFileSync(path.join(dir,'context-error.json'),JSON.stringify({status:e.message.split(':')[0]})+'\n');
  console.error(e.message);process.exitCode=1;
}}
module.exports={field,select,build};
