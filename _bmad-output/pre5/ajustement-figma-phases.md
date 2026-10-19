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
