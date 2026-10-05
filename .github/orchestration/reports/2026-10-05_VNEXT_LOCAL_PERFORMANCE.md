# VNext — optimisation locale pendant la tâche 2

## Mission et état

Campagne existante `628b3349-88b4-4bf1-be6b-50bc09e7d245`, tranche `VNEXT-12-QUALIF`, PR #269, branche `protocol/vnext-proof-stability-20260930`. Départ local et distant : `e0c766feda827c2df6d3d8a523759007a9f05c85`. Instruction : commencer les optimisations locales, préserver le chantier Figma et attendre le signal utilisateur avant toute publication ou relance distante. Aucun nouveau chantier, workflow, appel Claude ou parcours Windows lancé. V2, PRE-2, PRE-3, tâche 3 et clôture restent hors périmètre.

État : **LOCAL_PASS_WAITING_USER_RUN_SIGNAL**. Ce rapport et les preuves sont inclus dans le commit local de reprise ; son SHA exact est livré dans le bilan et accessible par `git log -1 --format=%H -- .github/orchestration/reports/2026-10-05_VNEXT_LOCAL_PERFORMANCE.md`. Aucune publication.

## Optimisation réalisée

Le scanner `impact-graph.scanOneLevelDirectImporters` lançait un `git show` par fichier JavaScript/TypeScript, à chaque reconstruction et vérification. Il lit désormais le tree Git frais puis les blobs par lots de 128 objets maximum, limités à environ 32 Mio par lot (un objet individuel reste soumis à la limite existante de 64 Mio du processus). Les objets identiques sont lus une fois dans ce scan. Aucun cache persistant, aucune lecture du checkout et aucun raccourci de validation.

Le lecteur vérifie pour chaque objet son identité, son type blob, sa taille, son délimiteur et son hash Git recalculé sur les octets. Il refuse les objets incohérents, les réponses tronquées et les données surnuméraires. Les entrées non-blob conservent le comportement `git show` antérieur. La classification, la résolution des imports, le tri, la sérialisation et le hash du contrat de scan sont inchangés.

Un profilage opt-in (`KODJO_VNEXT_PERF_DIR`, répertoire absolu) enregistre par processus les durées des opérations Git, lectures groupées, production des contrats et copies des fixtures. Les événements ne contiennent ni arguments, ni identifiants secrets, ni contenus des sources. Les durées imbriquées sont inclusives : leurs sommes ne représentent pas la durée murale. L'indisponibilité du journal diagnostique ne transforme pas une validation en succès et ne change pas les contrats.

Le nouveau lanceur `node scripts/kodjo/test-vnext.js --concurrency=4` conserve toute la sélection VNext et le reviewer UI historique. Il accepte une concurrence explicite de 1 à 32, rejette les paramètres invalides et ne propose aucun filtre de tests. Sans option, le comportement de concurrence reste celui de Node. Le lanceur historique et tous les workflows V2 restent inchangés. La valeur 4 sert à la mesure locale ; son caractère optimal sous Windows n'est pas établi.

## Résultats et preuves

Preuves : `.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task2/local-optimization-20261005/` (journaux gzip sans perte, benchmark, profil agrégé, précontrôle et empreintes).

| Contrôle | Résultat |
| --- | --- |
| Scanner, même dépôt temporaire de 701 fichiers / 700 fichiers scannés | 3 418 ms avant, 156 ms après ; 70 importers ; JSON et hash de contrat identiques |
| Tests du lecteur batch et de l'impact graph | 14 PASS, 0 FAIL |
| Suite locale finale VNext + reviewer UI, concurrence 4, profilage activé | 327 tests, 326 PASS, 0 FAIL, 1 SKIP ; 71,54 secondes |
| Précontrôle Figma local | LOCAL_PRECHECK_PASS ; hash produit = hash observé ; 0 appel modèle |
| Syntaxe indépendante YAML | 64 workflows acceptés |
| Invariants des workflows | PASS |
| Paramètre concurrence invalide | refus, exit 2 avant lancement des tests |

