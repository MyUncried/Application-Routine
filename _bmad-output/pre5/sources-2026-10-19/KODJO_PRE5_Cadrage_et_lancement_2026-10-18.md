# KODJO — Cadrage et lancement PRE‑5
18 octobre 2026 — Préparation BMAD à partir de PRE‑4 livré

## Objectif
Finaliser la présentation de la création d’exercice et faire évoluer ses paramètres : phases, charge, côtés, condition d’arrêt et saisie numérique. Conserver les comportements validés de PRE‑4 sauf changement explicitement demandé. BMAD reste indépendant de VNext.

Ce document prépare le travail ; il ne déclare ni une session Claude démarrée, ni des fichiers installés sur le PC, ni un développement effectué.

## Base et sources
Base applicative examinée : merge PRE‑4 `1116586b35e4767c0c6ecedb0564680f17a7cd70`, PR #372 de MyUncried/Application-Routine. Au démarrage, comparer avec main courant et préserver les éventuels travaux ultérieurs.

Sources complémentaires consultées :
- Demande PRE‑5 d’Hermann et accord du 18 octobre dans cette conversation.
- `KODJO_Charge_Specification_2026-10-18(1).md`, contenu version 3.0 du 18 octobre : règles CH, CO, CA, DU, CV, AR, GR, RO et compléments de présentation. Les sections couvrent aussi des évolutions futures hors éditeur ; ce document n’étend pas automatiquement PRE‑5 à toute l’exécution.
- `KODJO-Phases-specification-consolidee-2026-10-15.md`, version interne consolidée du 16 octobre, version de fichier 1 : règles d’édition, compatibilité et calcul examinées, sections 1 à 4.1. Les conséquences détaillées sur l’exécution ne sont pas un mandat de développer un moteur dans PRE‑5.
- Audit indépendant PRE‑4 du 18 octobre : réutiliser le code ; définir le delta avant de créer les stories.
- Registre de modification de création d’exercice, demande de description en étapes numérotées : à raccorder à sa version documentaire finale avant réalisation. Ne pas reclasser cette demande comme absente au seul motif qu’elle manque dans un chapitre.

Les compléments documentaires et Figma sont en cours de vérification par Hermann. Leur intégration au dépôt n’est pas présumée. Relever les chemins et révisions effectivement disponibles ; demander seulement les sources réellement manquantes. Figma n’a pas été relu dans cette préparation : aucune dimension nouvelle n’est affirmée ici.

## Périmètre fonctionnel

### Écran principal de création/modification
- Conformité Figma du titre, des catégories et zones corporelles dans le contexte, des titres de section, des polices, tailles, couleurs et positions.
- Description en étapes numérotées, incluant saisie, modification, numérotation, sauvegarde et réouverture. Conserver le texte des exercices existants ; définir sa reprise sans découpage destructif arbitraire.
- Retirer du résumé des paramètres les informations de compte à rebours et de fin. Il s’agit d’un retrait de présentation, pas d’une suppression de leurs données ou fonctions.
- Abaisser Terminer conformément à Figma et préserver une zone au-dessus empêchant le contenu d’être masqué, avec clavier ouvert et fermé.

### Paramètres fonctionnels
- Phases ordonnées dans le modèle, édition et règles de compatibilité ; durée de série dérivée de leur somme ; adaptation des calculs et synthèses concernés.
- Charge informative facultative en kg, commune aux séries identiques ou par série variable ; conservation des valeurs désactivées, saisie décimale et copie.
- Changement de côté Avec/Sans, sans choix anatomique initial. Conserver les stratégies d’enchaînement et pauses applicables.
- Condition d’arrêt commune modifiable pour les séries identiques, résultat dérivé pour les séries variables selon AR‑01.
- Saisie numérique des valeurs concernées, avec gestion du clavier et de la visibilité du champ édité. Identifier les champs et modalités depuis les références finales ; ne pas remplacer indistinctement toutes les roulettes.

### Présentation des paramètres
- Nouveau regroupement et ordre des champs, contrôles, tableaux, typographies et espacements.
- Visibilité et disponibilité selon les paramètres, repli/déploiement sans perte de données.
- Raccourcis de cadence, signaux repliables et chevrons intégrés dans la mesure définie par la référence finale retenue.
- Aucun ajout de règle métier déduit de valeurs illustratives Figma.

