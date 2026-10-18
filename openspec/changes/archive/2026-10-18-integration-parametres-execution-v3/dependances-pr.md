# Dépendances avec les PR — intégration v3.0

> **Mise à jour du 18/10/2026 : les trois PR sont intégrées** à `docs/openspec-revision` (lots `V3-14` à `V3-21`) et fermées sans fusion. Traitement détaillé : [pr/traitement-pr.md](pr/traitement-pr.md). Le texte ci-dessous décrit l’état préparatoire.

- **État au 18/10/2026** : PR inchangées et ouvertes — #363 `d2386c8d`, #370 `6cf3634a`, #371 `2c050d0e` (brouillon) ; `main` = `6656fefc`. Ce chantier ne les a ni modifiées, ni commentées, ni fusionnées.
- **Outil** : `revision-documentation-kodjo/outils/reporter-pr.mjs`, relancé sur l’état intégré. Il produit [pr/pr-363-report.patch](pr/pr-363-report.patch), [pr/pr-370-report.patch](pr/pr-370-report.patch), [pr/pr-371-report.patch](pr/pr-371-report.patch) et leurs tableaux `.tsv`. Ces correctifs ne sont **pas appliqués** : ils sont destinés aux chantiers propriétaires et remplacent ceux du lot 6.
- **Vérification** : `git apply --check` réussit sur l’état final pour chaque correctif seul, et en séquence (#363 → #370 → #371, #371 → #370, #370 → #371 → #363).

## Synthèse

| PR | Blocs | Reportés automatiquement | Reportés par résolution déclarée | Sans objet | Effet de l’intégration v3 |
|---|---|---|---|---|---|
| #363 (captures) | 5 | 5 | 0 | 0 | Aucun conflit : les captures de la feuille ne sont pas concernées par #363 |
| #370 (phases) | 36 | 18 | 17 | 1 | 12 blocs de CE-UI-10, 1 du ch. 01 et, depuis D-415, la section des phases du ch. 08 (après le paragraphe N=1) suivaient des lignes réécrites ; ils sont placés après les lignes réécrites, à la même position. Le bloc qui réécrit l’ordre de la feuille est sans objet (voir ci-dessous) |
| #371 (paramètres) | 22 | 12 | 3 | 7 | 3 nouveaux blocs sans objet au ch. 06 : la ligne de la feuille et le cas mixte portent déjà « Paramètres d’exécution » ou le nom de frame actuel ; 1 bloc placé après la révision du 13/10 réécrite |

Résolutions déclarées : [pr/resolutions-manuelles-370.json](pr/resolutions-manuelles-370.json) et [pr/resolutions-manuelles-371.json](pr/resolutions-manuelles-371.json), qui reprennent celles du lot 6 et ajoutent les cas de l’intégration v3 (raison écrite pour chacun).

## Contenu des PR contredit par les décisions du 18/10/2026

Le report place le texte des PR sans le modifier. Les passages suivants contredisent les décisions D-403 à D-413 et devront être adaptés par le chantier propriétaire au moment du rebase ou de l’application du correctif.

| PR | Passage | Décision | Adaptation attendue |
|---|---|---|---|
| #370 | Ordre « Mode → Phases → Séries → régime … chevron indépendant … Bip de cadence → Total » (CE-UI-10, rubrique 7) — bloc sans objet | D-413, D-410 | Placer « Phases de l’exercice » (Avec / Sans) en tête du cadre 2 Séries, avant Nombre de séries ; tableau Libellé/Durée sous la ligne lorsqu’il est déployé |
| #370 | « Aucune crée la première phase sans chevron ; chevron seulement avec liste existante » (ch. 06 et CE-UI-10) | D-410, PR-01 | Options Avec / Sans ; chevron à l’intérieur de l’option Avec, haut si déployé, bas si replié ; repli sans perte |
| #370 | « Réutiliser la ligne de tableau à deux colonnes et son pied » (CE-UI-10, rubrique 10) ; « commandes d’ajout/retrait » | D-413, PR-02 | Tableau des phases sans pied ± ni lignes de boutons +/−, fond blanc sans contour, lignes de 36 px |
| #370 | Phases « incompatibles avec … une cible À l’échec » | D-412, RO-01 | La roulette propre à une phase garde son option À l’échec ; incompatibilité à confronter : Q-V3-17 |
| #370 | Libellé « Phases » | PR-01 | « Phases de l’exercice » |
| #371 | « Le pied commun reste le réglage de la cellule active » (CE-UI-10, rubrique 9) | D-413 | Retirer ; la première phrase du même ajout (roulette ouverte depuis la cellule, seule cette cellule modifiée) est conforme à RM-250 |
| #371 | « Le pied ± de cible Durée utilise un pas de 5 s » (« Bornes confirmées ») | D-413 | Retirer la mention du pied ; le pas de 5 s de la roulette est inchangé |
| #371 | « Feuille Modalités d’exécution — états intégrés » → « ### Feuille Paramètres d’exécution » (ch. 06) | — | Toujours applicable (titre conservé par l’intégration pour ne pas entrer en conflit) |

## Ordre de fusion recommandé

1. Revue indépendante ChatGPT de `docs/openspec-revision` (lot 6 et intégration v3).
2. Pour chaque PR : rebase sur la branche, ou application de `pr/pr-<n>-report.patch`, puis adaptation des passages ci-dessus et contrôles.
3. Fusion dans `main`, sur décision de Hermann seulement.
