#!/usr/bin/env node
'use strict';

/**
 * Verification des autorisations — KV2-22.
 *
 * L'audit du 2026-09-10 a demontre qu'une demande portant `authorized_plan`,
 * `independent_review` et `user_gate` a `null` produisait une PR
 * `IMPLEMENTED_AND_VERIFIED`. Ces trois champs n'etaient lus par AUCUNE ligne de
 * code : au HEAD 9d31461 ils valaient encore la chaine litterale
 * `"PLAN_APPROVED"`, c'est-a-dire rien.
 *
 * Ce que ce module etablit, et ce qu'il n'etablit pas :
 *
 *   COHERENCE TECHNIQUE DES ARTEFACTS — controlee.
 *     Le plan execute est bien le plan approuve, la revue porte bien sur ce
 *     plan, la validation porte bien sur cette version. Tout repose sur des
 *     objets Git, verifiables hors ligne.
 *
 *   INDEPENDANCE CRYPTOGRAPHIQUE DES ACTEURS — NON GARANTIE.
 *     Si toutes les ecritures GitHub utilisent la meme identite, aucun controle
 *     d'auteur ne demontre quoi que ce soit. Cette limite est assumee : le
 *     module ne pretend nulle part l'avoir levee.
 *
 *   VALIDATION METIER — garantie ORGANISATIONNELLE.
 *     L'utilisateur n'execute aucune commande. Sa validation est un pouce leve
 *     sur un commentaire determine de l'Issue, relie au hash du plan ou au HEAD
 *     exact, et enregistree par ChatGPT Protocole avant creation de la demande.
 *     `evidence_kind: ORGANISATIONAL` rend cette nature lisible dans l'artefact
 *     lui-meme, plutot que releguee a une note documentaire.
 *
 * Le controle s'execute a la selection, AVANT toute operation Git mutante,
 * toute installation et toute invocation Claude. Seules des lectures Git et,
 * optionnellement, des lectures `gh api` sont effectuees.
 *
 * Usage : node scripts/kodjo/verify-authorizations.js <queue.json>
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { extractTaggedJson, verifyPlanAtRevision } = require('./lib/plan-impact');
const { ATTESTATION_SCHEMA } = require('./lib/recovery-migration');

const SHA40 = /^[0-9a-f]{40}$/;
const COMMENT_REF = /^issue_comment:([0-9]+)$/;

function gitTry(args, cwd) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, shell: false });
  return { ok: !r.error && r.status === 0, stdout: String(r.stdout || '').trim(), stderr: String(r.stderr || '') };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function fail(code, detail) {
  const error = new Error(code + (detail ? ': ' + detail : ''));
  error.code = code;
  throw error;
}

/** Révision applicative immuable sur laquelle le plan a réellement été scanné. */
function resolveImpactApplicationHead(bootstrap, planBody) {
  const applicationHead = String(bootstrap.planning_application_head || '').toLowerCase();
  if (!SHA40.test(applicationHead)) {
    fail('PLAN_APPLICATION_HEAD_INVALID', applicationHead || '<absent>');
  }
  const impactMatrix = extractTaggedJson(planBody, 'KODJO_PLAN_IMPACT_JSON');
  if (String(impactMatrix.scan_revision || '').toLowerCase() !== applicationHead) {
    fail('PLAN_APPLICATION_HEAD_MISMATCH',
      'plan=' + String(impactMatrix.scan_revision || '<absent>') + ', bootstrap=' + applicationHead);
  }
  return applicationHead;
}

/** Résout le HEAD applicatif que l'attestation doit désigner.
 *
 * Le plan conserve toujours sa propre révision de scan immuable. Pour une
 * correction visuelle d'une PR existante, l'attestation doit en revanche
 * désigner le HEAD applicatif réellement corrigé, pas la révision historique
 * sur laquelle le plan initial a été scanné.
 */
