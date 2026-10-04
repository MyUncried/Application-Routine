#!/usr/bin/env node
'use strict';
// Republication, sans nouvel appel à Claude, d'une revue de plan V2 déjà produite dont seule la publication a échoué
// (kodjo-v2-slice-plan-review.yml, étape « Publish independent V2 plan review »). Bornée aux révisions publiées par le
// propriétaire (pinned_publication) : le corps est reconstruit depuis les preuves conservées du run, liées au plan publié
// par ses octets, à la tête de protocole du run et à la session Claude ; une revue déjà publiée pour ce plan est refusée.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { inspect } = require('./lib/review-findings');
const { recover, isPlanPublication } = require('./recover-published-plan');

const WORKFLOW = '.github/workflows/kodjo-v2-slice-plan-review.yml';
const SHA40 = /^[0-9a-f]{40}$/;
const ID = /^[1-9][0-9]*$/;
const need = (ok, code) => { if (!ok) throw new Error(code); };
const field = (body, name) => { const m = new RegExp('^' + name + '=([^\\r\\n]+)\\s*$', 'm').exec(String(body || '')); return m ? m[1].trim() : ''; };

// Preuves écrites par Windows PowerShell : UTF-16LE (Out-File) ou UTF-8 avec ou sans BOM.
function readText(file) {
  const b = fs.readFileSync(file);
  if (b[0] === 0xff && b[1] === 0xfe) return b.subarray(2).toString('utf16le');
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) return b.subarray(3).toString('utf8');
  return b.toString('utf8');
}

function build({ run, jobs, evidenceDir, planComment, recoveredPlan, issueComments, issueNumber, planId }) {
  need(ID.test(String(planId)) && ID.test(String(issueNumber)), 'REPUBLISH_INPUT_INVALID');
  need(run && run.path === WORKFLOW && run.head_branch === 'main' && run.event === 'workflow_dispatch' &&
    run.status === 'completed' && run.conclusion === 'failure' && SHA40.test(run.head_sha), 'REPUBLISH_RUN_INVALID');
  const steps = (jobs || []).flatMap((j) => j.steps || []);
  const step = (name) => steps.filter((s) => s.name === name);
  need(step('Review V2 plan with Claude').length === 1 && step('Review V2 plan with Claude')[0].conclusion === 'success', 'REPUBLISH_REVIEW_NOT_PRODUCED');
  need(step('Publish independent V2 plan review').length === 1 && step('Publish independent V2 plan review')[0].conclusion === 'failure', 'REPUBLISH_PUBLICATION_NOT_FAILED');

  // Plan relu par le run = publication du propriétaire, octet pour octet.
  need(isPlanPublication(planComment) && planComment.issue_url && planComment.issue_url.endsWith('/issues/' + issueNumber), 'REPUBLISH_PLAN_NOT_PINNED_PUBLICATION');
  const plan = readText(path.join(evidenceDir, 'kodjo-v2-plan.md'));
  need(plan === recoveredPlan, 'REPUBLISH_PLAN_EVIDENCE_MISMATCH');
  const slice = field(plan, 'slice_id'), bootstrap = field(plan, 'bootstrap_path'), sourceHead = field(plan, 'source_head');
  const applicationPr = field(plan, 'application_pr'), applicationHead = field(plan, 'application_head');
  need(slice && bootstrap && SHA40.test(sourceHead) && ID.test(applicationPr) && SHA40.test(applicationHead), 'REPUBLISH_PLAN_IDENTITY_INVALID');

  // Transition prouvée par le run, à la tête de protocole exacte du run.
  const transitionText = readText(path.join(evidenceDir, 'kodjo-v2-plan-review-transition.json'));
  const transition = JSON.parse(transitionText);
  need(transition.status === 'PASS' && transition.source_head === sourceHead && transition.protocol_execution_head === run.head_sha &&
    transition.bootstrap_path === bootstrap, 'REPUBLISH_TRANSITION_MISMATCH');

  // Sortie Claude du run et constats normalisés par le même module que l'étape de revue.
  const claude = JSON.parse(readText(path.join(evidenceDir, 'kodjo-v2-plan-review.json')));
  const review = readText(path.join(evidenceDir, 'kodjo-v2-plan-review.md'));
  need(claude && /^[0-9a-f-]{36}$/.test(String(claude.session_id)) && String(claude.result) === review, 'REPUBLISH_REVIEW_EVIDENCE_MISMATCH');
  const findings = inspect(review);
  need(['APPROVE', 'REVISE'].includes(findings.verdict), 'REPUBLISH_VERDICT_INVALID');

  // Une seule revue publiée par plan.
  const prior = (issueComments || []).filter((c) => /^\[KODJO_V2\] PLAN_REVIEW_OUTPUT\s*$/m.test(String(c.body || '').split('\n')[0]) &&
    field(c.body, 'source_plan_comment_id') === String(planId));
  need(prior.length === 0, 'REPUBLISH_REVIEW_ALREADY_PUBLISHED');

  const proof = readText(path.join(evidenceDir, 'kodjo-v2-plan-review-proof.json'));
  const contract = readText(path.join(evidenceDir, 'kodjo-v2-plan-review-contract.json'));
  const uiContract = readText(path.join(evidenceDir, 'kodjo-v2-plan-review-ui-contract.json'));
  const status = findings.verdict === 'APPROVE' ? 'PLAN_REVIEW_APPROVED' : 'PLAN_REVISION_REQUIRED';
  const block = (tag, text) => '\n<' + tag + '>\n' + text.trim() + '\n</' + tag + '>\n';
  // Même composition que l'étape « Publish independent V2 plan review » ; republished_from_run_id trace l'origine.
  const body = ['[KODJO_V2] PLAN_REVIEW_OUTPUT', 'slice_id=' + slice, 'bootstrap_path=' + bootstrap, 'source_head=' + sourceHead,
    'protocol_execution_head=' + run.head_sha, 'application_pr=' + applicationPr, 'application_head=' + applicationHead,
    'source_plan_comment_id=' + planId, 'reviewer=CLAUDE', 'review_session_id=' + claude.session_id, 'verdict=' + findings.verdict,
    'republished_from_run_id=' + run.id, 'STATUT : ' + status, '', ''].join('\n') + review +
    block('KODJO_PLAN_IMPACT_REVIEW_JSON', proof) + block('KODJO_PLAN_CONTRACT_REVIEW_JSON', contract) +
    block('KODJO_UI_PLAN_CONTRACT_REVIEW_JSON', uiContract) + block('KODJO_PLAN_REVIEW_TRANSITION_JSON', transitionText) +
    block('KODJO_PLAN_REVIEW_FINDINGS_JSON', JSON.stringify(findings, null, 2));
  need(body.length < 65000, 'REPUBLISH_BODY_TOO_LARGE');
  return { body, verdict: findings.verdict, slice, sessionId: claude.session_id };
}

