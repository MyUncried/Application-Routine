#!/usr/bin/env node
'use strict';

/**
 * Test-only publication adapter simulating an unavailable comment API.
 *
 * Reachable only through the confined identifier `test:failing-publisher` with
 * KODJO_ALLOW_TEST_ADAPTER=1, and launched with `shell: false`.
 */

process.stderr.write('HTTP 503: comment API unavailable\n');
process.exit(1);