function resolveAttestedApplicationHead(queue, planApplicationHead) {
  const operationKind = String(queue.operation_kind || 'IMPLEMENT').toUpperCase();
  if (operationKind !== 'VISUAL_CORRECTION') return planApplicationHead;

  const delivery = queue.delivery_target || {};
  const deliveryHead = String(delivery.application_head || '').toLowerCase();
  if (!SHA40.test(deliveryHead)) {
    fail('VISUAL_CORRECTION_APPLICATION_HEAD_INVALID', deliveryHead || '<absent>');
  }

  const checkpoint = queue.delivery_checkpoint || {};
  const checkpointHead = String(checkpoint.application_head || '').toLowerCase();
  if (!SHA40.test(checkpointHead) || checkpointHead !== deliveryHead) {
    fail('VISUAL_CORRECTION_CHECKPOINT_HEAD_MISMATCH',
      'delivery=' + deliveryHead + ', checkpoint=' + (checkpointHead || '<absent>'));
  }

  return deliveryHead;
}

/** La migration doit désigner le code applicatif réellement repris. */
function verifyAttestedApplicationHead(attestation, expectedApplicationHead) {
  if (String(attestation.application_pr_head || '').toLowerCase() !== expectedApplicationHead) {
    fail('RECOVERY_MIGRATION_APPLICATION_HEAD_MISMATCH',
      'attestation=' + String(attestation.application_pr_head || '<absent>') +
      ', expected=' + expectedApplicationHead);
  }
}

/**
 * Client GitHub en lecture seule.
 *
 * La verification est OBLIGATOIRE en production : le workflow pose
 * `KODJO_VERIFY_GITHUB=1`. Une reaction absente, illisible ou non verifiee
 * BLOQUE l'admission — elle n'est jamais consignee comme une simple remarque.
 * Les essais injectent un client de test ; ils n'atteignent jamais le reseau.
 */
function ghClient() {
  const call = (route) => {
    const r = spawnSync('gh', ['api', '-H', 'Accept: application/vnd.github+json', route],
      { encoding: 'utf8', windowsHide: true, shell: false, maxBuffer: 32 * 1024 * 1024 });
    if (r.error || r.status !== 0) {
      fail('GITHUB_READ_FAILED', route + ': ' + String(r.stderr || (r.error && r.error.message) || '').trim());
    }
    try { return JSON.parse(r.stdout); } catch (_) { return fail('GITHUB_READ_UNPARSABLE', route); }
  };
  return {
    comment: (repository, id) => call('repos/' + repository + '/issues/comments/' + id),
    reactions: (repository, id) => call('repos/' + repository + '/issues/comments/' + id + '/reactions'),
  };
}

/** Numero d'Issue porte par l'URL d'un commentaire. */
function issueOfComment(comment) {
  const url = String((comment && comment.issue_url) || '');
  const m = /\/issues\/([0-9]+)$/.exec(url);
  return m ? Number(m[1]) : null;
}

/** Contenu d'un blob Git, lu sans passer par l'arbre de travail. */
function blobContent(oid, cwd) {
  const r = gitTry(['cat-file', 'blob', oid], cwd);
  if (!r.ok) fail('REVIEW_BLOB_UNREADABLE', oid);
  return r.stdout;
}

/** Pouce leve de l'utilisateur declare. Toute absence bloque. */
function checkThumbsUp(github, repository, commentId, expectedLogin) {
  const reactions = github.reactions(repository, commentId);
  if (!Array.isArray(reactions)) fail('GATE_REACTION_UNREADABLE', 'commentaire ' + commentId);
  const match = reactions.find(
    (x) => x && x.content === '+1' && x.user && x.user.login === expectedLogin
  );
  if (!match) {
    const auteurs = reactions.filter((x) => x && x.content === '+1')
      .map((x) => (x.user && x.user.login) || '?').join(', ');
    fail('GATE_REACTION_ABSENT',
      'aucun pouce leve de ' + expectedLogin + (auteurs ? ' (poses par : ' + auteurs + ')' : ''));
  }
  return match;
}

