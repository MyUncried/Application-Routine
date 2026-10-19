# PRE-5 : recette iPhone

## Séance 1 — 19/10, commit `9417aabb` (stories 1.1, 2.1 à 2.4, 2.6)

Application « Routine BMAD » (dev client), Metro en tunnel depuis le worktree `C:\Dev\KODJO-BMAD-PRE5-recette`. Constats de Hermann, retranscrits tels quels (OK = réussi).

| Point | Constat |
|---|---|
| A.1 Exercice PRE-4 relu | OK |
| B.2 Roue à 00:01, 00:00 non validable | OK |
| C.3 Quatre cadres, segmentés, chevron de Variables | OK |
| C.4 Stepper « Nombre de séries » | S'ouvre, change, se ferme au toucher d'une autre partie de l'écran ; **ne se ferme pas au toucher de la valeur elle-même (il devrait)** |
| C.5 Cellule Cible → roue | OK |
| C.5 Cellule Pause → ± sous la ligne | OK (question : est-ce le comportement demandé ? Oui : Δ34, D-413 / D-417, « stepper de Pause pour cette cellule ») |
| C.5 Poignée, glisser | Fonctionne, mais : la ligne déplacée est transparente ; après l'appui long, rien n'indique que la ligne est saisie (effet de couleur ou d'ombre attendu) ; à la dépose, la ligne doit s'insérer plus lentement, mouvement visible, et les autres lignes se déplacer plus lentement, mouvement visible |
| C.5 Croix, Annuler | OK |
| D.6 Charge Avec (variables) | 0,25 kg OK ; **le clavier s'ouvre automatiquement sur la première valeur : il doit rester fermé, aucune valeur sélectionnée** ; fond violet OK ; **KO : aucune barre Précédent / Suivant / Fermer, seulement le clavier** ; ligne active visible au-dessus du clavier OK |
| D.7 Précédent / Suivant | KO, non vérifiable (barre absente) |
| D.8 « 1,3 » → 1,5 kg | OK |
| D.9 Ligne 7 remontée au-dessus du clavier | OK |
| D.10 ✓ / ✕ absorbés | KO, non vérifiable |
| E.11 Charge Avec (identiques) | **KO : le clavier ne doit pas s'ouvrir automatiquement, seulement au toucher d'un champ Charge** ; barre absente |
| E.12 « 1,3 » → 1,5 kg | OK |
| E.13 Champ vidé → Sans | OK (fermé par un toucher ailleurs, pas par « Fermer ») |

Réponses de Hermann :
- **Sélection au focus :** oui, toute la valeur est sélectionnée quand le champ prend le focus.
- **Toucher direct :** passer d'une cellule Charge à l'autre sans fermer le clavier : OK ; changer de colonne ferme le clavier et ouvre l'autre contrôle : OK.

## Décisions de recette (font foi, appliquées partout)

- **RC-1 — Barre du clavier.** La barre Précédent / Suivant / « Fermer » doit apparaître. `InputAccessoryView` ne s'affiche pas dans la `Modal` de la Feuille : la barre est rendue par la Feuille au-dessus du clavier (position suivant la hauteur du clavier, événements `Keyboard` standards). Décision déjà prise (story 2.2 corrigée) : aucun nouvel arbitrage.
- **RC-2 — Pas d'ouverture automatique.** Passer la charge à Avec (identiques ou variables) n'ouvre pas le clavier et ne sélectionne aucune cellule. Le clavier s'ouvre seulement au toucher d'un champ Charge. Remplace « focus sur le premier champ » (story 2.2 AC5, story 2.7).
- **RC-3 — Sélection au focus.** Toute la valeur d'un champ Charge est sélectionnée quand il prend le focus.
- **RC-4 — Stepper révélé.** Toucher la valeur d'un stepper révélé ouvert le referme (Nombre de séries ; même mécanisme pour les autres steppers révélés de la Feuille).
- **RC-5 — Glisser une ligne.** Ligne saisie opaque, avec un effet visible dès l'appui long (couleur ou ombre) ; à la dépose, insertion plus lente et visible, déplacement plus lent et visible des autres lignes. S'applique aux tableaux qui partagent ces briques (séries, puis phases en 2.8).

À rejouer après correction : D.6, D.7, D.10, E.11, C.4, C.5 (glisser).

## Corrections du 19/10 (branche `bmad/pre5-recette1`)

Appliquent RC-1 à RC-5 ; aucun constat iPhone n'est encore consigné pour elles (à rejouer : D.6, D.7, D.10, E.11, C.4, C.5 glisser).

- **RC-1** : barre Précédent / Suivant / « Fermer » rendue par la Feuille (iOS), en position absolue au bas de la zone de la `Modal`, remontée de la hauteur du clavier (`keyboardWillShow` / `keyboardWillChangeFrame` / `keyboardWillHide`), montée animée avec le clavier ; `InputAccessoryView` retiré. La révélation de la ligne active retire la hauteur mesurée de la barre (marge 12). Android et web : clavier natif seul, comme avant.
- **RC-2** : Avec (identiques et variables) ne donne plus le focus ; aucune cellule active.
- **RC-3** : toute la valeur d'un champ Charge est sélectionnée au focus.
- **RC-4** : toucher la valeur d'un stepper révélé ouvert le referme (tous les steppers révélés de la Feuille et la Pause d'une cellule ; action « activer » de VoiceOver de même).
- **RC-5** : ligne saisie opaque (`#EAEAFF`), ombre, au-dessus des autres ; à la dépose, insertion de la ligne et décalage des autres en 280 ms ; aucune animation sous « Réduire les animations ».

