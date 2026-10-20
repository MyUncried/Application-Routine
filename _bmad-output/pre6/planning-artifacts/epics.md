---
status: draft — en attente de validation de Hermann
inputDocuments:
  - '_bmad-output/pre6/etat-de-depart.md'
  - '_bmad-output/pre6/planning-artifacts/architecture-pre6.md'
---

# KODJO PRE-6 — Évolution de la Composition de séance : epics et stories

**Planification uniquement.** Aucune story n'est lancée avant la validation explicite de Hermann et la réconciliation de l'étape 0.

## Périmètre

**Inclus.** Composition des **séances libres** :

- A — Composition générale ;
- B — Circuit de Tours / de Séries ;
- C — modales « Volumes du circuit » (`8328:34965`, `8328:35135`) ;
- D — Récupérations et Points d'arrêt ;
- E — raccordement des paramètres PRE-5.

Le socle commun (organisation ≠ borne) est conçu pour être réutilisé par les formats.

**Exclus.** Le choix des formats et des modèles, les paramètres, récapitulatifs et compositions propres aux formats (Tabata, 30/30, EMOM, AMRAP, For time, Death by), les bornes Durée et Max dans l'interface, tout moteur ou chronomètre, le guidage sonore, les performances, résultats, historique et planification, le multi-circuit, et toute refonte du Catalogue, du Profil ou de l'éditeur PRE-5.

**Règles de conduite.** Réutiliser avant de créer. Ne reconstruire aucun acquis. Ne supprimer aucun contrôle sans substitution. Aucune validation ni aucun blocage hors des règles citées. Les valeurs des captures ne sont pas des règles. Les tests sont ajoutés pour les règles nouvelles ; les suites existantes servent de non-régression, sans revue globale ajoutée.

## Étape 0 — Réconciliation avec la fusion PRE-5 (préalable au développement)

Les travaux de planification ne dépendent pas de cette étape et sont faits. Elle se déroule ainsi :

1. **Identifier la baseline.** C'est le commit de `origin/main` qui contient la version PRE-5 **validée par Hermann** : fusion #389 `ad189847`, ou un commit ultérieur si la clôture (recettes iPhone R-2.5 à R-3.2, rétrospectives, correctifs) apporte d'autres changements. Hermann confirme le SHA.
2. **Raccorder la planification.** Fusionner ou rebaser `plan/pre6-bmad` sur la baseline. Seul `_bmad-output/pre6/` est propre à PRE-6, donc aucun conflit n'est attendu.
3. **Mesurer le delta.** `git diff ad189847..<baseline>` sur les fichiers que le plan touche :
   - `ExecutionParameters*.ts`, `ExecutionParametersSheet.tsx`, `ActivityEditorForm.tsx`, `ExerciseScreen.tsx` ;
   - `SessionDraft.ts`, `composition.ts`, `calculations.ts`, `executionCalculations.ts` ;
   - `CompositionScreen.tsx`, `compositionPresentation.ts` ;
   - migrations et `constants.ts`, `SegmentedControl.tsx`, `ProfileStepper.tsx`, `tokens.ts`, `fr.ts`.

   Pour chaque changement, mettre à jour `etat-de-depart.md` et les stories concernées. Vérifier en particulier `DATABASE_VERSION` (10 attendu, donc migration 011).
4. **Établir la référence de tests.** Lancer la suite Jest complète sur la baseline et consigner le nombre de suites et de tests verts. Ce sera la référence de non-régression de PRE-6.
5. **Reprendre les reports PRE-5.** Le report AC6 (indicateur de côté neutre) entre dans la story 2.2 si ARB-2 est tranché ; sinon il reste reporté.
6. **Ouvrir le développement.** Créer la branche de développement depuis la baseline et initialiser `sprint-status.yaml`.

**Critère de sortie** : baseline nommée, delta consigné, référence Jest consignée, plan validé par Hermann.

## Epic 1 — Socle Circuit, pauses et calculs (domaine et données, sans interface)

Il porte la mécanique commune réutilisable par les formats (AD-34 à AD-40). Aucun changement visible ; la preuve passe par Jest et par la lecture d'une base réelle.

### Story 1.1 — Nature du Circuit, borne typée et migration 011