Les tests comparent les octets groupés à `git show` pour noms Unicode/espaces, contenu CRLF, fichier vide et binaire, plusieurs lots, objets empaquetés et checkout altéré. Une nouvelle révision est observée fraîchement. Les cas négatifs injectent absence de chemin, mauvaise identité, corruption du contenu, troncature et données supplémentaires.

Une première exécution locale a révélé un encodage invalide de l'entrée string avec l'option historique `encoding: buffer` de spawnSync. L'entrée batch est désormais un Buffer UTF-8 ; les tests finaux ci-dessus portent sur ce correctif. Aucun gate n'a été affaibli.

Le gain d'environ 22 fois concerne uniquement le scanner de ce benchmark local Linux, une mesure avant/après. Il ne démontre pas une division par 22 du job complet ni un gain Windows. L'ancienne suite locale de 325 tests avait pris environ 168 secondes avec d'autres paramètres ; elle ne constitue pas un benchmark strictement comparable à la nouvelle suite de 327 tests à concurrence 4.

## Correctifs Figma préexistants préservés dans le même point de reprise

Les modifications non committées récupérées avant cette optimisation ne sont pas écrasées. Elles sont intégrées au commit et à la suite finale : accès limité du reviewer à son dossier Figma temporaire via `--add-dir`, dépendances transportées par indices strictement validés du catalogue, binding CREATE/REUSE explicite, états fonctionnels distingués des interactions natives, intentions liées aux exigences et mesure de géométrie par navigateur séparé avec capture. Le test navigateur est ignoré ici faute de binaire disponible ; Windows devra réellement le vérifier.

Le parcours initial `37325776512` / job `111816099880` a exécuté la revue Claude `f7282e15-2022-48d5-9be6-3abd1236e885`, puis échoué sur `VNEXT_REVIEW_FINDING_DEPENDENCY_UNKNOWN: PLAN_CONTRACT`. La réponse scellée reste inchangée. Ses huit remarques brutes ne constituent pas un verdict validé. Deux refus Read concernaient l'observation Figma et la capture temporaires. Zéro implémentation et zéro correction réelle. L'artefact exact et les reçus sont conservés sous `task2/initial-37325776512/` ; ZIP SHA256 `8affb852e295f6f17b58e42b059edfa1ccc9c5d6e187f1eee0c2694343136dbf`.

Les runs sur e0c766fe sont terminés : qualification `37325776649` SUCCESS ; parcours `37325776512` FAILURE ; régression `37325776552` CANCELLED malgré 1 072 tests, 1 068 PASS, 0 FAIL, 4 SKIP et queue/précontrôle SUCCESS. La durée proche de la limite de 60 minutes suggère un dépassement ; la cause de l'annulation n'est pas explicitement confirmée par le journal. L'ancien recovery est absent et constitue une réserve séparée.

## Reprise et limites

La requête locale est QUALIFY_ONLY, génération 48. Son UUID initial `1c9be701-2e24-43f7-bd24-2030d1d3c6c1` est consommé ; il ne doit jamais être réutilisé pour un nouvel initial. Le checkpoint enregistre ce fait, l'échec réel et l'attente du signal utilisateur. La qualification antérieure sur 73787f29 ne qualifie pas ces nouveaux octets.

Après signal : vérifier HEAD et opérations actives, qualifier le candidat exact et mesurer les tests coûteux sous Windows, puis seulement envisager un nouveau parcours initial causal avec un nouvel UUID dans la même campagne. Aucun gain Windows, acquisition fraîche Figma, rendu natif sur appareil ou parcours initial réussi n'est revendiqué. Aucun changement des décisions métier. Les processus Claude présents sur le PC Windows ne sont pas directement observables depuis cet environnement ; le verrou doit les contrôler à la frontière d'exécution.

Fichiers propres à l'optimisation : `scripts/kodjo/lib/impact-graph.js`, `vnext-git-batch.js`, `vnext-performance.js`, instrumentation de `vnext-live-chain.js` et de son test, `scripts/kodjo/test-vnext.js`, `tests/kodjo/vnext-git-batch.pilot.js`, présent rapport, checkpoints et preuves. Les autres fichiers Figma du commit proviennent des correctifs préexistants mentionnés ci-dessus. Aucun fichier applicatif, dépendance npm, workflow, timeout ou protocole V2 n'est modifié.
