# 2026-11-20 — Agenda : zone de contexte avec la rangée des sept jours (D-538)

## Identifiant et objectif

- **Mission** : AGENDA-ZONE-CONTEXTE (lot 1 sur 2).
- **Demande de Hermann** : appliquer, dans cet ordre, `docs/PROMPT-CLAUDE-CODE-AGENDA-ZONE-CONTEXTE-2026-11-20.md` puis le prompt du filtre par routine, lus sur `docs/planification-grille-creneaux` au commit `562a5a0d`, sans fusion ; un rapport par lot.
- **Objectif** : appliquer D-538 (zone de contexte de l'Agenda).
- **Branche** : `planification/ce-ui-12-20261118`.
- **Commit de départ** : `ee44c31b`.

## Sources

- **Branche `docs/planification-grille-creneaux` au commit `562a5a0d`**, lue sans fusion :
  - le prompt ;
  - D-538 (ch07) ;
  - `docs/DSF-AGENDA-PLANNING-2026-11-19.md`, § 2.
- **Figma** :
  - écran « P-Calendrier — Semaine — Carrousel dans la zone de contexte (proposition) » `12765:24572` ;
  - composant `icon/aujourd'hui` (`12779:24842` « Jour courant » et `12783:24674` « Autre jour ») ;
  - instance `icon/planifier` `12765:24696`.

## Périmètre demandé et traité

| Point du prompt | Traité |
|---|---|
| 1. Bande 402 × 115, hauteur inchangée, deux lignes, jours dans la bande | Oui |
| 2. Ligne 1 : « Aujourd'hui » à gauche (34 × 34, ramène au jour courant et à sa semaine) | Oui |
| 2. Ligne 1 : mois centré, doubles flèches à 10, libellé de semaine retiré | Oui |
| 2. Ligne 1 : emplacement libre du filtre (34 × 34) | Oui (vide, rempli par le lot 2) |
| 3. Ligne 2 : flèches de semaine, sept cartes centrées, « Planifier » à x = 352, y = 149 | Oui |
| 4. Cartes de jour 36 × 46 | Oui : rayon 10, écart 3, jour abrégé en 11, numéro en 18, points de 4, jour sélectionné plein, autres blancs à 30 % |
| 5. Icône « Aujourd'hui » | Oui : gris #333333 sur le jour courant, bleu #0508E5 sinon, chiffre du jour |
| 6. Icône « Planifier » : « + » recentré | Oui : fichier d'icône partagé, donc partout |
| 7. Premier en-tête de jour à y = 215 | Oui : 8 sous la bande, texte à 11 du haut de l'en-tête |

## PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE** (vérifié) :
  - hauteur (115) et position de la bande : le composant partagé `TabbedScreen` / `ContextBand` n'est pas modifié ;
  - barre de titre à onglets, carte d'une routine, regroupement par jour, déployé, glissés, suppression, modification : code inchangé, tests de l'Agenda verts ;
  - règle RM-046 (le jour choisi passe en tête) et défilement continu : fonctions `selectDay`, `onScroll` et `changeWeek` inchangées ;
  - flèches de mois et de semaine : mêmes fonctions (`changeMonth`, `changeWeek`).
- **CHANGE** :
  - disposition de la zone de contexte et de la rangée des jours ;
  - bouton « Aujourd'hui » ;
  - libellé de semaine retiré ;
  - icône « Planifier ».
- **FORBIDDEN** (respecté) :
  - aucune primitive native remplacée ;
  - hauteur de la bande non modifiée ;
  - Journal, Vue d'ensemble et catalogues non touchés : seule l'icône partagée « Planifier » change, comme le demande le point 6 ;
  - aucune règle promue.

## Points À CLARIFIER (non tranchés)

- **Mois d'une semaine à cheval sur deux mois** : le code affiche le mois du **jour sélectionné** (`formatAgendaMonth(selectedDay)`), comportement déjà en place et non modifié. Exemple : semaine du 26 août au 1er septembre 2030, avec le 1er septembre sélectionné → « Septembre 2030 ».
- **Changement de semaine ou de mois par balayage** : non ajouté ; flèches uniquement.
- **Changement de mois** : première semaine du mois, jour 1 sélectionné ; comportement existant inchangé.

## Modifications réalisées

- **`CalendarWeekScreen.tsx`** :
  - zone de contexte en positions absolues reprises de la maquette (x relatifs au contenu de la bande, qui porte les marges de 16) :
    - « Aujourd'hui » à (−5, 6) ;
    - mois centré à y 11 ;
    - emplacement du filtre à (345, 6) ;
    - flèches de semaine à (−5,75, 62) et (302, 62) ;
    - rangée des jours à (25, 51) ;
    - « Planifier » à (336, 57) ;
  - rangée des jours déplacée de sous la bande vers la bande ;
  - points de 4 au lieu de 5 ;
  - imports inutilisés retirés.
- **`TodayIcon.tsx`** (nouveau) : calendrier en SVG teinté, plus le chiffre du jour (Inter gras 9) centré dans la partie sous le bandeau.
- **Icônes** :
  - `assets/icons/icon-aujourdhui.svg` (nouveau) : tracés de la maquette, sans chiffre ;
  - `assets/icons/icon-planifier.svg` : tracé de la maquette en 24, avec le « + » centré à y = 16,5.
- **Tests** (`CalendarWeekScreen.integration`) :
  - le libellé de semaine est remplacé par la vérification des cartes de jour ;
  - « Aujourd'hui » vérifié : chiffre du jour, bleu sur un autre jour, gris sur le jour courant, retour au jour courant ;
  - dimensions et couleurs des cartes de jour vérifiées.
- **Documentation** : annotation datée en fin du DSF Agenda de cette branche, renvoyant à D-538.

## Hypothèses (choix techniques)

1. Le chiffre de l'icône est centré dans la partie basse du calendrier, et non placé à x = 6 comme dans la maquette, pour rester centré avec deux chiffres comme avec un seul.
2. Le texte des cartes de jour suit l'agrandissement du texte jusqu'à 1,2 fois seulement, et se réduit pour tenir dans la carte de 36 × 46.
3. Le premier en-tête de jour commence 8 sous la bande, son texte 11 plus bas, comme dans la maquette (en-tête de 32, texte à 11,5).

## Tests

- `npx jest src/features/planning` : vert, dont `CalendarWeekScreen.integration` (14 tests).
- **Suite complète** (`npx jest -w 2`), première passe : 410 groupes de tests réussis sur 411, 6 276 tests réussis, 32 ignorés, 2 échecs dans `visualAssets.test.ts`. Le manifeste des icônes ne connaissait ni la nouvelle taille de `icon-planifier` (24 au lieu de 18), ni `icon-aujourdhui`.
- **Correction** : manifeste `assets/icons/manifest.json` mis à jour (`icon-planifier` en 24 × 24, nœud `11004:43991` ; entrée `icon-aujourdhui`).
- **Nouvelle passe ciblée** : `visualAssets`, `TabbedScreen` et `src/features/planning`, 115 tests réussis sur 115.
- `npx tsc --noEmit` : aucune erreur.
- `eslint` sur les fichiers modifiés : aucune erreur.
- **À vérifier sur iPhone** :
  - lisibilité des cartes de 36 × 46 ;
  - alignement des flèches ;
  - bascule gris / bleu de l'icône ;
  - zones de tap de 34 × 34 ;
  - semaine à cheval sur deux mois.

## Synchronisation code / documentation

- **Classe A** : le code rejoint D-538.
- **Source normative** : D-538 et le DSF Agenda § 2 sont sur la branche documentaire non fusionnée. Ce lot n'y apporte aucune correction : rien n'est préparé.

## Fichiers modifiés

- `src/features/planning/CalendarWeekScreen.tsx`
- `src/features/planning/TodayIcon.tsx` (nouveau)
- `assets/icons/icon-aujourdhui.svg` (nouveau)
- `assets/icons/icon-planifier.svg`
- `assets/icons/manifest.json`
- `src/features/planning/__tests__/CalendarWeekScreen.integration.test.tsx`
- `docs/DSF-AGENDA-PLANNING-2026-11-19.md`
- ce rapport

## Commit final et état Git

- **Commit** : celui qui contient ce rapport.
- **État Git** : propre après commit ; branche ni envoyée sur GitHub ni fusionnée.
