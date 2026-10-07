#!/usr/bin/env node
'use strict';
const Routing = require('./lib/slice-protocol-routing');
try {
  const sliceId = process.argv[2];
  const protocol = Routing.resolve(sliceId);
  if (process.argv[3] === '--require-legacy') Routing.assertLegacy(sliceId);
  process.stdout.write(protocol + '\n');
} catch (error) { process.stderr.write(error.message + '\n'); process.exitCode = 78; }
