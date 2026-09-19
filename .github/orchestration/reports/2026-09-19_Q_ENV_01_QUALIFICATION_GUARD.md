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
their dedicated pilot tests. The qualification workflow does not join Lean
Queue's concurrency group: admission must not cancel another pending workflow.
Existing runtime locks remain intact.
The inventory workflow also provides read-only process ownership, ancestry and two activity samples. All product/state-transition rules are unchanged.

## Durable harness rule

An aggregate queued run may be classified RESIDUAL_NON_EXECUTING only when:

- it has been unchanged for at least 30 minutes;
- its same-numbered, same-HEAD attempt is explicitly completed;
- all historical jobs are completed and assigned to the currently observed runner;
- no latest jobs exist and the next attempt explicitly returns 404;
- fresh local observation finds no Claude/KODJO process, no global lock, no
  work directory for that run; retained state is either absent or contains only the two bound initialization diagnostics described below;
- the current qualification job is proven in progress on this runner, with
  exactly one Runner.Worker process proven to be the current process's ancestor;
- a second queue snapshot and run read show no change, and main remains exact.

Zero jobs alone, an API error, missing data, another runner, a recent queue,
an active/ambiguous process, a lock or concurrent activity all cause refusal.
The residual run remains an external incident; ADMITTED applies exclusively to
the qualification harness's availability, never to a KODJO request or its gates.
The check contains no run-ID exception. The occupied current runner executes
one job at a time; a second worker causes refusal. The runtime execution lock
continues to protect Claude itself, including local invocations outside Actions.

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

## Retained initialization diagnostics

A completed job may retain `run-context.json` and `result.json` created by
`initialize-run-diagnostic.js`. Their presence alone does not prove execution.
The guard preserves them and permits this narrow archive shape only when both
records bind the exact run/attempt, their creation predates job completion, and
result is strictly PRE_INVOCATION / claude_invoked=false / RUN_INITIALIZED.
Unknown files, malformed records, changed contents between observations,
activity, locks, or any missing GitHub proof still cause refusal. No archive
allows replay of a request or substitutes for the durable consumption ledger.

Process investigation 35443411056 identified a live VS Code extension process;
it was not killed. After the user closed VS Code, inventory 35443649738 observed
no Claude process and no lock in both samples. These are Windows observations,
not E2E qualification.

## Q-HARNESS-DURABILITY — correction après INITIAL interrompu

Évidence : run 35443823432, requête 795e96cd-6a90-4407-8f00-8d598c00957e,
invocation EXTERNAL_CALL_SENT sans identité de session conservée ; aucun tag de
consommation GitHub trouvé pour cette requête. Le harnais invoquait directement
le lanceur local, sans passer par le consommateur Lean Queue. Aucun reçu ni
session historiques ne sont reconstruits a posteriori. Le run n'est pas rejoué.

Correction minimale : consommation atomique dans le registre commun D1, sous
verrou et avant l'appel, avec reçu typé jetable et requête/session synchronisées
sur disque. La session est déjà écrite dans l'intention d'invocation depuis la
correction précédente. Le jeton GitHub est capturé puis retiré de l'environnement
avant les commandes Claude. PreflightOnly demeure sans consommation.

Fichiers : consume-disposable-request.js, run-local-claude.js, les deux scripts
run-disposable*, les workflows disposable-qualification et pilot-tests ; règle
et exception de preuve déclarées dans le protocole 0.6.46 et le scanner de
capacités distantes. Aucun second chemin de publication de code n'est ajouté.

Écart connexe du même harnais : le générateur de RESUME_DELTA omettait les champs
retry exigés par le contrat courant. create-kodjo-v2-request.ps1 et
invoke-kodjo-v2.ps1 les transmettent explicitement ; le harnais de reprise les
lie au run source déjà vérifié. Les gates recovery/session/HEAD restent requis.

Tests ajoutés : disposable-consumption.pilot.js, avec processus distincts et
registre Git réel, concurrence, réponse perdue, lecture incohérente, échec disque,
identité/contexte refusés, séparation du reçu jetable/queue et permissions
bornées. Test natif PowerShell du générateur prévu sur Windows CI. Le test
historique incident-register n'impose plus la lecture seule absolue incompatible
avec D1, mais conserve l'interdiction de publier du code ou une PR.

Résultats locaux avant publication : 16/16 tests initiaux ciblés ; première
suite complète 559 tests, 550 passés, 6 ignorés, 3 échecs liés à l'ancienne
hypothèse de lecture seule. Après adaptation bornée, seconde passe ciblée :
53 tests, 52 passés, 1 ignoré (PowerShell indisponible), 0 échec. Scanner de
capacités distantes et syntaxe indépendante des 61 workflows : PASS.

Statut : correction candidate ; Windows et nouvelle exécution GitHub à qualifier.
Niveaux acquis ici : STATIC, UNIT, INTEGRATION. Aucun REAL_E2E supplémentaire.