- **AC1** : le type `CircuitNature` (`TOURS` | `SERIES`) et le type `CircuitBound` (variante `COUNT` seule) existent. `COUNT` est le `repeatCount` existant (1..99, défaut 1), sans second compte. `switch` exhaustifs.
- **AC2** : la migration 011 ajoute `tours.nature` (défaut `TOURS`) et `activities.post_activity_recovery_present`, avec la reprise d'AD-35. `DATABASE_VERSION` = 11. La migration est idempotente et sans reconstruction de table.
- **AC3** : aller-retour domaine → `SessionDraft` → `Create/UpdateSessionInput` → SQLite → lecture, pour la nature et la présence de récupération (absente / 0 / positive). L'égalité de brouillon (`sessionDraftsEqual`) et la garde de sortie en tiennent compte.
- **AC4** : une base réelle antérieure (v10) se lit sans perte. Toutes les séances sont en Circuit de Tours ; les cibles, phases, charges et côtés PRE-5 sont intacts. La preuve suit la méthode de PRE-4 story 1.4.

### Story 1.2 — Points d'arrêt de bout en bout dans le brouillon

- **AC1** : `SessionDraft.stopPoints` ; hydratation, création, mise à jour. La position d'emplacement est enregistrée telle quelle, sans renumérotation (AD-36).
- **AC2** : la validation refuse un point juste après le compte à rebours initial, juste avant la Fin, ou en doublon sur un emplacement (CE-T03-08 L1502, `isStopPointPlacementValid` réutilisé).
- **AC3** : une mise à jour ne supprime plus les points existants. Test de non-régression sur `SqliteSessionRepository.update`.
- **AC4** : comportement après déplacement, suppression ou duplication d'une occurrence voisine, selon ARB-3.

### Story 1.3 — Développement du Circuit et durées

- **AC1** : développement Tours / Séries selon ch10 L651 ; éléments internes répétés, externes non répétés (RM-213, RM-220).
- **AC2** : durée d'occurrence et de Circuit conformes à RM-129, RM-038 et ch10 L2050-2052. Tests aux valeurs 75 s, 85 s, 225 s et 255 s ; points d'arrêt à 0 s (RM-191) ; aucune récupération comptée deux fois (RM-071, RM-159) ; R = 0 ne remplace pas Pi.
- **AC3** : agrégation : ≥ l'emporte sur ≈, qui l'emporte sur exact. Résumé du Circuit = ce Circuit seulement (D-382), sans « N exercice(s) » (D-390), « — min » s'il est vide (D-399). La durée de séance exclut le compte à rebours et la Fin (RM-159).
- **AC4** : les durées actuelles des séances en Circuit de Tours sont inchangées. Les tests existants de `calculations.test.ts` et `compositionPresentation.test.ts` restent verts, ou leurs attentes changent seulement là où une décision citée l'impose (D-390, D-399).

### Story 1.4 — Opérations de Circuit : compte, réserve, conversion, entrée et sortie

- **AC1** : `prepareNatureChange` / `applyNatureChange` (AD-39). Tours → Séries : extension par la dernière ligne active, troncature au-delà de N, perte calculée **avant** mutation. Séries → Tours : sans message, valeurs conservées. Le régime de chaque exercice est inchangé.
- **AC2** : `setCircuitCount` en Séries. Une diminution passe immédiatement dans la réserve, sans message. Une augmentation restaure d'abord, puis préremplit par copie de la dernière ligne active. Réserve purgée à l'enregistrement. Cas 4 → 3 → 4, et enregistrement à 3 puis augmentation (CE-T03-08 L1536).
- **AC3** : entrée dans un Circuit de Séries (ajout depuis le Catalogue ou déplacement) : adaptation à N, perte signalée pour confirmation ; Annuler abandonne l'ajout. Sortie : nombre et paramètres conservés. L'exercice du Catalogue n'est jamais modifié.
- **AC4** : `circuitVolumes` fournit les lignes de la grille à partir des séries actives (réserve exclue).
- **AC5** : aucune logique de séries dupliquée avec la Feuille (AD-39). Toute primitive extraite garde son comportement, prouvé par les tests existants d'`ExecutionParametersDraft`.

Dépendances : 1.1 → 1.2. 1.1 → 1.3 → 1.4. 1.2 et 1.3 peuvent se faire en parallèle.

