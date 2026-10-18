# Dépendances et conflits Git à résoudre avant fusion

- **État au 18/10/2026 :**
  - les trois PR sont ouvertes et inchangées depuis les 15 et 16/10 : #363 `d2386c8d`, #370 `6cf3634a`, #371 `2c050d0e` (brouillon) ;
  - `main` = `6656fefc` ;
  - aucune PR n'a été modifiée, fusionnée ni commentée par ce chantier.
- **Outil :** `outils/reporter-pr.mjs`. Il retrouve chaque modification d'une PR dans la documentation restructurée et produit un correctif repositionné. La comparaison se fait sans espaces, sans cibles de liens, sans marques de titre et sans préfixes B-nnn. Les cas ambigus sont départagés par le contrat d'écran puis par le titre précédent.
- **Correctifs produits :** `pr-<n>-report.patch`. Ils sont vérifiés par `git apply --check` sur le HEAD final et ne sont **pas appliqués**. Ils sont destinés au chantier propriétaire de chaque PR.
- **Détail par bloc :** `pr-<n>-report.tsv`.

## Synthèse

| PR | Fichiers en conflit (fusion simulée `git merge-tree`) | Blocs modifiés | Reportés automatiquement | À reporter à la main |
|---|---|---|---|---|
| #363 | ch. 06 | 5 (chapitres) + images PNG | 5 | 0 |
| #370 | ch. 03, 04, 06, 08, 09, 10, 11, 13 | 36 | 31 | 5 |
| #371 | ch. 06, 08, 13 | 22 | 16 | 6 |

Les conflits viennent de la réorganisation des fichiers (lot 6) : les lignes modifiées par les PR ont changé de place. Leur texte, lui, est presque toujours conservé. Le correctif repositionné remplace donc la résolution manuelle de ces conflits, sauf pour les blocs listés ci-dessous.

## Blocs à reporter à la main

| PR | Bloc | Raison | Résolution proposée |
|---|---|---|---|
| #370 | ch. 05, bloc 1 (4 lignes ajoutées) | Contexte « --- » présent 15 fois | Placer l'ajout après le séparateur qui suit la section visée par la PR (voir le diff de la PR) |
| #370 | ch. 13, blocs 2, 3, 6 (deux groupes) | Lignes de contexte modifiées par la finalisation : QUA-157 et QUA-168 (accords, espaces), et texte du contrat CE-UI-10 retouché | Ajouter les lignes de la PR à la même place dans CE-UI-10 ; le texte ajouté par la PR n'entre pas en conflit avec les corrections |
| #371 | ch. 06, bloc 1 | Ligne restaurée par R06B-001 (lien vers la matrice des circuits, `7a89220f^`) | Appliquer la modification de la PR à la ligne restaurée, en gardant le lien |
| #371 | ch. 13, blocs 2, 4, 5, 6, 7 | La PR modifie la même phrase « Durée et symbole viennent du calcul commun… » dans 5 contrats. La finalisation a remplacé ces 5 copies identiques par un renvoi vers l'occurrence conservée (COP-017, 027, 029, 048, 051 ; ch. 13 l. 281) | Appliquer la modification une seule fois, à l'occurrence conservée : les 5 renvois la suivent |

## Points de coordination avec les chantiers propriétaires (non publiés)

- **PR #371 :** le signalement des écarts X-06, X-07, Q17, Q21 et Q25 (`signalement-PR371-X06-X07.md`) n'a pas été publié et reste à coordonner. La finalisation a laissé intactes les lignes que cette PR réécrit, notamment ch. 08 « Répétitions … steppers » (Q8) et RM-189 (Q12).
- **PR #370 :** RM-131 (steppers permanents) reste en attente de sa fusion. Elle est relevée PROBABLE par la traçabilité de CE-UI-10.
- **Décisions PRE-4 Q33 à Q44 (17/10) :** relevées par l'examen des DSF, non intégrées, hors du périmètre Q1 à Q32. Voir [arbitrages-lot6.md](../../arbitrages-lot6.md).

## Ordre de fusion recommandé

1. Revue indépendante finale de `docs/openspec-revision`.
2. Pour chaque PR :
   - rebase sur la branche restructurée, ou application du correctif `pr-<n>-report.patch` ;
   - report manuel des blocs ci-dessus ;
   - contrôles du change (`outils/controler-finalisation.sh`) ;
   - revue par le chantier propriétaire.
3. Fusion dans `main`, sur décision de Hermann seulement.
