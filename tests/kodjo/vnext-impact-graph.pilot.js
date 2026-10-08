'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const SourceManifest = require(path.join(root, 'scripts', 'kodjo', 'lib', 'source-manifest'));
const RequirementRegistry = require(path.join(root, 'scripts', 'kodjo', 'lib', 'requirement-registry'));
const Impact = require(path.join(root, 'scripts', 'kodjo', 'lib', 'impact-graph'));

const H64A = 'a'.repeat(64);
const H64B = 'b'.repeat(64);
const H64C = 'c'.repeat(64);

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true }).trim();
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function fixtureRepo() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-vnext-impact-'));
  git(cwd, 'init');
  git(cwd, 'config', 'user.name', 'KODJO Test');
  git(cwd, 'config', 'user.email', 'kodjo@example.test');

  write(path.join(cwd, 'src', 'a.js'), "module.exports = { value: 1 };\n");
  write(path.join(cwd, 'src', 'b.js'), "const a = require('./a'); module.exports = a;\n");
  write(path.join(cwd, 'src', 'c.js'), "const b = require('./b'); module.exports = b;\n");
  write(path.join(cwd, 'src', 'écran.js'), "module.exports = 'écran';\n");
  write(path.join(cwd, 'tests', 'a.test.js'), "const a = require('../src/a'); if (!a) throw new Error('x');\n");
  write(path.join(cwd, 'docs', 'readme.md'), "# Fixture\n");

  git(cwd, 'add', '.');
  git(cwd, 'commit', '-m', 'fixture');
  const revision = git(cwd, 'rev-parse', 'HEAD');
  return { cwd, revision };
}

function registry() {
  const manifest = SourceManifest.build({
    slice_id: 'V2-VNEXT-03',
    product_head: 'f'.repeat(40),
    sources: [{
      source_kind: 'MARKDOWN',
      authority: 'FUNCTIONAL',
      locator: 'docs/spec.md',
      revision: 'f'.repeat(40),
      fingerprint: H64A,
      units: [{
        locator: '§1',
        fingerprint: H64B,
        disposition: 'REQUIREMENT_SOURCE',
      }],
    }],
  });
  const source = manifest.sources[0];
  const unit = source.units[0];
  return RequirementRegistry.build({
    planning_envelope_hash: H64C,
    source_manifest: manifest,
    requirements: [{
      source_id: source.source_id,
      unit_id: unit.unit_id,
      kind: 'FUNCTIONAL',
      statement: 'Modifier le comportement A.',
      priority: 'MUST',
      status: 'ACTIVE',
      rationale: 'Exigence de fixture.',
      related_unit_ids: [],
      conflict_unit_ids: [],
    }],
  });
}

function byPath(manifest, file) {
  const hit = manifest.candidates.find((candidate) => candidate.path === file);
  assert.ok(hit, 'candidate absent: ' + file);
  return hit;
}

function row(reqId, candidateId, changeKind, reason, extra = {}) {
  return {
    requirement_id: reqId,
    candidate_id: candidateId,
    change_kind: changeKind,
    impact_reason: reason,
    dependency_evidence: extra.dependency_evidence || (changeKind === 'NO_CHANGE' ? [] : ['fixture evidence']),
    tests_affected_candidate_ids: extra.tests_affected_candidate_ids || [],
    preservation_candidate_ids: extra.preservation_candidate_ids || [],
  };
}

test('VNext-03 inventorie mécaniquement les chemins Git et les slots CREATE', () => {
  const { cwd, revision } = fixtureRepo();
  const manifest = Impact.buildCandidateManifest({
    cwd,
    revision,
    createSlots: [{
      path: 'src/new-feature.js',
      policy_id: 'CANONICAL_SOURCE_CREATE',
      policy_hash: H64A,
    }],
  });

  assert.equal(Impact.validateCandidateManifest(manifest), true);
  assert.equal(Impact.verifyCandidateManifestAtHead(manifest, { cwd }), true);
  assert.equal(byPath(manifest, 'src/a.js').origin, 'GIT_TREE');
  assert.equal(byPath(manifest, 'src/new-feature.js').origin, 'CREATE_SLOT_POLICY');
  assert.equal(byPath(manifest, 'src/écran.js').path, 'src/écran.js');
  assert.deepEqual(byPath(manifest, 'src/new-feature.js').allowed_change_kinds, ['CREATE', 'NO_CHANGE']);
});

test('VNext-03 refuse CREATE sur un fichier existant et hors racine autorisée', () => {
  const { cwd, revision } = fixtureRepo();
  assert.throws(() => Impact.buildCandidateManifest({
    cwd,
    revision,
    createSlots: [{ path: 'src/a.js', policy_id: 'P', policy_hash: H64A }],
  }), /VNEXT_CREATE_SLOT_ALREADY_EXISTS/);

  assert.throws(() => Impact.buildCandidateManifest({
    cwd,
    revision,
    createSlots: [{ path: 'private/new.js', policy_id: 'P', policy_hash: H64A }],
  }), /VNEXT_CREATE_SLOT_ROOT_FORBIDDEN/);
});