## Epic 2 — Composition générale conforme (A, E)

### Story 2.1 — En-tête, bornes de séance et Continuer

- **AC1** : en-tête conforme à `8328:28172` et `8328:28605` : titre « Composer une séance », nom, puce Étiquette (`LabelPickerModal` conservé), durée de séance, actions « Ajouter un arrêt » (entrée du placement, story 4.1) et « + ».
- **AC2** : Compte à rebours initial et Fin de séance toujours présents, immobiles, 0 s admis, défauts 10 s et 5 s (RM-030, RM-031). Contrôles selon CE-T03-08 et `8328:28998`.
- **AC3** : action finale « Continuer ». Elle est désactivée sans nom, sans Exercice valide, ou si une cible obligatoire manque (D-380, D-123). Champ manquant sur fond rouge pâle (D-389). Elle enregistre puis ouvre Catalogue / Séances. En cas d'échec, on reste sur l'écran, brouillon intact. Le flux `handleSave` existant est conservé.
- **AC4** : trait de démarcation présent hors placement ; aucune information de récupération si elle est absente ou à 0 (D-303). Corrige E5.

### Story 2.2 — Cartes d'occurrence

- **AC1** : nom ; pastille et classification ; zones corporelles ; cible et durée à droite. Les volumes sont séparés par un point médian, trois valeurs au plus puis « … » (CE-T03-08 L1474). Format de durée existant (`formatCompactDuration`).
- **AC2** : récupération positive affichée sur la ligne structurelle sous la carte, selon ARB-1 ; elle forme un bloc avec l'occurrence (ch13 L1680).
- **AC3** : indicateur de côté selon ARB-2 (report AC6 de PRE-5). Sans décision, le rendu existant est conservé.
- **AC4** : en Circuit de Séries, la carte reflète les N séries effectives (`8328:34520`).
- **AC5** : nom accessible annonçant type, position et durée (CE-T03-08 L1522).

### Story 2.3 — Organisation des occurrences

- **AC1** : ajout depuis le Catalogue et création d'une copie conservés (insertion atomique, ordre de la liste filtrée, aucune récupération automatique).
- **AC2** : Dupliquer produit `{nom} (copie)` et conserve Pause et Récupération. Supprimer emporte la récupération (RM-210). Le geste de balayage existant est conservé.
- **AC3** : glisser-déposer avant, dans et après le Circuit. Le bloc carte + récupération se déplace d'un seul tenant (`8328:33546`). L'identifiant est conservé. Un dépôt invalide restitue la position. Une entrée dans ou une sortie du Circuit applique la story 1.4, avec confirmation en cas de perte.
- **AC4** : alternatives accessibles au glisser et au balayage, conservées ou étendues aux bornes du Circuit.
- **AC5** : modifier une copie conserve tous ses paramètres PRE-5 (phases, charge, cadence, pause, côtés, cibles). La Feuille s'ouvre sans Compte à rebours ni Fin d'exercice (RC-7, D-214).

## Epic 3 — Circuit de Tours et de Séries (B, C)

### Story 3.1 — En-tête du Circuit et compteur

- **AC1** : `CircuitHeader` : titre « Circuit », durée sous le titre (story 1.3 AC3), œil permanent, chiffre distinct de la pastille d'unité (« tour(s) » / « série(s) », avec accord singulier et pluriel). Remplace `TourCard` et le `NumberWheelPicker` du compte (E2).
- **AC2** : toucher le chiffre révèle − et + (`InlineStepper`), bornes 1..99. Toucher la valeur ou ailleurs referme (RC-4). Un ajustement accessible remplace le stepper pour VoiceOver.
- **AC3** : en Séries, chaque changement du compte applique `setCircuitCount`, sans message.
- **AC4** : geste vérifié à 375 et 402 de large et avec Dynamic Type, sans chevauchement du titre, de la durée, de l'œil et du compteur (conteneur 354 × 34, ch12 L1236).

### Story 3.2 — Choix de nature et confirmation de perte

