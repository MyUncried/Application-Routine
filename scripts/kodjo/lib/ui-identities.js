 'use strict';
const {sha256}=require('./plan-impact');
function criterionIdentity(source){return 'UI-'+sha256({path:String(source?.path||'').trim(),locator:String(source?.locator||'').trim(),requirement:String(source?.requirement||'').trim()}).slice(0,12).toUpperCase();}
function assertionIdentity(criterionId,assertion){return criterionId+'-A'+sha256({source:{path:String(assertion.source?.path||'').trim(),locator:String(assertion.source?.locator||'').trim()},property_type:String(assertion.property_type||'').trim(),expected:String(assertion.expected||'').trim(),proof_required:[...(assertion.proof_required||[])].map(x=>String(x).trim()).sort()}).slice(0,12).toUpperCase();}
module.exports={criterionIdentity,assertionIdentity};
