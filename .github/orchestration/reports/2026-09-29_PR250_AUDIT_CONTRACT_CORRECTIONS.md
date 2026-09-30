# PR250 — corrections du contrat et du contre-audit indépendant

## État de départ vérifié sur GitHub

Branche `protocol/next-evolution-r1-r3-r4-continuity-20260928`, HEAD `8247c3160aab6a9a9ac4f1ed176614f615b79039`, OPEN/DRAFT. Dernière qualification : run 36633808643 SUCCESS. Audit publié : run 36633808747 SUCCESS, **verdict REVISE**, commentaire 5900155269, rapport Git 281a06de994ed9fa582a3f54d15f8c2ed4141b39. Le succès de publication ne valait pas approbation.

Main vérifié : `5ea680c53b6ff035c1afa126273c80c64e1e7eed`, incluant le routeur #258. PR252 : OPEN/DRAFT, HEAD `c8902650d774d14c9565b90d1a5fc38d1fd6d42f`. PRE-1 reste issue #249, baseline produit `e216294506bed87dd80855937e3fabfbfa322b82`, plan causal 5874870872, revue causale 5878031654 REVISE. Aucune mutation de #252 ni de cette chaîne.

## Périmètre et diagnostic

Le défaut principal permettait un fichier mutable non-UI sans exigence contractuelle et donc sans ligne de revue opposable. Reproduction au HEAD original : scope UI + database, zéro exigence non-UI, contrat accepté. Deuxième reproduction : REVISE moderne sans findings structurés, accepté comme LEGACY_UNBOUNDED. Les 31 tests de déterminisme originaux passaient malgré ces deux défauts.

Le contrat de publication actuellement exécuté conserve déjà le rapport validé dans Git avec un writer isolé et accepte les headings Markdown de verdict. Sa publication était prouvée au dernier run ; une nouvelle relance identique n'aurait corrigé aucun défaut de fond.

## Traitement des findings

| Finding | Modification ou preuve |
| --- | --- |
| F-01 blocking | Couverture inverse : chaque scope non-test doit être lié à une exigence. Revue mixte UI/non-UI préparée avec le nombre exact de lignes non-UI. |
| F-02 major | La politique est appelée dans verify-visual-checkpoint, sur le chemin réel admission/préflight, après les champs exacts du checkpoint et la preuve de conservation des blobs protégés. Une preuve vide ne suffit plus. Les autorisations restent obligatoires et comparent le scope de la demande au plan approuvé. |
| F-03 major | Même flag component proof à la revue et au rejeu final. Rejeu dans un worktree temporaire au HEAD applicatif exact, avec le validateur du checkout protocolaire. Cas négatif : EXTEND sans composant modifié passe sans flag mais retourne REVISE avec le flag. |
| F-04 major | REVISE moderne sans findings structurés refusé. Compatibilité historique explicitement bornée au legacy, statut consommé par le workflow, publié et archivé. |
| F-05 major | Nouveaux plans ui-criteria.v3 : locators PATH/SYMBOL/SEMANTIC explicites, source HEAD vérifié, types d'invariants fermés, justification sémantique distincte. Déclaration de fonction intacte PASS même avec voisin modifié ; déclaration modifiée FAIL ; syntaxe inconnue NON_VERIFIABLE. |
| F-06 major | Manifeste normatif versionné ; exclusion native des rapports non normatifs puis réinclusion des rapports réellement consommés. Tests sur les paths YAML effectifs. |
| F-07 minor | Non reproduit : le fichier exact du HEAD 8247c316 portait déjà la hiérarchie 0.6.51/0.6.47. Test de cohérence ajouté, sans prétendre avoir corrigé une phrase absente. |
| F-08 minor | IDs du rapport descriptif préfixés A-P / A-D ; espace canonique de la matrice inchangé. |
| F-09 minor | audit-deferrals.json explicite les cinq décisions, conserve les priorités originales (P-16 reste P1), valide les IDs/priorités contre la matrice et refuse les doublons. Aucune dispense générale par priorité. |
| F-10 minor | Helpers d'identité partagés ; chaque verifier v3 refuse les IDs arbitraires et assertions dont l'identité ne correspond plus au contenu. Identités historiques v1/v2 conservées. |
| F-11 minor | Génération finale impossible sans scan.candidates ; fallback libre supprimé. |
| F-12 minor | Manifeste inclut continuité, registre d'incidents, change report, package et sources normatives ; filtres natifs couvrent aussi les fichiers normatifs hors orchestration et tous les workers slice. |
| F-13 minor | Token de l'auditor limité en lecture ; issues:write reste exclusivement dans le publisher. |
| F-14 minor | Justification explicite obligatoire sans test pour les nouveaux plans v3 ; NO_AUTOMATED_TEST propagé dans test contract et entrée de revue. |
| F-15 minor | Classification une seule fois, sortie needs.classify réutilisée. |