test('VNext-03 scanne uniquement les importeurs directs, sans fermeture transitive', () => {
  const { cwd, revision } = fixtureRepo();
  const manifest = Impact.buildCandidateManifest({ cwd, revision });
  const a = byPath(manifest, 'src/a.js');
  const scan = Impact.scanOneLevelDirectImporters({
    cwd,
    candidateManifest: manifest,
    modifyCandidateIds: [a.candidate_id],
  });

  assert.equal(Impact.validateDirectImportScan(scan, manifest), true);
  const paths = scan.importers.map((item) => item.path);
  assert.deepEqual(paths, ['src/b.js', 'tests/a.test.js']);
  assert.equal(paths.includes('src/c.js'), false);
});

test('VNext-03 construit ImpactGraph avec classification par candidate_id, jamais par path libre', () => {
  const { cwd, revision } = fixtureRepo();
  const manifest = Impact.buildCandidateManifest({ cwd, revision });
  const req = registry();
  const reqId = req.requirements[0].requirement_id;
  const a = byPath(manifest, 'src/a.js');
  const b = byPath(manifest, 'src/b.js');
  const t = byPath(manifest, 'tests/a.test.js');

  const scan = Impact.scanOneLevelDirectImporters({
    cwd,
    candidateManifest: manifest,
    modifyCandidateIds: [a.candidate_id],
  });

  const graph = Impact.buildImpactGraph({
    requirementRegistry: req,
    candidateManifest: manifest,
    directImportScan: scan,
    classifications: [
      row(reqId, a.candidate_id, 'MODIFY', 'Le module porte le comportement.'),
      row(reqId, b.candidate_id, 'NO_CHANGE', 'Consommateur direct compatible sans changement.'),
      row(reqId, t.candidate_id, 'MODIFY', 'Le test direct doit suivre le nouveau comportement.'),
    ],
  });

  assert.equal(graph.schema_version, Impact.IMPACT_SCHEMA);
  assert.equal(graph.impact_count, 3);
  assert.equal(graph.impacts.find((item) => item.path === 'src/a.js').change_kind, 'MODIFY');
  assert.equal(graph.impacts.find((item) => item.path === 'src/b.js').direct_import_trigger_ids[0], a.candidate_id);
  assert.equal(Impact.validateImpactGraph(graph, {
    requirementRegistry: req,
    candidateManifest: manifest,
    directImportScan: scan,
  }), true);
});

test('VNext-03 refuse un importeur direct non classé', () => {
  const { cwd, revision } = fixtureRepo();
  const manifest = Impact.buildCandidateManifest({ cwd, revision });
  const req = registry();
  const reqId = req.requirements[0].requirement_id;
  const a = byPath(manifest, 'src/a.js');
  const t = byPath(manifest, 'tests/a.test.js');
  const scan = Impact.scanOneLevelDirectImporters({
    cwd,
    candidateManifest: manifest,
    modifyCandidateIds: [a.candidate_id],
  });

  assert.throws(() => Impact.buildImpactGraph({
    requirementRegistry: req,
    candidateManifest: manifest,
    directImportScan: scan,
    classifications: [
      row(reqId, a.candidate_id, 'MODIFY', 'Root.'),
      row(reqId, t.candidate_id, 'MODIFY', 'Test.'),
    ],
  }), /VNEXT_DIRECT_IMPORT_CLASSIFICATION_MISSING/);
});

test('VNext-03 refuse un candidate_id inventé', () => {
  const { cwd, revision } = fixtureRepo();
  const manifest = Impact.buildCandidateManifest({ cwd, revision });
  const req = registry();
  const reqId = req.requirements[0].requirement_id;

  assert.throws(() => Impact.buildImpactGraph({
    requirementRegistry: req,
    candidateManifest: manifest,
    classifications: [
      row(reqId, 'CAND-ffffffffffffffffffffffff', 'MODIFY', 'Inventé.'),
    ],
  }), /VNEXT_IMPACT_CANDIDATE_UNKNOWN/);
});

test('VNext-03 autorise CREATE uniquement via un slot machine validé', () => {
  const { cwd, revision } = fixtureRepo();
  const manifest = Impact.buildCandidateManifest({
    cwd,
    revision,
    createSlots: [{
      path: 'src/new-feature.js',
      policy_id: 'CANONICAL_SOURCE_CREATE',
      policy_hash: H64A,
    }],
  });
  const req = registry();
  const reqId = req.requirements[0].requirement_id;
  const slot = byPath(manifest, 'src/new-feature.js');
  const existing = byPath(manifest, 'src/a.js');

  const graph = Impact.buildImpactGraph({
    requirementRegistry: req,
    candidateManifest: manifest,
    classifications: [row(reqId, slot.candidate_id, 'CREATE', 'Nouveau module requis.')],
  });
  assert.equal(graph.impacts[0].change_kind, 'CREATE');

  assert.throws(() => Impact.buildImpactGraph({
    requirementRegistry: req,
    candidateManifest: manifest,
    classifications: [row(reqId, existing.candidate_id, 'CREATE', 'CREATE illégal.')],
  }), /VNEXT_IMPACT_CHANGE_KIND_NOT_ALLOWED/);
});

