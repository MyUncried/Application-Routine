# VNext — consolidation des corrections de l'audit Claude v8

Date : 2026-10-03. PR #269, branche `protocol/vnext-proof-stability-20260930`.
Parent exact : `952b23b3c0bbe258edb93a155abde5c58a5795e0`.
Audit de référence : v8 FINAL, commit audité `c0f72fc2148a5955b9a810a8aca1f6eeefa64870`.

## Résultat et portée

Les défauts démontrés restants sont regroupés dans un seul candidat, stage
`QUALIFY_ONLY`, génération 33. Les tests locaux de protocole passent : 977 tests,
972 PASS, 0 FAIL, 5 SKIP après corrections et récupération des sources historiques. Un contrôle ciblé supplémentaire couvre le passage de
lint sans cache après cette suite. Les SKIP locaux ne sont pas des PASS.
Le parser indépendant accepte les 64 workflows et leurs invariants exécutables.
Aucun nouveau cycle Claude INITIAL/REVISION n'est revendiqué pour ce candidat.
La qualification réelle du tree exact sur Linux/Windows, puis de nouvelles
exécutions jetables autorisées, restent nécessaires.

Ce travail ne lance ni FINAL, ni activation, ni cutover, ni fusion, ni changement
applicatif. Les garde-fous déjà livrés D10/D13/D14 sont conservés. Les observations
et suggestions non démontrées de l'audit ne deviennent pas artificiellement des
incidents clôturés. Le code sur cette branche n'est pas déclaré actif depuis main.

## Corrections, lieux et preuves

| Audit | Correction dans le candidat | Vérification locale principale / limite |
|---|---|---|
| D1 | `lib/device-proof-policy.js`, `verify-ui-implementation-review.js`, `verify-v2-finalization.js` : même règle PENDING_DEVICE pour VISUAL_COMPARE, DEVICE_CHECK, ACCESSIBILITY_CHECK ; accessibility différée seule ouvre le gate appareil | `ui-e2e-finalization.pilot.js` : vrais CLI revue puis finalisation ; refus sans validation exacte, sur écart technique, preservation/frontière et plan vide. Aucun résultat appareil inventé |
| D2 | `verify-source-comment.js`, workflow `kodjo-slice-finalize.yml` : ID, auteur bot, dépôt et issue exacts pour revue et implémentation ; contrôle d'issue aussi dans `kodjo-slice-plan-review.yml` | `vnext-v8-consolidation.pilot.js` : mauvais auteur, dépôt, issue et ID refusés par le vérificateur effectivement appelé |
| D3 | Reprise ciblée des finalisateurs, revue commune, contrats et dépendances depuis main `67064d1b3752d71683d11638a602286b9c895482` ; dérogation SQLite PRE-1 exacte importée | Test de dérogation versionnée NOT_EXECUTED et test de conservation après validation visuelle. **Pas un réalignement global de branche** ; la divergence reste bloquante avant promotion |
| D4 | `vnext-historical-equivalence.js`, `verify-vnext-platform-coverage.js`, workflow proof stability et admission GitHub : chaque assertion mappée doit passer sur au moins un OS du même candidat | Deux SKIP, candidats distincts, couverture manquante refusés. Nouveau job agrégateur obligatoire ; les 420 sujets restent non certifiés opérationnellement |
| D5 | `prepare-vnext12-revision.js`, workflow disposable : reprise du reçu de base depuis un artefact de la même exécution/HEAD, validation du contrat exact avant continuation | `vnext12-revision-supervisor.pilot.js` : reçu conservé réutilisé sans rappeler la revue de base, reçu/candidat altéré refusé. Ne rejoue aucune demande consommée |
| D6 | `revision-contract.js`, préparation, runtime : planning suivant lié au hash du patch ; chaque cible corrigée change ; ledger dérivé des résolutions observées du reçu indépendant | Patch non lié, correction absente, résolution OPEN refusés ; une seule correction causale. Les fixtures de revue sont explicitement UNIT_TEST_ONLY |
| D7 | `review-contract.js`, `vnext-live-chain.js` : schémas v2 avec `reviewed_target_ids` exacts et `finding_resolutions` justifiés | Omission, doublon, cible supplémentaire, résolution non causale/OPEN refusés. Le prompt demande une couverture effectivement réalisée ; la structure ne garantit pas à elle seule la qualité intellectuelle de la revue |
| D8 | `vnext-legacy-queue-adapter.js`, `requirement-contract.js`, revue/finalisation communes : exigences non UI et contrats de tests/frontières transportés ; assertions UI atomiques et composant path/export conservés | Projection canonique → CLI revue commune → CLI finalisation ; écart technique et exigences absentes refusés. Binding UI structuré testé. **Pas encore de preuve de livraison/appareil/finalisation réelle issue de VNext** |
| D9 | `vnext-remote-write-security.js` : verbes REST explicites avec chemins concaténés et appels répartis ; Git avec options `-c` | Cas négatifs réels de scanner, politique exacte conservée. Scanner statique conservateur, pas une analyse exhaustive de tous les programmes possibles |
| D10 | Déjà livré : contrôle du dépôt d'origine des PR avant runner self-hosted | Première tranche conservée ; réglages externes du dépôt non attestés par ce correctif |
| D11 | `git-runtime-integrity.js`, `run-local-claude.js`, `kodjo-git-read.js`, `run-queued-request.ps1` : hooks/fsmonitor neutralisés ; config/hooks/fichiers ignorés empreintés ; refus avant paquet Git/publication en cas de mutation ; authentification limitée à la commande réseau ; lint sans cache local | Empreinte et vrai hook Git testés ; gardes de publication/ordre contrôlées. Ne prétend pas isoler entièrement l'OS, les processus externes ou tous les canaux d'une exécution arbitraire |
| D12 | `plan-impact.js` : DELETE, imports .json, index JSON, alias assets et src actuels de tsconfig ; empreinte inclut assets/tsconfig | Suppressions/imports JSON/assets testés. Une nouvelle convention d'alias exige une résolution explicite ; aucune interprétation libre ajoutée |
| D13 | Déjà livré : quatre workflows de test historiques restreints au propriétaire | Première tranche conservée ; pas de supposition sur les gardes internes de claude-code-action |
| D14 | Déjà livré : auteur contrôlé sur le chemin REVISION historique self-hosted | Première tranche conservée |
| D15 | `execution-lock.js` : sérialisation exclusive des transitions acquire/remplacement périmé/release | Race multiprocess : un seul propriétaire ; transition abandonnée refusée, pas de récupération silencieuse |
| D16 | `scan-remote-write-capability.js` : commentaire kodjo-allow-mention sans effet d'autorisation ; politique VNext exacte et garde shell indépendante conservées | `git push` avec marqueur refusé ; shell:true non déclaré refusé ; exception fixe checks uniquement |
| D17 | Préflight : retrait du champ déclaratif PF-023 à PF-028 sans preuve ; vrais contrôles de fraîcheur inchangés | Producteur ne revendique plus ces six identifiants. Aucune suppression d'Assert-LiveTarget, admission fraîche ou consommation atomique |
| D18 | Préflight et reprise : seul statut explicite INTACT accepté | REFS_MUTATED, PROMPT_MUTATED, statut absent/inconnu refusés avant restauration ; garde préflight alignée |