## Effets de bord contrôlés

Intégration des fichiers de #258 par fusion à trois voies, résolution ciblée de quatre conflits de triggers, conservation des workflow_dispatch déjà présents dans #250. Unique abonné natif issue_comment, 32 workers workflow_call, gates/permissions exacts synchronisés avec comment-routes.json. La nouvelle permission du finalize est une délégation fermée vers le worker existant, pas un writer arbitraire. Aucun commentaire ordinaire n'exécute de worker de production. Le scanner accepte le routeur réel et refuse ses mutants.

Les deux nouvelles dépendances du reviewer sont figées avant le checkout applicatif. Le test effectif du reviewer figé, avec un ancien validator dans l'application, passe. Contrôles YAML indépendants et scanner de writers passent. Aucun changement de code produit.

## Validation locale et limites

Suite complète du lot : **772 tests, 764 PASS, 2 FAIL locaux identifiés, 6 SKIP**. Les deux échecs relisent le baseline historique `63a3c26ed492f7c0925cfb57419f3dc2dcc5e476`, absent de l'historique de cette copie locale matérialisée par API. Comparaison avec le HEAD original dans le même environnement : 756 tests, 748 PASS, les mêmes 2 FAIL, 6 SKIP. Aucun test ni contrôle CI n'est neutralisé pour ces cas ; GitHub doit disposer de l'historique complet.

12 tests dédiés de régression de l'audit passent. Les cas historiques v1/v2, génération structurée, reviewer, publication, routeur, contrôle final et syntaxe ont été inclus dans la suite. Native PowerShell / Windows et les preuves qui l'exigent restent à qualifier sur GitHub. Aucune vérification device n'est revendiquée.

La preuve SYMBOL est volontairement limitée à une déclaration de fonction unique au niveau supérieur, à syntaxe prise en charge, conservée octet pour octet. Elle ne prouve pas la sémantique des dépendances externes. Les limites sémantiques restent des jugements de revue. L'audit indépendant devra évaluer ces limites explicitement.

## Livraison et prochain état

Ce rapport est livré dans le même commit que les corrections ; le SHA définitif est celui du commit contenant ce fichier, contrôlé par lecture GitHub après publication. Un seul déplacement du HEAD candidat, avec parent 8247c316 et second parent main 5ea680c5. Qualification Linux/Windows et audit indépendant sur ce nouveau HEAD requis. **État au moment du commit : corrections vérifiées localement, qualification GitHub et verdict indépendant en attente.** Ne pas fusionner, qualifier PRE-1 ou annoncer conformité avant ces preuves exactes. Aucun run rouge précédent n'est relancé arbitrairement.

## Fichiers du lot

