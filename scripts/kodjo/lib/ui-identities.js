 'use strict';
const {sha256}=require('./plan-impact');
function criterionIdentity(source){return 'UI-'+sha256({path:String(source?.path||''),locator:String(source?.locator||''),requirement:String(source?.requirement||'')}).slice(0,12).toUpperCase();}
function assertionIdentity(criterionId,assertion){return criterionId+'-A'+sha256({source:assertion.source,property_type:assertion.property_type,expected:assertion.expected,proof_required:[...(assertion.proof_required||[])].sort()}).slice(0,12).toUpperCase();}
module.exports={criterionIdentity,assertionIdentity};
