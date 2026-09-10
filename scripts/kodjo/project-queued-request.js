#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { projectQueueRequest } = require('./lib/queue-request');

function main(argv) {
  if (argv.length !== 2) throw new Error('USAGE: project-queued-request.js <queue.json> <request.json>');
  const queueFile = path.resolve(argv[0]);
  const requestFile = path.resolve(argv[1]);
  const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
  const request = projectQueueRequest(queue);
  fs.writeFileSync(requestFile, JSON.stringify(request, null, 2) + '\n', 'utf8');
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(String(error && error.message ? error.message : error) + '\n');
    process.exit(1);
  }
}

module.exports = { main };
