# VNext Figma — tâche 2 : qualification vérifiée, parcours initial bloqué

## Résultat au point de récupération du 5 octobre 2026

**La tâche 2 reste inachevée.** Le code final est qualifié sur le commit publié `73787f296d78ab3c435fa04ef993f0ef8382141f`. Le parcours Claude initial isolé n'a pas été exécuté avec succès. La publication de sa demande est refusée par le verrou existant : `VNEXT_PUBLICATION_PHASE_ACTIVE`, car le préflight local `37307334786` / job `111755046302` reste en file d'attente, sans runner attribué. Le diagnostic est enregistré dans `task2/publication-block.json`.

Chantier existant : PR #269, branche `protocol/vnext-proof-stability-20260930`, campagne `628b3349-88b4-4bf1-be6b-50bc09e7d245` / `VNEXT-12-QUALIF`. Répertoire : `/workspace/scratch/2190f7a471f1/vnext`. Aucun rerun, duplication de requête ou campagne distincte. Aucune tâche 3, reprise après validation utilisateur, revue indépendante de clôture, activation V2, PRE-2 ou PRE-3.

## Qualification finale et preuves

Le validateur existant `vnext-github-qualification.verifyQualification` a retourné VERIFIED sur le candidat exact, run `37307334832`, tentative 1. Ses cinq jobs sont SUCCESS :

| Contrôle | Job |
| --- | --- |
| Qualification Ubuntu | 111754077752 |
| Qualification Windows | 111754077744 |
| Équivalence historique Ubuntu | 111754077443 |
| Équivalence historique Windows | 111754077598 |
| Couverture entre plateformes | 111763675753 |

Le driver Ubuntu/Windows est également SUCCESS, run `37307334666`, jobs `111754540847` et `111754540914`. Les jobs réels INITIAL/REVISION sont ignorés, conformément à la demande QUALIFY_ONLY.

| Vérification exécutée | Résultat |
| --- | --- |
| Suite locale finale VNext + reviewer UI historique | 321 PASS, 0 FAIL, 0 SKIP |
| Test négatif du plan, magasin Git isolé | 7 PASS |
| Même suite ciblée avec core.autocrlf=true | 7 PASS |
| Contrôles ciblés shell/publication/writers | 11 PASS |
| YAML et invariants de workflows | 64 YAML valides, invariants PASS |
| Qualification VNext Windows finale | 305 PASS, 0 FAIL, 0 SKIP |
| Équivalence historique Linux finale | 1 072 tests : 1 071 PASS, 0 FAIL, 1 SKIP |
| Équivalence historique Windows finale | 1 072 tests : 1 069 PASS, 0 FAIL, 3 SKIP |

Les deux rapports historiques couvrent 402 cas et 420 sujets ; leur readiness reste explicitement `NOT_CERTIFIED_FOR_OPERATIONAL_VNEXT`. Les archives téléchargées sont comparées aux digests GitHub avant extraction. Les octets des rapports et du journal Windows sont conservés sans perte en gzip.

Preuves sous `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/` : `final-qualification.json`, `final-local-tests.log.gz`, `final-windows-qualification.log.gz`, `final-historical-Linux.json.gz`, `final-historical-Windows.json.gz`, diagnostics précédents et blocage de publication. Les preuves des qualifications antérieures sont conservées et ne remplacent pas celles du candidat final.

## Lancement Windows précédent et correctifs démontrés

Le candidat initial `d5d14c1cb6a9f490a03e35a8047f83ed064dbbed` avait été qualifié par les runs `37293649217` et `37293649180`. Son ancien préflight local `37293649182` avait réussi : 1 072 tests, 1 068 PASS, 0 FAIL, 4 SKIP. L'absence de l'ancien artefact de recovery reste une réserve séparée ; aucune relance.

La demande initiale a été publiée dans `06dda327a1684a989de35086b5df51b7f01703bf`. Le job Windows `111730479414`, run `37300068654`, a bien démarré sur KODJO-LOCAL-RUNNER, puis échoué avec `bash: command not found` avant Node. Aucun claim de requête, appel Claude, livraison ou artefact de parcours. La cause est le shell bare bash absent du PATH du runner, et ne démontre pas l'absence de Claude local.

Correction : seul le step FIGMA_INITIAL passe à `cmd` et `%RUNNER_TEMP%`. Le hash du producteur VNext déclaré dans la policy est recalculé ; les capacités et writers legacy gelés sont inchangés. Cette commande cmd n'a pas encore été exercée dans un vrai parcours initial.

Un contrôle automatique de la demande précédente a également révélé une hypothèse erronée dans le test négatif du plan : il ouvrait directement le fichier loose du commit Git. Une reproduction `git repack -ad` rend ce chemin absent alors que le commit reste lisible. L'acteur ayant empaqueté l'objet en CI n'est pas vérifiable. Le test utilise désormais un magasin réellement isolé contenant l'ancienne livraison empaquetée, vérifie l'absence du commit approuvé et exige toujours `APPROVED_FILE_UNAVAILABLE`. Aucun gate de production n'est modifié.

Le contrôle CRLF a ensuite révélé une erreur dans ma nouvelle assertion : Git LF comparé au checkout CRLF. Le correctif final compare exactement le résultat Git original au résultat Git du magasin isolé, sans normalisation. Les échecs Windows sur `621263540738675ef4ab1726c5d490d420d7315e` sont enregistrés ; la qualification finale sur `73787f29…` réussit.