- **AC1** : toucher la pastille d'unité ouvre le choix de nature (CE-CIR-01, `8328:34805`) : deux options avec leurs sous-textes, nature courante sélectionnée. Primitive selon AD-42 / P-4.
- **AC2** : le choix de la même nature ne fait rien. Le changement sans perte est immédiat. Le changement avec perte ouvre la confirmation (CE-CIR-02, `8328:34813`), qui calcule la perte sur l'état courant. Annuler conserve nature, compte et valeurs ; Confirmer applique tout ensemble. Le voile ne confirme pas. Une double action ne convertit pas deux fois.
- **AC3** : l'ajout depuis le Catalogue dans un Circuit de Séries avec perte passe par la même confirmation ; Annuler abandonne l'ajout.
- **AC4** : recette Tours → Séries avec des exercices à moins de N, à N et à plus de N séries.

### Story 3.3 — N hérité dans la Feuille des paramètres

- **AC1** : une occurrence d'un Circuit de Séries ouvre la Feuille avec `inheritedSeriesCount = N` (AD-44). Le nombre de séries est affiché et indisponible, le régime reste modifiable, l'inversion de la durée totale suit `isTotalDurationInvertible` (existant).
- **AC2** : hors Circuit de Séries, la Feuille est strictement inchangée (non-régression PRE-5).
- **AC3** : à la sortie du Circuit, le nombre redevient modifiable, sans message.

### Story 3.4 — Modales « Volumes du circuit »

- **AC1** : l'œil ouvre la feuille basse « Volumes du circuit » (`8328:34965` en Séries, `8328:35135` en Tours), avec X et poignée.
- **AC2** : colonnes Exercice | S1…Smax | Unité. Smax = plus grand nombre de séries actives. Série inexistante = « — », jamais 0 (CE-CIR-03 L1926). Réserve non affichée.
- **AC3** : répétitions en nombre + « rép. » ; durée en `min:ss` ; À l'échec = ✓ et « À l'échec » dans la colonne Unité. Cas mixtes et séries identiques ou variables couverts. Indicateur de changement de côté sans doublement des valeurs.
- **AC4** : colonnes Exercice et Unité fixes ; défilement horizontal des colonnes S ; défilement vertical des lignes au-delà de la hauteur disponible.
- **AC5** : lecture seule stricte. La fermeture (X, glisser, voile) laisse le brouillon identique, vérifié par test d'égalité.
- **AC6** : lecture accessible ligne par ligne (exercice, série, valeur, unité).

## Epic 4 — Récupérations et Points d'arrêt (D)

### Story 4.1 — Mode placement et sous-brouillon

- **AC1** : l'action « Ajouter un arrêt » entre en placement (`8328:29270`) : contenu atténué, trait de démarcation masqué (D-303), emplacements proposés.
- **AC2** : les emplacements sont ceux de la règle, ni plus ni moins :
  - récupération après chaque occurrence, dernière comprise, jamais avant le premier Exercice ;
  - point d'arrêt avant ou après le Circuit et entre ses Exercices, jamais juste après le compte à rebours ni juste avant la Fin ;
  - un élément de chaque type par emplacement.
  
  Un emplacement qui porte déjà une récupération l'affiche comme existante.
- **AC3** : sélection multiple. Toucher Point d'arrêt bascule l'ajout. Toucher Récupération ouvre la roulette au défaut du Profil (30 s), qui confirme ou annule cet emplacement seulement.
- **AC4** : la barre affiche « Confirmer N pauses ajoutées » (récupération + point = 2 ; une désélection retranche ; à N = 0, rien à confirmer) et « Annuler ». Confirmer applique atomiquement (AD-43) ; Annuler restitue l'état d'entrée. Aucune persistance avant « Continuer ».

### Story 4.2 — Durée, modification et retrait

- **AC1** : roulette « Durée de récupération » (`8328:28733`), plage 0..300 s, grille 1 / 5 / 30 s (E12). 0 est conservé comme présent (D-323). Elle est construite sur `DurationWheelPicker`.
- **AC2** : toucher une récupération positive ouvre son réglage. Un appui long sur une récupération ou un point affiche « Retirer » (`8328:29133`, `8328:33689`). Retirer rétablit la Pause terminale (RM-038).
- **AC3** : alternatives accessibles à l'appui long.

### Story 4.3 — Pauses dans le déroulement et la Composition

