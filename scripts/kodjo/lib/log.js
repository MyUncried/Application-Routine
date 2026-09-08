'use strict';

const PREFIX = '[KODJO_V2_PILOT]';

function info(msg) {
  process.stdout.write(`${PREFIX} ${msg}\n`);
}

function fail(code, msg) {
  process.stderr.write(`${PREFIX} ${code}: ${msg}\n`);
}

module.exports = { info, fail, PREFIX };
