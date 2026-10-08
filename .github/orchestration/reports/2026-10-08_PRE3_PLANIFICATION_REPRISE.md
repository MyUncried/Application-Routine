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
