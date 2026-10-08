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
- Décision propriétaire réelle : photothèque seule, photos et vidéos, consignée D-334 et DecisionRecord résolu. Les options non choisies ne constituent pas une autorisation. Formats et états d’import restent à arbitrer.

## Passe distincte et limites

Relecture du dossier contre les sources, séparation données observées/propositions/résultats attendus, contrôle JSON, contrôle des 23 IDs et de la décision résolue, vérification des changements transverses et `git diff --check`. Aucune modification du code applicatif ni du paquet d’extraction figé. Cette passe documentaire n’est pas la revue indépendante VNext ; aucun avis APPROVE de plan n’est revendiqué.

## Prochain acteur et travail restant

Hermann : arbitrage fonctionnel des modalités médias manquantes, sur proposition concrète du plan de travail. L’agent poursuit ensuite les writers/compatibilité, le mapping atomique, les entrées canoniques et la revue indépendante avant de demander la validation explicite du plan final. Le démarrage autorisé ne vaut pas USER_APPROVAL d’un plan encore inconnu.

Aucun run PRE-3 lancé à ce jalon ; aucune surveillance en arrière-plan annoncée. Aucune nouvelle certification VNext ni campagne d’audit. Branche documentaire publiée comme point de reprise ; PR de plan non ouverte à ce stade.
