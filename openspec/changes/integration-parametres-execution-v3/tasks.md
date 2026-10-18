# Tasks — intégration de la spécification v3.0 des paramètres d’exécution

## Clôture du 18/10/2026

Le change est archivé le 18/10/2026 après l’intégration des PR #363, #370 et #371. Les tâches ci-dessous ne sont **pas** réalisées ; elles restent des limites connues, sans nouveau chantier ouvert :

- 4.5 Revue indépendante ChatGPT
- 4.9 Coordinations : tokens de la feuille (chantier DSF, Q-V3-10) ; phases (intégrées depuis #370 ; restent le report des trois écrans dédiés et le passage de Avec à Sans avec des phases existantes, Q-V3-17) ; corpus de recette v15 des phrases (Q-V3-02)
- 4.7 Annexe « Matrice de traçabilité » : à régénérer quand l’outil reconnaîtra les règles écrites en titres (RM-235 à RM-250)

## 1. Préparation

- [x] 1.1 Copier la spécification source dans `source/` et relever son empreinte
- [x] 1.2 Inventaires en lecture seule : charge, côtés, cadence, durée et signaux, condition d’arrêt, présentation de la feuille
- [x] 1.3 Vérification Figma en lecture seule : frames citées, scénarios §11.2, captures du ch. 06, frames d’exécution

## 2. Décisions et règles

- [x] 2.1 Registre : décisions D-403 à D-413, avec ce qu’elles remplacent et les exclusions de §11.3
- [x] 2.2 Chapitre 10 : règles RM-235 à RM-250, source normative unique
- [x] 2.3 Statut des décisions remplacées ou précisées (D-143, D-148, D-149, D-151, D-154, D-219, D-247, D-249, D-251, D-308, D-321, D-339, D-341, D-377, D-384, D-396, D-397), texte d’origine conservé

## 3. Propagation

- [x] 3.1 Chapitres 01 à 05 (glossaire, besoin B-092, parcours, modèle)
- [x] 3.2 Chapitre 06 : textes de la feuille et 20 captures actuelles (`images/parametres-2026-10-18/`)
- [x] 3.3 Chapitres 08, 09, 11, 12 (conception, données, API, architecture ; tokens non modifiés)
- [x] 3.4 Chapitre 13 : CE-UI-10 et règles communes de l’éditeur ; autres contrats (cartes, exécution, bilatéralité, formats, synthèses)
- [x] 3.5 DSF, PRODUCT et INDEX : blocs datés du 18/10, prescriptions remplacées marquées sans suppression
- [x] 3.6 Annexe « Index des identifiants » complétée (B-092, D-403 à D-413, RM-235 à RM-250)

## 4. Contrôles et livrables

- [x] 4.1 Rejeu exact, conservation C1–C7 (C4 sur la colonne Décision), rédaction, liens, K1, K2, OpenSpec `--strict`
- [x] 4.2 Contrôle transversal des formulations résiduelles (côtés, pied commun, chevron indépendant, stepper Bip, option « Aucune durée, à l’échec »)
- [x] 4.3 Correctifs repositionnés des PR #363, #370, #371 recalculés et vérifiés par `git apply --check`
- [x] 4.4 Matrice de couverture, dossier de questions, dépendances PR, rapport de conformité
- **Non réalisé à la clôture (limite consignée) :** 4.5 Revue indépendante ChatGPT
- [x] 4.6 Réponses de Hermann (18/10/2026) : D-414 à D-421 enregistrées et propagées (40 corrections, `V3-11-arbitrages-hermann`) ; dix questions traitées par les décisions existantes ; seconde passe de contrôle indépendante, 10 écarts corrigés (21 corrections, `V3-12-seconde-passe`)
- [x] 4.10 Hermann : Q-V3-16, Q-V3-19, Q-V3-20 tranchées (D-422 à D-424, lot `V3-13`, 11 corrections)
- **Non réalisé à la clôture (limite consignée) :** 4.9 Coordinations : tokens de la feuille (chantier DSF, Q-V3-10) ; phases (intégrées depuis #370 ; restent le report des trois écrans dédiés et le passage de Avec à Sans avec des phases existantes, Q-V3-17) ; corpus de recette v15 des phrases (Q-V3-02)
- **Non réalisé à la clôture (limite consignée) :** 4.7 Annexe « Matrice de traçabilité » : à régénérer quand l’outil reconnaîtra les règles écrites en titres (RM-235 à RM-250)
- [x] 4.8 Report des PR par leurs chantiers, puis fusion dans `main` sur décision de Hermann ; archivage du change ensuite — PR : intégrées et fermées le 18/10/2026 (lots V3-14 à V3-21) ; change archivé ; la fusion dans `main` reste à décider par Hermann