- **AC1** : une récupération suit son occurrence lors d'un déplacement, d'une duplication ou d'une suppression (RM-210). Les points d'arrêt suivent ARB-3.
- **AC2** : dans le Circuit, récupérations et points sont répétés à chaque Tour ou passage. L'ordre est Exercice → R positive → Point d'arrêt (RM-219). Durées recalculées en direct (story 1.3).
- **AC3** : avertissement D-301 informatif quand deux Exercices s'enchaînent sans Pause terminale ni R positive, sans mutation ni blocage.

## Ordre recommandé et dépendances

```
Étape 0 (réconciliation) ─┐
Epic 1 : 1.1 → 1.2 ┐       │
             1.1 → 1.3 → 1.4
Epic 2 : 2.1 (après 1.1) ; 2.2 (après 1.3) ; 2.3 (après 1.4)   → Jalon J1
Epic 3 : 3.1 (après 1.4) → 3.2 → 3.3 ; 3.4 (après 1.4, parallèle) → Jalon J2
Epic 4 : 4.1 (après 1.2, 2.1) → 4.2 → 4.3                       → Jalon J3
```

Chemin critique : 1.1 → 1.3 → 1.4 → 3.1 → 3.2. Les stories 2.1, 1.2 et 3.4 peuvent avancer en parallèle.

## Recette iPhone (jalons)

Recette sur iPhone réel, build de développement, largeurs 375 et 402, VoiceOver. Jest ne remplace pas la recette (P-6).

