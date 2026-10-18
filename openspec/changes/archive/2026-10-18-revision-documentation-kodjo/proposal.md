# Proposal (révision 2)

## Why

La documentation KODJO (13 chapitres, 1,44 Mo, et environ 60 DSF, matrices et rapports) ne permet pas toujours de retrouver, pour chaque règle, une référence unique et sûre :

- ordres de priorité concurrents ;
- remplacements implicites ;
- copies multiples ;
- liens rompus ;
- identifiants et statuts perdus.

Les diagnostics ([diagnostic.md](diagnostic.md), [qualite.md](qualite.md)) ont été examinés par ChatGPT : leur orientation est retenue, et le plan est révisé en conséquence. La vérification de l'historique Git montre qu'une part importante des pertes vient de deux commits, `37e372cd` (07/10) et `7a89220f` (14/10). Ces pertes sont **restaurables sans décision produit**.

## What Changes

Aucune spécification produit n'est modifiée par cette révision. Le change propose :

- **Une gouvernance allégée** ([design.md](design.md), G1 à G10) :
  - les 13 chapitres restent la structure, tant que la restructuration proposée par le lot 6A ([lot6/plan-restructuration.md](lot6/plan-restructuration.md)) n'est pas validée ;
  - une source normative unique par règle, atteinte progressivement ;
  - les DSF restent applicables jusqu'au transfert vérifié de leurs règles ;
  - l'emplacement ne tranche aucune contradiction ;
  - restauration des identifiants avant toute numérotation ;
  - ancres et mentions de statut seulement là où elles apportent une valeur ;
  - OpenSpec sert d'outil de gestion des changements, sans seconde source normative.
- **Six lots ordonnés** ([tasks.md](tasks.md)), chaque tâche étant classée documentaire ou fonctionnelle :
  1. restauration et traçabilité des décisions ;
  2. liens et références ;
  3. identifiants effacés ;
  4. autorité documentaire ;
  5. contradictions déjà arbitrées ;
  6. restructuration documentaire (conception 6A : [lot6/plan-restructuration.md](lot6/plan-restructuration.md)) et amélioration progressive.
- **Un premier lot délimité :** le seul registre ch. 07. Il restaure, à l'identique depuis Git et sans changement de statut :
  - 24 textes de décisions ;
  - les colonnes de 13 décisions ;
  - des renvois dans 10 décisions ;
  - 2 décisions validées perdues lors d'une fusion (D-334 et D-335). L'inventaire exact figure dans [constats/LOT-1-registre.tsv](constats/LOT-1-registre.tsv).
- **Un tableau des arbitrages** réexaminés avec leurs preuves ([arbitrages.md](arbitrages.md)). Il distingue les questions résolues par les sources, les recommandations documentaires et les véritables arbitrages produit.

**Hors périmètre :**
- code, Figma, BMAD, VNext ;
- push, `/opsx:apply`, archivage du change ;
- renumérotation générale, refonte de chapitres, nouvelles règles bloquantes.

## Capabilities

### New Capabilities

- `gouvernance-documentaire` : manière de gérer la documentation fonctionnelle (source unique par règle, résolution explicite des contradictions, texte d'origine des décisions remplacées, restauration des identifiants, liens résolus, séparation comportement / rendu, classement des corrections, absence de seconde source dans OpenSpec). Elle ne contient aucune règle produit.

### Modified Capabilities

(aucune)

## Impact

- **Documentation :** aucun fichier de `docs/` n'est modifié avant l'accord de Hermann sur un lot.
- **PRE-4 :** le lot 1 et la plupart des lots 2 à 5 touchent des sources figées par PRE-4 (`caa2a5cf`). Ils exigent l'accord explicite A-PRE4.
- **PR ouvertes :** aucune ligne restaurée n'est modifiée par les PR #363, #370 ou #371, ce qui a été vérifié. Celles-ci touchent cependant les mêmes fichiers : l'ordre de fusion est soumis à Q-L.
- **Base d'analyse :** `main` `6656fefc`, conservée. Les évolutions postérieures sont consignées dans [diagnostic.md §7](diagnostic.md).