## Qualification et publication du candidat

Une seule mise à jour de la branche regroupe les corrections et déclenche les
workflows pilotes, proof stability et drivers. Le workflow proof stability exige
les deux qualifications OS, les deux historiques OS et le job de couverture
interplateforme. L'admission ne se contente ni d'un SUCCESS global ni d'une liste
de jobs déclarée : elle relit les cinq conclusions exactes dans GitHub.

Windows PowerShell 5.1 n'est pas disponible dans le workspace Linux. Le candidat
ne porte aucune autorité EXECUTE : `QUALIFY_ONLY`, PRE-1 false, FINAL false,
revision_limit 1. Le job Windows réutilise le validateur strict existant
`vnext-publication.validateTree` sur le tree exact comparé à son parent. Il doit
réussir avant toute nouvelle préparation/admission d'exécution. Ce dépôt de
qualification n'est pas présenté comme une validation native déjà acquise.

Les blobs modifiés et le tree doivent être vérifiés contre les empreintes Git
locales ; le HEAD parent et l'empreinte du checkpoint sont relus avant une mise
à jour non forcée. Les OID des seuls producteurs figés modifiés sont actualisés.
Les seules empreintes/positions de tests historiques correspondantes changent ;
les 420 sujets, protections et réserves ne changent pas.

## Alignement ciblé et réserves

Le main observé pour la reprise est `67064d1b3752d71683d11638a602286b9c895482`.
La base commune est `6ba8262cc7f3ae0b1217bb7449d81649759b873b` ; main est alors
289 commits en avance et 167 en retard sur cette branche. La reprise des contrats
communs n'efface pas cette divergence. Un réalignement contrôlé et une revue du
candidat de promotion demeurent nécessaires avant toute fusion/activation.
Aucun autre changement applicatif de main n'est importé dans cette campagne.

La revue commune conserve ses gates techniques et les garde-fous VNext antérieurs
(verdict incohérent refusé, rapport malformed refusé, checks non vides). Son schéma
UI v1 reste le défaut du producteur historique ; les projections structurées UI v2
et v3 sont explicites. Les reprises de code main ne sont pas des remplacements
aveugles de ces protections.

