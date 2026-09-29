#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {matrixSchema, validateMatrix, validateShape, contractPrompt, isUiPath, object, array, text} = require('./lib/ui-criteria-contract');
const {normalizeRepoPath,canonicalJson,sha256} = require('./lib/plan-impact');
const {buildRequirementContract,buildTestContract,buildBoundaryContract} = require('./lib/requirement-contract');

const {criterionIdentity,assertionIdentity}=require('./lib/ui-identities');
const sourceSchema=object({path:text,locator:text,requirement:text});
const nonUiRequirementSchema=object({
  source:sourceSchema,
  requirement_type:{type:'string',enum:['FUNCTIONAL','DATA','TECHNICAL','MIGRATION','PRESERVATION']},
  change_targets:array(text,1),
  tests:array(text),
  no_automated_test_reason:text,
  proof_required:array({type:'string',enum:['FUNCTIONAL_TEST','STATIC_ANALYSIS','VISUAL_COMPARE','ACCESSIBILITY_CHECK','DEVICE_CHECK']},1),
  status:{type:'string',enum:['DEFINED','CLARIFICATION_REQUIRED']},
});
const clarificationSchema=object({source:object({path:text,locator:text}),question:text,affected_targets:array(text)});
const nonUiCoverageSchema=object({status:{type:'string',enum:['ENUMERATED','NONE']},reason:text,source_paths:array(text,1)});
function stabilizeUiIdentities(matrix){
  if(!matrix||!Array.isArray(matrix.criteria))return matrix;
  const criteria=matrix.criteria.map((criterion)=>{
    const source=criterion&&criterion.source||{};
    const stableId=criterionIdentity(source);
    const assertions=Array.isArray(criterion.assertions)?criterion.assertions.map((assertion)=>({...assertion})):null;
    if(assertions){
      assertions.sort((a,b)=>canonicalJson({
        source:a.source,property_type:a.property_type,expected:a.expected,proof_required:[...(a.proof_required||[])].sort(),
      }).localeCompare(canonicalJson({
        source:b.source,property_type:b.property_type,expected:b.expected,proof_required:[...(b.proof_required||[])].sort(),
      })));
      assertions.forEach((assertion)=>{assertion.assertion_id=assertionIdentity(stableId,assertion);});
    }
    return {...criterion,criterion_id:stableId,...(assertions?{assertions}:{})};
  }).sort((a,b)=>a.criterion_id.localeCompare(b.criterion_id));
  return {...matrix,criteria};
}
function schemaFor(phase, scan=null) {
  if (!['draft','final'].includes(phase)) throw new Error('PLAN_GENERATION_PHASE_INVALID');
  const properties = {
    plan_markdown:text,
    ui_criteria_matrix:matrixSchema,
    non_ui_requirements:array(nonUiRequirementSchema),
    non_ui_coverage:nonUiCoverageSchema,
    clarifications:array(clarificationSchema),
  };
  if (phase==='draft') properties.modified_modules=array(object({path:text,change:{type:'string',enum:['MODIFY','CREATE']}}),1);
  else if (scan && Array.isArray(scan.candidates)) {
    const candidateProperties={};
    for (const candidate of scan.candidates) {
      const values=candidate.candidate_kind==='TEST'
        ? ['TEST_MUST_ADAPT','TEST_UNAFFECTED','REQUIRES_CLARIFICATION']
        : ['MODIFY','CONSUMER_UNAFFECTED','REQUIRES_CLARIFICATION'];
      candidateProperties[candidate.path]=object({
        classification:{type:'string',enum:values},
        justification:text,
      });
    }
    properties.decision_classifications=object(candidateProperties);
  } else throw new Error('PLAN_GENERATION_SCAN_CANDIDATES_REQUIRED');
  return object(properties);
}
function request(phase, prompt, scan=null) {
  return {model:'gpt-5.6-luna',input:prompt+'\n\n'+contractPrompt()+
    '\nOUTPUT TRANSPORT: Return the structured object defined by the response schema. '+
    'Return the matrix as an object, never a JSON string. Enumerate every non-UI functional/data/technical/migration/preservation requirement in non_ui_requirements; never leave a non-UI requirement only in prose. State non_ui_coverage=NONE only with a source-backed explanation identifying why every supplied non-UI source has no applicable requirement; otherwise use ENUMERATED. Put every unresolved ambiguity in clarifications. For each non-UI requirement with no automated test, provide no_automated_test_reason of at least 40 characters; with tests use NONE. PRESERVE/FORBIDDEN locators must be explicit; SEMANTIC requires a distinct explanation of why no path or symbol is addressable. SYMBOL supports a unique top-level named function declaration only. Paths must come from the supplied Git scope. Put all narrative in plan_markdown, without KODJO tags or PLAN_STATUS. '+
    'The workflow alone renders machine tags and status. This transport instruction supersedes tag examples in source material.',
    store:false,reasoning:{effort:'high'},max_output_tokens:20000,
    text:{verbosity:'medium',format:{type:'json_schema',name:'kodjo_ui_plan_'+phase,strict:true,schema:schemaFor(phase,scan)}}};
}
function validateSourceBindings(requirements, scan, sourceRoot, scope, matrix=null, coverage=null){
  if(!sourceRoot)return;
  const head=String(scan&&scan.scan_revision||'');
  if(!/^[0-9a-f]{40}$/.test(head))throw new Error('PLAN_SOURCE_HEAD_INVALID');
  const root=path.resolve(sourceRoot);
  const current=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',shell:false});
  if(current.status!==0||String(current.stdout).trim()!==head)throw new Error('PLAN_SOURCE_CHECKOUT_MISMATCH');
  const exists=(p)=>spawnSync('git',['cat-file','-e',head+':'+p],{cwd:root,shell:false,windowsHide:true}).status===0;
  const create=new Set((scan.modified_modules||[]).filter(x=>x.change==='CREATE').map(x=>normalizeRepoPath(x.path,'CREATE')));
  for(const req of requirements.requirements){
    if(!exists(req.source.path))throw new Error('REQUIREMENT_SOURCE_NOT_AT_HEAD:'+req.source.path);
    for(const test of req.tests||[]){
      const p=normalizeRepoPath(test,'test_path');
      if(exists(p))continue;
      if(!scope.has(p)||!create.has(p)||!/(?:^tests\/|\/__tests__\/|\.test\.[cm]?[jt]sx?$)/.test(p)){
        throw new Error('PLAN_TEST_PATH_NOT_AT_HEAD_OR_AUTHORIZED_CREATE:'+p);
      }
    }
  }
  for(const category of ['preserve','forbidden']){
    for(const boundary of matrix?.preservation?.[category]||[]){
      const target=matrix.schema==='kodjo.ui-criteria.v3' ? boundary.locator.path : String(boundary.target||'');
      if(target!=='NONE' &&
         !exists(normalizeRepoPath(target,'boundary.target'))){
        throw new Error('PLAN_BOUNDARY_PATH_NOT_AT_HEAD:'+target);
      }
      if(boundary.locator?.kind==='SYMBOL'){
        const blob=spawnSync('git',['show',head+':'+target],{cwd:root,encoding:'utf8',shell:false});
        const {declaration}=require('./lib/boundary-proof');
        if(blob.status!==0||!declaration(blob.stdout,boundary.locator.symbol))throw new Error('PLAN_BOUNDARY_SYMBOL_NOT_SUPPORTED_AT_HEAD:'+target+'#'+boundary.locator.symbol);
      }
    }
  }
  for(const source of coverage?.source_paths||[]){
    const p=normalizeRepoPath(source,'non_ui_coverage.source_path');
    if(!exists(p))throw new Error('NON_UI_COVERAGE_SOURCE_NOT_AT_HEAD:'+p);
  }
  for(const criterion of matrix?.criteria||[]){
    if(!['REUSE','EXTEND'].includes(criterion.component_decision))continue;
    const selected=criterion.selected_component;
    const component=normalizeRepoPath(selected.path,'selected_component.path');
    if(!exists(component))throw new Error('PLAN_SELECTED_COMPONENT_NOT_AT_HEAD:'+component);
    const blob=spawnSync('git',['show',head+':'+component],{cwd:root,encoding:'utf8',shell:false,windowsHide:true});
    if(blob.status!==0)throw new Error('PLAN_SELECTED_COMPONENT_UNREADABLE:'+component);
    const escaped=selected.export.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const exported=selected.export==='default'
      ? /\bexport\s+default\b/.test(blob.stdout)
      : new RegExp('\\bexport\\s+(?:(?:declare|const|let|var|function|class|type|interface|enum)\\s+'+escaped+'\\b|\\{[^}]*\\b'+escaped+'\\b[^}]*\\})').test(blob.stdout);
    if(!exported)throw new Error('PLAN_SELECTED_COMPONENT_EXPORT_NOT_AT_HEAD:'+component+'#'+selected.export);
  }
}
function decode(phase, response, scan, sourceRoot=null) {
  if (response.status!=='completed') throw new Error('PLAN_GENERATION_INCOMPLETE');
  const contents=(response.output||[]).filter(x=>x.type==='message').flatMap(x=>x.content||[]);
  if (contents.some(x=>x.type==='refusal')) throw new Error('PLAN_GENERATION_REFUSED');
  const chunks=contents.filter(x=>x.type==='output_text');
  if (chunks.length!==1) throw new Error('PLAN_GENERATION_OUTPUT_AMBIGUOUS');
  const result=JSON.parse(chunks[0].text);
  validateShape(result,schemaFor(phase,scan));
  result.ui_criteria_matrix=stabilizeUiIdentities(result.ui_criteria_matrix);
  if (/<\/?KODJO_|^\s*PLAN_STATUS:/m.test(result.plan_markdown)) throw new Error('PLAN_GENERATION_MARKER_DUPLICATION');
  const modified=phase==='draft' ? result.modified_modules : scan.modified_modules;
  if (!Array.isArray(modified)) throw new Error('PLAN_GENERATION_SCAN_MISSING');
  const paths=modified.map(x=>normalizeRepoPath(x.path,'modified_modules'));
  if (new Set(paths).size!==paths.length) throw new Error('PLAN_GENERATION_MODULE_DUPLICATION');
  let decisions=[];
  if (phase==='final') {
    if (result.decision_classifications) {
      decisions=scan.candidates.map((candidate)=>{
        const value=result.decision_classifications[candidate.path];
        if(!value) throw new Error('PLAN_GENERATION_DECISION_MISSING:'+candidate.path);
        return {path:candidate.path,classification:value.classification,justification:value.justification};
      });
    } else throw new Error('PLAN_GENERATION_DECISIONS_REQUIRED');
  }
  const promoted=phase==='final' ? decisions.filter(x=>x.classification==='MODIFY').map(x=>normalizeRepoPath(x.path,'decision')) : [];
  const classifiedWrites=phase==='final' ? decisions.filter(x=>x.classification==='MODIFY'||x.classification==='TEST_MUST_ADAPT').map(x=>normalizeRepoPath(x.path,'decision')) : [];
  const scopePaths=[...new Set([...paths,...classifiedWrites])].sort();
  const scope=new Set(scopePaths);
  const uiPaths=[...new Set([...paths,...promoted].filter(isUiPath))];
  validateMatrix(result.ui_criteria_matrix,{scope,uiPaths,requireAssertions:true});
  const requirements=buildRequirementContract(result.ui_criteria_matrix,result.non_ui_requirements,scope);
  const coverage=result.non_ui_coverage;
  if((coverage.status==='NONE')!== (result.non_ui_requirements.length===0))throw new Error('NON_UI_COVERAGE_STATUS_MISMATCH');
  if(coverage.status==='NONE'&&coverage.reason.trim().length<40)throw new Error('NON_UI_COVERAGE_REASON_INSUFFICIENT');
  const sources=new Set(coverage.source_paths.map(x=>normalizeRepoPath(x,'non_ui_coverage.source_path')));
  for(const row of result.non_ui_requirements){
    if(!sources.has(normalizeRepoPath(row.source.path,'non_ui_requirement.source.path')))throw new Error('NON_UI_COVERAGE_SOURCE_UNLISTED:'+row.source.path);
  }
  validateSourceBindings(requirements,scan,sourceRoot,scope,result.ui_criteria_matrix,coverage);
  const tests=buildTestContract(requirements);
  const boundaries=buildBoundaryContract(result.ui_criteria_matrix);
  for(const clarification of result.clarifications){
    normalizeRepoPath(clarification.source.path,'clarification.source.path');
    for(const target of clarification.affected_targets){
      const normalized=normalizeRepoPath(target,'clarification.affected_target');
      if(!scope.has(normalized)) throw new Error('PLAN_CLARIFICATION_TARGET_OUT_OF_SCOPE:'+normalized);
    }
  }
  const blockingDecision=decisions.some(x=>x.classification==='REQUIRES_CLARIFICATION');
  const blockingRequirement=result.non_ui_requirements.some(x=>x.status==='CLARIFICATION_REQUIRED');
  const derivedStatus=(blockingDecision||blockingRequirement||result.clarifications.length)
    ? 'CLARIFICATION_REQUIRED' : 'READY_FOR_INDEPENDENT_REVIEW';
  const tag=(name,value)=>'\n<KODJO_'+name+'_JSON>\n'+JSON.stringify(value,null,2)+'\n</KODJO_'+name+'_JSON>\n';
  return result.plan_markdown+'\n'+tag(phase==='draft'?'MODIFIED_MODULES':'PLAN_DECISIONS',phase==='draft'?modified:decisions)+
    tag('UI_CRITERIA_MATRIX',result.ui_criteria_matrix)+
    tag('NON_UI_REQUIREMENTS',result.non_ui_requirements)+
    tag('NON_UI_COVERAGE',coverage)+
    tag('REQUIREMENT_CONTRACT',requirements)+
    tag('TEST_CONTRACT',tests)+
    tag('BOUNDARY_CONTRACT',boundaries)+
    tag('PLAN_CLARIFICATIONS',result.clarifications)+
    '\nPLAN_STATUS: '+derivedStatus+'\n';
}
if (require.main===module) {
  try {
    const [command,phase,input,output,scanFile,sourceRoot]=process.argv.slice(2);
    let value;
    const scan=scanFile?JSON.parse(fs.readFileSync(scanFile,'utf8')):null;
    if (command==='request') value=JSON.stringify(request(phase,fs.readFileSync(input,'utf8'),scan),null,2)+'\n';
    else if (command==='decode') value=decode(phase,JSON.parse(fs.readFileSync(input,'utf8')),scan,sourceRoot);
    else throw new Error('USAGE: generate-ui-plan-contract.js request|decode draft|final input output [scan]');
    fs.writeFileSync(output,value,'utf8');
  } catch(error) { console.error(error.message); process.exitCode=1; }
}
module.exports={stabilizeUiIdentities,schemaFor,request,decode,validateSourceBindings};
