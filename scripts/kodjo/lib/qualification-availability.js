'use strict';

// Availability of the qualification harness; never an execution authorization
// for an immutable KODJO request. Every uncertain observation fails closed.
function requireProof(ok, code) { if (!ok) throw new Error(code); }
const terminal = (job) => job && job.status === 'completed' &&
  typeof job.conclusion === 'string' && job.conclusion.length > 0 &&
  Number.isFinite(Date.parse(job.completed_at));

function classifyResidual(proof, now = Date.now()) {
  const { run, attempt, allJobs, latestJobs, nextAttemptStatus, local, runnerId } = proof;
  requireProof(run && run.status === 'queued' && run.conclusion === null &&
    Number.isSafeInteger(run.id) && Number.isSafeInteger(run.run_attempt) && run.run_attempt > 0,
  'LEAN_ACTIVITY_OR_AMBIGUOUS_RUN');
  const updated = Date.parse(run.updated_at);
  requireProof(Number.isFinite(updated) && now - updated >= 30 * 60 * 1000,
    'LEAN_RECENT_OR_UNDATED_RUN');
  requireProof(attempt && attempt.id === run.id && attempt.run_attempt === run.run_attempt &&
    attempt.head_sha === run.head_sha && attempt.status === 'completed' &&
    typeof attempt.conclusion === 'string' && attempt.conclusion.length > 0,
  'LEAN_ATTEMPT_NOT_TERMINAL');
  requireProof(nextAttemptStatus === 404, 'LEAN_NEXT_ATTEMPT_EXISTS_OR_UNKNOWN');
  requireProof(latestJobs && latestJobs.total_count === 0 && Array.isArray(latestJobs.jobs) && latestJobs.jobs.length === 0,
    'LEAN_LATEST_JOBS_PRESENT_OR_UNKNOWN');
  requireProof(Array.isArray(allJobs) && allJobs.length > 0 && allJobs.every(terminal) &&
    allJobs.some(j => j.run_attempt === run.run_attempt) &&
    Number.isSafeInteger(runnerId) && runnerId > 0 && allJobs.every(j => j.runner_id === runnerId),
  'LEAN_JOB_HISTORY_OR_RUNNER_AMBIGUOUS');
  requireProof(local && local.platform === 'win32' && local.lockAbsent === true &&
    local.processScan === 'NONE' && local.runDirectoryAbsent === true &&
    local.runStateAbsent === true && Number.isFinite(local.observedAt) &&
    now >= local.observedAt && now - local.observedAt <= 30000,
  'LEAN_LOCAL_ACTIVITY_OR_AMBIGUITY');
  return { run_id: run.id, attempt: run.run_attempt, disposition: 'RESIDUAL_NON_EXECUTING' };
}

module.exports = { classifyResidual, requireProof };
