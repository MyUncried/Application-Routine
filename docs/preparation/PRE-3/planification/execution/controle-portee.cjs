'use strict';
// Product delivery check only. Does not issue a VNext admission or alter VNext.
const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto');
const P='docs/preparation/PRE-3/planification/',PLAN='43e7b344937a2d60b04b987f19636faebb5aee06';
const MANIFEST='16c155548ba161778f8780e664c65561b7c0d7e27666ca34481ec33a75cc08ff';
function git(args){return cp.execFileSync('git',args,{encoding:'utf8',maxBuffer:16*1024*1024});}
function assert(ok,message){if(!ok)throw Error(message);}
function inspect({start,committed,staged,working,untracked,scope}){
 assert(/^[0-9a-f]{40}$/.test(start),'Exact start SHA required');
 const paths=[...new Set([...committed,...staged,...working,...untracked])].sort();
 const allowed=new Set(scope);
 const documentary=p=>/^docs\/preparation\/PRE-3\/planification\/execution\/preuves\/[A-Za-z0-9_./-]+$/.test(p)||/^\.github\/orchestration\/reports\/\d{4}-\d{2}-\d{2}_PRE3-340_[A-Za-z0-9_-]+\.(md|json)$/.test(p);
 const rejected=paths.filter(p=>!allowed.has(p)&&!documentary(p));
 assert(rejected.length===0,'OUTSIDE_APPROVED_SCOPE: '+rejected.join(', '));
 return paths;
}
function main(){
 const index=process.argv.indexOf('--start'),start=process.argv[index+1];
 assert(index>=0&&/^[0-9a-f]{40}$/.test(start||''),'Usage: node controle-portee.cjs --start <published-start-sha>');
 git(['merge-base','--is-ancestor',start,'HEAD']);
 const expected=git(['show',start+':'+P+'execution/controle-portee.cjs']);
 assert(fs.readFileSync(__filename,'utf8')===expected,'Scope checker modified');
 const context=JSON.parse(git(['show',start+':'+P+'execution/contexte.json']));
 assert(context.plan_revision===PLAN&&context.application_main==='46b91bd279424899a02c099a68b2729f6d710809'&&context.owner_plan_approval===true,'Start context differs');
 const raw=git(['show',PLAN+':'+P+'passe2/manifest.json']);
 assert(crypto.createHash('sha256').update(raw).digest('hex')===MANIFEST,'Approved manifest differs');
 const plan=JSON.parse(git(['show',PLAN+':'+P+'passe2/tests-and-preservation.json']));
 const zero=s=>s.split('\0').filter(Boolean);
 const paths=inspect({start,scope:plan.write_scope.map(x=>x.path),
 committed:zero(git(['diff','--name-only','-z',start,'HEAD'])),
 staged:zero(git(['diff','--name-only','-z','--cached'])),
 working:zero(git(['diff','--name-only','-z'])),
 untracked:zero(git(['ls-files','--others','--exclude-standard','-z']))});
 // Existing migrations are never editable even if later listed by mistake.
 assert(!paths.some(p=>/\/migrations\/00[1-8]_/.test(p)),'Historical migration modified');
 const result={check:'PRE3_PRODUCT_WRITE_SCOPE',result:'PASS',start,head:git(['rev-parse','HEAD']).trim(),approved_plan:PLAN,paths,application_tested:false,vnext_admission:false};
 process.stdout.write(JSON.stringify(result)+'\n');
}
if(require.main===module)try{main();}catch(e){process.stderr.write(e.message+'\n');process.exitCode=1;}
module.exports={inspect};
