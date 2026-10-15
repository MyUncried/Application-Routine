# Nettoyage des workflows — précontrôle du 14 octobre 2026

Statut : prêt, désactivation bloquée par le contrôle automatique en attente d’autorisation explicite sur ce lot exact. Aucune désactivation effectuée.

Instruction : Hermann demande « Point 5 » du nettoyage. Main examiné : d08ba87fa4d881303c6c66b82ab1376fd0be3a70.

## Inventaire et périmètre

- 94 workflows enregistrés actifs dans GitHub, pour 75 fichiers de workflows suivis dans main.
- Lot proposé : 29 désactivations réversibles, dont 12 fichiers encore présents et 17 anciens workflows dont le fichier est absent de main.
- Les 10 PR ouvertes ont été examinées : aucun des 17 fichiers absents ne figure dans leurs fichiers modifiés.
- Les 12 workflows présents ne sont pas appelés par jobs.uses depuis les workflows courants. Le verifier BASE dépend du producteur BASE, inclus dans le même lot.
- Recherche de noms exacts des fichiers dans scripts/kodjo et les workflows hors lot : aucune référence exécutable trouvée.
- Aucun run en cours observé au début de la préparation. Ce fait sera revérifié juste avant toute désactivation.

## Lot exact à autoriser

| Workflow | Identifiant GitHub | Fichier | Situation |
|---|---:|---|---|
| Claude Cloud OAuth Isolation Test (Issue | 344743776 | cloud-oauth-isolation-test.yml | Fichier déjà absent de main |
| KODJO Diagnostic Run53 Jest Full | 357248044 | diagnostic-run53-jest-full.yml | Fichier déjà absent de main |
| KODJO BASE Evidence Recovery | 346541762 | kodjo-base-evidence-recovery.yml | Historique/ponctuel, fichier conservé |
| KODJO BASE Recovery Durable Verifier | 346545505 | kodjo-base-recovery-verifier.yml | Historique/ponctuel, fichier conservé |
| KODJO Claude Local Session Resume 02 | 348221544 | kodjo-claude-local-session-resume-02.yml | Historique/ponctuel, fichier conservé |
| KODJO Claude Local Session Resume 03 | 348225342 | kodjo-claude-local-session-resume-03.yml | Historique/ponctuel, fichier conservé |
| KODJO Claude Local Session Resume Test | 347894590 | kodjo-claude-local-session-resume-test.yml | Historique/ponctuel, fichier conservé |
| KODJO Claude Session Resume Micro-Test | 346411868 | kodjo-claude-session-resume-test.yml | Historique/ponctuel, fichier conservé |
| KODJO Durable Store Preflight | 346528259 | kodjo-durable-store-preflight.yml | Historique/ponctuel, fichier conservé |
| KODJO Jest Timeout Qualification | 355927790 | kodjo-jest-timeout-qualification.yml | Fichier déjà absent de main |
| .github/workflows/kodjo-oneoff-v2-bilat-clean-push.yml | 358702017 | kodjo-oneoff-v2-bilat-clean-push.yml | Fichier déjà absent de main |
| KODJO PR145 CI propagation repair | 358748283 | kodjo-pr145-ci-propagation-fix.yml | Fichier déjà absent de main |
| KODJO PR145 final oracle repair | 358755308 | kodjo-pr145-final-oracle-fix.yml | Fichier déjà absent de main |
| KODJO PR145 register finalize | 358768063 | kodjo-pr145-register-finalize.yml | Fichier déjà absent de main |
| KODJO RESUME Forensic Recovery | 346563037 | kodjo-resume-forensic-recovery.yml | Historique/ponctuel, fichier conservé |
| KODJO temporary final certification register update | 360281803 | kodjo-temp-final-cert-register.yml | Fichier déjà absent de main |
| KODJO V1.4 Local E2E Recovery | 350505484 | kodjo-v14-local-e2e-recover.yml | Historique/ponctuel, fichier conservé |
| KODJO V1.4 Local E2E | 350383357 | kodjo-v14-local-e2e.yml | Historique/ponctuel, fichier conservé |
| KODJO Work transport signal utility | 345480340 | kodjo-work-transport-review-test.yml | Historique/ponctuel, fichier conservé |
| PRE-4 Claude availability diagnostic | 383544757 | pre4-claude-availability-diagnostic.yml | Historique/ponctuel, fichier conservé |
| TEMP apply V2-CAT-01 documentation fix | 360465058 | tmp-apply-v2-cat-doc-fix.yml | Fichier déjà absent de main |
| TEMP sync V2-CAT-01 Figma evidence | 360466472 | tmp-sync-v2-cat-figma-evidence.yml | Fichier déjà absent de main |
| TEMP tighten V2-CAT-01 planning mission | 360465670 | tmp-tighten-v2-cat-planning-mission.yml | Fichier déjà absent de main |
| TEMP V2-CAT-01 final plan sync | 360542737 | tmp-v2-cat-final-plan-sync.yml | Fichier déjà absent de main |
| TEMP V2-CAT-01 review2 sync | 360516555 | tmp-v2-cat-review2-sync.yml | Fichier déjà absent de main |
| TEMP V2 lifecycle register sync | 360700469 | tmp-v2-lifecycle-register-sync.yml | Fichier déjà absent de main |
| .github/workflows/tmp-v2-minor-clarification-register-sync.yml | 360627936 | tmp-v2-minor-clarification-register-sync.yml | Fichier déjà absent de main |
| .github/workflows/tmp-v2-plan-contract-consistency-sync.yml | 360604281 | tmp-v2-plan-contract-consistency-sync.yml | Fichier déjà absent de main |
| .github/workflows/tmp-v2-publication-inputs-sync.yml | 360705363 | tmp-v2-publication-inputs-sync.yml | Fichier déjà absent de main |

## Conservation

Les 65 autres workflows restent actifs. Sont notamment préservés les deux builds iOS, les synchronisations Routine Dev/stable, le routeur commun, la Lean Queue, les exécuteurs V2 utilisés, les CI, le relais de revue VNext, sa continuation Work, les contrôles de qualification et de clôture VNext, et les outils génériques d’inventaire, de nettoyage et de diagnostic.

Les deux workflows VNext enregistrés mais absents de main (performance et récupération du run 37446216690) sont conservés pour cette passe : dépendances/provenance historiques à réconcilier avant retrait.

Les workflows V1.3/V1.4 réutilisables encore appelés par le routeur ne sont pas retirés dans cette passe. Leur retrait exige un traitement de leurs routes et de leur registre de sécurité, coordonné avec la correction VNext courante. Aucun retrait complet des writers legacy ni gate de cutover satisfait n’est revendiqué.

## Action et contrôle prévus

Désactiver chaque workflow nommé ci-dessus dans GitHub Actions ; vérifier ensuite son état disabled_manually via l’API et vérifier que les 65 autres états restent inchangés. Conserver les fichiers Git, les anciens runs et les archives. Réactivation possible avec Enable workflow. Aucun nouveau test modèle, aucune relance de campagne, aucun changement des sources des workflows ou du code produit.

## Blocage effectif

La confirmation de désactivation de PRE-4 Claude availability diagnostic a été refusée par automatic approval review : absence d’autorisation utilisateur jugée assez spécifique pour ce diagnostic. La boîte de confirmation a ensuite été annulée. Aucun autre essai de désactivation n’a été tenté, aucun contournement.

## Limites

L’absence de référence est établie pour les noms exacts des fichiers et les appels YAML/cascades workflow_run des sources de main, pas pour des systèmes externes ni tous les noms reconstruits dynamiquement. Cette désactivation ne prouve pas la résolution des interruptions ChatGPT. La suppression physique des fichiers est différée afin de conserver les blobs et contrôles historiques.
