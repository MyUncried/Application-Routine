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

function impact({ scope, modules, rows }) {
  return {schema:'kodjo.plan-impact.v1',scan_revision:head,scan_sha256:'x',modified_modules:modules,rows,scope_allow:scope};
}
function plan({ scope, modules, rows, prose, contract }) {
  let out = `${prose}\n\n<KODJO_PLAN_IMPACT_JSON>\n${JSON.stringify(impact({scope,modules,rows}),null,2)}\n</KODJO_PLAN_IMPACT_JSON>\n`;
  if (contract) out += `\n<KODJO_PLAN_CONTRACT_JSON>\n${JSON.stringify(contract,null,2)}\n</KODJO_PLAN_CONTRACT_JSON>\n`;
  return out;
}
function run(markdown, mode='produce') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-plan-contract-'));
  const input = path.join(dir, 'plan.md');
  const output = path.join(dir, 'contract.json');
  fs.writeFileSync(input, markdown, 'utf8');
  const result = spawnSync(process.execPath, [verifier, input, head, root, output, mode, head], { cwd: root, encoding: 'utf8' });
  return { ...result, output };
}

function validFixture() {
  const testPath='src/example/__tests__/BrandNewContract.test.ts';
  const scope=['src/a.ts',testPath];
  const modules=[{path:'src/a.ts',change:'MODIFY'},{path:testPath,change:'CREATE'}];
  const rows=[
    {path:'src/a.ts',candidate_kind:'MODIFIED_MODULE',triggered_by:[],risk_score:0,classification:'MODIFY',justification:'x'},
    {path:testPath,candidate_kind:'MODIFIED_MODULE',triggered_by:[],risk_score:0,classification:'MODIFY',justification:'x'},
  ];
  const prose=`## Proposition de \`scope_allow\`\n\`src/a.ts\`\n\`${testPath}\`\n\n## Tests requis\n- créer \`${testPath}\`\n`;
  return {testPath,scope,modules,rows,prose};
}

function rootTestsFixture() {
  const scope = ['tests/kodjo-prod-qualif/e2e-sum.ts', 'tests/kodjo-prod-qualif/e2e-sum.test.ts'].sort();
  const modules = scope.map(path => ({ path, change: 'CREATE' }));
  const rows = scope.map(path => ({ path, classification: 'MODIFY' }));
  const prose = `## scope_allow\n${scope.join('\n')}\n\n## Tests\n${scope.map(p => `- \`${p}\``).join('\n')}\n`;
  return { scope, modules, rows, prose };
}

test('IA-008: prose cannot smuggle assets, JSON or Markdown outside the machine scope',()=>{
 for(const extra of ['assets/icons/extra.svg','src/config/extra.json','tests/extra.md','docs/extra.md','scripts/extra.js','.github/extra.json']){
  const f=validFixture();f.prose=f.prose.replace('## Proposition de `scope_allow`','## Proposition de `scope_allow`\n`'+extra+'`');
  const r=run(plan(f));assert.notEqual(r.status,0);assert.match(r.stderr,/PLAN_SCOPE_CONTRADICTION/);
 }
});

test('root tests paths survive plan production and independent consumption', () => {
  const fixture = rootTestsFixture();
  const produced = run(plan(fixture));
  assert.equal(produced.status, 0, produced.stderr);
  const contract = JSON.parse(fs.readFileSync(produced.output, 'utf8'));
  assert.deepEqual(contract.required_test_writes, fixture.scope);
  const consumed = run(plan({ ...fixture, contract }), 'consume');
  assert.equal(consumed.status, 0, consumed.stderr);
});

test('root tests paths cannot add an undeclared test in prose', () => {
  const fixture = rootTestsFixture();
  fixture.prose += '- `tests/kodjo-prod-qualif/undeclared.test.ts`\n';
  const result = run(plan(fixture));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /nouveau test exige sans CREATE autorise/);
});

test('root tests write scope still rejects contradictory prose', () => {
  const fixture = rootTestsFixture();
  fixture.prose = fixture.prose.replace('## scope_allow\n', '## scope_allow\ntests/extra.ts\n');
  const result = run(plan(fixture));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scope_allow prose != scope_allow machine/);
});

test('root tests write scope still requires explicit Tests paths', () => {
  const fixture = rootTestsFixture();
  fixture.prose = fixture.prose.split('## Tests')[0];
  const result = run(plan(fixture));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /test en écriture absent de la section Tests/);
});

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

test('contrat: les tests en écriture sont explicités et un contrat v2 versionné est produit', () => {
  const fixture=validFixture();
  const result = run(plan(fixture));
  assert.equal(result.status, 0, result.stderr);
  const contract=JSON.parse(fs.readFileSync(result.output,'utf8'));
  assert.equal(contract.schema,'kodjo.plan-contract-consistency.v2');
  assert.equal(contract.contract_version,2);
  assert.equal(contract.protocol_commit,head);
  assert.deepEqual(contract.write_scope,fixture.scope.sort());
  assert.deepEqual(contract.required_test_writes,[fixture.testPath]);
});

test('consommation: un plan hérité sans contrat versionné est rejeté comme protocolairement périmé', () => {
  const fixture=validFixture();
  const result=run(plan(fixture),'consume');
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/PLAN_PROTOCOL_STALE/);
});

test('consommation: un contrat v1 hérité est rejeté comme protocolairement périmé', () => {
  const fixture=validFixture();
  const legacy={schema:'kodjo.plan-contract-consistency.v1',scan_revision:head,write_scope:fixture.scope,required_test_writes:[fixture.testPath]};
  const result=run(plan({...fixture,contract:legacy}),'consume');
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/PLAN_PROTOCOL_STALE/);
});

test('consommation: le contrat embarqué v2 doit être identique au contrat recalculé', () => {
  const fixture=validFixture();
  const contract={schema:'kodjo.plan-contract-consistency.v2',contract_version:2,protocol_commit:head,scan_revision:head,write_scope:['src/a.ts'],required_test_writes:[fixture.testPath]};
  const result=run(plan({...fixture,contract}),'consume');
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/PLAN_CONTRACT_DRIFT/);
});

test('consommation: un contrat v2 cohérent est accepté après rejeu déterministe', () => {
  const fixture=validFixture();
  const produced=run(plan(fixture));
  assert.equal(produced.status,0,produced.stderr);
  const contract=JSON.parse(fs.readFileSync(produced.output,'utf8'));
  const consumed=run(plan({...fixture,contract}),'consume');
  assert.equal(consumed.status,0,consumed.stderr);
});
