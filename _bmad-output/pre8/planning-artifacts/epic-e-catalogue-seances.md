# PRE-8 — Epic E : Catalogue unifié des Séances — plan soumis à validation

> Préparation demandée par Hermann le 27/10/2026 (« KODJO — PRE-8 — Préparation du développement de l'epic E : Catalogue unifié des Séances »). **Plan à valider, développement non commencé.** Branche `pre8-bmad/dev` @ `23a9a4f2` (epics A et B clos, code recetté `88c2adde`). Aucune fusion dans `main`.

## 0. Sources et baseline

- **Sources E, présentes seulement sur `origin/main` @ `ff7600ac`** (PR #407, après la base PRE-8 `082390c0`) : `docs/KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md`, `docs/DSF-CATALOGUE-SEANCES-2026-10-27.md`, `docs/preparation/catalogue-seances-2026-10-27/PERIMETRE-ET-PROMPT-BMAD.md`, chapitres 07 (décision « Catalogue des séances — carte unique et filtres », D-260/D-261 remplacées au Catalogue), 09 (« Projection Catalogue des séances »), 13 (CE-T03-01 révisé, CE-SU-01). Lues avec `git show origin/main:…`, sans modifier la branche.
- **Intégration de `main`** : une fusion simulée (`git merge-tree`) donne 6 conflits, tous documentaires : DSF Mouvements, ch06, ch07, ch10, ch12, ch13. Le code fusionne sans conflit, `KodjoIcon.tsx` compris. Voir l'arbitrage Q-E0.
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

Ordre : E.1 → E.2 → E.3 → E.4 → E.5 → E.6 → E.7. E.1 à E.5 et E.7 ne dépendent d'aucun arbitrage produit ouvert, sauf les points notés. E.6 attend Q-E3 et Q-E5. E.8 dépend de Q-E2.

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
  - Segmenté Mouvements / Séances / Programmes ; Programmes visible et indisponible (voir Q-E2 pour l'entrée Exercices).
  - Bascule « Un exercice | Plusieurs » : aucune sélection donne la collection complète ; toucher l'option active la désélectionne.
  - Commandes Filtre / Tri / Créer ; Tri grisé ; Créer ouvre la Composition existante.
  - Marges 16 (déjà en place depuis A01), écart 12 entre cartes.
  - Retour d'un parcours : vue, filtres et position conservés. Relance : Séances, collection complète.
- **Dépendances.** E.2. Le segmenté et les commandes de B.9 sont disponibles.
- **Conséquence documentée.** L'ordre Filtre / Tri / Créer ne s'applique qu'au segment Séances. Sur le segment Mouvements, la rangée reste celle de B.9 : son changement « reste dans son lot » (périmètre §Hors tranche).
- **Critères d'acceptation.**
  - La vue ne modifie aucune donnée.
  - Labels et états sélectionnés annoncés, désélection possible annoncée.
  - Cibles d'au moins 44 sans chevauchement (F-02 et Q-E4).
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
- **Règle validée réutilisable.** Statut d'abord, Actives par défaut (transposition de Q3). Elle est à confirmer avec Q-E3.
- **Bloqué par Q-E3** (sémantique des Catégories, Zones et Étiquettes entre plusieurs exercices) **et Q-E5** (section Format sans format persisté).
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

### E.8 — Conversion des Exercices du Catalogue et retrait du segment Exercices (selon Q-E2)

- **Constat.** Les Exercices du Catalogue (`activity_definitions`, sans statut) sont encore lus par deux écrans :
  - le segment Exercices du Catalogue ;
  - la sélection d'exercices de la Composition (`ActivitySelectionScreen` → `useActivityCatalogue`).
- **Conséquence.** Les retirer du Catalogue sans conversion rend ces Exercices non maintenables. Les convertir en Séances à un exercice (migration 016, titre = premier Exercice selon Q-E1) laisse la sélection de la Composition sur l'ancienne table jusqu'à l'epic C.
- **Statut.** Non prêt : arbitrage Q-E2.

## 3. Arbitrages nécessaires (seuls points bloquants)

| Id | Question | Options | Bloque |
|---|---|---|---|
| Q-E0 | Intégrer `origin/main` (`ff7600ac`) dans `pre8-bmad/dev` avant le développement : sources E et docs à jour. 6 conflits documentaires à résoudre, aucun conflit de code | A : fusion de `main` dans la branche PRE-8 (pas l'inverse) ; B : développer en lisant les sources sur `main`, intégration plus tard ; C : autre | Démarrage |
| Q-E2 | Segment Exercices et Exercices du Catalogue existants | A : garder le segment Exercices pendant E (Mouvements, Exercices, Séances, Programmes) ; conversion et retrait avec ou après C ; B : E.8 dans E (migration 016 testée sur copie, segment retiré ; la sélection de la Composition garde l'ancienne table jusqu'à C) ; C : autre | E.4 (segmenté), E.8 |
| Q-E3 | Filtres Catégories, Zones, Étiquettes d'une Séance de plusieurs exercices | Proposition non validée : OU dans une section, ET entre sections, correspondance sur l'ensemble des exercices de la Séance ; Étiquettes : OU (une Séance n'a qu'une étiquette) | E.6 |
| Q-E4 | Rangée « Un exercice \| Plusieurs » + Filtrer étendu + Tri + Créer : la rangée demande environ 382 pt (150 + 8 + 132 + 12 + 34 + 12 + 34), pour 370 disponibles au gabarit 402 et 328 à 360 | À décider par Hermann (par exemple, Filtrer réduit au rond à largeur compacte, résumé tronqué, ou autre). Aucune option Toutes | E.4, E.6 |
| Q-E5 | Section Format et premier emplacement, alors qu'aucun format n'est persisté (formats hors autorisation) | A : section Format absente tant qu'aucun format n'existe ; B : section affichée avec Libre seul ; C : autre | E.6 |
| Q-E6 | Séance sans exercice (existante) : synthèse ; et libellé de l'état « aucun résultat » après filtres | Ancienne règle : « 0 exercice » ; aucun texte pour l'état sans résultat dans les douze écrans | E.2, E.4 |

**Hors epic E, signalés sans correction.**
- La règle 8 du ch09 (`main`, validée le 27/10) dit qu'archiver un membre ne modifie pas les niveaux. Le point B.10 `b8-3`, recetté, recalcule les rangs affichés des actifs après archivage : contradiction à arbitrer dans le lot B.
- La règle 6 demande l'écriture de la seule clé du membre déplacé, alors que `MovementRepository.reorder` (PRE-7) réécrit la famille.

## 4. Réserves Figma F-01 à F-05 (lecture du 27/10, état courant)

| Réserve | Verdict | Évidence |
|---|---|---|
| F-01 Suppression `2234:189` | **NON CONFORME** (arrière-plan) | Segmenté `2587:2858` « MVP : Séances uniquement » à deux entrées Exercices / Séances ; arrière-plan glissé `2240:88` « Supprimer » seul, 94 × 90 (ni Restaurer ni 80). Le dialogue `6396:9451` est conforme. Développement : trois segments et Restaurer / Supprimer de 80 (règle écrite) ; non bloquant |
| F-02 Filtre étendu `4549:6742` | **NON CONFORME**, puis **À CLARIFIER** à 360 | Au gabarit 402 : « Plusieurs » `10660:22149` va de x 110 à 166 ; le Filtrer étendu `4748:6320` commence à 162, soit 4 pt de recouvrement visuel ; sa zone tactile `6309:9635` commence à 157, soit 9 pt. Aucune cible 44 n'est dessinée pour les vues. La rangée demande environ 382 pt pour 370 au gabarit 402 et 328 à 360 (Q-E4) |
| F-03 Vignettes | **PARTIELLEMENT CONFORME** | Le jeu distinct existe dans le panneau `4168:11149` : 12 vignettes `8852:15055` à `8852:15197` (Tabata, EMOM… Libre). La carte « EMOM du matin » `10647:21600` utilise l'instance `Format — cadre carré` `8694:34283` au motif Libre avec le libellé EMOM : le jeu n'est pas raccordé. Dans le code, aucun format n'est persisté ; seule la vignette Libre est nécessaire à E |
| F-04 Sections de filtres | **PARTIELLEMENT CONFORME** | Ordre des sections, chevrons accolés, Statut compact (pastilles à droite, `4549:6533`, `4549:6534`), Réinitialiser en pied `4752:6303`, en-tête ✕ / ✓ et filet : conformes. L'exemple ouvre Étiquettes et Format alors que seul Statut est actif : état illustratif, la règle dynamique s'applique. Le contenu ouvert de Catégories et Zones n'est pas dessiné : il reprend les pastilles de 36 |
| F-05 États vides | **PARTIELLEMENT CONFORME** | `2117:86` : trois segments, message identique à l'existant (`fr.ts`, « Vous verrez ici la liste de vos séances… ») ; mais ancienne rangée Créer / Filtrer / Trier centrée et aucune bascule de vue. `4521:6220` « Catalogue des exercices » est historique et non applicable (aucun Catalogue des Exercices recréé). L'état « aucun résultat filtré » n'est pas dessiné (Q-E6) |

## 5. Tests automatiques et recette

- **Automatiques**, par story, voir §2 :
  - projection ;
  - carte ;
  - déploiement ;
  - écran et vues ;
  - services de cycle de vie ;
  - filtres ;
  - raccordements ;
  - non-régression de la Composition et du segment Mouvements.
- **Suite complète, tsc et ESLint** à chaque story.
- **Recette iPhone**, cahier interactif : cartes (photo, Libre, `+N`, textes longs, texte agrandi), déploiement et animation, vues et désélection, glissé actif et archivé à 80 sur carte déployée, archivage avec Annuler, restauration, suppression avec confirmation, filtres, états vides, retour de parcours, à 360, 402 et 440.

## 6. Exclusions confirmées

- Les trois états du nom (§8) et la refonte de la Composition.
- Le modèle Cycles / Circuits et l'insertion d'une Séance.
- Le moteur d'exécution, les formats spéciaux et la marge globale.
- Le Catalogue des Mouvements et Programmes.
- Communauté et les cartes Calendrier, Suivi, Choix.
- Toute suppression de données historiques ou de composants encore utilisés (`ActivityCard`, `ActivityCatalogueList`, `ActivitySelectionScreen`).
- Toute migration hors E.8, qui reste soumise à Q-E2.
