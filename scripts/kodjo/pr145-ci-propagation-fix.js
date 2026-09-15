'use strict';

const fs = require('node:fs');

function replaceOnce(file, before, after) {
  const source = fs.readFileSync(file, 'utf8');
  const first = source.indexOf(before);
  if (first < 0) throw new Error('PATCH_SOURCE_NOT_FOUND: ' + file);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error('PATCH_SOURCE_NOT_UNIQUE: ' + file);
  const next = source.slice(0, first) + after + source.slice(first + before.length);
  fs.writeFileSync(file, next, 'utf8');
}

replaceOnce(
  'tests/kodjo/protocol-0.6.22.pilot.js',
  "  assert.match(workflow, /Le checkout peut échouer avant que l'utilitaire soit copié/);",
  "  assert.match(workflow, /RUN_CHECKOUT_IDENTITY_MISMATCH/);"
);

replaceOnce(
  'tests/kodjo/queue-contract.pilot.js',
  "  const source = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'verify-authorizations.js'), 'utf8');\n  const jamais = C.propertiesOfNature('AUTHORIZATION').filter((name) => !source.includes(name));",
  "  const source = [\n    fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'verify-authorizations.js'), 'utf8'),\n    fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'verify-queue-admission.js'), 'utf8'),\n    fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'lib', 'visual-checkpoint.js'), 'utf8'),\n  ].join('\\n');\n  const jamais = C.propertiesOfNature('AUTHORIZATION').filter((name) => !source.includes(name));"
);

replaceOnce(
  'tests/kodjo/queue-contract.pilot.js',
  "  const result = A.verify(tempRequest, { cwd: root, github });\n  assert.equal(result.plan_blob_oid, planBlob);",
  "  const activationRegistry = JSON.parse(fs.readFileSync(\n    path.join(root, '.github', 'orchestration', 'v2-activation-registry.json'), 'utf8'));\n  const activation = (activationRegistry.activations || []).find((a) => a && a.slice_id === prospective.slice_id);\n  if (activation && activation.status !== 'ACTIVE') {\n    assert.throws(() => A.verify(tempRequest, { cwd: root, github }), /SLICE_NOT_ACTIVE/);\n    return;\n  }\n  const result = A.verify(tempRequest, { cwd: root, github });\n  assert.equal(result.plan_blob_oid, planBlob);"
);

for (const file of [
  '.github/workflows/kodjo-pr145-ci-propagation-fix.yml',
  'scripts/kodjo/pr145-ci-propagation-fix.js',
  '.github/orchestration/pr145-ci-propagation-trigger.txt',
]) {
  if (fs.existsSync(file)) fs.unlinkSync(file);
}
