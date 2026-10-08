'use strict';
// Preparation of the complete existing extraction. No network, application,
// approval, review, or protocol qualification is invoked by this command.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../../../..');
const V=require(path.join(root,'scripts/kodjo/lib/vnext-contract'));
const F=require(path.join(root,'scripts/kodjo/lib/vnext-figma-source'));
const Launch=require(path.join(root,'scripts/kodjo/lib/vnext-figma-launch'));
const base=path.join(root,'docs/preparation/PRE-3/figma');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const output=process.argv[2];if(!output||!path.isAbsolute(output))throw Error('Absolute output directory required');
fs.mkdirSync(output,{recursive:true});
const manifest=read(path.join(base,'manifest.json')),layout=read(path.join(base,'complements-layout.json'));
const records=fs.readFileSync(path.join(base,'index-elements.jsonl'),'utf8').split('\n').filter(Boolean).map(JSON.parse);
const nodes=new Map(),cache=new Map(),owner=new Map(),visible=new Map();
const meta=new Set(['id','type','name','parent','children','master','topology','variants','setId']);
const props=n=>Object.fromEntries(Object.entries(n).filter(([k])=>!meta.has(k)));
function put(n,extra={}){
 const old=nodes.get(n.id);nodes.set(n.id,{id:n.id,parent_id:n.parent??old?.parent_id??null,type:n.type,name:n.name,child_ids:n.children??old?.child_ids??[],properties:{...old?.properties,...props(n),...extra}});
}
for(const r of records){
 const file=r.properties.split('#')[0];if(!cache.has(file))cache.set(file,read(path.join(base,file)).nodes);
 const n=cache.get(file)[Number(r.properties.slice(r.properties.lastIndexOf('/')+1))];
 const extra={...layout.schemas[r.layoutSchema]};if(r.master)extra.main_component_id=r.master;
 put(n,extra);owner.set(n.id,r.frame);visible.set(n.id,r.visibleSelonArbre);
}
const masters=read(path.join(base,'masters.json'));
for(const m of masters.masters){for(const n of m.topology)put(n);put(m);}
for(const s of masters.sets){put({...s,children:s.variants.map(v=>v.id)});for(const v of s.variants)put(v);}
for(const b of read(path.join(__dirname,'complement-variantes-vnext.json')).batches)for(const n of b.rows)put(n,n.properties);
for(const b of read(path.join(__dirname,'complement-maitres-vnext.json')).batches)for(const n of b.rows){const old=nodes.get(n.id);if(!old)throw Error('Missing master '+n.id);Object.assign(old.properties,Object.fromEntries(Object.entries(n).filter(([k])=>!['id','type'].includes(k))));}
// Variant complement properties belong to the node, not a nested property.
for(const n of nodes.values())delete n.properties.properties;
// Complete reachable closure only; metadata outside this closure is already
// retained by the original extraction and is not a delivered UI surface.
const reached=new Set();function walk(id){if(reached.has(id))return;const n=nodes.get(id);if(!n)throw Error('Missing node '+id);reached.add(id);for(const c of n.child_ids)walk(c);if(n.type==='INSTANCE'){const m=nodes.get(n.properties.main_component_id);if(!m)throw Error('Missing main component '+id);const s=nodes.get(m.parent_id);walk(s?.type==='COMPONENT_SET'?s.id:m.id);}}
for(const f of manifest.frames)walk(f.id);
const captured=[...nodes.values()].filter(n=>reached.has(n.id));
const docPath='docs/Specifications-fonctionnelles/13 – Contrats d’écran.md';
const docRevision=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const docContent=cp.execFileSync('git',['show',docRevision+':'+docPath],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});
const document={document_id:'PRE3-CONTRATS-ECRAN',path:docPath,locator:'FULL_FILE',revision:docRevision,fingerprint:V.sha256(docContent),content:docContent};
// This command requires the inventory to be committed before final launch.
const inventory=read(path.join(__dirname,'inventaire-etats-scenarios.json'));
if(!docContent.includes('<KODJO_SCREEN_STATES_JSON>'))throw Error('Commit the authoritative documentary inventory before constructing the packet.');
const states=inventory.states.map(s=>({...s,document_ids:[document.document_id]}));
const visualFields=new Set(['visible','opacity','x','y','width','height','rotation','constraints','layoutMode','layoutWrap','layoutSizingHorizontal','layoutSizingVertical','layoutPositioning','layoutAlign','layoutGrow','primaryAxisSizingMode','counterAxisSizingMode','primaryAxisAlignItems','counterAxisAlignItems','paddingLeft','paddingRight','paddingTop','paddingBottom','itemSpacing','counterAxisSpacing','clipsContent','overflowDirection','fills','strokes','strokeWeight','strokeAlign','strokeCap','strokeJoin','dashPattern','cornerRadius','topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius','effects','blendMode','characters','fontName','fontSize','fontWeight','textAutoResize','textAlignHorizontal','textAlignVertical','lineHeight','letterSpacing','paragraphSpacing','paragraphIndent','textCase','textDecoration','maxLines','textTruncation','textSegments','vectorPaths','minWidth','minHeight','maxWidth','maxHeight','strokeTopWeight','strokeBottomWeight','strokeLeftWeight','strokeRightWeight','cornerSmoothing']);
function system(n){let p=n;const seen=new Set();while(p&&!seen.has(p.id)){seen.add(p.id);if(/status.?bar|barre d’état|home.?indicator|indicateur.*accueil/i.test(p.name))return true;if(p.id===owner.get(n.id))break;p=nodes.get(p.parent_id);}return false;}
const decisions=[];
for(const n of captured)for(const [property,value]of Object.entries(n.properties)){
 const isFrame=manifest.frames.some(f=>f.id===n.id),isSystem=system(n),inScreen=owner.has(n.id);
 const realize=inScreen&&visible.get(n.id)&&!isSystem&&visualFields.has(property)&&value!==null&&value!=='MIXED'&&!(typeof value==='string'&&!value.trim())&&!(isFrame&&['x','y'].includes(property));
 const reason=realize?'Présentation observée dans cet état contrôlé ; comportement et valeurs sauvegardées régis par le contrat documentaire.':!inScreen?'Contexte de fermeture maître/variantes ; les instances livrées sont comparées dans les écrans.':isSystem?'Contexte système natif, conservé dans la référence ; aucun contrôle applicatif ne le reproduit.':!visible.get(n.id)?'Descendant masqué inclus dans la preuve, sans contrôle visible requis dans cet état.':'Métadonnée, absence de valeur ou agrégat Figma ; les propriétés concrètes et scénarios documentaires portent les assertions.';
 const frame=manifest.frames.find(f=>f.id===owner.get(n.id));
 decisions.push({property_id:V.stableId('FIGPROP',[n.id,property]),element_id:n.id,property,disposition:realize?'REALIZE':'OBSERVED_ONLY',reason,document_ids:[document.document_id],rule:realize?{kind:'EQUALS',value,viewports:[frame.width],tolerance:0,unit:'figma-source'}:null});
}
const resources=manifest.frames.map(f=>{const bytes=fs.readFileSync(path.join(base,f.capture));const imageNodes=captured.filter(n=>owner.get(n.id)===f.id&&(n.properties.fills||[]).some(p=>p.type==='IMAGE')).map(n=>n.id);return {resource_id:'PRE3-PNG-'+f.id.replace(':','-'),node_ids:[f.id,...imageNodes.filter(id=>id!==f.id)],path:'docs/preparation/PRE-3/figma/'+f.capture,media_type:'image/png',sha256:V.sha256('unused'),byte_length:bytes.length,base64:bytes.toString('base64')};});
for(const r of resources)r.sha256=require('node:crypto').createHash('sha256').update(Buffer.from(r.base64,'base64')).digest('hex');
const tokens=read(path.join(base,'tokens.json'));
const input={file_key:manifest.fileKey,captured_at:manifest.extractedAtUtc,frames:manifest.frames.map(f=>({frame_id:f.id,page_id:manifest.pageId,state_id:'PRE3-FIG-'+f.id.replace(':','-')})),nodes:captured,variables:tokens.variables.map(v=>({...v,collection_id:v.variableCollectionId})),collections:tokens.collections,resources,documents:[document],states,decisions,conflicts:[]};
const packet=F.build(input);F.validate(packet,{ready:true});
const packed=process.argv.includes('--packed');
const bytes=F.snapshotContent(packet,{packed}),packetPath=path.join(output,'figma-source.json');fs.writeFileSync(packetPath,bytes);
const receipt={scope:'REAL_PRE3_SOURCE_PREPARATION_ONLY',applicationConformance:false,independentReview:false,source_revision:docRevision,node_count:captured.length,screen_nodes:records.length,property_count:decisions.length,realize_count:decisions.filter(d=>d.disposition==='REALIZE').length,frame_count:manifest.frames.length,byte_length:Buffer.byteLength(bytes),sha256:V.sha256(bytes),contract_hash:packet.contract_hash,packet_schema_validation:'PASS',inventory_document_validation:'NOT_YET_RUN',image_reference_semantics:'Full frame PNG evidences IMAGE-painted nodes within that frame; it is not the original image asset or a distributable product demo.'};
receipt.storage_format=packed?'kodjo.vnext.figma-transport.v1':'kodjo.vnext.figma-source.v1';
if(packed){const reconstructed=F.snapshotPacket(bytes);receipt.reconstruction_hash_equal=reconstructed.contract_hash===packet.contract_hash;if(!receipt.reconstruction_hash_equal)throw Error('Source reconstruction mismatch');}
try{Launch.validateDocumentCoverage(packet);receipt.inventory_document_validation='PASS';}catch(e){receipt.inventory_document_validation=e.code||e.message;}
fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');process.stdout.write(JSON.stringify(receipt)+'\n');
if(process.argv.includes('--prove-read')){
 const blob=cp.execFileSync('git',['hash-object','-w',packetPath],{cwd:root,encoding:'utf8'}).trim();
 const tree=cp.execFileSync('git',['mktree'],{cwd:root,encoding:'utf8',input:`100644 blob ${blob}\tfigma-source.json\n`}).trim();
 const commit=cp.execFileSync('git',['-c','user.name=PRE3 source preparation','-c','user.email=pre3-source@example.invalid','commit-tree',tree],{cwd:root,encoding:'utf8',input:'Local actual PRE-3 source read evidence; no branch, no certification, no application change.\n'}).trim();
 let error=null;try{require(path.join(root,'scripts/kodjo/lib/vnext-live-chain')).readGit(root,commit,'figma-source.json');}catch(e){error={code:e.code,message:e.message};}
 const evidence={...receipt,git_blob:blob,local_evidence_tree:tree,local_evidence_commit:commit,operation:'vnext-live-chain.readGit(cwd, local_evidence_commit, figma-source.json)',production_limit_bytes:64*1024*1024,result:error?'BLOCKED':'PASS',error,git_observation_and_launch_completed:false,notes:['The documentary source is read from its exact committed Git revision. Schema/inventory validation is distinct from the failing production Git byte observation.','The local evidence commit is an unreferenced container for actual source bytes, not a workflow, branch, certification or remote operation.','No PlanContract or independent review is declared complete.']};
 fs.writeFileSync(path.join(output,'read-evidence.json'),JSON.stringify(evidence,null,2)+'\n');process.stdout.write(JSON.stringify({readResult:evidence.result,error})+'\n');
}
