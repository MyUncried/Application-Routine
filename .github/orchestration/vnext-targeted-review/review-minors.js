'use strict';
// Existing campaign, one read-only review of IA-F05..09. No global audit.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync,spawnSync}=require('node:child_process');
const REPO='MyUncried/Application-Routine',IDS=['IA-F05','IA-F06','IA-F07','IA-F08','IA-F09'];
const CANDIDATE=process.env.CANDIDATE_HEAD,BASE='17d9774a31429bc2bee4eb834e4ed1e9aafa68ec';
const [candidateDir,outputDir]=process.argv.slice(2).map(p=>path.resolve(p));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(outputDir,{recursive:true});
const save=(name,v)=>fs.writeFileSync(path.join(outputDir,name),typeof v==='string'?v:JSON.stringify(v,null,2)+'\n');
const git=(...a)=>execFileSync('git',a,{cwd:candidateDir,encoding:'utf8',maxBuffer:32*1024*1024}).trim();
const api=p=>JSON.parse(execFileSync('gh',['api','--hostname','github.com','--method','GET',p],{timeout:60000,maxBuffer:32*1024*1024}).toString('utf8'));
function main(){
 if(!/^[0-9a-f]{40}$/.test(CANDIDATE||'')||git('rev-parse','HEAD')!==CANDIDATE||git('status','--porcelain','--untracked-files=all'))throw Error('CANDIDATE_DRIFT');
 const Q=require(path.join(candidateDir,'scripts/kodjo/lib/vnext-github-qualification'));
 const runs=Q.pages(`repos/${REPO}/actions/runs?head_sha=${CANDIDATE}`,'workflow_runs',api).filter(r=>r.path===Q.WORKFLOW&&r.head_sha===CANDIDATE).sort((a,b)=>b.id-a.id);
 if(!runs[0])throw Error('QUALIFICATION_MISSING');
 save('verified-qualification.json',Q.verifyQualification({repository:REPO,head:CANDIDATE,runId:runs[0].id,read:api}));
 const original=api(`repos/${REPO}/contents/.github/orchestration/reports/2026-10-08_INDEPENDENT_AUDIT_37746114185_1.md?ref=c50dd5b996097e15ffcb9d57b1074e19bbad6fdd`);
 if(original.sha!=='bf1186e0a322fbdf0c561bca94659554028da4c2')throw Error('ORIGINAL_AUDIT_DRIFT');
 const audit=Buffer.from(original.content,'base64').toString('utf8');save('original-five-findings.md',audit.slice(audit.indexOf('### IA-F05'),audit.indexOf('## C.')));
 const previous=api(`repos/${REPO}/issues/comments/6060798965`);save('prior-targeted-review.json',previous);
 save('candidate-diff.patch',execFileSync('git',['diff',BASE,CANDIDATE],{cwd:candidateDir,encoding:'utf8',maxBuffer:32*1024*1024}));
 const check=spawnSync(process.execPath,['--test','tests/kodjo/vnext-minor-reserves.pilot.js','tests/kodjo/vnext-github-closure.pilot.js','tests/kodjo/vnext-finalization-incidents.pilot.js','tests/kodjo/vnext-campaign-sequence.pilot.js','tests/kodjo/vnext-architecture-closure.pilot.js','tests/kodjo/vnext-audit-convergence.pilot.js'],{cwd:candidateDir,encoding:'utf8',timeout:180000,maxBuffer:16*1024*1024});
 save('targeted-tests.txt',check.stdout||'');save('targeted-tests-stderr.txt',check.stderr||'');
 save('targeted-test-process.json',{exit_code:check.status,signal:check.signal,error:check.error?.message||null,model_invoked:false});
 if(check.error||check.status!==0){console.error((check.stdout||'').slice(-12000));console.error((check.stderr||'').slice(-4000));throw Error('TARGETED_CHECKS_FAILED_BEFORE_REVIEW:'+check.status);}
 const cfg=path.join(outputDir,'model-config');fs.mkdirSync(cfg);fs.writeFileSync(path.join(cfg,'mcp.json'),'{"mcpServers":{}}');fs.writeFileSync(path.join(cfg,'settings.json'),'{"disableAllHooks":true}');
 const schema={type:'object',additionalProperties:false,required:['candidate_sha','scope','verdict','findings','rationale'],properties:{candidate_sha:{const:CANDIDATE},scope:{const:'EXISTING_IA_F05_TO_F09_ONLY'},verdict:{enum:['APPROVE','REVISE']},findings:{type:'array',minItems:5,maxItems:5,items:{type:'object',additionalProperties:false,required:['id','status','evidence','remaining_gap'],properties:{id:{enum:IDS},status:{enum:['RESOLVED','OPEN','NON_VERIFIABLE']},evidence:{type:'string'},remaining_gap:{type:'string'}}}},rationale:{type:'string'}}};
 const prompt=`Revue indépendante ciblée en lecture seule, en français. Candidat exact ${CANDIDATE}, base ${BASE}. Reprends uniquement les cinq constats historiques IA-F05..IA-F09 (tous mineurs, sans reclassification). IA-F01..04 restent RESOLVED selon 6060798965 : ne les rouvre pas sans régression démontrée d'une dépendance modifiée. Lis ${path.join(outputDir,'original-five-findings.md')}, le diff, les sources actuelles dans ${candidateDir}, le registre .github/orchestration/reports/2026-10-08_VNEXT_AUDIT_TARGETED_REPAIR.md, les tests réellement exécutés targeted-tests.txt et la qualification Linux/Windows exacte verified-qualification.json. Aucun audit global. Vérifie producteur → transport → consommateurs → validation → clôture pour IA-F07 : les omissions doivent survivre au plan approuvé Git, à la finalisation et aux deux publications durables/locales, y compris reprise. Les tests d'omissions sont des fixtures synthétiques explicitement déclarées avec Git réel/API injectée : ne prétends jamais qu'ils sont des appels réels de reviewer ou une clôture GitHub distante. Un ancien parcours réel sans omission ne démontre pas cette propagation. Détermine si les preuves mécaniques ciblées suffisent à résoudre le défaut, et signale explicitement toute preuve opérationnelle indispensable manquante. Seuils inchangés 3 omissions ET 2 %, essentiels couverts. IA-F06 : bases bornées ou justification versionnée liée à campagne/branche, sans fusion. IA-F09 : absence historique tolérée, paquet présent invalide gating sur le consommateur VNext ; workflow V2 figé hors mission et ne qualifiant pas VNext. IA-F05 : tests doivent atteindre REBUILD_MISMATCH ; IA-F08 : refus legacy dans validateConfig autoritatif. N'exécute aucun code : Read/Glob/Grep uniquement. Cherche les contre-exemples, ne déclare aucun contrôle non exécuté réussi. APPROVE uniquement si les cinq constats sont résolus avec preuves suffisantes ; sinon REVISE et indique correction restante dans le constat existant. Ne reconstruis aucun protocole, ne lance pas PRE-3. Retourne le JSON demandé.`;
 save('prompt.txt',prompt);
 const env={...process.env};delete env.GH_TOKEN;delete env.GITHUB_TOKEN;
 const bin=require(path.join(candidateDir,'scripts/kodjo/resolve-claude-binary')).resolve(env);
 const auth=JSON.parse(execFileSync(bin,['auth','status'],{env,encoding:'utf8',timeout:30000}));if(auth.loggedIn!==true)throw Error('CLAUDE_NOT_LOGGED_IN');save('auth-status.json',{loggedIn:true,model_invoked:false});
 const args=['--add-dir',outputDir,'-p','--restricted','--permission-mode','dontAsk','--permission-prompts','none','--output-format','stream-json','--verbose','--tools','Read,Glob,Grep','--allowedTools','Read,Glob,Grep','--disallowedTools','mcp__*','--strict-mcp-config','--mcp-config',path.join(cfg,'mcp.json'),'--settings',path.join(cfg,'settings.json'),'--json-schema',JSON.stringify(schema)];
 const Process=require(path.join(candidateDir,'scripts/kodjo/lib/vnext-review-process'));
 const rawResponse=Process.command(bin,args,candidateDir,prompt,env,1200000,{progressPath:path.join(outputDir,'review-progress.json'),onResult:r=>save('review-process.json',r)});
 save('response.json',rawResponse);const response=JSON.parse(rawResponse),out=response.structured_output;
 if(response.type!=='result'||response.is_error||!response.session_id||!out||out.candidate_sha!==CANDIDATE||out.scope!=='EXISTING_IA_F05_TO_F09_ONLY'||!Array.isArray(out.findings)||out.findings.length!==5||new Set(out.findings.map(x=>x.id)).size!==5||out.findings.some(x=>!IDS.includes(x.id)||!['RESOLVED','OPEN','NON_VERIFIABLE'].includes(x.status)||!x.evidence?.trim())||!['APPROVE','REVISE'].includes(out.verdict))throw Error('TARGETED_REVIEW_INVALID');
 if(out.verdict==='APPROVE'&&out.findings.some(x=>x.status!=='RESOLVED'))throw Error('TARGETED_APPROVE_WITH_OPEN_FINDING');
 if(git('status','--porcelain','--untracked-files=all')||git('rev-parse','HEAD')!==CANDIDATE)throw Error('REVIEW_MUTATED_CANDIDATE');
 save('summary.json',{...out,session_id:response.session_id,response_sha256:hash(rawResponse),source_run:process.env.GITHUB_RUN_ID,source_attempt:process.env.GITHUB_RUN_ATTEMPT,model_calls:1,global_audit_invoked:false});
 console.log('TARGETED_REVIEW_SUMMARY '+JSON.stringify({...out,session_id:response.session_id,response_sha256:hash(rawResponse),source_run:process.env.GITHUB_RUN_ID,source_attempt:process.env.GITHUB_RUN_ATTEMPT,model_calls:1,global_audit_invoked:false}));
}
try{main();}catch(e){save('failure.json',{error:e.message,global_audit_invoked:false});console.error(e.message);process.exitCode=1;}
