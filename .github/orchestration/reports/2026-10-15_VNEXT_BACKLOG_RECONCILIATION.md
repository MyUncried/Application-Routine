# Réconciliation du backlog VNext — 15 octobre 2026

Mission : `VNEXT-BACKLOG-RECONCILIATION-20261015`.

## Résultat de la réconciliation

La demande est la mise à jour effective du registre, après vérification des capacités, tests et usages VNext. Périmètre documentaire : `PROTOCOL_EVOLUTION_BACKLOG.md` et ce rapport ; aucun moteur, workflow, autorisation, tranche produit, automation ni preuve historique n’est modifié.

Base de publication : `main=d5dc689d61df4c7eea265f040de3eb0140206871`. Audit de code : `f8020627015c74e5d11e7972b5f685a4874fec04` ; comparaison vérifiée jusqu’à la base de publication, seules deux demandes PRE-4 ajoutées. PR ouvertes relues : #344 (variante Claude), #356 (transport), #363 (captures) et autres chantiers documentaires/historiques non touchés. La PR #243 d’assertions UI et #248 de rétention sont des candidats historiques distincts : leur existence ne prouve pas un déploiement dans main, et leur fusion n’est pas autorisée par cette réconciliation.

Modifications :
- Vue courante exhaustive des 28 sujets auparavant ouverts avec pertinence, réalisation/intégration, tests, exécution réelle et reliquat.
- Distinction code intégré, contrôles automatisés, Claude réel jetable, usage opérationnel et preuve historique.
- PE-02 passe de À TESTER à DÉMONTRÉ pour le runner local ; PE-15 passe à DÉMONTRÉ uniquement pour la reprise historique de même session V2. Les origines antérieures restent accessibles au SHA de base.
- Les 26 autres entrées ne sont pas artificiellement closes. Leurs sous-obligations déjà satisfaites sont distinguées des manques ; PE-25 est reclassé dans la vue courante en limitation externe ; PE-01/03 sont conditionnés à une décision d’architecture ; PE-17 est une étude historique à réévaluer.
- Les 13 entrées précédemment DÉMONTRÉ conservent leurs lignes sans nouveau verdict.
- Les quatre statuts de suivi restent compatibles avec `tests/kodjo/incident-register.pilot.js`. La vue détaillée constitue la classification courante ; les anciens statuts seuls ne décrivent plus le niveau technique.
- Aucun besoin n’est supprimé, aucun passage à REJETÉ, aucune nouvelle exigence de navigateur/device non décidée.

Contrôles de cette livraison : cardinalités et unicité, compatibilité du parseur de statuts existant, préservation exacte des lignes hors PE-02/15, présence des 28 sujets et vérification du diff limité aux deux fichiers documentaires. Ce sont des contrôles documentaires, pas une nouvelle qualification fonctionnelle. Aucune suite globale, aucun appel Claude, aucun dispatch ni reprise PRE-4 lancé. Publication documentaire avec `[skip ci]` ; aucune absence de run n’est présentée comme un test PASS.

État de départ : checkout d’audit propre, HEAD figé ; préparation des deux fichiers dans un dossier séparé, sans écriture dans un worktree produit. Publication atomique par arbre basé sur main et avance non forcée avec HEAD attendu ; relecture de la référence et des deux contenus après publication. Le commit final est celui portant ce rapport et le registre, vérifiable par `git log -1 --format=%H -- .github/orchestration/reports/2026-10-15_VNEXT_BACKLOG_RECONCILIATION.md` ; aucun hash auto-référent n’est inventé.

Restes / hypothèses : les limites Work, les scénarios manquants et l’état externe sont ceux de l’audit ci-dessous, datés et non transformés en constat temps réel permanent. L’absence de changement du moteur ne prouve pas l’absence d’évolution d’une configuration Work externe. Les derniers événements PRE-4 ne sont pas diagnostiqués ni consommés ici. Aucun contrôle sur appareil requis par cette modification documentaire ; les preuves produit manquantes restent indiquées par sujet.

## Audit source conservé

Le texte ci-dessous est le relevé d’audit préalable, conservé avec ses références et limites. Ses formulations « registre inchangé » et « propositions non appliquées » décrivent **la phase d’audit avant cette livraison**, et non le résultat de la présente réconciliation. La vue courante du registre et la section ci-dessus portent l’état de suivi réconcilié.

---

# Audit des 28 sujets ouverts du protocole KODJO / VNext
Date : 15 octobre 2026. Audit en lecture seule ; aucune correction, qualification, revue Claude, reprise PRE-4 ou modification du registre lancée.

## Conclusion

« À TESTER » n’est pas un statut technique exploitable dans ce registre. Il recouvre une installation déjà utilisée, des implémentations intégrées et testées, des preuves historiques V2, des corrections non propagées à VNext, des scénarios réels manquants et un défaut externe GitHub.

Le retard du registre est confirmé. Il faut dissocier la réalisation, l’intégration et le niveau de preuve, sans transformer un succès de CI en démonstration du parcours utilisateur.

Les constats les plus importants sont :
- PE-02 : runner local automatisé effectivement utilisé ; le besoin initial n’est plus simplement « à tester ».
- PE-15 : même session réellement reprise dans la certification V2 ; cela ne prouve pas une session unique entre toutes les étapes VNext.
- PE-04/05/06/09/31/39 : transport et consommation Work existent, mais reprise spontanée du pilote et continuité jusqu’au vrai jalon ne sont pas démontrées de bout en bout.
- PE-27/32/33 : mécanismes VNext présents et qualifiés ; PE-33 possède aussi un scénario Claude réel sur fixture jetable. Leur statut ne doit pas suggérer une absence d’exécution.
- PE-28/29/30/35/36/37/38 : des parties restent à réaliser ou à propager ; ajouter seulement un test ne suffit pas.
- PE-25 : limitation externe toujours observable ; ce n’est pas un correctif candidat attendant une certification.