La dérogation PRE-1 pour REQ-B89A1B7A4F23FA8B est copiée exactement depuis main.
Elle demeure NOT_EXECUTED et non satisfaite par VISUAL_APPROVED. Le résultat de
finalisation conserve `pending_device_proofs`, `not_executed_proofs` et
`all_device_proofs_executed=false`. Le booléen de compatibilité
`device_evidence_satisfied` concerne le gate de validation utilisateur exacte,
pas l'exécution de chaque preuve. Aucun contrôle SQLite réel n'est revendiqué.

Récupération historique legacy : NON_CERTIFIED reste une réserve. Les 420 sujets
historiques ne sont pas reclassés CONFORME. Les zones non lues intégralement par
Claude, les réglages du dépôt et les preuves réelles manquantes restent des limites.
Le raccordement FINAL et cutover n'est pas activé par cette consolidation.

## Preuves antérieures conservées

L'INITIAL réel de la première tranche reste PASS : run `37115247745`, session
`23570c25-875b-4158-8d87-5f075cb8056a`, artefact `11270759916`, SHA256
`53b4be48f0f93b3f62fa4ed742b7cf93b17faf12ee5c48c7723b17a5877cbe03`.
La demande `7c4b54fd-b0db-45bd-abf3-73c5a3761840` est consommée et ne sera jamais
rejouée. Les précédentes demandes consommées le restent également. Cette preuve
ne qualifie pas rétroactivement le nouveau candidat consolidé. Après qualification,
INITIAL et REVISION devront utiliser de nouveaux dossiers/UUID et les vrais gates
GitHub exacts, en conservant la distinction délégation technique/revue humaine.

## Première qualification réelle et correction ciblée

Candidat publié `e26105b15ae049de68349d2bf2a18638cc109cea`, tree
`e94c6e050e11d20123b7d476580945064947acfa` : runs pilotes `37124235652`,
proof stability `37124235671`, drivers `37124235667`. Aucun EXECUTE lancé.
Deux causes sont établies par les vrais logs :

1. Job Windows `111206211230` : le parser 5.1 refuse une expression GitHub run_id
   dans une chaîne PowerShell doublement quotée, avant expansion GitHub.
   L'URL de reprise utilise désormais `$env:GITHUB_RUN_ID` ; le parser strict reste.
2. Job pilote Linux `111206210980` : un test rejoue une ancienne revue d'impact
   avec l'empreinte antérieure à D12. Le scanner courant la refuse correctement.
   Le test garde les documents historiques intacts et rejoue d'abord le résultat
   ancien avec le blob exact `6c69cae39422986233e053c12e9544bb5fab05df` du scanner
   de `952b23b3`. Il exige ensuite le refus de cette empreinte par le scanner
   courant et vérifie un scan/reçu UNIT_TEST_ONLY neufs sur le HEAD applicatif exact.
   Aucune conversion automatique d'une approbation réelle n'est ajoutée.

Les 41 tests de queue passent localement avec les deux commits historiques exacts
récupérés depuis GitHub. Un ancien plan doit être rescanné, revu et approuvé sous
le nouveau protocole ; ses preuves historiques ne sont pas réécrites. Les seules
empreintes/positions correspondantes de tests sont mises à jour.
La [trace durable des échecs](../vnext12/VNEXT-12-QUALIF/v8-consolidation/qualification-failures-e26105b1.json)
conserve jobs, motifs, extraits réels et correction. Le candidat corrigé doit être
qualifié à nouveau ; les succès partiels du premier ne suffisent pas à l'admission.

Les historiques Linux/Windows du premier candidat sont aussi FAIL : jobs
`111206211398` et `111206211332`, résolveur `VNEXT_EQ_EXECUTION_INCOMPLETE`.
Leurs assertions étaient redirigées vers un JSONL qui n'a pas été uploadé après
l'échec du résolveur ; la cause détaillée de ces jobs n'est donc pas attestée
comme identique à celle du pilote. Le workflow conserve désormais ce diagnostic
brut uniquement en cas d'échec ; les succès n'ajoutent pas cet artefact brut.
Les drivers Linux/Windows du premier candidat sont SUCCESS. Aucun runtime Claude
INITIAL/REVISION, aucune consommation nouvelle ; les trois runs sont terminés
avant publication de la correction, sans contrôleur concurrent observé.

La validation native de la correction compare tout le delta consolidé à
`952b23b3`, base enregistrée et ancêtre vérifié, et non seulement au candidat
qui a échoué. Toutes les unités nouvelles sont donc reparsées. Le scan distingue
`git merge-base` (lecture) de `git merge`/`rebase` (mutation), y compris avec `-c` :
26 tests ciblés scanner/publication passent après ce dernier ajustement.
Aucun writer nouveau ni exception d'autorisation n'est déclaré pour merge-base.

