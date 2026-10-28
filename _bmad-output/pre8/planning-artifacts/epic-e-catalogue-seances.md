# PRE-8 — Epic E : Catalogue unifié des Séances — plan approuvé (28/10/2026)

> Préparation demandée par Hermann le 27/10/2026 (« KODJO — PRE-8 — Préparation du développement de l'epic E : Catalogue unifié des Séances »). **Développement non commencé** (plan approuvé le 28/10, voir ci-dessous). Branche `pre8-bmad/dev` @ `23a9a4f2` (epics A et B clos, code recetté `88c2adde`). Aucune fusion dans `main`.
>
> **Arbitrages finaux de Hermann du 28/10/2026** (« Arbitrages finaux, validation du plan E et clôture de la session »).
> - Décisions intégrées : E.8-a option B, Q-E3 option B, Q-E4 option B complétée, Q-E5 option A ; Q-E0 et Q-E6 inchangés.
> - Plan approuvé pour E.1 à E.7.
> - E.8-a : point d'entrée tranché le 28/10, option 1 (« Dernier arbitrage E.8-a et finalisation du plan E »). Le plan est entièrement approuvé.
> - Le développement commencera dans une nouvelle session.
>
> **Révision du 28/10/2026**, après la « Revue du plan de l'epic E » de Hermann. Elle est limitée aux passages concernés : §0 (Q-E0), E.4, E.6, E.8, §3, §3 bis (Niveaux), §5. E.1 à E.7 sont validés dans leur principe.

## 0. Sources et baseline

- **Sources E, présentes seulement sur `origin/main` @ `ff7600ac`** (PR #407, après la base PRE-8 `082390c0`) : `docs/KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md`, `docs/DSF-CATALOGUE-SEANCES-2026-10-27.md`, `docs/preparation/catalogue-seances-2026-10-27/PERIMETRE-ET-PROMPT-BMAD.md`, chapitres 07 (décision « Catalogue des séances — carte unique et filtres », D-260/D-261 remplacées au Catalogue), 09 (« Projection Catalogue des séances »), 13 (CE-T03-01 révisé, CE-SU-01). Lues avec `git show origin/main:…`, sans modifier la branche.
- **Intégration de `main`** : une fusion simulée (`git merge-tree`) donne 6 conflits, tous documentaires : DSF Mouvements, ch06, ch07, ch10, ch12, ch13. Le code fusionne sans conflit, `KodjoIcon.tsx` compris.
- **Q-E0, tranché par Hermann le 28/10** : pas de fusion automatique de `main` pour synchroniser les documents. La préparation et le développement lisent les sources validées sur `origin/main` @ `ff7600ac`, citées par commit dans chaque story. Une **intégration documentaire contrôlée** précède la livraison finale de PRE-8 :
  - les deux branches sont conservées ;
  - chacun des 6 conflits est résolu sur le fond, jamais par un choix systématique « ours » ou « theirs » ;
  - chaque résolution est tracée dans le rapport.

  Q-E0 ne bloque aucune story.
- **Figma** : `G6RY5Ebhgwb4AHIOYDwwvg`, page `510:101`, lu le 27/10 dans son état courant (§4).

## 1. Ce que le code PRE-8 fournit déjà (vérifié)

| Besoin E | Disponible | Où |
|---|---|---|
| Structure générale D-449 (Exercices, Circuits, Cycles successifs) | Oui (A.2, A.4) | `src/domain/sessions/structure.ts`, `SqliteSessionRepository` |
| Durée de Séance (calcul commun) | Oui | `aggregateSessionDuration`, `computeActivityDurationResult`, `seriesCircuitContribution` |
| Mouvements : catégories, zones, médias, filtres | Oui (B) | `MovementCatalogueService`, `movementCatalogueView.ts`, `MovementFilterSheet.tsx` |
| Actions glissées, animations de déploiement | Oui (B.5, B.9) | `SwipeActionsRow.tsx`, `SheetMotion.tsx` |
| Commandes rondes, Filtrer étendu, segmenté | Oui (B.9) | `CatalogueCommands.tsx`, `SegmentedControl.tsx` |
| Liste des Séances actives, duplication, création et modification (Composition) | Oui | `SessionService.listActiveSessions`, `duplicateSession`, `CompositionScreen` |
| Statut ACTIVE/ARCHIVED d'une Séance | Colonne seulement | `sessions.status`, `archived_at` (schéma), aucun service |
| Archiver, restaurer, supprimer une Séance | **Non** | aucun service ni repository |
| Planification, Routines | **Non** | `src/features/planning` vide, aucune table `routines` |
| Lancement, Exécution | **Non** | `src/features/execution` vide |
| Format de Séance (EMOM, Tabata…) | **Non** | aucun champ ; ch09 : « les anciennes séances sans format restent libres » |
| Epic C (Composition multi-Circuits, multi-Cycles) | **Non commencé** | les Séances à plusieurs Cycles ne se créent pas encore dans l'interface |

`SessionCard` n'est rendue que par `CatalogueScreen` : les contextes Calendrier, Suivi et Choix n'existent pas encore dans le code. Les changer est donc impossible, et leur non-régression est assurée par construction.

## 2. Stories et ordre de réalisation

Ordre : E.1 → E.2 → E.3 → E.5 → E.4 avec E.8-a → E.6 → E.7.
- E.1 à E.7 sont prêtes à développer (arbitrages du 28/10).
- E.8-a est prête aussi (point d'entrée tranché, option 1) ; elle se livre avec E.4.
- E.8-b est hors E : avec ou après l'epic C, sous une autorisation distincte.

**Dépendances envers l'epic C (non commencé)** : aucune ne bloque E.1 à E.7.
- E.3 : sans C, les Séances à plusieurs Cycles ou Circuits ne se créent pas sur l'appareil, donc leur rendu n'est vérifié que par les tests automatiques.
- E.8-b exige que la sélection de la Composition passe par les Mouvements (C).
- Les trois états du nom (§8 de la spécification) relèvent de C.

### E.1 — Projection de lecture du Catalogue

- **Résultat.** Une fonction pure `projectSessionForCatalogue` part de la Séance (structure A.2) et des Mouvements référencés. Elle calcule :
  - le nombre structurel d'exercices ;
  - les catégories dédupliquées, dans l'ordre de première apparition ;
  - les zones, pour les filtres seulement ;
  - l'étiquette, pour les filtres seulement ;
  - le visuel selon la cascade (photo de l'exercice unique, sinon première photo dans l'ordre de composition, sinon vignette du format, sinon Libre) ;
  - la synthèse et la durée ;
  - l'arbre Cycle, Circuit, Exercice, Récupération.
- **Dépendances.** A.2 et A.4 (disponibles) ; services de Mouvements et médias de B (disponibles). Aucune dépendance à C : la projection lit tout ce que la structure peut représenter.
- **Réutiliser.**
  - `structure.ts` et les calculs de durée existants, sans nouvelle formule ;
  - le volume d'un exercice par le résumé de séries existant (`formatSessionSummary`) ;
  - les médias Mouvement et Séance existants.
- **Critères d'acceptation.**
  - Compte sans multiplication par séries, tours ou répétitions de Cycle.
  - Récupérations exclues du compte.
  - Deux exercices du même Mouvement comptent deux.
  - Aucune donnée stockée : ni catégories agrégées, ni photo dérivée, ni rang.
  - Un conteneur est masqué seulement s'il ne se répète pas et ne contient qu'un exercice.
  - Profondeur de deux décalages au plus.
  - Aucune Séance réécrite à la lecture (les règles de titre du §8 restent hors E).
- **Format.** Aucun format n'étant persisté, le premier emplacement ne montre jamais de format et le repli visuel est toujours Libre (voir Q-E5).
- **Tests.** Tests unitaires de la projection : 0, 1 et plusieurs exercices ; Circuit Tours ou Séries ; plusieurs Cycles ; récupérations ; catégories en double ; cascade de médias ; durée non calculable ; changement de composition sans changement d'identité.
- **Réserve Figma.** F-03 (vignettes).

### E.2 — Carte commune Catalogue

- **Résultat.** La carte du segment Séances est la seule carte de Séance du Catalogue (`Contexte=Catalogue`, `6214:3572` replié, `6214:3625` archivé). Elle porte :
  - un visuel 64 à 8 du bord et le texte à 84 ;
  - le titre, et le chevron seulement pour plusieurs exercices ;
  - les catégories avec pastille et `+N`, sans couper un mot ;
  - aucune étiquette ni zone ;
  - la synthèse (format, sinon N exercices, sinon volume ; jamais « 1 exercice ») puis la durée ;
  - le bouton Lecture, cible 48 à 8 du bord ;
  - en variante archivée, aucune action directe et le texte jusqu'à la marge.
- **Dépendances.** E.1.
- **Lecture.** Aucun parcours d'Exécution n'existe. Selon CE-T03-01 (« une destination non livrée reste explicitement indisponible, pas une action factice »), le bouton est présent et désactivé, annoncé indisponible.
- **Réutiliser.** `SessionCard` (seul consommateur : le Catalogue), les tokens de carte de B.9 (`#F9FAFC`, bordure 0,5 `#CCD1E0`, rayon 12) et `CardTitleLine`. Asset Libre : export de `8852:15197`, par le flux d'assets Figma.
- **Critères d'acceptation.** Mesures au gabarit 402 (carte 370, 80 de haut replié) et largeur adaptative ; texte agrandi sans collision ; aucune donnée d'exemple codée en dur.
- **Tests.** Rendu des variantes, synthèse sur les trois cas, `+N`, absence de chevron pour un exercice, Lecture désactivée et annoncée, carte archivée sans action.
- **Réserve Figma.** F-03.

### E.3 — Déploiement de la composition

- **Résultat.**
  - Le chevron du nom est la seule commande ; il pointe vers le haut une fois ouvert.
  - Sous un filet, la composition occupe toute la largeur : lignes « Cycle · N répétitions » et « Circuit · N tours » en gris, enfants décalés de 16 par niveau avec filet vertical, nom à gauche et volume à droite, récupérations en gris clair à leur position.
  - La hauteur suit le contenu.
  - Le déploiement ne modifie et ne lance rien.
- **Dépendances.** E.1, E.2. Le filet vertical reprend le motif des piles de B.5.
- **Réutiliser.** `SheetMotion` (`revealClipEntering/Exiting`, `rowShiftLayout`), « Réduire les animations » respecté.
- **Critères d'acceptation.** Ordre de composition conservé ; conteneurs triviaux masqués ; état annoncé ouvert ou fermé ; défilement et chevron ne déclenchent ni Lecture ni ouverture.
- **Tests.** Rendu de l'arbre (Circuit, Cycle, récupérations, conteneur masqué), animation réduite, aucune écriture.
- **Limite.** Sans l'epic C, une Séance à plusieurs Cycles ne peut pas être créée sur l'appareil : son rendu n'est vérifié que par les tests automatiques.

### E.4 — Écran du segment Séances

- **Résultat.**
  - Segmenté Mouvements / Séances / Programmes : trois entrées, cible confirmée par Hermann le 28/10. Programmes visible et indisponible. Le retrait de l'entrée Exercices relève de E.8-a.
  - Bascule « Un exercice | Plusieurs » : aucune sélection donne la collection complète ; toucher l'option active la désélectionne.
  - Commandes Filtre / Tri / Créer ; Tri grisé ; Créer ouvre la Composition existante.
  - **Rangée responsive (Q-E4, option B complétée, validée par Hermann le 28/10).** C'est une précision UX : l'état compact actif ne figure pas dans Figma.
    - **Inactif** : bouton rond, qui ouvre directement le panneau.
    - **Actif étendu** : le rond bleu réinitialise les filtres ; la zone de texte (« Filtres » et résumé) ouvre le panneau. Ce sont les primitives de B.9 (D05).
    - **Actif compact** : deux commandes distinctes et visibles, l'une qui ouvre les filtres, l'autre (croix) qui les réinitialise immédiatement.
    - L'état étendu s'affiche quand toute la rangée tient. Avec les mesures Figma, il faut environ 382 pt : la rangée tient au gabarit 440, pas à 402 ni à 360.
    - À largeur compacte ou avec texte agrandi, si la rangée ne tient toujours pas, les commandes passent sur deux lignes plutôt que de se chevaucher ou de masquer une fonction.
    - Le calcul s'appuie sur les largeurs mesurées, sans constante.
    - Cibles d'au moins 44 × 44.
    - Réinitialiser les filtres conserve la bascule Un exercice / Plusieurs.
    - Marge de 16, libellés Un exercice / Plusieurs, aucune option Toutes.
  - Marges 16 (déjà en place depuis A01), écart 12 entre cartes.
  - Retour d'un parcours : vue, filtres et position conservés. Relance : Séances, collection complète.
- **Dépendances.** E.2. Le segmenté et les commandes de B.9 sont disponibles.
- **Conséquence documentée.** L'ordre Filtre / Tri / Créer ne s'applique qu'au segment Séances. Sur le segment Mouvements, la rangée reste celle de B.9 : son changement « reste dans son lot » (périmètre §Hors tranche).
- **Critères d'acceptation.**
  - La vue ne modifie aucune donnée.
  - Labels et états sélectionnés annoncés, désélection possible annoncée.
  - Cibles d'au moins 44 × 44 sans chevauchement (F-02), dans les trois états du filtre, à 360, 402 et 440 et avec texte agrandi.
  - Réinitialiser conserve la vue choisie.
- **Tests.** Vues : complète, un exercice, plusieurs, désélection ; état vide réel ; aucun résultat ; conservation au retour ; réinitialisation à la relance.
- **Réserves Figma.** F-02, F-05.

### E.5 — Cycle de vie et actions glissées

- **Résultat.**
  - Glissé sur toute la carte, repliée ou déployée. Bloc de 80 aligné en haut, jointif sur la marge droite, carte arrêtée à 8 du bloc.
  - Séance active : Planifier (présent, grisé : aucun parcours de planification n'existe), Dupliquer, Archiver.
  - Séance archivée : Restaurer, puis Supprimer.
- **Règles existantes appliquées (CE-T03-01 révisé).**
  - Aucune Routine n'existe dans le code : l'archivage est immédiat, suivi du snackbar « Séance archivée » avec Annuler. La confirmation « Séance planifiée » (`4593:6285`) n'a pas encore de déclencheur.
  - Suppression définitive depuis les archives, après confirmation (`2234:189`).
  - RM-008 (Routines multicontenus) n'est pas généralisé.
- **Dépendance manquante, comblée dans E.** Les services `archiveSession`, `restoreSession` et `deleteSession` de `SessionService` et du repository n'existent pas. Le schéma les permet déjà (colonnes `status` et `archived_at`) : **aucune migration**. La suppression retire la Séance et sa composition (occurrences, Points d'arrêt, catégories, liens de médias de Séance), jamais les Mouvements référencés. Duplication : service existant.
- **Réutiliser.** `SwipeActionsRow` (hauteur paramétrée à 80, alignement haut), `DecisionDialog`, `TransientNotification`.
- **Critères d'acceptation.**
  - Une action porte sur la Séance, jamais sur une ligne.
  - Une Séance archivée n'est ni modifiable ni dupliquée (règle existante).
  - Une double action ne crée pas de doublon.
  - Après restauration, la Séance est de retour dans les actives.
- **Tests.**
  - Services : transitions ACTIVE ↔ ARCHIVED, suppression transactionnelle, Mouvements conservés, échec atomique.
  - Interface : actions selon l'état, hauteur 80 sur carte déployée, Annuler, confirmation et annulation de suppression.
- **Réserve Figma.** F-01.

### E.6 — Panneau de filtres des Séances

- **Résultat.**
  - Feuille au cadre standard de B.11 : poignée, ✕ / ✓, filet.
  - Sections Statut des séances (ligne compacte, pastilles à droite), Catégories, Zones corporelles, Étiquettes, Format, avec chevron accolé au titre.
  - À l'ouverture, les sections portant un filtre actif sont ouvertes ; sans filtre, Statut seul.
  - Réinitialiser fixe en pied.
  - ✓ applique, ✕ ferme sans appliquer.
  - Filtrer étendu et résumé dans la commande.
- **Dépendances.** E.4 ; primitives de B.7 et B.11 (cadre, pastilles, commande étendue). Les règles de piles des Mouvements ne s'appliquent pas.
- **Statut.** Les règles suivies sont celles de CE-T03-01 révisé et de Figma `4168:11149` : Actives, Archivées, statut d'abord, Actives par défaut, comme Q3 pour les Mouvements.
  - **Écart documentaire à résorber à l'intégration** : le tableau ancien « Champs et comportements des fonctionnalités — Catalogue de séances » du ch13 (`main`) liste encore Toutes, Planifiées, Non planifiées et Archivées.
  - Planifiées et Non planifiées sont de toute façon sans objet : il n'existe aucune Routine.
- **Sémantique Q-E3, option B, validée par Hermann le 28/10.** Le filtrage porte sur les caractéristiques agrégées de la Séance.
  - **Statut** : il détermine les Séances admissibles.
  - **Dans une section** : OU entre les valeurs choisies.
  - **Entre sections** : ET.
  - **Catégories et Zones corporelles** : agrégées sur tous les exercices de la Séance, à partir de leurs Mouvements. Elles peuvent correspondre à des exercices différents de la même Séance.
  - **Étiquette et Format** : ils appartiennent à la Séance.
  - **Bascule Un exercice / Plusieurs** : elle se combine avec les filtres.
  - **Critères d'acceptation** : une Séance dont un exercice est en Mobilité et un autre en Genoux répond à Catégorie = Mobilité ET Zone = Genoux. Une Séance archivée n'apparaît que si le Statut l'admet. Réinitialiser ne touche pas la bascule.
- **Format (Q-E5, option A, validée par Hermann le 28/10).**
  - Le panneau garde les vignettes de formats prévues par Figma (`8852:15055` à `8852:15197`).
  - Libre est sélectionnable ; il correspond aux Séances sans format, c'est-à-dire aujourd'hui à toutes.
  - Les autres formats sont visibles mais désactivés, annoncés indisponibles à l'accessibilité, tant qu'ils ne sont pas développés.
  - Aucun format fictif, aucune migration, aucun développement anticipé des formats spéciaux. Aucune Séance n'est présentée comme EMOM ou Tabata.
  - **Raccordement ultérieur** : le lot des formats ajoutera un format persisté à la Séance. La projection (E.1) lira alors son nom (premier emplacement de synthèse) et sa vignette, par la table « format → asset ». Chaque vignette devient sélectionnable quand le service prend en charge son format, sans autre changement de E.
- **Prête à développer** (arbitrages du 28/10).
- **Tests.** Ouverture dynamique des sections, application et annulation, Réinitialiser, combinaison avec les vues, archives, aucun résultat.
- **Réserve Figma.** F-04.

### E.7 — Raccordements, non-régression et recette

- **Résultat.**
  - Carte → Composition en modification (parcours existant, archivée en consultation selon la règle existante).
  - Créer → Composition.
  - Dupliquer, Archiver, Restaurer, Supprimer → E.5.
  - Planifier et Lecture → indisponibles, explicitement.
  - Retour de navigation avec conservation d'état.
- **Tests de non-régression.** Composition (création, modification, Points d'arrêt, duplication) ; segment Mouvements (B) ; migrations 014 et 015 inchangées.
- **Recette.** Cahier iPhone (même format que A/B).

### E.8 — Transition de l'ancien Catalogue des Exercices (révisée le 28/10 ; aucune migration engagée)

**Constats vérifiés.**
- Les Exercices du Catalogue (`activity_definitions`, sans statut d'archivage) sont créés et modifiés par `ExerciseScreen` dans le contexte Catalogue.
- Ils sont lus par le segment Exercices et par la sélection d'exercices de la Composition (`ActivitySelectionScreen` → `useActivityCatalogue`).
- Choisir un Exercice dans la Composition crée une occurrence propre à la Séance. La définition est un modèle, pas un contenu partagé.

**E.8-a — dans E, non destructif, sans migration (option B, Hermann, 28/10).**
- **Ce qui change.** Le Catalogue a exactement trois segments : le segment Exercices est retiré. La vue « Un exercice » montre les Séances d'un exercice.
- **Ce qui est conservé.**
  - Les données : `activity_definitions`, migrations 014 et 015. Ni migration 016, ni conversion, ni duplication d'objets.
  - La sélection de la Composition, inchangée.
  - **La consultation et la modification des anciennes définitions**, par le parcours d'édition existant : `ExerciseScreen`, route `/exercise?catalogueDefinitionId=…`, avec son menu Niveau entre définitions.
- **Vérification du parcours concret (28/10).** Aujourd'hui, le seul point d'entrée vers ce parcours est la carte du segment Exercices (`CatalogueScreen.openExerciseEditor`). La sélection de la Composition (`ActivitySelectionScreen`) ne fait que cocher et ajouter, et aucun autre écran n'ouvre une définition. Retirer le segment sans nouveau point d'entrée supprimerait donc la capacité. Le parcours d'édition lui-même est réutilisable tel quel, sans dépendance à l'epic C.
- **Point d'entrée, option 1, validée par Hermann le 28/10.** L'accès temporaire passe par l'écran de sélection d'Exercices de la Composition (`ActivitySelectionScreen`).
  - Une commande **Modifier** sur chaque ligne, distincte de l'action de sélection. Cible d'au moins 44 ; libellé accessible propre.
  - Elle ouvre l'éditeur existant `ExerciseScreen` par la route de modification existante (`/exercise?catalogueDefinitionId=…`).
  - Le comportement de sélection est inchangé.
  - Au retour de l'éditeur, la liste est actualisée sans perdre les sélections ni le contexte de navigation (Composition et brouillon de Séance).
  - La commande ne concerne que les anciennes définitions d'Exercices, pas l'édition du Mouvement partagé.
  - Aucun nouvel objet persistant, aucune migration, aucun Catalogue autonome d'Exercices.
  - Raccordement **transitoire**, retiré quand l'epic C remplacera ce parcours (E.8-b).
  - *À établir en début de story, par lecture du code* : l'éditeur ouvert par cette route depuis la Composition n'altère pas le brouillon de Séance en cours, et la relecture au retour (`useFocusEffect` existant) garde les cases cochées.
- **Pas de dépendance majeure à l'epic C** : ni la Composition ni ses structures ne sont redéveloppées.
- **Moment.** Dans E.4, au même commit que le segmenté à trois entrées ; la commande Modifier est livrée avant ou avec le retrait du segment, jamais après.
- **Critères d'acceptation.**
  - Après retrait du segment, toute ancienne définition reste consultable et modifiable, et toujours sélectionnable en Composition.
  - Aucune ligne n'est créée ni supprimée par le retrait.
  - Tests ciblés :
    - commande Modifier présente sur chaque ligne et distincte de la sélection ;
    - ouverture de `ExerciseScreen` sur la bonne définition ;
    - modification enregistrée et visible au retour ;
    - sélections conservées au retour ;
    - sélection inchangée ;
    - absence du segment Exercices ;
    - aucune ligne créée.

**E.8-b — avec ou après l'epic C, soumise à une autorisation distincte.**
- **Quand.** Une fois que la sélection de la Composition passe par les Mouvements (epic C), plus aucun parcours ne lit `activity_definitions`.
- **Proposition de conversion, à arbitrer à ce moment.** Une migration, testée sur une copie de base, convertit chaque définition en Séance d'un exercice (titre du premier Exercice, Q-E1) et retire la définition dans la même transaction. Il n'y a donc jamais deux objets concurrents. Annulation complète en cas d'échec.
- **Retrait des anciennes dépendances, après vérification sur l'appareil.**
  - Composants et services du Catalogue des Exercices, puis lecture de la table.
  - La suppression physique de la table vient en dernier, par une migration ultérieure distincte.

## 3. Arbitrages (état au 28/10)

**Tranchés par Hermann le 28/10.**
- **Q-E0** : lecture des sources sur `origin/main`, intégration documentaire contrôlée avant la livraison finale (§0).
- **Cible à trois segments** : confirmée.
- **Q-E6** : règles existantes.
  - Une Séance historique sans exercice reste consultable et sa synthèse indique « 0 exercice » (D-392).
  - Une Séance vide n'est pas rendue enregistrable.
  - La liste sans résultat après filtrage est distinguée du Catalogue réellement vide. Elle reprend la convention i18n existante : « Aucune séance ne correspond aux filtres. », sur le modèle de « Aucun mouvement ne correspond à la recherche ou aux filtres. ».
  - Le Catalogue vide garde son message actuel.

**Tranchés par Hermann le 28/10 (arbitrages finaux).**
- **E.8-a, option B** : trois segments, données et édition des anciennes définitions conservées, sans migration.
- **Q-E3, option B** : caractéristiques agrégées de la Séance.
- **Q-E4, option B complétée** : trois états du filtre, deux lignes si nécessaire, réinitialisation sans toucher la bascule.
- **Q-E5, option A** : vignettes visibles, Libre seul actif.
- **Niveaux** : b8-3 conservé (§3 bis).

- **E.8-a, point d'entrée, option 1** (dernier arbitrage) : commande Modifier dans la sélection d'Exercices de la Composition (E.8).

**Aucun point restant.** Le plan E (E.1 à E.7 et E.8-a) est approuvé. E.8-b reste hors E : avec ou après l'epic C, sous une autorisation distincte.

## 3 bis. Lot B — Niveaux après archivage et réordonnancement (isolé de E)

**Contradiction confirmée par lecture du code et des tests.**
- `MovementCatalogueService` (B.10, `e98f4341`) calcule le rang **affiché** d'un membre actif sur les seuls membres actifs. Exemple : archiver N2 d'une famille de trois affiche N1 et N2. Le test correspondant est `movementLifecycle.b8.test.ts` (« rangs affichés des actifs recalculés (b8-3) »).
- Le ch09 de `main`, règle 8 (PR #406, `266a0438`, 27/10 à 13:39), dit l'inverse : archiver ou restaurer ne modifie pas les niveaux, et le calcul porte sur la famille complète, archivés compris. Le même exemple afficherait N1 et N3.
- Les deux viennent de Hermann le même jour :
  - la règle 8, validée à 13:39 ;
  - la note de recette `b8-3`, saisie entre 13:10 et 14:41, consignée au ch07 PRE-8 comme « b8-3 remplace Q5 ».
- PRE-8 est aussi incohérent en lui-même : les menus Niveau de la fiche gardent le rang de la famille complète (B.10, À CLARIFIER 2).

**Tranché par Hermann le 28/10 : option A.** b8-3 est conservé ; la fiche Mouvement est alignée ; la documentation est corrigée (ch07, ch10, DSF Mouvements sur la branche ; ch09 et ch07 de `main` à l'intégration, voir `integration-documentaire-main.md`). Options soumises :
- **A — garder b8-3.** Aucun code ne change ; la règle 8 est amendée à l'intégration documentaire, et les menus de la fiche sont alignés sur les rangs des actifs.
- **B — appliquer la règle 8.** Dans `MovementCatalogueService`, le rang affiché redevient celui de la famille complète : retrait de la renumérotation b8-3, un test ajusté. L'entrée b8-3 du ch07 PRE-8 est marquée remplacée. Le reste de la recette A/B n'est pas touché.

**`MovementRepository.reorder` : différence technique, sans non-conformité observable.**
- `writeGroupOrder` réécrit la clé de tri entière de tous les membres, alors que la règle 6 demande d'écrire la seule clé, fractionnaire, du membre déplacé.
- Effets observables : identités, références, instantanés et rangs affichés identiques. Seul le `updated_at` des autres membres change ; il n'est ni affiché ni utilisé par le Catalogue des Mouvements.
- Aucune modification proposée. L'écart est consigné ; un alignement éventuel relèverait du chantier du repository.

## 4. Réserves Figma F-01 à F-05 (lecture du 27/10, état courant)

| Réserve | Verdict | Évidence |
|---|---|---|
| F-01 Suppression `2234:189` | **NON CONFORME** (arrière-plan) | Segmenté `2587:2858` « MVP : Séances uniquement » à deux entrées Exercices / Séances ; arrière-plan glissé `2240:88` « Supprimer » seul, 94 × 90 (ni Restaurer ni 80). Le dialogue `6396:9451` est conforme. Développement : trois segments et Restaurer / Supprimer de 80 (règle écrite) ; non bloquant |
| F-02 Filtre étendu `4549:6742` | **NON CONFORME**, puis **À CLARIFIER** à 360 | Au gabarit 402 : « Plusieurs » `10660:22149` va de x 110 à 166 ; le Filtrer étendu `4748:6320` commence à 162, soit 4 pt de recouvrement visuel ; sa zone tactile `6309:9635` commence à 157, soit 9 pt. Aucune cible 44 n'est dessinée pour les vues. La rangée demande environ 382 pt pour 370 au gabarit 402 et 328 à 360 (Q-E4) |
| F-03 Vignettes | **PARTIELLEMENT CONFORME** | Le jeu distinct existe dans le panneau `4168:11149` : 12 vignettes `8852:15055` à `8852:15197` (Tabata, EMOM… Libre). La carte « EMOM du matin » `10647:21600` utilise l'instance `Format — cadre carré` `8694:34283` au motif Libre avec le libellé EMOM : le jeu n'est pas raccordé. Dans le code, aucun format n'est persisté ; seule la vignette Libre est nécessaire à E |
| F-04 Sections de filtres | **PARTIELLEMENT CONFORME** | Ordre des sections, chevrons accolés, Statut compact (pastilles à droite, `4549:6533`, `4549:6534`), Réinitialiser en pied `4752:6303`, en-tête ✕ / ✓ et filet : conformes. L'exemple ouvre Étiquettes et Format alors que seul Statut est actif : état illustratif, la règle dynamique s'applique. Le contenu ouvert de Catégories et Zones n'est pas dessiné : il reprend les pastilles de 36 |
| F-05 États vides | **PARTIELLEMENT CONFORME** | `2117:86` : trois segments, message identique à l'existant (`fr.ts`, « Vous verrez ici la liste de vos séances… ») ; mais ancienne rangée Créer / Filtrer / Trier centrée et aucune bascule de vue. `4521:6220` « Catalogue des exercices » est historique et non applicable (aucun Catalogue des Exercices recréé). L'état « aucun résultat filtré » n'est pas dessiné (Q-E6) |

## 5. Tests automatiques et recette (organisation révisée le 28/10)

- **Pendant chaque story** : ses tests ciblés (voir §2) et ceux des fichiers touchés.
- **Suite complète, tsc et ESLint, aux seuls points de risque transverse** :
  - fin de E.5 (repository et transactions SQL de cycle de vie) ;
  - fin de E.4 avec E.8-a (segmenté et `CatalogueScreen`, partagé avec le segment Mouvements) ;
  - fin de l'epic ;
  - après l'intégration documentaire.
- **Données** : aucune migration dans E ; migrations 014 et 015 inchangées et leurs tests rejoués aux points complets.
- **Non-régression ciblée** : Composition (création, modification, Points d'arrêt, duplication, sélection d'exercices), segment Mouvements (B).
- **Recette iPhone**, cahier interactif, à 360, 402 et 440. Elle couvre :
  - les cartes : photo, Libre, `+N`, textes longs, texte agrandi ;
  - le déploiement et son animation ;
  - les vues et la désélection ;
  - la rangée responsive (état étendu ou compact) ;
  - le glissé actif et archivé, à 80 sur une carte déployée ;
  - l'archivage avec Annuler, la restauration, la suppression avec confirmation ;
  - les filtres ;
  - l'état vide et l'état sans résultat ;
  - le retour de parcours.

  Les Cycles et les Circuits multiples ne sont vérifiés que par les tests automatiques tant que l'epic C n'existe pas.

## 6. Exclusions confirmées

- Les trois états du nom (§8) et la refonte de la Composition.
- Le modèle Cycles / Circuits et l'insertion d'une Séance.
- Le moteur d'exécution, les formats spéciaux et la marge globale.
- Le Catalogue des Mouvements et Programmes.
- Communauté et les cartes Calendrier, Suivi, Choix.
- Toute suppression de données historiques ou de composants encore utilisés (`ActivityCard`, `ActivityCatalogueList`, `ActivitySelectionScreen`).
- Toute migration : aucune dans E. La conversion de E.8-b est soumise à une autorisation distincte.
