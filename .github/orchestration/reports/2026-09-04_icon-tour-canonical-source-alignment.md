# Alignement de la source canonique de l’icône Tour

Date : 2026-09-04  
Périmètre : Figma, DSF, documentation et registre des actifs uniquement. Aucun code applicatif modifié.

## Décision

Le pictogramme présent dans `Nouvelle séance — Nom renseigné` (`2028:12003`, ancien nœud local `2028:12040`) devient l’unique source graphique de l’icône Tour. Le composant DSF `Icon / Tour` (`3066:4685`) a été reconstruit avec cette géométrie : `18 × 18`, quatre tracés, trait `1,35`, couleur `#141414` (`color.textPrimary`).

Toutes les occurrences de `Prototype MVP` sont désormais des instances de `3066:4685`. L’actif physique unique est `assets/icons/icon-tour.svg`, déclaré sous `icon.tour`. L’entrée concurrente `composition.mainContent` a été retirée du manifeste.

## Occurrences contrôlées

| Écran | Frame | Instance après correction |
| --- | --- | --- |
| Nouvelle séance — État initial | `2028:11137` | `I3067:4835;3067:247` |
| Modal — Abandonner la création de la séance | `2028:11298` | `3272:4126` |
| Modal — Paramétrer le compte à rebours initial | `2028:11375` | `3272:4131` |
| Modal — Paramétrer la fin de séance | `2028:11457` | `3272:4136` |
| Composition — Nombre de tours — roulette compacte ouverte | `2028:11580` | `3272:4141` |
| Composition d’une séance — sans Cycle | `2028:11700` | `3272:4146` |
| Composition d’une séance — actions glissées | `2028:11808` | `3272:4151` |
| Composition d’une séance — sélecteur couleur ouvert | `2028:11921` | `3272:4156` |
| Nouvelle séance — Nom renseigné | `2028:12003` | `3272:4161` |

## Vérifications

- `Nouvelle séance — État initial` hérite maintenant du nouveau dessin via le composant Tour Section.
- aucune frame locale nommée `icon/contenu-principal` ne subsiste dans `Prototype MVP` ;
- les neuf occurrences recensées ont `mainComponentId = 3066:4685` et mesurent `18 × 18` ;
- le SVG exporté correspond au composant DSF ;
- les chapitres 06, 12 et 13 indiquent la même source, le même actif et la même géométrie ;
- le manifeste contient une seule entrée fonctionnelle pour cette icône : `icon.tour`.
- les neuf captures documentaires correspondant aux frames contrôlées ont été réexportées depuis le Figma corrigé.

## Statut

`DESIGN_ICON_TOUR_CANONICAL_SOURCE_ALIGNED`
