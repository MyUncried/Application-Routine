'use strict';

// Disposable functional protocol test.
// Run from the repository root with: node tests/ui.test.js
// Node built-ins only: no installed dependency, no package.json, no test
// framework globals (describe/it/expect). Exit status 0 means success; any
// assertion failure exits non-zero.
//
// Scope: the documentary Boolean transitions of Screen.toggle() and the
// preserved Existing re-export. No render(), HTML, browser, geometry,
// screenshot or visual comparison is performed here. Visual acceptance of the
// frozen Figma references belongs exclusively to the user and is not certified
// by this run.

const path = require('path');
const {spawnSync} = require('child_process');
const assert = require('assert').strict;

const SCREEN_PATH = path.join(__dirname, '..', 'src', 'features', 'example', 'Screen.js');
const SHARED_PATH = path.join(__dirname, '..', 'src', 'shared', 'ui', 'Existing.js');
const MARKER = 'KODJO_OBS ';

// Each probe runs as inline subprocess source (node -e). No helper file is
// created, and no probe writes to test or implementation source.

// Probe 1: one fresh child process, Screen required once, toggle() called
// twice on that same module instance. The child only reports the raw observed
// return values; the parent process below asserts them.
const TOGGLE_PROBE_SOURCE = `
'use strict';
const screenPath = process.argv[1];
const observation = {};
try {
  const screen = require(screenPath);
  observation.toggleType = typeof screen.toggle;
  const firstCall = screen.toggle();
  const secondCall = screen.toggle();
  observation.firstCall = firstCall;
  observation.secondCall = secondCall;
  observation.firstCallType = typeof firstCall;
  observation.secondCallType = typeof secondCall;
} catch (error) {
  observation.error = String(error && error.stack ? error.stack : error);
}
process.stdout.write('KODJO_OBS ' + JSON.stringify(observation) + '\\n');
`;

// Probe 2: a separate fresh child process for the shared-export preservation
// checks. Reference identity cannot cross a process boundary, so the identity
// comparisons are evaluated in the child and reported as raw observations; the
// parent decides the verdict from them.
const PRESERVATION_PROBE_SOURCE = `
'use strict';
const screenPath = require.resolve(process.argv[1]);
const sharedPath = require.resolve(process.argv[2]);
const observation = {};

// Establish the baseline cache entries that must be restored at the end.
require(sharedPath);
require(screenPath);
const originalScreenEntry = require.cache[screenPath];
const originalSharedEntry = require.cache[sharedPath];

let sentinel = null;
let sharedExport = null;

try {
  // Normal load: clear BOTH cache entries, then require shared and Screen.
  delete require.cache[screenPath];
  delete require.cache[sharedPath];
  const shared = require(sharedPath);
  const screen = require(screenPath);
  observation.normalExistingIdentity = screen.Existing === shared.Existing;
  observation.normalExistingType = typeof shared.Existing;
  observation.screenToggleType = typeof screen.toggle;

  // Capture the shared export object and its original Existing value BEFORE
  // any substitution.
  sharedExport = shared;
  const originalExisting = shared.Existing;
  sentinel = Object.freeze({
    kodjoSentinel: 'SENTINEL-' + process.pid + '-' + Date.now() + '-' + Math.random()
  });

  try {
    // Clear ONLY Screen, substitute the sentinel, re-require Screen.
    delete require.cache[screenPath];
    sharedExport.Existing = sentinel;
    const reloadedScreen = require(screenPath);
    observation.sentinelIdentity = reloadedScreen.Existing === sentinel;
  } finally {
    // Restore the exact original Existing value, pass or fail.
    sharedExport.Existing = originalExisting;
  }

  observation.restoredExistingIsOriginal = sharedExport.Existing === originalExisting;
  observation.sentinelRemainsInSharedExport =
    Object.keys(sharedExport).some(function (key) { return sharedExport[key] === sentinel; });
} catch (error) {
  observation.error = String(error && error.stack ? error.stack : error);
} finally {
  // Restore the original cache entries, pass or fail.
  if (originalScreenEntry) {
    require.cache[screenPath] = originalScreenEntry;
  } else {
    delete require.cache[screenPath];
  }
  if (originalSharedEntry) {
    require.cache[sharedPath] = originalSharedEntry;
  } else {
    delete require.cache[sharedPath];
  }
}

observation.screenCacheEntryRestored = require.cache[screenPath] === originalScreenEntry;
observation.sharedCacheEntryRestored = require.cache[sharedPath] === originalSharedEntry;
process.stdout.write('KODJO_OBS ' + JSON.stringify(observation) + '\\n');
`;

