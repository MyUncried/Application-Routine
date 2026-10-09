'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const root=__dirname,read=n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');let checks=0;
function check(value,message){if(!value)throw Error(message);checks++;}
const m=read('manifest.json');
for(const f of m.files){const b=fs.readFileSync(path.join(root,f.path));check(b.length===f.bytes&&hash(b)===f.sha256,'Dossier drift: '+f.path);}
for(const f of m.source_inputs)check(hash(fs.readFileSync(path.resolve(root,f.path)))===f.sha256,'Source drift: '+f.path);
const r=read('requirements.json'),t=read('traceability.json'),p=read('tests-and-preservation.json'),u=read('ui-criteria.json'),e=read('ui-elements.json'),ledger=read('finding-resolutions.json');
check(r.documentary_requirements.length===95,'95 documentary states preserved');
check(new Set(r.documentary_requirements.map(x=>x.requirement_id)).size===95,'Requirement IDs unique');
check(t.scopes.length===23&&new Set(t.scopes.map(x=>x.scope_id)).size===23,'23 scopes');
check(u.visual_states.length===41&&e.elements.length===6725,'Full frozen visual inventory');
check(e.elements.filter(x=>x[5]==='HIDDEN_SOURCE_PRESERVED').length===65,'Hidden descendants preserved');
check(ledger.findings.length===13&&new Set(ledger.findings.map(x=>x.finding_id)).size===13,'All original blocking findings');
check(ledger.findings.every(x=>x.status==='CORRECTED_PENDING_INDEPENDENT_REVIEW'&&!x.resolution_accepted),'No closure invented');
check(r.migration_requirements.length===8&&p.test_obligations.filter(x=>x.test_id.startsWith('P3-17/migration/')).length===8,'Eight independent migration obligations');
check(p.test_obligations.filter(x=>x.test_id.startsWith('P3-12/numeric/')).length===13,'13 independent numeric cases');
check(p.test_obligations.filter(x=>x.test_id.startsWith('P3-15/corpus/')).length===276,'276 phrase cases');
for(const c of p.test_obligations.filter(x=>x.test_id.startsWith('P3-15/corpus/'))){check(c.expected_segments.map(x=>x.texte).join('')===c.expected_text,'Segments/text mismatch '+c.test_id);check(c.expected_segments.every(x=>typeof x.gras==='boolean'),'Missing bold fixture');}
const write=new Map(p.write_scope.map(x=>[x.path,x]));
for(const c of p.test_obligations)check(write.has(c.path),'Undeclared test path '+c.path);
for(const s of t.scopes)check(s.rule_ids.length>0&&s.assertion_ids.length>0&&s.tests.length>0,'Incomplete scope '+s.scope_id);
for(const c of r.documentary_requirements){check(c.scope_ids.every(x=>t.scopes.some(y=>y.scope_id===x)),'Unknown scope');if(c.kind==='PRESERVATION')check(c.preservation==='REQUIRED','Preservation missing');if(c.state_id.includes('6411-9546')||c.state_id.includes('6423-9953')||c.state_id.includes('P3-14-'))check(c.scope_ids.includes('P3-14'),'Inverse mapped to visual scope');}
for(const x of p.modify_preservation)check(x.baseline_observation&&x.preservation_candidate_paths.length>0,'Missing MODIFY preservation '+x.path);
for(const x of p.no_change_direct_importers)check(x.test_action==='RUN_EXISTING'&&x.tests_affected_paths.length>0,'Missing NO_CHANGE tests '+x.path);
check(u.interactions.length===10&&u.accessibility.length===10,'Surface interactions/accessibility');
check(u.native_assessments.interaction_assertion_ref==='INTERACTION/wheel','Native interaction binding');
for(const x of u.interactions)check(x.source_authority==='FUNCTIONAL'&&x.proof_required.includes('FUNCTIONAL_TEST'),'Interaction proof');
for(const x of u.visual_states){check(fs.existsSync(path.resolve(root,x.source)),'Missing Figma tree '+x.frame_id);check(fs.existsSync(path.resolve(root,x.capture)),'Missing PNG '+x.frame_id);}
const storage=read('baseline-blobs.json'),bytes=zlib.gunzipSync(Buffer.from(storage.payload,'base64'));check(bytes.length===storage.uncompressed_bytes&&hash(bytes)===storage.sha256,'Blob storage corrupted');
const contents=JSON.parse(bytes),observations=read('baseline-observations.json');
for(const o of observations)check(hash(Buffer.from(contents[o.content_key],'utf8'))===o.sha256,'Baseline blob drift '+o.path);
check(observations.some(x=>x.path==='src/features/sessions/DurationWheelPicker.tsx'),'Native picker actually observed');
check(read('creation-observations.json').length===23,'Original creation slots retained');
check(!m.protocol_exception.owner_plan_approval&&!m.protocol_exception.implementation_started,'Premature approval/development');
const result={stage:'CORRECTED_PLAN_DOSSIER_INTEGRITY',result:'PASS',checks,counts:m.counts,manifest_sha256:hash(fs.readFileSync(path.join(root,'manifest.json'))),application_tested:false,independent_review:false};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(root,'verification.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
