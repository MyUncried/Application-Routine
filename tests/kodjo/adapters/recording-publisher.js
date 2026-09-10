#!/usr/bin/env node
'use strict';

/**
 * Test-only publication adapter recording the published body.
 *
 * Reachable only through the confined identifier `test:recording-publisher`
 * with KODJO_ALLOW_TEST_ADAPTER=1, and launched with `shell: false`.
 *
 * argv[2]                     path of the body file to publish
 * KODJO_TEST_PUBLISH_RECORD   file the body is appended to
 */

const fs = require('node:fs');

const bodyFile = process.argv[2];
const record = process.env.KODJO_TEST_PUBLISH_RECORD;

if (!bodyFile || !record) {
  process.stderr.write('TEST_PUBLISHER_ARGS_MISSING\n');
  process.exit(2);
}

fs.appendFileSync(record, fs.readFileSync(bodyFile, 'utf8') + '\n---\n');
process.stdout.write('published\n');