function runProbe(label, source, args) {
  const result = spawnSync(process.execPath, ['-e', source].concat(args), {
    encoding: 'utf8'
  });

  if (result.error) {
    throw new Error(label + ': could not spawn child process: ' + result.error.message);
  }
  if (result.status !== 0) {
    throw new Error(
      label + ': child process exited with status ' + result.status +
      '\nstdout: ' + result.stdout + '\nstderr: ' + result.stderr
    );
  }

  const line = String(result.stdout)
    .split(/\r?\n/)
    .filter(function (candidate) { return candidate.indexOf(MARKER) === 0; })
    .pop();

  if (!line) {
    throw new Error(
      label + ': no observation emitted by the child process' +
      '\nstdout: ' + result.stdout + '\nstderr: ' + result.stderr
    );
  }

  const observation = JSON.parse(line.slice(MARKER.length));
  if (observation.error) {
    throw new Error(label + ': child process reported an error: ' + observation.error);
  }
  return observation;
}

const results = [];

function check(label, assertion) {
  try {
    assertion();
    results.push({label: label, status: 'PASS'});
  } catch (error) {
    results.push({label: label, status: 'FAIL', detail: error.message});
  }
}

// --- Probe 1: isolated toggle transitions -----------------------------------

let toggleObservation = null;
check('toggle probe runs in a fresh child Node process', function () {
  toggleObservation = runProbe('toggle probe', TOGGLE_PROBE_SOURCE, [SCREEN_PATH]);
});

check('Screen exports toggle as a function', function () {
  assert.ok(toggleObservation, 'toggle probe produced no observation');
  assert.equal(toggleObservation.toggleType, 'function');
});

check('toggle-off-on: first call on the same module instance returns true', function () {
  assert.ok(toggleObservation, 'toggle probe produced no observation');
  assert.equal(toggleObservation.firstCallType, 'boolean');
  assert.equal(toggleObservation.firstCall, true);
});

check('toggle-on-off: second call on the same module instance returns false', function () {
  assert.ok(toggleObservation, 'toggle probe produced no observation');
  assert.equal(toggleObservation.secondCallType, 'boolean');
  assert.equal(toggleObservation.secondCall, false);
});

// --- Probe 2: shared Existing export preservation ---------------------------

let preservationObservation = null;
check('preservation probe runs in a separate fresh child Node process', function () {
  preservationObservation = runProbe(
    'preservation probe',
    PRESERVATION_PROBE_SOURCE,
    [SCREEN_PATH, SHARED_PATH]
  );
});

check('normal load: Screen.Existing is identical to the shared export value', function () {
  assert.ok(preservationObservation, 'preservation probe produced no observation');
  assert.equal(preservationObservation.normalExistingIdentity, true);
});

check('normal load: Screen still exports toggle alongside Existing', function () {
  assert.ok(preservationObservation, 'preservation probe produced no observation');
  assert.equal(preservationObservation.screenToggleType, 'function');
});

check('substituted load: Screen.Existing is the sentinel by reference identity', function () {
  assert.ok(preservationObservation, 'preservation probe produced no observation');
  assert.equal(preservationObservation.sentinelIdentity, true);
});

check('the exact original shared Existing value is restored', function () {
  assert.ok(preservationObservation, 'preservation probe produced no observation');
  assert.equal(preservationObservation.restoredExistingIsOriginal, true);
});

check('no sentinel remains in the shared export after the probe', function () {
  assert.ok(preservationObservation, 'preservation probe produced no observation');
  assert.equal(preservationObservation.sentinelRemainsInSharedExport, false);
});

check('the original require cache entries are restored', function () {
  assert.ok(preservationObservation, 'preservation probe produced no observation');
  assert.equal(preservationObservation.screenCacheEntryRestored, true);
  assert.equal(preservationObservation.sharedCacheEntryRestored, true);
});

// --- Report -----------------------------------------------------------------

results.forEach(function (result) {
  const detail = result.detail ? ' — ' + result.detail.split('\n')[0] : '';
  process.stdout.write(result.status + ' ' + result.label + detail + '\n');
});

const failures = results.filter(function (result) { return result.status === 'FAIL'; });

process.stdout.write(
  '\n' + (results.length - failures.length) + '/' + results.length + ' checks passed\n'
);

if (failures.length > 0) {
  process.exit(1);
}