test('VNext-03 autorise DELETE uniquement sur un fichier existant', () => {
  const { cwd, revision } = fixtureRepo();
  const manifest = Impact.buildCandidateManifest({
    cwd,
    revision,
    createSlots: [{
      path: 'src/new-feature.js',
      policy_id: 'CANONICAL_SOURCE_CREATE',
      policy_hash: H64A,
    }],
  });
  const req = registry();
  const reqId = req.requirements[0].requirement_id;
  const existing = byPath(manifest, 'docs/readme.md');
  const slot = byPath(manifest, 'src/new-feature.js');

  const graph = Impact.buildImpactGraph({
    requirementRegistry: req,
    candidateManifest: manifest,
    classifications: [row(reqId, existing.candidate_id, 'DELETE', 'Le document doit disparaître.')],
  });
  assert.equal(graph.impacts[0].change_kind, 'DELETE');

  assert.throws(() => Impact.buildImpactGraph({
    requirementRegistry: req,
    candidateManifest: manifest,
    classifications: [row(reqId, slot.candidate_id, 'DELETE', 'DELETE illégal.')],
  }), /VNEXT_IMPACT_CHANGE_KIND_NOT_ALLOWED/);
});

test('VNext-03 accepte NO_CHANGE au niveau exigence avec justification', () => {
  const { cwd, revision } = fixtureRepo();
  const manifest = Impact.buildCandidateManifest({ cwd, revision });
  const req = registry();
  const reqId = req.requirements[0].requirement_id;

  const graph = Impact.buildImpactGraph({
    requirementRegistry: req,
    candidateManifest: manifest,
    classifications: [
      row(reqId, null, 'NO_CHANGE', 'Le comportement est déjà satisfait au HEAD analysé.'),
    ],
  });
  assert.equal(graph.impacts[0].path, null);
  assert.equal(graph.impacts[0].candidate_origin, 'REQUIREMENT_LEVEL');
});

test('VNext-03 refuse une exigence sans impact ni NO_CHANGE', () => {
  const { cwd, revision } = fixtureRepo();
  const manifest = Impact.buildCandidateManifest({ cwd, revision });
  const req = registry();

  assert.throws(() => Impact.buildImpactGraph({
    requirementRegistry: req,
    candidateManifest: manifest,
    classifications: [],
  }), /VNEXT_IMPACT_REQUIREMENT_UNCOVERED/);
});

test('VNext-03 lie le scan direct au même CandidateManifest et au même target set', () => {
  const { cwd, revision } = fixtureRepo();
  const manifest = Impact.buildCandidateManifest({ cwd, revision });
  const req = registry();
  const reqId = req.requirements[0].requirement_id;
  const a = byPath(manifest, 'src/a.js');
  const b = byPath(manifest, 'src/b.js');
  const t = byPath(manifest, 'tests/a.test.js');
  const scan = Impact.scanOneLevelDirectImporters({
    cwd,
    candidateManifest: manifest,
    modifyCandidateIds: [a.candidate_id],
  });
  const tampered = structuredClone(scan);
  tampered.target_candidate_ids = [b.candidate_id];

  assert.throws(() => Impact.buildImpactGraph({
    requirementRegistry: req,
    candidateManifest: manifest,
    directImportScan: tampered,
    classifications: [
      row(reqId, a.candidate_id, 'MODIFY', 'Root.'),
      row(reqId, b.candidate_id, 'NO_CHANGE', 'Direct.'),
      row(reqId, t.candidate_id, 'NO_CHANGE', 'Test direct inchangé.'),
    ],
  }), /VNEXT_DIRECT_IMPORT_SCAN_HASH_MISMATCH|VNEXT_DIRECT_IMPORT_TARGET_SET_MISMATCH/);
});

test('VNext-03 refuse un RequirementRegistry bloqué avant analyse d’impact', () => {
  const { cwd, revision } = fixtureRepo();
  const manifest = Impact.buildCandidateManifest({ cwd, revision });
  const blocked = structuredClone(registry());
  blocked.registry_status = 'BLOCKED';
  blocked.blocking_reasons = ['CLARIFICATION_REQUIRED'];

  assert.throws(() => Impact.buildImpactGraph({
    requirementRegistry: blocked,
    candidateManifest: manifest,
    classifications: [],
  }), /CLARIFICATION_REQUIRED/);
});
