#!/usr/bin/env node
'use strict';

/**
 * The only implementation adapter shipped with this pilot.
 *
 * This pilot covers conservation and recovery, not remote implementation. No
 * bounded remote agent is integrated, so this adapter deliberately performs no
 * work and stops with NO_AGENT_ADAPTER_CONFIGURED. Anything already present in
 * the working tree is still preserved by the next workflow step.
 *
 * It exists as a real, in-repo, argument-driven script so that
 * run-implementation-agent.js never has to execute an arbitrary command.
 */

process.stderr.write(
  '[KODJO_V2_PILOT] NO_AGENT_ADAPTER_CONFIGURED: this pilot integrates no bounded remote ' +
    'implementation adapter. No AI call is attempted and no file is modified by the adapter. ' +
    'That a real adapter creates no commit remains NON_VERIFIABLE until such an adapter is ' +
    'integrated and bounded.\n'
);
process.exit(78);