## Qualification réelle du candidat ac405656 — 3 octobre 2026

Les trois runs 37129238664, 37129238678 et 37129238655 sont SUCCESS. Suite complète Linux: 977 tests, 976 PASS, 0 FAIL, 1 SKIP; Windows: 977 tests, 973 PASS, 0 FAIL, 4 SKIP. Contrats et drivers: 211 PASS sur chaque OS. Le parser Windows PowerShell 5.1 du tree exact passe. La couverture croisée des 402 assertions mappées passe; les 420 sujets restent inchangés et la réserve opérationnelle NOT_CERTIFIED demeure. Préflight jetable: Jest 1257/1257, TypeScript/lint PASS, cleanup PASS.

Les cinq artefacts ont été téléchargés, leur SHA256 vérifié et leurs ZIP de preuves archivés sous `v8-consolidation/qualification-ac405656/` avec le bilan détaillé `evidence.json`. La récupération historique absente reste NON_CERTIFIED. Aucun runtime Claude INITIAL/REVISION ne s’est exécuté sur ce candidat. La demande PREPARE_INITIAL génération 34 sollicite la vraie revue indépendante; aucune approbation ni consommation n’est créée par ce checkpoint.

## Préparation INITIAL indépendante approuvée

Run 37133206182, tentative 2, job 111243365597: SUCCESS, vraie session Claude 12ac3006-d166-4e99-9f90-ba24c12f6e70, APPROVE, zéro finding bloquant et une suggestion optionnelle conservée sur le typage/preuve explicite de keep.js. Le receipt est vérifié avec le vérificateur réel. La première tentative ETIMEDOUT est conservée; aucune correction de code entre les deux essais et aucune cause sous-jacente démontrée. Les deux ZIP téléchargés et hashés sont archivés avec evidence.json.

Le dossier généré est matérialisé sans modification sémantique. Transport neuf b605283d-13c0-4f1e-bde9-863538a6f86b, gate réel réservé issue_comment:5971337496. Aucune réaction/approbation revendiquée à ce stade. La demande QUALIFY_ONLY génération 35 qualifie le dossier exact avant demande d’approbation et exécution INITIAL. REVISION restera séquentielle. Aucun FINAL, promotion, fusion ou PRE-1.


## Exact INITIAL dossier qualification and delegated authorization

Candidate 16b70bab70fad2adc64b0ea7a0069cbc206eee17: runs 37139109519, 37139109523 and 37139109517 SUCCESS. Pilot Linux 977/976 PASS/0 FAIL/1 SKIP; Windows 977/973 PASS/0 FAIL/4 SKIP. VNext contracts and drivers 211/211 PASS on each OS. Historical mapped aggregation 402 cases PASS on at least one platform; operational readiness remains NOT_CERTIFIED_FOR_OPERATIONAL_VNEXT. Actual five artifacts downloaded, SHA256 verified and archived in .github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/qualification-16b70bab.

Gate issue_comment:5971337496 now contains the canonical exact candidate target a606e75fcb7a9bd07838c0479be0ffd939772df48e11aeb7453265aca57f5e21. Real owner reaction 431576097 observed, posted under CODEX_USER_DELEGATION_FOR_DISPOSABLE_TECHNICAL_TEST_ONLY; human_review_performed=false. Fresh request b605283d-13c0-4f1e-bde9-863538a6f86b retained. EXECUTE_INITIAL requested; INITIAL_PASS and REVISION_PASS are not claimed.


## Fresh consolidated INITIAL: real PASS

Run 37142131905 / job 111258778662, actual Claude session fd4b3395-6ce0-4eb5-b107-0b626bd7f618: INITIAL_PASS, IMPLEMENTED_AND_VERIFIED. value() observed 2; exactly core.js + core.test.js modified; keep.js SHA256 unchanged. Jest 1257/1257, TypeScript and lint PASS; Git runtime integrity INTACT with no changed metadata paths; disposable cleanup verified. Actual missing-authority and missing-review-proof probes refused before Claude. Artifact 11280864764 downloaded and SHA256 verified: 9e6da5a64ae50080acdd889ec9c0708dee67ea717ba725ee0c94e73b2f91d702. Exact archive and extracted evidence: .github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/initial-execution-37142131905.

Request b605283d-13c0-4f1e-bde9-863538a6f86b consumed atomically, remote tag e6d13d824b3194b511c99636b65f7ed9687d9181 observed: never replay. No application publication, PRE-1, FINAL or promotion. PREPARE_REVISION is the next authorized stage; REVISION_PASS is not claimed.
