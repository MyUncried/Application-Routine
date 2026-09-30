'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const {componentEvidence}=require('../../scripts/kodjo/lib/component-evidence');
const {restWriteCapabilities,declaredRestWriter}=require('../../scripts/kodjo/scan-remote-write-capability');
const {criterionIdentity,assertionIdentity}=require('../../scripts/kodjo/lib/ui-identities');
const {collect}=require('../../scripts/kodjo/collect-implementation-report');
const {verify:revision}=require('../../scripts/kodjo/verify-bounded-plan-revision');
function fixture(fn){const d=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-convergence-'));try{return fn(d,(p,s)=>{const f=path.join(d,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s);});}finally{fs.rmSync(d,{recursive:true,force:true});}}
function tag(n,x){return '<'+n+'>\n'+JSON.stringify(x)+'\n</'+n+'>\n';}
test('A08 F01/F08: directory imports, longest alias, fallback targets, static reexports and exact export use',()=>fixture((d,write)=>{
 write('tsconfig.json',JSON.stringify({compilerOptions:{paths:{'@/*':['missing/*'],'@/shared/*':['absent/*','src/shared/*']}}}));
 write('src/shared/i18n/index.ts','export function translate(){return 1;}');
 write('src/barrel.ts',"export {translate as tr} from './shared/i18n';");
 const c={component_decision:'REUSE',selected_component:{path:'src/shared/i18n/index.ts',export:'translate'},change_targets:['app/use.tsx']};
 for(const code of ["import {translate} from '@/shared/i18n'; translate();","import {translate as tr} from '../src/shared/i18n'; tr();","import {tr} from '../src/barrel'; tr();","import * as i18n from '@/shared/i18n'; i18n.translate();"]){write('app/use.tsx',code);assert.equal(componentEvidence(c,new Set(c.change_targets),d).status,'PASS',code);}
 for(const code of ["import {wrong} from '@/shared/i18n'; wrong();","import {translate} from '@/shared/i18n'; const text='translate';","// import {translate} from '@/shared/i18n'; translate();","import {translate} from '@/shared/i18n'; const unrelated=1;"]){write('app/use.tsx',code);assert.equal(componentEvidence(c,new Set(c.change_targets),d).status,'FAIL',code);}
 write('src/shared/button/index.tsx','export default function Button(){return null;}');
 const defaultCriterion={...c,selected_component:{path:'src/shared/button/index.tsx',export:'default'}};
 write('app/use.tsx',"import Button from '@/shared/button'; const node=<Button/>;");assert.equal(componentEvidence(defaultCriterion,new Set(c.change_targets),d).status,'PASS');
 write('src/cycle.ts',"export * from './cycle';");write('app/use.tsx',"import {translate} from '../src/cycle'; translate();");assert.equal(componentEvidence(c,new Set(c.change_targets),d).status,'FAIL');
}));
test('A08 F02: REST contents and Git-data writes are detected; read calls remain permitted',()=>{
 for(const code of ["fetch('https://api.github.com/repos/o/r/contents/f',{method:'PUT',body:'x'})","fetch('https://api.github.com/repos/o/r/git/commits', {\n method: 'POST'\n})","gh api --method PUT repos/o/r/contents/file --input payload","gh api repos/o/r/git/trees -X POST","gh api repos/o/r/contents/file --input payload","api('PATCH', root+'/git/refs/heads/main', body)","const fileApi=root+'/contents/'+p; api('PUT',fileApi,body)"]){assert.ok(restWriteCapabilities(code).length,code);}
 for(const code of ["fetch('https://api.github.com/repos/o/r/contents/f',{method:'GET'})","gh api --method GET repos/o/r/git/refs","api('POST',root+'/issues/1/comments',body)"]){assert.equal(restWriteCapabilities(code).length,0,code);}
 const file='scripts/kodjo/publish-independent-protocol-audit.js',source=fs.readFileSync(path.join(root,file),'utf8');assert.equal(declaredRestWriter(file,source),true);assert.equal(declaredRestWriter(file,source+'\n// modified'),false);assert.equal(declaredRestWriter('scripts/kodjo/unregistered.js',source),false);assert.equal(declaredRestWriter(file,source.replace(/\r\n/g,'\n').replace(/\n/g,'\r\n')),true);
});
test('A08 F07: evidence-only overflow terminates explicitly, normal evidence stays intact',()=>fixture((d,write)=>{
 const base={request_id:'r',source_head:'h',checks:[]};write('result.json',JSON.stringify(base));assert.equal(collect(d,'r','h').truncated,false);
 write('result.json',JSON.stringify({...base,modified_files:['x'.repeat(50000)]}));assert.throws(()=>collect(d,'r','h'),/IMPLEMENTATION_EVIDENCE_TOO_LARGE/);
}));
test('A08 F09: normalized sources preserve clean IDs and prevent whitespace identities',()=>{
 const source={path:'docs/spec.md',locator:'1',requirement:'Control present'},spaced=Object.fromEntries(Object.entries(source).map(([k,v])=>[k,' '+v+' ']));assert.equal(criterionIdentity(source),criterionIdentity(spaced));
 const a={source:{path:'docs/spec.md',locator:'1'},property_type:'PRESENCE',expected:'Control present',proof_required:['FUNCTIONAL_TEST']};assert.equal(assertionIdentity('UI-ABC',a),assertionIdentity('UI-ABC',{...a,expected:' Control present ',source:{path:' docs/spec.md ',locator:' 1 '}}));
});
test('A08 F05: NON_UI_COVERAGE adds only the uncovered existing scope; existing rows remain protected',()=>{
 const a={requirement_id:'REQ-OLD',domain:'NON_UI',source:{path:'docs/spec.md',locator:'1'},change_targets:['src/old.ts'],tests:[]};
 const b={requirement_id:'REQ-NEW',domain:'NON_UI',source:{path:'docs/spec.md',locator:'2'},change_targets:['src/missing.ts'],tests:['tests/missing.test.js']};
 const impact={scope_allow:['src/old.ts','src/missing.ts','tests/missing.test.js']};
 const plan=rows=>tag('KODJO_REQUIREMENT_CONTRACT_JSON',{requirements:rows})+tag('KODJO_PLAN_IMPACT_JSON',impact)+tag('KODJO_TEST_CONTRACT_JSON',{bindings:rows.flatMap(r=>r.tests.map(t=>({requirement_id:r.requirement_id,test_path:t})))})+tag('KODJO_NON_UI_COVERAGE_JSON',{status:'ENUMERATED'});
 const review=tag('KODJO_PLAN_REVIEW_FINDINGS_JSON',{verdict:'REVISE',findings:[{blocking:true,target_kind:'PLAN',target:'NON_UI_COVERAGE'}]});
 assert.equal(revision(plan([a]),review,plan([a,b])).status,'BOUNDED');
 assert.throws(()=>revision(plan([a]),review,plan([{...a,source:{...a.source,locator:'changed'}},b])),/UNTARGETED_CHANGE/);
 assert.throws(()=>revision(plan([a]),review,plan([a,{...b,change_targets:['src/unrelated.ts']}])),/UNTARGETED_CHANGE/);
});
test('A08 F10: DET required axis cannot be silently added to deferrals',()=>fixture((d,write)=>{
 const validator='scripts/kodjo/verify-independent-protocol-audit.js',matrix='.github/orchestration/reports/2026-09-29_PROTOCOL_DETERMINISM_MATRIX.md',deferrals='.github/orchestration/audit-deferrals.json';
 for(const p of [validator,matrix,deferrals])write(p,fs.readFileSync(path.join(root,p),'utf8'));
 const rows=JSON.parse(fs.readFileSync(path.join(d,deferrals)));rows.entries.push({id:'DET-01',priority:'DEFERRED',reason:'Unsupported drift'});write(deferrals,JSON.stringify(rows));
 const result=spawnSync(process.execPath,['-e',"require('./scripts/kodjo/verify-independent-protocol-audit')"],{cwd:d,encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,/DEFERRALS_INVALID/);
}));

test('A08 F03: actual finalize extraction ignores quoted tags and rejects duplicate machine blocks',()=>{
 const workflow=fs.readFileSync(path.join(root,'.github/workflows/kodjo-slice-finalize.yml'),'utf8');
 for(const variable of ['reviewContract','testEvidence']){
  const pattern=new RegExp('\\$'+variable+"Matches=\\[regex\\]::Matches\\(\\$reviewBody,'([^']+)'\\)").exec(workflow)?.[1];assert.ok(pattern);
  const tagName=variable==='reviewContract'?'KODJO_UI_IMPLEMENTATION_REVIEW_JSON':'KODJO_TEST_CONTRACT_EVIDENCE_JSON';
  const re=()=>new RegExp(pattern.replace('(?ms)',''),'gms');
  const block='<'+tagName+'>\n{"proof":true}\n</'+tagName+'>';
  for(const text of [block,"The reviewer mentioned `<"+tagName+">` above.\n"+block,block.replace(/\n/g,'\r\n')])assert.equal([...text.matchAll(re())].length,1,text);
  assert.equal([...(block+'\n'+block).matchAll(re())].length,2);
  assert.match(workflow,new RegExp('\\$'+variable+'Matches.Count-gt1'));
 }
});
