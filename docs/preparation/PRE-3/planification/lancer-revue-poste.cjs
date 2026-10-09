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
  if(args.some(x=>x!=='--recover')||args.length>1)throw Error('Usage: node docs/preparation/PRE-3/planification/lancer-revue-poste.cjs [--recover]');
  if(Number(process.versions.node.split('.')[0])<24)throw Error('Node 24 or newer required: qualification used Node 24.');
  const repository=path.resolve(__dirname,'../../../..');
  const folder=path.join(os.tmpdir(),'p3-1d424791'),checkout=path.join(folder,'checkout'),output=path.join(folder,'evidence');
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
  if(fs.existsSync(folder))throw Error('Operation directory already exists: '+folder+'. No duplicate launch. Inspect its evidence; use --recover only after a durable response.');
  const claude=require(path.join(repository,'scripts/kodjo/lib/claude-local')).resolveClaudeBinary();
  run('git',['--version'],repository);
  run(claude,['--version'],repository);
  run(claude,['auth','status'],repository);
  run('git',['fetch','origin','plan/pre3-vnext-20261008'],repository);
  fs.mkdirSync(folder,{recursive:true});
  run('git',['worktree','add','--detach',checkout,REVISION],repository);
  const head=spawnSync('git',['rev-parse','HEAD'],{cwd:checkout,encoding:'utf8',shell:false});
  if(head.status!==0||head.stdout.trim()!==REVISION)throw Error('Exact checkout revision mismatch.');
  const status=spawnSync('git',['status','--porcelain'],{cwd:checkout,encoding:'utf8',shell:false});
  if(status.status!==0||status.stdout)throw Error('Review checkout must be clean.');
  fs.mkdirSync(output);
  fs.writeFileSync(path.join(folder,'operation.json'),JSON.stringify({issue:340,producer_revision:REVISION,checkout,output,started_at:new Date().toISOString(),independentReview:false,ownerApproval:false,implementation:false},null,2)+'\n',{flag:'wx'});
  run(process.execPath,['--max-old-space-size=6144','docs/preparation/PRE-3/planification/lancer-source-vnext.cjs',output]);
  run(process.execPath,['--max-old-space-size=7168','docs/preparation/PRE-3/planification/construire-contrats-vnext.cjs',output,path.join(output,'launch.json')]);
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
