'use strict';
// One read-only independent review of four existing findings, never a global audit.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const CANDIDATE='b9f6e34acffe0576c4cd2c624de3e7ffdf42a09e';
const REPO='MyUncried/Application-Routine';
const IDS=['IA-F01','IA-F02','IA-F03','IA-F04'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const [candidateDir,outputDir]=process.argv.slice(2).map(p=>path.resolve(p));
fs.mkdirSync(outputDir,{recursive:true});
const save=(name,v)=>fs.writeFileSync(path.join(outputDir,name),typeof v==='string'?v:JSON.stringify(v,null,2)+'\n');
const git=(...a)=>execFileSync('git',a,{cwd:candidateDir,encoding:'utf8',maxBuffer:32*1024*1024}).trim();
const api=(p,binary=false)=>{const b=execFileSync('gh',['api','--hostname','github.com','--method','GET',p],{timeout:60000,maxBuffer:32*1024*1024});return binary?b:JSON.parse(b.toString('utf8'));};
function requireRun(id,head,names){
 const r=api(`repos/${REPO}/actions/runs/${id}`);
 if(r.repository.full_name!==REPO||r.status!=='completed'||r.conclusion!=='success'||r.head_sha!==head||r.run_attempt!==1)throw Error('UNQUALIFIED_RUN:'+id);
 const jobs=api(`repos/${REPO}/actions/runs/${id}/attempts/1/jobs?per_page=100`).jobs;
 for(const n of names){const rows=jobs.filter(j=>j.name===n);if(rows.length!==1||rows[0].conclusion!=='success'||rows[0].status!=='completed')throw Error('UNQUALIFIED_JOB:'+n);}
 save('run-'+id+'.json',{run:r,jobs});return {run:r,jobs};
}
function download(id,name,head){
 const a=api(`repos/${REPO}/actions/artifacts/${id}`);
 if(a.expired!==false||a.name!==name||a.workflow_run.head_sha!==head)throw Error('ARTIFACT_BINDING:'+id);
 const bytes=api(`repos/${REPO}/actions/artifacts/${id}/zip`,true);
 if(a.digest!=='sha256:'+hash(bytes))throw Error('ARTIFACT_DIGEST:'+id);
 const zip=path.join(outputDir,id+'.zip'),dest=path.join(outputDir,String(id));fs.writeFileSync(zip,bytes);
 execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop'; Expand-Archive -LiteralPath $env:VNEXT_ARCHIVE_PATH -DestinationPath $env:VNEXT_EXTRACT_PATH"],{env:{...process.env,VNEXT_ARCHIVE_PATH:zip,VNEXT_EXTRACT_PATH:dest},timeout:60000});
 save('artifact-'+id+'.json',a);return dest;
}
function find(root,base){
 const rows=[];function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name===base)rows.push(p);}}walk(root);
 if(rows.length!==1)throw Error('AMBIGUOUS_EVIDENCE:'+base);return JSON.parse(fs.readFileSync(rows[0],'utf8'));
}
function main(){
 if(git('rev-parse','HEAD')!==CANDIDATE||git('status','--porcelain','--untracked-files=all'))throw Error('CANDIDATE_DRIFT');
 const original=api(`repos/${REPO}/contents/.github/orchestration/reports/2026-10-08_INDEPENDENT_AUDIT_37746114185_1.md?ref=c50dd5b996097e15ffcb9d57b1074e19bbad6fdd`);
 if(original.sha!=='bf1186e0a322fbdf0c561bca94659554028da4c2')throw Error('ORIGINAL_AUDIT_DRIFT');
 const audit=Buffer.from(original.content,'base64').toString('utf8');
 save('original-four-findings.md',audit.slice(audit.indexOf('### IA-F01'),audit.indexOf('### IA-F05')));
 const closure=requireRun(37777593561,'d7e20b794b14f3b6202185edd07f66ed07995d60',['test-delivery','close-vnext-delivery']);
 requireRun(37771627024,CANDIDATE,['qualify-exact-head','real-plan-revision']);
 const raw=download(11549691763,'kodjo-vnext12-revision-37771627024-1',CANDIDATE);
 const Chain=require(path.join(candidateDir,'scripts/kodjo/lib/vnext-live-chain'));
 const base=find(raw,'base-produced.json'),next=find(raw,'revision-produced.json');
 const br=find(raw,'base-review-receipt.json'),nr=find(raw,'revision-review-receipt.json');
 Chain.verifyReceipt(base,br);Chain.verifyReceipt(next,nr);
 const status=find(raw,'status.json');
 if(base.producer_revision!==CANDIDATE||next.producer_revision!==CANDIDATE||br.review_report.verdict!=='REVISE'||nr.review_report.verdict!=='APPROVE'||status.status!=='REVIEWED_REVISION_PENDING_HANDOFF'||status.revision_count!==1||status.implementation_invoked!==false||status.final_audit_invoked!==false)throw Error('REAL_REVIEW_OUTCOME');
 const closureFiles=download(11551505688,'kodjo-vnext-closure-37777593561-1',closure.run.head_sha);
 const recorded=find(closureFiles,'github-closure.json'),recovery=find(closureFiles,'recovery.json');
 const V=require(path.join(candidateDir,'scripts/kodjo/lib/vnext-contract'));V.verifyContractHash(recorded);
 if(recorded.issue_number!==335||recorded.final_output_comment_id!=='6059972976'||recorded.slice_closed_comment_id!=='6059974508'||recovery.status!=='REUSED_EXISTING_CLOSURE'||recovery.new_records_created!==false)throw Error('CLOSURE_RECORD');
 const issue=api(`repos/${REPO}/issues/335`),comments=api(`repos/${REPO}/issues/335/comments?per_page=100`);
 if(issue.state!=='closed'||issue.state_reason!=='completed')throw Error('CLOSURE_NOT_OBSERVED');
 for(const id of [6059972976,6059974508]){const c=comments.find(c=>c.id===id);if(c?.user.login!=='github-actions[bot]')throw Error('CLOSURE_AUTHOR');const data=JSON.parse(c.body.match(/```json\s*([\s\S]*?)```/)[1]);if(data.finalization_hash!==recorded.finalization_hash||data.test_evidence.source_run!=='37777593561')throw Error('CLOSURE_COMMENT_DRIFT');}
 save('observed-closure-issue.json',{issue,comments});
 // Re-run the shared verifier against the real external run, ZIP and exact tree.
 const delivery=outputDir+'.delivery';execFileSync('git',['worktree','add','--detach',delivery,recorded.head],{cwd:candidateDir});
 const proof=require(path.join(candidateDir,'scripts/kodjo/lib/vnext-test-evidence')).verify(recorded.test_evidence,{repository:REPO,head:recorded.head,cwd:delivery,controllerCwd:candidateDir});
 if(V.canonicalStringify(proof)!==V.canonicalStringify(recorded.test_evidence))throw Error('TEST_EVIDENCE_REPLAY_DRIFT');
 execFileSync('git',['worktree','remove',delivery],{cwd:candidateDir});
 save('verified-observations.json',{candidate_sha:CANDIDATE,scope:IDS,real_status:status,base_session:br.session_id,revision_session:nr.session_id,base_coverage:br.review_report.coverage_status,revision_coverage:nr.review_report.coverage_status,closure:recorded,recovery,verified_test_evidence:proof});
 const check=execFileSync(process.execPath,['--test','tests/kodjo/vnext-github-closure.pilot.js','tests/kodjo/vnext-closure-provenance.pilot.js','tests/kodjo/vnext-audit-tolerance.pilot.js','tests/kodjo/vnext-finalization-incidents.pilot.js','tests/kodjo/vnext-review-contract.pilot.js','tests/kodjo/vnext-figma-source.pilot.js'],{cwd:candidateDir,encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024});save('targeted-tests.txt',check);
 save('candidate-diff.patch',execFileSync('git',['diff','27a8a1a3339f3980899c6e3d0be9d14f181e0067',CANDIDATE],{cwd:candidateDir,encoding:'utf8',maxBuffer:32*1024*1024}));
 const cfg=path.join(outputDir,'model-config');fs.mkdirSync(cfg);fs.writeFileSync(path.join(cfg,'mcp.json'),'{"mcpServers":{}}');fs.writeFileSync(path.join(cfg,'settings.json'),'{"disableAllHooks":true}');
 const schema={type:'object',additionalProperties:false,required:['candidate_sha','scope','verdict','findings','minor_reserves','merge_recommendation','rationale'],properties:{candidate_sha:{const:CANDIDATE},scope:{const:'EXISTING_IA_F01_TO_F04_ONLY'},verdict:{enum:['APPROVE','REVISE']},findings:{type:'array',minItems:4,maxItems:4,items:{type:'object',additionalProperties:false,required:['id','status','evidence','remaining_gap'],properties:{id:{enum:IDS},status:{enum:['RESOLVED','OPEN','NON_VERIFIABLE']},evidence:{type:'string'},remaining_gap:{type:'string'}}}},minor_reserves:{type:'array',items:{enum:['IA-F06','IA-F07','IA-F09']},minItems:3,maxItems:3},merge_recommendation:{enum:['APPROVE_WITH_TRACKED_MINOR_RESERVES','DO_NOT_MERGE']},rationale:{type:'string'}}};
 const prompt=`Revue indépendante ciblée en lecture seule, en français. Candidat exact ${CANDIDATE}, PR334. Examine exclusivement les constats historiques IA-F01 (bloquant), IA-F02/03/04 (majeurs) et les dépendances démontrées de leurs corrections. Lis ${path.join(outputDir,'original-four-findings.md')}, les sources actuelles dans ${candidateDir}, le diff ${path.join(outputDir,'candidate-diff.patch')}, les tests et les preuves vérifiées de ${outputDir}. Ne lance pas un nouvel audit global ni ne reclasse les réserves. Cherche les contre-exemples sur ces quatre règles ; une dépendance non corrigée maintient le constat existant ouvert. Vérifie toute affirmation du rapport de réparation dans le checkout. Le contrôleur a téléchargé et vérifié les ZIP réels (digests), rejoué verifyReceipt pour les deux revues et le vérificateur partagé des tests de clôture. Lis également les vrais reçus archivés si nécessaire. La clôture GitHub réelle est une livraison de qualification, pas une nouvelle tranche applicative ; ne prétends pas que la branche produit a été exercée. IA-F04 exige false pour les deux portées jusqu'à producteur device qualifié ; aucune acceptation de true n'est requise aujourd'hui. L'attestation sémantique des plages reste une déclaration du reviewer ; IA-F03 portait sur l'absence de qualification réelle, pas une preuve mécanique de lecture. Les réserves IA-F06/F07/F09 restent ouvertes ; évalue si elles permettent une intégration avec suivi, sans inventer une nouvelle sévérité. Aucun test non exécuté ne doit être déclaré réussi. Les tests ciblés du contrôleur sont dans targeted-tests.txt ; le modèle n'exécute aucun code. Utilise uniquement Read/Glob/Grep. Retourne le JSON demandé, avec preuves concrètes pour chaque constat. APPROVE ne concerne que cette résolution ciblée et ne remplace pas l'ancien rapport global.`;
 save('prompt.txt',prompt);
 const env={...process.env};delete env.GH_TOKEN;delete env.GITHUB_TOKEN;
 const bin=require(path.join(candidateDir,'scripts/kodjo/resolve-claude-binary')).resolve(env);
 const auth=JSON.parse(execFileSync(bin,['auth','status'],{env,encoding:'utf8',timeout:30000}));if(auth.loggedIn!==true)throw Error('CLAUDE_NOT_LOGGED_IN');save('auth-status.json',{loggedIn:true,model_invoked:false});
 const args=['--add-dir',outputDir,'-p','--restricted','--permission-mode','dontAsk','--permission-prompts','none','--output-format','stream-json','--verbose','--tools','Read,Glob,Grep','--allowedTools','Read,Glob,Grep','--disallowedTools','mcp__*','--strict-mcp-config','--mcp-config',path.join(cfg,'mcp.json'),'--settings',path.join(cfg,'settings.json'),'--json-schema',JSON.stringify(schema)];
 const Process=require(path.join(candidateDir,'scripts/kodjo/lib/vnext-review-process'));
 const rawResponse=Process.command(bin,args,candidateDir,prompt,env,1200000,{progressPath:path.join(outputDir,'review-progress.json'),onResult:r=>save('review-process.json',r)});
 save('response.json',rawResponse);const response=JSON.parse(rawResponse),out=response.structured_output;
 if(response.type!=='result'||response.is_error||!response.session_id||!out||out.candidate_sha!==CANDIDATE||out.scope!=='EXISTING_IA_F01_TO_F04_ONLY'||!Array.isArray(out.findings)||out.findings.length!==4||new Set(out.findings.map(x=>x.id)).size!==4||out.findings.some(x=>!IDS.includes(x.id)||!['RESOLVED','OPEN','NON_VERIFIABLE'].includes(x.status)||!x.evidence?.trim())||!['APPROVE','REVISE'].includes(out.verdict)||!['APPROVE_WITH_TRACKED_MINOR_RESERVES','DO_NOT_MERGE'].includes(out.merge_recommendation)||JSON.stringify([...out.minor_reserves].sort())!==JSON.stringify(['IA-F06','IA-F07','IA-F09']))throw Error('TARGETED_REVIEW_INVALID');
 if(out.verdict==='APPROVE'&&(out.findings.some(x=>x.status!=='RESOLVED')||out.merge_recommendation!=='APPROVE_WITH_TRACKED_MINOR_RESERVES'))throw Error('TARGETED_APPROVE_WITH_OPEN_FINDING');
 if(git('status','--porcelain','--untracked-files=all')||git('rev-parse','HEAD')!==CANDIDATE)throw Error('REVIEW_MUTATED_CANDIDATE');
 save('summary.json',{...out,session_id:response.session_id,response_sha256:hash(rawResponse),source_run:process.env.GITHUB_RUN_ID,source_attempt:process.env.GITHUB_RUN_ATTEMPT,model_calls:1,global_audit_invoked:false});
 console.log(JSON.stringify({verdict:out.verdict,session_id:response.session_id,findings:out.findings.map(x=>({id:x.id,status:x.status})),merge_recommendation:out.merge_recommendation}));
}
try{main();}catch(e){save('failure.json',{error:e.message,global_audit_invoked:false});console.error(e.message);process.exitCode=1;}
