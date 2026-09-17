'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..', '..');
const verifier = path.join(root, 'scripts', 'kodjo', 'verify-plan-contract-consistency.js');
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();

function plan({ scope, modules, rows, prose }) {
  return `${prose}\n\n<KODJO_PLAN_IMPACT_JSON>\n${JSON.stringify({schema:'kodjo.plan-impact.v1',scan_revision:head,scan_sha256:'x',modified_modules:modules,rows,scope_allow:scope},null,2)}\n</KODJO_PLAN_IMPACT_JSON>\n`;
}
function run(markdown) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-plan-contract-'));
  const input = path.join(dir, 'plan.md');
  const output = path.join(dir, 'contract.json');
  fs.writeFileSync(input, markdown, 'utf8');
  const result = spawnSync(process.execPath, [verifier, input, head, root, output], { cwd: root, encoding: 'utf8' });
  return { ...result, output };
}

test('contrat: scope prose et scope machine doivent être identiques', () => {
  const result = run(plan({
    scope:['src/a.ts','src/b.ts'],
    modules:[{path:'src/a.ts',change:'MODIFY'}],
    rows:[{path:'src/a.ts',candidate_kind:'MODIFIED_MODULE',triggered_by:[],risk_score:0,classification:'MODIFY',justification:'x'},{path:'src/b.ts',candidate_kind:'CONSUMER',triggered_by:['src/a.ts'],risk_score:0,classification:'MODIFY',justification:'x'}],
    prose:'## Proposition de `scope_allow`\n```text\nsrc/a.ts\n```\n',
  }));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scope_allow prose != scope_allow machine/);
});

test('contrat: un nouveau test exigé doit être CREATE et autorisé', () => {
  const testPath='src/example/__tests__/BrandNewContract.test.ts';
  const result = run(plan({
    scope:['src/a.ts'],
    modules:[{path:'src/a.ts',change:'MODIFY'}],
    rows:[{path:'src/a.ts',candidate_kind:'MODIFIED_MODULE',triggered_by:[],risk_score:0,classification:'MODIFY',justification:'x'}],
    prose:`## Tests requis\n- créer \`${testPath}\`\n`,
  }));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /TEST_CONTRACT_CONSISTENCY/);
  assert.match(result.stderr, /nouveau test exige sans CREATE autorise/);
});

test('contrat: les tests en écriture sont explicités et le contrat canonique est produit', () => {
  const testPath='src/example/__tests__/BrandNewContract.test.ts';
  const result = run(plan({
    scope:['src/a.ts',testPath],
    modules:[{path:'src/a.ts',change:'MODIFY'},{path:testPath,change:'CREATE'}],
    rows:[{path:'src/a.ts',candidate_kind:'MODIFIED_MODULE',triggered_by:[],risk_score:0,classification:'MODIFY',justification:'x'},{path:testPath,candidate_kind:'MODIFIED_MODULE',triggered_by:[],risk_score:0,classification:'MODIFY',justification:'x'}],
    prose:`## Proposition de \`scope_allow\`\n\`src/a.ts\`\n\`${testPath}\`\n\n## Tests requis\n- créer \`${testPath}\`\n`,
  }));
  assert.equal(result.status, 0, result.stderr);
  const contract=JSON.parse(fs.readFileSync(result.output,'utf8'));
  assert.equal(contract.schema,'kodjo.plan-contract-consistency.v1');
  assert.deepEqual(contract.write_scope,['src/a.ts',testPath].sort());
  assert.deepEqual(contract.required_test_writes,[testPath]);
});