| Jalon | Après | Points |
|---|---|---|
| J0 | 1.1 | Base réelle v10 migrée en v11 : séances, durées et paramètres PRE-5 identiques. Aucune récupération « 0 s » visible (E5). |
| J1 | Epic 2 | En-tête, Étiquette, bornes, Continuer et ses désactivations ; cartes (classification, volumes, côté) ; ajout, copie, duplication, suppression, glisser avant / dans / après ; Feuille PRE-5 ouverte depuis la Composition sans perte. |
| J2 | Epic 3 | Compteur révélé, nature, conversions avec et sans perte, 4 → 3 → 4, enregistrement à 3 puis augmentation, N hérité dans la Feuille, volumes Séries et Tours (« — », À l'échec, mixte, côtés, défilements), fermeture sans modification. |
| J3 | Epic 4 | Placement multiple, roulette, Confirmer N et Annuler, retrait, conservation au déplacement et à la duplication, répétition interne, durées, D-301. Parcours complet jusqu'à Continuer et réouverture. |

## Risques étayés

| # | Risque | Preuve | Parade |
|---|---|---|---|
| R1 | Régression dans un écran de 2944 lignes (3378 lignes de tests) | `CompositionScreen.tsx` | AD-41 : composants séparés. La suite existante sert de filet. |
| R2 | Effacement des points d'arrêt à la mise à jour | `SqliteSessionRepository.ts:503-510` | Story 1.2 AC3, avant toute interface. |
| R3 | Récupération « 0 s » affichée partout aujourd'hui | `compositionPresentation.ts:360`, CS L1885 | Story 2.1 AC4. |
| R4 | Duplication de la logique de séries entre la Feuille et le Circuit | `setSeriesCount` interne au brouillon de Feuille | AD-39 : extraction pure, tests existants. |
| R5 | Évolution de la Feuille PRE-5 après fusion (recettes en attente) | `sprint-status.yaml` PRE-5 | Étape 0, point 3 ; story 3.3 limitée à `inheritedSeriesCount`. |
| R6 | Migration sur données réelles | Migration 011, `DATABASE_VERSION` = 10 | ADD COLUMN seulement ; jalon J0. |
| R7 | Densité de l'en-tête du Circuit à 375 et avec Dynamic Type | Conteneur 354 × 34 ; précédents PRE-5 (deferred-work, segmentés) | Story 3.1 AC4, vérification sur appareil. |
| R8 | Glisser-déposer maison étendu aux bornes du Circuit et au bloc avec récupération | `compositionGesture.ts` | Story 2.3 ; J1 sur appareil. |
| R9 | `CLAUDE.md` du clone de révision OpenSpec présent à la racine de `main` (commit `f7ff4200`), alors qu'il indique « Ne pas fusionner tel quel dans `main` » | `CLAUDE.md` l. 3 | Hors PRE-6, à signaler à Hermann. Ses interdits (aucun code applicatif) bloqueraient le développement PRE-6 s'ils étaient appliqués tels quels. |

## Arbitrages indispensables (à trancher par Hermann)

**ARB-1 — Affichage d'une récupération positive dans la Composition.**

Les deux camps :

- ch10 L602 (« D-208 révisée sur l'affichage ») : « Les cartes ne présentent plus la ligne `Récupération {durée}`, y compris pour une valeur non nulle. »
- En sens contraire :
  - CE-T03-08 L1494 : « Tap sur récupération positive ouvre son réglage » ;
  - ch13 L1680 : « l'occurrence et sa ligne `Récupération {durée}` constituent un seul bloc » ;
  - D-303 (aucune information seulement si elle est absente ou à 0) ;
  - Figma `8328:28605` et `8328:28863`.

Aucune des sources ne remplace explicitement l'autre.

Proposition : **la récupération positive s'affiche sur la ligne structurelle sous la carte, pas dans le corps de la carte** (D-238). Ch10 L602 serait reformulée dans un lot documentaire.

**ARB-2 — Indicateur de côté de la Composition (report AC6 de PRE-5).**

Le rendu sans direction est exigé (FR-18 PRE-5, D-407), mais aucune frame Figma n'en montre (`5544:6944`, `8328:28605` : « D→G »).

À décider : le contenu visible et le nom accessible, ou une variante Figma à produire. Sans décision, la story 2.2 garde le rendu actuel et le report reste ouvert.

**ARB-3 — Point d'arrêt et occurrence voisine.**

Ce qui est établi :

- un point d'arrêt « conserve une position structurelle » (ch09 L682) et ne suit pas la carte (`8328:33546` : seul le bloc carte + récupération est soulevé) ;
- une suppression ou un déplacement peut toutefois le rendre interdit (juste après le compte à rebours, juste avant la Fin) ou le laisser sans occurrence dans le Circuit.

Aucune source ne règle ce cas. Proposition :

- le point reste à son emplacement ;
- un dépôt qui le rendrait interdit est un dépôt invalide, la position est restituée (règle existante, CE-T03-08 L1502) ;
- une suppression qui le rendrait interdit le retire avec l'occurrence ;
- la copie d'une duplication s'insère après la source et avant son point d'arrêt.

### Points non bloquants (défaut appliqué, vérifié en recette)

- **Titre de l'en-tête.** « Circuit » + œil sur la ligne du titre (CIR-10, DSF-CIRCUITS L18, Figma) plutôt que « Nombre de tours » (ch12 L955 et L1250, ch13 L1553, antérieurs au 12/10). Lot documentaire de mise à jour.
- **Alignement de l'unité en grille mixte.** Non dessiné (ch13 L1888) : rendu selon les invariants de CE-CIR-03, jugé à J2.
- **Mention du N hérité dans la Feuille.** La dette Figma reste ouverte (DSF-CIRCUITS L54) : état indisponible existant, sans astérisque, jugé à J2.
- **Roulette de récupération.** Le X de `8328:28733` vaut Annuler pour cet emplacement (ch08 L467 et ch13 L1494 concordent sur l'effet).

## Raccordements transverses

- **Données** : migration 011 (AD-34, AD-35) ; `session_stop_points` sans changement de schéma (AD-36).
- **API fonctionnelles (ch11)** : API-COM-02, API-COM-09, API-COM-REC-01 à 05, placement L228-251, Circuits L255-267. Elles sont réalisées par les fonctions pures d'AD-39 et AD-43, sans nouveau service.
- **Documentation : lot proposé à Hermann après validation du plan** (aucune modification sans son accord) :
  1. ch09 : nature persistée, borne typée réservée aux formats ;
  2. ch10 L602 selon ARB-1 ;
  3. ch12 L955 et L1250 ; ch13 L1553 (compteur révélé, titre) ;
  4. ch13 L1440 : identifiants Figma périmés → `8328:*` ;
  5. ch11 API-COM-06 (« enregistrées » → brouillon, D-388) et API-COM-REC-02 (plage 0..300) ;
  6. ch10 L540 et L562 (Catégories, palette de 12 couleurs, devenus caducs).
- **Interfaces impactées** : Composition, ExerciseScreen (contexte hérité), Feuille (option existante seulement), `KodjoIcon` (œil), `fr.ts`.
