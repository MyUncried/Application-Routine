# Proposal — intégration de la spécification « Évolution des paramètres d’exécution » v3.0

## Why

Le propriétaire a clos le 18/10/2026 les arbitrages d’une évolution de la feuille des paramètres d’exécution d’un Exercice : [source/KODJO_Charge_Specification_2026-10-18.md](source/KODJO_Charge_Specification_2026-10-18.md), version 3.0 (empreinte SHA-256 `9670dc09…9d60c30`). Ces décisions doivent rejoindre la documentation principale avant la fusion de `docs/openspec-revision` dans `main`, sans créer de chapitre permanent, d’annexe redondante ni de source normative concurrente.

## What Changes

Intégration, dans les chapitres 01 à 13 et les DSF concernés, des décisions finales de la spécification :

- **Charge** (CH-01 à CH-09, section 12) : paramètre informatif facultatif en kg, commun ou par série, pas de 0,25 kg, zéro = Sans, conservation des valeurs désactivées, synthèse et affichage en exécution.
- **Changement de côté Avec / Sans** (CO-01, PR-05) : suppression du choix anatomique de départ (D→G / G→D), conservation de la bilatéralité, des deux enchaînements et de la Pause entre les côtés ; « côté 1 / côté 2 » dans les textes. **BREAKING** pour les données : D→G et G→D deviennent Avec.
- **Cadence** (CA-01) : choix rapides Autre | 5 s | 2 s | 1 s | Sans, sans nouvelle règle de calcul ni nouvelles bornes.
- **Durée de l’exercice** (DU-01) : libellé visible, chevron de repli des signaux Compte à rebours et Fin d’exercice, sans effet sur les valeurs ni sur le calcul.
- **Chevrons intégrés** (CV-01) aux options Variables et Avec (phases).
- **Condition d’arrêt** (AR-01) : saisie en séries identiques, résultat dérivé non modifiable en séries variables (« À la cible et à l’échec » pour le mélange). **BREAKING** pour l’interface : la roulette de durée commune ne propose plus À l’échec (RO-01).
- **Quatre groupes visuels** (GR-01) et compléments de présentation PR-01 à PR-04.
- Remplacement explicite des prescriptions contraires par de nouvelles décisions du registre (D-403 et suivantes), qui nomment ce qu’elles remplacent ; le texte d’origine des décisions remplacées reste lisible.
- Matrice de couverture de toutes les décisions et scénarios (CH, CO, CA, DU, CV, AR, GR, RO, PR, AC-01 à AC-26, section 11.2, section 12), tenue dans ce change, hors documentation principale.

Hors périmètre : propositions abandonnées et variantes intermédiaires (section 11.3), modification de Figma, code applicatif, copies figées PRE-4/PRE-5, BMAD, VNext, fusion dans `main`, modification des PR #363, #370 et #371.

## Capabilities

### New Capabilities

- `integration-specifications-externes` : règles documentaires d’intégration d’une spécification produit validée hors du dépôt (source normative unique, remplacements explicites, couverture tracée hors documentation principale, séparation comportement / rendu Figma). Cette capacité ne contient aucune règle produit.

### Modified Capabilities

Aucune.

## Impact

- Documentation : chapitres 01, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13 et DSF des paramètres (`docs/DSF-*.md`).
- PR ouvertes : #370 (phases d’exercice) introduit le contrôle « Phases de l’exercice » auquel s’appliquent CV-01, GR-01 et RO-01 ; #371 renomme la feuille en « Paramètres d’exécution ». Les correctifs repositionnés de ces PR sont recalculés sur l’état final ; les points qui dépendent des phases sont signalés dans la matrice.
- Figma : lecture seule ; écarts relevés dans le rapport de conformité.
