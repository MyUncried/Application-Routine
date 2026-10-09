# PRE-3 — décision numérique résolue et correction ciblée après revue

## Décision propriétaire

La réponse « oui je valide » confirme l’option A de DEC-b3ac043fa59d2b6939307404 : rétablir les séparateurs, sans modifier les valeurs ni les règles. Le DecisionRecord RESOLVED, publié dans 3889e14b1dbfe75aa9cb7163ffc3f6c6909012f2, porte l’empreinte afc359a46242aa81942538621f340f23c9503426b4adcb8a7e57f5f7020cc5a8. Cette décision n’approuve pas le PlanContract.

La revue initiale, son verdict CLARIFICATION_REQUIRED et son reçu logique 56568e7ae81d44c60cb5185d0b69f3099fb64650953804dbf322e478d3845ce9 restent inchangés. Aucun constat n’est déclaré résolu par une nouvelle revue.

## Correctifs publiés dans la branche existante

Révision de code et tests : cc78e33dbdc6eb87597619e5719d1865f98c2f6a, branche plan/pre3-vnext-20261008 ; opération #340. Ces changements ne constituent pas une activation sur main.

1. vnext-figma-launch.js accepte requirement_kind dans l’inventaire documentaire autoritatif et vérifie son appartenance aux catégories normatives du registre. Ce typage explicite doit être figé dans la source ; il ne peut être inventé par le constructeur technique. Les anciens inventaires conservent leur valeur UI et les exigences visuelles restent UI.
2. vnext-live-chain.js observe les candidats effectivement référencés dans le catalogue de revue : impacts, préservation, composants réutilisés et candidats de recherche. Les nouvelles observations portent le contenu Git à la révision exacte et son SHA-256 ; les emplacements de création ont un contenu et une empreinte nulls. Les anciens paquets restent vérifiables avec leur périmètre d’observation historique.

## Contrôles exécutés localement

- node --test tests/kodjo/vnext-figma-launch-review.pilot.js tests/kodjo/vnext-live-chain.pilot.js : 34 tests, 34 PASS, 0 échec, 0 ignoré.
- node --test tests/kodjo/vnext-revision-contract.pilot.js : 15 tests, 15 PASS, 0 échec, 0 ignoré.
- git diff --check : PASS.

Les nouveaux contrôles vérifient le typage documentaire FUNCTIONAL/DATA/MIGRATION/PRESERVATION/TECHNICAL/NON_FUNCTIONAL, le maintien des exigences visuelles UI, le refus d’un type invalide ou d’une divergence avec l’inventaire autoritatif, le contenu Git d’un composant réutilisé hors write_scope, le refus d’une observation falsifiée ou d’un périmètre inconnu, et la lecture d’un ancien paquet scellé.

Il s’agit de tests techniques locaux, avec fixtures explicites. Ils ne prouvent ni conformité PRE-3, ni comparaison visuelle, ni résultat perceptif/appareil, ni nouvelle revue indépendante.

## Blocage de révision reproduit

L’enveloppe planning-envelope.js accepte REVISION avec created_from.kind = CLARIFICATION_RESOLVED. Le constructeur revision-contract.js::buildAllowedChangeSet refuse toutefois le rapport original CLARIFICATION_REQUIRED avec VNEXT_REVISION_REVISE_REPORT_REQUIRED. Le validateur final vnext-live-chain.js::revisionEvidence exige lui aussi un rapport initial REVISE (VNEXT_LIVE_REVISION_BASE_NOT_REVISE).

Le test « PRE-3 diagnostic » reproduit cette incompatibilité entre l’enveloppe et le constructeur. Il est volontairement une preuve du comportement actuel, pas une preuve de réparation. Le DecisionRecord résolu ne dispose pas encore d’une liaison vérifiée dans cette chaîne de révision.

Un second garde-fou demeure : FND-8b2fcbd1b778ea06ee6cb2f0 cible PLAN_CONTRACT sans dependency_target_ids ; buildAllowedChangeSet le refuse avec VNEXT_REVISION_PLAN_ROOT_TOO_BROAD. Ses cibles doivent être précisées avec une preuve indépendante, sans remplacer ni réécrire le rapport original.

Impact : impossibilité de finaliser une révision VNext canonique admissible, même si la rédaction est clarifiée. Statut : blocage technique démontré, non résolu. Aucun lancement Claude supplémentaire n’est justifié par les seuls correctifs publiés ici. Aucune nouvelle action du propriétaire ni approbation du plan n’est demandée.

## Travail restant sur le plan

Les sources figées, le paquet canonique et la recette ne sont pas reconstruits par cette publication. Restent notamment : typage et rattachement exact des états aux P3-01..P3-23 ; critères INTERACTION et preuves natives/accessibilité ; granularité des obligations de tests et oracles ; préservation et adaptation des consommateurs/tests ; distinction des propriétés perceptibles et des propriétés internes ; résolution causale des constats et revue indépendante de la révision.

Lancer l’ancien lanceur initial ne teste pas cette révision. Le périmètre PRE-3 demeure intégral.
