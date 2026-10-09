'use strict';
// Local transport for the existing PRE-3 operation. Calls only the canonical
// VNext plan review; never implementation, approval, queue dispatch or audit.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const REVISION='1d42479181586d926a9970867a41d35d44cc4661';
const PLAN_HASH='5145cbd30860f9ddef041ed33b97a71697517a3ef248229112bb0f5f7b92006f';
const CHAIN_HASH='603de045f94fec3f14aa2198edaaad0b91020b79adddb19041b06314cc725e16';
const UI_HASH='d4aa55ad8a0752ae4083a33a96d5d006491258ab1dee5bf2856610ec9399e4c9';
function main(){
  const args=process.argv.slice(2);
  if(args.some(x=>!['--recover','--resume-preparation'].includes(x))||args.length>1)throw Error('Usage: node docs/preparation/PRE-3/planification/lancer-revue-poste.cjs [--recover|--resume-preparation]');
  if(Number(process.versions.node.split('.')[0])<24)throw Error('Node 24 or newer required: qualification used Node 24.');
  const repository=path.resolve(__dirname,'../../../..');
  const folder=path.join(os.tmpdir(),'p3-1d424791'),checkout=path.join(folder,'checkout');
  const correctedOutput=path.join(folder,'evidence-lf');
  const output=args[0]==='--resume-preparation'||(args[0]==='--recover'&&fs.existsSync(correctedOutput))?correctedOutput:path.join(folder,'evidence');
  const config=path.join(folder,'review-config.json'),receipt=path.join(output,'review-receipt.json');
  const run=(bin,argv,cwd=checkout)=>{
    const r=spawnSync(bin,argv,{cwd,shell:false,windowsHide:true,stdio:'inherit'});
    if(r.error)throw r.error;
    if(r.status!==0)throw Error('Command failed ('+r.status+'): '+path.basename(bin)+' '+argv[0]+'. Preserve '+folder+'; no automatic retry.');
  };
  console.log('Operation #340; exact producer '+REVISION+'; durable evidence '+output);
  if(args[0]==='--recover'){
    if(!fs.existsSync(config)||!fs.existsSync(path.join(output,'claude-review','initial-review-response.json')))
      throw Error('No durable review response to recover. Do not launch again while another process is active.');
    if(fs.existsSync(receipt))throw Error('Review receipt already exists; send that result instead of launching again.');
    run(process.execPath,['--max-old-space-size=7168','scripts/kodjo/vnext-chain.js','recover-review',config,receipt]);
    console.log('Recovered receipt: '+receipt);return;
  }
  const resume=args[0]==='--resume-preparation';
  if(resume){
    if(fs.existsSync(config)||fs.existsSync(correctedOutput)||fs.existsSync(path.join(folder,'evidence','claude-review')))
      throw Error('Review or corrected preparation already exists. No duplicate launch.');
    const prior=JSON.parse(fs.readFileSync(path.join(folder,'evidence','construction-receipt.json'),'utf8'));
    if(prior.status!=='READY_FOR_INDEPENDENT_REVIEW'||prior.producer_revision!==REVISION||prior.plan_contract_hash!=='87523768e4a917c0f92928feb65337762f1a8d8ec4395bb16779ab7ae43b579d'||prior.ui_contract_hash!=='86d30bdeab4e93734d62631c090412004db21b0cffdec632063121ca71c08cb9'||prior.produced_chain_hash!=='ec4d5620c62fe074d3d606d07308e595df7ab0034cd3f494ed6a53807a287d6c')
      throw Error('This recovery is restricted to the diagnosed CRLF construction. Preserve the evidence.');
  }else if(fs.existsSync(folder))throw Error('Operation directory already exists: '+folder+'. No duplicate launch. Inspect its evidence; use --recover only after a durable response.');
  const claude=require(path.join(repository,'scripts/kodjo/lib/claude-local')).resolveClaudeBinary();
  run('git',['--version'],repository);
  run(claude,['--version'],repository);
  run(claude,['auth','status'],repository);
  run('git',['fetch','origin','plan/pre3-vnext-20261008'],repository);
  if(!resume){
    fs.mkdirSync(folder,{recursive:true});
    run('git',['-c','core.autocrlf=false','worktree','add','--detach',checkout,REVISION],repository);
  }
  const head=spawnSync('git',['rev-parse','HEAD'],{cwd:checkout,encoding:'utf8',shell:false});
  if(head.status!==0||head.stdout.trim()!==REVISION)throw Error('Exact checkout revision mismatch.');
  const status=spawnSync('git',['status','--porcelain'],{cwd:checkout,encoding:'utf8',shell:false});
  if(status.status!==0||status.stdout)throw Error('Review checkout must be clean.');
  // Preserve Git bytes even when an existing Windows checkout converted this
  // Markdown input to CRLF. Never accept changed content or relax plan hashes.
  const schemaPath='docs/preparation/PRE-3/planification/schema-et-ecritures.md';
  const schema=spawnSync('git',['show',REVISION+':'+schemaPath],{cwd:checkout,shell:false,maxBuffer:1024*1024});
  if(schema.status!==0||schema.error)throw Error('Cannot read committed schema bytes.');
  const disk=fs.readFileSync(path.join(checkout,schemaPath));
  if(!disk.equals(schema.stdout)){
    if(disk.toString('utf8').replace(/\r\n/g,'\n')!==schema.stdout.toString('utf8'))throw Error('Schema differs beyond CRLF; recovery refused.');
    fs.writeFileSync(path.join(checkout,schemaPath),schema.stdout);
  }
  fs.mkdirSync(output);
  fs.writeFileSync(path.join(folder,resume?'preparation-recovery.json':'operation.json'),JSON.stringify({issue:340,producer_revision:REVISION,checkout,output,started_at:new Date().toISOString(),independentReview:false,ownerApproval:false,implementation:false},null,2)+'\n',{flag:'wx'});
  const launch=resume?path.join(folder,'evidence','launch.json'):path.join(output,'launch.json');
  if(!resume)run(process.execPath,['--max-old-space-size=6144','docs/preparation/PRE-3/planification/lancer-source-vnext.cjs',output]);
  run(process.execPath,['--max-old-space-size=7168','docs/preparation/PRE-3/planification/construire-contrats-vnext.cjs',output,launch]);
  const construction=JSON.parse(fs.readFileSync(path.join(output,'construction-receipt.json'),'utf8'));
  if(construction.status!=='READY_FOR_INDEPENDENT_REVIEW'||construction.producer_revision!==REVISION||construction.produced_chain_hash!==CHAIN_HASH||construction.plan_contract_hash!==PLAN_HASH||construction.ui_contract_hash!==UI_HASH||construction.requirements!==6384||construction.scopeIds!==23||construction.assertions!==243974)
    throw Error('Reconstructed contracts differ from the published plan. No reviewer invocation.');
  fs.writeFileSync(config,JSON.stringify({produced_file:path.join(output,'produced.json'),evidence_directory:path.join(output,'claude-review')},null,2)+'\n',{flag:'wx'});
  console.log('Starting canonical independent plan review. Monitor '+path.join(output,'claude-review','initial-review-progress.json'));
  run(process.execPath,['--max-old-space-size=7168','scripts/kodjo/vnext-chain.js','review',config,receipt]);
  console.log('Review receipt: '+receipt+'. This result is not owner approval. Return it for validation and publication in #340.');
}
if(require.main===module)try{main();}catch(e){console.error(e.message);process.exitCode=1;}
module.exports={main};
