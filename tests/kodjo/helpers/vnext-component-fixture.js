'use strict';
const F=require('../../../scripts/kodjo/lib/vnext-figma-source');
const Fixture=require('./vnext-figma-fixture');
function fixture(t,{slice='VNEXT-REUSE-A',overrides=[],variant=false,token=24,detached=false,mapping=true,parameter=false,launch=false,masterObservedOnly=false,missingOverrideCapture=false}={}){
 const f=Fixture.fixture({launchMode:launch,transformPacket:p=>{
  const fields=structuredClone(p);delete fields.contract_hash;const nodes=fields.nodes;
  nodes.find(n=>n.id==='1:1').child_ids.push('2:2');
  const first=nodes.find(n=>n.id==='2:1');first.properties.overrides=overrides;if(missingOverrideCapture)delete first.properties.overrides;
  first.properties.boundVariables={cornerRadius:{type:'VARIABLE_ALIAS',id:'TOKEN'}};
  const second=structuredClone(first);second.id='2:2';nodes.push(second);
  if(parameter)second.properties.componentProperties={radius:{value:24,type:'TEXT'}};
  if(detached){second.type='FRAME';delete second.properties.main_component_id;}
  const master=nodes.find(n=>n.id==='3:2');master.properties.cornerRadius=24;master.properties.boundVariables=first.properties.boundVariables;
  if(variant){second.properties.main_component_id='3:3';second.properties.cornerRadius=48;const other=nodes.find(n=>n.id==='3:3');other.properties.cornerRadius=48;other.properties.boundVariables=first.properties.boundVariables;}
  fields.variables=[{id:'TOKEN',collection_id:'COL',valuesByMode:{MODE:token}}];fields.collections=[{id:'COL',modes:[{modeId:'MODE'}]}];
  fields.decisions=nodes.flatMap(n=>Object.entries(n.properties).map(([property,value])=>({property_id:F.id(n.id,property),element_id:n.id,property,disposition:masterObservedOnly&&n.type==='COMPONENT'?'OBSERVED_ONLY':['main_component_id','overrides','componentProperties','boundVariables'].includes(property)?'OBSERVED_ONLY':'REALIZE',reason:'TEST ONLY exhaustive capture',document_ids:['DOC'],rule:masterObservedOnly&&n.type==='COMPONENT'?null:['main_component_id','overrides','componentProperties','boundVariables'].includes(property)?null:{kind:'EQUALS',value,viewports:[402],tolerance:0,unit:'TEST_VALUE'}})));
  return F.build(fields);
 }});t.after(()=>f.cleanup());f.recipe.sourceManifestInput.slice_id=slice;f.recipe.planningInput.slice_id=slice;
 if(mapping){const source=f.manifest.sources.find(s=>s.source_kind==='FIGMA').source_id;
  f.recipe.uiInput.componentBindings=['2:1','2:2','3:2',...(variant?['3:3']:[])].filter(id=>!(detached&&id==='2:2')&&f.registry.requirements.some(r=>r.source.unit_locator==='ELEMENT:'+id)).map(element_id=>({source_id:source,element_id,master_id:variant&&['2:2','3:3'].includes(element_id)?'3:3':'3:2',code_path:'src/shared/ui/Existing.js',code_export:'Existing',usage_paths:['src/features/example/Screen.js'],evidence_refs:['TEST ONLY exact source import and export: src/features/example/Screen.js']}));
 }
 return f;
}
module.exports={fixture};
