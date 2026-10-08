# PRE-3 — Analyse ciblée de l’existant et suite de la planification

Date : 08/10/2026. Baseline lue : 17d9774a31429bc2bee4eb834e4ed1e9aafa68ec.
Relecture ciblée le 08/10 sur main après #338 : les constats ci-dessous restent présents. Statut : préparation technique ; aucun fichier applicatif modifié et aucun plan approuvé.

## Constats vérifiés dans le code

| Sujet | Existant réel | Travail à prévoir dans le plan |
|---|---|---|
| Paramètres | ActivityDefinition et SessionDraft portent durée/répétitions, nombre et pause scalaires | Collection ordonnée de Séries, état variable explicite, ordre des côtés, bip, compte à rebours/fin et compatibilité anciennes données |
| Éditeur | ActivityEditorForm rend une rangée de champs et des overlays ; bouton exercise-add-media désactivé (lignes331–340) | Carte à phrase et vraie feuille Paramètres ; branchement d’import ; quatre parcours Catalogue/Séance |
| Calcul | calculations.ts:156–178 attribue un travail0 aux modes inconnus et utilise nombre×durée + pauses ; la fonction intrinsèque217–228 ne reçoit pas d’ordre par paire ni de collection variable | Résultat typé exact/estimated/omitted/lowerBound selon contexte ; formules v13/Bip v2 et inversion applicable |
| Défaut récupération | ExerciseScreen:600–608 copie encore le défaut Profil à la création de l’occurrence | Ne plus créer automatiquement une récupération dans le parcours PRE-3, conserver celles déjà attachées ; placement complet PRE-4 |
| Média local | MediaAsset ne porte que id, uri, createdAt | Type photo/vidéo et métadonnées nécessaires, URI interne stable, fichiers conservés tant que référencés |
| Tables | migration007:117–132 crée media_assets et activity_media ; association ordonnée, rang unique par définition | Migration additive, sans recréer/supprimer l’existant ni conserver les fichiers dans SQLite |
| Repository média | MediaRepository et SqliteMediaRepository offrent seulement listForActivityDefinition | Import/écriture et lifecycle des fichiers à brancher ; lecture ordonnée réutilisable |
| Écriture associations | SqliteActivityDefinitionRepository:213–216 supprime les anciennes associations puis insère input.media ou [] dans une transaction | Charger/conserver les associations en édition ; omission du média ne doit pas effacer une association préexistante |
| Projection d’édition | activityDefinitionToInput ne transmet pas media ; activityDefinitionToDraftExercise n’inclut pas les associations | Préremplissage complet, copie indépendante des associations et référence au même fichier physique |
| Migration | Arbre baseline : migrations001 à008, aucune009 | Revalider le numéro disponible à l’ouverture du développement, pas réserver une009 globale dès maintenant |

Ces constats expliquent les adaptations nécessaires ; ils ne sont pas un diagnostic d’une livraison PRE-3 déjà réalisée. Aucun test n’a été exécuté sur ce code dans cette mission.

## Médias : acquis documentaires à conserver

Sources : chapitre09 §§09.6/09.14, D-033, D-066/D-068 amendées quant au périmètre par D-333, D-264.

- Photos ou vidéos locales ; zéro à plusieurs associations ordonnées.
- Nouveau média en dernière position ; réorganisation de l’association, pas modification du fichier.
- Copie/duplication : nouvelles associations pouvant réutiliser le même fichier physique.
- Retrait : suppression de l’association uniquement ; suppression physique interdite tant qu’Exercice, copie ou instantané référence le fichier.
- Miniature éventuelle ; durée pour vidéo ; métadonnées et URI interne stable.
- Vignette du premier média ; couverture si vidéo. Ne pas traiter cette règle comme autorisation de refonte générale des cartes.
- Consultation en exécution et règles audio restent le périmètre du futur moteur ; PRE-3 prépare des données utilisables.

La décision D-333 autorise l’import dans le MVP avant le moteur. Source retrouvée au chapitre05 : ancienne cible du06/09 « capture ou photothèque » en V2 ; photothèque utilisable comme référence d’import, capture caméra dans PRE-3 à clarifier. Elle ne choisit pas à elle seule une capacité caméra, des codecs, des plafonds de taille/nombre, ni une politique de conversion. Ces éléments doivent être retrouvés dans les sources existantes avant de solliciter un arbitrage réellement nécessaire. Aucune nouvelle limite arbitraire n’est proposée ici.

## Fichiers structurants effectivement lus

- src/domain/activities/ActivityDefinition.ts
- src/domain/sessions/SessionDraft.ts
- src/domain/sessions/calculations.ts
- src/domain/media/MediaAsset.ts
- src/domain/media/ActivityMedia.ts
- src/domain/media/MediaRepository.ts
- src/features/activities/ActivityDefinitionService.ts
- src/features/activities/ActivityEditorForm.tsx
- src/features/sessions/ExerciseScreen.tsx
- src/infrastructure/database/migrations/migration007.ts
- src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts
- src/infrastructure/database/repositories/SqliteMediaRepository.ts

## Entrée Figma disponible

L’[extraction détaillée du08/10](extraction-figma.md) est terminée pour les 41 écrans : 6 725 éléments, 41 captures, composants/variantes, tokens et recensement des consommateurs Figma. Elle ne remplace pas le graphe des consommateurs applicatifs.

## Ordre de préparation restant

1. Compléter la lecture des services, repositories de Séance et des consommateurs des calculs/résumés ; produire le graphe d’impact et la liste de tests réellement concernés.
2. Définir le schéma cible et sa migration, la normalisation des paramètres anciens, le brouillon de feuille, le lifecycle des médias et les adaptateurs des quatre parcours.
3. Écrire les assertions atomiques et les preuves attendues, reliées aux 23 exigences P3 du périmètre. Distinguer preuve technique, comparaison visuelle avant recette, et contrôles perceptifs iPhone.
4. Assembler un plan canonique sur le chemin VNext réellement intégré et qualifié ; demander sa revue indépendante. Aucun appel modèle ou lancement de chaîne n’est réalisé dans cette préparation.

## Reprise enregistrée

- state: SPEC_PREPARED
- next_actor: ChatGPT/orchestrateur pour poursuivre la préparation, puis planificateur du parcours retenu
- resume_from: docs/preparation/PRE-3/perimetre-et-couverture.md
- implementation_authorized: false
- issue_product: non créée
- bootstrap_product: non créé
- workflow_product: non lancé
- protocol_integration: #332 ouverte lors du relevé, branche integration/vnext-cutover-20261007
- active_operations: trois contrôles sur cette branche ; aucune opération PRE-3 observée dans la liste in_progress

La publication de cette analyse ne qualifie pas VNext, ne démarre pas V2 et ne transforme pas la préparation en autorisation de développement.

## Arbitrage de reprise PRE-3 — source d’import

Le08/10/2026, Hermann choisit la **photothèque seule** (D-334, issue #340). Photos et vidéos locales restent incluses. Les mentions précédentes « caméra / sources système à clarifier » décrivent la préparation antérieure et sont remplacées sur ce seul point. Formats/compatibilité, permissions effectives et présentation des états/gestes manquants restent à finaliser dans le plan ; aucune limite arbitraire ajoutée.
