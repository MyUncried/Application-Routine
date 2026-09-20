#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const crypto = require('node:crypto');
// Operational policy for KODJO-Orchestrator, verified by its owner 2026-09-20.
// A local tokenizer is an estimate, NOT the server's exact model token count.
const POLICY = Object.freeze({model:'gpt-5.6-luna', tpm:500000, budget:350000,
  maxBytes:2000000, overhead:4096, multiplier:1.25, attempts:3, maxDelayMs:120000});
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
let encoder;
function measure(request) {
  if (request.model !== POLICY.model || typeof request.input !== 'string' ||
      !Number.isInteger(request.max_output_tokens) || request.max_output_tokens < 1 || request.max_output_tokens > 20000 ||
      request.tools || request.previous_response_id || request.conversation || request.stream) throw new Error('OPENAI_REQUEST_POLICY_INVALID');
  const serialized = JSON.stringify(request);
  const bytes = Buffer.byteLength(serialized);
  // Byte guard runs before tokenization, including pathological inputs.
  const evidence = {schema:'kodjo.openai-budget.v1', request_sha256:hash(serialized), model:request.model,
    utf8_bytes:bytes, tokenizer:'js-tiktoken@1.0.21/o200k_base', measurement:'LOCAL_ESTIMATE_WITH_MARGIN',
    model_tpm:POLICY.tpm, budget_tokens:POLICY.budget, margin_fraction:0.3, max_output_tokens:request.max_output_tokens};
  if(bytes > POLICY.maxBytes) return {...evidence,status:'PROMPT_TOO_LARGE',reason:'BYTE_BOUND'};
  encoder ||= require('./openai-runtime/node_modules/js-tiktoken').getEncoding('o200k_base');
  const tokens = encoder.encode(serialized, [], []).length;
  const reserved = Math.ceil(tokens * POLICY.multiplier) + POLICY.overhead + request.max_output_tokens;
  return {...evidence,serialized_tokens:tokens,reserved_tokens:reserved,
    status:reserved <= POLICY.budget ? 'PASS' : 'PROMPT_TOO_LARGE', reason:'TOKEN_BUDGET'};
}
function safeIdentifier(value, secret) {
  if(typeof value !== 'string') return null;
  if ((secret && value.includes(secret)) || /sk-|Bearer/i.test(value)) return '[REDACTED]';
  return /^[a-zA-Z0-9_.:-]{1,128}$/.test(value) ? value : '[REDACTED]';
}
function diagnostics(response, body, secret) {
  const headers = {};
  for(const name of ['retry-after','x-request-id','x-ratelimit-limit-requests','x-ratelimit-limit-tokens',
    'x-ratelimit-remaining-requests','x-ratelimit-remaining-tokens','x-ratelimit-reset-requests',
    'x-ratelimit-reset-tokens','x-ratelimit-limit-project-tokens','x-ratelimit-remaining-project-tokens','x-ratelimit-reset-project-tokens']) {
    const v=response.headers.get(name);
    if(v !== null) headers[name] = name === 'retry-after' && /^(\d+(\.\d+)?|[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT)$/.test(v) ? v : safeIdentifier(v,secret);
  }
  return {http_status:response.status,error:{type:safeIdentifier(body?.error?.type,secret),code:safeIdentifier(body?.error?.code,secret)},headers};
}
function classify(status, body) {
  const e=body?.error||{};
  const detail=[e.code,e.type,e.message].filter(x=>typeof x==='string').join(' ').toLowerCase();
  if(/credit_balance|credits? (balance|exhaust)|billing/.test(detail)) return 'CREDIT_OR_BILLING';
  if(/spend_limit|usage_limit|hard_limit/.test(detail)) return 'SPEND_OR_USAGE_LIMIT';
  if(/insufficient_quota|quota/.test(detail)) return 'QUOTA';
  if(status===413 || /context_length|request_too_large|prompt_too_large|maximum context|request too large|reduce.*(tokens|length)/.test(detail)) return 'PROMPT_TOO_LARGE';
  if(/tokens per day|requests per day|\btpd\b|\brpd\b|daily/.test(detail)) return 'DAILY_LIMIT';
  if(status===429 && ['rate_limit_exceeded','slow_down'].includes(e.code)) return 'TEMPORARY_RATE_LIMIT';
  if([500,502,503,504].includes(status)) return 'TEMPORARY_SERVER';
  return 'NON_RETRYABLE_OR_UNKNOWN';
}
function duration(value, now) {
  if(!value || value==='[REDACTED]') return null;
  if(/^\d+(\.\d+)?$/.test(value)) return Number(value)*1000;
  if(/^\d+(ms|s|m|h)/.test(value)) {
    let sum=0, consumed='';
    for(const m of value.matchAll(/(\d+(?:\.\d+)?)(ms|s|m|h)/g)) { consumed+=m[0];sum+=Number(m[1])*({ms:1,s:1000,m:60000,h:3600000}[m[2]]); }
    return consumed===value?sum:null;
  }
  const date=Date.parse(value);return Number.isFinite(date)?Math.max(0,date-now):null;
}
function retryDelay(headers, attempt, now, random) {
  const values=['retry-after','x-ratelimit-reset-tokens','x-ratelimit-reset-requests','x-ratelimit-reset-project-tokens']
    .map(k=>duration(headers[k],now)).filter(x=>x!==null);
  return Math.max(1000*2**(attempt-1),...values) + Math.floor(random()*1000);
}
async function execute(request, {fetchImpl=fetch, sleep=ms=>new Promise(r=>setTimeout(r,ms)), now=Date.now, random=Math.random,
  secret=process.env.OPENAI_API_KEY, save=()=>{}, state={reservations:[]}, saveState=()=>{}, log=()=>{}}={}) {
  const budget=measure(request), report={schema:'kodjo.openai-call.v1',budget,attempts:[],status:budget.status};
  save(report);
  if(budget.status!=='PASS') throw new Error('PROMPT_TOO_LARGE');
  if(!secret) throw new Error('OPENAI_KEY_MISSING');
  for(let attempt=1;attempt<=POLICY.attempts;attempt++) {
    // Pace consecutive draft/closure calls and retries in the same planning run.
    state.reservations=state.reservations.filter(x=>now()-x.time<60000);
    if(state.reservations.reduce((s,x)=>s+x.tokens,0)+budget.reserved_tokens>POLICY.budget) {
      const wait=Math.max(0,60000-(now()-state.reservations[0].time))+1000;
      log('OPENAI_PACING_MS='+wait); await sleep(wait);
      state.reservations=state.reservations.filter(x=>now()-x.time<60000);
    }
    state.reservations.push({time:now(),tokens:budget.reserved_tokens}); saveState(state);
    let response,body;
    try {
      response=await fetchImpl('https://api.openai.com/v1/responses',{method:'POST',redirect:'error',
        headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(600000)});
      const raw=await response.text();
      try {body=JSON.parse(raw);} catch {body=null;}
    } catch {
      // No automatic replay when acceptance by the server is unknown.
      if(response) report.attempts.push({attempt,...diagnostics(response,null,secret)});
      report.status='TRANSPORT_OUTCOME_UNKNOWN'; save(report); throw new Error(report.status);
    }
    const diagnostic=diagnostics(response,body,secret);
    report.attempts.push({attempt,...diagnostic});
    if(response.status>=200 && response.status<300) {
      if(!body) {report.status='INVALID_RESPONSE_JSON';save(report);throw new Error(report.status);}
      report.status='SUCCESS'; save(report);return body;
    }
    const kind=classify(response.status,body);
    report.status=kind;
    const temporary=kind==='TEMPORARY_RATE_LIMIT'||kind==='TEMPORARY_SERVER';
    const delay=retryDelay(diagnostic.headers,attempt,now(),random);
    const retry=temporary && attempt<POLICY.attempts && delay<=POLICY.maxDelayMs;
    Object.assign(report.attempts.at(-1),{classification:kind,retry,next_delay_ms:retry?delay:null});
    if(temporary && !retry) report.status=delay>POLICY.maxDelayMs?'RETRY_DEFERRED':'RETRY_EXHAUSTED';
    save(report);log(JSON.stringify(report.attempts.at(-1)));
    if(!retry) throw new Error(report.status);
    await sleep(delay);
  }
}
async function main(argv) {
  const [requestFile,responseFile,evidenceFile,stateFile]=argv;
  if(!stateFile) throw new Error('USAGE: openai-plan-request.js request response evidence shared-state');
  const write=(file,obj)=>fs.writeFileSync(file,JSON.stringify(obj,null,2)+'\n');
  // A GitHub rerun is not a recovery decision. Use a new explicit command after diagnosis.
  if(Number(process.env.GITHUB_RUN_ATTEMPT||1)>1) {write(evidenceFile,{status:'BLIND_RERUN_REFUSED'});throw new Error('BLIND_RERUN_REFUSED');}
  if(fs.existsSync(evidenceFile)) throw new Error('DUPLICATE_CALL_REFUSED');
  const state=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):{reservations:[]};
  const response=await execute(JSON.parse(fs.readFileSync(requestFile,'utf8')),{save:r=>write(evidenceFile,r),state,saveState:r=>write(stateFile,r),log:console.log});
  write(responseFile,response);
}
if(require.main===module) main(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={POLICY,measure,diagnostics,classify,duration,retryDelay,execute,main};