## Périmètre et méthode

Source principale figée : [main f8020627015c74e5d11e7972b5f685a4874fec04](https://github.com/MyUncried/Application-Routine/tree/f8020627015c74e5d11e7972b5f685a4874fec04). Le registre comporte 41 lignes : 28 ouvertes (10 À ÉTUDIER, 18 À TESTER), 13 DÉMONTRÉ. Les 28 entrées ouvertes sont toutes traitées ci-dessous.

Au contrôle de fin, main est [7902a8828273417a7003e831478ef93622c55f96](https://github.com/MyUncried/Application-Routine/commit/7902a8828273417a7003e831478ef93622c55f96). La comparaison montre un seul fichier ajouté : une demande de revue PRE-4 dans requests/vnext-agent. Aucun changement du moteur commun dans ce delta. Cette demande n’a été ni exécutée ni consommée par cet audit.

Travail effectué : lecture des modules, producteurs et consommateurs, workflows, tests et rapports versionnés ; API GitHub des runs/jobs ; téléchargement et contrôle SHA-256 des archives de tests ; lecture des données de transport et de la configuration d’automation actuelle. Les recherches négatives ci-dessous signifient « non retrouvé dans ce périmètre », pas une preuve d’inexistence dans toute conversation ou système externe. Les branches non intégrées ne sont pas assimilées à main. La variante Claude #344 n’a pas été modifiée ni qualifiée.

Les traces de consommation sont lues sur la branche de transport, figée au commit 2f6324cbfffc263fc4955b31dd30059d490ef277. Les écritures de cette branche ne modifient pas le code audité.

## Classification proposée

Deux dimensions doivent être obligatoires, plutôt qu’un statut unique :

| Dimension | Valeurs |
|---|---|
| Réalisation | NON CONÇU / SPÉCIFIÉ / PARTIEL / IMPLÉMENTÉ |
| Intégration | ABSENT DE MAIN / BRANCHE CANDIDATE / INTÉGRÉ MAIN |
| Validation | NON EXÉCUTÉ / CONTRÔLES AUTOMATISÉS / SCÉNARIO RÉEL JETABLE / USAGE OPÉRATIONNEL |
| Portée de preuve | V2 HISTORIQUE / VNext / FAMILLE OU SCÉNARIO EXACT |
| Reste à faire | CONCEVOIR / COMPLÉTER / PROPAGER / QUALIFIER LE SCÉNARIO / RÉCONCILIER LE REGISTRE / DÉPENDANCE EXTERNE |
| Limite | code, scénario négatif, destination Work, appareil, accès ou preuve manquante explicitement nommés |

« Certifié » doit toujours référencer un candidat, un contrat de qualification et un périmètre. « En production » est trop imprécis ici : un appel Claude réel sur fixture, une utilisation sur tranche produit, un événement Work réellement consommé et une publication de l’application sont quatre faits distincts.

Libellés de synthèse utilisés dans le tableau :
- **CONCEPTION** : objectif non réalisé, arbitrage/conception restant.
- **PARTIEL** : capacité existante mais objectif ou propagation incomplète.
- **QUALIFIÉ CONTRÔLÉ** : intégré, scénarios de mécanisme exécutés ; limites explicites.
- **RÉEL JETABLE** : scénario avec acteur/exécuteur réel sur environnement de qualification, sans assimilation au produit.
- **DÉMONTRÉ LIMITÉ** : usage effectif prouvé sur un périmètre donné.
- **HISTORIQUE DÉMONTRÉ** : preuve réelle dans l’ancien parcours, transfert non présumé.
- **SCÉNARIO MANQUANT** : propriété précise demandée non démontrée.
- **EXTERNE** : écart observable relevant d’un système externe.

## Tableau exhaustif

| ID | Statut enregistré | Classe proposée | État exact et suite |
|---|---|---|---|
| PE-01 | À ÉTUDIER | CONCEPTION | Local existe ; sélection Local prioritaire + fallback Cloud contrôlé non trouvée dans le parcours commun. Concevoir le basculement. |
| PE-02 | À TESTER | DÉMONTRÉ LIMITÉ | Runner self-hosted utilisé par des exécutions Claude et le précontrôle Windows. Réconcilier le registre ; ne pas le présenter comme jamais exécuté. |
| PE-03 | À ÉTUDIER | PARTIEL | Mode/writer liés à l’approbation, changement invalidant, verrou local réel. Bascule hybride Local/Cloud et révocation en situation réelle non démontrées. |
| PE-04 | À TESTER | PARTIEL | Échecs archivés et transportables, consommation commune opérationnelle pour CI. Message explicite dans le fil pilote sur erreur/gate encore non démontré. |
| PE-05 | À ÉTUDIER | PARTIEL | Timeouts de processus et récupération horaire des résultats/signaux présents. Pas de watchdog complet d’une transition attendue qui ne démarre jamais. |
| PE-06 | À TESTER | SCÉNARIO MANQUANT | Échec Claude réel disponible ; notification spontanée d’un échec contrôlé dans le même fil pilote non établie. |
| PE-07 | À ÉTUDIER | PARTIEL | Checkpoint de continuité et migrations de destination documentés. Handover complet de cockpit avec ownership et reprise effective non démontré. |
| PE-08 | À TESTER | PARTIEL | État reconstruisible depuis GitHub et consommateurs sans mémoire de chat. Reconstruction automatique d’un nouveau cockpit non démontrée. |
| PE-09 | À TESTER | PARTIEL | Binding et automation actuels concordent ; consommation événementielle dans chat d’exécution prouvée. Réception après handover dans le nouveau fil pilote non vérifiée. |
| PE-10 | À ÉTUDIER | CONCEPTION | Routage technique par identifiants disponible. Convention humaine de nommage non retrouvée ; ancienne justification « pas d’ID » périmée. |
| PE-11 | À ÉTUDIER | CONCEPTION | Horodatages et traces existent. Mesure corrélée t0/t1/t2/t3 et réduction de latence non établies. |
| PE-12 | À ÉTUDIER | DÉMONTRÉ LIMITÉ | Transport isolé sur branche/PR #356 effectivement utilisé. Commits techniques subsistent ; réduction totale de volume/latence non mesurée. |
| PE-13 | À ÉTUDIER | PARTIEL | Exclusions des données Work sur les deux CI centrales intégrées. Absence de toute CI inutile non démontrée pour tous workflows/diffs mixtes. |
| PE-15 | À TESTER | HISTORIQUE DÉMONTRÉ | Même session Claude réellement reprise en V2 C2→C3. Pas de preuve d’une session commune à toutes les étapes VNext. |
| PE-17 | À ÉTUDIER | CONCEPTION | Mesures locales/rapports de performance existent. Comparatif Cloud V1.3/V1.2/Local sur protocole de mesure commun non trouvé. |
| PE-25 | À TESTER | EXTERNE | API : run fantôme 34748621746 toujours queued, aucun job. Résorption GitHub non obtenue ; ne pas confondre avec runner occupé. |
| PE-27 | À TESTER | QUALIFIÉ CONTRÔLÉ | Assertions atomiques, IDs et couvertures liées intégrées à VNext et testées. Conformité géométrique réelle du produit non attestée par ces tests. |
| PE-28 | À TESTER | PARTIEL | Routage VISUAL_CORRECTION existant surtout V2 ; VNext impose REVISION pour deliveryCorrection. Chemin direct VNext demandé non démontré. |
| PE-29 | À TESTER | PARTIEL | Handoff V2 actionnable ; gate VNext exact vérifié mais message générique sans 👍 explicite et URL optionnelle. Propagation nécessaire. |
| PE-30 | À TESTER | PARTIEL | Clôture idempotente de registre câblée au finaliseur V2. Clôture GitHub VNext ne met pas ce registre à jour ; anciennes entrées citées encore ACTIVE. |
| PE-31 | À TESTER | PARTIEL | Rafraîchissements/vérifications et checkpoints présents. Consommateur Work ne lance pas le travail du pilote ; continuité de mission non garantie. |
| PE-32 | À TESTER | QUALIFIÉ CONTRÔLÉ | Inventaire Git exact, candidate_id et slots CREATE remplacent les chemins libres. Intégré/testé ; dossier de scénarios complets casse/Unicode à consolider. |
| PE-33 | À TESTER | RÉEL JETABLE | AllowedChangeSet, préservation exacte, causalité et revalidation câblés ; correction Claude réelle bornée réussie. Pas simplement « jamais testé ». |
| PE-35 | À TESTER | PARTIEL | Prévention et corrections bornées présentes. Classificateur d’erreurs VNext non trouvé branché comme pilote commun ; poursuite globale non garantie. |
| PE-36 | À TESTER | PARTIEL | Rôles, rétentions, inventaire et certains préflights quota intégrés. Préflight non généralisé aux producteurs VNext et GC sûr complet non établi. |
| PE-37 | À TESTER | PARTIEL | Annulation des qualifications supersédées activée en CI V2 PR ; qualification VNext conserve false. Propagation et preuve A→B nécessaires. |
| PE-38 | À TESTER | PARTIEL | Classificateur et garde des jobs lourds intégrés en CI V2. VNext n’utilise pas ce garde et son trigger inclut le backlog ; généralisation incomplète. |
| PE-39 | À ÉTUDIER | CONCEPTION | Entrée de besoin ajoutée, socle de reprise existant. Contrôle exécutable de sortie du pilote non trouvé ; implémentation/qualification restent à faire. |

## Preuves communes et portée réelle

### CI actuelle intégrée

La PR [#362](https://github.com/MyUncried/Application-Routine/pull/362) est fusionnée au commit fb875bc7f38750c85fc9e1dab0001df6f9e89ec0. Le rapport versionné établit l’identité de l’arbre du candidat 16af73dc851160bba949425e887328c3124876c3 avec celui de la fusion. Le code a ensuite été lu au SHA de main figé.

Run [38650355491](https://github.com/MyUncried/Application-Routine/actions/runs/38650355491), candidat 16af73dc : API SUCCESS. Jobs qualification Linux/Windows, historical-equivalence Linux/Windows et historical-platform-coverage SUCCESS. architecture-audit et signal de campagne SKIPPED : ni nouvel audit indépendant ni nouvelle campagne n’en sont déduits.

Archives téléchargées et empreintes recalculées :
- qualification-controls-Linux, artifact 11935405938 : SHA-256 5885f63ebf02080a74fa3f3639df1e8ae353f606206e72eb7bc2fa982bd3f07f ; 570 tests, 570 PASS, 0 FAIL, 0 SKIP.
- qualification-controls-Windows, artifact 11935069131 : SHA-256 569c7277b033895a24f06e92230c1e24e50752cf8b135c810fd544a9aa6fe672 ; 570 tests, 569 PASS, 0 FAIL, 1 SKIP. Le test d’extraction binaire est explicitement ignoré sur Windows dans son fichier de test.
- historical-equivalence-Linux, artifact 11935481034 : SHA-256 88bfb95428b54dda6e36e1fac373ec87f58c672e9dabbbb95cc86fac67f83be4 ; 1557 tests, 1555 PASS, 0 FAIL, 2 SKIP. Le JSON contient 453 cas mappés et 430 sujets historiques. Parmi ces sujets, 270 demandent un scénario externe ; T-078, T-085, INC-105, INC-112 restent EVIDENCE_INCOMPLETE. Le champ readiness vaut NOT_CERTIFIED_FOR_OPERATIONAL_VNEXT pour ce rapport d’équivalence : ce n’est pas un verdict global annulant le cutover, ni une preuve globale des anciens scénarios.

Les cas PE-27/28/29/30/33/35/36/37/38 apparaissent PASS dans ce JSON, mais certains testent explicitement les workflows V2. Leur présence dans une archive « VNext » ne les transforme pas en démonstrations opérationnelles VNext.

Run hérité [38650355485](https://github.com/MyUncried/Application-Routine/actions/runs/38650355485) : API SUCCESS ; protocol et protocol-windows-preflight SUCCESS, runner KODJO-LOCAL-RUNNER pour ce dernier ; disposable-qualification SKIPPED. Ce run ne réexécute donc pas la tranche jetable.

### Retour Work : ce qui est effectivement prouvé

Les données lues montrent :
- signal CI du run [38621132357](https://github.com/MyUncried/Application-Routine/actions/runs/38621132357), candidat 754e71be ;
- claim publié au commit ae877afe8a357d0cae13604e0c9160c7cfdfbd69 ;
- checkpoint RESULT_CONSUMED publié au commit [f8b84bc5be79247116e6df775eda95659646f190](https://github.com/MyUncried/Application-Routine/commit/f8b84bc5be79247116e6df775eda95659646f190) ;
- reçu PROCESSED publié au commit [d884cf9250694bf9824a57094aac2d3b52a37237](https://github.com/MyUncried/Application-Routine/commit/d884cf9250694bf9824a57094aac2d3b52a37237) ;
- owner de réception work-webhook:62217550-c81e-11f1-90f6-cb6ca22dd614 ;
- quatre caches ZIP relus physiquement, taille/SHA-256/intégrité ZIP vérifiés à nouveau pendant cet audit.

Le checkpoint dit expressément : « Pilot conversation delivery remains unverified. » Son next_action ne lance ni PRE-4 ni travail produit. Cette preuve précède #362 : aucun nouveau succès événementiel du consommateur consolidé n’est inventé.

La configuration Work a été relue pendant cet audit : automation 6acfddf6231c8191867783a49d7a55a8 activée, conversation_id 6acfe188-8b54-83eb-8a60-05d95fd9425e, identique au binding Git. Ancienne automation 6aceac15818881918314f008b1742efc désactivée. Le prompt courant autorise uniquement les écritures de consommation ; il interdit explicitement de lancer tranche, workflow, appel Claude, correction ou fusion. Il s’agit donc d’un consommateur de résultats, pas d’un pilote autonome complet. Son last_run_time du 15 octobre 07:30:06 UTC prouve une exécution déclarée, pas la destination de sortie ni une reprise métier.

## Vérification détaillée, sujet par sujet

Les chemins ci-dessous sont relatifs à la racine du dépôt au SHA figé. Les sources sont consultables par les liens de la dernière section.

### PE-01 — Sélection Local puis Cloud

**Réalisation : partielle pour Local ; objectif hybride non conçu dans le parcours lu.** Le relais et le live-chain invoquent Claude Local. Les workflows opérationnels utilisent le self-hosted runner et le verrou local. Le contrat execution_context accepte LOCAL et CLOUD ; cette acceptation de schéma n’est pas un sélecteur de disponibilité ni une stratégie de fallback.

Sources : lib/vnext-agent-relay.js, lib/vnext-live-chain.js, lib/vnext-preserved-controls.js ; kodjo-vnext-chatgpt-plan-review.yml. Aucun moteur de sélection automatique Local prioritaire / Cloud de secours retrouvé dans ces points d’entrée et dépendances.

**Reste :** définir disponibilité, causalité du fallback, transfert d’autorité, nouvelles approbations nécessaires et preuve de non-concurrence. Aucun simple « test de branche » ne peut achever l’objectif absent.

### PE-02 — Runner local automatisé

**Intégré et utilisé réellement.** Le relais est raccordé à un self-hosted runner. Le rapport Work conserve la revue réelle PRE-4 run 38465662376, job 115531699206, session bc292af0-5ef7-41be-961c-245cbc7daff3, 729 événements, 155 tours. L’API confirme le run terminé FAILURE : Claude a exécuté ; le dossier a ensuite été refusé pour couverture insuffisante. Un échec de revue ne remet pas en cause l’existence de l’exécution locale automatisée.

Le précontrôle Windows 38650355485 a aussi exécuté sur KODJO-LOCAL-RUNNER. Le cycle VNext jetable 37625815436 fournit une autre exécution Claude réelle réussie.

**Reste :** actualiser le statut du besoin initial ; maintenir la qualification d’environnement sur les changements concernés. Ne pas étendre ce constat au fallback Cloud de PE-01 ni à la disponibilité permanente du poste.

### PE-03 — Writer unique et invalidation à la bascule

**Contrats et protection locale intégrés/testés.** execution_context inclut mode et writer_id dans la cible d’approbation. Le test « VNext preserved writer: mode and designated writer are explicit and change invalidates approval » est PASS dans l’archive récente ; changer LOCAL/CLOUD ou writer change le hash et refuse l’ancienne approbation. Le relais prend le verrou claude-local.lock et contrôle le scanner de processus KODJO.

**Limite :** ces tests ne démontrent pas une bascule entre deux exécuteurs Local/Cloud réellement concurrents ni une révocation distribuée d’un writer déjà lancé. Préserver la distinction entre Claude KODJO et sessions Desktop/VS Code hors protocole.

**Reste :** conserver la partie contractuelle comme qualifiée ; qualifier/compléter la coordination hybride avec PE-01.

### PE-04 — Message Work sur erreur ou action requise

**Partiellement opérationnel.** Les diagnostics du relais, les signaux et le consommateur préservent erreurs, model_invoked et résultats partiels. Les tests vnext-work-continuation/execution couvrent échec, archive absente, corruption et provenance. La chaîne CI réelle atteint RESULT_CONSUMED/PROCESSED.

**Limite :** transport et accusé ne démontrent pas qu’un message d’erreur ou une demande d’action arrive spontanément au fil pilote attendu. Le checkpoint cité conserve explicitement cette limite.

**Reste :** vérifier le scénario erreur et le scénario gate utilisateur jusqu’à la sortie visible du pilote, avec accusé et absence d’approbation implicite.

### PE-05 — Watchdog anti-silence

**Deux mécanismes déjà intégrés :** timeouts des enfants Claude dans vnext-review-process.js et récupération commune horaire dans kodjo-vnext-work-continuation.yml / recover-vnext-work.js. Le récupérateur balaie les runs terminés depuis recovery_since, recherche signaux/claims/reçus et publie un wakeup des éléments pendants ou bloqués.

**Limite de code :** le balayage porte sur des runs terminés et les signaux existants. Il ne représente pas toutes les transitions attendues dont aucun workflow n’a démarré. Un claim abandonné est signalé, jamais volé par expiration. La présence du cron ne prouve pas une correction autonome d’un pilote arrêté.

**Reste :** définir attentes/délais mesurés, observer aussi absence de lancement et absence de progression, raccorder une reprise autorisée. Articuler avec PE-31/39.

### PE-06 — Échec contrôlé notifié dans le même Work

**Scénario cible non démontré.** Un échec Claude réel existe (38465662376, couverture refusée). Des scénarios négatifs de contrat sont PASS et une réception automatique CI a été prouvée. Ce sont des faits distincts : aucun n’établit à lui seul « échec contrôlé → notification spontanée dans le même fil pilote sans intervention ».

**Reste :** une preuve bornée de ce scénario précis après résolution de la destination, sans nouvel appel modèle inutile. Ne pas relancer l’ancien paquet de revue partielle.

### PE-07 — Handover de conversation

**Spécification et briques présentes.** AI_ORCHESTRATION_CONTINUITY.md définit checkpoint frais, reconstruction GitHub et revalidation des éléments critiques. Le transport prévoit accepted_prior_destinations et les migrations ont été documentées.

**Limite :** migrer un binding et reconstruire des données n’est pas une procédure opérationnelle complètement démontrée de changement de cockpit, avec ancien propriétaire neutralisé, nouveau pilote, trigger et première action réelle.

**Reste :** définir et qualifier cette transaction de handover, sa reprise après interruption et ses conflits. Ne pas rediriger arbitrairement le pilotage vers cette conversation.

### PE-08 — Reconstruction automatique d’un cockpit

**Données et reconstruction technique partielles.** Les contrats, archives et checkpoints GitHub permettent de reconstituer un dossier sans mémoire de chat. Le consommateur vérifie le signal à SHA exact et le contexte du code courant.

**Limite :** exécuter ce consommateur n’instancie pas et ne qualifie pas un nouveau cockpit autorisé. Le scénario de handover autonome complet n’est pas retrouvé dans les preuves actuelles.

**Reste :** qualification liée à PE-07 : nouveau contexte sans mémoire, récupération des autorités et actions courantes, maintien du gate utilisateur.

### PE-09 — Trigger après handover

**Configuration corrigée et réception limitée prouvée.** La destination courante Git et Work concorde ; l’ancienne automation est désactivée. Les destinations antérieures sont lisibles sans réécriture des signaux. Le test de migration et les tests de déduplication sont exécutés.

**Limite :** consommation dans le chat d’exécution démontrée ; retour spontané dans le fil pilote après handover non établi. is_enabled et last_run_time ne répondent pas à cette exigence.

**Reste :** tracer un nouvel événement de sa publication à l’action du nouveau pilote et prouver que l’ancien ne pilote plus.

### PE-10 — Nommage humain

**Convention non retrouvée dans les documents examinés.** Le besoin reste documentaire/ergonomique. L’argument historique « aucun conversation ID exploitable démontré » est désormais dépassé par le binding et la configuration actuels ; il ne justifie pas à lui seul la convention.

**Reste :** décider une convention humaine stable et l’inscrire dans la procédure de handover ; conserver les identifiants comme clés techniques. Pas de développement moteur présumé nécessaire.

### PE-11 — Latence GitHub → Work

**Traces disponibles, comparaison non réalisée.** Les runs, événements, commits de claims/checkpoints/reçus et métadonnées d’automation sont horodatés. Aucun dossier corrélé complet t0 publication / t1 événement / t2 réveil / t3 action du pilote ni mesure avant/après n’a été trouvé.

**Reste :** instrumenter ou exploiter ces timestamps sur une série comparable, distinguer attente runner, publication, transport et traitement Work. Un last_run_time seul ne mesure pas cette latence.

### PE-12 — Intrusivité Git du transport

**Réduction d’impact démontrée sur le périmètre d’isolation.** Les signaux, caches et reçus sont publiés sur orchestration/vnext-work-signals, PR #356, séparément du code. Les données lues prouvent l’usage réel de ce transport ; les commits ne sont pas des livraisons produit.

**Limite :** le mécanisme produit toujours des commits de transport, claims, checkpoints et reçus. Aucune baisse chiffrée du volume total ou de la latence n’est revendiquée.

**Reste :** reconnaître l’isolation comme réalisée ; séparer un éventuel objectif supplémentaire de réduction du nombre de commits, après mesure.

### PE-13 — CI étrangères aux signaux

**Exclusions intégrées.** Les deux CI centrales excluent les chemins de données Work connus ; le classificateur distingue les JSON exacts du code, binding et diff mixte. Tests de transport/classification PASS.

**Limites :** le rapport initial conserve les CI déjà créées sur le nouveau namespace, avant correction. Les filtres PR s’appliquent au diff complet : une PR contenant aussi du code reste qualifiée lors d’un nouveau commit de rapport. L’absence de tout run inutile sur l’ensemble des workflows n’a pas été démontrée.

**Reste :** distinguer isolation des signaux acquise, preuve événementielle de sélection et généralisation CI de PE-38.

### PE-15 — Continuité réelle de session Claude

**Besoin historique démontré dans V2.** Le rapport de certification ordinaire et le backlog PE-22C documentent C2 34720271428 → C3 34722199075 avec la même session 7750967c-14d0-49f9-97ca-736dea47c51b et --resume. L’API confirme C3 SUCCESS. PE-22A conserve aussi une interruption/reprise réelle de même session.

**Code actuel :** claude-local.js distingue --session-id en INITIAL et --resume en RESUME_DELTA. Ce moteur est réutilisé par la queue. Cela ne prouve pas une même session entre planification, revue, implémentation et revue indépendante ; les revues cumulatives peuvent avoir plusieurs session_ids par conception.

**Reste :** reclasser le besoin initial comme démontré historiquement, avec sa portée. Si une continuité supplémentaire VNext est voulue, ouvrir un scénario précis ; ne pas prétendre qu’elle existe partout ni qu’elle n’a jamais été testée.

### PE-17 — Comparaison Cloud V1.3 / V1.2 / Local

**Étude comparative non retrouvée.** Les rapports de performance VNext local existent et documentent optimisations et durées. Ils ne constituent pas un benchmark des trois chemins sur même charge, qualité attendue, nombre d’interventions, coûts et conditions de reprise.

**Reste :** décider l’utilité actuelle de ce comparatif historique et, s’il est maintenu, définir des observations comparables. Aucun moteur candidat « à certifier » identifié pour cette étude.

### PE-25 — Rerun GitHub fantôme

**Limitation externe toujours observable.** L’API relue retourne queued, conclusion null, run_attempt 1 pour 34748621746 ; l’endpoint jobs retourne total_count 0. Le rapport historique documente tentative introuvable et annulation forcée refusée, ainsi que runner libre à l’inventaire de l’époque.

**Limite :** l’absence de job ne constitue pas une inspection actuelle de tous les processus du poste. Aucune annulation ni demande au support n’a été envoyée dans cet audit.

**Reste :** résorption côté GitHub ou constat externe de disparition. Le parcours ordinaire était certifié avec cette réserve ; ne pas attendre une nouvelle exécution VNext pour « tester le correctif ».

### PE-27 — Assertions UI atomiques

**Implémenté et qualifié dans VNext.** ui-atomicity-contract.js, requirement-registry, review-contract et adaptateur de queue lient critères, assertions, preuves, réutilisation et plan exact. Les tests imposent source visuelle/décision pour propriété visuelle, allocation des preuves et couverture des changements. Les archives récentes contiennent les cas atomiques PASS et les contrôles de projection/compatibilité.

**Limite :** ces contrôles ne constituent pas une mesure de rendu réel du produit. Le benchmark Figma fonctionnel interdit d’inférer conformité visuelle/native de faits JSON. Le mécanisme de factorisation récent ne retire aucune obligation sans preuve valide.

**Reste :** classer « intégré et qualifié sur contrats » ; consigner séparément qualification géométrique réelle, historique des formats et éventuel usage produit. Ne pas exiger un navigateur non autorisé au motif que VISUAL_COMPARE figure dans le contrat.

### PE-28 — Correction visuelle directe sans replanification complète

**Implémentation historique réelle mais propagation VNext incomplète.** verify-visual-checkpoint.js vérifie contrat protégé inchangé, plan approuvé et scope ; la politique distingue CONTRACT_UNCHANGED et CONTRACT_CHANGED. Le test PE-28 de l’archive appelle cette politique avec des booléens contrôlés.

**Écart de raccordement :** les points d’entrée VNext examinés n’exposent pas le même chemin direct : live-chain refuse deliveryCorrection hors REVISION ; post-acceptance exige AUTHORIZE_REVISION et une baseline technique approuvée. Cela peut être légitime pour certains cas, mais ne démontre pas le parcours spécifique demandé par PE-28.

**Reste :** expliciter et raccorder les cas admissibles VNext, puis démontrer device/rendu non conforme + contrat inchangé → correction bornée, et contrat changé → replanification. Ne pas clôturer sur le seul test de politique historique.

### PE-29 — Handoff immédiatement actionnable

**V2 qualifié, VNext partiel.** Le test intitulé PE-29 vérifie kodjo-v2-plan-handoff-materialize.yml : approval_action=ADD_REACTION_+1, next_action et approval_url. Dans VNext, renderApprovalMessage dit « approuver explicitement cet objet exact » ; approvalUrl est optionnel et le message ne demande pas explicitement 👍. vnext-github-approval.js exige pourtant une vraie réaction +1 du propriétaire, liée au commentaire et au hash exacts.

**Reste :** propager l’explication de l’action réellement acceptée, lien canonique et attente claire dans le parcours VNext et sa restitution Work. Le gate de sécurité n’est pas absent ; c’est l’actionnabilité du handoff qui reste incomplète.

### PE-30 — Registre de clôture

**Implémenté/câblé en V2 ; pas général à VNext.** close-v2-activation.js produit ACTIVE→CLOSED et refuse une clôture différente ; tests d’idempotence PASS. kodjo-slice-finalize.yml l’exécute. PRE-1/PRE-2 ont des closures enregistrées.

**Écarts persistants :** V2-CAT-01 et V2-E2E-20260919 restent ACTIVE dans le registre actuel. vnext-github-closure.js observe/publie FINAL_OUTPUT, ferme l’issue et publie SLICE_CLOSED, sans mise à jour de ce registre. Sa fermeture d’issue n’est pas une preuve universelle de clôture du registre.

**Reste :** généraliser la transition canonique selon le type de tranche, sans modifier les cycles historiques par simple inférence. Traiter explicitement les divergences existantes avec preuves autorisées.

### PE-31 — Continuité opératoire du cockpit

**Briques intégrées, invariant global non garanti.** Les admissions relisent SHA/registre courant, les gates relisent commentaires/réactions, le consommateur impose archive et checkpoint avant reçu. Ces contrôles réduisent l’usage d’un ancien état.

**Limite décisive :** le consommateur actuel s’arrête contractuellement à la consommation et n’est pas autorisé à lancer le prochain travail du pilote. Un reçu PROCESSED ne démontre pas que la mission a poursuivi jusqu’au vrai gate. PE-39 documente précisément un précontrôle corrigible suivi d’un arrêt du pilote.

**Reste :** relier fraîcheur de l’état, action suivante autorisée et contrôle de sortie du pilote. Qualification stale-state/retry/capacité absente à tracer au niveau du cockpit, pas uniquement dans une bibliothèque.

### PE-32 — Chemins déterministes avant scan

**VNext intégré et testé.** impact-graph.js inventorie ls-tree au SHA exact et crée des candidate_id ; les slots CREATE doivent être absents et sous une racine autorisée. Les plans se lient à ces identités plutôt qu’à des paths libres. live-chain construit le manifeste avant le scan d’importeurs. Tests MODIFY/CREATE, identifiant inventé, fichier existant et racine interdite présents/PASS ; normalisation exacte contrôlée.

**Limite :** aucune démonstration distincte et exhaustive de tous les négatifs demandés, notamment les variantes de casse/Unicode en scénario opérationnel, n’est établie par ce dossier. Les refus de contrat ne doivent pas être comptés comme un nouveau cycle IA réussi.

**Reste :** consolider la matrice du scénario demandé et sa preuve au bon stade. Le mécanisme n’est pas « réalisé seulement sur une branche ».

### PE-33 — Préserver ce qui est validé après REVISE

**Implémenté, intégré, contrôles et Claude réel jetable exécutés.** revision-contract.js construit AllowedChangeSet, préserve les hashes des objets hors cibles, borne les dépendances et vérifie le résultat complet. vnext-runtime/live-chain recomposent les preuves de causalité et la chaîne de registre avant admission.

Les tests VNext-07 de correction ciblée, préservation exacte, mutation hors scope, nouveaux findings et REVISION_STALLED sont PASS dans la dernière archive. Les tests hérités PE-33 sont aussi PASS. Le cycle réel décrit une revue REVISE, une correction causale bornée 1/1, puis APPROVE ; le run 37625815436 est SUCCESS avec REVISION_PASS / IMPLEMENTED_AND_VERIFIED sur fixture jetable.

**Limite :** cette preuve ne certifie pas toutes les futures révisions produit, tout changement de contrat ou une reconstruction plus large sans contrôle. Le rapport historique de révision détaille les hashes et l’outcome recalculé.

**Reste :** réconcilier le registre et préciser le périmètre déjà qualifié ; l’extension métier ou multi-révisions reste une autre preuve. Ne pas résumer ce sujet par « jamais exécuté en production ».

### PE-35 — Déterminisme avant autocorrection

**Partiellement appliqué.** Les manifestes, IDs et dérivations mécaniques empêchent déjà plusieurs erreurs ; les révisions causales et compteurs bornent la correction. Les tests hérités couvrent un retry borné après INITIAL et recovery uploadé, et le parcours jetable VNext démontre une correction bornée.

**Limite de propagation :** vnext-error-policy.js expose les catégories demandées et auto_retry=false, mais la recherche de consommateurs ne trouve que les tests, sans import dans le pilote/exécuteur commun. La classification seule ne commande donc pas une poursuite automatique. Le précontrôle négatif peut encore conduire à l’arrêt décrit par PE-39.

**Reste :** raccorder prévention, diagnostic, correction autorisée et contrôle de progrès ; distinguer réellement arbitrage propriétaire et erreur mécanique. Ne pas ajouter des retries automatiques sans cause ni autorisation.

### PE-36 — Cycle de vie des artifacts

**Parties intégrées :** artifact-policy.js classe les familles et rétentions ; verify-artifact-retention.js contrôle les uploads ; check-artifact-budget.js applique un seuil par défaut de 450 MiB sur inventaire ; certains workflows queue/pilot/historiques/audit l’appellent. Les snapshots complets du pilot sont optionnels. inventory-closure-artifacts.js est raccordé à la clôture V2.

**Limites :** les producteurs VNext relay/closure/proof-stability ne possèdent pas tous ce préflight quota. L’inventaire ne prédit pas à lui seul l’espace requis par le prochain upload. Les caches Work préservent certains ZIP mais ne remplacent pas une politique générale de sauvegarde Evidence. Aucun collecteur automatique complet démontré n’a été retrouvé réunissant absence de référence active et preuve durable avant suppression.

**Reste :** propagation par producteur, criticité des uploads, nettoyage sûr référencé et récupération après expiration/quota. Aucun artifact n’a été supprimé par cet audit.

### PE-37 — Annuler les qualifications supersédées

**Partiellement intégré.** kodjo-v2-pilot-tests.yml utilise un groupe workflow/PR ou ref et cancel-in-progress conditionné à pull_request. Le test PE-37/38 vérifie précisément ce YAML V2.

**Écart confirmé :** kodjo-vnext-proof-stability.yml utilise un groupe par PR/ref mais conserve cancel-in-progress:false. Les writers et la continuation conservent à juste titre leurs propres protections ; activer true partout serait incorrect.

**Reste :** décider quels jobs VNext sont strictement HEAD-only, isoler les producteurs critiques, puis démontrer HEAD A→B avec A réellement annulé et writer/recovery préservé. Une assertion de texte YAML n’est pas ce scénario.

### PE-38 — Classer avant les jobs lourds

**V2 intégré/contrôlé :** classify-protocol-impact.js lit normative-inputs.json, conserve UNKNOWN comme qualification lourde, traite les renommages par --no-renames pour considérer origine et destination ; le job classify conditionne les jobs lourds du pilot. Les exclusions statiques couvrent rapports/backlog/données Work ; les tests PE-38 sont PASS.

**Écarts VNext :** proof-stability n’appelle pas ce classifier ni son résultat ; le backlog reste inclus par .github/orchestration/** et n’est pas exclu spécifiquement. Les rapports sont exclus largement, y compris des rapports utilisés comme entrées exécutables dans le pilot V2, qui les réinclut. Le niveau de généralisation demandé n’est donc pas acquis.

**Reste :** aligner triggers et consommateurs du manifeste sur VNext, vérifier les documents exécutables, puis apporter les scénarios GitHub de non-création, inconnu, mixte et renommage. Ne pas confondre minimatch local et événement réellement reçu.

### PE-39 — Contrôle exécutable de continuité du pilote

**Besoin inscrit, mécanisme nouveau non retrouvé.** L’entrée ajoutée au commit f802 précise explicitement que l’inscription ne vaut ni implémentation ni démonstration. Elle demande refus corrigible→correction→réadmission, interruption/reprise, doublons, absence de progrès, accès refusé et vrai arbitrage.

**Briques réutilisables :** claims/checkpoints/reçus, récupération, registre de révision, compteurs et contrats d’approbation. Elles ne contrôlent pas actuellement toutes les sorties de tour du pilote. Le consommateur Work a même une autorité volontairement limitée aux données de consommation.

**Reste :** concevoir et raccorder le contrôle au pilote autorisé, sans élargir l’automation de transport par simple prompt, puis qualifier ses scénarios. Ce chantier ne doit pas lancer PRE-4 en parallèle.

## Recommandation de réconciliation du registre

1. Mettre PE-02 au niveau « démontré opérationnel — runner local » et PE-15 « démontré historique — reprise même session V2 », avec réserve explicite pour les étapes VNext non couvertes.
2. Enregistrer PE-27/32 « intégré main, contrôles exécutés » et PE-33 « intégré main, contrôles + scénario Claude réel jetable », sans exigence artificielle de publication produit pour prouver un mécanisme protocolaire.
3. Scinder les sujets partiels en sous-obligations : notamment PE-04/09/31 (consommer / livrer au pilote / agir), PE-30 (V2 / VNext / réconciliation historique), PE-37/38 (pilot V2 / qualification VNext).
4. Déplacer PE-25 dans les limitations externes surveillées, sans le compter comme correction interne restant à implémenter.
5. Relier PE-31/35/39 sous un objectif commun de continuité, sans les fusionner : fraîcheur et poursuite, hiérarchie de traitement, puis invariant exécutable de sortie du pilote.
6. Conserver les preuves historiques et les anciens statuts dans l’historique ; ne pas réécrire les preuves ni déclarer une généralisation sur un test qui cible seulement V2.

Ces propositions n’ont pas été appliquées au dépôt. Aucun nouveau test, workflow, modèle ou automatisation n’a été lancé pour ce relevé.

## Sources principales

Liens vers les sources figées :
- [Registre des évolutions](https://github.com/MyUncried/Application-Routine/blob/f8020627015c74e5d11e7972b5f685a4874fec04/.github/orchestration/PROTOCOL_EVOLUTION_BACKLOG.md).
- [Code commun et scripts](https://github.com/MyUncried/Application-Routine/tree/f8020627015c74e5d11e7972b5f685a4874fec04/scripts/kodjo).
- [Tests du protocole](https://github.com/MyUncried/Application-Routine/tree/f8020627015c74e5d11e7972b5f685a4874fec04/tests/kodjo).
- [Workflows](https://github.com/MyUncried/Application-Routine/tree/f8020627015c74e5d11e7972b5f685a4874fec04/.github/workflows).
- [Bilan final de consolidation #362](https://github.com/MyUncried/Application-Routine/blob/f8020627015c74e5d11e7972b5f685a4874fec04/.github/orchestration/reports/2026-10-14_VNEXT_COMMON_CORRECTION_CHECKPOINT.md).
- [Bilan du retour Work](https://github.com/MyUncried/Application-Routine/blob/f8020627015c74e5d11e7972b5f685a4874fec04/.github/orchestration/reports/2026-10-14_VNEXT_WORK_CONTINUATION.md).
- [Contrat Work courant](https://github.com/MyUncried/Application-Routine/blob/f8020627015c74e5d11e7972b5f685a4874fec04/.github/orchestration/KODJO_VNEXT_WORK_CONTINUATION.md).
- [Binding Work](https://github.com/MyUncried/Application-Routine/blob/f8020627015c74e5d11e7972b5f685a4874fec04/.github/orchestration/KODJO_VNEXT_WORK_TRANSPORT.json).
- [Certification V2 ordinaire](https://github.com/MyUncried/Application-Routine/blob/f8020627015c74e5d11e7972b5f685a4874fec04/.github/orchestration/reports/KODJO_V2_ORDINARY_PATH_CERTIFICATION_REPORT_0.1.md).
- [Cycle VNext réel jetable](https://github.com/MyUncried/Application-Routine/blob/f8020627015c74e5d11e7972b5f685a4874fec04/.github/orchestration/reports/2026-10-07_VNEXT_FULL_CERTIFICATION_CYCLE.md).
- [Révision VNext et recontrôle de l’outcome](https://github.com/MyUncried/Application-Routine/blob/f8020627015c74e5d11e7972b5f685a4874fec04/.github/orchestration/reports/2026-10-07_VNEXT_REVISION_PLAN_SUCCESS_37546751570.md).
- [Exclusions CI VNext et limites documentées](https://github.com/MyUncried/Application-Routine/blob/f8020627015c74e5d11e7972b5f685a4874fec04/.github/orchestration/reports/2026-10-13_VNEXT_CI_PATH_EXCLUSIONS.md).

