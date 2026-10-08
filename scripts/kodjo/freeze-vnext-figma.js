#!/usr/bin/env node
'use strict';
// Run once at slice launch, before any technical plan. No Figma network fallback.
const fs=require('node:fs'),F=require('./lib/vnext-figma-source');
function nodesFromBatches(inventories,batches){
  const metadata=new Map(),properties=new Map();
  for(const inventory of inventories){
    if(inventory.end!==true||inventory.count!==inventory.rows.length)throw Error('VNEXT_FIGMA_INVENTORY_TRUNCATED');
    for(const row of inventory.rows){if(metadata.has(row[0]))throw Error('VNEXT_FIGMA_INVENTORY_DUPLICATE');metadata.set(row[0],row);}
  }
  for(const batch of batches){
    if(batch.end!==true||JSON.stringify(batch.requested_ids)!==JSON.stringify(batch.rows.map(r=>r.id)))throw Error('VNEXT_FIGMA_PROPERTY_BATCH_TRUNCATED');
    for(const row of batch.rows){if(properties.has(row.id)||!metadata.has(row.id))throw Error('VNEXT_FIGMA_PROPERTY_BATCH_DUPLICATE');properties.set(row.id,row);}
  }
  if(properties.size!==metadata.size)throw Error('VNEXT_FIGMA_PROPERTY_BATCH_OMITTED');
  return [...metadata.values()].map(row=>({id:row[0],parent_id:row[1],type:row[2],name:row[3],child_ids:properties.get(row[0]).child_ids,properties:properties.get(row[0]).properties}));
}
function freeze(input){
  const {inventories,batches,...rest}=input;
  if(rest.nodes)throw Error('VNEXT_FIGMA_DUAL_INVENTORY_FORBIDDEN');
  return F.build({...rest,nodes:nodesFromBatches(inventories,batches)});
}
if(require.main===module){
  try{const [input,output,flag]=process.argv.slice(2);if(!input||!output)throw Error('USAGE: freeze-vnext-figma <capture-and-decisions.json> <snapshot.json> [--require-ready]');
    if(flag&&flag!=='--require-ready')throw Error('VNEXT_FIGMA_FREEZE_FLAG_INVALID');const packet=freeze(JSON.parse(fs.readFileSync(input,'utf8')));
    if(flag)F.validate(packet,{ready:true});fs.writeFileSync(output,JSON.stringify(packet,null,2)+'\n');
  }catch(e){process.stderr.write(e.message+'\n');process.exitCode=1;}
}
module.exports={freeze,nodesFromBatches};
