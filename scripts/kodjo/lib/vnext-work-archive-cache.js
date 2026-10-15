'use strict';
const crypto=require('node:crypto'),V=require('./vnext-contract');
const ROOT='.github/orchestration/requests/vnext-work/consumption/archive-cache/';
function pathFor(digest){V.assertSha64(digest);return ROOT+digest+'.json';}
function encode(artifact,bytes){
 if(!Buffer.isBuffer(bytes)||!Number.isSafeInteger(artifact.artifact_id)||artifact.artifact_id<1)throw Error('WORK_CACHE_INPUT');
 V.assertSha64(artifact.artifact_sha256);
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==artifact.artifact_sha256)throw Error('WORK_CACHE_DIGEST');
 return {schema_version:'kodjo.vnext.work-archive-cache.v1',artifact_id:artifact.artifact_id,artifact_sha256:artifact.artifact_sha256,zip_bytes:bytes.length,encoding:'base64',zip_base64_chunks:bytes.toString('base64').match(/.{1,6000}/g)||[]};
}
function decode(value,artifact){
 V.assertExactKeys(value,['schema_version','artifact_id','artifact_sha256','zip_bytes','encoding','zip_base64_chunks'],[],'WORK_CACHE_KEYS');
 if(value.schema_version!=='kodjo.vnext.work-archive-cache.v1'||value.encoding!=='base64'||value.artifact_id!==artifact.artifact_id||value.artifact_sha256!==artifact.artifact_sha256||!Array.isArray(value.zip_base64_chunks)||value.zip_base64_chunks.some(x=>typeof x!=='string')||!Number.isSafeInteger(value.zip_bytes)||value.zip_bytes<0)throw Error('WORK_CACHE_BINDING');
 const text=value.zip_base64_chunks.join('');if(!/^[A-Za-z0-9+/]*={0,2}$/.test(text))throw Error('WORK_CACHE_ENCODING');
 const bytes=Buffer.from(text,'base64');if(bytes.toString('base64')!==text||bytes.length!==value.zip_bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==artifact.artifact_sha256)throw Error('WORK_CACHE_DIGEST');
 return bytes;
}
module.exports={ROOT,pathFor,encode,decode};