## Clarifications issues des sources
1. Le code PRE‑4 distingue deux modes techniques DURATION/REPETITIONS et des cibles NUMBER/FAILURE/UNSET. Les « trois résultats » d’arrêt ne justifient pas trois nouveaux modes techniques.
2. AR‑01 définit « À la cible et à l’échec » comme résultat mixte calculé, sans troisième bouton ni nouvelle valeur persistée si le calcul depuis les séries suffit. Le libellé du cadrage utilisateur « À l’échec et à la cible » doit être harmonisé avec la décision finale, sans modifier le sens.
3. CH‑05 arrête déjà : pas de 0,25 kg, arrondi supérieur à la sortie du champ, zéro sans charge, absence de plafond métier, activation initiale à 0,25 kg et restauration des valeurs mémorisées. Ne pas redemander ces arbitrages.
4. La spécification des phases réserve celles-ci au mode Durée, à cible chiffrée et séries identiques. Elle fixe zéro à six phases, libellé de 20 caractères et durée positive en secondes ; zéro temporaire est normalisé à la validation. Les règles détaillées restent à lire dans la source.
5. La spécification des phases utilise encore des formulations antérieures sur les côtés. La décision ultérieure Avec/Sans prime sur la désignation anatomique ; les enchaînements restent.
6. La spécification générale de charge prévoit aussi un affichage pendant l’exécution. Le périmètre PRE‑5 demandé reste l’éditeur et ses paramètres : ne pas ouvrir de chantier cadran, audio ou moteur. Préserver et transmettre les nouvelles données dans les copies existantes ; signaler une dépendance indispensable si elle apparaît.
7. Le nom de style `phasesRow` dans ActivityEditorForm désigne actuellement les informations compte à rebours/fin ; il ne constitue pas une implémentation des phases métier.

## Premier relevé de réutilisation
Lecture ciblée de la base livrée, à compléter par Claude avant planification.

| Besoin | Existant identifié | Delta attendu |
|---|---|---|
| Cibles et séries | ExecutionParameters.ts : v2, cibles typées, UNIFORM/VARIABLE | Réutiliser ; ajouter charge et phases, dériver l’état global d’arrêt |
| Côtés | sideMode anatomique et sideOrder BY_SIDE/BY_SERIES distincts | Neutraliser l’anatomie en conservant l’enchaînement et la compatibilité |
| Brouillon | ExecutionParametersDraft.ts | Étendre les opérations existantes et l’annulation |
| Feuille | ExecutionParametersSheet.tsx et contrôles natifs existants | Adapter contrôles et disposition ; ne pas reconstruire tous les gestes |
| Éditeur | ActivityEditorForm.tsx : description texte, résumé, bouton Terminer | Étapes, style et positionnement ciblés |
| Compte à rebours/fin | Informations visuelles et label accessible du résumé | Retirer la présentation demandée et ajuster la sémantique accessible |
| Persistance | JSON v2, repositories, migration010 livrée | Adapter lecture/écriture/copies ; nouvelle migration seulement si nécessaire |
| Calcul et phrase | Fonctions existantes dans src/domain/activities | Phases et mention de charge ; conserver le reste de la grammaire |

Chemins principaux : `src/domain/activities/ExecutionParameters.ts`, `ExecutionParametersDraft.ts`, `executionPhrase.ts` ; `src/features/activities/ExecutionParametersSheet.tsx`, `ActivityEditorForm.tsx` ; repositories sous `src/infrastructure/database/`.

## Lots proposés
Ces lots ne constituent pas cinq stories imposées. Scinder uniquement pour obtenir des changements testables et cohérents.

| Lot | Résultat | Dépendance |
|---|---|---|
| 1 — Modèle et compatibilité | Phases, charge, côtés ; sérialisation, sauvegarde, copie et reprise de l’existant | Règles métier retenues |
| 2 — Paramètres et saisie | Édition, combinaisons, résultat d’arrêt, clavier ; calculs et synthèse affectés | Lot 1 |
| 3 — Présentation des paramètres | Feuille conforme au nouveau format et à ses états | Avec le lot 2, pour éviter deux réécritures |
| 4 — Description en étapes | Saisie et restitution numérotées, conservation de l’ancien texte | Contrat de saisie ; indépendant de 1 |
| 5 — Présentation de l’éditeur | Titre, contexte, sections, résumé et Terminer | Références Figma ; coordination avec 4 |

