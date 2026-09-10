'use strict';

/**
 * Confinement of test-only adapters.
 *
 * KODJO V2 §1.2-A: no remote path may execute a free-form command, because such
 * a command escapes the guarded git runner of lib/git.js. A fake adapter is
 * therefore addressed by IDENTIFIER (`test:<name>`), resolved to a script that
 * lives inside a single directory of this repository, enabled only by an
 * explicit flag that the workflow never sets, and launched with `shell: false`.
 *
 * NOTE — known follow-up: scripts/kodjo/run-implementation-agent.js still
 * carries its own copy of this resolution logic. Unifying it onto this module
 * is deliberately left out of the current security correction, whose scope was
 * limited to the publication step.
 */

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const TEST_ADAPTER_ROOT = path.join('tests', 'kodjo', 'adapters');
const TEST_PREFIX = 'test:';

function adapterError(code, message) {
  const err = new Error(code + ': ' + message);
  err.code = code;
  return err;
}

/**
 * Resolve a `test:<name>` identifier to an in-repo script path.
 *
 * @param {string} id     candidate identifier
 * @param {object} env    process environment
 * @param {string} purpose human-readable purpose, used in diagnostics
 * @returns {{id:string, script:string, test:true}}
 * @throws  when the identifier is not a confined test adapter
 */
function resolveTestAdapter(id, env, purpose) {
  const key = String(id || '').trim();
  const label = purpose || 'adapter';

  if (!key.startsWith(TEST_PREFIX)) {
    throw adapterError(
      'ADAPTER_COMMAND_NOT_ALLOWED',
      'the ' +
        label +
        ' value is not a confined test adapter identifier. A free-form command is never executed; ' +
        'use "' +
        TEST_PREFIX +
        '<name>" naming a script under ' +
        TEST_ADAPTER_ROOT.replace(/\\/g, '/') +
        '.'
    );
  }
  if ((env || {}).KODJO_ALLOW_TEST_ADAPTER !== '1') {
    throw adapterError(
      'TEST_ADAPTER_NOT_ENABLED',
      'the ' + label + ' "' + key + '" requires KODJO_ALLOW_TEST_ADAPTER=1 and is reserved for local tests. ' +
        'The workflow never sets that flag.'
    );
  }

  const name = key.slice(TEST_PREFIX.length);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw adapterError('TEST_ADAPTER_NAME_INVALID', '"' + name + '" is not a valid test adapter name.');
  }

  const root = path.join(REPO_ROOT, TEST_ADAPTER_ROOT);
  const script = path.resolve(root, name + '.js');
  if (script !== path.join(root, name + '.js') || !script.startsWith(root + path.sep)) {
    throw adapterError('TEST_ADAPTER_PATH_ESCAPE', key + ' resolves outside ' + TEST_ADAPTER_ROOT);
  }
  if (!fs.existsSync(script)) {
    throw adapterError('TEST_ADAPTER_NOT_FOUND', path.relative(REPO_ROOT, script).replace(/\\/g, '/'));
  }
  return { id: key, script: script, test: true };
}

module.exports = { REPO_ROOT, TEST_ADAPTER_ROOT, TEST_PREFIX, resolveTestAdapter };
