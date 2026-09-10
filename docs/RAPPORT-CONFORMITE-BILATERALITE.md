# Rapport final de conformité — Bilatéralité

Date : 10 septembre 2026.

## Baseline et périmètre

La correction finale a été contrôlée sur `main@a904c16dc2f77189c42012071ba8ff481f122410` et sur la copie de `docs/PRODUCT.md` issue de `/Dev` fournie le 10 septembre 2026.

Le corpus documentaire contrôlé comprend `docs/PRODUCT.md`, `docs/INDEX.md`, les spécifications `00` à `13`, la matrice Bilatéralité et le présent rapport. Les manifestes historiques de tranches clôturées ne font pas partie du périmètre d’écriture et n’ont pas été modifiés.

L’archive `Documentation 08092026 - 19h05 - Avant MAJ avec bilatéralité.zip` reste une preuve de provenance de la livraison initiale. Son absence de `PRODUCT.md` n’est plus une limite : la copie issue de `/Dev` a été fournie séparément, contrôlée et alignée.

## Résultat par axe

| Axe | Résultat | Évidence |
|---|---|---|
| États et libellés | CONFORME | Valeurs techniques et libellés alignés dans PRODUCT, INDEX, 00, 04, 08, 09, 12 et 13. |
| Activité bilatérale | CONFORME | Ordre par côté, Pauses, Récupération et formules alignés dans PRODUCT, INDEX, 00, 06, 08–11 et 13. |
| Tour bilatéral | CONFORME | Héritage global, confirmation, remise à unilatéral et absence de capacité « latéralisable » dans PRODUCT, 03, 04, 06–10 et 13. |
| Exécution | CONFORME | Plan développé, côté courant, progression, annonces, réinitialisation et passage anticipé documentés dans PRODUCT, 03, 06, 08 et 10–13. |
| Résultats | CONFORME | Côté persisté, idempotence et agrégation partielle définis dans PRODUCT, 04 et 09–13. |
| Persistance et migration | CONFORME | Champs, défauts, copie, duplication, transaction et migration définis dans 04, 09, 11 et 12. |
| Découpage | CONFORME | Tranche Configuration puis T03 révisée dans PRODUCT, INDEX, 05, 07, 10 et 13. |
| Figma | CONFORME | Six frames d’Exécution actualisées avec `Côté droit` sous le nom de l’Activité. |
| `PRODUCT.md` | CONFORME | Ancienne formule, ancienne portée de Récupération et ancienne restriction T03 remplacées. |
| Manifestes historiques | INCHANGÉS | Exclus explicitement du périmètre d’écriture. |

## Règles historiques remplacées

- La formule unilatérale seule est remplacée par `D = L × [C × A + (C − 1) × B] + R`.
- Le nombre de Séries d’une Activité autonome bilatérale s’entend par côté et la Durée totale est globale.
- La Pause reste limitée aux Séries d’un même côté ; aucune Pause n’est ajoutée entre côtés.
- La Récupération intervient une fois après tous les côtés d’une Activité autonome ou une fois par passage de côté dans un Tour bilatéral.
- Un Tour bilatéral impose sa direction à toutes ses Activités ; aucune notion « latéralisable » n’existe.
- Les exclusions T03 limitant l’Exécution à une Série ou reportant les Séries multiples à T04 sont supprimées.
- Le côté courant est affiché uniquement par `Côté droit` ou `Côté gauche`, sans compteur `1/2` ou `2/2`.
- La modale générique de passage anticipé reste inchangée.

## Vérification transverse

La recherche a porté sur les formulations actives relatives aux états de côté, à la formule de Durée totale, aux Pauses, aux Récupérations, à la priorité Tour/Activité, à la progression, aux Résultats, à T03 et aux références Figma.

Aucune contradiction active n’a été trouvée dans `INDEX.md` ni dans les chapitres `00` à `13`. Les mentions de `1/2`, `2/2` et « latéralisable » qui subsistent y expriment explicitement leur exclusion. La référence post-T04 relevée dans le chapitre 09 concerne les associations média et non l’exécution bilatérale.

## Figma

Frames actualisées : `1992:8626`, `1992:8132`, `1992:8530`, `1992:8428`, `1992:8224`, `1992:8326`.

Le sous-titre est centré immédiatement sous le nom de l’Activité, en texte secondaire de 16 points. Il reste visible derrière les voiles des trois modales. Les six captures `execution-*.png` correspondantes ont été réexportées.

## Conclusion

Les décisions `BIL-001` à `BIL-060` sont documentées et cohérentes dans l’ensemble du corpus canonique. `docs/PRODUCT.md` est aligné. Aucune clarification fonctionnelle ni contradiction documentaire active ne reste ouverte.

La documentation Bilatéralité peut servir de source au protocole V2, sous réserve que la future tranche référence la baseline Git exacte utilisée à son ouverture.

## Fichiers modifiés par cette correction finale

- `docs/PRODUCT.md`
- `docs/MATRICE-TRACABILITE-BILATERALITE.md`
- `docs/RAPPORT-CONFORMITE-BILATERALITE.md`

Aucun fichier n’est ajouté ou supprimé. Aucun manifeste historique n’est modifié. Aucun commit ni push n’est effectué.

## Contrôles de livraison

- couverture de `BIL-001` à `BIL-060` : 60 identifiants uniques ;
- ancienne formule unilatérale seule dans les documents actifs : aucune occurrence contradictoire ;
- anciennes exclusions T03 d’une Série ou d’un Tour : aucune occurrence active ;
- clarifications `Q1` à `Q4` : clôturées ;
- fichiers modifiés : Markdown UTF-8 ;
- manifestes historiques : inchangés.

## Nom de commit recommandé

`docs: finaliser l’alignement documentaire de la bilatéralité`

Ce nom est fourni à titre de recommandation uniquement. Aucun commit ni push n’est effectué dans cette correction.

