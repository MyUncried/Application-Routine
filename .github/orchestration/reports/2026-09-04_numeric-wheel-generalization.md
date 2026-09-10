# Généralisation de la roulette numérique compacte

Date : 2026-09-04  
Périmètre : Figma, Design System Foundation, tokens et documentation uniquement. Aucun code applicatif modifié.

## Décision canonique

Tous les contrôles scalaires historiquement décrits comme `pull-up`, `pull-down`, menu numérique ou pop-up numérique utilisent désormais le component set DSF `Picker / Popover — Source exact` (`2537:1174`), variante `Type=Numeric wheel` (`3210:49`).

La variante repose sur la primitive native OS, comporte une colonne numérique et exige une action explicite :

- Annuler détruit le brouillon et ferme ;
- Confirmer enregistre la valeur centrée et ferme ;
- le défilement, le toucher d’une valeur ou l’arrêt du défilement ne ferment pas le sélecteur ;
- le contrôle hôte n’affiche la nouvelle valeur qu’après confirmation.

## Géométrie et tokens

- roulette ouverte : `136 × 190` ;
- barre d’actions : `40` ;
- contenu natif : `150` ;
- cadre de sélection : `56 × 34`, rayon `17` ;
- cible tactile d’action : `48 × 48` ;
- cercle d’action : `28 × 28` ;
- cadre d’icône : `24 × 24`.

Variables ajoutées :

- `dimension/136` — `VariableID:3218:4020` ;
- `component/wheel/numeric-compact-width` — `VariableID:3218:4021` ;
- `component/wheel/selection-column-width` — `VariableID:3218:4022`.

Variables renommées :

- `color/wheel-action/confirm-background` — `VariableID:3078:63` ;
- `color/wheel-action/confirm-icon` — `VariableID:3078:65`.

## Frames propagées

| Usage | Frame Figma | Instance de roulette |
|---|---|---|
| Profil — compte à rebours | `1992:474` | `3220:4033` |
| Profil — fin de séance | `1992:579` | `3220:4049` |
| Planifier — nombre de semaines | `1992:7537` | `3220:4097` |
| Création activité — séries | `1992:9618` | `3211:4012` |
| Création activité — répétitions | `1992:9709` | `3220:4065` |
| Composition — nombre de tours | `2028:11580` | `3220:4081` |

Le déclencheur fermé est `Controls / Numeric Selector Trigger — Source exact` (`2745:2`). L’ancienne variante `Type=Numeric menu` (`2537:1122`) a été supprimée après contrôle de l’absence d’instances restantes.

## Documentation mise à jour

- `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md` ;
- `Specifications-fonctionnelles/07 – Registre des décisions de conception.md` — décision `D-104` ;
- `Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md` ;
- `Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md` — règle `RM-104` ;
- `Specifications-fonctionnelles/12 – Architecture technique.md` ;
- `Specifications-fonctionnelles/13 – Contrats d’écran.md` — contrat transverse et correspondance par écran.

## Contrôles finaux

- aucune instance de l’ancienne variante numérique détectée dans le fichier Figma ;
- aucune occurrence de l’ancien nom de composant détectée ;
- les six frames utilisent la même variante DSF ;
- les captures documentaires ont été régénérées depuis les frames Figma actuelles ;
- aucune modification du code applicatif.

Statut : `DESIGN_NUMERIC_WHEEL_GENERALIZATION_READY_FOR_IMPLEMENTATION_REVIEW`.
