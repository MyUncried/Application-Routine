# Rapport final de conformité — Bilatéralité

Date : 10 septembre 2026.

## Baseline et périmètre

La seule baseline physique utilisée pour les écritures est `Documentation 08092026 - 19h05 - Avant MAJ avec bilatéralité.zip`. L’archive d’origine n’a pas été modifiée. La nouvelle archive conserve tous ses fichiers et ajoute uniquement les deux livrables explicitement attendus : la matrice Bilatéralité et le présent rapport.

`PRODUCT.md` n’est pas présent dans la baseline ZIP. Il n’a donc pas été reconstruit ni ajouté depuis Git ou depuis une version antérieure. Son alignement physique est `NON VÉRIFIABLE` dans cette livraison. Les règles produit nécessaires sont néanmoins propagées dans `INDEX.md` et les chapitres `00` à `13` du corpus fourni.

## Résultat par axe

| Axe | Résultat | Évidence |
|---|---|---|
| États et libellés | CONFORME | Valeurs techniques et libellés définis dans 00, 04, 08, 09, 12, 13. |
| Activité bilatérale | CONFORME | Ordre par côté, Pauses, Récupération et formules alignés dans INDEX, 00, 06, 08–11, 13. |
| Tour bilatéral | CONFORME | Héritage global, confirmation, remise à unilatéral et absence de capacité « latéralisable » dans 03, 04, 06–10, 13. |
| Exécution | CONFORME | Plan développé, progression, annonces, reset et passage anticipé documentés dans 03, 06, 08, 10–13. |
| Résultats | CONFORME | Côté persisté, idempotence et agrégation partielle définis dans 04, 09–13. |
| Persistance et migration | CONFORME | Champs, défauts, copie, duplication, transaction et migration définis dans 04, 09, 11, 12. |
| Découpage | CONFORME | Tranche Configuration puis T03 révisée dans INDEX, 05, 07, 10, 13. |
| Figma | CONFORME | Six frames d’Exécution actualisées avec `Côté droit` sous le nom de l’Activité. |
| `PRODUCT.md` physique | NON VÉRIFIABLE | Fichier absent de la baseline ZIP, donc volontairement non ajouté. |

## Règles historiques remplacées

- La formule unilatérale seule est remplacée par la formule paramétrée par `L`.
- La Récupération « une fois après toutes les Séries » est contextualisée selon Activité autonome ou Tour bilatéral.
- Les exclusions T03 « une seule Série » et « un seul Tour » sont supprimées.
- La restriction supposant des Activités « latéralisables » dans un Tour est rejetée : toutes les Activités héritent du Tour.
- L’indicateur envisagé `1/2` ou `2/2` est remplacé par le seul sous-titre de côté.
- La création d’une nouvelle modale de passage anticipé est abandonnée ; la modale générique existante est conservée.

## Figma

Frames actualisées : `1992:8626`, `1992:8132`, `1992:8530`, `1992:8428`, `1992:8224`, `1992:8326`.

Le sous-titre est centré immédiatement sous `Squats assistés`, en texte secondaire de 16 points. Il reste visible derrière les voiles des trois modales. Les six captures `execution-*.png` correspondantes ont été réexportées.

## Conclusion

Les décisions `BIL-001` à `BIL-060` sont documentées et traçables dans le périmètre fourni. Aucune clarification fonctionnelle restante n’est identifiée. La seule limite est l’absence physique de `PRODUCT.md` dans la baseline, qui empêche d’en produire une mise à jour conforme aux règles de provenance.

## Fichiers modifiés

- `INDEX.md`
- `Specifications-fonctionnelles/00 – Glossaire.md`
- `Specifications-fonctionnelles/01 – Vision Générale.md`
- `Specifications-fonctionnelles/02 – Utilisateurs et besoins.md`
- `Specifications-fonctionnelles/03 – Parcours utilisateur.md`
- `Specifications-fonctionnelles/04 – Modèle fonctionnel.md`
- `Specifications-fonctionnelles/05 – Versions du produit.md`
- `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md`
- `Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md`
- `Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md`
- `Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md`
- `Specifications-fonctionnelles/11 – API fonctionnelles.md`
- `Specifications-fonctionnelles/12 – Architecture technique.md`
- `Specifications-fonctionnelles/13 – Contrats d’écran.md`
- `Specifications-fonctionnelles/images/execution-etat-initial.png`
- `Specifications-fonctionnelles/images/execution-seance.png`
- `Specifications-fonctionnelles/images/execution-bips-vocal-desactives.png`
- `Specifications-fonctionnelles/images/execution-pause.png`
- `Specifications-fonctionnelles/images/execution-reinitialiser.png`
- `Specifications-fonctionnelles/images/execution-activite-suivante.png`

## Fichiers ajoutés

- `MATRICE-TRACABILITE-BILATERALITE.md`
- `RAPPORT-CONFORMITE-BILATERALITE.md`

Aucun fichier n’est supprimé. Tous les autres fichiers de la baseline sont conservés à l’identique.

## Contrôles de livraison

- couverture de `BIL-001` à `BIL-060` : 60 identifiants uniques ;
- six captures Figma : PNG valides de `402 × 874` ;
- anciennes formules unilatérales seules : aucune occurrence active restante ;
- anciennes exclusions T03 d’une Série ou d’un Tour : aucune occurrence active restante ;
- noms de fichiers Unicode : conservés en UTF-8 ;
- fins de ligne des documents : CRLF conservées ;
- archive finale : test d’intégrité obligatoire avant livraison.

## Nom de commit recommandé

`docs: documenter la bilatéralité et aligner les écrans d’exécution`

Ce nom est fourni à titre de recommandation uniquement. Aucun commit ni push n’est effectué dans cette livraison.
