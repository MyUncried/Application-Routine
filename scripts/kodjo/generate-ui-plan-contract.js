#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const {matrixSchema, validateMatrix, validateShape, contractPrompt, isUiPath, object, array, text} = require('./lib/ui-criteria-contract');
const {normalizeRepoPath} = require('./lib/plan-impact');
function schemaFor(phase) {
  if (!['draft','final'].includes(phase)) throw new Error('PLAN_GENERATION_PHASE_INVALID');
  const properties = {
    plan_markdown:text,
    ui_criteria_matrix:matrixSchema,
    plan_status:{type:'string',enum:['READY_FOR_INDEPENDENT_REVIEW','CLARIFICATION_REQUIRED']},
  };
  if (phase==='draft') properties.modified_modules=array(object({path:text,change:{type:'string',enum:['MODIFY','CREATE']}}),1);
  else properties.decisions=array(object({path:text,classification:{type:'string',enum:['MODIFY','TEST_MUST_ADAPT','CONSUMER_UNAFFECTED','TEST_UNAFFECTED','REQUIRES_CLARIFICATION']},justification:text}));
  return object(properties);
}
function request(phase, prompt) {
  return {model:'gpt-5.6-luna',input:prompt+'\n\n'+contractPrompt()+
    '\nOUTPUT TRANSPORT: Return the structured object defined by the response schema. '+
    'Return the matrix as an object, never a JSON string. Put all narrative in plan_markdown, without KODJO tags or PLAN_STATUS. '+
    'The workflow alone renders machine tags and status. This transport instruction supersedes tag examples in source material.',
    store:false,reasoning:{effort:'high'},max_output_tokens:20000,
    text:{verbosity:'medium',format:{type:'json_schema',name:'kodjo_ui_plan_'+phase,strict:true,schema:schemaFor(phase)}}};
}
function decode(phase, response, scan) {
  if (response.status!=='completed') throw new Error('PLAN_GENERATION_INCOMPLETE');
  const contents=(response.output||[]).filter(x=>x.type==='message').flatMap(x=>x.content||[]);
  if (contents.some(x=>x.type==='refusal')) throw new Error('PLAN_GENERATION_REFUSED');
  const chunks=contents.filter(x=>x.type==='output_text');
  if (chunks.length!==1) throw new Error('PLAN_GENERATION_OUTPUT_AMBIGUOUS');
  const result=JSON.parse(chunks[0].text);
  validateShape(result,schemaFor(phase));
  if (/<\/?KODJO_|^\s*PLAN_STATUS:/m.test(result.plan_markdown)) throw new Error('PLAN_GENERATION_MARKER_DUPLICATION');
  const modified=phase==='draft' ? result.modified_modules : scan.modified_modules;
  if (!Array.isArray(modified)) throw new Error('PLAN_GENERATION_SCAN_MISSING');
  const paths=modified.map(x=>normalizeRepoPath(x.path,'modified_modules'));
  if (new Set(paths).size!==paths.length) throw new Error('PLAN_GENERATION_MODULE_DUPLICATION');
  const promoted=phase==='final' ? result.decisions.filter(x=>x.classification==='MODIFY').map(x=>normalizeRepoPath(x.path,'decision')) : [];
  const uiPaths=[...new Set([...paths,...promoted].filter(isUiPath))];
  // Closed scope is replayed after deterministic import closure. At draft
  // acceptance enforce all intrinsic rules and coverage, without pretending
  // that the not-yet-computed closure is already known.
  const targets=result.ui_criteria_matrix.criteria.flatMap(x=>x.change_targets);
  validateMatrix(result.ui_criteria_matrix,{scope:new Set(targets),uiPaths});
  const tag=(name,value)=>'\n<KODJO_'+name+'_JSON>\n'+JSON.stringify(value,null,2)+'\n</KODJO_'+name+'_JSON>\n';
  return result.plan_markdown+'\n'+tag(phase==='draft'?'MODIFIED_MODULES':'PLAN_DECISIONS',phase==='draft'?modified:result.decisions)+
    tag('UI_CRITERIA_MATRIX',result.ui_criteria_matrix)+'\nPLAN_STATUS: '+result.plan_status+'\n';
}
if (require.main===module) {
  try {
    const [command,phase,input,output,scanFile]=process.argv.slice(2);
    let value;
    if (command==='request') value=JSON.stringify(request(phase,fs.readFileSync(input,'utf8')),null,2)+'\n';
    else if (command==='decode') value=decode(phase,JSON.parse(fs.readFileSync(input,'utf8')),scanFile?JSON.parse(fs.readFileSync(scanFile,'utf8')):null);
    else throw new Error('USAGE: generate-ui-plan-contract.js request|decode draft|final input output [scan]');
    fs.writeFileSync(output,value,'utf8');
  } catch(error) { console.error(error.message); process.exitCode=1; }
}
module.exports={schemaFor,request,decode};
