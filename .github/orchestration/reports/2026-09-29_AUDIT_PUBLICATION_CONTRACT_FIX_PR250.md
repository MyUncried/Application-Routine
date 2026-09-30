# Correction du contrat de publication de l’audit indépendant — PR #250

## Mission et contexte autorisé

Objectif : diagnostiquer précisément puis corriger le contrat de publication, sans corriger les autres findings de l’audit ni relancer PRE-1.

Dépôt : MyUncried/Application-Routine. Branche : protocol/next-evolution-r1-r3-r4-continuity-20260928. Commit de départ vérifié : 0a38972f4a880002a2ea93a562e5d1a1023f39d4. Écrivain : ChatGPT via le connecteur GitHub ; modification atomique sans force de la branche de #250. Aucun fichier applicatif modifié.

## Diagnostic démontré

- Le run 36620351797 a qualifié son HEAD, exécuté Claude, puis refusé le contrat de sortie avec INDEPENDENT_AUDIT_VERDICT_MISSING_OR_DUPLICATED. La publication était donc sautée ; la cause immédiate n’était pas une erreur HTTP.
- L’artefact 11058978939 contient le rapport complet. Son premier titre est exactement « ## VERDICT: REVISE ». Le validateur exigeait une ligne commençant littéralement par VERDICT. Cette différence de présentation suffit à reproduire l’échec sur le rapport réel.
- Après correction du parseur, le même rapport original est accepté sans retouche : verdict REVISE, 64 identités de matrice, 1 finding bloquant, 5 majeurs et 9 mineurs.
- Le workflow contenait également un fallback qui sortait en succès après l’échec des deux tentatives de publication ; il ne relisait pas le commentaire GitHub. Ce défaut est distinct de l’erreur de ce run.
- La mission imposait un auditeur strictement read-only, alors que CLAUDE.md et DELIVERY_REPORT_GATE exigent un rapport committé. Le seul dépôt en artefact/commentaire ne satisfaisait pas cette règle.

## Correction

Le validateur accepte une ligne VERDICT nue ou présentée en titre Markdown de niveau 1 à 6. Les doublons, la contradiction avec le JSON, les identités manquantes/dupliquées et les comptes incohérents restent refusés. REVISE reste publiable sans autoriser la clôture.

Le job auditeur conserve contents: read et ne dispose pas du writer documentaire. Le contrôle Git s’exécute avant le contrôle de sortie, même lorsqu’une sortie est invalide. Les fichiers temporaires sont nettoyés avant le préflight et les sorties brutes/erreurs sont conservées pour permettre le diagnostic.

Un job publish-evidence distinct archive le rapport sur evidence/kodjo-independent-audits, avec un chemin unique par run/tentative, puis relit le fichier au commit exact. Il publie un commentaire concis contenant le lien, le hash du commit, les identités du run/candidat et le verdict ; il exige l’identifiant du commentaire et relit son contenu. Une erreur HTTP ou de readback reste un échec. La branche auditée n’est pas déplacée par la publication.

La reprise du seul job de publication réutilise l’artefact et la tentative de l’audit d’origine. Une reprise identique ne réécrit ni le rapport ni le commentaire. Un conflit sur un chemin immuable est refusé. Le rapport peut être conservé pour un candidat supersédé, mais sa publication précise qu’il ne qualifie aucun HEAD ultérieur.

La mission et AI_ORCHESTRATION.md sont alignés sur cette allocation des responsabilités ; aucune exception à l’obligation de rapport versionné n’est introduite.

## Récupération du rapport déjà produit

Rapport original conservé sans correction du corps : .github/orchestration/reports/2026-09-29_INDEPENDENT_AUDIT_36620351797_1.md, sur evidence/kodjo-independent-audits.

Commit d’archive vérifié par relecture exacte : 7b3a39f4bd0425f5d148dcd94c92c7bd4fb305b2.

L’identifiant de session n’était pas présent dans l’artefact ; il est explicitement signalé indisponible, sans reconstruction. Aucun nouvel appel Claude n’a été demandé pour cette récupération.

## Vérifications et seconde passe

- 7 tests dédiés passent : présentation Markdown/CRLF, refus de doublons et incohérences, archive + publication + readback, reprise idempotente, HTTP 403 conservé comme échec, preuve altérée refusée, liaison run/HEAD et reprise du seul publisher.
- 3 tests existants du contrat d’audit sont rejoués isolément et passent : HEAD qualifié/read-only, matrice de 64 identités, refus des matrices incomplètes et des APPROVE non étayés.
- validate-workflows.js passe sur le seul workflow modifié ; parsing YAML également contrôlé.
- Le rapport réel de l’artefact passe le validateur corrigé : REVISE / matrix=64.
- Seconde passe ciblée : comparaison aux blobs du commit de départ ; contrôle des liens vers les chemins réellement présents, de la propagation mission/protocole et des gardes read-only/HEAD. Le publisher archive exclusivement sur sa branche de preuves ; aucun changement #252 ou #249.

La suite pilote complète et l’exécution du nouveau job avec le token GitHub Actions ne sont pas encore démontrées à cette livraison. Les tests du publisher simulent les réponses HTTP. La récupération documentaire réelle utilise le connecteur GitHub et sa relecture ; elle ne prouve pas à elle seule les permissions du token de workflow.

## Périmètre livré

- scripts/kodjo/verify-independent-protocol-audit.js
- scripts/kodjo/publish-independent-protocol-audit.js
- tests/kodjo/independent-audit-publication.pilot.js
- tests/kodjo/next-evolution-determinism.pilot.js : adaptation d’un oracle au job séparé
- .github/workflows/kodjo-v2-next-evolution-independent-audit.yml
- .github/orchestration/reports/2026-09-29_PROTOCOL_EVOLUTION_CLAUDE_AUDIT_MISSION.md
- .github/AI_ORCHESTRATION.md : propagation du contrat de livraison documentaire
- ce rapport de correction

## Limites et état final

Les autres findings du rapport ne sont pas corrigés par cette mission. #250 reste DRAFT et n’est pas déclarée qualifiée sur son nouveau HEAD. #252 et la chaîne causale PRE-1 / #249 restent inchangées.

Aucun test sur appareil n’est applicable au contrat de publication. La suite GitHub automatique éventuelle reste à observer. Aucun rerun manuel de l’audit ni de PRE-1 n’est requis pour restaurer ce rapport.

Le commit final contenant ce rapport et le résultat de la relecture GitHub sont communiqués dans le commentaire de livraison de #250 ; un rapport ne peut contenir son propre hash de commit. État Git distant : mise à jour fast-forward atomique, sans reset/rebase/force-push ; le checkout local partiel sert uniquement aux vérifications ciblées.
