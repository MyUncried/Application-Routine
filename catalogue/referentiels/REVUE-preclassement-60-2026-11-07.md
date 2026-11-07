# KODJO — Revue des 60 propositions de classification

**Date :** 7 novembre 2026. **Statut :** PROPOSITION ÉDITORIALE, **AUCUNE FICHE APPROUVÉE**. Ce rapport documente la qualification du préclassement, distincte de l'homologation des droits et de la revue clinique.

## 1. Périmètre et sources

- Catalogue pilote de 60 fiches et 239 étapes : `catalogue/pilote/mouvements-60-candidats.json`, reproduction structurée du classeur pilote du 27/10/2026.
- Taxonomie V0 en attente : `catalogue/referentiels/taxonomie-v0-proposition.json`.
- Correspondances proposées **60/60** : `catalogue/referentiels/preclassement-60-candidats-v0.json`.
- Référentiels historiques des Catégories et Zones : `src/domain/categories/defaults.ts`, `src/features/reference-data/bodyZones.ts`. Ces listes sont des *seeds* historiques, pas des copies du référentiel personnalisable actuel de l'utilisateur.

## 2. Portée des préclassements

| Axe | Constats | Statut |
|---|---|---|
| Catégorie / objectif principal | Une catégorie KODJO proposée pour chaque mouvement : Renforcement 25 ; Mobilité 11 ; Étirements 11 ; Équilibre 5 ; Cardio 5 ; Coordination 2 ; Récupération 1 | **60 À VALIDER** |
| Zones corporelles | Au moins une zone KODJO par mouvement | **60 À VALIDER** |
| Spécialité | 10 fiches proposées dans chacune des 6 spécialités initiales | **60 À VALIDER** ; multispécialité possible mais non systématiquement établie |
| Familles gestuelles | Une ou plusieurs associations parmi les 19 familles candidates | **60 À VALIDER** |
| Cibles anatomiques | 36 fiches avec ≥1 cible candidate ; 24 sans cible (facultatif) | **À VALIDER** |
| Problèmes cliniques | Aucune association automatique | **NON ÉTABLI** ; revue clinique distincte |
| Propriétaire, auteurs, médias et licences | Non attribués par le préclassement ; données personnelles de brouillon conservées séparément | **NON MODIFIÉS** |

Ces chiffres sont des **comptages de propositions**, pas une preuve de justesse biomécanique ni une validation produit. La catégorie KODJO remplit le rôle d'objectif principal : aucun champ Objectif distinct.

## 3. Neuf fiches nécessitant une revue prioritaire

| Fiche | Point de décision | Statut |
|---|---|---|
| `REED-004` — Placement des omoplates | Catégorie proposée « Coordination » ; vérifier le positionnement par rapport à « Renforcement » | À CLARIFIER |
| `REED-006` — Descente excentrique du poignet | Famille gestuelle « Mobilisation articulaire » peu cohérente avec une descente excentrique résistée : définir une famille adaptée ou justifier | À CLARIFIER |
| `REED-007` — Flexion dorsale de cheville à l’élastique | Famille « Mobilisation articulaire » alors que la fiche est proposée en Renforcement : distinguer mouvement et intention | À CLARIFIER |
| `FIT-CRO-008` — Box jump | Catégorie « Renforcement » ; la puissance/réception pourrait mieux relever de Coordination selon la nomenclature actuelle | À CLARIFIER |
| `FIT-HYR-008` — Wall balls | Renforcement vs Cardio selon l'intention : déterminer l'objectif principal pour la fiche | À CLARIFIER |
| `FIT-HYR-010` — Step-up sur plateforme | Source pilote indique une préparation HYROX non officielle : la spécialité ne doit pas suggérer un atelier de compétition | À CLARIFIER |
| `FIT-PIL-002` — Roll Up | Mobilité vs Renforcement/contrôle du tronc : vérifier la catégorie principale | À CLARIFIER |
| `FIT-YOG-001` — Tadasana | Équilibre vs posture statique ; cohérence de la hiérarchie de classification | À CLARIFIER |
| `FIT-YOG-010` — Setu Bandha | Mobilité vs Renforcement ; cohérence avec le pont Pilates et différences éventuelles de consignes | À CLARIFIER |

Les 51 autres ne sont **pas** validées par l'absence d'un drapeau prioritaire : elles restent toutes `PENDING`. Ces drapeaux servent uniquement à ordonner la revue.

## 4. Fusion conservatrice des classifications

Le module `scripts/catalogue/validate-preclassification.mjs` expose :
- `validatePreclassification` : vérification des 60 identités candidates, Catégories et Zones historiques, axes de la taxonomie, unicité, cardinalité, statut de non-publication et absence de problèmes cliniques préattribués ;
- `mergeProposalsIntoDrafts` : remplissage **uniquement des champs de classification vides** dans un export de brouillons `KODJO_ADMIN_DRAFTS`. Préserve intégralement les médias/photos, noms, étapes, alias, acteurs, notes et associations déjà renseignées. **Refuse** les anciens brouillons de démonstration plutôt que d'en supprimer silencieusement les données.

La fusion est **une proposition technique testée**, sans action automatique sur la page OVH ni sur `main`. L'outil statique de rapprochement précédemment livré peut aussi être utilisé pour un brouillon exporté, mais sa compatibilité avec les modifications déjà saisies doit être contrôlée avant réimport.

## 5. Barrières et suite

1. Ne pas modifier les 60 fiches originales, ni les médias, ni la base utilisateur.
2. Ne pas considérer les valeurs proposées comme validées sans revue du produit ; distinguer compatibilité structurale, contrôle biomécanique, preuve clinique et droits.
3. Conserver l'export actuel des brouillons de l'utilisateur avant tout essai de fusion ; ne pas publier les JSON sur OVH.
4. Pour la suite : revue des neuf cas prioritaires, puis revue par spécialité des 51 autres ; validation de la taxonomie et de la gouvernance de publication ; préparation de l'import productif seulement après arbitrages.
5. Lancement du moteur d'exécution **indépendant** : aucun changement dans `Movement.ts`, migrations, formats, plans ou instantanés.

**Évidences de tests** : le script de qualification et les tests `node:test` de préclassement, conservation médias, idempotence et refus des données incompatibles sont exécutés par le workflow GitHub du catalogue sur la branche de revue.
