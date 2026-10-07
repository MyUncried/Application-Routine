#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const Routing = require('./lib/slice-protocol-routing');
async function main(args = process.argv.slice(2), { cwd = process.cwd(), chain = require('./vnext-chain') } = {}) {
  const [sliceId, stage, configFile, output] = args;
  if (!sliceId || !['produce', 'launch'].includes(stage) || !configFile || !output) {
    throw Error('Usage: start-kodjo-slice.js <slice-id> <produce|launch> <config.json> <output.json>');
  }
  const protocol = Routing.resolve(sliceId, { cwd });
  if (protocol !== 'VNEXT') throw Error('LEGACY_SLICE_USE_EXISTING_PLANNING_ENTRYPOINT');
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  const configuredSlice = stage === 'produce' ? config.planningInput?.slice_id : config.scope?.slice_id;
  if (configuredSlice !== sliceId) throw Error('SLICE_PROTOCOL_CONFIG_IDENTITY_MISMATCH');
  return stage === 'launch' ? chain.launchMain(configFile, output) : chain.main([stage, configFile, output]);
}
if (require.main === module) main().then(result => process.stdout.write(JSON.stringify(result) + '\n'))
  .catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 78; });
module.exports = { main };
