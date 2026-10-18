# Dépendances et conflits Git à résoudre avant fusion

- **État au 18/10/2026 :**
  - les trois PR sont ouvertes et inchangées depuis les 15 et 16/10 : #363 `d2386c8d`, #370 `6cf3634a`, #371 `2c050d0e` (brouillon) ;
  - `main` = `6656fefc` ;
  - aucune PR n'a été modifiée, fusionnée ni commentée par ce chantier.
- **Outil :** `outils/reporter-pr.mjs`. Il retrouve chaque modification d'une PR dans la documentation restructurée et produit un correctif repositionné. La comparaison se fait sans espaces, sans cibles de liens, sans marques de titre et sans préfixes B-nnn. Les cas ambigus sont départagés par le contrat d'écran puis par le titre précédent.
- **Correctifs produits :** `pr-<n>-report.patch`. Ils sont vérifiés par `git apply --check` sur le HEAD final et ne sont **pas appliqués**. Ils sont destinés au chantier propriétaire de chaque PR.
- **Détail par bloc :** `pr-<n>-report.tsv`.

## Synthèse

| PR | Fichiers en conflit (fusion simulée `git merge-tree`) | Blocs modifiés | Reportés automatiquement | Reportés par résolution déclarée | Sans objet |
|---|---|---|---|---|---|
| #363 | ch. 06 | 5 (chapitres) + images PNG | 5 | 0 | 0 |
| #370 | ch. 03, 04, 06, 08, 09, 10, 11, 13 | 36 | 31 | 5 | 0 |
| #371 | ch. 06, 08, 13 | 22 | 16 | 2 | 4 |

Les conflits viennent de la réorganisation des fichiers (lot 6) : les lignes modifiées par les PR ont changé de place. Leur texte, lui, est presque toujours conservé. Le correctif repositionné remplace donc la résolution manuelle de ces conflits.

Les trois correctifs couvrent désormais **tous** les blocs des PR. `git apply --check` réussit sur le HEAD final pour chacun, ainsi qu'en séquence (#363 → #370 → #371, et #371 → #370).

## Blocs résolus par déclaration (`--manuel`)

Les blocs que l'outil ne pouvait pas placer seul sont résolus par une déclaration explicite : `resolutions-manuelles-370.json` et `resolutions-manuelles-371.json` (clé `fichier|bloc|rang`, ancre unique, mode, raison). Les résolutions sont appliquées avant le calcul du correctif. Le statut apparaît dans `pr-<n>-report.tsv` : `REPORTE-MANUEL` ou `IGNORE-MANUEL`.

| PR | Bloc | Raison | Résolution appliquée |
|---|---|---|---|
| #370 | ch. 05, bloc 1 (4 lignes ajoutées) | Contexte « --- » présent 15 fois | Insertion avant « ## Complément intégré au MVP », position de la PR (mode `avant`) |
| #370 | ch. 13, blocs 2, 3, 6 (deux groupes) | Lignes de contexte modifiées par la finalisation : QUA-157 et QUA-168 (accords, espaces), et texte du contrat CE-UI-10 retouché | Insertion après le paragraphe conservé de CE-UI-10 (mode `apres`) ; pour le bloc 6/1, après la liste « ± modifie Bip… », qui est l'ancien paragraphe scindé par la finalisation. Le texte de la PR est inchangé |
| #371 | ch. 06, bloc 1 | Ligne restaurée par R06B-001 (lien vers la matrice des circuits, `7a89220f^`) | Substitution ciblée « états de Modalités d'exécution » → « états de Paramètres d'exécution » (mode `substituer`) ; le lien restauré est conservé |
| #371 | ch. 13, blocs 2, 4, 5, 6, 7 | La PR modifie la même phrase « Durée et symbole viennent du calcul commun… » dans 5 contrats, avec un nouveau texte identique. La finalisation a remplacé 4 de ces copies par un renvoi vers l'occurrence conservée (COP-017, 027, 029, 048, 051 ; ch. 13 l. 281) | Bloc 2 : remplacement de l'occurrence conservée, dont le texte actuel est identique à l'ancien texte de la PR hors espaces typographiques. Blocs 4 à 7 : sans objet, les renvois suivent l'occurrence conservée |

## Points de coordination avec les chantiers propriétaires (non publiés)

- **PR #371 :** le signalement des écarts X-06, X-07, Q17, Q21 et Q25 (`signalement-PR371-X06-X07.md`) n'a pas été publié et reste à coordonner. La finalisation a laissé intactes les lignes que cette PR réécrit, notamment ch. 08 « Répétitions … steppers » (Q8) et RM-189 (Q12).
- **PR #370 :** RM-131 (steppers permanents) reste en attente de sa fusion. Elle est relevée PROBABLE par la traçabilité de CE-UI-10.
- **Décisions PRE-4 Q33 à Q44 (17/10) :** relevées par l'examen des DSF, non intégrées, hors du périmètre Q1 à Q32. Voir [arbitrages-lot6.md](../../arbitrages-lot6.md).

## Ordre de fusion recommandé

1. Revue indépendante finale de `docs/openspec-revision`.
2. Pour chaque PR :
   - rebase sur la branche restructurée, ou application du correctif `pr-<n>-report.patch` ;
   - contrôles du change (`outils/controler-finalisation.sh`) ;
   - revue par le chantier propriétaire.
3. Fusion dans `main`, sur décision de Hermann seulement.
