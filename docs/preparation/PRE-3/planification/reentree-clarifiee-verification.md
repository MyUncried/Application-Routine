# PRE-3 — réentrée après clarification : correction et preuves

Cette publication remplace le diagnostic de blocage du 09/10 après la décision numérique. La clarification A reste résolue ; elle n’approuve pas le plan.

## Correctif et qualification

PR technique limitée : https://github.com/MyUncried/Application-Routine/pull/343 ; candidat 8378cf4a99403bff74337e25406633e4666c967e. Huit fichiers de protocole/tests, aucun développement PRE-3. Opération existante #340.

Le constructeur accepte maintenant CLARIFICATION_REQUIRED avec une décision résolue liée à la tranche, à l’acteur autorisé, aux sources, aux exigences et au constat. La validation de préparation/admission relit les décisions Git, vérifie leurs SHA-256 et leur liaison à l’enveloppe. L’AllowedChangeSet scellé conserve la décision et le hash du rapport initial ; l’approbation du plan reste séparée.

Les deux corrections précédentes sont incluses : requirement_kind explicite dans l’inventaire documentaire figé et observation de contenu Git des candidats effectivement référencés par le catalogue de revue. Compatibilité des anciens inventaires et paquets conservée.

Tests locaux : 64/64 PASS, 0 échec/ignoré, sur vnext-revision-contract, vnext-clarification-git, vnext12-revision-supervisor, vnext-live-chain et vnext-figma-launch-review. Le test de bout en bout prépare une révision clarifiée et son dossier d’approbation ; les réponses de modèle de ces tests sont des fixtures explicites. git diff --check et contrôle syntaxique du vérificateur : PASS. Les cinq fichiers de la première publication du correctif ont été relus via Git et comparés aux fichiers testés : identiques.

## Preuve sur le paquet PRE-3 réel

Commande exécutée localement, sans modèle : verifier-reentree-clarifiee.cjs avec le produced exact de 1d424791 et le reçu lisible original fourni par Hermann.

- Rapport original : CLARIFICATION_REQUIRED, hash 4f71752587436a8cc338e2cb74ee650752e9d736502a51b3668241ed0118119d, inchangé.
- Reçu original : 56568e7ae81d44c60cb5185d0b69f3099fb64650953804dbf322e478d3845ce9.
- Décision : afc359a46242aa81942538621f340f23c9503426b4adcb8a7e57f5f7020cc5a8.
- AllowedChangeSet : 481f2b88d48c128a01c14014fdc4e952a17d6bd985952ea20fad9faab93d2d39.
- Réentrée : REQUIREMENTS ; 13 constats bloquants, 30 cibles autorisées, 411 dérivées, 306444 préservées.
- Résultat : PASS. Le JSON de résultat est publié à côté de ce rapport. Le contrat volumineux et ses parties sont reconstructibles par le vérificateur, sans appel Claude.

Correction de diagnostic : FND-8b2fcbd1b778ea06ee6cb2f0 possède six dependency_target_ids dans le reçu canonique et le registre original. L’affirmation antérieure « aucune dépendance ciblée » était erronée. Le garde-fou PLAN_ROOT_TOO_BROAD reste inchangé ; il ne bloque pas ce constat réel. Aucun appel indépendant supplémentaire n’est nécessaire pour retrouver ces six cibles déjà fournies.

## Statut et suite autorisée

Le défaut de passage après clarification est corrigé et sa réentrée sur le paquet réel est vérifiée localement. Son activation sur main attend la qualification GitHub Linux/Windows de #343 et la fusion vérifiée. Aucune conformité PRE-3 ni résolution des 13 constats n’est déclarée.

La révision des exigences, impacts, plan et critères UI doit appliquer les constats dans les bornes du contrat obtenu, conserver le registre original, puis passer la revue indépendante et la validation explicite du plan par le propriétaire. Le PlanContract et le paquet figé initiaux restent des preuves historiques, sans approbation anticipée.

## Qualification GitHub et liaison historique

Le run 37929185468 a échoué sur VNEXT_EQ_CASE_SOURCE_CHANGED : quatre références à vnext-revision-contract.pilot.js conservaient l’ancien hash et les anciennes lignes après les ajouts de tests. Le contrôle complet local a reproduit ce seul échec (477 PASS, 1 FAIL). Les quatre références ont été actualisées, sans changement des sujets, identifiants, assertions et règles historiques. Huit champs de métadonnées changent au total ; les lignes d’origine du fichier de tests restent intégrales et dans leur ordre.

Après correction : node --test --test-reporter=spec tests/kodjo/vnext*.pilot.js : **478/478 PASS**, 0 échec/ignoré. Le nouveau candidat est 8378cf4a99403bff74337e25406633e4666c967e. La PR a automatiquement déclenché le run VNext 37929798905, https://github.com/MyUncried/Application-Routine/actions/runs/37929798905, et la suite pilote 37929798826. Il n’y a pas de relance de l’ancien candidat, de recertification générale ou d’appel Claude. Résultats distants encore attendus ; pas de fusion annoncée.
