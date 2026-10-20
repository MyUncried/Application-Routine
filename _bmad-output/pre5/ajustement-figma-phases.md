# Ajustement Figma nécessaire : contrôle « Phases de l'exercice »

Arbitrage de Hermann du 19/10 (story 2.8, D-432). Ce document identifie l'écart entre Figma et la décision. L'agent ne modifie pas Figma ; le développement n'attend pas cet ajustement.

## Référence

Fichier `G6RY5Ebhgwb4AHIOYDwwvg` (Prototype MVP), frame `9207:18817` : le segment sélectionné affiche « Avec ^ », c'est-à-dire le libellé Avec et un chevron.

## Écarts à reporter dans Figma

| # | Figma actuel (`9207:18817`) | Décision | Ajustement proposé |
|---|---|---|---|
| F-1 | Le segment sélectionné affiche « Avec » | Il affiche le nombre de phases : « 2 phases », « 3 phases »… | Remplacer le libellé du segment sélectionné par « n phases » |
| F-2 | Aucun réglage du nombre de phases n'est montré | `InlineStepper` existant, de 2 à 6 ; − et + autour de la valeur quand le réglage est actif, masqués sinon | Ajouter deux variantes du segment : réglage actif (− « 3 phases » +) et réglage inactif (« 3 phases » et chevron) |
| F-3 | Chevron vers le haut seulement | Vers le haut si le tableau est déployé, vers le bas s'il est replié ; visible quand − et + sont masqués | Ajouter la variante « tableau replié » avec le chevron vers le bas |
| F-4 | État à 2 phases non montré | À 2 phases, − est indisponible ; la croix ✕ des lignes aussi (QR-1) ; la désactivation se fait par Sans | Montrer − et les croix à l'état indisponible à 2 phases |
| F-5 | État Sans | Sans par défaut ; ni nombre, ni chevron, ni tableau | À vérifier seulement : aucun changement attendu |

## Géométrie

La géométrie du segment n'est adaptée qu'autant qu'il le faut pour que le stepper et le chevron soient utilisables et accessibles. Les dimensions retenues au développement seront relevées pendant la story 2.8, puis reportées ici pour la mise à jour de Figma.

### Dimensions retenues au développement (story 2.8, 19/10)

Métriques Inter de l'application (Semi Bold 12 : « 6 phases » = 52,7) ; constantes locales, `tokens.ts` inchangé.

- Option Avec : 62 quand Sans est sélectionné ; 76 sélectionnée, réglage fermé (« n phases » + écart 4 + chevron 10) ; 136 réglage ouvert (− 28, écart 2, valeur 60,7, écart 2, + 28, écart 4, chevron 10). Sans : 62. Segmenté de 146 (réglage fermé) ou 206 (réglage ouvert), marges de 3 et écart de 2 compris.
- Le − et le + sont les cercles de 28 de l'`InlineStepper` existant (sans pilule), posés sur l'option violette de 26 ; le chevron suit le + (rendu par le segmenté), alors que Figma le place contre le nombre et pose − et + hors de l'option.
- Réglage ouvert : le libellé « Phases de l'exercice » passe sur deux lignes à 375 et 402 (ligne de 44 inchangée).
- Tableau : cellules Libellé et Durée de 76 × 24, écart de 20 (relevé `9207:18817`) ; repère de ligne active 3 × 24 bleu Kodjo ; aucun séparateur après le tableau.
- Écart : les cellules Libellé n'ont pas de fond au repos (Figma les montre sur fond lavande) ; fond `#EAEAFF` en saisie seulement, comme les autres cellules.

### Dimensions retenues après la recette du 20/10 (RC-16)

Remplacent, pour l'option Avec, les dimensions de la story 2.8 ci-dessus. Métriques Inter de l'application : « 4 phases » Semi Bold 12 = 53,0 (le plus large de 2 à 6) ; « Sans » Regular 12 = 27,9 dans 62, soit des marges d'environ 17.

- Option Avec, réglage fermé : marge 17 + « n phases » 53,0 + écart 6 + chevron 10 + marge 17 → **104** ; libellé blanc Semi Bold 12 sur le violet ; le chevron (10 × 10, tracé 8 × 4) est rendu par le contenu de l'option, sa place toujours réservée.
- Option Avec, réglage ouvert : fond `#EAEAFF` (celui de la charge active), 150 × 28, rayon 5 ; ordre **− | n phases | chevron | +** : marge 4, cercle − 28, écart 8, valeur 53,0 (Semi Bold 12, primaire), écart 6, chevron 10 (gris `color/disabled`, indisponible), écart 8, cercle + 28, marge 4 → **150** ; segmenté de **34** (au lieu de 32) pour loger le fond de 28 sans débord, comme le contrôle Séries (RC-15).
- Sans : 62, inchangé. Segmenté : 174 fermé (3 + 104 + 2 + 62 + 3), 220 ouvert.
- Zones tactiles (sans chevauchement) : fermé, libellé 44 de haut jusqu'au bord gauche de l'option, chevron 44 de haut jusqu'au bord droit (≈ 30 × 44) ; ouvert, − et + 44 × 44 (marge 8 de chaque côté), valeur 53 × 44, chevron indisponible 16 × 44.
- Libellé « Phases de l'exercice » (Regular 12, 117,0) : une ligne réglage fermé à 375 (119 disponibles, juste) et 402 ; deux lignes réglage ouvert (73 à 375, 100 à 402), ligne de 44 inchangée.
- Variantes Figma à ajouter : réglage fermé (« n phases » + chevron, 104) et réglage ouvert (« − n phases ⌄ + » sur `#EAEAFF`, 150 × 28, chevron grisé), tableau déployé (chevron haut) et replié (chevron bas).