function verify(queueFile, options) {
  const cwd = (options && options.cwd) || process.cwd();
  const queue = readJson(path.resolve(cwd, queueFile));

  // ---- Identite de tranche ------------------------------------------------
  const bootstrapFile = String(queue.slice_bootstrap_file || '');
  const bootstrapPath = path.resolve(cwd, bootstrapFile);
  if (!bootstrapPath.startsWith(path.resolve(cwd) + path.sep) || !fs.existsSync(bootstrapPath)) {
    fail('SLICE_BOOTSTRAP_NOT_FOUND', bootstrapFile);
  }
  const bootstrap = readJson(bootstrapPath);
  if (bootstrap.slice_id !== queue.slice_id) fail('SLICE_BOOTSTRAP_SLICE_MISMATCH');
  if (bootstrap.slice_bootstrap_sha256 !== queue.slice_bootstrap_sha256) fail('SLICE_BOOTSTRAP_HASH_MISMATCH');
  if (bootstrap.issue_number !== queue.issue_number) fail('ISSUE_NUMBER_MISMATCH');

  const registryPath = path.resolve(cwd, bootstrap.activation_registry ||
    '.github/orchestration/v2-activation-registry.json');
  if (!fs.existsSync(registryPath)) fail('ACTIVATION_REGISTRY_NOT_FOUND');
  const registry = readJson(registryPath);
  const activation = (registry.activations || []).filter((a) => a && a.slice_id === queue.slice_id);
  if (activation.length !== 1) fail(activation.length ? 'ACTIVATION_REGISTRY_DUPLICATE' : 'SLICE_NOT_ACTIVATED');
  if (activation[0].status !== 'ACTIVE') fail('SLICE_NOT_ACTIVE');
  if (activation[0].issue_number !== queue.issue_number) fail('ISSUE_NUMBER_MISMATCH');

  // ---- authorized_plan : identite exacte du plan --------------------------
  const plan = queue.authorized_plan;
  if (!SHA40.test(String(plan.plan_blob_oid))) fail('PLAN_BLOB_OID_INVALID', String(plan.plan_blob_oid));
  if (!SHA40.test(String(plan.approved_at_commit))) fail('PLAN_COMMIT_INVALID', String(plan.approved_at_commit));

  const blobAtCommit = gitTry(['rev-parse', plan.approved_at_commit + ':' + plan.plan_path], cwd);
  if (!blobAtCommit.ok) fail('PLAN_PATH_MISMATCH', plan.plan_path + ' introuvable a ' + plan.approved_at_commit);
  if (blobAtCommit.stdout !== plan.plan_blob_oid) {
    fail('PLAN_PATH_MISMATCH', 'attendu ' + plan.plan_blob_oid + ', trouve ' + blobAtCommit.stdout);
  }
  const ancestor = gitTry(['merge-base', '--is-ancestor', plan.approved_at_commit, queue.source_head], cwd);
  if (!ancestor.ok) fail('PLAN_COMMIT_NOT_ANCESTOR', plan.approved_at_commit + ' n\'est pas un ancetre de source_head');

  // ---- client GitHub : obligatoire en production -------------------------
  const github = (options && options.github) || null;
  if (!github && process.env.KODJO_VERIFY_GITHUB !== '1') {
    fail('GITHUB_VERIFICATION_REQUIRED',
      'la verification des preuves GitHub est obligatoire ; le workflow doit poser KODJO_VERIFY_GITHUB=1');
  }
  const api = github || ghClient();
  const actors = Array.isArray(bootstrap.authorized_actors) ? bootstrap.authorized_actors : [];

  // ---- independent_review : le fichier de revue et son empreinte Git --------
  //
  // La revue est un artefact versionne du depot. Son empreinte prouve QUELLE
  // revue a ete produite, et sa presence au commit d'approbation prouve qu'elle
  // accompagne bien le plan execute. Aucune reference externe n'est requise.
  const review = queue.independent_review;
  if (!SHA40.test(String(review.review_blob_oid))) {
    fail('REVIEW_BLOB_OID_INVALID', String(review.review_blob_oid));
  }
  if (review.reviewed_plan_blob_oid !== plan.plan_blob_oid) {
    fail('REVIEW_PLAN_HASH_MISMATCH', 'la revue porte sur ' + review.reviewed_plan_blob_oid);
  }
  if (String(review.verdict).toUpperCase() !== 'APPROVED') {
    fail('REVIEW_VERDICT_NOT_APPROVED', String(review.verdict));
  }
  // Le fichier de revue doit exister au commit d'approbation du plan, et etre
  // exactement celui declare : c'est ce qui lie la revue a la version executee.
  const reviewAtCommit = gitTry(['rev-parse', plan.approved_at_commit + ':' + review.review_path], cwd);
  if (!reviewAtCommit.ok) {
    fail('REVIEW_PATH_MISMATCH', review.review_path + ' introuvable a ' + plan.approved_at_commit);
  }
  if (reviewAtCommit.stdout !== review.review_blob_oid) {
    fail('REVIEW_PATH_MISMATCH',
      'attendu ' + review.review_blob_oid + ', trouve ' + reviewAtCommit.stdout + ' a ' + plan.approved_at_commit);
  }
  const reviewBody = blobContent(review.review_blob_oid, cwd);
  if (!new RegExp('Verdict\\s*:\\s*`?' + String(review.verdict).toUpperCase() + '`?').test(reviewBody)) {
    fail('REVIEW_VERDICT_NOT_IN_ARTEFACT', 'le fichier de revue ne porte pas le verdict ' + review.verdict);
  }
  const planName = path.posix.basename(String(plan.plan_path).replace(/\\/g, '/'));
  if (!reviewBody.includes(planName)) {
    fail('REVIEW_PLAN_NOT_NAMED', 'le fichier de revue ne nomme pas ' + planName);
  }
  // Quand la revue declare la revision du plan qu'elle a examinee, cette
  // revision doit porter exactement le plan approuve.
  const declared = /correction du plan[^`]*`([0-9a-f]{40})`/i.exec(reviewBody);
  if (declared) {
    const planAtDeclared = gitTry(['rev-parse', declared[1] + ':' + plan.plan_path], cwd);
    if (!planAtDeclared.ok || planAtDeclared.stdout !== plan.plan_blob_oid) {
      fail('REVIEW_PLAN_REVISION_MISMATCH',
        'la revue declare avoir examine ' + declared[1] + ', qui ne porte pas le plan approuve');
    }
  }

  // Les plans produits par le volet de planification avec le contrat d'impact
  // deviennent opposables a l'admission. Les plans anterieurs restent
  // compatibles et sont explicitement signales comme legacy : cette evolution
  // ne retro-modifie pas leur scope approuve.
  const planBody = blobContent(plan.plan_blob_oid, cwd);
  const hasImpactContract = planBody.includes('<KODJO_PLAN_IMPACT_JSON>');
  const hasReviewProof = reviewBody.includes('<KODJO_PLAN_IMPACT_REVIEW_JSON>');
  let impact = null;
  let applicationHead = null;
  if (hasImpactContract) {
    applicationHead = resolveImpactApplicationHead(bootstrap, planBody);
    impact = verifyPlanAtRevision({
      cwd,
      sourceHead: applicationHead,
      planMarkdown: planBody,
      reviewMarkdown: reviewBody,
    });
    const declaredScope = [...queue.scope_allow].sort();
    if (JSON.stringify(declaredScope) !== JSON.stringify(impact.scope_allow)) {
      fail('PLAN_SCOPE_CONTRADICTION', 'scope_allow de la demande differe de la matrice approuvee');
    }
  } else if (hasReviewProof) {
    fail('PLAN_SCOPE_CONTRADICTION', 'preuve de revue presente sans matrice de plan');
  }

  // ---- user_gate : trace organisationnelle, verifiee ----------------------
  const gate = queue.user_gate;
  if (String(gate.decision).toUpperCase() !== 'APPROVED') fail('GATE_DECISION_NOT_APPROVED', String(gate.decision));
  // Le login ne peut pas etre choisi librement par la demande. Pour ce depot
  // personnel, l'autorite utilisateur de confiance est son proprietaire.
  const repositoryOwner = String(bootstrap.repository || '').split('/')[0];
  if (!repositoryOwner || String(gate.user_login).toLowerCase() !== repositoryOwner.toLowerCase()) {
    fail('GATE_USER_NOT_AUTHORIZED', String(gate.user_login));
  }
  const gateRef = COMMENT_REF.exec(String(gate.gate_ref));
  if (!gateRef) fail('GATE_REF_INVALID', String(gate.gate_ref));
  const reference = String(gate.gated_reference);
  if (reference !== plan.plan_blob_oid && reference !== queue.source_head) {
    fail('GATE_REFERENCE_MISMATCH', reference + ' ne designe ni le plan approuve ni source_head');
  }
  // Le commentaire de validation est pose par le protocole ; le pouce leve, lui,
  // doit venir du compte utilisateur declare, et de lui seul.
  const gateComment = api.comment(bootstrap.repository, gateRef[1]);
  if (!gateComment || !gateComment.id) fail('GATE_NOT_FOUND', 'commentaire ' + gateRef[1]);
  if (issueOfComment(gateComment) !== queue.issue_number) {
    fail('GATE_ISSUE_MISMATCH', 'commentaire rattache a une autre Issue');
  }
  if (!String(gateComment.body || '').includes(reference)) {
    fail('GATE_REFERENCE_ABSENT', 'le corps du commentaire ne porte pas ' + reference);
  }
  checkThumbsUp(api, bootstrap.repository, gateRef[1], gate.user_login);

  // ---- migration de paquet : attestation versionnee et liee --------------
  // Une reprise sur un HEAD plus recent ne peut pas transformer une racine
  // documentaire generale en liste blanche. La demande reference un blob
  // immuable, et ce blob reprend les autorisations deja verifiees ci-dessus.
  let migrationBlobOid = null;
  if (queue.recovery_migration !== undefined) {
    if (String(queue.mode).toUpperCase() !== 'RESUME_DELTA') {
      fail('RECOVERY_MIGRATION_INITIAL_FORBIDDEN');
    }
    const migration = queue.recovery_migration;
    if (!SHA40.test(String(migration.attestation_blob_oid || ''))) {
      fail('RECOVERY_MIGRATION_ATTESTATION_BLOB_INVALID');
    }
    const atTarget = gitTry([
      'rev-parse', queue.source_head + ':' + migration.attestation_path,
    ], cwd);
    if (!atTarget.ok || atTarget.stdout !== migration.attestation_blob_oid) {
      fail('RECOVERY_MIGRATION_ATTESTATION_PATH_MISMATCH', migration.attestation_path);
    }
    let attestation;
    try { attestation = JSON.parse(blobContent(migration.attestation_blob_oid, cwd)); }
    catch (error) { fail('RECOVERY_MIGRATION_ATTESTATION_INVALID', error.message); }
    const supportedMigrationSchema = attestation.schema_version === ATTESTATION_SCHEMA ||
      attestation.schema_version === 'kodjo.protocol.v2.recovery-migration.0.6.23';
    if (!supportedMigrationSchema || attestation.status !== 'CERTIFIED') {
      fail('RECOVERY_MIGRATION_ATTESTATION_NOT_CERTIFIED');
    }
    const certifiedTarget = String(attestation.certified_target_head || '');
    if (!SHA40.test(certifiedTarget)) {
      fail('RECOVERY_MIGRATION_CERTIFIED_TARGET_INVALID');
    }
    // L'attestation est la derniere preuve Git du cycle de preparation d'une
    // reprise. Son ancre doit donc porter le plan et la revue effectivement
    // approuves. Sans cet invariant, une attestation ancienne peut rester
    // formellement valide tout en precedant le plan qui autorise la reprise.
    const approvalBeforeCertification = gitTry([
      'merge-base', '--is-ancestor', plan.approved_at_commit, certifiedTarget,
    ], cwd);
    if (!approvalBeforeCertification.ok) {
      fail('RECOVERY_MIGRATION_ATTESTATION_PRE_APPROVAL',
        certifiedTarget + ' precede ' + plan.approved_at_commit);
    }
    for (const [kind, artifactPath, expectedBlob] of [
      ['PLAN', plan.plan_path, plan.plan_blob_oid],
      ['REVIEW', review.review_path, review.review_blob_oid],
    ]) {
      const actual = gitTry(['rev-parse', certifiedTarget + ':' + artifactPath], cwd);
      if (!actual.ok || actual.stdout !== expectedBlob) {
        fail('RECOVERY_MIGRATION_' + kind + '_NOT_AT_CERTIFIED_TARGET', artifactPath);
      }
    }
    if (attestation.slice_id !== queue.slice_id ||
        attestation.baseline_head !== queue.baseline_head ||
        String(attestation.source_run_id) !== String(queue.retry_of_run_id) ||
        attestation.session_id !== queue.session_id) {
      fail('RECOVERY_MIGRATION_PROVENANCE_MISMATCH');
    }
    if (hasImpactContract) {
      const expectedAttestedHead = resolveAttestedApplicationHead(queue, applicationHead);
      verifyAttestedApplicationHead(attestation, expectedAttestedHead);
    }
    const binding = attestation.authorization_binding || {};
    const bindingMatches = Boolean(binding.authorized_plan &&
        binding.authorized_plan.plan_path === plan.plan_path &&
        binding.authorized_plan.plan_blob_oid === plan.plan_blob_oid &&
        binding.independent_review &&
        binding.independent_review.review_path === review.review_path &&
        binding.independent_review.review_blob_oid === review.review_blob_oid &&
        binding.independent_review.reviewed_plan_blob_oid === review.reviewed_plan_blob_oid &&
        binding.user_gate &&
        binding.user_gate.gate_ref === gate.gate_ref &&
        binding.user_gate.gated_reference === gate.gated_reference &&
        binding.user_gate.decision === gate.decision &&
        binding.user_gate.user_login === gate.user_login);
    const separatelyVerified = attestation.schema_version === ATTESTATION_SCHEMA &&
      attestation.authorization_policy === 'CURRENT_REQUEST_VERIFIED_SEPARATELY';
    if (!bindingMatches && !separatelyVerified) {
      fail('RECOVERY_MIGRATION_AUTHORIZATION_BINDING_MISMATCH');
    }
    migrationBlobOid = migration.attestation_blob_oid;
  }

  // Ce qui est etabli : la revue produite est bien celle declaree, elle
  // accompagne le plan execute, et elle porte un verdict favorable. Ce qui ne
  // l'est pas : que son auteur soit une autre personne que celle qui a redige le
  // plan. La limite est nommee, jamais masquee.
  const notes = ['REVIEW_ACTOR_INDEPENDENCE_NOT_GUARANTEED'];
  if (!declared) notes.push('REVIEW_PLAN_REVISION_NOT_DECLARED');
  if (!hasImpactContract) notes.push('PLAN_IMPACT_LEGACY_NOT_ENFORCED');

  return {
    slice_id: queue.slice_id,
    plan_blob_oid: plan.plan_blob_oid,
    gate_ref: gate.gate_ref,
    review_blob_oid: review.review_blob_oid,
    recovery_migration_blob_oid: migrationBlobOid,
    evidence_kinds: {
      authorized_plan: plan.evidence_kind,
      independent_review: review.evidence_kind,
      user_gate: gate.evidence_kind,
    },
    notes,
    plan_impact_sha256: impact ? impact.scan_sha256 : null,
  };
}

if (require.main === module) {
  try {
    const [queueFile] = process.argv.slice(2);
    if (!queueFile) throw new Error('USAGE: verify-authorizations.js <queue.json>');
    const result = verify(queueFile, { cwd: process.cwd() });
    process.stdout.write('[KODJO_V2] autorisations coherentes — plan ' + result.plan_blob_oid.slice(0, 12) + '\n');
    for (const note of result.notes) process.stdout.write('[KODJO_V2] ' + note + '\n');
  } catch (error) {
    process.stderr.write(String(error && error.message ? error.message : error) + '\n');
    process.exit(1);
  }
}

module.exports = {
  verify, ghClient, checkThumbsUp, issueOfComment, blobContent,
  resolveImpactApplicationHead, resolveAttestedApplicationHead, verifyAttestedApplicationHead,
};
