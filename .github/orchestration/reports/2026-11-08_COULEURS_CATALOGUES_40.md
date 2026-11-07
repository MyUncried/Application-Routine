# Rapport de mission — COULEURS_CATALOGUES_40 (8 novembre 2026)

- **Objectif :** sur demande de Hermann (08/11/2026), foncer la zone de contexte du catalogue des Mouvements et dériver le fond de chaque catalogue à 40 % de sa couleur de contexte posée sur blanc.
- **Branche :** `docs/couleurs-catalogues-40-20261108`, créée depuis `origin/main`.
- **Figma :**
  - couleurs de base renommées avec leur valeur : `sky-context-DDEBFF`, `sky-background-F1F7FF`, `background-tint-F7F7FF`, `violet-background-F9F6FF` ;
  - fondus de navigation non liés réalignés (15 écrans Mouvements, 14 calques Séances) ;
  - planche DSF `11734:2100` mise à jour.
- **Constat :** aucun calque gris ne recouvrait le fond Mouvements ; c'est le bleu ciel à faible intensité qui paraissait gris.
- **Valeurs retenues :**

  | Catalogue | Contexte | Fond |
  |---|---|---|
  | Mouvements | #DDEBFF | #F1F7FF |
  | Séances | #EAEAFF | #F7F7FF |
  | Programmes | #EFE8FF | #F9F6FF |

- **Documentation :**
  - spec du 6/11, §3 : tableau et règle de dérivation ;
  - chapitre 07 : D-501 annotée (révision, pas de nouveau numéro, pour éviter une collision avec la mission EMOM en cours) ;
  - chapitre 12 : jetons ;
  - chapitre 06 : annotation.
- **Synchronisation code / documentation :** classe B, code non modifié. Jetons à reporter dans `src/shared/ui/tokens.ts`.
- **Tests :** aucun applicable.
- **À vérifier sur appareil :** perception des fonds de jour, sans Night Shift.
- **Fichiers modifiés :**
  - la spec du 6/11 ;
  - chapitres 06, 07 et 12 ;
  - ce rapport.
- **Commit final et état Git :** donnés dans le compte rendu de livraison.
