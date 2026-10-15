# Nettoyage des workflows — clôture du 14 octobre 2026

Point 5 terminé sur le lot exact approuvé explicitement par Hermann (« oui », après présentation des 29 workflows du précontrôle).

Précontrôle : [registre exact](https://github.com/MyUncried/Application-Routine/blob/2f3a31d611e0f5bbd85aca14db48b0e81d82f5dd/.github/orchestration/reports/2026-10-14_WORKFLOW_CLEANUP_PRECHECK.md).

## Résultat vérifié

- 94 workflows enregistrés avant et après.
- 29 workflows approuvés passés de active à disabled_manually.
- Les 65 workflows hors lot restent active ; aucune exception à l’ensemble attendu.
- Aucun run in_progress observé avant la première désactivation.
- Chaque confirmation d’interface a été suivie du message « This workflow was disabled manually. » ; le contrôle final indépendant utilise l’API GitHub publique actions/workflows?per_page=100.
- Aucun fichier de workflow supprimé ou modifié, aucun run ou artefact supprimé, aucun nouveau test/campagne/modèle déclenché.
- Les 75 fichiers YAML restent conservés, dont les 12 workflows présents mais désactivés ; les 17 autres objets désactivés correspondaient déjà à des fichiers absents de main.

## Lot désactivé

| Identifiant | Workflow | État final |
|---:|---|---|
| 344743776 | [Claude Cloud OAuth Isolation Test (Issue](https://github.com/MyUncried/Application-Routine/actions/workflows/cloud-oauth-isolation-test.yml) | disabled_manually |
| 357248044 | [KODJO Diagnostic Run53 Jest Full](https://github.com/MyUncried/Application-Routine/actions/workflows/diagnostic-run53-jest-full.yml) | disabled_manually |
| 346541762 | [KODJO BASE Evidence Recovery](https://github.com/MyUncried/Application-Routine/actions/workflows/kodjo-base-evidence-recovery.yml) | disabled_manually |
| 346545505 | [KODJO BASE Recovery Durable Verifier](https://github.com/MyUncried/Application-Routine/actions/workflows/kodjo-base-recovery-verifier.yml) | disabled_manually |
| 348221544 | [KODJO Claude Local Session Resume 02](https://github.com/MyUncried/Application-Routine/actions/workflows/kodjo-claude-local-session-resume-02.yml) | disabled_manually |
| 348225342 | [KODJO Claude Local Session Resume 03](https://github.com/MyUncried/Application-Routine/actions/workflows/kodjo-claude-local-session-resume-03.yml) | disabled_manually |
| 347894590 | [KODJO Claude Local Session Resume Test](https://github.com/MyUncried/Application-Routine/actions/workflows/kodjo-claude-local-session-resume-test.yml) | disabled_manually |
| 346411868 | [KODJO Claude Session Resume Micro-Test](https://github.com/MyUncried/Application-Routine/actions/workflows/kodjo-claude-session-resume-test.yml) | disabled_manually |
| 346528259 | [KODJO Durable Store Preflight](https://github.com/MyUncried/Application-Routine/actions/workflows/kodjo-durable-store-preflight.yml) | disabled_manually |
| 355927790 | [KODJO Jest Timeout Qualification](https://github.com/MyUncried/Application-Routine/actions/workflows/kodjo-jest-timeout-qualification.yml) | disabled_manually |
| 358702017 | [.github/workflows/kodjo-oneoff-v2-bilat-clean-push.yml](https://github.com/MyUncried/Application-Routine/actions/workflows/kodjo-oneoff-v2-bilat-clean-push.yml) | disabled_manually |
| 358748283 | [KODJO PR145 CI propagation repair](https://github.com/MyUncried/Application-Routine/actions/workflows/kodjo-pr145-ci-propagation-fix.yml) | disabled_manually |
| 358755308 | [KODJO PR145 final oracle repair](https://github.com/MyUncried/Application-Routine/actions/workflows/kodjo-pr145-final-oracle-fix.yml) | disabled_manually |
| 358768063 | [KODJO PR145 register finalize](https://github.com/MyUncried/Application-Routine/actions/workflows/kodjo-pr145-register-finalize.yml) | disabled_manually |
| 346563037 | [KODJO RESUME Forensic Recovery](https://github.com/MyUncried/Application-Routine/actions/workflows/kodjo-resume-forensic-recovery.yml) | disabled_manually |
| 360281803 | [KODJO temporary final certification register update](https://github.com/MyUncried/Application-Routine/actions/workflows/kodjo-temp-final-cert-register.yml) | disabled_manually |
| 350505484 | [KODJO V1.4 Local E2E Recovery](https://github.com/MyUncried/Application-Routine/actions/workflows/kodjo-v14-local-e2e-recover.yml) | disabled_manually |
| 350383357 | [KODJO V1.4 Local E2E](https://github.com/MyUncried/Application-Routine/actions/workflows/kodjo-v14-local-e2e.yml) | disabled_manually |
| 345480340 | [KODJO Work transport signal utility](https://github.com/MyUncried/Application-Routine/actions/workflows/kodjo-work-transport-review-test.yml) | disabled_manually |
| 383544757 | [PRE-4 Claude availability diagnostic](https://github.com/MyUncried/Application-Routine/actions/workflows/pre4-claude-availability-diagnostic.yml) | disabled_manually |
| 360465058 | [TEMP apply V2-CAT-01 documentation fix](https://github.com/MyUncried/Application-Routine/actions/workflows/tmp-apply-v2-cat-doc-fix.yml) | disabled_manually |
| 360466472 | [TEMP sync V2-CAT-01 Figma evidence](https://github.com/MyUncried/Application-Routine/actions/workflows/tmp-sync-v2-cat-figma-evidence.yml) | disabled_manually |
| 360465670 | [TEMP tighten V2-CAT-01 planning mission](https://github.com/MyUncried/Application-Routine/actions/workflows/tmp-tighten-v2-cat-planning-mission.yml) | disabled_manually |
| 360542737 | [TEMP V2-CAT-01 final plan sync](https://github.com/MyUncried/Application-Routine/actions/workflows/tmp-v2-cat-final-plan-sync.yml) | disabled_manually |
| 360516555 | [TEMP V2-CAT-01 review2 sync](https://github.com/MyUncried/Application-Routine/actions/workflows/tmp-v2-cat-review2-sync.yml) | disabled_manually |
| 360700469 | [TEMP V2 lifecycle register sync](https://github.com/MyUncried/Application-Routine/actions/workflows/tmp-v2-lifecycle-register-sync.yml) | disabled_manually |
| 360627936 | [.github/workflows/tmp-v2-minor-clarification-register-sync.yml](https://github.com/MyUncried/Application-Routine/actions/workflows/tmp-v2-minor-clarification-register-sync.yml) | disabled_manually |
| 360604281 | [.github/workflows/tmp-v2-plan-contract-consistency-sync.yml](https://github.com/MyUncried/Application-Routine/actions/workflows/tmp-v2-plan-contract-consistency-sync.yml) | disabled_manually |
| 360705363 | [.github/workflows/tmp-v2-publication-inputs-sync.yml](https://github.com/MyUncried/Application-Routine/actions/workflows/tmp-v2-publication-inputs-sync.yml) | disabled_manually |

## Conservation et reprise

Les CI, builds iOS, synchronisations Routine Dev/stable, exécuteurs V2 utilisés, relais de revue et continuation Work VNext, contrôles VNext et diagnostics génériques restent actifs. Les sources, historiques et preuves restent consultables. Réactivation unitaire possible avec Enable workflow.

Le retrait physique des workflows V1.3/V1.4 encore appelés par le routeur n’est pas déclaré effectué ; il doit rester coordonné avec les routes et la politique de sécurité. Les 65 workflows conservés sont listés ci-dessous.

| Identifiant | Workflow | État final |
|---:|---|---|
| 361284180 | iOS EAS Preview | active |
| 361965162 | iOS Routine Dev review build | active |
| 347936414 | KODJO Claude Local Auth Diagnostic | active |
| 348210142 | KODJO Claude Local Auth Smoke | active |
| 347847180 | KODJO Claude Local Runner Preflight | active |
| 345364457 | KODJO E2E Chain Completion V1.3 | active |
| 345385666 | KODJO E2E Claude Stub V1.3 | active |
| 345364623 | KODJO E2E Orchestration Test V1.3 | active |
| 345388935 | KODJO E2E T1-T6 V1.3 | active |
| 345391542 | KODJO E2E T4 OpenAI Full Chain V1.3 | active |
| 345168308 | KODJO Event Router V1.3 | active |
| 361955682 | KODJO — Routine Dev environment sync | active |
| 361965163 | KODJO — Routine stable environment sync | active |
| 351735577 | KODJO — Generic Slice Finalize | active |
| 352198571 | KODJO — Recover Implementation Publication | active |
| 351735226 | KODJO — Generic Slice Implementation Review | active |
| 351734934 | KODJO — Generic Slice Implementation | active |
| 351734155 | KODJO — Generic Slice Plan Review | active |
| 351572389 | KODJO — Generic Slice Plan | active |
| 351735848 | KODJO — Generic Slice Recover Worktree | active |
| 345441821 | KODJO T8 Work Arbitration Transport | active |
| 345457841 | KODJO V1.3 Integrated T1-T9 Test | active |
| 350846064 | KODJO V1.4 S09 — DEV | active |
| 350556098 | KODJO V1.4 S09 — Finalize | active |
| 350555788 | KODJO V1.4 S09 — Implementation Local | active |
| 350555337 | KODJO V1.4 S09 — Plan OpenAI | active |
| 350823381 | KODJO V1.4 S09 — Independent Plan Review | active |
| 351395438 | KODJO V1.4 S09 — Protocol Audit | active |
| 351170521 | KODJO V1.4 S09 — Recover Worktree | active |
| 350555548 | KODJO V1.4 S09 — Independent Review | active |
| 351464215 | KODJO V1.4 S09 — Validate Integration | active |
| 361106782 | KODJO V2 — Bounded PLAN Handoff E2E | active |
| 370612867 | KODJO — Comment Router | active |
| 356163630 | KODJO V2 disposable qualification | active |
| 355037713 | KODJO V2 implementation artifact | active |
| 355204294 | KODJO V2 Lean Queue | active |
| 370122497 | KODJO V2 — Next Evolution Independent Claude Audit | active |
| 355188745 | KODJO V2 pilot tests | active |
| 361133819 | KODJO V2 — Approved Plan Handoff Materialization | active |
| 361133820 | KODJO V2 — Approved Plan Handoff Queue | active |
| 374578379 | KODJO V2 — Plan Review Republication | active |
| 353539521 | KODJO V2 preservation smoke | active |
| 361403837 | KODJO V2 — Review Existing Delivery Bridge | active |
| 371490809 | KODJO V2 — Review launch smoke | active |
| 357034344 | KODJO V2 runner inventory | active |
| 360038215 | KODJO V2 — Initial Slice Plan Review | active |
| 360038218 | KODJO V2 — Initial Slice Plan | active |
| 360643718 | KODJO V2 — Minor Plan Clarification | active |
| 357371536 | KODJO V2 — Slice Plan Review | active |
| 357371538 | KODJO V2 — Slice Plan Revision | active |
| 362575738 | KODJO V2 — Targeted validation and full requalification | active |
| 357062853 | KODJO V2 targeted runner cleanup | active |
| 354420515 | KODJO V2 transition | active |
| 378150729 | KODJO VNext tolerance real review qualification | active |
| 379759006 | KODJO VNext — ChatGPT PRE-4 agent relay | active |
| 378441664 | KODJO VNext generic delivery closure | active |
| 377949597 | KODJO VNext read-only historical checks | active |
| 375729407 | KODJO VNext targeted Windows performance | active |
| 371171468 | KODJO VNext proof stability and architecture | active |
| 376303389 | KODJO recover interrupted run 37446216690 | active |
| 378448875 | KODJO VNext existing minor findings resolution review | active |
| 384072050 | KODJO VNext — Work continuation | active |
| 371551885 | KODJO VNext-12 disposable preparation | active |
| 345242944 | Claude T01-S09 Implementation V1.3 [TEMPORAIRE] | active |
| 344958627 | Claude T01-S09 Plan Revision V1.3 [TEMPORAIRE] | active |

## Limite

Le nettoyage réduit les anciennes possibilités de lancement. Il ne démontre pas la résolution des interruptions de connexion ChatGPT. Le refus automatique initial est conservé dans le précontrôle ; l’exécution présente est postérieure à l’autorisation explicite du lot exact. Aucune désactivation par contournement n’a été réalisée.
