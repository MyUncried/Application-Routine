#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { verifyImplementationMission } = require('./lib/implementation-contract');

try {
  const [missionFile, planFile, expectedPlanBlob] = process.argv.slice(2);
  if (!missionFile || !planFile || !expectedPlanBlob) {
    throw new Error('USAGE: verify-implementation-mission.js <mission.md> <technical-plan.md> <plan_blob_oid>');
  }
  const mission = fs.readFileSync(path.resolve(missionFile), 'utf8');
  const plan = fs.readFileSync(path.resolve(planFile), 'utf8');
  const contract = verifyImplementationMission(mission, plan, expectedPlanBlob);
  process.stdout.write('[KODJO_V2] implementation mission verified — criteria=' +
    contract.ui_criterion_count + ' ui=' + contract.ui_applicable + '\n');
} catch (error) {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n');
  process.exit(1);
}
