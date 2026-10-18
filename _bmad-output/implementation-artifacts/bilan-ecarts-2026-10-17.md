# Bilan des écarts PRE-4 — 2026-10-17

Bilan demandé par Hermann avant la story 2.1 et approuvé par lui le 2026-10-17. Les specs des stories 2.1 à 4.6 le reçoivent en contexte : **le développement se concentre sur l'écart restant** de chaque story ; ce qui est déjà conforme est réutilisé, puis vérifié. Aucun critère d'acceptation, aucun test ni aucune revue prévus n'est retiré. Une preuve existante est réutilisée tant qu'elle couvre encore le comportement ; elle est complétée pour tout changement.

Sources : lecture du code et des diffs depuis `c32e360d`, à la date du bilan (HEAD `9cc21b3b` et la story 1.4 non commitée), par trois sous-agents en lecture seule ; constats clés contrôlés par Claude. Les numéros de ligne sont ceux de cette date et peuvent avoir bougé. **Rien n'est vérifié sur appareil.**

## Décisions de Hermann issues du bilan

- **Q33** : lorsque le segment Exercices est actif, `Créer` ouvre directement l'Éditeur ; les autres segments gardent la liste d'options existante (story 4.1, AC1).
- **Q34** : le bouton Lecture reste désactivé ; on vérifie que son appui n'ouvre pas l'Éditeur (story 4.1, AC3).
- *Ajout postérieur, recette iPhone du 2026-10-17 :* **Q36** : une Cible Durée n'est pas obligatoirement un multiple de 5 s (bornes 5..3535, à la seconde). Les mentions du pas de 5 ci-dessous (3.4, 3.6) sont annotées.
- Les simplifications de réalisation ci-dessous sont autorisées. Elles ne changent ni le périmètre ni les comportements attendus.
- La recette sur iPhone est regroupée en quatre ensembles : migration et données, durées et phrases, Feuille des paramètres, Éditeur. L'essai préalable des primitives natives (story 3.1) se fait au moment où il devient nécessaire.

## Écart restant par story

### Epic 2

- **2.1 (adaptation, forte).** Le registre `buildExecutionLedger`, la Récupération et l'inversion sont conformes : ne pas les réécrire. Le travail porte sur `summarize` et `ExerciseDurationKind` (`executionCalculations.ts:35`).
  - Ajouter `lowerBound` quand au moins un travail est connu et un autre inconnu, et `incomplete` pour une Cible `UNSET`.
  - Ajouter l'indicateur d'entrée « N hérité ».
  - Ajouter les tests manquants des AC4, AC7 et AC8.
  - Adapter les consommateurs qui testent `"omitted"` : `ActivityCard.catalogueDuration`, la ligne de total de `ExecutionParametersSheet`, `executionPhrase.ts`, ainsi que `calculations.ts:64,168` et `aggregateSessionDuration` dans `src/domain/sessions/calculations.ts`.
