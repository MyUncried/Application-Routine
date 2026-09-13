#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { extractTaggedJson, scanDirectImporters } = require('./lib/plan-impact');

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
try {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'extract-modules') {
    const [planFile, outputFile] = args;
    if (!planFile || !outputFile) throw new Error('USAGE: extract-modules <draft.md> <output.json>');
    const modules = extractTaggedJson(fs.readFileSync(planFile, 'utf8'), 'KODJO_MODIFIED_MODULES_JSON');
    writeJson(outputFile, modules);
  } else if (command === 'scan') {
    const [revision, modulesFile, outputFile] = args;
    if (!revision || !modulesFile || !outputFile) throw new Error('USAGE: scan <revision> <modules.json> <output.json>');
    writeJson(outputFile, scanDirectImporters({ cwd: process.cwd(), revision, modifiedModules: readJson(modulesFile) }));
  } else {
    throw new Error('USAGE: scan-plan-impact.js extract-modules|scan ...');
  }
} catch (error) {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n');
  process.exit(1);
}
