# Rapport final de conformité — Bilatéralité

> Mise à jour du 24 septembre 2026 : D-189 supersède l’exposition fonctionnelle de la bilatéralité au niveau Tour. Les conclusions historiques relatives au Tour bilatéral doivent être lues comme traces de conception antérieure, pas comme exigences actives.

Date : 14 septembre 2026 — rectification après validation visuelle de la PR #131.

## Baseline et périmètre

La rectification complémentaire part de `main@aea3e6453fc801f4d73a118f0887c407149730eb`, de la PR applicative #131 au HEAD `df38ade5e8737ed8f59a3a7472ebe9b168a85145` et du fichier Figma `G6RY5Ebhgwb4AHIOYDwwvg`. Le corpus contrôlé comprend PRODUCT, les spécifications concernées, la matrice et ce rapport. Les fichiers applicatifs restent inchangés pendant cette étape documentaire.

## Résultat

| Axe | Résultat | Preuve |
| --- | --- | --- |
| Priorité Tour / Activité | CONFORME | PRODUCT ; 00 ; 04 ; D-145/D-146 ; RM-146 ; CE-BIL-01/02/02A. |
| Contrôle Tour | CONFORME APRÈS RECTIFICATION | Géométrie Figma conservée à `42 × 34 pt`, espace `8 pt`; affichage intégral de `D→G`/`G→D`; tiret `–` centré en unilatéral. |
| Confirmation conditionnelle | CONFORME APRÈS RECTIFICATION | Condition inchangée ; titre et message exacts réalignés dans PRODUCT, 03, D-146 et CE-BIL-02. |
| Carte Activité | CONFORME APRÈS RECTIFICATION | Petit indicateur `D→G` / `G→D` pour la direction propre de l’Activité ; aucun changement de côté n’est exposé au niveau Tour depuis D-189. |
| Contrôle Activité | CONFORME | Déjà sous Séries ; `74 × 42 pt`, grille `74/124/124`, espaces `8/10 pt`; `3704:5021`. |
| Synthèse | CONFORME APRÈS CLARIFICATION | Clause développée réservée à l’écran Ajouter/Modifier une Activité dans PRODUCT, 06, 08, D-154, RM-152 et CE-T01-13 ; jamais dans le texte de la carte de Composition. |
| Durée | CONFORME | `Durée totale` et borne `≥` dans PRODUCT, 06, D-155, RM-153, CE-T01-13 ; `3561:4695`, `3561:7673`, `3561:7802`. |
| Calculs | CONFORMES À LA RECETTE | Aucun code de calcul modifié. L’arbitrage produit du 14 septembre 2026 conserve la règle existante : `C` Pauses si `R = 0`, sinon `C − 1` Pauses puis Récupération. |
| T03 | HORS PÉRIMÈTRE | Aucun contrat ni comportement T03 étendu. |

## Sources Figma

- `Controls / Sides — Source exact` : `3704:5021`, variantes `74 × 42 pt`;
- `Controls / Tour Sides — Source exact` : `3705:5021`, `42 × 34 pt`; la géométrie est confirmée, tandis que le nouvel état unilatéral `–` supersède l’état vide de cette instance ;
- `Indicator / Sides — Source exact` : `3706:5020`, `42 × 20 pt`;
- Activité unilatérale `3542:4656`, propre `D→G` `3679:4880`, propre `G→D` `3724:5428`;
- Composition `2028:11700`, Tour `D→G` `3722:5061`, Tour `G→D` `3722:5207`.

## Ambiguïtés supprimées

- « après Nombre de tours » remplacé par parent, ligne, coordonnées, dimensions et espace ;
- « après le segment de mode » remplacé par la position déjà présente : ligne 2, colonne 1 sous Séries ;
- confirmation systématique remplacée par la condition exacte ;
- `Durée minimale` remplacé par `Durée totale : ≥ …`;
- direction propre distinguée explicitement de l’héritage du Tour.

## Contrôles réalisés

Recherche transverse des formulations historiques ; cohérence PRODUCT/décisions/règles/API/contrats/matrice ; contrôle visuel des trois modes et des deux directions ; contrôle DSF ; aucune modification applicative, protocolaire, de calcul ni T03.

## Arbitrage postérieur au contrôle

Le 14 septembre 2026, le responsable produit a confirmé dans l’issue #52 que, pour `C` Séries, la Pause est comptée `C` fois lorsque `R = 0`, y compris après la dernière Série, ou `C − 1` fois lorsque `R > 0`, la Récupération remplaçant alors la dernière Pause. Cette décision conserve le comportement validé en recette T02-S02 et supersède les formulations documentaires inconditionnelles à `C − 1` Pauses. Les sources actives, le registre D-156 et les formules conditionnelles ont été réalignés sans modification applicative.

## Écarts réservés à la reprise de développement

La PR #131 au HEAD `df38ade5e8737ed8f59a3a7472ebe9b168a85145` doit être corrigée uniquement sur les écarts bilatéraux consignés dans le commentaire `5670983656` de l’issue #52 : textes exacts de confirmation, tiret unilatéral du Tour, affichage intégral et position des indicateurs, et séparation entre synthèse de l’éditeur et texte de la carte de Composition. Aucun calcul validé, aucune fonctionnalité T03 et aucun ajustement général différé ne sont inclus. Le plan technique et sa revue doivent être révisés avant une nouvelle `RESUME_DELTA`.