- **2.2 (vérification et petite adaptation, moyenne).**
  - Déplacer `formatPhraseDuration` vers un formateur commun (`durationFormat.ts`), sur lequel `formatCompactDuration` converge.
  - Faire passer par le lexique les symboles `≈`/`≥` aujourd'hui codés en dur.
  - Ajouter les tests des attendus.
  - P31 (durée d'exécution, Compte à rebours et Fin compris) : vérifier s'il existe déjà une fonction ; sinon, petit ajout dans le domaine.
  - Ne réécrire ni l'agrégation, ni `formatEstimatedDuration` (P41).
- **2.3 (ajout ciblé, forte).** Garder le générateur et `SegmentBuilder`. Les branches suivantes manquent :
  - la branche « mélange » (énumération ≤ 3, compaction > 3) ;
  - la cadence des mélanges ;
  - `≥` dans le segment gras ;
  - le répertoire des variantes du corpus ;
  - le test de l'oracle (P43) et l'adaptation explicite des anciennes entrées.
- **2.4 (surtout conforme, moyenne).** Les résumés « séries à l'échec » et « Paramètres à compléter » sont déjà faits.
  - Restent `≥` sans arrondi sur la carte Catalogue et dans le résumé de Composition (quelques lignes, aucune refonte), les symboles par le lexique et les tests « jamais 0 s ni 0 rép. ».
  - Ne toucher ni `SessionCard`, ni `CompositionScreen.tsx`.

### Epic 3

À ne pas remplacer :
- la `Modal` de la Feuille et son animation ;
- `DurationWheelPicker` et `NumberWheelPicker` natifs, avec leurs garde-fous zéro `ScrollView` ;
- `InlineStepper` et les politiques de maintien `EXECUTION_*` ;
- `DraggableRow` et les actions monter / descendre ;
- `DisclosureControl` ;
- le message d'ajustement avec `Annuler` ;
- `SegmentedControl`, qui devient le repli Android et web.

Par story :
- **3.1 (ajout d'un essai, forte).** Un popover sur la ligne Mode, et un autre qui enveloppe la roulette existante. Aucune modification des roulettes.
- **3.2 (surtout vérification, moyenne).**
  - Ajouts réels : le retrait de Série avec `pendingRemoval` et son annulation (AC10), et la ligne de base alignée par identité (AC12).
  - Le reste se prouve par des tests aux attendus littéraux.
- **3.3 (adaptation importante, forte).**
  - Remplacer l'interrupteur « Séries variables » par le champ Régime et son popover.
  - Remplacer les segmentés par des popovers.
  - Ajouter l'état `openSurface`.
  - Passer aux ± affichés à l'appui, en **enveloppant `InlineStepper`** dans un état ouvert ou fermé (modèle `ProfileStepper`).
  - Afficher `—` pour un côté sans changement.
  - Câbler le repli Android.
- **3.4 (adaptation par extension, forte).** Étendre `DurationWheelPicker` par des props (pas, bornes, `failureOption`, `validateDisabled`), sans toucher `WHEEL_SECONDS_STEP`. Ajouter au domaine `nearestGridValue` et la position d'ouverture. *Q36 (2026-10-17) : la roulette de Cible garde ses secondes au pas de 1, et `nearestGridValue` se réduit à un bornage à 5..3535.*
- **3.5 (adaptation, moyenne).** Brancher `NumberWheelPicker` dans la Feuille à la place du stepper de Cible. Passer la borne 100 par une prop, sans toucher `WHEEL_NUMBER_MAX`. Ajouter la ligne « échec ».
- **3.6 (adaptation et ajout, forte).**
  - Retirer les steppers permanents des cellules.
  - Ajouter la Cellule active, le Pied commun et `stepTarget`.
  - Ajouter la croix de retrait et « Série supprimée — Annuler », en réutilisant le message existant.
  - ~~Ajouter le pas de 5 au maintien.~~ *Levé par Q36 (2026-10-17) : la Cible Durée garde le pas de base 1 et la politique existante `EXECUTION_ACCELERATED_HOLD_POLICY` (paliers 5 puis 10).*
- **3.7 (adaptation, moyenne).** Afficher `≥` pour un mélange au lieu de masquer la ligne, et masquer la ligne pour une Cible `UNSET`. Restent le popover et les annonces. L'inversion est déjà conforme.
- **3.8 (vérification et compléments, moyenne).** Annonces des nouveaux contrôles, retour du focus, table FR-03-13, section de recette.

### Epic 4

Les quatre parcours existent déjà dans un Éditeur unique (`ExerciseScreen.tsx:202-210`). Les référentiels, avec 96 tests, et la gestion des Médias sont conformes pour l'essentiel. **Ne pas les reconstruire.**

- **4.1 (surtout vérification, moyenne).** Branche directe de `Créer` sur le segment Exercices (Q33). Vérifier que Lecture reste désactivé et n'ouvre pas l'Éditeur (Q34). Ajouter les tests de relecture par parcours et l'absence des mots « Circuit » et « Tour ». Ne toucher ni à l'aiguillage ni à Composition.
- **4.2 (adaptations ciblées, moyenne).**
  - Établir le relevé visuel.
  - Placer la Description avant la Carte.
  - Remplacer le chevron par ✕, au moyen d'une prop locale, car `FixedHeader` est partagé.
  - Passer la marge à 16 en dessous de 390.
  - Ajouter l'invite de la Carte vide (H22).
  - Ajouter la modale d'abandon en création.
  - Retirer le bouton de Mode (Q23).
  - **Conserver** le halo, le dégradé et la gestion du clavier, acceptés en recette PRE-3 (N-05, T-49) ; ne corriger que les écarts relevés.
- **4.3 (surtout conforme, faible).**
  - Constater d'abord.
  - Ajouter les libellés « Catégorie » et « Zone corporelle » sur un accès vide.
  - Ajouter les icônes pleine et contour, des actifs à exporter de Figma (lecture seule).
  - Créer deux messages de suppression distincts.
  - Garder les feuilles et `ReferenceValueDialog`.
- **4.4 (vérification et un ajout, moyenne).** L'ajout est la vignette du premier Média sur la carte Catalogue (`ActivityCard.tsx:106`). Ajouter les tests dans les quatre parcours. Ne toucher ni `MediaTile`, ni `useMediaImport`, ni le menu.
- **4.5 (ajout, forte).** Lecteur vidéo natif, photo en plein écran, état d'erreur. Toucher consulte, appui long ouvre le menu (Q31), à essayer sur iPhone avant de coder. Le menu et ses actions accessibles restent identiques.
- **4.6 (vérification et documentation, moyenne).** L'ajout est l'action accessible équivalente à l'appui long dans les référentiels (AC8). Restent le tableau de conformité, les tests de largeur et VoiceOver, et R-01 à R-52 dans `recette-iphone.md`.

## Simplifications de réalisation (autorisées, sans changement fonctionnel)

1. Étendre les roulettes existantes par des props ; aucun nouveau sélecteur.
2. Envelopper `InlineStepper` dans un état ouvert ou fermé, sur le modèle de `ProfileStepper`.
3. Story 2.1 : ne modifier que `summarize` et l'union des natures ; garder le registre.
4. Story 2.2 : déplacer le formateur existant plutôt que d'en écrire un nouveau.
5. Stories 4.2 et 4.3 : ne corriger que les écarts constatés au relevé.
6. Story principalement conforme : terminer par les vérifications et des corrections ciblées.
7. Regrouper la recette en quatre ensembles (voir plus haut).
8. Recaler les références de lignes de l'architecture décalées par la story 1.1 : AD-7 (`Modal`, aujourd'hui vers la ligne 399) et AD-8 (message d'ajustement, aujourd'hui vers les lignes 795-824).
