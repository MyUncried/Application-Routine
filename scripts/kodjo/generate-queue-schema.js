#!/usr/bin/env node
'use strict';

/**
 * Projection JSON Schema du contrat de file — KV2-23.
 *
 * Le contrat executable de `lib/queue-contract.js` est la source unique. Ce
 * fichier n'en est qu'une projection publiable : un test regenere et compare, de
 * sorte que les deux ne peuvent pas diverger sans faire echouer la suite.
 *
 * Usage : node scripts/kodjo/generate-queue-schema.js [--write]
 */

const fs = require('node:fs');
const path = require('node:path');
const { PROPERTIES, LEAN_REQUEST_SCHEMA } = require('./lib/queue-contract');

const TARGET = path.join('.github', 'orchestration', 'lean-request.schema.json');

function build() {
  const properties = {};
  const required = [];
  for (const [name, spec] of Object.entries(PROPERTIES)) {
    properties[name] = { type: spec.type, 'x-kodjo-nature': spec.nature, 'x-kodjo-diagnostic': spec.diagnostic };
    if (spec.required === 'always') required.push(name);
    else if (spec.required === 'resume_only') properties[name]['x-kodjo-required-when'] = 'mode=RESUME_DELTA';
  }
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: LEAN_REQUEST_SCHEMA,
    title: 'KODJO V2 — demande de file lean',
    description:
      'Projection du contrat executable scripts/kodjo/lib/queue-contract.js. ' +
      'Ne pas editer a la main : regenerer avec generate-queue-schema.js --write.',
    type: 'object',
    additionalProperties: false,
    required: required.sort(),
    properties,
  };
}

function serialize() { return JSON.stringify(build(), null, 2) + '\n'; }

if (require.main === module) {
  const text = serialize();
  if (process.argv.includes('--write')) {
    fs.mkdirSync(path.dirname(TARGET), { recursive: true });
    fs.writeFileSync(TARGET, text, 'utf8');
    process.stdout.write('ecrit ' + TARGET + '\n');
  } else {
    process.stdout.write(text);
  }
}

module.exports = { build, serialize, TARGET };
