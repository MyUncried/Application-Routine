# PRE-3 — Reprise de planification VNext — 08/10/2026

## État de mission

Opération de suivi : [#340](https://github.com/MyUncried/Application-Routine/issues/340).
Branche de travail : `plan/pre3-vnext-20261008`. Baseline : `1ddfb6d144552f578388257adc78db47ab5992c8`, arbre `10cd1fcafe51729b10f1e28103585277ab94ee9d`.
Étape : REQUIREMENTS / IMPACT, préparation des entrées PLAN. Aucun développement, PlanContract final, revue indépendante de plan ou accord propriétaire de plan produit à ce jalon.

## Préalable vérifié

- [#334](https://github.com/MyUncried/Application-Routine/pull/334) fusionnée : `6be6082efde244b14b9b3b6befc5d22db021c445`.
- Suite [#339](https://github.com/MyUncried/Application-Routine/pull/339) fusionnée : `ecabe1a5eb62ef3ccfaed1322423af0718777954` ; candidat qualifié `5f0a6cc7378c6538108360e3b2ed93766f167564`.
- [Qualification 37825871323](https://github.com/MyUncried/Application-Routine/actions/runs/37825871323) et [revue ciblée 37825871378](https://github.com/MyUncried/Application-Routine/actions/runs/37825871378) : completed/success sur ce candidat, vérifiés par API. Revue APPROVE, 69 tests dans les preuves archivées.
- Registre final `2026-10-08_VNEXT_AUDIT_TARGETED_REPAIR.md` publié sur main par `1ddfb6d144552f578388257adc78db47ab5992c8`. IA-F01..09 résolus dans leur périmètre ciblé ; l’audit global historique REVISE n’est pas réécrit. Les limites IA-F07/IA-F09 acceptées précédemment restent explicites : clôture distante réelle avec omissions secondaires acceptées non démontrée ; refus Windows réel d’un paquet historique invalide présent non démontré.
- Activation VNext intégrée, defaultProtocol VNEXT ; résolution effective PRE-3 = VNEXT après chargement de l’historique Git complet. Aucun contournement legacy V2.
- Aucune opération in_progress lors de l’observation ; ancien [run V2 Lean 34748621746](https://github.com/MyUncried/Application-Routine/actions/runs/34748621746) queued, distinct de PRE-3, non modifié. Aucun objet de plan PRE-3 trouvé avant création de #340 ; la branche de préparation #333 est historique.

## Travail produit et portée des preuves

Dossier : `docs/preparation/PRE-3/planification/`. Toutes les exigences P3-01..23 sont conservées dans la matrice de travail, sans annoncer une traçabilité VNext finale.

- Scan statique : 219 fichiers src/app, 795 imports littéraux, 12 racines, fermeture inverse 133 fichiers ; 28 références d’assets distinctes des modules, aucun import littéral non résolu. La revue sémantique des writers n’est pas déclarée exhaustive.
- Risques observés : associations médias absentes des mappings, suppression possible lors d’update, paramètres scalaires incomplets, calcul SQL divergent, récupération Profil automatiquement injectée dans une nouvelle occurrence.
- Proposition de schéma versionné, migration additive, brouillons isolés, calcul unique, associations ordonnées et conservation des fichiers ; choix SQL définitif encore à établir contre les writers et CHECK réels.
- 13 attendus numériques consignés avant développement. Ils ne sont pas des tests exécutés. Les 276 cas v15 devront être confrontés à un calcul indépendant lors de l’implémentation.
- Vérificateur de l’extraction figée exécuté : PASS, 41 arbres, 6725 éléments, 41 PNG, 47 maîtres, 22 styles, 134 variables, usages 11 pages. Ce PASS atteste l’intégrité du paquet Git, pas la fraîcheur Figma complète.
- Lecture Figma actuelle ciblée de 7 états : identités, dimensions, nombres de descendants et textes sélectionnés concordants. Aucune certification des 41 écrans actuels ni comparaison visuelle de produit livré. Capture globale non relancée.
- Décision propriétaire réelle : photothèque seule, photos et vidéos, consignée D-334 et DecisionRecord résolu. Les options non choisies ne constituent pas une autorisation. D-335 (choix A réel du propriétaire, DecisionRecord résolu) complète la sélection multiple, conservation des formats compatibles sans conversion systématique/plafond produit, annulation silencieuse, erreur locale avec Réessayer et commandes accessibles de retrait/ordre. Aucun arbitrage médias supplémentaire n’est demandé à ce jalon.

## Passe distincte et limites

Relecture du dossier contre les sources, séparation données observées/propositions/résultats attendus, contrôle JSON, contrôle des 23 IDs et de la décision résolue, vérification des changements transverses et `git diff --check`. Aucune modification du code applicatif ni du paquet d’extraction figé. Cette passe documentaire n’est pas la revue indépendante VNext ; aucun avis APPROVE de plan n’est revendiqué.

## Prochain acteur et travail restant

Agent : compilation des entrées canoniques et mapping atomique VNext à poursuivre. Les modalités médias sont résolues ; aucun plan final n’est encore présenté au propriétaire. La revue réelle précédera la validation explicite du plan final. Le démarrage autorisé ne vaut pas USER_APPROVAL d’un plan encore inconnu.

Aucun run PRE-3 lancé à ce jalon ; aucune surveillance en arrière-plan annoncée. Aucune nouvelle certification VNext ni campagne d’audit. Branche documentaire publiée comme point de reprise ; PR de plan non ouverte à ce stade.


## Complément après le choix A — état observé le 08/10

Le choix A ne constitue aucune approbation technique anticipée. D-335 et `decision-modalites-import.json` consignent la réponse réelle et son contexte ; PRODUCT/INDEX/API/modèle/architecture/contrats/préparation sont rapprochés sans changement applicatif.

Schéma proposé dans `schema-et-ecritures.md` : JSON canonique versionné et projections scalaires compatibles avec les CHECK existants ; migration additive009 proposée, Catégorie d’occurrence nullable, associations médias ordonnées et métadonnées nullable. Les001..008 restent inchangées. Les écritures littérales observées sont conservées dans `inventaire-ecritures.json` ; les frontières runtime identifiées sont les repositories Définition/Séance et le nouveau writer médias à créer. La compatibilité CR/Fin0 des anciens objets absents reste une proposition de conservation à examiner dans la revue du plan ; elle n’est pas une décision propriétaire acquise.

Cycle médias proposé : fichiers internes durables préparés avant transaction, prêts de brouillon, assets/liens atomiques, partage physique entre copies ; aucune purge globale et aucune suppression de fichier encore référencé. APIs Expo SDK57 consultées ; `expo-video` proposé pour miniature uniquement avec libération native. Aucun moteur/lecture/audio ajouté.

Attendus supplémentaires écrits avant développement :59 assertions sur les23 IDs,94 états/scénarios proposés dont41 Figma,276 fixtures rédactionnelles. `oracle-attendus.py` énumère les contributions temporelles indépendamment du produit/Excel ; ses cibles N6 sont des entrées de test explicitement choisies, pas une reconstruction depuis les montants Excel. Les segments de gras des276 fixtures restent à lier précisément aux tokens du gabarit. Aucun résultat applicatif n’est déduit d’une cohérence de données attendues.

Le mapping de travail couvre6725 lignes et les sources/propriétés fusionnées sont vérifiées parSHA256 ; les65 lignes masquées sont conservées. Il propose un fichier de surface par frame, mais n’est pas encore le mapping atomique final des assertions natives/critères VNext. La classification du décor système doit être contrôlée par sous-arbre ; un nom heuristique seul ne constitue pas une exemption finale.

Fraîcheur Figma :41 arbres/6725 éléments et101 champs capturés concordants avec le paquet ;22 styles/134 variables/2 collections concordants ;105 racines uniques (union maîtres/sets/variantes, chevauchements dédupliqués) concordantes et881 liens instance-maître inchangés. Comparaison par deux digests32bits indépendants et longueur exacte ; pas une garantie cryptographique. Intégrité du paquet original assurée séparément par Git/empreintes. Les compléments critiques60 nœuds et41 topologies de variantes ferment des informations absentes du format historique sans réextraire globalement les écrans ni refaire lesPNG. Ces lectures ne constituent aucune preuve visuelle du produit.

Incidents de lecture corrigés sans modification Figma : requête maîtres trop verbeuse413, puis résultat dépassant20Ko parce que le champ `index.master` chaîne avait été traité comme objet. Requête compactée et identifiants exacts repris ; résultat final sans erreurs/écarts. Aucune évolution Figma n’est attribuée à ces erreurs de requête.

Objets constructeurs réels : `candidate-manifest.json` validé par le constructeur VNext sur la baseline,2426 candidats dont23 slots proposés ; `direct-import-scan.json`,33 racines code proposées et121 importers directs. `fichiers-cible-proposes.json` décrit50 fichiers existants et23 créations proposés. Ils ne constituent pas un ImpactGraph/PlanContract approuvé : chaque importer doit encore être classifié causalement par exigence. Ces propositions ne créent aucun fichier applicatif.

Tests exécutés : `npm ci --ignore-scripts --no-audit --no-fund --fetch-retries=0 --fetch-timeout=20000` réussi sans changement du lock ; six suites Jest baseline réussies,219/219 tests. Repositories et migrations utilisent SQLite réel `NodeSqliteDatabase`, dont tests de fichiers ; aucune migration009 ni fonctionnalité PRE-3 livrée/testée. Résultat, commande et empreinte conservés dans `preuves-baseline-jest.json`. Vérificateur extractionPASS ; oracle13/276 attendus cohérents ; vérificateur planification23 IDs/59 assertions/94 scénarios/6725 mapping cohérents. Tous distinguent preuve de préparation et conformité produit.

Relecture distincte : correction du nom logique `cadenceBeepIntervalSeconds` selon Bip v2 ; contrôle des contributions inconnues avecR120 (unilatéral225, BY_SIDE345 avecPC15, BY_SERIES240), sans réutilisation de la formule produit. Contrôle des noms SQL et chemins réels. Ce travail reste une passe de l’agent, pas la revue indépendante VNext.

Opération : #340 réutilisée, branche `plan/pre3-vnext-20261008`. Main recontrôlé :1ddfb6d144552f578388257adc78db47ab5992c8 ; aucun run in_progress au dernier contrôle. Aucun run PRE-3 lancé, aucune surveillance en arrière-plan. Pas de recertification ni audit du protocole. Aucun livrable installable PRE-3 à ce stade.

À poursuivre : inventaire documentaire autoritatif exigé par `vnext-figma-launch` (le tag normatif n’est pas encore publié), paquet Figma VNext complet, classification/ImpactGraph/PlanContract et atomicité UI, puis revue réelle Claude et validation propriétaire exacte. Les exécutables `claude` et `gh` ne sont pas présents dans cet environnement ; le connecteur GitHub n’expose pas de dispatch workflow. Cette limite de transport devra être résolue au déclenchement concret, sans substitution par une auto-revue ni parcours legacy.

État Git avant publication du complément : changements documentaires uniquement ; aucun src/app/package/lock/migration historique modifié. Le commit porteur du complément sera identifié dans #340 après publication et vérification de l’arbre distant ; la baseline reste celle indiquée en tête. L’état final propre sera vérifié après synchronisation du commit publié.


## Reprise demandée : PlanContract puis revue indépendante

Objectif : poursuivre #340 sur la branche `plan/pre3-vnext-20261008`, départ `acc07c1f0c0c46e2e1e4798e5fec6d88579d1e58`, sans doublon ni développement. Recontrôle GitHub : main inchangée `1ddfb6d144552f578388257adc78db47ab5992c8`, branche inchangée, #340 sans nouveau commentaire, aucun run in_progress ni opération PRE-3 nouvelle ; seule ancienne queue V2 34748621746, hors PRE-3 et non modifiée. Les préalables #334/#339 et le registre final restent satisfaits.

Travail effectué :
- Inventaire autoritatif des 94 états/scénarios ajouté au contrat d’écran existant 13, dans le tag exact VNext ; aucun second document normatif concurrent.
- 276 attendus de segments `{texte,gras}` ajoutés à l’oracle reproductible, avec nombres/unités et côtés en gras conformément aux textSegments Figma observés. Les montants restent issus du ledger indépendant. Ce sont des attendus, pas un résultat de l’application.
- Construction complète du paquet source par `docs/preparation/PRE-3/planification/construire-paquet-vnext.cjs` : 41 frames, 6725 éléments d’écran et fermeture jusqu’à 7369 nœuds ; 471135 propriétés classifiées, dont 243879 REALIZE. Les 65 descendants masqués sont conservés. Les 47 maîtres, ensembles/variantes et compléments critiques déjà acquis sont réutilisés. Aucune réextraction ni mutation Figma.
- Les PNG de frame servent également de référence des nœuds peints IMAGE qu’ils contiennent ; ils ne sont pas déclarés fichiers photo originaux ni médias de démonstration à distribuer.

### Blocage constaté avant le PlanContract

Le paquet complet sérialisé selon le format exact obligatoire `JSON.stringify(packet,null,2)+'\n'` mesure **270258821 octets** dans la première observation locale. `F.build`, `F.validate({ready:true})` et `Launch.validateDocumentCoverage` passent. La lecture de ces vrais octets par **`vnext-live-chain.readGit`** échoue : **`VNEXT_LIVE_PROCESS_FAILED: git: spawnSync git ENOBUFS`**. La fonction `command` impose `maxBuffer: 64 * 1024 * 1024`, soit **67108864 octets**. L’échec survient avant le parsing et la vérification des empreintes par `observeSources`, donc avant `produce` et le PlanContract. La première observation comportait un inventaire documentaire encore non committé à sa revision déclarée : elle prouve le refus de lecture, pas un Launch canonique complet. Le reproducteur versionné lit désormais le document depuis HEAD committé ; sa seconde observation est publiée séparément dans `preuve-lecture-source-vnext.json`.

La classification détaillée constitue encore un candidat de préparation : sa validation de schéma ne vaut ni revue de pertinence/atomicité ni conformité visuelle. La projection conserve tous les champs capturés au lieu de supprimer des éléments, propriétés ou exigences pour entrer dans le transport. Ce constat porte sur la représentation effectivement construite ; il ne prétend pas démontrer l’impossibilité de toute représentation conforme alternative. Aucun PlanContract incomplet n’est rebaptisé final et aucune approbation n’est demandée sur un objet inexistant.

### Comparaison historique, sans correction ni nouvelle campagne

Le mécanisme 64 MiB existe dès `93f5274de8f0a14d3b4777b585572afd9d0f5085` (introduction de `vnext-live-chain.js`, 30 septembre), constaté par `git log -S` et lecture du fichier de ce commit. Il n’a pas été introduit par les derniers correctifs #334/#339 ; aucune attribution aux optimisations récentes. Le paquet historique conservé `v8-consolidation/figma-zones/frozen-source.json` mesure **4519795 octets**, 1 frame, 222 nœuds et 8425 décisions. Le driver historique classe ensuite toutes ces propriétés OBSERVED_ONLY pour le test booléen jetable. Il ne constitue donc pas un succès comparable au paquet PRE-3 complet avec assertions visuelles. Les succès de qualification/résolution 37825871323/37825871378 et le cycle historique clôturé sont conservés, sans reclassification ni nouvelle exécution ; ils ne prouvent pas la capacité de ce transport à 258 MiB. Premier échec conservé à ce volume : reçu PRE-3 ci-joint. Attribution du seuil : démontrée ; existence d’un succès antérieur comparable à 41 frames : non démontrée. Aucun correctif protocole, certification ou audit global lancé dans cette reprise.

### Transport de revue indépendant

Le résolveur courant retourne `claude`, mais `spawnSync(claude,['--version'])` donne **ENOENT** dans cet environnement ; aucun reviewer réel invoqué. Le connecteur GitHub n’offre pas de workflow dispatch. Le workflow existant `kodjo-vnext12-disposable.yml` est explicitement verrouillé sur PR269/branche `protocol/vnext-proof-stability-20260930` et son driver sur VNEXT-12-QUALIF : il ne doit pas être recyclé pour PRE-3. Ce défaut de transport est distinct du refus de lecture et ne constitue pas un verdict de revue. Aucune revue simulée, aucun appel au parcours legacy, aucune surveillance d’arrière-plan.

### Reproduction et reprise sûres

Après checkout du commit de publication contenant cet inventaire :
```sh
node --max-old-space-size=4096 docs/preparation/PRE-3/planification/construire-paquet-vnext.cjs /tmp/pre3-full-vnext-source --prove-read
```
Le script ne modifie pas les branches ni l’application ; il écrit le paquet et les reçus dans le dossier absolu fourni. `--prove-read` ajoute uniquement des objets Git locaux non référencés pour appeler le vrai lecteur canonique sur les octets construits. L’identifiant de ce conteneur local n’est pas un identifiant de run. Il ne déclenche aucune qualification, revue ni écriture distante. Sous Windows, fournir un dossier absolu extérieur au checkout.

La reprise doit traiter uniquement la capacité de représentation/lecture/publication de cette source complète et le transport réel Claude requis ; elle doit conserver les empreintes, toutes les propriétés nécessaires, la couverture documentaire et les invariants de lecture du protocole. Le simple relèvement d’un timeout ou une sélection d’écrans réduite ne résout pas le refus de buffer. Les autres limites possibles (taille des objets produits, publication GitHub, budget de revue) n’ont pas été testées et ne sont pas présentées comme des échecs démontrés. Une fois le paquet effectivement observé en Git, terminer Launch/ImpactGraph/PlanContract/UI atomicité, appeler `vnext-chain.js review` sur le `produced_file` exact et conserver le reçu extérieur au checkout ; ensuite seulement présenter le plan revu pour validation propriétaire. Aucun fichier produced ni configuration de revue factice n’est publié avant cette construction.

### Contrôles de cette reprise et état de livraison

- Oracle : **13 cas normatifs / 276 fixtures avec segments cohérents**, PASS de préparation, applicationTested=false. Le premier contrôle après annotation a détecté une dérive du générateur ; l’oracle a été mis à jour, puis régénéré et recontrôlé avec succès.
- Vérificateur de planification : **23 IDs / 59 assertions / 94 états / 6725 mappings**, PASS de cohérence seule.
- Syntaxe du constructeur : `node --check`, PASS. Schéma Figma et inventaire : PASS sur les données construites ; lecteur Git réel : **BLOCKED/ENOBUFS**.
- Aucun nouveau test applicatif pertinent : aucun code applicatif modifié ; les 219 tests baseline précédemment exécutés ne sont pas annoncés comme preuve PRE-3. Aucun contrôle visuel/perceptif ou appareil exécuté, aucune action iPhone nécessaire à ce blocage.
- Fichiers modifiés dans cette reprise : contrat d’écran 13 ; oracle-attendus.py ; attendus-phrases-276.json ; construire-paquet-vnext.cjs ; preuve-lecture-source-vnext.json ; ce rapport.
- **État VNext : préparation source avant PLAN, BLOCKED**. PlanContract final non produit, revue indépendante non lancée, validation propriétaire non sollicitée. Suivi unique : https://github.com/MyUncried/Application-Routine/issues/340 ; aucun run PRE-3 à suivre.
- Commit contenant ce rapport : commit de publication de cette section, identifié par l’historique Git et #340. L’état Git est vérifié propre après synchronisation de la publication ; aucun changement src/app/package/lock/scripts.


### Seconde passe sur la source réellement committée

Le reproducteur a été exécuté depuis **1dd10209d763fcd983aa0f1fcbb5c7f83418f7cc**, qui contient le constructeur et l’inventaire autoritatif. Le contrat d’écran a été lu par `git show` à ce SHA exact, et non depuis un fichier de travail. Résultat : schéma source et inventaire **PASS**, 270258821 octets, SHA-256 **4b958596fcf1dcf798da5dda1edf77303e7a90a6083cd163de004089098793d4**, contract_hash **c73f0c49a81e77d0da0f8a5001a9dc45beb165501aa3f24254309ae84a6e227a**. Le véritable `readGit` reproduit **ENOBUFS** sur ces octets : le problème est distinct de l’inventaire initial non committé. Le reçu versionné remplace le premier reçu provisoire, conservé dans le commit 1dd10209. Pour reproduire les empreintes exactement, checkout de **1dd10209** puis commande documentée ci-dessus ; le Git commit local conteneur peut différer à cause de son timestamp, mais le blob et les empreintes du paquet doivent être identiques.

Oracle et vérificateur de planification recontrôlés depuis ce commit : PASS dans leur portée de préparation. Git propre et zéro diff applicatif/protocole avant publication de cette seconde preuve. L’opération reste **#340, BLOCKED avant PLAN** ; aucun identifiant de run PRE-3 ou de revue n’existe. La validation propriétaire d’un plan final reste future, pas demandée sur un draft.


## Correction ciblée de lecture — reprise du pilotage PRE-3

Responsable : pilote ChatGPT dans la conversation en cours. Suivi réutilisé : #340 ; branche existante `plan/pre3-vnext-20261008`. Le propriétaire n’a aucun test technique de lecture, de calcul ou de base de données à effectuer.

Le codec sans perte `F.pack/F.unpack` existait déjà. Le correctif raccorde ce format aux lecteurs source/Launch/recipe/live-chain, tout en conservant le format historique et les contrôles d’empreintes des octets réellement stockés. Le seuil Git de 64 MiB, les gates, acteurs et règles d’approbation ne changent pas. Le constructeur PRE-3 accepte `--packed`.

Preuve réelle depuis 2e2b1073 : paquet complet compact **27548991 octets**, **7369 nœuds / 471135 propriétés / 243879 REALIZE / 41 frames** ; reconstruction logique identique, schéma/inventaire et `vnext-live-chain.readGit` **PASS**. Reçu distinct `preuve-source-compacte-vnext.json` ; le reçu ENOBUFS antérieur reste conservé. Préparation par le véritable constructeur `Launch.requirements` : **6383 exigences / 7369 unités**, PASS en 152049 ms ; ce résultat n’est pas un Launch gelé puisque le chemin source doit encore être publié en Git.

Tests ciblés : `node --test tests/kodjo/vnext-figma-source-storage.pilot.js tests/kodjo/vnext-figma-source.pilot.js tests/kodjo/vnext-figma-launch-review.pilot.js` : **35/35 PASS**, format historique, codec sans perte, dérives refusées, vraies lectures Git et validation Launch. Les premiers essais ont révélé des régressions dans l’ordre des diagnostics et une mutation de fixture ; corrigés sans affaiblir les assertions existantes. Aucun driver de qualification, campagne d’audit, workflow ou revue Claude lancé.

Seconde passe de couverture : les 94 états précédents étaient **41 références Figma + 53 scénarios documentaires PRE-3**, pas toute l’application. P3-17 avait des assertions techniques mais aucun état documentaire fonctionnel de réouverture. Un seul état manquant a été ajouté à l’inventaire autoritatif du contrat 13 : **95 = 41 + 54**. Aucune extension ni réduction du périmètre. Le vérificateur vérifie désormais aussi la présence des 23 IDs dans les états. Le paquet devra être régénéré depuis ce nouveau document committé avant le gel canonique.

Étape actuelle : préparation source débloquée localement ; publication du correctif ciblé, puis gel source/Launch, ImpactGraph, PlanContract et UIContract. Le pilote doit ensuite exécuter la revue réelle Claude sur le produced exact ; le propriétaire valide seulement le plan final revu. Le défaut distinct de transport Claude reste démontré (ENOENT ici, connecteur sans dispatch) et doit être résolu avant de déclarer une revue engagée. Aucun run PRE-3 distant actif ; aucun mécanisme de surveillance en arrière-plan. Aucun code applicatif modifié.


### Publication source complète et limite du connecteur

Tentative réelle de `github.create_blob` sur le paquet compact : refus HTTP400 « MCP request body is invalid or exceeds the 16 MiB limit ». Les 64 MiB du lecteur Git étaient donc débloqués, mais le transfert de 27,5 Mo restait bloqué. Correction ciblée supplémentaire : enveloppe `kodjo.vnext.figma-storage.v1`, gzip/base64 du codec compact existant, avec empreinte de l’entrée décompressée, validation de chaque niveau et empreinte des octets stockés. Le décodeur refuse les champs supplémentaires, base64 non canonique, corruption et formats imbriqués ; décompression bornée à 64 MiB du format compact, sans relèvement du seuil. Le format historique reste inchangé.

Sur la source normative committée a221ab96 : **7184414 octets**, SHA256 **b70da22f85019d3cb390c90006294286aa57b2f074afcf2c2fc8f8d54f31ee56**, même contract_hash **4373280fd2b309bc9f150ea0b4f1462df0c19a370dd03e0c15142c061d83fcf9** ; reconstruction intégrale PASS. Lecture `vnext-live-chain.readGit` réelle PASS sur un conteneur Git local non référencé ; `github.create_blob` réel PASS, SHA Git **552b30d35fed8681e768ed074376f182a276c1dc**. Les **41 frames / 6725 éléments d’écran / 7369 nœuds / 471135 propriétés / 95 états** restent identiques. Source destinée à `docs/preparation/PRE-3/planification/figma-source-vnext.json`. Reçu séparé `preuve-stockage-compresse-vnext.json`.

Tests ciblés définitifs : les mêmes trois fichiers, **37/37 PASS** (dont lectures Git, Launch et observeSources dans les deux formats), sans nouvelle certification. Aucun code applicatif modifié. Les étapes ImpactGraph/PlanContract/UIContract et revue réelle restent distinctes de cette preuve de transfert ; elles ne sont pas déclarées réalisées. Le transport Claude reste absent ici et doit être établi par le pilote avec un payload exact, jamais par réutilisation de PR269 ou d’un workflow V2.


### Launch source canonique réellement exécuté

`Launch.launch` a exécuté dans l’ordre CAPTURE / RECONCILE / INVENTORY_AND_SCENARIOS_VALIDATED / GIT_FREEZE / ATOMIC_REQUIREMENTS, avec `persist` lisant les octets réels de **4e41c46f** par le lecteur Git VNext. La capture réutilise l’extraction #333 avec ses compléments/fraîcheur ; aucune nouvelle capture globale ou lecture Figma temps réel n’est prétendue. Document autoritatif a221ab96, référence logique 4373280fd2b309bc9f150ea0b4f1462df0c19a370dd03e0c15142c061d83fcf9.

Résultat **PASS : 6384 exigences / 95 états / 41 frames**, checkpoint contract_hash **da65ec7030c6836ef98202c11fe5af2700fa4393b9f12bdde7d071416073e174**. Reçu `preuve-launch-source-vnext.json` ; reproducteur `lancer-source-vnext.cjs` avec dossier absolu extérieur au checkout. Le checkpoint complet local mesure 121634124 octets ; il n’est pas présenté comme publié en Git, ni comme PlanContract. La commande n’appelle pas `produce`, `review`, un workflow ou Claude.

```sh
node --max-old-space-size=4096 docs/preparation/PRE-3/planification/lancer-source-vnext.cjs /tmp/pre3-canonical-reproduction
```

Cette preuve clôt le blocage de préparation source, pas PRE-3. Le PlanContract/UIContract finaux restent à construire par le pilote ChatGPT ; la revue indépendante reste à lancer par le chemin réel VNext. Claude absent de cet environnement et absence de dispatch du connecteur restent le défaut de transport identifié. Aucun run distant ni surveillance en arrière-plan, aucune approbation propriétaire demandée.
