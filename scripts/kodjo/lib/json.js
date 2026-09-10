'use strict';

const fs = require('node:fs');
const path = require('node:path');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/** Deterministic write: 2-space indent, LF endings, trailing newline. */
function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const text = `${JSON.stringify(value, null, 2).replace(/\r\n/g, '\n')}\n`;
  fs.writeFileSync(filePath, text, 'utf8');
  return text;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return readJson(filePath);
  } catch {
    return null;
  }
}

module.exports = { readJson, writeJson, readJsonIfExists };