- `.github/AI_ORCHESTRATION.md`
- `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.51.md`
- `.github/orchestration/audit-deferrals.json`
- `.github/orchestration/comment-routes.json`
- `.github/orchestration/normative-inputs.json`
- `.github/orchestration/reports/2026-09-29_COMMENT_WORKFLOW_FANOUT_FIX.md`
- `.github/orchestration/reports/2026-09-29_PR250_AUDIT_CONTRACT_CORRECTIONS.md`
- `.github/orchestration/reports/2026-09-29_PROTOCOL_DETERMINISM_AUDIT.md`
- `.github/workflows/kodjo-e2e-orchestration-test-v1-3.yml`
- `.github/workflows/kodjo-e2e-t1-t6-v1-3.yml`
- `.github/workflows/kodjo-event-router-v1-3.yml`
- `.github/workflows/kodjo-routine-dev-environment-sync.yml`
- `.github/workflows/kodjo-slice-finalize.yml`
- `.github/workflows/kodjo-slice-implementation-publication-recovery.yml`
- `.github/workflows/kodjo-slice-implementation-review.yml`
- `.github/workflows/kodjo-slice-implementation.yml`
- `.github/workflows/kodjo-slice-plan-review.yml`
- `.github/workflows/kodjo-slice-plan.yml`
- `.github/workflows/kodjo-slice-recover.yml`
- `.github/workflows/kodjo-t8-work-arbitration.yml`
- `.github/workflows/kodjo-v1-3-integrated-t1-t9.yml`
- `.github/workflows/kodjo-v14-s09-dev.yml`
- `.github/workflows/kodjo-v14-s09-finalize.yml`
- `.github/workflows/kodjo-v14-s09-implementation-local.yml`
- `.github/workflows/kodjo-v14-s09-plan-local.yml`
- `.github/workflows/kodjo-v14-s09-plan-review-independent.yml`
- `.github/workflows/kodjo-v14-s09-protocol-audit.yml`
- `.github/workflows/kodjo-v14-s09-recover-worktree.yml`
- `.github/workflows/kodjo-v14-s09-review.yml`
- `.github/workflows/kodjo-v14-s09-validate-integration.yml`
- `.github/workflows/kodjo-v2-comment-router.yml`
- `.github/workflows/kodjo-v2-next-evolution-independent-audit.yml`
- `.github/workflows/kodjo-v2-pilot-tests.yml`
- `.github/workflows/kodjo-v2-plan-handoff-materialize.yml`
- `.github/workflows/kodjo-v2-plan-handoff-queue.yml`
- `.github/workflows/kodjo-v2-review-existing-delivery-bridge.yml`
- `.github/workflows/kodjo-v2-slice-initial-plan-review.yml`
- `.github/workflows/kodjo-v2-slice-initial-plan.yml`
- `.github/workflows/kodjo-v2-slice-minor-plan-clarification.yml`
- `.github/workflows/kodjo-v2-slice-plan-review.yml`
- `.github/workflows/kodjo-v2-slice-plan.yml`
- `.github/workflows/kodjo-v2-targeted-requalification.yml`
- `.github/workflows/t01-s09-implementation-v1-3-temporary.yml`
- `.github/workflows/t01-s09-plan-revision-v1-3-temporary.yml`
- `scripts/kodjo/classify-protocol-impact.js`
- `scripts/kodjo/generate-ui-plan-contract.js`
- `scripts/kodjo/lib/boundary-proof.js`
- `scripts/kodjo/lib/implementation-contract.js`
- `scripts/kodjo/lib/requirement-contract.js`
- `scripts/kodjo/lib/ui-criteria-contract.js`
- `scripts/kodjo/lib/ui-identities.js`
- `scripts/kodjo/resolve-review-run-environment-sync.js`
- `scripts/kodjo/scan-remote-write-capability.js`
- `scripts/kodjo/verify-bounded-plan-revision.js`
- `scripts/kodjo/verify-independent-protocol-audit.js`
- `scripts/kodjo/verify-plan-contract-consistency.js`
- `scripts/kodjo/verify-ui-implementation-review.js`
- `scripts/kodjo/verify-ui-plan-criteria.js`
- `scripts/kodjo/verify-visual-checkpoint.js`
- `tests/kodjo/audit-report-consumption.pilot.js`
- `tests/kodjo/comment-router.pilot.js`
- `tests/kodjo/incident-register.pilot.js`
- `tests/kodjo/independent-audit-regressions.pilot.js`
- `tests/kodjo/next-evolution-determinism.pilot.js`
- `tests/kodjo/plan-impact.pilot.js`
- `tests/kodjo/ui-e2e-finalization.pilot.js`
- `tests/kodjo/ui-implementation-review.pilot.js`
- `tests/kodjo/ui-plan-generation.pilot.js`
- `tests/kodjo/visual-correction.pilot.js`
