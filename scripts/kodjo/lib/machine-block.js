'use strict';
function parse(body, tag, {required = true, code = 'MACHINE_BLOCK_INVALID'} = {}) {
  if (!/^[A-Z0-9_]+$/.test(tag)) throw Error(code);
  const text = String(body || '').replace(/\r\n?/g, '\n');
  const opens = text.split('<' + tag + '>').length - 1;
  const closes = text.split('</' + tag + '>').length - 1;
  const hits = [...text.matchAll(new RegExp('<'+tag+'>\\s*([\\s\\S]*?)\\s*</'+tag+'>','g'))];
  if (!opens && !closes && !required) return null;
  if (!hits.length || hits.length !== opens || opens !== closes) throw Error(code);
  const canonical = require('./vnext-contract').canonicalStringify;
  let values; try {values = hits.map(hit => JSON.parse(hit[1]));} catch {throw Error(code);}
  if (values.some(value => value === null || typeof value !== 'object')) throw Error(code);
  if (values.some(value => canonical(value) !== canonical(values[0]))) throw Error(code + ':CONFLICTING_BLOCKS');
  return values[0];
}
module.exports = {parse};
