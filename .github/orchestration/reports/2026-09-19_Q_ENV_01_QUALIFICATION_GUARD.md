# Q-ENV-01 — availability of the disposable qualification runner

Baseline before correction: `7ab921c0b02e505a19596758f49f9a3535579c5a`.

Evidence: disposable run 35439480670 stopped before INITIAL because the aggregate
Lean Queue status remained queued. The historical incident is INC-119 / PE-25.
Current read-only Windows inventory 35439897184 completed successfully: no lock,
no process referencing the KODJO work directory, no persistent run directory.
GitHub independently reports the previous attempt completed, all its jobs
completed, latest jobs empty and the next attempt absent (404).

Cause: the harness equated an aggregate non-completed status with execution.
This is an external GitHub inconsistency exposing an overly coarse harness
availability check. No execution or protocol success is inferred from it.

Correction scope: disposable workflow, availability collector/classifier and
their dedicated pilot tests. The qualification workflow shares Lean Queue's
concurrency group without cancellation. Existing runtime locks remain intact.
The inventory workflow and all product/state-transition rules are unchanged.

## Durable harness rule

An aggregate queued run may be classified RESIDUAL_NON_EXECUTING only when:

- it has been unchanged for at least 30 minutes;
- its same-numbered, same-HEAD attempt is explicitly completed;
- all historical jobs are completed and assigned to the currently observed runner;
- no latest jobs exist and the next attempt explicitly returns 404;
- fresh local observation finds no Claude/KODJO process, no global lock, no
  directory or runtime state for that run;
- the current qualification job is proven in progress on this runner;
- a second queue snapshot and run read show no change, and main remains exact.

Zero jobs alone, an API error, missing data, another runner, a recent queue,
an active/ambiguous process, a lock or concurrent activity all cause refusal.
The residual run remains an external incident; ADMITTED applies exclusively to
the qualification harness's availability, never to a KODJO request or its gates.
The check contains no run-ID exception. Shared workflow concurrency protects
against a nominal Lean execution starting after the observations; the runtime
execution lock continues to protect Claude itself.

## Verification plan

Dedicated tests cover real queued/in_progress refusal, ambiguity and strict
booleans, local concurrency/lock, concordant residual admission, race between
snapshots, API errors/truncation, and unchanged HEAD/main guards. They run with
the existing Linux/Windows pilot suites. A live disposable dispatch then checks
the actual GitHub and Windows collection path. Fixture tests are UNIT/INTEGRATION,
not E2E proof. The historical pilot-CI optional disposable gate remains stricter
and is not used for this campaign; no residual exception is silently added there.

No new baseline is silently substituted for the initial campaign baseline.
Correction commits and their real runs must be recorded separately in the
consolidated qualification report.
