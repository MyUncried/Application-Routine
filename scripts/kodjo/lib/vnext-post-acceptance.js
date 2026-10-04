'use strict';
// Acceptance decisions are owner evidence, never fabricated reviewer findings.
const V = require('./vnext-contract');
const { extractTaggedJson, canonicalJson } = require('./plan-impact');
const BASE_SCHEMA = 'kodjo.vnext.post-acceptance-baseline.v1';
const GAPS_SCHEMA = 'kodjo.vnext.acceptance-gaps.v1';
const OUTCOME_SCHEMA = 'kodjo.vnext.post-acceptance-outcome.v1';
function equal(a,b,code) { if (canonicalJson(a) !== canonicalJson(b)) V.fail(code); }
function paths(values) {
  return V.uniqueStrings(values,'VNEXT_ACCEPTANCE_PATHS_REQUIRED','allowed_write_paths').map(p=>{
    if(p.includes('\\') || p.startsWith('/') || /^[A-Za-z]:/.test(p) || p.split('/').some(s=>!s || s==='.' || s==='..')) V.fail('VNEXT_ACCEPTANCE_PATH_INVALID');
    return p;
  }).sort();
}
function validateBaseline(base) {
  V.assertExactKeys(base,['schema_version','reference','matrix','review','delivery','acceptance','acceptance_body','acceptance_updated_at','plan_blob_oid','contract_hash'],[],'VNEXT_ACCEPTANCE_BASE_KEYS_INVALID');
  V.verifyContractHash(base,'VNEXT_ACCEPTANCE_BASE_HASH_INVALID');
  if(base.schema_version!==BASE_SCHEMA) V.fail('VNEXT_ACCEPTANCE_BASE_SCHEMA_INVALID');
  const a=base.acceptance,d=base.delivery,r=base.reference;
  V.assertExactKeys(r,['kind','revision','plan_path','review_path','repository','issue_number','delivery_head','implementation_review_comment_id','acceptance_comment_id'],[],'VNEXT_ACCEPTANCE_REFERENCE_INVALID');
  if(r.kind!=='POST_ACCEPTANCE')V.fail('VNEXT_ACCEPTANCE_REFERENCE_INVALID');
  V.assertSha40(r.revision,'VNEXT_ACCEPTANCE_REFERENCE_REVISION_INVALID');V.assertSha40(base.plan_blob_oid,'VNEXT_ACCEPTANCE_PLAN_BLOB_INVALID');
  V.assertIsoDate(base.acceptance_updated_at,'VNEXT_ACCEPTANCE_TIMESTAMP_REQUIRED');
  V.assertExactKeys(d,['head','slice_id','issue_number','implementation_review_comment_id','not_executed_proofs'],[],'VNEXT_ACCEPTANCE_DELIVERY_KEYS_INVALID');
  V.assertSha40(d.head,'VNEXT_ACCEPTANCE_DELIVERY_HEAD_INVALID');
  V.assertExactKeys(a,['schema_version','decision','slice_id','head','source_review_comment_id','base_plan_hash','base_review_hash','gaps'],[],'VNEXT_ACCEPTANCE_DECISION_KEYS_INVALID');
  if(a.schema_version!==GAPS_SCHEMA || a.decision!=='AUTHORIZE_REVISION')V.fail('VNEXT_ACCEPTANCE_AUTHORIZATION_REQUIRED');
  if(a.head!==d.head || r.delivery_head!==d.head || a.slice_id!==d.slice_id || d.issue_number!==r.issue_number
      || String(a.source_review_comment_id)!==String(d.implementation_review_comment_id) || String(r.implementation_review_comment_id)!==String(d.implementation_review_comment_id)) V.fail('VNEXT_ACCEPTANCE_DELIVERY_MISMATCH');
  V.assertSha64(a.base_plan_hash,'VNEXT_ACCEPTANCE_PLAN_HASH_REQUIRED');V.assertSha64(a.base_review_hash,'VNEXT_ACCEPTANCE_REVIEW_HASH_REQUIRED');
  if(!Array.isArray(a.gaps)||!a.gaps.length)V.fail('VNEXT_ACCEPTANCE_GAPS_REQUIRED');
  const criteria=new Set(base.matrix.criteria.map(c=>c.criterion_id)),ids=new Set();
  for(const gap of a.gaps){
    V.assertExactKeys(gap,['gap_id','criterion_id','description','evidence_refs','allowed_write_paths'],[],'VNEXT_ACCEPTANCE_GAP_KEYS_INVALID');
    V.assertUnicodeExactText(gap.gap_id,'VNEXT_ACCEPTANCE_GAP_ID_REQUIRED');V.assertUnicodeExactText(gap.description,'VNEXT_ACCEPTANCE_GAP_DESCRIPTION_REQUIRED');
    if(ids.has(gap.gap_id)||!criteria.has(gap.criterion_id))V.fail('VNEXT_ACCEPTANCE_GAP_TARGET_INVALID');ids.add(gap.gap_id);
    V.uniqueStrings(gap.evidence_refs,'VNEXT_ACCEPTANCE_GAP_EVIDENCE_REQUIRED','evidence_refs');paths(gap.allowed_write_paths);
  }
  equal(extractTaggedJson(base.acceptance_body,'KODJO_VNEXT_ACCEPTANCE_GAPS_JSON'),a,'VNEXT_ACCEPTANCE_BODY_DRIFT');
  const Device=require('./device-proof-policy');
  if(base.review.schema!=='kodjo.ui-implementation-review.v1'||base.review.verdict!=='APPROVE')V.fail('VNEXT_ACCEPTANCE_TECHNICAL_APPROVAL_REQUIRED');
  equal([...criteria].sort(),base.review.criteria.map(c=>c.criterion_id).sort(),'VNEXT_ACCEPTANCE_CRITERION_COVERAGE_INVALID');
  for(const row of base.review.criteria){
    const criterion=base.matrix.criteria.find(c=>c.criterion_id===row.criterion_id);
    equal((row.proof_results||[]).map(p=>p.proof_type).sort(),[...criterion.proof_required].sort(),'VNEXT_ACCEPTANCE_PROOF_COVERAGE_INVALID');
    equal((row.assertion_results||[]).map(a=>a.assertion_id).sort(),(criterion.assertions||[]).map(a=>a.assertion_id).sort(),'VNEXT_ACCEPTANCE_ASSERTION_COVERAGE_INVALID');
    if(!['CONFORME','NON_VERIFIABLE'].includes(row.implementation_status)||row.preserve_status!=='PASS'||!row.proof_results?.length
       ||row.proof_results.some(p=>p.status!=='PASS'&&!(p.status==='PENDING_DEVICE'&&Device.isDeferred(p)))
       ||(row.implementation_status==='NON_VERIFIABLE'&&!Device.deviceOnlyGap(row.proof_results,true)))V.fail('VNEXT_ACCEPTANCE_TECHNICAL_GAP');
    for(const assertion of row.assertion_results||[]){
      const required=criterion.assertions.find(a=>a.assertion_id===assertion.assertion_id).proof_required;
      equal(assertion.proof_results.map(p=>p.proof_type).sort(),[...required].sort(),'VNEXT_ACCEPTANCE_ASSERTION_PROOF_COVERAGE_INVALID');
      if(!['CONFORME','NON_VERIFIABLE'].includes(assertion.status)||!assertion.proof_results?.length
        ||assertion.proof_results.some(p=>p.status!=='PASS'&&!(p.status==='PENDING_DEVICE'&&Device.isDeferred(p))))V.fail('VNEXT_ACCEPTANCE_TECHNICAL_GAP');
    }
  }
  if((base.review.boundary_results||[]).some(row=>row.status!=='PASS'))V.fail('VNEXT_ACCEPTANCE_TECHNICAL_GAP');
  if(base.review.non_ui_plan_assessment && (base.review.non_ui_plan_assessment.status!=='CONFORME'||base.review.non_ui_plan_assessment.requirements.some(r=>r.status!=='CONFORME'||r.proof_results.some(p=>p.status!=='PASS'))))V.fail('VNEXT_ACCEPTANCE_TECHNICAL_GAP');
}
function observe(reference,{cwd,readGit,github}) {
  const source=require('../verify-source-comment');
  const reviewComment=source.verify(github.comment(reference.repository,reference.implementation_review_comment_id),{
    repository:reference.repository,issue:reference.issue_number,id:reference.implementation_review_comment_id});
  const acceptanceComment=source.verify(github.comment(reference.repository,reference.acceptance_comment_id),{
    repository:reference.repository,issue:reference.issue_number,id:reference.acceptance_comment_id,actor:reference.repository.split('/')[0]});
  const fields=name=>[...reviewComment.body.matchAll(new RegExp('^'+name+'=([^\\n]+)$','gm'))].map(m=>m[1].trim());
  equal(fields('head'),[reference.delivery_head],'VNEXT_ACCEPTANCE_REVIEW_HEAD_MISMATCH');
  const acceptance=extractTaggedJson(acceptanceComment.body,'KODJO_VNEXT_ACCEPTANCE_GAPS_JSON');
  equal(fields('slice_id'),[acceptance.slice_id],'VNEXT_ACCEPTANCE_REVIEW_SLICE_MISMATCH');
  const plan=readGit(cwd,reference.revision,reference.plan_path),body=readGit(cwd,reference.revision,reference.review_path);
  const review=body.trim().startsWith('{')?JSON.parse(body):extractTaggedJson(body,'KODJO_UI_IMPLEMENTATION_REVIEW_JSON');
  equal(extractTaggedJson(reviewComment.body,'KODJO_UI_IMPLEMENTATION_REVIEW_JSON'),review,'VNEXT_ACCEPTANCE_REVIEW_BYTES_MISMATCH');
  const Delivery=require('./vnext-delivery-preservation');
  const matrix=Delivery.merge(extractTaggedJson(plan,'KODJO_UI_CRITERIA_MATRIX_JSON'),Delivery.fromMarkdown(plan));
  // Observe the delivered commit itself, not merely a SHA copied in a comment.
  for(const file of new Set(matrix.criteria.flatMap(c=>c.change_targets)))readGit(cwd,reference.delivery_head,file);
  const historical=Delivery.fromMarkdown(plan);
  const base=V.sealContract({schema_version:BASE_SCHEMA,reference,matrix,review,
    delivery:{head:reference.delivery_head,slice_id:acceptance.slice_id,issue_number:reference.issue_number,
      implementation_review_comment_id:String(reference.implementation_review_comment_id),
      not_executed_proofs:historical?Delivery.state(historical.baseline).not_executed_proofs||[]:[]},
    acceptance,acceptance_body:acceptanceComment.body,acceptance_updated_at:acceptanceComment.updated_at,
    plan_blob_oid:require('./vnext-legacy-queue-adapter').gitBlobOid(plan)});
  validateBaseline(base);return base;
}
function validateBindings(baseline,bindings,artifacts) {
  validateBaseline(baseline);
  const {planningEnvelope:e,planContract:plan,requirementRegistry:registry}=artifacts;
  if(e.planning_mode!=='REVISION'||e.created_from.kind!=='ACCEPTANCE_GAPS'||e.causal_findings.length)V.fail('VNEXT_ACCEPTANCE_ORIGIN_INVALID');
  if(e.application_head!==baseline.delivery.head||e.slice_id!==baseline.delivery.slice_id||e.issue_id!=='github_issue:'+baseline.reference.repository+'#'+baseline.reference.issue_number
    ||e.base_plan_hash!==baseline.acceptance.base_plan_hash||e.base_review_hash!==baseline.acceptance.base_review_hash)V.fail('VNEXT_ACCEPTANCE_CAUSAL_BASE_MISMATCH');
  const locator='github_issue_comment:'+baseline.reference.repository+'#'+baseline.reference.acceptance_comment_id;
  equal(e.created_from.refs,[locator],'VNEXT_ACCEPTANCE_ORIGIN_REFERENCE_MISMATCH');
  const sources=e.source_manifest.sources.filter(s=>s.authority==='DECISION'&&s.locator===locator&&s.fingerprint===V.sha256(baseline.acceptance_body)&&s.revision===baseline.acceptance_updated_at);
  if(sources.length!==1)V.fail('VNEXT_ACCEPTANCE_DECISION_SOURCE_REQUIRED');
  if(!Array.isArray(bindings))V.fail('VNEXT_ACCEPTANCE_BINDINGS_REQUIRED');
  const gapIds=baseline.acceptance.gaps.map(g=>g.gap_id).sort();
  equal(bindings.map(b=>b.gap_id).sort(),gapIds,'VNEXT_ACCEPTANCE_BINDING_COVERAGE_INVALID');
  const reqIds=new Set();
  for(const binding of bindings){
    V.assertExactKeys(binding,['gap_id','requirement_id'],[],'VNEXT_ACCEPTANCE_BINDING_KEYS_INVALID');
    const req=registry.requirements.find(r=>r.requirement_id===binding.requirement_id),item=plan.plan_items.find(p=>p.requirement_id===binding.requirement_id),gap=baseline.acceptance.gaps.find(g=>g.gap_id===binding.gap_id);
    if(!req||req.status!=='ACTIVE'||req.source_id!==sources[0].source_id||!item||item.disposition!=='CHANGE')V.fail('VNEXT_ACCEPTANCE_CHANGE_UNBOUND');
    reqIds.add(req.requirement_id);
    if(item.change_items.some(c=>!gap.allowed_write_paths.includes(c.path)))V.fail('VNEXT_ACCEPTANCE_WRITE_OUTSIDE_AUTHORIZATION');
  }
  if(plan.plan_items.some(p=>p.disposition==='CHANGE'&&!reqIds.has(p.requirement_id)))V.fail('VNEXT_ACCEPTANCE_CHANGE_UNBOUND');
  if(!plan.delivery_preservation||plan.delivery_preservation.baseline.contract_hash!==baseline.contract_hash)V.fail('VNEXT_ACCEPTANCE_PRESERVATION_REQUIRED');
  for(const replacement of plan.delivery_preservation.replacements){
    if(!bindings.some(b=>b.requirement_id===replacement.requirement_id&&baseline.acceptance.gaps.some(g=>g.gap_id===b.gap_id&&g.criterion_id===replacement.criterion_id)))V.fail('VNEXT_ACCEPTANCE_REPLACEMENT_UNAUTHORIZED');
  }
}
function buildOutcome({baseline,bindings,artifacts,reviewReport,baseRegister,cumulativeRegister}) {
  validateBindings(baseline,bindings,artifacts);
  const Audit=require('./vnext-audit-register');Audit.validateRegister(baseRegister);Audit.validateRegister(cumulativeRegister);
  if(cumulativeRegister.previous_register_hash!==baseRegister.contract_hash||cumulativeRegister.revision_count!==baseRegister.revision_count+1
      ||cumulativeRegister.revision_limit!==baseRegister.revision_limit||cumulativeRegister.revision_count>cumulativeRegister.revision_limit)V.fail('VNEXT_ACCEPTANCE_REVISION_BOUND_INVALID');
  if(baseRegister.entries.some(r=>!cumulativeRegister.entries.some(n=>n.subject_id===r.subject_id)))V.fail('VNEXT_ACCEPTANCE_REGISTER_SUBJECT_DROPPED');
  require('./review-contract').validateReviewReport(reviewReport,artifacts.reviewContext);
  if(reviewReport.verdict!=='APPROVE'||reviewReport.blocking_finding_count||reviewReport.acceptance_resolutions?.some(r=>r.status!=='RESOLVED')
      ||reviewReport.acceptance_resolutions?.length!==baseline.acceptance.gaps.length)V.fail('VNEXT_ACCEPTANCE_REVISION_NOT_RESOLVED');
  return V.sealContract({schema_version:OUTCOME_SCHEMA,origin:'POST_ACCEPTANCE',baseline_hash:baseline.contract_hash,
    acceptance_hash:V.canonicalHash(baseline.acceptance),bindings,next_plan_hash:artifacts.planContract.contract_hash,
    next_review_hash:reviewReport.contract_hash,base_register_hash:baseRegister.contract_hash,
    revision_count:cumulativeRegister.revision_count,revision_limit:cumulativeRegister.revision_limit,status:'RESOLVED'});
}
module.exports={BASE_SCHEMA,GAPS_SCHEMA,OUTCOME_SCHEMA,validateBaseline,observe,validateBindings,buildOutcome};