Une fonctionnalité déjà conforme reste un point de non-régression. Ne pas lui créer une story de développement sans delta.

## Limites
Pas de refonte des médias, référentiels, catalogue, composition, planification, formats de séance ou moteur temps réel. Adapter leurs points de passage existants seulement lorsque nécessaire pour conserver les nouvelles données et leur cohérence. Les règles de format déjà applicables aux phases sont à raccorder si le parcours existe, sans créer un nouveau module de formats.

Pas de reprise des mécanismes VNext. Pas de suppression de contrôles produit existants par commodité. Pas de refactorisation générale justifiée seulement par un document BMAD généré.

## Processus court de préparation
1. Vérifier la base et les sources ; lire le code concerné.
2. Produire la table « exigence → source → existant → changement → conservé → validation » avant les stories.
3. Préparer PRD ciblé, décisions techniques et stories proportionnées avec le workflow BMAD installé.
4. Transmettre le dossier à ChatGPT pour la revue indépendante déjà convenue. ChatGPT contrôle la couverture et les interprétations ; Claude ne déclare pas cette revue réalisée lui-même.
5. Après retour et autorisation d’Hermann, développer puis faire vérifier rapidement les gestes/layout sur appareil. Les décisions de recette d’Hermann priment et sont répercutées dans les documents.

La revue ne doit pas devenir un nouveau protocole de blocage : traiter les ambiguïtés uniquement là où elles affectent le changement. La documentation en cours ne bloque pas l’inventaire technique des parties stables.

Validation proportionnée : tests ciblés des règles et de la persistance, contrôles de types/lint applicables, non-régression des parcours touchés et recette visuelle. Éviter de répéter une campagne complète pour chaque retouche visuelle ; respecter les exigences de livraison existantes.

## Prompt de démarrage pour Claude
Tu prépares PRE‑5 BMAD de KODJO à partir de PRE‑4 livré sur main (PR #372, merge 1116586b35e4767c0c6ecedb0564680f17a7cd70). Lis ce cadrage entièrement.

Utilise le clone BMAD PRE‑5 existant s’il est disponible, en préservant ses modifications et son découplage VNext. Vérifie sa base : son ancienne préparation ne doit pas servir de base applicative à la place de PRE‑4 livré. Travaille sur une branche dédiée ; n’écrase ni ne réinitialise aucun travail local.

Commence par l’inventaire des sources et la lecture du code concerné. Recherche les spécifications finales des phases, de la charge/paramètres et de la description en étapes dans les documents disponibles et le dépôt. Distingue les sources présentes des fichiers seulement mentionnés dans ce cadrage ; si un fichier manque, demande-le précisément sans inventer son contenu ni bloquer les lectures indépendantes.

Produis la table de delta avant les stories : besoin PRE‑5, source, code existant, modification nécessaire, éléments conservés, validation. Réutilise notamment les cibles typées, les séries variables, les calculs, les brouillons et les contrôles natifs de PRE‑4. N’ajoute pas de troisième mode ou de condition Mixte persistée pour un résultat calculable.

Puis poursuis la préparation BMAD selon les commandes réellement installées : PRD ciblé, architecture des seuls changements, découpage proportionné et planification. Les cinq lots sont une organisation proposée, pas un quota de stories. Réutilise les documents sources ; ne reformule pas tout le produit.

Les références visuelles sont en cours de vérification par Hermann. Identifie les frames et états nécessaires et les propriétés manquantes ; ne déduis pas des règles métier de leurs chiffres. Ne redemande pas les décisions déjà closes dans les sources.

Arrête-toi avant l’implémentation pour transmettre à ChatGPT le dossier de revue : table de delta, sources et révisions, PRD, décisions techniques, stories, points réellement non résolus. La revue indépendante ne peut être déclarée faite sans son retour. Aucun push, fusion, publication EAS ou changement Figma dans cette préparation.

Présente un compte rendu bref : ce qui existe, ce qui change, les questions indispensables et la prochaine étape.

