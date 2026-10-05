# VNext Figma — tâche 2, qualification et parcours initial isolé

## Mission et point de départ

Reprise autorisée le 5 octobre 2026 après suspension, sur `d5d14c1cb6a9f490a03e35a8047f83ed064dbbed`, PR #269, branche `protocol/vnext-proof-stability-20260930`, campagne existante `628b3349-88b4-4bf1-be6b-50bc09e7d245` / `VNEXT-12-QUALIF`. Répertoire local : `/workspace/scratch/2190f7a471f1/vnext`.

Instruction : terminer la qualification et le parcours initial isolé, préserver les preuves et le bilan. Aucune tâche 3, reprise après validation utilisateur, revue indépendante de clôture, activation V2, PRE-2 ou PRE-3. La correction bornée prévue par le pilote est une injection technique déclarée ; elle ne vaut pas reprise après recette utilisateur.

## État de reprise observé

HEAD local et distant identiques ; aucun changement non committé au début de la reprise. Les trois workflows déclenchés par le commit précédent sont réutilisés, sans relance : `37293649217` (qualification VNext), `37293649180` (qualification du pilote), `37293649182` (tests de régression historiques). Requête initialement `QUALIFY_ONLY` ; jobs Claude INITIAL/REVISION ignorés. Ancienne file V2 `34748621746` laissée intacte.

## Preuves locales réutilisées

Commande déjà terminée : `node --test tests/kodjo/vnext-*.pilot.js tests/kodjo/ui-implementation-review.pilot.js` : 321 tests, 321 PASS, 0 FAIL, 0 SKIP. Journal conservé dans `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/local-tests.log.gz` (compression sans perte ; empreinte des octets décompressés), SHA-256 `3898db1e35498f34b456780e4074727c2c0beabefda3eb47517104af33a54467`. Le workflow VNext exclut les 16 tests du reviewer historique : 305 tests dans cette commande CI.

## Limites de preuve et périmètre

Le pilote rejoue le paquet Figma figé dans Git. Il conserve 222 éléments, 50 variables et quatre ressources de contexte, mais qualifie seulement trois propriétés (largeur, hauteur, titre) et deux scénarios de bascule dans une fixture JavaScript isolée. Les faits JSON exécutés ne certifient ni les pixels natifs ni une livraison applicative, et ne démontrent pas l'accès authentifié Figma du runner ou une acquisition fraîche. L'utilisation sémantique des ressources exige des preuves effectives et ne découle pas de leurs empreintes.

## Résultat

QUALIFICATION RÉUSSIE — les cinq jobs exigés par `vnext-github-qualification.verifyQualification` sont SUCCESS sur le candidat exact, run `37293649217`. Le pilote Ubuntu/Windows, run `37293649180`, est SUCCESS. Le préflight local, run `37293649182`, est SUCCESS : 1 072 tests, 1 068 PASS, 0 FAIL, 4 SKIP ; réserve historique séparée : ancien artefact `kodjo-v2-recovery-34606534268-1` indisponible, sans relance.

Les artefacts historiques Linux/Windows ont été téléchargés et leurs empreintes d'archive comparées aux digests GitHub. Le guard de publication a vérifié HEAD/checkpoint et parcouru les deux pages de workflows de la branche (168 résultats), sans opération active.

La requête `FIGMA_INITIAL` unique `1c9be701-2e24-43f7-bd24-2030d1d3c6c1` référence ce candidat qualifié. Les changements de cette publication portent uniquement sur la requête et les preuves/checkpoints ; le fingerprint du code protocolaire doit rester identique au candidat qualifié. La publication déclenche le job réel dédié et les CI automatiques existantes ; elle ne dispatch pas V2 et ne sélectionne ni PRE-2/PRE-3 ni les reprises après validation.

EN ATTENTE DU RÉSULTAT RÉEL — le résultat final, les sessions, les réserves, les fichiers modifiés et l'état Git seront renseignés après collecte des preuves effectives.

## Premier lancement — refus technique avant entrée du pilote

