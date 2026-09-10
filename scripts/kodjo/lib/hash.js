'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');

function sha256Bytes(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha256String(str) {
  return sha256Bytes(Buffer.from(str, 'utf8'));
}

function sha256File(filePath) {
  return sha256Bytes(fs.readFileSync(filePath));
}

/** `sha256sum` compatible line: "<hex>  <path>\n" (two spaces, binary mode uses " *"). */
function sha256SumLine(hex, name) {
  return `${hex}  ${name}\n`;
}

module.exports = { sha256Bytes, sha256String, sha256File, sha256SumLine };