Le préflight local précédent `37302526730` / job `111739485552` s'est terminé en échec à 12:05:50 UTC, avec la suite encore marquée in_progress et sans log final accessible (GitHub BlobNotFound). Sa cause et son résultat complet ne sont pas vérifiables. Aucun verdict CRLF n'est attribué à ce job sans preuve.

## Contrats et limites conservés

Figma fait autorité pour la présentation ; la documentation pour les comportements, règles métier, validation, navigation et persistance. La préparation intervient après définition des écrans/états et avant le plan et sa revue, complète les contrats existants et conserve la chaîne élément → propriétés → assertions atomiques → plan → réalisation → preuves. Le protocole reste générique ; le driver utilise « Zones corporelles » comme qualification isolée.

Le parcours préparé rejoue le paquet figé dans Git, avec 222 éléments, 50 variables et quatre ressources de contexte. Il qualifie seulement trois propriétés (largeur, hauteur, titre) et deux transitions de bascule dans une fixture JavaScript. Les tests synthétiques et faits JSON ne certifient ni une livraison applicative, ni les pixels natifs, ni une acquisition fraîche Figma ou l'accès authentifié Figma du runner. La consultation sémantique par les intervenants devra être évaluée dans les preuves réelles.

## Git et fichiers

Publications réalisées pendant la reprise : `06dda327…` (demande initiale), `62126354…` (shell cmd / magasin Git), `73787f29…` (assertion portable CRLF). Tête distante vérifiée de la PR : `73787f296d78ab3c435fa04ef993f0ef8382141f`.

Le point de récupération supplémentaire est committé localement, sans publication incompatible avec le verrou. Son SHA exact est donné dans le bilan de conversation et se retrouve par `git log -1 --format=%H -- .github/orchestration/reports/2026-10-05_VNEXT_FIGMA_TASK2_INITIAL.md`. Son code protocolaire reste identique au candidat qualifié ; les changements sont les preuves, ce bilan, request.json et campaign-state.json.

Fichiers de code modifiés pour la tâche 2 depuis la fin de la tâche 1 : workflow VNext disposable, policy VNext (hash du producteur), `scripts/kodjo/qualify-vnext-figma-real-path.js`, `scripts/kodjo/lib/vnext-figma-implementation-review.js`, `scripts/kodjo/lib/vnext-publication.js`, `tests/kodjo/vnext-figma-real-supervisor.pilot.js`, `tests/kodjo/vnext-runtime-plan.pilot.js`. Les autres fichiers sont les checkpoints et preuves de cette campagne. Aucun workflow V2 ou PRE-2/PRE-3 n'est modifié.

## Opérations et reprise exacte

Au dernier contrôle, seule la CI héritée de régression `37307334786` est en attente sur cette branche. L'ancienne file V2 `34748621746` sur main reste queued et intacte. Aucune session de shell locale persistante ni appel Claude n'a été lancé depuis cet environnement. L'état actuel des processus Claude sur la machine Windows et la santé du service runner ne sont pas vérifiables via les outils accessibles.

La requête versionnée reste QUALIFY_ONLY, génération 46 ; elle référence désormais le candidat final qualifié et son run. Identifiant logique `1c9be701-2e24-43f7-bd24-2030d1d3c6c1`, jamais consommé par l'entrée échouée avant Node.

Reprendre **la tâche 2**, pas la tâche 3 :

1. Rétablir la disponibilité du runner Windows si nécessaire et laisser le job existant 111755046302 terminer, sans duplication ni rerun.
2. Relire ses résultats et toutes les opérations actives. Vérifier un nouveau créneau de publication, HEAD et checkpoint exacts ; ne pas contourner le verrou.
3. Réutiliser la qualification 37307334832 du commit 73787f29… ; contrôler l'identité du code de tout checkpoint de métadonnées.
4. Publier une seule demande FIGMA_INITIAL avec cet identifiant non consommé. Le driver contrôle PR HEAD, qualifications, absence de Claude concurrent, claim exclusif et tentative 1.
5. Collecter la livraison initiale isolée, la correction technique bornée déclarée, les reçus réels, le bundle et leurs empreintes ; enregistrer le bilan. Arrêter avant toute reprise après validation utilisateur ou clôture.

La tâche 3 n'a pas de cible d'acceptation disponible : elle nécessite d'abord ce parcours réussi, ses preuves préservées et la validation technique utilisateur du hash exact de livraison.

## Reprise après fin des runs — 5 octobre, après 16 h 30 Paris

Le préflight 37307334786 est désormais terminé (conclusion GitHub cancelled). Son journal et ses steps établissent 1 072 tests, 1 068 PASS, 0 FAIL, 4 SKIP, ainsi que queue isolée et préflight disposable SUCCESS. La cause de la conclusion finale annulée n’est pas démontrée ; l’ancien artefact recovery reste absent. Aucun rerun. Aucun run actif dans le dépôt ; seule l’ancienne file V2 34748621746 reste queued, intacte. Ces faits remplacent le blocage courant décrit dans les sections historiques ci-dessus.

La requête passe à FIGMA_INITIAL, génération 47, même UUID non consommé, candidat qualifié 73787f29… / run 37307334832. Aucun code protocolaire nouveau : les preuves et checkpoints locaux sont inclus dans la publication. Le verrou doit être reverifié immédiatement avant cette publication. Le résultat réel sera enregistré après collecte, sans tâche 3 ni clôture.
