'use strict';

/**
 * Business status of an implementation — KODJO V2 §5.2-A.
 *
 * Normative rule enforced here:
 *   "Un controle en echec bloque la validation, jamais la conservation. Des
 *    qu'un patch exploitable a ete preserve, le statut ne peut pas etre
 *    retrograde en IMPLEMENTATION_FAILED a cause de Jest, TypeScript, lint,
 *    du controle de perimetre, de la revue ou de la publication du commentaire."
 */

const STATUSES = {
  VERIFIED: 'IMPLEMENTED_AND_VERIFIED',
  FAILED_CHECKS: 'IMPLEMENTED_WITH_FAILED_CHECKS',
  CLARIFICATION: 'CLARIFICATION_REQUIRED',
  FAILED: 'IMPLEMENTATION_FAILED',
};

/** Exit code of the run, emitted only after preservation AND publication. */
const EXIT_CODES = {
  IMPLEMENTED_AND_VERIFIED: 0,
  IMPLEMENTED_WITH_FAILED_CHECKS: 1,
  CLARIFICATION_REQUIRED: 2,
  IMPLEMENTATION_FAILED: 3,
};

const RECOVERY = {
  IMPLEMENTED_AND_VERIFIED: 'NONE',
  IMPLEMENTED_WITH_FAILED_CHECKS: 'TARGETED_FIX',
  CLARIFICATION_REQUIRED: 'CLARIFICATION',
  IMPLEMENTATION_FAILED: 'REIMPLEMENT',
};

/**
 * @param {object} input
 * @param {boolean} input.hasChanges          at least one file differs from source_head
 * @param {boolean} input.patchValidated      git apply --check passed on a clean space
 * @param {boolean} [input.recoveryUploaded]   the recovery artifact was durably
 *        uploaded. Absent means "not observed" and is treated as true for
 *        backward compatibility; the workflow always passes an explicit value.
 * @param {string|null} input.agentStatus     status declared by the agent adapter
 * @param {Array<object>} input.checks        check result objects
 * @param {Array<string>} input.requiredChecks
 * @returns {{status:string, failed_checks:string[], not_run_checks:string[], reasons:string[]}}
 */
function computeStatus(input) {
  const checks = input.checks || [];
  const required = input.requiredChecks || [];
  const reasons = [];

  const failed = checks.filter((c) => c.status !== 'PASS' && c.status !== 'NOT_RUN').map((c) => c.check);
  if (checks.some((c) => !['PASS', 'FAIL', 'NOT_RUN'].includes(c.status))) {
    reasons.push('CHECK_STATUS_INVALID: an unrecognized result is never a successful check.');
  }
  const notRun = checks.filter((c) => c.status === 'NOT_RUN').map((c) => c.check);
  const executed = new Set(checks.map((c) => c.check));
  for (const name of required) {
    if (!executed.has(name) && !notRun.includes(name)) notRun.push(name);
  }

  const preserved = Boolean(input.hasChanges) && Boolean(input.patchValidated);
  const uploaded = input.recoveryUploaded === undefined ? true : Boolean(input.recoveryUploaded);

  // MAJ-01: a patch that exists only in the ephemeral workspace is NOT
  // recoverable. Announcing IMPLEMENTED_WITH_FAILED_CHECKS and prescribing a
  // TARGETED_FIX would point at an artifact that does not exist. Per §5.2-A,
  // a failed preservation is IMPLEMENTATION_FAILED.
  if (preserved && !uploaded) {
    reasons.push(
      'RECOVERY_NOT_DURABLE: the delta was preserved and validated but its recovery artifact ' +
        'was not durably uploaded. No TARGETED_FIX source exists.'
    );
    return { status: STATUSES.FAILED, failed_checks: failed, not_run_checks: notRun, reasons };
  }

  if (!preserved) {
    if (!input.hasChanges && input.agentStatus === STATUSES.CLARIFICATION) {
      reasons.push('Agent stopped on a functional ambiguity before producing a delta.');
      return { status: STATUSES.CLARIFICATION, failed_checks: failed, not_run_checks: notRun, reasons };
    }
    if (!input.hasChanges) {
      reasons.push('No file differs from source_head: no recoverable implementation was produced.');
    }
    if (input.hasChanges && !input.patchValidated) {
      reasons.push('Preservation or patch validation failed: the delta is not provably recoverable.');
    }
    return { status: STATUSES.FAILED, failed_checks: failed, not_run_checks: notRun, reasons };
  }

  // From here a recoverable patch exists: never downgrade to IMPLEMENTATION_FAILED.
  if (input.agentStatus === STATUSES.CLARIFICATION) {
    reasons.push('Agent declared a functional ambiguity while a recoverable delta is preserved.');
    return { status: STATUSES.CLARIFICATION, failed_checks: failed, not_run_checks: notRun, reasons };
  }

  if (failed.length === 0 && notRun.length === 0) {
    reasons.push('Recoverable delta preserved and every required check passed.');
    return { status: STATUSES.VERIFIED, failed_checks: [], not_run_checks: [], reasons };
  }

  if (failed.length > 0) reasons.push('Failed checks: ' + failed.join(', ') + '.');
  if (notRun.length > 0) {
    reasons.push('Checks not executed (never reported as success): ' + notRun.join(', ') + '.');
  }
  reasons.push('Preservation is intact: the delta remains recoverable.');
  return { status: STATUSES.FAILED_CHECKS, failed_checks: failed, not_run_checks: notRun, reasons };
}

module.exports = { STATUSES, EXIT_CODES, RECOVERY, computeStatus };
