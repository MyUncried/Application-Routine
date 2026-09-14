# Rapport final de conformité — Bilatéralité

> **Correspondance de roadmap (D-166)** — Le Catalogue des Activités constitue désormais T03 du MVP. Toute référence au moteur d’Exécution dans ce livrable est portée par T04, anciennement T03. L’ancienne T04 et les tranches suivantes sont décalées à partir de T05.

Date : 13 septembre 2026.

## Baseline et périmètre

La rectification part de `main@6958c09a8c1f37b5dfaee4ff57b4c13c25916084`, de la PR applicative #111 non fusionnée et du fichier Figma `G6RY5Ebhgwb4AHIOYDwwvg`. Le corpus contrôlé comprend PRODUCT, INDEX, les spécifications `00` à `13`, la matrice et ce rapport. Les fichiers applicatifs, le protocole, le plan technique et la revue de `V2-BILAT-01` ont été lus seulement pour relever les écarts ; ils ne sont pas modifiés.

## Résultat

| Axe | Résultat | Preuve |
| --- | --- | --- |
| Priorité Tour / Activité | CONFORME | PRODUCT ; 00 ; 04 ; D-145/D-146 ; RM-146 ; CE-BIL-01/02/02A. |
| Contrôle Tour | CONFORME | `42 × 34 pt`, espace `8 pt`, parent `2028:11743`, frames `2028:11700`, `3722:5061`, `3722:5207`. |
| Confirmation conditionnelle | CONFORME | PRODUCT, 03, 04, D-146, RM-147, API-SIDE-02, CE-BIL-02. |
| Carte Activité | CONFORME | `3706:5020`, `42 × 20 pt`, `x=311`, `y=24,5`; absence sous Tour bilatéral. |
| Contrôle Activité | CONFORME | Déjà sous Séries ; `74 × 42 pt`, grille `74/124/124`, espaces `8/10 pt`; `3704:5021`. |
| Synthèse | CONFORME | Clause propre dans PRODUCT, 06, 08, RM-152, CE-T01-13 ; `3679:4880`, `3724:5428`. |
| Durée | CONFORME | `Durée totale` et borne `≥` dans PRODUCT, 06, D-155, RM-153, CE-T01-13 ; `3561:4695`, `3561:7673`, `3561:7802`. |
| Calculs | CONFORMES À LA RECETTE | Aucun code de calcul modifié. L’arbitrage produit du 14 septembre 2026 conserve la règle existante : `C` Pauses si `R = 0`, sinon `C − 1` Pauses puis Récupération. |
| T04 | HORS PÉRIMÈTRE | Aucun contrat ni comportement T04 étendu. |

## Sources Figma

- `Controls / Sides — Source exact` : `3704:5021`, variantes `74 × 42 pt`;
- `Controls / Tour Sides — Source exact` : `3705:5021`, `42 × 34 pt`;
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

Recherche transverse des formulations historiques ; cohérence PRODUCT/décisions/règles/API/contrats/matrice ; contrôle visuel des trois modes et des deux directions ; contrôle DSF ; aucune modification applicative, protocolaire, de calcul ni T04.

## Arbitrage postérieur au contrôle

Le 14 septembre 2026, le responsable produit a confirmé dans l’issue #52 que, pour `C` Séries, la Pause est comptée `C` fois lorsque `R = 0`, y compris après la dernière Série, ou `C − 1` fois lorsque `R > 0`, la Récupération remplaçant alors la dernière Pause. Cette décision conserve le comportement validé en recette T02-S02 et supersède les formulations documentaires inconditionnelles à `C − 1` Pauses. Les sources actives, le registre D-156 et les formules conditionnelles ont été réalignés sans modification applicative.

## Écarts réservés à la reprise de développement

Le plan technique `V2-BILAT-01` contient encore « contrôle Côtés après le segment de mode et avant les paramètres », « contrôle après Nombre de tours » et une confirmation systématique. La PR #111 contient encore le libellé applicatif `Durée minimale`. Ces points devront être réalignés par `RESUME_DELTA` après validation de la PR documentaire, sans toucher aux calculs.
