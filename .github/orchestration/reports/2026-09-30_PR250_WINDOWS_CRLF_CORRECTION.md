# PR250 — correction causale Windows CRLF

## État vérifié et diagnostic

Branche `protocol/next-evolution-r1-r3-r4-continuity-20260928`, HEAD de départ `5432bde1b67240666a4abae2646430cebdae23cf` ; #250 OPEN/DRAFT. Ses 69 fichiers livrés ont été relus dans GitHub par hash blob, sans divergence. PR252 reste OPEN/DRAFT au HEAD c8902650d774d14c9565b90d1a5fc38d1fd6d42f ; PRE-1 reste issue #249, baseline e216294506bed87dd80855937e3fabfbfa322b82, plan 5874870872, revue 5878031654 REVISE, sans nouvelle publication causale.

Qualification 36644435229 : job Linux 109664037775 SUCCESS, 772 tests / 771 PASS / 0 FAIL / 1 SKIP. Job Windows 109664444070 FAILURE : 735 tests / 729 PASS / 2 FAIL / 4 SKIP. Les deux échecs sont des erreurs au chargement des suites independent-audit-publication et next-evolution-determinism : `INDEPENDENT_AUDIT_DEFERRALS_INVALID`.

Cause exacte introduite par le nouveau contrôle : la matrice Markdown checkoutée sur Windows contient CRLF. Le code fractionne sur LF puis compare la fin de ligne à `| priorité |`, sans retirer CR. Les priorités correctes sont ainsi refusées. La reproduction locale sur la copie réelle du validator avec matrice CRLF sort en 1 avec le même diagnostic. L'absence d'artefact de préflight est une conséquence de l'arrêt en amont, pas la cause.

Audit 36644435178 : FAILURE dans await_qualified_head, car la qualification exacte a échoué ; le reviewer Claude n'a pas été appelé. Cet échec n'est pas un nouveau verdict indépendant ni une erreur de publication.

## Correction et effets de bord

Normalisation CRLF/LF de la matrice source avant comparaison de priorité. Les checks de priorité, IDs et doublons restent obligatoires. Le test utilise le module réel copié dans une fixture avec sa matrice et son manifeste : LF et CRLF acceptés ; changer P-16 de P1 à P2 reste refusé.

Même contrôle des fins de ligne sur la nouvelle preuve de symbole : le fichier Git LF et son checkout CRLF doivent prouver la même déclaration. Normalisation compatible Git avant comparaison, sans accepter une modification réelle du code. Test positif CRLF + voisin modifié ; test négatif CRLF + déclaration modifiée. La limite de preuve est propagée dans la spécification.

Les paths de l'audit incluent désormais le validator et sa suite dédiée, qui sont des inputs directs de son contrat. Un nouveau HEAD corrigé déclenchera une qualification et un audit automatiquement ; aucun ancien run n'est relancé à l'identique. Les gates exacts Linux + Windows et le routeur de commentaires restent inchangés.

## Validation

14 tests dédiés PASS ; reproduction avant correction FAIL avec le diagnostic exact. Suite complète locale après correction : 774 tests / 766 PASS / 2 FAIL liés au baseline historique absent localement / 6 SKIP. Les deux mêmes échecs locaux existent au HEAD original ; les mêmes contrôles ont passé sur GitHub Linux avec l'historique complet. Aucun test n'est désactivé. Syntaxe YAML indépendante (64 workflows), scanner de writers et invariants de workflow PASS. Contrôle diff whitespace PASS.

Windows natif, qualification finale et audit indépendant sur le nouveau HEAD restent requis. Aucune conformité n'est annoncée. Aucun device check n'est revendiqué. Rapport et correction livrés ensemble ; SHA définitif = commit contenant ce fichier, à vérifier par lecture GitHub après publication.

## Fichiers modifiés

- scripts/kodjo/verify-independent-protocol-audit.js
- scripts/kodjo/lib/boundary-proof.js
- tests/kodjo/independent-audit-regressions.pilot.js
- .github/workflows/kodjo-v2-next-evolution-independent-audit.yml
- .github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.51.md
- .github/orchestration/reports/2026-09-30_PR250_WINDOWS_CRLF_CORRECTION.md
