# KODJO — Corpus pilote et chargement des mouvements de test

**Date :** 6 novembre 2026. **Statut :** tranche expérimentale de référentiel et de tests, sans publication de contenu et sans modification du moteur d'exécution.

## Deux ensembles strictement séparés

**Corpus éditorial — `catalogue/pilote/mouvements-60-candidats.json`.** Transcription des 60 fiches de `KODJO_Catalogue_reeducation_fitness_60_fiches.xlsx` (10 rééducation ; 10 CrossFit ; 10 HYROX ; 10 Pilates ; 10 Yoga ; 10 stretching ; 239 étapes). Il conserve les colonnes historiques dans `originalClassification` et `originalPrescriptionContext`. Ses `proposedSpecialties` sont **des suggestions non arbitrées** : une même fiche pourra ultérieurement porter plusieurs spécialités. Toutes les fiches sont `UNREVIEWED` et `publicationAllowed=false`. Les associations KODJO définitives restent absentes (`kodjoCategoryId=null`, `kodjoBodyZoneIds=[]`). Aucune appartenance ou propriété légale ne peut être déduite de la seule URL documentaire.

Ce fichier **ne peut pas** être utilisé comme paquet publié ni chargé directement dans la base mobile. Les sources et droits doivent être contrôlés ; les dix fiches de rééducation nécessitent aussi la validation clinique appropriée. Le modèle auteur/propriétaire/version est décrit dans [Provenance et propriété](../../docs/KODJO-Provenance-propriete-fiches-mouvements-2026-11-06.md).

**Corpus de smoke tests — `src/infrastructure/database/testing/smokeMovementFixtures.ts`.** Trois Mouvements indépendants sont volontairement classés avec les identifiants de Catégories et Zones **existants** de KODJO. Leur classification n'est qu'un choix de test ; ce n'est pas l'approbation du catalogue public.

## Contrôles disponibles

```bash
node scripts/catalogue/validate-pilot-corpus.mjs
node --test scripts/catalogue/__tests__/validate-pilot-corpus.test.mjs
npm test -- --runInBand src/infrastructure/database/__tests__/seedMovementTestCorpus.test.ts
```

- Le validateur éditorial vérifie 60 candidats, 239 étapes, IDs, URLs des sources, longueur des consignes et interdiction de publication.
- Le seed de test passe par les validateurs du Domaine et `insertMovement` déjà présent, sur la connexion SQLite fournie ; **une seule transaction** pour tout le lot.
- Il refuse les collisions d'ID ou de nom, refuse de remplacer un Mouvement préexistant divergent et est idempotent sur un Mouvement identique.
- Les tests utilisent `NodeSqliteDatabase.openInMemory()`, les migrations actuelles et les Catégories/Zones existantes : **aucune donnée de production** n'est touchée.

## Ce qui n'est pas encore livré

La synchronisation entre Git et une base utilisateur, l'installation des catalogues par spécialité, les comptes de coachs, la gestion des droits, l'interface Web d'administration, le mapping validé des 60 candidats et les jeux de données de Séances/Exécutions sont des lots ultérieurs. La collision de noms entre deux fiches éditoriales différentes et l'unicité actuelle de `Movement.name` restent **À CLARIFIER**.

Pour les futures bases applicatives, il faudra une stratégie séparée de chargement/versionnement avec préservation des personnalisations locales ; le seed de test **n'est pas un importateur de production**.
