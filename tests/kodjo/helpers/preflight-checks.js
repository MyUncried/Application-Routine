'use strict';
// Synthetic proof rows for isolated consumer tests, not actual production evidence.
function checks(queue={operation_kind:'IMPLEMENT'}) {
  const kind=queue.operation_kind||'IMPLEMENT';
  const na=new Set(queue.recovery_migration===undefined?['PF-007']:[]);
  const conditional = kind==='VISUAL_CORRECTION'
    ? ['PF-009','PF-010']
    : ['PF-008', ...(queue.delivery_target ? [] : ['PF-015'])];
  for(const id of conditional) na.add(id);
  return Array.from({length:22},(_,i)=>{
    const id='PF-'+String(i+1).padStart(3,'0');
    return {id,status:na.has(id)?'NOT_APPLICABLE':'PASS',source:'synthetic-consumer-fixture',evidence:'mocked',diagnostic:null};
  });
}
module.exports={checks};