## Décisions de Hermann du 19/10 sur la story 2.5

- **RC-6 — Enchainement dans « Changement de côté ».** La ligne « Enchainement » n'est plus nécessaire. Seule la ligne « Changement de côté » reste ; elle porte la valeur de l'enchainement, comme dans la frame Figma `9462:18987` (notations dans l'option Avec). Remplace la ligne Enchainement de D-413 / story 2.5 AC2 ; les notations de D-431 sont inchangées.
- **RC-7 — Compte à rebours et Fin d'un Exercice ouvert depuis une Séance.** Absents de la Feuille ; les valeurs sont conservées sans être utilisées dans l'exécution. Comportement livré en 2.5 confirmé.
- **RC-8 — Segmentés centrés verticalement avec le libellé de leur ligne.** Constat de Hermann : les segmentés `inline` de « Mode », « Condition d'arrêt » et « Cadence » ne sont pas centrés verticalement avec leur libellé. Règle pour toutes les lignes à segmenté `inline` (Type de série, Charge, Changement de côté, Cadence, Phases à venir) : contrôle (32) centré sur le libellé dans la ligne (44), hauteurs inchangées ; pour la Cadence, centré sur la ligne du libellé, pas sur la ligne étendue par le ± révélé.

## Correction RC-6 (branche `bmad/pre5-recette1`)

Aucun constat iPhone n'est encore consigné pour elle.

- Ligne « Enchainement » et chevron de repli d'Avec retirés ; Pause entre les côtés visible sous Avec.
- Option Avec de 144 (Sans 62, Figma `9462:18986`) : notation de l'Enchainement (police 10) ; nom accessible « Avec, <libellé neutre> ». Sélectionnée (N > 1), son contenu (notation + chevron) ouvre le menu natif SwiftUI `Menu` d'`@expo/ui` (déjà installé) : deux notations, la choisie cochée, noms accessibles neutres. Android et web : `Alert` native.
- À N = 1 : Avec reprend son libellé, sans menu ; Enchainement conservé (Q38).
- Écart à Figma : le déroulant dessiné (notation choisie en violet, chevron vers le haut, autre notation dessous) est rendu par le menu natif iOS, avec son propre aspect ; le chevron reste vers le bas.
- À vérifier sur iPhone : ouverture du menu au toucher de l'option Avec sélectionnée (déclencheur hébergé par `RNHostView` dans la `Modal` de la Feuille), choix appliqué, toucher extérieur sans effet, VoiceOver (« Enchainement », valeur neutre, items neutres), aspect d'Avec quand Sans est sélectionné (notation grise).

## Correction RC-8 (branche `bmad/pre5-recette1`)

Aucun constat iPhone n'est encore consigné pour elle.

- Cause : la variante `inline` du `SegmentedControl` portait `alignSelf: "flex-end"` (alignement à droite voulu) ; dans la ligne horizontale de la Feuille, cela le posait au bas de la ligne de 44, sous le centre du libellé. Remplacé par `alignSelf: "center"` ; l'alignement à droite vient de la ligne (`space-between`). Hauteurs inchangées (ligne 44, contrôle 32). Composant partagé : la règle vaut pour toutes les lignes à segmenté `inline`, Phases comprises (2.8).
- Cadence : le ± révélé par Autre est rendu sous la ligne, hors de la rangée du libellé ; le segmenté reste centré sur le libellé.
- À vérifier sur iPhone : Mode, Condition d'arrêt, Type de série, Charge, Changement de côté, Cadence (± ouvert et fermé).