Publication de la demande : `06dda327a1684a989de35086b5df51b7f01703bf` (arbre exact validé `46b159425a01d26301b28ba33c8125be4ceb6bdc`). Run `37300068654`, job `111730479414`, runner `KODJO-LOCAL-RUNNER`. Le shell `bash` ne figure pas dans le PATH du runner ; GitHub échoue avant d'exécuter Node avec `bash: command not found`. Aucune session Claude, claim persistant, modification de fixture ou livraison. Aucun artefact n'a été produit ; le diagnostic est conservé depuis les logs GitHub dans `task2/initial-shell-failure.json`.

Correction minimale : le seul step de lancement FIGMA_INITIAL utilise maintenant `cmd` et `%RUNNER_TEMP%`, déjà utilisés par les opérations Windows existantes. Le hash déclaré du producteur VNext est recalculé ; les capacités et writers legacy gelés restent inchangés. La requête repasse à QUALIFY_ONLY avant nouvelle qualification du workflow. L'identifiant logique non consommé est conservé ; aucun rerun ni relancement à l'identique de l'appel échoué n'a été effectué. Les contrôles automatiques accompagnant la demande précédente doivent finir avant publication du correctif.

## Incident de qualification automatique et correction du test négatif

Le run automatique `37300068646`, job `111730424464`, a échoué dans la préparation du test VNext « unavailable approved plan stops without falling back to the readable old plan » : ENOENT en ouvrant directement le chemin d'objet loose du commit approuvé. Le code protocolaire du commit de demande était identique au candidat qualifié.

Reproduction contrôlée : `git repack -ad` dans une fixture retire le fichier loose, tandis que `git cat-file -e <head>^{commit}` réussit. Le défaut démontré est donc l'hypothèse de stockage loose du test. L'acteur ayant empaqueté l'objet en CI n'est pas observable dans les logs récupérés ; aucune attribution certaine au GC automatique n'est revendiquée.

Correction VNext uniquement : le test fournit désormais un magasin Git empaqueté contenant l'ascendance de l'ancienne livraison, vérifie que l'ancien plan est lisible et le commit approuvé réellement absent, exige encore `APPROVED_FILE_UNAVAILABLE`, puis restaure l'environnement Git. Aucun gate de production n'est changé. Test ciblé : 7 PASS, 0 FAIL, 0 SKIP. Contrôles shell/publication/writers : 11 PASS, 0 FAIL, 0 SKIP ; 64 YAML valides et invariants exécutables PASS. Les journaux sont conservés sans perte en gzip.

Vérification finale locale après les deux corrections : **321 tests, 321 PASS, 0 FAIL, 0 SKIP**. Les octets du journal sont conservés sans perte dans `task2/corrected-local-tests.log.gz`, avec leur empreinte dans `task2/shell-correction-local-checks.json`. Cette preuve ne qualifie pas l'exécution du shell cmd sur le runner et ne vaut pas session Claude réelle. Publication et qualification distante de ce correctif encore attendues.

## Vérification complémentaire CRLF du test corrigé

Le contrôle local avec `core.autocrlf=true` a révélé une erreur dans la nouvelle assertion du test : elle comparait le fichier de checkout CRLF au blob Git LF. L'assertion compare maintenant le résultat Git original au résultat Git dans le magasin isolé, avec égalité exacte et sans normalisation. Le refus `APPROVED_FILE_UNAVAILABLE` reste exigé ; aucune validation de production ni empreinte attendue n'est modifiée. Résultat : 7 PASS sous autocrlf=true, et suite complète finale 321 PASS, 0 FAIL, 0 SKIP. Journaux CRLF avant/après et journal final conservés en gzip, avec empreinte du journal final.

Le commit publié `621263540738675ef4ab1726c5d490d420d7315e` qualifie le shell cmd et le premier correctif du magasin Git ; cette dernière assertion portable constitue un delta de test encore local, à qualifier avant déclaration de qualification finale. Aucun appel Claude réel ni parcours initial réussi n'est revendiqué.
