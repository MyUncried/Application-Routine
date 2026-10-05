'use strict';
// Scoped extraction recipe, prior to a technical plan; no application change.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const F=require('../../../../../../scripts/kodjo/lib/vnext-figma-source');
const Freeze=require('../../../../../../scripts/kodjo/freeze-vnext-figma');
const V=require('../../../../../../scripts/kodjo/lib/vnext-contract');
const read=n=>JSON.parse(fs.readFileSync(path.join(__dirname,n),'utf8'));
function build(){
 const fresh=read('fresh-frame.json'),masters=read('master-closure.json'),details=read('master-details.json'),vars=read('variable-closure.json'),doc=read('documentary-current.json');
 for(const row of details.rows){const r=masters.batches.flatMap(b=>b.rows).find(r=>r.id===row.id);if(row.vectorPaths)r.properties.vectorPaths=row.vectorPaths;if(row.textSegments)r.properties.textSegments=row.textSegments;}
 const inventories=[fresh.inventory,{...masters.closure,end:true}],batches=[...fresh.batches,...masters.batches];
 const nodes=Freeze.nodesFromBatches(inventories,batches),byId=new Map(nodes.map(n=>[n.id,n]));
 const modal=new Set();function subtree(id){if(modal.has(id))return;modal.add(id);for(const c of byId.get(id).child_ids)subtree(c);}
 subtree('4953:6606');modal.add('4953:6605');
 for(const id of ['4155:6201','4151:6197','3302:4166','4152:6182','4173:6713'])subtree(id);
 const style=new Set(['opacity','fills','strokes','strokeWeight','strokeAlign','effects','topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius','fontName','fontSize','lineHeight','letterSpacing','textAlignHorizontal','textAlignVertical','textDecoration','textCase','vectorPaths']);
 const decisions=nodes.flatMap(n=>Object.entries(n.properties).map(([property,value])=>{
  let disposition='OBSERVED_ONLY',rule=null,reason='Observation de contexte ou métadonnée Figma ; aucune obligation de recopier le mécanisme interne en React Native (4.2).';
  if(modal.has(n.id)&&style.has(property)&&value!=='MIXED'&&value!==null){disposition='REALIZE';reason='Présentation du choix Zones : valeur observée du style ou du tracé, pour cette référence et cet état de démonstration.';}
  if(['width','height'].includes(property)&&(n.id==='4478:7209'||modal.has(n.id)&&!['TEXT','COMPONENT_SET'].includes(n.type)&&!n.name.includes('Tag'))){disposition='REALIZE';reason='Géométrie observée à 402 pt ; comparaison sur le jeu de démonstration, sans imposer une position absolue ni fermer la liste des zones.';}
  if(disposition==='REALIZE')rule={kind:'EQUALS',value,viewports:[402],tolerance:0.01,unit:['width','height','fontSize','strokeWeight',...['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']].includes(property)?'pt':'FIGMA_VALUE'};
  if(n.id==='4478:7209'&&property==='constraints'){
   disposition='REALIZE';reason='Adaptation obligatoire définie par 4.2 et CE-UI-09, distincte des coordonnées observées et des bounds des instances Figma.';
   rule={kind:'ADAPTIVE',value:{constraints:[{field:'requiredControlsVisible',operator:'EQ',value:true},{field:'textTruncated',operator:'EQ',value:false},{field:'listScrollable',operator:'EQ',value:true},{field:'minimumTouchWidth',operator:'MIN',value:44},{field:'minimumTouchHeight',operator:'MIN',value:44},{field:'touchOverlap',operator:'EQ',value:false}]},viewports:[360,402,440],tolerance:0,unit:'NATIVE_LAYOUT_FACTS'};
  }
  if(['characters','textSegments'].includes(property))reason='Noms et sélections de démonstration (CE-UI-09 §6), ou texte de contexte. Les règles de libellés et de contenu relèvent des sources documentaires ; aucun nom de zone ni sélection n’est figé comme règle métier.';
  if(['x','y','relativeTransform'].includes(property))reason='Coordonnées observées à un viewport : référence pour la comparaison et le rapprochement, pas positions absolues React Native (4.2). Le plan doit expliciter les relations et l’adaptation avant revue.';
  if(modal.has(n.id)&&['x','y'].includes(property)&&byId.has(n.parent_id)&&byId.get(n.parent_id).type!=='COMPONENT_SET'){
   disposition='REALIZE';reason='Relation mesurable : décalage par rapport au parent dans le rendu de référence à 402 pt ; aucun mode de positionnement React Native n’est imposé.';
   rule={kind:'RELATION',value:{constraints:[{field:'offsetFromParent',operator:'EQ',value}]},viewports:[402],tolerance:0.01,unit:'pt'};
  }
  if(modal.has(n.id)&&['itemSpacing','counterAxisSpacing','paddingLeft','paddingRight','paddingTop','paddingBottom'].includes(property)&&['HORIZONTAL','VERTICAL'].includes(n.properties.layoutMode)){
   disposition='REALIZE';reason='Espacement ou padding effectif du conteneur auto-layout dans la référence, à vérifier par mesure sans imposer la technique d’implémentation.';
   rule={kind:'EQUALS',value,viewports:[402],tolerance:0.01,unit:'pt'};
  }
  if(property==='cornerRadius'&&value==='MIXED')reason='Agrégat Figma MIXED ; les quatre rayons individuels observés sont les propriétés de référence.';
  return {property_id:F.id(n.id,property),element_id:n.id,property,disposition,reason,document_ids:['CE-UI-09','RESPONSIVE-4.2'],rule};
 }));
 const documents=[{document_id:'CE-UI-09',revision:doc.revision,path:doc.path,locator:'CE-UI-09',content:doc.contract,fingerprint:V.sha256(doc.contract)},{document_id:'RESPONSIVE-4.2',revision:doc.revision,path:doc.path,locator:'4.2',content:doc.responsive,fingerprint:V.sha256(doc.responsive)}];
 const snippets=[['toggle','Zones tap toggle'],['confirm','puis confirmer'],['cancel','fermer sans validation restaure sélection antérieure'],['scroll','Liste scrollable'],['long-name','nom long accessible'],['large-text','textes agrandis sans réduction'],['focus','focus confiné à la modale ouverte'],['zero-zones','zéro/N Zones'],['empty-list','Liste vide/initiale/enrichie'],['creation','création/nom invalide'],['retired','valeur retirée déjà affectée'],['error','confirmation/erreur'],['long-press','Appui long ouvre le dialogue Modifier/Supprimer sans sélectionner'],['stable-id','Créer/renommer conserve identité de référence'],['no-colors','Les Zones n’ont pas de palette'],['unique-name','Nom non vide et unique dans son référentiel'],['reactivation','seule une création explicite du même nom la réactive'],['min-zones','Zones≥1 pour nouvel objet'],['removed-no-new','Une valeur retirée ne peut recevoir de nouvelle affectation'],['persist','persistées à Terminer'],['error-keeps-draft','message et brouillon conservé'],['a11y','Nom/état sélectionné annoncés'],['labels','labels accessibles des actions'],['no-filter','silhouette sans effet de filtre']];
 // Every documentary-only scenario remains visible even without its own frame.
 const states=[{state_id:'zones-reference',origin:'FIGMA',disposition:'CONTEXT_ONLY',expected:null,document_ids:['CE-UI-09'],reason:'Frame 4478:7209 : jeu de démonstration initial, choix multiple. Les autres frames de création/suppression ne sont pas inventées depuis ce rendu.'},...snippets.map(([state_id,expected])=>({state_id:'zones-'+state_id,origin:'DOCUMENT_ONLY',disposition:'REQUIRED',expected,document_ids:['CE-UI-09'],reason:'Obligation documentaire à couvrir par les exigences et preuves ; le frame unique ne prouve pas cet état ou comportement.'}))];
 const resource=(resource_id,node_ids,file,media_type,bytes)=>({resource_id,node_ids,path:'figma-evidence/'+file,media_type,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),byte_length:bytes.length,base64:bytes.toString('base64')});
 const resources=[resource('zones-screenshot',['4478:7209'],'zones-reference.png','image/png',fs.readFileSync(path.join(__dirname,'frame-current.png'))),...read('actions.json').resources.map((r,i)=>resource('zones-action-'+i,[r.node_id],'action-'+i+'.svg','image/svg+xml',Buffer.from(r.content)))];
 const variables=vars.batches.flatMap(b=>b.rows),collections=[...new Map(vars.batches.flatMap(b=>b.collections).map(c=>[c.id,c])).values()];
 return Freeze.freeze({file_key:'G6RY5Ebhgwb4AHIOYDwwvg',captured_at:fresh.observed_at,frames:[{frame_id:'4478:7209',page_id:'510:101',state_id:'zones-reference'}],inventories,batches,variables,collections,resources,documents,states,decisions,conflicts:[]});
}
if(require.main===module){const packet=build();F.validate(packet,{ready:true});fs.writeFileSync(path.join(__dirname,'frozen-source.json'),JSON.stringify(packet,null,2)+'\n');console.log(JSON.stringify({reference_hash:packet.contract_hash,nodes:packet.nodes.length,properties:packet.decisions.length,required_properties:F.required(packet).length,documentary_obligations:packet.states.filter(s=>s.disposition==='REQUIRED').length,variables:packet.variables.length,resources:packet.resources.length}));}
module.exports={build};