function gh(route) {
  const r = spawnSync('gh', ['api', route], { encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  need(!r.error && r.status === 0, 'REPUBLISH_API_FAILED:' + route.split('?')[0]);
  return JSON.parse(r.stdout);
}
function ghPaginate(route) {
  const r = spawnSync('gh', ['api', '--paginate', '--slurp', route], { encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  need(!r.error && r.status === 0, 'REPUBLISH_API_FAILED:' + route.split('?')[0]);
  return JSON.parse(r.stdout).flat();
}

if (require.main === module) {
  try {
    const [runId, issueNumber, planId, evidenceDir, outFile] = process.argv.slice(2);
    need(ID.test(String(runId)) && outFile, 'USAGE: republish-plan-review.js <run_id> <issue_number> <plan_comment_id> <evidence_dir> <payload.json>');
    const repo = process.env.GITHUB_REPOSITORY;
    need(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(String(repo || '')), 'REPUBLISH_REPOSITORY_INVALID');
    const base = 'repos/' + repo + '/';
    const run = gh(base + 'actions/runs/' + runId);
    const jobs = gh(base + 'actions/runs/' + runId + '/jobs?per_page=100').jobs;
    const planComment = gh(base + 'issues/comments/' + planId);
    const recoveredPlan = recover(planComment, repo);
    const issueComments = ghPaginate(base + 'issues/' + issueNumber + '/comments?per_page=100');
    const out = build({ run, jobs, evidenceDir, planComment, recoveredPlan, issueComments, issueNumber, planId });
    fs.writeFileSync(outFile, JSON.stringify({ body: out.body }), 'utf8');
    process.stdout.write('verdict=' + out.verdict + '\nslice_id=' + out.slice + '\nreview_session_id=' + out.sessionId + '\n');
  } catch (e) { process.stderr.write(String(e.message || e) + '\n'); process.exit(1); }
}

module.exports = { build, readText };
